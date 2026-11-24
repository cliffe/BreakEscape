require 'test_helper'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops S8a fix, leak scanner review round 2 (R2-L1, R2-L2): a `--signin` name is only a claim. These cases are cut from the
  # tester's real browser capture of the playtest (rows 95, 97, 98, 100, 107, 108, 278 and 279 of game 86, kept whole in
  # test/fixtures/files/ops_mfa_real_capture_rows.jsonl: no device code, password or number is in them), and doctored one fault
  # at a time. The honest run with the two names stays clean; a name the capture never confirms is an error (exit 2).
  class AccessLeakScannerMfaR2Test < ActiveSupport::TestCase
    FIXTURE = File.expand_path('../../fixtures/files/ops_mfa_real_capture_rows.jsonl', __dir__)
    NAMES = %w[hana@code_pc1#1 cal@plain_pc#1].freeze

    def scenario
      JSON.parse(ScenarioBinding.render(File.read(File.expand_path('../../../scenarios/test_ops_mfa/scenario.json.erb', __dir__))))
    end

    def real
      @real ||= File.readlines(FIXTURE).map { |l| JSON.parse(l) }.to_h { |r| [r['n'], r] }
    end

    # The captured rows with the given `n`, in the order given, each a private copy.
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

    def refused(list, names, pattern = /named, unconfirmed/)
      error = assert_raises(ArgumentError) { scan_rows(list, signins: names) }
      assert_match pattern, error.message
      error.message
    end

    test 'the captured rows scan clean with the two names and report the two sessions without them' do
      findings, scanner = scan_rows(rows(95, 97, 98, 100, 107, 108, 278, 279), signins: NAMES)
      assert_equal [], findings.map { |f| [f.line, f.rule, f.owner] }
      assert_equal [], scanner.unused_entries
      findings, = scan_rows(rows(95, 97, 98, 100, 107, 108, 278, 279))
      assert_equal [['mfa_session', 'mfa:session:cal'], ['mfa_session', 'mfa:session:hana']], found(findings)
    end

    test 'R2-L1 a name with no desktop row after it is an error that names it, never a pass' do
      # the step left out: Hana's session at Accounts PC with no step, named at Shipping PC, the capture ends at the sign-in
      message = refused(rows(107), %w[hana@plain_pc#1])
      assert_match(/hana@plain_pc#1/, message)
      assert_match(/ends before a desktop row/, message)
      # the careless case: the finding for Cal is cleared by naming one more PC, with the desktop row absent
      refused(rows(278), %w[cal@plain_pc#1])
      # a desktop row of a PC with no session, or an unreadable one
      list = rows(107, 108)
      list[1]['body']['session'] = nil
      refused(list, %w[hana@plain_pc#1])
      list = rows(107, 108)
      list[1]['status'] = 403
      refused(list, %w[hana@plain_pc#1])
      # a desktop of another PC than the named one
      refused(rows(107, 108), %w[hana@plain_pc#1], /code_pc1, not plain_pc/)
      # a desktop that shows another account
      list = rows(278, 279)
      list[1]['body']['session']['npcId'] = 'hana'
      refused(list, %w[cal@plain_pc#1], /shows "hana"/)
    end

    test 'R2-L1 a way in that is not a keyboard password sign-in, or a replaced slot, leaves the name unconfirmed' do
      [{ 'via' => 'credential', 'kind' => 'saved_connection' }, { 'via' => 'claim' }].each do |change|
        list = rows(107, 108)
        list[0]['body'].merge!(change)
        refused(list, %w[hana@code_pc1#1], /not a keyboard password sign-in/)
      end
      list = rows(107, 108)
      list[0]['body'].delete('via')
      refused(list, %w[hana@code_pc1#1], /not a keyboard password sign-in/)
      list = rows(107, 108)
      list[0]['body']['remote'] = true
      refused(list, %w[hana@code_pc1#1], /remote/)
      # the desktop's session marked remote
      list = rows(278, 279)
      list[1]['body']['session']['remote'] = true
      refused(list, %w[cal@plain_pc#1])
      # one name overwritten by the next sign-in before any desktop row, or an account signing in again, or a sign-out
      refused(rows(278, 107, 108), NAMES, /another name was armed/)
      refused(rows(278, 278, 279), %w[cal@plain_pc#1], /signed in or passed a step again/)
      list = rows(278, 279)
      list.insert(1, { 'method' => 'POST', 'path' => '/break_escape/games/86/logout', 'status' => 200, 'body' => { 'success' => true, 'endedPcIds' => [] } })
      refused(list, %w[cal@plain_pc#1], /sign-out came before/)
    end

    test 'R2-L2 the desktop of a PC the run already holds the account at confirms nothing for another PC' do
      # Hana passes the step at Accounts PC, then a second session for her there with no lock; named at Shipping PC
      list = rows(95, 97, 98, 107, 108)
      refused(list, %w[hana@plain_pc#1], /code_pc1, not plain_pc/)
      # named at the step PC it is the first round's finding again: the step is owed, so it is reported
      findings, = scan_rows(rows(95, 97, 98, 107, 108), signins: %w[hana@code_pc1#1])
      assert_equal [['mfa_session', 'mfa:session:hana']], found(findings)
      # at a PC with no step, the account already held there before this sign-in (no lock to explain it) is ambiguous
      list = rows(278, 279, 278, 279)
      refused(list, %w[cal@plain_pc#1 cal@plain_pc#2], /already held cal at plain_pc/)
    end

    test 'a confirmed name still earns nothing by itself at a step PC' do
      findings, scanner = scan_rows(rows(107, 108), signins: %w[hana@code_pc1#1])
      assert_equal [['mfa_session', 'mfa:session:hana']], found(findings)
      assert_equal [], scanner.unused_entries
    end

    # ---- R2-L4: a claim exempts only the owner of a PC the answer could be about ----------------------------------------

    test 'R2-L4 a claim at a step PC is exempt for its owner only' do
      claim = lambda do |npc, username, pc|
        row = rows(107).first
        row['body'] = row['body'].merge('npcId' => npc, 'username' => username, 'via' => 'claim')
        row['login'] = { 'pcId' => pc }
        row
      end
      assert_equal [], found(scan_rows([claim.call('hana', 'hquill', 'code_pc1')]).first) # Hana owns Accounts PC
      assert_equal [['mfa_session', 'mfa:session:dev']], found(scan_rows([claim.call('dev', 'dkapoor', 'push_pc')]).first)
      # a bootstrap listing a claim session of an account that owns none of the PC's it could be at
      boot = { 'method' => 'GET', 'path' => '/break_escape/games/86/scenario', 'status' => 200,
               'body' => { 'sessions' => { 'push_pc' => { 'npcId' => 'dev', 'via' => 'claim' } } } }
      assert_equal [['mfa_session', 'mfa:session:dev']], found(scan_rows([boot]).first)
      # the scenario authors a borrow, so a guest session of any account can be left there
      data = scenario
      data['rooms'].values.first['borrowProbe'] = { 'do' => 'borrow_session' }
      findings = AccessLeakScanner.new(data).scan([['c', 1, claim.call('dev', 'dkapoor', 'push_pc')]].map { |s, n, r| [s, n, r] })
      assert_equal [], found(findings)
    end

    # ---- R2-L3 (and R1-L4): a session-shaped answer is judged whatever its method or route ------------------------------

    test 'R2-L3 a step-less session answer on another method, route or nesting is reported; a lost body takes the earned sessions back' do
      base = '/break_escape/games/86'
      session = real.fetch(107)['body']
      moved = lambda do |method, tail|
        row = rows(107).first
        row['method'] = method
        row['path'] = "#{base}/#{tail}"
        row
      end
      [['GET', 'login'], ['PUT', 'login'], ['POST', 'logout'], ['POST', 'lock_session'], ['POST', 'inventory'], ['POST', 'mfa/device'],
       ['POST', 'mfa/phone'], ['POST', 'mfa/other'], ['POST', 'scenario']].each do |method, tail|
        assert_equal [['mfa_session', 'mfa:session:hana']], found(scan_rows([moved.call(method, tail)]).first), "#{method} #{tail}"
      end
      nested = { 'method' => 'POST', 'path' => "#{base}/network/technique", 'status' => 200,
                 'body' => { 'success' => true, 'session' => session.except('success') } }
      assert_equal [['mfa_session', 'mfa:session:hana']], found(scan_rows([nested]).first)
      # a technique session nested the same way is the one way in the server gives there
      nested['body']['session']['via'] = 'technique'
      assert_equal [], found(scan_rows([nested]).first)
      # a desktop's own session is not an answer to judge here
      assert_equal [], found(scan_rows(rows(108)).first)
      # the earned session, then a sign-in answer whose body the recorder lost: nothing is earned any more
      boot = lambda do
        { 'method' => 'GET', 'path' => "#{base}/scenario", 'status' => 200,
          'body' => { 'sessions' => { 'code_pc1' => session.except('success').merge('host' => 'ACC01') } } }
      end
      control = rows(95, 97, 98, 100) << boot.call
      assert_equal [], found(scan_rows(control).first)
      lost = rows(107).first
      lost.delete('body')
      lost['bodyError'] = 'unreadable'
      assert_equal [['mfa_session', 'mfa:session:hana']], found(scan_rows(rows(95, 97, 98, 100) + [lost, boot.call]).first)
    end
  end
end
