require 'test_helper'
require_relative '../../support/keyring_login_scenario'

module BreakEscape
  # S8a unit 16 (feature A22, M1a): who may hold a code device, and GET /mfa/device. The device is
  # owner-bound as the Friendface phone is: it leaves its owner only after an offer or a knock-out,
  # never by a client claim; a stored NPC drop the owner does not offer is refused on pickup; a
  # dropped device the player holds may be picked up again; a client cannot mint one.
  class MfaDeviceGateTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    KS = KeyringLoginScenario
    NS = NetworkModelScenario
    T0 = Time.zone.at(1_800_000_000)

    SAM_FOB = { 'id' => 'sam_fob', 'type' => 'code_device', 'name' => 'Fob', 'owner' => 'sam', 'takeable' => true }.freeze
    JAKE_FOB = { 'id' => 'jake_fob', 'type' => 'code_device', 'name' => 'Jake fob', 'owner' => 'jake', 'takeable' => true,
                 'droppable' => true }.freeze
    IAN_FOB = { 'id' => 'ian_fob', 'type' => 'code_device', 'name' => 'Ian fob', 'owner' => 'ian', 'takeable' => true }.freeze
    LENA_FOB = { 'id' => 'lena_fob', 'type' => 'code_device', 'name' => 'Lena fob', 'owner' => 'lena', 'takeable' => true }.freeze

    def scenario
      data = KS.scenario
      data['policies']['gate'] = { 'mfa' => 'code', 'remote' => 'allowed' }
      data['rooms']['desk_room']['objects'].find { |o| o['id'] == 'sam_pc' }['policy'] = 'gate'
      npcs = data['rooms']['lobby']['npcs']
      npcs.find { |n| n['id'] == 'sam' }['itemsHeld'] = [SAM_FOB.dup]
      npcs.find { |n| n['id'] == 'ian' }['itemsHeld'] = [IAN_FOB.dup]
      npcs.find { |n| n['id'] == 'ian' }['koImmune'] = true
      jake = npcs.find { |n| n['id'] == 'jake' }
      jake['itemsHeld'] = [JAKE_FOB.dup]
      jake['eventMappings'] = [{ 'eventPattern' => 'global_variable_changed:lend_fob', 'action' => 'give_item:code_device' }]
      data['rooms']['lobby']['objects'] << { 'id' => 'fob_safe', 'type' => 'safe', 'name' => 'Fob safe', 'locked' => true,
                                             'lockType' => 'pin', 'requires' => '1234', 'contents' => [LENA_FOB.dup] }
      data
    end

    def build(player_state = {})
      build_network_game({ 'encounteredNPCs' => %w[sam lena ian jake] }.merge(player_state), scenario)
    end

    setup do
      travel_to T0
      build
    end

    teardown { travel_back }

    def state
      @game.reload.player_state
    end

    def device(id)
      get game_path('mfa/device'), params: { item_id: id }, as: :json
      response
    end

    def add_item(item, extra = {})
      post game_path('inventory'), params: { action_type: 'add', item: item }.merge(extra), as: :json
      response
    end

    def take(fob, npc: nil)
      extra = npc ? { source_npc_id: npc } : {}
      add_item({ 'type' => 'code_device', 'id' => fob['id'], 'name' => fob['name'] }, extra)
    end

    def knock_out(npc_id)
      post game_path('update_room'), params: { roomId: 'lobby', actionType: 'update_npc_state',
                                               data: { npcId: npc_id, stateChanges: { isKO: true, currentHP: 0 } } }, as: :json
      assert_response :success
    end

    def held?(id)
      Array(state['inventory']).any? { |i| (i['scenarioData'] || i)['id'] == id }
    end

    test 'the device route is refused before the device is held, for an unknown id, another type and a missing id' do
      assert_equal 403, device('sam_fob').status
      assert_equal({ 'success' => false, 'error' => 'no such device' }, response.parsed_body)
      assert_equal 'no-store', response.headers['Cache-Control']
      assert_equal 404, device('nope').status
      assert_equal({ 'success' => false, 'error' => 'not found' }, response.parsed_body)
      assert_equal 404, device('lobby_vault').status
      get game_path('mfa/device'), as: :json
      assert_response :not_found
      assert_not_includes response.body, @game.reload.code_device_code('sam_fob')
    end

    test 'a forged item with the device id opens nothing' do
      build('inventory' => [{ 'id' => 'sam_fob', 'type' => 'code_device', 'name' => 'Fob', 'owner' => 'sam',
                              'clientAdded' => true }])
      assert_equal 403, device('sam_fob').status
      build('inventory' => [{ 'id' => 'sam_fob', 'type' => 'code_device', 'name' => 'Fob', 'owner' => 'ian' }])
      assert_equal 403, device('sam_fob').status
    end

    test 'a client-built item with an owner, and a room add with no source, are refused' do
      add_item({ 'type' => 'code_device', 'id' => 'minted_fob', 'name' => 'Minted', 'owner' => 'sam' })
      assert_response :unprocessable_entity
      assert_not held?('minted_fob')
      post game_path('update_room'), params: { roomId: 'lobby', actionType: 'add_object',
                                               data: { type: 'code_device', id: 'minted_fob', name: 'Minted', owner: 'sam',
                                                       takeable: true } }, as: :json
      assert(Array(state.dig('room_states', 'lobby', 'objects_added')).none? { |o| o['type'] == 'code_device' })
      assert_equal 403, device('sam_fob').status
    end

    test 'the device cannot be pulled from an owner who has only been met' do
      take(SAM_FOB, npc: 'sam')
      assert_response :unprocessable_entity
      assert_not held?('sam_fob')
      assert_equal 403, device('sam_fob').status
    end

    test 'accepted after an offer: the held device shows its code, once held' do
      take(JAKE_FOB, npc: 'jake')
      assert_response :success, response.body
      assert held?('jake_fob')
      assert_equal 200, device('jake_fob').status
      body = response.parsed_body
      assert_equal 'jake', body['npcId']
      assert_equal @game.reload.code_device_code('jake_fob'), body['code']
      assert_equal 'no-store', response.headers['Cache-Control']
    end

    test 'accepted after a knock-out record' do
      knock_out('sam')
      take(SAM_FOB, npc: 'sam')
      assert_response :success, response.body
      assert_equal 200, device('sam_fob').status
    end

    test 'refused for a koImmune owner with a forged knock-out' do
      put sync_state_game_url(@game), params: { npcHostility: { 'ian' => { hostile: true, ko: true } } }, as: :json
      post game_path('update_room'), params: { roomId: 'lobby', actionType: 'update_npc_state',
                                               data: { npcId: 'ian', stateChanges: { isKO: true, currentHP: 0 } } }, as: :json
      take(IAN_FOB, npc: 'ian')
      assert_response :unprocessable_entity
      assert_not held?('ian_fob')
    end

    test 'another owner\'s device gives a code that fails at this account\'s PC' do
      build('inventory' => [{ 'scenarioData' => JAKE_FOB.dup }, { 'scenarioData' => SAM_FOB.dup }])
      jake_code = @game.reload.code_device_code('jake_fob')
      post game_path('login'), params: { pc_id: 'sam_pc', username: 'sokafor', password: NS::SAM_PASSWORD }, as: :json
      assert response.parsed_body['mfaRequired']
      post game_path('mfa/verify'), params: { pc_id: 'sam_pc', code: jake_code }, as: :json
      assert_response :unprocessable_entity
      assert_nil state['sessions']['sam_pc']
    end

    test 'a dropped device is picked up again, with no offer or knock-out from an owner who offers none' do
      held = SAM_FOB.merge('droppable' => true)
      build('inventory' => [{ 'scenarioData' => held }])
      assert_equal 200, device('sam_fob').status
      post game_path('update_room'), params: { roomId: 'lobby', actionType: 'add_object', sourceType: 'player_drop',
                                               data: { type: 'code_device', id: 'sam_fob', x: 64, y: 64 } }, as: :json
      assert_response :success, response.body
      assert_includes state['droppedItems'], 'sam_fob'
      assert(state.dig('room_states', 'lobby', 'objects_added').any? { |o| o['id'] == 'sam_fob' })
      @game.player_state['inventory'] = []
      @game.save!
      assert_equal 403, device('sam_fob').status
      take(SAM_FOB.merge('name' => 'Fob'))
      assert_response :success, response.body
      assert_equal 200, device('sam_fob').status
    end

    test 'a stored NPC drop the owner does not offer is refused on pickup, and allowed once the owner is knocked out' do
      build('room_states' => { 'lobby' => { 'objects_added' => [SAM_FOB.merge('x' => 64, 'y' => 96)], 'objects_removed' => [],
                                            'object_states' => {}, 'npc_states' => {} } })
      take(SAM_FOB)
      assert_response :unprocessable_entity
      assert_not held?('sam_fob')
      knock_out('sam')
      take(SAM_FOB)
      assert_response :success, response.body
      assert held?('sam_fob')
    end

    test 'a device in a container follows the container\'s rule, not the owner\'s' do
      take(LENA_FOB)
      assert_response :unprocessable_entity
      assert_not held?('lena_fob')
      build('unlockedObjects' => ['fob_safe'])
      take(LENA_FOB)
      assert_response :success, response.body
      assert held?('lena_fob')
    end

    test 'the existing phone cases are unchanged: an unoffered phone is still refused, an offered one taken' do
      data = scenario
      lobby_npcs = data['rooms']['lobby']['npcs']
      lobby_npcs.find { |n| n['id'] == 'sam' }['itemsHeld'] = [{ 'type' => 'phone_friendface', 'id' => 'sam_phone', 'name' => "Sam's phone",
                                                                  'takeable' => true, 'owner' => 'sam' }]
      @game = create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                                 scenario: data, player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => NetworkRequests::OPEN_ROOMS.dup,
                                                                 'encounteredNPCs' => %w[sam] })
      add_item({ 'type' => 'phone_friendface', 'id' => 'sam_phone', 'name' => "Sam's phone" }, source_npc_id: 'sam')
      assert_response :unprocessable_entity
      knock_out('sam')
      add_item({ 'type' => 'phone_friendface', 'id' => 'sam_phone', 'name' => "Sam's phone" }, source_npc_id: 'sam')
      assert_response :success, response.body
    end

    test 'per-role access: the owner is allowed both policy methods, another user neither' do
      owner = GamePolicy.new(break_escape_demo_users(:test_user), @game)
      other = GamePolicy.new(break_escape_demo_users(:other_user), @game)
      %i[mfa_device? mfa_verify?].each do |action|
        assert owner.public_send(action), action
        assert_not other.public_send(action), action
      end
    end
  end
end
