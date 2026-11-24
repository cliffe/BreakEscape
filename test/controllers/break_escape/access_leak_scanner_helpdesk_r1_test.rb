require 'test_helper'
require_relative 'access_leak_scanner_helpdesk_test'

module BreakEscape
  # Ops S8b fix round for the leak scanner's helpdesk rules (review S8b_scanner_R1: R1-L2 to R1-L12). Each test builds the
  # reviewer's capture (probes P1 to P6) with the first test file's helpers and scans it with the real scanner. The grant answers
  # now carry `npcId` and `deskId`; every own-form allowance is tied to the one account and desk its grant named.
  class AccessLeakScannerHelpdeskR1Test < AccessLeakScannerHelpdeskTest
    # the parent's tests run in their own file only
    AccessLeakScannerHelpdeskTest.instance_methods(false).grep(/\Atest_/).each { |m| undef_method m }

    def pc_of(data, id)
      data['rooms'].values.flat_map { |r| r['objects'] || [] }.find { |o| o['id'] == id }
    end

    def helpdesk_owners(found)
      owners(helpdesk_only(found))
    end

    # ---- the echo: a grant answer names its account and desk ----

    test 'a grant answer without npcId or deskId, or with a name or desk the scenario does not have, earns nothing' do
      %w[npcId deskId].each do |key|
        bare = grant_mfa
        bare['body'].delete(key)
        found = scan([bare, own_device('hana')])
        assert_includes helpdesk_owners(found), 'helpdesk:answer', key
        assert_includes helpdesk_owners(found), 'helpdesk:own:device', key
      end
      assert_includes rules(scan([grant_mfa(npc: 'ghost'), own_device('hana')])), 'helpdesk_grant'
      assert_includes rules(scan([grant_mfa(desk: 'ghost_desk'), own_device('hana')])), 'helpdesk_grant'
      assert_includes helpdesk_owners(scan([grant_mfa(npc: 'cal'), own_device('cal')])), 'helpdesk:own:device', 'cal has no recovery answers: no desk covers him'
      typed = grant_mfa
      typed['body']['npcId'] = 'nfaraday' # a username, not an NPC id
      assert_includes rules(scan([typed])), 'helpdesk_grant'
      assert_includes helpdesk_owners(scan([grant_pw('body.npcId' => 'nia')])), 'helpdesk:reset:hana', 'the password is hana\'s, the grant names nia'
      assert_includes rules(scan([grant_pw('body.npcId' => 'nia')])), 'helpdesk_grant'
    end

    test 'a callback desk named by the grant needs the phone held at that row' do
      callback = scenario { |d| d['helpdesks']['it_desk'].merge!('verify' => 'callback'); d['helpdesks']['it_desk'].delete('questions') }
      assert_includes rules(scan([grant_mfa(npc: 'nia'), own_device('nia')], callback)), 'helpdesk_grant'
      assert_empty helpdesk_only(scan([take('nia_phone'), grant_mfa(npc: 'nia'), own_device('nia')], callback))
    end

    # R1-L11: the cover is judged at the grant only
    test 'handing a borrowed phone back after the grant does not take the own forms away' do
      callback = scenario { |d| d['helpdesks']['it_desk'].merge!('verify' => 'callback'); d['helpdesks']['it_desk'].delete('questions') }
      drop = row('POST', 'inventory', { 'status' => 200, 'body' => { 'success' => true } }, extra: { 'inv' => { 'action' => 'remove', 'itemId' => 'nia_phone', 'usedOn' => nil } })
      assert_empty helpdesk_only(scan([take('nia_phone'), grant_mfa(npc: 'nia'), drop, own_device('nia')], callback))
    end

    # ---- R1-L6, probes P4 and P4b ----

    test 'R1-L6 P4: a repeat of one grant, or a grant for one account, allows only that account' do
      found = scan([grant_mfa, grant_mfa, own_device('hana'), login_own_push])
      assert_includes helpdesk_owners(found), 'helpdesk:own:ownPhone'
      assert_not_includes helpdesk_owners(found), 'helpdesk:own:device'
    end

    test 'R1-L6 P4b: a grant for one account does not open another account\'s own sign-in' do
      assert_includes helpdesk_owners(scan([grant_mfa, login_own_push])), 'helpdesk:own:ownPhone'
      assert_empty helpdesk_only(scan([grant_mfa(npc: 'nia'), login_own_push]))
    end

    # ---- R1-L2, probe P2 ----

    def two_match_scenario
      scenario do |d|
        pc_of(d, 'code_pc1')['policy'] = pc_of(d, 'match_pc')['policy']
      end
    end

    def match_login(data, pc, npc, number)
      row('POST', 'login', { 'status' => 200, 'body' => { 'success' => false, 'mfaRequired' => true, 'mfa' => 'push_number_match', 'pcId' => pc, 'npcId' => npc, 'number' => number } })
    end

    def two_owner_list(data)
      entry = lambda do |pc, npc, nums|
        o = pc_of(data, pc)
        { 'pcId' => pc, 'host' => o['host'] || o['name'], 'username' => npc_of(data, npc)['creds']['username'], 'n' => 1, 'numbers' => nums }
      end
      row('GET', 'mfa/phone', { 'status' => 200, 'body' => { 'requests' => [entry.call('match_pc', 'nia', [31, 47, 62]), entry.call('code_pc1', 'hana', [12, 55, 90])] } }, query: 'own=1')
    end

    test 'R1-L2 P2: one grant row does not credit two accounts\' number choices in one list' do
      data = two_match_scenario
      rows = [grant_mfa(npc: 'nia'), match_login(data, 'match_pc', 'nia', 47), match_login(data, 'code_pc1', 'hana', 55), two_owner_list(data)]
      assert_includes helpdesk_owners(scan(rows, data)), 'helpdesk:own:phone'
      assert_includes rules(scan(rows, data)), 'mfa_secret', 'the numbers reach the second-step rules whole'
      both = [grant_mfa(npc: 'nia'), grant_mfa(npc: 'hana')] + rows.drop(1)
      assert_not_includes helpdesk_owners(scan(both, data)), 'helpdesk:own:phone'
    end

    # ---- R1-L3 and R1-L4: the own-phone step, who may close it ----

    def cal_scenario
      scenario { |d| npc_of(d, 'cal')['creds']['recovery'] = { 'staff_no' => '40999', 'manager' => 'Ada Low' } }
    end

    def own_push_login(pc = 'push_pc', npc = 'cal')
      row('POST', 'login', shape('login.mfa_required_own_plain_push', { 'body.pcId' => pc, 'body.npcId' => npc }))
    end

    def session_pass(route, npc, data, extra = {}, query: nil)
      n = npc_of(data, npc)
      body = { 'success' => true, 'npcId' => npc, 'username' => n['creds']['username'], 'displayName' => n['displayName'] || npc, 'via' => 'password' }.merge(extra)
      row('POST', route, { 'status' => 200, 'body' => body }, query: query)
    end

    def own_list(data, pc = 'push_pc', npc = 'cal')
      o = pc_of(data, pc)
      entry = { 'pcId' => pc, 'host' => o['host'] || o['name'], 'username' => npc_of(data, npc)['creds']['username'], 'n' => 1 }
      row('GET', 'mfa/phone', { 'status' => 200, 'body' => { 'requests' => [entry] } }, query: 'own=1')
    end

    test 'R1-L3 P1: the owner approving an own-phone push step is a finding, so is a held-phone approval, and a plain step for a re-enrolled account' do
      data = cal_scenario
      steps = [grant_mfa(npc: 'cal'), own_push_login]
      owner = scan(steps + [session_pass('mfa/prompt', 'cal', data, { 'approvedBy' => 'owner' })], data)
      assert_includes helpdesk_owners(owner), 'helpdesk:own:pass'
      player = scan([take('cal_phone')] + steps + [session_pass('mfa/approve', 'cal', data, { 'approvedBy' => 'player' }, query: 'own=1')], data)
      assert_includes helpdesk_owners(player), 'helpdesk:own:pass'
      plain = row('POST', 'login', { 'status' => 200, 'body' => { 'success' => false, 'mfaRequired' => true, 'mfa' => 'push', 'pcId' => 'push_pc', 'npcId' => 'cal' } })
      assert_includes helpdesk_owners(scan([grant_mfa(npc: 'cal'), plain], data)), 'helpdesk:own:plain'
    end

    test 'R1-L3: a pass for an account with no open own-phone step is judged by the older rules alone' do
      data = cal_scenario
      plain_account = scan([session_pass('mfa/prompt', 'cal', data, { 'approvedBy' => 'owner' })], data)
      assert_empty helpdesk_only(plain_account)
    end

    test 'R1-L4: the honest own-phone approval is clean and holds the session' do
      data = cal_scenario
      run = [grant_mfa(npc: 'cal'), own_push_login, own_list(data), session_pass('mfa/approve', 'cal', data, { 'approvedBy' => 'own_phone' }, query: 'own=1')]
      assert_empty scan(run, data)
      later = scan(run + [row('GET', 'container/push_pc', { 'status' => 200, 'body' => { 'contents' => [] } })], data)
      assert_not_includes rules(later), 'mfa_session'
    end

    test 'R1-L4: an own-phone approval with any proof missing stays a finding' do
      data = cal_scenario
      approve = ->(query = 'own=1', npc = 'cal') { session_pass('mfa/approve', npc, data, { 'approvedBy' => 'own_phone' }, query: query) }
      cases = {
        'no grant' => [own_push_login, own_list(data), approve.call],
        'no step' => [grant_mfa(npc: 'cal'), own_list(data), approve.call],
        'no list' => [grant_mfa(npc: 'cal'), own_push_login, approve.call],
        'grant for another account' => [grant_mfa(npc: 'hana'), own_push_login, own_list(data), approve.call],
        'no own query' => [grant_mfa(npc: 'cal'), own_push_login, own_list(data), approve.call(nil)],
        'own=2' => [grant_mfa(npc: 'cal'), own_push_login, own_list(data), approve.call('own=2')],
        'a second parameter' => [grant_mfa(npc: 'cal'), own_push_login, own_list(data), approve.call('own=1&x=1')],
        'the step closed by a cancel' => [grant_mfa(npc: 'cal'), own_push_login, own_list(data),
                                          row('POST', 'mfa/approve', { 'status' => 200, 'body' => { 'success' => false, 'cancelled' => true } }), approve.call]
      }
      cases.each do |label, rows|
        found = scan(rows, data)
        assert_includes rules(found), 'mfa_session', label
      end
      other_route = scan([grant_mfa(npc: 'cal'), own_push_login, own_list(data), session_pass('mfa/prompt', 'cal', data, { 'approvedBy' => 'own_phone' })], data)
      assert_includes rules(other_route), 'mfa_session'
    end

    # ---- R1-L5, probe P3: no code device authored ----

    def no_device_scenario
      strip = lambda do |node|
        case node
        when Hash then node.each_value { |v| strip.call(v) }
        when Array
          node.reject! { |v| v.is_a?(Hash) && v['type'] == BreakEscape::MfaModel::CODE_DEVICE }
          node.each { |v| strip.call(v) }
        end
      end
      scenario { |d| strip.call(d) }
    end

    test 'R1-L5 P3: with no code device authored a six-digit code is a finding unless it is an earned own-device answer' do
      data = no_device_scenario
      leak = row('GET', 'mfa/device', { 'status' => 200, 'body' => { 'deviceId' => 'spare', 'displayName' => 'x', 'npcId' => 'hana', 'code' => '482916', 'secondsLeft' => 9, 'used' => false } }, query: 'npc_id=hana')
      assert_includes helpdesk_owners(scan([leak], data)), 'helpdesk:own:code'
      room = row('GET', 'room/lobby', { 'status' => 200, 'body' => { 'ownCode' => { 'code' => '48 29 16' } } })
      assert_includes helpdesk_owners(scan([room], data)), 'helpdesk:own:code'
      assert_empty helpdesk_only(scan([row('GET', 'room/lobby', { 'status' => 200, 'body' => { 'warranty' => { 'code' => 'W-03' } } })], data))
    end

    test 'R1-L5: the honest own-code step for a re-enrolled account with no authored device is clean' do
      data = no_device_scenario
      run = [grant_mfa, login_own_code, own_device('hana'), session_pass('mfa/verify', 'hana', data)]
      assert_empty scan(run, data)
      no_grant = scan([login_own_code, own_device('hana')], data)
      assert_includes helpdesk_owners(no_grant), 'helpdesk:own:device'
      assert_includes helpdesk_owners(no_grant), 'helpdesk:own:code'
    end

    # ---- R1-L10: the old device and phone after re-enrolment ----

    test 'R1-L10 P6e: the old device\'s code and the old phone\'s list are findings once a grant re-enrolled the account' do
      data = scenario
      device = row('GET', 'mfa/device', { 'status' => 200, 'body' => { 'deviceId' => 'hana_device', 'displayName' => npc_of(data, 'hana')['displayName'] || 'hana', 'npcId' => 'hana', 'code' => '111222', 'secondsLeft' => 5, 'used' => false } }, query: 'item_id=hana_device')
      assert_includes helpdesk_owners(scan([grant_mfa, own_device('hana'), take('hana_device'), device], data)), 'helpdesk:old:code'
      assert_empty helpdesk_only(scan([take('hana_device'), device], data))
      phone = row('GET', 'mfa/phone', { 'status' => 200, 'body' => { 'requests' => [] } }, query: 'npc_id=hana')
      assert_includes helpdesk_owners(scan([grant_mfa, take('hana_phone'), phone], data)), 'helpdesk:old:phone'
    end
  end
end
