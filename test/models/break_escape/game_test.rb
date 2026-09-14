require 'test_helper'

module BreakEscape
  class GameTest < ActiveSupport::TestCase
    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @player = break_escape_demo_users(:test_user)
      @game = Game.create!(
        mission: @mission,
        player: @player,
        scenario_data: { "startRoom" => "reception", "rooms" => {} },
        player_state: {
          "currentRoom" => "reception",
          "unlockedRooms" => ["reception"],
          "unlockedObjects" => [],
          "inventory" => [],
          "encounteredNPCs" => [],
          "globalVariables" => {},
          "biometricSamples" => [],
          "biometricUnlocks" => [],
          "bluetoothDevices" => [],
          "notes" => [],
          "health" => 100
        }
      )
    end

    test "should belong to player and mission" do
      assert @game.player
      assert @game.mission
    end

    test "should unlock room" do
      @game.unlock_room!('office')
      assert @game.room_unlocked?('office')
    end

    test "should track inventory" do
      item = { 'type' => 'key', 'name' => 'Test Key' }
      @game.add_inventory_item!(item)
      assert_includes @game.player_state['inventory'], item
    end

    test "should update health" do
      @game.update_health!(50)
      assert_equal 50, @game.player_state['health']
    end

    test "should clamp health between 0 and 100" do
      @game.update_health!(150)
      assert_equal 100, @game.player_state['health']

      @game.update_health!(-10)
      assert_equal 0, @game.player_state['health']
    end

    # Tests for key-based door unlock
    test "should validate unlock with correct key" do
      @game.scenario_data = {
        "rooms" => {
          "office1" => {
            "locked" => true,
            "lockType" => "key",
            "requires" => "office1_key"
          }
        }
      }
      @game.player_state['inventory'] = [
        { 'type' => 'key', 'key_id' => 'office1_key', 'name' => 'Office Key' }
      ]

      result = @game.validate_unlock('door', 'office1', '', 'key')
      assert result, "Should unlock door with correct key in inventory"
    end

    test "should reject unlock without required key" do
      @game.scenario_data = {
        "rooms" => {
          "office1" => {
            "locked" => true,
            "lockType" => "key",
            "requires" => "office1_key"
          }
        }
      }
      @game.player_state['inventory'] = [
        { 'type' => 'key', 'key_id' => 'wrong_key', 'name' => 'Wrong Key' }
      ]

      result = @game.validate_unlock('door', 'office1', '', 'key')
      assert_not result, "Should reject unlock without required key"
    end

    test "should reject locked door without any unlock method" do
      @game.scenario_data = {
        "rooms" => {
          "office1" => {
            "locked" => true,
            "lockType" => "key",
            "requires" => "office1_key"
          }
        }
      }
      @game.player_state['inventory'] = []

      result = @game.validate_unlock('door', 'office1', '', nil)
      assert_not result, "Should reject locked door without unlock method"
    end

    # Tests for lockpick-based door unlock
    test "should validate unlock with lockpick" do
      @game.scenario_data = {
        "rooms" => {
          "office1" => {
            "locked" => true,
            "lockType" => "key",
            "requires" => "office1_key"
          }
        }
      }
      @game.player_state['inventory'] = [
        { 'type' => 'lockpick', 'name' => 'Lock Pick Kit' }
      ]

      result = @game.validate_unlock('door', 'office1', '', 'lockpick')
      assert result, "Should unlock door with lockpick"
    end

    test "should reject lockpick unlock without lockpick in inventory" do
      @game.scenario_data = {
        "rooms" => {
          "office1" => {
            "locked" => true,
            "lockType" => "key",
            "requires" => "office1_key"
          }
        }
      }
      @game.player_state['inventory'] = [
        { 'type' => 'key', 'key_id' => 'office1_key', 'name' => 'Office Key' }
      ]

      result = @game.validate_unlock('door', 'office1', '', 'lockpick')
      assert_not result, "Should reject lockpick unlock without lockpick in inventory"
    end

    # Tests for combined scenarios
    test "lockpick should bypass key requirement" do
      @game.scenario_data = {
        "rooms" => {
          "secure_vault" => {
            "locked" => true,
            "lockType" => "key",
            "requires" => "vault_master_key"
          }
        }
      }
      @game.player_state['inventory'] = [
        { 'type' => 'lockpick', 'name' => 'Lock Pick Kit' }
      ]

      # Should succeed with lockpick even without the master key
      result = @game.validate_unlock('door', 'secure_vault', '', 'lockpick')
      assert result, "Lockpick should bypass specific key requirement"
    end

    test "key takes precedence over lockpick attempt" do
      @game.scenario_data = {
        "rooms" => {
          "office1" => {
            "locked" => true,
            "lockType" => "key",
            "requires" => "office1_key"
          }
        }
      }
      @game.player_state['inventory'] = [
        { 'type' => 'key', 'key_id' => 'office1_key', 'name' => 'Office Key' },
        { 'type' => 'lockpick', 'name' => 'Lock Pick Kit' }
      ]

      # Key unlock should succeed
      result = @game.validate_unlock('door', 'office1', '', 'key')
      assert result, "Key unlock should succeed"
    end

    test "should allow access to unlocked doors regardless of method" do
      @game.scenario_data = {
        "rooms" => {
          "reception" => {
            "locked" => false
          }
        }
      }
      @game.player_state['inventory'] = []

      result = @game.validate_unlock('door', 'reception', '', 'unlocked')
      assert result, "Should allow access to unlocked doors"
    end

    test "has_key_in_inventory should find keys by key_id" do
      @game.player_state['inventory'] = [
        { 'type' => 'key', 'key_id' => 'office1_key', 'name' => 'Office Key' }
      ]

      assert @game.has_key_in_inventory?('office1_key'), "Should find key by key_id"
      assert_not @game.has_key_in_inventory?('wrong_key'), "Should not find missing key"
    end

    test "has_lockpick_in_inventory should find lockpicks" do
      @game.player_state['inventory'] = [
        { 'type' => 'lockpick', 'name' => 'Lock Pick Kit' }
      ]

      assert @game.has_lockpick_in_inventory?, "Should find lockpick in inventory"
    end

    test "has_lockpick_in_inventory should not find non-lockpick items" do
      @game.player_state['inventory'] = [
        { 'type' => 'key', 'key_id' => 'office1_key', 'name' => 'Office Key' }
      ]

      assert_not @game.has_lockpick_in_inventory?, "Should not find non-lockpick items as lockpick"
    end

    # ─── vm_set_id column sync ─────────────────────────────────────────────────
    # Use @other_player to avoid colliding with @game (same player+mission is blocked
    # by the unique partial index on in_progress games).

    test "sync_vm_set_id_column populates vm_set_id from player_state on before_create" do
      other_player = break_escape_demo_users(:other_user)
      game = Game.new(
        mission:       @mission,
        player:        other_player,
        scenario_data: { "startRoom" => "reception", "rooms" => {} },
        player_state:  {
          "currentRoom" => "reception", "unlockedRooms" => ["reception"],
          "unlockedObjects" => [], "inventory" => [], "encounteredNPCs" => [],
          "globalVariables" => {}, "biometricSamples" => [], "biometricUnlocks" => [],
          "bluetoothDevices" => [], "notes" => [], "health" => 100,
          "vm_set_id" => 42
        }
      )
      game.save!
      assert_equal 42, game.vm_set_id
    end

    test "sync_vm_set_id_column does not overwrite vm_set_id if already set" do
      other_player = break_escape_demo_users(:other_user)
      game = Game.new(
        mission:       @mission,
        player:        other_player,
        scenario_data: { "startRoom" => "reception", "rooms" => {} },
        player_state:  {
          "currentRoom" => "reception", "unlockedRooms" => ["reception"],
          "unlockedObjects" => [], "inventory" => [], "encounteredNPCs" => [],
          "globalVariables" => {}, "biometricSamples" => [], "biometricUnlocks" => [],
          "bluetoothDevices" => [], "notes" => [], "health" => 100,
          "vm_set_id" => 99
        }
      )
      game.vm_set_id = 7
      game.save!
      assert_equal 7, game.vm_set_id
    end

    test "sync_vm_set_id_column leaves vm_set_id nil when player_state has no vm_set_id" do
      other_player = break_escape_demo_users(:other_user)
      game = Game.new(
        mission:       @mission,
        player:        other_player,
        scenario_data: { "startRoom" => "reception", "rooms" => {} },
        player_state:  {
          "currentRoom" => "reception", "unlockedRooms" => ["reception"],
          "unlockedObjects" => [], "inventory" => [], "encounteredNPCs" => [],
          "globalVariables" => {}, "biometricSamples" => [], "biometricUnlocks" => [],
          "bluetoothDevices" => [], "notes" => [], "health" => 100
        }
      )
      game.save!
      assert_nil game.vm_set_id
    end

    # ─── on_game_complete hook ─────────────────────────────────────────────────

    test "fire_completion_callback delegates to on_game_complete hook" do
      called_with = nil
      BreakEscape.configuration.on_game_complete = ->(game) { called_with = game }

      @game.send(:fire_completion_callback)

      assert_equal @game, called_with
    ensure
      BreakEscape.configuration.on_game_complete = nil
    end

    test "status_previously_changed_to_completed? is true after status changes to completed" do
      @game.update!(status: 'completed', completed_at: Time.current)
      assert @game.send(:status_previously_changed_to_completed?)
    end

    test "fire_completion_callback is NOT called when status changes to abandoned" do
      called = false
      BreakEscape.configuration.on_game_complete = ->(_game) { called = true }

      @game.update!(status: 'abandoned')

      assert_not called
    ensure
      BreakEscape.configuration.on_game_complete = nil
    end

    test "fire_completion_callback is NOT called when other attributes change" do
      called = false
      BreakEscape.configuration.on_game_complete = ->(_game) { called = true }

      @game.update!(score: 50)

      assert_not called
    ensure
      BreakEscape.configuration.on_game_complete = nil
    end

    test "a completion callback that raises does NOT prevent the game from being saved" do
      BreakEscape.configuration.on_game_complete = ->(_game) { raise "scoring error" }

      assert_nothing_raised do
        @game.update!(status: 'completed', completed_at: Time.current)
      end
      assert_equal 'completed', @game.reload.status
    ensure
      BreakEscape.configuration.on_game_complete = nil
    end

    test "nil on_game_complete config does not raise" do
      BreakEscape.configuration.on_game_complete = nil

      assert_nothing_raised do
        @game.update!(status: 'completed', completed_at: Time.current)
      end
    end

    # targetFlags must be authored in the display form the controller generates
    # ("vm-flagN"). These pin that contract: the display form completes the task,
    # and the scenario reference form ("vm:flag_N") silently does not — which is
    # what blocked every submit_flags task in m02 until its scenario was fixed.
    test "submit_flags task completes when targetFlags use the vm-flagN display form" do
      set_flag_objective('hospital_backup_server-flag1')

      result = @game.process_flag_task_completions!('hospital_backup_server-flag1')

      assert_equal ['submit_ssh_flag'], result[:completed_tasks]
      assert_equal 'completed',
                   @game.player_state.dig('objectivesState', 'tasks', 'submit_ssh_flag', 'status')
    end

    test "submit_flags task does NOT complete when targetFlags use the vm:flag_N reference form" do
      set_flag_objective('hospital_backup_server:flag_1')

      result = @game.process_flag_task_completions!('hospital_backup_server-flag1')

      assert_empty result[:completed_tasks]
    end

    test "submit_flags task does not complete on a different flag" do
      set_flag_objective('hospital_backup_server:flag_1')

      result = @game.process_flag_task_completions!('hospital_backup_server-flag2')

      assert_empty result[:completed_tasks]
      assert_nil @game.player_state.dig('objectivesState', 'tasks', 'submit_ssh_flag', 'status')
    end

    # --- Station-qualified flag identifiers -------------------------------
    # The controller now offers two candidate identifiers per submission:
    # a station-qualified one ("<stationKey>:<vm>-flagN") and the legacy
    # unqualified one ("<vm>-flagN"). A task matches on either, and the
    # matched targetFlags entry (not the generated id) is what gets recorded,
    # so progress persisted by the old code keeps counting.

    test "legacy unqualified targetFlags still completes when candidates include a qualified id" do
      set_flag_objective('hospital_backup_server-flag1')

      result = @game.process_flag_task_completions!(
        ['flag_station_dropsite:hospital_backup_server-flag1', 'hospital_backup_server-flag1']
      )

      assert_equal ['submit_ssh_flag'], result[:completed_tasks]
      assert_equal ['hospital_backup_server-flag1'],
                   @game.player_state.dig('objectivesState', 'tasks', 'submit_ssh_flag', 'submittedFlags')
    end

    test "qualified targetFlags completes when submitted at its own station" do
      set_flag_objective('flag_station_dropsite:hospital_backup_server-flag1')

      result = @game.process_flag_task_completions!(
        ['flag_station_dropsite:hospital_backup_server-flag1', 'hospital_backup_server-flag1']
      )

      assert_equal ['submit_ssh_flag'], result[:completed_tasks]
      assert_equal ['flag_station_dropsite:hospital_backup_server-flag1'],
                   @game.player_state.dig('objectivesState', 'tasks', 'submit_ssh_flag', 'submittedFlags')
    end

    test "qualified targetFlags does NOT complete when the same flag id comes from another station" do
      set_flag_objective('flag_station_dropsite:hospital_backup_server-flag1')

      result = @game.process_flag_task_completions!(
        ['ENTROPY Launch Device:hospital_backup_server-flag1', 'hospital_backup_server-flag1']
      )

      assert_empty result[:completed_tasks]
      assert_nil @game.player_state.dig('objectivesState', 'tasks', 'submit_ssh_flag', 'status')
    end

    test "a multi-flag task with submittedFlags persisted in the old form still completes" do
      @game.scenario_data = @game.scenario_data.merge(
        'objectives' => [{
          'aimId' => 'aim_flags',
          'tasks' => [{
            'taskId' => 'submit_ssh_flag',
            'type' => 'submit_flags',
            'targetFlags' => ['hospital_backup_server-flag1', 'hospital_backup_server-flag2']
          }]
        }]
      )
      # Progress as an old (pre-change) game would have persisted it.
      @game.send(:initialize_objectives)
      @game.player_state['objectivesState']['tasks']['submit_ssh_flag'] = {
        'submittedFlags' => ['hospital_backup_server-flag1']
      }
      @game.save!

      result = @game.process_flag_task_completions!(
        ['flag_station_dropsite:hospital_backup_server-flag2', 'hospital_backup_server-flag2']
      )

      assert_equal ['submit_ssh_flag'], result[:completed_tasks]
      assert_equal 'completed',
                   @game.player_state.dig('objectivesState', 'tasks', 'submit_ssh_flag', 'status')
    end

    private

    def set_flag_objective(target_flag)
      @game.scenario_data = @game.scenario_data.merge(
        'objectives' => [{
          'aimId' => 'aim_flags',
          'tasks' => [{
            'taskId' => 'submit_ssh_flag',
            'type' => 'submit_flags',
            'targetFlags' => [target_flag]
          }]
        }]
      )
      @game.save!
    end
  end

  # ---------------------------------------------------------------------------
  # Mission Conclusion
  # ---------------------------------------------------------------------------
  class MissionConclusionTest < ActiveSupport::TestCase
    CONCLUSION_SCENARIO = {
      "startRoom" => "room1",
      "rooms" => {},
      "objectives" => [
        {
          "aimId" => "setup_aim",
          "title" => "Setup",
          "status" => "active",
          "order" => 0,
          "tasks" => [
            { "taskId" => "setup_task", "title" => "Setup", "type" => "custom", "status" => "active" },
            { "taskId" => "story_task", "title" => "Story beat", "type" => "custom", "status" => "active" }
          ]
        },
        {
          "aimId" => "conclusion_aim",
          "title" => "Conclude",
          "status" => "active",
          "order" => 1,
          "missionConclusion" => true,
          # concludeRequires is the ending gate and names only technical work.
          # story_task on setup_aim is deliberately never completed in these
          # tests -- proving story progress does NOT withhold the ending (T10).
          "concludeRequires" => { "tasksCompleted" => ["setup_task"] },
          "conclusionScreen" => { "type" => "end_screen" },
          "tasks" => [
            { "taskId" => "conclusion_task", "title" => "Conclude", "type" => "custom", "status" => "active" }
          ]
        }
      ]
    }.freeze

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @player  = break_escape_demo_users(:test_user)
      @game = BreakEscape::Game.create!(
        mission: @mission,
        player: @player,
        scenario_data: CONCLUSION_SCENARIO.deep_dup,
        player_state: {
          "currentRoom" => "room1",
          "unlockedRooms" => ["room1"],
          "unlockedObjects" => [],
          "inventory" => [],
          "encounteredNPCs" => [],
          "globalVariables" => {},
          "biometricSamples" => [],
          "biometricUnlocks" => [],
          "bluetoothDevices" => [],
          "notes" => [],
          "health" => 100
        }
      )
    end

    # T1: completing the conclusion aim writes mission_concluded_at
    test "completing conclusion aim sets mission_concluded_at" do
      @game.complete_task!('setup_task')
      assert_nil @game.mission_concluded_at, "should not be set before conclusion aim"

      result = @game.complete_task!('conclusion_task')
      assert result[:success]
      assert result[:missionConcluded]
      assert_not_nil @game.mission_concluded_at
    end

    # T2: completing a non-conclusion aim does not set mission_concluded_at
    test "completing non-conclusion aim does not set mission_concluded_at" do
      @game.complete_task!('setup_task')
      assert_nil @game.mission_concluded_at
    end

    # T3: check_mission_conclusion is idempotent
    test "mission_concluded_at is not changed on a second completion" do
      @game.complete_task!('setup_task')
      @game.complete_task!('conclusion_task')
      first_ts = @game.mission_concluded_at

      sleep(0.01) # ensure a different timestamp would be generated
      @game.complete_task!('conclusion_task') # already completed — no-op
      assert_equal first_ts, @game.reload.mission_concluded_at
    end

    # T4: score is raw formula, never forced to 100
    test "score is raw task/aim formula, not forced to 100" do
      # Only complete 1 of 2 tasks (setup_task only)
      @game.complete_task!('setup_task')
      # Use calculate_task_score directly — calculate_score may delegate to game_slot
      # (Hacktivity association) which is not available in standalone engine tests.
      score = @game.calculate_task_score
      assert score < 100.0, "Score should be < 100 when not all tasks completed; got #{score}"
      assert score > 0.0,   "Score should be > 0 when some tasks completed; got #{score}"
    end

    # T5: the concludeRequires gate blocks conclusion when the declared work is
    # not done, but the task itself still completes successfully
    test "conclusion task is rejected when concludeRequires not satisfied" do
      result = @game.complete_task!('conclusion_task')
      assert_equal true, result[:success], "Task should succeed even when conclusion gate is blocked"
      assert_equal false, result[:missionConcluded], "Mission should not be concluded when gate is unmet"
      assert result[:warning].present?, "Response should include a warning when conclusion gate is blocked"
    end

    # T6: warning message is present (not an error) when gate is blocked
    test "rejection response includes error message" do
      result = @game.complete_task!('conclusion_task')
      assert result[:warning].present?
      assert_nil result[:error]
    end

    # T7: conclusion task succeeds when prerequisites ARE met
    test "conclusion task succeeds when concludeRequires are all satisfied" do
      @game.complete_task!('setup_task')
      result = @game.complete_task!('conclusion_task')
      assert result[:success]
    end

    # T8: mission_concluded_at is written only after the declared work is done
    test "mission_concluded_at not set if concludeRequires not satisfied" do
      @game.complete_task!('conclusion_task') # blocked by guard
      assert_nil @game.reload.mission_concluded_at
    end

    # T9: regression test for the out-of-order gate bug — the conclusion aim's
    # own task can complete BEFORE its concludeRequires gate task (e.g. two
    # client requests racing, or simply a player finishing tasks in a
    # different order than the scenario author assumed). Without
    # recheck_pending_mission_conclusions!, completing the gate task
    # afterward never re-triggers conclusion because check_aim_completion
    # only re-checks the aim that owns the task that just completed.
    test "conclusion aim completed before its gate task still concludes once the gate task lands" do
      result = @game.complete_task!('conclusion_task') # gate unmet — blocked
      assert_equal false, result[:missionConcluded]
      assert_nil @game.reload.mission_concluded_at

      result = @game.complete_task!('setup_task') # satisfies the gate, out of order
      assert result[:success]
      assert_not_nil @game.reload.mission_concluded_at, "mission should conclude once the gate task lands, even though the conclusion aim's own task completed first"
      assert_equal 'completed', @game.status
    end

    # T10: story tasks must not withhold the ending.
    #
    # This is the m02 soft-lock, as a test. The ending gate named a story task
    # whose only completion route was a single event mapping; a player who took
    # another path finished the whole mission, saw the credits, and left the
    # game stuck in in_progress with nothing to explain why. Story tasks feed the
    # score -- which is proportional, so unfinished work already costs marks --
    # and never the ending.
    test "an unfinished story task does not block conclusion" do
      assert_not_includes @game.scenario_data['objectives'].last['concludeRequires']['tasksCompleted'],
                          'story_task',
                          'fixture guard: story_task must not be in the ending gate'

      @game.complete_task!('setup_task')       # satisfies concludeRequires
      result = @game.complete_task!('conclusion_task')   # story_task left undone

      assert result[:missionConcluded], 'story progress must not gate the ending'
      assert_not_nil @game.reload.mission_concluded_at
      assert_equal 'completed', @game.status
    end
  end

  # ---------------------------------------------------------------------------
  # Aim completion idempotency (score/objectives_completed over-count guard)
  # ---------------------------------------------------------------------------
  class AimCompletionIdempotencyTest < ActiveSupport::TestCase
    IDEMPOTENCY_SCENARIO = {
      "startRoom" => "room1",
      "rooms" => {},
      "objectives" => [
        {
          "aimId" => "mixed_aim",
          "title" => "Mixed",
          "status" => "active",
          "order" => 0,
          "tasks" => [
            { "taskId" => "required_task", "title" => "Required", "type" => "custom", "status" => "active" },
            { "taskId" => "optional_task", "title" => "Optional", "type" => "custom", "status" => "active", "optional" => true }
          ]
        }
      ]
    }.freeze

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @player  = break_escape_demo_users(:test_user)
      @game = BreakEscape::Game.create!(
        mission: @mission,
        player: @player,
        scenario_data: IDEMPOTENCY_SCENARIO.deep_dup,
        player_state: {
          "currentRoom" => "room1",
          "unlockedRooms" => ["room1"],
          "unlockedObjects" => [],
          "inventory" => [],
          "encounteredNPCs" => [],
          "globalVariables" => {},
          "biometricSamples" => [],
          "biometricUnlocks" => [],
          "bluetoothDevices" => [],
          "notes" => [],
          "health" => 100
        }
      )
    end

    test "completing an aim's required task marks it completed and counts it once" do
      @game.complete_task!('required_task')
      assert_equal 'completed', @game.player_state.dig('objectivesState', 'aims', 'mixed_aim', 'status')
      assert_equal 1, @game.objectives_completed
    end

    # Regression test: completing an already-satisfied aim's remaining
    # optional task used to re-run the completion block in
    # check_aim_completion (no guard against the aim already being
    # 'completed'), double-incrementing objectives_completed and pushing
    # score past 100%.
    test "completing a later optional task in an already-completed aim does not double-count objectives_completed" do
      @game.complete_task!('required_task')
      assert_equal 1, @game.objectives_completed

      @game.complete_task!('optional_task')
      assert_equal 1, @game.reload.objectives_completed, "objectives_completed must not increment again for an aim that's already completed"
      assert_equal 2, @game.tasks_completed, "the optional task itself should still count toward tasks_completed"
    end

    test "score does not exceed 100 after completing every task including a redundant optional one" do
      @game.complete_task!('required_task')
      @game.complete_task!('optional_task')
      @game.reload

      assert_equal 2, @game.total_tasks
      assert_equal 1, @game.total_aims
      assert_equal 100.0, @game.calculate_task_score
    end
  end
end
