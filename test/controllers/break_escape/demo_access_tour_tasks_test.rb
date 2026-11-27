require 'test_helper'
require_relative '../../support/network_model_scenario'

module BreakEscape
  # demo_access_tour, slice 5: the objective tasks the server checks itself. For each task that
  # complete_task! validates (unlock_room, unlock_object, npc_conversation) the POST is refused
  # before its trigger and accepted after it, over the real scenario and the real endpoints.
  # Manual tasks (t_copy_badge, t_unplug, t_implant, t_capture_key) have no server check and are
  # driven by eventMappings, so they are not covered here.
  class DemoAccessTourTasksTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    PEOPLE = %w[delphine thandiwe yasmin lorna julian].freeze
    PLANT = 'reception_plant_west'.freeze

    setup do
      @mission = Mission.create!(name: 'demo_access_tour', display_name: 'Demo access tour', published: true,
                                 difficulty_level: 1)
      @game = Game.create!(mission: @mission, player: break_escape_demo_users(:test_user)).reload
      @game.player_state['currentRoom'] = 'reception'
      @game.player_state['unlockedRooms'] = %w[reception open_plan kitchen]
      @game.player_state['encounteredNPCs'] = PEOPLE.dup
      @game.save!
    end

    def data
      @game.scenario_data
    end

    def npc(id)
      Game.scenario_room_npcs(data).find { |n| n['id'] == id }
    end

    def password(person)
      npc(person).dig('creds', 'password')
    end

    def username(person)
      npc(person).dig('creds', 'username')
    end

    def pin
      data.dig('rooms', 'server_room', 'requires').to_s
    end

    def psk
      data.dig('networks', 'office_lan', 'wifi', 'psk')
    end

    def lorna_card_id
      npc('lorna').dig('creds', 'card', 'card_id')
    end

    def find_object(id, list = nil)
      list ||= data['rooms'].values.flat_map { |room| Array(room['objects']) }
      list.each do |object|
        return object if object['id'] == id

        found = find_object(id, Array(object['contents'])) if object['contents'].is_a?(Array)
        return found if found
      end
      nil
    end

    def hold(*ids)
      @game.reload
      held = ids.map { |id| find_object(id).deep_dup.slice('id', 'type', 'name', 'card_id', 'rfid_protocol', 'takeable', 'credential', 'text') }
      @game.player_state['inventory'] = Array(@game.player_state['inventory']) + held
      @game.save!
    end

    def open_rooms(*rooms)
      @game.reload
      @game.player_state['unlockedRooms'] = (Array(@game.player_state['unlockedRooms']) + rooms).uniq
      @game.save!
    end

    def state
      @game.reload.player_state
    end

    def door(room_id, method:, card_ids: nil, attempt: nil)
      params = { targetType: 'door', targetId: room_id, method: method }
      params[:card_ids] = card_ids unless card_ids.nil?
      params[:attempt] = attempt unless attempt.nil?
      post unlock_game_url(@game), params: params, as: :json
      response.parsed_body
    end

    def complete(task_id)
      post complete_task_game_url(@game, task_id: task_id), as: :json
      response.parsed_body
    end

    def assert_task_refused(task_id, context)
      body = complete(task_id)
      assert_equal false, body['success'], "#{task_id} #{context}: #{body.inspect}"
      refute_equal 'completed', state.dig('objectivesState', 'tasks', task_id, 'status'), "#{task_id} #{context}"
      body
    end

    def assert_task_done(task_id, context = 'after its trigger')
      body = complete(task_id)
      assert_response :success, "#{task_id} #{context}: #{body.inspect}"
      assert_equal true, body['success'], "#{task_id} #{context}: #{body.inspect}"
      assert_equal 'completed', state.dig('objectivesState', 'tasks', task_id, 'status')
    end

    def sign_in_ok(pc_id, person, **opts)
      body = sign_in(pc_id, username(person), password(person), **opts)
      assert body['success'], "#{person} at #{pc_id}: #{body.inspect}"
      body
    end

    def plant_box(jack = 'meeting_jack')
      hold('kit_dropbox')
      open_rooms('meeting_room', 'comms_cupboard')
      body = plant(jack)
      assert body['success'], body.inspect
      @game.reload.foothold_id_for(jack)
    end

    test 'every task the server checks exists in the scenario with the type this file assumes' do
      types = { 't_meet_ama' => 'npc_conversation', 't_debrief' => 'npc_conversation',
                't_kit' => 'unlock_room', 't_comms' => 'unlock_room', 't_server_room' => 'unlock_room',
                't_front_desk' => 'unlock_object', 't_drop_box' => 'unlock_object', 't_julian_pc' => 'unlock_object',
                't_open_session' => 'unlock_object', 't_yasmin_pc' => 'unlock_object',
                't_door_controller' => 'unlock_object', 't_staff_wifi' => 'unlock_object',
                't_guest_port' => 'unlock_object' }
      types.each do |id, type|
        task = @game.send(:find_task_in_scenario, id)
        assert task, "#{id} missing"
        assert_equal type, task['type'], id
      end
    end

    test 't_meet_ama is refused until Ama has been encountered' do
      assert_task_refused 't_meet_ama', 'before meeting'
      @game.reload
      @game.player_state['encounteredNPCs'] = PEOPLE + %w[ama]
      @game.save!
      assert_task_done 't_meet_ama'
    end

    test 't_debrief is refused until Ama has been encountered' do
      assert_task_refused 't_debrief', 'before meeting'
      @game.reload
      @game.player_state['encounteredNPCs'] = PEOPLE + %w[ama]
      @game.save!
      assert_task_done 't_debrief'
    end

    test 't_kit is refused until the meeting room is unlocked by the visitor card' do
      hold('visitor_card')
      assert_task_refused 't_kit', 'before the door'
      body = door('meeting_room', method: 'rfid', card_ids: ['VISITOR-07'])
      assert_response :success, body.inspect
      assert_task_done 't_kit'
    end

    test 't_front_desk is refused until a reception_pc session exists' do
      assert_task_refused 't_front_desk', 'before sign-in'
      sign_in_ok('reception_pc', 'delphine')
      assert_task_done 't_front_desk'
    end

    test 't_front_desk is refused after a wrong sign-in' do
      refute sign_in('reception_pc', username('delphine'), 'wrong-password')['success']
      assert_task_refused 't_front_desk', 'after a failed sign-in'
    end

    test 't_drop_box is refused until the box is planted at meeting_jack' do
      assert_task_refused 't_drop_box', 'before the plant'
      plant_box('meeting_jack')
      assert_task_done 't_drop_box'
    end

    test 't_drop_box is not met by planting at a different jack' do
      plant_box('guest_vlan_port')
      assert_task_refused 't_drop_box', 'planted elsewhere'
    end

    test 't_guest_port is refused until the box is planted at guest_vlan_port' do
      assert_task_refused 't_guest_port', 'before the plant'
      plant_box('guest_vlan_port')
      assert_task_done 't_guest_port'
    end

    test 't_julian_pc is refused until a julian_pc session exists' do
      foothold = plant_box
      assert_task_refused 't_julian_pc', 'before sign-in'
      sign_in_ok('reception_pc', 'delphine')
      hold('julian_rdp_file')
      post game_path('logout'), params: { pc_id: 'reception_pc' }, as: :json
      assert_task_refused 't_julian_pc', 'after only the front desk'
      body = cred_through_box('julian_pc', 'julian_rdp', foothold)
      assert body['success'], body.inspect
      assert_task_done 't_julian_pc'
    end

    test 't_door_controller is refused until a door_controller session exists' do
      foothold = plant_box
      assert_task_refused 't_door_controller', 'before sign-in'
      sign_in_ok('reception_pc', 'delphine')
      hold('julian_rdp_file')
      post game_path('logout'), params: { pc_id: 'reception_pc' }, as: :json
      assert cred_through_box('julian_pc', 'julian_rdp', foothold)['success']
      refute sign_in('door_controller', username('lorna'), 'wrong-password', foothold: foothold)['success']
      assert_task_refused 't_door_controller', 'after a failed sign-in'
      body = sign_in('door_controller', username('lorna'), password('lorna'), foothold: foothold)
      assert body['success'], body.inspect
      assert_task_done 't_door_controller'
    end

    test 't_comms is refused until the cupboard is opened with Lorna\'s clone' do
      assert_task_refused 't_comms', 'before the door'
      hold('rfid_cloner')
      post clone_card_game_url(@game), params: { card_id: lorna_card_id, npc_id: 'lorna' }, as: :json
      assert_equal true, response.parsed_body['recorded']
      assert_task_refused 't_comms', 'cloned but door not used'
      body = door('comms_cupboard', method: 'rfid', card_ids: [lorna_card_id])
      assert_response :success, body.inspect
      assert_task_done 't_comms'
    end

    test 't_server_room is refused until the keypad takes the code' do
      wrong = pin == '1234' ? '4321' : '1234'
      door('server_room', method: 'pin', attempt: wrong)
      assert_task_refused 't_server_room', 'after a wrong code'
      body = door('server_room', method: 'pin', attempt: pin)
      assert_response :success, body.inspect
      assert_task_done 't_server_room'
    end

    test 't_open_session is refused until thandiwe_laptop has a session' do
      assert_task_refused 't_open_session', 'before sign-in'
      sign_in_ok('thandiwe_laptop', 'thandiwe')
      assert_task_done 't_open_session'
    end

    test 't_yasmin_pc is refused until yasmin_pc has a session' do
      assert_task_refused 't_yasmin_pc', 'before sign-in'
      sign_in_ok('yasmin_pc', 'yasmin')
      assert_task_done 't_yasmin_pc'
    end

    test 't_staff_wifi is refused until the Staff AP is joined with the served key' do
      assert_task_refused 't_staff_wifi', 'before the join'
      hold('kit_rogue_ap')
      post game_path('inventory'), params: { action_type: 'hide', item: { id: 'kit_rogue_ap' }, hidden_in: PLANT }, as: :json
      captures = { 'staff_wifi_key' => { 'targetId' => 'staff_wifi_key', 'kind' => 'credential',
                                         'address' => 'MerrinSallow-Staff', 'at' => 1 } }
      put game_path('sync_state'), params: { globalVariables: { 'se_captures' => captures } }, as: :json
      get game_path('capture_secrets'), as: :json
      key = response.parsed_body.dig('secrets', 'staff_wifi_key')
      assert_equal psk, key
      post game_path('network/join'), params: { ap_id: 'staff_ap', key: 'wrong' }, as: :json
      assert_task_refused 't_staff_wifi', 'after a wrong key'
      post game_path('network/join'), params: { ap_id: 'staff_ap', key: key }, as: :json
      assert_equal true, response.parsed_body['success'], response.body
      assert_task_done 't_staff_wifi'
    end

    test 'a completed task is idempotent and unknown or forged ids are refused' do
      sign_in_ok('reception_pc', 'delphine')
      assert_task_done 't_front_desk'
      again = complete('t_front_desk')
      assert_equal true, again['success']
      assert_equal 'Already completed', again['message']
      body = complete('t_not_a_task')
      assert_equal false, body['success']
      assert_equal 'Task not found', body['error']
    end

    private

    def cred_through_box(pc_id, credential, foothold)
      post game_path('login'), params: { pc_id: pc_id, credential: credential, foothold: foothold }, as: :json
      response.parsed_body
    end
  end
end
