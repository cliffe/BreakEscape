require 'test_helper'
require_relative '../../support/access_work_scenario'

module BreakEscape
  # Access model slice 9.2 sub-slice L (ACCESS_MODEL_SLICE_9_2_PLAN.md 6.6, 9.1, 9.4, 12 L-1):
  # an account locked out at its owner's own PC is a cause of failure. The server answers a
  # `check` from its own loginLockouts, records a true answer, accepts `locked_out` only behind
  # that record, and refuses the owner's claim at that PC while the lockout stands.
  class NpcLockoutLTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include ActiveSupport::Testing::TimeHelpers

    JAKE_PASSWORD = 'Jackdaw-Jake-72'.freeze
    LEO_PASSWORD = 'Linnet-Leo-19'.freeze

    def npc_in(data, id)
      data['rooms'].values.flat_map { |r| Array(r['npcs']) }.find { |n| n['id'] == id }
    end

    # The A fixture plus a `strict` policy (maxAttempts 3) and two owners under it: Jake (email
    # only, so a lockout is his one cause; his PC always locks; he borrows hot_desk at 40 and
    # leaves it open) and Leo (his PC never locks). Vic's PC under strict sits in a locked vault.
    def scenario
      data = AccessWorkScenario.scenario
      data['policies']['strict'] = { 'autoLockMin' => 5, 'maxAttempts' => 3 }
      office = data['rooms']['office']
      office['connections']['north'] = 'vault'
      office['objects'] += [
        AccessWorkScenario.pc('jake_pc', 'policy' => 'strict', 'lockChance' => 1),
        AccessWorkScenario.pc('leo_pc', 'policy' => 'strict', 'lockChance' => 0),
        AccessWorkScenario.pc('shared_pc', 'policy' => 'strict', 'screenOwner' => 'amy')
      ]
      office['npcs'] += [
        AccessWorkScenario.staff('jake', 'jbrooks', JAKE_PASSWORD, 'displayName' => 'Jake Brooks',
                                                                  'screenHabit' => { 'lockChance' => 0 },
                                                                  'workarounds' => [{ 'at' => 40, 'do' => 'borrow_session', 'pc' => 'hot_desk' }]),
        AccessWorkScenario.staff('leo', 'lmarsh', LEO_PASSWORD, 'displayName' => 'Leo Marsh'),
        # Pip's own station names another owner: no lockout station for Pip
        AccessWorkScenario.staff('pip', 'pkhan', 'Plover-Pip-40', 'needsHome' => 'shared_pc')
      ]
      data['rooms']['vault'] = {
        'type' => 'room_office', 'connections' => { 'south' => 'office' }, 'locked' => true, 'lockType' => 'key',
        'objects' => [AccessWorkScenario.pc('vic_pc', 'policy' => 'strict')],
        'npcs' => [AccessWorkScenario.staff('vic', 'vgrant', 'Vic-Vole-55')]
      }
      data
    end

    def build(data: scenario, player_state: {})
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: data,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby office],
                        'encounteredNPCs' => %w[dana kai ian amy omar temp_user jake leo pip vic] }.merge(player_state)
      )
    end

    def report(*reports)
      post npc_frustration_game_url(@game), params: { reports: reports }, as: :json
      (response.parsed_body.is_a?(Hash) && response.parsed_body['answers']) || flunk("#{response.status} #{response.body[0, 300]}")
    end

    def check(npc = 'jake', pc = 'jake_pc')
      { npc_id: npc, event: 'check', object_id: pc }
    end

    def locked_fail(npc = 'jake', pc = 'jake_pc', **kw)
      { npc_id: npc, event: 'fail', need: 'work', object_id: pc, missing: [{ id: pc, why: 'locked_out' }] }.merge(kw)
    end

    def sign_in(pc, username, password)
      post login_game_url(@game), params: { pc_id: pc, username: username, password: password }, as: :json
      response
    end

    def claim(pc)
      post login_game_url(@game), params: { pc_id: pc, claim: 'owner', globals: { "#{pc}_screen_locked" => false, "#{pc}_owner_away" => true } }, as: :json
      response
    end

    # Three wrong passwords for a username at a PC, through POST /login as the player types them
    def lock_out!(pc, username)
      3.times { sign_in(pc, username, 'not-the-password') }
      assert response.parsed_body['lockedOut'], 'the third wrong password locks the username out'
    end

    def state
      @game.reload.player_state
    end

    # ── can fail ───────────────────────────────────────────────────────

    test 'a sign-in station under maxAttempts makes work able to fail; one with no limit, or owned by another, does not' do
      build
      data = @game.scenario_data
      assert AccessWork.can_fail?(data, npc_in(data, 'jake'), 'work'), 'Jake: his own PC under strict'
      assert AccessWork.can_fail?(data, npc_in(data, 'leo'), 'work')
      refute AccessWork.can_fail?(data, npc_in(data, 'amy'), 'work'), 'Amy: managed has no maxAttempts'
      refute AccessWork.can_fail?(data, npc_in(data, 'pip'), 'work'), "Pip: his station is Amy's (screenOwner)"
      no_creds = npc_in(data, 'jake').merge('creds' => nil)
      refute AccessWork.lockout_station?(data, no_creds), 'an NPC with no account is never locked out'
    end

    # ── the check ──────────────────────────────────────────────────────

    test 'a check answers false and writes nothing while no lockout holds the owner at that PC' do
      build
      assert_equal [{ 'npcId' => 'jake', 'lockedOut' => false }], report(check)
      assert_nil state.dig('npcFrustration', 'jake'), 'no entry is made for a false answer'
    end

    test 'a check answers true only for the owner\'s own username at that PC, and records only that PC' do
      build
      lock_out!('jake_pc', 'someone_else')
      lock_out!('leo_pc', 'jbrooks')
      assert_equal false, report(check).first['lockedOut'], "another username at Jake's PC, or Jake's at Leo's, is not Jake locked out"
      assert_nil state.dig('npcFrustration', 'jake')

      lock_out!('jake_pc', 'JBrooks ')
      before = state.except('npcFrustration')
      assert_equal [{ 'npcId' => 'jake', 'lockedOut' => true }], report(check)
      entry = state.dig('npcFrustration', 'jake')
      assert_equal ['jake_pc'], entry['lockedOut']
      assert_equal 0, entry['level'], 'a check changes no level'
      assert_empty entry['failAt']
      assert_equal before, state.except('npcFrustration'), 'nothing else is written'
      assert_equal true, report(check).first['lockedOut']
      assert_equal ['jake_pc'], state.dig('npcFrustration', 'jake', 'lockedOut'), 'recorded once'
    end

    test 'a check is refused for another PC, a PC with no limit, a PC owned by another, a locked room or an NPC not met' do
      build(player_state: { 'loginLockouts' => %w[hot_desk|jbrooks amy_pc|acole shared_pc|pkhan vic_pc|vgrant leo_pc|lmarsh] })
      refused = ->(id) { { 'npcId' => id, 'refused' => true } }
      assert_equal [refused.call('jake'), refused.call('amy'), refused.call('pip'), refused.call('vic'), refused.call('nobody')],
                   report(check('jake', 'hot_desk'), check('amy', 'amy_pc'), check('pip', 'shared_pc'),
                          check('vic', 'vic_pc'), check('nobody', 'jake_pc'))
      @game.reload
      @game.player_state['encounteredNPCs'] -= ['leo']
      @game.save!
      assert_equal [refused.call('leo')], report(check('leo', 'leo_pc')), 'an NPC not yet met'
      assert_empty state['npcFrustration'].to_h, 'a refused check writes nothing'
    end

    # ── locked_out behind the record ───────────────────────────────────

    test 'a fail naming locked_out is refused until a check has recorded the lockout, then counted' do
      build
      assert_equal({ 'npcId' => 'jake', 'refused' => true }, report(locked_fail).first, 'no lockout at all')
      lock_out!('jake_pc', 'jbrooks')
      assert_equal({ 'npcId' => 'jake', 'refused' => true }, report(locked_fail).first, 'a lockout with no check record')
      assert_nil state.dig('npcFrustration', 'jake')
      report(check)
      a = report(locked_fail).first
      assert_equal 20, a['level']
      assert_equal ['locked_out'], state.dig('npcFrustration', 'jake', 'failWhy', 'work')
    end

    test 'a recorded lockout is a cause the server owns: rearmed is ignored and the station ease refused; a borrow ease opens the gate' do
      build(player_state: { 'loginLockouts' => ['jake_pc|jbrooks'] })
      report(check)
      t = Time.current
      assert_equal 20, travel_to(t) { report(locked_fail).first['level'] }
      assert travel_to(t + 5) { report(locked_fail(rearmed: true)).first['tooSoon'] }, 'rearmed is ignored: the park floor (24 s)'
      assert_equal({ 'npcId' => 'jake', 'refused' => true },
                   travel_to(t + 6) { report({ npc_id: 'jake', event: 'ease', need: 'work', object_id: 'jake_pc' }).first },
                   'no use at the locked-out station is met')
      second = travel_to(t + 25) { report(locked_fail).first }
      assert_equal 40, second['level']
      assert_equal 'borrow_session', second['run']['do']
      # the borrowed PC's met use is an ease, and the next lockout fail is then held only to the use floor
      assert_equal 30, travel_to(t + 30) { report({ npc_id: 'jake', event: 'ease', need: 'work', object_id: 'hot_desk' }).first['level'] }
      assert_equal 50, travel_to(t + 33) { report(locked_fail).first['level'] }
    end

    test 'a lockout recorded for one PC is no cause at another' do
      build(player_state: { 'loginLockouts' => ['jake_pc|jbrooks'] })
      report(check)
      assert_equal({ 'npcId' => 'jake', 'refused' => true }, report(locked_fail('jake', 'hot_desk')).first)
      assert_equal({ 'npcId' => 'leo', 'refused' => true }, report(locked_fail('leo', 'leo_pc')).first, "Jake's record is not Leo's")
    end

    # ── the owner claim ────────────────────────────────────────────────

    test 'the owner claim is refused while the owner is locked out at that PC, whatever the client says' do
      build
      assert_equal 200, claim('leo_pc').status, 'granted before the lockout'
      post logout_game_url(@game), params: { pc_id: 'leo_pc' }, as: :json
      lock_out!('leo_pc', 'lmarsh')
      res = claim('leo_pc')
      assert_equal 422, res.status
      assert_equal 'Sign in required', res.parsed_body['message']
      assert_nil state.dig('sessions', 'leo_pc')
      assert_nil state.dig('npcFrustration', 'leo'), 'the refusal records nothing: Leo, whose screen stays open, carries on'
    end

    # ── what the browser receives ──────────────────────────────────────

    test 'GET /scenario carries the recorded PCs and never the lockout list or the failures' do
      build
      lock_out!('jake_pc', 'jbrooks')
      lock_out!('jake_pc', 'guessed_name')
      report(check)
      get scenario_game_url(@game), as: :json
      body = response.parsed_body
      assert_equal ['jake_pc'], body.dig('npcFrustration', 'jake', 'lockedOut')
      text = response.body
      %w[loginLockouts loginFailures guessed_name].each { |s| refute_includes text, s }
    end

    test 'a sign-in answer is the same for a locked-out owner as for any locked-out username' do
      build
      lock_out!('jake_pc', 'jbrooks')
      owner = sign_in('jake_pc', 'jbrooks', 'x').parsed_body
      lock_out!('jake_pc', 'nobody_here')
      other = sign_in('jake_pc', 'nobody_here', 'x').parsed_body
      assert_equal other, owner
    end

    # ── tampered client ────────────────────────────────────────────────

    test 'a client cannot claim a lockout the server did not record, nor clear one it did' do
      build
      # claim one: a fail, a check for another PC, and globals that say so
      put sync_state_game_url(@game), params: { globalVariables: { 'jake_pc_screen_locked' => true, 'jake_locked_out' => true } }, as: :json
      assert_equal [{ 'npcId' => 'jake', 'refused' => true }, { 'npcId' => 'jake', 'lockedOut' => false }],
                   report(locked_fail, check)
      assert_nil state.dig('npcFrustration', 'jake')
      # a record cannot be planted through the state sync
      put sync_state_game_url(@game), params: { npcFrustration: { 'jake' => { 'lockedOut' => ['jake_pc'] } },
                                                loginLockouts: ['jake_pc|jbrooks'] }, as: :json
      assert_empty state['npcFrustration'].to_h
      assert_empty Array(state['loginLockouts'])
      assert_equal({ 'npcId' => 'jake', 'refused' => true }, report(locked_fail).first)

      # clear one: the real lockout stands whatever the client sends
      lock_out!('jake_pc', 'jbrooks')
      report(check)
      put sync_state_game_url(@game), params: { npcFrustration: { 'jake' => { 'lockedOut' => [] } }, loginLockouts: [] }, as: :json
      assert_equal ['jake_pc'], state.dig('npcFrustration', 'jake', 'lockedOut')
      assert_includes state['loginLockouts'], 'jake_pc|jbrooks'
      assert_equal 422, claim('jake_pc').status
      assert_equal 20, report(locked_fail).first['level']
      assert_equal true, sign_in('jake_pc', 'jbrooks', JAKE_PASSWORD).parsed_body['lockedOut'], 'even the right password is refused'
    end

    # ── review round 1 ─────────────────────────────────────────────────

    def guest_claim(pc)
      post login_game_url(@game), params: { pc_id: pc, claim: 'guest' }, as: :json
      response
    end

    # The hot desk under strict too, so Jake can be locked out there as well as at his own PC
    def strict_hot_desk
      data = scenario
      data['rooms']['office']['objects'].find { |o| o['id'] == 'hot_desk' }['policy'] = 'strict'
      data
    end

    test 'R1 m1: a guest locked out at the borrowed PC leaves no claimable session there' do
      build(data: strict_hot_desk, player_state: { 'loginLockouts' => ['hot_desk|jbrooks', 'jake_pc|jbrooks'] })
      report(check)
      t = Time.current
      travel_to(t) { report(locked_fail) }
      run = travel_to(t + 25) { report(locked_fail).first['run'] }
      assert_equal 'borrow_session', run['do']
      travel_to(t + 60) { post npc_workaround_game_url(@game), params: { npc_id: 'jake', index: run['index'], hand: run['hand'] }, as: :json }
      assert_equal 200, response.status
      assert_nil state.dig('guestSessions', 'hot_desk'), 'Jake cannot have signed in at the hot desk'
      assert_equal 422, travel_to(t + 61) { guest_claim('hot_desk') }.status
    end

    test 'R1 m1: the guest claim is refused while the guest is locked out at that PC, whatever the record says' do
      build(data: strict_hot_desk, player_state: { 'guestSessions' => { 'hot_desk' => 'jake' } })
      @game.player_state['guestSessionsAt'] = { 'hot_desk' => @game.server_now }
      @game.save!
      @game.player_state['loginLockouts'] = ['hot_desk|jbrooks']
      @game.save!
      res = guest_claim('hot_desk')
      assert_equal 422, res.status
      assert_nil state.dig('sessions', 'hot_desk')
      # Review R2 n2: the record that can never be claimed goes, as a timed-out one does
      assert_nil state.dig('guestSessions', 'hot_desk')
      assert_equal 422, guest_claim('hot_desk').status, 'no guest record left to claim'
      @game.reload
      @game.player_state['loginLockouts'] = []
      @game.player_state['guestSessions'] = { 'hot_desk' => 'jake' }
      @game.player_state['guestSessionsAt'] = { 'hot_desk' => @game.server_now }
      @game.save!
      assert_equal 200, guest_claim('hot_desk').status, 'granted once no lockout holds'
    end

    test 'R1 m2: a recorded lockout is a work cause only; a social_media ease at the station is answered and its fail refused' do
      data = scenario
      jake_pc = data['rooms']['office']['objects'].find { |o| o['id'] == 'jake_pc' }
      jake_pc['affordance'] = { 'satisfies' => %w[work social_media], 'useSeconds' => 5, 'offWhen' => 'jake_pc_off' }
      data['globalVariables']['jake_pc_off'] = false
      npc_in(data, 'jake')['needs']['social_media'] = { 'decayPerMin' => 4, 'urgentAt' => 40 }
      npc_in(data, 'jake')['phone'] = false # social media at the desk only, so it can fail there
      build(data: data, player_state: { 'loginLockouts' => ['jake_pc|jbrooks'] })
      report(check)
      t = Time.current
      assert_equal 20, travel_to(t) { report(locked_fail).first['level'] }
      social_fail = { npc_id: 'jake', event: 'fail', need: 'social_media', object_id: 'jake_pc', missing: [{ id: 'jake_pc', why: 'locked_out' }] }
      assert_equal({ 'npcId' => 'jake', 'refused' => true }, travel_to(t + 30) { report(social_fail).first }, 'locked_out is no social_media cause')
      ease = travel_to(t + 31) { report({ npc_id: 'jake', event: 'ease', need: 'social_media', object_id: 'jake_pc' }).first }
      refute ease['refused'], 'a social ease at the station is not refused'
      assert ease['level'] < 20
    end

    test 'R1 m3: a check is refused for an owner with no work plan' do
      data = scenario
      data['rooms']['office']['objects'] << AccessWorkScenario.pc('nell_pc', 'policy' => 'strict', 'lockChance' => 1)
      data['rooms']['office']['npcs'] << AccessWorkScenario.staff('nell', 'nnash', 'Nightjar-Nell-8',
                                                                  'needs' => { 'hunger' => { 'decayPerMin' => 4, 'urgentAt' => 40 } })
      build(data: data, player_state: { 'loginLockouts' => ['nell_pc|nnash'] })
      @game.player_state['encounteredNPCs'] << 'nell'
      @game.save!
      assert_equal [{ 'npcId' => 'nell', 'refused' => true }], report(check('nell', 'nell_pc'))
      assert_empty state['npcFrustration'].to_h, 'nothing recorded'
    end

    test 'R1 n3: a record that outlives its lockout is no cause' do
      build(player_state: { 'npcFrustration' => { 'jake' => { 'level' => 20, 'lockedOut' => ['jake_pc'] } } })
      assert_equal({ 'npcId' => 'jake', 'refused' => true }, report(locked_fail).first)
      refute report({ npc_id: 'jake', event: 'ease', need: 'work', object_id: 'jake_pc' }).first['refused'], 'the station ease is accepted'
    end

    test 'R1 n4: GET /scenario sends only the station from a stored lockedOut list' do
      build(player_state: { 'loginLockouts' => ['jake_pc|jbrooks'],
                            'npcFrustration' => { 'jake' => { 'level' => 0, 'lockedOut' => ['jake_pc', 'leo_pc', 7] } } })
      get scenario_game_url(@game), as: :json
      assert_equal ['jake_pc'], response.parsed_body.dig('npcFrustration', 'jake', 'lockedOut')
    end

    test 'R1 M1: GET /scenario lists the sign-in PCs with a lockout, by id only, and nothing more' do
      build
      get scenario_game_url(@game), as: :json
      assert_equal [], response.parsed_body['lockoutPcs'], 'no lockout: an empty list'
      lock_out!('jake_pc', 'guessed_name')
      lock_out!('jake_pc', 'jbrooks')
      lock_out!('leo_pc', 'another_guess')
      @game.reload
      @game.player_state['loginLockouts'] << 'no_such_pc|someone'
      @game.save!
      get scenario_game_url(@game), as: :json
      assert_equal %w[jake_pc leo_pc], response.parsed_body['lockoutPcs']
      %w[guessed_name jbrooks another_guess someone no_such_pc].each { |s| refute_includes response.body, s }
      assert_empty state['npcFrustration'].to_h, 'GET /scenario writes no record'
    end
  end
end
