# The scripts behind the ops_unchanged fixtures (see OpsGolden and lib/tasks/ops_unchanged.rake).
# Each case builds the fixture minus "expected"; the capture run plays it on the code as it stands
# and writes the answers and state beside it. To add a fixture, add a case here.
require_relative 'access_model_scenario'
require_relative 'access_social_scenario'
require_relative 'ops_golden'

module OpsUnchangedCases
  JAKE_CARD_ID = AccessModelScenario::JAKE_CARD['card_id']
  EXEC_CARD_ID = AccessModelScenario::EXEC_CARD['card_id']
  POWER_CARD_ID = AccessModelScenario::POWER_CARD['card_id']

  module_function

  def all
    { 'log_unlock_refusals' => log_unlock_refusals, 'log_container_cases' => log_container_cases }
      .merge(core_network_cases)
      .merge(privilege_cases)
      .merge(mfa_cases)
  end

  def step(id, method, path, params = nil)
    { 'id' => id, 'method' => method, 'path' => path, 'params' => params }.compact
  end

  def unlock(id, type, target, method, extra = {})
    step(id, 'POST', 'unlock', { 'targetType' => type, 'targetId' => target, 'method' => method }.merge(extra))
  end

  def login(id, username, password, pc_id = 'jake_pc')
    step(id, 'POST', 'login', { 'pc_id' => pc_id, 'username' => username, 'password' => password })
  end

  def keycard_item(id)
    card = AccessModelScenario.routes_scenario['rooms']['lobby']['objects'].find { |o| o['id'] == id }
    card.slice('id', 'type', 'name', 'card_id', 'rfid_protocol', 'takeable')
  end

  def base(name, description, steps, player_state = {})
    {
      'name' => name, 'description' => description, 'clock' => OpsGolden::DEFAULT_CLOCK,
      'scenario' => AccessModelScenario.routes_scenario,
      'playerState' => { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby finance],
                         'encounteredNPCs' => %w[len jake dana exec imran gary] }.merge(player_state),
      'steps' => steps
    }
  end

  # POST /unlock over the access model suite's refusal and success cases (pin, rfid doors and
  # objects, password-less login objects), then the sign-in refusals of POST /login.
  def log_unlock_refusals
    base('log_unlock_refusals',
         'Answers of /unlock and the /login refusals over the access model suite cases, captured before the ops log edits.',
         [step('bootstrap', 'GET', 'scenario'),
          unlock('vault_pin_wrong', 'door', 'vault', 'pin', 'attempt' => '0000'),
          unlock('vault_pin_wrong_again', 'door', 'vault', 'pin', 'attempt' => '1111'),
          unlock('records_no_cards', 'door', 'records', 'rfid'),
          unlock('records_wrong_card', 'door', 'records', 'rfid', 'card_ids' => [EXEC_CARD_ID]),
          unlock('records_held_card', 'door', 'records', 'rfid', 'card_ids' => [JAKE_CARD_ID]),
          unlock('records_again_open', 'door', 'records', 'rfid', 'card_ids' => [EXEC_CARD_ID]),
          unlock('mixed_visitor', 'door', 'mixed', 'rfid', 'card_ids' => ['VISITOR-07']),
          unlock('exec_suite_refused', 'door', 'exec_suite', 'rfid', 'card_ids' => [JAKE_CARD_ID]),
          unlock('plant_room_refused', 'door', 'plant_room', 'rfid', 'card_ids' => [POWER_CARD_ID]),
          unlock('cabinet_finance_card', 'object', 'finance_cabinet', 'rfid', 'card_ids' => [JAKE_CARD_ID]),
          unlock('lobby_safe_wrong', 'object', 'lobby_safe', 'pin', 'attempt' => '0000'),
          unlock('lobby_safe_right', 'object', 'lobby_safe', 'pin', 'attempt' => '1111'),
          unlock('unknown_object', 'object', 'no_such_object', 'pin', 'attempt' => '1'),
          unlock('vault_pin_right', 'door', 'vault', 'pin', 'attempt' => '9999'),
          login('login_wrong_password', 'jbrooks', 'nope'),
          login('login_not_permitted', 'jbrooks', AccessModelScenario::JAKE_PASSWORD, 'it_pc'),
          login('login_wrong_2', 'jbrooks', 'nope'),
          login('login_wrong_3', 'jbrooks', 'nope'),
          login('login_wrong_4', 'jbrooks', 'nope'),
          login('login_wrong_5', 'jbrooks', 'nope'),
          login('login_locked_out', 'jbrooks', AccessModelScenario::JAKE_PASSWORD),
          step('bootstrap_after', 'GET', 'scenario')],
         'currentRoom' => 'finance',
         'inventory' => [keycard_item('jake_spare'), keycard_item('visitor_badge')])
  end

  # GET /container over the access model suite's container cases: locked and unlocked safes, a
  # sign-in PC before and after a session, a folder in a profile, an invented id.
  def log_container_cases
    base('log_container_cases',
         'Answers of GET /container over the access model suite cases, captured before the ops log edits.',
         [step('bootstrap', 'GET', 'scenario'),
          step('pc_before_login', 'GET', 'container/jake_pc'),
          step('cabinet_locked', 'GET', 'container/finance_cabinet'),
          step('lobby_safe_locked', 'GET', 'container/lobby_safe'),
          step('invented_id', 'GET', 'container/no_such_container'),
          step('missing_object_share', 'GET', 'container/jake_archive'),
          login('login_jake', 'jbrooks', AccessModelScenario::JAKE_PASSWORD),
          step('pc_after_login', 'GET', 'container/jake_pc'),
          step('profile_folder_locked', 'GET', 'container/jake_archive'),
          step('profile_file', 'GET', 'container/jake_budget'),
          step('profile_pc_no_session', 'GET', 'container/profile_pc'),
          step('vault_pc_unreachable', 'GET', 'container/vault_pc'),
          unlock('lobby_safe_right', 'object', 'lobby_safe', 'pin', 'attempt' => '1111'),
          step('lobby_safe_open', 'GET', 'container/lobby_safe'),
          step('bootstrap_after', 'GET', 'scenario')],
         'currentRoom' => 'finance')
  end

  # ---- Ops core plan, section 10 part 1: golden answers for the scenarios that declare networks ----
  #
  # One fixture per scenario, "core_<scenario>". The script is derived from the scenario at capture
  # time and written into the fixture as plain steps (so replay needs no scenario file and a later
  # edit to the scenario changes nothing recorded): the bootstrap, every room answer, GET /network
  # and GET /keyring with no foothold, then for each foothold the scenario offers (a jack planted,
  # a Wi-Fi access point joined, a declared implant) the foothold's own /network and /keyring
  # views, a remote sign-in at each sign-in PC with a known account and that desktop's GET
  # /container, and an unplug for a jack. The scenario is inlined as rendered at capture.
  CORE_SCENARIOS_DIR = File.expand_path('../../scenarios', __dir__)
  # ca20_* hold a social page list called "networks", not a top-level networks block, but the plan
  # (section 10 part 1) names them, so they are always included (script: bootstrap, rooms, views).
  CORE_NAMED_EXTRA = %w[ca20_remote_and_mobile_working ca20_remote_and_mobile_working_defend].freeze

  def core_scenario_path(name)
    Dir[File.join(CORE_SCENARIOS_DIR, name, 'scenario.json{.erb,}')].min_by { |path| path.end_with?('.erb') ? 0 : 1 }
  end

  def core_render(name)
    path = core_scenario_path(name)
    JSON.parse(BreakEscape::ScenarioBinding.render(File.read(path, encoding: 'UTF-8')))
  end

  # Scenario folders whose top-level "networks" is a map (a `test_ops_*` scenario is built by a later
  # step, so it is never part of the unchanged set).
  def core_network_scenario_names
    found = Dir[File.join(CORE_SCENARIOS_DIR, '*')].filter_map do |dir|
      name = File.basename(dir)
      next if name.start_with?('test_ops_') || !core_scenario_path(name)

      name if core_render(name)['networks'].is_a?(Hash)
    end
    (found | CORE_NAMED_EXTRA).sort
  end

  def core_network_cases
    core_network_scenario_names.to_h { |name| ["core_#{name}", core_network_case(name)] }
  end

  def core_people(scenario)
    people = scenario['rooms'].values.flat_map { |room| room['npcs'] || [] }
    people += Array(scenario['npcs']) + Array(scenario['phoneNPCs'])
    people.select { |npc| npc.is_a?(Hash) && npc['id'] }
  end

  # [username, password] for a sign-in PC: the first person its access lists (people, then role)
  # that has creds. A PC with lockChance is skipped (a random lock would make the answer vary).
  def core_account_for(pc, people)
    return nil if pc['lockChance']

    access = pc['access'].is_a?(Hash) ? pc['access'] : {}
    named = Array(access['people']).filter_map { |id| people.find { |npc| npc['id'] == id } }
    roled = people.select { |npc| Array(access['roles']).include?(npc['role']) }
    owner = (named + roled).find { |npc| npc['creds'].is_a?(Hash) && npc['creds']['password'] }
    owner && owner['creds'].values_at('username', 'password')
  end

  def core_login_pcs(scenario)
    scenario['rooms'].values.flat_map { |room| room['objects'] || [] }
                     .select { |obj| obj['type'] == 'pc' && obj['lockType'] == 'login' && !obj['networkJack'] }
  end

  def core_network_case(name)
    scenario = core_render(name)
    rooms = scenario['rooms'].keys
    people = core_people(scenario)
    devices = BreakEscape::NetworkModel.rogue_device_definitions(scenario).map { |found| found[:item].deep_dup }
    pcs = core_login_pcs(scenario)
    jacks = scenario['rooms'].values.flat_map { |room| room['objects'] || [] }.select { |obj| BreakEscape::NetworkModel.jack?(obj) }
    aps = scenario['rooms'].values.flat_map do |room|
      (room['objects'] || []).select { |obj| obj['wifiAp'] == true }.map { |obj| [obj, BreakEscape::NetworkModel.network_of(obj, room)] }
    end
    grants = scenario['networks'].is_a?(Hash) ? BreakEscape::NetworkModel.grant_foothold_actions(scenario) : []

    steps = [step('bootstrap', 'GET', 'scenario')]
    rooms.each { |room| steps << step("room_#{room}", 'GET', "room/#{room}") }
    steps << step('network_plain', 'GET', 'network')
    steps << step('keyring_plain', 'GET', 'keyring')
    jacks.each do |jack|
      id = jack['id']
      steps << step("plant_#{id}", 'POST', 'network/plant', { 'jack_id' => id })
      core_foothold_steps(steps, "jack_#{id}", pcs, people)
      steps << step("unplug_#{id}", 'POST', 'network/unplug', { 'jack_id' => id })
    end
    aps.each do |ap, network|
      psk = BreakEscape::NetworkModel.wifi_of(scenario, network)&.dig('psk')
      params = { 'ap_id' => ap['id'] }
      params['key'] = psk if psk.is_a?(String) && !psk.empty?
      steps << step("join_#{ap['id']}", 'POST', 'network/join', params)
      core_foothold_steps(steps, "wifi_#{network}", pcs, people)
    end
    grants.each do |action|
      pc = pcs.find { |obj| obj['id'] == action[:pc] }
      account = pc && core_account_for(pc, people)
      steps << login("keyboard_signin_#{action[:pc]}", account[0], account[1], action[:pc]) if action[:shape] == 'session' && account
      steps << step("implant_#{action[:pc]}_#{action[:shape]}", 'POST', 'network/implant', { 'pc_id' => action[:pc], 'shape' => action[:shape] })
      core_foothold_steps(steps, "implant_#{action[:pc]}", pcs, people)
    end
    steps << step('bootstrap_after', 'GET', 'scenario')

    held = devices.first(1)
    held += core_needed_items(scenario, grants)
    {
      'name' => "core_#{name}", 'clock' => OpsGolden::DEFAULT_CLOCK,
      'description' => "Ops core plan section 10 part 1: #{name} through the network routes, captured before any ops-core edit.",
      'scenario' => scenario,
      'playerState' => { 'currentRoom' => scenario['startRoom'], 'unlockedRooms' => rooms,
                         'encounteredNPCs' => people.map { |npc| npc['id'] }, 'inventory' => held,
                         'droppedItems' => grants.filter_map { |a| a[:needs_dropped] }.uniq }.compact,
      'steps' => steps
    }
  end

  # The foothold's own views, then a remote sign-in and desktop at each sign-in PC with an account.
  def core_foothold_steps(steps, foothold, pcs, people)
    steps << step("network_#{foothold}", 'GET', 'network', { 'foothold' => foothold })
    steps << step("keyring_#{foothold}", 'GET', 'keyring', { 'foothold' => foothold })
    pcs.each do |pc|
      account = core_account_for(pc, people)
      next unless account

      steps << step("signin_#{foothold}_#{pc['id']}", 'POST', 'login',
                    { 'pc_id' => pc['id'], 'username' => account[0], 'password' => account[1], 'foothold' => foothold })
      steps << step("desktop_#{foothold}_#{pc['id']}", 'GET', "container/#{pc['id']}", { 'foothold' => foothold })
    end
  end

  # Held items a declared implant asks for (needsHeld names an id, type or name), as the scenario defines them.
  def core_needed_items(scenario, grants)
    wanted = grants.filter_map { |action| action[:needs_held].presence }
    return [] if wanted.empty?

    found = []
    walk = lambda do |node|
      case node
      when Hash
        found << node.deep_dup if node['id'] && node['type'] && node['type'] != 'pc' && (wanted & [node['id'], node['type'], node['name']].compact.map(&:to_s)).any?
        node.each_value { |v| walk.call(v) }
      when Array then node.each { |v| walk.call(v) }
      end
    end
    walk.call(scenario['rooms'])
    walk.call(scenario['startItemsInInventory'])
    found.uniq { |item| item['id'] }
  end

  # ---- Privilege and accounts plan (S5a), unit 01: golden answers for what a session can do ----
  #
  # One fixture per scenario, "privilege_<scenario>", captured from the code as it stood BEFORE any
  # S5a engine edit (first capture, not a re-record). They pin what S5a must leave alone: sign-in,
  # lock and unlock, Switch user, keyring (credential) sign-in, a borrow "done", a session-shaped
  # implant at a keyboard session, a plant the USB policy allows through inventory `remove`, and
  # GET /container and GET /keyring. Each case holds only what its scenario has.
  # No case puts an implant under a foothold, `from`, relay or technique session (that answer changes by design).
  PRIVILEGE_SCENARIOS = %w[test_access_signin test_access_sessions test_access_keyring test_access_social].freeze

  def privilege_cases
    PRIVILEGE_SCENARIOS.to_h { |name| ["privilege_#{name}", send("privilege_#{name}_case")] }
  end

  def privilege_base(name, description, scenario, steps, player_state = {})
    people = core_people(scenario).map { |npc| npc['id'] }
    {
      'name' => "privilege_#{name}", 'description' => description, 'clock' => OpsGolden::DEFAULT_CLOCK,
      'scenario' => scenario,
      'playerState' => { 'currentRoom' => scenario['startRoom'], 'unlockedRooms' => scenario['rooms'].keys,
                         'encounteredNPCs' => people }.merge(player_state),
      'steps' => steps
    }
  end

  def lock_session_step(id, pc_id)
    step(id, 'POST', 'lock_session', { 'pc_id' => pc_id })
  end

  def logout_step(id, pc_id)
    step(id, 'POST', 'logout', { 'pc_id' => pc_id })
  end

  def container_step(id, object_id)
    step(id, 'GET', "container/#{object_id}")
  end

  # Sign-in beats of the sign-in floor: tiles, typed sign-in, lock and unlock, Switch user, a
  # password archive in a profile, a role-limited PC, sign out.
  def privilege_test_access_signin_case
    sam = %w[sokafor Marmalade-82]
    ian = %w[ishaw Patchday!2026]
    privilege_base(
      'test_access_signin', 'S5a unit 01: sign-in, lock, unlock, Switch user and the desktop through the real routes, before any S5a engine edit.',
      core_render('test_access_signin'),
      [step('bootstrap', 'GET', 'scenario'),
       step('accounts_hot_desk', 'GET', 'login_accounts', { 'pc_id' => 'hot_desk' }),
       login('sam_wrong_password', sam[0], 'nope', 'hot_desk'),
       login('sam_signs_in_hot_desk', sam[0], sam[1], 'hot_desk'),
       container_step('desktop_hot_desk_sam', 'hot_desk'),
       lock_session_step('lock_hot_desk', 'hot_desk'),
       container_step('desktop_hot_desk_locked', 'hot_desk'),
       login('sam_unlocks_hot_desk', sam[0], sam[1], 'hot_desk'),
       login('sam_refused_at_ian_pc', sam[0], sam[1], 'ian_pc'),
       login('ian_signs_in_ian_pc', ian[0], ian[1], 'ian_pc'),
       container_step('desktop_ian_pc', 'ian_pc'),
       login('switch_user_ian_hot_desk', ian[0], ian[1], 'hot_desk'),
       container_step('desktop_hot_desk_ian', 'hot_desk'),
       container_step('archive_locked', 'ian_archive'),
       unlock('archive_wrong_password', 'object', 'ian_archive', 'password', 'attempt' => 'nope'),
       unlock('archive_right_password', 'object', 'ian_archive', 'password', 'attempt' => 'staffarchive24'),
       container_step('archive_open', 'ian_archive'),
       container_step('desktop_known_pc_no_session', 'known_pc'),
       logout_step('sign_out_hot_desk', 'hot_desk'),
       container_step('desktop_hot_desk_after_logout', 'hot_desk'),
       step('bootstrap_after', 'GET', 'scenario')]
    )
  end

  # Owner claims, typed sign-in at an owned PC and at a hot desk, lock and unlock, a profile file, a guest claim refused.
  def privilege_test_access_sessions_case
    privilege_base(
      'test_access_sessions', 'S5a unit 01: owner claim, typed sign-in, lock and unlock and the desktop through the real routes, before any S5a engine edit.',
      core_render('test_access_sessions'),
      [step('bootstrap', 'GET', 'scenario'),
       step('claim_owner_dana', 'POST', 'login', { 'pc_id' => 'dana_pc', 'claim' => 'owner' }),
       container_step('desktop_dana_pc_claimed', 'dana_pc'),
       container_step('profile_file_dana_forecast', 'dana_forecast'),
       login('ian_signs_in_ian_pc', 'ishaw', 'Kettle-Ian-77', 'ian_pc'),
       container_step('desktop_ian_pc', 'ian_pc'),
       lock_session_step('lock_ian_pc', 'ian_pc'),
       container_step('desktop_ian_pc_locked', 'ian_pc'),
       login('ian_unlocks_ian_pc', 'ishaw', 'Kettle-Ian-77', 'ian_pc'),
       login('dana_at_hot_desk', 'dreyes', 'Ledger-Dana-31', 'hot_desk'),
       container_step('desktop_hot_desk_dana', 'hot_desk'),
       login('switch_user_omar_hot_desk', 'ohaddad', 'Pipeline-Omar-14', 'hot_desk'),
       container_step('desktop_hot_desk_omar', 'hot_desk'),
       login('ian_signs_in_dana_pc', 'ishaw', 'Kettle-Ian-77', 'dana_pc'),
       step('claim_guest_none', 'POST', 'login', { 'pc_id' => 'hot_desk', 'claim' => 'guest' }),
       logout_step('sign_out_ian_pc', 'ian_pc'),
       container_step('desktop_ian_pc_after_logout', 'ian_pc'),
       step('bootstrap_after', 'GET', 'scenario')]
    )
  end

  # Sign-in with a typed password, GET /keyring, a session-shaped implant at that keyboard session, then
  # a keyring sign-in through the implant's foothold (a saved connection is never a keyboard sign-in), and a plant the USB policy allows,
  # through inventory `remove` with used_on. The scenario is the shipped one plus two sockets and
  # two devices (below) so the implant and the plant exist; nothing else is added.
  def privilege_test_access_keyring_case
    scenario = core_render('test_access_keyring')
    lobby = scenario['rooms']['lobby']['objects']
    lobby << { 'type' => 'pc', 'id' => 'kit_badusb', 'name' => 'Keystroke injector', 'sprite' => 'drop_box1', 'position' => { 'x' => 6, 'y' => 6 },
               'takeable' => true, 'usbClass' => 'hid', 'observations' => 'A USB device that types on its own once plugged into a PC.' }
    lobby << { 'type' => 'pc', 'id' => 'kit_stick', 'name' => 'Spare USB stick', 'sprite' => 'drop_box1', 'position' => { 'x' => 7, 'y' => 6 },
               'takeable' => true, 'usbClass' => 'storage', 'observations' => 'A spare USB stick.' }
    scenario['rooms']['finance_room']['objects'] << {
      'type' => 'pc', 'id' => 'lena_usb_socket', 'name' => 'USB socket', 'sprite' => 'network_rack1', 'position' => { 'x' => 7, 'y' => 4 },
      'takeable' => false, 'requiresItem' => 'kit_badusb', 'requiresItemHint' => 'You would need a device to plug in here.',
      'observations' => 'A spare USB socket on Lena\'s desk.',
      'triggerOnInteract' => [{ 'type' => 'confirm_action', 'text' => 'Plug it in?', 'confirmLabel' => 'Plug it in', 'cancelLabel' => 'Leave it',
                                'onConfirm' => [{ 'type' => 'grant_foothold', 'pc' => 'lena_pc', 'needsSession' => true, 'needsHeld' => 'kit_badusb' }] }]
    }
    scenario['rooms']['finance_room']['objects'] << {
      'type' => 'pc', 'id' => 'stick_dock', 'name' => 'Stick dock', 'sprite' => 'network_rack1', 'position' => { 'x' => 8, 'y' => 4 },
      'takeable' => false, 'requiresItem' => 'kit_stick', 'requiresItemHint' => 'You would need a stick for this.',
      'observations' => 'A dock that takes a stick.',
      'triggerOnInteract' => [{ 'type' => 'remove_item', 'item' => 'kit_stick' }]
    }
    held = %w[lena_rdp_file kit_badusb kit_stick].map { |id| lobby.find { |o| o['id'] == id }.deep_dup }
    privilege_base(
      'test_access_keyring', 'S5a unit 01: typed and keyring sign-in, GET /keyring, a keyboard implant and an allowed plant through the real routes, before any S5a engine edit.',
      scenario,
      [step('bootstrap', 'GET', 'scenario'),
       step('keyring_plain', 'GET', 'keyring'),
       login('lena_signs_in_typed', 'lfox', 'Ledger-Lena-9', 'lena_pc'),
       container_step('desktop_lena_pc', 'lena_pc'),
       container_step('profile_file_passwords', 'lena_passwords_txt'),
       step('keyring_after_typed_signin', 'GET', 'keyring'),
       lock_session_step('lock_lena_pc', 'lena_pc'),
       container_step('desktop_lena_pc_locked', 'lena_pc'),
       login('lena_unlocks_lena_pc', 'lfox', 'Ledger-Lena-9', 'lena_pc'),
       step('implant_session_lena_pc', 'POST', 'network/implant', { 'pc_id' => 'lena_pc', 'shape' => 'session' }),
       step('implant_again_lena_pc', 'POST', 'network/implant', { 'pc_id' => 'lena_pc', 'shape' => 'session' }),
       logout_step('sign_out_lena_pc', 'lena_pc'),
       step('keyring_signin_wrong_pc', 'POST', 'login', { 'pc_id' => 'ops_pc', 'credential' => 'lena_rdp', 'foothold' => 'implant_lena_pc' }),
       step('keyring_signin_no_route', 'POST', 'login', { 'pc_id' => 'lena_pc', 'credential' => 'lena_rdp' }),
       step('keyring_signin_lena_pc', 'POST', 'login', { 'pc_id' => 'lena_pc', 'credential' => 'lena_rdp', 'foothold' => 'implant_lena_pc' }),
       step('desktop_lena_pc_keyring', 'GET', 'container/lena_pc', { 'foothold' => 'implant_lena_pc' }),
       step('keyring_after_keyring_signin', 'GET', 'keyring', { 'foothold' => 'implant_lena_pc' }),
       step('plant_stick_allowed', 'POST', 'inventory', { 'action_type' => 'remove', 'item' => { 'id' => 'kit_stick' }, 'used_on' => 'stick_dock' }),
       step('plant_stick_again', 'POST', 'inventory', { 'action_type' => 'remove', 'item' => { 'id' => 'kit_stick' }, 'used_on' => 'stick_dock' }),
       step('bootstrap_after', 'GET', 'scenario')],
      'inventory' => held
    )
  end

  # Typed sign-ins at owned PCs, a profile file, lock and unlock, and a borrow "done" (the hand-over
  # is seeded, since the clock is frozen) that leaves a guest session to claim at the kiosk.
  def privilege_test_access_social_case
    handed = { 'level' => 60.0, 'hands' => 1, 'turn' => 1, 'done' => [], 'lastSpent' => {},
               'handed' => { '0' => { 'hand' => 1, 'time' => Time.iso8601(OpsGolden::DEFAULT_CLOCK).to_f, 'need' => 'social_media' } } }
    privilege_base(
      'test_access_social', 'S5a unit 01: typed sign-in, lock and unlock, a borrow done and a guest claim through the real routes, before any S5a engine edit.',
      core_render('test_access_social'),
      [step('bootstrap', 'GET', 'scenario'),
       login('jake_wrong_password', 'jbrooks', 'nope', 'jake_pc'),
       login('jake_signs_in_jake_pc', 'jbrooks', 'Biscuit1998', 'jake_pc'),
       container_step('desktop_jake_pc', 'jake_pc'),
       container_step('profile_file_jake_f5_note', 'jake_f5_note'),
       lock_session_step('lock_jake_pc', 'jake_pc'),
       container_step('desktop_jake_pc_locked', 'jake_pc'),
       login('jake_unlocks_jake_pc', 'jbrooks', 'Biscuit1998', 'jake_pc'),
       login('jake_refused_at_hot_desk_wrong_account', 'ohaddad', 'Stapler-Omar-71', 'hot_desk'),
       login('omar_signs_in_omar_pc', 'ohaddad', 'Stapler-Omar-71', 'omar_pc'),
       step('claim_guest_before_borrow', 'POST', 'login', { 'pc_id' => 'kiosk', 'claim' => 'guest' }),
       step('borrow_done_omar_kiosk', 'POST', 'npc_workaround', { 'npc_id' => 'omar', 'index' => 0, 'hand' => 1, 'cut' => true }),
       step('claim_guest_kiosk', 'POST', 'login', { 'pc_id' => 'kiosk', 'claim' => 'guest' }),
       container_step('desktop_kiosk_guest', 'kiosk'),
       logout_step('sign_out_kiosk', 'kiosk'),
       step('bootstrap_after', 'GET', 'scenario')],
      'npcFrustration' => { 'omar' => handed }
    )
  end

  # ---- Multi-factor sign-in plan (S8a), unit 01: golden answers for the sign-in paths the second step edits ----
  #
  # One fixture per case, "mfa_<name>", captured from `ops-mfa` BEFORE any S8a engine edit (a first
  # capture, not a re-record). The privilege_* and core_* fixtures already pin typed sign-in, lock,
  # unlock, Switch user, keyring sign-in through an implant, and typed sign-in over a jack foothold
  # with a right password. These add: the bootstrap of three scenarios no core_ or privilege_ case
  # bootstraps (signin, ca03_helpdesk_reset, habits); lockout; the `from` route, a wrong password and a
  # saved connection, a foothold and a token over a foothold; the Friendface phone rule; and what the
  # bootstrap, rooms and desktops show of test_access_habits after expand! (the stored scenario is not
  # in the replay's state, so the routes that read it are what pin it).
  def mfa_cases
    {
      'mfa_bootstrap_test_access_signin' => mfa_bootstrap_case('test_access_signin'),
      'mfa_bootstrap_test_access_keyring' => mfa_bootstrap_case('test_access_keyring'),
      'mfa_bootstrap_ca03_helpdesk_reset' => mfa_bootstrap_case('ca03_helpdesk_reset'),
      'mfa_test_access_signin_lockout' => mfa_signin_lockout_case,
      'mfa_test_access_keyring_routes' => mfa_keyring_routes_case,
      'mfa_phone_rule' => mfa_phone_rule_case,
      'mfa_phone_rule_stored_drop' => mfa_phone_rule_stored_drop_case,
      'mfa_test_access_habits_expanded' => mfa_habits_case
    }
  end

  def mfa_base(name, description, scenario, steps, player_state = {})
    people = core_people(scenario).map { |npc| npc['id'] }
    {
      'name' => "mfa_#{name}", 'description' => description, 'clock' => OpsGolden::DEFAULT_CLOCK,
      'scenario' => scenario,
      'playerState' => { 'currentRoom' => scenario['startRoom'], 'unlockedRooms' => scenario['rooms'].keys,
                         'encounteredNPCs' => people }.merge(player_state),
      'steps' => steps
    }
  end

  def mfa_find_object(scenario, id)
    found = nil
    walk = lambda do |node|
      case node
      when Hash
        found ||= node if node['id'] == id && node['type']
        node.each_value { |v| walk.call(v) }
      when Array then node.each { |v| walk.call(v) }
      end
    end
    walk.call(scenario['rooms'])
    found&.deep_dup
  end

  # The bootstrap, every room, GET /keyring, GET /login_accounts at each sign-in PC and the bootstrap again.
  def mfa_bootstrap_case(name)
    scenario = core_render(name)
    steps = [step('bootstrap', 'GET', 'scenario')]
    scenario['rooms'].each_key { |room| steps << step("room_#{room}", 'GET', "room/#{room}") }
    steps << step('keyring_plain', 'GET', 'keyring')
    core_login_pcs(scenario).each { |pc| steps << step("accounts_#{pc['id']}", 'GET', 'login_accounts', { 'pc_id' => pc['id'] }) }
    steps << step('bootstrap_after', 'GET', 'scenario')
    mfa_base("bootstrap_#{name}", "S8a unit 01: the bootstrap, rooms, keyring and sign-in accounts of #{name}, before any S8a engine edit.",
             scenario, steps)
  end

  # Wrong passwords up to the lockout at lockout_pc (policy maxAttempts 5), the locked-out answer for a
  # wrong and for the right password, an invented username, then another account and another PC still signing in.
  def mfa_signin_lockout_case
    sam = %w[sokafor Marmalade-82]
    ian = %w[ishaw Patchday!2026]
    mfa_base(
      'test_access_signin_lockout', 'S8a unit 01: wrong passwords to a lockout, the locked-out answers and a right password after it, before any S8a engine edit.',
      core_render('test_access_signin'),
      [step('bootstrap', 'GET', 'scenario'),
       login('sam_wrong_1', sam[0], 'nope', 'lockout_pc'),
       login('sam_wrong_2', sam[0], 'nope', 'lockout_pc'),
       login('invented_wrong_1', 'nobody', 'nope', 'lockout_pc'),
       login('sam_wrong_3', sam[0], 'nope', 'lockout_pc'),
       login('sam_wrong_4', sam[0], 'nope', 'lockout_pc'),
       login('sam_wrong_5', sam[0], 'nope', 'lockout_pc'),
       login('sam_locked_out_wrong', sam[0], 'nope', 'lockout_pc'),
       login('sam_locked_out_right', sam[0], sam[1], 'lockout_pc'),
       login('sam_locked_out_case_variant', sam[0].upcase, sam[1], 'lockout_pc'),
       login('invented_wrong_2', 'nobody', 'nope', 'lockout_pc'),
       login('invented_wrong_3', 'nobody', 'nope', 'lockout_pc'),
       login('invented_wrong_4', 'nobody', 'nope', 'lockout_pc'),
       login('invented_wrong_5', 'nobody', 'nope', 'lockout_pc'),
       login('invented_locked_out', 'nobody', 'nope', 'lockout_pc'),
       login('ian_signs_in_lockout_pc', ian[0], ian[1], 'lockout_pc'),
       container_step('desktop_lockout_pc_ian', 'lockout_pc'),
       login('sam_signs_in_hot_desk', sam[0], sam[1], 'hot_desk'),
       container_step('desktop_hot_desk_sam', 'hot_desk'),
       step('bootstrap_after', 'GET', 'scenario')]
    )
  end

  # Typed sign-in and saved connections over a foothold and over `from`, wrong and right, plus the
  # refusals of a `from` that is not held. Everything the keyring case does not pin.
  def mfa_keyring_routes_case
    scenario = core_render('test_access_keyring')
    foothold = 'jack_comms_port'
    held = %w[kit_dropbox lena_rdp_file ops_rdp_file].map { |id| mfa_find_object(scenario, id) }
    mfa_base(
      'test_access_keyring_routes', 'S8a unit 01: typed and saved-connection sign-in over a foothold and over `from`, before any S8a engine edit.',
      scenario,
      [step('bootstrap', 'GET', 'scenario'),
       step('plant_comms_port', 'POST', 'network/plant', { 'jack_id' => 'comms_port' }),
       login('foothold_lena_wrong', 'lfox', 'nope', 'lena_pc').tap { |s| s['params']['foothold'] = foothold },
       login('foothold_lena_wrong_2', 'lfox', 'nope', 'lena_pc').tap { |s| s['params']['foothold'] = foothold },
       login('foothold_lena_right', 'lfox', 'Ledger-Lena-9', 'lena_pc').tap { |s| s['params']['foothold'] = foothold },
       container_step('desktop_lena_pc_foothold', 'lena_pc').tap { |s| s['params'] = { 'foothold' => foothold } },
       logout_step('sign_out_lena_pc_1', 'lena_pc'),
       step('foothold_saved_lena_rdp', 'POST', 'login', { 'pc_id' => 'lena_pc', 'credential' => 'lena_rdp', 'foothold' => foothold }),
       logout_step('sign_out_lena_pc_2', 'lena_pc'),
       step('foothold_token_lena', 'POST', 'login', { 'pc_id' => 'lena_pc', 'credential' => 'lena_token', 'foothold' => foothold }),
       step('foothold_ops_rdp_kind_refused', 'POST', 'login', { 'pc_id' => 'ops_pc', 'credential' => 'ops_rdp', 'foothold' => foothold }),
       step('unplug_comms_port', 'POST', 'network/unplug', { 'jack_id' => 'comms_port' }),
       login('from_not_held', 'ishaw', 'Patchday!2026', 'ops_pc').tap { |s| s['params']['from'] = 'lena_pc' },
       login('lena_signs_in_typed', 'lfox', 'Ledger-Lena-9', 'lena_pc'),
       login('from_unknown_pc', 'ishaw', 'Patchday!2026', 'ops_pc').tap { |s| s['params']['from'] = 'no_such_pc' },
       login('from_wrong_password', 'ishaw', 'nope', 'ops_pc').tap { |s| s['params']['from'] = 'lena_pc' },
       login('from_wrong_password_2', 'ishaw', 'nope', 'ops_pc').tap { |s| s['params']['from'] = 'lena_pc' },
       login('from_right_password', 'ishaw', 'Patchday!2026', 'ops_pc').tap { |s| s['params']['from'] = 'lena_pc' },
       container_step('desktop_ops_pc_from', 'ops_pc').tap { |s| s['params'] = { 'from' => 'lena_pc' } },
       logout_step('sign_out_ops_pc_4', 'ops_pc'),
       step('from_saved_ops_rdp', 'POST', 'login', { 'pc_id' => 'ops_pc', 'credential' => 'ops_rdp', 'from' => 'lena_pc' }),
       login('from_remote_blocked_jake_pc', 'jbrooks', 'Vault-Jake-4', 'jake_pc').tap { |s| s['params']['from'] = 'lena_pc' },
       step('from_saved_not_held_proof', 'POST', 'login', { 'pc_id' => 'ops_pc', 'credential' => 'lena_rdp_gift', 'from' => 'lena_pc' }),
       logout_step('sign_out_lena_pc', 'lena_pc'),
       step('from_source_ended', 'POST', 'login', { 'pc_id' => 'ops_pc', 'credential' => 'ops_rdp', 'from' => 'lena_pc' }),
       step('keyring_after', 'GET', 'keyring'),
       step('bootstrap_after', 'GET', 'scenario')],
      'inventory' => held
    )
  end

  PHONE_JAKE = { 'type' => 'phone_friendface', 'id' => 'jake_phone', 'name' => "Jake's phone", 'takeable' => true, 'owner' => 'jake' }.freeze
  PHONE_LENA = { 'type' => 'phone_friendface', 'id' => 'lena_phone', 'name' => "Lena's phone", 'takeable' => true, 'owner' => 'lena' }.freeze
  PHONE_LENA_SENT = { 'type' => 'phone_friendface', 'id' => 'lena_phone', 'name' => "Lena's phone", 'x' => 64, 'y' => 96 }.freeze
  PHONE_STATE = { 'currentRoom' => 'office', 'unlockedRooms' => %w[lobby office], 'encounteredNPCs' => %w[jake lena omar nia] }.freeze

  # The social fixture as test/controllers/break_escape/friendface_phone_test.rb builds it: Jake's story
  # offers his phone, Lena's does not.
  def mfa_phone_scenario
    data = AccessSocialScenario.scenario
    jake = data['rooms']['office']['npcs'].find { |n| n['id'] == 'jake' }
    jake['itemsHeld'] = [PHONE_JAKE.deep_dup]
    jake['eventMappings'] = [{ 'eventPattern' => 'global_variable_changed:lend_phone', 'action' => 'give_item:phone_friendface' }]
    lena = data['rooms']['office']['npcs'].find { |n| n['id'] == 'lena' }
    lena['itemsHeld'] = [PHONE_LENA.deep_dup]
    data
  end

  def phone_add(id, item, extra = {})
    step(id, 'POST', 'inventory', { 'action_type' => 'add', 'item' => item }.merge(extra))
  end

  def phone_room_add(id, item, npc_id = nil, source_type = nil)
    step(id, 'POST', 'update_room',
         { 'roomId' => 'office', 'actionType' => 'add_object', 'sourceNpcId' => npc_id, 'sourceType' => source_type, 'data' => item }.compact)
  end

  def phone_knock_out(id, npc_id)
    step(id, 'POST', 'update_room', { 'roomId' => 'office', 'actionType' => 'update_npc_state',
                                       'data' => { 'npcId' => npc_id, 'stateChanges' => { 'isKO' => true, 'currentHP' => 0 } } })
  end

  def mfa_phone_base(name, description, steps, player_state)
    {
      'name' => "mfa_#{name}", 'description' => description, 'clock' => OpsGolden::DEFAULT_CLOCK,
      'scenario' => mfa_phone_scenario, 'playerState' => PHONE_STATE.deep_dup.merge(player_state), 'steps' => steps
    }
  end

  # Direct add offered and not offered, a room add with no source, an NPC drop with and without a
  # knock-out record, a pickup of a stored NPC drop, and the room bootstrap showing who holds a phone.
  def mfa_phone_rule_case
    sent = PHONE_LENA_SENT.deep_dup
    mfa_phone_base(
      'phone_rule', 'S8a unit 01: the Friendface phone rule (direct add, room add, KO drop, pickup) through the real routes, before any S8a engine edit.',
      [step('bootstrap', 'GET', 'scenario'),
       phone_add('add_lena_not_offered', { 'type' => 'phone_friendface', 'id' => 'lena_phone', 'name' => "Lena's phone" }, 'source_npc_id' => 'lena'),
       phone_add('add_phone_no_source', { 'type' => 'phone_friendface', 'id' => 'minted', 'name' => 'Minted' }),
       phone_add('add_phone_forged_owner', { 'type' => 'phone_friendface', 'id' => 'forged', 'name' => 'Forged', 'owner' => 'lena' }),
       phone_room_add('room_add_no_source', { 'type' => 'phone_friendface', 'id' => 'minted', 'name' => 'Minted', 'takeable' => true }),
       phone_room_add('room_add_lena_not_ko', sent, 'lena'),
       phone_add('add_jake_offered', { 'type' => 'phone_friendface', 'id' => 'jake_phone', 'name' => "Jake's phone" }, 'source_npc_id' => 'jake'),
       step('room_office_after_jake', 'GET', 'room/office'),
       phone_knock_out('knock_out_lena', 'lena'),
       phone_room_add('room_add_lena_ko_drop', sent, 'lena', 'npc_defeated'),
       phone_room_add('room_add_lena_ko_drop_again', sent, 'lena', 'npc_defeated'),
       step('room_office_with_drop', 'GET', 'room/office'),
       phone_add('pickup_lena_drop', { 'type' => 'phone_friendface', 'id' => 'lena_phone', 'name' => "Lena's phone" }, 'source_npc_id' => 'lena'),
       step('room_office_after_pickup', 'GET', 'room/office'),
       step('bootstrap_after', 'GET', 'scenario')],
      {}
    )
  end

  # A stored NPC drop of a phone the NPC never offered (a save made before the check): the pickup is
  # refused until a knock-out record exists, then allowed. And a start with the phone already held.
  def mfa_phone_rule_stored_drop_case
    stored = PHONE_LENA.merge('x' => 64, 'y' => 96)
    mfa_phone_base(
      'phone_rule_stored_drop', 'S8a unit 01: pickup of a stored NPC phone drop, refused then allowed after a knock-out record, before any S8a engine edit.',
      [step('bootstrap', 'GET', 'scenario'),
       phone_add('pickup_stored_unoffered', { 'type' => 'phone_friendface', 'id' => 'lena_phone', 'name' => "Lena's phone" }),
       phone_add('pickup_stored_unoffered_sourced', { 'type' => 'phone_friendface', 'id' => 'lena_phone', 'name' => "Lena's phone" }, 'source_npc_id' => 'lena'),
       phone_knock_out('knock_out_lena', 'lena'),
       phone_add('pickup_stored_after_knock_out', { 'type' => 'phone_friendface', 'id' => 'lena_phone', 'name' => "Lena's phone" }),
       step('room_office_after', 'GET', 'room/office'),
       step('bootstrap_after', 'GET', 'scenario')],
      'room_states' => { 'office' => { 'objects_added' => [stored], 'objects_removed' => [], 'object_states' => {}, 'npc_states' => {} } }
    )
  end

  # test_access_habits after expand!: the stored scenario is read through the bootstrap, every room,
  # and a sign-in then the desktop at each PC whose owner has a known account (expanded habits set the PC's lock behaviour).
  def mfa_habits_case
    scenario = core_render('test_access_habits')
    people = core_people(scenario)
    steps = [step('bootstrap', 'GET', 'scenario')]
    scenario['rooms'].each_key { |room| steps << step("room_#{room}", 'GET', "room/#{room}") }
    core_login_pcs(scenario).each do |pc|
      steps << container_step("desktop_#{pc['id']}_before", pc['id'])
      account = core_account_for(pc, people)
      next unless account

      steps << login("signin_#{pc['id']}", account[0], account[1], pc['id'])
      steps << container_step("desktop_#{pc['id']}_after", pc['id'])
    end
    steps << step('bootstrap_after', 'GET', 'scenario')
    mfa_base('test_access_habits_expanded', 'S8a unit 01: the expanded habits of test_access_habits as the bootstrap, rooms and desktops show them, before any S8a engine edit.',
             scenario, steps)
  end
end
