require 'test_helper'
require_relative 'access_leak_scanner_helpdesk_test'

module BreakEscape
  # Showcase leak review (demo_ops_second_step game 325, response 203): a REPEAT password grant for an account an earlier
  # credited grant earned, inside a stop that refusals on ANOTHER name started. The refusal rows name no username, so the stop
  # is held against every name; a repeat password grant sends only the value the run already holds, so it is not held to the
  # stop. A first grant, a repeat carrying another value, or a second-step grant inside the stop stays flagged.
  class AccessLeakScannerHelpdeskRepeatGrantTest < AccessLeakScannerHelpdeskTest
    AccessLeakScannerHelpdeskTest.instance_methods(false).grep(/\Atest_/).each { |m| undef_method m }

    def refuse_stop(at)
      [refusal('helpdesk.refused', {}, at), refusal('helpdesk.refused', {}, at + 1), refusal('helpdesk.refused_last', {}, at + 2), refusal('helpdesk.blocked', {}, at + 3)]
    end

    test 'a repeat password grant inside a stop after a credited first grant is honest' do
      rows = [grant_pw({}, 50), keyring([reset_entry('hana', HANA_PW)], 51)] + refuse_stop(100) + [grant_pw({}, 150), keyring([reset_entry('hana', HANA_PW)], 151)]
      assert_empty helpdesk_only(scan(rows))
    end

    test 'tamper: a first password grant inside the stop stays flagged' do
      rows = refuse_stop(100) + [grant_pw({}, 150)]
      assert_includes rules(scan(rows)), 'helpdesk_grant'
      assert_includes rules(scan(rows)), 'helpdesk_secret'
    end

    test 'tamper: a repeat whose first grant was itself inside the stop stays flagged' do
      rows = refuse_stop(100) + [grant_pw({}, 150), grant_pw({}, 160)]
      assert_equal 2, scan(rows).count { |f| f.rule == 'helpdesk_grant' }
    end

    test 'tamper: a repeat grant naming the account with another account\'s value stays flagged' do
      rows = [grant_pw({}, 50)] + refuse_stop(100) + [grant_pw({ 'body.password' => CAL_PW }, 150)]
      assert_includes rules(scan(rows)), 'helpdesk_grant'
      assert_includes owners(scan(rows)), 'helpdesk:reset:cal'
    end

    test 'tamper: a second-step grant inside the stop after a password grant stays flagged' do
      rows = [grant_pw({}, 50)] + refuse_stop(100) + [grant_mfa(150)]
      assert_includes rules(scan(rows)), 'helpdesk_grant'
    end
  end
end
