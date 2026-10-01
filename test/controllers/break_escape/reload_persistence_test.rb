require 'test_helper'

# State that has to survive a page reload (approval log m03 item 6, D5):
# aims opened by unlockCondition, aims/tasks opened by ink tags or
# eventMappings, the RFID cloner's saved cards, and NPC-local ink variables.
# Driven over HTTP because the client only sees what the endpoints return.
module BreakEscape
  class ReloadPersistenceTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    PLAYER_STATE = {
      'currentRoom' => 'lobby',
      'unlockedRooms' => ['lobby'],
      'unlockedObjects' => [],
      'inventory' => [],
      'encounteredNPCs' => [],
      'globalVariables' => {},
      'notes' => [],
      'health' => 100,
      'objectivesState' => { 'tasks' => {}, 'aims' => {} }
    }.freeze

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @owner   = break_escape_demo_users(:test_user)

      PlayerPreference.find_or_create_by!(player: @owner) do |pref|
        pref.selected_sprite = 'female_spy'
        pref.in_game_name    = 'TestAgent'
      end
    end

    # =========================================================================
    # Aim statuses on load
    # =========================================================================

    test 'an aim opened by aimCompleted comes back active, not locked' do
      game = create_game(aims: { 'first' => 'completed' })

      aims = scenario_json(game).dig('objectivesState', 'aims')

      assert_equal 'active', aims.dig('second', 'status'),
                   'The client opens this aim when first completes but never tells the server'
      assert_equal 'completed', aims.dig('first', 'status')
    end

    test 'an aim waiting on its condition stays locked' do
      game = create_game(aims: {})

      aims = scenario_json(game).dig('objectivesState', 'aims')

      assert_nil aims['second'], 'Unmet unlockCondition must not reveal the aim'
      assert_nil aims['both']
    end

    test 'aimsCompleted needs every listed aim' do
      partial = create_game(aims: { 'first' => 'completed' })
      assert_nil scenario_json(partial).dig('objectivesState', 'aims', 'both')

      full = create_game(aims: { 'first' => 'completed', 'second' => 'completed' })
      assert_equal 'active', scenario_json(full).dig('objectivesState', 'aims', 'both', 'status')
    end

    test 'a locked aim with no unlockCondition comes back active once a task is done' do
      game = create_game(tasks: { 'hidden_task' => 'completed' })

      assert_equal 'active', scenario_json(game).dig('objectivesState', 'aims', 'hidden', 'status')
    end

    test 'a task done early does not reveal an aim whose unlockCondition is unmet' do
      game = create_game(tasks: { 'second_task' => 'completed' })

      assert_nil scenario_json(game).dig('objectivesState', 'aims', 'second'),
                 'Matches revealAimForCompletedTask: the aim stays hidden until first completes'
    end

    test 'a task done under a globalVariable condition reveals the aim only when the global is set' do
      unset = create_game(tasks: { 'gated_task' => 'completed' })
      assert_nil scenario_json(unset).dig('objectivesState', 'aims', 'gated')

      set = create_game(tasks: { 'gated_task' => 'completed' }, globals: { 'gate_open' => true })
      assert_equal 'active', scenario_json(set).dig('objectivesState', 'aims', 'gated', 'status')
    end

    test 'a globalVariable condition alone does not reveal an aim with no completed task' do
      game = create_game(globals: { 'gate_open' => true })

      assert_nil scenario_json(game).dig('objectivesState', 'aims', 'gated'),
                 'The client only checks that condition when a task completes'
    end

    test 'derivation does not change the stored state' do
      game = create_game(aims: { 'first' => 'completed' })
      scenario_json(game)

      assert_nil game.reload.player_state.dig('objectivesState', 'aims', 'second')
    end

    test 'the objectives endpoint reports the same derived state' do
      game = create_game(aims: { 'first' => 'completed' })

      get objectives_game_url(game)

      assert_response :success
      assert_equal 'active', response.parsed_body.dig('state', 'aims', 'second', 'status')
    end

    # =========================================================================
    # Unlocks from ink tags and eventMappings
    # =========================================================================

    test 'an ink-unlocked aim is recorded and survives a reload' do
      game = create_game

      post unlock_objective_game_url(game), params: { kind: 'aim', objective_id: 'hidden' }, as: :json

      assert_response :success
      assert_equal 'active', game.reload.player_state.dig('objectivesState', 'aims', 'hidden', 'status')
      assert_equal 'active', scenario_json(game).dig('objectivesState', 'aims', 'hidden', 'status')
    end

    test 'an ink-unlocked task is recorded' do
      game = create_game

      post unlock_objective_game_url(game), params: { kind: 'task', objective_id: 'locked_task' }, as: :json

      assert_response :success
      assert_equal 'active', game.reload.player_state.dig('objectivesState', 'tasks', 'locked_task', 'status')
    end

    test 'unlocking never reopens a completed aim' do
      game = create_game(aims: { 'first' => 'completed' })

      post unlock_objective_game_url(game), params: { kind: 'aim', objective_id: 'first' }, as: :json

      assert_response :success
      assert_equal 'completed', game.reload.player_state.dig('objectivesState', 'aims', 'first', 'status')
    end

    test 'unlocking an unknown objective is refused' do
      game = create_game

      post unlock_objective_game_url(game), params: { kind: 'aim', objective_id: 'nope' }, as: :json
      assert_response :unprocessable_entity

      post unlock_objective_game_url(game), params: { kind: 'room', objective_id: 'first' }, as: :json
      assert_response :unprocessable_entity
    end

    # =========================================================================
    # RFID cloner saved cards
    # =========================================================================

    CARD = {
      'name' => 'Executive Keycard', 'card_id' => 'victoria_keycard',
      'rfid_protocol' => 'EM4100', 'rfid_hex' => '0A1B2C3D4E',
      'rfid_data' => { 'uid' => '0A1B2C3D4E' }, 'timestamp' => 1_700_000_000_000
    }.freeze

    test 'cloned cards are stored on the cloner and come back on load' do
      game = create_game(inventory: [{ 'type' => 'rfid_cloner', 'name' => 'RFID Cloner', 'id' => 'cloner' }])

      post inventory_game_url(game), params: { action_type: 'update_saved_cards', saved_cards: [CARD] }, as: :json

      assert_response :success
      cloner = scenario_json(game)['playerInventory'].find { |i| i['type'] == 'rfid_cloner' }
      assert_equal ['victoria_keycard'], cloner['saved_cards'].map { |c| c['card_id'] }
      assert_equal '0A1B2C3D4E', cloner['saved_cards'].first.dig('rfid_data', 'uid')
    end

    test 'saved cards replace the previous list' do
      game = create_game(inventory: [{ 'type' => 'rfid_cloner', 'name' => 'RFID Cloner',
                                       'saved_cards' => [CARD] }])
      second = CARD.merge('card_id' => 'guard_badge', 'name' => 'Guard Badge')

      post inventory_game_url(game), params: { action_type: 'update_saved_cards', saved_cards: [CARD, second] }, as: :json

      assert_response :success
      assert_equal %w[victoria_keycard guard_badge],
                   game.reload.player_state['inventory'].first['saved_cards'].map { |c| c['card_id'] }
    end

    test 'saving cards without a cloner is refused' do
      game = create_game

      post inventory_game_url(game), params: { action_type: 'update_saved_cards', saved_cards: [CARD] }, as: :json

      assert_response :unprocessable_entity
    end

    test 'more cards than the cloner holds is refused' do
      game = create_game(inventory: [{ 'type' => 'rfid_cloner', 'name' => 'RFID Cloner' }])
      cards = Array.new(Game::MAX_SAVED_CARDS + 1) { |i| CARD.merge('card_id' => "c#{i}") }

      post inventory_game_url(game), params: { action_type: 'update_saved_cards', saved_cards: cards }, as: :json

      assert_response :unprocessable_entity
      assert_nil game.reload.player_state['inventory'].first['saved_cards']
    end

    # =========================================================================
    # NPC-local ink variables
    # =========================================================================

    test 'NPC ink variables sync, merge per NPC and come back on load' do
      game = create_game

      put sync_state_game_url(game),
          params: { npcInkVariables: { 'victoria' => { 'recruitment_discussed' => true, 'trust' => 2 },
                                       'guard' => { 'player_warned' => false } } },
          as: :json
      assert_response :success

      put sync_state_game_url(game),
          params: { npcInkVariables: { 'victoria' => { 'recruitment_discussed' => true, 'trust' => 3 } } },
          as: :json
      assert_response :success

      saved = scenario_json(game)['savedNpcInkVariables']
      assert_equal({ 'recruitment_discussed' => true, 'trust' => 3 }, saved['victoria'])
      assert_equal({ 'player_warned' => false }, saved['guard'], 'An NPC not in this sync keeps its variables')
    end

    test 'only scalar ink variables are kept' do
      game = create_game

      put sync_state_game_url(game),
          params: { npcInkVariables: { 'victoria' => { 'met' => true, 'name' => 'V', 'list' => { 'a' => 1 } } } },
          as: :json

      assert_response :success
      assert_equal({ 'met' => true, 'name' => 'V' }, game.reload.player_state.dig('npcInkVariables', 'victoria'))
    end

    test 'an oversized ink-variable sync is dropped without losing what was saved' do
      game = create_game

      put sync_state_game_url(game), params: { npcInkVariables: { 'victoria' => { 'met' => true } } }, as: :json
      huge = { 'blob' => 'x' * (Game::MAX_NPC_INK_VARIABLES_BYTES + 1) }
      put sync_state_game_url(game), params: { npcInkVariables: { 'victoria' => huge } }, as: :json

      assert_response :success
      assert_equal({ 'met' => true }, game.reload.player_state.dig('npcInkVariables', 'victoria'))
    end

    test 'a sync without ink variables leaves them alone' do
      game = create_game
      put sync_state_game_url(game), params: { npcInkVariables: { 'victoria' => { 'met' => true } } }, as: :json

      put sync_state_game_url(game), params: { globalVariables: { 'briefing_played' => true } }, as: :json

      assert_response :success
      assert_equal({ 'met' => true }, game.reload.player_state.dig('npcInkVariables', 'victoria'))
      assert_equal true, game.player_state.dig('globalVariables', 'briefing_played')
    end

    # =========================================================================
    # Fired onceOnly / maxTriggers eventMapping handlers
    # =========================================================================

    test 'fired one-shot handlers sync, keep the larger count and come back on load' do
      game = create_game
      key = 'security_guard_patrol:room_entered:server_room:1'

      put sync_state_game_url(game), params: { triggeredEvents: { key => 1, 'hax:a:0' => 2 } }, as: :json
      assert_response :success
      put sync_state_game_url(game), params: { triggeredEvents: { 'hax:a:0' => 1, 'hax:b:3' => 1 } }, as: :json
      assert_response :success

      saved = scenario_json(game)['savedTriggeredEvents']
      assert_equal({ key => 1, 'hax:a:0' => 2, 'hax:b:3' => 1 }, saved,
                   'A stale lower count from another tab must not lower a saved one')
    end

    test 'bad trigger entries are dropped' do
      game = create_game

      put sync_state_game_url(game),
          params: { triggeredEvents: { 'ok:x:0' => 1, 'zero:x:0' => 0, 'text:x:0' => 'yes', ('k' * 400) => 1 } },
          as: :json

      assert_response :success
      assert_equal({ 'ok:x:0' => 1 }, game.reload.player_state['triggeredEvents'])
    end

    test 'too many trigger keys is refused without losing what was saved' do
      game = create_game
      put sync_state_game_url(game), params: { triggeredEvents: { 'ok:x:0' => 1 } }, as: :json

      flood = (0..Game::MAX_TRIGGERED_EVENTS).to_h { |i| ["n:e:#{i}", 1] }
      put sync_state_game_url(game), params: { triggeredEvents: flood }, as: :json

      assert_response :success
      assert_equal({ 'ok:x:0' => 1 }, game.reload.player_state['triggeredEvents'])
    end

    private

    def scenario_json(game)
      get scenario_game_url(game)
      assert_response :success
      response.parsed_body
    end

    def create_game(aims: {}, tasks: {}, inventory: [], globals: {})
      state = PLAYER_STATE.deep_dup
      state['globalVariables'] = globals.dup
      aims.each  { |id, status| state['objectivesState']['aims'][id]  = { 'status' => status } }
      tasks.each { |id, status| state['objectivesState']['tasks'][id] = { 'status' => status } }
      state['inventory'] = inventory.map(&:deep_dup)
      Game.create!(mission: @mission, player: @owner, scenario_data: scenario, player_state: state)
    end

    def scenario
      task = ->(id, extra = {}) { { 'taskId' => id, 'title' => id, 'type' => 'custom', 'status' => 'active' }.merge(extra) }
      {
        'startRoom' => 'lobby',
        'rooms' => { 'lobby' => { 'type' => 'room_office', 'locked' => false, 'connections' => {},
                                  'objects' => [], 'npcs' => [] } },
        'globalVariables' => {},
        'objectives' => [
          { 'aimId' => 'first', 'title' => 'First', 'status' => 'active', 'order' => 0,
            'tasks' => [task.call('first_task')] },
          { 'aimId' => 'second', 'title' => 'Second', 'status' => 'locked', 'order' => 1,
            'unlockCondition' => { 'aimCompleted' => 'first' },
            'tasks' => [task.call('second_task')] },
          { 'aimId' => 'both', 'title' => 'Both', 'status' => 'locked', 'order' => 2,
            'unlockCondition' => { 'aimsCompleted' => %w[first second] },
            'tasks' => [task.call('both_task')] },
          { 'aimId' => 'hidden', 'title' => 'Hidden', 'status' => 'locked', 'order' => 3,
            'tasks' => [task.call('hidden_task'), task.call('locked_task', 'status' => 'locked')] },
          { 'aimId' => 'gated', 'title' => 'Gated', 'status' => 'locked', 'order' => 4,
            'unlockCondition' => { 'globalVariable' => 'gate_open' },
            'tasks' => [task.call('gated_task'), task.call('gated_task_2')] }
        ]
      }
    end
  end
end
