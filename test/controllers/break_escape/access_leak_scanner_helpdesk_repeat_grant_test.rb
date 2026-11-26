require 'test_helper'
require_relative 'access_leak_scanner_helpdesk_test'

module BreakEscape
  # Showcase leak review (demo_ops_second_step game 325, response 203): a REPEAT password grant for an account an earlier
  # credited grant earned, inside a stop that refusals on ANOTHER name started. The refusal rows name no username, so the tester
  # names the stopping rows with `refused:` (`--refused`); a repeat password grant then passes a stop named for another name.
  # Review R3 minor 2: a stop named for the grant's OWN account, or not named at all, still holds the repeat grant. A first
  # grant, a repeat carrying another value, or a second-step grant inside the stop stays flagged.
  class AccessLeakScannerHelpdeskRepeatGrantTest < AccessLeakScannerHelpdeskTest
    AccessLeakScannerHelpdeskTest.instance_methods(false).grep(/\Atest_/).each { |m| undef_method m }

    def refuse_stop(at)
      [refusal('helpdesk.refused', {}, at), refusal('helpdesk.refused', {}, at + 1), refusal('helpdesk.refused_last', {}, at + 2), refusal('helpdesk.blocked', {}, at + 3)]
    end

    def time_at(seconds)
      (Time.utc(2026, 1, 1) + seconds).iso8601(3)
    end

    # The stopping rows of refuse_stop(100): the refusal with triesLeft 0 and the blocked answer.
    def named_stop(name, at = 100)
      ["#{name}@#{time_at(at + 2)}", "#{name}@#{time_at(at + 3)}"]
    end

    def scan_named(rows, refused)
      lines = rows.each_with_index.map { |r, i| ['r.jsonl', i + 1, r] }
      scanner = AccessLeakScanner.new(scenario)
      [scanner.scan(lines, refused: refused), scanner]
    end

    def repeat_rows
      [grant_pw({}, 50), keyring([reset_entry('hana', HANA_PW)], 51)] + refuse_stop(100) + [grant_pw({}, 150), keyring([reset_entry('hana', HANA_PW)], 151)]
    end

    test 'a repeat password grant inside a stop named for another account is honest' do
      found, scanner = scan_named(repeat_rows, named_stop('cal'))
      assert_empty helpdesk_only(found), found.map(&:to_s).join("\n")
      assert_empty scanner.unused_entries
    end

    test 'a repeat password grant inside a stop named for a name that is no account is honest' do
      found, = scan_named(repeat_rows, named_stop('other'))
      assert_empty helpdesk_only(found)
    end

    test 'tamper: a repeat password grant inside a stop on the SAME name stays flagged' do
      found, = scan_named(repeat_rows, named_stop('hana'))
      assert_includes rules(found), 'helpdesk_grant'
    end

    test 'tamper: a repeat password grant inside an unnamed stop stays flagged' do
      found, = scan_named(repeat_rows, [])
      assert_includes rules(found), 'helpdesk_grant'
    end

    test 'tamper: a repeat grant stays flagged when one running stop is named for another account and one is unnamed' do
      found, = scan_named(repeat_rows, ["cal@#{time_at(102)}"])
      assert_includes rules(found), 'helpdesk_grant'
    end

    test 'tamper: a lockout on the same name after another name\'s stop still holds the repeat grant' do
      rows = [grant_pw({}, 50)] + refuse_stop(100) + refuse_stop(110) + [grant_pw({}, 150)]
      found, = scan_named(rows, named_stop('cal') + named_stop('hana', 110))
      assert_includes rules(found), 'helpdesk_grant'
    end

    test 'a repeat grant after a same-name stop has run out is honest' do
      rows = [grant_pw({}, 50)] + refuse_stop(100) + [grant_pw({}, 100 + 3 + BreakEscape::HelpdeskModel::DESK_STOP_SECONDS + 1)]
      found, = scan_named(rows, named_stop('hana'))
      assert_empty helpdesk_only(found)
    end

    test 'tamper: a first password grant inside a stop named for another account stays flagged' do
      found, = scan_named(refuse_stop(100) + [grant_pw({}, 150)], named_stop('cal'))
      assert_includes rules(found), 'helpdesk_grant'
      assert_includes rules(found), 'helpdesk_secret'
    end

    test 'tamper: a repeat whose first grant was itself inside the stop stays flagged' do
      found, = scan_named(refuse_stop(100) + [grant_pw({}, 150), grant_pw({}, 160)], named_stop('cal'))
      assert_equal 2, found.count { |f| f.rule == 'helpdesk_grant' }
    end

    test 'tamper: a repeat grant naming the account with another account\'s value stays flagged' do
      found, = scan_named([grant_pw({}, 50)] + refuse_stop(100) + [grant_pw({ 'body.password' => CAL_PW }, 150)], named_stop('cal'))
      assert_includes rules(found), 'helpdesk_grant'
      assert_includes owners(found), 'helpdesk:reset:cal'
    end

    test 'tamper: a second-step grant inside a stop named for another account stays flagged' do
      found, = scan_named([grant_pw({}, 50)] + refuse_stop(100) + [grant_mfa(150)], named_stop('cal'))
      assert_includes rules(found), 'helpdesk_grant'
    end

    test 'a refused entry that matches no stopping row is left unused' do
      _, scanner = scan_named(repeat_rows, ["cal@#{time_at(100)}"])
      assert_equal ["cal@#{time_at(100)} (--refused)"], scanner.unused_entries
    end

    test 'a refused entry naming no account of the scenario is refused' do
      assert_raises(ArgumentError) { scan_named(repeat_rows, ["nobody@#{time_at(102)}"]) }
    end
  end
end
