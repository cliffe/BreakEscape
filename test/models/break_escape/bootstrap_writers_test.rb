require 'test_helper'
require_relative '../../support/keyring_login_scenario'

module BreakEscape
  # Keyring K2 (docs/achitechture/CREDENTIAL_KEYRING_PLAN.md 7.1 and 7.3): the bootstrap writer
  # record_credential_end_globals! and its term credential_end_globals_stale?. A fresh game of a
  # scenario with an endsOnGlobal and no other bootstrap work writes the cached map; a scenario
  # without one never writes it.
  class BootstrapWritersTest < ActiveSupport::TestCase
    KS = KeyringLoginScenario

    def make_game(scenario, player_state = {})
      create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: { 'currentRoom' => 'lobby' }.merge(player_state)
      )
    end

    def expected_map
      { KS::END_GLOBAL => ['jake_assist'] }
    end

    test 'a fresh game with an endsOnGlobal and no other bootstrap work writes credentialEndGlobals' do
      game = make_game(KS.scenario)
      game.reload
      assert_equal({}, game.player_state['credentialEndGlobals'])
      assert game.send(:bootstrap_state_needs_write?), 'the end-global term alone must make the bootstrap write'

      game.prepare_bootstrap_state!
      game.reload
      assert_equal expected_map, game.player_state['credentialEndGlobals']
      assert_equal [], game.player_state['endedCredentials']
      refute game.send(:bootstrap_state_needs_write?), 'a written map is not stale again'
    end

    test 'a scenario without an endsOnGlobal never writes the map' do
      scenario = KS.scenario
      scenario['credentials']['jake_assist'].delete('endsOnGlobal')
      game = make_game(scenario)
      refute game.credential_end_globals_stale?
      refute game.record_credential_end_globals!
      game.prepare_bootstrap_state!
      assert_equal({}, game.reload.player_state['credentialEndGlobals'])
    end

    test 'a missing map (a game saved before the key) is stale and is written' do
      game = make_game(KS.scenario)
      game.player_state.delete('credentialEndGlobals')
      game.save!
      game.reload
      assert game.credential_end_globals_stale?
      game.prepare_bootstrap_state!
      assert_equal expected_map, game.reload.player_state['credentialEndGlobals']
    end

    test 'a map that differs from the scenario is rewritten' do
      game = make_game(KS.scenario, 'credentialEndGlobals' => { 'old_global' => ['jake_assist'] })
      assert game.credential_end_globals_stale?
      game.prepare_bootstrap_state!
      assert_equal expected_map, game.reload.player_state['credentialEndGlobals']
    end

    test 'the writer ends an invite whose global was already true before the cache existed' do
      game = make_game(KS.scenario,
                       'globalVariables' => { KS::END_GLOBAL => true },
                       'sessions' => { 'jake_pc' => { 'id' => 'jake', 'via' => 'credential',
                                                      'credential' => 'jake_assist', 'relay' => true } })
      game.prepare_bootstrap_state!
      state = game.reload.player_state
      assert_equal ['jake_assist'], state['endedCredentials']
      refute state['sessions'].key?('jake_pc')
    end

    test 'the end check is grow-only and leaves non-relay sessions alone' do
      game = make_game(KS.scenario,
                       'credentialEndGlobals' => expected_map,
                       'endedCredentials' => ['other_cred'],
                       'globalVariables' => { KS::END_GLOBAL => true },
                       'sessions' => { 'lena_pc' => { 'id' => 'lena', 'via' => 'credential', 'credential' => 'jake_assist',
                                                      'foothold' => KS::OFFICE } })
      assert_equal [], game.apply_credential_end_globals!
      assert_equal %w[other_cred jake_assist], game.player_state['endedCredentials']
      assert game.player_state['sessions'].key?('lena_pc'), 'only relay sessions are ended'
      assert_nil game.apply_credential_end_globals!, 'a second pass changes nothing'
    end

    test 'endedCredentials never grows past 64' do
      full = (1..64).map { |i| "cred_#{i}" }
      game = make_game(KS.scenario, 'credentialEndGlobals' => expected_map, 'endedCredentials' => full,
                                    'globalVariables' => { KS::END_GLOBAL => true })
      assert_nil game.apply_credential_end_globals!
      assert_equal 64, game.player_state['endedCredentials'].size
    end
  end
end
