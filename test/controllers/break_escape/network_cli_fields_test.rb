require 'test_helper'
require_relative '../../support/network_ops_scenario'

module BreakEscape
  # Ops core S1 (OPS_CORE_PLAN.md 5.2 "Display fields" and 11.2): the `cli` display fields are
  # copied by named key, at the stage that serves them and never earlier. The fixture
  # (test/fixtures/files/network_ops_cli.json) is test-only: the schema does not declare `cli`
  # until the skin plan. The S2 cases (a finding's cli) are the next step's.
  class NetworkCliFieldsTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests

    OFFICE = NetworkOpsScenario::OFFICE
    LENA = NetworkModelScenario::LENA_PASSWORD
    STRINGS = NetworkOpsScenario::CLI_STRINGS
    NOTES = NetworkOpsScenario::CLI_NOTES

    def hold(discovery: 'scan', cli: true, state: {})
      data = ops_scenario(discovery: discovery)
      data = NetworkOpsScenario.with_cli(data) if cli
      hold_office_foothold(state, data)
    end

    def office_block(foothold = OFFICE)
      view_blocks(foothold).find { |b| b['id'] == 'office_lan' }
    end

    def each_hash(node, &block)
      case node
      when Hash then block.call(node) && node.each_value { |v| each_hash(v, &block) }
      when Array then node.each { |v| each_hash(v, &block) }
      end
    end

    def keys_in(node)
      keys = []
      each_hash(node) { |h| keys.concat(h.keys) }
      keys
    end

    def assert_no_cli_strings(text, strings, label)
      strings.each { |s| refute_includes text, s, "#{label} leaks #{s}" }
    end

    test 'cli.range rides on the block as cli: { range } alone, and a network with none gets no cli key' do
      hold
      assert_equal({ 'range' => '10.20.0.0/24' }, office_block['cli'])
      pivot_through_lena
      server = view_blocks.find { |b| b['id'] == 'server_net' }
      assert_equal({ 'range' => '10.30.0.0/28' }, server['cli'])
      hold(cli: false)
      refute office_block.key?('cli')
    end

    test 'on a discovery network an address is in no block and no row before the sweep, a held-session row included' do
      hold
      sign_in('lena_pc', 'lfox', LENA, foothold: OFFICE)
      assert_equal %w[lena_pc], office_block['hosts'].map { |h| h['id'] }
      assert_no_cli_strings(response_body_of(network_view(OFFICE)), STRINGS - ['10.20.0.0/24', '10.30.0.0/28'], 'GET /network before the sweep')
      refute(office_block['hosts'].any? { |h| h.key?('address') })
      assert_nil office_block['hosts'].first['address']
    end

    test 'on a discovery network the address is in the sweep answer and in GET /network from then on' do
      hold
      sign_in('lena_pc', 'lfox', LENA, foothold: OFFICE)
      body = ops_scan(OFFICE, network_id: 'office_lan')
      rows = body['network']['hosts'].to_h { |h| [h['id'], h] }
      assert_equal '10.20.0.15', rows['sam_pc']['address']
      assert_equal '10.20.0.21', rows['lena_pc']['address'], 'a held-session row too'
      assert_equal '10.20.0.1', rows['print_srv']['address']
      refute rows['scanned_inbox'].key?('address'), 'a share is not a host row'
      refute rows['lab_box'].key?('address'), 'not authored'
      view = office_block['hosts'].to_h { |h| [h['id'], h] }
      assert_equal '10.20.0.15', view['sam_pc']['address']
      assert_equal '10.20.0.21', view_hosts.find { |h| h['id'] == 'lena_pc' }['address']
    end

    test 'the address of a held-session row is absent from the greyed down block until the sweep and present after it' do
      data = NetworkOpsScenario.with_cli(ops_scenario)
      data['networks']['server_net']['offWhen'] = 'servers_offline'
      hold_office_foothold({ 'globalVariables' => { 'servers_offline' => false } }, data)
      pivot_through_lena
      sign_in('sv_fs02', 'ishaw', NetworkModelScenario::IAN_PASSWORD, foothold: OFFICE)
      assert_response :success
      @game.reload.player_state['globalVariables']['servers_offline'] = true
      @game.save!
      down = view_blocks.find { |b| b['id'] == 'server_net' }
      assert_equal 'down', down['route']
      assert_equal %w[sv_fs02], down['hosts'].map { |h| h['id'] }
      refute down['hosts'].first.key?('address')
      assert_equal({ 'range' => '10.30.0.0/28' }, down['cli'])
      assert_equal false, down['swept']
      @game.player_state['globalVariables']['servers_offline'] = false
      @game.save!
      ops_scan(OFFICE, network_id: 'server_net')
      @game.reload.player_state['globalVariables']['servers_offline'] = true
      @game.save!
      down = view_blocks.find { |b| b['id'] == 'server_net' }
      assert_equal 'down', down['route']
      assert_equal '10.30.0.2', down['hosts'].first['address']
      assert_equal true, down['swept']
    end

    test 'a down block carries no ops key, though the same block carries one while the route is up (departure b)' do
      data = ops_scenario
      data['networks']['server_net']['offWhen'] = 'servers_offline'
      hold_office_foothold({ 'globalVariables' => { 'servers_offline' => false } }, data)
      pivot_through_lena
      ops_scan(OFFICE, network_id: 'server_net')
      up = view_blocks.find { |b| b['id'] == 'server_net' }
      assert_equal 'up', up['route']
      assert_equal true, up['ops'], 'an up, swept block with services says so'
      sign_in('sv_fs02', 'ishaw', NetworkModelScenario::IAN_PASSWORD, foothold: OFFICE)
      assert_response :success
      @game.reload.player_state['globalVariables']['servers_offline'] = true
      @game.save!
      down = view_blocks.find { |b| b['id'] == 'server_net' }
      assert_equal 'down', down['route']
      refute down.key?('ops')
    end

    test 'on an open network an address is on its row in the first GET /network that lists it, with and without discovery open' do
      [nil, 'open'].each do |discovery|
        hold(discovery: discovery)
        rows = view_hosts.to_h { |h| [h['id'], h] }
        assert_equal '10.20.0.15', rows['sam_pc']['address'], "discovery #{discovery.inspect}"
        assert_equal '10.20.0.1', rows['print_srv']['address']
        assert_equal '10.20.0.77', rows['plain_cam']['address']
        refute rows['cam_one'].key?('address')
      end
    end

    test 'a service cli is absent before the host scan and present, unchanged, in the scan answer and after it' do
      hold
      assert_no_cli_strings(response_body_of(network_view(OFFICE)), %w[SVC-BANNER-TEXT BANNER-ONLY-TEXT], 'GET /network')
      ops_scan(OFFICE, network_id: 'office_lan')
      body = ops_scan(OFFICE, host_id: 'sam_pc')
      web, files = body['host']['services']
      assert_equal({ 'protocol' => 'tcp', 'service' => 'http', 'banner' => 'SVC-BANNER-TEXT ready' }, web['cli'])
      assert_equal({ 'banner' => 'BANNER-ONLY-TEXT' }, files['cli'], 'only the keys authored')
      view = view_hosts.find { |h| h['id'] == 'sam_pc' }
      assert_equal body['host']['services'], view['services']
      assert_equal body['host'], ops_scan(OFFICE, host_id: 'sam_pc').except('already')['host']
      # a service with no cli object has no cli key
      plain = ops_scan(OFFICE, host_id: 'print_srv')['host']['services'].first
      assert_equal({ 'protocol' => 'tcp' }, plain['cli'])
      assert_equal %w[name port product version], ops_scan(OFFICE, host_id: 'sam_pc')['host']['services'][1].keys - ['label', 'cli']
    end

    test 'no answer carries an underscore key, an unlisted key, or an empty or null cli' do
      hold
      sign_in('lena_pc', 'lfox', LENA, foothold: OFFICE)
      answers = [network_view(OFFICE)]
      answers << ops_scan(OFFICE, network_id: 'office_lan')
      answers << ops_scan(OFFICE, host_id: 'sam_pc')
      answers << ops_scan(OFFICE, host_id: 'print_srv')
      answers << network_view(OFFICE)
      answers.each do |answer|
        text = response_body_of(answer)
        assert_no_cli_strings(text, NOTES, 'an answer')
        refute(keys_in(answer).any? { |k| k.start_with?('_') || k == 'other' }, 'an underscore or unlisted key')
        refute_includes text, '"cli":{}'
        refute_includes text, '"cli":null'
      end
    end

    test 'a fixture that authors no cli key answers the bytes of one with no cli objects at all' do
      hold(cli: false)
      ops_scan(OFFICE, network_id: 'office_lan')
      ops_scan(OFFICE, host_id: 'sam_pc')
      plain = [response_body_of(network_view(OFFICE))]
      data = ops_scenario
      data['networks']['office_lan']['cli'] = { '_note' => 'only a note', 'hosts' => { 'sam_pc' => { '_note' => 'x' } } }
      data['networks']['server_net']['cli'] = {}
      data['hosts']['print_srv']['services'].first['cli'] = { '_note' => 'x' }
      data['rooms']['desk_room']['objects'].find { |o| o['id'] == 'sam_pc' }['services'].each { |s| s['cli'] = { '_note' => 'n' } }
      hold_office_foothold({}, data)
      ops_scan(OFFICE, network_id: 'office_lan')
      ops_scan(OFFICE, host_id: 'sam_pc')
      noted = [response_body_of(network_view(OFFICE))]
      assert_equal plain, noted
    end

    test 'a service cli with only some keys answers only those keys' do
      hold
      ops_scan(OFFICE, network_id: 'office_lan')
      web = ops_scan(OFFICE, host_id: 'sam_pc')['host']['services'].first
      assert_equal %w[banner protocol service], web['cli'].keys.sort
    end

    test 'no cli string in the bootstrap, any room answer, a refusal body or a sync answer' do
      hold
      ops_scan(OFFICE, network_id: 'office_lan')
      ops_scan(OFFICE, host_id: 'sam_pc')
      everything = STRINGS + NOTES + %w[tcp]
      bootstrap_scenario
      assert_no_cli_strings(response.body, STRINGS + NOTES, 'the bootstrap')
      refute_includes response.body, '"cli"'
      @game.reload.scenario_data['rooms'].each_key do |room_id|
        get game_path("room/#{room_id}"), as: :json
        assert_no_cli_strings(response.body, STRINGS + NOTES, "room #{room_id}")
        refute_includes response.body, '"cli"'
      end
      ops_scan(OFFICE, host_id: 'lab_box') # not responding or not needed: a refusal body
      assert_no_cli_strings(response.body, everything - ['tcp'], 'a refusal body')
      ops_scan(OFFICE, host_id: 'nope')
      assert_no_cli_strings(response.body, everything - ['tcp'], 'the 404')
      sync_globals('x' => true)
      assert_no_cli_strings(response.body, STRINGS + NOTES, 'a sync answer')
    end

    test 'the same requests with every cli string changed answer the same statuses, reasons and log rows' do
      run = lambda do |mutate|
        data = NetworkOpsScenario.with_cli(ops_scenario)
        mutate&.call(data)
        hold_office_foothold({}, data)
        out = []
        sign_in('lena_pc', 'lfox', LENA, foothold: OFFICE)
        [{ host_id: 'sam_pc' }, { network_id: 'office_lan' }, { host_id: 'sam_pc' }, { host_id: 'lena_pc' }, { network_id: 'office_lan' },
         { host_id: 'nope' }].each do |ids|
          body = ops_scan(OFFICE, **ids)
          out << [response.status, body['reason'], body['already']]
        end
        [out, ops_rows.map { |r| r.except('seq', 'elapsedMs', 'serverMs', 'last') }, ops_state['opsDiscovered']]
      end
      changed = lambda do |data|
        data['networks'].each_value do |net|
          next unless net['cli']

          net['cli']['range'] = 'CHANGED' if net['cli']['range']
          (net['cli']['hosts'] || {}).each_value { |h| h['address'] = 'CHANGED' }
        end
        objects = data['rooms'].values.flat_map { |r| r['objects'] || [] } + data['hosts'].values
        objects.each { |o| (o['services'] || []).each { |s| s['cli']&.transform_values! { 'CHANGED' } } }
      end
      assert_equal run.call(nil), run.call(changed)
    end

    def response_body_of(answer)
      JSON.generate(answer)
    end
  end
end
