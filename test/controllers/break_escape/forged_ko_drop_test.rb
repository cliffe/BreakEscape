require 'test_helper'

module BreakEscape
  # Friendface phone code review R4 (docs/achitechture/FRIENDFACE_PHONE_ITEM_CODE_REVIEW_R4.md).
  #
  # M1: a forged hostility KO in sync_state, then an `npc_defeated` add_object into any unlocked
  # room, let the client take any NPC's held items: the review's probe (game 1592) took Kevin's
  # server room keycard in m01 from reception while the IT room was still locked. The fixture
  # below has the same shape: start room `reception_area`, a locked `it_room` with Kevin, who holds
  # a lockpick and a keycard with no ids, as m01 has them.
  #
  # m2: a koImmune NPC's KO is refused by every record, not just the in-room drop.
  # m1: held items with no id get `<npcId>_held_<n>` at game creation, so drops are idempotent and
  # are listed in koDropPending after a reload.
  class ForgedKoDropTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    LOCKPICK = { 'type' => 'lockpick', 'name' => 'Lock Pick Kit', 'takeable' => true }.freeze
    KEYCARD = { 'type' => 'keycard', 'name' => 'Server Room Keycard', 'takeable' => true,
                'card_id' => 'server_keycard', 'opens_lock' => 'server_keycard' }.freeze

    def scenario
      {
        'scenario_brief' => 'Forged KO probe',
        'startRoom' => 'reception_area',
        'rooms' => {
          'reception_area' => {
            'type' => 'room_reception', 'connections' => { 'north' => 'it_room' }, 'objects' => [],
            'npcs' => [
              { 'id' => 'sarah', 'displayName' => 'Sarah', 'npcType' => 'person', 'position' => { 'x' => 3, 'y' => 3 },
                'itemsHeld' => [{ 'type' => 'key', 'name' => 'Office Key', 'takeable' => true }] },
              { 'id' => 'warden', 'displayName' => 'Warden', 'npcType' => 'person', 'koImmune' => true,
                'position' => { 'x' => 5, 'y' => 3 },
                'itemsHeld' => [{ 'type' => 'key', 'id' => 'warden_key', 'name' => 'Warden Key', 'takeable' => true }] }
            ]
          },
          'it_room' => {
            'type' => 'room_office', 'locked' => true, 'lockType' => 'key', 'requires' => 'it_key',
            'connections' => { 'south' => 'reception_area' }, 'objects' => [],
            'npcs' => [
              { 'id' => 'kevin_park', 'displayName' => 'Kevin', 'npcType' => 'person',
                'position' => { 'x' => 4, 'y' => 4 }, 'itemsHeld' => [LOCKPICK.dup, KEYCARD.dup] }
            ]
          }
        }
      }
    end

    def build(player_state = {})
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: { 'currentRoom' => 'reception_area', 'unlockedRooms' => %w[reception_area] }.merge(player_state)
      )
    end

    def forge_ko(npc_id)
      put sync_state_game_url(@game), params: { npcHostility: { npc_id => { hostile: true, ko: true } } }, as: :json
      assert_response :success
    end

    def drop(npc_id, item, room: 'reception_area')
      post update_room_game_url(@game), params: {
        roomId: room, actionType: 'add_object', data: item.merge('x' => 64, 'y' => 64),
        sourceNpcId: npc_id, sourceType: 'npc_defeated'
      }, as: :json
      response
    end

    def added(room = 'reception_area')
      Array(@game.reload.player_state.dig('room_states', room, 'objects_added'))
    end

    def get_room(room_id)
      get room_game_url(@game, room_id: room_id), as: :json
      response.parsed_body['room']
    end

    test 'held items with no id get a stable id at game creation' do
      build
      kevin = @game.scenario_data['rooms']['it_room']['npcs'].first
      assert_equal %w[kevin_park_held_0 kevin_park_held_1], kevin['itemsHeld'].map { |i| i['id'] }
      sarah = @game.scenario_data['rooms']['reception_area']['npcs'].find { |n| n['id'] == 'sarah' }
      assert_equal ['sarah_held_0'], sarah['itemsHeld'].map { |i| i['id'] }
      warden = @game.scenario_data['rooms']['reception_area']['npcs'].find { |n| n['id'] == 'warden' }
      assert_equal ['warden_key'], warden['itemsHeld'].map { |i| i['id'] }, 'an authored id is kept'
    end

    test 'M1 (probe 1592): a forged hostility KO for unmet Kevin behind a locked door gives no keycard' do
      build
      # The KO claim against his own room: the room is locked
      post update_room_game_url(@game), params: {
        roomId: 'it_room', actionType: 'update_npc_state',
        data: { npcId: 'kevin_park', stateChanges: { isKO: true, currentHP: 0 } }
      }, as: :json
      assert_response :forbidden

      forge_ko('kevin_park')
      assert_equal false, @game.reload.player_state.dig('npcHostility', 'kevin_park', 'ko'),
                   'the hostility record keeps no KO for an NPC the player has not met'
      refute @game.send(:npc_defeated?, 'kevin_park')

      assert_equal 422, drop('kevin_park', KEYCARD.merge('id' => 'kevin_park_held_1')).status
      assert_equal 422, drop('kevin_park', LOCKPICK.merge('id' => 'kevin_park_held_0')).status
      assert_equal [], added

      post inventory_game_url(@game), params: {
        action_type: 'add', item: KEYCARD.merge('id' => 'kevin_park_held_1'), source_npc_id: 'kevin_park'
      }, as: :json
      refute_equal 200, response.status
      assert Array(@game.reload.player_state['inventory']).none? { |i| i['type'] == 'keycard' }
    end

    test 'M1: a hostility KO saved before the rule opens nothing for an unmet NPC' do
      build('npcHostility' => { 'kevin_park' => { 'hostile' => true, 'ko' => true } })
      refute @game.send(:npc_defeated?, 'kevin_park')
      assert_equal 422, drop('kevin_park', KEYCARD.merge('id' => 'kevin_park_held_1')).status
      assert_equal [], added
    end

    test 'M1: a met NPC KO by the hostility record still drops, and a retried drop is stored once' do
      build('unlockedRooms' => %w[reception_area it_room])
      get_room('it_room') # meets Kevin, as walking in does
      assert_response :success
      forge_ko('kevin_park')
      assert @game.reload.send(:npc_defeated?, 'kevin_park')
      # His drop lands in reception (he followed the player out), twice: one copy
      assert_equal 200, drop('kevin_park', KEYCARD.merge('id' => 'kevin_park_held_1')).status
      assert_equal 200, drop('kevin_park', KEYCARD.merge('id' => 'kevin_park_held_1')).status
      assert_equal ['kevin_park_held_1'], added.map { |o| o['id'] }
      assert_equal 'server_keycard', added.first['opens_lock']
      # The lockpick never landed: listed after a reload, and gone from the list once it lands
      assert_equal ['kevin_park_held_0'], get_room('it_room')['npcs'].first['koDropPending']
      assert_equal 200, drop('kevin_park', LOCKPICK.merge('id' => 'kevin_park_held_0')).status
      assert_nil get_room('it_room')['npcs'].first['koDropPending']
    end

    test 'm2: a koImmune NPC is never KO, by update_npc_state, the hostility record or a drop' do
      build
      get_room('reception_area')
      assert_includes @game.reload.player_state['encounteredNPCs'], 'warden'

      post update_room_game_url(@game), params: {
        roomId: 'reception_area', actionType: 'update_npc_state',
        data: { npcId: 'warden', stateChanges: { isKO: true, currentHP: 0 } }
      }, as: :json
      assert_response :unprocessable_entity
      assert_nil @game.reload.player_state.dig('room_states', 'reception_area', 'npc_states', 'warden')

      forge_ko('warden')
      assert_equal false, @game.reload.player_state.dig('npcHostility', 'warden', 'ko')
      assert_equal true, @game.player_state.dig('npcHostility', 'warden', 'hostile'), 'hostility itself is kept'

      # A record saved before the rule counts for nothing either
      state = @game.player_state.deep_dup
      state['npcHostility']['warden']['ko'] = true
      state['room_states'] ||= {}
      state['room_states']['reception_area'] ||= {}
      state['room_states']['reception_area']['npc_states'] = { 'warden' => { 'isKO' => true } }
      @game.update!(player_state: state)
      refute @game.send(:npc_defeated?, 'warden')
      assert_equal 422, drop('warden', { 'type' => 'key', 'id' => 'warden_key', 'name' => 'Warden Key' }).status
      assert_nil get_room('reception_area')['npcs'].find { |n| n['id'] == 'warden' }['koDropPending']
    end

    test 'the honest KO: a met NPC in its own unlocked room, by update_npc_state, then its id-less item drops' do
      build
      get_room('reception_area') # meets Sarah
      post update_room_game_url(@game), params: {
        roomId: 'reception_area', actionType: 'update_npc_state',
        data: { npcId: 'sarah', stateChanges: { isKO: true, currentHP: 0 } }
      }, as: :json
      assert_response :success
      assert_equal 200, drop('sarah', { 'type' => 'key', 'id' => 'sarah_held_0', 'name' => 'Office Key' }).status
      assert_equal 200, drop('sarah', { 'type' => 'key', 'id' => 'sarah_held_0', 'name' => 'Office Key' }).status
      assert_equal ['sarah_held_0'], added.map { |o| o['id'] }
    end
  end
end
