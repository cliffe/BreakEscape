# frozen_string_literal: true

require 'test_helper'
require_relative '../../support/helpdesk_reenrol_scenario'
require_relative '../../support/helpdesk_answer_shapes'

module BreakEscape
  # S8b unit 18: the own forms of the controller once a desk has re-enrolled an account's second
  # step onto the player's own phone, through the real routes with time frozen: GET mfa/device?npc_id=,
  # GET mfa/phone?own=1 and POST mfa/approve (own=1). The old phone and the old device no longer pass.
  class HelpdeskReenrolTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests
    include HelpdeskAnswerShapes

    HR = HelpdeskReenrolScenario
    HS = HelpdeskRouteScenario
    NS = NetworkModelScenario
    T0 = Time.zone.at(1_800_000_000)

    def build(kind: 'code', reset: true, held: [])
      state = { 'encounteredNPCs' => %w[ria sam lena ian jake], 'inventory' => held.map { |h| HR.held(h) } }
      state = state.merge(HR::RESET_SAM.deep_dup) if reset
      build_network_game(state, HR.scenario(kind: kind))
    end

    setup do
      travel_to T0
      build
    end

    teardown { travel_back }

    def state
      @game.reload.player_state
    end

    def first_step
      post game_path('login'), params: { pc_id: 'sam_pc', username: 'sokafor', password: NS::SAM_PASSWORD }, as: :json
      response.parsed_body
    end

    def own_code
      @game.reload.code_device_code('own:sam')
    end

    def old_code
      @game.reload.code_device_code('sam_fob')
    end

    def verify(typed)
      post game_path('mfa/verify'), params: { pc_id: 'sam_pc', code: typed }, as: :json
      response.parsed_body
    end

    def approve(extra = {})
      post game_path('mfa/approve'), params: { pc_id: 'sam_pc' }.merge(extra), as: :json
      response.parsed_body
    end

    def session?
      !state.dig('sessions', 'sam_pc').nil?
    end

    def pending
      state['mfaPending']
    end

    def rows
      @game.reload.log_rows_for('desk')
    end

    # ---- GET mfa/device

    test 'npc_id reads the own phone of a re-enrolled account, no-store, and matches the shared shape' do
      get game_path('mfa/device'), params: { npc_id: 'sam' }
      assert_response :success
      assert_equal 'no-store', response.headers['Cache-Control']
      assert_answer_shape('device.own', response)
      assert_equal own_code, response.parsed_body['code']
      assert_equal 'own:sam', response.parsed_body['deviceId']
    end

    test 'an account no desk re-enrolled and an unknown id are the same 403; a missing id and both forms are a 404' do
      get game_path('mfa/device'), params: { npc_id: 'jake' }
      assert_answer_shape('device.no_device', response)
      get game_path('mfa/device'), params: { npc_id: 'nobody' }
      assert_answer_shape('device.no_device', response)
      get game_path('mfa/device')
      assert_response :not_found
      get game_path('mfa/device'), params: { npc_id: 'sam', item_id: 'sam_fob' }
      assert_response :not_found
      build(reset: false)
      get game_path('mfa/device'), params: { npc_id: 'sam' }
      assert_answer_shape('device.no_device', response)
      assert_equal 'no-store', response.headers['Cache-Control']
    end

    test 'the old device of a re-enrolled account shows no code and says it is not enrolled' do
      build(held: [HR::FOB])
      get game_path('mfa/device'), params: { item_id: 'sam_fob' }
      assert_answer_shape('device.unenrolled', response)
      assert_not response.body.include?(old_code)
    end

    test 'a code the sign-in has used is shown as used' do
      first_step
      assert_equal true, verify(own_code)['success']
      get game_path('mfa/device'), params: { npc_id: 'sam' }
      assert_answer_shape('device.own_used', response)
    end

    # ---- code sign-in

    test 'the own code signs in at a code PC; the old device code is a wrong code' do
      build(held: [HR::FOB])
      body = first_step
      assert_answer_shape('login.mfa_required_own_code', Struct.new(:status, :parsed_body).new(200, body))
      wrong = verify(old_code)
      assert_equal true, wrong['mfaIncorrect']
      assert_not session?
      passed = verify(own_code)
      assert_equal true, passed['success']
      assert session?
    end

    test 'a second-factor grant reopens a closed code step at once and leaves lockouts alone' do
      build(reset: false)
      post game_path('login'), params: { pc_id: 'sam_pc', username: 'sokafor', password: NS::SAM_PASSWORD }, as: :json
      closed = nil
      10.times do
        closed = verify('000000')
        break if closed['codeLocked'] || closed['closed']
      end
      failures = state['loginFailures'].deep_dup
      locked = state['loginLockouts'].deep_dup
      post game_path('helpdesk/request'),
           params: { desk_id: 'it_desk', username: 'sokafor', what: 'mfa', answers: HS::RIGHT_SAM }, as: :json
      assert_answer_shape('helpdesk.granted_mfa', response)
      assert_equal failures, state['loginFailures'].deep_dup
      assert_equal locked, state['loginLockouts'].deep_dup
      first_step
      assert_equal true, verify(own_code)['success']
      assert session?
    end

    test 'the own code is in no log row and no sign-in answer, and the code is not in the bootstrap' do
      body = first_step
      get game_path('mfa/device'), params: { npc_id: 'sam' }
      code = response.parsed_body['code']
      assert_not JSON.generate(body).include?(code)
      assert_not JSON.generate(@game.reload.log_rows_for('desk')).include?(code)
      get game_path('scenario'), as: :json
      assert_not response.body.include?(code)
      verify(code)
      assert_not JSON.generate(@game.reload.log_rows_for('desk')).include?(code)
    end

    # ---- GET mfa/phone

    test 'the own phone list is refused with no re-enrolled account, and with an npc_id as well' do
      build(kind: 'push', reset: false)
      first_step
      get game_path('mfa/phone'), params: { own: '1' }
      assert_answer_shape('phone.no_phone', response)
      assert_equal 'no-store', response.headers['Cache-Control']
      build(kind: 'push')
      get game_path('mfa/phone'), params: { own: '1', npc_id: 'sam' }
      assert_answer_shape('phone.no_phone', response)
      get game_path('mfa/phone'), params: { own: '0' }
      assert_answer_shape('phone.no_phone', response)
    end

    test 'the own phone lists the waiting push of a re-enrolled account' do
      build(kind: 'push')
      assert_equal true, first_step['ownPhone']
      post game_path('mfa/prompt'), params: { pc_id: 'sam_pc' }, as: :json
      assert_answer_shape('prompt.waiting_own', response)
      get game_path('mfa/phone'), params: { own: '1' }
      assert_answer_shape('phone.own', response)
      assert_equal 'sam_pc', response.parsed_body['requests'].first['pcId']
    end

    test 'the old phone lists nothing for a re-enrolled account' do
      build(kind: 'push', held: [HR::PHONE])
      first_step
      get game_path('mfa/phone'), params: { npc_id: 'sam' }
      assert_answer_shape('phone.no_phone', response)
    end

    # ---- POST mfa/approve

    test 'the own phone approves; the answer says own_phone and the row says own_phone' do
      build(kind: 'push')
      first_step
      body = approve(own: 1)
      assert_response :success
      assert_answer_shape('approve.own_passed', response)
      assert_equal 'own_phone', body['approvedBy']
      assert session?
      row = rows.find { |r| r['event'] == 'mfa_prompt_approved' }
      assert_equal 'own_phone', row['detail']['approver']
    end

    test 'a held old phone cannot approve for a re-enrolled account: refused as no such phone, nothing changes' do
      build(kind: 'push', held: [HR::PHONE])
      first_step
      before = state.deep_dup
      before_rows = rows.size
      approve
      assert_response :forbidden
      assert_equal({ 'success' => false, 'error' => 'no such phone' }, response.parsed_body)
      assert_answer_shape('phone.no_phone', response)
      approve(own: 0)
      assert_response :forbidden
      approve(deny: true)
      assert_response :forbidden
      assert_not session?
      assert_equal before, state
      assert_equal before_rows, rows.size
      assert_not_nil pending['sam_pc']
      approve(own: 1)
      assert_response :success
      assert session?
    end

    test 'an account that is not re-enrolled approves through a held phone exactly as before' do
      build(kind: 'push', reset: false, held: [HR::PHONE])
      first_step
      body = approve
      assert_response :success
      assert_equal 'player', body['approvedBy']
      assert session?
      row = rows.find { |r| r['event'] == 'mfa_prompt_approved' }
      assert_equal 'held_phone', row['detail']['approver']
    end

    test 'an account not re-enrolled with no phone held is refused, with or without own' do
      build(kind: 'push', reset: false)
      first_step
      approve(own: 1)
      assert_response :forbidden
      approve
      assert_response :forbidden
      assert_not session?
    end

    test 'a re-enrolled number-matching phone lists three numbers and needs the right one' do
      build(kind: 'push_number_match')
      body = first_step
      assert_answer_shape('login.mfa_required_own_push', Struct.new(:status, :parsed_body).new(200, body))
      post game_path('mfa/prompt'), params: { pc_id: 'sam_pc' }, as: :json
      get game_path('mfa/phone'), params: { own: 1 }
      assert_answer_shape('phone.own_number_match', response)
      numbers = response.parsed_body['requests'].first['numbers']
      assert_includes numbers, body['number']
      wrong = numbers.find { |n| n != body['number'] }
      approve(own: 1, number: wrong)
      assert_answer_shape('approve.cancelled', response)
      assert_not session?
      again = first_step
      post game_path('mfa/prompt'), params: { pc_id: 'sam_pc' }, as: :json
      approve(own: 1)
      assert_response :unprocessable_entity
      assert_not session?
      approve(own: 1, number: again['number'])
      assert_response :success
      assert_equal 'own_phone', response.parsed_body['approvedBy']
      assert session?
    end

    test 'a number-matching old phone is refused even with the right number' do
      build(kind: 'push_number_match', held: [HR::PHONE])
      right = first_step['number']
      approve(number: right)
      assert_response :forbidden
      assert_not session?
    end

    test 'a game no desk touched gains no reset keys through these routes' do
      build(kind: 'push', reset: false, held: [HR::PHONE])
      @game.reload.player_state.delete('accountResets')
      @game.save!
      first_step
      get game_path('mfa/phone'), params: { own: '1' }
      get game_path('mfa/device'), params: { npc_id: 'sam' }
      approve(own: 1)
      approve
      assert_not state.key?('accountResets')
      assert_not state.key?('helpdeskTries')
    end
  end
end
