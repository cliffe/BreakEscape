require 'test_helper'
require_relative '../../support/network_model_scenario'

module BreakEscape
  # Networks slice 9.3b, sub-slice I (docs/achitechture/ACCESS_MODEL_SLICE_9_3B_PLAN.md,
  # sections 4.5, 5.5 and 6): POST /network/implant. A device plugged into a PC (not a jack)
  # grants a foothold on the PC's own network and nothing else: a dropped device an NPC uses,
  # or a BadUSB the player plugs into a PC they hold a session on.
  class NetworkImplantsTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    NS = NetworkModelScenario

    BADUSB = { 'id' => 'kit_badusb', 'type' => 'usb_stick', 'name' => 'Keystroke device',
               'takeable' => true, 'usbClass' => 'hid' }.freeze
    STICK = { 'id' => 'kit_stick', 'type' => 'usb_stick', 'name' => 'USB stick',
              'takeable' => true, 'droppable' => true }.freeze

    # NS's scenario plus: a BadUSB in the start inventory, a desk-side prop in the finance
    # office carrying a needsSession grant_foothold that targets lena_pc, and a timer whose
    # needsDropped grant_foothold targets sam_pc (the NPC-used stick).
    def implant_scenario
      data = NS.scenario
      data['startItemsInInventory'] = [BADUSB.dup, STICK.dup]
      data['rooms']['finance_office']['objects'] << {
        'id' => 'lena_usb_socket', 'type' => 'pc', 'name' => 'Desk USB socket',
        'triggerOnInteract' => [
          { 'type' => 'grant_foothold', 'pc' => 'lena_pc', 'needsSession' => true,
            'needsHeld' => 'kit_badusb', 'name' => 'BadUSB: Lena desk' }
        ]
      }
      data['timers'] = [
        { 'id' => 'sam_uses_stick', 'startOnGlobal' => 'stick_dropped',
          'actions' => [{ 'type' => 'grant_foothold', 'pc' => 'sam_pc', 'needsDropped' => 'kit_stick',
                          'name' => 'USB foothold: Sam desk' }] }
      ]
      data
    end

    def build_implants(player_state = {})
      build_network_game(player_state, implant_scenario)
    end

    def implant(pc_id, shape, path = nil)
      params = { pc_id: pc_id, shape: shape }
      params[:path] = path if path
      post game_path('network/implant'), params: params, as: :json
      response.parsed_body
    end

    def state
      @game.reload.player_state
    end

    # ---- the enumerator ----

    test 'grant_foothold_actions keeps only server-run paths, with the shape and pc' do
      build_implants
      actions = NetworkModel.grant_foothold_actions(@game.scenario_data)
      shapes = actions.map { |a| [a[:pc], a[:shape]] }.sort
      assert_equal [%w[lena_pc session], %w[sam_pc dropped]], shapes
    end

    # ---- dropped shape (N11, NPC use) ----

    test 'the dropped shape grants a foothold once the item is on the server drop record' do
      build_implants('droppedItems' => ['kit_stick'])
      body = implant('sam_pc', 'dropped')
      assert_response :success, body.inspect
      assert body['success']
      assert_equal 'implant_sam_pc', body['foothold']['id']
      assert_equal 'office_lan', body['foothold']['network']['id']
      # a foothold and nothing else: no session was created
      assert_nil state['sessions'] && state['sessions']['sam_pc']
      assert state['footholds'].key?('implant_sam_pc')
      assert_includes state['gainedFootholds'], 'sam_pc'
      # the dropped shape consumes nothing from the tray, so it names no consumedId (M1)
      assert_nil body['consumedId']
    end

    test 'the dropped shape is not ready until the item is dropped' do
      build_implants
      body = implant('sam_pc', 'dropped')
      assert_response :unprocessable_entity
      assert_equal 'not_ready', body['reason']
      refute state['footholds']&.key?('implant_sam_pc')
    end

    # ---- session shape (N12, BadUSB) ----

    def with_claim_at(pc_id, npc_id, extra = {})
      build_implants('sessions' => { pc_id => { 'id' => npc_id, 'via' => 'claim' }.merge(extra) })
    end

    test 'the session shape grants a foothold and consumes the device' do
      with_claim_at('lena_pc', 'lena')
      body = implant('lena_pc', 'session')
      assert_response :success, body.inspect
      assert body['success']
      assert_equal 'implant_lena_pc', body['foothold']['id']
      assert_equal 'office_lan', body['foothold']['network']['id']
      # the device is gone from the inventory
      refute_includes body['inventory'].map { |i| i['id'] }, 'kit_badusb'
      refute_includes state['inventory'].map { |i| i['id'] }, 'kit_badusb'
      # the link item arrived
      assert_includes body['inventory'].map { |i| i['id'] }, 'netlink_implant_lena_pc'
      # the answer names the one consumed device so the client reconciles only what changed (M1)
      assert_equal 'kit_badusb', body['consumedId']
    end

    test 'the session shape needs a non-foothold session, not a remote-through-foothold one' do
      with_claim_at('lena_pc', 'lena', 'via' => 'password', 'foothold' => 'jack_comms_port')
      body = implant('lena_pc', 'session')
      assert_response :unprocessable_entity
      assert_equal 'not_ready', body['reason']
      assert_includes state['inventory'].map { |i| i['id'] }, 'kit_badusb'
    end

    test 'the session shape needs the device in the inventory' do
      with_claim_at('lena_pc', 'lena')
      @game.player_state['inventory'] = @game.player_state['inventory'].reject { |i| i['id'] == 'kit_badusb' }
      @game.save!
      body = implant('lena_pc', 'session')
      assert_response :unprocessable_entity
      assert_equal 'not_ready', body['reason']
    end

    test 'the USB policy refuses the device at the use' do
      data = implant_scenario
      data['policies']['usb_locked'] = { 'remote' => 'allowed', 'usb' => 'blocked' }
      data['rooms']['finance_office']['objects'].find { |o| o['id'] == 'lena_pc' }['policy'] = 'usb_locked'
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
        scenario: data,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => NetworkRequests::OPEN_ROOMS.dup,
                        'encounteredNPCs' => %w[sam lena ian],
                        'sessions' => { 'lena_pc' => { 'id' => 'lena', 'via' => 'claim' } } }
      )
      body = implant('lena_pc', 'session')
      assert_response :unprocessable_entity
      assert_equal 'usb_refused', body['reason']
      assert_equal 'USB devices are disabled on this PC.', body['error']
      assert_includes state['inventory'].map { |i| i['id'] }, 'kit_badusb'
    end

    # ---- already held, and idempotence (m2) ----

    test 'a repeat session implant answers already, even after the device is consumed' do
      with_claim_at('lena_pc', 'lena')
      implant('lena_pc', 'session')
      body = implant('lena_pc', 'session')
      assert_response :success
      assert body['already']
      assert_equal 1, state['footholds'].keys.count { |k| k == 'implant_lena_pc' }
      # The retry after a lost response reconciles the same device the first call consumed (R2 M1).
      assert_equal 'kit_badusb', body['consumedId']
    end

    test 'a repeat dropped implant answers already and names no consumedId' do
      build_implants('droppedItems' => ['kit_stick'])
      implant('sam_pc', 'dropped')
      body = implant('sam_pc', 'dropped')
      assert_response :success
      assert body['already']
      assert_nil body['consumedId']
    end

    # ---- reach: the PC's own network only ----

    test 'the implant foothold reaches only the PC own network' do
      build_implants('droppedItems' => ['kit_stick'])
      implant('sam_pc', 'dropped')
      view = network_view('implant_sam_pc')
      entry = view['footholds'].find { |f| f['id'] == 'implant_sam_pc' }
      host_ids = entry['hosts'].map { |h| h['id'] }
      assert_includes host_ids, 'kiosk_pc' # an office_lan host
      refute_includes host_ids, 'bench_pc' # a workshop_lan host
    end

    # Sub-slice K's segmentation rule still holds for an implant foothold (not only a
    # planted jack): the foothold reaches its own network, and a network linked to it is
    # reached only by pivoting through a held session, never by the bare foothold.
    def implant_scenario_with_link
      data = implant_scenario
      data['networks']['server_net'] = { 'name' => NS::SERVER_NAME }
      data['networkLinks'] = [%w[office_lan server_net]]
      data['rooms']['server_room']['objects'] << {
        'id' => 'sv_fs02', 'type' => 'pc', 'name' => 'Server file host', 'host' => NS::SV_HOST,
        'network' => 'server_net', 'locked' => true, 'lockType' => 'login',
        'access' => { 'roles' => ['it'] }, 'policy' => 'counted'
      }
      data
    end

    test 'an implant foothold reaches its own network only, not a linked one, without a pivot' do
      @game = build_network_game({ 'droppedItems' => ['kit_stick'] }, implant_scenario_with_link)
      implant('sam_pc', 'dropped')
      view = network_view('implant_sam_pc')
      entry = view['footholds'].find { |f| f['id'] == 'implant_sam_pc' }
      nets = entry['networks'].map { |n| n['id'] }
      assert_includes nets, 'office_lan'        # the PC's own network
      refute_includes nets, 'server_net'        # the link needs a pivot through a held session
    end

    # ---- tampered-client checks ----

    test 'a forged implant on a PC with no grant_foothold action is refused 404' do
      build_implants
      body = implant('kiosk_pc', 'session')
      assert_response :not_found
      assert_equal 'no_action', body['reason']
    end

    test 'an implant with a bad shape is a bad request' do
      build_implants
      post game_path('network/implant'), params: { pc_id: 'lena_pc', shape: 'nonsense' }, as: :json
      assert_response :bad_request
    end

    test 'the view 404s a foothold the server never granted' do
      build_implants
      view = network_view('implant_lena_pc')
      assert_response :not_found
      assert_match(/Foothold not found/, view['error'])
    end
  end
end
