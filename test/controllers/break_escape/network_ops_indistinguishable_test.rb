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

    # ---- S2: check and confirm -----------------------------------------------------------------

    NOS = NetworkOpsScenario

    def check_answer(foothold, host_id, service)
      post game_path('network/check'), params: { foothold: foothold, host_id: host_id, service: service }, as: :json
      [response.status, response.body]
    end

    def confirm_answer(foothold, finding_id)
      post game_path('network/confirm'), params: { foothold: foothold, finding_id: finding_id }, as: :json
      [response.status, response.body]
    end

    def findings_ready
      hold_office_foothold({}, NOS.findings_scenario)
      ops_scan(OFFICE, network_id: 'office_lan')
      ops_scan(OFFICE, host_id: 'sam_pc')
    end

    test 'check: an unearned real host or service answers as an invented one' do
      findings_ready
      want = check_answer(OFFICE, 'invented_target', 'web')
      assert_equal [404, { success: false, reason: 'not_found' }.to_json], want
      assert_equal want, check_answer(OFFICE, 'print_srv', 'queue'), 'a host listed but not scanned'
      assert_equal want, check_answer(OFFICE, 'sv_fs02', 'backup'), 'a host out of reach'
      assert_equal want, check_answer(OFFICE, 'sam_pc', 'no_such_service')
      assert_equal want, check_answer(OFFICE, 'sam_pc', 'queue'), 'a real service of another host'
      assert_equal want, check_answer(OFFICE, 'sam_pc', 'sam_pc.web'), 'a finding-style id'
      assert_equal want, check_answer('jack_not_held', 'sam_pc', 'web')
      assert_equal want, check_answer('not a foothold!', 'sam_pc', 'web')
      INVENTED.reject(&:empty?).each do |id|
        assert_equal want, check_answer(OFFICE, id, 'web'), id
        assert_equal want, check_answer(OFFICE, 'sam_pc', id), id
      end
      assert_equal %w[network_swept host_scanned], ops_rows.map { |row| row['event'] }, 'no row for a 404'
      refute_equal want, check_answer(OFFICE, 'sam_pc', 'web'), 'an earned service answers differently'
    end

    test 'check: a host on a discovery network that is reached but not swept answers as an invented one' do
      findings_ready
      want = check_answer(OFFICE, 'invented_target', 'backup')
      pivot_through_lena
      assert_response :success
      assert_equal want, check_answer(OFFICE, 'sv_fs02', 'backup'), 'server_net is in reach and not swept'
      assert_equal want, check_answer(OFFICE, 'sv_dev', 'mgmt'), 'a device on the unswept network'
      assert_equal [404, { success: false, reason: 'not_found' }.to_json], want
      ops_scan(OFFICE, network_id: 'server_net')
      ops_scan(OFFICE, host_id: 'sv_dev')
      refute_equal want, check_answer(OFFICE, 'sv_dev', 'mgmt'), 'swept and scanned it answers differently'
    end

    test 'confirm: a weakness that was fixed before any check answers as an invented finding, byte for byte' do
      hold_office_foothold({}, NOS.findings_scenario(patched: true))
      ops_scan(OFFICE, network_id: 'office_lan')
      ops_scan(OFFICE, host_id: 'sam_pc')
      want = confirm_answer(OFFICE, 'invented.finding.id')
      body = ops_check(OFFICE, host_id: 'sam_pc', service: 'web')
      assert_nil body['findings'].find { |f| f['id'] == NOS::FACTORY }, 'the fixed weakness is not listed'
      assert_equal want, confirm_answer(OFFICE, NOS::FACTORY)
      assert_nil ops_state['opsFindings'][NOS::FACTORY]
      refute_equal want, confirm_answer(OFFICE, NOS::OLD_BANNER), 'a held decoy answers differently'
    end

    test 'confirm: a real finding never checked, or of a host not listed, answers as an invented one' do
      findings_ready
      want = confirm_answer(OFFICE, 'invented.finding.id')
      assert_equal [404, { success: false, reason: 'not_found' }.to_json], want
      [NOS::FACTORY, NOS::OLD_BANNER, NOS::SPOOL, NOS::LAB_OPEN, 'sam_pc.web', 'sam_pc'].each do |id|
        assert_equal want, confirm_answer(OFFICE, id), "#{id} never checked"
      end
      assert_equal want, confirm_answer('jack_not_held', NOS::FACTORY)
      assert_equal want, confirm_answer('not a foothold!', NOS::FACTORY), 'a foothold string that is not of the id form'
      INVENTED.reject(&:empty?).each { |id| assert_equal want, confirm_answer(OFFICE, id), id }
      ops_check(OFFICE, host_id: 'sam_pc', service: 'web')
      assert_equal want, confirm_answer(OFFICE, NOS::SPOOL), 'a real finding of another host, not held'
      refute_equal want, confirm_answer(OFFICE, NOS::FACTORY), 'a held finding answers differently'
    end

    test 'a stale id after an unplug answers a check and a confirm as an invented one, and the findings are kept' do
      findings_ready
      ops_check(OFFICE, host_id: 'sam_pc', service: 'web')
      unplug('comms_port')
      assert_response :success
      assert_equal check_answer(OFFICE, 'invented_target', 'web'), check_answer(OFFICE, 'sam_pc', 'web')
      assert_equal confirm_answer(OFFICE, 'invented.finding.id'), confirm_answer(OFFICE, NOS::FACTORY)
      assert_equal 'u1', ops_state['opsFindings'][NOS::FACTORY]
      assert_equal %w[sam_pc.web], ops_state['opsDiscovered']['services']
    end

    test 'a stale id after a lost pivot answers a finding of the pivoted host as an invented one' do
      hold_office_foothold({}, NOS.findings_scenario)
      data = @game.reload.scenario_data
      data['hosts']['sv_dev']['services'].first['weaknesses'] = [NOS.weak('mgmt_open', 'misconfig', 'low')]
      @game.update!(scenario_data: data)
      pivot_through_lena
      ops_scan(OFFICE, network_id: 'server_net')
      ops_scan(OFFICE, host_id: 'sv_dev')
      assert_response :success
      ops_check(OFFICE, host_id: 'sv_dev', service: 'mgmt')
      assert_response :success, response.body
      post game_path('logout'), params: { pc_id: 'lena_pc' }, as: :json
      assert_response :success
      assert_equal check_answer(OFFICE, 'invented_target', 'mgmt'), check_answer(OFFICE, 'sv_dev', 'mgmt')
      assert_equal confirm_answer(OFFICE, 'invented.finding.id'), confirm_answer(OFFICE, 'sv_dev.mgmt.mgmt_open')
    end

    # ---- S3: the technique route (OPS_CORE_PLAN.md 5.4 and 6; S3 server R1 m9) ---------------------

    def technique_answer(foothold, finding, item)
      post game_path('network/technique'), params: { foothold: foothold, finding_id: finding, item_id: item }, as: :json
      [response.status, response.body]
    end

    test 'technique: a real finding not held, a card not held, a stale foothold and an invented id are one answer, byte for byte' do
      data = NetworkOpsScenario.techniques_scenario
      inventory = [card_entry('card_factory')]
      hold_office_foothold({ 'inventory' => inventory, 'unlockedRooms' => NetworkRequests::OPEN_ROOMS + %w[server_room] }, data)
      sweep_and_scan('sam_pc')
      want = [404, { success: false, reason: 'not_found' }.to_json]
      assert_equal want, technique_answer(OFFICE, 'sam_pc.web.invented', 'card_factory'), 'the reference'
      assert_equal want, technique_answer(OFFICE, 'sam_pc.web.factory_login', 'card_factory'), 'a real finding never checked'
      assert_equal want, technique_answer('jack_not_held', 'sam_pc.web.factory_login', 'card_factory'), 'a foothold not held'
      ops_check(OFFICE, host_id: 'sam_pc', service: 'web')
      ops_confirm(OFFICE, 'sam_pc.web.factory_login')
      assert_equal want, technique_answer(OFFICE, 'sam_pc.web.factory_login', 'card_listing'), 'a held finding, a card not held'
      assert_equal want, technique_answer(OFFICE, 'sam_pc.web.factory_login', 'invented_card'), 'a held finding, an invented card'
      assert_equal want, technique_answer(OFFICE, 'sam_pc.web.factory_login', 'panel_sheet'), 'a held finding, an item that is no card'
      assert_empty ops_state['opsUsed'].to_a
      ops_technique(OFFICE, 'sam_pc.web.factory_login', 'card_factory')
      assert_response :success, response.body
      unplug('comms_port')
      assert_response :success
      assert_equal want, technique_answer(OFFICE, 'sam_pc.web.factory_login', 'card_factory'), 'a stale finding after an unplug'
      assert_equal want, technique_answer(OFFICE, 'sam_pc.web.invented', 'card_factory')
      assert_equal 1, ops_state['opsUsed'].size, 'only the one real use'
    end
  end
end
