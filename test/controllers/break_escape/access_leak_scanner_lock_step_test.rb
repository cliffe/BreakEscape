require 'test_helper'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops S8c unit 11 (feature A25): the leak scanner's rules for a second step on any lock
  # (tools/playtest/lib/lock_step_leak_rules.rb). Every server answer here is read from the shared
  # fixture test/fixtures/files/lock_step/answers.json (a copy with one named field changed where a
  # different lock is meant); the controller does not send them yet, so the rules stand on those shapes.
  #
  # A clean run reports nothing; the same run doctored once per rule reports exactly that rule; the
  # earned case is allowed and each near miss (an open with no pass, a pass with no gate, a phone of
  # another owner, an unknown route) is a finding.
  class AccessLeakScannerLockStepTest < ActiveSupport::TestCase
    ANSWERS = JSON.parse(File.read(File.expand_path('../../fixtures/files/lock_step/answers.json', __dir__))).freeze
    BASE = '/break_escape/games/1'.freeze
    ROUTE_PATHS = { 'POST /unlock' => 'unlock', 'POST /mfa/verify' => 'mfa/verify', 'POST /mfa/prompt' => 'mfa/prompt',
                    'POST /mfa/approve' => 'mfa/approve', 'GET /mfa/phone' => 'mfa/phone', 'GET /mfa/device' => 'mfa/device' }.freeze
    MEMO = { 'id' => 'locker_memo', 'type' => 'notes', 'name' => 'Locker memo', 'takeable' => true }.freeze

    def deep(value)
      Marshal.load(Marshal.dump(value))
    end

    def scenario
      moira = { 'id' => 'moira', 'displayName' => 'Moira', 'habits' => { 'approvesPrompts' => 'always' } }
      priya = { 'id' => 'priya', 'displayName' => 'Priya', 'habits' => { 'approvesPrompts' => 'always' } }
      locker = { 'id' => 'moira_locker', 'type' => 'safe', 'locked' => true, 'secondStep' => { 'kind' => 'push', 'owner' => 'moira' },
                 'contents' => [deep(MEMO)] }
      cabinet = { 'id' => 'moira_cabinet', 'type' => 'safe', 'locked' => true, 'secondStep' => { 'kind' => 'code', 'owner' => 'moira' },
                  'contents' => [{ 'id' => 'cabinet_file', 'type' => 'notes', 'name' => 'Cabinet file' }] }
      safe = { 'id' => 'priya_safe', 'type' => 'safe', 'locked' => true, 'secondStep' => { 'kind' => 'push_number_match', 'owner' => 'priya' },
               'contents' => [{ 'id' => 'safe_note', 'type' => 'notes', 'name' => 'Safe note' }] }
      { 'startRoom' => 'hall',
        'rooms' => {
          'hall' => { 'type' => 'room_office', 'connections' => { 'north' => 'records_room' }, 'npcs' => [moira, priya],
                      'objects' => [locker, cabinet, safe,
                                    { 'id' => 'moira_phone', 'type' => 'phone_friendface', 'owner' => 'moira', 'name' => "Moira's phone" },
                                    { 'id' => 'priya_phone', 'type' => 'phone_friendface', 'owner' => 'priya', 'name' => "Priya's phone" },
                                    { 'id' => 'moira_fob', 'type' => 'code_device', 'owner' => 'moira', 'name' => 'Code device' }] },
          'records_room' => { 'type' => 'room_records', 'connections' => { 'south' => 'hall' }, 'objects' => [],
                              'locked' => true, 'secondStep' => { 'kind' => 'push', 'owner' => 'moira' } }
        } }
    end

    # ---- capture rows, made from the fixture ------------------------------------------------------------------

    def start
      @clock = Time.utc(2026, 1, 1)
      @rows = []
    end

    def tick(seconds = 1)
      @clock += seconds
      @clock.iso8601(3)
    end

    # One recorded answer: the fixture's body and status, on the route the fixture names.
    def answer(name, query: nil, seconds: 1, status: nil)
      fx = ANSWERS.fetch(name)
      route = { 'any /mfa/*' => 'GET /mfa/phone', 'POST /mfa/verify | /mfa/prompt | /mfa/approve' => 'POST /mfa/verify' }.fetch(fx['route'], fx['route'])
      path = ROUTE_PATHS.fetch(route)
      method = route.split.first
      row = { 't' => tick(seconds), 'method' => method == 'any' ? 'GET' : method, 'path' => "#{BASE}/#{path}",
              'status' => status || fx['status'], 'body' => deep(fx['body']) }
      row['query'] = query if query
      yield row['body'] if block_given?
      @rows << row
      row
    end

    def take(item_id)
      @rows << { 't' => tick, 'method' => 'POST', 'path' => "#{BASE}/inventory", 'status' => 200, 'body' => { 'success' => true },
                 'inv' => { 'action' => 'add', 'itemId' => item_id, 'usedOn' => nil } }
    end

    def raw(method, path, body, status: 200, query: nil)
      row = { 't' => tick, 'method' => method, 'path' => "#{BASE}/#{path}", 'status' => status, 'body' => body }
      row['query'] = query if query
      @rows << row
      row
    end

    def phone_query(npc, type, id)
      URI.encode_www_form(npc_id: npc, target_type: type, target_id: id)
    end

    def device_body(code = '482913')
      { 'deviceId' => 'moira_fob', 'displayName' => 'Moira', 'npcId' => 'moira', 'code' => code, 'secondsLeft' => 40, 'used' => false }
    end

    def open_object(contents_id = nil)
      answer('open_object') { |b| b['contents'].first['id'] = contents_id if contents_id }
    end

    # The owner approves a push lock, the player answers a number lock on the owner's phone, a code lock on the device,
    # a door the owner approves: each from its gate to its open, as the fixture shapes follow one another.
    def owner_push
      answer('gate_push')
      answer('prompt_waiting')
      answer('prompt_too_soon')
      answer('prompt_passed')
      open_object
    end

    def number_match
      take('priya_phone')
      answer('gate_number')
      answer('phone_number_request', query: phone_query('priya', 'object', 'priya_safe'))
      answer('approve_passed')
      open_object('safe_note')
    end

    def code_lock
      take('moira_fob')
      answer('gate_code') { |b| b['targetId'] = 'moira_cabinet' }
      raw('GET', 'mfa/device', device_body, query: 'item_id=moira_fob')
      answer('verify_wrong')
      answer('verify_stale_used')
      answer('verify_passed')
      open_object('cabinet_file')
    end

    def door_run
      answer('gate_door_npc')
      answer('prompt_passed')
      answer('open_door')
    end

    def clean_run
      start
      owner_push
      number_match
      code_lock
      door_run
      @rows
    end

    def scan(rows = @rows, data: scenario)
      scanner = AccessLeakScanner.new(data)
      scanner.scan(rows.each_with_index.map { |r, i| ['run.jsonl', i + 1, r] })
    end

    def lock(findings)
      findings.select { |f| f.rule.start_with?('lock_step_') }.map { |f| [f.rule, f.owner] }.uniq.sort
    end

    def rules(findings)
      lock(findings).map(&:first).uniq
    end

    def assert_only(rule, rows, message = nil)
      found = scan(rows)
      assert_equal [rule], rules(found), "#{message}: #{lock(found).inspect}"
      assert_equal [], found.reject { |f| f.rule.start_with?('lock_step_') }.map { |f| [f.rule, f.owner] }, 'no other rule fires'
    end

    def assert_clean(rows = @rows)
      assert_equal [], scan(rows).map { |f| [f.rule, f.owner, f.json_path] }
    end

    def without_row(rows, row)
      rows.reject { |r| r.equal?(row) }
    end

    def rule_text_known
      %w[lock_step_content lock_step_secret lock_step_answer].each { |r| assert AccessLeakScanner::RULE_TEXT.key?(r), r }
    end

    # ---- the earned run --------------------------------------------------------------------------------------

    test 'the fixture shapes the run is built from are the ones the rules read' do
      %w[gate_push gate_number gate_code gate_door_npc open_object open_door verify_passed prompt_passed approve_passed
         phone_number_request phone_one_request].each { |n| assert ANSWERS.key?(n), n }
      rule_text_known
    end

    test 'a clean run reports nothing: owner approval, number match on the phone, a code from the device, a door' do
      clean_run
      assert_clean
    end

    test 'a run with no second step at all reports nothing from these rules' do
      start
      raw('POST', 'unlock', { 'success' => true, 'type' => 'object', 'hasContents' => true, 'contents' => [deep(MEMO)] })
      assert_equal [], lock(scan(@rows, data: { 'rooms' => { 'hall' => { 'objects' => [{ 'id' => 'plain', 'contents' => [deep(MEMO)] }] } } }))
    end

    test 'the phone path for a plain push lock is allowed with the owner phone taken' do
      start
      answer('gate_push')
      take('moira_phone')
      answer('phone_one_request', query: phone_query('moira', 'object', 'moira_locker'))
      answer('approve_passed')
      open_object
      assert_clean
    end

    test 'an open repeated after the proof, and contents served after it, are allowed' do
      start
      owner_push
      open_object
      raw('GET', 'container/moira_locker', { 'container_id' => 'moira_locker', 'contents' => [deep(MEMO)] })
      assert_clean
    end

    test 'a code and a failed code answer: closed, dropped and stale answers are shapes the server sends' do
      start
      take('moira_fob')
      answer('gate_code') { |b| b['targetId'] = 'moira_cabinet' }
      answer('verify_closed')
      answer('verify_dropped')
      answer('not_found', status: 404)
      assert_clean
    end

    # ---- content and the open ---------------------------------------------------------------------------------

    test 'an open with no pass before it is reported' do
      start
      answer('gate_push')
      open_object
      found = scan
      assert_equal [['lock_step_content', 'lockstep:open:object:moira_locker']], lock(found)
    end

    test 'an open with a pass before a different lock is reported' do
      start
      answer('gate_push')
      answer('prompt_passed')
      answer('open_door')
      assert_equal [['lock_step_content', 'lockstep:open:door:records_room']], lock(scan)
    end

    test 'a pass that comes before its gate earns nothing: the pass and the open are reported' do
      start
      answer('prompt_passed')
      answer('gate_push')
      open_object
      assert_equal [['lock_step_answer', 'lockstep:pass:no-gate'], ['lock_step_content', 'lockstep:open:object:moira_locker']], lock(scan)
    end

    test 'a pass after the pending time is reported' do
      start
      answer('gate_push')
      answer('prompt_passed', seconds: BreakEscape::MfaModel::PENDING_SECONDS + 1)
      assert_equal [['lock_step_answer', 'lockstep:pass:no-gate']], lock(scan)
      start
      answer('gate_push')
      answer('prompt_passed', seconds: BreakEscape::MfaModel::PENDING_SECONDS)
      assert_clean
    end

    test 'a pass that two open gates could take is reported, never guessed' do
      start
      answer('gate_push')
      answer('gate_door_npc')
      answer('prompt_passed')
      assert_equal [['lock_step_answer', 'lockstep:pass:ambiguous']], lock(scan)
    end

    test 'a pass on the route of the other kind of lock is reported' do
      start
      answer('gate_push')
      answer('verify_passed')
      assert_equal [['lock_step_answer', 'lockstep:pass:no-gate']], lock(scan)
    end

    test 'a pass is not taken twice and a cancelled or expired step ends the gates of its route' do
      start
      answer('gate_push')
      answer('prompt_passed')
      answer('prompt_passed')
      assert_equal [['lock_step_answer', 'lockstep:pass:no-gate']], lock(scan)
      start
      answer('gate_push')
      answer('approve_cancelled')
      answer('prompt_passed')
      assert_equal [['lock_step_answer', 'lockstep:pass:no-gate']], lock(scan)
    end

    test 'the owner approving by prompt is refused as proof when the owner never approves' do
      start
      answer('gate_push')
      answer('prompt_passed')
      data = scenario
      data['rooms']['hall']['npcs'].first['habits'] = { 'approvesPrompts' => 'never' }
      assert_equal [['lock_step_answer', 'lockstep:pass:no-gate']], lock(scan(@rows, data: data))
    end

    test 'a player approval needs the owner phone to have been taken' do
      start
      answer('gate_push')
      answer('approve_passed')
      assert_equal [['lock_step_answer', 'lockstep:pass:no-gate']], lock(scan)
    end

    test 'contents of a gated object in a container answer before the open are reported' do
      start
      raw('GET', 'container/moira_locker', { 'container_id' => 'moira_locker', 'contents' => [] })
      assert_equal [['lock_step_content', 'lockstep:content:object:moira_locker']], lock(scan)
      start
      raw('GET', 'room/hall', { 'objects' => [{ 'id' => 'moira_locker', 'contents' => [deep(MEMO)] }] })
      assert_equal [['lock_step_content', 'lockstep:content:object:moira_locker']], lock(scan)
      start
      answer('gate_push')
      raw('GET', 'container/other', { 'items' => [{ 'contents' => [deep(MEMO)] }] })
      assert_equal [['lock_step_content', 'lockstep:content:object:moira_locker']], lock(scan)
    end

    test 'contents and room data are not allowed for a lock that only has its gate or its pass' do
      start
      answer('gate_push')
      raw('GET', 'container/moira_locker', { 'contents' => [deep(MEMO)] })
      assert_equal 1, lock(scan).size
      start
      answer('gate_push')
      answer('prompt_passed')
      raw('GET', 'container/moira_locker', { 'contents' => [deep(MEMO)] })
      assert_equal [['lock_step_content', 'lockstep:content:object:moira_locker']], lock(scan)
    end

    test 'room data of a gated room outside its open is reported, and the room route too' do
      start
      raw('GET', 'scenario', { 'rooms' => { 'records_room' => { 'roomData' => { 'type' => 'room_records', 'objects' => [] } } } })
      assert_equal [['lock_step_content', 'lockstep:content:door:records_room']], lock(scan)
      start
      raw('GET', 'room/records_room', { 'type' => 'room_records', 'objects' => [] })
      assert_equal [['lock_step_content', 'lockstep:room:door:records_room']], lock(scan)
      start
      door_run
      raw('GET', 'room/records_room', { 'type' => 'room_records', 'objects' => [] })
      assert_clean
    end

    test 'an open with no pass for a door is reported' do
      start
      answer('gate_door_npc')
      answer('open_door')
      assert_equal [['lock_step_content', 'lockstep:open:door:records_room']], lock(scan)
    end

    test 'contents two gated locks share are proof for the one that passed only; the other is reported' do
      data = scenario
      data['rooms']['hall']['objects'][1]['contents'] = [deep(MEMO)]
      start
      owner_push
      assert_equal [['lock_step_content', 'lockstep:content:object:moira_cabinet']], lock(scan(@rows, data: data))
    end

    # ---- state keys --------------------------------------------------------------------------------------------

    test 'a lock-step state key anywhere is reported, one rule per key' do
      %w[lockSteps npcStepGrants mfaPrompts mfaAccounts].each do |key|
        clean_run
        @rows.last['body'] = { 'success' => true, 'nested' => [{ key => { 'object:moira_locker' => {} } }] }
        found = scan
        assert_includes lock(found), ['lock_step_secret', "lockstep:key:#{key}"], key
        assert_equal ['lock_step_secret'], rules(found), key
      end
    end

    test 'a state key is reported even when the scenario has no second step' do
      start
      raw('GET', 'scenario', { 'player_state' => { 'lockSteps' => {} } })
      assert_equal [['lock_step_secret', 'lockstep:key:lockSteps']], lock(scan(@rows, data: { 'rooms' => {} }))
    end

    # ---- numbers and codes -------------------------------------------------------------------------------------

    test 'a number in a gate answer of a push lock, or in an answer of another route, is reported' do
      start
      answer('gate_push') { |b| b['number'] = 47 }
      assert_equal 2, lock(scan).size
      assert_equal ['lock_step_answer', 'lock_step_secret'], rules(scan)
      start
      answer('gate_number')
      answer('prompt_waiting') { |b| b['number'] = 47 }
      assert_includes lock(scan), ['lock_step_secret', 'lockstep:key:number']
      start
      answer('gate_number')
      answer('approve_passed') { |b| b['number'] = 47 }
      assert_includes lock(scan), ['lock_step_secret', 'lockstep:key:number']
    end

    test 'a number gate must name a number in range, and carry no mark of the right choice' do
      start
      answer('gate_number') { |b| b['number'] = 7 }
      assert_includes lock(scan), ['lock_step_answer', 'lockstep:gate:unplaced']
      start
      answer('gate_number') { |b| b.delete('number') }
      assert_equal [['lock_step_answer', 'lockstep:gate:unplaced']], lock(scan)
    end

    test 'the choices in the phone answer need the phone, the gate and the request that named the lock' do
      # no phone taken
      start
      answer('gate_number')
      answer('phone_number_request', query: phone_query('priya', 'object', 'priya_safe'))
      assert_equal [['lock_step_answer', 'lockstep:phone'], ['lock_step_answer', 'lockstep:unplaced'], ['lock_step_secret', 'lockstep:key:numbers']], lock(scan)
      # another owner's phone
      start
      take('moira_phone')
      answer('gate_number')
      answer('phone_number_request', query: phone_query('priya', 'object', 'priya_safe'))
      assert_includes rules(scan), 'lock_step_secret'
      # no gate for that lock
      start
      take('priya_phone')
      answer('phone_number_request', query: phone_query('priya', 'object', 'priya_safe'))
      assert_includes rules(scan), 'lock_step_secret'
      # the request named another lock, the owner of another, extra parameters, or none
      [phone_query('priya', 'object', 'moira_locker'), phone_query('moira', 'object', 'priya_safe'), 'npc_id=priya',
       "#{phone_query('priya', 'object', 'priya_safe')}&x=1", nil].each do |query|
        start
        take('priya_phone')
        answer('gate_number')
        answer('phone_number_request', query: query)
        assert_includes lock(scan), ['lock_step_secret', 'lockstep:key:numbers'], query.inspect
      end
      # the path is not the strict route
      start
      take('priya_phone')
      answer('gate_number')
      row = answer('phone_number_request', query: phone_query('priya', 'object', 'priya_safe'))
      row['path'] = "#{row['path']}.json"
      assert_includes lock(scan), ['lock_step_secret', 'lockstep:key:numbers']
      # not a 200
      start
      take('priya_phone')
      answer('gate_number')
      answer('phone_number_request', query: phone_query('priya', 'object', 'priya_safe'), status: 201)
      assert_includes lock(scan), ['lock_step_secret', 'lockstep:key:numbers']
    end

    test 'the choices must be the three sorted whole numbers holding the gate number, with no extra key' do
      doctor = lambda do |&edit|
        start
        take('priya_phone')
        answer('gate_number')
        answer('phone_number_request', query: phone_query('priya', 'object', 'priya_safe')) { |b| edit.call(b['requests'].first) }
        lock(scan)
      end
      assert_equal [], doctor.call { |_e| }
      [->(e) { e['numbers'] = [31, 82, 47] }, ->(e) { e['numbers'] = [31, 47] }, ->(e) { e['numbers'] = [31, 47, 47] },
       ->(e) { e['numbers'] = [31, 48, 82] }, ->(e) { e['numbers'] = [31, 47, 182] }, ->(e) { e['numbers'] = [31.0, 47, 82] },
       ->(e) { e['numbers'] = [{ 'n' => 31 }, { 'n' => 47, 'right' => true }, { 'n' => 82 }] }, ->(e) { e['right'] = 47 },
       ->(e) { e['correct'] = 1 }, ->(e) { e.delete('name') }, ->(e) { e['n'] = 21 }, ->(e) { e['n'] = 'one' },
       ->(e) { e['targetId'] = 'moira_locker' }, ->(e) { e['targetType'] = 'door' }, ->(e) { e['pcId'] = 'x'; e['numbers'] = [31, 47, 82] }].each_with_index do |edit, i|
        assert_not_empty doctor.call { |e| edit.call(e) }, "doctoring #{i}"
      end
    end

    test 'the phone answer has no numbers for a plain push lock and holds one request at most' do
      start
      answer('gate_push')
      take('moira_phone')
      answer('phone_one_request', query: phone_query('moira', 'object', 'moira_locker')) { |b| b['requests'].first['numbers'] = [31, 47, 82] }
      assert_includes lock(scan), ['lock_step_answer', 'lockstep:phone']
      assert_includes lock(scan), ['lock_step_secret', 'lockstep:key:numbers']
      start
      answer('gate_push')
      take('moira_phone')
      answer('phone_one_request', query: phone_query('moira', 'object', 'moira_locker')) { |b| b['requests'] << deep(b['requests'].first) }
      assert_includes lock(scan), ['lock_step_answer', 'lockstep:phone']
    end

    test 'a six-digit code outside the device answer is reported; the device answer of a taken device is allowed' do
      start
      take('moira_fob')
      raw('GET', 'mfa/device', device_body, query: 'item_id=moira_fob')
      answer('gate_code') { |b| b['targetId'] = 'moira_cabinet' }
      assert_equal [], lock(scan)
      # a code in a verify answer, a gate answer, a container answer
      [['POST', 'mfa/verify', { 'success' => false, 'mfaIncorrect' => true, 'code' => '482913' }],
       ['POST', 'unlock', { 'success' => false, 'code' => '482 913' }],
       ['GET', 'container/x', { 'items' => [{ 'code' => 482_913 }] }]].each do |method, path, body|
        start
        take('moira_fob')
        raw(method, path, body)
        assert_includes lock(scan), ['lock_step_secret', 'lockstep:key:code'], path
      end
      # a device not taken, a loose route, a device answer with an extra key or a nested code
      start
      raw('GET', 'mfa/device', device_body, query: 'item_id=moira_fob')
      assert_includes lock(scan), ['lock_step_secret', 'lockstep:key:code']
      start
      take('moira_fob')
      raw('GET', 'mfa/device.json', device_body, query: 'item_id=moira_fob')
      assert_includes lock(scan), ['lock_step_secret', 'lockstep:key:code']
      start
      take('moira_fob')
      raw('GET', 'mfa/device', device_body.merge('hint' => 'x'), query: 'item_id=moira_fob')
      assert_includes lock(scan), ['lock_step_secret', 'lockstep:key:code']
      start
      take('moira_fob')
      raw('GET', 'mfa/device', { 'device' => device_body }, query: 'item_id=moira_fob')
      assert_includes lock(scan), ['lock_step_secret', 'lockstep:key:code']
    end

    # ---- shapes ----------------------------------------------------------------------------------------------------

    test 'a gate answer with any key outside its list, or a value the lock does not have, is reported' do
      [->(b) { b['hint'] = 'a second step exists' }, ->(b) { b['approvesPrompts'] = 'always' }, ->(b) { b['kind'] = 'code' },
       ->(b) { b['npcId'] = 'priya' }, ->(b) { b['npcId'] = nil }, ->(b) { b['targetId'] = 'nothing_here' },
       ->(b) { b['targetType'] = 'door' }, ->(b) { b['success'] = true }, ->(b) { b.delete('npcId') }, ->(b) { b['opener'] = 'moira' },
       ->(b) { b['secondStep'] = 'yes' }].each_with_index do |edit, i|
        start
        answer('gate_push') { |b| edit.call(b) }
        assert_not_empty lock(scan), "gate doctoring #{i}"
      end
      %w[gate_push gate_door_npc].each do |name|
        start
        answer(name) { |b| b['opener'] = 'priya' }
        assert_not_empty lock(scan), name
      end
      start
      answer('gate_push', status: 403)
      assert_equal 'lock_step_answer', lock(scan).first.first
      start
      row = answer('gate_push')
      row['path'] = "#{row['path']}.json"
      assert_equal 'lock_step_answer', lock(scan).first.first
    end

    test 'a gate for a lock that has no step, or for a lock that already passed, is reported' do
      start
      answer('gate_push') { |b| b['targetId'] = 'unlisted' }
      assert_equal [['lock_step_answer', 'lockstep:gate:unplaced']], lock(scan)
      start
      answer('gate_push')
      answer('prompt_passed')
      answer('gate_push')
      assert_equal [['lock_step_answer', 'lockstep:gate:object:moira_locker']], lock(scan)
    end

    test 'a pass, refusal or phone answer with a key outside its list is reported' do
      [['prompt_passed', ->(b) { b['promptsSent'] = 3 }], ['prompt_passed', ->(b) { b['approvedBy'] = 'player' }],
       ['prompt_passed', ->(b) { b.delete('approvedBy') }], ['prompt_passed', ->(b) { b['contents'] = [deep(MEMO)] }],
       ['prompt_passed', ->(b) { b['roomData'] = {} }], ['prompt_passed', ->(b) { b['stepPassed'] = 'true' }]].each_with_index do |(name, edit), i|
        start
        answer('gate_push')
        answer(name) { |b| edit.call(b) }
        assert_not_empty lock(scan), "pass doctoring #{i}"
      end
      [['verify_wrong', ->(b) { b['attemptsLeft'] = 2 }], ['verify_wrong', ->(b) { b['message'] = 'Incorrect username or password' }],
       ['verify_wrong', ->(b) { b['hint'] = 'the code is six digits' }], ['verify_closed', ->(b) { b['lockedOut'] = true }],
       ['verify_closed', ->(b) { b['retryIn'] = '240' }], ['verify_stale_used', ->(b) { b['stale'] = 'maybe' }],
       ['prompt_too_soon', ->(b) { b['approved'] = false }], ['prompt_waiting', ->(b) { b['waiting'] = 3 }],
       ['prompt_waiting', ->(b) { b['approved'] = true }], ['approve_cancelled', ->(b) { b['approvedBy'] = 'owner' }],
       ['approve_cancelled', ->(b) { b['cancelled'] = false }], ['not_found', ->(b) { b['hint'] = 1 }],
       ['prompt_expired', ->(b) { b['expired'] = 'yes' }], ['verify_dropped', ->(b) { b['secondStep'] = true }]].each_with_index do |(name, edit), i|
        start
        answer('gate_push')
        answer(name) { |b| edit.call(b) }
        assert_not_empty lock(scan), "refusal doctoring #{i} (#{name})"
      end
    end

    test 'the refusals the fixture holds are allowed with a lock gate open' do
      %w[verify_wrong verify_stale_used verify_stale_expired verify_dropped verify_closed prompt_waiting prompt_too_soon prompt_expired
         approve_cancelled generic_refusal].each do |name|
        start
        answer('gate_push')
        answer(name)
        assert_equal [], lock(scan), name
      end
      %w[not_found no_phone no_device].each do |name|
        start
        answer('gate_push')
        answer(name, status: ANSWERS[name]['status'])
        assert_equal [], lock(scan), name
      end
    end

    test 'a refusal on the wrong route or method is reported' do
      start
      answer('verify_wrong') { |_b| }.tap { |r| r['path'] = "#{BASE}/mfa/prompt" }
      assert_equal [['lock_step_answer', 'lockstep:refusal:mfa/prompt']], lock(scan)
      start
      answer('verify_wrong') { |_b| }.tap { |r| r['path'] = "#{BASE}/mfa/verify.json" }
      assert_not_empty lock(scan)
      start
      answer('verify_wrong', status: 200)
      assert_equal [['lock_step_answer', 'lockstep:refusal:mfa/verify']], lock(scan)
    end

    test 'lock-step keys in an answer of a route no rule knows are reported' do
      [['GET', 'container/moira_locker', { 'targetId' => 'moira_locker', 'x' => 1 }], ['GET', 'scenario', { 'secondStep' => true }],
       ['POST', 'update_room', { 'stepPassed' => true, 'success' => true }], ['POST', 'unlock', { 'success' => false, 'opener' => 'moira' }],
       ['GET', 'log_rows', { 'rows' => [{ 'targetId' => 'records_room', 'opener' => 'moira' }] }],
       ['POST', 'mfa/login', { 'secondStep' => true, 'kind' => 'push', 'targetType' => 'object', 'targetId' => 'moira_locker', 'npcId' => 'moira' }]].each do |method, path, body|
        start
        raw(method, path, body)
        assert_equal ['lock_step_answer'], rules(scan), path
      end
    end

    test 'the authored secondStep object on an object or room is not a finding' do
      start
      raw('GET', 'scenario', { 'rooms' => { 'hall' => { 'objects' => [{ 'id' => 'moira_locker', 'secondStep' => { 'kind' => 'push', 'owner' => 'moira' } }] } } })
      assert_equal [], lock(scan)
    end

    test 'a pass answer in any place but the root of its route is reported' do
      start
      answer('gate_push')
      answer('prompt_passed') { |b| b.replace('wrapped' => { 'success' => true, 'stepPassed' => true, 'approvedBy' => 'owner' }) }
      assert_not_empty lock(scan)
    end

    test 'each doctored rule reports its own rule' do
      clean_run
      memo = @rows.index { |r| r['body'].is_a?(Hash) && r['body']['hasContents'] }
      @rows[memo]['body']['lockSteps'] = {}
      assert_equal ['lock_step_secret'], rules(scan)
      clean_run
      @rows[@rows.index { |r| r['path'].end_with?('unlock') && r['body']['secondStep'] }]['body']['hint'] = 'x'
      # the doctored gate is itself reported, and everything it would have earned goes unproven after it
      assert_includes rules(scan), 'lock_step_answer'
      assert_not_includes lock(scan), ['lock_step_secret', 'lockstep:key:lockSteps']
      clean_run
      @rows.delete_at(@rows.index { |r| r['body'].is_a?(Hash) && r['body']['stepPassed'] })
      assert_includes rules(scan), 'lock_step_content'
    end
  end
end
