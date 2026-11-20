require 'test_helper'

# The read-only savedCurrentRoom bootstrap field (R1, SYNC_DELTAS_PLAN 3.2): GET
# /scenario returns the player's saved room so the first sync after a load does not
# resend currentRoom unless the page starts the player somewhere else. One short
# string; absent when the save holds no string currentRoom.
module BreakEscape
  class SavedCurrentRoomTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    def make_game(current_room)
      Game.create!(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario_data: {
          'startRoom' => 'lobby',
          'rooms' => { 'lobby' => { 'type' => 'room_office', 'locked' => false, 'connections' => {},
                                    'objects' => [], 'npcs' => [] } },
          'globalVariables' => {}
        },
        player_state: { 'currentRoom' => current_room, 'unlockedRooms' => ['lobby'], 'unlockedObjects' => [],
                        'inventory' => [], 'globalVariables' => {}, 'notes' => [] }.compact
      )
    end

    def scenario_json(game)
      get scenario_game_url(game)
      assert_response :success
      response.parsed_body
    end

    test 'the saved current room is returned as savedCurrentRoom' do
      game = make_game('lobby')
      assert_equal 'lobby', scenario_json(game)['savedCurrentRoom']
    end

    test 'savedCurrentRoom is absent when the save holds no string current room' do
      game = make_game('lobby')
      # A create callback seeds currentRoom from startRoom, so strip it directly to
      # exercise the controller's is_a?(String) guard.
      state = game.player_state.except('currentRoom')
      game.update_column(:player_state, state)
      refute game.reload.player_state.key?('currentRoom'), 'precondition: no string currentRoom saved'
      assert_not scenario_json(game).key?('savedCurrentRoom')
    end
  end
end
