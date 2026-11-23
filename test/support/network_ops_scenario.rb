require_relative 'network_model_scenario'

# The ops core S1 fixture (OPS_CORE_PLAN.md 11.2): the pivot fixture with office_lan and
# server_net as discovery networks, services on some sign-in hosts, two devices on office_lan, an
# open workshop_lan with a host that has services, and a log source taking the scan events. Built
# in Ruby, not a scenario folder (the validator keeps N13 "not built" until step 5).
module NetworkOpsScenario
  NS = NetworkModelScenario
  OFFICE = 'jack_comms_port'.freeze
  BENCH = 'jack_bench_port'.freeze
  PRODUCT_SECRET = 'Quillfeather'.freeze
  VERSION_SECRET = '7.7.3-q'.freeze
  SERVICE_LABEL = 'Quill intranet'.freeze
  DEVICE_NAME = 'Quill print server'.freeze
  OPS_SOURCE = { 'ops' => { 'title' => 'Ops', 'events' => %w[network_swept host_scanned service_checked finding_confirmed] } }.freeze
  # The S2 fixture's invented strings (findings): summaries, reasons, labels and the global's name.
  WEB = 'sam_pc.web'.freeze
  FACTORY = "#{WEB}.factory_login".freeze
  OLD_BANNER = "#{WEB}.old_banner".freeze
  OPEN_LISTING = "#{WEB}.open_listing".freeze
  SIDE_ENTRY = "#{WEB}.side_entry".freeze
  SPOOL = 'print_srv.queue.spool_default'.freeze
  LAB_OPEN = 'lab_box.web.lab_open'.freeze
  FACTORY_SUMMARY = 'The admin page still accepts the factory account.'.freeze
  BANNER_SUMMARY = 'The page reports an old build number.'.freeze
  BANNER_FALSE = 'The build number is cosmetic. The panel was updated last month.'.freeze
  NOTES_LABEL = 'Any office notes'.freeze
  DOOR_LABEL = 'The side door is propped open'.freeze
  DOOR_GLOBAL = 'side_door_propped'.freeze
  PATCHED_GLOBAL = 'panel_patched'.freeze
  MANUAL_NAME = 'Panel installer sheet'.freeze
  LENA_LABEL = 'Lena finance login'.freeze

  module_function

  def service(name, port, label: nil)
    svc = { 'name' => name, 'port' => port, 'product' => "#{PRODUCT_SECRET} #{name}", 'version' => VERSION_SECRET }
    svc['label'] = label if label
    svc
  end

  def scenario(logged: true, discovery: 'scan', pivot_discovery: 'scan')
    data = NS.with_pivot
    data['networks']['office_lan']['discovery'] = discovery if discovery
    data['networks']['server_net']['discovery'] = pivot_discovery if pivot_discovery
    data['logSources'] = OPS_SOURCE.deep_dup if logged
    objects = ->(room) { data['rooms'][room]['objects'] }
    objects.call('desk_room').find { |o| o['id'] == 'sam_pc' }['services'] = [service('web', 80, label: SERVICE_LABEL), service('files', 445)]
    objects.call('server_room').find { |o| o['id'] == 'sv_fs02' }['services'] = [service('backup', 873)]
    objects.call('workshop').find { |o| o['id'] == 'bench_pc' }['services'] = [service('web', 80)]
    data['hosts'] = {
      'print_srv' => { 'name' => DEVICE_NAME, 'network' => 'office_lan', 'sprite' => 'printer', 'services' => [service('queue', 631)] },
      'lab_box' => { 'name' => 'Lab box', 'network' => 'office_lan', 'offWhen' => 'lab_off', 'services' => [service('web', 8080)] },
      'cam_one' => { 'name' => 'Lobby camera', 'network' => 'office_lan', 'offWhen' => 'cam_off' },
      'plain_cam' => { 'name' => 'Corridor camera', 'network' => 'office_lan' },
      'sv_dev' => { 'name' => 'Server device', 'network' => 'server_net', 'services' => [service('mgmt', 22)] }
    }
    data
  end

  def weak(id, klass, severity, extra = {})
    { 'id' => id, 'class' => klass, 'severity' => severity }.merge(extra)
  end

  # The S2 fixture: the S1 scenario plus findings. sam_pc's web service holds three weaknesses and a
  # decoy (needs of every kind, and a fixedIf), its files service holds none; print_srv's queue holds
  # one weakness that is only a fixedIf (so a patched game checks it to nothing); lab_box (powered
  # down by lab_off) holds one. `patched` sets the starting value of the fixedIf global.
  def findings_scenario(patched: false, **options)
    data = scenario(**options)
    data['globalVariables'] = (data['globalVariables'] || {}).merge(PATCHED_GLOBAL => patched, DOOR_GLOBAL => false)
    data['credentials'] = { 'lena_login' => { 'kind' => 'password', 'account' => 'lena', 'label' => LENA_LABEL, 'foundIn' => 'lena_local',
                                              'proof' => { 'session' => 'lena_pc' } } }
    objects = ->(room) { data['rooms'][room]['objects'] }
    objects.call('lobby').push({ 'id' => 'panel_sheet', 'type' => 'notes', 'name' => MANUAL_NAME, 'takeable' => true, 'text' => 'Panel sheet.' },
                               { 'id' => 'loose_notes', 'type' => 'notes', 'name' => 'Loose notes', 'takeable' => true, 'text' => 'Loose.' })
    web = objects.call('desk_room').find { |o| o['id'] == 'sam_pc' }['services'].find { |svc| svc['name'] == 'web' }
    web['weaknesses'] = [
      weak('side_entry', 'weak_auth', 'medium', 'summary' => 'The side entry relies on a door being left open.',
                                                'needs' => { 'global' => DOOR_GLOBAL, 'label' => DOOR_LABEL }),
      weak('factory_login', 'default_creds', 'high', 'summary' => FACTORY_SUMMARY,
                                                     'needs' => { 'credential' => 'lena_login', 'item' => 'panel_sheet' },
                                                     'fixedIf' => PATCHED_GLOBAL),
      weak('open_listing', 'misconfig', 'low', 'needs' => { 'itemType' => 'notes', 'label' => NOTES_LABEL })
    ]
    web['decoys'] = [{ 'id' => 'old_banner', 'class' => 'unpatched', 'severity' => 'medium', 'summary' => BANNER_SUMMARY,
                       'falseBecause' => BANNER_FALSE }]
    data['hosts']['print_srv']['services'].first['weaknesses'] = [weak('spool_default', 'default_creds', 'low', 'fixedIf' => PATCHED_GLOBAL)]
    data['hosts']['lab_box']['services'].first['weaknesses'] = [weak('lab_open', 'misconfig', 'low')]
    data
  end

  # The S3 fixture (OPS_CORE_PLAN.md 4.3 and 5.4): the S2 fixture's world plus a card registry, cards
  # in the lobby, grants and a second jack on office_lan. sam_pc's web, files and mail services (product "Quillfeather
  # web" on web, version 7.7.3-q; at most four weaknesses a service) hold one weakness per refusal and grant; print_srv's queue grants a
  # credential; lab_box (off by lab_off) has a credential grant of its own.
  TECH_EVENTS = %w[network_swept host_scanned service_checked finding_confirmed technique_refused technique_used].freeze
  WEB_PRODUCT = "#{PRODUCT_SECRET} web".freeze
  SECOND_JACK = 'jack_server_port'.freeze
  TECH_CARDS = {
    'card_factory' => 'factory_accounts', 'card_factory_b' => 'factory_accounts', 'card_build' => 'build_flaw',
    'card_wrongprod' => 'other_product', 'card_wrongver' => 'other_version', 'card_listing' => 'listing_flaw',
    'card_ghost' => 'no_such_technique'
  }.freeze

  def sam_grant(access = 'user')
    { 'session' => { 'account' => 'sam', 'access' => access } }
  end

  def techniques_scenario(**options)
    data = findings_scenario(**options)
    data['logSources'] = { 'ops' => { 'title' => 'Ops', 'events' => TECH_EVENTS } } unless options[:logged] == false
    data['globalVariables'] = data['globalVariables'].merge('lab_off' => false)
    data['techniques'] = {
      'factory_accounts' => { 'name' => 'Factory accounts', 'summary' => 'Devices often ship with a published account.',
                              'worksOn' => { 'class' => 'default_creds' } },
      'build_flaw' => { 'name' => 'Build flaw', 'worksOn' => { 'class' => 'unpatched', 'product' => WEB_PRODUCT, 'versions' => [VERSION_SECRET] } },
      'other_product' => { 'name' => 'Other product', 'worksOn' => { 'class' => 'unpatched', 'product' => 'Elsewhere web' } },
      'other_version' => { 'name' => 'Other version', 'worksOn' => { 'class' => 'unpatched', 'product' => WEB_PRODUCT, 'versions' => ['1.0'] } },
      'listing_flaw' => { 'name' => 'Listing flaw', 'worksOn' => { 'class' => 'misconfig' } },
      'unheld_flaw' => { 'name' => 'Unheld flaw', 'worksOn' => { 'class' => 'weak_auth' } }
    }
    cards = TECH_CARDS.map do |id, technique|
      { 'id' => id, 'type' => 'technique_card', 'name' => "Field note #{id}", 'technique_card' => technique, 'takeable' => true }
    end
    lobby = data['rooms']['lobby']['objects']
    lobby.push(*cards)
    lobby << NetworkModelScenario::DROP_BOX.merge('id' => 'kit_dropbox_2', 'name' => 'Spare drop box')
    data['credentials']['print_admin'] = { 'kind' => 'saved_connection', 'account' => 'ian', 'connectsTo' => 'sv_fs02', 'label' => 'Print admin',
                                           'proof' => { 'technique_card' => SPOOL } }
    data['credentials']['lab_admin'] = { 'kind' => 'saved_connection', 'account' => 'ian', 'connectsTo' => 'sv_fs02', 'label' => 'Lab admin',
                                         'proof' => { 'technique_card' => LAB_OPEN } }
    sam = data['rooms']['desk_room']['objects'].find { |o| o['id'] == 'sam_pc' }['services']
    sam << service('mail', 25)
    web, files, mail = %w[web files mail].map { |name| sam.find { |svc| svc['name'] == name } }
    web['weaknesses'] = [
      weak('factory_login', 'default_creds', 'high', 'grants' => sam_grant),
      weak('old_build', 'unpatched', 'medium', 'grants' => sam_grant),
      weak('quiet_leak', 'misconfig', 'low'),
      weak('patched_one', 'default_creds', 'low', 'grants' => sam_grant, 'fixedIf' => PATCHED_GLOBAL)
    ]
    files['weaknesses'] = [
      weak('gated', 'default_creds', 'low', 'grants' => sam_grant, 'needs' => { 'global' => DOOR_GLOBAL, 'label' => DOOR_LABEL }),
      weak('step_up', 'default_creds', 'high', 'grants' => sam_grant('admin'), 'needs' => { 'session' => 'user' }),
      weak('step_admin', 'default_creds', 'high', 'grants' => sam_grant('admin'), 'needs' => { 'session' => 'admin' }),
      weak('needy', 'default_creds', 'low', 'grants' => sam_grant,
                                            'needs' => { 'credential' => 'lena_login', 'item' => 'panel_sheet' })
    ]
    mail['weaknesses'] = [
      weak('sheet_gated', 'default_creds', 'low', 'grants' => sam_grant, 'needs' => { 'item' => 'panel_sheet' }),
      weak('raw_one', 'default_creds', 'low', 'grants' => sam_grant)
    ]
    web['decoys'] = [{ 'id' => 'old_banner', 'class' => 'default_creds', 'severity' => 'low', 'falseBecause' => BANNER_FALSE }]
    data['hosts']['print_srv']['services'].first['weaknesses'] = [weak('spool_default', 'default_creds', 'low', 'grants' => { 'credential' => 'print_admin' })]
    data['hosts']['lab_box']['services'].first['weaknesses'] = [weak('lab_open', 'default_creds', 'low', 'grants' => { 'credential' => 'lab_admin' })]
    data
  end

  # The S3 fixture with a host beyond the pivot (security review R1 T6, T7): sv_fs02 on server_net, which
  # no foothold reaches by itself, gets an admin service with one weakness that grants a session as Ian.
  # A technique session there is reached through a session at another PC (lena_pc).
  PIVOT_FINDING = 'sv_fs02.admin.default_admin'.freeze

  def pivot_techniques_scenario(**options)
    data = techniques_scenario(**options)
    sv = data['rooms']['server_room']['objects'].find { |o| o['id'] == 'sv_fs02' }
    sv['services'] = [service('admin', 8443)]
    sv['services'].first['weaknesses'] = [weak('default_admin', 'default_creds', 'low', 'grants' => { 'session' => { 'account' => 'ian', 'access' => 'user' } })]
    sv['contents'] = [{ 'id' => 'sv_local', 'type' => 'text_file', 'name' => 'ops.txt', 'takeable' => false, 'text' => 'SV-LOCAL-TEXT' }]
    data
  end

  # The S3 fixture with an NPC borrow a controller test can drive (security review R1 F1, R2 N-T1): sam_pc has no owner
  # (the route's `performable?` refuses a borrow of an owned PC), and Ian, an account holder who leaves the screen open,
  # borrows it as his first workaround. A hand-over is seeded by the test (borrow_handed_state).
  def borrow_techniques_scenario(**options)
    data = techniques_scenario(**options)
    sam_pc = data['rooms']['desk_room']['objects'].find { |o| o['id'] == 'sam_pc' }
    sam_pc.delete('owner')
    ian = data['rooms']['lobby']['npcs'].find { |n| n['id'] == 'ian' }
    ian['workarounds'] = [{ 'at' => 40, 'do' => 'borrow_session', 'pc' => 'sam_pc' }]
    ian['habits'] = { 'screen' => { 'lockChance' => 0 } }
    data
  end

  # The player_state keys that make Ian's first workaround handed over long enough ago for the route to accept its "done".
  def borrow_handed_state
    { 'encounteredNPCs' => %w[ian],
      'npcFrustration' => { 'ian' => { 'level' => 0, 'hands' => 1, 'turn' => 0, 'done' => [], 'lockedOut' => [], 'failAt' => {}, 'failWhy' => {},
                                       'easeAt' => {}, 'lastSpent' => {},
                                       'handed' => { '0' => { 'hand' => 1, 'time' => Time.current.to_f - 600, 'need' => 'work' } } } } }
  end

  CLI_FIXTURE = File.expand_path('../fixtures/files/network_ops_cli.json', __dir__)
  CLI_STRINGS = %w[10.20.0.0/24 10.20.0.15 10.20.0.21 10.20.0.1 10.20.0.77 10.20.0.40 10.30.0.0/28 10.30.0.2 10.30.0.9 192.168.7.5
                   SVC-BANNER-TEXT BANNER-ONLY-TEXT BENCH-BANNER-TEXT].freeze
  CLI_NOTES = %w[RANGE-NOTE-TEXT RANGE-OTHER-TEXT ADDR-NOTE-TEXT ADDR-OTHER-TEXT SVC-NOTE-TEXT SVC-OTHER-TEXT].freeze

  # The scenario with the test-only `cli` objects of the fixture file merged in (the schema does
  # not declare `cli` until the skin plan), by path: network cli objects, and service cli objects
  # of a sign-in object or a `hosts` entry by host id and service name.
  def with_cli(data, overlay = JSON.parse(File.read(CLI_FIXTURE)))
    overlay['networks'].each { |id, net| data['networks'][id]['cli'] = net['cli'] }
    objects = data['rooms'].values.flat_map { |room| room['objects'] || [] }
    overlay['serviceCli'].each do |host_id, services|
      host = objects.find { |o| o['id'] == host_id } || data['hosts'][host_id]
      services.each { |name, cli| host['services'].find { |svc| svc['name'] == name }['cli'] = cli }
    end
    data
  end
end

# Requests the ops controller tests share (beside NetworkRequests and Engine.routes.url_helpers).
module NetworkOpsRequests
  include NetworkRequests

  def ops_scenario(**options)
    NetworkOpsScenario.scenario(**options)
  end

  def ops_cli_scenario(**options)
    NetworkOpsScenario.with_cli(NetworkOpsScenario.scenario(**options))
  end

  def build_ops_game(player_state = {}, data = ops_scenario)
    build_network_game(player_state, data)
  end

  def ops_scan(foothold, network_id: nil, host_id: nil)
    params = {}
    params[:foothold] = foothold unless foothold.nil?
    params[:network_id] = network_id unless network_id.nil?
    params[:host_id] = host_id unless host_id.nil?
    post game_path('network/scan'), params: params, as: :json
    response.parsed_body
  end

  def ops_rows
    BreakEscape::Game.find(@game.id).log_rows_for('ops')
  end

  def ops_state
    BreakEscape::Game.find(@game.id).player_state
  end

  # Plants the drop box at the office jack: the foothold is OFFICE.
  def hold_office_foothold(player_state = {}, data = ops_scenario)
    build_ops_game(player_state, data)
    take_drop_box
    plant('comms_port')
    assert_response :success, response.body
  end

  # A session at lena_pc through the office foothold opens server_net.
  def pivot_through_lena
    sign_in('lena_pc', 'lfox', NetworkModelScenario::LENA_PASSWORD, foothold: NetworkOpsScenario::OFFICE)
    assert_response :success
  end

  def ops_findings_scenario(**options)
    NetworkOpsScenario.findings_scenario(**options)
  end

  def ops_check(foothold, host_id: nil, service: nil)
    params = {}
    params[:foothold] = foothold unless foothold.nil?
    params[:host_id] = host_id unless host_id.nil?
    params[:service] = service unless service.nil?
    post game_path('network/check'), params: params, as: :json
    response.parsed_body
  end

  def ops_confirm(foothold, finding_id)
    params = {}
    params[:foothold] = foothold unless foothold.nil?
    params[:finding_id] = finding_id unless finding_id.nil?
    post game_path('network/confirm'), params: params, as: :json
    response.parsed_body
  end

  # Sweeps office_lan and scans the given hosts (all through the office foothold).
  def sweep_and_scan(*host_ids)
    ops_scan(NetworkOpsScenario::OFFICE, network_id: 'office_lan')
    host_ids.each { |id| ops_scan(NetworkOpsScenario::OFFICE, host_id: id) }
  end

  def findings_game(patched: false, state: {})
    hold_office_foothold(state, NetworkOpsScenario.findings_scenario(patched: patched))
  end

  def set_global(name, value)
    game = BreakEscape::Game.find(@game.id)
    game.player_state['globalVariables'] = (game.player_state['globalVariables'] || {}).merge(name => value)
    game.save!
  end

  def ops_technique(foothold, finding_id, item_id)
    params = {}
    params[:foothold] = foothold unless foothold.nil?
    params[:finding_id] = finding_id unless finding_id.nil?
    params[:item_id] = item_id unless item_id.nil?
    post game_path('network/technique'), params: params, as: :json
    response.parsed_body
  end

  def card_entry(id, **extra)
    { 'id' => id, 'type' => 'technique_card', 'name' => "Field note #{id}", 'takeable' => true }.merge(extra.transform_keys(&:to_s))
  end

  # A game on the S3 fixture: the office foothold (and the second jack when `second`), the cards
  # given held, every finding on sam_pc, print_srv and lab_box checked, all confirmed but `raw_one`.
  def techniques_game(cards: %w[card_factory], state: {}, second: false, data: NetworkOpsScenario.techniques_scenario)
    inventory = cards.map { |id| card_entry(id) }
    state = { 'inventory' => inventory, 'unlockedRooms' => NetworkRequests::OPEN_ROOMS + %w[server_room] }.merge(state)
    hold_office_foothold(state, data)
    if second
      add_item('pc', 'kit_dropbox_2', 'Spare drop box')
      plant('server_port')
      assert_response :success, response.body
    end
    sweep_and_scan('sam_pc', 'print_srv', 'lab_box')
    %w[web files mail].each { |name| ops_check(NetworkOpsScenario::OFFICE, host_id: 'sam_pc', service: name) }
    ops_check(NetworkOpsScenario::OFFICE, host_id: 'print_srv', service: 'queue')
    ops_check(NetworkOpsScenario::OFFICE, host_id: 'lab_box', service: 'web')
    ops_state['opsFindings'].each_key do |id|
      ops_confirm(NetworkOpsScenario::OFFICE, id) unless id.end_with?('.raw_one')
    end
  end

  # The findings listed on a host's row of the office view, or nil when the row has no `findings` key.
  def row_findings(host_id)
    view_hosts.find { |h| h['id'] == host_id }&.[]('findings')
  end

  # The row for an id in a view entry's hosts.
  def view_hosts(foothold = NetworkOpsScenario::OFFICE)
    network_view(foothold)['footholds'].find { |f| f['id'] == foothold }['hosts']
  end

  def view_blocks(foothold = NetworkOpsScenario::OFFICE)
    network_view(foothold)['footholds'].find { |f| f['id'] == foothold }['networks']
  end
end
