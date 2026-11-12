require 'test_helper'

# Slice 9.1 step 1 (ACCESS_MODEL_SLICE_9_1_PLAN.md, sections 4, 5.1 and 5.2): the habits
# library, its presets, levels and the locksScreen fill. Step 5 (5.4): holdsDoors and the
# gate fill.
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
    { 'low' => ['never', true], 'medium' => ['sometimes', true], 'high' => ['always', false] }.each do |level, (lock, hold)|
      habits = NH.expanded(npc('awareness' => level), {})
      assert_equal({ 'locksScreen' => lock, 'holdsDoors' => hold }, habits, level)
    end
    NH::PRESETS.each_value do |preset|
      refute preset.key?('writesDown')
      refute preset.key?('password')
      refute preset.key?('passwordPattern')
    end
  end

  test 'a habit by name replaces the preset and leaves the rest; habits with no level give only those keys' do
    habits = NH.expanded(npc('awareness' => 'high', 'habits' => { 'locksScreen' => 'never', 'writesDown' => true }), {})
    assert_equal({ 'locksScreen' => 'never', 'holdsDoors' => false, 'writesDown' => true }, habits)

    habits = NH.expanded(npc('awareness' => 'high', 'habits' => { 'writesDown' => true, 'holdsDoors' => true }), {})
    assert_equal({ 'locksScreen' => 'always', 'holdsDoors' => true, 'writesDown' => true }, habits)

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

  test 'an unknown level, habit or value is dropped' do
    assert_nil NH.level_of(npc('awareness' => 'paranoid'), {})
    habits = NH.expanded(npc('habits' => { 'locksScreen' => 'often', 'holdsDoors' => 'no', 'phishable' => true,
                                           'writesDown' => 'yes', 'password' => 'guessable' }), {})
    assert_equal({ 'password' => 'guessable' }, habits)
  end

  test 'sources marks each habit by name or preset; parameters are not listed' do
    subject = npc('awareness' => 'high',
                  'habits' => { 'writesDown' => true, 'password' => 'guessable', 'passwordPattern' => 'memo' })
    assert_equal({ 'locksScreen' => :preset, 'holdsDoors' => :preset, 'writesDown' => :explicit, 'password' => :explicit },
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
    assert_equal({ 'locksScreen' => 'sometimes', 'holdsDoors' => true, 'writesDown' => true }, npcs[0]['habits'])
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
  # ---- holdsDoors (step 5) --------------------------------------------------------

  # A hall with a gate north into store (openFor the given ids) and the NPCs given.
  def gate_scenario(npcs, gate, extra_doors = [])
    { 'startRoom' => 'hall',
      'rooms' => {
        'hall' => { 'type' => 'room_office', 'connections' => { 'north' => 'store' }, 'npcs' => npcs,
                    'doors' => [{ 'connectedRoom' => 'store', 'direction' => 'north', 'gate' => gate }] + extra_doors },
        'store' => { 'type' => 'room_office', 'connections' => { 'south' => 'hall' }, 'locked' => true }
      } }
  end

  def guard(id, attrs = {})
    { 'id' => id, 'npcType' => 'person', 'creds' => { 'card' => { 'card_id' => "#{id}-1" } } }.merge(attrs)
  end

  test 'noHold lists the openFor NPCs whose holdsDoors is false, by preset or by name' do
    data = gate_scenario([guard('sara', 'awareness' => 'high'), guard('gary', 'awareness' => 'low'),
                          guard('una', 'awareness' => 'low', 'habits' => { 'holdsDoors' => false })],
                         { 'openFor' => %w[sara gary una] })
    report = NH.expand!(data)
    assert_equal %w[sara una], data['rooms']['hall']['doors'][0]['gate']['noHold']
    doors = report_for(report, 'sara')[:doors]
    assert_equal false, doors[:value]
    assert_equal [{ path: 'rooms/hall/doors/0', room: 'hall', connected_room: 'store', applied: true, no_hold: true, reason: nil }],
                 doors[:gates]
    refute report_for(report, 'gary')[:doors][:gates][0][:no_hold]
  end

  test 'an openFor string is read as one id' do
    data = gate_scenario([guard('sara', 'awareness' => 'high')], { 'openFor' => 'sara' })
    NH.expand!(data)
    assert_equal ['sara'], data['rooms']['hall']['doors'][0]['gate']['noHold']
  end

  test 'a gate with playerMayPassIf or an authored noHold is left alone and reported' do
    data = gate_scenario([guard('sara', 'awareness' => 'high')], { 'openFor' => ['sara'], 'playerMayPassIf' => 'disguised' })
    report = NH.expand!(data)
    refute data['rooms']['hall']['doors'][0]['gate'].key?('noHold')
    assert_equal :player_may_pass_if, report_for(report, 'sara')[:doors][:gates][0][:reason]

    data = gate_scenario([guard('sara', 'awareness' => 'high')], { 'openFor' => ['sara'], 'noHold' => [] })
    report = NH.expand!(data)
    assert_equal [], data['rooms']['hall']['doors'][0]['gate']['noHold']
    assert_equal :authored_no_hold, report_for(report, 'sara')[:doors][:gates][0][:reason]
  end

  test 'a gate whose guards all hold, or have no level, gets no noHold' do
    data = gate_scenario([guard('gary', 'awareness' => 'medium'), { 'id' => 'cleaner', 'npcType' => 'person' }],
                         { 'openFor' => %w[gary cleaner] })
    NH.expand!(data)
    refute data['rooms']['hall']['doors'][0]['gate'].key?('noHold')
  end

  test 'an NPC that no gate opens for is reported with no gate' do
    data = gate_scenario([guard('sara', 'awareness' => 'high')], { 'openFor' => ['gary'] })
    report = NH.expand!(data)
    assert_equal :no_gate, report_for(report, 'sara')[:doors][:reason]
    refute data['rooms']['hall']['doors'][0]['gate'].key?('noHold')
  end

  test 'doors an object and gate a string are skipped with no exception' do
    data = gate_scenario([guard('sara', 'awareness' => 'high')], { 'openFor' => ['sara'] })
    data['rooms']['hall']['doors'] = { 'north' => { 'gate' => { 'openFor' => ['sara'] } } }
    before = deep(data['rooms']['hall']['doors'])
    assert_nothing_raised { NH.expand!(data) }
    assert_equal before, data['rooms']['hall']['doors']

    data = gate_scenario([guard('sara', 'awareness' => 'high')], 'sara')
    assert_nothing_raised { NH.expand!(data) }
    assert_equal 'sara', data['rooms']['hall']['doors'][0]['gate']
    assert_equal false, data['rooms']['hall']['npcs'][0]['habits']['holdsDoors'], 'the NPC part still runs'
  end

  test 'a second expand! with gates changes nothing' do
    data = gate_scenario([guard('sara', 'awareness' => 'high'), guard('gary', 'awareness' => 'low')],
                         { 'openFor' => %w[sara gary] })
    NH.expand!(data)
    once = deep(data)
    NH.expand!(data)
    assert_equal once, data
  end

  # Review R3 nit 1: one reading of noHold, the client's (door-gates.js normaliseGate)
  test 'gate_no_hold reads a list of strings and nothing else' do
    assert_equal %w[sara gary], NH.gate_no_hold('noHold' => ['sara', 3, 'gary'])
    assert_equal [], NH.gate_no_hold('noHold' => 'sara')
    assert_equal [], NH.gate_no_hold({})
    assert_equal [], NH.gate_no_hold(nil)
  end

  test 'a string noHold is not reported as listing the guard' do
    data = gate_scenario([guard('sara', 'awareness' => 'high')], { 'openFor' => ['sara'], 'noHold' => 'sara' })
    gate = report_for(NH.expand!(data), 'sara')[:doors][:gates][0]
    assert_equal :authored_no_hold, gate[:reason]
    assert_equal false, gate[:no_hold]
  end

  # doors.js reads a door entry only when its connectedRoom and direction match a doorway the
  # room's connections build, and only the first entry for that doorway
  test 'doorway_problem reads a door entry as doors.js does' do
    room = { 'connections' => { 'north' => %w[lobby vault], 'south' => 'yard' },
             'doors' => [{ 'connectedRoom' => 'vault', 'direction' => 'north' },
                         { 'connectedRoom' => 'yard', 'direction' => 'south' },
                         { 'connectedRoom' => 'vault' },
                         { 'connectedRoom' => 'vault', 'direction' => 'North' },
                         { 'connectedRoom' => 'vault', 'direction' => 'south' },
                         { 'connectedRoom' => 'vault', 'direction' => 'north' },
                         { 'connectedRoom' => 'nowhere', 'direction' => 'north' },
                         'not a door'] }
    assert_nil NH.doorway_problem(room, 0)
    assert_nil NH.doorway_problem(room, 1)
    assert_equal :no_direction, NH.doorway_problem(room, 2)
    assert_equal :no_direction, NH.doorway_problem(room, 3)
    assert_equal :no_connection, NH.doorway_problem(room, 4)
    assert_equal :shadowed, NH.doorway_problem(room, 5)
    assert_equal :no_connection, NH.doorway_problem(room, 6)
    assert_equal :no_direction, NH.doorway_problem(room, 7)
    assert_equal :no_connection, NH.doorway_problem({ 'doors' => [{ 'connectedRoom' => 'vault', 'direction' => 'north' }] }, 0)
  end

  # A gate on an entry no doorway reads does nothing: expand! fills no noHold on it and the
  # report has no gate for its guard
  test 'a gate on an entry doors.js never reads gets no fill and counts as no gate' do
    data = scenario_with([npc('id' => 'sara', 'npcType' => 'person', 'awareness' => 'high')])
    data['rooms']['office']['connections'] = { 'north' => 'vault' }
    data['rooms']['office']['doors'] = [{ 'connectedRoom' => 'vault', 'gate' => { 'openFor' => ['sara'] } }]
    data['rooms']['vault'] = { 'type' => 'room_office', 'connections' => { 'south' => 'office' } }
    live = deep(data)
    live['rooms']['office']['doors'][0]['direction'] = 'north'

    assert_equal :no_direction, NH.gate_entries(data)[0][:doorway]
    doors = report_for(NH.expand!(data), 'sara')[:doors]
    assert_equal :no_gate, doors[:reason]
    refute data['rooms']['office']['doors'][0]['gate'].key?('noHold')
    # mirror: with its direction the gate is read and filled
    assert_nil NH.gate_entries(live)[0][:doorway]
    assert_nil report_for(NH.expand!(live), 'sara')[:doors][:reason]
    assert_equal ['sara'], live['rooms']['office']['doors'][0]['gate']['noHold']
  end
end
