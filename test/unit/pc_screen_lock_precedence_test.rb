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

  # Through a caller (UX slice 16 R1 m5): the owner claim's knock-out route reads the same rule
  test 'the owner claim knock-out route follows the PC, not the habit' do
    data = { 'startRoom' => 'office', 'rooms' => { 'office' => { 'type' => 'room_office', 'objects' => [], 'npcs' => [] } } }
    assert_equal 'knock_out', OC.precise_route(data, ALWAYS, { 'lockChance' => 0 })
    assert_equal 'knock_out', OC.precise_route(data, ALWAYS, { 'locksScreenOnLeave' => false })
    assert_nil OC.precise_route(data, NEVER, { 'locksScreenOnLeave' => true })
    assert_nil OC.precise_route(data, NEVER, { 'lockChance' => 1 })
  end

  # The habit filled from habits.locksScreen (NpcHabits.expand!) rather than a hand-written
  # screenHabit: it decides at a PC with neither field, and a PC field still beats it
  test 'a locksScreen habit decides at a bare PC and loses to a PC field' do
    { 'never' => [false, true], 'always' => [true, false] }.each do |value, (locks, open)|
      [[{}, locks, open],
       [{ 'locksScreenOnLeave' => !locks }, !locks, !open]].each do |fields, want_locks, want_open|
        pc = { 'type' => 'pc', 'id' => 'jake_pc', 'workstation' => true, 'owner' => 'jake' }.merge(fields)
        jake = { 'id' => 'jake', 'displayName' => 'Jake', 'needsHome' => 'jake_pc', 'habits' => { 'locksScreen' => value } }
        data = { 'startRoom' => 'office',
                 'rooms' => { 'office' => { 'type' => 'room_office', 'objects' => [pc], 'npcs' => [jake] } } }
        BreakEscape::NpcHabits.expand!(data)
        owner = data['rooms']['office']['npcs'][0]
        label = "#{value} #{fields.inspect}"
        assert_equal want_locks, AI.screen_always_locks?(pc, owner), "screen_always_locks? #{label}"
        assert_equal want_open, OC.open_without_estimate?(pc, owner), "open_without_estimate? #{label}"
        route = OC.precise_route(data, owner, pc)
        if want_open
          assert_equal 'knock_out', route, "precise_route #{label}"
        else
          assert_nil route, "precise_route #{label}"
        end
      end
    end
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
