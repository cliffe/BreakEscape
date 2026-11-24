require 'test_helper'
require 'minitest/mock'
require_relative '../../support/ops_log_assertions'

module BreakEscape
  # S8c unit 13: the gate and the lock callers of /mfa/*, at model level with time frozen.
  class LockStepGateTest < ActiveSupport::TestCase
    include OpsLogAssertions

    T0 = Time.zone.at(1_800_000_000)
    MFA_EVENTS = %w[mfa_challenge mfa_code_ok mfa_code_wrong mfa_code_locked mfa_expired mfa_prompt_sent
                    mfa_prompt_approved mfa_prompt_denied badge_swipe].freeze
    PHONE = { 'id' => 'amy_phone', 'type' => 'phone_friendface', 'owner' => 'amy' }.freeze
    DEVICE = { 'id' => 'bob_dev', 'type' => 'code_device', 'owner' => 'bob' }.freeze
    GATE_KEYS = %i[success secondStep kind targetType targetId npcId].freeze

    def lock(id, kind, owner, extra = {})
      { 'type' => 'safe', 'id' => id, 'name' => "Lock #{id}", 'locked' => true, 'lockType' => 'pin',
        'requires' => '4821', 'secondStep' => { 'kind' => kind, 'owner' => owner },
        'contents' => [{ 'type' => 'notes', 'id' => "#{id}_doc", 'name' => 'Doc' }] }.merge(extra)
    end

    def scenario
      inner = lock('inner', 'push', 'amy', 'requires' => '7777')
      outer = lock('outer', 'push', 'amy')
      outer['contents'] << inner
      { 'startRoom' => 'hall',
        'logSources' => { 'mfa' => { 'title' => 'MFA', 'events' => MFA_EVENTS } },
        'rooms' => {
          'hall' => { 'type' => 'room_office', 'connections' => { 'north' => 'vault', 'east' => 'cell' },
                      'npcs' => [{ 'id' => 'amy', 'displayName' => 'Amy',
                                   'habits' => { 'approvesPrompts' => 'pestered', 'promptPatience' => 3 } },
                                 { 'id' => 'bob', 'displayName' => 'Bob' }],
                      'objects' => [lock('locker', 'push', 'amy'), lock('safe', 'push_number_match', 'amy'),
                                    lock('cab', 'code', 'bob'), outer,
                                    { 'type' => 'notes', 'id' => 'plain', 'name' => 'Plain', 'locked' => true,
                                      'lockType' => 'pin', 'requires' => '1' },
                                    PHONE.merge('takeable' => true, 'name' => 'Amy phone'),
                                    DEVICE.merge('takeable' => true, 'name' => 'Bob device')] },
          'vault' => { 'type' => 'room_office', 'locked' => true, 'lockType' => 'pin', 'requires' => '9999',
                       'name' => 'The vault', 'secondStep' => { 'kind' => 'push', 'owner' => 'amy' } },
          'cell' => { 'type' => 'room_office', 'locked' => true, 'lockType' => 'pin', 'requires' => '8888',
                      'secondStep' => { 'kind' => 'code', 'owner' => 'bob' } } } }
    end

    def build_game
      Game.create!(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                   scenario_data: scenario,
                   player_state: { 'currentRoom' => 'hall', 'unlockedRooms' => ['hall'], 'inventory' => [] })
    end

    setup do
      travel_to T0
      @g = build_game
    end

    teardown { travel_back }

    def later(seconds)
      travel_to Time.zone.at(Time.current.to_i + seconds)
    end

    def hold_phone
      @g.player_state['inventory'] = [PHONE.dup]
    end

    def hold_device
      @g.player_state['inventory'] = [DEVICE.dup]
    end

    def resolved(id)
      @g.resolve_unlock_target(id)
    end

    def gate(id, method = 'pin')
      @g.lock_step_gate('object', id, method, resolved: resolved(id))
    end

    def events
      @g.log_rows_for('mfa').flat_map { |r| [r['event']] * (r['n'] || 1) }
    end

    def record(key)
      @g.player_state['lockSteps'][key]
    end

    def code_for(device_id)
      @g.code_device_code(device_id)
    end

    def reload!
      @g.save!
      @g = Game.find(@g.id)
    end

    # ---- the gate: nil cases ----

    test 'the gate answers nil for an ungated target, an unknown one and a bad type' do
      assert_nil @g.lock_step_gate('object', 'plain', 'pin', resolved: resolved('plain'))
      assert_nil @g.lock_step_gate('object', 'nope', 'pin')
      assert_nil @g.lock_step_gate('pc', 'locker', 'pin')
      assert_nil @g.lock_step_gate('door', 'hall', 'pin')
      assert_empty events
    end

    test 'the gate answers nil for an object that is open and for an unlocked door, with no write' do
      @g.player_state['unlockedObjects'] = ['locker']
      @g.player_state['unlockedRooms'] << 'vault'
      assert_nil gate('locker')
      assert_nil @g.lock_step_gate('door', 'vault', 'pin')
      assert_empty events
      assert_empty @g.lock_steps_map
    end

    test 'a name or a client id resolves, but only to the object with an id; a posted name never counts as open' do
      assert_equal 'locker', @g.lock_step_gate('object', 'Lock locker', 'pin', resolved: @g.resolve_unlock_target('Lock locker'))[:targetId]
      @g.player_state['unlockedObjects'] = ['Lock locker']
      assert gate('locker')
    end

    test 'a passed record means nil, and it survives 300 seconds and a reload' do
      gate('locker')
      @g.prompt_lock!('object', 'locker')
      later(3)
      @g.prompt_lock!('object', 'locker')
      later(3)
      assert_equal true, @g.prompt_lock!('object', 'locker').first[:success]
      assert_equal true, record('object:locker')['passed']
      later(400)
      reload!
      assert_equal true, record('object:locker')['passed']
      assert_nil gate('locker')
      assert_equal 1, events.count('mfa_challenge')
    end

    test 'a flag reward the server accepts skips the step and the npc method does not' do
      @g.stub(:flag_reward_unlocks_object?, true) do
        assert_nil gate('locker', 'flag_reward')
      end
      @g.stub(:flag_reward_unlocks_object?, false) do
        assert gate('locker', 'flag_reward')
      end
      @g.stub(:flag_reward_unlocks_object?, true) do
        assert gate('safe', 'npc')
      end
    end

    # ---- the gate: answers ----

    test 'each kind answers section 4.3 and nothing else' do
      push = gate('locker')
      assert_equal GATE_KEYS, push.keys
      assert_equal({ success: false, secondStep: true, kind: 'push', targetType: 'object', targetId: 'locker', npcId: 'amy' }, push)
      number = gate('safe')
      assert_equal GATE_KEYS + [:number], number.keys
      assert_equal 'push_number_match', number[:kind]
      assert_includes 10..99, number[:number]
      code = gate('cab')
      assert_equal GATE_KEYS, code.keys
      assert_equal %w[code bob], [code[:kind], code[:npcId]]
      refute_includes [push, code].flat_map(&:keys), :number
    end

    test 'the number is the model right number and the other two never appear in the gate' do
      body = gate('safe')
      rec = record('object:safe')
      numbers = MfaModel.numbers(@g.send(:mfa_key), @g.id, 'object:safe', 'amy', rec['nonce'])
      assert_equal numbers[:right], body[:number]
      assert_not_includes body.values, numbers[:wrong].first
    end

    test 'a door answers with opener only for the npc method, and only that notes the grant' do
      body = @g.lock_step_gate('door', 'vault', 'pin')
      assert_equal GATE_KEYS, body.keys
      assert_equal %w[door vault], [body[:targetType], body[:targetId]]
      assert_nil @g.npc_step_opener_for('vault')
      cell = @g.lock_step_gate('door', 'cell', 'npc')
      assert_equal 'bob', cell[:opener]
      assert_equal 'bob', @g.reload.player_state['npcStepGrants']['door:cell']
      assert_equal 'bob', @g.npc_step_opener_for('cell')
      assert_nil @g.npc_step_opener_for('vault')
    end

    # R1-SERVER8: the gate names the opener it is given (the NPC whose `npc` factor passed), once
    test 'a door gate names the opener it is given, notes that grant, and a repeat writes nothing more' do
      body = @g.lock_step_gate('door', 'cell', 'npc', opener: 'gordon')
      assert_equal %w[bob gordon], [body[:npcId], body[:opener]]
      assert_equal 'gordon', @g.reload.player_state['npcStepGrants']['door:cell']
      before = Marshal.load(Marshal.dump(@g.player_state))
      later(5)
      assert_equal body, @g.lock_step_gate('door', 'cell', 'npc', opener: 'gordon')
      assert_equal before, @g.player_state, 'a repeat gate on the live record saves no grant'
      # no opener given: the owner opens, as before
      other = @g.lock_step_gate('door', 'vault', 'npc')
      assert_equal 'amy', other[:opener]
    end

    test 'a repeat against a live record answers the same and writes nothing' do
      first = gate('safe')
      @g.save!
      before = Marshal.load(Marshal.dump(@g.player_state))
      later(5)
      assert_equal first, gate('safe')
      assert_equal first, gate('safe', 'password')
      assert_equal before.except('opsLog'), @g.player_state.except('opsLog')
      assert_equal before['opsLog'], @g.player_state['opsLog']
      assert_equal %w[mfa_challenge], events
    end

    test 'the challenge row names the owner, the lock and the method, never a secret' do
      gate('locker', 'pin')
      row = @g.log_rows_for('mfa').first
      assert_equal 'mfa_challenge', row['event']
      assert_equal({ 'npc' => 'amy' }, row['as'])
      assert_equal({ 'kind' => 'object', 'id' => 'locker' }, row['where'])
      assert_equal({ 'method' => 'pin' }, row['detail'])
      gate('cab', 'lockpick')
      gate('cell', 'unlocked') rescue nil
      assert_ops_log_holds_no_secret(@g)
    end

    test 'an unknown first-factor word writes no method detail' do
      @g.lock_step_gate('door', 'vault', 'something_else')
      assert_nil @g.log_rows_for('mfa').first['detail']
    end

    test 'a step with no owner answers the gate, keeps no record and every action is refused' do
      data = scenario
      data['rooms']['hall']['objects'].find { |o| o['id'] == 'locker' }['secondStep'].delete('owner')
      g = Game.create!(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                       scenario_data: data, player_state: { 'currentRoom' => 'hall', 'unlockedRooms' => ['hall'], 'inventory' => [] })
      body = g.lock_step_gate('object', 'locker', 'pin', resolved: g.resolve_unlock_target('locker'))
      assert_equal '', body[:npcId]
      assert_empty g.lock_steps_map
      assert_equal :not_found, g.prompt_lock!('object', 'locker')
    end

    test 'no gate for a lock below a closed gated container, with or without resolved; one once it is open' do
      assert_nil gate('inner')
      assert_nil @g.lock_step_gate('object', 'inner', 'pin')
      assert_empty events
      @g.player_state['unlockedObjects'] = ['outer']
      assert_equal 'inner', gate('inner')[:targetId]
    end

    test 'a gated object in an account profile or a share is gated like any other' do
      data = scenario
      data['accountProfiles'] = { 'p1' => { 'for' => { 'roles' => ['staff'] },
                                            'contents' => [lock('profdir', 'push', 'amy')] } }
      data['resources'] = { 'share1' => { 'network' => 'n1', 'contents' => [lock('sharedir', 'push', 'amy')] } }
      g = Game.create!(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                       scenario_data: data, player_state: { 'currentRoom' => 'hall', 'unlockedRooms' => ['hall'], 'inventory' => [] })
      %w[profdir sharedir].each do |id|
        body = g.lock_step_gate('object', id, 'pin', resolved: g.resolve_unlock_target(id))
        assert_equal [id, 'amy'], [body[:targetId], body[:npcId]]
        assert_equal 'mfa_challenge', g.log_rows_for('mfa').last['event']
      end
    end

    # ---- push ----

    test 'push: patience is shared with sign-in, then the owner approves and the count resets' do
      gate('locker')
      body, status = @g.prompt_lock!('object', 'locker')
      assert_equal :ok, status
      assert_equal({ success: false, approved: false, promptsSent: 1, waiting: 'owner' }, body)
      later(3)
      body, = @g.prompt_lock!('object', 'locker')
      assert_equal 2, body[:promptsSent]
      later(3)
      body, status = @g.prompt_lock!('object', 'locker')
      assert_equal [:ok, { success: true, stepPassed: true, approvedBy: 'owner' }], [status, body]
      assert_equal 0, @g.player_state['mfaPrompts']['amy']
      assert_equal %w[mfa_challenge mfa_prompt_sent mfa_prompt_sent mfa_prompt_sent mfa_prompt_approved], events
      assert_equal 'owner', @g.log_rows_for('mfa').last['detail']['approver']
    end

    test 'the owner patience count carries over from sign-in prompts' do
      @g.player_state['mfaPrompts'] = { 'amy' => 2 }
      gate('locker')
      assert_equal true, @g.prompt_lock!('object', 'locker').first[:success]
    end

    test 'a too-soon request is a 422 with the wait and writes no row' do
      gate('locker')
      @g.prompt_lock!('object', 'locker')
      rows = events.size
      body, status = @g.prompt_lock!('object', 'locker')
      assert_equal :unprocessable_entity, status
      assert_equal({ success: false, tooSoon: true, retryAfterS: 2 }, body)
      assert_equal rows, events.size
    end

    test 'the twentieth prompt drops the record and writes an expired row' do
      gate('locker')
      record('object:locker')['n'] = 20
      body, status = @g.prompt_lock!('object', 'locker')
      assert_equal [:unprocessable_entity, { success: false, expired: true }], [status, body]
      assert_nil record('object:locker')
      assert_equal 1, events.count('mfa_expired')
    end

    test 'a prompt with no live record is the expired answer and writes no row' do
      assert_equal [{ success: false, expired: true }, :unprocessable_entity], @g.prompt_lock!('object', 'locker')
      gate('locker')
      later(301)
      assert_equal [{ success: false, expired: true }, :unprocessable_entity], @g.prompt_lock!('object', 'locker')
      assert_equal %w[mfa_challenge], events
    end

    test 'a push step is answered on the held phone and the owner is not asked' do
      gate('locker')
      hold_phone
      body, = @g.prompt_lock!('object', 'locker')
      assert_equal 'held_phone', body[:waiting]
      later(3)
      @g.prompt_lock!('object', 'locker')
      later(3)
      body, = @g.prompt_lock!('object', 'locker')
      assert_equal false, body[:success]
      assert_equal 3, body[:promptsSent]
      assert_equal 0, @g.player_state['mfaPrompts'].fetch('amy', 0)
    end

    test 'approve: a held phone approves; no phone is :no_phone; the count of waiting resets' do
      gate('locker')
      @g.prompt_lock!('object', 'locker')
      assert_equal :no_phone, @g.approve_lock!('object', 'locker')
      hold_phone
      body, status = @g.approve_lock!('object', 'locker')
      assert_equal [:ok, { success: true, stepPassed: true, approvedBy: 'player' }], [status, body]
      assert_equal 'held_phone', @g.log_rows_for('mfa').last['detail']['approver']
      assert_equal 0, @g.player_state['mfaPrompts']['amy']
      assert_not_includes @g.log_rows_for('mfa').flat_map { |r| r['detail']&.values.to_a }, 'own_phone'
    end

    test 'approve: a deny cancels, drops the record and counts nothing' do
      gate('locker')
      hold_phone
      body, status = @g.approve_lock!('object', 'locker', deny: true)
      assert_equal [:unprocessable_entity, { success: false, cancelled: true }], [status, body]
      assert_nil record('object:locker')
      assert_equal 'mfa_prompt_denied', @g.log_rows_for('mfa').last['event']
      assert_equal 'denied', @g.log_rows_for('mfa').last['result']
    end

    test 'number matching: the owner never approves, however often the player pesters' do
      gate('safe')
      6.times do
        later(3)
        body, = @g.prompt_lock!('object', 'safe')
        assert_equal false, body[:success] || false
        assert_equal 'owner', body[:waiting]
      end
      assert_not_equal true, record('object:safe')['passed']
    end

    test 'number matching: a held phone with the right number passes' do
      gate('safe')
      hold_phone
      right = MfaModel.numbers(@g.send(:mfa_key), @g.id, 'object:safe', 'amy', record('object:safe')['nonce'])[:right]
      body, status = @g.approve_lock!('object', 'safe', number: right)
      assert_equal [:ok, 'player'], [status, body[:approvedBy]]
      assert_equal true, record('object:safe')['passed']
    end

    test 'number matching: a wrong number cancels, a missing number is refused and keeps the step' do
      gate('safe')
      hold_phone
      body, status = @g.approve_lock!('object', 'safe')
      assert_equal :unprocessable_entity, status
      assert_equal Game::LOGIN_INCORRECT, body[:message]
      assert record('object:safe')
      numbers = MfaModel.numbers(@g.send(:mfa_key), @g.id, 'object:safe', 'amy', record('object:safe')['nonce'])
      body, status = @g.approve_lock!('object', 'safe', number: numbers[:wrong].first)
      assert_equal [:unprocessable_entity, { success: false, cancelled: true }], [status, body]
      assert_nil record('object:safe')
      assert_equal 1, events.count('mfa_prompt_denied')
    end

    # ---- code ----

    test 'code: the right code passes and the code is not in any row or answer' do
      gate('cab')
      hold_device
      code = code_for('bob_dev')
      body, status = @g.verify_lock_code!('object', 'cab', code)
      assert_equal [:ok, { success: true, stepPassed: true }], [status, body]
      assert_equal true, record('object:cab')['passed']
      assert_equal %w[mfa_challenge mfa_code_ok], events
      assert_ops_log_holds_no_secret(@g)
    end

    test 'code: without the held device the answer is :no_device and nothing is counted' do
      gate('cab')
      assert_equal :no_device, @g.verify_lock_code!('object', 'cab', code_for('bob_dev'))
      assert_equal 0, record('object:cab')['tries']
    end

    test 'code: a wrong code, a malformed one, a used one and the fifth wrong try' do
      gate('cab')
      hold_device
      code = code_for('bob_dev')
      wrong = code == '000000' ? '000001' : '000000'
      assert_equal [{ success: false, mfaIncorrect: true }, :unprocessable_entity], @g.verify_lock_code!('object', 'cab', wrong)
      assert_equal [{ success: false, mfaIncorrect: true }, :unprocessable_entity], @g.verify_lock_code!('object', 'cab', 'abc')
      assert_equal 1, record('object:cab')['tries']
      3.times { @g.verify_lock_code!('object', 'cab', wrong) }
      body, status = @g.verify_lock_code!('object', 'cab', wrong)
      assert_equal [:unprocessable_entity, { success: false, expired: true }], [status, body]
      assert_nil record('object:cab')
      assert_equal 5, events.count('mfa_code_wrong')
      assert_equal 1, events.count('mfa_expired')
      assert_equal [{ success: false, expired: true }, :unprocessable_entity], @g.verify_lock_code!('object', 'cab', code)
    end

    test 'code: a code from the last minutes is stale, and a used code is stale used' do
      gate('cab')
      hold_device
      old = code_for('bob_dev')
      later(150)
      gate('cab')
      body, status = @g.verify_lock_code!('object', 'cab', old)
      assert_equal [:unprocessable_entity, { success: false, stale: 'expired' }], [status, body]
      assert_equal 0, events.count('mfa_code_wrong')
    end

    test 'code: no body ever carries attemptsLeft' do
      gate('cab')
      hold_device
      body, = @g.verify_lock_code!('object', 'cab', '111111')
      assert_not body.key?(:attemptsLeft)
    end

    test 'code: the thirty-code closure is the owner account total, shared with sign-in' do
      gate('cab')
      hold_device
      @g.player_state['mfaAccounts'] = { 'bob' => { 'wrong' => 29 } }
      body, status = @g.verify_lock_code!('object', 'cab', '111111')
      assert_equal :unprocessable_entity, status
      assert_equal 1, events.count('mfa_code_locked')
      assert_equal 300, @g.player_state['mfaAccounts']['bob']['closedAt'] ? 300 : 0
      body, status = @g.verify_lock_code!('object', 'cab', code_for('bob_dev'))
      assert_equal :unprocessable_entity, status
      assert_equal true, body[:codeLocked]
      assert_includes 1..300, body[:retryIn]
      assert_not body.key?(:attemptsLeft)
      assert_not_equal true, record('object:cab')['passed']
    end

    test 'code: verify on a push lock, or a code that is not live, is refused' do
      gate('locker')
      hold_device
      assert_equal :not_found, @g.verify_lock_code!('object', 'locker', '123456')
      assert_equal :not_found, @g.prompt_lock!('object', 'cab')
      assert_equal :not_found, @g.approve_lock!('object', 'cab')
    end

    test 'code: a door with a code step passes the same way' do
      @g.lock_step_gate('door', 'cell', 'pin')
      hold_device
      body, status = @g.verify_lock_code!('door', 'cell', code_for('bob_dev'))
      assert_equal [:ok, true], [status, body[:success]]
      assert_nil @g.lock_step_gate('door', 'cell', 'pin')
      assert_equal 'door', @g.log_rows_for('mfa').last['where']['kind']
    end

    # ---- refusals ----

    test 'unknown, ungated, open and below-a-closed-step targets are all :not_found' do
      gate('outer')
      assert_equal :not_found, @g.prompt_lock!('object', 'plain')
      assert_equal :not_found, @g.prompt_lock!('object', 'nope')
      assert_equal :not_found, @g.prompt_lock!('object', 'Lock outer')
      assert_equal :not_found, @g.prompt_lock!('pc', 'outer')
      assert_equal :not_found, @g.prompt_lock!('object', 'inner')
      assert_equal :not_found, @g.verify_lock_code!('door', 'hall', '123456')
      @g.player_state['unlockedObjects'] = ['outer']
      assert_equal :not_found, @g.prompt_lock!('object', 'outer')
      assert_kind_of Array, @g.prompt_lock!('object', 'inner')
    end

    test 'a carried lock that has left the player is :not_found' do
      data = scenario
      data['rooms']['hall']['npcs'].first['itemsHeld'] = [lock('bag', 'push', 'amy')]
      g = Game.create!(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                       scenario_data: data, player_state: { 'currentRoom' => 'hall', 'unlockedRooms' => ['hall'], 'inventory' => [] })
      g.player_state['inventory'] = [lock('bag', 'push', 'amy').except('contents')]
      assert_kind_of Array, g.prompt_lock!('object', 'bag') if g.lock_step_gate('object', 'bag', 'pin')
      g.player_state['inventory'] = []
      assert_equal :not_found, g.prompt_lock!('object', 'bag')
    end

    # ---- the phone ----

    test 'the phone answer: not held is :no_phone; held lists the one request, sorted, with the gate number' do
      gate = gate('safe')
      assert_equal :no_phone, @g.lock_phone_answer('object', 'safe', 'amy')
      hold_phone
      answer = @g.lock_phone_answer('object', 'safe', 'amy')
      assert_equal [:requests], answer.keys
      assert_equal 1, answer[:requests].size
      req = answer[:requests].first
      assert_equal %i[targetType targetId name n numbers], req.keys
      assert_equal %w[object safe], [req[:targetType], req[:targetId]]
      assert_equal 'Lock safe', req[:name]
      assert_equal 0, req[:n]
      assert_equal req[:numbers].sort, req[:numbers]
      assert_equal 3, req[:numbers].uniq.size
      assert req[:numbers].all? { |n| (10..99).cover?(n) }
      assert_includes req[:numbers], gate[:number]
    end

    test 'the phone answer for a plain push has no numbers, counts prompts, and keyword npc_id works' do
      gate('locker')
      hold_phone
      @g.prompt_lock!('object', 'locker')
      req = @g.lock_phone_answer('object', 'locker', npc_id: 'amy')[:requests].first
      assert_equal %i[targetType targetId name n], req.keys
      assert_equal 1, req[:n]
    end

    test 'the phone answer is empty for a lock of another owner, an open lock, a passed one and a door' do
      gate('locker')
      gate('cab')
      hold_phone
      assert_equal({ requests: [] }, @g.lock_phone_answer('object', 'cab', 'amy'))
      assert_equal({ requests: [] }, @g.lock_phone_answer('object', 'plain', 'amy'))
      assert_equal({ requests: [] }, @g.lock_phone_answer('object', 'nope', 'amy'))
      @g.approve_lock!('object', 'locker')
      assert_equal({ requests: [] }, @g.lock_phone_answer('object', 'locker', 'amy'))
      @g.lock_step_gate('door', 'vault', 'pin')
      door = @g.lock_phone_answer('door', 'vault', 'amy')[:requests].first
      assert_equal %w[door vault The\ vault], [door[:targetType], door[:targetId], door[:name]]
    end

    test 'the phone answer writes nothing and a code step has no request' do
      gate('cab')
      hold_phone
      @g.save!
      before = Marshal.load(Marshal.dump(@g.player_state))
      assert_equal({ requests: [] }, @g.lock_phone_answer('object', 'cab', 'amy'))
      assert_equal before, @g.player_state
    end

    # ---- rows ----

    test 'rows: none for a repeat, a 404, a 403 or a too-soon request; the full set for a number-matching pass' do
      gate('safe')
      gate('safe')
      @g.prompt_lock!('object', 'nope')
      @g.approve_lock!('object', 'safe')
      @g.prompt_lock!('object', 'safe')
      @g.prompt_lock!('object', 'safe')
      assert_equal %w[mfa_challenge mfa_prompt_sent], events
      hold_phone
      numbers = MfaModel.numbers(@g.send(:mfa_key), @g.id, 'object:safe', 'amy', record('object:safe')['nonce'])
      @g.approve_lock!('object', 'safe', number: numbers[:right])
      assert_equal %w[mfa_challenge mfa_prompt_sent mfa_prompt_approved], events
      assert_ops_log_holds_no_secret(@g)
    end

    test 'the secret guard: the code, the numbers and a lock password are all compared secrets' do
      gate('safe')
      hold_device
      code = code_for('bob_dev')
      secrets = OpsLog.compared_secrets(@g)
      assert_includes secrets, code
      assert_includes secrets, MfaModel.numbers(@g.send(:mfa_key), @g.id, 'object:safe', 'amy', record('object:safe')['nonce'])[:right].to_s
      assert OpsLog.find_secret_hit(secrets, 'as' => { 'npc' => code })
      assert_nil OpsLog.find_secret_hit(secrets, @g.log_rows_for('mfa').first)
    end

    # ---- the one line in MfaSignIn ----

    test 'mfa_declared? is true when a code lock step exists and false with push steps only' do
      assert @g.send(:mfa_declared?)
      data = scenario
      data['rooms']['hall']['objects'].delete_if { |o| o['id'] == 'cab' }
      data['rooms'].delete('cell')
      g = Game.create!(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                       scenario_data: data, player_state: { 'currentRoom' => 'hall', 'unlockedRooms' => ['hall'], 'inventory' => [] })
      assert_not g.send(:mfa_declared?)
    end

    test 'mfa_device_answer works in a scenario whose only second steps are locks' do
      hold_device
      answer = @g.mfa_device_answer('bob_dev')
      assert_equal 'bob', answer[:npcId]
      assert_equal code_for('bob_dev'), answer[:code]
    end
  end
end
