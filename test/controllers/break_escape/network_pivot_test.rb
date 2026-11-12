require 'test_helper'
require_relative '../../support/network_model_scenario'

module BreakEscape
  # Networks slice 9.3b sub-slice K (docs/achitechture/ACCESS_MODEL_SLICE_9_3B_PLAN.md 5.1):
  # links and the pivot. A foothold reaches its own network only; a linked network is reached
  # only by pivoting through a host the player holds a session on, and signing out of the
  # pivot ends the onward sessions. Beats N1 to N4.
  class NetworkPivotTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    NS = NetworkModelScenario
    OFFICE = 'jack_comms_port'.freeze

    def state
      @game.reload.player_state
    end

    def with_pivot_foothold(player_state = {})
      build_network_game(player_state, NS.with_pivot)
      take_drop_box
      plant('comms_port')
      assert_response :success, response.body
    end

    def logout(pc_id)
      post game_path('logout'), params: { pc_id: pc_id }, as: :json
      response.parsed_body
    end

    def networks_block(foothold)
      view = network_view(foothold)
      entry = view['footholds'].find { |f| f['id'] == foothold }
      entry['networks']
    end

    # ---- N1: a bare foothold names no linked network -----------------------------------

    test 'N1: a foothold with no pivot session reaches its own network only and names no linked network' do
      with_pivot_foothold
      @game.reload
      assert_equal Set['office_lan'], @game.structural_reach(OFFICE)
      assert_equal @game.structural_reach(OFFICE), @game.player_reach(OFFICE)

      blocks = networks_block(OFFICE)
      assert_equal %w[office_lan], blocks.map { |b| b['id'] }, 'only the own network, no server_net'
      refute_exposed('N1 bare foothold', NS::SERVER_STRINGS)
    end

    test 'N1: a sign-in across the link is refused without a pivot session' do
      with_pivot_foothold
      sign_in('sv_fs02', 'ishaw', NS::IAN_PASSWORD, foothold: OFFICE)
      assert_response :forbidden
    end

    # ---- N2: the pivot opens the linked network ----------------------------------------

    test 'N2: a session at an office host brings the server network into reach, named through that host' do
      with_pivot_foothold
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      assert_response :success

      @game.reload
      assert_equal Set['office_lan', 'server_net'], @game.player_reach(OFFICE)
      blocks = networks_block(OFFICE)
      server = blocks.find { |b| b['id'] == 'server_net' }
      assert server, 'the server_net block appears'
      assert_equal 'up', server['route']
      assert_equal 'lena_pc', server['via']['hostId'], 'reached through the office session'
      assert_includes server['hosts'].map { |h| h['id'] }, 'sv_fs02'
    end

    # ---- N3: sign in across the link, the protected share maps -------------------------

    test 'N3: the server host signs in through the same foothold and its protected share maps' do
      with_pivot_foothold
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      body = sign_in('sv_fs02', 'ishaw', NS::IAN_PASSWORD, foothold: OFFICE)
      assert_response :success, body.inspect
      assert_equal OFFICE, state['sessions']['sv_fs02']['foothold']

      @game.reload
      pc = @game.find_login_pc('sv_fs02')[:object]
      ian = @game.scenario_room_npc('ian')
      assert_includes @game.mapped_shares(pc, ian).map(&:first), 'backup_vault'
      assert @game.resource_admits_player?(@game.scenario_data['resources']['backup_vault'])
    end

    # ---- N4: signing out of the pivot ends the onward session --------------------------

    test 'N4: signing out of the pivot ends the onward server session and shrinks the view' do
      with_pivot_foothold
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      sign_in('sv_fs02', 'ishaw', NS::IAN_PASSWORD, foothold: OFFICE)
      assert state['sessions'].key?('sv_fs02')

      body = logout('lena_pc')
      assert_includes Array(body['endedPcIds']), 'sv_fs02', 'the onward session is pruned'
      refute state['sessions'].key?('sv_fs02')
      refute state['sessions'].key?('lena_pc')
      assert_equal %w[office_lan], networks_block(OFFICE).map { |b| b['id'] }, 'server_net gone from the view'
    end

    # ---- prune both ways, at the model level -------------------------------------------

    test 'prune ends a session carrying a foothold on an unreachable network but keeps a local one' do
      with_pivot_foothold
      # A remote pivot session on server_net whose pivot is already gone, and a local claim
      # with no foothold on a network no foothold reaches.
      @game.reload
      @game.player_state['sessions'] = {
        'sv_fs02' => { 'id' => 'ian', 'via' => 'password', 'foothold' => OFFICE },
        'bench_pc' => { 'id' => 'sam', 'via' => 'claim' }
      }
      @game.save!
      ended = @game.prune_unreachable_sessions!
      assert_equal %w[sv_fs02], ended
      assert @game.player_state['sessions'].key?('bench_pc'), 'a local claim survives'
      refute @game.player_state['sessions'].key?('sv_fs02')
    end

    test 'the pivot survives sitting down at the pivot host (a cleared foothold still bridges)' do
      with_pivot_foothold
      @game.reload
      # Lena settled at her keyboard: her session has no foothold, but it still bridges.
      @game.player_state['sessions'] = { 'lena_pc' => { 'id' => 'lena', 'via' => 'password' } }
      @game.save!
      assert_equal Set['office_lan', 'server_net'], @game.structural_reach(OFFICE)
    end
  end
end
