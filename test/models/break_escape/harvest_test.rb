require 'test_helper'
require_relative '../../support/cached_accounts_fixture'

module BreakEscape
  # Ops S5b unit 08: the collect (harvest_cached_credentials!) and the rows it answers.
  class HarvestTest < ActionDispatch::IntegrationTest
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

    def dana(pc_id = 'profile_pc')
      sign_in(pc_id, 'DWhite', AMS::DANA_PASSWORD)
    end

    def log_rows
      @game.reload.log_rows_for('collect')
    end

    test 'no session, a user session and an unknown PC collect nothing and write nothing' do
      build
      assert_nil @game.harvest_cached_credentials!('profile_pc')
      sign_in('profile_pc', 'jbrooks', AMS::JAKE_PASSWORD)
      refute @game.session_admin?('profile_pc')
      assert_nil @game.harvest_cached_credentials!('profile_pc')
      assert_nil @game.harvest_cached_credentials!('nope')
      assert_nil @game.harvest_cached_credentials!(nil)
      assert_nil @game.harvest_cached_credentials!(%w[profile_pc])
      assert_equal [], @game.reload.player_state['harvestedAccounts']
      assert_equal [], log_rows
    end

    test 'a locked admin session collects nothing' do
      build
      dana
      @game.player_state['sessions']['profile_pc']['locked'] = true
      assert_nil @game.harvest_cached_credentials!('profile_pc')
      assert_equal [], @game.player_state['harvestedAccounts']
    end

    test 'an admin session collects every cached account in declared order, with one log row' do
      build
      dana
      result = @game.harvest_cached_credentials!('profile_pc')
      assert_equal %w[profile_pc|jake profile_pc|dana], result[:added]
      assert_equal result[:added], result[:held]
      assert_equal result[:added], @game.reload.player_state['harvestedAccounts']
      rows = log_rows
      assert_equal 1, rows.size
      assert_equal 'credentials_harvested', rows.first['event']
      assert_equal({ 'account' => 'DWhite' }, rows.first['as'])
      assert_equal({ 'kind' => 'pc', 'id' => 'profile_pc' }, rows.first['where'])
      assert_equal({ 'count' => 2 }, rows.first['detail'])
    end

    test 'a second collect adds nothing and writes no row; a later borrow adds only the new pair' do
      build
      dana
      @game.harvest_cached_credentials!('profile_pc')
      again = @game.harvest_cached_credentials!('profile_pc')
      assert_equal [], again[:added]
      assert_equal %w[profile_pc|jake profile_pc|dana], again[:held]
      assert_equal 1, log_rows.size
      assert_equal %w[profile_pc|jake profile_pc|dana], @game.reload.player_state['harvestedAccounts']

      @game.note_borrow_cached!('profile_pc', 'sam')
      third = @game.harvest_cached_credentials!('profile_pc')
      assert_equal ['profile_pc|sam'], third[:added]
      assert_equal %w[profile_pc|jake profile_pc|sam profile_pc|dana], third[:held]
      assert_equal %w[profile_pc|jake profile_pc|dana profile_pc|sam], @game.reload.player_state['harvestedAccounts'], 'grow-only, no reordering'
      assert_equal [2, 1], log_rows.map { |r| r['detail']['count'] }.sort.reverse
    end

    test 'the administrator account is collected only when the PC caches it' do
      build
      dana('it_pc')
      assert @game.session_admin?('it_pc')
      result = @game.harvest_cached_credentials!('it_pc')
      assert_equal({ added: [], held: [] }, result)
      assert_equal [], @game.reload.player_state['harvestedAccounts'], 'signing in does not make dana cached there'
      assert_equal [], log_rows

      data = CAF.scenario
      data['rooms']['finance']['objects'].find { |o| o['id'] == 'profile_pc' }['cachedAccounts'] = [{ 'npc' => 'jake' }]
      build(data)
      dana
      assert_equal ['profile_pc|jake'], @game.harvest_cached_credentials!('profile_pc')[:added]
    end

    test 'the rows carry only the allowed keys and no password, token, pair or uncollected account' do
      build
      dana
      result = @game.harvest_cached_credentials!('profile_pc')
      rows = @game.harvested_rows('profile_pc', result[:added])
      assert_equal %w[jake dana], rows.map { |r| r['npcId'] }
      rows.each { |r| assert_equal ROW_KEYS, r.keys.sort }
      assert_equal 'hot_jake', rows[0]['hashId']
      assert_equal 'jbrooks', rows[0]['username']
      assert_equal 'Jake Brooks', rows[0]['displayName']
      assert_equal 'hot_dana', rows[1]['hashId']
      json = JSON.generate([result, rows])
      (AMS::PASSWORDS + [CAF::SAM_PASSWORD]).each { |pw| refute_includes json, pw }
      %w[sam sortiz Sam hot_sam cachedAccounts cachedAt harvestedAccounts password token salted].each { |w| refute_includes json, w }
    end

    test 'rows are given only for pairs held, cached now and at that PC' do
      build
      dana
      assert_equal [], @game.harvested_rows('profile_pc', ['profile_pc|jake']), 'not collected yet'
      @game.harvest_cached_credentials!('profile_pc')
      assert_equal %w[jake], @game.harvested_rows('profile_pc', ['profile_pc|jake']).map { |r| r['npcId'] }
      assert_equal [], @game.harvested_rows('profile_pc', ['it_pc|jake']), 'a pair of another PC'
      assert_equal [], @game.harvested_rows('profile_pc', ['profile_pc|sam']), 'sam is neither cached nor collected'
      @game.player_state['harvestedAccounts'] << 'profile_pc|sam'
      assert_equal [], @game.harvested_rows('profile_pc', ['profile_pc|sam']), 'a collected pair that is not cached now gives no row'
      assert_equal [], @game.harvested_rows('profile_pc', 'profile_pc|jake')
      assert_equal [], @game.harvested_rows('nope', ['nope|jake'])
    end

    test 'an account-only account has no portrait or avatar in its row' do
      data = CAF.scenario
      sam = data['rooms']['finance']['npcs'].find { |n| n['id'] == 'sam' }
      sam['accountOnly'] = true
      data['rooms']['finance']['objects'].find { |o| o['id'] == 'profile_pc' }['cachedAccounts'] = [{ 'npc' => 'sam' }]
      build(data)
      dana
      result = @game.harvest_cached_credentials!('profile_pc')
      row = @game.harvested_rows('profile_pc', result[:added]).first
      assert_equal 'sam', row['npcId']
      assert_nil row['portrait']
      assert_nil row['avatar']
      assert_equal 'sortiz', row['username']
    end
  end
end
