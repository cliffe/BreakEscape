require 'test_helper'

module BreakEscape
  class GamesControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @player = break_escape_demo_users(:test_user)
      PlayerPreference.find_or_create_by!(player: @player) do |pref|
        pref.selected_sprite = 'female_spy'
        pref.in_game_name    = 'TestAgent'
      end

      @game = Game.create!(
        mission: @mission,
        player: @player,
        scenario_data: {
          'startRoom' => 'reception',
          'startItemsInInventory' => [
            {
              'type' => 'lockpick',
              'name' => 'Lockpick',
              'id' => 'lockpick_1',
              'takeable' => true
            }
          ],
          'rooms' => {
            'reception' => {
              'type' => 'room_reception',
              'connections' => { 'north' => 'office' },
              'locked' => false,
              'objects' => []
            },
            'office' => {
              'type' => 'office',
              'connections' => { 'south' => 'reception' },
              'locked' => true,
              'lockType' => 'pin',
              'requires' => '1234',
              'objects' => []
            }
          }
        },
        player_state: {
          'currentRoom' => 'reception',
          'unlockedRooms' => ['reception'],
          'unlockedObjects' => [],
          'inventory' => [],
          'encounteredNPCs' => [],
          'globalVariables' => {},
          'biometricSamples' => [],
          'biometricUnlocks' => [],
          'bluetoothDevices' => [],
          'notes' => [],
          'health' => 100
        }
      )
    end

    # ─── Avatar / configuration guard ───────────────────────────────────────

    test 'show redirects to configuration when player has no avatar selected' do
      PlayerPreference.find_by(player: @player).update_column(:selected_sprite, nil)
      get game_url(@game)
      assert_redirected_to configuration_url(game_id: @game.id)
    end

    test "show redirects to configuration when selected avatar is excluded by the scenario's validSprites" do
      # @player has female_spy; a male_* restriction excludes it
      restricted_game = Game.create!(
        mission: @mission,
        player: @player,
        scenario_data: @game.scenario_data.merge('validSprites' => ['male_*']),
        player_state: @game.player_state.dup
      )
      get game_url(restricted_game)
      assert_redirected_to configuration_url(game_id: restricted_game.id)
    end

    test "show succeeds when selected avatar matches the scenario's validSprites" do
      permitted_game = Game.create!(
        mission: @mission,
        player: @player,
        scenario_data: @game.scenario_data.merge('validSprites' => ['female_*']),
        player_state: @game.player_state.dup
      )
      get game_url(permitted_game)
      assert_response :success
    end

    # ─── Game show ───────────────────────────────────────────────────────────

    test 'should show game' do
      get game_url(@game)
      assert_response :success
    end

    test 'show should return HTML with game container' do
      get game_url(@game)
      assert_response :success
      assert_select '#game-container'
      assert_match(/window\.breakEscapeConfig/, response.body)
    end

    test 'show should inject game configuration' do
      get game_url(@game)
      assert_response :success

      # Check that config is in the page
      assert_match(/gameId.*#{@game.id}/, response.body)
      assert_match(/apiBasePath/, response.body)
      assert_match(/csrfToken/, response.body)
    end

    test 'scenario endpoint should return JSON' do
      get scenario_game_url(@game)
      assert_response :success
      assert_equal 'application/json', @response.media_type

      json = JSON.parse(@response.body)
      assert json['startRoom']
      assert json['rooms']
    end

    test 'sync_state should update player state for current room' do
      put sync_state_game_url(@game), params: {
        currentRoom: 'reception'
      }

      assert_response :success
      json = JSON.parse(@response.body)
      assert json['success']

      @game.reload
      assert_equal 'reception', @game.player_state['currentRoom']
    end

    test 'SECURITY: sync_state rejects teleport to locked room' do
      # 'office' is locked and not in unlockedRooms; player is in 'reception'
      put sync_state_game_url(@game), params: { currentRoom: 'office' }

      assert_response :forbidden
      json = JSON.parse(@response.body)
      assert_equal false, json['success']
      assert_match(/locked room/i, json['message'])

      @game.reload
      assert_equal 'reception', @game.player_state['currentRoom'],
                   'Player should still be in reception after rejected teleport'
      assert_not_includes @game.player_state['unlockedRooms'], 'office'
    end

    test 'SECURITY: submittedFlags pre-injection via update_task_progress is blocked' do
      # Build a game that has a submit_flags objective task.
      # Abandon @game first so the unique partial index allows the new in_progress record.
      @game.update!(status: 'abandoned')
      target_flags = ['FLAG{s3cr3t_capture}']
      flagged_game = Game.create!(
        mission: @mission,
        player: @player,
        scenario_data: @game.scenario_data.merge(
          'objectives' => [
            {
              'aimId' => 'ctf',
              'title' => 'Capture the Flag',
              'tasks' => [
                {
                  'taskId' => 'submit_flag_1',
                  'type' => 'submit_flags',
                  'title' => 'Submit the flag',
                  'targetFlags' => target_flags
                }
              ]
            }
          ]
        ),
        player_state: @game.player_state.dup
      )

      # Step 1: Attacker pre-injects correct flags via update_task_progress
      put update_task_progress_game_url(flagged_game, task_id: 'submit_flag_1'),
          params: { progress: 1, submittedFlags: target_flags }
      assert_response :success

      # Verify flags are stored (the vector exists in the DB)
      flagged_game.reload
      stored_flags = flagged_game.player_state.dig('objectivesState', 'tasks', 'submit_flag_1', 'submittedFlags')
      assert_equal target_flags, stored_flags, 'Pre-condition: flags should be stored in state'

      # Step 2: Attacker calls complete_task WITHOUT submittedFlags in the request body
      # The fix ensures stored flags are NOT used — this must fail
      post complete_task_game_url(flagged_game, task_id: 'submit_flag_1')

      assert_response :unprocessable_entity,
                      'complete_task without submittedFlags in body must fail (pre-injected stored flags must not be used)'
      json = JSON.parse(@response.body)
      assert_equal false, json['success']
      assert_match(/flag/i, json['error'])

      # Confirm the task was NOT marked complete
      flagged_game.reload
      task_status = flagged_game.player_state.dig('objectivesState', 'tasks', 'submit_flag_1', 'status')
      assert_not_equal 'completed', task_status,
                       'Task must remain incomplete when valid flags are omitted from the request body'
    end

    test 'unlock endpoint should reject invalid attempts' do
      post unlock_game_url(@game), params: {
        targetType: 'room',
        targetId: 'office',
        attempt: 'wrong_code',
        method: 'pin'
      }

      assert_response :unprocessable_entity
      json = JSON.parse(@response.body)
      assert_equal false, json['success']
      assert_equal 'Invalid attempt', json['message']
    end

    test 'game setup has correct scenario data' do
      # Verify the test setup is correct before running unlock tests
      assert @game.scenario_data['rooms']['office'].present?
      office = @game.scenario_data['rooms']['office']
      assert_equal true, office['locked']
      assert_equal 'pin', office['lockType']
      assert_equal '1234', office['requires']
    end

    test 'unlock endpoint should accept correct pin code' do
      # Debug: Check scenario before making request
      assert @game.scenario_data['rooms']['office']['requires'] == '1234',
             "Office room should require PIN 1234, but requires: #{@game.scenario_data['rooms']['office']['requires']}"

      post unlock_game_url(@game), params: {
        targetType: 'door',
        targetId: 'office',
        attempt: '1234',
        method: 'pin'
      }

      assert_response :success,
                      "Expected 200, got #{@response.status}. Response: #{response.body}"
      json = JSON.parse(@response.body)
      assert json['success'], "Response success should be true: #{json}"
      assert_equal 'door', json['type']
      assert json['roomData']

      @game.reload
      assert_includes @game.player_state['unlockedRooms'], 'office'
    end

    test 'inventory endpoint should add items' do
      # Create a test scenario that doesn't include the lockpick in starting items
      @game.scenario_data['startItemsInInventory'] = []
      @game.scenario_data['rooms']['reception']['objects'] = [
        {
          'id' => 'note_1',
          'type' => 'note',
          'name' => 'Test Note',
          'takeable' => true
        }
      ]
      @game.player_state['inventory'] = []
      @game.save!

      post inventory_game_url(@game), params: {
        action_type: 'add',
        item: { type: 'note', name: 'Test Note', id: 'note_1' }
      }

      assert_response :success
      json = JSON.parse(@response.body)
      assert json['success']
      assert_equal 1, json['inventory'].length

      @game.reload
      assert_equal 1, @game.player_state['inventory'].length
    end

    # Ink endpoint tests
    test 'ink endpoint should require npc parameter' do
      get ink_game_url(@game)
      assert_response :bad_request
      json = JSON.parse(response.body)
      assert_includes json['error'], 'npc'
    end

    test 'ink endpoint should return 404 for non-existent NPC' do
      get ink_game_url(@game), params: { npc: 'non-existent' }
      assert_response :not_found
    end

    test 'ink endpoint should return 404 for NPC without story file' do
      # Game doesn't have NPCs with story files by default
      get ink_game_url(@game), params: { npc: 'missing-npc' }
      assert_response :not_found
    end

    # ─── Security: flag answers must never reach the client ──────────────────

    SECRET_FLAGS = ['FLAG{s3cr3t_v4lu3}', 'FLAG{4n0th3r_fl4g}'].freeze

    def game_with_flag_objectives
      # Abandon the setup game so the unique partial index allows the new in_progress record.
      @game.update!(status: 'abandoned')
      Game.create!(
        mission: @mission,
        player: @player,
        scenario_data: @game.scenario_data.merge(
          'objectives' => [
            {
              'aimId' => 'capture_flag',
              'title' => 'Capture the Flag',
              'tasks' => [
                {
                  'taskId' => 'submit_flag_1',
                  'type' => 'submit_flags',
                  'title' => 'Submit the CTF flag',
                  'targetFlags' => SECRET_FLAGS
                }
              ]
            }
          ]
        ),
        player_state: @game.player_state.dup
      )
    end

    test 'SECURITY: scenario endpoint does not expose targetFlags' do
      game = game_with_flag_objectives
      get scenario_game_url(game)
      assert_response :success

      body = response.body
      SECRET_FLAGS.each do |flag|
        assert_not body.include?(flag),
                   "SECURITY: scenario endpoint must not leak flag answer '#{flag}'"
      end

      json = JSON.parse(body)
      json['objectives']&.each do |aim|
        aim['tasks']&.each do |task|
          assert_nil task['targetFlags'],
                     "targetFlags must be absent from /scenario response (task: #{task['taskId']})"
        end
      end
    end

    test 'SECURITY: objectives endpoint does not expose targetFlags' do
      game = game_with_flag_objectives
      get objectives_game_url(game)
      assert_response :success

      body = response.body
      SECRET_FLAGS.each do |flag|
        assert_not body.include?(flag),
                   "SECURITY: objectives endpoint must not leak flag answer '#{flag}'"
      end

      json = JSON.parse(body)
      json['objectives']&.each do |aim|
        aim['tasks']&.each do |task|
          assert_nil task['targetFlags'],
                     "targetFlags must be absent from /objectives response (task: #{task['taskId']})"
        end
      end
    end

    test 'SECURITY: scenario endpoint strips targetFlags but preserves other task fields' do
      game = game_with_flag_objectives
      get scenario_game_url(game)
      assert_response :success

      json = JSON.parse(response.body)
      task = json['objectives']&.first&.dig('tasks', 0)
      assert task, 'Task should be present in objectives'
      assert_equal 'submit_flag_1', task['taskId']
      assert_equal 'submit_flags',  task['type']
      assert_equal 'Submit the CTF flag', task['title']
      assert_nil task['targetFlags'], 'targetFlags must be stripped'
    end

    # ─── Reset action ──────────────────────────────────────────────────────────

    test 'reset resets player state to initial values' do
      @game.player_state['unlockedRooms'] = %w[reception office]
      @game.player_state['encounteredNPCs'] = ['guard']
      @game.save!

      post reset_game_url(@game)

      assert_response :success
      json = JSON.parse(response.body)
      assert json['success']

      @game.reload
      assert_equal ['reception'], @game.player_state['unlockedRooms'],
                   'unlockedRooms should be reset to start room only'
      assert_empty @game.player_state['encounteredNPCs']
    end

    test 'reset preserves VM context keys' do
      @game.player_state['vm_set_id'] = 42
      @game.player_state['standalone_flags'] = ['FLAG{test}']
      @game.player_state['unlockedRooms'] = %w[reception office]
      @game.save!

      post reset_game_url(@game)

      assert_response :success
      @game.reload
      assert_equal 42, @game.player_state['vm_set_id'], 'vm_set_id must be preserved'
      assert_equal ['FLAG{test}'], @game.player_state['standalone_flags']
      assert_equal ['reception'], @game.player_state['unlockedRooms'], 'progress must be reset'
    end

    test "SECURITY: reset rejects another player's game" do
      other_player = break_escape_demo_users(:other_user)
      other_game = Game.create!(
        mission: @mission,
        player: other_player,
        scenario_data: @game.scenario_data,
        player_state: @game.player_state.dup
      )
      original_state = other_game.player_state.dup

      # current_player in standalone test mode is always :test_user
      post reset_game_url(other_game)

      # ApplicationController rescue_from Pundit::NotAuthorizedError redirects to root
      assert_response :redirect
      other_game.reload
      assert_equal original_state['unlockedRooms'], other_game.player_state['unlockedRooms'],
                   "Other player's state must be unchanged after rejected reset"
    end

    # ─── New Session action ────────────────────────────────────────────────────

    test 'new_session creates a new game for the same mission' do
      post new_session_game_url(@game)

      assert_response :success
      json = JSON.parse(response.body)
      assert json['success']
      assert json['redirect_url'].present?

      new_id = json['redirect_url'].split('/').last.to_i
      new_game = Game.find(new_id)
      assert_equal @mission, new_game.mission
      assert_equal @player,  new_game.player
      assert_not_equal @game.id, new_game.id
    end

    test 'new_session preserves VM context from original game' do
      @game.player_state['vm_set_id'] = 99
      @game.player_state['standalone_flags'] = ['FLAG{preserved}']
      @game.save!

      post new_session_game_url(@game)

      assert_response :success
      json = JSON.parse(response.body)
      new_id = json['redirect_url'].split('/').last.to_i
      new_game = Game.find(new_id)
      assert_equal 99, new_game.player_state['vm_set_id'], 'vm_set_id must carry over'
      assert_equal ['FLAG{preserved}'], new_game.player_state['standalone_flags']
    end

    test "SECURITY: new_session rejects another player's game" do
      other_player = break_escape_demo_users(:other_user)
      other_game = Game.create!(
        mission: @mission,
        player: other_player,
        scenario_data: @game.scenario_data,
        player_state: @game.player_state.dup
      )

      post new_session_game_url(other_game)

      # ApplicationController rescue_from Pundit::NotAuthorizedError redirects to root
      assert_response :redirect
    end

    test 'SECURITY: requires field is absent from scenario response for pin-locked rooms' do
      get scenario_game_url(@game)
      assert_response :success

      json = JSON.parse(response.body)
      office = json.dig('rooms', 'office')
      assert office, 'Office room should be present in scenario'
      assert_nil office['requires'],
                 "SECURITY: 'requires' (PIN answer) must not be sent to the client for pin-locked rooms"
    end

    # ─── vm_panel / vm_set_panel: standalone mode guard ───────────────────────

    # ========================================================================
    # SECURITY TESTS: VM Console Access Enforcement
    # ========================================================================
    # These tests verify that the vm_panel endpoint enforces room-based access
    # controls to prevent players from skipping game narrative and directly
    # accessing VM consoles.

    test 'find_vm_launcher_room finds room containing vm-launcher for matching vm title' do
      controller = GamesController.new
      scenario = {
        'rooms' => {
          'server_room' => {
            'objects' => [
              { 'type' => 'vm-launcher', 'vm' => { 'title' => 'kali' } }
            ]
          },
          'start_room' => {
            'objects' => []
          }
        }
      }

      result = controller.send(:find_vm_launcher_room, scenario, 'kali')
      assert_equal 'server_room', result
    end

    test 'find_vm_launcher_room returns nil when vm title not found' do
      controller = GamesController.new
      scenario = {
        'rooms' => {
          'server_room' => {
            'objects' => [
              { 'type' => 'vm-launcher', 'vm' => { 'title' => 'ubuntu' } }
            ]
          }
        }
      }

      result = controller.send(:find_vm_launcher_room, scenario, 'kali')
      assert_nil result
    end

    test 'find_vm_launcher_room handles missing rooms gracefully' do
      controller = GamesController.new
      scenario = {}

      result = controller.send(:find_vm_launcher_room, scenario, 'kali')
      assert_nil result
    end

    test 'find_vm_launcher_room handles rooms without objects' do
      controller = GamesController.new
      scenario = {
        'rooms' => {
          'server_room' => {}
        }
      }

      result = controller.send(:find_vm_launcher_room, scenario, 'kali')
      assert_nil result
    end

    test 'SECURITY: room_unlocked? returns false for locked rooms' do
      game = Game.create!(
        mission: @mission,
        player: @player,
        scenario_data: @game.scenario_data,
        player_state: {
          'currentRoom' => 'reception',
          'unlockedRooms' => ['reception'], # only reception is unlocked
          'unlockedObjects' => []
        }
      )

      # office is NOT in unlockedRooms
      assert_not game.room_unlocked?('office'),
                 'room_unlocked? should return false for locked rooms'
    end

    test 'SECURITY: room_unlocked? returns true for start room' do
      game = Game.create!(
        mission: @mission,
        player: @player,
        scenario_data: @game.scenario_data,
        player_state: {
          'currentRoom' => 'reception',
          'unlockedRooms' => [], # empty
          'unlockedObjects' => []
        }
      )

      # reception is the start room
      assert game.room_unlocked?('reception'),
             'room_unlocked? should return true for start room even if not in unlockedRooms'
    end

    test 'SECURITY: room_unlocked? returns true for explicitly unlocked rooms' do
      game = Game.create!(
        mission: @mission,
        player: @player,
        scenario_data: @game.scenario_data,
        player_state: {
          'currentRoom' => 'reception',
          'unlockedRooms' => %w[reception office], # office is unlocked
          'unlockedObjects' => []
        }
      )

      assert game.room_unlocked?('office'),
             'room_unlocked? should return true for rooms in unlockedRooms'
    end

    test 'SECURITY: vm_panel gate blocks access when room not unlocked' do
      # This test documents the gate behavior:
      # The find_vm_launcher_room returns a room_id,
      # then room_unlocked? is called.
      # If room_unlocked? returns false, vm_panel returns 403 Forbidden.

      game = Game.create!(
        mission: @mission,
        player: @player,
        scenario_data: {
          'startRoom' => 'reception',
          'rooms' => {
            'reception' => { 'objects' => [] },
            'server_room' => {
              'objects' => [
                { 'type' => 'vm-launcher', 'vm' => { 'title' => 'kali' } }
              ]
            }
          }
        },
        player_state: {
          'currentRoom' => 'reception',
          'unlockedRooms' => ['reception'], # server_room NOT unlocked
          'unlockedObjects' => []
        }
      )

      controller = GamesController.new
      room_id = controller.send(:find_vm_launcher_room, game.scenario_data, 'kali')
      assert_equal 'server_room', room_id

      # The gate checks: if launcher_room_id && !game.room_unlocked?(launcher_room_id)
      assert_not game.room_unlocked?(room_id),
                 'Gate would block: room is found but not unlocked'
    end

    test 'SECURITY: vm_panel gate passes when room is unlocked' do
      # When find_vm_launcher_room returns a room AND room_unlocked? returns true,
      # the gate passes and console access is enabled.

      game = Game.create!(
        mission: @mission,
        player: @player,
        scenario_data: {
          'startRoom' => 'reception',
          'rooms' => {
            'reception' => { 'objects' => [] },
            'server_room' => {
              'objects' => [
                { 'type' => 'vm-launcher', 'vm' => { 'title' => 'kali' } }
              ]
            }
          }
        },
        player_state: {
          'currentRoom' => 'reception',
          'unlockedRooms' => %w[reception server_room], # server_room IS unlocked
          'unlockedObjects' => []
        }
      )

      controller = GamesController.new
      room_id = controller.send(:find_vm_launcher_room, game.scenario_data, 'kali')
      assert_equal 'server_room', room_id

      # The gate checks: if launcher_room_id && !game.room_unlocked?(launcher_room_id)
      # Since room_unlocked? returns true, the gate passes
      assert game.room_unlocked?(room_id),
             'Gate would pass: room is found and unlocked'
    end

    test 'SECURITY: vm_panel gate gracefully degrades when vm_launcher not in scenario' do
      # When find_vm_launcher_room returns nil (launcher not found),
      # the gate skips the check (returns nil is falsy in the if condition)
      # This allows non-standard scenarios to work.

      game = Game.create!(
        mission: @mission,
        player: @player,
        scenario_data: {
          'startRoom' => 'reception',
          'rooms' => {
            'reception' => { 'objects' => [] }
            # No server_room, no vm_launcher
          }
        },
        player_state: {
          'currentRoom' => 'reception',
          'unlockedRooms' => ['reception'],
          'unlockedObjects' => []
        }
      )

      controller = GamesController.new
      room_id = controller.send(:find_vm_launcher_room, game.scenario_data, 'kali')
      assert_nil room_id,
                 'find_vm_launcher_room returns nil when launcher not found'

      # Gate condition: if launcher_room_id && !game.room_unlocked?(launcher_room_id)
      # Since launcher_room_id is nil, the gate is skipped (no 403 returned)
    end

    # ========================================================================
    # STANDALONE MODE TESTS
    # ========================================================================

    test 'vm_panel returns 404 in standalone mode (hacktivity_mode? is false)' do
      # In the engine's test/dummy app, VmSet and FlagService are not defined,
      # so Mission.hacktivity_mode? returns false — both panel actions should 404.
      assert_not BreakEscape::Mission.hacktivity_mode?,
                 'Precondition: test/dummy must not have VmSet/FlagService defined'

      get vm_panel_game_url(@game)
      assert_response :not_found
    end

    test 'vm_set_panel returns 404 in standalone mode (hacktivity_mode? is false)' do
      assert_not BreakEscape::Mission.hacktivity_mode?,
                 'Precondition: test/dummy must not have VmSet/FlagService defined'

      get vm_set_panel_game_url(@game)
      assert_response :not_found
    end

    # ─── player_state row locking (lost-update race guard) ─────────────────────
    #
    # These endpoints read-modify-write @game.player_state then save!, with no
    # DB-level coordination otherwise. Two concurrent requests for the same
    # game (e.g. a scenario event firing several completeTask calls, or a
    # periodic sync_state landing next to a player action) can silently
    # overwrite each other's change. with_game_lock wraps these actions in
    # @game.with_lock so Postgres (production/staging) serializes them via
    # SELECT ... FOR UPDATE. We can't reliably exercise the actual locking
    # here — SQLite (the test DB) does not honor FOR UPDATE, so a threaded
    # race test against it would be flaky rather than meaningful — so instead
    # we assert the wiring itself is in place and hasn't silently regressed.

    test 'complete_task actually goes through Game#with_lock' do
      lock_calls = []
      Game.send(:define_method, :with_lock_spy) do |*args, &block|
        lock_calls << id
        with_lock_without_spy(*args, &block)
      end
      Game.send(:alias_method, :with_lock_without_spy, :with_lock)
      Game.send(:alias_method, :with_lock, :with_lock_spy)

      @game.scenario_data = @game.scenario_data.merge(
        'objectives' => [
          { 'aimId' => 'aim1', 'title' => 'Aim', 'tasks' => [
            { 'taskId' => 'task1', 'type' => 'custom', 'title' => 'Task' }
          ] }
        ]
      )
      @game.save!

      post complete_task_game_url(@game, task_id: 'task1')
      assert_response :success

      assert_includes lock_calls, @game.id, 'complete_task must acquire @game.with_lock'
    ensure
      Game.send(:alias_method, :with_lock, :with_lock_without_spy)
      Game.send(:remove_method, :with_lock_spy, :with_lock_without_spy)
    end

    test 'read-only actions like show are NOT wrapped in with_game_lock' do
      lock_calls = []
      Game.send(:define_method, :with_lock_spy) do |*args, &block|
        lock_calls << id
        with_lock_without_spy(*args, &block)
      end
      Game.send(:alias_method, :with_lock_without_spy, :with_lock)
      Game.send(:alias_method, :with_lock, :with_lock_spy)

      get game_url(@game)
      assert_response :success

      assert_empty lock_calls, 'show is read-only and should not pay the locking cost'
    ensure
      Game.send(:alias_method, :with_lock, :with_lock_without_spy)
      Game.send(:remove_method, :with_lock_spy, :with_lock_without_spy)
    end

    # ========================================================================
    # HELPERS FOR SECURITY TESTS
    # ========================================================================

    # Helper to test the room-access gate logic without full Hacktivity stubbing.
    # Since vm_panel returns 404 in standalone mode anyway, we test the helper
    # method and game.room_unlocked? separately, which are the core components.
    def verify_room_unlock_logic(game, room_id, should_be_unlocked)
      if should_be_unlocked
        assert game.room_unlocked?(room_id),
               "Room #{room_id} should be unlocked"
      else
        assert_not game.room_unlocked?(room_id),
                   "Room #{room_id} should NOT be unlocked"
      end
    end
  end
end
