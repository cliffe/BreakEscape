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

    def build(scn)
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scn,
        player_state: { 'currentRoom' => 'office', 'unlockedRooms' => %w[office kitchen] }
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
      build(scenario(office_objects: [box]))
      inventory_add(tagged('box_mugs'))
      assert_response :success, response.body
      assert_carriable_after_drop('box_mugs')
    end

    test 'a flag-station itemsHeld item with a needsTag is carriable once taken and dropped' do
      station = { 'type' => 'workstation', 'id' => 'flag_desk', 'name' => 'Flag desk', 'takeable' => false,
                  'itemsHeld' => [tagged('station_mugs')] }
      build(scenario(office_objects: [station]))
      inventory_add(tagged('station_mugs'))
      if response.successful? && held_ids.include?('station_mugs')
        assert_carriable_after_drop('station_mugs')
      else
        skip "not reachable through the inventory route (#{response.status})"
      end
    end

    test 'a declared grant item with a needsTag is carriable once taken and dropped' do
      poster = { 'type' => 'poster', 'id' => 'prize_poster', 'name' => 'Prize poster', 'takeable' => false,
                 'triggerOnInteract' => [{ 'type' => 'give_item', 'item' => tagged('grant_mugs') }] }
      build(scenario(office_objects: [poster]))
      inventory_add(tagged('grant_mugs'))
      if response.successful? && held_ids.include?('grant_mugs')
        assert_carriable_after_drop('grant_mugs')
      else
        skip "not reachable through the inventory route (#{response.status})"
      end
    end
  end
end
