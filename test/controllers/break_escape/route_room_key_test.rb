require 'test_helper'

module BreakEscape
  # K1 (ops hardening U4): routeRoom: true on the GET room and door-open answers only while the
  # room is a route room that is not in unlockedRooms.
  class RouteRoomKeyTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    def scenario
      {
        'startRoom' => 'lobby',
        'rooms' => {
          'lobby' => {
            'type' => 'room_office',
            'connections' => { 'north' => 'secure_area', 'east' => 'plain_room' },
            'doors' => [
              { 'connectedRoom' => 'secure_area', 'direction' => 'north', 'requires' => 'badge',
                'gate' => { 'openFor' => ['len'], 'openRadius' => 72, 'playerMayPassIf' => 'courier_ready' } }
            ],
            'objects' => [{ 'type' => 'rfid_cloner', 'id' => 'cloner', 'name' => 'RFID cloner' }],
            'npcs' => [
              { 'id' => 'len', 'displayName' => 'Len', 'npcType' => 'person', 'position' => { 'x' => 3, 'y' => 3 },
                'eventMappings' => [{ 'eventPattern' => 'len_never_fires', 'unlockDoor' => 'secure_area' }] }
            ]
          },
          'secure_area' => {
            'type' => 'room_office', 'locked' => true, 'lockType' => 'rfid', 'requires' => 'badge',
            'objects' => [{ 'type' => 'notes', 'id' => 'memo', 'name' => 'Memo' }]
          },
          'plain_room' => { 'type' => 'room_office', 'objects' => [{ 'type' => 'notes', 'id' => 'plain_memo', 'name' => 'Memo' }] }
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

    test 'GET room carries the key while the route room is unpromoted' do
      game = build('npcRouteRooms' => ['secure_area'])
      get room_game_url(game, room_id: 'secure_area'), as: :json
      assert_response :success
      assert_equal true, response.parsed_body['routeRoom']
    end

    test 'GET room has no key after promotion' do
      game = build('npcRouteRooms' => [], 'unlockedRooms' => %w[lobby secure_area])
      get room_game_url(game, room_id: 'secure_area'), as: :json
      assert_response :success
      refute response.parsed_body.key?('routeRoom')
    end

    test 'GET room has no key in the both-lists interim' do
      game = build('npcRouteRooms' => ['secure_area'], 'unlockedRooms' => %w[lobby secure_area])
      get room_game_url(game, room_id: 'secure_area'), as: :json
      assert_response :success
      refute response.parsed_body.key?('routeRoom')
    end

    test 'GET room has no key for a non-route room' do
      game = build('unlockedRooms' => %w[lobby plain_room])
      get room_game_url(game, room_id: 'plain_room'), as: :json
      assert_response :success
      refute response.parsed_body.key?('routeRoom')
      get room_game_url(game, room_id: 'lobby'), as: :json
      refute response.parsed_body.key?('routeRoom')
    end

    test 'the route-room door open carries the key' do
      game = build
      post unlock_game_url(game), params: { targetType: 'door', targetId: 'secure_area', attempt: 'len', method: 'npc' }, as: :json
      assert_response :success
      assert_equal true, response.parsed_body['routeRoom']
    end

    test 'a real door open has no key' do
      game = build('inventory' => [{ 'type' => 'key', 'id' => 'badge', 'name' => 'Badge' }])
      post unlock_game_url(game), params: { targetType: 'door', targetId: 'plain_room', method: 'key' }, as: :json
      assert_response :success
      refute response.parsed_body.key?('routeRoom')
    end
  end
end
