require 'test_helper'

# Unit tests for Pundit policies.
# These test the policy objects directly, independent of HTTP routing,
# covering every action that the policies expose.
module BreakEscape
  class GamePolicyTest < ActiveSupport::TestCase
    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @owner   = break_escape_demo_users(:test_user)
      @other   = break_escape_demo_users(:other_user)

      base_state = {
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
      }
      @game = Game.create!(
        mission:       @mission,
        player:        @owner,
        scenario_data: { "startRoom" => "lobby", "rooms" => {} },
        player_state:  base_state
      )
    end

    # ─── Owner access ─────────────────────────────────────────────────────────

    test "owner can view their own game" do
      assert GamePolicy.new(@owner, @game).show?
    end

    test "owner is allowed all game actions" do
      policy = GamePolicy.new(@owner, @game)
      %i[show? update? scenario? ink? bootstrap? sync_state? update_room?
         unlock? inventory? room? objectives? complete_task? update_task_progress?
         container? submit_flag? tts? reset? new_session? crack? harvest_credentials?].each do |action|
        assert policy.public_send(action), "Expected owner to be allowed: #{action}"
      end
    end

    # ─── Non-owner access ─────────────────────────────────────────────────────

    test "other user cannot view a game they do not own" do
      assert_not GamePolicy.new(@other, @game).show?
    end

    test "other user is denied all game actions" do
      policy = GamePolicy.new(@other, @game)
      %i[show? update? scenario? ink? bootstrap? sync_state? update_room?
         unlock? inventory? room? objectives? complete_task? update_task_progress?
         container? submit_flag? tts? reset? new_session? crack? harvest_credentials?].each do |action|
        assert_not policy.public_send(action),
          "Expected non-owner to be DENIED: #{action}"
      end
    end

    # ─── nil user ─────────────────────────────────────────────────────────────

    test "nil user is denied all game actions" do
      policy = GamePolicy.new(nil, @game)
      %i[show? update? scenario? ink? tts? unlock? sync_state? reset? new_session?].each do |action|
        assert_not policy.public_send(action),
          "Expected nil user to be DENIED: #{action}"
      end
    end

    # ─── Admin / account manager access ───────────────────────────────────────

    test "admin user can view any game" do
      @other.update!(role: 'admin')
      assert GamePolicy.new(@other, @game).show?, "Admin should be able to view any game"
    ensure
      @other.update!(role: 'user')
    end

    test "account_manager can view any game" do
      @other.update!(role: 'account_manager')
      assert GamePolicy.new(@other, @game).show?, "Account manager should access any game"
    ensure
      @other.update!(role: 'user')
    end

    test "admin and account_manager cannot new_session another player's game" do
      %w[admin account_manager].each do |role|
        @other.update!(role: role)
        assert_not GamePolicy.new(@other, @game).new_session?, "#{role} must not spawn sessions on others' games"
      end
    ensure
      @other.update!(role: 'user')
    end

    # Keyring K-lock (plan 8.6): the session lock and the routes that unlock it (a sign-in, the
    # keyring a Connect reads) follow show? for every role.
    test "session lock and its unlock routes follow show? per role" do
      actions = %i[lock_session? login? logout? keyring?]
      actions.each do |action|
        assert GamePolicy.new(@owner, @game).public_send(action), "owner: #{action}"
        assert_not GamePolicy.new(@other, @game).public_send(action), "other user: #{action}"
        assert_not GamePolicy.new(nil, @game).public_send(action), "nil user: #{action}"
      end
      # show? itself, per role (owner? || admin? || managing_account_manager?): an admin passes;
      # an account manager passes when the host has no orgs (DemoUser has no org_id), which is the
      # rule in managing_account_manager?; with orgs it would need the same org
      @other.update!(role: 'admin')
      assert GamePolicy.new(@other, @game).show?, 'admin: show?'
      actions.each { |action| assert GamePolicy.new(@other, @game).public_send(action), "admin: #{action}" }
      @other.update!(role: 'account_manager')
      assert GamePolicy.new(@other, @game).show?, 'account manager, host without orgs: show?'
      actions.each { |action| assert GamePolicy.new(@other, @game).public_send(action), "account manager: #{action}" }
    ensure
      @other.update!(role: 'user')
    end

    # Physical pentest devices (plan slices E0 to B3, plant hiding): every device action is show?,
    # so each one is checked per role. A later edit that narrows or widens one fails here.
    DEVICE_ACTIONS = %i[network_plant? network_unplug? network_join? network_implant? network_scan? network_check? network_confirm? network_technique?
                        capture_secrets? keyring? wear? pin_dust? inventory? log_rows?].freeze

    test "device actions: owner allowed, other user and nil user denied" do
      DEVICE_ACTIONS.each do |action|
        assert GamePolicy.new(@owner, @game).public_send(action), "owner: #{action}"
        assert_not GamePolicy.new(@other, @game).public_send(action), "other user: #{action}"
        assert_not GamePolicy.new(nil, @game).public_send(action), "nil user: #{action}"
      end
    end

    test "device actions: admin allowed, account manager only for their own organisation" do
      @other.update!(role: 'admin')
      DEVICE_ACTIONS.each { |action| assert GamePolicy.new(@other, @game).public_send(action), "admin: #{action}" }

      @other.update!(role: 'account_manager')
      # Host without orgs (DemoUser has no org_id): managing_account_manager? is true
      DEVICE_ACTIONS.each { |action| assert GamePolicy.new(@other, @game).public_send(action), "account manager, no orgs: #{action}" }

      # Host with orgs: same org allowed, other org and no org denied
      player = @game.player
      player.define_singleton_method(:org_id) { 7 }
      [[7, true], [8, false], [nil, false]].each do |org, allowed|
        manager = @other
        manager.define_singleton_method(:org_id) { org }
        DEVICE_ACTIONS.each do |action|
          result = GamePolicy.new(manager, @game).public_send(action)
          assert_equal allowed, result, "account manager org #{org.inspect} vs game org 7: #{action}"
        end
      end
    ensure
      @other.update!(role: 'user')
    end

    # ─── Scope ────────────────────────────────────────────────────────────────

    test "scope returns only the owner's games for regular users" do
      other_game = Game.create!(
        mission:       @mission,
        player:        @other,
        scenario_data: { "startRoom" => "lobby", "rooms" => {} },
        player_state:  @game.player_state
      )

      scope = GamePolicy::Scope.new(@owner, Game).resolve
      assert_includes     scope, @game,       "Owner's game should be in scope"
      assert_not_includes scope, other_game,  "Other user's game should NOT be in scope"
    end

    test "scope returns all games for admin" do
      @owner.update!(role: 'admin')
      other_game = Game.create!(
        mission:       @mission,
        player:        @other,
        scenario_data: { "startRoom" => "lobby", "rooms" => {} },
        player_state:  @game.player_state
      )

      scope = GamePolicy::Scope.new(@owner, Game).resolve
      assert_includes scope, @game
      assert_includes scope, other_game
    ensure
      @owner.update!(role: 'user')
    end
  end

  # ===========================================================================

  class PlayerPreferencePolicyTest < ActiveSupport::TestCase
    setup do
      @owner = break_escape_demo_users(:test_user)
      @other = break_escape_demo_users(:other_user)

      @pref = PlayerPreference.find_or_create_by!(player: @owner) do |p|
        p.in_game_name    = "TestAgent"
        p.selected_sprite = "female_hacker_hood"
      end
    end

    teardown do
      PlayerPreference.where(player_type: @owner.class.name, player_id: @owner.id).destroy_all
    end

    # ─── Owner access ─────────────────────────────────────────────────────────

    test "owner can view their own preference" do
      assert PlayerPreferencePolicy.new(@owner, @pref).show?
    end

    test "owner can update their own preference" do
      assert PlayerPreferencePolicy.new(@owner, @pref).update?
    end

    # ─── Non-owner access ─────────────────────────────────────────────────────

    test "other user cannot view someone else's preference" do
      assert_not PlayerPreferencePolicy.new(@other, @pref).show?,
        "Non-owner should not be able to view another player's preference"
    end

    test "other user cannot update someone else's preference" do
      assert_not PlayerPreferencePolicy.new(@other, @pref).update?,
        "Non-owner should not be able to update another player's preference"
    end

    # ─── nil user ─────────────────────────────────────────────────────────────

    test "nil user cannot view any preference" do
      assert_not PlayerPreferencePolicy.new(nil, @pref).show?
    end

    test "nil user cannot update any preference" do
      assert_not PlayerPreferencePolicy.new(nil, @pref).update?
    end

    # ─── Type / id mismatch ───────────────────────────────────────────────────

    test "user with matching id but different type is denied" do
      # Simulate a polymorphic type mismatch: same id, wrong class
      # Build a preference-like struct with mismatched player_type
      fake_pref = PlayerPreference.new(
        player_type: "SomeOtherModel",
        player_id:   @owner.id,
        in_game_name: "Fake"
      )
      assert_not PlayerPreferencePolicy.new(@owner, fake_pref).show?,
        "Type mismatch should deny access"
    end
  end

  # ===========================================================================

  class MissionPolicyTest < ActiveSupport::TestCase
    setup do
      @player      = break_escape_demo_users(:test_user)
      @published   = break_escape_missions(:ceo_exfil)
      @unpublished = break_escape_missions(:unpublished)
    end

    test "anyone can index missions in standalone mode" do
      assert MissionPolicy.new(@player, @published).index?
      assert MissionPolicy.new(nil,     @published).index?
    end

    test "index? returns false for regular player in mounted mode" do
      original = BreakEscape.configuration.standalone_mode
      BreakEscape.configuration.standalone_mode = false
      assert_not MissionPolicy.new(@player, @published).index?
    ensure
      BreakEscape.configuration.standalone_mode = original
    end

    test "index? returns true for admin in mounted mode" do
      original = BreakEscape.configuration.standalone_mode
      BreakEscape.configuration.standalone_mode = false
      @player.update!(role: 'admin')
      assert MissionPolicy.new(@player, @published).index?
    ensure
      BreakEscape.configuration.standalone_mode = original
      @player.update!(role: 'user')
    end

    test "published mission is visible to regular users" do
      assert MissionPolicy.new(@player, @published).show?
    end

    test "unpublished mission is hidden from regular users" do
      assert_not MissionPolicy.new(@player, @unpublished).show?,
        "Unpublished missions should not be visible to regular players"
    end

    test "admin can see unpublished missions" do
      @player.update!(role: 'admin')
      assert MissionPolicy.new(@player, @unpublished).show?
    ensure
      @player.update!(role: 'user')
    end

    test "create_game? requires both authentication and a visible mission" do
      assert     MissionPolicy.new(@player, @published).create_game?
      assert_not MissionPolicy.new(nil,     @published).create_game?
      assert_not MissionPolicy.new(@player, @unpublished).create_game?,
        "Regular player should not create a game for an unpublished mission"
    end

    test "create_game? is unchanged when can_create_game is nil" do
      with_create_hook(nil) do
        assert MissionPolicy.new(@player, @published).create_game?
      end
    end

    test "create_game? follows can_create_game when it allows" do
      args = nil
      with_create_hook(->(user, mission) { args = [user, mission]; true }) do
        assert MissionPolicy.new(@player, @published).create_game?
      end
      assert_equal [@player, @published], args
    end

    test "create_game? is refused when can_create_game refuses" do
      with_create_hook(->(_user, _mission) { false }) do
        assert_not MissionPolicy.new(@player, @published).create_game?
      end
    end

    test "can_create_game cannot widen access to unpublished missions or anonymous users" do
      with_create_hook(->(_user, _mission) { true }) do
        assert_not MissionPolicy.new(@player, @unpublished).create_game?
        assert_not MissionPolicy.new(nil, @published).create_game?
      end
    end

    private

    def with_create_hook(hook)
      original = BreakEscape.configuration.can_create_game
      BreakEscape.configuration.can_create_game = hook
      yield
    ensure
      BreakEscape.configuration.can_create_game = original
    end
  end

  # ─── GamePolicy: vm_panel? / vm_set_panel? ─────────────────────────────────

  class GamePolicyVmPanelTest < ActiveSupport::TestCase
    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @owner   = break_escape_demo_users(:test_user)
      @other   = break_escape_demo_users(:other_user)

      base_state = {
        "currentRoom" => "lobby", "unlockedRooms" => ["lobby"],
        "unlockedObjects" => [], "inventory" => [], "encounteredNPCs" => [],
        "globalVariables" => {}, "biometricSamples" => [], "biometricUnlocks" => [],
        "bluetoothDevices" => [], "notes" => [], "health" => 100
      }
      @game = Game.create!(
        mission:       @mission,
        player:        @owner,
        scenario_data: { "startRoom" => "lobby", "rooms" => {} },
        player_state:  base_state
      )
      # @game starts as in_progress
    end

    test "vm_panel? returns true for owner with in_progress game" do
      assert GamePolicy.new(@owner, @game).vm_panel?
    end

    test "vm_panel? returns false for non-owner" do
      assert_not GamePolicy.new(@other, @game).vm_panel?
    end

    test "vm_panel? returns false for owner when game is completed" do
      @game.update!(status: 'completed', completed_at: Time.current)
      assert_not GamePolicy.new(@owner, @game).vm_panel?
    end

    test "vm_panel? returns true for admin regardless of ownership" do
      @other.update!(role: 'admin')
      assert GamePolicy.new(@other, @game).vm_panel?
    ensure
      @other.update!(role: 'user')
    end

    test "vm_set_panel? returns true for owner with in_progress game" do
      assert GamePolicy.new(@owner, @game).vm_set_panel?
    end

    test "vm_set_panel? returns false for non-owner" do
      assert_not GamePolicy.new(@other, @game).vm_set_panel?
    end

    test "vm_set_panel? returns false for owner when game is completed" do
      @game.update!(status: 'completed', completed_at: Time.current)
      assert_not GamePolicy.new(@owner, @game).vm_set_panel?
    end

    test "unlock_vm_console? returns true for owner with in_progress game" do
      assert GamePolicy.new(@owner, @game).unlock_vm_console?
    end

    test "unlock_vm_console? returns false for non-owner" do
      assert_not GamePolicy.new(@other, @game).unlock_vm_console?
    end

    test "unlock_vm_console? returns false for owner when game is completed" do
      @game.update!(status: 'completed', completed_at: Time.current)
      assert_not GamePolicy.new(@owner, @game).unlock_vm_console?
    end

    test "unlock_vm_console? returns true for admin regardless of ownership" do
      @other.update!(role: 'admin')
      assert GamePolicy.new(@other, @game).unlock_vm_console?
    ensure
      @other.update!(role: 'user')
    end
  end
end
