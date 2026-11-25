require 'test_helper'

# tools/playtest/new-game.rb --submit-flag replays a station's rewards the way the server does:
# a give_item stamps the item's facts and a grant_fact reward is applied, not left to the client.
class PlaytestSeedFactsTest < ActiveSupport::TestCase
  SRC = File.read(Rails.root.join('../../tools/playtest/new-game.rb'))

  test 'give_item adds the item as a fact source' do
    assert_includes SRC, 'g.add_inventory_item!(item, fact_source: true)'
  end

  test 'grant_fact is stamped and listed as applied' do
    assert_includes SRC, "when 'grant_fact'"
    assert_includes SRC, 'g.stamp_earned_facts!([r[\'fact\']])'
    assert_includes SRC, 'applied << "grant_fact'
  end
end
