require 'test_helper'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

# Ops S5bc fix, stage review rounds 2 and 3, scanner (game 187 playtest 2): Uma's relay desktop at the Records PC (store_pc) read
# again after unrelated sign-outs. Rows are the playtest's own, in capture order (test/fixtures/files/ops_playtest187_rows.jsonl,
# capture rows 38, 46, 66, 74, 78, 90, 93, 139, 140, 148, 149, 152, 227, 259, 278): 38 the HID stick taken, 46 Adel's keyboard
# sign-in at the Bay PC, 66 a token sign-in and 74 a remote password sign-in (through the foothold), 78 the implant answered
# 422 needs_console, 90 Adel's keyboard sign-in again, 93 the implant answered 200, 139 Uma's relay sign-in at store_pc, 140 her
# desktop, 148 Adel's Bay desktop, 149 the sign-out that ended Adel's Bay session (answers no PC), 152 Uma's typed sign-in at the
# Bay PC, 227 Sam's claim sign-in (answers no PC), 259 the audit (trimmed to its hid USB_OVERRIDE row), 278 Uma's relay desktop
# at store_pc again (200, still her relay session).
# Diagnosis: not a server leak. POST /logout ends the one PC it names (games_controller.rb logout, Game#logout_session!), a relay
# session is held in that PC's session slot, and the answer names no PC. The scanner ends every PC on an unnamed sign-out (fail
# closed), and a claim sign-in that does not place its PC (Sam's, row 227) also empties the session map; so the capture is flagged
# unless the check names that sign-out's PC (`--logout adel@bay_pc#1`) AND Sam's claim sign-in (`--signin sam@hot_desk#1`).
# PLAYTEST beat 6 (rows 74 and 78): the remote admin session's implant is refused 422 needs_console, which is the honest server
# answer (network_access.rb needs_console); the scanner flags a 200 answer there (R3-SCANNER2 tests below).
class AccessLeakScannerPlaytest187Test < ActiveSupport::TestCase
  SCENARIO = File.expand_path('../../scenarios/test_ops_privilege/scenario.json.erb', __dir__)

  def scenario
    JSON.parse(BreakEscape::ScenarioBinding.render(File.read(SCENARIO)))
  end

  def captured
    @captured ||= File.readlines(File.expand_path('../fixtures/files/ops_playtest187_rows.jsonl', __dir__)).map { |l| JSON.parse(l) }
  end

  def pick(*numbers)
    numbers.map { |n| Marshal.load(Marshal.dump(captured.find { |r| r['n'] == n })) }
  end

  def scan(rows, **opts)
    scanner = AccessLeakScanner.new(scenario)
    found = scanner.scan(rows.each_with_index.map { |r, i| ['run.jsonl', i + 1, r] }, **opts)
    [found.map { |f| [f.line, f.rule, f.owner] }, scanner]
  end

  def reached(found)
    found.map { |_, rule, owner| [rule, owner] }
  end

  def audit_flag
    %w[log_row log:usb_override:bay_pc]
  end

  # the rows in capture order, minus the ones a case leaves out
  def seq(*numbers)
    pick(*numbers)
  end

  RELAY_ROWS = [90, 139, 140, 148, 149, 152, 227, 278].freeze
  RELAY_NAMES = { signins: %w[adel@bay_pc#1 uma@bay_pc#2 sam@hot_desk#1], logouts: ['adel@bay_pc#1'] }.freeze

  test 'the relay desktop read again after a sign-out named at another PC and Sam\'s claim sign-in named is clean' do
    found, scanner = scan(seq(*RELAY_ROWS), **RELAY_NAMES)
    assert_empty found
    assert_empty scanner.unused_entries
  end

  test 'tamper: the same sign-out left unnamed ends every PC, so the second read is flagged' do
    found, = scan(seq(*RELAY_ROWS), signins: RELAY_NAMES[:signins])
    assert_includes reached(found), %w[profile_admin_read item:uma_todo]
  end

  test 'a claim sign-in that places no PC empties the session map, so the check must name it (R3-SCANNER3)' do
    found, = scan(seq(*RELAY_ROWS), signins: %w[adel@bay_pc#1 uma@bay_pc#2], logouts: RELAY_NAMES[:logouts])
    assert_includes reached(found), %w[profile_admin_read item:uma_todo]
  end

  test 'tamper: the relay desktop with no relay sign-in before it is flagged' do
    found, = scan(pick(278))
    assert_includes reached(found), %w[profile_admin_read item:uma_todo]
  end

  # R3-SCANNER2: the implant credit needs the keyboard admin step at the PC. Rows 74 (remote password) and 66 (remote token) are
  # the playtest's own remote sign-ins; row 78 answered 422 needs_console, and a 200 answer carrying row 93's body is a server
  # that wrote the USB_OVERRIDE row for a remote session.
  def forged_implant
    pick(78, 93).then { |a, b| a.merge('status' => 200, 'body' => b['body']) }
  end

  test 'the honest keyboard implant (rows 38, 46, 93) earns the audit row' do
    found, scanner = scan(seq(38, 46, 93, 259), signins: ['adel@bay_pc#1'])
    assert_empty found
    assert_empty scanner.unused_entries
  end

  test 'R3-SCANNER2: a remote password admin session whose implant is answered 200 earns nothing' do
    found, = scan([*pick(38, 74), forged_implant, *pick(259)])
    assert_includes reached(found), audit_flag
  end

  test 'R3-SCANNER2: a remote token admin session whose implant is answered 200 earns nothing' do
    found, = scan([*pick(38, 66), forged_implant, *pick(259)])
    assert_includes reached(found), audit_flag
  end

  test 'R3-SCANNER2: the honest 422 needs_console answer (row 78) earns nothing and is not a finding itself' do
    found, = scan(pick(38, 74, 78))
    assert_empty found
  end

  test 'R3-SCANNER1: an implant of a device the capture never shows held earns nothing' do
    found, = scan(seq(46, 93, 259), signins: ['adel@bay_pc#1'])
    assert_includes reached(found), audit_flag
  end
end
