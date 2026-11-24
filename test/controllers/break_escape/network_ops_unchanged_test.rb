require 'test_helper'
require_relative '../../support/ops_golden'
require_relative '../../support/ops_unchanged_cases'

module BreakEscape
  # Ops core plan (docs/achitechture/OPS_CORE_PLAN.md) section 10, part 1: the golden answers for
  # every scenario that declares networks. Each scenario has a fixture
  # test/fixtures/files/ops_unchanged/core_<scenario>.json, a fixed script played through the real
  # routes (bootstrap, every room, GET /network and GET /keyring, then per foothold a plant, join
  # or implant, the foothold's views, remote sign-ins and their desktops, an unplug), recorded on
  # main before any ops-core edit. It is compared for equality by OpsGolden, the shared helper
  # behind bin/ops-golden-compare (which also replays these fixtures).
  #
  # Never recapture a fixture to make this pass; a difference means behaviour changed. To add
  # a scenario that declares networks, see lib/tasks/ops_unchanged.rake
  # (ONLY=core_<scenario> bin/rails app:ops:unchanged:capture, on code without ops-core edits).
  class NetworkOpsUnchangedTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    CORE_FIXTURES = OpsGolden.fixture_paths.select { |path| File.basename(path).start_with?('core_') }.freeze

    # The scenarios are found by the key, as the plan says: one that gains a top-level `networks`
    # block needs a fixture (a `test_ops_*` scenario is exempt: a later step builds it).
    test 'every scenario that declares networks has a captured fixture' do
      have = CORE_FIXTURES.map { |path| File.basename(path, '.json').delete_prefix('core_') }
      missing = OpsUnchangedCases.core_network_scenario_names - have
      assert_empty missing, "no core_<name>.json fixture for #{missing.join(', ')}: capture it on code without ops-core edits " \
                            '(ONLY=core_<name> bin/rails app:ops:unchanged:capture), then commit it'
    end

    test 'the plan names these eight scenarios' do
      names = CORE_FIXTURES.map { |path| File.basename(path, '.json').delete_prefix('core_') }
      %w[test_access_networks test_access_devices test_access_keyring test_author_notes demo_access_tour
         lab_physical_pentest ca20_remote_and_mobile_working ca20_remote_and_mobile_working_defend].each do |name|
        assert_includes names, name
      end
    end

    CORE_FIXTURES.each do |path|
      name = File.basename(path, '.json')
      fixture = OpsGolden.load_fixture(path)

      test "#{name} records the bootstrap, each room, the network and keyring views and the desktops" do
        ids = fixture['steps'].map { |s| s['id'] }
        assert_includes ids, 'bootstrap'
        assert_includes ids, 'bootstrap_after'
        assert_includes ids, 'network_plain'
        assert_includes ids, 'keyring_plain'
        fixture['scenario']['rooms'].each_key { |room| assert_includes ids, "room_#{room}" }
        ids.grep(/\Asignin_(.+)_(\w+)\z/) { |id| assert_includes ids, id.sub('signin_', 'desktop_') }
        assert_equal fixture['steps'].size, fixture['expected']['answers'].size
      end

      test "#{name} answers as main did" do
        actual = OpsGolden.play(self, fixture, mission: break_escape_missions(:ceo_exfil),
                                               player: break_escape_demo_users(:test_user))
        diffs = OpsGolden.compare(fixture['expected'], actual, defaults: Game::ACCESS_STATE_DEFAULTS)
        assert_empty diffs, "#{name} differs from main's capture (do not recapture to silence it):\n#{diffs.first(30).join("\n")}"
      end
    end
  end
end
