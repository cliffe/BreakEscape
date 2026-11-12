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
  end
end
