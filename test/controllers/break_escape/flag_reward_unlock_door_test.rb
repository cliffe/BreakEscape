require 'test_helper'

module BreakEscape
  # F18: an unlock_door flag reward opens the room it names (target_room or
  # room_id), not the room the flag station stands in. find_flag_rewards used to
  # merge the station's room over the reward's room_id, and
  # process_door_unlock_reward read room_id before target_room, so the reward
  # always "unlocked" the station's own (already open) room.
  class FlagRewardUnlockDoorTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    FLAG_ONE = 'flag{reward_one}'.freeze
    FLAG_TWO = 'flag{reward_two}'.freeze
    FLAG_THREE = 'flag{reward_three}'.freeze

    def build_game
      Game.create!(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario_data: {
          'startRoom' => 'hall',
          'flags' => {
            'target_vm' => { 'flag_1' => FLAG_ONE, 'flag_2' => FLAG_TWO, 'flag_3' => FLAG_THREE }
          },
          'rooms' => {
            'hall' => {
              'type' => 'room_office',
              'connections' => { 'north' => 'vault', 'east' => 'annex' },
              'objects' => [{
                'type' => 'flag-station',
                'id' => 'station',
                'name' => 'Flag Station',
                'acceptsVms' => ['target_vm'],
                'flags' => ['target_vm:flag_1', 'target_vm:flag_2', 'target_vm:flag_3'],
                'flagRewards' => [
                  { 'type' => 'unlock_door', 'target_room' => 'vault' },
                  { 'type' => 'unlock_door', 'room_id' => 'annex' },
                  { 'type' => 'unlock_door' }
                ]
              }]
            },
            'vault' => { 'type' => 'room_office', 'locked' => true, 'lockType' => 'key', 'requires' => 'vault_key',
                         'connections' => { 'south' => 'hall' } },
            'annex' => { 'type' => 'room_office', 'locked' => true, 'lockType' => 'key', 'requires' => 'annex_key',
                         'connections' => { 'west' => 'hall' } }
          }
        },
        player_state: { 'currentRoom' => 'hall', 'unlockedRooms' => ['hall'], 'inventory' => [] }
      )
    end

    def submit(game, flag)
      post flags_game_url(game), params: { flag: flag, stationId: 'station' }, as: :json
      JSON.parse(response.body)
    end

    test 'a target_room reward opens that room, not the station room' do
      game = build_game
      body = submit(game, FLAG_ONE)

      assert_equal true, body['success'], body.inspect
      door = body['rewards'].find { |r| r['type'] == 'unlock_door' }
      assert_equal 'vault', door['room_id'], body.inspect
      assert_includes game.reload.player_state['unlockedRooms'], 'vault'
      assert_not_includes game.player_state['unlockedRooms'], 'annex'
    end

    test "a reward's own room_id survives find_flag_rewards" do
      game = build_game
      body = submit(game, FLAG_TWO)

      door = body['rewards'].find { |r| r['type'] == 'unlock_door' }
      assert_equal 'annex', door['room_id'], body.inspect
      assert_includes game.reload.player_state['unlockedRooms'], 'annex'
      assert_not_includes game.player_state['unlockedRooms'], 'vault'
    end

    test 'a reward naming no room still falls back to the station room' do
      game = build_game
      body = submit(game, FLAG_THREE)

      door = body['rewards'].find { |r| r['type'] == 'unlock_door' }
      assert_equal 'hall', door['room_id'], body.inspect
    end
  end
end
