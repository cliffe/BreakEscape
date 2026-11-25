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

    # ---- device in use (S8c): the old device's code while a live code lock names the re-enrolled owner ----

    CODE_LOCK = 'hana_cabinet'.freeze

    def code_scenario
      scenario do |data|
        room = data['rooms'].values.find { |r| r['objects'].is_a?(Array) }
        room['objects'] << { 'id' => CODE_LOCK, 'name' => 'Cabinet', 'type' => 'safe', 'locked' => true,
                             'secondStep' => { 'kind' => 'code', 'owner' => 'hana' }, 'contents' => [{ 'id' => 'cabinet_note', 'type' => 'notes', 'name' => 'Note' }] }
      end
    end

    def code_gate(npc: 'hana', kind: 'code', at: nil, game: 1)
      body = { 'success' => false, 'secondStep' => true, 'kind' => kind, 'targetType' => 'object', 'targetId' => CODE_LOCK, 'npcId' => npc }
      row('POST', 'unlock', { 'status' => 200, 'body' => body }, at: at).merge('path' => "/break_escape/games/#{game}/unlock")
    end

    def lock_verify(extra, at: nil)
      row('POST', 'mfa/verify', { 'status' => 200, 'body' => { 'targetType' => 'object', 'targetId' => CODE_LOCK }.merge(extra) }, at: at)
    end

    def old_device(at: nil, game: 1)
      body = { 'deviceId' => 'hana_device', 'displayName' => npc_of(code_scenario, 'hana')['displayName'] || 'hana', 'npcId' => 'hana',
               'code' => '111222', 'secondsLeft' => 5, 'used' => false }
      row('GET', 'mfa/device', { 'status' => 200, 'body' => body }, query: 'item_id=hana_device', at: at).merge('path' => "/break_escape/games/#{game}/mfa/device")
    end

    def device_findings(rows)
      owners(scan(rows, code_scenario)).select { |o| o == 'helpdesk:old:code' }
    end

    def earned_prefix
      [grant_mfa(1), take('hana_device')]
    end

    test 'an old device code beside a fresh code gate of the re-enrolled owner is clean' do
      assert_empty device_findings(earned_prefix + [code_gate(at: 10), old_device(at: 20)])
      assert_empty scan(earned_prefix + [code_gate(at: 10), old_device(at: 20)], code_scenario).select { |f| f.rule.start_with?('helpdesk_') }
    end

    test 'an old device code is still reported with no live code gate of that owner in that game' do
      boundary = BreakEscape::MfaModel::PENDING_SECONDS
      assert_equal ['helpdesk:old:code'], device_findings(earned_prefix + [old_device(at: 20)])
      assert_equal ['helpdesk:old:code'], device_findings(earned_prefix + [code_gate(at: 10), old_device(at: 11 + boundary)])
      assert_empty device_findings(earned_prefix + [code_gate(at: 10), old_device(at: 10 + boundary)])
      assert_equal ['helpdesk:old:code'], device_findings(earned_prefix + [code_gate(at: 10, game: 2), old_device(at: 20)])
      assert_equal ['helpdesk:old:code'], device_findings(earned_prefix + [code_gate(at: 10), old_device(at: 20, game: 2)])
    end

    test 'an old device code is reported after the gate passed, after codeLocked, for a push gate and for another owner' do
      passed = lock_verify({ 'success' => true, 'stepPassed' => true }, at: 15)
      assert_equal ['helpdesk:old:code'], device_findings(earned_prefix + [code_gate(at: 10), passed, old_device(at: 20)])
      locked = lock_verify({ 'success' => false, 'codeLocked' => true, 'retryIn' => 60 }, at: 15)
      assert_includes device_findings(earned_prefix + [code_gate(at: 10), locked, old_device(at: 20)]), 'helpdesk:old:code'
      assert_equal ['helpdesk:old:code'], device_findings(earned_prefix + [code_gate(at: 10, kind: 'push'), old_device(at: 20)])
      assert_equal ['helpdesk:old:code'], device_findings(earned_prefix + [code_gate(at: 10, npc: 'jake'), old_device(at: 20)])
    end

    test 'an old device code with no row time is reported even beside a fresh gate' do
      timeless = old_device(at: 20).tap { |r| r.delete('t') }
      assert_equal ['helpdesk:old:code'], device_findings(earned_prefix + [code_gate(at: 10), timeless])
    end

    test 'real rows: the code lock flow after a re-enrolment is clean, and reports without its gate row' do
      rows = earned_prefix + [code_gate(at: 10), old_device(at: 20)]
      assert_empty device_findings(rows)
      real = rows.map { |r| r.merge('t' => r['t']) }
      assert_equal %w[helpdesk:old:code], device_findings(real.reject { |r| r['path'].end_with?('/unlock') })
    end
  end
end
