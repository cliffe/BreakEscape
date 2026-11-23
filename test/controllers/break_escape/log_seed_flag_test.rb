require 'test_helper'
require_relative '../../support/access_model_scenario'
require_relative '../../support/ops_log_assertions'
require_relative '../../support/log_rows_body_scan'

module BreakEscape
  # Ops log reader, plan stage L2b (OPS_LOG_ROWS_PLAN.md 4.2, 5.1, 7, 11): seed rows in GET /log_rows, and
  # the server-judged flag, POST /log_rows/flag, through the real routes on a re-read game.
  class LogSeedFlagTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include OpsLogAssertions
    include LogRowsBodyScan

    SEVEN_PLAY_KEYS = %w[as detail elapsedMs event id result where].freeze
    SEVEN_SEED_KEYS = %w[as at detail event id result where].freeze
    NOT_FOUND = { 'success' => false, 'reason' => 'not_found' }.freeze

    DOOR_SEEDS = [
      { 'id' => 's1', 'at' => 'Mon 23:58', 'event' => 'badge_swipe', 'as' => 'jake', 'where' => { 'kind' => 'door', 'id' => 'lobby' }, 'result' => 'ok' },
      { 'id' => 's2', 'at' => 'Tue 02:14', 'event' => 'badge_swipe', 'as' => 'exec', 'where' => { 'kind' => 'door', 'id' => 'finance' }, 'result' => 'ok' },
      { 'id' => 's3', 'at' => 'Tue 07:12', 'event' => 'badge_swipe', 'as' => 'len', 'where' => { 'kind' => 'door', 'id' => 'finance' }, 'result' => 'denied' }
    ].freeze
    AUDIT_SEEDS = [
      { 'id' => 's1', 'at' => '07:12', 'event' => 'signin_fail', 'as' => 'J.Price', 'where' => { 'kind' => 'pc', 'id' => 'jake_pc' }, 'result' => 'fail' },
      { 'id' => 's2', 'at' => '07:30', 'event' => 'signin_ok', 'as' => 'jake', 'where' => { 'kind' => 'pc', 'id' => 'jake_pc' }, 'result' => 'ok',
        'detail' => { 'method' => 'password', 'route' => 'keyboard' } }
    ].freeze

    def reader(id, source, extra = {})
      mg = { 'logSource' => source }.merge(extra.delete('minigameData') || {})
      { 'id' => id, 'type' => 'ops_log_terminal', 'name' => "Reader #{id}", 'minigameData' => mg }.merge(extra)
    end

    def scenario
      data = AccessModelScenario.routes_scenario
      data['gameClock'] = { 'start' => 'Tue 08:30' }
      data['logSources'] = {
        'doors' => { 'title' => 'Doors', 'events' => ['badge_swipe'], 'seedRows' => DOOR_SEEDS.deep_dup },
        'audit' => { 'title' => 'Audit', 'events' => ['signin_*', 'badge_swipe'], 'seedRows' => AUDIT_SEEDS.deep_dup },
        'bare' => { 'title' => 'Bare', 'events' => ['badge_swipe'] }
      }
      lobby = data['rooms']['lobby']
      lobby['objects'] += [
        reader('r_doors', 'doors', 'minigameData' => { 'anomaly' => { 'rowId' => 's2' }, 'flagActions' => [{ 'type' => 'set_global', 'key' => 'found_night_swipe', 'value' => true }],
                                                       'completionActions' => [{ 'type' => 'set_global', 'key' => 'log_done', 'value' => true }] }),
        reader('r_audit', 'audit', 'minigameData' => { 'anomaly' => { 'rowId' => 's1' } }),
        reader('r_plain', 'doors'),
        reader('r_bare', 'bare')
      ]
      data['rooms']['finance']['objects'] << reader('r_vault', 'doors', 'minigameData' => { 'anomaly' => { 'rowId' => 's2' } })
      data
    end

    def build(player_state = {})
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user), scenario: scenario,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby] }.merge(player_state)
      )
    end

    def read(object_id, params = {})
      get "/break_escape/games/#{@game.id}/log_rows", params: { object_id: object_id }.merge(params), as: :json
      response.parsed_body
    end

    # ---- seed rows (L2b step 2) ----

    test 'a source with seed rows lists them first, in order, then the play rows' do
      build
      body = read('r_doors')
      assert_response :success, response.body
      assert_equal %w[s1 s2 s3], body['rows'].map { |r| r['id'] }
      assert_equal ['Mon 23:58', 'Tue 02:14', 'Tue 07:12'], body['rows'].map { |r| r['at'] }
      assert_equal %w[OK OK DENIED], body['rows'].map { |r| r['result'] }
      assert_equal ['Jake Brooks', 'Morgan Hale', 'Len Okafor'], body['rows'].map { |r| r['as'] }
      assert_equal %w[BADGE], body['rows'].map { |r| r['event'] }.uniq
      write_play_row
      body = read('r_doors')
      assert_equal 4, body['rows'].size
      assert_equal %w[s1 s2 s3], body['rows'].first(3).map { |r| r['id'] }
      assert_equal SEVEN_PLAY_KEYS, body['rows'].last.keys.sort
      assert_match(/\A\h{10}\z/, body['rows'].last['id'])
    end

    test 'a seed row has the same seven keys as a play row with at for elapsedMs, and holds nothing stored' do
      build
      body = read('r_audit')
      body['rows'].each { |row| assert_equal SEVEN_SEED_KEYS, row.keys.sort }
      assert_equal 'j.price', body['rows'][0]['as'], 'a username goes through the typed form'
      assert_equal 'FAIL', body['rows'][0]['result']
      assert_equal "Jake's PC", body['rows'][0]['where']
      assert_equal ['method: password', 'route: keyboard'], body['rows'][1]['detail'].split(', ').sort
      assert_equal '', body['rows'][0]['detail']
      assert_equal 'Jake Brooks', body['rows'][1]['as']
      assert_no_match(/seedRows|"seq"|logSources|serverMs/, response.body)
    end

    test 'a seed row is never read through the flagged rule' do
      scenario_with = scenario
      scenario_with['logSources']['doors']['seedRows'][0]['detail'] = { 'flagged' => 1 }
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user), scenario: scenario_with,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby] }
      )
      row = read('r_doors')['rows'].first
      assert_equal 'Jake Brooks', row['as'], 'the card holder rule does not hide an authored identity'
      assert_equal '', row['detail'], 'a hidden key is never shown'
    end

    test 'a source without seed rows answers as before and a malformed entry is skipped' do
      build
      assert_equal [], read('r_bare')['rows']
      data = scenario
      data['logSources']['bare']['seedRows'] = ['x', { 'id' => 's1' }, { 'id' => 's2', 'at' => '07:00', 'event' => 'nope', 'result' => 'ok' },
                                                DOOR_SEEDS[0].deep_dup, DOOR_SEEDS[0].deep_dup]
      @game = create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user), scenario: data,
                                 player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby] })
      assert_equal %w[s1], read('r_bare')['rows'].map { |r| r['id'] }
    end

    test 'the rev changes with a seed row and not with the unchanged answer' do
      build
      body = read('r_doors')
      again = read('r_doors', rev: body['rev'])
      assert_equal({ 'rev' => body['rev'], 'unchanged' => true }, again)
      assert_not_equal body['rev'], read('r_audit')['rev']
    end

    # ---- the flag (L2b step 3) ----

    def flag(object_id, row_id, params = {})
      post "/break_escape/games/#{@game.id}/log_rows/flag", params: { object_id: object_id, row_id: row_id }.merge(params), as: :json
      response.parsed_body
    end

    def stored_flags
      Game.find(@game.id).player_state['opsLogFlagged']
    end

    def find_object(node, id)
      case node
      when Hash then node['id'] == id && node['type'] ? node : node.each_value.lazy.filter_map { |v| find_object(v, id) }.first
      when Array then node.lazy.filter_map { |v| find_object(v, id) }.first
      end
    end

    test 'the browser copy of a reader holds no anomaly row and no flag actions' do
      build
      served = {}
      get scenario_game_url(@game), as: :json
      assert_response :success
      served['bootstrap'] = response.body
      get room_game_url(@game, room_id: 'lobby'), as: :json
      assert_response :success
      served['room'] = response.body
      served.each do |name, body|
        assert_no_match(/"rowId"|found_night_swipe|log_done|flagActions|completionActions/, body, name)
      end
      reader = find_object(JSON.parse(served['room']), 'r_doors')
      assert_equal({ 'logSource' => 'doors', 'anomaly' => {} }, reader['minigameData'])
      assert_equal({ 'logSource' => 'doors' }, find_object(JSON.parse(served['room']), 'r_plain')['minigameData'])
    end

    test 'a right flag answers the actions once, a repeat answers already and no actions' do
      build
      body = flag('r_doors', 's2')
      assert_response :success, response.body
      assert_equal true, body['correct']
      assert_equal 's2', body['rowId']
      assert_equal [{ 'type' => 'set_global', 'key' => 'found_night_swipe', 'value' => true }], body['flagActions']
      assert_equal [{ 'type' => 'set_global', 'key' => 'log_done', 'value' => true }], body['completionActions']
      assert_equal %w[r_doors], stored_flags
      again = flag('r_doors', 's2')
      assert_equal({ 'correct' => true, 'already' => true, 'rowId' => 's2' }, again)
      assert_equal %w[r_doors], stored_flags
    end

    test 'a wrong flag of any kind answers the same body and writes nothing' do
      build
      write_play_row
      play_id = read('r_doors')['rows'].last['id']
      game = Game.find(@game.id)
      game.write_log_row!('badge_swipe', as: { npc: 'len' }, where: { kind: 'door', id: 'lobby' }, result: 'ok')
      game.save!
      audit_play_id = read('r_audit')['rows'].last['id']
      before = Game.find(@game.id)
      state = before.player_state.deep_dup
      stamp = before.updated_at
      wrong = ['s1', 's3', 's9', 'S2', 's2 ', play_id, audit_play_id, 'x' * 64, '0000000000', "s2\u0000"]
      wrong.each do |row_id|
        body = flag('r_doors', row_id)
        assert_response :success, row_id.inspect
        assert_equal({ 'correct' => false }, body, row_id.inspect)
      end
      assert_equal({ 'correct' => false }, flag('r_plain', 's2'), 'a reader with no anomaly answers like a wrong row')
      assert_equal({ 'correct' => false }, flag('r_bare', 's1'))
      assert_equal({ 'correct' => false }, flag('r_audit', 's2'), "another reader's anomaly id is just a wrong row here")
      after = Game.find(@game.id)
      assert_equal state, after.player_state
      assert_equal stamp, after.updated_at
    end

    test 'an id of another reader reads as wrong, and the right id of each reader is judged per reader' do
      build
      assert_equal({ 'correct' => false }, flag('r_audit', 's2'))
      assert_equal true, flag('r_audit', 's1')['correct']
      assert_equal true, flag('r_doors', 's2')['correct']
      assert_equal %w[r_audit r_doors], stored_flags.sort
    end

    test 'a malformed object or row is a 400, an invented, unreached or non-reader object the same 404' do
      build
      post "/break_escape/games/#{@game.id}/log_rows/flag", params: { row_id: 's2' }, as: :json
      assert_response :bad_request
      assert_equal({ 'success' => false, 'reason' => 'invalid_object' }, response.parsed_body)
      post "/break_escape/games/#{@game.id}/log_rows/flag", params: { object_id: 'r_doors' }, as: :json
      assert_response :bad_request
      assert_equal({ 'success' => false, 'reason' => 'invalid_row' }, response.parsed_body)
      post "/break_escape/games/#{@game.id}/log_rows/flag", params: { object_id: 'r_doors', row_id: ['s2'] }, as: :json
      assert_response :bad_request
      post "/break_escape/games/#{@game.id}/log_rows/flag", params: { object_id: 'r_doors', row_id: 'x' * 65 }, as: :json
      assert_response :bad_request
      ['no_such_reader', 'Reader r_doors', 'r_vault', 'jake_pc', 'lobby_safe'].each do |id|
        assert_equal NOT_FOUND, flag(id, 's2'), id
        assert_response :not_found, id
      end
      assert_nil stored_flags
    end

    test 'a reader the player has not reached cannot be flagged, even with the right row, until it is reached' do
      build
      assert_equal NOT_FOUND, flag('r_vault', 's2')
      assert_nil stored_flags
      open_finance
      assert_equal true, flag('r_vault', 's2')['correct']
    end

    test 'a flag through a reader that needs a session is refused after the session is gone' do
      data = scenario
      jake_pc = data['rooms']['finance']['objects'].find { |o| o['id'] == 'jake_pc' }
      jake_pc['contents'] << reader('r_desktop', 'doors', 'minigameData' => { 'anomaly' => { 'rowId' => 's2' } })
      @game = create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user), scenario: data,
                                 player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby finance] })
      assert_equal NOT_FOUND, flag('r_desktop', 's2')
      post login_game_url(@game), params: { pc_id: 'jake_pc', username: 'jbrooks', password: AccessModelScenario::JAKE_PASSWORD }, as: :json
      assert_response :success, response.body
      assert_equal true, flag('r_desktop', 's2')['correct']
      post logout_game_url(@game), params: { pc_id: 'jake_pc' }, as: :json
      assert_equal NOT_FOUND, flag('r_desktop', 's2')
    end

    test 'the reader answer names the flagged row only after a right flag' do
      build
      before = read('r_doors')
      assert_not before.key?('flaggedRow')
      flag('r_doors', 's3')
      assert_not read('r_doors').key?('flaggedRow'), 'a wrong flag changes nothing'
      flag('r_doors', 's2')
      after = read('r_doors')
      assert_equal 's2', after['flaggedRow']
      assert_equal before['rows'], after['rows']
      assert_equal before['rev'], after['rev']
      assert_not read('r_audit').key?('flaggedRow')
      assert_no_match(/flaggedRow/, read('r_doors', rev: after['rev']).to_json)
    end

    test 'nothing but the reader names the anomaly: no key, class or order marks the row before a right flag' do
      build
      rows = read('r_doors')['rows']
      assert_equal [SEVEN_SEED_KEYS], rows.map { |r| r.keys.sort }.uniq
      assert_equal rows.map { |r| r['id'] }.sort, rows.map { |r| r['id'] }, 'ids are in authored order, the anomaly is not first'
      assert_not_equal 's2', rows.first['id']
      assert_no_match(/anomal|flag|tint|highlight/i, response.body)
    end

    test 'the flag state is server-owned: never in the bootstrap, not changed by a sync body' do
      build
      flag('r_doors', 's2')
      get "/break_escape/games/#{@game.id}/scenario", as: :json
      assert_no_match(/opsLogFlagged/, response.body)
      put "/break_escape/games/#{@game.id}/sync_state", params: { opsLogFlagged: ['r_audit'], globalVariables: {} }, as: :json
      assert_equal %w[r_doors], stored_flags
    end

    test 'a flag answer holds no secret, and no row of the game' do
      build
      body = flag('r_doors', 's2')
      assert_body_holds_no_secret(Game.find(@game.id), body.to_json)
      assert_not_includes body.to_json, AccessModelScenario::JAKE_PASSWORD
    end

    def write_play_row
      game = Game.find(@game.id)
      game.write_log_row!('badge_swipe', as: { npc: 'jake' }, where: { kind: 'door', id: 'lobby' }, result: 'ok')
      game.save!
      @game = game
    end

    def open_finance
      state = Game.find(@game.id).player_state
      @game.update!(player_state: state.merge('unlockedRooms' => %w[lobby finance]))
    end
  end
end
