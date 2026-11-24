require 'test_helper'
require_relative '../../support/access_model_scenario'

module BreakEscape
  # Ops S5a unit 05 (OPS_PRIVILEGE_ACCOUNTS_PLAN.md, "S5a: profiles"): an admin session at a PC
  # opens the profiles of the accounts that use that PC (under S5a, its owner), each once, and
  # nothing else. Sessions are made through the real sign-in route.
  class AdminProfilesTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    AMS = AccessModelScenario
    JAKE_IDS = %w[jake_budget jake_archive jake_payroll].freeze

    # dana (finance, it) is the administrator; jake owns jake_pc and it_pc. imran_files is the
    # profile of an account that uses neither PC. payroll_desk is a role profile only the owner has.
    def admin_scenario(admin: true, owner_admin: false)
      data = AMS.routes_scenario
      npcs = data['rooms']['finance']['npcs']
      npcs.find { |n| n['id'] == 'dana' }['creds']['admin'] = true if admin
      jake = npcs.find { |n| n['id'] == 'jake' }
      jake['creds']['admin'] = true if owner_admin
      jake['role'] = %w[finance payroll]
      data['accountProfiles']['jake_files']['contents'][1]['locked'] = false
      data['accountProfiles']['payroll_desk'] = {
        'for' => { 'roles' => ['payroll'] },
        'contents' => [{ 'id' => 'payroll_note', 'type' => 'text_file', 'name' => 'Payroll note', 'takeable' => true, 'text' => 'p' }]
      }
      data['accountProfiles']['imran_files'] = {
        'for' => { 'people' => ['imran'] },
        'contents' => [{ 'id' => 'imran_folder', 'type' => 'safe', 'name' => 'Imran folder', 'contents' =>
                         [{ 'id' => 'imran_inner', 'type' => 'text_file', 'name' => 'Imran inner', 'takeable' => true, 'text' => 'i' }] },
                       { 'id' => 'imran_top', 'type' => 'text_file', 'name' => 'Imran top', 'takeable' => true, 'text' => 'i' }]
      }
      data
    end

    def build(scenario = admin_scenario)
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
        scenario: scenario, player_state: { 'currentRoom' => 'finance', 'unlockedRooms' => %w[lobby finance] }
      )
    end

    def dana_in(pc_id = 'jake_pc')
      post login_game_url(@game), params: { pc_id: pc_id, username: 'DWhite', password: AMS::DANA_PASSWORD }, as: :json
      assert response.parsed_body['success'], response.body
    end

    def jake_in(pc_id = 'jake_pc')
      post login_game_url(@game), params: { pc_id: pc_id, username: 'jbrooks', password: AMS::JAKE_PASSWORD }, as: :json
      assert response.parsed_body['success'], response.body
    end

    def ids_at(pc_id)
      get "/break_escape/games/#{@game.id}/container/#{pc_id}", as: :json
      assert_response :success
      response.parsed_body['contents'].map { |c| c['id'] }
    end

    def game
      @game.reload
    end

    def add_from(pc_id, name)
      post "/break_escape/games/#{@game.id}/inventory",
           params: { action_type: 'add', item: { type: 'text_file', name: name }, source_pc_id: pc_id, transfer: 'copy' }, as: :json
      response.parsed_body
    end

    def held_names
      Array(game.player_state['inventory']).map { |item| item['name'] }
    end

    test 'an admin session at an owned PC lists the owner profiles once' do
      build
      dana_in
      ids = ids_at('jake_pc')
      JAKE_IDS.each { |id| assert_equal 1, ids.count(id), id }
      assert_equal 1, ids.count('payroll_note'), 'a role profile opens when the owner has the role'
      assert_equal 1, ids.count('staff_handbook')
      refute_includes ids, 'imran_top', 'the profile of an account that does not use this PC stays shut'
    end

    test 'the admin who is also the owner sees each profile once' do
      build(admin_scenario(admin: false, owner_admin: true))
      jake_in
      ids = ids_at('jake_pc')
      JAKE_IDS.each { |id| assert_equal 1, ids.count(id), id }
      assert_equal ids.uniq, ids
    end

    test 'a user session lists only its own profiles' do
      build(admin_scenario(admin: false))
      dana_in
      ids = ids_at('jake_pc')
      assert_equal %w[staff_handbook], ids.reject { |id| id.start_with?('jake_local', 'jake_notes') }
      assert_equal 'user', game.session_access('jake_pc')
    end

    test 'an admin at an unowned PC adds nothing' do
      build
      dana_in('profile_pc')
      assert_equal 'admin', game.session_access('profile_pc')
      assert_equal %w[staff_handbook], ids_at('profile_pc')
    end

    test 'a folder in another owner profile stays refused through the admin session' do
      build
      dana_in
      get "/break_escape/games/#{@game.id}/container/imran_folder", as: :json
      admin_status = response.status
      admin_body = response.parsed_body
      build(admin_scenario(admin: false))
      dana_in
      get "/break_escape/games/#{@game.id}/container/imran_folder", as: :json
      assert_equal response.status, admin_status
      assert_equal admin_body, response.parsed_body, 'refused exactly as for a user session'
      refute_equal 200, admin_status
    end

    test 'a folder in the owner profile opens for admin and not for user' do
      build
      dana_in
      get "/break_escape/games/#{@game.id}/container/jake_archive", as: :json
      assert_response :success
      build(admin_scenario(admin: false))
      dana_in
      get "/break_escape/games/#{@game.id}/container/jake_archive", as: :json
      refute_equal 200, response.status
    end

    test 'session_admits? is true for the owner profile only while the admin session is live' do
      build
      scope = { type: 'profile', id: 'jake_files' }
      refute game.session_admits?(scope)
      dana_in
      assert game.session_admits?(scope)
      refute game.session_admits?({ type: 'profile', id: 'imran_files' })
      post lock_session_game_url(@game), params: { pc_id: 'jake_pc' }, as: :json
      assert_response :success
      refute game.session_admits?(scope), 'locked'
      @game.reload.player_state['sessions'].delete('jake_pc')
      @game.save!
      refute game.session_admits?(scope), 'gone'
    end

    # S5a R1 F9: an expired token session and a PC that is switched off take no profile either.
    test 'session_admits? is false for an expired token session and for a PC whose service is off' do
      scope = { type: 'profile', id: 'jake_files' }
      data = admin_scenario
      data['credentials'] = { 'dana_token' => { 'kind' => 'token', 'account' => 'dana', 'connectsTo' => 'jake_pc',
                                                'proof' => { 'foothold' => 'x' }, 'label' => 'token', 'expiresMin' => 4 } }
      build(data)
      @game.reload.player_state['sessions'] = { 'jake_pc' => { 'id' => 'dana', 'via' => 'credential', 'credential' => 'dana_token' } }
      @game.player_state['credentialClock'] = { 'dana_token' => Time.current.to_f }
      @game.save!
      assert_equal 'admin', game.session_access('jake_pc')
      assert game.session_admits?(scope)
      travel_to(Time.current + 2.hours) do
        assert_nil game.session_access('jake_pc')
        refute game.session_admits?(scope), 'expired'
        assert_nil game.admin_profile_reader('jake_files')
      end

      data = admin_scenario
      data['rooms']['finance']['objects'].find { |o| o['id'] == 'jake_pc' }['offWhen'] = 'jake_off'
      data['globalVariables'] = (data['globalVariables'] || {}).merge('jake_off' => false)
      build(data)
      dana_in
      assert game.session_admits?(scope)
      @game.reload.player_state['globalVariables'] = (@game.player_state['globalVariables'] || {}).merge('jake_off' => true)
      @game.save!
      refute game.session_admits?(scope), 'PC off'
      assert_nil game.admin_profile_reader('jake_files')
    end

    # S5a R1 F9: an admin session at a PC the owner does not own opens nothing of the owner's.
    test 'an admin session at another PC does not open the owner profile, a folder or an add' do
      scope = { type: 'profile', id: 'jake_files' }
      build
      dana_in('profile_pc')
      assert_equal 'admin', game.session_access('profile_pc')
      refute game.session_admits?(scope)
      get "/break_escape/games/#{@game.id}/container/jake_archive", as: :json
      refute_equal 200, response.status
      add_from('profile_pc', 'Q3 budget.xlsx')
      refute_includes held_names, 'Q3 budget.xlsx'
    end

    test 'session_admits? is false once the route is down' do
      build
      dana_in
      scope = { type: 'profile', id: 'jake_files' }
      assert game.session_admits?(scope)
      @game.reload.player_state['sessions']['jake_pc']['foothold'] = 'no_such_foothold'
      @game.player_state['sessions']['jake_pc']['via'] = 'credential'
      @game.save!
      refute game.session_admin?('jake_pc')
      refute game.session_admits?(scope)
    end

    test 'an inventory add from the owner profile works under admin and is refused under user' do
      build
      dana_in
      add_from('jake_pc', 'Q3 budget.xlsx')
      assert_includes held_names, 'Q3 budget.xlsx'
      build(admin_scenario(admin: false))
      dana_in
      add_from('jake_pc', 'Q3 budget.xlsx')
      refute_includes held_names, 'Q3 budget.xlsx'
    end

    test 'admin_profile_reader names the admin PC, and nil when the owner own session is live too' do
      build
      assert_nil game.admin_profile_reader('jake_files')
      dana_in
      reader = game.admin_profile_reader('jake_files')
      assert_equal 'jake_pc', reader[:pc_id]
      assert_equal 'dana', reader[:npc]['id']
      assert_nil game.admin_profile_reader('imran_files')
      assert_nil game.admin_profile_reader('no_such_profile')
      jake_in('profile_pc')
      assert_nil game.admin_profile_reader('jake_files'), 'the owner reading his own profile is ordinary'
    end

    test 'admin_profiles_at is empty for a PC with no owner and holds the owner profiles otherwise' do
      build
      pc = ->(id) { game.find_login_pc(id)[:object] }
      assert_empty game.admin_profiles_at(pc.call('profile_pc'))
      assert_equal %w[jake_files payroll_desk staff_desktop], game.admin_profiles_at(pc.call('jake_pc')).map(&:first)
    end
  end
end
