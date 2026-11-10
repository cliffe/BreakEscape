require 'test_helper'
require_relative '../../support/network_model_scenario'

module BreakEscape
  # Networks slice 9.3a, step 4 (docs/achitechture/ACCESS_MODEL_SLICE_9_3_PLAN.md,
  # sections 4.4 and 5): remote sign-in through a foothold, headless hosts, and how a
  # desktop request is judged.
  class NetworkRemoteSigninTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    NS = NetworkModelScenario
    OFFICE = 'jack_comms_port'.freeze

    def state
      @game.reload.player_state
    end

    def with_office_foothold(player_state = {})
      build_network_game(player_state)
      take_drop_box
      plant('comms_port')
      assert_response :success, response.body
    end

    def write_state
      @game.reload
      yield @game.player_state
      @game.save!
    end

    # ---- remote sign-in ---------------------------------------------------------------

    test 'a remote sign-in to a PC in a locked room succeeds through a foothold and the room stays locked' do
      with_office_foothold
      body = sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      assert_response :success, body.inspect
      assert_equal({ 'success' => true, 'npcId' => 'lena', 'username' => 'lfox', 'displayName' => 'Lena Fox', 'via' => 'password',
                     'remote' => true, 'footholdId' => OFFICE, 'host' => 'HB-FIN-02' }, body)
      assert_equal({ 'id' => 'lena', 'via' => 'password', 'foothold' => OFFICE }, state['sessions']['lena_pc'])
      assert_includes state['signedInPcs'], 'lena_pc'
      refute_includes state['unlockedRooms'], 'finance_office'

      get game_path('scenario'), as: :json
      assert_equal({ 'npcId' => 'lena', 'username' => 'lfox', 'displayName' => 'Lena Fox', 'via' => 'password',
                     'remote' => true, 'footholdId' => OFFICE, 'host' => 'HB-FIN-02' }, response.parsed_body['sessions']['lena_pc'])
    end

    test 'an unlock_object task on a sign-in host is met by a remote sign-in' do
      with_office_foothold
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      post complete_task_game_url(@game, task_id: 'sign_in_lena'), as: :json
      assert_equal true, response.parsed_body['success'], response.body
    end

    test 'a sign-in with no foothold, an invented foothold or one on the other network is 403' do
      with_office_foothold
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD)
      assert_response :forbidden
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: 'jack_invented')
      assert_response :forbidden
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: 'jack_comms_port_x')
      assert_response :forbidden

      unplug('comms_port')
      plant('bench_port')
      assert_response :success
      body = sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: 'jack_bench_port')
      assert_response :forbidden
      assert_equal 'PC not reachable', body['message']
      sign_in('offline_pc', 'sokafor', NS::SAM_PASSWORD, foothold: 'jack_bench_port')
      assert_response :forbidden
      assert_equal({}, state['sessions'])
      assert_equal({}, state['loginFailures'])
    end

    test 'a PC whose policy blocks remote sign-in answers remoteBlocked for any password and counts nothing' do
      with_office_foothold
      [NS::SAM_PASSWORD, 'wrong-password'].each do |password|
        body = sign_in('kiosk_pc', 'sokafor', password, foothold: OFFICE)
        assert_response :unprocessable_entity
        assert_equal({ 'success' => false, 'message' => 'Remote sign-in is turned off on this PC', 'remoteBlocked' => true }, body)
      end
      assert_equal({}, state['loginFailures'])
      refute state['sessions'].key?('kiosk_pc')
      sign_in('kiosk_pc', 'sokafor', NS::SAM_PASSWORD)
      assert_response :success, 'the kiosk still takes a sign-in at its keyboard'
    end

    test 'wrong passwords count on the same counter remotely and locally and lock out at the limit' do
      with_office_foothold
      2.times { sign_in('lena_pc', 'lfox', 'wrong', foothold: OFFICE) }
      write_state { |ps| ps['unlockedRooms'] << 'finance_office' }
      body = sign_in('lena_pc', 'lfox', 'wrong')
      assert_equal 2, body['attemptsLeft']
      body = sign_in('lena_pc', 'lfox', 'wrong')
      assert_equal 1, body['attemptsLeft']
      body = sign_in('lena_pc', 'lfox', 'wrong', foothold: OFFICE)
      assert_equal true, body['lockedOut']
      body = sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD)
      assert_equal true, body['lockedOut'], 'locked out at the keyboard as well'
      body = sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      assert_equal true, body['lockedOut']
    end

    test 'an account the PC does not admit gets the not-permitted answer remotely' do
      with_office_foothold
      body = sign_in('lena_pc', 'sokafor', NS::SAM_PASSWORD, foothold: OFFICE)
      assert_response :unprocessable_entity
      assert_equal true, body['notPermitted']
      assert_equal "This account can't sign in on this PC", body['message']
    end

    def claim(pc_id, kind = 'owner', foothold: nil)
      params = { pc_id: pc_id, claim: kind }
      params[:foothold] = foothold if foothold
      post game_path('login'), params: params, as: :json
      response.parsed_body
    end

    # Sam's PC can be claimed at the keyboard (the control), so the refusals below are
    # the foothold's doing and not the fixture's.
    test 'a claim with a foothold is refused, owner or invented, where the same claim at the keyboard succeeds' do
      with_office_foothold
      %w[owner guest].each do |kind|
        body = claim('sam_pc', kind, foothold: OFFICE)
        assert_response :unprocessable_entity
        assert_equal 'Sign in required', body['message']
      end
      assert_equal({}, state['sessions'])

      body = claim('sam_pc')
      assert_response :success, body.inspect
      assert_equal 'claim', body['via']
      assert_equal({ 'id' => 'sam', 'via' => 'claim' }, state['sessions']['sam_pc'])
    end

    test 'the model itself refuses a claim through a foothold' do
      with_office_foothold
      result = @game.reload.claim_login_session!('sam_pc', nil, foothold: OFFICE)
      assert_equal :unprocessable_entity, result[:status]
      assert_equal 'Sign in required', result[:body][:message]
      assert_equal({}, state['sessions'])
    end

    # ---- headless ---------------------------------------------------------------------

    test 'a headless host refuses a sign-in, a claim and its tiles with no foothold although its room is open' do
      with_office_foothold
      body = sign_in('door_box', 'ishaw', NS::IAN_PASSWORD)
      assert_response :forbidden
      assert_equal 'PC not reachable', body['message']
      get game_path('login_accounts'), params: { pc_id: 'door_box' }
      assert_response :forbidden
      assert_equal({}, state['sessions'])

      body = sign_in('door_box', 'ishaw', NS::IAN_PASSWORD, foothold: OFFICE)
      assert_response :success, body.inspect
      assert_equal 'HB-DOOR-01', body['host']
    end

    # The door controller given an owner whose screen could be claimed: the claim is
    # refused only because the host is headless, which the control without headless shows.
    def owned_door_box(headless: true)
      data = NS.scenario
      ian = data['rooms']['lobby']['npcs'].find { |npc| npc['id'] == 'ian' }
      ian['needs'] = { 'coffee' => { 'decayPerMin' => 1, 'urgentAt' => 50 } }
      door = data['rooms']['store']['objects'].find { |obj| obj['id'] == 'door_box' }
      door.merge!('screenOwner' => 'ian', 'locksScreenOnLeave' => false)
      door.delete('headless') unless headless
      data
    end

    test 'an owner claim on a headless host is refused although its room is open and its owner could be claimed' do
      build_network_game({}, owned_door_box(headless: false))
      body = claim('door_box')
      assert_response :success, "the control: the same host with a screen is claimed (#{body.inspect})"

      build_network_game({}, owned_door_box)
      body = claim('door_box')
      assert_response :unprocessable_entity
      assert_equal 'Sign in required', body['message']
      assert_equal({}, state['sessions'])
    end

    test 'a headless desktop is served only through a foothold' do
      with_office_foothold
      sign_in('door_box', 'ishaw', NS::IAN_PASSWORD, foothold: OFFICE)
      body = container('door_box')
      assert_response :forbidden
      assert_equal 'unreachable', body['reason']
      refute_includes response.body, NS::DOOR_CODES_TEXT
      body = container('door_box', foothold: OFFICE)
      assert_response :success
      assert_equal %w[door_codes scanned_inbox], body['contents'].map { |c| c['id'] }
      assert_equal OFFICE, state['sessions']['door_box']['foothold'], 'a refused physical request clears nothing'
    end

    # ---- how a desktop request is judged ----------------------------------------------

    test 'a remote session is served through its foothold, not at a locked room, and a keyboard request clears it' do
      with_office_foothold
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      container('lena_pc', foothold: OFFICE)
      assert_response :success
      body = container('lena_pc')
      assert_response :forbidden
      assert_equal 'unreachable', body['reason']
      assert_equal OFFICE, state['sessions']['lena_pc']['foothold']

      write_state { |ps| ps['unlockedRooms'] << 'finance_office' }
      body = container('lena_pc', foothold: OFFICE)
      assert_response :success
      assert_equal OFFICE, state['sessions']['lena_pc']['foothold']
      assert_equal({ 'npcId' => 'lena', 'username' => 'lfox', 'displayName' => 'Lena Fox', 'via' => 'password',
                     'remote' => true, 'footholdId' => OFFICE, 'host' => 'HB-FIN-02' }, body['session'],
                   'a desktop fetched through a foothold says the session is remote')
      body = container('lena_pc')
      assert_response :success
      assert_equal({ 'id' => 'lena', 'via' => 'password' }, state['sessions']['lena_pc'])
      assert_equal({ 'npcId' => 'lena', 'username' => 'lfox', 'displayName' => 'Lena Fox', 'via' => 'password' }, body['session'],
                   'a desktop fetched at the keyboard tells the client the session is now local')

      body = unplug('comms_port')
      assert_equal [], body['endedPcIds']
      container('lena_pc')
      assert_response :success, 'a session cleared at the keyboard survives the unplug'
    end

    test 'an unplug ends a session that still had its foothold, and a local session is unaffected' do
      with_office_foothold
      sign_in('sam_pc', 'sokafor', NS::SAM_PASSWORD)
      assert_response :success
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      body = unplug('comms_port')
      assert_equal ['lena_pc'], body['endedPcIds']
      body = container('lena_pc', foothold: OFFICE)
      assert_response :forbidden
      assert_equal 'no_session', body['reason']
      body = container('lena_pc')
      assert_equal 'no_session', body['reason']
      container('sam_pc')
      assert_response :success
      assert_equal({ 'sam_pc' => { 'id' => 'sam', 'via' => 'password' } }, state['sessions'])
    end

    test 'a remote sign-in where a local session is held replaces it, and an unplug then ends it' do
      with_office_foothold
      sign_in('sam_pc', 'sokafor', NS::SAM_PASSWORD)
      sign_in('sam_pc', 'sokafor', NS::SAM_PASSWORD, foothold: OFFICE)
      assert_response :success
      assert_equal OFFICE, state['sessions']['sam_pc']['foothold']
      assert_equal ['sam_pc'], unplug('comms_port')['endedPcIds']
      refute state['sessions'].key?('sam_pc')
    end

    test 'a foothold request for a claimed session is unreachable and the claim is kept' do
      with_office_foothold
      write_state { |ps| ps['sessions'] = { 'sam_pc' => { 'id' => 'sam', 'via' => 'claim' } } }
      body = container('sam_pc', foothold: OFFICE)
      assert_response :forbidden
      assert_equal 'unreachable', body['reason']
      assert_equal({ 'id' => 'sam', 'via' => 'claim' }, state['sessions']['sam_pc'])
      container('sam_pc')
      assert_response :success
    end

    test 'a foothold request for a PC under a blocked policy is unreachable' do
      with_office_foothold
      sign_in('kiosk_pc', 'sokafor', NS::SAM_PASSWORD)
      body = container('kiosk_pc', foothold: OFFICE)
      assert_response :forbidden
      assert_equal 'unreachable', body['reason']
    end

    # The two writers both run under the game row lock, so they serialise; either order
    # must leave the session without its foothold or no session at all.
    test 'a keyboard request and an unplug of the same foothold never leave a session naming the gone foothold' do
      [%i[keyboard unplug], %i[unplug keyboard]].each do |order|
        with_office_foothold('unlockedRooms' => NetworkRequests::OPEN_ROOMS + ['finance_office'])
        sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
        order.each { |step| step == :keyboard ? container('lena_pc') : unplug('comms_port') }
        session = state['sessions']['lena_pc']
        if order.first == :keyboard
          assert_equal({ 'id' => 'lena', 'via' => 'password' }, session)
        else
          assert_nil session
        end
        refute_includes state['sessions'].to_json, OFFICE
      end
    end

    test 'the view shows a remote session as remote' do
      with_office_foothold
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      row = network_view['footholds'][0]['hosts'].find { |h| h['id'] == 'lena_pc' }
      assert_equal({ 'username' => 'lfox', 'displayName' => 'Lena Fox', 'via' => 'password', 'remote' => true }, row['session'])
    end
  end
end
