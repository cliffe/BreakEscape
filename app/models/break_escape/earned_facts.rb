module BreakEscape
  # Earned facts (S7, feature A21): the intel fact ids the server knows the player has earned, for
  # the offline cracker. The browser never sends a fact it holds; it sends the ids it wants to try
  # and the server checks them against this set (docs/agents/ops_core_build/S7_BUILD_BRIEF.md, 4).
  #
  # player_state key (in Game::ACCESS_STATE_DEFAULTS):
  #   earnedFacts [factId, ...] written in two places only: add_inventory_item!(item, fact_source: true)
  #   and stamp_earned_facts!. Server-written only, at most 64 ids, never in a sync body or any answer.
  #
  # earned_fact_ids is the union of that list, the revealsFacts of the scenario's start items, and
  # the fact of every feed post the server has served.
  module EarnedFacts
    extend ActiveSupport::Concern

    EARNED_FACTS_CAP = 64
    FEED_FACT_PREFIX = 'se_intel_'.freeze

    # Sorted, unique fact ids the player has earned. Reads only; a pre-S7 state with no keys is empty.
    def earned_fact_ids
      ids = Array(player_state['earnedFacts']).grep(String)
      ids.concat(start_item_fact_ids)
      ids.concat(served_feed_fact_ids)
      ids.reject(&:empty?).uniq.sort
    end

    # Adds the ids that name a social.intelFacts entry, up to the cap of 64. Called from inside a
    # caller's own save (a flag reward the server has just accepted), so it does NOT save: the
    # caller's save! writes the state. Returns the ids newly added.
    def stamp_earned_facts!(ids)
      known = known_intel_fact_ids
      held = player_state['earnedFacts'] = Array(player_state['earnedFacts']).grep(String)
      added = []
      Array(ids).each do |id|
        break if held.length >= EARNED_FACTS_CAP

        id = id.to_s
        next if id.empty? || held.include?(id) || !known.include?(id)

        held << id
        added << id
      end
      added
    end

    private

    # The stamp add_inventory_item!(item, fact_source: true) uses. Reads the STORED copy
    # (item['scenarioData'] || item), never a definition looked up by id. Never for a notepad or a
    # decor cup (client-built types). Does not save: add_inventory_item! saves right after.
    def stamp_item_facts!(item)
      return [] unless item.is_a?(Hash)

      data = item['scenarioData'].is_a?(Hash) ? item['scenarioData'] : item
      return [] if BreakEscape::DeclaredGrants::ALWAYS_ALLOWED.include?(data['type'].to_s)
      return [] if BreakEscape::DeclaredGrants::DECOR_CUPS.include?(data['type'].to_s)

      facts = data['revealsFacts']
      return [] unless facts.is_a?(Array)

      stamp_earned_facts!(facts.grep(String))
    end

    def known_intel_fact_ids
      facts = scenario_data.is_a?(Hash) ? scenario_data.dig('social', 'intelFacts') : nil
      facts.is_a?(Hash) ? facts.keys.map(&:to_s) : []
    end

    # The revealsFacts of every startItemsInInventory definition, read from scenario_data.
    def start_item_fact_ids
      items = scenario_data.is_a?(Hash) ? scenario_data['startItemsInInventory'] : nil
      return [] unless items.is_a?(Array)

      items.flat_map do |item|
        next [] unless item.is_a?(Hash)

        data = item['scenarioData'].is_a?(Hash) ? item['scenarioData'] : item
        Array(data['revealsFacts']).grep(String)
      end
    end

    # The fact of each feed post the server has served, one leading "se_intel_" removed.
    def served_feed_fact_ids
      store = player_state['feedRevealed']
      return [] unless store.is_a?(Hash)

      store.flat_map do |npc_id, entry|
        npc = AccessWork.room_npc(scenario_data, npc_id)
        next [] unless npc && entry.is_a?(Hash)

        shown = AccessWork.feed_shown_ids(npc, entry)
        AccessWork.feed_posts(npc).filter_map do |post|
          fact = post['fact']
          next unless shown.include?(post['id']) && fact.is_a?(String) && !fact.empty?

          fact.delete_prefix(FEED_FACT_PREFIX)
        end
      end
    end
  end
end
