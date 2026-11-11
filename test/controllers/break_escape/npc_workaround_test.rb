require 'test_helper'
require_relative '../../support/access_work_scenario'

module BreakEscape
  # Access model slice 9.2 step B-1 (ACCESS_MODEL_SLICE_9_2_PLAN.md 6, 9.1 and 9.4): the server
  # hands workarounds over as thresholds are crossed, POST /npc_workaround spends each
  # hand-over once, and writes_down, prop_door and emit open what they open.
  class NpcWorkaroundTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include ActiveSupport::Testing::TimeHelpers

    MEI_PASSWORD = 'Mei-Magpie-73'.freeze
    UNA_PASSWORD = 'Una-Umber-19'.freeze

    def rota_staff(id, username, password, extra = {})
      AccessWorkScenario.staff(id, username, password, { 'workNeeds' => ['+rota'] }.merge(extra))
    end

    # The A fixture plus: a `rota` resource with a downIf; Mei (writes_down at 50), Tom
    # (prop_door to store_room at 40, which is behind an rfid door, Una inside), Ellis (emit at
    # 20). Staff perFail is 20.
    def scenario
      data = AccessWorkScenario.scenario
      data['globalVariables'].merge!('rota_down' => false, 'store_door_propped' => false)
      data['resources']['rota'] = { 'kind' => 'rota', 'name' => 'Shift rota system', 'downIf' => 'rota_down' }
      office = data['rooms']['office']
      office['connections']['north'] = 'store_room'
      office['objects'] += [AccessWorkScenario.pc('mei_pc', 'lockChance' => 1), AccessWorkScenario.pc('tom_pc'),
                            AccessWorkScenario.pc('ellis_pc'),
                            { 'type' => 'fire_extinguisher1', 'id' => 'store_wedge', 'name' => 'Extinguisher',
                              'revealOnGlobal' => 'store_door_propped' }]
      office['npcs'] += [
        rota_staff('mei', 'mlin', MEI_PASSWORD, 'workarounds' => [{ 'at' => 50, 'do' => 'writes_down' }]),
        rota_staff('tom', 'tfletcher', 'Tom-Teal-40', 'role' => %w[facilities staff],
                                                     'workarounds' => [{ 'at' => 40, 'do' => 'prop_door', 'door' => 'store_room',
                                                                         'prop' => 'store_wedge', 'setGlobal' => 'store_door_propped' }]),
        rota_staff('ellis', 'eward', 'Ellis-Egret-22', 'workarounds' => [{ 'at' => 20, 'do' => 'emit', 'event' => 'ellis_gave_up', 'noWarning' => true }])
      ]
      data['rooms']['store_room'] = {
        'type' => 'room_office', 'connections' => { 'south' => 'office' }, 'locked' => true, 'lockType' => 'rfid',
        'access' => { 'roles' => ['facilities'] },
        'objects' => [AccessWorkScenario.pc('una_pc')],
        'npcs' => [rota_staff('una', 'uwalsh', UNA_PASSWORD)]
      }
      data
    end

    def build(data: scenario, globals: {}, player_state: {})
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: data,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby office],
                        'encounteredNPCs' => %w[dana kai ian amy omar temp_user mei tom ellis],
                        'globalVariables' => { 'rota_down' => true, 'store_door_propped' => false }.merge(globals) }.merge(player_state)
      )
    end

    def report(*reports)
      post npc_frustration_game_url(@game), params: { reports: reports }, as: :json
      (response.parsed_body.is_a?(Hash) && response.parsed_body['answers']) || flunk("#{response.status} #{response.body[0, 300]}")
    end

    def rota_fail(npc)
      { npc_id: npc, event: 'fail', need: 'work', object_id: "#{npc}_pc", missing: [{ id: 'rota', why: 'down' }] }
    end

    # Fails spaced past the park floor (0.5 min: 24 s), from time t
    def fails(npc, count, t)
      (0...count).map { |i| travel_to(t + (i * 25)) { report(rota_fail(npc)).first } }
    end

    def workaround(npc, run, at, dropped: false)
      travel_to(at) do
        post npc_workaround_game_url(@game), params: { npc_id: npc, index: run['index'], hand: run['hand'], dropped: dropped }, as: :json
      end
      response
    end

    def entry(npc)
      @game.reload.player_state.dig('npcFrustration', npc)
    end

    def scenario_block(npc)
      get scenario_game_url(@game), as: :json
      response.parsed_body.dig('npcFrustration', npc)
    end

    # ── hand-over ──────────────────────────────────────────────────────

    test 'a workaround is handed over when its threshold is crossed, with nothing secret in run' do
      build
      t = Time.current
      a = fails('mei', 3, t)
      assert_equal [20, 40, 60], a.map { |x| x['level'] }
      assert_equal [1, 2, 2], a.map { |x| x['tell'] }
      assert_nil a[0]['run']
      assert_nil a[1]['run']
      assert_equal({ 'index' => 0, 'hand' => 1, 'do' => 'writes_down', 'dwell' => 6 }, a[2]['run'])
      refute_includes a.to_json, MEI_PASSWORD
    end

    test 'thresholds crossed one at a time and two at once: one hand-over per failure' do
      data = scenario
      mei = data['rooms']['office']['npcs'].find { |n| n['id'] == 'mei' }
      mei['frustration'] = { 'perFail' => 50 }
      mei['workarounds'] = [{ 'at' => 20, 'do' => 'emit', 'event' => 'e1' }, { 'at' => 40, 'do' => 'emit', 'event' => 'e2' },
                            { 'at' => 90, 'do' => 'emit', 'event' => 'e3' }]
      build(data: data)
      t = Time.current
      a = fails('mei', 3, t)
      assert_equal [0, 1, 2], a.map { |x| x['run']['index'] }, 'two crossed at once: the first now, the second at the next failure'
      assert_equal [1, 2, 3], a.map { |x| x['run']['hand'] }
      assert_equal [false, false, false], a.map { |x| x['settled'] }
    end

    test 'a lasting workaround handed over and not spent is not handed over again; after dropped it is' do
      build
      t = Time.current
      run = fails('mei', 3, t).last['run']
      assert_nil fails('mei', 1, t + 75).first['run'], 'handed over and waiting'
      assert_equal 200, workaround('mei', run, t + 80, dropped: true).status
      assert_equal({}, response.parsed_body)
      assert_empty entry('mei')['done']
      again = fails('mei', 1, t + 100).first['run']
      assert_equal 0, again['index']
      assert_equal 2, again['hand'], 'a new hand-over has its own number'
    end

    test 'run never repeats one that is done; at 100 with everything done the NPC is settled' do
      build
      t = Time.current
      run = fails('mei', 3, t).last['run']
      assert_equal 200, workaround('mei', run, t + 60).status
      later = fails('mei', 2, t + 75)
      assert_equal [nil, nil], later.map { |x| x['run'] }
      assert_equal [80, 100], later.map { |x| x['level'] }
      assert_equal true, later.last['settled']
      assert_equal 2, later.last['tell']
    end

    test 'an NPC at 100 is not settled while a lasting workaround waits or is still to hand over' do
      data = scenario
      data['rooms']['office']['npcs'].find { |n| n['id'] == 'mei' }['workarounds'] =
        [{ 'at' => 50, 'do' => 'emit', 'event' => 'e1' }, { 'at' => 100, 'do' => 'emit', 'event' => 'e2' }]
      build(data: data)
      t = Time.current
      a = fails('mei', 5, t)
      assert_equal [20, 40, 60, 80, 100], a.map { |x| x['level'] }
      assert_equal 0, a[2]['run']['index']
      assert_nil a[3]['run'], 'e1 waits; e2 is at 100 and the level is 80'
      assert_equal 1, a[4]['run']['index'], 'e2 comes into force at 100 while e1 still waits'
      assert_equal false, a[4]['settled']
      workaround('mei', a[2]['run'], t + 110)
      workaround('mei', a[4]['run'], t + 110)
      assert_equal true, fails('mei', 1, t + 125).first['settled']
    end

    # ── POST /npc_workaround checks ────────────────────────────────────

    test '"done" for a hand-over never made is refused; so is a wrong hand number and an unknown NPC' do
      build
      assert_equal 403, workaround('mei', { 'index' => 0, 'hand' => 1 }, Time.current).status
      t = Time.current
      run = fails('mei', 3, t).last['run']
      assert_equal 403, workaround('mei', run.merge('hand' => 7), t + 60).status
      assert_equal 403, workaround('nobody', run, t + 60).status
      assert_equal 403, workaround('mei', run.merge('index' => 'x'), t + 60).status
      assert_equal 403, workaround('una', { 'index' => 0, 'hand' => 1 }, t + 60).status, 'not yet met'
      assert entry('mei')['handed'].key?('0')
    end

    test '"done" before the dwell answers 425 and writes nothing; after it, it is spent' do
      build
      t = Time.current
      run = fails('mei', 3, t).last['run']
      before = @game.reload.player_state.deep_dup
      assert_equal 425, workaround('mei', run, t + 50 + 2).status
      assert_equal before, @game.reload.player_state
      assert_equal 200, workaround('mei', run, t + 50 + 6).status
      assert_equal [0], entry('mei')['done']
      assert_equal({ 'hand' => 1, 'done' => true }, entry('mei')['lastSpent']['0'])
      assert_empty entry('mei')['handed']
    end

    test 'a second "done" for one hand-over is answered with the same body and writes nothing' do
      build
      t = Time.current
      run = fails('tom', 2, t).last['run']
      first = workaround('tom', run, t + 40).parsed_body
      state = @game.reload.player_state.deep_dup
      second = workaround('tom', run, t + 45).parsed_body
      assert_equal first, second
      assert_equal state, @game.reload.player_state
    end

    # ── writes_down ────────────────────────────────────────────────────

    def postit(pc)
      get login_accounts_game_url(@game), params: { pc_id: pc }
      assert_response :success
      response.parsed_body['postitNote']
    end

    test 'writes_down: no password in the answer; the note on the owner\'s PC only after "done"' do
      build
      t = Time.current
      run = fails('mei', 3, t).last['run']
      assert_nil postit('mei_pc'), 'handed over is not done'
      res = workaround('mei', run, t + 60)
      assert_equal({ 'pcId' => 'mei_pc', 'hasPostit' => true }, res.parsed_body)
      refute_includes res.body, MEI_PASSWORD
      assert_equal "mlin / #{MEI_PASSWORD}", postit('mei_pc')
      assert_equal 'no-store', response.headers['Cache-Control']
      assert_nil postit('tom_pc')
      get room_game_url(@game, room_id: 'office'), as: :json
      pc = response.parsed_body.dig('room', 'objects')&.find { |o| o['id'] == 'mei_pc' } ||
           response.parsed_body['objects']&.find { |o| o['id'] == 'mei_pc' }
      assert_equal true, pc['hasPostit']
      refute_includes response.body, MEI_PASSWORD
    end

    test 'writes_down: an authored postitNote still wins' do
      data = scenario
      data['rooms']['office']['objects'].find { |o| o['id'] == 'mei_pc' }['postitNote'] = 'Back in 5'
      build(data: data)
      t = Time.current
      run = fails('mei', 3, t).last['run']
      workaround('mei', run, t + 60)
      assert_nil postit('mei_pc')
    end

    # ── prop_door ──────────────────────────────────────────────────────

    test 'prop_door: the room is unlocked and served, its NPCs met, a fail for one then accepted, the global set' do
      build
      t = Time.current
      a = fails('tom', 2, t)
      run = a.last['run']
      assert_equal({ 'index' => 0, 'hand' => 1, 'do' => 'prop_door', 'dwell' => 4, 'door' => 'store_room', 'prop' => 'store_wedge' }, run)
      assert_equal 425, workaround('tom', run, t + 25 + 1).status
      refute_includes @game.reload.player_state['unlockedRooms'], 'store_room'
      res = workaround('tom', run, t + 25 + 4)
      assert_equal 200, res.status
      body = res.parsed_body
      assert_equal 'store_room', body['roomId']
      assert_equal 'store_door_propped', body['setGlobal']
      assert body['roomData'].is_a?(Hash)
      assert(body['roomData']['npcs'].any? { |n| n['id'] == 'una' })
      refute_includes res.body, UNA_PASSWORD
      state = @game.reload.player_state
      assert_includes state['unlockedRooms'], 'store_room'
      assert_includes state['encounteredNPCs'], 'una'
      assert_equal true, state['globalVariables']['store_door_propped']
      assert_equal [0], state.dig('npcFrustration', 'tom', 'done')
      assert_equal 20, travel_to(t + 40) { report(rota_fail('una')).first['level'] }
    end

    test 'a setGlobal that globalVariables does not declare is not set' do
      data = scenario
      data['globalVariables'].delete('store_door_propped')
      build(data: data, globals: {})
      @game.player_state['globalVariables'].delete('store_door_propped')
      @game.save!
      t = Time.current
      run = fails('tom', 2, t).last['run']
      body = workaround('tom', run, t + 40).parsed_body
      assert_nil body['setGlobal']
      refute @game.reload.player_state['globalVariables'].key?('store_door_propped')
    end

    # ── emit ───────────────────────────────────────────────────────────

    test 'emit: handed over on the first failure, pending in GET /scenario until confirmed, then done' do
      build
      t = Time.current
      a = fails('ellis', 1, t).first
      assert_equal 20, a['level']
      assert_equal 2, a['tell']
      run = a['run']
      assert_equal({ 'index' => 0, 'hand' => 1, 'do' => 'emit', 'dwell' => 0, 'event' => 'ellis_gave_up' }, run)
      blk = scenario_block('ellis')
      assert_equal [run], blk['pending']
      assert_equal [], blk['done']
      assert_equal({}, workaround('ellis', run, t + 1).parsed_body)
      blk = scenario_block('ellis')
      assert_equal [], blk['pending']
      assert_equal [{ 'index' => 0, 'do' => 'emit' }], blk['done']
    end

    test 'GET /scenario lists done workarounds with their setGlobal' do
      build
      t = Time.current
      run = fails('tom', 2, t).last['run']
      workaround('tom', run, t + 40)
      assert_equal [{ 'index' => 0, 'do' => 'prop_door', 'setGlobal' => 'store_door_propped' }], scenario_block('tom')['done']
    end

    test "a workaround on an NPC whose list is a role's: the role's list is used" do
      data = scenario
      data['roles']['facilities'] = { 'workarounds' => [{ 'at' => 20, 'do' => 'emit', 'event' => 'role_e' }] }
      data['rooms']['office']['npcs'].find { |n| n['id'] == 'tom' }.delete('workarounds')
      build(data: data)
      assert_equal 'role_e', fails('tom', 1, Time.current).first['run']['event']
    end

    # ── no exposure ────────────────────────────────────────────────────

    test 'no exposure: no workaround before its hand-over; the written password only in /login_accounts' do
      data = scenario
      build(data: data, player_state: { 'unlockedRooms' => ['lobby'], 'encounteredNPCs' => [] })
      bodies = []
      get scenario_game_url(@game), as: :json
      bodies << response.body
      @game.reload
      @game.player_state['unlockedRooms'] << 'office'
      @game.save!
      get room_game_url(@game, room_id: 'office'), as: :json
      bodies << response.body
      bodies.each_with_index do |body, i|
        refute_includes body, MEI_PASSWORD, "response #{i}"
        refute_match(/"do":\s*"(writes_down|prop_door|emit)"/, body, "response #{i}")
        refute_includes body, '"store_wedge","setGlobal"', "response #{i}"
        refute_includes body, 'Shift rota system', "response #{i}"
      end
      t = Time.current
      a = fails('mei', 3, t)
      refute_includes a.to_json, MEI_PASSWORD
      res = workaround('mei', a.last['run'], t + 60)
      refute_includes res.body, MEI_PASSWORD
      get scenario_game_url(@game), as: :json
      refute_includes response.body, MEI_PASSWORD
      get room_game_url(@game, room_id: 'office'), as: :json
      refute_includes response.body, MEI_PASSWORD
      assert_equal "mlin / #{MEI_PASSWORD}", postit('mei_pc')
    end
  end
end
