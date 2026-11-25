require 'test_helper'
require_relative '../../support/access_work_scenario'
require_relative '../../support/cached_accounts_fixture'

module BreakEscape
  # Ops S5b unit 13: the borrow writer (an accepted "done" at the borrowed PC caches a declared
  # `after: "borrow"` account there) and the withheld `cachedAccounts` field (never in any answer
  # that can carry an object). Both through the real routes and serialiser.
  class BorrowCachedTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include ActiveSupport::Testing::TimeHelpers

    JAKE_PASSWORD = 'Jackdaw-Jake-72'.freeze
    PAIR = 'hot_desk|jake'.freeze

    def scenario(strict_desk: false, careful: false)
      data = AccessWorkScenario.scenario
      data['policies']['strict'] = { 'autoLockMin' => 5, 'maxAttempts' => 3 }
      office = data['rooms']['office']
      office['objects'] += [AccessWorkScenario.pc('jake_pc', 'policy' => 'strict', 'lockChance' => 1)]
      office['npcs'] += [
        AccessWorkScenario.staff('jake', 'jbrooks', JAKE_PASSWORD, 'displayName' => 'Jake Brooks',
                                                                  'habits' => { 'screen' => { 'lockChance' => careful ? 1 : 0 } },
                                                                  'workarounds' => [{ 'at' => 40, 'do' => 'borrow_session', 'pc' => 'hot_desk' }])
      ]
      desk = office['objects'].find { |o| o['id'] == 'hot_desk' }
      desk['policy'] = 'strict' if strict_desk
      desk['cachedAccounts'] = [{ 'npc' => 'jake', 'after' => 'borrow' }]
      AccessWorkScenario.assign_owners!(data)
    end

    def build(data = scenario, lockouts: ['jake_pc|jbrooks'])
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user), scenario: data,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby office],
                        'encounteredNPCs' => %w[dana kai ian amy omar temp_user jake],
                        'loginLockouts' => lockouts }
      )
    end

    def report(*reports)
      post npc_frustration_game_url(@game), params: { reports: reports }, as: :json
      (response.parsed_body.is_a?(Hash) && response.parsed_body['answers']) || flunk("#{response.status} #{response.body[0, 300]}")
    end

    def state
      @game.reload.player_state
    end

    # Drives Jake to the hot desk; returns [time, run]
    def start_borrow
      report(npc_id: 'jake', event: 'check', object_id: 'jake_pc')
      fail_report = { npc_id: 'jake', event: 'fail', need: 'work', object_id: 'jake_pc', missing: [{ id: 'jake_pc', why: 'locked_out' }] }
      t = Time.current
      travel_to(t) { report(fail_report) }
      run = travel_to(t + 25) { report(fail_report).first['run'] }
      assert_equal 'borrow_session', run['do']
      [t, run]
    end

    def done(run, at:, **extra)
      travel_to(at) do
        post npc_workaround_game_url(@game), params: { npc_id: 'jake', index: run['index'], hand: run['hand'] }.merge(extra), as: :json
      end
      response
    end

    test 'an accepted done at the borrowed PC caches the borrower there, and it survives a reload' do
      build
      assert_equal [], state['cachedAt']
      t, run = start_borrow
      assert_equal [], state['cachedAt'], 'not cached by the hand-over alone'
      assert_equal 200, done(run, at: t + 60).status
      assert_equal [PAIR], state['cachedAt']
      assert_equal %w[jake], Game.find(@game.id).cached_accounts_at(@game.find_login_pc('hot_desk')[:object]).map { |n| n['id'] }
      assert_equal [], state['harvestedAccounts'], 'caching is not collecting'
    end

    test 'an early done is refused and caches nothing; a resent done adds nothing' do
      build
      t, run = start_borrow
      early = done(run, at: t + 26)
      refute_equal 200, early.status
      assert_equal [], state['cachedAt']
      assert_equal 200, done(run, at: t + 60).status
      assert_equal [PAIR], state['cachedAt']
      @game.reload.player_state['cachedAt'] = []
      @game.save!
      assert_equal 200, done(run, at: t + 90).status, 'the resent done is answered again'
      assert_equal [], state['cachedAt'], 'and writes nothing'
    end

    test 'a done cut short still caches' do
      build
      t, run = start_borrow
      assert_equal 200, done(run, at: t + 26, cut: true).status
      assert_equal [PAIR], state['cachedAt']
    end

    test 'a dropped hand-over caches nothing' do
      build
      t, run = start_borrow
      assert_equal 200, done(run, at: t + 60, dropped: true).status
      assert_equal [], state['cachedAt']
    end

    test 'a borrower locked out at the borrowed PC is not cached' do
      build(scenario(strict_desk: true), lockouts: ['jake_pc|jbrooks', 'hot_desk|jbrooks'])
      t, run = start_borrow
      assert_equal 200, done(run, at: t + 60).status
      assert_equal [], state['cachedAt']
    end

    test 'a careful guest, who leaves no session open, is cached' do
      build(scenario(careful: true))
      t, run = start_borrow
      assert_equal 200, done(run, at: t + 60).status
      assert_nil state.dig('guestSessions', 'hot_desk'), 'no guest session is left open'
      assert_equal [PAIR], state['cachedAt']
    end

    test 'a borrower not declared at the borrowed PC is not cached' do
      data = scenario
      data['rooms']['office']['objects'].find { |o| o['id'] == 'hot_desk' }.delete('cachedAccounts')
      build(data)
      t, run = start_borrow
      assert_equal 200, done(run, at: t + 60).status
      assert_equal [], state['cachedAt']
    end

    # ---- cachedAccounts never reaches the browser -------------------------------------------

    SECRET_KEY = 'cachedAccounts'.freeze
    LIST = [{ 'npc' => 'jake', 'after' => 'borrow' }].freeze

    def assert_absent(body, where)
      refute_includes body, SECRET_KEY, "#{where} must not carry #{SECRET_KEY}"
    end

    def leak_scenario
      data = CachedAccountsFixture.scenario
      data['startItemsInInventory'] = [{ 'type' => 'notes', 'id' => 'start_pc_like', 'name' => 'Start', 'takeable' => true,
                                         SECRET_KEY => LIST.deep_dup }]
      finance = data['rooms']['finance']
      finance['objects'] += [
        { 'type' => 'safe', 'id' => 'open_box', 'name' => 'Box', 'locked' => false, 'takeable' => false,
          'contents' => [{ 'type' => 'notes', 'id' => 'boxed', 'name' => 'Boxed', 'takeable' => true, SECRET_KEY => LIST.deep_dup,
                           'contents' => [{ 'type' => 'notes', 'id' => 'deep', 'name' => 'Deep', SECRET_KEY => LIST.deep_dup }] }] },
        { 'type' => 'notes', 'id' => 'loose', 'name' => 'Loose', 'takeable' => true, SECRET_KEY => LIST.deep_dup }
      ]
      finance['npcs'].find { |n| n['id'] == 'dana' }['itemsHeld'] = [
        { 'type' => 'notes', 'id' => 'held', 'name' => 'Held', 'takeable' => true, SECRET_KEY => LIST.deep_dup }
      ]
      # a second room, so the neighbour's answer is checked too
      data['rooms']['lobby']['objects'] = Array(data['rooms']['lobby']['objects']) + [
        { 'type' => 'notes', 'id' => 'lobby_pc_like', 'name' => 'Lobby', 'takeable' => false, SECRET_KEY => LIST.deep_dup }
      ]
      data
    end

    def build_leak
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user), scenario: leak_scenario,
        player_state: { 'currentRoom' => 'finance', 'unlockedRooms' => %w[lobby finance], 'unlockedObjects' => %w[open_box] }
      )
    end

    test 'the field is in the withheld list' do
      assert_includes NetworkAccess::WITHHELD_OBJECT_FIELDS, SECRET_KEY
    end

    test 'the authored data really holds the field (so the tests below can fail)' do
      build_leak
      raw = @game.scenario_data.to_json
      assert_includes raw, SECRET_KEY
      assert_includes @game.scenario_data['rooms']['finance']['objects'].find { |o| o['id'] == 'profile_pc' }.keys, SECRET_KEY
    end

    test 'the room answer of the PC room carries no cachedAccounts, on the PC, an item, a nested item or an NPC itemsHeld' do
      build_leak
      get room_game_url(@game, room_id: 'finance')
      assert_equal 200, response.status
      body = response.body
      assert_absent body, 'room answer'
      ids = JSON.parse(body)['room']['objects'].map { |o| o['id'] }
      assert_includes ids, 'profile_pc'
      assert_includes ids, 'loose'
      assert_includes body, 'held', 'the NPC held item is in the answer, without the field'
    end

    test 'a neighbouring room answer carries none' do
      build_leak
      get room_game_url(@game, room_id: 'lobby')
      assert_equal 200, response.status
      assert_includes response.body, 'lobby_pc_like'
      assert_absent response.body, 'neighbouring room answer'
    end

    test 'the container answer carries none, at any depth' do
      build_leak
      get "/break_escape/games/#{@game.id}/container/open_box"
      assert_equal 200, response.status, response.body
      assert_includes response.body, 'boxed'
      assert_includes response.body, 'deep'
      assert_absent response.body, 'container answer'
    end

    test 'the bootstrap scenario answer carries none' do
      build_leak
      get scenario_game_url(@game)
      assert_equal 200, response.status
      assert_absent response.body, 'bootstrap scenario'
    end

    test 'the inventory answers carry none: a start item, and an item taken from a room' do
      build_leak
      get scenario_game_url(@game)
      assert_absent response.body, 'bootstrap (start inventory)'
      assert_absent @game.reload.player_state.to_json, 'stored start inventory'
      item = @game.scenario_data['rooms']['finance']['objects'].find { |o| o['id'] == 'loose' }
      post inventory_game_url(@game), params: { action_type: 'add', item: item.to_h }, as: :json
      assert_includes [200, 201], response.status, response.body
      assert_absent response.body, 'inventory add answer'
      assert_absent @game.reload.player_state.to_json, 'stored inventory'
    end

    test 'the sync body and the NPC itemsHeld take path carry none' do
      build_leak
      get room_game_url(@game, room_id: 'finance')
      held = JSON.parse(response.body)['room']['npcs'].find { |n| n['id'] == 'dana' }['itemsHeld']
      assert_equal ['held'], held.map { |i| i['id'] }
      assert_absent held.to_json, 'NPC itemsHeld'
      post inventory_game_url(@game), params: { action_type: 'add', item: { id: 'held' }, source_npc_id: 'dana' }, as: :json
      assert_absent response.body, 'NPC item take answer'
    end
  end
end
