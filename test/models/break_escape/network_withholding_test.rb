require 'test_helper'
require_relative '../../support/network_model_scenario'

module BreakEscape
  # Networks slice 9.3a, step 2 (docs/achitechture/ACCESS_MODEL_SLICE_9_3_PLAN.md,
  # section 6): what the bootstrap and room data never carry, and what a jack and a
  # sign-in host do carry.
  class NetworkWithholdingTest < ActiveSupport::TestCase
    ALL_ROOMS = %w[lobby comms_room server_room workshop desk_room finance_office kiosk_room store].freeze

    def build(player_state = {}, scenario = NetworkModelScenario.scenario)
      create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: { 'unlockedRooms' => ALL_ROOMS.dup }.merge(player_state)
      )
    end

    def every_hash(node, &block)
      case node
      when Hash
        yield node
        node.each_value { |value| every_hash(value, &block) }
      when Array
        node.each { |value| every_hash(value, &block) }
      end
    end

    test 'the bootstrap deletes networks, networkLinks and resources and keeps policies with remote' do
      scenario = NetworkModelScenario.scenario
      scenario['networkLinks'] = [%w[office_lan workshop_lan]]
      filtered = build({}, scenario).filtered_scenario_for_bootstrap
      %w[networks networkLinks resources].each { |key| refute filtered.key?(key), "the bootstrap ships #{key}" }
      assert_equal 'blocked', filtered['policies']['hardened']['remote']
      every_hash(filtered['rooms']) { |hash| refute hash.key?('network'), 'a bootstrap room carries network' }
    end

    test 'room data carries no network, linkName or linkStoreIn on the room or any object' do
      game = build
      ALL_ROOMS.each do |room_id|
        room = game.filtered_room_data(room_id)
        refute room.key?('network'), "#{room_id} ships its network"
        every_hash(room['objects']) do |obj|
          %w[network linkName linkStoreIn].each { |field| refute obj.key?(field), "#{room_id}: #{obj['id']} ships #{field}" }
        end
      end
    end

    test 'a jack carries its own fields and jackPlanted false with no foothold' do
      port = build.filtered_room_data('comms_room')['objects'].find { |o| o['id'] == 'comms_port' }
      assert_equal true, port['networkJack']
      assert_equal 'Plug the drop box into this port?', port['jackConfirm']
      assert_equal 'pi_cluster1', port['plantedSprite']
      assert_equal false, port['jackPlanted']
    end

    test 'jackPlanted is true while the server holds a foothold at that jack only' do
      game = build('footholds' => { 'jack_comms_port' => { 'via' => 'jack', 'network' => 'office_lan',
                                                           'source' => 'comms_port', 'device' => {}, 'seq' => 1 } })
      assert_equal true, game.filtered_room_data('comms_room')['objects'].find { |o| o['id'] == 'comms_port' }['jackPlanted']
      assert_equal false, game.filtered_room_data('workshop')['objects'].find { |o| o['id'] == 'bench_port' }['jackPlanted']
    end

    test 'a sign-in host keeps host and headless, and a headless host gets no account tiles' do
      game = build
      door = game.filtered_room_data('store')['objects'].find { |o| o['id'] == 'door_box' }
      assert_equal 'HB-DOOR-01', door['host']
      assert_equal true, door['headless']
      refute door.key?('loginAccounts'), 'a headless host shows no account tiles'
      refute door.key?('contents')

      sam_pc = game.filtered_room_data('desk_room')['objects'].find { |o| o['id'] == 'sam_pc' }
      assert_equal 'HB-DESK-01', sam_pc['host']
      assert sam_pc['loginAccounts'].any?, 'a sign-in PC with a screen keeps its tiles'
    end

    test 'room data and the bootstrap carry no password and no exposed string' do
      game = build
      json = game.filtered_scenario_for_bootstrap.to_json
      ALL_ROOMS.each { |id| json += game.filtered_room_data(id).to_json }
      (NetworkModelScenario::PASSWORDS + NetworkModelScenario::EXPOSED_STRINGS).each { |text| refute_includes json, text }
    end
  end
end
