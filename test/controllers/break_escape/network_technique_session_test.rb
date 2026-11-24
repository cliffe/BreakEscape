require 'test_helper'
require_relative '../../support/network_ops_scenario'

module BreakEscape
  # Ops core S3 step 11 (OPS_CORE_PLAN.md 5.4 and 11.2): a technique session next to the other session
  # kinds, row by row where this step's access changes touch it. The NPC borrow rows are at the end
  # (security review R1, F1 and T8: a finished borrow keeps a remote record).
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

    def session_game(off: false, room: 'desk_room', second: false)
      cards = [card_entry('card_factory'), BADUSB.dup]
      hold_state = { 'inventory' => cards, 'currentRoom' => room, 'unlockedRooms' => NetworkRequests::OPEN_ROOMS + %w[server_room] }
      techniques_game(data: scenario(off: off), state: hold_state, second: second)
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
      assert_equal 'needs_console', body['reason']
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

    test 'T11 after the weakness is fixed a use through a second foothold is refused fixed and the record stays on the first' do
      session_game(second: true)
      grant!('sam_pc.web.patched_one')
      record = state['sessions']['sam_pc'].dup
      set_global(NOS::PATCHED_GLOBAL, true)
      body = ops_technique(NOS::SECOND_JACK, 'sam_pc.web.patched_one', 'card_factory')
      assert_response :unprocessable_entity
      assert_equal 'fixed', body['reason']
      assert_equal record, state['sessions']['sam_pc']
      assert_equal OFFICE, state['sessions']['sam_pc']['foothold']
      # the exact repeat through the first foothold still answers already
      again = ops_technique(OFFICE, 'sam_pc.web.patched_one', 'card_factory')
      assert_equal true, again['already']
    end

    # ---- T6, T7: a pivot through and to a technique session --------------------------------------------

    def pivot_game
      techniques_game(data: NOS.pivot_techniques_scenario, state: { 'currentRoom' => 'server_room' })
    end

    # A session at lena_pc opens server_net; the finding on sv_fs02 is found and confirmed over it.
    def reach_sv_fs02
      pivot_through_lena
      ops_scan(OFFICE, network_id: 'server_net')
      ops_scan(OFFICE, host_id: 'sv_fs02')
      assert_response :success, response.body
      ops_check(OFFICE, host_id: 'sv_fs02', service: 'admin')
      ops_confirm(OFFICE, NOS::PIVOT_FINDING)
      assert_response :success, response.body
    end

    test 'T6 a technique session reached over a pivot is pruned when the pivot session ends' do
      pivot_game
      reach_sv_fs02
      ops_technique(OFFICE, NOS::PIVOT_FINDING, 'card_factory')
      assert_response :success, response.body
      assert_equal 'technique', state['sessions']['sv_fs02']['via']
      assert_equal OFFICE, state['sessions']['sv_fs02']['foothold']
      get game_path('container/sv_fs02'), params: { foothold: OFFICE }, as: :json
      assert_response :success, response.body
      assert_includes response.body, 'SV-LOCAL-TEXT'
      post game_path('logout'), params: { pc_id: 'lena_pc' }, as: :json
      assert_response :success, response.body
      assert_nil state['sessions']['lena_pc']
      assert_nil state['sessions']['sv_fs02'], 'the pivot is gone, so is the session reached over it'
      get game_path('container/sv_fs02'), params: { foothold: OFFICE }, as: :json
      assert_response :forbidden
      refute_includes response.body, 'SV-LOCAL-TEXT'
    end

    test 'T6 a technique session through a pivot also ends when the pivot foothold is unplugged' do
      pivot_game
      reach_sv_fs02
      ops_technique(OFFICE, NOS::PIVOT_FINDING, 'card_factory')
      assert_response :success, response.body
      unplug('comms_port')
      assert_nil state['sessions']['sv_fs02']
      assert_nil state['sessions']['lena_pc']
    end

    test 'T7 a technique session at sam_pc pivots to the second network and serves the account its share, and no other' do
      session_game
      get game_path('network'), params: { foothold: OFFICE }, as: :json
      before = response.parsed_body['footholds'].first['networks'].map { |b| b['id'] }
      refute_includes before, 'server_net'
      grant!
      after = view_blocks(OFFICE)
      block = after.find { |b| b['id'] == 'server_net' }
      assert block, 'the session at sam_pc is a pivot to server_net'
      assert_equal 'up', block['route']
      # the share on the desktop of the technique session is served as Sam (staff), not as finance or it
      get game_path('container/sam_pc'), params: { foothold: OFFICE }, as: :json
      assert_response :success, response.body
      shares = response.parsed_body['contents'].select { |c| c['type'] == 'network_share' }.map { |c| c['id'] }
      assert_equal %w[scanned_inbox], shares
      get game_path('container/scanned_inbox'), params: { foothold: OFFICE }, as: :json
      assert_response :success, response.body
      assert_includes response.body, NetworkModelScenario::INBOX_LETTER_NAME
      get game_path('container/no_such_share'), params: { foothold: OFFICE }, as: :json
      invented = response.status
      %w[ledger_archive backup_vault].each do |share|
        get game_path("container/#{share}"), params: { foothold: OFFICE }, as: :json
        assert_equal invented, response.status, 'a share the account may not open answers as one that does not exist'
        refute_includes response.body, NetworkModelScenario::HANDOVER_NAME
        refute_includes response.body, NetworkModelScenario::BACKUP_NOTE_TEXT
      end
    end

    # ---- a finished NPC borrow (plan 5.4, "An NPC at the PC"; security review R1 F1, T8) ----------------

    # The server's own call for a borrow's "done", with the borrower and the workaround the route builds.
    def borrow_done!(pc_id = 'sam_pc')
      game = Game.find(@game.id)
      # a borrower who leaves the screen open, so a guest record is written (a careful one writes none)
      ian = game.scenario_room_npc('ian').merge('habits' => { 'screen' => { 'lockChance' => 0 } })
      ended = game.send(:record_borrow_done!, ian, { 'pc' => pc_id })
      game.save!
      ended
    end

    def seed_sessions(sessions)
      game = Game.find(@game.id)
      game.player_state['sessions'] = (game.player_state['sessions'] || {}).merge(sessions)
      game.save!
    end

    # The borrow through the real route (R2 N-T1): POST /npc_workaround with the hand-over seeded in player_state, on a game whose sam_pc
    # has no owner so `performable?` accepts the borrow.
    def borrow_game
      hold_state = { 'inventory' => [card_entry('card_factory')], 'currentRoom' => 'desk_room',
                     'unlockedRooms' => NetworkRequests::OPEN_ROOMS + %w[server_room] }.merge(NOS.borrow_handed_state)
      techniques_game(data: NOS.borrow_techniques_scenario, state: hold_state)
    end

    def borrow_route!
      post npc_workaround_game_path(@game), params: { npc_id: 'ian', index: 0, hand: 1 }, as: :json
      assert_response :success, response.body
      response.parsed_body
    end

    test 'the borrow route keeps a technique session and the session sourced from it, and names no ended PC (F1, N-T1)' do
      borrow_game
      grant!
      seed_sessions('lena_pc' => { 'id' => 'lena', 'via' => 'password', 'from' => 'sam_pc' })
      record = state['sessions']['sam_pc'].dup
      body = borrow_route!
      assert_equal true, body['guest'], 'the borrower left the screen open: a guest record is written'
      assert_nil body['endedPcIds'], 'nothing was ended, so the answer names no PC'
      assert_equal record, state['sessions']['sam_pc']
      assert_equal 'sam_pc', state['sessions']['lena_pc']['from']
      assert_equal 'ian', state['guestSessions']['sam_pc']
      repeat = borrow_route!
      assert_equal true, repeat['guest'], 'a resent done answers the same without ending anything'
      assert_nil repeat['endedPcIds']
      assert_equal record, state['sessions']['sam_pc']
    end

    test 'the borrow route still ends a keyboard session at the PC and names the session sourced from it (the control for F1)' do
      borrow_game
      seed_sessions('sam_pc' => { 'id' => 'sam', 'via' => 'password' }, 'lena_pc' => { 'id' => 'lena', 'via' => 'password', 'from' => 'sam_pc' })
      body = borrow_route!
      assert_equal ['lena_pc'], body['endedPcIds']
      assert_nil state['sessions']['sam_pc']
      assert_nil state['sessions']['lena_pc']
      assert_equal 'ian', state['guestSessions']['sam_pc']
    end

    test 'a finished borrow keeps a technique session, writes the guest beside it and ends nothing' do
      session_game
      grant!
      record = state['sessions']['sam_pc'].dup
      assert_equal [], borrow_done!
      assert_equal record, state['sessions']['sam_pc']
      assert_equal 'ian', state['guestSessions']['sam_pc']
      assert state['guestSessionsAt']['sam_pc']
      desktop(foothold: OFFICE)
      assert_response :success, response.body
      assert_includes response.body, 'sam_local'
      again = ops_technique(OFFICE, 'sam_pc.web.factory_login', 'card_factory')
      assert_response :success, response.body
      assert_equal true, again['already']
      assert_equal record, state['sessions']['sam_pc']
    end

    test 'a finished borrow keeps a password session held through a foothold and a from session' do
      session_game
      seed_sessions('sam_pc' => { 'id' => 'sam', 'via' => 'password', 'foothold' => OFFICE })
      assert_equal [], borrow_done!
      assert_equal({ 'id' => 'sam', 'via' => 'password', 'foothold' => OFFICE }, state['sessions']['sam_pc'])
      assert_equal 'ian', state['guestSessions']['sam_pc']
      seed_sessions('sam_pc' => { 'id' => 'sam', 'via' => 'password' },
                    'lena_pc' => { 'id' => 'lena', 'via' => 'password', 'from' => 'sam_pc' })
      assert_equal [], borrow_done!('lena_pc')
      assert_equal 'sam_pc', state['sessions']['lena_pc']['from']
      assert_equal 'password', state['sessions']['sam_pc']['via']
      assert_equal 'ian', state['guestSessions']['lena_pc']
    end

    test 'a finished borrow still ends a keyboard password session and a claim, and the sessions sourced from it' do
      session_game
      seed_sessions('sam_pc' => { 'id' => 'sam', 'via' => 'password' },
                    'lena_pc' => { 'id' => 'lena', 'via' => 'password', 'from' => 'sam_pc' })
      assert_equal ['lena_pc'], borrow_done!
      assert_nil state['sessions']['sam_pc']
      assert_nil state['sessions']['lena_pc']
      assert_equal 'ian', state['guestSessions']['sam_pc']
      seed_sessions('sam_pc' => { 'id' => 'sam', 'via' => 'claim' })
      assert_equal [], borrow_done!
      assert_nil state['sessions']['sam_pc']
    end

    test 'a finished borrow at a PC where a technique session is held keeps what is sourced from it' do
      session_game
      grant!
      seed_sessions('lena_pc' => { 'id' => 'lena', 'via' => 'password', 'from' => 'sam_pc' })
      assert_equal [], borrow_done!
      assert_equal 'technique', state['sessions']['sam_pc']['via']
      assert_equal 'sam_pc', state['sessions']['lena_pc']['from']
    end
  end
end
