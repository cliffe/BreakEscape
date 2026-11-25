require 'test_helper'
require_relative '../../support/cached_accounts_fixture'

module BreakEscape
  # Ops S5b unit 08: the cached set of a sign-in PC, the borrow writer and the widened admin
  # profile reach (S5BC_BUILD_BRIEF unit 08).
  class CachedAccountsTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    CAF = CachedAccountsFixture
    AMS = AccessModelScenario

    def build(scenario = CAF.scenario)
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
        scenario: scenario, player_state: { 'currentRoom' => 'finance', 'unlockedRooms' => %w[lobby finance] }
      )
    end

    def pc(id = 'profile_pc')
      @game.find_login_pc(id)[:object]
    end

    def cached_ids(id = 'profile_pc')
      @game.cached_accounts_at(pc(id)).map { |n| n['id'] }
    end

    def sign_in(pc_id, name, password)
      post login_game_url(@game), params: { pc_id: pc_id, username: name, password: password }, as: :json
      assert response.parsed_body['success'], response.body
      @game.reload
    end

    test 'the cached set is the declared list in order, without a borrow candidate not yet borrowed' do
      build
      assert_equal %w[jake dana], cached_ids
      assert_equal [], cached_ids('it_pc'), 'a PC that declares none caches none'
      assert_equal [], @game.cached_accounts_at(nil)
      assert_equal [], @game.cached_accounts_at({ 'id' => 'x', 'cachedAccounts' => [{ 'npc' => 'jake' }] }), 'not a sign-in PC'
    end

    test 'a borrow candidate is cached once the borrow is noted, in authored order, and not before' do
      build
      assert @game.note_borrow_cached!(pc, 'sam')
      assert_equal %w[jake sam dana], cached_ids
      assert_equal ['profile_pc|sam'], @game.player_state['cachedAt']
      refute @game.note_borrow_cached!('profile_pc', 'sam'), 'a repeat adds nothing'
      assert_equal ['profile_pc|sam'], @game.player_state['cachedAt']
    end

    test 'the borrow writer refuses a start candidate, an undeclared account, a locked-out borrower and another PC' do
      build
      refute @game.note_borrow_cached!('profile_pc', 'jake'), 'jake has no after'
      refute @game.note_borrow_cached!('profile_pc', 'len'), 'not declared'
      refute @game.note_borrow_cached!('it_pc', 'sam'), 'declared at another PC only'
      refute @game.note_borrow_cached!('nope', 'sam')
      refute @game.note_borrow_cached!('profile_pc', 'nobody')
      @game.player_state['loginLockouts'] = [AccessIdentities.lockout_key('profile_pc', 'sortiz')]
      refute @game.note_borrow_cached!('profile_pc', 'sam'), 'a locked-out borrower cannot have signed in'
      assert_equal [], @game.player_state['cachedAt']
    end

    test 'a stale cachedAt pair is ignored and an undeclared pair never caches' do
      build
      @game.player_state['cachedAt'] = ['profile_pc|len', 'it_pc|sam', 'profile_pc|jake', 5, nil]
      assert_equal %w[jake dana], cached_ids
      assert_equal [], cached_ids('it_pc')
    end

    test 'a candidate that is not an account holder is skipped' do
      data = CAF.scenario
      data['rooms']['finance']['objects'].find { |o| o['id'] == 'profile_pc' }['cachedAccounts'] =
        [{ 'npc' => 'len' }, { 'npc' => 'ghost' }, { 'npc' => 'jake' }]
      build(data)
      assert_equal %w[jake], cached_ids
    end

    test 'the two keys exist empty, are in the default list and never ride a sync body, a bootstrap or a game page' do
      assert_equal [], Game::ACCESS_STATE_DEFAULTS['cachedAt']
      assert_equal [], Game::ACCESS_STATE_DEFAULTS['harvestedAccounts']
      build
      assert_equal [], @game.player_state['cachedAt']
      assert_equal [], @game.player_state['harvestedAccounts']
      put sync_state_game_url(@game), params: { cachedAt: ['profile_pc|sam'], harvestedAccounts: ['profile_pc|jake'],
                                                player_state: { cachedAt: ['profile_pc|sam'], harvestedAccounts: ['profile_pc|jake'] } }, as: :json
      @game.reload
      assert_equal [], @game.player_state['cachedAt']
      assert_equal [], @game.player_state['harvestedAccounts']
      get scenario_game_url(@game), as: :json
      %w[cachedAt harvestedAccounts].each { |k| refute_includes response.body, k }
      refute_includes response.body, 'profile_pc|'
      get "/break_escape/games/#{@game.id}/room/finance", as: :json
      %w[cachedAt harvestedAccounts].each { |k| refute_includes response.body, k }
    end

    test 'admin profile reach includes a cached account profile and not an uncached one' do
      build
      sign_in('profile_pc', 'DWhite', AMS::DANA_PASSWORD)
      assert @game.session_admin?('profile_pc')
      ids = @game.admin_profiles_at(pc).map(&:first)
      assert_includes ids, 'jake_files', 'jake is cached at the hot desk now'
      refute_includes ids, 'sam_files', 'sam is not cached until the borrow'
      assert @game.admin_session_opens_profile?('profile_pc', 'jake_files')
      refute @game.admin_session_opens_profile?('profile_pc', 'sam_files')
      @game.note_borrow_cached!('profile_pc', 'sam')
      assert_includes @game.admin_profiles_at(pc).map(&:first), 'sam_files'
      assert @game.admin_session_opens_profile?('profile_pc', 'sam_files')
    end

    test 'admin_present_accounts is the owner first, then the cached accounts, each once' do
      build
      assert_equal %w[jake dana], @game.admin_present_accounts(pc).map { |n| n['id'] }
      assert_equal %w[jake], @game.admin_present_accounts(pc('it_pc')).map { |n| n['id'] }, 'owner only, nothing cached'
      data = CAF.scenario
      data['rooms']['finance']['objects'].find { |o| o['id'] == 'profile_pc' }['owner'] = 'jake'
      build(data)
      assert_equal %w[jake dana], @game.admin_present_accounts(pc).map { |n| n['id'] }, 'the owner is not listed twice'
    end
  end
end
