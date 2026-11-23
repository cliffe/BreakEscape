require 'test_helper'
require_relative '../../support/access_model_scenario'
require_relative '../../support/log_rows_body_scan'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops log stage L1b (OPS_LOG_ROWS_PLAN.md section 11, "Feature scenario" and "Server, per call
  # site"): the real scenarios/test_ops_logs/scenario.json.erb driven through the routes. Every
  # assertion reads a re-read game (Game.find), so a missing save fails.
  class OpsLogsScenarioTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include LogRowsBodyScan

    CLONER = AccessModelScenario::CLONER
    DANA_CARD = 'FIN-DANA-01'.freeze
    DANA_PASSWORD = 'Ledger-Dana-7'.freeze
    SCENARIO_PATH = File.expand_path('../../../scenarios/test_ops_logs/scenario.json.erb', __dir__)
    OTHER_CARD = { 'id' => 'visitor_card', 'type' => 'keycard', 'name' => 'Visitor card', 'card_id' => 'VISITOR-07',
                   'rfid_protocol' => 'EM4100', 'takeable' => true }.freeze

    def scenario
      JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
    end

    # The client reads a missing `locked` as a key lock, so a click on the folder would never request
    # it (the share would close and reopen). The share's folder must say `locked: false`.
    test 'the share folder inbox_letters is authored unlocked' do
      share = scenario.dig('resources', 'scanned_inbox') || scenario['resources'].values.find { |r| r.is_a?(Hash) && r['contents'] }
      folder = Array(share['contents']).find { |o| o['id'] == 'inbox_letters' }
      assert folder, 'inbox_letters is in the share'
      assert_equal false, folder['locked']
    end

    # office_open: start with the office door already open, as a player is once through it.
    def build(inventory: [CLONER.dup], scenario: self.scenario, office_open: false, security_open: false)
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user), scenario: scenario,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => (%w[lobby comms_room] + (office_open || security_open ? %w[office] : []) + (security_open ? %w[security] : [])),
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

    test 'the scenario declares four sources, a clock, and a reader per source, and a new game holds no rows' do
      build
      data = fresh.scenario_data
      assert_equal %w[door_controller network_log night_log signin_audit], data['logSources'].keys.sort # night_log: L2b, network_log: L3
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
      assert_body_holds_no_secret(fresh, response.body)
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
                   'a door shows the sign on its door (what the player reads), else the room name, never the kind word or an id'
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

    # ---- L2b: seed rows, the anomaly and the flag in the real scenario ----

    def find_object(node, id)
      case node
      when Hash then node['id'] == id && node['type'] ? node : node.each_value.lazy.filter_map { |v| find_object(v, id) }.first
      when Array then node.lazy.filter_map { |v| find_object(v, id) }.first
      end
    end

    test 'L2b: the night log reader is in the office, answers four authored rows, and the swipes add none' do
      build
      assert_equal({ 'success' => false, 'reason' => 'not_found' }, read('night_log_pc'), 'the office is still locked')
      build(office_open: true)
      body = read('night_log_pc')
      assert_response :success, body.inspect
      assert_equal 'Night door log', body['title']
      assert_equal %w[s1 s2 s3 s4], body['rows'].map { |r| r['id'] }
      assert_equal ['Mon 08:12', 'Mon 08:14', 'Mon 23:58', 'Tue 07:55'], body['rows'].map { |r| r['at'] }
      assert_equal ['Finance office', 'Security office', 'Security office', 'Finance office'], body['rows'].map { |r| r['where'] }
      assert_equal ['Dana Reyes'], body['rows'].map { |r| r['as'] }.uniq
      assert_equal %w[BADGE], body['rows'].map { |r| r['event'] }.uniq
      assert(body['rows'].all? { |r| r.keys.sort == %w[as at detail event id result where] })
      clone_dana
      swipe_security
      assert_equal 4, read('night_log_pc')['rows'].size, 'the night log takes no play row (its where is the lobby)'
      assert_equal 1, read('door_log_pc')['rows'].size, 'the door log keeps its own row (the security swipe)'
    end

    test 'L2b: the browser copy of the office holds the anomaly row and the flag actions with the reader (the flag is checked there)' do
      build(office_open: true)
      get room_game_url(@game, room_id: 'office'), as: :json
      assert_response :success
      reader = find_object(JSON.parse(response.body), 'night_log_pc')
      assert_equal({ 'logSource' => 'night_log', 'anomaly' => { 'rowId' => 's3' }, 'flagActionLabel' => 'Flag the odd swipe',
                     'flagActions' => [{ 'type' => 'set_global', 'key' => 'found_night_swipe', 'value' => true }],
                     'completionActions' => [{ 'type' => 'complete_task', 'taskId' => 'l3_flagged_night_swipe' }] }, reader['minigameData'])
      assert_equal 's3', read('night_log_pc')['rows'].find { |r| r['at'] == 'Mon 23:58' }['id'], 'the answer gives that seed row the id the reader names'
    end

    test 'L2b: there is no flag route, and the game holds no flag state after reading the night log' do
      build(office_open: true)
      read('night_log_pc')
      begin
        post "/break_escape/games/#{@game.id}/log_rows/flag", params: { object_id: 'night_log_pc', row_id: 's3' }, as: :json
        assert_response :not_found
      rescue ActionController::RoutingError
        pass
      end
      assert_nil fresh.player_state['opsLogFlagged']
      assert_nil read('night_log_pc')['flaggedRow']
    end

    test 'L2b: the leak scanner judges a whole night-log run clean, readers with their anomaly included' do
      build(office_open: true)
      lines = []
      note = lambda do |method, path, body|
        lines << ['run.jsonl', lines.size + 1, { 'method' => method, 'path' => path, 'status' => 200, 'body' => body }]
      end
      base = "/break_escape/games/#{@game.id}"
      get room_game_url(@game, room_id: 'office'), as: :json
      note.call('GET', "#{base}/room/office", response.parsed_body)
      note.call('GET', "#{base}/log_rows?object_id=night_log_pc", read('night_log_pc'))
      note.call('GET', "#{base}/log_rows?object_id=night_log_pc", read('night_log_pc'))
      assert_equal [], AccessLeakScanner.new(fresh.scenario_data, game: fresh).scan(lines).select { |f| f.rule == 'log_row' }.map(&:owner)
    end

    # ---- L3: the network and share rows in the real scenario, read from the network log reader ----

    DROP_BOX = { 'type' => 'pc', 'id' => 'kit_dropbox', 'name' => 'Network drop box' }.freeze
    WIFI_KEY = 'seabreeze-2025'.freeze
    LAN_JACK = 'jack_comms_port'.freeze

    def game_url_for(suffix)
      "/break_escape/games/#{@game.id}/#{suffix}"
    end

    def take_drop_box
      post game_url_for('inventory'), params: { action_type: 'add', item: DROP_BOX }, as: :json
      assert_response :success, response.body
    end

    def plant
      post game_url_for('network/plant'), params: { jack_id: 'comms_port' }, as: :json
      assert_response :success, response.body
    end

    def unplug
      post game_url_for('network/unplug'), params: { jack_id: 'comms_port' }, as: :json
      assert_response :success, response.body
    end

    def join(key)
      post game_url_for('network/join'), params: { ap_id: 'guest_ap', key: key }, as: :json
      response.parsed_body
    end

    def open_share(id)
      get game_url_for("container/#{id}"), params: { foothold: LAN_JACK }, as: :json
      assert_response :success, response.body
    end

    def net_rows
      fresh.log_rows_for('network_log')
    end

    def shown(body)
      body['rows'].map { |r| r.slice('event', 'as', 'where', 'result', 'detail') }
    end

    test 'L3: the network log reader is in the comms room, which is open, and a new game holds no network row' do
      build
      reader = find_object(scenario['rooms']['comms_room'], 'net_log_pc')
      assert_equal 'network_log', reader.dig('minigameData', 'logSource')
      body = read('net_log_pc')
      assert_response :success, body.inspect
      assert_equal 'Network log', body['title']
      assert_equal [], body['rows']
      assert_empty net_rows
    end

    test 'L3: the real comms room carries no lock, and a game that starts with only the lobby opens it by the unlock call and reads its log' do
      room = scenario['rooms']['comms_room']
      assert_nil room['locked']
      assert_nil room['lockType']
      assert_nil room['requires']
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user), scenario: scenario,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby], 'encounteredNPCs' => %w[dana], 'inventory' => [] }
      )
      get game_url_for('room/comms_room'), as: :json
      assert_response :forbidden, 'the helper pre-open is what let the other tests in; the room is not served before the door opens'
      post game_url_for('unlock'), params: { targetType: 'door', targetId: 'comms_room' }, as: :json
      assert_response :success, response.body
      get game_url_for('room/comms_room'), as: :json
      assert_response :success, response.body
      body = read('net_log_pc')
      assert_response :success, body.inspect
      assert_equal 'Network log', body['title']
    end

    test 'L3: plant, unplug, join and a share and folder open write their rows, read back from the network log with authored names' do
      build
      take_drop_box
      plant
      unplug
      plant
      assert_equal 'wrong_key', join('not-the-key')['reason']
      assert_equal %w[net_link_up net_link_down net_link_up], net_rows.map { |r| r['event'] }, 'a wrong key writes nothing, and the second plant is its own row (13.8: one per plant or unplug)'
      assert_equal [nil, nil, nil], net_rows.map { |r| r['n'] }
      assert_not Game.find(@game.id).player_state.key?('netLinkSteps')
      assert_equal true, join(WIFI_KEY)['success']
      open_share('scanned_inbox')
      open_share('inbox_letters')
      body = read('net_log_pc')
      assert_response :success, body.inspect
      assert_equal [
        { 'event' => 'NET_LINK_UP', 'as' => '-', 'where' => 'Spare wall port', 'result' => 'OK', 'detail' => '' },
        { 'event' => 'NET_LINK_DOWN', 'as' => '-', 'where' => 'Spare wall port', 'result' => 'OK', 'detail' => '' },
        { 'event' => 'NET_LINK_UP', 'as' => '-', 'where' => 'Spare wall port', 'result' => 'OK', 'detail' => '' },
        { 'event' => 'NET_WIFI_JOIN', 'as' => '-', 'where' => 'Guest access point', 'result' => 'OK', 'detail' => '' },
        { 'event' => 'SHARE_OPEN', 'as' => '-', 'where' => 'Scanned-Inbox', 'result' => 'OK', 'detail' => '' },
        { 'event' => 'SHARE_OPEN', 'as' => '-', 'where' => 'Scanned-Inbox', 'result' => 'OK', 'detail' => 'folder: Letters' }
      ], shown(body)
      assert(body['rows'].all? { |r| r.keys.sort == SEVEN_KEYS })
      assert_answer_holds_no_secret(body)
      # every raw id, the key, the host and the network name stay out of the answer (T1)
      %w[inbox_letters letter.txt comms_port guest_ap scanned_inbox kit_dropbox jack_ wifi_ OL-FS07 Harbour\ office\ LAN].push(WIFI_KEY).each do |raw|
        assert_not_includes response.body, raw
      end
    end

    test 'L3: a repeat folder open writes no second row and saves nothing' do
      build
      take_drop_box
      plant
      open_share('scanned_inbox')
      open_share('inbox_letters')
      before = [net_rows.size, fresh.updated_at]
      2.times { open_share('inbox_letters') }
      open_share('scanned_inbox')
      assert_equal before, [net_rows.size, fresh.updated_at]
      assert_equal 3, net_rows.size
    end

    test 'L3: a card copy writes no network row, and the network rows stay out of the other readers and theirs out of this one' do
      build(security_open: true)
      clone_dana
      assert_empty net_rows
      play_the_beats
      swipe_security
      assert_empty net_rows, 'badge and sign-in rows are not taken by the network source'
      doors_before = read('door_log_pc')['rows'].size
      sign_ins_before = read('signin_log_pc')['rows'].size
      take_drop_box
      plant
      join(WIFI_KEY)
      open_share('scanned_inbox')
      assert_equal 3, net_rows.size
      assert_equal doors_before, read('door_log_pc')['rows'].size
      assert_equal sign_ins_before, read('signin_log_pc')['rows'].size
      assert_equal 4, read('night_log_pc')['rows'].size
      assert_equal %w[NET_LINK_UP NET_WIFI_JOIN SHARE_OPEN], read('net_log_pc')['rows'].map { |r| r['event'] }
      assert_not_includes read('door_log_pc').to_json, 'NET_'
      assert_not_includes read('signin_log_pc').to_json, 'SHARE_'
    end

    test 'L3: the leak scanner judges the whole network run clean, the log answer with the names the player was shown first' do
      build
      lines = []
      note = lambda do |method, path, body|
        lines << ['run.jsonl', lines.size + 1, { 'method' => method, 'path' => path, 'status' => 200, 'body' => body }]
      end
      base = "/break_escape/games/#{@game.id}"
      take_drop_box
      post game_url_for('network/plant'), params: { jack_id: 'comms_port' }, as: :json
      note.call('POST', "#{base}/network/plant", response.parsed_body)
      get game_url_for('network'), params: { foothold: LAN_JACK }, as: :json
      note.call('GET', "#{base}/network?foothold=#{LAN_JACK}", response.parsed_body)
      %w[scanned_inbox inbox_letters].each do |id|
        get game_url_for("container/#{id}"), params: { foothold: LAN_JACK }, as: :json
        note.call('GET', "#{base}/container/#{id}?foothold=#{LAN_JACK}", response.parsed_body)
      end
      note.call('GET', "#{base}/log_rows?object_id=net_log_pc", read('net_log_pc'))
      findings = AccessLeakScanner.new(fresh.scenario_data, game: fresh).scan(lines)
      assert_equal [], findings.map { |f| [f.rule, f.owner] }
      # the allowance is tied to the open (L3b S1): the same run without the two /container lines
      # names the share in a row the player had not earned
      bare = lines.reject { |l| l[2]['path'].include?('/container/') }
      assert_includes AccessLeakScanner.new(fresh.scenario_data, game: fresh).scan(bare).map { |f| [f.rule, f.owner] }, %w[network_string resource:scanned_inbox]
    end
  end
end
