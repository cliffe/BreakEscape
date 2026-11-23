require 'test_helper'
require_relative '../../support/ops_log_assertions'

module BreakEscape
  # Ops log helper, plan stage L1a (docs/achitechture/OPS_LOG_ROWS_PLAN.md, 13 and 11 "Server unit,
  # L1a"). EVENTS is empty at L1a, so the tests that write rows register test-only events with
  # OpsLog.with_events (a block-scoped overlay on the event and kind tables, never the constants).
  class OpsLogEventsSpecTest < ActiveSupport::TestCase
    test 'the shipped EVENTS and KINDS tables are well formed' do
      assert_empty OpsLogEvents.problems(OpsLogEvents::EVENTS, OpsLogEvents::KINDS)
    end

    test 'the spec rejects malformed registrations' do
      kinds = OpsLogEvents::KINDS
      bad = {
        'a_bare_int'  => { label: 'A', places: [], results: %w[ok], detail: { 'x' => { count: 99 } } },
        'a_limit_100' => { label: 'A', places: [], results: %w[denied], save_limit: { 'denied' => 100 } },
        'a_limit_0'   => { label: 'A', places: [], results: %w[denied], save_limit: { 'denied' => 0 } },
        'a_limit_res' => { label: 'A', places: [], results: %w[ok], save_limit: { 'denied' => 5 } },
        'no_kind'     => { label: 'A', places: %w[nowhere], results: %w[ok] },
        'id_no_kind'  => { label: 'A', places: [], results: %w[ok], detail: { 'x' => { id: 'nowhere' } } },
        'int_type'    => { label: 'A', places: [], results: %w[ok], detail: { 'x' => Integer } },
        'five_keys'   => { label: 'A', places: [], results: %w[ok],
                           detail: %w[a b c d e].to_h { |k| [k, %w[x]] } },
        'bad_result'  => { label: 'A', places: [], results: %w[OK] }
      }
      bad.each do |name, entry|
        assert_not_empty OpsLogEvents.problems({ name => entry }, kinds), "#{name} should be refused"
      end
      good = { 'fine_one' => { label: 'FINE', places: %w[pc], results: %w[ok denied],
                               detail: { 'm' => %w[a b], 'c' => { count: 9 }, 'i' => { id: 'npc', show: false },
                                         'al' => { alias: 'finding' } }, save_limit: { 'denied' => 99 } } }
      assert_empty OpsLogEvents.problems(good, kinds)
    end
  end

  class OpsLogUnchangedScenariosTest < ActiveSupport::TestCase
    # OPS_LOG_ROWS_PLAN.md section 10, check 2: no scenario outside test_ops_* declares logSources, so
    # no existing scenario gains a row, a state key or an answer field.
    test 'no scenario outside test_ops_* declares logSources' do
      root = File.expand_path('../../../scenarios', __dir__)
      files = Dir.glob(File.join(root, '*', '**', '*.json{,.erb}')).reject { |f| File.basename(File.dirname(f)).start_with?('test_ops_') }
      files = files.reject { |f| f.sub("#{root}/", '').start_with?('test_ops_') }
      assert_operator files.size, :>, 50, 'the scan finds the scenarios'
      declared = files.select { |f| File.read(f).include?('"logSources"') }
      assert_empty declared.map { |f| f.sub("#{root}/", '') }
    end
  end

  # The helper itself. Test-only events are installed for each test through the overlay
  # (OpsLog.with_events's thread-local, set in setup and cleared in teardown), so EVENTS stays empty.
  class OpsLogTest < ActiveSupport::TestCase
    include OpsLogAssertions

    T0 = 1_763_550_000_000
    PIN = '4821'.freeze
    ACCOUNT_PASSWORD = 'Plum-Orchard-41'.freeze
    NPC_PASSWORD = 'Gate-Pass-77'.freeze
    CODE_ANSWER = 'ZEBRA'.freeze
    CREDENTIAL_VALUE = 'Cred-Value-3318'.freeze
    WIFI_KEY = 'Lantern-Key-5509'.freeze
    CAPTURE_SECRET = 'Capture-Word-92'.freeze

    TEST_EVENTS = {
      'tst_signin' => { label: 'SIGN_IN', places: %w[pc], results: %w[ok denied blocked],
                        detail: { 'method' => %w[password credential],
                                  'count' => { count: 9 } },
                        save_limit: { 'denied' => 10, 'blocked' => 10 } },
      'tst_door' => { label: 'DOOR', places: %w[door object pc], results: %w[ok denied], save_limit: { 'denied' => 10 } },
      'tst_ref' => { label: 'REF', places: %w[pc], results: %w[ok], detail: { 'who' => { id: 'npc' }, 'a' => { alias: 'finding' } } },
      'tst_note' => { label: 'NOTE', places: [], results: %w[ok denied] },
      'tst_harvest' => { label: 'HARVEST', places: %w[pc], results: %w[ok], detail: { 'count' => { count: 9 } } },
      'tst_any' => { label: 'ANY', places: [], results: %w[ok], detail: { 'v' => { id: 'test_any' } } }
    }.freeze
    TEST_KINDS = { 'test_any' => { name: ->(_game, id) { id }, room: ->(_game, _id) { nil } } }.freeze

    SOURCES = {
      'by_event' => { 'title' => 'By event', 'events' => ['tst_door'] },
      'by_prefix' => { 'title' => 'By prefix', 'events' => ['tst_*'] },
      'by_rooms' => { 'title' => 'By rooms', 'events' => %w[tst_door tst_signin], 'where' => { 'rooms' => ['lobby'] } },
      'by_objects' => { 'title' => 'By objects', 'events' => ['tst_signin'], 'where' => { 'objects' => ['srv_pc'] } },
      'by_places' => { 'title' => 'By places', 'events' => ['tst_door'], 'where' => { 'places' => ['door:vault'] } },
      'notes' => { 'title' => 'Notes', 'events' => ['tst_note'] }
    }.freeze

    setup do
      Thread.current[:ops_log_overlay] = { events: TEST_EVENTS, kinds: TEST_KINDS }
      @mission = Mission.create!(name: 'test_simple_success', display_name: 'Ops log', published: true, difficulty_level: 1)
      @player = break_escape_demo_users(:test_user)
    end

    teardown do
      Thread.current[:ops_log_overlay] = nil
      Thread.current[:ops_log_clock] = nil
      Thread.current[:ops_log_guard] = nil
      BreakEscape::OpsLog::Current.reset
    end

    def scenario(extra_npcs: 0, password_override: nil)
      npcs = [
        { 'id' => 'j_price_npc', 'displayName' => 'J Price', 'creds' => { 'username' => 'j_price', 'password' => password_override || ACCOUNT_PASSWORD } },
        { 'id' => 'guard', 'displayName' => 'Gate Guard', 'creds' => { 'username' => 'guard1', 'password' => NPC_PASSWORD } }
      ]
      extra_npcs.times { |i| npcs << { 'id' => "extra#{i}", 'displayName' => "Extra #{i}" } }
      {
        'startRoom' => 'lobby',
        'rooms' => {
          'lobby' => { 'type' => 'room_office', 'connections' => { 'north' => 'vault' }, 'npcs' => npcs,
                       'objects' => [{ 'id' => 'recep_pc', 'type' => 'pc', 'lockType' => 'login', 'name' => 'Reception PC' }] },
          'vault' => { 'type' => 'room_office', 'connections' => { 'south' => 'lobby', 'north' => 'serv' },
                       'objects' => [
                         { 'id' => 'vault_safe', 'type' => 'safe', 'name' => 'Vault safe', 'locked' => true, 'lockType' => 'pin', 'requires' => PIN,
                           'contents' => [{ 'id' => 'ledger', 'type' => 'text_file', 'name' => 'Ledger', 'text' => 'x' }] },
                         { 'id' => 'code_box', 'type' => 'safe', 'name' => 'Code box', 'locked' => true, 'lockType' => 'password', 'requires' => CODE_ANSWER },
                         { 'id' => 'key_box', 'type' => 'safe', 'name' => 'Key box', 'locked' => true, 'lockType' => 'key', 'requires' => 'brass_key' },
                         { 'id' => 'card_door_box', 'type' => 'safe', 'name' => 'Card box', 'locked' => true, 'lockType' => 'rfid', 'requires' => ['master_card'] },
                         { 'id' => 'bio_box', 'type' => 'safe', 'name' => 'Bio box', 'locked' => true, 'lockType' => 'biometric', 'requires' => 'Mrs Moo' },
                         { 'id' => 'ble_box', 'type' => 'safe', 'name' => 'Ble box', 'locked' => true, 'lockType' => 'bluetooth', 'requires' => '00:11:22:33:44:55' }
                       ] },
          'serv' => { 'type' => 'room_servers', 'connections' => { 'south' => 'vault' },
                      'objects' => [{ 'id' => 'srv_pc', 'type' => 'pc', 'lockType' => 'login', 'name' => 'Server PC' }] }
        },
        'networks' => { 'office_lan' => { 'name' => 'Office LAN', 'wifi' => { 'ssid' => 'hb', 'psk' => WIFI_KEY } } },
        'credentials' => { 'jp_note' => { 'kind' => 'password', 'account' => 'j_price_npc', 'password' => CREDENTIAL_VALUE } },
        'capture_holder' => { 'capture' => { 'secret' => CAPTURE_SECRET } }
      }
    end

    def make_game(sources: SOURCES, state: {}, data: nil, clock: true)
      game = create_access_game(mission: @mission, player: @player, scenario: data || scenario, player_state: state)
      game.scenario_data = game.scenario_data.merge('logSources' => sources) if sources
      game.player_state['opsLogClockAt'] = T0 if clock
      game.save!
      game
    end

    def write(game, event, as: nil, where: nil, result: 'ok', **rest)
      game.write_log_row!(event, as: as, where: where, result: result, **rest)
    end

    def pc(id)
      { kind: 'pc', id: id }
    end

    def typed(text)
      { typed: text }
    end

    def at(ms, &block)
      BreakEscape::OpsLog.with_clock(ms, &block)
    end

    def rows(game, source = 'by_prefix')
      game.player_state.dig('opsLog', source) || []
    end

    # ---- opt-in ----

    test 'no logSources answers nil and leaves state untouched' do
      game = make_game(sources: nil)
      before = game.player_state.deep_dup
      assert_nil write(game, 'tst_note')
      assert_nil write(game, 'tst_signin', where: pc('recep_pc'), once: true)
      assert_equal before, game.player_state
    end

    test 'a game loaded with only the sync columns answers nil without raising' do
      game = make_game
      columns = Game.select(*BreakEscape::GamesController::SYNC_STATE_COLUMNS).find(game.id)
      assert_not columns.has_attribute?(:scenario_data)
      assert_nil write(columns, 'tst_note')
    end

    test 'EVENTS is empty at L1a, so an unregistered event is malformed' do
      assert_empty BreakEscape::OpsLog::EVENTS
      Thread.current[:ops_log_overlay] = nil
      game = make_game
      assert_raises(BreakEscape::OpsLog::Malformed) { write(game, 'tst_note') }
    end

    # ---- source matching ----

    test 'sources take rows by exact name, prefix, rooms, objects and places' do
      game = make_game
      assert write(game, 'tst_door', where: { kind: 'door', id: 'vault' }).stored?
      assert_equal %w[by_event by_places by_prefix], game.player_state['opsLog'].keys.sort

      game = make_game
      assert write(game, 'tst_signin', where: pc('recep_pc')).stored?
      assert_equal %w[by_prefix by_rooms], game.player_state['opsLog'].keys.sort

      game = make_game
      assert write(game, 'tst_signin', where: pc('srv_pc')).stored?
      assert_equal %w[by_objects by_prefix], game.player_state['opsLog'].keys.sort
    end

    test 'a placeless row lands only in a source naming the event exactly; two sources, a row in each' do
      game = make_game
      assert write(game, 'tst_note').stored?
      assert_equal %w[notes], game.player_state['opsLog'].keys
      game = make_game
      write(game, 'tst_door', where: { kind: 'door', id: 'vault' })
      assert_equal 1, rows(game, 'by_event').size
      assert_equal 1, rows(game, 'by_prefix').size
      assert_equal rows(game, 'by_event').first['seq'], rows(game, 'by_prefix').first['seq']
    end

    test 'an event no source takes answers nil' do
      game = make_game(sources: { 'only' => { 'title' => 'x', 'events' => ['tst_door'] } })
      assert_nil write(game, 'tst_note')
      assert_nil game.player_state['opsLog']
    end

    # ---- merging ----

    test 'an identical repeat raises n and last and appends nothing; any difference appends' do
      game = make_game
      at(T0 + 5_000) { assert write(game, 'tst_signin', as: typed('amy'), where: pc('recep_pc'), result: 'denied').appended? }
      at(T0 + 9_000) do
        r = write(game, 'tst_signin', as: typed('amy'), where: pc('recep_pc'), result: 'denied')
        assert r.merged?
        assert_not r.appended?
      end
      row = rows(game).first
      assert_equal 1, rows(game).size
      assert_equal 2, row['n']
      assert_equal T0 + 9_000, row['last'][1]
      assert_equal 1, row['seq']
      at(T0) do
        write(game, 'tst_signin', as: typed('bob'), where: pc('recep_pc'), result: 'denied')
        write(game, 'tst_signin', as: typed('amy'), where: pc('srv_pc'), result: 'denied')
        write(game, 'tst_signin', as: typed('amy'), where: pc('recep_pc'), result: 'blocked')
        write(game, 'tst_signin', as: typed('amy'), where: pc('recep_pc'), result: 'denied', detail: { method: 'password' })
      end
      assert_equal 5, rows(game).size
    end

    test 'A, B, A, B twenty times leaves two rows with n 10 each' do
      game = make_game
      20.times do |i|
        write(game, 'tst_signin', as: typed(i.even? ? 'amy' : 'bob'), where: pc('recep_pc'), result: 'denied')
      end
      assert_equal [10, 10], rows(game).map { |r| r['n'] }
    end

    # ---- save counter ----

    test 'save_limit: eleven rows in rotation store ten times in a window, then nil with state untouched' do
      game = make_game
      stored = 0
      at(T0) do
        5.times do
          11.times do |i|
            r = write(game, 'tst_signin', as: typed("u#{i}"), where: pc('recep_pc'), result: 'denied', save_limit: true)
            stored += 1 if r&.stored?
          end
        end
      end
      assert_equal 10, stored
      game.save!
      snapshot = game.reload
      before = [snapshot.player_state['opsLogSaves'], snapshot.player_state['opsLog'], snapshot.updated_at]
      at(T0 + 1_000) { assert_nil write(game, 'tst_signin', as: typed('u1'), where: pc('recep_pc'), result: 'denied', save_limit: true) }
      game.save!
      again = Game.find(game.id)
      assert_equal before, [again.player_state['opsLogSaves'], again.player_state['opsLog'], again.updated_at]
    end

    test 'save_limit window edges: t + 299_999 does not store, t + 300_000 stores and starts a new window' do
      game = make_game
      at(T0) { 10.times { |i| write(game, 'tst_signin', as: typed("u#{i}"), where: pc('recep_pc'), result: 'denied', save_limit: true) } }
      at(T0 + 299_999) { assert_nil write(game, 'tst_signin', as: typed('z'), where: pc('recep_pc'), result: 'denied', save_limit: true) }
      at(T0 + 300_000) { assert write(game, 'tst_signin', as: typed('z'), where: pc('recep_pc'), result: 'denied', save_limit: true).stored? }
      key = game.player_state['opsLogSaves'].keys.first
      assert_equal [1, T0 + 300_000], game.player_state['opsLogSaves'][key]
    end

    test 'the tenth save marks p on the rows it stored in each source and the mark outlasts the window' do
      game = make_game
      at(T0) { 10.times { |i| write(game, 'tst_signin', as: typed("u#{i}"), where: pc('recep_pc'), result: 'denied', save_limit: true) } }
      %w[by_prefix by_rooms].each do |source|
        assert_equal [nil] * 9 + [1], rows(game, source).map { |r| r['p'] }
      end
      at(T0 + 400_000) { write(game, 'tst_signin', as: typed('later'), where: pc('recep_pc'), result: 'denied', save_limit: true) }
      assert_equal 1, rows(game).find { |r| r.dig('as', 'typed') == 'u9' }['p']
    end

    test 'an entry whose window starts after the clock is treated as passed' do
      game = make_game
      at(T0) { write(game, 'tst_signin', as: typed('a'), where: pc('recep_pc'), result: 'denied', save_limit: true) }
      key = game.player_state['opsLogSaves'].keys.first
      game.player_state['opsLogSaves'][key] = [10, T0 + 50_000]
      at(T0) { assert write(game, 'tst_signin', as: typed('b'), where: pc('recep_pc'), result: 'denied', save_limit: true).stored? }
      assert_equal [1, T0], game.player_state['opsLogSaves'][key]
    end

    test 'results and places keep separate counts' do
      game = make_game
      at(T0) do
        10.times { |i| write(game, 'tst_signin', as: typed("u#{i}"), where: pc('recep_pc'), result: 'denied', save_limit: true) }
        assert_nil write(game, 'tst_signin', as: typed('x'), where: pc('recep_pc'), result: 'denied', save_limit: true)
        assert write(game, 'tst_signin', as: typed('x'), where: pc('recep_pc'), result: 'blocked', save_limit: true).stored?
        assert write(game, 'tst_signin', as: typed('x'), where: pc('srv_pc'), result: 'denied', save_limit: true).stored?
      end
      assert_equal 3, game.player_state['opsLogSaves'].size
    end

    test 'a full opsLogSaves map reclaims a passed entry, or answers nil when every entry is open' do
      game = make_game
      full = (0...256).to_h { |i| [format('%012x', i), [1, T0 - 1_000]] }
      full[format('%012x', 0)] = [3, T0 - 400_000]
      game.player_state['opsLogSaves'] = full.deep_dup
      at(T0) { assert write(game, 'tst_signin', as: typed('n'), where: pc('recep_pc'), result: 'denied', save_limit: true).stored? }
      assert_equal 256, game.player_state['opsLogSaves'].size
      assert_not game.player_state['opsLogSaves'].key?(format('%012x', 0))

      game = make_game
      game.player_state['opsLogSaves'] = full.transform_values { [1, T0 - 1_000] }
      at(T0) { assert_nil write(game, 'tst_signin', as: typed('n'), where: pc('recep_pc'), result: 'denied', save_limit: true) }
      assert_equal 256, game.player_state['opsLogSaves'].size
      assert_nil game.player_state['opsLog']
    end

    test 'save_limit is malformed without a registered limit and with once' do
      game = make_game
      assert_raises(BreakEscape::OpsLog::Malformed) { write(game, 'tst_signin', where: pc('recep_pc'), result: 'ok', save_limit: true) }
      assert_raises(BreakEscape::OpsLog::Malformed) { write(game, 'tst_signin', where: pc('recep_pc'), result: 'denied', save_limit: true, once: true) }
      assert_raises(BreakEscape::OpsLog::Malformed) { write(game, 'tst_note', save_limit: true) }
    end

    test 'the EVENTS spec fails a registered limit of 0 or 100' do
      [0, 100].each do |limit|
        events = { 'tst_x' => { label: 'X', places: [], results: %w[denied], save_limit: { 'denied' => limit } } }
        assert_not_empty BreakEscape::OpsLogEvents.problems(events, BreakEscape::OpsLogEvents::KINDS)
      end
    end

    # ---- once ----

    test 'once writes once, remembers after eviction, and adds the digest only when a source stored' do
      game = make_game
      assert write(game, 'tst_signin', as: { npc: 'guard' }, where: pc('recep_pc'), once: true).stored?
      assert_equal 1, game.player_state['opsLogOnce'].size
      game.player_state['opsLog'] = {}
      assert_nil write(game, 'tst_signin', as: { npc: 'guard' }, where: pc('recep_pc'), once: true)
      assert_equal({}, game.player_state['opsLog'])

      none = make_game(sources: { 'only' => { 'title' => 'x', 'events' => ['tst_door'] } })
      assert_nil write(none, 'tst_signin', as: { npc: 'guard' }, where: pc('recep_pc'), once: true)
      assert_nil none.player_state['opsLogOnce']
    end

    test 'the 257th distinct once row drops the oldest digest' do
      game = make_game(data: scenario(extra_npcs: 257))
      257.times { |i| assert write(game, 'tst_signin', as: { npc: "extra#{i}" }, where: pc('recep_pc'), once: true).stored? }
      assert_equal 256, game.player_state['opsLogOnce'].size
      assert write(game, 'tst_signin', as: { npc: 'extra0' }, where: pc('recep_pc'), once: true).stored?
      assert_nil write(game, 'tst_signin', as: { npc: 'extra200' }, where: pc('recep_pc'), once: true)
    end

    test 'once with as typed is malformed' do
      game = make_game
      assert_raises(BreakEscape::OpsLog::Malformed) { write(game, 'tst_signin', as: typed('amy'), where: pc('recep_pc'), once: true) }
    end

    # ---- eviction and caps ----

    def one_source(cap)
      { 'log' => { 'title' => 'Log', 'events' => ['tst_*', 'tst_note'], 'maxRows' => cap } }
    end

    test 'eviction takes the classes in order and keeps first rows of each event' do
      game = make_game(sources: one_source(50))
      3.times { write(game, 'tst_signin', as: typed('first'), where: pc('recep_pc'), result: 'denied') }
      write(game, 'tst_note', as: typed('firstok'))
      50.times { |i| write(game, 'tst_signin', as: typed("forged#{i}"), where: pc('recep_pc'), result: 'denied') }
      50.times { |i| write(game, 'tst_note', as: typed("ok#{i}")) }
      log = rows(game, 'log')
      assert_equal 50, log.size
      assert_equal 3, log.find { |r| r.dig('as', 'typed') == 'first' }['n']
      assert log.any? { |r| r.dig('as', 'typed') == 'firstok' }
      assert_equal 100 + 2, game.player_state['opsLogSeq'] # 1 merged row + 1 first ok + 50 + 50
    end

    test 'a refusal that merged is taken before an unmerged one, and an ok row last' do
      game = make_game(sources: one_source(10))
      write(game, 'tst_note', as: typed('keep'))               # first of tst_note
      write(game, 'tst_signin', as: typed('r0'), where: pc('recep_pc'), result: 'denied') # first of tst_signin
      write(game, 'tst_signin', as: typed('merged'), where: pc('recep_pc'), result: 'denied')
      write(game, 'tst_signin', as: typed('merged'), where: pc('recep_pc'), result: 'denied')
      write(game, 'tst_signin', as: typed('single'), where: pc('recep_pc'), result: 'denied')
      write(game, 'tst_door', as: typed('okrow'), where: { kind: 'door', id: 'vault' })
      5.times { |i| write(game, 'tst_signin', as: typed("f#{i}"), where: pc('recep_pc'), result: 'denied') }
      assert_equal 10, rows(game, 'log').size
      write(game, 'tst_signin', as: typed('push'), where: pc('recep_pc'), result: 'denied')
      log = rows(game, 'log').map { |r| r.dig('as', 'typed') }
      assert_equal 10, log.size
      assert_not_includes log, 'merged'
      assert_includes log, 'single'
    end

    test 'a p row inside its window survives a flood; at five minutes old it can go' do
      game = make_game(sources: one_source(10))
      at(T0) { 10.times { |i| write(game, 'tst_signin', as: typed("u#{i}"), where: pc('recep_pc'), result: 'denied', save_limit: true) } }
      flood = lambda do |ms, tag|
        at(ms) do
          50.times { |i| write(game, 'tst_signin', as: typed("#{tag}d#{i}"), where: pc('recep_pc'), result: 'denied') }
          50.times { |i| write(game, 'tst_note', as: typed("#{tag}o#{i}")) }
        end
      end
      flood.call(T0 + 1_000, 'a')
      assert rows(game, 'log').any? { |r| r.dig('as', 'typed') == 'u9' }
      flood.call(T0 + 300_001, 'b')
      assert_not rows(game, 'log').any? { |r| r.dig('as', 'typed') == 'u9' }
      assert_equal 10, rows(game, 'log').size
    end

    test 'a source with more events than maxRows never exceeds maxRows, and never touches another source' do
      events = (1..12).to_h { |i| ["tst_e#{i}", { label: 'E', places: [], results: %w[ok] }] }
      Thread.current[:ops_log_overlay] = { events: TEST_EVENTS.merge(events), kinds: TEST_KINDS }
      sources = { 'small' => { 'title' => 's', 'events' => ['tst_e*'].map { |e| e.sub('*', '_*') }.first(0) + (1..12).map { |i| "tst_e#{i}" }, 'maxRows' => 10 },
                  'other' => { 'title' => 'o', 'events' => ['tst_note'], 'maxRows' => 10 } }
      game = make_game(sources: sources)
      write(game, 'tst_note')
      3.times { (1..12).each { |i| write(game, "tst_e#{i}", as: nil, where: nil) } }
      assert_operator rows(game, 'small').size, :<=, 10
      assert_equal 1, rows(game, 'other').size
    end

    test 'the maxRows clamp: 500 becomes 150, three of 150 give 150, 140 and 10, a thirty-first source is ignored' do
      data = { 'logSources' => { 'a' => { 'maxRows' => 500, 'events' => [] } } }
      assert_equal [150], BreakEscape::OpsLog.sources_for(data).map(&:last)
      data = { 'logSources' => (%w[a b c].to_h { |id| [id, { 'maxRows' => 150, 'events' => [] }] }) }
      assert_equal [150, 140, 10], BreakEscape::OpsLog.sources_for(data).map(&:last)
      data = { 'logSources' => (1..31).to_h { |i| ["s#{i}", { 'maxRows' => 5, 'events' => [] }] } }
      sources = BreakEscape::OpsLog.sources_for(data)
      assert_equal 30, sources.size
      assert_equal [10] * 30, sources.map(&:last)
      assert_equal 300, [150, 150, 150].each_with_index.sum { |_c, _i| 100 }
    end

    test 'a typed username of 64 four-byte characters or of control characters is cut to fit 96 bytes' do
      game = make_game
      write(game, 'tst_signin', as: typed("\u{1F600}" * 64), where: pc('recep_pc'), result: 'denied')
      row = rows(game).last
      assert row['as']['cut']
      assert_operator row['as']['typed'].to_json.bytesize, :<=, 96
      assert_operator row.to_json.bytesize, :<=, 400
      write(game, 'tst_signin', as: typed("\u0001" * 64), where: pc('recep_pc'), result: 'denied')
      assert rows(game).last['as']['cut']
      write(game, 'tst_signin', as: typed('  J.Price '), where: pc('recep_pc'), result: 'denied')
      assert_equal({ 'typed' => 'j.price' }, rows(game).last['as'])
    end

    test 'every registered event builds a ceiling-filled row of at most 400 bytes' do
      BreakEscape::OpsLog.events.each do |name, entry|
        detail = (entry[:detail] || {}).to_h do |key, rule|
          value = if rule.is_a?(Array) then rule.max_by(&:length)
          elsif rule.key?(:count) then rule[:count]
          elsif rule.key?(:alias) then 'f999'
          else 'x' * 40
          end
          [key, value]
        end
        row = { 'seq' => 999_999, 'event' => name, 'as' => { 'typed' => 'a' * 94, 'cut' => true },
                'where' => { 'kind' => Array(entry[:places]).max_by(&:length) || 'pc', 'id' => 'x' * 40 },
                'result' => entry[:results].max_by(&:length), 'detail' => detail, 'elapsedMs' => 999_999_999,
                'serverMs' => 9_999_999_999_999, 'n' => 99_999, 'last' => [999_999_999, 9_999_999_999_999] }
        row['p'] = 1 if entry[:save_limit]
        assert_operator row.to_json.bytesize, :<=, 400, "#{name} ceiling row is over 400 bytes"
      end
    end

    # ---- malformed calls ----

    def malformed_calls(game)
      [
        -> { write(game, 'tst_unknown') },
        -> { write(game, 'tst_signin', where: { kind: 'door', id: 'vault' }) },
        -> { write(game, 'tst_note', where: pc('recep_pc')) },
        -> { write(game, 'tst_signin', where: pc('recep_pc'), result: 'fail') },
        -> { write(game, 'tst_signin', where: pc('recep_pc'), detail: { nope: 'x' }) },
        -> { write(game, 'tst_signin', where: pc('recep_pc'), detail: { method: 'telepathy' }) },
        -> { write(game, 'tst_signin', where: pc('recep_pc'), detail: { count: 'three' }) },
        -> { write(game, 'tst_signin', where: pc('recep_pc'), detail: { count: -1 }) },
        -> { write(game, 'tst_signin', where: pc('recep_pc'), detail: { count: 1.5 }) },
        -> { write(game, 'tst_ref', where: pc('recep_pc'), detail: { who: 'x' * 41 }) },
        -> { write(game, 'tst_ref', where: pc('recep_pc'), detail: { who: 'nobody' }) },
        -> { write(game, 'tst_ref', where: pc('recep_pc'), detail: { a: 'finding' }) },
        -> { write(game, 'tst_signin', where: pc('recep_pc'), as: { account: 'j' * 33 }) },
        -> { write(game, 'tst_signin', where: pc('recep_pc'), as: { account: 'ghost' }) },
        -> { write(game, 'tst_signin', where: pc('nowhere')) },
        -> { write(game, 'tst_signin', where: pc('recep_pc'), as: { account: 'j_price', npc: 'guard' }) }
      ]
    end

    test 'malformed calls raise in test' do
      game = make_game
      malformed_calls(game).each_with_index do |call, i|
        assert_raises(BreakEscape::OpsLog::Malformed, "call #{i}") { call.call }
      end
      assert_nil game.player_state['opsLog']
    end

    test 'with the production setting malformed calls answer nil, store nothing and log one warning each' do
      game = make_game
      io = StringIO.new
      old = Rails.logger
      Rails.logger = Logger.new(io)
      begin
        BreakEscape::OpsLog.with_guard(false) do
          malformed_calls(game).each { |call| assert_nil call.call }
        end
      ensure
        Rails.logger = old
      end
      assert_nil game.player_state['opsLog']
      assert_equal malformed_calls(game).size, io.string.lines.count { |l| l.include?('ops log:') }
    end

    test 'a count of 1234 is stored as 9, in production too; an alias, an id and a valid account are kept' do
      game = make_game
      write(game, 'tst_harvest', where: pc('recep_pc'), detail: { count: 1234 })
      BreakEscape::OpsLog.with_guard(false) { write(game, 'tst_harvest', where: pc('srv_pc'), detail: { count: 1234 }) }
      assert_equal [9, 9], rows(game).map { |r| r.dig('detail', 'count') }
      write(game, 'tst_ref', where: pc('recep_pc'), as: { account: ' J_Price ' }, detail: { who: 'guard', a: 'f3' })
      row = rows(game).last
      assert_equal({ 'account' => 'j_price' }, row['as'])
      assert_equal({ 'who' => 'guard', 'a' => 'f3' }, row['detail'])
    end

    # ---- secret registry and guard ----

    test 'secret_values holds the L1a secrets and no names, ids, usernames or card-reference answers' do
      game = make_game
      values = BreakEscape::OpsLog.secret_values(game)
      [ACCOUNT_PASSWORD, NPC_PASSWORD, PIN, CODE_ANSWER, CREDENTIAL_VALUE, WIFI_KEY, CAPTURE_SECRET].each do |secret|
        assert_includes values, secret
      end
      %w[j_price guard1 lobby vault recep_pc brass_key master_card Mrs\ Moo 00:11:22:33:44:55 j_price_npc].each do |plain|
        assert_not_includes values, plain
      end
    end

    test 'a registered source adds its values; an issued value lives for one request' do
      game = make_game
      BreakEscape::OpsLog.with_secret_source(:test_hashes, ->(_g) { ['5f4dcc3b5aa765d6'] }) do
        assert_includes BreakEscape::OpsLog.secret_values(game), '5f4dcc3b5aa765d6'
      end
      assert_not_includes BreakEscape::OpsLog.secret_values(game), '5f4dcc3b5aa765d6'
      BreakEscape::OpsLog.note_issued_secret('731942')
      assert_includes BreakEscape::OpsLog.secret_values(game), '731942'
      BreakEscape::OpsLog::Current.reset
      assert_not_includes BreakEscape::OpsLog.secret_values(game), '731942'
    end

    test 'the guard raises ArgumentError starting secret in, naming event and path, never the value' do
      game = make_game
      BreakEscape::OpsLog.note_issued_secret('731942')
      error = assert_raises(BreakEscape::OpsLog::SecretInRow) { write(game, 'tst_any', detail: { v: '731942' }) }
      assert_kind_of ArgumentError, error
      assert error.message.start_with?('secret in'), error.message
      assert_includes error.message, 'tst_any'
      assert_includes error.message, 'detail.v'
      assert_not_includes error.message, '731942'
      assert_nil game.player_state['opsLog']

      BreakEscape::OpsLog.with_secret_source(:test_hashes, ->(_g) { ['5f4dcc3b5aa765d6'] }) do
        error = assert_raises(ArgumentError) { write(game, 'tst_any', detail: { v: '5f4dcc3b5aa765d6' }) }
        assert error.message.start_with?('secret in')
        assert_not_includes error.message, '5f4dcc3b5aa765d6'
      end
      assert_not_includes error.message, ACCOUNT_PASSWORD
    end

    test 'authored collisions never raise: a password equal to a username, a code or an id' do
      data = scenario(password_override: 'j_price')
      data['rooms']['vault']['objects'].first['requires'] = 'serv'
      data['rooms']['lobby']['npcs'].last['creds']['password'] = 'password'
      game = make_game(data: data)
      assert write(game, 'tst_signin', where: pc('recep_pc'), as: { account: 'j_price' }, detail: { method: 'password' }).stored?
      assert write(game, 'tst_door', where: { kind: 'door', id: 'serv' }).stored?
      write(game, 'tst_any', detail: { v: 'j_price' }) # no raise: the value equals an authored username
      assert_ops_log_holds_no_secret(game)
    end

    test 'a clean row whose seq, n or serverMs equals a numeric secret does not raise; a count beside a one-digit secret does not' do
      game = make_game
      BreakEscape::OpsLog.with_secret_source(:numbers, ->(_g) { ['1763550000000', '1', '4'] }) do
        at(1_763_550_000_000) { assert write(game, 'tst_note').stored? }
        assert write(game, 'tst_harvest', where: pc('recep_pc'), detail: { count: 4 }).stored?
      end
    end

    test 'typed text equal to a secret is stored normalised with no raise, guard on or off' do
      game = make_game
      [ACCOUNT_PASSWORD, PIN, 'not-a-secret'].each do |text|
        [true, false].each do |guard|
          BreakEscape::OpsLog.with_guard(guard) do
            assert write(game, 'tst_signin', as: typed(text), where: pc('recep_pc'), result: 'denied').stored?
          end
        end
      end
      assert_equal %w[plum-orchard-41 4821 not-a-secret], rows(game).map { |r| r.dig('as', 'typed') }
      shape = rows(game).map { |r| r.except('seq', 'as', 'n', 'last', 'elapsedMs', 'serverMs') }.uniq
      assert_equal 1, shape.size
      assert_ops_log_holds_no_secret(game)
    end

    test 'the secret walk: every registered event, every detail key and as form set to each secret' do
      game = make_game
      secrets = BreakEscape::OpsLog.secret_values(game) + [PIN.to_i, 'Hunter2!', '5f4dcc3b5aa765d6']
      walked = BreakEscape::OpsLog.events.reject { |name, _| name == 'tst_any' }
      [false, true].each do |guard|
        BreakEscape::OpsLog.with_guard(guard) do
          walked.each do |name, entry|
            place = Array(entry[:places]).first
            where = place ? { kind: place, id: place == 'door' ? 'vault' : 'recep_pc' } : nil
            result = entry[:results].first
            calls = []
            (entry[:detail] || {}).each_key { |key| secrets.each { |s| calls << { detail: { key.to_sym => s } } } }
            %i[account npc card].each { |form| secrets.each { |s| calls << { as: { form => s } } } }
            secrets.each { |s| calls << { where: { kind: place || 'pc', id: s.to_s } } }
            calls.each do |extra|
              begin
                write(game, name, as: extra[:as], where: extra[:where] || where, result: result, detail: extra[:detail])
              rescue BreakEscape::OpsLog::Malformed
                next
              end
            end
          end
        end
        assert_ops_log_holds_no_secret(game)
      end
    end

    # ---- time and reading ----

    test 'elapsedMs is the saved value plus server time since opsLogClockAt, capped at five minutes; 0 with no clock' do
      game = make_game(state: { 'scenarioClock' => { 'elapsedMs' => 10_000 } })
      at(T0 + 60_000) { write(game, 'tst_note', as: typed('a')) }
      at(T0 + 1_000_000) { write(game, 'tst_note', as: typed('b')) }
      assert_equal [70_000, 310_000], rows(game, 'notes').map { |r| r['elapsedMs'] }
      assert_equal T0 + 60_000, rows(game, 'notes').first['serverMs']
      bare = make_game(state: { 'scenarioClock' => { 'elapsedMs' => 10_000 } }, clock: false)
      at(T0) { write(bare, 'tst_note') }
      assert_equal [0], rows(bare, 'notes').map { |r| r['elapsedMs'] }
    end

    test 'log_rows_for answers rows in seq order and its compare form has no times' do
      game = make_game
      at(T0) do
        write(game, 'tst_signin', as: typed('amy'), where: pc('recep_pc'), result: 'denied')
        write(game, 'tst_signin', as: typed('amy'), where: pc('recep_pc'), result: 'denied')
        write(game, 'tst_note', detail: nil)
      end
      assert_equal [1], game.log_rows_for('by_prefix').map { |r| r['seq'] }.first(1)
      compare = game.log_rows_for('by_prefix', compare: true)
      assert_equal [['tst_signin', { 'typed' => 'amy' }, { 'kind' => 'pc', 'id' => 'recep_pc' }, 'denied', nil, 2]], compare
      assert_no_match(/\d{6,}/, compare.to_json)
      assert_equal [], game.log_rows_for('missing')
      assert_equal [], game.log_rows_for('missing', compare: true)
    end

    test 'opsLogSeq keeps counting across sources and eviction' do
      game = make_game(sources: one_source(10))
      30.times { |i| write(game, 'tst_note', as: typed("u#{i}")) }
      assert_equal 30, game.player_state['opsLogSeq']
      assert_equal 10, rows(game, 'log').size
    end

    test 'KINDS resolve objects in containers, files in containers, and show an unresolved id as nil' do
      game = make_game
      kinds = BreakEscape::OpsLogEvents::KINDS
      assert_equal 'Vault safe', kinds['object'][:name].call(game, 'vault_safe')
      assert_equal 'Ledger', kinds['object'][:name].call(game, 'ledger')
      assert_equal 'vault', kinds['object'][:room].call(game, 'ledger')
      assert_nil kinds['object'][:name].call(game, 'nothing')
      assert_equal 'lobby', kinds['pc'][:room].call(game, 'recep_pc')
      assert_equal 'vault', kinds['door'][:room].call(game, 'vault')
      assert_equal 'j_price', kinds['account'][:name].call(game, 'J_Price')
      assert_equal 'Gate Guard', kinds['npc'][:name].call(game, 'guard')
    end
  end
end
