# Dumps the server-side truth about a playtest game, so a report can be checked
# against what the game actually recorded rather than against itself.
#
# A playtest report is written by an agent and proves nothing on its own. This
# reads the persisted player_state: if the report claims the player reached the
# server room and this says one unlocked room and the starting inventory, the
# report is fiction. Run it after every playtest and paste the output into the
# report.
#
#   BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb [--tasks] [--show-flags] [--log SESSION.jsonl] <game_id>
#   BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id> --access
#
# Submitted flag values are redacted by default (a length and a short hash, so two
# runs can still be compared without the value appearing in a report). Pass
# --show-flags to print them in full, for a run you are debugging yourself.
#
# With --log (the session log), flags are split by where their value came from:
# a <vmflag:REF> token has source "vm-step" (the value was produced by a solve
# step on the game's VM, so the flag was earned in game), while --flags and
# test:flag aliases are handed over and stay earnedInGame: false. The earned
# count is checked against the flags the server recorded as submitted: a log
# claiming more earned flags than the game holds fails the run.
#
# Exit status is 1 when the game shows no progress at all, so a fabricated run
# fails rather than merely looking odd.
#
# The objectivesState tasks are always listed (status and completion time), with
# tasks_completed and the score. Completed tasks count toward the verdict only
# when the scenario has a top-level `social` key or --tasks is passed. Other
# missions keep the old verdict: their opening briefings complete tasks by
# themselves, so a completed task is not evidence of play there. The record
# holds only a status, so "completed once" is proved by tasks_completed and the
# score; tools/playtest/count-task-posts.sh checks the request log.
#
# The access model section (docs/achitechture/ACCESS_MODEL_PLAN.md, step 6) prints what
# the sign-in, card copy and file routes recorded: sessions, signedInPcs, serverClones,
# copiedItems, loginFailures (a count per PC and username) and loginLockouts, and for
# networks (ACCESS_MODEL_SLICE_9_3_PLAN.md, step 6) footholds, gainedFootholds, and remote
# and foothold beside each session. The routes write these keys themselves, so no sync is
# needed first. --access prints only that
# section, for the check after each beat of a scripted run, and always exits 0.
#
# --ops-log prints only the ops log (OPS_LOG_ROWS_PLAN.md 5.1, stage L1a): the clock key, the counters,
# and per source the stored rows (seq, event, as, where, result, n, detail, elapsedMs). It runs the
# secret matcher the helper uses over every stored row, checks the 400-byte row, 300-row and 128 KB
# ceilings and that seq ascends, and exits 1 on any failure. A hit is reported by key path, never value.
#
# S8a (feature A22, multi-factor sign-in): the access section adds three rows when the saved scenario has a policy that asks
# for a second step, or the game holds any of the three server-owned keys. `mfaAccounts` is one entry per account: `started`
# (second steps begun), `wrong` (wrong codes counted), `used` (yes when a code has been taken), `closed` (yes while its code
# step is closed for five minutes). `mfaPrompts` is the prompt count per owner. `mfaPending` is one entry per sign-in PC:
# `pending <kind>` or `pending none`. Words, counts and ids only: never a code, a number or a nonce.
#
# With it, a `habits` block (slice 9.1, ACCESS_MODEL_SLICE_9_1_PLAN.md step 6) of values only,
# read from the game's saved scenario: one line per NPC with a habits object (its habits and
# its habits.screen as saved) and one per owned workstation (its owner, its own lockChance or
# locksScreenOnLeave, whether the server's claim check calls it "always locks", and whether
# it shows a sticky note), and one per gate door with a noHold (step 5: the door, its openFor
# and its noHold as saved). It does not say which values a habit filled: the validator's
# habits report does. It names who never locks, so it is not for a tester playing blind.
# No passwords. With --access and --log, a block of the workaround events (npc_workaround
# phases, npc_mutter topics, door_propped) found in the session log's drained event logs.
require 'json'
require_relative '../../lib/break_escape/access_identities'
require_relative '../../lib/break_escape/mfa_model' unless defined?(BreakEscape::MfaModel)
require_relative 'lib/flag_redaction'
require_relative 'lib/helpdesk_leak_rules'

count_tasks_flag = !ARGV.delete('--tasks').nil?
show_flags = !ARGV.delete('--show-flags').nil?
access_only = !ARGV.delete('--access').nil?
ops_log_only = !ARGV.delete('--ops-log').nil?
log_path = nil
if (i = ARGV.index('--log'))
  ARGV.delete_at(i)
  log_path = ARGV.delete_at(i) or abort 'usage: --log needs a session log path'
end
game_id = ARGV[0] or abort 'usage: verify-run.rb [--tasks] [--show-flags] [--log SESSION.jsonl] [--access] [--ops-log] <game_id>'
g = BreakEscape::Game.find(game_id)
ps = g.player_state || {}

ACCESS_KEYS = %w[sessions signedInPcs serverClones copiedItems loginFailures loginLockouts footholds
                 gainedFootholds npcFrustration guestSessions sharedLogins feedRevealed opsDiscovered opsFindings opsUsed
                 crackedAccounts crackStarted crackRuns].freeze

# A finding id as printed on the opsFindings and opsUsed lines and a session's `granted by`: author-chosen
# words, dots and underscores, nothing longer than the log's foothold ids allow; anything else is left out.
OPS_ID = /\A[A-Za-z0-9_.\-]{1,120}\z/.freeze

# S5a (privilege plan): the level the server works out NOW for a session, from the game's own `session_access`: `admin`,
# `user`, or `none` (locked, expired, route down, PC off, account gone, or no game to ask), or `error` when asking raised (never the same word as a
# locked session). A word only, never stored.
def computed_level(game, pc_id)
  level = game.respond_to?(:session_access) ? game.session_access(pc_id) : nil
  %w[admin user].include?(level) ? level : 'none'
rescue StandardError
  'error'
end

# S7 (hash records and the cracker): one item per hash record as `<record id> <status word>` (ready, running Ns,
# infeasible, cracked, or `not listed` when the record's proof does not hold or its grade does not resolve), then one
# `cracked <account id>` per account in the server's crackedAccounts. Ids and words only: never a token, a password or
# a recipe. nil when the scenario has no hash record and the game has no cracking state.
def crack_items(ps, game)
  records = begin
    BreakEscape::CredentialModel.registry(game.scenario_data).select { |_, e| e['kind'] == 'hash' }.keys
  rescue StandardError
    []
  end
  cracked = ps['crackedAccounts'].is_a?(Array) ? ps['crackedAccounts'].select { |a| a.is_a?(String) && a.match?(OPS_ID) } : []
  return nil if records.empty? && cracked.empty? && !(ps['crackStarted'].is_a?(Hash) && !ps['crackStarted'].empty?)

  rows = begin
    game.keyring_for_client[:entries].select { |e| e.is_a?(Hash) && e['kind'] == 'hash' }.to_h { |e| [e['id'], e] }
  rescue StandardError
    {}
  end
  items = records.select { |id| id.match?(OPS_ID) }.map do |id|
    row = rows[id]
    word = row ? row['status'].to_s : 'not listed'
    wait = row && row['status'] == 'running' && row['readyInSeconds'].is_a?(Integer) ? " #{row['readyInSeconds']}s" : ''
    "#{id} #{word.match?(/\A[a-z ]{1,16}\z/) ? word : '?'}#{wait}"
  end
  items + cracked.map { |a| "cracked #{a}" }
end

# The access model keys, one line each. Sign-in details are never in player_state, so
# nothing here is secret: NPC ids, PC ids, card ids, item ids and typed usernames.
def access_section(ps, game = nil)
  hash = ->(v) { v.is_a?(Hash) ? v : {} }
  list = ->(v) { v.is_a?(Array) ? v : [] }
  sessions = hash.call(ps['sessions']).map do |pc, s|
    s = {} unless s.is_a?(Hash)
    remote = s['foothold'].is_a?(String) && !s['foothold'].empty? ? ", remote, foothold #{s['foothold']}" : ''
    # Ops core S3 (plan 11.4): a technique session's level and the finding that granted it (ids and words only)
    level = %w[user admin].include?(s['access']) ? ", access #{s['access']}" : ''
    granted = s['technique'].is_a?(String) && s['technique'].match?(OPS_ID) ? ", granted by #{s['technique']}" : ''
    "#{pc} = #{s['id'] || '?'} (#{s['via'] || '?'}#{remote}#{level}#{granted}), level #{computed_level(game, pc)}"
  end
  footholds = hash.call(ps['footholds']).sort_by { |_, f| f.is_a?(Hash) ? f['seq'].to_i : 0 }.map do |id, f|
    f = {} unless f.is_a?(Hash)
    # A Wi-Fi or implant foothold (slice 9.3b) carries a name, not a device (5.3)
    if %w[wifi implant].include?(f['via'])
      "#{id} = #{f['via']} #{f['source'] || '?'}, #{f['name'] || '?'} (network #{f['network'] || '?'})"
    else
      device = f['device'].is_a?(Hash) ? (f['device']['id'] || f['device']['type'] || '?') : '?'
      "#{id} = #{f['via'] || '?'} #{f['source'] || '?'}, device #{device} (network #{f['network'] || '?'})"
    end
  end
  clones = hash.call(ps['serverClones']).map do |card_id, rec|
    rec = {} unless rec.is_a?(Hash)
    src = rec['source'].is_a?(Hash) ? rec['source'].map { |k, v| "#{k} #{v}" }.join(', ') : '?'
    "#{card_id} from #{src}#{rec['uidOnly'] ? ' (UID-only)' : ''}"
  end
  failures = hash.call(ps['loginFailures']).sort_by { |_, v| v.is_a?(Hash) ? v['seq'].to_i : 0 }.map do |key, v|
    "#{key} #{v.is_a?(Hash) ? v['n'].to_i : v}"
  end
  rows = [
    ['sessions', sessions],
    ['signedInPcs', list.call(ps['signedInPcs']).map(&:to_s)],
    ['serverClones', clones],
    ['copiedItems', list.call(ps['copiedItems']).map(&:to_s)],
    ['loginFailures', failures],
    ['loginLockouts', list.call(ps['loginLockouts']).map(&:to_s)],
    ['footholds', footholds],
    ['gainedFootholds', list.call(ps['gainedFootholds']).map(&:to_s)],
    # Ops core S1 (OPS_CORE_PLAN.md 11.4): what the player has swept and scanned, each list in id order
    # (networks, then hosts, then checked services as `<host>.<service>`); ids only.
    ['opsDiscovered', %w[networks hosts services].filter_map do |key|
      ids = list.call(hash.call(ps['opsDiscovered'])[key]).select { |id| id.is_a?(String) }.sort
      "#{key} #{ids.join(' ')}" unless ids.empty?
    end],
    # Ops core S2 (OPS_CORE_PLAN.md 11.4): the findings the player holds, in alias order, each as
    # `<alias> <finding id> <status word>`; a stored value that is not `<u|c|f><n>` is left out. Ids and
    # words only.
    ['opsFindings', hash.call(ps['opsFindings']).filter_map do |id, value|
      match = /\A([ucf])([0-9]{1,4})\z/.match(value.to_s)
      next unless match

      [match[2].to_i, "f#{match[2].to_i} #{id} #{{ 'u' => 'unconfirmed', 'c' => 'confirmed', 'f' => 'false' }[match[1]]}"]
    end.sort.map(&:last)],
    # Ops core S3 (plan 11.4): the findings a technique card was used on, each as `<alias> <finding id>` (the
    # alias from opsFindings, or the bare id when none is held), in alias order; ids only, bad values left out.
    ['opsUsed', list.call(ps['opsUsed']).select { |id| id.is_a?(String) && id.match?(OPS_ID) }.uniq.map do |id|
      held = hash.call(ps['opsFindings'])[id].to_s
      number = /\A[ucf]([0-9]{1,4})\z/.match(held)&.[](1)
      [number ? number.to_i : Float::INFINITY, id, number ? "f#{number.to_i} #{id}" : id]
    end.sort_by { |number, id, _| [number.to_f, id] }.map(&:last)],
    # Slice 9.2 (ACCESS_MODEL_SLICE_9_2_PLAN.md 11): level, hand-overs and done workarounds per NPC;
    # sub-slice L adds the PCs a check recorded the NPC locked out at (only when there are any)
    ['npcFrustration', hash.call(ps['npcFrustration']).sort.map do |id, e|
      e = {} unless e.is_a?(Hash)
      locked = list.call(e['lockedOut'])
      "#{id} level #{e['level'] || 0}, handed #{hash.call(e['handed']).size}, done #{list.call(e['done']).inspect}" \
        "#{locked.empty? ? '' : ", locked out at #{locked.join(' ')}"}"
    end],
    # Slice 9.2 H (6.4, 6.5): who last left a borrowed session open at each PC, and the accounts
    # the player heard shared (ids only)
    ['guestSessions', hash.call(ps['guestSessions']).sort.map { |pc, npc| "#{pc} = #{npc}" }],
    ['sharedLogins', list.call(ps['sharedLogins']).map(&:to_s)],
    # Slice 9.2 C (8.3), C2 and C3: how many of each NPC's feed posts are out, and for a `shown`
    # entry the ids in reveal order, each with its seq and, for a reply, its thread post
    # (`<id>:<seq>><thread>`); ids only, never a text. A legacy {n, at} entry prints its count.
    ['feedRevealed', hash.call(ps['feedRevealed']).sort.map do |id, e|
      next "#{id} 0" unless e.is_a?(Hash)
      next "#{id} #{e['n'].to_i}" unless e['shown'].is_a?(Array)

      seqs = hash.call(e['seq'])
      tos = hash.call(e['to'])
      ids = e['shown'].select { |x| x.is_a?(String) }.map do |pid|
        seq = seqs[pid].is_a?(Integer) ? ":#{seqs[pid]}" : ''
        to = tos[pid].is_a?(Hash) && tos[pid]['post'].is_a?(String) ? ">#{tos[pid]['post']}" : ''
        "#{pid}#{seq}#{to}"
      end
      "#{id} #{e['shown'].length} [#{ids.join(' ')}]"
    end]
  ]
  rows.concat(mfa_rows(ps, game))
  rows.concat(HelpdeskLeakRules.verify_rows(ps, game))
  crack = game ? crack_items(ps, game) : nil
  rows << ['crack', crack] if crack
  lines = ['access model']
  rows.each do |name, items|
    lines << "  #{name.ljust(15)} #{items.length}#{items.empty? ? '' : ": #{items.join('; ')}"}"
  end
  lines
end

MFA_STATE_KEYS = %w[mfaAccounts mfaPrompts mfaPending].freeze

# Whether the second-step rows print: the saved scenario asks for a step somewhere, or the game holds a key of the three.
def mfa_shown?(ps, game)
  return true if MFA_STATE_KEYS.any? { |k| ps[k].respond_to?(:empty?) && !ps[k].empty? }

  policies = game.respond_to?(:scenario_data) && game.scenario_data.is_a?(Hash) ? game.scenario_data['policies'] : nil
  policies.is_a?(Hash) && policies.values.any? { |p| BreakEscape::MfaModel.kind(p) != 'none' }
rescue StandardError
  false
end

# S8a: the second-step rows (see the header). Every id is checked against OPS_ID and every count is a whole number, so a
# stored value of another shape prints as a zero or is left out; the stored code windows, nonces and times never print.
def mfa_rows(ps, game)
  return [] unless mfa_shown?(ps, game)

  hash = ->(v) { v.is_a?(Hash) ? v : {} }
  whole = ->(v) { v.is_a?(Integer) && v.positive? ? v : 0 }
  now = game.respond_to?(:mfa_now) ? game.mfa_now : Time.now.to_i
  closed_for = BreakEscape::MfaModel::CODE_CLOSED_SECONDS
  accounts = hash.call(ps['mfaAccounts']).select { |id, _| id.is_a?(String) && id.match?(OPS_ID) }.sort.map do |id, rec|
    rec = hash.call(rec)
    closed = rec['closedAt'].is_a?(Integer) && now - rec['closedAt'] < closed_for
    "#{id} started #{whole.call(rec['started'])}, wrong #{whole.call(rec['wrong'])}, used #{rec['used'].is_a?(Integer) ? 'yes' : 'no'}, " \
      "closed #{closed ? 'yes' : 'no'}"
  end
  prompts = hash.call(ps['mfaPrompts']).select { |id, _| id.is_a?(String) && id.match?(OPS_ID) }.sort.map { |id, n| "#{id} #{whole.call(n)}" }
  pending = hash.call(ps['mfaPending'])
  data = game.respond_to?(:scenario_data) && game.scenario_data.is_a?(Hash) ? game.scenario_data : {}
  pcs = BreakEscape::AccessIdentities.room_objects(data).map { |e| e[:object] }.select { |o| BreakEscape::AccessIdentities.login_pc?(o) }
                                      .map { |o| o['id'].to_s }
  pcs |= pending.keys.select { |k| k.is_a?(String) }
  pcs = pcs.select { |id| id.match?(OPS_ID) }.sort
  waiting = pcs.map do |pc|
    kind = hash.call(pending[pc])['kind']
    "#{pc} pending #{%w[push push_number_match code].include?(kind) ? kind : 'none'}"
  end
  [['mfaAccounts', accounts], ['mfaPrompts', prompts], ['mfaPending', waiting]]
end

# Every gate door with a noHold in the saved scenario: [path, gate].
def no_hold_gates(data)
  rooms = data['rooms'].is_a?(Hash) ? data['rooms'] : {}
  rooms.flat_map do |room_id, room|
    doors = room.is_a?(Hash) && room['doors'].is_a?(Array) ? room['doors'] : []
    doors.each_with_index.filter_map do |door, i|
      gate = door.is_a?(Hash) ? door['gate'] : nil
      ["rooms/#{room_id}/doors/#{i} (into #{door['connectedRoom']})", gate] if gate.is_a?(Hash) && gate['noHold'].is_a?(Array)
    end
  end
end

# Habit keys the habits line leaves out: screen/print/usb have their own part, and since S7 the password class, pattern
# and grade are the cracking recipe (a blind tester's report must not carry them).
HABITS_HIDDEN = %w[_comment screen print usb password passwordPattern passwordDifficulty].freeze

# The habits block: values only, [] when no NPC in the saved scenario has a habits object
# and no gate has a noHold.
def habits_section(g)
  data = g.scenario_data
  return [] unless data.is_a?(Hash)

  ai = BreakEscape::AccessIdentities
  npcs = ai.room_npcs(data).map { |e| e[:npc] }.select { |n| n['habits'].is_a?(Hash) }
  gates = no_hold_gates(data)
  return [] if npcs.empty? && gates.empty?

  owners = ai.room_npcs(data).to_h { |e| [e[:npc]['id'], e[:npc]] }
  lines = ['habits']
  npcs.each do |npc|
    values = npc['habits'].reject { |k, _| HABITS_HIDDEN.include?(k) }.map { |k, v| "#{k}=#{v}" }.join(' ')
    screen = npc.dig('habits', 'screen')
    habit = screen.nil? ? '-' : JSON.generate(screen)
    lines << "  npc #{npc['id'].to_s.ljust(14)} #{values}  habits.screen #{habit}"
  end
  ai.room_objects(data).each do |entry|
    pc = entry[:object]
    next unless ai.workstation?(pc)

    owner_id = ai.owner_id(pc, data)
    next unless owner_id

    field = %w[lockChance locksScreenOnLeave].find { |f| pc.key?(f) }
    own = field ? "#{field} #{pc[field]}" : 'no lock field'
    always = g.respond_to?(:pc_always_locks?) ? g.pc_always_locks?(pc, owners[owner_id]) : ai.screen_always_locks?(pc, owners[owner_id])
    postit = ai.login_pc?(pc) && g.respond_to?(:login_postit_for) ? !g.login_postit_for(pc).nil? : false
    lines << "  pc  #{pc['id'].to_s.ljust(14)} owner #{owner_id}  #{own}  alwaysLocks #{always}  hasPostit #{postit}"
  end
  gates.each do |path, gate|
    open_for = (gate['openFor'].is_a?(Array) ? gate['openFor'] : [gate['openFor']]).grep(String)
    no_hold = gate['noHold'].empty? ? '(none, authored)' : gate['noHold'].join(',')
    lines << "  gate #{path}  openFor #{open_for.join(',')}  noHold #{no_hold}"
  end
  lines
end

# Slice 9.2 B: the workaround events the browser emitted, read from the drained event logs in
# the session log (a `drain` reply is logged as an "out" row). One line per NPC: each
# npc_workaround phase in order, and each start line or failure mutter by topic (npc_mutter fires
# whether or not the player was in earshot); then each door_propped room. The server record
# above says what was done; this says what the player could have seen. Topics only, no lines.
# Sub-slice H adds the hot desk's npc_sat_at and npc_borrowed_session (per PC, with met) and
# npc_overheard_login (per NPC).
WORKAROUND_EVENT = /\A(npc_workaround|npc_mutter|door_propped|npc_sat_at|npc_borrowed_session|npc_overheard_login):(.+)\z/.freeze

def each_logged_event(node, &blk)
  case node
  when Array then node.each { |n| each_logged_event(n, &blk) }
  when Hash
    if node['kind'] == 'event' && node['event'].is_a?(String)
      blk.call(node['event'], node['data'].is_a?(Hash) ? node['data'] : {})
    else
      node.each_value { |v| each_logged_event(v, &blk) }
    end
  end
end

def workaround_log_section(log_path)
  per_npc = Hash.new { |h, k| h[k] = [] }
  propped = []
  File.foreach(log_path) do |line|
    row = begin
      JSON.parse(line)
    rescue JSON::ParserError
      next
    end
    next unless row.is_a?(Hash) && row['dir'] == 'out'

    each_logged_event(row) do |name, data|
      m = WORKAROUND_EVENT.match(name) or next
      case m[1]
      when 'npc_workaround' then per_npc[m[2]] << "#{data['do']}[#{data['index']}] #{data['phase']}"
      when 'npc_mutter' then per_npc[m[2]] << "said #{data['topic']}#{data['line'] ? '' : (data['picture'] ? ' (picture)' : ' (silent)')}"
      when 'door_propped' then propped << "#{m[2]} by #{data['npcId']}"
      when 'npc_sat_at' then per_npc[data['npcId'].to_s] << "sat at #{m[2]}"
      when 'npc_borrowed_session' then per_npc[data['npcId'].to_s] << "left #{m[2]} signed in (met #{data['met']})"
      when 'npc_overheard_login' then per_npc[m[2]] << 'overheard'
      end
    end
  end
  lines = ['workaround events in the log']
  lines << '  none' if per_npc.empty? && propped.empty?
  per_npc.each { |npc, evs| lines << "  #{npc.ljust(14)} #{evs.join(', ')}" }
  lines << "  door_propped   #{propped.join('; ')}" unless propped.empty?
  lines
end

# The ops log (stage L1a). Rows carry no secret by design; this proves it for a real run.
def ops_log_section(game, show_flags = false)
  ps = game.player_state || {}
  log = ps['opsLog'].is_a?(Hash) ? ps['opsLog'] : {}
  op = BreakEscape::OpsLog
  secrets = op.compared_secrets(game)
  problems = []
  lines = ["ops log  clockAt #{ps['opsLogClockAt'].inspect}  seq #{ps['opsLogSeq'].inspect}  " \
           "once #{Array(ps['opsLogOnce']).size}  saves #{ps['opsLogSaves'].is_a?(Hash) ? ps['opsLogSaves'].size : 0}  " \
           "bytes #{log.to_json.bytesize}"]
  total = 0
  sources = game.scenario_data.is_a?(Hash) ? op.sources_for(game.scenario_data).to_h { |id, _s, cap| [id, cap] } : {}
  log.each do |source, rows|
    rows = rows.is_a?(Array) ? rows : []
    total += rows.size
    cap = sources[source]
    lines << "  #{source} (#{rows.size} rows#{cap ? ", cap #{cap}" : ''})"
    problems << "#{source}: not a declared source" if cap.nil?
    problems << "#{source}: #{rows.size} rows over its cap #{cap}" if cap && rows.size > cap
    problems << "#{source}: seq does not ascend" unless rows.map { |r| r['seq'].to_i }.each_cons(2).all? { |a, b| a < b }
    rows.each do |row|
      hit = op.find_secret_hit(secrets, row)
      shown = hit ? { 'as' => '[withheld]', 'where' => '[withheld]', 'detail' => nil } : row
      # as.typed is what the player typed into a username box: it may be a password. Length only,
      # unless --show-flags.
      if !show_flags && shown['as'].is_a?(Hash) && shown['as'].key?('typed')
        shown = shown.merge('as' => { 'typed' => "[#{shown['as']['typed'].to_s.length} chars]", 'cut' => shown['as']['cut'] }.compact)
      end
      lines << "    ##{row['seq']} #{row['event']} as #{shown['as'].to_json} where #{shown['where'].to_json} " \
               "#{row['result']}#{row['n'].to_i > 1 ? " x#{row['n']}" : ''}#{shown['detail'] ? " #{shown['detail'].to_json}" : ''} " \
               "at #{row['elapsedMs']}ms"
      problems << "#{source} ##{row['seq']}: over #{op::MAX_ROW_BYTES} bytes" if row.to_json.bytesize > op::MAX_ROW_BYTES
      problems << "#{source} ##{row['seq']}: a secret appears at #{hit}" if hit
    end
  end
  problems << "#{total} rows over #{op::MAX_TOTAL_ROWS}" if total > op::MAX_TOTAL_ROWS
  problems << "opsLog is over #{op::MAX_OPS_LOG_BYTES} bytes" if log.to_json.bytesize > op::MAX_OPS_LOG_BYTES
  lines << (problems.empty? ? '  ops log OK: no secret, caps and ordering hold' : problems.map { |m| "  FAIL #{m}" })
  [lines.flatten, problems.empty?]
end

if ops_log_only
  puts "game            #{g.id}  (mission #{g.mission_id})"
  out, ok = ops_log_section(g, show_flags)
  puts out
  exit(ok ? 0 : 1)
end

if access_only
  puts "game            #{g.id}  (mission #{g.mission_id})"
  puts access_section(ps, g)
  puts habits_section(g)
  if log_path
    abort "no such log: #{log_path}" unless File.file?(log_path)
    puts workaround_log_section(log_path)
  end
  exit 0
end

inv     = (ps['inventory'] || []).map { |i| i.is_a?(Hash) ? (i['name'] || i['id']) : i }
rooms   = ps['unlockedRooms'] || []
objects = ps['unlockedObjects'] || []
flags   = ps['submitted_flags'] || []
globals = (ps['globalVariables'] || {}).select { |_, v| v == true || v.is_a?(String) }
npcs    = ps['encounteredNPCs'] || []

puts "game            #{g.id}  (mission #{g.mission_id})"
puts "created         #{g.created_at}"
puts "last write      #{g.updated_at}"
puts "played for      #{(g.updated_at - g.created_at).round}s of wall clock"
puts "current room    #{ps['currentRoom'].inspect}"
puts "unlocked rooms  #{rooms.length}: #{rooms.join(', ')}"
puts "unlocked objs   #{objects.length}: #{objects.join(', ')}"
puts "inventory       #{inv.length}: #{inv.join(', ')}"
puts "NPCs met        #{npcs.length}: #{npcs.join(', ')}"
puts "flags submitted #{flags.length}: #{FlagRedaction.list(flags, show: show_flags)}"
puts "globals set     #{globals.length}: #{globals.keys.sort.join(', ')}"
if ACCESS_KEYS.any? { |k| ps[k].respond_to?(:empty?) && !ps[k].empty? } || mfa_shown?(ps, g) || crack_items(ps, g) || HelpdeskLeakRules.shown?(ps, g)
  puts access_section(ps, g)
  puts habits_section(g)
else
  puts 'access model    nothing recorded (no sessions, sign-ins, card copies, copied files, failed sign-ins or footholds)'
end

tasks = (ps.dig('objectivesState', 'tasks') || {})
completed_ids = tasks.select { |_, t| t.is_a?(Hash) && t['status'] == 'completed' }.keys
social = begin
  g.scenario_data.key?('social')
rescue StandardError => e
  puts "scenario        could not read scenario data (#{e.class}); treating as non-social"
  false
end
tasks_count_toward_verdict = social || count_tasks_flag

puts "tasks           #{tasks.length} in objectivesState, #{completed_ids.length} completed"
tasks.each do |id, t|
  t = {} unless t.is_a?(Hash)
  detail = t['completedAt'] ? "  at #{t['completedAt']}" : ''
  detail += "  progress #{t['progress']}" if t['progress']
  puts "  #{id.ljust(34)} #{t['status'].inspect}#{detail}"
end
puts "tasks_completed #{g.tasks_completed.inspect}"
puts "score           #{g.score.inspect}"
puts "social scenario #{social}#{tasks_count_toward_verdict ? ' (completed tasks count toward the verdict)' : ' (completed tasks do not count; pass --tasks to count them)'}"

# Flags by source, from the session log. Refs are counted once each.
vm_step_refs = []
handed_over = 0
if log_path
  abort "no such log: #{log_path}" unless File.file?(log_path)
  require 'json'
  File.foreach(log_path) do |line|
    row = begin
      JSON.parse(line)
    rescue JSON::ParserError
      next
    end
    next unless row.is_a?(Hash) && row['dir'] == 'flag'

    if row['source'] == 'vm-step' && row['earnedInGame'] == true
      vm_step_refs << row['ref'].to_s
    else
      handed_over += 1
    end
  end
  vm_step_refs.uniq!
  puts "flags earned    #{vm_step_refs.length} via VM steps (earned in game): #{vm_step_refs.join(', ')}"
  puts "flags handed    #{handed_over} substitution(s) from --flags or aliases (not earned in game)"
end

# What counts as evidence of play. Rooms and NPCs are seeded at creation for
# some missions, and the opening cutscene sets several globals before the
# player has done anything, so neither is proof. Only these can happen by
# playing: leaving the starting room, opening something, or submitting a flag.
signals = {
  'rooms beyond the first' => rooms.length - 1,
  'objects unlocked' => objects.length,
  'flags submitted' => flags.length
}
signals['tasks completed'] = completed_ids.length if tasks_count_toward_verdict
played = signals.values.sum

puts
if log_path && vm_step_refs.length > flags.length
  puts "VERDICT: LOG CLAIMS MORE THAN THE GAME HOLDS: #{vm_step_refs.length} flags earned via VM steps in the log, #{flags.length} submitted in the game."
  puts 'The log and the server disagree, so the earned-in-game claim is unsupported.'
  exit 1
end
if g.updated_at <= g.created_at + 1
  puts 'VERDICT: NO PROGRESS RECORDED — the game was never written to.'
  puts 'Any report claiming steps against it is unsupported.'
  exit 1
elsif played.zero?
  puts "VERDICT: BOOTSTRAP ONLY — #{signals.map { |k, v| "#{v} #{k}" }.join(', ')}."
  puts 'Nothing here could only have come from playing: the player never left'
  puts 'the starting room, opened anything, or submitted a flag. Globals and'
  puts 'encountered NPCs are set by mission setup and the opening cutscene, so'
  puts 'they are not evidence. A report claiming steps is unsupported.'
  exit 1
end
puts "VERDICT: progress recorded — #{signals.map { |k, v| "#{v} #{k}" }.join(', ')}."
puts "Flags earned in game via VM steps: #{vm_step_refs.length} of #{flags.length} submitted." if log_path
puts 'Cross-check the specifics above against the report.'
