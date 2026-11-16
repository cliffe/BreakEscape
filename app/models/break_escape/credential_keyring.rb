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
      { rev: keyring_rev(entries), entries: entries }
    end

    # The short digest of the answer (section 6.2): a stable hash of the entries. A token's
    # expiresInS is left out (K5, section 10), so a running token does not change the digest each
    # second; `expired` turning true does.
    def keyring_rev(entries)
      digested = entries.map { |e| e.is_a?(Hash) && e.key?('expiresInS') ? e.except('expiresInS') : e }
      Digest::MD5.hexdigest(JSON.generate(digested))[0, 6]
    end

    # { credId => seconds left } for each live token entry of an answer, for the controller's
    # `unchanged` answer (K5, section 10). Empty when there are none.
    def keyring_live_expires(entries)
      Array(entries).each_with_object({}) do |e, out|
        next unless e.is_a?(Hash) && e['kind'] == 'token' && e['expired'] != true && e.key?('expiresInS')

        out[e['id']] = e['expiresInS']
      end
    end

    # --- Session tokens (K5, section 10) ---------------------------------------------------
    #
    # A token's clock starts when its proof foothold is first gained (start_token_clocks!, called
    # at the four gain sites in NetworkAccess) or, for a game that held the foothold before K5, at
    # the first token sign-in (stamp_token_clock!). credentialClock is server-written only,
    # grow-only, at most MAX_ENTRIES entries, never read from a client body and never sent.

    # The registry entry for cred_id when it is a token, else nil.
    def token_entry(cred_id)
      return nil unless CredentialModel.present_string?(cred_id)

      entry = CredentialModel.registry(scenario_data)[cred_id.to_s]
      entry.is_a?(Hash) && entry['kind'] == 'token' ? entry : nil
    end

    # Whether a token has run out. Not a token, or a token with no clock yet: false (a game whose
    # foothold predates K5 reads as freshly issued). An invalid expiresMin: true (fail closed).
    def token_expired?(cred_id)
      entry = token_entry(cred_id)
      return false unless entry

      minutes = CredentialModel.token_expires_min(entry)
      return true unless minutes

      started = token_clock_at(cred_id)
      return false unless started

      started + (minutes * 60) <= server_now
    end

    # Whole seconds a token has left (0 once expired); the full life when it has no clock.
    def token_expires_in_s(cred_id)
      entry = token_entry(cred_id)
      minutes = entry ? CredentialModel.token_expires_min(entry) : nil
      return 0 unless minutes

      started = token_clock_at(cred_id)
      return minutes * 60 unless started

      [(started + (minutes * 60) - server_now).ceil, 0].max
    end

    # The one expiry predicate every reader of a held session uses: a credential session whose
    # registry entry is a token that has run out.
    def credential_session_expired?(session)
      return false unless session.is_a?(Hash) && session['via'] == 'credential'

      token_entry(session['credential']) ? token_expired?(session['credential']) : false
    end

    # The PC ids of held sessions that are expired tokens, sorted (reach_cache_key's term).
    def expired_token_session_ids
      access_sessions.select { |_pc_id, session| credential_session_expired?(session) }.keys.map(&:to_s).sort
    end

    # Start the clock of each token whose proof is this (prefixed) foothold id and which has no
    # clock yet. Called right after a gainedFootholds write, before the save. A re-plant never
    # restarts a clock.
    def start_token_clocks!(foothold_id)
      return if foothold_id.blank?

      CredentialModel.registry(scenario_data).each do |id, entry|
        next unless entry['kind'] == 'token'
        next unless CredentialModel.token_proof_foothold(entry) == foothold_id.to_s

        stamp_token_clock!(id)
      end
    end

    # Stamp one token's clock with server_now when it has none (grow-only, capped).
    def stamp_token_clock!(cred_id)
      return unless token_entry(cred_id)

      clock = player_state['credentialClock']
      clock = {} unless clock.is_a?(Hash)
      return if clock.key?(cred_id.to_s) || clock.size >= CredentialModel::MAX_ENTRIES

      clock[cred_id.to_s] = server_now
      player_state['credentialClock'] = clock
    end

    # End every held session that is an expired token (a write path: prune runs this first).
    # Returns the PC ids, also kept for with_token_expired_pc_ids. The caller saves.
    def drop_expired_token_sessions!
      sessions = player_state['sessions']
      return [] unless sessions.is_a?(Hash)

      ids = sessions.select { |_pc_id, session| credential_session_expired?(session) }.keys
      return [] if ids.empty?

      player_state['sessions'] = sessions.except(*ids)
      @token_expired_pc_ids = (Array(@token_expired_pc_ids) + ids.map(&:to_s)).uniq.first(CredentialModel::MAX_ENTRIES)
      ids.map(&:to_s)
    end

    # An answer gains tokenExpiredPcIds (a subset of endedPcIds) when a prune in this request
    # ended an expired token session. Absent otherwise.
    def with_token_expired_pc_ids(body)
      ids = Array(defined?(@token_expired_pc_ids) ? @token_expired_pc_ids : nil)
      ids.empty? ? body : body.merge(tokenExpiredPcIds: ids)
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
          'label' => 'Captured'
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
    # foothold reaches the host now. A from screen is openable only when the `from` route's
    # source and reach checks hold (K4); a relay screen is trusted here (K2 owns its checks); a
    # keyboard screen (no route) needs the PC physically reachable now.
    def keyring_pc_openable?(pc_id, route)
      info = find_login_pc(pc_id)
      return false unless info

      if route.is_a?(Hash) && CredentialModel.present_string?(route[:foothold])
        host_reachable_through?(route[:foothold].to_s, info[:object])
      elsif route.is_a?(Hash) && route.key?(:from)
        from_route_refusal(route[:from], info[:object]).nil?
      elsif route.is_a?(Hash) && route[:relay]
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
        'foundIn' => found_in
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
        'connectsTo' => connects_to
      }
      # The tray item that proves it (K3b): the client never sees an item's `credential` (it is
      # stripped on the way out), so Connect finds its entry by this id. Only a held proof names
      # one, and only once the proof holds, so it is an item the player is carrying.
      held_item = CredentialModel.proof_kind(entry['proof']) == 'held' ? entry.dig('proof', 'held') : nil
      row['heldItem'] = held_item if CredentialModel.present_string?(held_item)

      return registry_token_entry(row, id, entry, pc) if kind == 'token'

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

    # A token's keyring row (K5, section 10): its one route is the proof foothold, when that
    # reaches connectsTo. An expired token carries expired: true and no routes.
    def registry_token_entry(row, id, entry, pc)
      if token_expired?(id)
        row['expired'] = true
        row['routes'] = []
        row['sessionHeld'] = false
        return row
      end

      proof = CredentialModel.token_proof_foothold(entry)
      routes = proof && pc.is_a?(Hash) && host_reachable_through?(proof, pc) ? [{ 'foothold' => proof }] : []
      row['routes'] = routes
      row['sessionHeld'] = credential_session_held?(entry['connectsTo'], id)
      row['targetOff'] = (pc.is_a?(Hash) && host_service_off?(pc)) if routes.any?
      row['remoteBlocked'] = pc.is_a?(Hash) && remote_blocked?(pc) ? true : false
      row['expiresInS'] = token_expires_in_s(id)
      row
    end

    # The stored start of a token's clock (a Numeric), or nil.
    def token_clock_at(cred_id)
      clock = player_state['credentialClock']
      value = clock.is_a?(Hash) ? clock[cred_id.to_s] : nil
      value.is_a?(Numeric) ? value : nil
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
    # footholds (by seq) for a saved_connection, and the relay for an assist_invite. K4 adds, after
    # the footholds, a { from: pcId } row for each held session whose `from` source and reach
    # checks hold, by PC id (target power and remote: "blocked" are their own fields). A token's
    # route (its proof foothold, K5) is in registry_token_entry.
    def credential_routes(kind, pc)
      case kind
      when 'saved_connection'
        return [] unless pc.is_a?(Hash)

        held = player_state['footholds']
        footholds = held.is_a?(Hash) ? held.keys.filter_map { |fid| { 'foothold' => fid } if host_reachable_through?(fid, pc) } : []
        footholds + credential_from_routes(pc)
      when 'assist_invite'
        [{ 'relay' => true }]
      else
        []
      end
    end

    def credential_from_routes(pc)
      return [] unless credentials_declared?

      access_sessions.keys.map(&:to_s).sort.filter_map do |source_id|
        { 'from' => source_id } if from_route_refusal(source_id, pc).nil?
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
