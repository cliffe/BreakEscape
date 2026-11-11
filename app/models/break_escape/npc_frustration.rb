module BreakEscape
  # Frustration held on the server (docs/achitechture/ACCESS_MODEL_SLICE_9_2_PLAN.md, 5.4, 9.1
  # and 9.4, sub-slice A). The browser runs the needs system and reports each counted failure and
  # each met use after a failure; the server checks the report against the scenario and its own
  # state, holds it to a pace in server time, and answers with the level and the tell.
  #
  # The scenario rules (work lists, can fail, places, use times, owned causes, floors) are in
  # BreakEscape::AccessWork, which the validator shares.
  #
  # player_state key (in Game::ACCESS_STATE_DEFAULTS):
  #   npcFrustration { npcId => { 'level', 'metAt', 'failAt' => { need => t }, 'failWhy' =>
  #                    { need => [why] }, 'easeAt' => { need => t }, 'hands', 'handed', 'lastSpent',
  #                    'done', 'turn', 'lockedOut' } }, times in seconds of server time.
  module NpcFrustration
    extend ActiveSupport::Concern

    MAX_REPORTS = 20
    # Review R1 M1: a report's `missing` list is bounded. An honest report lists one cause per
    # resource in the NPC's work list plus its station; more than MAX_MISSING entries is refused
    # unread, and after removing repeats more than MAX_CAUSES is refused.
    MAX_MISSING = 20
    MAX_CAUSES = 8
    EVENTS = %w[fail ease check].freeze
    # Causes the server owns: no event in play clears them (plan 9.1, gate 2)
    OWNED_WHYS = %w[no_access social_blocked locked_out].freeze
    # Sub-slice L (6.6, decision 14): a lockout counts only behind the `check` record. A `check`
    # answers whether loginLockouts holds the owner's username at its own station and, when it
    # does, records the station in the NPC's lockedOut list. A fail naming `locked_out` is refused
    # unless that record exists (review R2 m2 in A: without it a guessed username, locked out at
    # an NPC's PC, could be confirmed through a fail); a lockout with no record is no owned cause.
    RECORDED_WHYS = %w[locked_out].freeze

    # Workarounds (plan 6). Lasting ones (sub-slice B) are performed once; repeating ones
    # (sub-slice H: borrow_session, share_login) again after each later counted failure while
    # the level is at or above their `at`, taken in turn.
    LASTING_KINDS = %w[writes_down prop_door emit].freeze
    REPEATING_KINDS = %w[borrow_session share_login].freeze
    PERFORMED_KINDS = (LASTING_KINDS + REPEATING_KINDS).freeze
    # Seconds a hand-over must stand before its "done" is accepted (6.1 to 6.5): the at-desk
    # write, the walk to the prop's dwell, none for an event, the share's dwell beside the
    # colleague. A borrow's is the borrowed PC's use time (borrow_dwell), since "done" comes
    # when the NPC leaves it.
    WORKAROUND_DWELL = { 'writes_down' => 6, 'prop_door' => 4, 'emit' => 0, 'share_login' => 6 }.freeze

    def npc_frustration
      player_state['npcFrustration'] = {} unless player_state['npcFrustration'].is_a?(Hash)
      player_state['npcFrustration']
    end

    def frustration_entry(npc_id)
      entry = npc_frustration[npc_id] ||= {}
      entry['level'] ||= 0
      %w[failAt failWhy easeAt handed lastSpent].each { |k| entry[k] = {} unless entry[k].is_a?(Hash) }
      %w[done lockedOut].each { |k| entry[k] = [] unless entry[k].is_a?(Array) }
      entry['hands'] ||= 0
      entry['turn'] ||= 0
      entry
    end

    def server_now
      Time.current.to_f
    end

    # Called when a room's NPCs are first encountered (track_npc_encounters): the moment each
    # NPC that can fail, or has a feed, became known (plan 9.4). No check in A reads it: since
    # R5 n2 the "NPC known" check is encounteredNPCs. It is kept for sub-slice C's feed (which
    # starts from it) and for the verify-run report.
    def note_npcs_met!(npc_ids)
      now = server_now
      AccessWork.with_index(scenario_data) do
        Array(npc_ids).each do |id|
          npc = scenario_room_npc(id)
          next unless npc
          next unless AccessWork::JUDGED_NEEDS.any? { |need| AccessWork.can_fail?(scenario_data, npc, need) } || npc['feed'].is_a?(Hash)

          entry = frustration_entry(id.to_s)
          entry['metAt'] ||= now
        end
      end
    end

    # POST /npc_frustration. Returns { status:, body: }.
    def report_npc_uses!(reports)
      return { status: :unprocessable_entity, body: { error: 'reports must be a list' } } unless reports.is_a?(Array)
      return { status: :unprocessable_entity, body: { error: "at most #{MAX_REPORTS} reports" } } if reports.size > MAX_REPORTS

      answers = AccessWork.with_index(scenario_data) do
        reports.map { |r| report_one!(r.respond_to?(:to_unsafe_h) ? r.to_unsafe_h : r) }
      end
      save! if changed?
      { status: :ok, body: { answers: answers } }
    end

    # The per-NPC block GET /scenario carries (5.4, 9.1): level, tell, settled, hold per need,
    # pending and done workarounds (sub-slice B), lockedOut (sub-slice L) and failWhy (B review R3 m1).
    # Reads the stored entries without filling defaults (review R1 n7), so this GET writes nothing.
    def npc_frustration_for_client
      now = server_now
      store = player_state['npcFrustration']
      return {} unless store.is_a?(Hash)

      AccessWork.with_index(scenario_data) do
        store.each_with_object({}) do |(id, entry), out|
          npc = scenario_room_npc(id)
          next unless npc && entry.is_a?(Hash)

          e = frustration_view(entry)
          hold = {}
          e['failAt'].each do |need, at|
            floor = e['easeAt'][need].to_f > at.to_f ? AccessWork.use_floor(scenario_data, npc, need) : AccessWork.park_floor(npc)
            left = floor - (now - at.to_f)
            hold[need] = left.ceil(1) if left.positive?
          end
          block = { 'level' => e['level'], 'tell' => frustration_tell(npc, e), 'settled' => frustration_settled?(npc, e),
                    'pending' => pending_runs(npc, e), 'done' => done_list(npc, e),
                    # Review R1 n4: the station only, as the client reads it
                    'lockedOut' => e['lockedOut'] & [AccessWork.station(scenario_data, npc)&.dig('id')].compact }
          block['hold'] = hold unless hold.empty?
          # Review R3 m1: the whys of each need's last counted failure (what the client reported),
          # so the frustration icon can fade after a reload once the cause has cleared (q17)
          why = e['failWhy'].select { |need, list| need.is_a?(String) && list.is_a?(Array) && list.all? { |w| w.is_a?(String) } }
          block['failWhy'] = why unless why.empty?
          out[id] = block
        end
      end
    end

    # Whether a workaround of this kind is done for this NPC (written_down? reads it, 6.1)
    def workaround_done_kind?(npc_id, kind)
      store = player_state['npcFrustration']
      entry = store.is_a?(Hash) ? store[npc_id.to_s] : nil
      return false unless entry.is_a?(Hash) && entry['done'].is_a?(Array)

      npc = scenario_room_npc(npc_id.to_s)
      list = AccessWork.workarounds(scenario_data, npc)
      entry['done'].any? { |i| i.is_a?(Integer) && list[i].is_a?(Hash) && list[i]['do'] == kind }
    end

    # POST /npc_workaround (plan 6 and 9.1): the runner reports a hand-over performed or
    # dropped. Returns { status:, body:, open_room: } where open_room is a room the controller
    # serves through serve_opened_room (prop_door).
    def complete_npc_workaround!(npc_id:, index:, hand:, dropped: false, heard: false, room_id: nil)
      npc_id = npc_id.to_s
      npc = scenario_room_npc(npc_id)
      # 1. NPC known
      return { status: :forbidden, body: { 'error' => 'unknown hand-over' } } unless npc && Array(player_state['encounteredNPCs']).include?(npc_id)

      index = strict_int(index)
      hand = strict_int(hand)
      return { status: :forbidden, body: { 'error' => 'unknown hand-over' } } if index.nil? || hand.nil?

      w = AccessWork.workarounds(scenario_data, npc)[index]
      return { status: :forbidden, body: { 'error' => 'unknown hand-over' } } unless performable?(npc, w)

      key = index.to_s
      store = player_state['npcFrustration']
      stored = store.is_a?(Hash) ? store[npc_id] : nil
      view = frustration_view(stored)
      # 2. the last spent hand-over again: the same body, recomposed, nothing written. A
      # repeated drop, or a "done" after a drop, answers { dropped: true } (still 200, so a lost
      # answer to a drop is resent harmlessly), which the runner can tell from an emit's {}
      last = view['lastSpent'][key]
      if last.is_a?(Hash) && last['hand'] == hand
        return { status: :ok, body: { 'dropped' => true } } unless last['done']

        return workaround_body(npc, w, heard: last['heard'] == true)
      end
      # 3. handed over and not yet spent
      handed = view['handed'][key]
      return { status: :forbidden, body: { 'error' => 'unknown hand-over' } } unless handed.is_a?(Hash) && handed['hand'] == hand

      # 4. the dwell, unless dropped
      dwell = workaround_dwell(w)
      elapsed = server_now - handed['time'].to_f
      if !dropped && elapsed < dwell
        return { status: :too_early, body: { 'error' => 'too early', 'retryAfter' => (dwell - elapsed).ceil(1) } }
      end

      entry = frustration_entry(npc_id)
      entry['handed'].delete(key)
      entry['lastSpent'][key] = { 'hand' => hand, 'done' => !dropped }
      if dropped
        save!
        return { status: :ok, body: { 'dropped' => true } }
      end

      entry['done'] << index if LASTING_KINDS.include?(w['do']) && !entry['done'].include?(index)
      set_workaround_global!(w)
      heard_now = false
      case w['do']
      when 'borrow_session'
        record_borrow_done!(npc, w)
      when 'share_login'
        # 5. heard counts only in a room the colleague can be in that the player has opened
        heard_now = heard && share_heard_in?(w, room_id) && colleague_encountered?(w)
        if heard_now
          shared = shared_logins
          shared << npc_id unless shared.include?(npc_id)
          entry['lastSpent'][key]['heard'] = true
        end
      end
      save!
      workaround_body(npc, w, heard: heard_now)
    end

    # player_state.sharedLogins (9.4): the accounts the player heard shared. Missing means empty.
    def shared_logins
      player_state['sharedLogins'] = [] unless player_state['sharedLogins'].is_a?(Array)
      player_state['sharedLogins']
    end

    # player_state.guestSessions (9.4): { pcId => npcId }, who last left a borrowed session
    def guest_sessions
      player_state['guestSessions'] = {} unless player_state['guestSessions'].is_a?(Hash)
      player_state['guestSessions']
    end

    # A reload ends every guest session, as it ends claims (9.4). Called by the scenario action
    # after it has answered, under the row lock, as end_claimed_sessions! is.
    def end_guest_sessions!
      return unless player_state['guestSessions'].is_a?(Hash) && player_state['guestSessions'].any?

      with_lock do
        next unless player_state['guestSessions'].is_a?(Hash) && player_state['guestSessions'].any?

        player_state['guestSessions'] = {}
        player_state['guestSessionsAt'] = {}
        save!
      end
    end

    # player_state.guestSessionsAt: { pcId => server time of the "done" that wrote the guest
    # record }, beside guestSessions so that map keeps plan 9.4's { pcId => npcId } shape
    def guest_sessions_at
      player_state['guestSessionsAt'] = {} unless player_state['guestSessionsAt'].is_a?(Hash)
      player_state['guestSessionsAt']
    end

    # The player's own sign-out, or a password (or remote) sign-in at the PC, ends the guest
    # session there (review R1 M1; plan 6.4 lists no sign-out end event, this fills that gap)
    def end_guest_session_at!(pc_id)
      key = pc_id.to_s
      return unless player_state['guestSessions'].is_a?(Hash) && player_state['guestSessions'].key?(key)

      guest_sessions.delete(key)
      guest_sessions_at.delete(key)
    end

    # Whether the guest session at the PC has passed its auto lock on the server's own clock
    # (review R1 m1): the done time plus the PC's policy autoLockMin (its policy, else
    # defaultPolicy), with the usual 3 s allowance in the client's favour. A policy with no
    # autoLockMin never locks a guest on the client, so it never times out here either.
    def guest_session_timed_out?(pc)
      min = effective_policy(pc)['autoLockMin']
      return false unless min.is_a?(Numeric) && min.positive?

      at = guest_sessions_at[pc['id'].to_s]
      return false unless at.is_a?(Numeric)

      server_now - at.to_f > (min * 60) + 3
    end

    # A careful guest (6.4): 9.1's screen_always_locks? with no PC field, on the saved (expanded)
    # NPC record, so no screenHabit at all is careful. Such a guest signs out of a borrowed PC.
    def careful_guest?(npc)
      AccessIdentities.screen_always_locks?({}, npc)
    end

    # The PCs this NPC's handed-over (or spent) borrow_session workarounds name: a place for the
    # need once the server has handed the borrow over (plan 9.1, "Belongs to the NPC"), never before
    def handed_borrow_pcs(npc, need = nil)
      store = player_state['npcFrustration']
      entry = store.is_a?(Hash) ? store[npc['id'].to_s] : nil
      return [] unless entry.is_a?(Hash)

      keys = (entry['handed'].is_a?(Hash) ? entry['handed'].keys : []) + (entry['lastSpent'].is_a?(Hash) ? entry['lastSpent'].keys : [])
      list = AccessWork.workarounds(scenario_data, npc)
      keys.uniq.filter_map do |k|
        i = strict_int(k)
        w = i.nil? ? nil : list[i]
        next nil unless w.is_a?(Hash) && w['do'] == 'borrow_session' && AccessWork.present_string?(w['pc'])

        pc = AccessWork.object(scenario_data, w['pc'])
        next nil if need && !AccessWork.satisfies?(scenario_data, pc, need)

        # by id, as the client names the PC it used (review R1 n1)
        borrow_pc_id(w)
      end.uniq
    end

    private

    def strict_int(v)
      return v if v.is_a?(Integer) && v >= 0
      return v.to_i if v.is_a?(String) && v.match?(/\A\d{1,6}\z/)

      nil
    end

    # A workaround this build can perform, with the fields it needs (the validator errors on
    # anything less; the server ignores such an entry rather than fail on it)
    def performable?(npc, w)
      return false unless w.is_a?(Hash) && PERFORMED_KINDS.include?(w['do']) && w['at'].is_a?(Numeric)

      case w['do']
      when 'writes_down'
        self.class.account_holder?(npc) && AccessWork.present_string?(npc['needsHome'])
      when 'prop_door'
        AccessWork.present_string?(w['door']) && AccessWork.present_string?(w['prop']) &&
          scenario_data['rooms'].is_a?(Hash) && scenario_data['rooms'].key?(w['door'])
      when 'emit'
        AccessWork.present_string?(w['event'])
      when 'borrow_session'
        pc = AccessWork.present_string?(w['pc']) ? find_login_pc(w['pc'])&.dig(:object) : nil
        self.class.account_holder?(npc) && !pc.nil? && !NetworkModel.headless?(pc) && login_pc_owner(pc).nil?
      when 'share_login'
        self.class.account_holder?(npc) && AccessWork.present_string?(w['with']) && w['with'] != npc['id'] &&
          !scenario_room_npc(w['with']).nil?
      else
        false
      end
    end

    def workaround_dwell(w)
      return borrow_dwell(w) if w['do'] == 'borrow_session'

      WORKAROUND_DWELL.fetch(w['do'], 0)
    end

    # A borrow's "done" comes when the NPC leaves the PC, after a whole use there; the floor is
    # that use time less the 3 second allowance the other floors give (9.1)
    def borrow_dwell(w)
      pc = AccessWork.object(scenario_data, w['pc'])
      [AccessWork.use_seconds(scenario_data, pc) - 3, 0].max
    end

    # The borrowed PC's id: the claim and the client both name it by id (review R1 n1)
    def borrow_pc_id(w)
      ((find_login_pc(w['pc'])&.dig(:object) || {})['id'] || w['pc']).to_s
    end

    # "done" for a borrow (6.4): the NPC signed in there and left. A guest record for one that
    # leaves the session open; a session the player held there is ended either way (one screen,
    # one session), so a click then reaches the guest's, not the player's old one. The last
    # "done" to arrive wins (review R2 M1): two borrowers queued at one hot desk report in the
    # order they left, which is the order the client records them in, except a request that
    # never reached the server and is resent late (accepted, review R1 n2). A "done" that is resent
    # after a later borrower's (its answer was lost) is answered from lastSpent and writes
    # nothing; workaround_body then answers guest: false, so the client keeps the later one too.
    def record_borrow_done!(npc, w)
      pc_id = borrow_pc_id(w)
      player_state['sessions'] = access_sessions.except(pc_id)
      # Sub-slice L review R1 m1: a borrower locked out at this PC cannot have signed in there
      if careful_guest?(npc) || account_locked_out_at?(pc_id, npc)
        guest_sessions.delete(pc_id)
        guest_sessions_at.delete(pc_id)
      else
        guest_sessions[pc_id] = npc['id']
        guest_sessions_at[pc_id] = server_now
      end
    end

    # Review R1 m4: a share counts as heard only once the player has met the colleague, as an
    # honest client always has (the visit needs the colleague's sprite, so its room has loaded)
    def colleague_encountered?(w)
      Array(player_state['encounteredNPCs']).include?(w['with'])
    end

    # Check 5 (9.1): `room_id` is a room the `with` NPC can be in (its own room, plus its
    # needsRooms leash) and that room is open to the player. player_state.currentRoom is never
    # read: the browser does not update it.
    def share_heard_in?(w, room_id)
      return false unless room_id.is_a?(String) && !room_id.empty?

      colleague = w['with']
      own = AccessIdentities.room_npcs(scenario_data).find { |e| e[:npc]['id'] == colleague }&.dig(:room)
      return false unless own

      rooms = [own]
      leash = own_npc_leash(colleague)
      rooms += leash if leash
      room = rooms.include?(room_id) && scenario_data['rooms'].is_a?(Hash) ? scenario_data['rooms'][room_id] : nil
      # open to the player: never locked, or unlocked
      room.is_a?(Hash) && (room['locked'] != true || room_unlocked?(room_id))
    end

    def own_npc_leash(npc_id)
      list = scenario_room_npc(npc_id)&.dig('needsRooms')
      list.is_a?(Array) ? list.select { |r| r.is_a?(String) } : nil
    end

    # [[workaround, index]] for each performable workaround, in authored order
    def performed_workarounds(npc)
      AccessWork.workarounds(scenario_data, npc).each_with_index.select { |w, _i| performable?(npc, w) }
    end

    def declared_global?(name)
      AccessWork.present_string?(name) && scenario_data['globalVariables'].is_a?(Hash) && scenario_data['globalVariables'].key?(name)
    end

    # The server sets a declared setGlobal true when it records "done" (plan 6)
    def set_workaround_global!(w)
      name = w['setGlobal']
      return unless declared_global?(name)

      player_state['globalVariables'] = {} unless player_state['globalVariables'].is_a?(Hash)
      player_state['globalVariables'][name] = true
    end

    # The "done" answer, composed from the scenario (and, for a borrow, the guest record now), so
    # a resend gets the same body
    def workaround_body(npc, w, heard: false)
      body = case w['do']
             when 'writes_down' then { 'pcId' => npc['needsHome'], 'hasPostit' => true }
             when 'prop_door' then { 'roomId' => w['door'] }
             when 'borrow_session' then borrow_body(npc, w)
             when 'share_login' then heard ? shared_login_body(npc, w) : {}
             else {}
             end
      body['setGlobal'] = w['setGlobal'] if declared_global?(w['setGlobal'])
      { status: :ok, body: body, open_room: w['do'] == 'prop_door' ? w['door'] : nil }
    end

    # A borrow's answer: the PC by id (review R2 n2), and guest true only while the server's
    # guest record there is still this NPC's, so a resend after a later borrower's "done", a
    # sign-out or a refused timed-out claim does not make the client record it (review R2 M1)
    def borrow_body(npc, w)
      pc_id = borrow_pc_id(w)
      { 'pcId' => pc_id, 'guest' => !careful_guest?(npc) && guest_sessions[pc_id] == npc['id'] }
    end

    # The heard share (6.5): the sentence composed here from creds, the evidence note, and the
    # capture the client records. Served only in the answer to a heard "done".
    def shared_login_body(npc, w)
      username = npc['creds']['username'].to_s
      password = npc['creds']['password'].to_s
      name = npc['displayName'] || npc['id']
      colleague = scenario_room_npc(w['with'])
      other = colleague && (colleague['displayName'] || colleague['id'])
      note = "#{name} told #{other} their login out loud: #{username} / #{password}"
      # The capture is stored in the se_captures global, which every sync and reload carries, so
      # its note holds the password only where social.captures.revealSecret is on (review R1 m3);
      # otherwise the password is in the player's own notes (`note`) and the toast (`line`) alone
      capture_note = reveal_capture_secret? ? note : "#{name} told #{other} their login out loud: #{username}"
      { 'capture' => { 'targetId' => npc['id'], 'kind' => 'credential', 'address' => username, 'note' => capture_note },
        'line' => "It's #{username}. Password's #{password}.", 'note' => note, 'displayName' => name }
    end

    # The description the runner gets (plan 6): nothing secret, the target ids and the dwell.
    # A borrow also carries `need` (the need whose failure handed it over), `leavesOpen: false`
    # for a careful guest (6.4), and `routes` from the borrowed PC in a scenario with networks.
    def run_description(w, index, hand, npc = nil, need = nil)
      run = { 'index' => index, 'hand' => hand, 'do' => w['do'], 'dwell' => workaround_dwell(w) }
      %w[pc with door prop event].each { |k| run[k] = w[k] if AccessWork.present_string?(w[k]) }
      if w['do'] == 'borrow_session' && npc
        run['need'] = need.is_a?(String) ? need : 'work'
        run['leavesOpen'] = false if careful_guest?(npc)
        routes = AccessWork.routes_from(scenario_data, npc, w['pc'])
        run['routes'] = routes if routes
      end
      run
    end

    # After a counted fail: at most one workaround to perform now. The first lasting one in
    # force that is neither done nor handed over; if none, the next repeating one in force that
    # is not handed over and waiting, taken in turn (`turn` is the workaround index the next
    # turn starts from, so each repeating one comes round before any comes again).
    def choose_run!(npc, entry, need = nil)
      level = entry['level'].to_f
      performed = performed_workarounds(npc)
      pick = performed.find do |w, i|
        LASTING_KINDS.include?(w['do']) && level >= w['at'] && !entry['done'].include?(i) && !entry['handed'].key?(i.to_s)
      end
      unless pick
        repeating = performed.select { |w, i| REPEATING_KINDS.include?(w['do']) && level >= w['at'] && !entry['handed'].key?(i.to_s) }
        start = entry['turn'].to_i
        pick = repeating.find { |_w, i| i >= start } || repeating.first
        entry['turn'] = pick[1] + 1 if pick
      end
      return nil unless pick

      w, i = pick
      entry['hands'] = entry['hands'].to_i + 1
      entry['handed'][i.to_s] = { 'hand' => entry['hands'], 'time' => server_now }
      entry['handed'][i.to_s]['need'] = need if w['do'] == 'borrow_session' && need.is_a?(String)
      run_description(w, i, entry['hands'], npc, need)
    end

    # Every unspent hand-over, with its stored hand and the dwell left since the server handed it
    # over (review R2 N2), so a runner restarted after a reload waits no longer than it must
    def pending_runs(npc, e)
      list = AccessWork.workarounds(scenario_data, npc)
      e['handed'].filter_map do |key, h|
        i = strict_int(key)
        w = i.nil? ? nil : list[i]
        next nil unless h.is_a?(Hash) && performable?(npc, w)

        run = run_description(w, i, h['hand'], npc, h['need'])
        left = run['dwell'] - (server_now - h['time'].to_f)
        run['dwell'] = left.positive? ? left.ceil(1) : 0
        run
      end
    end

    # Review R2 M1: a counted fail that hands over nothing new, or a too_soon fail, answers the
    # oldest unspent hand-over again as `run`, with its own index and hand. Review R3 m2: every
    # unspent hand-over also rides as `pending` (oldest first) on each fail, too-soon and ease
    # answer, so neither a lost answer that was the NPC's last fail nor a second lost hand-over is
    # stranded until a reload. Each was handed over already, so this reveals nothing; the runner
    # starts a given (npc, index, hand) once, so a copy it holds is ignored.
    def unspent_runs(npc, entry)
      pending_runs(npc, entry).sort_by { |r| [r['hand'].to_i, r['index'].to_i] }
    end

    def unspent_run(npc, entry)
      unspent_runs(npc, entry).first
    end

    def done_list(npc, e)
      list = AccessWork.workarounds(scenario_data, npc)
      e['done'].filter_map do |i|
        w = i.is_a?(Integer) ? list[i] : nil
        next nil unless w.is_a?(Hash)

        d = { 'index' => i, 'do' => w['do'] }
        d['setGlobal'] = w['setGlobal'] if declared_global?(w['setGlobal'])
        # A propped door's room, so the client opens its sprites again after a load (plan 11.1 X4);
        # it is already in unlockedRooms, so naming it gives nothing away
        d['door'] = w['door'] if w['do'] == 'prop_door' && w['door'].is_a?(String)
        # Review R3 n3: the prop's room, so a player who resumes inside the propped room sees its
        # side of the same door open too; the NPC walked there in view, so it gives nothing away
        from = w['do'] == 'prop_door' ? AccessWork.object_index(scenario_data)[w['prop']]&.dig(:room_id) : nil
        d['from'] = from if from.is_a?(String) && from != d['door']
        d
      end
    end

    # A read-only copy of an entry with frustration_entry's defaults, for answers that write nothing
    def frustration_view(entry)
      e = entry.is_a?(Hash) ? entry.dup : {}
      e['level'] ||= 0
      %w[failAt failWhy easeAt handed lastSpent].each { |k| e[k] = {} unless e[k].is_a?(Hash) }
      %w[done lockedOut].each { |k| e[k] = [] unless e[k].is_a?(Array) }
      e
    end

    def report_one!(report)
      report = report.is_a?(Hash) ? report.transform_keys(&:to_s) : {}
      npc_id = report['npc_id'].to_s
      npc = scenario_room_npc(npc_id)
      need = report['need'].to_s
      event = report['event'].to_s
      refused = { 'npcId' => npc_id, 'refused' => true }
      # 1. NPC known
      return refused unless npc && Array(player_state['encounteredNPCs']).include?(npc_id)
      return refused unless EVENTS.include?(event)

      object_id = report['object_id'].presence&.to_s
      return check_report!(npc_id, npc, object_id) if event == 'check'
      return refused unless AccessWork.judged?(scenario_data, npc, need)

      if event == 'fail'
        fail_report!(npc_id, npc, need, object_id, report)
      else
        ease_report!(npc_id, npc, need, object_id)
      end
    end

    def fail_report!(npc_id, npc, need, object_id, report)
      refused = { 'npcId' => npc_id, 'refused' => true }
      raw = report['missing']
      return refused unless raw.is_a?(Array) && raw.size <= MAX_MISSING

      missing = raw.map { |c| c.respond_to?(:to_unsafe_h) ? c.to_unsafe_h : c }
                   .select { |c| c.is_a?(Hash) }.map { |c| c.transform_keys(&:to_s) }
                   .uniq { |c| [c['id'], c['why']] }
      return refused if missing.size > MAX_CAUSES

      # 2. can fail, and every cause and object_id belong to the NPC
      return refused unless AccessWork.can_fail?(scenario_data, npc, need)
      return refused if missing.empty? || missing.any? { |c| !AccessWork.cause_belongs?(scenario_data, npc, need, c) }
      return refused if missing.any? { |c| RECORDED_WHYS.include?(c['why']) && (need != 'work' || !lockout_recorded?(npc)) }
      return refused unless object_id && frustration_places(npc, need).include?(object_id)

      # 3. a cause holds on the server
      return { 'npcId' => npc_id, 'stale' => true } unless missing.any? { |c| frustration_cause_holds?(npc, need, c) }

      # 4. the pace floor
      entry = frustration_entry(npc_id)
      if fail_too_soon?(npc, need, entry, missing, report['rearmed'] == true || report['rearmed'] == 'true')
        body = too_soon(npc, entry, npc_id)
        run = unspent_run(npc, entry)
        body['run'] = run if run
        return body
      end

      previous = entry['level']
      per_fail = AccessWork.frustration(scenario_data, npc)['perFail']
      entry['level'] = tidy_level([previous + per_fail, 100].min)
      entry['failAt'][need] = server_now
      entry['failWhy'][need] = missing.map { |c| c['why'] }.uniq
      run = choose_run!(npc, entry, need) || unspent_run(npc, entry)
      answer(npc_id, npc, entry, previous, run)
    end

    def ease_report!(npc_id, npc, need, object_id)
      refused = { 'npcId' => npc_id, 'refused' => true }
      places = frustration_places(npc, need)
      phone_ease = object_id.nil? && need == 'social_media' && AccessWork.phone?(npc)
      return refused unless phone_ease || (object_id && places.include?(object_id))
      # An NPC with a resource it is not admitted to (W5), or one no route reaches (review R2 m3),
      # never meets its work at any place: both causes hold everywhere, so no honest client eases
      return refused if need == 'work' && owned_causes(npc, need).any? { |c| %w[no_access unreachable].include?(c['why']) }
      # R5 n5: no use at the NPC's own station can be met while a cause the server owns holds there
      station = AccessWork.station(scenario_data, npc)
      return refused if station && object_id == station['id'] && owned_causes(npc, need).any?

      # Review R1 n5: an ease at level 0 changes nothing, so it writes nothing (an honest client
      # sends one only above 0; an NPC that never failed keeps no entry)
      stored = npc_frustration[npc_id]
      unless stored.is_a?(Hash) && stored['level'].to_f.positive?
        view = frustration_view(stored)
        return answer(npc_id, npc, view, view['level'])
      end

      entry = frustration_entry(npc_id)
      last = entry['easeAt'][need]
      return too_soon(npc, entry, npc_id) if last && server_now - last.to_f < AccessWork.use_floor(scenario_data, npc, need)

      previous = entry['level']
      ease = AccessWork.frustration(scenario_data, npc)['easePerSuccess']
      entry['level'] = tidy_level([previous - ease, 0].max)
      entry['easeAt'][need] = server_now
      answer(npc_id, npc, entry, previous)
    end

    # Sub-slice L: a lockout is an owned cause only once a `check` has recorded it (6.6)
    def owned_causes(npc, need)
      AccessWork.owned_causes(scenario_data, npc, need, lockout_recorded?(npc) ? lockout_keys : nil)
    end

    # Sub-slice L (6.6, plan 9.1): a `check` report. Refused unless the object is the NPC's own
    # station, a sign-in PC it owns under a policy with maxAttempts (AccessWork.lockout_station?),
    # in a room the player can know of (review R2 m5). Answers { npcId, lockedOut }; a true answer
    # records the station in the NPC's lockedOut list, and nothing else is ever written. No list
    # of locked-out accounts is sent: the answer is about this owner at this PC only.
    def check_report!(npc_id, npc, object_id)
      refused = { 'npcId' => npc_id, 'refused' => true }
      st = AccessWork.station(scenario_data, npc)
      return refused unless st && object_id == st['id'] && AccessWork.lockout_station?(scenario_data, npc)
      # Review R1 m3: only an owner with a work plan, as the honest client asks (shouldCheckLockout)
      return refused unless AccessWork.work_plan?(scenario_data, npc)

      room = AccessWork.object_index(scenario_data)[st['id']]&.dig(:room_id)
      return refused unless room && room_unlocked?(room)

      locked = AccessWork.locked_out_at?(npc, st, lockout_keys)
      if locked
        entry = frustration_entry(npc_id)
        entry['lockedOut'] << st['id'] unless entry['lockedOut'].include?(st['id'])
      end
      { 'npcId' => npc_id, 'lockedOut' => locked }
    end

    # Whether a `check` recorded the NPC locked out at its own station, and the lockout still
    # stands (it lasts the mission; read again so a record never outlives loginLockouts)
    def lockout_recorded?(npc)
      st = AccessWork.station(scenario_data, npc)
      return false unless st && npc.is_a?(Hash)

      store = player_state['npcFrustration']
      entry = store.is_a?(Hash) ? store[npc['id'].to_s] : nil
      return false unless entry.is_a?(Hash) && Array(entry['lockedOut']).include?(st['id'])

      AccessWork.locked_out_at?(npc, st, lockout_keys)
    end

    # player_state.loginLockouts read only (login_lockouts would write a default)
    def lockout_keys
      list = player_state['loginLockouts']
      list.is_a?(Array) ? list : []
    end

    # The NPC's places the player can know of (review R2 m5): an object in a room the server has
    # not sent (locked, never entered) answers as an unknown id, so a guessed id learns nothing.
    # No honest client names one: its candidates come from loaded rooms.
    def frustration_places(npc, need)
      (AccessWork.places(scenario_data, npc, need) | handed_borrow_pcs(npc, need)).select do |id|
        room = AccessWork.object_index(scenario_data)[id]&.dig(:room_id)
        room && room_unlocked?(room)
      end
    end

    # Review R2 n5: a whole level is stored and answered as an Integer (34, not 34.0)
    def tidy_level(value)
      v = value.to_f.round(2)
      v == v.to_i ? v.to_i : v
    end

    # A later fail is held to the park floor after the last accepted fail, or to the use floor
    # when a gate lies between: an accepted ease since that fail; `rearmed` with no cause the
    # server owns holding; or (R5 n1) the last fail listed only `off` and this one a cause the
    # server owns.
    def fail_too_soon?(npc, need, entry, missing, rearmed)
      last = entry['failAt'][need]
      return false unless last

      gap = server_now - last.to_f
      owned = owned_causes(npc, need)
      gate = entry['easeAt'][need].to_f > last.to_f
      gate ||= rearmed && owned.empty?
      gate ||= Array(entry['failWhy'][need]) == ['off'] && owned.any? && missing.any? { |c| owned.any? { |o| o['id'] == c['id'] && o['why'] == c['why'] } }
      floor = gate ? AccessWork.use_floor(scenario_data, npc, need) : AccessWork.park_floor(npc)
      gap < floor
    end

    def frustration_global(name)
      globals = player_state['globalVariables']
      return globals[name] if globals.is_a?(Hash) && globals.key?(name)

      defaults = scenario_data['globalVariables']
      defaults.is_a?(Hash) ? defaults[name] : nil
    end

    # npc-needs.js requiredGlobalsHold: a name is truthy; { name: value } matches every value
    def frustration_globals_hold?(cond)
      case cond
      when String then truthy_global?(frustration_global(cond))
      when Hash then cond.all? { |k, v| frustration_global(k.to_s) == v }
      else false
      end
    end

    def truthy_global?(value)
      !(value.nil? || value == false || value == 0 || value == '')
    end

    def frustration_cause_holds?(npc, need, cause)
      id = cause['id']
      case cause['why']
      when 'down'
        # Review R2 m1: a resource with no downIf never goes down (a global named "" is not one)
        dn = AccessWork.resources(scenario_data)[id]&.dig('downIf')
        AccessWork.present_string?(dn) && truthy_global?(frustration_global(dn))
      when 'unreachable'
        routes = AccessWork.routes(scenario_data, npc, AccessWork.resources(scenario_data)[id])
        !routes.nil? && routes.none? { |route| route.none? { |g| truthy_global?(frustration_global(g.to_s)) } }
      when 'no_access'
        !AccessWork.admitted?(AccessWork.resources(scenario_data)[id], npc)
      when 'off'
        cond = AccessWork.affordance(scenario_data, AccessWork.object(scenario_data, id))&.dig('offWhen')
        !cond.nil? && frustration_globals_hold?(cond)
      when 'social_blocked'
        need == 'social_media' && AccessWork.social_blocked?(scenario_data, npc)
      when 'locked_out'
        # Sub-slice L: the server's own loginLockouts, behind the check record (a fail with no
        # record is refused before this)
        lockout_recorded?(npc)
      else
        false
      end
    end

    # tell (5.5): 0 at level 0; 2 when a workaround is in force (the level is at or above its
    # `at`) or one more failure would bring one into force, or (with none still to come) bring
    # the level to 100; else 1. Only the workarounds this build performs count.
    def frustration_tell(npc, entry)
      level = entry['level'].to_f
      return 0 if level <= 0

      per_fail = AccessWork.frustration(scenario_data, npc)['perFail']
      list = performed_workarounds(npc).map(&:first)
      return 2 if list.any? { |w| level >= w['at'] }
      return 2 if list.any? { |w| level + per_fail >= w['at'] }
      return 2 if list.empty? && level + per_fail >= 100

      1
    end

    # settled (5.4): another failure can change nothing: level 100, nothing handed over and
    # waiting, no lasting workaround in force still to hand over, and no repeating workaround
    # (at 100 every one is in force, and each later failure performs it again)
    def frustration_settled?(npc, entry)
      return false unless entry['level'].to_f >= 100 && entry['handed'].empty?

      performed_workarounds(npc).none? do |w, i|
        REPEATING_KINDS.include?(w['do']) || (LASTING_KINDS.include?(w['do']) && !Array(entry['done']).include?(i))
      end
    end

    def answer(npc_id, npc, entry, previous, run = nil)
      { 'npcId' => npc_id, 'level' => entry['level'], 'previous' => previous,
        'tell' => frustration_tell(npc, entry), 'settled' => frustration_settled?(npc, entry), 'run' => run,
        'pending' => unspent_runs(npc, entry) }
    end

    def too_soon(npc, entry, npc_id)
      { 'npcId' => npc_id, 'level' => entry['level'], 'tell' => frustration_tell(npc, entry),
        'settled' => frustration_settled?(npc, entry), 'tooSoon' => true, 'pending' => unspent_runs(npc, entry) }
    end
  end
end
