require 'test_helper'
require_relative '../../support/access_work_scenario'

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

    # The gated route-room branch (GATED_DOOR §3.5): an NPC route opens the door for a slip-in
    # and the room is served without being unlocked. It must carry the same lists.
    test 'a gated route-room unlock lists each station only its own submitted flags' do
      game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: {
          'startRoom' => 'lobby',
          'flags' => { 'vm' => { 'flag_1' => FLAGS[0], 'flag_2' => FLAGS[1], 'flag_3' => FLAGS[2] } },
          'rooms' => {
            'lobby' => {
              'type' => 'room_office', 'connections' => { 'north' => 'secure_lab' },
              'doors' => [{ 'connectedRoom' => 'secure_lab', 'direction' => 'north', 'requires' => 'badge',
                            'gate' => { 'openFor' => ['len'], 'openRadius' => 72, 'playerMayPassIf' => 'courier_ready' } }],
              'objects' => [{ 'type' => 'rfid_cloner', 'id' => 'cloner', 'name' => 'RFID cloner' }],
              'npcs' => [{ 'id' => 'len', 'displayName' => 'Len', 'npcType' => 'person', 'position' => { 'x' => 3, 'y' => 3 },
                           'eventMappings' => [{ 'eventPattern' => 'len_never_fires', 'unlockDoor' => 'secure_lab' }] }]
            },
            'secure_lab' => {
              'type' => 'room_servers', 'locked' => true, 'lockType' => 'rfid', 'requires' => 'badge',
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
      game.submit_flag(FLAGS[1])
      game.submit_flag(FLAGS[2])

      post unlock_game_url(game), params: { targetType: 'door', targetId: 'secure_lab', attempt: 'len', method: 'npc' }, as: :json
      assert_response :success, response.body
      assert_includes Array(game.reload.player_state['npcRouteRooms']), 'secure_lab', 'this took the route-room branch'
      room = response.parsed_body['roomData']
      assert_equal [FLAGS[1]], station(room, 'station_a')['submittedFlags']
      assert_equal [FLAGS[2]], station(room, 'station_b')['submittedFlags']
    end
  end

  # The prop_door workaround opens a room through POST /npc_workaround, which serves it with
  # serve_opened_room. Scenario and helpers follow NpcWorkaroundTest.
  class StationSubmittedFlagsWorkaroundTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include ActiveSupport::Testing::TimeHelpers

    FLAGS = StationSubmittedFlagsRestoreTest::FLAGS

    def scenario
      data = AccessWorkScenario.scenario
      data['flags'] = { 'vm' => { 'flag_1' => FLAGS[0], 'flag_2' => FLAGS[1], 'flag_3' => FLAGS[2] } }
      data['globalVariables'].merge!('rota_down' => false, 'store_door_propped' => false)
      data['resources']['rota'] = { 'kind' => 'rota', 'name' => 'Shift rota system', 'offWhen' => 'rota_down' }
      office = data['rooms']['office']
      office['connections']['north'] = 'store_room'
      office['objects'] += [AccessWorkScenario.pc('tom_pc'),
                            { 'type' => 'fire_extinguisher1', 'id' => 'store_wedge', 'name' => 'Extinguisher',
                              'revealOnGlobal' => 'store_door_propped' }]
      office['npcs'] += [
        AccessWorkScenario.staff('tom', 'tfletcher', 'Tom-Teal-40',
                                 'role' => %w[facilities staff], 'workNeeds' => ['+rota'],
                                 'workarounds' => [{ 'at' => 40, 'do' => 'prop_door', 'door' => 'store_room',
                                                     'prop' => 'store_wedge', 'setGlobal' => 'store_door_propped' }])
      ]
      data['rooms']['store_room'] = {
        'type' => 'room_servers', 'connections' => { 'south' => 'office' }, 'locked' => true, 'lockType' => 'rfid',
        'access' => { 'roles' => ['facilities'] },
        'objects' => [
          { 'type' => 'flag-station', 'id' => 'station_a', 'name' => 'A', 'acceptsVms' => ['vm'], 'flags' => %w[vm:flag_1 vm:flag_2] },
          { 'type' => 'flag-station', 'id' => 'station_b', 'name' => 'B', 'acceptsVms' => ['vm'], 'flags' => %w[vm:flag_3] }
        ]
      }
      AccessWorkScenario.assign_owners!(data)
    end

    test 'the prop_door workaround serves the room with each station its own submitted flags' do
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby office],
                        'encounteredNPCs' => %w[tom],
                        'globalVariables' => { 'rota_down' => true, 'store_door_propped' => false } }
      )
      @game.submit_flag(FLAGS[0])
      @game.submit_flag(FLAGS[2])

      t = Time.current
      run = nil
      2.times do |i|
        travel_to(t + (i * 25)) do
          post npc_frustration_game_url(@game),
               params: { reports: [{ npc_id: 'tom', event: 'fail', need: 'work', object_id: 'tom_pc',
                                     missing: [{ id: 'rota', why: 'down' }] }] }, as: :json
          assert_response :success, response.body
          run = response.parsed_body['answers'].first['run']
        end
      end
      assert run, 'the prop_door hand-over was issued'

      travel_to(t + 25 + 4) do
        post npc_workaround_game_url(@game), params: { npc_id: 'tom', index: run['index'], hand: run['hand'], dropped: false }, as: :json
      end
      assert_response :success, response.body
      room = response.parsed_body['roomData']
      assert room.is_a?(Hash), 'the workaround served the room'
      assert_equal [FLAGS[0]], room['objects'].find { |o| o['id'] == 'station_a' }['submittedFlags']
      assert_equal [FLAGS[2]], room['objects'].find { |o| o['id'] == 'station_b' }['submittedFlags']
    end
  end
end
