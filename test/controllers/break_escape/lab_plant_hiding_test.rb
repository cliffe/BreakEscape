require 'test_helper'
require_relative '../../support/network_model_scenario'

module BreakEscape
  # lab_physical_pentest, plant hiding (PLANT_HIDING_PLAN.md, H5, review R1 M1 and m1). The lab
  # secrets model test writes plantedItems straight into player_state; these go through the
  # route the client uses (POST /inventory, action_type hide) against the real lab scenario,
  # so a plant that stops being a hiding spot (small sprite, hidingSpot false, another room)
  # fails here, and the old-save shape (an old copy of the lab with a plant on rogue_ap_spot)
  # is checked against the current code.
  class LabPlantHidingTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    PLANTS = %w[reception_planter reception_plant_desk].freeze

    setup do
      @mission = Mission.create!(name: 'lab_physical_pentest', display_name: 'Physical pentest', published: true, difficulty_level: 1)
    end

    def new_game
      game = Game.create!(mission: @mission, player: break_escape_demo_users(:test_user)).reload
      kit = lab_object(game, 'kit_rogue_ap')
      game.player_state['inventory'] = [{ 'type' => kit['type'], 'id' => kit['id'], 'name' => kit['name'],
                                          'scenarioData' => kit.slice('type', 'id', 'name', 'takeable', 'droppable') }]
      game.player_state['unlockedRooms'] = (Array(game.player_state['unlockedRooms']) + ['reception']).uniq
      game.save!
      game
    end

    def lab_object(game, id)
      game.scenario_data['rooms'].each_value do |room|
        found = Array(room['objects']).find { |o| o.is_a?(Hash) && o['id'] == id }
        return found if found
      end
      nil
    end

    def password(game, npc_id)
      Game.scenario_room_npcs(game.scenario_data).find { |n| n['id'] == npc_id }['creds']['password']
    end

    def psk(game)
      game.scenario_data.dig('networks', 'office_lan', 'wifi', 'psk')
    end

    def record_capture(target_id, address)
      captures = { target_id => { 'targetId' => target_id, 'kind' => 'credential', 'address' => address, 'at' => 1 } }
      put game_path('sync_state'), params: { globalVariables: { 'se_captures' => captures } }, as: :json
      assert_response :success, response.body
    end

    def record_captures(*pairs)
      captures = pairs.to_h { |t, a| [t, { 'targetId' => t, 'kind' => 'credential', 'address' => a, 'at' => 1 }] }
      put game_path('sync_state'), params: { globalVariables: { 'se_captures' => captures } }, as: :json
      assert_response :success, response.body
    end

    def secrets
      get game_path('capture_secrets'), as: :json
      assert_response :success, response.body
      response.parsed_body['secrets'] || {}
    end

    def hide(spot)
      post game_path('inventory'), params: { action_type: 'hide', item: { id: 'kit_rogue_ap' }, hidden_in: spot }, as: :json
      response.parsed_body
    end

    PLANTS.each do |plant|
      test "hiding the kit in #{plant} through POST /inventory records it and serves both captures" do
        @game = new_game
        before = bootstrap_scenario
        assert before['hideables'].key?('kit_rogue_ap'), 'the bootstrap lists the hideable kit'
        assert_equal [], before['hiddenDevices']

        body = hide(plant)
        assert_response :success, response.body
        assert_equal({ 'item' => 'kit_rogue_ap', 'on' => plant, 'room' => 'reception' }, body['hidden'])
        refute_includes held_ids, 'kit_rogue_ap', 'the hide takes the kit out of the inventory'

        after = bootstrap_scenario
        assert_equal [{ 'item' => 'kit_rogue_ap', 'on' => plant, 'room' => 'reception' }], after['hiddenDevices']
        refute_includes response.body, psk(@game)
        refute_includes response.body, password(@game, 'kieran')
        refute after.key?('plantedItems')

        record_captures(['kieran', 'k.doyle'], ['staff_wifi_key', 'Ledgerwell-Staff'])
        served = secrets
        assert_equal password(@game, 'kieran'), served['kieran']
        assert_equal psk(@game), served['staff_wifi_key']

        again = hide(plant)
        assert_response :success, 'the same request again answers the same entry'
        assert_equal body['hidden'], again['hidden']
      end
    end

    test 'with the kit hidden in one plant, hiding it in the other answers already_hidden' do
      @game = new_game
      hide('reception_planter')
      assert_response :success
      body = hide('reception_plant_desk')
      assert_response :unprocessable_entity
      assert_equal 'already_hidden', body['reason']
      assert_equal 'reception_planter', body['hidden']['on']
    end

    test 'a plant in another room, a non-plant and a forged id are not spots' do
      @game = new_game
      %w[reception_notes_plantlog1_9 lw_staff_ap reception_plant-large4_34 rogue_ap_spot].each do |spot|
        body = hide(spot)
        assert_response :unprocessable_entity, spot
        assert_equal 'not_a_spot', body['reason'], spot
      end
      assert_includes held_ids, 'kit_rogue_ap'
    end

    test 'the room answer still carries the console fields the bootstrap no longer repeats' do
      @game = new_game
      get game_path('room/reception'), as: :json
      assert_response :success, response.body
      dev = response.parsed_body['room']['objects'].find { |o| o['id'] == 'planted_rogue_ap' }
      assert dev, 'GET /room/reception lists planted_rogue_ap'
      CaptureProofs::DEVICE_DATA_FIELDS.each { |f| assert dev.key?(f), "the room answer keeps #{f}" }
      # The room answer is the only source of the console fields now: none may carry a secret.
      refute_includes response.body, psk(@game)
      refute_includes response.body, password(@game, 'kieran')
      assert_equal 'rogue_ap_tucked', @game.hideables_for_client['kit_rogue_ap'].dig('overlay', 'sprite')
      refute @game.hideables_for_client['kit_rogue_ap'].key?('deviceData'), 'rooms are exactly [reception]: not in the bootstrap'
    end

    # An old save keeps the lab as it was created (scenario_data is made once): the kit has no
    # hideable, the pot rogue_ap_spot takes it by requiresItem, and both proofs name that spot.
    # Built by undoing the migration on a current render, so it needs no game record edit.
    def old_copy
      data = new_game.scenario_data.deep_dup
      reception = data['rooms']['reception']['objects']
      reception.reject! { |o| PLANTS.include?(o['id']) }
      reception << {
        'type' => 'pc', 'id' => 'rogue_ap_spot', 'name' => 'Waiting-area planter', 'sprite' => 'rogue_ap_pot',
        'position' => { 'x' => 1.1875, 'y' => 5.125 }, 'takeable' => false, 'interactable' => true, 'active' => true,
        'requiresItem' => 'kit_rogue_ap', 'consumesItem' => true,
        'triggerOnInteract' => [{ 'type' => 'set_global', 'key' => 'ap_planted', 'value' => true }]
      }
      device = reception.find { |o| o['id'] == 'planted_rogue_ap' }
      device.delete('hiddenWith')
      device.merge!('position' => { 'x' => 1.1875, 'y' => 5.125, 'elevation' => 3 }, 'revealOnGlobal' => 'ap_planted')
      kit = data['rooms'].values.flat_map { |r| Array(r['objects']) }.find { |o| o['id'] == 'kit_rogue_ap' }
      kit.delete('hideable')
      add_old_spot(data)
      data
    end

    def add_old_spot(node)
      case node
      when Hash
        node['on'] = 'rogue_ap_spot' if node == { 'planted' => 'kit_rogue_ap' }
        node.each_value { |v| add_old_spot(v) }
      when Array
        node.each { |v| add_old_spot(v) }
      end
    end

    test 'old save: an old lab copy with the kit planted on rogue_ap_spot still serves both captures and has no hideables' do
      mission = @mission
      kit_entry = { 'type' => 'rogue_ap', 'id' => 'kit_rogue_ap', 'name' => 'Pocket rogue AP',
                    'scenarioData' => { 'type' => 'rogue_ap', 'id' => 'kit_rogue_ap', 'name' => 'Pocket rogue AP' } }
      @game = create_access_game(
        mission: mission, player: break_escape_demo_users(:test_user), scenario: old_copy,
        player_state: { 'currentRoom' => 'reception', 'unlockedRooms' => %w[reception], 'inventory' => [kit_entry] }
      )
      refute_includes @game.scenario_data.to_json, 'reception_planter'
      assert_equal true, @game.record_planted_item!('kit_rogue_ap', 'rogue_ap_spot'), 'the old interact path records the plant'
      @game.save!
      assert_equal [{ 'item' => 'kit_rogue_ap', 'on' => 'rogue_ap_spot' }], @game.reload.player_state['plantedItems']
      assert_equal [], @game.hidden_devices_for_client, 'the old copy has no hideable kit'
      assert_equal({}, @game.hideables_for_client)

      record_captures(['kieran', 'k.doyle'], ['staff_wifi_key', 'Ledgerwell-Staff'])
      served = secrets
      assert_equal password(@game, 'kieran'), served['kieran']
      assert_equal psk(@game), served['staff_wifi_key']

      body = bootstrap_scenario
      assert_response :success
      refute body.key?('hideables'), 'no hideables for an old copy'
      refute body.key?('hiddenDevices')
      refute_includes response.body, psk(@game)
      refute_includes response.body, password(@game, 'kieran')
    end
  end
end
