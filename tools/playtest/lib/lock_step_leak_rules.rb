# frozen_string_literal: true

require 'json'
require 'set'
require 'time'
require 'uri'
require_relative '../../../lib/break_escape/lock_step_model' unless defined?(BreakEscape::LockStepModel)

# Ops S8c unit 11 (feature A25): the leak scanner's rules for a second step on any lock. Mixed into
# AccessLeakScanner, which calls `scan_lock_steps` once per recorded answer, and reuses its second-step
# helpers for PCs (mfa_route, mfa_walk, mfa_phone_taken?, mfa_owner_may_approve?, mfa_device_answer_ok?).
#
# Inert unless the scenario has a lock step (R1-L10): then only the state-key rule runs, so a lock-shaped key in an answer
# of a scenario with no `secondStep` is no finding of these rules. State is kept per game id (R1-L9): a gate, a pass and an open
# of one game prove nothing in another, and a 200 POST reset clears the game's proof.
#
# Every rule is structural (judged by key and by which earlier answer earned what, never by matching
# strings) and fails closed: where the proof is missing, ambiguous or malformed, the value is a finding.
# The recorder writes no request body for POST /unlock or POST /mfa/*. A lock-form answer of POST mfa/verify, prompt or approve
# (a pass, a cancel, an expiry, a refusal) names its lock at the root with `targetType` and `targetId` (the server echoes the
# request's own); it is placed to that lock's gate by that echo, and an answer of those routes in lock form with no echo is a
# finding (R1-L4). An open answer (it names nothing) is placed to the ONE passed lock whose authored contents or room it carries;
# two candidates, or none, is a finding. A lock-form answer is judged only by these rules and the hashes placed here are handed to
# the PC rules through @ls_placed, which never credits, closes or flags them (R1-L5).
#
# Rules (the answers' shapes are those of test/fixtures/files/lock_step/answers.json):
#   lock_step_content
#     - `contents` of a gated object, `roomData` of a gated room (found by the lock's id, the route's container or
#       room id, or by the ids of the items or objects they carry), or the answer of GET room/<gated room>, in any
#       answer, unless the lock has the full proof earlier in the capture: a gate answer, a pass answer, then the
#       200 POST unlock answer with `success: true` that carries the contents or room data (which itself is
#       allowed only for that proof);
#     - a 200 POST unlock open that carries a gated lock's contents or room data with no pass before it.
#   lock_step_secret
#     - the keys lockSteps, npcStepGrants, mfaPrompts, mfaAccounts anywhere;
#     - (in a scenario that has a gated lock) `numbers` outside the one entry of a 200 GET mfa/phone answer whose
#       query named exactly npc_id, target_type and target_id for a lock of that owner with an open push gate, with
#       a phone of that owner taken, in the exact entry shape, three different sorted numbers 10..99 holding the
#       gate's number; `number` in a lock-shaped answer or on an mfa route outside the gate answer of a
#       push_number_match lock; a six-digit `code` outside the root of a GET mfa/device answer the PC rules accept.
#   lock_step_answer
#     - a gate answer (POST unlock 200 with `secondStep: true`), a pass answer (any `stepPassed`), or a 4xx answer
#       of POST mfa/verify, prompt or approve, or GET mfa/phone or mfa/device, with a key outside its list, a
#       value that does not match the lock, or no earlier proof (a pass with no single open gate it can close);
#     - a lock-shaped hash (`secondStep: true`, `stepPassed`, `opener`, a `targetId` naming a gated lock) in an answer
#       or on a route no rule above places.
module LockStepLeakRules
  LOCK_STEP_RULE_TEXT = {
    'lock_step_content' => 'the contents of a gated object, or the room data of a gated room, before the gate, pass and open answers of that lock; ' \
                           'an open with no pass before it',
    'lock_step_secret' => 'a lock-step state key (lockSteps, npcStepGrants, mfaPrompts, mfaAccounts), or a number choice list, the right number or ' \
                          'a six-digit code outside the one answer the server gives the holder of the owner\'s phone or device for that lock',
    'lock_step_answer' => 'a lock\'s gate, pass or refusal answer with a key or value outside its shape, a pass with no single open gate, ' \
                          'or lock-step keys in an answer no rule places'
  }.freeze

  LS_STATE_KEYS = %w[lockSteps npcStepGrants mfaPrompts mfaAccounts].freeze
  LS_GATE_KEYS = %w[success secondStep kind targetType targetId npcId].freeze
  LS_MARKER_KEYS = %w[stepPassed opener].freeze
  LS_NUMBER_RANGE = (10..99).freeze
  LS_PHONE_QUERY = %w[npc_id target_id target_type].freeze # sorted
  LS_PHONE_ENTRY_KEYS = %w[n name targetId targetType].freeze
  LS_PUSH_KINDS = %w[push push_number_match].freeze
  LS_ROUTE_KINDS = { 'verify' => %w[code], 'prompt' => %w[push], 'approve' => LS_PUSH_KINDS }.freeze
  LS_APPROVED_BY = { 'prompt' => 'owner', 'approve' => 'player' }.freeze
  # the exact key sets a lock's answers carry, by route and status (answers.json); the value checks follow in ls_refusal_values_ok?
  LS_REFUSAL_SHAPES = {
    'mfa/verify' => [%w[mfaIncorrect success], %w[stale success], %w[expired success], %w[codeLocked retryIn success], %w[message success]],
    'mfa/prompt' => [%w[approved promptsSent success], %w[approved promptsSent success waiting], %w[retryAfterS success tooSoon],
                     %w[expired success], %w[message success]],
    'mfa/approve' => [%w[cancelled success], %w[message success]]
  }.freeze
  LS_ERROR_SHAPE = %w[error success].freeze
  # everything a PC's second step answers with on a refusal (S8a); with a PC step open too, a refusal may use these
  LS_PC_REFUSAL_KEYS = %w[success message mfaIncorrect attemptsLeft stale expired codeLocked retryIn lockedOut tooSoon retryAfterS
                          cancelled approved promptsSent waiting error].freeze

  # the values `waiting` takes on a lock answer (mfa_access.rb: the owner, or the owner's phone held by the player)
  LS_WAITING_VALUES = %w[owner held_phone].freeze

  # ---- what the PC rules ask (public to the scanner, which includes this module) ---------------------------------------

  # True for a hash a lock rule placed in the answer being scanned (a gate, a pass, a phone answer and its entry, an accepted
  # refusal): the PC rules neither judge it as a PC answer nor let it earn or close anything.
  def ls_placed?(hash)
    Array(@ls_placed).any? { |h| h.equal?(hash) }
  end

  # An answer in lock form carries the lock it is for; a PC's never does.
  def ls_lock_form?(hash)
    hash.is_a?(Hash) && (hash.key?('targetType') || hash.key?('targetId'))
  end

  # A row whose body was lost or is not JSON (hooked next to mfa_note_bodyless): a pass, a cancel or an expiry may be in it, so
  # the open gates and the passes of the game are taken back (closing is the safe direction); a 200 reset clears all.
  def ls_note_bodyless(row)
    ls_bind
    @ls_placed = []
    info = mfa_route(row)
    ls_select_game(info)
    ls_note_reset(info)
    return unless @ls_active && info[:method] == 'POST' && info[:path].match?(%r{/games/[^/]+/(unlock|mfa/(verify|prompt|approve))(\.json)?/?\z})

    @ls_gates.clear
    @ls_passed.clear
  end

  private

  # ---- state ----------------------------------------------------------------------------------------------------

  # One scan's state, rebuilt whenever mfa_begin_scan has made a new @mfa_pending (it does so once per scan).
  def ls_bind
    return if @ls_bound.equal?(@mfa_pending)

    @ls_bound = @mfa_pending
    @ls_locks = {}   # "object:<id>" | "door:<room>" => { type:, id:, kind:, owner:, name:, contents_ids:, room_ids: }
    @ls_games = {}   # game id => { gates:, passed:, opened: }
    @ls_placed = []
    ls_select_game(nil)
    BreakEscape::LockStepModel.each_lock_step(@data).each do |entry|
      type = entry[:kind].to_s
      id = entry[:id]
      lockable = entry[:lockable]
      step = entry[:step]
      list = type == 'door' ? lockable['objects'] : ls_children(lockable)
      # R1-L7: ids are authored, and the rules watch content by them; an item without one could not be watched
      raise ArgumentError, "lock step #{type}:#{id || 'with no id'}: a gated lock needs an id" if id.nil?
      raise ArgumentError, "lock step #{type}:#{id}: every entry of its #{type == 'door' ? 'objects' : 'contents'} (and every item inside) needs an id" unless ls_all_ids?(list)

      key = "#{type}:#{id}"
      if (known = @ls_locks[key])
        known[:contents_ids].merge(ls_ids(list)) # R1-L14: a second lock of the same id keeps both lists watched
        known[:room_ids].merge(ls_ids(list)) if type == 'door'
        next
      end
      @ls_locks[key] = { type: type, id: id, kind: step['kind'], owner: step['owner'], name: ls_lock_name(type, id, lockable),
                         contents_ids: ls_ids(list).to_set, room_ids: type == 'door' ? ls_ids(list).to_set : Set.new }
    end
    @ls_active = !@ls_locks.empty?
  end

  # The name the server gives a lock on the phone (lock_step_name): the object's name, a door's sign or name, else the id.
  def ls_lock_name(type, id, lockable)
    names = type == 'door' ? [lockable['door_sign'], lockable['name']] : [lockable['name']]
    names.find { |n| n.is_a?(String) && !n.empty? } || id
  end

  def ls_children(obj)
    [obj['contents'], obj['itemsHeld']].flat_map { |l| l.is_a?(Array) ? l : [] }
  end

  def ls_ids(list)
    Array(list).flat_map do |o|
      o.is_a?(Hash) ? [o['id'], *ls_ids(ls_children(o))].select { |v| v.is_a?(String) && !v.empty? } : []
    end
  end

  def ls_all_ids?(list)
    Array(list).all? do |o|
      o.is_a?(Hash) && o['id'].is_a?(String) && !o['id'].empty? && ls_all_ids?(ls_children(o))
    end
  end

  # Selects the proof of the game the row's path names (a gate in one game proves nothing in another).
  def ls_select_game(info)
    game = info ? info[:path].to_s[%r{/games/([^/]+)/}, 1] : nil
    st = (@ls_games[game] ||= { gates: {}, passed: Set.new, opened: Set.new })
    @ls_gates = st[:gates]   # lock key => { at:, kind:, npc:, number: }: a gate answer not yet passed
    @ls_passed = st[:passed]
    @ls_opened = st[:opened]
  end

  # A 200 POST reset starts the game again: nothing earned before it stands.
  def ls_note_reset(info)
    return unless info[:method] == 'POST' && info[:ok] && info[:path].match?(%r{/games/[^/]+/reset(\.json)?/?\z})

    @ls_gates.clear
    @ls_passed.clear
    @ls_opened.clear
  end

  def ls_time(row)
    Time.iso8601(row['t'].to_s)
  rescue ArgumentError
    nil
  end

  def ls_fresh?(gate, now)
    gate[:at] && now && (0..BreakEscape::MfaModel::PENDING_SECONDS).cover?(now - gate[:at])
  end

  def ls_query_pairs(info)
    URI.decode_www_form(info[:query].to_s)
  rescue ArgumentError
    []
  end

  def ls_marker?(hash)
    return true if LS_MARKER_KEYS.any? { |k| hash.key?(k) }
    return true if hash.key?('secondStep') && !hash['secondStep'].is_a?(Hash)

    hash['targetId'].is_a?(String) && @ls_locks.values.any? { |l| l[:id] == hash['targetId'] }
  end

  # The lock key an answer's echo names: a String when both keys are Strings naming a lock of the scenario, nil when it has
  # neither key, :bad otherwise (half an echo, a value of another type, a lock the scenario has not).
  def ls_echo_key(root)
    return nil unless root.is_a?(Hash) && ls_lock_form?(root)

    key = "#{root['targetType']}:#{root['targetId']}"
    root['targetType'].is_a?(String) && root['targetId'].is_a?(String) && @ls_locks.key?(key) ? key : :bad
  end

  # ---- one answer -----------------------------------------------------------------------------------------------

  # Returns (and leaves in @ls_placed, for the PC rules) the hashes these rules placed.
  def scan_lock_steps(body, row, add)
    ls_bind
    @ls_placed = []
    info = mfa_route(row)
    ls_select_game(info)
    ls_note_reset(info)
    unless body.is_a?(Hash) || body.is_a?(Array)
      ls_note_bodyless(row)
      return @ls_placed
    end
    now = ls_time(row)
    root = body.is_a?(Hash) ? body : nil
    unlock = info[:method] == 'POST' && info[:path].match?(%r{/games/[^/]+/unlock\z})
    judged = [] # hashes (by identity) a rule below has placed
    reported = [] # hashes a rule below has already made a finding of
    earn = []   # what this answer proves for the answers after it, applied last

    ls_judge_state_keys(body, add)
    return @ls_placed unless @ls_active # R1-L10: inert in a scenario with no lock step

    ls_judge_gate(root, info, unlock, now, add, judged, earn)
    ls_judge_pass(root, info, now, add, judged, reported, earn)
    ls_judge_phone(body, info, now, add, judged)
    ls_judge_refusal(root, info, row, add, judged, reported)
    open_key, open_reported = ls_judge_open(root, info, unlock, add)
    ls_judge_contents(body, info, open_key, open_reported, add)
    ls_judge_secrets(body, info, add, judged)
    ls_judge_unplaced(body, add, judged + reported)
    ls_earn(earn, open_key, root, info)
    @ls_placed = judged
  end

  def ls_judge_state_keys(body, add)
    mfa_walk(body) do |hash, path, _parent|
      hash.each_key do |key|
        add.call('lock_step_secret', "lockstep:key:#{key}", safe_path("#{path}.#{key}")) if LS_STATE_KEYS.include?(key)
      end
    end
  end

  # ---- gate answers -----------------------------------------------------------------------------------------------

  # The lock key of a gate answer in the shape the server sends, or nil.
  def ls_gate_key(body, info, unlock)
    return nil unless unlock && info[:ok] && body['secondStep'] == true && body['success'] == false

    lock = @ls_locks["#{body['targetType']}:#{body['targetId']}"]
    return nil unless lock && body['targetType'].is_a?(String) && body['targetId'].is_a?(String)
    return nil unless body['kind'] == lock[:kind] && lock[:owner] && body['npcId'] == lock[:owner]

    expected = LS_GATE_KEYS + (lock[:kind] == 'push_number_match' ? ['number'] : [])
    keys = body.keys
    # R1-L2: the opener is the NPC whose `npc` first factor opened the door (lock_step_name_opener! names the request's attempt, the
    # server having checked Game#validate_npc_unlock: the NPC's authored `unlockable` list holds the room). Not necessarily the owner;
    # it must be a room NPC of the scenario that may open this very door.
    keys -= ['opener'] if lock[:type] == 'door' && ls_may_open_door?(body['opener'], lock[:id])
    return nil unless keys.sort == expected.sort
    return nil if lock[:kind] == 'push_number_match' && !(body['number'].is_a?(Integer) && LS_NUMBER_RANGE.cover?(body['number']))

    "#{body['targetType']}:#{body['targetId']}"
  end

  def ls_may_open_door?(npc_id, room_id)
    npc = npc_id.is_a?(String) ? @priv_npcs[npc_id] : nil
    npc.is_a?(Hash) && npc['unlockable'].is_a?(Array) && npc['unlockable'].include?(room_id)
  end

  def ls_judge_gate(root, info, unlock, now, add, judged, earn)
    return unless root && (root['secondStep'] == true)

    key = ls_gate_key(root, info, unlock)
    # a gate for a lock that already passed or opened is not an answer the server gives
    if key.nil? || @ls_passed.include?(key) || @ls_opened.include?(key)
      add.call('lock_step_answer', "lockstep:gate:#{key || 'unplaced'}", '$')
      return
    end

    gate = { at: now, kind: root['kind'], npc: root['npcId'], number: root['number'] }
    live = @ls_gates[key]
    if live && ls_fresh?(live, now)
      # R1-L8: the server answers a live record again with no write: the clock and the number are the first gate's
      if live[:kind] != gate[:kind] || live[:npc] != gate[:npc] || live[:number] != gate[:number]
        add.call('lock_step_answer', "lockstep:gate:changed:#{key}", '$')
        return
      end
      gate = live
    end
    judged << root
    earn << [:gate, key, gate]
  end

  # ---- pass answers -----------------------------------------------------------------------------------------------

  def ls_judge_pass(root, info, now, add, judged, reported, earn)
    return unless root && root.key?('stepPassed')

    route = info[:route].to_s.sub('mfa/', '')
    gates = ls_pass_gates(root, info, route, now)
    if gates.size == 1
      judged << root
      earn << [:pass, gates.first, nil]
    else
      reported << root
      add.call('lock_step_answer', "lockstep:pass:#{ls_lock_form?(root) ? 'no-gate' : 'no-echo'}", '$')
    end
  end

  # The open gate this pass answer closes, placed by its own echo: route, shape and owner proofs; empty unless all hold.
  def ls_pass_gates(body, info, route, now)
    return [] unless info[:method] == 'POST' && info[:ok] && LS_ROUTE_KINDS.key?(route) && info[:route] == "mfa/#{route}"

    expected = %w[stepPassed success targetId targetType]
    expected << 'approvedBy' if LS_APPROVED_BY.key?(route)
    return [] unless body.keys.sort == expected.sort && body['success'] == true && body['stepPassed'] == true
    return [] unless !LS_APPROVED_BY.key?(route) || body['approvedBy'] == LS_APPROVED_BY[route]

    key = ls_echo_key(body)
    gate = key.is_a?(String) ? @ls_gates[key] : nil
    return [] unless gate && LS_ROUTE_KINDS[route].include?(gate[:kind]) && ls_fresh?(gate, now)

    ok =
      case route
      when 'prompt' then @priv_npcs.key?(gate[:npc]) && mfa_owner_may_approve?(gate[:npc])
      when 'approve' then mfa_phone_taken?(gate[:npc])
      else ls_code_device_taken?(gate[:npc]) # R1-L3: the server checks the held device before it checks a code
      end
    ok ? [key] : []
  end

  def ls_code_device_taken?(owner)
    @mfa_devices.values.any? { |d| d['owner'] == owner && @mfa_taken.include?(d['id']) }
  end

  # ---- the phone's answer -----------------------------------------------------------------------------------------

  def ls_judge_phone(body, info, now, add, judged)
    return unless body.is_a?(Hash) && body['requests'].is_a?(Array)

    entries = body['requests'].select { |e| e.is_a?(Hash) && (e.key?('targetId') || e.key?('targetType')) }
    return if entries.empty?

    if ls_phone_answer_ok?(body, entries, info, now)
      judged << body
      judged.concat(entries)
    else
      add.call('lock_step_answer', 'lockstep:phone', '$')
    end
  end

  def ls_phone_answer_ok?(body, entries, info, now)
    return false unless info[:method] == 'GET' && info[:route] == 'mfa/phone' && info[:ok]
    return false unless body.keys == ['requests'] && body['requests'].size == 1 && entries.size == 1

    pairs = ls_query_pairs(info)
    return false unless pairs.map(&:first).sort == LS_PHONE_QUERY && pairs.all? { |_k, v| !v.empty? }

    query = pairs.to_h
    entry = entries.first
    key = "#{query['target_type']}:#{query['target_id']}"
    lock = @ls_locks[key]
    gate = @ls_gates[key]
    return false unless lock && gate && ls_fresh?(gate, now) && LS_PUSH_KINDS.include?(lock[:kind]) && gate[:kind] == lock[:kind]
    return false unless lock[:owner] == query['npc_id'] && mfa_phone_taken?(query['npc_id'])
    return false unless entry['targetType'] == query['target_type'] && entry['targetId'] == query['target_id']

    keys = entry.keys.sort
    return false unless keys == (LS_PHONE_ENTRY_KEYS + (lock[:kind] == 'push_number_match' ? ['numbers'] : [])).sort
    return false unless entry['name'] == lock[:name] # R1-L13: the server's name is the lock's authored one
    return false unless entry['n'].is_a?(Integer) && entry['n'].between?(0, BreakEscape::MfaModel::MAX_PROMPTS)
    return true unless lock[:kind] == 'push_number_match'

    nums = entry['numbers']
    nums.is_a?(Array) && nums.size == 3 && nums.all? { |v| v.is_a?(Integer) && LS_NUMBER_RANGE.cover?(v) } &&
      nums == nums.uniq.sort && nums.include?(gate[:number])
  end

  # ---- refusals ----------------------------------------------------------------------------------------------------

  # A non-pass answer of POST mfa/verify, prompt or approve, or an error answer of the phone or device. Lock form (it echoes its
  # lock): exactly a shape of the lock's list, whatever PC step is open. No echo: only the two answers the server sends with no
  # lock to name (the 403 and 404 `error` answers, the generic 422 `message`), or, with a PC step open, the PC's own answer.
  def ls_judge_refusal(root, info, row, add, judged, reported)
    return unless root && @ls_active && !root.key?('stepPassed')

    route = mfa_route_name(info)
    placed = (info[:method] == 'POST' && LS_REFUSAL_SHAPES.key?(route)) || (info[:method] == 'GET' && %w[mfa/phone mfa/device].include?(route))
    # a PC's pass answer, and the 200 answers of the phone and the device, are judged elsewhere
    return unless placed && root['success'] != true && !root.key?('requests') && !root.key?('deviceId')

    echo = ls_echo_key(root)
    shape = root.reject { |k, _v| %w[targetType targetId].include?(k) }
    if echo.nil?
      return if ls_pc_owns?(root)
      return if ls_unnamed_shape?(shape) && ls_refusal_ok?(route, info, shape, row)
    elsif echo != :bad && ls_refusal_ok?(route, info, shape, row)
      judged << root
      return
    end
    reported << root
    add.call('lock_step_answer', "lockstep:refusal:#{route}", '$')
  end

  # With a PC step open the answer may be that PC's (it has no echo, the lock's always has): the PC rules judge it.
  def ls_pc_owns?(root)
    !@mfa_pending.empty? && root.keys.all? { |k| LS_PC_REFUSAL_KEYS.include?(k) }
  end

  # The answers the server gives with no lock to name: the generic 422 and the 403/404 error answers.
  def ls_unnamed_shape?(shape)
    shape.keys.sort == LS_ERROR_SHAPE || shape.keys.sort == %w[message success]
  end

  def ls_refusal_ok?(route, info, root, row)
    status = row['status']
    if root.key?('error')
      return root.keys.sort == LS_ERROR_SHAPE && root['success'] == false && root['error'].is_a?(String) && [403, 404].include?(status)
    end
    return false unless info[:method] == 'POST' && info[:route] == route && root['success'] == false

    LS_REFUSAL_SHAPES[route].any? { |shape| shape == root.keys.sort } && ls_refusal_values_ok?(root, status)
  end

  def ls_refusal_values_ok?(root, status)
    return status == 200 if root.key?('approved') && root['approved'] == false && root['promptsSent'].is_a?(Integer) &&
                            (!root.key?('waiting') || LS_WAITING_VALUES.include?(root['waiting']))
    return false if root.key?('approved')
    return false unless status == 422

    ok = true
    ok &&= %w[used expired].include?(root['stale']) if root.key?('stale')
    ok &&= root['mfaIncorrect'] == true if root.key?('mfaIncorrect')
    ok &&= root['expired'] == true if root.key?('expired')
    ok &&= root['cancelled'] == true if root.key?('cancelled')
    ok &&= root['tooSoon'] == true && root['retryAfterS'].is_a?(Integer) if root.key?('tooSoon')
    ok &&= root['codeLocked'] == true && root['retryIn'].is_a?(Integer) if root.key?('codeLocked')
    ok &&= root['message'].is_a?(String) if root.key?('message')
    ok
  end

  # ---- opens, and contents and room data ---------------------------------------------------------------------------

  # Which gated locks an answer's contents or roomData could belong to, by the ids it carries.
  def ls_content_owners(hash)
    owners = Set.new
    if hash['contents'].is_a?(Array)
      ids = hash['contents'].filter_map { |e| e['id'] if e.is_a?(Hash) && e['id'].is_a?(String) }
      @ls_locks.each { |key, l| owners << key if l[:type] == 'object' && !(l[:contents_ids] & ids).empty? }
      [hash['id'], hash['container_id']].each { |id| owners << "object:#{id}" if id.is_a?(String) && @ls_locks.key?("object:#{id}") }
    end
    if hash['roomData'].is_a?(Hash)
      objects = hash['roomData']['objects']
      ids = objects.is_a?(Array) ? objects.filter_map { |e| e['id'] if e.is_a?(Hash) && e['id'].is_a?(String) } : []
      @ls_locks.each do |key, l|
        next unless l[:type] == 'door'

        owners << key if (ids.empty? && l[:room_ids].empty?) || !(l[:room_ids] & ids).empty?
      end
    end
    owners.to_a
  end

  # R1-L1: the locks a hash belongs to by its own `id` (an item inside a gated object, an object of a gated room), under any key.
  def ls_id_owners(hash)
    id = hash['id']
    return [] unless id.is_a?(String)

    @ls_locks.select { |_k, l| l[:contents_ids].include?(id) || l[:room_ids].include?(id) }.keys
  end

  # R1-L1: the gated rooms whose objects a hash lists: `objects` under rooms.<gated room>, or anywhere under a hash that names
  # the gated room in `room_id`. An empty list reveals nothing.
  def ls_room_owners(hash, path)
    owners = []
    parts = path.sub(/\A\$/, '').split('.')
    if hash['objects'].is_a?(Array) && !hash['objects'].empty? && parts.size >= 2 && parts[-2] == 'rooms'
      owners << "door:#{parts[-1]}" if @ls_locks.key?("door:#{parts[-1]}")
    end
    room = hash['room_id']
    if room.is_a?(String) && @ls_locks.key?("door:#{room}")
      listed = false
      mfa_walk(hash) { |h, _p, _k| listed ||= h['objects'].is_a?(Array) && !h['objects'].empty? }
      owners << "door:#{room}" if listed
    end
    owners
  end

  # The lock key a 200 POST unlock open (`success: true`) with contents or room data is for, when it has its proof; nil when it
  # carries none of a gated lock's content or is not an open. A finding when the proof is missing or ambiguous.
  def ls_judge_open(root, info, unlock, add)
    return [nil, []] unless root && unlock && info[:ok] && root['success'] == true

    candidates = ls_content_owners(root)
    return [nil, []] if candidates.empty?

    passed = candidates.select { |k| @ls_passed.include?(k) }
    return [passed.first, []] if passed.size == 1
    return [candidates.first, []] if passed.empty? && candidates.all? { |k| @ls_opened.include?(k) }

    add.call('lock_step_content', "lockstep:open:#{passed.empty? ? candidates.min : 'ambiguous'}", '$')
    [nil, candidates] # the open is the finding; its own contents are not reported a second time
  end

  def ls_judge_contents(body, info, open_key, open_reported, add)
    return unless @ls_active

    # R1-L12: the placed open excuses its own lock for the root and for every hash inside its own contents or room data
    excused = []
    if body.is_a?(Hash) && (open_key || !open_reported.empty?)
      excused << body
      %w[contents roomData].each { |k| mfa_walk(body[k]) { |h, _p, _k| excused << h } if body[k].is_a?(Hash) || body[k].is_a?(Array) }
    end
    mfa_walk(body) do |hash, path, _parent|
      owners = ls_content_owners(hash) | ls_id_owners(hash) | ls_room_owners(hash, path)
      owners |= ["object:#{info[:container]}"] if info[:container] && hash.equal?(body) && hash.key?('contents') && @ls_locks.key?("object:#{info[:container]}")
      owners.each do |key|
        next if @ls_opened.include?(key)
        next if (key == open_key || open_reported.include?(key)) && excused.any? { |h| h.equal?(hash) }

        at = hash['roomData'].is_a?(Hash) ? "#{path}.roomData" : (hash['contents'].is_a?(Array) ? "#{path}.contents" : path)
        add.call('lock_step_content', "lockstep:content:#{key}", safe_path(at))
      end
    end
    room = info[:path][%r{/games/[^/]+/room/([^/]+)\z}, 1]
    key = room && "door:#{URI.decode_www_form_component(room)}"
    add.call('lock_step_content', "lockstep:room:#{key}", '$') if key && @ls_locks.key?(key) && info[:method] == 'GET' && info[:ok] && !@ls_opened.include?(key)
  end

  # ---- numbers and codes ------------------------------------------------------------------------------------------

  def ls_judge_secrets(body, info, add, judged)
    return unless @ls_active

    device = mfa_device_answer_ok?(body, info)
    route = mfa_route_name(info).to_s
    mfa_walk(body) do |hash, path, _parent|
      # R1-L11: a `pcId` beside `numbers` is left to the PC rule only when that rule can run (a policy matches numbers)
      if hash.key?('numbers') && (!hash.key?('pcId') || !@mfa_numbers_possible) && !judged.any? { |j| j.equal?(hash) }
        add.call('lock_step_secret', 'lockstep:key:numbers', safe_path("#{path}.numbers"))
      end
      if hash.key?('number') && (route.start_with?('mfa/') || ls_marker?(hash) || hash.key?('secondStep')) && !judged.any? { |j| j.equal?(hash) }
        add.call('lock_step_secret', 'lockstep:key:number', safe_path("#{path}.number"))
      end
      code = hash['code']
      if hash.key?('code') && (code.is_a?(String) || code.is_a?(Integer)) && code.to_s.delete(" \t-").match?(/\A\d{6}\z/) && !(device && hash.equal?(body))
        add.call('lock_step_secret', 'lockstep:key:code', safe_path("#{path}.code"))
      end
    end
  end

  # A gate or pass shaped hash, or one naming a gated lock, that no rule above placed: wrong route, wrong place, wrong shape.
  def ls_judge_unplaced(body, add, judged)
    mfa_walk(body) do |hash, path, _parent|
      next unless ls_marker?(hash)
      next if judged.any? { |j| j.equal?(hash) }
      next if hash.equal?(body) && (hash['secondStep'] == true || hash.key?('stepPassed')) # judged above, already a finding

      add.call('lock_step_answer', 'lockstep:unplaced', safe_path(path))
    end
  end

  # ---- what an answer proves for the answers after it ---------------------------------------------------------------

  def ls_earn(earn, open_key, root, info)
    earn.each do |kind, key, value|
      case kind
      when :gate then @ls_gates[key] = value
      when :pass
        @ls_gates.delete(key)
        @ls_passed << key
      end
    end
    if open_key && (@ls_passed.include?(open_key) || @ls_opened.include?(open_key))
      @ls_passed.delete(open_key)
      @ls_opened << open_key
    end
    # closing is the safe direction: a cancel, an expiry or a closed code ends the gate the answer names (R1-L4), or, when it
    # names none and no PC step owns it, the gates of the kinds the route handles
    return unless root && info[:method] == 'POST' && LS_ROUTE_KINDS.key?(info[:route].to_s.sub('mfa/', '')) && !root.key?('stepPassed')
    return unless root['cancelled'] == true || root['expired'] == true || root['codeLocked'] == true

    echo = ls_echo_key(root)
    if echo.is_a?(String)
      @ls_gates.delete(echo)
    elsif !(echo.nil? && ls_pc_owns?(root))
      kinds = LS_ROUTE_KINDS[info[:route].sub('mfa/', '')]
      @ls_gates.delete_if { |_k, g| kinds.include?(g[:kind]) }
    end
  end
end
