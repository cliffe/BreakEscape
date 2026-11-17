require 'test_helper'

module BreakEscape
  # Gated-door tailgating, Chunk D against the REAL lab_physical_pentest scenario file (not a
  # fixture). The honest-player rule (GATED_DOOR_SERVER_CHECK_PLAN.md §5): after Chunk C refuses a
  # client completion of tailgate_in and Chunk D removes the client credit writers, both lab routes
  # must still complete tailgate_in and open secure_area through the real endpoints:
  #   - the hi-vis tailgate (viaPass on the currentRoom sync), and
  #   - the cloned-card route (viaCredential on the rfid unlock).
  # Also the §10 soft-lock migration wired into the game show action, and that a stored lab game from
  # before this change still loads and can finish.
  class LabGatedDoorTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    def lab_mission
      Mission.find_by(name: 'lab_physical_pentest') ||
        Mission.create!(name: 'lab_physical_pentest', display_name: 'Physical pentest', published: true, difficulty_level: 1)
    end

    def lab_game(overrides = {})
      game = Game.create!(mission: lab_mission, player: break_escape_demo_users(:test_user)).reload
      game.player_state = game.player_state.merge(
        { 'currentRoom' => 'briefing_room', 'unlockedRooms' => ['briefing_room'] }.merge(overrides)
      )
      game.save!
      game
    end

    # The hi-vis vest as held in inventory: id and wearable shape match the lab's give_item vest, so
    # POST /wear sets the server-owned courier_ready. (The pickup itself is a separate, client-driven
    # step; an honest player who has the vest on is modelled by seeding it held and wearing it.)
    def vest_item
      { 'type' => 'aes_hivis_hook1', 'id' => 'kit_hivis_vest', 'name' => 'Hi-vis courier vest',
        'wearable' => { 'costume' => 'courier', 'global' => 'courier_ready' } }
    end

    def cloner_item
      { 'type' => 'rfid_cloner', 'id' => 'kit_rfid_cloner', 'name' => 'RFID cloner' }
    end

    def state(game)
      game.reload.player_state
    end

    # viaPass (hi-vis tailgate): wear the hi-vis, Len's route records the room, then the currentRoom
    # sync promotes and the server itself credits the finding and completes tailgate_in.
    test 'the hi-vis tailgate route completes tailgate_in and opens secure_area through the real endpoints' do
      game = lab_game('inventory' => [vest_item])

      post wear_game_url(game), params: { item_id: 'kit_hivis_vest', worn: true }, as: :json
      assert_response :success, response.body
      assert_equal true, state(game).dig('globalVariables', 'courier_ready'), 'the worn pass global is server-set'

      post unlock_game_url(game), params: { targetType: 'door', targetId: 'secure_area', attempt: 'len', method: 'npc' }, as: :json
      assert_response :success
      assert_includes Array(state(game)['npcRouteRooms']), 'secure_area', 'Len\'s route records the room, not unlocked'
      refute_includes Array(state(game)['unlockedRooms']), 'secure_area'

      put sync_state_game_url(game), params: { currentRoom: 'secure_area' }, as: :json
      assert_response :success
      st = state(game)
      assert_includes Array(st['unlockedRooms']), 'secure_area', 'the pass promotes the room'
      refute_includes Array(st['npcRouteRooms']), 'secure_area', 'and the two lists stay disjoint'
      assert_equal true, st.dig('globalVariables', 'kp_badge_tailgated'), 'the server set the tailgate finding'
      assert_equal 'completed', st.dig('objectivesState', 'tasks', 'tailgate_in', 'status'),
                   'the server completed the credited task'
    end

    # viaCredential (cloned card): a cloned cm_records_badge presented at the rfid door passes the
    # server possession check, opens secure_area and credits the clone finding.
    test 'the cloned-card route completes tailgate_in and opens secure_area through the real endpoints' do
      game = lab_game('inventory' => [cloner_item],
                      'serverClones' => { 'cm_records_badge' => { 'uidOnly' => false } })

      post unlock_game_url(game), params: { targetType: 'door', targetId: 'secure_area', method: 'rfid' }, as: :json
      assert_response :success
      st = state(game)
      assert_includes Array(st['unlockedRooms']), 'secure_area', 'the badge opens the door'
      assert_equal true, st.dig('globalVariables', 'kp_records_cloned'), 'the server set the clone finding'
      assert_equal 'completed', st.dig('objectivesState', 'tasks', 'tailgate_in', 'status')
    end

    # A cloned card whose id is not the door's requires is refused: no unlock, no credit.
    test 'a wrong cloned card does not open secure_area or credit the finding' do
      game = lab_game('inventory' => [cloner_item],
                      'serverClones' => { 'some_other_badge' => { 'uidOnly' => false } })

      post unlock_game_url(game), params: { targetType: 'door', targetId: 'secure_area', method: 'rfid' }, as: :json
      st = state(game)
      refute_includes Array(st['unlockedRooms']), 'secure_area'
      refute_equal true, st.dig('globalVariables', 'kp_records_cloned')
      refute_equal 'completed', st.dig('objectivesState', 'tasks', 'tailgate_in', 'status')
    end

    # §10 / plan test 9: a stored soft-locked lab game (secure_area unlocked by Len's route, no credit,
    # tailgate_in incomplete) is demoted on the game show action; a following GET room/secure_area does
    # not re-add it; and the stored game then loads and can finish the honest hi-vis route.
    test 'a stored soft-locked lab game is demoted on show and can still finish' do
      game = lab_game(
        'unlockedRooms' => %w[briefing_room secure_area],
        'globalVariables' => { 'courier_ready' => false, 'kp_badge_tailgated' => false, 'kp_records_cloned' => false },
        'inventory' => [vest_item]
      )

      # The show action runs the one-shot migration (redirect or render, the migration still ran).
      get "/break_escape/games/#{game.id}"
      st = state(game)
      refute_includes Array(st['unlockedRooms']), 'secure_area', 'show demoted the soft-locked room'
      assert_includes Array(st['npcRouteRooms']), 'secure_area'
      assert_equal true, st['routeRoomsMigrated']

      # The auto-unlock on room access must not re-add a route-room (§3.2).
      get "/break_escape/games/#{game.id}/room/secure_area", as: :json
      refute_includes Array(state(game)['unlockedRooms']), 'secure_area', 'GET room does not re-add the route room'

      # The stored game now finishes the honest hi-vis route.
      post wear_game_url(game), params: { item_id: 'kit_hivis_vest', worn: true }, as: :json
      assert_response :success
      post unlock_game_url(game), params: { targetType: 'door', targetId: 'secure_area', attempt: 'len', method: 'npc' }, as: :json
      assert_response :success
      put sync_state_game_url(game), params: { currentRoom: 'secure_area' }, as: :json
      assert_response :success

      st = state(game)
      assert_includes Array(st['unlockedRooms']), 'secure_area'
      assert_equal true, st.dig('globalVariables', 'kp_badge_tailgated')
      assert_equal 'completed', st.dig('objectivesState', 'tasks', 'tailgate_in', 'status')
    end

    # A stored game that already earned the pass is left unlocked on show (not demoted).
    test 'a stored earned lab game is left unlocked on show' do
      game = lab_game(
        'unlockedRooms' => %w[briefing_room secure_area],
        'globalVariables' => { 'kp_badge_tailgated' => true }
      )
      get "/break_escape/games/#{game.id}"
      st = state(game)
      assert_includes Array(st['unlockedRooms']), 'secure_area'
      refute_includes Array(st['npcRouteRooms']), 'secure_area'
    end
  end
end
