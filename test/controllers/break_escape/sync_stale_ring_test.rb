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

      @game = build_game
    end

    # A fresh game, so a two-order test can run its second landing order against a
    # clean player_state (no carried stamp or ring).
    def build_game
      Game.create!(
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

    def ps
      @game.reload.player_state
    end

    def globals
      ps['globalVariables'] || {}
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

    # Chunk 5 size bound: a hostile flood mixing over-cap key counts, an over-length key name
    # and deletions must leave the ring within every bound (8 entries, 32 recorded keys per
    # entry, 128 bytes per kept claim key), and the ring must never reach the client.
    test 'a hostile flood keeps the ring within every bound and never ships it' do
      base = 2_000_000
      long_key = 'k' * 200   # over the 128-byte cap: its section collapses to a whole claim
      50.times do |i|
        gv =
          case i % 3
          when 0 then (1..40).each_with_object({}) { |k, h| h["flood#{i}_#{k}"] = k } # over the 32-key cap
          when 1 then { long_key => i, "set#{i}" => i }                               # a 200-byte key name
          else        { "set#{i - 1}" => nil, "d#{i}" => i }                          # a deletion plus a set
          end
        sync(clientTs: base + i, globalVariables: gv)
        assert_response :success
      end

      stored = ring
      assert_operator stored.size, :<=, 8, 'at most 8 entries'
      stored.each do |entry|
        count = entry['w'].sum { |_, claim| claim == true ? 1 : claim.size }
        assert_operator count, :<=, 32, "entry #{entry['ts']} stays within 32 recorded keys"
        entry['w'].each_value do |claim|
          next unless claim.is_a?(Array)

          claim.each { |k| assert_operator k.to_s.bytesize, :<=, 128, 'every kept claim key is within 128 bytes' }
        end
      end

      get scenario_game_url(@game)
      assert_response :success
      refute_includes response.body, 'syncWrites', 'the ring never appears in the bootstrap JSON'
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

    # ---- chunk 4: the re-stamped gap recoveries (SYNC_STALE_RING_PLAN section 8, 10) ----
    #
    # The client re-stamp (chunk 4) puts the newer-content request D ABOVE the older hidden
    # flush H (tsD > tsH). These drive D and H as ordered sync_state requests in that shipped
    # order and assert the exact saved player_state in BOTH landing orders. A baseline fresh
    # sync below both keeps the completeness guard holding when H lands stale-but-recent (its
    # ring entry is otherwise the only one, and H would fall below it).

    # Gap 2: playerHealth is a whole-section claim. H carries the pre-hit health 100 and a
    # unique global blob; D carries the post-hit health 70 at the higher stamp.
    test 'gap 2: the newer health wins and the flush unique key survives, in both landing orders' do
      # H then D: both fresh in stamp order.
      sync(clientTs: 1000, globalVariables: { 'seed' => 1 })                                             # baseline below H and D
      sync(clientTs: 1001, playerHealth: { 'hp' => 100, 'maxHP' => 100 }, globalVariables: { 'blob' => 1 }) # H
      sync(clientTs: 1002, playerHealth: { 'hp' => 70, 'maxHP' => 100 })                                 # D (fresh)
      assert_response :success
      assert_equal 70, ps.dig('playerHealth', 'hp'), 'the newer health stands'
      assert_equal 1, globals['blob'], 'H unique key present'

      # D then H: H lands stale-but-recent, its claimed playerHealth skipped, blob merged.
      @game = build_game
      sync(clientTs: 1000, globalVariables: { 'seed' => 1 })
      sync(clientTs: 1002, playerHealth: { 'hp' => 70, 'maxHP' => 100 })                                 # D first (fresh)
      sync(clientTs: 1001, playerHealth: { 'hp' => 100, 'maxHP' => 100 }, globalVariables: { 'blob' => 1 }) # H stale-but-recent
      assert_response :success
      assert_equal true, JSON.parse(response.body)['stale'], 'H answers stale'
      assert_equal 70, ps.dig('playerHealth', 'hp'), 'H playerHealth claimed by D, skipped: 70 stands'
      assert_equal 1, globals['blob'], 'H unique key merged on the stale-but-recent path'
      assert_equal 1002, ps['lastSyncClientTs'], 'H does not move the stamp'
    end

    # Gap 3: a last-write-wins global. D carries the newer g 7 at the higher stamp, H the
    # older g 5.
    test 'gap 3: the newer global g wins, in both landing orders' do
      # D then H: H stale-but-recent, g claimed by D, skipped.
      sync(clientTs: 2000, globalVariables: { 'seed' => 1 })  # baseline
      sync(clientTs: 2002, globalVariables: { 'g' => 7 })     # D
      sync(clientTs: 2001, globalVariables: { 'g' => 5 })     # H stale-but-recent
      assert_response :success
      assert_equal true, JSON.parse(response.body)['stale']
      assert_equal 7, globals['g'], 'H older g is skipped; 7 stands'
      assert_equal 2002, ps['lastSyncClientTs'], 'H does not move the stamp'

      # H then D: D is fresh and applies the newer g.
      @game = build_game
      sync(clientTs: 2000, globalVariables: { 'seed' => 1 })
      sync(clientTs: 2001, globalVariables: { 'g' => 5 })     # H first
      sync(clientTs: 2002, globalVariables: { 'g' => 7 })     # D fresh
      assert_response :success
      assert_equal 7, globals['g'], 'D fresh applies the newer g'
    end

    # Gap 1 recovery: D (a reduced body, a unique key late) at the higher stamp; H (the
    # stale-but-recent flush) carries its own unique key blob. Both survive, and H never
    # moves the stamp.
    test 'gap 1: a reduced D and the stale-but-recent flush H both land, in both landing orders' do
      # D then H
      sync(clientTs: 3000, globalVariables: { 'seed' => 1 })  # baseline
      sync(clientTs: 3002, globalVariables: { 'late' => 1 })  # D (reduced)
      sync(clientTs: 3001, globalVariables: { 'blob' => 1 })  # H stale-but-recent
      assert_response :success
      assert_equal true, JSON.parse(response.body)['stale']
      assert_equal 1, globals['late'], 'D key present'
      assert_equal 1, globals['blob'], 'H unique key merged'
      assert_equal 3002, ps['lastSyncClientTs'], 'H does not move the stamp'

      # H then D
      @game = build_game
      sync(clientTs: 3000, globalVariables: { 'seed' => 1 })
      sync(clientTs: 3001, globalVariables: { 'blob' => 1 })  # H first (fresh)
      sync(clientTs: 3002, globalVariables: { 'late' => 1 })  # D fresh
      assert_response :success
      assert_equal 1, globals['late']
      assert_equal 1, globals['blob']
      assert_equal 3002, ps['lastSyncClientTs']
    end

    # currentRoom: a newer entry claimed currentRoom, so an older stale-but-recent room is
    # skipped (both orders leave the newer room standing); and a refused (forged) room on a
    # stale-but-recent request does not block a later legitimate room.
    test 'currentRoom: the newer room stands in both orders, and a refused room does not block a later one' do
      # Newer room claimed, older stale-but-recent room skipped (D then H).
      sync(clientTs: 4000, globalVariables: { 'seed' => 1 })  # baseline
      sync(clientTs: 4002, currentRoom: 'office')             # D: newer room, claims currentRoom
      sync(clientTs: 4001, currentRoom: 'lobby')              # H stale-but-recent, claimed: skipped
      assert_response :success
      assert_equal 'office', ps['currentRoom'], 'the claimed room is skipped, newer room stands'

      # Other order: older room first (fresh), then the newer room fresh overwrites it.
      @game = build_game
      sync(clientTs: 4000, globalVariables: { 'seed' => 1 })
      sync(clientTs: 4001, currentRoom: 'lobby')              # older room first
      sync(clientTs: 4002, currentRoom: 'office')             # newer room fresh
      assert_response :success
      assert_equal 'office', ps['currentRoom'], 'the newer room stands'

      # A forged room on a stale-but-recent request is notSaved and does not block a later room.
      @game = build_game
      sync(clientTs: 4000, globalVariables: { 'seed' => 1 })  # baseline
      sync(clientTs: 4002, globalVariables: { 'g' => 1 })     # newer entry, does not claim currentRoom
      sync(clientTs: 4001, currentRoom: 'vault')              # forged, stale-but-recent
      assert_response :success
      assert_includes JSON.parse(response.body)['notSaved'] || [], 'currentRoom', 'the forged room is notSaved'
      assert_equal 'lobby', ps['currentRoom'], 'the forged room is not stored'
      sync(clientTs: 4003, currentRoom: 'office')             # a later legitimate room
      assert_response :success
      assert_equal 'office', ps['currentRoom'], 'the refusal did not block the later room'
    end

    # Chunk 4 review R1, minor 2: the one D-first order the re-stamp does not fully close.
    # When there is no qualifying ring entry at or below H's stamp (an existing game past the
    # deploy, an expired ring, or a reset-cleared ring), H lands stale-but-recent, the
    # completeness guard fails, and H whole-skips, so H's unique last-write-wins section is
    # dropped on that page-unload race. This is the documented, intended R2 cost (plan
    # section 5 "empty-ring guard failure" and section 10). It self-heals on the next fresh
    # sync. Pinning it keeps a later change that widened the empty-ring window from silently
    # dropping a hidden flush's unique content while every gap test still passed.
    test 'R1 m2: D first then H stale against no qualifying ring entry drops H unique section, next fresh sync writes normally' do
      # An existing game past the deploy: a stored lastSyncClientTs, a clean (empty) ring, so
      # no ring entry sits at or below H's stamp.
      @game.update!(player_state: @game.player_state.merge('lastSyncClientTs' => 900, 'syncWrites' => []))

      # D (the newer-content body, stamped above H) lands first and is fresh.
      sync(clientTs: 1002, globalVariables: { 'late' => 1 })        # D
      assert_response :success
      refute JSON.parse(response.body)['stale'], 'D is fresh'
      assert_equal 1, globals['late'], 'D applies'

      # H (the older hidden flush carrying its own unique key blob) arrives stale. The only
      # ring entry is D's at 1002, above H, so the guard fails and H whole-skips.
      sync(clientTs: 1001, globalVariables: { 'blob' => 1 })        # H stale, guard fails
      assert_response :success
      assert_equal 200, response.status
      assert_equal true, JSON.parse(response.body)['stale'], 'H answers 200 with stale:true'
      assert_nil globals['blob'], "H's unique section is dropped (guard fails, whole-skip): the R2 cost"
      assert_equal 1002, ps['lastSyncClientTs'], 'H does not move the stamp'

      # The loss is only for the mis-ordered body: the next fresh sync writes normally.
      sync(clientTs: 1003, globalVariables: { 'blob' => 1 })
      assert_response :success
      refute JSON.parse(response.body)['stale'], 'the next sync is fresh'
      assert_equal 1, globals['blob'], 'a fresh sync writes the content normally again'
    end
  end
end
