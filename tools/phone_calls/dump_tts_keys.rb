# Dump TtsLineExtractor keys for every scenario with a phone NPC (plan 5.2, key identity rule).
#
#   BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/phone_calls/dump_tts_keys.rb <outdir>
#
# Writes <outdir>/<scenario>.txt (sorted keys, one per line) and <outdir>/_index.txt
# (scenario, phone NPC ids, key count). Compare two dirs with `diff -r`, or with
# tools/phone_calls/compare_tts_keys.rb, which takes an allow-list of expected moves.
#
#   TTS_DUMP_CHATTER=1   also list bark and chatter keys (the extractor's `chatter: true`); a dump made
#                        with it is only comparable with another made with it (keys_baseline_a1/ is).
#   TTS_DUMP_LABELS=1    also write <outdir>/_labels/<scenario>.tsv (key, npc id, text, delivery note) for the
#                        keys that have a line, so compare_tts_keys.rb can say which lines moved. It adds
#                        files, so `diff -r` of a labelled dump against an unlabelled one lists _labels.
#
# A scenario that fails to render is an error: the script finishes the others, then exits 1.
require 'json'
require 'erb'
out = ARGV[0] or abort 'usage: dump_tts_keys.rb <outdir>'
FileUtils.mkdir_p(out)
chatter = ENV['TTS_DUMP_CHATTER'] == '1'
index = []
skipped = []
Dir.glob(BreakEscape::Engine.root.join('scenarios', '*', 'scenario.json.erb').to_s).sort.each do |erb|
  name = File.basename(File.dirname(erb))
  begin
    data = JSON.parse(ERB.new(File.read(erb)).result(BreakEscape::Mission::ScenarioBinding.new({}).get_binding))
  rescue StandardError => e
    warn "SKIPPED #{name}: #{e.class}: #{e.message[0, 200]}"
    skipped << name
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

  extractor = BreakEscape::TtsLineExtractor.new(name, data, **(chatter ? { chatter: true } : {}))
  keys = extractor.keys.to_a.sort
  if ENV['TTS_DUMP_LABELS'] == '1'
    FileUtils.mkdir_p(File.join(out, '_labels'))
    rows = extractor.entries.map { |e| [e.key, e.npc_id, e.text.to_s.gsub(/[\t\r\n]+/, ' '), e.delivery.to_s.gsub(/[\t\r\n]+/, ' ')].join("\t") }
    File.write(File.join(out, '_labels', "#{name}.tsv"), rows.sort.join("\n") + "\n")
  end
  File.write(File.join(out, "#{name}.txt"), keys.join("\n") + "\n")
  index << "#{name}\t#{phones.uniq.sort.join(',')}\t#{keys.size}"
end
File.write(File.join(out, '_index.txt'), index.join("\n") + "\n")
puts index
if skipped.any?
  warn "#{skipped.size} scenario(s) skipped: #{skipped.join(', ')}"
  exit 1
end
