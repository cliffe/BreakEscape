require 'test_helper'
require_relative '../../support/access_model_scenario'

module BreakEscape
  # SYNC_DELTAS_PLAN P1 (section 5): a recorded copy stores one display card, built from the
  # server's definition plus the client's rfid_data, and the list is bounded and repairable.
  class CloneCardSavedCardsTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    CLONER = AccessModelScenario::CLONER
    JAKE = AccessModelScenario::JAKE_CARD['card_id']

    def build(player_state = {})
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: AccessModelScenario.routes_scenario,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby finance],
                        'encounteredNPCs' => %w[len jake dana exec imran gary] }.merge(player_state)
      )
    end

    def clone(card_id, npc_id: nil, card: :none)
      params = { card_id: card_id, npc_id: npc_id }.compact
      params[:card] = card unless card == :none
      post clone_card_game_url(@game), params: params, as: :json
      response.parsed_body
    end

    def stored_cards
      @game.reload.player_state['inventory'].find { |i| i['type'] == 'rfid_cloner' }['saved_cards'] || []
    end

    test 'a recorded copy with a card saves one display card and the bootstrap returns it' do
      build('inventory' => [CLONER.dup])
      body = clone(JAKE, npc_id: 'jake', card: { 'card_id' => JAKE, 'rfid_data' => { 'uid' => '4F00A1C2' } })
      assert_equal true, body['recorded']
      assert_equal true, body['saved']
      cards = stored_cards
      assert_equal [JAKE], cards.map { |c| c['card_id'] }
      assert_equal 'Jake\'s badge', cards.first['name']
      assert_equal 'EM4100', cards.first['rfid_protocol']
      assert_equal '4F00A1C2', cards.first.dig('rfid_data', 'uid')
      assert cards.first['timestamp'].is_a?(Integer)
    end

    test 'the name and protocol come from the definition and unknown keys are dropped' do
      build('inventory' => [CLONER.dup])
      clone(JAKE, npc_id: 'jake',
            card: { 'card_id' => JAKE, 'name' => 'FORGED', 'rfid_protocol' => 'MIFARE_DESFire',
                    'evil' => 'x', 'rfid_data' => { 'uid' => 'U', 'secret' => 'leak' } })
      card = stored_cards.first
      assert_equal 'Jake\'s badge', card['name'], 'name is the server definition, not the client value'
      assert_equal 'EM4100', card['rfid_protocol']
      refute card.key?('evil')
      assert_equal({ 'uid' => 'U' }, card['rfid_data'], 'only SAVED_CARD_DATA_KEYS are kept')
    end

    test 'a second copy of the same card replaces it in place' do
      build('inventory' => [CLONER.dup])
      clone(JAKE, npc_id: 'jake', card: { 'card_id' => JAKE, 'rfid_data' => { 'uid' => 'A' } })
      clone(JAKE, npc_id: 'jake', card: { 'card_id' => JAKE, 'rfid_data' => { 'uid' => 'B' } })
      cards = stored_cards
      assert_equal 1, cards.length
      assert_equal 'B', cards.first.dig('rfid_data', 'uid')
    end

    test 'a card for a copy that is not the source own card is not saved' do
      build('inventory' => [CLONER.dup])
      body = clone('not_jakes_id', npc_id: 'jake', card: { 'card_id' => 'not_jakes_id' })
      assert_equal false, body['recorded']
      assert_nil body['saved'], 'no card is saved for a copy that was not recorded'
    end

    test 'the 51st card is refused with reason full' do
      full = {}
      50.times { |i| full["c#{i}"] = { 'source' => { 'npc' => 'jake' }, 'uidOnly' => false } }
      cloner = CLONER.deep_dup
      cloner['saved_cards'] = (0...50).map { |i| { 'card_id' => "c#{i}" } }
      build('inventory' => [cloner], 'serverClones' => full)
      body = clone(JAKE, npc_id: 'jake', card: { 'card_id' => JAKE, 'rfid_data' => { 'uid' => 'U' } })
      assert_equal true, body['recorded']
      assert_equal false, body['saved']
      assert_equal 'full', body['reason']
    end

    test 'an oversized card is refused with reason too_big' do
      build('inventory' => [CLONER.dup])
      huge = { 'card_id' => JAKE, 'rfid_data' => { 'sectors' => { 'x' => 'y' * 5000 } } }
      body = clone(JAKE, npc_id: 'jake', card: huge)
      assert_equal true, body['recorded']
      assert_equal false, body['saved']
      assert_equal 'too_big', body['reason']
      assert_empty stored_cards
    end

    test 'remove_saved_card removes a card, a reload does not bring it back, a fresh copy lists it again' do
      build('inventory' => [CLONER.dup])
      clone(JAKE, npc_id: 'jake', card: { 'card_id' => JAKE, 'rfid_data' => { 'uid' => 'U' } })
      assert_equal [JAKE], stored_cards.map { |c| c['card_id'] }

      post inventory_game_url(@game), params: { action_type: 'remove_saved_card', card_id: JAKE }, as: :json
      assert_response :success
      assert_empty stored_cards
      # The listed:false mark stops the bootstrap repair putting it back.
      get scenario_game_url(@game)
      assert_empty stored_cards

      # A fresh copy clears the mark and lists it again.
      clone(JAKE, npc_id: 'jake', card: { 'card_id' => JAKE, 'rfid_data' => { 'uid' => 'U2' } })
      assert_equal [JAKE], stored_cards.map { |c| c['card_id'] }
    end

    test 'the bootstrap repair restores a recorded copy missing from the list' do
      cloner = CLONER.deep_dup
      build('inventory' => [cloner],
            'serverClones' => { JAKE => { 'source' => { 'npc' => 'jake' }, 'uidOnly' => false } })
      assert_empty stored_cards
      get scenario_game_url(@game)
      assert_equal [JAKE], stored_cards.map { |c| c['card_id'] }
    end

    test 'the repair adds nothing when no cloner is held' do
      build('inventory' => [],
            'serverClones' => { JAKE => { 'source' => { 'npc' => 'jake' }, 'uidOnly' => false } })
      assert_nil @game.reload.player_state['inventory'].find { |i| i['type'] == 'rfid_cloner' }
      get scenario_game_url(@game)
      assert_nil @game.reload.player_state['inventory'].find { |i| i['type'] == 'rfid_cloner' }
    end

    test 'a clone_card body over 8 KB is refused with 413 before parsing' do
      build('inventory' => [CLONER.dup])
      big = 'x' * (9 * 1024)
      post clone_card_game_url(@game), params: { card_id: JAKE, npc_id: 'jake', card: { 'rfid_data' => { 'blob' => big } } },
                                       as: :json
      assert_response :payload_too_large
    end
  end
end
