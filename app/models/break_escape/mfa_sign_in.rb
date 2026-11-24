# frozen_string_literal: true

module BreakEscape
  # What belongs to the sign-in second step alone (S8a, feature A22): when a typed sign-in owes a
  # second step, the pending record it leaves, and the code check that finishes it. The subject
  # functions (records, code verification) live in MfaAccess; both are included in Game. Every
  # grant here is a server decision from server-held state. Time comes only through `mfa_now`.
  module MfaSignIn
    extend ActiveSupport::Concern

    # The server's wall clock, through its one seam
    def mfa_now
      Time.current.to_i
    end

    # The policy's second-step kind at a PC: none, push, push_number_match or code
    def mfa_kind_for(pc)
      MfaModel.kind(effective_policy(pc))
    end

    # S8b seam: whether the account has been re-enrolled onto its own phone. Nothing can do that yet.
    def mfa_reenrolled?(_npc_id)
      false
    end

    # The kind of second step this account owes at this PC, or 'none': none when the policy asks
    # for none, the account is not enrolled, the PC already holds this account's own locked
    # session (unlocking needs no step), or the kind is code and no device is declared.
    def mfa_step_for(pc, npc)
      kind = mfa_kind_for(pc)
      return 'none' if kind == 'none' || !MfaModel.enrolled?(npc)

      held = access_sessions[pc['id'].to_s]
      return 'none' if held.is_a?(Hash) && held['id'].to_s == npc['id'].to_s && session_locked?(held)
      return 'none' if kind == 'code' && MfaModel.device_for(scenario_data, npc['id']).nil?

      kind
    end

    # The refusal Hash a pending second step meets when the first step would now be refused (the
    # route no longer open, the account no longer admitted), or nil. Judged as the first step is.
    def second_step_refusal(pc, pending)
      info = find_login_pc(pc['id'])
      return { status: :not_found, body: { success: false, message: 'Sign-in PC not found' } } unless info

      refusal = typed_route_refusal(info, foothold: pending['foothold'].presence&.to_s, from: pending['from'],
                                          from_given: pending['fromGiven'] == true)
      return refusal if refusal

      npc = mfa_pending_account(pending)
      return credential_login_refusal unless npc
      return nil if pc_admits_account?(info[:object], npc)

      { status: :unprocessable_entity, body: { success: false, message: Game::LOGIN_NOT_PERMITTED, notPermitted: true } }
    end

    # The inventory entry (unwrapped from scenarioData) that is the account's authored code
    # device: same type, id and owner, and not a client forgery. nil when not held.
    def held_code_device(npc_id)
      device = MfaModel.device_for(scenario_data, npc_id)
      return nil unless device

      Array(player_state['inventory']).each do |inv|
        next unless inv.is_a?(Hash)
        next if ItemIdentity.client_forged?(inv)

        data = inv['scenarioData'] || inv
        next unless data.is_a?(Hash)
        return data if data['type'].to_s == device['type'].to_s && data['id'].to_s == device['id'].to_s &&
                       data['owner'].to_s == device['owner'].to_s
      end
      nil
    end

    # GET /mfa/device: :not_found when no policy declares an mfa kind (or no such device),
    # :no_device unless the device is held, else what the device shows. The only place a code
    # reaches the browser.
    def mfa_device_answer(item_id)
      return :not_found unless mfa_declared?

      device = MfaModel.each_authored_item(scenario_data).map { |e| e[:item] }.find do |item|
        item['type'] == MfaModel::CODE_DEVICE && item['id'].is_a?(String) && item['id'] == item_id.to_s
      end
      return :not_found unless device

      owner = device['owner'].to_s
      return :no_device unless held_code_device(owner)

      npc = scenario_room_npc(owner)
      now = mfa_now
      window = now / MfaModel::STEP_SECONDS
      used = mfa_account_for(owner)['used']
      { deviceId: device['id'], displayName: (npc && (npc['displayName'] || npc['id'])) || owner, npcId: owner,
        code: code_device_code(device['id'], window),
        secondsLeft: MfaModel::STEP_SECONDS - (now % MfaModel::STEP_SECONDS),
        used: !used.nil? && used.to_i >= window }
    end

    # POST the code for a pending second step at a PC. Returns { status:, body: }.
    def verify_sign_in_code!(pc_id, code)
      info = find_login_pc(pc_id)
      return { status: :not_found, body: { success: false, message: 'Sign-in PC not found' } } unless info

      pc = info[:object]
      map = mfa_pending_map
      tidy_pending!(map)
      pending = map[pc['id'].to_s]
      return credential_login_refusal unless pending.is_a?(Hash) && pending['kind'] == 'code'

      refusal = second_step_refusal(pc, pending)
      return refusal if refusal

      npc = mfa_pending_account(pending)
      key = AccessIdentities.lockout_key(pc['id'], npc['creds']['username'])
      return mfa_locked_out_answer(pc, npc) if login_lockouts.include?(key)

      device = MfaModel.device_for(scenario_data, npc['id'])
      return credential_login_refusal unless device

      result = verify_second_step_code(map, pc['id'].to_s, { kind: 'pc', id: pc['id'].to_s }, code.to_s, device['id'],
                                       npc_id: npc['id'])
      result, closing = result if result.is_a?(Array) && result.last == :closed && %i[wrong expired].include?(result.first)
      case result
      when :passed then mfa_code_passed!(pc, npc, map, key, pending)
      when :wrong, :expired then mfa_code_failed!(pc, npc, key, pending, expired: result == :expired, closing: closing == :closed)
      when :malformed
        { status: :unprocessable_entity, body: { success: false, message: Game::LOGIN_INCORRECT, mfaIncorrect: true } }
      else
        kind, extra = result
        if kind == :stale
          { status: :unprocessable_entity, body: { success: false, message: Game::LOGIN_INCORRECT, stale: extra } }
        else
          { status: :unprocessable_entity,
            body: { success: false, message: Game::LOGIN_INCORRECT, codeLocked: true, retryIn: extra } }
        end
      end
    end

    # POST a push request for a pending second step at a PC (push kinds). The route is re-judged,
    # then MfaAccess sends the prompt. Returns { status:, body: }.
    def prompt_sign_in!(pc_id)
      ctx = push_step_context(pc_id)
      return ctx[:refusal] if ctx[:refusal]

      pc = ctx[:pc]
      npc = ctx[:npc]
      map = ctx[:map]
      pending = ctx[:pending]
      key = pc['id'].to_s
      capped = pending['n'].to_i >= MfaModel::MAX_PROMPTS
      result = send_second_step_prompt(map, key, { kind: 'pc', id: key }, npc_id: npc['id'],
                                                                           reenrolled: mfa_reenrolled?(npc['id']))
      as = { account: npc['creds']['username'] }
      where = { kind: 'pc', id: key }
      if result.is_a?(Array) && result.first == :too_soon
        return { status: :unprocessable_entity,
                 body: { success: false, message: Game::LOGIN_INCORRECT, tooSoon: true, retryAfterS: result.last } }
      end
      if result == :expired
        write_log_row!('mfa_expired', as: as, where: where, result: 'expired') if capped
        save!
        return { status: :unprocessable_entity, body: { success: false, message: Game::LOGIN_INCORRECT, expired: true } }
      end

      write_log_row!('mfa_prompt_sent', as: as, where: where)
      return mfa_push_passed!(pc, npc, map, pending, approver: 'owner', approved_by: 'owner') if result == :passed

      body = { success: false, approved: false, promptsSent: pending['n'].to_i }
      body[:waiting] = result.last if result.is_a?(Array) && result.first == :waiting
      save!
      { status: :ok, body: body }
    end

    # POST the player's answer to a push on the owner's phone: a number (number matching) or a
    # deny. The route is re-judged. :no_phone unless the player holds the phone.
    def approve_sign_in!(pc_id, number: nil, deny: false)
      ctx = push_step_context(pc_id)
      return ctx[:refusal] if ctx[:refusal]

      pc = ctx[:pc]
      npc = ctx[:npc]
      key = pc['id'].to_s
      if ctx[:pending]['kind'] == 'push_number_match' && deny != true && number.nil? &&
         (held_friendface_phone(npc['id']) || mfa_reenrolled?(npc['id']))
        # no usable number is a malformed request, not an answer: the step stays
        return { status: :unprocessable_entity, body: { success: false, message: Game::LOGIN_INCORRECT } }
      end

      result = approve_second_step(ctx[:map], key, { kind: 'pc', id: key }, npc_id: npc['id'], number: number,
                                                                            deny: deny == true,
                                                                            reenrolled: mfa_reenrolled?(npc['id']))
      case result
      when :no_phone then :no_phone
      when :cancelled
        write_log_row!('mfa_prompt_denied', as: { account: npc['creds']['username'] }, where: { kind: 'pc', id: key },
                                            result: 'denied')
        save!
        { status: :unprocessable_entity, body: { success: false, cancelled: true } }
      else
        approver = held_friendface_phone(npc['id']) ? 'held_phone' : 'own_phone'
        mfa_push_passed!(pc, npc, ctx[:map], ctx[:pending], approver: approver, approved_by: 'player')
      end
    end

    # GET /mfa/phone: :no_phone unless the player holds the phone of `npc_id`, else the waiting
    # push requests of this owner's accounts at sign-in PCs.
    def mfa_phone_answer(npc_id)
      return :no_phone unless held_friendface_phone(npc_id)

      mine = mfa_pending_map.select { |_k, rec| rec.is_a?(Hash) && rec['npcId'].to_s == npc_id.to_s }
      npc = account_npcs.find { |n| n['id'].to_s == npc_id.to_s }
      username = npc && npc['creds'].is_a?(Hash) ? npc['creds']['username'] : nil
      requests = second_step_requests([{ kind: 'pc', map: mine }], npc_id: npc_id).filter_map do |entry|
        info = find_login_pc(entry['id'])
        next unless info

        row = { pcId: entry['id'], host: host_label(info[:object]), username: username, n: entry['n'] }
        row[:numbers] = entry['numbers'] if entry['numbers']
        row
      end
      { requests: requests }
    end

    private

    # The PC, its live push record and its account, or a refusal (the first step judged again)
    def push_step_context(pc_id)
      info = find_login_pc(pc_id)
      return { refusal: { status: :not_found, body: { success: false, message: 'Sign-in PC not found' } } } unless info

      pc = info[:object]
      map = mfa_pending_map
      tidy_pending!(map)
      pending = map[pc['id'].to_s]
      unless pending.is_a?(Hash) && MfaAccess::PUSH_KINDS.include?(pending['kind']) && pending['passed'] != true
        return { refusal: credential_login_refusal }
      end

      refusal = second_step_refusal(pc, pending)
      return { refusal: refusal } if refusal

      npc = mfa_pending_account(pending)
      key = AccessIdentities.lockout_key(pc['id'], npc['creds']['username'])
      return { refusal: mfa_locked_out_answer(pc, npc) } if login_lockouts.include?(key)

      { pc: pc, map: map, pending: pending, npc: npc }
    end

    # The push is approved: end the pending step and open the session as a code pass does
    def mfa_push_passed!(pc, npc, map, pending, approver:, approved_by:)
      key = AccessIdentities.lockout_key(pc['id'], npc['creds']['username'])
      map.delete(pc['id'].to_s)
      login_failures.delete(key)
      foothold = pending['foothold'].presence&.to_s
      from = pending['fromGiven'] == true ? pending['from'] : nil
      ended = start_login_session!(pc['id'], npc, 'password', foothold: foothold, from: from)
      write_log_row!('mfa_prompt_approved', as: { account: npc['creds']['username'] },
                                            where: { kind: 'pc', id: pc['id'].to_s }, detail: { 'approver' => approver })
      save!
      answer = login_session_answer(npc, 'password', pc_id: pc['id'], foothold: foothold, from: from)
      { status: :ok, body: with_ended_pc_ids({ success: true }.merge(answer), ended).merge(approvedBy: approved_by) }
    end

    # Whether any policy of the scenario declares a second-step kind
    def mfa_declared?
      policies = scenario_data['policies']
      policies.is_a?(Hash) && policies.values.any? { |p| MfaModel.kind(p) != 'none' }
    end

    def mfa_pending_map
      player_state['mfaPending'] = {} unless player_state['mfaPending'].is_a?(Hash)
      player_state['mfaPending']
    end

    def mfa_pending_account(pending)
      account_npcs.find { |n| n['id'].to_s == pending['npcId'].to_s }
    end

    # The first step passed and the account owes a second: record it and answer. No session is
    # written and the failure counter is not cleared.
    def issue_mfa_challenge!(pc, npc, kind, foothold:, from:, from_given:)
      route = from_given ? 'from' : (foothold.present? ? 'foothold' : 'keyboard')
      extra = { 'npcId' => npc['id'], 'foothold' => foothold.presence, 'from' => from_given ? from : nil,
                'fromGiven' => from_given == true }
      record = issue_second_step!(mfa_pending_map, pc['id'].to_s, npc['id'], kind, extra)
      body = { success: false, mfaRequired: true, mfa: kind, pcId: pc['id'], npcId: npc['id'] }
      if kind == 'push_number_match'
        number = second_step_numbers({ kind: 'pc', id: pc['id'].to_s }, record, npc_id: npc['id'].to_s)[:right]
        body[:number] = number
      end
      write_log_row!('mfa_challenge', as: { account: npc['creds']['username'] }, where: { kind: 'pc', id: pc['id'].to_s },
                                      detail: { 'route' => route })
      save!
      { status: :ok, body: body }
    end

    def mfa_locked_out_answer(pc, npc)
      r = write_log_row!('signin_refused', as: { account: npc['creds']['username'] },
                                           where: { kind: 'pc', id: pc['id'].to_s }, result: 'blocked', save_limit: true)
      save! if r&.stored?
      login_locked_out_answer
    end

    def mfa_code_passed!(pc, npc, map, key, pending)
      map.delete(pc['id'].to_s)
      login_failures.delete(key)
      foothold = pending['foothold'].presence&.to_s
      from = pending['fromGiven'] == true ? pending['from'] : nil
      ended = start_login_session!(pc['id'], npc, 'password', foothold: foothold, from: from)
      write_log_row!('mfa_code_ok', as: { account: npc['creds']['username'] }, where: { kind: 'pc', id: pc['id'].to_s })
      save!
      answer = login_session_answer(npc, 'password', pc_id: pc['id'], foothold: foothold, from: from)
      { status: :ok, body: with_ended_pc_ids({ success: true }.merge(answer), ended) }
    end

    # A wrong code: the lockout failure, the rows, and the answer. record_login_failure! saves.
    def mfa_code_failed!(pc, npc, key, pending, expired:, closing:)
      as = { account: npc['creds']['username'] }
      where = { kind: 'pc', id: pc['id'].to_s }
      tries_left = MfaModel::MAX_CODE_TRIES - pending['tries'].to_i
      write_log_row!('mfa_code_wrong', as: as, where: where, result: 'fail')
      write_log_row!('mfa_expired', as: as, where: where, result: 'expired') if expired
      write_log_row!('mfa_code_locked', as: as, where: where, result: 'locked') if closing
      answer = record_login_failure!(pc, key, account: true)
      return answer if answer[:body][:lockedOut]

      body = answer[:body].merge(mfaIncorrect: true)
      body[:attemptsLeft] = [body[:attemptsLeft], tries_left].compact.min if tries_left.positive? && !expired
      body[:expired] = true if expired
      { status: answer[:status], body: body }
    end
  end
end
