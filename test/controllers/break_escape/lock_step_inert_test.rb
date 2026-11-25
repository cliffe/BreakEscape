require 'test_helper'

module BreakEscape
  # S8c unit 14: the controller's share of a second step on any lock. A scenario with no
  # `secondStep` answers every route as before; on one with a step, a lock is never opened
  # without a passed record, and the exits refuse a gated object as an invented id.
  # (The detailed answer tables are unit 15's.)
  class LockStepInertTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    GENERIC = { 'success' => false, 'message' => 'Incorrect username or password' }.freeze

    def scenario(second_step: false)
      safe = { 'type' => 'safe', 'id' => 'safe1', 'name' => 'Safe', 'locked' => true, 'lockType' => 'pin',
               'requires' => '1234',
               'contents' => [{ 'type' => 'notes', 'id' => 'n1', 'name' => 'Notes', 'takeable' => true }] }
      safe['secondStep'] = { 'kind' => 'push', 'owner' => 'amy' } if second_step
      inner = { 'type' => 'box', 'id' => 'box1', 'name' => 'Box', 'locked' => true, 'lockType' => 'pin',
                'requires' => '5555', 'contents' => [{ 'type' => 'notes', 'id' => 'n2', 'name' => 'Deep', 'takeable' => true }] }
      safe['contents'] << inner
      plain = { 'type' => 'safe', 'id' => 'plain1', 'name' => 'Plain', 'locked' => true, 'lockType' => 'pin',
                'requires' => '4321', 'contents' => [{ 'type' => 'notes', 'id' => 'n3', 'name' => 'Plain note', 'takeable' => true }] }
      vault = { 'type' => 'room_office', 'locked' => true, 'lockType' => 'pin', 'requires' => '9999',
                'connections' => { 'south' => 'hall' }, 'objects' => [] }
      vault['secondStep'] = { 'kind' => 'code', 'owner' => 'amy' } if second_step
      { 'startRoom' => 'hall',
        'rooms' => { 'hall' => { 'type' => 'room_office', 'connections' => { 'north' => 'vault' }, 'objects' => [safe, plain] },
                     'vault' => vault } }
    end

    def build(second_step: false, state: {})
      @game = Game.create!(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                           scenario_data: scenario(second_step: second_step),
                           player_state: { 'currentRoom' => 'hall', 'unlockedRooms' => ['hall'], 'inventory' => [] }.merge(state))
    end

    def game_path(suffix)
      "/break_escape/games/#{@game.id}/#{suffix}"
    end

    def container_path(id)
      game_path("container/#{id}")
    end

    def unlock(id, attempt, method: 'pin', type: 'object')
      post game_path('unlock'), params: { targetType: type, targetId: id, attempt: attempt, method: method }, as: :json
    end

    def passed_record(kind, id)
      { "#{kind}:#{id}" => { 'id' => "#{kind}:#{id}", 'kind' => 'push', 'n' => 0, 'tries' => 0, 'nonce' => 1,
                             'at' => 0, 'npcId' => 'amy', 'passed' => true } }
    end

    # ---- no secondStep anywhere ----

    test 'with no secondStep a pin lock opens and the container answers as before' do
      build
      unlock('safe1', '1234')
      assert_response :success, response.body
      assert_equal %w[n1 box1], response.parsed_body['contents'].map { |c| c['id'] }
      assert_includes @game.reload.player_state['unlockedObjects'], 'safe1'
      get container_path('safe1')
      assert_response :success
      unlock('safe1', '0000')
      assert_response :success
    end

    test 'with no secondStep a wrong pin is the old refusal' do
      build
      unlock('safe1', '0000')
      assert_response :unprocessable_entity
      assert_equal({ 'success' => false, 'message' => 'Invalid attempt' }, response.parsed_body)
    end

    test 'the lock form of the mfa routes on a game with no step is a 404 or a no-phone 403' do
      build
      post game_path('mfa/verify'), params: { target_type: 'object', target_id: 'safe1', code: '123456' }, as: :json
      assert_response :not_found
      assert_equal({ 'success' => false, 'error' => 'not found' }, response.parsed_body)
      assert_equal 'no-store', response.headers['Cache-Control']
      post game_path('mfa/prompt'), params: { target_type: 'door', target_id: 'vault' }, as: :json
      assert_response :not_found
      post game_path('mfa/approve'), params: { target_type: 'object', target_id: 'safe1', number: 12 }, as: :json
      assert_response :not_found
      get game_path('mfa/phone'), params: { npc_id: 'amy', target_type: 'object', target_id: 'safe1' }
      assert_response :forbidden
      assert_equal({ 'success' => false, 'error' => 'no such phone' }, response.parsed_body)
      assert_equal 'no-store', response.headers['Cache-Control']
    end

    test 'both forms, neither, or a bad target are the generic refusal' do
      build
      [
        { pc_id: 'pc1', target_type: 'object', target_id: 'safe1' },
        { pc_id: 'pc1', target_type: 'object' },
        { target_type: 'object' },
        { target_id: 'safe1' },
        { target_type: 'room', target_id: 'safe1' },
        { target_type: 'object', target_id: '' },
        { target_type: %w[object], target_id: 'safe1' },
        {}
      ].each do |body|
        %w[verify prompt approve].each do |route|
          post game_path("mfa/#{route}"), params: body, as: :json
          assert_response :unprocessable_entity, "#{route} #{body}"
          assert_equal GENERIC, response.parsed_body
          assert_equal 'no-store', response.headers['Cache-Control']
        end
      end
    end

    test 'the phone route without a target is unchanged' do
      build
      get game_path('mfa/phone'), params: { npc_id: 'amy' }
      assert_response :forbidden
      assert_equal({ 'success' => false, 'error' => 'no such phone' }, response.parsed_body)
    end

    # ---- with a step ----

    test 'a right first factor never opens a gated object without a passed step' do
      build(second_step: true)
      unlock('safe1', '1234')
      assert_not_equal true, response.parsed_body['success'] if response.successful?
      assert_nil response.parsed_body['contents']
      assert_nil response.parsed_body['roomData']
      assert_not_includes Array(@game.reload.player_state['unlockedObjects']), 'safe1'
    end

    test 'a right first factor never opens a gated door without a passed step' do
      build(second_step: true)
      unlock('vault', '9999', type: 'door')
      assert_nil response.parsed_body['roomData']
      assert_not_includes @game.reload.player_state['unlockedRooms'], 'vault'
    end

    test 'a wrong first factor on a gated object is today refusal byte for byte' do
      build(second_step: true)
      unlock('safe1', '0000')
      assert_response :unprocessable_entity
      assert_equal({ 'success' => false, 'message' => 'Invalid attempt' }, response.parsed_body)
    end

    test 'a passed step opens the object, returns its contents and deletes the record' do
      build(second_step: true, state: { 'lockSteps' => passed_record('object', 'safe1') })
      unlock('safe1', '1234')
      assert_response :success, response.body
      assert_equal true, response.parsed_body['success']
      assert_equal %w[n1 box1], response.parsed_body['contents'].map { |c| c['id'] }
      state = @game.reload.player_state
      assert_includes state['unlockedObjects'], 'safe1'
      assert_nil state['lockSteps']['object:safe1']
    end

    test 'a passed step opens the door and deletes the record' do
      build(second_step: true, state: { 'lockSteps' => passed_record('door', 'vault') })
      unlock('vault', '9999', type: 'door')
      assert_response :success, response.body
      assert_equal true, response.parsed_body['success']
      state = @game.reload.player_state
      assert_includes state['unlockedRooms'], 'vault'
      assert_nil state['lockSteps']['door:vault']
    end

    test 'a passed record for one lock opens no other' do
      build(second_step: true, state: { 'lockSteps' => passed_record('object', 'safe1') })
      unlock('vault', '9999', type: 'door')
      assert_not_includes @game.reload.player_state['unlockedRooms'], 'vault'
    end

    test 'an object below a closed step is refused as an invented id and writes nothing' do
      build(second_step: true)
      unlock('box1', '5555')
      assert_response :unprocessable_entity
      assert_equal({ 'success' => false, 'message' => 'Invalid attempt' }, response.parsed_body)
      invented = response.parsed_body
      unlock('no_such_box', '5555')
      assert_equal invented, response.parsed_body
      assert_not_includes Array(@game.reload.player_state['unlockedObjects']), 'box1'
    end

    test 'a child of a gated container that has not passed cannot be opened by id or name, and no answer holds its contents' do
      build(second_step: true)
      ['box1', 'Box'].each do |ref|
        unlock(ref, '5555')
        assert_response :unprocessable_entity
        assert_equal({ 'success' => false, 'message' => 'Invalid attempt' }, response.parsed_body)
        assert_not_includes response.body, 'Deep'
      end
      unlock('hall_safe_0', '1234') # the generated id of the gated container itself
      assert_nil response.parsed_body['contents']
      assert_not_includes response.body, 'Deep'
      state = @game.reload.player_state
      assert_not_includes Array(state['unlockedObjects']), 'box1'
      assert_not_includes Array(state['unlockedObjects']), 'Box'
      assert_not_includes Array(state['unlockedObjects']), 'safe1'
    end

    test 'an object below an open step opens as before' do
      build(second_step: true, state: { 'unlockedObjects' => ['safe1'] })
      unlock('box1', '5555')
      assert_response :success, response.body
      assert_equal ['n2'], response.parsed_body['contents'].map { |c| c['id'] }
    end

    test 'an ungated object in a game with a step opens as before' do
      build(second_step: true)
      unlock('plain1', '4321')
      assert_response :success, response.body
      assert_equal ['n3'], response.parsed_body['contents'].map { |c| c['id'] }
      assert_includes @game.reload.player_state['unlockedObjects'], 'plain1'
    end

    test 'GET container refuses a gated object not open and anything below it, as an invented id' do
      build(second_step: true, state: { 'unlockedObjects' => ['box1'] })
      get container_path('safe1')
      assert_response :not_found
      get container_path('box1')
      assert_response :not_found
      body = response.parsed_body
      get container_path('no_such_box')
      assert_equal body.keys, response.parsed_body.keys
    end

    test 'GET container serves a gated object once its step has opened it' do
      build(second_step: true, state: { 'unlockedObjects' => %w[safe1 box1] })
      get container_path('safe1')
      assert_response :success
      get container_path('box1')
      assert_response :success
    end

    test 'taking an item from below a closed step reads as an invented item' do
      build(second_step: true, state: { 'unlockedObjects' => ['box1'], 'encounteredNPCs' => [] })
      post game_path('inventory'), params: { action_type: 'add', item: { type: 'notes', id: 'n2', name: 'Deep' } }, as: :json
      assert_response :unprocessable_entity
      assert_empty @game.reload.player_state['inventory']
    end

    test 'taking an item from below an open step works' do
      build(second_step: true, state: { 'unlockedObjects' => %w[safe1 box1] })
      post game_path('inventory'), params: { action_type: 'add', item: { type: 'notes', id: 'n1', name: 'Notes' } }, as: :json
      assert_response :success, response.body
      assert_equal ['n1'], @game.reload.player_state['inventory'].map { |i| i['id'] }
    end
  end
end
