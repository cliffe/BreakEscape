require 'test_helper'
require_relative '../../support/access_model_scenario'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops log stage L1b (OPS_LOG_ROWS_PLAN.md section 11, "Feature scenario" and "Server, per call
  # site"): the real scenarios/test_ops_logs/scenario.json.erb driven through the routes. Every
  # assertion reads a re-read game (Game.find), so a missing save fails.
  class OpsLogsScenarioTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    CLONER = AccessModelScenario::CLONER
    DANA_CARD = 'FIN-DANA-01'.freeze
    DANA_PASSWORD = 'Ledger-Dana-7'.freeze
    SCENARIO_PATH = File.expand_path('../../../scenarios/test_ops_logs/scenario.json.erb', __dir__)
    OTHER_CARD = { 'id' => 'visitor_card', 'type' => 'keycard', 'name' => 'Visitor card', 'card_id' => 'VISITOR-07',
                   'rfid_protocol' => 'EM4100', 'takeable' => true }.freeze

    def scenario
      JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
    end

    # office_open: start with the office door already open, as a player is once through it.
    def build(inventory: [CLONER.dup], scenario: self.scenario, office_open: false, security_open: false)
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user), scenario: scenario,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => (%w[lobby] + (office_open || security_open ? %w[office] : []) + (security_open ? %w[security] : [])),
                        'encounteredNPCs' => %w[dana],
                        'inventory' => inventory }
      )
    end

    def fresh
      Game.find(@game.id)
    end

    def door_rows
      fresh.log_rows_for('door_controller')
    end

    def signin_rows
      fresh.log_rows_for('signin_audit')
    end

    def clone_dana
      post clone_card_game_url(@game), params: { card_id: DANA_CARD, npc_id: 'dana' }, as: :json
      assert_response :success, response.body
    end

    def swipe(card_ids: [DANA_CARD])
      post unlock_game_url(@game), params: { targetType: 'door', targetId: 'office', method: 'rfid', card_ids: card_ids }, as: :json
      response.parsed_body
    end

    def login(password, username: 'dreyes')
      post login_game_url(@game), params: { pc_id: 'office_pc', username: username, password: password }, as: :json
      response.parsed_body
    end

    test 'the scenario declares two sources, a clock, and a reader per source, and a new game holds no rows' do
      build
      data = fresh.scenario_data
      assert_equal %w[door_controller signin_audit], data['logSources'].keys.sort
      assert data['gameClock']
      readers = data['rooms']['security']['objects'].select { |o| o['type'] == 'ops_log_terminal' }
      assert_equal({ 'door_log_pc' => 'door_controller', 'signin_log_pc' => 'signin_audit' },
                   readers.to_h { |o| [o['id'], o.dig('minigameData', 'logSource')] })
      assert_empty door_rows
      assert_empty signin_rows
      assert_not_nil fresh.player_state['opsLogClockAt'], 'the clock key is seeded for a game with logSources'
    end

    test 'a copied badge opens the office door and writes one ok row naming Dana, in the door source only' do
      build
      clone_dana
      assert_empty door_rows, 'a card copy writes nothing'
      body = swipe
      assert_response :success, body.inspect
      assert_equal 1, door_rows.size
      row = door_rows.first
      assert_equal 'badge_swipe', row['event']
      assert_equal 'ok', row['result']
      assert_equal({ 'npc' => 'dana' }, row['as'])
      assert_equal({ 'kind' => 'door', 'id' => 'office' }, row['where'])
      assert_empty signin_rows
    end

    test 'a swipe with a card that does not admit stores one denied row with no identity' do
      data = scenario
      data['rooms']['lobby']['objects'] << OTHER_CARD.dup
      build(inventory: [OTHER_CARD.dup], scenario: data)
      swipe(card_ids: ['VISITOR-07'])
      assert_response :unprocessable_entity
      assert_equal 1, door_rows.size
      assert_equal 'denied', door_rows.first['result']
      assert_nil door_rows.first['as']
      assert_not_includes fresh.player_state['unlockedRooms'], 'office'
    end

    test 'the sign-in beats write fail, fail, ok, lock and end rows in order, merged and in the sign-in source only' do
      build(office_open: true)
      2.times { login('wrong-guess') }
      assert_equal 1, signin_rows.size
      assert_equal 'signin_fail', signin_rows.first['event']
      assert_equal 2, signin_rows.first['n']
      assert_equal({ 'typed' => 'dreyes' }, signin_rows.first['as'])
      login(DANA_PASSWORD)
      assert_response :success
      post lock_session_game_url(@game), params: { pc_id: 'office_pc' }, as: :json
      assert_response :success, response.body
      login(DANA_PASSWORD) # the right password on a locked session unlocks it: a second signin_ok, merged into the first row (n 2)
      post logout_game_url(@game), params: { pc_id: 'office_pc' }, as: :json
      assert_response :success
      rows = signin_rows
      assert_equal %w[signin_fail signin_ok session_lock session_end], rows.map { |r| r['event'] }
      assert_equal rows.map { |r| r['seq'] }.sort, rows.map { |r| r['seq'] }
      ok = rows[1]
      assert_equal 2, ok['n'], 'the unlock is a second sign-in, merged into the earlier signin_ok row'
      assert_equal({ 'account' => 'dreyes' }, ok['as'])
      assert_equal({ 'method' => 'password', 'route' => 'keyboard' }, ok['detail'])
      assert_equal({ 'kind' => 'pc', 'id' => 'office_pc' }, ok['where'])
      assert_empty door_rows
    end

    test 'five wrong passwords write one merged fail row and one lockout row' do
      build(office_open: true)
      5.times { login('wrong-guess') }
      assert_equal %w[signin_fail signin_lockout], signin_rows.map { |r| r['event'] }
      assert_equal 5, signin_rows.first['n']
    end

    test 'rows carry the game clock, and no stored row holds a registered secret' do
      build
      clone_dana
      swipe
      assert_response :success
      login('wrong-guess')
      login(DANA_PASSWORD)
      rows = door_rows + signin_rows
      assert_equal 3, rows.size
      assert(rows.all? { |r| r['elapsedMs'].is_a?(Integer) && r['serverMs'].is_a?(Integer) })
      secrets = OpsLog.compared_secrets(fresh)
      assert_includes secrets.to_s, DANA_PASSWORD, 'the account password is among the registered secrets'
      rows.each { |r| assert_nil OpsLog.find_secret_hit(secrets, r), "a secret appears in #{r.inspect}" }
      assert_not_includes fresh.player_state['opsLog'].to_json, DANA_PASSWORD
    end

    # ---- L2a: the readers, through GET /log_rows on a re-read game ----

    SEVEN_KEYS = %w[as detail elapsedMs event id result where].freeze

    def read(id, params = {})
      get log_rows_game_url(@game), params: { object_id: id }.merge(params), as: :json
      response.parsed_body
    end

    # The earlier beats, from a fresh game: copy, swipe into the office, two failures, sign in.
    def play_the_beats
      clone_dana
      swipe
      assert_response :success
      2.times { login('wrong-guess') }
      login(DANA_PASSWORD)
    end

    # No registered secret in the text cells of an answer (not the ids or the rev: a short secret could match a hex id).
    def assert_answer_holds_no_secret(body)
      secrets = OpsLog.compared_secrets(fresh)
      assert_includes secrets, DANA_PASSWORD
      (body['rows'] + [{ 'where' => body['title'] }]).each do |r|
        assert_nil OpsLog.find_secret_hit(secrets, r.slice('as', 'where', 'detail')), "a secret in #{r.inspect}"
      end
    end

    def swipe_security
      post unlock_game_url(@game), params: { targetType: 'door', targetId: 'security', method: 'rfid', card_ids: [DANA_CARD] }, as: :json
      assert_response :success, response.body
    end

    test 'a reader in a room not yet reached answers the one 404, whichever reader and whatever the id' do
      build
      play_the_beats
      %w[door_log_pc signin_log_pc nope Door\ log\ PC].each do |id|
        body = read(id)
        assert_response :not_found, id
        assert_equal({ 'success' => false, 'reason' => 'not_found' }, body, id)
      end
    end

    test 'the door reader shows the badge row with the seven keys, and never the sign-in rows' do
      build
      play_the_beats
      swipe_security
      body = read('door_log_pc')
      assert_response :success, body.inspect
      assert_equal 'Door controller', body['title']
      assert_equal 2, body['rows'].size, 'the office swipe and the security swipe'
      row = body['rows'].first
      assert_equal SEVEN_KEYS, row.keys.sort
      assert_match(/\A\h{10}\z/, row['id'])
      assert_equal 'BADGE', row['event']
      assert_equal 'OK', row['result']
      assert_equal 'Dana Reyes', row['as'], 'no source sets showCardHolder, so the holder shows (plan option d)'
      assert_equal ['Finance office', 'Security office'], body['rows'].map { |r| r['where'] },
                   'a door shows the room name, or the sign on its door (what the player reads), never the kind word or an id'
      assert_equal '', row['detail']
      assert_answer_holds_no_secret(body)
      assert_kind_of Integer, row['elapsedMs']
      assert_not_includes response.body, 'SIGN_IN'
    end

    test 'the sign-in reader shows the merged failure, the sign-in and the lock, and never the badge row' do
      build
      play_the_beats
      swipe_security
      post lock_session_game_url(@game), params: { pc_id: 'office_pc' }, as: :json
      body = read('signin_log_pc')
      assert_response :success, body.inspect
      assert_equal 'Sign-in audit', body['title']
      rows = body['rows']
      assert_equal %w[SIGN_IN SIGN_IN SESSION], rows.map { |r| r['event'] }
      assert_equal ['FAIL x2', 'OK', 'OK'], rows.map { |r| r['result'] }
      assert_equal %w[dreyes dreyes], rows.first(2).map { |r| r['as'] }
      assert_equal 'route: keyboard, method: password', rows[1]['detail']
      assert(rows.all? { |r| r.keys.sort == SEVEN_KEYS })
      assert_equal rows.map { |r| r['elapsedMs'] }.sort, rows.map { |r| r['elapsedMs'] }
      assert_answer_holds_no_secret(body)
      assert_not_includes response.body, 'BADGE'
      assert_not_includes response.body, DANA_PASSWORD
      assert_not_includes response.body, DANA_CARD
    end

    test 'a second read with the rev answers unchanged, and a new row changes the rev' do
      build(security_open: true)
      first = read('signin_log_pc')
      assert_equal [], first['rows']
      assert_nil first['unchanged']
      assert_equal({ 'rev' => first['rev'], 'unchanged' => true }, read('signin_log_pc', rev: first['rev']))
      login('wrong-guess')
      second = read('signin_log_pc', rev: first['rev'])
      assert_nil second['unchanged']
      assert_not_equal first['rev'], second['rev']
      assert_equal 1, second['rows'].size
      assert_equal({ 'rev' => second['rev'], 'unchanged' => true }, read('signin_log_pc', rev: second['rev']))
    end

    test 'swiping into the security office writes a badge row, shown in the door reader only' do
      build(office_open: true)
      clone_dana
      swipe_security
      assert_includes fresh.player_state['unlockedRooms'], 'security'
      body = read('door_log_pc')
      assert_response :success
      assert_equal 1, body['rows'].size
      assert_equal 'BADGE', body['rows'].first['event']
      assert_empty read('signin_log_pc')['rows']
    end

    test 'the leak scanner judges the real /log_rows answers clean, and flags the same answers with a secret or a raw id put in' do
      build
      play_the_beats
      swipe_security
      answers = %w[door_log_pc signin_log_pc].map do |id|
        body = read(id)
        ['GET', "/break_escape/games/#{@game.id}/log_rows?object_id=#{id}", body]
      end
      lines = ->(list) { list.each_with_index.map { |(m, path, body), i| ['run.jsonl', i + 1, { 'method' => m, 'path' => path, 'status' => 200, 'body' => body }] } }
      scanner = -> { AccessLeakScanner.new(fresh.scenario_data, game: fresh) }
      assert_equal [], scanner.call.scan(lines.call(answers)).map(&:rule), 'a real answer holds nothing the scanner refuses (the typed identity of the failed sign-in included)'
      assert_includes answers.last[2]['rows'].map { |r| r['as'] }, 'dreyes'
      leaked = Marshal.load(Marshal.dump(answers))
      leaked.first[2]['rows'].first['where'] = 'office'
      leaked.last[2]['rows'].last['detail'] = "code: #{DANA_PASSWORD}"
      assert_equal %w[log_row password], scanner.call.scan(lines.call(leaked)).map(&:rule).uniq.sort
    end

    test 'a read writes no row, with or without a route param, and an unscoped reader ignores the route' do
      build
      play_the_beats
      swipe_security
      before = door_rows.size + signin_rows.size
      plain = read('door_log_pc')
      assert_response :success
      routed = read('signin_log_pc', foothold: 'x')
      assert_response :success, 'both readers are room objects, so a route param names nothing and is ignored (the refusal by route is in log_rows_test)'
      assert_equal 2, plain['rows'].size
      assert_equal 2, routed['rows'].size
      assert_equal before, door_rows.size + signin_rows.size
    end

    test 'the log sources are not shipped in the scenario answer' do
      build
      get scenario_game_url(@game), as: :json
      assert_response :success
      assert_not_includes response.body, 'logSources'
      assert_not_includes response.body, 'door_controller'
    end
  end
end
