require 'test_helper'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops S8a fix, leak scanner review round 3 (R3-1, R3-2, R3-3, R3-5): doctored copies of the real browser capture rows
  # (test/fixtures/files/ops_mfa_real_capture_rows.jsonl) in which the sign-in's own desktop row is missing. A name that the
  # first desktop row after its sign-in does not confirm is an error (exit 2), never a pass.
  class AccessLeakScannerMfaR3Test < ActiveSupport::TestCase
    FIXTURE = File.expand_path('../../fixtures/files/ops_mfa_real_capture_rows.jsonl', __dir__)

    def scenario
      JSON.parse(ScenarioBinding.render(File.read(File.expand_path('../../../scenarios/test_ops_mfa/scenario.json.erb', __dir__))))
    end

    def real
      @real ||= File.readlines(FIXTURE).map { |l| JSON.parse(l) }.to_h { |r| [r['n'], r] }
    end

    def rows(*ns)
      ns.map { |n| Marshal.load(Marshal.dump(real.fetch(n))) }
    end

    def scan_rows(list, **opts)
      scanner = AccessLeakScanner.new(scenario)
      findings = scanner.scan(list.each_with_index.map { |r, i| ['capture.jsonl', i + 1, r] }, **opts)
      [findings, scanner]
    end

    def found(findings)
      findings.select { |f| f.rule.start_with?('mfa_') }.map { |f| [f.rule, f.owner] }.uniq.sort
    end

    def refused(list, names, pattern)
      error = assert_raises(ArgumentError) { scan_rows(list, signins: names) }
      assert_match pattern, error.message
    end

    def hana_at_plain_pc(row)
      row['body']['session'] = real.fetch(108)['body']['session'].dup
      row
    end

    def signout
      { 'method' => 'POST', 'path' => '/break_escape/games/86/logout', 'status' => 200, 'body' => { 'success' => true, 'endedPcIds' => [] } }
    end

    test 'R3-1 another account signing in between a named sign-in and its desktop leaves the name unconfirmed' do
      # Hana named at Shipping PC, Cal's sign-in comes next, then a Shipping PC desktop showing Hana
      list = rows(107, 278, 279)
      list[2]['body']['session'] = real.fetch(108)['body']['session'].dup
      refused(list, %w[hana@plain_pc#1], /another sign-in or step passed \("cal"\) before any desktop row/)
      # the honest order still confirms
      findings, scanner = scan_rows(rows(278, 279), signins: %w[cal@plain_pc#1])
      assert_equal [], findings.map { |f| [f.rule, f.owner] }
      assert_equal [], scanner.unused_entries
    end

    test 'R3-2 an unnamed sign-out does not make the run forget a name placed the account at a PC' do
      list = rows(278, 279, 278, 279)
      list.insert(2, signout)
      refused(list, %w[cal@plain_pc#1 cal@plain_pc#2], /already held cal at plain_pc/)
      # an answer that names the PC ended that session: the second sign-in is then its own
      list[2]['body']['endedPcIds'] = ['plain_pc']
      findings, scanner = scan_rows(list, signins: %w[cal@plain_pc#1 cal@plain_pc#2])
      assert_equal [], findings.map { |f| [f.rule, f.owner] }
      assert_equal [], scanner.unused_entries
    end

    test 'R3-3 only a GET of a desktop that shows no relayed session confirms a name' do
      list = rows(107, 108)
      list[1]['method'] = 'POST'
      list[1]['path'] += '?via=relay'
      list[1]['path'] = list[1]['path'].sub('code_pc1', 'plain_pc')
      refused(list, %w[hana@plain_pc#1], /not a GET \(POST\)/)
      list = rows(107, 108)
      list[1]['path'] = list[1]['path'].sub('code_pc1', 'plain_pc')
      list[1]['body']['session']['relay'] = true
      refused(list, %w[hana@plain_pc#1], /relayed session/)
    end

    test 'R3-5 a desktop showing a keyboard session at a step PC that no step in the run earned is reported' do
      assert_equal [['mfa_session', 'mfa:session:hana']], found(scan_rows(rows(108)).first)
      assert_equal [], found(scan_rows(rows(95, 97, 98, 108)).first)
      # a sign-out does not undo "ever passed"
      list = rows(95, 97, 98) + [signout] + rows(108)
      assert_equal [], found(scan_rows(list).first)
      # a PC with no step for the account asks for nothing
      assert_equal [], found(scan_rows(rows(279)).first)
    end
  end
end
