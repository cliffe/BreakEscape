# frozen_string_literal: true

require 'test_helper'
require_relative '../../support/keyring_login_scenario'

module BreakEscape
  # S8b unit 11: the sign-in and bootstrap wiring of a helpdesk reset, through the real routes.
  # Sam is the account the desk can reset; Ria is the desk's NPC.
  class HelpdeskSignInTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    NS = NetworkModelScenario
    T0 = Time.zone.at(1_800_000_000)
    SAM_RESET = 'Tern-Harbour-41'.freeze
    EVENTS = %w[helpdesk_request account_password_reset account_mfa_reenrolled signin_fail signin_lockout].freeze
    RIGHT = { 'staff_no' => 'A-1042', 'manager' => 'Dana Pryce' }.freeze

    def build(helpdesk: true)
      data = KeyringLoginScenario.scenario
      if helpdesk
        data['logSources'] = { 'desk' => { 'title' => 'Desk', 'events' => EVENTS } }
        data['helpdesks'] = { 'it_desk' => { 'npc' => 'ria', 'verify' => 'questions', 'questions' => %w[staff_no manager],
                                             'minCorrect' => 2, 'maxTries' => 3, 'resets' => %w[password mfa],
                                             'questionLabels' => { 'staff_no' => 'Staff number', 'manager' => 'Line manager' } } }
        npcs = data['rooms']['lobby']['npcs']
        npcs << { 'id' => 'ria', 'displayName' => 'Ria Desk', 'npcType' => 'person', 'position' => { 'x' => 6, 'y' => 2 } }
        npcs.find { |n| n['id'] == 'sam' }['creds'].merge!('resetPassword' => SAM_RESET, 'recovery' => RIGHT.dup)
      end
      data['policies']['strict'] = { 'maxAttempts' => 3 }
      data['rooms']['desk_room']['objects'].find { |o| o['id'] == 'sam_pc' }['policy'] = 'strict'
      build_network_game({ 'encounteredNPCs' => %w[ria sam lena ian] }, data)
    end

    setup do
      travel_to T0
      build
    end

    teardown { travel_back }

    def state
      @game.reload.player_state
    end

    def sign_in(password, pc = 'sam_pc')
      post game_path('login'), params: { pc_id: pc, username: 'sokafor', password: password }, as: :json
      response.parsed_body
    end

    def grant_password
      res = @game.request_helpdesk!('it_desk', 'sokafor', 'password', RIGHT, nil)
      assert_equal :ok, res[:status]
    end

    test 'before a reset the resetPassword is refused and the authored one signs in' do
      assert_equal false, sign_in(SAM_RESET)['success']
      assert_equal true, sign_in(NS::SAM_PASSWORD)['success']
      assert_nil state['accountResets']&.dig('sam', 'typed')
    end

    test 'after a reset the old password is refused and counted, the new one signs in and sets typed' do
      grant_password
      before = state['loginFailures'].values.sum { |v| v.is_a?(Hash) ? v['n'].to_i : v.to_i }
      assert_equal false, sign_in(NS::SAM_PASSWORD)['success']
      after = state['loginFailures'].values.sum { |v| v.is_a?(Hash) ? v['n'].to_i : v.to_i }
      assert_operator after, :>, before
      assert_nil state['accountResets']['sam']['typed']
      assert_equal true, sign_in(SAM_RESET)['success']
      assert_equal true, state['accountResets']['sam']['typed']
    end

    test 'a lockout cleared by a grant lets the new password in at the once-locked PC' do
      3.times { sign_in('wrong-guess-1') }
      assert_equal true, sign_in(SAM_RESET)['lockedOut']
      assert_not_empty state['loginLockouts']
      grant_password
      assert_empty state['loginLockouts']
      assert_equal true, sign_in(SAM_RESET)['success']
    end

    test 'the bootstrap has helpdeskForms with exactly three keys per desk and no helpdesks' do
      get game_path('scenario'), as: :json
      assert_response :success
      body = response.parsed_body
      assert_not body.key?('helpdesks')
      forms = body['helpdeskForms']
      assert_equal %w[it_desk], forms.keys
      assert_equal %w[npc questionLabels resets], forms['it_desk'].keys.sort
      assert_not_includes response.body, SAM_RESET
      assert_not_includes response.body, 'A-1042'
    end

    test 'a scenario with no desk has neither key' do
      build(helpdesk: false)
      get game_path('scenario'), as: :json
      body = response.parsed_body
      assert_not body.key?('helpdesks')
      assert_not body.key?('helpdeskForms')
    end

    test 'a forged sync body carrying accountResets or helpdeskTries changes nothing' do
      before = [state['accountResets'], state['helpdeskTries']]
      put sync_state_game_url(@game), params: { accountResets: { 'sam' => { 'password' => true } },
                                                helpdeskTries: { 'it_desk|sokafor' => { 'n' => 99, 'seq' => 1 } } }, as: :json
      assert_equal before, [state['accountResets'], state['helpdeskTries']]
      assert_equal false, sign_in(SAM_RESET)['success']
    end
  end
end
