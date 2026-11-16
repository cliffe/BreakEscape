require 'test_helper'
require_relative '../../support/keyring_login_scenario'

module BreakEscape
  # Keyring K5 (docs/achitechture/CREDENTIAL_KEYRING_PLAN.md section 10): session tokens, through
  # the real routes with a frozen clock. The route through the proof foothold only, the clock
  # written once when that foothold is first gained, expiry and every reader of it, the prune
  # that ends an expired session on the next write, and hostile requests.
  class CredentialTokenTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    KS = KeyringLoginScenario
    NS = NetworkModelScenario
    OFFICE = KS::OFFICE
    # A second office_lan foothold (server_port is an office_lan jack in the pivot fixture)
    OTHER = 'jack_server_port'.freeze
    LABEL = 'HB-FIN-02 sign-in token'.freeze
    T0 = Time.utc(2026, 11, 16, 10, 0, 0)
    GENERIC = { 'success' => false, 'message' => Game::LOGIN_INCORRECT }.freeze

    # A test-local scenario: the K2 fixture plus Lena's token (proof: the comms room jack) and a
    # locked safe on Lena's PC for the unlock refusal.
    def token_scenario(expires_min: 4)
      data = KS.scenario
      data['credentials']['lena_token'] = {
        'kind' => 'token', 'account' => 'lena', 'connectsTo' => 'lena_pc',
        'proof' => { 'foothold' => OFFICE }, 'label' => LABEL, 'expiresMin' => expires_min
      }
      lena_pc = data['rooms']['finance_office']['objects'].find { |o| o['id'] == 'lena_pc' }
      lena_pc['contents'] << { 'id' => 'lena_safe', 'type' => 'safe', 'name' => 'Expenses safe', 'locked' => true,
                               'lockType' => 'pin', 'requires' => '2468', 'contents' => [] }
      data
    end

    def build(player_state = {}, expires_min = 4)
      build_network_game({ 'encounteredNPCs' => %w[sam lena ian jake] }.merge(player_state), token_scenario(expires_min: expires_min))
    end

    def state
      @game.reload.player_state
    end

    def cred_login(pc_id, credential, extra = {})
      post game_path('login'), params: { pc_id: pc_id, credential: credential }.merge(extra), as: :json
      response.parsed_body
    end

    def keyring(params = {})
      get game_path('keyring'), params: params, as: :json
      response.parsed_body
    end

    def token_row(body = keyring)
      body['entries'].find { |e| e['id'] == 'lena_token' }
    end

    def with_foothold
      take_drop_box
      plant('comms_port')
      assert_response :success, response.body
    end

    def signed_in_with_token
      with_foothold
      body = cred_login('lena_pc', 'lena_token', foothold: OFFICE)
      assert_response :success, response.body
      body
    end

    def expire!
      travel 4.minutes
    end

    setup { travel_to T0 }
    teardown { travel_back }

    # ---- the clock ------------------------------------------------------------------------

    test 'the clock starts when the proof foothold is first gained and a second plant never restarts it' do
      build
      assert_empty state['credentialClock'].to_h
      with_foothold
      assert_equal T0.to_f, state['credentialClock']['lena_token']

      travel 1.minute
      unplug('comms_port')
      assert_response :success, response.body
      plant('comms_port')
      assert_response :success, response.body
      assert_equal({ 'lena_token' => T0.to_f }, state['credentialClock'])
      assert_equal 180, token_row['expiresInS']
    end

    test 'another foothold gives no clock, and a game whose foothold predates K5 reads as freshly issued' do
      build('footholds' => KS.office_foothold, 'gainedFootholds' => ['comms_port'])
      travel 30.minutes
      before = state.deep_dup
      row = token_row
      assert_equal 240, row['expiresInS']
      refute row['expired']
      assert_equal before, state, 'a GET writes nothing'

      cred_login('lena_pc', 'lena_token', foothold: OFFICE)
      assert_response :success, response.body
      assert_equal (T0 + 30.minutes).to_f, state['credentialClock']['lena_token'], 'the first sign-in stamps it'
      expire!
      cred_login('lena_pc', 'lena_token', foothold: OFFICE)
      assert_equal({ 'success' => false, 'expired' => true }, response.parsed_body)
    end

    # Review R1 m1: the clock starts at each of the three places a foothold is first gained, not
    # only the jack. A dropped call would otherwise leave the sign-in stamp to start it later.
    def build_with(player_state = {})
      data = token_scenario
      yield data
      build_network_game({ 'encounteredNPCs' => %w[sam lena ian jake] }.merge(player_state), data)
    end

    def add_token(data, id, proof_foothold)
      data['credentials'][id] = { 'kind' => 'token', 'account' => 'lena', 'connectsTo' => 'lena_pc',
                                  'proof' => { 'foothold' => proof_foothold }, 'label' => id, 'expiresMin' => 4 }
    end

    test 'R1 m1: the clock starts at the Wi-Fi join, once, and a second access point never restarts it' do
      build_with do |data|
        data['networks']['guest_wifi'] = { 'name' => 'Guest Wi-Fi', 'wifi' => { 'ssid' => 'Harbour-Guest' } }
        2.times do |i|
          data['rooms']['lobby']['objects'] << { 'id' => "guest_ap#{i}", 'type' => 'pc', 'sprite' => 'wifi_ap1',
                                                 'name' => "Guest AP #{i}", 'wifiAp' => true, 'network' => 'guest_wifi' }
        end
        add_token(data, 'wifi_token', 'wifi_guest_wifi')
      end
      assert_nil state['credentialClock']&.dig('wifi_token')
      post game_path('network/join'), params: { ap_id: 'guest_ap0' }, as: :json
      assert_response :success, response.body
      assert_equal T0.to_f, state['credentialClock']['wifi_token']
      assert_nil state['credentialClock']['lena_token'], 'a token on another foothold is not started'
      travel 1.minute
      post game_path('network/join'), params: { ap_id: 'guest_ap1' }, as: :json
      assert_equal T0.to_f, state['credentialClock']['wifi_token']
    end

    test 'R1 m1: the clock starts at the implant' do
      build_with('sessions' => { 'lena_pc' => { 'id' => 'lena', 'via' => 'claim' } }) do |data|
        data['startItemsInInventory'] = [{ 'id' => 'kit_badusb', 'type' => 'usb_stick', 'name' => 'Keystroke device',
                                           'takeable' => true, 'usbClass' => 'hid' }]
        data['rooms']['finance_office']['objects'] << {
          'id' => 'lena_usb_socket', 'type' => 'pc', 'name' => 'Desk USB socket',
          'triggerOnInteract' => [{ 'type' => 'grant_foothold', 'pc' => 'lena_pc', 'needsSession' => true,
                                    'needsHeld' => 'kit_badusb', 'name' => 'BadUSB: Lena desk' }]
        }
        add_token(data, 'implant_token', 'implant_lena_pc')
      end
      assert_nil state['credentialClock']&.dig('implant_token')
      travel 30.seconds
      post game_path('network/implant'), params: { pc_id: 'lena_pc', shape: 'session' }, as: :json
      assert_response :success, response.body
      assert response.parsed_body['success'], response.body
      assert_equal (T0 + 30.seconds).to_f, state['credentialClock']['implant_token']
    end

    test 'R1 m1: a borrow that ends an expired token session names it in tokenExpiredPcIds' do
      build_with do |data|
        jake = data['rooms']['lobby']['npcs'].find { |n| n['id'] == 'jake' }
        jake['workarounds'] = [{ 'at' => 50, 'do' => 'borrow_session', 'pc' => 'records_pc' }]
      end
      signed_in_with_token
      @game.reload
      @game.player_state['npcFrustration'] = { 'jake' => { 'level' => 60, 'handed' => { '0' => { 'hand' => 7, 'time' => T0.to_f } } } }
      @game.save!
      expire!
      post npc_workaround_game_url(@game), params: { npc_id: 'jake', index: 0, hand: 7, cut: true }, as: :json
      assert_response :success, response.body
      body = response.parsed_body
      assert_equal ['lena_pc'], body['endedPcIds']
      assert_equal ['lena_pc'], body['tokenExpiredPcIds']
      assert_empty state['sessions']
    end

    test 'R1 m2: a later sign-in keeps the existing clock and never renews it' do
      build
      with_foothold
      travel 2.minutes
      body = cred_login('lena_pc', 'lena_token', foothold: OFFICE)
      assert_response :success, response.body
      assert_equal T0.to_f, state['credentialClock']['lena_token']
      assert_equal 120, body['expiresInS']
      assert_equal 120, token_row['expiresInS']
      travel 2.minutes
      cred_login('lena_pc', 'lena_token', foothold: OFFICE)
      assert_equal({ 'success' => false, 'expired' => true }, response.parsed_body, 'a sign-in did not buy more time')
    end

    # ---- the route ------------------------------------------------------------------------

    test 'a token signs in through its proof foothold only, as a remote session outside signedInPcs' do
      build
      body = signed_in_with_token
      assert_equal 'credential', body['via']
      assert_equal 'token', body['kind']
      assert_equal LABEL, body['label']
      assert_equal 240, body['expiresInS']
      assert_equal true, body['remote']
      assert_equal OFFICE, body['footholdId']
      assert_equal({ 'foothold' => OFFICE }, body['route'])
      assert_equal({ 'id' => 'lena', 'via' => 'credential', 'credential' => 'lena_token', 'foothold' => OFFICE },
                   state['sessions']['lena_pc'])
      refute_includes Array(state['signedInPcs']), 'lena_pc'
    end

    test 'hostile routes: none, relay, from, another held foothold, an array and two fields get the generic refusal' do
      build('footholds' => { OTHER => { 'via' => 'jack', 'network' => 'office_lan', 'source' => 'server_port', 'seq' => 2 } })
      with_foothold
      assert @game.reload.host_reachable_through?(OTHER, @game.find_login_pc('lena_pc')[:object]), 'the other foothold reaches lena_pc'
      [{}, { relay: true }, { from: 'sam_pc' }, { foothold: OTHER }, { foothold: [OFFICE] },
       { foothold: OFFICE, relay: true }, { foothold: OFFICE, from: 'sam_pc' }].each do |extra|
        assert_equal GENERIC, cred_login('lena_pc', 'lena_token', extra), extra.inspect
        assert_response :unprocessable_entity
      end
      assert_empty state['sessions']
    end

    test 'the proof foothold not held is the generic refusal; the wrong PC is wrongPc' do
      build
      assert_equal GENERIC, cred_login('lena_pc', 'lena_token', foothold: OFFICE)
      with_foothold
      body = cred_login('sam_pc', 'lena_token', foothold: OFFICE)
      assert_equal true, body['wrongPc']
    end

    # ---- expiry ---------------------------------------------------------------------------

    test 'POST /login after expiry answers 422 expired, at the boundary second exactly' do
      build
      with_foothold
      travel 239.seconds
      assert_equal 1, token_row['expiresInS']
      travel 1.second
      body = cred_login('lena_pc', 'lena_token', foothold: OFFICE)
      assert_response :unprocessable_entity
      assert_equal({ 'success' => false, 'expired' => true }, body)
      assert_empty state['sessions']
    end

    test 'an invalid expiresMin fails closed' do
      build({}, 0)
      with_foothold
      assert_equal true, token_row['expired']
      cred_login('lena_pc', 'lena_token', foothold: OFFICE)
      assert_equal({ 'success' => false, 'expired' => true }, response.parsed_body)
    end

    test 'GET /keyring: a live token row, then sessionHeld false, expired and no routes' do
      build
      signed_in_with_token
      row = token_row
      assert_equal [{ 'foothold' => OFFICE }], row['routes']
      assert_equal true, row['sessionHeld']
      assert_equal LABEL, row['label']
      assert_equal 'HB-FIN-02', row['host']
      assert_equal false, row['targetOff']
      assert_equal false, row['remoteBlocked']
      assert_equal 240, row['expiresInS']
      refute row.key?('expired')

      expire!
      row = token_row
      assert_equal true, row['expired']
      assert_equal [], row['routes']
      assert_equal false, row['sessionHeld']
      refute row.key?('expiresInS')
    end

    test 'expiresInS is outside the digest and rides on an unchanged answer; expired changes the digest' do
      build
      signed_in_with_token
      first = keyring
      travel 61.seconds
      second = keyring
      assert_equal first['rev'], second['rev']
      assert_equal 179, token_row(second)['expiresInS']

      unchanged = keyring(rev: first['rev'])
      assert_equal true, unchanged['unchanged']
      assert_equal({ 'lena_token' => 179 }, unchanged['expiresInS'])

      expire!
      after = keyring(rev: first['rev'])
      refute after['unchanged']
      refute_equal first['rev'], after['rev']
    end

    test 'after expiry a scoped request through the session is refused and GET /container says expired' do
      build
      signed_in_with_token
      ledger = @game.scenario_data['resources']['ledger_archive']
      assert @game.reload.resource_admits_player?(ledger), 'the token session admits the finance share while live'
      container('lena_pc', foothold: OFFICE)
      assert_response :success, response.body

      expire!
      refute @game.reload.resource_admits_player?(ledger)
      refute @game.session_route_up?('lena_pc')
      body = container('lena_pc', foothold: OFFICE)
      assert_response :forbidden
      assert_equal 'expired', body['reason']
      body = container('lena_pc')
      assert_response :forbidden
      assert_equal 'expired', body['reason'], 'the keyboard is refused too'
      container('lena_local', foothold: OFFICE)
      assert_response :forbidden
    end

    test 'an unlock under the expired session answers reason expired with the token label' do
      build
      signed_in_with_token
      expire!
      body = unlock_object('lena_safe', 'pin', '0000')
      assert_response :forbidden, response.body
      assert_equal 'expired', body['reason']
      assert_equal "#{LABEL} has expired.", body['message']
    end

    test 'the reach through the token pivot is lost on expiry and the reach cache key changes' do
      build
      signed_in_with_token
      game = @game.reload
      key_live = game.send(:reach_cache_key, OFFICE, false)
      assert_includes game.player_reach(OFFICE), 'server_net'
      assert(game.view_session_hosts.any? { |h| h[:pc_id] == 'lena_pc' })
      host = network_view(OFFICE).to_json
      assert_includes host, 'lena_pc'

      expire!
      refute_includes game.player_reach(OFFICE), 'server_net', 'the cached reach is not reused'
      refute_equal key_live, game.send(:reach_cache_key, OFFICE, false)
      refute(game.view_session_hosts.any? { |h| h[:pc_id] == 'lena_pc' })
      row = game.host_row(game.find_login_pc('lena_pc')[:object])
      refute row.key?('session'), row.inspect
    end

    test 'the bootstrap and session_for_client leave the expired session out; before expiry it survives reload' do
      build
      signed_in_with_token
      travel 1.minute
      entry = bootstrap_scenario['sessions']['lena_pc']
      assert_equal 'token', entry['kind']
      assert_equal 180, entry['expiresInS']
      assert_equal OFFICE, entry['footholdId']
      assert_equal 'credential', state['sessions']['lena_pc']['via'], 'a token session survives reload'

      travel 3.minutes
      refute bootstrap_scenario.fetch('sessions', {}).key?('lena_pc')
      assert_nil @game.reload.session_for_client('lena_pc')
      refute @game.session_held_at_keyboard?('lena_pc'), 'an expired token is not held at the keyboard'
    end

    test 'a GET after expiry writes nothing' do
      build
      signed_in_with_token
      bootstrap_scenario
      expire!
      before = state.deep_dup
      keyring
      network_view(OFFICE)
      container('lena_pc', foothold: OFFICE)
      bootstrap_scenario
      assert_equal before, state
      assert state['sessions'].key?('lena_pc'), 'the record stays until the next write'
    end

    test 'the next write prunes an expired session and names it in endedPcIds and tokenExpiredPcIds' do
      build
      signed_in_with_token
      sign_in('sv_fs02', 'ishaw', NS::IAN_PASSWORD, foothold: OFFICE)
      assert_response :success, response.body
      expire!
      post game_path('logout'), params: { pc_id: 'sam_pc' }, as: :json
      body = response.parsed_body
      assert_equal %w[lena_pc sv_fs02].sort, body['endedPcIds'].sort
      assert_equal ['lena_pc'], body['tokenExpiredPcIds']
      assert_empty state['sessions']
    end

    test 'a typed sign-in at the PC after expiry replaces the session in its slot, naming nothing ended' do
      build
      signed_in_with_token
      sign_in('sv_fs02', 'ishaw', NS::IAN_PASSWORD, foothold: OFFICE)
      expire!
      body = sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      assert_response :success, response.body
      refute body.key?('endedPcIds'), 'the new session pivots in its place, so sv_fs02 stays'
      refute body.key?('tokenExpiredPcIds')
      assert_equal 'password', state['sessions']['lena_pc']['via']
      assert state['sessions'].key?('sv_fs02')
    end

    test 'unplugging the proof foothold before expiry ends the session, without tokenExpiredPcIds' do
      build
      signed_in_with_token
      body = unplug('comms_port')
      assert_response :success
      assert_includes body['endedPcIds'], 'lena_pc'
      refute body.key?('tokenExpiredPcIds')
    end

    # ---- the clock stays on the server ----------------------------------------------------

    test 'the clock is never in an answer and a sync body cannot set it' do
      build
      signed_in_with_token
      [bootstrap_scenario, keyring, network_view(OFFICE)].each do |body|
        refute_includes body.to_json, 'credentialClock'
      end
      put game_path('sync_state'), params: { credentialClock: { lena_token: (T0 + 1.day).to_f } }, as: :json
      assert_equal({ 'lena_token' => T0.to_f }, state['credentialClock'])
      put game_path('sync_state'), params: { credentialClock: {} }, as: :json
      assert_equal({ 'lena_token' => T0.to_f }, state['credentialClock'])
    end
  end

  # CredentialModel's token helpers (plain Ruby, shared with the validator).
  class CredentialModelTokenTest < ActiveSupport::TestCase
    M = CredentialModel

    test 'token is built, connecting, in DEFAULT_ACCEPTS and routes by its proof foothold' do
      assert M.kind_built?('token')
      assert M.connecting?('token')
      assert_includes M::DEFAULT_ACCEPTS, 'token'
      assert M.accepts?(nil, 'token')
      refute M.accepts?({ 'accepts' => ['password'] }, 'token')
      refute M.honours_lockout?('token')
    end

    test 'token_expires_min takes an Integer 1..240 only' do
      assert_equal 1, M.token_expires_min({ 'expiresMin' => 1 })
      assert_equal 240, M.token_expires_min({ 'expiresMin' => 240 })
      [0, 241, -5, 4.5, '4', nil, [4]].each do |bad|
        assert_nil M.token_expires_min({ 'expiresMin' => bad }), bad.inspect
      end
      assert_nil M.token_expires_min(nil)
    end

    test 'token_proof_foothold reads one foothold key only' do
      assert_equal 'jack_comms_port', M.token_proof_foothold({ 'proof' => { 'foothold' => 'jack_comms_port' } })
      assert_nil M.token_proof_foothold({ 'proof' => { 'held' => 'x' } })
      assert_nil M.token_proof_foothold({ 'proof' => { 'foothold' => 'a', 'session' => 'b' } })
      assert_nil M.token_proof_foothold({ 'proof' => { 'foothold' => '' } })
      assert_nil M.token_proof_foothold({})
    end
  end
end
