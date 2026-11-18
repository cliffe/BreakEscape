require 'test_helper'
require Rails.root.join('../../tools/playtest/lib/flag_needs').to_s

# tools/playtest/new-game.rb derives the flags a game needs from the scenario
# template's source. m10 declares them as a table and builds every reference by
# interpolation, which the literal scans never saw (FLAG_SOURCE=none).
class PlaytestFlagNeedsTest < ActiveSupport::TestCase
  test 'm01 style literal references and helper calls' do
    src = <<~ERB
      "flags": { "shatter_server": <%= vm_flags_json('shatter_server') %> }
      "shatter_server:flag_1" "shatter_server:flag_3"
      "flag_station_dropsite:shatter_server-flag2"
    ERB
    assert_equal({ 'shatter_server' => 3 }, FlagNeeds.from_source(src))
  end

  test 'm10 style table of per-VM flag lists' do
    src = <<~ERB
      m10_vms = {
        'bunker_monitor' => ['flag{a}', 'flag{b}'],
        'release_host'   => ['flag{c}'],
        'core_host'      => ['flag{d}']
      }
      target_flag = ->(n) { "\#{s[:id]}:\#{s[:vm]}-flag1" }
    ERB
    assert_equal({ 'bunker_monitor' => 2, 'release_host' => 1, 'core_host' => 1 }, FlagNeeds.from_source(src))
  end

  test 'real m10 and m01 templates give flags' do
    %w[m10_full_disclosure m01_first_contact].each do |name|
      src = File.read(Rails.root.join('../../scenarios', name, 'scenario.json.erb'))
      needs = FlagNeeds.from_source(src)
      assert needs.any?, "#{name} yields no flag needs"
      assert_equal 4, needs.values.sum, name
    end
  end

  test 'a scenario without flags yields none' do
    assert_empty FlagNeeds.from_source('{"rooms": {}}')
  end
end
