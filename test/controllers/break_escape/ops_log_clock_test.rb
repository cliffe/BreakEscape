require 'test_helper'
require_relative '../../support/network_model_scenario'

module BreakEscape
  # Ops log clock stamp, plan stage L1a (OPS_LOG_ROWS_PLAN.md 13.4 and 11 "Clock, L1a"), through the
  # real routes. The key is the opt-in marker: only a game whose scenario has logSources ever holds it,
  # and the sync (which loads no scenario_data) decides on the key alone.
  class OpsLogClockTest < ActionDispatch::IntegrationTest
    include NetworkRequests

    T0 = 1_763_550_000_000
    EVENTS = { 'tst_note' => { label: 'NOTE', places: [], results: %w[ok] } }.freeze
    SOURCES = { 'notes' => { 'title' => 'Notes', 'events' => ['tst_note'] } }.freeze

    setup { Thread.current[:ops_log_overlay] = { events: EVENTS, kinds: {} } }

    teardown do
      Thread.current[:ops_log_overlay] = nil
      Thread.current[:ops_log_clock] = nil
    end

    def build(log: true)
      scenario = NetworkModelScenario.scenario
      scenario['logSources'] = SOURCES.deep_dup if log
      OpsLog.with_clock(T0) { build_network_game({}, scenario) }
    end

    def state
      Game.find(@game.id).player_state
    end

    def sync(elapsed_ms, at:)
      OpsLog.with_clock(at) do
        put game_path('sync_state'), params: { scenarioClock: { elapsedMs: elapsed_ms } }, as: :json
      end
      assert_response :success, response.body
    end

    def bootstrap(at:)
      body = OpsLog.with_clock(at) { bootstrap_scenario }
      assert_response :success, response.body
      body
    end

    def count_scenario_loads
      count = 0
      sub = ActiveSupport::Notifications.subscribe('sql.active_record') do |*, payload|
        sql = payload[:sql].to_s
        named = sql.include?('"scenario_data"')
        whole_row = sql.include?('"break_escape_games".*') || sql.match?(/\ASELECT\s+\*\s+FROM\s+"break_escape_games"/)
        count += 1 if sql.start_with?('SELECT') && (named || whole_row)
      end
      yield
      count
    ensure
      ActiveSupport::Notifications.unsubscribe(sub) if sub
    end

    test 'a game with logSources holds the clock key from game start' do
      build
      assert_equal T0, state['opsLogClockAt']
    end

    test 'a sync with a new elapsedMs moves the key to the sync time, and a row 30 seconds later is stamped from it' do
      build
      sync(90_000, at: T0 + 20_000)
      assert_equal T0 + 20_000, state['opsLogClockAt']
      assert_equal 90_000, state['scenarioClock']['elapsedMs']

      game = Game.find(@game.id)
      OpsLog.with_clock(T0 + 50_000) { assert game.write_log_row!('tst_note', as: nil, where: nil, result: 'ok') }
      game.save!
      row = Game.find(@game.id).player_state['opsLog']['notes'].last
      assert_in_delta 120_000, row['elapsedMs'], 2_000
      assert_equal T0 + 50_000, row['serverMs']
    end

    test 'a stale lower elapsedMs does not move the clock backwards but the estimate stays capped' do
      build
      sync(90_000, at: T0 + 1_000)
      sync(10_000, at: T0 + 2_000)
      assert_equal 90_000, state['scenarioClock']['elapsedMs']
      game = Game.find(@game.id)
      OpsLog.with_clock(T0 + 2_000 + 3_600_000) { game.write_log_row!('tst_note', as: nil, where: nil, result: 'ok') }
      assert_equal 90_000 + OpsLog::CLOCK_ESTIMATE_CAP_MS, game.player_state['opsLog']['notes'].last['elapsedMs']
    end

    test 'without logSources a sync leaves no key and loads no scenario_data' do
      build(log: false)
      refute state.key?('opsLogClockAt')
      loads = count_scenario_loads { sync(90_000, at: T0 + 20_000) }
      assert_equal 0, loads
      refute state.key?('opsLogClockAt')
      assert_equal 90_000, state['scenarioClock']['elapsedMs']
    end

    test 'a log game sync loads no scenario_data either' do
      build
      assert_equal 0, count_scenario_loads { sync(90_000, at: T0 + 20_000) }
    end

    test 'GET /scenario refreshes a key ten seconds old or more, and writes nothing under ten seconds' do
      build
      before = Game.find(@game.id).updated_at
      bootstrap(at: T0 + 9_999)
      assert_equal T0, state['opsLogClockAt']
      assert_equal before, Game.find(@game.id).updated_at, 'a load under ten seconds old wrote the game'
      bootstrap(at: T0 + 10_000)
      assert_equal T0 + 10_000, state['opsLogClockAt']
      refreshed = Game.find(@game.id).updated_at
      assert_operator refreshed, :>, before
      bootstrap(at: T0 + 15_000)
      assert_equal T0 + 10_000, state['opsLogClockAt']
      assert_equal refreshed, Game.find(@game.id).updated_at, 'a load five seconds after a refresh wrote the game'
    end

    # R1 m17 (section 7: server-owned, never read from a sync body).
    test 'a sync body carrying the ops log keys leaves them unchanged' do
      build
      game = Game.find(@game.id)
      row = { 'seq' => 1, 'event' => 'tst_note', 'result' => 'ok', 'elapsedMs' => 0, 'serverMs' => T0 }
      game.player_state.merge!('opsLog' => { 'notes' => [row] }, 'opsLogSeq' => 1, 'opsLogOnce' => ['abcdef012345'],
                               'opsLogSaves' => { 'abcdef012345' => [2, T0] })
      game.save!
      kept = state.slice('opsLog', 'opsLogSeq', 'opsLogOnce', 'opsLogSaves')
      OpsLog.with_clock(T0 + 20_000) do
        put game_path('sync_state'), params: { scenarioClock: { elapsedMs: 90_000 }, opsLog: { 'notes' => [] }, opsLogSeq: 99,
                                               opsLogOnce: [], opsLogSaves: {}, opsLogClockAt: 5 }, as: :json
      end
      assert_response :success, response.body
      assert_equal kept, state.slice('opsLog', 'opsLogSeq', 'opsLogOnce', 'opsLogSaves')
      assert_equal T0 + 20_000, state['opsLogClockAt'], 'the stamp is the server clock, not the body'
    end

    test 'GET /scenario writes no key in a game without one' do
      build(log: false)
      bootstrap(at: T0 + 60_000)
      refute state.key?('opsLogClockAt')
    end

    test 'the bootstrap never ships logSources or the clock key' do
      build
      body = bootstrap(at: T0 + 60_000)
      refute body.key?('logSources')
      refute response.body.include?('opsLogClockAt')
    end

    test 'a game started before L1a has no key; the first stored row seeds it' do
      build
      game = Game.find(@game.id)
      game.player_state.delete('opsLogClockAt')
      game.save!
      OpsLog.with_clock(T0 + 5_000) { Game.find(@game.id).tap { |g| g.write_log_row!('tst_note', as: nil, where: nil, result: 'ok'); g.save! } }
      assert_equal T0 + 5_000, state['opsLogClockAt']
    end

    test 'every registered event writes nothing in a game without logSources' do
      build(log: false)
      game = Game.find(@game.id)
      before = game.player_state.deep_dup
      OpsLogEvents::EVENTS.each_key do |event|
        assert_nil game.write_log_row!(event, as: nil, where: nil, result: OpsLogEvents::EVENTS[event][:results].first), event
      end
      assert_equal before, game.player_state
    end
  end
end
