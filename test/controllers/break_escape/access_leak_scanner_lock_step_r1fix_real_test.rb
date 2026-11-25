require 'test_helper'
require_relative 'ops_lock_step_scenario_test'
require_relative '../../support/lock_step_routes'
require_relative '../../support/lock_step_real_rows'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops S8c fixes for the second scanner review (docs/agents/ops_core_build/reviews/S8c_R1_scanner.md), the findings that are
  # proved on REAL answers. Each reviewer probe is a test here. The first class edits copies of the rows of the real run of
  # scenarios/test_ops_lock_step (every edit one a leaking server would make); the second plays honest runs on the real routes
  # and asserts the scanner reports nothing in them.
  class AccessLeakScannerLockStepR1fixRealTest < ActionDispatch::IntegrationTest
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
      scan_with(rows, data)
    end

    def gate_idx(id)
      idx(@real, 'POST', 'unlock') { |r| r['body'].is_a?(Hash) && r['body']['targetId'] == id && r['body']['secondStep'] == true }
    end

    def assert_reports(rows, rule, owner_prefix, data = @data)
      got = pairs(scan(rows, data))
      assert(got.any? { |r, o| r == rule && o.start_with?(owner_prefix) }, "expected #{rule} #{owner_prefix}, got #{got.inspect}")
    end

    test 'the unedited real run is still clean' do
      assert_equal [], pairs(scan(@real))
    end

    # ---- the owner keys on the open answer (decided: the server echoes targetType and targetId on the open of a gated lock) -------

    def open_rows(rows)
      rows.each_index.select do |i|
        b = rows[i]['body']
        path_of(rows[i]) == 'unlock' && rows[i]['method'] == 'POST' && b.is_a?(Hash) && b['success'] == true && (b['contents'] || b['roomData'])
      end
    end

    test 'every open of a gated lock in the real run carries its echo, and an open with the echo removed or changed is reported' do
      opens = open_rows(@real)
      assert_operator opens.size, :>=, 6
      opens.each do |i|
        assert @real[i]['body']['targetId'].is_a?(String), "row #{i} carries no echo"
        rows = deep(@real)
        rows[i]['body'].delete('targetType')
        rows[i]['body'].delete('targetId')
        assert_reports rows, 'lock_step_answer', 'lockstep:open:no-echo'
        rows = deep(@real)
        rows[i]['body']['targetId'] = rows[i]['body']['targetId'] == 'priya_safe' ? 'moira_locker' : 'priya_safe'
        got = pairs(scan(rows))
        assert(got.any? { |_r, o| o.start_with?('lockstep:open:') || o.start_with?('lockstep:content:') }, "row #{i}: #{got.inspect}")
        rows = deep(@real)
        rows[i]['body']['targetId'] = 'no_such_lock'
        assert_reports rows, 'lock_step_answer', 'lockstep:open:'
      end
    end

    # ---- R1-SCANNER3 -------------------------------------------------------------------------------------------------

    test 'R1-SCANNER3 a refusal of a POST route that carries deviceId or requests is still judged' do
      i = idx(@real, 'POST', 'mfa/verify') { |r| r['body']['mfaIncorrect'] }
      [{ 'success' => false, 'mfaIncorrect' => true, 'attemptsLeft' => 2, 'deviceId' => 'x' },
       { 'success' => false, 'mfaIncorrect' => true, 'attemptsLeft' => 2, 'requests' => 0 },
       { 'success' => false, 'mfaIncorrect' => true, 'attemptsLeft' => 2 },
       { 'success' => false, 'mfaIncorrect' => true, 'attemptsLeft' => 2, 'targetType' => 'object', 'targetId' => 'priya_safe' },
       { 'success' => false, 'mfaIncorrect' => true, 'deviceId' => 'priya_device', 'targetType' => 'object', 'targetId' => 'priya_safe' }].each do |b|
        rows = deep(@real)
        rows[i]['body'] = b
        assert_reports rows, 'lock_step_answer', 'lockstep:refusal:mfa/verify'
      end
    end

    test 'R1-SCANNER3 a GET answer of the phone or the device that carries the other route key is judged too' do
      i = idx(@real, 'GET', 'mfa/phone') { |r| r['status'] == 200 }
      rows = deep(@real)
      rows[i]['body'] = rows[i]['body'].merge('deviceId' => 'priya_device')
      assert_not_empty scan(rows)
      d = idx(@real, 'GET', 'mfa/device') { |r| r['status'] == 200 }
      rows = deep(@real)
      rows[d]['body'] = rows[d]['body'].merge('requests' => [])
      assert_not_empty scan(rows)
    end

    # ---- R1-SCANNER4 -------------------------------------------------------------------------------------------------

    test 'R1-SCANNER4 a lock below a closed gated container gets no gate, no refusal and no prompt' do
      g = gate_idx('moira_pc')
      a = gate_idx('audit_zip')
      assert_operator a, :>, g
      rows = deep(@real)
      rows.insert(g + 1, like(@real[a], deep(@real[a]['body'])).merge('t' => @real[g]['t']))
      assert_reports rows, 'lock_step_answer', 'lockstep:gate:below'
      assert_reports rows[0..g + 1], 'lock_step_answer', 'lockstep:gate:below'

      prompt = idx(@real, 'POST', 'mfa/prompt') { |r| r['body']['targetId'] == 'moira_pc' }
      base = @real[prompt]
      rows = deep(@real)[0..g]
      rows << like(base, { 'success' => false, 'expired' => true, 'targetType' => 'object', 'targetId' => 'audit_zip' }, 422)
      assert_reports rows, 'lock_step_answer', 'lockstep:refusal:mfa/prompt'
      rows = deep(@real)[0..g]
      rows << like(base, { 'success' => false, 'approved' => false, 'promptsSent' => 1, 'waiting' => 'owner', 'targetType' => 'object', 'targetId' => 'audit_zip' }, 200)
      assert_reports rows, 'lock_step_answer', 'lockstep:refusal:mfa/prompt'
    end

    test 'R1-SCANNER4 the same answers are honest once the container has opened (the real run)' do
      assert_equal [], pairs(scan(@real))
      assert_operator gate_idx('audit_zip'), :>, idx(@real, 'POST', 'unlock') { |r| r['body']['type'] == 'object' && r['body']['contents'].to_s.include?('audit_zip') }
    end

    # ---- R1-SCANNER5 -------------------------------------------------------------------------------------------------

    def with_room_npc
      data = lock_step_scenario
      npc = { 'id' => 'archivist', 'displayName' => 'Archivist', 'itemsHeld' => [{ 'id' => 'vault_key', 'type' => 'key', 'name' => 'Vault key' }] }
      data['rooms']['records_room']['npcs'] = [deep(npc)]
      [data, npc]
    end

    test 'R1-SCANNER5 the gated room NPC and what it holds are watched, and room data that lists no known id belongs to every shut gated door' do
      data, npc = with_room_npc
      assert_equal [], pairs(scan(@real, data)), 'control: the real capture, a scenario with an NPC in the gated room'
      i = idx(@real, 'POST', 'inventory')
      rows = deep(@real)
      rows[i]['body'] = { 'success' => true, 'npcs' => [deep(npc)] }
      assert_reports rows, 'lock_step_content', 'lockstep:content:door:records_room', data # P12a
      rows = deep(@real)
      rows[i]['body'] = { 'success' => true, 'roomData' => { 'type' => 'room_ceo', 'door_sign' => 'Records room', 'requires' => ['RECORDS-01'], 'npcs' => [deep(npc)], 'objects' => [] } }
      assert_reports rows, 'lock_step_content', 'lockstep:content:door:records_room', data # P12b
      g = gate_idx('records_room')
      rows = deep(@real)
      rows.insert(g + 1, deep(rows[i]).merge('t' => rows[g]['t'], 'body' => { 'success' => true, 'roomData' => { 'type' => 'room_ceo', 'requires' => ['RECORDS-01'], 'npcs' => [deep(npc)], 'objects' => [] } }))
      assert_reports rows, 'lock_step_content', 'lockstep:content:door:records_room', data # P12c
      rows = deep(@real)
      rows[i]['body'] = { 'success' => true, 'roomData' => { 'type' => 'room_ceo', 'door_sign' => 'Records room', 'locked' => true, 'lockType' => 'rfid', 'requires' => 'RECORDS-01', 'npcs' => [{ 'id' => 'archivist' }], 'objects' => [] } }
      assert_reports rows, 'lock_step_content', 'lockstep:content:door:records_room' # P3: no NPC known to the scenario, no object
      rows = deep(@real)
      rows[i]['body'] = { 'success' => true, 'rooms' => { 'records_room' => { 'type' => 'room_ceo', 'npcs' => [deep(npc)] } } }
      assert_reports rows, 'lock_step_content', 'lockstep:content:door:records_room', data # P3b
    end

    test 'R1-SCANNER5 an NPC without an id, or an item it holds without one, in a gated room is an error of the scenario' do
      data, = with_room_npc
      data['rooms']['records_room']['npcs'][0]['itemsHeld'] << { 'type' => 'key', 'name' => 'no id' }
      assert_raises(ArgumentError) { scan(@real, data) }
    end

    test 'R1-SCANNER5 an NPC named in a contact list or a feed is not reported' do
      data, = with_room_npc
      i = idx(@real, 'POST', 'inventory')
      rows = deep(@real)
      rows[i]['body'] = { 'success' => true, 'contacts' => [{ 'id' => 'archivist', 'name' => 'Archivist' }] }
      assert_equal [], pairs(scan(rows, data))
    end

    # ---- R1-SCANNER9 -------------------------------------------------------------------------------------------------

    test 'R1-SCANNER9 an open answer holds only the keys the server sends' do
      i = idx(@real, 'POST', 'unlock') { |r| r['body']['success'] == true && r['body']['contents'].to_s.include?('locker_memo') }
      g = gate_idx('dana_cabinet')
      number = @real[g]['body']['number']
      [{ 'number' => number }, { 'attemptsLeft' => 2 }, { 'pending' => { 'dana_cabinet' => { 'right' => number } } }, { 'numbers' => [11, 12, 13] }].each do |extra|
        rows = deep(@real)
        rows[i]['body'].merge!(extra)
        assert_reports rows, 'lock_step_answer', 'lockstep:open:key:object:moira_locker'
      end
      d = idx(@real, 'POST', 'unlock') { |r| r['body']['type'] == 'door' && r['body']['roomData'] }
      rows = deep(@real)
      rows[d]['body']['opener'] = 'gordon'
      assert_reports rows, 'lock_step_answer', 'lockstep:open:key:door:'
    end

    # ---- R1-SCANNER10 ------------------------------------------------------------------------------------------------

    test 'R1-SCANNER10 an echoed refusal needs a fresh gate of a kind its route serves' do
      g = gate_idx('moira_pc')
      prompt = idx(@real, 'POST', 'mfa/prompt') { |r| r['body']['targetId'] == 'moira_pc' }
      base = @real[prompt]
      [['verify', 422, { 'success' => false, 'mfaIncorrect' => true }], ['verify', 422, { 'success' => false, 'stale' => 'used' }],
       ['verify', 422, { 'success' => false, 'codeLocked' => true, 'retryIn' => 900 }]].each do |route, status, body|
        rows = deep(@real)
        rows.insert(g + 1, like(base, body.merge('targetType' => 'object', 'targetId' => 'moira_pc'), status).merge('t' => rows[g]['t'], 'path' => base['path'].sub('mfa/prompt', "mfa/#{route}")))
        assert_reports rows, 'lock_step_answer', 'lockstep:refusal:mfa/verify'
      end
      rows = deep(@real)
      rows.insert(1, like(base, { 'success' => false, 'approved' => false, 'promptsSent' => 4, 'waiting' => 'held_phone', 'targetType' => 'object', 'targetId' => 'dana_cabinet' }, 200).merge('t' => rows[0]['t']))
      assert_reports rows, 'lock_step_answer', 'lockstep:refusal:mfa/prompt'
      rows = deep(@real)
      rows.insert(1, like(base, { 'success' => false, 'cancelled' => true, 'targetType' => 'object', 'targetId' => 'dana_cabinet' }, 422).merge('t' => rows[0]['t'], 'path' => base['path'].sub('mfa/prompt', 'mfa/approve')))
      assert_reports rows, 'lock_step_answer', 'lockstep:refusal:mfa/approve'
      # control: an expired answer needs no gate (the server gives it for a lock that has no live record)
      rows = deep(@real)
      rows.insert(1, like(base, { 'success' => false, 'expired' => true, 'targetType' => 'object', 'targetId' => 'dana_cabinet' }, 422).merge('t' => rows[0]['t']))
      assert_equal [], pairs(scan(rows))
    end
  end
end
