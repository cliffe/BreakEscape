require 'test_helper'

module BreakEscape
  # m06 blind playtest: read_transaction_server_files showed "progress 2" with all three files
  # collected. The client posts the "2 of 3" progress and then the completion without waiting,
  # and the progress request can land second. A completed task keeps its record.
  class LateTaskProgressTest < ActiveSupport::TestCase
    def scenario
      {
        'startRoom' => 'lobby',
        'objectives' => [
          { 'aimId' => 'a1', 'title' => 'Read the files', 'tasks' => [
            { 'taskId' => 'collect_three', 'title' => 'Collect three files', 'type' => 'collect_items',
              'targetGroup' => 'files', 'targetCount' => 3, 'showProgress' => true, 'status' => 'active' }
          ] }
        ],
        'rooms' => { 'lobby' => { 'type' => 'room_office', 'objects' => [] } }
      }
    end

    def build
      create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'] }
      )
    end

    def task_record(game)
      game.player_state.dig('objectivesState', 'tasks', 'collect_three')
    end

    test 'progress while the task is open is stored' do
      game = build
      game.update_task_progress!('collect_three', 2)
      assert_equal 2, task_record(game)['progress']
    end

    test 'a progress post that lands after the completion does not touch the record' do
      game = build
      game.update_task_progress!('collect_three', 1)
      result = game.complete_task!('collect_three', { currentCount: 3 }, trusted: false)
      assert result[:success]
      assert_equal 'completed', task_record(game)['status']

      late = game.update_task_progress!('collect_three', 2)
      assert late[:success]
      record = task_record(game)
      assert_equal 'completed', record['status']
      assert_nil record['progress'], 'a completed task must not show a stale count'
    end
  end
end
