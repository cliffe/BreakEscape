require 'test_helper'

module BreakEscape
  # Review 6a-server N4: the carry-over import guard in scripts/validate_scenario.rb hardcodes the
  # server-owned global list because it cannot load the Rails constant. This guard asserts that
  # literal still matches Game::SERVER_OWNED_GLOBAL_NAMES, so adding a second server-owned global
  # to one place without the other fails loudly.
  class CarryOverServerOwnedGlobalsTest < ActiveSupport::TestCase
    VALIDATOR = File.expand_path('../../../scripts/validate_scenario.rb', __dir__)

    test "the carry-over guard literal matches Game::SERVER_OWNED_GLOBAL_NAMES" do
      source = File.read(VALIDATOR)
      marker = source.index('is a server-owned global and cannot be imported')
      assert marker, 'the server-owned carry-over guard message is present in the validator'

      # The nearest %w[...] above the guard message is the list the validator enforces.
      before = source[0...marker]
      literal = before.scan(/%w\[([^\]]*)\]/).last
      assert literal, 'the validator names its server-owned globals as a %w[...] list'
      validator_names = literal.first.split

      assert_equal Game::SERVER_OWNED_GLOBAL_NAMES.sort, validator_names.sort,
                   'validate_scenario.rb and Game::SERVER_OWNED_GLOBAL_NAMES must list the same server-owned globals'
    end
  end
end
