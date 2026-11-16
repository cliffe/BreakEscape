require 'test_helper'
require_relative '../../support/keyring_login_scenario'
require_relative '../../support/access_work_scenario'

module BreakEscape
  # Keyring K4 (docs/achitechture/CREDENTIAL_KEYRING_PLAN.md 9, 3.7 and 3.8): the `from: pcId`
  # route, a sign-in made from a desktop the player holds, through the real routes. The source
  # checks, the prune when a source ends (logout, unplug, reload, a borrow), the chain and cycle
  # rules, remote: "blocked" on source and target, reach two links away, the reach cache, hostile
  # `from` values and the scope rule (no `from` in a scenario without credentials).
  class CredentialFromRouteTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests
    include ActiveSupport::Testing::TimeHelpers

    KS = KeyringLoginScenario
    NS = NetworkModelScenario
    OFFICE = KS::OFFICE
    GENERIC = { 'success' => false, 'message' => Game::LOGIN_INCORRECT }.freeze

    # The keyring fixture plus vault_net, linked from server_net only (two links from office_lan),
    # with vault_pc on it for Ian, and a Documents folder on Lena's desktop.
    def scenario
      data = KS.scenario
      data['networks']['vault_net'] = { 'name' => 'Vault network' }
      data['networkLinks'] << %w[server_net vault_net]
      data['rooms']['server_room']['objects'] << {
        'id' => 'vault_pc', 'type' => 'pc', 'name' => 'Vault PC', 'host' => 'SV-VAULT-01', 'network' => 'vault_net',
        'locked' => true, 'lockType' => 'login', 'access' => { 'roles' => ['it'] }
      }
      lena = data['rooms'].values.flat_map { |r| Array(r['objects']) }.find { |o| o['id'] == 'lena_pc' }
      lena['contents'] = Array(lena['contents']) + [
        { 'id' => 'lena_docs', 'type' => 'folder', 'name' => 'Documents', 'locked' => false,
          'contents' => [{ 'id' => 'lena_doc', 'type' => 'text_file', 'name' => 'doc.txt', 'takeable' => false, 'text' => 'doc' }] }
      ]
      data
    end

    def build(player_state = {}, data = scenario)
      build_network_game({ 'encounteredNPCs' => %w[sam lena ian jake] }.merge(player_state), data)
    end

    def state
      @game.reload.player_state
    end

    def hold(*ids)
      @game.player_state['inventory'] = Array(@game.player_state['inventory']) + ids.map { |id| KS.held(id) }
      @game.save!
    end

    def seed_sessions(sessions)
      @game.player_state['sessions'] = sessions
      @game.player_state['signedInPcs'] = sessions.reject { |_k, v| v['relay'] }.keys
      @game.save!
    end

    def set_global(name, value)
      @game.reload
      @game.player_state['globalVariables'] = (@game.player_state['globalVariables'] || {}).merge(name => value)
      @game.save!
    end

    def login(params)
      post game_path('login'), params: params, as: :json
      response.parsed_body
    end

    def typed_from(pc_id, username, password, from)
      login(pc_id: pc_id, username: username, password: password, from: from)
    end

    def cred_login(pc_id, credential, extra = {})
      login({ pc_id: pc_id, credential: credential }.merge(extra))
    end

    def get_json(suffix, params = {})
      get game_path(suffix), params: params
      response.parsed_body
    end

    def login_accounts(pc_id, params = {})
      get_json('login_accounts', { pc_id: pc_id }.merge(params))
    end

    def keyring(params = {})
      get_json('keyring', params)
    end

    def get_container(id, params = {})
      get_json("container/#{id}", params)
    end

    def logout(pc_id)
      post game_path('logout'), params: { pc_id: pc_id }, as: :json
      response.parsed_body
    end

    def counters
      s = state
      [s['loginFailures'], s['loginLockouts']]
    end

    # Sam's keyboard session at sam_pc (HB-DESK-01, office_lan), no drop box anywhere
    def sam_at_keyboard
      body = sign_in('sam_pc', 'sokafor', NS::SAM_PASSWORD)
      assert_equal true, body['success'], response.body
    end

    def lena_from_sam
      sam_at_keyboard
      body = typed_from('lena_pc', 'lfox', NS::LENA_PASSWORD, 'sam_pc')
      assert_response :success, response.body
      body
    end

    # ---- route checks and the session answer ---------------------------------------------

    test 'a typed sign-in from a held keyboard desktop records from and answers remote with both labels' do
      build
      body = lena_from_sam
      assert_equal true, body['success']
      assert_equal true, body['remote']
      assert_equal 'sam_pc', body['fromPcId']
      assert_equal 'HB-FIN-02', body['host']
      assert_equal 'HB-DESK-01', body['fromHost']
      refute body.key?('footholdId')
      assert_equal({ 'id' => 'lena', 'via' => 'password', 'from' => 'sam_pc' }, state['sessions']['lena_pc'])
      assert_includes state['signedInPcs'], 'lena_pc'
    end

    test 'a credential sign-in from a desktop answers route from and the session carries it' do
      build
      hold('lena_rdp_file')
      sam_at_keyboard
      body = cred_login('lena_pc', 'lena_rdp', from: 'sam_pc')
      assert_response :success, response.body
      assert_equal({ 'from' => 'sam_pc' }, body['route'])
      assert_equal 'sam_pc', body['fromPcId']
      assert_equal 'saved_connection', body['kind']
      assert_equal 'sam_pc', state['sessions']['lena_pc']['from']
      assert_equal 'lena_rdp', state['sessions']['lena_pc']['credential']
    end

    test 'the from desktop opens with the same from, and no route, another source or a foothold is refused' do
      build
      lena_from_sam
      body = get_container('lena_pc', from: 'sam_pc')
      assert_response :success, response.body
      assert_equal 'sam_pc', body['session']['fromPcId']
      assert_equal 'HB-DESK-01', body['session']['fromHost']

      get_container('lena_pc')
      assert_response :forbidden, 'the keyboard is never the route to a remote desktop behind a locked door'
      get_container('lena_pc', from: 'jake_pc')
      assert_response :forbidden
      take_drop_box
      plant('comms_port')
      body = get_container('lena_pc', foothold: OFFICE)
      assert_response :forbidden
      assert_equal 'unreachable', body['reason']
      get_container('lena_pc', from: 'sam_pc', foothold: OFFICE)
      assert_response :forbidden
      assert_equal 'sam_pc', state['sessions']['lena_pc']['from'], 'refusals never rewrite the record'
    end

    test 'a folder under a from desktop opens with from= and is refused without it' do
      build
      lena_from_sam
      body = get_container('lena_docs', from: 'sam_pc')
      assert_response :success, response.body
      assert_equal ['lena_doc'], body['contents'].map { |c| c['id'] }
      get_container('lena_docs', from: 'jake_pc')
      assert_response :forbidden
      get_container('lena_docs', relay: 1)
      assert_response :forbidden
    end

    test 'GET /keyring lists a from route for a held source and scopes pc_id only when the from route holds' do
      build
      hold('lena_rdp_file')
      entry = keyring['entries'].find { |e| e['id'] == 'lena_rdp' }
      assert_equal [], entry['routes']
      sam_at_keyboard
      entry = keyring['entries'].find { |e| e['id'] == 'lena_rdp' }
      assert_equal [{ 'from' => 'sam_pc' }], entry['routes']

      scoped = keyring(pc_id: 'lena_pc', from: 'sam_pc')['entries'].find { |e| e['id'] == 'lena_rdp' }
      assert_equal true, scoped['forThisPc']
      unscoped = keyring(pc_id: 'lena_pc', from: 'jake_pc')['entries'].find { |e| e['id'] == 'lena_rdp' }
      refute unscoped.key?('forThisPc'), 'a source the player does not hold does not scope'
    end

    test 'GET /keyring lists foothold routes first, then from routes sorted by PC id' do
      build
      hold('lena_rdp_file')
      sam_at_keyboard
      assert_equal true, sign_in('jake_pc', 'jbrooks', KS::JAKE_PASSWORD)['success'], response.body
      take_drop_box
      plant('comms_port')
      entry = keyring['entries'].find { |e| e['id'] == 'lena_rdp' }
      assert_equal [{ 'foothold' => OFFICE }, { 'from' => 'jake_pc' }, { 'from' => 'sam_pc' }], entry['routes']
    end

    test 'GET /login_accounts with from answers the target tiles and refuses a source the player does not hold' do
      build
      sam_at_keyboard
      body = login_accounts('lena_pc', from: 'sam_pc')
      assert_response :success, response.body
      assert_equal 'lena_pc', body['pc_id']
      assert_equal 'HB-FIN-02', body['host']
      refute_includes response.body, NS::LENA_PASSWORD
      refute body.key?('postIt')

      login_accounts('lena_pc', from: 'jake_pc')
      assert_response :forbidden
      login_accounts('lena_pc', from: 'sam_pc', foothold: OFFICE)
      assert_response :bad_request
    end

    # ---- the source ends: logout, power, reload ------------------------------------------

    test 'logging out of the source ends the from session and names it in endedPcIds' do
      build
      lena_from_sam
      body = logout('sam_pc')
      assert_response :success
      assert_equal ['lena_pc'], body['endedPcIds']
      assert_empty state['sessions']
    end

    test 'a source PC switched off refuses the desktop and scoped requests, and allows them when it is back' do
      build
      hold('lena_rdp_file')
      assert_equal true, sign_in('jake_pc', 'jbrooks', KS::JAKE_PASSWORD)['success'], response.body
      assert_equal true, typed_from('lena_pc', 'lfox', NS::LENA_PASSWORD, 'jake_pc')['success'], response.body

      set_global(KS::JAKE_OFF_GLOBAL, true)
      body = get_container('lena_pc', from: 'jake_pc')
      assert_response :forbidden
      assert_equal 'unreachable', body['reason'], 'the target is on; only the route is down'
      get_container('lena_docs', from: 'jake_pc')
      assert_response :forbidden
      login_accounts('lena_pc', from: 'jake_pc')
      assert_response :forbidden
      refute keyring(pc_id: 'lena_pc', from: 'jake_pc')['entries'].find { |e| e['id'] == 'lena_rdp' }.key?('forThisPc')
      typed_from('lena_pc', 'lfox', NS::LENA_PASSWORD, 'jake_pc')
      assert_response :forbidden
      assert_equal 'jake_pc', state['sessions']['lena_pc']['from'], 'power never prunes'

      set_global(KS::JAKE_OFF_GLOBAL, false)
      get_container('lena_pc', from: 'jake_pc')
      assert_response :success, response.body
      login_accounts('lena_pc', from: 'jake_pc')
      assert_response :success
      assert_equal true, keyring(pc_id: 'lena_pc', from: 'jake_pc')['entries'].find { |e| e['id'] == 'lena_rdp' }['forThisPc']
    end

    test 'a target switched off answers not_responding when the route holds' do
      build
      assert_equal true, sign_in('sam_pc', 'sokafor', NS::SAM_PASSWORD)['success'], response.body
      assert_equal true, typed_from('jake_pc', 'jbrooks', KS::JAKE_PASSWORD, 'sam_pc')['success'], response.body
      set_global(KS::JAKE_OFF_GLOBAL, true)
      body = get_container('jake_pc', from: 'sam_pc')
      assert_response :forbidden
      assert_equal 'not_responding', body['reason']
      body = login_accounts('jake_pc', from: 'sam_pc')
      assert_response :forbidden
      assert_equal 'not_responding', body['reason']
    end

    test 'a from session survives reload and is reported as remote' do
      build
      lena_from_sam
      sessions = bootstrap_scenario['sessions']
      assert_equal true, sessions['lena_pc']['remote']
      assert_equal 'sam_pc', sessions['lena_pc']['fromPcId']
      assert_equal 'HB-DESK-01', sessions['lena_pc']['fromHost']
      refute sessions['lena_pc'].key?('footholdId')
      assert_equal 'sam_pc', state['sessions']['lena_pc']['from']
    end

    test 'a claimed source ends on reload and the chain beyond it with it' do
      build
      seed_sessions(
        'sam_pc' => { 'id' => 'sam', 'via' => 'claim' },
        'lena_pc' => { 'id' => 'lena', 'via' => 'password', 'from' => 'sam_pc' },
        'sv_fs02' => { 'id' => 'ian', 'via' => 'password', 'from' => 'lena_pc' }
      )
      sessions = bootstrap_scenario['sessions']
      refute sessions.key?('lena_pc'), 'the bootstrap never hands out a session the same request ends'
      refute sessions.key?('sv_fs02')
      assert_empty state['sessions']
    end

    # ---- relay rules -----------------------------------------------------------------------

    test 'an assist invite never takes a from route' do
      build
      hold('jake_assist_code')
      sam_at_keyboard
      assert_equal GENERIC, cred_login('jake_pc', 'jake_assist', from: 'sam_pc')
      assert_response :unprocessable_entity
      refute state['sessions'].key?('jake_pc')
    end

    test 'a relay session is never a from source: ops_rdp from jake_pc during the relay is refused' do
      build
      hold('jake_assist_code', 'ops_rdp_file')
      assert_equal true, cred_login('jake_pc', 'jake_assist', relay: true)['success'], response.body
      before = counters
      assert_equal GENERIC, cred_login('sv_fs02', 'ops_rdp', from: 'jake_pc')
      assert_response :unprocessable_entity
      assert_equal GENERIC, typed_from('sv_fs02', 'ishaw', NS::IAN_PASSWORD, 'jake_pc')
      login_accounts('sv_fs02', from: 'jake_pc')
      assert_response :forbidden
      refute keyring['entries'].find { |e| e['id'] == 'ops_rdp' }['routes'].include?('from' => 'jake_pc')
      assert_equal before, counters
      refute state['sessions'].key?('sv_fs02')
    end

    # ---- unplug and borrow -------------------------------------------------------------------

    test 'plant, .rdp to HB-FIN-02, typed SV-FS02 from lena_pc, unplug: both end and endedPcIds names both' do
      build
      hold('lena_rdp_file')
      take_drop_box
      plant('comms_port')
      assert_equal true, cred_login('lena_pc', 'lena_rdp', foothold: OFFICE)['success'], response.body
      body = typed_from('sv_fs02', 'ishaw', NS::IAN_PASSWORD, 'lena_pc')
      assert_response :success, response.body
      assert_equal 'lena_pc', body['fromPcId']

      body = unplug('comms_port')
      assert_response :success, response.body
      assert_equal %w[lena_pc sv_fs02], Array(body['endedPcIds']).sort
      assert_empty state['sessions']
    end

    # The access-work fixture on one network, with a registry so `from` is in scope: the player's
    # keyboard session at the hot desk is the source of a session at dana_pc. Ian's borrow of the
    # hot desk ends the source, and the answer names dana_pc.
    def borrow_scenario
      data = AccessWorkScenario.scenario
      data['globalVariables'].merge!('ian_pc_unplugged' => true)
      data['networks'] = { 'office_lan' => { 'name' => 'Office network' } }
      data['rooms'].each_value do |room|
        Array(room['objects']).each { |o| o.merge!('network' => 'office_lan', 'host' => o['id'].upcase) if o['type'] == 'pc' }
      end
      ian = data['rooms'].values.flat_map { |r| Array(r['npcs']) }.find { |n| n['id'] == 'ian' }
      ian['workarounds'] = [{ 'at' => 40, 'do' => 'borrow_session', 'pc' => 'hot_desk' }]
      (ian['habits'] ||= {})['screen'] = { 'lockChance' => 0 }
      data['credentials'] = { 'spare_note' => { 'kind' => 'password', 'account' => 'dana', 'proof' => { 'session' => 'dana_pc' } } }
      data
    end

    def ian_fail
      post npc_frustration_game_url(@game), params: { reports: [{ npc_id: 'ian', event: 'fail', need: 'work', object_id: 'ian_pc',
                                                                 missing: [{ id: 'ian_pc', why: 'off' }] }] }, as: :json
      response.parsed_body['answers'].first
    end

    test 'a borrow that ends a source answers endedPcIds, and a resend answers without it' do
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user), scenario: borrow_scenario,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby office],
                        'encounteredNPCs' => %w[dana kai ian amy omar temp_user],
                        'globalVariables' => { 'ian_pc_unplugged' => true },
                        'sessions' => { 'hot_desk' => { 'id' => 'temp_user', 'via' => 'password' },
                                        'dana_pc' => { 'id' => 'dana', 'via' => 'password', 'from' => 'hot_desk' } } }
      )
      t = Time.current
      run = nil
      2.times { |i| travel_to(t + (i * 25)) { run = ian_fail['run'] } }
      assert_equal 'borrow_session', run['do']
      done = lambda do |at|
        travel_to(at) { post npc_workaround_game_url(@game), params: { npc_id: 'ian', index: run['index'], hand: run['hand'] }, as: :json }
        response.parsed_body
      end
      body = done.call(t + 60)
      assert_response :success, response.body
      assert_equal ['dana_pc'], body['endedPcIds']
      assert_nil state['sessions']['hot_desk']
      assert_nil state['sessions']['dana_pc']
      refute done.call(t + 61).key?('endedPcIds'), 'a resend answers from lastSpent without it'
    end

    # ---- chains, self, cycles ------------------------------------------------------------

    test 'the target is never its own source' do
      build
      sam_at_keyboard
      assert_equal GENERIC, typed_from('sam_pc', 'sokafor', NS::SAM_PASSWORD, 'sam_pc')
      assert_response :unprocessable_entity
      login_accounts('sam_pc', from: 'sam_pc')
      assert_response :forbidden
      assert_equal({ 'id' => 'sam', 'via' => 'password' }, state['sessions']['sam_pc'])
    end

    test 'B from A then A from B is refused' do
      build
      lena_from_sam
      before = counters
      assert_equal GENERIC, typed_from('sam_pc', 'sokafor', NS::SAM_PASSWORD, 'lena_pc')
      assert_response :unprocessable_entity
      assert_equal before, counters
      assert_equal({ 'id' => 'sam', 'via' => 'password' }, state['sessions']['sam_pc'])
    end

    test 'a cycle written straight into state is pruned and never handed to the client' do
      build
      seed_sessions(
        'sam_pc' => { 'id' => 'sam', 'via' => 'password', 'from' => 'lena_pc' },
        'lena_pc' => { 'id' => 'lena', 'via' => 'password', 'from' => 'sam_pc' },
        'jake_pc' => { 'id' => 'jake', 'via' => 'password' }
      )
      refute bootstrap_scenario['sessions'].key?('lena_pc')
      body = logout('jake_pc')
      assert_equal %w[lena_pc sam_pc], Array(body['endedPcIds']).sort
      assert_empty state['sessions']
    end

    # ---- remote: "blocked" ------------------------------------------------------------------

    test 'a source with remote blocked does not block; a target with it does' do
      build
      assert_equal true, sign_in('kiosk_pc', 'sokafor', NS::SAM_PASSWORD)['success'], response.body
      body = typed_from('lena_pc', 'lfox', NS::LENA_PASSWORD, 'kiosk_pc')
      assert_response :success, response.body
      assert_equal 'kiosk_pc', body['fromPcId']

      sam_at_keyboard
      logout('kiosk_pc')
      body = typed_from('kiosk_pc', 'sokafor', NS::SAM_PASSWORD, 'sam_pc')
      assert_response :unprocessable_entity
      assert_equal true, body['remoteBlocked']
      body = login_accounts('kiosk_pc', from: 'sam_pc')
      assert_response :unprocessable_entity
      assert_equal true, body['remoteBlocked']
    end

    # ---- reach -------------------------------------------------------------------------------

    test 'a keyboard session on office_lan with no session on server_net cannot reach a host two links away' do
      build
      sam_at_keyboard
      body = typed_from('vault_pc', 'ishaw', NS::IAN_PASSWORD, 'sam_pc')
      assert_response :forbidden
      assert_equal 'PC not reachable', body['message']
      login_accounts('vault_pc', from: 'sam_pc')
      assert_response :forbidden

      assert_equal true, typed_from('sv_fs02', 'ishaw', NS::IAN_PASSWORD, 'sam_pc')['success'], 'one link away is in reach'
      assert_equal true, typed_from('vault_pc', 'ishaw', NS::IAN_PASSWORD, 'sam_pc')['success'],
                   'a session on server_net is the pivot that reaches vault_net'
      assert_equal 'sam_pc', state['sessions']['vault_pc']['from']
    end

    test 'the from_reach cache key changes when a from session is added or ended' do
      build
      sam_at_keyboard
      game = Game.find(@game.id)
      refute_includes game.from_reach('office_lan', ignore_outages: false), 'vault_net'
      game.player_state['sessions']['sv_fs02'] = { 'id' => 'ian', 'via' => 'password', 'from' => 'sam_pc' }
      assert_includes game.from_reach('office_lan', ignore_outages: false), 'vault_net', 'a new pivot session is seen in the same request'
      game.player_state['sessions'].delete('sv_fs02')
      refute_includes game.from_reach('office_lan', ignore_outages: false), 'vault_net', 'an ended one is seen too'
    end

    # ---- hostile from values -------------------------------------------------------------------

    HOSTILE = [['sam_pc'], { 'a' => 'b' }, 'x' * 80, ' ', "\t", 'no_such_pc', 'lena_pc'].freeze

    test 'hostile from values on POST typed and credential are refused, uncounted, and write nothing' do
      build
      hold('lena_rdp_file')
      sam_at_keyboard
      before = counters
      HOSTILE.each do |from|
        typed = typed_from('lena_pc', 'lfox', NS::LENA_PASSWORD, from)
        cred = cred_login('lena_pc', 'lena_rdp', from: from)
        if from == 'no_such_pc'
          assert_equal 403, response.status
          assert_equal 'PC not reachable', cred['message']
          assert_equal 'PC not reachable', typed['message']
        else
          assert_equal 422, response.status, from.inspect
          assert_equal GENERIC, typed, from.inspect
          assert_equal GENERIC, cred, from.inspect
        end
      end
      assert_equal before, counters
      assert_equal ['sam_pc'], state['sessions'].keys
    end

    test 'hostile from values on GET /login_accounts, /keyring and /container are refused' do
      build
      hold('lena_rdp_file')
      lena_from_sam
      HOSTILE.each do |from|
        login_accounts('lena_pc', from: from)
        assert_includes [400, 403], response.status, "login_accounts #{from.inspect}"
        refute_includes response.body, 'loginAccounts'

        body = keyring(pc_id: 'lena_pc', from: from)
        if response.status == 200
          refute body['entries'].find { |e| e['id'] == 'lena_rdp' }.key?('forThisPc'), "keyring #{from.inspect}"
        else
          assert_equal 400, response.status, "keyring #{from.inspect}"
        end

        get_container('lena_pc', from: from)
        assert_response :forbidden, "container #{from.inspect}"
        get_container('lena_docs', from: from)
        assert_response :forbidden, "folder #{from.inspect}"
      end
      login_accounts('lena_pc', from: ['sam_pc'])
      assert_response :bad_request
      login_accounts('lena_pc', from: 'x' * 80)
      assert_response :bad_request
      keyring(pc_id: 'lena_pc', from: { 'a' => 'b' })
      assert_response :bad_request
      assert_equal 'sam_pc', state['sessions']['lena_pc']['from']
    end

    test 'a claim that names a from source gets the claim refusal' do
      build
      sam_at_keyboard
      body = login(pc_id: 'jake_pc', claim: 'owner', from: 'sam_pc')
      assert_response :unprocessable_entity
      assert_equal Game::LOGIN_CLAIM_REFUSED, body['message']
      refute state['sessions'].key?('jake_pc')
    end

    # ---- the display-only connect marker (plan 9 Client) ------------------------------------

    def find_all(node, id, out = [])
      case node
      when Hash
        out << node if node['id'] == id
        node.each_value { |v| find_all(v, id, out) }
      when Array
        node.each { |v| find_all(v, id, out) }
      end
      out
    end

    def marker_scenario
      data = scenario
      lobby = data['rooms']['lobby']
      # A forged marker on an item with no credential, and one on a password note, never ship
      lobby['objects'] << { 'id' => 'decoy_note', 'type' => 'text_file', 'name' => 'decoy.txt', 'takeable' => true,
                            'connect' => true, 'text' => 'decoy' }
      lobby['objects'] << { 'id' => 'pw_note', 'type' => 'text_file', 'name' => 'pw.txt', 'takeable' => true,
                            'credential' => 'jake_pw_note', 'connect' => true, 'text' => 'pw' }
      data
    end

    def assert_marker(items, connect, context)
      refute_empty items, context
      items.each do |item|
        refute item.key?('credential'), "#{context}: the credential id never ships"
        if connect
          assert_equal true, item['connect'], context
        else
          refute item.key?('connect'), context
        end
      end
    end

    test 'a served saved connection carries connect true and no credential id; other items carry no connect' do
      build({}, marker_scenario)
      get room_game_url(@game, room_id: 'lobby'), as: :json
      assert_response :success
      room = response.parsed_body
      assert_marker(find_all(room, 'lena_rdp_file'), true, 'room lena_rdp_file')
      assert_marker(find_all(room, 'ops_rdp_file'), true, 'room ops_rdp_file in the crate')
      assert_marker(find_all(room, 'decoy_note'), false, 'room decoy_note')
      assert_marker(find_all(room, 'pw_note'), false, 'room pw_note (a password kind)')
      refute_includes response.body, 'lena_rdp"', 'the credential id is in no room answer'

      body = add_item('text_file', 'lena_rdp_file', 'HB-FIN-02.rdp')
      assert_response :success, response.body
      assert_marker(find_all(body, 'lena_rdp_file'), true, 'take answer')
      refute_includes response.body, 'lena_rdp"'
      hold('jake_assist_code')
      boot = bootstrap_scenario
      assert_marker(find_all(boot['inventory'] || boot, 'lena_rdp_file'), true, 'bootstrap inventory')
      assert_marker(find_all(boot['inventory'] || boot, 'jake_assist_code'), false, 'an assist invite')
      assert_equal 'lena_rdp', state['inventory'].find { |i| i['id'] == 'lena_rdp_file' }['credential'],
                   'the stored copy keeps its credential and gains no marker'
      refute state['inventory'].find { |i| i['id'] == 'lena_rdp_file' }.key?('connect')
    end

    # ---- scope: no credentials registry ------------------------------------------------------

    test 'a from param in a scenario without credentials is refused on every route' do
      build({}, NS.with_pivot)
      sam_at_keyboard
      before = counters
      assert_equal GENERIC, typed_from('lena_pc', 'lfox', NS::LENA_PASSWORD, 'sam_pc')
      assert_response :unprocessable_entity
      assert_equal GENERIC, cred_login('lena_pc', 'anything', from: 'sam_pc')
      assert_response :unprocessable_entity
      login_accounts('lena_pc', from: 'sam_pc')
      assert_response :bad_request
      keyring(pc_id: 'lena_pc', from: 'sam_pc')
      assert_response :bad_request
      assert_equal before, counters
      assert_equal ['sam_pc'], state['sessions'].keys

      # A record written straight into state (as no route could) still never opens by from=
      seed_sessions('sam_pc' => { 'id' => 'sam', 'via' => 'password' },
                    'lena_pc' => { 'id' => 'lena', 'via' => 'password', 'from' => 'sam_pc' })
      get_container('lena_pc', from: 'sam_pc')
      assert_response :forbidden
    end
  end
end
