require 'test_helper'
require_relative '../support/ops_golden'

# Replays every fixture in test/fixtures/files/ops_unchanged/ on the current code and compares
# answers and server state with what was captured (OpsGolden). bin/ops-golden-compare runs this
# file. OPS_GOLDEN_ONLY=name1,name2 limits it to named fixtures.
module BreakEscape
  class OpsUnchangedReplayTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    only = ENV['OPS_GOLDEN_ONLY'].to_s.split(',').map(&:strip).reject(&:empty?)

    test 'there are fixtures to replay' do
      assert_not_empty OpsGolden.fixture_paths
    end

    # A misspelt OPS_GOLDEN_ONLY name must fail, not pass with nothing replayed.
    test 'every fixture named in OPS_GOLDEN_ONLY exists' do
      known = OpsGolden.fixture_paths.map { |path| File.basename(path, '.json') }
      assert_empty only - known, "no such fixture; known: #{known.join(', ')}"
    end

    OpsGolden.fixture_paths.each do |path|
      name = File.basename(path, '.json')
      next if only.any? && !only.include?(name)

      test "the #{name} fixture replays unchanged" do
        fixture = OpsGolden.load_fixture(path)
        actual = OpsGolden.play(self, fixture, mission: break_escape_missions(:ceo_exfil),
                                               player: break_escape_demo_users(:test_user))
        diffs = OpsGolden.compare(fixture['expected'], actual, defaults: Game::ACCESS_STATE_DEFAULTS)
        assert_empty diffs, "#{name} differs from main's capture:\n#{diffs.first(30).join("\n")}"
      end
    end
  end
end
