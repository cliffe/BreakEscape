require 'test_helper'
require_relative '../../support/network_ops_scenario'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Showcase tour U4: the real scenarios/demo_ops_terminal/scenario.json.erb driven through the routes, one test per
  # beat of SHOWCASE_TOUR_PLAN.md 2.4 that has a server side (T1 plug and token clock, T2 sweep, T3 token sign-in,
  # T11 the keystroke device refused over a remote session, T4 check and the realism text, T6 confirm, T7 both
  # technique sessions, T9 the relay and its end, T10 the token running out and its greyed row, the spare port's
  # separate clock, T12 the unplug). The last test passes every answer of one whole run through the leak scanner.
  # Client-only parts (task ticks, barks, the Terminal's own text and the whole-word unplug verb) are PLAYTEST.md's.
  class DemoOpsTerminalScenarioTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests

    SCENARIO_PATH = File.expand_path('../../../scenarios/demo_ops_terminal/scenario.json.erb', __dir__)
    RACK = 'rack_jack'.freeze
    SPARE = 'spare_jack'.freeze
    FOOT = 'jack_rack_jack'.freeze
    SPARE_FOOT = 'jack_spare_jack'.freeze
    UPDATE = 'file_server.storage.update_lag'.freeze
    LINK = 'file_server.storage.link_setting'.freeze
    RELEASE = 'file_server.storage.release_line'.freeze
    LINKS = { UPDATE => 'filehold_update_lag', LINK => 'filehold_link_setting', RELEASE => 'filehold_release_line' }.freeze
    CLI_KEYS = %w[title module script advisories output].freeze
    ROOMS = %w[office server_room it_room].freeze
    NEEDS_CONSOLE = 'Nobody is signed in at this keyboard.'.freeze
    ZAINAB = ['zhussain', 'Ravenmoor-Zai-7724'].freeze
    GRAHAM = ['gwhitfield', 'Tarnbeck-Gra-6390'].freeze
    KEYS = { 'id' => 'kit_keys', 'type' => 'pc', 'name' => 'Keystroke device', 'takeable' => true, 'usbClass' => 'hid' }.freeze
    T0 = Time.utc(2026, 11, 25, 10, 0, 0)

    def scenario
      JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
    end

    setup do
      travel_back
      travel_to T0
      OpsLog::Current.reset
      Thread.current[:ops_log_overlay] = nil
    end

    teardown do
      travel_back
      OpsLog::Current.reset
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

    def keyring
      get game_path('keyring'), as: :json
      assert_response :success, response.body
      response.parsed_body
    end

    def row(id)
      keyring['entries'].find { |e| e['id'] == id }
    end

    def plugged(jack = RACK)
      build
      add_item('pc', 'kit_dropbox', 'Network drop box')
      body = plant(jack)
      assert_response :success, response.body
      body
    end

    def swept(foot = FOOT)
      ops_scan(foot, network_id: 'branch_lan')
      assert_response :success, response.body
    end

    def token_in(credential = 'zainab_token', foot = FOOT)
      post game_path('login'), params: { pc_id: 'backup_pc', credential: credential, foothold: foot }, as: :json
      response.parsed_body
    end

    def implant
      post game_path('network/implant'), params: { pc_id: 'backup_pc', shape: 'session' }, as: :json
      response.parsed_body
    end

    def host_checked
      plugged
      swept
      ops_scan(FOOT, host_id: 'file_server')
      assert_response :success, response.body
      ops_check(FOOT, host_id: 'file_server', service: 'storage')
      assert_response :success, response.body
    end

    def confirm_all
      host_checked
      LINKS.each_key do |id|
        ops_confirm(FOOT, id)
        assert_response :success, response.body
      end
    end

    def give_card(id, name, tech, container: nil)
      if container
        unlock_object(container, 'unlocked')
        assert_response :success, response.body
        add_item('technique_card', id, name)
      else
        post game_path('inventory'), params: { action_type: 'add', source_npc_id: 'zainab_hussain',
                                               item: { type: 'technique_card', id: id, name: name } }, as: :json
      end
      assert_response :success, response.body
      assert_includes held_ids, id, tech
    end

    # ---- the scenario's shape -------------------------------------------------------------------------

    test 'the scenario has one discovery network, one finding holder with three linked findings, three credentials, no log source' do
      build
      data = fresh.scenario_data
      assert_equal %w[branch_lan], data['networks'].keys
      assert_equal 'scan', data['networks']['branch_lan']['discovery']
      assert_equal({}, data['hosts'].to_h)
      assert_equal %w[open_settings update_gap], data['techniques'].keys.sort
      assert_equal %w[graham_assist zainab_token zainab_token_spare], data['credentials'].keys.sort
      assert_nil data['logSources']
      assert_equal({ 'defaultSkin' => 'cli' }, data['networkView'])
      model = NetworkModel.weaknesses(data)
      assert_equal [LINK, UPDATE].sort, model.map { |w| w[:finding_id] }.sort
      assert_equal [RELEASE], NetworkModel.decoys(data).map { |d| d[:finding_id] }
      assert_equal({ 'session' => 'user' }, model.find { |w| w[:finding_id] == LINK }[:entry]['needs'])
      linked = data['rooms'].values.flat_map { |r| r['objects'] }.select { |o| o['services'] }
                            .flat_map { |o| o['services'] }.flat_map { |s| s['weaknesses'].to_a + s['decoys'].to_a }.map { |f| f['realism'] }
      assert_equal LINKS.values.sort, linked.sort
      assert_equal 'Tarnwick FileHold 4.2 file service ready', data['rooms']['server_room']['objects'].find { |o| o['id'] == 'file_server' }['services'].first['cli']['banner']
    end

    test 'every global the ink or a mapping writes is a declared scenario global, and the spare port is hidden until spare_port_offered' do
      data = scenario
      declared = data['globalVariables'].keys
      %w[spare_port_offered graham_assist_ended token_ran_out token_expired_done relay_seen shared_screen_done unplug_done
         plug_in_done sweep_done use_token_done needs_console_done scan_check_done console_done confirm_all_done step_up_done
         keeps_log_done t6_update_seen t6_link_seen t6_release_seen graham_assist_given zainab_card_given coffee_call].each do |name|
        assert_includes declared, name
      end
      ama = data['rooms']['office']['npcs'].find { |n| n['id'] == 'ama_owusu' }
      written = ama['eventMappings'].flat_map { |m| (m['setGlobal'] || {}).keys }
      written.each { |name| assert_includes declared, name, "mapping writes #{name}" }
      ink = File.read(File.expand_path('../../../scenarios/demo_ops_terminal/ink/ama_owusu.ink', __dir__))
      ink.scan(/^VAR (\w+)/).flatten.each { |name| assert(declared.include?(name) || name == 'met_ama', "ink VAR #{name} is not declared") }
      spare = data['rooms']['server_room']['objects'].find { |o| o['id'] == SPARE }
      assert_equal 'spare_port_offered', spare['revealOnGlobal']
      assert_equal false, data['globalVariables']['spare_port_offered']
      assert_equal 6, data['credentials']['zainab_token']['expiresMin']
      assert_equal({ 'foothold' => FOOT }, data['credentials']['zainab_token']['proof'])
      assert_equal({ 'foothold' => SPARE_FOOT }, data['credentials']['zainab_token_spare']['proof'])
    end

    test 'no NPC mapping names a full finding id: the ids would reach the browser with the room before any check' do
      build
      mappings = fresh.scenario_data['rooms'].values.flat_map { |r| Array(r['npcs']) }.flat_map { |n| Array(n['eventMappings']) }.to_json
      LINKS.each_key { |id| refute_includes mappings, id }
    end

    # ---- T1 and T2: the plug, the token's clock and the sweep -----------------------------------------

    test 'T1: the plug at the server room port holds a foothold, lists no host, and the first token arrives with its clock started' do
      build
      assert_nil row('zainab_token'), 'no token before the box is in'
      add_item('pc', 'kit_dropbox', 'Network drop box')
      assert_nil state['credentialClock']&.dig('zainab_token')
      body = plant(RACK)
      assert_response :success, response.body
      assert_equal true, body['success']
      assert_includes state['footholds'].to_h.keys, FOOT
      assert_equal [], view_hosts(FOOT)
      assert_equal T0.to_f, state['credentialClock']['zainab_token']
      token = row('zainab_token')
      assert token, 'the token is in the keyring once the box is in'
      assert_equal 'Backup PC sign-in token', token['label']
      refute token['expired']
      assert_nil row('zainab_token_spare')
    end

    test 'T2: the sweep lists the file server and three PCs with their authored addresses, as one table the Terminal draws' do
      plugged
      swept
      ids = view_hosts(FOOT).map { |h| h['id'] }.sort
      assert_equal %w[backup_pc chidi_pc file_server graham_pc], ids
      assert_equal '10.50.0.10', view_hosts(FOOT).find { |h| h['id'] == 'file_server' }['address']
      assert_equal '10.50.0.0/24', view_blocks(FOOT).find { |b| b['id'] == 'branch_lan' }['cli']['range']
    end

    # ---- T3 and T11: the token and the keystroke device -----------------------------------------------

    test 'T3: the token signs Zainab in at the backup PC through the foothold with no password' do
      plugged
      body = token_in
      assert_response :success, response.body
      assert body['success'], body.to_s
      record = state['sessions']['backup_pc']
      assert_equal 'zainab_hussain', record['id']
      assert_equal FOOT, record['foothold']
    end

    test 'T11: while the token is live the keystroke device answers needs_console and stays held; after expiry the answer is the quiet not_ready' do
      plugged
      add_item(*KEYS.values_at('type', 'id', 'name'))
      token_in
      assert_response :success, response.body
      body = implant
      assert_response :unprocessable_entity, body.to_s
      assert_equal 'needs_console', body['reason']
      assert_equal NEEDS_CONSOLE, body['error']
      assert_includes held_ids, 'kit_keys'
      travel 7.minutes
      body = implant
      assert_equal 'not_ready', body['reason']
      assert_includes held_ids, 'kit_keys'
    end

    # ---- T4: the check, and the realism text ---------------------------------------------------------

    test 'T4: nothing before the check carries realism text; the check and the confirm carry each linked finding its entry as cli' do
      plugged
      early = []
      early << response.body
      bootstrap_scenario
      early << response.body
      get game_path('room/server_room'), as: :json
      early << response.body
      swept
      early << response.body
      ops_scan(FOOT, host_id: 'file_server')
      early << response.body
      early << network_view(FOOT).to_json
      LINKS.each_value { |id| entry = BreakEscape::RealismCatalog.lookup(id); early.each { |t| refute_includes t, entry['title'], "#{id} before the check" } }
      early.each do |t|
        refute_includes t, '"realism"'
        LINKS.values.each { |id| refute_includes t, id }
      end
      body = ops_check(FOOT, host_id: 'file_server', service: 'storage')
      by = body['findings'].to_h { |f| [f['id'], f] }
      assert_equal LINKS.keys.sort, by.keys.sort
      LINKS.each do |finding, entry_id|
        entry = BreakEscape::RealismCatalog.lookup(entry_id)
        assert_equal CLI_KEYS.to_h { |k| [k, entry[k]] }, by[finding]['cli'], "check answer, #{finding}"
        assert_equal 'unconfirmed', by[finding]['status']
        refute_includes by[finding].to_json, '"realism"'
      end
      assert_equal CLI_KEYS, by[RELEASE]['cli'].keys, 'the decoy has the same cli keys'
    end

    # ---- T6: confirm ---------------------------------------------------------------------------------

    test 'T6: confirming settles two real and one false, the false one says why' do
      confirm_all
      list = view_hosts(FOOT).find { |h| h['id'] == 'file_server' }['findings']
      status = list.to_h { |f| [f['id'], f['status']] }
      assert_equal({ UPDATE => 'confirmed', LINK => 'confirmed', RELEASE => 'false' }, status)
      assert_equal 'The build number is only a label. The service was updated last month.', list.find { |f| f['id'] == RELEASE }['falseBecause']
    end

    # ---- T7: both technique sessions ---------------------------------------------------------------

    test 'T7: the update card gives a user session as Zainab by technique; the settings card needs it and then gives Graham as admin' do
      confirm_all
      give_card('card_update_gap', 'Technique card: known update gap', 'update')
      give_card('card_open_settings', 'Technique card: left-open settings', 'tool roll', container: 'zainab_tool_roll')
      refused = ops_technique(FOOT, LINK, 'card_open_settings')
      assert_response :unprocessable_entity, refused.to_s
      assert_equal 'need_unmet', refused['reason']
      body = ops_technique(FOOT, UPDATE, 'card_update_gap')
      assert_response :success, body.to_s
      assert_equal 'session', body['grant']
      assert_equal 'zainab_hussain', body['session']['npcId']
      assert_equal 'technique', body['session']['via']
      body = ops_technique(FOOT, LINK, 'card_open_settings')
      assert_response :success, body.to_s
      assert_equal 'graham_whitfield', body['session']['npcId']
      assert_equal 'technique', body['session']['via']
      assert_equal 'admin', fresh.session_access('file_server')
    end

    # ---- T9: the relay ----------------------------------------------------------------------------

    test 'T9: Graham hands over his assist code; the code opens his PC as a relay session, admin because he is; ending the global ends it' do
      build
      bootstrap_scenario
      post game_path('inventory'), params: { action_type: 'add', source_npc_id: 'graham_whitfield',
                                             item: { type: 'text_file', id: 'graham_assist_code', name: 'Remote assist code' } }, as: :json
      assert_response :success, response.body
      assert_includes held_ids, 'graham_assist_code'
      assert row('graham_assist')
      post game_path('login'), params: { pc_id: 'graham_pc', credential: 'graham_assist', relay: true }, as: :json
      assert response.parsed_body['success'], response.body
      assert state['sessions']['graham_pc']['relay']
      assert_equal 'admin', fresh.session_access('graham_pc')
      sync_globals('graham_assist_ended' => true)
      assert_nil state['sessions']['graham_pc'], 'the invite is over'
      assert_nil fresh.session_access('graham_pc')
    end

    # ---- T10: the token runs out ---------------------------------------------------------------------

    test 'T10: after six minutes the token row is expired with no routes, a sign-in with it is refused, and the held session ends' do
      plugged
      token_in
      assert_response :success, response.body
      travel 359.seconds
      refute row('zainab_token')['expired']
      travel 2.seconds
      token = row('zainab_token')
      assert_equal true, token['expired']
      assert_empty Array(token['routes'])
      body = token_in
      assert_response :unprocessable_entity
      assert_equal({ 'success' => false, 'expired' => true }, body)
      before = state.slice('sessions', 'footholds')
      row('zainab_token')
      assert_equal before, state.slice('sessions', 'footholds'), 'a read writes nothing'
    end

    # ---- the way back: the spare port's separate clock --------------------------------------------

    test 'the spare token has its own clock, starting only when the box goes in at the spare port; moving the box takes the first row away' do
      plugged
      travel 7.minutes
      assert_equal true, row('zainab_token')['expired']
      assert_nil row('zainab_token_spare'), 'the spare row is not listed while its foothold is not held'
      unplug(RACK)
      assert_response :success, response.body
      add_item('pc', 'kit_dropbox', 'Network drop box')
      body = plant(SPARE)
      assert_response :success, response.body
      assert_equal true, body['success']
      assert_equal (T0 + 7.minutes).to_f, state['credentialClock']['zainab_token_spare']
      assert_equal T0.to_f, state['credentialClock']['zainab_token'], 'the first clock is not restarted'
      spare = row('zainab_token_spare')
      assert spare
      refute spare['expired']
      assert_nil row('zainab_token'), 'the first token is not listed once its foothold is gone'
      body = token_in('zainab_token_spare', SPARE_FOOT)
      assert_response :success, response.body
      assert body['success'], body.to_s
    end

    # ---- T12: the unplug ---------------------------------------------------------------------------

    test 'T12: both unplug mappings need the console done, so moving the box to the spare port cannot tick it' do
      maps = scenario['rooms'].values.flat_map { |r| Array(r['npcs']) }.flat_map { |n| Array(n['eventMappings']) }
      unplugs = maps.select { |x| x['eventPattern'].to_s.start_with?('network_device_unplugged:') }
      assert_equal %w[network_device_unplugged:rack_jack network_device_unplugged:spare_jack], unplugs.map { |x| x['eventPattern'] }.sort
      unplugs.each { |x| assert_includes x['condition'], 'globalVars.needs_console_done === true', x['eventPattern'] }
    end

    test 'T12: the unplug ends every session through the box and names the token session among them' do
      plugged
      token_in
      assert_response :success, response.body
      body = unplug(RACK)
      assert_response :success, response.body
      assert_includes body['endedPcIds'], 'backup_pc'
      assert_empty state['footholds'].to_h
      assert_empty state['sessions'].to_h
    end

    # ---- a whole run, every answer through the leak scanner --------------------------------------------

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
      take_rec('pc', 'kit_dropbox', 'Network drop box')
      take_rec('pc', 'kit_keys', 'Keystroke device')
      plant(RACK)
      rec
      swept
      rec
      keyring
      rec
      token_in
      rec
      implant
      rec
      ops_scan(FOOT, host_id: 'file_server')
      rec
      ops_check(FOOT, host_id: 'file_server', service: 'storage')
      rec
      network_view(FOOT)
      rec
      LINKS.each_key do |id|
        ops_confirm(FOOT, id)
        rec
      end
      take_rec('technique_card', 'card_update_gap', 'Technique card: known update gap', npc: 'zainab_hussain')
      take_rec('technique_card', 'card_open_settings', 'Technique card: left-open settings', container: 'zainab_tool_roll')
      ops_technique(FOOT, LINK, 'card_open_settings')
      rec
      ops_technique(FOOT, UPDATE, 'card_update_gap')
      rec
      ops_technique(FOOT, LINK, 'card_open_settings')
      rec
      network_view(FOOT)
      rec
      take_rec('text_file', 'graham_assist_code', 'Remote assist code', npc: 'graham_whitfield')
      keyring
      rec
      post game_path('login'), params: { pc_id: 'graham_pc', credential: 'graham_assist', relay: true }, as: :json
      rec
      get game_path('container/graham_pc'), params: { relay: 1 }, as: :json
      rec
      sync_globals('graham_assist_ended' => true)
      rec
      travel 7.minutes
      keyring
      rec
      @recorded
    end

    test 'the whole played run reports nothing to the leak scanner' do
      play_whole_run
      assert_operator @recorded.length, :>, 20
      lines = @recorded.each_with_index.map { |r, i| ['run.jsonl', i + 1, r] }
      # The recorder writes no login tag and none is added here. Both sign-ins are remote (the token and the relay), so each
      # answer names its PC by its host label and the scanner places it from that; a `signins:` entry would go unused.
      logins = @recorded.select { |r| r['method'] == 'POST' && r['path'].end_with?('/login') }
      assert_equal %w[BACKUP-PC IT-PC], logins.map { |r| r['body']['host'] }
      scanner = AccessLeakScanner.new(scenario, game: fresh)
      found = scanner.scan(lines).map { |f| [f.line, f.rule, f.owner, f.route] }
      assert_equal [], found
      assert_equal [], scanner.unused_entries
      raw = @recorded.to_json
      [ZAINAB.last, GRAHAM.last, 'Fernwick-Chi-3047'].each { |text| refute_includes raw, text }
      LINKS.values.each { |id| refute_includes raw, id }
    end
  end
end
