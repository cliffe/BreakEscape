require 'test_helper'
require 'minitest/mock'

# Step 7. The load-time upgrader's pure logic: version_of, current, upgrade! (with scenario_changed),
# retired_keys_in, the mixed state the anonymiser's late write leaves, and the development-only test
# switch. STEPS is empty in step 7, so every test that needs steps stubs FormatUpgrade.steps (the one
# read point), which is what "stub STEPS" means here. Minitest's block-form stub is used.
module BreakEscape
  class FormatUpgradeTest < ActiveSupport::TestCase
    FU = BreakEscape::FormatUpgrade

    # Two toy steps. Step 1 renames a scenario key and a player_state key, both idempotently; step 2
    # is a no-op. current is 2.
    def toy_steps
      [
        { version: 1, name: 'to_1',
          scenario: ->(d) { d['renamed'] = d.delete('oldA') if d.is_a?(Hash) && d.key?('oldA') },
          player_state: ->(s) { s['psNew'] = s.delete('psOld') if s.is_a?(Hash) && s.key?('psOld') },
          retired: [{ path: nil, key: 'oldA', now: 'renamed' }] },
        { version: 2, name: 'to_2',
          scenario: ->(_d) { },
          player_state: ->(_s) { },
          retired: [] }
      ]
    end

    def one_step
      [{ version: 1, name: 'to_1',
         scenario: ->(d) { d['renamed'] = d.delete('oldA') if d.is_a?(Hash) && d.key?('oldA') },
         player_state: ->(s) { s['psNew'] = s.delete('psOld') if s.is_a?(Hash) && s.key?('psOld') },
         retired: [{ path: nil, key: 'oldA', now: 'renamed' }] }]
    end

    test 'current is 0 with no steps and the last version with steps' do
      # Step 8a lands a real step (version 1), so the no-step case is exercised with an empty stub.
      FU.stub(:steps, []) { assert_equal 0, FU.current }
      FU.stub(:steps, toy_steps) do
        assert_equal 2, FU.current
      end
    end

    test 'version_of: 0 for absent and nil, the number for an Integer' do
      assert_equal 0, FU.version_of({})
      assert_equal 0, FU.version_of({ 'formatVersion' => nil })
      assert_equal 3, FU.version_of({ 'formatVersion' => 3 })
      assert_equal 0, FU.version_of({ 'formatVersion' => 0 })
    end

    test 'version_of raises Unreadable for a string, a float and a negative' do
      assert_raises(FU::Unreadable) { FU.version_of({ 'formatVersion' => '1' }) }
      assert_raises(FU::Unreadable) { FU.version_of({ 'formatVersion' => 1.0 }) }
      assert_raises(FU::Unreadable) { FU.version_of({ 'formatVersion' => -1 }) }
    end

    test 'upgrade! with no steps stamps CURRENT and changes nothing else' do
      # With a real step landed (8a), the empty-list case is exercised with a stub so CURRENT is 0.
      FU.stub(:steps, []) do
        data = { 'a' => 1 }
        result = FU.upgrade!(data, {})
        assert_equal 0, data['formatVersion']
        assert_equal 1, data['a']
        assert_equal [], result[:ran]
        assert_equal false, result[:scenario_changed]
      end
    end

    # Step 8a (format 1): the real STEP_8A transform.
    test 'step 8a renames the outage fields and is idempotent' do
      data = {
        'networks' => { 'n' => { 'name' => 'N', 'downIf' => 'net_off' } },
        'resources' => { 'r' => { 'kind' => 'printer', 'downIf' => 'jam' } },
        'rooms' => { 'o' => { 'objects' => [
          { 'id' => 'pc', 'affordance' => { 'offWhen' => 'pc_off' } },
          { 'id' => 'copier', 'affordance' => { 'satisfies' => 'work', 'offWhen' => 'copier_off' } }
        ] } },
        '_draft' => { 'resources' => { 'z' => { 'downIf' => 'keep' } } }
      }
      state = { 'inventory' => [{ 'id' => 'c', 'affordance' => { 'offWhen' => 'c_off', 'useSeconds' => 2 } }] }
      res = FU.upgrade!(data, state)
      assert_equal 2, data['formatVersion']
      assert_equal %w[one_outage_field_offWhen one_owner_field], res[:ran]
      assert_equal 'net_off', data.dig('networks', 'n', 'offWhen')
      refute data['networks']['n'].key?('downIf')
      assert_equal 'jam', data.dig('resources', 'r', 'offWhen')
      pc = data['rooms']['o']['objects'][0]
      assert_equal 'pc_off', pc['offWhen']
      assert_equal({}, pc['affordance'], 'an emptied affordance stays {}')
      copier = data['rooms']['o']['objects'][1]
      assert_equal 'copier_off', copier['offWhen']
      assert_equal({ 'satisfies' => 'work' }, copier['affordance'])
      assert_equal 'keep', data.dig('_draft', 'resources', 'z', 'downIf'), 'a note is left as written'
      item = state['inventory'][0]
      assert_equal 'c_off', item['offWhen']
      assert_equal({ 'useSeconds' => 2 }, item['affordance'])
      before = Marshal.load(Marshal.dump(data))
      FU.steps.each { |s| s[:scenario]&.call(data); s[:player_state]&.call(state) }
      assert_equal before, data, 'idempotent'
    end

    test 'step 8a: a resource offWhen { name: value } goes down only when the value matches' do
      res = { 'r' => { 'kind' => 'printer', 'offWhen' => { 'mode' => 'maint' } } }
      data = { 'resources' => res, 'formatVersion' => 1 }
      # a no-op on format-1 data: the Hash form survives untouched
      FU.steps.each { |s| s[:scenario]&.call(data) }
      assert_equal({ 'mode' => 'maint' }, data.dig('resources', 'r', 'offWhen'))
      assert BreakEscape::AccessWork.globals_hold?({ 'mode' => 'maint' }, { 'mode' => 'maint' })
      refute BreakEscape::AccessWork.globals_hold?({ 'mode' => 'maint' }, { 'mode' => 'on' })
    end

    # Step 8b (format 2): the real STEP_8B transform. One owner field, with needsHome derivation.
    def owner_scenario
      {
        'rooms' => {
          'office' => {
            'npcs' => [
              { 'id' => 'rosa', 'needsHome' => 'rosa_pc' },
              { 'id' => 'sam', 'needsHome' => 'sam_pc' },
              { 'id' => 'tom', 'needsHome' => 'tom_pc' },
              { 'id' => 'jake', 'itemsHeld' => [{ 'type' => 'phone_friendface', 'phoneOf' => 'jake' }] }
            ],
            'objects' => [
              { 'id' => 'boss_pc', 'workstation' => true, 'screenOwner' => 'rosa' },
              { 'id' => 'sam_pc', 'lockChance' => 1 },
              { 'id' => 'shared_printer',
                'affordance' => { 'private' => true, 'owners' => %w[rosa sam], 'satisfies' => 'print' } },
              { 'id' => 'tom_pc', 'workstation' => true, 'affordance' => { 'private' => true } },
              { 'id' => 'rosa_phone', 'phoneOwner' => 'rosa' },
              { 'id' => 'mug', 'leftBehindBy' => 'sam' },
              { 'id' => 'rosa_pc', 'affordance' => { 'satisfies' => 'x' } }
            ],
            '_note' => { 'objects' => [{ 'id' => 'ghost', 'screenOwner' => 'nope' }] }
          }
        }
      }
    end

    test 'step 8b writes one owner from every old field and derives from needsHome' do
      data = owner_scenario
      res = FU.upgrade!(data, {})
      assert_equal 2, data['formatVersion']
      assert_includes res[:ran], 'one_owner_field'
      objs = data['rooms']['office']['objects'].each_with_object({}) { |o, h| h[o['id']] = o }

      assert_equal 'rosa', objs['boss_pc']['owner'], 'screenOwner becomes owner'
      refute objs['boss_pc'].key?('screenOwner')
      assert_equal 'sam', objs['sam_pc']['owner'], 'a workstation owner is derived from needsHome (String)'
      assert_equal %w[rosa sam], objs['shared_printer']['owner'], 'affordance.owners moves up as a list'
      assert_equal true, objs['shared_printer']['private'], 'affordance.private moves up'
      assert_equal({ 'satisfies' => 'print' }, objs['shared_printer']['affordance'])
      assert_equal 'tom', objs['tom_pc']['owner'], 'a private workstation derives a single String owner'
      assert_equal true, objs['tom_pc']['private']
      assert_equal({}, objs['tom_pc']['affordance'], 'an emptied affordance stays {}')
      assert_equal 'rosa', objs['rosa_phone']['owner']
      assert_equal true, objs['rosa_phone']['deskPhone'], 'phoneOwner marks a desk phone'
      refute objs['rosa_phone'].key?('phoneOwner')
      assert_equal 'sam', objs['mug']['owner']
      assert_equal 0, objs['mug']['leftBehindChance'], 'a left-behind item with no chance gets 0'
      refute objs['mug'].key?('leftBehindBy')
      refute objs['rosa_pc'].key?('owner'), 'a needsHome target that is neither workstation nor private gets no owner'
      phone = data['rooms']['office']['npcs'][3]['itemsHeld'][0]
      assert_equal 'jake', phone['owner'], 'an item phoneOf becomes owner'
      assert_equal 'nope', data['rooms']['office']['_note']['objects'][0]['screenOwner'],
                   'a note property is left as written'
    end

    test 'step 8b is idempotent and a no-op on format-2 data' do
      data = owner_scenario
      FU.upgrade!(data, {})
      before = Marshal.load(Marshal.dump(data))
      FU.one_owner_field!(data)
      assert_equal before, data, 'running the transform again changes nothing'
    end

    test 'step 8b player_state renames item copies in place without deriving' do
      state = {
        'inventory' => [{ 'type' => 'phone_friendface', 'phoneOf' => 'jake', 'name' => 'Phone' }],
        'room_states' => { 'office' => { 'objects_added' => [{ 'id' => 'mug', 'leftBehindBy' => 'sam' }] } }
      }
      FU.one_owner_field_in_player_state!(state)
      inv = state['inventory'][0]
      assert_equal 'jake', inv['owner']
      refute inv.key?('phoneOf')
      added = state['room_states']['office']['objects_added'][0]
      assert_equal 'sam', added['owner']
      assert_equal 0, added['leftBehindChance']
    end

    test 'upgrade! runs the steps above the stored version in order and is idempotent' do
      FU.stub(:steps, toy_steps) do
        data = { 'oldA' => 5 }
        state = { 'psOld' => 9 }
        result = FU.upgrade!(data, state)
        assert_equal %w[to_1 to_2], result[:ran]
        assert_equal 5, data['renamed']
        assert_nil data['oldA']
        assert_equal 9, state['psNew']
        assert_equal 2, data['formatVersion']

        again = FU.upgrade!(data, state)
        assert_equal [], again[:ran]
        assert_equal false, again[:scenario_changed]
        assert_equal 5, data['renamed']
      end
    end

    test 'upgrade! above CURRENT raises TooNew and writes nothing' do
      FU.stub(:steps, toy_steps) do
        data = { 'formatVersion' => 9, 'a' => 1 }
        assert_raises(FU::TooNew) { FU.upgrade!(data, {}) }
        assert_equal 9, data['formatVersion']
      end
    end

    test 'scenario_changed is false for a no-op step and true for a rename' do
      FU.stub(:steps, toy_steps) do
        noop = { 'formatVersion' => 1 }
        assert_equal false, FU.upgrade!(noop, {})[:scenario_changed]

        rename = { 'oldA' => 1 }
        assert_equal true, FU.upgrade!(rename, {})[:scenario_changed]
      end
    end

    test 'scenario_changed is false when a step only changes player_state' do
      ps_only = [{ version: 1, name: 'ps', scenario: ->(_d) { },
                   player_state: ->(s) { s['x'] = 1 }, retired: [] }]
      FU.stub(:steps, ps_only) do
        data = {}
        state = {}
        assert_equal false, FU.upgrade!(data, state)[:scenario_changed]
        assert_equal 1, state['x']
      end
    end

    test 'the mixed state the anonymiser leaves upgrades cleanly and equals a clean upgrade' do
      FU.stub(:steps, one_step) do
        clean_data = { 'oldA' => 7 }
        clean_state = { 'psOld' => 8 }
        FU.upgrade!(clean_data, clean_state)

        # mixed: scenario_data written back at N-1 (0), player_state already upgraded to N
        mixed_data = { 'oldA' => 7, 'formatVersion' => 0 }
        mixed_state = { 'psNew' => 8 }
        FU.upgrade!(mixed_data, mixed_state)

        assert_equal clean_data, mixed_data
        assert_equal clean_state, mixed_state
      end
    end

    test 'retired_keys_in finds a key at depth and skips one inside an author note' do
      FU.stub(:steps, one_step) do
        data = {
          'scenario_brief' => 'x', 'startRoom' => 'a',
          'rooms' => { 'a' => { 'resources' => { 'net' => { 'oldA' => 'g' } },
                                '_draft' => { 'oldA' => 'ignored' } } }
        }
        found = FU.retired_keys_in(data)
        assert_equal 1, found.length
        assert_equal 'oldA', found.first[:key]
        assert_equal 'renamed', found.first[:now]
        assert_equal 1, found.first[:version]
        assert_includes found.first[:path], 'oldA'
      end
    end

    test 'retired_keys_in is empty with no steps' do
      assert_equal [], FU.retired_keys_in({ 'rooms' => {} })
    end

    test 'the dev test switch adds a 900 step only in development' do
      assert_nil FU.install_dev_test_step!(env: 'test', enabled: true)
      assert_nil FU.install_dev_test_step!(env: 'production', enabled: true)
      assert_nil FU.install_dev_test_step!(env: 'development', enabled: false)

      step = FU.install_dev_test_step!(env: 'development', enabled: true)
      assert_equal 900, step[:version]
      assert_equal 900, FU.current
      assert_nil FU.install_dev_test_step!(env: 'development', enabled: true)
    ensure
      FU::STEPS.reject! { |s| s[:version] == 900 }
      assert_equal 2, FU.current, 'the 900 dev step is removed, leaving steps 8a and 8b (format 2)'
    end
  end
end
