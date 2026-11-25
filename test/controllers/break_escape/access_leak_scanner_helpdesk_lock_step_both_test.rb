require 'test_helper'
require_relative 'access_leak_scanner_helpdesk_test'

module BreakEscape
  # Ops S8c merge follow-up: the helpdesk rules (S8b) and the lock-step rules (S8c) are both in the scanner, and each judges only
  # its own phone answers. The lock-step side is held by access_leak_scanner_lock_step_real_test.rb; this is the other direction:
  # with a lock step authored in the scenario (so the lock rules are active), a helpdesk own-phone answer is still judged by the
  # helpdesk rules (a leak is still reported, an earned one still passes), and a lock-form phone answer is never an own-phone one.
  # It inherits the helpdesk test, so every helpdesk case runs again over the scenario with the lock step in it.
  class AccessLeakScannerHelpdeskLockStepBothTest < AccessLeakScannerHelpdeskTest
    # the helpdesk scenario with one push lock step on a plain object (the phone holder is nia, whose own phone the desk gives)
    def scenario
      super do |data|
        target = data['rooms'].values.flat_map { |r| r['objects'] || [] }.find { |o| o['id'] && !o['contents'] && !%w[pc].include?(o['type']) }
        raise 'no plain object to lock' unless target

        target['secondStep'] = { 'kind' => 'push', 'owner' => 'nia' }
        yield data if block_given?
      end
    end

    test 'the lock rules are active in this scenario' do
      scanner = AccessLeakScanner.new(scenario)
      scanner.scan([['r.jsonl', 1, grant_mfa]])
      assert scanner.instance_variable_get(:@ls_active)
    end

    test 'an earned own phone list with its number choices is still allowed beside a lock step' do
      assert_empty scan([grant_mfa(npc: 'nia'), login_own_push, phone_own])
    end

    test 'a helpdesk own phone leak is still reported beside a lock step' do
      assert_includes owners(scan([phone_own])), 'helpdesk:own:phone'
      assert_includes owners(scan([grant_mfa(npc: 'nia'), login_own_push, phone_own(numbers: [31, 62, 70])])), 'helpdesk:own:phone'
      assert_includes owners(scan([grant_mfa(npc: 'nia'), login_own_push, phone_own(user: 'someone')])), 'helpdesk:own:phone'
      assert_includes owners(scan([grant_mfa(npc: 'nia'), login_own_push, phone_own(query: 'own=2')])), 'helpdesk:own:phone'
    end

    test 'a lock form phone entry in an own phone list is not excused by the helpdesk rules' do
      lock_entry = phone_own
      lock_entry['body']['requests'].first.merge!('targetType' => 'object', 'targetId' => 'x', 'name' => 'x')
      got = scan([grant_mfa(npc: 'nia'), login_own_push, lock_entry])
      assert(got.any? { |f| f.rule == 'lock_step_answer' && f.owner.start_with?('lockstep:phone') }, got.map { |f| [f.rule, f.owner] }.inspect)
      assert(got.any? { |f| f.owner == 'helpdesk:own:phone' }, got.map { |f| [f.rule, f.owner] }.inspect)
    end
  end
end
