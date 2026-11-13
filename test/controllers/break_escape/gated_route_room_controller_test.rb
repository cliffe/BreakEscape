require 'test_helper'

module BreakEscape
  # Gated-door tailgating, Chunk A endpoints (GATED_DOOR_SERVER_CHECK_PLAN.md §3).
  # The NPC route POST lands in npcRouteRooms only (test 6); GET room serves a route room
  # without auto-unlocking it (test 10); sync accepts currentRoom for a route room without
  # promoting it (test 1); the object-action gate refuses a route-room object unlock (test 11a).
  class GatedRouteRoomControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    def scenario
      {
        'startRoom' => 'lobby',
        'rooms' => {
          'lobby' => {
            'type' => 'room_office',
            'connections' => { 'north' => 'secure_area' },
            'doors' => [
              { 'connectedRoom' => 'secure_area', 'direction' => 'north', 'requires' => 'badge',
                'gate' => { 'openFor' => ['len'], 'openRadius' => 72, 'playerMayPassIf' => 'courier_ready' } }
            ],
            'objects' => [
              { 'type' => 'rfid_cloner', 'id' => 'cloner', 'name' => 'RFID cloner' }
            ],
            'npcs' => [
              { 'id' => 'len', 'displayName' => 'Len', 'npcType' => 'person', 'position' => { 'x' => 3, 'y' => 3 },
                'eventMappings' => [{ 'eventPattern' => 'len_never_fires', 'unlockDoor' => 'secure_area' }] }
            ]
          },
          'secure_area' => {
            'type' => 'room_office', 'locked' => true, 'lockType' => 'rfid', 'requires' => 'badge',
            'objects' => [
              { 'type' => 'cabinet', 'id' => 'records_cabinet', 'name' => 'Records cabinet',
                'locked' => true, 'lockType' => 'key', 'requires' => 'cabinet_key',
                'contents' => [{ 'type' => 'notes', 'id' => 'records_file', 'name' => 'Records', 'takeable' => true }] }
            ]
          }
        }
      }
    end

    def build(player_state = {})
      create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby] }.merge(player_state)
      )
    end

    # Test 6: forge method: npc for the gate NPC -> npcRouteRooms only, never unlockedRooms.
    test 'an NPC route unlock of a splitting gate records the room in npcRouteRooms only' do
      game = build
      post unlock_game_url(game), params: { targetType: 'door', targetId: 'secure_area', attempt: 'len', method: 'npc' }, as: :json
      assert_response :success
      assert response.parsed_body['roomData'].present?, 'the route room is served'

      state = game.reload.player_state
      assert_includes Array(state['npcRouteRooms']), 'secure_area'
      refute_includes Array(state['unlockedRooms']), 'secure_area', 'the route unlock must not promote the room'
    end

    # Test 10: GET room on a route room serves it but does not auto-unlock it (§3.2 guard).
    test 'GET room on a route room serves it without adding it to unlockedRooms' do
      game = build('npcRouteRooms' => ['secure_area'])
      get room_game_url(game, room_id: 'secure_area'), as: :json
      assert_response :success
      refute_includes Array(game.reload.player_state['unlockedRooms']), 'secure_area',
                      'serving a route room must not auto-unlock it'
    end

    # Test 1: sync currentRoom for a route room is accepted (no snap-back) but does not promote.
    test 'sync accepts currentRoom for a route room without promoting it' do
      game = build('npcRouteRooms' => ['secure_area'])
      put sync_state_game_url(game), params: { currentRoom: 'secure_area' }, as: :json
      assert_response :success
      state = game.reload.player_state
      assert_equal 'secure_area', state['currentRoom'], 'the avatar room is saved'
      refute_includes Array(state['unlockedRooms']), 'secure_area', 'acceptance is not promotion (credit is Chunk B)'
    end

    test 'sync still refuses currentRoom for a locked room that is not a route room' do
      game = build
      put sync_state_game_url(game), params: { currentRoom: 'secure_area' }, as: :json
      assert_response :forbidden
    end

    # Test 11a: a route-room object unlock is refused even with the right key held.
    test 'the object-action gate refuses a route-room object unlock with the right key held' do
      game = build('npcRouteRooms' => ['secure_area'],
                   'inventory' => [{ 'type' => 'key', 'id' => 'cabinet_key', 'opens_lock' => 'cabinet_key', 'name' => 'Cabinet key' }])
      post unlock_game_url(game), params: { targetType: 'object', targetId: 'records_cabinet', method: 'key' }, as: :json

      assert_response :forbidden
      body = response.parsed_body
      assert_equal 'room_not_reachable', body['reason']
      assert_equal true, body['retryable']
      refute body['contents'].present?, 'no contents are served for a gated object'
      refute_includes Array(game.reload.player_state['unlockedObjects']), 'records_cabinet'
    end
  end
end
