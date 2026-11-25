require 'test_helper'
require_relative '../../support/network_ops_scenario'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops showcase R-T: the real scenarios/demo_ops_recon/scenario.json.erb driven through the routes, one test per
  # beat of SHOWCASE_PLAN.md 5.4 that has a server side (R1 plug, R2 sweep, R3 scan, R4 check and confirm, R5 the
  # printer's saved connection, R6 the file server's findings, R7 both file-server technique sessions and the
  # share, R8 the log rows), each assertion read from a re-read game or a fresh answer. The last test passes every
  # answer of one whole run through the leak scanner. Client-only parts (the coffee run, the caught bark, the view's
  # look, task ticks, the log reader's flag) are PLAYTEST.md's. Passwords are constants here and appear nowhere else.
  class DemoOpsReconScenarioTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests

    SCENARIO_PATH = File.expand_path('../../../scenarios/demo_ops_recon/scenario.json.erb', __dir__)
    JACK = 'hotdesk_jack'.freeze
    FOOT = 'jack_hotdesk_jack'.freeze
    LOG = 'network_log'.freeze
    PRINTER_REAL = 'printer_host.admin_page.factory_login'.freeze
    PRINTER_FALSE = 'printer_host.admin_page.old_build'.freeze
    UPDATE = 'file_server.storage.update_lag'.freeze
    LINK = 'file_server.storage.link_setting'.freeze
    RELEASE = 'file_server.storage.release_line'.freeze
    CAMERA_DECOY = 'lobby_camera.stream.stream_label'.freeze
    AGNIESZKA = ['aduda', 'Gorsefield-Ag-8213'].freeze
    GRAHAM = ['gwhitfield', 'Tarnbeck-Gra-6390'].freeze
    ROOMS = %w[office kitchen server_room it_room].freeze
    CARDS = {
      'card_factory' => ['Technique card: factory accounts', 'printer_cupboard'],
      'card_open_settings' => ['Technique card: left-open settings', 'zainab_tool_roll']
    }.freeze

    def scenario
      JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
    end

    def build(player_state = {})
      build_network_game({ 'unlockedRooms' => ROOMS, 'currentRoom' => 'office',
                           'encounteredNPCs' => %w[ama_owusu zainab_hussain graham_whitfield] }.merge(player_state), scenario)
    end

    def fresh
      Game.find(@game.id)
    end

    def state
      fresh.player_state
    end

    def rows(event = nil)
      list = fresh.log_rows_for(LOG)
      event ? list.select { |r| r['event'] == event } : list
    end

    def own_rows
      rows.reject { |r| r['id'].to_s.match?(/\As\d\z/) }
    end

    def session_at(pc)
      state['sessions']&.[](pc)
    end

    def plugged
      build
      add_item('pc', 'kit_dropbox', 'Network drop box')
      body = plant(JACK)
      assert_response :success, response.body
      body
    end

    def swept
      plugged
      ops_scan(FOOT, network_id: 'office_lan')
      assert_response :success, response.body
    end

    def host_row(id)
      view_hosts(FOOT).find { |h| h['id'] == id }
    end

    def findings(host = nil)
      list = view_hosts(FOOT)
      list = list.select { |h| h['id'] == host } if host
      list.flat_map { |h| h['findings'] || [] }
    end

    def printer_checked
      swept
      ops_scan(FOOT, host_id: 'printer_host')
      assert_response :success, response.body
      ops_check(FOOT, host_id: 'printer_host', service: 'admin_page')
      assert_response :success, response.body
    end

    def server_checked
      printer_checked
      ops_scan(FOOT, host_id: 'file_server')
      assert_response :success, response.body
      ops_check(FOOT, host_id: 'file_server', service: 'storage')
      assert_response :success, response.body
    end

    def take_card(id)
      name, container = CARDS.fetch(id)
      unlock_object(container, 'unlocked')
      assert_response :success, response.body
      add_item('technique_card', id, name)
      assert_response :success, response.body
      assert_includes held_ids, id
    end

    def refused(finding, card, reason)
      body = ops_technique(FOOT, finding, card)
      assert_response :unprocessable_entity, response.body
      assert_equal false, body['success']
      assert_equal reason, body['reason']
      body
    end

    def granted(finding, card)
      body = ops_technique(FOOT, finding, card)
      assert_response :success, response.body
      assert_equal true, body['success']
      body
    end

    # Everything up to the user session on the file server: both printer findings and the file server's checked and confirmed.
    def confirmed_all
      server_checked
      [PRINTER_REAL, PRINTER_FALSE, UPDATE, LINK, RELEASE].each do |id|
        ops_confirm(FOOT, id)
        assert_response :success, response.body
      end
    end

    # ---- the scenario's shape -------------------------------------------------------------------------

    test 'the scenario has one discovery network, a printer, a camera, a file server and three cards; one log source' do
      build
      data = fresh.scenario_data
      assert_equal %w[office_lan], data['networks'].keys
      assert_equal 'scan', data['networks']['office_lan']['discovery']
      assert_equal %w[lobby_camera printer_host], data['hosts'].keys.sort
      assert_equal %w[factory_accounts open_settings update_gap], data['techniques'].keys.sort
      assert_equal [LOG], data['logSources'].keys
      assert_equal %w[s1 s2 s3], data['logSources'][LOG]['seedRows'].map { |r| r['id'] }
      model = NetworkModel.weaknesses(data)
      assert_equal [PRINTER_REAL, UPDATE, LINK].sort, model.map { |w| w[:finding_id] }.sort
      assert_equal [CAMERA_DECOY, PRINTER_FALSE, RELEASE].sort, NetworkModel.decoys(data).map { |d| d[:finding_id] }.sort
      assert_equal({ 'session' => 'user' }, model.find { |w| w[:finding_id] == LINK }[:entry]['needs'])
      jacks = data['rooms'].values.flat_map { |r| r['objects'] }.select { |o| o['networkJack'] }.map { |o| o['id'] }
      assert_equal %w[hotdesk_jack kitchen_jack], jacks.sort
      assert_equal({}, state['opsUsed'].to_h)
      assert_equal({ 'people' => ['graham_whitfield'] }, data['resources']['shared_drive']['access'])
    end

    test 'no NPC mapping names a finding id: the ids would reach the browser with the office room before any check' do
      build
      mappings = fresh.scenario_data['rooms'].values.flat_map { |r| Array(r['npcs']) }.flat_map { |n| Array(n['eventMappings']) }.to_json
      [PRINTER_REAL, PRINTER_FALSE, UPDATE, LINK, RELEASE, CAMERA_DECOY].each { |id| refute_includes mappings, id }
    end

    # ---- R1: plug in ----------------------------------------------------------------------------------

    test 'R1: plugging the drop box in at the hot desk jack holds a foothold and lists no host; unplugging ends it and writes both link rows' do
      body = plugged
      assert_equal true, body['success'], body.to_s
      assert_includes state['footholds'].to_h.keys, FOOT
      block = view_hosts(FOOT)
      assert_equal [], block
      assert_equal 1, own_rows.size
      assert_equal 'net_link_up', own_rows.first['event']
      assert_equal 'jack', own_rows.first['where']['kind'] if own_rows.first['where'].is_a?(Hash)
      unplug(JACK)
      assert_response :success, response.body
      assert_empty state['footholds'].to_h
      assert_equal %w[net_link_down net_link_up], own_rows.map { |r| r['event'] }.sort
    end

    test 'R1: the kitchen jack is a second way in' do
      build
      add_item('pc', 'kit_dropbox', 'Network drop box')
      body = plant('kitchen_jack')
      assert_response :success, response.body
      assert_equal true, body['success']
      assert_includes state['footholds'].to_h.keys, 'jack_kitchen_jack'
    end

    # ---- R2 and R3: sweep and scan ---------------------------------------------------------------------

    test 'R2: before the sweep a scan is the same 404 for a real and an invented host' do
      plugged
      real = [ops_scan(FOOT, host_id: 'printer_host'), response.status]
      invented = [ops_scan(FOOT, host_id: 'no_such_host'), response.status]
      assert_equal invented, real
      assert_equal 404, real.last
      assert_empty own_rows.reject { |r| r['event'] == 'net_link_up' }
    end

    test 'R2: the sweep lists the printer, the file server, the camera, four PCs and the shared drive row with their authored addresses; one swept row' do
      swept
      ids = view_hosts(FOOT).map { |h| h['id'] }.sort
      assert_equal %w[agnieszka_pc chidi_pc file_server graham_pc jun_pc lobby_camera printer_host shared_drive], ids
      assert_equal '10.30.0.20', host_row('printer_host')['address']
      assert_equal '10.30.0.10', host_row('file_server')['address']
      assert_equal 1, rows('network_swept').size
      assert_equal ['office_lan'], state['opsDiscovered']['networks']
      assert_equal '10.30.0.0/24', view_blocks(FOOT).find { |b| b['id'] == 'office_lan' }['cli']['range']
    end

    test 'R3: scanning the printer lists its two services, one row, and scanning a PC row lists no service' do
      swept
      ops_scan(FOOT, host_id: 'printer_host')
      assert_response :success, response.body
      assert_equal %w[admin_page print], host_row('printer_host')['services'].map { |s| s['name'] }.sort
      assert_equal 1, rows('host_scanned').size
      ops_scan(FOOT, host_id: 'chidi_pc')
      assert_empty Array(host_row('chidi_pc')['services'])
    end

    # ---- R4: check and confirm -----------------------------------------------------------------------

    test 'R4: the check lists two unconfirmed findings; confirming settles one real and one false, in either order; one row each' do
      printer_checked
      assert_equal [PRINTER_FALSE, PRINTER_REAL].sort, findings('printer_host').map { |f| f['id'] }.sort
      assert_equal ['unconfirmed'], findings('printer_host').map { |f| f['status'] }.uniq
      assert_equal 1, rows('service_checked').size
      ops_confirm(FOOT, PRINTER_FALSE)
      ops_confirm(FOOT, PRINTER_REAL)
      by = findings('printer_host').to_h { |f| [f['id'], f['status']] }
      assert_equal 'false', by[PRINTER_FALSE]
      assert_equal 'confirmed', by[PRINTER_REAL]
      assert_equal 2, rows('finding_confirmed').size
      ops_confirm(FOOT, 'printer_host.admin_page.no_such')
      refute_equal 200, response.status
      assert_equal 2, rows('finding_confirmed').size
    end

    # ---- R5: technique card 1 -----------------------------------------------------------------------

    test 'R5: the factory card is refused unconfirmed and on the decoy; on the real finding it adds the saved connection, which opens Agnieszka PC through the foothold' do
      printer_checked
      take_card('card_factory')
      refused(PRINTER_REAL, 'card_factory', 'not_confirmed')
      ops_confirm(FOOT, PRINTER_REAL)
      ops_confirm(FOOT, PRINTER_FALSE)
      refused(PRINTER_FALSE, 'card_factory', 'false_positive')
      assert_equal %w[false_positive not_confirmed], rows('technique_refused').map { |r| r['detail']['reason'] }.sort
      get game_path('keyring'), as: :json
      refute_includes response.parsed_body['entries'].map { |e| e['id'] }, 'print_admin'
      body = granted(PRINTER_REAL, 'card_factory')
      assert_equal 'credential', body['grant']
      assert_equal true, body['keyringChanged']
      get game_path('keyring'), as: :json
      assert_includes response.parsed_body['entries'].map { |e| e['id'] }, 'print_admin'
      assert_equal [PRINTER_REAL], state['opsUsed']
      assert_equal 1, rows('technique_used').size
      post game_path('login'), params: { pc_id: 'agnieszka_pc', credential: 'print_admin', foothold: FOOT }, as: :json
      assert_response :success, response.body
      record = session_at('agnieszka_pc')
      assert_equal 'credential', record['via']
      assert_equal 'agnieszka_duda', record['id']
      get game_path("container/agnieszka_pc"), params: { foothold: FOOT }, as: :json
      assert_response :success, response.body
    end

    test 'R5: the factory card does not fit the file server first finding (wrong class), and a card not held is not found' do
      confirmed_all
      take_card('card_factory')
      refused(UPDATE, 'card_factory', 'wrong_class')
      ops_technique(FOOT, UPDATE, 'card_not_held')
      assert_response :not_found
      assert_empty state['sessions'].to_h
    end

    # ---- R6: the file server ------------------------------------------------------------------------

    test 'R6: the file server scan and check list the banner, three findings and the decoy shows why it is false' do
      server_checked
      service = host_row('file_server')['services'].first
      assert_equal 'Tarnwick FileHold 4.2 file service ready', service['cli']['banner']
      assert_equal [LINK, RELEASE, UPDATE].sort, findings('file_server').map { |f| f['id'] }.sort
      ops_confirm(FOOT, RELEASE)
      false_one = findings('file_server').find { |f| f['id'] == RELEASE }
      assert_equal 'false', false_one['status']
      assert_equal 'The build number is only a label. The service was updated last month.', false_one['falseBecause']
    end

    # ---- R7: card 2, the step up and the share --------------------------------------------------------

    test 'R7: Zainab hands over the update card from her held items; her tool roll holds the settings card' do
      build
      post game_path('inventory'), params: { action_type: 'add', source_npc_id: 'zainab_hussain',
                                             item: { type: 'technique_card', id: 'card_update_gap', name: 'Technique card: known update gap' } }, as: :json
      assert_response :success, response.body
      assert_includes held_ids, 'card_update_gap'
      take_card('card_open_settings')
    end

    test 'R7: the update gap card opens a user session as Agnieszka; the step up needs it, then opens an admin session as Graham' do
      confirmed_all
      post game_path('inventory'), params: { action_type: 'add', source_npc_id: 'zainab_hussain',
                                             item: { type: 'technique_card', id: 'card_update_gap', name: 'Technique card: known update gap' } }, as: :json
      assert_response :success, response.body
      take_card('card_open_settings')
      refused(LINK, 'card_open_settings', 'need_unmet')
      first = granted(UPDATE, 'card_update_gap')
      assert_equal 'session', first['grant']
      assert_equal({ 'id' => 'agnieszka_duda', 'via' => 'technique', 'foothold' => FOOT, 'access' => 'user', 'technique' => UPDATE },
                   session_at('file_server'))
      second = granted(LINK, 'card_open_settings')
      assert_equal 'admin', second['session']['access']
      assert_equal 'graham_whitfield', session_at('file_server')['id']
      assert_equal 'admin', session_at('file_server')['access']
      assert_equal [UPDATE, LINK], state['opsUsed']
      assert_equal 2, rows('technique_used').size
    end

    test 'R7: the shared drive is refused with the foothold alone, after the card on the printer and after the user session, and served after the admin session' do
      confirmed_all
      post game_path('inventory'), params: { action_type: 'add', source_npc_id: 'zainab_hussain',
                                             item: { type: 'technique_card', id: 'card_update_gap', name: 'Technique card: known update gap' } }, as: :json
      take_card('card_open_settings')
      take_card('card_factory')
      container('shared_drive', foothold: FOOT)
      assert_response :not_found, 'a foothold alone'
      granted(PRINTER_REAL, 'card_factory')
      container('shared_drive', foothold: FOOT)
      assert_response :not_found, 'the printer saved connection'
      granted(UPDATE, 'card_update_gap')
      container('shared_drive', foothold: FOOT)
      assert_response :not_found, 'the user session as Agnieszka'
      assert_empty rows('share_folder_opened')
      granted(LINK, 'card_open_settings')
      body = container('shared_drive', foothold: FOOT)
      assert_response :success, response.body
      assert_includes body.to_json, 'readme.txt'
      assert_equal 1, rows('share_folder_opened').size
    end

    test 'R7: unplugging ends the file server session; the used findings and the keyring entry stay' do
      confirmed_all
      post game_path('inventory'), params: { action_type: 'add', source_npc_id: 'zainab_hussain',
                                             item: { type: 'technique_card', id: 'card_update_gap', name: 'Technique card: known update gap' } }, as: :json
      take_card('card_factory')
      granted(PRINTER_REAL, 'card_factory')
      granted(UPDATE, 'card_update_gap')
      ended = unplug(JACK)
      assert_response :success, response.body
      assert_includes Array(ended['endedPcIds']), 'file_server'
      assert_nil session_at('file_server')
      assert_equal [PRINTER_REAL, UPDATE], state['opsUsed']
      get game_path('keyring'), as: :json
      assert_includes response.parsed_body['entries'].map { |e| e['id'] }, 'print_admin'
      get game_path('network'), params: { foothold: FOOT }, as: :json
      assert_response :not_found
    end

    # ---- free play: the printer switched off -----------------------------------------------------------

    test 'free play: with the printer switched off at the wall the sweep does not list it and the scan is refused' do
      plugged
      set_global('printer_off', true)
      ops_scan(FOOT, network_id: 'office_lan')
      assert_response :success, response.body
      assert_equal false, host_row('printer_host')['responding'], 'switched off at the wall: the row is listed but does not answer'
      assert_nil host_row('printer_host')['services']
      ops_scan(FOOT, host_id: 'printer_host')
      refute_equal 200, response.status
    end

    # ---- R8: the log -----------------------------------------------------------------------------------

    def read_log
      get "/break_escape/games/#{@game.id}/log_rows", params: { object_id: 'network_log_pc' }, as: :json
      response.parsed_body
    end

    test 'R8: the log reader answers the three seed rows first, then the rows of the run; the anomaly names the 07:12 sweep from the kitchen jack' do
      printer_checked
      body = read_log
      assert_response :success, body.inspect
      assert_equal 'Network log', body['title']
      seeds = body['rows'].select { |r| %w[s1 s2 s3].include?(r['id']) }
      assert_equal %w[s1 s2 s3], seeds.map { |r| r['id'] }
      assert_equal ['Tue 07:10', 'Tue 07:12', 'Tue 07:14'], seeds.map { |r| r['at'] }
      assert_operator body['rows'].size, :>, 3
      assert_equal 4, own_rows.size, 'plug, sweep, scan, check'
      assert_equal 1, own_rows.count { |r| r['event'] == 'net_link_up' }
      before = rows.size
      read_log
      assert_equal before, rows.size, 'reading writes no row'
      get room_game_url(@game, room_id: 'it_room'), as: :json
      assert_response :success
      reader = JSON.parse(response.body)['room']['objects'].find { |o| o['id'] == 'network_log_pc' }
      assert_equal 's2', reader['minigameData']['anomaly']['rowId']
      assert_equal [{ 'type' => 'set_global', 'key' => 'read_log_done', 'value' => true },
                    { 'type' => 'complete_task', 'taskId' => 'read_log' }], reader['minigameData']['completionActions']
    end

    test 'R8: there is no server route for the flag' do
      build
      begin
        post "/break_escape/games/#{@game.id}/log_rows/flag", params: { object_id: 'network_log_pc', row_id: 's2' }, as: :json
        assert_response :not_found
      rescue ActionController::RoutingError
        pass
      end
    end

    # ---- the leak scan --------------------------------------------------------------------------------

    def rec(extra = {})
      @recorded << { 'method' => request.request_method, 'path' => request.path, 'status' => response.status,
                     'body' => response.parsed_body }.merge(extra)
      @recorded.last
    end

    def take_rec(type, id, name, container: nil, npc: nil)
      if container
        unlock_object(container, 'unlocked')
        rec
      end
      params = { action_type: 'add', item: { type: type, id: id, name: name } }
      params[:source_npc_id] = npc if npc
      post game_path('inventory'), params: params, as: :json
      assert_response :success, response.body
      rec('inv' => { 'action' => 'add', 'itemId' => id, 'usedOn' => nil })
    end

    def play_whole_run
      @recorded = []
      build
      bootstrap_scenario
      rec
      ROOMS.each do |room|
        get game_path("room/#{room}"), as: :json
        rec
      end
      take_rec('technique_card', 'card_factory', 'Technique card: factory accounts', container: 'printer_cupboard')
      take_rec('pc', 'kit_dropbox', 'Network drop box')
      plant(JACK)
      rec
      ops_scan(FOOT, network_id: 'office_lan')
      rec
      %w[printer_host file_server lobby_camera chidi_pc].each do |host|
        ops_scan(FOOT, host_id: host)
        rec
      end
      ops_check(FOOT, host_id: 'printer_host', service: 'admin_page')
      rec
      ops_check(FOOT, host_id: 'file_server', service: 'storage')
      rec
      ops_check(FOOT, host_id: 'lobby_camera', service: 'stream')
      rec
      network_view(FOOT)
      rec
      [PRINTER_REAL, PRINTER_FALSE, UPDATE, LINK, RELEASE, CAMERA_DECOY].each do |id|
        ops_confirm(FOOT, id)
        rec
      end
      ops_technique(FOOT, PRINTER_FALSE, 'card_factory')
      rec
      ops_technique(FOOT, PRINTER_REAL, 'card_factory')
      rec
      get game_path('keyring'), as: :json
      rec
      post game_path('login'), params: { pc_id: 'agnieszka_pc', credential: 'print_admin', foothold: FOOT }, as: :json
      rec('login' => { 'pcId' => 'agnieszka_pc' })
      get game_path('container/agnieszka_pc'), params: { foothold: FOOT }, as: :json
      rec
      take_rec('technique_card', 'card_update_gap', 'Technique card: known update gap', npc: 'zainab_hussain')
      take_rec('technique_card', 'card_open_settings', 'Technique card: left-open settings', container: 'zainab_tool_roll')
      ops_technique(FOOT, UPDATE, 'card_update_gap')
      rec
      ops_technique(FOOT, LINK, 'card_open_settings')
      rec
      network_view(FOOT)
      rec
      container('shared_drive', foothold: FOOT)
      rec
      get "/break_escape/games/#{@game.id}/log_rows", params: { object_id: 'network_log_pc' }, as: :json
      rec
      unplug(JACK)
      rec
      @recorded
    end

    test 'the whole played run reports nothing to the leak scanner' do
      play_whole_run
      assert_operator @recorded.length, :>, 30
      lines = @recorded.each_with_index.map { |r, i| ['run.jsonl', i + 1, r] }
      found = AccessLeakScanner.new(scenario).scan(lines).map { |f| [f.line, f.rule, f.owner, f.route] }
      assert_equal [], found
      raw = @recorded.to_json
      [AGNIESZKA.last, 'Larkmoor-Jun-5521', 'Fernwick-Chi-3047', GRAHAM.last, 'filehold_update_lag'].each { |text| refute_includes raw, text }
    end
  end
end
