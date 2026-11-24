require 'test_helper'
require_relative '../../support/cached_accounts_fixture'

module BreakEscape
  # Ops S5b unit 12 (S5BC_BUILD_BRIEF 4.3): POST /games/:id/harvest_credentials. Each refusal, in
  # order, writes nothing; a success answers exactly the brief's key set; the route is no-store.
  class HarvestCredentialsTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    CAF = CachedAccountsFixture
    AMS = AccessModelScenario
    ROW_KEYS = %w[avatar displayName hashId npcId portrait username].freeze

    def build(scenario = CAF.scenario)
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
        scenario: scenario, player_state: { 'currentRoom' => 'finance', 'unlockedRooms' => %w[lobby finance] }
      )
    end

    def sign_in(pc_id, name, password)
      post login_game_url(@game), params: { pc_id: pc_id, username: name, password: password }, as: :json
      assert response.parsed_body['success'], response.body
      @game.reload
    end

    def dana
      sign_in('profile_pc', 'DWhite', AMS::DANA_PASSWORD)
    end

    def collect(params = { pc_id: 'profile_pc' })
      post "/break_escape/games/#{@game.id}/harvest_credentials", params: params, as: :json
      response.parsed_body
    end

    def snapshot
      g = @game.reload
      [g.player_state.to_json, g.log_rows_for('collect').to_json]
    end

    def assert_refused(status, reason, params = { pc_id: 'profile_pc' })
      before = snapshot
      body = collect(params)
      assert_response status
      assert_equal false, body['success']
      assert_equal reason, body['reason']
      assert_equal before, snapshot, 'a refusal writes nothing'
      assert_equal 'no-store', response.headers['Cache-Control']
    end

    test 'bad pc_id values are 400 bad_request and write nothing' do
      build
      dana
      [nil, '', [], %w[profile_pc], { 'a' => 1 }, 5, 'x' * 41, 'x' * 10_000].each do |bad|
        assert_refused :bad_request, 'bad_request', { pc_id: bad }
      end
      assert_refused :bad_request, 'bad_request', {}
    end

    test 'an unknown id, another game id and a real PC with no session answer alike' do
      build
      other = Game.create!(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user))
      real = collect(pc_id: 'profile_pc')
      real_status = response.status
      assert_equal 404, real_status
      assert_equal 'no-store', response.headers['Cache-Control']
      [%w[nope_pc], [other.id.to_s], ['x' * 40]].each do |(id)|
        before = snapshot
        body = collect(pc_id: id)
        assert_equal real_status, response.status
        assert_equal real.to_json.gsub('profile_pc', id), body.to_json
        assert_equal before, snapshot
      end
      assert_equal "Container not found: profile_pc", real['error']
    end

    test 'a conflicting route and a route with no matching session are 403 not_reachable' do
      build
      dana
      assert_refused :forbidden, 'not_reachable', { pc_id: 'profile_pc', relay: 1, from: 'it_pc' }
      assert_refused :forbidden, 'not_reachable', { pc_id: 'profile_pc', relay: 1 }
      assert_refused :forbidden, 'not_reachable', { pc_id: 'profile_pc', from: 'it_pc' }
      assert_refused :forbidden, 'not_reachable', { pc_id: 'profile_pc', foothold: 'nowhere' }
      assert_refused :forbidden, 'not_reachable', { pc_id: 'profile_pc', from: %w[a] }
    end

    test 'a locked session is 422 locked, a user session 422 not_admin, nothing written' do
      build
      sign_in('profile_pc', 'jbrooks', AMS::JAKE_PASSWORD)
      assert_refused :unprocessable_entity, 'not_admin'
      dana
      @game.player_state['sessions']['profile_pc']['locked'] = true
      @game.save!
      assert_refused :unprocessable_entity, 'locked'
    end

    test 'an admin session collects: exact key set, rows, log row, no secrets, no-store' do
      build
      dana
      body = collect
      assert_response :success
      assert_equal 'no-store', response.headers['Cache-Control']
      assert_equal %w[harvested held keyringRev pcId success], body.keys.sort
      assert_equal 'profile_pc', body['pcId']
      assert_equal true, body['success']
      assert_equal %w[jake dana], body['harvested'].map { |r| r['npcId'] }
      assert_equal body['harvested'], body['held']
      body['held'].each { |r| assert_equal ROW_KEYS, r.keys.sort }
      assert body['held'].all? { |r| r['hashId'].present? }
      assert_equal %w[profile_pc|jake profile_pc|dana], @game.reload.player_state['harvestedAccounts']
      assert_equal 1, @game.log_rows_for('collect').length
      [AMS::JAKE_PASSWORD, AMS::DANA_PASSWORD, 'localTo', 'cachedAt', 'profile_pc|'].each do |secret|
        refute_includes response.body, secret
      end
    end

    test 'a repeat adds nothing: harvested empty, held kept, one row, same rev' do
      build
      dana
      first = collect
      second = collect
      assert_response :success
      assert_equal [], second['harvested']
      assert_equal first['held'], second['held']
      assert_equal first['keyringRev'], second['keyringRev']
      assert_equal 1, @game.reload.log_rows_for('collect').length
    end

    test 'a borrow candidate is held only once cached; a later collect adds it' do
      build
      dana
      collect
      @game.reload.note_borrow_cached!('profile_pc', 'sam')
      @game.save!
      body = collect
      assert_equal %w[sam], body['harvested'].map { |r| r['npcId'] }
      assert_equal %w[jake sam dana], body['held'].map { |r| r['npcId'] }
    end

    test 'keyringRev equals the rev of the next GET /keyring' do
      build
      dana
      rev = collect['keyringRev']
      get "/break_escape/games/#{@game.id}/keyring", as: :json
      assert_equal rev, response.parsed_body['rev']
      assert_equal %w[hot_dana hot_jake], response.parsed_body['entries'].select { |e| e['kind'] == 'hash' }.map { |e| e['id'] }.sort
    end

    test 'a relay admin collects with relay=1 and is refused without it' do
      build
      @game.player_state['sessions'] = { 'profile_pc' => { 'id' => 'dana', 'via' => 'credential', 'credential' => 'x', 'relay' => true } }
      @game.player_state['signedInPcs'] = []
      @game.save!
      assert_refused :forbidden, 'not_reachable'
      body = collect(pc_id: 'profile_pc', relay: 1)
      assert_response :success
      assert_equal true, body['success']
      assert_equal %w[jake dana], body['harvested'].map { |r| r['npcId'] }
    end

    test 'a relay session of a user account is 422 not_admin even with relay=1' do
      build
      @game.player_state['sessions'] = { 'profile_pc' => { 'id' => 'jake', 'via' => 'credential', 'credential' => 'x', 'relay' => true } }
      @game.save!
      assert_refused :unprocessable_entity, 'not_admin', { pc_id: 'profile_pc', relay: 1 }
    end
  end
end
