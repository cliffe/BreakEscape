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

    def clone_card(card_id, npc_id: nil, object_id: nil)
      post clone_card_game_url(@game), params: { card_id: card_id, npc_id: npc_id, object_id: object_id }.compact, as: :json
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
