require 'test_helper'

module BreakEscape
  # Gated-door tailgating, Chunk B credit model (GATED_DOOR_SERVER_CHECK_PLAN.md §3.3, §3.4).
  # The serverCreditGlobals derivation and read-only union, and the viaPass credit's
  # scenario_data-only load on the narrow sync row (plan test 2's save-column guarantee).
  class GatedDoorCreditTest < ActiveSupport::TestCase
    # The narrow column set sync_state loads (no scenario_data), mirrored from the controller so
    # the model test exercises the same missing-attribute condition the viaPass credit must survive.
    SYNC_COLUMNS = %i[id player_type player_id player_state updated_at].freeze

    def scenario
      {
        'startRoom' => 'lobby',
        'globalVariables' => { 'courier_ready' => false, 'kp_badge_tailgated' => false, 'kp_records_cloned' => false },
        'disguises' => { 'hivis' => { 'sprite' => 'courier_hivis' } },
        'objectives' => [
          { 'aimId' => 'a1', 'title' => 'Get in',
            'tasks' => [{ 'taskId' => 'tailgate_in', 'title' => 'Get past the records door', 'type' => 'manual', 'status' => 'active' }] }
        ],
        'rooms' => {
          'lobby' => {
            'type' => 'room_office',
            'connections' => { 'north' => 'secure_area' },
            'doors' => [
              { 'connectedRoom' => 'secure_area', 'direction' => 'north', 'requires' => 'badge',
                'gate' => { 'openFor' => ['len'], 'openRadius' => 72, 'playerMayPassIf' => 'courier_ready',
                            'creditOnPass' => {
                              'viaPass' => { 'setGlobal' => { 'kp_badge_tailgated' => true }, 'completeTask' => 'tailgate_in' },
                              'viaCredential' => { 'setGlobal' => { 'kp_records_cloned' => true }, 'completeTask' => 'tailgate_in' }
                            } } }
            ],
            'objects' => [
              { 'type' => 'rfid_cloner', 'id' => 'cloner', 'name' => 'RFID cloner' },
              { 'type' => 'hivis', 'id' => 'vest', 'name' => 'Hi-vis', 'takeable' => true,
                'wearable' => { 'costume' => 'hivis', 'global' => 'courier_ready' } }
            ],
            'npcs' => [{ 'id' => 'len', 'npcType' => 'person',
                         'eventMappings' => [{ 'eventPattern' => 'len_never_fires', 'unlockDoor' => 'secure_area' }] }]
          },
          'secure_area' => {
            'type' => 'room_office', 'locked' => true, 'lockType' => 'rfid', 'requires' => 'badge',
            'objects' => [{ 'type' => 'notes', 'id' => 'deeds', 'name' => 'Deeds', 'readable' => true }]
          }
        }
      }
    end

    def build(player_state = {})
      create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'] }.merge(player_state)
      )
    end

    test 'serverCreditGlobals derives the distinct creditOnPass setGlobal names' do
      game = build
      assert_equal %w[kp_badge_tailgated kp_records_cloned], game.server_credit_global_names
      assert game.server_owned_global_name?('kp_badge_tailgated'), 'a credit global is server-owned'
      assert game.server_owned_global_name?('courier_ready'), 'the worn pass global is server-owned'
    end

    test 'a client sync write to a credit global is dropped' do
      game = build
      game.merge_global_variables!('kp_badge_tailgated' => true)
      refute game.player_state.dig('globalVariables', 'kp_badge_tailgated'),
             'the credit global is read-only to sync_state'
    end

    # Plan test 2's save guarantee: the viaPass credit runs the whole complete_task! tree on the
    # narrow sync row (no scenario_data column) via the scenario_data-only load, and the follow-up
    # save! must not rewrite the large scenario_data column (dirty state cleared after the load).
    test 'viaPass credit on the narrow sync row credits without rewriting scenario_data' do
      game = build('npcRouteRooms' => ['secure_area'],
                   'wearableGlobals' => ['courier_ready'],
                   'globalVariables' => { 'courier_ready' => true, 'kp_badge_tailgated' => false })

      narrow = Game.select(*SYNC_COLUMNS).find(game.id)
      refute narrow.has_attribute?(:scenario_data), 'the narrow row has no scenario_data column'

      assert narrow.credit_via_pass_on_sync!('secure_area'), 'the pass is credited'
      narrow.save!
      refute_includes narrow.saved_changes.keys, 'scenario_data',
                      'the crediting save must not rewrite the scenario_data column'

      state = game.reload.player_state
      assert_equal true, state.dig('globalVariables', 'kp_badge_tailgated'), 'the credit global is set'
      assert_includes Array(state['unlockedRooms']), 'secure_area', 'the room is promoted'
      refute_includes Array(state['npcRouteRooms']), 'secure_area', 'the room leaves npcRouteRooms'
      assert_equal 'completed', state.dig('objectivesState', 'tasks', 'tailgate_in', 'status')
    end

    test 'the honest no-vest slip-in is not credited and stays a route room' do
      game = build('npcRouteRooms' => ['secure_area'],
                   'wearableGlobals' => ['courier_ready'],
                   'globalVariables' => { 'courier_ready' => false })
      narrow = Game.select(*SYNC_COLUMNS).find(game.id)
      refute narrow.credit_via_pass_on_sync!('secure_area'), 'no pass without the worn global'

      state = game.reload.player_state
      refute_includes Array(state['unlockedRooms']), 'secure_area'
      refute state.dig('globalVariables', 'kp_badge_tailgated')
    end
  end
end
