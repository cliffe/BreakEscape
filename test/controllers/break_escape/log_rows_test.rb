require 'test_helper'
require_relative '../../support/access_model_scenario'
require_relative '../../support/keyring_login_scenario'
require_relative '../../support/ops_log_assertions'

module BreakEscape
  # Ops log reader, plan stage L2a, server half (OPS_LOG_ROWS_PLAN.md sections 6 and 7, 11
  # "Controller (log_rows_test.rb, L2a)"): GET /games/:id/log_rows through the real route.
  class LogRowsTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include OpsLogAssertions

    JAKE_PASSWORD = AccessModelScenario::JAKE_PASSWORD
    SEVEN_KEYS = %w[as detail elapsedMs event id result where].freeze
    SOURCES = {
      'audit' => { 'title' => 'Audit log', 'events' => ['signin_*', 'badge_swipe', 'session_*'] },
      'doors' => { 'title' => 'Doors', 'events' => ['badge_swipe'] }
    }.freeze

    def reader(id, source = 'audit', extra = {})
      { 'id' => id, 'type' => 'ops_log_terminal', 'name' => "Reader #{id}", 'minigameData' => { 'logSource' => source } }.merge(extra)
    end

    def scenario
      data = AccessModelScenario.routes_scenario
      data['logSources'] = SOURCES.deep_dup
      lobby = data['rooms']['lobby']
      finance = data['rooms']['finance']
      lobby['objects'] += [
        reader('r_open'), reader('r_own_lock', 'audit', 'locked' => true, 'lockType' => 'pin', 'requires' => '5555'),
        reader('r_undeclared', 'nope'),
        { 'id' => 'plain_note', 'type' => 'text_file', 'name' => 'Note', 'text' => 'hi', 'minigameData' => { 'logSource' => 'audit' } }
      ]
      lobby['objects'].find { |o| o['id'] == 'lobby_safe' }['contents'] << reader('r_cabinet')
      finance['objects'] << reader('r_vault')
      finance['objects'].find { |o| o['id'] == 'jake_pc' }['contents'] << reader('r_desktop')
      data['accountProfiles']['jake_files']['contents'] << reader('r_profile')
      data
    end

    def build(player_state = {})
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user), scenario: scenario,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby] }.merge(player_state)
      )
    end

    def open_finance
      state = Game.find(@game.id).player_state
      @game.update!(player_state: state.merge('unlockedRooms' => %w[lobby finance]))
    end

    def read(object_id, params = {})
      get "/break_escape/games/#{@game.id}/log_rows", params: { object_id: object_id }.merge(params), as: :json
      response.parsed_body
    end

    def login(username = 'jbrooks', password = JAKE_PASSWORD)
      post login_game_url(@game), params: { pc_id: 'jake_pc', username: username, password: password }, as: :json
    end

    NOT_FOUND = { 'success' => false, 'reason' => 'not_found' }.freeze

    # ---- refusals ----

    test 'object_id missing, too long or not a string is 400 invalid_object' do
      build
      [nil, 'x' * 65, ''].each do |bad|
        body = bad.nil? ? read(nil) : read(bad)
        assert_response :bad_request, bad.inspect
        assert_equal({ 'success' => false, 'reason' => 'invalid_object' }, body)
      end
      get "/break_escape/games/#{@game.id}/log_rows?object_id[]=r_open"
      assert_response :bad_request
      read('r' * 64)
      assert_response :not_found, 'a 64-character id passes the length check'
    end

    test 'every refusal after the id check is the same 404' do
      build
      [
        'no_such_object', 'plain_note', 'r_undeclared', 'r_vault', 'r_cabinet', 'r_own_lock', 'r_desktop', 'r_profile',
        'Reader r_open', 'jake_pc'
      ].each do |id|
        body = read(id)
        assert_response :not_found, id
        assert_equal NOT_FOUND, body, id
      end
    end

    test 'a reader the id names only by its display name is not found' do
      build
      read('Reader r_open')
      assert_response :not_found
    end

    # ---- reach ----

    test 'a reader in a start room answers from any position, with rows written later' do
      build
      body = read('r_open')
      assert_response :success, response.body
      assert_equal [], body['rows']
      assert_equal 'Audit log', body['title']
      assert_match(/\A\h{6}\z/, body['rev'])
      open_finance
      @game.reload.update!(player_state: @game.player_state.merge('currentRoom' => 'finance'))
      login('jbrooks', 'wrong')
      assert_response :unprocessable_entity
      later = read('r_open')
      assert_equal ['SIGN_IN'], later['rows'].map { |r| r['event'] }
      assert_not_equal body['rev'], later['rev']
    end

    test 'a reader in a locked room is refused until the room is unlocked, then answers' do
      build
      assert_equal NOT_FOUND, read('r_vault')
      open_finance
      read('r_vault')
      assert_response :success, response.body
    end

    test 'a reader in a locked cabinet or behind its own lock is refused until opened' do
      build
      assert_equal NOT_FOUND, read('r_cabinet')
      assert_equal NOT_FOUND, read('r_own_lock')
      state = Game.find(@game.id).player_state
      @game.update!(player_state: state.merge('unlockedObjects' => %w[lobby_safe r_own_lock]))
      read('r_cabinet')
      assert_response :success, response.body
      read('r_own_lock')
      assert_response :success, response.body
    end

    test 'a reader on a desktop answers while its session is held, and 404 after a lock or a sign-out' do
      build
      open_finance
      assert_equal NOT_FOUND, read('r_desktop')
      login
      assert_response :success, response.body
      read('r_desktop')
      assert_response :success, response.body
      post lock_session_game_url(@game), params: { pc_id: 'jake_pc' }, as: :json
      assert_equal NOT_FOUND, read('r_desktop')
      assert_equal NOT_FOUND, read('r_profile')
      login
      read('r_desktop')
      assert_response :success, response.body
      post logout_game_url(@game), params: { pc_id: 'jake_pc' }, as: :json
      assert_equal NOT_FOUND, read('r_desktop')
    end

    test 'a reader in a profile answers only while a session the profile admits is held' do
      build
      open_finance
      assert_equal NOT_FOUND, read('r_profile')
      login
      read('r_profile')
      assert_response :success, response.body
    end

    test 'reading writes no row and does not save' do
      build
      open_finance
      login
      before = Game.find(@game.id)
      stamp = before.updated_at
      state = before.player_state.deep_dup
      3.times { read('r_desktop') }
      after = Game.find(@game.id)
      assert_equal state, after.player_state
      assert_equal stamp, after.updated_at
    end

    # ---- the answer ----

    test 'rows hold exactly the seven keys and nothing stored' do
      build
      open_finance
      login('JBrooks ', 'nope')
      login('jbrooks', 'nope')
      stored = Game.find(@game.id).log_rows_for('audit')
      assert_equal 1, stored.size, 'two identical typed failures merge'
      body = read('r_open')
      row = body['rows'].first
      assert_equal SEVEN_KEYS, row.keys.sort
      assert_match(/\A\h{10}\z/, row['id'])
      assert_not_equal stored.first['seq'].to_s, row['id']
      assert_equal 'SIGN_IN', row['event']
      assert_equal 'jbrooks', row['as']
      assert_equal "Jake's PC", row['where']
      assert_equal 'FAIL x2', row['result']
      assert_kind_of Integer, row['elapsedMs']
      json = response.body
      %w[seq serverMs last opsLog opsLogSeq logSources].each { |key| assert_no_match(/"#{key}"/, json) }
      assert_ops_log_holds_no_secret(Game.find(@game.id))
      assert_not_includes json, JAKE_PASSWORD
    end

    test 'a real account and made-up typed name render the same way' do
      build
      open_finance
      login('jbrooks', 'nope')
      login('J.Nobody', 'nope')
      as = read('r_open')['rows'].map { |r| r['as'] }
      assert_equal %w[jbrooks j.nobody], as
    end

    test 'rev unchanged answer, no-store, and a new rev after a change' do
      build
      open_finance
      login('x', 'nope')
      first = read('r_open')
      assert_equal 'no-store', response.headers['Cache-Control']
      same = read('r_open', rev: first['rev'])
      assert_response :success
      assert_equal({ 'rev' => first['rev'], 'unchanged' => true }, same)
      assert_equal 'no-store', response.headers['Cache-Control']
      login('y', 'nope')
      moved = read('r_open', rev: first['rev'])
      assert_not moved['unchanged']
      assert_equal 2, moved['rows'].size
      assert_not_equal first['rev'], moved['rev']
    end

    test 'a source title change on a live game changes the rev' do
      build
      first = read('r_open')
      data = Game.find(@game.id).scenario_data.deep_dup
      data['logSources']['audit']['title'] = 'Renamed'
      Game.find(@game.id).update!(scenario_data: data)
      moved = read('r_open', rev: first['rev'])
      assert_equal 'Renamed', moved['title']
      assert_not_equal first['rev'], moved['rev']
    end

    test 'a scenario without logSources answers 404 for a reader of an undeclared source' do
      data = scenario
      data.delete('logSources')
      @game = create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                                 scenario: data, player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby] })
      assert_equal NOT_FOUND, read('r_open')
      assert_equal [], %w[opsLog opsLogSeq opsLogClockAt].select { |k| Game.find(@game.id).player_state.key?(k) }
    end

    test 'card holder: a source without showCardHolder hides it when another source shows it' do
      data = scenario
      data['logSources']['doors']['showCardHolder'] = true
      @game = create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                                 scenario: data, player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby] })
      @game.write_log_row!('badge_swipe', as: { npc: 'len' }, where: { kind: 'door', id: 'finance' }, result: 'ok')
      @game.save!
      assert_equal ['Len Okafor'], @game.log_rows_for_client('doors')[:rows].map { |r| r[:as] }
      assert_equal ['-'], @game.log_rows_for_client('audit')[:rows].map { |r| r[:as] }
    end
  end

  # A reader reached through a foothold route (the pivot fixture's lena_pc, reached over office_lan).
  class LogRowsFootholdTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    KS = KeyringLoginScenario
    OFFICE = KS::OFFICE
    NOT_FOUND = { 'success' => false, 'reason' => 'not_found' }.freeze

    def scenario
      data = KS.scenario
      data['logSources'] = { 'audit' => { 'title' => 'Audit log', 'events' => ['signin_*'] } }
      lena = data['rooms'].values.flat_map { |r| Array(r['objects']) }.find { |o| o['id'] == 'lena_pc' }
      lena['contents'] = Array(lena['contents']) + [
        { 'id' => 'lena_log', 'type' => 'ops_log_terminal', 'name' => 'Lena log', 'minigameData' => { 'logSource' => 'audit' } }
      ]
      data
    end

    def read(params = {})
      get game_path('log_rows'), params: { object_id: 'lena_log' }.merge(params), as: :json
      response.parsed_body
    end

    test 'a reader through a foothold route answers with the route, and 404 for a wrong route or no session' do
      build_network_game({ 'encounteredNPCs' => %w[sam lena ian jake] }, scenario)
      get game_path('log_rows'), params: { object_id: 'lena_log' }, as: :json
      assert_response :not_found
      @game.reload.player_state['inventory'] = Array(@game.player_state['inventory']) + [KS.held('lena_rdp_file')]
      @game.save!
      take_drop_box
      plant('comms_port')
      post game_path('login'), params: { pc_id: 'lena_pc', credential: 'lena_rdp', foothold: OFFICE }, as: :json
      assert_equal true, response.parsed_body['success'], response.body
      read(foothold: OFFICE)
      assert_response :success, response.body
      assert_equal NOT_FOUND, read(foothold: 'no_such_port')
      assert_response :not_found
      assert_equal NOT_FOUND, read(relay: 1)
      # as for /container, a no-route read under a foothold session keeps the session_admits? rule
      read
      assert_response :success, response.body
    end
  end
end
