require 'test_helper'
require_relative '../../support/keyring_login_scenario'

module BreakEscape
  # S8a unit 17: a saved connection stands in for the typed password, so it owes the second step
  # too. Refused with typeToSignIn and nothing written; tokens and assist invites are untouched.
  class MfaKeyringTest < ActiveSupport::TestCase
    KS = KeyringLoginScenario
    NS = NetworkModelScenario
    T0 = Time.zone.at(1_800_000_000)

    def build(kind: 'code', extra_state: {}, creds: {})
      data = KS.scenario
      data['policies']['gate'] = { 'mfa' => kind, 'remote' => 'allowed', 'maxAttempts' => 50 }
      data['rooms']['desk_room']['objects'].find { |o| o['id'] == 'sam_pc' }['policy'] = 'gate'
      data['rooms']['desk_room']['objects'].find { |o| o['id'] == 'jake_pc' }['policy'] = 'gate'
      data['rooms']['lobby']['objects'] << { 'id' => 'sam_fob', 'type' => 'code_device', 'name' => 'Fob',
                                             'owner' => 'sam', 'takeable' => true }
      data['rooms']['lobby']['objects'] << { 'id' => 'sam_gate_file', 'type' => 'text_file', 'name' => 'Sam.rdp',
                                             'takeable' => true, 'credential' => 'sam_gate_rdp', 'text' => 'Saved.' }
      data['credentials']['sam_gate_rdp'] = { 'kind' => 'saved_connection', 'account' => 'sam',
                                              'connectsTo' => 'sam_pc', 'proof' => { 'held' => 'sam_gate_file' } }
      data['credentials']['sam_gate_tech'] = { 'kind' => 'saved_connection', 'account' => 'sam',
                                               'connectsTo' => 'sam_pc',
                                               'proof' => { 'technique_card' => 'print01.admin_page.factory_login' } }
      data['credentials']['sam_gate_token'] = { 'kind' => 'token', 'account' => 'sam', 'connectsTo' => 'sam_pc',
                                                'expiresMin' => 30, 'proof' => { 'foothold' => 'jack_comms_port' } }
      state = { 'currentRoom' => 'lobby', 'inventory' => [KS.held('jake_assist_code'), gate_item],
                'footholds' => KS.office_foothold }.merge(extra_state)
      game = create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                                scenario: data, player_state: state)
      creds.each { |k, v| game.scenario_data['credentials'][k].merge!(v) }
      game
    end

    def gate_item
      { 'id' => 'sam_gate_file', 'type' => 'text_file', 'name' => 'Sam.rdp', 'credential' => 'sam_gate_rdp' }
    end

    setup do
      travel_to T0
      @game = build
    end

    teardown { travel_back }

    def refused(res)
      assert_equal :unprocessable_entity, res[:status], res.inspect
      assert_equal({ success: false, typeToSignIn: 'second_step' }, res[:body])
    end

    def assert_nothing_moved(game = @game)
      assert_nil((game.player_state['sessions'] || {})['sam_pc'])
      assert_empty game.player_state['mfaPending'] || {}
      assert_empty game.player_state['loginFailures'] || {}
      assert_empty(game.log_rows_for('mfa').select { |r| r['event'].start_with?('mfa_') })
    end

    test 'refused over a foothold at a code PC, nothing moved' do
      refused @game.attempt_credential_login!('sam_pc', 'sam_gate_rdp', { foothold: KS::OFFICE })
      assert_nothing_moved
    end

    test 'refused for a push and a number-matching PC' do
      %w[push push_number_match].each do |kind|
        game = build(kind: kind)
        refused game.attempt_credential_login!('sam_pc', 'sam_gate_rdp', { foothold: KS::OFFICE })
        assert_nothing_moved game
      end
    end

    test 'a locked-out account still answers lockedOut' do
      @game.player_state['loginLockouts'] = ['sam_pc|sokafor']
      res = @game.attempt_credential_login!('sam_pc', 'sam_gate_rdp', { foothold: KS::OFFICE })
      assert res[:body][:lockedOut], res.inspect
      assert_nil res[:body][:typeToSignIn]
    end

    test 'an exempt account signs in with its saved connection' do
      sam = @game.scenario_data['rooms'].values.flat_map { |r| r['npcs'] || [] }.find { |n| n['id'] == 'sam' }
      sam['creds']['mfa'] = false
      res = @game.attempt_credential_login!('sam_pc', 'sam_gate_rdp', { foothold: KS::OFFICE })
      assert_equal :ok, res[:status], res.inspect
      assert @game.player_state['sessions']['sam_pc']
    end

    test 'an assist invite is untouched' do
      res = @game.attempt_credential_login!('jake_pc', 'jake_assist', { relay: true })
      assert_equal :ok, res[:status], res.inspect
      assert_empty @game.player_state['mfaPending'] || {}
    end

    test 'a token signs in at once' do
      @game.player_state['inventory'] = [gate_item]
      res = @game.attempt_credential_login!('sam_pc', 'sam_gate_token', { foothold: 'jack_comms_port' })
      assert_equal :ok, res[:status], res.inspect
      assert @game.player_state['sessions']['sam_pc']
      assert_empty @game.player_state['mfaPending'] || {}
    end

    test 'a technique session opens with no pending record' do
      sam = @game.scenario_room_npc('sam')
      @game.send(:start_login_session!, 'sam_pc', sam, 'technique', foothold: KS::OFFICE, technique: 'f1')
      assert @game.player_state['sessions']['sam_pc']
      assert_empty @game.player_state['mfaPending'] || {}
    end

    test 'a saved connection granted by a technique is refused, then the typed password owes the step' do
      @game.player_state['opsUsed'] = ['print01.admin_page.factory_login']
      refused @game.attempt_credential_login!('sam_pc', 'sam_gate_tech', { foothold: KS::OFFICE })
      assert_nothing_moved
      res = @game.attempt_login!('sam_pc', 'sokafor', NS::SAM_PASSWORD, foothold: KS::OFFICE)
      assert_equal true, res[:body][:mfaRequired], res.inspect
    end

    test 'at a PC with no mfa a saved connection is unchanged' do
      @game.scenario_data['policies']['gate'].delete('mfa')
      res = @game.attempt_credential_login!('sam_pc', 'sam_gate_rdp', { foothold: KS::OFFICE })
      assert_equal :ok, res[:status], res.inspect
      assert @game.player_state['sessions']['sam_pc']
    end
  end
end
