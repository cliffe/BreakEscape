# usage (from the repo root): ruby scenarios/lab_tesseract_trials/tools/render_scenario.rb <out.json> [seed]   - renders the scenario ERB the way the game does
# Plan step 5: one binding for every renderer. Renders through the server's BreakEscape::ScenarioBinding.
require 'json'
require_relative '../../../lib/break_escape/scenario_binding'
srand(ARGV[1].to_i) if ARGV[1]
out = BreakEscape::ScenarioBinding.render(File.read('scenarios/lab_tesseract_trials/scenario.json.erb'), {})
File.write(ARGV[0], JSON.pretty_generate(JSON.parse(out)))
