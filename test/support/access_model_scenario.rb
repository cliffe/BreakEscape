# A hand-written scenario for the access model tests
# (docs/achitechture/ACCESS_MODEL_PLAN.md, steps 1 to 3). Build games from it with
# create_access_game (test_helper.rb) so the loader runs. routes_scenario (below) adds
# what the step 3 route tests need.
#
# - jake: an account holder with a capture route (usePayload and an addCapture);
# - dana: an account holder with no capture route;
# - len: a card-only NPC in the legacy rfidCard shape (no creds);
# - jake_pc: a sign-in PC with local contents; jake_files: Jake's profile.
# No authored note holds a password.
module AccessModelScenario
  JAKE_PASSWORD = 'Biscuit2019'.freeze
  DANA_PASSWORD = 'Daisy-Chain-77'.freeze
  PASSWORDS = [JAKE_PASSWORD, DANA_PASSWORD].freeze
  PC_LOCAL_MARKER = 'PC-LOCAL-FILE-TEXT'.freeze
  PROFILE_MARKER = 'JAKE-PROFILE-FILE-TEXT'.freeze

  JAKE_CARD = { 'name' => "Jake's badge", 'card_id' => '4F00A1C2', 'rfid_protocol' => 'EM4100' }.freeze
  LEN_CARD = {
    'name' => 'Records access badge', 'card_id' => 'cm_records_badge',
    'rfid_protocol' => 'MIFARE_Classic_Custom_Keys', 'sector_keys' => ['A0A1A2A3A4A5']
  }.freeze

  module_function

  def scenario(reveal: true)
    {
      'scenario_brief' => 'Access model fixture',
      'startRoom' => 'lobby',
      'social' => { 'captures' => { 'revealSecret' => reveal } },
      'policies' => { 'corp_default' => { 'autoLockMin' => 5, 'maxAttempts' => 5 } },
      'defaultPolicy' => 'corp_default',
      'accountProfiles' => {
        'jake_files' => {
          'for' => { 'people' => ['jake'] },
          'contents' => [
            { 'type' => 'text_file', 'name' => 'Q3 budget.xlsx', 'takeable' => true, 'text' => PROFILE_MARKER },
            { 'type' => 'safe', 'name' => 'Archive', 'locked' => true, 'lockType' => 'password',
              'requires' => 'zip-pass', 'contents' => [{ 'type' => 'notes', 'name' => 'Inner', 'text' => 'inner' }] }
          ]
        }
      },
      'rooms' => {
        'lobby' => {
          'type' => 'room_office', 'connections' => { 'north' => 'finance' },
          'npcs' => [
            { 'id' => 'len', 'displayName' => 'Len Okafor', 'npcType' => 'person',
              'position' => { 'x' => 2, 'y' => 2 }, 'rfidCard' => LEN_CARD.dup }
          ]
        },
        'finance' => {
          'type' => 'room_office', 'connections' => { 'south' => 'lobby' },
          'locked' => true, 'lockType' => 'pin', 'requires' => '4321',
          'objects' => [
            { 'id' => 'jake_pc', 'type' => 'pc', 'name' => "Jake's PC",
              'locked' => true, 'lockType' => 'login', 'access' => { 'roles' => ['staff'] },
              'policy' => 'corp_default', 'loginPicker' => 'accounts',
              'contents' => [{ 'type' => 'text_file', 'name' => 'Local.txt', 'takeable' => false, 'text' => PC_LOCAL_MARKER }] },
            { 'id' => 'finance_cabinet', 'type' => 'safe', 'name' => 'Cabinet',
              'locked' => true, 'lockType' => 'rfid', 'access' => { 'roles' => ['finance'] }, 'acceptsUIDOnly' => true,
              'contents' => [{ 'type' => 'notes', 'name' => 'Ledger', 'text' => 'ledger' }] }
          ],
          'npcs' => [
            { 'id' => 'jake', 'displayName' => 'Jake Brooks', 'npcType' => 'person',
              'position' => { 'x' => 3, 'y' => 3 },
              'role' => 'finance',
              'creds' => { 'username' => 'jbrooks', 'password' => JAKE_PASSWORD, 'card' => JAKE_CARD.dup },
              # high (slice 9.1): its locksScreen always fills screenHabit lockChance 1, which
              # leaves every claim as it was before habits had an effect.
              'awareness' => 'high', 'habits' => { 'writesDown' => false }, 'workarounds' => ['shared_drive'],
              'needsHome' => 'jake_pc',
              'usePayload' => { 'host' => 'LW-FIN-01' },
              'eventMappings' => [
                { 'eventPattern' => 'workstation_accessed:jake_pc', 'onceOnly' => true,
                  'addCapture' => { 'targetId' => 'jake', 'kind' => 'credential', 'note' => 'Lifted from his session.' } }
              ] },
            { 'id' => 'dana', 'displayName' => 'Dana White', 'npcType' => 'person',
              'position' => { 'x' => 5, 'y' => 3 },
              'role' => %w[finance it],
              'creds' => { 'username' => 'DWhite', 'password' => DANA_PASSWORD } }
          ]
        }
      }
    }
  end

  EXEC_CARD = { 'name' => 'Executive card', 'card_id' => 'EXEC-DF-01', 'rfid_protocol' => 'MIFARE_DESFire' }.freeze
  POWER_CARD = { 'name' => 'Power room card', 'card_id' => 'tg_power_room_card', 'rfid_protocol' => 'EM4100' }.freeze
  CLONER = { 'type' => 'rfid_cloner', 'id' => 'card_copier', 'name' => 'Card copier', 'takeable' => true }.freeze
  STAFF_HANDBOOK_MARKER = 'STAFF-HANDBOOK-TEXT'.freeze
  INNER_MARKER = 'ARCHIVE-INNER-TEXT'.freeze

  # The step 3 route fixture: the base scenario plus
  # - jake_pc: a takeable local file; jake_files: a copy-only file and a takeable file in
  #   the locked archive; staff_desktop: a profile for every staff account;
  # - profile_pc (profiles only, no owner), it_pc (access: it only, owned by Jake), both
  #   in finance; vault_pc in the locked vault;
  # - rfid doors: records (finance role only), mixed (requires VISITOR-07, or the it
  #   role), exec_suite (people: exec, no UID-only), exec_lounge (exec role, UID-only
  #   accepted), power_room (security role) and plant_room (facilities role);
  # - NPCs: exec (DESFire card, role exec), imran and gary sharing one card (facilities
  #   and security), no accounts;
  # - keycards: visitor_badge (VISITOR-07) and jake_spare (Jake's card id) in the lobby,
  #   safe_badge inside the locked lobby_safe;
  # - an unlock_object task on jake_pc.
  def routes_scenario
    data = scenario.deep_dup
    rooms = data['rooms']
    profile = data['accountProfiles']['jake_files']
    profile['contents'][0]['id'] = 'jake_budget'
    profile['contents'][1]['id'] = 'jake_archive'
    profile['contents'][1]['contents'] = [
      { 'id' => 'jake_inner', 'type' => 'text_file', 'name' => 'Inner.txt', 'takeable' => true, 'text' => INNER_MARKER }
    ]
    profile['contents'] << { 'id' => 'jake_payroll', 'type' => 'text_file', 'name' => 'Payroll.csv',
                             'takeable' => true, 'transfer' => 'copy', 'text' => 'payroll' }
    data['accountProfiles']['staff_desktop'] = {
      'for' => { 'roles' => ['staff'] },
      'contents' => [{ 'id' => 'staff_handbook', 'type' => 'text_file', 'name' => 'Staff handbook.pdf',
                       'takeable' => false, 'text' => STAFF_HANDBOOK_MARKER }]
    }

    finance = rooms['finance']
    jake_pc = finance['objects'].find { |o| o['id'] == 'jake_pc' }
    jake_pc['contents'][0]['id'] = 'jake_local'
    jake_pc['contents'] << { 'id' => 'jake_notes', 'type' => 'text_file', 'name' => 'Notes.txt',
                             'takeable' => true, 'text' => 'notes' }
    jake_pc['lockChance'] = 0.5
    finance['objects'] << { 'id' => 'profile_pc', 'type' => 'pc', 'name' => 'Hot desk',
                            'locked' => true, 'lockType' => 'login', 'access' => { 'roles' => ['staff'] } }
    finance['objects'] << { 'id' => 'it_pc', 'type' => 'pc', 'name' => 'IT PC', 'screenOwner' => 'jake',
                            'lockChance' => 0.5, 'locked' => true, 'lockType' => 'login',
                            'access' => { 'roles' => ['it'] } }

    rooms['lobby']['objects'] = [
      { 'id' => 'visitor_badge', 'type' => 'keycard', 'name' => 'Visitor badge', 'card_id' => 'VISITOR-07',
        'rfid_protocol' => 'EM4100', 'takeable' => true },
      { 'id' => 'jake_spare', 'type' => 'keycard', 'name' => "Jake's spare badge", 'card_id' => JAKE_CARD['card_id'],
        'rfid_protocol' => 'EM4100', 'takeable' => true },
      { 'id' => 'lobby_safe', 'type' => 'safe', 'name' => 'Lobby safe', 'locked' => true, 'lockType' => 'pin',
        'requires' => '1111',
        'contents' => [{ 'id' => 'safe_badge', 'type' => 'keycard', 'name' => 'Safe badge', 'card_id' => 'SAFE-01',
                         'rfid_protocol' => 'EM4100', 'takeable' => true }] }
    ]
    rooms['lobby']['npcs'] += [
      { 'id' => 'exec', 'displayName' => 'Morgan Hale', 'npcType' => 'person', 'position' => { 'x' => 4, 'y' => 2 },
        'role' => 'exec', 'creds' => { 'card' => EXEC_CARD.dup } },
      { 'id' => 'imran', 'displayName' => 'Imran Siddiqui', 'npcType' => 'person', 'position' => { 'x' => 6, 'y' => 2 },
        'role' => 'facilities', 'creds' => { 'card' => POWER_CARD.dup } },
      { 'id' => 'gary', 'displayName' => 'Gary Whitlock', 'npcType' => 'person', 'position' => { 'x' => 7, 'y' => 2 },
        'role' => 'security', 'rfidCard' => POWER_CARD.dup }
    ]

    rfid_room = lambda do |fields|
      { 'type' => 'room_office', 'connections' => {}, 'locked' => true, 'lockType' => 'rfid' }.merge(fields)
    end
    rooms['records'] = rfid_room.call('access' => { 'roles' => ['finance'] })
    rooms['mixed'] = rfid_room.call('requires' => ['VISITOR-07'], 'access' => { 'roles' => ['it'] })
    rooms['exec_suite'] = rfid_room.call('access' => { 'people' => ['exec'] })
    rooms['exec_lounge'] = rfid_room.call('access' => { 'roles' => ['exec'] }, 'acceptsUIDOnly' => true)
    rooms['power_room'] = rfid_room.call('access' => { 'roles' => ['security'] })
    rooms['plant_room'] = rfid_room.call('access' => { 'roles' => ['facilities'] })
    rooms['vault'] = {
      'type' => 'room_office', 'connections' => {}, 'locked' => true, 'lockType' => 'pin', 'requires' => '9999',
      'objects' => [{ 'id' => 'vault_pc', 'type' => 'pc', 'name' => 'Vault PC', 'locked' => true, 'lockType' => 'login' }]
    }

    data['objectives'] = [
      { 'aimId' => 'access', 'title' => 'Get in', 'status' => 'active',
        'tasks' => [{ 'taskId' => 'sign_in_jake', 'title' => "Sign in to Jake's PC", 'type' => 'unlock_object',
                      'targetObject' => 'jake_pc', 'status' => 'active' }] }
    ]
    data
  end
end
