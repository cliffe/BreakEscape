require 'test_helper'

# Feature A21: the difficulty table of the offline cracker.
class CrackDifficultyTest < ActiveSupport::TestCase
  CD = BreakEscape::CrackDifficulty

  def record(crack = nil, extra = {})
    r = { 'kind' => 'hash', 'account' => 'dana' }.merge(extra)
    r['crack'] = crack if crack
    r
  end

  def npc(grade = nil)
    n = { 'id' => 'dana' }
    n['habits'] = { 'password' => 'guessable', 'passwordDifficulty' => grade } if grade
    n
  end

  test 'grades with no overrides' do
    assert_equal({ salted: false, crack_seconds: nil }, CD.resolve(record('difficulty' => 'easy'), npc))
    assert_equal({ salted: true, crack_seconds: 60 }, CD.resolve(record('difficulty' => 'medium'), npc))
    assert_equal({ salted: true, crack_seconds: 120 }, CD.resolve(record('difficulty' => 'hard'), npc))
  end

  test 'no grade: unsalted, or 60 seconds when the record says salted' do
    assert_equal({ salted: false, crack_seconds: nil }, CD.resolve(record, npc))
    assert_equal({ salted: true, crack_seconds: 60 }, CD.resolve(record(nil, 'salted' => true), npc))
    assert_equal({ salted: false, crack_seconds: nil }, CD.resolve(record(nil, 'salted' => false), npc))
  end

  test 'salted written each way wins over the grade' do
    assert_equal({ salted: false, crack_seconds: nil }, CD.resolve(record({ 'difficulty' => 'hard' }, 'salted' => false), npc))
    assert_equal({ salted: true, crack_seconds: 60 }, CD.resolve(record({ 'difficulty' => 'easy' }, 'salted' => true), npc))
    assert_equal({ salted: true, crack_seconds: 120 }, CD.resolve(record({ 'difficulty' => 'hard' }, 'salted' => true), npc))
  end

  test 'crackSeconds written wins' do
    assert_equal({ salted: true, crack_seconds: 30 }, CD.resolve(record({ 'difficulty' => 'hard' }, 'crackSeconds' => 30), npc))
    assert_equal({ salted: true, crack_seconds: 10 }, CD.resolve(record(nil, 'salted' => true, 'crackSeconds' => 10), npc))
  end

  test 'the NPC grade applies when the record has none, and the record wins otherwise' do
    assert_equal({ salted: true, crack_seconds: 120 }, CD.resolve(record, npc('hard')))
    assert_equal({ salted: false, crack_seconds: nil }, CD.resolve(record('difficulty' => 'easy'), npc('hard')))
  end

  test 'an unknown grade from either place resolves to nil' do
    assert_nil CD.resolve(record('difficulty' => 'brutal'), npc)
    assert_nil CD.resolve(record, npc('brutal'))
    assert_nil CD.resolve(record('difficulty' => 'easy'), npc('brutal'))
  end

  test 'fact_band' do
    assert_equal 1..1, CD.fact_band('easy')
    assert_equal 2..2, CD.fact_band('medium')
    assert_equal 3..4, CD.fact_band('hard')
    assert_nil CD.fact_band('brutal')
  end
end
