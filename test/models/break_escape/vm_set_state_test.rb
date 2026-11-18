require 'test_helper'
require_relative '../../support/fake_hacktivity_vm'

module BreakEscape
  # D144: Game#vm_set_state (none / live / released) and what it does to flag submission.
  class VmSetStateTest < ActiveSupport::TestCase
    FLAG = 'flag{one}'.freeze

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @owner   = break_escape_demo_users(:test_user)
      @other   = break_escape_demo_users(:other_user)
    end

    teardown { FakeHacktivityVm.uninstall! }

    def make_game(vm_set_id: 11, flags: [FLAG], submitted: [])
      state = { 'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'], 'unlockedObjects' => [], 'inventory' => [],
                'encounteredNPCs' => [], 'globalVariables' => {}, 'health' => 100,
                'standalone_flags' => flags, 'submitted_flags' => submitted }
      state['vm_set_id'] = vm_set_id if vm_set_id
      Game.create!(mission: @mission, player: @owner, scenario_data: { 'startRoom' => 'lobby', 'rooms' => {} },
                   player_state: state)
    end

    def install(set, solved: false)
      FakeHacktivityVm.install!(sets: set ? [set] : [], solved: solved)
    end

    def set_for_owner(**opts)
      FakeHacktivityVm::FakeSet.new(id: 11, user_id: @owner.id, **opts)
    end

    # ---- the three states ------------------------------------------------------------

    test 'none: standalone mode, even with a vm_set_id on the game' do
      assert_not BreakEscape::Mission.hacktivity_mode?
      assert_equal :none, make_game.vm_set_state
    end

    test 'none: Hacktivity mode but a VM-free game (no vm_set_id)' do
      game = make_game(vm_set_id: nil)
      install(set_for_owner)
      assert_equal :none, game.vm_set_state
    end

    test 'live: the player holds a built set' do
      game = make_game
      install(set_for_owner)
      assert_equal :live, game.vm_set_state
    end

    test 'live: relinquished is nil (sets built in advance leave it NULL)' do
      game = make_game
      install(set_for_owner(relinquished: nil))
      assert_equal :live, game.vm_set_state
    end

    test 'live: a set still building is not released' do
      game = make_game
      install(set_for_owner(build_status: 'pending'))
      assert_equal :live, game.vm_set_state
    end

    test 'live: a team member holds their team set' do
      game = make_game
      team = FakeHacktivityVm::FakeTeam.new([@owner.id])
      set = FakeHacktivityVm::FakeSet.new(id: 11, user_id: nil)
      set.team = team
      install(set)
      assert_equal :live, game.vm_set_state
    end

    test 'released: relinquished' do
      game = make_game
      install(set_for_owner(relinquished: true))
      assert_equal :released, game.vm_set_state
    end

    test 'released: every build status in Game::VM_SET_RELEASED_BUILD_STATUSES' do
      %w[error relinquished deleted removed build_stopped marked_broken failed_to_revert].each do |status|
        assert_includes Game::VM_SET_RELEASED_BUILD_STATUSES, status
      end
      (Game::VM_SET_RELEASED_BUILD_STATUSES + ['failed_to_revert_again']).each do |status|
        game = make_game
        install(set_for_owner(build_status: status))
        assert_equal :released, game.vm_set_state, status
      end
    end

    test 'live: success, awaiting_revert and todo are not released' do
      %w[success awaiting_revert todo running built].each do |status|
        game = make_game
        install(set_for_owner(build_status: status))
        assert_equal :live, game.vm_set_state, status
      end
    end

    test 'a lookup error propagates (it is not read as released)' do
      game = make_game
      install(set_for_owner)
      ::VmSet.define_singleton_method(:find_by) { |**| raise ActiveRecord::ConnectionNotEstablished, 'db down' }
      assert_raises(ActiveRecord::ConnectionNotEstablished) { game.vm_set_state }
    end

    test 'the set id comes from the column first, then player_state, for state and flag lookups alike' do
      game = make_game(vm_set_id: 11)
      assert_equal 11, game.vm_set_id_for_state
      game.update_columns(vm_set_id: 12)
      assert_equal 12, game.vm_set_id_for_state
      assert_equal 0, make_game(vm_set_id: nil).vm_set_id_for_state
    end

    test 'released: the set row is gone' do
      game = make_game
      install(nil)
      assert_equal :released, game.vm_set_state
    end

    test 'released: the set is held by someone else' do
      game = make_game
      install(FakeHacktivityVm::FakeSet.new(id: 11, user_id: @other.id))
      assert_equal :released, game.vm_set_state
    end

    test 'released: a team set the player is not on' do
      game = make_game
      team = FakeHacktivityVm::FakeTeam.new([@other.id])
      set = FakeHacktivityVm::FakeSet.new(id: 11, user_id: nil)
      set.team = team
      install(set)
      assert_equal :released, game.vm_set_state
    end

    test 'the state is read from the set row on each call, with no stored column' do
      game = make_game
      set = set_for_owner
      install(set)
      assert_equal :live, game.vm_set_state
      set.relinquished = true
      assert_equal :released, game.vm_set_state
    end

    # ---- submit_flag by state --------------------------------------------------------

    test 'released: a new flag is refused, with no score and nothing stored' do
      game = make_game
      install(set_for_owner(relinquished: true))
      result = game.submit_flag(FLAG)
      assert_equal false, result[:success]
      assert_equal 'vm_released', result[:reason]
      assert_equal Game::VM_RELEASED_MESSAGE, result[:message]
      assert_empty FakeHacktivityVm.scored
      assert_empty game.reload.player_state['submitted_flags']
    end

    test 'released: a flag already solved on the old set is accepted with no new score' do
      game = make_game
      install(set_for_owner(relinquished: true), solved: true)
      result = game.submit_flag(FLAG)
      assert result[:success]
      assert result[:already_in_hacktivity], 'the controller skips the host scoring on this'
      assert_empty FakeHacktivityVm.scored
      assert_includes game.reload.player_state['submitted_flags'], FLAG
    end

    test 'released: an unknown flag still says invalid' do
      game = make_game
      install(set_for_owner(relinquished: true))
      assert_equal 'invalid', game.submit_flag('flag{nope}')[:reason]
    end

    test 'released: a flag the game already holds answers as before' do
      game = make_game(submitted: [FLAG])
      install(set_for_owner(relinquished: true))
      assert_equal 'already_submitted', game.submit_flag(FLAG)[:reason]
    end

    test 'live: a new flag is scored in the host as today' do
      game = make_game
      vm_set = set_for_owner
      vm_set.vms = FakeHacktivityVm::FlagVms.new([FakeHacktivityVm::FlagVm.new([FLAG])])
      vm_set.define_singleton_method(:user) { nil }
      install(vm_set)
      result = game.submit_flag(FLAG)
      assert result[:success], result.inspect
      assert_equal [FLAG], FakeHacktivityVm.scored
      assert_includes game.reload.player_state['submitted_flags'], FLAG
    end

    test 'none: standalone submit_flag accepts and never calls the host' do
      game = make_game
      result = game.submit_flag(FLAG)
      assert result[:success]
      assert_nil result[:already_in_hacktivity]
      assert_includes game.reload.player_state['submitted_flags'], FLAG
    end

    test 'released_flag_refusal is nil in every state but released' do
      game = make_game
      assert_nil game.released_flag_refusal(FLAG)
      install(set_for_owner)
      assert_nil game.released_flag_refusal(FLAG)
      install(set_for_owner(relinquished: true))
      assert_equal 'vm_released', game.released_flag_refusal(FLAG)[:reason]
    end
  end
end
