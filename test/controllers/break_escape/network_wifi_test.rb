require 'test_helper'
require_relative '../../support/network_model_scenario'

module BreakEscape
  # Networks slice 9.3b, sub-slice W (docs/achitechture/ACCESS_MODEL_SLICE_9_3B_PLAN.md,
  # sections 4.3, 5.3 and 6): joining an in-game Wi-Fi network through an access point. The
  # key is compared on the server; a Wi-Fi foothold reaches its own network only.
  class NetworkWifiTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    NS = NetworkModelScenario
    SSID = 'Harbour-Guest'.freeze
    PSK = 'seabreeze-2025'.freeze
    GUEST_SHARE_NAME = 'Guest-Notice'.freeze
    GUEST_SHARE_TEXT = 'GUEST-WIFI-SHARE-TEXT-4418'.freeze

    # NS.scenario with a guest_wifi network (SSID + PSK), two access points on it in the
    # lobby, an open visitor_wifi network with one access point, and an open share on
    # guest_wifi so a join has something to list.
    def wifi_scenario
      data = NS.scenario
      data['networks']['guest_wifi'] = { 'name' => 'Guest Wi-Fi', 'wifi' => { 'ssid' => SSID, 'psk' => PSK } }
      data['networks']['visitor_wifi'] = { 'name' => 'Visitor Wi-Fi', 'wifi' => { 'ssid' => 'Harbour-Open' } }
      data['resources']['guest_notice'] = {
        'kind' => 'file_share', 'name' => GUEST_SHARE_NAME, 'host' => 'HB-GUEST-01', 'network' => 'guest_wifi',
        'contents' => [{ 'id' => 'guest_note', 'type' => 'text_file', 'name' => 'notice.txt', 'takeable' => true,
                         'text' => GUEST_SHARE_TEXT }]
      }
      data['rooms']['lobby']['objects'] << { 'id' => 'guest_ap', 'type' => 'pc', 'sprite' => 'wifi_ap1',
                                             'name' => 'Guest access point', 'wifiAp' => true, 'network' => 'guest_wifi' }
      data['rooms']['lobby']['objects'] << { 'id' => 'guest_ap2', 'type' => 'pc', 'sprite' => 'wifi_ap1',
                                             'name' => 'Guest access point (lift)', 'wifiAp' => true, 'network' => 'guest_wifi' }
      data['rooms']['lobby']['objects'] << { 'id' => 'open_ap', 'type' => 'pc', 'sprite' => 'wifi_ap1',
                                             'name' => 'Visitor access point', 'wifiAp' => true, 'network' => 'visitor_wifi' }
      data
    end

    def join(ap_id, key = nil)
      params = { ap_id: ap_id }
      params[:key] = key if key
      post game_path('network/join'), params: params, as: :json
      response.parsed_body
    end

    def footholds
      @game.reload.player_state['footholds'] || {}
    end

    test 'the right key joins and grants a foothold on the access point network' do
      build_network_game({}, wifi_scenario)
      body = join('guest_ap', PSK)
      assert_response :success, body.inspect
      assert_equal true, body['success']
      assert_equal 'wifi_guest_wifi', body.dig('foothold', 'id')
      assert_equal 'wifi', body.dig('foothold', 'via')
      assert_equal 'guest_wifi', body.dig('foothold', 'network', 'id')
      assert footholds.key?('wifi_guest_wifi')
      assert_includes @game.reload.player_state['gainedFootholds'], 'guest_ap'
    end

    test 'the foothold lists its own network only and reaches the guest share' do
      build_network_game({}, wifi_scenario)
      join('guest_ap', PSK)
      view = network_view('wifi_guest_wifi')
      entry = view['footholds'].find { |f| f['id'] == 'wifi_guest_wifi' }
      assert entry, view.inspect
      host_ids = entry['hosts'].map { |h| h['id'] }
      assert_includes host_ids, 'guest_notice'
      # Its network only: no office_lan host is listed under the Wi-Fi foothold
      refute_includes host_ids, 'sam_pc'
    end

    test 'a wrong key is refused, is not counted, and nothing changes' do
      build_network_game({}, wifi_scenario)
      body = join('guest_ap', 'not-the-key')
      assert_response :unprocessable_entity
      assert_equal 'wrong_key', body['reason']
      refute footholds.key?('wifi_guest_wifi')
      # A second wrong key is refused the same way (no attempt cap)
      join('guest_ap', 'still-wrong')
      assert_response :unprocessable_entity
      # The right key still joins afterwards
      body = join('guest_ap', PSK)
      assert_response :success
      assert_equal true, body['success']
    end

    test 'an open network joins with no key' do
      build_network_game({}, wifi_scenario)
      body = join('open_ap')
      assert_response :success, body.inspect
      assert_equal 'wifi_visitor_wifi', body.dig('foothold', 'id')
      assert footholds.key?('wifi_visitor_wifi')
    end

    test 'a second access point of a joined network answers already and records its id' do
      build_network_game({}, wifi_scenario)
      join('guest_ap', PSK)
      body = join('guest_ap2', PSK)
      assert_response :success
      assert_equal true, body['already']
      assert_equal 'wifi_guest_wifi', body.dig('foothold', 'id')
      gained = @game.reload.player_state['gainedFootholds']
      assert_includes gained, 'guest_ap'
      assert_includes gained, 'guest_ap2'
      # Still one foothold for the network
      assert_equal 1, footholds.keys.count { |k| k == 'wifi_guest_wifi' }
    end

    test 'the link item carries the access point sprite and a Wi-Fi name' do
      build_network_game({}, wifi_scenario)
      body = join('guest_ap', PSK)
      link = @game.reload.player_state['inventory'].find { |i| i['id'] == 'netlink_wifi_guest_wifi' }
      assert link, 'link item should be in the inventory'
      assert_equal 'wifi_ap1', link['sprite']
      assert_includes link['name'], 'Wi-Fi'
      assert_includes link['observations'], 'Guest Wi-Fi'
      assert_equal false, link['takeable']
    end

    test 'the Wi-Fi foothold and its handle survive a reload' do
      build_network_game({}, wifi_scenario)
      join('guest_ap', PSK)
      # Bootstrap footholds carry the handle look so the client can rebuild it
      fc = @game.reload.footholds_for_client.find { |f| f['id'] == 'wifi_guest_wifi' }
      assert fc, 'foothold should be in the bootstrap list'
      assert_equal 'wifi_ap1', fc['sprite']
      assert_includes fc['observations'], 'Guest Wi-Fi'
    end

    test 'an unknown access point is 404 and a plain object is not one' do
      build_network_game({}, wifi_scenario)
      join('no_such_ap')
      assert_response :not_found
      join('sam_pc', PSK)
      assert_response :not_found
    end

    test 'the Wi-Fi key and SSID never reach the browser' do
      build_network_game({}, wifi_scenario)
      # Bootstrap: the networks block is deleted whole, so no SSID or key ships
      get game_path('scenario'), as: :json
      assert_response :success
      refute_includes response.body, PSK
      refute_includes response.body, SSID
      # The join answer never echoes the key
      body = join('guest_ap', PSK)
      refute_includes response.body, PSK
      refute_includes response.body, SSID
      assert body['success']
      # The view names the network but not the SSID or key
      network_view('wifi_guest_wifi')
      refute_includes response.body, PSK
      refute_includes response.body, SSID
    end

    # Review R1 E1 (plan 5.3): an unlock_object task on an access point is met once the player
    # has joined there, a second access point of a joined network included, and not before.
    def wifi_task_scenario
      data = wifi_scenario
      data['objectives'][0]['tasks'] += [
        { 'taskId' => 'join_guest', 'title' => 'Join the guest Wi-Fi', 'type' => 'unlock_object',
          'targetObject' => 'guest_ap', 'status' => 'active' },
        { 'taskId' => 'join_lift', 'title' => 'Join at the lift', 'type' => 'unlock_object',
          'targetObject' => 'guest_ap2', 'status' => 'active' }
      ]
      data
    end

    def complete(task_id)
      post complete_task_game_url(@game, task_id: task_id), as: :json
      response.parsed_body
    end

    test 'an unlock_object task on an access point is refused before a join and met after it' do
      build_network_game({}, wifi_task_scenario)
      body = complete('join_guest')
      assert_equal false, body['success'], body.inspect
      assert_equal 'Not joined here', body['error']
      join('guest_ap', PSK)
      body = complete('join_guest')
      assert_equal true, body['success'], body.inspect
      # The second access point is not met by the first join alone
      body = complete('join_lift')
      assert_equal false, body['success'], body.inspect
      assert_equal 'Not joined here', body['error']
    end

    test 'an already join at a second access point meets the task on that access point' do
      build_network_game({}, wifi_task_scenario)
      join('guest_ap', PSK)
      body = join('guest_ap2')
      assert_equal true, body['already'], body.inspect
      body = complete('join_lift')
      assert_equal true, body['success'], body.inspect
      assert_equal 'completed', @game.reload.player_state.dig('objectivesState', 'tasks', 'join_lift', 'status')
    end

    test 'an unlock on an access point does not stand in for the join' do
      build_network_game({ 'unlockedObjects' => ['guest_ap'] }, wifi_task_scenario)
      body = complete('join_guest')
      assert_equal false, body['success'], body.inspect
    end
  end
end
