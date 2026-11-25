require 'test_helper'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

# Ops S5bc fix, stage review round 1, scanner job 1: the three false alarms of the game 173 playtest
# (/data/tmp/scratch/s5bc-playtest/LEAK_DIAGNOSIS.md). The rows are the playtest's own, trimmed to the ones each case needs
# (test/fixtures/files/ops_playtest173_rows.jsonl: capture rows 119, 122, 168, 169, 171, 302, 322 in that order):
#   119 Adel signs in at the Bay PC by keyboard (admin)      122 POST /network/implant plants the HID kit there (200)
#   168 Uma's relay sign-in at the Records PC (store_pc)     169 her desktop   171 a GET /network host row with no session there
#   302 the privilege audit with USB_OVERRIDE (device: hid)  322 her desktop again, serving her own to do list
# Trimmed only by leaving out what the case does not touch: row 171 keeps its store_pc host row with no session (the bay_pc host,
# the services, findings, networks and techniques are cut), and row 302 keeps only its hid USB_OVERRIDE row.
class AccessLeakScannerPlaytest173Test < ActiveSupport::TestCase
  SCENARIO = File.expand_path('../../scenarios/test_ops_privilege/scenario.json.erb', __dir__)

  def scenario
    JSON.parse(BreakEscape::ScenarioBinding.render(File.read(SCENARIO)))
  end

  def captured
    @captured ||= File.readlines(File.expand_path('../fixtures/files/ops_playtest173_rows.jsonl', __dir__)).map { |l| JSON.parse(l) }
  end

  def pick(*numbers)
    numbers.map { |n| Marshal.load(Marshal.dump(captured.find { |r| r['n'] == n })) }
  end

  def scan(rows, signins: [])
    scanner = AccessLeakScanner.new(scenario)
    found = scanner.scan(rows.each_with_index.map { |r, i| ['run.jsonl', i + 1, r] }, signins: signins)
    [found.map { |f| [f.line, f.rule, f.owner] }, scanner]
  end

  ADEL = ['adel@bay_pc#1'].freeze

  test 'the plant by POST /network/implant earns the USB_OVERRIDE row it wrote (keyboard admin held at the PC)' do
    found, scanner = scan(pick(119, 122, 302), signins: ADEL)
    assert_empty found
    assert_empty scanner.unused_entries
  end

  test 'tamper: the implant with no admin sign-in before it leaves the USB_OVERRIDE row flagged' do
    found, = scan(pick(122, 302))
    assert_includes found.map { |_, rule, owner| [rule, owner] }, %w[log_row log:usb_override:bay_pc]
  end

  test 'tamper: the implant after the keyboard administrator was signed out leaves the row flagged' do
    rows = pick(119, 122, 302)
    logout = { 'method' => 'POST', 'path' => '/break_escape/games/173/lock_session', 'status' => 200, 'body' => { 'success' => true, 'locked' => true, 'pcId' => 'bay_pc' } }
    found, = scan([rows[0], logout, rows[1], rows[2]], signins: ADEL)
    assert_includes found.map { |_, rule, owner| [rule, owner] }, %w[log_row log:usb_override:bay_pc]
  end

  test 'tamper: an implant answer that names no consumed device earns nothing' do
    rows = pick(119, 122, 302)
    rows[1]['body'].delete('consumedId')
    found, = scan(rows, signins: ADEL)
    assert_includes found.map { |_, rule, owner| [rule, owner] }, %w[log_row log:usb_override:bay_pc]
  end

  test 'tamper: an implant answer for a PC other than the audit row names earns nothing for that row' do
    rows = pick(119, 122, 302)
    rows[1]['body']['foothold']['sourceId'] = 'store_pc'
    found, = scan(rows, signins: ADEL)
    assert_includes found.map { |_, rule, owner| [rule, owner] }, %w[log_row log:usb_override:bay_pc]
  end

  test 'tamper: a 422 implant refusal earns nothing' do
    rows = pick(119, 122, 302)
    rows[1]['status'] = 422
    found, = scan(rows, signins: ADEL)
    assert_includes found.map { |_, rule, owner| [rule, owner] }, %w[log_row log:usb_override:bay_pc]
  end

  test 'a relay sign-in stays held through a host row that lists no session there: her own profile is not a leak' do
    found, = scan(pick(168, 169, 171, 322))
    assert_empty found
  end

  test 'tamper: the same host row after a successful sign-out of that PC ends the session, and her profile read is flagged' do
    rows = pick(168, 169, 171, 322)
    logout = { 'method' => 'POST', 'path' => '/break_escape/games/173/logout', 'status' => 200, 'body' => { 'success' => true } }
    found, = scan([rows[0], rows[1], logout, rows[2], rows[3]], signins: [])
    assert_includes found.map { |_, rule, owner| [rule, owner] }, %w[profile_admin_read item:uma_todo]
  end

  test 'tamper: a host row that ends a non-relay session (a typed sign-in) still takes it back' do
    rows = pick(168, 169, 171, 322)
    rows[0]['body'].delete('relay')
    rows[0]['body'].delete('route')
    rows[1]['body']['session'].delete('relay')
    rows[3]['body']['session'].delete('relay')
    found, = scan(rows)
    assert_includes found.map { |_, rule, owner| [rule, owner] }, %w[profile_admin_read item:uma_todo]
  end

  test 'tamper: the desktop that shows no session at the PC still ends a relay sign-in' do
    rows = pick(168, 169, 171, 322)
    rows[2]['body'] # host row unchanged
    gone = { 'method' => 'GET', 'path' => '/break_escape/games/173/container/store_pc', 'query' => 'relay=1', 'status' => 200,
             'body' => { 'container_id' => 'store_pc', 'contents' => [], 'session' => nil } }
    found, = scan([rows[0], rows[1], gone, rows[3]])
    assert_includes found.map { |_, rule, owner| [rule, owner] }, %w[profile_admin_read item:uma_todo]
  end
end
