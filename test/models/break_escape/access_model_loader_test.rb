require 'test_helper'
require_relative '../../support/access_model_scenario'

module BreakEscape
  # Access model step 1: the loader (Game#prepare_scenario_data!, ACCESS_MODEL_PLAN.md
  # section 3). rfidCard becomes creds.card, an account fills its authored usePayload,
  # profile items get ids, and a second run changes nothing.
  class AccessModelLoaderTest < ActiveSupport::TestCase
    def build(scenario = AccessModelScenario.scenario)
      create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario
      )
    end

    def npc(game, room_id, npc_id)
      game.scenario_data['rooms'][room_id]['npcs'].find { |n| n['id'] == npc_id }
    end

    test 'the loader copies rfidCard into creds.card and keeps rfidCard' do
      game = build
      len = npc(game, 'lobby', 'len')
      assert_equal AccessModelScenario::LEN_CARD, len['creds']['card']
      assert_equal AccessModelScenario::LEN_CARD, len['rfidCard'], 'rfidCard stays for games and code that read it'
      refute len['creds'].key?('username'), 'a card-only NPC gains no account'
    end

    test 'an authored creds.card is not replaced by rfidCard' do
      scenario = AccessModelScenario.scenario
      jake = scenario['rooms']['finance']['npcs'].find { |n| n['id'] == 'jake' }
      jake['rfidCard'] = { 'name' => 'Old badge', 'card_id' => 'OLD', 'rfid_protocol' => 'EM4100' }
      game = build(scenario)
      assert_equal AccessModelScenario::JAKE_CARD, npc(game, 'finance', 'jake')['creds']['card']
    end

    test 'the loader fills an authored usePayload from the account' do
      game = build
      payload = npc(game, 'finance', 'jake')['usePayload']
      assert_equal 'jbrooks', payload['address']
      assert_equal AccessModelScenario::JAKE_PASSWORD, payload['secret']
      assert_equal 'LW-FIN-01', payload['host'], 'other usePayload fields are kept'
    end

    test 'the loader creates no usePayload for an account without one' do
      game = build
      refute npc(game, 'finance', 'dana').key?('usePayload')
    end

    test 'the loader stamps ids on account profile items, nested as room contents' do
      game = build
      contents = game.scenario_data['accountProfiles']['jake_files']['contents']
      assert_equal 'jake_files_content_0', contents[0]['id']
      assert_equal 'jake_files_content_1', contents[1]['id']
      assert_equal 'jake_files_content_1_content_0', contents[1]['contents'][0]['id']
    end

    test 'a second run of the loader changes nothing' do
      game = build
      before = game.scenario_data.deep_dup
      game.prepare_scenario_data!
      assert_equal before, game.scenario_data
      game.save!
      game.reload
      game.prepare_scenario_data!
      assert_equal before, game.scenario_data
    end

    test 'a scenario with only rfidCard NPCs keeps working' do
      scenario = {
        'startRoom' => 'lobby',
        'rooms' => { 'lobby' => { 'type' => 'room_office', 'connections' => {},
                                  'npcs' => [{ 'id' => 'len', 'npcType' => 'person', 'rfidCard' => AccessModelScenario::LEN_CARD.dup }] } }
      }
      game = build(scenario)
      room = game.filtered_room_data('lobby')
      assert_equal AccessModelScenario::LEN_CARD, room['npcs'][0]['rfidCard']
      refute room['npcs'][0].key?('creds')
      assert_equal AccessModelScenario::LEN_CARD, Game.npc_card(npc(game, 'lobby', 'len'))
    end

    test 'a game created with hand-set scenario_data, without the helper, is left untouched' do
      scenario = AccessModelScenario.scenario
      game = Game.create!(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario_data: scenario.deep_dup
      )
      assert_equal scenario, game.reload.scenario_data, 'generate_scenario_data returns at once when scenario_data is set'
      len = npc(game, 'lobby', 'len')
      refute len.key?('creds')
      assert_equal AccessModelScenario::LEN_CARD, Game.npc_card(len), 'server code reads creds.card || rfidCard'
    end

    test 'a game generated from a mission runs the loader once, at creation' do
      mission = Mission.create!(name: 'lab_physical_pentest', display_name: 'Physical pentest', published: true, difficulty_level: 1)
      game = Game.create!(mission: mission, player: break_escape_demo_users(:test_user))
      len = Game.scenario_room_npcs(game.reload.scenario_data).find { |n| n['id'] == 'len' }
      assert len, 'lab_physical_pentest has Len'
      assert_equal len['rfidCard'], len['creds']['card'], 'rfidCard was copied into creds.card'
    end

    test 'account_holder? needs a non-empty username' do
      assert Game.account_holder?('creds' => { 'username' => 'jbrooks', 'password' => 'x' })
      refute Game.account_holder?('creds' => { 'username' => '  ' })
      refute Game.account_holder?('creds' => { 'card' => AccessModelScenario::LEN_CARD })
      refute Game.account_holder?('rfidCard' => AccessModelScenario::LEN_CARD)
    end
  end
end
