require 'test_helper'

# Approval log E18 (server resolves an NPC give by id first, from the giving NPC
# first) and E22 (an NPC that has handed an item over does not get it back on
# reload). Driven over HTTP: the client only sees what the endpoints return.
module BreakEscape
  class NpcGiveTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    NPC_EMAIL = { 'type' => 'notes', 'id' => 'ceo_email_npc', 'name' => 'CEO email', 'takeable' => true }.freeze
    CABINET_EMAIL = { 'type' => 'notes', 'id' => 'ceo_email_cabinet', 'name' => 'CEO email', 'takeable' => true }.freeze
    BADGE = { 'type' => 'keycard', 'id' => 'cto_badge', 'name' => 'CTO badge', 'takeable' => true }.freeze
    WORDLIST = { 'type' => 'notes', 'id' => 'wordlist', 'name' => 'Wordlist', 'takeable' => true }.freeze
    EXEC_BADGE = { 'type' => 'keycard', 'id' => 'exec_badge', 'name' => 'Executive badge', 'takeable' => true }.freeze

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @owner   = break_escape_demo_users(:test_user)
    end

    # ---- E18 -----------------------------------------------------------------

    test 'a give from an NPC is matched by id, not by the name a locked cabinet copy shares' do
      game = create_game
      post inventory_game_url(game), params: { action_type: 'add', item: NPC_EMAIL, source_npc_id: 'patricia' }, as: :json

      assert_response :success, response.body
      assert_equal ['ceo_email_npc'], game.reload.player_state['inventory'].map { |i| i['id'] }
    end

    test 'the id decides even when the client does not say which NPC is giving' do
      game = create_game
      post inventory_game_url(game), params: { action_type: 'add', item: NPC_EMAIL }, as: :json

      assert_response :success, response.body
    end

    test 'the cabinet copy is still refused while the cabinet is locked' do
      game = create_game
      post inventory_game_url(game), params: { action_type: 'add', item: CABINET_EMAIL }, as: :json

      assert_response :unprocessable_entity
      assert_match(/Container not unlocked/, response.parsed_body['message'])
    end

    test 'with no ids on either copy, naming the giving NPC finds the NPC copy first' do
      game = create_game(patricia_items: [NPC_EMAIL.except('id')], cabinet_items: [CABINET_EMAIL.except('id')])
      nameonly = NPC_EMAIL.except('id')

      post inventory_game_url(game), params: { action_type: 'add', item: nameonly }, as: :json
      assert_response :unprocessable_entity, 'Without a source NPC the cabinet copy still wins (documented fallback)'

      post inventory_game_url(game), params: { action_type: 'add', item: nameonly, source_npc_id: 'patricia' }, as: :json
      assert_response :success, response.body
    end

    test 'an NPC the player has not met cannot give, even when named as the source' do
      game = create_game(encountered: [])
      post inventory_game_url(game), params: { action_type: 'add', item: NPC_EMAIL, source_npc_id: 'patricia' }, as: :json

      assert_response :unprocessable_entity
      assert_match(/NPC not encountered/, response.parsed_body['message'])
    end

    test 'ItemIdentity.addressed_by? uses the name only for items without an id' do
      with_id = { 'type' => 'notes', 'id' => 'a', 'name' => 'Same' }
      no_id = { 'type' => 'notes', 'name' => 'Same' }

      refute ItemIdentity.addressed_by?(with_id, 'notes', 'b', 'Same')
      assert ItemIdentity.addressed_by?(with_id, 'notes', 'a', 'Other')
      assert ItemIdentity.addressed_by?(no_id, 'notes', 'b', 'Same')
      assert ItemIdentity.addressed_by?(no_id, 'notes', nil, 'Same')
      refute ItemIdentity.addressed_by?(no_id, 'keycard', nil, 'Same')
      refute ItemIdentity.addressed_by?({ 'type' => 'notes' }, 'notes', nil, nil)
    end

    # ---- E22 -----------------------------------------------------------------

    test 'items an NPC has given are not restored to its itemsHeld on reload' do
      game = create_game(irina_items: [BADGE, WORDLIST, EXEC_BADGE])
      [BADGE, WORDLIST].each do |item|
        post inventory_game_url(game), params: { action_type: 'add', item: item, source_npc_id: 'irina' }, as: :json
        assert_response :success, response.body
      end

      assert_equal %w[exec_badge], held_ids(game)
    end

    test 'the give record survives for a give the client did not attribute to an NPC' do
      game = create_game(irina_items: [BADGE, EXEC_BADGE])
      post inventory_game_url(game), params: { action_type: 'add', item: BADGE }, as: :json
      assert_response :success, response.body

      assert_equal %w[exec_badge], held_ids(game)
    end

    test 'an item the player never received stays with the NPC' do
      game = create_game(irina_items: [BADGE, WORDLIST, EXEC_BADGE])
      post inventory_game_url(game), params: { action_type: 'add', item: BADGE, source_npc_id: 'irina' }, as: :json

      assert_equal %w[wordlist exec_badge], held_ids(game)
    end

    test 'a same-named item with a different id on another NPC is not removed' do
      other = { 'id' => 'other', 'npcType' => 'person', 'itemsHeld' => [BADGE.merge('id' => 'cto_badge_two')] }
      game = create_game(irina_items: [BADGE, EXEC_BADGE], extra_npcs: [other])
      post inventory_game_url(game), params: { action_type: 'add', item: BADGE, source_npc_id: 'irina' }, as: :json

      get room_game_url(game, room_id: 'lobby')
      npcs = response.parsed_body['room']['npcs'].index_by { |n| n['id'] }
      assert_equal %w[exec_badge], npcs['irina']['itemsHeld'].map { |i| i['id'] }
      assert_equal %w[cto_badge_two], npcs['other']['itemsHeld'].map { |i| i['id'] }
    end

    test 'filtering the room does not alter the stored scenario or the record' do
      game = create_game(irina_items: [BADGE, EXEC_BADGE])
      post inventory_game_url(game), params: { action_type: 'add', item: BADGE, source_npc_id: 'irina' }, as: :json
      held_ids(game)

      game.reload
      assert_equal %w[cto_badge exec_badge], game.scenario_data.dig('rooms', 'lobby', 'npcs').find { |n| n['id'] == 'irina' }['itemsHeld'].map { |i| i['id'] }
      assert_equal 1, game.player_state['npc_given_items']['irina'].length
    end

    test 'resetting the game clears the give record' do
      game = create_game(irina_items: [BADGE, EXEC_BADGE])
      post inventory_game_url(game), params: { action_type: 'add', item: BADGE, source_npc_id: 'irina' }, as: :json
      game.reload.reset_player_state!

      assert_equal({}, game.reload.player_state['npc_given_items'])
    end

    private

    def held_ids(game)
      get room_game_url(game, room_id: 'lobby')
      assert_response :success
      response.parsed_body['room']['npcs'].find { |n| n['id'] == 'irina' }['itemsHeld'].map { |i| i['id'] }
    end

    def create_game(patricia_items: [NPC_EMAIL], irina_items: [], cabinet_items: [CABINET_EMAIL],
                    encountered: %w[patricia irina], extra_npcs: [])
      scenario = {
        'startRoom' => 'lobby',
        'rooms' => {
          'lobby' => {
            'type' => 'room_office', 'locked' => false, 'connections' => {},
            'objects' => [
              { 'type' => 'safe', 'id' => 'patricia_filing_cabinet', 'name' => 'Filing cabinet',
                'locked' => true, 'lockType' => 'key', 'requires' => 'x', 'contents' => cabinet_items.map(&:deep_dup) }
            ],
            'npcs' => [
              { 'id' => 'patricia', 'npcType' => 'person', 'itemsHeld' => patricia_items.map(&:deep_dup) },
              { 'id' => 'irina', 'npcType' => 'person', 'itemsHeld' => irina_items.map(&:deep_dup) }
            ] + extra_npcs
          }
        }
      }
      state = {
        'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'], 'unlockedObjects' => [], 'inventory' => [],
        'encounteredNPCs' => encountered, 'globalVariables' => {}, 'notes' => [], 'health' => 100,
        'objectivesState' => { 'tasks' => {}, 'aims' => {} }
      }
      Game.create!(mission: @mission, player: @owner, scenario_data: scenario, player_state: state)
    end
  end
end
