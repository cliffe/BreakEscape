require 'test_helper'
require 'open3'

# `emptyText` is read by the engine (interactions.js handleContainerInteraction) and `onceOnly`
# is dropped from timers (they are one-shot). The validator must not call the first unknown
# nor the m02/m04 timers carriers of the second.
class ValidateDeclaredFieldsTest < ActiveSupport::TestCase
  ROOT = File.expand_path('../..', __dir__)

  def validator_output(mission)
    out, = Open3.capture2e('ruby', File.join(ROOT, 'scripts/validate_scenario.rb'),
                           File.join(ROOT, 'scenarios', mission, 'scenario.json.erb'), chdir: ROOT)
    out
  end

  test 'the schema declares emptyText on items' do
    schema = JSON.parse(File.read(File.join(ROOT, 'scripts/scenario-schema.json')))
    assert schema.dig('definitions', 'item', 'properties', 'emptyText'), 'item.emptyText declared'
  end

  test 'no unknown-field warning for emptyText (m02) or timer onceOnly (m02, m04)' do
    %w[m02_ransomed_trust m04_critical_failure].each do |m|
      out = validator_output(m)
      refute_match(/unknown field 'emptyText'/, out, m)
      refute_match(/timers\[\d+\].*unknown field 'onceOnly'/, out, m)
    end
  end

  test 'no timer in m02 or m04 still carries onceOnly' do
    %w[m02_ransomed_trust m04_critical_failure].each do |m|
      text = File.read(File.join(ROOT, 'scenarios', m, 'scenario.json.erb'))
      block = text[/^\s*"timers": \[.*?^  \],/m]
      assert block, "#{m} timers block"
      refute_includes block, 'onceOnly', m
    end
  end
end
