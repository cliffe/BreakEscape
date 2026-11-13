require 'test_helper'

# Declared-grants review R1, m1: an item a flag station holds as a give_item
# reward could be added to the inventory with one POST and no flag. The server
# now requires a submitted flag whose reward hands over that item.
module BreakEscape
  class FlagStationItemClaimTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    FLAG_MAP = 'flag{map_one}'.freeze
    FLAG_CARD = 'flag{card_two}'.freeze
    MAP = { 'type' => 'text_file', 'id' => 'network_map', 'name' => 'Network Map', 'takeable' => true }.freeze
    # secgen_vm_lab's reward keycard has no id and is matched by name.
    CARD = { 'type' => 'keycard', 'name' => 'Server Room Keycard', 'takeable' => true }.freeze

    def build_game(station_overrides = {})
      station = {
        'type' => 'flag-station', 'id' => 'station', 'name' => 'Drop Site',
        'acceptsVms' => ['target_vm'],
        'flags' => ['target_vm:flag_1', 'target_vm:flag_2'],
        'itemsHeld' => [MAP.deep_dup, CARD.deep_dup],
        'flagRewards' => [
          { 'type' => 'give_item', 'item_name' => 'Network Map' },
          { 'type' => 'give_item', 'item_name' => 'Server Room Keycard' }
        ]
      }.merge(station_overrides)
      Game.create!(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario_data: {
          'startRoom' => 'hall',
          'flags' => { 'target_vm' => { 'flag_1' => FLAG_MAP, 'flag_2' => FLAG_CARD } },
          'rooms' => { 'hall' => { 'type' => 'room_office', 'connections' => {}, 'objects' => [station] } }
        },
        player_state: { 'currentRoom' => 'hall', 'unlockedRooms' => ['hall'], 'unlockedObjects' => [], 'inventory' => [] }
      )
    end

    def add(game, item)
      post inventory_game_url(game), params: { action_type: 'add', item: item }, as: :json
    end

    def submit(game, flag)
      post flags_game_url(game), params: { flag: flag, stationId: 'station' }, as: :json
      assert_response :success, response.body
    end

    # The flag submission hands the reward over itself; clear the inventory so
    # the next add goes through validation (a re-collect).
    def empty_inventory(game)
      game.reload
      game.player_state['inventory'] = []
      game.save!
    end

    test 'a reward item is refused before its flag is submitted' do
      game = build_game
      add(game, MAP)
      assert_response :unprocessable_entity
      assert_match(/Flag not submitted/, response.parsed_body['message'])
      assert_empty game.reload.player_state['inventory']
    end

    test 'the id-less keycard is refused by name before its flag' do
      game = build_game
      add(game, CARD)
      assert_response :unprocessable_entity
      add(game, CARD.merge('id' => 'Server Room Keycard'))
      assert_response :unprocessable_entity
      assert_empty game.reload.player_state['inventory']
    end

    test 'submitting the flag hands over the reward, and it can be collected again after' do
      game = build_game
      submit(game, FLAG_MAP)
      assert(game.reload.player_state['inventory'].any? { |i| i['id'] == 'network_map' })

      empty_inventory(game)
      add(game, MAP)
      assert_response :success, response.body
    end

    test 'a flag typed in a different case still earns the keycard' do
      game = build_game
      submit(game, FLAG_CARD.upcase)

      empty_inventory(game)
      add(game, CARD)
      assert_response :success, response.body
    end

    test "one flag does not earn another flag's reward" do
      game = build_game
      submit(game, FLAG_CARD)

      empty_inventory(game)
      add(game, MAP)
      assert_response :unprocessable_entity
      add(game, CARD)
      assert_response :success, response.body
    end

    test 'a held item with no give_item reward is refused' do
      game = build_game('flagRewards' => [{ 'type' => 'give_item', 'item_name' => 'Network Map' }])
      submit(game, FLAG_MAP)
      submit(game, FLAG_CARD)

      empty_inventory(game)
      add(game, CARD)
      assert_response :unprocessable_entity
    end

    test 'a hash-form reward keyed by the flag value is honoured' do
      game = build_game('flags' => [FLAG_MAP], 'flagRewards' => { FLAG_MAP => { 'type' => 'give_item', 'item_name' => 'Network Map' } })
      add(game, MAP)
      assert_response :unprocessable_entity

      submit(game, FLAG_MAP)
      empty_inventory(game)
      add(game, MAP)
      assert_response :success, response.body
    end
  end
end
