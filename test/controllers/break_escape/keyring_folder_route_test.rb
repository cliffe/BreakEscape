require 'test_helper'
require_relative '../../support/keyring_login_scenario'

module BreakEscape
  # Keyring K3c (K2 review R1 m4): a folder under a sign-in PC is judged by the route the
  # request names, as its desktop is. relay=1 opens a folder only at a relay session; foothold=
  # must reach the host; two routes conflict; a no-route folder open at a relay session is
  # refused (the holder's keyboard never reaches the shared screen). A no-route folder open
  # under a foothold session keeps today's session_admits? rule.
  class KeyringFolderRouteTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    KS = KeyringLoginScenario
    OFFICE = KS::OFFICE

    def scenario
      data = KS.scenario
      pcs = data['rooms'].values.flat_map { |r| Array(r['objects']) }
      jake = pcs.find { |o| o['id'] == 'jake_pc' }
      jake['contents'] << { 'id' => 'jake_docs', 'type' => 'folder', 'name' => 'Documents', 'locked' => false,
                            'contents' => [{ 'id' => 'jake_doc', 'type' => 'text_file', 'name' => 'doc.txt',
                                             'takeable' => false, 'text' => 'doc' }] }
      lena = pcs.find { |o| o['id'] == 'lena_pc' }
      lena['contents'] = Array(lena['contents']) + [
        { 'id' => 'lena_docs', 'type' => 'folder', 'name' => 'Documents', 'locked' => false,
          'contents' => [{ 'id' => 'lena_doc', 'type' => 'text_file', 'name' => 'doc.txt', 'takeable' => false, 'text' => 'doc' }] }
      ]
      data
    end

    def build(player_state = {})
      build_network_game({ 'encounteredNPCs' => %w[sam lena ian jake] }.merge(player_state), scenario)
    end

    def state
      @game.reload.player_state
    end

    def hold(*ids)
      @game.player_state['inventory'] = Array(@game.player_state['inventory']) + ids.map { |id| KS.held(id) }
      @game.save!
    end

    def cred_login(pc_id, credential, extra = {})
      post game_path('login'), params: { pc_id: pc_id, credential: credential }.merge(extra), as: :json
      response.parsed_body
    end

    def get_container(id, params = {})
      get game_path("container/#{id}"), params: params, as: :json
      response.parsed_body
    end

    def relay_open
      build
      hold('jake_assist_code')
      assert_equal true, cred_login('jake_pc', 'jake_assist', relay: true)['success'], response.body
    end

    test 'a folder on the relay desktop opens with relay=1' do
      relay_open
      body = get_container('jake_docs', relay: 1)
      assert_response :success, response.body
      assert_equal ['jake_doc'], body['contents'].map { |c| c['id'] }
    end

    test 'a no-route folder open at a relay session is refused and leaves the relay record' do
      relay_open
      body = get_container('jake_docs')
      assert_response :forbidden
      assert_equal 'unreachable', body['reason']
      refute body.key?('contents')
      assert_equal true, state['sessions']['jake_pc']['relay']
    end

    test 'foothold= and two routes at a relay session are refused' do
      relay_open
      take_drop_box
      plant('comms_port')
      get_container('jake_docs', foothold: OFFICE)
      assert_response :forbidden
      get_container('jake_docs', relay: 1, foothold: OFFICE)
      assert_response :forbidden
      get_container('jake_docs', relay: '0')
      assert_response :forbidden
    end

    test 'a forged relay=1 is refused at a keyboard session and at a foothold session' do
      build
      assert_equal true, sign_in('jake_pc', 'jbrooks', KS::JAKE_PASSWORD)['success'], response.body
      get_container('jake_docs', relay: 1)
      assert_response :forbidden
      get_container('jake_docs')
      assert_response :success, 'the keyboard session keeps its no-route folder'

      hold('lena_rdp_file')
      take_drop_box
      plant('comms_port')
      assert_equal true, cred_login('lena_pc', 'lena_rdp', foothold: OFFICE)['success'], response.body
      get_container('lena_docs', relay: 1)
      assert_response :forbidden
    end

    test 'a foothold session: foothold= opens the folder, a wrong foothold is refused, no route keeps today' do
      build
      hold('lena_rdp_file')
      take_drop_box
      plant('comms_port')
      assert_equal true, cred_login('lena_pc', 'lena_rdp', foothold: OFFICE)['success'], response.body

      body = get_container('lena_docs', foothold: OFFICE)
      assert_response :success, response.body
      assert_equal ['lena_doc'], body['contents'].map { |c| c['id'] }

      get_container('lena_docs', foothold: 'no_such_port')
      assert_response :forbidden

      # Recorded choice (K3c build log): no-route folder opens under a foothold session keep
      # the session_admits? rule, so this stays open.
      get_container('lena_docs')
      assert_response :success, response.body
    end

    test 'a folder at a PC with no session is refused whatever route is named' do
      build
      take_drop_box
      plant('comms_port')
      [{}, { relay: 1 }, { foothold: OFFICE }].each do |params|
        get_container('jake_docs', params)
        assert_response :forbidden, params.inspect
      end
    end

    test "another player's relay folder is never served" do
      relay_open
      other = create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:other_user),
                                 scenario: scenario,
                                 player_state: @game.reload.player_state)
      get "/break_escape/games/#{other.id}/container/jake_docs", params: { relay: 1 }, as: :json
      refute_includes [200], response.status, response.body
      refute_includes response.body.to_s, 'jake_doc'
    end
  end
end
