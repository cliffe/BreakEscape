require 'test_helper'
require_relative '../support/ops_unchanged_cases'

# Not a test of anything: the capture step of `rake ops:unchanged:capture`
# (lib/tasks/ops_unchanged.rake). It plays each case from OpsUnchangedCases on the code as it
# stands and writes test/fixtures/files/ops_unchanged/<name>.json. It does nothing unless
# OPS_UNCHANGED_CAPTURE is set, so a normal test run never rewrites a fixture.
module BreakEscape
  class OpsUnchangedCaptureTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    test 'capture the ops_unchanged fixtures' do
      skip 'set OPS_UNCHANGED_CAPTURE=1 (rake ops:unchanged:capture does)' unless ENV['OPS_UNCHANGED_CAPTURE'].present?
      assert Rails.env.test?, 'capture runs only in the test environment'
      only = ENV['OPS_UNCHANGED_ONLY'].to_s.split(',').map(&:strip).reject(&:empty?)
      OpsUnchangedCases.all.each do |name, fixture|
        next if only.any? && !only.include?(name)

        fixture['expected'] = OpsGolden.play(self, fixture, mission: break_escape_missions(:ceo_exfil),
                                                            player: break_escape_demo_users(:test_user))
        File.write(File.join(OpsGolden::DIR, "#{name}.json"), OpsGolden.dump(fixture))
      end
    end
  end
end
