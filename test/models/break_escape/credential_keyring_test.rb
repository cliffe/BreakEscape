require 'test_helper'

module BreakEscape
  # Credential keyring (CREDENTIAL_KEYRING_PLAN.md K1, 6.4): the per-game proof reader and the GET
  # /keyring answer builder. A Game is created from a real mission, then its scenario_data and
  # player_state are replaced in memory with a crafted credentials scenario, so the proofs and the
  # answer can be exercised without a full networks fixture. keyring_for_client is a read with no
  # side effects, so nothing is saved.
  class CredentialKeyringTest < ActiveSupport::TestCase
    setup do
      mission = Mission.create!(name: 'test_simple_success', display_name: 'Keyring', published: true, difficulty_level: 1)
      @game = Game.create!(mission: mission, player: break_escape_demo_users(:test_user)).reload
      @game.scenario_data = scenario
      @game.player_state = base_state
    end

    def scenario
      {
        'rooms' => {
          'office' => {
            'npcs' => [
              { 'id' => 'lena', 'displayName' => 'Lena Fox', 'creds' => { 'username' => 'lfox', 'password' => 'Ledger-Lena-9' } },
              { 'id' => 'jake', 'displayName' => 'Jake Brooks', 'creds' => { 'username' => 'jbrooks', 'password' => 'Vault-Jake-4' },
                'itemsHeld' => [{ 'id' => 'jake_assist_code', 'type' => 'text_file', 'name' => 'Remote assist code (Jake)', 'credential' => 'jake_assist' }] }
            ],
            'objects' => [
              { 'id' => 'lena_pc', 'type' => 'pc', 'lockType' => 'login', 'name' => 'Lena PC', 'host' => 'HB-FIN-02',
                'network' => 'office_lan',
                'access' => { 'people' => %w[lena jake] },
                'contents' => [
                  { 'id' => 'lena_passwords_txt', 'type' => 'text_file', 'name' => 'passwords.txt', 'readable' => true },
                  { 'id' => 'lena_rdp_file', 'type' => 'text_file', 'name' => 'HB-FIN-02.rdp', 'takeable' => true, 'credential' => 'lena_rdp' }
                ] },
              { 'id' => 'jake_pc', 'type' => 'pc', 'lockType' => 'login', 'name' => 'Jake PC', 'host' => 'HB-FIN-03',
                'access' => { 'people' => %w[jake] } }
            ]
          }
        },
        'credentials' => {
          'lena_rdp' => { 'kind' => 'saved_connection', 'account' => 'lena', 'connectsTo' => 'lena_pc', 'proof' => { 'held' => 'lena_rdp_file' } },
          'jake_assist' => { 'kind' => 'assist_invite', 'account' => 'jake', 'connectsTo' => 'jake_pc',
                             'proof' => { 'held' => 'jake_assist_code' }, 'endsOnGlobal' => 'jake_ended_assist' },
          'jake_pw_note' => { 'kind' => 'password', 'account' => 'jake', 'proof' => { 'session' => 'lena_pc' }, 'foundIn' => 'lena_passwords_txt' }
        }
      }
    end

    def base_state
      Game::ACCESS_STATE_DEFAULTS.transform_values(&:dup).merge('inventory' => [])
    end

    # Hold the .rdp (so lena_rdp proves held) and a jack foothold on lena_pc's network.
    def hold_rdp_with_foothold
      inv([{ 'id' => 'lena_rdp_file', 'type' => 'text_file', 'name' => 'HB-FIN-02.rdp', 'credential' => 'lena_rdp' }])
      @game.player_state['footholds'] = { 'jack1' => { 'via' => 'jack', 'network' => 'office_lan', 'source' => 'comms_port', 'seq' => 1 } }
    end

    def inv(entries)
      @game.player_state['inventory'] = entries
    end

    def entries
      @game.keyring_for_client[:entries]
    end

    def entry(id)
      entries.find { |e| e['id'] == id }
    end

    # --- label (K3a R1) -----------------------------------------------------------------------

    test 'a connecting credential label is its own label, else its item name, else empty and never the connectsTo id' do
      @game.scenario_data['credentials']['ops_cookie'] = { 'kind' => 'saved_connection', 'account' => 'lena', 'connectsTo' => 'jake_pc',
                                                           'proof' => { 'foothold' => 'jack1' } }
      @game.player_state['footholds'] = { 'jack1' => { 'via' => 'jack', 'network' => 'office_lan', 'source' => 'comms_port', 'seq' => 1 } }
      e = entry('ops_cookie')
      assert e, 'the foothold proof holds'

      assert_equal '', e['label'], 'no label and no held item: empty, so the screen uses its generic wording'
      refute_equal 'jake_pc', e['label']
      @game.scenario_data['credentials']['ops_cookie']['label'] = 'SV-OPS-01.rdp'
      assert_equal 'SV-OPS-01.rdp', entry('ops_cookie')['label']
    end

    # --- held proof ---------------------------------------------------------------------------

    test 'a held saved connection proves held and drops when the item leaves the inventory' do
      refute entry('lena_rdp'), 'no entry before the item is held'
      inv([{ 'id' => 'lena_rdp_file', 'type' => 'text_file', 'name' => 'HB-FIN-02.rdp', 'credential' => 'lena_rdp' }])
      e = entry('lena_rdp')
      assert e, 'the entry is listed once the item is held'
      assert_equal 'saved_connection', e['kind']
      assert_equal 'HB-FIN-02.rdp', e['label']
      refute e.key?('password'), 'a connecting kind never carries a value'
      inv([])
      refute entry('lena_rdp'), 'the entry leaves when the item is dropped'
    end

    test 'an always-allowed notepad with the rdp id and credential does not prove held' do
      inv([{ 'id' => 'lena_rdp_file', 'type' => 'notepad', 'name' => 'HB-FIN-02.rdp', 'credential' => 'lena_rdp' }])
      refute entry('lena_rdp'), 'type must match the definition (text_file), not notepad'
    end

    test 'a text_file with the rdp name but another id does not prove held (no name fallback)' do
      inv([{ 'id' => 'other_id', 'type' => 'text_file', 'name' => 'HB-FIN-02.rdp', 'credential' => 'lena_rdp' }])
      refute entry('lena_rdp')
    end

    test 'a client-forged room add with the rdp id does not prove held' do
      inv([{ 'id' => 'lena_rdp_file', 'type' => 'text_file', 'name' => 'HB-FIN-02.rdp', 'credential' => 'lena_rdp', 'clientAdded' => true }])
      refute entry('lena_rdp')
    end

    test 'an inventory entry without the credential field does not prove held' do
      inv([{ 'id' => 'lena_rdp_file', 'type' => 'text_file', 'name' => 'HB-FIN-02.rdp' }])
      refute entry('lena_rdp')
    end

    test 'a credential item stored in the wrapped scenarioData shape proves held (R1 m2)' do
      inv([{ 'scenarioData' => { 'id' => 'lena_rdp_file', 'type' => 'text_file', 'name' => 'HB-FIN-02.rdp', 'credential' => 'lena_rdp' } }])
      assert entry('lena_rdp'), 'the held proof unwraps scenarioData like the other inventory readers'
    end

    # --- session proof ------------------------------------------------------------------------

    test 'a session proof holds once the PC is in signedInPcs' do
      refute entry('jake_pw_note')
      @game.player_state['signedInPcs'] = %w[lena_pc]
      e = entry('jake_pw_note')
      assert e, 'the found-password entry appears once lena_pc is signed in'
      assert_equal 'password', e['kind']
      assert_equal 'registry', e['source']
      assert_equal 'passwords.txt', e['label']
      assert_equal 'lena_passwords_txt', e['foundIn']
      refute e.key?('password'), 'a registry password entry never carries the value'
    end

    # --- assist invite and ended --------------------------------------------------------------

    test 'a held assist invite lists a relay route, and ended with no routes once ended' do
      inv([{ 'id' => 'jake_assist_code', 'type' => 'text_file', 'name' => 'Remote assist code (Jake)', 'credential' => 'jake_assist' }])
      e = entry('jake_assist')
      assert e
      assert_equal [{ 'relay' => true }], e['routes']
      refute e['ended']

      @game.player_state['endedCredentials'] = %w[jake_assist]
      e2 = entry('jake_assist')
      assert e2['ended']
      assert_equal [], e2['routes']
    end

    # --- forgery and no leak ------------------------------------------------------------------

    test 'token and hash entries are never listed (not built in phase 1)' do
      @game.scenario_data['credentials']['a_token'] = { 'kind' => 'token', 'account' => 'lena', 'connectsTo' => 'lena_pc', 'proof' => { 'foothold' => 'j' } }
      @game.player_state['footholds'] = { 'j' => {} }
      refute entry('a_token'), 'a token is not a built kind in K1'
    end

    test 'with no captures the implicit entries are empty and nothing carries a password' do
      inv([{ 'id' => 'lena_rdp_file', 'type' => 'text_file', 'name' => 'HB-FIN-02.rdp', 'credential' => 'lena_rdp' }])
      @game.player_state['signedInPcs'] = %w[lena_pc]
      entries.each { |e| refute e.key?('password'), "#{e['id']} must not carry a password value" }
      assert entries.none? { |e| e['source'] == 'capture' }, 'no captures recorded, so no implicit entries'
    end

    # --- rev / unchanged ----------------------------------------------------------------------

    test 'rev is stable and changes when the keyring changes' do
      a = @game.keyring_for_client
      assert_match(/\A[0-9a-f]{6}\z/, a[:rev])
      inv([{ 'id' => 'lena_rdp_file', 'type' => 'text_file', 'name' => 'HB-FIN-02.rdp', 'credential' => 'lena_rdp' }])
      b = @game.keyring_for_client
      refute_equal a[:rev], b[:rev], 'adding an entry changes the digest'
    end

    # --- pc scope ------------------------------------------------------------------------------

    test 'pc_id adds forThisPc and accepted' do
      inv([{ 'id' => 'lena_rdp_file', 'type' => 'text_file', 'name' => 'HB-FIN-02.rdp', 'credential' => 'lena_rdp' }])
      e = @game.keyring_for_client(pc_id: 'lena_pc')[:entries].find { |x| x['id'] == 'lena_rdp' }
      assert_equal true, e['forThisPc']
      assert_equal true, e['accepted'], 'the default policy accepts a saved_connection'
    end

    test 'a pc_id naming no sign-in PC the player can open is ignored (R1 m3)' do
      inv([{ 'id' => 'lena_rdp_file', 'type' => 'text_file', 'name' => 'HB-FIN-02.rdp', 'credential' => 'lena_rdp' }])
      e = @game.keyring_for_client(pc_id: 'no_such_pc')[:entries].find { |x| x['id'] == 'lena_rdp' }
      refute e.key?('forThisPc'), 'an unopenable pc_id adds no scoping fields'
      refute e.key?('accepted')
    end

    # --- saved_connection route / power / sessionHeld (R1 m5) ----------------------------------

    test 'a held foothold reaching the PC lists the route, and targetOff rides only with a route' do
      hold_rdp_with_foothold
      e = entry('lena_rdp')
      assert_equal [{ 'foothold' => 'jack1' }], e['routes'], 'the held foothold that reaches lena_pc is a route'
      assert_equal false, e['targetOff'], 'targetOff rides because routes is non-empty and the PC is on'
      assert_equal false, e['remoteBlocked'], 'the default policy does not block remote sign-in'
      assert_equal false, e['sessionHeld'], 'no session is held yet'
    end

    test 'with no reaching foothold the route list is empty and targetOff is omitted' do
      inv([{ 'id' => 'lena_rdp_file', 'type' => 'text_file', 'name' => 'HB-FIN-02.rdp', 'credential' => 'lena_rdp' }])
      e = entry('lena_rdp')
      assert_equal [], e['routes']
      refute e.key?('targetOff'), 'power is told only where the PC could be reached (section 6.2)'
    end

    test 'sessionHeld is true when a session at the PC was opened with this credential' do
      hold_rdp_with_foothold
      @game.player_state['sessions'] = { 'lena_pc' => { 'id' => 'lena', 'credential' => 'lena_rdp' } }
      assert_equal true, entry('lena_rdp')['sessionHeld']
    end

    test 'targetOff is true when routes exist and the host service is off' do
      hold_rdp_with_foothold
      @game.scenario_data['rooms']['office']['objects'][0]['offWhen'] = 'lena_pc_off'
      @game.player_state['globalVariables'] = { 'lena_pc_off' => true }
      assert_equal true, entry('lena_rdp')['targetOff']
    end

    test 'remoteBlocked reflects the connectsTo policy for a saved_connection' do
      hold_rdp_with_foothold
      @game.scenario_data['rooms']['office']['objects'][0]['policy'] = 'blocked'
      @game.scenario_data['policies'] = { 'blocked' => { 'remote' => 'blocked' } }
      assert_equal true, entry('lena_rdp')['remoteBlocked']
    end

    # --- K3d (plan 8.7): the captures map and `how` ------------------------------------------

    # Writers on Lena (an account holder): a password capture of her account, a PIN seen over a
    # shoulder, a payload foothold, a plain finding; and one on Jake whose usePayload overlays it.
    def add_capture_writers
      npcs = @game.scenario_data['rooms']['office']['npcs']
      npcs[0]['eventMappings'] = [
        { 'eventPattern' => 'a', 'addCapture' => { 'targetId' => 'lena', 'kind' => 'credential', 'address' => 'lfox', 'note' => 'keylogger' } },
        { 'eventPattern' => 'b', 'addCapture' => { 'targetId' => 'cupboard_pin', 'kind' => 'credential', 'host' => 'Cupboard keypad',
                                                   'address' => 'someone at the cupboard', 'secret' => '2580' } },
        { 'eventPattern' => 'c', 'addCapture' => { 'targetId' => 'propped_door', 'kind' => 'foothold', 'host' => 'Back door', 'note' => 'wedged' } },
        { 'eventPattern' => 'd', 'addCapture' => { 'targetId' => 'tagged_door', 'kind' => 'foothold', 'host' => 'Side door', 'rowTag' => 'foothold' } },
        { 'eventPattern' => 'e', 'addCapture' => { 'targetId' => 'qr_capture', 'kind' => 'credential', 'address' => 'lfox', 'rowSource' => 'phished' } }
      ]
      npcs[1]['usePayload'] = { 'host' => 'HB-FIN-03', 'note' => 'payload ran' }
      npcs[1]['eventMappings'] = [
        { 'eventPattern' => 'f', 'addCapture' => { 'targetId' => 'jake_payload', 'kind' => 'foothold', 'host' => 'HB-FIN-03' } }
      ]
    end

    def store(target_id, fields, proven: true)
      @game.player_state['seCaptures'] ||= {}
      @game.player_state['seCaptures'][target_id] = { 'targetId' => target_id, 'at' => 1, 'proven' => proven }.merge(fields)
    end

    def captures
      @game.keyring_for_client[:captures]
    end

    test 'K3d: a credential capture of an account is tagged password and names the account' do
      add_capture_writers
      store('lena', 'kind' => 'credential', 'address' => 'lfox', 'note' => 'keylogger')
      assert_equal({ 'tag' => 'password', 'source' => 'recorded', 'account' => 'lena' }, captures['lena'])
    end

    test 'K3d: the account is named before the capture is proven' do
      add_capture_writers
      store('lena', { 'kind' => 'credential', 'address' => 'lfox', 'note' => 'keylogger' }, proven: false)
      assert_equal 'lena', captures['lena']['account']
    end

    test 'K3d: digits with no account give pin, and the map carries no value' do
      add_capture_writers
      store('cupboard_pin', 'kind' => 'credential', 'host' => 'Cupboard keypad', 'address' => 'someone at the cupboard')
      assert_equal({ 'tag' => 'pin', 'source' => 'recorded' }, captures['cupboard_pin'])
      refute_includes JSON.generate(@game.keyring_for_client), '2580'
    end

    test 'K3d: digits that are an account password stay password' do
      add_capture_writers
      @game.scenario_data['rooms']['office']['npcs'][0]['eventMappings'][0]['addCapture']['secret'] = '1234'
      store('lena', 'kind' => 'credential', 'address' => 'lfox', 'note' => 'keylogger')
      assert_equal 'password', captures['lena']['tag']
    end

    test 'K3d: an addCapture foothold is a finding, a payload overlay is a foothold, rowTag overrides' do
      add_capture_writers
      store('propped_door', 'kind' => 'foothold', 'host' => 'Back door', 'note' => 'wedged')
      store('tagged_door', 'kind' => 'foothold', 'host' => 'Side door')
      # The overlaid candidate (the payload's note joins the stored entry), as record_capture! stores it
      store('jake_payload', 'kind' => 'foothold', 'host' => 'HB-FIN-03', 'note' => 'payload ran')
      assert_equal 'finding', captures['propped_door']['tag']
      assert_equal 'foothold', captures['tagged_door']['tag']
      assert_equal 'foothold', captures['jake_payload']['tag']
      assert_equal 'recorded', captures['propped_door']['source']
    end

    test 'K3d: the plain candidate of a usePayload owner reads as a finding' do
      add_capture_writers
      store('jake_payload', 'kind' => 'foothold', 'host' => 'HB-FIN-03')
      assert_equal 'finding', captures['jake_payload']['tag']
    end

    test 'K3d: rowSource phished marks a look-alike capture outside the phish targets' do
      add_capture_writers
      store('qr_capture', 'kind' => 'credential', 'address' => 'lfox')
      assert_equal 'phished', captures['qr_capture']['source']
    end

    test 'K3d: two accounts with one username give no account' do
      add_capture_writers
      @game.scenario_data['rooms']['office']['npcs'] << { 'id' => 'lena2', 'creds' => { 'username' => 'LFOX', 'password' => 'x' } }
      store('lena', 'kind' => 'credential', 'address' => 'lfox', 'note' => 'keylogger')
      refute captures['lena'].key?('account')
    end

    test 'K3d: the map is built from the server record, never the client global' do
      add_capture_writers
      @game.player_state['globalVariables'] = { 'se_captures' => { 'lena' => { 'targetId' => 'lena', 'kind' => 'credential', 'address' => 'lfox' } } }
      assert_equal({}, captures)
      store('undeclared', 'kind' => 'credential', 'address' => 'lfox')
      refute captures.key?('undeclared'), 'an undeclared target in the record is never listed'
    end

    test 'K3d: the captures map changes the rev' do
      add_capture_writers
      before = @game.keyring_for_client[:rev]
      store('propped_door', 'kind' => 'foothold', 'host' => 'Back door', 'note' => 'wedged')
      refute_equal before, @game.keyring_for_client[:rev]
    end

    test 'K3d: how is given for an itemsHeld item, found for a desktop file and a session proof' do
      inv([{ 'id' => 'lena_rdp_file', 'type' => 'text_file', 'name' => 'HB-FIN-02.rdp', 'credential' => 'lena_rdp' },
           { 'id' => 'jake_assist_code', 'type' => 'text_file', 'name' => 'Remote assist code (Jake)', 'credential' => 'jake_assist' }])
      @game.player_state['signedInPcs'] = ['lena_pc']
      @game.player_state['sessions'] = { 'lena_pc' => { 'id' => 'lena' } }
      assert_equal 'found', entry('lena_rdp')['how']
      assert_equal 'given', entry('jake_assist')['how']
      assert_equal 'found', entry('jake_pw_note')['how'] if entry('jake_pw_note')
    end

    test 'K3d: how is given for a start-inventory item and recorded for a foothold proof' do
      scn = @game.scenario_data
      assert CredentialModel.held_item_given?(scn.merge('startItemsInInventory' => [{ 'id' => 'x_file', 'type' => 'text_file' }]), 'x_file')
      refute CredentialModel.held_item_given?(scn, 'lena_rdp_file')
      assert_equal 'recorded', @game.send(:credential_how, { 'proof' => { 'foothold' => 'jack1' } })
    end
  end
end
