require 'test_helper'

# E3: a task's onComplete.setGlobal is applied by the server when it records
# the task complete, so the global survives a lost client sync. Values come
# from the scenario only; the request can't add or change globals this way.
module BreakEscape
  class TaskSetGlobalTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    SCENARIO = {
      'startRoom' => 'lobby',
      'rooms' => { 'lobby' => { 'type' => 'room_office', 'connections' => {}, 'objects' => [] } },
      'globalVariables' => { 'safe_open' => false, 'stage' => 0 },
      'objectives' => [
        {
          'aimId' => 'main', 'title' => 'Main', 'status' => 'active', 'order' => 0,
          'tasks' => [
            { 'taskId' => 'open_safe', 'title' => 'Open the safe', 'type' => 'custom', 'status' => 'active',
              'onComplete' => { 'setGlobal' => { 'safe_open' => true, 'stage' => 2, 'not_declared' => true } } },
            { 'taskId' => 'other', 'title' => 'Other', 'type' => 'custom', 'status' => 'active' }
          ]
        }
      ]
    }.freeze

    setup do
      @game = Game.create!(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario_data: SCENARIO.deep_dup,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'], 'unlockedObjects' => [],
                        'inventory' => [], 'encounteredNPCs' => [], 'globalVariables' => { 'safe_open' => false },
                        'notes' => [], 'health' => 100 }
      )
    end

    test 'completing a task over HTTP applies its declared setGlobal on the server' do
      post complete_task_game_url(@game, task_id: 'open_safe'),
           params: { setGlobal: { not_declared: true, stage: 99 }, globalVariables: { injected: true } },
           as: :json
      assert_response :success
      globals = @game.reload.player_state['globalVariables']
      assert_equal true, globals['safe_open']
      assert_equal 2, globals['stage'], 'the scenario value, not one from the request'
      assert_not globals.key?('not_declared'), 'undeclared globals are not set server-side'
      assert_not globals.key?('injected'), 'complete_task takes no globals from the request'
    end

    test 'a task without onComplete leaves the globals alone' do
      post complete_task_game_url(@game, task_id: 'other'), as: :json
      assert_response :success
      assert_equal({ 'safe_open' => false }, @game.reload.player_state['globalVariables'])
    end

    # SE lab (Hampshire): the client maps global_variable_changed:phish_hampshire_landed
    # to completeTask hampshire_landed (an eventMapping Rails cannot run), then POSTs
    # complete_task. This is the server half. Task shape follows
    # lab_social_engineering ("type": "manual", no onComplete).
    HAMPSHIRE = {
      'startRoom' => 'lobby',
      'rooms' => { 'lobby' => { 'type' => 'room_office', 'connections' => {}, 'objects' => [] } },
      'globalVariables' => { 'phish_hampshire_landed' => false },
      'objectives' => [
        {
          'aimId' => 'hampshire', 'title' => 'Hampshire', 'status' => 'active', 'order' => 0,
          'tasks' => [
            { 'taskId' => 'ready_hampshire', 'title' => 'Get ready', 'type' => 'manual', 'status' => 'active' },
            { 'taskId' => 'hampshire_landed', 'title' => 'Land a message on the Careers inbox',
              'type' => 'manual', 'status' => 'active' }
          ]
        }
      ]
    }.freeze

    def hampshire_game
      Game.create!(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario_data: HAMPSHIRE.deep_dup,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'], 'unlockedObjects' => [],
                        'inventory' => [], 'encounteredNPCs' => [],
                        'globalVariables' => { 'phish_hampshire_landed' => true },
                        'notes' => [], 'health' => 100 }
      )
    end

    test 'hampshire_landed completes once, raising tasks_completed and the score' do
      game = hampshire_game
      assert_equal 0, game.tasks_completed.to_i

      post complete_task_game_url(game, task_id: 'hampshire_landed'), as: :json
      assert_response :success
      assert_equal true, JSON.parse(@response.body)['success']

      game.reload
      assert_equal 'completed', game.player_state.dig('objectivesState', 'tasks', 'hampshire_landed', 'status')
      assert_equal 1, game.tasks_completed
      assert_equal 35, game.score, 'one of two tasks: 70 * 1/2, the aim is not complete'
    end

    test 'a repeat hampshire_landed completion is a no-op and the score does not change' do
      game = hampshire_game
      post complete_task_game_url(game, task_id: 'hampshire_landed'), as: :json
      assert_response :success
      game.reload
      score = game.score
      completed_at = game.player_state.dig('objectivesState', 'tasks', 'hampshire_landed', 'completedAt')

      post complete_task_game_url(game, task_id: 'hampshire_landed'), as: :json
      assert_response :success
      json = JSON.parse(@response.body)
      assert_equal true, json['success']
      assert_equal 'Already completed', json['message']

      game.reload
      assert_equal 1, game.tasks_completed
      assert_equal score, game.score
      assert_equal completed_at, game.player_state.dig('objectivesState', 'tasks', 'hampshire_landed', 'completedAt')
    end

    test 'hampshire_landed is accepted before its sibling task ready_hampshire' do
      game = hampshire_game
      assert_nil game.player_state.dig('objectivesState', 'tasks', 'ready_hampshire', 'status')

      post complete_task_game_url(game, task_id: 'hampshire_landed'), as: :json
      assert_response :success

      game.reload
      assert_equal 'completed', game.player_state.dig('objectivesState', 'tasks', 'hampshire_landed', 'status')
      assert_not_equal 'completed', game.player_state.dig('objectivesState', 'tasks', 'ready_hampshire', 'status')
      assert_equal 1, game.tasks_completed

      # the late task still completes afterwards
      post complete_task_game_url(game, task_id: 'ready_hampshire'), as: :json
      assert_response :success
      assert_equal 2, game.reload.tasks_completed
    end
  end
end
