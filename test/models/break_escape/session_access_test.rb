require 'test_helper'
require_relative '../../support/keyring_login_scenario'

module BreakEscape
  # Ops S5a unit 02 (OPS_PRIVILEGE_ACCOUNTS_PLAN.md, the level helper): `session_access` reads the
  # level of the session held at a PC, on every read, from the account and the server's own record.
  # Sessions are made through the real routes where one exists (sign-in, lock, the borrow's done);
  # a few records that no route writes with the wanted shape are set by hand and say so.
  class SessionAccessTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    KS = KeyringLoginScenario
    NS = NetworkModelScenario
    OFFICE = KS::OFFICE

    # The admin marker on each account the tests use. sam, lena and jake are administrators;
    # ian is not.
    def admin_scenario(admins: %w[sam lena jake], marker: true, tokens: false)
      data = KS.scenario
      data['rooms'].each_value do |room|
        Array(room['npcs']).each do |npc|
          npc['creds']['admin'] = marker if npc['creds'].is_a?(Hash) && admins.include?(npc['id'])
        end
      end
      if tokens
        data['credentials']['lena_token'] = { 'kind' => 'token', 'account' => 'lena', 'connectsTo' => 'lena_pc',
                                              'proof' => { 'foothold' => OFFICE }, 'label' => 'HB-FIN-02 sign-in token',
                                              'expiresMin' => 4 }
      end
      data
    end

    def build(scenario = admin_scenario, player_state = {})
      build_network_game({ 'encounteredNPCs' => %w[sam lena ian jake], 'footholds' => KS.office_foothold }.merge(player_state),
                         scenario)
    end

    def state
      @game.reload.player_state
    end

    def game
      @game.reload
    end

    def level(pc_id)
      game.session_access(pc_id)
    end

    def sign_in_sam
      sign_in('sam_pc', 'sokafor', NS::SAM_PASSWORD)
    end

    def sign_in_jake
      sign_in('jake_pc', 'jbrooks', KS::JAKE_PASSWORD)
    end

    def keyring_in(credential, pc_id = 'lena_pc')
      post game_path('login'), params: { pc_id: pc_id, credential: credential, foothold: OFFICE }, as: :json
      response.parsed_body
    end

    def hold(*ids)
      @game.player_state['inventory'] = ids.map { |id| KS.held(id) }
      @game.save!
    end

    def set_session(pc_id, record)
      @game.reload
      @game.player_state['sessions'] = (@game.player_state['sessions'] || {}).merge(pc_id => record)
      @game.save!
    end

    def set_global(name, value)
      @game.reload
      @game.player_state['globalVariables'] = (@game.player_state['globalVariables'] || {}).merge(name => value)
      @game.save!
    end

    def lock(pc_id)
      post game_path('lock_session'), params: { pc_id: pc_id }, as: :json
      assert_response :success, response.body
    end

    def mirror(pc_id)
      bootstrap_scenario['sessions'][pc_id]
    end

    def host_held(pc_id)
      pc = game.find_login_pc(pc_id)[:object]
      game.send(:host_row, pc, OFFICE)['session']
    end

    # ---- the levels ---------------------------------------------------------------------------

    test 'a password sign-in is admin for an account marked creds.admin and user for one that is not' do
      build
      assert sign_in_sam['success']
      assert_equal 'admin', level('sam_pc')
      assert_equal 'admin', response.parsed_body['access']
      assert_equal 'admin', mirror('sam_pc')['access']

      build(admin_scenario(admins: %w[lena jake]))
      body = sign_in_sam
      assert body['success']
      assert_equal 'user', level('sam_pc')
      refute body.key?('access'), 'a user session sends no access'
      refute mirror('sam_pc').key?('access')
    end

    test 'creds.admin must be the literal true' do
      ['true', 1, 'yes', [true], { 'a' => 1 }].each do |marker|
        build(admin_scenario(marker: marker))
        body = sign_in_sam
        assert body['success'], marker.inspect
        assert_equal 'user', level('sam_pc'), "creds.admin #{marker.inspect}"
        refute body.key?('access'), "creds.admin #{marker.inspect}"
      end
    end

    test 'a keyring credential sign-in through a foothold is admin for an admin account' do
      build
      hold('lena_rdp_file')
      body = keyring_in('lena_rdp')
      assert body['success'], body.to_s
      assert_equal 'credential', state['sessions']['lena_pc']['via']
      assert_equal 'admin', level('lena_pc')
      assert_equal 'admin', body['access']
      assert_equal 'admin', mirror('lena_pc')['access']
      assert_equal 'admin', host_held('lena_pc')['access']
    end

    test 'a keyring credential sign-in of an account that is not an administrator is user' do
      build(admin_scenario(admins: %w[sam jake]))
      hold('lena_rdp_file')
      body = keyring_in('lena_rdp')
      assert body['success'], body.to_s
      assert_equal 'user', level('lena_pc')
      refute body.key?('access')
      refute host_held('lena_pc').key?('access')
    end

    test 'a token session of an admin account is admin' do
      build(admin_scenario(tokens: true))
      body = keyring_in('lena_token')
      assert body['success'], body.to_s
      assert_equal 'admin', level('lena_pc')
      assert_equal 'admin', body['access']
    end

    test 'an owner claim of an admin account and a guest claim are user sessions' do
      build
      post game_path('login'), params: { pc_id: 'jake_pc', claim: 'owner', globals: { 'screen_locked' => false } }, as: :json
      body = response.parsed_body
      assert body['success'], body.to_s
      assert_equal 'claim', state['sessions']['jake_pc']['via']
      assert_equal 'user', level('jake_pc')
      refute body.key?('access')
      refute game.send(:session_for_client, 'jake_pc').key?('access')
      # the guest claim leaves a record of the same shape, written by hand (it needs a borrow's done first)
      set_session('sam_pc', { 'id' => 'sam', 'via' => 'claim' })
      assert_equal 'user', level('sam_pc')
      refute game.send(:session_for_client, 'sam_pc').key?('access')
    end

    test 'a relay session of an admin account is user' do
      build
      set_session('jake_pc', { 'id' => 'jake', 'via' => 'credential', 'credential' => 'jake_assist', 'relay' => true })
      assert_equal 'user', level('jake_pc')
      refute game.send(:session_for_client, 'jake_pc').key?('access')
    end

    # ---- nothing held right now -----------------------------------------------------------------

    test 'no session, a locked session, an expired token, a downed route, an off PC and a missing account are nil' do
      build(admin_scenario(tokens: true))
      assert_nil level('sam_pc'), 'no record'

      assert sign_in_sam['success']
      assert_equal 'admin', level('sam_pc')
      lock('sam_pc')
      assert_nil level('sam_pc'), 'locked'
      refute game.send(:session_for_client, 'sam_pc').key?('access'), 'a locked entry sends no access'

      # route down: a foothold credential session whose foothold has gone
      hold('lena_rdp_file')
      assert keyring_in('lena_rdp')['success']
      assert_equal 'admin', level('lena_pc')
      @game.reload.player_state['footholds'] = {}
      @game.save!
      assert_nil level('lena_pc'), 'route down'
      refute_includes host_held_or_empty('lena_pc'), 'access'
    end

    test 'an expired token session is nil' do
      build(admin_scenario(tokens: true))
      assert keyring_in('lena_token')['success']
      assert_equal 'admin', level('lena_pc')
      @game.reload
      started = @game.player_state['sessions']['lena_pc']
      travel_to(Time.current + 2.hours) do
        assert_nil Game.find(@game.id).session_access('lena_pc'), started.to_s
        refute Game.find(@game.id).send(:session_for_client, 'lena_pc')
      end
    end

    test 'a PC whose service is off and an account that is gone are nil' do
      build
      assert sign_in_jake['success']
      assert_equal 'admin', level('jake_pc')
      set_global(KS::JAKE_OFF_GLOBAL, true)
      assert_nil level('jake_pc'), 'PC off'
      set_global(KS::JAKE_OFF_GLOBAL, false)
      assert_equal 'admin', level('jake_pc')

      set_session('jake_pc', { 'id' => 'ghost', 'via' => 'password' })
      assert_nil level('jake_pc'), 'account gone'
    end

    test 'the sign-in answer and the host row drop access once the route drops' do
      build
      hold('lena_rdp_file')
      assert keyring_in('lena_rdp')['success']
      assert_equal 'admin', host_held('lena_pc')['access']
      @game.reload.player_state['footholds'] = {}
      @game.save!
      refute game.send(:login_session_answer, game.scenario_room_npc('lena'), 'credential', pc_id: 'lena_pc',
                                                                                     foothold: OFFICE).key?('access')
      refute_includes host_held_or_empty('lena_pc'), 'access'
    end

    # ---- rebuilt records ------------------------------------------------------------------------

    test 'lock then unlock keeps admin' do
      build
      assert sign_in_sam['success']
      lock('sam_pc')
      assert_nil level('sam_pc')
      body = sign_in_sam
      assert body['success'], body.to_s
      assert_equal 'admin', level('sam_pc')
      assert_equal 'admin', body['access']
    end

    test 'switching user to a user account drops admin' do
      build(admin_scenario(admins: %w[sam]))
      assert sign_in_sam['success']
      assert_equal 'admin', level('sam_pc')
      body = sign_in('sam_pc', 'ishaw', NS::IAN_PASSWORD)
      assert body['success'], body.to_s
      assert_equal 'ian', state['sessions']['sam_pc']['id']
      assert_equal 'user', level('sam_pc')
      refute body.key?('access')
    end

    test 'a borrow that displaces a keyboard admin session drops it, and a remote admin session survives it' do
      build
      assert sign_in_sam['success']
      assert_equal 'admin', level('sam_pc')
      borrow_done!('sam_pc')
      refute_equal 'admin', level('sam_pc')

      # a remote (foothold) admin session on the same PC is not a keyboard session
      set_session('sam_pc', { 'id' => 'sam', 'via' => 'credential', 'credential' => 'lena_rdp', 'foothold' => OFFICE })
      before = state['sessions']['sam_pc']
      borrow_done!('sam_pc')
      assert_equal before, state['sessions']['sam_pc'], 'a remote record survives the borrow'
    end

    def borrow_done!(pc_id)
      g = Game.find(@game.id)
      ian = g.scenario_room_npc('ian').merge('habits' => { 'screen' => { 'lockChance' => 0 } })
      g.send(:record_borrow_done!, ian, { 'pc' => pc_id })
      g.save!
    end

    def host_held_or_empty(pc_id)
      pc = game.find_login_pc(pc_id)[:object]
      (game.send(:host_row, pc, OFFICE)['session'] || {}).keys
    end

    # ---- technique records ---------------------------------------------------------------------

    test 'a technique record is admin at access admin and user otherwise, whatever its account holds' do
      build
      set_session('lena_pc', { 'id' => 'lena', 'via' => 'technique', 'foothold' => OFFICE, 'access' => 'admin',
                               'technique' => 'lena_pc.door.a' })
      assert_equal 'admin', level('lena_pc')
      assert_equal 'admin', game.send(:session_for_client, 'lena_pc')['access']
      assert_equal 'admin', host_held('lena_pc')['access']

      # lena is an administrator, but a user-level record stays user
      set_session('lena_pc', { 'id' => 'lena', 'via' => 'technique', 'foothold' => OFFICE, 'access' => 'user',
                               'technique' => 'lena_pc.door.a' })
      assert_equal 'user', level('lena_pc')
      refute game.send(:session_for_client, 'lena_pc').key?('access')
      refute host_held('lena_pc').key?('access')

      set_session('lena_pc', { 'id' => 'lena', 'via' => 'technique', 'foothold' => OFFICE, 'access' => true })
      assert_equal 'user', level('lena_pc'), 'only the exact string admin counts'
    end

    test 'a password sign-in that replaces a technique admin record takes the account level' do
      build(admin_scenario(admins: %w[lena]))
      set_session('jake_pc', { 'id' => 'jake', 'via' => 'technique', 'foothold' => OFFICE, 'access' => 'admin',
                               'technique' => 'jake_pc.door.a' })
      assert_equal 'admin', level('jake_pc')
      body = sign_in_jake
      assert body['success'], body.to_s
      assert_equal 'password', state['sessions']['jake_pc']['via']
      assert_equal 'user', level('jake_pc')
      refute body.key?('access')
    end

    test 'a stored access on a password, credential or claim record is ignored' do
      build(admin_scenario(admins: %w[lena]))
      set_session('jake_pc', { 'id' => 'jake', 'via' => 'password', 'access' => 'admin' })
      assert_equal 'user', level('jake_pc')
      set_session('jake_pc', { 'id' => 'jake', 'via' => 'claim', 'access' => 'admin' })
      assert_equal 'user', level('jake_pc')
      set_session('lena_pc', { 'id' => 'sam', 'via' => 'credential', 'credential' => 'sam_fin_rdp', 'foothold' => OFFICE,
                               'access' => 'admin' })
      assert_equal 'user', level('lena_pc')
      refute game.send(:session_for_client, 'jake_pc').key?('access')
    end

    test 'an unknown or missing via is a user session' do
      build
      set_session('jake_pc', { 'id' => 'jake', 'via' => 'mystery' })
      assert_equal 'user', level('jake_pc')
      set_session('jake_pc', { 'id' => 'jake' })
      assert_equal 'user', level('jake_pc')
    end

    test 'an admin account at a PC whose access list refuses it is never admin' do
      build
      # lena is an administrator, jake_pc admits only jake
      set_session('jake_pc', { 'id' => 'lena', 'via' => 'password' })
      assert_equal 'user', level('jake_pc')
      refute game.account_admin_at?(game.scenario_room_npc('lena'), game.find_login_pc('jake_pc')[:object])
      assert game.account_admin_at?(game.scenario_room_npc('jake'), game.find_login_pc('jake_pc')[:object])
    end

    # ---- the predicates ---------------------------------------------------------------------------

    test 'session_admin? and keyboard_admin?' do
      build
      assert sign_in_sam['success']
      assert game.session_admin?('sam_pc')
      assert game.keyboard_admin?('sam_pc')
      refute game.session_admin?('jake_pc')
      refute game.keyboard_admin?('jake_pc')

      hold('lena_rdp_file')
      assert keyring_in('lena_rdp')['success']
      assert game.session_admin?('lena_pc')
      refute game.keyboard_admin?('lena_pc'), 'a foothold session is not at the keyboard'

      set_session('jake_pc', { 'id' => 'jake', 'via' => 'password', 'from' => 'sam_pc' })
      assert game.session_admin?('jake_pc')
      refute game.keyboard_admin?('jake_pc'), 'a from session is not at the keyboard'

      lock('sam_pc')
      refute game.keyboard_admin?('sam_pc')
    end

    test 'client_access_level answers the same level, nil when nothing is held' do
      build
      assert_nil game.send(:client_access_level, 'sam_pc')
      assert sign_in_sam['success']
      assert_equal 'admin', game.send(:client_access_level, 'sam_pc')
    end
  end
end
