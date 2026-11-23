require 'test_helper'
require_relative '../../support/access_model_scenario'
require_relative '../../support/keyring_login_scenario'
require_relative '../../support/ops_log_assertions'
require_relative '../../support/network_model_scenario'
require_relative '../../support/log_rows_body_scan'

module BreakEscape
  # Ops log reader, plan stage L2a, server half (OPS_LOG_ROWS_PLAN.md sections 6 and 7, 11
  # "Controller (log_rows_test.rb, L2a)"): GET /games/:id/log_rows through the real route.
  class LogRowsTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include OpsLogAssertions
    include LogRowsBodyScan

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
      data['logSources'] = (@sources || SOURCES).deep_dup
      lobby = data['rooms']['lobby']
      lobby['connections'] = lobby['connections'].merge('east' => %w[records mixed]) # the rfid doors, in reach of the lobby
      finance = data['rooms']['finance']
      lobby['objects'] += [
        reader('r_open'), reader('r_doors', 'doors'), reader('r_own_lock', 'audit', 'locked' => true, 'lockType' => 'pin', 'requires' => '5555'),
        reader('r_undeclared', 'nope'),
        { 'id' => 'plain_note', 'type' => 'text_file', 'name' => 'Note', 'text' => 'hi', 'minigameData' => { 'logSource' => 'audit' } }
      ]
      lobby['objects'].find { |o| o['id'] == 'lobby_safe' }['contents'] << reader('r_cabinet')
      finance['objects'] << reader('r_vault')
      finance['objects'].find { |o| o['id'] == 'jake_pc' }['contents'] << reader('r_desktop')
      finance['objects'].find { |o| o['id'] == 'jake_pc' }['contents'] << reader('r_signin_reader', 'audit', 'locked' => true, 'lockType' => 'login')
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
      assert_body_holds_no_secret(@game.reload, response.body)
      response.parsed_body
    end

    def login(username = 'jbrooks', password = JAKE_PASSWORD)
      post login_game_url(@game), params: { pc_id: 'jake_pc', username: username, password: password }, as: :json
    end

    NOT_FOUND = { 'success' => false, 'reason' => 'not_found' }.freeze

    test 'the secret scan has secrets to scan for' do
      build
      assert_includes OpsLog.compared_secrets(@game), JAKE_PASSWORD
    end

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

    test 'a reader that is itself a sign-in object is refused even while a session is held' do
      build
      open_finance
      login
      assert_equal NOT_FOUND, read('r_signin_reader')
      assert_response :not_found
    end

    test 'every reader leaves the game untouched, and every answer is no-store' do
      build
      open_finance
      login
      state = @game.reload.player_state
      stamp = Game.find(@game.id).updated_at
      %w[r_open r_desktop r_profile r_vault r_cabinet no_such_object].each do |id|
        read(id)
        assert_equal 'no-store', response.headers['Cache-Control'], id
      end
      read('x' * 65)
      assert_response :bad_request
      assert_equal 'no-store', response.headers['Cache-Control']
      assert_equal state, Game.find(@game.id).player_state
      assert_equal stamp, Game.find(@game.id).updated_at
    end

    # ---- showCardHolder, through POST /unlock (two sources: audit has no flag, doors has it) ----

    HOLDER_CLONER = AccessModelScenario::CLONER
    JAKE_CARD_ID = AccessModelScenario::JAKE_CARD['card_id']
    POWER_CARD_ID = AccessModelScenario::POWER_CARD['card_id']

    def build_swipes(inventory)
      build('unlockedRooms' => %w[lobby finance], 'encounteredNPCs' => %w[len jake dana exec imran gary],
            'inventory' => inventory)
    end

    def keycard_item(id)
      card = AccessModelScenario.routes_scenario['rooms']['lobby']['objects'].find { |o| o['id'] == id }
      card.slice('id', 'type', 'name', 'card_id', 'rfid_protocol', 'takeable')
    end

    def clone_card(card_id, npc_id = nil, object_id: nil)
      post clone_card_game_url(@game), params: { card_id: card_id, npc_id: npc_id, object_id: object_id }.compact, as: :json
      assert_equal true, response.parsed_body['recorded'], response.body
    end

    def swipe(door, card_ids)
      post unlock_game_url(@game), params: { targetType: 'door', targetId: door, method: 'rfid', card_ids: card_ids }, as: :json
      assert_response :success, response.body
    end

    def as_shown(source)
      body = read(source == 'doors' ? 'r_doors' : 'r_open')
      assert_response :success, response.body
      assert_not_includes response.body, 'flagged', 'the marker never leaves the server'
      body['rows'].map { |r| r['as'] }
    end

    def holder_scenario_sources
      { 'audit' => { 'title' => 'Audit log', 'events' => ['badge_swipe'] },
        'doors' => { 'title' => 'Doors', 'events' => ['badge_swipe'], 'showCardHolder' => true } }
    end

    test 'the holder rule: own card and a single copy show the holder in both sources, with no marker' do
      @sources = holder_scenario_sources
      build_swipes([keycard_item('jake_spare')])
      swipe('records', [JAKE_CARD_ID])
      assert_equal ['Jake Brooks'], as_shown('audit')
      assert_equal ['Jake Brooks'], as_shown('doors')
      assert_nil @game.reload.log_rows_for('audit').first['detail'], 'no flagged marker for a natural identity'

      # the holder's own keycard among several cards sent is still natural (the held-card term of the rule)
      build_swipes([keycard_item('jake_spare'), keycard_item('visitor_badge')])
      swipe('records', ['VISITOR-07', JAKE_CARD_ID])
      assert_equal ['Jake Brooks'], as_shown('audit')
      assert_equal ['Jake Brooks'], as_shown('doors')
      assert_nil @game.reload.log_rows_for('audit').first['detail'], 'no flagged marker when the holder keycard is held'

      build_swipes([HOLDER_CLONER.dup])
      clone_card(JAKE_CARD_ID, 'jake')
      swipe('records', [JAKE_CARD_ID])
      assert_equal ['Jake Brooks'], as_shown('audit')
      assert_equal ['Jake Brooks'], as_shown('doors')
    end

    test 'the holder rule: several cards sent with a copy passing hide the holder in a source without the flag only' do
      @sources = holder_scenario_sources
      build_swipes([HOLDER_CLONER.dup, keycard_item('visitor_badge')])
      clone_card(JAKE_CARD_ID, 'jake')
      swipe('records', ['VISITOR-07', JAKE_CARD_ID])
      assert_equal ['-'], as_shown('audit')
      assert_equal ['Jake Brooks'], as_shown('doors')
      assert_equal({ 'flagged' => 1 }, @game.reload.log_rows_for('audit').first['detail'])
    end

    test 'the holder rule: a card with no holder is named only where the flag is set, and with one card sent in both' do
      @sources = holder_scenario_sources
      build_swipes([HOLDER_CLONER.dup])
      clone_card('VISITOR-07', object_id: 'visitor_badge')
      clone_card(JAKE_CARD_ID, 'jake')
      swipe('mixed', [JAKE_CARD_ID, 'VISITOR-07'])
      assert_equal ['-'], as_shown('audit'), 'the plain source never says which of several cards the lock took'
      assert_equal ['Visitor badge'], as_shown('doors')

      build_swipes([HOLDER_CLONER.dup])
      clone_card('VISITOR-07', object_id: 'visitor_badge')
      swipe('mixed', ['VISITOR-07'])
      assert_equal ['Visitor badge'], as_shown('audit')
      assert_equal ['Visitor badge'], as_shown('doors')
    end

    test 'the holder rule: with no source setting the flag, several cards name nobody and nothing is marked' do
      build_swipes([HOLDER_CLONER.dup, keycard_item('visitor_badge')])
      clone_card(JAKE_CARD_ID, 'jake')
      swipe('records', ['VISITOR-07', JAKE_CARD_ID])
      assert_equal ['-'], as_shown('audit')
      assert_nil @game.reload.log_rows_for('audit').first['as']
    end
  end

  # A reader reached through a foothold route (the pivot fixture's lena_pc, reached over office_lan).
  class LogRowsFootholdTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests
    include LogRowsBodyScan

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
      read_log_rows('lena_log', params)
    end

    test 'a reader through a foothold route answers with the route, and 404 for a wrong route or no session' do
      build_network_game({ 'encounteredNPCs' => %w[sam lena ian jake] }, scenario)
      read
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
      # a lone wrong `from`, and two routes that conflict, are refused
      assert_equal NOT_FOUND, read(from: 'no_such_pc')
      assert_response :not_found
      assert_equal NOT_FOUND, read(foothold: OFFICE, from: 'no_such_pc')
      assert_response :not_found
      assert_equal NOT_FOUND, read(foothold: OFFICE, relay: 1)
      # the route goes down: after the drop box is unplugged the same request is refused
      unplug('comms_port')
      assert_equal NOT_FOUND, read(foothold: OFFICE)
      assert_response :not_found
      assert_equal NOT_FOUND, read
    end

    # R1 m6: the two `unreachable` refusals of the shared extraction name different ids (the PC for
    # a refused route; the container for a sign-in object in a share).
    test '/container names the desktop for a refused folder route' do
      build_network_game({ 'encounteredNPCs' => %w[sam lena ian jake] }, scenario)
      @game.reload.player_state['inventory'] = Array(@game.player_state['inventory']) + [KS.held('lena_rdp_file')]
      @game.save!
      take_drop_box
      plant('comms_port')
      post game_path('login'), params: { pc_id: 'lena_pc', credential: 'lena_rdp', foothold: OFFICE }, as: :json
      assert_equal true, response.parsed_body['success'], response.body
      get game_path('container/lena_log'), params: { foothold: 'no_such_port' }, as: :json
      assert_response :forbidden
      assert_equal 'unreachable', response.parsed_body['reason']
      assert_equal 'PC not reachable: lena_pc', response.parsed_body['error']
    end
  end

  # A reader inside a file share (the resource branch of container_reach_refusal).
  class LogRowsShareTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests
    include LogRowsBodyScan

    NS = NetworkModelScenario
    OFFICE = 'jack_comms_port'.freeze
    NOT_FOUND = { 'success' => false, 'reason' => 'not_found' }.freeze

    def scenario
      data = NS.scenario
      data['logSources'] = { 'audit' => { 'title' => 'Audit log', 'events' => ['signin_*'] } }
      data['resources']['scanned_inbox']['contents'] << {
        'id' => 'share_log', 'type' => 'ops_log_terminal', 'name' => 'Share log', 'minigameData' => { 'logSource' => 'audit' }
      }
      data['resources']['scanned_inbox']['contents'] << {
        'id' => 'share_kiosk_log', 'type' => 'ops_log_terminal', 'name' => 'Kiosk log', 'locked' => true, 'lockType' => 'login',
        'access' => { 'roles' => ['staff'] }, 'minigameData' => { 'logSource' => 'audit' }
      }
      data
    end

    def read(id, params = {})
      read_log_rows(id, params)
    end

    test 'a reader on a share is 404 without a session, answers with a foothold route, and is 404 after the unplug' do
      build_network_game({}, scenario)
      assert_equal NOT_FOUND, read('share_log')
      assert_response :not_found
      take_drop_box
      plant('comms_port')
      assert_response :success, response.body
      read('share_log', foothold: OFFICE)
      assert_response :success, response.body
      assert_equal 'Audit log', response.parsed_body['title']
      unplug('comms_port')
      assert_equal NOT_FOUND, read('share_log', foothold: OFFICE)
    end

    test 'a sign-in reader in a share is 404 even with a foothold, as an unreachable object' do
      build_network_game({}, scenario)
      take_drop_box
      plant('comms_port')
      assert_equal NOT_FOUND, read('share_kiosk_log', foothold: OFFICE)
      assert_response :not_found
      get game_path('container/share_kiosk_log'), params: { foothold: OFFICE }, as: :json
      assert_response :forbidden
      assert_equal 'PC not reachable: share_kiosk_log', response.parsed_body['error']
    end
  end
end
