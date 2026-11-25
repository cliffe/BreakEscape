require 'test_helper'
require_relative 'ops_lock_step_scenario_test'
require_relative '../../support/lock_step_routes'
require_relative '../../support/lock_step_real_rows'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops S8c round 4 fixes for the scanner (S8c_R4_delta.md: R4-1 empty-open allowance, R4-2 carried ids, R4-3 rooms opened by reward or prop, R4-4 station ids, R4-5 contact emailRecord), proved on copies of the rows of the real run of
  class AccessLeakScannerLockStepR4fixRealTest < ActionDispatch::IntegrationTest
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

    OPEN = [['lock_step_content', 'lockstep:open:object:priya_safe']].freeze

    ALL_DOORS = [['lock_step_content', 'lockstep:content:door:records_room'], ['lock_step_content', 'lockstep:content:door:plant_room']].freeze

    def echoless_open(room_data)
      rows = deep(@real)
      d = idx(rows, 'POST', 'unlock') { |r| r['body']['type'] == 'door' && r['body']['targetId'] == 'records_room' && r['body']['roomData'] }
      base = rows[0...d]
      r = deep(rows[d])
      r['body']['roomData'] = room_data
      r['body'].delete('targetType')
      r['body'].delete('targetId')
      scan(base + [r])
    end

    test 'R4-1 E0 the decision case (objects [] and npcs []) reports nothing, also with the keys absent' do
      assert_equal [], echoless_open('type' => 'room_ceo', 'objects' => [], 'npcs' => [])
      assert_equal [], echoless_open('type' => 'room_ceo')
    end

    test 'R4-1 E1 objects with no ids are judged as any other answer' do
      assert_equal ALL_DOORS, echoless_open('type' => 'room_ceo', 'objects' => [{ 'type' => 'notes', 'name' => 'Records memo', 'text' => 'x' }], 'npcs' => [])
    end

    test 'R4-1 E2 an id-less NPC holding an id-less item is judged' do
      assert_equal ALL_DOORS, echoless_open('type' => 'room_ceo', 'objects' => [], 'npcs' => [{ 'displayName' => 'Clerk', 'itemsHeld' => [{ 'type' => 'keycard' }] }])
    end

    test 'R4-1 E3 a non-string id is judged' do
      assert_equal ALL_DOORS, echoless_open('type' => 'room_ceo', 'objects' => [{ 'id' => 7, 'type' => 'notes' }])
    end

    # R4-5
    test 'R4-5 A1 awareness on mailClient.contacts[0].emailRecord is reported, headless approvesPrompts there too' do
      data = lock_step_scenario
      data['social']['characters'] = { 'ghost' => { 'emailRecord' => { 'id' => 'ghost', 'displayName' => 'Ghost' } } }
      obj = data['rooms']['office']['objects'].find { |o| o['id'] == 'moira_locker' }
      obj['secondStep'] = { 'kind' => 'push', 'owner' => 'ghost' }
      sc = deep(@real[22])
      sc['body']['social'] = { 'mailClient' => { 'contacts' => [{ 'id' => 'ghost', 'emailRecord' => { 'id' => 'ghost', 'awareness' => 'low' } }] } }
      assert_equal [['mfa_secret', 'mfa:key:awareness']], scan([sc], data)
      sc['body']['social'] = { 'mailClient' => { 'contacts' => [{ 'id' => 'ghost', 'emailRecord' => { 'id' => 'ghost', 'promptPatience' => 2 } }] } }
      assert_equal [['mfa_secret', 'mfa:key:promptPatience']], scan([sc], data)
      sc['body']['social'] = { 'mailClient' => { 'contacts' => [{ 'id' => 'ghost', 'emailRecord' => { 'id' => 'ghost', 'habits' => { 'approvesPrompts' => 'always' } } }] } }
      assert_equal [['mfa_secret', 'mfa:key:approvesPrompts']], scan([sc], data)
    end

    # R4-2
    test 'R4-2 an honest closet open that lists an object an NPC carried in is clean, and opens the closet' do
      data = two_rooms
      data['rooms']['annex']['objects'].first['needsTag'] = 'carry'
      assert_equal [], scan([open_listing('priya_safe', 'closet_notes1_0', 'annex_memo'), gate], data)
    end

    test 'R4-2 a carried object alone proves no room, and an alreadyOpen answer mixing two rooms is not reported' do
      data = two_rooms
      data['rooms']['annex']['objects'].first['needsTag'] = 'carry'
      assert_equal GATE, scan([open_listing('annex_memo'), gate], data)
      open = open_listing('priya_safe', 'annex_memo')
      open['body']['alreadyOpen'] = true
      assert_equal [], scan([open], two_rooms)
    end

    # R4-3
    test 'R4-3 a door reward opens an ordinary room for the objects in it' do
      data = two_rooms
      data['rooms']['office']['objects'] << { 'id' => 'st_d', 'type' => 'flag-station', 'flags' => ['flag{d}'], 'flagRewards' => [{ 'type' => 'unlock_door', 'target_room' => 'closet' }] }
      reward = as_route(@real[46], 'flags', { 'success' => true, 'rewards' => [{ 'type' => 'unlock_door', 'room_id' => 'closet', 'success' => true }] })
      assert_equal [], scan([reward, gate], data)
      assert_equal GATE, scan([gate], data)
    end

    test 'R4-3 a reward for a door no station authors earns nothing' do
      reward = as_route(@real[46], 'flags', { 'success' => true, 'rewards' => [{ 'type' => 'unlock_door', 'room_id' => 'closet', 'success' => true }] })
      assert_equal GATE, scan([reward, gate], two_rooms)
    end

    test 'R4-3 a prop_door open names the room and lists only its ids' do
      data = two_rooms
      npc = BreakEscape::Game.scenario_room_npcs(data).first
      skip 'no NPC in the capture scenario' unless npc
      data['rooms']['office']['npcs'].find { |n| n['id'] == npc['id'] }['workarounds'] = [{ 'do' => 'prop_door', 'door' => 'closet' }]
      won = as_route(@real[46], 'npc_workaround', { 'roomId' => 'closet', 'roomData' => { 'objects' => [{ 'id' => 'priya_safe' }, { 'id' => 'closet_notes1_0' }] } })
      rows = scan([won, gate], data)
      refute_includes rows, GATE.first
    end

    # R4-4
    def station_data(name)
      data = lock_step_scenario
      st = { 'type' => 'flag-station', 'flags' => ['flag{a}'], 'flagRewards' => [{ 'type' => 'unlock_object', 'objectId' => 'priya_safe' }] }
      st['name'] = name if name
      data['rooms']['office']['objects'] << st
      [data, data['rooms']['office']['objects'].size - 1]
    end

    def station_flags(station)
      as_route(@real[46], 'flags', { 'success' => true, 'rewards' => [{ 'type' => 'unlock_object', 'objectId' => 'priya_safe', 'room_id' => 'office', 'flag_station_id' => station }] })
    end

    test 'R4-4 S1 S2 a station with no id (and with or without a name) is known by the id the server stamps' do
      data, i = station_data(nil)
      assert_equal [], scan([station_flags("office_flag-station_#{i}"), deep(@real[46])], data)
      data, i = station_data('Station A')
      assert_equal [], scan([station_flags("office_flag-station_#{i}"), deep(@real[46])], data)
    end

    test 'R4-4 S3 the name of an id-less station is not what the server sends' do
      data, = station_data('Station A')
      assert_equal OPEN, scan([station_flags('Station A'), deep(@real[46])], data)
    end
  end
end
