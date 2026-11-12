require 'test_helper'
require_relative '../../support/access_work_scenario'

module BreakEscape
  # Access model slice 9.2 step H-1 (ACCESS_MODEL_SLICE_9_2_PLAN.md 6.4, 6.5, 9.1, 9.2 and 9.4):
  # the repeating workarounds. borrow_session leaves a guest session the player can claim at a hot
  # desk; share_login says a login out loud, which the server serves only for a heard "done" in a
  # room the player has opened.
  class NpcWorkaroundHTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include ActiveSupport::Testing::TimeHelpers

    IAN_PASSWORD = AccessWorkScenario::PASSWORDS[2]
    SAM_PASSWORD = 'Sam-Sparrow-46'.freeze
    LEAVES_OPEN = { 'lockChance' => 0 }.freeze

    def npc_in(data, id)
      data['rooms'].values.flat_map { |r| Array(r['npcs']) }.find { |n| n['id'] == id }
    end

    # The A fixture plus: Ian (his PC unplugged, `off`) borrows hot_desk at 40 and leaves it open;
    # Sam (+printer, jammed) shares his login with Ruth at 40; Ruth sits in the office; Vic sits in
    # a locked vault. Staff perFail is 20, the park floor 24 s.
    def scenario(ian_habit: LEAVES_OPEN, ian_workarounds: nil, sam_with: 'ruth')
      data = AccessWorkScenario.scenario
      data['globalVariables'].merge!('ian_pc_unplugged' => true, 'printer_jammed' => true)
      data['social']['captures'] = { 'revealSecret' => true }
      office = data['rooms']['office']
      office['connections']['north'] = 'vault'
      office['objects'] += [AccessWorkScenario.pc('sam_pc'), AccessWorkScenario.pc('ruth_pc')]
      ian = npc_in(data, 'ian')
      ian['workarounds'] = ian_workarounds || [{ 'at' => 40, 'do' => 'borrow_session', 'pc' => 'hot_desk' }]
      ian['screenHabit'] = ian_habit if ian_habit
      office['npcs'] += [
        AccessWorkScenario.staff('sam', 'sokafor', SAM_PASSWORD, 'displayName' => 'Sam Okafor', 'workNeeds' => ['+printer'],
                                                               'workarounds' => [{ 'at' => 40, 'do' => 'share_login', 'with' => sam_with }]),
        AccessWorkScenario.staff('ruth', 'radeyemi', 'Ruth-Robin-81', 'displayName' => 'Ruth Adeyemi'),
        { 'id' => 'visitor', 'displayName' => 'Visitor', 'npcType' => 'person' }
      ]
      data['rooms']['vault'] = {
        'type' => 'room_office', 'connections' => { 'south' => 'office' }, 'locked' => true, 'lockType' => 'key',
        'objects' => [AccessWorkScenario.pc('vic_pc')],
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
                        'encounteredNPCs' => %w[dana kai ian amy omar temp_user sam ruth vic visitor],
                        'globalVariables' => { 'ian_pc_unplugged' => true, 'printer_jammed' => true } }.merge(player_state)
      )
    end

    def report(*reports)
      post npc_frustration_game_url(@game), params: { reports: reports }, as: :json
      (response.parsed_body.is_a?(Hash) && response.parsed_body['answers']) || flunk("#{response.status} #{response.body[0, 300]}")
    end

    def fail_r(npc)
      case npc
      when 'ian' then { npc_id: 'ian', event: 'fail', need: 'work', object_id: 'ian_pc', missing: [{ id: 'ian_pc', why: 'off' }] }
      when 'sam' then { npc_id: 'sam', event: 'fail', need: 'work', object_id: 'sam_pc', missing: [{ id: 'printer', why: 'down' }] }
      when 'dana' then { npc_id: 'dana', event: 'fail', need: 'work', object_id: 'dana_pc', missing: [{ id: 'finance_share', why: 'down' }] }
      end
    end

    def fails(npc, count, t)
      (0...count).map { |i| travel_to(t + (i * 25)) { report(fail_r(npc)).first } }
    end

    def done(npc, run, at, extra = {})
      travel_to(at) do
        post npc_workaround_game_url(@game), params: { npc_id: npc, index: run['index'], hand: run['hand'] }.merge(extra), as: :json
      end
      response
    end

    def state
      @game.reload.player_state
    end

    def claim(pc = 'hot_desk', kind = 'guest')
      post login_game_url(@game), params: { pc_id: pc, claim: kind }, as: :json
      response
    end

    def secrets
      get capture_secrets_game_url(@game), as: :json
      response.parsed_body['secrets']
    end

    def borrow_done!(t = Time.current)
      run = fails('ian', 2, t).last['run']
      assert_equal 'borrow_session', run['do']
      assert_equal 200, done('ian', run, t + 60).status
      run
    end

    # ── hand-over: the repeating kinds ─────────────────────────────────

    test 'a borrow is handed over with its pc, need and dwell, and nothing secret' do
      build
      a = fails('ian', 2, Time.current)
      assert_nil a[0]['run']
      assert_equal({ 'index' => 0, 'hand' => 1, 'do' => 'borrow_session', 'dwell' => 4.0, 'pc' => 'hot_desk', 'need' => 'work' }, a[1]['run'],
                   'a guest who leaves the screen open: no leavesOpen; the dwell is the hot desk use (7 s) less 3')
      assert_equal 2, a[1]['tell']
      refute_includes a.to_json, IAN_PASSWORD
    end

    test 'repeating workarounds come round in turn after each later failure, and keep the NPC unsettled' do
      ws = [{ 'at' => 40, 'do' => 'borrow_session', 'pc' => 'hot_desk' }, { 'at' => 40, 'do' => 'share_login', 'with' => 'ruth' }]
      build(data: scenario(ian_workarounds: ws))
      t = Time.current
      runs = []
      a = fails('ian', 2, t)
      runs << a.last['run']
      assert_equal 200, done('ian', runs.last, t + 30).status
      (1..4).each do |k|
        r = fails('ian', 1, t + 30 + (k * 30)).first
        runs << r['run']
        assert_equal 200, done('ian', r['run'], t + 40 + (k * 30), heard: false).status
      end
      assert_equal [0, 1, 0, 1, 0], runs.map { |r| r['index'] }
      assert_equal [1, 2, 3, 4, 5], runs.map { |r| r['hand'] }
      last = fails('ian', 1, t + 300).first
      assert_equal 100, last['level']
      assert_equal false, last['settled'], 'a repeating workaround keeps an NPC unsettled at 100'
      assert_empty state['npcFrustration']['ian']['done'], 'repeating workarounds are never "done" as lasting ones are'
    end

    test 'a repeating workaround handed over and waiting is not handed over again; the same hand rides again' do
      build
      t = Time.current
      run = fails('ian', 2, t).last['run']
      again = fails('ian', 1, t + 50).first
      assert_equal [run['index'], run['hand']], [again['run']['index'], again['run']['hand']]
      assert_equal 1, state['npcFrustration']['ian']['hands']
    end

    # ── borrow_session ─────────────────────────────────────────────────

    test 'borrow done writes guestSessions and ends a session the player held at that PC' do
      build(player_state: { 'sessions' => { 'hot_desk' => { 'id' => 'temp_user', 'via' => 'password' } } })
      t = Time.current
      run = fails('ian', 2, t).last['run']
      assert_equal 425, done('ian', run, t + 26).status, 'the dwell runs from the hand-over'
      res = done('ian', run, t + 40)
      assert_equal 200, res.status
      assert_equal({ 'pcId' => 'hot_desk', 'guest' => true }, res.parsed_body)
      assert_equal({ 'hot_desk' => 'ian' }, state['guestSessions'])
      assert_nil state['sessions']['hot_desk'], 'one screen, one session'
      assert_equal({ 'pcId' => 'hot_desk', 'guest' => true }, done('ian', run, t + 41).parsed_body, 'a resend gets the same body')
    end

    # q43 review R1 M1: a long use (30 s, a 27 s floor) cut short soon after the sit. A refused
    # "done", resent after the floor, would end a password session the player opened meanwhile
    def long_hot_desk
      data = scenario
      desk = data['rooms']['office']['objects'].find { |o| o['id'] == 'hot_desk' }
      desk['affordance'] = desk['affordance'].merge('useSeconds' => 30)
      data
    end

    test 'a cut-short borrow "done" skips the floor; a whole use and a cut on another kind do not' do
      build(data: long_hot_desk)
      t = Time.current
      run = fails('ian', 2, t).last['run']
      assert_equal 27.0, run['dwell']
      assert_equal 425, done('ian', run, t + 30).status, 'a whole use waits out the floor'
      assert_equal 425, done('ian', run, t + 30, cut: 'yes').status, 'only true or "true" is a cut'
      res = done('ian', run, t + 30, cut: true)
      assert_equal 200, res.status, 'cut short 5 s after the hand-over: accepted at once'
      assert_equal({ 'pcId' => 'hot_desk', 'guest' => true }, res.parsed_body)
      assert_equal({ 'hot_desk' => 'ian' }, state['guestSessions'])
      assert_in_delta (t + 30).to_f, state['guestSessionsAt']['hot_desk'].to_f, 1.0, 'stamped when the use ended, not after a retry'

      # a share's cut flag changes nothing
      build(data: long_hot_desk)
      srun = fails('sam', 2, t).last['run']
      assert_equal 'share_login', srun['do']
      assert_equal 425, done('sam', srun, t + 26, cut: true, heard: false).status
    end

    test 'the cut-short "done" lands before a password sign-in in the gap, which then ends the guest and keeps its own session' do
      build(data: long_hot_desk)
      t = Time.current
      run = fails('ian', 2, t).last['run']
      assert_equal 200, done('ian', run, t + 30, cut: true).status
      travel_to(t + 35) do
        post login_game_url(@game), params: { pc_id: 'hot_desk', username: 'ishaw', password: IAN_PASSWORD }, as: :json
      end
      assert_equal 200, response.status, response.body[0, 300]
      assert_empty state['guestSessions'], 'a password sign-in ends the guest'
      assert state['sessions']['hot_desk'], 'the player keeps the session'
      # the runner's resend (a lost answer) writes nothing. Review R2 n3: reached only once the
      # cut "done" above is accepted, so a mutation that breaks the cut stops the case first and
      # never tests this line; the resend itself is the lastSpent path, covered on its own above
      assert_equal 200, done('ian', run, t + 60, cut: true).status
      assert state['sessions']['hot_desk'], 'a resent "done" does not end it'
      assert_empty state['guestSessions'], 'nor writes the guest back'
    end

    test 'leavesOpen is false in run for each careful guest and absent for one who leaves it open' do
      careful = [nil, { 'lockChance' => 1 }, { 'note' => 'no numeric chance' }]
      careful.each do |habit|
        build(data: scenario(ian_habit: habit))
        assert_equal false, fails('ian', 2, Time.current).last['run']['leavesOpen'], "careful: #{habit.inspect}"
      end
      [LEAVES_OPEN, { 'lockChance' => 0.5 }, { 'lockIfAwayOverSeconds' => 60 }].each do |habit|
        build(data: scenario(ian_habit: habit))
        refute fails('ian', 2, Time.current).last['run'].key?('leavesOpen'), "leaves open: #{habit.inspect}"
      end
    end

    test 'locksScreen habits (slice 9.1) decide the guest as they fill the screenHabit' do
      { 'always' => false, 'never' => nil }.each do |value, expected|
        data = scenario(ian_habit: nil)
        npc_in(data, 'ian')['habits'] = { 'locksScreen' => value }
        build(data: data)
        got = fails('ian', 2, Time.current).last['run']['leavesOpen']
        expected.nil? ? assert_nil(got, "locksScreen #{value}") : assert_equal(expected, got, "locksScreen #{value}")
      end
    end

    test 'a careful guest borrows and leaves no guest record; its claim is refused' do
      build(data: scenario(ian_habit: nil))
      borrow_done!
      assert_empty state['guestSessions']
      assert_equal 422, claim.status
    end

    test 'the guest claim succeeds with a guest record and nobody signed in' do
      build
      borrow_done!
      res = claim
      assert_equal 200, res.status
      assert_equal 'ian', res.parsed_body['npcId']
      assert_equal 'claim', res.parsed_body['via']
      assert_equal({ 'id' => 'ian', 'via' => 'claim' }, state['sessions']['hot_desk'])
      assert_includes state['signedInPcs'], 'hot_desk'
      assert_equal({ 'hot_desk' => 'ian' }, state['guestSessions'], 'the guest\'s own claim does not end the guest record (R2 m2)')
      refute_includes res.body, IAN_PASSWORD
    end

    test 'each guest claim refusal answers "Sign in required" and writes nothing' do
      # a tampered client that claims with no borrow done
      build
      assert_equal 422, claim.status, 'no guest record'
      assert_equal Game::LOGIN_CLAIM_REFUSED, response.parsed_body['message']
      assert_equal 422, claim('hot_desk', 'owner').status, 'an owner claim at an unowned PC'

      # a session held there
      build(player_state: { 'guestSessions' => { 'hot_desk' => 'ian' }, 'sessions' => { 'hot_desk' => { 'id' => 'temp_user', 'via' => 'password' } } })
      assert_equal 422, claim.status
      assert_equal 'temp_user', state['sessions']['hot_desk']['id']

      # a guest with no account
      build(player_state: { 'guestSessions' => { 'hot_desk' => 'visitor' } })
      assert_equal 422, claim.status

      # not admitted
      data = scenario
      data['rooms']['office']['objects'].find { |o| o['id'] == 'hot_desk' }['access'] = { 'roles' => ['finance'] }
      build(data: data, player_state: { 'guestSessions' => { 'hot_desk' => 'ian' } })
      assert_equal 422, claim.status

      # autoLockMin 0
      data = scenario
      data['policies']['kiosk'] = { 'autoLockMin' => 0 }
      data['rooms']['office']['objects'].find { |o| o['id'] == 'hot_desk' }['policy'] = 'kiosk'
      build(data: data, player_state: { 'guestSessions' => { 'hot_desk' => 'ian' } })
      assert_equal 422, claim.status

      # careful guests: no habit, lockChance 1, locksScreen always
      [nil, { 'lockChance' => 1 }].each do |habit|
        build(data: scenario(ian_habit: habit), player_state: { 'guestSessions' => { 'hot_desk' => 'ian' } })
        assert_equal 422, claim.status, "careful #{habit.inspect}"
      end
      data = scenario(ian_habit: nil)
      npc_in(data, 'ian')['habits'] = { 'locksScreen' => 'always' }
      build(data: data, player_state: { 'guestSessions' => { 'hot_desk' => 'ian' } })
      assert_equal 422, claim.status, 'locksScreen always'

      # a room the player has not opened
      build(player_state: { 'unlockedRooms' => %w[lobby], 'guestSessions' => { 'hot_desk' => 'ian' } })
      assert_equal 422, claim.status, 'PC not reachable'
      assert_nil state['sessions']['hot_desk']
    end

    test 'guestSessions is empty after GET /scenario, which also ends the guest claim' do
      build
      borrow_done!
      assert_equal 200, claim.status
      get scenario_game_url(@game), as: :json
      assert_response :success
      refute response.parsed_body.key?('guestSessions'), 'never sent'
      assert_empty state['guestSessions']
      assert_nil state['sessions']['hot_desk'], 'a claimed session ends on a reload'
      assert_equal 422, claim.status
    end

    test 'the hot desk is a place for an ease only once its borrow is handed over' do
      build
      t = Time.current
      ease = { npc_id: 'ian', event: 'ease', need: 'work', object_id: 'hot_desk' }
      fails('ian', 1, t)
      assert_equal({ 'npcId' => 'ian', 'refused' => true }, travel_to(t + 10) { report(ease).first }, 'before the hand-over')
      run = fails('ian', 1, t + 25).first['run']
      assert_equal 'hot_desk', run['pc']
      done('ian', run, t + 35)
      met = travel_to(t + 40) { report(ease).first }
      assert_equal 30, met['level'], 'eased at the borrowed PC'
    end

    # ── share_login ────────────────────────────────────────────────────

    test 'a heard share in the colleague\'s open room answers the capture, the line and the note' do
      build
      t = Time.current
      run = fails('sam', 2, t).last['run']
      assert_equal({ 'index' => 0, 'hand' => 1, 'do' => 'share_login', 'dwell' => 6, 'with' => 'ruth' }, run)
      assert_equal 425, done('sam', run, t + 27, heard: true, room_id: 'office').status
      res = done('sam', run, t + 40, heard: true, room_id: 'office')
      assert_equal 200, res.status
      body = res.parsed_body
      assert_equal({ 'targetId' => 'sam', 'kind' => 'credential', 'address' => 'sokafor', 'note' => body['note'] }, body['capture'])
      assert_includes body['line'], 'sokafor'
      assert_includes body['line'], SAM_PASSWORD
      assert_includes body['note'], 'Sam Okafor'
      assert_includes body['note'], 'Ruth Adeyemi'
      assert_equal ['sam'], state['sharedLogins']
      assert_equal body, done('sam', run, t + 41, heard: true, room_id: 'office').parsed_body, 'a resend gets the same body'
    end

    test 'a heard share stays in turn and sharedLogins grows once' do
      build
      t = Time.current
      first = fails('sam', 2, t).last['run']
      done('sam', first, t + 40, heard: true, room_id: 'office')
      second = fails('sam', 1, t + 50).first['run']
      assert_equal [0, 2], [second['index'], second['hand']], 'comes round again'
      assert_equal 200, done('sam', second, t + 60, heard: true, room_id: 'office').status
      assert_equal ['sam'], state['sharedLogins']
    end

    test 'a share claimed heard in another room, a locked room or with no room is taken as not heard' do
      [['lobby', 'a room Ruth is never in'], ['', 'no room'], [nil, 'none sent']].each do |room, why|
        build(player_state: { 'currentRoom' => 'office' })
        t = Time.current
        run = fails('sam', 2, t).last['run']
        res = done('sam', run, t + 40, { heard: true, room_id: room }.compact)
        assert_equal({}, res.parsed_body, why)
        assert_empty state['sharedLogins'], "#{why}; player_state.currentRoom is not read"
      end
      # the colleague's room is still locked
      build(data: scenario(sam_with: 'vic'))
      t = Time.current
      run = fails('sam', 2, t).last['run']
      assert_equal({}, done('sam', run, t + 40, heard: true, room_id: 'vault').parsed_body)
      assert_empty state['sharedLogins']
      # heard: false, or a heard value that is not true
      build
      t = Time.current
      run = fails('sam', 2, t).last['run']
      assert_equal({}, done('sam', run, t + 40, heard: 'yes', room_id: 'office').parsed_body)
      assert_empty state['sharedLogins']
      assert_equal({}, done('sam', run, t + 41, heard: true, room_id: 'office').parsed_body, 'a resend of an unheard done stays unheard')
      assert_empty state['sharedLogins']
    end

    test 'a share in a leashed colleague\'s other room counts once that room is open' do
      data = scenario
      npc_in(data, 'ruth')['needsRooms'] = %w[office vault]
      build(data: data, player_state: { 'unlockedRooms' => %w[lobby office vault] })
      t = Time.current
      run = fails('sam', 2, t).last['run']
      assert_equal 'sam', done('sam', run, t + 40, heard: true, room_id: 'vault').parsed_body.dig('capture', 'targetId')
    end

    test '/capture_secrets serves a shared login only after a heard done, with the proof rule in force' do
      data = scenario
      # a declared proof elsewhere in the scenario turns the proof rule on
      npc_in(data, 'temp_user')['captureProof'] = [{ 'session' => 'temp_user_pc' }]
      npc_in(data, 'temp_user')['eventMappings'] = [{ 'eventPattern' => 'x', 'addCapture' => { 'kind' => 'credential' } }]
      build(data: data)
      assert CaptureModel.declares_proofs?(@game.scenario_data), 'the proof rule is in force'
      @game.player_state['globalVariables']['se_captures'] = { 'sam' => { 'kind' => 'credential', 'address' => 'sokafor' } }
      @game.save!
      assert_equal({}, secrets, 'a capture the client wrote, with no heard share: nothing')
      t = Time.current
      run = fails('sam', 2, t).last['run']
      done('sam', run, t + 40, heard: false)
      assert_equal({}, secrets, 'not heard: nothing')
      run = fails('sam', 1, t + 50).first['run']
      done('sam', run, t + 60, heard: true, room_id: 'office')
      assert_equal({ 'sam' => SAM_PASSWORD }, secrets)
    end

    test 'no exposure: the shared password is in no other response before or after the heard share' do
      build
      t = Time.current
      get scenario_game_url(@game), as: :json
      refute_includes response.body, SAM_PASSWORD
      get room_game_url(@game, room_id: 'office'), as: :json
      refute_includes response.body, SAM_PASSWORD
      refute_includes response.body, '"share_login"'
      run = fails('sam', 2, t).last['run']
      done('sam', run, t + 40, heard: true, room_id: 'office')
      get scenario_game_url(@game), as: :json
      # Under revealSecret the earned heard-share capture note carries the password: that note is
      # the payoff, now recorded server-side and shipped only under the bootstrap's `captures` and
      # its savedGlobalVariables.se_captures mirror (sync deltas R2, 6a). It must appear nowhere else.
      body = JSON.parse(response.body)
      body.delete('captures')
      body['savedGlobalVariables']&.delete('se_captures')
      refute_includes body.to_json, SAM_PASSWORD
      get room_game_url(@game, room_id: 'office'), as: :json
      refute_includes response.body, SAM_PASSWORD
      get login_accounts_game_url(@game, pc_id: 'sam_pc'), as: :json
      refute_includes response.body, SAM_PASSWORD
    end

    test 'a tampered client cannot spend a share or borrow the server never handed over' do
      build
      post npc_workaround_game_url(@game), params: { npc_id: 'sam', index: 0, hand: 1, heard: true, room_id: 'office' }, as: :json
      assert_equal 403, response.status
      post npc_workaround_game_url(@game), params: { npc_id: 'ian', index: 0, hand: 1 }, as: :json
      assert_equal 403, response.status
      assert_empty state['sharedLogins']
      assert_empty state['guestSessions']
    end

    # ── review round 1 ─────────────────────────────────────────────────

    def logout(pc = 'hot_desk')
      post logout_game_url(@game), params: { pc_id: pc }, as: :json
      response
    end

    def sign_in(pc, username, password)
      post login_game_url(@game), params: { pc_id: pc, username: username, password: password }, as: :json
      response
    end

    test 'R1 M1: signing out of a claimed guest session ends it; the next claim is refused' do
      build
      borrow_done!
      assert_equal 200, claim.status
      assert_equal 200, logout.status
      assert_empty state['guestSessions'], 'the sign-out ends the guest session'
      assert_equal 422, claim.status, 'the next click is the sign-in screen'
    end

    test 'R1 M1: a password sign-in at the hot desk ends the guest session there' do
      build
      borrow_done!
      assert_equal 'ian', state['guestSessions']['hot_desk']
      assert_equal 200, sign_in('hot_desk', 'temp', AccessWorkScenario::PASSWORDS[5]).status
      assert_empty state['guestSessions'], 'one screen holds one session'
      assert_equal 200, logout.status
      assert_equal 422, claim.status, 'signed out of the password session: no guest to claim'
    end

    test 'R1 M1: a displaced session\'s late /logout leaves the new guest record alone' do
      build(player_state: { 'sessions' => { 'hot_desk' => { 'id' => 'temp_user', 'via' => 'password' } } })
      borrow_done!
      # the done already removed the displaced session, so this /logout ends nothing
      assert_equal 200, logout.status, 'the displacement\'s /logout lands after the done'
      assert_equal({ 'hot_desk' => 'ian' }, state['guestSessions'])
      assert_equal 200, claim.status
    end

    test 'R1 m1: the server times a guest session out from the done and the PC\'s autoLockMin' do
      build
      t = Time.current
      borrow_done!(t)
      # managed (the default policy) has autoLockMin 5; the done landed at t + 60
      assert_equal 200, travel_to(t + 60 + 300 + 2) { claim }.status, 'inside the lock time and its 3 s allowance'
      build
      borrow_done!(t)
      assert_equal 422, travel_to(t + 60 + 300 + 4) { claim }.status, 'past the lock time'
      assert_nil state['sessions']['hot_desk']
      assert_empty state['guestSessions'], 'the refusal ends the timed-out record (R2 n3)'
      assert_empty state['guestSessionsAt']
      # a policy with no autoLockMin never locks a guest, on the client or here
      data = scenario
      data['policies']['open'] = { 'usb' => 'allowed' }
      data['rooms']['office']['objects'].find { |o| o['id'] == 'hot_desk' }['policy'] = 'open'
      build(data: data)
      borrow_done!(t)
      assert_equal 200, travel_to(t + 3600) { claim }.status
    end

    # Dana (careful in the fixture) given a habit that leaves the screen open, and her share down,
    # so she and Ian both borrow the hot desk, as Ian and Rosa do in test_access_work
    def queue_scenario
      data = scenario
      data['globalVariables']['finance_share_down'] = true
      npc_in(data, 'dana')['screenHabit'] = LEAVES_OPEN
      data
    end

    test 'R2 M1: two borrowers queued at the hot desk: the last done wins, and a resend of the earlier one is not recorded' do
      build(data: queue_scenario, player_state: { 'globalVariables' => { 'ian_pc_unplugged' => true, 'finance_share_down' => true } })
      t = Time.current
      dana = fails('dana', 2, t).last['run']
      assert_equal 'borrow_session', dana['do']
      ian = fails('ian', 2, t + 30).last['run']
      assert_equal 'borrow_session', ian['do']
      # Dana was handed the PC first, but Ian is nearer: he sits and leaves first, she waits
      first = done('ian', ian, t + 70)
      assert_equal({ 'pcId' => 'hot_desk', 'guest' => true }, first.parsed_body)
      second = done('dana', dana, t + 90)
      assert_equal({ 'pcId' => 'hot_desk', 'guest' => true }, second.parsed_body, 'the client records Dana from this answer')
      assert_equal({ 'hot_desk' => 'dana' }, state['guestSessions'], 'the server keeps the same guest as the client')
      # Ian's answer was lost and his done is resent: answered from lastSpent, nothing written, and
      # guest false so the client does not record him over Dana
      assert_equal({ 'pcId' => 'hot_desk', 'guest' => false }, done('ian', ian, t + 95).parsed_body)
      assert_equal({ 'hot_desk' => 'dana' }, state['guestSessions'])
      res = travel_to(t + 100) { claim }
      assert_equal 200, res.status
      assert_equal 'dana', res.parsed_body['npcId']
    end

    test 'R2 M1: a done resent after the guest session ended answers guest false' do
      build
      run = borrow_done!
      assert_equal 200, claim.status
      assert_equal 200, logout.status
      assert_equal({ 'pcId' => 'hot_desk', 'guest' => false }, done('ian', run, Time.current + 61).parsed_body)
      assert_empty state['guestSessions']
    end

    test 'R2 m2: a borrow that names the PC by its name is stored, answered and claimed by its id' do
      data = scenario(ian_workarounds: [{ 'at' => 40, 'do' => 'borrow_session', 'pc' => 'Hot desk PC' }])
      data['rooms']['office']['objects'].find { |o| o['id'] == 'hot_desk' }['name'] = 'Hot desk PC'
      build(data: data)
      t = Time.current
      run = fails('ian', 2, t).last['run']
      assert_equal 'borrow_session', run['do']
      res = done('ian', run, t + 60)
      assert_equal 200, res.status
      assert_equal({ 'pcId' => 'hot_desk', 'guest' => true }, res.parsed_body, 'the answer names the PC by id (R2 n2)')
      assert_equal({ 'hot_desk' => 'ian' }, state['guestSessions'])
      assert_includes @game.reload.handed_borrow_pcs(npc_in(data, 'ian')), 'hot_desk'
      claimed = travel_to(t + 61) { claim('hot_desk') }
      assert_equal 200, claimed.status
      assert_equal 'ian', claimed.parsed_body['npcId']
    end

    test 'R1 m3: the capture\'s note holds the password only where revealSecret is on' do
      data = scenario
      data['social']['captures'] = { 'revealSecret' => false }
      build(data: data)
      t = Time.current
      run = fails('sam', 2, t).last['run']
      body = done('sam', run, t + 40, heard: true, room_id: 'office').parsed_body
      refute_includes body['capture']['note'], SAM_PASSWORD
      assert_includes body['capture']['note'], 'sokafor'
      assert_includes body['note'], SAM_PASSWORD, 'the player\'s own note keeps it'
      assert_includes body['line'], SAM_PASSWORD
      build
      run = fails('sam', 2, t).last['run']
      body = done('sam', run, t + 40, heard: true, room_id: 'office').parsed_body
      assert_includes body['capture']['note'], SAM_PASSWORD, 'revealSecret on'
    end

    test 'R1 m4: a share is not heard unless the player has met the colleague' do
      build(player_state: { 'encounteredNPCs' => %w[dana kai ian amy omar temp_user sam vic visitor] })
      t = Time.current
      run = fails('sam', 2, t).last['run']
      assert_equal({}, done('sam', run, t + 40, heard: true, room_id: 'office').parsed_body)
      assert_empty state['sharedLogins']
    end

    test 'R1 m2: /capture_secrets lists a heard share under accounts in a scenario with networks' do
      data = scenario
      data['networks'] = { 'corp' => { 'name' => 'Corp LAN' } }
      build(data: data)
      assert @game.network_scenario?
      t = Time.current
      run = fails('sam', 2, t).last['run']
      body = done('sam', run, t + 40, heard: true, room_id: 'office').parsed_body
      @game.reload
      @game.player_state['globalVariables']['se_captures'] = { 'sam' => body['capture'].slice('kind', 'address', 'note') }
      @game.save!
      get capture_secrets_game_url(@game), as: :json
      assert_equal({ 'sam' => 'sokafor' }, response.parsed_body['accounts'])
      assert_equal({ 'sam' => SAM_PASSWORD }, response.parsed_body['secrets'])
    end

    test 'R1 m5: a guest claim through a foothold or at a headless host is refused' do
      build
      borrow_done!
      post login_game_url(@game), params: { pc_id: 'hot_desk', claim: 'guest', foothold: 'jack_1' }, as: :json
      assert_equal 422, response.status, 'a foothold'
      assert_nil state['sessions']['hot_desk']
      data = scenario
      data['rooms']['office']['objects'].find { |o| o['id'] == 'hot_desk' }['headless'] = true
      build(data: data, player_state: { 'guestSessions' => { 'hot_desk' => 'ian' } })
      assert_equal 422, claim.status, 'a headless host'
      assert_nil state['sessions']['hot_desk']
    end

    test 'R1 m5: a dropped borrow writes no guest record and leaves a held session alone' do
      build(player_state: { 'sessions' => { 'hot_desk' => { 'id' => 'temp_user', 'via' => 'password' } } })
      t = Time.current
      run = fails('ian', 2, t).last['run']
      res = done('ian', run, t + 30, dropped: true)
      assert_equal({ 'dropped' => true }, res.parsed_body)
      assert_empty state['guestSessions']
      assert_equal 'temp_user', state['sessions']['hot_desk']['id']
    end

    test 'R1 m5: a borrowed PC is a place only for the need it satisfies' do
      build
      borrow_done!
      ian = npc_in(@game.reload.scenario_data, 'ian')
      assert_equal ['hot_desk'], @game.handed_borrow_pcs(ian, 'work')
      assert_empty @game.handed_borrow_pcs(ian, 'social_media'), 'the hot desk satisfies work only'
    end

    test 'R1 m5: no exposure on any route after a heard share, with se_captures synced' do
      data = scenario
      data['social']['captures'] = { 'revealSecret' => false }
      build(data: data)
      t = Time.current
      run = fails('sam', 2, t).last['run']
      refute_includes fails('sam', 1, t + 25).to_json, SAM_PASSWORD, 'the /npc_frustration answers'
      body = done('sam', run, t + 40, heard: true, room_id: 'office').parsed_body
      put sync_state_game_url(@game), params: { globalVariables: { 'se_captures' => { 'sam' => body['capture'].slice('kind', 'address', 'note') } } }, as: :json
      refute_includes travel_to(t + 60) { report(fail_r('sam')) }.to_json, SAM_PASSWORD, 'a later /npc_frustration answer'
      get scenario_game_url(@game), as: :json
      assert_response :success
      refute_includes response.body, SAM_PASSWORD, 'GET /scenario, its pending and the synced se_captures'
      get room_game_url(@game, room_id: 'office'), as: :json
      refute_includes response.body, SAM_PASSWORD
      get login_accounts_game_url(@game, pc_id: 'sam_pc'), as: :json
      refute_includes response.body, SAM_PASSWORD
      get capture_secrets_game_url(@game), as: :json
      refute_includes response.body, SAM_PASSWORD, 'revealSecret off'
    end
  end
end
