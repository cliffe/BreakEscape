require 'test_helper'
require 'minitest/mock'

# Carrying choices between missions (docs/agents/CARRY_OVER_PLAN.md): the story
# snapshot a concluded game keeps, the imports a new game takes from it, and the
# read-only guard on the server.
module BreakEscape
  class CarryOverTest < ActiveSupport::TestCase
    SOURCE_AIM = {
      'aimId' => 'finish', 'title' => 'Finish', 'status' => 'active', 'missionConclusion' => true,
      'concludeRequires' => { 'tasksCompleted' => %w[submit_flag], 'globals' => %w[debrief_played] },
      'tasks' => [{ 'taskId' => 'submit_flag', 'title' => 'Flag', 'type' => 'submit_flags', 'status' => 'active' }]
    }.freeze

    setup do
      @player = break_escape_demo_users(:test_user)
      @other  = break_escape_demo_users(:other_user)
      @source = Mission.create!(name: 'm91_carry_source', display_name: 'Source', difficulty_level: 1)
      @reader = Mission.create!(name: 'm92_carry_reader', display_name: 'Reader', difficulty_level: 1)
    end

    def source_scenario
      {
        'startRoom' => 'lobby',
        'rooms' => { 'lobby' => { 'connections' => {}, 'objects' => [] } },
        'globalVariables' => { 'assets_seized' => false, 'team' => '', 'debrief_played' => false },
        'exportGlobals' => %w[assets_seized team],
        'objectives' => [SOURCE_AIM.deep_dup]
      }
    end

    def reader_scenario(extra_imports = [])
      {
        'startRoom' => 'lobby',
        'rooms' => { 'lobby' => { 'connections' => {}, 'objects' => [] } },
        'globalVariables' => { 'local_flag' => false },
        'importGlobals' => [
          { 'from' => 'm91_carry_source', 'var' => 'assets_seized', 'default' => false },
          { 'from' => 'm91_carry_source', 'var' => 'team', 'as' => 'src_team', 'default' => '' },
          { 'from' => 'm91_carry_source', 'completed' => 'm91_completed' }
        ] + extra_imports,
        'objectives' => [{ 'aimId' => 'a', 'title' => 'A', 'status' => 'active',
                           'tasks' => [{ 'taskId' => 't', 'title' => 'T', 'type' => 'manual', 'status' => 'active',
                                         'onComplete' => { 'setGlobal' => { 'm91_assets_seized' => false, 'local_flag' => true } } }] }]
      }
    end

    def source_game(player: @player, globals: {}, tasks: { 'submit_flag' => 'completed' })
      Game.create!(mission: @source, player: player, scenario_data: source_scenario,
                   player_state: { 'globalVariables' => { 'assets_seized' => false, 'team' => '', 'debrief_played' => false }.merge(globals),
                                   'objectivesState' => { 'tasks' => tasks.transform_values { |s| { 'status' => s } }, 'aims' => {} } })
    end

    def finish(game, globals)
      game.player_state['globalVariables'].merge!(globals)
      game.player_state['globalVariables']['debrief_played'] = true
      game.save!
      game.conclude_mission!
      game.reload
    end

    def reader_game(player: @player, state: {})
      Game.create!(mission: @reader, player: player, scenario_data: reader_scenario, player_state: state)
    end

    # --------------------------------------------------------------- snapshot

    test 'concluding writes a snapshot of the globals' do
      game = finish(source_game, 'assets_seized' => true, 'team' => 'fracture')
      snap = game.player_state[CarryOver::SNAPSHOT_KEY]
      assert_equal true, snap['globals']['assets_seized']
      assert_equal 'fracture', snap['globals']['team']
      assert snap['at'].present?
    end

    test 'a later /conclude of a concluded game refreshes the snapshot, even with the flag tasks wiped, and changes nothing else' do
      game = finish(source_game, 'assets_seized' => true)
      concluded_at = game.mission_concluded_at
      completed_at = game.completed_at
      score = game.score

      game.player_state['objectivesState'] = { 'tasks' => {}, 'aims' => {} } # as a Restart leaves it
      game.player_state['globalVariables']['assets_seized'] = false
      game.save!
      result = game.conclude_mission!
      game.reload

      assert_equal({ concluded: true, already: true, missing: [] }, result)
      assert_equal false, game.player_state[CarryOver::SNAPSHOT_KEY]['globals']['assets_seized']
      assert_equal concluded_at.to_i, game.mission_concluded_at.to_i
      assert_equal completed_at.to_i, game.completed_at.to_i
      assert_equal score, game.score
    end

    test 'the refresh is skipped when the story globals the ending needs are not set, and the credits still roll' do
      game = finish(source_game, 'assets_seized' => true)
      game.player_state['globalVariables'] = { 'assets_seized' => false, 'debrief_played' => false }
      game.save!

      result = game.conclude_mission!
      assert_equal true, result[:already]
      assert_equal true, game.reload.player_state[CarryOver::SNAPSHOT_KEY]['globals']['assets_seized']
    end

    test 'the refresh fires no completion hook' do
      game = finish(source_game, 'assets_seized' => true)
      calls = 0
      original = BreakEscape.configuration.on_game_complete
      BreakEscape.configuration.on_game_complete = ->(_g) { calls += 1 }
      game.conclude_mission!
      assert_equal 0, calls
    ensure
      BreakEscape.configuration.on_game_complete = original
    end

    test 'Restart keeps the snapshot' do
      game = finish(source_game, 'assets_seized' => true)
      game.reset_player_state!
      game.reload
      assert_equal false, game.player_state['globalVariables'].fetch('assets_seized', false)
      assert_equal true, game.player_state[CarryOver::SNAPSHOT_KEY]['globals']['assets_seized']
    end

    test 'Restart of a concluded game with no snapshot writes one first' do
      game = source_game(globals: { 'assets_seized' => true })
      game.update!(status: 'completed', mission_concluded_at: Time.current)
      refute game.player_state.key?(CarryOver::SNAPSHOT_KEY)

      game.reset_player_state!
      assert_equal true, game.reload.player_state[CarryOver::SNAPSHOT_KEY]['globals']['assets_seized']
    end

    test 'the aim-task conclusion path writes a snapshot too' do
      game = source_game(globals: { 'assets_seized' => true, 'debrief_played' => true })
      game.send(:check_mission_conclusion, game.scenario_data['objectives'].first)
      assert_equal true, game.player_state[CarryOver::SNAPSHOT_KEY]['globals']['assets_seized']
    end

    # ---------------------------------------------------------------- imports

    test 'a reader with no source run gets the defaults' do
      game = reader_game
      assert_equal false, game.scenario_data['globalVariables']['m91_assets_seized']
      assert_equal '', game.scenario_data['globalVariables']['src_team']
      assert_equal false, game.scenario_data['globalVariables']['m91_completed']
      assert_equal false, game.scenario_data['importedGlobals']['m91_assets_seized']['found']
      assert_equal %w[m91_assets_seized src_team m91_completed], game.player_state[CarryOver::IMPORTED_NAMES_KEY]
    end

    test 'a reader takes the finished run, into scenario defaults and saved globals' do
      src = finish(source_game, 'assets_seized' => true, 'team' => 'meltdown')
      game = reader_game
      assert_equal true, game.scenario_data['globalVariables']['m91_assets_seized']
      assert_equal 'meltdown', game.scenario_data['globalVariables']['src_team']
      assert_equal true, game.scenario_data['globalVariables']['m91_completed']
      assert_equal true, game.player_state['globalVariables']['m91_assets_seized']
      assert_equal src.id, game.scenario_data['importedGlobals']['m91_assets_seized']['sourceGameId']
      assert_equal 'm91_carry_source', game.scenario_data['importedGlobals']['src_team']['from']
    end

    test 'the newest snapshot wins, judged by the snapshot time' do
      older = finish(source_game, 'assets_seized' => true)
      finish(source_game, 'assets_seized' => false)
      # A replay of the older game reaches the credits again, later than both.
      older.player_state['globalVariables']['team'] = 'trojan_horse'
      older.save!
      older.conclude_mission!

      game = reader_game
      assert_equal 'trojan_horse', game.scenario_data['globalVariables']['src_team']
      assert_equal older.id, game.scenario_data['importedGlobals']['src_team']['sourceGameId']
    end

    test 'in-progress, abandoned and Finish-button games never count' do
      source_game(globals: { 'assets_seized' => true })
      source_game(globals: { 'assets_seized' => true }).update!(status: 'abandoned')
      source_game(globals: { 'assets_seized' => true }).update!(status: 'completed') # Hacktivity Finish
      game = reader_game
      assert_equal false, game.scenario_data['globalVariables']['m91_assets_seized']
      assert_equal false, game.scenario_data['globalVariables']['m91_completed']
    end

    test 'another player\'s run does not count' do
      finish(source_game(player: @other), 'assets_seized' => true)
      assert_equal false, reader_game.scenario_data['globalVariables']['m91_assets_seized']
    end

    test 'a concluded game from before snapshots is read from its globals, minus its own imports, and is not written to' do
      old = source_game(globals: { 'assets_seized' => true, 'team' => 'fracture' })
      old.player_state['globalVariables']['m90_leak'] = true
      old.player_state[CarryOver::IMPORTED_NAMES_KEY] = ['m90_leak']
      old.save!
      old.update!(status: 'completed', mission_concluded_at: 1.day.ago)
      before = old.reload.updated_at

      game = reader_game
      assert_equal true, game.scenario_data['globalVariables']['m91_assets_seized']
      assert_equal 'fracture', game.scenario_data['globalVariables']['src_team']
      refute old.reload.player_state.key?(CarryOver::SNAPSHOT_KEY)
      assert_equal before, old.updated_at
    end

    test 'imported names are left out of a snapshot' do
      finish(source_game, 'assets_seized' => true)
      reader = reader_game
      reader.player_state['globalVariables']['local_flag'] = true
      reader.write_story_snapshot
      refute reader.player_state[CarryOver::SNAPSHOT_KEY]['globals'].key?('m91_assets_seized')
      assert reader.player_state[CarryOver::SNAPSHOT_KEY]['globals'].key?('local_flag')
    end

    test 'a snapshot value of the wrong type falls back to the default' do
      finish(source_game, 'assets_seized' => 'yes', 'team' => 7)
      game = reader_game
      assert_equal false, game.scenario_data['globalVariables']['m91_assets_seized']
      assert_equal '', game.scenario_data['globalVariables']['src_team']
      assert_equal false, game.scenario_data['importedGlobals']['src_team']['found']
      assert_equal true, game.scenario_data['globalVariables']['m91_completed'], 'the run itself still counts'
    end

    test 'a source mission that does not exist gives the defaults' do
      game = Game.create!(mission: @reader, player: @player,
                          scenario_data: reader_scenario([{ 'from' => 'm93_missing', 'var' => 'x', 'default' => 0 }]))
      assert_equal 0, game.scenario_data['globalVariables']['m93_x']
      assert_equal false, game.scenario_data['importedGlobals']['m93_x']['found']
    end

    test 'a failing lookup leaves the game created, with defaults' do
      finish(source_game, 'assets_seized' => true)
      # A real SQL error inside the lookup's savepoint (an unknown column), so the
      # test proves the outer creation transaction survives it.
      broken = Mission.where('no_such_column = 1')
      Mission.stub(:where, ->(*) { broken }) do
        game = reader_game
        assert game.persisted?
        assert_equal false, game.scenario_data['globalVariables']['m91_assets_seized']
      end
    end

    test 'importOverrides replaces the lookup and is removed' do
      finish(source_game, 'assets_seized' => true)
      none = reader_game(state: { CarryOver::OVERRIDES_KEY => {} })
      assert_equal false, none.scenario_data['globalVariables']['m91_assets_seized']
      assert_equal false, none.scenario_data['globalVariables']['m91_completed']
      refute none.player_state.key?(CarryOver::OVERRIDES_KEY)

      chosen = reader_game(state: { CarryOver::OVERRIDES_KEY => { 'm91_completed' => true, 'src_team' => 'meltdown' } })
      assert_equal 'meltdown', chosen.scenario_data['globalVariables']['src_team']
      assert_equal true, chosen.scenario_data['globalVariables']['m91_completed']
      assert_equal false, chosen.scenario_data['globalVariables']['m91_assets_seized']
    end

    # -------------------------------------------- Restart, New Session, guard

    test 'Restart of the reader keeps its imports; a new game looks them up again' do
      finish(source_game, 'assets_seized' => true)
      game = reader_game
      finish(source_game, 'assets_seized' => false)

      game.reset_player_state!
      game.reload
      assert_equal true, game.scenario_data['globalVariables']['m91_assets_seized']
      assert_equal true, game.player_state['globalVariables']['m91_assets_seized']
      assert_includes game.player_state[CarryOver::IMPORTED_NAMES_KEY], 'm91_assets_seized'

      assert_equal false, reader_game.scenario_data['globalVariables']['m91_assets_seized']
    end

    test 'merge_global_variables! ignores imported names, deletes included' do
      finish(source_game, 'assets_seized' => true)
      game = reader_game
      game.merge_global_variables!('m91_assets_seized' => false, 'src_team' => nil, 'local_flag' => true)
      assert_equal true, game.player_state['globalVariables']['m91_assets_seized']
      assert game.player_state['globalVariables'].key?('src_team')
      assert_equal true, game.player_state['globalVariables']['local_flag']
    end

    test 'a sync loaded with only the sync columns skips imported names without raising' do
      finish(source_game, 'assets_seized' => true)
      game = reader_game
      narrow = Game.select(:id, :player_type, :player_id, :player_state, :updated_at).find(game.id)
      narrow.merge_global_variables!('m91_assets_seized' => false)
      narrow.save!(validate: false) # as sync_state saves
      assert_equal true, game.reload.player_state['globalVariables']['m91_assets_seized']
    end

    test 'a task onComplete.setGlobal does not write an imported name' do
      finish(source_game, 'assets_seized' => true)
      game = reader_game
      game.send(:apply_task_set_globals!, game.scenario_data['objectives'].first['tasks'].first)
      assert_equal true, game.player_state['globalVariables']['m91_assets_seized']
      assert_equal true, game.player_state['globalVariables']['local_flag']
    end

    test 'a scenario with no importGlobals is untouched' do
      game = source_game
      refute game.scenario_data.key?('importedGlobals')
      refute game.player_state.key?(CarryOver::IMPORTED_NAMES_KEY)
    end
  end
end
