# Dumps the server-side truth about a playtest game, so a report can be checked
# against what the game actually recorded rather than against itself.
#
# A playtest report is written by an agent and proves nothing on its own. This
# reads the persisted player_state: if the report claims the player reached the
# server room and this says one unlocked room and the starting inventory, the
# report is fiction. Run it after every playtest and paste the output into the
# report.
#
#   BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb [--tasks] [--log SESSION.jsonl] <game_id>
#   BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id> --access
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
# With it, a `habits` block (slice 9.1, ACCESS_MODEL_SLICE_9_1_PLAN.md step 6) of values only,
# read from the game's saved scenario: one line per NPC with a habits object (its habits and
# its screenHabit as saved) and one per owned workstation (its owner, its own lockChance or
# locksScreenOnLeave, whether the server's claim check calls it "always locks", and whether
# it shows a sticky note), and one per gate door with a noHold (step 5: the door, its openFor
# and its noHold as saved). It does not say which values a habit filled: the validator's
# habits report does. It names who never locks, so it is not for a tester playing blind.
# No passwords.
require 'json'
require_relative '../../lib/break_escape/access_identities'

count_tasks_flag = !ARGV.delete('--tasks').nil?
access_only = !ARGV.delete('--access').nil?
log_path = nil
if (i = ARGV.index('--log'))
  ARGV.delete_at(i)
  log_path = ARGV.delete_at(i) or abort 'usage: --log needs a session log path'
end
game_id = ARGV[0] or abort 'usage: verify-run.rb [--tasks] [--log SESSION.jsonl] [--access] <game_id>'
g = BreakEscape::Game.find(game_id)
ps = g.player_state || {}

ACCESS_KEYS = %w[sessions signedInPcs serverClones copiedItems loginFailures loginLockouts footholds
                 gainedFootholds].freeze

# The access model keys, one line each. Sign-in details are never in player_state, so
# nothing here is secret: NPC ids, PC ids, card ids, item ids and typed usernames.
def access_section(ps)
  hash = ->(v) { v.is_a?(Hash) ? v : {} }
  list = ->(v) { v.is_a?(Array) ? v : [] }
  sessions = hash.call(ps['sessions']).map do |pc, s|
    s = {} unless s.is_a?(Hash)
    remote = s['foothold'].is_a?(String) && !s['foothold'].empty? ? ", remote, foothold #{s['foothold']}" : ''
    "#{pc} = #{s['id'] || '?'} (#{s['via'] || '?'}#{remote})"
  end
  footholds = hash.call(ps['footholds']).sort_by { |_, f| f.is_a?(Hash) ? f['seq'].to_i : 0 }.map do |id, f|
    f = {} unless f.is_a?(Hash)
    device = f['device'].is_a?(Hash) ? (f['device']['id'] || f['device']['type'] || '?') : '?'
    "#{id} = #{f['via'] || '?'} #{f['source'] || '?'}, device #{device} (network #{f['network'] || '?'})"
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
    ['gainedFootholds', list.call(ps['gainedFootholds']).map(&:to_s)]
  ]
  lines = ['access model']
  rows.each do |name, items|
    lines << "  #{name.ljust(15)} #{items.length}#{items.empty? ? '' : ": #{items.join('; ')}"}"
  end
  lines
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
    values = npc['habits'].reject { |k, _| k == '_comment' }.map { |k, v| "#{k}=#{v}" }.join(' ')
    habit = npc.key?('screenHabit') ? JSON.generate(npc['screenHabit']) : '-'
    lines << "  npc #{npc['id'].to_s.ljust(14)} #{values}  screenHabit #{habit}"
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

if access_only
  puts "game            #{g.id}  (mission #{g.mission_id})"
  puts access_section(ps)
  puts habits_section(g)
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
puts "flags submitted #{flags.length}: #{flags.join(', ')}"
puts "globals set     #{globals.length}: #{globals.keys.sort.join(', ')}"
if ACCESS_KEYS.any? { |k| ps[k].respond_to?(:empty?) && !ps[k].empty? }
  puts access_section(ps)
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
