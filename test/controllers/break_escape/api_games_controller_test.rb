require 'test_helper'

module BreakEscape
  # Api::GamesController has no route in config/routes.rb, so it is driven
  # through a route drawn for this test only. merge_global_variables! no
  # longer saves, so the action must.
  class ApiGamesControllerTest < ActionController::TestCase
    tests Api::GamesController

    setup do
      @routes = ActionDispatch::Routing::RouteSet.new
      @routes.draw { put 'api/games/:id/sync_state', to: 'break_escape/api/games#sync_state' }
      @game = Game.create!(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario_data: { 'startRoom' => 'lobby', 'rooms' => { 'lobby' => { 'type' => 'room_office', 'connections' => {} } } },
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'], 'globalVariables' => { 'gone' => 1 } }
      )
    end

    test 'the API sync still saves globals' do
      put :sync_state, params: { id: @game.id, globalVariables: { 'briefing_played' => true, 'gone' => nil } }, as: :json

      assert_response :success
      assert_equal({ 'briefing_played' => true }, @game.reload.player_state['globalVariables'])
    end
  end
end
