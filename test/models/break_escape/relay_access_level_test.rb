require 'test_helper'
require_relative '../../support/keyring_login_scenario'
require_relative '../../support/network_ops_scenario'

module BreakEscape
  # Ops S5bc unit 02 (owner ruling B): a relayed session has exactly the rights of the account that
  # was relayed. `session_access` reads a relay record like any credential record (the account, at
  # the PC's access list); a claim stays user. A relay still never feeds a step up and is never a
  # keyboard admin. The relay sign-in goes through the real route; records no route writes with the
  # wanted shape are set by hand and say so.
  class RelayAccessLevelTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    KS = KeyringLoginScenario
    OFFICE = KS::OFFICE

    def scenario(admins: %w[jake])
      data = KS.scenario
      data['rooms'].each_value do |room|
        Array(room['npcs']).each do |npc|
          npc['creds']['admin'] = true if npc['creds'].is_a?(Hash) && admins.include?(npc['id'])
        end
      end
      data
    end

    def build(data = scenario)
      build_network_game({ 'encounteredNPCs' => %w[sam lena ian jake], 'footholds' => KS.office_foothold,
                           'inventory' => [KS.held('jake_assist_code')] }, data)
    end

    def game
      @game.reload
    end

    def level(pc_id = 'jake_pc')
      game.session_access(pc_id)
    end

    def relay_in
      post game_path('login'), params: { pc_id: 'jake_pc', credential: 'jake_assist', relay: true }, as: :json
      response.parsed_body
    end

    # A record set by hand (no route writes it with this shape).
    def set_session(record, pc_id = 'jake_pc')
      @game.reload
      @game.player_state['sessions'] = (@game.player_state['sessions'] || {}).merge(pc_id => record)
      @game.save!
    end

    def relay_record(id = 'jake')
      { 'id' => id, 'via' => 'credential', 'credential' => 'jake_assist', 'relay' => true }
    end

    test 'a relay of an admin account admitted at the PC reads admin, and the answer says so' do
      build
      body = relay_in
      assert body['success'], body.to_s
      assert_equal true, game.player_state['sessions']['jake_pc']['relay']
      assert_equal 'admin', level
      assert_equal 'admin', body['access']
      assert_equal true, body['relay']
      assert_equal 'admin', game.send(:session_for_client, 'jake_pc')['access']
    end

    test 'a relay of a non-admin account reads user and the answer carries no access' do
      build(scenario(admins: []))
      body = relay_in
      assert body['success'], body.to_s
      assert_equal 'user', level
      refute body.key?('access')
      refute game.send(:session_for_client, 'jake_pc').key?('access')
    end

    test 'a relay of an admin account the PC access list refuses reads user' do
      build
      # the PC's list does not name jake; the record is set by hand because the route would refuse it
      set_session(relay_record)
      assert_equal 'admin', level, 'admitted before the list changes'
      @game.reload
      @game.scenario_data['rooms'].each_value do |room|
        Array(room['objects']).each { |o| o['access'] = { 'people' => ['sam'] } if o['id'] == 'jake_pc' }
      end
      @game.save!
      set_session(relay_record)
      assert_equal 'user', level
      refute game.send(:session_for_client, 'jake_pc').key?('access')
    end

    test 'a claim of an admin account reads user' do
      build
      set_session({ 'id' => 'jake', 'via' => 'claim' })
      assert_equal 'user', level
      set_session({ 'id' => 'jake', 'via' => 'claim', 'relay' => true })
      assert_equal 'user', level
    end

    test 'a relay admin meets no session need at either level and is no keyboard admin' do
      build
      assert relay_in['success']
      assert_equal 'admin', level
      %w[user admin].each do |lvl|
        assert_equal false, game.send(:ops_need_session, 'jake_pc', lvl)['met'], lvl
      end
      assert_equal false, game.keyboard_admin?('jake_pc')
      assert_equal true, game.session_admin?('jake_pc')
    end

    test 'the relay session is otherwise what it was' do
      build
      body = relay_in
      record = game.player_state['sessions']['jake_pc']
      assert_equal %w[credential id relay via].sort, record.keys.sort
      refute game.player_state.fetch('signedInPcs', []).include?('jake_pc')
      assert_equal 'Jake Brooks', body['displayName']
      assert_equal 'credential', body['via']
    end

    test 'an ended invite reads nil' do
      build
      assert relay_in['success']
      @game.reload
      @game.player_state['endedCredentials'] = ['jake_assist']
      @game.save!
      assert_nil level
      refute game.send(:session_for_client, 'jake_pc')&.key?('access')
    end
  end
end
