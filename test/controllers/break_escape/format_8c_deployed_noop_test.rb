require 'test_helper'

# Step 8c: the real `habits_in_one_block` transform (not a stub) must be a no-op on the four scenarios
# played on Hacktivity. None authors `screenHabit`, `printHabit` or `usbHabit`, and none carries
# `awareness` or `habits.locksScreen`, so the raw render holds no habit key for the fold to move and
# the loader fills none either (stronger than 8a/8b). The deployed-scenarios step-7 test
# (format_deployed_scenarios_test.rb) stubs FormatUpgrade.steps, so it never exercises the real
# transform; this test renders each deployed scenario and applies FormatUpgrade::STEP_8C directly, then
# upgrades fully and checks the only change is the formatVersion stamp to 3. If a future edit gives a
# deployed scenario a habit key or an awareness level, this turns red and the habit work must cover it.
module BreakEscape
  class Format8cDeployedNoopTest < ActiveSupport::TestCase
    FU = BreakEscape::FormatUpgrade
    DEPLOYED = %w[m01_first_contact sis01_healthcare sis02_energy lab_social_engineering].freeze

    def deployed_mission(name)
      Mission.find_or_create_by!(name: name) do |m|
        m.display_name     = name
        m.published        = true
        m.difficulty_level = 1
      end
    end

    # The raw render a game holds, rendered through the real Mission::ScenarioBinding.
    def raw_render(name)
      srand(1)
      deployed_mission(name).generate_scenario_data({})
    end

    # Recursively collect the values of `key` on every Hash in the data.
    def values_of(node, key, out = [])
      case node
      when Array then node.each { |n| values_of(n, key, out) }
      when Hash
        out << node[key] if node.key?(key)
        node.each_value { |v| values_of(v, key, out) }
      end
      out
    end

    DEPLOYED.each do |name|
      test "#{name}: the real 8c scenario transform is a no-op and the fold has nothing to move" do
        data = raw_render(name)

        # Precondition: none of the three keys is authored, and no awareness / habits.locksScreen is
        # present, so the loader would fill no screenHabit either.
        %w[screenHabit printHabit usbHabit awareness].each do |key|
          assert_empty values_of(data, key), "#{name}: unexpected '#{key}' in the deployed render"
        end
        assert_empty values_of(data, 'habits').compact.select { |h| h.is_a?(Hash) && h.key?('locksScreen') },
                     "#{name}: a habits.locksScreen is present in the deployed render"

        before = Marshal.dump(data)
        copy = Marshal.load(before)
        FU::STEP_8C[:scenario].call(copy)
        assert_equal data, copy, "#{name}: the 8c habit transform changed deployed scenario data"

        # A full upgrade stamps format 3 and still changes no habit data.
        upgraded = Marshal.load(before)
        state = {}
        FU.upgrade!(upgraded, state)
        assert_equal 3, upgraded['formatVersion']
        assert_empty FU.retired_keys_in(upgraded), "#{name}: a retired key is present after the upgrade"
        upgraded.delete('formatVersion')
        assert_equal data, upgraded, "#{name}: the full upgrade changed deployed scenario data beyond the stamp"
      end
    end
  end
end
