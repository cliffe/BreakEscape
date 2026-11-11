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

    test 'dropping the worn item takes it off' do
      take(vest)
      wear('vest')
      post path('update_room'), params: { roomId: 'office', actionType: 'add_object', sourceType: 'player_drop',
                                          data: { id: 'vest', type: 'hivis', name: 'Hi-vis vest', x: 10, y: 10 } }, as: :json
      assert_response :success, response.body
      post path('inventory'), params: { action_type: 'remove', item: { id: 'vest' } }, as: :json
      assert_equal false, globals['vest_on']
      # Picked up again, it is the server's copy, wearable field and all
      take(vest)
      wear('vest')
      assert_response :success, response.body
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

    test 'the bootstrap records the worn globals for a game that has none yet' do
      @game.player_state.delete('wearableGlobals')
      @game.save!
      get path('scenario'), as: :json
      assert_response :success
      assert_equal %w[coat_on fake_on vest_on], @game.reload.player_state['wearableGlobals']
    end

    test 'wear without an item id is a bad request' do
      wear(nil, true)
      assert_response :bad_request
    end
  end
end
