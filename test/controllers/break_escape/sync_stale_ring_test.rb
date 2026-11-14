require 'test_helper'

module BreakEscape
  # Chunk 1 of the stale-but-recent write ring (SYNC_STALE_RING_PLAN section 4,
  # 9, 10): the server records what each accepted last-write-wins sync changed
  # into player_state['syncWrites'], recording only landed, changed keys, keeping
  # the ring bounded, and never shipping it to the client. The read path (the
  # key-by-key merge) lands in chunk 2; here only the recorder and the bound are
  # exercised.
  class SyncStaleRingTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @owner   = break_escape_demo_users(:test_user)

      PlayerPreference.find_or_create_by!(player: @owner) do |pref|
        pref.selected_sprite = 'female_hacker_hood_v2'
        pref.in_game_name    = 'TestAgent'
      end

      @game = Game.create!(
        mission: @mission, player: @owner,
        scenario_data: {
          'startRoom' => 'lobby',
          'rooms' => {
            'lobby' => { 'type' => 'room_office', 'locked' => false, 'connections' => {}, 'objects' => [], 'npcs' => [] },
            'office' => { 'type' => 'room_office', 'locked' => false, 'connections' => {}, 'objects' => [], 'npcs' => [] }
          },
          'globalVariables' => {}
        },
        player_state: {
          'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby office], 'unlockedObjects' => [],
          'inventory' => [], 'globalVariables' => {}, 'notes' => []
        }
      )
    end

    def sync(params)
      put sync_state_game_url(@game), params: params, as: :json
    end

    def ring
      @game.reload.player_state['syncWrites'] || []
    end

    def latest_w
      ring.first['w']
    end

    def capture_sql
      sql = []
      sub = ActiveSupport::Notifications.subscribe('sql.active_record') do |*, payload|
        next if %w[SCHEMA TRANSACTION].include?(payload[:name]) || payload[:sql] =~ /\A\s*(BEGIN|COMMIT|SAVEPOINT|RELEASE|ROLLBACK)/

        sql << payload[:sql]
      end
      yield
      sql
    ensure
      ActiveSupport::Notifications.unsubscribe(sub)
    end

    # ---- what is recorded -------------------------------------------------

    test 'a sync records the sections and keys its merge changed' do
      sync(clientTs: 1000, globalVariables: { 'a' => 1, 'b' => 2 }, currentRoom: 'office',
           playerHealth: { 'hp' => 70, 'maxHP' => 100 },
           timedMessages: { 'pending' => [], 'delivered' => ['npc:hax:0'] })
      assert_response :success

      w = latest_w
      assert_equal 1000, ring.first['ts']
      assert_equal %w[a b], w['globalVariables'].sort
      assert_equal true, w['currentRoom']
      assert_equal true, w['playerHealth'], 'playerHealth is a whole-section claim'
      assert_equal true, w['timedMessages'], 'timedMessages is a whole-section claim'
    end

    test 'a global the request carried but did not change is not recorded' do
      sync(clientTs: 1000, globalVariables: { 'a' => 1, 'b' => 2 })
      sync(clientTs: 1001, globalVariables: { 'a' => 1, 'c' => 3 })
      assert_response :success

      assert_equal %w[c], latest_w['globalVariables'], 'a stayed 1, only c changed'
    end

    test 'a deleted global is recorded as a claim by its name' do
      sync(clientTs: 1000, globalVariables: { 'a' => 1 })
      sync(clientTs: 1001, globalVariables: { 'a' => nil })
      assert_response :success

      assert_equal %w[a], latest_w['globalVariables']
      assert_nil @game.reload.player_state.dig('globalVariables', 'a'), 'the key is gone'
    end

    test 'a refused currentRoom is not recorded, the rest of the batch is' do
      sync(clientTs: 1000, globalVariables: { 'a' => 1 }, currentRoom: 'vault')
      assert_response :success
      assert_includes JSON.parse(response.body)['notSaved'], 'currentRoom'

      w = latest_w
      assert_equal %w[a], w['globalVariables']
      assert_nil w['currentRoom'], 'a room outside the acceptance set is not recorded'
    end

    test 'a mailState refused over a cap is not recorded' do
      boxes = (1..21).each_with_object({}) do |i, h|
        h["mailboxes.box#{i}.m#{i}"] = { 'id' => "m#{i}", 'folder' => 'inbox', 'subject' => 'x', 'body' => 'y' }
      end
      sync(clientTs: 1000, globalVariables: { 'a' => 1 }, mailState: boxes)
      assert_response :success
      assert_includes JSON.parse(response.body)['notSaved'], 'mailState'

      assert_equal %w[a], latest_w['globalVariables']
      assert_nil latest_w['mailState'], 'a refused mailState records nothing'
    end

    test 'a cap-rejected npcInkVariables update is not recorded' do
      sync(clientTs: 1000, globalVariables: { 'a' => 1 },
           npcInkVariables: { 'hax' => { 'big' => 'x' * 200_000 } })
      assert_response :success

      assert_equal %w[a], latest_w['globalVariables']
      assert_nil latest_w['npcInkVariables'], 'the over-128KB update wrote nothing, so records nothing'
      assert_nil @game.reload.player_state['npcInkVariables']
    end

    test 'a changed mail key is recorded by its dotted claim key' do
      msg = { 'id' => 'm1', 'thread' => 't', 'mailbox' => 'inbox', 'folder' => 'inbox',
              'from' => { 'name' => 'A', 'address' => 'a@b.example' }, 'subject' => 'Hi', 'body' => 'yo',
              'tells' => [], 'landed' => nil, 'time' => '09:00', 'gameTime' => 1, 'read' => false }
      sync(clientTs: 1000, mailState: { 'mailboxes.inbox.m1' => msg })
      assert_response :success

      assert_equal %w[mailboxes.inbox.m1], latest_w['mailState']
    end

    # ---- no-op costs nothing ---------------------------------------------

    test 'an unchanged resend with no clientTs writes no ring entry and no UPDATE' do
      sync(globalVariables: { 'a' => 1 }) # first write, no clientTs: records nothing to the ring
      assert_response :success
      assert_equal [], ring, 'a request without a numeric clientTs records no ring entry'

      sql = capture_sql { sync(globalVariables: { 'a' => 1 }) }
      assert_response :success
      assert_equal 0, sql.count { |s| s.start_with?('UPDATE') }, 'an identical resend rewrites nothing'
      assert_equal [], ring
    end

    test 'a no-op resend with a fresh clientTs adds no ring entry' do
      sync(clientTs: 1000, globalVariables: { 'a' => 1 })
      assert_equal 1, ring.size
      sync(clientTs: 1001, globalVariables: { 'a' => 1 }) # value unchanged
      assert_response :success
      assert_equal 1, ring.size, 'only lastSyncClientTs moved; the merge changed nothing, so no entry'
    end

    # ---- the bound --------------------------------------------------------

    test 'a single sync writing over the key cap collapses to a whole claim' do
      globals = (1..40).each_with_object({}) { |i, h| h["g#{i}"] = i }
      sync(clientTs: 1000, globalVariables: globals)
      assert_response :success

      assert_equal true, latest_w['globalVariables'], 'over 32 keys collapses the section to true'
    end

    test 'a long burst of syncs keeps the ring at or under 8 entries and ~8 KB' do
      base = 1_000_000
      60.times do |i|
        payload = { clientTs: base + i, globalVariables: { "g#{i}" => i } }
        payload[:globalVariables] = (1..40).each_with_object({}) { |k, h| h["b#{i}_#{k}"] = k } if (i % 10).zero?
        sync(payload)
        assert_response :success
      end

      stored = ring
      assert_operator stored.size, :<=, 8, 'the ring never grows past 8 entries'
      bytes = stored.to_json.bytesize
      assert_operator bytes, :<, 10_000, "the serialised ring stayed bounded (#{bytes} bytes)"
      newest = stored.map { |e| e['ts'] }.max
      assert stored.all? { |e| newest - e['ts'] <= 60_000 }, 'every kept entry is within the 60 s window'
    end

    test 'an entry more than 60 s below a newer write is expired' do
      sync(clientTs: 1_000_000, globalVariables: { 'old' => 1 })
      assert_equal 1, ring.size
      sync(clientTs: 1_000_000 + 60_001, globalVariables: { 'new' => 1 })
      assert_response :success

      assert_equal [1_000_000 + 60_001], ring.map { |e| e['ts'] }, 'the stale entry is dropped'
    end

    # ---- never sent to the client ----------------------------------------

    test 'syncWrites is never in the bootstrap scenario payload' do
      sync(clientTs: 1000, globalVariables: { 'a' => 1 })
      assert ring.any?, 'the ring is populated'

      get scenario_game_url(@game)
      assert_response :success
      refute_includes response.body, 'syncWrites', 'the ring must not ship in the bootstrap'
      boot = JSON.parse(response.body)
      assert_equal({ 'a' => 1 }, boot['savedGlobalVariables'], 'globals still ship')
      assert_nil boot['syncWrites']
    end

    test 'syncWrites is never in a sync_state answer' do
      sync(clientTs: 1000, globalVariables: { 'a' => 1 })
      assert_response :success
      refute_includes response.body, 'syncWrites'

      sync(clientTs: 500, globalVariables: { 'a' => 2 }) # a stale answer
      assert_response :success
      refute_includes response.body, 'syncWrites'
    end

    test 'syncWrites does not leak through the objectives echo' do
      @game.update!(player_state: @game.player_state.merge('objectivesState' => { 'tasks' => {}, 'aims' => {} }))
      sync(clientTs: 1000, globalVariables: { 'a' => 1 })
      assert ring.any?

      get objectives_game_url(@game)
      assert_response :success
      refute_includes response.body, 'syncWrites'
    end
  end
end
