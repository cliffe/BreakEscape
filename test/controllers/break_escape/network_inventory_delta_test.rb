require 'test_helper'
require_relative '../../support/network_model_scenario'

module BreakEscape
  # SYNC_DELTAS_PLAN P2 (section 4.6): a network route answers the added/removed inventory
  # delta only to a request that opts in with delta:true; an old tab that omits it still gets
  # the whole-inventory echo for one release. The server never echoes the whole inventory in a
  # delta answer, and item_for_answer strips saved_cards from every item it carries.
  class NetworkInventoryDeltaTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    NS = NetworkModelScenario

    def state
      @game.reload.player_state
    end

    def plant_delta(jack_id, device_id = nil)
      params = { jack_id: jack_id, delta: true }
      params[:device_id] = device_id if device_id
      post game_path('network/plant'), params: params, as: :json
      response.parsed_body
    end

    def unplug_delta(jack_id)
      post game_path('network/unplug'), params: { jack_id: jack_id, delta: true }, as: :json
      response.parsed_body
    end

    test 'a plant with delta:true answers added/removed and no inventory echo' do
      build_network_game
      take_drop_box
      body = plant_delta('comms_port')
      assert_response :success, body.inspect
      assert_nil body['inventory']
      assert_equal %w[netlink_jack_comms_port], body['added'].map { |i| i['id'] }
      assert_equal %w[kit_dropbox], body['removed']
    end

    test 'an already plant with delta:true answers the same delta as the first success' do
      build_network_game
      take_drop_box
      first = plant_delta('comms_port')
      again = plant_delta('comms_port')
      assert_equal true, again['already']
      assert_equal first['added'].map { |i| i['id'] }, again['added'].map { |i| i['id'] }
      assert_equal first['removed'], again['removed']
    end

    test 'an unplug with delta:true names the link removed and the device added back' do
      build_network_game
      take_drop_box
      plant_delta('comms_port')
      body = unplug_delta('comms_port')
      assert_response :success, body.inspect
      assert_nil body['inventory']
      assert_equal %w[kit_dropbox], body['added'].map { |i| i['id'] }
      assert_equal %w[netlink_jack_comms_port], body['removed']
    end

    test 'a request without delta still gets the whole-inventory echo (one-release compat)' do
      build_network_game
      take_drop_box
      body = plant('comms_port')
      assert_response :success
      assert body['inventory'].is_a?(Array)
      assert_nil body['added']
      assert_nil body['removed']
    end

    test 'no item in a network delta answer carries saved_cards' do
      build_network_game
      take_drop_box
      # Give the device a saved_cards list, so the unplug add path would echo it if not stripped.
      @game.reload
      @game.player_state['inventory'].find { |i| i['id'] == 'kit_dropbox' }['saved_cards'] = [{ 'card_id' => 'x' }]
      @game.save!
      plant_delta('comms_port')
      body = unplug_delta('comms_port')
      device = body['added'].find { |i| i['id'] == 'kit_dropbox' }
      assert device, body.inspect
      refute device.key?('saved_cards')
    end
  end
end
