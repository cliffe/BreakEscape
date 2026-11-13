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
  end
end
