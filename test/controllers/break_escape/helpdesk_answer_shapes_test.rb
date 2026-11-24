# frozen_string_literal: true

require 'test_helper'
require_relative '../../support/helpdesk_route_scenario'
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

    test 'the fixture entries this file owns have no open guesses left' do
      OWNED.each { |name| assert_empty HelpdeskAnswerShapes.entries[name]['guess'], name }
    end
  end
end
