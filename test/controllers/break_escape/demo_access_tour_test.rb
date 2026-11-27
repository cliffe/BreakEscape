require 'test_helper'
require_relative '../../support/network_model_scenario'

module BreakEscape
  # demo_access_tour, slice 2 (docs/achitechture/DEMO_ACCESS_TOUR_PLAN.md sections 3 and 4.4):
  # the real scenario over the real endpoints. Proves on the server what stops 2 to 10 and 17
  # rely on: no secret in the bootstrap, a room answer or the keyring; the doors by card, role,
  # person and PIN; the door controller through the box; the Finance share; and which sessions
  # the unplug ends on the foothold route, the from route and a desk sign-out.
  #
  # Slice 3 adds the implant, the other jacks (managed_port, guest_vlan_port), capture and
  # Wi-Fi join cases to the Rails test. Nothing here depends on them.
  class DemoAccessTourTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    PEOPLE = %w[delphine thandiwe yasmin lorna julian].freeze
    ROOMS = %w[reception open_plan server_room kitchen partner_office meeting_room comms_cupboard].freeze
    VISITOR_CARD = 'VISITOR-07'.freeze

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

    # ---- secrets ----

    test 'the scenario draws a PIN and a key and gives every person a literal password' do
      assert_match(/\A\d{4}\z/, pin)
      assert_match(/\A\S{8}\z/, psk)
      passwords.each { |text| assert_operator text.to_s.length, :>=, 8 }
      assert_equal passwords.uniq, passwords, 'two people share a password'
      assert_equal 'FAC', lorna_card_id.to_s[0, 3]
      assert_nil npc('julian').dig('creds', 'card'), 'Julian has no card to copy'
      refute_equal pin, psk
    end

    test 'the bootstrap carries no psk, requires, creds, password or keypad PIN literal' do
      bootstrap_scenario
      assert_response :success, response.body
      refute_secrets 'bootstrap'
      refute_pin 'bootstrap'
      keys = keys_of(response.parsed_body)
      %w[psk creds password postitNote].each { |key| refute_includes keys, key, "bootstrap has a #{key} key" }
      refute response.parsed_body['rooms']['server_room'].key?('requires'), 'the keypad door carries its code'
      requires = leaves(response.parsed_body).select { |path, _| path.end_with?('.requires') || path.include?('.requires[') }
      assert_equal [VISITOR_CARD], requires.map { |_, value| value }, 'only the visitor card id is a requires value'
      refute_includes response.body, lorna_card_id
      refute_includes response.body, 'door-codes', 'the door-codes file is named in the bootstrap'
      refute_includes response.body, 'facilities_txt'
      refute_includes response.body, 'julian_rdp_file'
    end

    test 'no NPC creds or role reach the client in the bootstrap or any room answer' do
      bootstrap_scenario
      bodies = { 'bootstrap' => response.parsed_body }
      open_rooms(*ROOMS)
      ROOMS.each do |room|
        get game_path("room/#{room}"), as: :json
        assert_response :success, "#{room}: #{response.body}"
        bodies[room] = response.parsed_body
        refute_secrets "room #{room}"
        refute_pin "room #{room}"
        # An NPC's rfidCard (name, card_id, rfid_protocol) reaches the client by design: it is what the
        # cloner reads (same as access_model_no_password_test). The server enforces the clone.
      end
      bodies.each do |where, body|
        npcs = []
        walk = lambda do |node|
          case node
          when Hash
            npcs << node if node['npcType'] || node.key?('displayName')
            node.each_value { |value| walk.call(value) }
          when Array then node.each { |value| walk.call(value) }
          end
        end
        walk.call(body)
        npcs.each do |entry|
          refute entry.key?('creds'), "#{where}: #{entry['id']} carries creds"
          refute entry.key?('role'), "#{where}: #{entry['id']} carries a role"
        end
      end
    end

    test 'the keyring carries no secret before or after the files are taken' do
      get_json('keyring')
      assert_response :success, response.body
      refute_secrets 'keyring'
      plant_box
      take_julian_rdp
      get_json('keyring')
      assert_response :success, response.body
      refute_secrets 'keyring', response.body, allow: [password('delphine')]
      assert_includes Array(response.parsed_body['entries']).map { |e| e['id'] }, 'julian_rdp'
    end

    test 'only the sign-in screens of Delphine and Yasmin serve a password, and only their own' do
      served = {}
      %w[reception_pc yasmin_pc].each do |pc|
        get_json('login_accounts', pc_id: pc)
        assert_response :success, "#{pc}: #{response.body}"
        served[pc] = response.body
      end
      assert_includes served['reception_pc'], password('delphine')
      refute_includes served['reception_pc'], password('yasmin')
      assert_includes served['yasmin_pc'], password('yasmin')
      refute_includes served['yasmin_pc'], password('delphine')
      %w[thandiwe_laptop julian_pc door_controller].each do |pc|
        get_json('login_accounts', pc_id: pc)
        refute_secrets "login_accounts #{pc}"
        refute_pin "login_accounts #{pc}"
      end
      served.each_value do |body|
        (%w[thandiwe lorna julian].map { |p| password(p) }).each { |text| refute_includes body, text }
        refute_includes body, psk
      end
    end

    test 'facilities.txt and julian.rdp are absent from every answer until a reception_pc session exists' do
      plant_box
      open_rooms('reception')
      container('reception_pc')
      assert_response :forbidden
      refute_includes response.body, 'facilities'
      refute_includes response.body, 'julian'
      container('reception_pc', foothold: @foothold)
      assert_response :forbidden, 'the box alone opens no desktop'
      [bootstrap_scenario, get_json('room/reception'), get_json('keyring'), network_view(@foothold)].each do
        refute_includes response.body, 'facilities_txt'
        refute_includes response.body, 'julian_rdp_file'
        refute_includes response.body, password('lorna')
      end
      sign_in_ok('reception_pc', 'delphine')
      container('reception_pc')
      assert_response :success
      ids = Array(response.parsed_body['contents']).map { |item| item['id'] }
      assert_includes ids, 'facilities_txt'
      assert_includes ids, 'julian_rdp_file'
      get_json('room/reception')
      refute_includes response.body, 'facilities_txt', 'the room answer still withholds the desktop contents'
      refute_includes response.body, password('lorna')
    end

    test 'the door-codes file and the PIN are absent until a door_controller session exists' do
      reach_julian
      container('door_controller', foothold: @foothold)
      assert_response :forbidden, 'no door_controller session yet'
      refute_pin 'the refused container answer'
      [network_view(@foothold), get_json('keyring'), get_json('room/reception'), bootstrap_scenario].each do
        refute_pin 'an answer before the door controller session'
        refute_includes response.body, 'door-codes'
      end
      door_controller_through_box
      body = container('door_controller', foothold: @foothold)
      assert_response :success, body.inspect
      assert_operator pin_hits(response.body).length, :>=, 1, 'the door codes carry the PIN once the session exists'
      refute_includes response.body, password('lorna'), 'the codes file does not carry the password'
      get_json('room/reception')
      refute_pin 'the room answer after the session'
      bootstrap_scenario
      refute_pin 'the bootstrap after the session'
    end

    test 'the Staff psk and the other passwords stay out of every answer on the short route' do
      reach_julian
      door_controller_through_box
      answers = [bootstrap_scenario, get_json('keyring'), network_view(@foothold), get_json('room/reception'),
                 get_json('login_accounts', pc_id: 'julian_pc'), get_json('login_accounts', pc_id: 'door_controller'),
                 container('finance_share', foothold: @foothold), unplug('meeting_jack')].map { response.body }
      answers.each do |body|
        refute_includes body, psk
        refute_includes body, password('julian')
        refute_includes body, password('thandiwe')
        refute_includes body, password('yasmin')
      end
    end

    # ---- access: doors by card, role and person ----

    test 'the partner door refuses the visitor card and Lorna\'s clone, and has no card to copy' do
      hold('visitor_card')
      assert_refused rfid('partner_office', [VISITOR_CARD]), 'visitor card'
      hold_cloner
      assert_equal true, clone_card(lorna_card_id, 'lorna')['recorded'], 'Lorna\'s card records as a clone'
      assert_refused rfid('partner_office', [lorna_card_id]), 'Lorna\'s clone'
      assert_refused rfid('partner_office', [VISITOR_CARD, lorna_card_id]), 'both together'
      assert_refused rfid('partner_office'), 'no card ids'
      refute unlocked?('partner_office')
      refute clone_card('JULIAN-CARD-01', 'julian')['recorded'], 'nothing to record for Julian'
      refute unlocked?('partner_office')
    end

    test 'the comms door admits Lorna\'s recorded clone while the cloner is held and nothing else' do
      hold('visitor_card')
      assert_refused rfid('comms_cupboard', [VISITOR_CARD]), 'visitor card'
      assert_refused rfid('comms_cupboard', [lorna_card_id]), 'her card id with no clone and no cloner'
      hold_cloner
      assert_refused rfid('comms_cupboard', [lorna_card_id]), 'cloner held, no clone recorded'
      refute clone_card(lorna_card_id, 'delphine')['recorded'], 'a card id that is not Delphine\'s'
      assert_refused rfid('comms_cupboard', [lorna_card_id]), 'a clone recorded against the wrong person'
      assert_equal true, clone_card(lorna_card_id, 'lorna')['recorded']
      refute unlocked?('comms_cupboard')
      body = rfid('comms_cupboard', [lorna_card_id])
      assert_response :success, body.inspect
      assert unlocked?('comms_cupboard')
    end

    test 'the comms door refuses Lorna\'s recorded clone once the cloner is no longer held' do
      hold_cloner
      clone_card(lorna_card_id, 'lorna')
      @game.reload.remove_inventory_item!('rfid_cloner')
      assert_refused rfid('comms_cupboard', [lorna_card_id]), 'clone without the cloner'
      refute unlocked?('comms_cupboard')
    end

    test 'a clone of Lorna\'s card is refused for a person who has not been met' do
      @game.reload
      @game.player_state['encounteredNPCs'] = PEOPLE - ['lorna']
      @game.save!
      hold_cloner
      refute clone_card(lorna_card_id, 'lorna')['recorded']
      assert_refused rfid('comms_cupboard', [lorna_card_id])
    end

    test 'the meeting room opens with the VISITOR-07 card and refuses a card without that id' do
      assert_refused rfid('meeting_room', [VISITOR_CARD]), 'the card ids alone, with the card not held'
      assert_refused rfid('meeting_room'), 'nothing held, no ids'
      hold_card('VISITOR-08')
      assert_refused rfid('meeting_room', ['VISITOR-08']), 'a card with another id'
      assert_refused rfid('meeting_room'), 'a card with another id, no ids sent'
      hold_cloner
      clone_card(lorna_card_id, 'lorna')
      assert_refused rfid('meeting_room', [lorna_card_id]), 'Lorna\'s clone is not the visitor card'
      refute unlocked?('meeting_room')
      hold('visitor_card')
      body = rfid('meeting_room', [VISITOR_CARD])
      assert_response :success, body.inspect
      assert unlocked?('meeting_room')
    end

    test 'the meeting room opens for the held visitor card with no card ids sent' do
      hold('visitor_card')
      body = rfid('meeting_room')
      assert_response :success, body.inspect
      assert unlocked?('meeting_room')
    end

    test 'the keypad admits the rendered code and refuses a wrong one' do
      wrong = pin == '1234' ? '4321' : '1234'
      assert_refused door('server_room', method: 'pin', attempt: wrong), 'wrong code'
      assert_refused door('server_room', method: 'pin', attempt: ''), 'empty code'
      refute unlocked?('server_room')
      body = door('server_room', method: 'pin', attempt: pin)
      assert_response :success, body.inspect
      assert unlocked?('server_room')
    end

    # ---- access: sign-ins by role and person ----

    test 'each desk admits its owner and refuses a colleague' do
      other = { 'reception_pc' => 'thandiwe', 'yasmin_pc' => 'thandiwe', 'thandiwe_laptop' => 'yasmin', 'julian_pc' => 'thandiwe' }
      own = { 'reception_pc' => 'delphine', 'yasmin_pc' => 'yasmin', 'thandiwe_laptop' => 'thandiwe' }
      other.each do |pc, person|
        refute sign_in(pc, username(person), password(person))['success'], "#{person} signed in at #{pc}"
      end
      own.each do |pc, person|
        assert sign_in(pc, username(person), password(person))['success'], "#{person} could not sign in at #{pc}"
      end
      assert_includes sessions.keys, 'reception_pc'
      refute_includes sessions.keys, 'julian_pc'
    end

    test 'the door controller admits the facilities account through the box only with an office_lan session held' do
      plant_box
      body = sign_in('door_controller', username('lorna'), password('lorna'), foothold: @foothold)
      refute body['success'], 'refused through meeting_jack with no office_lan session held'
      refute_includes sessions.keys, 'door_controller'
      reach_julian_after_plant = lambda do
        take_julian_rdp
        logout('reception_pc')
        julian_through_box
      end
      reach_julian_after_plant.call
      assert door_controller_through_box['success']
      assert_includes sessions.keys, 'door_controller'
      assert_equal @foothold, sessions.dig('door_controller', 'foothold'), 'the session carries the box\'s foothold'
    end

    test 'the door controller refuses every other role and a wrong password, with Julian\'s session held' do
      reach_julian
      %w[delphine thandiwe yasmin].each do |person|
        body = sign_in('door_controller', username(person), password(person), foothold: @foothold)
        refute body['success'], "#{person} signed in at the door controller"
      end
      refute sign_in('door_controller', username('lorna'), 'not-her-password-at-all', foothold: @foothold)['success']
      refute_includes sessions.keys, 'door_controller'
      assert door_controller_through_box['success']
    end

    test 'the door controller is out of reach of the keyboard route and of an unplanted game' do
      refute sign_in('door_controller', username('lorna'), password('lorna'))['success'], 'no foothold, no desk session'
      front_desk_session
      refute sign_in('door_controller', username('lorna'), password('lorna'))['success'],
             'a keyboard session at the front desk does not sign in to a headless controller by itself'
      refute_includes sessions.keys, 'door_controller'
    end

    test 'the keyring route signs in to julian_pc only with the file held, and only the saved account' do
      plant_box
      body = cred_login('julian_pc', 'julian_rdp', foothold: @foothold)
      refute body['success'], 'julian.rdp not held'
      take_julian_rdp
      logout('reception_pc')
      julian_through_box
      assert_equal 'julian', sessions.dig('julian_pc', 'id')
      refute_includes sessions.keys, 'reception_pc'
    end

    test 'Julian\'s typed password also signs in through the box, and a colleague\'s does not' do
      plant_box
      front_desk_session
      logout('reception_pc')
      refute sign_in('julian_pc', username('thandiwe'), password('thandiwe'), foothold: @foothold)['success']
      assert sign_in('julian_pc', username('julian'), password('julian'), foothold: @foothold)['success']
    end

    # ---- the Finance share ----

    test 'the Finance share is refused from the bare foothold and the open share is not' do
      plant_box
      view = network_view(@foothold)
      listed = view['footholds'].first['hosts'].map { |h| h['id'] }
      assert_includes listed, 'finance_share'
      assert_includes listed, 'client_letters'
      assert_equal false, view['footholds'].first['hosts'].find { |h| h['id'] == 'finance_share' }['open']
      # A refused share answers 404, the same as an invented id (games_controller#container).
      container('finance_share', foothold: @foothold)
      assert_response :not_found, 'the box alone'
      container('client_letters', foothold: @foothold)
      assert_response :success, 'the open share maps on the bare foothold'
    end

    test 'the Finance share is refused to a design desk and opens after a julian_pc session' do
      plant_box
      sign_in_ok('thandiwe_laptop', 'thandiwe')
      container('finance_share', foothold: @foothold)
      assert_response :not_found, 'a design session is not a finance or partner session'
      logout('thandiwe_laptop')
      take_julian_rdp
      logout('reception_pc')
      julian_through_box
      view = network_view(@foothold)
      # 'open' in the view only says the share has no access rule (network_access.rb:1080), so it stays
      # false for the Finance share; the session shows in the container answer below.
      assert_equal false, view['footholds'].first['hosts'].find { |h| h['id'] == 'finance_share' }['open']
      body = container('finance_share', foothold: @foothold)
      assert_response :success, body.inspect
      refute_secrets 'the Finance share answer'
    end

    test 'the Finance share opens from Yasmin\'s desk (finance) without the box' do
      sign_in_ok('yasmin_pc', 'yasmin')
      body = container('finance_share', foothold: nil)
      assert_response :success, body.inspect
    end

    # ---- the network view: server_lan appears only with a held office_lan session ----

    test 'the box alone names no server_lan host; Julian\'s session brings the door controller into the view' do
      plant_box
      before = network_view(@foothold).to_json
      refute_includes before, 'door_controller'
      refute_includes before, 'server_lan'
      take_julian_rdp
      logout('reception_pc')
      julian_through_box
      after = network_view(@foothold).to_json
      assert_includes after, 'door_controller'
    end

    # ---- every jack in this slice resolves ----

    test 'meeting_jack resolves through find_jack and the plant answers something other than 404' do
      hold('kit_dropbox')
      open_rooms('meeting_room')
      body = plant('meeting_jack')
      refute_equal 404, response.status, body.inspect
      assert body['success'], body.inspect
      assert_equal 'office_lan', network_view(@game.reload.foothold_id_for('meeting_jack'))['footholds'].first.dig('network', 'id')
    end

    # ---- unplug and routes ----

    test 'foothold route: the unplug ends julian_pc and door_controller and no desk session' do
      plant_box
      sign_in_ok('thandiwe_laptop', 'thandiwe')
      take_julian_rdp
      logout('reception_pc')
      julian_through_box
      door_controller_through_box
      assert_equal %w[door_controller julian_pc thandiwe_laptop], sessions.keys.sort
      body = unplug('meeting_jack')
      assert_response :success, body.inspect
      assert_equal %w[door_controller julian_pc], Array(body['endedPcIds']).sort
      refute_includes Array(body['endedPcIds']), 'reception_pc'
      refute_includes Array(body['endedPcIds']), 'thandiwe_laptop'
      assert_equal %w[thandiwe_laptop], sessions.keys, 'the keyboard session stays'
      assert_includes held_ids, 'kit_dropbox', 'the box is back in the bag'
    end

    test 'foothold route: after the unplug the box route is closed and the codes are not served' do
      reach_julian
      door_controller_through_box
      unplug('meeting_jack')
      container('door_controller', foothold: @foothold)
      assert_response :forbidden
      container('finance_share', foothold: @foothold)
      assert_response :not_found, 'a refused share looks like an invented id'
    end

    test 'from route: a julian_pc session opened from the front desk survives the unplug' do
      plant_box
      take_julian_rdp
      body = cred_login('julian_pc', 'julian_rdp', from: 'reception_pc')
      assert_response :success, body.inspect
      assert body['success'], body.inspect
      assert_equal 'reception_pc', sessions.dig('julian_pc', 'from')
      ended = unplug('meeting_jack')
      assert_response :success, ended.inspect
      refute_includes Array(ended['endedPcIds']), 'julian_pc'
      assert_includes sessions.keys, 'julian_pc', 'the session is still held'
      assert_includes sessions.keys, 'reception_pc'
    end

    test 'desk sign-out: signing out of the front desk ends the session opened from it' do
      take_julian_rdp
      body = cred_login('julian_pc', 'julian_rdp', from: 'reception_pc')
      assert body['success'], body.inspect
      ended = logout('reception_pc')
      assert_response :success, ended.inspect
      assert_includes Array(ended['endedPcIds']), 'julian_pc'
      refute_includes sessions.keys, 'julian_pc'
      refute_includes sessions.keys, 'reception_pc'
    end

    test 'signing out of the front desk first is what lets the unplug end Julian\'s session' do
      plant_box
      take_julian_rdp
      logout('reception_pc')
      julian_through_box
      assert_nil sessions.dig('julian_pc', 'from'), 'a box session has no from'
      ended = unplug('meeting_jack')
      assert_includes Array(ended['endedPcIds']), 'julian_pc'
    end

    # ---- player_state does not grow ----

    def leaf_count(node)
      case node
      when Hash then node.values.sum { |value| leaf_count(value) } + node.size
      when Array then node.sum { |value| leaf_count(value) } + node.size
      else 1
      end
    end

    def short_route_cycle
      plant('meeting_jack')
      @foothold = @game.reload.foothold_id_for('meeting_jack')
      sign_in('reception_pc', username('delphine'), password('delphine'))
      container('reception_pc')
      logout('reception_pc')
      cred_login('julian_pc', 'julian_rdp', foothold: @foothold)
      sign_in('door_controller', username('lorna'), password('lorna'), foothold: @foothold)
      container('door_controller', foothold: @foothold)
      container('finance_share', foothold: @foothold)
      network_view(@foothold)
      get_json('keyring')
      unplug('meeting_jack')
      rfid('meeting_room', [VISITOR_CARD])
      clone_card(lorna_card_id, 'lorna')
      rfid('comms_cupboard', [lorna_card_id])
      door('server_room', method: 'pin', attempt: pin)
    end

    test 'player_state does not grow when the short route is repeated' do
      hold('kit_dropbox', 'julian_rdp_file', 'visitor_card')
      hold_cloner
      open_rooms('meeting_room')
      short_route_cycle
      first = state.deep_dup
      assert_includes Array(first['unlockedRooms']), 'server_room'
      3.times { short_route_cycle }
      again = state
      assert_equal leaf_count(first), leaf_count(again), 'player_state grew on a repeat of the same actions'
      %w[inventory sessions signedInPcs footholds gainedFootholds unlockedRooms triggeredEvents globalVariables].each do |key|
        assert_equal Array(first[key]).size, Array(again[key]).size, "#{key} grew" if first[key].is_a?(Array)
        assert_equal first[key].to_h.keys.sort, again[key].to_h.keys.sort, "#{key} grew" if first[key].is_a?(Hash)
      end
      assert_operator Array(again['gainedFootholds']).size, :<=, 5
      assert_operator Array(again['signedInPcs']).size, :<=, 6
    end

    test 'a client sync of the same globals does not add keys the server did not set' do
      hold('kit_dropbox')
      before = leaf_count(state)
      2.times { sync_globals({}) }
      assert_equal before, leaf_count(state)
    end
  end
end
