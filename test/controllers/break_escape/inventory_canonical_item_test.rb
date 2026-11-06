require 'test_helper'

# Declared-grants review R1, M6: an inventory add stored the client's hash as
# sent, and the key and lockpick checks read opens_lock, scenarioData and type
# from it. A forged notepad (or any takeable item) carrying those fields opened
# key locks. The server now stores its own copy of the matched scenario item.
module BreakEscape
  class InventoryCanonicalItemTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    VAULT_KEY = { 'type' => 'key', 'name' => 'Vault key', 'opens_lock' => 'vault_lock',
                  'keyPins' => [30, 40, 50, 60], 'takeable' => true }.freeze
    LOCKPICK = { 'type' => 'lockpick', 'id' => 'lockpick_1', 'name' => 'Lock pick set', 'takeable' => true }.freeze
    MEMO = { 'type' => 'notes', 'id' => 'memo', 'name' => 'Memo', 'text' => 'Hello', 'takeable' => true }.freeze
    BRIEFCASE = {
      'type' => 'briefcase', 'id' => 'briefcase_1', 'name' => 'Briefcase', 'takeable' => true,
      'locked' => true, 'lockType' => 'pin', 'requires' => '4321',
      'contents' => [{ 'type' => 'notes', 'id' => 'inner', 'name' => 'Inner', 'takeable' => true }]
    }.freeze

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @owner   = break_escape_demo_users(:test_user)
    end

    def door_unlock(game, method, attempt = nil)
      post unlock_game_url(game), params: { targetType: 'door', targetId: 'vault', attempt: attempt, method: method }, as: :json
    end

    def add(game, item)
      post inventory_game_url(game), params: { action_type: 'add', item: item }, as: :json
    end

    # ---- refused: forged fields open nothing ----------------------------------

    test 'a notepad sent with opens_lock does not open the key lock' do
      game = create_game
      add(game, { 'type' => 'notepad', 'name' => 'Notepad', 'opens_lock' => 'vault_lock', 'key_id' => 'vault_lock' })
      assert_response :success, response.body

      stored = game.reload.player_state['inventory'].find { |i| i['type'] == 'notepad' }
      assert_nil stored['opens_lock']
      assert_nil stored['key_id']

      door_unlock(game, 'key')
      assert_response :unprocessable_entity
      refute game.reload.player_state['unlockedRooms'].include?('vault')
    end

    test 'a notepad sent with scenarioData.type lockpick does not pick the lock' do
      game = create_game
      add(game, { 'type' => 'notepad', 'name' => 'Notepad', 'scenarioData' => { 'type' => 'lockpick', 'opens_lock' => 'vault_lock' } })
      assert_response :success, response.body
      assert_nil game.reload.player_state['inventory'].first['scenarioData']

      door_unlock(game, 'lockpick')
      assert_response :unprocessable_entity
      door_unlock(game, 'key')
      assert_response :unprocessable_entity
    end

    test 'a notepad or decor cup whose id is the lock reference does not open it' do
      game = create_game
      add(game, { 'type' => 'notepad', 'id' => 'vault_lock', 'name' => 'Notepad' })
      assert_response :success, response.body
      add(game, { 'type' => 'office-misc-cup', 'id' => 'vault_lock', 'decor' => true, 'opens_lock' => 'vault_lock' })
      assert_response :success, response.body

      door_unlock(game, 'key')
      assert_response :unprocessable_entity
    end

    test 'a real item sent with forged lock fields is stored as the scenario has it' do
      game = create_game
      add(game, MEMO.merge('opens_lock' => 'vault_lock', 'scenarioData' => { 'type' => 'lockpick' }, 'type' => 'notes'))
      assert_response :success, response.body

      stored = game.reload.player_state['inventory'].find { |i| i['id'] == 'memo' }
      assert_equal MEMO.except('takeable').to_a.sort, stored.except('takeable').to_a.sort

      door_unlock(game, 'key')
      assert_response :unprocessable_entity
      door_unlock(game, 'lockpick')
      assert_response :unprocessable_entity
    end

    # ---- allowed: real keys, lockpicks and containers still work ---------------

    test 'a real key matched by opens_lock opens its lock, keeping its pins' do
      game = create_game
      add(game, VAULT_KEY.except('keyPins'))
      assert_response :success, response.body

      stored = game.reload.player_state['inventory'].find { |i| i['type'] == 'key' }
      assert_equal 'vault_lock', stored['opens_lock']
      assert_equal [30, 40, 50, 60], stored['keyPins'], 'stored from the scenario copy, not the client'

      door_unlock(game, 'key')
      assert_response :success, response.body
    end

    test 'a real lockpick picks the lock' do
      game = create_game
      add(game, LOCKPICK)
      assert_response :success, response.body

      door_unlock(game, 'lockpick')
      assert_response :success, response.body
    end

    test 'a held locked container is stored without its PIN or contents, and survives a reload' do
      game = create_game
      add(game, BRIEFCASE.except('requires', 'contents'))
      assert_response :success, response.body

      stored = game.reload.player_state['inventory'].find { |i| i['id'] == 'briefcase_1' }
      assert_nil stored['requires']
      assert_nil stored['contents']
      assert stored['hasContents']

      get scenario_game_url(game)
      assert_response :success
      held = response.parsed_body['playerInventory'].find { |i| i['id'] == 'briefcase_1' }
      assert held, 'the held briefcase comes back on reload'
      refute_includes response.body, '4321'
    end

    test 'a container the player has unlocked is stored unlocked, with its contents' do
      game = create_game(unlocked_objects: ['briefcase_1'])
      add(game, BRIEFCASE.except('requires', 'contents').merge('locked' => false))
      assert_response :success, response.body

      stored = game.reload.player_state['inventory'].find { |i| i['id'] == 'briefcase_1' }
      assert_equal false, stored['locked']
      assert_equal ['inner'], stored['contents'].map { |c| c['id'] }
      assert_nil stored['requires']
    end

    private

    def create_game(unlocked_objects: [])
      scenario = {
        'startRoom' => 'lobby',
        'rooms' => {
          'lobby' => {
            'type' => 'room_office', 'locked' => false, 'connections' => { 'north' => 'vault' },
            'objects' => [VAULT_KEY, LOCKPICK, MEMO, BRIEFCASE].map(&:deep_dup)
          },
          'vault' => {
            'type' => 'room_office', 'locked' => true, 'lockType' => 'key', 'requires' => 'vault_lock',
            'connections' => { 'south' => 'lobby' }, 'objects' => []
          }
        }
      }
      state = {
        'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'], 'unlockedObjects' => unlocked_objects, 'inventory' => [],
        'encounteredNPCs' => [], 'globalVariables' => {}, 'notes' => [], 'health' => 100,
        'objectivesState' => { 'tasks' => {}, 'aims' => {} }
      }
      Game.create!(mission: @mission, player: @owner, scenario_data: scenario, player_state: state)
    end
  end
end
