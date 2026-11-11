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
    EVENTS = %w[fail ease].freeze
    # Causes the server owns: no event in play clears them (plan 9.1, gate 2)
    OWNED_WHYS = %w[no_access social_blocked locked_out].freeze

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
    # pending and done workarounds (sub-slice B), and lockedOut (sub-slice L).
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
                    'pending' => [], 'done' => [], 'lockedOut' => e['lockedOut'] }
          block['hold'] = hold unless hold.empty?
          out[id] = block
        end
      end
    end

    private

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
      return refused unless EVENTS.include?(event) && AccessWork.judged?(scenario_data, npc, need)

      object_id = report['object_id'].presence&.to_s
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
      return refused unless object_id && AccessWork.places(scenario_data, npc, need).include?(object_id)

      # 3. a cause holds on the server
      return { 'npcId' => npc_id, 'stale' => true } unless missing.any? { |c| frustration_cause_holds?(npc, need, c) }

      # 4. the pace floor
      entry = frustration_entry(npc_id)
      return too_soon(npc, entry, npc_id) if fail_too_soon?(npc, need, entry, missing, report['rearmed'] == true || report['rearmed'] == 'true')

      previous = entry['level']
      per_fail = AccessWork.frustration(scenario_data, npc)['perFail']
      entry['level'] = [previous + per_fail, 100].min.round(2)
      entry['failAt'][need] = server_now
      entry['failWhy'][need] = missing.map { |c| c['why'] }.uniq
      answer(npc_id, npc, entry, previous)
    end

    def ease_report!(npc_id, npc, need, object_id)
      refused = { 'npcId' => npc_id, 'refused' => true }
      places = AccessWork.places(scenario_data, npc, need)
      phone_ease = object_id.nil? && need == 'social_media' && AccessWork.phone?(npc)
      return refused unless phone_ease || (object_id && places.include?(object_id))
      # An NPC with a resource it is not admitted to never meets its work (W5)
      if need == 'work'
        res = AccessWork.resources(scenario_data)
        return refused if AccessWork.work_list(scenario_data, npc).any? { |id| res[id] && !AccessWork.admitted?(res[id], npc) }
      end
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
      entry['level'] = [previous - ease, 0].max.round(2)
      entry['easeAt'][need] = server_now
      answer(npc_id, npc, entry, previous)
    end

    def owned_causes(npc, need)
      AccessWork.owned_causes(scenario_data, npc, need, login_lockouts)
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
        truthy_global?(frustration_global(AccessWork.resources(scenario_data)[id]&.dig('downIf').to_s))
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
        st = AccessWork.object(scenario_data, id)
        st && AccessWork.locked_out_at?(npc, st, login_lockouts)
      else
        false
      end
    end

    # tell (5.5): 0 at level 0; 2 when a workaround is in force or one more failure would bring
    # one into force or (with none still to come) bring the level to 100; else 1.
    # In A nothing is handed over, so a workaround whose `at` the level has passed is neither to
    # come nor in force (with `at` 20 and perFail 34 the first fail answers tell 1). Sub-slice B
    # replaces the `done` test below with the `handed` record (review R1 n6).
    def frustration_tell(npc, entry)
      level = entry['level'].to_f
      return 0 if level <= 0

      per_fail = AccessWork.frustration(scenario_data, npc)['perFail']
      list = AccessWork.workarounds(scenario_data, npc)
      done = Array(entry['done'])
      return 2 if done.any?

      to_come = list.each_with_index.reject { |_w, i| done.include?(i) }.map(&:first)
      return 2 if to_come.any? { |w| w['at'].is_a?(Numeric) && level < w['at'] && level + per_fail >= w['at'] }
      return 2 if to_come.none? { |w| w['at'].is_a?(Numeric) && level < w['at'] } && level + per_fail >= 100

      1
    end

    # settled (5.4): another failure can change nothing (level 100, nothing handed over and
    # waiting; repeating workarounds arrive with sub-slice B)
    def frustration_settled?(_npc, entry)
      entry['level'].to_f >= 100 && entry['handed'].empty?
    end

    def answer(npc_id, npc, entry, previous)
      { 'npcId' => npc_id, 'level' => entry['level'], 'previous' => previous,
        'tell' => frustration_tell(npc, entry), 'settled' => frustration_settled?(npc, entry), 'run' => nil }
    end

    def too_soon(npc, entry, npc_id)
      { 'npcId' => npc_id, 'level' => entry['level'], 'tell' => frustration_tell(npc, entry),
        'settled' => frustration_settled?(npc, entry), 'tooSoon' => true }
    end
  end
end
