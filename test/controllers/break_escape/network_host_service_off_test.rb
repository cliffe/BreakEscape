require 'test_helper'
require_relative '../../support/network_model_scenario'

module BreakEscape
  # Networks slice 9.3b, plan 5.2 "A host whose own service is off": a sign-in host whose
  # office-life `affordance.offWhen` (9.2's field) holds on the server shows as not responding
  # in the view, and a remote sign-in, a remote desktop and a scoped request under a remote
  # session there are refused 403 unreachable. A session already held there is kept, and works
  # again once the service is back. The keyboard is not the network: a walk-up sign-in is
  # judged as before.
  class NetworkHostServiceOffTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    NS = NetworkModelScenario
    OFFICE = 'jack_comms_port'.freeze
    LENA_OFF = 'lena_pc_unplugged'.freeze

    def state
      @game.reload.player_state
    end

    def set_global(name, value)
      @game.reload
      @game.player_state['globalVariables'] ||= {}
      @game.player_state['globalVariables'][name] = value
      @game.save!
    end

    # lena_pc's service is off while lena_pc_unplugged is true; sam_pc uses the
    # `{ name: value }` form of offWhen.
    def scenario_with_service_off(lena_off:, sam_power: 'on')
      data = NS.scenario
      pcs = data['rooms'].values.flat_map { |room| room['objects'] || [] }
      pcs.find { |o| o['id'] == 'lena_pc' }['affordance'] = { 'offWhen' => LENA_OFF }
      pcs.find { |o| o['id'] == 'sam_pc' }['affordance'] = { 'offWhen' => { 'sam_pc_power' => 'off' } }
      data['globalVariables'] = (data['globalVariables'] || {}).merge(LENA_OFF => lena_off, 'sam_pc_power' => sam_power)
      data
    end

    # The pivot fixture (office_lan linked to server_net) with Lena's PC switchable
    def with_pivot_foothold
      data = NS.with_pivot
      lena = data['rooms'].values.flat_map { |room| room['objects'] || [] }.find { |o| o['id'] == 'lena_pc' }
      lena['affordance'] = { 'offWhen' => LENA_OFF }
      data['globalVariables'] = (data['globalVariables'] || {}).merge(LENA_OFF => false)
      build_network_game({}, data)
      take_drop_box
      plant('comms_port')
      assert_response :success, response.body
    end

    def with_foothold(lena_off:, sam_power: 'on')
      build_network_game({}, scenario_with_service_off(lena_off: lena_off, sam_power: sam_power))
      take_drop_box
      plant('comms_port')
      assert_response :success, response.body
    end

    def row(id)
      view = network_view(OFFICE)
      view['footholds'].find { |f| f['id'] == OFFICE }['hosts'].find { |h| h['id'] == id }
    end

    test 'a host whose offWhen holds is listed as not responding, with no sign-in or session' do
      with_foothold(lena_off: true)
      lena = row('lena_pc')
      assert lena, 'the host stays listed (its name is already exposed by its network)'
      assert_equal false, lena['responding']
      refute lena.key?('remoteSignIn'), 'no sign-in is offered'
      refute lena.key?('session'), 'no session is offered'

      kiosk = row('kiosk_pc')
      refute kiosk.key?('responding'), 'a host with no offWhen carries no responding field'
      assert kiosk.key?('remoteSignIn')
    end

    test 'a remote sign-in to a host whose service is off is 403 unreachable, before the password is read' do
      with_foothold(lena_off: true)
      body = sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      assert_response :forbidden
      assert_equal 'unreachable', body['reason']
      refute body.to_json.include?('lfox'), 'nothing about the account comes back'
      refute state['sessions'].to_h.key?('lena_pc'), 'no session is written'
      assert_empty state['loginFailures'].to_h, 'no failed attempt is counted'

      # Switched back on, the same request signs in and the row offers it again.
      set_global(LENA_OFF, false)
      assert_equal true, row('lena_pc')['remoteSignIn']
      body = sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      assert_response :success, body.inspect
    end

    test 'a held remote session is kept while the service is off, its desktop and scoped requests refused, and reopens' do
      with_foothold(lena_off: false)
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      assert_response :success, response.body
      assert_equal 'Lena Fox', row('lena_pc')['session']['displayName']

      set_global(LENA_OFF, true)
      container('lena_pc', foothold: OFFICE)
      assert_response :forbidden
      assert_equal 'unreachable', response.parsed_body['reason']
      container('lena_local')
      assert_response :forbidden, 'a file on the host is refused under the remote session'
      @game.reload
      refute @game.session_route_up?('lena_pc'), 'the scoped-request test reads the service too'
      assert state['sessions'].key?('lena_pc'), 'the session is kept'
      assert_equal false, row('lena_pc')['responding']

      set_global(LENA_OFF, false)
      body = container('lena_pc', foothold: OFFICE)
      assert_response :success, body.inspect
      assert_includes body['contents'].map { |c| c['id'] }, 'lena_local'
    end

    test 'the hash form of offWhen matches on value, and the keyboard is not refused' do
      with_foothold(lena_off: false, sam_power: 'off')
      assert_equal false, row('sam_pc')['responding'], "{ name: value } holds when the global equals the value"
      sign_in('sam_pc', 'sokafor', NS::SAM_PASSWORD, foothold: OFFICE)
      assert_response :forbidden

      # Walk-up: the remote rule does not apply at the keyboard (plan 5.2 names remote requests)
      body = sign_in('sam_pc', 'sokafor', NS::SAM_PASSWORD)
      assert_response :success, body.inspect

      set_global('sam_pc_power', 'on')
      refute row('sam_pc').key?('responding'), 'another value does not hold'
    end

    # Review R1 M1: a switched-off PC is off for everything that goes through it, so it relays
    # no pivot. structural_reach still counts it, so nothing is pruned.
    test 'an off host carries no onward pivot; the onward session is kept and returns with the power' do
      with_pivot_foothold
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      body = sign_in('sv_fs02', 'ishaw', NS::IAN_PASSWORD, foothold: OFFICE)
      assert_response :success, body.inspect

      set_global(LENA_OFF, true)
      refute_includes @game.player_reach(OFFICE), 'server_net', 'the off host relays nothing onward'
      assert_includes @game.structural_reach(OFFICE), 'server_net', 'the structure is unchanged'
      server = network_view(OFFICE)['footholds'].find { |f| f['id'] == OFFICE }['networks'].find { |b| b['id'] == 'server_net' }
      assert_equal 'down', server && server['route'], 'the onward session shows in a down block'
      container('sv_fs02', foothold: OFFICE)
      assert_response :forbidden
      state['sessions'].then { |s| assert s.key?('sv_fs02') && s.key?('lena_pc'), 'both sessions are kept' }

      set_global(LENA_OFF, false)
      assert_includes @game.player_reach(OFFICE), 'server_net'
      body = container('sv_fs02', foothold: OFFICE)
      assert_response :success, body.inspect
    end

    test 'a fresh sign-in across the link through an off pivot host is refused' do
      with_pivot_foothold
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      set_global(LENA_OFF, true)
      sign_in('sv_fs02', 'ishaw', NS::IAN_PASSWORD, foothold: OFFICE)
      assert_response :forbidden
      refute state['sessions'].key?('sv_fs02')
    end

    # Review R1 M2: a share is not served through a session at an off host, nor through a remote
    # session whose route is down
    test 'a share is not served through a session at an off host or over a route that is down' do
      with_pivot_foothold
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      sign_in('sv_fs02', 'ishaw', NS::IAN_PASSWORD, foothold: OFFICE)
      container('ledger_archive')
      assert_response :success, 'served through Lena (finance) while her PC is on'
      container('backup_vault')
      assert_response :success, 'served through Ian (it) at the server host'

      set_global(LENA_OFF, true)
      container('ledger_archive')
      assert_response :not_found, 'not through an off host'
      @game.reload
      refute @game.session_route_up?('sv_fs02'), "the server session's route is down"
      container('backup_vault')
      assert_response :not_found, 'not through a remote session whose route is down'

      set_global(LENA_OFF, false)
      container('ledger_archive')
      assert_response :success
      container('backup_vault')
      assert_response :success
    end

    test 'an off row names a session that is kept there' do
      with_foothold(lena_off: false)
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      set_global(LENA_OFF, true)
      lena = row('lena_pc')
      assert_equal 'Lena Fox', lena['heldAs']
      refute lena.key?('session')
    end
  end
end
