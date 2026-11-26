require 'test_helper'
require_relative '../../support/network_model_scenario'

module BreakEscape
  # A port hidden until its revealOnGlobal is set is refused a plug-in exactly as an
  # unreachable one is: same status and body, no state change, no log row.
  class NetworkPlantHiddenPortTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    def hidden_scenario
      data = NetworkModelScenario.scenario.deep_dup
      data['rooms']['comms_room']['objects'].find { |o| o['id'] == 'comms_port' }['revealOnGlobal'] = 'port_revealed'
      data
    end

    def snapshot
      @game.reload.player_state.slice('inventory', 'networkFootholds', 'opsLog', 'logRows').to_json
    end

    def refused_plant(state = {}, scenario = nil)
      build_network_game(state, scenario) if scenario
      build_network_game(state) unless scenario
      take_drop_box
      before = snapshot
      body = plant('comms_port')
      [response.status, body, before == snapshot]
    end

    test 'a hidden port is refused with the unreachable answer, changing nothing' do
      hidden = refused_plant({}, hidden_scenario)
      refute_equal 200, hidden[0]
      assert hidden[2], 'state changed'

      # The same refusal an unreachable port gives: lock the room.
      locked = NetworkModelScenario.scenario.deep_dup
      locked['rooms']['comms_room'].merge!('locked' => true, 'lockType' => 'key', 'requires' => 'x')
      unreach = refused_plant({ 'unlockedRooms' => NetworkRequests::OPEN_ROOMS - ['comms_room'] }, locked)
      assert_equal unreach[0], hidden[0]
      assert_equal unreach[1], hidden[1]
      assert_equal 'unreachable', hidden[1]['reason']
    end

    test 'the same port plants once its global is true' do
      build_network_game({ 'globalVariables' => { 'port_revealed' => true } }, hidden_scenario)
      take_drop_box
      plant('comms_port')
      assert_response :success
    end
  end
end
