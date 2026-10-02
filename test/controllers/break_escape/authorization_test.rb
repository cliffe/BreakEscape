require 'test_helper'
require 'minitest/mock'

# Authorization integration tests: verify that one player cannot read or
# mutate another player's game data.
#
# In standalone mode `current_player` is always DemoUser.first, which is the
# :test_user fixture.  We therefore create "other_user" games and attempt to
# access them from the perspective of test_user, expecting Pundit to deny
# access and redirect (via ApplicationController#user_not_authorized).
module BreakEscape
  class AuthorizationTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    PLAYER_STATE = {
      'currentRoom' => 'lobby',
      'unlockedRooms' => ['lobby'],
      'unlockedObjects' => [],
      'inventory' => [],
      'encounteredNPCs' => [],
      'globalVariables' => {},
      'biometricSamples' => [],
      'biometricUnlocks' => [],
      'bluetoothDevices' => [],
      'notes' => [],
      'health' => 100
    }.freeze

    setup do
      @mission     = break_escape_missions(:ceo_exfil)
      @owner       = break_escape_demo_users(:test_user) # == current_player in standalone
      @other_user  = break_escape_demo_users(:other_user)

      PlayerPreference.find_or_create_by!(player: @owner) do |pref|
        pref.selected_sprite = 'female_spy'
        pref.in_game_name    = 'TestAgent'
      end

      # Game owned by the current player (happy-path sanity check)
      @own_game = Game.create!(
        mission: @mission,
        player: @owner,
        scenario_data: own_scenario_data,
        player_state: PLAYER_STATE.dup
      )

      # Game owned by someone else — the target of all cross-user attempts
      @other_game = Game.create!(
        mission: @mission,
        player: @other_user,
        scenario_data: own_scenario_data,
        player_state: PLAYER_STATE.dup
      )
    end

    # =========================================================================
    # GET /games/:id  (show)
    # =========================================================================

    test 'owner can view their own game' do
      get game_url(@own_game)
      assert_response :success
    end

    test "cannot view another user's game" do
      get game_url(@other_game)
      assert_response :redirect,
                      "Accessing another user's game should redirect (Pundit NotAuthorizedError)"
    end

    # =========================================================================
    # GET /games/:id/scenario
    # =========================================================================

    test 'owner can fetch their own scenario' do
      get scenario_game_url(@own_game)
      assert_response :success
    end

    test "cannot fetch another user's scenario" do
      get scenario_game_url(@other_game)
      assert_response :redirect
    end

    # =========================================================================
    # GET /games/:id/room/:room_id
    # =========================================================================

    test 'owner can fetch their own room data' do
      get room_game_url(@own_game, room_id: 'lobby')
      assert_response :success
    end

    test "cannot fetch another user's room data" do
      get room_game_url(@other_game, room_id: 'lobby')
      assert_response :redirect
    end

    # =========================================================================
    # PUT /games/:id/sync_state
    # =========================================================================

    test 'owner can sync their own game state' do
      put sync_state_game_url(@own_game), params: { currentRoom: 'lobby' }
      assert_response :success
    end

    test "cannot sync another user's game state" do
      put sync_state_game_url(@other_game), params: { currentRoom: 'lobby' }
      assert_response :redirect,
                      "Syncing another user's game state should be denied"
      # State must not have been mutated
      @other_game.reload
      assert_equal 'lobby', @other_game.player_state['currentRoom']
    end

    # =========================================================================
    # POST /games/:id/unlock
    # =========================================================================

    test 'owner can attempt unlock on their own game' do
      post unlock_game_url(@own_game), params: {
        targetType: 'door',
        targetId: 'locked_office',
        attempt: '1234',
        method: 'pin'
      }
      # Correct PIN → success; wrong PIN → 422 — both prove the request was processed
      assert_includes [200, 422], response.status
    end

    test "cannot attempt unlock on another user's game" do
      post unlock_game_url(@other_game), params: {
        targetType: 'door',
        targetId: 'locked_office',
        attempt: '1234',
        method: 'pin'
      }
      assert_response :redirect,
                      "Unlock attempt on another user's game should be denied"

      # Room must remain locked in other_user's game
      @other_game.reload
      assert_not_includes @other_game.player_state['unlockedRooms'], 'locked_office',
                          "Another user's room must not be unlocked by a cross-user request"
    end

    # =========================================================================
    # POST /games/:id/inventory
    # =========================================================================

    test 'owner can update their own inventory' do
      post inventory_game_url(@own_game), params: {
        action_type: 'add',
        item: { type: 'intercom', name: 'Intercom', id: 'intercom_1' }
      }
      # Any non-redirect means Pundit allowed the request through
      assert_not_equal 302, response.status,
                       "Owner's inventory request should reach the controller, not be redirected"
    end

    test "cannot update another user's inventory" do
      post inventory_game_url(@other_game), params: {
        action_type: 'add',
        item: { type: 'key', name: 'Master Key', id: 'key_1' }
      }
      assert_response :redirect,
                      "Inventory update on another user's game should be denied"

      @other_game.reload
      assert_empty @other_game.player_state['inventory'],
                   "Another user's inventory must not be modified"
    end

    # =========================================================================
    # GET /games/:id/ink
    # =========================================================================

    test "cannot fetch ink script for another user's game" do
      get ink_game_url(@other_game), params: { npc: 'some_npc' }
      assert_response :redirect
    end

    # =========================================================================
    # POST /games/:id/tts
    # =========================================================================

    test 'owner can request TTS for their own game (error expected, not redirect)' do
      # We just verify the request is *processed* (any non-redirect response)
      post tts_game_url(@own_game), params: { npc_id: 'intercom_1', text: 'Hello' }
      # 400/404/503 are all acceptable — what matters is it was not denied with a redirect
      assert_not_equal 302, response.status,
                       "Owner's TTS request should be processed, not redirected"
    end

    test "cannot request TTS for another user's game" do
      post tts_game_url(@other_game), params: {
        npc_id: 'intercom_1',
        text: 'Welcome to the security system. Please verify your identity.'
      }
      assert_response :redirect,
                      "TTS request for another user's game should be denied"
    end

    # =========================================================================
    # GET /games/:id/objectives
    # =========================================================================

    test 'owner can view their own objectives' do
      get objectives_game_url(@own_game)
      assert_response :success
    end

    test "cannot view another user's objectives" do
      get objectives_game_url(@other_game)
      assert_response :redirect
    end

    # =========================================================================
    # POST /games/:id/update_room
    # =========================================================================

    test "cannot update_room on another user's game" do
      post update_room_game_url(@other_game), params: { room_id: 'lobby', objects: [] }
      assert_response :redirect
    end

    # =========================================================================
    # Cross-user attempt cannot elevate game state
    # =========================================================================

    test "repeated cross-user sync attempts leave other user's game untouched" do
      original_state = @other_game.player_state.dup

      3.times do
        put sync_state_game_url(@other_game), params: {
          currentRoom: 'hacked_room',
          globalVariables: { 'flag_captured' => true }
        }
        assert_response :redirect
      end

      @other_game.reload
      assert_equal original_state['currentRoom'],     @other_game.player_state['currentRoom']
      assert_equal original_state['globalVariables'], @other_game.player_state['globalVariables']
    end

    private

    def own_scenario_data
      {
        'startRoom' => 'lobby',
        'rooms' => {
          'lobby' => {
            'locked' => false,
            'connections' => { 'north' => 'locked_office' },
            'objects' => [
              {
                'id' => 'intercom_1',
                'type' => 'intercom',
                'voice' => 'Welcome to the security system. Please verify your identity.',
                'ttsVoice' => { 'name' => 'Aoede', 'style' => nil, 'language' => nil }
              }
            ],
            'npcs' => []
          },
          'locked_office' => {
            'locked' => true,
            'lockType' => 'pin',
            'requires' => '1234',
            'connections' => { 'south' => 'lobby' },
            'objects' => []
          }
        }
      }
    end
  end
end
