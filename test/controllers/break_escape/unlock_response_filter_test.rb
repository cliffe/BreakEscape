require 'test_helper'

# Declared-grants review R1, M7: POST /unlock returned a container's contents
# straight from scenario_data, so a nested locked container's password (and its
# own contents) reached the client before that inner lock was opened. The
# response is now filtered the way GET /container filters it.
module BreakEscape
  class UnlockResponseFilterTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    INNER_PASSWORD = 'Sofia2026!'.freeze

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @owner   = break_escape_demo_users(:test_user)
      @game = Game.create!(mission: @mission, player: @owner, scenario_data: scenario, player_state: state)
    end

    def unlock(target_id, attempt, method)
      post unlock_game_url(@game), params: { targetType: 'object', targetId: target_id, attempt: attempt, method: method }, as: :json
    end

    test 'a wrong PIN on the outer safe returns no contents' do
      unlock('outer_safe', '0000', 'pin')

      assert_response :unprocessable_entity
      assert_nil response.parsed_body['contents']
      refute_includes response.body, INNER_PASSWORD
    end

    test 'opening the outer safe lists the inner box without its password or contents' do
      unlock('outer_safe', '1111', 'pin')

      assert_response :success, response.body
      contents = response.parsed_body['contents']
      assert_equal %w[memo inner_box], contents.map { |c| c['id'] }

      inner = contents.find { |c| c['id'] == 'inner_box' }
      assert inner['locked']
      assert_equal 'password', inner['lockType']
      assert inner['hasContents'], 'still marked as a container so the client fetches it once open'
      refute inner.key?('requires')
      refute inner.key?('contents')
      refute_includes response.body, INNER_PASSWORD
      refute_includes response.body, 'secret_doc'
    end

    test 'the inner box opens with its password and then returns its contents' do
      unlock('outer_safe', '1111', 'pin')
      assert_response :success

      unlock('inner_box', 'wrong', 'password')
      assert_response :unprocessable_entity
      refute_includes response.body, 'secret_doc'

      unlock('inner_box', INNER_PASSWORD, 'password')
      assert_response :success, response.body
      assert_equal ['secret_doc'], response.parsed_body['contents'].map { |c| c['id'] }
    end

    test 'an item already held is left out of the unlock response, as GET /container does' do
      @game.player_state['inventory'] = [{ 'type' => 'notes', 'id' => 'memo', 'name' => 'Memo' }]
      @game.save!

      unlock('outer_safe', '1111', 'pin')
      assert_response :success
      assert_equal ['inner_box'], response.parsed_body['contents'].map { |c| c['id'] }
    end

    private

    def scenario
      {
        'startRoom' => 'lobby',
        'rooms' => {
          'lobby' => {
            'type' => 'room_office', 'locked' => false, 'connections' => {},
            'objects' => [
              {
                'type' => 'safe', 'id' => 'outer_safe', 'name' => 'Safe',
                'locked' => true, 'lockType' => 'pin', 'requires' => '1111',
                'contents' => [
                  { 'type' => 'notes', 'id' => 'memo', 'name' => 'Memo', 'takeable' => true },
                  {
                    'type' => 'briefcase', 'id' => 'inner_box', 'name' => 'Archive',
                    'locked' => true, 'lockType' => 'password', 'requires' => INNER_PASSWORD,
                    'contents' => [{ 'type' => 'notes', 'id' => 'secret_doc', 'name' => 'Secret', 'takeable' => true }]
                  }
                ]
              }
            ]
          }
        }
      }
    end

    def state
      {
        'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'], 'unlockedObjects' => [], 'inventory' => [],
        'encounteredNPCs' => [], 'globalVariables' => {}, 'notes' => [], 'health' => 100,
        'objectivesState' => { 'tasks' => {}, 'aims' => {} }
      }
    end
  end
end
