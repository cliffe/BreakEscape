require 'test_helper'
require_relative '../../support/access_model_scenario'

module BreakEscape
  # Access model step 2: what the browser never receives (ACCESS_MODEL_PLAN.md 5.6).
  class AccessModelWithholdingTest < ActiveSupport::TestCase
    def build(scenario: AccessModelScenario.scenario, player_state: {})
      create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: { 'unlockedRooms' => %w[lobby finance] }.merge(player_state)
      )
    end

    def earned(entries)
      { 'globalVariables' => { 'se_captures' => entries } }
    end

    test 'room NPCs lose creds, role, awareness, habits and workarounds' do
      room = build.filtered_room_data('finance')
      room['npcs'].each do |npc|
        %w[creds role awareness habits workarounds].each do |key|
          refute npc.key?(key), "#{npc['id']} must not carry #{key}"
        end
      end
      AccessModelScenario::PASSWORDS.each { |pw| refute_includes room.to_json, pw }
    end

    # Slice 9.1 step 1: awareness, habits and the top-level roles never reach the browser;
    # the filled screenHabit does, and no PC gains a lock field.
    def habits_scenario
      data = AccessModelScenario.scenario
      data['roles'] = { 'finance' => { 'awareness' => 'low' }, 'staff' => { 'awareness' => 'medium' } }
      dana = data['rooms']['finance']['npcs'].find { |n| n['id'] == 'dana' }
      dana['habits'] = { 'password' => 'strong' }
      jake = data['rooms']['finance']['npcs'].find { |n| n['id'] == 'jake' }
      jake['awareness'] = 'low'
      data
    end

    test 'awareness and habits are in no room data (a door unlock uses the same filter) or added NPC; no roles in the bootstrap' do
      game = build(scenario: habits_scenario)
      stored = game.scenario_data['rooms']['finance']['npcs']
      assert stored.all? { |n| n.key?('habits') }, 'the saved data keeps the expanded habits'

      room = game.filtered_room_data('finance')
      room['npcs'].each do |npc|
        refute npc.key?('awareness'), npc['id']
        refute npc.key?('habits'), npc['id']
      end
      jake = room['npcs'].find { |n| n['id'] == 'jake' }
      assert_equal({ 'lockChance' => 0 }, jake['screenHabit'], 'the filled screenHabit reaches the browser')
      room['objects'].each do |obj|
        refute obj.key?('lockChance'), obj['id']
        refute obj.key?('locksScreenOnLeave'), obj['id']
      end

      assert game.move_npc_to_room!('jake', 'finance', 'lobby')
      moved = game.filtered_room_data('lobby')['npcs'].find { |n| n['id'] == 'jake' }
      refute moved.key?('awareness')
      refute moved.key?('habits')

      filtered = game.filtered_scenario_for_bootstrap
      refute filtered.key?('roles')
      refute_includes filtered.to_json, '"awareness"'
      refute_includes filtered.to_json, '"habits"'
    end

    test 'an account holder keeps usePayload address and host but not its secret, nor any addCapture secret' do
      scenario = AccessModelScenario.scenario
      jake = scenario['rooms']['finance']['npcs'].find { |n| n['id'] == 'jake' }
      # Authored against the rules (the validator errors on it): the filter strips it anyway.
      jake['eventMappings'][0]['addCapture']['secret'] = AccessModelScenario::JAKE_PASSWORD
      room = build(scenario: scenario).filtered_room_data('finance')
      jake = room['npcs'].find { |n| n['id'] == 'jake' }
      assert_equal({ 'host' => 'LW-FIN-01', 'address' => 'jbrooks' }, jake['usePayload'])
      refute jake['eventMappings'][0]['addCapture'].key?('secret')
      assert_equal 'jake', jake['eventMappings'][0]['addCapture']['targetId']
    end

    test 'an NPC with creds.card gets rfidCard equal to the card as authored' do
      room = build.filtered_room_data('finance')
      jake = room['npcs'].find { |n| n['id'] == 'jake' }
      assert_equal AccessModelScenario::JAKE_CARD, jake['rfidCard']
    end

    test 'a card-only NPC keeps its full rfidCard, protocol fields included' do
      room = build.filtered_room_data('lobby')
      len = room['npcs'].find { |n| n['id'] == 'len' }
      assert_equal AccessModelScenario::LEN_CARD, len['rfidCard']
      refute len.key?('creds')
    end

    test 'an NPC from scenario data without creds keeps its rfidCard and usePayload secret' do
      # A game created before the loader: Game.create! with hand-set data skips it.
      scenario = {
        'startRoom' => 'lobby',
        'rooms' => { 'lobby' => { 'type' => 'room_office', 'connections' => {},
                                  'npcs' => [{ 'id' => 'len', 'npcType' => 'person', 'rfidCard' => AccessModelScenario::LEN_CARD.dup,
                                               'usePayload' => { 'address' => 'l.okafor', 'secret' => '4471' } }] } }
      }
      game = Game.create!(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                          scenario_data: scenario)
      len = game.filtered_room_data('lobby')['npcs'][0]
      assert_equal AccessModelScenario::LEN_CARD, len['rfidCard']
      assert_equal '4471', len['usePayload']['secret'], 'not an account holder: today\'s behaviour'
    end

    test 'an NPC added to a room by update_room is withheld, and player_state keeps the full record' do
      game = build
      assert game.move_npc_to_room!('jake', 'finance', 'lobby')
      room = game.filtered_room_data('lobby')
      jake = room['npcs'].find { |n| n['id'] == 'jake' }
      assert jake, 'the moved NPC is in the lobby'
      refute jake.key?('creds')
      refute jake.key?('role')
      refute_includes room.to_json, AccessModelScenario::JAKE_PASSWORD

      game.save!
      stored = game.reload.player_state['room_states']['lobby']['npcs_added'].find { |n| n['id'] == 'jake' }
      assert_equal AccessModelScenario::JAKE_PASSWORD, stored['creds']['password'], 'the filter works on a copy'
    end

    test 'a sign-in PC loses its contents unconditionally and is marked hasContents' do
      room = build.filtered_room_data('finance')
      pc = room['objects'].find { |o| o['id'] == 'jake_pc' }
      refute pc.key?('contents')
      assert_equal true, pc['hasContents']
      assert_equal({ 'roles' => ['staff'] }, pc['access'])
      refute_includes room.to_json, AccessModelScenario::PC_LOCAL_MARKER

      # Even when recorded as unlocked (the gate is the session, not unlockedObjects).
      game = build(player_state: { 'unlockedObjects' => ['jake_pc'] })
      pc = game.filtered_room_data('finance')['objects'].find { |o| o['id'] == 'jake_pc' }
      refute pc.key?('contents')
      assert_equal true, pc['hasContents']
    end

    test 'an rfid object keeps access and acceptsUIDOnly' do
      cabinet = build.filtered_room_data('finance')['objects'].find { |o| o['id'] == 'finance_cabinet' }
      assert_equal({ 'roles' => ['finance'] }, cabinet['access'])
      assert_equal true, cabinet['acceptsUIDOnly']
    end

    test 'the bootstrap drops accountProfiles, keeps policies and ships access in the room allow list' do
      scenario = AccessModelScenario.scenario
      scenario['rooms']['finance'].merge!('lockType' => 'rfid', 'requires' => ['VISITOR-07'],
                                          'access' => { 'roles' => ['finance'] }, 'acceptsUIDOnly' => false)
      filtered = build(scenario: scenario).filtered_scenario_for_bootstrap
      refute filtered.key?('accountProfiles')
      refute_includes filtered.to_json, AccessModelScenario::PROFILE_MARKER
      assert_equal scenario['policies'], filtered['policies']
      assert_equal 'corp_default', filtered['defaultPolicy']
      assert_equal({ 'roles' => ['finance'] }, filtered['rooms']['finance']['access'])
      assert_equal false, filtered['rooms']['finance']['acceptsUIDOnly']
      AccessModelScenario::PASSWORDS.each { |pw| refute_includes filtered.to_json, pw }
    end

    test 'capture_secrets serves an account holder with a capture route in a scenario with no landingPages' do
      game = build(player_state: earned(
        'jake' => { 'targetId' => 'jake', 'kind' => 'credential', 'address' => 'jbrooks', 'at' => 1 }
      ))
      assert_equal({ 'jake' => AccessModelScenario::JAKE_PASSWORD }, game.capture_secrets_for_client)
    end

    test 'capture_secrets matches the username trimmed and case-insensitively' do
      game = build(player_state: earned(
        'jake' => { 'targetId' => 'jake', 'kind' => 'credential', 'address' => ' JBrooks ', 'at' => 1 }
      ))
      assert_equal({ 'jake' => AccessModelScenario::JAKE_PASSWORD }, game.capture_secrets_for_client)
    end

    test 'a forged entry for an account holder with no capture route gets nothing' do
      game = build(player_state: earned(
        'dana' => { 'targetId' => 'dana', 'kind' => 'credential', 'address' => 'dwhite', 'at' => 1 }
      ))
      assert_equal({}, game.capture_secrets_for_client)
    end

    test 'the account-holder pass needs revealSecret' do
      game = build(scenario: AccessModelScenario.scenario(reveal: false), player_state: earned(
        'jake' => { 'targetId' => 'jake', 'kind' => 'credential', 'address' => 'jbrooks', 'at' => 1 }
      ))
      assert_equal({}, game.capture_secrets_for_client)
    end

    test 'the landing-page single-secret fallback never answers with an account password, and an account match beats it' do
      scenario = AccessModelScenario.scenario
      scenario['social']['landingPages'] = [
        { 'id' => 'portal', 'capture' => { 'address' => 's.lord@example', 'secret' => 'Landing!1' } }
      ]
      scenario['social']['phishTargets'] = [{ 'id' => 'other' }]
      game = build(scenario: scenario, player_state: earned(
        'jake' => { 'targetId' => 'jake', 'kind' => 'credential', 'address' => 'jbrooks', 'at' => 1 },
        'other' => { 'targetId' => 'other', 'kind' => 'credential', 'address' => 'nobody', 'at' => 2 }
      ))
      assert_equal({ 'jake' => AccessModelScenario::JAKE_PASSWORD, 'other' => 'Landing!1' }, game.capture_secrets_for_client)
    end
  end
end
