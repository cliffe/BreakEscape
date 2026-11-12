# Dump TtsLineExtractor keys for every scenario with a phone NPC (plan 5.2, key identity rule).
#
#   BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/phone_calls/dump_tts_keys.rb <outdir>
#
# Writes <outdir>/<scenario>.txt (sorted keys, one per line) and <outdir>/_index.txt
# (scenario, phone NPC ids, key count). Compare two dirs with `diff -r`.
require 'json'
require 'erb'
out = ARGV[0] or abort 'usage: dump_tts_keys.rb <outdir>'
FileUtils.mkdir_p(out)
index = []
Dir.glob(BreakEscape::Engine.root.join('scenarios', '*', 'scenario.json.erb').to_s).sort.each do |erb|
  name = File.basename(File.dirname(erb))
  begin
    data = JSON.parse(ERB.new(File.read(erb)).result(BreakEscape::Mission::ScenarioBinding.new({}).get_binding))
  rescue StandardError => e
    warn "skip #{name}: #{e.class}"
    next
  end
  phones = []
  walk = lambda do |o|
    case o
    when Hash
      phones << o['id'] if o['npcType'] == 'phone' && o['id']
      o.each_value { |v| walk.call(v) }
    when Array then o.each { |v| walk.call(v) }
    end
  end
  walk.call(data['rooms'] || {})
  walk.call(data['npcs'] || [])
  next if phones.empty?

  keys = BreakEscape::TtsLineExtractor.new(name, data).keys.to_a.sort
  File.write(File.join(out, "#{name}.txt"), keys.join("\n") + "\n")
  index << "#{name}\t#{phones.uniq.sort.join(',')}\t#{keys.size}"
end
File.write(File.join(out, '_index.txt'), index.join("\n") + "\n")
puts index
