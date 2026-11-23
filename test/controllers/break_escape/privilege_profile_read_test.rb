require 'test_helper'
require_relative '../../support/access_model_scenario'

module BreakEscape
  # Ops S5a unit 07 (OPS_PRIVILEGE_ACCOUNTS_PLAN.md, log row admin_profile_read): GET /container of a
  # folder inside another account's profile, through a live admin session, writes one row per PC,
  # profile and account, and saves only when the row is stored. The owner's own read, a repeat and
  # GET /log_rows write nothing. Sessions are made through the real sign-in route.
  class PrivilegeProfileReadTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    AMS = AccessModelScenario

    def scenario(logged: true)
      data = AMS.routes_scenario
      npcs = data['rooms']['finance']['npcs']
      npcs.find { |n| n['id'] == 'dana' }['creds']['admin'] = true
      data['accountProfiles']['jake_files']['contents'][1]['locked'] = false
      data['logSources'] = { 'audit' => { 'title' => 'Audit', 'events' => ['admin_profile_read'] } } if logged
      data
    end

    def build(data = scenario)
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
        scenario: data, player_state: { 'currentRoom' => 'finance', 'unlockedRooms' => %w[lobby finance] }
      )
    end

    def sign_in(pc_id, username, password)
      post login_game_url(@game), params: { pc_id: pc_id, username: username, password: password }, as: :json
      assert response.parsed_body['success'], response.body
    end

    def dana_in(pc_id = 'jake_pc')
      sign_in(pc_id, 'DWhite', AMS::DANA_PASSWORD)
    end

    def jake_in(pc_id = 'jake_pc')
      sign_in(pc_id, 'jbrooks', AMS::JAKE_PASSWORD)
    end

    def rows
      @game.reload.log_rows_for('audit')
    end

    # The number of UPDATE statements on the games table while the block runs.
    def game_saves
      count = 0
      sub = ActiveSupport::Notifications.subscribe('sql.active_record') do |*, payload|
        sql = payload[:sql].to_s
        count += 1 if sql.start_with?('UPDATE') && sql.include?('break_escape_games')
      end
      yield
      count
    ensure
      ActiveSupport::Notifications.unsubscribe(sub) if sub
    end

    def open_folder(id = 'jake_archive')
      get "/break_escape/games/#{@game.id}/container/#{id}", as: :json
    end

    test 'the first admin open of a folder in the owner profile stores one row and saves once; a reopen stores none' do
      build
      dana_in
      saves = game_saves { open_folder }
      assert_response :success
      assert_equal ['jake_inner'], response.parsed_body['contents'].map { |c| c['id'] }
      assert_equal 1, saves
      assert_equal 1, rows.size
      row = rows.first
      assert_equal 'admin_profile_read', row['event']
      assert_equal({ 'account' => 'DWhite' }, row['as'])
      assert_equal({ 'kind' => 'pc', 'id' => 'jake_pc' }, row['where'])
      assert_equal({ 'profile' => 'jake_files' }, row['detail'])

      saves = game_saves { open_folder }
      assert_response :success
      assert_equal 0, saves, 'a repeating client causes no further saves'
      assert_equal 1, rows.size

      saves = game_saves { 5.times { open_folder } }
      assert_equal 0, saves
      assert_equal 1, rows.size
    end

    test 'the row names no secret' do
      build
      dana_in
      open_folder
      text = rows.to_json
      refute_includes text, AMS::DANA_PASSWORD
      refute_includes text, AMS::JAKE_PASSWORD
      refute_includes text, AMS::INNER_MARKER
    end

    test 'the owner opening their own profile folder stores no row' do
      build
      jake_in
      open_folder
      assert_response :success
      assert_empty rows
    end

    test 'an admin session and the owner own session both live: the read is an ordinary one' do
      build
      jake_in
      dana_in('it_pc')
      saves = game_saves { open_folder }
      assert_response :success
      assert_equal 0, saves
      assert_empty rows
    end

    test 'a scenario without logSources saves nothing' do
      build(scenario(logged: false))
      dana_in
      saves = game_saves { open_folder }
      assert_response :success
      assert_equal 0, saves
    end

    test 'GET /log_rows writes none' do
      build
      dana_in
      saves = game_saves { get "/break_escape/games/#{@game.id}/log_rows/audit", as: :json }
      assert_equal 0, saves
      assert_empty rows
    end

    test 'a refused open writes no row, and the refusal is unchanged' do
      build
      get "/break_escape/games/#{@game.id}/container/jake_archive", as: :json
      assert_response :forbidden
      assert_empty rows

      dana_in
      @game.reload.player_state['sessions']['jake_pc']['locked'] = true
      @game.save!
      get "/break_escape/games/#{@game.id}/container/jake_archive", as: :json
      assert_response :forbidden
      assert_empty rows, 'a locked admin session reads nothing and leaves no row'
    end

    test 'an unknown id answers as before and writes no row' do
      build
      dana_in
      get "/break_escape/games/#{@game.id}/container/no_such_folder", as: :json
      assert_response :not_found
      assert_empty rows
    end

    # The log validator does not (yet) check accountProfiles keys against the 40-character row-id
    # limit, so the controller must not let such an id fail the read or reach the row helper.
    test 'a profile id too long for a row opens its folder, leaves no row and does not fail' do
      data = scenario
      long = 'p' * 41
      data['accountProfiles'][long] = data['accountProfiles'].delete('jake_files')
      build(data)
      dana_in
      saves = game_saves { open_folder }
      assert_response :success
      assert_equal 0, saves
      assert_empty rows
    end
  end
end
