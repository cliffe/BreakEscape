require 'test_helper'
require 'stringio'
require 'tmpdir'
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

    # ---- S2: a finding's cli, from the realism catalog (OPS_CORE_PLAN.md 5.3, 11.2) ---------------

    NOS = NetworkOpsScenario
    CATALOG = File.expand_path('../../fixtures/ops_findings_catalog', __dir__)
    LOGIN_STRINGS = ['FX-TITLE-LOGIN placeholder login weakness', 'example/fx/login', 'fx-login-check', 'FX-ADV-0001', 'FX-ADV-0002',
                     'FX-OUT-LOGIN-1 invented line', 'FX-OUT-LOGIN-2 invented line'].freeze
    BANNER_STRINGS = ['FX-TITLE-BANNER placeholder build report', 'example/fx/banner', 'fx-banner-check', 'FX-ADV-0003',
                      'FX-OUT-BANNER-1 invented line'].freeze
    PANEL_STRINGS = ['FX-TITLE-PANEL placeholder panel setting', 'example/fx/panel'].freeze
    OTHER_STRINGS = %w[FX-TITLE-OTHER example/fx/other fx-other-check FX-ADV-0009].freeze
    FX_NOTES = %w[FX-NOTE-LOGIN FX-NOTE-BANNER].freeze
    LINKS = %w[fx_login fx_banner fx_panel fx_other fx_missing].freeze

    # The findings fixture with links authored by the test (the schema declares `realism` at the skin
    # plan's K3, so the scenario is built in Ruby): factory_login -> fx_login, old_banner -> fx_banner,
    # open_listing -> fx_panel (a partial entry), side_entry -> a link that resolves to nothing.
    def linked_scenario(links = {})
      data = NOS.findings_scenario
      web = data['rooms']['desk_room']['objects'].find { |o| o['id'] == 'sam_pc' }['services'].find { |svc| svc['name'] == 'web' }
      defaults = { 'factory_login' => 'fx_login', 'old_banner' => 'fx_banner', 'open_listing' => 'fx_panel', 'side_entry' => 'fx_missing' }
      (web['weaknesses'] + web['decoys']).each do |entry|
        link = links.fetch(entry['id'], defaults[entry['id']])
        link ? entry['realism'] = link : entry.delete('realism')
      end
      data
    end

    def with_catalog(&block)
      RealismCatalog.reset_warned!
      RealismCatalog.with_folder(CATALOG, &block)
    end

    def hold_linked(links = {})
      hold_office_foothold({}, linked_scenario(links))
      sweep_and_scan('sam_pc')
    end

    def finding_in(body, id)
      (body['findings'] || [body['finding']]).find { |f| f['id'] == id }
    end

    def warnings_during
      io = StringIO.new
      saved = Rails.logger
      Rails.logger = ActiveSupport::Logger.new(io)
      yield
      io.string
    ensure
      Rails.logger = saved
    end

    test 'S2 cli: a finding carries no cli before the check, and the strings are in the check answer, the confirm answer and GET /network' do
      with_catalog do
        hold_linked
        before = network_view(OFFICE).to_json
        (LOGIN_STRINGS + BANNER_STRINGS + PANEL_STRINGS).each { |t| refute_includes before, t, "before the check: #{t}" }
        checked = ops_check(OFFICE, host_id: 'sam_pc', service: 'web')
        LOGIN_STRINGS.each { |t| assert_includes response.body, t }
        confirm = ops_confirm(OFFICE, NOS::FACTORY)
        LOGIN_STRINGS.each { |t| assert_includes response.body, t }
        listed = view_hosts.find { |h| h['id'] == 'sam_pc' }['findings'].to_h { |f| [f['id'], f] }
        assert_equal finding_in(checked, NOS::OLD_BANNER)['cli'], listed[NOS::OLD_BANNER]['cli']
        assert_equal confirm['finding']['cli'], listed[NOS::FACTORY]['cli']
      end
    end

    test 'S2 cli: a finding holds exactly the linked entry title, module, script, advisories and output, those it has, unchanged' do
      with_catalog do
        hold_linked
        body = ops_check(OFFICE, host_id: 'sam_pc', service: 'web')
        assert_equal({ 'title' => 'FX-TITLE-LOGIN placeholder login weakness', 'module' => 'example/fx/login', 'script' => 'fx-login-check',
                       'advisories' => %w[FX-ADV-0001 FX-ADV-0002],
                       'output' => ['FX-OUT-LOGIN-1 invented line', 'FX-OUT-LOGIN-2 invented line'] }, finding_in(body, NOS::FACTORY)['cli'])
        assert_equal %w[title module script advisories output], finding_in(body, NOS::FACTORY)['cli'].keys
        assert_equal({ 'title' => 'FX-TITLE-PANEL placeholder panel setting', 'module' => 'example/fx/panel' },
                     finding_in(body, NOS::OPEN_LISTING)['cli'], 'only the keys the entry has')
        confirmed = ops_confirm(OFFICE, NOS::FACTORY)['finding']['cli']
        assert_equal %w[title module script advisories output], confirmed.keys, 'the confirm answer'
        listed = view_hosts.find { |h| h['id'] == 'sam_pc' }['findings'].find { |f| f['id'] == NOS::FACTORY }['cli']
        assert_equal %w[title module script advisories output], listed.keys, 'GET /network'
      end
    end

    test 'S2 cli: a note key, the link id and an entry nothing links are in no answer' do
      with_catalog do
        hold_linked
        answers = [ops_check(OFFICE, host_id: 'sam_pc', service: 'web').to_json]
        answers << ops_confirm(OFFICE, NOS::FACTORY).to_json
        answers << ops_confirm(OFFICE, NOS::OLD_BANNER).to_json
        answers << network_view(OFFICE).to_json
        answers << ops_check(OFFICE, host_id: 'sam_pc', service: 'web').to_json
        answers.each do |text|
          (FX_NOTES + OTHER_STRINGS + LINKS).each { |t| refute_includes text, t, t }
          refute_includes text, '"_"'
          refute_includes text, 'realism'
        end
      end
    end

    test 'S2 cli: a finding with no link has no cli key, and an answer holds no {} or null for it' do
      with_catalog do
        hold_linked('factory_login' => nil, 'old_banner' => nil, 'open_listing' => nil, 'side_entry' => nil)
        body = ops_check(OFFICE, host_id: 'sam_pc', service: 'web')
        assert(body['findings'].none? { |f| f.key?('cli') })
        listed = view_hosts.find { |h| h['id'] == 'sam_pc' }['findings']
        text = [body['findings'], ops_confirm(OFFICE, NOS::FACTORY)['finding'], listed].to_json
        refute_includes text, '"cli"'
        refute_includes text, '{}'
        refute_includes text, 'null'
      end
    end

    test 'S2 cli: a link that resolves to nothing gives no cli, one warning naming the link id, and the same status, alias and rows' do
      with_catalog do
        hold_linked
        log = warnings_during { ops_check(OFFICE, host_id: 'sam_pc', service: 'web') }
        body = response.parsed_body
        side = finding_in(body, NOS::SIDE_ENTRY)
        refute side.key?('cli')
        assert_equal 1, log.scan('fx_missing').length, 'one warning, naming the link id'
        linked_state = ops_state['opsFindings']
        linked_rows = ops_rows.map { |r| r.slice('event', 'where', 'detail', 'result') }
        hold_linked('side_entry' => nil)
        unlinked_log = warnings_during { ops_check(OFFICE, host_id: 'sam_pc', service: 'web') }
        refute_includes unlinked_log, 'fx_missing'
        assert_equal linked_state, ops_state['opsFindings']
        assert_equal linked_rows, ops_rows.map { |r| r.slice('event', 'where', 'detail', 'result') }
      end
    end

    test 'S2 cli: a weakness and a decoy carry the same key set and value types, linked to entries of one form and linked to neither, before and after the confirm' do
      with_catalog do
        [{ 'factory_login' => 'fx_login', 'old_banner' => 'fx_banner' }, { 'factory_login' => nil, 'old_banner' => nil }].each do |links|
          hold_linked(links)
          body = ops_check(OFFICE, host_id: 'sam_pc', service: 'web')
          weak = finding_in(body, NOS::FACTORY)
          decoy = finding_in(body, NOS::OLD_BANNER)
          assert_equal weak.keys, decoy.keys, "before the confirm #{links}"
          assert_equal weak.transform_values(&:class), decoy.transform_values(&:class)
          assert_equal (weak['cli'] || {}).keys, (decoy['cli'] || {}).keys
          assert_equal (weak['cli'] || {}).transform_values(&:class), (decoy['cli'] || {}).transform_values(&:class)
          weak = ops_confirm(OFFICE, NOS::FACTORY)['finding']
          decoy = ops_confirm(OFFICE, NOS::OLD_BANNER)['finding']
          assert_equal (weak['cli'] || {}).keys, (decoy['cli'] || {}).keys, "after the confirm #{links}"
        end
      end
    end

    test 'S2 cli: no cli string, key or link id is in the bootstrap, a room, a refusal body, a sync answer or the keyring' do
      with_catalog do
        hold_linked
        ops_check(OFFICE, host_id: 'sam_pc', service: 'web')
        ops_confirm(OFFICE, NOS::FACTORY)
        everything = LOGIN_STRINGS + BANNER_STRINGS + PANEL_STRINGS + OTHER_STRINGS + FX_NOTES + LINKS
        bootstrap_scenario
        texts = [response.body]
        @game.reload.scenario_data['rooms'].each_key do |room_id|
          get game_path("room/#{room_id}"), as: :json
          texts << response.body
        end
        ops_scan(OFFICE, host_id: 'print_srv')
        ops_check(OFFICE, host_id: 'print_srv', service: 'queue')
        assert_equal 200, response.status
        texts << response.body
        ops_confirm(OFFICE, NOS::SPOOL)
        texts << response.body
        ops_check(OFFICE, host_id: 'sam_pc')
        texts << response.body
        ops_check(OFFICE, host_id: 'no_such_host', service: 'web')
        assert_equal 404, response.status
        texts << response.body
        ops_confirm(OFFICE, 'sam_pc.web.never_held')
        assert_equal 404, response.status
        texts << response.body
        ops_scan(OFFICE, host_id: 'lab_box')
        set_global('lab_off', true)
        ops_check(OFFICE, host_id: 'lab_box', service: 'web')
        assert_response :forbidden
        assert_equal({ 'success' => false, 'reason' => 'not_responding' }, response.parsed_body)
        texts << response.body
        sync_globals('x' => true)
        texts << response.body
        get game_path('keyring'), as: :json
        texts << response.body
        texts.each do |text|
          everything.each { |t| refute_includes text, t, t }
          refute_includes text, '"cli"'
        end
        # the list holds an unlinked findings answer and refusal bodies, and none of them has a cli key
        assert(texts.any? { |t| t.include?('"findings"') && !t.include?('"cli"') }, 'an unlinked findings answer is in the list')
      end
    end

    test 'S2 cli: the same requests with every cli string changed, or every link pointed at another entry, give the same statuses, reasons, finding statuses and rows' do
      run = lambda do |links|
        hold_linked(links)
        out = []
        out << [ops_check(OFFICE, host_id: 'sam_pc', service: 'web')['findings'].map { |f| [f['id'], f['alias'], f['status']] }, response.status]
        out << [ops_confirm(OFFICE, NOS::FACTORY)['finding']['status'], response.status]
        out << [ops_confirm(OFFICE, NOS::OLD_BANNER)['finding']['status'], response.status]
        ops_confirm(OFFICE, NOS::SPOOL)
        out << [response.parsed_body, response.status]
        out << ops_rows.map { |r| r.slice('event', 'where', 'detail', 'result') }
        out << ops_state['opsFindings']
        out
      end
      with_catalog do
        base = run.call({})
        other = run.call('factory_login' => 'fx_other', 'old_banner' => 'fx_other', 'open_listing' => 'fx_other', 'side_entry' => 'fx_other')
        none = run.call('factory_login' => nil, 'old_banner' => nil, 'open_listing' => nil, 'side_entry' => nil)
        assert_equal base, other
        assert_equal base, none
      end
      # a catalog folder with every string changed: the same answers apart from the strings themselves
      Dir.mktmpdir do |dir|
        File.write(File.join(dir, 'c.json'), File.read(File.join(CATALOG, 'findings.json')).gsub('FX-', 'ZZ-').gsub('example/fx/', 'example/zz/'))
        base = RealismCatalog.with_folder(CATALOG) { run.call({}) }
        changed = RealismCatalog.with_folder(dir) { run.call({}) }
        assert_equal base, changed
      end
    end

    # m1: GET /network rebuilds every held finding every five seconds; the one unresolved link must not
    # write a warning each time.
    test 'S2 cli: an unresolved link warns once for the process however often the finding is built' do
      with_catalog do
        hold_linked
        ops_check(OFFICE, host_id: 'sam_pc', service: 'web')
        log = warnings_during do
          3.times { network_view(OFFICE) }
          ops_confirm(OFFICE, NOS::SIDE_ENTRY)
          ops_check(OFFICE, host_id: 'sam_pc', service: 'web')
        end
        assert_equal 0, log.scan('fx_missing').length, 'the first build already warned; nothing repeats it'
        fresh = RealismCatalog.with_folder(CATALOG) do
          RealismCatalog.reset_warned!
          warnings_during { 3.times { network_view(OFFICE) } }
        end
        assert_equal 1, fresh.scan('fx_missing').length, 'three refetches, one warning'
      end
    end

    # m2: the shape of a catalog entry is not trusted: only strings and arrays of strings are copied.
    test 'S2 cli: a catalog entry with nested objects, a nested note key, a number or an empty string sends only strings and arrays of strings' do
      Dir.mktmpdir do |dir|
        entry = { 'title' => 12_345, 'module' => 'example/odd/module', 'script' => '',
                  'advisories' => { '_' => 'NESTED-NOTE', 'a' => 'NESTED-ADV' },
                  'output' => ['ODD-LINE-1', { '_' => 'NESTED-NOTE-2', 'x' => 'ODD-OBJ' }, 7, '', 'ODD-LINE-2'], '_' => 'TOP-NOTE' }
        File.write(File.join(dir, 'odd.json'), JSON.generate('entries' => { 'fx_login' => entry }))
        RealismCatalog.with_folder(dir) do
          hold_linked('old_banner' => nil, 'open_listing' => nil, 'side_entry' => nil)
          ops_check(OFFICE, host_id: 'sam_pc', service: 'web')
          cli = finding_in(response.parsed_body, NOS::FACTORY)['cli']
          assert_equal({ 'module' => 'example/odd/module', 'output' => %w[ODD-LINE-1 ODD-LINE-2] }, cli)
          %w[NESTED-NOTE NESTED-ADV TOP-NOTE ODD-OBJ 12345].each { |t| refute_includes response.body, t }
        end
      end
    end

    # m10: a catalog folder that failed to load answers as if no finding were linked.
    %w[fault_parse fault_dup_id fault_dup_module].each do |fault|
      test "S2 cli: a linked finding with the #{fault} catalog folder answers as normal with no cli key" do
        folder = File.expand_path("../../fixtures/realism_catalog/#{fault}", __dir__)
        unlinked = { 'factory_login' => nil, 'old_banner' => nil, 'open_listing' => nil, 'side_entry' => nil }
        run = lambda do |links|
          hold_linked(links)
          out = [ops_check(OFFICE, host_id: 'sam_pc', service: 'web')['findings'].map { |f| [f['id'], f['alias'], f['status']] }, response.status]
          texts = [response.body]
          out << [ops_confirm(OFFICE, NOS::FACTORY)['finding'], response.status]
          texts << response.body
          out << view_hosts.find { |h| h['id'] == 'sam_pc' }['findings']
          texts << response.body
          out << ops_rows.map { |r| r.slice('event', 'where', 'detail', 'result') }
          out << ops_state['opsFindings']
          [out, texts]
        end
        base, = RealismCatalog.with_folder(CATALOG) { run.call(unlinked) }
        faulty = nil
        log = warnings_during { faulty = RealismCatalog.with_folder(folder) { run.call({}) } }
        assert_equal base, faulty[0], 'the same statuses, aliases, rows and state as with no links'
        faulty[1].each { |text| refute_includes text, '"cli"' }
        assert_includes log, 'catalog not loaded', 'the loader warned once'
      end
    end
  end
end
