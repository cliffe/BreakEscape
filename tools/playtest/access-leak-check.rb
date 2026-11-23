# Checks what reached the browser during an access model playtest
# (docs/achitechture/ACCESS_MODEL_PLAN.md, "How the slice is tested" and step 6).
#
#   BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/access-leak-check.rb <game_id> <responses.jsonl> [more.jsonl ...]
#
# The responses file is what playtest-session.js --capture-responses wrote. Several files
# (a run split across sessions) are read in the order given. The secrets are read from the
# game's own scenario data on the server, so the tester never sees them, and no output line
# holds a secret's value: each finding names the rule, the route, the response line and the
# secret's owner (an NPC or item id). A session resumed in a new browser starts a new capture file:
# give EVERY capture file of that game, oldest first, because the sweep, scans and checks the later
# file's answers rely on were earned in the earlier ones (ops core S2 PT2). A resumed file judged
# alone reports its own network answers as leaks. See tools/playtest/lib/access_leak_scanner.rb for the rules.
#
# A line {"dom": "<page text>", "label": "<what>"} in a file is the text of a page the tester read
# (the capture log device: eval `() => document.querySelector('.capture-log')?.innerText`), checked
# like a /capture_secrets answer when its label names a capture page (CAPTURE_PAGE_LABEL in the
# scanner: the word capture or captures not joined to a letter or digit, so capture_log passes and
# recapture or an accented join does not; any other
# page, such as a device console, is scanned in full). A password passes there, and in
# /capture_secrets, only for an account the server would serve now (its capture proofs applied,
# engine plan section 6).
#
# Order of the plant (PHYSICAL_PENTEST_DEVICES_PLAN.md E0.3): every file given is one log, read
# in argument order. A capture secret, or an account password whose proofs include a plant on a
# room object, passes on a capture route only after the tagged POST /inventory plant row. DOM
# rows carry no `n`, so pass each DOM file after the response files it was read beside: a DOM
# file passed first sits before the plant row and is flagged. Logs written before the recorder
# tagged POST /inventory rows (`inv`) are judged by the old rules.
#
# "Now" is when this check runs, not when the response was taken. Proofs only grow, so a
# /capture_secrets answer that served a password before its proof held (the bug this exception
# must not hide) passes once the proof holds later. A single check at the end of a run cannot see
# that order: run the check after every beat, over the responses so far (as the playtest-scenario
# skill says), so each capture answer is judged against the proofs that held at that beat.
#
# Technique grants (ops core S3) are judged per thing: a credential by its finding, a session by its host. The capture
# does not hold the technique request, so the scanner reads the finding from the answer (a grant that two findings could
# have made is credited only for a finding confirmed in the log and not granted yet; otherwise nothing is credited).
# See the header of tools/playtest/lib/access_leak_scanner.rb.
#
# Exit status: 0 when nothing leaked, 1 on any finding, 2 on a usage error or files whose first timed rows are not oldest first
# (a glob such as responses-N*.jsonl sorts -2 before the first file: name them in order).
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
per_file = []
files.each do |file|
  label = File.basename(file)
  per_file << [label, []]
  File.foreach(file).with_index(1) do |text, line_no|
    next if text.strip.empty?

    begin
      lines << [label, line_no, JSON.parse(text)]
      per_file.last[1] << lines.last[2]
    rescue JSON::ParserError
      unreadable += 1
    end
  end
end

order_problem = AccessLeakScanner.file_order_problem(per_file)
if order_problem
  warn "capture files out of order (a shell glob puts -2 before the first file): #{order_problem}"
  exit 2
end

findings = scanner.scan(lines)
counts = scanner.counts

puts "access leak check: game #{game.id} (mission #{game.mission_id}), #{lines.length} responses from #{files.length} file(s)"
puts "unreadable lines #{unreadable}" if unreadable.positive?
puts "secrets checked  #{counts[:passwords]} NPC password(s), #{counts[:login_items]} sign-in PC or profile item(s), " \
     "#{counts[:locked_items]} locked-container item(s), #{counts[:stick_items]} USB stick file(s), #{counts[:workarounds]} workaround(s), " \
     "#{counts[:feed_posts]} feed post(s) (#{counts[:feed_texts]} text(s)), #{counts[:feed_facts]} feed fact(s), #{counts[:reaction_items]} reaction item(s), " \
     "#{counts[:lockout_records]} recorded lockout(s)"
by_rule = findings.group_by(&:rule)
AccessLeakScanner::RULE_TEXT.each do |rule, text|
  puts "#{rule.ljust(20)} #{(by_rule[rule] || []).length}  (#{text})"
end
scanner.report_lines(findings).each { |line| puts line }
scanner.ops_notes.each { |line| puts "note             #{line}" }
unless scanner.feed_fallback.empty?
  puts "note             feed posts for #{scanner.feed_fallback.join(', ')} judged partly by the game's saved feedRevealed: " \
       'fewer /feed_post answers in the log than the game revealed (a resumed game or a lost response body)'
end
unless scanner.feed_ruled_out.empty?
  puts "note             feed posts for #{scanner.feed_ruled_out.join(', ')}: no lost /feed_post answer in the log could be theirs " \
       '(at least one was tagged for another NPC), so their missing reveals count from the first line: a resumed game or a ' \
       'response the capture missed. Check that the log began after their reveals'
end
if scanner.feed_tags_ignored
  puts 'note             a readable /feed_post answer named another NPC than its npcId tag, so every npcId tag in the log ' \
       'was ignored and lost answers were judged by the old rule'
end
unless scanner.feed_unknown.empty?
  puts "note             feed posts for #{scanner.feed_unknown.join(', ')} allowed one more reveal at each /feed_post " \
       'answer whose body the log lost, from that answer on only, and none at an answer captured after the ' \
       "NPC's last saved reveal or tagged with another NPC's npcId"
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
