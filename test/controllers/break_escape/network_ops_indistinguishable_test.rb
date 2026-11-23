require 'test_helper'
require_relative '../../support/network_ops_scenario'

module BreakEscape
  # Ops core S1 (OPS_CORE_PLAN.md section 6, "One answer for everything the player has not
  # earned"): the scan route answers a real id the player has not earned exactly as it answers an
  # invented one, a string that is not of the id form and a foothold not held: one status, one body.
  class NetworkOpsIndistinguishableTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests

    OFFICE = NetworkOpsScenario::OFFICE
    INVENTED = [
      'made_up_id', 'Not An Id!', '', 'a' * 64, 'a' * 200, '_note', 'jack_comms_port', 'office_lan.web', '../office_lan'
    ].freeze

    def answer(foothold, key, id)
      post game_path('network/scan'), params: { foothold: foothold, key => id }, as: :json
      [response.status, response.body]
    end

    def reference(key)
      answer(OFFICE, key, 'invented_target')
    end

    test 'the reference answer is the one 404 body' do
      hold_office_foothold
      assert_equal [404, { success: false, reason: 'not_found' }.to_json], reference(:network_id)
      assert_equal reference(:network_id), reference(:host_id)
    end

    test 'sweep: an unearned real network answers as an invented one' do
      hold_office_foothold
      want = reference(:network_id)
      assert_equal want, answer(OFFICE, :network_id, 'server_net'), 'a network out of this foothold reach'
      assert_equal want, answer(OFFICE, :network_id, 'workshop_lan'), 'another foothold network'
      assert_equal want, answer('jack_not_held', :network_id, 'office_lan'), 'a real network through a foothold not held'
      assert_equal want, answer('not a foothold!', :network_id, 'office_lan')
      INVENTED.reject(&:empty?).each { |id| assert_equal want, answer(OFFICE, :network_id, id), id }
      assert_equal [], ops_rows
    end

    test 'host scan: an unearned real host answers as an invented one' do
      hold_office_foothold
      want = reference(:host_id)
      assert_equal want, answer(OFFICE, :host_id, 'sam_pc'), 'a host on an unswept network'
      assert_equal want, answer(OFFICE, :host_id, 'print_srv'), 'a device on an unswept network'
      assert_equal want, answer(OFFICE, :host_id, 'sv_fs02'), 'a host out of reach'
      assert_equal want, answer(OFFICE, :host_id, 'bench_pc'), 'a host on another foothold network'
      assert_equal want, answer(OFFICE, :host_id, 'cam_one'), 'a device on an unswept network that is off'
      assert_equal want, answer(OFFICE, :host_id, 'lena_pc'), 'a held-session host before the sweep'
      assert_equal want, answer('jack_not_held', :host_id, 'sam_pc')
      INVENTED.reject(&:empty?).each { |id| assert_equal want, answer(OFFICE, :host_id, id), id }
      assert_equal [], ops_rows
    end

    test 'a held-session host before the sweep answers as an invented id' do
      hold_office_foothold
      sign_in('lena_pc', 'lfox', NetworkModelScenario::LENA_PASSWORD, foothold: OFFICE)
      assert_equal reference(:host_id), answer(OFFICE, :host_id, 'lena_pc')
    end

    test 'a stale id after an unplug answers as an invented one, and learning is kept' do
      hold_office_foothold
      ops_scan(OFFICE, network_id: 'office_lan')
      ops_scan(OFFICE, host_id: 'sam_pc')
      unplug('comms_port')
      assert_response :success
      assert_equal reference(:network_id), answer(OFFICE, :network_id, 'office_lan')
      assert_equal reference(:host_id), answer(OFFICE, :host_id, 'sam_pc')
      assert_equal({ 'networks' => ['office_lan'], 'hosts' => ['sam_pc'] }, ops_state['opsDiscovered'])
    end

    test 'a stale id after a lost pivot answers as an invented one' do
      hold_office_foothold
      pivot_through_lena
      ops_scan(OFFICE, network_id: 'server_net')
      ops_scan(OFFICE, host_id: 'sv_fs02')
      assert_response :success
      post game_path('logout'), params: { pc_id: 'lena_pc' }, as: :json
      assert_response :success
      assert_equal reference(:network_id), answer(OFFICE, :network_id, 'server_net')
      assert_equal reference(:host_id), answer(OFFICE, :host_id, 'sv_fs02')
      assert_equal({ 'networks' => %w[server_net], 'hosts' => %w[sv_fs02] }, ops_state['opsDiscovered'])
    end

    test 'a host on a network that is down answers as an invented one' do
      data = ops_scenario(discovery: 'open')
      data['networks']['office_lan']['offWhen'] = 'office_down'
      hold_office_foothold({ 'globalVariables' => { 'office_down' => false } }, data)
      state = @game.reload.player_state
      state['globalVariables']['office_down'] = true
      @game.save!
      assert_equal reference(:host_id), answer(OFFICE, :host_id, 'sam_pc')
      assert_equal reference(:network_id), answer(OFFICE, :network_id, 'office_lan')
    end

    test 'earned ids answer differently, so the test above means something' do
      hold_office_foothold
      ops_scan(OFFICE, network_id: 'office_lan')
      refute_equal reference(:host_id), answer(OFFICE, :host_id, 'sam_pc')
    end
  end
end
