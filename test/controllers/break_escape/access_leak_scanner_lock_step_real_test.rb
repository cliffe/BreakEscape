require 'test_helper'
require_relative 'ops_lock_step_scenario_test'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops S8c unit 28: the leak scanner over the REAL answers of a whole run of scenarios/test_ops_lock_step (unit 26's
  # OpsLockStepRun#play_whole_run), turned into the browser capture's rows. The honest run must report nothing; then one edit a
  # leaking server would make is made in a copy of the real capture, and each must be reported.
  class AccessLeakScannerLockStepRealTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include OpsLockStepRun

    # Each answer gets the time it was given (the helper keeps none): the clock is the test's frozen one.
    def step_req(verb, suffix, params = {})
      body = super
      OpsLockStepAnswers.all.last['t'] = Time.current.utc.iso8601(3)
      OpsLockStepAnswers.all.last['game'] = @game.id
      body
    end

    setup do
      travel_to OpsLockStepRun::T0
      @entries = play_whole_run
    end

    teardown do
      travel_back
      OpsLog::Current.reset
    end

    def rows_of(entries)
      entries.map do |e|
        path = "/break_escape/games/#{e['game']}/#{e['path']}"
        row = { 't' => e['t'], 'method' => e['verb'], 'path' => path, 'status' => e['status'], 'body' => e['body'] }
        row['query'] = e['params'].to_query if e['verb'] == 'GET' && !e['params'].empty?
        if e['verb'] == 'POST' && e['path'] == 'inventory'
          row['inv'] = { 'action' => e['params']['action_type'], 'itemId' => e['params'].dig('item', 'id') || e['params']['item_id'], 'usedOn' => nil }
        end
        row
      end
    end

    def scan(rows)
      AccessLeakScanner.new(lock_step_scenario).scan(rows.each_with_index.map { |r, i| ['run.jsonl', i + 1, r] })
    end

    test 'the whole played run reports nothing, and holds every shape of answer the rules judge' do
      assert_equal 0, @entries.count { |e| e['status'] == 500 }, 'a 500 answer in the run is a server finding'
      rows = rows_of(@entries)
      assert_operator rows.length, :>, 100
      assert_equal [], scan(rows).map { |f| [f.line, f.rule, f.owner, f.route] }
      bodies = @entries.map { |e| e['body'] }
      assert(bodies.any? { |b| b.is_a?(Hash) && b['secondStep'] == true && b['kind'] == 'push_number_match' && b['number'].is_a?(Integer) })
      assert(bodies.any? { |b| b.is_a?(Hash) && b['opener'] == 'gordon' })
      assert(bodies.any? { |b| b.is_a?(Hash) && b['waiting'] == 'held_phone' })
      assert(bodies.any? { |b| b.is_a?(Hash) && b['approvedBy'] == 'player' })
      assert(bodies.any? { |b| b.is_a?(Hash) && b['cancelled'] == true && b['targetId'] })
      assert(bodies.any? { |b| b.is_a?(Hash) && b['roomData'] && b['type'] == 'door' })
    end

    # ---- one edit a leaking server would make, in a copy of the real capture ------------------------------------------

    def deep(value)
      Marshal.load(Marshal.dump(value))
    end

    def real
      @real ||= rows_of(@entries)
    end

    def path_of(row)
      row['path'][%r{/games/\d+/(.*)\z}, 1]
    end

    # The first row of the real capture (a copy) for which the block holds; the copy is what a test edits.
    def pick(rows, method, route, &cond)
      rows.find { |r| r['method'] == method && path_of(r) == route && (cond.nil? || cond.call(r)) } or raise "no row #{method} #{route}"
    end

    def gate_of(rows, id)
      pick(rows, 'POST', 'unlock') { |r| r['body'].is_a?(Hash) && r['body']['secondStep'] == true && r['body']['targetId'] == id }
    end

    def prompt_pass_of(rows, id, route = 'mfa/prompt')
      pick(rows, 'POST', route) { |r| r['body']['stepPassed'] == true && r['body']['targetId'] == id }
    end

    def found(rows)
      scan(rows).map { |f| [f.rule, f.owner.to_s.split(':').first(2).join(':')] }.uniq
    end

    def assert_flags(rule, rows, owner_prefix = nil)
      got = scan(rows)
      assert(got.any? { |f| f.rule == rule && (owner_prefix.nil? || f.owner.start_with?(owner_prefix)) },
             "expected #{rule} #{owner_prefix}, got #{got.map { |f| [f.rule, f.owner] }.uniq.inspect}")
    end

    def copy
      deep(real)
    end

    # a row of the same game, made by hand from another row, put in at a place
    def row_like(base, body, status = base['status'])
      deep(base).merge('body' => body, 'status' => status)
    end

    test 'tamper 1: a gated object\'s contents before its pass' do
      rows = copy
      row = pick(rows, 'GET', 'container/moira_pc')
      row['status'] = 200
      row['body'] = { 'contents' => [{ 'id' => 'records_note', 'name' => 'Records note' }] }
      assert_flags 'lock_step_content', rows
    end

    test 'tamper 2: the contents of a gated object under a key the server never uses, before its pass' do
      rows = copy
      row = pick(rows, 'GET', 'container/priya_safe')
      row['status'] = 200
      row['body'] = { 'items' => [{ 'id' => 'safe_memo', 'text' => 'x' }] }
      assert_flags 'lock_step_content', rows
    end

    test 'tamper 3: the room data of a gated room before the pass' do
      rows = copy
      row = pick(rows, 'GET', 'room/records_room') { true } rescue nil
      row ||= pick(rows, 'GET', 'container/moira_pc')
      row['status'] = 200
      row['body'] = { 'room' => { 'objects' => [{ 'id' => 'records_memo' }] }, 'room_id' => 'records_room' }
      assert_flags 'lock_step_content', rows
    end

    test 'tamper 4: an open with no pass before it' do
      rows = copy
      rows.delete(prompt_pass_of(rows, 'moira_locker'))
      assert_flags 'lock_step_content', rows, 'lockstep:open'
    end

    test 'tamper 5: a pass with no gate' do
      rows = copy
      rows.delete(gate_of(rows, 'moira_pc'))
      assert_flags 'lock_step_answer', rows, 'lockstep:pass'
    end

    test 'tamper 6: a pass whose echo names another lock' do
      rows = copy
      prompt_pass_of(rows, 'moira_pc')['body']['targetId'] = 'moira_locker'
      assert_flags 'lock_step_answer', rows, 'lockstep:pass'
    end

    test 'tamper 7: a pass with its echo removed' do
      rows = copy
      body = prompt_pass_of(rows, 'moira_pc')['body']
      body.delete('targetId')
      body.delete('targetType')
      assert_flags 'lock_step_answer', rows, 'lockstep:pass:no-echo'
    end

    test 'tamper 8: a door gate whose opener may not open that door' do
      rows = copy
      gate_of(rows, 'plant_room')['body']['opener'] = 'priya'
      assert_flags 'lock_step_answer', rows, 'lockstep:gate'
    end

    test 'tamper 9: a code pass with the owner\'s device never taken' do
      rows = copy
      rows.reject! { |r| r['inv'] && r['inv']['itemId'] == 'priya_device' }
      assert_flags 'lock_step_answer', rows, 'lockstep:pass'
    end

    test 'tamper 10: a phone list entry for a lock with no prompt' do
      rows = copy
      phone = pick(rows, 'GET', 'mfa/phone') { |r| r['body']['requests']&.any? }
      rows.insert(0, deep(phone))
      assert_flags 'lock_step_answer', rows, 'lockstep:phone'
    end

    test 'tamper 11: the phone list with a number choice list for a lock the phone holder was never given' do
      rows = copy
      phone = pick(rows, 'GET', 'mfa/phone') { |r| r['body']['requests']&.any? && r['body']['requests'].first.key?('numbers') }
      phone['body']['requests'].first['numbers'] = [11, 12, 13]
      assert_flags 'lock_step_answer', rows, 'lockstep:phone'
    end

    test 'tamper 12: a pass after a cancel, with no new gate' do
      rows = copy
      cancel = pick(rows, 'POST', 'mfa/approve') { |r| r['body']['cancelled'] == true }
      after = rows[(rows.index { |r| r.equal?(cancel) } + 1)..]
      rows.delete(after.find { |r| r['body'].is_a?(Hash) && r['body']['secondStep'] == true && r['body']['targetId'] == 'audit_zip' })
      assert_flags 'lock_step_answer', rows, 'lockstep:pass'
    end

    test 'tamper 13: a pass after an expiry answer, with no new gate' do
      rows = copy
      pass = prompt_pass_of(rows, 'moira_pc')
      expired = row_like(pass, { 'success' => false, 'expired' => true, 'targetType' => 'object', 'targetId' => 'moira_pc' }, 422)
      rows.insert(rows.index { |r| r.equal?(pass) }, expired)
      assert_flags 'lock_step_answer', rows, 'lockstep:pass'
    end

    test 'tamper 14: a pass after the code is locked, with no new gate' do
      rows = copy
      pass = prompt_pass_of(rows, 'priya_safe', 'mfa/verify')
      locked = row_like(pass, { 'success' => false, 'codeLocked' => true, 'retryIn' => 60, 'targetType' => 'object', 'targetId' => 'priya_safe' }, 422)
      rows.insert(rows.index { |r| r.equal?(pass) }, locked)
      assert_flags 'lock_step_answer', rows, 'lockstep:pass'
    end

    test 'tamper 15: a pass on a record older than the pending time' do
      rows = copy
      pass = prompt_pass_of(rows, 'moira_pc')
      pass['t'] = (Time.iso8601(pass['t']) + BreakEscape::MfaModel::PENDING_SECONDS + 1).utc.iso8601(3)
      assert_flags 'lock_step_answer', rows, 'lockstep:pass'
    end

    test 'tamper 16: a gate after the lock has passed' do
      rows = copy
      pass = prompt_pass_of(rows, 'moira_pc')
      rows.insert(rows.index { |r| r.equal?(pass) } + 1, deep(gate_of(rows, 'moira_pc')))
      assert_flags 'lock_step_answer', rows, 'lockstep:gate'
    end

    test 'tamper 17: a pass the owner could not give (a push approved as the player)' do
      rows = copy
      prompt_pass_of(rows, 'moira_pc')['body']['approvedBy'] = 'player'
      assert_flags 'lock_step_answer', rows, 'lockstep:pass'
    end

    test 'tamper 18: the right number in a sign-in-like answer, the code and a state key' do
      rows = copy
      pick(rows, 'POST', 'mfa/prompt') { |r| r['status'] == 200 }['body']['number'] = 64
      assert_flags 'lock_step_secret', rows, 'lockstep:key:number'
      rows = copy
      gate_of(rows, 'audit_zip')['body']['numbers'] = [10, 20, 30]
      assert_flags 'lock_step_secret', rows, 'lockstep:key:numbers'
      rows = copy
      pick(rows, 'GET', 'scenario')['body']['lockSteps'] = {}
      assert_flags 'lock_step_secret', rows, 'lockstep:key:lockSteps'
    end

    test 'tamper 19: a gated item in a bootstrap answer, found by its id' do
      rows = copy
      pick(rows, 'GET', 'scenario')['body']['extra'] = { 'stuff' => [{ 'id' => 'board_minutes' }] }
      assert_flags 'lock_step_content', rows
    end

    test 'an open long after its pass is honest, a passed record never expires' do
      rows = copy
      pass = prompt_pass_of(rows, 'moira_pc')
      index = rows.index { |r| r.equal?(pass) }
      rows[(index + 1)..].each { |r| r['t'] = (Time.iso8601(r['t']) + 7200).utc.iso8601(3) }
      assert_equal [], scan(rows).map { |f| [f.rule, f.owner] }
    end
  end
end
