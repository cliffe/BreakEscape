require 'test_helper'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

# Ops S5bc fix, stage review round 2, scanner (game 187 playtest 2): Uma's relay desktop at the Records PC (store_pc) read again
# after unrelated sign-outs. Rows are the playtest's own (test/fixtures/files/ops_playtest187_rows.jsonl, capture rows 139, 140, 149,
# 152, 278): 139 Uma's relay sign-in at store_pc, 140 her desktop, 149 a sign-out (answers no PC), 152 her typed sign-in at the Bay
# PC, 278 her relay desktop at store_pc again (200, still her relay session).
# Diagnosis: not a server leak. POST /logout ends the one PC it names (games_controller.rb logout, Game#logout_session!), a relay
# session is held in that PC's session slot, and the answer names no PC. The scanner ends every PC on an unnamed sign-out (fail
# closed), so the capture was flagged because the check was run without `--logout` naming that sign-out's PC.
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

  test 'the relay desktop read again after a sign-out named at another PC is clean' do
    found, scanner = scan(pick(139, 140, 152, 149, 278), signins: ['uma@bay_pc#2'], logouts: ['uma@bay_pc#1'])
    assert_empty found
    assert_empty scanner.unused_entries
  end

  test 'tamper: the same sign-out left unnamed ends every PC, so the second read is flagged' do
    found, = scan(pick(139, 140, 152, 149, 278), signins: ['uma@bay_pc#2'])
    assert_includes found.map { |_, rule, owner| [rule, owner] }, %w[profile_admin_read item:uma_todo]
  end

  test 'tamper: the relay desktop with no relay sign-in before it is flagged' do
    found, = scan(pick(278))
    assert_includes found.map { |_, rule, owner| [rule, owner] }, %w[profile_admin_read item:uma_todo]
  end
end
