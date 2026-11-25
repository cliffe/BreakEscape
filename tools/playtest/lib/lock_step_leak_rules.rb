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
# finding (R1-L4). An open answer (200 POST unlock) of a gated lock names its lock the same way (R1 scanner round: the server echoes
# `targetType` and `targetId` on it): it is placed to that lock's pass by the echo, and an open that carries a gated lock's contents or
# room data and names none (or names another lock than the one whose content it carries) is a finding. A lock-form answer is judged only
# by these rules and the hashes placed here are handed to the PC rules through @ls_placed, which never credits, closes or flags them
# (R1-L5, R1-SCANNER1: a PC answer that carries one of the two keys in a scenario with no lock step is still the PC rules' own).
#
# Limits that remain, stated exactly:
#   - `pcId` is not on the PC form's cancel and waiting-prompt answers (NOT decided for this stage): in a scenario with both PC steps and
#     lock steps, a PC push step open, an echo-less cancel on mfa/approve or waiting prompt on mfa/prompt reads as the PC's, because it
#     is the same bytes as a lock's with its echo dropped (R1-SCANNER8 narrowed it to a PC step of a kind that route serves);
#   - an open of a lock whose answer carries no contents and no room data (an empty gated lock) cannot be told, without its echo, from
#     the open of an ordinary lock: an echo-less one is not reported;
#   - a lock inside a room that has not opened (gated or ordinary, other than the start room) or inside a closed gated container is
#     refused by the server as an invented id on every route (072a72a70, Rule C), so a gate, a pass, a phone answer or an echoed
#     refusal for it is a finding (R1-SCANNER4, R2-SCANNER1). A room counts as opened only by proof the server could produce for an
#     opened room (R3-SCANNER1): its gated door was opened, or a 200 POST unlock door open listed ids of that one room and of no other;
#     an open that lists ids of two or more rooms opens none and is a finding (`lockstep:room:mixed`); a bare 200 GET room/<id> is no
#     proof (only the awareness world room is served that way from the start); a lock authored in no room (carried, profile, share) is
#     never judged by room;
#   - the OPEN answer of a locked room (200 POST unlock, type door) that lists no object and no NPC carries nothing a rule could protect
#     (owner decision, 2026-11-24, R2-SCANNER2, narrowed in R3-SCANNER2): it is placed nowhere and reports nothing. Room data with no id
#     in any other answer (GET scenario, GET room, any route) is judged as before;
#   - the NPCs of a gated room are watched by their ids only inside room data (`roomData`, `room`, `rooms.<id>`), and the items they
#     hold by id anywhere (R1-SCANNER5).
#
# Rules (the answers' shapes are those of test/fixtures/files/lock_step/answers.json):
#   lock_step_content
#     - `contents` of a gated object, `roomData` of a gated room (found by the lock's id, the route's container or
#       room id, or by the ids of the items or objects they carry), or the answer of GET room/<gated room>, in any
#       answer, unless the lock has the full proof earlier in the capture: a gate answer, a pass answer, then the
#       200 POST unlock answer with `success: true` that carries the contents or room data (which itself is
#       allowed only for that proof);
#     - a 200 POST unlock open that carries a gated lock's contents or room data with no pass before it, or that names no lock.
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
    'mfa/approve' => [%w[cancelled success], %w[expired success], %w[message success]]
  }.freeze
  LS_ERROR_SHAPE = %w[error success].freeze
  # R1-SCANNER9: every key the 200 answer of POST /unlock that opens a gated lock can carry (games_controller#unlock): the echo, the
  # rfid card answer (cardId, viaCopy), the server writes (add_server_writes_to_answer!), and what each type serves
  LS_OPEN_KEYS = %w[success type targetType targetId alreadyOpen cardId viaCopy serverGlobals serverCompletedTasks serverMissionConcluded].freeze
  LS_OPEN_KEYS_BY_TYPE = { 'door' => %w[roomData], 'object' => %w[hasContents contents rewards completedTasks updatedTasks] }.freeze
  # everything a PC's second step answers with on a refusal (S8a); with a PC step open too, a refusal may use these
  LS_PC_REFUSAL_KEYS = %w[success message mfaIncorrect attemptsLeft stale expired codeLocked retryIn lockedOut tooSoon retryAfterS
                          cancelled approved promptsSent waiting error].freeze

  # the values `waiting` takes on a lock answer (mfa_access.rb: the owner, or the owner's phone held by the player)
  LS_WAITING_VALUES = %w[owner held_phone].freeze
  # the refusals a PC's form always sends with its `message` (mfa_sign_in.rb); the lock's of the same name never has one
  LS_PC_MESSAGE_KEYS = %w[mfaIncorrect stale expired codeLocked tooSoon].freeze

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
    @ls_locks = {}   # "object:<id>" | "door:<room>" => { type:, id:, kind:, owner:, name:, contents_ids:, room_ids:, npc_ids: }
    @ls_games = {}   # game id => { gates:, passed:, opened: }
    @ls_placed = []
    ls_select_game(nil)
    BreakEscape::LockStepModel.each_lock_step(@data).each do |entry|
      type = entry[:kind].to_s
      id = entry[:id]
      lockable = entry[:lockable]
      step = entry[:step]
      list = type == 'door' ? lockable['objects'] : ls_children(lockable)
      # R1-SCANNER5: a gated room's NPCs, and what they hold, are part of what the room gives up
      npcs = type == 'door' ? Array(lockable['npcs']).select { |n| n.is_a?(Hash) } : []
      held = npcs.flat_map { |n| Array(n['itemsHeld']) }
      # R1-L7: ids are authored, and the rules watch content by them; an item without one could not be watched
      raise ArgumentError, "lock step #{type}:#{id || 'with no id'}: a gated lock needs an id" if id.nil?
      raise ArgumentError, "lock step #{type}:#{id}: every entry of its #{type == 'door' ? 'objects' : 'contents'} (and every item inside) needs an id" unless ls_all_ids?(list) && ls_all_ids?(held)

      key = "#{type}:#{id}"
      if (known = @ls_locks[key])
        known[:contents_ids].merge(ls_ids(list)) # R1-L14: a second lock of the same id keeps both lists watched
        known[:room_ids].merge(ls_ids(list) + ls_ids(held)) if type == 'door'
        known[:npc_ids].merge(ls_npc_ids(npcs))
        next
      end
      @ls_locks[key] = { type: type, id: id, kind: step['kind'], owner: step['owner'], name: ls_lock_name(type, id, lockable),
                         room: type == 'object' && entry[:home] == :room ? entry[:room] : nil,
                         contents_ids: ls_ids(list).to_set, room_ids: type == 'door' ? (ls_ids(list) + ls_ids(held)).to_set : Set.new,
                         npc_ids: ls_npc_ids(npcs).to_set }
    end
    @ls_active = !@ls_locks.empty?
    return unless @ls_active

    ls_collect_door_routes
    @ls_known_ids = Set.new # every id the scenario's rooms author or the server generates (objects, NPCs, what they hold), for R1-SCANNER5
    @ls_room_ids = {}       # room id => the ids of its objects (authored or generated), for the rooms an open of a door serves
    rooms = @data['rooms'].is_a?(Hash) ? @data['rooms'] : {}
    rooms.each do |room_id, room|
      next unless room.is_a?(Hash)

      objects = ls_server_ids(room['objects'], room_id)
      held = Array(room['npcs']).flat_map { |n| n.is_a?(Hash) && n['id'].is_a?(String) ? [n['id']] + ls_server_ids(n['itemsHeld'], n['id'], held: true) : [] }
      # R4-2: an object the server can move out of its room (an NPC's carry with needsTag, a takeable, a player drop) is no proof of
      # which room an answer served: leave its ids (and its contents') out of the room proof
      movable = Array(room['objects']).each_with_index.flat_map do |o, i|
        o.is_a?(Hash) && (o['needsTag'] || o['takeable']) ? ls_server_ids(Array.new(i) + [o], room_id) : []
      end
      @ls_room_ids[room_id] = (objects - movable).to_set
      @ls_known_ids.merge(objects + held)
    end
  end

  # R2-SCANNER2: every id the server gives the objects of a room, exactly as Game#stamp_scenario_object_ids! does at creation: an
  # object with no id gets `<room>_<type>_<index>`, a held item `<npc>_held_<index>`, an item inside a container
  # `<container id>_content_<index>`, recursively. `base` is the room id (or the NPC id with held: true).
  def ls_server_ids(list, base, held: false)
    Array(list).each_with_index.flat_map do |o, i|
      next [] unless o.is_a?(Hash)

      id = o['id'].nil? ? (held ? "#{base}_held_#{i}" : "#{base}_#{o['type']}_#{i}") : o['id']
      ids = id.is_a?(String) && !id.empty? ? [id] : []
      ids + ls_server_content_ids(o['contents'], id)
    end
  end

  def ls_server_content_ids(list, parent_id)
    Array(list).each_with_index.flat_map do |o, i|
      next [] unless o.is_a?(Hash)

      id = o['id'].nil? ? "#{parent_id}_content_#{i}" : o['id']
      (id.is_a?(String) && !id.empty? ? [id] : []) + ls_server_content_ids(o['contents'], id)
    end
  end

  def ls_npc_ids(npcs)
    npcs.map { |n| n['id'] }.select { |v| v.is_a?(String) && !v.empty? }
  end

  # R1-SCANNER4: true for a lock authored inside another object lock that has not been opened (a lock below a closed gated
  # container). The server never gates it, never answers for it and answers 404 with no echo for every action (Rule C).
  def ls_below_closed?(key)
    lock = @ls_locks[key]
    return false unless lock && lock[:type] == 'object'

    @ls_locks.any? { |k, l| k != key && l[:type] == 'object' && !@ls_opened.include?(k) && l[:contents_ids].include?(lock[:id]) }
  end

  # R2-SCANNER1: true for an object lock authored in a room the player has not opened (the start room is always open). The server
  # refuses such a lock as an invented id (step_room_unreached?); a lock authored in no room (carried, profile, share) is never
  # judged by room, as the server does.
  def ls_room_shut?(key)
    room = @ls_locks.dig(key, :room)
    room.is_a?(String) && room != @data['startRoom'] && !@ls_rooms.include?(room) && !@ls_opened.include?("door:#{room}")
  end

  # the server answers nothing for a lock below a closed container or inside a room not yet opened
  def ls_hidden?(key)
    ls_below_closed?(key) || ls_room_shut?(key)
  end

  # What an answer proves about rooms opened (R3-SCANNER1): a 200 POST unlock open of a door whose room data lists ids of exactly one
  # room of the scenario (the server serves one room per door open), and a 200 GET room/<id> only for the awareness world room. An
  # open listing ids of two or more rooms proves none and is a finding.
  def ls_note_rooms(root, info, add)
    return unless info[:ok]

    if info[:method] == 'GET' && (room = info[:path][%r{/games/[^/]+/room/([^/]+)\z}, 1])
      room = URI.decode_www_form_component(room)
      world = @data.dig('social', 'awarenessEpisode', 'world', 'room') if @data['social'].is_a?(Hash) && @data['social']['awarenessEpisode'].is_a?(Hash) && @data['social']['awarenessEpisode']['world'].is_a?(Hash)
      @ls_rooms << room if world.is_a?(String) && world == room
    elsif root && info[:method] == 'POST' && info[:path].match?(%r{/games/[^/]+/unlock\z}) && root['success'] == true &&
          root['type'] == 'door' && root['roomData'].is_a?(Hash)
      ids = (ls_ids(root['roomData']['objects']) + ls_ids(root['roomData']['npcs'])).to_set
      rooms = @ls_room_ids.select { |_room, room_ids| !(room_ids & ids).empty? }.keys
      if root['alreadyOpen'] == true && rooms.size > 1
        nil # R4-2: an open that was already done proves nothing new, and a player drop can put ids of two rooms in one
      elsif rooms.size == 1
        @ls_rooms << rooms.first
      elsif rooms.size > 1
        add.call('lock_step_content', 'lockstep:room:mixed', '$')
      end
    elsif root && info[:method] == 'POST' && info[:path].match?(%r{/games/[^/]+/npc_workaround\z}) && root['roomId'].is_a?(String) &&
          root['roomData'].is_a?(Hash) && @ls_prop_doors.include?(root['roomId'])
      # R4-3: a prop_door the scenario authors opens its room (serve_opened_room); an ordinary room's own ids prove it
      ids = (ls_ids(root['roomData']['objects']) + ls_ids(root['roomData']['npcs'])).to_set
      rooms = @ls_room_ids.select { |_room, room_ids| !(room_ids & ids).empty? }.keys
      @ls_rooms << root['roomId'] if rooms == [root['roomId']]
    end
  end

  # The doors the scenario itself authors a way past the step for: a `prop_door` workaround of a room NPC, and an `unlock_door`
  # flag reward (the reward's `target_room`, else its `room_id`, else the room of the flag station). Both skip the step on the
  # real server (the plan settles it); a lock-step door nobody authors one for gets no allowance.
  def ls_collect_door_routes
    @ls_prop_doors = Set.new
    @ls_reward_doors = Set.new # the server's unlock_door result carries no station id (process_door_unlock_reward), so doors stay one set
    @ls_reward_objects = {} # R3-SCANNER4: flag station id => the refs (object id or name) its own unlock_object rewards name
    BreakEscape::Game.scenario_room_npcs(@data).each do |npc|
      next unless npc.is_a?(Hash)

      BreakEscape::AccessWork.workarounds(@data, npc).each do |w|
        @ls_prop_doors << w['door'] if w['do'] == 'prop_door' && w['door'].is_a?(String)
      end
    end
    rooms = @data['rooms'].is_a?(Hash) ? @data['rooms'] : {}
    rooms.each do |room_id, room|
      next unless room.is_a?(Hash)

      # R4-4: a station's id is the one the server stamps (`<room>_<type>_<i>`, `<npc>_held_<i>`), never its name
      stations = Array(room['objects']).each_with_index.map { |o, i| [o, o.is_a?(Hash) ? (o['id'].nil? ? "#{room_id}_#{o['type']}_#{i}" : o['id']) : nil] } +
                 Array(room['npcs']).flat_map do |n|
                   next [] unless n.is_a?(Hash)

                   Array(n['itemsHeld']).each_with_index.map { |o, i| [o, o.is_a?(Hash) ? (o['id'].nil? ? "#{n['id']}_held_#{i}" : o['id']) : nil] }
                 end
      stations.each do |station, stamped_id|
        next unless station.is_a?(Hash) && station['flagRewards']

        rewards = station['flagRewards'].is_a?(Hash) ? station['flagRewards'].values : Array(station['flagRewards'])
        station_id = stamped_id # the server's flag_station_id

        rewards.each do |r|
          next unless r.is_a?(Hash)

          if r['type'] == 'unlock_object' && r['objectId'].is_a?(String)
            (@ls_reward_objects[station_id] ||= Set.new) << r['objectId'] if station_id.is_a?(String) # R2-SCANNER3
            next
          end
          next unless r['type'] == 'unlock_door'

          door = r['target_room'] || r['room_id'] || room_id
          @ls_reward_doors << door if door.is_a?(String)
        end
      end
    end
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
    st = (@ls_games[game] ||= { gates: {}, passed: Set.new, opened: Set.new, rooms: Set.new })
    @ls_gates = st[:gates]   # lock key => { at:, kind:, npc:, number: }: a gate answer not yet passed
    @ls_passed = st[:passed]
    @ls_opened = st[:opened]
    @ls_rooms = st[:rooms]   # room ids the player has opened, by what the capture served
  end

  # A 200 POST reset starts the game again: nothing earned before it stands.
  def ls_note_reset(info)
    return unless info[:method] == 'POST' && info[:ok] && info[:path].match?(%r{/games/[^/]+/reset(\.json)?/?\z})

    @ls_gates.clear
    @ls_passed.clear
    @ls_opened.clear
    @ls_rooms.clear
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
    open_key, open_reported = ls_judge_open(root, info, unlock, add, judged)
    prop_key = open_key.nil? && open_reported.empty? ? ls_judge_prop_door(root, info) : nil
    ls_judge_contents(body, info, open_key || prop_key, open_reported, add)
    ls_judge_secrets(body, info, add, judged, open_key)
    ls_judge_unplaced(body, add, judged + reported)
    ls_earn(earn, open_key, root, info)
    ls_earn_door_routes(root, info, prop_key)
    ls_note_rooms(root, info, add)
    @ls_placed = judged
  end

  def ls_judge_state_keys(body, add)
    mfa_walk(body) do |hash, path, _parent|
      # R3-SCANNER3: a headless owner's record must not tell the player whether it approves prompts
      if @ls_active && path.match?(/social\.characters\.[^.]+\.emailRecord\z|social\.mailClient\.contacts\[\d+\](\.emailRecord)?\z/)
        %w[awareness promptPatience].each { |k| add.call('mfa_secret', "mfa:key:#{k}", safe_path("#{path}.#{k}")) if hash.key?(k) }
      end
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
    if key && ls_below_closed?(key)
      add.call('lock_step_answer', "lockstep:gate:below:#{key}", '$')
      return
    end
    if key && ls_room_shut?(key)
      add.call('lock_step_answer', "lockstep:gate:room:#{key}", '$')
      return
    end
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
    gate = key.is_a?(String) && !ls_hidden?(key) ? @ls_gates[key] : nil
    return [] unless gate && LS_ROUTE_KINDS[route].include?(gate[:kind]) && ls_fresh?(gate, now)

    ok =
      case route
      when 'prompt' then ls_owner_may_approve?(gate[:npc])
      when 'approve' then mfa_phone_taken?(gate[:npc])
      else ls_code_device_taken?(gate[:npc]) # R1-L3: the server checks the held device before it checks a code
      end
    ok ? [key] : []
  end

  # The owner's record as the server reads it (Game#find_npc_in_scenario): a room NPC, else a headless record (a mail-only
  # character); the plan lets either own a lock. Same habit and phone rules as a PC's owner (mfa_owner_may_approve?).
  def ls_owner_record(id)
    return nil unless id.is_a?(String)

    @priv_npcs[id] || BreakEscape::Game.headless_npc_records(@data).find { |r| r.is_a?(Hash) && r['id'] == id }
  end

  def ls_owner_may_approve?(id)
    record = ls_owner_record(id)
    !record.nil? && BreakEscape::MfaModel.prompt_habit(record, @data) != 'never' && !@mfa_phone_owners.include?(id)
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
    return false if ls_hidden?(key)
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
    # a PC's pass answer is judged elsewhere, and so are the 200 answers of the phone and the device (R1-SCANNER3: only a GET of
    # those two routes, for its own key; a refusal of any other route or status that carries one of the keys is judged here)
    own_answer = info[:method] == 'GET' && info[:ok] && ((route == 'mfa/phone' && root.key?('requests')) || (route == 'mfa/device' && root.key?('deviceId')))
    return unless placed && root['success'] != true && !own_answer

    echo = ls_echo_key(root)
    shape = root.reject { |k, _v| %w[targetType targetId].include?(k) }
    if echo.nil?
      return if ls_pc_owns?(root, info)
      return if ls_unnamed_shape?(shape) && ls_refusal_ok?(route, info, shape, row)
    elsif echo != :bad && !ls_hidden?(echo) && ls_refusal_ok?(route, info, shape, row) && ls_refusal_gate_ok?(route, shape, echo, ls_time(row))
      judged << root
      return
    end
    reported << root
    add.call('lock_step_answer', "lockstep:refusal:#{route}", '$')
  end

  # R1-SCANNER10: the server answers anything but `expired` and the generic `message` only against a live record of the right
  # kind (with none it answers `expired`, and on the wrong route 404): the lock's gate, of a kind its route serves, still fresh.
  def ls_refusal_gate_ok?(route, shape, echo, now)
    return true if [%w[expired success], %w[message success]].include?(shape.keys.sort)

    gate = @ls_gates[echo]
    # a prompt is sent for a number lock too (the real run: the owner is asked, and the number is answered on the phone), so the
    # refusals of prompt and approve are those of any push kind; only a pass keeps the narrower LS_ROUTE_KINDS
    kinds = route.to_s == 'mfa/verify' ? LS_ROUTE_KINDS['verify'] : LS_PUSH_KINDS
    !gate.nil? && !kinds.nil? && kinds.include?(gate[:kind]) && ls_fresh?(gate, now) ? true : false
  end

  # With a PC step open the answer may be that PC's (it has no echo, the lock's always has): the PC rules judge it.
  # An answer a PC's form sends with its `message` (mfaIncorrect, stale, expired, codeLocked, tooSoon) and which has none is the
  # lock's with its echo dropped, so it is not the PC's (only the shapes of both forms alike, a cancel and a waiting prompt, can be).
  # R1-SCANNER8: and only a PC step of a kind this route serves can have given it (a code step answers on verify; a push step on
  # prompt and approve).
  def ls_pc_owns?(root, info)
    return false if @mfa_pending.empty? || !root.keys.all? { |k| LS_PC_REFUSAL_KEYS.include?(k) }

    served = info[:route].to_s == 'mfa/verify' ? %w[code] : LS_PUSH_KINDS
    return false unless @mfa_pending.values.any? { |rec| served.include?(rec[:kind]) }

    root.key?('message') || (root.keys & LS_PC_MESSAGE_KEYS).empty?
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
    return status == 200 if root.key?('approved') && root['approved'] == false && ls_int_in?(root['promptsSent'], 1, BreakEscape::MfaModel::MAX_PROMPTS) &&
                            (!root.key?('waiting') || LS_WAITING_VALUES.include?(root['waiting']))
    return false if root.key?('approved')
    return false unless status == 422

    ok = true
    ok &&= %w[used expired].include?(root['stale']) if root.key?('stale')
    ok &&= root['mfaIncorrect'] == true if root.key?('mfaIncorrect')
    ok &&= root['expired'] == true if root.key?('expired')
    ok &&= root['cancelled'] == true if root.key?('cancelled')
    # R2-SCANNER5: the integers are the server's own: the prompt count up to MAX_PROMPTS, the wait to the next prompt up to
    # PROMPT_GAP_SECONDS, the wait of a closed code step up to CODE_CLOSED_SECONDS
    ok &&= root['tooSoon'] == true && ls_int_in?(root['retryAfterS'], 1, BreakEscape::MfaModel::PROMPT_GAP_SECONDS) if root.key?('tooSoon')
    ok &&= root['codeLocked'] == true && ls_int_in?(root['retryIn'], 1, BreakEscape::MfaModel::CODE_CLOSED_SECONDS) if root.key?('codeLocked')
    ok &&= root['message'].is_a?(String) if root.key?('message')
    ok
  end

  def ls_int_in?(value, low, high)
    value.is_a?(Integer) && value.between?(low, high)
  end

  # ---- opens, and contents and room data ---------------------------------------------------------------------------

  # Which gated locks an answer's contents or roomData could belong to, by the ids it carries.
  # `loose` (R1-SCANNER5): room data that lists no id of any room of the scenario belongs to every shut gated door
  def ls_content_owners(hash, loose: true, door_open: false)
    owners = Set.new
    if hash['contents'].is_a?(Array)
      ids = hash['contents'].filter_map { |e| e['id'] if e.is_a?(Hash) && e['id'].is_a?(String) }
      @ls_locks.each { |key, l| owners << key if l[:type] == 'object' && !(l[:contents_ids] & ids).empty? }
      [hash['id'], hash['container_id']].each { |id| owners << "object:#{id}" if id.is_a?(String) && @ls_locks.key?("object:#{id}") }
    end
    if hash['roomData'].is_a?(Hash)
      # the ids it lists: its objects and what is in them, its NPCs and what they hold
      ids = ls_ids(hash['roomData']['objects']) + ls_ids(hash['roomData']['npcs'])
      # owner decision (2026-11-24, R3-SCANNER2): only the root room data of a 200 POST unlock door open that lists no object and no NPC
      # carries nothing a rule could protect; everywhere else id-less room data belongs to every shut gated door
      # R4-1: "no objects and no NPCs" means both lists absent or empty, not "no string ids" (id-less entries are content)
      empty_room = door_open && Array(hash['roomData']['objects']).empty? && Array(hash['roomData']['npcs']).empty?
      unknown = loose && (ids.to_set & @ls_known_ids).empty? && !empty_room
      @ls_locks.each do |key, l|
        next unless l[:type] == 'door'

        owners << key if unknown || !((l[:room_ids] | l[:npc_ids]) & ids).empty?
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
    if (hash['objects'].is_a?(Array) && !hash['objects'].empty? || hash['npcs'].is_a?(Array) && !hash['npcs'].empty?) && parts.size >= 2 && parts[-2] == 'rooms'
      owners << "door:#{parts[-1]}" if @ls_locks.key?("door:#{parts[-1]}")
    end
    room = hash['room_id']
    if room.is_a?(String) && @ls_locks.key?("door:#{room}")
      listed = false
      mfa_walk(hash) { |h, _p, _k| listed ||= (h['objects'].is_a?(Array) && !h['objects'].empty?) || (h['npcs'].is_a?(Array) && !h['npcs'].empty?) }
      owners << "door:#{room}" if listed
    end
    owners
  end

  # The lock key a 200 POST unlock open (`success: true`) of a gated lock is for, when it has its proof; nil when it is no open of
  # a gated lock. The open names its lock at the root (`targetType`, `targetId`, as the three /mfa routes do); an open that carries
  # a gated lock's contents or room data and names none is a finding, as is one that names another lock than the one whose content
  # it carries. Returns [key or nil, locks it has made findings of].
  def ls_judge_open(root, info, unlock, add, judged)
    return [nil, []] unless root && unlock && info[:ok] && root['success'] == true

    echo = ls_echo_key(root)
    candidates = ls_content_owners(root, loose: false)
    return [nil, []] if echo.nil? && candidates.empty?

    if echo.nil?
      add.call('lock_step_answer', 'lockstep:open:no-echo', '$')
      return [nil, candidates]
    end
    if echo == :bad
      add.call('lock_step_answer', 'lockstep:open:echo', '$')
      return [nil, candidates]
    end

    judged << root
    unless @ls_passed.include?(echo) || @ls_opened.include?(echo)
      add.call('lock_step_content', "lockstep:open:#{echo}", '$') # a gate and no pass, or no gate
      return [nil, [echo] | candidates]
    end
    others = candidates - [echo] - @ls_opened.to_a
    unless others.empty?
      add.call('lock_step_content', "lockstep:content:#{others.min}", '$') # another lock's content, carried by this lock's open
      return [nil, [echo] | candidates]
    end
    # the open says what it opened: an object lock's is `type: object`, a door's `type: door`
    unless root['type'] == @ls_locks[echo][:type]
      add.call('lock_step_answer', "lockstep:open:type:#{echo}", '$')
      return [nil, [echo]]
    end
    # R2-SCANNER4: a door whose lock authors ids is served with some of them (a repeat open, `alreadyOpen`, excepted)
    lock = @ls_locks[echo]
    if lock[:type] == 'door' && root['roomData'].is_a?(Hash) && !root.key?('alreadyOpen') && !(lock[:room_ids] | lock[:npc_ids]).empty?
      listed = (ls_ids(root['roomData']['objects']) + ls_ids(root['roomData']['npcs'])).to_set
      if ((lock[:room_ids] | lock[:npc_ids]) & listed).empty?
        add.call('lock_step_answer', "lockstep:open:room:#{echo}", '$')
        return [nil, [echo]]
      end
    end
    # R1-SCANNER9: and holds only the keys games_controller#unlock can send for that type
    unless (root.keys - LS_OPEN_KEYS - LS_OPEN_KEYS_BY_TYPE[@ls_locks[echo][:type]] - LS_STATE_KEYS).empty? # a state key is the secret rule's
      add.call('lock_step_answer', "lockstep:open:key:#{echo}", '$')
      return [nil, [echo]]
    end
    [echo, []]
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
      placed_open = (open_key || !open_reported.empty?) && excused.any? { |h| h.equal?(hash) } # R1-SCANNER5: the placed open's own room data names its lock by the echo
      door_open = hash.equal?(body) && info[:ok] && info[:method] == 'POST' && info[:path].match?(%r{/games/[^/]+/unlock\z}) && hash['success'] == true && hash['type'] == 'door'
      owners = ls_content_owners(hash, loose: !placed_open, door_open: door_open) | ls_id_owners(hash) | ls_room_owners(hash, path)
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

  # A 200 POST npc_workaround answer of a `prop_door` that opens a gated room: `{ roomId, roomData }` (and `setGlobal`), the server
  # opening the room with no step by the plan. Allowed only when the answer names a gated door, carries exactly that door's room data,
  # and the scenario authors that prop for that door in a room NPC's workarounds. Returns the lock key, or nil.
  def ls_judge_prop_door(root, info)
    return nil unless root && info[:method] == 'POST' && info[:ok] && info[:path].match?(%r{/games/[^/]+/npc_workaround\z})
    return nil unless root['roomData'].is_a?(Hash) && root['roomId'].is_a?(String)
    return nil unless (root.keys - %w[roomId roomData setGlobal]).empty? && root['success'] != false

    key = "door:#{root['roomId']}"
    return nil unless @ls_locks.key?(key) && @ls_prop_doors.include?(root['roomId'])
    return nil unless ls_content_owners(root) == [key]

    key
  end

  # What a reward answer proves: a 200 POST /flags answer whose `rewards` holds a successful `unlock_door` for a gated door the
  # scenario authors that reward for; the server has opened the room (unlock_room!), so GET room/<it> is honest afterwards.
  def ls_earn_door_routes(root, info, prop_key)
    @ls_opened << prop_key if prop_key
    return unless root && info[:method] == 'POST' && info[:ok] && info[:path].match?(%r{/games/[^/]+/flags\z}) && root['success'] == true && root['rewards'].is_a?(Array)

    root['rewards'].each do |r|
      # R2-SCANNER3: an `unlock_object` reward for a gated object the scenario authors that reward for stands in for the pass; the
      # echoed open then moves it to opened as any pass does
      if r.is_a?(Hash) && r['type'] == 'unlock_object' && r['objectId'].is_a?(String)
        # R3-SCANNER4: the answer's own station must author that reward; the server accepts the object's id or its name
        authored = r['flag_station_id'].is_a?(String) && @ls_reward_objects[r['flag_station_id']]&.include?(r['objectId'])
        key = @ls_locks.find { |k, l| l[:type] == 'object' && [l[:id], l[:name]].include?(r['objectId']) }&.first
        @ls_passed << key if authored && key && !ls_hidden?(key)
        next
      end
      next unless r.is_a?(Hash) && r['type'] == 'unlock_door' && r['success'] == true && r['room_id'].is_a?(String)

      @ls_rooms << r['room_id'] if @ls_reward_doors.include?(r['room_id']) # R4-3: the reward ran unlock_room!
      key = "door:#{r['room_id']}"
      @ls_opened << key if @ls_locks.key?(key) && @ls_reward_doors.include?(r['room_id'])
    end
  end

  # ---- numbers and codes ------------------------------------------------------------------------------------------

  def ls_judge_secrets(body, info, add, judged, open_key = nil)
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
      # R2-SCANNER4: inside a placed open nothing carries `number` or `attemptsLeft`, under any key
      if open_key && !hash.equal?(body)
        add.call('lock_step_secret', 'lockstep:key:number', safe_path("#{path}.number")) if hash.key?('number') && !judged.any? { |j| j.equal?(hash) }
        add.call('lock_step_answer', "lockstep:open:key:#{open_key}", safe_path("#{path}.attemptsLeft")) if hash.key?('attemptsLeft')
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
    elsif !(echo.nil? && ls_pc_owns?(root, info))
      kinds = LS_ROUTE_KINDS[info[:route].sub('mfa/', '')]
      @ls_gates.delete_if { |_k, g| kinds.include?(g[:kind]) }
    end
  end
end
