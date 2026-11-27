# Render a scenario template to pretty JSON (plan step 5: one binding for every renderer).
# This renders through the server's BreakEscape::ScenarioBinding, so vm_object, flags_for_vm and
# vm_flags_json behave as the server builds them, not the drifted local copies this file carried.
# It loses trim_mode: '-' with the move; no scenario template uses -%>.
require "json"
require_relative "../../lib/break_escape/scenario_binding"
src, out = ARGV
File.write(out, JSON.pretty_generate(JSON.parse(BreakEscape::ScenarioBinding.render(File.read(src), {}))))
