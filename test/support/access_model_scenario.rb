# A hand-written scenario for the access model tests
# (docs/achitechture/ACCESS_MODEL_PLAN.md, steps 1 and 2). Build games from it with
# create_access_game (test_helper.rb) so the loader runs.
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
              'awareness' => 'low', 'habits' => { 'writesDown' => false }, 'workarounds' => ['shared_drive'],
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
end
