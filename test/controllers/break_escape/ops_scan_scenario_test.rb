require 'test_helper'
require_relative '../../support/network_ops_scenario'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops core S1 (OPS_CORE_PLAN.md 11.4, the `test_ops_scan` beats): the real
  # scenarios/test_ops_scan/scenario.json.erb driven through the routes, each assertion read
  # from a re-read game or a fresh answer. The in-browser part is PLAYTEST.md's.
  class OpsScanScenarioTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    SCENARIO_PATH = File.expand_path('../../../scenarios/test_ops_scan/scenario.json.erb', __dir__)
    OFFICE = 'jack_office_port'.freeze
    GUEST = 'jack_guest_port'.freeze
    PASSWORD = 'Dockyard-Ian-41'.freeze
    HIDDEN = ['Second floor printer', 'Camera recorder', 'Door controller', 'Inkvale', 'Lookwell', 'Gatewright', 'Brackley',
              'Larkspur', 'FILES01', 'DESK01', 'OFFICE-FS', 'Office-Drop'].freeze
    NOT_FOUND = { 'success' => false, 'reason' => 'not_found' }.freeze

    def scenario
      JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
    end

    def build(player_state = {})
      build_network_game({ 'unlockedRooms' => %w[lobby comms_room], 'encounteredNPCs' => %w[ian] }.merge(player_state), scenario)
    end

    def plant_at(jack)
      add_item('pc', 'kit_dropbox', 'Network drop box') unless held_ids.include?('kit_dropbox')
      body = plant(jack)
      assert_response :success, response.body
      body
    end

    def scan(foothold, **target)
      post game_path('network/scan'), params: { foothold: foothold }.merge(target), as: :json
      response.parsed_body
    end

    def entry(foothold)
      network_view(foothold)['footholds'].find { |f| f['id'] == foothold }
    end

    def block(foothold, id)
      entry(foothold)['networks'].find { |n| n['id'] == id }
    end

    def fresh
      Game.find(@game.id)
    end

    def audit
      fresh.log_rows_for('network_audit')
    end

    def discovered
      fresh.player_state['opsDiscovered']
    end

    def ids(rows)
      rows.map { |r| r['id'] }
    end

    def pivot_to_plant
      sign_in('files01', 'iokafor', PASSWORD, foothold: OFFICE)
      assert_response :success, response.body
    end

    test 'the scenario has its networks, hosts and log source, and a new game has swept nothing' do
      build
      data = fresh.scenario_data
      assert_equal %w[guest_lan office_lan plant_lan], data['networks'].keys.sort
      assert_equal %w[camrec01 doorctl01 printer01], data['hosts'].keys.sort
      assert_equal ['network_audit'], data['logSources'].keys
      assert_equal({}, discovered || {})
      assert_equal [], audit
    end

    test 'beat 1: the office block opens empty, offering the sweep, with no host name or product anywhere' do
      build
      plant_at('office_port')
      view = network_view(OFFICE)
      raw = response.body
      HIDDEN.each { |text| refute_includes raw, text, "the unswept view shows #{text}" }
      office = block(OFFICE, 'office_lan')
      assert_equal false, office['swept']
      assert_equal [], office['hosts']
      refute office.key?('ops')
      assert_equal [], entry(OFFICE)['hosts']
      assert_equal [OFFICE], view['footholds'].map { |f| f['id'] }
      assert_equal [], audit
    end

    test 'beat 2: by name the tiles, the share and a sign-in answer as on an open network; the ops requests are one 404' do
      build
      plant_at('office_port')
      get game_path('login_accounts'), params: { pc_id: 'desk01', foothold: OFFICE }, as: :json
      assert_response :success, response.body
      container('office_drop', foothold: OFFICE)
      assert_response :success, response.body
      real = [scan(OFFICE, host_id: 'printer01'), response.status]
      invented = [scan(OFFICE, host_id: 'invented_one'), response.status]
      assert_equal invented, real
      assert_equal [NOT_FOUND, 404], real
      assert_equal [NOT_FOUND, 404], [scan(OFFICE, network_id: 'plant_lan'), response.status]
      assert_equal [NOT_FOUND, 404], [scan(OFFICE, network_id: 'invented_net'), response.status]
      assert_equal [], block(OFFICE, 'office_lan')['hosts']
      assert_equal [], audit
      assert_equal({}, discovered || {})
    end

    test 'beat 2b: a sign-in by name to a PC on the unswept network is answered as on an open network, and only that PC gets a row' do
      build
      plant_at('office_port')
      body = sign_in('files01', 'iokafor', PASSWORD, foothold: OFFICE)
      assert_response :success, response.body
      assert_equal true, body['success']
      office = block(OFFICE, 'office_lan')
      assert_equal ['files01'], ids(office['hosts'])
      assert_equal 'iokafor', office['hosts'].first['session']['username']
      assert_equal false, office['swept']
      refute_includes response.body, 'Second floor printer'
      assert_equal [], audit
    end

    test 'beats 3 and 4: the sweep lists five rows with no service, repeats as already; the scan lists services, once' do
      build
      plant_at('office_port')
      first = scan(OFFICE, network_id: 'office_lan')
      assert_response :success, response.body
      assert_equal %w[camrec01 desk01 files01 office_drop printer01], ids(first['network']['hosts']).sort
      assert first['network']['hosts'].none? { |r| r.key?('services') || r.key?('scanned') }
      assert_nil first['already']
      again = scan(OFFICE, network_id: 'office_lan')
      assert_equal true, again['already']
      assert_equal first['network']['hosts'], again['network']['hosts']
      assert_equal ['office_lan'], discovered['networks']
      assert_equal [['network_swept', 2]], audit.map { |r| [r['event'], r['n']] }, 'the repeat merges into the one row'

      printer = scan(OFFICE, host_id: 'printer01')
      assert_response :success, response.body
      assert_equal %w[print admin_page], printer['host']['services'].map { |s| s['name'] }
      assert_equal 'Inkvale JetServe', printer['host']['services'].find { |s| s['name'] == 'print' }['product']
      assert_equal true, printer['host']['scanned']
      repeat = scan(OFFICE, host_id: 'printer01')
      assert_equal true, repeat['already']
      assert_equal printer['host']['services'], repeat['host']['services']
      assert_equal ['printer01'], discovered['hosts']
      assert_equal [['network_swept', 2], ['host_scanned', nil]], audit.map { |r| [r['event'], r['n']] }
      listed = block(OFFICE, 'office_lan')['hosts'].find { |r| r['id'] == 'printer01' }
      assert_equal printer['host']['services'], listed['services']
    end

    test 'beat 5: with the switch flipped the recorder is 403 not_responding and nothing is recorded' do
      build
      plant_at('office_port')
      scan(OFFICE, network_id: 'office_lan')
      sync_globals('camrec_off' => true)
      assert_response :success, response.body
      before = fresh.player_state['opsDiscovered'].deep_dup
      assert_equal({ 'success' => false, 'reason' => 'not_responding' }, scan(OFFICE, host_id: 'camrec01'))
      assert_response :forbidden
      assert_equal before, discovered
      row = block(OFFICE, 'office_lan')['hosts'].find { |r| r['id'] == 'camrec01' }
      assert_equal false, row['responding']
    end

    test 'beats 6 and 7: a sign-in at the file server opens an unswept plant block; its sweep lists the controller, its scan the services' do
      build
      plant_at('office_port')
      scan(OFFICE, network_id: 'office_lan')
      pivot_to_plant
      plant_block = block(OFFICE, 'plant_lan')
      assert_equal false, plant_block['swept']
      assert_equal [], plant_block['hosts']
      refute_includes response.body, 'Door controller'
      swept = scan(OFFICE, network_id: 'plant_lan')
      assert_response :success, response.body
      assert_equal ['doorctl01'], ids(swept['network']['hosts'])
      door = scan(OFFICE, host_id: 'doorctl01')
      assert_equal %w[control status_page], door['host']['services'].map { |s| s['name'] }
      assert_equal %w[office_lan plant_lan], discovered['networks'].sort
      assert_equal ['doorctl01'], discovered['hosts'] - ['printer01']
      assert_equal 3, audit.length
    end

    test 'beat 8: a reload shows the same blocks, rows and services' do
      build
      plant_at('office_port')
      scan(OFFICE, network_id: 'office_lan')
      scan(OFFICE, host_id: 'printer01')
      pivot_to_plant
      scan(OFFICE, network_id: 'plant_lan')
      scan(OFFICE, host_id: 'doorctl01')
      before = entry(OFFICE)
      office = before['networks'].find { |n| n['id'] == 'office_lan' }
      assert_equal true, office['swept']
      assert_equal %w[camrec01 desk01 files01 office_drop printer01], ids(office['hosts']).sort
      assert_equal %w[print admin_page], office['hosts'].find { |r| r['id'] == 'printer01' }['services'].map { |s| s['name'] }
      plant = before['networks'].find { |n| n['id'] == 'plant_lan' }
      assert_equal true, plant['swept']
      assert_equal ['doorctl01'], ids(plant['hosts'])
      assert_equal %w[control status_page], plant['hosts'].first['services'].map { |s| s['name'] }
      # A reload asks for the bootstrap, then the view again, on the game as the database holds it.
      bootstrap_scenario
      assert_response :success, response.body
      assert_equal before, entry(OFFICE)
    end

    test 'beat 9: unplugging ends the pivot, keeps the sweep and the scans, and the pivot shows plant_lan again as swept' do
      build
      plant_at('office_port')
      scan(OFFICE, network_id: 'office_lan')
      scan(OFFICE, host_id: 'printer01')
      pivot_to_plant
      scan(OFFICE, network_id: 'plant_lan')
      unplug('office_port')
      assert_response :success, response.body
      plant_at('office_port')
      office = block(OFFICE, 'office_lan')
      assert_equal true, office['swept']
      assert_includes ids(office['hosts']), 'printer01'
      assert_equal 2, office['hosts'].find { |r| r['id'] == 'printer01' }['services'].length
      assert_nil block(OFFICE, 'plant_lan')
      assert_equal %w[office_lan plant_lan], discovered['networks'].sort
      pivot_to_plant
      replant = block(OFFICE, 'plant_lan')
      assert_equal true, replant['swept']
      assert_equal ['doorctl01'], ids(replant['hosts'])
    end

    test 'beat 10: the open guest network lists its PC at once, offers no sweep, and a scan works' do
      build
      plant_at('guest_port')
      guest = block(GUEST, 'guest_lan')
      assert_equal ['guest_kiosk'], ids(guest['hosts'])
      refute guest.key?('swept')
      assert guest['ops']
      assert_nil guest['hosts'].first['services']
      refute_includes response.body, 'Heronvale'
      scanned = scan(GUEST, host_id: 'guest_kiosk')
      assert_response :success, response.body
      assert_equal ['portal'], scanned['host']['services'].map { |s| s['name'] }
      assert_equal ['guest_kiosk'], discovered['hosts']
      assert_equal ['host_scanned'], audit.map { |r| r['event'] }
    end

    test 'a sweep of the open guest network is 422 not_needed' do
      build
      plant_at('guest_port')
      assert_equal({ 'success' => false, 'reason' => 'not_needed' }, scan(GUEST, network_id: 'guest_lan'))
      assert_response :unprocessable_entity
    end

    test 'the bootstrap never carries a host, a service or the discovery fields' do
      build
      body = bootstrap_scenario
      raw = response.body
      HIDDEN.each { |text| refute_includes raw, text, "the bootstrap shows #{text}" }
      refute body.key?('hosts')
      refute raw.include?('"discovery"')
      refute raw.include?('"services"')
      get game_path('room/lobby'), as: :json
      assert_response :success, response.body
      HIDDEN.each { |text| refute_includes response.body, text, "room data shows #{text}" }
    end

    # Beat 11: the real answers of a run, in order, through the leak scanner's ops rule.
    test 'beat 11: the answers of the whole run pass the ops leak scan in order, and a premature listing would not' do
      build
      log = []
      record = lambda do |method, path|
        log << { 'method' => method, 'path' => "/break_escape/games/#{@game.id}/#{path}", 'status' => response.status,
                 'body' => response.parsed_body }
      end
      get game_path('scenario'), as: :json
      record.call('GET', 'scenario')
      plant_at('office_port')
      network_view(OFFICE)
      record.call('GET', 'network')
      scan(OFFICE, network_id: 'office_lan')
      record.call('POST', 'network/scan')
      network_view(OFFICE)
      record.call('GET', 'network')
      scan(OFFICE, host_id: 'printer01')
      record.call('POST', 'network/scan')
      pivot_to_plant
      scan(OFFICE, network_id: 'plant_lan')
      record.call('POST', 'network/scan')
      scan(OFFICE, host_id: 'doorctl01')
      record.call('POST', 'network/scan')
      network_view(OFFICE)
      record.call('GET', 'network')
      scanner = AccessLeakScanner.new(fresh.scenario_data)
      assert_operator scanner.counts[:ops_strings], :>=, 10
      lines = log.each_with_index.map { |row, i| ['run.jsonl', i + 1, row] }
      assert_empty scanner.scan(lines).select { |f| f.rule == 'ops_string' }
      # The view that lists the swept rows, read with no sweep answer before it, is a leak.
      leaked = AccessLeakScanner.new(fresh.scenario_data).scan([['run.jsonl', 1, log[3]]])
      assert_operator leaked.count { |f| f.rule == 'ops_string' }, :>, 0
      # Mirror (N2): the last view lists the scanned services on rows that say `scanned: true`. With only the
      # sweeps named, and no scan answer before it, that listing is a leak: the row cannot earn its own scan.
      assert_includes log.last['body'].to_s, 'scanned'
      premature = AccessLeakScanner.new(fresh.scenario_data)
                                   .scan([['run.jsonl', 1, log.last]], ops_steps: %w[sweep:office_lan sweep:plant_lan])
      assert_operator premature.count { |f| f.rule == 'ops_string' && f.owner.start_with?('ops:service:') }, :>, 0
    end

    test 'the state keeps opsDiscovered server-side and a sync body cannot write it' do
      build
      plant_at('office_port')
      put game_path('sync_state'), params: { opsDiscovered: { 'networks' => ['office_lan'], 'hosts' => ['printer01'] } }, as: :json
      assert_equal({}, discovered || {})
      assert_equal [], ids(block(OFFICE, 'office_lan')['hosts'])
    end
  end
end
