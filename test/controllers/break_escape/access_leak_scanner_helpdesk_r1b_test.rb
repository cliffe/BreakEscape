require 'test_helper'
require_relative 'access_leak_scanner_helpdesk_r1_test'

module BreakEscape
  # Ops S8b fix round 1, scanner second review (S8b_R1_scanner.md): R1-SCANNER1 to R1-SCANNER8, the probes of the review turned into
  # tests, plus the rule for a password grant dropping an account's pending second steps. Built with the first R1 file's helpers.
  class AccessLeakScannerHelpdeskR1bTest < AccessLeakScannerHelpdeskR1Test
    AccessLeakScannerHelpdeskR1Test.instance_methods(false).grep(/\Atest_/).each { |m| undef_method m }

    EXPIRED = { 'status' => 422, 'body' => { 'success' => false, 'message' => 'Incorrect username or password', 'mfaIncorrect' => true, 'expired' => true } }.freeze

    def expiry_row(route = 'mfa/verify', body = EXPIRED, extra: {})
      row('POST', route, Marshal.load(Marshal.dump(body)), extra: extra)
    end

    # Two open own steps: hana's code step at code_pc1 and nia's number-match push step at match_pc, then nia's own list.
    def two_steps(data)
      [grant_mfa(npc: 'hana'), grant_mfa(npc: 'nia'), login_own_code, login_own_push, own_device('hana'), phone_own]
    end

    def nia_own_approve(data, extra_query = 'own=1')
      session_pass('mfa/approve', 'nia', data, { 'approvedBy' => 'own_phone' }, query: extra_query)
    end

    # ---- R1-SCANNER1 and R1-SCANNER2 (one commit) ----

    test 'R1-SCANNER1 F1: an expired code step does not take away the honest approval of an open push step' do
      data = scenario
      run = two_steps(data) + [expiry_row, nia_own_approve(data)]
      assert_empty scan(run, data)
    end

    test 'R1-SCANNER1: a cancel on the push route closes the push steps' do
      data = scenario
      cancel = expiry_row('mfa/approve', { 'status' => 200, 'body' => { 'success' => false, 'cancelled' => true } })
      # the cancel closes the push step (nia's), so her approval is not proved; it stays a finding
      assert_includes rules(scan(two_steps(data) + [cancel, nia_own_approve(data)], data)), 'mfa_session'
    end

    test 'R1-SCANNER1: a pass at one PC closes only the step that pass answer closes' do
      data = scenario
      # hana passes her code step: nia's push step (another account, another PC) stays open
      ok = session_pass('mfa/verify', 'hana', data)
      assert_empty scan(two_steps(data) + [ok, nia_own_approve(data)], data)
    end

    test 'R1-SCANNER1: an ended PC does not close a step the server keeps' do
      data = scenario
      # an ended PC (a sign-in elsewhere) does not touch a pending step on the server, so the approval is still honest
      ended = row('POST', 'inventory', { 'status' => 200, 'body' => { 'success' => true, 'endedPcIds' => ['match_pc'] } })
      found = scan(two_steps(data) + [ended, nia_own_approve(data)], data)
      assert_not_includes helpdesk_owners(found), 'helpdesk:own:pass'
      assert_not_includes rules(found), 'mfa_session'
    end

    test 'R1-SCANNER2 G1: after an expiry row, the owner or a held phone approving a re-enrolled account is still a finding' do
      data = cal_scenario
      steps = [grant_mfa(npc: 'cal'), own_push_login, expiry_row]
      owner = scan(steps + [session_pass('mfa/prompt', 'cal', data, { 'approvedBy' => 'owner' })], data)
      assert_includes helpdesk_owners(owner), 'helpdesk:own:pass'
      held = scan([take('cal_phone')] + steps + [session_pass('mfa/approve', 'cal', data, { 'approvedBy' => 'player' }, query: 'own=1')], data)
      assert_includes helpdesk_owners(held), 'helpdesk:own:pass'
      # with no row at all closing the step, and with the step never opened, the same
      never_opened = scan([grant_mfa(npc: 'cal'), session_pass('mfa/prompt', 'cal', data, { 'approvedBy' => 'owner' })], data)
      assert_includes helpdesk_owners(never_opened), 'helpdesk:own:pass'
    end

    test 'R1-SCANNER2: an account no credited grant re-enrolled is judged by the older rules alone, after an expiry row too' do
      data = cal_scenario
      assert_empty helpdesk_only(scan([expiry_row, session_pass('mfa/prompt', 'cal', data, { 'approvedBy' => 'owner' })], data))
    end

    # ---- the password grant drops the account's pending second steps ----

    test 'a pass for an account after a password grant, with no new second step, is a finding; with a new step it is clean' do
      data = scenario
      pass = session_pass('mfa/verify', 'hana', data)
      plain = [login_plain_code, grant_pw, pass]
      assert_includes rules(scan(plain, data)), 'mfa_session', 'the grant dropped the pending step'
      assert_not_includes rules(scan([login_plain_code, pass], data)), 'mfa_session', 'control: without the grant the open step is passed honestly'
      renewed = [login_plain_code, grant_pw, login_plain_code, session_pass('mfa/verify', 'hana', data)]
      assert_not_includes rules(scan(renewed, data)), 'mfa_session'
    end

    test 'an uncredited password grant drops nothing' do
      data = scenario
      wrong = grant_pw('body.npcId' => 'nia') # the password is hana's: not credited
      found = scan([login_plain_code, wrong, session_pass('mfa/verify', 'hana', data)], data)
      assert_includes rules(found), 'helpdesk_grant'
    end

    def login_plain_code(pc: 'code_pc1', npc: 'hana')
      row('POST', 'login', { 'status' => 200, 'body' => { 'success' => false, 'mfaRequired' => true, 'mfa' => 'code', 'pcId' => pc, 'npcId' => npc } })
    end

    # ---- R1-SCANNER3: the session rules turn on for a step only a re-enrolment creates ----

    def reenrol_only_scenario
      data = no_device_scenario
      data['policies'].each_value { |p| p.delete('mfa') unless p['mfa'] == 'code' }
      %w[push_gate match_gate].each { |k| data['policies'][k].delete('mfa') }
      data
    end

    def code_session_rows(data)
      body = { 'success' => true, 'npcId' => 'hana', 'username' => npc_of(data, 'hana')['creds']['username'], 'displayName' => npc_of(data, 'hana')['displayName'] || 'hana', 'via' => 'password' }
      login = row('POST', 'login', { 'status' => 200, 'body' => body }, extra: { 'pc' => { 'pcId' => 'code_pc1' } })
      desktop = row('GET', 'container/code_pc1', { 'status' => 200, 'body' => { 'container_id' => 'code_pc1', 'contents' => [], 'session' => body.reject { |k, _| k == 'success' } } })
      [login, desktop]
    end

    test 'R1-SCANNER3 G2: a scenario whose only second step comes from a re-enrolment still has its session rules' do
      data = reenrol_only_scenario
      assert_empty scan(code_session_rows(data), data), 'before any grant nobody owes a step'
      found = scan([grant_mfa] + code_session_rows(data), data)
      assert_includes rules(found), 'mfa_session', 'a plain session for the re-enrolled account'
    end

    test 'R1-SCANNER3: the honest re-enrolled run in that scenario is clean' do
      data = reenrol_only_scenario
      run = [grant_mfa, login_own_code, own_device('hana'), session_pass('mfa/verify', 'hana', data)]
      assert_empty scan(run, data)
    end

    test 'R1-SCANNER3: no desk that resets a second step leaves the session rules as they were' do
      data = reenrol_only_scenario
      data['helpdesks']['it_desk']['resets'] = %w[password]
      assert_empty scan([grant_pw] + code_session_rows(data), data)
    end
    # ---- R1-SCANNER4: a recovery answer one level below its question id ----

    def lobby(body)
      row('GET', 'room/lobby', { 'status' => 200, 'body' => body })
    end

    test 'R1-SCANNER4: an authored answer anywhere below its question id is a finding, a label or another value is not' do
      [{ 'staff_no' => { 'value' => '40612' } }, { 'staff_no' => [{ 'v' => '40612' }] }, { 'staff_no' => { 'a' => { 'b' => ['x', { 'c' => ' 40612 ' }] } } },
       { 'manager' => { 'name' => 'pia hart' } }].each do |extra|
        assert_includes helpdesk_owners(scan([lobby('extra' => extra)])), "helpdesk:recovery:#{extra.keys.first}", extra.inspect
      end
      [{ 'staff_no' => { 'value' => 'Staff number' } }, { 'staff_no' => [{ 'v' => '99999' }] }, { 'other' => { 'value' => '40612' } },
       { 'staff_no' => { 'value' => 40612 } }].each do |extra|
        assert_empty helpdesk_only(scan([lobby('extra' => extra)])), extra.inspect
      end
    end

    # ---- R1-SCANNER5: the old phone's list and old device's code with a second query parameter ----

    test 'R1-SCANNER5: the old phone list and old device code of a re-enrolled account are findings whatever other parameters the query has' do
      data = scenario
      list = { 'requests' => [{ 'pcId' => 'code_pc1', 'host' => 'x', 'username' => 'u', 'n' => 1 }] }
      device = { 'deviceId' => 'hana_device', 'displayName' => npc_of(data, 'hana')['displayName'] || 'hana', 'npcId' => 'hana', 'code' => '111222', 'secondsLeft' => 5, 'used' => false }
      ['npc_id=hana', 'npc_id=hana&x=1', 'x=1&npc_id=hana'].each do |q|
        found = scan([grant_mfa, row('GET', 'mfa/phone', { 'status' => 200, 'body' => list }, query: q)], data)
        assert_includes helpdesk_owners(found), 'helpdesk:old:phone', q
      end
      ['item_id=hana_device', 'item_id=hana_device&x=1'].each do |q|
        found = scan([grant_mfa, own_device('hana'), take('hana_device'), row('GET', 'mfa/device', { 'status' => 200, 'body' => device }, query: q)], data)
        assert_includes helpdesk_owners(found), 'helpdesk:old:code', q
      end
      assert_empty helpdesk_only(scan([row('GET', 'mfa/phone', { 'status' => 200, 'body' => list }, query: 'npc_id=hana&x=1')], data))
    end

    # ---- R1-SCANNER6: the honest approval holds the session (the desktop row carries the session) ----

    test 'R1-SCANNER6: the session an own-phone approval earned is held at the desktop, and is not held without the approval' do
      data = cal_scenario
      cal = npc_of(data, 'cal')
      session = { 'npcId' => 'cal', 'username' => cal['creds']['username'], 'displayName' => cal['displayName'] || 'cal', 'via' => 'password' }
      desktop = row('GET', 'container/push_pc', { 'status' => 200, 'body' => { 'container_id' => 'push_pc', 'contents' => [], 'session' => session } })
      honest = [grant_mfa(npc: 'cal'), own_push_login, own_list(data), session_pass('mfa/approve', 'cal', data, { 'approvedBy' => 'own_phone' }, query: 'own=1')]
      assert_empty scan(honest + [desktop], data)
      assert_includes rules(scan([grant_mfa(npc: 'cal'), own_push_login, desktop], data)), 'mfa_session'
    end

    # ---- R1-SCANNER8: a reset password as a hash key ----

    test 'R1-SCANNER8: a reset password used as a key is a finding, before and after the grant that earned it' do
      body = { HANA_PW => true }
      assert_includes helpdesk_owners(scan([lobby(body)])), 'helpdesk:reset:hana'
      assert_includes helpdesk_owners(scan([grant_pw, lobby('a' => [{ "x #{HANA_PW}" => 1 }])])), 'helpdesk:reset:hana'
      assert_empty helpdesk_only(scan([lobby('Some-Other-Key' => true)]))
      assert_empty scan([lobby(body)]).select { |f| f.json_path.include?(HANA_PW) }, 'the reported path never carries the password'
    end
  end
end
