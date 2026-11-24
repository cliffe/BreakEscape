require 'test_helper'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

# Ops log reader L2a R2 S6 (OPS_LOG_ROWS_PLAN.md sections 7 and 11): the `log_row` rule of the leak
# scanner over GET /log_rows answers.
class AccessLeakScannerLogRowsTest < ActiveSupport::TestCase
  PATH = '/break_escape/games/1/log_rows'.freeze
  LOCK_PIN = '48151623'.freeze
  PASSWORD = 'Ledger-Dana-7'.freeze

  def scenario
    { 'rooms' => {
      'lobby' => { 'door_sign' => 'Lobby', 'objects' => [{ 'type' => 'keycard', 'id' => 'dana_card', 'card_id' => 'FIN-DANA-01', 'name' => 'Dana badge' }] },
      'office' => { 'door_sign' => 'Finance office',
                    'npcs' => [{ 'id' => 'dana', 'displayName' => 'Dana Reyes', 'creds' => { 'username' => 'dreyes', 'password' => PASSWORD } }],
                    'objects' => [{ 'type' => 'pc', 'id' => 'office_pc', 'name' => 'Office PC' }] }
    } }
  end

  def good_row(overrides = {})
    { 'id' => 'a1b2c3d4e5', 'elapsedMs' => 1000, 'event' => 'BADGE', 'as' => 'Dana Reyes', 'where' => 'Finance office',
      'result' => 'OK', 'detail' => '' }.merge(overrides)
  end

  def answer(*rows, extra: {})
    { 'rev' => 'abc123', 'title' => 'Door controller', 'rows' => rows }.merge(extra)
  end

  def scan(body, path: PATH, secrets: [LOCK_PIN])
    row = { 'method' => 'GET', 'path' => path, 'status' => 200, 'body' => body }
    AccessLeakScanner.new(scenario, log_secrets: secrets).scan([['r.jsonl', 1, row]])
  end

  def owners(findings)
    findings.map { |f| [f.rule, f.owner] }
  end

  test 'a clean answer, an unchanged answer and the one 404 are not findings' do
    assert_empty scan(answer(good_row, good_row('as' => '-', 'where' => 'Office PC', 'detail' => 'route: keyboard, method: password')))
    assert_empty scan({ 'rev' => 'abc123', 'unchanged' => true })
    assert_empty scan({ 'success' => false, 'reason' => 'not_found' })
  end

  test 'a registered log secret in any text cell or the title is a finding, and the finding never holds its value' do
    findings = scan(answer(good_row('detail' => "code: #{LOCK_PIN}")))
    assert_equal [%w[log_row log:secret]], owners(findings)
    assert_equal [%w[log_row log:secret]], owners(scan(answer(good_row('where' => LOCK_PIN))))
    assert_equal [%w[log_row log:secret]], owners(scan(answer(good_row).merge('title' => "x #{LOCK_PIN}")))
    out = AccessLeakScanner.new(scenario, log_secrets: [LOCK_PIN]).report_lines(findings)
    assert_not_includes out.join, LOCK_PIN
  end

  test 'a short registered secret matches a whole cell only, so a hex row id or a time is not a hit' do
    assert_empty scan(answer(good_row('id' => 'a15555b2c3', 'elapsedMs' => 5555)), secrets: ['5555'])
    assert_equal [%w[log_row log:secret]], owners(scan(answer(good_row('detail' => 'pin: 5555')), secrets: ['5555']))
  end

  test 'what a player typed into a username box is not judged: a SIGN_IN identity may hold a password' do
    typed = good_row('event' => 'SIGN_IN', 'as' => PASSWORD, 'where' => 'Office PC', 'result' => 'FAIL')
    assert_empty scan(answer(typed), secrets: [PASSWORD, LOCK_PIN])
    badge = good_row('as' => PASSWORD)
    assert_equal [%w[password npc:dana]], owners(scan(answer(badge), secrets: [PASSWORD]).select { |f| f.rule == 'password' }),
                 'the same text in the identity of any other row is judged'
    assert_includes owners(scan(answer(badge), secrets: [PASSWORD])), %w[log_row log:secret]
    assert_equal [%w[log_row log:secret]], owners(scan(answer(typed.merge('detail' => "pin: #{LOCK_PIN}")), secrets: [LOCK_PIN]))
  end

  test 'a successful sign-in identity is judged, a typed one is not (the server rows: signin_ok has method and route)' do
    ok = good_row('event' => 'SIGN_IN', 'where' => 'Office PC', 'detail' => 'method: password, route: keyboard')
    assert_empty scan(answer(ok.merge('as' => 'dreyes')), secrets: [PASSWORD])
    assert_equal [%w[log_row log:secret]], owners(scan(answer(ok.merge('as' => PASSWORD)), secrets: [PASSWORD]).select { |f| f.rule == 'log_row' })
    assert_equal [%w[log_row log:raw_id:dana]], owners(scan(answer(ok.merge('as' => 'dana'))))
    lockout = good_row('event' => 'SIGN_IN', 'as' => PASSWORD, 'where' => 'Office PC', 'result' => 'OK')
    assert_empty scan(answer(lockout), secrets: [PASSWORD]), 'a lockout row (OK, no detail) holds typed text and stays exempt'
  end

  test 'a stored-only key inside a detail string is a finding, and a secret holding a comma is seen whole' do
    findings = scan(answer(good_row('detail' => 'route: keyboard, flagged: 1')))
    assert_equal [%w[log_row log:stored_key:flagged]], owners(findings)
    assert_empty scan(answer(good_row('detail' => 'route: keyboard, method: password')))
    spaced = 'Ledger, Dana-7'
    assert_equal [%w[log_row log:secret]], owners(scan(answer(good_row('detail' => "code: #{spaced}")), secrets: [spaced]))
  end

  test 'a row with a stored-only key or a missing key is a finding, whatever the key' do
    %w[seq serverMs flagged p by].each do |key|
      findings = scan(answer(good_row(key => 1)))
      assert_includes owners(findings), ['log_row', "log:stored_key:#{key}"], key
      assert_includes owners(findings), %w[log_row log:row_keys], key
    end
    assert_equal [%w[log_row log:row_keys]], owners(scan(answer(good_row.except('detail'))))
    assert_empty scan(answer(good_row.except('elapsedMs').merge('at' => 900))), 'a seed row carries its authored at'
  end

  test 'a stored-only key or an unknown key on the answer is a finding' do
    assert_equal [%w[log_row log:stored_key:serverMs]], owners(scan(answer(good_row, extra: { 'serverMs' => 5 })).reject { |f| f.owner == 'log:answer_key:serverMs' })
    assert_includes owners(scan(answer(good_row, extra: { 'opsLog' => {} }))), %w[log_row log:answer_key:opsLog]
    assert_includes owners(scan(answer(good_row, extra: { 'logSources' => {} }))), %w[log_row log:stored_key:logSources]
  end

  test 'a raw scenario id as a cell or a detail value is a finding, an authored name equal to an id is not' do
    assert_equal [%w[log_row log:raw_id:office]], owners(scan(answer(good_row('where' => 'office'))))
    assert_equal [%w[log_row log:raw_id:dana]], owners(scan(answer(good_row('as' => 'dana'))))
    assert_equal [%w[log_row log:raw_id:office_pc]], owners(scan(answer(good_row('detail' => 'route: keyboard, from: office_pc'))))
    assert_equal [%w[log_row log:raw_id:FIN-DANA-01]], owners(scan(answer(good_row('as' => 'FIN-DANA-01'))))
    assert_empty scan(answer(good_row('as' => 'dreyes', 'where' => 'Lobby'))), 'a username and a door sign are authored names'
  end

  test 'the rule judges /log_rows answers only' do
    assert_empty scan(answer(good_row('where' => 'office', 'seq' => 3)), path: '/break_escape/games/1/room/office').select { |f| f.rule == 'log_row' }
  end

  # ---- L2b: seed rows; R4-1 and R4-2. The scanner holds no rule about the anomaly: by the plan (7) the
  # browser holds anomaly.rowId and the flag is checked on the client, so an answer that names no row is the
  # only thing /log_rows owes.

  def seed_row(id, extra = {})
    { 'id' => id, 'at' => 'Mon 23:58', 'event' => 'BADGE', 'as' => 'Dana Reyes', 'where' => 'Finance office', 'result' => 'OK', 'detail' => '' }.merge(extra)
  end

  def scan_run(*entries, secrets: [LOCK_PIN])
    lines = entries.each_with_index.map do |(method, path, body), i|
      ['r.jsonl', i + 1, { 'method' => method, 'path' => path, 'status' => 200, 'body' => body }]
    end
    AccessLeakScanner.new(scenario, log_secrets: secrets).scan(lines)
  end

  def rows_answer(*rows, extra: {})
    ['GET', PATH, answer(*rows, extra: extra)]
  end

  test 'L2b: seed rows (their own seven keys, with at) ahead of the play rows are clean' do
    assert_empty scan_run(rows_answer(*%w[s1 s2 s3].map { |id| seed_row(id) }, good_row))
  end

  test 'L2b: the browser holds the anomaly row and the flag actions in a reader object, which is no finding' do
    reader = { 'objects' => [{ 'id' => 'night_pc', 'type' => 'ops_log_terminal',
                               'minigameData' => { 'logSource' => 'night', 'anomaly' => { 'rowId' => 's2' },
                                                   'flagActions' => [{ 'type' => 'set_global', 'key' => 'k', 'value' => true }] } }] }
    assert_empty scan_run(['GET', '/break_escape/games/1/room/office', reader]).select { |f| f.rule == 'log_row' }
  end

  test 'L2b: a seed row with a key beyond its seven is still a finding' do
    assert_includes owners(scan_run(rows_answer(seed_row('s1', 'anomaly' => true)))), %w[log_row log:row_keys]
  end

  test 'R4-1: a stored-only key is found by its word in a detail string whatever separates the pairs' do
    assert_equal [%w[log_row log:stored_key:flagged]], owners(scan_run(rows_answer(good_row('detail' => 'route=keyboard; flagged=1'))))
    assert_equal [%w[log_row log:stored_key:flagged]], owners(scan_run(rows_answer(good_row('detail' => 'route: keyboard | flagged : 1'))))
    assert_empty scan_run(rows_answer(good_row('detail' => 'route: keyboard, method: password')))
  end

  test 'R4-2: a detail key the registry marks hidden is a stored-only key without a list edit' do
    event = { 'tst_hidden' => { label: 'TST', places: [], results: %w[ok], detail: { 'secretkey' => { count: 1, show: false } } } }
    assert_empty scan_run(rows_answer(good_row('detail' => 'secretkey: 1')))
    BreakEscape::OpsLog.with_events(event) do
      assert_equal [%w[log_row log:stored_key:secretkey]], owners(scan_run(rows_answer(good_row('detail' => 'secretkey: 1'))))
    end
  end

  # L3b R1 S1: a share's name is allowed in a SHARE_OPEN row's LOCATION cell only for a share opened
  # earlier in the same run by a successful GET /container/<share or an item in it>.
  def share_data
    scenario.merge('resources' => {
                     'inbox' => { 'kind' => 'file_share', 'name' => 'Scanned-Inbox', 'host' => 'OL-FS07', 'network' => 'lan',
                                  'contents' => [{ 'type' => 'folder', 'id' => 'letters', 'name' => 'Letters', 'contents' => [] }] },
                     'archive' => { 'kind' => 'file_share', 'name' => 'Old-Archive', 'host' => 'OL-FS08', 'network' => 'lan' }
                   },
                   'networks' => { 'lan' => { 'name' => 'Harbour office LAN' } })
  end

  def share_run(*steps)
    lines = steps.each_with_index.map do |(path, body, status), i|
      ['r.jsonl', i + 1, { 'method' => 'GET', 'path' => path, 'status' => status || 200, 'body' => body }]
    end
    owners(AccessLeakScanner.new(share_data, log_secrets: []).scan(lines))
  end

  def open_line(id, status: 200, body: { 'success' => true })
    ["/break_escape/games/1/container/#{id}?foothold=x", body, status]
  end

  def log_line(*rows)
    [PATH, answer(*rows)]
  end

  def share_row(name, event: 'SHARE_OPEN')
    good_row('event' => event, 'as' => '-', 'where' => name)
  end

  INBOX = [%w[network_string resource:inbox]].freeze

  test 'L3b S1: a lone SHARE_OPEN row naming the share, with no earlier open, is a finding' do
    assert_equal INBOX, share_run(log_line(share_row('Scanned-Inbox')))
  end

  test 'L3b S1: an earlier successful open of the share, or of an item in it, clears the SHARE_OPEN row' do
    assert_empty share_run(open_line('inbox'), log_line(share_row('Scanned-Inbox')))
    assert_empty share_run(open_line('letters'), log_line(share_row('Scanned-Inbox')))
    assert_empty share_run(open_line('inbox', body: { 'success' => true, 'contents' => [{ 'name' => 'Letters' }] }), log_line(good_row('event' => 'SHARE_OPEN', 'as' => '-', 'where' => 'Scanned-Inbox', 'detail' => 'folder: Letters')))
  end

  test 'L3b S1: the open after the log answer, a /network listing, or a refused open does not clear it' do
    assert_equal INBOX, share_run(log_line(share_row('Scanned-Inbox')), open_line('inbox'))
    assert_equal INBOX, share_run(['/break_escape/games/1/network', { 'networks' => [{ 'id' => 'lan', 'resources' => [{ 'id' => 'inbox' }] }] }],
                                  log_line(share_row('Scanned-Inbox')))
    assert_equal INBOX, share_run(open_line('inbox', status: 404, body: { 'success' => false, 'reason' => 'not_found' }), log_line(share_row('Scanned-Inbox')))
    assert_equal INBOX, share_run(open_line('inbox', body: { 'success' => false, 'reason' => 'denied' }), log_line(share_row('Scanned-Inbox')))
  end

  test 'L3b S1: opening share A does not clear a SHARE_OPEN row naming share B' do
    assert_equal [%w[network_string resource:archive]], share_run(open_line('inbox'), log_line(share_row('Old-Archive')))
  end

  test 'L3b S1: an open of the share does not clear its name in the LOCATION cell of another event' do
    assert_equal INBOX, share_run(open_line('inbox'), log_line(share_row('Scanned-Inbox', event: 'BADGE')))
  end

  test 'L3b S1: the host, the name elsewhere and a network name stay findings even after an open' do
    assert_equal INBOX, share_run(open_line('inbox'), log_line(good_row('where' => 'OL-FS07')))
    assert_equal INBOX, share_run(open_line('inbox'), log_line(good_row('event' => 'SHARE_OPEN', 'detail' => 'at Scanned-Inbox')))
    assert_equal [%w[network_string network:lan]], share_run(open_line('inbox'), log_line(good_row('event' => 'SHARE_OPEN', 'where' => 'Harbour office LAN')))
  end

  test 'L3b S1: only the earned owner is dropped when another resource shares the name' do
    data = share_data
    data['resources']['archive']['name'] = 'Scanned-Inbox'
    lines = [['r.jsonl', 1, { 'method' => 'GET', 'path' => '/break_escape/games/1/container/inbox', 'status' => 200, 'body' => { 'success' => true } }],
             ['r.jsonl', 2, { 'method' => 'GET', 'path' => PATH, 'status' => 200, 'body' => answer(share_row('Scanned-Inbox')) }]]
    assert_equal [%w[network_string resource:archive]], owners(AccessLeakScanner.new(data, log_secrets: []).scan(lines))
  end

  test 'L3 R2-4: only a file share counts as opened; a printer opened by id earns no name' do
    data = share_data
    data['resources']['printer'] = { 'kind' => 'print_queue', 'name' => 'Scanned-Inbox', 'host' => 'OL-PR01', 'network' => 'lan' }
    lines = [['r.jsonl', 1, { 'method' => 'GET', 'path' => '/break_escape/games/1/container/printer', 'status' => 200, 'body' => { 'success' => true } }],
             ['r.jsonl', 2, { 'method' => 'GET', 'path' => PATH, 'status' => 200, 'body' => answer(share_row('Scanned-Inbox')) }]]
    assert_includes owners(AccessLeakScanner.new(data, log_secrets: []).scan(lines)), %w[network_string resource:printer]
  end

  test 'L3 R2-4: an item id held by two shares opens neither; held by one, it opens that one' do
    data = share_data
    data['resources']['archive']['contents'] = [{ 'type' => 'folder', 'id' => 'letters', 'name' => 'Letters', 'contents' => [] }]
    lines = [['r.jsonl', 1, { 'method' => 'GET', 'path' => '/break_escape/games/1/container/letters', 'status' => 200, 'body' => { 'success' => true } }],
             ['r.jsonl', 2, { 'method' => 'GET', 'path' => PATH, 'status' => 200, 'body' => answer(share_row('Scanned-Inbox')) }]]
    assert_equal INBOX, owners(AccessLeakScanner.new(data, log_secrets: []).scan(lines))
  end

  test 'L3 R3-1: an item in a print queue (not a file share) opens no name' do
    data = share_data
    data['resources']['printer'] = { 'kind' => 'print_queue', 'name' => 'Scanned-Inbox', 'host' => 'OL-PR01', 'network' => 'lan',
                                     'contents' => [{ 'type' => 'folder', 'id' => 'spool', 'name' => 'Spool', 'contents' => [] }] }
    lines = [['r.jsonl', 1, { 'method' => 'GET', 'path' => '/break_escape/games/1/container/spool', 'status' => 200, 'body' => { 'success' => true } }],
             ['r.jsonl', 2, { 'method' => 'GET', 'path' => PATH, 'status' => 200, 'body' => answer(share_row('Scanned-Inbox')) }]]
    assert_includes owners(AccessLeakScanner.new(data, log_secrets: []).scan(lines)), %w[network_string resource:printer]
  end
end
