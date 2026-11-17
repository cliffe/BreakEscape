require 'test_helper'
require_relative '../../support/network_model_scenario'

module BreakEscape
  # Credential keyring K0 (docs/achitechture/CREDENTIAL_KEYRING_PLAN.md, section 5): a GET
  # /login_accounts request that carries a foothold is the remote sign-in screen's tile
  # branch. It is judged by reach through the foothold, not at the keyboard, shows the PC's
  # own account tiles (by remoteScreen and loginPicker), and never carries the sticky note.
  # The keyboard answer (no foothold) is unchanged.
  class NetworkRemoteTilesTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    NS = NetworkModelScenario
    OFFICE = 'jack_comms_port'.freeze

    def state
      @game.reload.player_state
    end

    def remote_tiles(pc_id, foothold)
      get game_path('login_accounts'), params: { pc_id: pc_id, foothold: foothold }, as: :json
      response.parsed_body
    end

    def keyboard_tiles(pc_id)
      get game_path('login_accounts'), params: { pc_id: pc_id }, as: :json
      response.parsed_body
    end

    def with_office_foothold(player_state = {}, scenario = NS.scenario)
      build_network_game(player_state, scenario)
      take_drop_box
      plant('comms_port')
      assert_response :success, response.body
    end

    # ---- the five steps of the branch (section 5.1) -----------------------------------

    test 'step 1: a foothold longer than 64 characters is 400 and never falls through to the keyboard' do
      with_office_foothold
      remote_tiles('lena_pc', 'x' * 65)
      assert_response :bad_request
      assert_equal 'Invalid foothold', response.parsed_body['error']
    end

    test 'step 2: a short foothold that is not held or does not reach the host is 403' do
      with_office_foothold
      body = remote_tiles('lena_pc', 'jack_not_held')
      assert_response :forbidden
      assert_equal 'PC not reachable: lena_pc', body['error']
    end

    test 'step 2: a held foothold that reaches a different host but not this one is 403 (R1 m3)' do
      # A foothold on workshop_lan only. It reaches the bench PC on its own network, but Sam's
      # PC on office_lan is held-but-off-network: host_reachable_through? must judge the reach,
      # not merely that the foothold is held.
      build_network_game
      take_drop_box
      plant('bench_port')
      assert_response :success, response.body
      bench = remote_tiles('bench_pc', 'jack_bench_port')
      assert_response :success
      assert_equal 'WS-BENCH-01', bench['host']
      off_net = remote_tiles('sam_pc', 'jack_bench_port')
      assert_response :forbidden
      assert_equal 'PC not reachable: sam_pc', off_net['error']
    end

    test 'a structured foothold param is coerced to a string and never 500s or falls through (R1 m4)' do
      # ?foothold[]=... makes params[:foothold] an array; the controller sends .to_s, so the
      # string guard and the footholds lookup handle it: a 403 (not held), never a 500 or the
      # keyboard answer.
      with_office_foothold
      get game_path('login_accounts'), params: { pc_id: 'sam_pc', foothold: ['jack_comms_port'] }, as: :json
      assert_response :forbidden
      assert_equal 'PC not reachable: sam_pc', response.parsed_body['error']
      refute response.parsed_body.key?('postitNote'), 'a structured foothold never reaches the keyboard answer'
    end

    test 'step 3: a PC whose policy blocks remote sign-in is 422 remoteBlocked' do
      with_office_foothold
      body = remote_tiles('kiosk_pc', OFFICE)
      assert_response :unprocessable_entity
      assert_equal({ 'remoteBlocked' => true }, body)
    end

    test 'step 4: a host whose own service is off is 403 not_responding' do
      data = NS.scenario
      data['rooms'].values.flat_map { |r| r['objects'] || [] }
          .find { |o| o['id'] == 'lena_pc' }['offWhen'] = 'lena_off'
      data['globalVariables'] = (data['globalVariables'] || {}).merge('lena_off' => true)
      with_office_foothold({}, data)
      body = remote_tiles('lena_pc', OFFICE)
      assert_response :forbidden
      assert_equal 'not_responding', body['reason']
    end

    test 'step 5: a reaching foothold answers the PC tiles with host, headless, loginPicker and remoteScreen' do
      with_office_foothold
      body = remote_tiles('sam_pc', OFFICE)
      assert_response :success
      assert_equal 'sam_pc', body['pc_id']
      assert_equal 'HB-DESK-01', body['host']
      assert_equal false, body['headless']
      assert_equal 'accounts', body['loginPicker']
      assert_equal 'tiles', body['remoteScreen']
      usernames = body['loginAccounts'].map { |t| t['username'] }
      # Sam's PC admits every account holder (staff), so all three tiles show.
      assert_equal %w[ishaw lfox sokafor].sort, usernames.sort
      assert(body['loginAccounts'].all? { |t| t.key?('displayName') && t.key?('portrait') })
    end

    test 'step 5: a finance PC lists only the account it admits' do
      with_office_foothold
      body = remote_tiles('lena_pc', OFFICE)
      assert_response :success
      assert_equal %w[lfox], body['loginAccounts'].map { |t| t['username'] }
    end

    # ---- loginPicker and remoteScreen variations --------------------------------------

    test 'picker known over the network lists only encountered accounts' do
      data = NS.scenario
      data['rooms'].values.flat_map { |r| r['objects'] || [] }
          .find { |o| o['id'] == 'sam_pc' }['loginPicker'] = 'known'
      with_office_foothold({ 'encounteredNPCs' => %w[lena] }, data)
      body = remote_tiles('sam_pc', OFFICE)
      assert_response :success
      assert_equal 'known', body['loginPicker']
      assert_equal %w[lfox], body['loginAccounts'].map { |t| t['username'] }
    end

    test 'remoteScreen typed answers an empty list and names the mode' do
      data = NS.scenario
      data['policies']['nla'] = { 'remote' => 'allowed', 'remoteScreen' => 'typed' }
      data['rooms'].values.flat_map { |r| r['objects'] || [] }
          .find { |o| o['id'] == 'sam_pc' }['policy'] = 'nla'
      with_office_foothold({}, data)
      body = remote_tiles('sam_pc', OFFICE)
      assert_response :success
      assert_equal 'typed', body['remoteScreen']
      assert_equal [], body['loginAccounts']
    end

    test 'a headless host over a reaching foothold is 200 with headless true and no tiles' do
      with_office_foothold
      body = remote_tiles('door_box', OFFICE)
      assert_response :success
      assert_equal true, body['headless']
      assert_equal [], body['loginAccounts']
      assert_equal 'HB-DOOR-01', body['host']
    end

    # ---- the post-it is never served over the network ---------------------------------

    test 'no postitNote through a foothold even when the owner writes their password down' do
      data = NS.scenario
      sam = data['rooms']['lobby']['npcs'].find { |n| n['id'] == 'sam' }
      sam['habits'] = { 'writesDown' => true }
      with_office_foothold({}, data)

      kb = keyboard_tiles('sam_pc')
      assert_response :success
      assert kb['postitNote'].is_a?(String) && !kb['postitNote'].empty?, 'the keyboard answer carries the written-down note'

      remote = remote_tiles('sam_pc', OFFICE)
      assert_response :success
      refute remote.key?('postitNote'), 'a remote sign-in screen never carries the post-it'
    end

    # ---- the keyboard answer is unchanged by the new branch ---------------------------

    test 'the keyboard answer carries no remote-only fields and keeps its shape' do
      with_office_foothold
      body = keyboard_tiles('sam_pc')
      assert_response :success
      assert_equal 'sam_pc', body['pc_id']
      assert body.key?('loginAccounts')
      %w[host headless remoteScreen loginPicker].each do |field|
        refute body.key?(field), "the keyboard answer must not carry '#{field}'"
      end
    end

    test 'a headless host at the keyboard is still 403, unchanged by the branch' do
      with_office_foothold
      keyboard_tiles('door_box')
      assert_response :forbidden
    end

    # ---- a whitespace-only foothold is still a foothold request (R1 m1) ----------------
    # params[:foothold].present? is false for a whitespace-only scalar, so a request carrying
    # foothold=%09 or foothold=%20%20 used to fall through to the keyboard branch and win the
    # keyboard answer (and the post-it). A foothold request must never reach the keyboard branch.

    test 'a whitespace foothold on a post-it PC never gets the keyboard answer or the note (R1 m1)' do
      data = NS.scenario
      sam = data['rooms']['lobby']['npcs'].find { |n| n['id'] == 'sam' }
      sam['habits'] = { 'writesDown' => true }
      with_office_foothold({}, data)

      # The keyboard answer here does carry the written-down note, to prove the whitespace
      # foothold is diverted away from exactly this branch.
      kb = keyboard_tiles('sam_pc')
      assert_response :success
      assert kb['postitNote'].is_a?(String) && !kb['postitNote'].empty?, 'the keyboard answer carries the note'

      ["\t", '  ', ' '].each do |ws|
        body = remote_tiles('sam_pc', ws)
        refute_equal 'sam_pc', body['pc_id'], "a whitespace foothold (#{ws.inspect}) must not win the keyboard answer"
        refute body.key?('postitNote'), "a whitespace foothold (#{ws.inspect}) must never carry the post-it"
        # It is judged by reach: the whitespace string is not a held foothold, so 403 not reachable.
        assert_response :forbidden
        assert_equal 'PC not reachable: sam_pc', body['error']
      end
    end

    test 'an empty foothold= still gets the keyboard answer and its note (R1 m1)' do
      data = NS.scenario
      sam = data['rooms']['lobby']['npcs'].find { |n| n['id'] == 'sam' }
      sam['habits'] = { 'writesDown' => true }
      with_office_foothold({}, data)

      body = remote_tiles('sam_pc', '')
      assert_response :success
      assert_equal 'sam_pc', body['pc_id']
      assert body['postitNote'].is_a?(String) && !body['postitNote'].empty?, 'an empty foothold stays on the keyboard path'
    end

    test 'a hash foothold is coerced and 403s, never falling through to the keyboard (R1 m1)' do
      with_office_foothold
      get game_path('login_accounts'), params: { pc_id: 'sam_pc', foothold: { a: 'jack_comms_port' } }, as: :json
      assert_response :forbidden
      assert_equal 'PC not reachable: sam_pc', response.parsed_body['error']
      refute response.parsed_body.key?('postitNote'), 'a hash foothold never reaches the keyboard answer'
    end
  end
end
