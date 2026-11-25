require 'test_helper'
require_relative 'ops_lock_step_scenario_test'
require_relative '../../support/lock_step_routes'
require_relative '../../support/lock_step_real_rows'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops S8c round 3 fixes for the scanner (S8c_R3_scanner.md), proved on copies of the rows of the real run of
  # scenarios/test_ops_lock_step: R3-SCANNER1 (what proves a room opened), R3-SCANNER2 (id-less room data outside a door open),
  # R3-SCANNER3 (awareness of a headless owner), R3-SCANNER4 (a flag reward by its own station, or by name).
  class AccessLeakScannerLockStepR3fixRealTest < ActionDispatch::IntegrationTest
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
      scan_with(rows, data).map { |f| [f.rule, f.owner] }.uniq
    end

    def gate_idx(id)
      idx(@real, 'POST', 'unlock') { |r| r['body'].is_a?(Hash) && r['body']['targetId'] == id && r['body']['secondStep'] == true }
    end

    def moved(id, room, extra: nil)
      data = lock_step_scenario
      obj = data['rooms']['office']['objects'].find { |o| o['id'] == id }
      data['rooms']['office']['objects'].delete(obj)
      data['rooms'][room] = extra if extra
      data['rooms'][room]['objects'] << obj
      data
    end

    def pin_room(objs = [])
      { 'type' => 'room_office', 'locked' => true, 'lockType' => 'pin', 'requires' => '9999', 'connections' => { 'south' => 'office' }, 'objects' => objs }
    end

    def as_route(base, route, body, status = 200, method = nil)
      r = deep(base).merge('body' => body, 'status' => status)
      r['path'] = r['path'].sub(%r{/games/(\d+)/.*\z}) { "/games/#{Regexp.last_match(1)}/#{route}" }
      r['method'] = method if method
      r.delete('query')
      r
    end

    def door_open(body)
      as_route(@real[79], 'unlock', body)
    end

    def two_rooms
      data = moved('priya_safe', 'closet', extra: pin_room([{ 'type' => 'notes1', 'name' => 'n' }]))
      data['rooms']['annex'] = pin_room([{ 'id' => 'annex_memo', 'type' => 'notes1', 'name' => 'm' }])
      data
    end

    def gate
      deep(@real[gate_idx('priya_safe')])
    end

    GATE = [['lock_step_answer', 'lockstep:gate:room:object:priya_safe']].freeze

    def open_listing(*objects)
      door_open({ 'success' => true, 'type' => 'door', 'roomData' => { 'type' => 'room_office', 'locked' => true, 'objects' => objects.map { |id| { 'id' => id, 'type' => 'notes1' } } } })
    end

    # ---- R3-SCANNER1 ------------------------------------------------------------------------------------------------------

    test 'R3-SCANNER1 P0 the gate alone, with the closet shut, is reported' do
      assert_equal GATE, scan([gate], two_rooms)
    end

    test 'R3-SCANNER1 P1 an open of one room that lists an object of another does not open the other, and is reported' do
      rows = scan([open_listing('annex_memo', 'priya_safe'), gate], two_rooms)
      assert_includes rows, ['lock_step_content', 'lockstep:room:mixed']
      assert_includes rows, GATE.first
    end

    test 'R3-SCANNER1 P1b the same with the generated id of the other room object' do
      rows = scan([open_listing('annex_memo', 'closet_notes1_0'), gate], two_rooms)
      assert_includes rows, ['lock_step_content', 'lockstep:room:mixed']
      assert_includes rows, GATE.first
    end

    test 'R3-SCANNER1 P1c an open that lists only ids of the closet is the same bytes as its honest open (limit 1)' do
      assert_equal [], scan([open_listing('closet_notes1_0'), gate], two_rooms)
    end

    test 'R3-SCANNER1 P2 a bare GET room 200 is no proof, alone or before the gate' do
      room = as_route(@real[2], 'room/closet', { 'room_id' => 'closet', 'room' => { 'type' => 'room_office', 'objects' => [] } }, 200, 'GET')
      assert_equal [], scan([room], two_rooms)
      assert_equal GATE, scan([room, gate], two_rooms)
    end

    test 'R3-SCANNER1 the awareness world room is served from the start, and the real run is clean' do
      data = two_rooms
      data['social'] = { 'awarenessEpisode' => { 'world' => { 'room' => 'closet' } } }
      room = as_route(@real[2], 'room/closet', { 'room_id' => 'closet', 'room' => { 'type' => 'room_office', 'objects' => [] } }, 200, 'GET')
      assert_equal [], scan([room, gate], data)
      assert_equal [], scan(@real)
    end

    # ---- R3-SCANNER2 ------------------------------------------------------------------------------------------------------

    test 'R3-SCANNER2 P3 id-less room data of a gated room outside a door open is reported' do
      sc = deep(@real[22])
      sc['body']['rooms']['records_room']['roomData'] = { 'type' => 'room_ceo', 'door_sign' => 'Records', 'lockType' => 'rfid', 'requires' => ['records_card'], 'objects' => [], 'npcs' => [] }
      assert_equal [['lock_step_content', 'lockstep:content:door:records_room'], ['lock_step_content', 'lockstep:content:door:plant_room']], scan([sc]) # every shut gated door
    end

    test 'R3-SCANNER2 P3b a root roomData with no ids in GET scenario is reported' do
      sc = deep(@real[22])
      sc['body']['roomData'] = { 'type' => 'room_ceo', 'door_sign' => 'Records', 'objects' => [] }
      assert_equal [['lock_step_content', 'lockstep:content:door:records_room'], ['lock_step_content', 'lockstep:content:door:plant_room']], scan([sc]) # every shut gated door
    end

    test 'R3-SCANNER2 the open of an empty locked room (owner decision) reports nothing' do
      rows = deep(@real)
      d = idx(rows, 'POST', 'unlock') { |r| r['body']['type'] == 'door' && r['body']['targetId'] == 'records_room' && r['body']['roomData'] }
      rows[d]['body']['roomData'] = { 'type' => 'room_ceo', 'door_sign' => 'Records', 'objects' => [], 'npcs' => [] }
      rows[d]['body'].delete('targetType')
      rows[d]['body'].delete('targetId')
      assert_equal [], scan(rows[0..d])
    end

    # ---- R3-SCANNER3 ------------------------------------------------------------------------------------------------------

    test 'R3-SCANNER3 W1 awareness on a headless owner record is reported, W2 approvesPrompts as before' do
      data = lock_step_scenario
      data['social']['characters'] = { 'ghost' => { 'emailRecord' => { 'id' => 'ghost', 'displayName' => 'Ghost' } } }
      obj = data['rooms']['office']['objects'].find { |o| o['id'] == 'moira_locker' }
      obj['secondStep'] = { 'kind' => 'push', 'owner' => 'ghost' }
      sc = deep(@real[22])
      sc['body']['social'] = { 'characters' => { 'ghost' => { 'emailRecord' => { 'id' => 'ghost', 'displayName' => 'Ghost', 'awareness' => 'low' } } } }
      assert_equal [['mfa_secret', 'mfa:key:awareness']], scan([sc], data)
      sc['body']['social'] = { 'mailClient' => { 'contacts' => [{ 'id' => 'ghost', 'promptPatience' => 2 }] } }
      assert_equal [['mfa_secret', 'mfa:key:promptPatience']], scan([sc], data)
      sc['body']['social'] = { 'characters' => { 'ghost' => { 'emailRecord' => { 'id' => 'ghost', 'displayName' => 'Ghost', 'habits' => { 'approvesPrompts' => 'always' } } } } }
      assert_equal [['mfa_secret', 'mfa:key:approvesPrompts']], scan([sc], data)
    end

    # ---- R3-SCANNER4 ------------------------------------------------------------------------------------------------------

    def reward_data(station_b_rewards: [{ 'type' => 'set_global', 'key' => 'x', 'value' => true }], object_ref: 'priya_safe')
      data = lock_step_scenario
      data['rooms']['office']['objects'] << { 'id' => 'st_a', 'type' => 'flag-station', 'flags' => ['flag{a}'], 'flagRewards' => [{ 'type' => 'unlock_object', 'objectId' => object_ref }] }
      data['rooms']['office']['objects'] << { 'id' => 'st_b', 'type' => 'flag-station', 'flags' => ['flag{b}'], 'flagRewards' => station_b_rewards }
      data
    end

    def flags(station, oid)
      reward = { 'type' => 'unlock_object', 'objectId' => oid, 'room_id' => 'office' }
      reward['flag_station_id'] = station if station
      as_route(@real[46], 'flags', { 'success' => true, 'rewards' => [reward] })
    end

    OPEN = [['lock_step_content', 'lockstep:open:object:priya_safe']].freeze

    test 'R3-SCANNER4 R1 a reward from its own station, then the open, is clean' do
      assert_equal [], scan([flags('st_a', 'priya_safe'), deep(@real[46])], reward_data)
    end

    test 'R3-SCANNER4 R2 a reward naming a station that authors none for the object earns nothing' do
      assert_equal OPEN, scan([flags('st_b', 'priya_safe'), deep(@real[46])], reward_data)
    end

    test 'R3-SCANNER4 R3 a reward with no station earns nothing' do
      assert_equal OPEN, scan([flags(nil, 'priya_safe'), deep(@real[46])], reward_data)
    end

    test 'R3-SCANNER4 R4 a reward authored and answered by the object name is honest' do
      name = lock_step_scenario['rooms']['office']['objects'].find { |o| o['id'] == 'priya_safe' }['name']
      assert_equal [], scan([flags('st_a', name), deep(@real[46])], reward_data(object_ref: name))
    end

    test 'R3-SCANNER4 R5 no reward, then the open, is reported' do
      assert_equal OPEN, scan([deep(@real[46])], reward_data)
    end
  end
end
