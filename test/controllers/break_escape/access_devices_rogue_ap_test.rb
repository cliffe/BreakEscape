require 'test_helper'
require_relative '../../support/network_model_scenario'

module BreakEscape
  # Physical pentest devices, slice A1 (docs/achitechture/PHYSICAL_PENTEST_DEVICES_PLAN.md,
  # sections 4.1 to 4.3 and 7): the pocket rogue AP over HTTP, on an inline fixture in the
  # shape of test_access_devices. The console writes only globals, so every secret it leads
  # to is gated on the server by the plant proof (kit_rogue_ap on rogue_ap_spot):
  # - the staff Wi-Fi key, a holderless addCapture.secret on a phone NPC (the key page);
  # - Kieran's account password, served by the account pass under his captureProof (the
  #   sign-in page).
  # Hostile cases: a capture before the plant, a forged clientAdded clone of the kit, the
  # console's globals forged by sync, a wrong or guest key at the staff AP, a neighbour SSID
  # or the rogue box itself used as an AP, a jack plant of the AP kit, another player's game.
  class AccessDevicesRogueApTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    PSK = 'Qz7mR4tw'.freeze
    GUEST_PSK = 'welcome-ledgerwell'.freeze
    KIERAN_USER = 'k.doyle'.freeze
    KIERAN_PASSWORD = 'copper-lantern-meadow'.freeze
    PROOF = { 'planted' => 'kit_rogue_ap', 'on' => 'rogue_ap_spot' }.freeze

    def scenario(hot_desk_people: ['kieran'])
      {
        'scenario_brief' => 'Rogue AP fixture',
        'startRoom' => 'reception',
        'social' => { 'captures' => { 'revealSecret' => true } },
        'networks' => {
          'office_lan' => { 'name' => 'Ledgerwell office LAN', 'wifi' => { 'ssid' => 'Ledgerwell-Staff', 'psk' => PSK } },
          'lw_guest' => { 'name' => 'Ledgerwell guest Wi-Fi', 'wifi' => { 'ssid' => 'Ledgerwell-Guest', 'psk' => GUEST_PSK } }
        },
        'startItemsInInventory' => [
          { 'type' => 'rogue_ap', 'id' => 'kit_rogue_ap', 'name' => 'Pocket rogue AP', 'takeable' => true, 'droppable' => false }
        ],
        'rooms' => {
          'reception' => {
            'type' => 'room_office',
            'objects' => [
              { 'id' => 'rogue_ap_spot', 'type' => 'pc', 'sprite' => 'planter_fig1', 'name' => 'Planter',
                'requiresItem' => 'kit_rogue_ap', 'consumesItem' => true,
                'triggerOnInteract' => [{ 'type' => 'set_global', 'key' => 'ap_planted', 'value' => true }] },
              { 'id' => 'planted_rogue_ap', 'type' => 'pc', 'sprite' => 'drop_box1', 'name' => 'Rogue AP',
                'revealOnGlobal' => 'ap_planted', 'wifiTwin' => true,
                'apScan' => [{ 'ssid' => 'Ledgerwell-Staff', 'inScope' => true, 'cloneGlobals' => { 'ap_twin_staff' => true } },
                             { 'ssid' => 'Corrigan-Dental', 'inScope' => false, 'refusal' => 'Out of scope.' }] },
              { 'id' => 'lw_staff_ap', 'type' => 'pc', 'sprite' => 'wifi_ap1', 'name' => 'Ledgerwell-Staff access point',
                'wifiAp' => true, 'network' => 'office_lan' },
              { 'id' => 'lw_guest_ap', 'type' => 'pc', 'sprite' => 'wifi_ap1', 'name' => 'Ledgerwell-Guest access point',
                'wifiAp' => true, 'network' => 'lw_guest' },
              { 'id' => 'voice_port', 'type' => 'pc', 'sprite' => 'network_rack1', 'name' => 'Wall port',
                'networkJack' => true, 'network' => 'office_lan' },
              { 'id' => 'hot_desk_pc', 'type' => 'pc', 'name' => 'Hot desk', 'locked' => true, 'lockType' => 'login',
                'network' => 'office_lan', 'host' => 'LW-HOTDESK', 'access' => { 'people' => hot_desk_people } },
              { 'id' => 'kieran_laptop', 'type' => 'pc', 'name' => "Kieran's laptop" }
            ],
            'npcs' => [
              { 'id' => 'kieran', 'displayName' => 'Kieran Doyle', 'npcType' => 'person', 'position' => { 'x' => 2, 'y' => 2 },
                'creds' => { 'username' => KIERAN_USER, 'password' => KIERAN_PASSWORD },
                'captureProof' => [PROOF.dup],
                'eventMappings' => [{ 'eventPattern' => 'npc_used:kieran_laptop', 'onceOnly' => true,
                                      'condition' => 'globalVars.ap_twin_staff === true && globalVars.ap_portal_account === true',
                                      'addCapture' => { 'targetId' => 'kieran', 'kind' => 'credential', 'address' => KIERAN_USER },
                                      'setGlobal' => { 'kp_twin_account_captured' => true } }] },
              { 'id' => 'ruth', 'displayName' => 'Ruth', 'npcType' => 'phone',
                'eventMappings' => [{ 'eventPattern' => 'npc_used:kieran_laptop', 'onceOnly' => true,
                                      'condition' => 'globalVars.ap_twin_staff === true && globalVars.ap_portal_account !== true',
                                      'addCapture' => { 'targetId' => 'staff_wifi_key', 'kind' => 'credential',
                                                        'address' => 'Ledgerwell-Staff', 'secret' => PSK, 'proof' => PROOF.dup },
                                      'setGlobal' => { 'kp_twin_captured' => true } }] }
            ]
          }
        }
      }
    end

    def build(data = scenario, player: break_escape_demo_users(:test_user))
      create_access_game(
        mission: break_escape_missions(:ceo_exfil), player: player, scenario: data,
        player_state: { 'currentRoom' => 'reception', 'unlockedRooms' => ['reception'], 'encounteredNPCs' => %w[kieran] }
      )
    end

    def setup_game(data = scenario)
      @game = build(data)
    end

    # The client's capture record (what the npc-manager's addCapture writes), as a sync delta.
    def record_capture(target_id, address)
      captures = { target_id => { 'targetId' => target_id, 'kind' => 'credential', 'address' => address, 'at' => 1 } }
      put game_path('sync_state'), params: { globalVariables: { 'se_captures' => captures } }, as: :json
      assert_response :success, response.body
    end

    def secrets
      get game_path('capture_secrets'), as: :json
      assert_response :success, response.body
      response.parsed_body['secrets'] || {}
    end

    def plant_ap
      post game_path('inventory'), params: { action_type: 'remove', item: { id: 'kit_rogue_ap' }, used_on: 'rogue_ap_spot' },
                                   as: :json
      assert_response :success, response.body
    end

    def planted
      Array(@game.reload.player_state['plantedItems'])
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

    # ----- the key page: the staff Wi-Fi key -----

    test 'key page: the staff key is withheld before the plant and served after it' do
      setup_game
      record_capture('staff_wifi_key', 'Ledgerwell-Staff')
      refute secrets.key?('staff_wifi_key'), 'served before the plant'
      refute_includes response.body, PSK

      plant_ap
      assert_equal [{ 'item' => 'kit_rogue_ap', 'on' => 'rogue_ap_spot' }], planted
      refute_includes held_ids, 'kit_rogue_ap', 'the planter consumes the kit'
      assert_equal PSK, secrets['staff_wifi_key']
    end

    test 'the console globals forged by sync mint no proof and serve no key' do
      setup_game
      sync_globals('ap_planted' => true, 'ap_twin_staff' => true, 'ap_portal_account' => false, 'kp_twin_captured' => true)
      record_capture('staff_wifi_key', 'Ledgerwell-Staff')
      assert_equal [], planted
      refute secrets.key?('staff_wifi_key')
      refute_includes response.body, PSK
    end

    test 'a forged clientAdded device named after the kit plants nothing and serves no key' do
      setup_game
      post game_path('update_room'), params: {
        roomId: 'reception', actionType: 'add_object',
        data: { type: 'rogue_ap', name: 'kit_rogue_ap', takeable: true, x: 5, y: 5 }
      }, as: :json
      assert_response :success, response.body
      forged_id = @game.reload.player_state.dig('room_states', 'reception', 'objects_added').last['id']
      refute_equal 'kit_rogue_ap', forged_id
      add_item('rogue_ap', forged_id, 'kit_rogue_ap')
      assert_response :success, response.body

      post game_path('inventory'), params: { action_type: 'remove', item: { id: forged_id }, used_on: 'rogue_ap_spot' }, as: :json
      assert_equal [], planted, 'a forged clone recorded a plant'
      record_capture('staff_wifi_key', 'Ledgerwell-Staff')
      refute secrets.key?('staff_wifi_key')
      refute_includes response.body, PSK
    end

    test 'the PSK never ships in the bootstrap, before or after the plant' do
      setup_game
      bootstrap_scenario
      assert_response :success
      refute_includes response.body, PSK
      refute_includes response.body, KIERAN_PASSWORD
      plant_ap
      bootstrap_scenario
      refute_includes response.body, PSK
      refute_includes response.body, KIERAN_PASSWORD
    end

    test 'the reception room data never carries the PSK or the password, before or after the plant' do
      setup_game
      get game_path('room/reception'), as: :json
      assert_response :success, response.body
      refute_includes response.body, PSK
      refute_includes response.body, KIERAN_PASSWORD
      plant_ap
      get game_path('room/reception'), as: :json
      assert_response :success, response.body
      refute_includes response.body, PSK
      refute_includes response.body, KIERAN_PASSWORD
    end

    test 'the NPC USB habit never picks the rogue AP kit (item definition)' do
      data = scenario
      kit = data['startItemsInInventory'].find { |i| i['id'] == 'kit_rogue_ap' }
      stick = { 'type' => 'usb', 'id' => 'kieran_stick', 'name' => 'Kieran stick' }
      data['rooms']['reception']['npcs'] = [
        { 'id' => 'kieran', 'habits' => { 'usb' => { 'every' => 2 } }, 'itemsHeld' => [kit, stick] }
      ]
      ids = BreakEscape::AccessWork.usb_habit_sticks(data).map { |_npc, s| s['id'] }
      assert_equal ['kieran_stick'], ids
      data['rooms']['reception']['npcs'][0]['itemsHeld'] = [kit]
      assert_equal [], BreakEscape::AccessWork.usb_habit_sticks(data)
    end

    # E0.4 adds the validator warning for a rogue AP whose clone target is off every access list
    # (the inline variant: Kieran off hot_desk_people). Enable this when E0.4 merges.
    test 'inline variant: Kieran off the access list fires the E0.4 warning' do
      skip 'waits for E0.4 (the validator warning for a holderless target)'
    end

    # ----- joining: wrong SSID, guest key, neighbour SSID, the box itself -----

    test 'the harvested key joins the staff network and reaches the hot desk' do
      setup_game
      body = join('lw_staff_ap', PSK)
      assert_response :success, body.inspect
      assert_equal 'wifi_office_lan', body.dig('foothold', 'id')
      entry = network_view('wifi_office_lan')['footholds'].find { |f| f['id'] == 'wifi_office_lan' }
      assert_includes entry['hosts'].map { |h| h['id'] }, 'hot_desk_pc'
    end

    test 'the guest key at the staff AP, or a wrong key, is refused and gives nothing' do
      setup_game
      [GUEST_PSK, 'not-the-key', PSK.downcase].each do |key|
        body = join('lw_staff_ap', key)
        assert_response :unprocessable_entity
        assert_equal 'wrong_key', body['reason'], key
      end
      refute footholds.key?('wifi_office_lan')
    end

    test 'the guest key joins the guest network, which reaches no office host' do
      setup_game
      body = join('lw_guest_ap', GUEST_PSK)
      assert_response :success, body.inspect
      assert_equal 'wifi_lw_guest', body.dig('foothold', 'id')
      entry = network_view('wifi_lw_guest')['footholds'].find { |f| f['id'] == 'wifi_lw_guest' }
      refute_includes Array(entry && entry['hosts']).map { |h| h['id'] }, 'hot_desk_pc'
      refute footholds.key?('wifi_office_lan')
    end

    test 'a neighbour SSID, an invented AP id or the rogue box itself joins nothing' do
      setup_game
      plant_ap
      answers = %w[Corrigan-Dental BT-Hub-4F2A planted_rogue_ap rogue_ap_spot hot_desk_pc].map do |ap_id|
        body = join(ap_id, PSK)
        refute body['success'], "#{ap_id} joined"
        refute_includes response.body, PSK
        ap_id
      end
      assert_equal 5, answers.size
      assert_equal({}, footholds.select { |id, _| id.start_with?('wifi_') })
    end

    test 'the rogue AP kit is no jack device: a jack plant never takes it' do
      setup_game
      [nil, 'kit_rogue_ap'].each do |device|
        body = plant('voice_port', device)
        refute body['success'], "jack plant with #{device.inspect} succeeded"
      end
      assert_includes held_ids, 'kit_rogue_ap', 'the kit is still held'
      assert_equal [], planted
      assert_equal({}, footholds)
    end

    # ----- the sign-in page: Kieran's account -----

    test "sign-in page: Kieran's password is withheld before the plant, served after, and signs in at the hot desk" do
      setup_game
      record_capture('kieran', KIERAN_USER)
      refute secrets.key?('kieran')
      refute_includes response.body, KIERAN_PASSWORD

      plant_ap
      assert_equal KIERAN_PASSWORD, secrets['kieran']
      body = sign_in('hot_desk_pc', KIERAN_USER, KIERAN_PASSWORD)
      assert body['success'], body.inspect
    end

    test 'one plant serves both harvests, and the account capture never serves the key' do
      setup_game
      plant_ap
      record_capture('kieran', KIERAN_USER)
      got = secrets
      assert_equal KIERAN_PASSWORD, got['kieran']
      refute got.key?('staff_wifi_key'), 'the key is served only for its own capture'
      record_capture('staff_wifi_key', 'Ledgerwell-Staff')
      got = secrets
      assert_equal PSK, got['staff_wifi_key']
      assert_equal KIERAN_PASSWORD, got['kieran']
    end

    test 'a wrong password or a wrong user is refused at the hot desk' do
      setup_game
      plant_ap
      refute sign_in('hot_desk_pc', KIERAN_USER, 'copper-lantern')['success']
      refute sign_in('hot_desk_pc', 'r.someone', KIERAN_PASSWORD)['success']
      refute sign_in('hot_desk_pc', KIERAN_USER, PSK)['success'], 'the Wi-Fi key is not an account password'
    end

    test 'inline variant: with Kieran off the hot desk access list his password opens nothing' do
      setup_game(scenario(hot_desk_people: ['nobody']))
      plant_ap
      refute sign_in('hot_desk_pc', KIERAN_USER, KIERAN_PASSWORD)['success']
    end

    # ----- state growth -----

    test 'repeat plants and repeat captures do not grow synced state' do
      setup_game
      plant_ap
      post game_path('inventory'), params: { action_type: 'remove', item: { id: 'kit_rogue_ap' }, used_on: 'rogue_ap_spot' },
                                   as: :json
      assert_equal 1, planted.size, 'a second plant added an entry'
      3.times { record_capture('staff_wifi_key', 'Ledgerwell-Staff') }
      captures = @game.reload.player_state['seCaptures'] || @game.player_state.dig('globalVariables', 'se_captures') || {}
      assert_equal 1, captures.keys.count { |k| k == 'staff_wifi_key' }
      3.times { join('lw_staff_ap', PSK) }
      assert_equal 1, footholds.keys.count { |k| k == 'wifi_office_lan' }
      assert_equal 1, Array(@game.reload.player_state['gainedFootholds']).count('lw_staff_ap')
    end

    # ----- another player's game -----

    test "another player's game: no plant, no secret, no join through it" do
      setup_game
      own = @game
      @game = build(scenario, player: break_escape_demo_users(:other_user))
      other = @game

      post game_path('inventory'), params: { action_type: 'remove', item: { id: 'kit_rogue_ap' }, used_on: 'rogue_ap_spot' },
                                   as: :json
      refute response.successful?, 'removed an item in another player\'s game'
      get game_path('capture_secrets'), as: :json
      refute response.successful?
      refute_includes response.body, PSK
      post game_path('network/join'), params: { ap_id: 'lw_staff_ap', key: PSK }, as: :json
      refute response.successful?
      assert_equal [], Array(other.reload.player_state['plantedItems'])
      assert_equal({}, other.reload.player_state['footholds'] || {})

      # The owner's own game is unaffected and still gated.
      @game = own
      record_capture('staff_wifi_key', 'Ledgerwell-Staff')
      refute secrets.key?('staff_wifi_key')
    end
  end

  # The same server paths against the real test_access_devices scenario: the staff PSK is
  # drawn per game (<%= @random_password %>), and the key capture's secret is the same draw.
  class AccessDevicesRogueApScenarioTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    GUEST_PSK = 'Visitor-Pebble-2026'.freeze

    setup do
      @mission = Mission.create!(name: 'test_access_devices', display_name: 'Access devices', published: true, difficulty_level: 1)
      @game = Game.create!(mission: @mission, player: break_escape_demo_users(:test_user)).reload
    end

    def psk(game = @game)
      game.scenario_data.dig('networks', 'office_lan', 'wifi', 'psk')
    end

    def kieran_password
      Game.scenario_room_npcs(@game.scenario_data).find { |npc| npc['id'] == 'kieran' }['creds']['password']
    end

    def record_capture(target_id, address)
      captures = { target_id => { 'targetId' => target_id, 'kind' => 'credential', 'address' => address, 'at' => 1 } }
      put game_path('sync_state'), params: { globalVariables: { 'se_captures' => captures } }, as: :json
      assert_response :success, response.body
    end

    def secrets
      get game_path('capture_secrets'), as: :json
      assert_response :success, response.body
      response.parsed_body['secrets'] || {}
    end

    def plant_ap
      post game_path('inventory'), params: { action_type: 'remove', item: { id: 'kit_rogue_ap' }, used_on: 'rogue_ap_spot' },
                                   as: :json
      assert_response :success, response.body
    end

    def join(ap_id, key)
      post game_path('network/join'), params: { ap_id: ap_id, key: key }, as: :json
      response.parsed_body
    end

    test 'the reception room data never carries the PSK or the password, before or after the plant' do
      get game_path('room/reception'), as: :json
      assert_response :success, response.body
      refute_includes response.body, psk
      refute_includes response.body, kieran_password
      plant_ap
      get game_path('room/reception'), as: :json
      assert_response :success, response.body
      refute_includes response.body, psk
      refute_includes response.body, kieran_password
    end

    test 'the staff PSK is drawn per game and the key capture serves that game\'s own value' do
      other = Game.create!(mission: @mission, player: break_escape_demo_users(:test_user)).reload
      assert_match(/\A\S{8}\z/, psk)
      refute_equal psk, psk(other), 'two games drew the same PSK'
      assert_includes held_ids, 'kit_rogue_ap'

      record_capture('staff_wifi_key', 'Ledgerwell-Staff')
      refute secrets.key?('staff_wifi_key'), 'served before the plant'
      refute_includes response.body, psk
      sync_globals('ap_planted' => true, 'ap_twin_staff' => true)
      refute secrets.key?('staff_wifi_key'), 'served on forged console globals'

      plant_ap
      assert_equal psk, secrets['staff_wifi_key']
      refute_includes response.body, psk(other)
    end

    test 'the served key joins the staff Wi-Fi; the card key and a neighbour SSID do not' do
      plant_ap
      refute join('lw_staff_ap', GUEST_PSK)['success']
      refute join('Corrigan-Dental', psk)['success']
      refute join('planted_rogue_ap', psk)['success']
      body = join('lw_staff_ap', psk)
      assert body['success'], body.inspect
      assert_equal 'wifi_office_lan', body.dig('foothold', 'id')
      guest = join('lw_guest_ap', GUEST_PSK)
      assert guest['success'], guest.inspect
      entry = network_view('wifi_lw_guest')['footholds'].find { |f| f['id'] == 'wifi_lw_guest' }
      assert_equal [], Array(entry && entry['hosts']), 'the guest network reaches nothing'
    end

    test "Kieran's password is withheld before the plant and signs in at the hot desk after it" do
      record_capture('kieran', 'k.doyle')
      refute secrets.key?('kieran')
      refute_includes response.body, kieran_password
      plant_ap
      assert_equal kieran_password, secrets['kieran']
      assert sign_in('hot_desk_pc', 'k.doyle', kieran_password)['success'], response.body
    end

    test 'the bootstrap carries neither the PSK nor the password' do
      bootstrap_scenario
      assert_response :success
      refute_includes response.body, psk
      refute_includes response.body, kieran_password
    end
  end
end
