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
# A line {"dom": "<page text>", "label": "<what>"} in a file is the text of a page the tester read
# (the capture log device: eval `() => document.querySelector('.capture-log')?.innerText`), checked
# like a /capture_secrets answer. A password passes there, and in /capture_secrets, only for an
# account the server would serve now (its capture proofs applied, engine plan section 6).
#
# "Now" is when this check runs, not when the response was taken. Proofs only grow, so a
# /capture_secrets answer that served a password before its proof held (the bug this exception
# must not hide) passes once the proof holds later. A single check at the end of a run cannot see
# that order: run the check after every beat, over the responses so far (as the playtest-scenario
# skill says), so each capture answer is judged against the proofs that held at that beat.
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
usernames = game.account_capture_passwords.keys
served = BreakEscape::Game.scenario_room_npcs(game.scenario_data || {}).select do |npc|
  BreakEscape::Game.account_holder?(npc) &&
    usernames.include?(BreakEscape::Game.normalise_username(npc['creds']['username']))
end.map { |npc| npc['id'] }
scanner = AccessLeakScanner.new(game.scenario_data || {}, served_npcs: served, game: game)

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
     "#{counts[:locked_items]} locked-container item(s), #{counts[:workarounds]} workaround(s), " \
     "#{counts[:feed_posts]} feed post(s), #{counts[:feed_facts]} feed fact(s), #{counts[:lockout_records]} recorded lockout(s)"
by_rule = findings.group_by(&:rule)
AccessLeakScanner::RULE_TEXT.each do |rule, text|
  puts "#{rule.ljust(20)} #{(by_rule[rule] || []).length}  (#{text})"
end
scanner.report_lines(findings).each { |line| puts line }
unless scanner.feed_fallback.empty?
  puts "note             feed posts for #{scanner.feed_fallback.join(', ')} judged partly by the game's saved feedRevealed: " \
       'fewer /feed_post answers in the log than the game revealed (a resumed game or a lost response body)'
end
unless scanner.feed_unknown.empty?
  puts "note             feed posts for #{scanner.feed_unknown.join(', ')} allowed one more reveal at each /feed_post " \
       'answer whose body the log lost, from that answer on only, and none at an answer captured after the ' \
       "NPC's last saved reveal"
end
if lines.any? { |_label, _no, row| row.is_a?(Hash) && (row.key?('dom') || row['path'].to_s.split('?').first.to_s.end_with?('/capture_secrets')) }
  puts 'note             capture answers judged against the proofs held now: run this after every beat to see order'
end
puts
if findings.empty?
  puts 'VERDICT: no leaks found.'
else
  puts "VERDICT: #{findings.length} finding(s). Each names its route, response line and owner, never the value."
  exit 1
end
