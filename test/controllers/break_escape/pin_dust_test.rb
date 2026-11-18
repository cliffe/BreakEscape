require 'test_helper'

module BreakEscape
  # Dusting a PIN pad with the fingerprint kit (PinDust). Every state is reached through the
  # real requests a player can send: inventory add, POST pin_dust, sync_state. The PIN must
  # never be in an answer; the digit set is, once, for a PIN lock, with a real kit held.
  class PinDustTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    KIT = { 'type' => 'fingerprint_kit', 'id' => 'kit', 'name' => 'Fingerprint kit', 'takeable' => true }.freeze

    def scenario
      {
        'scenario_brief' => 'PIN dust fixture',
        'startRoom' => 'office',
        'rooms' => {
          'office' => {
            'type' => 'room_office',
            'connections' => { 'north' => 'vault' },
            'objects' => [
              KIT.dup,
              { 'type' => 'safe', 'id' => 'wall_safe', 'name' => 'Wall safe', 'locked' => true,
                'lockType' => 'pin', 'requires' => '4774', 'dustHint' => 'Worn keys, three of them.' },
              { 'type' => 'safe', 'id' => 'clean_safe', 'name' => 'Clean safe', 'locked' => true,
                'lockType' => 'pin', 'requires' => '1357', 'dustable' => false },
              { 'type' => 'safe', 'id' => 'key_safe', 'name' => 'Key safe', 'locked' => true,
                'lockType' => 'key', 'requires' => 'k1' },
              { 'type' => 'notes', 'id' => 'memo', 'name' => 'Memo', 'takeable' => true }
            ]
          },
          'vault' => {
            'type' => 'room_office', 'locked' => true, 'lockType' => 'pin', 'requires' => '0602',
            'connections' => { 'south' => 'office' }, 'objects' => []
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

    def take_kit
      post path('inventory'), params: { action_type: 'add', item: KIT.slice('type', 'id', 'name') }, as: :json
      assert_response :success, response.body
    end

    def dust(type, id, apply = true)
      post path('pin_dust'), params: { targetType: type, targetId: id, apply: apply }, as: :json
      response.parsed_body
    end

    test 'a held kit dusts a PIN item: the distinct digits, sorted, and nothing else' do
      take_kit
      body = dust('object', 'wall_safe')
      assert_response :success
      assert_equal true, body['dusted']
      assert_equal %w[4 7], body['digits']
      assert_equal 'Worn keys, three of them.', body['hint']
      assert_not_includes response.body, '4774'
    end

    test 'a held kit dusts a PIN door' do
      take_kit
      body = dust('door', 'vault')
      assert_response :success
      assert_equal %w[0 2 6], body['digits']
      assert_not_includes response.body, '0602'
    end

    test 'no kit, no digits' do
      body = dust('object', 'wall_safe')
      assert_response :forbidden
      assert_equal 'no_kit', body['reason']
      assert_nil body['digits']
      assert_nil @game.reload.player_state['pinDusted'].presence
    end

    test 'a kit the client made up does not count' do
      post path('inventory'), params: { action_type: 'add', item: { type: 'fingerprint_kit', id: 'made_up', name: 'Kit' } }, as: :json
      dust('object', 'wall_safe')
      assert_response :forbidden
    end

    test 'a lock that opts out with dustable false is not dusted' do
      take_kit
      body = dust('object', 'clean_safe')
      assert_response :unprocessable_entity
      assert_equal 'not_dustable', body['reason']
      assert_nil body['digits']
    end

    test 'only a PIN lock can be dusted; other locks and invented ids answer the same' do
      take_kit
      dust('object', 'key_safe')
      assert_response :not_found
      key_answer = response.body
      dust('object', 'no_such_thing')
      assert_response :not_found
      assert_equal key_answer, response.body
      dust('door', 'office')
      assert_response :not_found
      dust('widget', 'wall_safe')
      assert_response :not_found
    end

    test 'it is one time per lock and persists: a second ask and a peek give the same record' do
      take_kit
      dust('object', 'wall_safe')
      again = dust('object', 'wall_safe')
      assert_equal %w[4 7], again['digits']
      assert_equal({ 'object:wall_safe' => '47' }, @game.reload.player_state['pinDusted'])
      peek = dust('object', 'wall_safe', false)
      assert_equal true, peek['dusted']
      assert_equal %w[4 7], peek['digits']
    end

    test 'a peek tells nothing about a lock that was never dusted' do
      take_kit
      body = dust('object', 'wall_safe', false)
      assert_response :success
      assert_equal({ 'success' => true, 'dusted' => false }, body)
      body = dust('object', 'key_safe', false)
      assert_equal false, body['dusted']
    end

    test 'sync_state cannot write or clear the dust record, and the record is not a growing list' do
      take_kit
      dust('object', 'wall_safe')
      dust('door', 'vault')
      put path('sync_state'), params: { pinDusted: { 'object:clean_safe' => '1357' }, globalVariables: { 'x' => 1 } }, as: :json
      assert_response :success
      assert_equal({ 'object:wall_safe' => '47', 'door:vault' => '026' }, @game.reload.player_state['pinDusted'])
      peek = dust('object', 'clean_safe', false)
      assert_equal false, peek['dusted']
    end

    test 'the scenario bootstrap carries no dust record or digits' do
      take_kit
      dust('object', 'wall_safe')
      get path('scenario'), as: :json
      assert_response :success
      assert_not_includes response.body, 'pinDusted'
      assert_not_includes response.body, '4774'
    end

    test 'dusting does not open the lock or reveal the order' do
      take_kit
      dust('object', 'wall_safe')
      assert_not @game.reload.object_unlocked?('wall_safe')
      post path('unlock'), params: { targetType: 'object', targetId: 'wall_safe', attempt: '7447', method: 'pin' }, as: :json
      assert_response :unprocessable_entity
    end
  end
end
