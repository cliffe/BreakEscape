require 'test_helper'
require_relative '../../support/access_model_scenario'

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
    def build(inventory: [CLONER.dup], scenario: self.scenario, office_open: false)
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user), scenario: scenario,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => office_open ? %w[lobby office] : %w[lobby],
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

    test 'the scenario declares two sources, a clock, and no reader, and a new game holds no rows' do
      build
      data = fresh.scenario_data
      assert_equal %w[door_controller signin_audit], data['logSources'].keys.sort
      assert data['gameClock']
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
      login(DANA_PASSWORD) # the right password on a locked session unlocks it: no sign-in row
      post logout_game_url(@game), params: { pc_id: 'office_pc' }, as: :json
      assert_response :success
      rows = signin_rows
      assert_equal %w[signin_fail signin_ok session_lock session_end], rows.map { |r| r['event'] }
      assert_equal rows.map { |r| r['seq'] }.sort, rows.map { |r| r['seq'] }
      ok = rows[1]
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

    test 'the log sources are not shipped in the scenario answer' do
      build
      get scenario_game_url(@game), as: :json
      assert_response :success
      assert_not_includes response.body, 'logSources'
      assert_not_includes response.body, 'door_controller'
    end
  end
end
