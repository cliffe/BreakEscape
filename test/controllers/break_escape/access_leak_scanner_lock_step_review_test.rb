require 'test_helper'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops S8c fixes for the early scanner review (docs/agents/ops_core_build/reviews/S8c_scanner_R1.md): one test per finding,
  # each built from the reviewer's own capture (scratch cases A01.., H01.., M01.., X01..), read from the shared answers fixture.
  # Every lock-form answer of POST mfa/verify, prompt and approve names its lock at the root (R1-L4): the helper adds
  # targetType and targetId from the last gate answer, or from `echo:`.
  class AccessLeakScannerLockStepReviewTest < ActiveSupport::TestCase
    ANSWERS = JSON.parse(File.read(File.expand_path('../../fixtures/files/lock_step/answers.json', __dir__))).freeze
    BASE = '/break_escape/games/1'.freeze
    ROUTE_PATHS = { 'POST /unlock' => 'unlock', 'POST /mfa/verify' => 'mfa/verify', 'POST /mfa/prompt' => 'mfa/prompt',
                    'POST /mfa/approve' => 'mfa/approve', 'GET /mfa/phone' => 'mfa/phone', 'GET /mfa/device' => 'mfa/device' }.freeze
    LOCK_ROUTES = %w[mfa/verify mfa/prompt mfa/approve].freeze

    def deep(value)
      Marshal.load(Marshal.dump(value))
    end

    def note(id)
      { 'id' => id, 'type' => 'notes', 'name' => id }
    end

    NAMES = { 'moira_locker' => "Moira's locker", 'priya_safe' => "Priya's safe" }.freeze

    def lock_obj(id, kind, owner, contents)
      { 'id' => id, 'name' => NAMES.fetch(id, id.tr('_', ' ')), 'type' => 'safe', 'locked' => true, 'secondStep' => { 'kind' => kind, 'owner' => owner }, 'contents' => contents }
    end

    def scenario(empty_gated_room: false)
      npc = ->(id) { { 'id' => id, 'displayName' => id.capitalize, 'habits' => { 'approvesPrompts' => 'always' } } }
      gordon = npc.call('gordon').merge('unlockable' => ['plant_room'])
      { 'startRoom' => 'hall',
        'rooms' => {
          'hall' => { 'type' => 'room_office', 'connections' => { 'north' => 'records_room', 'east' => 'store', 'west' => 'plant_room' },
                      'npcs' => [npc.call('moira').merge('unlockable' => ['records_room']), npc.call('priya'), gordon],
                      'objects' => [lock_obj('moira_locker', 'push', 'moira', [note('locker_memo'), { 'id' => 'inner_box', 'type' => 'box', 'contents' => [note('deep_note')] }]),
                                    lock_obj('moira_desk', 'push', 'moira', [note('desk_note')]),
                                    lock_obj('moira_cabinet', 'code', 'moira', [note('cabinet_file')]),
                                    lock_obj('priya_safe', 'push_number_match', 'priya', [note('safe_note')]),
                                    { 'id' => 'moira_phone', 'type' => 'phone_friendface', 'owner' => 'moira', 'name' => 'p' },
                                    { 'id' => 'priya_phone', 'type' => 'phone_friendface', 'owner' => 'priya', 'name' => 'p' },
                                    { 'id' => 'moira_fob', 'type' => 'code_device', 'owner' => 'moira', 'name' => 'Code device' }] },
          'records_room' => { 'type' => 'room_records', 'connections' => { 'south' => 'hall' }, 'objects' => empty_gated_room ? [] : [note('rec_file')],
                              'locked' => true, 'secondStep' => { 'kind' => 'push', 'owner' => 'moira' } },
          'plant_room' => { 'type' => 'room_plant', 'connections' => { 'east' => 'hall' }, 'objects' => [note('plant_note')],
                            'locked' => true, 'lockType' => 'key', 'secondStep' => { 'kind' => 'push', 'owner' => 'moira' } },
          'store' => { 'type' => 'room_store', 'connections' => { 'west' => 'hall' }, 'objects' => [], 'locked' => true }
        } }
    end

    def start
      @clock = Time.utc(2026, 1, 1)
      @rows = []
      @echo = nil
    end

    def tick(seconds = 1)
      @clock += seconds
      @clock.iso8601(3)
    end

    def answer(name, query: nil, seconds: 1, status: nil, echo: true, base: BASE)
      fx = ANSWERS.fetch(name)
      route = { 'any /mfa/*' => 'GET /mfa/phone', 'POST /mfa/verify | /mfa/prompt | /mfa/approve' => 'POST /mfa/verify' }.fetch(fx['route'], fx['route'])
      path = ROUTE_PATHS.fetch(route)
      row = { 't' => tick(seconds), 'method' => route.split.first, 'path' => "#{base}/#{path}", 'status' => status || fx['status'], 'body' => deep(fx['body']) }
      row['query'] = query if query
      yield row['body'] if block_given?
      body = row['body']
      if body['secondStep'] == true
        @echo = [body['targetType'], body['targetId']]
      elsif (LOCK_ROUTES.include?(path) || name.start_with?('open_')) && !body.key?('error') && body.keys.sort != %w[message success]
        if echo
          type, id = echo.is_a?(Array) ? echo : (@echo || %w[object moira_locker])
          body['targetType'] = type
          body['targetId'] = id
        else
          body.delete('targetType')
          body.delete('targetId')
        end
      end
      @rows << row
      row
    end

    def take(item_id)
      @rows << { 't' => tick, 'method' => 'POST', 'path' => "#{BASE}/inventory", 'status' => 200, 'body' => { 'success' => true },
                 'inv' => { 'action' => 'add', 'itemId' => item_id, 'usedOn' => nil } }
    end

    def raw(method, path, body, status: 200, query: nil, seconds: 1, base: BASE)
      row = { 't' => tick(seconds), 'method' => method, 'path' => "#{base}/#{path}", 'status' => status }
      row['body'] = body unless body == :none
      row['query'] = query if query
      @rows << row
      row
    end

    def phone_query(npc, type, id)
      URI.encode_www_form(npc_id: npc, target_type: type, target_id: id)
    end

    def open_object(*ids)
      answer('open_object') { |b| b['contents'] = ids.map { |i| { 'id' => i, 'type' => 'notes', 'name' => i } } unless ids.empty? }
    end

    def scan(rows = @rows, data: scenario)
      AccessLeakScanner.new(data).scan(rows.each_with_index.map { |r, i| ['run.jsonl', i + 1, r] })
    end

    def lock(findings)
      findings.select { |f| f.rule.start_with?('lock_step_') }.map { |f| [f.rule, f.owner] }.uniq.sort
    end

    def all(findings)
      findings.map { |f| [f.rule, f.owner] }.uniq.sort
    end

    def pass_and_open
      answer('gate_push')
      answer('prompt_passed')
      open_object('locker_memo')
    end

    # ---- R1-L1 gated things under any key --------------------------------------------------------------------------

    test 'R1-L1 a gated item or room object in any answer, under any key, is reported until its lock is opened' do
      captures = {
        'A03 inventory answer' => ['POST', 'inventory', { 'success' => true, 'item' => { 'id' => 'locker_memo', 'type' => 'notes', 'text' => 'secret words' } }],
        'A04 room answer lists the item' => ['GET', 'room/hall', { 'room_id' => 'hall', 'room' => { 'objects' => [{ 'id' => 'locker_memo', 'text' => 'secret words' }] } }],
        'A06 neighbour room lists a gated room object' => ['GET', 'room/hall', { 'room_id' => 'hall', 'room' => { 'objects' => [{ 'id' => 'rec_file', 'text' => 'secret words' }] } }],
        'A07 the whole gated room under another route' => ['GET', 'room/store', { 'room_id' => 'records_room', 'room' => { 'type' => 'room_records', 'objects' => [{ 'id' => 'rec_file' }] } }],
        'A10 bootstrap carries the gated room objects' => ['GET', 'scenario', { 'rooms' => { 'records_room' => { 'locked' => true, 'objects' => [{ 'id' => 'rec_file', 'text' => 'secret words' }] } } }],
        'A02 box inside the gated locker' => ['GET', 'container/inner_box', { 'container_id' => 'inner_box', 'contents' => [{ 'id' => 'deep_note', 'text' => 't' }] }],
        'A11 bootstrap lists the locker with its contents' => ['GET', 'scenario', { 'rooms' => { 'hall' => { 'objects' => [{ 'id' => 'moira_locker', 'contents' => [{ 'id' => 'locker_memo' }] }] } } }]
      }
      captures.each do |label, (method, path, body)|
        start
        raw(method, path, body)
        assert_includes lock(scan).map(&:first), 'lock_step_content', label
      end
    end

    test 'R1-L1 the same answers are allowed once the lock has gate, pass and open earlier; an empty gated room list is nothing' do
      start
      pass_and_open
      raw('POST', 'inventory', { 'success' => true, 'item' => { 'id' => 'locker_memo', 'type' => 'notes' } })
      raw('GET', 'room/hall', { 'room_id' => 'hall', 'room' => { 'objects' => [{ 'id' => 'locker_memo' }] } })
      assert_equal [], lock(scan)
      start
      raw('GET', 'scenario', { 'rooms' => { 'records_room' => { 'locked' => true, 'objects' => [] } } })
      assert_equal [], lock(scan)
      # a gate and a pass are not an open
      start
      answer('gate_push')
      answer('prompt_passed')
      raw('POST', 'inventory', { 'success' => true, 'item' => { 'id' => 'locker_memo' } })
      assert_equal [['lock_step_content', 'lockstep:content:object:moira_locker']], lock(scan)
    end

    # ---- R1-L2 the opener -------------------------------------------------------------------------------------------

    test 'R1-L2 the opener is an NPC the scenario lets open that door, not necessarily the owner' do
      # the plant room: gordon opens it by his ink, the step is moira's; gordon's unlockable list holds the room
      start
      answer('gate_door_npc') { |b| b['targetId'] = 'plant_room'; b['opener'] = 'gordon' }
      answer('prompt_passed')
      answer('open_door') { |b| b['roomData'] = { 'type' => 'room_plant', 'objects' => [{ 'id' => 'plant_note' }] } }
      assert_equal [], lock(scan), 'H01'
      # the owner is not excused: moira's list holds no plant room here
      start
      answer('gate_door_npc') { |b| b['targetId'] = 'plant_room' }
      assert_includes lock(scan), ['lock_step_answer', 'lockstep:gate:unplaced']
      # an NPC whose list holds another room, an unknown NPC, and an opener on an object gate
      [['records_room', 'gordon'], ['records_room', 'nobody']].each do |room, opener|
        start
        answer('gate_door_npc') { |b| b['targetId'] = room; b['opener'] = opener }
        assert_includes lock(scan), ['lock_step_answer', 'lockstep:gate:unplaced'], opener
      end
      start
      answer('gate_push') { |b| b['opener'] = 'moira' }
      assert_includes lock(scan), ['lock_step_answer', 'lockstep:gate:unplaced']
    end

    # ---- R1-L3 a code pass needs the code device -------------------------------------------------------------------

    test 'R1-L3 a code pass with no code device taken is a finding; with the device taken it is clean' do
      start
      answer('gate_code') { |b| b['targetId'] = 'moira_cabinet' }
      answer('verify_passed')
      open_object('cabinet_file')
      assert_equal [['lock_step_answer', 'lockstep:pass:no-gate'], ['lock_step_content', 'lockstep:open:object:moira_cabinet']], lock(scan)
      start
      take('moira_fob')
      answer('gate_code') { |b| b['targetId'] = 'moira_cabinet' }
      answer('verify_passed')
      open_object('cabinet_file')
      assert_equal [], lock(scan)
      # another owner's device does not count
      data = scenario
      data['rooms']['hall']['objects'].find { |o| o['id'] == 'moira_fob' }['owner'] = 'priya'
      start
      take('moira_fob')
      answer('gate_code') { |b| b['targetId'] = 'moira_cabinet' }
      answer('verify_passed')
      assert_equal [['lock_step_answer', 'lockstep:pass:no-gate']], lock(scan(@rows, data: data))
    end

    # ---- R1-L4 placing by the echo ---------------------------------------------------------------------------------

    test 'R1-L4 H03: a pane closed with X, then another lock worked: the pass and open are clean' do
      start
      answer('gate_push')
      answer('gate_door_npc')
      answer('prompt_passed')
      answer('open_door') { |b| b['roomData'] = { 'type' => 'room_records', 'objects' => [{ 'id' => 'rec_file' }] } }
      assert_equal [], lock(scan)
    end

    test 'R1-L4 H04: a number lock left waiting does not make another lock phone approval a finding' do
      start
      take('moira_phone')
      take('priya_phone')
      answer('gate_number')
      answer('gate_push')
      answer('phone_one_request', query: phone_query('moira', 'object', 'moira_locker'))
      answer('approve_passed')
      open_object('locker_memo')
      assert_equal [], lock(scan)
    end

    test 'R1-L4 a cancel or expiry closes only the lock it names' do
      start
      take('moira_phone')
      answer('gate_push')
      answer('gate_push') { |b| b['targetId'] = 'moira_desk' }
      answer('approve_cancelled', echo: %w[object moira_desk])
      answer('approve_passed', echo: %w[object moira_locker])
      answer('open_object', echo: %w[object moira_locker]) { |b| b['contents'] = [note('locker_memo')] } # the open names the lock it opens
      assert_equal [], lock(scan)
      start
      take('moira_phone')
      answer('gate_push')
      answer('gate_push') { |b| b['targetId'] = 'moira_desk' }
      answer('approve_cancelled', echo: %w[object moira_desk])
      answer('approve_passed', echo: %w[object moira_desk])
      assert_equal [['lock_step_answer', 'lockstep:pass:no-gate']], lock(scan)
    end

    test 'R1-L4 an answer in lock form with no echo is a finding, and so is an echo that names no lock' do
      start
      answer('gate_push')
      answer('prompt_passed', echo: false)
      assert_equal [['lock_step_answer', 'lockstep:pass:no-echo']], lock(scan)
      %w[verify_wrong prompt_waiting approve_cancelled prompt_too_soon verify_closed].each do |name|
        start
        answer('gate_push')
        answer(name, echo: false)
        assert_equal 1, lock(scan).size, name
      end
      start
      answer('gate_push')
      answer('prompt_passed', echo: %w[object nothing_here])
      assert_not_empty lock(scan)
      start
      answer('gate_push')
      answer('approve_cancelled', echo: false).tap { |r| r['body']['targetType'] = 'object' } # half an echo
      assert_not_empty lock(scan)
      # a cancel with no echo still takes the gates of its route back (closing is the safe direction)
      start
      answer('gate_push')
      answer('approve_cancelled', echo: false)
      answer('prompt_passed')
      assert_includes lock(scan), ['lock_step_answer', 'lockstep:pass:no-gate']
    end

    test 'R1-L4 the answers that name no lock are allowed with no echo: the error answers and the generic 422' do
      start
      answer('gate_push')
      answer('not_found', status: 404)
      answer('generic_refusal')
      assert_equal [], lock(scan)
    end

    # ---- R1-L5 a scenario with PC steps and lock steps -------------------------------------------------------------

    MFA_SCENARIO = File.expand_path('../../../scenarios/test_ops_mfa/scenario.json.erb', __dir__)

    def mixed
      data = JSON.parse(ScenarioBinding.render(File.read(MFA_SCENARIO)))
      extra = scenario
      room = data['rooms'].values.find { |r| r.is_a?(Hash) && r['objects'].is_a?(Array) }
      room['objects'].concat(extra['rooms']['hall']['objects'])
      room['npcs'] = Array(room['npcs']) + extra['rooms']['hall']['npcs']
      data['rooms'].merge!(extra['rooms'].slice('records_room'))
      data
    end

    def pc_steps(data)
      s = AccessLeakScanner.new(data)
      pcs = s.instance_variable_get(:@priv_pcs).keys
      npcs = s.instance_variable_get(:@priv_npcs).keys
      pcs.product(npcs).map { |pc, n| [pc, n, s.send(:mfa_kind_at, pc, n)] }.reject { |x| x.last == 'none' }
    end

    def pc_required(step)
      raw('POST', 'login', { 'success' => false, 'mfaRequired' => true, 'mfa' => step[2], 'pcId' => step[0], 'npcId' => step[1] })
    end

    test 'R1-L5 the lock runs of every kind are clean in a scenario that has PC steps' do
      data = mixed
      assert_not_empty pc_steps(data)
      start
      answer('gate_push'); answer('prompt_waiting'); answer('prompt_too_soon'); answer('prompt_passed'); open_object('locker_memo')
      assert_equal [], all(scan(@rows, data: data)), 'M01 owner push'
      start
      take('priya_phone'); answer('gate_number'); answer('phone_number_request', query: phone_query('priya', 'object', 'priya_safe'))
      answer('approve_passed'); open_object('safe_note')
      assert_equal [], all(scan(@rows, data: data)), 'M02 number match'
      start
      take('moira_fob')
      answer('gate_code') { |b| b['targetId'] = 'moira_cabinet' }
      raw('GET', 'mfa/device', { 'deviceId' => 'moira_fob', 'displayName' => 'Moira', 'npcId' => 'moira', 'code' => '482913', 'secondsLeft' => 40, 'used' => false }, query: 'item_id=moira_fob')
      answer('verify_wrong'); answer('verify_stale_used'); answer('verify_closed')
      answer('gate_code') { |b| b['targetId'] = 'moira_cabinet' }
      answer('verify_passed'); open_object('cabinet_file')
      assert_equal [], all(scan(@rows, data: data)), 'M03 code lock'
    end

    test 'R1-L5 a PC code step open and a lock code step worked: clean, each side judged by its own rules' do
      data = mixed
      code = pc_steps(data).find { |x| x.last == 'code' }
      skip 'no PC code step in the scenario' unless code
      start
      pc_required(code)
      take('moira_fob')
      answer('gate_code') { |b| b['targetId'] = 'moira_cabinet' }
      answer('verify_wrong'); answer('verify_passed'); open_object('cabinet_file')
      assert_equal [], all(scan(@rows, data: data)), 'M04'
    end

    test 'R1-L5 a lock expiry does not close a PC step and a PC cancel does not close a lock gate' do
      data = mixed
      push = pc_steps(data).find { |x| x.last == 'push' }
      skip 'no PC push step in the scenario' unless push
      pc_pass = { 'success' => true, 'npcId' => push[1], 'via' => 'password', 'approvedBy' => 'owner', 'pcId' => push[0] }
      start
      pc_required(push)
      answer('gate_push'); answer('prompt_expired')
      raw('POST', 'mfa/prompt', deep(pc_pass))
      assert_equal [], all(scan(@rows, data: data)), 'M06'
      start
      answer('gate_push')
      pc_required(push)
      raw('POST', 'mfa/approve', { 'success' => false, 'cancelled' => true }, status: 422)
      answer('prompt_passed'); open_object('locker_memo')
      assert_equal [], all(scan(@rows, data: data)), 'M07'
    end

    test 'R1-L5 an unplaced lock-shaped pass stays a finding under both rules, and a lock answer never earns a PC session' do
      data = mixed
      push = pc_steps(data).find { |x| x.last == 'push' }
      skip 'no PC push step in the scenario' unless push
      start
      pc_required(push)
      answer('prompt_passed') # no gate for it
      found = all(scan(@rows, data: data))
      assert_includes found, ['lock_step_answer', 'lockstep:pass:no-gate']
      assert_includes found, ['mfa_session', 'mfa:session:unknown']
      # the lock's pass earns the PC no session: the PC's own later pass still needs its step
      start
      answer('gate_push'); answer('prompt_passed')
      raw('POST', 'mfa/prompt', { 'success' => true, 'npcId' => push[1], 'via' => 'password', 'approvedBy' => 'owner', 'pcId' => push[0] })
      assert_includes all(scan(@rows, data: data)), ['mfa_session', "mfa:session:#{push[1]}"]
    end

    test 'R1-L5 X01 with a PC step open, a lock-route refusal that names a lock is judged exactly (no attemptsLeft)' do
      data = mixed
      code = pc_steps(data).find { |x| x.last == 'code' }
      skip 'no PC code step in the scenario' unless code
      start
      pc_required(code)
      answer('gate_code') { |b| b['targetId'] = 'moira_cabinet' }
      row = raw('POST', 'mfa/verify', { 'success' => false, 'mfaIncorrect' => true, 'attemptsLeft' => 3, 'targetType' => 'object', 'targetId' => 'moira_cabinet' }, status: 422)
      assert_includes lock(scan(@rows, data: data)), ['lock_step_answer', 'lockstep:refusal:mfa/verify']
      row['body'] = { 'success' => false, 'stale' => 'anything', 'targetType' => 'object', 'targetId' => 'moira_cabinet' }
      assert_includes lock(scan(@rows, data: data)), ['lock_step_answer', 'lockstep:refusal:mfa/verify']
    end

    # ---- R1-L7 ids -------------------------------------------------------------------------------------------------

    test 'R1-L7 a gated object with no id, or a gated lock whose contents or room objects have none, stops the check' do
      data = scenario
      data['rooms']['hall']['objects'] << { 'type' => 'safe', 'locked' => true, 'secondStep' => { 'kind' => 'push', 'owner' => 'moira' }, 'contents' => [note('x')] }
      start
      answer('gate_push')
      assert_raises(ArgumentError) { scan(@rows, data: data) }
      data = scenario
      data['rooms']['hall']['objects'].first['contents'] << { 'type' => 'notes', 'name' => 'no id', 'text' => 'secret words' }
      assert_raises(ArgumentError) { scan(@rows, data: data) }
      data = scenario
      data['rooms']['records_room']['objects'] << { 'type' => 'notes', 'name' => 'no id' }
      assert_raises(ArgumentError) { scan(@rows, data: data) }
      data = scenario
      data['rooms']['hall']['objects'].first['contents'].last['contents'] << { 'name' => 'inner with no id' }
      assert_raises(ArgumentError) { scan(@rows, data: data) }
    end

    test 'R1-L7 a gated room that authors no objects flags an id-less roomData of an ungated door (the safe direction, kept)' do
      start
      answer('open_door', echo: %w[door records_room])
      assert_equal [['lock_step_content', 'lockstep:open:door:records_room']], lock(scan(@rows, data: scenario(empty_gated_room: true)))
    end

    # ---- R1-L8 a repeat gate ---------------------------------------------------------------------------------------

    test 'R1-L8 a repeat gate keeps the first clock and may not change the lock number' do
      start
      answer('gate_push')
      answer('gate_push', seconds: 250)
      answer('prompt_passed', seconds: 150)
      assert_equal [['lock_step_answer', 'lockstep:pass:no-gate']], lock(scan)
      start
      take('priya_phone')
      answer('gate_number')
      answer('gate_number') { |b| b['number'] = 82 }
      answer('phone_number_request', query: phone_query('priya', 'object', 'priya_safe')) { |b| b['requests'][0]['numbers'] = [31, 60, 82] }
      found = lock(scan)
      assert_includes found, ['lock_step_answer', 'lockstep:gate:changed:object:priya_safe']
      assert_includes found, ['lock_step_answer', 'lockstep:phone']
      # an honest repeat inside the time is clean
      start
      answer('gate_push')
      answer('prompt_waiting')
      answer('gate_push', seconds: 100)
      answer('prompt_passed', seconds: 100)
      assert_equal [], lock(scan)
    end

    # ---- R1-L9 games, resets, lost bodies --------------------------------------------------------------------------

    test 'R1-L9 a gate of one game proves nothing in another, a reset takes the proof back, a lost body closes the gate' do
      start
      answer('gate_push', base: '/break_escape/games/2')
      answer('prompt_passed')
      assert_equal [['lock_step_answer', 'lockstep:pass:no-gate']], lock(scan)
      start
      answer('gate_push')
      answer('prompt_passed')
      raw('POST', 'reset', { 'success' => true })
      open_object('locker_memo')
      assert_includes lock(scan), ['lock_step_content', 'lockstep:open:object:moira_locker']
      start
      pass_and_open
      raw('POST', 'reset', { 'success' => true })
      raw('GET', 'container/moira_locker', { 'container_id' => 'moira_locker', 'contents' => [{ 'id' => 'locker_memo' }] })
      assert_equal [['lock_step_content', 'lockstep:content:object:moira_locker']], lock(scan)
      start
      answer('gate_push')
      raw('POST', 'mfa/prompt', :none, status: 422)
      answer('prompt_passed')
      assert_equal [['lock_step_answer', 'lockstep:pass:no-gate']], lock(scan)
      start
      answer('gate_push')
      raw('POST', 'mfa/prompt', 'not json at all', status: 422)
      answer('prompt_passed')
      assert_equal [['lock_step_answer', 'lockstep:pass:no-gate']], lock(scan)
      # a game's own opens still hold in that game while another game is also scanned
      start
      pass_and_open
      raw('GET', 'container/moira_locker', { 'container_id' => 'moira_locker', 'contents' => [{ 'id' => 'locker_memo' }] }, base: '/break_escape/games/2')
      assert_equal [['lock_step_content', 'lockstep:content:object:moira_locker']], lock(scan)
    end

    # ---- R1-L10 inert ----------------------------------------------------------------------------------------------

    test 'R1-L10 the rules are inert in a scenario with no second step, lock-shaped keys included; the state keys are not' do
      data = scenario
      strip = lambda do |n|
        case n
        when Hash then n.delete('secondStep'); n.each_value(&strip)
        when Array then n.each(&strip)
        end
      end
      strip.call(data)
      start
      raw('GET', 'x', { 'secondStep' => true, 'opener' => 'x', 'a' => { 'stepPassed' => true }, 'requests' => [{ 'targetId' => 'q' }] })
      raw('POST', 'mfa/prompt', { 'success' => true, 'stepPassed' => true, 'approvedBy' => 'owner', 'targetType' => 'object', 'targetId' => 'moira_locker' })
      raw('POST', 'mfa/verify', { 'success' => false, 'mfaIncorrect' => true, 'attemptsLeft' => 2 }, status: 422)
      raw('GET', 'x', { 'numbers' => [1, 2, 3], 'number' => 4, 'code' => '123456', 'targetId' => 'moira_locker' })
      raw('GET', 'room/records_room', { 'room_id' => 'records_room', 'room' => { 'objects' => [{ 'id' => 'rec_file' }] } })
      assert_equal [], lock(scan(@rows, data: data))
      start
      raw('GET', 'x', { 'lockSteps' => {} })
      assert_equal [['lock_step_secret', 'lockstep:key:lockSteps']], lock(scan(@rows, data: data))
    end

    # ---- R1-L11, L12, L13, L14 -------------------------------------------------------------------------------------

    test 'R1-L11 numbers beside a pcId are reported unless a policy matching numbers lets the PC rule see them' do
      start
      raw('GET', 'room/hall', { 'room_id' => 'hall', 'room' => { 'pcId' => 'x', 'numbers' => [31, 47, 82] } })
      assert_includes lock(scan), ['lock_step_secret', 'lockstep:key:numbers']
    end

    test 'R1-L12 the honest open of a locker lists an inner box with its own contents' do
      start
      answer('gate_push')
      answer('prompt_passed')
      answer('open_object') { |b| b['contents'] = [{ 'id' => 'locker_memo' }, { 'id' => 'inner_box', 'contents' => [{ 'id' => 'deep_note' }] }] }
      assert_equal [], lock(scan)
      # the excuse is only for the placed lock and only inside the open's own contents
      start
      answer('gate_push')
      answer('prompt_passed')
      answer('open_object') { |b| b['contents'] = [{ 'id' => 'locker_memo' }]; b['elsewhere'] = { 'contents' => [{ 'id' => 'deep_note' }] } }
      # the open's own key list (R1-SCANNER9) reports the extra key as well as the content under it
      assert_equal [['lock_step_answer', 'lockstep:open:key:object:moira_locker'], ['lock_step_content', 'lockstep:content:object:moira_locker']], lock(scan)
      start
      answer('gate_push')
      answer('prompt_passed')
      answer('open_object') { |b| b['contents'] = [{ 'id' => 'locker_memo' }, { 'id' => 'desk_note' }] }
      assert_equal [['lock_step_content', 'lockstep:content:object:moira_desk']], lock(scan)
    end

    test 'R1-L13 the phone entry carries the lock authored name, and a waiting value outside the server list is reported' do
      start
      take('moira_phone')
      answer('gate_push')
      answer('phone_one_request', query: phone_query('moira', 'object', 'moira_locker')) { |b| b['requests'][0]['name'] = 'anything at all' }
      assert_includes lock(scan), ['lock_step_answer', 'lockstep:phone']
      start
      answer('gate_push')
      answer('prompt_waiting') { |b| b['waiting'] = 'she approves on the third request' }
      assert_equal [['lock_step_answer', 'lockstep:refusal:mfa/prompt']], lock(scan)
      %w[owner held_phone].each do |value|
        start
        answer('gate_push')
        answer('prompt_waiting') { |b| b['waiting'] = value }
        assert_equal [], lock(scan), value
      end
    end

    test 'R1-L14 a second gated object with the same id keeps both lists watched, and an item held inside a gated object is watched' do
      data = scenario
      data['rooms']['hall']['objects'] << lock_obj('moira_locker', 'push', 'moira', [note('second_memo')])
      start
      raw('GET', 'container/x', { 'items' => [{ 'id' => 'second_memo' }] })
      assert_equal [['lock_step_content', 'lockstep:content:object:moira_locker']], lock(scan(@rows, data: data))
      data = scenario
      data['rooms']['hall']['objects'].first['itemsHeld'] = [note('held_item')]
      start
      raw('GET', 'x', { 'items' => [{ 'id' => 'held_item' }] })
      assert_equal [['lock_step_content', 'lockstep:content:object:moira_locker']], lock(scan(@rows, data: data))
    end

    test 'the honest runs of the review stay clean (H05 retry with a new number, H06 reopen, H10, H12)' do
      start
      take('priya_phone')
      answer('gate_number')
      answer('phone_number_request', query: phone_query('priya', 'object', 'priya_safe'))
      answer('approve_cancelled')
      answer('gate_number') { |b| b['number'] = 60 }
      answer('phone_number_request', query: phone_query('priya', 'object', 'priya_safe')) { |b| b['requests'][0]['numbers'] = [31, 60, 82] }
      answer('approve_passed')
      open_object('safe_note')
      assert_equal [], lock(scan), 'H05'
      start
      answer('gate_push'); answer('prompt_waiting'); answer('gate_push'); answer('prompt_passed')
      open_object('locker_memo')
      raw('GET', 'container/moira_locker', { 'container_id' => 'moira_locker', 'contents' => [{ 'id' => 'locker_memo' }] })
      open_object('locker_memo')
      assert_equal [], lock(scan), 'H06'
      start
      answer('gate_push'); answer('prompt_passed'); answer('first_factor_wrong'); open_object('locker_memo')
      assert_equal [], lock(scan), 'H10'
      start
      answer('gate_push'); answer('prompt_expired'); answer('gate_push'); answer('prompt_passed'); open_object('locker_memo')
      assert_equal [], lock(scan), 'H12'
      start
      raw('POST', 'sync_state', { 'success' => true, 'captures' => [{ 'targetId' => 'moira_locker', 'kind' => 'credential' }] })
      assert_equal [['lock_step_answer', 'lockstep:unplaced']], lock(scan), 'H11 stays fail-closed (R1-L15)'
    end
  end
end
