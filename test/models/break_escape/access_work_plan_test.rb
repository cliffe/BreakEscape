require 'test_helper'
require_relative '../../support/access_work_scenario'
require_relative '../../support/network_model_scenario'

module BreakEscape
  # Access model slice 9.2 step A-2 (ACCESS_MODEL_SLICE_9_2_PLAN.md 5.2 and 9.2): the plan the
  # server attaches to a room NPC as `work`, and what room data and the bootstrap leave out.
  class AccessWorkPlanTest < ActiveSupport::TestCase
    def build(scenario: AccessWorkScenario.scenario, player_state: {})
      create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: { 'unlockedRooms' => %w[lobby office] }.merge(player_state)
      )
    end

    def npcs(game, room = 'office')
      game.filtered_room_data(room)['npcs'].to_h { |n| [n['id'], n] }
    end

    def every_hash(node, &block)
      case node
      when Hash
        yield node
        node.each_value { |v| every_hash(v, &block) }
      when Array
        node.each { |v| every_hash(v, &block) }
      end
    end

    test "a room NPC's work holds its resolved list with admitted right" do
      list = npcs(build)
      assert_equal({ 'breakDrain' => 10.0,
                     'needs' => [{ 'id' => 'finance_share', 'kind' => 'file_share', 'admitted' => true, 'downIf' => 'finance_share_down' },
                                 { 'id' => 'email', 'kind' => 'email', 'admitted' => true }] }, list['dana']['work'])
      kai = list['kai']['work']['needs'].to_h { |n| [n['id'], n] }
      assert_equal false, kai['finance_share']['admitted'], 'a refused one'
      assert_equal true, kai['email']['admitted'], 'no access list: admitted'
      omar = list['omar']['work']['needs'].find { |n| n['id'] == 'printer' }
      assert_equal 'office_printer', omar['object']
    end

    test 'no name and no network key anywhere in a plan; no routes without networks' do
      list = npcs(build)
      list.each_value do |npc|
        every_hash(npc['work']) do |h|
          %w[name network host contents].each { |k| refute h.key?(k), "#{npc['id']}: #{k}" }
          refute h.key?('routes'), "#{npc['id']}: routes without networks"
        end
      end
      json = build.filtered_room_data('office').to_json
      AccessWorkScenario::RESOURCE_NAMES.each { |name| refute_includes json, name }
    end

    test 'routes with networks: [[]] on the station network or none, [] on another' do
      data = AccessWorkScenario.scenario
      data['networks'] = { 'corp' => { 'name' => 'Corp LAN' }, 'fin' => { 'name' => 'Finance LAN' } }
      data['rooms']['office']['network'] = 'corp'
      data['resources']['email']['network'] = 'corp'
      data['resources']['finance_share']['network'] = 'fin'
      needs = npcs(build(scenario: data))['dana']['work']['needs'].to_h { |n| [n['id'], n['routes']] }
      assert_equal [], needs['finance_share']
      assert_equal [[]], needs['email']
      data['resources']['email'].delete('network')
      needs = npcs(build(scenario: data))['dana']['work']['needs'].to_h { |n| [n['id'], n['routes']] }
      assert_equal [[]], needs['email'], 'a resource on no network'
    end

    test 'workNeeds, frustration, workarounds, feed and role are gone from room data' do
      list = npcs(build)
      list.each_value do |npc|
        %w[workNeeds frustration workarounds feed role creds].each { |k| refute npc.key?(k), "#{npc['id']} ships #{k}" }
      end
      json = build.filtered_room_data('office').to_json
      refute_includes json, AccessWorkScenario::POST_TEXT
      refute_includes json, '"borrow_session"'
      AccessWorkScenario::PASSWORDS.each { |pw| refute_includes json, pw }
    end

    test 'no plan for an account holder with no work need' do
      temp = npcs(build, 'lobby')['temp_user']
      refute temp.key?('work')
    end

    test 'an authored work key on an NPC with no plan is dropped' do
      data = AccessWorkScenario.scenario
      data['rooms']['lobby']['npcs'][0]['work'] = { 'needs' => [{ 'id' => 'fake' }] }
      refute npcs(build(scenario: data), 'lobby')['temp_user'].key?('work')
    end

    test 'an NPC added to a room by update_room is treated the same' do
      game = build
      assert game.move_npc_to_room!('dana', 'office', 'lobby')
      dana = npcs(game, 'lobby')['dana']
      assert dana['work'], 'the moved NPC has its plan'
      %w[workNeeds frustration workarounds feed role].each { |k| refute dana.key?(k), k }
    end

    test 'GET /scenario carries no resources or roles' do
      filtered = build.filtered_scenario_for_bootstrap
      refute filtered.key?('resources')
      refute filtered.key?('roles')
      json = filtered.to_json
      AccessWorkScenario::RESOURCE_NAMES.each { |name| refute_includes json, name }
    end

    test 'npcFrustration is a player_state key, empty on a new game and dropped by a reset' do
      game = build
      assert_equal({}, game.player_state['npcFrustration'])
      game.player_state['npcFrustration'] = { 'dana' => { 'level' => 20 } }
      game.save!
      game.reset_player_state!
      assert_equal({}, game.reload.player_state['npcFrustration'])
    end
  end
end
