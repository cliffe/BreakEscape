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

    test "NPC drop persists the full held item definition and survives pickup" do
      device = { 'type' => 'launch-device', 'name' => 'Launch Device', 'id' => 'entropy_launch_device',
                 'mode' => 'launch-abort', 'flags' => ['abort'], 'onLaunch' => { 'setGlobal' => { 'x' => true } } }
      @game.scenario_data = {
        'startRoom' => 'break_room',
        'rooms' => { 'break_room' => { 'objects' => [], 'npcs' => [{ 'id' => 'derek', 'itemsHeld' => [device] }] } }
      }
      @game.player_state['unlockedRooms'] = ['break_room']
      # Client sends only a stripped subset, as the strong params allow
      # Client may send either the original id or a generated drop id; the stored id must be the scenario's
      sent = { 'id' => 'entropy_launch_device', 'type' => 'launch-device', 'name' => 'Launch Device',
               'x' => 100, 'y' => 200, 'position' => { 'x' => 3.5, 'y' => 4.25 } }
      assert @game.add_item_to_room!('break_room', sent, { 'npc_id' => 'derek' })

      room = @game.filtered_room_data('break_room')
      obj = room['objects'].find { |o| o['id'] == 'entropy_launch_device' }
      assert_equal 'entropy_launch_device', obj['id']
      assert_equal 'launch-abort', obj['mode']
      assert_equal 1, obj['flagCount'] # flag values are stripped from client payloads, count kept
      assert_equal({ 'setGlobal' => { 'x' => true } }, obj['onLaunch'])
      assert_equal({ 'x' => 3.5, 'y' => 4.25 }, obj['position'])
      assert obj['takeable']

      # A generated client drop id is replaced by the scenario id
      @game.player_state['room_states']['break_room']['objects_added'] = []
      assert @game.add_item_to_room!('break_room', sent.merge('id' => 'dropped_derek_0_999'), { 'npc_id' => 'derek' })
      assert_equal ['entropy_launch_device'],
                   @game.filtered_room_data('break_room')['objects'].map { |o| o['id'] }

      # Picked up: no longer restored on reload
      assert @game.remove_item_from_room!('break_room', 'entropy_launch_device')
      room = @game.filtered_room_data('break_room')
      assert_nil room['objects'].find { |o| o['id'] == 'entropy_launch_device' }

      # A readable note is removed again when it's read into the notebook: the repeat succeeds
      assert @game.remove_item_from_room!('break_room', 'entropy_launch_device')
      assert_equal 1, @game.player_state['room_states']['break_room']['objects_removed'].count('entropy_launch_device')

      # An item that was never in the room still fails
      refute @game.remove_item_from_room!('break_room', 'no_such_item')
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
        { 'type' => 'key', 'opens_lock' => 'office1_key', 'name' => 'Office Key' }
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
        { 'type' => 'key', 'opens_lock' => 'wrong_key', 'name' => 'Wrong Key' }
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
        { 'type' => 'key', 'opens_lock' => 'office1_key', 'name' => 'Office Key' }
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
        { 'type' => 'key', 'opens_lock' => 'office1_key', 'name' => 'Office Key' },
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

    # ------------------------------------------------------------------
    # The unlock method must match the lock's lockType (doors and objects)
    # ------------------------------------------------------------------

    # One door and one object per lockType, plus a flag-station whose reward
    # opens the flag-locked cache remotely and an NPC who can open the vault.
    def lock_matrix_scenario
      {
        'flags' => { 'target_vm' => { 'flag_1' => 'flag{first}', 'flag_2' => 'flag{cache_open}' } },
        'rooms' => {
          'hall' => {
            'locked' => false,
            'npcs' => [{ 'id' => 'guard', 'unlockable' => %w[door_password safe_password] }],
            'objects' => [
              { 'id' => 'safe_key', 'type' => 'safe', 'locked' => true, 'lockType' => 'key', 'requires' => 'safe_key_lock' },
              { 'id' => 'safe_default', 'type' => 'briefcase', 'locked' => true, 'requires' => 'case_key_lock' },
              { 'id' => 'safe_pin', 'type' => 'safe', 'locked' => true, 'lockType' => 'pin', 'requires' => '4321' },
              { 'id' => 'safe_password', 'type' => 'pc', 'locked' => true, 'lockType' => 'password', 'requires' => 'hunter2' },
              { 'id' => 'safe_flag', 'type' => 'safe', 'locked' => true, 'lockType' => 'flag', 'requires' => 'target_vm:flag_1' },
              { 'id' => 'safe_biometric', 'type' => 'safe', 'locked' => true, 'lockType' => 'biometric', 'requires' => 'Ann' },
              { 'id' => 'safe_bluetooth', 'type' => 'safe', 'locked' => true, 'lockType' => 'bluetooth', 'requires' => 'AA:BB' },
              { 'id' => 'safe_ble', 'type' => 'safe', 'locked' => true, 'lockType' => 'ble' },
              { 'id' => 'safe_rfid', 'type' => 'safe', 'locked' => true, 'lockType' => 'rfid', 'requires' => ['badge'] },
              { 'id' => 'reward_cache', 'type' => 'safe', 'locked' => true, 'lockType' => 'flag' },
              { 'id' => 'ransom_screen', 'type' => 'pc', 'locked' => true, 'lockType' => 'ransomware_display' },
              { 'id' => 'open_box', 'type' => 'suitcase', 'contents' => [{ 'type' => 'notes' }] },
              { 'id' => 'station', 'type' => 'flag-station',
                'flags' => ['target_vm:flag_1', 'target_vm:flag_2'],
                'flagRewards' => [
                  { 'type' => 'emit_event', 'event_name' => 'first' },
                  { 'type' => 'unlock_object', 'objectId' => 'reward_cache' }
                ] }
            ]
          },
          'door_key' => { 'locked' => true, 'lockType' => 'key', 'requires' => 'door_key_lock' },
          'door_pin' => { 'locked' => true, 'lockType' => 'pin', 'requires' => '9876' },
          'door_password' => { 'locked' => true, 'lockType' => 'password', 'requires' => 'opensesame' },
          'door_biometric' => { 'locked' => true, 'lockType' => 'biometric', 'requires' => 'Ann' },
          'door_bluetooth' => { 'locked' => true, 'lockType' => 'bluetooth', 'requires' => 'AA:BB' },
          'door_rfid' => { 'locked' => true, 'lockType' => 'rfid', 'requires' => ['badge'] }
        }
      }
    end

    # The answer each lock accepts for its own method
    LOCK_MATRIX_ANSWERS = {
      'pin' => { 'door_pin' => '9876', 'safe_pin' => '4321' },
      'password' => { 'door_password' => 'opensesame', 'safe_password' => 'hunter2' },
      'flag' => { 'safe_flag' => 'flag{first}' }
    }.freeze

    CLIENT_METHODS = %w[key lockpick pin password flag biometric bluetooth ble rfid].freeze

    def arm_player_with_everything!
      @game.player_state['inventory'] = [
        { 'type' => 'key', 'opens_lock' => 'door_key_lock', 'name' => 'Door Key' },
        { 'type' => 'key', 'opens_lock' => 'safe_key_lock', 'name' => 'Safe Key' },
        { 'type' => 'key', 'opens_lock' => 'case_key_lock', 'name' => 'Case Key' },
        { 'type' => 'lockpick', 'name' => 'Lock Pick Kit' }
      ]
    end

    def attempt_for(target, method)
      LOCK_MATRIX_ANSWERS.dig(method, target) || 'anything'
    end

    test "each lock accepts only its own method, for doors and objects" do
      @game.scenario_data = lock_matrix_scenario
      arm_player_with_everything!

      accepted = {
        ['door', 'door_key'] => %w[key lockpick],
        ['door', 'door_pin'] => %w[pin],
        ['door', 'door_password'] => %w[password],
        ['door', 'door_biometric'] => %w[biometric],
        ['door', 'door_bluetooth'] => %w[bluetooth],
        ['door', 'door_rfid'] => %w[rfid],
        ['object', 'safe_key'] => %w[key lockpick],
        ['object', 'safe_default'] => %w[key lockpick], # no lockType: key, as on the client
        ['object', 'safe_pin'] => %w[pin],
        ['object', 'safe_password'] => %w[password],
        ['object', 'safe_flag'] => %w[flag],
        ['object', 'safe_biometric'] => %w[biometric],
        ['object', 'safe_bluetooth'] => %w[bluetooth],
        ['object', 'safe_ble'] => %w[ble],
        ['object', 'safe_rfid'] => %w[rfid],
        ['object', 'ransom_screen'] => []
      }

      accepted.each do |(type, target), methods|
        CLIENT_METHODS.each do |method|
          result = @game.validate_unlock(type, target, attempt_for(target, method), method)
          if methods.include?(method)
            assert result, "#{type} #{target} should accept method '#{method}'"
          else
            assert_not result, "#{type} #{target} should refuse forged method '#{method}'"
          end
        end
      end
    end

    test "the right method still needs the right answer or item" do
      @game.scenario_data = lock_matrix_scenario
      @game.player_state['inventory'] = []

      assert_not @game.validate_unlock('door', 'door_pin', '0000', 'pin')
      assert_not @game.validate_unlock('object', 'safe_password', 'wrong', 'password')
      assert_not @game.validate_unlock('object', 'safe_flag', 'flag{wrong}', 'flag')
      assert_not @game.validate_unlock('door', 'door_key', '', 'key'), "key claimed without the key"
      assert_not @game.validate_unlock('door', 'door_key', '', 'lockpick'), "lockpick claimed without one"
      assert_not @game.validate_unlock('object', 'safe_key', '', 'key'), "object key claimed without the key"
      assert_not @game.validate_unlock('object', 'safe_key', '', 'lockpick'), "object lockpick claimed without one"

      @game.player_state['inventory'] = [{ 'type' => 'key', 'opens_lock' => 'other_lock', 'name' => 'Other Key' }]
      assert_not @game.validate_unlock('object', 'safe_key', '', 'key'), "wrong key"
    end

    test "a lockpick no longer opens a password or PIN door" do
      @game.scenario_data = lock_matrix_scenario
      arm_player_with_everything!

      assert_not @game.validate_unlock('door', 'door_password', '', 'lockpick')
      assert_not @game.validate_unlock('door', 'door_pin', '', 'lockpick')
      assert_not @game.validate_unlock('door', 'door_password', '', 'rfid')
      assert_not @game.validate_unlock('door', 'door_password', '', 'biometric')
    end

    test "flag_reward opens only a reward target, and only once its flag is claimed" do
      @game.scenario_data = lock_matrix_scenario

      assert_not @game.validate_unlock('object', 'reward_cache', nil, 'flag_reward'), "flag not yet claimed"

      @game.player_state['flag_rewards_claimed'] = ['flag{first}']
      assert_not @game.validate_unlock('object', 'reward_cache', nil, 'flag_reward'), "a different flag was claimed"

      @game.player_state['flag_rewards_claimed'] = ['FLAG{CACHE_OPEN}']
      assert @game.validate_unlock('object', 'reward_cache', nil, 'flag_reward'), "claimed flag pays this reward"

      # Not a reward target: flag_reward is no longer a free pass
      assert_not @game.validate_unlock('object', 'safe_pin', nil, 'flag_reward')
      assert_not @game.validate_unlock('object', 'safe_key', nil, 'flag_reward')
      # Doors are opened server-side by flag rewards, never by this method
      assert_not @game.validate_unlock('door', 'door_pin', nil, 'flag_reward')
    end

    test "flag_reward works with hash-shaped and flag-locked-station rewards" do
      scenario = lock_matrix_scenario
      station = scenario['rooms']['hall']['objects'].find { |o| o['id'] == 'station' }
      station.delete('flags')
      station['flagRewards'] = { 'flag{hash_key}' => { 'type' => 'unlock_object', 'objectId' => 'reward_cache' } }
      @game.scenario_data = scenario
      @game.player_state['flag_rewards_claimed'] = ['flag{hash_key}']
      assert @game.validate_unlock('object', 'reward_cache', nil, 'flag_reward')

      station['flagRewards'] = [{ 'type' => 'unlock_object', 'objectId' => 'reward_cache' }]
      station['requires'] = 'target_vm:flag_2'
      @game.scenario_data = scenario
      @game.player_state['flag_rewards_claimed'] = ['flag{cache_open}']
      assert @game.validate_unlock('object', 'reward_cache', nil, 'flag_reward')
    end

    test "npc unlocks still work regardless of lockType, and need the NPC's permission" do
      @game.scenario_data = lock_matrix_scenario

      assert_not @game.validate_unlock('door', 'door_password', 'guard', 'npc'), "NPC not encountered yet"

      @game.player_state['encounteredNPCs'] = ['guard']
      assert @game.validate_unlock('door', 'door_password', 'guard', 'npc')
      assert @game.validate_unlock('object', 'safe_password', 'guard', 'npc')
      assert_not @game.validate_unlock('door', 'door_pin', 'guard', 'npc'), "not in the NPC's unlockable list"
    end

    test "unlocked and already-unlocked targets are unaffected by the lockType check" do
      @game.scenario_data = lock_matrix_scenario

      assert @game.validate_unlock('door', 'hall', nil, 'unlocked')
      assert @game.validate_unlock('object', 'open_box', nil, 'unlocked')
      assert @game.validate_unlock('object', 'open_box', nil, 'lockpick'), "unlocked container with no lockType"

      # An object that carries a lockType but isn't marked locked behaves as before:
      # every formerly trusted method still passes, with no inventory check
      hall = @game.scenario_data['rooms']['hall']['objects']
      hall << { 'id' => 'open_pin_box', 'type' => 'safe', 'locked' => false, 'lockType' => 'pin', 'requires' => '1111' }
      hall << { 'id' => 'bare_bt_pc', 'type' => 'pc', 'lockType' => 'bluetooth', 'requires' => 'AA:BB' }
      @game.player_state['inventory'] = []
      %w[open_pin_box bare_bt_pc].each do |id|
        assert @game.validate_unlock('object', id, nil, 'unlocked'), "#{id} via unlocked"
        %w[key lockpick biometric bluetooth ble rfid flag_reward].each do |m|
          assert @game.validate_unlock('object', id, nil, m), "#{id} via #{m}, as before"
        end
      end
      assert @game.validate_unlock('object', 'open_pin_box', '1111', 'pin')
      assert_not @game.validate_unlock('object', 'open_pin_box', '0000', 'pin'), "PIN compare unchanged"
      assert_not @game.validate_unlock('door', 'door_pin', nil, 'unlocked')
      assert_not @game.validate_unlock('object', 'safe_pin', nil, 'unlocked')

      @game.player_state['unlockedRooms'] << 'door_pin'
      @game.player_state['unlockedObjects'] << 'safe_pin'
      assert @game.validate_unlock('door', 'door_pin', nil, 'key'), "already unlocked in player state"
      assert @game.validate_unlock('object', 'safe_pin', nil, 'key'), "already unlocked in player state"
    end

    test "has_key_in_inventory should find keys by opens_lock" do
      @game.player_state['inventory'] = [
        { 'type' => 'key', 'opens_lock' => 'office1_key', 'name' => 'Office Key' }
      ]

      assert @game.has_key_in_inventory?('office1_key'), "Should find key by opens_lock"
      assert_not @game.has_key_in_inventory?('wrong_key'), "Should not find missing key"
    end

    test "has_key_in_inventory should find keys carrying opens_lock in scenarioData" do
      # How the client actually stores a picked-up key.
      @game.player_state['inventory'] = [
        { 'type' => 'key', 'name' => 'Office Key',
          'scenarioData' => { 'type' => 'key', 'opens_lock' => 'office1_key' } }
      ]

      assert @game.has_key_in_inventory?('office1_key'), "Should read opens_lock out of scenarioData"
    end

    test "has_key_in_inventory still honours key_id for games started before the rename" do
      @game.player_state['inventory'] = [
        { 'type' => 'key', 'key_id' => 'office1_key', 'name' => 'Office Key' }
      ]

      assert @game.has_key_in_inventory?('office1_key'), "Pre-rename snapshots must keep working"
    end

    test "has_key_in_inventory should not accept an unrelated key that opens another lock" do
      @game.player_state['inventory'] = [
        { 'type' => 'key', 'opens_lock' => 'store_room_key', 'id' => 'spare_brass_key' }
      ]

      assert_not @game.has_key_in_inventory?('office1_key'), "A key for another lock must not open this one"
    end

    test "has_lockpick_in_inventory should find lockpicks" do
      @game.player_state['inventory'] = [
        { 'type' => 'lockpick', 'name' => 'Lock Pick Kit' }
      ]

      assert @game.has_lockpick_in_inventory?, "Should find lockpick in inventory"
    end

    test "has_lockpick_in_inventory should not find non-lockpick items" do
      @game.player_state['inventory'] = [
        { 'type' => 'key', 'opens_lock' => 'office1_key', 'name' => 'Office Key' }
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

  # E3: task onComplete.setGlobal is applied server-side as well as on the client.
  class TaskSetGlobalModelTest < ActiveSupport::TestCase
    SCENARIO = {
      "startRoom" => "room1",
      "rooms" => {},
      "globalVariables" => { "relay_opened" => false, "count" => 0 },
      "objectives" => [
        {
          "aimId" => "aim", "title" => "Aim", "status" => "active", "order" => 0,
          "tasks" => [
            { "taskId" => "open_relay", "title" => "Open", "type" => "custom", "status" => "active",
              "onComplete" => { "setGlobal" => { "relay_opened" => true, "count" => 3, "rogue" => true },
                                "unlockTask" => "later" } },
            { "taskId" => "later", "title" => "Later", "type" => "custom", "status" => "locked" },
            { "taskId" => "bad_value", "title" => "Bad", "type" => "custom", "status" => "active",
              "onComplete" => { "setGlobal" => { "count" => { "nested" => 1 } } } }
          ]
        },
        {
          "aimId" => "flags", "title" => "Flags", "status" => "active", "order" => 1,
          "tasks" => [
            { "taskId" => "submit_flag", "title" => "Flag", "type" => "submit_flags", "status" => "active",
              "targetFlags" => ["vm-flag1"], "onComplete" => { "setGlobal" => { "count" => 7 } } }
          ]
        }
      ]
    }.freeze

    setup do
      @game = BreakEscape::Game.create!(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario_data: SCENARIO.deep_dup,
        player_state: { "currentRoom" => "room1", "unlockedRooms" => ["room1"], "unlockedObjects" => [],
                        "inventory" => [], "encounteredNPCs" => [], "globalVariables" => {},
                        "notes" => [], "health" => 100 }
      )
    end

    test "complete_task! applies the declared setGlobal values and persists them" do
      @game.complete_task!("open_relay")
      globals = @game.reload.player_state["globalVariables"]
      assert_equal true, globals["relay_opened"]
      assert_equal 3, globals["count"]
      assert_not globals.key?("rogue"), "a global the scenario doesn't declare is not set"
      assert_equal "active", @game.player_state.dig("objectivesState", "tasks", "later", "status"),
                   "the other onComplete actions still run"
    end

    test "a repeat completion is a no-op and does not reapply the globals" do
      @game.complete_task!("open_relay")
      @game.update_global_variables!("relay_opened" => false)   # the story moved on
      @game.complete_task!("open_relay")
      assert_equal false, @game.reload.player_state["globalVariables"]["relay_opened"]
    end

    test "a non-scalar setGlobal value is not applied" do
      @game.complete_task!("bad_value")
      assert_not @game.reload.player_state["globalVariables"].key?("count")
    end

    test "a flag submission that completes a task applies its setGlobal" do
      @game.process_flag_task_completions!(["vm-flag1"])
      assert_equal 7, @game.reload.player_state["globalVariables"]["count"]
    end
  end
end
