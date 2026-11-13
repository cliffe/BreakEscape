# Voiced-line dump for a mission: every line the batch TTS generator would voice (BreakEscape::TtsLineExtractor), one row per line,
# with the npc id the client sends to /tts, the ink file and path, the knot, the word count and the voice name.
#   export LANG=C.UTF-8 LC_ALL=C.UTF-8 BUNDLE_FORCE_RUBY_PLATFORM=true BE_DB_USER=root
#   bin/rails runner tools/video/scout/dump-lines.rb <mission> <out.json> [--max-words N]
# <mission> is the scenario folder name (m02_ransomed_trust). Writes <out.json> (full entries) and <out.tsv> (npc, words, knot, ink path, text), and prints a per-NPC count.
# This is the pool only: filtering for spoilers and reachability is the scout's judgement, and a line has audio only if tools/video/scout/tts-test.mjs says so.
require 'json'
args = ARGV.dup
max = (i = args.index('--max-words')) ? args.slice!(i, 2).last.to_i : nil
mission, out = args
abort 'usage: bin/rails runner tools/video/scout/dump-lines.rb <mission> <out.json> [--max-words N]' unless mission && out

ex = BreakEscape::TtsLineExtractor.for_scenario(mission)
rows = ex.entries.map do |e|
  { npc_id: e.npc_id, text: e.text, words: e.text.split.size, voice: e.voice.is_a?(Hash) ? e.voice['name'] : e.voice,
    source: e.source, knot: e.path.to_s[/:root\.([^.\[(]+)/, 1], path: e.path }
end
rows.select! { |r| r[:words] <= max } if max
File.write(out, JSON.pretty_generate(rows))
File.write(out.sub(/\.json\z/, '') + '.tsv', rows.map { |r| [r[:npc_id], r[:words], r[:knot], r[:path], r[:text].gsub(/\s+/, ' ')].join("\t") }.join("\n") + "\n")
rows.group_by { |r| r[:npc_id] }.sort.each { |npc, l| puts format('%-28s %4d lines', npc, l.size) }
puts "#{rows.size} lines -> #{out}"
