require 'test_helper'

# MFA plan S8a unit 10: approvesPrompts and promptPatience are read raw by MfaModel. They survive
# habits expansion, change nothing else, and are not shipped habit keys.
class NpcHabitsMfaKeysTest < ActiveSupport::TestCase
  NH = BreakEscape::NpcHabits

  def scenario_with(npc)
    { 'startRoom' => 'office', 'rooms' => { 'office' => { 'type' => 'room_office', 'objects' => [], 'npcs' => [npc] } } }
  end

  def npc(attrs = {})
    { 'id' => 'jake', 'creds' => { 'username' => 'jake', 'password' => 'pw-jake' } }.merge(attrs)
  end

  test 'an NPC without the keys expands exactly as before' do
    habits = NH.expanded(npc('awareness' => 'low', 'habits' => { 'writesDown' => true }), {})
    assert_equal({ 'locksScreen' => 'never', 'holdsDoors' => true, 'writesDown' => true }, habits)
  end

  test 'the keys are not habits, parameters or shipped keys' do
    %w[approvesPrompts promptPatience].each do |key|
      refute NH::HABITS.key?(key)
      refute NH::PARAMETERS.include?(key)
      refute NH::PRESETS.values.any? { |p| p.key?(key) }
      assert NH::FOLDED.include?(key)
    end
    refute BreakEscape::Game.const_get(:SHIPPED_HABIT_KEYS).any? { |k| k.start_with?('approves', 'promptP') } if BreakEscape::Game.const_defined?(:SHIPPED_HABIT_KEYS)
  end

  test 'a habits block holding only the keys expands to nothing and is left alone' do
    n = npc('habits' => { 'approvesPrompts' => 'always', 'promptPatience' => 4 })
    assert_nil NH.expanded(n, {})
    data = scenario_with(n)
    NH.expand!(data)
    assert_equal({ 'approvesPrompts' => 'always', 'promptPatience' => 4 }, data['rooms']['office']['npcs'][0]['habits'])
  end

  test 'the keys survive the awareness expansion beside the preset' do
    data = scenario_with(npc('awareness' => 'high', 'habits' => { 'approvesPrompts' => 'pestered', 'promptPatience' => 5 }))
    NH.expand!(data)
    habits = data['rooms']['office']['npcs'][0]['habits']
    assert_equal 'pestered', habits['approvesPrompts']
    assert_equal 5, habits['promptPatience']
    assert_equal 'always', habits['locksScreen']
    assert_equal 'pestered', BreakEscape::MfaModel.prompt_habit(data['rooms']['office']['npcs'][0], data)
    assert_equal 5, BreakEscape::MfaModel.prompt_patience(data['rooms']['office']['npcs'][0])
  end
end
