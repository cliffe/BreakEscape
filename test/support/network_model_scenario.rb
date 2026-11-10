# A hand-written scenario for the network tests
# (docs/achitechture/ACCESS_MODEL_SLICE_9_3_PLAN.md, steps 1 to 4, and section 6's
# no-exposure fixture). Build games from it with create_access_game (test_helper.rb).
#
# - two networks, office_lan and workshop_lan, with a jack on each (comms_port,
#   bench_port), and a third jack (server_port, office_lan) in a locked room;
# - three accounts standing in the lobby: Sam (staff only), Lena (finance, with a capture
#   route) and Ian (it);
# - sign-in PCs: sam_pc (open room, office_lan, owned by Sam, whose needs are tracked
#   and whose screen can be left unlocked, so an owner claim there succeeds at the
#   keyboard), lena_pc (locked room, office_lan, policy counted), kiosk_pc (open room,
#   office_lan, policy hardened: remote sign-in blocked), door_box (headless, office_lan,
#   it only), bench_pc (workshop_lan) and offline_pc (on no network);
# - resources: an open share and a protected share (finance, with a locked folder) on
#   office_lan, a printer with observations, and an open share on workshop_lan;
# - the drop box (rogueDevice) on the lobby table, and an unlock_object task on the jack.
#
# Every string a network or resource shows is six or more characters and appears
# nowhere else in the scenario, so the no-exposure tests can look for it.
module NetworkModelScenario
  SAM_PASSWORD = 'Okafor-Desk-4410'.freeze
  LENA_PASSWORD = 'Fox-Ledger-8812'.freeze
  IAN_PASSWORD = 'Shaw-Racks-5150'.freeze
  PASSWORDS = [SAM_PASSWORD, LENA_PASSWORD, IAN_PASSWORD].freeze
  LANDING_SECRET = 'Portal-Secret-991'.freeze
  LANDING_ADDRESS = 'portal.user@harbour.example'.freeze

  OFFICE_NAME = 'Harbour office LAN'.freeze
  WORKSHOP_NAME = 'Workshop bench LAN'.freeze
  INBOX_NAME = 'Scanned-Inbox'.freeze
  LEDGER_NAME = 'Ledger-Archive'.freeze
  PRINTER_NAME = 'Office print queue'.freeze
  BENCH_NAME = 'Bench-Notes'.freeze
  FS_HOST = 'HB-FS01'.freeze
  PRINTER_HOST = 'HB-PRN-01'.freeze
  NAS_HOST = 'WS-NAS-01'.freeze
  PRINTER_OBSERVATIONS = 'A print queue anyone on the segment can read.'.freeze
  INBOX_LETTER_NAME = 'scan_0412.pdf'.freeze
  INBOX_LETTER_TEXT = 'INBOX-LETTER-TEXT-7741'.freeze
  HANDOVER_NAME = 'IT handover.txt'.freeze
  HANDOVER_TEXT = 'LEDGER-HANDOVER-TEXT-3302'.freeze
  YEAREND_NAME = 'Year-end'.freeze
  YEAREND_PIN = '2468'.freeze
  YEAREND_REPORT_NAME = 'Year-end report.xlsx'.freeze
  YEAREND_REPORT_TEXT = 'YEAREND-REPORT-TEXT-9055'.freeze
  BENCH_NOTE_NAME = 'bench_readme.txt'.freeze
  BENCH_NOTE_TEXT = 'BENCH-NOTE-TEXT-6620'.freeze
  DOOR_CODES_TEXT = 'DOOR-CODES-TEXT-1187'.freeze

  # What no response may carry for a player with no foothold and no session.
  NETWORK_STRINGS = [OFFICE_NAME, WORKSHOP_NAME].freeze
  OFFICE_RESOURCE_STRINGS = [INBOX_NAME, LEDGER_NAME, PRINTER_NAME, FS_HOST, PRINTER_HOST, PRINTER_OBSERVATIONS].freeze
  WORKSHOP_RESOURCE_STRINGS = [BENCH_NAME, NAS_HOST].freeze
  SHARE_ITEM_STRINGS = [INBOX_LETTER_NAME, INBOX_LETTER_TEXT, HANDOVER_NAME, HANDOVER_TEXT, YEAREND_REPORT_NAME,
                        YEAREND_REPORT_TEXT, BENCH_NOTE_NAME, BENCH_NOTE_TEXT].freeze
  EXPOSED_STRINGS = (NETWORK_STRINGS + OFFICE_RESOURCE_STRINGS + WORKSHOP_RESOURCE_STRINGS + SHARE_ITEM_STRINGS).freeze

  DROP_BOX = { 'id' => 'kit_dropbox', 'type' => 'pc', 'sprite' => 'drop_box1', 'name' => 'Network drop box',
               'takeable' => true, 'rogueDevice' => true }.freeze

  module_function

  def scenario
    {
      'scenario_brief' => 'Network fixture',
      'startRoom' => 'lobby',
      'networks' => {
        'office_lan' => { 'name' => OFFICE_NAME },
        'workshop_lan' => { 'name' => WORKSHOP_NAME }
      },
      'resources' => {
        'scanned_inbox' => {
          'kind' => 'file_share', 'name' => INBOX_NAME, 'host' => FS_HOST, 'network' => 'office_lan',
          'contents' => [{ 'id' => 'inbox_letter', 'type' => 'text_file', 'name' => INBOX_LETTER_NAME,
                           'takeable' => true, 'text' => INBOX_LETTER_TEXT }]
        },
        'ledger_archive' => {
          'kind' => 'file_share', 'name' => LEDGER_NAME, 'host' => FS_HOST, 'network' => 'office_lan',
          'access' => { 'roles' => ['finance'] },
          'contents' => [
            { 'id' => 'ledger_handover', 'type' => 'text_file', 'name' => HANDOVER_NAME, 'takeable' => true,
              'transfer' => 'copy', 'text' => HANDOVER_TEXT },
            { 'id' => 'ledger_yearend', 'type' => 'safe', 'name' => YEAREND_NAME, 'locked' => true, 'lockType' => 'pin',
              'requires' => YEAREND_PIN,
              'contents' => [{ 'id' => 'yearend_report', 'type' => 'text_file', 'name' => YEAREND_REPORT_NAME,
                               'takeable' => true, 'text' => YEAREND_REPORT_TEXT }] }
          ]
        },
        'print_queue' => {
          'kind' => 'printer', 'name' => PRINTER_NAME, 'host' => PRINTER_HOST, 'network' => 'office_lan',
          'observations' => PRINTER_OBSERVATIONS
        },
        'bench_notes' => {
          'kind' => 'file_share', 'name' => BENCH_NAME, 'host' => NAS_HOST, 'network' => 'workshop_lan',
          'contents' => [{ 'id' => 'bench_note', 'type' => 'text_file', 'name' => BENCH_NOTE_NAME,
                           'takeable' => true, 'text' => BENCH_NOTE_TEXT }]
        }
      },
      'social' => {
        'captures' => { 'revealSecret' => true },
        'landingPages' => [{ 'id' => 'portal', 'capture' => { 'address' => LANDING_ADDRESS, 'secret' => LANDING_SECRET } }]
      },
      'policies' => {
        'hardened' => { 'remote' => 'blocked' },
        'counted' => { 'maxAttempts' => 5, 'remote' => 'allowed' }
      },
      'rooms' => {
        'lobby' => {
          'type' => 'room_office',
          'connections' => { 'north' => 'comms_room', 'east' => 'desk_room', 'west' => 'workshop' },
          'objects' => [
            DROP_BOX.dup,
            { 'id' => 'lobby_vault', 'type' => 'safe', 'name' => 'Lobby vault', 'locked' => true, 'lockType' => 'pin',
              'requires' => '7031', 'contents' => [{ 'id' => 'vault_prize', 'type' => 'notes', 'name' => 'Prize',
                                                      'takeable' => true, 'text' => 'prize' }] }
          ],
          'npcs' => [
            { 'id' => 'sam', 'displayName' => 'Sam Okafor', 'npcType' => 'person', 'position' => { 'x' => 2, 'y' => 2 },
              'creds' => { 'username' => 'sokafor', 'password' => SAM_PASSWORD },
              'needs' => { 'coffee' => { 'decayPerMin' => 1, 'urgentAt' => 50 } } },
            { 'id' => 'lena', 'displayName' => 'Lena Fox', 'npcType' => 'person', 'position' => { 'x' => 3, 'y' => 2 },
              'role' => 'finance', 'creds' => { 'username' => 'lfox', 'password' => LENA_PASSWORD },
              'usePayload' => { 'host' => 'HB-FIN-02' } },
            { 'id' => 'ian', 'displayName' => 'Ian Shaw', 'npcType' => 'person', 'position' => { 'x' => 4, 'y' => 2 },
              'role' => 'it', 'creds' => { 'username' => 'ishaw', 'password' => IAN_PASSWORD } }
          ]
        },
        'comms_room' => {
          'type' => 'room_office', 'connections' => { 'south' => 'lobby', 'north' => 'server_room' },
          'network' => 'office_lan',
          'objects' => [
            { 'id' => 'comms_port', 'type' => 'pc', 'sprite' => 'network_rack1', 'name' => 'Spare wall port',
              'networkJack' => true, 'jackConfirm' => 'Plug the drop box into this port?',
              'plantedSprite' => 'pi_cluster1', 'linkName' => 'Drop box: comms room' }
          ]
        },
        'server_room' => {
          'type' => 'room_office', 'connections' => { 'south' => 'comms_room' },
          'locked' => true, 'lockType' => 'key', 'requires' => 'server_key',
          'objects' => [
            { 'id' => 'server_port', 'type' => 'pc', 'name' => 'Server patch panel', 'networkJack' => true,
              'network' => 'office_lan' }
          ]
        },
        'workshop' => {
          'type' => 'room_office', 'connections' => { 'east' => 'lobby' },
          'network' => 'workshop_lan',
          'objects' => [
            { 'id' => 'bench_port', 'type' => 'pc', 'name' => 'Bench switch', 'networkJack' => true,
              'linkStoreIn' => 'capture_log' },
            { 'id' => 'bench_pc', 'type' => 'pc', 'name' => 'Bench PC', 'host' => 'WS-BENCH-01',
              'locked' => true, 'lockType' => 'login', 'access' => { 'roles' => ['staff'] } }
          ]
        },
        'desk_room' => {
          'type' => 'room_office', 'connections' => { 'west' => 'lobby', 'north' => 'finance_office',
                                                      'east' => 'kiosk_room', 'south' => 'store' },
          'objects' => [
            { 'id' => 'sam_pc', 'type' => 'pc', 'name' => "Sam's PC", 'host' => 'HB-DESK-01', 'network' => 'office_lan',
              'locked' => true, 'lockType' => 'login', 'access' => { 'roles' => ['staff'] },
              'screenOwner' => 'sam', 'locksScreenOnLeave' => false,
              'contents' => [{ 'id' => 'sam_local', 'type' => 'text_file', 'name' => 'todo.txt', 'takeable' => false,
                               'text' => 'todo' }] },
            { 'id' => 'offline_pc', 'type' => 'pc', 'name' => 'Offline PC', 'locked' => true, 'lockType' => 'login',
              'access' => { 'roles' => ['staff'] } }
          ]
        },
        'finance_office' => {
          'type' => 'room_office', 'connections' => { 'south' => 'desk_room' },
          'locked' => true, 'lockType' => 'pin', 'requires' => '4455', 'network' => 'office_lan',
          'objects' => [
            { 'id' => 'lena_pc', 'type' => 'pc', 'name' => "Lena's PC", 'host' => 'HB-FIN-02',
              'locked' => true, 'lockType' => 'login', 'access' => { 'roles' => ['finance'] }, 'policy' => 'counted',
              'contents' => [{ 'id' => 'lena_local', 'type' => 'text_file', 'name' => 'budget.txt', 'takeable' => true,
                               'text' => 'budget' }] }
          ]
        },
        'kiosk_room' => {
          'type' => 'room_office', 'connections' => { 'west' => 'desk_room' },
          'network' => 'office_lan',
          'objects' => [
            { 'id' => 'kiosk_pc', 'type' => 'pc', 'name' => 'Reception kiosk', 'host' => 'HB-KIOSK-01',
              'locked' => true, 'lockType' => 'login', 'access' => { 'roles' => ['staff'] }, 'policy' => 'hardened' }
          ]
        },
        'store' => {
          'type' => 'room_office', 'connections' => { 'north' => 'desk_room' },
          'objects' => [
            { 'id' => 'door_box', 'type' => 'pc', 'sprite' => 'network_rack1', 'name' => 'Door controller',
              'host' => 'HB-DOOR-01', 'network' => 'office_lan', 'locked' => true, 'lockType' => 'login',
              'headless' => true, 'access' => { 'roles' => ['it'] },
              'observations' => 'A door controller with no screen or keyboard.',
              'contents' => [{ 'id' => 'door_codes', 'type' => 'text_file', 'name' => 'Door codes', 'takeable' => false,
                               'text' => DOOR_CODES_TEXT }] }
          ]
        }
      },
      'objectives' => [
        { 'aimId' => 'reach', 'title' => 'Get a foothold', 'status' => 'active',
          'tasks' => [
            { 'taskId' => 'plant_box', 'title' => 'Plant the box', 'type' => 'unlock_object',
              'targetObject' => 'comms_port', 'status' => 'active' },
            { 'taskId' => 'sign_in_lena', 'title' => 'Sign in as Lena', 'type' => 'unlock_object',
              'targetObject' => 'lena_pc', 'status' => 'active' }
          ] }
      ]
    }
  end

  # The scenario with the drop box defined in one of its five homes (3.3): 'room' (the
  # lobby table, as authored), 'container' (an open crate in the lobby), 'start'
  # (startItemsInInventory), 'npc' (Sam's itemsHeld) or 'grant' (a timer's give_item).
  def with_device_home(home)
    data = scenario
    lobby = data['rooms']['lobby']
    lobby['objects'].reject! { |obj| obj['id'] == DROP_BOX['id'] }
    case home
    when 'room'
      lobby['objects'] << DROP_BOX.dup
    when 'container'
      lobby['objects'] << { 'id' => 'kit_crate', 'type' => 'safe', 'name' => 'Kit crate', 'locked' => false,
                            'contents' => [DROP_BOX.dup] }
    when 'start'
      data['startItemsInInventory'] = [DROP_BOX.dup]
    when 'npc'
      lobby['npcs'][0]['itemsHeld'] = [DROP_BOX.dup]
    when 'grant'
      data['timers'] = [{ 'id' => 'kit_delivery', 'afterMs' => 1000,
                          'actions' => [{ 'type' => 'give_item', 'item' => DROP_BOX.dup }] }]
    else
      raise ArgumentError, "unknown home #{home}"
    end
    data
  end
end

# Requests the network controller tests share. Include in an ActionDispatch::IntegrationTest
# beside Engine.routes.url_helpers; build_network_game sets @game.
module NetworkRequests
  OPEN_ROOMS = %w[lobby comms_room desk_room workshop kiosk_room store].freeze

  def build_network_game(player_state = {}, scenario = NetworkModelScenario.scenario)
    @game = create_access_game(
      mission: break_escape_missions(:ceo_exfil),
      player: break_escape_demo_users(:test_user),
      scenario: scenario,
      player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => OPEN_ROOMS.dup,
                      'encounteredNPCs' => %w[sam lena ian] }.merge(player_state)
    )
  end

  def game_path(suffix)
    "/break_escape/games/#{@game.id}/#{suffix}"
  end

  def take_drop_box
    post game_path('inventory'), params: { action_type: 'add', item: { type: 'pc', id: 'kit_dropbox', name: 'Network drop box' } },
                                 as: :json
    assert_response :success, response.body
  end

  def plant(jack_id, device_id = nil)
    params = { jack_id: jack_id }
    params[:device_id] = device_id if device_id
    post game_path('network/plant'), params: params, as: :json
    response.parsed_body
  end

  def unplug(jack_id)
    post game_path('network/unplug'), params: { jack_id: jack_id }, as: :json
    response.parsed_body
  end

  def network_view(foothold = nil)
    get game_path('network'), params: foothold ? { foothold: foothold } : {}, as: :json
    response.parsed_body
  end

  def sign_in(pc_id, username, password, foothold: nil)
    params = { pc_id: pc_id, username: username, password: password }
    params[:foothold] = foothold if foothold
    post game_path('login'), params: params, as: :json
    response.parsed_body
  end

  def container(id, foothold: nil)
    get game_path("container/#{id}"), params: foothold ? { foothold: foothold } : {}, as: :json
    response.parsed_body
  end

  def unlock_object(id, method, attempt = nil)
    post game_path('unlock'), params: { targetType: 'object', targetId: id, method: method, attempt: attempt }, as: :json
    response.parsed_body
  end

  def add_item(type, id, name, source_pc_id: nil, source_resource_id: nil, transfer: nil)
    params = { action_type: 'add', item: { type: type, id: id, name: name } }
    params[:source_pc_id] = source_pc_id if source_pc_id
    params[:source_resource_id] = source_resource_id if source_resource_id
    params[:transfer] = transfer if transfer
    post game_path('inventory'), params: params, as: :json
    response.parsed_body
  end

  def held_ids
    @game.reload.player_state['inventory'].map { |item| item['id'] }
  end

  def refute_exposed(context, strings = NetworkModelScenario::EXPOSED_STRINGS)
    strings.each { |text| refute_includes response.body, text, "#{context} exposes #{text}" }
  end

  # Status and body, with the requested id written as <id>, so the answer for a real
  # id can be compared with the answer for an invented one.
  def answer_for(id)
    [response.status, response.body.gsub(id, '<id>')]
  end
end
