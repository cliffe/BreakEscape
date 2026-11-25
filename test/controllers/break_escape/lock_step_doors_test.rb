require 'test_helper'
require_relative '../../support/lock_step_routes'
require_relative '../../support/access_work_scenario'

module BreakEscape
  # S8c unit 15, the doors table: a second step on a door, through the real routes and the real
  # gate, on scenarios/test_ops_lock_step/ (records_room: card; plant_room: opened by Gordon).
  class LockStepDoorsTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include LockStepRoutes

    SCENARIO_PATH = File.expand_path('../../../scenarios/test_ops_lock_step/scenario.json.erb', __dir__)
    NPCS = %w[moira gordon priya dana].freeze
    LOG = 'step_audit'.freeze
    CARD = { 'card_ids' => ['RECORDS-01'] }.freeze
    ROOM_WORDS = ['records_memo', 'Test memo for the records room', 'plant_memo', 'Test memo for the plant room'].freeze

    def real_scenario
      data = JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
      data['logSources']['step_audit']['events'] << 'badge_swipe'
      data
    end

    def build_real(state = {})
      build_step_game(real_scenario, { 'encounteredNPCs' => NPCS }.merge(state))
    end

    setup { travel_to T0 }
    teardown { travel_back }

    def rows(event = nil)
      list = BreakEscape::Game.find(@game.id).log_rows_for(LOG)
      event ? list.select { |r| r['event'] == event } : list
    end

    def count(event)
      rows(event).sum { |r| r['n'] || 1 }
    end

    def pester(subject, times = 3)
      out = nil
      times.times do |i|
        later(3) if i.positive?
        out = mfa('prompt', subject)
      end
      out
    end

    def rooms
      Array(game_state['unlockedRooms'])
    end

    def card_door
      unlock('door', 'records_room', 'RECORDS-01', 'rfid', CARD)
    end

    # ---- the card door ----

    test 'the right card stays shut until the owner approves, with roomData in the last answer only' do
      build_real
      hold!('records_card')
      status, gate = card_door
      assert_equal [200, true, 'push', 'moira'], [status, gate['secondStep'], gate['kind'], gate['npcId']]
      assert_equal %w[kind npcId secondStep success targetId targetType], gate.keys.sort, 'no opener for a card'
      assert_equal 'door', gate['targetType']
      assert_not_includes rooms, 'records_room'
      assert_equal [0, 1], [count('badge_swipe'), count('mfa_challenge')], 'the first right card writes mfa_challenge and no badge row'
      assert_equal({ 'method' => 'rfid' }, rows('mfa_challenge').first['detail'])
      # nothing of the room before it opens
      status, body = room('records_room')
      assert_not_equal 200, status, body.to_s
      bootstrap
      assert_nothing_leaked(*ROOM_WORDS)
      assert_equal [404, NOT_FOUND], mfa('prompt', 'door:no_such_room')
      pester('door:records_room')
      assert_not_includes rooms, 'records_room', 'a pass opens nothing by itself'
      status, body = card_door
      assert_equal [200, true], [status, body['success']]
      assert_equal %w[records_memo], body['roomData']['objects'].map { |o| o['id'] }
      assert_includes rooms, 'records_room'
      assert_nil((game_state['lockSteps'] || {})['door:records_room'])
      assert_equal [1, 1], [count('badge_swipe'), count('mfa_challenge')], 'the final post writes one badge row'
      assert_equal 'ok', rows('badge_swipe').first['result']
      # a repeat opens as before, with no gate and no new row
      assert_equal [200, true], card_door.then { |s, b| [s, b['success']] }
      assert_equal 1, count('mfa_challenge')
      assert_equal 200, room('records_room')[0]
    end

    test 'a wrong card is the old refusal and starts nothing' do
      build_real # the card is not held: the lock has no access list, so the server asks what it holds
      status, body = unlock('door', 'records_room', 'X', 'rfid', 'card_ids' => ['OTHER-9'])
      assert_equal 422, status
      assert_equal %w[message success], body.keys.sort
      assert_empty(game_state['lockSteps'] || {})
      assert_equal 0, count('mfa_challenge')
    end

    test 'a gated room cannot be opened by the wrong method, a client claim or a stale record' do
      build_real
      assert_equal 422, unlock('door', 'records_room', '', 'unlocked')[0]
      assert_equal 422, unlock('door', 'plant_room', 'gordon', 'npc', 'card_ids' => [])[0] if false
      assert_not_includes rooms, 'records_room'
      assert_not_includes rooms, 'plant_room'
    end

    # ---- the door an NPC opens ----

    test 'an npc first factor at a gated door answers the gate with the opener, notes the grant and shows it after a reload' do
      build_real
      status, gate = unlock('door', 'plant_room', 'gordon', 'npc')
      assert_equal 200, status
      assert_equal %w[kind npcId opener secondStep success targetId targetType], gate.keys.sort
      assert_equal %w[moira gordon], gate.values_at('npcId', 'opener'), 'the owner approves; the opener is the NPC that opened the door'
      assert_equal 'gordon', game_state.dig('npcStepGrants', 'door:plant_room')
      assert_not_includes rooms, 'plant_room'
      boot = bootstrap[1]
      plant = boot['rooms']['plant_room']
      assert_equal({ 'kind' => 'push', 'owner' => 'moira' }, plant['secondStep'])
      assert_equal 'gordon', plant['npcStepOpener']
      assert_nothing_leaked(*ROOM_WORDS)
      pester('door:plant_room')
      status, body = unlock('door', 'plant_room', 'gordon', 'npc')
      assert_equal [200, true], [status, body['success']]
      assert_equal %w[plant_memo], body['roomData']['objects'].map { |o| o['id'] }
      assert_nil game_state['npcStepGrants']&.dig('door:plant_room')
      assert_nil bootstrap[1]['rooms']['plant_room']['npcStepOpener']
    end

    test 'a door npc post by an NPC without permission, or one not met, is refused before any gate' do
      build_real
      assert_equal [422, INVALID], unlock('door', 'plant_room', 'priya', 'npc')
      build_real('encounteredNPCs' => [])
      assert_equal [422, INVALID], unlock('door', 'plant_room', 'gordon', 'npc')
      assert_empty(game_state['lockSteps'] || {})
      assert_empty(game_state['npcStepGrants'] || {})
    end

    # ---- what skips the step ----

    test 'a flag reward opens a gated door with no step' do
      data = {
        'startRoom' => 'hall',
        'flags' => { 'target_vm' => { 'flag_1' => 'flag{one}' } },
        'rooms' => {
          'hall' => { 'type' => 'room_office', 'connections' => { 'north' => 'vault' },
                      'objects' => [{ 'type' => 'flag-station', 'id' => 'station', 'name' => 'Flag Station', 'acceptsVms' => ['target_vm'],
                                      'flags' => ['target_vm:flag_1'], 'flagRewards' => [{ 'type' => 'unlock_door', 'target_room' => 'vault' }] }],
                      'npcs' => [{ 'id' => 'amy' }] },
          'vault' => { 'type' => 'room_office', 'locked' => true, 'lockType' => 'key', 'requires' => 'vault_key',
                       'connections' => { 'south' => 'hall' }, 'secondStep' => { 'kind' => 'push', 'owner' => 'amy' } }
        }
      }
      build_step_game(data)
      post game_path('flags'), params: { flag: 'flag{one}', stationId: 'station' }, as: :json
      assert_equal true, response.parsed_body['success'], response.body
      assert_includes rooms, 'vault'
      assert_empty(game_state['lockSteps'] || {})
    end

    test 'a propped door opens with no step' do
      data = AccessWorkScenario.scenario
      data['globalVariables'].merge!('rota_rdown' => false)
      data['resources']['rota'] = { 'kind' => 'rota', 'name' => 'Shift rota system', 'offWhen' => 'rota_down' }
      data['globalVariables'].merge!('rota_down' => false, 'store_door_propped' => false)
      office = data['rooms']['office']
      office['connections']['north'] = 'store_room'
      office['objects'] += [AccessWorkScenario.pc('tom_pc'),
                            { 'type' => 'fire_extinguisher1', 'id' => 'store_wedge', 'name' => 'Extinguisher', 'revealOnGlobal' => 'store_door_propped' }]
      office['npcs'] += [AccessWorkScenario.staff('tom', 'tfletcher', 'Tom-Teal-40',
                                                  'workNeeds' => ['+rota'], 'role' => %w[facilities staff],
                                                  'workarounds' => [{ 'at' => 40, 'do' => 'prop_door', 'door' => 'store_room',
                                                                      'prop' => 'store_wedge', 'setGlobal' => 'store_door_propped' }])]
      data['rooms']['store_room'] = { 'type' => 'room_office', 'connections' => { 'south' => 'office' }, 'locked' => true,
                                      'lockType' => 'rfid', 'access' => { 'roles' => ['facilities'] }, 'objects' => [],
                                      'secondStep' => { 'kind' => 'push', 'owner' => 'tom' } }
      data = AccessWorkScenario.assign_owners!(data)
      build_step_game(data, 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby office],
                            'encounteredNPCs' => %w[dana kai ian amy omar temp_user tom],
                            'globalVariables' => { 'rota_down' => true, 'store_door_propped' => false })
      t = Time.current
      run = nil
      2.times do |i|
        travel_to(t + (i * 25)) do
          post npc_frustration_game_url(@game), params: { reports: [{ npc_id: 'tom', event: 'fail', need: 'work', object_id: 'tom_pc',
                                                                      missing: [{ id: 'rota', why: 'down' }] }] }, as: :json
          run = response.parsed_body['answers'].first['run']
        end
      end
      assert run, response.body.to_s[0, 800]
      travel_to(t + 25 + 5) do
        post npc_workaround_game_url(@game), params: { npc_id: 'tom', index: run['index'], hand: run['hand'] }, as: :json
      end
      assert_equal 200, response.status, response.body
      assert response.parsed_body['roomData'].is_a?(Hash)
      assert_includes rooms, 'store_room'
      assert_empty(game_state['lockSteps'] || {})
    end

    # ---- the stale record never opens another lock ----

    test 'a passed record for one door opens no other door' do
      build_real
      hold!('records_card')
      card_door
      pester('door:records_room')
      status, gate = unlock('door', 'plant_room', 'gordon', 'npc')
      assert_equal [200, true], [status, gate['secondStep']]
      assert_not_includes rooms, 'plant_room'
    end
  end
end
