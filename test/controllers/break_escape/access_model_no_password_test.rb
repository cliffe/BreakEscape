require 'test_helper'
require_relative '../../support/access_model_scenario'

module BreakEscape
  # The no-password test (ACCESS_MODEL_PLAN.md section 6), over the routes that exist
  # at step 2: GET /scenario, GET /room/:id, a door POST /unlock and GET
  # /capture_secrets (with no entry, and with a forged entry for an NPC that has no
  # capture route). No response carries an NPC password, a sign-in PC's contents or
  # an account profile. Step 3 adds /login_accounts and /container/:id signed out.
  class AccessModelNoPasswordTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    SECRETS = (AccessModelScenario::PASSWORDS + [AccessModelScenario::PC_LOCAL_MARKER, AccessModelScenario::PROFILE_MARKER]).freeze

    def build(player_state = {})
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: AccessModelScenario.scenario,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'] }.merge(player_state)
      )
    end

    def assert_no_secrets(context)
      SECRETS.each { |secret| refute_includes response.body, secret, "#{context} leaks #{secret}" }
    end

    test 'GET /scenario carries no password, profile or sign-in PC contents' do
      build
      get scenario_game_url(@game), as: :json
      assert_response :success
      assert_no_secrets('/scenario')
      refute response.parsed_body.key?('accountProfiles')
      assert_equal 'corp_default', response.parsed_body['defaultPolicy']
    end

    test 'GET /room/:id carries no password and keeps the card' do
      build
      get room_game_url(@game, room_id: 'lobby'), as: :json
      assert_response :success
      assert_no_secrets('/room/lobby')
      assert_equal AccessModelScenario::LEN_CARD, response.parsed_body['room']['npcs'][0]['rfidCard']

      @game.unlock_room!('finance')
      get room_game_url(@game, room_id: 'finance'), as: :json
      assert_response :success
      assert_no_secrets('/room/finance')
      jake = response.parsed_body['room']['npcs'].find { |n| n['id'] == 'jake' }
      assert_equal AccessModelScenario::JAKE_CARD, jake['rfidCard']
      pc = response.parsed_body['room']['objects'].find { |o| o['id'] == 'jake_pc' }
      assert_equal true, pc['hasContents']
    end

    test 'a door unlock carries no password in its room data' do
      build
      post unlock_game_url(@game), params: { targetType: 'door', targetId: 'finance', attempt: '4321', method: 'pin' }, as: :json
      assert_response :success, response.body
      assert response.parsed_body['roomData']['npcs'].any?, 'the unlock returned the room data'
      assert_no_secrets('door /unlock')
    end

    test 'an NPC moved by update_room is withheld in the room it joins' do
      build('unlockedRooms' => %w[lobby finance])
      post update_room_game_url(@game), params: { roomId: 'finance', actionType: 'move_npc',
                                                  data: { npcId: 'jake', fromRoom: 'finance', toRoom: 'lobby' } }, as: :json
      assert_response :success, response.body
      get room_game_url(@game, room_id: 'lobby'), as: :json
      assert_response :success
      assert response.parsed_body['room']['npcs'].any? { |n| n['id'] == 'jake' }, 'Jake joined the lobby'
      assert_no_secrets('/room/lobby after move_npc')
    end

    test 'GET /capture_secrets with no entry serves nothing' do
      build
      get capture_secrets_game_url(@game), as: :json
      assert_response :success
      assert_equal({ 'secrets' => {} }, response.parsed_body)
      assert_no_secrets('/capture_secrets, no entry')
    end

    test 'GET /capture_secrets with a forged entry for an NPC with no capture route serves nothing' do
      build('globalVariables' => { 'se_captures' => {
        'dana' => { 'targetId' => 'dana', 'kind' => 'credential', 'address' => 'dwhite', 'at' => 1 }
      } })
      get capture_secrets_game_url(@game), as: :json
      assert_response :success
      assert_equal({ 'secrets' => {} }, response.parsed_body)
      assert_no_secrets('/capture_secrets, forged entry')
    end

    test 'GET /capture_secrets serves the password of an account holder with a capture route once earned' do
      build('globalVariables' => { 'se_captures' => {
        'jake' => { 'targetId' => 'jake', 'kind' => 'credential', 'address' => 'jbrooks', 'at' => 1 }
      } })
      get capture_secrets_game_url(@game), as: :json
      assert_response :success
      assert_equal({ 'secrets' => { 'jake' => AccessModelScenario::JAKE_PASSWORD } }, response.parsed_body)
      refute_includes response.body, AccessModelScenario::DANA_PASSWORD
    end
  end
end
