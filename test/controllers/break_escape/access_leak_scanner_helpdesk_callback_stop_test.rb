require 'test_helper'
require_relative 'access_leak_scanner_helpdesk_test'

module BreakEscape
  # Second-step tour finding (game 302, response 443): a grant from the call-back desk for an account whose phone the run holds, after
  # a stop on ANOTHER desk. The recorder's refusals name no desk, so the stop is held against every desk; a call-back desk is clear of
  # it only on proof (phone held now and at every refusal row so far, table not full). Trimmed from the capture: take the phone,
  # refuse three times on the question desk (stop), then the call-back grant inside the stop.
  class AccessLeakScannerHelpdeskCallbackStopTest < AccessLeakScannerHelpdeskTest
    AccessLeakScannerHelpdeskTest.instance_methods(false).grep(/\Atest_/).each { |m| undef_method m }

    def two_desks
      scenario { |d| d['helpdesks']['call_desk'] = { 'npc' => 'ria', 'verify' => 'callback', 'resets' => %w[mfa] } }
    end

    def refuse_stop(at)
      [refusal('helpdesk.refused', {}, at), refusal('helpdesk.refused', {}, at + 1), refusal('helpdesk.refused_last', {}, at + 2), refusal('helpdesk.blocked', {}, at + 3)]
    end

    test 'a call-back grant for a held phone inside a stop of the other desk is honest' do
      data = two_desks
      rows = [take('nia_phone')] + refuse_stop(100) + [grant_mfa(150, npc: 'nia', desk: 'call_desk')]
      assert_empty helpdesk_only(scan(rows, data)).select { |f| f.rule == 'helpdesk_grant' }
    end

    test 'tamper: the phone not held at the grant stays flagged' do
      data = two_desks
      rows = refuse_stop(100) + [grant_mfa(150, npc: 'nia', desk: 'call_desk')]
      assert_includes rules(scan(rows, data)), 'helpdesk_grant'
    end

    test 'tamper: the phone taken only after a refusal stays flagged' do
      data = two_desks
      rows = refuse_stop(100) + [take('nia_phone'), grant_mfa(150, npc: 'nia', desk: 'call_desk')]
      assert_includes rules(scan(rows, data)), 'helpdesk_grant'
    end

    test 'tamper: the same grant from the question desk inside the stop stays flagged' do
      data = two_desks
      rows = [take('nia_phone')] + refuse_stop(100) + [grant_mfa(150, npc: 'nia', desk: 'it_desk')]
      assert_includes rules(scan(rows, data)), 'helpdesk_grant'
    end

    test 'tamper: a call-back grant for an account whose phone is not held stays flagged' do
      data = two_desks
      rows = [take('nia_phone')] + refuse_stop(100) + [grant_mfa(150, npc: 'hana', desk: 'call_desk')]
      assert_includes rules(scan(rows, data)), 'helpdesk_grant'
    end

    test 'tamper: a call-back desk that also resets passwords can stop the name itself, so the mfa grant stays flagged' do
      data = scenario { |d| d['helpdesks']['call_desk'] = { 'npc' => 'ria', 'verify' => 'callback', 'resets' => %w[password mfa] } }
      rows = [take('nia_phone')] + refuse_stop(100) + [grant_mfa(150, npc: 'nia', desk: 'call_desk')]
      assert_includes rules(scan(rows, data)), 'helpdesk_grant'
    end
  end
end
