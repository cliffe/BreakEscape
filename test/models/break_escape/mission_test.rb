require 'test_helper'

module BreakEscape
  class MissionTest < ActiveSupport::TestCase
    test "should validate presence of name" do
      mission = Mission.new(display_name: 'Test')
      assert_not mission.valid?
      assert mission.errors[:name].any?
    end

    test "should validate uniqueness of name" do
      Mission.create!(name: 'test', display_name: 'Test')
      duplicate = Mission.new(name: 'test', display_name: 'Test 2')
      assert_not duplicate.valid?
    end

    test "published scope returns only published missions" do
      assert_includes Mission.published, break_escape_missions(:ceo_exfil)
      assert_not_includes Mission.published, break_escape_missions(:unpublished)
    end

    test "scenario_path returns correct path" do
      mission = break_escape_missions(:ceo_exfil)
      expected = BreakEscape::Engine.root.join('scenarios', 'ceo_exfil')
      assert_equal expected, mission.scenario_path
    end

    test "ui_theme reads mission.json and falls back to the default" do
      assert_equal 'spy', Mission.new(name: 'm01_first_contact', display_name: 'M1').ui_theme
      assert_equal Mission::DEFAULT_UI_THEME, break_escape_missions(:ceo_exfil).ui_theme
      assert_equal Mission::DEFAULT_UI_THEME, Mission.new(name: 'no_such_mission', display_name: 'X').ui_theme
    end

    test "normalise_ui_theme accepts only known themes" do
      assert_equal 'cyberpunk', Mission.normalise_ui_theme('cyberpunk')
      assert_nil Mission.normalise_ui_theme('"><script>')
      assert_nil Mission.normalise_ui_theme(nil)
    end
  end
end
