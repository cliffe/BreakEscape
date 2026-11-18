require 'test_helper'

module BreakEscape
  # complete_task for a submit_flags task decides from the server's own record of
  # flags this game submitted and had accepted, never from the request's
  # submittedFlags list (D144 review note n8).
  class SubmitFlagsTaskTrustTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    FLAG_ONE = 'flag{one}'.freeze
    FLAG_TWO = 'flag{two}'.freeze

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @owner   = break_escape_demo_users(:test_user) # current_player in standalone
      @other   = break_escape_demo_users(:other_user)
    end

    def scenario(target_flags)
      {
        'startRoom' => 'reception',
        'flags' => { 'target_vm' => { 'flag_1' => FLAG_ONE, 'flag_2' => FLAG_TWO } },
        'objectives' => [{
          'aimId' => 'aim_flags',
          'tasks' => [{ 'taskId' => 'task_flags', 'type' => 'submit_flags', 'targetFlags' => target_flags }]
        }],
        'rooms' => {
          'reception' => {
            'type' => 'room_reception',
            'objects' => [{
              'type' => 'flag-station', 'id' => 'station_a', 'name' => 'Station A',
              'acceptsVms' => ['target_vm'], 'flags' => ['target_vm:flag_1', 'target_vm:flag_2']
            }]
          }
        }
      }
    end

    def build_game(target_flags, player: @owner)
      Game.create!(mission: @mission, player: player, scenario_data: scenario(target_flags))
    end

    def complete(game, forged = nil)
      params = forged ? { submittedFlags: forged } : {}
      post complete_task_game_url(game, task_id: 'task_flags'), params: params
      JSON.parse(response.body)
    end

    def status(game)
      game.reload.player_state.dig('objectivesState', 'tasks', 'task_flags', 'status')
    end

    test 'a forged submittedFlags list equal to targetFlags does not complete the task' do
      game = build_game(['target_vm-flag1', 'target_vm-flag2'])
      score_before = game.reload.score

      body = complete(game, ['target_vm-flag1', 'target_vm-flag2'])

      assert_equal false, body['success'], body.inspect
      assert_not_equal 'completed', status(game)
      assert_equal score_before, game.reload.score
    end

    test 'a forged list for flag-reference targets is refused too' do
      game = build_game(['target_vm:flag_1'])

      body = complete(game, ['target_vm:flag_1'])

      assert_equal false, body['success'], body.inspect
      assert_not_equal 'completed', status(game)
    end

    test 'a client-written task submittedFlags (update_task_progress) does not complete it either' do
      game = build_game(['target_vm-flag1', 'target_vm-flag2'])
      put update_task_progress_game_url(game, task_id: 'task_flags'),
          params: { progress: 2, submittedFlags: ['target_vm-flag1', 'target_vm-flag2'] }
      assert_response :success

      body = complete(game, ['target_vm-flag1', 'target_vm-flag2'])

      assert_equal false, body['success'], body.inspect
      assert_not_equal 'completed', status(game)
    end

    test 'genuine path: flags accepted by /flags complete a multi-flag task' do
      game = build_game(['target_vm-flag1', 'target_vm-flag2'])

      post flags_game_url(game), params: { flag: FLAG_ONE, stationId: 'station_a' }, as: :json
      assert_response :success
      assert_not_equal 'completed', status(game)
      # One of two flags in: a forged full list still gets nothing.
      assert_equal false, complete(game, ['target_vm-flag1', 'target_vm-flag2'])['success']

      post flags_game_url(game), params: { flag: FLAG_TWO, stationId: 'station_a' }, as: :json
      assert_response :success
      assert_equal 'completed', status(game)
    end

    test 'genuine path: complete_task succeeds from the server record, whatever the client sends' do
      game = build_game(['target_vm-flag1'])
      # The server's record, as process_flag_task_completions! leaves it when a
      # response is lost before the task is marked complete.
      game.player_state['flag_task_matches'] = { 'task_flags' => ['target_vm-flag1'] }
      game.save!

      body = complete(game)

      assert_equal true, body['success'], body.inspect
      assert_equal 'completed', status(game)
    end

    test 'genuine path: a flag-reference target completes once the flag was really submitted' do
      game = build_game(['target_vm:flag_1'])
      assert game.submit_flag(FLAG_ONE)[:success]

      body = complete(game)

      assert_equal true, body['success'], body.inspect
      assert_equal 'completed', status(game)
    end

    test 'a second player cannot borrow flags another game submitted' do
      theirs = build_game(['target_vm:flag_1'], player: @other)
      assert theirs.submit_flag(FLAG_ONE)[:success]
      mine = build_game(['target_vm:flag_1'])

      body = complete(mine, ['target_vm:flag_1'])

      assert_equal false, body['success'], body.inspect
      assert_not_equal 'completed', status(mine)

      # And the other player's game is out of reach for this player.
      post complete_task_game_url(theirs, task_id: 'task_flags')
      assert_response :redirect
      assert_nil theirs.reload.player_state.dig('objectivesState', 'tasks', 'task_flags', 'status')
    end
  end
end
