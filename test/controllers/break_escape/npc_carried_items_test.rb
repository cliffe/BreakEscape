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

    # === m1: allowlist cross-reference =======================================

    test 'an object required by a lock elsewhere is not carriable even with a needsTag' do
      build
      g = @game.reload
      # A de facto key: ordinary fields, a needsTag, but a terminal requires it by id.
      g.scenario_data['rooms']['office']['objects'] << {
        'type' => 'usb_stick', 'id' => 'secret_usb', 'name' => 'USB Stick', 'takeable' => true, 'needsTag' => 'dirty_mugs'
      }
      g.scenario_data['rooms']['office']['objects'] << {
        'type' => 'terminal', 'id' => 'vault_terminal', 'name' => 'Terminal', 'requires' => 'secret_usb'
      }
      g.save!

      carry('grace', 'secret_usb')
      assert_response :unprocessable_entity, 'a lock-referenced id is refused'
      assert_nil @game.reload.player_state['npcCarry']
      assert g.reload.carriable_object_index['secret_usb'].nil?, 'excluded from the allowlist'
      assert g.carriable_object_index['office_mugs'].present?, 'ordinary dressing still carriable'
    end

    # === M1: KO while carrying drops the object once, carry cleared ===========

    test 'KO while carrying ends the carry and lands the object once in the KO room' do
      build('encounteredNPCs' => %w[grace])
      carry('grace', 'office_mugs')
      g = @game.reload
      # Record the KO as the client would (update_npc_state), so npc_defeated? is true.
      g.player_state['room_states']['kitchen'] ||= { 'objects_added' => [], 'objects_removed' => [], 'object_states' => {}, 'npc_states' => {} }
      g.player_state['room_states']['kitchen']['npc_states']['grace'] = { 'isKO' => true, 'currentHP' => 0 }
      g.save!

      post update_room_game_url(@game), params: {
        roomId: 'kitchen', actionType: 'ko_drop_carried',
        data: { npcId: 'grace', itemId: 'office_mugs', position: { px: 119, py: 111 } }
      }, as: :json
      assert_response :success

      assert_nil carry_state['grace'], 'carry cleared on the KO drop'
      landed = room_objects('kitchen').select { |o| o['id'] == 'office_mugs' }
      assert_equal 1, landed.size, 'exactly one mug on the KO room floor'
      assert_equal({ 'px' => 119, 'py' => 111 }, landed.first['position'])
      assert_not npc_held('office', 'grace').any? { |i| i['id'] == 'office_mugs' }, 'not also served in the hand'
    end

    test 'a KO drop for an NPC with no KO record is refused' do
      build
      carry('grace', 'office_mugs')
      post update_room_game_url(@game), params: {
        roomId: 'kitchen', actionType: 'ko_drop_carried',
        data: { npcId: 'grace', itemId: 'office_mugs', position: { px: 10, py: 20 } }
      }, as: :json
      assert_response :unprocessable_entity, 'no KO, no drop'
      assert carry_state['grace'], 'still carried'
      assert_not room_objects('kitchen').any? { |o| o['id'] == 'office_mugs' }
    end

    # === M2: a forged sync_state cannot mint a carry =========================

    test 'a forged npcCarry sync with no action behind it is dropped, not served in both places' do
      build
      # No carry action ran: the object is still in the office, nothing removed.
      body = { npcCarry: { 'grace' => { 'itemId' => 'office_mugs', 'fromRoom' => 'office' } } }
      put sync_state_game_url(@game), params: body.merge(clientTs: 1000), as: :json
      assert_response :success

      assert carry_state.blank?, 'forged entry not minted into npcCarry'
      assert room_objects('office').any? { |o| o['id'] == 'office_mugs' }, 'still on the office floor'
      assert_not npc_held('office', 'grace').to_a.any? { |i| i['id'] == 'office_mugs' }, 'not served in the hand too'
    end

    test 'apply_npc_carry! does not serve a stored carry whose object was never removed from its origin' do
      build
      g = @game.reload
      # Force a stored entry directly (as a pre-reconcile forged state might), with no objects_removed.
      g.player_state['npcCarry'] = { 'grace' => { 'itemId' => 'office_mugs', 'fromRoom' => 'office' } }
      g.save!
      assert room_objects('office').any? { |o| o['id'] == 'office_mugs' }, 'object still in its origin room'
      assert_not npc_held('office', 'grace').any? { |i| i['id'] == 'office_mugs' }, 'inert: not served held'
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

    # === R2 M1: a stale sync must not re-mint a carry that has ended ==========
    # The origin-room removal is append-only, so a replayed sync that arrives after
    # the carry ended must be reconciled against the live stored entry only, never
    # revived from the standing removal marker.

    test 'a stale npcCarry sync replayed after a consume does not re-mint the ended carry' do
      build
      carry('grace', 'office_mugs') # entry written, office objects_removed gains office_mugs
      consume('grace', 'office_mugs') # entry deleted, origin removal stays
      assert_nil carry_state['grace'], 'carry ended on the consume'

      # A sync the client had queued before the consume, replaying the old entry.
      body = { npcCarry: { 'grace' => { 'itemId' => 'office_mugs', 'fromRoom' => 'office' } } }
      put sync_state_game_url(@game), params: body.merge(clientTs: 2000), as: :json
      assert_response :success

      assert carry_state.blank?, 'consumed carry not re-minted by a stale sync'
      assert_not npc_held('office', 'grace').to_a.any? { |i| i['id'] == 'office_mugs' }, 'consumed mug not served held again'
      assert_not room_objects('office').any? { |o| o['id'] == 'office_mugs' }, 'consumed mug not duplicated back onto the floor'
    end

    test 'a stale npcCarry sync replayed after a put-down does not duplicate the object' do
      build
      carry('grace', 'office_mugs')
      put_down('grace', 'office_mugs', room: 'kitchen', position: { px: 50, py: 60 })
      assert_nil carry_state['grace'], 'carry ended on the put-down'

      body = { npcCarry: { 'grace' => { 'itemId' => 'office_mugs', 'fromRoom' => 'office' } } }
      put sync_state_game_url(@game), params: body.merge(clientTs: 2000), as: :json
      assert_response :success

      assert carry_state.blank?, 'ended carry not re-minted by a stale sync'
      assert_not npc_held('office', 'grace').to_a.any? { |i| i['id'] == 'office_mugs' }, 'not served held again'
      assert_equal 1, room_objects('kitchen').select { |o| o['id'] == 'office_mugs' }.size, 'exactly one mug, not duplicated'
    end

    # === R2 m1: a KO drop cannot forge a KO record in a room the NPC is not in =

    test 'ko_drop_carried does not record a KO for an encountered unfought NPC in a room it is not in' do
      build('encounteredNPCs' => %w[grace])
      carry('grace', 'office_mugs') # grace is in the office, never fought, no KO record
      post update_room_game_url(@game), params: {
        roomId: 'kitchen', actionType: 'ko_drop_carried',
        data: { npcId: 'grace', itemId: 'office_mugs', position: { px: 10, py: 20 } }
      }, as: :json

      g = @game.reload
      assert_nil g.player_state.dig('room_states', 'kitchen', 'npc_states', 'grace', 'isKO'),
                 'no fake KO recorded in a room grace was never in'
      assert_not g.npc_defeated?('grace'), 'grace is not knocked out of play by the forged drop'
    end

    test 'ko_drop_carried records the KO when the NPC is in the drop room' do
      build('encounteredNPCs' => %w[grace])
      carry('grace', 'office_mugs')
      post update_room_game_url(@game), params: {
        roomId: 'office', actionType: 'ko_drop_carried',
        data: { npcId: 'grace', itemId: 'office_mugs', position: { px: 10, py: 20 } }
      }, as: :json
      assert_response :success

      g = @game.reload
      assert_equal true, g.player_state.dig('room_states', 'office', 'npc_states', 'grace', 'isKO'),
                   'KO recorded in the room grace is in'
      assert g.npc_defeated?('grace'), 'grace is knocked out'
    end

    # === R2 m2: lock cross-reference covers item-requirement and target keys ===

    test 'a needs-tagged object named by requiresItem or an objective targetObject is not carriable' do
      build
      g = @game.reload
      g.scenario_data['rooms']['office']['objects'] << {
        'type' => 'usb_stick', 'id' => 'kit_badusb', 'name' => 'BadUSB', 'takeable' => true, 'needsTag' => 'dirty_mugs'
      }
      g.scenario_data['rooms']['office']['objects'] << {
        'type' => 'terminal', 'id' => 'drop_terminal', 'name' => 'Terminal', 'requiresItem' => 'kit_badusb'
      }
      g.scenario_data['objectives'] = [{ 'id' => 'obj_clean', 'targetObject' => 'office_mugs' }]
      g.save!

      carry('grace', 'kit_badusb')
      assert_response :unprocessable_entity, 'a requiresItem-referenced id is refused'
      assert_nil @game.reload.player_state['npcCarry']
      assert g.reload.carriable_object_index['kit_badusb'].nil?, 'requiresItem id excluded from the allowlist'
      assert g.carriable_object_index['office_mugs'].nil?, 'objective targetObject id excluded from the allowlist'
    end

    test 'targetId, objectId and unlockedBy each exclude a needs-tagged object from the allowlist' do
      build
      g = @game.reload
      g.scenario_data['rooms']['office']['objects'] << {
        'type' => 'usb_stick', 'id' => 'ref_target', 'name' => 'Target', 'takeable' => true, 'needsTag' => 'dirty_mugs'
      }
      g.scenario_data['rooms']['office']['objects'] << {
        'type' => 'usb_stick', 'id' => 'ref_object', 'name' => 'Object', 'takeable' => true, 'needsTag' => 'dirty_mugs'
      }
      g.scenario_data['rooms']['office']['objects'] << {
        'type' => 'usb_stick', 'id' => 'ref_unlocker', 'name' => 'Unlocker', 'takeable' => true, 'needsTag' => 'dirty_mugs'
      }
      g.scenario_data['rooms']['office']['objects'] << {
        'type' => 'terminal', 'id' => 't_targetid', 'name' => 'T1', 'targetId' => 'ref_target'
      }
      g.scenario_data['rooms']['office']['objects'] << {
        'type' => 'terminal', 'id' => 't_objectid', 'name' => 'T2', 'objectId' => 'ref_object'
      }
      g.scenario_data['rooms']['office']['objects'] << {
        'type' => 'account', 'id' => 'acct', 'name' => 'Account', 'unlockedBy' => 'ref_unlocker'
      }
      g.save!

      %w[ref_target ref_object ref_unlocker].each do |bad_id|
        carry('grace', bad_id)
        assert_response :unprocessable_entity, "#{bad_id} must be refused"
        assert g.reload.carriable_object_index[bad_id].nil?, "#{bad_id} excluded from the allowlist"
      end
      assert g.carriable_object_index['office_mugs'].present?, 'ordinary dressing still carriable'
    end

    # === R3 M1: a carry from any room the object is actually in ================

    test 'a carry picks the object up from a non-scenario room it was moved to' do
      build
      carry('grace', 'office_mugs')
      put_down('grace', 'office_mugs', room: 'kitchen', position: { px: 50, py: 60 })
      assert_nil carry_state['grace'], 'carry ended; mug now sits in the kitchen'
      assert room_objects('kitchen').any? { |o| o['id'] == 'office_mugs' }, 'mug on the kitchen floor'

      # Pick it up again from the kitchen (not its scenario room): the needs system does
      # this for a player-dropped device. It used to 422; now it is accepted.
      carry('grace', 'office_mugs', room: 'kitchen')
      assert_response :success
      assert_equal({ 'itemId' => 'office_mugs', 'fromRoom' => 'kitchen' }, carry_state['grace'])
      assert_not room_objects('kitchen').any? { |o| o['id'] == 'office_mugs' }, 'mug left the kitchen floor'
      assert npc_held('office', 'grace').any? { |i| i['id'] == 'office_mugs' }, 'served in the hand again'
    end

    test 'a carry from a room the NPC cannot reach is refused' do
      build
      g = @game.reload
      # storeroom is unlocked but not connected to the office, where grace is placed.
      g.scenario_data['rooms']['storeroom']['objects'] << {
        'type' => 'dirty_mugs1', 'id' => 'store_mug', 'name' => 'Store Mug', 'takeable' => true, 'needsTag' => 'dirty_mugs'
      }
      g.save!
      carry('grace', 'store_mug', room: 'storeroom')
      assert_response :unprocessable_entity, 'grace cannot reach the storeroom'
      assert_nil carry_state
      assert room_objects('storeroom').any? { |o| o['id'] == 'store_mug' }, 'mug did not move'
    end

    # === R3 m4: a knocked-out NPC cannot carry ===============================

    test 'a KOd NPC cannot pick up a carriable object' do
      build('encounteredNPCs' => %w[grace])
      g = @game.reload
      g.player_state['room_states']['office'] ||= { 'objects_added' => [], 'objects_removed' => [], 'object_states' => {}, 'npc_states' => {} }
      g.player_state['room_states']['office']['npc_states']['grace'] = { 'isKO' => true, 'currentHP' => 0 }
      g.save!
      assert g.npc_defeated?('grace'), 'grace is knocked out'

      carry('grace', 'office_mugs')
      assert_response :unprocessable_entity, 'a KO d NPC cannot carry'
      assert_nil carry_state
      assert room_objects('office').any? { |o| o['id'] == 'office_mugs' }, 'mug stayed on the floor'
    end

    # === R3 m1: KO drop is bounded to the NPC room or an adjacent one =========

    test 'a KO drop into a room the NPC cannot reach is refused with the carry intact' do
      build('encounteredNPCs' => %w[grace])
      carry('grace', 'office_mugs')
      # grace is in the office; the storeroom is unlocked but not adjacent.
      post update_room_game_url(@game), params: {
        roomId: 'storeroom', actionType: 'ko_drop_carried',
        data: { npcId: 'grace', itemId: 'office_mugs', position: { px: 10, py: 20 } }
      }, as: :json
      assert_response :unprocessable_entity, 'cannot drop in a far room'
      assert carry_state['grace'], 'still carried'
      assert_not room_objects('storeroom').any? { |o| o['id'] == 'office_mugs' }, 'nothing added to the storeroom'
    end

    # === R3 M2: a reload ends a stranded carry and puts the object back =======

    test 'a reload (bootstrap) ends a stranded carry and puts the object back in its pick-up room' do
      build
      carry('grace', 'office_mugs')
      assert_equal 'office', carry_state['grace']['fromRoom'], 'carried before the reload'

      # A reload hits the bootstrap before any room fetch.
      get scenario_game_url(@game), as: :json
      assert_response :success

      assert carry_state.blank?, 'the stranded carry is ended'
      landed = room_objects('office').select { |o| o['id'] == 'office_mugs' }
      assert_equal 1, landed.size, 'mug back on the office floor exactly once'
      assert_not npc_held('office', 'grace').to_a.any? { |i| i['id'] == 'office_mugs' }, 'no longer served in the hand'

      # The NPC is free to carry again afterwards.
      carry('grace', 'office_mugs')
      assert_response :success
      assert_equal({ 'itemId' => 'office_mugs', 'fromRoom' => 'office' }, carry_state['grace'], 'carries again after the reload')
    end

    # === R3 m3: delivery to the player clears the carry =======================

    test 'recording a carried object as given to the player clears the carry' do
      build
      carry('grace', 'office_mugs')
      assert carry_state['grace'], 'carried'

      g = @game.reload
      g.record_npc_gift!('grace', { 'type' => 'dirty_mugs1', 'id' => 'office_mugs', 'name' => 'Abandoned Mugs' })
      assert_nil g.player_state['npcCarry']['grace'], 'carry cleared on delivery'
      assert_not npc_held('office', 'grace').to_a.any? { |i| i['id'] == 'office_mugs' }, 'no longer served held'
    end

    # === serving m1: put-down / KO drop refuse once the player holds the item ==

    test 'put down and KO drop refuse when the player already holds the carried object' do
      build('encounteredNPCs' => %w[grace])
      carry('grace', 'office_mugs')
      g = @game.reload
      g.player_state['inventory'] = [{ 'id' => 'office_mugs' }]
      g.save!

      assert_equal false, g.put_down_carried!('kitchen', 'grace', 'office_mugs'), 'put-down refused: already taken'
      assert_equal false, g.ko_drop_carried!('office', 'grace', 'office_mugs'), 'KO drop refused: already taken'
      assert_not room_objects('kitchen').any? { |o| o['id'] == 'office_mugs' }, 'not duplicated into the kitchen'
    end
  end
end
