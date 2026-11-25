# frozen_string_literal: true

require 'test_helper'
require_relative '../../support/lock_step_routes'
require_relative '../../support/helpdesk_reenrol_scenario'
require_relative '../../support/helpdesk_answer_shapes'
require_relative '../../support/network_model_scenario'

module BreakEscape
  # Wire S8b device_in_use? to S8c, unit U2: once a desk has re-enrolled an owner's second step onto
  # their own phone, the owner's old code device still shows its code while a live, unpassed code lock
  # step names that owner, because the lock still asks for that device. Everything is driven through the
  # real routes with time frozen. Lock answers are read from lock_step/answers.json, device answers from
  # helpdesk_answer_shapes.json.
  class LockStepReenrolDeviceTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests
    include LockStepRoutes
    include HelpdeskAnswerShapes

    HR = HelpdeskReenrolScenario
    HS = HelpdeskRouteScenario
    NS = NetworkModelScenario
    LOCK_ANSWERS = JSON.parse(File.read(File.expand_path('../../fixtures/files/lock_step/answers.json', __dir__))).freeze
    PENDING = MfaModel::PENDING_SECONDS
    STEP = MfaModel::STEP_SECONDS
    GAP = MfaModel::PROMPT_GAP_SECONDS
    SAM_CODE = 'sam_code_safe'
    SAM_PUSH = 'sam_push_safe'
    JAKE_CODE = 'jake_code_safe'

    def lock_object(id, kind, owner)
      { 'type' => 'safe', 'id' => id, 'name' => id, 'locked' => true, 'lockType' => 'pin', 'requires' => '1234',
        'secondStep' => { 'kind' => kind, 'owner' => owner },
        'contents' => [{ 'type' => 'notes', 'id' => "#{id}_note", 'name' => 'Note', 'takeable' => true }] }
    end

    def scenario(sam_approves: false)
      data = HR.scenario(kind: 'code')
      lobby = data['rooms']['lobby']
      lobby['objects'] << lock_object(SAM_CODE, 'code', 'sam') << lock_object(SAM_PUSH, 'push', 'sam') <<
        lock_object(JAKE_CODE, 'code', 'jake')
      lobby['objects'] << HR::PHONE.merge('takeable' => true)
      if sam_approves
        data['rooms'].each_value do |r|
          Array(r['npcs']).each { |n| n['habits'] = { 'approvesPrompts' => 'always' } if n['id'] == 'sam' }
        end
      end
      data
    end

    def build(reset: false, held: [HR::FOB, HR::JAKE_FOB], sam_approves: false)
      state = { 'encounteredNPCs' => %w[ria sam lena ian jake], 'inventory' => held.map { |h| HR.held(h) } }
      state = state.merge(HR::RESET_SAM.deep_dup) if reset
      build_network_game(state, scenario(sam_approves: sam_approves))
    end

    setup do
      @seen = []
      travel_to T0
    end

    teardown { travel_back }

    def reenrol!
      post game_path('helpdesk/request'),
           params: { desk_id: 'it_desk', username: 'sokafor', what: 'mfa', answers: HS::RIGHT_SAM }, as: :json
      assert_answer_shape('helpdesk.granted_mfa', response)
    end

    def device(item)
      get game_path('mfa/device'), params: { item_id: item }
      answer
      response
    end

    def own_phone
      get game_path('mfa/device'), params: { npc_id: 'sam' }
      answer
      response
    end

    def gate(id)
      unlock('object', id, '1234', 'pin')
    end

    def lock_shape(name, status, body, id)
      entry = LOCK_ANSWERS.fetch(name)
      assert_equal entry['status'], status, name
      expected = entry['body'].merge('targetId' => id)
      expected['npcId'] = body['npcId'] if expected.key?('npcId')
      assert_empty body_differences(expected, body, entry['varies']), name
    end

    def shows_code?(item = 'sam_fob')
      assert_equal 200, device(item).status
      assert_code_device_shape
      assert_equal item, response.parsed_body['deviceId']
      true
    end

    # the normal device answer: the device.own entry of the shared fixture, with the owner's own display name
    def assert_code_device_shape
      entry = HelpdeskAnswerShapes.entries['device.own']
      assert_equal entry['status'], response.status
      varies = Array(entry['vary']).map { |v| v.sub(/\Abody\./, '') } + ['displayName']
      assert_empty body_differences(entry['body'], response.parsed_body, varies)
    end

    def unenrolled?(item = 'sam_fob')
      device(item)
      assert_answer_shape('device.unenrolled', response)
      assert_not response.parsed_body.key?('code')
    end

    def sam_login
      post game_path('login'), params: { pc_id: 'sam_pc', username: 'sokafor', password: NS::SAM_PASSWORD }, as: :json
    end

    # ---- 1 and 2: the controls ----

    test '1 not re-enrolled and no gate: the device shows a code' do
      build
      assert shows_code?
    end

    test '2 re-enrolled and no gate: not enrolled, no code key' do
      build(reset: true)
      unenrolled?
    end

    # ---- 3 and 4: the main flow, through the desk route ----

    test '3 and 4 a desk re-enrolment then the right pin: the device shows a code, it passes the lock, then blanks' do
      build
      reenrol!
      unenrolled?
      status, body = gate(SAM_CODE)
      lock_shape('gate_code', status, body, SAM_CODE)
      assert shows_code?
      status, body = mfa('verify', "object:#{SAM_CODE}", code: device_code('sam_fob'))
      lock_shape('verify_passed', status, body, SAM_CODE)
      status, body = unlock('object', SAM_CODE, '1234', 'pin')
      lock_shape('open_object', status, body, SAM_CODE)
      assert_includes game_state['unlockedObjects'], SAM_CODE
      unenrolled?
    end

    # ---- 5: the boundary equals tidy_pending! ----

    test '5 the code is shown at PENDING_SECONDS and gone one second later' do
      build(reset: true)
      gate(SAM_CODE)
      later(PENDING)
      assert shows_code?
      later(1)
      unenrolled?
    end

    # ---- 6: a dropped record ----

    test '6 five wrong codes drop the record and the device blanks' do
      build(reset: true)
      gate(SAM_CODE)
      assert shows_code?
      5.times do
        _status, body = mfa('verify', "object:#{SAM_CODE}", code: '000000')
        break if body['dropped'] || body['expired'] || body['codeLocked']
      end
      assert_nil game_state['lockSteps']["object:#{SAM_CODE}"]
      unenrolled?
    end

    # ---- 7 and 8: only a live code record of that owner counts ----

    test '7 a live push lock of the owner does not show the device' do
      build(reset: true)
      gate(SAM_PUSH)
      assert_equal 'push', game_state['lockSteps']["object:#{SAM_PUSH}"]['kind']
      unenrolled?
    end

    test '8 a live code lock of another owner shows that owner device only' do
      build(reset: true) # sam re-enrolled, jake not
      gate(JAKE_CODE)
      unenrolled?('sam_fob')
      assert shows_code?('jake_fob')
    end

    # ---- 9: the device being in use never re-opens PC sign-in ----

    test '9 the old device code is wrong at the PC while the lock needs it; the own phone still signs in' do
      build(reset: true)
      gate(SAM_CODE)
      later(STEP) # the lock has not passed in the current window
      gate(SAM_CODE)
      assert shows_code?
      shown = response.parsed_body['code']
      sam_login
      post game_path('mfa/verify'), params: { pc_id: 'sam_pc', code: shown }, as: :json
      assert_equal true, response.parsed_body['mfaIncorrect']
      assert_nil game_state.dig('sessions', 'sam_pc')
      own = BreakEscape::Game.find(@game.id).code_device_code('own:sam')
      post game_path('mfa/verify'), params: { pc_id: 'sam_pc', code: own }, as: :json
      assert_equal true, response.parsed_body['success']
      assert game_state.dig('sessions', 'sam_pc')
    end

    # ---- 10: no writes ----

    test '10 the device read writes nothing, also on a legacy game with no lockSteps key' do
      build(reset: true)
      before = game_state.deep_dup
      unenrolled?
      assert_equal before, game_state
      gate(SAM_CODE)
      before = game_state.deep_dup
      assert shows_code?
      assert_equal before, game_state
      game = BreakEscape::Game.find(@game.id)
      game.player_state.delete('lockSteps')
      game.save!
      assert_not game_state.key?('lockSteps')
      unenrolled?
      assert_not game_state.key?('lockSteps')
    end

    # ---- 11: nothing leaked ----

    test '11 no answer carries lockSteps or mfaAccounts' do
      build
      reenrol!
      @seen << { path: request.path, status: response.status, body: response.body }
      gate(SAM_CODE)
      shows_code?
      mfa('verify', "object:#{SAM_CODE}", code: '000000')
      own_phone
      assert_nothing_leaked('lockSteps', 'mfaAccounts')
    end

    # ---- 12: a push lock after a re-enrolment (A10) ----

    test '12a the owner approves a push lock after a re-enrolment' do
      build(sam_approves: true)
      reenrol!
      gate(SAM_PUSH)
      out = nil
      6.times do
        out = mfa('prompt', "object:#{SAM_PUSH}")
        break if out.last['stepPassed']

        later(GAP)
      end
      lock_shape('prompt_passed', *out, SAM_PUSH)
      status, body = unlock('object', SAM_PUSH, '1234', 'pin')
      assert_equal 200, status
      assert_equal true, body['success']
      assert_includes game_state['unlockedObjects'], SAM_PUSH
    end

    test '12b the held phone approves a push lock after a re-enrolment' do
      build(held: [HR::FOB, HR::PHONE])
      reenrol!
      gate(SAM_PUSH)
      status, body = mfa('approve', "object:#{SAM_PUSH}")
      lock_shape('approve_passed', status, body, SAM_PUSH)
      status, body = unlock('object', SAM_PUSH, '1234', 'pin')
      assert_equal 200, status
      assert_equal true, body['success']
      assert_includes game_state['unlockedObjects'], SAM_PUSH
    end

    # ---- 13: the shared used window ----

    test '13 using the old device code at the lock marks the own phone window used' do
      build(reset: true)
      gate(SAM_CODE)
      status, body = mfa('verify', "object:#{SAM_CODE}", code: device_code('sam_fob'))
      lock_shape('verify_passed', status, body, SAM_CODE)
      own_phone
      assert_answer_shape('device.own_used', response)
      later(STEP)
      own_phone
      assert_answer_shape('device.own', response)
    end

    # ---- 14: the other order ----

    test '14 gate first, then re-enrol: the device still shows a code and that code passes the lock' do
      build
      gate(SAM_CODE)
      assert shows_code?
      reenrol!
      assert shows_code?
      status, body = mfa('verify', "object:#{SAM_CODE}", code: device_code('sam_fob'))
      lock_shape('verify_passed', status, body, SAM_CODE)
    end
  end
end
