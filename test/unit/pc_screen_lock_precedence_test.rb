require 'test_helper'

# User decision q89 (2026-11-13): a PC's own screen-lock setting beats its owner's habit.
# Both server readers of the rule are pinned here, each way round: a PC field that locks beside
# a habit that never does, and a PC field that leaves the screen open beside a habit that always
# locks. The browser's decideLocked is pinned in test/js/workstation-state.test.mjs.
class PcScreenLockPrecedenceTest < ActiveSupport::TestCase
  AI = BreakEscape::AccessIdentities
  OC = BreakEscape::OwnerClaim

  NEVER = { 'id' => 'jake', 'screenHabit' => { 'lockChance' => 0 } }.freeze
  ALWAYS = { 'id' => 'jake', 'screenHabit' => { 'lockChance' => 1 } }.freeze

  test 'a PC that locks ignores an owner who never locks' do
    [{ 'lockChance' => 1 }, { 'locksScreenOnLeave' => true }].each do |pc|
      assert AI.screen_always_locks?(pc, NEVER), "screen_always_locks? #{pc.inspect}"
      refute OC.open_without_estimate?(pc, NEVER), "open_without_estimate? #{pc.inspect}"
    end
  end

  test 'a PC that stays open ignores an owner who always locks' do
    [{ 'lockChance' => 0 }, { 'locksScreenOnLeave' => false }].each do |pc|
      refute AI.screen_always_locks?(pc, ALWAYS), "screen_always_locks? #{pc.inspect}"
      assert OC.open_without_estimate?(pc, ALWAYS), "open_without_estimate? #{pc.inspect}"
    end
  end

  test 'lockChance beats locksScreenOnLeave on the PC itself' do
    pc = { 'lockChance' => 0, 'locksScreenOnLeave' => true }
    refute AI.screen_always_locks?(pc, ALWAYS)
    assert OC.open_without_estimate?(pc, ALWAYS)
  end

  test 'a PC with neither field follows the habit, and with no habit locks' do
    { 'workstation' => true }.then do |pc|
      refute AI.screen_always_locks?(pc, NEVER)
      assert OC.open_without_estimate?(pc, NEVER)
      assert AI.screen_always_locks?(pc, ALWAYS)
      refute OC.open_without_estimate?(pc, ALWAYS)
      assert AI.screen_always_locks?(pc, { 'id' => 'jake' })
      refute OC.open_without_estimate?(pc, { 'id' => 'jake' })
    end
  end
end
