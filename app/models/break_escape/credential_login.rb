# frozen_string_literal: true

module BreakEscape
  # POST /login with a credential (docs/achitechture/CREDENTIAL_KEYRING_PLAN.md, section 7): a
  # held, proven connecting credential signs in at its connectsTo PC by a route its kind allows
  # (section 3.7), without a password. Every check reads the scenario's own registry and the
  # server's own state; nothing the client sends is trusted beyond naming the id and the route.
  #
  # Steps 1 and 2 answer alike for every id the player cannot use (undeclared, unproven, a
  # password id, malformed), so the browser cannot probe the registry; steps 3 and 5 to 8 answer
  # only for a held, proven credential. Nothing in this branch is counted toward a lockout.
  module CredentialLogin
    extend ActiveSupport::Concern

    # The reader's wording for a cancelled card (rfid-minigame.js), reused so the feedback matches.
    CARD_CANCELLED_MESSAGE = 'Card cancelled'

    # The generic refusal (step 2): the typed refusal's shape without attemptsLeft.
    def credential_login_refusal
      { status: :unprocessable_entity, body: { success: false, message: Game::LOGIN_INCORRECT } }
    end

    # A keycard credential whose card was cancelled: the door's refusal reason (`revoked`) and the
    # reader's wording ('Card cancelled'), so the sign-in refuses it the way a door does.
    def credential_card_revoked_refusal
      { status: :unprocessable_entity,
        body: { success: false, message: CARD_CANCELLED_MESSAGE, reason: 'revoked' } }
    end

    # route: { foothold: } | { from: } | { relay: true }, as the controller read it from the body,
    # or {} for none (the keyboard). Returns { status:, body: }.
    def attempt_credential_login!(pc_id, cred_id, route)
      # 1. The PC exists
      info = find_login_pc(pc_id)
      return { status: :not_found, body: { success: false, message: 'Sign-in PC not found' } } unless info

      pc = info[:object]
      # 2. A held, proven credential of a built connecting kind
      entry = provable_connecting_credential(cred_id)
      return credential_card_revoked_refusal if !entry && cred_id.is_a?(String) && credential_card_revoked?(cred_id)
      return credential_login_refusal unless entry

      cred_id = cred_id.to_s
      kind = entry['kind']
      npc = CredentialModel.account_npc(scenario_data, entry['account'])
      return credential_login_refusal unless npc

      # 3. Its own PC only
      unless entry['connectsTo'].to_s == pc['id'].to_s
        return { status: :unprocessable_entity,
                 body: { success: false, message: 'This connection is for another PC', wrongPc: true } }
      end

      # 4. A route the kind allows, judged as POST /login judges a foothold
      route_refusal = kind == 'token' ? token_route_refusal(entry, pc, route) : credential_route_refusal(kind, pc, route)
      return route_refusal if route_refusal

      # 5. The policy accepts the kind
      unless CredentialModel.accepts?(CredentialModel.policy_for(scenario_data, pc), kind)
        return { status: :unprocessable_entity, body: { success: false, kindRefused: kind } }
      end

      # 6. The access list admits the account
      unless pc_admits_account?(pc, npc)
        return { status: :unprocessable_entity,
                 body: { success: false, message: Game::LOGIN_NOT_PERMITTED, notPermitted: true } }
      end

      # 7. A kind that honours lockouts is refused while the account is locked out here
      if CredentialModel.honours_lockout?(kind) && account_locked_out_at?(pc['id'], npc)
        return { status: :unprocessable_entity,
                 body: { success: false, message: Game::LOGIN_LOCKED_OUT, lockedOut: true } }
      end

      # 8. An invite the NPC has ended (endedCredentials is written by the 7.1 end check)
      if kind == 'assist_invite' && ended_credential?(cred_id)
        return { status: :unprocessable_entity, body: { success: false, ended: true } }
      end

      # 8b. A session token that has run out (K5, section 10)
      return { status: :unprocessable_entity, body: { success: false, expired: true } } if kind == 'token' && token_expired?(cred_id)

      # 8c. A kind that stands in for the typed password still owes the second step (S8a): nothing
      # is written, counted or logged, and the answer names the typed sign-in
      if CredentialModel::KINDS.dig(kind, :password) == true && mfa_step_for(pc, npc) != 'none'
        return { status: :unprocessable_entity, body: { success: false, typeToSignIn: 'second_step' } }
      end

      # 8d. A saved connection made before a desk reset the password is not the new password
      # (S8b): until the new one has been typed at any PC, the answer names the typed sign-in;
      # nothing is written, counted or logged. Tokens and assist invites are untouched.
      if CredentialModel::KINDS.dig(kind, :password) == true && password_reset_untyped?(npc['id'])
        return { status: :unprocessable_entity, body: { success: false, typeToSignIn: 'password_changed' } }
      end

      # 9. Write the session (3.8); a replaced session prunes, and the answer names what ended
      relay = route[:relay] == true
      from = relay ? nil : route[:from]
      foothold = relay || from ? nil : route[:foothold]
      ended = start_login_session!(pc['id'], npc, 'credential', credential: cred_id, foothold: foothold, relay: relay,
                                                                from: from)
      # A game whose proof foothold predates K5 has no clock: its first sign-in starts it
      stamp_token_clock!(cred_id) if kind == 'token'
      save!
      answer = login_session_answer(npc, 'credential', pc_id: pc['id'], foothold: foothold, relay: relay,
                                                       credential: cred_id, from: from)
      answer['route'] =
        if relay then { 'relay' => true }
        elsif from then { 'from' => from }
        else { 'foothold' => foothold }
        end
      { status: :ok, body: with_ended_pc_ids({ success: true }.merge(answer), ended) }
    end

    # kind and label for a credential session's answer (3.8), from the registry; {} when the id is
    # no longer in it.
    def credential_session_fields(cred_id)
      entry = CredentialModel.registry(scenario_data)[cred_id.to_s]
      return {} unless entry.is_a?(Hash)

      fields = { 'kind' => entry['kind'], 'label' => credential_label(entry) }
      fields['expiresInS'] = token_expires_in_s(cred_id) if entry['kind'] == 'token'
      fields
    end

    # --- Ending an invite (plan 7.1) ---------------------------------------------------------
    #
    # credentialEndGlobals caches CredentialModel.end_globals ({ global => [credId, ...] }, at most
    # 64 entries) so the sync merge can end an invite without loading scenario_data. It and
    # endedCredentials are written only here, never read from a client body and never sent to the
    # client (both sit in ACCESS_STATE_DEFAULTS, outside the bootstrap's whitelist).

    # The bootstrap's term (bootstrap_state_needs_write?): true when the scenario declares any
    # endsOnGlobal and the stored map is missing or differs from the scenario's. A scenario with
    # none is never stale, so its game never writes the key.
    def credential_end_globals_stale?(scenario: scenario_data)
      want = CredentialModel.end_globals(scenario)
      want.any? && player_state['credentialEndGlobals'] != want
    end

    # The bootstrap writer (run_bootstrap_writers!, inside the lock; does not save). Stores the map
    # when stale, then runs the end check once, so a global that turned true before the cache
    # existed is caught here. Returns whether anything changed.
    def record_credential_end_globals!(scenario: scenario_data)
      want = CredentialModel.end_globals(scenario)
      return false if want.empty?

      changed = false
      if player_state['credentialEndGlobals'] != want
        player_state['credentialEndGlobals'] = want
        changed = true
      end
      result = apply_credential_end_globals!
      changed || !result.nil?
    end

    # The end check (sync merge, after globals are applied; and the bootstrap writer). Reads only
    # the cached map and the stored globals: no scenario load. For each listed global now true,
    # adds its credential ids to endedCredentials (grow-only, at most 64) and deletes every relay
    # session whose credential is ended (a relay never pivots or sources a `from`, so nothing chains
    # off it and no prune is needed). Returns nil when nothing changed, else the PC ids whose relay
    # session it ended (possibly empty), at most 64.
    def apply_credential_end_globals!
      map = player_state['credentialEndGlobals']
      globals = player_state['globalVariables']
      return nil unless map.is_a?(Hash) && map.any? && globals.is_a?(Hash)

      ended = Array(player_state['endedCredentials']).select { |c| c.is_a?(String) }
      newly = []
      map.each do |global, ids|
        next unless globals[global] == true

        Array(ids).each do |id|
          next unless id.is_a?(String) && !ended.include?(id) && !newly.include?(id)
          next if ended.size + newly.size >= CredentialModel::MAX_ENTRIES

          newly << id
        end
      end
      return nil if newly.empty?

      all_ended = ended + newly
      player_state['endedCredentials'] = all_ended
      sessions = player_state['sessions']
      return [] unless sessions.is_a?(Hash)

      pc_ids = sessions.select do |_pc_id, s|
        s.is_a?(Hash) && s['relay'] == true && all_ended.include?(s['credential'])
      end.keys
      pc_ids.each { |pc_id| sessions.delete(pc_id) }
      pc_ids.first(CredentialModel::MAX_ENTRIES)
    end

    private

    # True when a desk has reset this account's password and the new one has not yet been typed.
    # Reads the stored key directly so a game with no desk is neither read into nor written.
    def password_reset_untyped?(npc_id)
      entry = player_state['accountResets'].is_a?(Hash) ? player_state['accountResets'][npc_id.to_s] : nil
      entry.is_a?(Hash) && entry['password'] == true && entry['typed'] != true
    end

    # The registry entry for a credential the player may use now, or nil (step 2): a well-formed
    # id naming a built connecting kind whose proof holds. A password id is typed, never posted.
    def provable_connecting_credential(cred_id)
      return nil unless cred_id.is_a?(String) && CredentialModel::ID_PATTERN.match?(cred_id)

      entry = CredentialModel.registry(scenario_data)[cred_id]
      return nil unless entry.is_a?(Hash)

      kind = entry['kind']
      return nil unless CredentialModel.kind_built?(kind) && CredentialModel.connecting?(kind)
      return nil unless credential_proof_holds?(cred_id, entry)

      entry
    end

    # Step 4: nil when the route is allowed, else the answer. One route field only; no route (the
    # keyboard) and a route the kind does not allow get the generic refusal. `from` (K4) is
    # judged by from_route_refusal: a malformed param, a relay source, the target itself or a
    # target on the source's chain get the generic refusal; any other source failure is 403.
    def credential_route_refusal(kind, pc, route)
      given = %i[foothold from relay].select { |k| route.key?(k) && !route[k].nil? }
      return credential_login_refusal unless given.length == 1

      name = given.first
      allowed = Array(CredentialModel::KINDS.dig(kind, :routes))
      return credential_login_refusal unless allowed.include?(name.to_s)

      case name
      when :foothold
        return { status: :forbidden, body: { success: false, message: 'PC not reachable' } } unless host_reachable_through?(route[:foothold], pc)
        return credential_not_responding if host_service_off?(pc)
        if remote_blocked?(pc)
          return { status: :unprocessable_entity,
                   body: { success: false, message: NetworkAccess::REMOTE_BLOCKED, remoteBlocked: true } }
        end
      when :relay
        # The holder's own vendor relay: no reach check and remote: "blocked" does not apply,
        # but the PC must be on
        return credential_not_responding if host_service_off?(pc)
      when :from
        return credential_login_refusal unless credentials_declared?

        case from_route_refusal(route[:from], pc)
        when :generic then return credential_login_refusal
        when :unreachable then return { status: :forbidden, body: { success: false, message: 'PC not reachable' } }
        end
        return credential_not_responding if host_service_off?(pc)
        if remote_blocked?(pc)
          return { status: :unprocessable_entity,
                   body: { success: false, message: NetworkAccess::REMOTE_BLOCKED, remoteBlocked: true } }
        end
      else
        return credential_login_refusal
      end
      nil
    end

    # Step 4 for a token (K5, section 10): the one route is { foothold: <its proof foothold> }.
    # Any other route (none, relay, from, another foothold, two fields) gets the generic refusal;
    # then reach (403), power (not_responding) and remote: "blocked" (422), as a foothold.
    def token_route_refusal(entry, pc, route)
      given = %i[foothold from relay].select { |k| route.key?(k) && !route[k].nil? }
      return credential_login_refusal unless given == [:foothold]

      proof = CredentialModel.token_proof_foothold(entry)
      return credential_login_refusal unless proof && route[:foothold].is_a?(String) && route[:foothold] == proof
      return { status: :forbidden, body: { success: false, message: 'PC not reachable' } } unless host_reachable_through?(proof, pc)
      return credential_not_responding if host_service_off?(pc)
      if remote_blocked?(pc)
        return { status: :unprocessable_entity,
                 body: { success: false, message: NetworkAccess::REMOTE_BLOCKED, remoteBlocked: true } }
      end

      nil
    end

    def credential_not_responding
      { status: :forbidden,
        body: { success: false, message: NetworkAccess::PC_NOT_RESPONDING_MESSAGE, reason: 'not_responding' } }
    end
  end
end
