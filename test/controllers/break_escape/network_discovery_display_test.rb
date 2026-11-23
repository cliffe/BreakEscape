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

    def normalise(text)
      text.gsub(/"(?:gainedAt|at|ts)":\d+/, '"t":0')
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
