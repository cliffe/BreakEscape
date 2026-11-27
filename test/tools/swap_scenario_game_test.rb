require 'test_helper'
require 'stringio'

# tools/playtest/swap-scenario-game.rb must prepare the swapped scenario as a new game does
# (NpcHabits.expand! included), so its saved data equals a freshly created game's.
module BreakEscape
  class SwapScenarioGameTest < ActiveSupport::TestCase
    SCRIPT = BreakEscape::Engine.root.join('tools/playtest/swap-scenario-game.rb').to_s

    test 'a swapped habits game has the same scenario data as a freshly created one' do
      player = DemoUser.first || DemoUser.create!(username: 'playtest')
      host = Mission.create!(name: 'test_seating', display_name: 'Host', published: true, difficulty_level: 1)
      habits = Mission.create!(name: 'test_access_habits', display_name: 'Habits', published: true, difficulty_level: 1)
      fresh = Game.create!(player: player, mission: habits)

      out = StringIO.new
      old_stdout = $stdout
      old_argv = ARGV.dup
      begin
        $stdout = out
        ARGV.replace(['test_seating', 'test_access_habits'])
        load SCRIPT
      ensure
        $stdout = old_stdout
        ARGV.replace(old_argv)
      end
      swapped = Game.find(out.string[/GAME_ID=(\d+)/, 1])

      assert_equal host.id, swapped.mission_id
      assert_equal fresh.scenario_data, swapped.scenario_data
      assert_equal fresh.player_state['currentRoom'], swapped.player_state['currentRoom']
    end
  end
end
