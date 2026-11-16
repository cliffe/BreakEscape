# frozen_string_literal: true

require 'digest'

module BreakEscape
  # The credential keyring (docs/achitechture/CREDENTIAL_KEYRING_PLAN.md, section 6): the list of
  # credentials the player has earned, computed on the server from state it already keeps. The
  # scenario-level rules (the registry, kinds, proofs) are in BreakEscape::CredentialModel, which
  # the validator shares; this concern is the per-game reader that GET /keyring answers from.
  #
  # Every proof reads server-written state only (section 3.5): session (signedInPcs), planted and
  # dropped (through capture_proof_holds?), held (an inventory entry carrying the server's own
  # `credential` field, identity-strict) and foothold (footholds held now). No value of a
  # non-password kind ever reaches the browser; a password is served only where GET
  # /capture_secrets already serves it.
  module CredentialKeyring
    extend ActiveSupport::Concern

    # Whether one registry credential's proof holds now (section 3.5). cred_id is the registry key,
    # needed for the identity-strict `held` match.
    def credential_proof_holds?(cred_id, entry)
      return false unless entry.is_a?(Hash)

      proof = entry['proof']
      case CredentialModel.proof_kind(proof)
      when 'session', 'planted', 'dropped'
        capture_proof_holds?(proof)
      when 'held'
        credential_held_proof_holds?(cred_id, entry, proof['held'])
      when 'foothold'
        held = player_state['footholds']
        held.is_a?(Hash) && held.key?(proof['foothold'])
      else
        false
      end
    end

    # The `held` proof (section 3.5): an inventory entry whose stored `credential` equals the
    # credential's id, whose type equals the authored definition's, whose id equals the definition's
    # id (no name fallback), and that is not client_forged?. The definition is found statically by
    # CredentialModel.item_definition.
    def credential_held_proof_holds?(cred_id, _entry, item_id)
      definition = CredentialModel.item_definition(scenario_data, item_id)
      return false unless definition.is_a?(Hash)

      def_type = definition['type'].to_s
      def_id = definition['id'].to_s
      return false if def_id.empty?

      Array(player_state['inventory']).any? do |inv|
        next false unless inv.is_a?(Hash)
        next false if ItemIdentity.client_forged?(inv)

        # Unwrap the stored shape, as the other inventory readers do (has_key?, the lockpick
        # check, record_planted_item!): a genuine take is stored flat, but a future path that
        # stored a credential item as { scenarioData: {...} } must still prove held (R1 m2).
        data = inv['scenarioData'] || inv
        next false unless data.is_a?(Hash)

        data['credential'].to_s == cred_id.to_s &&
          data['type'].to_s == def_type &&
          data['id'].to_s == def_id
      end
    end

    # The keyring answer for GET /keyring (section 6.2). pc_id, route (:foothold/:from/:relay) name
    # the screen the client is drawing so the server can set forThisPc and accepted; they never
    # assert reach. All reach, sessionHeld and power fields are computed from server-held footholds
    # and sessions only.
    def keyring_for_client(pc_id: nil, route: nil)
      entries = implicit_keyring_entries + registry_keyring_entries
      # A pc_id is scoped (forThisPc/accepted) only when the player can open a screen for it,
      # by keyboard or by the named route (section 6.2); an unopenable pc_id is ignored.
      entries = keyring_scope_to_pc(entries, pc_id) if CredentialModel.present_string?(pc_id) && keyring_pc_openable?(pc_id, route)
      captures = keyring_captures
      { rev: keyring_rev(entries, captures), entries: entries, captures: captures }
    end

    # The short digest of the answer (section 6.2): a stable hash of the entries and (K3d) the
    # captures map, so an `unchanged` answer never hides a capture's new tag.
    def keyring_rev(entries, captures = {})
      Digest::MD5.hexdigest(JSON.generate([entries, captures]))[0, 6]
    end

    # The Sign-ins list's capture map (K3d, plan 8.7): one entry per capture in the server's own
    # record (player_state['seCaptures'], never the client's se_captures global) whose target id
    # is declared, proven or not: { tag, source, account? }. It carries no value: a `pin` tag says
    # only that a capture the player already holds is short and numeric.
    def keyring_captures
      record = player_state['seCaptures']
      return {} unless record.is_a?(Hash) && record.any?

      declared = declared_capture_target_ids
      candidates = CaptureModel.all_capture_candidates(scenario_data)
      record.each_with_object({}) do |(target_id, stored), out|
        next unless stored.is_a?(Hash) && declared.include?(target_id)

        meta = CaptureModel.capture_row_meta(scenario_data, stored.merge('targetId' => target_id), candidates: candidates)
        out[target_id] = meta if meta
      end
    end

    private

    # Implicit password entries, one per captured account holder (section 3.1). Built from the same
    # readers as GET /capture_secrets, so the keyring never serves a password the capture answer
    # would not. A captured account's id is "<npcId>.password".
    def implicit_keyring_entries
      usernames = account_capture_usernames
      return [] unless usernames.is_a?(Hash) && usernames.any?

      secrets = capture_secrets_for_client
      usernames.filter_map do |target_id, address|
        npc = account_npcs.find { |n| n['id'].to_s == target_id.to_s }
        next unless npc

        entry = {
          'id' => "#{target_id}.password",
          'kind' => 'password',
          'source' => 'capture',
          'account' => account_block(npc, address),
          'label' => 'Captured',
          'how' => 'recorded'
        }
        secret = secrets[target_id] if secrets.is_a?(Hash)
        entry['password'] = secret if CredentialModel.present_string?(secret)
        entry
      end
    end

    # Whether the player can open a sign-in screen for this pc_id, by keyboard or by the named
    # route (section 6.2's "a pc_id the player cannot open a screen for is ignored"). route is the
    # screen the client says it is drawing ({ foothold: }, { from: }, { relay: true } or nil); it
    # names the screen, it never asserts reach. A foothold screen is openable only when that
    # foothold reaches the host now. A from/relay screen is trusted here (K4/K2 own their reach
    # checks); a keyboard screen (no route) needs the PC physically reachable now.
    def keyring_pc_openable?(pc_id, route)
      info = find_login_pc(pc_id)
      return false unless info

      if route.is_a?(Hash) && CredentialModel.present_string?(route[:foothold])
        host_reachable_through?(route[:foothold].to_s, info[:object])
      elsif route.is_a?(Hash) && (route[:relay] || CredentialModel.present_string?(route[:from]))
        true
      else
        login_pc_reachable?(info)
      end
    end

    # Registry entries of built kinds whose proof holds (section 6.2).
    def registry_keyring_entries
      ended = Array(player_state['endedCredentials'])
      CredentialModel.registry(scenario_data).filter_map do |id, entry|
        kind = entry['kind']
        next unless CredentialModel.kind_built?(kind)
        next unless credential_proof_holds?(id, entry)

        npc = CredentialModel.account_npc(scenario_data, entry['account'])
        next unless npc

        if kind == 'password'
          registry_password_entry(id, entry, npc)
        else
          registry_connecting_entry(id, entry, npc, ended: ended)
        end
      end
    end

    def registry_password_entry(id, entry, npc)
      found_in = entry['foundIn']
      definition = CredentialModel.item_definition(scenario_data, found_in)
      label = definition.is_a?(Hash) && CredentialModel.present_string?(definition['name']) ? definition['name'] : found_in.to_s
      {
        'id' => id,
        'kind' => 'password',
        'source' => 'registry',
        'account' => account_block(npc, npc.dig('creds', 'username')),
        'label' => label,
        'foundIn' => found_in,
        'how' => credential_how(entry)
      }
    end

    def registry_connecting_entry(id, entry, npc, ended:)
      kind = entry['kind']
      connects_to = entry['connectsTo']
      pc = CredentialModel.sign_in_pc(scenario_data, connects_to)
      label = credential_label(entry)

      row = {
        'id' => id,
        'kind' => kind,
        'source' => 'registry',
        'account' => account_block(npc, npc.dig('creds', 'username')),
        'label' => label,
        'host' => pc.is_a?(Hash) ? host_label(pc) : nil,
        'connectsTo' => connects_to,
        'how' => credential_how(entry)
      }
      # The tray item that proves it (K3b): the client never sees an item's `credential` (it is
      # stripped on the way out), so Connect finds its entry by this id. Only a held proof names
      # one, and only once the proof holds, so it is an item the player is carrying.
      held_item = CredentialModel.proof_kind(entry['proof']) == 'held' ? entry.dig('proof', 'held') : nil
      row['heldItem'] = held_item if CredentialModel.present_string?(held_item)

      is_ended = kind == 'assist_invite' && ended.include?(id)
      if is_ended
        row['ended'] = true
        row['routes'] = []
        return row
      end

      routes = credential_routes(kind, pc)
      row['routes'] = routes
      row['sessionHeld'] = credential_session_held?(connects_to, id)
      # Power and policy are told only where the PC could be reached (section 6.2).
      row['targetOff'] = (pc.is_a?(Hash) && host_service_off?(pc)) if routes.any?
      row['remoteBlocked'] = kind == 'assist_invite' ? false : (pc.is_a?(Hash) && remote_blocked?(pc) ? true : false)
      row
    end

    # How the player came by a registry credential (K3d, plan 8.7), for the row's source tag:
    # `given` for a held item from an NPC's or flag station's itemsHeld, a declared grant or the
    # start inventory; `found` for any other held item and for a session, planted or dropped
    # proof; `recorded` for a foothold proof (a token the foothold recorded).
    def credential_how(entry)
      proof = entry['proof']
      case CredentialModel.proof_kind(proof)
      when 'held' then CredentialModel.held_item_given?(scenario_data, proof['held']) ? 'given' : 'found'
      when 'foothold' then 'recorded'
      else 'found'
      end
    end

    # A connecting credential's label: the entry's own `label`, else its held item's authored
    # name, else empty (the screen then uses the generic kind wording; a PC id is never shown).
    # The keyring row and the credential sign-in answer (K2) share it.
    def credential_label(entry)
      return entry['label'] if CredentialModel.present_string?(entry['label'])

      definition = CredentialModel.item_definition(scenario_data, entry.dig('proof', 'held'))
      definition.is_a?(Hash) && CredentialModel.present_string?(definition['name']) ? definition['name'] : ''
    end

    # The routes that reach a connecting credential's connectsTo now (section 6.2). K1 computes held
    # footholds (by seq) for a saved_connection, and the relay for an assist_invite. `from` (K4) and
    # token's proof foothold (K5) are not built here.
    def credential_routes(kind, pc)
      case kind
      when 'saved_connection'
        return [] unless pc.is_a?(Hash)

        held = player_state['footholds']
        return [] unless held.is_a?(Hash)

        held.keys.filter_map do |fid|
          { 'foothold' => fid } if host_reachable_through?(fid, pc)
        end
      when 'assist_invite'
        [{ 'relay' => true }]
      else
        []
      end
    end

    def credential_session_held?(pc_id, cred_id)
      sessions = player_state['sessions']
      return false unless sessions.is_a?(Hash)

      session = sessions[pc_id.to_s]
      session.is_a?(Hash) && session['credential'].to_s == cred_id.to_s
    end

    # forThisPc and accepted for a named screen (section 6.2). A pc_id the player cannot open a
    # screen for is not pre-judged here (the sign-in answers admission); the client passes only a
    # screen it is drawing.
    def keyring_scope_to_pc(entries, pc_id)
      pc = CredentialModel.sign_in_pc(scenario_data, pc_id)
      policy = pc ? CredentialModel.policy_for(scenario_data, pc) : nil
      entries.map do |entry|
        kind = entry['kind']
        for_this = kind == 'password' ? true : entry['connectsTo'].to_s == pc_id.to_s
        entry.merge(
          'forThisPc' => for_this,
          'accepted' => CredentialModel.accepts?(policy, kind)
        )
      end
    end

    def account_block(npc, username)
      {
        'npcId' => npc['id'],
        'username' => username,
        'displayName' => npc['displayName'] || npc['id']
      }
    end
  end
end
