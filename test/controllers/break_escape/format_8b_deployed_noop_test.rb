require 'test_helper'

# Step 8b: the real `one_owner_field` transform (not a stub) must be a no-op on the four scenarios
# played on Hacktivity. They carry none of the retired owner keys and no workstation with an explicit
# owner or an NPC's needsHome, so the rename finds nothing and the derivation adds nothing. The
# deployed-scenarios step-7 test (format_deployed_scenarios_test.rb) stubs FormatUpgrade.steps, so it
# never exercises the real transform; this test renders each deployed scenario and applies
# FormatUpgrade::STEP_8B directly (plan step 8b, and the chunk-1 handover note asking chunk 4 to prove
# it). If a future edit gives a deployed scenario an owner key or a needsHome workstation, this turns
# red and the owner work must cover that scenario.
module BreakEscape
  class Format8bDeployedNoopTest < ActiveSupport::TestCase
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

    DEPLOYED.each do |name|
      test "#{name}: the real 8b scenario transform is a no-op" do
        data = raw_render(name)
        before = Marshal.dump(data)
        copy = Marshal.load(before)
        FU::STEP_8B[:scenario].call(copy)

        assert_equal data, copy, "#{name}: the 8b owner transform changed deployed scenario data"
        assert_empty FU.retired_keys_in(data), "#{name}: a retired owner key is present"
      end
    end
  end
end
