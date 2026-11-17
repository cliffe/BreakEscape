require 'test_helper'
require_relative '../../support/hiding_scenario'

module BreakEscape
  # POST /inventory hide and the bootstrap's hideables / hiddenDevices
  # (docs/achitechture/PLANT_HIDING_PLAN.md, sections 7 and 11), on an inline fixture.
  class HideDeviceControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include HidingScenario

    PSK = 'Qz7mR4tw-hide'.freeze
    DECOR_ID = 'reception_plant-large12-top-ani1_77'.freeze

    def scenario
      data = hiding_scenario
      data['rooms']['reception']['npcs'] = [
        { 'id' => 'ruth', 'displayName' => 'Ruth', 'npcType' => 'phone',
          'eventMappings' => [{ 'eventPattern' => 'npc_used:kieran_laptop', 'onceOnly' => true,
                                'addCapture' => { 'targetId' => 'staff_wifi_key', 'kind' => 'credential',
                                                  'address' => 'Ledgerwell-Staff', 'secret' => PSK,
                                                  'proof' => { 'planted' => 'kit_rogue_ap' } } }] }
      ]
      data
    end

    def setup_game(data = scenario)
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user), scenario: data,
        player_state: { 'currentRoom' => 'reception', 'unlockedRooms' => ['reception'] }
      )
    end

    def hide(spot, item: 'kit_rogue_ap')
      post "/break_escape/games/#{@game.id}/inventory", params: { action_type: 'hide', item: { id: item }, hidden_in: spot }, as: :json
      response.parsed_body
    end

    def held_ids
      Array(@game.reload.player_state['inventory']).map { |i| i['id'] }
    end

    def bootstrap
      get "/break_escape/games/#{@game.id}/scenario", as: :json
      assert_response :success
      response.parsed_body
    end

    def secrets
      get "/break_escape/games/#{@game.id}/capture_secrets", as: :json
      response.parsed_body['secrets'] || {}
    end

    test 'hide answers 200 with the entry, removes the kit, and the same request again answers the same' do
      setup_game
      body = hide('pot_a')
      assert_response :success
      assert_equal({ 'item' => 'kit_rogue_ap', 'on' => 'pot_a', 'room' => 'reception' }, body['hidden'])
      refute_includes held_ids, 'kit_rogue_ap'
      again = hide('pot_a')
      assert_response :success
      assert_equal body['hidden'], again['hidden']
      assert_equal 1, @game.reload.player_state['plantedItems'].size
    end

    test 'a refusal answers 422 with reason and message, and the item stays' do
      setup_game
      body = hide('pot_b')
      assert_response :unprocessable_entity
      assert_equal 'not_a_spot', body['reason']
      assert_equal 'That is not a hiding spot for it.', body['message']
      assert_includes held_ids, 'kit_rogue_ap'
      assert_empty Array(@game.reload.player_state['plantedItems'])
      hide('x' * 200)
      assert_response :unprocessable_entity
      hide('comms_plant-large6_1')
      assert_response :unprocessable_entity
      hide('reception_notes_plantlog1_9')
      assert_response :unprocessable_entity
    end

    test 'already_hidden on another spot carries the existing entry' do
      setup_game
      hide('pot_a')
      body = hide(DECOR_ID)
      assert_response :unprocessable_entity
      assert_equal 'already_hidden', body['reason']
      assert_equal 'pot_a', body['hidden']['on']
    end

    test 'the bootstrap carries hideables and hiddenDevices, never plantedItems, before and after a hide' do
      setup_game
      before = bootstrap
      defn = before['hideables']['kit_rogue_ap']
      assert_equal ['reception'], defn['rooms']
      refute defn.key?('deviceData'), 'the console fields ride on the room answer, not the bootstrap'
      refute defn.key?('onHidden')
      assert_equal [], before['hiddenDevices']
      refute before.key?('plantedItems')
      refute before.dig('playerState', 'plantedItems') if before['playerState']
      hide('pot_a')
      after = bootstrap
      assert_equal [{ 'item' => 'kit_rogue_ap', 'on' => 'pot_a', 'room' => 'reception' }], after['hiddenDevices']
      assert after['hideables'].key?('kit_rogue_ap')
      refute after.key?('plantedItems')
    end

    test 'a hide that empties the inventory does not offer the hidden start item again' do
      setup_game
      @game.player_state['inventory'] = [kit_entry]
      @game.save!
      hide('pot_a')
      assert_empty held_ids
      assert_empty(Array(bootstrap['startItemsInInventory']).select { |i| i['id'] == 'kit_rogue_ap' })
    end

    test 'the staff key is withheld before the hide and served after it, from any plant' do
      [['pot_a'], [DECOR_ID], ['bin_a']].each do |(spot)|
        setup_game
        captures = { 'staff_wifi_key' => { 'targetId' => 'staff_wifi_key', 'kind' => 'credential', 'address' => 'Ledgerwell-Staff', 'at' => 1 } }
        put "/break_escape/games/#{@game.id}/sync_state", params: { globalVariables: { 'se_captures' => captures } }, as: :json
        refute secrets.key?('staff_wifi_key'), 'served before the hide'
        hide(spot)
        assert_equal PSK, secrets['staff_wifi_key'], "served after a hide on #{spot}"
      end
    end

    test 'no hide is possible outside the allowed room' do
      setup_game
      @game.player_state['unlockedRooms'] << 'comms'
      @game.save!
      hide('comms_pot')
      assert_response :unprocessable_entity
      assert_empty Array(@game.reload.player_state['plantedItems'])
    end

    test 'another player cannot hide a device into a game they do not own (refused as /objectives is)' do
      setup_game
      theirs = create_access_game(
        mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:other_user), scenario: scenario,
        player_state: { 'currentRoom' => 'reception', 'unlockedRooms' => ['reception'],
                        'inventory' => [{ 'id' => 'kit_rogue_ap', 'type' => 'rogue_ap', 'name' => 'Kit' }] }
      )
      before = theirs.reload.player_state.deep_dup
      get "/break_escape/games/#{theirs.id}/objectives", as: :json
      expected = [response.status, response.body]
      refute_equal 200, expected.first
      post "/break_escape/games/#{theirs.id}/inventory",
           params: { action_type: 'hide', item: { id: 'kit_rogue_ap' }, hidden_in: 'pot_a' }, as: :json
      assert_equal expected, [response.status, response.body]
      state = theirs.reload.player_state
      assert_equal before, state, 'their game is unchanged'
      assert_empty Array(state['plantedItems'])
      assert_equal ['kit_rogue_ap'], Array(state['inventory']).map { |i| i['id'] }
    end

    test 'sync_state accepts nothing new for plantedItems' do
      setup_game
      put "/break_escape/games/#{@game.id}/sync_state",
          params: { plantedItems: [{ item: 'kit_rogue_ap', on: 'pot_a' }], hiddenDevices: [{ item: 'kit_rogue_ap', on: 'pot_a' }] }, as: :json
      assert_empty Array(@game.reload.player_state['plantedItems'])
    end
  end
end
