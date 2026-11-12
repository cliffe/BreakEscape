require 'test_helper'
require_relative '../../support/network_model_scenario'

module BreakEscape
  # Networks slice 9.3b sub-slice O (docs/achitechture/ACCESS_MODEL_SLICE_9_3B_PLAN.md 5.2):
  # outages. A network (or a resource) can be down while a global is truthy. While down its
  # hosts and shares leave the view and are not served; a held session over a downed route is
  # kept but shown "no route" and reopens when the route returns; a pivot is ended only by
  # sign-out, never by an outage. The server reads the outage global from its own state. The
  # global is client-syncable (plan 5.2), so an outage is only a soft gate: a tampered client
  # can clear it, but reach still needs a server-held foothold or session and a host still
  # demands its password, so nothing unreached is served or named. Beats N5 to N7, plus the
  # scoped-request route test and the resource-side outage.
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

    test 'N5: the server reads the outage global from its own state (down by default)' do
      with_outage_foothold(down: true)
      @game.reload
      refute @game.network_up?('server_net'), 'the server reads its own global, down by default'
      # The down network is withheld from mapped_shares and resource_admits_player? too.
      refute @game.resource_admits_player?(@game.scenario_data['resources']['backup_vault'])
    end

    # The outage global is an ordinary, client-syncable global (plan 5.2): a tampered client CAN
    # clear it. That is not a hole, because an outage is only a soft gate. The real guarantee is
    # that clearing it reaches nothing a boundary would stop: nothing is reached without a
    # server-held foothold, and a host brought back into reach still demands its password.

    test 'N5: a hostile sync clearing the outage reaches nothing and names nothing without a foothold' do
      build_network_game({}, NS.with_outage(down: true))
      take_drop_box
      # No plant: the player holds no foothold anywhere.
      assert_empty @game.reload.network_footholds, 'no foothold is held'

      # The hostile client clears the outage global over the real sync route. The server stores
      # it (the global is client-writable by design), so network_up? now reads "up"...
      sync_globals(NS::OUTAGE_GLOBAL => false)
      @game.reload
      assert @game.network_up?('server_net'), 'the outage global is client-writable, so it clears'

      # ...but with no foothold the server network is never reached, so its hosts and shares are
      # not served and nothing on it is named.
      refute @game.resource_admits_player?(@game.scenario_data['resources']['backup_vault']),
             'a down-network host is still not served without a foothold'
      network_view
      refute_exposed('hostile sync, no foothold (network view)', NS::SERVER_STRINGS)
      bootstrap_scenario
      refute_exposed('hostile sync, no foothold (bootstrap scenario)', NS::SERVER_STRINGS)
    end

    test 'N5: a hostile sync clearing the outage with a foothold lifts the soft gate but the host still demands its password' do
      with_outage_foothold(down: true)
      # An office pivot session, the route onto server_net once it is up.
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)

      sync_globals(NS::OUTAGE_GLOBAL => false)
      @game.reload
      assert @game.network_up?('server_net'), 'the global cleared'
      assert_includes @game.player_reach(OFFICE), 'server_net', 'the server network is now in reach'

      # The host is reachable now, but the outage was only a soft gate: a wrong password is a
      # password failure, not the 403 "PC not reachable", and opens no session.
      body = sign_in('sv_fs02', 'ishaw', 'wrong-password', foothold: OFFICE)
      refute_equal 'PC not reachable', body['message'], 'the host is reachable, so this is a password gate'
      refute @game.reload.player_state['sessions'].key?('sv_fs02'), 'a wrong password opens no session'

      # The real password still signs in.
      body = sign_in('sv_fs02', 'ishaw', NS::IAN_PASSWORD, foothold: OFFICE)
      assert_response :success, body.inspect
      assert @game.reload.player_state['sessions'].key?('sv_fs02')
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
      # A down block advertises no action the server would refuse (review O R2 nit 1)
      server['hosts'].each do |h|
        refute h.key?('remoteSignIn'), "a down-block row offers no sign-in (#{h['id']})"
        refute h.key?('session'), "a down-block row offers no session (#{h['id']})"
      end

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

    # ---- A reload during an outage keeps a remote session (review O R2 MIN-1, plan 8) ----

    test 'a reload during an outage keeps a remote session over the downed route, and it reopens on repair' do
      # A claimed session elsewhere, so the reload's end_claimed_sessions! really runs its prune
      build_network_game({ 'sessions' => { 'kiosk_pc' => { 'id' => 'sam', 'via' => 'claim' } } }, NS.with_outage(down: false))
      take_drop_box
      plant('comms_port')
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      sign_in('sv_fs02', 'ishaw', NS::IAN_PASSWORD, foothold: OFFICE)
      assert state['sessions'].key?('sv_fs02')

      set_global(NS::OUTAGE_GLOBAL, true)
      bootstrap_scenario # the reload path (GET /scenario calls end_claimed_sessions!)
      assert_response :success
      sessions = state['sessions']
      refute sessions.key?('kiosk_pc'), 'the reload ended the claim, so the prune ran'
      assert sessions.key?('sv_fs02'), 'an outage never prunes: the remote session survives the reload'
      assert sessions.key?('lena_pc'), 'and so does its pivot'
      container('sv_fs02', foothold: OFFICE)
      assert_response :forbidden, 'its desktop is refused while the route is down'

      set_global(NS::OUTAGE_GLOBAL, false)
      body = container('sv_fs02', foothold: OFFICE)
      assert_response :success, body.inspect
    end

    # ---- The memoised reach walk (review O R2 nit 2) --------------------------------------

    test 'the memoised reach walk follows a change of outage global, session or foothold in one game object' do
      with_outage_foothold(down: false)
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      @game.reload
      assert_includes @game.player_reach(OFFICE), 'server_net'
      walks = 0
      @game.define_singleton_method(:reach_walk_uncached) { |*a, **k| walks += 1; super(*a, **k) }
      @game.instance_variable_set(:@reach_cache, nil)
      3.times { @game.player_reach(OFFICE) }
      assert_equal 1, walks, 'a repeat ask with the same inputs does not walk again'
      @game.player_reach(OFFICE).add('ghost_net')
      refute_includes @game.player_reach(OFFICE), 'ghost_net', 'a caller cannot alter the cached set'

      @game.player_state['globalVariables'][NS::OUTAGE_GLOBAL] = true
      refute_includes @game.player_reach(OFFICE), 'server_net', 'an outage global change misses the cache'
      @game.player_state['globalVariables'][NS::OUTAGE_GLOBAL] = false
      assert_includes @game.player_reach(OFFICE), 'server_net'

      @game.player_state['sessions'] = @game.player_state['sessions'].except('lena_pc')
      refute_includes @game.player_reach(OFFICE), 'server_net', 'a session change misses the cache'
      @game.player_state['footholds'] = {}
      assert_empty @game.player_reach(OFFICE), 'a foothold change misses the cache'
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

    # MIN-2 regression guard: session_route_up? denies conservatively when the PC cannot be
    # resolved (find_login_pc nil) or has no network. This proves the happy path, so a regression
    # that made a present, reachable host unresolvable would surface as a failure here.
    test 'session_route_up? passes a remote session whose PC is present and reachable' do
      with_outage_foothold(down: false)
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      sign_in('sv_fs02', 'ishaw', NS::IAN_PASSWORD, foothold: OFFICE)
      @game.reload
      info = @game.find_login_pc('sv_fs02')
      assert_equal 'sv_fs02', info && info[:object]['id'], 'the PC resolves (find_login_pc)'
      assert_equal 'server_net', @game.object_network(info[:object]), 'and to its network (object_network)'
      assert @game.session_route_up?('sv_fs02'), 'a present, reachable remote PC passes the route test'
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

    # Review R1 E3 (plan 5.2): a foothold whose own network is down lists none of that
    # network's rows, and they come back on repair.
    test 'a foothold on a network that is down lists no rows of its own network, and they return on repair' do
      data = NS.scenario
      data['networks']['office_lan']['downIf'] = 'office_down'
      data['globalVariables'] = (data['globalVariables'] || {}).merge('office_down' => false)
      build_network_game({}, data)
      take_drop_box
      plant('comms_port')
      assert_response :success, response.body
      up = network_view(OFFICE)['footholds'].find { |f| f['id'] == OFFICE }
      refute_empty up['hosts'], 'rows are listed while the network is up'

      set_global('office_down', true)
      view = network_view(OFFICE)
      entry = view['footholds'].find { |f| f['id'] == OFFICE }
      assert_equal [], entry['hosts']
      refute(entry['networks'].any? { |b| b['route'] == 'up' }, entry['networks'].inspect)
      up['hosts'].each { |h| refute_includes response.body, h['host'].to_s } if up['hosts'].all? { |h| h['host'].present? }

      set_global('office_down', false)
      back = network_view(OFFICE)['footholds'].find { |f| f['id'] == OFFICE }
      assert_equal up['hosts'].map { |h| h['id'] }, back['hosts'].map { |h| h['id'] }
    end
  end
end
