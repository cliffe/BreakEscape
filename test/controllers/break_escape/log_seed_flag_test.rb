require 'test_helper'
require_relative '../../support/access_model_scenario'
require_relative '../../support/ops_log_assertions'
require_relative '../../support/log_rows_body_scan'

module BreakEscape
  # Ops log reader, plan stage L2b (OPS_LOG_ROWS_PLAN.md 4.2, 5.1, 7, 11): seed rows in GET /log_rows, and
  # the reader's anomaly and flag actions reaching the browser (the flag is checked on the client; no
  # route judges it), through the real routes on a re-read game.
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

    test 'a seed row with a bad id, stamp or result is not shown (a snapshot is not re-validated)' do
      data = scenario
      bad = [
        DOOR_SEEDS[0].merge('id' => 'x1'), DOOR_SEEDS[0].merge('id' => 's1234'), DOOR_SEEDS[0].merge('id' => 's2', 'at' => 'a very long stamp'),
        DOOR_SEEDS[0].merge('id' => 's3', 'at' => '25:99'), DOOR_SEEDS[0].merge('id' => 's4', 'result' => 'exploded'),
        DOOR_SEEDS[0].merge('id' => 's5', 'result' => 'x' * 500), DOOR_SEEDS[0].deep_dup
      ]
      data['logSources']['bare']['seedRows'] = bad
      @game = create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user), scenario: data,
                                 player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby] })
      assert_equal %w[s1], read('r_bare')['rows'].map { |r| r['id'] }
    end

    test 'a seed row answers its authored id, so the browser can compare it with anomaly.rowId' do
      build
      assert_equal %w[s1 s2 s3], read('r_doors')['rows'].map { |r| r['id'] }
      assert_equal 's2', find_object(JSON.parse(room_json), 'r_doors').dig('minigameData', 'anomaly', 'rowId')
    end

    test 'the rev changes with a seed row and not with the unchanged answer' do
      build
      body = read('r_doors')
      again = read('r_doors', rev: body['rev'])
      assert_equal({ 'rev' => body['rev'], 'unchanged' => true }, again)
      first = body['rev']
      data = scenario
      data['logSources']['doors']['seedRows'][1]['at'] = 'Tue 02:15'
      @game = create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user), scenario: data,
                                 player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby] })
      assert_not_equal first, read('r_doors')['rev']
    end

    # ---- the anomaly and the flag actions reach the browser (plan 7); the flag is checked there ----

    def write_play_row
      game = Game.find(@game.id)
      game.write_log_row!('badge_swipe', as: { npc: 'jake' }, where: { kind: 'door', id: 'lobby' }, result: 'ok')
      game.save!
      @game = game
    end

    def room_json
      get room_game_url(@game, room_id: 'lobby'), as: :json
      assert_response :success
      response.body
    end

    def find_object(node, id)
      case node
      when Hash then node['id'] == id && node['type'] ? node : node.each_value.lazy.filter_map { |v| find_object(v, id) }.first
      when Array then node.lazy.filter_map { |v| find_object(v, id) }.first
      end
    end

    test 'a reader reaches the browser with its anomaly row and its flag and completion actions' do
      build
      body = room_json
      assert_match(/"rowId":"s2"/, body)
      assert_match(/found_night_swipe/, body)
      assert_match(/log_done/, body)
      mg = find_object(JSON.parse(room_json), 'r_doors')['minigameData']
      assert_equal 's2', mg.dig('anomaly', 'rowId')
      assert_equal [{ 'type' => 'set_global', 'key' => 'found_night_swipe', 'value' => true }], mg['flagActions']
      assert_equal [{ 'type' => 'set_global', 'key' => 'log_done', 'value' => true }], mg['completionActions']
      assert_equal({ 'logSource' => 'doors' }, find_object(JSON.parse(room_json), 'r_plain')['minigameData'])
    end

    test 'there is no flag route: the server judges nothing and holds no flag state' do
      build
      begin
        post "/break_escape/games/#{@game.id}/log_rows/flag", params: { object_id: 'r_doors', row_id: 's2' }, as: :json
        assert_response :not_found
      rescue ActionController::RoutingError
        pass # a routing error is the other form of "no such route"
      end
      get scenario_game_url(@game), as: :json
      assert_no_match(/opsLogFlagged|flaggedRow/, response.body)
      assert_no_match(/flaggedRow/, read('r_doors').to_json)
      assert_nil Game.find(@game.id).player_state['opsLogFlagged']
    end
  end
end
