# frozen_string_literal: true

module BreakEscape
  # Second step on any lock (S8c, unit 13): the gate answer and the /mfa/* lock actions.
  #
  # The gate runs after a lock's own first factor was judged right. The actions are the lock form
  # of S8a's sign-in calls: the same MfaAccess subject functions over the `lockSteps` map, keyed
  # "<kind>:<id>" (mfa_subject_key). Every action answers [body, status] (symbol keys, a status
  # symbol) or a symbol: :not_found (404), :no_device or :no_phone (403). No row ever holds a code,
  # a number, a password or a first factor. Time comes only through mfa_now.
  module LockStepGate
    extend ActiveSupport::Concern

    # The first factors a mfa_challenge row may name (the event's `method` detail list)
    GATE_METHODS = %w[key lockpick rfid biometric bluetooth ble pin password combination cryptex npc].freeze

    # nil (nothing to do, or a passed record: go on and open) or the gate answer Hash. `resolved`
    # is { object:, path: } as resolve_unlock_target answers. A live unpassed record is answered
    # again with no write and no row; otherwise the step is issued, a mfa_challenge row written,
    # and for an `npc` first factor at a door the opener noted. Never answers for a lock that has
    # passed or is open.
    def lock_step_gate(target_type, target_id, method, resolved: nil)
      target = lock_step_gate_target(target_type, target_id, resolved)
      return nil unless target
      return nil if lock_step_open?(target)
      # Rule C: never a gate for a lock below a closed gated container (the caller refuses it)
      return nil if target[:subject][:kind] == 'object' && lock_step_below_closed?(target, resolved)
      return nil if target[:subject][:kind] == 'object' && method.to_s == 'flag_reward' &&
                    flag_reward_unlocks_object?(target[:object])

      map = lock_steps_map
      record = map[target[:key]]
      return nil if record.is_a?(Hash) && record['passed'] == true

      owner = target[:step]['owner'].to_s
      kind = target[:step]['kind']
      fresh = !(record.is_a?(Hash) && record['kind'] == kind)
      # A step with no owner can never pass: answer the gate, keep no record (every action then 404s)
      if fresh && !owner.empty?
        record = issue_second_step!(map, target[:key], owner, kind, 'npcId' => owner)
        write_log_row!('mfa_challenge', as: { npc: owner }, where: lock_step_where(target),
                                        detail: GATE_METHODS.include?(method.to_s) ? { 'method' => method.to_s } : nil)
        note_npc_step_grant!(target[:subject][:id], owner) if target[:subject][:kind] == 'door' && method.to_s == 'npc'
        save!
      end

      lock_step_gate_body(target, record, owner, kind, method)
    end

    # POST the typed code for a lock's pending `code` step. [body, status] or :not_found / :no_device.
    def verify_lock_code!(target_type, target_id, code = nil, **_opts)
      target = lock_step_action_target(target_type, target_id)
      return :not_found unless target && target[:step]['kind'] == 'code' && target[:step]['owner'].to_s != ''

      owner = target[:step]['owner']
      device = held_code_device(owner)
      return :no_device unless device

      map = lock_steps_map
      record = map[target[:key]]
      return lock_step_dropped unless record.is_a?(Hash) && record['kind'] == 'code' && record['passed'] != true

      result = verify_second_step_code(map, target[:key], target[:subject], code.to_s, device['id'], npc_id: owner)
      result, closing = result if result.is_a?(Array) && result.last == :closed && %i[wrong expired].include?(result.first)
      as = { npc: owner }
      where = lock_step_where(target)
      case result
      when :passed
        map[target[:key]]['passed'] = true
        write_log_row!('mfa_code_ok', as: as, where: where)
        save!
        [{ success: true, stepPassed: true }, :ok]
      when :wrong, :expired
        write_log_row!('mfa_code_wrong', as: as, where: where, result: 'fail')
        write_log_row!('mfa_expired', as: as, where: where, result: 'expired') if result == :expired
        write_log_row!('mfa_code_locked', as: as, where: where, result: 'locked') if closing == :closed
        save!
        [result == :expired ? { success: false, expired: true } : { success: false, mfaIncorrect: true },
         :unprocessable_entity]
      when :malformed
        [{ success: false, mfaIncorrect: true }, :unprocessable_entity]
      else
        kind, extra = result
        save!
        if kind == :stale
          [{ success: false, stale: extra }, :unprocessable_entity]
        else
          [{ success: false, codeLocked: true, retryIn: extra }, :unprocessable_entity]
        end
      end
    end

    # POST a push request for a lock's pending push step. [body, status] or :not_found.
    def prompt_lock!(target_type, target_id, *_args, **_opts)
      target = lock_step_action_target(target_type, target_id)
      return :not_found unless lock_step_push_target?(target)

      owner = target[:step]['owner']
      map = lock_steps_map
      record = map[target[:key]]
      return lock_step_dropped unless lock_step_live_push?(record)

      capped = record['n'].to_i >= MfaModel::MAX_PROMPTS
      result = send_second_step_prompt(map, target[:key], target[:subject], npc_id: owner, reenrolled: false)
      as = { npc: owner }
      where = lock_step_where(target)
      if result.is_a?(Array) && result.first == :too_soon
        return [{ success: false, tooSoon: true, retryAfterS: result.last }, :unprocessable_entity]
      end
      if result == :expired
        write_log_row!('mfa_expired', as: as, where: where, result: 'expired') if capped
        save!
        return lock_step_dropped
      end

      write_log_row!('mfa_prompt_sent', as: as, where: where)
      return lock_step_passed!(target, as, where, approver: 'owner', approved_by: 'owner') if result == :passed

      body = { success: false, approved: false, promptsSent: record['n'].to_i }
      body[:waiting] = result.last if result.is_a?(Array) && result.first == :waiting
      save!
      [body, :ok]
    end

    # POST the player's answer from the owner's held phone: a number, or a deny. [body, status],
    # :not_found or :no_phone (the phone of the owner is not held).
    def approve_lock!(target_type, target_id, number: nil, deny: false, **_opts)
      target = lock_step_action_target(target_type, target_id)
      return :not_found unless lock_step_push_target?(target)

      owner = target[:step]['owner']
      map = lock_steps_map
      record = map[target[:key]]
      return lock_step_dropped unless lock_step_live_push?(record)
      return :no_phone unless held_friendface_phone(owner)

      if record['kind'] == 'push_number_match' && deny != true && number.nil?
        # no usable number is a malformed request, not an answer: the step stays
        return [{ success: false, message: Game::LOGIN_INCORRECT }, :unprocessable_entity]
      end

      result = approve_second_step(map, target[:key], target[:subject], npc_id: owner, number: number,
                                                                          deny: deny == true, reenrolled: false)
      as = { npc: owner }
      where = lock_step_where(target)
      case result
      when :no_phone then :no_phone
      when :cancelled
        write_log_row!('mfa_prompt_denied', as: as, where: where, result: 'denied')
        save!
        [{ success: false, cancelled: true }, :unprocessable_entity]
      else
        lock_step_passed!(target, as, where, approver: 'held_phone', approved_by: 'player')
      end
    end

    # GET /mfa/phone for a lock: :no_phone unless the owner's phone is held, else
    # { requests: [one request] } (none when that lock has no waiting push, is not the owner's,
    # is open, or is out of reach). `numbers` is sorted ascending, so the right one's place shows
    # nothing. Reads only: no save. The owner is the third argument or `npc_id:`.
    def lock_phone_answer(target_type, target_id, npc_id = nil, **opts)
      npc_id = opts[:npc_id] if npc_id.nil?
      return :no_phone unless npc_id.is_a?(String) && !npc_id.empty? && held_friendface_phone(npc_id)

      target = lock_step_action_target(target_type, target_id)
      return { requests: [] } unless lock_step_push_target?(target) && target[:step]['owner'] == npc_id

      record = lock_steps_map[target[:key]]
      return { requests: [] } unless record.is_a?(Hash)

      entry = second_step_requests([{ kind: target[:subject][:kind], map: { target[:subject][:id] => record } }],
                                   npc_id: npc_id).first
      return { requests: [] } unless entry

      row = { targetType: target[:subject][:kind], targetId: target[:subject][:id], name: lock_step_name(target),
              n: entry['n'] }
      row[:numbers] = entry['numbers'].sort if entry['numbers']
      { requests: [row] }
    end

    private

    # The gate's target: lock_step_for's answer, except that the object the controller already
    # resolved (it may have been named by its name or client id) is used when it is a gated object
    # with an id
    def lock_step_gate_target(target_type, target_id, resolved)
      if target_type.to_s == 'object' && resolved.is_a?(Hash) && resolved[:object].is_a?(Hash)
        object = resolved[:object]
        id = object['id']
        step = BreakEscape::LockStepModel.lock_step(object)
        return nil unless step && id.is_a?(String) && second_step_ids.include?(id)

        subject = { kind: 'object', id: id }
        return { subject: subject, key: mfa_subject_key(subject), step: step, object: object }
      end
      return nil unless %w[object door].include?(target_type.to_s)

      lock_step_for(target_type, target_id)
    end

    # The target of a /mfa/* lock action, or nil (the caller answers :not_found): exact ids only,
    # not open, not below a closed step, and within reach (a carried object that has left the
    # player is gone)
    def lock_step_action_target(target_type, target_id)
      return nil unless %w[object door].include?(target_type.to_s)

      target = lock_step_for(target_type, target_id)
      return nil unless target
      return nil if lock_step_open?(target)

      if target[:subject][:kind] == 'object'
        found = resolve_unlock_target(target[:subject][:id])
        return nil unless found && found[:object]['id'] == target[:subject][:id]
        return nil if behind_closed_step?(found[:path]) || !carried_step_reachable?(found[:object], found[:path]) ||
                    step_room_unreached?(found[:object], found[:path])

        target = target.merge(object: found[:object])
      end
      target
    end

    def lock_step_below_closed?(target, resolved)
      path = resolved.is_a?(Hash) ? resolved[:path] : resolve_unlock_target(target[:subject][:id])&.dig(:path)
      behind_closed_step?(path)
    end

    def lock_step_open?(target)
      if target[:subject][:kind] == 'door'
        room_unlocked?(target[:subject][:id])
      else
        step_object_open?(target[:object])
      end
    end

    def lock_step_push_target?(target)
      target && MfaAccess::PUSH_KINDS.include?(target[:step]['kind']) && target[:step]['owner'].to_s != ''
    end

    def lock_step_live_push?(record)
      record.is_a?(Hash) && record['passed'] != true && MfaAccess::PUSH_KINDS.include?(record['kind'])
    end

    def lock_step_where(target)
      { kind: target[:subject][:kind], id: target[:subject][:id] }
    end

    # The answer for a step with no live record: the client starts again from the first factor
    # (which opens a passed lock without a gate)
    def lock_step_dropped
      [{ success: false, expired: true }, :unprocessable_entity]
    end

    def lock_step_passed!(target, as, where, approver:, approved_by:)
      lock_steps_map[target[:key]]['passed'] = true
      write_log_row!('mfa_prompt_approved', as: as, where: where, detail: { 'approver' => approver })
      save!
      [{ success: true, stepPassed: true, approvedBy: approved_by }, :ok]
    end

    def lock_step_name(target)
      if target[:object]
        target[:object]['name'].to_s.presence || target[:subject][:id]
      else
        room = target[:room]
        [room['door_sign'], room['name']].find { |t| t.is_a?(String) && !t.empty? } || target[:subject][:id]
      end
    end

    # Section 4.3's gate body. `number` only for number matching; `opener` only for a door
    # opened by an NPC (the owner).
    def lock_step_gate_body(target, record, owner, kind, method)
      body = { success: false, secondStep: true, kind: kind, targetType: target[:subject][:kind],
               targetId: target[:subject][:id], npcId: owner }
      if kind == 'push_number_match' && record.is_a?(Hash)
        body[:number] = second_step_numbers(target[:subject], record, npc_id: owner)[:right]
      end
      body[:opener] = owner if target[:subject][:kind] == 'door' && method.to_s == 'npc'
      body
    end
  end
end
