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
      # a desktop's own session is not judged as an answer, but R3-5 reports a step-less keyboard session at a step PC
      assert_equal [['mfa_session', 'mfa:session:hana']], found(scan_rows(rows(108)).first)
      assert_equal [], found(scan_rows(rows(95, 97, 98, 108)).first)
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

    # ---- R2-L5: a session a route the rules do not read replaced ----------------------------------------------------------

    test 'R2-L5 a technique answer that replaces the session at the PC takes the earned session and the lock back' do
      base = '/break_escape/games/86'
      other = { 'method' => 'POST', 'path' => "#{base}/network/technique", 'status' => 200,
                'body' => { 'success' => true, 'session' => { 'npcId' => 'ines', 'via' => 'technique', 'host' => 'ACC01' } } }
      unlock = rows(107).first.merge('login' => { 'pcId' => 'code_pc1' })
      assert_equal [], found(scan_rows(rows(95, 97, 98, 100) + [unlock]).first)
      assert_equal [['mfa_session', 'mfa:session:hana']], found(scan_rows(rows(95, 97, 98, 100) + [other, unlock]).first)
      # a session whose host label names no PC replaces every PC's
      other['body']['session']['host'] = 'NOWHERE'
      assert_equal [['mfa_session', 'mfa:session:hana']], found(scan_rows(rows(95, 97, 98, 100) + [other, unlock]).first)
    end

    # ---- R2-L6: closing is safe on any spelling or status; earning and using a name need the strict 200 answer --------------

    test 'R2-L6 a cancel on the loose route closes the step; a 201 sign-in uses no name' do
      base = '/break_escape/games/86'
      post = lambda do |tail, body, extra = {}|
        { 'method' => 'POST', 'path' => "#{base}/#{tail}", 'status' => 200, 'body' => body }.merge(extra)
      end
      required = post.call('login', { 'success' => false, 'mfaRequired' => true, 'mfa' => 'push_number_match', 'pcId' => 'match_pc', 'npcId' => 'nia', 'number' => 42 })
      take = post.call('inventory', { 'success' => true }, 'inv' => { 'action' => 'add', 'itemId' => 'nia_phone', 'usedOn' => nil })
      pass = post.call('mfa/approve', { 'success' => true, 'npcId' => 'nia', 'username' => 'nfaraday', 'via' => 'password', 'approvedBy' => 'player' })
      assert_equal [], found(scan_rows([required, take, pass]).first)
      cancel = post.call('mfa/approve.json', { 'success' => false, 'cancelled' => true })
      assert_equal [['mfa_session', 'mfa:session:nia']], found(scan_rows([required, take, cancel, pass]).first)
      cancel = post.call('mfa/approve', { 'success' => false, 'cancelled' => true }, 'status' => 422)
      assert_equal [['mfa_session', 'mfa:session:nia']], found(scan_rows([required, take, cancel, pass]).first)
      # a sign-in answer with status 201 uses up no name
      list = rows(278, 279)
      list[0]['status'] = 201
      findings, scanner = scan_rows(list, signins: %w[cal@plain_pc#1])
      assert_equal ['cal@plain_pc#1 (--signin)'], scanner.unused_entries
      assert_equal [['mfa_session', 'mfa:session:cal']], found(findings)
    end

    # ---- R2-L8: a token session over a foothold, locked, is unlocked by the password with no step ---------------------------

    test 'R2-L8 an honest unlock of a locked token session is clean; with no lock it is reported' do
      base = '/break_escape/games/86'
      token = { 'method' => 'POST', 'path' => "#{base}/login", 'status' => 200, 'login' => { 'pcId' => 'code_pc1' },
                'body' => { 'success' => true, 'npcId' => 'hana', 'username' => 'hquill', 'via' => 'credential', 'kind' => 'token' } }
      lock = rows(100).first
      unlock = rows(107).first.merge('login' => { 'pcId' => 'code_pc1' })
      assert_equal [], found(scan_rows([token, lock, unlock]).first)
      assert_equal [['mfa_session', 'mfa:session:hana']], found(scan_rows([token, unlock]).first)
      # the unlock is used up, as any lock is
      assert_equal [['mfa_session', 'mfa:session:hana']], found(scan_rows([token, lock, unlock, unlock]).first)
    end

    # ---- R2-L7: every `code` value in a scenario with a code device is a finding unless the scenario authors it -------------

    test 'R2-L7 a code value passes only when authored and not six digits' do
      data = scenario
      data['rooms'].values.first['warrantyProbe'] = { 'code' => 'W-03' }
      room = lambda do |value|
        { 'method' => 'GET', 'path' => '/break_escape/games/86/room/lobby', 'status' => 200,
          'body' => { 'objects' => [{ 'id' => 'x', 'minigameData' => { 'warranties' => [{ 'id' => 'w', 'code' => value }] } }] } }
      end
      scan_with = ->(value) { found(AccessLeakScanner.new(data).scan([['c', 1, room.call(value)]])) }
      assert_equal [], scan_with.call('W-03')
      code = ['mfa_secret', 'mfa:key:code']
      ['A12', '12345', 12_345, 123_456.0, '123.456', '123_456', '123/456', "123\n456", "\uFF11\uFF12\uFF13\uFF14\uFF15\uFF16", '123456', 123_456, nil, true, '', { 'x' => 1 }].each do |value|
        assert_includes scan_with.call(value), code, value.inspect
      end
      # an authored six-digit value does not make the six digits a safe value
      data['rooms'].values.first['sixProbe'] = { 'code' => '123456' }
      assert_includes scan_with.call('123456'), code
    end

    # ---- R2-L9, R1-L12, R1-L13: tags the recorder never writes -----------------------------------------------------------

    test 'R2-L9 a capture holding a login tag is refused' do
      tagged = rows(95, 97)
      assert_nil AccessLeakScanner.hand_tag_problem([['capture.jsonl', tagged]])
      tagged[1]['login'] = { 'pcId' => 'code_pc1' }
      assert_match(/capture.jsonl row 2 holds a `login` tag/, AccessLeakScanner.hand_tag_problem([['capture.jsonl', tagged]]))
    end

    test 'R1-L13 two open steps of one account in a browser capture: a pass answer names no PC, so it is reported' do
      second = rows(95).first
      second['body'] = second['body'].merge('pcId' => 'code_pc2')
      assert_equal [], found(scan_rows(rows(95, 97)).first) # one open step: placed
      assert_equal [['mfa_session', 'mfa:session:hana']], found(scan_rows([second] + rows(95, 97, 98)).first)
    end
  end
end
