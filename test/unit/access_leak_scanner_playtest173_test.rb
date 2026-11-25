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

  # R3-SCANNER1: a plant is credited only for a device the capture shows held, so unless a case says `taken: false` (or names
  # row 40 itself) the capture starts with row 40, the 200 answer to the add of kit_badusb.
  def scan(rows, signins: [], taken: true)
    rows = [pick(40).first, *rows] if taken && rows.none? { |r| r['n'] == 40 }
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

  # ---- Stage review round 2 (S5bc_R2_scanner.md): R2-SCANNER1 to 3.
  # A row whose path ends /__grant stands for a credited technique answer: the hook runs what note_ops_technique_steps runs for
  # one (note_ops_session_grant). Its body is { "g": "<pc>,<account>" }.
  def scan_with_grants(rows, signins: [])
    scanner = AccessLeakScanner.new(scenario)
    scanner.define_singleton_method(:note_privilege_signin) do |body, ctx, row|
      if row['path'].to_s.end_with?('/__grant')
        pc, account = body['g'].split(',')
        note_ops_session_grant({ host_id: pc }, { 'npcId' => account, 'via' => 'technique', 'footholdId' => 'jack_office_port', 'access' => 'admin' })
      else
        super(body, ctx, row)
      end
    end
    found = scanner.scan(rows.each_with_index.map { |r, i| ['run.jsonl', i + 1, r] }, signins: signins)
    [found.map { |f| [f.line, f.rule, f.owner] }, scanner]
  end

  def grant_row(pc, account)
    { 'method' => 'POST', 'path' => '/break_escape/games/173/__grant', 'status' => 200, 't' => '2026-11-24T23:33:53.095Z', 'body' => { 'g' => "#{pc},#{account}" } }
  end

  def audit_ox2(row)
    Marshal.load(Marshal.dump(row)).tap { |r| r['body']['rows'][0]['result'] = 'OK x2' }
  end

  def retry_answer(row)
    Marshal.load(Marshal.dump(row)).tap { |r| r['body']['already'] = true; r['body']['first'] = false }
  end

  USB_OVERRIDE_FLAG = %w[log_row log:usb_override:bay_pc].freeze

  test 'R2-SCANNER1 (control): one implant does not earn a repeat row (OK x2)' do
    rows = pick(119, 122, 302)
    found, = scan([rows[0], rows[1], audit_ox2(rows[2])], signins: ADEL)
    assert_includes found.map { |_, rule, owner| [rule, owner] }, USB_OVERRIDE_FLAG
  end

  test 'R2-SCANNER1 (I1): the implant retry answer (already: true) earns no second row' do
    rows = pick(119, 122, 302)
    found, = scan([rows[0], rows[1], retry_answer(rows[1]), audit_ox2(rows[2])], signins: ADEL)
    assert_includes found.map { |_, rule, owner| [rule, owner] }, USB_OVERRIDE_FLAG
  end

  test 'R2-SCANNER1 (I1b): the retry answer alone earns no row' do
    rows = pick(119, 122, 302)
    found, = scan([rows[0], retry_answer(rows[1]), rows[2]], signins: ADEL)
    assert_includes found.map { |_, rule, owner| [rule, owner] }, USB_OVERRIDE_FLAG
  end

  test 'R2-SCANNER1 (I2): the same consuming answer twice earns one row, not two' do
    rows = pick(119, 122, 302)
    found, = scan([rows[0], rows[1], Marshal.load(Marshal.dump(rows[1])), audit_ox2(rows[2])], signins: ADEL)
    assert_includes found.map { |_, rule, owner| [rule, owner] }, USB_OVERRIDE_FLAG
  end

  test 'R2-SCANNER1: a device given back to the tray can be planted again (two rows are honest)' do
    rows = pick(119, 122, 302)
    add = { 'method' => 'POST', 'path' => '/break_escape/games/173/inventory', 'status' => 200, 'body' => { 'success' => true },
            'inv' => { 'action' => 'add', 'itemId' => 'kit_badusb' } }
    found, = scan([rows[0], rows[1], add, Marshal.load(Marshal.dump(rows[1])), audit_ox2(rows[2])], signins: ADEL)
    refute_includes found.map { |_, rule, owner| [rule, owner] }, USB_OVERRIDE_FLAG
  end

  test 'R2-SCANNER2 (I3): a technique session admin step at the PC does not earn the implant row' do
    rows = pick(122, 302)
    found, = scan_with_grants([grant_row('bay_pc', 'adel'), rows[0], rows[1]])
    assert_includes found.map { |_, rule, owner| [rule, owner] }, USB_OVERRIDE_FLAG
  end

  test 'R2-SCANNER3 (B1): a technique session of the same account replaces the relay one; a host row with no session ends it' do
    rows = pick(168, 169, 171, 322)
    desktop = Marshal.load(Marshal.dump(rows[3]))
    desktop.delete('query')
    desktop['body']['session'] = { 'npcId' => 'uma', 'username' => 'umaquay', 'displayName' => 'Uma Quayle', 'via' => 'technique', 'footholdId' => 'jack_office_port', 'access' => 'admin' }
    found, = scan_with_grants([rows[0], rows[1], grant_row('store_pc', 'uma'), rows[2], desktop])
    assert_includes found.map { |_, rule, owner| [rule, owner] }, %w[profile_admin_read item:uma_todo]
  end

  # R3-SCANNER1: a plant is credited only for a device the capture shows held (row 40, the kit_badusb add answered 200).
  def untaken_remove(id)
    { 'method' => 'POST', 'path' => '/break_escape/games/173/inventory', 'status' => 200, 'body' => { 'success' => true },
      'inv' => { 'action' => 'remove', 'itemId' => id, 'usedOn' => 'bay_usb_port' } }
  end

  test 'R3-SCANNER1: the honest implant of the held kit_badusb (row 40) earns the row' do
    found, scanner = scan(pick(40, 119, 122, 302), signins: ADEL)
    assert_empty found
    assert_empty scanner.unused_entries
  end

  test 'R3-SCANNER1 (P2u): a remove of a stick the capture never shows taken earns no second storage row' do
    rows = pick(40, 119, 122, 302)
    audit = Marshal.load(Marshal.dump(rows[3]))
    audit['body']['rows'] << audit['body']['rows'][0].merge('id' => 'zz', 'detail' => 'device: storage')
    control, = scan([rows[0], rows[1], rows[2], audit], signins: ADEL)
    assert_includes control.map { |_, rule, owner| [rule, owner] }, USB_OVERRIDE_FLAG
    found, = scan([rows[0], rows[1], rows[2], untaken_remove('kit_stick_a'), audit], signins: ADEL)
    assert_includes found.map { |_, rule, owner| [rule, owner] }, USB_OVERRIDE_FLAG
  end

  test 'R3-SCANNER1: an implant of a device never taken in the capture earns nothing' do
    found, = scan(pick(119, 122, 302), signins: ADEL, taken: false)
    assert_includes found.map { |_, rule, owner| [rule, owner] }, USB_OVERRIDE_FLAG
  end

  test 'R3-SCANNER2 (I4, I4n, I4t): a remote password or token admin session at the PC does not earn the implant row' do
    rows = pick(40, 119, 122, 302)
    remote = lambda do |extra|
      Marshal.load(Marshal.dump(rows[1])).tap { |r| r['body'].merge!({ 'remote' => true, 'footholdId' => 'jack_office_port', 'host' => 'BAY01' }.merge(extra)) }
    end
    [{}, { 'via' => 'credential', 'kind' => 'token', 'label' => 'Bay PC sign-in token', 'expiresInS' => 205 }].each do |extra|
      [[], ADEL].each do |names|
        found, = scan([rows[0], remote.call(extra), rows[2], rows[3]], signins: names)
        assert_includes found.map { |_, rule, owner| [rule, owner] }, USB_OVERRIDE_FLAG, [extra, names].inspect
      end
    end
  end
end
