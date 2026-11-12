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

    def open_phone(npc_id)
      post friendface_phone_game_url(@game), params: { npc_id: npc_id }, as: :json
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
      assert @game.send(:offers_phone_text?, '{"#":"give_item:phone_friendface"}')
      assert @game.send(:offers_phone_text?, '"#give_npc_inventory_items"')
      assert @game.send(:offers_phone_text?, '"#give_npc_inventory_items:keycard, phone_friendface"')
      refute @game.send(:offers_phone_text?, '"#give_npc_inventory_items:keycard"')
      refute @game.send(:offers_phone_text?, '"#give_item:phone"')
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
