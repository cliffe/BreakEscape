require 'test_helper'

# Headless NPC records (social build item 0.5; data contract 00 S8): a
# social.characters entry with an emailRecord is an NPC record with no room, found
# by every lookup that used to search only rooms.*.npcs. A scenario with no
# `social` key gives exactly the room NPCs.
module BreakEscape
  module ScenarioNpcRecordsFixtures
    PAYSLIP = { 'type' => 'notes', 'id' => 'pierce_payslip', 'name' => 'Payslip', 'takeable' => true }.freeze

    def room_only_scenario
      {
        'startRoom' => 'lobby',
        'rooms' => {
          'lobby' => { 'objects' => [], 'npcs' => [
            { 'id' => 'guard', 'displayName' => 'Guard', 'npcType' => 'person' },
            { 'id' => 'handler', 'displayName' => 'Handler', 'npcType' => 'phone', 'phoneId' => 'player_phone' }
          ] },
          'office' => { 'objects' => [], 'npcs' => [{ 'id' => 'clerk', 'displayName' => 'Clerk', 'npcType' => 'person' }] },
          'empty' => { 'objects' => [] }
        }
      }
    end

    def social_scenario
      room_only_scenario.merge(
        'social' => { 'characters' => {
          'pierce' => {
            'displayName' => 'Melanie Pierce',
            'channels' => { 'email' => 'pierce_mail' },
            'emailRecord' => { 'storyPath' => 'scenarios/ink/test-npc.json', 'avatar' => 'pierce', 'itemsHeld' => [PAYSLIP] }
          },
          'lord' => {
            'displayName' => 'Sofia Lord',
            'channels' => { 'email' => 'lord_mail' },
            'emailRecord' => { 'storyPath' => 'scenarios/ink/test-npc.json', 'displayName' => 'Sofia Lord (mail)' }
          },
          # No emailRecord: no headless record
          'dev' => { 'displayName' => 'Dev', 'channels' => { 'person' => 'clerk' } },
          # emailRecord without channels.email: no id, so no record
          'nameless' => { 'emailRecord' => { 'storyPath' => 'scenarios/ink/test-npc.json' } },
          # Reuses a room NPC's id: the room NPC wins
          'clash' => { 'channels' => { 'email' => 'guard' }, 'emailRecord' => { 'storyPath' => 'x.json', 'displayName' => 'Not the guard' } }
        } }
      )
    end
  end

  class ScenarioNpcRecordsTest < ActiveSupport::TestCase
    include ScenarioNpcRecordsFixtures

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @player = break_escape_demo_users(:test_user)
    end

    def create_game(scenario)
      Game.create!(mission: @mission, player: @player, scenario_data: scenario)
    end

    test 'with no social key the records are exactly the room NPCs, in room order' do
      game = create_game(room_only_scenario)

      assert_equal %w[guard handler clerk], game.scenario_npc_records.map { |n| n['id'] }
      assert_equal [], Game.headless_npc_records(room_only_scenario)
      assert_equal 'Guard', game.find_npc_in_scenario('guard')['displayName']
      assert_nil game.find_npc_in_scenario('pierce_mail')
      assert_equal Set.new(%w[guard handler clerk]), game.scenario_npc_ids
    end

    test 'headless records follow the room NPCs and carry the contract fields' do
      game = create_game(social_scenario)

      assert_equal %w[guard handler clerk pierce_mail lord_mail], game.scenario_npc_records.map { |n| n['id'] }

      pierce = game.find_npc_in_scenario('pierce_mail')
      assert_equal 'Melanie Pierce', pierce['displayName'], 'falls back to the character displayName'
      assert_equal 'phone', pierce['npcType']
      assert_equal 'mail_only', pierce['phoneId']
      assert_equal 'pierce', pierce['avatar']
      assert_equal 'scenarios/ink/test-npc.json', pierce['storyPath']
      assert_equal ['pierce_payslip'], pierce['itemsHeld'].map { |i| i['id'] }

      lord = game.find_npc_in_scenario('lord_mail')
      assert_equal 'Sofia Lord (mail)', lord['displayName']
      assert_equal [], lord['itemsHeld']
    end

    test 'a room NPC keeps its id over a headless record that reuses it' do
      game = create_game(social_scenario)

      assert_equal 'Guard', game.find_npc_in_scenario('guard')['displayName']
      assert_equal 1, game.scenario_npc_records.count { |n| n['id'] == 'guard' }
    end

    test 'scenario_npc_ids includes headless records, with and without scenario_data loaded' do
      game = create_game(social_scenario)
      expected = Set.new(%w[guard handler clerk pierce_mail lord_mail])

      assert_equal expected, game.scenario_npc_ids
      # sync_state's narrow load leaves scenario_data out and reads the ids in SQL
      narrow = Game.select(:id, :player_state).find(game.id)
      refute narrow.has_attribute?(:scenario_data)
      assert_equal expected, narrow.scenario_npc_ids
    end

    test 'the narrow scenario_npc_ids is unchanged for a scenario with no social key' do
      game = create_game(room_only_scenario)
      narrow = Game.select(:id, :player_state).find(game.id)

      assert_equal Set.new(%w[guard handler clerk]), narrow.scenario_npc_ids
    end

    test 'hostility sent for a headless record is kept' do
      game = create_game(social_scenario)
      game.merge_npc_hostility!('pierce_mail' => { 'hostile' => false, 'ko' => false }, 'nobody' => { 'hostile' => true, 'ko' => false })

      assert_equal ['pierce_mail'], game.player_state['npcHostility'].keys
    end

    test 'malformed social data gives no records' do
      [nil, [], 'x', { 'characters' => [] }, { 'characters' => { 'a' => 'b' } },
       { 'characters' => { 'a' => { 'channels' => { 'email' => 5 }, 'emailRecord' => {} } } },
       { 'characters' => { 'a' => { 'channels' => { 'email' => 'a_mail' }, 'emailRecord' => 'ink/a.json' } } }].each do |social|
        assert_equal [], Game.headless_npc_records(room_only_scenario.merge('social' => social)), social.inspect
      end
    end
  end

  # The NPC item validation behind #give_item: a headless record gives from no room.
  class ScenarioNpcRecordsGiveTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include ScenarioNpcRecordsFixtures

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @player = break_escape_demo_users(:test_user)
    end

    def create_game(encountered:)
      game = Game.create!(mission: @mission, player: @player, scenario_data: social_scenario)
      game.player_state['encounteredNPCs'] = encountered
      game.save!
      game
    end

    test 'a headless record the player has met can give its itemsHeld' do
      game = create_game(encountered: ['pierce_mail'])
      post inventory_game_url(game), params: { action_type: 'add', item: PAYSLIP, source_npc_id: 'pierce_mail' }, as: :json

      assert_response :success, response.body
      assert_equal ['pierce_payslip'], game.reload.player_state['inventory'].map { |i| i['id'] }
      assert_equal [{ 'type' => 'notes', 'id' => 'pierce_payslip', 'name' => 'Payslip' }],
                   game.player_state.dig('npc_given_items', 'pierce_mail')
    end

    test 'a headless record the player has not met cannot give' do
      game = create_game(encountered: [])
      post inventory_game_url(game), params: { action_type: 'add', item: PAYSLIP, source_npc_id: 'pierce_mail' }, as: :json

      assert_response :unprocessable_entity
      assert_match(/NPC not encountered/, response.parsed_body['message'])
    end

    test 'a headless record cannot give an item it does not hold' do
      game = create_game(encountered: ['lord_mail'])
      post inventory_game_url(game), params: { action_type: 'add', item: PAYSLIP, source_npc_id: 'lord_mail' }, as: :json

      assert_response :unprocessable_entity
    end
  end
end
