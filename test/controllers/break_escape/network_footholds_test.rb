require 'test_helper'
require_relative '../../support/network_model_scenario'

module BreakEscape
  # Networks slice 9.3a, step 3 (docs/achitechture/ACCESS_MODEL_SLICE_9_3_PLAN.md,
  # sections 4.1, 4.3, 5 and 6): the jack, the device, the link item and the view.
  class NetworkFootholdsTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    NS = NetworkModelScenario
    HOMES = %w[room container start npc grant].freeze

    def state
      @game.reload.player_state
    end

    def planted_with_box
      build_network_game
      take_drop_box
      body = plant('comms_port')
      assert_response :success, body.inspect
      body
    end

    # Room data is built from copies: hiding a planted device (or any later filter) must
    # not edit the objects_added records that belong to player_state (review R1, m4).
    test 'hiding a planted device in an added container leaves the stored objects_added entry whole' do
      planted_with_box
      @game.reload
      crate = { 'id' => 'added_crate', 'type' => 'safe', 'name' => 'Added crate', 'locked' => true, 'lockType' => 'pin',
                'requires' => '9182', 'contents' => [NS::DROP_BOX.dup] }
      @game.player_state['room_states'] ||= {}
      @game.player_state['room_states']['lobby'] ||= { 'objects_added' => [], 'objects_removed' => [], 'object_states' => {} }
      @game.player_state['room_states']['lobby']['objects_added'] = [crate]
      @game.save!
      stored = crate.deep_dup

      room = @game.filtered_room_data('lobby')
      refute_includes room.to_json, '"kit_dropbox"'
      refute_includes room.to_json, '9182'
      assert_equal [stored], @game.player_state['room_states']['lobby']['objects_added']
      @game.save!
      assert_equal [stored], @game.reload.player_state['room_states']['lobby']['objects_added']
    end

    def room_object_ids(room_id)
      get game_path("room/#{room_id}"), as: :json
      assert_response :success
      response.parsed_body['room']['objects'].map { |o| o['id'] }
    end

    # The device, taken from its home in the way the client takes it from there.
    def take_from_home(home)
      case home
      when 'room', 'grant'
        take_drop_box
      when 'container'
        body = add_item('pc', 'kit_dropbox', 'Network drop box')
        assert_equal true, body['success'], body.inspect
      when 'npc'
        post game_path('inventory'), params: { action_type: 'add', source_npc_id: 'sam',
                                               item: { type: 'pc', id: 'kit_dropbox', name: 'Network drop box' } }, as: :json
        assert_response :success, response.body
      when 'start'
        assert_includes held_ids, 'kit_dropbox'
      end
    end

    # ---- plant ------------------------------------------------------------------------

    test 'a plant moves the device out and the link item in, records both keys and answers first' do
      body = planted_with_box
      assert_equal true, body['success']
      assert_equal true, body['first']
      refute body.key?('already')
      ids = body['inventory'].map { |i| i['id'] }
      refute_includes ids, 'kit_dropbox'
      assert_includes ids, 'netlink_jack_comms_port'
      assert_equal({ 'id' => 'jack_comms_port', 'via' => 'jack', 'name' => 'Drop box: comms room',
                     'itemId' => 'netlink_jack_comms_port', 'sourceId' => 'comms_port',
                     'network' => { 'id' => 'office_lan', 'name' => NS::OFFICE_NAME } }, body['foothold'])
      foothold = state['footholds']['jack_comms_port']
      assert_equal 'jack', foothold['via']
      assert_equal 'office_lan', foothold['network']
      assert_equal 'comms_port', foothold['source']
      assert_equal 'kit_dropbox', foothold['device']['id']
      assert_equal 1, foothold['seq']
      assert_equal ['comms_port'], state['gainedFootholds']
      assert_equal held_ids, ids
    end

    test 'a second plant at the same jack answers already and writes nothing' do
      planted_with_box
      before = state.deep_dup
      body = plant('comms_port')
      assert_response :success
      assert_equal true, body['already']
      assert_equal false, body['first']
      assert_equal before, state
    end

    test 'the link item has exactly the shape of 4.1, with storeIn only when the jack sets linkStoreIn' do
      planted_with_box
      link = state['inventory'].find { |i| i['type'] == 'network_link' }
      assert_equal({ 'id' => 'netlink_jack_comms_port', 'type' => 'network_link', 'name' => 'Drop box: comms room',
                     'sprite' => 'drop_box1', 'takeable' => false, 'footholdId' => 'jack_comms_port',
                     'sourceId' => 'comms_port',
                     'observations' => 'Your Network drop box on Spare wall port. Open it to see what it reaches.' }, link)

      unplug('comms_port')
      body = plant('bench_port')
      assert_response :success, body.inspect
      link = body['inventory'].find { |i| i['type'] == 'network_link' }
      assert_equal 'capture_log', link['storeIn']
      assert_equal 'Network drop box: Bench switch', link['name']
      %w[contents hasContents droppable].each { |field| refute link.key?(field) }
    end

    test 'refusals: no device, a forged rogueDevice entry, an unreachable jack and an unknown jack' do
      build_network_game
      before = state.deep_dup
      body = plant('comms_port')
      assert_response :unprocessable_entity
      assert_equal 'no_device', body['reason']

      forged = { 'id' => 'forged_box', 'type' => 'pc', 'name' => 'Forged box', 'rogueDevice' => true, 'takeable' => true }
      @game.player_state['inventory'] << forged
      @game.save!
      before = state.deep_dup
      body = plant('comms_port')
      assert_response :unprocessable_entity
      assert_equal 'no_device', body['reason']
      assert_equal before, state

      take_drop_box
      before = state.deep_dup
      body = plant('server_port')
      assert_response :forbidden
      assert_equal 'unreachable', body['reason']
      assert_equal before, state

      body = plant('no_such_jack')
      assert_response :not_found
      assert_equal 'Jack not found', body['error']
      body = plant('sam_pc')
      assert_response :not_found, 'a sign-in PC is no jack'
      assert_equal before, state
    end

    test 'a device_id naming a device that is not held is refused although another is held' do
      build_network_game
      take_drop_box
      body = plant('comms_port', 'some_other_box')
      assert_response :unprocessable_entity
      assert_equal 'no_device', body['reason']
      assert_includes held_ids, 'kit_dropbox'
      body = plant('comms_port', 'kit_dropbox')
      assert_response :success, body.inspect
    end

    test 'an unplug at a jack with no foothold is not_planted, and an unknown jack 404' do
      build_network_game
      body = unplug('comms_port')
      assert_response :unprocessable_entity
      assert_equal 'not_planted', body['reason']
      unplug('no_such_jack')
      assert_response :not_found
    end

    HOMES.each do |home|
      test "a device defined in its #{home} home plants, and that home does not offer it again while planted" do
        scenario = NS.with_device_home(home)
        build_network_game({ 'unlockedObjects' => ['kit_crate'] }, scenario)
        take_from_home(home)
        body = plant('comms_port')
        assert_response :success, body.inspect
        refute_includes held_ids, 'kit_dropbox'

        get game_path('room/lobby'), as: :json
        lobby = response.parsed_body['room']
        refute_includes lobby.to_json, '"kit_dropbox"', "#{home}: the lobby offers the planted box"
        if home == 'container'
          listing = container('kit_crate')
          assert_response :success
          refute_includes listing['contents'].map { |c| c['id'] }, 'kit_dropbox'
        end

        body = add_item('pc', 'kit_dropbox', 'Network drop box')
        assert_equal false, body['success'], "#{home}: an add brought the planted box back"
        post game_path('inventory'), params: { action_type: 'add', source_npc_id: 'sam',
                                               item: { type: 'pc', id: 'kit_dropbox', name: 'Network drop box' } }, as: :json
        assert_response :unprocessable_entity
        refute_includes held_ids, 'kit_dropbox'
      end
    end

    # ---- one device -------------------------------------------------------------------

    test 'a planted device is not in its room, with objects_removed written and with it removed by hand' do
      planted_with_box
      assert_includes state['room_states']['lobby']['objects_removed'], 'kit_dropbox'
      refute_includes room_object_ids('lobby'), 'kit_dropbox'

      @game.player_state['room_states']['lobby']['objects_removed'] = []
      @game.save!
      refute_includes room_object_ids('lobby'), 'kit_dropbox'

      body = add_item('pc', 'kit_dropbox', 'Network drop box')
      assert_response :unprocessable_entity
      assert_equal false, body['success']

      body = plant('bench_port')
      assert_response :unprocessable_entity
      assert_equal 'no_device', body['reason']
      refute state['footholds'].key?('jack_bench_port')
    end

    # ---- unplug -----------------------------------------------------------------------

    test 'an unplug returns the device once, removes the link item and the foothold and keeps gainedFootholds' do
      planted_with_box
      body = unplug('comms_port')
      assert_response :success, body.inspect
      assert_equal [], body['endedPcIds']
      assert_equal 1, held_ids.count('kit_dropbox')
      refute_includes held_ids, 'netlink_jack_comms_port'
      assert_equal({}, state['footholds'])
      assert_equal ['comms_port'], state['gainedFootholds']
      assert_equal body['inventory'].map { |i| i['id'] }, held_ids

      take_drop_box
      assert_equal 1, held_ids.count('kit_dropbox')
      body = plant('comms_port')
      assert_equal false, body['first']
      assert_equal ['comms_port'], state['gainedFootholds']
    end

    test 'an unplug at a jack the player cannot reach is refused' do
      build_network_game('unlockedRooms' => NetworkRequests::OPEN_ROOMS + ['server_room'])
      take_drop_box
      plant('server_port')
      assert_response :success
      @game.reload
      @game.player_state['unlockedRooms'] -= ['server_room']
      @game.save!
      body = unplug('server_port')
      assert_response :forbidden
      assert_equal 'unreachable', body['reason']
      assert state['footholds'].key?('jack_server_port')
    end

    # ---- the view ---------------------------------------------------------------------

    test 'the view is empty with no foothold, and an unknown foothold is 404' do
      build_network_game
      assert_equal({ 'footholds' => [] }, network_view)
      assert_response :success
      network_view('jack_comms_port')
      assert_response :not_found
    end

    test 'the view lists the foothold network hosts then resources, each sorted by id, and nothing else' do
      planted_with_box
      view = network_view
      assert_response :success
      assert_equal 1, view['footholds'].size
      foothold = view['footholds'][0]
      assert_equal 'jack_comms_port', foothold['id']
      assert_equal({ 'id' => 'office_lan', 'name' => NS::OFFICE_NAME }, foothold['network'])
      # Hosts first, then resources, each sorted by id: the order an author can predict
      # (the jsonb column keeps keys in length order, not the order they were written).
      assert_equal %w[door_box kiosk_pc lena_pc sam_pc ledger_archive print_queue scanned_inbox],
                   foothold['hosts'].map { |h| h['id'] }

      sam = foothold['hosts'].find { |h| h['id'] == 'sam_pc' }
      assert_equal({ 'id' => 'sam_pc', 'kind' => 'pc', 'name' => "Sam's PC", 'host' => 'HB-DESK-01', 'sprite' => 'pc_desktop',
                     'headless' => false, 'remoteSignIn' => true }, sam)
      kiosk = foothold['hosts'].find { |h| h['id'] == 'kiosk_pc' }
      assert_equal false, kiosk['remoteSignIn']
      door = foothold['hosts'].find { |h| h['id'] == 'door_box' }
      assert_equal true, door['headless']
      assert_equal 'network_rack1', door['sprite']
      assert_equal({ 'id' => 'scanned_inbox', 'kind' => 'file_share', 'name' => NS::INBOX_NAME, 'host' => NS::FS_HOST, 'open' => true },
                   foothold['hosts'].find { |h| h['id'] == 'scanned_inbox' })
      assert_equal false, foothold['hosts'].find { |h| h['id'] == 'ledger_archive' }['open']
      assert_equal NS::PRINTER_OBSERVATIONS, foothold['hosts'].find { |h| h['id'] == 'print_queue' }['observations']

      json = view.to_json
      (NS::WORKSHOP_RESOURCE_STRINGS + [NS::WORKSHOP_NAME, 'bench_pc', 'WS-BENCH-01']).each { |text| refute_includes json, text }
      (NS::SHARE_ITEM_STRINGS + NS::PASSWORDS + %w[sokafor lfox ishaw access finance roles]).each do |text|
        refute_includes json, text
      end
      assert_equal view, network_view('jack_comms_port')
    end

    test 'the view offers a password session, never one under a blocked policy or a claim' do
      planted_with_box
      @game.reload
      @game.player_state['sessions'] = {
        'sam_pc' => { 'id' => 'sam', 'via' => 'password' },
        'kiosk_pc' => { 'id' => 'sam', 'via' => 'password' },
        'lena_pc' => { 'id' => 'lena', 'via' => 'claim' }
      }
      @game.save!
      hosts = network_view['footholds'][0]['hosts']
      assert_equal({ 'username' => 'sokafor', 'displayName' => 'Sam Okafor', 'via' => 'password', 'remote' => false },
                   hosts.find { |h| h['id'] == 'sam_pc' }['session'])
      refute hosts.find { |h| h['id'] == 'kiosk_pc' }.key?('session')
      refute hosts.find { |h| h['id'] == 'lena_pc' }.key?('session')
    end

    test 'two footholds list their own networks in plant order' do
      scenario = NS.scenario
      scenario['rooms']['lobby']['objects'] << NS::DROP_BOX.merge('id' => 'kit_dropbox_2', 'name' => 'Spare drop box')
      build_network_game({}, scenario)
      take_drop_box
      post game_path('inventory'), params: { action_type: 'add', item: { type: 'pc', id: 'kit_dropbox_2', name: 'Spare drop box' } }, as: :json
      assert_response :success
      plant('bench_port')
      plant('comms_port')
      view = network_view
      assert_equal %w[jack_bench_port jack_comms_port], view['footholds'].map { |f| f['id'] }
      assert_equal %w[bench_pc bench_notes], view['footholds'][0]['hosts'].map { |h| h['id'] }
      bench = network_view('jack_bench_port').to_json
      (NS::OFFICE_RESOURCE_STRINGS + [NS::OFFICE_NAME]).each { |text| refute_includes bench, text }
    end

    # ---- the bootstrap, the room and the task -----------------------------------------

    test 'GET /scenario carries footholds without hosts and gainedFootholds' do
      planted_with_box
      get game_path('scenario'), as: :json
      assert_response :success
      body = response.parsed_body
      assert_equal [{ 'id' => 'jack_comms_port', 'via' => 'jack', 'name' => 'Drop box: comms room',
                      'itemId' => 'netlink_jack_comms_port', 'sourceId' => 'comms_port',
                      'network' => { 'id' => 'office_lan', 'name' => NS::OFFICE_NAME } }], body['footholds']
      assert_equal ['comms_port'], body['gainedFootholds']
      %w[networks resources networkLinks].each { |key| refute body.key?(key) }
      (NS::OFFICE_RESOURCE_STRINGS + NS::SHARE_ITEM_STRINGS + [NS::WORKSHOP_NAME]).each { |text| refute_includes response.body, text }
    end

    test 'the jack shows jackPlanted in its room data while planted' do
      planted_with_box
      get game_path('room/comms_room'), as: :json
      assert_equal true, response.parsed_body['room']['objects'].find { |o| o['id'] == 'comms_port' }['jackPlanted']
      unplug('comms_port')
      get game_path('room/comms_room'), as: :json
      assert_equal false, response.parsed_body['room']['objects'].find { |o| o['id'] == 'comms_port' }['jackPlanted']
    end

    test 'an unlock_object task on a jack completes after the plant, not before, and stays complete' do
      build_network_game
      post complete_task_game_url(@game, task_id: 'plant_box'), as: :json
      assert_equal false, response.parsed_body['success']
      take_drop_box
      plant('comms_port')
      post complete_task_game_url(@game, task_id: 'plant_box'), as: :json
      assert_equal true, response.parsed_body['success'], response.body
      unplug('comms_port')
      assert_equal 'completed', state.dig('objectivesState', 'tasks', 'plant_box', 'status')
    end

    # A malformed scenario (step 5 refuses it): the jack's network is not defined, so no
    # device can be planted there, and the task must not complete through unlockedObjects.
    test 'an unlock_object task on a jack whose network is undefined is never met by an unlock' do
      data = NS.scenario
      data['rooms']['comms_room']['network'] = 'ghost_lan'
      build_network_game({ 'unlockedObjects' => ['comms_port'] }, data)
      unlock_object('comms_port', 'unlocked')
      post complete_task_game_url(@game, task_id: 'plant_box'), as: :json
      assert_equal false, response.parsed_body['success'], response.body
      assert_equal 'No device planted here', response.parsed_body['error']
    end

    test 'a reset with a device planted empties both keys and puts the device back in its room' do
      planted_with_box
      post game_path('reset'), as: :json
      assert_response :success
      assert_equal({}, state['footholds'])
      assert_equal [], state['gainedFootholds']
      refute_includes held_ids, 'netlink_jack_comms_port'
      assert_includes room_object_ids('lobby'), 'kit_dropbox'
    end

    test 'every route answers for a player_state from before this slice' do
      build_network_game
      @game.player_state.delete('footholds')
      @game.player_state.delete('gainedFootholds')
      @game.save!
      assert_equal({ 'footholds' => [] }, network_view)
      get game_path('scenario'), as: :json
      assert_response :success
      assert_equal [], response.parsed_body['footholds']
      assert_equal [], response.parsed_body['gainedFootholds']
      get game_path('room/comms_room'), as: :json
      assert_response :success
      unplug('comms_port')
      assert_response :unprocessable_entity
      take_drop_box
      plant('comms_port')
      assert_response :success
      assert_equal ['comms_port'], state['gainedFootholds']
    end

    # ---- authorisation ----------------------------------------------------------------

    test 'the new actions answer an unauthorised player as the existing actions do' do
      build_network_game
      other = create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:other_user),
                                 scenario: NS.scenario, player_state: {})
      get "/break_escape/games/#{other.id}/objectives", as: :json
      existing = [response.status, response.body]
      refute_equal 200, existing.first
      get "/break_escape/games/#{other.id}/network", as: :json
      assert_equal existing, [response.status, response.body]
      post "/break_escape/games/#{other.id}/network/plant", params: { jack_id: 'comms_port' }, as: :json
      assert_equal existing, [response.status, response.body]
      post "/break_escape/games/#{other.id}/network/unplug", params: { jack_id: 'comms_port' }, as: :json
      assert_equal existing, [response.status, response.body]
      get "/break_escape/games/#{other.id}/network"
      assert_response :redirect
      assert_equal({}, other.reload.player_state['footholds'] || {})
    end
  end
end
