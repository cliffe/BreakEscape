# A hand-written scenario for the access model slice 9.2 tests
# (docs/achitechture/ACCESS_MODEL_SLICE_9_2_PLAN.md, sub-slice A). Build games from it with
# create_access_game (test_helper.rb).
#
# - dana: finance and staff, a work need, needs finance_share (downIf) and email; perFail 34;
#   a workaround and a feed, so the withholding tests see them go;
# - kai: staff, +finance_share, which he is not admitted to (a cause the server owns);
# - ian: staff (email only), his own PC has an offWhen;
# - amy: staff, email only, a live PC: she cannot fail;
# - omar: staff, +printer (a resource tied to an object, with a downIf);
# - temp_user: an account holder with the role and no needs (no plan);
# Every PC's use time is 5 seconds (the hot desk's 7), so each NPC's shortest use time is 5.
module AccessWorkScenario
  PASSWORDS = %w[Ledger-Dana-31 Kai-Kestrel-88 Ian-Ibis-27 Amy-Aster-55 Omar-Oriole-64 Temp-Tern-12].freeze
  RESOURCE_NAMES = ['Finance share', 'Second floor printer', 'Corporate email'].freeze
  POST_TEXT = 'Biscuit turns 5 today! Best boy in the whole office.'.freeze

  def self.pc(id, extra = {})
    { 'type' => 'pc', 'id' => id, 'name' => id, 'locked' => true, 'lockType' => 'login',
      'affordance' => { 'satisfies' => 'work', 'useSeconds' => 5 } }.merge(extra)
  end

  def self.staff(id, username, password, extra = {})
    { 'id' => id, 'displayName' => id.capitalize, 'npcType' => 'person', 'role' => 'staff',
      'creds' => { 'username' => username, 'password' => password },
      'needsHome' => "#{id}_pc", 'needsDeferMin' => 0.5,
      'needs' => { 'work' => { 'decayPerMin' => 40, 'urgentAt' => 50, 'initial' => 60 } } }.merge(extra)
  end

  def self.scenario
    {
      'scenario_brief' => 'Slice 9.2 test scenario',
      'startRoom' => 'lobby',
      'officePresets' => true,
      'policies' => { 'managed' => { 'autoLockMin' => 5, 'usb' => 'storage_blocked' } },
      'defaultPolicy' => 'managed',
      'globalVariables' => { 'finance_share_down' => false, 'printer_jammed' => false, 'ian_pc_unplugged' => false },
      'resources' => {
        'email' => { 'kind' => 'email', 'name' => 'Corporate email' },
        'finance_share' => { 'kind' => 'file_share', 'name' => 'Finance share', 'access' => { 'roles' => ['finance'] },
                             'downIf' => 'finance_share_down' },
        'printer' => { 'kind' => 'printer', 'name' => 'Second floor printer', 'object' => 'office_printer', 'downIf' => 'printer_jammed' }
      },
      'roles' => {
        'staff' => { 'workNeeds' => ['email'], 'frustration' => { 'perFail' => 20 } },
        'finance' => { 'workNeeds' => ['finance_share'] }
      },
      'social' => {
        'intelFacts' => { 'dana_pet_name' => { 'label' => 'Pet', 'text' => 'Her dog is called Biscuit, and he turned five.' } },
        'osint' => { 'sites' => [{ 'id' => 'friendface', 'type' => 'social', 'profiles' => [{ 'person' => 'dana', 'name' => 'Dana', 'posts' => [] }] }] }
      },
      'rooms' => {
        'lobby' => {
          'type' => 'room_reception', 'connections' => { 'north' => 'office' },
          'objects' => [
            pc('temp_user_pc')
          ],
          'npcs' => [
            { 'id' => 'temp_user', 'displayName' => 'Temp', 'npcType' => 'person', 'role' => 'staff',
              'creds' => { 'username' => 'temp', 'password' => PASSWORDS[5] } }
          ]
        },
        'office' => {
          'type' => 'room_office', 'connections' => { 'south' => 'lobby' }, 'locked' => true, 'lockType' => 'key',
          'objects' => [
            pc('dana_pc'), pc('kai_pc'), pc('amy_pc'), pc('omar_pc'),
            pc('ian_pc', 'affordance' => { 'satisfies' => 'work', 'useSeconds' => 5, 'offWhen' => 'ian_pc_unplugged' }),
            pc('hot_desk', 'affordance' => { 'satisfies' => 'work', 'useSeconds' => 7 }),
            { 'type' => 'printer1', 'id' => 'office_printer', 'name' => 'Printer' },
            { 'type' => 'coffee_station1', 'id' => 'coffee', 'name' => 'Coffee' }
          ],
          'npcs' => [
            staff('dana', 'dreyes', PASSWORDS[0], 'role' => %w[finance staff], 'frustration' => { 'perFail' => 34 },
                                                  'workarounds' => [{ 'at' => 50, 'do' => 'borrow_session', 'pc' => 'hot_desk' }],
                                                  'feed' => { 'site' => 'friendface', 'person' => 'dana',
                                                              'posts' => [{ 'id' => 'dana_post_1', 'text' => POST_TEXT, 'fact' => 'dana_pet_name' }] }),
            staff('kai', 'kbrennan', PASSWORDS[1], 'workNeeds' => ['+finance_share']),
            staff('ian', 'ishaw', PASSWORDS[2]),
            staff('amy', 'acole', PASSWORDS[3]),
            staff('omar', 'ohaddad', PASSWORDS[4], 'workNeeds' => ['+printer'])
          ]
        }
      }
    }
  end
end
