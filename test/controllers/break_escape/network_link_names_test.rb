require 'test_helper'
require_relative '../../support/network_model_scenario'

module BreakEscape
  # UX feedback round slice 1, o-link-names (docs/achitechture/UX_FEEDBACK_ROUND_PLAN.md):
  # the server writes one name pattern, "<device>: <place>", into each foothold record at
  # grant. The place is the source object's room for a physical kind and the network for
  # Wi-Fi. An authored linkName (or a grant_foothold action's name) still wins, and a record
  # granted before this keeps the name it had.
  class NetworkLinkNamesTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    NS = NetworkModelScenario
    BADUSB = { 'id' => 'kit_badusb', 'type' => 'usb_stick', 'name' => 'Keystroke device',
               'takeable' => true, 'usbClass' => 'hid' }.freeze
    STICK = { 'id' => 'kit_stick', 'type' => 'usb_stick', 'name' => 'USB stick',
              'takeable' => true, 'droppable' => true }.freeze

    def state
      @game.reload.player_state
    end

    def link_name(foothold_id)
      state['inventory'].find { |i| i['id'] == "netlink_#{foothold_id}" }&.dig('name')
    end

    # NS's scenario with both implant shapes and no authored names, plus a Wi-Fi access point
    def names_scenario(implant_names: false)
      data = NS.scenario
      data['startItemsInInventory'] = [BADUSB.dup, STICK.dup]
      session = { 'type' => 'grant_foothold', 'pc' => 'lena_pc', 'needsSession' => true, 'needsHeld' => 'kit_badusb' }
      dropped = { 'type' => 'grant_foothold', 'pc' => 'sam_pc', 'needsDropped' => 'kit_stick' }
      if implant_names
        session['name'] = 'BadUSB: Lena desk'
        dropped['name'] = 'USB foothold: Sam desk'
      end
      data['rooms']['finance_office']['objects'] << { 'id' => 'lena_usb_socket', 'type' => 'pc', 'name' => 'Desk USB socket',
                                                      'triggerOnInteract' => [session] }
      data['timers'] = [{ 'id' => 'sam_uses_stick', 'startOnGlobal' => 'stick_dropped', 'actions' => [dropped] }]
      data['networks']['guest_wifi'] = { 'name' => 'Guest Wi-Fi', 'wifi' => { 'ssid' => 'Harbour-Guest' } }
      data['rooms']['lobby']['objects'] << { 'id' => 'guest_ap', 'type' => 'pc', 'sprite' => 'wifi_ap1',
                                             'name' => 'Guest access point', 'wifiAp' => true, 'network' => 'guest_wifi' }
      data
    end

    def implant(pc_id, shape)
      post game_path('network/implant'), params: { pc_id: pc_id, shape: shape }, as: :json
      response.parsed_body
    end

    def join(ap_id)
      post game_path('network/join'), params: { ap_id: ap_id }, as: :json
      response.parsed_body
    end

    test 'a drop box at a jack with no linkName is named "Drop box: <room>", stored on the foothold record' do
      build_network_game({}, names_scenario)
      take_drop_box
      body = plant('bench_port')
      assert_response :success, body.inspect
      assert_equal 'Drop box: Workshop', state['footholds']['jack_bench_port']['name']
      assert_equal 'Drop box: Workshop', body.dig('foothold', 'name')
      assert_equal 'Drop box: Workshop', link_name('jack_bench_port')
    end

    test 'an authored linkName on the jack still wins' do
      build_network_game({}, names_scenario)
      take_drop_box
      plant('comms_port')
      assert_response :success
      assert_equal 'Drop box: comms room', state['footholds']['jack_comms_port']['name']
      assert_equal 'Drop box: comms room', link_name('jack_comms_port')
    end

    test 'a door sign names the room, as the client does' do
      data = names_scenario
      data['rooms']['workshop']['door_sign'] = 'Bench workshop'
      build_network_game({}, data)
      take_drop_box
      plant('bench_port')
      assert_equal 'Drop box: Bench workshop', link_name('jack_bench_port')
    end

    test 'a keystroke injector is named "Keystroke injector: <room>"' do
      build_network_game({ 'sessions' => { 'lena_pc' => { 'id' => 'lena', 'via' => 'claim' } } }, names_scenario)
      body = implant('lena_pc', 'session')
      assert_response :success, body.inspect
      assert_equal 'Keystroke injector: Finance Office', state['footholds']['implant_lena_pc']['name']
      assert_equal 'Keystroke injector: Finance Office', link_name('implant_lena_pc')
    end

    test 'a dropped USB stick is named "USB stick: <room>"' do
      build_network_game({ 'droppedItems' => ['kit_stick'] }, names_scenario)
      body = implant('sam_pc', 'dropped')
      assert_response :success, body.inspect
      assert_equal 'USB stick: Desk Room', link_name('implant_sam_pc')
    end

    test 'a grant_foothold action name still wins for both implant shapes' do
      build_network_game({ 'droppedItems' => ['kit_stick'], 'sessions' => { 'lena_pc' => { 'id' => 'lena', 'via' => 'claim' } } },
                         names_scenario(implant_names: true))
      implant('lena_pc', 'session')
      implant('sam_pc', 'dropped')
      assert_equal 'BadUSB: Lena desk', link_name('implant_lena_pc')
      assert_equal 'USB foothold: Sam desk', link_name('implant_sam_pc')
    end

    test 'a Wi-Fi link is named "Wi-Fi: <network>"' do
      build_network_game({}, names_scenario)
      body = join('guest_ap')
      assert_response :success, body.inspect
      assert_equal 'Wi-Fi: Guest Wi-Fi', state['footholds']['wifi_guest_wifi']['name']
      assert_equal 'Wi-Fi: Guest Wi-Fi', link_name('wifi_guest_wifi')
    end

    test 'a jack planted before the default names keeps the name it had' do
      build_network_game({}, names_scenario)
      take_drop_box
      plant('bench_port')
      @game.reload
      @game.player_state['footholds']['jack_bench_port'].delete('name')
      @game.save!
      get game_path('scenario'), as: :json
      assert_response :success
      held = response.parsed_body['footholds'].find { |f| f['id'] == 'jack_bench_port' }
      assert_equal 'Network drop box: Bench switch', held['name']
    end

    # A second drop box and a second jack in the workshop, beside bench_port (code review R1 n5, n4)
    def two_jack_scenario(second_jack)
      data = names_scenario
      data['rooms']['lobby']['objects'] << NS::DROP_BOX.merge('id' => 'kit_dropbox2')
      data['rooms']['workshop']['objects'] << { 'id' => 'bench_port_b', 'type' => 'pc', 'networkJack' => true }.merge(second_jack)
      data
    end

    def plant_both
      take_drop_box
      post game_path('inventory'), params: { action_type: 'add', item: { type: 'pc', id: 'kit_dropbox2', name: 'Network drop box' } },
                                   as: :json
      assert_response :success, response.body
      assert_response :success, plant('bench_port', 'kit_dropbox').inspect
      body = plant('bench_port_b', 'kit_dropbox2')
      assert_response :success, body.inspect
      body
    end

    test 'two drop boxes in one room: the second adds its jack name, so the link items differ' do
      build_network_game({}, two_jack_scenario('name' => 'Spare bench port'))
      body = plant_both
      assert_equal 'Drop box: Workshop', link_name('jack_bench_port')
      assert_equal 'Drop box: Workshop, Spare bench port', link_name('jack_bench_port_b')
      assert_equal 'Drop box: Workshop, Spare bench port', state['footholds']['jack_bench_port_b']['name']
      assert_equal 'Drop box: Workshop, Spare bench port', body.dig('foothold', 'name')
    end

    test 'a jack with no name is named readably, never by its raw id' do
      build_network_game({}, two_jack_scenario({}))
      plant_both
      assert_equal 'Drop box: Workshop, Bench port b', link_name('jack_bench_port_b')
      source = network_view('jack_bench_port_b')['footholds'][0]['source']
      assert_equal({ 'name' => 'Bench port b', 'room' => 'Workshop' }, source)
    end

    test 'the view names the source object and its room for the subtitle' do
      build_network_game({}, names_scenario)
      take_drop_box
      plant('bench_port')
      body = network_view('jack_bench_port')
      assert_response :success
      assert_equal({ 'name' => 'Bench switch', 'room' => 'Workshop' }, body['footholds'][0]['source'])
      join('guest_ap')
      wifi = network_view('wifi_guest_wifi')['footholds'][0]
      assert_equal({ 'name' => 'Guest access point', 'room' => 'Lobby' }, wifi['source'])
    end
  end
end
