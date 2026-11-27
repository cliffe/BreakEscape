require 'test_helper'
require_relative '../../support/access_work_scenario'

module BreakEscape
  # Access model slice 9.2 C2 (ACCESS_MODEL_SLICE_9_2_C2_PLAN.md sections 3 and 9): the one-copy
  # guarantee. AccessWork.cause_holds? and AccessWork.globals_hold? must give the same answer as
  # the NpcFrustration instance wrapper (frustration_cause_holds?; the globals one was removed in
  # the C2 R2 tidy, so globals_hold? is checked over the game's merged globals) over the same player_state and scenario, so the frustration path and the feed route cannot
  # drift. Includes the locked_out pre-gating case: a loginLockouts key with no check record
  # reads false from both, and true from both once the check record exists.
  class AccessHelperEqualityTest < ActiveSupport::TestCase
    AW = BreakEscape::AccessWork

    def build(globals: {}, player_state: {})
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: AccessWorkScenario.scenario,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby office],
                        'encounteredNPCs' => %w[dana kai ian amy omar temp_user],
                        'globalVariables' => { 'finance_share_down' => false, 'printer_jammed' => false,
                                               'ian_pc_unplugged' => false }.merge(globals) }.merge(player_state)
      )
    end

    def npc(id)
      @game.send(:scenario_room_npc, id)
    end

    # The pure helper over the game's own merged globals and pre-gated lockout keys, exactly as the
    # wrapper assembles them, so the two can only agree when the wrapper keeps delegating.
    def pure_cause_holds?(npc, need, cause)
      globals = @game.send(:frustration_globals)
      keys = @game.send(:lockout_recorded?, npc) ? @game.send(:lockout_keys) : []
      AW.cause_holds?(@game.scenario_data, npc, need, cause, globals, keys)
    end

    def assert_cause_equal(id, need, cause, msg)
      n = npc(id)
      wrapper = @game.send(:frustration_cause_holds?, n, need, cause)
      pure = pure_cause_holds?(n, need, cause)
      assert_equal wrapper, pure, "#{msg}: wrapper=#{wrapper} pure=#{pure}"
      [wrapper, pure]
    end

    test 'cause_holds? equals the wrapper for down, off and no_access, both when it holds and when it does not' do
      build(globals: { 'finance_share_down' => true, 'ian_pc_unplugged' => true })
      w, = assert_cause_equal('dana', 'work', { 'id' => 'finance_share', 'why' => 'down' }, 'down holds')
      assert_equal true, w
      w, = assert_cause_equal('ian', 'work', { 'id' => 'ian_pc', 'why' => 'off' }, 'off holds')
      assert_equal true, w
      # kai is not admitted to finance_share: no_access always holds; printer is not down for dana
      w, = assert_cause_equal('kai', 'work', { 'id' => 'finance_share', 'why' => 'no_access' }, 'no_access holds')
      assert_equal true, w

      build(globals: { 'finance_share_down' => false, 'ian_pc_unplugged' => false })
      w, = assert_cause_equal('dana', 'work', { 'id' => 'finance_share', 'why' => 'down' }, 'down does not hold')
      assert_equal false, w
      w, = assert_cause_equal('ian', 'work', { 'id' => 'ian_pc', 'why' => 'off' }, 'off does not hold')
      assert_equal false, w
    end

    # C2 R2 MIN-1: the instance wrapper had no production caller and is gone; the pure helper is
    # read here over the game's own merged globals (the parity point the frustration path uses)
    test 'globals_hold? over the merged globals for a string and a hash condition, truthy and falsey' do
      build(globals: { 'finance_share_down' => true })
      { 'finance_share_down' => true, { 'finance_share_down' => true } => true, { 'printer_jammed' => false } => true,
        'printer_jammed' => false, { 'finance_share_down' => false } => false }.each do |cond, want|
        assert_equal want, AW.globals_hold?(cond, @game.send(:frustration_globals)), "globals cond #{cond.inspect}"
      end
    end

    test 'locked_out pre-gating: a loginLockouts key with no check record reads false from both; true once the record exists' do
      key = 'dana_pc|dreyes'
      cause = { 'id' => 'dana_pc', 'why' => 'locked_out' }
      # the lockout key is present, but dana has no npcFrustration.lockedOut check record yet
      build(player_state: { 'loginLockouts' => [key] })
      w, = assert_cause_equal('dana', 'work', cause, 'no check record')
      assert_equal false, w, 'no check record: the pre-gated keys are empty, so locked_out is false'

      # record the check: npcFrustration.dana.lockedOut lists the station
      @game.reload
      @game.player_state['npcFrustration'] = { 'dana' => { 'level' => 10, 'lockedOut' => ['dana_pc'],
                                                           'failAt' => {}, 'easeAt' => {}, 'failWhy' => {},
                                                           'done' => [], 'lastSpent' => {} } }
      @game.save!
      w, = assert_cause_equal('dana', 'work', cause, 'with check record')
      assert_equal true, w, 'with the check record the pre-gated keys hold the lockout'
    end
  end
end
