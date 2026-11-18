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
                'lockType' => 'pin', 'requires' => '4774', 'dustable' => true,
                'dustHint' => 'Worn keys, two of them.' },
              { 'type' => 'safe', 'id' => 'plain_safe', 'name' => 'Plain safe', 'locked' => true,
                'lockType' => 'pin', 'requires' => '2580' },
              { 'type' => 'safe', 'id' => 'clean_safe', 'name' => 'Clean safe', 'locked' => true,
                'lockType' => 'pin', 'requires' => '1357', 'dustable' => false },
              { 'type' => 'safe', 'id' => 'key_safe', 'name' => 'Key safe', 'locked' => true,
                'lockType' => 'key', 'requires' => 'k1' },
              { 'type' => 'notes', 'id' => 'memo', 'name' => 'Memo', 'takeable' => true },
              # A sign-in PC the player has no session for, with a dustable PIN safe inside it
              { 'type' => 'pc', 'id' => 'locked_pc', 'name' => 'Locked PC', 'locked' => true, 'lockType' => 'login',
                'contents' => [
                  { 'type' => 'safe', 'id' => 'pc_safe', 'name' => 'PC safe', 'locked' => true,
                    'lockType' => 'pin', 'requires' => '9182', 'dustable' => true }
                ] }
            ]
          },
          'vault' => {
            'type' => 'room_office', 'locked' => true, 'lockType' => 'pin', 'requires' => '0602', 'dustable' => true,
            'connections' => { 'south' => 'office' }, 'objects' => []
          },
          'annex' => {
            'type' => 'room_office', 'connections' => { 'south' => 'office' },
            'objects' => [
              { 'type' => 'safe', 'id' => 'annex_safe', 'name' => 'Annex safe', 'locked' => true,
                'lockType' => 'pin', 'requires' => '6403', 'dustable' => true }
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
        player_state: { 'currentRoom' => 'office', 'unlockedRooms' => ['office'], 'npcRouteRooms' => ['annex'] }
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
      assert_equal 'Worn keys, two of them.', body['hint']
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

    test 'a lock that sets dustable false is not dusted' do
      take_kit
      body = dust('object', 'clean_safe')
      assert_response :unprocessable_entity
      assert_equal 'not_dustable', body['reason']
      assert_nil body['digits']
    end

    test 'dust is opt-in: a PIN lock with no dustable key is refused too' do
      take_kit
      body = dust('object', 'plain_safe')
      assert_response :unprocessable_entity
      assert_equal 'not_dustable', body['reason']
      assert_nil body['digits']
      assert_nil @game.reload.player_state['pinDusted'].presence
      assert_equal false, dust('object', 'plain_safe', false)['dusted']
    end

    test 'the bootstrap room whitelist carries dustable and dustHint for a door, and not the PIN' do
      @game.scenario_data['rooms']['vault']['dustHint'] = 'Vault keys are worn.'
      @game.save!
      get path('scenario'), as: :json
      assert_response :success
      vault = response.parsed_body.dig('rooms', 'vault')
      assert_equal true, vault['dustable']
      assert_equal 'Vault keys are worn.', vault['dustHint']
      assert_not_includes response.body, '0602'
    end

    # --- scope gates: sign-in scope and unearned route room (review R1 M3) ---

    test 'an object under a sign-in PC with no session answers as an invented id and records nothing' do
      take_kit
      dust('object', 'no_such_thing')
      assert_response :not_found
      invented = response.body
      dust('object', 'pc_safe')
      assert_response :not_found
      assert_equal invented, response.body
      assert_nil @game.reload.player_state['pinDusted'].presence
      assert_equal({ 'success' => true, 'dusted' => false }, dust('object', 'pc_safe', false))
    end

    test 'an object in an unearned route room answers as an invented id and records nothing' do
      take_kit
      dust('object', 'no_such_thing')
      invented = response.body
      dust('object', 'annex_safe')
      assert_response :not_found
      assert_equal invented, response.body
      assert_nil @game.reload.player_state['pinDusted'].presence
      assert_equal false, dust('object', 'annex_safe', false)['dusted']
    end

    test 'once the route room is earned the object dusts, and demotion hides the record again' do
      take_kit
      @game.reload.player_state['unlockedRooms'] = %w[office annex]
      @game.save!
      assert_equal %w[0 3 4 6], dust('object', 'annex_safe')['digits']
      @game.reload.player_state['unlockedRooms'] = ['office']
      @game.save!
      assert_equal false, dust('object', 'annex_safe', false)['dusted']
    end

    test 'refused and invented asks leave pinDusted unchanged' do
      take_kit
      dust('object', 'wall_safe')
      before = @game.reload.player_state['pinDusted'].deep_dup
      %w[clean_safe plain_safe key_safe pc_safe annex_safe no_such_thing].each { |id| dust('object', id) }
      dust('door', 'office')
      dust('door', 'nowhere')
      assert_equal before, @game.reload.player_state['pinDusted']
    end

    # --- hostile input and growth (review R1 m6) ---

    test 'hostile ids never create a record or an error' do
      take_kit
      [{ 'a' => 'b' }, %w[wall_safe x], 'x' * 5000, '', "wall_safe\u0000", '../../etc/passwd'].each do |bad|
        post path('pin_dust'), params: { targetType: 'object', targetId: bad, apply: true }, as: :json
        assert_includes [404, 400], response.status, "#{bad.inspect[0, 40]} gave #{response.status}"
      end
      assert_nil @game.reload.player_state['pinDusted'].presence
      # A non-string type reads as an object, never a 500
      post path('pin_dust'), params: { targetType: { 'x' => 1 }, targetId: 'wall_safe', apply: true }, as: :json
      assert_not_equal 500, response.status
    end

    test 'apply must be a real true: strings, numbers and a missing apply are only a peek' do
      take_kit
      ['true ', 'yes', '1', 2, 0, nil, 'false'].each do |apply|
        params = { targetType: 'object', targetId: 'wall_safe' }
        params[:apply] = apply unless apply.nil?
        post path('pin_dust'), params: params, as: :json
        assert_response :success
        assert_equal false, response.parsed_body['dusted'], "apply #{apply.inspect} must not dust"
      end
      assert_nil @game.reload.player_state['pinDusted'].presence
      post path('pin_dust'), params: { targetType: 'object', targetId: 'wall_safe', apply: 'true' }, as: :json
      assert_equal true, response.parsed_body['dusted']
    end

    test 'the record is keyed by the canonical lock id, so aliases share one record and growth is bounded' do
      take_kit
      dust('object', 'wall_safe')
      dust('object', 'Wall safe')
      dust('item', 'wall_safe')
      records = @game.reload.player_state['pinDusted']
      assert_equal({ 'object:wall_safe' => '47' }, records)
      50.times { |i| dust('object', "invented_#{i}") }
      assert_equal 1, @game.reload.player_state['pinDusted'].size
      assert_operator @game.player_state['pinDusted'].to_json.bytesize, :<, 200
    end

    test "another player's game: the ask is refused and nothing is recorded" do
      other = create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:other_user),
                                 scenario: scenario, player_state: { 'currentRoom' => 'office', 'unlockedRooms' => ['office'],
                                                                      'inventory' => [KIT.dup] })
      post "/break_escape/games/#{other.id}/pin_dust", params: { targetType: 'object', targetId: 'wall_safe', apply: true }, as: :json
      refute response.successful?, 'a game the player does not own is never dusted'
      assert_nil other.reload.player_state['pinDusted'].presence
      post "/break_escape/games/#{other.id}/pin_dust", params: { targetType: 'object', targetId: 'wall_safe', apply: false }, as: :json
      refute response.successful?
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
    end

    test 'the client sends item for a safe: it dusts as an object and shares its record' do
      take_kit
      body = dust('item', 'wall_safe')
      assert_response :ok
      assert_equal %w[4 7], body['digits']
      peek = dust('object', 'wall_safe', false)
      assert_equal %w[4 7], peek['digits']
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
