require 'test_helper'
require_relative '../../support/fake_hacktivity_vm'

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

    teardown do
      FakeHacktivityVm.uninstall!
    end

    # The Hacktivity-mode tests need a live VM set behind vm_set_id, or the D144 gate reads
    # the game as released before the flag ever reaches the host.
    def install_live_vm_set(game, id: 1)
      game.player_state['vm_set_id'] = id
      game.save!
      set = FakeHacktivityVm::FakeSet.new(id: id, user_id: @owner.id)
      set.vms = FakeHacktivityVm::FlagVms.new([FakeHacktivityVm::FlagVm.new([FLAG_ONE, FLAG_TWO], 'target_vm')])
      set.define_singleton_method(:user) { nil }
      FakeHacktivityVm.install!(sets: [set])
      set
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

    test 'a full list injected through update_task_progress plus one real flag does not complete the task' do
      game = build_game(['target_vm-flag1', 'target_vm-flag2'])
      put update_task_progress_game_url(game, task_id: 'task_flags'),
          params: { progress: 2, submittedFlags: ['target_vm-flag1', 'target_vm-flag2'] }
      assert_response :not_found # submit_flags progress is server-written
      assert_nil game.reload.player_state.dig('objectivesState', 'tasks', 'task_flags', 'progress')
      score_before = game.reload.score

      post flags_game_url(game), params: { flag: FLAG_ONE, stationId: 'station_a' }, as: :json
      assert_response :success

      assert_not_equal 'completed', status(game)
      assert_equal score_before, game.reload.score
      # The injected list is not kept: stored progress mirrors the server record.
      assert_equal ['target_vm-flag1'],
                   game.player_state.dig('objectivesState', 'tasks', 'task_flags', 'submittedFlags')
      assert_equal false, complete(game, ['target_vm-flag1', 'target_vm-flag2'])['success']
    end

    test 'update_task_progress ignores unknown task ids and caps progress' do
      game = build_game(['target_vm-flag1', 'target_vm-flag2'])

      put update_task_progress_game_url(game, task_id: 'made_up_task'),
          params: { progress: 1, submittedFlags: Array.new(500) { |i| "x#{i}" } }
      assert_response :not_found
      assert_nil game.reload.player_state.dig('objectivesState', 'tasks', 'made_up_task')

      # Forged "(1/1)" progress cannot land on a submit_flags task.
      put update_task_progress_game_url(game, task_id: 'task_flags'), params: { progress: 1 }
      assert_response :not_found
      assert_nil game.reload.player_state.dig('objectivesState', 'tasks', 'task_flags')

      data = scenario(['target_vm-flag1'])
      data['objectives'][0]['tasks'] << { 'taskId' => 'task_collect', 'type' => 'collect_items', 'targetCount' => 3 }
      collect = Game.create!(mission: @mission, player: @owner, scenario_data: data)
      put update_task_progress_game_url(collect, task_id: 'task_collect'), params: { progress: 999_999 }
      assert_response :success
      assert_equal 3, collect.reload.player_state.dig('objectivesState', 'tasks', 'task_collect', 'progress')
    end

    test 'a multi-flag task part-way through before flag_task_matches existed still completes via /flags' do
      game = build_game(['target_vm-flag1', 'target_vm-flag2'])
      # Flag 1 was validated and recorded by an older build: it is in submitted_flags only.
      game.player_state['submitted_flags'] = [FLAG_ONE]
      game.save!

      post flags_game_url(game), params: { flag: FLAG_TWO, stationId: 'station_a' }, as: :json
      assert_response :success
      assert_equal 'completed', status(game)
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

    # --- flag-locked object with completesTask (m01 submit_ssh_flag shape) ---

    def lock_scenario
      {
        'startRoom' => 'reception',
        'flags' => { 'target_vm' => { 'flag_1' => FLAG_ONE } },
        'objectives' => [{
          'aimId' => 'aim_flags',
          'tasks' => [{ 'taskId' => 'task_flags', 'type' => 'submit_flags', 'targetFlags' => ['target_vm:flag_1'] }]
        }],
        'rooms' => {
          'reception' => {
            'type' => 'room_reception',
            'objects' => [{
              'type' => 'safe', 'id' => 'flag_safe', 'name' => 'Flag Safe', 'locked' => true,
              'lockType' => 'flag', 'requires' => 'target_vm:flag_1', 'completesTask' => 'task_flags'
            }]
          }
        }
      }
    end

    def unlock_safe(game, flag)
      post unlock_game_url(game), params: { targetType: 'object', targetId: 'flag_safe', attempt: flag, method: 'flag' }, as: :json
    end

    # Hacktivity mode for the block only.
    def in_hacktivity_mode
      Mission.singleton_class.class_eval do
        alias_method :__orig_hacktivity_mode?, :hacktivity_mode?
        define_method(:hacktivity_mode?) { true }
      end
      yield
    ensure
      Mission.singleton_class.class_eval do
        alias_method :hacktivity_mode?, :__orig_hacktivity_mode?
        remove_method :__orig_hacktivity_mode?
      end
    end

    # Makes the Hacktivity submit fail the way a FlagService error does.
    def with_flagservice_error(failure = { success: false, message: 'Error submitting flag to Hacktivity', retryable: true })
      Game.class_eval do
        alias_method :__orig_submit_to_hacktivity, :submit_to_hacktivity
        define_method(:submit_to_hacktivity) { |_flag| failure }
      end
      Mission.singleton_class.class_eval do
        alias_method :__orig_hacktivity_mode?, :hacktivity_mode?
        define_method(:hacktivity_mode?) { true }
      end
      yield
    ensure
      Mission.singleton_class.class_eval do
        alias_method :hacktivity_mode?, :__orig_hacktivity_mode?
        remove_method :__orig_hacktivity_mode?
      end
      Game.class_eval do
        alias_method :submit_to_hacktivity, :__orig_submit_to_hacktivity
        remove_method :__orig_submit_to_hacktivity
      end
    end

    test 'flag-locked object: the right flag unlocks it and completes the linked task' do
      game = Game.create!(mission: @mission, player: @owner, scenario_data: lock_scenario)

      unlock_safe(game, FLAG_ONE)

      assert_response :success
      body = JSON.parse(response.body)
      assert_equal true, body['success'], body.inspect
      assert_includes body['completedTasks'], 'task_flags'
      assert_equal 'completed', status(game)
    end

    test 'flag-locked object: a wrong flag completes nothing' do
      game = Game.create!(mission: @mission, player: @owner, scenario_data: lock_scenario)

      unlock_safe(game, 'flag{nope}')

      assert_response :unprocessable_entity
      assert_not_equal 'completed', status(game)
    end

    test 'flag-locked object: a FlagService error is refused so the player can retry' do
      game = Game.create!(mission: @mission, player: @owner, scenario_data: lock_scenario)
      install_live_vm_set(game)

      with_flagservice_error { unlock_safe(game, FLAG_ONE) }

      assert_response :unprocessable_entity
      body = JSON.parse(response.body)
      assert_equal false, body['success']
      assert_equal 'flag_not_recorded', body['reason']
      assert body['message'].present?
      game.reload
      assert_not_equal 'completed', status(game)
      assert_not game.object_unlocked?('flag_safe'), 'the unlock must be rolled back'
      assert_empty Array(game.player_state['submitted_flags'])

      # Retry once the service is back: unlocks and completes.
      unlock_safe(game, FLAG_ONE)
      assert_response :success
      assert_equal 'completed', status(game)
    end

    test 'flag-locked object: a permanent Hacktivity failure keeps the old behaviour and opens the object' do
      game = Game.create!(mission: @mission, player: @owner, scenario_data: lock_scenario)
      install_live_vm_set(game)

      with_flagservice_error({ success: false, message: 'Flag not found in VM set' }) { unlock_safe(game, FLAG_ONE) }

      assert_response :success
      assert_equal true, JSON.parse(response.body)['success']
      assert game.reload.object_unlocked?('flag_safe')
    end

    test 'flag station: an unrecorded flag is reported as flag_not_recorded, not invalid' do
      game = build_game(['target_vm-flag1'])
      install_live_vm_set(game)

      with_flagservice_error do
        post flags_game_url(game), params: { flag: FLAG_ONE, stationId: 'station_a' }, as: :json
      end

      assert_response :unprocessable_entity
      assert_equal 'flag_not_recorded', JSON.parse(response.body)['reason']
    end

    # A Hacktivity outage must never tell the student their VMs were released: the real
    # submit path, a live set, and a FlagService that raises.
    test 'a FlagService outage on a live VM set is flag_not_recorded, never vm_released' do
      game = build_game(['target_vm-flag1'])
      install_live_vm_set(game)
      ::FlagService.define_singleton_method(:process_flag) { |*| raise StandardError, 'connection refused' }

      in_hacktivity_mode do
        assert_equal :live, game.reload.vm_set_state
        post flags_game_url(game), params: { flag: FLAG_ONE, stationId: 'station_a' }, as: :json
      end

      assert_response :unprocessable_entity
      body = JSON.parse(response.body)
      assert_equal 'flag_not_recorded', body['reason'], body.inspect
      assert_not_equal Game::VM_RELEASED_MESSAGE, body['message']
      assert_empty Array(game.reload.player_state['submitted_flags'])
    end
  end
end
