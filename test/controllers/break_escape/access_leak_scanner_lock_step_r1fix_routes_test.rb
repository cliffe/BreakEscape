require 'test_helper'
require_relative '../../support/lock_step_routes'
require_relative '../../support/access_work_scenario'
require_relative '../../support/lock_step_real_rows'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops S8c fixes for the second scanner review: honest runs played on the REAL routes of a small scenario of its own (a safe whose
  # phone is held, a request that has run out, a headless owner, a flag reward that opens a room, a prop door, a safe that authors no
  # contents). Every request goes to the real controller, every answer is recorded as a row with `GET scenario` and `GET room/<door>`
  # in the capture, and the scanner must report nothing (R1-SCANNER2, R1-SCANNER6, R1-SCANNER7). Then a copy of the real rows is
  # edited for each proof the allowance needs (R1-SCANNER6: the missing-proof cases are built from real rows, not by hand).
  class AccessLeakScannerLockStepR1fixRoutesTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include LockStepRoutes
    include LockStepRealRows

    setup do
      @now = T0
      travel_to @now
      @rows = []
    end

    teardown do
      travel_back
      OpsLog::Current.reset
    end

    def later(seconds)
      @now += seconds
      travel_to @now
    end

    # a request to the real route, kept as a row of the capture
    def rec(verb, suffix, params = {})
      if verb == :get
        get game_path(suffix), params: params
      else
        post game_path(suffix), params: params, as: :json
      end
      row = { 't' => Time.current.utc.iso8601(3), 'method' => verb.to_s.upcase, 'path' => "/break_escape/games/#{@game.id}/#{suffix}",
              'status' => response.status, 'body' => (response.parsed_body rescue nil) }
      row['query'] = params.to_query if verb == :get && !params.empty?
      row['inv'] = { 'action' => params[:action_type].to_s, 'itemId' => params.dig(:item, :id), 'usedOn' => nil } if suffix == 'inventory'
      @rows << row
      row['body']
    end

    def scan(rows, data)
      scan_with(rows, data)
    end

    def assert_clean(data, label)
      assert_equal [], pairs(scan(@rows, data)), label
    end

    def note(id)
      { 'id' => id, 'type' => 'notes1', 'name' => id, 'text' => "text of #{id}", 'readable' => true }
    end

    def safe(id, pin, owner, contents, kind = 'push')
      { 'id' => id, 'type' => 'safe', 'name' => id.tr('_', ' '), 'locked' => true, 'lockType' => 'pin', 'requires' => pin,
        'secondStep' => { 'kind' => kind, 'owner' => owner }, 'contents' => contents }
    end

    def scenario
      { 'startRoom' => 'hall',
        'flags' => { 'target_vm' => { 'flag_1' => 'flag{one}' } },
        'social' => { 'characters' => { 'ghost' => { 'channels' => { 'email' => 'ghost_mail' },
                                                     'emailRecord' => { 'habits' => { 'approvesPrompts' => 'always' } } } } },
        'rooms' => {
          'hall' => { 'type' => 'room_office', 'connections' => { 'north' => 'vault' },
                      'objects' => [{ 'type' => 'flag-station', 'id' => 'station', 'name' => 'Flag Station', 'acceptsVms' => ['target_vm'],
                                      'flags' => ['target_vm:flag_1'], 'flagRewards' => [{ 'type' => 'unlock_door', 'target_room' => 'vault' }] },
                                    safe('empty_safe', '1234', 'amy', []),
                                    safe('ghost_box', '1111', 'ghost_mail', [note('ghost_memo')]),
                                    safe('amy_box', '3333', 'amy', [note('box_memo')]),
                                    { 'id' => 'amy_phone', 'type' => 'phone_friendface', 'owner' => 'amy', 'name' => "Amy's phone", 'takeable' => true }],
                      'npcs' => [{ 'id' => 'amy', 'displayName' => 'Amy', 'habits' => { 'approvesPrompts' => 'always' } }] },
          'vault' => { 'type' => 'room_office', 'locked' => true, 'lockType' => 'key', 'requires' => 'vault_key',
                       'connections' => { 'south' => 'hall' }, 'secondStep' => { 'kind' => 'push', 'owner' => 'amy' },
                       'objects' => [note('vault_note')] }
        } }
    end

    def game!(data = scenario)
      @rows = []
      build_step_game(data, 'encounteredNPCs' => %w[amy])
    end

    def pin_unlock(id, pin)
      rec(:post, 'unlock', targetType: 'item', targetId: id, attempt: pin, method: 'pin')
    end

    def prompt_until_passed(id)
      6.times do
        later(3)
        break if rec(:post, 'mfa/prompt', target_type: 'object', target_id: id)['stepPassed']
      end
    end

    # ---- R1-SCANNER2 and R1-SCANNER7 ---------------------------------------------------------------------------------------

    test 'R1-SCANNER2 an approve of a request that has run out, and a second approve after the pass, are honest answers' do
      data = scenario
      game!(data)
      rec(:post, 'inventory', action_type: 'add', item: { id: 'amy_phone', type: 'phone_friendface', name: "Amy's phone" })
      pin_unlock('amy_box', '3333')
      rec(:get, 'mfa/phone', npc_id: 'amy', target_type: 'object', target_id: 'amy_box')
      later(301)
      body = rec(:post, 'mfa/approve', target_type: 'object', target_id: 'amy_box')
      assert_equal true, body['expired']
      assert_clean data, 'the approve after 301 s'
      pin_unlock('amy_box', '3333')
      rec(:get, 'mfa/phone', npc_id: 'amy', target_type: 'object', target_id: 'amy_box')
      body = rec(:post, 'mfa/approve', target_type: 'object', target_id: 'amy_box')
      assert_equal true, body['stepPassed']
      body = rec(:post, 'mfa/approve', target_type: 'object', target_id: 'amy_box')
      assert_equal true, body['expired']
      assert_clean data, 'the approve after the pass'
    end

    test 'R1-SCANNER7 the open of a gated object that authors contents: [] is honest, and so is the room that lists it after' do
      data = scenario
      game!(data)
      pin_unlock('empty_safe', '1234')
      prompt_until_passed('empty_safe')
      body = pin_unlock('empty_safe', '1234')
      assert_equal true, body['success']
      rec(:get, 'container/empty_safe')
      rec(:get, 'room/hall')
      assert_clean data, 'the open of the empty safe, then the room'
      pin_unlock('empty_safe', '1234')
      rec(:get, 'room/hall')
      assert_clean data, 'a repeat open'
    end

    # ---- R1-SCANNER6 -------------------------------------------------------------------------------------------------------

    test 'R1-SCANNER6 a headless owner approves a prompt on the real routes, with the bootstrap in the capture' do
      data = scenario
      game!(data)
      rec(:get, 'scenario')
      pin_unlock('ghost_box', '1111')
      prompt_until_passed('ghost_box')
      body = pin_unlock('ghost_box', '1111')
      assert_equal true, body['success']
      assert_clean data, 'headless owner (the bootstrap holds no approvesPrompts, server R1-SCANNER6)'
      # the proof the allowance needs: a record that never approves, and no record at all
      never = deep(data)
      never['social']['characters']['ghost']['emailRecord']['habits']['approvesPrompts'] = 'never'
      assert_includes pairs(scan(@rows, never)).map(&:first), 'lock_step_answer'
      nobody = deep(data)
      nobody['social'] = {}
      assert_includes pairs(scan(@rows, nobody)).map(&:first), 'lock_step_answer'
    end

    test 'R1-SCANNER6 the flag reward that opens a room on the real routes, with the room read after it' do
      data = scenario
      game!(data)
      rec(:get, 'scenario')
      rec(:post, 'flags', flag: 'flag{one}', stationId: 'station')
      rec(:get, 'room/vault')
      rec(:post, 'unlock', targetType: 'door', targetId: 'vault', attempt: '', method: 'unlocked')
      assert_clean data, 'flag reward then the room'
      # missing proof, on copies of these rows
      none = deep(data)
      none['rooms']['hall']['objects'].find { |o| o['id'] == 'station' }.delete('flagRewards')
      assert_not_empty scan(@rows, none), 'the scenario authors no reward'
      other = deep(data)
      other['rooms']['hall']['objects'].find { |o| o['id'] == 'station' }['flagRewards'] = [{ 'type' => 'unlock_door', 'target_room' => 'hall' }]
      assert_not_empty scan(@rows, other), 'the reward is authored for another door'
      rows = deep(@rows)
      flag = idx(rows, 'POST', 'flags')
      room = idx(rows, 'GET', 'room/vault')
      rows[flag], rows[room] = rows[room], rows[flag]
      assert_not_empty scan(rows, data), 'the room read comes before the reward'
      rows = deep(@rows)
      rows[idx(rows, 'POST', 'flags')]['status'] = 422
      assert_not_empty scan(rows, data), 'a refused flag answer'
    end

    test 'R1-SCANNER6 the prop door on the real routes, with the room read after it' do
      d = AccessWorkScenario.scenario
      d['globalVariables'].merge!('rota_down' => false, 'store_door_propped' => false)
      d['resources']['rota'] = { 'kind' => 'rota', 'name' => 'Shift rota system', 'offWhen' => 'rota_down' }
      office = d['rooms']['office']
      office['connections']['north'] = 'store_room'
      office['objects'] += [AccessWorkScenario.pc('tom_pc'),
                            { 'type' => 'fire_extinguisher1', 'id' => 'store_wedge', 'name' => 'Extinguisher', 'revealOnGlobal' => 'store_door_propped' }]
      office['npcs'] += [AccessWorkScenario.staff('tom', 'tfletcher', 'Tom-Teal-40',
                                                  'workNeeds' => ['+rota'], 'role' => %w[facilities staff],
                                                  'workarounds' => [{ 'at' => 40, 'do' => 'prop_door', 'door' => 'store_room',
                                                                      'prop' => 'store_wedge', 'setGlobal' => 'store_door_propped' }])]
      d['rooms']['store_room'] = { 'type' => 'room_office', 'connections' => { 'south' => 'office' }, 'locked' => true,
                                   'lockType' => 'rfid', 'access' => { 'roles' => ['facilities'] }, 'objects' => [note('store_note')],
                                   'secondStep' => { 'kind' => 'push', 'owner' => 'tom' } }
      d = AccessWorkScenario.assign_owners!(d)
      build_step_game(d, 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby office],
                         'encounteredNPCs' => %w[dana kai ian amy omar temp_user tom],
                         'globalVariables' => { 'rota_down' => true, 'store_door_propped' => false })
      @rows = []
      rec(:get, 'scenario')
      run = nil
      2.times do |i|
        later(25) if i.positive?
        b = rec(:post, 'npc_frustration', reports: [{ npc_id: 'tom', event: 'fail', need: 'work', object_id: 'tom_pc', missing: [{ id: 'rota', why: 'down' }] }])
        run = b['answers'].first['run']
      end
      later(5)
      answer = rec(:post, 'npc_workaround', npc_id: 'tom', index: run['index'], hand: run['hand'])
      assert answer['roomData'], answer.inspect
      rec(:get, 'room/store_room')
      assert_clean d, 'prop door then the room'
      # missing proof, on copies of these rows
      none = deep(d)
      none['rooms']['office']['npcs'].find { |n| n['id'] == 'tom' }['workarounds'] = []
      assert_not_empty scan(@rows, none), 'no room NPC authors the prop'
      rows = deep(@rows)
      rows[idx(rows, 'POST', 'npc_workaround')]['status'] = 403
      assert_not_empty scan(rows, d), 'the answer is a refusal status'
      rows = deep(@rows)
      rows[idx(rows, 'POST', 'npc_workaround')]['body']['token'] = 'x'
      assert_not_empty scan(rows, d), 'a key the server never adds'
      rows = deep(@rows)
      work = idx(rows, 'POST', 'npc_workaround')
      room = idx(rows, 'GET', 'room/store_room')
      rows[work], rows[room] = rows[room], rows[work]
      assert_not_empty scan(rows, d), 'the room read comes before the prop answer'
    end
  end
end
