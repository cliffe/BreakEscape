require 'test_helper'

module BreakEscape
  # Gated-door tailgating, Chunk C: server-completed-only tasks (GATED_DOOR_SERVER_CHECK_PLAN.md §7).
  # The serverCompletedOnly derivation, the complete_task! trusted: keyword and guard, and the
  # skip_task! guard. The endpoint-level forge refusals (plan tests 5, 5b, 5c) and the end-to-end
  # proof that a legitimate player's credited task still completes live in the controller test.
  class GatedServerCompletedTaskTest < ActiveSupport::TestCase
    def scenario
      {
        'startRoom' => 'lobby',
        'globalVariables' => { 'courier_ready' => false, 'kp_badge_tailgated' => false, 'kp_records_cloned' => false },
        'disguises' => { 'hivis' => { 'sprite' => 'courier_hivis' } },
        'objectives' => [
          { 'aimId' => 'a1', 'title' => 'Get in', 'tasks' => [
            { 'taskId' => 'tailgate_in', 'title' => 'Get past the records door', 'type' => 'manual', 'status' => 'active' },
            { 'taskId' => 'free_task', 'title' => 'An ordinary task', 'type' => 'custom', 'status' => 'active' }
          ] }
        ],
        'rooms' => {
          'lobby' => {
            'type' => 'room_office',
            'connections' => { 'north' => 'secure_area' },
            'doors' => [
              { 'connectedRoom' => 'secure_area', 'direction' => 'north', 'requires' => 'badge',
                'gate' => { 'openFor' => ['len'], 'openRadius' => 72, 'playerMayPassIf' => 'courier_ready',
                            'creditOnPass' => {
                              'viaPass' => { 'setGlobal' => { 'kp_badge_tailgated' => true }, 'completeTask' => 'tailgate_in' },
                              'viaCredential' => { 'setGlobal' => { 'kp_records_cloned' => true }, 'completeTask' => 'tailgate_in' }
                            } } }
            ],
            'objects' => [{ 'type' => 'rfid_cloner', 'id' => 'cloner', 'name' => 'RFID cloner' }]
          },
          'secure_area' => {
            'type' => 'room_office', 'locked' => true, 'lockType' => 'rfid', 'requires' => 'badge',
            'objects' => [{ 'type' => 'notes', 'id' => 'deeds', 'name' => 'Deeds', 'readable' => true }]
          }
        }
      }
    end

    def build(player_state = {})
      create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'] }.merge(player_state)
      )
    end

    def status(game, task_id)
      game.player_state.dig('objectivesState', 'tasks', task_id, 'status')
    end

    test 'serverCompletedOnly derives the distinct gate completeTask ids' do
      game = build
      # Both viaPass and viaCredential name tailgate_in; the set is distinct.
      assert_equal %w[tailgate_in], game.server_completed_only_task_ids
    end

    test 'completed_only_task_ids_in is empty for a scenario with no creditOnPass gate' do
      assert_equal [], Game.completed_only_task_ids_in('rooms' => { 'r' => { 'doors' => [{ 'connectedRoom' => 'x' }] } })
      assert_equal [], Game.completed_only_task_ids_in(nil)
    end

    test 'complete_task! refuses a server-completed-only task without trusted' do
      game = build
      result = game.complete_task!('tailgate_in')
      refute result[:success], 'a credited task is refused on the untrusted (client) path'
      assert_equal 'Task is server-completed only', result[:error]
      refute_equal 'completed', status(game, 'tailgate_in'), 'the task stays uncompleted'
    end

    test 'complete_task! completes a server-completed-only task when trusted' do
      game = build
      result = game.complete_task!('tailgate_in', trusted: true)
      assert result[:success], 'the server credit path (trusted) completes the task'
      assert_equal 'completed', status(game, 'tailgate_in')
    end

    test 'trusted is a real keyword, never read from validation_data' do
      game = build
      # An explicit trailing keyword keeps the string-keyed hash positional (Ruby 2.7 keyword
      # separation). A 'trusted' entry inside validation_data must not bypass the guard.
      result = game.complete_task!('tailgate_in', { 'trusted' => true }, trusted: false)
      refute result[:success], 'validation_data cannot smuggle trusted'
      assert_equal 'Task is server-completed only', result[:error]
    end

    test 'an ordinary (non-credited) task still completes on the untrusted path' do
      game = build
      result = game.complete_task!('free_task')
      assert result[:success], 'the guard only bites on credited tasks'
      assert_equal 'completed', status(game, 'free_task')
    end

    test 'skip_task! refuses a server-completed-only task outright' do
      game = build
      result = game.skip_task!('tailgate_in')
      refute result[:success], 'a credited task cannot be skipped'
      assert_equal 'Task is server-completed only', result[:error]
      refute_equal 'skipped', status(game, 'tailgate_in')
    end

    test 'skip_task! still skips an ordinary task' do
      game = build
      result = game.skip_task!('free_task')
      assert result[:success]
      assert_equal 'skipped', status(game, 'free_task')
    end

    # R3 minor 1: the guard now sits after the already-completed branch, so an honest re-post of a
    # credited task the server has already credited gets the idempotent "Already completed" rather
    # than a hard 422 that would show an earned finding as "Objective Blocked".
    test 'complete_task! on an already-credited task re-posted untrusted is idempotent, not blocked' do
      game = build
      assert game.complete_task!('tailgate_in', trusted: true)[:success], 'the server credit lands first'
      result = game.complete_task!('tailgate_in') # the honest client re-post, untrusted
      assert result[:success], 'an already-credited task is not blocked on a duplicate'
      assert_equal 'Already completed', result[:message]
      assert_equal 'completed', status(game, 'tailgate_in')
    end

    test 'skip_task! on an already-credited task re-posted is idempotent, not blocked' do
      game = build
      assert game.complete_task!('tailgate_in', trusted: true)[:success]
      result = game.skip_task!('tailgate_in')
      assert result[:success], 'an already-completed credited task is not blocked on a skip re-post'
      assert_equal 'Already completed', result[:message]
      assert_equal 'completed', status(game, 'tailgate_in'), 'it stays completed, not skipped'
    end
  end
end
