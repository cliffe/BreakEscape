require 'test_helper'

# Credential keyring (CREDENTIAL_KEYRING_PLAN.md K1, 6.4): the shared model in
# BreakEscape::CredentialModel that the server, the validator and the dungeon graph read, as
# CaptureModel is shared. Pure functions of the authored scenario, no session.
class CredentialModelTest < ActiveSupport::TestCase
  CM = BreakEscape::CredentialModel

  test 'kinds built in phase 1, token and hash not yet' do
    assert CM.kind_built?('password')
    assert CM.kind_built?('saved_connection')
    assert CM.kind_built?('assist_invite')
    refute CM.kind_built?('token')
    refute CM.kind_built?('hash')
    refute CM.kind_built?('nonsense')
  end

  test 'default accepts omits token until K5' do
    assert_equal %w[password saved_connection assist_invite], CM::DEFAULT_ACCEPTS
    refute_includes CM::DEFAULT_ACCEPTS, 'token'
  end

  test 'accepts falls back to default, password always accepted' do
    assert_equal CM::DEFAULT_ACCEPTS, CM.accepts(nil)
    assert_equal CM::DEFAULT_ACCEPTS, CM.accepts({})
    assert_equal %w[password], CM.accepts({ 'accepts' => %w[password] })
    assert CM.accepts?({ 'accepts' => %w[password] }, 'password')
    refute CM.accepts?({ 'accepts' => %w[password] }, 'saved_connection')
    # password is always accepted even when the list omits it.
    assert CM.accepts?({ 'accepts' => %w[saved_connection] }, 'password')
  end

  test 'proof_kind requires exactly one known key' do
    assert_equal 'session', CM.proof_kind({ 'session' => 'pc' })
    assert_equal 'held', CM.proof_kind({ 'held' => 'item' })
    assert_equal 'foothold', CM.proof_kind({ 'foothold' => 'jack' })
    assert_nil CM.proof_kind({ 'session' => 'pc', 'held' => 'item' })
    assert_nil CM.proof_kind({})
    assert_nil CM.proof_kind({ 'planted' => 'x', 'on' => 'y' }.tap { |h| h.delete('planted') })
    # planted with an optional on is still exactly one proof key.
    assert_equal 'planted', CM.proof_kind({ 'planted' => 'dev', 'on' => 'port' })
    assert_nil CM.proof_kind('not a hash')
  end

  test 'registry reads at most 64 entries by sorted id' do
    creds = {}
    70.times { |i| creds[format('c%02d', i)] = { 'kind' => 'password', 'account' => 'x', 'proof' => { 'session' => 's' }, 'foundIn' => 'f' } }
    reg = CM.registry({ 'credentials' => creds })
    assert_equal 64, reg.size
    assert_equal 'c00', reg.keys.first
    assert_equal 'c63', reg.keys.last
    refute reg.key?('c64')
  end

  test 'registry skips non-hash values and empty scenario' do
    assert_equal({}, CM.registry({}))
    assert_equal({}, CM.registry({ 'credentials' => 'nope' }))
    reg = CM.registry({ 'credentials' => { 'a' => { 'kind' => 'password' }, 'b' => 'bad' } })
    assert_equal %w[a], reg.keys
  end

  test 'end_globals maps declared globals to assist_invite ids' do
    scenario = {
      'credentials' => {
        'jake_assist' => { 'kind' => 'assist_invite', 'account' => 'jake', 'connectsTo' => 'jake_pc',
                           'proof' => { 'held' => 'code' }, 'endsOnGlobal' => 'jake_ended_assist' },
        'lena_rdp' => { 'kind' => 'saved_connection', 'account' => 'lena', 'connectsTo' => 'lena_pc', 'proof' => { 'held' => 'rdp' } }
      }
    }
    assert_equal({ 'jake_ended_assist' => %w[jake_assist] }, CM.end_globals(scenario))
  end

  def scenario_with(items_block)
    {
      'rooms' => {
        'office' => {
          'npcs' => [
            { 'id' => 'jake', 'displayName' => 'Jake Brooks', 'creds' => { 'username' => 'jbrooks', 'password' => 'pw' } }
          ],
          'objects' => [
            { 'id' => 'lena_pc', 'type' => 'pc', 'lockType' => 'login', 'contents' => [] }
          ]
        }
      }
    }.merge(items_block)
  end

  test 'item_definition finds an NPC itemsHeld item with no session' do
    scenario = scenario_with({})
    scenario['rooms']['office']['npcs'][0]['itemsHeld'] = [{ 'id' => 'jake_assist_code', 'type' => 'text_file', 'name' => 'Assist code', 'credential' => 'jake_assist' }]
    defn = CM.item_definition(scenario, 'jake_assist_code')
    assert defn
    assert_equal 'text_file', defn['type']
    assert_equal 'jake_assist', defn['credential']
  end

  test 'item_definition finds a declared-grant item' do
    scenario = scenario_with({})
    scenario['rooms']['office']['objects'] << {
      'id' => 'desk', 'type' => 'desk',
      'triggerOnInteract' => [{ 'type' => 'give_item', 'item' => { 'id' => 'granted_rdp', 'type' => 'text_file', 'name' => 'granted.rdp', 'credential' => 'c' } }]
    }
    defn = CM.item_definition(scenario, 'granted_rdp')
    assert defn
    assert_equal 'granted.rdp', defn['name']
  end

  test "item_definition finds a share's contents item" do
    scenario = scenario_with('resources' => {
      'finance_share' => { 'kind' => 'file_share', 'contents' => [{ 'id' => 'rdp_in_share', 'type' => 'text_file', 'name' => 'x.rdp' }] }
    })
    assert CM.item_definition(scenario, 'rdp_in_share')
  end

  test 'item_definition finds a flag-station reward item' do
    scenario = scenario_with({})
    scenario['rooms']['office']['objects'] << {
      'id' => 'flagstn', 'type' => 'flag-station',
      'flagRewards' => [{ 'item' => { 'id' => 'reward_file', 'type' => 'text_file', 'name' => 'reward' } }]
    }
    assert CM.item_definition(scenario, 'reward_file')
  end

  test 'item_definition finds a start-inventory item and returns nil for unknown' do
    scenario = scenario_with('startItemsInInventory' => [{ 'id' => 'start_rdp', 'type' => 'text_file', 'name' => 's.rdp' }])
    assert CM.item_definition(scenario, 'start_rdp')
    assert_nil CM.item_definition(scenario, 'no_such_item')
  end
end
