require 'test_helper'
require_relative '../../support/network_ops_scenario'

module BreakEscape
  # Ops S5a unit 03 (OPS_PRIVILEGE_ACCOUNTS_PLAN.md, P360-364): a `needs.session` row is met by a live
  # session whose level (session_access) is not nil and is at least the level named. Password sessions
  # are made through the real sign-in route and technique sessions through the real technique route;
  # the claim, keyring, relay and token records have no route in this fixture and are set by hand
  # (each says so). Fixture: NetworkOpsScenario.techniques_scenario, where `step_up` needs a user
  # session at sam_pc and `step_admin` an admin one.
  class OpsNeedSessionLevelTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests

    OFFICE = NetworkOpsScenario::OFFICE
    NOS = NetworkOpsScenario
    USER_FINDING = 'sam_pc.files.step_up'.freeze
    ADMIN_FINDING = 'sam_pc.files.step_admin'.freeze

    # sam is an administrator when `admin` is true (the scenario's `creds.admin` marker).
    def build(admin: false, scenario: NOS.techniques_scenario)
      if admin
        scenario['rooms'].each_value do |room|
          Array(room['npcs']).each { |npc| npc['creds']['admin'] = true if npc['id'] == 'sam' && npc['creds'].is_a?(Hash) }
        end
      end
      techniques_game(data: scenario)
    end

    def session_at(pc_id = 'sam_pc')
      ops_state['sessions']&.[](pc_id)
    end

    # A record no route writes with the wanted shape, set by hand.
    def put_session(record, pc_id = 'sam_pc')
      game = Game.find(@game.id)
      game.player_state['sessions'] = (game.player_state['sessions'] || {}).merge(pc_id => record)
      game.save!
    end

    def edit_state
      game = Game.find(@game.id)
      yield game.player_state
      game.save!
    end

    def need_met?(finding_id)
      ops_confirm(OFFICE, finding_id)['finding']['needs'].find { |n| n['kind'] == 'session' }['met']
    end

    def refused_need(finding_id)
      body = ops_technique(OFFICE, finding_id, 'card_factory')
      assert_response :unprocessable_entity, response.body
      assert_equal 'need_unmet', body['reason']
      body
    end

    # ---- a user need ----------------------------------------------------------------------------

    test 'a user need is unmet with no session' do
      build
      assert_equal false, need_met?(USER_FINDING)
    end

    test 'a user need is met by a password session' do
      build
      sign_in('sam_pc', 'sokafor', NetworkModelScenario::SAM_PASSWORD, foothold: OFFICE)
      assert_response :success, response.body
      assert_equal true, need_met?(USER_FINDING)
    end

    test 'a user need is met by a keyring session, a guest claim, an owner claim and a technique user session (hand-set records)' do
      build
      [{ 'id' => 'sam', 'via' => 'credential', 'credential' => 'sam_login' },
       { 'id' => 'sam', 'via' => 'claim' },
       { 'id' => 'sam', 'via' => 'claim', 'owner' => true }].each do |record|
        put_session(record)
        assert_equal true, need_met?(USER_FINDING), record.inspect
      end
      put_session({ 'id' => 'sam', 'via' => 'technique', 'foothold' => OFFICE, 'technique' => 'x' })
      assert_equal true, need_met?(USER_FINDING)
    end

    test 'a technique user session made through the route meets a user need' do
      build
      ops_technique(OFFICE, 'sam_pc.web.factory_login', 'card_factory')
      assert_response :success, response.body
      assert_equal true, need_met?(USER_FINDING)
    end

    test 'a user need is not met by a relay session (owner question O1: option B)' do
      build
      put_session({ 'id' => 'sam', 'via' => 'claim', 'relay' => true })
      assert_equal false, need_met?(USER_FINDING)
      refused_need(USER_FINDING)
    end

    test 'a user need is not met by a locked session' do
      build
      sign_in('sam_pc', 'sokafor', NetworkModelScenario::SAM_PASSWORD, foothold: OFFICE)
      edit_state { |state| state['sessions']['sam_pc']['locked'] = true }
      assert_equal false, need_met?(USER_FINDING)
    end

    test 'a user need is not met by an expired token session (hand-set record, a token with a bad lifetime)' do
      scenario = NOS.techniques_scenario
      scenario['credentials'] = (scenario['credentials'] || {}).merge(
        'sam_token' => { 'kind' => 'token', 'account' => 'sam', 'connectsTo' => 'sam_pc',
                         'proof' => { 'foothold' => OFFICE }, 'label' => 'Sam token', 'expiresMin' => 0 }
      )
      build(scenario: scenario)
      put_session({ 'id' => 'sam', 'via' => 'credential', 'credential' => 'sam_token', 'foothold' => OFFICE })
      assert_equal false, need_met?(USER_FINDING)
    end

    test 'a user need is not met by a session whose route is down or whose account is gone (hand-set records)' do
      build
      put_session({ 'id' => 'sam', 'via' => 'password', 'foothold' => 'jack_not_held' })
      assert_equal false, need_met?(USER_FINDING), 'route down'
      put_session({ 'id' => 'ghost', 'via' => 'password', 'foothold' => OFFICE })
      assert_equal false, need_met?(USER_FINDING), 'account gone'
      put_session({ 'id' => 'sam', 'via' => 'password', 'foothold' => OFFICE })
      assert_equal true, need_met?(USER_FINDING), 'control: the same record with a held foothold'
    end

    # ---- an admin need --------------------------------------------------------------------------

    test 'an admin need is met by a technique admin session' do
      build
      assert_equal false, need_met?(ADMIN_FINDING)
      refused_need(USER_FINDING)
      ops_technique(OFFICE, 'sam_pc.web.factory_login', 'card_factory')
      assert_response :success, response.body
      body = ops_technique(OFFICE, USER_FINDING, 'card_factory')
      assert_response :success, response.body
      assert_equal 'admin', body['session']['access']
      assert_equal true, need_met?(ADMIN_FINDING)
    end

    test 'an admin need is met by a typed session of a creds.admin account and not of an ordinary one' do
      build(admin: true)
      sign_in('sam_pc', 'sokafor', NetworkModelScenario::SAM_PASSWORD, foothold: OFFICE)
      assert_equal true, need_met?(ADMIN_FINDING)
      build
      sign_in('sam_pc', 'sokafor', NetworkModelScenario::SAM_PASSWORD, foothold: OFFICE)
      assert_equal false, need_met?(ADMIN_FINDING)
      assert_equal true, need_met?(USER_FINDING)
    end

    test 'an admin need is not met by a user session, a claim of an admin desktop or a locked admin session' do
      build(admin: true)
      put_session({ 'id' => 'sam', 'via' => 'claim' })
      assert_equal false, need_met?(ADMIN_FINDING), 'a claim is never admin'
      assert_equal true, need_met?(USER_FINDING)
      put_session({ 'id' => 'sam', 'via' => 'technique', 'foothold' => OFFICE, 'technique' => 'x', 'access' => 'user' })
      assert_equal false, need_met?(ADMIN_FINDING)
      sign_in('sam_pc', 'sokafor', NetworkModelScenario::SAM_PASSWORD, foothold: OFFICE)
      assert_equal true, need_met?(ADMIN_FINDING)
      edit_state { |state| state['sessions']['sam_pc']['locked'] = true }
      assert_equal false, need_met?(ADMIN_FINDING)
    end

    # ---- the step up ----------------------------------------------------------------------------

    test 'a guest claim feeds a real step up: the record becomes technique admin with the foothold' do
      build
      put_session({ 'id' => 'sam', 'via' => 'claim' }) # a claim made through the desktop route is this record
      body = ops_technique(OFFICE, USER_FINDING, 'card_factory')
      assert_response :success, response.body
      assert_equal 'admin', body['session']['access']
      record = session_at
      assert_equal 'technique', record['via']
      assert_equal 'admin', record['access']
      assert_equal OFFICE, record['foothold']
    end

    test 'a relay session does not feed a step up' do
      build
      put_session({ 'id' => 'sam', 'via' => 'claim', 'relay' => true })
      body = refused_need(USER_FINDING)
      assert_equal 'session', body['need']['kind']
      assert_equal true, session_at['relay']
    end

    # ---- the repeat row -------------------------------------------------------------------------

    test 'a repeat use writes the stored level in technique_used even after the route has dropped' do
      build
      ops_technique(OFFICE, 'sam_pc.web.factory_login', 'card_factory')
      ops_technique(OFFICE, USER_FINDING, 'card_factory')
      assert_response :success, response.body
      # The record keeps its foothold but now claims a `from` route that nothing holds: the route is down.
      edit_state { |state| state['sessions']['sam_pc']['from'] = 'lena_pc' }
      assert_nil Game.find(@game.id).session_access('sam_pc'), 'the route is down'
      body = ops_technique(OFFICE, USER_FINDING, 'card_factory')
      assert_response :success, response.body
      assert_equal true, body['already']
      used = ops_rows.select { |row| row['event'] == 'technique_used' }
      assert_equal 'admin', used.last['detail']['access']
    end
  end
end
