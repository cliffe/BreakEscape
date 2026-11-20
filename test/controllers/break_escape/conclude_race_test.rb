require 'test_helper'

# The conclude race (release-readiness, 2026-11-13).
#
# A task completes on the same beat that sets a global named in the mission's
# concludeRequires.globals. The task-completion POST can reach the server before
# the state sync carrying that global, so the server answers with a conclusion
# warning. The global lands a moment later and the mission would conclude anyway,
# so the warning is shown over the ending.
#
# The client fix flushes the pending globals before the completion POST, so the
# server sees the global and concludes on the first POST. This test proves the
# server's half: the idempotent re-completion (what the client falls back to when
# a warning still arrives) re-evaluates the gate once the global has reached the
# server, instead of returning "Already completed" and leaving the mission stranded.
module BreakEscape
  class ConcludeRaceTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    PLAYER_STATE = {
      'currentRoom' => 'lobby',
      'unlockedRooms' => ['lobby'],
      'unlockedObjects' => [],
      'inventory' => [],
      'encounteredNPCs' => [],
      'globalVariables' => { 'gate_global' => false },
      'notes' => [],
      'health' => 100,
      'objectivesState' => { 'tasks' => {}, 'aims' => {} }
    }.freeze

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @owner   = break_escape_demo_users(:test_user)

      PlayerPreference.find_or_create_by!(player: @owner) do |pref|
        pref.selected_sprite = 'female_hacker_hood_v2'
        pref.in_game_name    = 'TestAgent'
      end
    end

    # A missionConclusion aim with one custom task and a single global gate: the
    # race shape (ca01 completes a task from an eventMapping on the gate global's
    # change).
    def race_scenario
      {
        'startRoom' => 'lobby',
        'rooms' => { 'lobby' => { 'locked' => false, 'connections' => {}, 'objects' => [], 'npcs' => [] } },
        'globalVariables' => { 'gate_global' => false },
        'objectives' => [{
          'aimId' => 'finish', 'title' => 'Finish', 'status' => 'active',
          'missionConclusion' => true,
          'concludeRequires' => { 'globals' => ['gate_global'] },
          'tasks' => [
            { 'taskId' => 'final_task', 'title' => 'Final', 'type' => 'custom', 'status' => 'active' }
          ]
        }]
      }
    end

    def create_game
      Game.create!(mission: @mission, player: @owner,
                   scenario_data: race_scenario, player_state: PLAYER_STATE.deep_dup)
    end

    # The race itself, at the server boundary: the completion lands before the
    # global, so the server correctly warns and does not conclude.
    test 'completing the gate task before its global syncs warns and does not conclude' do
      game = create_game

      post complete_task_game_url(game, task_id: 'final_task'), as: :json
      assert_response :success
      json = JSON.parse(@response.body)

      assert_equal true, json['success']
      assert json['warning'].present?, 'the server warns that the gate is not met'
      assert_not json['missionConcluded'], 'the mission is not concluded'

      game.reload
      assert_nil game.mission_concluded_at
    end

    # The fix: once the global has reached the server, re-posting the (already
    # completed) gate task re-evaluates the gate and concludes the mission. Before
    # the fix the server returned "Already completed" with no missionConcluded, so
    # the mission stayed stranded.
    test 'a re-post of the gate task after its global arrives concludes the mission' do
      game = create_game

      # First POST races ahead of the global: warned, not concluded.
      post complete_task_game_url(game, task_id: 'final_task'), as: :json
      assert_response :success
      assert JSON.parse(@response.body)['warning'].present?

      # The global reaches the server (as the state sync would carry it).
      game.reload
      game.player_state['globalVariables']['gate_global'] = true
      game.save!

      # The client's fallback: re-post the already-completed task.
      post complete_task_game_url(game, task_id: 'final_task'), as: :json
      assert_response :success
      json = JSON.parse(@response.body)

      assert_equal true, json['success']
      assert_equal true, json['missionConcluded'], 'the re-post concludes the mission'
      assert_nil json['warning'], 'no warning once the gate is met'

      game.reload
      assert_not_nil game.mission_concluded_at
      assert_equal 'completed', game.status
    end

    # m2: a re-post while the global is still false must not conclude -- it returns
    # the warning, same as the first race completion. The client's fallback re-post
    # only concludes once the flush has carried the global.
    test 'a re-post with the global still false does not conclude and warns' do
      game = create_game

      post complete_task_game_url(game, task_id: 'final_task'), as: :json
      assert_response :success
      assert JSON.parse(@response.body)['warning'].present?

      # The global never reached the server (the flush failed / offline).
      post complete_task_game_url(game, task_id: 'final_task'), as: :json
      assert_response :success
      json = JSON.parse(@response.body)

      assert_equal true, json['success']
      assert_equal 'Already completed', json['message']
      assert_not json['missionConcluded'], 'the re-post does not conclude while the gate is unmet'
      assert json['warning'].present?, 'the still-unmet gate still warns'

      game.reload
      assert_nil game.mission_concluded_at
    end

    # m2: a second re-post after the mission has already concluded is a pure no-op
    # -- missionConcluded is false (this POST did not just conclude it), no warning,
    # and no second save or award.
    test 'a re-post after conclusion is idempotent' do
      game = create_game

      post complete_task_game_url(game, task_id: 'final_task'), as: :json
      game.reload
      game.player_state['globalVariables']['gate_global'] = true
      game.save!

      # The fallback re-post concludes the mission.
      post complete_task_game_url(game, task_id: 'final_task'), as: :json
      assert_equal true, JSON.parse(@response.body)['missionConcluded']
      game.reload
      concluded_at = game.mission_concluded_at
      score_after  = game.score

      # A further re-post after conclusion changes nothing.
      post complete_task_game_url(game, task_id: 'final_task'), as: :json
      assert_response :success
      json = JSON.parse(@response.body)

      assert_equal true, json['success']
      assert_equal 'Already completed', json['message']
      assert_not json['missionConcluded'], 'the already-concluded re-post does not re-announce a conclusion'
      assert_nil json['warning'], 'no warning once the mission has concluded'

      game.reload
      assert_equal concluded_at, game.mission_concluded_at, 'conclusion time is unchanged'
      assert_equal score_after, game.score, 'no second award'
    end

    # M1: the host rescore hook (on_task_complete) fires once for the genuine first
    # completion, never again on the idempotent re-post the conclude-race fallback
    # makes on the same beat.
    test 'the on_task_complete hook does not fire a second time on the idempotent re-post' do
      game = create_game
      calls = 0
      previous = BreakEscape.configuration.on_task_complete
      BreakEscape.configuration.on_task_complete = ->(_g) { calls += 1 }

      begin
        post complete_task_game_url(game, task_id: 'final_task'), as: :json
        assert_response :success
        assert_equal 1, calls, 'the hook fires once on the real completion'

        # The conclude-race fallback re-post (already completed): must not re-fire.
        post complete_task_game_url(game, task_id: 'final_task'), as: :json
        assert_response :success
        assert_equal 1, calls, 'the idempotent re-post does not fire the hook again'
      ensure
        BreakEscape.configuration.on_task_complete = previous
      end
    end
  end
end
