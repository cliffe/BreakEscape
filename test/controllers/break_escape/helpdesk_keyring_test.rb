require 'test_helper'
require_relative '../../support/keyring_login_scenario'
require_relative '../../support/helpdesk_answer_shapes'

module BreakEscape
  # S8b unit 12: a desk's password reset is a keyring entry, and a saved connection made before the
  # reset no longer signs in until the new password has been typed. Time frozen.
  class HelpdeskKeyringTest < ActionDispatch::IntegrationTest
    include HelpdeskAnswerShapes

    KS = KeyringLoginScenario
    NS = NetworkModelScenario
    T0 = Time.zone.at(1_800_000_000)
    SAM_RESET = 'Tern-Harbour-41'.freeze
    RIGHT = { 'staff_no' => 'A-1042', 'manager' => 'Dana Pryce' }.freeze
    EVENTS = %w[helpdesk_request account_password_reset account_mfa_reenrolled signin_fail signin_lockout].freeze
    Answer = Struct.new(:status, :parsed_body)

    def build(mfa: nil)
      data = KS.scenario
      data['logSources'] = { 'desk' => { 'title' => 'Desk', 'events' => EVENTS } }
      data['helpdesks'] = { 'it_desk' => { 'npc' => 'ria', 'verify' => 'questions', 'questions' => %w[staff_no manager],
                                           'minCorrect' => 2, 'maxTries' => 3, 'resets' => %w[password mfa],
                                           'questionLabels' => { 'staff_no' => 'Staff number', 'manager' => 'Line manager' } } }
      npcs = data['rooms']['lobby']['npcs']
      npcs << { 'id' => 'ria', 'displayName' => 'Ria Desk', 'npcType' => 'person', 'position' => { 'x' => 6, 'y' => 2 } }
      npcs.find { |n| n['id'] == 'sam' }['creds'].merge!('resetPassword' => SAM_RESET, 'recovery' => RIGHT)
      data['policies']['gate'] = { 'remote' => 'allowed', 'maxAttempts' => 50 }
      data['policies']['gate']['mfa'] = mfa if mfa
      data['rooms']['desk_room']['objects'].find { |o| o['id'] == 'sam_pc' }['policy'] = 'gate'
      data['rooms']['lobby']['objects'] << { 'id' => 'sam_fob', 'type' => 'code_device', 'name' => 'Fob', 'owner' => 'sam',
                                             'takeable' => true }
      data['rooms']['lobby']['objects'] << { 'id' => 'sam_gate_file', 'type' => 'text_file', 'name' => 'Sam.rdp',
                                             'takeable' => true, 'credential' => 'sam_gate_rdp', 'text' => 'Saved.' }
      data['credentials']['sam_gate_rdp'] = { 'kind' => 'saved_connection', 'account' => 'sam', 'connectsTo' => 'sam_pc',
                                              'proof' => { 'held' => 'sam_gate_file' } }
      data['credentials']['sam_gate_token'] = { 'kind' => 'token', 'account' => 'sam', 'connectsTo' => 'sam_pc',
                                                'expiresMin' => 30, 'proof' => { 'foothold' => 'jack_comms_port' } }
      state = { 'currentRoom' => 'lobby', 'encounteredNPCs' => %w[ria sam],
                'inventory' => [{ 'id' => 'sam_gate_file', 'type' => 'text_file', 'name' => 'Sam.rdp', 'credential' => 'sam_gate_rdp' }],
                'footholds' => KS.office_foothold }
      create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                         scenario: data, player_state: state)
    end

    setup do
      travel_to T0
      @game = build
    end

    teardown { travel_back }

    def keyring
      get "/break_escape/games/#{@game.id}/keyring", as: :json
      assert_response :success
      response.parsed_body
    end

    def reset_entry(body = keyring)
      body['entries'].find { |e| e['id'] == 'sam.reset' }
    end

    def grant!(game = @game)
      res = game.request_helpdesk!('it_desk', 'sokafor', 'password', RIGHT)
      assert_equal :ok, res[:status], res.inspect
    end

    def sign_in(game = @game)
      game.attempt_credential_login!('sam_pc', 'sam_gate_rdp', { foothold: KS::OFFICE })
    end

    test 'the entry appears after a grant and not before, and the rev moves with it' do
      before = keyring
      assert_nil reset_entry(before)
      grant!
      after = keyring
      entry = reset_entry(after)
      assert entry, 'listed after the grant'
      assert_answer_shape 'keyring.reset_entry', Answer.new(200, entry)
      assert_equal SAM_RESET, entry['password']
      refute_equal before['rev'], after['rev']
    end

    test 'the reset password is in the keyring entry only: not the scenario, capture secrets or log rows' do
      grant!
      assert_equal 1, JSON.generate(keyring).scan(SAM_RESET).size
      %w[scenario capture_secrets].each do |route|
        get "/break_escape/games/#{@game.id}/#{route}", as: :json
        refute_includes response.body, SAM_RESET, route
      end
      get "/break_escape/games/#{@game.id}/log_rows", params: { source: 'desk' }, as: :json
      refute_includes response.body, SAM_RESET, 'log_rows'
    end

    test 'a refused request adds no entry and leaves the rev alone' do
      before = keyring
      @game.request_helpdesk!('it_desk', 'sokafor', 'password', { 'staff_no' => 'x', 'manager' => 'y' })
      assert_equal before, keyring
    end

    test 'the reset password is in no keyring answer before the grant' do
      refute_includes response_text(keyring), SAM_RESET
    end

    def response_text(body)
      JSON.generate(body)
    end

    test 'a saved connection works before a reset, is refused after it, and works once the new password is typed' do
      assert_equal :ok, sign_in[:status]
      @game.player_state['sessions'] = {}
      @game.save!
      grant!
      res = sign_in
      assert_equal :unprocessable_entity, res[:status]
      assert_answer_shape 'keyring.password_changed', Answer.new(422, res[:body].deep_stringify_keys)
      assert_nil @game.player_state['sessions']['sam_pc']
      assert_empty @game.player_state['loginFailures'] || {}
      assert_empty(@game.log_rows_for('mfa'))

      @game.note_typed_sign_in!('sam')
      @game.save!
      assert_equal :ok, sign_in[:status]
      assert @game.player_state['sessions']['sam_pc']
    end

    test 'the typed flag set at any PC frees the saved connection at another' do
      grant!
      @game.note_typed_sign_in!('sam')
      @game.save!
      assert_equal :ok, @game.reload.then { |g| sign_in(g) }[:status]
    end

    test 'at an MFA PC the answer stays second_step' do
      game = build(mfa: 'code')
      game.request_helpdesk!('it_desk', 'sokafor', 'password', RIGHT)
      res = sign_in(game)
      assert_equal({ success: false, typeToSignIn: 'second_step' }, res[:body])
    end

    test 'a token still signs in after a reset' do
      grant!
      res = @game.attempt_credential_login!('sam_pc', 'sam_gate_token', { foothold: 'jack_comms_port' })
      assert_equal :ok, res[:status], res.inspect
    end
  end
end
