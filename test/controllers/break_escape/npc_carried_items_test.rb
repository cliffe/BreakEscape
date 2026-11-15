require 'test_helper'

module BreakEscape
  # NPC carried items (docs/achitechture/NPC_CARRIED_ITEMS_PLAN.md). A carriable
  # scenario object a needs NPC picks up is held server-side (the npcCarry delta):
  # it leaves its origin room, is served in the NPC's itemsHeld, lands where it is
  # put down, and is gone for good when consumed. Keys, credentials, locked
  # content and forged items can never enter this path. Driven over HTTP, like the
  # client.
  class NpcCarriedItemsTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    MUG = { 'type' => 'dirty_mugs1', 'id' => 'office_mugs', 'name' => 'Abandoned Mugs',
            'takeable' => true, 'needsTag' => 'dirty_mugs', 'position' => { 'x' => 4, 'y' => 7 } }.freeze

    def scenario
      {
        'scenario_brief' => 'Carry probe',
        'startRoom' => 'office',
        'rooms' => {
          'office' => {
            'type' => 'room_office', 'connections' => { 'north' => 'kitchen', 'east' => 'vault' },
            'objects' => [
              MUG.dup,
              # Hostile-input carriables: each has a needsTag but is disqualified.
              { 'type' => 'key', 'id' => 'office_key', 'name' => 'Office Key', 'takeable' => true, 'needsTag' => 'dirty_mugs' },
              { 'type' => 'drawer', 'id' => 'locked_box', 'name' => 'Locked Box', 'takeable' => true,
                'needsTag' => 'dirty_mugs', 'locked' => true, 'lockType' => 'key', 'requires' => 'office_key' },
              { 'type' => 'box', 'id' => 'full_box', 'name' => 'Box of Things', 'takeable' => true,
                'needsTag' => 'dirty_mugs', 'contents' => [{ 'type' => 'key', 'id' => 'inner_key', 'name' => 'Inner' }] },
              { 'type' => 'credential', 'id' => 'badge_pass', 'name' => 'Access Pass', 'takeable' => true, 'needsTag' => 'dirty_mugs' }
            ],
            'npcs' => [
              { 'id' => 'grace', 'displayName' => 'Grace', 'npcType' => 'person', 'position' => { 'x' => 3, 'y' => 3 },
                'needsHome' => 'grace_desk', 'needs' => { 'caffeine' => { 'decayPerMin' => 10 } } },
              { 'id' => 'bob', 'displayName' => 'Bob', 'npcType' => 'person', 'position' => { 'x' => 5, 'y' => 3 } }
            ]
          },
          'kitchen' => {
            'type' => 'room_kitchen', 'connections' => { 'south' => 'office' }, 'objects' => [], 'npcs' => []
          },
          'vault' => {
            'type' => 'room_office', 'locked' => true, 'lockType' => 'key', 'requires' => 'vault_key',
            'connections' => { 'west' => 'office' },
            'objects' => [{ 'type' => 'dirty_mugs1', 'id' => 'vault_mug', 'name' => 'Vault Mug', 'takeable' => true, 'needsTag' => 'dirty_mugs' }],
            'npcs' => [{ 'id' => 'vera', 'displayName' => 'Vera', 'npcType' => 'person',
                        'needsHome' => 'vera_desk', 'needs' => { 'work' => { 'decayPerMin' => 5 } } }]
          },
          'storeroom' => {
            'type' => 'room_office', 'connections' => {}, 'objects' => [], 'npcs' => []
          }
        }
      }
    end

    def build(player_state = {})
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: { 'currentRoom' => 'office', 'unlockedRooms' => %w[office kitchen storeroom] }.merge(player_state)
      )
    end

    def carry(npc, item, room: 'office')
      post update_room_game_url(@game), params: { roomId: room, actionType: 'carry_object', data: { npcId: npc, itemId: item } }, as: :json
    end

    def put_down(npc, item, room:, position: { px: 100, py: 200 })
      post update_room_game_url(@game), params: { roomId: room, actionType: 'put_down_object', data: { npcId: npc, itemId: item, position: position } }, as: :json
    end

    def consume(npc, item, room: 'office')
      post update_room_game_url(@game), params: { roomId: room, actionType: 'consume_carried', data: { npcId: npc, itemId: item } }, as: :json
    end

    def room_objects(room_id)
      get room_game_url(@game, room_id: room_id), as: :json
      (JSON.parse(response.body).dig('room', 'objects')) || []
    end

    def npc_held(room_id, npc_id)
      get room_game_url(@game, room_id: room_id), as: :json
      npc = Array(JSON.parse(response.body).dig('room', 'npcs')).find { |n| n['id'] == npc_id }
      npc && Array(npc['itemsHeld'])
    end

    def carry_state
      @game.reload.player_state['npcCarry']
    end

    # === core flow ===========================================================

    test 'carry moves the object out of its origin room and into the NPC itemsHeld' do
      build
      assert room_objects('office').any? { |o| o['id'] == 'office_mugs' }, 'mug starts in the office'

      carry('grace', 'office_mugs')
      assert_response :success
      assert_equal({ 'itemId' => 'office_mugs', 'fromRoom' => 'office' }, carry_state['grace'])

      assert_not room_objects('office').any? { |o| o['id'] == 'office_mugs' }, 'mug left the office floor'
      held = npc_held('office', 'grace')
      assert held.any? { |i| i['id'] == 'office_mugs' }, 'mug is served in Grace itemsHeld'
    end

    test 'put down lands the object in the target room from the scenario definition and clears the carry' do
      build
      carry('grace', 'office_mugs')
      put_down('grace', 'office_mugs', room: 'kitchen', position: { px: 321, py: 654 })
      assert_response :success

      assert_nil carry_state['grace'], 'carry cleared'
      landed = room_objects('kitchen').find { |o| o['id'] == 'office_mugs' }
      assert landed, 'mug landed in the kitchen'
      assert_equal 'Abandoned Mugs', landed['name'], 'from the scenario definition'
      assert_equal({ 'px' => 321, 'py' => 654 }, landed['position'], 'client position only')
      assert_not npc_held('office', 'grace').any? { |i| i['id'] == 'office_mugs' }, 'no longer held'
    end

    test 'consume clears the carry with no 422 and the object stays gone on a re-fetch' do
      build
      carry('grace', 'office_mugs')
      consume('grace', 'office_mugs')
      assert_response :success
      assert_equal true, JSON.parse(response.body)['success']

      assert_nil carry_state['grace']
      assert_not room_objects('office').any? { |o| o['id'] == 'office_mugs' }, 'gone for good'
    end

    test 'a repeated carry is idempotent' do
      build
      carry('grace', 'office_mugs')
      first = carry_state.deep_dup
      carry('grace', 'office_mugs')
      assert_response :success
      assert_equal first, carry_state, 'npcCarry unchanged by a repeat'
      assert_not room_objects('office').any? { |o| o['id'] == 'office_mugs' }, 'still just gone, not re-added'
    end

    # === hostile input: never-carriable items (AC0) ==========================

    test 'a key, a locked container, an object with contents and a credential are each refused with nothing moved' do
      %w[office_key locked_box full_box badge_pass].each do |bad_id|
        build
        carry('grace', bad_id)
        assert_response :unprocessable_entity, "#{bad_id} must be refused"
        assert_nil carry_state, 'nothing written'
        assert room_objects('office').any? { |o| o['id'] == bad_id }, "#{bad_id} did not move"
      end
    end

    test 'an item not in the claimed room is refused' do
      build
      carry('grace', 'vault_mug') # vault_mug is in the vault, not the office
      assert_response :unprocessable_entity
      assert_nil carry_state
    end

    test 'a carry from a locked room is refused by the unlocked gate' do
      build
      carry('vera', 'vault_mug', room: 'vault')
      assert_response :forbidden
      assert_nil carry_state
    end

    test 'put down into a locked room is refused by the unlocked gate' do
      build
      carry('grace', 'office_mugs')
      put_down('grace', 'office_mugs', room: 'vault')
      assert_response :forbidden
      assert_equal 'office', carry_state['grace']['fromRoom'], 'still carried'
    end

    test 'put down into a non-adjacent room is refused' do
      build
      carry('grace', 'office_mugs')
      put_down('grace', 'office_mugs', room: 'storeroom') # unlocked but not connected to office
      assert_response :unprocessable_entity
      assert carry_state['grace'], 'still carried'
      assert_not room_objects('storeroom').any? { |o| o['id'] == 'office_mugs' }
    end

    test 'a non-needs NPC cannot carry' do
      build
      carry('bob', 'office_mugs')
      assert_response :unprocessable_entity
      assert_nil carry_state
    end

    test "another game's NPC id cannot carry" do
      build
      carry('stranger_from_elsewhere', 'office_mugs')
      assert_response :unprocessable_entity
      assert_nil carry_state
    end

    test 'a second item while already carrying is refused' do
      build
      # Add a second carriable to the office so there is another to try.
      carry('grace', 'office_mugs')
      # grace already carries the mug; a different carriable in another room is moot,
      # so re-use vault_mug claim which also fails room, but the one-item rule is the
      # relevant guard when the room is right: claim office_mugs is idempotent, so
      # assert the guard directly through the model on a second distinct office item.
      g = @game.reload
      second = { 'type' => 'dirty_mugs1', 'id' => 'office_mugs2', 'name' => 'More Mugs', 'takeable' => true, 'needsTag' => 'dirty_mugs' }
      g.scenario_data['rooms']['office']['objects'] << second
      g.save!
      assert_equal false, g.carry_object!('office', 'grace', 'office_mugs2'), 'one item per NPC'
    end

    test 'put down or consume of an item the NPC does not carry is refused' do
      build
      put_down('grace', 'office_mugs', room: 'kitchen')
      assert_response :unprocessable_entity
      consume('grace', 'office_mugs')
      assert_response :unprocessable_entity
      assert_nil carry_state
    end

    test 'forged item fields in the put down body are ignored; the scenario definition wins' do
      build
      carry('grace', 'office_mugs')
      post update_room_game_url(@game), params: {
        roomId: 'kitchen', actionType: 'put_down_object',
        data: { npcId: 'grace', itemId: 'office_mugs', position: { px: 10, py: 20 },
                type: 'key', opens_lock: 'vault_key', requires: 'vault_key', name: 'Forged Key' }
      }, as: :json
      assert_response :success
      landed = room_objects('kitchen').find { |o| o['id'] == 'office_mugs' }
      assert_equal 'dirty_mugs1', landed['type'], 'type from the scenario definition'
      assert_equal 'Abandoned Mugs', landed['name']
      assert_nil landed['opens_lock'], 'no forged lock reference'
    end

    # === delta hygiene (sync) ================================================

    test 'syncing the same carry twice leaves npcCarry unchanged and bounded; extra keys are dropped' do
      build
      carry('grace', 'office_mugs') # authoritative action first
      body = { npcCarry: { 'grace' => { 'itemId' => 'office_mugs', 'fromRoom' => 'office', 'bogus' => 'drop me' } } }
      put sync_state_game_url(@game), params: body.merge(clientTs: 1000), as: :json
      assert_response :success
      first = carry_state.deep_dup
      put sync_state_game_url(@game), params: body.merge(clientTs: 1001), as: :json
      assert_response :success
      assert_equal first, carry_state, 'npcCarry unchanged by a repeated sync'
      assert_equal({ 'itemId' => 'office_mugs', 'fromRoom' => 'office' }, carry_state['grace'], 'extra keys dropped')
      assert_equal 1, carry_state.size, 'bounded by the NPC count'
    end
  end
end
