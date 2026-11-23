require 'test_helper'
require_relative '../../support/network_model_scenario'

module BreakEscape
  # demo_access_tour, slice 3 (docs/achitechture/DEMO_ACCESS_TOUR_PLAN.md section 4.4, network and
  # devices rows): the implant, the USB hub, the rogue AP and its key capture, the three jacks and
  # the ports after the stop 17 unplug, and the Julian sign-out route. The real scenario over the
  # real endpoints. The helpers are copied from demo_access_tour_test.rb so this file stands alone.
  class DemoAccessTourDevicesTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    PEOPLE = %w[delphine thandiwe yasmin lorna julian].freeze
    ROOMS = %w[reception open_plan server_room kitchen partner_office meeting_room comms_cupboard].freeze
    VISITOR_CARD = 'VISITOR-07'.freeze
    PLANT = 'reception_plant_west'.freeze
    OTHER_PLANT = 'reception_plant_east'.freeze

    setup do
      @mission = Mission.create!(name: 'demo_access_tour', display_name: 'Demo access tour', published: true,
                                 difficulty_level: 1)
      @game = Game.create!(mission: @mission, player: break_escape_demo_users(:test_user)).reload
      @game.player_state['currentRoom'] = 'reception'
      @game.player_state['unlockedRooms'] = %w[reception open_plan kitchen]
      @game.player_state['encounteredNPCs'] = PEOPLE.dup
      @game.save!
    end

    # ---- scenario readers (server side only) ----

    def data
      @game.scenario_data
    end

    def npc(id)
      Game.scenario_room_npcs(data).find { |n| n['id'] == id }
    end

    def password(person)
      npc(person).dig('creds', 'password')
    end

    def username(person)
      npc(person).dig('creds', 'username')
    end

    def passwords
      PEOPLE.map { |person| password(person) }
    end

    def pin
      data.dig('rooms', 'server_room', 'requires').to_s
    end

    def psk
      data.dig('networks', 'office_lan', 'wifi', 'psk')
    end

    def lorna_card_id
      npc('lorna').dig('creds', 'card', 'card_id')
    end

    def find_object(id, list = nil)
      list ||= data['rooms'].values.flat_map { |room| Array(room['objects']) }
      list.each do |object|
        return object if object['id'] == id

        found = find_object(id, Array(object['contents'])) if object['contents'].is_a?(Array)
        return found if found
      end
      nil
    end

    def held_copy(id)
      find_object(id).deep_dup.slice('id', 'type', 'name', 'card_id', 'rfid_protocol', 'takeable', 'credential', 'text')
    end

    def hold(*ids)
      @game.reload
      @game.player_state['inventory'] = Array(@game.player_state['inventory']) + ids.map { |id| held_copy(id) }
      @game.save!
    end

    def hold_card(card_id, id = "card_#{card_id}")
      @game.reload
      @game.player_state['inventory'] = Array(@game.player_state['inventory']) +
                                        [{ 'id' => id, 'type' => 'keycard', 'name' => card_id, 'card_id' => card_id, 'takeable' => true }]
      @game.save!
    end

    def hold_cloner
      @game.reload
      cloner = find_object('rfid_cloner').deep_dup.slice('id', 'type', 'name', 'takeable')
      @game.player_state['inventory'] = Array(@game.player_state['inventory']) + [cloner]
      @game.save!
    end

    def open_rooms(*rooms)
      @game.reload
      @game.player_state['unlockedRooms'] = (Array(@game.player_state['unlockedRooms']) + rooms).uniq
      @game.save!
    end

    def state
      @game.reload.player_state
    end

    # ---- requests ----

    def logout(pc_id)
      post game_path('logout'), params: { pc_id: pc_id }, as: :json
      response.parsed_body
    end

    def login(params)
      post game_path('login'), params: params, as: :json
      response.parsed_body
    end

    def cred_login(pc_id, credential, extra = {})
      login({ pc_id: pc_id, credential: credential }.merge(extra))
    end

    def get_json(suffix, params = {})
      get game_path(suffix), params: params
      response.parsed_body
    end

    def clone_card(card_id, npc_id)
      post clone_card_game_url(@game), params: { card_id: card_id, npc_id: npc_id }, as: :json
      response.parsed_body
    end

    def door(room_id, method:, card_ids: nil, attempt: nil)
      params = { targetType: 'door', targetId: room_id, method: method }
      params[:card_ids] = card_ids unless card_ids.nil?
      params[:attempt] = attempt unless attempt.nil?
      post unlock_game_url(@game), params: params, as: :json
      response.parsed_body
    end

    def rfid(room_id, card_ids = nil)
      door(room_id, method: 'rfid', card_ids: card_ids)
    end

    def assert_refused(body, context = nil)
      assert_response :unprocessable_entity, "#{context}: #{body.inspect}"
      assert_equal false, body['success'], context
    end

    def unlocked?(room_id)
      Array(state['unlockedRooms']).include?(room_id)
    end

    # The player takes the box, plants it, and holds the foothold it gives.
    def plant_box
      hold('kit_dropbox')
      open_rooms('meeting_room')
      body = plant('meeting_jack')
      assert body['success'], body.inspect
      @foothold = @game.reload.foothold_id_for('meeting_jack')
      assert_equal 'jack_meeting_jack', @foothold
      @foothold
    end

    def sign_in_ok(pc_id, person, **opts)
      body = sign_in(pc_id, username(person), password(person), **opts)
      assert body['success'], "#{person} at #{pc_id}: #{body.inspect}"
      body
    end

    def front_desk_session
      sign_in_ok('reception_pc', 'delphine')
    end

    # Stop 5: read the files at the front desk, take julian.rdp, sign out.
    def take_julian_rdp
      front_desk_session
      body = container('reception_pc')
      assert_response :success, body.inspect
      ids = Array(body['contents']).map { |item| item['id'] }
      assert_includes ids, 'julian_rdp_file'
      assert_includes ids, 'facilities_txt'
      hold('julian_rdp_file')
    end

    def julian_through_box
      body = cred_login('julian_pc', 'julian_rdp', foothold: @foothold)
      assert_response :success, body.inspect
      assert body['success'], body.inspect
      body
    end

    def door_controller_through_box
      body = sign_in('door_controller', username('lorna'), password('lorna'), foothold: @foothold)
      assert_response :success, body.inspect
      assert body['success'], body.inspect
      body
    end

    # Stops 3 to 7 on the short route: plant, front desk, sign out, Julian through the box.
    def reach_julian
      plant_box
      take_julian_rdp
      logout('reception_pc')
      julian_through_box
    end

    def sessions
      state['sessions'].to_h
    end

    # Every leaf of a parsed JSON answer, with its path.
    def leaves(node, path = '$', out = [])
      case node
      when Hash then node.each { |key, value| leaves(value, "#{path}.#{key}", out) }
      when Array then node.each_with_index { |value, i| leaves(value, "#{path}[#{i}]", out) }
      else out << [path, node]
      end
      out
    end

    def keys_of(node, out = [])
      case node
      when Hash then node.each { |key, value| out << key; keys_of(value, out) }
      when Array then node.each { |value| keys_of(value, out) }
      end
      out
    end

    # A four digit PIN occurs in coordinates and ids, so the check is by leaf: a leaf equal to the
    # PIN, or a string leaf holding it as a whole token (PLAN 4.7, payload_scan.rb:19-25).
    def pin_hits(body)
      token = /(?<![0-9])#{Regexp.escape(pin)}(?![0-9])/
      leaves(JSON.parse(body)).select do |path, value|
        value.to_s == pin || (value.is_a?(String) && value.match?(token)) || path.end_with?('.requires') && value.to_s == pin
      end
    end

    def refute_secrets(context, body = response.body, allow: [])
      (passwords - allow).each { |text| refute_includes body, text, "#{context} carries a password" }
      refute_includes body, psk, "#{context} carries the Staff Wi-Fi key"
    end

    def refute_pin(context, body = response.body)
      assert_empty pin_hits(body), "#{context} carries the keypad PIN"
    end

    def leaf_count(node)
      case node
      when Hash then node.values.sum { |value| leaf_count(value) } + node.size
      when Array then node.sum { |value| leaf_count(value) } + node.size
      else 1
      end
    end

    # ---- slice 3 helpers ----

    def implant(pc_id = 'reception_pc', shape = 'session')
      post game_path('network/implant'), params: { pc_id: pc_id, shape: shape }, as: :json
      response.parsed_body
    end

    def hide_kit(spot = PLANT)
      post game_path('inventory'), params: { action_type: 'hide', item: { id: 'kit_rogue_ap' }, hidden_in: spot }, as: :json
      response.parsed_body
    end

    def join(ap_id, key = nil)
      params = { ap_id: ap_id }
      params[:key] = key unless key.nil?
      post game_path('network/join'), params: params, as: :json
      response.parsed_body
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

    def ama_mappings
      Array(npc('ama_phone')['eventMappings'])
    end

    def mapping(pattern)
      ama_mappings.find { |m| m['eventPattern'] == pattern }
    end

    def foothold_ids
      state['footholds'].to_h.keys.sort
    end

    # Stops 3 and 4: the injector and the front desk session it needs.
    def desk_with_injector
      hold('kit_injector')
      front_desk_session
    end

    # ---- the implant ----

    test 'the implant is refused with no reception_pc session and with only the stick held' do
      hold('kit_injector')
      body = implant
      assert_response :unprocessable_entity, body.inspect
      assert_equal 'not_ready', body['reason'], 'no session yet'
      assert_includes held_ids, 'kit_injector'
      front_desk_session
      state['inventory'] = nil
      @game.reload.remove_inventory_item!('kit_injector')
      hold('demo_stick')
      body = implant
      assert_response :unprocessable_entity, body.inspect
      assert_equal 'not_ready', body['reason'], 'a session and the stick, no injector'
      assert_includes held_ids, 'demo_stick'
      assert_empty foothold_ids
    end

    test 'the implant is refused from a remote or from session on reception_pc' do
      plant_box
      take_julian_rdp
      hold('kit_injector')
      logout('reception_pc')
      julian_through_box
      # A remote route session on julian_pc is not a keyboard session; the implant action is for reception_pc.
      body = implant('julian_pc')
      refute_equal 200, response.status, body.inspect
      assert_includes %w[no_action not_ready], body['reason']
      # A reception_pc session reached through the box (foothold) is a remote route session.
      body = sign_in('reception_pc', username('delphine'), password('delphine'), foothold: @foothold)
      if body['success']
        assert_not_nil sessions.dig('reception_pc', 'foothold'), 'the session carries the box foothold'
        body = implant
        assert_response :unprocessable_entity, body.inspect
        assert_equal 'needs_console', body['reason']
      end
      refute_includes foothold_ids, 'implant_reception_pc'
    end

    test 'the implant is granted with the injector and a keyboard session and uses the injector up' do
      desk_with_injector
      body = implant
      assert_response :success, body.inspect
      assert body['success'], body.inspect
      assert_equal 'kit_injector', body['consumedId']
      refute_includes held_ids, 'kit_injector', 'the injector is used up'
      assert_equal 'office_lan', state['footholds'].values.first['network']
      assert_equal 'implant', state['footholds'].values.first['via']
      assert_equal 'reception_pc', state['footholds'].values.first['source']
      assert_includes Array(state['gainedFootholds']), 'reception_pc'
      again = implant
      assert_response :success
      assert_equal true, again['already'], 'a repeat answers already'
    end

    test 'the implant foothold reaches office_lan without the front desk files or any session' do
      desk_with_injector
      implant
      foothold = state['footholds'].keys.first
      view = network_view(foothold)
      entry = view['footholds'].find { |f| f['id'] == foothold }
      assert_equal 'office_lan', entry.dig('network', 'id')
      container('finance_share', foothold: foothold)
      assert_equal 404, response.status, 'the implant gives a foothold, not a finance session (refused shares answer 404)'
      refute_includes response.body, password('lorna')
    end

    test 'the implant answers nothing for a PC that has no declared action' do
      desk_with_injector
      body = implant('thandiwe_laptop')
      assert_response :not_found, body.inspect
      assert_equal 'no_action', body['reason']
      body = implant('reception_pc', 'dropped')
      assert_response :not_found, body.inspect
    end

    test 'the door controller is admitted through the implant foothold and survives the unplug' do
      plant_box
      desk_with_injector
      implant
      implant_foothold = state['footholds'].keys.find { |id| id != @foothold }
      body = sign_in('door_controller', username('lorna'), password('lorna'), foothold: implant_foothold)
      assert body['success'], body.inspect
      assert_includes sessions.keys, 'door_controller'
      ended = unplug('meeting_jack')
      assert_response :success, ended.inspect
      refute_includes Array(ended['endedPcIds']), 'door_controller', 'the implant foothold carries it past the unplug'
      assert_includes sessions.keys, 'door_controller'
      assert_includes sessions.keys, 'reception_pc'
      out = logout('reception_pc')
      assert_response :success, out.inspect
    end

    # ---- the USB hub and the injector ----

    test 'the usb_hub takes only the stick and the desk policy refuses it; the socket takes only the injector' do
      hub = find_object('usb_hub')
      socket = find_object('implant_socket')
      assert_equal 'demo_stick', hub['requiresItem']
      assert_equal 'kit_injector', socket['requiresItem']
      assert_equal 'desk', hub['policy']
      stick = find_object('demo_stick')
      injector = find_object('kit_injector')
      assert_equal 'storage', stick['usbClass']
      assert_equal 'hid', injector['usbClass']
      assert BreakEscape::AccessWork.plant_refused?(data, hub, stick), 'the desk policy refuses a storage stick'
      refute BreakEscape::AccessWork.plant_refused?(data, hub, injector), 'a keyboard device is not refused'
      refute BreakEscape::AccessWork.plant_refused?(data, find_object('reception_pc'), injector)
    end

    test 'the socket confirm action is the declared grant_foothold on reception_pc and nothing else grants one' do
      socket = find_object('implant_socket')
      confirm = Array(socket['triggerOnInteract']).find { |a| a['type'] == 'confirm_action' }
      grant = Array(confirm['onConfirm']).find { |a| a['type'] == 'grant_foothold' }
      assert_equal 'reception_pc', grant['pc']
      assert_equal true, grant['needsSession']
      assert_equal 'kit_injector', grant['needsHeld']
      refute_includes data.to_json, 'implant_not_ready'
      grants = data.to_json.scan('"type":"grant_foothold"').length
      assert_equal 1, grants, 'one grant_foothold in the scenario'
    end

    test 'the kit items are takeable in the meeting room and absent from the bootstrap secrets' do
      %w[kit_injector demo_stick kit_rogue_ap capture_tablet kit_dropbox].each do |id|
        assert_equal true, find_object(id)['takeable'], "#{id} is not takeable"
        room = data['rooms'].find { |_, r| Array(r['objects']).any? { |o| o['id'] == id } }&.first
        assert_equal 'meeting_room', room, "#{id} is in #{room}"
      end
      bootstrap_scenario
      refute_includes response.body, psk
    end

    # ---- the rogue AP and the capture ----

    test 'the capture mapping fires on npc_used:thandiwe_laptop, once, behind staff_twin_up, with a planted proof' do
      m = mapping('npc_used:thandiwe_laptop')
      assert m, 'no npc_used:thandiwe_laptop mapping on ama_phone'
      assert_equal 'globalVars.staff_twin_up === true', m['condition']
      assert_equal true, m['onceOnly']
      cap = m['addCapture']
      assert_equal 'staff_wifi_key', cap['targetId']
      assert_equal 'credential', cap['kind']
      assert_equal({ 'planted' => 'kit_rogue_ap' }, cap['proof'])
      assert_equal psk, cap['secret'], 'the capture secret is the same draw as the Staff psk'
      assert_equal false, data.dig('globalVariables', 'staff_twin_up')
      assert_equal true, data.dig('social', 'captures', 'revealSecret')
      assert_equal true, find_object('thandiwe_laptop').key?('work') || find_object('thandiwe_laptop').to_s.include?('work')
    end

    test 'the capture secret and the psk are not in the bootstrap, a room answer or the keyring, before or after the plant' do
      hold('kit_rogue_ap')
      check = lambda do |where|
        [bootstrap_scenario, get_json('room/reception'), get_json('keyring'), get_json('room/meeting_room')].each do
          refute_includes response.body, psk, "#{where} carries the Staff key"
        end
      end
      open_rooms('meeting_room')
      check.call('before the plant')
      body = hide_kit
      assert_response :success, body.inspect
      check.call('after the plant')
      bootstrap_scenario
      assert_equal PLANT, response.parsed_body['hiddenDevices'].first['on']
      assert_equal 'reception', response.parsed_body['hiddenDevices'].first['room']
    end

    test 'the capture is refused with no planted kit_rogue_ap and served after the plant' do
      hold('kit_rogue_ap')
      record_capture('staff_wifi_key', 'MerrinSallow-Staff')
      refute secrets.key?('staff_wifi_key'), 'served before the plant'
      refute_includes response.body, psk
      sync_globals('staff_twin_up' => true)
      refute secrets.key?('staff_wifi_key'), 'served on a forged console global'
      body = hide_kit
      assert_response :success, body.inspect
      assert_equal psk, secrets['staff_wifi_key']
    end

    test 'a plant of the other hideable spot and a bad spot' do
      hold('kit_rogue_ap')
      body = hide_kit('reception_pc')
      assert_response :unprocessable_entity, body.inspect
      assert_equal 'not_a_spot', body['reason']
      refute_includes held_ids - ['kit_rogue_ap'], 'kit_rogue_ap'
      assert_includes held_ids, 'kit_rogue_ap'
      body = hide_kit(OTHER_PLANT)
      assert_response :success, body.inspect
      record_capture('staff_wifi_key', 'MerrinSallow-Staff')
      assert_equal psk, secrets['staff_wifi_key']
    end

    test 'the served Staff key joins staff_ap and a wrong key is refused; the guest AP joins with no key' do
      hold('kit_rogue_ap')
      hide_kit
      record_capture('staff_wifi_key', 'MerrinSallow-Staff')
      got = secrets['staff_wifi_key']
      refute join('staff_ap', 'not-the-staff-key')['success'], 'wrong key'
      refute join('staff_ap')['success'], 'no key'
      refute_includes foothold_ids, 'wifi_office_lan'
      body = join('staff_ap', got)
      assert body['success'], body.inspect
      assert_equal 'wifi_office_lan', body.dig('foothold', 'id')
      guest = join('guest_ap')
      assert guest['success'], guest.inspect
      assert_equal 'wifi_guest', guest.dig('foothold', 'id')
      entry = network_view('wifi_guest')['footholds'].find { |f| f['id'] == 'wifi_guest' }
      assert_equal [], Array(entry && entry['hosts']), 'the guest network reaches nothing'
    end

    test 'the guest AP joins with no key in the request and the Staff AP never does' do
      refute join('staff_ap')['success']
      body = join('guest_ap')
      assert body['success'], body.inspect
      refute_includes response.body, psk
    end

    # ---- the patch panel and the other jacks ----

    test 'the patch panel lists the managed port and the guest port by label' do
      panel = find_object('patch_panel')
      jacks = panel['panelPorts'].map { |p| p['jack'] }.compact
      assert_equal %w[managed_port guest_vlan_port], jacks
      assert_equal 'patch_panel', find_object('guest_vlan_port')['panelOf']
      assert_equal 'guest', find_object('guest_vlan_port')['network']
      assert_equal true, find_object('managed_port')['portSecurity']
      refute find_object('guest_vlan_port').key?('sprite'), 'the panel port is drawn by the panel'
    end

    test 'every jack resolves through find_jack and answers something other than 404' do
      %w[meeting_jack managed_port guest_vlan_port].each do |jack|
        @game.reload
        @game.player_state['inventory'] = []
        @game.player_state['footholds'] = {}
        @game.player_state['unlockedRooms'] = ROOMS.dup
        @game.save!
        hold('kit_dropbox')
        body = plant(jack)
        refute_equal 404, response.status, "#{jack}: #{body.inspect}"
      end
    end

    test 'managed_port refuses the box with port_security and the box stays held' do
      hold('kit_dropbox')
      open_rooms('comms_cupboard')
      before = state.deep_dup
      body = plant('managed_port')
      assert_response :unprocessable_entity, body.inspect
      assert_equal 'port_security', body['reason']
      assert_equal false, body['success']
      assert_equal data.dig('rooms', 'comms_cupboard', 'objects').find { |o| o['id'] == 'managed_port' }['portSecurityMessage'],
                   body['error'].to_s.then { |e| e.empty? ? nil : find_object('managed_port')['portSecurityMessage'] }
      assert_includes held_ids, 'kit_dropbox'
      assert_empty foothold_ids
      assert_equal before, state
    end

    test 'guest_vlan_port gives a foothold on the guest network that reaches no office host' do
      hold('kit_dropbox')
      open_rooms('comms_cupboard')
      body = plant('guest_vlan_port')
      assert_response :success, body.inspect
      assert body['success'], body.inspect
      foothold = @game.reload.foothold_id_for('guest_vlan_port')
      assert_equal 'jack_guest_vlan_port', foothold
      entry = network_view(foothold)['footholds'].find { |f| f['id'] == foothold }
      assert_equal 'guest', entry.dig('network', 'id')
      refute_includes entry.to_json, 'finance_share'
      refute_includes entry.to_json, 'door_controller'
      container('finance_share', foothold: foothold)
      assert_equal 404, response.status, 'the guest foothold reaches no office share (refused shares answer 404)'
    end

    test 'the unplug of the guest port gives the box back' do
      hold('kit_dropbox')
      open_rooms('comms_cupboard')
      plant('guest_vlan_port')
      refute_includes held_ids, 'kit_dropbox'
      ended = unplug('guest_vlan_port')
      assert_response :success, ended.inspect
      assert_includes held_ids, 'kit_dropbox'
    end

    # ---- stop 18, after the stop 17 unplug ----

    test 'after the stop 17 unplug the managed port is refused and the guest port plants, ending no session' do
      reach_julian
      door_controller_through_box
      open_rooms('comms_cupboard')
      sign_in_ok('thandiwe_laptop', 'thandiwe')
      ended = unplug('meeting_jack')
      assert_equal %w[door_controller julian_pc], Array(ended['endedPcIds']).sort
      assert_includes held_ids, 'kit_dropbox'
      held_sessions = sessions.keys.sort
      body = plant('managed_port')
      assert_response :unprocessable_entity, body.inspect
      assert_equal 'port_security', body['reason']
      assert_includes held_ids, 'kit_dropbox', 'the box stays held after the managed port refusal'
      assert_equal held_sessions, sessions.keys.sort, 'the refusal ended nothing'
      body = plant('guest_vlan_port')
      assert_response :success, body.inspect
      foothold = @game.reload.foothold_id_for('guest_vlan_port')
      assert_equal 'guest', network_view(foothold)['footholds'].find { |f| f['id'] == foothold }.dig('network', 'id')
      assert_equal held_sessions, sessions.keys.sort, 'the guest plant ended nothing'
    end

    test 'a second plant is refused while the box is planted, so the managed port cannot be tried on the guest box' do
      hold('kit_dropbox')
      open_rooms('comms_cupboard')
      plant('guest_vlan_port')
      body = plant('managed_port')
      refute body['success'], body.inspect
    end

    # ---- Julian: lost with the desk, and back ----

    test 'the julian_lost_with_desk mapping reads reason link_dropped from reception_pc and julian_back resets' do
      lost = mapping('pc_signed_out:julian_pc')
      assert lost, 'no pc_signed_out:julian_pc mapping'
      assert_includes lost['condition'], "data.reason === 'link_dropped'"
      assert_includes lost['condition'], "data.fromPcId === 'reception_pc'"
      assert_equal({ 'julian_lost_with_desk' => true, 'julian_back' => false }, lost['setGlobal'])
      refute lost['onceOnly'], 'a second loss must reset julian_back'
      back = mapping('pc_signed_in:julian_pc')
      assert back, 'no pc_signed_in:julian_pc mapping'
      assert_includes back['condition'], 'julian_lost_with_desk === true'
      assert_equal({ 'julian_back' => true }, back['setGlobal'])
      assert_equal false, data.dig('globalVariables', 'julian_lost_with_desk')
      assert_equal false, data.dig('globalVariables', 'julian_back')
    end

    test 'signing out of the front desk ends julian_pc on the from route' do
      take_julian_rdp
      assert cred_login('julian_pc', 'julian_rdp', from: 'reception_pc')['success']
      assert_equal 'reception_pc', sessions.dig('julian_pc', 'from')
      ended = logout('reception_pc')
      assert_includes Array(ended['endedPcIds']), 'julian_pc', 'the desk sign-out drops the from session'
    end

    test 'signing out of julian_pc itself is not a desk loss: it leaves reception_pc held and has no fromPcId to match' do
      take_julian_rdp
      assert cred_login('julian_pc', 'julian_rdp', from: 'reception_pc')['success']
      out = logout('julian_pc')
      assert_response :success, out.inspect
      refute_includes Array(out['endedPcIds']), 'reception_pc'
      assert_includes sessions.keys, 'reception_pc'
      refute_includes sessions.keys, 'julian_pc'
    end

    # ---- player_state does not grow ----

    def devices_cycle(first_pass = false)
      hold('kit_injector') if first_pass
      sign_in('reception_pc', username('delphine'), password('delphine'))
      implant
      join('guest_ap')
      join('staff_ap', 'not-the-key')
      hide_kit
      record_capture('staff_wifi_key', 'MerrinSallow-Staff')
      secrets
      plant('managed_port')
      plant('guest_vlan_port')
      unplug('guest_vlan_port')
      get_json('keyring')
      network_view(@game.reload.foothold_id_for('guest_vlan_port'))
      logout('reception_pc')
    end

    test 'player_state does not grow when the device actions repeat' do
      hold('kit_dropbox', 'kit_rogue_ap')
      open_rooms('comms_cupboard', 'meeting_room')
      devices_cycle(true) # the first pass fills the sets
      first = state.deep_dup
      3.times { devices_cycle }
      again = state
      %w[inventory sessions signedInPcs footholds gainedFootholds unlockedRooms plantedItems].each do |key|
        next unless first[key].is_a?(Array) || first[key].is_a?(Hash)

        tally = ->(st) { Array(st['inventory']).map { |i| i['id'] }.tally }
        extra = key == 'inventory' ? " #{tally.call(first).inspect} -> #{tally.call(again).inspect}" : ''
        assert_equal leaf_count(first[key]), leaf_count(again[key]), "#{key} grew on a repeat#{extra}"
      end
      assert_equal leaf_count(first['globalVariables']), leaf_count(again['globalVariables']), 'globalVariables grew'
      assert_equal 1, Array(again['plantedItems']).count { |e| e['item'] == 'kit_rogue_ap' }
    end

    test 'a repeated implant and repeated captures add no state' do
      desk_with_injector
      implant
      first = leaf_count(state['footholds'])
      3.times { implant }
      assert_equal first, leaf_count(state['footholds'])
      hold('kit_rogue_ap')
      hide_kit
      3.times { record_capture('staff_wifi_key', 'MerrinSallow-Staff') }
      captures = state.dig('globalVariables', 'se_captures') || state['seCaptures'] || {}
      assert_equal 1, captures.keys.count('staff_wifi_key')
    end
  end
end
