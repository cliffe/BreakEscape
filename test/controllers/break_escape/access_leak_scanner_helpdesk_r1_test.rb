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
  end
end
