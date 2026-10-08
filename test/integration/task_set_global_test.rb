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
  end
end
