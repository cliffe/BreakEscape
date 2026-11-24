require 'test_helper'
require_relative '../../support/keyring_login_scenario'

module BreakEscape
  # S8a unit 20 (feature A22, M2): POST /mfa/prompt and POST /mfa/approve through the real routes.
  # Pestering, awareness, the gap, a held phone, number matching, the rows, no-store, per-role
  # access and the secret guard for a number. Time is frozen.
  class MfaPushTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    KS = KeyringLoginScenario
    NS = NetworkModelScenario
    T0 = Time.zone.at(1_800_000_000)
    PHONE = { 'id' => 'sam_phone', 'type' => 'phone_friendface', 'name' => 'Sam phone', 'owner' => 'sam' }.freeze
    MFA_EVENTS = %w[mfa_challenge mfa_code_ok mfa_code_wrong mfa_code_locked mfa_expired mfa_prompt_sent
                    mfa_prompt_approved mfa_prompt_denied signin_fail signin_ok signin_refused signin_lockout].freeze
    PESTER = { 'approvesPrompts' => 'pestered', 'promptPatience' => 3 }.freeze

    def build(kind: 'push', habits: PESTER, held: [], max_attempts: 50)
      data = KS.scenario
      data['logSources'] = { 'mfa' => { 'title' => 'MFA', 'events' => MFA_EVENTS } }
      data['policies']['gate'] = { 'mfa' => kind, 'remote' => 'allowed', 'maxAttempts' => max_attempts }
      data['rooms']['desk_room']['objects'].find { |o| o['id'] == 'sam_pc' }['policy'] = 'gate'
      data['rooms']['lobby']['objects'] << PHONE.merge('takeable' => true)
      data['rooms'].each_value { |r| Array(r['npcs']).each { |n| n['habits'] = habits if n['id'] == 'sam' } }
      build_network_game({ 'inventory' => held.map { |h| { 'scenarioData' => h.dup, 'id' => h['id'], 'type' => h['type'], 'owner' => h['owner'] } } }, data)
    end

    setup do
      travel_to T0
      build
    end

    teardown do
      travel_back
      OpsLog::Current.reset
    end

    def state
      @game.reload.player_state
    end

    def first_step
      post game_path('login'), params: { pc_id: 'sam_pc', username: 'sokafor', password: NS::SAM_PASSWORD }, as: :json
      response.parsed_body
    end

    def prompt(pc = 'sam_pc', extra = {})
      post game_path('mfa/prompt'), params: { pc_id: pc }.merge(extra), as: :json
      response.parsed_body
    end

    def approve(params)
      post game_path('mfa/approve'), params: { pc_id: 'sam_pc' }.merge(params), as: :json
      response.parsed_body
    end

    def later(seconds)
      travel_to Time.zone.at(Time.current.to_i + seconds)
    end

    def events
      @game.reload.log_rows_for('mfa').flat_map { |r| [r['event']] * (r['n'] || 1) }
    end

    def hold_phone
      build(kind: 'push_number_match', held: [PHONE])
    end

    test 'pestering a low-awareness owner signs in on the third request; the count returns to 0' do
      assert_equal 'push', first_step['mfa']
      body = prompt
      assert_response :success
      assert_equal false, body['approved']
      assert_equal 1, body['promptsSent']
      assert_equal 'no-store', response.headers['Cache-Control']
      later(3)
      assert_equal 2, prompt['promptsSent']
      later(3)
      body = prompt
      assert_response :success
      assert_equal true, body['success']
      assert_equal 'owner', body['approvedBy']
      assert_equal 0, state['mfaPrompts']['sam']
      assert_equal 'password', state['sessions']['sam_pc']['via']
      assert_equal 3, events.count('mfa_prompt_sent')
      assert_equal 1, events.count('mfa_prompt_approved')
    end

    test 'a high-awareness owner is never approved; the attempt ends at the cap' do
      build(habits: { 'approvesPrompts' => 'never' })
      first_step
      body = nil
      MfaModel::MAX_PROMPTS.times do
        body = prompt
        assert_response :success
        assert_equal false, body['approved']
        later(3)
      end
      body = prompt
      assert_response :unprocessable_entity
      assert_equal true, body['expired']
      assert_nil state['sessions']['sam_pc']
      assert_equal MfaModel::MAX_PROMPTS, events.count('mfa_prompt_sent')
      assert_equal 1, events.count('mfa_expired')
    end

    test 'a second request inside the gap is tooSoon and counts nothing' do
      first_step
      prompt
      body = prompt
      assert_response :unprocessable_entity
      assert_equal true, body['tooSoon']
      assert_operator body['retryAfterS'], :>, 0
      assert_equal 1, events.count('mfa_prompt_sent')
    end

    test 'prompt with no pc_id, a target_type, a code PC or no pending record is refused' do
      first_step
      post game_path('mfa/prompt'), params: {}, as: :json
      assert_response :unprocessable_entity
      post game_path('mfa/prompt'), params: { pc_id: 'sam_pc', target_type: 'npc' }, as: :json
      assert_response :unprocessable_entity
      prompt('nowhere')
      assert_response :not_found
      build(kind: 'code')
      first_step
      prompt
      assert_response :unprocessable_entity
      assert_not_includes events, 'mfa_prompt_sent'
    end

    def lock_out_account
      3.times do
        post game_path('login'), params: { pc_id: 'sam_pc', username: 'sokafor', password: 'wrong-password' }, as: :json
      end
      assert_includes state['loginLockouts'], 'sam_pc|sokafor'
    end

    test 'R1-S1: a locked-out account is not signed in by pestering the owner' do
      build(max_attempts: 3)
      first_step
      lock_out_account
      3.times do
        later(3)
        prompt
        assert_response :unprocessable_entity
      end
      assert_nil state['sessions']['sam_pc']
      assert_includes state['loginLockouts'], 'sam_pc|sokafor'
    end

    test 'R1-S1: a locked-out account is not signed in by a held phone' do
      build(kind: 'push_number_match', held: [PHONE], max_attempts: 3)
      right = first_step['number']
      lock_out_account
      body = approve(number: right)
      assert_response :unprocessable_entity
      assert_not_equal true, body['success']
      assert_nil state['sessions']['sam_pc']
    end

    test 'R1-S5: approve with no usable number answers 422 and leaves the step' do
      build(kind: 'push_number_match', held: [PHONE])
      first_step
      [{}, { number: 12.5 }, { number: 'abc' }, { number: [1] }].each do |extra|
        body = approve(extra)
        assert_response :unprocessable_entity
        assert_nil body['cancelled'], extra.inspect
        assert_not_nil state['mfaPending']['sam_pc'], extra.inspect
      end
      assert_equal 0, events.count('mfa_prompt_denied')
    end

    test 'R1-S6: target_id alone is refused at prompt, approve and phone' do
      first_step
      post game_path('mfa/prompt'), params: { pc_id: 'sam_pc', target_id: 'x' }, as: :json
      assert_response :unprocessable_entity
      assert_equal 0, events.count('mfa_prompt_sent')
      post game_path('mfa/approve'), params: { pc_id: 'sam_pc', target_id: 'x' }, as: :json
      assert_response :unprocessable_entity
    end

    test 'a held phone approves and the session opens' do
      build(held: [PHONE])
      first_step
      body = approve({})
      assert_response :success
      assert_equal true, body['success']
      assert_equal 'player', body['approvedBy']
      assert_equal 'no-store', response.headers['Cache-Control']
      assert_equal 'held_phone', @game.reload.log_rows_for('mfa').last['detail']['approver']
    end

    test 'approve is refused without the phone and changes nothing' do
      first_step
      approve({})
      assert_response :forbidden
      assert_equal 'no such phone', response.parsed_body['error']
      assert_nil state['sessions']['sam_pc']
      assert_not_nil state['mfaPending']['sam_pc']
      assert_equal %w[mfa_challenge], events
    end

    test 'number matching: the owner never approves, a wrong number cancels, the right one signs in' do
      hold_phone
      build(kind: 'push_number_match', habits: { 'approvesPrompts' => 'always' }, held: [PHONE])
      right = first_step['number']
      assert_kind_of Integer, right
      assert_equal false, prompt['approved']
      assert_nil state['sessions']['sam_pc']
      body = approve(number: right)
      assert_response :success
      assert_equal 'player', body['approvedBy']
      build(kind: 'push_number_match', held: [PHONE])
      right = first_step['number']
      body = approve(number: right + 1)
      assert_response :unprocessable_entity
      assert_equal true, body['cancelled']
      assert_nil state['mfaPending']['sam_pc']
      assert_equal 1, events.count('mfa_prompt_denied')
      first_step
      assert_equal true, approve(deny: true)['cancelled']
      assert_equal 2, events.count('mfa_prompt_denied')
    end

    test 'per-role access: the owner is allowed the new policy methods, another user none' do
      owner = GamePolicy.new(break_escape_demo_users(:test_user), @game)
      other = GamePolicy.new(break_escape_demo_users(:other_user), @game)
      %i[mfa_prompt? mfa_phone? mfa_approve?].each do |action|
        assert owner.public_send(action), action
        assert_not other.public_send(action), action
      end
    end

    test 'the secret guard sees a number; no row these routes write holds one' do
      build(kind: 'push_number_match', held: [PHONE])
      right = first_step['number']
      OpsLog.note_issued_secret(right.to_s)
      assert OpsLog.find_secret_hit(OpsLog.compared_secrets(@game), { 'detail' => { 'v' => right.to_s } }),
             'the guard matches a row holding the number just issued'
      prompt
      approve(number: right)
      @game.reload.log_rows_for('mfa').each do |row|
        assert_nil OpsLog.row_secret_hit(@game, row.slice('as', 'where', 'detail')), row.inspect
      end
    end
  end
end
