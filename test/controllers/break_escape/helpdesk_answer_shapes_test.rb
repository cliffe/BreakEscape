# frozen_string_literal: true

require 'test_helper'
require_relative '../../support/helpdesk_route_scenario'
require_relative '../../support/helpdesk_reenrol_scenario'
require_relative '../../support/helpdesk_answer_shapes'

module BreakEscape
  # S8b unit 13: every `helpdesk.*` entry of the shared answer fixture, produced through the real
  # route and checked with assert_answer_shape. The server is the authority over the fixture.
  # (`bootstrap.helpdesk_forms` belongs to the bootstrap unit's tests.)
  class HelpdeskAnswerShapesTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests
    include HelpdeskAnswerShapes

    HS = HelpdeskRouteScenario
    T0 = Time.zone.at(1_800_000_000)
    OWNED = HelpdeskAnswerShapes.names.grep(/\Ahelpdesk\./).freeze

    setup do
      travel_to T0
      build
    end

    teardown { travel_back }

    def build(desk_overrides: {}, state: {})
      build_network_game({ 'encounteredNPCs' => %w[ria sam lena ian] }.merge(state), HS.scenario(desk_overrides))
    end

    def ask(fields = {})
      body = { desk_id: 'it_desk', username: 'sokafor', what: 'password', answers: HS::RIGHT_SAM }.merge(fields)
      post game_path('helpdesk/request'), params: body, as: :json
    end

    test 'granted_password, and again for a repeat' do
      ask
      assert_answer_shape('helpdesk.granted_password', response)
      ask
      assert_answer_shape('helpdesk.granted_password', response)
    end

    test 'granted_mfa, and a repeat carries no lockoutPcIds either' do
      ask(what: 'mfa')
      assert_answer_shape('helpdesk.granted_mfa', response)
      ask(what: 'mfa')
      assert_answer_shape('helpdesk.granted_mfa', response)
    end

    test 'both grants name the account NPC id and the desk, never the typed username, on the first and the repeat' do
      %w[password mfa].each do |what|
        build
        2.times do
          ask(what: what, username: ' SOkafor ')
          body = JSON.parse(response.body)
          assert_equal 'sam', body['npcId']
          assert_equal 'it_desk', body['deskId']
          assert_not_includes response.body.downcase.scan(/"npcid":"[^"]*"/).join, 'sokafor'
        end
      end
    end

    test 'refused, refused_last and blocked' do
      ask(answers: HS::WRONG)
      assert_answer_shape('helpdesk.refused', response)
      ask(answers: HS::WRONG)
      ask(answers: HS::WRONG)
      assert_answer_shape('helpdesk.refused_last', response)
      ask
      assert_answer_shape('helpdesk.blocked', response)
    end

    test 'unavailable, not_found and bad_request' do
      ask(pc_id: 'no_such_pc')
      assert_answer_shape('helpdesk.unavailable', response)
      ask(desk_id: 'nope')
      assert_answer_shape('helpdesk.not_found', response)
      ask(what: '')
      assert_answer_shape('helpdesk.bad_request', response)
    end

    test 'every helpdesk entry of the fixture is produced by this file' do
      HelpdeskAnswerShapes.asked.clear
      ask
      assert_answer_shape('helpdesk.granted_password', response)
      build
      ask(what: 'mfa')
      assert_answer_shape('helpdesk.granted_mfa', response)
      build
      ask(answers: HS::WRONG)
      assert_answer_shape('helpdesk.refused', response)
      ask(answers: HS::WRONG)
      ask(answers: HS::WRONG)
      assert_answer_shape('helpdesk.refused_last', response)
      ask
      assert_answer_shape('helpdesk.blocked', response)
      ask(pc_id: 'no_such_pc', username: 'other')
      assert_answer_shape('helpdesk.unavailable', response)
      ask(desk_id: 'nope')
      assert_answer_shape('helpdesk.not_found', response)
      ask(username: '')
      assert_answer_shape('helpdesk.bad_request', response)
      assert_empty OWNED - HelpdeskAnswerShapes.asked, 'a helpdesk.* entry was not produced'
      assert_equal OWNED.sort, HelpdeskAnswerShapes.names.grep(/\Ahelpdesk\./).sort
    end

    # S8b unit 18: the rest of the fixture, through the real routes.
    SECOND_STEP = HelpdeskReenrolScenario
    Shaped = Struct.new(:status, :parsed_body)

    def build_gate(kind, held: [], reset: true, saved: false)
      data = SECOND_STEP.scenario(kind: kind)
      SECOND_STEP.with_saved_connection(data) if saved
      inventory = held.map { |h| SECOND_STEP.held(h) }
      inventory << SECOND_STEP::SAVED_FILE.dup if saved
      state = { 'encounteredNPCs' => %w[ria sam lena ian jake], 'inventory' => inventory,
                'footholds' => KeyringLoginScenario.office_foothold }
      state.merge!(SECOND_STEP::RESET_SAM.deep_dup) if reset
      build_network_game(state, data)
    end

    def sign_in_first
      post game_path('login'), params: { pc_id: 'sam_pc', username: 'sokafor', password: NetworkModelScenario::SAM_PASSWORD },
                               as: :json
      response.parsed_body
    end

    test 'every other entry of the fixture is produced through the real routes' do
      HelpdeskAnswerShapes.asked.clear
      # bootstrap and keyring (a desk grant is what puts the reset password in the keyring)
      build_gate(nil, reset: false, saved: true)
      get game_path('scenario'), as: :json
      assert_answer_shape('bootstrap.helpdesk_forms', Shaped.new(200, response.parsed_body['helpdeskForms']))
      ask(answers: HS::RIGHT_SAM)
      get game_path('keyring'), as: :json
      entry = response.parsed_body['entries'].find { |e| e['id'] == 'sam.reset' }
      assert_answer_shape('keyring.reset_entry', Shaped.new(200, entry))
      post game_path('login'), params: { pc_id: 'sam_pc', credential: 'sam_gate_rdp', foothold: KeyringLoginScenario::OFFICE },
                               as: :json
      assert_answer_shape('keyring.password_changed', response)
      # code gate, re-enrolled
      build_gate('code', held: [SECOND_STEP::FOB])
      assert_answer_shape('login.mfa_required_own_code', Shaped.new(200, sign_in_first))
      get game_path('mfa/device'), params: { item_id: 'sam_fob' }
      assert_answer_shape('device.unenrolled', response)
      get game_path('mfa/device'), params: { npc_id: 'sam' }
      assert_answer_shape('device.own', response)
      code = response.parsed_body['code']
      post game_path('mfa/verify'), params: { pc_id: 'sam_pc', code: code }, as: :json
      assert_answer_shape('verify.own_passed', response)
      get game_path('mfa/device'), params: { npc_id: 'sam' }
      assert_answer_shape('device.own_used', response)
      get game_path('mfa/device'), params: { npc_id: 'jake' }
      assert_answer_shape('device.no_device', response)
      # push, re-enrolled
      build_gate('push')
      sign_in_first
      post game_path('mfa/prompt'), params: { pc_id: 'sam_pc' }, as: :json
      assert_answer_shape('prompt.waiting_own', response)
      get game_path('mfa/phone'), params: { own: 1 }
      assert_answer_shape('phone.own', response)
      post game_path('mfa/approve'), params: { pc_id: 'sam_pc', own: 1 }, as: :json
      assert_answer_shape('approve.own_passed', response)
      build_gate('push', reset: false)
      get game_path('mfa/phone'), params: { own: 1 }
      assert_answer_shape('phone.no_phone', response)
      # number matching, re-enrolled
      build_gate('push_number_match')
      assert_answer_shape('login.mfa_required_own_push', Shaped.new(200, sign_in_first))
      post game_path('mfa/prompt'), params: { pc_id: 'sam_pc' }, as: :json
      get game_path('mfa/phone'), params: { own: 1 }
      assert_answer_shape('phone.own_number_match', response)
      numbers = response.parsed_body['requests'].first['numbers']
      post game_path('mfa/approve'), params: { pc_id: 'sam_pc', own: 1, number: numbers.first + 1000 }, as: :json
      assert_answer_shape('approve.cancelled', response)
      assert_empty HelpdeskAnswerShapes.unproduced_names - OWNED, 'a fixture entry is produced by no real route'
    end

    test 'the fixture entries this file owns have no open guesses left' do
      OWNED.each { |name| assert_empty HelpdeskAnswerShapes.entries[name]['guess'], name }
    end
  end
end
