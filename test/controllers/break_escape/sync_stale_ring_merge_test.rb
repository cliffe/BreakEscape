require 'test_helper'

module BreakEscape
  # Chunk 2 of the stale-but-recent write ring (SYNC_STALE_RING_PLAN section 5):
  # the stale-but-recent band, the completeness guard, the empty-ring branch,
  # clearing the ring on a ten-minute reset, and the key-by-key pre-filter. A
  # stale-but-recent request applies only the keys no newer recorded request
  # wrote, never moves lastSyncClientTs, and still runs the grow-only and capture
  # steps. (currentRoom under this path is covered by the chunk 3 cases below.)
  class SyncStaleRingMergeTest < ActionDispatch::IntegrationTest
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

    def ps
      @game.reload.player_state
    end

    def globals
      ps['globalVariables'] || {}
    end

    def msg(id, read)
      { 'id' => id, 'thread' => 't', 'mailbox' => 'inbox', 'folder' => 'inbox',
        'from' => { 'name' => 'A', 'address' => 'a@b.example' }, 'subject' => 'Hi', 'body' => 'yo',
        'tells' => [], 'landed' => nil, 'time' => '09:00', 'gameTime' => 1, 'read' => read }
    end

    # ---- empty-ring branch ------------------------------------------------

    test 'a stale-but-recent request against an empty ring merges every key' do
      sync(clientTs: 1000, scenarioBriefShown: true) # fresh, moves the stamp, writes no ring entry
      assert_equal [], ps['syncWrites'] || []
      assert_equal 1000, ps['lastSyncClientTs']

      sync(clientTs: 500, globalVariables: { 'a' => 1 })
      assert_response :success
      assert_equal true, JSON.parse(response.body)['stale'], 'the answer is still stale'
      assert_equal 1, globals['a'], 'the empty-ring branch merges the key'
      assert_equal 1000, ps['lastSyncClientTs'], 'the stamp is not moved'
    end

    # ---- the completeness guard ------------------------------------------

    test 'a stale-but-recent request at or above the oldest retained entry merges key by key' do
      (1001..1009).each { |ts| sync(clientTs: ts, globalVariables: { "g#{ts}" => ts }) }
      assert_equal 8, ps['syncWrites'].size, 'the ring keeps its newest 8'
      oldest = ps['syncWrites'].map { |e| e['ts'] }.min
      assert_equal 1002, oldest

      sync(clientTs: 1005, globalVariables: { 'recovered' => 1 }) # 1005 >= 1002
      assert_response :success
      assert_equal 1, globals['recovered'], 'an unclaimed key is applied'
      assert_equal 1009, ps['lastSyncClientTs'], 'the stamp is not moved'
    end

    test 'a stale-but-recent request below the oldest retained entry falls back to whole-skip' do
      (1001..1009).each { |ts| sync(clientTs: ts, globalVariables: { "g#{ts}" => ts }) }
      assert_equal 1002, ps['syncWrites'].map { |e| e['ts'] }.min

      sync(clientTs: 1001, globalVariables: { 'evicted' => 1 }) # 1001 < 1002: a newer write may be gone
      assert_response :success
      assert_equal true, JSON.parse(response.body)['stale']
      assert_nil globals['evicted'], 'the fully-stale fall-back applies no last-write-wins section'
      assert_equal 1009, ps['lastSyncClientTs']
    end

    # ---- the key-by-key pre-filter ---------------------------------------

    test 'a claimed key is skipped and an unclaimed one is applied, with grow-only and no stamp move' do
      sync(clientTs: 2000, globalVariables: { 'g' => 5, 'keep' => 1 })
      sync(clientTs: 2001, globalVariables: { 'g' => 7 }) # g now 7, claimed at ts 2001

      sync(clientTs: 2000, globalVariables: { 'g' => 5, 'other' => 9 },
           triggeredEvents: { 'ev' => 1 })
      assert_response :success

      assert_equal 7, globals['g'], 'the older g is skipped; the newer value stands'
      assert_equal 9, globals['other'], 'the unclaimed key is applied'
      assert_equal 1, ps.dig('triggeredEvents', 'ev'), 'the grow-only step still runs'
      assert_equal 2001, ps['lastSyncClientTs'], 'the stamp is not moved'
    end

    test 'mailState compound keys: a claimed message is kept newer, an unclaimed one is applied' do
      sync(clientTs: 2999, globalVariables: { 'base' => 1 })          # a baseline below the request
      sync(clientTs: 3001, mailState: { 'mailboxes.inbox.m2' => msg('m2', true) }) # claims m2, read:true

      sync(clientTs: 3000, mailState: { 'mailboxes.inbox.m1' => msg('m1', false),
                                        'mailboxes.inbox.m2' => msg('m2', false) })
      assert_response :success

      inbox = ps.dig('mailState', 'mailboxes', 'inbox', 'messages')
      m1 = inbox.find { |m| m['id'] == 'm1' }
      m2 = inbox.find { |m| m['id'] == 'm2' }
      assert_equal false, m1['read'], 'the unclaimed m1 is applied'
      assert_equal true,  m2['read'], 'the claimed m2 keeps its newer value'
      assert_equal 3001, ps['lastSyncClientTs']
    end

    test 'phoneState claim by npc id skips only that contact' do
      sync(clientTs: 2999, globalVariables: { 'base' => 1 })
      sync(clientTs: 3001, phoneState: { 'alice' => { 'history' => [{ 'type' => 'npc', 'text' => 'New' }] } })

      sync(clientTs: 3000, phoneState: {
        'alice' => { 'history' => [{ 'type' => 'npc', 'text' => 'Old' }] },
        'bob'   => { 'history' => [{ 'type' => 'npc', 'text' => 'Bob' }] }
      })
      assert_response :success

      assert_equal %w[New], ps.dig('phoneState', 'alice', 'history').map { |m| m['text'] }, 'alice is claimed, kept'
      assert_equal %w[Bob], ps.dig('phoneState', 'bob', 'history').map { |m| m['text'] }, 'bob is applied'
    end

    # ---- chunk 3: currentRoom under the stale-but-recent path ------------

    # A newer ring entry claimed currentRoom (recorded as a whole-section claim), so an older room
    # on a later stale-but-recent request is skipped: the newer stored room stands, and no viaPass
    # credit runs for the skipped room.
    test 'an older room claimed by a newer entry leaves the newer stored room and gives no credit' do
      sync(clientTs: 3998, globalVariables: { 'base' => 1 })  # baseline below the request
      sync(clientTs: 4000, currentRoom: 'office')             # newer room stored, claims currentRoom
      assert_equal 'office', ps['currentRoom']

      sync(clientTs: 3999, currentRoom: 'lobby', globalVariables: { 'x' => 1 })
      assert_response :success
      assert_equal 'office', ps['currentRoom'], 'the claimed currentRoom is skipped, newer room stands'
      assert_equal %w[lobby office], ps['unlockedRooms'], 'the skipped room path promotes nothing (no credit)'
      assert_equal 1, globals['x'], 'other sections still merge key by key'
    end

    # An unclaimed currentRoom on a stale-but-recent request (no newer entry claimed it) goes through
    # the normal may_sync_current_room? acceptance, exactly as a fresh room does.
    test 'an unclaimed room on a stale-but-recent request goes through normal acceptance' do
      sync(clientTs: 3998, globalVariables: { 'base' => 1 })  # baseline below the request
      sync(clientTs: 4000, globalVariables: { 'g' => 1 })     # newer entry, does not claim currentRoom
      assert_equal 'lobby', ps['currentRoom']

      sync(clientTs: 3999, currentRoom: 'office', globalVariables: { 'x' => 1 })
      assert_response :success
      assert_equal 'office', ps['currentRoom'], 'an unclaimed room is accepted on the stale-but-recent path'
      assert_equal 1, globals['x']
    end

    # A forged room (outside the acceptance set) on the stale-but-recent path still returns 200 with
    # currentRoom in notSaved, stores no room and credits nothing; the rest of the batch commits.
    test 'a forged room on a stale-but-recent request is notSaved with no credit, rest commits' do
      sync(clientTs: 3998, globalVariables: { 'base' => 1 })  # baseline below the request
      sync(clientTs: 4000, globalVariables: { 'g' => 1 })     # newer entry, does not claim currentRoom

      sync(clientTs: 3999, currentRoom: 'vault', globalVariables: { 'x' => 1 })
      assert_response :success
      assert_includes JSON.parse(response.body)['notSaved'] || [], 'currentRoom', 'the forged room is notSaved'
      assert_equal 'lobby', ps['currentRoom'], 'the forged room is not stored'
      refute_includes ps['unlockedRooms'], 'vault', 'the forged room path promotes nothing (no credit)'
      assert_equal 1, globals['x'], 'the rest of the batch still commits'
    end

    # ---- the ten-minute reset clears the ring ----------------------------

    test 'the ten-minute reset clears the ring and the merge re-engages afterwards' do
      sync(clientTs: 1_000_000, globalVariables: { 'a' => 1 })
      assert ps['syncWrites'].any?, 'the ring holds a pre-reset entry'

      sync(clientTs: 300_000, globalVariables: { 'b' => 1 }) # 700 s below: the reset branch
      assert_response :success
      stamps = ps['syncWrites'].map { |e| e['ts'] }
      refute_includes stamps, 1_000_000, 'the reset drops the lingering pre-reset entry'
      assert_equal [300_000], stamps, 'only the reset request own (fresh) entry remains'
      assert_equal 300_000, ps['lastSyncClientTs']
      assert_equal 1, globals['b'], 'the reset request is treated as fresh'

      # Stale-but-recent on the new, low timeline: ts at the post-reset entry, so
      # the guard holds. Pre-reset this request would have failed the guard
      # forever against the lingering ts 1_000_000 entry.
      sync(clientTs: 300_000, globalVariables: { 'd' => 1 })
      assert_response :success
      assert_equal 1, globals['d'], 'the merge re-engages rather than failing forever on pre-reset entries'
      assert_equal 300_000, ps['lastSyncClientTs']
    end
  end
end
