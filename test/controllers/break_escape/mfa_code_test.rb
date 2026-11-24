require 'test_helper'
require_relative '../../support/keyring_login_scenario'

module BreakEscape
  # S8a unit 16 (feature A22, M1a): GET /mfa/device and POST /mfa/verify through the real routes.
  # A `code` PC answers mfaRequired to a right password and opens a session only on a right code;
  # stale, wrong, locked and expired answers; the rows each action writes; and no code in any
  # answer but the held device route's. Time is frozen.
  class MfaCodeTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    KS = KeyringLoginScenario
    NS = NetworkModelScenario
    T0 = Time.zone.at(1_800_000_000)
    MFA_EVENTS = %w[mfa_challenge mfa_code_ok mfa_code_wrong mfa_code_locked mfa_expired signin_fail signin_ok
                    signin_refused signin_lockout].freeze
    SAM_FOB = { 'id' => 'sam_fob', 'type' => 'code_device', 'name' => 'Fob', 'owner' => 'sam' }.freeze
    JAKE_FOB = { 'id' => 'jake_fob', 'type' => 'code_device', 'name' => 'Jake fob', 'owner' => 'jake' }.freeze

    def build(policy: {}, held: [SAM_FOB])
      data = KS.scenario
      data['logSources'] = { 'mfa' => { 'title' => 'MFA', 'events' => MFA_EVENTS } }
      data['policies']['gate'] = { 'mfa' => 'code', 'remote' => 'allowed', 'maxAttempts' => 50 }.merge(policy)
      objects = data['rooms']['desk_room']['objects']
      %w[sam_pc jake_pc].each { |id| objects.find { |o| o['id'] == id }&.[]=('policy', 'gate') }
      sam_pc = objects.find { |o| o['id'] == 'sam_pc' }
      objects << sam_pc.merge('id' => 'sam_pc2', 'name' => 'Sam second PC', 'host' => 'HB-DESK-09')
      data['rooms']['lobby']['objects'] << SAM_FOB.merge('takeable' => true) << JAKE_FOB.merge('takeable' => true)
      build_network_game({ 'encounteredNPCs' => %w[sam lena ian jake],
                           'inventory' => held.map { |h| { 'scenarioData' => h.dup } } }, data)
    end

    setup do
      travel_to T0
      build
    end

    teardown { travel_back }

    def state
      @game.reload.player_state
    end

    def code(device = 'sam_fob')
      @game.reload.code_device_code(device)
    end

    def wrong_code
      code == '000000' ? '000001' : '000000'
    end

    def first_step(pc = 'sam_pc', user: 'sokafor', pw: NS::SAM_PASSWORD)
      post game_path('login'), params: { pc_id: pc, username: user, password: pw }, as: :json
      response.parsed_body
    end

    def verify(typed, pc = 'sam_pc', extra = {})
      post game_path('mfa/verify'), params: { pc_id: pc, code: typed }.merge(extra), as: :json
      response.parsed_body
    end

    def events
      @game.reload.log_rows_for('mfa').map { |r| r['event'] }
    end

    test 'a right password answers mfaRequired and opens no session; only a right code does' do
      body = first_step
      assert_response :success
      assert_equal true, body['mfaRequired']
      assert_equal 'code', body['mfa']
      assert_equal 'sam', body['npcId']
      assert_nil state['sessions']['sam_pc']
      assert_not_includes response.body, code
      body = verify(wrong_code)
      assert_response :unprocessable_entity
      assert_equal true, body['mfaIncorrect']
      assert_nil state['sessions']['sam_pc']
      body = verify(code)
      assert_response :success
      assert body['success']
      assert_equal 'sam', state['sessions']['sam_pc']['id']
      assert_equal 'no-store', response.headers['Cache-Control']
    end

    test 'a code used once is stale used at a second PC; two windows old is stale expired and counts nowhere' do
      first_step
      good = code
      verify(good)
      assert_response :success
      first_step('sam_pc2')
      body = verify(good, 'sam_pc2')
      assert_response :unprocessable_entity
      assert_equal 'used', body['stale']
      old = code
      travel_to T0 + (2 * MfaModel::STEP_SECONDS)
      assert_not_equal old, code
      first_step
      before = [state['loginFailures'], state['mfaAccounts']['sam']['wrong'], state['mfaPending']['sam_pc']['tries']]
      body = verify(old)
      assert_response :unprocessable_entity
      assert_equal 'expired', body['stale']
      assert_equal before, [state['loginFailures'], state['mfaAccounts']['sam']['wrong'], state['mfaPending']['sam_pc']['tries']]
    end

    test 'verify with no pending record is the generic refusal and writes no row' do
      before = events
      body = verify(code)
      assert_response :unprocessable_entity
      assert_equal Game::LOGIN_INCORRECT, body['message']
      assert_equal before, events
    end

    test 'a request with no pc_id, or with target_type, is the generic 422' do
      first_step
      post game_path('mfa/verify'), params: { code: code }, as: :json
      assert_response :unprocessable_entity
      assert_equal Game::LOGIN_INCORRECT, response.parsed_body['message']
      post game_path('mfa/verify'), params: { pc_id: 'sam_pc', target_type: 'door', target_id: 'x', code: code }, as: :json
      assert_response :unprocessable_entity
      assert_equal 'no-store', response.headers['Cache-Control']
      assert_nil state['sessions']['sam_pc']
    end

    test 'an unknown PC is a plain 404' do
      verify('123456', 'nope')
      assert_response :not_found
    end

    test 'five wrong codes drop the record with no maxAttempts; a sixth finds nothing pending' do
      build(policy: { 'maxAttempts' => nil }.compact.merge('maxAttempts' => 50))
      first_step
      4.times do
        body = verify(wrong_code)
        assert_equal true, body['mfaIncorrect']
        assert_nil body['maxAttempts']
      end
      body = verify(wrong_code)
      assert_equal true, body['expired']
      assert_nil body['maxAttempts']
      assert_nil state['mfaPending']['sam_pc']
      verify(code)
      assert_response :unprocessable_entity
      assert_nil state['sessions']['sam_pc']
    end

    test 'wrong codes reach the policy lockout' do
      build(policy: { 'maxAttempts' => 3 })
      first_step
      verify(wrong_code)
      verify(wrong_code)
      body = verify(wrong_code)
      assert body['lockedOut'] || body['locked'] || state['loginLockouts'].include?('sam_pc|sokafor'), body.inspect
      assert_includes state['loginLockouts'], 'sam_pc|sokafor'
    end

    test 'thirty wrong codes close the step: one mfa_code_locked row, reopened after 300 seconds' do
      build(policy: { 'maxAttempts' => 500 })
      MfaModel::MAX_CODE_WRONG_TOTAL.times do |i|
        first_step if i.zero? || (i % 5).zero?
        verify(wrong_code)
      end
      assert_equal 1, events.count('mfa_code_locked')
      first_step
      body = verify(code)
      assert_response :unprocessable_entity
      assert body['codeLocked']
      assert_operator body['retryIn'], :>, 0
      assert_equal 1, events.count('mfa_code_locked')
      travel_to T0 + MfaModel::CODE_CLOSED_SECONDS + 5
      first_step
      body = verify(code)
      assert_response :success, body.inspect
      assert_equal 0, state['mfaAccounts']['sam']['wrong']
    end

    test 'each action writes its rows' do
      first_step
      verify(wrong_code)
      verify(code)
      assert_equal %w[mfa_challenge mfa_code_ok mfa_code_wrong signin_fail signin_ok], events.sort
    end

    test 'the secret guard sees an issued code; no row this unit writes holds one' do
      first_step
      issued = code
      OpsLog.note_issued_secret(issued)
      assert OpsLog.find_secret_hit(OpsLog.compared_secrets(@game), { 'detail' => { 'v' => issued } }),
             'the guard matches a row holding the code just issued'
      verify(wrong_code)
      verify(issued)
      @game.reload.log_rows_for('mfa').each do |row|
        assert_nil OpsLog.row_secret_hit(@game, row.slice('as', 'where', 'detail')), row.inspect
      end
    ensure
      OpsLog::Current.reset
    end

    test 'no code in any answer but the held device route, and that route is no-store' do
      bodies = []
      bodies << first_step.to_json
      bodies << verify(wrong_code).to_json
      post game_path('login'), params: { pc_id: 'sam_pc', claim: 'owner' }, as: :json
      bodies << response.body
      get game_path('scenario'), as: :json
      bodies << response.body
      get game_path('mfa/device'), params: { item_id: 'sam_fob' }, as: :json
      assert_response :success
      assert_equal 'no-store', response.headers['Cache-Control']
      assert_equal code, response.parsed_body['code']
      bodies.each { |b| assert_not_includes b, code }
      assert_not_includes state.to_json, code
    end
  end
end
