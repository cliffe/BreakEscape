require 'test_helper'

# A tampered client can POST /update_room with actionType 'add_object' and no
# server-known source (no sourceNpcId, no sourceType 'player_drop'). The add used
# to store the client's lock-relevant fields (scenarioData.opens_lock / key_id /
# keyPins) straight into room_states.objects_added. find_accessible_item treats an
# added object as already validated, so picking it up minted a working key for any
# key lock. The server now strips lock-relevant fields from an unsourced add, and
# the strong-params filter no longer permits them, so no forged key reaches a lock.
#
# Legitimate adds (an NPC drop, a player dropping a held item) rebuild the object
# from the server's own copy and keep working.
module BreakEscape
  class AddObjectKeyForgeTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    # The real vault key lives inside the locked vault, out of reach until it opens.
    VAULT_KEY = { 'type' => 'key', 'id' => 'vault_key', 'name' => 'Vault key', 'opens_lock' => 'vault_lock',
                  'keyPins' => [30, 40, 50, 60], 'takeable' => true, 'droppable' => true }.freeze

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @owner   = break_escape_demo_users(:test_user)
    end

    def add_object(game, room_id, data, source = {})
      post update_room_game_url(game), params: {
        roomId: room_id, actionType: 'add_object', data: data
      }.merge(source), as: :json
    end

    def pickup(game, item)
      post inventory_game_url(game), params: { action_type: 'add', item: item }, as: :json
    end

    def door_unlock(game, method, attempt = nil)
      post unlock_game_url(game), params: { targetType: 'door', targetId: 'vault', attempt: attempt, method: method }, as: :json
    end

    # ---- refused: a forged add_object cannot mint a key ------------------------

    test 'an unsourced add_object key with scenarioData.opens_lock does not open the lock' do
      game = create_game
      add_object(game, 'lobby', {
        'type' => 'key', 'id' => 'forged_key', 'name' => 'Forged key', 'takeable' => true, 'x' => 5, 'y' => 5,
        'scenarioData' => { 'type' => 'key', 'opens_lock' => 'vault_lock', 'key_id' => 'vault_lock', 'keyPins' => [1, 1, 1, 1] }
      })
      assert_response :success, response.body

      added = game.reload.player_state.dig('room_states', 'lobby', 'objects_added').first
      assert added, 'object was stored'
      assert_nil added['opens_lock'], 'top-level opens_lock stripped'
      assert_nil added.dig('scenarioData', 'opens_lock'), 'scenarioData.opens_lock stripped'
      assert_nil added.dig('scenarioData', 'key_id'), 'scenarioData.key_id stripped'

      # Try to pick the forged object up and use it as a key.
      pickup(game, { 'type' => 'key', 'id' => 'forged_key', 'name' => 'Forged key' })
      stored = game.reload.player_state['inventory'].find { |i| i['id'] == 'forged_key' }
      if stored
        assert_nil stored['opens_lock']
        assert_nil stored.dig('scenarioData', 'opens_lock')
      end

      door_unlock(game, 'key')
      assert_response :unprocessable_entity
      refute game.reload.player_state['unlockedRooms'].include?('vault'), 'vault stayed locked'
    end

    test 'an unsourced add_object key with top-level opens_lock does not open the lock' do
      game = create_game
      add_object(game, 'lobby', {
        'type' => 'key', 'id' => 'forged_key2', 'name' => 'Forged', 'takeable' => true,
        'opens_lock' => 'vault_lock', 'key_id' => 'vault_lock', 'x' => 5, 'y' => 5
      })
      assert_response :success, response.body

      pickup(game, { 'type' => 'key', 'id' => 'forged_key2', 'name' => 'Forged' })
      door_unlock(game, 'key')
      assert_response :unprocessable_entity
      refute game.reload.player_state['unlockedRooms'].include?('vault')
    end

    test 'an unsourced add_object cannot inject a lockType, requires or card_id' do
      game = create_game
      add_object(game, 'lobby', {
        'type' => 'keycard', 'id' => 'forged_card', 'name' => 'Forged badge', 'takeable' => true, 'x' => 5, 'y' => 5,
        'card_id' => 'VAULT-ACL-1', 'requires' => '0000', 'lockType' => 'key', 'locked' => false,
        'scenarioData' => { 'type' => 'keycard', 'card_id' => 'VAULT-ACL-1', 'requires' => '0000' }
      })
      assert_response :success, response.body

      added = game.reload.player_state.dig('room_states', 'lobby', 'objects_added').first
      %w[card_id requires lockType].each do |f|
        assert_nil added[f], "#{f} stripped at top level"
        assert_nil added.dig('scenarioData', f), "#{f} stripped in scenarioData"
      end
    end

    # ---- allowed: real sources still mint working items -----------------------

    test 'an NPC drop of a real held key still opens the lock' do
      game = create_game(with_guard: true)
      add_object(game, 'lobby',
                 { 'type' => 'key', 'id' => 'vault_key', 'name' => 'Vault key', 'x' => 5, 'y' => 5 },
                 { sourceNpcId: 'guard', sourceType: 'npc_defeated' })
      assert_response :success, response.body

      added = game.reload.player_state.dig('room_states', 'lobby', 'objects_added').first
      assert_equal 'vault_lock', added['opens_lock'], 'server kept the scenario key fields'

      pickup(game, { 'type' => 'key', 'id' => 'vault_key', 'name' => 'Vault key' })
      assert_response :success, response.body
      door_unlock(game, 'key')
      assert_response :success, response.body
      assert game.reload.player_state['unlockedRooms'].include?('vault')
    end

    test 'a player can drop a held real key and pick it up again to open the lock' do
      game = create_game(key_in_lobby: true)
      # Pick the real key up from the lobby.
      pickup(game, { 'type' => 'key', 'id' => 'vault_key', 'name' => 'Vault key' })
      assert_response :success, response.body

      # Drop it as a room object (player_drop), then take it back.
      add_object(game, 'lobby',
                 { 'type' => 'key', 'id' => 'vault_key', 'name' => 'Vault key', 'x' => 7, 'y' => 7 },
                 { sourceType: 'player_drop' })
      assert_response :success, response.body
      dropped = game.reload.player_state.dig('room_states', 'lobby', 'objects_added').find { |o| o['id'] == 'vault_key' }
      assert dropped, 'the held droppable key was dropped'
      assert_equal 'vault_lock', dropped['opens_lock']

      post inventory_game_url(game), params: { action_type: 'remove', item: { id: 'vault_key' } }, as: :json
      pickup(game, { 'type' => 'key', 'id' => 'vault_key', 'name' => 'Vault key' })
      assert_response :success, response.body
      door_unlock(game, 'key')
      assert_response :success, response.body
    end

    private

    def create_game(with_guard: false, key_in_lobby: false)
      lobby_objects = []
      lobby_objects << VAULT_KEY.deep_dup if key_in_lobby
      npcs = []
      if with_guard
        npcs << { 'id' => 'guard', 'name' => 'Guard', 'npcType' => 'person', 'hostile' => true,
                  'itemsHeld' => [VAULT_KEY.deep_dup] }
      end
      vault_objects = key_in_lobby ? [] : [VAULT_KEY.deep_dup]
      scenario = {
        'startRoom' => 'lobby',
        'rooms' => {
          'lobby' => {
            'type' => 'room_office', 'locked' => false, 'connections' => { 'north' => 'vault' },
            'objects' => lobby_objects, 'npcs' => npcs
          },
          'vault' => {
            'type' => 'room_office', 'locked' => true, 'lockType' => 'key', 'requires' => 'vault_lock',
            'connections' => { 'south' => 'lobby' }, 'objects' => vault_objects
          }
        }
      }
      state = {
        'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'], 'unlockedObjects' => [], 'inventory' => [],
        'encounteredNPCs' => ['guard'], 'globalVariables' => {}, 'notes' => [], 'health' => 100,
        'objectivesState' => { 'tasks' => {}, 'aims' => {} }
      }
      Game.create!(mission: @mission, player: @owner, scenario_data: scenario, player_state: state)
    end
  end
end
