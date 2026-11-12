require 'test_helper'
require_relative '../../support/access_social_scenario'

module BreakEscape
  # q35 (docs/achitechture/FRIENDFACE_PHONE_ITEM_PLAN.md): the Friendface phone item. POST
  # /friendface_phone opens only a phone the server's inventory holds; an NPC whose phone the
  # player has taken is "phone": false on the server and in the room bootstrap; phoneOf never
  # comes from a client.
  class FriendfacePhoneTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    JAKE_PHONE = { 'type' => 'phone_friendface', 'id' => 'jake_phone', 'name' => "Jake's phone",
                   'takeable' => true, 'phoneOf' => 'jake' }.freeze
    LENA_PHONE = { 'type' => 'phone_friendface', 'id' => 'lena_phone', 'name' => "Lena's phone",
                   'takeable' => true, 'phoneOf' => 'lena' }.freeze
    OWN_PHONE = { 'type' => 'phone_friendface', 'id' => 'my_phone', 'name' => 'Your phone', 'takeable' => true }.freeze

    def scenario
      s = AccessSocialScenario.scenario
      jake = s['rooms']['office']['npcs'].find { |n| n['id'] == 'jake' }
      jake['itemsHeld'] = [JAKE_PHONE.dup]
      # The fixture has no story file: the offer is a give tag in Jake's JSON record (review R1 M1)
      jake['eventMappings'] = [{ 'eventPattern' => 'global_variable_changed:lend_phone', 'action' => 'give_item:phone_friendface' }]
      lena = s['rooms']['office']['npcs'].find { |n| n['id'] == 'lena' }
      lena['itemsHeld'] = [LENA_PHONE.dup]
      s['rooms']['lobby']['objects'] << OWN_PHONE.dup
      s
    end

    def build(player_state = {})
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: { 'currentRoom' => 'office', 'unlockedRooms' => %w[lobby office],
                        'encounteredNPCs' => %w[jake lena omar nia] }.merge(player_state)
      )
    end

    def open_phone(npc_id, posts: true)
      params = { npc_id: npc_id }
      params[:posts] = 1 if posts
      post friendface_phone_game_url(@game), params: params, as: :json
      response.parsed_body
    end

    def feed_post(npc_id, object_id = nil)
      post feed_post_game_url(@game), params: { npc_id: npc_id, object_id: object_id }, as: :json
      response.parsed_body
    end

    def add_item(item, extra = {})
      post inventory_game_url(@game), params: { action_type: 'add', item: item }.merge(extra), as: :json
      response
    end

    test 'an NPC phone the player holds opens on that NPC profile with only its revealed posts' do
      build('inventory' => [JAKE_PHONE.dup],
            'feedRevealed' => { 'jake' => { 'shown' => ['jake_post_1'], 'at' => 1.0 },
                                'lena' => { 'shown' => ['lena_post_1'], 'at' => 1.0 } })
      before = @game.reload.player_state.deep_dup
      body = open_phone('jake')
      assert_response :success
      assert_equal 'friendface', body['site']
      assert_equal 'jake', body['person']
      assert_equal ['jake'], body['feedPosts'].keys
      assert_equal ['jake_post_1'], body['feedPosts']['jake']['posts'].map { |p| p.dig('post', 'id') }
      # Read only, and nothing unrevealed in the answer
      refute_includes response.body, AccessSocialScenario::POSTS[1]
      assert_equal before, @game.reload.player_state
    end

    test 'the player own phone opens the site home with every revealed post' do
      build('inventory' => [OWN_PHONE.dup],
            'feedRevealed' => { 'jake' => { 'shown' => ['jake_post_1'], 'at' => 1.0 },
                                'lena' => { 'shown' => ['lena_post_1'], 'at' => 1.0 } })
      body = open_phone(nil)
      assert_response :success
      assert_equal 'friendface', body['site']
      assert_nil body['person']
      assert_equal %w[jake lena], body['feedPosts'].keys.sort
    end

    test 'review R3 n5: an open without posts=1 leaves the revealed posts out' do
      build('inventory' => [JAKE_PHONE.dup],
            'feedRevealed' => { 'jake' => { 'shown' => ['jake_post_1'], 'at' => 1.0 } })
      body = open_phone('jake', posts: false)
      assert_response :success
      assert_equal 'jake', body['person']
      refute body.key?('feedPosts')
    end

    test 'a phone the player does not hold is refused: none held, another NPC, the own phone, a bad id' do
      build
      open_phone('jake')
      assert_response :forbidden
      open_phone(nil)
      assert_response :forbidden

      build('inventory' => [JAKE_PHONE.dup])
      open_phone('lena')
      assert_response :forbidden
      open_phone(nil) # holds Jake's phone, not one of its own
      assert_response :forbidden
      post friendface_phone_game_url(@game), params: { npc_id: ['jake'] }, as: :json
      assert_response :forbidden

      build('inventory' => [OWN_PHONE.dup])
      open_phone('jake')
      assert_response :forbidden
    end

    test 'a forged phone cannot be added; phoneOf is stripped from a client-built item' do
      build
      add_item({ 'type' => 'phone_friendface', 'id' => 'forged', 'name' => 'Forged', 'phoneOf' => 'lena' })
      assert_response :unprocessable_entity
      add_item({ 'type' => 'notepad', 'name' => 'Notepad', 'phoneOf' => 'lena' })
      assert_response :success
      held = @game.reload.player_state['inventory']
      assert(held.none? { |i| i.key?('phoneOf') })
      open_phone('lena')
      assert_response :forbidden
    end

    test 'Jake gives his phone: the server stores its own copy, then the phone opens and Jake has no phone' do
      build
      add_item({ 'type' => 'phone_friendface', 'id' => 'jake_phone', 'name' => "Jake's phone" }, source_npc_id: 'jake')
      assert_response :success
      stored = @game.reload.player_state['inventory'].find { |i| i['id'] == 'jake_phone' }
      assert_equal 'jake', stored['phoneOf']
      open_phone('jake')
      assert_response :success
      assert @game.reload.friendface_phone_taken?('jake')
      assert_equal false, @game.scenario_room_npc('jake')['phone']
      assert_nil @game.scenario_room_npc('lena')['phone']
    end

    test 'phone taken: a phone post is refused, a post from a place that allows it is not' do
      build('inventory' => [JAKE_PHONE.dup])
      assert_equal true, feed_post('jake')['refused']
      # Lena still has her phone (no phone item of hers is held)
      assert_equal 'lena_post_1', feed_post('lena').dig('post', 'id')
    end

    test 'the gift record keeps the phone taken after the player drops it' do
      build('npc_given_items' => { 'jake' => [{ 'type' => 'phone_friendface', 'id' => 'jake_phone', 'name' => "Jake's phone" }] })
      assert @game.friendface_phone_taken?('jake')
      assert_equal true, feed_post('jake')['refused']
    end

    test 'the room bootstrap sends Jake as "phone": false once his phone is taken, and not before' do
      build
      get room_game_url(@game, room_id: 'office'), as: :json
      jake = response.parsed_body.dig('room', 'npcs')&.find { |n| n['id'] == 'jake' }
      refute_nil jake
      refute_equal false, jake['phone']

      build('inventory' => [JAKE_PHONE.dup])
      get room_game_url(@game, room_id: 'office'), as: :json
      npcs = response.parsed_body.dig('room', 'npcs')
      assert_equal false, npcs.find { |n| n['id'] == 'jake' }['phone']
      refute_equal false, npcs.find { |n| n['id'] == 'lena' }['phone']
    end
  
    test 'review R1 M1: an NPC phone the scenario never offers cannot be taken; Lena keeps her phone' do
      build
      add_item({ 'type' => 'phone_friendface', 'id' => 'lena_phone', 'name' => "Lena's phone" }, source_npc_id: 'lena')
      assert_response :unprocessable_entity
      refute @game.reload.friendface_phone_taken?('lena')
      assert_nil @game.scenario_room_npc('lena')['phone']
      assert_equal 'lena_post_1', feed_post('lena').dig('post', 'id')
    end

    test 'review R1 M1: the offer is read from the compiled story too' do
      build
      refute @game.friendface_phone_offered?('lena')
      assert @game.friendface_phone_offered?('jake')
      offers = ->(text) { AccessWork.offers_item_text?(text, 'phone_friendface') }
      assert offers.call('{"#":"give_item:phone_friendface"}')
      assert offers.call('"#give_item:phone_friendface|jake_phone"')
      assert offers.call('"#give_npc_inventory_items"')
      assert offers.call('"#give_npc_inventory_items:keycard, phone_friendface"')
      refute offers.call('"#give_npc_inventory_items:keycard"')
      refute offers.call('"#give_item:phone"')
      refute offers.call('"#give_item:phone_friendface-case"')
      # An .ink source line (review R2 n1): a tag ends at a newline or the next tag
      assert offers.call("Here.\n# give_npc_inventory_items:phone_friendface # exit_conversation\n")
      refute offers.call("Here.\n# give_npc_inventory_items:keycard # exit_conversation\nphone_friendface\n")
    end

    def room_add(npc_id, item, source_type = nil, room: 'office')
      post update_room_game_url(@game), params: { roomId: room, actionType: 'add_object', sourceNpcId: npc_id,
                                                  sourceType: source_type, data: item }.compact, as: :json
      response
    end

    def knock_out(npc_id)
      post update_room_game_url(@game), params: { roomId: 'office', actionType: 'update_npc_state',
                                                  data: { npcId: npc_id, stateChanges: { isKO: true, currentHP: 0 } } }, as: :json
      assert_response :success
    end

    LENA_SENT = { 'type' => 'phone_friendface', 'id' => 'lena_phone', 'name' => "Lena's phone", 'x' => 64, 'y' => 96 }.freeze

    test 'review R2 M1: a room add sourced from Lena, not KO and never offering her phone, is refused; she keeps it' do
      build
      # The review's probe: the NPC-sourced room add, then an unsourced inventory add
      room_add('lena', LENA_SENT)
      added = Array(@game.reload.player_state.dig('room_states', 'office', 'objects_added'))
      assert(added.none? { |o| o['type'] == 'phone_friendface' }, 'the drop was stored')
      add_item({ 'type' => 'phone_friendface', 'id' => 'lena_phone', 'name' => "Lena's phone" })
      assert_response :unprocessable_entity
      # (Review R3 m2: the KO drop's source type from Lena in her room is now a KO claim, which
      # the server records, as update_npc_state would; see the R3 tests below.)

      @game.reload
      refute @game.friendface_phone_taken?('lena')
      assert_nil @game.player_state['phonesTaken']
      assert_nil @game.scenario_room_npc('lena')['phone']
      open_phone('lena')
      assert_response :forbidden
      assert_equal 'lena_post_1', feed_post('lena').dig('post', 'id')
    end

    def office_objects_added
      Array(@game.reload.player_state.dig('room_states', 'office', 'objects_added'))
    end

    def room_npc(room_id, npc_id)
      get room_game_url(@game, room_id: room_id), as: :json
      assert_response :success
      response.parsed_body.dig('room', 'npcs').find { |n| n['id'] == npc_id }
    end

    test 'review R3 m2: an in-room KO drop whose KO sync never landed records the KO itself; a repeat adds nothing' do
      build
      room_add('lena', LENA_SENT, 'npc_defeated')
      assert_response :success
      assert_equal true, @game.reload.player_state.dig('room_states', 'office', 'npc_states', 'lena', 'isKO')
      assert_equal ['lena_phone'], office_objects_added.map { |o| o['id'] }
      # A retry whose first answer was lost: the same answer, no second copy
      room_add('lena', LENA_SENT, 'npc_defeated')
      assert_response :success
      assert_equal ['lena_phone'], office_objects_added.map { |o| o['id'] }
      # Picked up, then a late retry: still nothing added
      add_item({ 'type' => 'phone_friendface', 'id' => 'lena_phone', 'name' => "Lena's phone" }, source_npc_id: 'lena')
      assert_response :success
      post update_room_game_url(@game), params: { roomId: 'office', actionType: 'remove_object', data: { id: 'lena_phone' } }, as: :json
      room_add('lena', LENA_SENT, 'npc_defeated')
      assert_equal [], office_objects_added.map { |o| o['id'] }
    end

    test 'review R3 m2: a koImmune NPC records no KO from a drop, and its drop is refused' do
      build
      data = @game.scenario_data.deep_dup
      data['rooms']['office']['npcs'].find { |n| n['id'] == 'lena' }['koImmune'] = true
      @game.update!(scenario_data: data)
      room_add('lena', LENA_SENT, 'npc_defeated')
      assert_nil @game.reload.player_state.dig('room_states', 'office', 'npc_states', 'lena')
      assert_equal [], office_objects_added
    end

    test 'review R3 m2: the KO in the hostility record (sync_state) lets a drop in another room land' do
      build('npcHostility' => { 'lena' => { 'hostile' => true, 'ko' => true } })
      room_add('lena', LENA_SENT, 'npc_defeated', room: 'lobby')
      assert_response :success
      added = Array(@game.reload.player_state.dig('room_states', 'lobby', 'objects_added'))
      assert_equal ['lena_phone'], added.map { |o| o['id'] }
    end

    test 'review R3 m2: after a reload a KO\'d NPC whose drop never landed lists it as koDropPending, and not once it has' do
      build('npcHostility' => { 'lena' => { 'hostile' => true, 'ko' => true } })
      assert_equal ['lena_phone'], room_npc('office', 'lena')['koDropPending']
      assert_nil room_npc('office', 'jake')['koDropPending'], 'Jake is not KO\'d'
      room_add('lena', LENA_SENT, 'npc_defeated')
      assert_response :success
      assert_nil room_npc('office', 'lena')['koDropPending']
    end

    test 'review R2 M1: the KO drop still hands Lena\'s phone over' do
      build
      knock_out('lena')
      room_add('lena', LENA_SENT, 'npc_defeated')
      assert_response :success
      stored = @game.reload.player_state.dig('room_states', 'office', 'objects_added').find { |o| o['id'] == 'lena_phone' }
      assert_equal 'lena', stored['phoneOf']
      # The pickup, as inventory.js sends it (source_npc_id from the dropped sprite) and without
      add_item({ 'type' => 'phone_friendface', 'id' => 'lena_phone', 'name' => "Lena's phone" }, source_npc_id: 'lena')
      assert_response :success
      assert @game.reload.friendface_phone_taken?('lena')
      open_phone('lena')
      assert_response :success
    end

    # Code review R5 n2: the drop was refused (the KO sync had not landed), so nothing lies in the
    # room; the local sprite's pickup goes to Lena's itemsHeld. Once the KO is on the server the
    # pickup works; before it, and for an NPC never met, it does not.
    test 'review R5 n2: a KO drop the server refused can still be picked up once the KO is on the server' do
      build('encounteredNPCs' => %w[jake omar nia])
      add_item({ 'type' => 'phone_friendface', 'id' => 'lena_phone', 'name' => "Lena's phone" }, source_npc_id: 'lena')
      assert_response :unprocessable_entity, 'no KO and not met'

      @game.reload.player_state['encounteredNPCs'] << 'lena'
      @game.save!
      add_item({ 'type' => 'phone_friendface', 'id' => 'lena_phone', 'name' => "Lena's phone" }, source_npc_id: 'lena')
      assert_response :unprocessable_entity, 'met, but no KO'

      put sync_state_game_url(@game), params: { npcHostility: { 'lena' => { hostile: true, ko: true } } }, as: :json
      assert_response :success
      assert_nil @game.reload.player_state.dig('room_states', 'office', 'objects_added')
      add_item({ 'type' => 'phone_friendface', 'id' => 'lena_phone', 'name' => "Lena's phone" }, source_npc_id: 'lena')
      assert_response :success
      assert @game.reload.friendface_phone_taken?('lena')
      open_phone('lena')
      assert_response :success
    end

    test 'review R2 M1: an NPC that offers its phone may drop it without a KO, once met' do
      build('encounteredNPCs' => %w[lena omar nia])
      room_add('jake', { 'type' => 'phone_friendface', 'id' => 'jake_phone', 'name' => "Jake's phone" })
      assert(Array(@game.reload.player_state.dig('room_states', 'office', 'objects_added')).none? { |o| o['id'] == 'jake_phone' },
             'an NPC the player never met cannot drop its phone')

      build
      room_add('jake', { 'type' => 'phone_friendface', 'id' => 'jake_phone', 'name' => "Jake's phone" })
      assert_response :success
      add_item({ 'type' => 'phone_friendface', 'id' => 'jake_phone', 'name' => "Jake's phone" })
      assert_response :success
      assert @game.reload.friendface_phone_taken?('jake')
    end

    test 'review R2 M1: an unoffered phone stored by a save made before the fix cannot be picked up' do
      build('room_states' => { 'office' => { 'objects_added' => [LENA_PHONE.merge('x' => 64, 'y' => 96)], 'objects_removed' => [],
                                             'object_states' => {}, 'npc_states' => {} } })
      add_item({ 'type' => 'phone_friendface', 'id' => 'lena_phone', 'name' => "Lena's phone" })
      assert_response :unprocessable_entity
      refute @game.reload.friendface_phone_taken?('lena')

      knock_out('lena')
      add_item({ 'type' => 'phone_friendface', 'id' => 'lena_phone', 'name' => "Lena's phone" })
      assert_response :success
    end

    test 'review R2 m1: after a KO pickup the room bootstrap no longer lists the phone in Lena\'s itemsHeld' do
      build('inventory' => [LENA_PHONE.dup], 'phonesTaken' => ['lena'])
      get room_game_url(@game, room_id: 'office'), as: :json
      npcs = response.parsed_body.dig('room', 'npcs')
      lena = npcs.find { |n| n['id'] == 'lena' }
      assert_equal false, lena['phone']
      assert(Array(lena['itemsHeld']).none? { |i| i['type'] == 'phone_friendface' }, 'Lena still holds her phone after a reload')
      # Jake's phone is untouched
      assert(npcs.find { |n| n['id'] == 'jake' }['itemsHeld'].any? { |i| i['id'] == 'jake_phone' })

      # Taken and since removed from the inventory: Lena still holds no phone
      build('phonesTaken' => ['lena'])
      get room_game_url(@game, room_id: 'office'), as: :json
      lena = response.parsed_body.dig('room', 'npcs').find { |n| n['id'] == 'lena' }
      assert(Array(lena['itemsHeld']).none? { |i| i['type'] == 'phone_friendface' })
    end

    test 'review R1 m1: update_room cannot mint a Friendface phone, and a held phone the scenario does not declare opens nothing' do
      build
      post update_room_game_url(@game), params: { roomId: 'office', actionType: 'add_object',
                                                  data: { type: 'phone_friendface', id: 'minted', name: 'Minted', takeable: true } }, as: :json
      added = Array(@game.reload.player_state.dig('room_states', 'office', 'objects_added'))
      assert(added.none? { |o| o['id'] == 'minted' })
      add_item({ 'type' => 'phone_friendface', 'id' => 'minted', 'name' => 'Minted' })
      assert_response :unprocessable_entity

      build('inventory' => [{ 'type' => 'phone_friendface', 'id' => 'minted', 'name' => 'Minted' }])
      open_phone(nil)
      assert_response :forbidden
    end

    test 'review R1 m2: an NPC phone taken by any route stays taken after a remove' do
      build
      add_item({ 'type' => 'phone_friendface', 'id' => 'jake_phone', 'name' => "Jake's phone" }, source_npc_id: 'jake')
      assert_response :success
      assert_equal ['jake'], @game.reload.player_state['phonesTaken']
      @game.player_state.delete('npc_given_items') # as a KO pickup: no gift record
      @game.save!
      post inventory_game_url(@game), params: { action_type: 'remove', item: { id: 'jake_phone' } }, as: :json
      assert_response :success
      assert @game.reload.friendface_phone_taken?('jake')
      assert_equal true, feed_post('jake')['refused']
    end
  end
end
