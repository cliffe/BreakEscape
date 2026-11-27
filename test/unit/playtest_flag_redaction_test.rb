require 'test_helper'
require Rails.root.join('../../tools/playtest/lib/flag_redaction').to_s

# tools/playtest/verify-run.rb prints submitted flags redacted unless --show-flags.
class PlaytestFlagRedactionTest < ActiveSupport::TestCase
  FLAGS = ['flag{made_up_value_one}', 'flag{made_up_value_two}'].freeze

  test 'the default output contains no full flag value' do
    out = FlagRedaction.list(FLAGS)
    FLAGS.each { |f| refute_includes out, f }
    refute_includes out, 'made_up'
    assert_equal 2, out.scan('<redacted len=').length
    assert_includes out, "len=#{FLAGS.first.length}"
  end

  test 'redaction is stable and tells different values apart' do
    assert_equal FlagRedaction.mark(FLAGS[0]), FlagRedaction.mark(FLAGS[0])
    refute_equal FlagRedaction.mark(FLAGS[0]), FlagRedaction.mark(FLAGS[1])
  end

  test 'show restores the full values' do
    assert_equal FLAGS.join(', '), FlagRedaction.list(FLAGS, show: true)
  end

  test 'verify-run.rb redacts by default and has the --show-flags switch' do
    src = File.read(Rails.root.join('../../tools/playtest/verify-run.rb'))
    assert_includes src, "ARGV.delete('--show-flags')"
    assert_includes src, 'FlagRedaction.list(flags, show: show_flags)'
    refute_match(/flags\.join\(/, src)
  end
end
