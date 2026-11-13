require 'test_helper'
require 'minitest/mock'
require_relative '../../../tools/format/upgrade_games'

# Step 7, the sweep tool. --dry-run over games at 0 and at current reports both and writes
# nothing, and a real run is refused against the development database. STEPS is empty in
# step 7, so the test stubs FormatUpgrade.steps with a fixture rename step (current 1).
module BreakEscape
  class UpgradeGamesToolTest < ActiveSupport::TestCase
    FU = BreakEscape::FormatUpgrade

    def rename_steps
      [{ version: 1, name: 'rename',
         scenario: ->(d) { d['renamedRoom'] = d.delete('spareKey') if d.is_a?(Hash) && d.key?('spareKey') },
         player_state: ->(_s) { },
         retired: [{ path: nil, key: 'spareKey', now: 'renamedRoom' }] }]
    end

    def scenario(extra = {})
      {
        'scenario_brief' => 'brief', 'startRoom' => 'lobby',
        'rooms' => { 'lobby' => { 'type' => 'room_office', 'locked' => false, 'connections' => {},
                                  'objects' => [], 'npcs' => [] } },
        'globalVariables' => {}
      }.merge(extra)
    end

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @player  = break_escape_demo_users(:test_user)
      PlayerPreference.find_or_create_by!(player: @player) do |pref|
        pref.selected_sprite = 'female_hacker_hood_v2'
        pref.in_game_name    = 'TestAgent'
      end
    end

    def make_game(scenario_data)
      Game.create!(mission: @mission, player: @player, scenario_data: scenario_data,
                   player_state: { 'currentRoom' => 'lobby' })
    end

    test 'dry-run over games at 0 and at current reports both and writes nothing' do
      at_zero = make_game(scenario('spareKey' => 'x'))
      at_zero.update_column(:scenario_data, scenario('spareKey' => 'x')) # strip the stamp: no formatVersion
      at_current = make_game(scenario)
      at_current.update_column(:scenario_data, scenario('formatVersion' => 1))

      zero_before = at_zero.reload.scenario_data
      current_before = at_current.reload.scenario_data
      zero_updated = at_zero.updated_at
      current_updated = at_current.updated_at

      io = StringIO.new
      status = FU.stub(:steps, rename_steps) do
        UpgradeGamesTool.run(argv: ['--dry-run'], out: io)
      end
      report = io.string

      assert_equal 0, status
      assert_match(/current format version: 1 \(dry run\)/, report)
      assert_match(/version 0:/, report)
      assert_match(/version 1:/, report)
      assert_match(/would upgrade: [1-9]/, report) # at least the at-0 game
      assert_match(/step 1 rename:/, report)
      assert_match(/dry run: nothing written/, report)

      assert_equal zero_before, at_zero.reload.scenario_data, 'the at-0 game is unchanged'
      assert_equal current_before, at_current.reload.scenario_data, 'the at-current game is unchanged'
      assert_equal zero_updated.to_i, at_zero.updated_at.to_i
      assert_equal current_updated.to_i, at_current.updated_at.to_i
    end

    test 'a real run is refused against the development database' do
      io = StringIO.new
      status = nil
      Rails.env.stub(:development?, true) do
        status = UpgradeGamesTool.run(argv: [], out: io)
      end
      assert_equal 1, status
      assert_match(/refusing a real run/, io.string)
    end
  end
end
