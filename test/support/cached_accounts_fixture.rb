require_relative 'access_model_scenario'

# Ops S5b unit 08: the access fixture plus a hot desk (`profile_pc`, no owner) that remembers three
# accounts: jake from the start, sam only after a borrow, dana (the administrator) from the start.
# `it_pc` (owned by jake) declares nothing. Each cached account has one hash record.
module CachedAccountsFixture
  AMS = AccessModelScenario
  SAM_PASSWORD = 'Sam-Hot-Desk-55'.freeze

  module_function

  def scenario
    data = AMS.routes_scenario
    finance = data['rooms']['finance']
    finance['npcs'].find { |n| n['id'] == 'dana' }['creds']['admin'] = true
    finance['npcs'] << { 'id' => 'sam', 'displayName' => 'Sam Ortiz', 'npcType' => 'person',
                         'position' => { 'x' => 6, 'y' => 3 }, 'role' => 'staff', 'avatar' => 'sam.png',
                         'creds' => { 'username' => 'sortiz', 'password' => SAM_PASSWORD } }
    data['accountProfiles']['sam_files'] = {
      'for' => { 'people' => ['sam'] },
      'contents' => [{ 'id' => 'sam_note', 'type' => 'text_file', 'name' => 'Sam note', 'takeable' => true, 'text' => 's' }]
    }
    hot = finance['objects'].find { |o| o['id'] == 'profile_pc' }
    hot['cachedAccounts'] = [{ 'npc' => 'jake' }, { 'npc' => 'sam', 'after' => 'borrow' }, { 'npc' => 'dana' }]
    data['credentials'] = {
      'hot_jake' => { 'kind' => 'hash', 'account' => 'jake', 'proof' => { 'harvested' => 'profile_pc' },
                      'crack' => { 'password' => 'reused' } },
      'hot_sam' => { 'kind' => 'hash', 'account' => 'sam', 'proof' => { 'harvested' => 'profile_pc' },
                     'crack' => { 'password' => 'reused' } },
      'hot_dana' => { 'kind' => 'hash', 'account' => 'dana', 'proof' => { 'harvested' => 'profile_pc' },
                      'crack' => { 'password' => 'reused' } }
    }
    data['logSources'] = { 'collect' => { 'title' => 'Collect', 'events' => ['credentials_harvested'] } }
    data
  end
end
