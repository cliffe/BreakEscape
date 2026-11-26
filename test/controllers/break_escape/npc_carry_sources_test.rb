require 'test_helper'

module BreakEscape
  # Cheat-resistance review minors M1-M3 for NPC carried items: every route an item can reach
  # the world by (start items, container contents, a flag-station's itemsHeld, a declared
  # grant, an NPC's itemsHeld) must be carriable once the player drops it, while a held id
  # that collides with a rejected room object, or is held twice, never stands in for it.
  # Driven over HTTP through the real inventory-add and player_drop paths.
  class NpcCarrySourcesTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    def tagged(id, extra = {})
      { 'type' => 'dirty_mugs1', 'id' => id, 'name' => id.tr('_', ' '), 'takeable' => true, 'droppable' => true,
        'needsTag' => 'dirty_mugs' }.merge(extra)
    end

    def scenario(start_items: [], office_objects: [], npcs_extra: [])
      {
        'scenario_brief' => 'Carry sources probe',
        'startRoom' => 'office',
        'startItemsInInventory' => start_items,
        'rooms' => {
          'office' => {
            'type' => 'room_office', 'connections' => { 'north' => 'kitchen' },
            'objects' => office_objects,
            'npcs' => [
              { 'id' => 'grace', 'displayName' => 'Grace', 'npcType' => 'person', 'position' => { 'x' => 3, 'y' => 3 },
                'needsHome' => 'grace_desk', 'needs' => { 'caffeine' => { 'decayPerMin' => 10 } } }
            ] + npcs_extra
          },
          'kitchen' => { 'type' => 'room_kitchen', 'connections' => { 'south' => 'office' }, 'objects' => [], 'npcs' => [] }
        }
      }
    end

    def build(scn, player_state = {})
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scn,
        player_state: { 'currentRoom' => 'office', 'unlockedRooms' => %w[office kitchen] }.merge(player_state)
      )
    end

    def inventory_add(item)
      post inventory_game_url(@game), params: { action_type: 'add', item: item }, as: :json
    end

    def held_ids
      Array(@game.reload.player_state['inventory']).map { |i| (i['scenarioData'] || i)['id'] }
    end

    # The real drop: add_object with sourceType player_drop, as item-drop.js sends it.
    def drop(item_id, room: 'office')
      post update_room_game_url(@game), params: {
        roomId: room, actionType: 'add_object', sourceType: 'player_drop',
        data: { id: item_id, type: 'dirty_mugs1', name: 'x', x: 120, y: 140 }
      }, as: :json
    end

    def carry(item_id, npc: 'grace', room: 'office')
      post update_room_game_url(@game), params: { roomId: room, actionType: 'carry_object', data: { npcId: npc, itemId: item_id } }, as: :json
    end

    def assert_carriable_after_drop(item_id)
      assert_includes held_ids, item_id, 'the player holds it'
      drop(item_id)
      assert_response :success
      added = @game.reload.player_state.dig('room_states', 'office', 'objects_added') || []
      assert added.any? { |o| o['id'] == item_id }, 'the drop is stored'
      carry(item_id)
      assert_response :success, "carry refused (#{response.status}): #{response.body}"
      assert_equal item_id, @game.reload.player_state.dig('npcCarry', 'grace', 'itemId')
    end

    # === M2: each source ======================================================

    test 'a start item with a needsTag is carriable once dropped' do
      build(scenario(start_items: [tagged('start_parcel')]))
      assert_carriable_after_drop('start_parcel')
    end

    test 'an unlocked container content with a needsTag is carriable once taken and dropped' do
      box = { 'type' => 'suitcase', 'id' => 'desk_box', 'name' => 'Desk box', 'takeable' => false,
              'contents' => [tagged('box_mugs')] }
      build(scenario(office_objects: [box]), 'unlockedObjects' => ['desk_box'])
      inventory_add(tagged('box_mugs'))
      assert_response :success, response.body
      assert_carriable_after_drop('box_mugs')
    end

    test 'a flag-station itemsHeld item with a needsTag is carriable once taken and dropped' do
      station = { 'type' => 'flag-station', 'id' => 'flag_desk', 'name' => 'Flag desk', 'takeable' => false,
                  'flags' => ['flag{mug}'],
                  'flagRewards' => [{ 'type' => 'give_item', 'item_type' => 'dirty_mugs1', 'item_name' => 'station mugs' }],
                  'itemsHeld' => [tagged('station_mugs')] }
      build(scenario(office_objects: [station]), 'submitted_flags' => ['flag{mug}'])
      inventory_add(tagged('station_mugs'))
      assert_response :success, "the inventory add must succeed: #{response.body}"
      assert_includes held_ids, 'station_mugs', 'the add stored the item'
      assert_carriable_after_drop('station_mugs')
    end

    test 'a declared grant item with a needsTag is carriable once taken and dropped' do
      poster = { 'type' => 'poster', 'id' => 'prize_poster', 'name' => 'Prize poster', 'takeable' => false,
                 'triggerOnInteract' => [{ 'type' => 'give_item', 'item' => tagged('grant_mugs') }] }
      build(scenario(office_objects: [poster]))
      inventory_add(tagged('grant_mugs'))
      assert_response :success, "the inventory add must succeed: #{response.body}"
      assert_includes held_ids, 'grant_mugs', 'the add stored the item'
      assert_carriable_after_drop('grant_mugs')
    end

    # === M1: id collisions ====================================================

    test 'a start item reusing a rejected room object id is not indexed' do
      locked = { 'type' => 'drawer', 'id' => 'locked_box', 'name' => 'Locked', 'takeable' => true, 'needsTag' => 'dirty_mugs',
                 'locked' => true, 'lockType' => 'key', 'requires' => 'some_key' }
      build(scenario(start_items: [tagged('locked_box')], office_objects: [locked]))
      assert_nil @game.carriable_object_index['locked_box']
    end

    test 'an id defined by a start item and an NPC itemsHeld is ambiguous and not indexed' do
      holder = { 'id' => 'bob', 'displayName' => 'Bob', 'npcType' => 'person', 'position' => { 'x' => 5, 'y' => 3 },
                 'itemsHeld' => [tagged('twice_mugs')] }
      build(scenario(start_items: [tagged('twice_mugs')], npcs_extra: [holder]))
      assert_nil @game.carriable_object_index['twice_mugs']
    end

    test 'an id held by a normal NPC and by an account-only NPC is ambiguous and not indexed' do
      holder = { 'id' => 'bob', 'displayName' => 'Bob', 'npcType' => 'person', 'position' => { 'x' => 5, 'y' => 3 },
                 'itemsHeld' => [tagged('shared_mugs')] }
      account = { 'id' => 'deskadmin', 'displayName' => 'Desk Admin', 'npcType' => 'person', 'accountOnly' => true,
                  'creds' => { 'username' => 'deskadmin', 'password' => 'Desk-Admin-1' }, 'itemsHeld' => [tagged('shared_mugs')] }
      build(scenario(npcs_extra: [holder, account]))
      assert_nil @game.carriable_object_index['shared_mugs']
    end

    # === Negative: the item was never legitimately obtained ===================

    def assert_carry_refused_untaken(item_id)
      carry(item_id)
      assert_response :unprocessable_entity, "carry must be refused: #{response.body}"
      assert_nil @game.reload.player_state.dig('npcCarry', 'grace'), 'no npcCarry entry is saved'
      assert_not_includes (@game.player_state['npcCarry'] || {}).values.map { |v| v['itemId'] }, item_id
    end

    test 'a locked container content cannot be carried before the container is unlocked' do
      box = { 'type' => 'suitcase', 'id' => 'locked_desk_box', 'name' => 'Locked box', 'takeable' => false,
              'locked' => true, 'lockType' => 'key', 'requires' => 'box_key', 'contents' => [tagged('sealed_mugs')] }
      build(scenario(office_objects: [box]))
      assert_carry_refused_untaken('sealed_mugs')
    end

    test 'a flag-station item cannot be carried before its flag is submitted' do
      station = { 'type' => 'flag-station', 'id' => 'flag_desk', 'name' => 'Flag desk', 'takeable' => false,
                  'flags' => ['flag{mug}'],
                  'flagRewards' => [{ 'type' => 'give_item', 'item_type' => 'dirty_mugs1', 'item_name' => 'station mugs' }],
                  'itemsHeld' => [tagged('station_mugs')] }
      build(scenario(office_objects: [station]))
      assert_carry_refused_untaken('station_mugs')
    end

    test 'a grant item the player never held cannot be carried' do
      poster = { 'type' => 'poster', 'id' => 'prize_poster', 'name' => 'Prize poster', 'takeable' => false,
                 'triggerOnInteract' => [{ 'type' => 'give_item', 'item' => tagged('grant_mugs') }] }
      build(scenario(office_objects: [poster]))
      assert_carry_refused_untaken('grant_mugs')
    end

    # === M3: more soft-lock guards ============================================

    test 'ids named by collect objectives, wear gates or camelCase lock fields are not carriable' do
      objs = [tagged('wanted_a'), tagged('wanted_b'), tagged('worn_c'), tagged('plain_d')]
      scn = scenario(office_objects: objs)
      scn['objectives'] = [{ 'tasks' => [{ 'type' => 'collect_items', 'targetItemIds' => ['wanted_a'], 'targetItems' => ['wanted_b'] }] }]
      scn['rooms']['kitchen']['objects'] << { 'type' => 'wardrobe', 'id' => 'rack', 'wearGate' => { 'itemId' => 'worn_c' } }
      build(scn)
      idx = @game.carriable_object_index
      %w[wanted_a wanted_b worn_c].each { |id| assert_nil idx[id], "#{id} is named as a requirement" }
      assert idx['plain_d'].present?, 'ordinary dressing still carriable'
    end

    test 'camelCase lock fields and tool types disqualify an object' do
      objs = [tagged('k1', 'keyId' => 'x'), tagged('k2', 'cardId' => 'x'), tagged('k3', 'opensLock' => 'x'), tagged('k4', 'unlocks' => 'x'),
              tagged('t1', 'type' => 'lockpick'), tagged('t2', 'type' => 'rfid_cloner'), tagged('t3', 'type' => 'fingerprint_kit'),
              tagged('ok')]
      build(scenario(office_objects: objs))
      idx = @game.carriable_object_index
      %w[k1 k2 k3 k4 t1 t2 t3].each { |id| assert_nil idx[id], "#{id} is disqualified" }
      assert idx['ok'].present?
    end

    test 'an account-only NPC itemsHeld entry with a needsTag is not indexed' do
      account = { 'id' => 'deskadmin', 'displayName' => 'Desk Admin', 'npcType' => 'person', 'accountOnly' => true,
                  'creds' => { 'username' => 'deskadmin', 'password' => 'Desk-Admin-1' }, 'itemsHeld' => [tagged('account_mugs')] }
      build(scenario(npcs_extra: [account]))
      assert_nil @game.carriable_object_index['account_mugs']
    end
  end
end
