require 'test_helper'

# S8a unit 04: AccessIdentities.lockout_key and lockout_key_parts
class AccessIdentitiesLockoutKeyTest < ActiveSupport::TestCase
  AI = BreakEscape::AccessIdentities

  def old_key(pc_id, username)
    "#{pc_id}|#{AI.normalise_username(username)}"
  end

  test 'lockout_key equals the string built before, for odd inputs' do
    [['pc1', 'Jake'], ['pc1', '  Jake  '], ['pc1', nil], ['pc1', 42], [nil, 'jake'],
     ['pc1', 'a|b'], ['pc1', 'X' * 100], ['pc1', ''], [:pc1, 'JAKE']].each do |pc, user|
      assert_equal old_key(pc, user), AI.lockout_key(pc, user)
    end
    assert_equal 'pc1|jake', AI.lockout_key('pc1', ' Jake ')
  end

  test 'round trip' do
    assert_equal %w[pc1 jake], AI.lockout_key_parts(AI.lockout_key('pc1', ' Jake '))
    assert_equal ['pc1', 'a|b'], AI.lockout_key_parts(AI.lockout_key('pc1', 'A|b'))
    assert_equal ['pc1', ''], AI.lockout_key_parts(AI.lockout_key('pc1', nil))
  end

  test 'malformed keys answer nil' do
    [nil, 42, [], {}, '', 'nopipe', '|jake', '|'].each do |key|
      assert_nil AI.lockout_key_parts(key), key.inspect
    end
  end
end
