require 'test_helper'

module BreakEscape
  # Phone texts keep the game time they arrived at (gameTime, elapsed game ms), so
  # each bubble shows its own time after a reload rather than all the same one.
  class PhoneMessageGameTimeTest < ActiveSupport::TestCase
    setup do
      @game = Game.create!(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario_data: { 'startRoom' => 'reception', 'rooms' => {} },
        player_state: { 'currentRoom' => 'reception', 'unlockedRooms' => ['reception'], 'globalVariables' => {} }
      )
    end

    test 'a phone text keeps its numeric gameTime; a non-numeric one is dropped' do
      @game.send(:merge_phone_state!, {
        'hax' => { 'history' => [
          { 'type' => 'npc', 'text' => 'First', 'timestamp' => 1_000, 'gameTime' => 125_000, 'read' => true },
          { 'type' => 'npc', 'text' => 'Second', 'timestamp' => 2_000, 'gameTime' => 'soon', 'read' => false }
        ] }
      })
      history = @game.player_state.dig('phoneState', 'hax', 'history')
      assert_equal 125_000, history[0]['gameTime']
      refute history[1].key?('gameTime')
      assert_equal 2_000, history[1]['timestamp']
    end
  end
end
