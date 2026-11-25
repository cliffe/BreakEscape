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
      .merge(lock_cases) # S8c unit 01
      .merge(helpdesk_cases)
      .merge(cracking_cases)
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

  # ---- Second step on any lock plan (S8c), unit 01: golden answers for what a lock step must leave alone ----
  #
  # One fixture per case, "lock_<name>", captured from `ops-lock2` BEFORE any S8c engine edit (a first
  # capture, not a re-record). The log_unlock_refusals, log_container_cases, privilege_* and mfa_*
  # fixtures already pin: pin and rfid (with an access list) doors and objects, an unknown object, a
  # container before and after a pin opens, sign-in PCs and archives under a session. These add what
  # they do not: every other lock type a shipped test scenario has (password, key, combination,
  # cryptex, biometric, bluetooth, ble, rfid with no access list), each with a refusal and an open,
  # for an object and for a door where the scenario has one; GET /container and an inventory take
  # before and after a locked container opens; an `npc` door unlock; the carried-item flows of the
  # three scenarios S8c's carried check touches (test_unlock_gaps, ceo_exfil, test_social_m5_channels);
  # and the bootstrap of each scenario used.
  def lock_cases
    {
      'lock_unlock_gaps_give' => lock_unlock_gaps_give_case,
      'lock_unlock_gaps_ko' => lock_unlock_gaps_ko_case,
      'lock_ceo_exfil_locks' => lock_ceo_exfil_case,
      'lock_ceo_exfil_npc_door' => lock_ceo_exfil_npc_door_case,
      'lock_biometric_breach' => lock_biometric_breach_case,
      'lock_ble_scanner' => lock_ble_scanner_case,
      'lock_rfid_no_list_single' => lock_rfid_no_list_single_case,
      'lock_rfid_no_list_multi' => lock_rfid_no_list_multi_case,
      'lock_m5_channels_terminal' => lock_m5_terminal_case
    }
  end

  def lock_base(name, description, scenario, steps, player_state = {})
    people = core_people(scenario).map { |npc| npc['id'] }
    {
      'name' => "lock_#{name}", 'description' => description, 'clock' => OpsGolden::DEFAULT_CLOCK,
      'scenario' => scenario,
      'playerState' => { 'currentRoom' => scenario['startRoom'], 'unlockedRooms' => [scenario['startRoom']],
                         'encounteredNPCs' => people }.merge(player_state),
      'steps' => steps
    }
  end

  # ---- Helpdesk recovery plan (S8b), unit 01: golden answers for what the helpdesk stage must leave alone ----
  #
  # One fixture per case, "helpdesk_<name>", captured BEFORE any S8b engine edit (a first capture, not a
  # re-record). The core_, privilege_ and mfa_ fixtures already pin typed and saved-connection sign-in
  # (foothold, `from`, implant), lockout followed by the right password, the Friendface phone rule and
  # the bootstrap of the sign-in, keyring, ca03 and habits scenarios. These add only: GET /keyring and
  # /capture_secrets before and after a captured account, the bootstrap of test_ops_mfa, and on
  # test_ops_mfa a right password at a code PC, a push prompt and the phone list.
  def helpdesk_cases
    {
      'helpdesk_test_access_keyring_captured' => helpdesk_keyring_captured_case,
      'helpdesk_bootstrap_test_ops_mfa' => helpdesk_bootstrap_ops_mfa_case,
      'helpdesk_test_ops_mfa_second_step' => helpdesk_ops_mfa_second_step_case
    }
  end

  def helpdesk_base(name, description, scenario, steps, player_state = {})
    people = core_people(scenario).map { |npc| npc['id'] }
    {
      'name' => "helpdesk_#{name}", 'description' => description, 'clock' => OpsGolden::DEFAULT_CLOCK,
      'scenario' => scenario,
      'playerState' => { 'currentRoom' => scenario['startRoom'], 'unlockedRooms' => scenario['rooms'].keys,
                         'encounteredNPCs' => people }.merge(player_state),
      'steps' => steps
    }
  end

  def take_step(id, item, source_npc = nil)
    step(id, 'POST', 'inventory', { 'action_type' => 'add', 'item' => item, 'source_npc_id' => source_npc }.compact)
  end

  def room_steps(scenario)
    scenario['rooms'].keys.map { |room| step("room_#{room}", 'GET', "room/#{room}") }
  end

  # Both held NPC-container routes of test_unlock_gaps: a conversation gives the locked bag.
  def lock_unlock_gaps_give_case
    scenario = core_render('test_unlock_gaps')
    lock_base(
      'unlock_gaps_give', 'S8c unit 01: combination and cryptex locks (objects and doors), a locked start item and an NPC-given locked bag, before any S8c engine edit.',
      scenario,
      [step('bootstrap', 'GET', 'scenario'),
       step('room_lobby', 'GET', 'room/lobby'),
       container_step('start_cryptex_container_locked', 'test_start_cryptex'),
       unlock('start_cryptex_wrong', 'object', 'test_start_cryptex', 'cryptex', 'attempt' => 'WRONGO'),
       unlock('start_cryptex_right', 'object', 'test_start_cryptex', 'cryptex', 'attempt' => 'TINDER'),
       container_step('start_cryptex_container_open', 'test_start_cryptex'),
       take_step('take_start_note', { 'type' => 'notes', 'id' => 'test_start_note', 'name' => 'Pocket Note' }),
       container_step('locker_container_locked', 'test_combo_locker'),
       take_step('take_locker_note_early', { 'type' => 'notes', 'id' => 'test_locker_note', 'name' => 'Locker Note' }),
       unlock('locker_wrong', 'object', 'test_combo_locker', 'combination', 'attempt' => '12-30-6'),
       unlock('locker_wrong_method', 'object', 'test_combo_locker', 'pin', 'attempt' => '12-30-5'),
       unlock('locker_right', 'object', 'test_combo_locker', 'combination', 'attempt' => '12-30-5'),
       unlock('locker_again', 'object', 'test_combo_locker', 'combination', 'attempt' => '0-0-0'),
       container_step('locker_container_open', 'test_combo_locker'),
       take_step('take_locker_note', { 'type' => 'notes', 'id' => 'test_locker_note', 'name' => 'Locker Note' }),
       unlock('cryptex_box_wrong', 'object', 'test_cryptex_box', 'cryptex', 'attempt' => 'NOPE'),
       unlock('cryptex_box_right', 'object', 'test_cryptex_box', 'cryptex', 'attempt' => 'cipher'),
       container_step('cryptex_box_container_open', 'test_cryptex_box'),
       container_step('courier_bag_container_before_give', 'test_courier_bag'),
       unlock('courier_bag_before_give', 'object', 'test_courier_bag', 'password', 'attempt' => 'Satchel42'),
       take_step('give_courier_bag', { 'type' => 'bag1', 'id' => 'test_courier_bag', 'name' => 'Courier Bag' }, 'test_courier'),
       container_step('courier_bag_container_locked', 'test_courier_bag'),
       unlock('courier_bag_wrong', 'object', 'test_courier_bag', 'password', 'attempt' => 'wrong'),
       unlock('courier_bag_right', 'object', 'test_courier_bag', 'password', 'attempt' => 'Satchel42'),
       container_step('courier_bag_container_open', 'test_courier_bag'),
       take_step('take_delivery_memo', { 'type' => 'notes', 'id' => 'test_delivery_memo', 'name' => 'Delivery Memo' }),
       unlock('vault_wrong', 'door', 'vault', 'combination', 'attempt' => '1-2-3'),
       unlock('vault_right', 'door', 'vault', 'combination', 'attempt' => '7-21-39'),
       unlock('archive_wrong', 'door', 'archive', 'cryptex', 'attempt' => 'LOCK'),
       unlock('archive_right', 'door', 'archive', 'cryptex', 'attempt' => 'keys'),
       step('room_vault', 'GET', 'room/vault'),
       step('room_archive', 'GET', 'room/archive'),
       step('bootstrap_after', 'GET', 'scenario')]
    )
  end

  # The same scenario, the courier knocked out and the bag dropped instead of given.
  def lock_unlock_gaps_ko_case
    scenario = core_render('test_unlock_gaps')
    bag = { 'type' => 'bag1', 'id' => 'test_courier_bag', 'name' => 'Courier Bag' }
    lock_base(
      'unlock_gaps_ko', 'S8c unit 01: an NPC-held locked bag dropped by a knock-out, then opened and emptied, before any S8c engine edit.',
      scenario,
      [step('bootstrap', 'GET', 'scenario'),
       step('room_lobby', 'GET', 'room/lobby'),
       container_step('courier_bag_container_held', 'test_courier_bag'),
       unlock('courier_bag_held_right', 'object', 'test_courier_bag', 'password', 'attempt' => 'Satchel42'),
       step('knock_out_courier', 'POST', 'update_room', { 'roomId' => 'lobby', 'actionType' => 'update_npc_state',
                                                         'data' => { 'npcId' => 'test_courier', 'stateChanges' => { 'isKO' => true, 'currentHP' => 0 } } }),
       step('drop_courier_bag', 'POST', 'update_room', { 'roomId' => 'lobby', 'actionType' => 'add_object', 'sourceNpcId' => 'test_courier',
                                                        'sourceType' => 'npc_defeated', 'data' => bag.merge('x' => 64, 'y' => 64) }),
       step('room_lobby_with_drop', 'GET', 'room/lobby'),
       container_step('courier_bag_container_locked', 'test_courier_bag'),
       unlock('courier_bag_wrong', 'object', 'test_courier_bag', 'password', 'attempt' => 'wrong'),
       unlock('courier_bag_right', 'object', 'test_courier_bag', 'password', 'attempt' => 'Satchel42'),
       container_step('courier_bag_container_open', 'test_courier_bag'),
       take_step('pickup_courier_bag', bag, 'test_courier'),
       take_step('take_delivery_memo', { 'type' => 'notes', 'id' => 'test_delivery_memo', 'name' => 'Delivery Memo' }),
       step('bootstrap_after', 'GET', 'scenario')]
    )
  end

  # ceo_exfil: password PC and PIN safe (objects), a Bluetooth tablet (carried, no id: the generated
  # id), key doors and a key box, PIN doors, the keys taken from the rooms, and a wrong method.
  def lock_ceo_exfil_case
    scenario = core_render('ceo_exfil')
    key_of = ->(room, idx) { scenario['rooms'][room]['objects'][idx].slice('type', 'name', 'takeable', 'opens_lock', 'keyPins').merge('id' => "#{room}_key_#{idx}") }
    lock_base(
      'ceo_exfil_locks', 'S8c unit 01: password, pin, key, bluetooth and lockpick locks of ceo_exfil, objects and doors, with the Tablet Device carried, before any S8c engine edit.',
      scenario,
      [step('bootstrap', 'GET', 'scenario'),
       step('room_reception', 'GET', 'room/reception'),
       container_step('pc_container_locked', 'reception_pc_2'),
       unlock('pc_wrong', 'object', 'reception_pc_2', 'password', 'attempt' => 'nope'),
       unlock('pc_right', 'object', 'reception_pc_2', 'password', 'attempt' => 'secret123'),
       container_step('pc_container_open', 'reception_pc_2'),
       container_step('safe_container_locked', 'reception_safe_7'),
       unlock('safe_wrong', 'object', 'reception_safe_7', 'pin', 'attempt' => '0000'),
       unlock('safe_wrong_method', 'object', 'reception_safe_7', 'password', 'attempt' => '9573'),
       unlock('safe_right', 'object', 'reception_safe_7', 'pin', 'attempt' => '9573'),
       container_step('safe_container_open', 'reception_safe_7'),
       unlock('tablet_wrong_method', 'object', 'reception_tablet_3', 'pin', 'attempt' => '1234'),
       take_step('take_tablet_locked', scenario['rooms']['reception']['objects'][3].slice('type', 'name', 'takeable').merge('id' => 'reception_tablet_3')),
       unlock('tablet_right', 'object', 'reception_tablet_3', 'bluetooth'),
       take_step('take_tablet_open', scenario['rooms']['reception']['objects'][3].slice('type', 'name', 'takeable').merge('id' => 'reception_tablet_3')),
       unlock('office1_key_missing', 'door', 'office1', 'key'),
       unlock('office1_wrong_method', 'door', 'office1', 'pin', 'attempt' => '1234'),
       take_step('take_office_key', key_of.call('reception', 5)),
       unlock('office1_key_right', 'door', 'office1', 'key'),
       step('room_office1', 'GET', 'room/office1'),
       unlock('ceo_key_missing', 'door', 'ceo', 'key'),
       unlock('ceo_lockpick', 'door', 'ceo', 'lockpick'),
       unlock('closet_wrong', 'door', 'closet', 'pin', 'attempt' => '0000'),
       unlock('closet_right', 'door', 'closet', 'pin', 'attempt' => '7391'),
       unlock('server1_wrong', 'door', 'server1', 'pin', 'attempt' => '1111'),
       unlock('server1_right', 'door', 'server1', 'pin', 'attempt' => '4829'),
       unlock('ceo_pc_wrong', 'object', 'ceo_pc_0', 'password', 'attempt' => 'x'),
       unlock('suitcase_key_missing', 'object', 'ceo_suitcase_1', 'key'),
       unlock('suitcase_lockpick', 'object', 'ceo_suitcase_1', 'lockpick'),
       step('room_ceo', 'GET', 'room/ceo'),
       unlock('bluetooth_pc_right', 'object', 'office3_pc_0', 'bluetooth'),
       step('bootstrap_after', 'GET', 'scenario')]
    )
  end

  # ceo_exfil's NPC-permitted doors: refused before the NPC is met, refused for an NPC with no
  # permission, then opened by the NPC that has it.
  def lock_ceo_exfil_npc_door_case
    scenario = core_render('ceo_exfil')
    lock_base(
      'ceo_exfil_npc_door', 'S8c unit 01: the npc unlock method at a key door, before and after the NPC is met, before any S8c engine edit.',
      scenario,
      [step('bootstrap', 'GET', 'scenario'),
       unlock('ceo_npc_not_met', 'door', 'ceo', 'npc', 'attempt' => 'helper_npc'),
       step('room_reception', 'GET', 'room/reception'),
       unlock('ceo_npc_no_permission', 'door', 'ceo', 'npc', 'attempt' => 'gossip_girl'),
       unlock('ceo_npc_unknown', 'door', 'ceo', 'npc', 'attempt' => 'nobody'),
       unlock('office1_npc_no_permission', 'door', 'office1', 'npc', 'attempt' => 'helper_npc'),
       unlock('ceo_npc_right', 'door', 'ceo', 'npc', 'attempt' => 'helper_npc'),
       unlock('ceo_npc_again', 'door', 'ceo', 'npc', 'attempt' => 'helper_npc'),
       step('room_ceo', 'GET', 'room/ceo'),
       step('bootstrap_after', 'GET', 'scenario')],
      'encounteredNPCs' => []
    )
  end

  # Biometric doors and containers (the fingerprint is trusted from the client; a wrong method is refused).
  def lock_biometric_breach_case
    scenario = core_render('biometric_breach')
    lock_base(
      'biometric_breach', 'S8c unit 01: biometric doors and safes, and a key door, before any S8c engine edit.',
      scenario,
      [step('bootstrap', 'GET', 'scenario'),
       unlock('office1_wrong_method', 'door', 'office1', 'pin', 'attempt' => 'receptionist'),
       unlock('office1_biometric', 'door', 'office1', 'biometric', 'attempt' => 'receptionist'),
       step('room_office1', 'GET', 'room/office1'),
       unlock('office2_biometric', 'door', 'office2', 'biometric', 'attempt' => 'researcher'),
       unlock('closet_wrong', 'door', 'closet', 'pin', 'attempt' => '00000'),
       unlock('closet_right', 'door', 'closet', 'pin', 'attempt' => '72958'),
       container_step('closet_safe_container_locked', 'closet_safe_0'),
       unlock('closet_safe_wrong_method', 'object', 'closet_safe_0', 'pin', 'attempt' => 'intruder'),
       unlock('closet_safe_biometric', 'object', 'closet_safe_0', 'biometric', 'attempt' => 'intruder'),
       container_step('closet_safe_container_open', 'closet_safe_0'),
       unlock('server1_suitcase_biometric', 'object', 'server1_suitcase_2', 'biometric', 'attempt' => 'intruder'),
       unlock('server1_key_missing', 'door', 'server1', 'key'),
       step('bootstrap_after', 'GET', 'scenario')]
    )
  end

  # BLE containers (trusted from the client; a wrong method is refused).
  def lock_ble_scanner_case
    scenario = core_render('test-ble-scanner')
    lock_base(
      'ble_scanner', 'S8c unit 01: BLE-locked safe and tablet, before any S8c engine edit.',
      scenario,
      [step('bootstrap', 'GET', 'scenario'),
       step('room_test_lab', 'GET', 'room/test_lab'),
       container_step('safe_container_locked', 'test_lab_safe_0'),
       unlock('safe_wrong_method', 'object', 'test_lab_safe_0', 'bluetooth'),
       unlock('safe_ble', 'object', 'test_lab_safe_0', 'ble'),
       container_step('safe_container_open', 'test_lab_safe_0'),
       unlock('tablet_wrong_method', 'object', 'test_lab_tablet_1', 'pin', 'attempt' => '1'),
       unlock('tablet_ble', 'object', 'test_lab_tablet_1', 'ble'),
       step('bootstrap_after', 'GET', 'scenario')]
    )
  end

  # RFID doors that carry no access list (the swipe is trusted from the client; a wrong method is refused).
  # A held keycard: a lock with no access list is passed only by a card the server knows is held.
  def lock_keycard(card_id)
    { 'type' => 'keycard', 'id' => "kit_#{card_id}", 'name' => card_id.tr('_', ' ').capitalize, 'card_id' => card_id,
      'rfid_protocol' => 'EM4100', 'takeable' => true }
  end

  def lock_rfid_no_list_single_case
    lock_base(
      'rfid_no_list_single', 'S8c unit 01: an rfid door with no access list and the card held, before any S8c engine edit.', core_render('test-rfid'),
      [step('bootstrap', 'GET', 'scenario'),
       unlock('secure_wrong_method', 'door', 'test_secure', 'pin', 'attempt' => '1234'),
       unlock('secure_swipe_none', 'door', 'test_secure', 'rfid'),
       unlock('secure_swipe_card', 'door', 'test_secure', 'rfid', 'card_ids' => ['master_keycard']),
       step('room_test_secure', 'GET', 'room/test_secure'),
       step('bootstrap_after', 'GET', 'scenario')],
      'inventory' => [lock_keycard('master_keycard')]
    )
  end

  def lock_rfid_no_list_multi_case
    lock_base(
      'rfid_no_list_multi', 'S8c unit 01: the rfid doors of test-rfid-multiprotocol with one of the three cards held, before any S8c engine edit.', core_render('test-rfid-multiprotocol'),
      [step('bootstrap', 'GET', 'scenario'),
       unlock('em4100_wrong_method', 'door', 'em4100_room', 'pin', 'attempt' => '1'),
       unlock('em4100_swipe', 'door', 'em4100_room', 'rfid', 'card_ids' => ['employee_badge']),
       unlock('mifare_weak_swipe', 'door', 'mifare_weak_room', 'rfid', 'card_ids' => ['hotel_keycard']),
       unlock('desfire_swipe', 'door', 'desfire_room', 'rfid', 'card_ids' => ['corporate_badge']),
       step('room_em4100_room', 'GET', 'room/em4100_room'),
       step('bootstrap_after', 'GET', 'scenario')],
      'inventory' => [lock_keycard('employee_badge')]
    )
  end

  # test_social_m5_channels: a PIN-locked laptop that is itself takeable, before and after it opens.
  def lock_m5_terminal_case
    scenario = core_render('test_social_m5_channels')
    laptop = scenario['rooms']['m5_room']['objects'].find { |o| o['id'] == 'm5_locked_terminal' }.slice('type', 'id', 'name', 'takeable')
    lock_base(
      'm5_channels_terminal', 'S8c unit 01: a locked, takeable laptop: container and inventory add before and after its PIN, before any S8c engine edit.',
      scenario,
      [step('bootstrap', 'GET', 'scenario'),
       step('room_m5_room', 'GET', 'room/m5_room'),
       container_step('terminal_container_locked', 'm5_locked_terminal'),
       take_step('take_terminal_locked', laptop),
       unlock('terminal_wrong', 'object', 'm5_locked_terminal', 'pin', 'attempt' => '0000'),
       unlock('terminal_right', 'object', 'm5_locked_terminal', 'pin', 'attempt' => '2468'),
       container_step('terminal_container_open', 'm5_locked_terminal'),
       take_step('take_terminal_open', laptop),
       step('bootstrap_after', 'GET', 'scenario')]
    )
  end

  # ---- Ops cracking (S7), unit 01: golden answers for what the hash records must leave alone ----
  #
  # Captured on the code as it stood BEFORE any S7 engine edit (first capture, not a re-record). They
  # pin GET /keyring and its rev answer, the inventory add paths (room take, NPC give, declared grant,
  # a flag station's item taken again) and POST /flags with give_item and set_global rewards. No
  # existing core_* or privilege_* case sends a rev, adds to the inventory or submits a flag, so
  # nothing here repeats one.

  # What a keyring with no entries digests to (the rev core_test_access_networks records), and a
  # rev that matches nothing.
  CRACKING_KEYRING_REV = '06f67e'.freeze

  def cracking_cases
    { 'cracking_keyring' => cracking_keyring_case,
      'cracking_inventory_add' => cracking_inventory_add_case,
      'cracking_flag_submit' => cracking_flag_submit_case }
  end

  def cracking_base(name, description, scenario, steps, player_state = {})
    people = core_people(scenario).map { |npc| npc['id'] }
    {
      'name' => name, 'description' => description, 'clock' => OpsGolden::DEFAULT_CLOCK,
      'scenario' => scenario,
      'playerState' => { 'currentRoom' => scenario['startRoom'], 'unlockedRooms' => scenario['rooms'].keys,
                         'encounteredNPCs' => people }.merge(player_state),
      'steps' => steps
    }
  end


  # The keyring with no capture, then Ian's account recorded through the sync route (the capture card's
  # addCapture, as the browser sends it), the keyring and /capture_secrets before and after the drop box
  # proves it, then the typed sign-in at Ian's PC.
  def helpdesk_keyring_captured_case
    scenario = core_render('test_access_keyring')
    held = [mfa_find_object(scenario, 'kit_dropbox')]
    capture = { 'ian' => { 'targetId' => 'ian', 'kind' => 'credential', 'address' => 'ishaw', 'at' => 1 } }
    helpdesk_base(
      'test_access_keyring_captured', 'S8b unit 01: GET /keyring and /capture_secrets before and after a captured account, before any S8b engine edit.',
      scenario,
      [step('bootstrap', 'GET', 'scenario'),
       step('keyring_before', 'GET', 'keyring'),
       step('capture_secrets_before', 'GET', 'capture_secrets'),
       step('sync_capture_ian', 'PUT', 'sync_state', { 'clientTs' => 10, 'globalVariables' => { 'se_captures' => capture } }),
       step('keyring_captured', 'GET', 'keyring'),
       step('capture_secrets_captured', 'GET', 'capture_secrets'),
       step('plant_comms_port', 'POST', 'network/plant', { 'jack_id' => 'comms_port' }),
       step('keyring_captured_proven', 'GET', 'keyring'),
       step('keyring_captured_foothold', 'GET', 'keyring', { 'foothold' => 'jack_comms_port' }),
       step('capture_secrets_proven', 'GET', 'capture_secrets'),
       step('unplug_comms_port', 'POST', 'network/unplug', { 'jack_id' => 'comms_port' }),
       step('keyring_after_unplug', 'GET', 'keyring'),
       step('bootstrap_after', 'GET', 'scenario')],
      'inventory' => held
    )
  end

  # The bootstrap, every room, GET /keyring and the sign-in accounts at each sign-in PC of test_ops_mfa.
  def helpdesk_bootstrap_ops_mfa_case
    scenario = core_render('test_ops_mfa')
    steps = [step('bootstrap', 'GET', 'scenario')]
    scenario['rooms'].each_key { |room| steps << step("room_#{room}", 'GET', "room/#{room}") }
    steps << step('keyring_plain', 'GET', 'keyring')
    core_login_pcs(scenario).each { |pc| steps << step("accounts_#{pc['id']}", 'GET', 'login_accounts', { 'pc_id' => pc['id'] }) }
    steps << step('bootstrap_after', 'GET', 'scenario')
    helpdesk_base('bootstrap_test_ops_mfa', 'S8b unit 01: the bootstrap, rooms, keyring and sign-in accounts of test_ops_mfa, before any S8b engine edit.',
                  scenario, steps)
  end

  # A right password at a code PC (the pane, no session), a wrong then a missing-PC code, a right
  # password at a push PC then the prompt and the phone list, and a PC with no second step. Held: Hana's
  # code device and Dev's phone. Not here: the held device's answer and the number-matching answers, whose
  # code and numbers differ per game (the mechanism compares whole bodies); a Rails test pins their keys.
  def helpdesk_ops_mfa_second_step_case
    scenario = core_render('test_ops_mfa')
    held = %w[hana_device dev_phone].map { |id| mfa_find_object(scenario, id) }
    helpdesk_base(
      'test_ops_mfa_second_step', 'S8b unit 01: a right password at a code PC, the held device answer, a push prompt and the phone list on test_ops_mfa, before any S8b engine edit.',
      scenario,
      [step('bootstrap', 'GET', 'scenario'),
       step('device_not_declared_id', 'GET', 'mfa/device', { 'item_id' => 'no_such_device' }),
       step('device_not_held', 'GET', 'mfa/device', { 'item_id' => 'ines_device' }),
       login('hana_wrong_password', 'hquill', 'nope', 'code_pc1'),
       login('hana_right_password_code_pc', 'hquill', 'Quillmere-Hana-31', 'code_pc1'),
       step('verify_wrong_code', 'POST', 'mfa/verify', { 'pc_id' => 'code_pc1', 'code' => '000000' }),
       step('verify_no_pending_pc', 'POST', 'mfa/verify', { 'pc_id' => 'code_pc2', 'code' => '000000' }),
       step('verify_unknown_pc', 'POST', 'mfa/verify', { 'pc_id' => 'no_such_pc', 'code' => '000000' }),
       step('desktop_code_pc1_no_session', 'GET', 'container/code_pc1'),
       login('dev_right_password_push_pc', 'dkapoor', 'Kaporwell-Dev-77', 'push_pc'),
       step('prompt_push_pc', 'POST', 'mfa/prompt', { 'pc_id' => 'push_pc' }),
       step('phone_dev', 'GET', 'mfa/phone', { 'npc_id' => 'dev' }),
       step('phone_cal_not_held', 'GET', 'mfa/phone', { 'npc_id' => 'cal' }),
       step('phone_own_refused', 'GET', 'mfa/phone', { 'npc_id' => 'dev', 'own' => '1' }),
       step('desktop_push_pc_no_session', 'GET', 'container/push_pc'),
       login('cal_right_password_plain_pc', 'cmoss', 'Mossbank-Cal-12', 'plain_pc'),
       step('desktop_plain_pc', 'GET', 'container/plain_pc'),
       step('bootstrap_after', 'GET', 'scenario')],
      'inventory' => held
    )
  end

  def keyring_rev_step(id, rev, params = {})
    step(id, 'GET', 'keyring', { 'rev' => rev }.merge(params))
  end

  # GET /keyring over test_access_networks: plain, with a matching rev, with a stale rev, then the
  # same after a typed sign-in and under a planted jack's foothold.
  def cracking_keyring_case
    cracking_base(
      'cracking_keyring', 'S7 unit 01: GET /keyring with and without a matching rev, before any S7 engine edit.',
      core_render('test_access_networks'),
      [step('bootstrap', 'GET', 'scenario'),
       step('keyring_plain', 'GET', 'keyring'),
       keyring_rev_step('keyring_rev_match', CRACKING_KEYRING_REV),
       keyring_rev_step('keyring_rev_stale', 'stale0'),
       step('keyring_pc_id', 'GET', 'keyring', { 'pc_id' => 'sam_pc' }),
       login('sam_signs_in_typed', 'sokafor', 'Marmalade-82', 'sam_pc'),
       step('keyring_after_signin', 'GET', 'keyring', { 'pc_id' => 'sam_pc' }),
       keyring_rev_step('keyring_after_signin_rev_match', CRACKING_KEYRING_REV, 'pc_id' => 'sam_pc'),
       step('keyring_bad_from', 'GET', 'keyring', { 'from' => 'sam_pc' }),
       step('plant_comms_port', 'POST', 'network/plant', { 'jack_id' => 'comms_port' }),
       step('keyring_jack_foothold', 'GET', 'keyring', { 'foothold' => 'jack_comms_port' }),
       keyring_rev_step('keyring_jack_foothold_rev_match', CRACKING_KEYRING_REV, 'foothold' => 'jack_comms_port'),
       step('bootstrap_after', 'GET', 'scenario')],
      'inventory' => core_network_case('test_access_networks')['playerState']['inventory']
    )
  end

  CRACKING_FLAG_ONE = 'flag{cracking_one}'.freeze
  CRACKING_FLAG_TWO = 'flag{cracking_two}'.freeze

  # test_simple_vm_flag as shipped, plus what the inventory and flag cases need: a takeable file in the
  # room, an NPC holding one, a declared give_item on a sign, and flags and rewards on its station
  # (one flag gives an item the station holds, the other sets a global).
  def cracking_station_scenario
    scenario = core_render('test_simple_vm_flag')
    scenario['flags'] = { 'desktop' => { 'flag_1' => CRACKING_FLAG_ONE, 'flag_2' => CRACKING_FLAG_TWO } }
    room = scenario['rooms']['test_room']
    station = room['objects'].find { |obj| obj['type'] == 'flag-station' }
    station['flags'] = %w[desktop:flag_1 desktop:flag_2]
    station['itemsHeld'] = [{ 'type' => 'text_file', 'id' => 'cr_station_map', 'name' => 'Station Map', 'takeable' => true }]
    station['flagRewards'] = [{ 'type' => 'give_item', 'item_name' => 'Station Map' },
                              { 'type' => 'set_global', 'key' => 'cr_second_flag', 'value' => true }]
    room['objects'] << { 'type' => 'text_file', 'id' => 'cr_floor_note', 'name' => 'Floor Note', 'position' => { 'x' => 3, 'y' => 5 },
                         'takeable' => true, 'observations' => 'A note on the floor.' }
    room['objects'] << { 'type' => 'notes', 'id' => 'cr_sign', 'name' => 'Sign', 'position' => { 'x' => 4, 'y' => 5 }, 'takeable' => false,
                         'observations' => 'A sign.',
                         'triggerOnInteract' => [{ 'type' => 'give_item',
                                                   'item' => { 'type' => 'text_file', 'id' => 'cr_sign_memo', 'name' => 'Sign Memo', 'takeable' => true } }] }
    room['npcs'] = [{ 'id' => 'cr_npc', 'displayName' => 'Cass', 'npcType' => 'person', 'position' => { 'x' => 6, 'y' => 5 },
                      'itemsHeld' => [{ 'type' => 'text_file', 'id' => 'cr_npc_file', 'name' => 'Cass File', 'takeable' => true }] }]
    scenario
  end

  def cracking_item(id, name)
    { 'type' => 'text_file', 'id' => id, 'name' => name, 'takeable' => true }
  end

  def inventory_add_step(id, item, extra = {})
    step(id, 'POST', 'inventory', { 'action_type' => 'add', 'item' => item }.merge(extra))
  end

  def flag_step(id, flag, station = 'flag_station_desktop')
    step(id, 'POST', 'flags', { 'flag' => flag, 'stationId' => station })
  end

  # POST /inventory add: a room take (and again), an invented item, an NPC give (and again), a declared
  # grant, a station item before its flag, after it, and taken again once removed.
  def cracking_inventory_add_case
    station_map = cracking_item('cr_station_map', 'Station Map')
    cracking_base(
      'cracking_inventory_add', 'S7 unit 01: inventory adds (room take, NPC give, declared grant, flag station re-collect) through the real routes, before any S7 engine edit.',
      cracking_station_scenario,
      [step('bootstrap', 'GET', 'scenario'),
       inventory_add_step('take_room_item', cracking_item('cr_floor_note', 'Floor Note')),
       inventory_add_step('take_room_item_again', cracking_item('cr_floor_note', 'Floor Note')),
       inventory_add_step('take_invented_item', cracking_item('cr_invented', 'Invented File')),
       inventory_add_step('npc_give', cracking_item('cr_npc_file', 'Cass File'), 'source_npc_id' => 'cr_npc'),
       inventory_add_step('npc_give_again', cracking_item('cr_npc_file', 'Cass File'), 'source_npc_id' => 'cr_npc'),
       inventory_add_step('declared_grant', cracking_item('cr_sign_memo', 'Sign Memo')),
       inventory_add_step('station_item_before_flag', station_map),
       flag_step('station_flag_one', CRACKING_FLAG_ONE),
       step('remove_station_item', 'POST', 'inventory', { 'action_type' => 'remove', 'item' => { 'id' => 'cr_station_map' } }),
       inventory_add_step('station_item_recollect', station_map),
       inventory_add_step('station_item_recollect_again', station_map),
       step('bootstrap_after', 'GET', 'scenario')]
    )
  end

  # POST /flags at a station whose rewards are give_item and set_global: a wrong flag, the give_item
  # flag, the same flag again, the set_global flag, an unknown station, and the stored flag_rewards_claimed.
  def cracking_flag_submit_case
    cracking_base(
      'cracking_flag_submit', 'S7 unit 01: flag answers with give_item and set_global rewards through the real routes, before any S7 engine edit.',
      cracking_station_scenario,
      [step('bootstrap', 'GET', 'scenario'),
       flag_step('flag_wrong', 'flag{not_a_flag}'),
       flag_step('flag_one_give_item', CRACKING_FLAG_ONE),
       flag_step('flag_one_again', CRACKING_FLAG_ONE),
       flag_step('flag_two_set_global', CRACKING_FLAG_TWO.upcase),
       flag_step('flag_two_again', CRACKING_FLAG_TWO),
       flag_step('flag_unknown_station', CRACKING_FLAG_ONE, 'no_such_station'),
       step('bootstrap_after', 'GET', 'scenario')]
    )
  end
end
