require 'test_helper'
require_relative '../../support/keyring_login_scenario'

module BreakEscape
  # Keyring K2 (docs/achitechture/CREDENTIAL_KEYRING_PLAN.md 7 and 7.3): POST /login with a
  # credential, through the real routes. Each step's refusal, the generic body that cannot probe
  # the registry, nothing counted, the relay route and its sink rules, a sign-in that replaces a
  # pivot naming the ended onward sessions, reload, the network view's host rows, and the take
  # paths that stamp a credential item (carry-in m2).
  class CredentialLoginTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    KS = KeyringLoginScenario
    OFFICE = KS::OFFICE

    def build(player_state = {})
      build_network_game({ 'encounteredNPCs' => %w[sam lena ian jake] }.merge(player_state), KS.scenario)
    end

    def state
      @game.reload.player_state
    end

    def hold(*ids)
      @game.player_state['inventory'] = Array(@game.player_state['inventory']) + ids.map { |id| KS.held(id) }
      @game.save!
    end

    def with_foothold
      take_drop_box
      plant('comms_port')
      assert_response :success, response.body
    end

    def cred_login(pc_id, credential, extra = {})
      post game_path('login'), params: { pc_id: pc_id, credential: credential }.merge(extra), as: :json
      response.parsed_body
    end

    def claim(pc_id)
      post game_path('login'), params: { pc_id: pc_id, claim: 'owner' }, as: :json
      response.parsed_body
    end

    def get_container(id, params = {})
      get game_path("container/#{id}"), params: params, as: :json
      response.parsed_body
    end

    def counters
      s = state
      [s['loginFailures'], s['loginLockouts']]
    end

    # ---- step 2: the generic refusal ------------------------------------------------------

    test 'the generic refusal is byte-identical for undeclared, unproven, password and malformed ids, and nothing is counted' do
      build
      with_foothold
      before = counters
      bodies = ['no_such_cred', 'ops_rdp', 'jake_pw_note', 'Bad-ID!', 'x' * 80].map do |id|
        cred_login('lena_pc', id, foothold: OFFICE)
        assert_response :unprocessable_entity
        response.body
      end
      assert_equal 1, bodies.uniq.size, bodies.inspect
      assert_equal({ 'success' => false, 'message' => Game::LOGIN_INCORRECT }, JSON.parse(bodies.first))
      assert_equal before, counters
      assert_empty state['sessions']
    end

    test 'an unknown PC is 404 as today' do
      build
      hold('lena_rdp_file')
      cred_login('no_such_pc', 'lena_rdp', foothold: OFFICE)
      assert_response :not_found
    end

    # ---- steps 3 to 8 ---------------------------------------------------------------------

    test 'step 3: a held credential at another PC is for another PC' do
      build
      hold('lena_rdp_file')
      with_foothold
      body = cred_login('sam_pc', 'lena_rdp', foothold: OFFICE)
      assert_response :unprocessable_entity
      assert_equal true, body['wrongPc']
      assert_equal 'This connection is for another PC', body['message']
    end

    test 'step 4: no route (the keyboard), a relay on a saved connection and two routes get the generic refusal' do
      build
      hold('lena_rdp_file')
      with_foothold
      generic = { 'success' => false, 'message' => Game::LOGIN_INCORRECT }
      [{}, { relay: true }, { foothold: OFFICE, relay: true }].each do |extra|
        assert_equal generic, cred_login('lena_pc', 'lena_rdp', extra), extra.inspect
        assert_response :unprocessable_entity
      end
      # K4 (plan 9): from= is a route now; a source the player does not hold is 403, not generic
      body = cred_login('lena_pc', 'lena_rdp', from: 'sam_pc')
      assert_response :forbidden
      assert_equal 'PC not reachable', body['message']
      assert_empty state['sessions']
    end

    test 'step 4: a foothold not held or not reaching is 403, and an assist invite with a foothold is the generic refusal' do
      build
      hold('lena_rdp_file', 'jake_assist_code')
      body = cred_login('lena_pc', 'lena_rdp', foothold: 'jack_nowhere')
      assert_response :forbidden
      assert_equal 'PC not reachable', body['message']

      with_foothold
      assert_equal Game::LOGIN_INCORRECT, cred_login('jake_pc', 'jake_assist', foothold: OFFICE)['message']
    end

    test 'step 4: a relay sign-in needs no reach but fails on an off PC with not_responding' do
      build('globalVariables' => { KS::JAKE_OFF_GLOBAL => true })
      hold('jake_assist_code')
      body = cred_login('jake_pc', 'jake_assist', relay: true)
      assert_response :forbidden
      assert_equal 'not_responding', body['reason']
      assert_empty state['sessions']
    end

    test 'step 5: a policy that refuses the kind answers kindRefused' do
      build
      hold('records_rdp_file')
      with_foothold
      body = cred_login('records_pc', 'records_rdp', foothold: OFFICE)
      assert_response :unprocessable_entity
      assert_equal 'saved_connection', body['kindRefused']
    end

    test 'step 6: an access list that refuses the account answers not permitted' do
      build
      hold('sam_fin_rdp_file')
      with_foothold
      body = cred_login('lena_pc', 'sam_fin_rdp', foothold: OFFICE)
      assert_response :unprocessable_entity
      assert_equal true, body['notPermitted']
      assert_equal Game::LOGIN_NOT_PERMITTED, body['message']
    end

    test 'step 7: a lockout refuses a saved connection with lockedOut but not an assist invite' do
      build('loginLockouts' => ['lena_pc|lfox', 'jake_pc|jbrooks'])
      hold('lena_rdp_file', 'jake_assist_code')
      with_foothold
      body = cred_login('lena_pc', 'lena_rdp', foothold: OFFICE)
      assert_response :unprocessable_entity
      assert_equal true, body['lockedOut']
      refute body.key?('attemptsLeft')

      assert_equal true, cred_login('jake_pc', 'jake_assist', relay: true)['success']
      assert_response :success
    end

    test 'step 8: an ended invite answers ended and stays ended after its global is cleared' do
      build('endedCredentials' => ['jake_assist'])
      hold('jake_assist_code')
      body = cred_login('jake_pc', 'jake_assist', relay: true)
      assert_response :unprocessable_entity
      assert_equal({ 'success' => false, 'ended' => true }, body)

      sync_globals(KS::END_GLOBAL => false)
      cred_login('jake_pc', 'jake_assist', relay: true)
      assert_response :unprocessable_entity
      assert_includes state['endedCredentials'], 'jake_assist'
    end

    # ---- step 9: the session ----------------------------------------------------------------

    test 'step 9: a saved connection over a foothold signs in as a remote credential session' do
      build
      hold('lena_rdp_file')
      with_foothold
      body = cred_login('lena_pc', 'lena_rdp', foothold: OFFICE)
      assert_response :success, response.body
      assert_equal 'credential', body['via']
      assert_equal 'saved_connection', body['kind']
      assert_equal 'HB-FIN-02.rdp', body['label']
      assert_equal({ 'foothold' => OFFICE }, body['route'])
      assert_equal true, body['remote']
      assert_equal OFFICE, body['footholdId']
      refute body.key?('endedPcIds')
      assert_equal({ 'id' => 'lena', 'via' => 'credential', 'credential' => 'lena_rdp', 'foothold' => OFFICE },
                   state['sessions']['lena_pc'])
      assert_includes state['signedInPcs'], 'lena_pc'
    end

    test 'step 9: a relay sign-in needs no foothold and leaves signedInPcs unchanged' do
      build
      hold('jake_assist_code')
      before = Array(state['signedInPcs']).dup
      body = cred_login('jake_pc', 'jake_assist', relay: true)
      assert_response :success, response.body
      assert_equal true, body['relay']
      assert_equal 'assist_invite', body['kind']
      assert_equal({ 'relay' => true }, body['route'])
      refute body.key?('remote')
      refute body.key?('footholdId')
      assert_equal({ 'id' => 'jake', 'via' => 'credential', 'credential' => 'jake_assist', 'relay' => true },
                   state['sessions']['jake_pc'])
      assert_equal before, Array(state['signedInPcs'])
    end

    test 'a relay sign-in that replaces a pivot ends the onward session and names it in endedPcIds' do
      build
      hold('jake_assist_code')
      with_foothold
      assert_equal true, sign_in('jake_pc', 'jbrooks', KS::JAKE_PASSWORD)['success'], response.body
      assert_equal true, sign_in('sv_fs02', 'ishaw', NetworkModelScenario::IAN_PASSWORD, foothold: OFFICE)['success'], response.body

      body = cred_login('jake_pc', 'jake_assist', relay: true)
      assert_response :success, response.body
      assert_equal ['sv_fs02'], body['endedPcIds']
      refute state['sessions'].key?('sv_fs02')
    end

    test 'a typed sign-in and an owner claim at the holder keyboard replace a relay session' do
      build
      hold('jake_assist_code')
      cred_login('jake_pc', 'jake_assist', relay: true)
      assert_response :success

      body = claim('jake_pc')
      assert_response :success, response.body
      assert_equal 'claim', state['sessions']['jake_pc']['via']
      refute body.key?('endedPcIds')

      post game_path('logout'), params: { pc_id: 'jake_pc' }, as: :json
      cred_login('jake_pc', 'jake_assist', relay: true)
      assert_response :success
      body = sign_in('jake_pc', 'jbrooks', KS::JAKE_PASSWORD)
      assert_response :success, response.body
      assert_equal({ 'id' => 'jake', 'via' => 'password' }, state['sessions']['jake_pc'])
      refute body.key?('endedPcIds')
    end

    # Plan 3.8 / deviation 1: every replacing sign-in prunes. The stale onward session is seeded (no
    # foothold is held, so nothing reaches server_net) and the sign-in replaces a session at jake_pc.
    # A claim replaces only a relay session (a held keyboard session is never replaced by one).
    def seed_stale_onward_session(jake_session)
      @game.player_state['sessions'] = {
        'jake_pc' => jake_session,
        'sv_fs02' => { 'id' => 'ian', 'via' => 'password', 'foothold' => OFFICE }
      }
      @game.save!
    end

    test 'a typed sign-in that replaces a session answers endedPcIds for what it pruned' do
      build
      seed_stale_onward_session({ 'id' => 'jake', 'via' => 'password' })
      body = sign_in('jake_pc', 'jbrooks', KS::JAKE_PASSWORD)
      assert_response :success, response.body
      assert_equal ['sv_fs02'], body['endedPcIds']
      refute state['sessions'].key?('sv_fs02')
    end

    test 'an owner claim that replaces a session answers endedPcIds for what it pruned' do
      build
      seed_stale_onward_session({ 'id' => 'jake', 'via' => 'credential', 'credential' => 'jake_assist', 'relay' => true })
      body = claim('jake_pc')
      assert_response :success, response.body
      assert_equal ['sv_fs02'], body['endedPcIds']
      refute state['sessions'].key?('sv_fs02')
    end

    test 'a typed sign-in that replaces a session but prunes nothing is byte-identical to a fresh one' do
      build
      sign_in('jake_pc', 'jbrooks', KS::JAKE_PASSWORD)
      assert_response :success
      fresh = response.body
      sign_in('jake_pc', 'jbrooks', KS::JAKE_PASSWORD)
      assert_response :success
      assert_equal fresh, response.body
      refute response.parsed_body.key?('endedPcIds')
    end

    # ---- dispatch ---------------------------------------------------------------------------

    test 'a typed body carrying relay, and a credential body carrying a username, get the generic refusal, uncounted' do
      build
      hold('lena_rdp_file')
      with_foothold
      before = counters
      body = sign_in_with('jake_pc', username: 'jbrooks', password: KS::JAKE_PASSWORD, relay: true)
      assert_equal({ 'success' => false, 'message' => Game::LOGIN_INCORRECT }, body)
      body = sign_in_with('lena_pc', credential: 'lena_rdp', username: 'lfox', foothold: OFFICE)
      assert_equal({ 'success' => false, 'message' => Game::LOGIN_INCORRECT }, body)
      body = sign_in_with('lena_pc', credential: 'lena_rdp', password: 'x', foothold: OFFICE)
      assert_equal({ 'success' => false, 'message' => Game::LOGIN_INCORRECT }, body)
      assert_equal before, counters
      assert_empty state['sessions']
    end

    test 'a body with claim and credential gets the claim refusal' do
      build
      hold('lena_rdp_file')
      body = sign_in_with('sam_pc', claim: 'owner', credential: 'lena_rdp')
      assert_response :unprocessable_entity
      assert_equal Game::LOGIN_CLAIM_REFUSED, body['message']
      assert_empty state['sessions']
    end

    def sign_in_with(pc_id, extra)
      post game_path('login'), params: { pc_id: pc_id }.merge(extra), as: :json
      response.parsed_body
    end

    # ---- desktops, reload and the view ----------------------------------------------------------

    test 'GET /container: relay=1 opens the relay desktop; no route and foothold= at a relay session are refused' do
      build
      hold('jake_assist_code')
      with_foothold
      cred_login('jake_pc', 'jake_assist', relay: true)
      assert_response :success

      body = get_container('jake_pc', relay: 1)
      assert_response :success, response.body
      assert_includes body['contents'].map { |c| c['id'] }, 'jake_notes'
      assert_equal true, body['session']['relay']

      get_container('jake_pc')
      assert_response :forbidden
      get_container('jake_pc', foothold: OFFICE)
      assert_response :forbidden
      get_container('jake_pc', relay: 1, foothold: OFFICE)
      assert_response :forbidden
      assert state['sessions']['jake_pc']['relay'], 'a refused request leaves the relay record'
    end

    test 'GET /container: relay=1 is refused without a relay session, and not_responding when the PC is off' do
      build
      hold('jake_assist_code')
      assert_equal true, sign_in('jake_pc', 'jbrooks', KS::JAKE_PASSWORD)['success']
      get_container('jake_pc', relay: 1)
      assert_response :forbidden
      assert_equal 'unreachable', response.parsed_body['reason']

      cred_login('jake_pc', 'jake_assist', relay: true)
      sync_globals(KS::JAKE_OFF_GLOBAL => true)
      get_container('jake_pc', relay: 1)
      assert_response :forbidden
      assert_equal 'not_responding', response.parsed_body['reason']
    end

    test 'reload ends a relay session, the bootstrap sessions omit it, and Connect works again' do
      build
      hold('jake_assist_code')
      cred_login('jake_pc', 'jake_assist', relay: true)
      assert_response :success

      sessions = bootstrap_scenario['sessions'] || {}
      refute sessions.key?('jake_pc')
      refute state['sessions'].key?('jake_pc')

      cred_login('jake_pc', 'jake_assist', relay: true)
      assert_response :success
    end

    test 'after reload a foothold credential session is reported with its route, kind and label' do
      build
      hold('lena_rdp_file')
      with_foothold
      cred_login('lena_pc', 'lena_rdp', foothold: OFFICE)
      assert_response :success

      entry = bootstrap_scenario['sessions']['lena_pc']
      assert_equal 'credential', entry['via']
      assert_equal true, entry['remote']
      assert_equal OFFICE, entry['footholdId']
      assert_equal 'saved_connection', entry['kind']
      assert_equal 'HB-FIN-02.rdp', entry['label']
      assert_equal 'credential', state['sessions']['lena_pc']['via'], 'a credential session survives reload'
    end

    test 'the network view lists a foothold credential session with its own via and never a relay session' do
      build
      hold('lena_rdp_file', 'jake_assist_code')
      with_foothold
      cred_login('lena_pc', 'lena_rdp', foothold: OFFICE)
      cred_login('jake_pc', 'jake_assist', relay: true)

      view = network_view(OFFICE)
      rows = view.to_json
      hosts = JSON.parse(rows)
      lena = find_host(hosts, 'lena_pc')
      jake = find_host(hosts, 'jake_pc')
      assert lena, 'lena_pc row'
      assert_equal 'credential', lena.dig('session', 'via')
      assert_equal true, lena.dig('session', 'remote')
      assert jake, 'jake_pc row'
      refute jake.key?('session'), 'a relay session is never offered in the view'
    end

    def find_host(node, id)
      case node
      when Hash
        return node if node['id'] == id && node['kind'] == 'pc'

        node.each_value do |v|
          found = find_host(v, id)
          return found if found
        end
      when Array
        node.each do |v|
          found = find_host(v, id)
          return found if found
        end
      end
      nil
    end

    test 'GET /keyring sends no targetOff when a credential has no routes' do
      build
      hold('lena_rdp_file')
      get game_path('keyring'), as: :json
      assert_response :success
      entry = response.parsed_body['entries'].find { |e| e['id'] == 'lena_rdp' }
      assert_equal [], entry['routes']
      refute entry.key?('targetOff')
    end

    # ---- carry-in m2: the take paths stamp a credential item ---------------------------------

    test 'a credential item taken from container contents is stamped and proves held' do
      build('unlockedObjects' => ['ops_crate'])
      post game_path('inventory'), params: { action_type: 'add', item: { type: 'text_file', id: 'ops_rdp_file', name: 'SV-FS02.rdp' } },
                                   as: :json
      assert_response :success, response.body
      entry = state['inventory'].find { |i| i['id'] == 'ops_rdp_file' }
      assert_equal 'ops_rdp', (entry['scenarioData'] || entry)['credential']
      get game_path('keyring'), as: :json
      assert_includes response.parsed_body['entries'].map { |e| e['id'] }, 'ops_rdp'
    end

    test 'a credential item received from an NPC itemsHeld is stamped and the invite signs in' do
      build
      post game_path('inventory'), params: { action_type: 'add', source_npc_id: 'jake',
                                             item: { type: 'text_file', id: 'jake_assist_code', name: 'Remote assist code' } },
                                   as: :json
      assert_response :success, response.body
      entry = state['inventory'].find { |i| i['id'] == 'jake_assist_code' }
      assert_equal 'jake_assist', (entry['scenarioData'] || entry)['credential']
      assert_equal true, cred_login('jake_pc', 'jake_assist', relay: true)['success'], response.body
    end
  end
end
