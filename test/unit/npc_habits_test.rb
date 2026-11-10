require 'test_helper'

# Slice 9.1 step 1 (ACCESS_MODEL_SLICE_9_1_PLAN.md, sections 4, 5.1 and 5.2): the habits
# library, its presets, levels and the locksScreen fill.
class NpcHabitsTest < ActiveSupport::TestCase
  NH = BreakEscape::NpcHabits

  def npc(attrs = {})
    { 'id' => 'jake', 'displayName' => 'Jake', 'creds' => { 'username' => 'jake', 'password' => 'pw-jake' } }.merge(attrs)
  end

  def scenario_with(npcs, objects = [], extra = {})
    { 'startRoom' => 'office',
      'rooms' => { 'office' => { 'type' => 'room_office', 'objects' => objects, 'npcs' => npcs } } }.merge(extra)
  end

  def deep(hash)
    Marshal.load(Marshal.dump(hash))
  end

  def report_for(report, id)
    report.find { |item| item[:id] == id }
  end

  test 'each preset gives the table in 4.2, and writesDown and password are never set by a level' do
    { 'low' => 'never', 'medium' => 'sometimes', 'high' => 'always' }.each do |level, value|
      habits = NH.expanded(npc('awareness' => level), {})
      assert_equal({ 'locksScreen' => value }, habits, level)
    end
    NH::PRESETS.each_value do |preset|
      refute preset.key?('writesDown')
      refute preset.key?('password')
      refute preset.key?('passwordPattern')
    end
  end

  test 'a habit by name replaces the preset and leaves the rest; habits with no level give only those keys' do
    habits = NH.expanded(npc('awareness' => 'high', 'habits' => { 'locksScreen' => 'never', 'writesDown' => true }), {})
    assert_equal({ 'locksScreen' => 'never', 'writesDown' => true }, habits)

    habits = NH.expanded(npc('awareness' => 'high', 'habits' => { 'writesDown' => true }), {})
    assert_equal({ 'locksScreen' => 'always', 'writesDown' => true }, habits)

    assert_equal({ 'password' => 'reused' }, NH.expanded(npc('habits' => { 'password' => 'reused' }), {}))
    assert_nil NH.expanded(npc, {}), 'no level and no habits: nil'
  end

  test "levels: the NPC's own field beats a role's, the first authored role wins, staff is tried last" do
    roles = { 'roles' => { 'front_desk' => { 'awareness' => 'low' }, 'finance' => { 'awareness' => 'high' },
                           'staff' => { 'awareness' => 'medium' } } }
    assert_equal 'high', NH.level_of(npc('awareness' => 'high', 'role' => 'front_desk'), roles)
    assert_equal 'low', NH.level_of(npc('role' => %w[front_desk finance]), roles)
    assert_equal 'high', NH.level_of(npc('role' => %w[finance front_desk]), roles)
    assert_equal 'low', NH.level_of(npc('role' => %w[cleaner front_desk]), roles), 'a role with no level is skipped'
    assert_equal 'medium', NH.level_of(npc('role' => 'cleaner'), roles), 'the implicit staff last'
    assert_equal 'role:front_desk', NH.level_with_source(npc('role' => 'front_desk'), roles).last
    assert_equal :own, NH.level_with_source(npc('awareness' => 'low'), roles).last
  end

  test 'roles.staff.awareness reaches creds and card holders only, and not staff: false' do
    roles = { 'roles' => { 'staff' => { 'awareness' => 'medium' } } }
    assert_equal 'medium', NH.level_of(npc, roles), 'creds and no other level'
    card_only = { 'id' => 'len', 'creds' => { 'card' => { 'card_id' => 'c1' } } }
    assert_equal 'medium', NH.level_of(card_only, roles), 'a card and no creds account'
    legacy_card = { 'id' => 'len', 'rfidCard' => { 'card_id' => 'c1' } }
    assert_equal 'medium', NH.level_of(legacy_card, roles)
    assert_nil NH.level_of(npc('staff' => false), roles), 'staff: false'
    bare = { 'id' => 'cleaner' }
    assert_nil NH.level_of(bare, roles), 'no creds and no card'
    assert_nil NH.expanded(bare, roles), 'no level, no habits'
  end

  test 'an unknown level, habit or value is dropped; holdsDoors is unknown at this step' do
    assert_nil NH.level_of(npc('awareness' => 'paranoid'), {})
    habits = NH.expanded(npc('habits' => { 'locksScreen' => 'often', 'holdsDoors' => false, 'phishable' => true,
                                           'writesDown' => 'yes', 'password' => 'guessable' }), {})
    assert_equal({ 'password' => 'guessable' }, habits)
    refute NH::HABITS.key?('holdsDoors')
  end

  test 'sources marks each habit by name or preset; parameters are not listed' do
    subject = npc('awareness' => 'high',
                  'habits' => { 'writesDown' => true, 'password' => 'guessable', 'passwordPattern' => 'memo' })
    assert_equal({ 'locksScreen' => :preset, 'writesDown' => :explicit, 'password' => :explicit },
                 NH.sources(subject, {}))
  end

  test 'passwordPattern: a non-empty string is kept as written; a number or an empty string is dropped' do
    assert_equal 'it_memo', NH.expanded(npc('habits' => { 'passwordPattern' => 'it_memo' }), {})['passwordPattern']
    assert_equal({}, NH.expanded(npc('habits' => { 'passwordPattern' => 7 }), {}))
    assert_equal({}, NH.expanded(npc('habits' => { 'passwordPattern' => '' }), {}))
    NH::LEVELS.each { |level| refute NH.expanded(npc('awareness' => level), {}).key?('passwordPattern') }
  end

  test 'lock_chance' do
    assert_equal 0, NH.lock_chance('never')
    assert_equal 0.5, NH.lock_chance('sometimes')
    assert_equal 1, NH.lock_chance('always')
  end

  test 'locksScreen fills screenHabit for the owner of a workstation and of a sign-in PC, and no object gains a field' do
    { 'never' => 0, 'sometimes' => 0.5, 'always' => 1 }.each do |value, chance|
      [{ 'workstation' => true }, { 'lockType' => 'login' }].each do |kind|
        pc = { 'type' => 'pc', 'id' => 'jake_pc' }.merge(kind)
        data = scenario_with([npc('needsHome' => 'jake_pc', 'habits' => { 'locksScreen' => value })], [pc])
        before = deep(pc)
        NH.expand!(data)
        assert_equal({ 'lockChance' => chance }, data['rooms']['office']['npcs'][0]['screenHabit'], "#{value} #{kind}")
        assert_equal before, data['rooms']['office']['objects'][0], 'the PC is not written'
      end
    end
  end

  test 'ownership through screenOwner and through needsHome' do
    data = scenario_with(
      [npc('id' => 'jake', 'awareness' => 'low'), npc('id' => 'mia', 'awareness' => 'high', 'needsHome' => 'mia_pc')],
      [{ 'type' => 'pc', 'id' => 'desk_1', 'workstation' => true, 'screenOwner' => 'jake' },
       { 'type' => 'pc', 'id' => 'mia_pc', 'lockType' => 'login' }]
    )
    report = NH.expand!(data)
    npcs = data['rooms']['office']['npcs']
    assert_equal({ 'lockChance' => 0 }, npcs[0]['screenHabit'])
    assert_equal({ 'lockChance' => 1 }, npcs[1]['screenHabit'])
    assert_equal ['desk_1'], report_for(report, 'jake')[:screen][:pcs].map { |pc| pc[:id] }
    assert_equal ['mia_pc'], report_for(report, 'mia')[:screen][:pcs].map { |pc| pc[:id] }
  end

  test 'a needsHome that names a stamped id is owned in the copy' do
    data = scenario_with([npc('needsHome' => 'office_pc_0', 'awareness' => 'low')],
                         [{ 'type' => 'pc', 'workstation' => true }])
    copy, report = NH.expanded_copy(data)
    assert_equal({ 'lockChance' => 0 }, copy['rooms']['office']['npcs'][0]['screenHabit'])
    assert_equal ['office_pc_0'], report_for(report, 'jake')[:screen][:pcs].map { |pc| pc[:id] }
  end

  test 'an NPC who owns two PCs gets one screenHabit and both PCs are listed' do
    data = scenario_with([npc('awareness' => 'medium', 'needsHome' => 'pc_a')],
                         [{ 'type' => 'pc', 'id' => 'pc_a', 'workstation' => true },
                          { 'type' => 'pc', 'id' => 'pc_b', 'lockType' => 'login', 'screenOwner' => 'jake' }])
    report = NH.expand!(data)
    assert_equal({ 'lockChance' => 0.5 }, data['rooms']['office']['npcs'][0]['screenHabit'])
    assert_equal %w[pc_a pc_b], report_for(report, 'jake')[:screen][:pcs].map { |pc| pc[:id] }.sort
  end

  test 'an owned PC with its own lock field keeps it and is reported not applied there' do
    data = scenario_with([npc('awareness' => 'low', 'needsHome' => 'pc_a')],
                         [{ 'type' => 'pc', 'id' => 'pc_a', 'workstation' => true, 'lockChance' => 1 },
                          { 'type' => 'pc', 'id' => 'pc_b', 'lockType' => 'login', 'screenOwner' => 'jake' }])
    report = NH.expand!(data)
    assert_equal({ 'lockChance' => 0 }, data['rooms']['office']['npcs'][0]['screenHabit'])
    assert_equal 1, data['rooms']['office']['objects'][0]['lockChance']
    pcs = report_for(report, 'jake')[:screen][:pcs].to_h { |pc| [pc[:id], pc] }
    refute pcs['pc_a'][:applied]
    assert_equal 'lockChance', pcs['pc_a'][:field]
    assert pcs['pc_b'][:applied]
  end

  test 'every PC sets a lock field, or no workstation: no screenHabit' do
    data = scenario_with([npc('awareness' => 'low', 'needsHome' => 'pc_a'), npc('id' => 'ian', 'awareness' => 'high')],
                         [{ 'type' => 'pc', 'id' => 'pc_a', 'lockType' => 'login', 'locksScreenOnLeave' => true }])
    report = NH.expand!(data)
    npcs = data['rooms']['office']['npcs']
    refute npcs[0].key?('screenHabit')
    refute npcs[1].key?('screenHabit')
    assert_equal :every_pc_sets_a_field, report_for(report, 'jake')[:screen][:reason]
    assert_equal :no_workstation, report_for(report, 'ian')[:screen][:reason]
  end

  test 'an authored screenHabit is kept exactly and reported habit not applied' do
    [{ 'lockIfAwayOverSeconds' => 20 }, 'sometimes'].each do |authored|
      data = scenario_with([npc('awareness' => 'high', 'needsHome' => 'pc_a', 'screenHabit' => authored)],
                           [{ 'type' => 'pc', 'id' => 'pc_a', 'workstation' => true }])
      report = NH.expand!(data)
      assert_equal authored, data['rooms']['office']['npcs'][0]['screenHabit']
      screen = report_for(report, 'jake')[:screen]
      refute screen[:filled]
      assert_equal :authored_screen_habit, screen[:reason]
    end
  end

  test 'a workstation with no id beside an NPC with no needsHome: no screenHabit and no owner' do
    data = scenario_with([npc('awareness' => 'low')], [{ 'type' => 'pc', 'workstation' => true }])
    report = NH.expand!(data)
    refute data['rooms']['office']['npcs'][0].key?('screenHabit')
    screen = report_for(report, 'jake')[:screen]
    assert_empty screen[:pcs]
    assert_equal :no_workstation, screen[:reason]
  end

  test 'with a level the NPC habits object is written; with habits alone it is left as written, minus invalid entries' do
    data = scenario_with([npc('awareness' => 'medium', 'habits' => { 'writesDown' => true }),
                          npc('id' => 'mia', 'habits' => { 'password' => 'reused', 'locksScreen' => 'often' })])
    NH.expand!(data)
    npcs = data['rooms']['office']['npcs']
    assert_equal({ 'locksScreen' => 'sometimes', 'writesDown' => true }, npcs[0]['habits'])
    assert_equal({ 'password' => 'reused' }, npcs[1]['habits'])
  end

  test 'a second expand! changes nothing' do
    data = scenario_with(
      [npc('awareness' => 'low', 'needsHome' => 'pc_a', 'habits' => { 'writesDown' => true }),
       npc('id' => 'mia', 'role' => 'front_desk', 'needsHome' => 'pc_b')],
      [{ 'type' => 'pc', 'id' => 'pc_a', 'workstation' => true }, { 'type' => 'pc', 'id' => 'pc_b', 'lockType' => 'login' }],
      'roles' => { 'front_desk' => { 'awareness' => 'high' } }
    )
    NH.expand!(data)
    once = deep(data)
    NH.expand!(data)
    assert_equal once, data
  end

  test 'malformed input: no exception and no change' do
    cases = {
      'habits a string' => scenario_with([npc('habits' => 'careless', 'needsHome' => 'pc_a')],
                                         [{ 'type' => 'pc', 'id' => 'pc_a', 'workstation' => true }]),
      'awareness a number' => scenario_with([npc('awareness' => 3, 'needsHome' => 'pc_a')],
                                            [{ 'type' => 'pc', 'id' => 'pc_a', 'workstation' => true }]),
      'roles a list' => scenario_with([npc('role' => 'front_desk', 'needsHome' => 'pc_a')],
                                      [{ 'type' => 'pc', 'id' => 'pc_a', 'workstation' => true }],
                                      'roles' => [{ 'front_desk' => { 'awareness' => 'low' } }]),
      'npcs holding a non-object' => scenario_with(['jake', 7, nil], [{ 'type' => 'pc', 'id' => 'pc_a', 'workstation' => true }])
    }
    cases.each do |name, data|
      before = deep(data)
      assert_nothing_raised { NH.expand!(data) }
      assert_equal before, data, name
    end
    assert_nothing_raised { NH.expand!(nil) }
    assert_nothing_raised { NH.expand!({ 'rooms' => [] }) }
  end

  test 'expanded_copy leaves the authored hash unchanged and stamps ids by the server rule' do
    data = scenario_with(
      [npc('awareness' => 'low', 'needsHome' => 'office_pc_1'), npc('id' => 'mia', 'awareness' => 'high')],
      [{ 'type' => 'desk', 'contents' => [{ 'type' => 'notes' }, { 'type' => 'box', 'contents' => [{ 'type' => 'key' }] }] },
       { 'type' => 'pc', 'workstation' => true },
       { 'type' => 'pc', 'lockType' => 'login', 'screenOwner' => 'mia' }]
    )
    before = deep(data)
    copy, report = NH.expanded_copy(data)
    assert_equal before, data, 'the authored hash is unchanged'

    objects = copy['rooms']['office']['objects']
    assert_equal 'office_desk_0', objects[0]['id']
    assert_equal 'office_desk_0_content_0', objects[0]['contents'][0]['id']
    assert_equal 'office_desk_0_content_1_content_0', objects[0]['contents'][1]['contents'][0]['id']
    assert_equal 'office_pc_1', objects[1]['id']

    npcs = copy['rooms']['office']['npcs']
    assert_equal({ 'lockChance' => 0 }, npcs[0]['screenHabit'], 'owned through a needsHome naming its stamped id')
    assert_equal({ 'lockChance' => 1 }, npcs[1]['screenHabit'], 'owned through a screenOwner on an id-less PC')
    assert_equal ['office_pc_1'], report_for(report, 'jake')[:screen][:pcs].map { |pc| pc[:id] }
    assert_equal ['office_pc_2'], report_for(report, 'mia')[:screen][:pcs].map { |pc| pc[:id] }
  end

  test 'a scenario with no awareness, habits or roles is untouched' do
    data = scenario_with([npc('needsHome' => 'pc_a', 'screenHabit' => { 'lockChance' => 0 })],
                         [{ 'type' => 'pc', 'id' => 'pc_a', 'lockType' => 'login' }])
    before = deep(data)
    assert_equal [], NH.expand!(data)
    assert_equal before, data
  end
end
