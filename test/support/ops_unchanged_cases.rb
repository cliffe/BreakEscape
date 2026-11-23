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
end
