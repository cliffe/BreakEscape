# The scripts behind the ops_unchanged fixtures (see OpsGolden and lib/tasks/ops_unchanged.rake).
# Each case builds the fixture minus "expected"; the capture run plays it on the code as it stands
# and writes the answers and state beside it. To add a fixture, add a case here.
require_relative 'access_model_scenario'
require_relative 'ops_golden'

module OpsUnchangedCases
  JAKE_CARD_ID = AccessModelScenario::JAKE_CARD['card_id']
  EXEC_CARD_ID = AccessModelScenario::EXEC_CARD['card_id']
  POWER_CARD_ID = AccessModelScenario::POWER_CARD['card_id']

  module_function

  def all
    { 'log_unlock_refusals' => log_unlock_refusals, 'log_container_cases' => log_container_cases }
      .merge(core_network_cases)
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
end
