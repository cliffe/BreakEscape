require 'test_helper'
require_relative '../../support/lock_step_routes'

module BreakEscape
  # S8c unit 15, the answer proof: every entry of the shared fixture
  # test/fixtures/files/lock_step/answers.json is produced by the real route and compared with the
  # entry (status, the exact key set at every level, equal values except at the entry's `varies`
  # paths, where the type is still checked). The client tests read the same file, so the server is
  # the authority: a difference here means the fixture is corrected, never this test loosened.
  # The subjects are the fixture's own (moira_locker, priya_safe, records_room).
  class LockStepAnswerShapesTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include LockStepRoutes

    FIXTURE = JSON.parse(File.read(File.expand_path('../../fixtures/files/lock_step/answers.json', __dir__)))

    def phone_item(npc)
      { 'type' => 'phone_friendface', 'id' => "#{npc}_phone", 'name' => "#{npc} phone", 'owner' => npc, 'takeable' => true }
    end

    def device_item(npc)
      { 'type' => 'code_device', 'id' => "#{npc}_device", 'name' => "#{npc} device", 'owner' => npc, 'takeable' => true }
    end

    def lock(id, name, kind, owner, pin)
      { 'type' => 'safe', 'id' => id, 'name' => name, 'locked' => true, 'lockType' => 'pin', 'requires' => pin,
        'secondStep' => { 'kind' => kind, 'owner' => owner },
        'contents' => [{ 'type' => 'notes1', 'id' => "#{id}_memo", 'name' => 'Memo', 'takeable' => true }] }
    end

    def scenario(locker_kind: 'push')
      { 'startRoom' => 'hall',
        'rooms' => {
          'hall' => { 'type' => 'room_office', 'connections' => { 'north' => 'records_room' },
                      'objects' => [lock('moira_locker', "Moira's locker", locker_kind, 'moira', '4817'),
                                    lock('moira_cabinet', "Moira's cabinet", 'code', 'moira', '1111'),
                                    lock('priya_safe', "Priya's safe", 'push_number_match', 'priya', '2603')],
                      'npcs' => [{ 'id' => 'moira', 'displayName' => 'Moira Hale', 'unlockable' => ['records_room'],
                                   'habits' => { 'approvesPrompts' => 'pestered', 'promptPatience' => 3 },
                                   'itemsHeld' => [phone_item('moira'), device_item('moira')] },
                                 { 'id' => 'priya', 'displayName' => 'Priya Nair',
                                   'itemsHeld' => [phone_item('priya'), device_item('priya')] }] },
          'records_room' => { 'type' => 'room_ceo', 'door_sign' => 'Records room', 'locked' => true, 'lockType' => 'pin',
                              'requires' => '9999', 'connections' => { 'south' => 'hall' },
                              'secondStep' => { 'kind' => 'push', 'owner' => 'moira' },
                              'objects' => [{ 'type' => 'notes1', 'id' => 'records_memo', 'name' => 'Records memo' }] }
        } }
    end

    setup { travel_to T0 }
    teardown { travel_back }

    def build(**opts)
      build_step_game(scenario(**opts), 'encounteredNPCs' => %w[moira priya])
    end

    def gate_locker
      unlock('object', 'moira_locker', '4817', 'pin')
    end

    def prompts(subject, count)
      out = nil
      count.times do |i|
        later(3) if i.positive?
        out = mfa('prompt', subject)
      end
      out
    end

    # Each producer builds its own game and answers [status, body]
    PRODUCERS = {
      'gate_push' => -> { build; gate_locker },
      'gate_number' => -> { build; unlock('object', 'priya_safe', '2603', 'pin') },
      'gate_code' => -> { build(locker_kind: 'code'); gate_locker },
      'gate_door_npc' => -> { build; unlock('door', 'records_room', 'moira', 'npc') },
      'open_object' => lambda {
        build
        gate_locker
        prompts('object:moira_locker', 3)
        gate_locker
      },
      'open_door' => lambda {
        build
        unlock('door', 'records_room', '9999', 'pin')
        prompts('door:records_room', 3)
        unlock('door', 'records_room', '9999', 'pin')
      },
      'first_factor_wrong' => -> { build; unlock('object', 'moira_locker', '0000', 'pin') },
      'verify_passed' => lambda {
        build(locker_kind: 'code')
        hold!('moira_device')
        gate_locker
        mfa('verify', 'object:moira_locker', code: device_code('moira_device'))
      },
      'verify_wrong' => lambda {
        build(locker_kind: 'code')
        hold!('moira_device')
        gate_locker
        right = device_code('moira_device')
        mfa('verify', 'object:moira_locker', code: right == '000000' ? '000001' : '000000')
      },
      'verify_stale_used' => lambda {
        build(locker_kind: 'code')
        hold!('moira_device')
        gate_locker
        unlock('object', 'moira_cabinet', '1111', 'pin')
        code = device_code('moira_device')
        mfa('verify', 'object:moira_cabinet', code: code)
        mfa('verify', 'object:moira_locker', code: code)
      },
      'verify_stale_expired' => lambda {
        build(locker_kind: 'code')
        hold!('moira_device')
        gate_locker
        code = device_code('moira_device')
        later(120)
        mfa('verify', 'object:moira_locker', code: code)
      },
      'verify_dropped' => lambda {
        build(locker_kind: 'code')
        hold!('moira_device')
        mfa('verify', 'object:moira_locker', code: '123456')
      },
      'verify_closed' => lambda {
        build(locker_kind: 'code')
        hold!('moira_device')
        right = device_code('moira_device')
        wrong = right == '000000' ? '000001' : '000000'
        6.times do
          gate_locker
          5.times { mfa('verify', 'object:moira_locker', code: wrong) }
        end
        gate_locker
        mfa('verify', 'object:moira_locker', code: wrong)
      },
      'prompt_waiting' => -> { build; gate_locker; mfa('prompt', 'object:moira_locker') },
      'prompt_passed' => -> { build; gate_locker; prompts('object:moira_locker', 3) },
      'prompt_too_soon' => -> { build; gate_locker; mfa('prompt', 'object:moira_locker'); mfa('prompt', 'object:moira_locker') },
      'prompt_expired' => -> { build; mfa('prompt', 'object:moira_locker') },
      'approve_passed' => lambda {
        build
        hold!('moira_phone')
        gate_locker
        mfa('prompt', 'object:moira_locker')
        mfa('approve', 'object:moira_locker')
      },
      'approve_cancelled' => lambda {
        build
        hold!('moira_phone')
        gate_locker
        mfa('prompt', 'object:moira_locker')
        mfa('approve', 'object:moira_locker', deny: true)
      },
      'approve_expired' => lambda {
        build
        hold!('moira_phone')
        mfa('approve', 'object:moira_locker')
      },
      'phone_one_request' => lambda {
        build
        hold!('moira_phone')
        gate_locker
        mfa('prompt', 'object:moira_locker')
        phone('moira', 'object:moira_locker')
      },
      'phone_number_request' => lambda {
        build
        hold!('priya_phone')
        unlock('object', 'priya_safe', '2603', 'pin')
        mfa('prompt', 'object:priya_safe')
        phone('priya', 'object:priya_safe')
      },
      'not_found' => -> { build; mfa('verify', 'object:no_such_lock', code: '123456') },
      'no_phone' => -> { build; gate_locker; phone('moira', 'object:moira_locker') },
      'no_device' => lambda {
        build(locker_kind: 'code')
        gate_locker
        mfa('verify', 'object:moira_locker', code: '123456')
      },
      'generic_refusal' => lambda {
        build
        post game_path('mfa/verify'), params: { pc_id: 'x', target_type: 'object', target_id: 'moira_locker' }, as: :json
        answer
      }
    }.freeze

    test 'every fixture entry has a producer, and every producer has an entry' do
      assert_equal FIXTURE.keys.sort, PRODUCERS.keys.sort
    end

    (PRODUCERS.keys).each do |name|
      test "the real answer for #{name} equals the fixture entry" do
        entry = FIXTURE[name]
        assert entry, "#{name} is not in answers.json"
        status, body = instance_exec(&PRODUCERS[name])
        assert_equal entry['status'], status, "#{name}: #{body}"
        diffs = body_differences(entry['body'], body, entry['varies'])
        assert_empty diffs, "#{name}: #{diffs.join('; ')} (real body #{body})"
        # a lock answer never carries the account's lockout count or a state key
        assert_empty all_keys(body) & (STATE_KEYS + %w[attemptsLeft]), name
        assert_equal 'no-store', response.headers['Cache-Control'] if entry['route'].include?('mfa')
      end
    end

    test 'the number lock gate shows one number in 10..99 and the phone shows three, sorted, with it' do
      build
      hold!('priya_phone')
      _, gate = unlock('object', 'priya_safe', '2603', 'pin')
      assert_includes 10..99, gate['number']
      assert_equal 0, phone('priya', 'object:priya_safe')[1]['requests'][0]['n']
      mfa('prompt', 'object:priya_safe')
      row = phone('priya', 'object:priya_safe')[1]['requests'][0]
      assert_equal 1, row['n']
      assert_equal 3, row['numbers'].uniq.size
      assert(row['numbers'].all? { |n| (10..99).cover?(n) })
      assert_equal row['numbers'].sort, row['numbers']
      assert_includes row['numbers'], gate['number']
    end

    test 'waiting names the holder: owner, or held_phone when the player holds the owner phone' do
      build
      gate_locker
      assert_equal 'owner', mfa('prompt', 'object:moira_locker')[1]['waiting']
      later(3)
      hold!('moira_phone')
      assert_equal 'held_phone', mfa('prompt', 'object:moira_locker')[1]['waiting']
    end

    test 'every answer of a valid lock target echoes it, and an invalid or missing target echoes nothing' do
      build
      hold!('moira_phone')
      gate_locker
      [['prompt', {}], ['approve', { number: 1 }]].each do |route, extra|
        _, body = mfa(route, 'object:moira_locker', extra)
        assert_equal %w[object moira_locker], body.values_at('targetType', 'targetId'), route
      end
      assert_equal [404, NOT_FOUND], mfa('prompt', 'object:nope')
      assert_equal [404, NOT_FOUND], mfa('verify', 'object:moira_locker', code: '123456'), 'a push lock has no code'
      post game_path('mfa/prompt'), params: { target_type: 'object' }, as: :json
      assert_equal GENERIC, response.parsed_body
    end

    test 'a verify, prompt or approve with a passed record answers expired and writes nothing' do
      build
      gate_locker
      prompts('object:moira_locker', 3)
      before = game_state.deep_dup
      %w[prompt approve].each do |route|
        assert_equal [422, expired_for('object:moira_locker')], mfa(route, 'object:moira_locker', number: 1), route
      end
      assert_equal before, game_state
      # a code lock: the same after its pass; and a verify on a push lock is not found
      assert_equal [404, NOT_FOUND], mfa('verify', 'object:moira_locker', code: '123456')
      build(locker_kind: 'code')
      hold!('moira_device')
      gate_locker
      mfa('verify', 'object:moira_locker', code: device_code('moira_device'))
      before = game_state.deep_dup
      assert_equal [422, expired_for('object:moira_locker')], mfa('verify', 'object:moira_locker', code: '123456')
      assert_equal [404, NOT_FOUND], mfa('prompt', 'object:moira_locker')
      assert_equal before, game_state
    end
  end
end
