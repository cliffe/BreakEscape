require 'test_helper'

# A headless email record (social.characters.*.emailRecord, 00 S8) is never in a
# room, so walking in never marks it encountered. A #give_item from it only fires
# from its own on_email ink, which the mail runner (P1-J) runs on delivery, so the
# server auto-encounters the record in the give path. A room NPC the player has not
# met is still refused. Driven over HTTP.
module BreakEscape
  class HeadlessGiveTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    KIT = { 'type' => 'keycard', 'id' => 'ledger_key', 'name' => 'Ledger key', 'takeable' => true }.freeze
    ROOM_ITEM = { 'type' => 'keycard', 'id' => 'rory_badge', 'name' => 'Rory badge', 'takeable' => true }.freeze

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @owner   = break_escape_demo_users(:test_user)
    end

    test 'a give from a headless email record is auto-encountered and succeeds' do
      game = create_game
      assert_not_includes game.player_state['encounteredNPCs'], 'quill_mail'

      post inventory_game_url(game), params: { action_type: 'add', item: KIT, source_npc_id: 'quill_mail' }, as: :json

      assert_response :success, response.body
      game.reload
      assert_includes game.player_state['inventory'].map { |i| i['id'] }, 'ledger_key'
      assert_includes game.player_state['encounteredNPCs'], 'quill_mail',
                      'the headless record was encountered by the give path'
    end

    test 'a room NPC the player has not met is still refused' do
      game = create_game
      post inventory_game_url(game), params: { action_type: 'add', item: ROOM_ITEM, source_npc_id: 'rory' }, as: :json

      assert_response :unprocessable_entity
      assert_match(/NPC not encountered/, response.parsed_body['message'])
    end

    private

    def create_game
      scenario = {
        'startRoom' => 'lobby',
        'rooms' => {
          'lobby' => {
            'type' => 'room_office', 'locked' => false, 'connections' => {}, 'objects' => [],
            'npcs' => [
              { 'id' => 'rory', 'npcType' => 'person', 'itemsHeld' => [ROOM_ITEM.deep_dup] }
            ]
          }
        },
        'social' => {
          'characters' => {
            'quill' => {
              'displayName' => 'Morgan Quill',
              'channels' => { 'email' => 'quill_mail' },
              'emailRecord' => {
                'storyPath' => 'scenarios/x/quill_mail.ink',
                'itemsHeld' => [KIT.deep_dup]
              }
            }
          }
        }
      }
      state = {
        'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'], 'unlockedObjects' => [], 'inventory' => [],
        'encounteredNPCs' => [], 'globalVariables' => {}, 'notes' => [], 'health' => 100,
        'objectivesState' => { 'tasks' => {}, 'aims' => {} }
      }
      Game.create!(mission: @mission, player: @owner, scenario_data: scenario, player_state: state)
    end
  end
end
