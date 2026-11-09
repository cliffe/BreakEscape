require 'test_helper'
require_relative '../../support/access_model_scenario'

module BreakEscape
  # Access model step 3 (ACCESS_MODEL_PLAN.md section 6): POST /login (password and
  # claim), POST /logout, GET /login_accounts, the sessions in the scenario response,
  # the reset and an unlock_object task on a sign-in PC.
  class AccessModelLoginTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    JAKE_PASSWORD = AccessModelScenario::JAKE_PASSWORD
    DANA_PASSWORD = AccessModelScenario::DANA_PASSWORD
    INCORRECT = 'Incorrect username or password'.freeze

    def build(scenario: AccessModelScenario.routes_scenario, player_state: {})
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: { 'currentRoom' => 'finance', 'unlockedRooms' => %w[lobby finance] }.merge(player_state)
      )
    end

    def login(username, password, pc_id: 'jake_pc')
      post login_game_url(@game), params: { pc_id: pc_id, username: username, password: password }, as: :json
      response.parsed_body
    end

    def claim(pc_id = 'jake_pc')
      post login_game_url(@game), params: { pc_id: pc_id, claim: 'owner',
                                            globals: { "#{pc_id}_screen_locked" => false, "#{pc_id}_owner_away" => true } }, as: :json
      response.parsed_body
    end

    def open_desktop(pc_id = 'jake_pc')
      get "/break_escape/games/#{@game.id}/container/#{pc_id}", as: :json
    end

    # Jake tracked by the needs system, so the claim's owner checks pass.
    def tracked_scenario(owner_fields = { 'needs' => { 'coffee' => { 'decayPerMin' => 30, 'urgentAt' => 40 } } })
      data = AccessModelScenario.routes_scenario
      jake = data['rooms']['finance']['npcs'].find { |n| n['id'] == 'jake' }
      jake.merge!(owner_fields)
      yield data if block_given?
      data
    end

    def jake_pc(data)
      data['rooms']['finance']['objects'].find { |o| o['id'] == 'jake_pc' }
    end

    # ---- password sign-in ----------------------------------------------------------

    test 'a correct password signs in and answers the session' do
      build
      body = login('jbrooks', JAKE_PASSWORD)
      assert_response :success
      assert_equal({ 'success' => true, 'npcId' => 'jake', 'username' => 'jbrooks', 'displayName' => 'Jake Brooks', 'via' => 'password' }, body)
      state = @game.reload.player_state
      assert_equal({ 'id' => 'jake', 'via' => 'password' }, state['sessions']['jake_pc'])
      assert_equal ['jake_pc'], state['signedInPcs']
      refute_includes state['unlockedObjects'], 'jake_pc'
    end

    test 'usernames match trimmed and case-insensitively' do
      build
      body = login('  JBrooks ', JAKE_PASSWORD)
      assert_response :success
      assert_equal 'jake', body['npcId']
      body = login('dwhite', DANA_PASSWORD, pc_id: 'profile_pc')
      assert_response :success
      assert_equal 'DWhite', body['username']
    end

    test 'an unknown username and a wrong password answer alike, with the same attemptsLeft' do
      build
      wrong = (1..4).map { login('jbrooks', 'nope') }
      unknown = (1..4).map { login('nobody', 'nope') }
      assert_equal wrong, unknown
      assert_equal [4, 3, 2, 1], wrong.map { |b| b['attemptsLeft'] }
      wrong.each { |b| assert_equal({ 'success' => false, 'message' => INCORRECT, 'attemptsLeft' => b['attemptsLeft'] }, b) }
    end

    test 'a password right apart from letter case answers as a wrong one' do
      build
      body = login('jbrooks', JAKE_PASSWORD.swapcase)
      assert_response :unprocessable_entity
      assert_equal({ 'success' => false, 'message' => INCORRECT, 'attemptsLeft' => 4 }, body)
    end

    test 'an account the PC access list does not admit is told so, and its count is left alone' do
      build
      login('jbrooks', 'nope', pc_id: 'it_pc')
      body = login('jbrooks', JAKE_PASSWORD, pc_id: 'it_pc')
      assert_response :unprocessable_entity
      assert_equal({ 'success' => false, 'message' => "This account can't sign in on this PC", 'notPermitted' => true }, body)
      assert_equal 1, @game.reload.player_state['loginFailures']['it_pc|jbrooks']['n']
      assert_nil @game.player_state['sessions']['it_pc']
      assert_equal 'dana', login('dwhite', DANA_PASSWORD, pc_id: 'it_pc')['npcId']
    end

    test 'a locked-out username answers lockedOut whatever the password' do
      build
      results = (1..5).map { login('jbrooks', 'nope') }
      assert_equal true, results.last['lockedOut']
      assert_equal 'This account is locked on this PC', results.last['message']
      assert_equal ['jake_pc|jbrooks'], @game.reload.player_state['loginLockouts']

      [JAKE_PASSWORD, 'nope'].each do |password|
        body = login('JBROOKS', password)
        assert_response :unprocessable_entity
        assert_equal true, body['lockedOut']
      end
      assert_nil @game.reload.player_state['sessions']['jake_pc']
      # Only this PC: another PC still takes the password
      assert_equal 'jake', login('jbrooks', JAKE_PASSWORD, pc_id: 'profile_pc')['npcId']
    end

    test 'an invented username locks out the same way' do
      build
      results = (1..5).map { login('ghost', 'nope') }
      locked = results.last
      assert_equal true, locked['lockedOut']
      assert_equal locked, login('ghost', 'anything')
      jake_results = (1..5).map { login('jbrooks', 'nope', pc_id: 'profile_pc') }
      assert_equal locked, jake_results.last
    end

    test 'a sign-in clears the failure count for that username and PC' do
      build
      login('jbrooks', 'nope')
      login('jbrooks', JAKE_PASSWORD)
      refute @game.reload.player_state['loginFailures'].key?('jake_pc|jbrooks')
    end

    test 'a PC whose room is locked is not reachable' do
      build
      login('jbrooks', JAKE_PASSWORD, pc_id: 'vault_pc')
      assert_response :forbidden
      post login_game_url(@game), params: { pc_id: 'finance_cabinet', username: 'jbrooks', password: JAKE_PASSWORD }, as: :json
      assert_response :not_found
    end

    test 'spamming invented names keeps 200 non-account entries, oldest dropped, and accounts kept' do
      data = AccessModelScenario.routes_scenario
      data['policies']['corp_default']['maxAttempts'] = 1
      build(scenario: data)
      login('jbrooks', 'nope') # locks Jake out (maxAttempts 1)
      login('dwhite', 'nope', pc_id: 'profile_pc')
      300.times do |i|
        @game.reload
        login("ghost#{i}", 'nope')
        assert_response :unprocessable_entity
      end
      state = @game.reload.player_state
      failures = state['loginFailures']
      lockouts = state['loginLockouts']
      non_account_failures = failures.keys.grep(/ghost/)
      non_account_lockouts = lockouts.grep(/ghost/)
      assert_equal 200, non_account_failures.size
      assert_equal 200, non_account_lockouts.size
      assert_equal (100..299).map { |i| "jake_pc|ghost#{i}" }.sort, non_account_failures.sort
      assert_equal (100..299).map { |i| "jake_pc|ghost#{i}" }, non_account_lockouts
      assert_equal 1, failures['jake_pc|jbrooks']['n']
      assert_equal 1, failures['profile_pc|dwhite']['n']
      assert_includes lockouts, 'jake_pc|jbrooks'
      assert_includes lockouts, 'profile_pc|dwhite'
      assert_equal true, login('jbrooks', JAKE_PASSWORD)['lockedOut']
    end

    # ---- sessions ------------------------------------------------------------------

    test 'sign out, then the desktop is refused' do
      build
      login('jbrooks', JAKE_PASSWORD)
      open_desktop
      assert_response :success
      post logout_game_url(@game), params: { pc_id: 'jake_pc' }, as: :json
      assert_response :success
      assert_nil @game.reload.player_state['sessions']['jake_pc']
      assert_equal ['jake_pc'], @game.player_state['signedInPcs']
      open_desktop
      assert_response :forbidden
    end

    test 'switching account needs the second account its own password' do
      build
      login('jbrooks', JAKE_PASSWORD, pc_id: 'profile_pc')
      login('dwhite', 'nope', pc_id: 'profile_pc')
      assert_equal 'jake', @game.reload.player_state['sessions']['profile_pc']['id']
      login('dwhite', DANA_PASSWORD, pc_id: 'profile_pc')
      assert_equal 'dana', @game.reload.player_state['sessions']['profile_pc']['id']
    end

    test 'a PC holding only profiles opens with its admitted profiles' do
      build
      login('jbrooks', JAKE_PASSWORD, pc_id: 'profile_pc')
      open_desktop('profile_pc')
      assert_response :success
      ids = response.parsed_body['contents'].map { |c| c['id'] }
      # role profiles first, then personal ones
      assert_equal %w[staff_handbook jake_budget jake_archive jake_payroll], ids
      login('dwhite', DANA_PASSWORD, pc_id: 'profile_pc')
      open_desktop('profile_pc')
      assert_equal %w[staff_handbook], response.parsed_body['contents'].map { |c| c['id'] }
    end

    test 'the scenario response carries sessions and signedInPcs' do
      build
      get scenario_game_url(@game), as: :json
      assert_equal({}, response.parsed_body['sessions'])
      assert_equal [], response.parsed_body['signedInPcs']

      login('jbrooks', JAKE_PASSWORD)
      get scenario_game_url(@game), as: :json
      assert_equal({ 'jake_pc' => { 'npcId' => 'jake', 'username' => 'jbrooks', 'displayName' => 'Jake Brooks', 'via' => 'password' } },
                   response.parsed_body['sessions'])
      assert_equal ['jake_pc'], response.parsed_body['signedInPcs']
    end

    test 'a reset clears every access model key' do
      build
      login('jbrooks', JAKE_PASSWORD)
      login('ghost', 'nope')
      state = @game.reload.player_state
      state['copiedItems'] = ['jake_budget']
      state['serverClones'] = { 'X' => { 'source' => { 'npc' => 'len' }, 'uidOnly' => false } }
      state['loginLockouts'] = ['jake_pc|ghost']
      @game.save!
      post reset_game_url(@game), as: :json
      assert_response :success
      state = @game.reload.player_state
      assert_equal({}, state['sessions'])
      assert_equal [], state['signedInPcs']
      assert_equal({}, state['loginFailures'])
      assert_equal [], state['loginLockouts']
      assert_equal [], state['copiedItems']
      assert_equal({}, state['serverClones'])
    end

    # ---- claims --------------------------------------------------------------------

    test 'a claim for a tracked owner with an account succeeds and answers the owner' do
      build(scenario: tracked_scenario)
      body = claim
      assert_response :success
      assert_equal({ 'success' => true, 'npcId' => 'jake', 'username' => 'jbrooks', 'displayName' => 'Jake Brooks', 'via' => 'claim' }, body)
      assert_equal({ 'id' => 'jake', 'via' => 'claim' }, @game.reload.player_state['sessions']['jake_pc'])
      assert_equal ['jake_pc'], @game.player_state['signedInPcs']
      get scenario_game_url(@game), as: :json
      assert_equal 'claim', response.parsed_body['sessions']['jake_pc']['via']
    end

    # Code review R1, m5: a reload ends claimed sessions on the server itself
    test 'GET /scenario reports a claimed session and ends it on the server; a password session stays' do
      build(scenario: tracked_scenario)
      claim
      login('dwhite', DANA_PASSWORD, pc_id: 'profile_pc')
      get scenario_game_url(@game), as: :json
      assert_equal %w[jake_pc profile_pc], response.parsed_body['sessions'].keys.sort
      sessions = @game.reload.player_state['sessions']
      assert_nil sessions['jake_pc'], 'the claimed session ended on the server'
      assert_equal 'password', sessions['profile_pc']['via']
      open_desktop('jake_pc')
      assert_response :forbidden
      get scenario_game_url(@game), as: :json
      assert_equal %w[profile_pc], response.parsed_body['sessions'].keys
    end

    # Code review R1, m7
    test 'a claim never replaces a password session at the same PC' do
      build(scenario: tracked_scenario)
      login('jbrooks', JAKE_PASSWORD)
      assert_equal({ 'success' => false, 'message' => 'Sign in required' }, claim)
      assert_response :unprocessable_entity
      assert_equal({ 'id' => 'jake', 'via' => 'password' }, @game.reload.player_state['sessions']['jake_pc'])
    end

    # Code review R1, m8
    test 'POST /logout accepts the PC by name, as /login does' do
      build
      login('jbrooks', JAKE_PASSWORD, pc_id: "Jake's PC")
      assert_equal 'jake', @game.reload.player_state['sessions']['jake_pc']['id']
      post logout_game_url(@game), params: { pc_id: "Jake's PC" }, as: :json
      assert_response :success
      assert_nil @game.reload.player_state['sessions']['jake_pc']
    end

    test 'a claim for an owner with interests only succeeds' do
      build(scenario: tracked_scenario('interests' => { 'gossip' => 2 }))
      assert_equal 'claim', claim['via']
      build(scenario: tracked_scenario('interests' => { 'gossip' => { 'weight' => 1 } }))
      assert_equal 'claim', claim['via']
    end

    test 'a lockout of the owner does not stop a claim' do
      build(scenario: tracked_scenario, player_state: { 'loginLockouts' => ['jake_pc|jbrooks'] })
      assert_equal 'claim', claim['via']
    end

    test 'each claim refusal condition answers Sign in required' do
      refusals = {
        'unreachable PC' => [tracked_scenario, { 'unlockedRooms' => ['lobby'] }, 'jake_pc'],
        'unowned PC' => [tracked_scenario, {}, 'profile_pc'],
        'owner with neither needs nor interests' => [AccessModelScenario.routes_scenario, {}, 'jake_pc'],
        'owner whose only need is invalid' =>
          [tracked_scenario('needs' => { 'coffee' => { 'decayPerMin' => 0, 'urgentAt' => 40 } }, 'interests' => { 'x' => 0 }), {}, 'jake_pc'],
        'owner with no account' =>
          [tracked_scenario { |d| jake_pc(d)['screenOwner'] = 'len' }.tap do |d|
            d['rooms']['lobby']['npcs'].find { |n| n['id'] == 'len' }['needs'] = { 'tea' => { 'decayPerMin' => 5, 'urgentAt' => 30 } }
          end, {}, 'jake_pc'],
        'access list does not admit the owner' => [tracked_scenario, {}, 'it_pc'],
        'lockChance 1' => [tracked_scenario { |d| jake_pc(d)['lockChance'] = 1 }, {}, 'jake_pc'],
        'no lockChance, screen locks on leave' => [tracked_scenario { |d| jake_pc(d).delete('lockChance') }, {}, 'jake_pc'],
        'autoLockMin 0' => [tracked_scenario { |d| d['policies']['corp_default']['autoLockMin'] = 0 }, {}, 'jake_pc']
      }
      refusals.each do |label, (scenario, state, pc_id)|
        build(scenario: scenario, player_state: state)
        body = claim(pc_id)
        assert_response :unprocessable_entity, label
        assert_equal({ 'success' => false, 'message' => 'Sign in required' }, body, label)
        assert_empty @game.reload.player_state['sessions'], label
      end
    end

    test 'locksScreenOnLeave false allows a claim without lockChance' do
      build(scenario: tracked_scenario { |d| jake_pc(d).delete('lockChance'); jake_pc(d)['locksScreenOnLeave'] = false })
      assert_equal 'claim', claim['via']
    end

    # ---- account tiles ---------------------------------------------------------------

    test 'login_accounts answers the tiles for the PC picker' do
      build
      get login_accounts_game_url(@game), params: { pc_id: 'jake_pc' }
      assert_response :success
      tiles = response.parsed_body['loginAccounts']
      assert_equal %w[jbrooks DWhite], tiles.map { |t| t['username'] }
      tiles.each { |t| assert_equal %w[avatar displayName portrait username], t.keys.sort }

      get login_accounts_game_url(@game), params: { pc_id: 'it_pc' }
      assert_equal %w[DWhite], response.parsed_body['loginAccounts'].map { |t| t['username'] }
    end

    test 'a known picker lists only met accounts and a false picker none' do
      data = AccessModelScenario.routes_scenario
      jake_pc(data)['loginPicker'] = 'known'
      data['rooms']['finance']['objects'].find { |o| o['id'] == 'profile_pc' }['loginPicker'] = false
      build(scenario: data, player_state: { 'encounteredNPCs' => ['dana'] })
      get login_accounts_game_url(@game), params: { pc_id: 'jake_pc' }
      assert_equal %w[DWhite], response.parsed_body['loginAccounts'].map { |t| t['username'] }
      get login_accounts_game_url(@game), params: { pc_id: 'profile_pc' }
      assert_equal [], response.parsed_body['loginAccounts']
    end

    test 'room data carries the tiles on each sign-in PC and keeps it locked' do
      build(player_state: { 'unlockedObjects' => ["Jake's PC"] })
      get room_game_url(@game, room_id: 'finance'), as: :json
      pc = response.parsed_body['room']['objects'].find { |o| o['id'] == 'jake_pc' }
      assert_equal true, pc['locked']
      assert_equal %w[jbrooks DWhite], pc['loginAccounts'].map { |t| t['username'] }
    end

    test 'login_accounts refuses an unreachable PC' do
      build
      get login_accounts_game_url(@game), params: { pc_id: 'vault_pc' }
      assert_response :forbidden
    end

    # ---- tasks -----------------------------------------------------------------------

    test 'an unlock_object task on a sign-in PC completes after a sign-in and not before' do
      build
      post complete_task_game_url(@game, task_id: 'sign_in_jake'), as: :json
      assert_response :unprocessable_entity
      login('jbrooks', JAKE_PASSWORD)
      post complete_task_game_url(@game, task_id: 'sign_in_jake'), as: :json
      assert_response :success, response.body
      assert_equal 'completed', @game.reload.player_state.dig('objectivesState', 'tasks', 'sign_in_jake', 'status')
    end
  end
end
