require 'test_helper'
require 'minitest/mock'

# Step 7, the two phase-1-deferred tests the plan lists for the deployed scenarios
# (plan "Tests": the per-deployed-scenario re-prepare test and the alias rule). STEPS is
# empty in step 7, so each test stubs FormatUpgrade.steps with a fixture list that raises
# current to 1. The four scenarios played on Hacktivity hold none of the keys steps 8a to
# 8c rename, so a no-op upgrade only stamps them and never re-prepares, and the alias check
# finds no retired key outside the (empty) ALIASES list.
module BreakEscape
  class FormatDeployedScenariosTest < ActiveSupport::TestCase
    FU = BreakEscape::FormatUpgrade
    DEPLOYED = %w[m01_first_contact sis01_healthcare sis02_energy lab_social_engineering].freeze

    setup do
      @player = break_escape_demo_users(:test_user)
      PlayerPreference.find_or_create_by!(player: @player) do |pref|
        pref.selected_sprite = 'female_hacker_hood_v2'
        pref.in_game_name    = 'TestAgent'
      end
    end

    # A fixture step that raises current to 1 and changes nothing on any deployed scenario.
    def noop_steps
      [{ version: 1, name: 'noop', scenario: ->(_d) { }, player_state: ->(_s) { }, retired: [] }]
    end

    # A fixture step that renames a top-level key every deployed scenario carries, so the
    # scenario changes and ensure_current_format! re-prepares once.
    def rename_steps
      [{ version: 1, name: 'rename',
         scenario: ->(d) { d['renamedBrief'] = d.delete('scenario_brief') if d.is_a?(Hash) && d.key?('scenario_brief') },
         player_state: ->(_s) { },
         retired: [{ path: nil, key: 'scenario_brief', now: 'renamedBrief' }] }]
    end

    def deployed_mission(name)
      Mission.find_or_create_by!(name: name) do |m|
        m.display_name     = name
        m.published        = true
        m.difficulty_level = 1
      end
    end

    # The raw render a pre-2026-11-09 game holds (no loader, no formatVersion).
    def raw_render(name)
      srand(1)
      deployed_mission(name).generate_scenario_data({})
    end

    DEPLOYED.each do |name|
      test "#{name}: a no-op step stamps but never re-prepares, on a prepared and an unprepared render" do
        mission = deployed_mission(name)
        game = Game.create!(mission: mission, player: @player)
        prepared = Marshal.load(Marshal.dump(game.scenario_data))
        prepared.delete('formatVersion') # as a game from before the stamp holds

        # First the prepared render (a normal created game), then the raw unprepared render.
        [prepared, raw_render(name)].each_with_index do |stored, i|
          shape = i.zero? ? 'prepared' : 'unprepared'
          game.update_column(:scenario_data, stored)
          game.reload
          before = Marshal.load(Marshal.dump(game.scenario_data))

          calls = 0
          game.stub(:prepare_scenario_data!, -> { calls += 1 }) do
            FU.stub(:steps, noop_steps) { game.ensure_current_format! }
          end

          assert_equal 0, calls, "#{name} (#{shape}): a no-op step must not re-prepare"
          game.reload
          assert_equal 1, game.scenario_data['formatVersion'], "#{name} (#{shape}): stamped to 1"
          assert_equal before, game.scenario_data.reject { |k, _| k == 'formatVersion' },
                       "#{name} (#{shape}): only formatVersion was added"
        end
      end
    end

    test 'a step that renames a key the scenario carries does re-prepare once' do
      mission = deployed_mission('m01_first_contact')
      game = Game.create!(mission: mission, player: @player)
      # Store an unprepared raw render so the rename has scenario_brief to move.
      game.update_column(:scenario_data, raw_render('m01_first_contact'))
      game.reload
      assert game.scenario_data.key?('scenario_brief'), 'fixture precondition'

      calls = 0
      game.stub(:prepare_scenario_data!, -> { calls += 1 }) do
        FU.stub(:steps, rename_steps) { game.ensure_current_format! }
      end
      assert_equal 1, calls, 'a renaming step re-prepares exactly once'
      game.reload
      assert_equal 1, game.scenario_data['formatVersion']
      assert_nil game.scenario_data['scenario_brief']
      assert game.scenario_data.key?('renamedBrief')
    end

    # --- the alias rule ---

    test 'the four deployed templates hold no retired key outside ALIASES' do
      # No step defines a retired key in step 7, so this holds trivially today; the test
      # guards the rule once steps 8a to 8c add retired keys, aliasing only what a deployed
      # scenario uses.
      DEPLOYED.each do |name|
        found = FU.retired_keys_in(raw_render(name)).reject { |e| e[:aliased] }
        assert_empty found, "#{name}: retired key(s) present with no alias: #{found.map { |e| e[:key] }.inspect}"
      end
    end

    test 'a fixture step that retires a key a deployed scenario uses is caught and names the scenario and key' do
      retire = [{ version: 1, name: 'retire-brief', scenario: ->(_d) { }, player_state: ->(_s) { },
                  retired: [{ path: nil, key: 'scenario_brief', now: 'renamedBrief' }] }]
      offenders = {}
      FU.stub(:steps, retire) do
        DEPLOYED.each do |name|
          hits = FU.retired_keys_in(raw_render(name)).reject { |e| e[:aliased] }
          offenders[name] = hits.map { |e| e[:key] } if hits.any?
        end
      end
      assert offenders.any?, 'the retired fixture key should be found in at least one deployed scenario'
      assert_includes offenders.values.flatten, 'scenario_brief'
    end
  end
end
