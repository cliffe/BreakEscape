# Prints, for each pad's typed digits, ONLY yes/no: is it a prefix of any PIN in the m07 scenario, and does any typed digit equal a PIN digit at the same position. Never prints a code.
# Usage (repo root): ruby tools/video/takes/m07/check_digits.rb      Pads are read from PAD in _c7.mjs.
$LOAD_PATH.unshift 'lib'; ENV['LANG'] = 'C.UTF-8'
require 'json'; require_relative '../../../../lib/break_escape/scenario_binding'
d = JSON.parse(BreakEscape::ScenarioBinding.render(File.read(Dir['scenarios/m07_*/scenario.json.erb'].first), {}))
codes = []
walk = ->(o) { case o when Hash then (codes << o['requires'].to_s if o['lockType'] == 'pin' && o['requires']); o.each_value { |v| walk.(v) } when Array then o.each { |v| walk.(v) } end }
walk.(d)
src = File.read(File.join(__dir__, '_c7.mjs'))[/PAD = \{(.*?)\}/m, 1]
src.scan(/(\w+): \[([^\]]*)\]/).each do |name, list|
  t = list.scan(/'(\d)'/).flatten.join
  pre = codes.any? { |c| c.start_with?(t) }; pos = codes.any? { |c| t.chars.each_with_index.any? { |ch, i| c[i] == ch } }
  puts "#{name}: #{t.length} digits; prefix of any PIN: #{pre ? 'yes' : 'no'}; same digit at same position as any PIN: #{pos ? 'yes' : 'no'}"
end
puts "(#{codes.length} PIN locks checked)"
