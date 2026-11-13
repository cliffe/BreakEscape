require 'test_helper'

module BreakEscape
  # Gated-door tailgating, Chunk D soft-lock migration (GATED_DOOR_SERVER_CHECK_PLAN.md §10, plan
  # test 9). Exercised against the REAL lab_physical_pentest scenario (not a fixture): a stored game
  # whose split gated room (secure_area) was unlocked by Len's route before the player earned the
  # pass, and whose client credit writers are now gone, must be demoted back into npcRouteRooms so the
  # earn check can re-run. A game that already earned the pass is left in unlockedRooms.
  class LabGatedMigrationTest < ActiveSupport::TestCase
    def lab_mission
      Mission.find_by(name: 'lab_physical_pentest') ||
        Mission.create!(name: 'lab_physical_pentest', display_name: 'Physical pentest', published: true, difficulty_level: 1)
    end

    # A real lab game with the given player_state overrides merged onto the generated default.
    def lab_game(overrides = {})
      game = Game.create!(mission: lab_mission, player: break_escape_demo_users(:test_user)).reload
      game.player_state = game.player_state.merge(overrides)
      game.save!
      game
    end

    test 'the real lab gate declares creditOnPass and a server-owned pass global' do
      game = lab_game
      gate = game.gate_for_connected_room('secure_area')
      assert gate.is_a?(Hash), 'secure_area has a gated door'
      assert gate['creditOnPass'].is_a?(Hash), 'the gate carries creditOnPass'
      assert_equal 'courier_ready', gate['playerMayPassIf']
      assert game.server_owned_global_name?('courier_ready'), 'the pass global is server-owned (worn costume)'
      assert_includes game.server_credit_global_names, 'kp_badge_tailgated'
      assert_includes game.server_credit_global_names, 'kp_records_cloned'
      assert_includes game.server_completed_only_task_ids, 'tailgate_in'
      assert_includes game.split_gated_room_ids, 'secure_area'
    end

    test 'a soft-locked route room is demoted back into npcRouteRooms (plan test 9)' do
      game = lab_game(
        'unlockedRooms' => %w[briefing_room secure_area],
        'globalVariables' => { 'courier_ready' => false, 'kp_badge_tailgated' => false, 'kp_records_cloned' => false }
      )
      game.migrate_soft_locked_route_rooms!
      st = game.reload.player_state

      refute_includes Array(st['unlockedRooms']), 'secure_area', 'the soft-locked room leaves unlockedRooms'
      assert_includes Array(st['npcRouteRooms']), 'secure_area', 'and returns to npcRouteRooms'
      assert_equal true, st['routeRoomsMigrated'], 'the one-shot flag is set'
    end

    test 'a room whose pass is already earned is left in unlockedRooms untouched (plan test 9)' do
      game = lab_game(
        'unlockedRooms' => %w[briefing_room secure_area],
        'globalVariables' => { 'kp_badge_tailgated' => true }
      )
      game.migrate_soft_locked_route_rooms!
      st = game.reload.player_state

      assert_includes Array(st['unlockedRooms']), 'secure_area', 'an earned room stays unlocked'
      refute_includes Array(st['npcRouteRooms']), 'secure_area', 'and is not demoted'
    end

    test 'a room whose credited task is already complete is left untouched' do
      game = lab_game('unlockedRooms' => %w[briefing_room secure_area])
      game.player_state['objectivesState'] ||= {}
      game.player_state['objectivesState']['tasks'] ||= {}
      game.player_state['objectivesState']['tasks']['tailgate_in'] = { 'status' => 'completed' }
      game.save!

      game.migrate_soft_locked_route_rooms!
      st = game.reload.player_state
      assert_includes Array(st['unlockedRooms']), 'secure_area'
      refute_includes Array(st['npcRouteRooms']), 'secure_area'
    end

    test 'the migration runs once: a re-soft-locked room is not demoted a second time' do
      game = lab_game('unlockedRooms' => %w[briefing_room secure_area])
      game.migrate_soft_locked_route_rooms!
      assert_includes Array(game.reload.player_state['npcRouteRooms']), 'secure_area'

      # Model an operator re-unlocking the room, then a later load: the guard stops a second demotion.
      game.player_state['unlockedRooms'] = %w[briefing_room secure_area]
      game.player_state['npcRouteRooms'] = []
      game.save!
      game.migrate_soft_locked_route_rooms!
      st = game.reload.player_state
      assert_includes Array(st['unlockedRooms']), 'secure_area', 'the once-only guard stops a repeat demotion'
      refute_includes Array(st['npcRouteRooms']), 'secure_area'
    end

    test 'a game with no split room unlocked does nothing and stays lock-free' do
      game = lab_game('unlockedRooms' => %w[briefing_room])
      refute game.any_soft_locked_route_room?, 'nothing is stuck, so show pays no lock'
      game.migrate_soft_locked_route_rooms!
      st = game.reload.player_state
      refute_includes Array(st['unlockedRooms']), 'secure_area'
      assert_empty Array(st['npcRouteRooms'])
    end
  end
end
