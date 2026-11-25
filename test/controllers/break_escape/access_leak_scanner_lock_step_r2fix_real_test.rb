require 'test_helper'
require_relative 'ops_lock_step_scenario_test'
require_relative '../../support/lock_step_routes'
require_relative '../../support/lock_step_real_rows'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops S8c round 2 fixes for the scanner (S8c_R2_scanner.md), the findings proved on copies of the rows of the real run of
  # scenarios/test_ops_lock_step: R2-SCANNER1 (a gate or answer for a lock in a room that has not opened), R2-SCANNER4 (values
  # inside a placed open), R2-SCANNER5 (the integers of a refusal).
  class AccessLeakScannerLockStepR2fixRealTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include OpsLockStepRun
    include LockStepRealRows

    def step_req(verb, suffix, params = {})
      body = super
      OpsLockStepAnswers.all.last['t'] = Time.current.utc.iso8601(3)
      OpsLockStepAnswers.all.last['game'] = @game.id
      body
    end

    setup do
      travel_to OpsLockStepRun::T0
      @entries = play_whole_run
      @real = rows_of(@entries)
      @data = lock_step_scenario
    end

    teardown do
      travel_back
      OpsLog::Current.reset
    end

    def scan(rows, data = @data)
      pairs(scan_with(rows, data))
    end

    def gate_idx(id)
      idx(@real, 'POST', 'unlock') { |r| r['body'].is_a?(Hash) && r['body']['targetId'] == id && r['body']['secondStep'] == true }
    end

    def like(base, body, status = base['status'], route = nil)
      r = deep(base).merge('body' => body, 'status' => status)
      r['path'] = r['path'].sub(%r{/games/(\d+)/.*\z}) { "/games/#{Regexp.last_match(1)}/#{route}" } if route
      r.delete('query') if route
      r
    end

    # the scenario with one object lock moved into another room
    def moved(id, room, extra: nil)
      data = lock_step_scenario
      obj = data['rooms']['office']['objects'].find { |o| o['id'] == id }
      data['rooms']['office']['objects'].delete(obj)
      data['rooms'][room] = extra if extra
      data['rooms'][room]['objects'] << obj
      data
    end

    def closet
      { 'type' => 'room_office', 'locked' => true, 'lockType' => 'pin', 'requires' => '9999', 'connections' => { 'south' => 'office' }, 'objects' => [] }
    end

    test 'the unedited real run is clean' do
      assert_equal [], scan(@real)
    end

    # ---- R2-SCANNER1 ------------------------------------------------------------------------------------------------------

    test 'R2-SCANNER1 A1 a gate for a safe inside a gated room that has not opened is reported' do
      rows = [deep(@real[gate_idx('priya_safe')])]
      assert_equal [['lock_step_answer', 'lockstep:gate:room:object:priya_safe']], scan(rows, moved('priya_safe', 'records_room')).uniq
    end

    test 'R2-SCANNER1 A2 an echoed refusal for it is reported' do
      prompt = @real[idx(@real, 'POST', 'mfa/prompt') { |r| r['body']['waiting'] }]
      rows = [like(prompt, { 'success' => false, 'expired' => true, 'targetType' => 'object', 'targetId' => 'priya_safe' }, 422)]
      assert_includes scan(rows, moved('priya_safe', 'records_room')), ['lock_step_answer', 'lockstep:refusal:mfa/prompt']
    end

    test 'R2-SCANNER1 A3 a gate and then a pass for a lock in a room not yet opened are reported' do
      g = gate_idx('moira_locker')
      pass = @real[@real.index { |r| r['body'].is_a?(Hash) && r['body']['stepPassed'] && r['body']['targetId'] == 'moira_locker' }]
      data = moved('moira_locker', 'records_room')
      assert_includes scan([deep(@real[g]), deep(pass)], data), ['lock_step_answer', 'lockstep:pass:no-gate']
      assert_equal [], scan([deep(@real[g]), deep(pass)]), 'in its own room the same two rows are honest'
    end

    test 'R2-SCANNER1 A4 a gate for a safe inside an ordinary locked room that has not opened is reported' do
      rows = [deep(@real[gate_idx('priya_safe')])]
      assert_equal [['lock_step_answer', 'lockstep:gate:room:object:priya_safe']], scan(rows, moved('priya_safe', 'closet', extra: closet)).uniq
    end

    test 'R2-SCANNER1 A5 the gate of the number lock, which carries the right number, inside a gated room that has not opened is reported' do
      rows = [deep(@real[gate_idx('dana_cabinet')])]
      assert_includes scan(rows, moved('dana_cabinet', 'records_room')), ['lock_step_answer', 'lockstep:gate:room:object:dana_cabinet']
    end

    test 'R2-SCANNER1 the same gate is honest in the start room, and after the room has opened' do
      rows = [deep(@real[gate_idx('priya_safe')])]
      assert_equal [], scan(rows)
      # records_room opens in the real run before its safe is gated: the capture up to and including the gate of a lock placed there
      opened = @real[0..gate_idx('priya_safe')]
      assert_equal [], scan(opened, moved('priya_safe', 'office', extra: nil))
    end

    # ---- R2-SCANNER4 ------------------------------------------------------------------------------------------------------

    def locker_open_idx
      idx(@real, 'POST', 'unlock') { |r| r['body']['success'] == true && r['body']['contents'].to_s.include?('locker_memo') }
    end

    test 'R2-SCANNER4 a placed open carrying a number or attemptsLeft inside an allowed key is reported' do
      number = @real[gate_idx('dana_cabinet')]['body']['number']
      [[{ 'rewards' => [{ 'type' => 'x', 'number' => number }] }, 'lockstep:key:number'],
       [{ 'rewards' => [{ 'type' => 'x', 'number' => 97 }] }, 'lockstep:key:number'],
       [{ 'completedTasks' => [{ 'attemptsLeft' => 2 }] }, 'lockstep:open:key:object:moira_locker']].each do |extra, owner|
        rows = deep(@real)
        rows[locker_open_idx]['body'].merge!(extra)
        want = owner.start_with?('lockstep:open') ? ['lock_step_answer', owner] : ['lock_step_secret', owner]
        assert_includes scan(rows), want, extra.inspect
      end
    end

    test 'R2-SCANNER4 the open of a door that carries the room data of another room with none of its own ids is reported' do
      rows = deep(@real)
      d = idx(rows, 'POST', 'unlock') { |r| r['body']['type'] == 'door' && r['body']['targetId'] == 'records_room' && r['body']['roomData'] }
      rows[d]['body']['roomData'] = { 'type' => 'room_x', 'door_sign' => 'Plant room', 'locked' => true, 'lockType' => 'npc', 'requires' => 'gordon', 'objects' => [], 'npcs' => [] }
      assert_includes scan(rows), ['lock_step_answer', 'lockstep:open:room:door:records_room']
    end

    # ---- R2-SCANNER5 ------------------------------------------------------------------------------------------------------

    test 'R2-SCANNER5 the integers of a refusal are bounded to what the server can send' do
      w = idx(@real, 'POST', 'mfa/prompt') { |r| r['body']['targetId'] == 'dana_cabinet' }
      rows = deep(@real)
      rows[w]['body']['promptsSent'] = 85_000
      assert_includes scan(rows), ['lock_step_answer', 'lockstep:refusal:mfa/prompt']
      rows = deep(@real)
      rows[w]['body']['promptsSent'] = MfaModel::MAX_PROMPTS + 1
      assert_includes scan(rows), ['lock_step_answer', 'lockstep:refusal:mfa/prompt']
      rows = deep(@real)
      rows[w]['body']['promptsSent'] = MfaModel::MAX_PROMPTS
      assert_equal [], scan(rows)

      code = @real[idx(@real, 'GET', 'mfa/device') { |r| r['status'] == 200 }]['body']['code']
      v = idx(@real, 'POST', 'mfa/verify') { |r| r['body']['mfaIncorrect'] }
      locked = lambda do |n|
        rows = deep(@real)[0..v]
        rows[v]['body'] = { 'success' => false, 'codeLocked' => true, 'retryIn' => n, 'targetType' => 'object', 'targetId' => 'priya_safe' }
        rows
      end
      assert_includes scan(locked.call(code.to_i)), ['lock_step_answer', 'lockstep:refusal:mfa/verify']
      assert_includes scan(locked.call(MfaModel::CODE_CLOSED_SECONDS + 1)), ['lock_step_answer', 'lockstep:refusal:mfa/verify']
      assert_includes scan(locked.call(0)), ['lock_step_answer', 'lockstep:refusal:mfa/verify']
      assert_equal [], scan(locked.call(MfaModel::CODE_CLOSED_SECONDS))

      prompt = @real[w]
      soon = lambda do |n|
        rows = deep(@real)[0..gate_idx('moira_pc')]
        rows << like(prompt, { 'success' => false, 'tooSoon' => true, 'retryAfterS' => n, 'targetType' => 'object', 'targetId' => 'moira_pc' }, 422)
        rows[-1]['t'] = rows[-2]['t']
        rows
      end
      assert_includes scan(soon.call(code.to_i)), ['lock_step_answer', 'lockstep:refusal:mfa/prompt']
      assert_includes scan(soon.call(MfaModel::PROMPT_GAP_SECONDS + 1)), ['lock_step_answer', 'lockstep:refusal:mfa/prompt']
      assert_equal [], scan(soon.call(MfaModel::PROMPT_GAP_SECONDS))
      assert_equal [], scan(soon.call(1))
    end
  end
end
