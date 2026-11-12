require 'test_helper'
require_relative '../../support/network_model_scenario'

module BreakEscape
  # Unlock gaps code review R2 M2: the network routes (plant, unplug, join, implant) answer
  # with the inventory. A locked start item (a cryptex, a padlocked case) must not ship its
  # answer through any of them, nor through the bootstrap or an inventory reply, and an
  # inventory stored before start items were filtered must be filtered on the way out.
  class StartItemAnswerNetworkTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    NS = NetworkModelScenario
    SECRETS = %w[RIDDLE 3-14-15].freeze

    CRYPTEX = { 'type' => 'cryptex', 'id' => 'pocket_cryptex', 'name' => 'Pocket Cryptex', 'takeable' => true,
                'locked' => true, 'lockType' => 'cryptex', 'requires' => 'RIDDLE',
                'cryptexConfig' => { 'wheelCount' => 6, 'answer' => 'RIDDLE' } }.freeze
    CASE = { 'type' => 'briefcase', 'id' => 'start_case', 'name' => 'Case', 'takeable' => true,
             'locked' => true, 'lockType' => 'combination', 'requires' => '3-14-15',
             'combination' => [3, 14, 15] }.freeze

    def scenario_with_locked_start_items
      data = NS.with_device_home('start')
      data['startItemsInInventory'] += [CRYPTEX.deep_dup, CASE.deep_dup]
      data
    end

    def refute_secrets(text, where)
      SECRETS.each { |secret| refute_includes text, secret, "#{where} ships #{secret}" }
    end

    test 'a locked start item ships no answer through the bootstrap, an inventory reply or a plant' do
      build_network_game({}, scenario_with_locked_start_items)
      refute_secrets @game.reload.player_state['inventory'].to_json, 'the stored inventory'

      get "/break_escape/games/#{@game.id}/scenario", as: :json
      assert_response :success
      inv = response.parsed_body['playerInventory']
      assert_equal 6, inv.find { |i| i['id'] == 'pocket_cryptex' }.dig('cryptexConfig', 'wheelCount')
      refute_secrets response.body, 'the bootstrap'

      add_item('cryptex', 'pocket_cryptex', 'Pocket Cryptex')
      assert_response :success
      refute_secrets response.body, 'the inventory reply'

      body = plant('comms_port')
      assert_response :success
      assert_equal true, body['success'], body.inspect
      assert body['inventory'].any? { |i| i['id'] == 'pocket_cryptex' }
      refute_secrets response.body, 'the plant reply'

      plant('comms_port')
      assert_response :success
      refute_secrets response.body, 'the repeat plant reply'

      unplug('comms_port')
      assert_response :success
      refute_secrets response.body, 'the unplug reply'
    end

    # A game created before start items were stored filtered keeps the answer in
    # player_state; every network reply filters it on the way out.
    test 'an inventory stored with answers is filtered in the network replies' do
      build_network_game({}, NS.with_device_home('start'))
      @game.player_state['inventory'] += [CRYPTEX.deep_dup, CASE.deep_dup]
      @game.save!

      body = plant('comms_port')
      assert_response :success
      assert_equal true, body['success'], body.inspect
      refute_secrets response.body, 'the plant reply'
      cryptex = body['inventory'].find { |i| i['id'] == 'pocket_cryptex' }
      refute cryptex.key?('requires')
      refute cryptex['cryptexConfig'].key?('answer')

      unplug('comms_port')
      refute_secrets response.body, 'the unplug reply'
      assert_includes @game.reload.player_state['inventory'].to_json, 'RIDDLE', 'the stored copy is left as it was'
    end

    # Code review R3 n1: join Wi-Fi and implant answer with the inventory too (a first answer
    # and an already-held answer each). Answers stored in player_state must not ship.
    BADUSB = { 'id' => 'kit_badusb', 'type' => 'usb_stick', 'name' => 'Keystroke device',
               'takeable' => true, 'usbClass' => 'hid' }.freeze

    def join_and_implant_scenario
      data = NS.scenario
      data['startItemsInInventory'] = [BADUSB.dup, CRYPTEX.deep_dup, CASE.deep_dup]
      data['networks']['visitor_wifi'] = { 'name' => 'Visitor Wi-Fi', 'wifi' => { 'ssid' => 'Harbour-Open' } }
      data['rooms']['lobby']['objects'] << { 'id' => 'open_ap', 'type' => 'pc', 'sprite' => 'wifi_ap1',
                                             'name' => 'Visitor access point', 'wifiAp' => true,
                                             'network' => 'visitor_wifi' }
      data['rooms']['finance_office']['objects'] << {
        'id' => 'lena_usb_socket', 'type' => 'pc', 'name' => 'Desk USB socket',
        'triggerOnInteract' => [
          { 'type' => 'grant_foothold', 'pc' => 'lena_pc', 'needsSession' => true,
            'needsHeld' => 'kit_badusb', 'name' => 'BadUSB: Lena desk' }
        ]
      }
      data
    end

    test 'the join and implant replies ship no answer, first time or already held' do
      build_network_game({ 'sessions' => { 'lena_pc' => { 'id' => 'lena', 'via' => 'claim' } } },
                         join_and_implant_scenario)
      refute_secrets @game.reload.player_state['inventory'].to_json, 'the stored inventory'
      # As in a game stored before start items were filtered: the answers sit in player_state
      @game.player_state['inventory'] += [CRYPTEX.deep_dup, CASE.deep_dup]
      @game.save!

      2.times do |i|
        post game_path('network/join'), params: { ap_id: 'open_ap' }, as: :json
        assert_response :success
        body = response.parsed_body
        assert_equal true, body['success'], body.inspect
        assert_equal(i == 1, body['already'] == true, body.inspect)
        assert body['inventory'].any? { |item| item['id'] == 'pocket_cryptex' }
        refute_secrets response.body, "join reply #{i + 1}"
      end

      2.times do |i|
        post game_path('network/implant'), params: { pc_id: 'lena_pc', shape: 'session' }, as: :json
        assert_response :success
        body = response.parsed_body
        assert_equal true, body['success'], body.inspect
        assert_equal(i == 1, body['already'] == true, body.inspect)
        assert body['inventory'].any? { |item| item['id'] == 'pocket_cryptex' }
        refute_secrets response.body, "implant reply #{i + 1}"
      end
    end
  end
end
