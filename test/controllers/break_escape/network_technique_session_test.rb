require 'test_helper'
require_relative '../../support/network_ops_scenario'

module BreakEscape
  # Ops core S3 step 11 (OPS_CORE_PLAN.md 5.4 and 11.2): a technique session next to the other session
  # kinds, row by row where this step's access changes touch it. The NPC borrow rows belong to the
  # client step (record_borrow_done! is step 12's).
  class NetworkTechniqueSessionTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests

    NOS = NetworkOpsScenario
    OFFICE = NOS::OFFICE
    BADUSB = { 'id' => 'kit_badusb', 'type' => 'usb_stick', 'name' => 'Keystroke device', 'takeable' => true, 'usbClass' => 'hid' }.freeze

    def scenario(off: false)
      data = NOS.techniques_scenario
      pc = data['rooms']['desk_room']['objects'].find { |o| o['id'] == 'sam_pc' }
      pc['offWhen'] = 'lab_off' if off
      data['rooms']['desk_room']['objects'] << {
        'id' => 'sam_usb_socket', 'type' => 'pc', 'name' => 'Desk USB socket',
        'triggerOnInteract' => [{ 'type' => 'grant_foothold', 'pc' => 'sam_pc', 'needsSession' => true,
                                  'needsHeld' => 'kit_badusb', 'name' => 'BadUSB: Sam desk' }]
      }
      data
    end

    def session_game(off: false, room: 'desk_room')
      cards = [card_entry('card_factory'), BADUSB.dup]
      hold_state = { 'inventory' => cards, 'currentRoom' => room, 'unlockedRooms' => NetworkRequests::OPEN_ROOMS + %w[server_room] }
      techniques_game(data: scenario(off: off), state: hold_state)
    end

    def state
      Game.find(@game.id).player_state
    end

    def grant!(finding = 'sam_pc.web.factory_login')
      ops_technique(OFFICE, finding, 'card_factory')
      assert_response :success, response.body
    end

    def desktop(**params)
      get game_path('container/sam_pc'), params: params, as: :json
      response.parsed_body
    end

    def implant(pc_id)
      post game_path('network/implant'), params: { pc_id: pc_id, shape: 'session' }, as: :json
      response.parsed_body
    end

    test 'a technique session cannot be locked' do
      session_game
      grant!
      before = state['sessions']['sam_pc'].dup
      post game_path('lock_session'), params: { pc_id: 'sam_pc' }, as: :json
      assert_response :unprocessable_entity
      assert_equal before, state['sessions']['sam_pc']
      assert_nil state['sessions']['sam_pc']['locked']
    end

    test 'the remote-view desktop is served through the foothold and the record keeps it, with a repeat answering already' do
      session_game
      grant!
      desktop(foothold: OFFICE)
      assert_response :success, response.body
      assert_includes response.body, 'sam_local'
      assert_equal({ 'id' => 'sam', 'via' => 'technique', 'foothold' => OFFICE, 'access' => 'user', 'technique' => 'sam_pc.web.factory_login' },
                   state['sessions']['sam_pc'])
      again = ops_technique(OFFICE, 'sam_pc.web.factory_login', 'card_factory')
      assert_equal true, again['already']
      assert_equal 'technique', state['sessions']['sam_pc']['via']
    end

    test 'the keyboard desktop serves a technique session and leaves its foothold in the record' do
      session_game
      grant!
      desktop
      assert_response :success, response.body
      assert_equal OFFICE, state['sessions']['sam_pc']['foothold']
      assert_includes state['signedInPcs'], 'sam_pc'
    end

    test 'a sign-in from a technique session desktop to another PC is allowed' do
      session_game
      grant!
      post game_path('login'), params: { pc_id: 'lena_pc', username: 'lfox', password: NetworkModelScenario::LENA_PASSWORD, from: 'sam_pc' }, as: :json
      assert_response :success, response.body
      assert_equal 'sam_pc', state['sessions']['lena_pc']['from']
      assert_equal 'technique', state['sessions']['sam_pc']['via']
    end

    test 'a grant ends an NPC guest session at the PC, and the technique session stays beside no guest record' do
      session_game
      game = Game.find(@game.id)
      game.player_state['guestSessions'] = { 'sam_pc' => { 'id' => 'lena' } }
      game.player_state['guestSessionsAt'] = { 'sam_pc' => Time.current.to_i }
      game.save!
      grant!
      assert_nil state['guestSessions']['sam_pc']
      assert_equal 'technique', state['sessions']['sam_pc']['via']
    end

    test 'a technique session does not satisfy an implant needsSession, and a keyboard sign-in does' do
      session_game
      grant!
      body = implant('sam_pc')
      assert_response :unprocessable_entity
      assert_equal 'not_ready', body['reason']
      assert_includes state['inventory'].map { |i| i['id'] }, 'kit_badusb', 'the device is still held'
      assert_nil state['footholds']['implant_sam_pc']
      assert_equal 'technique', state['sessions']['sam_pc']['via']
      # even after the click path served its desktop through the foothold
      desktop(foothold: OFFICE)
      implant('sam_pc')
      assert_response :unprocessable_entity
      # a typed sign-in at the keyboard replaces it and counts
      sign_in('sam_pc', 'sokafor', NetworkModelScenario::SAM_PASSWORD)
      assert_response :success, response.body
      assert_equal 'password', state['sessions']['sam_pc']['via']
      body = implant('sam_pc')
      assert_response :success, body.inspect
      assert_equal 'implant_sam_pc', body['foothold']['id']
    end

    test 'a host that is off keeps the session, refuses its desktop, and serves it again when back on' do
      session_game(off: true)
      grant!
      set_global('lab_off', true)
      desktop(foothold: OFFICE)
      assert_response :forbidden
      assert_equal 'not_responding', response.parsed_body['reason']
      desktop
      assert_response :forbidden
      assert_equal 'off', response.parsed_body['reason']
      assert_equal 'technique', state['sessions']['sam_pc']['via']
      set_global('lab_off', false)
      desktop(foothold: OFFICE)
      assert_response :success, response.body
    end

    test 'a weakness that becomes fixed afterwards keeps the session, and the exact repeat still reports it' do
      session_game
      grant!('sam_pc.web.patched_one')
      set_global(NOS::PATCHED_GLOBAL, true)
      desktop(foothold: OFFICE)
      assert_response :success, response.body
      assert_equal 'technique', state['sessions']['sam_pc']['via']
      again = ops_technique(OFFICE, 'sam_pc.web.patched_one', 'card_factory')
      assert_equal true, again['already']
      assert_equal 'sam_pc.web.patched_one', state['sessions']['sam_pc']['technique']
    end

    test 'a reload keeps the session, its foothold and its level' do
      session_game
      grant!
      reload = bootstrap_scenario
      assert_equal 'technique', reload['sessions']['sam_pc']['via']
      assert_equal OFFICE, reload['sessions']['sam_pc']['footholdId']
      desktop(foothold: OFFICE)
      assert_response :success, response.body
    end

    test 'the unplug ends the session and the same desktop request answers no_session' do
      session_game
      grant!
      unplug('comms_port')
      desktop(foothold: OFFICE)
      assert_response :forbidden
      assert_equal 'no_session', response.parsed_body['reason']
    end
  end
end
