require 'test_helper'

module BreakEscape
  # Widened currentRoom guard (GATED_DOOR_SERVER_CHECK, Game#may_sync_current_room?).
  # The first time the real client syncs currentRoom, the server decides whether to accept it.
  # It accepts only rooms it can vouch for from its own data: a room in player_state
  # unlockedRooms or npcRouteRooms (both server-written), the scenario's startRoom, or the
  # scenario's awareness-episode world room (both read from scenario_data). It never trusts the
  # client's room string on its own. These tests pin the refusals: a room the server cannot
  # account for from this game's data is refused with 403 and the saved currentRoom is left
  # unchanged, so a forged sync cannot move the player into gated space.
  class CurrentRoomGuardRefusalTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    def scenario
      {
        'startRoom' => 'lobby',
        'rooms' => {
          'lobby' => {
            'type' => 'room_office',
            'connections' => { 'north' => 'secure_area' },
            'objects' => [], 'npcs' => []
          },
          # A real room of THIS scenario, but locked and not on any NPC route.
          'secure_area' => {
            'type' => 'room_office', 'locked' => true, 'lockType' => 'rfid', 'requires' => 'badge',
            'objects' => [], 'npcs' => []
          }
        }
      }
    end

    def build
      create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby] }
      )
    end

    def assert_refused_and_unchanged(game, room)
      put sync_state_game_url(game), params: { currentRoom: room }, as: :json
      assert_response :forbidden
      assert_equal 'lobby', game.reload.player_state['currentRoom'],
                   "a refused currentRoom sync must leave the saved room unchanged (#{room})"
    end

    # 1. A room id that exists nowhere: not in this scenario, not any real room.
    test 'a forged room id that exists nowhere is refused and leaves currentRoom unchanged' do
      assert_refused_and_unchanged(build, '__forged_nowhere__')
    end

    # 2. A real room of THIS scenario, but locked and not reached (not unlocked, not a route room).
    test 'a real but locked room of this scenario is refused and leaves currentRoom unchanged' do
      assert_refused_and_unchanged(build, 'secure_area')
    end

    # 3. A room id that is real in ANOTHER scenario but absent from this game's scenario_data.
    # The guard reads only this game's own data, so a valid-elsewhere id is refused all the same.
    test 'a room id that only exists in another scenario is refused and leaves currentRoom unchanged' do
      # 'main_office_area' is a real m01_first_contact room; it does not exist in this game.
      refute scenario['rooms'].key?('main_office_area'), 'precondition: not a room of this scenario'
      assert_refused_and_unchanged(build, 'main_office_area')
    end

    # Sanity: the guard still accepts the rooms it can vouch for, so the refusals above are not
    # a blanket block. The start room and an unlocked room are both accepted.
    test 'the start room and an unlocked room are still accepted' do
      game = build
      put sync_state_game_url(game), params: { currentRoom: 'lobby' }, as: :json
      assert_response :success
      assert_equal 'lobby', game.reload.player_state['currentRoom']
    end
  end
end
