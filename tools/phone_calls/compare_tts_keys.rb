#!/usr/bin/env ruby
# Compare two dump_tts_keys.rb output dirs against an allow-list of expected key moves (plan 5.2).
#
#   ruby tools/phone_calls/compare_tts_keys.rb <baseline_dir> <new_dir> [allow_file]
#
# allow_file: one line per scenario, `<scenario> <keys removed> <keys added>` (default 0 0 for a
# scenario not listed); `#` starts a comment. Exits 1 when any scenario's removed or added count
# differs from its allowance, or a scenario is in only one dir. Prints every moved key's file.
base, now, allow_file = ARGV
abort 'usage: compare_tts_keys.rb <baseline_dir> <new_dir> [allow_file]' unless base && now

allow = Hash.new { [0, 0] }
if allow_file
  File.readlines(allow_file).each do |l|
    l = l.sub(/#.*/, '').strip
    next if l.empty?

    name, rem, add = l.split
    allow[name] = [rem.to_i, add.to_i]
  end
end

names = (Dir.children(base) | Dir.children(now)).select { |f| f.end_with?('.txt') && f != '_index.txt' }.sort
bad = false
names.each do |f|
  scenario = f.sub(/\.txt\z/, '')
  unless File.exist?(File.join(base, f)) && File.exist?(File.join(now, f))
    puts "MISSING #{scenario}: only in #{File.exist?(File.join(base, f)) ? base : now}"
    bad = true
    next
  end
  a = File.readlines(File.join(base, f), chomp: true)
  b = File.readlines(File.join(now, f), chomp: true)
  removed = (a - b).size
  added = (b - a).size
  next if [removed, added] == [0, 0] && allow[scenario] == [0, 0]

  ok = [removed, added] == allow[scenario]
  bad ||= !ok
  puts "#{ok ? 'allowed' : 'UNEXPECTED'} #{scenario}: #{removed} removed, #{added} added (allowed #{allow[scenario].join('/')})"
end
puts bad ? 'FAIL' : "OK: #{names.size} scenarios"
exit(bad ? 1 : 0)
