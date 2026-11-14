require 'test_helper'

module BreakEscape
  # Gated-door tailgating, Chunk B credit endpoints (GATED_DOOR_SERVER_CHECK_PLAN.md §3.3-§3.4).
  # viaPass on the currentRoom sync (tests 2, 4, 7), viaCredential on the rfid unlock (tests 3, 3b,
  # 8), the object-action gate's acceptance after promotion and idempotency (11b, 11c), and the
  # feedback-leak gating at the endpoint (R1 MINOR 3).
  class GatedDoorCreditControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    def gate(pass_global = 'courier_ready')
      { 'openFor' => ['len'], 'openRadius' => 72, 'playerMayPassIf' => pass_global,
        'creditOnPass' => {
          'viaPass' => { 'setGlobal' => { 'kp_badge_tailgated' => true }, 'completeTask' => 'tailgate_in' },
          'viaCredential' => { 'setGlobal' => { 'kp_records_cloned' => true }, 'completeTask' => 'tailgate_in' }
        } }
    end

    def scenario(pass_global = 'courier_ready')
      {
        'startRoom' => 'lobby',
        'globalVariables' => { 'courier_ready' => false, 'kp_badge_tailgated' => false,
                               'kp_records_cloned' => false, 'fake_pass' => false },
        'disguises' => { 'hivis' => { 'sprite' => 'courier_hivis' } },
        'objectives' => [
          { 'aimId' => 'a1', 'title' => 'Get in', 'tasks' => [
            { 'taskId' => 'tailgate_in', 'title' => 'Past the records door', 'type' => 'manual', 'status' => 'active' },
            { 'taskId' => 'open_cabinet', 'title' => 'Open the cabinet', 'type' => 'unlock_object',
              'targetObject' => 'records_cabinet', 'status' => 'active' }
          ] }
        ],
        'rooms' => {
          'lobby' => {
            'type' => 'room_office',
            'connections' => { 'north' => 'secure_area' },
            'doors' => [{ 'connectedRoom' => 'secure_area', 'direction' => 'north', 'requires' => 'badge',
                          'gate' => gate(pass_global) }],
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
            'objects' => [
              { 'type' => 'cabinet', 'id' => 'records_cabinet', 'name' => 'Records cabinet',
                'locked' => true, 'lockType' => 'key', 'requires' => 'cabinet_key',
                'contents' => [{ 'type' => 'notes', 'id' => 'records_file', 'name' => 'Records', 'takeable' => true }] },
              { 'type' => 'keypad_box', 'id' => 'pinbox', 'name' => 'PIN box', 'locked' => true, 'lockType' => 'pin', 'requires' => '1234' },
              { 'type' => 'pw_box', 'id' => 'pwbox', 'name' => 'Password box', 'locked' => true, 'lockType' => 'password', 'requires' => 'Secret1' }
            ]
          }
        }
      }
    end

    def build(player_state = {}, pass_global = 'courier_ready')
      create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario(pass_global),
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

    # Test 2: wear the hi-vis, then sync currentRoom -> promoted via viaPass, credit global set,
    # task complete. The NPC route POST records the room in npcRouteRooms first (end to end).
    test 'wearing the hi-vis then syncing into the route room credits viaPass' do
      game = build('inventory' => [vest_item])
      post wear_game_url(game), params: { item_id: 'vest', worn: true }, as: :json
      assert_response :success, response.body
      assert_equal true, state(game).dig('globalVariables', 'courier_ready'), 'wear set the pass global server-side'

      post unlock_game_url(game), params: { targetType: 'door', targetId: 'secure_area', attempt: 'len', method: 'npc' }, as: :json
      assert_response :success
      assert_includes Array(state(game)['npcRouteRooms']), 'secure_area'

      put sync_state_game_url(game), params: { currentRoom: 'secure_area' }, as: :json
      assert_response :success
      st = state(game)
      assert_includes Array(st['unlockedRooms']), 'secure_area', 'viaPass promotes the room'
      refute_includes Array(st['npcRouteRooms']), 'secure_area', 'promotion removes it from npcRouteRooms'
      assert_equal true, st.dig('globalVariables', 'kp_badge_tailgated'), 'the viaPass credit global is set'
      assert_equal 'completed', st.dig('objectivesState', 'tasks', 'tailgate_in', 'status')
    end

    # Test 3: hold the cloned badge, POST /unlock method rfid -> credited viaCredential, with no
    # NPC route having run.
    test 'presenting a cloned badge credits viaCredential on the rfid unlock' do
      game = build('inventory' => [cloner_item],
                   'serverClones' => { 'badge' => { 'source' => { 'npc' => 'clerk' }, 'uidOnly' => false } })
      post unlock_game_url(game), params: { targetType: 'door', targetId: 'secure_area', method: 'rfid' }, as: :json
      assert_response :success

      st = state(game)
      assert_includes Array(st['unlockedRooms']), 'secure_area'
      refute_includes Array(st['npcRouteRooms']), 'secure_area'
      assert_equal true, st.dig('globalVariables', 'kp_records_cloned')
      assert_equal 'completed', st.dig('objectivesState', 'tasks', 'tailgate_in', 'status')
    end

    # Test 3b: no clone, no keycard -> the rfid unlock is refused, nothing credited.
    test 'an rfid unlock with no card held is refused and credits nothing' do
      game = build
      post unlock_game_url(game), params: { targetType: 'door', targetId: 'secure_area', method: 'rfid' }, as: :json
      assert_response :unprocessable_entity

      st = state(game)
      refute_includes Array(st['unlockedRooms']), 'secure_area'
      refute st.dig('globalVariables', 'kp_records_cloned')
      refute_equal 'completed', st.dig('objectivesState', 'tasks', 'tailgate_in', 'status')
    end

    # Test 4: a client sync write to the credit global is dropped (read-only via serverCreditGlobals).
    test 'a client sync of the credit global before earning is dropped' do
      game = build('npcRouteRooms' => ['secure_area'])
      put sync_state_game_url(game), params: { currentRoom: 'secure_area',
                                               globalVariables: { kp_badge_tailgated: true } }, as: :json
      assert_response :success
      st = state(game)
      refute st.dig('globalVariables', 'kp_badge_tailgated'), 'the credit global stays false'
      refute_includes Array(st['unlockedRooms']), 'secure_area', 'no promotion without the pass'
    end

    # Test 7: a client-writable pass global does not promote viaPass even when forged true.
    test 'a forged client-writable pass global does not promote viaPass' do
      game = build({ 'npcRouteRooms' => ['secure_area'] }, 'fake_pass')
      put sync_state_game_url(game), params: { currentRoom: 'secure_area',
                                               globalVariables: { fake_pass: true } }, as: :json
      assert_response :success
      st = state(game)
      assert_equal true, st.dig('globalVariables', 'fake_pass'), 'the client-writable global is written'
      refute_includes Array(st['unlockedRooms']), 'secure_area', 'but it is not server-owned, so no viaPass'
      refute st.dig('globalVariables', 'kp_badge_tailgated')
    end

    # Test 8: a clone of the wrong card does not pass the possession check, so no credit.
    test 'a wrong cloned card does not credit the credential path' do
      game = build('inventory' => [cloner_item],
                   'serverClones' => { 'other_badge' => { 'source' => { 'npc' => 'x' }, 'uidOnly' => false } })
      post unlock_game_url(game), params: { targetType: 'door', targetId: 'secure_area', method: 'rfid' }, as: :json
      assert_response :unprocessable_entity
      st = state(game)
      refute_includes Array(st['unlockedRooms']), 'secure_area'
      refute st.dig('globalVariables', 'kp_records_cloned')
    end

    # Test 11b: after promotion the route-room container unlocks, its contents are served, and the
    # unlock_object task completes (the client posts it separately).
    test 'after promotion a route-room container unlocks and its task completes' do
      game = build('inventory' => [cloner_item, { 'type' => 'key', 'id' => 'cabinet_key', 'opens_lock' => 'cabinet_key', 'name' => 'Cabinet key' }],
                   'serverClones' => { 'badge' => { 'source' => { 'npc' => 'clerk' }, 'uidOnly' => false } })
      # Promote via the credential path.
      post unlock_game_url(game), params: { targetType: 'door', targetId: 'secure_area', method: 'rfid' }, as: :json
      assert_response :success

      post unlock_game_url(game), params: { targetType: 'object', targetId: 'records_cabinet', method: 'key' }, as: :json
      assert_response :success
      assert response.parsed_body['contents'].present?, 'contents are served once promoted'
      assert_includes Array(state(game)['unlockedObjects']), 'records_cabinet'

      post complete_task_game_url(game, task_id: 'open_cabinet'), as: :json
      assert_response :success
      assert_equal 'completed', state(game).dig('objectivesState', 'tasks', 'open_cabinet', 'status')
    end

    # Test 11c: the post-promotion object unlock (and its task completion) are idempotent, so the
    # §3.6 client re-post cannot double-credit.
    test 'the post-promotion object unlock and task completion are idempotent' do
      game = build('inventory' => [cloner_item, { 'type' => 'key', 'id' => 'cabinet_key', 'opens_lock' => 'cabinet_key', 'name' => 'Cabinet key' }],
                   'serverClones' => { 'badge' => { 'source' => { 'npc' => 'clerk' }, 'uidOnly' => false } })
      post unlock_game_url(game), params: { targetType: 'door', targetId: 'secure_area', method: 'rfid' }, as: :json
      assert_response :success

      2.times do
        post unlock_game_url(game), params: { targetType: 'object', targetId: 'records_cabinet', method: 'key' }, as: :json
        assert_response :success
      end
      assert_equal 1, Array(state(game)['unlockedObjects']).count('records_cabinet'), 'unlocked once'

      post complete_task_game_url(game, task_id: 'open_cabinet'), as: :json
      before = state(game)['tasks_completed'] || game.reload.tasks_completed
      post complete_task_game_url(game, task_id: 'open_cabinet'), as: :json
      assert_response :success
      assert_equal 'completed', state(game).dig('objectivesState', 'tasks', 'open_cabinet', 'status')
      assert_equal before, game.reload.tasks_completed, 'a duplicate completion does not re-credit'
    end

    # R1 MINOR 3: a wrong attempt on a route-room object leaks no feedback, caseMismatch or
    # uid_only field at the endpoint; the feedback returns after promotion.
    test 'a wrong attempt on an unpromoted route-room object leaks no feedback, then returns after promotion' do
      game = build('npcRouteRooms' => ['secure_area'],
                   'inventory' => [cloner_item, { 'type' => 'pin-cracker', 'id' => 'pc', 'name' => 'PIN cracker' },
                                   { 'type' => 'key', 'id' => 'cabinet_key', 'opens_lock' => 'cabinet_key', 'name' => 'Cabinet key' }],
                   'serverClones' => { 'badge' => { 'source' => { 'npc' => 'clerk' }, 'uidOnly' => false } })

      post unlock_game_url(game), params: { targetType: 'object', targetId: 'pinbox', attempt: '0000', method: 'pin' }, as: :json
      body = response.parsed_body
      refute body.key?('feedback'), 'no pin pips leak for an unpromoted route-room object'
      refute_equal 'uid_only', body['reason']

      post unlock_game_url(game), params: { targetType: 'object', targetId: 'pwbox', attempt: 'secret1', method: 'password' }, as: :json
      refute response.parsed_body.key?('caseMismatch'), 'no case hint leaks for an unpromoted route-room object'

      # Promote via the credential path, then the feedback returns.
      post unlock_game_url(game), params: { targetType: 'door', targetId: 'secure_area', method: 'rfid' }, as: :json
      assert_response :success

      post unlock_game_url(game), params: { targetType: 'object', targetId: 'pinbox', attempt: '0000', method: 'pin' }, as: :json
      assert response.parsed_body.key?('feedback'), 'pin pips return once the room is promoted'
    end
  end
end
