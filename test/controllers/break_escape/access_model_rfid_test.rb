require 'test_helper'
require_relative '../../support/access_model_scenario'

module BreakEscape
  # Access model step 3 (ACCESS_MODEL_PLAN.md sections 4 and 6): POST /clone_card and
  # the rfid access-list branch of POST /unlock, for doors and objects.
  class AccessModelRfidTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    CLONER = AccessModelScenario::CLONER
    JAKE_CARD_ID = AccessModelScenario::JAKE_CARD['card_id']
    EXEC_CARD_ID = AccessModelScenario::EXEC_CARD['card_id']
    POWER_CARD_ID = AccessModelScenario::POWER_CARD['card_id']

    def build(player_state = {})
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: AccessModelScenario.routes_scenario,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby finance],
                        'encounteredNPCs' => %w[len jake dana exec imran gary] }.merge(player_state)
      )
    end

    def keycard(id)
      @game.scenario_data['rooms']['lobby']['objects'].find { |o| o['id'] == id }
    end

    def clone_card(card_id, npc_id: nil, object_id: nil, held_card: nil)
      post clone_card_game_url(@game), params: { card_id: card_id, npc_id: npc_id, object_id: object_id,
                                                 held_card: held_card }.compact, as: :json
      response.parsed_body
    end

    def door(room_id, card_ids: nil)
      params = { targetType: 'door', targetId: room_id, method: 'rfid' }
      params[:card_ids] = card_ids unless card_ids.nil?
      post unlock_game_url(@game), params: params, as: :json
      response.parsed_body
    end

    def object(object_id, card_ids: nil)
      params = { targetType: 'object', targetId: object_id, method: 'rfid' }
      params[:card_ids] = card_ids unless card_ids.nil?
      post unlock_game_url(@game), params: params, as: :json
      response.parsed_body
    end

    def assert_refused(body, reason: nil)
      assert_response :unprocessable_entity
      assert_equal false, body['success']
      if reason
        assert_equal reason, body['reason']
      else
        refute body.key?('reason'), "unexpected reason #{body['reason']}"
      end
    end

    # ---- POST /clone_card ------------------------------------------------------------

    test 'an NPC source records its own card' do
      build('inventory' => [CLONER.dup])
      assert_equal({ 'success' => true, 'recorded' => true }, clone_card(JAKE_CARD_ID, npc_id: 'jake'))
      assert_equal({ 'source' => { 'npc' => 'jake' }, 'uidOnly' => false }, @game.reload.player_state['serverClones'][JAKE_CARD_ID])
    end

    test 'a DESFire card is recorded UID-only' do
      build('inventory' => [CLONER.dup])
      clone_card(EXEC_CARD_ID, npc_id: 'exec')
      assert_equal true, @game.reload.player_state['serverClones'][EXEC_CARD_ID]['uidOnly']
    end

    test 'an NPC not yet encountered, or not cloneable, is refused' do
      build('inventory' => [CLONER.dup], 'encounteredNPCs' => [])
      clone_card(JAKE_CARD_ID, npc_id: 'jake')
      assert_response :forbidden

      data = AccessModelScenario.routes_scenario
      data['rooms']['finance']['npcs'].find { |n| n['id'] == 'jake' }['cloneable'] = false
      @game = create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                                 scenario: data, player_state: { 'inventory' => [CLONER.dup], 'encounteredNPCs' => ['jake'] })
      clone_card(JAKE_CARD_ID, npc_id: 'jake')
      assert_response :forbidden
      assert_empty @game.reload.player_state['serverClones']
    end

    test 'a keycard held in the inventory is a source' do
      build('inventory' => [CLONER.dup, keycard_item('visitor_badge')])
      assert_equal true, clone_card('VISITOR-07', object_id: 'visitor_badge')['recorded']
      assert_equal({ 'object' => 'visitor_badge' }, @game.reload.player_state['serverClones']['VISITOR-07']['source'])
    end

    test 'a keycard in a reachable room is a source' do
      build('inventory' => [CLONER.dup])
      assert_equal true, clone_card('VISITOR-07', object_id: 'visitor_badge')['recorded']
    end

    test 'a keycard inside a locked container is refused until it is unlocked' do
      build('inventory' => [CLONER.dup])
      clone_card('SAFE-01', object_id: 'safe_badge')
      assert_response :forbidden
      @game.unlock_object!('lobby_safe')
      assert_equal true, clone_card('SAFE-01', object_id: 'safe_badge')['recorded']
    end

    test 'a card_id that is not the source card records nothing' do
      build('inventory' => [CLONER.dup])
      assert_equal({ 'success' => true, 'recorded' => false }, clone_card('MASTER-99', npc_id: 'jake'))
      assert_equal({ 'success' => true, 'recorded' => false }, clone_card(JAKE_CARD_ID, object_id: 'visitor_badge'))
      assert_empty @game.reload.player_state['serverClones']
    end

    test 'no card copier is refused' do
      build
      clone_card(JAKE_CARD_ID, npc_id: 'jake')
      assert_response :forbidden
      clone_card('VISITOR-07', object_id: 'visitor_badge')
      assert_response :forbidden
      assert_empty @game.reload.player_state['serverClones']
    end

    # ---- POST /unlock, rfid doors with an access list --------------------------------

    test 'a role-list door opens for a held keycard of an admitted identity' do
      build('inventory' => [keycard_item('jake_spare')])
      body = door('records', card_ids: [JAKE_CARD_ID])
      assert_response :success, body.inspect
      assert_includes @game.reload.player_state['unlockedRooms'], 'records'
    end

    test 'a role-list door opens for a server-recorded copy while the copier is held' do
      build('inventory' => [CLONER.dup])
      clone_card(JAKE_CARD_ID, npc_id: 'jake')
      door('records', card_ids: [JAKE_CARD_ID])
      assert_response :success
    end

    test 'the same copy is refused once the copier is no longer held' do
      build('inventory' => [CLONER.dup])
      clone_card(JAKE_CARD_ID, npc_id: 'jake')
      @game.reload.remove_inventory_item!('card_copier')
      assert_refused door('records', card_ids: [JAKE_CARD_ID])
    end

    test 'a copy only in the copier saved_cards list is refused' do
      cloner = CLONER.merge('saved_cards' => [{ 'card_id' => JAKE_CARD_ID, 'rfid_protocol' => 'EM4100' }])
      build('inventory' => [cloner])
      assert_refused door('records', card_ids: [JAKE_CARD_ID])
    end

    test 'an access-only door without card_ids is refused' do
      build('inventory' => [keycard_item('jake_spare')])
      assert_refused door('records')
    end

    test 'a card of an identity the list does not admit is refused' do
      build('inventory' => [keycard_item('visitor_badge')])
      assert_refused door('records', card_ids: ['VISITOR-07'])
    end

    test 'a UID-only copy is refused without acceptsUIDOnly with reason uid_only, and accepted with it' do
      build('inventory' => [CLONER.dup])
      clone_card(EXEC_CARD_ID, npc_id: 'exec')
      assert_refused door('exec_suite', card_ids: [EXEC_CARD_ID]), reason: 'uid_only'
      door('exec_lounge', card_ids: [EXEC_CARD_ID])
      assert_response :success
    end

    test 'a mixed door keeps the trusted rule for a requires card' do
      build
      door('mixed')
      assert_response :success
      assert_includes @game.reload.player_state['unlockedRooms'], 'mixed'
    end

    test 'a mixed door opens for a held card in requires and for an admitted identity' do
      build('inventory' => [keycard_item('visitor_badge')])
      door('mixed', card_ids: ['VISITOR-07'])
      assert_response :success

      build('inventory' => [CLONER.dup])
      clone_card('4F00A1C2', npc_id: 'jake')
      assert_refused door('mixed', card_ids: [JAKE_CARD_ID]) # Jake is finance, not it
    end

    test 'a shared card passes for either holder role' do
      build('inventory' => [CLONER.dup])
      clone_card(POWER_CARD_ID, npc_id: 'imran')
      door('power_room', card_ids: [POWER_CARD_ID]) # Gary: security
      assert_response :success
      door('plant_room', card_ids: [POWER_CARD_ID]) # Imran: facilities
      assert_response :success
    end

    test 'an access-list unlock names the player\'s own keycard that passed' do
      build('inventory' => [keycard_item('visitor_badge'), keycard_item('jake_spare')])
      body = door('records', card_ids: ['VISITOR-07', JAKE_CARD_ID])
      assert_response :success
      assert_equal JAKE_CARD_ID, body['cardId']
      refute body.key?('viaCopy')
    end

    # Naming a copy would tell the player whose identity the list admits (UX devices R1 m1).
    test 'an access-list unlock by a copy says only viaCopy, with no card id' do
      build('inventory' => [CLONER.dup, keycard_item('visitor_badge')])
      clone_card(JAKE_CARD_ID, npc_id: 'jake')
      clone_card(EXEC_CARD_ID, npc_id: 'exec')
      body = door('records', card_ids: ['VISITOR-07', EXEC_CARD_ID, JAKE_CARD_ID])
      assert_response :success
      assert_equal true, body['viaCopy']
      refute body.key?('cardId')
    end

    test 'an object unlock names the card too, and a refusal names none' do
      build('inventory' => [keycard_item('jake_spare')])
      refused = object('finance_cabinet', card_ids: ['VISITOR-07'])
      refute refused.key?('cardId')
      refute refused.key?('viaCopy')
      body = object('finance_cabinet', card_ids: [JAKE_CARD_ID])
      assert_equal JAKE_CARD_ID, body['cardId']
    end

    test 'a requires-only rfid door answers without cardId or viaCopy' do
      data = AccessModelScenario.routes_scenario
      data['rooms']['badge_door'] = { 'type' => 'room_office', 'connections' => {}, 'locked' => true,
                                      'lockType' => 'rfid', 'requires' => ['VISITOR-07'] }
      @game = create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                                 scenario: data,
                                 player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'],
                                                 'inventory' => [keycard_item('visitor_badge')] })
      body = door('badge_door', card_ids: ['VISITOR-07'])
      assert_response :success, body.inspect
      refute body.key?('cardId')
      refute body.key?('viaCopy')
    end

    test 'a UID-only copy at a lock without acceptsUIDOnly is refused with no card named' do
      build('inventory' => [CLONER.dup])
      clone_card(EXEC_CARD_ID, npc_id: 'exec')
      body = door('exec_suite', card_ids: [EXEC_CARD_ID])
      assert_refused body, reason: 'uid_only'
      refute body.key?('cardId')
      refute body.key?('viaCopy')
    end

    test 'the first passing card of several opens the door' do
      build('inventory' => [keycard_item('visitor_badge'), keycard_item('jake_spare')])
      door('records', card_ids: ['VISITOR-07', JAKE_CARD_ID])
      assert_response :success
    end

    test 'other refusals carry no reason' do
      build('inventory' => [CLONER.dup])
      clone_card(EXEC_CARD_ID, npc_id: 'exec')
      assert_refused door('records', card_ids: [EXEC_CARD_ID])
      post unlock_game_url(@game), params: { targetType: 'door', targetId: 'vault', method: 'pin', attempt: '0000' }, as: :json
      assert_refused response.parsed_body
    end

    test 'a door unlock answer carries account tiles for the sign-in PCs' do
      build('unlockedRooms' => ['lobby'])
      post unlock_game_url(@game), params: { targetType: 'door', targetId: 'finance', method: 'pin', attempt: '4321' }, as: :json
      assert_response :success
      pc = response.parsed_body['roomData']['objects'].find { |o| o['id'] == 'jake_pc' }
      assert_equal %w[jbrooks DWhite], pc['loginAccounts'].map { |t| t['username'] }
    end

    # ---- POST /unlock, an rfid object with role-only access ----------------------------

    test 'an rfid object with a role list follows the same rules' do
      build('inventory' => [CLONER.dup, keycard_item('jake_spare')])
      assert_refused object('finance_cabinet')
      assert_refused object('finance_cabinet', card_ids: ['VISITOR-07'])
      body = object('finance_cabinet', card_ids: [JAKE_CARD_ID])
      assert_response :success
      assert_equal 'Ledger', body['contents'].first['name']
    end

    test 'an rfid object accepts a UID-only copy where acceptsUIDOnly is set' do
      data_build_with_exec_cabinet
      clone_card(EXEC_CARD_ID, npc_id: 'exec')
      object('finance_cabinet', card_ids: [EXEC_CARD_ID])
      assert_response :success
    end

    test 'an rfid object refuses a server copy after the copier is gone' do
      build('inventory' => [CLONER.dup])
      clone_card(JAKE_CARD_ID, npc_id: 'jake')
      @game.reload.remove_inventory_item!('card_copier')
      assert_refused object('finance_cabinet', card_ids: [JAKE_CARD_ID])
    end

    # ---- Code review R1: "held" is decided by card_id, never by name ------------------

    STAFF_BADGE = { 'type' => 'keycard', 'name' => 'Staff badge', 'rfid_protocol' => 'EM4100' }.freeze

    # Len and Morgan each hold an NPC badge named "Staff badge" (itemsHeld keycards carry
    # no stamped id); Jake holds his own badge as an item too.
    def build_with_npc_badges(inventory)
      data = AccessModelScenario.routes_scenario
      npcs = data['rooms'].values.flat_map { |room| Array(room['npcs']) }
      npcs.find { |n| n['id'] == 'len' }['itemsHeld'] = [STAFF_BADGE.merge('card_id' => 'LOW-01')]
      npcs.find { |n| n['id'] == 'exec' }['itemsHeld'] = [STAFF_BADGE.merge('card_id' => EXEC_CARD_ID)]
      npcs.find { |n| n['id'] == 'jake' }['itemsHeld'] = [STAFF_BADGE.merge('name' => "Jake's badge", 'card_id' => JAKE_CARD_ID)]
      @game = create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                                 scenario: data,
                                 player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby finance],
                                                 'encounteredNPCs' => %w[len jake dana exec], 'inventory' => inventory })
    end

    test "a held NPC badge does not count as another NPC's badge with the same name" do
      build_with_npc_badges([STAFF_BADGE.merge('card_id' => 'LOW-01')])
      held = @game.held_rfid_cards
      assert_equal false, held['LOW-01']
      refute held.key?(EXEC_CARD_ID), "held_rfid_cards counts Morgan's badge: #{held.inspect}"
      assert_refused door('exec_suite', card_ids: [EXEC_CARD_ID])
      refute_includes Array(@game.reload.player_state['unlockedRooms']), 'exec_suite'
    end

    test 'a held badge sharing a name with a distant keycard is not that keycard as a copy source' do
      build_with_npc_badges([CLONER.dup, STAFF_BADGE.merge('name' => 'Safe badge', 'card_id' => 'LOW-01')])
      clone_card('SAFE-01', object_id: 'safe_badge')
      assert_response :forbidden
      assert_empty @game.reload.player_state['serverClones'].to_h
    end

    test 'a held keycard with no id is a copy source by its card_id, and the copy outlives the card' do
      badge = STAFF_BADGE.merge('name' => "Jake's badge", 'card_id' => JAKE_CARD_ID)
      build_with_npc_badges([CLONER.dup, badge])
      assert_equal true, clone_card(JAKE_CARD_ID, held_card: true)['recorded']
      assert_equal({ 'held' => JAKE_CARD_ID }, @game.reload.player_state['serverClones'][JAKE_CARD_ID]['source'])
      # Handed back: the copy alone opens the finance-only door while the copier is held
      @game.player_state['inventory'] = [CLONER.dup]
      @game.save!
      assert_equal true, door('records', card_ids: [JAKE_CARD_ID])['success']
    end

    test 'a held-card copy of a card the player does not hold is refused' do
      build_with_npc_badges([CLONER.dup, STAFF_BADGE.merge('card_id' => 'LOW-01')])
      clone_card(EXEC_CARD_ID, held_card: true)
      assert_response :forbidden
      clone_card(JAKE_CARD_ID, held_card: true)
      assert_response :forbidden
      assert_empty @game.reload.player_state['serverClones'].to_h
    end

    # Code review R2, m5: the client sends held_card for any keycard sprite with no id
    # (interactions.js), so a world keycard with no id, lying in a reachable room and not
    # picked up, arrives as a held-card source. It is not held, so it is refused.
    test 'an id-less keycard lying in a reachable room is not a held-card copy source' do
      data = AccessModelScenario.routes_scenario
      data['rooms']['lobby']['objects'] << { 'type' => 'keycard', 'name' => 'Dropped badge',
                                              'card_id' => 'DROPPED-01', 'rfid_protocol' => 'EM4100' }
      @game = create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                                 scenario: data,
                                 player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby finance],
                                                 'inventory' => [CLONER.dup] })
      assert(@game.scenario_data['rooms']['lobby']['objects'].any? { |o| o['card_id'] == 'DROPPED-01' })
      body = clone_card('DROPPED-01', held_card: true)
      assert_response :forbidden
      refute_equal true, body['recorded']
      assert_empty @game.reload.player_state['serverClones'].to_h
      assert_refused door('records', card_ids: ['DROPPED-01'])
    end

    # Code review R2, n1: a legitimately authored keycard dropped (player_drop) and picked up
    # again is rebuilt from the server copy, so it is never marked clientAdded and still opens
    # its rfid door. Guards against a regression that wrongly tagged a real card forged.
    test 'a keycard dropped and picked up again is not marked forged and still opens an rfid door' do
      data = AccessModelScenario.routes_scenario
      data['rooms']['lobby']['objects'].find { |o| o['id'] == 'visitor_badge' }['droppable'] = true
      @game = create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                                 scenario: data,
                                 player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby],
                                                 'encounteredNPCs' => [] })

      take = lambda do
        post inventory_game_url(@game), params: { action_type: 'add',
                                                  item: { type: 'keycard', id: 'visitor_badge', name: 'Visitor badge' } }, as: :json
        assert_response :success, response.body
      end
      take.call
      # Drop it (player_drop rebuilds from the server copy), remove it, then take it back.
      post update_room_game_url(@game), params: { roomId: 'lobby', actionType: 'add_object', sourceType: 'player_drop',
                                                  data: { id: 'visitor_badge', type: 'keycard', name: 'Visitor badge', x: 6, y: 6 } }, as: :json
      assert_response :success, response.body
      post inventory_game_url(@game), params: { action_type: 'remove', item: { id: 'visitor_badge' } }, as: :json
      assert_response :success, response.body
      take.call

      stored = @game.reload.player_state['inventory'].find { |i| i['id'] == 'visitor_badge' }
      assert stored, 'the keycard is back in the inventory'
      refute BreakEscape::ItemIdentity.client_forged?(stored), 'a real dropped keycard is not marked forged'
      assert_equal 'VISITOR-07', stored['card_id'], 'the server card_id survived the round trip'
      # mixed is locked rfid, requires VISITOR-07: the re-picked badge still opens it.
      assert door('mixed', card_ids: ['VISITOR-07'])['success'], 'the re-picked keycard still opens the rfid door'
    end

    private

    def keycard_item(id)
      card = AccessModelScenario.routes_scenario['rooms']['lobby']['objects'].find { |o| o['id'] == id }
      card.slice('id', 'type', 'name', 'card_id', 'rfid_protocol', 'takeable')
    end

    # finance_cabinet admits the exec role and accepts UID-only copies.
    def data_build_with_exec_cabinet
      data = AccessModelScenario.routes_scenario
      cabinet = data['rooms']['finance']['objects'].find { |o| o['id'] == 'finance_cabinet' }
      cabinet['access'] = { 'roles' => ['exec'] }
      @game = create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                                 scenario: data,
                                 player_state: { 'unlockedRooms' => %w[lobby finance], 'encounteredNPCs' => ['exec'],
                                                 'inventory' => [CLONER.dup] })
    end
  end
end
