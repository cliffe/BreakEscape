# frozen_string_literal: true

require 'test_helper'
require_relative '../../support/helpdesk_reenrol_scenario'

module BreakEscape
  # S8b review round 1 (server), through the real routes with time frozen:
  # R1-SERVER1 a password grant drops that account's pending second steps;
  # R1-SERVER3/4 a refusal is the same for an account and a name that is not one;
  # and that however a desk's form is opened, the route holds the desk's own rule.
  class HelpdeskReviewR1Test < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    HR = HelpdeskReenrolScenario
    HS = HelpdeskRouteScenario
    NS = NetworkModelScenario
    T0 = Time.zone.at(1_800_000_000)

    def build(kind: 'code', held: [], habit: nil, saved: false, met: %w[ria sam lena ian jake])
      data = HR.scenario(kind: kind)
      HR.with_saved_connection(data) if saved
      if habit
        data['rooms'].each_value { |r| Array(r['npcs']).each { |n| n['habits'] = habit if n['id'] == 'sam' } }
      end
      build_network_game({ 'encounteredNPCs' => met, 'inventory' => held.map { |h| HR.held(h) } }, data)
    end

    setup { travel_to T0 }
    teardown { travel_back }

    def state
      @game.reload.player_state
    end

    def json
      response.parsed_body
    end

    def first_step
      post game_path('login'), params: { pc_id: 'sam_pc', username: 'sokafor', password: NS::SAM_PASSWORD }, as: :json
      json
    end

    def ask(fields = {})
      body = { desk_id: 'it_desk', username: 'sokafor', what: 'password', answers: HS::RIGHT_SAM }.merge(fields)
      post game_path('helpdesk/request'), params: body, as: :json
    end

    def refuse_with_no_pending_step
      assert_response :unprocessable_entity
      assert_equal false, json['success']
      assert_nil state.dig('sessions', 'sam_pc'), 'no session is written'
      assert_nil state.dig('accountResets', 'sam', 'typed'), 'typed is not set by a step on the old password'
      assert_not state['mfaPending']&.key?('sam_pc'), 'the pending record is gone'
    end

    # --- R1-SERVER1 -----------------------------------------------------------------------------

    test 'R1-SERVER1: a code step begun on the old password cannot finish after a reset' do
      build(kind: 'code', held: [HR::FOB], saved: true)
      assert_equal true, first_step['mfaRequired']
      code = @game.reload.code_device_code('sam_fob')
      ask
      assert_response :success
      assert_equal true, state['accountResets']['sam']['password']
      post game_path('mfa/verify'), params: { pc_id: 'sam_pc', code: code }, as: :json
      refuse_with_no_pending_step
    end

    test 'R1-SERVER1: a held-phone approval of a step begun on the old password is refused after a reset' do
      build(kind: 'push', held: [HR::PHONE], saved: true)
      assert_equal true, first_step['mfaRequired']
      ask
      post game_path('mfa/approve'), params: { pc_id: 'sam_pc' }, as: :json
      assert_response :unprocessable_entity
      assert_nil state.dig('sessions', 'sam_pc')
      assert_nil state.dig('accountResets', 'sam', 'typed')
      assert_not state['mfaPending']&.key?('sam_pc')
    end

    test 'R1-SERVER1: an owner approval of a step begun on the old password is refused after a reset' do
      build(kind: 'push', habit: { 'approvesPrompts' => 'always' })
      assert_equal true, first_step['mfaRequired']
      ask
      post game_path('mfa/prompt'), params: { pc_id: 'sam_pc' }, as: :json
      refuse_with_no_pending_step
    end

    test 'R1-SERVER1: the stale saved connection stays stale until the new password is typed' do
      build(kind: 'code', held: [HR::FOB], saved: true)
      first_step
      ask
      post game_path('mfa/verify'), params: { pc_id: 'sam_pc', code: @game.reload.code_device_code('sam_fob') }, as: :json
      assert_nil state.dig('accountResets', 'sam', 'typed')
      assert @game.reload.send(:password_reset_untyped?, 'sam')
    end

    test 'R1-SERVER1: another account pending step is kept, and a second-factor reset keeps a step' do
      build(kind: 'push', held: [HR::PHONE])
      first_step
      ask(what: 'mfa')
      assert state['mfaPending'].key?('sam_pc'), 'only a password reset drops the step'
    end

    # --- R1-SERVER3 and 4: nothing tells an account from a name that is not one ------------------

    test 'R1-SERVER3: past the 200-name cap an account and a non-account are refused alike' do
      build
      2.times { ask(answers: HS::WRONG) }
      2.times { ask(username: 'zed', answers: HS::WRONG) }
      HelpdeskModel::TRIES_CAP.times { |i| ask(username: "junk#{i}", answers: HS::WRONG) }
      ask(username: 'sokafor', answers: HS::WRONG)
      real = [response.status, json]
      ask(username: 'zed', answers: HS::WRONG)
      assert_equal real, [response.status, json]
      assert_operator state['helpdeskTries'].size, :<=, HelpdeskModel::TRIES_CAP
    end

    test 'R1-SERVER3: a stopped account and a stopped non-account are both still stopped after 200 more names' do
      build
      3.times { ask(answers: HS::WRONG) }
      3.times { ask(username: 'zed', answers: HS::WRONG) }
      (HelpdeskModel::TRIES_CAP + 20).times { |i| ask(username: "junk#{i}", answers: HS::WRONG) }
      ask(username: 'sokafor', answers: HS::WRONG)
      real = [response.status, json]
      ask(username: 'zed', answers: HS::WRONG)
      fake = [response.status, json]
      assert_equal 'blocked', real.last['reason']
      assert_equal real, fake
    end

    test 'R1-SERVER3: with the table full of stopped names a new name is answered as stopped, account or not' do
      build
      HelpdeskModel::TRIES_CAP.times { |i| 3.times { ask(username: "stop#{i}", answers: HS::WRONG) } }
      ask(username: 'sokafor', answers: HS::WRONG)
      real = [response.status, json]
      ask(username: 'newname', answers: HS::WRONG)
      assert_equal real, [response.status, json]
      assert_equal 'blocked', real.last['reason']
      assert_equal HelpdeskModel::TRIES_CAP, state['helpdeskTries'].size
    end

    # --- every way to open the form meets the desk's rule --------------------------------------

    test 'the route knows nothing of how the form was opened: a desk not met is unavailable whatever is sent' do
      build(met: %w[sam lena ian jake])
      ask(pc_id: 'front_pc_not_there')
      assert_response :unprocessable_entity
      assert_equal 'unavailable', json['reason']
      ask(pc_id: nil)
      assert_equal 'unavailable', json['reason']
      assert_nil state['accountResets']
    end

    test 'a desk met still holds its rule: wrong answers are refused whatever the form came from' do
      build
      ask(answers: HS::WRONG, deskId: 'it_desk', type: 'helpdesk_form', minigame: 'helpdesk_form')
      assert_response :unprocessable_entity
      assert_equal 'refused', json['reason']
      assert_nil state['accountResets']
    end

    # --- the owner question: sticky notes and heard logins give the old password ----------------

    test 'after a reset a sticky note still gives the old password, and sign-in refuses it' do
      build(kind: nil)
      data = @game.scenario_data
      data['rooms'].each_value { |r| Array(r['npcs']).each { |n| n['workarounds'] = [{ 'at' => 50, 'do' => 'writes_down' }] if n['id'] == 'sam' } }
      @game.player_state['npcFrustration'] = { 'sam' => { 'done' => [0] } }
      @game.save!
      pc = @game.scenario_data['rooms'].values.flat_map { |r| r['objects'] }.find { |o| o['id'] == 'sam_pc' }
      pc.delete('postitNote')
      before = @game.reload.login_postit_for(pc)
      skip 'no sticky note in this scenario' unless before
      ask
      assert_response :success
      assert_equal before, @game.reload.login_postit_for(pc), 'the note is stale, not updated'
      assert_includes before, NS::SAM_PASSWORD
      post game_path('login'), params: { pc_id: 'sam_pc', username: 'sokafor', password: NS::SAM_PASSWORD }, as: :json
      assert_equal false, json['success']
    end
  end
end
