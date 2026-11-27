#!/usr/bin/env ruby
# Compare two dump_tts_keys.rb output dirs against an allow-list of expected key moves (plan 5.2).
#
#   ruby tools/phone_calls/compare_tts_keys.rb <baseline_dir> <new_dir> [allow_file]
#
# Every moved key is printed under its scenario (`-` removed, `+` added), with its line when a
# dump made with TTS_DUMP_LABELS=1 sits in that dir (<dir>/_labels/<scenario>.tsv: key, npc id,
# text, note). Exits 1 when a scenario moves keys it was not allowed to, or an allowed move did
# not happen, or a scenario is in only one dir without an allowance.
#
# allow_file, one entry per line, `#` starts a comment:
#   <scenario> <removed> <added>      counts only (the weak form: any keys, as many as that)
#   <scenario> -key <hash>            exactly this key is removed
#   <scenario> +key <hash>            exactly this key is added
#   <scenario> -line <npc_id>|<text>  the key of that line is removed (needs labels in the baseline dir)
#   <scenario> +line <npc_id>|<text>  the key of that line is added (needs labels in the new dir)
#   added-scenario <name>             the scenario is new in the new dir (all its keys are additions)
#   removed-scenario <name>           the scenario is gone from the new dir
# A scenario with any -key/+key/-line/+line entry is held to exactly those moves (the counts form
# is then ignored for it). A scenario with no entry must not move at all.
require 'set'
base, now, allow_file = ARGV
abort 'usage: compare_tts_keys.rb <baseline_dir> <new_dir> [allow_file]' unless base && now

Allowance = Struct.new(:counts, :rem_keys, :add_keys, :rem_lines, :add_lines) do
  def exact?
    [rem_keys, add_keys, rem_lines, add_lines].any?(&:any?)
  end
end
allow = Hash.new { |h, k| h[k] = Allowance.new(nil, Set.new, Set.new, Set.new, Set.new) }
added_scenarios = Set.new
removed_scenarios = Set.new
if allow_file
  File.readlines(allow_file).each do |l|
    l = l.sub(/#.*/, '').strip
    next if l.empty?

    name, a, b = l.split(/\s+/, 3)
    case name
    when 'added-scenario' then added_scenarios << a
    when 'removed-scenario' then removed_scenarios << a
    else
      case a
      when '-key' then allow[name].rem_keys << b
      when '+key' then allow[name].add_keys << b
      when '-line' then allow[name].rem_lines << b
      when '+line' then allow[name].add_lines << b
      else allow[name].counts = [a.to_i, b.to_i]
      end
    end
  end
end

def read_keys(dir, file)
  File.readlines(File.join(dir, file), chomp: true)
end

# key -> "npc_id|text" (and a note), from <dir>/_labels/<scenario>.tsv, or {}
def read_labels(dir, scenario)
  path = File.join(dir, '_labels', "#{scenario}.tsv")
  return {} unless File.exist?(path)

  File.readlines(path, chomp: true).to_h do |l|
    key, npc, text, note = l.split("\t", 4)
    [key, { line: "#{npc}|#{text}", shown: "#{npc}|#{text}#{note.to_s.empty? ? '' : "  [#{note}]"}" }]
  end
end

names = (Dir.children(base) | Dir.children(now)).select { |f| f.end_with?('.txt') && f != '_index.txt' }.sort
bad = false
names.each do |f|
  scenario = f.sub(/\.txt\z/, '')
  in_base = File.exist?(File.join(base, f))
  in_now = File.exist?(File.join(now, f))
  unless in_base && in_now
    if in_now && added_scenarios.include?(scenario)
      puts "allowed #{scenario}: new scenario, #{read_keys(now, f).size} keys"
    elsif in_base && removed_scenarios.include?(scenario)
      puts "allowed #{scenario}: scenario removed, #{read_keys(base, f).size} keys"
    else
      puts "MISSING #{scenario}: only in #{in_base ? base : now} (allow it with `#{in_base ? 'removed' : 'added'}-scenario #{scenario}`)"
      bad = true
    end
    next
  end
  a = read_keys(base, f)
  b = read_keys(now, f)
  removed = a - b
  added = b - a
  al = allow[scenario]
  next if removed.empty? && added.empty? && !al.exact? && (al.counts || [0, 0]) == [0, 0]

  lab_base = read_labels(base, scenario)
  lab_now = read_labels(now, scenario)
  show = lambda do |sign, key, labels|
    info = labels[key]
    puts "    #{sign} #{key}  #{info ? info[:shown] : '(no label: dump with TTS_DUMP_LABELS=1)'}"
  end
  problems = []
  if al.exact?
    bad_rem = removed.reject { |k| al.rem_keys.include?(k) || (lab_base[k] && al.rem_lines.include?(lab_base[k][:line])) }
    bad_add = added.reject { |k| al.add_keys.include?(k) || (lab_now[k] && al.add_lines.include?(lab_now[k][:line])) }
    problems << "removed but not allowed: #{bad_rem.size}" if bad_rem.any?
    problems << "added but not allowed: #{bad_add.size}" if bad_add.any?
    miss_rem = al.rem_keys.reject { |k| removed.include?(k) } +
               al.rem_lines.reject { |ln| removed.any? { |k| lab_base[k] && lab_base[k][:line] == ln } }
    miss_add = al.add_keys.reject { |k| added.include?(k) } +
               al.add_lines.reject { |ln| added.any? { |k| lab_now[k] && lab_now[k][:line] == ln } }
    problems << "allowed removal did not happen: #{miss_rem.join(', ')}" if miss_rem.any?
    problems << "allowed addition did not happen: #{miss_add.join(', ')}" if miss_add.any?
  else
    want = al.counts || [0, 0]
    problems << "allowed #{want.join('/')}" unless [removed.size, added.size] == want
  end
  ok = problems.empty?
  bad ||= !ok
  puts "#{ok ? 'allowed' : 'UNEXPECTED'} #{scenario}: #{removed.size} removed, #{added.size} added#{ok ? '' : " (#{problems.join('; ')})"}"
  removed.each { |k| show.call('-', k, lab_base) }
  added.each { |k| show.call('+', k, lab_now) }
end
puts bad ? 'FAIL' : "OK: #{names.size} scenarios"
exit(bad ? 1 : 0)
