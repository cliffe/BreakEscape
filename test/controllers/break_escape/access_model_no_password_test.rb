require 'test_helper'
require_relative '../../support/access_model_scenario'

module BreakEscape
  # The no-password test (ACCESS_MODEL_PLAN.md section 6): GET /scenario, GET
  # /room/:id, a door POST /unlock, GET /capture_secrets (with no entry, and with a
  # forged entry for an NPC that has no capture route), GET /login_accounts and GET
  # /container/:id signed out. No response carries an NPC password, a sign-in PC's
  # contents or an account profile.
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

    test 'GET /login_accounts carries no password' do
      build('unlockedRooms' => %w[lobby finance])
      get login_accounts_game_url(@game), params: { pc_id: 'jake_pc' }
      assert_response :success
      assert_equal %w[jbrooks DWhite], response.parsed_body['loginAccounts'].map { |t| t['username'] }
      assert_no_secrets('/login_accounts')
    end

    test 'GET /container/:id signed out carries no password, PC contents or profile' do
      build('unlockedRooms' => %w[lobby finance], 'unlockedObjects' => %w[jake_pc jake_files_content_1])
      get "/break_escape/games/#{@game.id}/container/jake_pc", as: :json
      assert_response :forbidden
      assert_no_secrets('/container/jake_pc signed out')
      get "/break_escape/games/#{@game.id}/container/jake_files_content_1", as: :json
      assert_response :forbidden
      assert_no_secrets('/container/jake_files_content_1 signed out')
    end

    # Code review R1, M1: an unscoped object without contents that shares a name with a
    # folder under a sign-in PC (or with the PC itself) must not open the generic container
    # path to them.
    FOLDER_MARKER = 'PC-FOLDER-FILE-TEXT'.freeze

    def build_name_collision(lobby_names)
      data = AccessModelScenario.scenario
      data['rooms']['lobby']['objects'] = lobby_names.map { |name| { 'type' => 'notes', 'name' => name, 'text' => 'a note' } }
      pc = data['rooms']['finance']['objects'].find { |o| o['id'] == 'jake_pc' }
      pc['contents'] << { 'type' => 'folder', 'name' => 'Archive folder', 'locked' => false,
                          'contents' => [{ 'type' => 'text_file', 'name' => 'Old.txt', 'text' => FOLDER_MARKER }] }
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: data,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby finance] }
      )
    end

    test 'a name shared with a lobby note does not open a sign-in PC folder with no session' do
      build_name_collision(['Archive folder'])
      post unlock_game_url(@game), params: { targetType: 'object', targetId: 'Archive folder', method: 'unlocked' }, as: :json
      refute_includes response.body, FOLDER_MARKER, '/unlock by a colliding name leaks the PC folder'
      assert_no_secrets('/unlock Archive folder')
      get "/break_escape/games/#{@game.id}/container/#{ERB::Util.url_encode('Archive folder')}", as: :json
      assert response.status >= 400, "GET /container answered #{response.status}: #{response.body}"
      refute_includes response.body, FOLDER_MARKER, '/container by a colliding name leaks the PC folder'
    end

    test "a name shared with a lobby note does not open the sign-in PC's own contents with no session" do
      build_name_collision(["Jake's PC"])
      post unlock_game_url(@game), params: { targetType: 'object', targetId: "Jake's PC", method: 'unlocked' }, as: :json
      assert_no_secrets("/unlock Jake's PC")
      get "/break_escape/games/#{@game.id}/container/#{ERB::Util.url_encode("Jake's PC")}", as: :json
      assert response.status >= 400, "GET /container answered #{response.status}: #{response.body}"
      assert_no_secrets("/container Jake's PC")
    end

    test 'POST /unlock of a scoped folder with no session is refused and carries no contents' do
      build_name_collision([])
      post unlock_game_url(@game), params: { targetType: 'object', targetId: 'Archive folder', method: 'unlocked' }, as: :json
      assert response.status >= 400, "/unlock answered #{response.status}"
      refute_includes response.body, FOLDER_MARKER
      assert_no_secrets('/unlock scoped folder')
      refute_includes Array(@game.reload.player_state['unlockedObjects']), 'Archive folder'
    end

    test 'POST /inventory add of a sign-in PC file with no session is refused and carries no text' do
      build('unlockedRooms' => %w[lobby finance])
      post inventory_game_url(@game), params: { action_type: 'add',
                                                item: { type: 'text_file', name: 'Local.txt' } }, as: :json
      assert response.status >= 400, "/inventory answered #{response.status}"
      assert_no_secrets('/inventory add, no source PC')
      post inventory_game_url(@game), params: { action_type: 'add', source_pc_id: 'jake_pc', transfer: 'move',
                                                item: { type: 'text_file', name: 'Local.txt' } }, as: :json
      assert response.status >= 400, "/inventory answered #{response.status}"
      assert_no_secrets('/inventory add from jake_pc, no session')
      refute(Array(@game.reload.player_state['inventory']).any? { |i| i['name'] == 'Local.txt' })
    end

    test 'failed sign-ins carry no password' do
      build('unlockedRooms' => %w[lobby finance])
      [['jbrooks', 'wrong'], ['jbrooks', AccessModelScenario::JAKE_PASSWORD.downcase], ['nobody', 'x']].each do |username, password|
        post login_game_url(@game), params: { pc_id: 'jake_pc', username: username, password: password }, as: :json
        assert_response :unprocessable_entity
        assert_no_secrets("/login as #{username}")
      end
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
