require 'test_helper'
require_relative '../../support/network_ops_scenario'

module BreakEscape
  # Ops core S1 (OPS_CORE_PLAN.md section 8 and the sync-deltas rule): the new state is
  # server-owned. It is never accepted from PUT /sync_state, never sent whole, and each route
  # answers only what it changed. S2 and S3 add their keys to this file.
  class NetworkOpsStateDeltaTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests

    OFFICE = NetworkOpsScenario::OFFICE
    OPS_KEYS = %w[opsDiscovered opsFindings opsUsed].freeze

    def hash_keys(node, out = [])
      case node
      when Hash then node.each { |k, v| out << k.to_s; hash_keys(v, out) }
      when Array then node.each { |v| hash_keys(v, out) }
      end
      out
    end

    test 'a new game starts with an empty opsDiscovered of its own, not shared with another game' do
      hold_office_foothold
      assert_equal({}, ops_state['opsDiscovered'])
      ops_scan(OFFICE, network_id: 'office_lan')
      other = create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                                 scenario: ops_scenario, player_state: {})
      assert_equal({}, other.reload.player_state['opsDiscovered'])
      assert_equal({}, Game::ACCESS_STATE_DEFAULTS['opsDiscovered'])
    end

    test 'a sync body naming the ops keys is ignored: state is unchanged and no sync answer carries them' do
      hold_office_foothold
      ops_scan(OFFICE, network_id: 'office_lan')
      before = ops_state['opsDiscovered']
      forged = { 'networks' => %w[office_lan server_net], 'hosts' => %w[sv_fs02 lena_pc] }
      put game_path('sync_state'), params: { opsDiscovered: forged, playerState: { opsDiscovered: forged },
                                             globalVariables: { opsDiscovered: forged, opsFindings: { x: 'c1' } },
                                             opsFindings: { 'a.b.c' => 'c1' }, opsUsed: ['a.b.c'] }, as: :json
      assert_response :success
      assert_equal before, ops_state['opsDiscovered']
      assert_equal({ 'networks' => ['office_lan'] }, ops_state['opsDiscovered'])
      OPS_KEYS.each { |k| refute_includes hash_keys(response.parsed_body), k }
      assert_equal({}, ops_state['opsFindings'], 'S2: the empty default, and the forged body did not land')
      assert_equal [], ops_state['opsUsed']
    end

    test 'the bootstrap and the sync answer never carry opsDiscovered whole' do
      hold_office_foothold
      ops_scan(OFFICE, network_id: 'office_lan')
      ops_scan(OFFICE, host_id: 'sam_pc')
      bootstrap_scenario
      OPS_KEYS.each { |k| refute_includes response.body, k }
      sync_globals('x' => true)
      OPS_KEYS.each { |k| refute_includes response.body, k }
    end

    test 'each scan answers only what it changed and writes only opsDiscovered and the log' do
      hold_office_foothold
      before = ops_state
      sweep = ops_scan(OFFICE, network_id: 'office_lan')
      assert_equal %w[network success], sweep.keys.sort
      assert_equal %w[hosts id swept], sweep['network'].keys.sort
      after = ops_state
      changed = (before.keys | after.keys).reject { |k| before[k] == after[k] }
      assert_equal %w[opsDiscovered opsLog opsLogSeq].sort, (changed - %w[opsLogClockAt opsLogOnce]).sort
      scan = ops_scan(OFFICE, host_id: 'sam_pc')
      assert_equal %w[host success], scan.keys.sort
      assert_equal %w[sam_pc], scan.values_at('host').map { |h| h['id'] }
      refute_includes hash_keys(scan), 'hosts'
    end

    test 'opsDiscovered is bounded by what exists: ids only, no duplicates after repeats' do
      hold_office_foothold
      3.times { ops_scan(OFFICE, network_id: 'office_lan') }
      3.times { ops_scan(OFFICE, host_id: 'sam_pc') }
      assert_equal({ 'networks' => ['office_lan'], 'hosts' => ['sam_pc'] }, ops_state['opsDiscovered'])
    end

    test 'GET /network at full discovery of the fixture is small' do
      hold_office_foothold
      ops_scan(OFFICE, network_id: 'office_lan')
      %w[sam_pc print_srv lab_box].each { |id| ops_scan(OFFICE, host_id: id) }
      get game_path('network'), as: :json
      assert_operator response.body.bytesize, :<, 16_384
    end

    # ---- S3 (S3 server R1 m9) ------------------------------------------------------------------

    test 'S3: a technique answer holds only what it changed: no finding row, no opsUsed, and the write is the session, opsUsed and the log' do
      techniques_game
      before = ops_state
      body = ops_technique(OFFICE, 'sam_pc.web.factory_login', 'card_factory')
      assert_response :success, response.body
      assert_equal %w[grant session success], body.keys.sort
      OPS_KEYS.each { |k| refute_includes hash_keys(body), k }
      %w[finding findings needs fixed falseBecause worksOn techniques].each { |k| refute_includes hash_keys(body), k }
      after = ops_state
      changed = (before.keys | after.keys).reject { |k| before[k] == after[k] }
      assert_equal %w[opsLog opsLogSeq opsUsed sessions signedInPcs].sort, (changed - %w[opsLogClockAt opsLogOnce]).sort
      assert_equal before['opsFindings'], after['opsFindings'], 'the findings are untouched by a use'
      again = ops_technique(OFFICE, 'sam_pc.web.factory_login', 'card_factory')
      assert_equal %w[already grant session success], again.keys.sort
    end

    test 'S3: a credential technique answer is success, grant and keyringChanged only, and writes only opsUsed and the log' do
      techniques_game
      before = ops_state
      body = ops_technique(OFFICE, NetworkOpsScenario::SPOOL, 'card_factory')
      assert_equal %w[grant keyringChanged success], body.keys.sort
      after = ops_state
      changed = (before.keys | after.keys).reject { |k| before[k] == after[k] }
      assert_equal %w[opsLog opsLogSeq opsUsed].sort, (changed - %w[opsLogClockAt opsLogOnce credentialGained]).sort
    end

    test 'S3: GET /network after a use sends no opsUsed, no registry and no finding rows' do
      techniques_game
      ops_technique(OFFICE, 'sam_pc.web.factory_login', 'card_factory')
      text = network_view(OFFICE).to_json
      %w[opsUsed opsFindings grants].each { |k| refute_includes text, k }
      assert_equal %w[factory_accounts], network_view(OFFICE)['techniques'].keys, 'only the held card is listed'
    end
  end
end
