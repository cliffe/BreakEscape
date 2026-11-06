require 'test_helper'

module BreakEscape
  class ScoreBreakdownTest < ActiveSupport::TestCase
    # Lets a test give any Mission (including ones the bulk path loads afresh) a
    # mission.json, keyed by mission name.
    module MetadataOverride
      OVERRIDES = {}
      def load_mission_metadata
        OVERRIDES.key?(name) ? OVERRIDES[name] : super
      end
    end
    Mission.prepend(MetadataOverride)

    # 9 tasks over 4 aims: 7 required, 2 optional; 4 server-checked, 5 browser-trusted.
    SCENARIO = {
      "startRoom" => "lobby",
      "rooms" => {
        "lobby" => { "type" => "room_reception", "objects" => [
          { "id" => "safe", "name" => "Safe", "lockType" => "pin", "requires" => "1234" },
          { "id" => "reader", "name" => "Badge reader", "lockType" => "rfid" }
        ] },
        "vault" => { "type" => "room_office", "locked" => true, "lockType" => "password", "requires" => "pw" },
        "lab" => { "type" => "room_office", "locked" => true, "lockType" => "biometric" }
      },
      "objectives" => [
        { "aimId" => "a1", "title" => "A1", "status" => "active", "order" => 0, "tasks" => [
          { "taskId" => "t_custom", "title" => "Custom", "type" => "custom", "status" => "active" },
          { "taskId" => "t_enter", "title" => "Enter", "type" => "enter_room", "targetRoom" => "lobby", "status" => "active" }
        ] },
        { "aimId" => "a2", "title" => "A2", "status" => "active", "order" => 1, "tasks" => [
          { "taskId" => "t_vault", "title" => "Vault", "type" => "unlock_room", "targetRoom" => "vault", "status" => "active" },
          { "taskId" => "t_lab", "title" => "Lab", "type" => "unlock_room", "targetRoom" => "lab", "status" => "active", "optional" => true },
          { "taskId" => "t_safe", "title" => "Safe", "type" => "unlock_object", "targetObject" => "safe", "status" => "active" },
          { "taskId" => "t_reader", "title" => "Reader", "type" => "unlock_object", "targetObject" => "Badge reader", "status" => "active" }
        ] },
        { "aimId" => "a3", "title" => "A3", "status" => "active", "order" => 2, "tasks" => [
          { "taskId" => "t_talk", "title" => "Talk", "type" => "npc_conversation", "targetNPC" => "gary", "status" => "active" },
          { "taskId" => "t_items", "title" => "Items", "type" => "collect_items", "targetItems" => ["key"], "targetCount" => 1,
            "status" => "active", "optional" => true }
        ] },
        { "aimId" => "a4", "title" => "A4", "status" => "active", "order" => 3, "missionConclusion" => true,
          "tasks" => [{ "taskId" => "t_end", "title" => "End", "type" => "custom", "status" => "active" }] }
      ]
    }.freeze

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @player = break_escape_demo_users(:test_user)
    end

    teardown do
      MetadataOverride::OVERRIDES.clear
    end

    def new_game(scenario: SCENARIO, mission: @mission, globals: {}, tasks: {}, aims: {})
      Game.create!(
        mission: mission, player: @player, scenario_data: scenario.deep_dup,
        player_state: {
          "currentRoom" => "lobby", "unlockedRooms" => ["lobby"], "unlockedObjects" => [],
          "inventory" => [], "encounteredNPCs" => [], "globalVariables" => globals,
          "biometricSamples" => [], "biometricUnlocks" => [], "bluetoothDevices" => [],
          "notes" => [], "health" => 100,
          "objectivesState" => { "aims" => aims, "tasks" => tasks, "itemCounts" => {} }
        }
      )
    end

    def done(*ids)
      ids.to_h { |id| [id, { "status" => "completed" }] }
    end

    # --- objectives ----------------------------------------------------------

    test "a fresh game counts every task, required and optional" do
      b = new_game.score_breakdown
      assert_equal false, b[:complete]
      assert_equal false, b[:ended]
      assert_equal({ done: 0, total: 9, required_done: 0, required_total: 7,
                     optional_done: 0, optional_total: 2, skipped: 0, share: 0.0 }, b[:objectives])
      assert_equal({ done: 0, total: 4 }, b[:aims])
      assert_nil b[:result]
    end

    test "done counts come from the saved task states, not the tasks_completed column" do
      game = new_game(tasks: done("t_custom", "t_lab", "t_vault"))
      game.update_columns(tasks_completed: 99) # a drifted counter
      o = game.score_breakdown[:objectives]
      assert_equal 3, o[:done]
      assert_equal 2, o[:required_done]
      assert_equal 1, o[:optional_done]
      assert_in_delta 33.3, o[:share], 0.05
    end

    test "skipped tasks count as skipped, not done" do
      game = new_game(tasks: { "t_safe" => { "status" => "skipped" }, "t_custom" => { "status" => "completed" } })
      o = game.score_breakdown[:objectives]
      assert_equal 1, o[:done]
      assert_equal 1, o[:skipped]
    end

    test "aims done come from the saved aim states" do
      game = new_game(aims: { "a1" => { "status" => "completed" }, "a2" => { "status" => "active" } })
      assert_equal({ done: 1, total: 4 }, game.score_breakdown[:aims])
    end

    test "complete and ended follow mission_concluded_at, not status" do
      game = new_game
      game.update!(status: "completed") # Hacktivity's Finish button
      assert_equal [false, true], game.score_breakdown.values_at(:complete, :ended)
      game.update!(mission_concluded_at: Time.current)
      b = game.score_breakdown
      assert_equal [true, false], b.values_at(:complete, :ended)
      assert_not_nil b[:concluded_at]
    end

    # --- verified ------------------------------------------------------------

    test "verified counts server-checked task types and locks, and separates the browser-trusted ones" do
      # Server-checked: t_vault (password lock), t_safe (pin lock), t_talk, t_items.
      # Browser-trusted: t_custom, t_enter, t_lab (biometric lock), t_reader (rfid lock), t_end.
      b = new_game.score_breakdown
      assert_equal 4, b[:verified][:total]
      assert_equal 5, b[:verified][:trusted_total]
      assert_equal %w[t_vault t_safe t_talk], b[:verified][:required_missing]
    end

    test "verified done counts completed server-checked tasks only" do
      game = new_game(tasks: done("t_vault", "t_items", "t_reader", "t_custom"))
      v = game.score_breakdown[:verified]
      assert_equal 2, v[:done]
      assert_equal 2, v[:trusted_done]
      assert_equal %w[t_safe t_talk], v[:required_missing]
    end

    test "an unlock task whose lock is not in the scenario counts as server-checked" do
      scenario = SCENARIO.deep_dup
      scenario["rooms"] = {}
      v = new_game(scenario: scenario).score_breakdown[:verified]
      assert_equal 6, v[:total] # t_lab and t_reader are no longer known to be browser-trusted
      assert_equal 3, v[:trusted_total]
    end

    # --- check_this ----------------------------------------------------------

    test "check_this: concluded with a required server-checked task missing" do
      game = new_game(tasks: done("t_custom", "t_end"))
      assert_equal false, game.score_breakdown[:check_this], "not concluded yet"
      game.update!(mission_concluded_at: Time.current)
      assert_equal true, game.score_breakdown[:check_this]
    end

    test "check_this: not set when the missing task is optional, skipped, or browser-trusted" do
      game = new_game(tasks: done("t_vault", "t_safe", "t_talk")) # optional and browser-trusted tasks still open
      game.update!(mission_concluded_at: Time.current)
      assert_equal false, game.score_breakdown[:check_this]

      skipped = new_game(tasks: done("t_vault", "t_talk").merge("t_safe" => { "status" => "skipped" }))
      skipped.update!(mission_concluded_at: Time.current)
      assert_equal false, skipped.score_breakdown[:check_this]
    end

    # --- result --------------------------------------------------------------

    def with_result_mission(meta)
      mission = Mission.create!(name: "score_test_#{SecureRandom.hex(3)}", display_name: "Score test")
      MetadataOverride::OVERRIDES[mission.name] = meta
      mission
    end

    test "result reads resultGlobal, the sibling report rate and the complete flag" do
      mission = with_result_mission("resultGlobal" => "triage_pre_percent", "stage" => "pre")
      game = new_game(mission: mission, globals: { "triage_pre_percent" => 80, "triage_pre_reportRate" => 0.6, "triage_pre_complete" => true })
      assert_equal({ percent: 80, report_rate: 0.6, stage: "pre", recorded: true, consistent: nil }, game.score_breakdown[:result])
    end

    test "result falls back to the legacy done flag" do
      mission = with_result_mission("resultGlobal" => "triage_post_percent")
      game = new_game(mission: mission, globals: { "triage_post_percent" => 55, "triage_post_done" => true })
      r = game.score_breakdown[:result]
      assert_equal true, r[:recorded]
      assert_equal "post", r[:stage], "stage is read from the global's name when mission.json has none"
      assert_equal false, new_game(mission: mission, globals: { "triage_post_percent" => 55 }).score_breakdown[:result][:recorded]
    end

    test "result clamps the percent and the report rate" do
      mission = with_result_mission("resultGlobal" => "episode_x_defend_percent", "stage" => "episode")
      high = new_game(mission: mission, globals: { "episode_x_defend_percent" => 140, "episode_x_defend_reportRate" => 3 })
      low = new_game(mission: mission, globals: { "episode_x_defend_percent" => -5 })
      assert_equal [100, 1.0], high.score_breakdown[:result].values_at(:percent, :report_rate)
      assert_equal [0, 0.0], low.score_breakdown[:result].values_at(:percent, :report_rate)
    end

    test "result: a declared but unset global reads as 0 and not recorded" do
      mission = with_result_mission("resultGlobal" => "triage_pre_percent")
      assert_equal({ percent: 0, report_rate: 0.0, stage: "pre", recorded: false, consistent: nil },
                   new_game(mission: mission).score_breakdown[:result])
    end

    test "result consistent compares with the latest record block of the same stage" do
      mission = with_result_mission("resultGlobal" => "triage_pre_percent", "stage" => "pre")
      records = [
        { "stage" => "post", "setId" => "s", "percent" => 10, "at" => "2026-10-01T10:00:00Z" },
        { "stage" => "pre", "setId" => "a", "percent" => 50, "at" => "2026-10-01T09:00:00Z" },
        { "stage" => "pre", "setId" => "b", "percent" => 80, "at" => "2026-10-02T09:00:00Z" }
      ]
      ok = new_game(mission: mission, globals: { "triage_pre_percent" => 80, "se_awareness_records" => records })
      off = new_game(mission: mission, globals: { "triage_pre_percent" => 70, "se_awareness_records" => records })
      assert_equal true, ok.score_breakdown[:result][:consistent]
      assert_equal false, off.score_breakdown[:result][:consistent]
    end

    test "a mission with no resultGlobal has no result, and a bad name is ignored" do
      assert_nil new_game.score_breakdown[:result]
      mission = with_result_mission("resultGlobal" => "not a global!")
      assert_nil new_game(mission: mission).score_breakdown[:result]
    end

    # --- mission flags -------------------------------------------------------

    test "timed, ending_check and mission_scoring come from mission.json" do
      assert_equal [false, true, "tasks"], new_game.score_breakdown.values_at(:timed, :ending_check, :mission_scoring)
      mission = with_result_mission("endingCheck" => false, "scoring" => "completion")
      assert_equal [true, false, "completion"], new_game(mission: mission).score_breakdown.values_at(:timed, :ending_check, :mission_scoring)
    end

    # --- bulk ----------------------------------------------------------------

    test "score_breakdowns matches score_breakdown for each game" do
      mission = with_result_mission("resultGlobal" => "triage_pre_percent", "stage" => "pre")
      games = [
        new_game,
        new_game(tasks: done("t_vault", "t_lab", "t_custom"), aims: { "a1" => { "status" => "completed" } }),
        new_game(mission: mission, globals: { "triage_pre_percent" => 66, "triage_pre_complete" => true }),
        new_game(tasks: done("t_end")).tap { |g| g.update!(mission_concluded_at: Time.current, status: "completed") }
      ]
      bulk = Game.score_breakdowns(Game.where(id: games.map(&:id)))
      assert_equal games.map(&:id).sort, bulk.keys.sort
      games.each do |game|
        single = game.reload.score_breakdown
        assert_equal single.except(:concluded_at), bulk[game.id].except(:concluded_at), "game #{game.id}"
        assert_equal single[:concluded_at].to_i, bulk[game.id][:concluded_at].to_i
      end
    end

    test "score_breakdowns runs a fixed number of queries however many games" do
      small = Array.new(2) { new_game }
      count = lambda do |ids|
        n = 0
        counter = ->(*, payload) { n += 1 unless payload[:name] == "SCHEMA" || payload[:cached] }
        ActiveSupport::Notifications.subscribed(counter, "sql.active_record") { Game.score_breakdowns(Game.where(id: ids)) }
        n
      end
      two = count.call(small.map(&:id))
      more = small + Array.new(6) { new_game }
      assert_equal two, count.call(more.map(&:id))
      assert_operator two, :<=, 2
    end

    # --- policy scores -------------------------------------------------------

    test "policy_score for each policy" do
      mission = with_result_mission("resultGlobal" => "triage_post_percent", "scoring" => "completion")
      progress = new_game(mission: mission, tasks: done("t_custom", "t_vault", "t_safe"),
                          globals: { "triage_post_percent" => 72 })
      progress.update_columns(tasks_completed: 3, total_tasks: 9, objectives_completed: 1, total_aims: 4)
      raw = 70.0 * 3 / 9 + 30.0 * 1 / 4
      assert_in_delta raw, progress.policy_score("objectives"), 0.001
      assert_in_delta raw, progress.policy_score("completion"), 0.001
      assert_in_delta raw, progress.policy_score("completion_objectives"), 0.001
      assert_equal 0.0, progress.policy_score("awareness")
      assert_equal 0.0, progress.policy_score("task_completion"), "the mission's own mode here is completion"

      progress.update_columns(tasks_completed: 9, objectives_completed: 4) # raw 100, not concluded
      assert_equal 99.0, progress.policy_score("completion")
      assert_in_delta 100.0, progress.policy_score("objectives"), 0.001

      progress.update!(mission_concluded_at: Time.current, status: "completed")
      %w[completion completion_objectives awareness task_completion].each do |policy|
        assert_equal 100.0, progress.policy_score(policy), policy
      end
      assert_equal 100.0, progress.policy_score("awareness", pass_percent: 72)
      assert_equal 0.0, progress.policy_score("awareness", pass_percent: 73)
    end

    test "task_completion is calculate_task_score and objectives is raw_task_score" do
      game = new_game
      game.update_columns(tasks_completed: 5, total_tasks: 9, objectives_completed: 2, total_aims: 4)
      assert_in_delta game.calculate_task_score, game.policy_score("task_completion"), 0.0001
      assert_in_delta game.raw_task_score, game.policy_score("objectives"), 0.0001
    end

    test "flags is the VM set score and an unknown policy raises" do
      game = new_game
      assert_equal 0.0, game.policy_score("flags"), "no VM set (standalone)"
      vm_set = Struct.new(:score).new(42.5)
      game.define_singleton_method(:vm_set) { vm_set }
      assert_equal 42.5, game.policy_score("flags")
      assert_raises(ArgumentError) { game.policy_score("nonsense") }
    end

    test "rank_letter uses the share of objectives done" do
      { 100 => "A", 90 => "A", 89.9 => "B", 75 => "B", 74 => "C", 50 => "C", 49 => "D", 0 => "D" }.each do |percent, letter|
        assert_equal letter, Game.rank_letter(percent), percent.to_s
      end
    end
  end
end
