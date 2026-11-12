require 'test_helper'
require_relative '../../support/network_model_scenario'

module BreakEscape
  # Networks slice 9.3b sub-slice O (docs/achitechture/ACCESS_MODEL_SLICE_9_3B_PLAN.md 5.2):
  # outages. A network (or a resource) can be down while a global is truthy. While down its
  # hosts and shares leave the view and are not served; a held session over a downed route is
  # kept but shown "no route" and reopens when the route returns; a pivot is ended only by
  # sign-out, never by an outage. The server reads the outage global from its own state, so a
  # tampered client cannot reach a downed network, clear the global, or keep a no-route
  # session. Beats N5 to N7, plus the scoped-request route test and the resource-side outage.
  class NetworkOutagesTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    NS = NetworkModelScenario
    OFFICE = 'jack_comms_port'.freeze

    def state
      @game.reload.player_state
    end

    def set_global(name, value)
      @game.reload
      @game.player_state['globalVariables'] ||= {}
      @game.player_state['globalVariables'][name] = value
      @game.save!
    end

    def with_outage_foothold(down: true)
      build_network_game({}, NS.with_outage(down: down))
      take_drop_box
      plant('comms_port')
      assert_response :success, response.body
    end

    def networks_block(foothold)
      view = network_view(foothold)
      view['footholds'].find { |f| f['id'] == foothold }['networks']
    end

    # ---- N5: a down-by-default network nobody has reached is absent and unnamed ----------

    test 'N5: a network down by default is absent from the view and a sign-in on it is refused' do
      with_outage_foothold(down: true)
      # A pivot session on the office network, but server_net is down, so it never comes
      # into reach and is never named: no up block, no greyed block.
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      @game.reload
      assert_equal Set['office_lan'], @game.player_reach(OFFICE), 'the down network is not reached'
      assert_equal %w[office_lan], networks_block(OFFICE).map { |b| b['id'] }, 'server_net is absent'

      # A sign-in on the down network is 403 unreachable, before the password is read.
      sign_in('sv_fs02', 'ishaw', NS::IAN_PASSWORD, foothold: OFFICE)
      assert_response :forbidden
      refute_exposed('N5 down by default', NS::SERVER_STRINGS)
    end

    test 'N5: a tampered client cannot clear the outage global the server reads' do
      with_outage_foothold(down: true)
      @game.reload
      refute @game.network_up?('server_net'), 'the server reads its own global, down by default'
      # The down network is withheld from mapped_shares and resource_admits_player? too.
      refute @game.resource_admits_player?(@game.scenario_data['resources']['backup_vault'])
    end

    # ---- N6: a repair fills the block in ------------------------------------------------

    test 'N6: setting the global false brings the server network into reach and its hosts sign in' do
      with_outage_foothold(down: true)
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)

      set_global(NS::OUTAGE_GLOBAL, false)
      assert @game.network_up?('server_net'), 'repaired'
      assert_includes @game.player_reach(OFFICE), 'server_net'
      server = networks_block(OFFICE).find { |b| b['id'] == 'server_net' }
      assert server, 'the server_net block fills in'
      assert_equal 'up', server['route']

      body = sign_in('sv_fs02', 'ishaw', NS::IAN_PASSWORD, foothold: OFFICE)
      assert_response :success, body.inspect
    end

    # ---- N7: a held session over a route that goes down is kept and shown "no route" ----

    test 'N7: a held session is kept when the route goes down, shown no route, and reopens on repair' do
      with_outage_foothold(down: false)
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      sign_in('sv_fs02', 'ishaw', NS::IAN_PASSWORD, foothold: OFFICE)
      assert state['sessions'].key?('sv_fs02'), 'the onward session is held'

      # The route goes down: the session is kept (it is still in structural_reach), and the
      # view draws a greyed down block for server_net with a "no route" row.
      set_global(NS::OUTAGE_GLOBAL, true)
      assert @game.player_state['sessions'].key?('sv_fs02'), 'the session is kept across the outage'
      server = networks_block(OFFICE).find { |b| b['id'] == 'server_net' }
      assert server, 'server_net is still named (the player learned it by signing in)'
      assert_equal 'down', server['route']
      assert_includes server['hosts'].map { |h| h['id'] }, 'sv_fs02'

      # Its desktop is refused while down, with no state change.
      container('sv_fs02', foothold: OFFICE)
      assert_response :forbidden
      assert state['sessions'].key?('sv_fs02'), 'the session survives the refused desktop request'

      # The route returns: the desktop opens again with no password (the session was kept).
      set_global(NS::OUTAGE_GLOBAL, false)
      body = container('sv_fs02', foothold: OFFICE)
      assert_response :success, body.inspect
      assert state['sessions'].key?('sv_fs02')
    end

    # ---- The scoped-request route test, judged from the server's own session record ------

    test 'the scoped route test refuses a scoped request over a down route and allows it when up' do
      with_outage_foothold(down: false)
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      sign_in('sv_fs02', 'ishaw', NS::IAN_PASSWORD, foothold: OFFICE)
      @game.reload
      assert_equal OFFICE, @game.player_state['sessions']['sv_fs02']['foothold'], 'a remote session carries a foothold'
      assert @game.session_route_up?('sv_fs02'), 'the route is up'
      assert @game.session_admits?({ type: 'login_pc', id: 'sv_fs02' })

      set_global(NS::OUTAGE_GLOBAL, true)
      refute @game.session_route_up?('sv_fs02'), 'read from the server session record, not a client foothold'
      refute @game.session_admits?({ type: 'login_pc', id: 'sv_fs02' }), 'the scoped request is refused while down'
      refute @game.scope_admitted_by_session?({ type: 'login_pc', id: 'sv_fs02' }, 'sv_fs02')
      assert @game.player_state['sessions'].key?('sv_fs02'), 'the session record survives'
    end

    test 'a local session (blank foothold) is never refused by the route test' do
      with_outage_foothold(down: true)
      @game.reload
      # A walk-up claim on a network the player holds no foothold on: no foothold, so never pruned
      # and never route-tested.
      @game.player_state['sessions'] = { 'bench_pc' => { 'id' => 'sam', 'via' => 'claim' } }
      @game.save!
      assert @game.session_route_up?('bench_pc'), 'a blank-foothold session is judged as 9.3a did'
    end

    # ---- The resource-side outage (the player side of a resource downIf) -----------------

    test 'a resource whose own downIf is truthy is withheld and not served, and returns on repair' do
      build_network_game({}, NS.with_resource_outage(down: true))
      take_drop_box
      plant('comms_port')
      @game.reload
      share = @game.scenario_data['resources']['archive_down']

      assert @game.resource_down?(share), 'the resource is down by default'
      refute @game.resource_admits_player?(share), 'a down resource is not served'
      view = network_view(OFFICE)['footholds'].find { |f| f['id'] == OFFICE }
      refute_includes view['hosts'].map { |h| h['id'] }, 'archive_down', 'the down resource row is withheld'
      refute_includes response.body, NS::OUTAGE_SHARE_TEXT

      set_global(NS::RESOURCE_OUTAGE_GLOBAL, false)
      assert @game.resource_admits_player?(@game.scenario_data['resources']['archive_down']), 'served after repair'
      view = network_view(OFFICE)['footholds'].find { |f| f['id'] == OFFICE }
      assert_includes view['hosts'].map { |h| h['id'] }, 'archive_down', 'the resource row returns'
    end
  end
end
