require 'test_helper'
require_relative '../../scripts/validate_npc_habits'

# Feature A21: habits.passwordDifficulty is a habit parameter with two validator rows.
class NpcHabitsPasswordDifficultyTest < ActiveSupport::TestCase
  def scenario(habits)
    { 'startRoom' => 'office',
      'rooms' => { 'office' => { 'type' => 'room_office', 'objects' => [], 'npcs' => [
        { 'id' => 'jake', 'displayName' => 'Jake', 'creds' => { 'username' => 'jake', 'password' => 'pw-jake' },
          'habits' => habits }
      ] } } }
  end

  def issues(habits)
    json = scenario(habits)
    expanded, report = BreakEscape::NpcHabits.expanded_copy(json)
    ValidateNpcHabits.check(json, expanded: expanded, report: report)
  end

  test 'a parameter, not a habit' do
    assert_includes BreakEscape::NpcHabits::PARAMETERS, 'passwordDifficulty'
    assert BreakEscape::NpcHabits.valid_parameter?('passwordDifficulty', 'hard')
    refute BreakEscape::NpcHabits.valid_habit?('passwordDifficulty', 'hard')
  end

  test 'an unknown grade is an error' do
    found = issues('password' => 'guessable', 'passwordDifficulty' => 'brutal')
    assert(found.any? { |i| i.include?('ERROR') && i.include?('passwordDifficulty') }, found.join("\n"))
  end

  test 'a known grade with a password habit is clean' do
    found = issues('password' => 'guessable', 'passwordDifficulty' => 'hard')
    assert_empty(found.grep(/passwordDifficulty/), found.join("\n"))
  end

  test 'a grade with no password habit warns' do
    found = issues('passwordDifficulty' => 'hard')
    assert(found.any? { |i| i.include?('WARNING') && i.include?('passwordDifficulty has no effect without a password habit') },
           found.join("\n"))
  end
end
