require 'test_helper'

module BreakEscape
  # Gated-door tailgating, Chunk C endpoints (GATED_DOOR_SERVER_CHECK_PLAN.md §7).
  # Plan tests 5, 5b, 5c: a client POST /complete_task or /skip_task for a credited task is
  # refused, and { trusted: true } in the body does not bypass the guard. Plus the end-to-end
  # proof that a legitimate player's credited task still completes through the real endpoints
  # (viaPass on the currentRoom sync, viaCredential on the rfid unlock), with the guard in place.
  class GatedServerCompletedTaskControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    def gate
      { 'openFor' => ['len'], 'openRadius' => 72, 'playerMayPassIf' => 'courier_ready',
        'creditOnPass' => {
          'viaPass' => { 'setGlobal' => { 'kp_badge_tailgated' => true }, 'completeTask' => 'tailgate_in' },
          'viaCredential' => { 'setGlobal' => { 'kp_records_cloned' => true }, 'completeTask' => 'tailgate_in' }
        } }
    end

    def scenario
      {
        'startRoom' => 'lobby',
        'globalVariables' => { 'courier_ready' => false, 'kp_badge_tailgated' => false, 'kp_records_cloned' => false },
        'disguises' => { 'hivis' => { 'sprite' => 'courier_hivis' } },
        'objectives' => [
          { 'aimId' => 'a1', 'title' => 'Get in', 'tasks' => [
            { 'taskId' => 'tailgate_in', 'title' => 'Past the records door', 'type' => 'manual', 'status' => 'active' },
            { 'taskId' => 'brief_len', 'title' => 'Talk to Len', 'type' => 'custom', 'status' => 'active' }
          ] }
        ],
        'rooms' => {
          'lobby' => {
            'type' => 'room_office',
            'connections' => { 'north' => 'secure_area' },
            'doors' => [{ 'connectedRoom' => 'secure_area', 'direction' => 'north', 'requires' => 'badge', 'gate' => gate }],
            'objects' => [
              { 'type' => 'rfid_cloner', 'id' => 'cloner', 'name' => 'RFID cloner' },
              { 'type' => 'hivis', 'id' => 'vest', 'name' => 'Hi-vis', 'takeable' => true,
                'wearable' => { 'costume' => 'hivis', 'global' => 'courier_ready' } }
            ],
            'npcs' => [{ 'id' => 'len', 'displayName' => 'Len', 'npcType' => 'person', 'position' => { 'x' => 3, 'y' => 3 },
                         'eventMappings' => [{ 'eventPattern' => 'len_never_fires', 'unlockDoor' => 'secure_area' }] }]
          },
          'secure_area' => {
            'type' => 'room_office', 'locked' => true, 'lockType' => 'rfid', 'requires' => 'badge',
            'objects' => [{ 'type' => 'notes', 'id' => 'deeds', 'name' => 'Deeds', 'readable' => true }]
          }
        }
      }
    end

    def build(player_state = {})
      create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'] }.merge(player_state)
      )
    end

    def vest_item
      { 'type' => 'hivis', 'id' => 'vest', 'name' => 'Hi-vis', 'wearable' => { 'costume' => 'hivis', 'global' => 'courier_ready' } }
    end

    def cloner_item
      { 'type' => 'rfid_cloner', 'id' => 'cloner', 'name' => 'RFID cloner' }
    end

    def state(game)
      game.reload.player_state
    end

    # Test 5: a direct client POST /complete_task for a credited task is refused.
    test 'POST complete_task for a credited task is refused' do
      game = build
      post complete_task_game_url(game, task_id: 'tailgate_in'), as: :json
      assert_response :unprocessable_entity
      assert_equal 'Task is server-completed only', response.parsed_body['error']
      refute_equal 'completed', state(game).dig('objectivesState', 'tasks', 'tailgate_in', 'status')
    end

    # Test 5b: a direct client POST /skip_task for a credited task is refused; the aim is not reached.
    test 'POST skip_task for a credited task is refused and the aim is not reached' do
      game = build
      post skip_task_game_url(game, task_id: 'tailgate_in'), as: :json
      assert_response :unprocessable_entity
      st = state(game)
      refute_equal 'skipped', st.dig('objectivesState', 'tasks', 'tailgate_in', 'status')
      refute_equal 'completed', st.dig('objectivesState', 'aims', 'a1', 'status'), 'the tailgate aim is not reached'
    end

    # Test 5c: { trusted: true } in the request body does not bypass the guard (trusted is a
    # real keyword, not read from validation_data / the params hash).
    test 'POST complete_task with trusted:true in the body is still refused' do
      game = build
      post complete_task_game_url(game, task_id: 'tailgate_in'), params: { trusted: true }, as: :json
      assert_response :unprocessable_entity
      assert_equal 'Task is server-completed only', response.parsed_body['error']

      # Also as a nested validation_data entry, the other place a client could try to smuggle it.
      post complete_task_game_url(game, task_id: 'tailgate_in'), params: { validation_data: { trusted: true } }, as: :json
      assert_response :unprocessable_entity
      refute_equal 'completed', state(game).dig('objectivesState', 'tasks', 'tailgate_in', 'status')
    end

    # Test 5d (R3 minor 1): once the server has credited the task (viaPass), an honest client
    # re-post of /complete_task for it is the idempotent "Already completed", not a 422 the client
    # would surface as "Objective Blocked" on an earned finding. The guard now sits after the
    # already-completed branch; a forge (tests 5/5b/5c, a not-yet-completed task) still hits it.
    test 'POST complete_task for an already-credited task is idempotent, not blocked' do
      game = build('inventory' => [vest_item])
      post wear_game_url(game), params: { item_id: 'vest', worn: true }, as: :json
      post unlock_game_url(game), params: { targetType: 'door', targetId: 'secure_area', attempt: 'len', method: 'npc' }, as: :json
      put sync_state_game_url(game), params: { currentRoom: 'secure_area' }, as: :json
      assert_equal 'completed', state(game).dig('objectivesState', 'tasks', 'tailgate_in', 'status')

      post complete_task_game_url(game, task_id: 'tailgate_in'), as: :json
      assert_response :success
      assert_equal 'Already completed', response.parsed_body['message']
    end

    # Test 5e (R3 minor 1): the same for /skip_task on an already-credited task: idempotent, not 422.
    test 'POST skip_task for an already-credited task is idempotent, not blocked' do
      game = build('inventory' => [vest_item])
      post wear_game_url(game), params: { item_id: 'vest', worn: true }, as: :json
      post unlock_game_url(game), params: { targetType: 'door', targetId: 'secure_area', attempt: 'len', method: 'npc' }, as: :json
      put sync_state_game_url(game), params: { currentRoom: 'secure_area' }, as: :json
      assert_equal 'completed', state(game).dig('objectivesState', 'tasks', 'tailgate_in', 'status')

      post skip_task_game_url(game, task_id: 'tailgate_in'), as: :json
      assert_response :success
      assert_equal 'Already completed', response.parsed_body['message']
      assert_equal 'completed', state(game).dig('objectivesState', 'tasks', 'tailgate_in', 'status')
    end

    # An ordinary (non-credited) task is unaffected: the client endpoint still completes it.
    test 'POST complete_task for an ordinary task still succeeds' do
      game = build
      post complete_task_game_url(game, task_id: 'brief_len'), as: :json
      assert_response :success
      assert_equal 'completed', state(game).dig('objectivesState', 'tasks', 'brief_len', 'status')
    end

    # End to end, viaPass (the hi-vis tailgate route): wearing the pass then syncing into the
    # route room still completes the credited task through the server's own credit path, with the
    # Chunk C guard in place. Proves a legitimate player is never refused.
    test 'the credited task still completes end to end via the hi-vis pass route' do
      game = build('inventory' => [vest_item])
      post wear_game_url(game), params: { item_id: 'vest', worn: true }, as: :json
      assert_response :success

      post unlock_game_url(game), params: { targetType: 'door', targetId: 'secure_area', attempt: 'len', method: 'npc' }, as: :json
      assert_response :success
      assert_includes Array(state(game)['npcRouteRooms']), 'secure_area'

      put sync_state_game_url(game), params: { currentRoom: 'secure_area' }, as: :json
      assert_response :success
      st = state(game)
      assert_includes Array(st['unlockedRooms']), 'secure_area'
      assert_equal true, st.dig('globalVariables', 'kp_badge_tailgated')
      assert_equal 'completed', st.dig('objectivesState', 'tasks', 'tailgate_in', 'status'),
                   'the server credit path completes the credited task despite the guard'
    end

    # End to end, viaCredential (the cloned-badge route): presenting a cloned badge at the rfid
    # door still completes the credited task through the server credit path.
    test 'the credited task still completes end to end via the cloned-badge route' do
      game = build('inventory' => [cloner_item],
                   'serverClones' => { 'badge' => { 'source' => { 'npc' => 'clerk' }, 'uidOnly' => false } })
      post unlock_game_url(game), params: { targetType: 'door', targetId: 'secure_area', method: 'rfid' }, as: :json
      assert_response :success
      st = state(game)
      assert_includes Array(st['unlockedRooms']), 'secure_area'
      assert_equal true, st.dig('globalVariables', 'kp_records_cloned')
      assert_equal 'completed', st.dig('objectivesState', 'tasks', 'tailgate_in', 'status')
    end
  end
end
