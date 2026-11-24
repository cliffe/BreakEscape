# frozen_string_literal: true

module BreakEscape
  # Ops S5b unit 08 (docs/agents/ops_core_build/S5BC_BUILD_BRIEF.md, units 08 and 4.2): the accounts a
  # sign-in PC remembers, and the collect of them by an admin session.
  #
  # player_state keys (in Game::ACCESS_STATE_DEFAULTS, server-written only, grow-only, never read from
  # a sync body, never sent to the browser): `cachedAt` and `harvestedAccounts`, each a list of
  # "<pcId>|<npcId>" pair strings. Neither is trimmed, because the `harvested` hash proof reads
  # `harvestedAccounts` and dropping a `cachedAt` pair would un-cache an account. Each grows only by
  # the scenario's declared pairs, and a writer adds a pair only when it is absent.
  #
  # The caller holds the game lock. Nothing here answers a password, a token or a hash.
  module CachedCredentials
    extend ActiveSupport::Concern

    # The account NPCs cached at this sign-in PC now, in `cachedAccounts` order: each declared
    # candidate with no `after`, and each `after: "borrow"` candidate whose pair is in `cachedAt`.
    # Reads only the PC's declared list, so an undeclared account can never be answered, and a stale
    # `cachedAt` pair (the declaration is gone) is ignored. A candidate that is not a room NPC with an
    # account is skipped. [] for a non-PC.
    def cached_accounts_at(pc)
      return [] unless pc.is_a?(Hash)

      held = cached_pair_list('cachedAt')
      CachedAccounts.candidates(pc).filter_map do |cand|
        next if cand['after'] == 'borrow' && !held.include?(CachedAccounts.pair(pc['id'], cand['npc']))

        npc = scenario_room_npc(cand['npc'])
        npc if npc && self.class.account_holder?(npc)
      end
    end

    # The collect. Answers nil (and writes nothing) unless this PC holds an admin session right now;
    # else `{ added: [pair], held: [pair] }`: the pairs this call put in `harvestedAccounts`, in order,
    # and every pair held for this PC (cached now and collected, in declared order). Saves and writes
    # one `credentials_harvested` row only when a pair was added; a repeat adds nothing.
    def harvest_cached_credentials!(pc_id)
      return nil unless pc_id.is_a?(String) && session_admin?(pc_id)

      info = find_login_pc(pc_id)
      return nil unless info

      pc = info[:object]
      cached = cached_accounts_at(pc)
      store = harvested_pair_list
      added = []
      cached.each do |npc|
        pair = CachedAccounts.pair(pc['id'], npc['id'])
        next if pair.nil? || store.include?(pair)

        store << pair
        added << pair
      end
      player_state['harvestedAccounts'] = store
      unless added.empty?
        write_log_row!('credentials_harvested', as: { account: session_identity(pc_id).dig('creds', 'username') },
                                                where: { kind: 'pc', id: pc['id'] }, detail: { 'count' => added.length })
        save!
      end
      { added: added, held: cached.filter_map { |n| CachedAccounts.pair(pc['id'], n['id']) }.select { |p| store.include?(p) } }
    end

    # The rows for these pairs at this PC, one per pair still cached and collected there, in declared
    # order: { npcId, displayName, username, portrait, avatar, hashId }. A pair not held in
    # `harvestedAccounts`, not cached now, or for another PC gives no row. An account-only account has
    # no portrait or avatar. No password, token, fact or recipe is read.
    def harvested_rows(pc_id, pairs)
      info = find_login_pc(pc_id)
      return [] unless info && pairs.is_a?(Array)

      pc = info[:object]
      store = harvested_pair_list
      cached_accounts_at(pc).filter_map do |npc|
        pair = CachedAccounts.pair(pc['id'], npc['id'])
        next unless pair && pairs.include?(pair) && store.include?(pair)

        only = AccessIdentities.account_only?(npc)
        {
          'npcId' => npc['id'],
          'displayName' => npc['displayName'] || npc['id'],
          'username' => npc.dig('creds', 'username'),
          'portrait' => only ? nil : self.class.npc_talk_portrait(npc),
          'avatar' => only || !npc['avatar'].is_a?(String) ? nil : npc['avatar'],
          'hashId' => CachedAccounts.hash_record_id(scenario_data, pc['id'], npc['id'])
        }
      end
    end

    # Records that a declared `after: "borrow"` borrower's hand-over was accepted at this PC: adds the
    # pair to `cachedAt` unless present. `pc` is the sign-in PC object (or its id), `npc` the borrower
    # (or its id). True when a pair was added; false (nothing written) for an undeclared borrower, a
    # candidate with no `after`, an unknown PC, or a borrower locked out at this PC. Does not save:
    # the caller (the borrow's "done") saves.
    def note_borrow_cached!(pc, npc)
      pc = find_login_pc(pc)&.dig(:object) if pc.is_a?(String)
      npc = scenario_room_npc(npc) if npc.is_a?(String)
      return false unless pc.is_a?(Hash) && npc.is_a?(Hash) && AccessIdentities.login_pc?(pc)
      return false unless CachedAccounts.borrow_candidate?(pc, npc['id'])
      return false if account_locked_out_at?(pc['id'], npc)

      pair = CachedAccounts.pair(pc['id'], npc['id'])
      list = cached_pair_list('cachedAt')
      return false if pair.nil? || list.include?(pair)

      player_state['cachedAt'] = list << pair
      true
    end

    private

    def cached_pair_list(key)
      list = player_state[key]
      list.is_a?(Array) ? list.grep(String) : []
    end

    def harvested_pair_list
      cached_pair_list('harvestedAccounts')
    end
  end
end
