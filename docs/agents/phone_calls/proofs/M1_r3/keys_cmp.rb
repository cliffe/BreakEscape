require 'json'; require 'erb'
sp = ARGV[0]; name = 'm09_digital_archaeology'
inkdir = BreakEscape::Engine.root.join('scenarios', name, 'ink').to_s
dump = lambda do |erb_path, redirect|
  data = JSON.parse(ERB.new(File.read(erb_path)).result(BreakEscape::Mission::ScenarioBinding.new({}).get_binding))
  ex = BreakEscape::TtsLineExtractor.new(name, data)
  if redirect
    ex.define_singleton_method(:resolve_ink_path) do |story|
      p = super(story); p && p.to_s.start_with?(inkdir) ? File.join(redirect, File.basename(p.to_s)) : p
    end
  end
  ex.entries.map { |e| [e.key, e.npc_id, e.text.to_s] }.uniq
end
a = dump.call(File.join(sp, 'scenario.json.erb'), File.join(sp, 'ink'))
b = dump.call(BreakEscape::Engine.root.join('scenarios', name, 'scenario.json.erb').to_s, nil)
ka = a.map(&:first).uniq; kb = b.map(&:first).uniq
puts "parent keys: #{ka.size}  HEAD keys: #{kb.size}"
(ka - kb).each { |k| puts "- #{a.find { |r| r[0] == k }.inspect}" }
(kb - ka).each { |k| puts "+ #{b.find { |r| r[0] == k }.inspect}" }
