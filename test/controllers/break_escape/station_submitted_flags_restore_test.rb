require 'test_helper'

module BreakEscape
  # A flag station's "Submitted Flags" list is built from the `submittedFlags` the
  # server annotates onto the station in the room data. GET /room had it; the door
  # unlock response (which the client caches and builds the room from) did not, so
  # a player who reloaded and walked back through the door saw "No flags submitted
  # yet" and then only the flags submitted after the reload.
  class StationSubmittedFlagsRestoreTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    FLAGS = %w[flag{one} flag{two} flag{three}].freeze

    def build
      create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: {
          'startRoom' => 'lobby',
          'flags' => { 'vm' => { 'flag_1' => FLAGS[0], 'flag_2' => FLAGS[1], 'flag_3' => FLAGS[2] } },
          'rooms' => {
            'lobby' => { 'type' => 'room_reception', 'connections' => { 'north' => 'lab' }, 'objects' => [] },
            'lab' => {
              'type' => 'room_servers', 'locked' => true, 'lockType' => 'pin', 'requires' => '4321',
              'connections' => { 'south' => 'lobby' },
              'objects' => [
                { 'type' => 'flag-station', 'id' => 'station_a', 'name' => 'A',
                  'acceptsVms' => ['vm'], 'flags' => %w[vm:flag_1 vm:flag_2] },
                { 'type' => 'flag-station', 'id' => 'station_b', 'name' => 'B',
                  'acceptsVms' => ['vm'], 'flags' => %w[vm:flag_3] }
              ]
            }
          }
        },
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'] }
      )
    end

    def station(room_data, id)
      room_data['objects'].find { |o| o['id'] == id }
    end

    test 'the door unlock response lists each station its own submitted flags' do
      game = build
      game.unlock_room!('lab')
      game.submit_flag(FLAGS[0])
      game.submit_flag(FLAGS[2])

      post unlock_game_url(game), params: { targetType: 'door', targetId: 'lab', attempt: '4321', method: 'pin' }, as: :json
      assert_response :success, response.body
      room = response.parsed_body['roomData']
      assert_equal [FLAGS[0]], station(room, 'station_a')['submittedFlags']
      assert_equal [FLAGS[2]], station(room, 'station_b')['submittedFlags']
    end

    test 'the unlock response and GET /room agree' do
      game = build
      game.submit_flag(FLAGS[1])

      post unlock_game_url(game), params: { targetType: 'door', targetId: 'lab', attempt: '4321', method: 'pin' }, as: :json
      assert_response :success, response.body
      from_unlock = response.parsed_body['roomData']

      get room_game_url(game, room_id: 'lab'), as: :json
      assert_response :success
      from_room = response.parsed_body['room']
      %w[station_a station_b].each do |id|
        assert_equal station(from_room, id)['submittedFlags'], station(from_unlock, id)['submittedFlags'], id
      end
      assert_equal [FLAGS[1]], station(from_unlock, 'station_a')['submittedFlags']
    end
  end
end
