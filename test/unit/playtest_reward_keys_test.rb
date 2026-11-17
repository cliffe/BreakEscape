require 'test_helper'
require Rails.root.join('../../tools/playtest/lib/reward_keys').to_s

# tools/playtest/new-game.rb --submit-flag must find an unlock_object reward's
# target under the same key the server reads (objectId), as m07 flag 4 uses.
class PlaytestRewardKeysTest < ActiveSupport::TestCase
  test 'objectId is read, as the server and scenarios spell it' do
    assert_equal 'vault_door', RewardKeys.unlock_object_id('type' => 'unlock_object', 'objectId' => 'vault_door')
  end

  test 'older snake_case keys still work' do
    assert_equal 'a', RewardKeys.unlock_object_id('object_id' => 'a')
    assert_equal 'b', RewardKeys.unlock_object_id('target_object' => 'b')
    assert_equal 'c', RewardKeys.unlock_object_id('id' => 'c')
  end

  test 'objectId wins and blank values are skipped' do
    assert_equal 'x', RewardKeys.unlock_object_id('objectId' => 'x', 'id' => 'y')
    assert_equal 'y', RewardKeys.unlock_object_id('objectId' => ' ', 'id' => 'y')
    assert_nil RewardKeys.unlock_object_id('type' => 'unlock_object')
    assert_nil RewardKeys.unlock_object_id(nil)
  end

  test 'new-game.rb uses the helper' do
    src = File.read(Rails.root.join('../../tools/playtest/new-game.rb'))
    assert_includes src, 'RewardKeys.unlock_object_id(r)'
  end
end
