require 'test_helper'
require_relative '../../support/network_ops_scenario'

module BreakEscape
  # Ops core S1 (OPS_CORE_PLAN.md 5.2): discovery changes the view and nothing else. On an
  # unswept discovery network, with a PC id the client was never sent, sign-in, tiles, the desktop
  # and shares answer as they do on the same network declared open.
  class NetworkDiscoveryDisplayTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests

    OFFICE = NetworkOpsScenario::OFFICE
    LENA = NetworkModelScenario::LENA_PASSWORD
    SAM = NetworkModelScenario::SAM_PASSWORD

    def hold(discovery)
      hold_office_foothold({}, ops_scenario(discovery: discovery))
    end

    # The answers to a fixed list of requests, each as [status, body].
    def run_requests
      out = []
      take = lambda do |label, body|
        out << [label, response.status, response.body]
        body
      end
      get game_path('login_accounts'), params: { pc_id: 'sam_pc', foothold: OFFICE }, as: :json
      take.call('tiles', nil)
      get game_path('login_accounts'), params: { pc_id: 'lena_pc', foothold: OFFICE }, as: :json
      take.call('tiles lena', nil)
      sign_in('sam_pc', 'sokafor', 'wrong-password', foothold: OFFICE)
      take.call('bad sign-in', nil)
      sign_in('lena_pc', 'lfox', LENA, foothold: OFFICE)
      take.call('sign-in lena', nil)
      sign_in('sam_pc', 'sokafor', SAM, foothold: OFFICE)
      take.call('sign-in sam', nil)
      container('lena_pc', foothold: OFFICE)
      take.call('desktop lena', nil)
      container('sam_pc', foothold: OFFICE)
      take.call('desktop sam', nil)
      container('scanned_inbox', foothold: OFFICE)
      take.call('open share', nil)
      container('ledger_archive', foothold: OFFICE)
      take.call('protected share', nil)
      get game_path('keyring'), as: :json
      take.call('keyring', nil)
      out
    end

    LENA_RDP = { 'id' => 'lena_rdp_file', 'type' => 'text_file', 'name' => 'HB-FIN-02.rdp', 'credential' => 'lena_rdp' }.freeze

    # The ops scenario with a saved connection to lena_pc (a keyring entry whose proof is a held
    # item), so the keyring and the credential routes have something to offer.
    def credential_scenario(discovery)
      data = ops_scenario(discovery: discovery)
      data['rooms']['lobby']['objects'] << { 'id' => 'lena_rdp_file', 'type' => 'text_file', 'name' => 'HB-FIN-02.rdp',
                                             'takeable' => true, 'credential' => 'lena_rdp', 'text' => 'Saved connection.' }
      data['credentials'] = { 'lena_rdp' => { 'kind' => 'saved_connection', 'account' => 'lena', 'connectsTo' => 'lena_pc',
                                              'proof' => { 'held' => 'lena_rdp_file' } } }
      data
    end

    def hold_with_credentials(discovery)
      hold_office_foothold({ 'inventory' => [LENA_RDP.dup], 'encounteredNPCs' => %w[sam lena] }, credential_scenario(discovery))
    end

    def login(params)
      post game_path('login'), params: params, as: :json
    end

    # The keyring's offered routes, credential sign-in through the foothold, and the two sign-ins
    # from a held desktop (typed, and by credential): each as [label, status, body].
    def run_credential_requests
      out = []
      take = ->(label) { out << [label, response.status, response.body] }
      get game_path('keyring'), params: { pc_id: 'lena_pc', foothold: OFFICE }, as: :json
      take.call('keyring offered through the foothold')
      get game_path('keyring'), as: :json
      take.call('keyring')
      login(pc_id: 'lena_pc', credential: 'lena_rdp', foothold: OFFICE)
      take.call('credential sign-in through the foothold')
      login(pc_id: 'lena_pc', credential: 'no_such_entry', foothold: OFFICE)
      take.call('credential sign-in, unknown entry')
      sign_in('sam_pc', 'sokafor', SAM)
      take.call('keyboard sign-in at sam_pc')
      login(pc_id: 'lena_pc', username: 'lfox', password: LENA, from: 'sam_pc')
      take.call('typed sign-in from the held desktop')
      login(pc_id: 'lena_pc', credential: 'lena_rdp', from: 'sam_pc')
      take.call('credential sign-in from the held desktop')
      get game_path('keyring'), params: { pc_id: 'lena_pc', from: 'sam_pc' }, as: :json
      take.call('keyring offered from the held desktop')
      out
    end

    test 'the keyring routes, credential sign-in and sign-in from a held desktop answer on an unswept discovery network as on an open one' do
      hold_with_credentials('open')
      reference = run_credential_requests
      statuses = reference.to_h { |label, status, _body| [label, status] }
      assert_equal 200, statuses['credential sign-in through the foothold'], 'the reference run really signs in by credential'
      assert_equal 200, statuses['credential sign-in from the held desktop']
      assert_includes reference.first[2], 'lena_rdp', 'the keyring offers the entry'
      assert_includes reference.first[2], OFFICE, 'and names the foothold as the route'
      hold_with_credentials('scan')
      discovered = run_credential_requests
      assert_equal reference.map { |l, s, b| [l, s, normalise(b)] }, discovered.map { |l, s, b| [l, s, normalise(b)] }
      assert_equal({}, ops_state['opsDiscovered'], 'none of it discovered anything')
    end

    def normalise(text)
      text.gsub(/"(?:gainedAt|at|ts)":\d+/, '"t":0').gsub(/"rev":"[0-9a-f]+"/, '"rev":"r"')
    end

    test 'sign-in, tiles, desktops, shares and the keyring answer on an unswept discovery network as on an open one' do
      hold('open')
      reference = run_requests
      assert_includes reference.map { |r| r[1] }, 200
      hold('scan')
      discovered = run_requests
      assert_equal reference.map { |l, s, b| [l, s, normalise(b)] }, discovered.map { |l, s, b| [l, s, normalise(b)] }
      assert_equal({}, ops_state['opsDiscovered'], 'none of it discovered anything')
    end

    test 'a PC id never sent to the client signs in remotely on the unswept network' do
      hold('scan')
      body = sign_in('lena_pc', 'lfox', LENA, foothold: OFFICE)
      assert_response :success, body.inspect
      assert ops_state['sessions'].key?('lena_pc')
    end

    test 'the unswept block lists rows only for PCs the player holds a session on, and keeps them after the sweep' do
      hold('scan')
      assert_equal [], view_hosts, 'the flat list names nothing'
      office = view_blocks.find { |b| b['id'] == 'office_lan' }
      assert_equal [], office['hosts']
      assert_equal false, office['swept']
      refute office.key?('ops'), 'no ops key before the sweep'
      sign_in('lena_pc', 'lfox', LENA, foothold: OFFICE)
      assert_equal %w[lena_pc], view_hosts.map { |h| h['id'] }
      office = view_blocks.find { |b| b['id'] == 'office_lan' }
      assert_equal %w[lena_pc], office['hosts'].map { |h| h['id'] }
      assert_equal false, office['swept']
      refute office.key?('ops')
      row = office['hosts'].first
      refute row.key?('scanned')
      refute row.key?('services')
      ops_scan(OFFICE, host_id: 'lena_pc')
      assert_response :not_found, 'no Scan until the sweep'
      ops_scan(OFFICE, network_id: 'office_lan')
      assert_response :success
      office = view_blocks.find { |b| b['id'] == 'office_lan' }
      assert_equal true, office['swept']
      assert_equal true, office['ops']
      ids = office['hosts'].map { |h| h['id'] }
      assert_includes ids, 'lena_pc'
      assert_includes ids, 'sam_pc'
      assert_includes ids, 'print_srv'
      assert_includes ids, 'scanned_inbox'
      assert_equal view_hosts.map { |h| h['id'] }, ids
    end

    test 'the unswept block lists no share and no device, but an open share is still served by GET /container' do
      hold('scan')
      ids = view_blocks.find { |b| b['id'] == 'office_lan' }['hosts'].map { |h| h['id'] }
      assert_equal [], ids
      container('scanned_inbox', foothold: OFFICE)
      assert_response :success
    end

    test 'an open network lists its rows with no sweep, devices included, and marks ops where a host declares services' do
      hold('open')
      office = view_blocks.find { |b| b['id'] == 'office_lan' }
      ids = office['hosts'].map { |h| h['id'] }
      %w[sam_pc print_srv lab_box cam_one plain_cam scanned_inbox].each { |id| assert_includes ids, id }
      assert_equal true, office['ops']
      refute office.key?('swept')
    end

    test 'a block of a network with no discovery and no services carries neither key' do
      hold('scan')
      build_ops_game({}, NetworkModelScenario.with_pivot)
      take_drop_box
      plant('comms_port')
      office = view_blocks.find { |b| b['id'] == 'office_lan' }
      refute office.key?('swept')
      refute office.key?('ops')
      refute office.key?('cli')
    end

    test 'a device row has its name and sprite and marks a powered-down device as not responding' do
      hold_office_foothold({ 'globalVariables' => { 'lab_off' => true } }, ops_scenario(discovery: 'open'))
      rows = view_hosts.to_h { |h| [h['id'], h] }
      assert_equal({ 'id' => 'print_srv', 'kind' => 'device', 'name' => NetworkOpsScenario::DEVICE_NAME, 'sprite' => 'printer' }, rows['print_srv'])
      assert_equal false, rows['lab_box']['responding']
      refute rows['print_srv'].key?('responding')
    end

    test 'a scanned host carries scanned and its services in GET /network, and an unscanned one carries neither' do
      hold('scan')
      ops_scan(OFFICE, network_id: 'office_lan')
      rows = view_hosts.to_h { |h| [h['id'], h] }
      refute rows['sam_pc'].key?('services')
      ops_scan(OFFICE, host_id: 'sam_pc')
      ops_scan(OFFICE, host_id: 'print_srv')
      rows = view_hosts.to_h { |h| [h['id'], h] }
      assert_equal true, rows['sam_pc']['scanned']
      assert_equal %w[web files], rows['sam_pc']['services'].map { |s| s['name'] }
      assert_equal true, rows['print_srv']['scanned']
      refute rows['lab_box'].key?('scanned')
    end
  end
end
