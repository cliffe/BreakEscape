require 'test_helper'
require 'minitest/mock'

module BreakEscape
  # S8c unit 12: rules A to C of a second step on any lock
  class LockSecondStepTest < ActiveSupport::TestCase
    def step(owner = 'amy', kind = 'push')
      { 'kind' => kind, 'owner' => owner }
    end

    def doc(id = 'doc1')
      { 'type' => 'notes', 'id' => id, 'name' => "Doc #{id}", 'locked' => true, 'lockType' => 'pin', 'requires' => '1',
        'secondStep' => step }
    end

    def scenario
      deep = { 'type' => 'safe', 'id' => 'inner', 'name' => 'Inner', 'locked' => true, 'lockType' => 'pin',
               'requires' => '2', 'secondStep' => step, 'contents' => [doc('deepdoc')] }
      mid = { 'type' => 'safe', 'id' => 'mid', 'name' => 'Mid', 'locked' => true, 'lockType' => 'pin',
              'requires' => '3', 'secondStep' => step, 'contents' => [deep] }
      outer = { 'type' => 'safe', 'id' => 'outer', 'name' => 'Outer', 'locked' => true, 'lockType' => 'pin',
                'requires' => '4', 'secondStep' => step('amy', 'code'), 'contents' => [mid] }
      plain = { 'type' => 'safe', 'id' => 'plain', 'name' => 'Plain', 'locked' => true, 'lockType' => 'pin',
                'requires' => '5', 'contents' => [{ 'type' => 'notes', 'id' => 'plaindoc', 'name' => 'Plain doc' }] }
      idless = { 'type' => 'tablet', 'name' => 'Tablet', 'locked' => true, 'lockType' => 'pin', 'requires' => '6',
                 'secondStep' => step, 'contents' => [{ 'type' => 'notes', 'id' => 'tabdoc', 'name' => 'Tab doc' }] }
      pc = { 'type' => 'pc', 'id' => 'pc1', 'name' => 'PC', 'locked' => true, 'lockType' => 'login',
             'contents' => [{ 'type' => 'folder', 'id' => 'pcfolder', 'name' => 'Folder', 'locked' => true,
                              'lockType' => 'pin', 'requires' => '7', 'secondStep' => step,
                              'contents' => [{ 'type' => 'notes', 'id' => 'pcdoc', 'name' => 'PC doc' }] }] }
      twin_a = { 'type' => 'notes', 'id' => 'twa', 'name' => 'Twin' }
      twin_b = { 'type' => 'notes', 'id' => 'twb', 'name' => 'Twin' }
      bag = { 'type' => 'bag1', 'id' => 'bag', 'name' => 'Bag', 'locked' => true, 'lockType' => 'pin', 'requires' => '8',
              'secondStep' => step }
      { 'startRoom' => 'hall',
        'startItemsInInventory' => [{ 'type' => 'laptop', 'id' => 'startlap', 'name' => 'Start laptop', 'locked' => true,
                                      'lockType' => 'pin', 'requires' => '9', 'secondStep' => step }],
        'accountProfiles' => { 'p1' => { 'for' => { 'roles' => ['staff'] },
                                         'contents' => [{ 'type' => 'folder', 'id' => 'profdir', 'name' => 'Profile dir',
                                                          'locked' => true, 'lockType' => 'pin', 'requires' => '1',
                                                          'secondStep' => step,
                                                          'contents' => [{ 'type' => 'notes', 'id' => 'profdoc', 'name' => 'Prof doc' }] }] } },
        'resources' => { 'share1' => { 'network' => 'n1',
                                       'contents' => [{ 'type' => 'folder', 'id' => 'sharedir', 'name' => 'Share dir',
                                                        'locked' => true, 'lockType' => 'pin', 'requires' => '1',
                                                        'secondStep' => step,
                                                        'contents' => [{ 'type' => 'notes', 'id' => 'sharedoc', 'name' => 'Share doc' }] }] } },
        'timers' => [{ 'actions' => [{ 'type' => 'give_item',
                                       'item' => { 'type' => 'laptop', 'id' => 'grantlap', 'name' => 'Grant laptop',
                                                   'contents' => [{ 'type' => 'folder', 'id' => 'grantdir', 'name' => 'Grant dir',
                                                                    'locked' => true, 'lockType' => 'pin', 'requires' => '1',
                                                                    'secondStep' => step,
                                                                    'contents' => [{ 'type' => 'notes', 'id' => 'grantdoc', 'name' => 'Grant doc' }] }] } }] }],
        'rooms' => { 'hall' => { 'type' => 'room_office', 'connections' => { 'north' => 'vault' },
                                 'objects' => [outer, plain, idless, pc, twin_a, twin_b],
                                 'npcs' => [{ 'id' => 'amy', 'itemsHeld' => [bag] }] },
                     'vault' => { 'type' => 'room_office', 'locked' => true, 'lockType' => 'pin', 'requires' => '9999',
                                  'secondStep' => step('amy', 'code') } } }
    end

    def build_game(data = scenario)
      Game.create!(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                   scenario_data: data,
                   player_state: { 'currentRoom' => 'hall', 'unlockedRooms' => ['hall'], 'inventory' => [] })
    end

    def ungated(data)
      copy = Marshal.load(Marshal.dump(data))
      strip = lambda do |o|
        case o
        when Hash then o.delete('secondStep'); o.each_value { |v| strip.call(v) }
        when Array then o.each { |v| strip.call(v) }
        end
      end
      strip.call(copy)
      copy
    end

    test 'second_step_ids lists ids from every home and skips id-less and doors' do
      ids = build_game.second_step_ids
      %w[outer mid inner deepdoc pcfolder bag startlap grantdir].each { |i| assert_includes ids, i }
      assert_not_includes ids, 'plain'
      assert_not_includes ids, 'vault'
      assert_not_includes ids, ''
      # accountProfiles and resources are homes the plan allows (4.1, G1), so they are gated
      %w[profdir sharedir].each { |i| assert_includes ids, i }
    end

    test 'second_step_ids is memoised per instance' do
      g = build_game
      assert_same g.second_step_ids, g.second_step_ids
    end

    test 'Rule A raises without a passed record' do
      g = build_game
      obj = g.resolve_unlock_target('outer')[:object]
      assert_raises(LockSecondStep::StepNotPassed) { g.record_step_open!(obj) }
      g.lock_steps_map['object:outer'] = { 'id' => 'object:outer', 'kind' => 'code', 'at' => g.mfa_now }
      assert_raises(LockSecondStep::StepNotPassed) { g.record_step_open!(obj) }
      assert_not_includes Array(g.player_state['unlockedObjects']), 'outer'
    end

    test 'Rule A raises for an ungated object and an id-less gated one' do
      g = build_game
      assert_raises(LockSecondStep::StepNotPassed) { g.record_step_open!(g.find_scenario_object('plain')) }
      assert_raises(LockSecondStep::StepNotPassed) { g.record_step_open!(scenario['rooms']['hall']['objects'][2]) }
    end

    test 'Rule A writes the id and deletes the record with a passed record' do
      g = build_game
      obj = g.resolve_unlock_target('outer')[:object]
      g.lock_steps_map['object:outer'] = { 'id' => 'object:outer', 'kind' => 'code', 'at' => 0, 'passed' => true }
      g.record_step_open!(obj)
      g.reload
      assert_includes g.player_state['unlockedObjects'], 'outer'
      assert_not g.player_state['lockSteps'].key?('object:outer')
      assert g.step_object_open?(obj)
    end

    test 'the tidy keeps a passed record and drops an old unpassed one' do
      g = build_game
      g.lock_steps_map['object:outer'] = { 'at' => g.mfa_now - 10_000, 'passed' => true }
      g.lock_steps_map['object:mid'] = { 'at' => g.mfa_now - 10_000 }
      g.lock_steps_map['object:inner'] = { 'at' => g.mfa_now }
      map = g.lock_steps_map
      assert map.key?('object:outer')
      assert_not map.key?('object:mid')
      assert map.key?('object:inner')
    end

    test 'Rule B ignores a posted name' do
      g = build_game
      g.player_state['unlockedObjects'] = ['Outer', 'some name']
      assert_not g.step_object_open?(g.resolve_unlock_target('outer')[:object])
      g.player_state['unlockedObjects'] = ['outer']
      assert g.step_object_open?(g.resolve_unlock_target('Outer')[:object])
      assert_not g.step_object_open?({ 'name' => 'outer' })
    end

    test 'Rule C at three depths' do
      g = build_game
      path = g.resolve_unlock_target('deepdoc')[:path]
      assert_equal %w[outer mid inner], path.map { |c| c['id'] }
      assert g.behind_closed_step?(path)
      g.player_state['unlockedObjects'] = %w[outer]
      assert g.behind_closed_step?(path)
      g.player_state['unlockedObjects'] = %w[outer mid]
      assert g.behind_closed_step?(path)
      g.player_state['unlockedObjects'] = %w[outer mid inner]
      assert_not g.behind_closed_step?(path)
    end

    test 'Rule C ignores ungated and plain locked containers and the empty path' do
      g = build_game
      assert_not g.behind_closed_step?([])
      assert_not g.behind_closed_step?(nil)
      assert_not g.behind_closed_step?(g.resolve_unlock_target('plaindoc')[:path])
      assert_equal %w[plain], g.resolve_unlock_target('plaindoc')[:path].map { |c| c['id'] }
    end

    test 'Rule C under a sign-in PC and a held grant' do
      g = build_game
      g.player_state['inventory'] = [{ 'type' => 'laptop', 'id' => 'grantlap', 'name' => 'Grant laptop' }]
      { 'pcdoc' => %w[pc1 pcfolder], 'grantdoc' => %w[grantlap grantdir] }.each do |id, want|
        found = g.resolve_unlock_target(id)
        assert found, id
        assert_equal want, found[:path].map { |c| c['id'] }, id
        assert g.behind_closed_step?(found[:path]), id
      end
    end

    test 'the resolver agrees with find_scenario_object for every id it finds' do
      data = scenario
      gated = build_game(data)
      legacy = build_game(ungated(data))
      legacy_inventory = [{ 'type' => 'laptop', 'id' => 'grantlap', 'name' => 'Grant laptop' }]
      [gated, legacy].each { |g| g.player_state['inventory'] = legacy_inventory }
      assert legacy.second_step_ids.empty?
      %w[outer mid inner deepdoc plain plaindoc pc1 pcfolder pcdoc bag startlap profdir profdoc sharedir sharedoc
         grantlap grantdir grantdoc Mid Twin twa twb hall_safe_0 hall_pc_3 nothing].each do |id|
        got = gated.find_scenario_object(id)
        want = legacy.find_scenario_object(id)
        got = ungated(got) if got
        want.nil? ? assert_nil(got, id) : assert_equal(want, got, id)
      end
      assert_equal 'twa', gated.resolve_unlock_target('Twin')[:object]['id']
    end

    test 'the resolver walks profiles and shares as find_scenario_object does, with their paths' do
      g = build_game
      assert_equal %w[profdir], g.resolve_unlock_target('profdoc')[:path].map { |c| c['id'] }
      assert_equal %w[sharedir], g.resolve_unlock_target('sharedoc')[:path].map { |c| c['id'] }
    end

    test 'the resolver matches the client-generated id at the top of a room only' do
      g = build_game
      assert_equal 'outer', g.resolve_unlock_target('hall_safe_0')[:object]['id']
      assert_nil g.resolve_unlock_target('hall_safe_0_x')
    end

    test 'an id-less gated object never opens' do
      g = build_game
      assert_nil g.resolve_unlock_target('Tablet')
      assert_nil g.find_scenario_object('hall_tablet_2')
      tab = scenario['rooms']['hall']['objects'][2]
      assert g.behind_closed_step?([tab])
      assert_not g.step_object_open?(tab)
      assert_raises(LockSecondStep::StepNotPassed) { g.record_step_open!(tab) }
      assert_not g.validate_unlock('object', 'Tablet', '6', 'pin')
    end

    test 'lock_step_for answers by id only' do
      g = build_game
      r = g.lock_step_for('object', 'mid')
      assert_equal({ kind: 'object', id: 'mid' }, r[:subject])
      assert_equal 'object:mid', r[:key]
      assert_equal 'push', r[:step]['kind']
      assert_equal 'mid', r[:object]['id']
      assert_nil g.lock_step_for('object', 'Mid')
      assert_nil g.lock_step_for('object', 'plain')
      assert_nil g.lock_step_for('object', 'Tablet')
      assert_nil g.lock_step_for('object', 'hall_safe_0')
      d = g.lock_step_for('door', 'vault')
      assert_equal 'door:vault', d[:key]
      assert_equal 'code', d[:step]['kind']
      assert_equal 'room_office', d[:room]['type']
      assert_nil g.lock_step_for('door', 'hall')
      assert_nil g.lock_step_for('door', 'mid')
      assert_nil g.lock_step_for('room', 'vault')
    end

    test 'lock_steps_map returns the state map' do
      g = build_game
      assert_same g.player_state['lockSteps'], g.lock_steps_map
    end

    test 'a scenario with no step is inert' do
      g = build_game(ungated(scenario))
      assert_empty g.second_step_ids
      assert_not g.behind_closed_step?([{ 'id' => 'plain' }])
      assert_nil g.lock_step_for('object', 'plain')
    end

    test 'an object with no id keeps second_step_ids from reading empty, though it lists no id' do
      lone = { 'type' => 'tablet', 'name' => 'Tablet', 'locked' => true, 'lockType' => 'pin', 'requires' => '6',
               'secondStep' => step, 'contents' => [{ 'type' => 'notes', 'id' => 'tabdoc', 'name' => 'Tab doc' }] }
      g = build_game(lone_scenario(lone))
      assert_equal 0, g.second_step_ids.size
      assert_not g.second_step_ids.empty?
      assert g.second_step_ids.frozen?
    end

    test 'the only gated object having no id is never opened by the plain unlock path' do
      lone = { 'type' => 'tablet', 'name' => 'Tablet', 'locked' => true, 'lockType' => 'pin', 'requires' => '6',
               'secondStep' => step, 'contents' => [{ 'type' => 'notes', 'id' => 'tabdoc', 'name' => 'Tab doc' }] }
      g = build_game(lone_scenario(lone))
      # by name, by generated id, and with the right and wrong code, by every method
      %w[Tablet hall_tablet_0].each do |target|
        [['pin', '6'], ['pin', '0'], ['unlocked', ''], ['npc', ''], ['key', '']].each do |method, attempt|
          assert_not g.validate_unlock('object', target, attempt, method), "#{target} #{method} #{attempt}"
        end
        assert_nil g.find_scenario_object(target)
      end
      assert g.behind_closed_step?([lone])
      assert_empty Array(g.player_state['unlockedObjects'])
      # the old walk it replaces would have found and opened it
      plain = build_game(ungated(lone_scenario(lone)))
      assert plain.validate_unlock('object', 'Tablet', '6', 'pin')
    end

    test 'the tablet contents are not delivered with the object closed' do
      lone = { 'type' => 'tablet', 'name' => 'Tablet', 'locked' => true, 'lockType' => 'pin', 'requires' => '6',
               'secondStep' => step, 'contents' => [{ 'type' => 'notes', 'id' => 'tabdoc', 'name' => 'Tab doc' }] }
      g = build_game(lone_scenario(lone))
      resolved = g.resolve_unlock_target('tabdoc')
      assert_equal [lone], resolved[:path]
      assert_not g.validate_unlock('object', 'tabdoc', '', 'unlocked', resolved: resolved),
                 'a child of a gated id-less object is refused'
    end

    def lone_scenario(object)
      { 'startRoom' => 'hall',
        'rooms' => { 'hall' => { 'type' => 'room_office', 'objects' => [object],
                                 'npcs' => [{ 'id' => 'amy' }] } } }
    end

    # Rule A, "one writer": every place in app/ and lib/ that writes player_state['unlockedObjects']
    # (an assignment, `<<`, `+=`, `|=`, push, concat and the like, but not a bare `||= []`
    # initialiser) must be one of the two intended methods. A third writer fails this test.
    WRITER_PATTERN = /\[['"]unlockedObjects['"]\]\s*(?:<<|\+=|\|\|=(?!\s*\[\]\s*$)|\|=|-=|(?<![=!<>~])=(?![=~>])|\.(?:push|append|concat|unshift|insert|replace|prepend)\b)|['"]unlockedObjects['"]\s*=>/

    test 'only unlock_object! and record_step_open! write player_state unlockedObjects' do
      root = BreakEscape::Engine.root
      found = []
      Dir[root.join('{app,lib}/**/*.rb')].sort.each do |file|
        method = nil
        File.foreach(file).with_index(1) do |line, _n|
          method = Regexp.last_match(1) if line =~ /^\s*def\s+(?:self\.)?([\w!?=]+)/
          next if line.strip.start_with?('#')

          found << [file.sub("#{root}/", ''), method] if line.match?(WRITER_PATTERN)
        end
      end
      assert_equal [['app/models/break_escape/game.rb', 'unlock_object!'],
                    ['app/models/break_escape/lock_second_step.rb', 'record_step_open!']],
                   found.uniq.sort
    end

    test 'the writer pattern sees every form of write' do
      [%q(player_state['unlockedObjects'] << id), %q(player_state['unlockedObjects'] += [id]),
       %q(player_state['unlockedObjects'] = [id]), %q(player_state['unlockedObjects'].push(id)),
       %q(player_state['unlockedObjects'].concat(ids)), %q(player_state['unlockedObjects'] |= [id]),
       %q(player_state['unlockedObjects'] ||= [id]), %q(state.merge('unlockedObjects' => [id]))].each do |line|
        assert_match WRITER_PATTERN, line
      end
      [%q(player_state['unlockedObjects'] ||= []), %q(player_state['unlockedObjects'].include?(id)),
       %q(Array(player_state['unlockedObjects']) == [])].each do |line|
        assert_no_match WRITER_PATTERN, line
      end
    end
  end
end
