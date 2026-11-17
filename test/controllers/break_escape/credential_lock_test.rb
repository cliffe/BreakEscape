require 'test_helper'
require_relative '../../support/keyring_login_scenario'

module BreakEscape
  # Keyring K-lock (docs/achitechture/CREDENTIAL_KEYRING_PLAN.md 8.6): UI slice 6's session lock
  # widened from password sign-ins to `via: "credential"` sessions opened over a foothold or a
  # `from` route (a token session included); never a relay. Through the real routes: the lock
  # and its delta, every read path treating the locked session as signed out, the two ways back
  # in (the account's password, counted; a fresh sign-in with the same credential, not counted),
  # GET /keyring's sessionHeld, the token's clock and the relay refusal.
  class CredentialLockTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    KS = KeyringLoginScenario
    NS = NetworkModelScenario
    OFFICE = KS::OFFICE
    T0 = Time.utc(2026, 11, 17, 10, 0, 0)

    # The K2 fixture plus Lena's token (proof: the comms room jack), a Documents folder and a
    # locked safe on Lena's desktop, and an open share on server_net that Lena's PC bridges to.
    def scenario
      data = KS.scenario
      data['credentials']['lena_token'] = {
        'kind' => 'token', 'account' => 'lena', 'connectsTo' => 'lena_pc',
        'proof' => { 'foothold' => OFFICE }, 'label' => 'HB-FIN-02 sign-in token', 'expiresMin' => 4
      }
      lena = data['rooms'].values.flat_map { |r| Array(r['objects']) }.find { |o| o['id'] == 'lena_pc' }
      lena['contents'] = Array(lena['contents']) + [
        { 'id' => 'lena_docs', 'type' => 'folder', 'name' => 'Documents', 'locked' => false,
          'contents' => [{ 'id' => 'lena_doc', 'type' => 'text_file', 'name' => 'doc.txt', 'takeable' => false, 'text' => 'doc' }] },
        { 'id' => 'lena_safe', 'type' => 'safe', 'name' => 'Expenses safe', 'locked' => true,
          'lockType' => 'pin', 'requires' => '2468', 'contents' => [] }
      ]
      data['resources']['server_public'] = {
        'kind' => 'file_share', 'name' => 'Server-Public', 'host' => NS::SV_HOST, 'network' => 'server_net',
        'contents' => [{ 'id' => 'server_pub_note', 'type' => 'text_file', 'name' => 'public.txt',
                         'takeable' => true, 'text' => 'SERVER-PUBLIC-TEXT-5501' }]
      }
      data
    end

    def build(player_state = {})
      build_network_game({ 'encounteredNPCs' => %w[sam lena ian jake] }.merge(player_state), scenario)
    end

    def state
      @game.reload.player_state
    end

    def hold(*ids)
      @game.reload
      @game.player_state['inventory'] = Array(@game.player_state['inventory']) + ids.map { |id| KS.held(id) }
      @game.save!
    end

    def login(params)
      post game_path('login'), params: params, as: :json
      response.parsed_body
    end

    def cred_login(pc_id, credential, extra = {})
      login({ pc_id: pc_id, credential: credential }.merge(extra))
    end

    def lock(pc_id)
      post game_path('lock_session'), params: { pc_id: pc_id }, as: :json
      response.parsed_body
    end

    def get_json(suffix, params = {})
      get game_path(suffix), params: params, as: :json
      response.parsed_body
    end

    def keyring_row(id)
      get_json('keyring')['entries'].find { |e| e['id'] == id }
    end

    def counters
      s = state
      [s['loginFailures'].to_h, s['loginLockouts'].to_h]
    end

    def with_foothold
      take_drop_box
      plant('comms_port')
      assert_response :success, response.body
    end

    def rdp_session
      hold('lena_rdp_file')
      with_foothold
      assert_equal true, cred_login('lena_pc', 'lena_rdp', foothold: OFFICE)['success'], response.body
    end

    def assert_lock_ok(pc_id)
      body = lock(pc_id)
      assert_response :success, response.body
      # The answer is the delta only, never the sessions map (synced state does not grow)
      assert_equal({ 'success' => true, 'pcId' => pc_id, 'locked' => true }, body)
    end

    setup { travel_to T0 }
    teardown { travel_back }

    # ---- the lock --------------------------------------------------------------------------

    test 'a foothold credential session locks: the record gains only locked, and the bootstrap carries it' do
      build
      rdp_session
      before = state['sessions']['lena_pc'].dup
      assert_lock_ok('lena_pc')
      assert_equal before.merge('locked' => true), state['sessions']['lena_pc']
      assert_equal true, bootstrap_scenario['sessions']['lena_pc']['locked']
      assert_includes state['signedInPcs'].to_a, 'lena_pc', 'a lock is not a sign-out'
    end

    test 'a from credential session locks and the desktop route through its source is refused' do
      build
      hold('lena_rdp_file')
      assert_equal true, sign_in('sam_pc', 'sokafor', NS::SAM_PASSWORD)['success'], response.body
      assert_equal true, cred_login('lena_pc', 'lena_rdp', from: 'sam_pc')['success'], response.body
      get_json('container/lena_pc', from: 'sam_pc')
      assert_response :success
      assert_lock_ok('lena_pc')
      assert_equal 'sam_pc', state['sessions']['lena_pc']['from']
      get_json('container/lena_pc', from: 'sam_pc')
      assert_response :forbidden
      assert_equal false, keyring_row('lena_rdp')['sessionHeld']

      before = counters
      assert_equal true, cred_login('lena_pc', 'lena_rdp', from: 'sam_pc')['success'], response.body
      assert_equal before, counters
      refute state['sessions']['lena_pc'].key?('locked')
      get_json('container/lena_pc', from: 'sam_pc')
      assert_response :success
    end

    test 'a relay session is never locked: 422, the record unchanged' do
      build
      hold('jake_assist_code')
      assert_equal true, cred_login('jake_pc', 'jake_assist', relay: true)['success'], response.body
      before = state['sessions']['jake_pc'].dup
      body = lock('jake_pc')
      assert_response :unprocessable_entity
      assert_equal false, body['success']
      assert_equal before, state['sessions']['jake_pc']
    end

    test 'a credential session with no foothold or from is not lockable (a forged keyboard record)' do
      build
      @game.player_state['sessions'] = { 'lena_pc' => { 'id' => 'lena', 'via' => 'credential', 'credential' => 'lena_rdp' } }
      @game.save!
      lock('lena_pc')
      assert_response :unprocessable_entity
      refute state['sessions']['lena_pc'].key?('locked')
    end

    test "another player's game: the lock is refused and their session stays unlocked" do
      build
      rdp_session
      other = Game.create!(mission: @game.mission, player: break_escape_demo_users(:other_user)).reload
      other.player_state['sessions'] = { 'lena_pc' => state['sessions']['lena_pc'].dup }
      other.save!
      post "/break_escape/games/#{other.id}/lock_session", params: { pc_id: 'lena_pc' }, as: :json
      refute response.successful?, 'a game the player does not own is never locked'
      refute other.reload.player_state['sessions']['lena_pc'].key?('locked')
    end

    # ---- signed out on every read path while locked ---------------------------------------

    test 'a locked foothold credential session reads as signed out on every read path' do
      build
      rdp_session
      # Control: each path serves while unlocked
      get_json('container/lena_pc', foothold: OFFICE)
      assert_response :success
      get_json('container/lena_docs', foothold: OFFICE)
      assert_response :success
      @game.reload
      assert_includes @game.player_reach(OFFICE), 'server_net', 'the session bridges server_net while unlocked'
      assert @game.session_identity('lena_pc')

      assert_lock_ok('lena_pc')
      @game.reload
      assert_nil @game.session_identity('lena_pc')
      body = get_json('container/lena_pc', foothold: OFFICE)
      assert_response :forbidden
      assert_equal 'no_session', body['reason']
      get_json('container/lena_docs', foothold: OFFICE)
      refute response.successful?, 'a desktop folder is refused'
      refute_includes response.body, 'doc.txt'
      add_item('text_file', 'lena_local', 'budget.txt', source_pc_id: 'lena_pc')
      refute_includes held_ids, 'lena_local', 'a take from the locked desktop is refused'
      unlock_object('lena_safe', 'pin', '2468')
      refute response.successful? && response.parsed_body['success'] == true, 'an unlock under the locked session is refused'
      refute_includes @game.player_reach(OFFICE), 'server_net', 'a locked session bridges nothing for access'
      container('server_public', foothold: OFFICE)
      assert_response :not_found
      row = network_view['footholds'][0]['hosts'].find { |h| h['id'] == 'lena_pc' }
      assert_equal({ 'username' => 'lfox', 'displayName' => 'Lena Fox', 'via' => 'credential', 'remote' => true, 'locked' => true },
                   row['session'], "the view's host row says Locked")
      assert_equal false, keyring_row('lena_rdp')['sessionHeld']
      # A desktop route from the locked PC is refused (slice 6's locked-source rule)
      login(pc_id: 'sv_fs02', username: 'ishaw', password: NS::IAN_PASSWORD, from: 'lena_pc')
      assert_response :forbidden
    end

    # ---- the two ways back in --------------------------------------------------------------

    test "the account's password unlocks it, counted against maxAttempts" do
      build
      rdp_session
      assert_lock_ok('lena_pc')
      body = sign_in('lena_pc', 'lfox', 'not-the-password', foothold: OFFICE)
      assert_response :unprocessable_entity
      assert_equal 4, body['attemptsLeft'], 'a wrong password counts as any sign-in does'
      assert_equal true, state['sessions']['lena_pc']['locked'], 'and leaves the lock'

      assert_equal true, sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)['success'], response.body
      assert_equal({ 'id' => 'lena', 'via' => 'password', 'foothold' => OFFICE }, state['sessions']['lena_pc'])
      get_json('container/lena_pc', foothold: OFFICE)
      assert_response :success
    end

    test 'the .rdp signs in again: the new record carries no locked, nothing is counted, sessionHeld comes back' do
      build
      rdp_session
      assert_equal true, keyring_row('lena_rdp')['sessionHeld']
      assert_lock_ok('lena_pc')
      assert_equal false, keyring_row('lena_rdp')['sessionHeld'], 'GET /keyring: not held while locked'
      before = counters
      body = cred_login('lena_pc', 'lena_rdp', foothold: OFFICE)
      assert_response :success, response.body
      assert_equal true, body['success']
      refute body.key?('locked')
      assert_equal({ 'id' => 'lena', 'via' => 'credential', 'credential' => 'lena_rdp', 'foothold' => OFFICE },
                   state['sessions']['lena_pc'])
      assert_equal before, counters
      assert_equal true, keyring_row('lena_rdp')['sessionHeld']
      get_json('container/lena_pc', foothold: OFFICE)
      assert_response :success
      refute bootstrap_scenario['sessions']['lena_pc'].key?('locked')
    end

    test 'a lockout at the PC still refuses the saved connection, and the session stays locked' do
      build
      rdp_session
      assert_lock_ok('lena_pc')
      5.times { sign_in('lena_pc', 'lfox', 'wrong', foothold: OFFICE) }
      assert_equal true, response.parsed_body['lockedOut'], response.body
      body = cred_login('lena_pc', 'lena_rdp', foothold: OFFICE)
      assert_response :unprocessable_entity
      assert_equal true, body['lockedOut']
      assert_equal true, state['sessions']['lena_pc']['locked']
    end

    # ---- a token session ---------------------------------------------------------------------

    test 'a token session locks and a fresh token sign-in unlocks it while the token lives' do
      build
      with_foothold
      assert_equal true, cred_login('lena_pc', 'lena_token', foothold: OFFICE)['success'], response.body
      assert_lock_ok('lena_pc')
      row = keyring_row('lena_token')
      assert_equal false, row['sessionHeld']
      assert_equal 240, row['expiresInS'], 'the lock leaves the clock alone'
      get_json('container/lena_pc', foothold: OFFICE)
      assert_response :forbidden

      travel 1.minute
      assert_equal true, cred_login('lena_pc', 'lena_token', foothold: OFFICE)['success'], response.body
      refute state['sessions']['lena_pc'].key?('locked')
      assert_equal 180, keyring_row('lena_token')['expiresInS'], 'a fresh sign-in never renews the clock'
      get_json('container/lena_pc', foothold: OFFICE)
      assert_response :success
    end

    test 'after expiry a token sign-in does not unlock and a lock is refused as unheld' do
      build
      with_foothold
      assert_equal true, cred_login('lena_pc', 'lena_token', foothold: OFFICE)['success'], response.body
      assert_lock_ok('lena_pc')
      travel 4.minutes
      assert_equal({ 'success' => false, 'expired' => true }, cred_login('lena_pc', 'lena_token', foothold: OFFICE))
      get_json('container/lena_pc', foothold: OFFICE)
      assert_response :forbidden

      # A second session, live then expired, at the same PC: the lock on an expired one is 422
      build
      with_foothold
      assert_equal true, cred_login('lena_pc', 'lena_token', foothold: OFFICE)['success'], response.body
      travel 4.minutes
      lock('lena_pc')
      assert_response :unprocessable_entity
      refute state['sessions'].dig('lena_pc', 'locked')
    end
  end
end
