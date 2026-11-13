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
      assert_equal 0, FU.current
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
      data = { 'a' => 1 }
      result = FU.upgrade!(data, {})
      assert_equal 0, data['formatVersion']
      assert_equal 1, data['a']
      assert_equal [], result[:ran]
      assert_equal false, result[:scenario_changed]
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
      assert_equal 0, FU.current
    end
  end
end
