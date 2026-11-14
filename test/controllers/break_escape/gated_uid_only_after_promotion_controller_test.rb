require 'test_helper'
require_relative '../../support/gated_uid_scenario'

module BreakEscape
  # UID-only discrimination at a route-room rfid object, end to end
  # (GATED_DOOR_SERVER_CHECK_PLAN.md test 11b, carried from Chunk A to Chunk E). A split
  # gated room promoted viaPass, an rfid safe that accepts a UID-only copy and one that does
  # not, and an honest UID clone recorded through POST /clone_card. The object-action gate
  # refuses the safe before promotion; after promotion the honest clone opens the acceptsUIDOnly
  # safe, the strict safe refuses it and answers reason uid_only, and a forged card id is refused.
  class GatedUidOnlyAfterPromotionControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    EXEC = GatedUidScenario::EXEC_CARD_ID

    def build(player_state = {})
      create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: GatedUidScenario.scenario,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby] }.merge(player_state)
      )
    end

    def state(game)
      game.reload.player_state
    end

    # Honest route end to end: record a UID-only copy of the exec's DESFire card, wear the
    # hi-vis, slip in behind Len, sync into the room (viaPass promotion). Promotion unlocks the
    # room alone; then the honest clone opens the acceptsUIDOnly safe.
    test 'an honestly cloned UID opens the acceptsUIDOnly safe once the room is promoted' do
      game = build('inventory' => [GatedUidScenario::CLONER.dup, GatedUidScenario::VEST.dup],
                   'encounteredNPCs' => ['exec'])

      post clone_card_game_url(game), params: { card_id: EXEC, npc_id: 'exec' }, as: :json
      assert_response :success
      assert_equal true, response.parsed_body['recorded'], 'the exec card is recorded'
      assert_equal true, state(game).dig('serverClones', EXEC, 'uidOnly'), 'a DESFire copy is UID-only'

      post wear_game_url(game), params: { item_id: 'vest', worn: true }, as: :json
      assert_response :success
      assert_equal true, state(game).dig('globalVariables', 'courier_ready')

      post unlock_game_url(game), params: { targetType: 'door', targetId: 'secure_area', attempt: 'len', method: 'npc' }, as: :json
      assert_response :success
      assert_includes Array(state(game)['npcRouteRooms']), 'secure_area'

      put sync_state_game_url(game), params: { currentRoom: 'secure_area' }, as: :json
      assert_response :success
      st = state(game)
      assert_includes Array(st['unlockedRooms']), 'secure_area', 'viaPass promotes the room'
      refute_includes Array(st['npcRouteRooms']), 'secure_area', 'promotion empties the route list'
      assert_includes Array(st['unlockedRooms']), 'lobby', 'the already-open lobby stays unlocked'
      assert_equal true, st.dig('globalVariables', 'kp_badge_tailgated'), 'the viaPass credit global is set'
      refute st.dig('globalVariables', 'kp_records_cloned'), 'the credential global is not fired by a pass'
      refute_includes Array(st['unlockedObjects']), 'uid_safe', 'promotion leaves the safe locked'

      post unlock_game_url(game), params: { targetType: 'object', targetId: 'uid_safe', method: 'rfid', card_ids: [EXEC] }, as: :json
      assert_response :success
      assert response.parsed_body['contents'].present?, 'the safe serves its contents to the honest clone'
      assert_includes Array(state(game)['unlockedObjects']), 'uid_safe'
    end

    # Before promotion the object-action gate refuses the UID safe even though the clone would open it.
    test 'the UID safe is gated while the room is an unpromoted route room' do
      game = build('npcRouteRooms' => ['secure_area'],
                   'inventory' => [GatedUidScenario::CLONER.dup],
                   'serverClones' => GatedUidScenario.uid_clone_state)
      post unlock_game_url(game), params: { targetType: 'object', targetId: 'uid_safe', method: 'rfid', card_ids: [EXEC] }, as: :json

      assert_response :forbidden
      body = response.parsed_body
      assert_equal 'room_not_reachable', body['reason']
      assert_equal true, body['retryable']
      refute body['contents'].present?, 'no contents leak for a gated object'
      refute_includes Array(state(game)['unlockedObjects']), 'uid_safe'
    end

    # The strict safe refuses the UID copy; the uid_only reason is suppressed while unpromoted.
    test 'the strict safe leaks no uid_only reason for an unpromoted route-room object' do
      game = build('npcRouteRooms' => ['secure_area'],
                   'inventory' => [GatedUidScenario::CLONER.dup],
                   'serverClones' => GatedUidScenario.uid_clone_state)
      post unlock_game_url(game), params: { targetType: 'object', targetId: 'strict_safe', method: 'rfid', card_ids: [EXEC] }, as: :json

      assert_response :unprocessable_entity
      refute_equal 'uid_only', response.parsed_body['reason'], 'no uid_only reason while unpromoted'
      refute_includes Array(state(game)['unlockedObjects']), 'strict_safe'
    end

    # After promotion the strict safe still refuses the UID copy, now answering reason uid_only.
    test 'the strict safe refuses the UID copy and answers uid_only after promotion' do
      game = build('unlockedRooms' => %w[lobby secure_area],
                   'inventory' => [GatedUidScenario::CLONER.dup],
                   'serverClones' => GatedUidScenario.uid_clone_state)
      post unlock_game_url(game), params: { targetType: 'object', targetId: 'strict_safe', method: 'rfid', card_ids: [EXEC] }, as: :json

      assert_response :unprocessable_entity
      assert_equal 'uid_only', response.parsed_body['reason'], 'the uid_only reason returns after promotion'
      refute_includes Array(state(game)['unlockedObjects']), 'strict_safe'
    end

    # A forged card id the server never recorded opens nothing, even after promotion.
    test 'a forged card id does not open the UID safe after promotion' do
      game = build('unlockedRooms' => %w[lobby secure_area],
                   'inventory' => [GatedUidScenario::CLONER.dup],
                   'serverClones' => GatedUidScenario.uid_clone_state)
      post unlock_game_url(game), params: { targetType: 'object', targetId: 'uid_safe', method: 'rfid', card_ids: ['FORGED-99'] }, as: :json

      assert_response :unprocessable_entity
      refute_includes Array(state(game)['unlockedObjects']), 'uid_safe'
    end
  end
end
