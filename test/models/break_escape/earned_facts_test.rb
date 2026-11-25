require 'test_helper'

module BreakEscape
  # S7 unit 07: the server's earned-fact set and its two writers.
  class EarnedFactsTest < ActiveSupport::TestCase
    FACTS = { 'pet_name' => { 'label' => 'Pet' }, 'birthday' => { 'label' => 'Birthday' } }.freeze

    def build_game(extra = {}, state = {})
      scenario = {
        'startRoom' => 'office',
        'rooms' => { 'office' => { 'objects' => [] } },
        'social' => { 'intelFacts' => FACTS.deep_dup }
      }.merge(extra)
      game = Game.new(scenario_data: scenario, player_state: { 'inventory' => [] }.merge(state))
      game.define_singleton_method(:save!) { |*| (@saves = @saves.to_i + 1) } # unsaved record: count only
      game
    end

    def count_saves(game)
      game.instance_variable_set(:@saves, 0)
      yield
      game.instance_variable_get(:@saves)
    end

    test 'a stamp on add with fact_source true, none with false' do
      game = build_game
      item = { 'id' => 'memo', 'type' => 'text_file', 'name' => 'Memo', 'revealsFacts' => %w[pet_name] }
      game.add_inventory_item!(item.deep_dup)
      assert_equal [], game.earned_fact_ids
      game = build_game
      game.add_inventory_item!(item.deep_dup, fact_source: true)
      assert_equal %w[pet_name], game.earned_fact_ids
    end

    test 'the stored copy inside scenarioData is read' do
      game = build_game
      game.add_inventory_item!({ 'id' => 'm', 'type' => 'text_file', 'name' => 'M',
                                 'scenarioData' => { 'revealsFacts' => %w[birthday] } }, fact_source: true)
      assert_equal %w[birthday], game.earned_fact_ids
    end

    test 'none for a notepad or decor cup type' do
      %w[notepad office-misc-cup].each do |type|
        game = build_game
        game.add_inventory_item!({ 'id' => 'x', 'type' => type, 'name' => 'x', 'revealsFacts' => %w[pet_name] },
                                 fact_source: true)
        assert_equal [], game.earned_fact_ids, type
      end
    end

    test 'none on a duplicate add, and one save' do
      game = build_game
      item = { 'id' => 'memo', 'type' => 'text_file', 'name' => 'Memo', 'revealsFacts' => %w[pet_name] }
      saves = count_saves(game) do
        game.add_inventory_item!(item.deep_dup, fact_source: true)
        game.player_state['earnedFacts'] = []
        game.add_inventory_item!(item.deep_dup, fact_source: true)
      end
      assert_equal 1, saves
      assert_equal [], game.player_state['earnedFacts']
    end

    test 'an item stored under another item id earns only its own facts' do
      other = { 'id' => 'other', 'type' => 'text_file', 'name' => 'Other', 'revealsFacts' => %w[birthday] }
      game = build_game('rooms' => { 'office' => { 'objects' => [other] } })
      game.add_inventory_item!({ 'id' => 'other', 'type' => 'text_file', 'name' => 'Imposter' }, fact_source: true)
      assert_equal [], game.earned_fact_ids
    end

    test 'start item facts count with an empty inventory' do
      game = build_game('startItemsInInventory' => [
        { 'id' => 's', 'type' => 'text_file', 'name' => 'S', 'revealsFacts' => %w[pet_name] }
      ])
      assert_equal [], game.player_state['inventory']
      assert_equal %w[pet_name], game.earned_fact_ids
    end

    test 'a served feed post fact counts in both id forms' do
      npc = ->(fact) {
        { 'id' => 'lena', 'needs' => { 'social_media' => { 'decayPerMin' => 1 } },
          'feed' => { 'site' => 'f', 'person' => 'Lena', 'posts' => [{ 'id' => 'p1', 'text' => 'hi', 'fact' => fact }] } }
      }
      %w[se_intel_birthday birthday].each do |form|
        game = build_game({ 'rooms' => { 'office' => { 'objects' => [], 'npcs' => [npc.call(form)] } } },
                          'feedRevealed' => { 'lena' => { 'shown' => %w[p1], 'at' => 1 } })
        assert_equal %w[birthday], game.earned_fact_ids, form
      end
      unserved = build_game({ 'rooms' => { 'office' => { 'objects' => [], 'npcs' => [npc.call('birthday')] } } })
      assert_equal [], unserved.earned_fact_ids
    end

    test 'stamp_earned_facts! drops unknown ids, does not save, and stops at 64' do
      game = build_game
      saves = count_saves(game) { game.stamp_earned_facts!(%w[pet_name nope pet_name]) }
      assert_equal 0, saves
      assert_equal %w[pet_name], game.earned_fact_ids
      many = (1..70).to_h { |i| ["f#{i}", { 'label' => 'x' }] }
      big = build_game('social' => { 'intelFacts' => many })
      big.stamp_earned_facts!(many.keys)
      assert_equal 64, big.player_state['earnedFacts'].length
    end

    test 'a pre-S7 state with no keys reads as empty' do
      game = Game.new(scenario_data: { 'rooms' => {} }, player_state: {})
      assert_equal [], game.earned_fact_ids
      assert_equal [], Game::ACCESS_STATE_DEFAULTS['earnedFacts']
      %w[crackRuns crackStarted].each { |k| assert_equal({}, Game::ACCESS_STATE_DEFAULTS[k]) }
      assert_equal [], Game::ACCESS_STATE_DEFAULTS['crackedAccounts']
    end

    test 'revealsFacts is a forgeable item field' do
      assert_includes ItemIdentity::FORGEABLE_ITEM_FIELDS, 'revealsFacts'
    end

    test 'R2-3: a grant_fact in the hash form of flagRewards is withheld from the bootstrap until earned' do
      game = build_game('rooms' => { 'office' => { 'objects' => [
        { 'id' => 'station', 'type' => 'flag-station',
          'flagRewards' => { 'flag{x}' => { 'type' => 'grant_fact', 'fact' => 'pet_name' } } }
      ] } })
      filtered = { 'social' => { 'intelFacts' => FACTS.deep_dup } }
      game.withhold_unearned_facts!(filtered)
      assert_equal %w[birthday], filtered['social']['intelFacts'].keys
      game.stamp_earned_facts!(%w[pet_name])
      filtered = { 'social' => { 'intelFacts' => FACTS.deep_dup } }
      game.withhold_unearned_facts!(filtered)
      assert_equal %w[birthday pet_name].sort, filtered['social']['intelFacts'].keys.sort
    end
  end
end
