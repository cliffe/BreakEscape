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

    # A reader inside a folder of the owner's profile, so the read reaches the scoped branch and
    # answers 200 under the admin session (without a reader the route is a 404 before any check).
    def with_profile_reader(data)
      data['accountProfiles']['jake_files']['contents'][1]['contents'] << {
        'id' => 'jake_log', 'type' => 'ops_log_terminal', 'name' => 'Audit reader', 'minigameData' => { 'logSource' => 'audit' }
      }
      data
    end

    test 'GET /log_rows writes none' do
      build(with_profile_reader(scenario))
      dana_in
      saves = game_saves { get "/break_escape/games/#{@game.id}/log_rows?object_id=jake_log", as: :json }
      assert_response :success, response.body
      assert_equal 0, saves
      assert_empty rows
    end

    def read_detail_cells(data)
      build(with_profile_reader(data))
      dana_in
      open_folder
      get "/break_escape/games/#{@game.id}/log_rows?object_id=jake_log", as: :json
      assert_response :success, response.body
      response.parsed_body['rows'].select { |r| r['event'] == 'ADMIN_READ' }.map { |r| r['detail'] }
    end

    test 'the admin read row shows the owner account display name, never the profile id' do
      assert_equal ['profile: Jake Brooks'], read_detail_cells(scenario)
    end

    # R4-8: the owner's display name shows only where the PC's sign-in screen shows everyone's tile.
    def picker_cells(picker)
      data = with_profile_reader(scenario)
      data['rooms'].each_value do |room|
        Array(room['objects']).each { |o| o['loginPicker'] = picker if o['id'] == 'jake_pc' }
      end
      read_detail_cells(data)
    end

    test 'R4-8: a PC whose loginPicker is known or false shows the kind word, not the owner name' do
      assert_equal ['profile: Jake Brooks'], picker_cells('accounts')
      ['known', false].each do |picker|
        cells = picker_cells(picker)
        assert_equal ['profile'], cells, picker.inspect
        refute_includes cells.join, 'Jake'
      end
    end

    # The cell's gate called directly: a headless host cannot be signed in to at the keyboard, so the read row cannot be made there.
    def shown_name(data)
      build(with_profile_reader(data))
      BreakEscape::OpsLogEvents.profile_shown_name(@game, 'jake_files', { 'kind' => 'pc', 'id' => 'jake_pc' })
    end

    test 'R5-4: a headless PC, or one whose remote sign-in screen is typed, shows the kind word, not the owner name' do
      assert_equal 'Jake Brooks', shown_name(scenario)
      data = scenario
      data['rooms'].each_value { |room| Array(room['objects']).each { |o| o['headless'] = true if o['id'] == 'jake_pc' } }
      assert_equal 'jake_files', shown_name(data)
      %w[typed tiles].each do |screen|
        data = scenario
        data['policies'] = (data['policies'] || {}).merge('nla' => { 'remote' => 'allowed', 'remoteScreen' => screen })
        data['rooms'].each_value { |room| Array(room['objects']).each { |o| o['policy'] = 'nla' if o['id'] == 'jake_pc' } }
        assert_equal(screen == 'typed' ? 'jake_files' : 'Jake Brooks', shown_name(data), screen)
      end
    end

    test 'a profile with no named account reads as the kind word once' do
      data = scenario
      data['rooms']['finance']['npcs'].find { |n| n['id'] == 'jake' }.delete('displayName')
      cells = read_detail_cells(data)
      assert_equal ['profile'], cells
      refute_match(/jake_files/, cells.join)
    end

    test 'a refused open writes no row, and the refusal is unchanged' do
      build
      get "/break_escape/games/#{@game.id}/container/jake_archive", as: :json
      assert_response :forbidden
      first_body = response.parsed_body
      assert_empty rows

      dana_in
      @game.reload.player_state['sessions']['jake_pc']['locked'] = true
      @game.save!
      get "/break_escape/games/#{@game.id}/container/jake_archive", as: :json
      assert_response :forbidden
      assert_equal first_body, response.parsed_body, 'a locked admin session is refused with the same body as no session'
      assert_empty rows, 'a locked admin session reads nothing and leaves no row'
    end

    test 'an unknown id answers as before and writes no row' do
      build
      dana_in
      get "/break_escape/games/#{@game.id}/container/no_such_folder", as: :json
      assert_response :not_found
      assert_empty rows
    end

    # The log validator now refuses such an id (validator-log-sources); the controller guard stays
    # for a snapshot game, which is not re-validated, so such an id must not fail the read.
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

    # S5a R1 F2: two admin PCs can both open the profile; the row names the first in sign-in order,
    # so one row is stored however often it is read.
    test 'two admin sessions that can open a profile store one row, on the first PC signed in' do
      build
      dana_in('jake_pc')
      dana_in('it_pc')
      open_folder
      assert_response :success
      assert_equal 1, rows.size
      first = rows.first
      3.times { open_folder }
      assert_equal 1, rows.size, 'a repeat read stores nothing'
      assert_equal first, rows.first
      assert_equal({ 'kind' => 'pc', 'id' => 'jake_pc' }, first['where'])
    end
  end
end
