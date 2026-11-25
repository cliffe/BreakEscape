# frozen_string_literal: true

require 'test_helper'
require_relative '../../support/access_model_scenario'

module BreakEscape
  # Ops S5bc unit 17 (S5c): the sign-in picker's account tiles. An account-only account (no person
  # behind it) has no tile on any PC; a kind that does not admit it at a PC hides its tile there.
  class LoginTilesTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    def npc(data, id)
      data['rooms'].values.flat_map { |r| Array(r['npcs']) }.find { |n| n['id'] == id }
    end

    def build(data)
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user), scenario: data,
        player_state: { 'currentRoom' => 'finance', 'unlockedRooms' => %w[lobby finance] }
      )
    end

    def usernames(pc_id)
      get login_accounts_game_url(@game), params: { pc_id: pc_id }
      assert_response :success
      response.parsed_body['loginAccounts'].map { |t| t['username'] }
    end

    test 'an unmarked scenario lists the same tiles as before' do
      build(AccessModelScenario.routes_scenario)
      assert_equal %w[jbrooks DWhite], usernames('jake_pc')
      assert_equal %w[DWhite], usernames('it_pc')
    end

    test 'an account-only account has no tile on any PC, and the others stay' do
      data = AccessModelScenario.routes_scenario
      npc(data, 'jake')['accountOnly'] = true
      build(data)
      assert_equal %w[DWhite], usernames('jake_pc')
      assert_equal %w[DWhite], usernames('it_pc')
    end

    test 'only accountOnly true hides a tile' do
      data = AccessModelScenario.routes_scenario
      npc(data, 'jake')['accountOnly'] = 'true'
      build(data)
      assert_equal %w[jbrooks DWhite], usernames('jake_pc')
    end

    test 'a kind that refuses a PC hides the tile there only' do
      data = AccessModelScenario.routes_scenario
      npc(data, 'jake')['creds'].merge!('accountKind' => 'local', 'localTo' => %w[profile_pc])
      build(data)
      assert_equal %w[DWhite], usernames('jake_pc')
    end

    test 'the tile keys are unchanged' do
      build(AccessModelScenario.routes_scenario)
      get login_accounts_game_url(@game), params: { pc_id: 'jake_pc' }
      response.parsed_body['loginAccounts'].each { |t| assert_equal %w[avatar displayName portrait username], t.keys.sort }
    end
  end
end
