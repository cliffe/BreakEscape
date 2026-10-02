require 'test_helper'

module BreakEscape
  class UnlockSystemTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @player = break_escape_demo_users(:test_user)

      # Create a comprehensive scenario with all lock types
      @game = Game.create!(
        mission: @mission,
        player: @player,
        scenario_data: {
          "startRoom" => "lobby",
          "rooms" => {
            "lobby" => {
              "type" => "office_lobby",
              "locked" => false,
              "connections" => {
                "north" => "office_pin",
                "south" => "office_password",
                "east" => "office_key",
                "west" => "office_unlocked"
              },
              "objects" => [
                {
                  "id" => "safe_pin",
                  "name" => "PIN Safe",
                  "type" => "safe",
                  "locked" => true,
                  "lockType" => "pin",
                  "requires" => "1234",
                  "contents" => [{ "type" => "document", "name" => "Secret Document" }]
                },
                {
                  "id" => "cabinet_password",
                  "name" => "Password Cabinet",
                  "type" => "cabinet",
                  "locked" => true,
                  "lockType" => "password",
                  "requires" => "secret123",
                  "contents" => [{ "type" => "key", "name" => "Master Key" }]
                },
                {
                  "id" => "drawer_key",
                  "name" => "Locked Drawer",
                  "type" => "drawer",
                  "locked" => true,
                  "lockType" => "key",
                  "requires" => "drawer_key",
                  "contents" => [{ "type" => "note", "name" => "Important Note" }]
                },
                {
                  "id" => "box_lockpick",
                  "name" => "Lockpickable Box",
                  "type" => "box",
                  "locked" => true,
                  "lockType" => "lockpick",
                  "difficulty" => 3,
                  "contents" => [{ "type" => "coin", "name" => "Gold Coin" }]
                },
                {
                  "id" => "scanner_biometric",
                  "name" => "Biometric Scanner",
                  "type" => "scanner",
                  "locked" => true,
                  "lockType" => "biometric",
                  "requires" => "ceo_fingerprint",
                  "contents" => [{ "type" => "usb", "name" => "Data USB" }]
                },
                {
                  "id" => "terminal_bluetooth",
                  "name" => "Bluetooth Terminal",
                  "type" => "terminal",
                  "locked" => true,
                  "lockType" => "bluetooth",
                  "requires" => "admin_device",
                  "contents" => [{ "type" => "file", "name" => "Access Codes" }]
                },
                {
                  "id" => "door_rfid",
                  "name" => "RFID Door",
                  "type" => "door",
                  "locked" => true,
                  "lockType" => "rfid",
                  "requires" => "admin_badge",
                  "contents" => [{ "type" => "keycard", "name" => "Security Card" }]
                },
                {
                  "id" => "chest_unlocked",
                  "name" => "Open Chest",
                  "type" => "chest",
                  "locked" => false,
                  "contents" => [{ "type" => "tool", "name" => "Wrench" }]
                }
              ]
            },
            "office_pin" => {
              "type" => "office",
              "locked" => true,
              "lockType" => "pin",
              "requires" => "9876",
              "connections" => { "south" => "lobby" },
              "objects" => []
            },
            "office_password" => {
              "type" => "office",
              "locked" => true,
              "lockType" => "password",
              "requires" => "opensesame",
              "connections" => { "north" => "lobby" },
              "objects" => []
            },
            "office_key" => {
              "type" => "office",
              "locked" => true,
              "lockType" => "key",
              "requires" => "office_key",
              "connections" => { "west" => "lobby" },
              "objects" => []
            },
            "office_unlocked" => {
              "type" => "office",
              "locked" => false,
              "connections" => { "east" => "lobby" },
              "objects" => []
            }
          }
        },
        player_state: {
          "currentRoom" => "lobby",
          "unlockedRooms" => ["lobby"],
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

    # =============================================================================
    # DOOR UNLOCK TESTS - PIN VALIDATION (SERVER-SIDE)
    # =============================================================================

    test "door with PIN lock: correct PIN should unlock" do
      post unlock_game_url(@game), params: {
        targetType: 'door',
        targetId: 'office_pin',
        attempt: '9876',
        method: 'pin'
      }

      assert_response :success
      json = JSON.parse(@response.body)
      assert json['success'], "Expected success=true, got: #{json}"
      assert_equal 'door', json['type']
      assert json['roomData'], "Expected roomData in response"

      @game.reload
      assert_includes @game.player_state['unlockedRooms'], 'office_pin',
        "Room should be added to unlockedRooms"
    end

    test "door with PIN lock: incorrect PIN should fail" do
      post unlock_game_url(@game), params: {
        targetType: 'door',
        targetId: 'office_pin',
        attempt: '0000',
        method: 'pin'
      }

      assert_response :unprocessable_entity
      json = JSON.parse(@response.body)
      assert_equal false, json['success']
      assert_equal 'Invalid attempt', json['message']

      @game.reload
      assert_not_includes @game.player_state['unlockedRooms'], 'office_pin',
        "Room should NOT be added to unlockedRooms"
    end

    # =============================================================================
    # DOOR UNLOCK TESTS - PASSWORD VALIDATION (SERVER-SIDE)
    # =============================================================================

    test "door with password lock: correct password should unlock" do
      post unlock_game_url(@game), params: {
        targetType: 'door',
        targetId: 'office_password',
        attempt: 'opensesame',
        method: 'password'
      }

      assert_response :success
      json = JSON.parse(@response.body)
      assert json['success']
      assert_equal 'door', json['type']
      assert json['roomData']

      @game.reload
      assert_includes @game.player_state['unlockedRooms'], 'office_password'
    end

    test "door with password lock: incorrect password should fail" do
      post unlock_game_url(@game), params: {
        targetType: 'door',
        targetId: 'office_password',
        attempt: 'wrongpassword',
        method: 'password'
      }

      assert_response :unprocessable_entity
      json = JSON.parse(@response.body)
      assert_equal false, json['success']
    end

    test "door with password lock: case sensitivity" do
      post unlock_game_url(@game), params: {
        targetType: 'door',
        targetId: 'office_password',
        attempt: 'OpenSesame',  # Different case
        method: 'password'
      }

      assert_response :unprocessable_entity
      json = JSON.parse(@response.body)
      assert_equal false, json['success'],
        "Password validation should be case-sensitive"
    end

    # =============================================================================
    # DOOR UNLOCK TESTS - KEY (CLIENT-VALIDATED, SERVER-TRUSTED)
    # =============================================================================

    test "door with key lock: should trust client validation" do
      # First, give player the key
      @game.player_state['inventory'] << {
        'id' => 'office_key',
        'type' => 'key',
        'name' => 'Office Key'
      }
      @game.save!

      post unlock_game_url(@game), params: {
        targetType: 'door',
        targetId: 'office_key',
        attempt: nil,  # Client doesn't send attempt for key unlocks
        method: 'key'
      }

      assert_response :success
      json = JSON.parse(@response.body)
      assert json['success'],
        "Server should trust client validation for key unlocks"
      assert json['roomData']

      @game.reload
      assert_includes @game.player_state['unlockedRooms'], 'office_key'
    end

    # =============================================================================
    # DOOR UNLOCK TESTS - UNLOCKED DOORS
    # =============================================================================

    test "unlocked door: should grant access without validation" do
      post unlock_game_url(@game), params: {
        targetType: 'door',
        targetId: 'office_unlocked',
        attempt: nil,
        method: 'unlocked'
      }

      assert_response :success
      json = JSON.parse(@response.body)
      assert json['success'],
        "Unlocked doors should grant access immediately"
      assert json['roomData']

      @game.reload
      assert_includes @game.player_state['unlockedRooms'], 'office_unlocked'
    end

    # =============================================================================
    # CONTAINER/OBJECT UNLOCK TESTS - PIN VALIDATION (SERVER-SIDE)
    # =============================================================================

    test "container with PIN lock: correct PIN should unlock" do
      post unlock_game_url(@game), params: {
        targetType: 'object',
        targetId: 'safe_pin',
        attempt: '1234',
        method: 'pin'
      }

      assert_response :success
      json = JSON.parse(@response.body)
      assert json['success']
      assert_equal 'object', json['type']
      assert json['hasContents'], "Expected hasContents flag"
      assert json['contents'], "Expected contents in response"
      assert_equal 1, json['contents'].length

      @game.reload
      assert_includes @game.player_state['unlockedObjects'], 'safe_pin'
    end

    test "container with PIN lock: incorrect PIN should fail" do
      post unlock_game_url(@game), params: {
        targetType: 'object',
        targetId: 'safe_pin',
        attempt: '0000',
        method: 'pin'
      }

      assert_response :unprocessable_entity
      json = JSON.parse(@response.body)
      assert_equal false, json['success']
    end

    # =============================================================================
    # CONTAINER/OBJECT UNLOCK TESTS - PASSWORD VALIDATION (SERVER-SIDE)
    # =============================================================================

    test "container with password lock: correct password should unlock" do
      post unlock_game_url(@game), params: {
        targetType: 'object',
        targetId: 'cabinet_password',
        attempt: 'secret123',
        method: 'password'
      }

      assert_response :success
      json = JSON.parse(@response.body)
      assert json['success']
      assert json['hasContents']
      assert json['contents']

      @game.reload
      assert_includes @game.player_state['unlockedObjects'], 'cabinet_password'
    end

    test "container with password lock: empty attempt should fail" do
      post unlock_game_url(@game), params: {
        targetType: 'object',
        targetId: 'cabinet_password',
        attempt: '',
        method: 'password'
      }

      assert_response :unprocessable_entity
      json = JSON.parse(@response.body)
      assert_equal false, json['success']
    end

    # =============================================================================
    # CONTAINER/OBJECT UNLOCK TESTS - CLIENT-VALIDATED METHODS
    # =============================================================================

    test "container with key lock: should trust client validation" do
      post unlock_game_url(@game), params: {
        targetType: 'object',
        targetId: 'drawer_key',
        attempt: nil,
        method: 'key'
      }

      assert_response :success
      json = JSON.parse(@response.body)
      assert json['success'],
        "Server should trust client validation for key unlocks"
    end

    test "container with lockpick: should trust client validation" do
      post unlock_game_url(@game), params: {
        targetType: 'object',
        targetId: 'box_lockpick',
        attempt: nil,
        method: 'lockpick'
      }

      assert_response :success
      json = JSON.parse(@response.body)
      assert json['success'],
        "Server should trust client validation for lockpick unlocks"
    end

    test "container with biometric lock: should trust client validation" do
      post unlock_game_url(@game), params: {
        targetType: 'object',
        targetId: 'scanner_biometric',
        attempt: nil,
        method: 'biometric'
      }

      assert_response :success
      json = JSON.parse(@response.body)
      assert json['success'],
        "Server should trust client validation for biometric unlocks"
    end

    test "container with bluetooth lock: should trust client validation" do
      post unlock_game_url(@game), params: {
        targetType: 'object',
        targetId: 'terminal_bluetooth',
        attempt: nil,
        method: 'bluetooth'
      }

      assert_response :success
      json = JSON.parse(@response.body)
      assert json['success'],
        "Server should trust client validation for bluetooth unlocks"
    end

    test "container with RFID lock: should trust client validation" do
      post unlock_game_url(@game), params: {
        targetType: 'object',
        targetId: 'door_rfid',
        attempt: nil,
        method: 'rfid'
      }

      assert_response :success
      json = JSON.parse(@response.body)
      assert json['success'],
        "Server should trust client validation for RFID unlocks"
    end

    # =============================================================================
    # UNLOCKED CONTAINER TESTS
    # =============================================================================

    test "unlocked container: should grant access without validation" do
      post unlock_game_url(@game), params: {
        targetType: 'object',
        targetId: 'chest_unlocked',
        attempt: nil,
        method: 'unlocked'
      }

      assert_response :success
      json = JSON.parse(@response.body)
      assert json['success'],
        "Unlocked containers should grant access immediately"
      assert json['hasContents']
      assert json['contents']

      @game.reload
      assert_includes @game.player_state['unlockedObjects'], 'chest_unlocked'
    end

    # =============================================================================
    # ERROR CASES
    # =============================================================================

    test "unlock non-existent door should fail" do
      post unlock_game_url(@game), params: {
        targetType: 'door',
        targetId: 'non_existent_room',
        attempt: '1234',
        method: 'pin'
      }

      assert_response :unprocessable_entity
      json = JSON.parse(@response.body)
      assert_equal false, json['success']
    end

    test "unlock non-existent object should fail" do
      post unlock_game_url(@game), params: {
        targetType: 'object',
        targetId: 'non_existent_object',
        attempt: '1234',
        method: 'pin'
      }

      assert_response :unprocessable_entity
      json = JSON.parse(@response.body)
      assert_equal false, json['success']
    end

    test "unlock with invalid method should fail" do
      post unlock_game_url(@game), params: {
        targetType: 'door',
        targetId: 'office_pin',
        attempt: '9876',
        method: 'invalid_method'
      }

      assert_response :unprocessable_entity
      json = JSON.parse(@response.body)
      assert_equal false, json['success']
    end

    # =============================================================================
    # NPC UNLOCK TESTS
    # =============================================================================

    test "NPC can unlock door if player has encountered them and NPC has permission" do
      # Add NPC with unlock permission to scenario
      @game.scenario_data['rooms']['lobby']['npcs'] = [
        {
          'id' => 'helper_npc',
          'displayName' => 'Helpful Contact',
          'unlockable' => ['office_pin', 'office_password']
        }
      ]
      # Mark NPC as encountered
      @game.player_state['encounteredNPCs'] = ['helper_npc']
      @game.save!

      post unlock_game_url(@game), params: {
        targetType: 'door',
        targetId: 'office_pin',
        attempt: 'helper_npc',  # NPC id
        method: 'npc'
      }

      assert_response :success
      json = JSON.parse(@response.body)
      assert json['success'], "NPC should be able to unlock door they have permission for"

      @game.reload
      assert_includes @game.player_state['unlockedRooms'], 'office_pin'
    end

    test "NPC can unlock container if player has encountered them and NPC has permission" do
      # Add NPC with unlock permission to scenario
      @game.scenario_data['rooms']['lobby']['npcs'] = [
        {
          'id' => 'helper_npc',
          'displayName' => 'Helpful Contact',
          'unlockable' => ['safe_pin', 'cabinet_password']
        }
      ]
      # Mark NPC as encountered
      @game.player_state['encounteredNPCs'] = ['helper_npc']
      @game.save!

      post unlock_game_url(@game), params: {
        targetType: 'object',
        targetId: 'safe_pin',
        attempt: 'helper_npc',  # NPC id
        method: 'npc'
      }

      assert_response :success
      json = JSON.parse(@response.body)
      assert json['success'], "NPC should be able to unlock container they have permission for"

      @game.reload
      assert_includes @game.player_state['unlockedObjects'], 'safe_pin'
    end

    test "SECURITY: NPC unlock fails if player has not encountered NPC" do
      # Add NPC with unlock permission to scenario but DON'T mark as encountered
      @game.scenario_data['rooms']['lobby']['npcs'] = [
        {
          'id' => 'helper_npc',
          'displayName' => 'Helpful Contact',
          'unlockable' => ['office_pin']
        }
      ]
      @game.save!

      post unlock_game_url(@game), params: {
        targetType: 'door',
        targetId: 'office_pin',
        attempt: 'helper_npc',
        method: 'npc'
      }

      assert_response :unprocessable_entity,
        "SECURITY FAIL: Unlock succeeded without encountering NPC"
      json = JSON.parse(@response.body)
      assert_equal false, json['success']

      @game.reload
      assert_not_includes @game.player_state['unlockedRooms'], 'office_pin'
    end

    test "SECURITY: NPC unlock fails if NPC doesn't have permission for that door" do
      # Add NPC but without permission for this specific door
      @game.scenario_data['rooms']['lobby']['npcs'] = [
        {
          'id' => 'helper_npc',
          'displayName' => 'Helpful Contact',
          'unlockable' => ['office_password']  # Has permission for different door
        }
      ]
      @game.player_state['encounteredNPCs'] = ['helper_npc']
      @game.save!

      post unlock_game_url(@game), params: {
        targetType: 'door',
        targetId: 'office_pin',  # Trying to unlock door not in NPC's unlockable list
        attempt: 'helper_npc',
        method: 'npc'
      }

      assert_response :unprocessable_entity,
        "SECURITY FAIL: NPC unlocked door they don't have permission for"
      json = JSON.parse(@response.body)
      assert_equal false, json['success']

      @game.reload
      assert_not_includes @game.player_state['unlockedRooms'], 'office_pin'
    end

    test "SECURITY: NPC unlock fails for non-existent NPC" do
      # Try to use non-existent NPC
      @game.player_state['encounteredNPCs'] = ['helper_npc']
      @game.save!

      post unlock_game_url(@game), params: {
        targetType: 'door',
        targetId: 'office_pin',
        attempt: 'fake_npc',  # Non-existent NPC
        method: 'npc'
      }

      assert_response :unprocessable_entity,
        "SECURITY FAIL: Unlock succeeded with non-existent NPC"
      json = JSON.parse(@response.body)
      assert_equal false, json['success']
    end

    test "SECURITY: NPC unlock fails if unlockable is not an array" do
      # Malformed NPC data - unlockable is not an array
      @game.scenario_data['rooms']['lobby']['npcs'] = [
        {
          'id' => 'helper_npc',
          'displayName' => 'Helpful Contact',
          'unlockable' => 'office_pin'  # String instead of array
        }
      ]
      @game.player_state['encounteredNPCs'] = ['helper_npc']
      @game.save!

      post unlock_game_url(@game), params: {
        targetType: 'door',
        targetId: 'office_pin',
        attempt: 'helper_npc',
        method: 'npc'
      }

      assert_response :unprocessable_entity,
        "SECURITY FAIL: Unlock succeeded with malformed unlockable data"
      json = JSON.parse(@response.body)
      assert_equal false, json['success']
    end

    # =============================================================================
    # SECURITY TESTS - CLIENT BYPASS ATTEMPTS
    # =============================================================================

    test "SECURITY: locked door cannot be bypassed with method='unlocked'" do
      # This tests the critical vulnerability where client sends method='unlocked'
      # for a LOCKED door to bypass validation
      post unlock_game_url(@game), params: {
        targetType: 'door',
        targetId: 'office_pin',  # This door is LOCKED with PIN
        attempt: nil,
        method: 'unlocked'  # Client trying to bypass by claiming it's unlocked
      }

      assert_response :unprocessable_entity,
        "SECURITY FAIL: Locked door was bypassed by sending method='unlocked'"
      json = JSON.parse(@response.body)
      assert_equal false, json['success'],
        "Server must reject method='unlocked' for locked doors"

      @game.reload
      assert_not_includes @game.player_state['unlockedRooms'], 'office_pin',
        "Locked door should NOT be added to unlockedRooms via bypass attempt"
    end

    test "SECURITY: locked container cannot be bypassed with method='unlocked'" do
      # This tests the critical vulnerability where client sends method='unlocked'
      # for a LOCKED container to bypass validation
      post unlock_game_url(@game), params: {
        targetType: 'object',
        targetId: 'safe_pin',  # This container is LOCKED with PIN
        attempt: nil,
        method: 'unlocked'  # Client trying to bypass by claiming it's unlocked
      }

      assert_response :unprocessable_entity,
        "SECURITY FAIL: Locked container was bypassed by sending method='unlocked'"
      json = JSON.parse(@response.body)
      assert_equal false, json['success'],
        "Server must reject method='unlocked' for locked containers"

      @game.reload
      assert_not_includes @game.player_state['unlockedObjects'], 'safe_pin',
        "Locked container should NOT be added to unlockedObjects via bypass attempt"
    end

    test "SECURITY: method='unlocked' only works for actually unlocked doors" do
      # Verify that method='unlocked' DOES work for doors that are actually unlocked
      post unlock_game_url(@game), params: {
        targetType: 'door',
        targetId: 'office_unlocked',  # This door is actually unlocked
        attempt: nil,
        method: 'unlocked'
      }

      assert_response :success,
        "Unlocked doors should work with method='unlocked'"
      json = JSON.parse(@response.body)
      assert json['success']
    end

    test "SECURITY: method='unlocked' only works for actually unlocked containers" do
      # Verify that method='unlocked' DOES work for containers that are actually unlocked
      post unlock_game_url(@game), params: {
        targetType: 'object',
        targetId: 'chest_unlocked',  # This container is actually unlocked
        attempt: nil,
        method: 'unlocked'
      }

      assert_response :success,
        "Unlocked containers should work with method='unlocked'"
      json = JSON.parse(@response.body)
      assert json['success']
    end

    # =============================================================================
    # SECURITY TESTS - ENSURE FILTERED DATA
    # =============================================================================

    test "door unlock response should not expose 'requires' field for exploitable locks" do
      post unlock_game_url(@game), params: {
        targetType: 'door',
        targetId: 'office_pin',
        attempt: '9876',
        method: 'pin'
      }

      assert_response :success
      json = JSON.parse(@response.body)

      # Check that the roomData is filtered
      room_data = json['roomData']
      assert_nil room_data['requires'],
        "PIN lock 'requires' field should be filtered from response"
    end

    test "container unlock response should filter requires from contents" do
      post unlock_game_url(@game), params: {
        targetType: 'object',
        targetId: 'safe_pin',
        attempt: '1234',
        method: 'pin'
      }

      assert_response :success
      json = JSON.parse(@response.body)

      # Contents should be present but filtered
      assert json['contents']
      json['contents'].each do |item|
        # If item had a lock, the requires should be filtered
        if item['lockType'] && !%w[biometric bluetooth].include?(item['lockType'])
          assert_nil item['requires'],
            "Exploitable lock 'requires' fields should be filtered from contents"
        end
      end
    end

    # =============================================================================
    # INTEGRATION TESTS - MULTIPLE UNLOCKS
    # =============================================================================

    test "multiple unlock attempts should update state correctly" do
      # Unlock door with PIN
      post unlock_game_url(@game), params: {
        targetType: 'door',
        targetId: 'office_pin',
        attempt: '9876',
        method: 'pin'
      }
      assert_response :success

      # Unlock door with password
      post unlock_game_url(@game), params: {
        targetType: 'door',
        targetId: 'office_password',
        attempt: 'opensesame',
        method: 'password'
      }
      assert_response :success

      # Unlock container with PIN
      post unlock_game_url(@game), params: {
        targetType: 'object',
        targetId: 'safe_pin',
        attempt: '1234',
        method: 'pin'
      }
      assert_response :success

      @game.reload
      assert_equal 3, @game.player_state['unlockedRooms'].length,
        "Should have 3 unlocked rooms (lobby + 2 new)"
      assert_equal 1, @game.player_state['unlockedObjects'].length,
        "Should have 1 unlocked object"
    end

    test "unlock same door twice should be idempotent" do
      # First unlock
      post unlock_game_url(@game), params: {
        targetType: 'door',
        targetId: 'office_pin',
        attempt: '9876',
        method: 'pin'
      }
      assert_response :success

      # Second unlock (should still work)
      post unlock_game_url(@game), params: {
        targetType: 'door',
        targetId: 'office_pin',
        attempt: '9876',
        method: 'pin'
      }
      assert_response :success

      @game.reload
      assert_equal 2, @game.player_state['unlockedRooms'].length,
        "Room should only appear once in unlockedRooms"
    end

    # =============================================================================
    # NPC UNLOCK TESTS
    # =============================================================================

    test "NPC unlock adds door to unlockedRooms" do
      # Set up NPC with unlock permission
      @game.scenario_data['rooms']['lobby']['npcs'] = [
        {
          'id' => 'helper_npc',
          'displayName' => 'Helpful Contact',
          'unlockable' => ['office_pin']
        }
      ]
      @game.player_state['encounteredNPCs'] = ['helper_npc']
      @game.save!

      # NPC unlocks door
      post unlock_game_url(@game), params: {
        targetType: 'door',
        targetId: 'office_pin',
        attempt: 'helper_npc',
        method: 'npc'
      }

      assert_response :success
      @game.reload

      # Verify tracked in unlockedRooms (normal unlock)
      assert_includes @game.player_state['unlockedRooms'], 'office_pin',
        "NPC unlock should add room to unlockedRooms"
    end

    test "already-unlocked door accepts method='unlocked'" do
      # Set up a locked room
      @game.scenario_data['rooms']['ceo'] = {
        'type' => 'office',
        'locked' => true,
        'lockType' => 'password',
        'requires' => 'TopSecret123',
        'connections' => { 'south' => 'lobby' },
        'objects' => []
      }
      @game.scenario_data['rooms']['lobby']['npcs'] = [
        {
          'id' => 'helper_npc',
          'unlockable' => ['ceo']
        }
      ]
      @game.player_state['encounteredNPCs'] = ['helper_npc']
      @game.save!

      # NPC unlocks the door
      post unlock_game_url(@game), params: {
        targetType: 'door',
        targetId: 'ceo',
        attempt: 'helper_npc',
        method: 'npc'
      }
      assert_response :success

      # Later, client tries to open the already-unlocked door with method='unlocked'
      post unlock_game_url(@game), params: {
        targetType: 'door',
        targetId: 'ceo',
        attempt: nil,
        method: 'unlocked'
      }

      assert_response :success,
        "Already-unlocked door should accept method='unlocked' (fixes race condition)"
    end

    test "already-unlocked container accepts method='unlocked'" do
      # Set up a locked container
      @game.scenario_data['rooms']['lobby']['objects'] = [
        {
          'id' => 'npc_safe',
          'type' => 'safe1',
          'locked' => true,
          'lockType' => 'pin',
          'requires' => '9999',
          'contents' => [
            { 'type' => 'key', 'id' => 'master_key', 'takeable' => true }
          ]
        }
      ]
      @game.scenario_data['rooms']['lobby']['npcs'] = [
        {
          'id' => 'helper_npc',
          'unlockable' => ['npc_safe']
        }
      ]
      @game.player_state['encounteredNPCs'] = ['helper_npc']
      @game.save!

      # NPC unlocks the container
      post unlock_game_url(@game), params: {
        targetType: 'object',
        targetId: 'npc_safe',
        attempt: 'helper_npc',
        method: 'npc'
      }
      assert_response :success

      # Later, client tries to open the already-unlocked container with method='unlocked'
      post unlock_game_url(@game), params: {
        targetType: 'object',
        targetId: 'npc_safe',
        attempt: nil,
        method: 'unlocked'
      }

      assert_response :success,
        "Already-unlocked container should accept method='unlocked'"
    end

    # =============================================================================
    # SECURITY TESTS — CONTAINER ENDPOINT TYPE/NAME BYPASS (Bug fix regression)
    # =============================================================================

    test "SECURITY: container endpoint denies access when only a same-type container is unlocked" do
      # Unlock safe_pin (type: "safe") via the correct PIN
      post unlock_game_url(@game), params: {
        targetType: 'object', targetId: 'safe_pin', attempt: '1234', method: 'pin'
      }
      assert_response :success

      # Introduce a second safe-type container that has NOT been unlocked
      @game.scenario_data['rooms']['lobby']['objects'] << {
        'id'       => 'safe_pin_2',
        'type'     => 'safe',
        'name'     => 'Second PIN Safe',
        'locked'   => true,
        'lockType' => 'pin',
        'requires' => '9999',
        'contents' => [{ 'type' => 'document', 'name' => 'Top Secret' }]
      }
      @game.save!

      # The second safe shares the type "safe" with the unlocked one —
      # the type-bypass bug would have granted access here.
      get "#{game_path(@game)}/container/safe_pin_2"
      assert_response :forbidden,
        "SECURITY: container with the same type as an unlocked container must NOT be accessible"
    end

    test "SECURITY: container endpoint denies access when a same-name container is unlocked" do
      # Unlock cabinet_password (name: "Password Cabinet") via correct password
      post unlock_game_url(@game), params: {
        targetType: 'object', targetId: 'cabinet_password',
        attempt: 'secret123', method: 'password'
      }
      assert_response :success

      # A second container with the same display name but a different id/lock
      @game.scenario_data['rooms']['lobby']['objects'] << {
        'id'       => 'cabinet_password_2',
        'type'     => 'cabinet',
        'name'     => 'Password Cabinet',
        'locked'   => true,
        'lockType' => 'password',
        'requires' => 'different_secret',
        'contents' => [{ 'type' => 'key', 'name' => 'Spare Key' }]
      }
      @game.save!

      get "#{game_path(@game)}/container/cabinet_password_2"
      assert_response :forbidden,
        "SECURITY: container with the same name as an unlocked container must NOT be accessible"
    end

    test "SECURITY: container endpoint grants access only to the specific unlocked container" do
      # Unlock just safe_pin
      post unlock_game_url(@game), params: {
        targetType: 'object', targetId: 'safe_pin', attempt: '1234', method: 'pin'
      }
      assert_response :success

      # The unlocked container is accessible
      get "#{game_path(@game)}/container/safe_pin"
      assert_response :success

      # A completely different container (same type, different id) is not
      get "#{game_path(@game)}/container/cabinet_password"
      assert_response :forbidden,
        "Only the specifically unlocked container should be accessible"
    end
  end
end
