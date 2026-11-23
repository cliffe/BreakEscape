require 'test_helper'
require_relative '../../support/network_ops_scenario'

module BreakEscape
  # Ops core S3 (OPS_CORE_PLAN.md 11.4, the `test_ops_access` beats): the real
  # scenarios/test_ops_access/scenario.json.erb driven through the routes, each assertion read from a
  # re-read game or a fresh answer. The in-browser part (the Techniques panel, the remote-view frame,
  # the marks) is PLAYTEST.md's. Forged state and hostile requests are the hostile tests' job
  # (network_technique_hostile_test, network_ops_state_delta_test); only the plan's beat 10 requests
  # (a foothold that holds no session, a folder with no route, a card not held) are repeated here.
  class OpsAccessScenarioTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests

    SCENARIO_PATH = File.expand_path('../../../scenarios/test_ops_access/scenario.json.erb', __dir__)
    OFFICE = 'jack_office_port'.freeze
    ANNEX = 'jack_annex_port'.freeze
    NOT_FOUND = { 'success' => false, 'reason' => 'not_found' }.freeze
    PRINTER = 'printer01.admin_page.factory_login'.freeze
    BANNER = 'printer01.admin_page.old_banner'.freeze
    SHARE = 'files01.files.open_share'.freeze
    SPARE = 'files01.backup.backup_list'.freeze
    DESK = 'desk01.remote_desk.shipped_login'.freeze
    FIRST = 'vault01.archive.old_release'.freeze
    SECOND = 'vault01.archive.old_release_admin'.freeze
    ALL_FINDINGS = [PRINTER, BANNER, SHARE, SPARE, DESK, FIRST, SECOND].freeze
    CHECKS = [%w[printer01 admin_page], %w[files01 files], %w[files01 backup], %w[vault01 archive], %w[desk01 remote_desk]].freeze
    CARDS = {
      'card_factory' => ['Field note: factory accounts', 'lobby_cabinet'],
      'card_config' => ['Field note: reviewing settings', 'supply_drawer'],
      'card_older' => ['Field note: storage updates (earlier)', 'supply_drawer'],
      'card_release' => ['Field note: storage updates', nil]
    }.freeze
    AUDIT = 'access_audit'.freeze

    def scenario
      JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
    end

    def build(player_state = {})
      build_network_game({ 'unlockedRooms' => %w[lobby comms_room supply_room back_office],
                           'encounteredNPCs' => %w[ian] }.merge(player_state), scenario)
    end

    def fresh
      Game.find(@game.id)
    end

    def state
      fresh.player_state
    end

    def audit(event = nil)
      rows = fresh.log_rows_for(AUDIT)
      event ? rows.select { |r| r['event'] == event } : rows
    end

    def session_at(pc_id)
      state['sessions']&.[](pc_id)
    end

    # The cabinet is opened as the client does (an unlock of method `unlocked`), then the card taken.
    def take_card(id)
      name, container = CARDS.fetch(id)
      unlock_object(container, 'unlocked') if container
      assert_response :success, response.body if container
      add_item('technique_card', id, name)
      assert_response :success, response.body
      assert_includes held_ids, id
    end

    def take_manual
      unlock_object('supply_cupboard', 'unlocked')
      assert_response :success, response.body
      add_item('notes1', 'printer_manual', 'Printer manual')
      assert_response :success, response.body
    end

    def plant_at(jack)
      add_item('pc', 'kit_dropbox', 'Network drop box') unless held_ids.include?('kit_dropbox')
      body = plant(jack)
      assert_response :success, response.body
      body
    end

    def check(host, service, foothold: OFFICE)
      ops_check(foothold, host_id: host, service: service)
    end

    # Plants at the office port, sweeps, scans and checks every service that has a finding.
    def surveyed
      build
      plant_at('office_port')
      ops_scan(OFFICE, network_id: 'office_lan')
      %w[printer01 files01 vault01 desk01].each { |h| ops_scan(OFFICE, host_id: h) }
      CHECKS.each { |host, service| check(host, service) }
    end

    def confirmed
      surveyed
      ALL_FINDINGS.each { |id| ops_confirm(OFFICE, id) }
    end

    def use(finding, card, foothold: OFFICE)
      ops_technique(foothold, finding, card)
    end

    def refused(finding, card, reason, status: :unprocessable_entity, foothold: OFFICE)
      body = use(finding, card, foothold: foothold)
      assert_response status, response.body
      assert_equal false, body['success']
      assert_equal reason, body['reason']
      body
    end

    def granted(finding, card, foothold: OFFICE)
      body = use(finding, card, foothold: foothold)
      assert_response :success, response.body
      assert_equal true, body['success']
      body
    end

    def desktop(pc, foothold: nil)
      get game_path("container/#{pc}"), params: foothold ? { foothold: foothold } : {}, as: :json
      response.parsed_body
    end

    def hosts(foothold = OFFICE)
      view_hosts(foothold)
    end

    def host_row(id, foothold = OFFICE)
      hosts(foothold).find { |h| h['id'] == id }
    end

    def findings
      hosts.flat_map { |h| h['findings'] || [] }
    end

    # ---- the scenario -----------------------------------------------------------------------------

    test 'the scenario has two networks, the registry, seven findings and cards carried by three routes' do
      build
      data = fresh.scenario_data
      assert_equal %w[office_lan plant_lan], data['networks'].keys.sort
      assert_equal %w[config_review factory_accounts older_release_notes release_notes], data['techniques'].keys.sort
      assert_equal [AUDIT], data['logSources'].keys
      assert_equal({}, state['opsUsed'].to_h)
      model = NetworkModel.weaknesses(data)
      assert_equal (ALL_FINDINGS - [BANNER]).sort, model.map { |w| w[:finding_id] }.sort
      assert_equal [BANNER], NetworkModel.decoys(data).map { |d| d[:finding_id] }
      assert_equal [SPARE], model.reject { |w| w[:entry]['grants'] }.map { |w| w[:finding_id] }
      assert_equal %w[container container container npc].sort, NetworkModel.technique_items(data).map { |i| i[:home] }.sort
      jacks = data['rooms']['lobby']['objects'].select { |o| o['networkJack'] }.map { |o| o['id'] }
      assert_equal %w[annex_port office_port], jacks.sort
    end

    test 'before a check the view lists no finding and the sweep and scans name no card or grant' do
      build
      plant_at('office_port')
      bodies = [ops_scan(OFFICE, network_id: 'office_lan').to_s]
      bodies << ops_scan(OFFICE, host_id: 'vault01').to_s
      bodies << network_view(OFFICE).to_s
      bodies << bootstrap_scenario.to_s
      bodies.each do |raw|
        (%w[grants fixedIf technique_card factory_accounts release_notes old_release shipped_login print_admin] +
         ['still accepts the account', 'behind its published fixes']).each { |text| refute_includes raw, text }
      end
      assert_equal [], findings
      refute network_view(OFFICE).key?('techniques')
    end

    # ---- beat 1: the findings, the one card held so far ----------------------------------------------

    test 'beat 1: seven findings all unconfirmed; the Techniques map holds only the card held, with its works-on' do
      surveyed
      assert_equal ALL_FINDINGS.sort, findings.map { |f| f['id'] }.sort
      assert_equal ['unconfirmed'], findings.map { |f| f['status'] }.uniq
      refute network_view(OFFICE).key?('techniques'), 'no card held, no techniques key'
      take_card('card_factory')
      cards = network_view(OFFICE)['techniques']
      assert_equal %w[factory_accounts], cards.keys
      assert_equal({ 'name' => 'Factory accounts', 'summary' => 'Devices often ship with a published account that nobody changes.',
                     'worksOn' => { 'class' => 'default_creds' }, 'itemId' => 'card_factory' }, cards['factory_accounts'])
      assert_equal 5, audit('service_checked').length
      assert_equal 1, audit('network_swept').length
      assert_empty audit('technique_refused') + audit('technique_used')
    end

    # ---- beats 2 and 3: refusals before and after the confirms ----------------------------------------

    test 'beat 2: a card on an unconfirmed finding is refused not_confirmed; one row; nothing else changes' do
      surveyed
      take_card('card_factory')
      before = state.except('log', 'logs', 'ops_log')
      body = refused(PRINTER, 'card_factory', 'not_confirmed')
      assert_equal %w[reason success], body.keys.sort
      rows = audit('technique_refused')
      assert_equal 1, rows.length
      assert_equal 'not_confirmed', rows.first['detail']['reason']
      assert_equal 'factory_accounts', rows.first['detail']['technique']
      assert_nil state['opsUsed']&.first
      assert_nil session_at('printer01')
      assert_equal before['sessions'], state['sessions']
      assert_equal before['inventory'], state['inventory']
    end

    test 'beat 3: confirming all seven writes seven rows; the printer decoy then answers false_positive' do
      confirmed
      assert_equal 7, audit('finding_confirmed').length
      statuses = findings.to_h { |f| [f['id'], f['status']] }
      assert_equal 'false', statuses[BANNER]
      assert_equal 'confirmed', statuses[PRINTER]
      assert_equal 6, statuses.values.count('confirmed')
      step = findings.find { |f| f['id'] == SECOND }
      assert_equal [{ 'kind' => 'session', 'label' => 'VAULT01', 'met' => false }], step['needs']
      take_card('card_factory')
      refused(BANNER, 'card_factory', 'false_positive')
      assert_equal %w[false_positive], audit('technique_refused').map { |r| r['detail']['reason'] }
    end

    # ---- beat 4: the drawer's cards and the wrong ones --------------------------------------------------

    test 'beat 4: the drawer cards are refused on the vault first weakness, wrong_class then wrong_version' do
      confirmed
      take_card('card_config')
      take_card('card_older')
      refused(FIRST, 'card_config', 'wrong_class')
      refused(FIRST, 'card_older', 'wrong_version')
      assert_equal %w[wrong_class wrong_version], audit('technique_refused').map { |r| r['detail']['reason'] }.sort
      assert_nil session_at('vault01')
      cards = network_view(OFFICE)['techniques']
      assert_equal %w[config_review older_release_notes], cards.keys.sort
      assert_equal({ 'class' => 'unpatched', 'product' => 'Brackley ShareServe', 'versions' => ['2.4'] }, cards['older_release_notes']['worksOn'])
    end

    # ---- beats 5 and 5a ---------------------------------------------------------------------------------

    test 'beat 5: the factory card on the printer without the manual is need_unmet, naming the manual' do
      confirmed
      take_card('card_factory')
      body = refused(PRINTER, 'card_factory', 'need_unmet')
      assert_equal({ 'kind' => 'item', 'label' => 'Printer manual' }, body['need'])
      assert_equal 1, audit('technique_refused').length
      get game_path('keyring'), as: :json
      refute_includes response.parsed_body['entries'].map { |e| e['id'] }, 'print_admin'
    end

    test 'beat 5a: every held card on the spare finding is no_grant, one row per card, a repeat merged' do
      confirmed
      %w[card_factory card_config card_older card_release].each { |id| take_card(id) }
      %w[card_factory card_config card_older card_release].each { |id| refused(SPARE, id, 'no_grant') }
      refused(SPARE, 'card_factory', 'no_grant')
      rows = audit('technique_refused')
      assert_equal 4, rows.length, 'one row per card; the repeat merged into the first'
      assert_equal %w[config_review factory_accounts older_release_notes release_notes], rows.map { |r| r['detail']['technique'] }.sort
      assert_equal [1, 1, 1, 2], rows.map { |r| r['n'] || 1 }.sort
      assert_empty audit('technique_used')
      assert_equal({}, state['sessions'].to_h)
    end

    # ---- beat 6 and 7: the credential grant and the saved connection -----------------------------------

    test 'beat 6: with the manual the card grants the saved connection; the repeat answers already; the keyring gains its entry' do
      confirmed
      take_card('card_factory')
      get game_path('keyring'), as: :json
      before = response.parsed_body['entries'].map { |e| e['id'] }
      refute_includes before, 'print_admin'
      refused(PRINTER, 'card_factory', 'need_unmet')
      take_manual
      body = granted(PRINTER, 'card_factory')
      assert_equal({ 'success' => true, 'grant' => 'credential', 'keyringChanged' => true }, body)
      again = granted(PRINTER, 'card_factory')
      assert_equal({ 'success' => true, 'already' => true, 'grant' => 'credential', 'keyringChanged' => false }, again)
      assert_equal [PRINTER], state['opsUsed']
      get game_path('keyring'), as: :json
      assert_includes response.parsed_body['entries'].map { |e| e['id'] }, 'print_admin'
      used = audit('technique_used')
      assert_equal 1, used.length
      assert_equal 2, used.first['n']
      assert_equal 'credential', used.first['detail']['grant']
      assert_equal 1, audit('technique_refused').length
    end

    test 'beat 7: the saved connection opens the file server desktop as a credential session through the foothold' do
      confirmed
      take_card('card_factory')
      take_manual
      granted(PRINTER, 'card_factory')
      post game_path('login'), params: { pc_id: 'files01', credential: 'print_admin', foothold: OFFICE }, as: :json
      assert_response :success, response.body
      record = session_at('files01')
      assert_equal 'credential', record['via']
      assert_equal OFFICE, record['foothold']
      assert_equal 'ian', record['id']
      desktop('files01', foothold: OFFICE)
      assert_response :success, response.body
    end

    test 'beat 8: remote sign-in to the vault server is refused' do
      confirmed
      sign_in('vault01', 'iokafor', 'Dockyard-Ian-41', foothold: OFFICE)
      assert_response :unprocessable_entity
      assert_equal true, response.parsed_body['remoteBlocked']
      assert_nil session_at('vault01')
      assert_empty audit('technique_used')
    end

    # ---- beats 9 to 11: the blocked host --------------------------------------------------------------

    def vault_session
      confirmed
      take_card('card_release')
      granted(FIRST, 'card_release')
    end

    test 'beat 9: the product card opens the vault session through its own foothold, with the bolt and no access key' do
      confirmed
      take_card('card_release')
      body = granted(FIRST, 'card_release')
      assert_equal 'session', body['grant']
      assert_equal 'technique', body['session']['via']
      assert_equal true, body['session']['remote']
      assert_equal OFFICE, body['session']['footholdId']
      assert_equal 'VAULT01', body['session']['host']
      assert_nil body['session']['access'], 'a user session carries no access key'
      assert_equal({ 'id' => 'ian', 'via' => 'technique', 'foothold' => OFFICE, 'access' => 'user', 'technique' => FIRST }, session_at('vault01'))
      assert_includes state['signedInPcs'], 'vault01'
      assert_equal [FIRST], state['opsUsed']
      used = audit('technique_used')
      assert_equal 1, used.length
      assert_equal 'iokafor', used.first['as']['account']
      assert_equal 'release_notes', used.first['detail']['technique']
      row = host_row('vault01')
      assert_equal false, row['remoteSignIn']
      assert_equal true, row['session']['openHere']
      assert_equal 'technique', row['session']['via']
      assert_nil row['session']['access']
      desktop('vault01', foothold: OFFICE)
      assert_response :success, response.body
      assert_equal 'technique', session_at('vault01')['via'], 'serving the desktop keeps the record'
    end

    test 'beat 9a: a repeat of the use shows no second session' do
      vault_session
      again = granted(FIRST, 'card_release')
      assert_equal true, again['already']
      assert_equal 1, audit('technique_used').length
      assert_equal 2, audit('technique_used').first['n']
      assert_equal [FIRST], state['opsUsed']
    end

    test 'beat 10: through a second foothold the vault row has no session and no Open; its desktop is refused; a card not held and forged state change nothing' do
      vault_session
      add_item('pc', 'kit_dropbox_2', 'Spare drop box') unless held_ids.include?('kit_dropbox_2')
      plant('annex_port')
      assert_response :success, response.body
      row = host_row('vault01', ANNEX)
      assert_equal false, row['remoteSignIn']
      assert_nil row['session']
      assert_nil row['heldAs']
      desktop('vault01', foothold: ANNEX)
      assert_response :forbidden
      assert_equal 'unreachable', response.parsed_body['reason']
      # (The folder refusal of the plan's beat 10 needs a folder on the blocked host; this scenario's vault has none,
      # so the 403 `unreachable` for a folder with no route is network_technique_blocked_host_test's, on its fixture.)
      assert_equal NOT_FOUND, use(FIRST, 'card_not_held')
      assert_response :not_found
      before = state.slice('sessions', 'opsUsed', 'opsFindings', 'inventory')
      put game_path('sync_state'), params: { opsUsed: ['x'], opsFindings: { 'x' => 'c1' }, sessions: { vault01: { id: 'ian', via: 'technique' } } }, as: :json
      assert_response :success, 'the sync is accepted and the server-owned keys in it are dropped'
      assert_equal before, state.slice('sessions', 'opsUsed', 'opsFindings', 'inventory')
      assert_equal 1, audit('technique_used').length
    end

    test 'beat 10a: the desk grant marks the desk PC, serves its desktop through the foothold and the no-route request as the account' do
      confirmed
      take_card('card_factory')
      body = granted(DESK, 'card_factory')
      assert_equal 'DESK01', body['session']['host']
      assert_equal OFFICE, session_at('desk01')['foothold']
      assert_equal 'technique', session_at('desk01')['via']
      row = host_row('desk01')
      assert_nil row['session']['openHere'], 'the host allows remote sign-in: a plain remote view, not openHere'
      desktop('desk01', foothold: OFFICE)
      assert_response :success, response.body
      assert_equal OFFICE, session_at('desk01')['foothold'], 'the foothold is kept after the open'
      keyboard = desktop('desk01')
      assert_response :success, response.body
      assert_equal 'ian', keyboard.dig('session', 'npcId'), 'the no-route request is served as the account of the technique session'
      assert_equal 'technique', keyboard.dig('session', 'via')
      assert_equal OFFICE, session_at('desk01')['foothold'], 'the keyboard desktop keeps it too'
      assert_equal 'ian', session_at('desk01')['id']
    end

    test 'beat 11: the step-up needs the user session, then the same card replaces the record with admin, same foothold' do
      confirmed
      take_card('card_release')
      refused(SECOND, 'card_release', 'need_unmet')
      granted(FIRST, 'card_release')
      body = granted(SECOND, 'card_release')
      assert_equal 'admin', body['session']['access']
      assert_equal({ 'id' => 'ian', 'via' => 'technique', 'foothold' => OFFICE, 'access' => 'admin', 'technique' => SECOND }, session_at('vault01'))
      assert_equal 1, state['sessions'].size
      assert_equal 'admin', audit('technique_used').last['detail']['access']
      assert_equal 'admin', host_row('vault01')['session']['access']
    end

    test 'beat 12: the session on a PC of office_lan opens the plant network block, which can be swept' do
      confirmed
      take_card('card_release')
      granted(FIRST, 'card_release')
      blocks = view_blocks(OFFICE)
      plant = blocks.find { |b| b['id'] == 'plant_lan' }
      refute_nil plant, 'plant_lan appears in the view'
      assert_equal 'vault01', plant['via']['hostId']
      body = ops_scan(OFFICE, network_id: 'plant_lan')
      assert_response :success, response.body
      assert_equal true, body['success']
      assert_includes state['opsDiscovered']['networks'], 'plant_lan'
      listed = view_blocks(OFFICE).find { |b| b['id'] == 'plant_lan' }['hosts'].map { |h| h['id'] }
      assert_equal %w[pumpctl01], listed
    end

    test 'beat 13: the technique session cannot be locked' do
      vault_session
      before = session_at('vault01').dup
      post game_path('lock_session'), params: { pc_id: 'vault01' }, as: :json
      assert_response :unprocessable_entity
      assert_equal before, session_at('vault01')
    end

    test 'beat 14: a reload serves the sessions, findings, cards and keyring as before, and the admin level' do
      confirmed
      take_card('card_release')
      take_card('card_factory')
      take_manual
      granted(PRINTER, 'card_factory')
      granted(FIRST, 'card_release')
      granted(SECOND, 'card_release')
      before_rows = findings.map { |f| f.slice('id', 'alias', 'status') }
      aliases = before_rows.to_h { |f| [f['id'], f['alias']] }
      boot = bootstrap_scenario
      mirror = boot['sessions']['vault01']
      assert_equal 'admin', mirror['access']
      assert_equal 'technique', mirror['via'], 'the reloaded mirror says how the session was got'
      assert_equal OFFICE, mirror['footholdId']
      assert_equal 'VAULT01', mirror['host']
      assert_equal before_rows, findings.map { |f| f.slice('id', 'alias', 'status') }, 'findings keep their aliases and statuses across the reload'
      assert_equal ALL_FINDINGS.to_h { |id| [id, aliases[id]] }, findings.to_h { |f| [f['id'], f['alias']] }
      assert_equal %w[factory_accounts release_notes], network_view(OFFICE)['techniques'].keys.sort
      assert_equal ALL_FINDINGS.sort, findings.map { |f| f['id'] }.sort
      assert_equal %w[confirmed false], findings.map { |f| f['status'] }.uniq.sort
      get game_path('keyring'), as: :json
      assert_includes response.parsed_body['entries'].map { |e| e['id'] }, 'print_admin'
      assert_equal [PRINTER, FIRST, SECOND], state['opsUsed']
    end

    # ---- beat 15: the switch -------------------------------------------------------------------------

    test 'beat 15: after the switch the files finding is fixed, the spare no_grant, and the vault session still opens' do
      confirmed
      take_card('card_release')
      take_card('card_config')
      granted(FIRST, 'card_release')
      set_global('share_locked', true)
      refused(SHARE, 'card_config', 'fixed')
      refused(SPARE, 'card_release', 'no_grant')
      fixed_rows = findings.select { |f| f['fixed'] == true }.map { |f| f['id'] }
      assert_equal [SHARE, SPARE].sort, fixed_rows.sort, 'the switch shows the files finding and the spare Fixed'
      assert_equal [], findings.select { |f| f['id'] == FIRST }.select { |f| f['fixed'] }, 'the vault finding is not fixed by it'
      assert_equal %w[fixed no_grant], audit('technique_refused').map { |r| r['detail']['reason'] }.sort
      assert_equal 2, audit('technique_refused').length
      desktop('vault01', foothold: OFFICE)
      assert_response :success, response.body
    end

    test 'before the switch the files grant is a session as the named account' do
      confirmed
      take_card('card_config')
      body = granted(SHARE, 'card_config')
      assert_equal 'FILES01', body['session']['host']
      assert_equal 'technique', session_at('files01')['via']
      assert_equal false, host_row('files01')['session'].key?('openHere'), 'files01 allows remote sign-in'
    end

    # ---- beat 16: the unplug --------------------------------------------------------------------------

    test 'beat 16: unplugging ends the sessions, drops the plant network and answers no_session; opsUsed and the keyring stay' do
      confirmed
      take_card('card_release')
      take_card('card_factory')
      take_manual
      granted(PRINTER, 'card_factory')
      granted(FIRST, 'card_release')
      granted(DESK, 'card_factory')
      ops_scan(OFFICE, network_id: 'plant_lan')
      assert_includes view_blocks(OFFICE).map { |b| b['id'] }, 'plant_lan'
      ended = unplug('office_port')
      assert_response :success, response.body
      assert_equal %w[desk01 vault01], Array(ended['endedPcIds']).sort, 'the technique sessions end with the foothold'
      assert_nil session_at('vault01')
      assert_nil session_at('desk01')
      assert_nil session_at('files01')
      get game_path('network'), params: { foothold: OFFICE }, as: :json
      assert_response :not_found, 'the dropped foothold has no view, so no plant network'
      desktop('vault01', foothold: OFFICE)
      assert_response :forbidden
      assert_equal 'no_session', response.parsed_body['reason']
      assert_equal [PRINTER, FIRST, DESK].sort, state['opsUsed'].sort
      get game_path('keyring'), as: :json
      assert_includes response.parsed_body['entries'].map { |e| e['id'] }, 'print_admin'
    end

    test 'beat 17: planted again, the same card on the first weakness gives a new session record' do
      confirmed
      take_card('card_release')
      granted(FIRST, 'card_release')
      unplug('office_port')
      assert_nil session_at('vault01')
      plant_at('office_port')
      body = granted(FIRST, 'card_release')
      assert_nil body['already'], 'the session had ended, so this is a fresh grant'
      assert_equal 'technique', session_at('vault01')['via']
      assert_equal OFFICE, session_at('vault01')['foothold']
    end

    # ---- beat 17a: sign out, the typed sign-in, the implant -----------------------------------------------

    test 'beat 17a: sign out clears the technique session; the typed sign-in is a password session; the implant then lands' do
      confirmed
      take_card('card_factory')
      granted(DESK, 'card_factory')
      post game_path('logout'), params: { pc_id: 'desk01' }, as: :json
      assert_response :success, response.body
      assert_nil session_at('desk01')
      sign_in('desk01', 'iokafor', 'Dockyard-Ian-41')
      assert_response :success, response.body
      assert_equal 'password', session_at('desk01')['via']
      assert_nil session_at('desk01')['foothold']
      add_item('pc', 'desk_implant', 'Keystroke injector')
      post game_path('network/implant'), params: { pc_id: 'desk01', shape: 'session' }, as: :json
      assert_response :success, response.body
      assert_equal 'implant_desk01', response.parsed_body['foothold']['id']
      assert_equal 'implant', state['footholds']['implant_desk01']['via']
      assert_equal 'password', session_at('desk01')['via']
    end

    test 'beat 17a: with a technique session at the desk the implant is refused and the device kept' do
      confirmed
      take_card('card_factory')
      granted(DESK, 'card_factory')
      add_item('pc', 'desk_implant', 'Keystroke injector')
      post game_path('network/implant'), params: { pc_id: 'desk01', shape: 'session' }, as: :json
      assert_response :unprocessable_entity
      assert_includes held_ids, 'desk_implant'
    end

    # ---- the end of the run ----------------------------------------------------------------------------

    test 'beat 18: the answer at full discovery is under 16 KB and the logs hold no stored secret' do
      confirmed
      %w[card_factory card_release card_config card_older].each { |id| take_card(id) }
      take_manual
      granted(PRINTER, 'card_factory')
      granted(FIRST, 'card_release')
      granted(SECOND, 'card_release')
      ops_scan(OFFICE, network_id: 'plant_lan')
      get game_path('network'), params: { foothold: OFFICE }, as: :json
      assert_response :success, response.body
      assert_operator response.body.bytesize, :<, 16 * 1024
      rows = fresh.log_rows_for(AUDIT).to_json
      %w[Dockyard-Ian-41 print_admin grants fixedIf].each { |text| refute_includes rows, text }
    end
  end
end
