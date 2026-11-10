require 'test_helper'
require 'json'
require 'open3'
require 'rbconfig'
require_relative '../../scripts/validate_npc_needs'

# Slice 9.1 step 1 (ACCESS_MODEL_SLICE_9_1_PLAN.md, 5.2): AccessIdentities.screen_always_locks?,
# decideLocked's order without the policy, and the library's plain Ruby.
class AccessIdentitiesScreenTest < ActiveSupport::TestCase
  AI = BreakEscape::AccessIdentities
  ROOT = File.expand_path('../..', __dir__)

  def owner(habit = :none)
    habit == :none ? { 'id' => 'jake' } : { 'id' => 'jake', 'screenHabit' => habit }
  end

  test 'the PC lockChance' do
    assert AI.screen_always_locks?({ 'lockChance' => 1 }, owner({ 'lockChance' => 0 }))
    refute AI.screen_always_locks?({ 'lockChance' => 0.5 }, owner)
    refute AI.screen_always_locks?({ 'lockChance' => 0 }, owner)
  end

  test 'the PC locksScreenOnLeave' do
    refute AI.screen_always_locks?({ 'locksScreenOnLeave' => false }, owner)
    assert AI.screen_always_locks?({ 'locksScreenOnLeave' => true }, owner({ 'lockChance' => 0 })),
           'a PC field beside a habit that leaves it open: the PC wins'
    assert AI.screen_always_locks?({ 'locksScreenOnLeave' => nil }, owner)
  end

  test 'no PC field and no owner locks' do
    assert AI.screen_always_locks?({}, nil)
    assert AI.screen_always_locks?(nil, nil)
  end

  test "the owner's screenHabit" do
    assert AI.screen_always_locks?({}, owner)
    assert AI.screen_always_locks?({}, owner({ 'lockChance' => 1 }))
    refute AI.screen_always_locks?({}, owner({ 'lockChance' => 0.5 }))
    refute AI.screen_always_locks?({}, owner({ 'lockChance' => 0 }))
    refute AI.screen_always_locks?({}, owner({ 'lockIfAwayOverSeconds' => 20 }))
    assert AI.screen_always_locks?({}, owner('sometimes')), 'a habit that is not an object'
    assert AI.screen_always_locks?({}, owner({})), 'a habit with neither field'
  end

  test 'the answers equal !ValidateNpcNeeds.habit_leaves_open? wherever the PC has no field' do
    [:none, { 'lockChance' => 1 }, { 'lockChance' => 0.5 }, { 'lockChance' => 0 },
     { 'lockIfAwayOverSeconds' => 20 }, 'sometimes', {}].each do |habit|
      expected = !ValidateNpcNeeds.habit_leaves_open?(habit == :none ? nil : habit)
      assert_equal expected, AI.screen_always_locks?({}, owner(habit)), habit.inspect
    end
  end

  test 'the library runs in plain Ruby with only access_identities.rb and npc_habits.rb' do
    fixture = {
      'rooms' => { 'office' => {
        'objects' => [{ 'type' => 'pc', 'workstation' => true }, { 'type' => 'pc', 'id' => 'mia_pc', 'lockType' => 'login' }],
        'npcs' => [{ 'id' => 'jake', 'awareness' => 'low', 'needsHome' => 'office_pc_0', 'creds' => { 'username' => 'j' } },
                   { 'id' => 'mia', 'role' => 'front', 'needsHome' => 'mia_pc', 'habits' => { 'writesDown' => true } }]
      } },
      'roles' => { 'front' => { 'awareness' => 'high' } }
    }
    script = <<~RUBY
      require 'json'
      require '#{ROOT}/lib/break_escape/access_identities'
      require '#{ROOT}/lib/break_escape/npc_habits'
      data = JSON.parse(STDIN.read)
      copy, report = BreakEscape::NpcHabits.expanded_copy(data)
      BreakEscape::NpcHabits.expand!(data)
      puts JSON.generate('copy' => copy, 'data' => data, 'report' => report.size,
                         'level' => BreakEscape::NpcHabits.level_of(data['rooms']['office']['npcs'][1], data))
    RUBY
    out, err, status = Open3.capture3(RbConfig.ruby, '--disable-gems', '-e', script, stdin_data: JSON.generate(fixture))
    assert status.success?, err
    result = JSON.parse(out)
    npcs = result['copy']['rooms']['office']['npcs']
    assert_equal({ 'lockChance' => 0 }, npcs[0]['screenHabit'])
    assert_equal({ 'lockChance' => 1 }, npcs[1]['screenHabit'])
    assert_equal 2, result['report']
    assert_equal 'high', result['level']
    refute result['data']['rooms']['office']['npcs'][0].key?('screenHabit'),
           'the raw data has no id on the PC, so expand! owns nothing there'
  end
end
