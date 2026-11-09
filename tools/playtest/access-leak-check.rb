# Checks what reached the browser during an access model playtest
# (docs/achitechture/ACCESS_MODEL_PLAN.md, "How the slice is tested" and step 6).
#
#   BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/access-leak-check.rb <game_id> <responses.jsonl> [more.jsonl ...]
#
# The responses file is what playtest-session.js --capture-responses wrote. Several files
# (a run split across sessions) are read in the order given. The secrets are read from the
# game's own scenario data on the server, so the tester never sees them, and no output line
# holds a secret's value: each finding names the rule, the route, the response line and the
# secret's owner (an NPC or item id). See tools/playtest/lib/access_leak_scanner.rb for the rules.
#
# Exit status: 0 when nothing leaked, 1 on any finding, 2 on a usage error.
require_relative 'lib/access_leak_scanner'

game_id, *files = ARGV
if game_id.nil? || files.empty?
  warn 'usage: access-leak-check.rb <game_id> <responses.jsonl> [more.jsonl ...]'
  exit 2
end
missing = files.reject { |f| File.file?(f) }
unless missing.empty?
  warn "no such responses file: #{missing.join(', ')}"
  exit 2
end

game = BreakEscape::Game.find(game_id)
scanner = AccessLeakScanner.new(game.scenario_data || {})

lines = []
unreadable = 0
files.each do |file|
  label = File.basename(file)
  File.foreach(file).with_index(1) do |text, line_no|
    next if text.strip.empty?

    begin
      lines << [label, line_no, JSON.parse(text)]
    rescue JSON::ParserError
      unreadable += 1
    end
  end
end

findings = scanner.scan(lines)
counts = scanner.counts

puts "access leak check: game #{game.id} (mission #{game.mission_id}), #{lines.length} responses from #{files.length} file(s)"
puts "unreadable lines #{unreadable}" if unreadable.positive?
puts "secrets checked  #{counts[:passwords]} NPC password(s), #{counts[:login_items]} sign-in PC or profile item(s), " \
     "#{counts[:locked_items]} locked-container item(s)"
by_rule = findings.group_by(&:rule)
AccessLeakScanner::RULE_TEXT.each do |rule, text|
  puts "#{rule.ljust(16)} #{(by_rule[rule] || []).length}  (#{text})"
end
scanner.report_lines(findings).each { |line| puts line }
puts
if findings.empty?
  puts 'VERDICT: no leaks found.'
else
  puts "VERDICT: #{findings.length} finding(s). Each names its route, response line and owner, never the value."
  exit 1
end
