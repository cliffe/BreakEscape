require 'test_helper'
require_relative '../../support/keyring_login_scenario'
require_relative '../../support/access_model_scenario'

module BreakEscape
  # Ops core step 10, part A (OPS_CORE_PLAN.md sections 0, 5.4 and 8): the technique session
  # record written by start_login_session!, `access` through the session answers, and the
  # server-owned opsUsed state. Real routes for the existing sign-in kinds.
  class TechniqueSessionRecordTest < ActionDispatch::IntegrationTest
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

    def npc(id)
      @game.send(:scenario_room_npc, id)
    end

    def with_foothold
      take_drop_box
      plant('comms_port')
      assert_response :success, response.body
    end

    def technique_session(pc_id: 'lena_pc', npc_id: 'lena', **keys)
      # Reload first: a plant made through the route is not in a stale @game, and saving that would wipe the foothold.
      @game.reload
      ended = @game.send(:start_login_session!, pc_id, npc(npc_id), 'technique', foothold: OFFICE, technique: 'lena_pc.door.a', **keys)
      @game.save!
      ended
    end

    test 'a technique record has exactly via, id, foothold, access and technique' do
      build
      assert_equal [], technique_session(access: 'admin')
      assert_equal({ 'id' => 'lena', 'via' => 'technique', 'foothold' => OFFICE, 'access' => 'admin',
                     'technique' => 'lena_pc.door.a' }, state['sessions']['lena_pc'])
    end

    test 'the two keywords are written only when given' do
      build
      @game.send(:start_login_session!, 'lena_pc', npc('lena'), 'technique', foothold: OFFICE)
      assert_equal %w[foothold id via], @game.player_state['sessions']['lena_pc'].keys.sort
    end

    test 'a typed foothold sign-in and a credential sign-in write no access or technique key' do
      build
      hold = [KS.held('lena_rdp_file')]
      @game.player_state['inventory'] = hold
      @game.save!
      with_foothold
      post game_path('login'), params: { pc_id: 'lena_pc', credential: 'lena_rdp', foothold: OFFICE }, as: :json
      assert_equal true, response.parsed_body['success'], response.body
      refute_includes state['sessions']['lena_pc'].keys, 'access'
      refute_includes state['sessions']['lena_pc'].keys, 'technique'
      refute response.parsed_body.key?('access')
      assert sign_in('jake_pc', 'jbrooks', KS::JAKE_PASSWORD, foothold: OFFICE)['success'], response.body
      assert_equal %w[foothold id via], state['sessions']['jake_pc'].keys.sort
      refute response.parsed_body.key?('access')
    end

    test 'the session answer and the reloaded mirror carry access admin only for an admin record' do
      build
      with_foothold
      technique_session(access: 'admin')
      mirror = bootstrap_scenario['sessions']['lena_pc']
      assert_equal 'admin', mirror['access']
      assert_equal 'technique', mirror['via']
      answer = @game.send(:login_session_answer, npc('lena'), 'technique', pc_id: 'lena_pc', foothold: OFFICE)
      assert_equal 'admin', answer['access']
      assert_equal 'admin', @game.send(:session_for_client, 'lena_pc')['access']
    end

    test 'a user-level technique record and every other session leave the key out' do
      build
      with_foothold
      technique_session(access: 'user')
      assert_equal 'user', state['sessions']['lena_pc']['access']
      refute bootstrap_scenario['sessions']['lena_pc'].key?('access')
      refute @game.send(:session_for_client, 'lena_pc').key?('access')
      refute @game.send(:login_session_answer, npc('lena'), 'technique', pc_id: 'lena_pc', foothold: OFFICE).key?('access')
      # a record with no pc id given cannot be admin either
      refute @game.send(:login_session_answer, npc('lena'), 'password').key?('access')
    end

    test 'a technique record replaces a held session and a later sign-in replaces it' do
      build
      with_foothold
      assert sign_in('lena_pc', 'lfox', NetworkModelScenario::LENA_PASSWORD, foothold: OFFICE)['success'], response.body
      assert_equal 'password', state['sessions']['lena_pc']['via']
      technique_session(access: 'admin')
      assert_equal 'technique', state['sessions']['lena_pc']['via']
      assert_includes state['signedInPcs'], 'lena_pc'
      @game.player_state['inventory'] = Array(@game.player_state['inventory']) + [KS.held('lena_rdp_file')]
      @game.save!
      post game_path('login'), params: { pc_id: 'lena_pc', credential: 'lena_rdp', foothold: OFFICE }, as: :json
      assert_equal true, response.parsed_body['success'], response.body
      assert_equal %w[credential], [state['sessions']['lena_pc']['via']]
      refute_includes state['sessions']['lena_pc'].keys, 'access'
      refute response.parsed_body.key?('access')
    end

    test 'via technique joins signedInPcs' do
      build
      technique_session(access: 'user')
      assert_includes state['signedInPcs'], 'lena_pc'
    end

    test 'opsUsed starts as its own empty list per game' do
      build
      assert_equal [], state['opsUsed']
      assert_equal [], Game::ACCESS_STATE_DEFAULTS['opsUsed']
      @game.player_state['opsUsed'] << 'x'
      refute_same Game::ACCESS_STATE_DEFAULTS['opsUsed'], @game.player_state['opsUsed']
      assert_equal [], Game::ACCESS_STATE_DEFAULTS['opsUsed']
    end

    test 'opsUsed is rejected from a sync body and is in no answer' do
      build
      with_foothold
      put game_path('sync_state'), params: { opsUsed: ['a.b.c'], playerState: { opsUsed: ['a.b.c'] } }, as: :json
      assert_response :success
      assert_equal [], state['opsUsed']
      refute_includes response.body, 'opsUsed'
      refute_includes bootstrap_scenario.to_json, 'opsUsed'
    end
  end

  # The claim route, through the access model's own scenario.
  class TechniqueSessionRecordClaimTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    test 'a claim record has no access or technique key and its answer has no access key' do
      data = AccessModelScenario.routes_scenario
      data['rooms']['finance']['npcs'].find { |n| n['id'] == 'jake' }.merge!('needs' => { 'coffee' => { 'decayPerMin' => 30, 'urgentAt' => 40 } })
      game = create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user), scenario: data,
                                player_state: { 'currentRoom' => 'finance', 'unlockedRooms' => %w[lobby finance] })
      post login_game_url(game), params: { pc_id: 'jake_pc', claim: 'owner',
                                           globals: { 'jake_pc_screen_locked' => false, 'jake_pc_owner_away' => true } }, as: :json
      assert_equal true, response.parsed_body['success'], response.body
      refute response.parsed_body.key?('access')
      assert_equal({ 'id' => 'jake', 'via' => 'claim' }, game.reload.player_state['sessions']['jake_pc'])
    end
  end
end
