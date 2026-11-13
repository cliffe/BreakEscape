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

    # Review R1 m4: Tara borrows hot_desk (a sign-in PC under strict_social that satisfies
    # social_media) at 40; an annex the player has not opened holds a second tablet
    def borrow_and_annex_scenario
      data = scenario
      office = data['rooms']['office']
      office['objects'] << AccessSocialScenario.pc('hot_desk', 'policy' => 'strict_social',
                                                               'affordance' => { 'satisfies' => %w[work social_media], 'useSeconds' => 5 })
      npc_in(data, 'tara')['workarounds'] = [{ 'at' => 40, 'do' => 'borrow_session', 'pc' => 'hot_desk' }]
      office['connections']['north'] = 'annex'
      data['rooms']['annex'] = {
        'type' => 'room_office', 'connections' => { 'south' => 'office' }, 'locked' => true, 'lockType' => 'key',
        'objects' => [{ 'type' => 'tablet', 'id' => 'annex_tablet', 'name' => 'Tablet',
                        'affordance' => { 'satisfies' => ['social_media'], 'restores' => 60, 'useSeconds' => 10 } }],
        'npcs' => []
      }
      data
    end

    def hand_over_borrow!
      ps = @game.reload.player_state
      ps['npcFrustration'] = { 'tara' => { 'handed' => { '0' => { 'hand' => 1, 'time' => 0, 'need' => 'social_media' } } } }
      @game.update!(player_state: ps)
    end

    test 'R1 m4: a borrowed PC posts only once handed over, and not while the borrower is locked out there' do
      build(data: borrow_and_annex_scenario)
      assert ask('tara', object_id: 'hot_desk')['refused'], 'before the hand-over the hot desk is no place of hers'
      hand_over_borrow!
      assert_equal 'tara_post_1', ask('tara', object_id: 'hot_desk').dig('post', 'id'), 'handed over, the borrow is a source'

      build(data: borrow_and_annex_scenario)
      hand_over_borrow!
      lock_out!('hot_desk', 'tnair')
      assert ask('tara', object_id: 'hot_desk')['refused'], "her own username is locked out at the borrowed PC"
      assert_nil state.dig('feedRevealed', 'tara')
    end

    test 'R1 m4: a real social media object in a room the player has not opened is refused until it is opened' do
      build(data: borrow_and_annex_scenario)
      assert ask('tara', object_id: 'annex_tablet')['refused'], 'the annex is not in unlockedRooms'
      assert_nil state.dig('feedRevealed', 'tara')
      ps = @game.player_state
      ps['unlockedRooms'] = ps['unlockedRooms'] + ['annex']
      @game.update!(player_state: ps)
      assert_equal 'tara_post_1', ask('tara', object_id: 'annex_tablet').dig('post', 'id')
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

    # ── q33 code review R2 (m1 to m4) and user decision q36 ──────────────────────────────

    test 'q36: a check at a handed-over hot desk is answered and recorded; before the hand-over it is refused' do
      build(data: borrow_and_annex_scenario)
      lock_out!('hot_desk', 'tnair')
      assert report(check('tara', 'hot_desk')).first['refused'], 'not handed over: no place of hers'
      hand_over_borrow!
      a = report(check('tara', 'hot_desk')).first
      assert_equal true, a['lockedOut']
      assert_includes state.dig('npcFrustration', 'tara', 'lockedOut'), 'hot_desk'
      get scenario_game_url(@game), as: :json
      assert_includes response.parsed_body.dig('npcFrustration', 'tara', 'lockedOut'), 'hot_desk', 'restored after a reload'
      assert report(check('tara', 'jake_pc')).first['refused'], 'another NPC\'s station is still refused'
    end

    test 'q36: a check at a hot desk the borrower is not locked out at answers false and records nothing' do
      build(data: borrow_and_annex_scenario)
      hand_over_borrow!
      lock_out!('hot_desk', 'someone_else')
      assert_equal false, report(check('tara', 'hot_desk')).first['lockedOut']
      assert_empty Array(state.dig('npcFrustration', 'tara', 'lockedOut'))
    end

    test 'q36: a check at a hot desk under a policy with no maxAttempts is refused' do
      data = borrow_and_annex_scenario
      data['rooms']['office']['objects'].find { |o| o['id'] == 'hot_desk' }['policy'] = 'lax'
      data['policies']['lax'] ||= { 'social' => 'allowed' }
      build(data: data)
      hand_over_borrow!
      assert report(check('tara', 'hot_desk')).first['refused']
    end

    test 'R2 m1: an ease at a locked-out hot desk is refused, as the post there is' do
      build(data: borrow_and_annex_scenario)
      hand_over_borrow!
      ps = @game.player_state
      ps['npcFrustration']['tara']['level'] = 40
      @game.update!(player_state: ps)
      ease = { npc_id: 'tara', event: 'ease', need: 'social_media', object_id: 'hot_desk' }
      lock_out!('hot_desk', 'tnair')
      assert report(ease).first['refused'], 'her username is locked out at the borrowed PC'
      assert_equal 40, state.dig('npcFrustration', 'tara', 'level')

      build(data: borrow_and_annex_scenario)
      hand_over_borrow!
      ps = @game.player_state
      ps['npcFrustration']['tara']['level'] = 40
      @game.update!(player_state: ps)
      refute report(ease).first['refused'], 'not locked out: the ease is accepted'
    end

    def two_post_scenario(data = scenario)
      npc_in(data, 'tara')['feed']['posts'] << { 'id' => 'tara_post_2', 'text' => 'Tara posts again from somewhere.' }
      data
    end

    test 'R2 m2: a refused source inside the pace floor answers tooSoon, outside it refused' do
      build(data: two_post_scenario)
      assert_equal 'tara_post_1', ask('tara', object_id: 'tablet').dig('post', 'id')
      lock_out!('tara_pc', 'tnair')
      a = ask('tara', object_id: 'tara_pc')
      assert a['tooSoon'], 'inside the floor the lockout is not judged yet'
      refute a.key?('refused')
      travel(AccessWork.post_floor(@game.scenario_data, npc_in(@game.scenario_data, 'tara')) + 2) do
        assert ask('tara', object_id: 'tara_pc')['refused']
        assert_equal %w[tara_post_1], state.dig('feedRevealed', 'tara', 'shown')
      end
    end

    test 'R2 m3: the own station is refused as a source while its policy blocks social media or it is off' do
      data = scenario
      data['policies']['no_social_q'] = { 'social' => 'blocked' }
      data['rooms']['office']['objects'].find { |o| o['id'] == 'tara_pc' }['policy'] = 'no_social_q'
      build(data: data)
      assert ask('tara', object_id: 'tara_pc')['refused'], 'blocked: no honest client posts from there'
      assert_nil state.dig('feedRevealed', 'tara')

      data = scenario
      data['globalVariables'] = (data['globalVariables'] || {}).merge('tara_pc_off' => false)
      pc = data['rooms']['office']['objects'].find { |o| o['id'] == 'tara_pc' }
      pc['affordance'] = (pc['affordance'] || {}).merge('offWhen' => 'tara_pc_off')
      build(data: data, player_state: { 'globalVariables' => { 'tara_pc_off' => true } })
      assert ask('tara', object_id: 'tara_pc')['refused'], 'off: the PC is unusable'
      build(data: data, player_state: { 'globalVariables' => { 'tara_pc_off' => false } })
      assert_equal 'tara_post_1', ask('tara', object_id: 'tara_pc').dig('post', 'id'), 'on again: a source'
    end

    test 'R2 m4: a lockout at a station someone else owns does not stall the feed (no check can learn it)' do
      data = scenario
      data['rooms']['office']['objects'].find { |o| o['id'] == 'tara_pc' }['screenOwner'] = 'lena'
      build(data: data)
      lock_out!('tara_pc', 'tnair')
      assert report(check('tara', 'tara_pc')).first['refused'], 'no check is answered there'
      assert_equal 'tara_post_1', ask('tara', object_id: 'tara_pc').dig('post', 'id')
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
