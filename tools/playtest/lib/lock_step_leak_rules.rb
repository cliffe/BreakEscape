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
# Every rule is structural (judged by key and by which earlier answer earned what, never by matching
# strings) and fails closed: where the proof is missing, ambiguous or malformed, the value is a finding.
# The recorder writes no request body for POST /unlock or POST /mfa/*, so a request's lock is placed by
# the earlier gate answer (which names it): a pass answer is placed to the ONE open gate its route can
# close, an open answer to the ONE passed lock whose authored contents or room it carries. Two
# candidates, or none, is a finding.
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

  private

  # ---- state ----------------------------------------------------------------------------------------------------

  # One scan's state, rebuilt whenever mfa_begin_scan has made a new @mfa_pending (it does so once per scan).
  def ls_bind
    return if @ls_bound.equal?(@mfa_pending)

    @ls_bound = @mfa_pending
    @ls_locks = {}   # "object:<id>" | "door:<room>" => { type:, id:, kind:, owner:, contents_ids:, room_ids: }
    @ls_gates = {}   # lock key => { at:, kind:, npc:, number: }: a gate answer not yet passed
    @ls_passed = Set.new
    @ls_opened = Set.new
    anon = 0
    BreakEscape::LockStepModel.each_lock_step(@data).each do |entry|
      type = entry[:kind].to_s
      id = entry[:id]
      key = id ? "#{type}:#{id}" : "anon:#{anon += 1}"
      next if @ls_locks.key?(key)

      lockable = entry[:lockable]
      step = entry[:step]
      list = type == 'door' ? lockable['objects'] : lockable['contents']
      @ls_locks[key] = { type: type, id: id, kind: step['kind'], owner: step['owner'], contents_ids: ls_ids(list).to_set,
                         room_ids: type == 'door' ? ls_ids(list).to_set : Set.new }
    end
    @ls_active = !@ls_locks.empty?
  end

  def ls_ids(list)
    Array(list).flat_map do |o|
      o.is_a?(Hash) ? [o['id'], *ls_ids(o['contents'])].select { |v| v.is_a?(String) && !v.empty? } : []
    end
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

  # ---- one answer -----------------------------------------------------------------------------------------------

  def scan_lock_steps(body, row, add)
    ls_bind
    return unless body.is_a?(Hash) || body.is_a?(Array)

    info = mfa_route(row)
    now = ls_time(row)
    root = body.is_a?(Hash) ? body : nil
    unlock = info[:method] == 'POST' && info[:path].match?(%r{/games/[^/]+/unlock\z})
    judged = [] # hashes (by identity) a rule below has placed
    earn = []   # what this answer proves for the answers after it, applied last

    ls_judge_state_keys(body, add)
    ls_judge_gate(root, info, unlock, now, add, judged, earn)
    ls_judge_pass(root, info, now, add, judged, earn)
    ls_judge_phone(body, info, now, add, judged)
    ls_judge_refusal(root, info, row, add)
    open_key, open_reported = ls_judge_open(root, info, unlock, add)
    ls_judge_contents(body, info, open_key, open_reported, add)
    ls_judge_secrets(body, info, add, judged)
    ls_judge_unplaced(body, add, judged)
    ls_earn(earn, open_key, root, info, row)
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
    keys -= ['opener'] if lock[:type] == 'door' && body['opener'] == lock[:owner]
    return nil unless keys.sort == expected.sort
    return nil if lock[:kind] == 'push_number_match' && !(body['number'].is_a?(Integer) && LS_NUMBER_RANGE.cover?(body['number']))

    "#{body['targetType']}:#{body['targetId']}"
  end

  def ls_judge_gate(root, info, unlock, now, add, judged, earn)
    return unless root && (root['secondStep'] == true)

    key = ls_gate_key(root, info, unlock)
    # a gate for a lock that already passed or opened is not an answer the server gives
    if key.nil? || @ls_passed.include?(key) || @ls_opened.include?(key)
      add.call('lock_step_answer', "lockstep:gate:#{key || 'unplaced'}", '$')
      return
    end

    judged << root
    earn << [:gate, key, { at: now, kind: root['kind'], npc: root['npcId'], number: root['number'] }]
  end

  # ---- pass answers -----------------------------------------------------------------------------------------------

  def ls_judge_pass(root, info, now, add, judged, earn)
    return unless root && root.key?('stepPassed')

    route = info[:route].to_s.sub('mfa/', '')
    gates = ls_pass_gates(root, info, route, now)
    if gates.size == 1
      judged << root
      earn << [:pass, gates.first, nil]
    else
      add.call('lock_step_answer', "lockstep:pass:#{gates.empty? ? 'no-gate' : 'ambiguous'}", '$')
    end
  end

  # The open gates this pass answer could close: route, shape and owner proofs; empty unless all hold.
  def ls_pass_gates(body, info, route, now)
    return [] unless info[:method] == 'POST' && info[:ok] && LS_ROUTE_KINDS.key?(route) && info[:route] == "mfa/#{route}"

    expected = %w[stepPassed success]
    expected << 'approvedBy' if LS_APPROVED_BY.key?(route)
    return [] unless body.keys.sort == expected.sort && body['success'] == true && body['stepPassed'] == true
    return [] unless !LS_APPROVED_BY.key?(route) || body['approvedBy'] == LS_APPROVED_BY[route]

    @ls_gates.select do |_key, gate|
      next false unless LS_ROUTE_KINDS[route].include?(gate[:kind]) && ls_fresh?(gate, now)

      case route
      when 'prompt' then @priv_npcs.key?(gate[:npc]) && mfa_owner_may_approve?(gate[:npc])
      when 'approve' then mfa_phone_taken?(gate[:npc])
      else true
      end
    end.keys
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
    return false unless entry['name'].is_a?(String) && entry['n'].is_a?(Integer) && entry['n'].between?(0, BreakEscape::MfaModel::MAX_PROMPTS)
    return true unless lock[:kind] == 'push_number_match'

    nums = entry['numbers']
    nums.is_a?(Array) && nums.size == 3 && nums.all? { |v| v.is_a?(Integer) && LS_NUMBER_RANGE.cover?(v) } &&
      nums == nums.uniq.sort && nums.include?(gate[:number])
  end

  # ---- refusals ----------------------------------------------------------------------------------------------------

  # A non-pass answer of POST mfa/verify, prompt or approve, or an error answer of the phone or device. With a lock gate open and
  # no PC step open it must be exactly a shape of the lock's list; with a PC step open too, keys of either list are allowed.
  def ls_judge_refusal(root, info, row, add)
    return unless root && @ls_active && !root.key?('stepPassed')

    route = mfa_route_name(info)
    placed = (info[:method] == 'POST' && LS_REFUSAL_SHAPES.key?(route)) || (info[:method] == 'GET' && %w[mfa/phone mfa/device].include?(route))
    # a PC's pass answer, and the 200 answers of the phone and the device, are judged elsewhere
    return unless placed && root['success'] != true && !root.key?('requests') && !root.key?('deviceId')
    return if ls_refusal_ok?(route, info, root, row) || ls_pc_refusal_context?(root)

    add.call('lock_step_answer', "lockstep:refusal:#{route}", '$')
  end

  # With a PC step open the answer may be that PC's; it is judged only on the union of keys then.
  def ls_pc_refusal_context?(root)
    !@mfa_pending.empty? && root.keys.all? { |k| LS_PC_REFUSAL_KEYS.include?(k) }
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
                            (!root.key?('waiting') || root['waiting'].is_a?(String))
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

    mfa_walk(body) do |hash, path, _parent|
      owners = ls_content_owners(hash)
      owners |= ["object:#{info[:container]}"] if info[:container] && hash.equal?(body) && hash.key?('contents') && @ls_locks.key?("object:#{info[:container]}")
      owners.each do |key|
        next if @ls_opened.include?(key) || (hash.equal?(body) && (key == open_key || open_reported.include?(key)))

        at = hash['roomData'].is_a?(Hash) ? "#{path}.roomData" : "#{path}.contents"
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
      if hash.key?('numbers') && !hash.key?('pcId') && !judged.any? { |j| j.equal?(hash) }
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

  def ls_earn(earn, open_key, root, info, row)
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
    # closing is the safe direction: a cancel, an expiry or a closed code ends the gates of the kinds the route handles
    return unless root && info[:method] == 'POST' && LS_ROUTE_KINDS.key?(info[:route].to_s.sub('mfa/', '')) && !root.key?('stepPassed')

    @ls_gates.delete_if { |_k, g| LS_ROUTE_KINDS[info[:route].sub('mfa/', '')].include?(g[:kind]) } if root['cancelled'] == true || root['expired'] == true || root['codeLocked'] == true
  end
end
