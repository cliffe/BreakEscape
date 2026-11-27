require 'test_helper'

module BreakEscape
  # Gated-door tailgating, Chunk A model helpers (GATED_DOOR_SERVER_CHECK_PLAN.md §3).
  # The split predicates (gated_route_room?, split_gated_door?), the npcRouteRooms list,
  # the object-action gate predicate, and the feedback-helper nil/false returns (§3.6).
  class GatedRouteRoomTest < ActiveSupport::TestCase
    def scenario
      {
        'startRoom' => 'lobby',
        'rooms' => {
          'lobby' => {
            'type' => 'room_office',
            'connections' => { 'north' => 'secure_area' },
            'doors' => [
              { 'connectedRoom' => 'secure_area', 'direction' => 'north', 'requires' => 'badge',
                'gate' => { 'openFor' => ['len'], 'openRadius' => 72, 'playerMayPassIf' => 'courier_ready' } }
            ],
            'objects' => [
              { 'type' => 'rfid_cloner', 'id' => 'cloner', 'name' => 'RFID cloner' }
            ],
            'npcs' => [
              { 'id' => 'len', 'npcType' => 'person',
                'eventMappings' => [{ 'eventPattern' => 'len_never_fires', 'unlockDoor' => 'secure_area' }] }
            ]
          },
          'secure_area' => {
            'type' => 'room_office', 'locked' => true, 'lockType' => 'rfid', 'requires' => 'badge',
            'objects' => [
              { 'type' => 'cabinet', 'id' => 'records_cabinet', 'name' => 'Records cabinet',
                'locked' => true, 'lockType' => 'key', 'requires' => 'cabinet_key',
                'contents' => [{ 'type' => 'notes', 'id' => 'records_file', 'name' => 'Records', 'takeable' => true }] },
              { 'type' => 'keypad_box', 'id' => 'pinbox', 'name' => 'PIN box',
                'locked' => true, 'lockType' => 'pin', 'requires' => '1234' },
              { 'type' => 'pw_box', 'id' => 'pwbox', 'name' => 'Password box',
                'locked' => true, 'lockType' => 'password', 'requires' => 'Secret1' }
            ]
          },
          'open_office' => {
            'type' => 'room_office',
            'objects' => [
              { 'type' => 'keypad_box', 'id' => 'open_pinbox', 'name' => 'Open PIN box',
                'locked' => true, 'lockType' => 'pin', 'requires' => '1234' }
            ]
          }
        }
      }
    end

    def build(player_state = {})
      create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby open_office] }.merge(player_state)
      )
    end

    test 'the npcRouteRooms list defaults to empty and records disjointly from unlockedRooms' do
      game = build
      assert_equal [], game.npc_route_rooms
      refute game.in_npc_route_room?('secure_area')

      game.record_npc_route_room!('secure_area')
      assert_includes game.reload.npc_route_rooms, 'secure_area'
      assert game.in_npc_route_room?('secure_area')
      refute_includes Array(game.player_state['unlockedRooms']), 'secure_area',
                      'recording a route room must not add it to unlockedRooms'
    end

    test 'gated_route_room? is NPC-keyed and only for a splitting gate' do
      game = build
      assert game.gated_route_room?('len', 'secure_area'), 'len opens the gate and the gate splits'
      refute game.gated_route_room?('bob', 'secure_area'), 'an npc not in openFor does not match'
      refute game.gated_route_room?('len', 'open_office'), 'a room with no gate never matches'
      refute game.gated_route_room?(nil, 'secure_area')
    end

    test 'split_gated_door? is door-keyed and attempt-independent' do
      game = build
      assert game.split_gated_door?('secure_area')
      refute game.split_gated_door?('open_office')
    end

    test 'the split predicate holds via an rfid_cloner in the scenario' do
      game = build
      assert game.scenario_has_rfid_cloner?
    end

    test 'server_owned_global_name? recognises a named server-owned global, not a plain one' do
      game = build
      assert game.server_owned_global_name?('se_captures')
      refute game.server_owned_global_name?('courier_ready'), 'no wearable here, so this is client-writable'
      refute game.server_owned_global_name?(nil)
    end

    test 'object_in_unpromoted_route_room? is true only while served-but-unearned' do
      game = build('npcRouteRooms' => ['secure_area'])
      assert game.object_in_unpromoted_route_room?('records_cabinet'), 'an object in the unpromoted route room'
      assert game.object_in_unpromoted_route_room?('records_file'), 'a nested object resolves to the route room'
      refute game.object_in_unpromoted_route_room?('open_pinbox'), 'an object in an ordinary room is never gated'
      refute game.object_in_unpromoted_route_room?('invented_id')

      # Once the room is in unlockedRooms (promoted), the gate is no longer in force.
      game.player_state['unlockedRooms'] << 'secure_area'
      game.save!
      refute game.object_in_unpromoted_route_room?('records_cabinet')
    end

    # §3.6 feedback helpers: nil/false for a route-room object, their real answer once promoted.
    test 'pin_cracker_feedback leaks no pips for a route-room object, returns them once promoted' do
      game = build('npcRouteRooms' => ['secure_area'],
                   'inventory' => [{ 'type' => 'pin-cracker', 'id' => 'pc1', 'name' => 'PIN cracker' }])
      assert_nil game.pin_cracker_feedback('object', 'pinbox', '0000'), 'no pips while the room is unpromoted'
      # An ordinary room's object is unaffected (test 13).
      refute_nil game.pin_cracker_feedback('object', 'open_pinbox', '0000'), 'an ordinary room still gives pips'

      game.player_state['unlockedRooms'] << 'secure_area'
      game.save!
      refute_nil game.pin_cracker_feedback('object', 'pinbox', '0000'), 'pips return after promotion'
    end

    test 'password_case_mismatch? leaks no case hint for a route-room object, returns it once promoted' do
      game = build('npcRouteRooms' => ['secure_area'])
      refute game.password_case_mismatch?('object', 'pwbox', 'secret1'), 'no case hint while unpromoted'

      game.player_state['unlockedRooms'] << 'secure_area'
      game.save!
      assert game.password_case_mismatch?('object', 'pwbox', 'secret1'), 'case hint returns after promotion'
    end

    test 'uid_only_refusal? returns false for a route-room object (no reason leak)' do
      game = build('npcRouteRooms' => ['secure_area'])
      # Whatever cards are claimed, the gate short-circuits uid_only_refusal? to false for a
      # route-room object, so no reason: uid_only leaks. (The identical guard covers all three
      # feedback helpers; the promoted-path discrimination for uid_only needs a UID-only clone
      # fixture, exercised end to end in Chunk E.)
      refute game.uid_only_refusal?('object', 'records_cabinet', ['BADGE-07'])
    end
  end
end
