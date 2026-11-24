require 'test_helper'

# S8c unit 03: BreakEscape::LockStepModel, pure functions of the authored scenario.
class LockStepModelTest < ActiveSupport::TestCase
  LM = BreakEscape::LockStepModel

  def step(kind = 'push', owner = 'jake')
    { 'kind' => kind, 'owner' => owner }
  end

  def locked(extra = {})
    { 'type' => 'safe', 'id' => 'safe1', 'locked' => true, 'lockType' => 'pin', 'requires' => '1234' }.merge(extra)
  end

  def phone(owner = 'jake', id = 'ph1')
    { 'type' => 'phone_friendface', 'id' => id, 'name' => 'Phone', 'owner' => owner, 'takeable' => true }
  end

  def device(owner = 'jake', id = 'dev1')
    { 'type' => 'code_device', 'id' => id, 'name' => 'Token', 'owner' => owner, 'takeable' => true }
  end

  def scen(objects: [], npcs: [], start: [], extra: {})
    { 'rooms' => { 'r' => { 'objects' => objects, 'npcs' => npcs } }, 'startItemsInInventory' => start }.merge(extra)
  end

  def jake(extra = {})
    { 'id' => 'jake', 'displayName' => 'Jake' }.merge(extra)
  end

  test 'constants' do
    assert_equal %w[push push_number_match code], LM::LOCK_KINDS
    assert_equal %w[password pin], LM::CODE_LOCK_TYPES
    assert_includes LM::PUSH_LOCK_TYPES, 'ble'
  end

  test 'lock_step for each kind' do
    LM::LOCK_KINDS.each do |kind|
      assert_equal({ 'kind' => kind, 'owner' => 'jake' }, LM.lock_step(locked('secondStep' => step(kind))))
    end
  end

  test 'lock_step is nil for a bad kind, a non-Hash and no step' do
    assert_nil LM.lock_step(locked('secondStep' => step('sms')))
    assert_nil LM.lock_step(locked('secondStep' => 'push'))
    assert_nil LM.lock_step(locked('secondStep' => nil))
    assert_nil LM.lock_step(locked)
    assert_nil LM.lock_step(nil)
  end

  test 'owner falls back to the object owner when it is one NPC id' do
    assert_equal 'amy', LM.lock_step(locked('owner' => 'amy', 'secondStep' => { 'kind' => 'code' }))['owner']
    assert_equal 'amy', LM.lock_step(locked('owner' => ['amy'], 'secondStep' => { 'kind' => 'code' }))['owner']
    assert_equal 'jake', LM.lock_step(locked('owner' => 'amy', 'secondStep' => step('code')))['owner']
  end

  test 'owner is nil with no owner or several' do
    assert_nil LM.lock_step(locked('secondStep' => { 'kind' => 'code' }))['owner']
    assert_nil LM.lock_step(locked('owner' => %w[amy bob], 'secondStep' => { 'kind' => 'code' }))['owner']
    assert_nil LM.lock_step(locked('owner' => '', 'secondStep' => { 'kind' => 'code' }))['owner']
  end

  test 'walk finds a lock in each home' do
    inner = locked('id' => 'inner', 'secondStep' => step)
    outer = locked('id' => 'outer', 'contents' => [inner])
    held = locked('id' => 'held', 'secondStep' => step('code'))
    startl = locked('id' => 'startl', 'secondStep' => step)
    grant = locked('id' => 'grantl', 'secondStep' => step)
    headless = locked('id' => 'headl', 'secondStep' => step)
    data = scen(
      objects: [outer],
      npcs: [jake('itemsHeld' => [held])],
      start: [startl],
      extra: {
        'rooms' => { 'r' => { 'locked' => true, 'lockType' => 'rfid', 'secondStep' => step,
                              'objects' => [outer], 'npcs' => [jake('itemsHeld' => [held])] } },
        'timers' => [{ 'actions' => [{ 'type' => 'give_item', 'item' => grant.merge('type' => 'briefcase') }] }],
        'social' => { 'characters' => { 'c' => { 'channels' => { 'email' => 'mailer' },
                                                  'emailRecord' => { 'itemsHeld' => [headless] } } } }
      }
    )
    found = LM.each_lock_step(data).to_h { |e| [e[:id], e] }
    assert_equal %w[r inner held startl grantl headl].sort, found.keys.sort
    assert_equal :door, found['r'][:kind]
    assert_equal :door, found['r'][:home]
    assert_equal [:object, :room, %w[outer]], found['inner'].values_at(:kind, :home, :path)
    assert_equal 'outer', found['inner'][:parent]['id']
    assert_equal [:npc, 'jake'], found['held'].values_at(:home, :npc)
    assert_equal :start, found['startl'][:home]
    assert_equal :grant, found['grantl'][:home]
    assert_equal [:npc, 'mailer'], found['headl'].values_at(:home, :npc)
  end

  test 'walk yields the five-part shape to a block and skips ungated things' do
    data = scen(objects: [locked, locked('id' => 'g', 'secondStep' => step('code'))])
    seen = []
    LM.each_lock_step(data) { |lockable, kind, id, home, where| seen << [lockable['id'], kind, id, home, where[:room]] }
    assert_equal [['g', :object, 'g', :room, 'r']], seen
    assert_equal [], LM.each_lock_step({})
    assert_equal [], LM.each_lock_step(nil)
  end

  test 'a gated object with no id is yielded with a nil id' do
    data = scen(objects: [locked('id' => nil, 'secondStep' => step)])
    assert_equal [nil], LM.each_lock_step(data).map { |e| e[:id] }
  end

  # push: four cases
  test 'push never passes: owner who approves when pestered passes' do
    l = locked('secondStep' => step('push'))
    data = scen(objects: [l], npcs: [jake('habits' => { 'approvesPrompts' => 'pestered' })])
    refute LM.lock_step_never_passes?(data, l)
  end

  test 'push never passes: careful owner with a takeable phone passes' do
    l = locked('secondStep' => step('push'))
    data = scen(objects: [l, phone], npcs: [jake('habits' => { 'approvesPrompts' => 'never' })])
    refute LM.lock_step_never_passes?(data, l)
  end

  test 'push never passes: careful owner with no phone never passes' do
    l = locked('secondStep' => step('push'))
    data = scen(objects: [l], npcs: [jake('habits' => { 'approvesPrompts' => 'never' })])
    assert LM.lock_step_never_passes?(data, l)
    assert LM.lock_step_never_passes?(scen(objects: [l], npcs: [jake]), l)
  end

  test 'push never passes: an owner who always approves passes' do
    l = locked('secondStep' => step('push'))
    data = scen(objects: [l], npcs: [jake('habits' => { 'approvesPrompts' => 'always' })])
    refute LM.lock_step_never_passes?(data, l)
  end

  test 'push_number_match needs a held phone whatever the habit' do
    l = locked('secondStep' => step('push_number_match'))
    habits = { 'habits' => { 'approvesPrompts' => 'always' } }
    assert LM.lock_step_never_passes?(scen(objects: [l], npcs: [jake(habits)]), l)
    refute LM.lock_step_never_passes?(scen(objects: [l, phone], npcs: [jake(habits)]), l)
  end

  test 'push_number_match ignores a phone that belongs to someone else' do
    l = locked('secondStep' => step('push_number_match'))
    assert LM.lock_step_never_passes?(scen(objects: [l, phone('amy')], npcs: [jake]), l)
  end

  test 'code needs the owner device to be held' do
    l = locked('secondStep' => step('code'))
    assert LM.lock_step_never_passes?(scen(objects: [l], npcs: [jake]), l)
    refute LM.lock_step_never_passes?(scen(objects: [l, device], npcs: [jake]), l)
    refute LM.lock_step_never_passes?(scen(objects: [l], npcs: [jake], start: [device]), l)
  end

  test 'code is not passed by a phone, nor a push by a code device' do
    code = locked('secondStep' => step('code'))
    assert LM.lock_step_never_passes?(scen(objects: [code, phone], npcs: [jake]), code)
    nm = locked('secondStep' => step('push_number_match'))
    assert LM.lock_step_never_passes?(scen(objects: [nm, device], npcs: [jake]), nm)
  end

  test 'never passes is false with no step and true with no owner' do
    refute LM.lock_step_never_passes?(scen(objects: [locked]), locked)
    l = locked('secondStep' => { 'kind' => 'code' })
    assert LM.lock_step_never_passes?(scen(objects: [l]), l)
  end

  test 'each_lock_step walks account profiles and shares, with contents at depth' do
    gated = lambda do |id, inner = []|
      { 'type' => 'folder', 'id' => id, 'locked' => true, 'lockType' => 'pin', 'requires' => '1',
        'secondStep' => step, 'contents' => inner }
    end
    data = scen(extra: {
                  'accountProfiles' => { 'p1' => { 'contents' => [gated.call('pf', [gated.call('pdeep')])] }, 'bad' => 'x' },
                  'resources' => { 's1' => { 'network' => 'n', 'contents' => [gated.call('sf')] } }
                })
    found = LM.each_lock_step(data).to_h { |e| [e[:id], e] }
    assert_equal %w[pdeep pf sf], found.keys.sort
    assert_equal :profile, found['pf'][:home]
    assert_equal :profile, found['pdeep'][:home]
    assert_equal ['pf'], found['pdeep'][:path]
    assert_equal :share, found['sf'][:home]
    assert_nil found['sf'][:room]
  end

  test 'profiles and shares with no step add nothing' do
    data = scen(extra: { 'accountProfiles' => { 'p1' => { 'contents' => [locked] } },
                         'resources' => { 's1' => { 'contents' => [locked] } } })
    assert_empty LM.each_lock_step(data)
  end
end
