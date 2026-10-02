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
         container? submit_flag? tts? reset? new_session?].each do |action|
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
         container? submit_flag? tts? reset? new_session?].each do |action|
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
  end
end
