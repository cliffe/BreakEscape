require 'test_helper'

module BreakEscape
  # Widened currentRoom guard (GATED_DOOR_SERVER_CHECK, Game#may_sync_current_room?).
  # The first time the real client syncs currentRoom, the server decides whether to accept it.
  # It accepts only rooms it can vouch for from its own data: a room in player_state
  # unlockedRooms or npcRouteRooms (both server-written), the scenario's startRoom, or the
  # scenario's awareness-episode world room (both read from scenario_data). It never trusts the
  # client's room string on its own. These tests pin the refusals: a room the server cannot
  # account for from this game's data is not saved (R4 MINOR 1: the request still succeeds, the
  # room is reported in notSaved, and the rest of the batch commits), so a forged sync cannot move
  # the player into gated space while an honest edge case does not lose its other state or loop.
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

    # R4 MINOR 1 contract: a refused currentRoom is skipped, not rolled back. The request
    # succeeds, names currentRoom in notSaved, leaves the saved room unchanged, and still commits
    # the rest of the batch (here a globalVariables change sent in the same request).
    def assert_refused_and_unchanged(game, room)
      put sync_state_game_url(game),
          params: { currentRoom: room, globalVariables: { 'batch_marker' => 1 } }, as: :json
      assert_response :success
      assert_includes Array(response.parsed_body['notSaved']), 'currentRoom',
                      "a refused currentRoom must be reported in notSaved (#{room})"
      state = game.reload.player_state
      assert_equal 'lobby', state['currentRoom'],
                   "a refused currentRoom sync must leave the saved room unchanged (#{room})"
      assert_equal 1, state.dig('globalVariables', 'batch_marker'),
                   "the rest of the batch must still commit when currentRoom is refused (#{room})"
    end

    # The refusal must not loop: once the client would confirm the refused room, a repeat sync of
    # the same room sends nothing new for the server to reject again, and the room is still unsaved.
    test 'a repeated refused room does not advance the saved room (no forever re-send)' do
      game = build
      2.times do
        put sync_state_game_url(game), params: { currentRoom: '__forged_nowhere__' }, as: :json
        assert_response :success
        assert_includes Array(response.parsed_body['notSaved']), 'currentRoom'
      end
      assert_equal 'lobby', game.reload.player_state['currentRoom']
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
