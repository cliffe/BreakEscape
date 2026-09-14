require 'test_helper'

# Security-focused integration tests covering attack surfaces that are not
# exercised by the regular happy-path or authorization tests.
#
# Each test is labelled SECURITY to make failures conspicuous in CI output.
# Tests labelled BUG CONFIRMED reproduce a known vulnerability and are
# expected to pass (they document the current broken behaviour).  The paired
# SECURITY tests assert the desired secure behaviour and will fail until the
# underlying code is fixed.
module BreakEscape
  class GameSecurityTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    PLAYER_STATE = {
      "currentRoom"      => "lobby",
      "unlockedRooms"    => ["lobby"],
      "unlockedObjects"  => [],
      "inventory"        => [],
      "encounteredNPCs"  => [],
      "globalVariables"  => {},
      "biometricSamples" => [],
      "biometricUnlocks" => [],
      "bluetoothDevices" => [],
      "notes"            => [],
      "health"           => 100
    }.freeze

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @player  = break_escape_demo_users(:test_user)

      @game = Game.create!(
        mission:       @mission,
        player:        @player,
        scenario_data: scenario_data,
        player_state:  PLAYER_STATE.dup
      )
    end

    # =========================================================================
    # sync_state — locked room teleport
    # =========================================================================

    test "SECURITY: sync_state cannot teleport player to a locked room" do
      put sync_state_game_url(@game), params: { currentRoom: "locked_office" }

      assert_response :forbidden
      json = JSON.parse(response.body)
      assert_equal false, json["success"]
      assert_match(/locked room/i, json["message"])

      @game.reload
      assert_equal "lobby", @game.player_state["currentRoom"],
        "Current room must not change to a locked room via sync_state"
    end

    test "SECURITY: sync_state cannot teleport player to a non-existent room" do
      put sync_state_game_url(@game), params: { currentRoom: "made_up_room" }

      assert_response :forbidden
      @game.reload
      assert_equal "lobby", @game.player_state["currentRoom"]
    end

    test "SECURITY: sync_state allows movement to already-unlocked rooms" do
      @game.player_state["unlockedRooms"] << "server_room"
      @game.save!

      put sync_state_game_url(@game), params: { currentRoom: "server_room" }

      assert_response :success
      @game.reload
      assert_equal "server_room", @game.player_state["currentRoom"]
    end

    # =========================================================================
    # sync_state — globalVariables injection
    # =========================================================================

    test "SECURITY: sync_state accepts legitimate globalVariables" do
      put sync_state_game_url(@game), params: {
        globalVariables: { "has_spoken_to_guard" => "true", "door_code_known" => "false" }
      }
      assert_response :success
      @game.reload
      assert @game.player_state["globalVariables"].key?("has_spoken_to_guard"),
        "Legitimate globalVariable should be persisted"
    end

    test "SECURITY: sync_state does not overwrite top-level player_state keys via globalVariables" do
      # globalVariables is nested inside player_state — sending keys like 'health'
      # or 'unlockedRooms' must not affect those sibling fields.
      put sync_state_game_url(@game), params: {
        globalVariables: { "health" => 9999, "unlockedRooms" => ["lobby", "locked_office"] }
      }
      assert_response :success

      @game.reload
      assert_equal 100, @game.player_state["health"],
        "health must not be overwritten via globalVariables injection"
      assert_not_includes @game.player_state["unlockedRooms"], "locked_office",
        "unlockedRooms must not be expanded via globalVariables injection"
    end

    # =========================================================================
    # inventory — cannot take items from inaccessible locations
    # =========================================================================

    test "SECURITY: inventory cannot add item from a locked room" do
      # office_key lives in locked_office which the player has not unlocked
      post inventory_game_url(@game), params: {
        action_type: "add",
        item: { type: "key", name: "Office Key", id: "office_key" }
      }

      assert_response :unprocessable_entity,
        "SECURITY FAIL: item was taken from a locked room"
      json = JSON.parse(response.body)
      assert_equal false, json["success"]

      @game.reload
      assert_empty @game.player_state["inventory"],
        "Inventory must not contain item from a locked room"
    end

    test "SECURITY: inventory cannot add item from a locked container" do
      # secret_doc lives inside lobby_safe which is locked
      post inventory_game_url(@game), params: {
        action_type: "add",
        item: { type: "document", name: "Secret Document", id: "secret_doc" }
      }

      assert_response :unprocessable_entity,
        "SECURITY FAIL: item was taken from a locked container"
      json = JSON.parse(response.body)
      assert_equal false, json["success"]

      @game.reload
      assert_empty @game.player_state["inventory"]
    end

    test "SECURITY: inventory cannot add a non-takeable item" do
      post inventory_game_url(@game), params: {
        action_type: "add",
        item: { type: "desk", name: "Heavy Desk", id: "lobby_desk" }
      }

      assert_response :unprocessable_entity,
        "SECURITY FAIL: non-takeable item was added to inventory"
      json = JSON.parse(response.body)
      assert_equal false, json["success"]
    end

    test "SECURITY: inventory can add a takeable item from an accessible room" do
      post inventory_game_url(@game), params: {
        action_type: "add",
        item: { type: "notepad", name: "Notepad", id: "lobby_notepad" }
      }

      assert_response :success
      @game.reload
      assert_equal 1, @game.player_state["inventory"].length
    end

    test "SECURITY: inventory can add item from a container once it is unlocked" do
      @game.player_state["unlockedObjects"] << "lobby_safe"
      @game.save!

      post inventory_game_url(@game), params: {
        action_type: "add",
        item: { type: "document", name: "Secret Document", id: "secret_doc" }
      }

      assert_response :success
    end

    # =========================================================================
    # GET /games/:id/container/:container_id — access without unlock
    #
    # The container route has no named URL helper (no `as:` in routes.rb),
    # so the path is constructed from the game path.
    # =========================================================================

    test "SECURITY: container endpoint returns 403 for a locked container" do
      get "#{game_path(@game)}/container/lobby_safe"
      assert_response :forbidden,
        "SECURITY FAIL: container contents were served without the container being unlocked"
    end

    test "SECURITY: container endpoint serves contents once unlocked" do
      @game.player_state["unlockedObjects"] << "lobby_safe"
      @game.save!

      get "#{game_path(@game)}/container/lobby_safe"
      assert_response :success
      json = JSON.parse(response.body)
      assert json["contents"].any?, "Expected contents after container is unlocked"
    end

    test "SECURITY: container endpoint returns 404 for a non-existent container" do
      get "#{game_path(@game)}/container/phantom_safe"
      assert_response :not_found
    end

    # =========================================================================
    # BUG: container type-based unlock bypass
    #
    # check_container_unlocked (games_controller.rb:844) checks
    #   unlocked_list.include?(container_data['type'])
    # This means that once ANY container of type "safe" is unlocked, ALL other
    # containers whose type is "safe" become readable — regardless of whether
    # they were individually unlocked.
    #
    # Fix: remove the `unlocked_list.include?(container_data['type'])` branch
    # from check_container_unlocked (games_controller.rb:844).
    # =========================================================================

    test "SECURITY: unlocking one container must not grant access to other containers of the same type" do
      @game.player_state["unlockedObjects"] << "lobby_safe"
      @game.save!

      get "#{game_path(@game)}/container/office_safe"

      assert_response :forbidden,
        "SECURITY FAIL: unlocking lobby_safe must not grant access to office_safe."
    end

    # =========================================================================
    # update_task_progress — progress must be clamped to [0, maxProgress]
    # =========================================================================

    test "SECURITY: update_task_progress should reject negative progress" do
      setup_collect_task

      put update_task_progress_game_url(@game, task_id: "task_collect"),
          params: { progress: -99 }

      @game.reload
      stored = @game.player_state.dig("objectivesState", "tasks", "task_collect", "progress").to_i
      assert stored >= 0,
        "SECURITY FAIL (known bug): negative progress must not be stored (got #{stored})."
    end

    test "SECURITY: update_task_progress should cap progress at maxProgress" do
      setup_collect_task

      put update_task_progress_game_url(@game, task_id: "task_collect"),
          params: { progress: 9999 }

      @game.reload
      stored = @game.player_state.dig("objectivesState", "tasks", "task_collect", "progress").to_i
      assert stored <= 3,
        "SECURITY FAIL (known bug): progress must be capped at maxProgress=3 (got #{stored})."
    end

    # =========================================================================
    # complete_task — server validates prerequisites
    # =========================================================================

    test "SECURITY: complete_task rejects unlock_room task when room is still locked" do
      setup_unlock_room_task

      post complete_task_game_url(@game, task_id: "task_unlock")

      json = JSON.parse(response.body)
      assert_equal false, json["success"],
        "SECURITY FAIL: unlock_room task was completed without the room being unlocked"

      @game.reload
      task_status = @game.player_state.dig("objectivesState", "tasks", "task_unlock", "status")
      assert_not_equal "completed", task_status,
        "Task must not be marked completed when the target room is still locked"
    end

    test "SECURITY: complete_task accepts unlock_room task when room is genuinely unlocked" do
      setup_unlock_room_task
      @game.player_state["unlockedRooms"] << "locked_office"
      @game.save!

      post complete_task_game_url(@game, task_id: "task_unlock")

      json = JSON.parse(response.body)
      assert json["success"],
        "Task should complete when the target room is genuinely unlocked"

      @game.reload
      task_status = @game.player_state.dig("objectivesState", "tasks", "task_unlock", "status")
      assert_equal "completed", task_status
    end

    # =========================================================================
    # complete_task — unlock_object validation
    # =========================================================================

    test "SECURITY: complete_task rejects unlock_object task when object is still locked" do
      setup_unlock_object_task

      post complete_task_game_url(@game, task_id: "task_unlock_safe")

      json = JSON.parse(response.body)
      assert_equal false, json["success"],
        "SECURITY FAIL: unlock_object task was completed without the object being unlocked"

      @game.reload
      task_status = @game.player_state.dig("objectivesState", "tasks", "task_unlock_safe", "status")
      assert_not_equal "completed", task_status,
        "Task must not be marked completed when the target object is still locked"
    end

    test "SECURITY: complete_task accepts unlock_object task when object is genuinely unlocked" do
      setup_unlock_object_task
      @game.player_state["unlockedObjects"] << "lobby_safe"
      @game.save!

      post complete_task_game_url(@game, task_id: "task_unlock_safe")

      json = JSON.parse(response.body)
      assert json["success"],
        "Task should complete when the target object is genuinely unlocked"

      @game.reload
      task_status = @game.player_state.dig("objectivesState", "tasks", "task_unlock_safe", "status")
      assert_equal "completed", task_status
    end

    # =========================================================================
    # complete_task — collect_items validation
    # =========================================================================

    test "SECURITY: complete_task rejects collect_items task with insufficient items" do
      setup_collect_task

      # Player has 0 items, needs 3
      post complete_task_game_url(@game, task_id: "task_collect"),
           params: { currentCount: 0 }

      json = JSON.parse(response.body)
      assert_equal false, json["success"],
        "SECURITY FAIL: collect_items task was completed without sufficient items"

      @game.reload
      task_status = @game.player_state.dig("objectivesState", "tasks", "task_collect", "status")
      assert_not_equal "completed", task_status
    end

    test "SECURITY WARNING: collect_items with targetItemIds also trusts currentCount (scoring vulnerability)" do
      setup_collect_task_with_specific_items

      # SECURITY ISSUE: Even with specific targetItemIds, server trusts client currentCount
      # This bypasses server-side inventory validation (see game.rb:1035-1040)
      @game.player_state["inventory"] = []
      @game.save!

      post complete_task_game_url(@game, task_id: "task_collect_specific"),
           params: { currentCount: 2 }

      json = JSON.parse(response.body)
      assert json["success"],
        "CURRENT BEHAVIOR: All collect_items tasks trust currentCount (lines before item validation)"

      # RECOMMENDATION: For scoring, either:
      # 1. Don't use collect_items tasks in score calculation
      # 2. Fix validation to only trust currentCount when targetItems/targetItemIds NOT specified
      # 3. Weight collect_items tasks very low (exploitable)
    end

    test "NOTE: complete_task trusts currentCount for generic collect_items tasks (documented behavior for notes)" do
      setup_collect_task

      # This is INTENTIONAL behavior - client-trusted count for notes-type items
      # See game.rb:1035-1040 - handles async inventory race conditions
      @game.player_state["inventory"] = []
      @game.save!

      post complete_task_game_url(@game, task_id: "task_collect"),
           params: { currentCount: 3 }

      json = JSON.parse(response.body)
      assert json["success"],
        "Generic collect_items tasks trust client currentCount (documented behavior)"

      @game.reload
      task_status = @game.player_state.dig("objectivesState", "tasks", "task_collect", "status")
      assert_equal "completed", task_status,
        "NOTE: This creates a scoring security concern - generic collect tasks can be spoofed"
    end

    test "SECURITY: complete_task accepts collect_items task when enough items collected" do
      setup_collect_task

      # Give player 3 items
      @game.player_state["inventory"] = [
        { "id" => "item1", "type" => "evidence" },
        { "id" => "item2", "type" => "evidence" },
        { "id" => "item3", "type" => "evidence" }
      ]
      @game.save!

      post complete_task_game_url(@game, task_id: "task_collect"),
           params: { currentCount: 3 }

      json = JSON.parse(response.body)
      assert json["success"],
        "Task should complete when enough items are collected"

      @game.reload
      task_status = @game.player_state.dig("objectivesState", "tasks", "task_collect", "status")
      assert_equal "completed", task_status
    end

    # =========================================================================
    # complete_task — submit_flags validation
    # =========================================================================

    test "SECURITY: complete_task rejects submit_flags task with no flags submitted" do
      setup_submit_flags_task

      post complete_task_game_url(@game, task_id: "task_flags"),
           params: { submittedFlags: [] }

      json = JSON.parse(response.body)
      assert_equal false, json["success"],
        "SECURITY FAIL: submit_flags task was completed without any flags"

      @game.reload
      task_status = @game.player_state.dig("objectivesState", "tasks", "task_flags", "status")
      assert_not_equal "completed", task_status
    end

    test "SECURITY: complete_task rejects submit_flags task with partial flags" do
      setup_submit_flags_task

      # Only submit 2 of 3 required flags
      post complete_task_game_url(@game, task_id: "task_flags"),
           params: { submittedFlags: ["flag_admin", "flag_database"] }

      json = JSON.parse(response.body)
      assert_equal false, json["success"],
        "SECURITY FAIL: submit_flags task completed with only partial flags"

      @game.reload
      task_status = @game.player_state.dig("objectivesState", "tasks", "task_flags", "status")
      assert_not_equal "completed", task_status
    end

    test "SECURITY: complete_task rejects submit_flags task without submittedFlags parameter" do
      setup_submit_flags_task

      # Attempt completion without submittedFlags in request body
      post complete_task_game_url(@game, task_id: "task_flags")

      json = JSON.parse(response.body)
      assert_equal false, json["success"],
        "SECURITY FAIL: submit_flags task completed without submittedFlags parameter"
    end

    test "SECURITY: complete_task accepts submit_flags task when all flags submitted" do
      setup_submit_flags_task

      post complete_task_game_url(@game, task_id: "task_flags"),
           params: { submittedFlags: ["flag_admin", "flag_database", "flag_network"] }

      json = JSON.parse(response.body)
      assert json["success"],
        "Task should complete when all required flags are submitted"

      @game.reload
      task_status = @game.player_state.dig("objectivesState", "tasks", "task_flags", "status")
      assert_equal "completed", task_status
    end

    test "SECURITY: complete_task ignores pre-stored flags in player_state for submit_flags task" do
      setup_submit_flags_task

      # Pre-store flags in player_state (attacker pre-injection attempt)
      @game.player_state["objectivesState"]["tasks"]["task_flags"]["submittedFlags"] =
        ["flag_admin", "flag_database", "flag_network"]
      @game.save!

      # Attempt completion without flags in request body
      post complete_task_game_url(@game, task_id: "task_flags")

      json = JSON.parse(response.body)
      assert_equal false, json["success"],
        "SECURITY FAIL: complete_task used pre-stored flags instead of requiring them in request"
    end

    # =========================================================================
    # complete_task — npc_conversation validation
    # =========================================================================

    test "SECURITY: complete_task rejects npc_conversation task when NPC not encountered" do
      setup_npc_conversation_task

      post complete_task_game_url(@game, task_id: "task_talk_guard")

      json = JSON.parse(response.body)
      assert_equal false, json["success"],
        "SECURITY FAIL: npc_conversation task completed without encountering NPC"

      @game.reload
      task_status = @game.player_state.dig("objectivesState", "tasks", "task_talk_guard", "status")
      assert_not_equal "completed", task_status
    end

    test "SECURITY: complete_task accepts npc_conversation task when NPC encountered" do
      setup_npc_conversation_task
      @game.player_state["encounteredNPCs"] << "guard"
      @game.save!

      post complete_task_game_url(@game, task_id: "task_talk_guard")

      json = JSON.parse(response.body)
      assert json["success"],
        "Task should complete when NPC has been encountered"

      @game.reload
      task_status = @game.player_state.dig("objectivesState", "tasks", "task_talk_guard", "status")
      assert_equal "completed", task_status
    end

    # =========================================================================
    # complete_task — enter_room (client-trusted)
    # =========================================================================

    test "SECURITY: complete_task accepts enter_room task (client-trusted validation)" do
      setup_enter_room_task

      post complete_task_game_url(@game, task_id: "task_enter_office")

      json = JSON.parse(response.body)
      assert json["success"],
        "enter_room task should complete (client-trusted, low-stakes)"

      @game.reload
      task_status = @game.player_state.dig("objectivesState", "tasks", "task_enter_office", "status")
      assert_equal "completed", task_status
    end

    # =========================================================================
    # complete_task — custom (no validation)
    # =========================================================================

    test "SECURITY: complete_task accepts custom task (no server validation)" do
      setup_custom_task

      post complete_task_game_url(@game, task_id: "task_custom")

      json = JSON.parse(response.body)
      assert json["success"],
        "custom task should complete without validation (Ink-driven)"

      @game.reload
      task_status = @game.player_state.dig("objectivesState", "tasks", "task_custom", "status")
      assert_equal "completed", task_status
    end

    # =========================================================================
    # complete_task — negative cases
    # =========================================================================

    test "SECURITY: complete_task rejects non-existent task ID" do
      setup_collect_task

      post complete_task_game_url(@game, task_id: "nonexistent_task")

      json = JSON.parse(response.body)
      assert_equal false, json["success"],
        "SECURITY FAIL: non-existent task was marked complete"
      assert_match /not found/i, json["error"]
    end

    test "SECURITY: complete_task increments tasks_completed counter" do
      setup_collect_task
      @game.player_state["inventory"] = [
        { "id" => "item1" }, { "id" => "item2" }, { "id" => "item3" }
      ]
      @game.save!

      initial_count = @game.tasks_completed || 0

      post complete_task_game_url(@game, task_id: "task_collect"),
           params: { currentCount: 3 }

      @game.reload
      assert_equal initial_count + 1, @game.tasks_completed,
        "tasks_completed counter should increment"
    end

    test "SECURITY: complete_task triggers aim completion when all tasks done" do
      setup_multi_task_aim
      @game.player_state["unlockedRooms"] << "locked_office"
      @game.player_state["inventory"] = [{ "id" => "item1" }]
      @game.save!

      initial_aims_count = @game.objectives_completed || 0

      # Complete first task
      post complete_task_game_url(@game, task_id: "task_unlock"),
           params: {}

      @game.reload
      assert_equal initial_aims_count, @game.objectives_completed,
        "Aim should not complete yet"

      # Complete second task
      post complete_task_game_url(@game, task_id: "task_collect_one"),
           params: { currentCount: 1 }

      @game.reload
      assert_equal initial_aims_count + 1, @game.objectives_completed,
        "Aim should complete when all tasks done"

      aim_status = @game.player_state.dig("objectivesState", "aims", "aim_multi", "status")
      assert_equal "completed", aim_status
    end

    # =========================================================================
    # SCORING SECURITY TESTS
    # =========================================================================

    test "SECURITY: task-based scoring validates server-side for submit_flags tasks" do
      setup_submit_flags_task

      # Try to complete without submitting flags
      post complete_task_game_url(@game, task_id: "task_flags"),
           params: {}

      json = JSON.parse(response.body)
      assert_equal false, json["success"],
        "SCORING: submit_flags task should not complete without flags parameter"

      @game.reload
      assert_equal 0, @game.tasks_completed,
        "SCORING: tasks_completed counter should not increment without validation"
    end

    test "SECURITY: task-based scoring validates server-side for unlock tasks" do
      setup_unlock_room_task

      # Try to complete without unlocking room
      post complete_task_game_url(@game, task_id: "task_unlock")

      json = JSON.parse(response.body)
      assert_equal false, json["success"],
        "SCORING: unlock_room task should not complete without actual unlock"

      @game.reload
      assert_equal 0, @game.tasks_completed,
        "SCORING: tasks_completed counter should not increment without validation"
    end

    test "SECURITY: task-based scoring increments tasks_completed on valid completion" do
      setup_unlock_room_task
      @game.player_state["unlockedRooms"] << "locked_office"
      @game.save!

      initial_count = @game.tasks_completed || 0

      post complete_task_game_url(@game, task_id: "task_unlock")

      @game.reload
      assert_equal initial_count + 1, @game.tasks_completed,
        "SCORING: tasks_completed should increment after valid task completion"
    end

    test "SECURITY: task-based scoring increments objectives_completed on aim completion" do
      setup_unlock_room_task
      @game.player_state["unlockedRooms"] << "locked_office"
      @game.save!

      initial_count = @game.objectives_completed || 0

      post complete_task_game_url(@game, task_id: "task_unlock")

      @game.reload
      assert_equal initial_count + 1, @game.objectives_completed,
        "SCORING: objectives_completed should increment when aim completes"
    end

    test "SECURITY WARNING: collect_items with client count is exploitable for scoring" do
      # This documents the KNOWN vulnerability - see todo_itinerary_count_validation_fix.md
      setup_collect_task

      # Player has no items but claims to have 3
      @game.player_state["inventory"] = []
      @game.save!

      post complete_task_game_url(@game, task_id: "task_collect"),
           params: { currentCount: 3 }

      json = JSON.parse(response.body)
      assert json["success"],
        "KNOWN ISSUE: collect_items tasks trust client currentCount (see todo_itinerary_count_validation_fix.md)"

      @game.reload
      assert_equal 1, @game.tasks_completed,
        "WARNING: This task type is EXPLOITABLE for scoring - recommend using flags scoring for competitive events"
    end

    test "SECURITY: enter_room tasks are client-trusted (document for scoring)" do
      setup_enter_room_task

      # No server-side validation for enter_room
      post complete_task_game_url(@game, task_id: "task_enter_office")

      json = JSON.parse(response.body)
      assert json["success"],
        "DOCUMENTED: enter_room tasks are client-trusted (low-stakes)"

      @game.reload
      assert_equal 1, @game.tasks_completed,
        "NOTE: enter_room tasks should be weighted lower in scoring calculations"
    end

    test "SECURITY: custom tasks have no validation (document for scoring)" do
      setup_custom_task

      # No server-side validation for custom tasks
      post complete_task_game_url(@game, task_id: "task_custom")

      json = JSON.parse(response.body)
      assert json["success"],
        "DOCUMENTED: custom tasks have no server validation (Ink-driven)"

      @game.reload
      assert_equal 1, @game.tasks_completed,
        "NOTE: custom tasks should be excluded from scoring or weighted very low"
    end

    test "SECURITY: multiple task completions increment counter correctly" do
      setup_multi_task_aim
      @game.player_state["unlockedRooms"] << "locked_office"
      @game.player_state["inventory"] = [{ "id" => "item1" }]
      @game.save!

      # Complete two tasks
      post complete_task_game_url(@game, task_id: "task_unlock")
      post complete_task_game_url(@game, task_id: "task_collect_one"),
           params: { currentCount: 1 }

      @game.reload
      assert_equal 2, @game.tasks_completed,
        "SCORING: tasks_completed should accurately count completed tasks"
    end

    test "SECURITY: cannot complete same task twice to inflate score" do
      setup_unlock_room_task
      @game.player_state["unlockedRooms"] << "locked_office"
      @game.save!

      # Complete task once
      post complete_task_game_url(@game, task_id: "task_unlock")
      @game.reload
      first_count = @game.tasks_completed

      # Try to complete same task again
      post complete_task_game_url(@game, task_id: "task_unlock")
      @game.reload

      assert_equal first_count, @game.tasks_completed,
        "SECURITY: tasks_completed should not increment for already-completed task"
    end

    private

    # ── Scenario data ─────────────────────────────────────────────────────────

    def scenario_data
      {
        "startRoom"             => "lobby",
        "startItemsInInventory" => [],
        "rooms" => {
          "lobby" => {
            "locked"      => false,
            "connections" => { "north" => "locked_office" },
            "objects" => [
              # Takeable item in accessible room
              { "id" => "lobby_notepad", "type" => "notepad", "name" => "Notepad", "takeable" => true },
              # Non-takeable fixture
              { "id" => "lobby_desk", "type" => "desk", "name" => "Heavy Desk", "takeable" => false },
              # Locked safe — first "safe"-type container (pivot for type-bypass bug)
              {
                "id" => "lobby_safe", "type" => "safe", "name" => "Lobby Safe",
                "locked" => true, "lockType" => "pin", "requires" => "1234",
                "contents" => [
                  { "id" => "secret_doc", "type" => "document", "name" => "Secret Document", "takeable" => true }
                ]
              },
              # Second "safe"-type container — the unintended beneficiary of the type-bypass bug
              {
                "id" => "office_safe", "type" => "safe", "name" => "Office Safe",
                "locked" => true, "lockType" => "pin", "requires" => "9876",
                "contents" => [
                  { "id" => "classified", "type" => "document", "name" => "Classified File", "takeable" => true }
                ]
              }
            ],
            "npcs" => []
          },
          "locked_office" => {
            "locked" => true, "lockType" => "pin", "requires" => "9999",
            "connections" => { "south" => "lobby" },
            "objects" => [
              # Item behind a locked door — must not be takeable without unlocking
              { "id" => "office_key", "type" => "key", "key_id" => "master_key",
                "name" => "Office Key", "takeable" => true }
            ]
          },
          "server_room" => {
            "locked" => true, "lockType" => "password", "requires" => "r00t",
            "connections" => { "south" => "lobby" },
            "objects" => []
          }
        }
      }
    end

    # Set up a collect_items task with maxProgress=3
    def setup_collect_task
      @game.scenario_data["objectives"] = [{
        "aimId" => "aim_evidence",
        "title" => "Gather evidence",
        "tasks" => [{
          "taskId"      => "task_collect",
          "type"        => "collect_items",
          "title"       => "Collect 3 items",
          "maxProgress" => 3
        }]
      }]
      @game.player_state["objectivesState"] = {
        "aims"  => { "aim_evidence" => { "status" => "active" } },
        "tasks" => { "task_collect" => { "status" => "active", "progress" => 0 } }
      }
      @game.save!
    end

    # Set up a collect_items task with specific targetItemIds (server-validated)
    def setup_collect_task_with_specific_items
      @game.scenario_data["objectives"] = [{
        "aimId" => "aim_specific",
        "title" => "Collect specific documents",
        "tasks" => [{
          "taskId"        => "task_collect_specific",
          "type"          => "collect_items",
          "title"         => "Collect 2 specific documents",
          "targetCount"   => 2,
          "targetItemIds" => ["secret_doc", "classified"]
        }]
      }]
      @game.player_state["objectivesState"] = {
        "aims"  => { "aim_specific" => { "status" => "active" } },
        "tasks" => { "task_collect_specific" => { "status" => "active" } }
      }
      @game.save!
    end

    # Set up an unlock_room task targeting locked_office
    def setup_unlock_room_task
      @game.scenario_data["objectives"] = [{
        "aimId" => "aim_office",
        "title" => "Get into the office",
        "tasks" => [{
          "taskId"     => "task_unlock",
          "type"       => "unlock_room",
          "title"      => "Unlock the office",
          "targetRoom" => "locked_office"
        }]
      }]
      @game.player_state["objectivesState"] = {
        "aims"  => { "aim_office" => { "status" => "active" } },
        "tasks" => { "task_unlock" => { "status" => "active", "progress" => 0 } }
      }
      @game.save!
    end

    # Set up an unlock_object task targeting lobby_safe
    def setup_unlock_object_task
      @game.scenario_data["objectives"] = [{
        "aimId" => "aim_safe",
        "title" => "Open the safe",
        "tasks" => [{
          "taskId"       => "task_unlock_safe",
          "type"         => "unlock_object",
          "title"        => "Unlock the lobby safe",
          "targetObject" => "lobby_safe"
        }]
      }]
      @game.player_state["objectivesState"] = {
        "aims"  => { "aim_safe" => { "status" => "active" } },
        "tasks" => { "task_unlock_safe" => { "status" => "active" } }
      }
      @game.save!
    end

    # Set up a submit_flags task requiring 3 flags
    def setup_submit_flags_task
      @game.scenario_data["objectives"] = [{
        "aimId" => "aim_flags",
        "title" => "Capture all flags",
        "tasks" => [{
          "taskId"      => "task_flags",
          "type"        => "submit_flags",
          "title"       => "Submit all 3 flags",
          "targetFlags" => ["flag_admin", "flag_database", "flag_network"]
        }]
      }]
      @game.player_state["objectivesState"] = {
        "aims"  => { "aim_flags" => { "status" => "active" } },
        "tasks" => { "task_flags" => { "status" => "active", "submittedFlags" => [] } }
      }
      @game.save!
    end

    # Set up an npc_conversation task
    def setup_npc_conversation_task
      @game.scenario_data["objectives"] = [{
        "aimId" => "aim_intel",
        "title" => "Gather intelligence",
        "tasks" => [{
          "taskId"    => "task_talk_guard",
          "type"      => "npc_conversation",
          "title"     => "Talk to the guard",
          "targetNPC" => "guard"
        }]
      }]
      @game.player_state["objectivesState"] = {
        "aims"  => { "aim_intel" => { "status" => "active" } },
        "tasks" => { "task_talk_guard" => { "status" => "active" } }
      }
      @game.save!
    end

    # Set up an enter_room task
    def setup_enter_room_task
      @game.scenario_data["objectives"] = [{
        "aimId" => "aim_explore",
        "title" => "Explore the office",
        "tasks" => [{
          "taskId"     => "task_enter_office",
          "type"       => "enter_room",
          "title"      => "Enter the office",
          "targetRoom" => "locked_office"
        }]
      }]
      @game.player_state["objectivesState"] = {
        "aims"  => { "aim_explore" => { "status" => "active" } },
        "tasks" => { "task_enter_office" => { "status" => "active" } }
      }
      @game.save!
    end

    # Set up a custom task
    def setup_custom_task
      @game.scenario_data["objectives"] = [{
        "aimId" => "aim_story",
        "title" => "Progress the story",
        "tasks" => [{
          "taskId" => "task_custom",
          "type"   => "custom",
          "title"  => "Complete story event"
        }]
      }]
      @game.player_state["objectivesState"] = {
        "aims"  => { "aim_story" => { "status" => "active" } },
        "tasks" => { "task_custom" => { "status" => "active" } }
      }
      @game.save!
    end

    # Set up an aim with multiple tasks to test aim completion
    def setup_multi_task_aim
      @game.scenario_data["objectives"] = [{
        "aimId" => "aim_multi",
        "title" => "Complete multiple objectives",
        "tasks" => [
          {
            "taskId"     => "task_unlock",
            "type"       => "unlock_room",
            "title"      => "Unlock the office",
            "targetRoom" => "locked_office"
          },
          {
            "taskId"      => "task_collect_one",
            "type"        => "collect_items",
            "title"       => "Collect 1 item",
            "maxProgress" => 1
          }
        ]
      }]
      @game.player_state["objectivesState"] = {
        "aims"  => { "aim_multi" => { "status" => "active" } },
        "tasks" => {
          "task_unlock" => { "status" => "active" },
          "task_collect_one" => { "status" => "active", "progress" => 0 }
        }
      }
      @game.save!
    end
  end

  # =========================================================================
  # Mission Conclusion — server-side concludeRequires gate
  # =========================================================================
  class MissionConclusionSecurityTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    PLAYER_STATE = {
      "currentRoom"      => "lobby",
      "unlockedRooms"    => ["lobby"],
      "unlockedObjects"  => [],
      "inventory"        => [],
      "encounteredNPCs"  => [],
      "globalVariables"  => {},
      "biometricSamples" => [],
      "biometricUnlocks" => [],
      "bluetoothDevices" => [],
      "notes"            => [],
      "health"           => 100
    }.freeze

    CONCLUSION_SCENARIO = {
      "startRoom" => "lobby",
      "rooms" => { "lobby" => { "locked" => false, "connections" => {}, "objects" => [] } },
      "objectives" => [
        {
          "aimId" => "prerequisite_aim",
          "title" => "Do the prep work",
          "status" => "active",
          "order" => 0,
          "tasks" => [
            { "taskId" => "npc_prep_task", "title" => "Meet the handler",
              "type" => "npc_conversation", "targetNPC" => "handler_npc", "status" => "active" }
          ]
        },
        {
          "aimId" => "conclusion_aim",
          "title" => "Close the mission",
          "status" => "active",
          "order" => 1,
          "missionConclusion" => true,
          # concludeRequires is the ending gate: the work a player must not be
          # able to skip. Story tasks are deliberately absent from it -- story
          # progress is scored, and must never withhold the ending.
          "concludeRequires" => { "tasksCompleted" => ["npc_prep_task"] },
          "conclusionScreen" => { "type" => "end_screen" },
          "tasks" => [
            { "taskId" => "close_task", "title" => "Close", "type" => "custom", "status" => "active" }
          ]
        }
      ]
    }.freeze

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @player  = break_escape_demo_users(:test_user)
      @game = BreakEscape::Game.create!(
        mission:       @mission,
        player:        @player,
        scenario_data: CONCLUSION_SCENARIO.deep_dup,
        player_state:  PLAYER_STATE.deep_dup
      )
    end

    # T5: the concludeRequires gate blocks conclusion but the task still succeeds
    test "SECURITY: conclusion task blocked when concludeRequires not satisfied" do
      post complete_task_game_url(@game, task_id: 'close_task')
      assert_response :success
      json = JSON.parse(response.body)
      assert_equal true,  json['success']
      assert_equal false, json['missionConcluded']
      assert json['warning'].present?, "Response should include a warning when conclusion gate is blocked"
    end

    # T6: warning message is present in HTTP response body (not an error)
    test "SECURITY: rejection response includes human-readable error message" do
      post complete_task_game_url(@game, task_id: 'close_task')
      assert_response :success
      json = JSON.parse(response.body)
      assert json['warning'].present?
      assert_nil json['error']
    end

    # T7: conclusion task succeeds once prerequisites are met
    test "conclusion task succeeds when concludeRequires are all completed" do
      # Satisfy the prerequisite by recording NPC encounter then completing task
      @game.player_state['encounteredNPCs'] << 'handler_npc'
      @game.save!
      post complete_task_game_url(@game, task_id: 'npc_prep_task')
      assert_response :success

      post complete_task_game_url(@game, task_id: 'close_task')
      assert_response :success
      json = JSON.parse(response.body)
      assert json['success']
    end

    # T8: mission_concluded_at not written until prerequisites satisfied
    test "SECURITY: mission_concluded_at is nil when concludeRequires gate fails" do
      post complete_task_game_url(@game, task_id: 'close_task')
      assert_nil @game.reload.mission_concluded_at
    end
  end

  # =========================================================================
  # Flag Station vs Launch Device — cross-submission ownership bug
  #
  # A flag that belongs to a launch-device room object must NOT be accepted at
  # a flag-station, and vice versa. The `stationId` param is the client's way
  # of telling the server which device the player is interacting with; the
  # server must verify that the submitted flag actually belongs to that device.
  #
  # BUG: find_flag_station_for_flag only checks obj['type'] == 'flag-station'
  # in the primary room-object search, so launch-device objects in rooms are
  # invisible to it. When it returns nil the ownership check is silently
  # skipped, the wrong station accepts the flag, and the launch device later
  # rejects it as "already submitted".
  # =========================================================================
  class FlagStationLaunchDeviceOwnershipTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    LAUNCH_FLAG    = "flag{launch-secret}".freeze
    DROPSITE_FLAG  = "flag{dropsite-easy}".freeze
    LAUNCH_STATION = "launch1".freeze
    DROP_STATION   = "dropsite".freeze

    PLAYER_STATE = {
      "currentRoom"      => "lobby",
      "unlockedRooms"    => ["lobby"],
      "unlockedObjects"  => [],
      "inventory"        => [],
      "encounteredNPCs"  => [],
      "globalVariables"  => {},
      "biometricSamples" => [],
      "biometricUnlocks" => [],
      "bluetoothDevices" => [],
      "notes"            => [],
      "health"           => 100,
      # Both flags are valid game flags so submit_flag doesn't reject them as
      # "Invalid flag" before the ownership check even runs.
      "standalone_flags" => [LAUNCH_FLAG, DROPSITE_FLAG]
    }.freeze

    SCENARIO = {
      "startRoom" => "lobby",
      "rooms" => {
        "lobby" => {
          "locked"      => false,
          "connections" => {},
          "objects" => [
            # A normal flag drop-site — only owns DROPSITE_FLAG
            {
              "id"         => DROP_STATION,
              "type"       => "flag-station",
              "name"       => "Drop Site",
              "acceptsVms" => [],
              "flags"      => [DROPSITE_FLAG]
            },
            # A launch device in the same room — owns LAUNCH_FLAG
            {
              "id"         => LAUNCH_STATION,
              "type"       => "launch-device",
              "name"       => "Launch Device",
              "acceptsVms" => [],
              "flags"      => [LAUNCH_FLAG]
            }
          ],
          "npcs" => []
        }
      }
    }.freeze

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @player  = break_escape_demo_users(:test_user)
      @game = Game.create!(
        mission:       @mission,
        player:        @player,
        scenario_data: SCENARIO.deep_dup,
        player_state:  PLAYER_STATE.deep_dup
      )
    end

    # -------------------------------------------------------------------------
    # Happy paths — each flag accepted at its own station
    # -------------------------------------------------------------------------

    test "launch-device flag is accepted at the launch device" do
      post flags_game_url(@game), params: { flag: LAUNCH_FLAG, stationId: LAUNCH_STATION }
      assert_response :success
      json = JSON.parse(response.body)
      assert_equal true, json["success"],
        "Launch-device flag should be accepted when submitted at the launch device"
    end

    test "flag-station flag is accepted at the flag station" do
      post flags_game_url(@game), params: { flag: DROPSITE_FLAG, stationId: DROP_STATION }
      assert_response :success
      json = JSON.parse(response.body)
      assert_equal true, json["success"],
        "Drop-site flag should be accepted when submitted at the flag station"
    end

    # -------------------------------------------------------------------------
    # Cross-submission rejection — the bug under test
    # -------------------------------------------------------------------------

    test "SECURITY: launch-device flag submitted at flag-station is rejected" do
      post flags_game_url(@game), params: { flag: LAUNCH_FLAG, stationId: DROP_STATION }
      json = JSON.parse(response.body)
      assert_equal false, json["success"],
        "Launch-device flag must be rejected when submitted at the flag-station"
    end

    test "SECURITY: launch-device flag remains usable after a rejected cross-station attempt" do
      # Attempt (correctly rejected) at the wrong station
      post flags_game_url(@game), params: { flag: LAUNCH_FLAG, stationId: DROP_STATION }

      # Must still succeed at the correct station
      post flags_game_url(@game), params: { flag: LAUNCH_FLAG, stationId: LAUNCH_STATION }
      json = JSON.parse(response.body)
      assert_equal true, json["success"],
        "Launch-device flag must still work at its correct station after a rejected attempt elsewhere"
    end

    test "flag-station flag submitted at launch device is rejected" do
      post flags_game_url(@game), params: { flag: DROPSITE_FLAG, stationId: LAUNCH_STATION }
      json = JSON.parse(response.body)
      assert_equal false, json["success"],
        "Drop-site flag should be rejected when submitted at the launch device"
    end
  end
end
