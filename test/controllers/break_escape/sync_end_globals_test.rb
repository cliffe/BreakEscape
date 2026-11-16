require 'test_helper'
require_relative '../../support/keyring_login_scenario'

module BreakEscape
  # Keyring K2 (docs/achitechture/CREDENTIAL_KEYRING_PLAN.md 7.1, 7.3 and 7.5): the sync merge ends
  # an invite from the cached credentialEndGlobals alone, with no scenario_data query on the narrow
  # sync load; the answer names the ended relay PCs once; a sync before any bootstrap records
  # nothing, and the next bootstrap ends the invite. Neither server key is read from a sync body or
  # sent to the client.
  class SyncEndGlobalsTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    KS = KeyringLoginScenario

    def build(player_state = {})
      build_network_game({ 'encounteredNPCs' => %w[sam lena ian jake] }.merge(player_state), KS.scenario)
    end

    def state
      @game.reload.player_state
    end

    def hold(*ids)
      @game.player_state['inventory'] = Array(@game.player_state['inventory']) + ids.map { |id| KS.held(id) }
      @game.save!
    end

    def open_relay
      post game_path('login'), params: { pc_id: 'jake_pc', credential: 'jake_assist', relay: true }, as: :json
      assert_response :success, response.body
    end

    # The same subscriber as capture_proofs_test.rb: full scenario_data column loads only.
    def count_scenario_loads
      count = 0
      sub = ActiveSupport::Notifications.subscribe('sql.active_record') do |*, payload|
        sql = payload[:sql].to_s
        count += 1 if sql.start_with?('SELECT') && sql.include?('"scenario_data"') && !sql.include?('*')
      end
      yield
      count
    ensure
      ActiveSupport::Notifications.unsubscribe(sub) if sub
    end

    test 'the sync merge ends the invite with no scenario_data query and names the relay PC once' do
      build
      hold('jake_assist_code')
      bootstrap_scenario
      assert_equal({ KS::END_GLOBAL => ['jake_assist'] }, state['credentialEndGlobals'])
      open_relay

      body = nil
      loads = count_scenario_loads { body = sync_globals(KS::END_GLOBAL => true) }
      assert_response :success
      assert_equal 0, loads, 'the end check reads only the cached map'
      assert_equal ['jake_pc'], body['endedRelayPcIds']
      assert_includes state['endedCredentials'], 'jake_assist'
      refute state['sessions'].key?('jake_pc')

      again = sync_globals(KS::END_GLOBAL => true)
      refute again.key?('endedRelayPcIds'), 'each ended relay is named once'

      post game_path('login'), params: { pc_id: 'jake_pc', credential: 'jake_assist', relay: true }, as: :json
      assert_response :unprocessable_entity
      assert_equal true, response.parsed_body['ended']
    end

    test 'an ordinary sync answer carries no endedRelayPcIds' do
      build
      bootstrap_scenario
      body = sync_globals(KS::JAKE_OFF_GLOBAL => false)
      assert_response :success
      refute body.key?('endedRelayPcIds')
    end

    test 'ending an invite with no relay session open records the end and sends no PC ids' do
      build
      bootstrap_scenario
      body = sync_globals(KS::END_GLOBAL => true)
      refute body.key?('endedRelayPcIds')
      assert_equal ['jake_assist'], state['endedCredentials']
    end

    test 'a sync before any bootstrap records nothing; the next bootstrap ends the invite' do
      build
      hold('jake_assist_code')
      open_relay
      assert_equal({}, state['credentialEndGlobals'])

      body = sync_globals(KS::END_GLOBAL => true)
      refute body.key?('endedRelayPcIds')
      assert_equal [], state['endedCredentials']

      bootstrap_scenario
      assert_equal ['jake_assist'], state['endedCredentials']
      post game_path('login'), params: { pc_id: 'jake_pc', credential: 'jake_assist', relay: true }, as: :json
      assert_response :unprocessable_entity
    end

    test 'a sync body naming the server keys changes neither, and the bootstrap sends neither' do
      build
      bootstrap_scenario
      put game_path('sync_state'),
          params: { endedCredentials: [], credentialEndGlobals: { 'x' => ['jake_assist'] },
                    globalVariables: { KS::END_GLOBAL => true } }, as: :json
      assert_response :success
      assert_equal ['jake_assist'], state['endedCredentials']
      assert_equal({ KS::END_GLOBAL => ['jake_assist'] }, state['credentialEndGlobals'])

      body = bootstrap_scenario.to_json
      refute_includes body, 'endedCredentials'
      refute_includes body, 'credentialEndGlobals'
    end
  end
end
