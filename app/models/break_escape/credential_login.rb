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

    # The generic refusal (step 2): the typed refusal's shape without attemptsLeft.
    def credential_login_refusal
      { status: :unprocessable_entity, body: { success: false, message: Game::LOGIN_INCORRECT } }
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
      route_refusal = credential_route_refusal(kind, pc, route)
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

      # 9. Write the session (3.8); a replaced session prunes, and the answer names what ended
      relay = route[:relay] == true
      foothold = relay ? nil : route[:foothold]
      ended = start_login_session!(pc['id'], npc, 'credential', credential: cred_id, foothold: foothold, relay: relay)
      save!
      answer = login_session_answer(npc, 'credential', pc_id: pc['id'], foothold: foothold, relay: relay,
                                                       credential: cred_id)
      answer['route'] = relay ? { 'relay' => true } : { 'foothold' => foothold }
      { status: :ok, body: with_ended_pc_ids({ success: true }.merge(answer), ended) }
    end

    # kind and label for a credential session's answer (3.8), from the registry; {} when the id is
    # no longer in it.
    def credential_session_fields(cred_id)
      entry = CredentialModel.registry(scenario_data)[cred_id.to_s]
      return {} unless entry.is_a?(Hash)

      { 'kind' => entry['kind'], 'label' => credential_label(entry) }
    end

    private

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
    # keyboard) and a route the kind does not allow get the generic refusal. `from` is K4 and is
    # refused generically here until it is built.
    def credential_route_refusal(kind, pc, route)
      given = %i[foothold from relay].select { |k| route[k].present? }
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
      else
        # K4: the `from` route (source session checks, from_reach)
        return credential_login_refusal
      end
      nil
    end

    def credential_not_responding
      { status: :forbidden,
        body: { success: false, message: NetworkAccess::PC_NOT_RESPONDING_MESSAGE, reason: 'not_responding' } }
    end
  end
end
