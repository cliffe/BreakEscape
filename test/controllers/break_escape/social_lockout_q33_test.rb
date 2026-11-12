require 'test_helper'
require_relative '../../support/access_social_scenario'

module BreakEscape
  # User decision q33 (2026-11-12): a lockout (sub-slice L) stops every use of that PC, social
  # media included. The lockout locks the account at that PC, so the NPC falls back down the C
  # candidate order (ACCESS_MODEL_SLICE_9_2_PLAN.md 8.1) to another source and its own phone.
  # The server decides: a feed post from a locked-out PC is refused, a social_media fail naming
  # locked_out counts behind the check record, and an ease at the locked PC is refused.
  class SocialLockoutQ33Test < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include ActiveSupport::Testing::TimeHelpers

    LENA_PASSWORD = 'Lark-Lena-31'.freeze
    TARA_PASSWORD = 'Tern-Tara-58'.freeze

    def npc_in(data, id)
      data['rooms'].values.flat_map { |r| Array(r['npcs']) }.find { |n| n['id'] == id }
    end

    # The C fixture plus a policy that allows social media and sets maxAttempts 3. Lena (a
    # phone, a social_media need only) and Tara (no phone, a social_media need, a feed) own PCs
    # under it; a break room tablet in the office is a non-desk source.
    def scenario
      data = AccessSocialScenario.scenario
      data['policies']['strict_social'] = { 'social' => 'allowed', 'maxAttempts' => 3 }
      office = data['rooms']['office']
      office['objects'].find { |o| o['id'] == 'lena_pc' }['policy'] = 'strict_social'
      office['objects'] << AccessSocialScenario.pc('tara_pc', 'policy' => 'strict_social')
      office['objects'] << { 'type' => 'tablet', 'id' => 'tablet', 'name' => 'Tablet',
                             'affordance' => { 'satisfies' => ['social_media'], 'restores' => 60, 'useSeconds' => 10 } }
      npc_in(data, 'lena')['creds'] = { 'username' => 'lfox', 'password' => LENA_PASSWORD }
      office['npcs'] << AccessSocialScenario.npc('tara', 'phone' => false, 'needs' => AccessSocialScenario.social_need,
                                                         'creds' => { 'username' => 'tnair', 'password' => TARA_PASSWORD },
                                                         'feed' => { 'site' => 'friendface', 'person' => 'tara',
                                                                     'posts' => [{ 'id' => 'tara_post_1', 'text' => 'Tara posts from wherever she can.' }] })
      data
    end

    def build(data: scenario, player_state: {})
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: data,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby office],
                        'encounteredNPCs' => %w[jake lena omar nia tara] }.merge(player_state)
      )
    end

    def ask(npc_id, params = {})
      post feed_post_game_url(@game), params: { npc_id: npc_id }.merge(params), as: :json
      assert_response :success
      response.parsed_body
    end

    def report(*reports)
      post npc_frustration_game_url(@game), params: { reports: reports }, as: :json
      (response.parsed_body.is_a?(Hash) && response.parsed_body['answers']) || flunk("#{response.status} #{response.body[0, 300]}")
    end

    def check(npc, pc)
      { npc_id: npc, event: 'check', object_id: pc }
    end

    def locked_fail(npc, pc)
      { npc_id: npc, event: 'fail', need: 'social_media', object_id: pc, missing: [{ id: pc, why: 'locked_out' }] }
    end

    def lock_out!(pc, username)
      3.times { post login_game_url(@game), params: { pc_id: pc, username: username, password: 'not-the-password' }, as: :json }
      assert response.parsed_body['lockedOut'], 'the third wrong password locks the username out'
    end

    def state
      @game.reload.player_state
    end

    test 'can fail: with no phone, a lockout station makes social media able to fail; with a phone it never can' do
      build
      data = @game.scenario_data
      assert AccessWork.can_fail?(data, npc_in(data, 'tara'), 'social_media'), 'Tara: no phone, her own PC under maxAttempts'
      refute AccessWork.can_fail?(data, npc_in(data, 'lena'), 'social_media'), 'Lena has a phone: a dead or locked PC sends her to it'
    end

    test 'a check is answered for an owner with a social_media need and no work plan' do
      build
      assert_equal [{ 'npcId' => 'lena', 'lockedOut' => false }], report(check('lena', 'lena_pc'))
      lock_out!('lena_pc', 'lfox')
      assert_equal [{ 'npcId' => 'lena', 'lockedOut' => true }], report(check('lena', 'lena_pc'))
      assert_equal ['lena_pc'], state.dig('npcFrustration', 'lena', 'lockedOut')
      # Nia has no account, so her PC is no lockout station
      assert report(check('nia', 'nia_pc')).first['refused']
    end

    test 'a feed post from the locked-out PC is refused and writes nothing; the phone still posts' do
      build
      lock_out!('lena_pc', 'lfox')
      a = ask('lena', object_id: 'lena_pc')
      assert_equal({ 'npcId' => 'lena', 'post' => nil, 'done' => false, 'refused' => true }, a)
      assert_nil state.dig('feedRevealed', 'lena'), 'a refused source reveals nothing'
      b = ask('lena', object_id: nil)
      assert_equal 'lena_post_1', b.dig('post', 'id'), "Lena's own phone and accounts are unaffected"
    end

    test 'before any lockout the PC posts; a lockout of another username there leaves it usable' do
      build
      lock_out!('lena_pc', 'someone_else')
      assert_equal 'lena_post_1', ask('lena', object_id: 'lena_pc').dig('post', 'id')
    end

    test 'with no phone: the phone is refused, the tablet posts, the locked PC is refused' do
      build
      assert ask('tara', object_id: nil)['refused'], 'Tara has no phone to post from'
      lock_out!('tara_pc', 'tnair')
      assert ask('tara', object_id: 'tara_pc')['refused']
      assert_nil state.dig('feedRevealed', 'tara')
      assert_equal 'tara_post_1', ask('tara', object_id: 'tablet').dig('post', 'id')
    end

    test 'tampered client: a source that is not one of the NPC\'s places, or not a string, is refused' do
      build
      assert ask('lena', object_id: 'jake_pc')['refused'], "Jake's PC is no place of Lena's"
      assert ask('lena', object_id: 'no_such_pc')['refused']
      assert ask('lena', object_id: ['lena_pc'])['refused']
      assert ask('lena', object_id: { 'id' => 'lena_pc' })['refused']
      assert_nil state.dig('feedRevealed', 'lena')
    end

    test 'tampered client: the locked PC stays refused after a state sync that clears loginLockouts' do
      build
      lock_out!('lena_pc', 'lfox')
      put sync_state_game_url(@game), params: { globals: {}, loginLockouts: [], npcFrustration: {} }, as: :json
      assert_includes state['loginLockouts'], 'lena_pc|lfox', 'the client never writes loginLockouts'
      assert ask('lena', object_id: 'lena_pc')['refused']
    end

    test 'a social_media fail naming locked_out counts only behind the check record, and only with no phone' do
      build
      lock_out!('tara_pc', 'tnair')
      assert report(locked_fail('tara', 'tara_pc')).first['refused'], 'no record yet'
      assert_equal true, report(check('tara', 'tara_pc')).first['lockedOut']
      a = report(locked_fail('tara', 'tara_pc')).first
      refute a['refused']
      assert a['level'].to_f.positive?, 'the lockout counts as a frustration cause'
      assert_equal ['locked_out'], state.dig('npcFrustration', 'tara', 'failWhy', 'social_media')

      lock_out!('lena_pc', 'lfox')
      report(check('lena', 'lena_pc'))
      assert report(locked_fail('lena', 'lena_pc')).first['refused'], 'with a phone the need never fails'
    end

    test 'an ease at the locked-out PC is refused; an ease by phone is not' do
      build
      lock_out!('lena_pc', 'lfox')
      report(check('lena', 'lena_pc'))
      assert report({ npc_id: 'lena', event: 'ease', need: 'social_media', object_id: 'lena_pc' }).first['refused']
      refute report({ npc_id: 'lena', event: 'ease', need: 'social_media', object_id: nil }).first['refused']
    end
  end
end
