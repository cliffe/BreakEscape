require 'test_helper'
require_relative '../../support/gated_uid_scenario'

module BreakEscape
  # UID-only discrimination at a route-room rfid object, across promotion
  # (GATED_DOOR_SERVER_CHECK_PLAN.md test 11b, carried from Chunk A). The model-level
  # truth behind the controller gate: rfid_lock_passes? honours acceptsUIDOnly, the
  # object-action gate is in force only while the room is unpromoted, and
  # uid_only_refusal? leaks the reason only after promotion. Promotion itself unlocks
  # the room alone and leaves its objects locked and the credential global unset.
  class GatedUidOnlyAfterPromotionTest < ActiveSupport::TestCase
    EXEC = GatedUidScenario::EXEC_CARD_ID

    def build(player_state = {})
      create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: GatedUidScenario.scenario,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby] }.merge(player_state)
      )
    end

    # Held state: the cloner in hand plus a recorded UID-only copy of the exec card.
    def with_uid_clone(extra = {})
      build({ 'inventory' => [GatedUidScenario::CLONER.dup],
              'serverClones' => GatedUidScenario.uid_clone_state }.merge(extra))
    end

    test 'an honest UID-only clone passes a lock that accepts UID only' do
      game = with_uid_clone
      uid_safe = game.find_scenario_object('uid_safe')
      assert_equal true, uid_safe['acceptsUIDOnly']
      assert game.rfid_lock_passes?(uid_safe, [EXEC]),
             'a UID-only copy of the admitted exec card opens an acceptsUIDOnly lock'
    end

    test 'the same UID-only clone is refused by a lock that does not accept UID only' do
      game = with_uid_clone
      strict_safe = game.find_scenario_object('strict_safe')
      refute strict_safe['acceptsUIDOnly']
      refute game.rfid_lock_passes?(strict_safe, [EXEC]),
             'a UID-only copy does not open a lock without acceptsUIDOnly'
    end

    test 'a forged card id the server never recorded does not pass' do
      game = with_uid_clone
      uid_safe = game.find_scenario_object('uid_safe')
      refute game.rfid_lock_passes?(uid_safe, ['FORGED-99']),
             'a card id with no held keycard and no recorded clone is refused'
    end

    test 'a recorded clone claimed without the cloner in hand does not pass' do
      # No rfid_cloner in the inventory: the recorded clone is not provable possession.
      game = build('serverClones' => GatedUidScenario.uid_clone_state)
      uid_safe = game.find_scenario_object('uid_safe')
      refute game.rfid_lock_passes?(uid_safe, [EXEC]),
             'without the cloner held the server does not trust the recorded copy'
    end

    test 'the object-action gate holds a UID-safe object only while the room is unpromoted' do
      game = with_uid_clone('npcRouteRooms' => ['secure_area'])
      assert game.object_in_unpromoted_route_room?('uid_safe'),
             'the UID object is gated while the room is served-but-unearned'
      assert game.object_in_unpromoted_route_room?('strict_safe')

      game.player_state['unlockedRooms'] << 'secure_area'
      game.save!
      refute game.object_in_unpromoted_route_room?('uid_safe'), 'the gate lifts once the room is promoted'
      refute game.object_in_unpromoted_route_room?('strict_safe')
    end

    test 'uid_only_refusal? leaks no reason for a route-room object, returns it after promotion' do
      game = with_uid_clone('npcRouteRooms' => ['secure_area'])
      refute game.uid_only_refusal?('object', 'strict_safe', [EXEC]),
             'no uid_only reason leaks while the room is unpromoted'

      game.player_state['unlockedRooms'] << 'secure_area'
      game.save!
      assert game.uid_only_refusal?('object', 'strict_safe', [EXEC]),
             'the uid_only reason returns once the room is promoted'
      refute game.uid_only_refusal?('object', 'uid_safe', [EXEC]),
             'a lock that accepts UID only never answers uid_only (the copy passes)'
    end

    # Point 4: promotion unlocks the room and leaves its objects locked and the other
    # credit path unfired.
    test 'promoting the route room re-opens and re-locks nothing it should not' do
      game = with_uid_clone('npcRouteRooms' => ['secure_area'])
      before_unlocked_objects = Array(game.player_state['unlockedObjects']).dup

      assert game.promote_route_room!('secure_area', 'viaPass'), 'viaPass promotion applies'

      state = game.reload.player_state
      assert_includes Array(state['unlockedRooms']), 'secure_area', 'the room is promoted'
      refute_includes Array(state['npcRouteRooms']), 'secure_area', 'and removed from the route list'
      assert_includes Array(state['unlockedRooms']), 'lobby', 'the already-open lobby stays unlocked'
      assert_equal true, state.dig('globalVariables', 'kp_badge_tailgated'), 'the viaPass credit global is set'
      refute state.dig('globalVariables', 'kp_records_cloned'), 'the viaCredential global is not fired by a pass'
      assert_equal before_unlocked_objects, Array(state['unlockedObjects']),
                   'promotion unlocks no object; the UID safes stay locked'
    end

    # migrate_soft_locked_route_rooms! (§10): a stored game with the room wrongly unlocked but
    # no credit earned is demoted back to the route list, re-gating its UID objects; a game that
    # earned the pass is left untouched.
    test 'the soft-lock migration demotes an uncredited UID route room and re-gates its objects' do
      game = with_uid_clone('unlockedRooms' => %w[lobby secure_area])
      game.migrate_soft_locked_route_rooms!

      state = game.reload.player_state
      refute_includes Array(state['unlockedRooms']), 'secure_area', 'the soft-locked room is demoted'
      assert_includes Array(state['npcRouteRooms']), 'secure_area'
      assert game.object_in_unpromoted_route_room?('uid_safe'), 'its UID objects are gated again'
    end

    test 'the soft-lock migration leaves a credited UID route room unlocked' do
      game = with_uid_clone('unlockedRooms' => %w[lobby secure_area],
                            'globalVariables' => { 'kp_badge_tailgated' => true })
      game.migrate_soft_locked_route_rooms!

      state = game.reload.player_state
      assert_includes Array(state['unlockedRooms']), 'secure_area', 'an earned room stays unlocked'
      refute_includes Array(state['npcRouteRooms']), 'secure_area'
    end
  end
end
