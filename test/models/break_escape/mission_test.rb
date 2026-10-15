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
  end
end
