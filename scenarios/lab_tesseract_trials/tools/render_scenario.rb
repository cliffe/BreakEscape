# usage (from the repo root): ruby scenarios/lab_tesseract_trials/tools/render_scenario.rb <out.json> [seed]   - renders the scenario ERB the way the game does
require 'erb'; require 'json'; require 'securerandom'; require 'base64'
class ScenarioBinding
  def initialize; @random_password = SecureRandom.alphanumeric(8); @random_pin = rand(1000..9999).to_s; @random_code = SecureRandom.hex(4); @vm_context = {}; end
  def vm_object(_t, f = {}); f.to_json; end
  def flags_for_vm(_n, f = []); f.to_json; end
  def vm_flags_json(_n, f = []); f.to_json; end
  def get_binding; binding; end
end
srand(ARGV[1].to_i) if ARGV[1]
erb = ERB.new(File.read('scenarios/lab_tesseract_trials/scenario.json.erb'))
out = erb.result(ScenarioBinding.new.get_binding)
File.write(ARGV[0], JSON.pretty_generate(JSON.parse(out)))
