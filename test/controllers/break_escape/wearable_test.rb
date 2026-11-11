require 'test_helper'

module BreakEscape
  # Wearable items (docs/achitechture/WEARABLE_BUILD_LOG.md). Every state is reached through the
  # real requests a player can send: inventory add and remove, a player drop, sync_state and
  # POST wear. A client never sets a worn global itself.
  class WearableTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    def vest(extra = {})
      { 'type' => 'hivis', 'id' => 'vest', 'name' => 'Hi-vis vest', 'takeable' => true, 'droppable' => true,
        'wearable' => { 'costume' => 'courier', 'global' => 'vest_on', 'unseenOnly' => true } }.merge(extra)
    end

    def coat
      { 'type' => 'coat', 'id' => 'coat', 'name' => 'Lab coat', 'takeable' => true,
        'wearable' => { 'costume' => 'doctor', 'global' => 'coat_on' } }
    end

    def scenario
      {
        'scenario_brief' => 'Wearable fixture',
        'startRoom' => 'office',
        'disguises' => { 'courier' => { 'sprite' => 'courier_hivis' }, 'doctor' => { 'sprite' => 'doctor' } },
        'globalVariables' => { 'vest_on' => false, 'coat_on' => false, 'pp_disguise' => '' },
        'rooms' => {
          'office' => {
            'type' => 'room_office',
            'objects' => [
              vest,
              coat,
              { 'type' => 'notes', 'id' => 'memo', 'name' => 'Memo', 'takeable' => true },
              { 'type' => 'hivis', 'id' => 'fake', 'name' => 'Fake vest', 'takeable' => true,
                'wearable' => { 'costume' => 'nobody', 'global' => 'fake_on' } }
            ]
          }
        }
      }
    end

    setup do
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: { 'currentRoom' => 'office', 'unlockedRooms' => ['office'] }
      )
    end

    def path(suffix)
      "/break_escape/games/#{@game.id}/#{suffix}"
    end

    def take(item)
      post path('inventory'), params: { action_type: 'add', item: item.slice('type', 'id', 'name') }, as: :json
      assert_response :success, response.body
    end

    def wear(item_id, worn = true)
      params = { worn: worn }
      params[:item_id] = item_id if item_id
      post path('wear'), params: params, as: :json
      response.parsed_body
    end

    def globals
      @game.reload.player_state['globalVariables']
    end

    test 'the game records the worn globals as server-owned' do
      assert_equal %w[coat_on fake_on vest_on], @game.player_state['wearableGlobals']
    end

    test 'putting on a held wearable writes its global and the costume on the server' do
      take(vest)
      body = wear('vest')
      assert_response :success
      assert_equal({ 'itemId' => 'vest', 'global' => 'vest_on', 'costume' => 'courier' }, body['worn'])
      assert_equal({ 'vest_on' => true, 'pp_disguise' => 'courier' }, body['globals'])
      assert_equal true, globals['vest_on']
      assert_equal 'courier', globals['pp_disguise']
    end

    test 'an item not held cannot be worn' do
      body = wear('vest')
      assert_response :unprocessable_entity
      assert_equal false, body['success']
      assert_nil @game.reload.player_state['worn']
      assert_not_equal true, globals['vest_on']
    end

    test 'a held item with no wearable cannot be worn' do
      take(scenario['rooms']['office']['objects'][2])
      wear('memo')
      assert_response :unprocessable_entity
    end

    test 'a wearable whose costume the scenario lacks is refused' do
      take(scenario['rooms']['office']['objects'][3])
      wear('fake')
      assert_response :unprocessable_entity
      assert_not_equal true, globals['fake_on']
    end

    test 'a client-made wearable field is not stored, so it cannot be worn' do
      post path('inventory'), params: { action_type: 'add', item: { type: 'hat', id: 'made_up', name: 'Hat',
                                                                    wearable: { costume: 'courier', global: 'hat_on' } } }, as: :json
      wear('made_up')
      assert_response :unprocessable_entity
      assert_not_equal true, globals['hat_on']
    end

    test 'sync_state cannot set a worn global' do
      put path('sync_state'), params: { globalVariables: { 'vest_on' => true, 'other' => 1 } }, as: :json
      assert_response :success
      assert_not_equal true, globals['vest_on']
      assert_equal 1, globals['other']
    end

    test 'sync_state cannot clear a worn global either' do
      take(vest)
      wear('vest')
      put path('sync_state'), params: { globalVariables: { 'vest_on' => false } }, as: :json
      assert_equal true, globals['vest_on']
    end

    test 'one at a time: wearing a second item takes the first off' do
      take(vest)
      take(coat)
      wear('vest')
      body = wear('coat')
      assert_equal 'coat', body['worn']['itemId']
      assert_equal({ 'vest_on' => false, 'coat_on' => true, 'pp_disguise' => 'doctor' }, body['globals'])
      assert_equal false, globals['vest_on']
      assert_equal true, globals['coat_on']
    end

    test 'taking off clears the record and the global' do
      take(vest)
      wear('vest')
      body = wear('vest', false)
      assert_response :success
      assert_nil body['worn']
      assert_equal false, globals['vest_on']
      assert_equal '', globals['pp_disguise']
    end

    test 'taking off with no item id takes off whatever is worn' do
      take(vest)
      wear('vest')
      wear(nil, false)
      assert_response :success
      assert_equal false, globals['vest_on']
    end

    test 'taking off a different item than the worn one is refused' do
      take(vest)
      take(coat)
      wear('vest')
      wear('coat', false)
      assert_response :unprocessable_entity
      assert_equal true, globals['vest_on']
    end

    test 'removing the worn item from the inventory takes it off' do
      take(vest)
      wear('vest')
      post path('inventory'), params: { action_type: 'remove', item: { id: 'vest' } }, as: :json
      assert_response :success
      assert_nil @game.reload.player_state['worn']
      assert_equal false, globals['vest_on']
      assert_equal '', globals['pp_disguise']
    end

    # Review R1, m3: the drop alone takes it off. No inventory remove is sent, so a client that
    # skips the remove cannot keep the costume or a held copy beside the floor copy.
    test 'dropping the worn item takes it off with no inventory remove' do
      take(vest)
      wear('vest')
      post path('update_room'), params: { roomId: 'office', actionType: 'add_object', sourceType: 'player_drop',
                                          data: { id: 'vest', type: 'hivis', name: 'Hi-vis vest', x: 10, y: 10 } }, as: :json
      assert_response :success, response.body
      state = @game.reload.player_state
      assert_nil state['worn']
      assert_equal false, globals['vest_on']
      assert_equal '', globals['pp_disguise']
      refute_includes Array(state['inventory']).map { |i| (i['scenarioData'] || i)['id'] }, 'vest'
      # The client's usual remove after the drop is a no-op now
      post path('inventory'), params: { action_type: 'remove', item: { id: 'vest' } }, as: :json
      assert_response :success
      # Picked up again, it is the server's copy, wearable field and all
      take(vest)
      wear('vest')
      assert_response :success, response.body
      assert_equal true, globals['vest_on']
    end

    test 'dropping another item leaves the worn one on' do
      take(vest)
      take(coat)
      wear('vest')
      @game.reload
      inv = @game.player_state['inventory'].find { |i| (i['scenarioData'] || i)['id'] == 'coat' }
      (inv['scenarioData'] || inv)['droppable'] = true
      @game.save!
      post path('update_room'), params: { roomId: 'office', actionType: 'add_object', sourceType: 'player_drop',
                                          data: { id: 'coat', type: 'coat', name: 'Lab coat', x: 10, y: 10 } }, as: :json
      assert_response :success, response.body
      assert_equal 'vest', @game.reload.player_state.dig('worn', 'itemId')
      assert_equal true, globals['vest_on']
    end

    test 'removing another item leaves the worn one on' do
      take(vest)
      take(coat)
      wear('vest')
      post path('inventory'), params: { action_type: 'remove', item: { id: 'coat' } }, as: :json
      assert_equal true, globals['vest_on']
      assert_equal 'vest', @game.reload.player_state.dig('worn', 'itemId')
    end

    test 'the bootstrap sends the worn item and the saved globals' do
      take(vest)
      wear('vest')
      get path('scenario'), as: :json
      assert_response :success
      body = response.parsed_body
      assert_equal 'vest', body.dig('wornItem', 'itemId')
      assert_equal true, body.dig('savedGlobalVariables', 'vest_on')
    end

    test 'a game made before wearables gets its worn globals on its first sync' do
      @game.player_state.delete('wearableGlobals')
      @game.save!
      put path('sync_state'), params: { globalVariables: { 'vest_on' => true } }, as: :json
      assert_response :success
      assert_equal %w[coat_on fake_on vest_on], @game.reload.player_state['wearableGlobals']
      assert_not_equal true, globals['vest_on']
    end

    # Review R1, m2: a game in progress at deploy has the worn global true (the old client wrote
    # it) and no worn record. Taking off with no record clears it.
    test 'taking off with no worn record clears a worn global left true' do
      @game.player_state['globalVariables'] = { 'vest_on' => true, 'pp_disguise' => 'courier' }
      @game.save!
      body = wear('vest', false)
      assert_response :success
      assert_equal({ 'vest_on' => false, 'pp_disguise' => '' }, body['globals'])
      assert_equal false, globals['vest_on']
      assert_equal '', globals['pp_disguise']
      # With nothing stuck it writes nothing
      assert_equal({}, wear(nil, false)['globals'])
    end

    test 'an older game with the worn global true and the item held becomes worn on its first sync' do
      take(vest)
      @game.reload
      @game.player_state.delete('wearableGlobals')
      @game.player_state['globalVariables'] = { 'vest_on' => true, 'pp_disguise' => 'courier' }
      @game.save!
      put path('sync_state'), params: { globalVariables: { 'vest_on' => true } }, as: :json
      assert_response :success
      assert_equal({ 'itemId' => 'vest', 'global' => 'vest_on', 'costume' => 'courier' }, @game.reload.player_state['worn'])
      assert_equal true, globals['vest_on']
      # So the locker's take_off works
      wear('vest', false)
      assert_equal false, globals['vest_on']
      assert_nil @game.reload.player_state['worn']
    end

    test 'an older game with the worn global true and the item not held is cleared on its first sync' do
      @game.player_state.delete('wearableGlobals')
      @game.player_state['globalVariables'] = { 'vest_on' => true, 'pp_disguise' => 'courier' }
      @game.save!
      put path('sync_state'), params: { globalVariables: {} }, as: :json
      assert_response :success
      assert_nil @game.reload.player_state['worn']
      assert_equal false, globals['vest_on']
      assert_equal '', globals['pp_disguise']
      wear(nil, false)
      assert_equal false, globals['vest_on']
    end

    # Review R1, n3: in a scenario with wearables only POST wear dresses the avatar
    test 'sync_state cannot write pp_disguise in a scenario with wearables' do
      take(vest)
      wear('vest')
      put path('sync_state'), params: { globalVariables: { 'pp_disguise' => 'doctor' } }, as: :json
      assert_response :success
      assert_equal 'courier', globals['pp_disguise']
    end

    test 'POST wear on another player\'s game is refused' do
      other = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:other_user),
        scenario: scenario,
        player_state: { 'currentRoom' => 'office', 'unlockedRooms' => ['office'],
                        'inventory' => [vest] }
      )
      post "/break_escape/games/#{other.id}/wear", params: { item_id: 'vest', worn: true }, as: :json
      assert_response :forbidden
      other.reload
      assert_nil other.player_state['worn']
      assert_not_equal true, other.player_state.dig('globalVariables', 'vest_on')
    end

    test 'wear without an item id is a bad request' do
      wear(nil, true)
      assert_response :bad_request
    end
  end
end

require_relative '../../support/network_model_scenario'

module BreakEscape
  # Review R1, m5: a worn device planted in a network jack comes off (NetworkAccess#plant_device!).
  class WearablePlantTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    def wearable_box_scenario
      data = NetworkModelScenario.scenario.deep_dup
      mark = lambda do |node|
        case node
        when Hash
          node['wearable'] = { 'costume' => 'tech', 'global' => 'box_worn' } if node['id'] == 'kit_dropbox'
          node.each_value { |v| mark.call(v) }
        when Array
          node.each { |v| mark.call(v) }
        end
      end
      mark.call(data)
      data['disguises'] = { 'tech' => { 'sprite' => 'tech' } }
      data['globalVariables'] = (data['globalVariables'] || {}).merge('box_worn' => false)
      data
    end

    test 'planting the worn device takes it off' do
      build_network_game({}, wearable_box_scenario)
      take_drop_box
      post game_path('wear'), params: { item_id: 'kit_dropbox', worn: true }, as: :json
      assert_response :success, response.body
      assert_equal true, @game.reload.player_state.dig('globalVariables', 'box_worn')
      body = plant('comms_port')
      assert_response :success, body.inspect
      state = @game.reload.player_state
      assert_nil state['worn']
      assert_equal false, state.dig('globalVariables', 'box_worn')
      assert_equal '', state.dig('globalVariables', 'pp_disguise')
    end
  end

  # Review R1, m5: the lab's real path. The hook's give_item is a declared grant; claiming it
  # keeps the wearable field, so POST wear puts the courier costume on and writes courier_ready.
  class WearableLabTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      mission = Mission.create!(name: 'lab_physical_pentest', display_name: 'Physical pentest', published: true, difficulty_level: 1)
      @game = Game.create!(mission: mission, player: break_escape_demo_users(:test_user)).reload
    end

    def path(suffix)
      "/break_escape/games/#{@game.id}/#{suffix}"
    end

    test 'the hi-vis vest is claimed from the hook, put on and taken off' do
      assert_equal %w[courier_ready], @game.player_state['wearableGlobals']
      post path('inventory'), params: { action_type: 'add',
                                        item: { type: 'aes_hivis_hook1', id: 'kit_hivis_vest', name: 'Hi-vis courier vest' } }, as: :json
      assert_response :success, response.body
      held = @game.reload.player_state['inventory'].find { |i| (i['scenarioData'] || i)['id'] == 'kit_hivis_vest' }
      assert held, 'the vest is held'
      assert_equal 'courier_ready', (held['scenarioData'] || held).dig('wearable', 'global'), 'the grant keeps the wearable field'

      post path('wear'), params: { item_id: 'kit_hivis_vest', worn: true }, as: :json
      assert_response :success, response.body
      globals = @game.reload.player_state['globalVariables']
      assert_equal true, globals['courier_ready']
      assert_equal 'courier', globals['pp_disguise']

      # The locker's take_off
      post path('wear'), params: { item_id: 'kit_hivis_vest', worn: false }, as: :json
      assert_response :success, response.body
      assert_equal false, @game.reload.player_state.dig('globalVariables', 'courier_ready')
    end

    test 'the lab has no other writer of courier_ready, in JSON or ink' do
      require BreakEscape::Engine.root.join('scripts', 'validate_wearable.rb').to_s
      dir = BreakEscape::Engine.root.join('scenarios', 'lab_physical_pentest').to_s
      issues = check_wearables(@game.scenario_data, dir)
      assert_empty issues.grep(/ERROR/), issues.join("\n")
    end
  end
end
