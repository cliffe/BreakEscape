require 'test_helper'
require_relative '../../support/network_ops_scenario'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops showcase unit S-T (SHOWCASE_PLAN.md 8.3, "second step"): the real
  # scenarios/demo_ops_second_step/scenario.json.erb driven through the routes, one test per beat that has a
  # server side (M1 to M10), each assertion read from a re-read game or a fresh answer. Time is frozen, so a code
  # is read from the held device's route (as the browser does) and the waits are travel_to. The notes (M1, M2) and
  # the overheard login (M3) are served by login_accounts, npc_frustration and npc_workaround, driven here as the
  # needs runner drives them. What only the browser decides (who is at the desk, who is in earshot, the toasts) is
  # PLAYTEST.md's. The last case passes every answer of a played run, those three routes included, through the
  # leak scanner (given the game, so it can judge an earned note or share) and asserts it reports nothing.
  class DemoOpsSecondStepScenarioTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests

    SCENARIO_PATH = File.expand_path('../../../scenarios/demo_ops_second_step/scenario.json.erb', __dir__)
    T0 = Time.zone.at(1_800_000_000)
    LOG = 'mfa_log'.freeze
    LORNA = ['leaston', 'Easton-Fenlow-26'].freeze
    DARREN = ['dprice', 'Pricewell-Dar-58'].freeze
    ANJALI = ['arao', 'Raobank-Anj-73'].freeze
    YUSUF = ['ydemir', 'Demirgate-Yus-39'].freeze
    NIAMH = ['ndoherty', 'Dohertree-Nia-14'].freeze
    PCS = { 'lorna_pc' => LORNA, 'darren_pc' => DARREN, 'anjali_pc' => ANJALI, 'yusuf_pc' => YUSUF }.freeze
    ROOMS = %w[reception office kitchen it_room].freeze
    PEOPLE = %w[ama_owusu lorna_easton niamh_doherty darren_price anjali_rao yusuf_demir thandiwe_moyo].freeze

    def scenario
      JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
    end

    setup do
      travel_to T0
      @log = []
      @marks = {}
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user), scenario: scenario,
        player_state: { 'currentRoom' => 'reception', 'unlockedRooms' => ROOMS.dup, 'encounteredNPCs' => PEOPLE.dup }
      )
    end

    teardown do
      travel_back
      OpsLog::Current.reset
    end

    def state
      Game.find(@game.id).player_state
    end

    def rows(event = nil)
      list = Game.find(@game.id).log_rows_for(LOG)
      event ? list.select { |r| r['event'] == event } : list
    end

    def count(event)
      rows(event).sum { |r| r['n'] || 1 }
    end

    def later(seconds)
      travel_to Time.zone.at(Time.current.to_i + seconds)
    end

    def take(id, type, name, npc: nil)
      params = { action_type: 'add', item: { type: type, id: id, name: name } }
      params[:source_npc_id] = npc if npc
      post game_path('inventory'), params: params, as: :json
      response
    end

    def device_code(id = 'anjali_fob')
      get game_path('mfa/device'), params: { item_id: id }, as: :json
      assert_response :success, response.body
      response.parsed_body['code']
    end

    def verify(pc, code)
      post game_path('mfa/verify'), params: { pc_id: pc, code: code }, as: :json
      response.parsed_body
    end

    def prompt(pc)
      post game_path('mfa/prompt'), params: { pc_id: pc }, as: :json
      response.parsed_body
    end

    def approve(pc, params = {})
      post game_path('mfa/approve'), params: { pc_id: pc }.merge(params), as: :json
      response.parsed_body
    end

    def claim(pc)
      post game_path('login'), params: { pc_id: pc, claim: 'owner', screen_locked: false, owner_away: true }, as: :json
      response.parsed_body
    end

    def wrong_for(right)
      right == '000000' ? '000001' : '000000'
    end

    def read_log(id = 'mfa_log_pc')
      get game_path('log_rows'), params: { object_id: id }, as: :json
      response.parsed_body
    end

    # The sign-in screen at a PC's own keyboard: the tiles, and the note only where its owner wrote one
    def accounts(pc)
      get game_path('login_accounts'), params: { pc_id: pc }, as: :json
      assert_response :success, response.body
      response.parsed_body
    end

    # Ama's "Switch the printer off" (or the socket), as the browser syncs it
    def printer_off!
      put game_path('sync_state'), params: { globalVariables: { 'printer_off' => true } }, as: :json
      assert_response :success, response.body
    end

    # A failed print, as the needs runner reports it (the office printer resource is down)
    def print_fail(npc)
      pc = { 'darren_price' => 'darren_pc', 'yusuf_demir' => 'yusuf_pc' }.fetch(npc)
      { npc_id: npc, event: 'fail', need: 'work', object_id: pc, missing: [{ id: 'print_service', why: 'down' }] }
    end

    def frustration(npc)
      post game_path('npc_frustration'), params: { reports: [print_fail(npc)] }, as: :json
      assert_response :success, response.body
      response.parsed_body['answers'].first
    end

    # Two failed prints 25 s apart (past the pace floor); the second answer hands the workaround over
    def frustrate(npc)
      first = frustration(npc)
      later(25)
      [first, frustration(npc)]
    end

    def workaround_done(npc, run, extra = {})
      post game_path('npc_workaround'), params: { npc_id: npc, index: run['index'], hand: run['hand'] }.merge(extra), as: :json
      response
    end

    # ---- the scenario's shape ----------------------------------------------------------------------

    test 'the real scenario holds the policies, the accounts, the access lists and the devices the beats need' do
      data = scenario
      assert_equal({ 'front' => 'push', 'floor' => 'push', 'finance' => 'code', 'ops' => 'push_number_match', 'kiosk' => 'push' },
                   data['policies'].transform_values { |p| p['mfa'] })
      npcs = data['rooms'].values.flat_map { |r| Array(r['npcs']) }
      assert_equal %w[ama_owusu anjali_rao darren_price lorna_easton niamh_doherty thandiwe_moyo yusuf_demir], npcs.map { |n| n['id'] }.sort
      assert_equal %w[niamh_doherty], npcs.select { |n| n.dig('creds', 'mfa') == false }.map { |n| n['id'] }
      habit = ->(id) { npcs.find { |n| n['id'] == id }.dig('habits', 'approvesPrompts') }
      assert_equal %w[never pestered never], %w[lorna_easton darren_price yusuf_demir].map(&habit)
      objects = data['rooms'].values.flat_map { |r| Array(r['objects']) }
      owners = objects.select { |o| o['policy'] }.to_h { |o| [o['id'], [o['owner'], o.dig('access', 'people')]] }
      assert_equal({ 'lorna_pc' => ['lorna_easton', %w[lorna_easton]], 'darren_pc' => ['darren_price', %w[darren_price]],
                     'anjali_pc' => ['anjali_rao', %w[anjali_rao]], 'yusuf_pc' => ['yusuf_demir', %w[yusuf_demir]],
                     'visitor_kiosk' => [nil, %w[niamh_doherty]] }, owners)
      assert_equal 'mfa_log', objects.find { |o| o['id'] == 'mfa_log_pc' }.dig('minigameData', 'logSource')
      assert_equal %w[code_device phone_friendface], %w[anjali_fob yusuf_phone].map { |id| objects.find { |o| o['id'] == id }['type'] }
    end

    test 'Ama holds the sign-in card for Lorna and the credential it proves; nothing else carries a password in a clue' do
      data = scenario
      ama = data['rooms'].values.flat_map { |r| Array(r['npcs']) }.find { |n| n['id'] == 'ama_owusu' }
      card = ama['itemsHeld'].find { |i| i['id'] == 'lorna_login_card' }
      assert_equal 'lorna_login', card['credential']
      assert_equal({ 'kind' => 'password', 'account' => 'lorna_easton', 'label' => "Lorna's sign-in", 'proof' => { 'held' => 'lorna_login_card' },
                     'foundIn' => 'lorna_login_card' }, data['credentials']['lorna_login'])
      assert_includes card['text'], LORNA.last
      assert_equal 0, JSON.parse(File.read(SCENARIO_PATH.sub('scenario.json.erb', 'ink/ama_owusu.json'))).to_json.scan(LORNA.last).size
    end

    # ---- the access lists: each MFA PC admits only its owner ----------------------------------------------

    test 'each second-step PC refuses an account its access list does not name, with no step asked and no row of a challenge' do
      PCS.each do |pc, own|
        PCS.values.reject { |c| c == own }.push(NIAMH).each do |other|
          body = sign_in(pc, *other)
          assert_not body['success'], "#{pc} must refuse #{other.first}"
          assert_nil body['mfaRequired'], "#{pc} asked a step of #{other.first}"
          assert_nil state['sessions'][pc], "#{pc} holds a session for #{other.first}"
        end
      end
      assert_equal 0, count('mfa_challenge')
    end

    test 'the visitor kiosk admits only the reception temp, and her own password alone opens it' do
      assert_not sign_in('visitor_kiosk', *DARREN)['success']
      assert_nil state['sessions']['visitor_kiosk']
      body = sign_in('visitor_kiosk', *NIAMH)
      assert body['success'], body.to_s
      assert_nil body['mfaRequired']
      assert_equal 'niamh_doherty', state['sessions']['visitor_kiosk']['id']
      assert_equal 0, count('mfa_challenge') + count('mfa_prompt_sent')
      assert_equal 1, count('signin_ok')
    end

    # ---- M4: the step holds ------------------------------------------------------------------------------

    test 'M4: with Lorna\'s sign-in from Ama, the push goes unanswered: no approval, no deny row, and a step left five minutes is refused' do
      take('lorna_login_card', 'text_file', "Lorna's sign-in card", npc: 'ama_owusu')
      assert_response :success, response.body
      body = sign_in('lorna_pc', *LORNA)
      assert_equal true, body['mfaRequired']
      assert_equal 'push', body['mfa']
      assert_equal 'lorna_easton', body['npcId']
      assert_nil state['sessions']['lorna_pc']
      [1, 2].each do |n|
        body = prompt('lorna_pc')
        assert_equal false, body['approved']
        assert_equal n, body['promptsSent'], 'the step_holds tick reads this count'
        later(3)
      end
      assert_nil state['sessions']['lorna_pc']
      assert_equal 2, count('mfa_prompt_sent')
      assert_equal 1, rows('mfa_prompt_sent').size, 'two requests merge into one row with a count'
      assert_equal 2, rows('mfa_prompt_sent').first['n']
      assert_equal 0, count('mfa_prompt_approved') + count('mfa_prompt_denied'), 'a never-approving owner writes no deny row'
      later(MfaModel::PENDING_SECONDS + 1)
      body = prompt('lorna_pc')
      assert_response :unprocessable_entity
      assert_not body['success']
      assert_nil state['sessions']['lorna_pc']
      assert_equal 0, count('mfa_prompt_approved')
    end

    test 'M4: Lorna has no phone to take; the step never lets the password through and ends at the cap' do
      sign_in('lorna_pc', *LORNA)
      get game_path('mfa/phone'), params: { npc_id: 'lorna_easton' }, as: :json
      assert_not_equal 200, response.status
      assert_nil state['sessions']['lorna_pc']
      MfaModel::MAX_PROMPTS.times do
        assert_equal false, prompt('lorna_pc')['approved']
        later(3)
      end
      assert_equal true, prompt('lorna_pc')['expired']
      assert_nil state['sessions']['lorna_pc']
      assert_equal 1, count('mfa_expired')
    end

    # ---- M5: pestered into approving ----------------------------------------------------------------------

    test 'M5: Darren approves the third request; the count survives a fresh sign-in and returns to 0' do
      assert_equal 'push', sign_in('darren_pc', *DARREN)['mfa']
      assert_equal false, prompt('darren_pc')['approved']
      later(3)
      assert_equal false, prompt('darren_pc')['approved']
      assert_equal 2, state['mfaPrompts']['darren_price']
      assert_equal 'push', sign_in('darren_pc', *DARREN)['mfa']
      assert_equal 2, state['mfaPrompts']['darren_price']
      later(3)
      body = prompt('darren_pc')
      assert_response :success, response.body
      assert body['success']
      assert_equal 'owner', body['approvedBy']
      assert_equal 0, state['mfaPrompts']['darren_price']
      assert_equal 'darren_price', state['sessions']['darren_pc']['id']
      assert_equal 3, count('mfa_prompt_sent')
      assert_equal 1, count('mfa_prompt_approved')
      assert_equal 'owner', rows('mfa_prompt_approved').last['detail']['approver']
      assert_equal 1, count('signin_ok')
    end

    # ---- M6: a fob left on a desk -------------------------------------------------------------------------

    test 'M6: a wrong code is counted and shows the tries left; the fob taken from the desk gives the code that signs in; one use' do
      body = sign_in('anjali_pc', *ANJALI)
      assert_equal true, body['mfaRequired']
      assert_equal 'code', body['mfa']
      get game_path('mfa/device'), params: { item_id: 'anjali_fob' }, as: :json
      assert_response :forbidden, 'no code for a fob the player does not hold'
      take('anjali_fob', 'code_device', "Anjali's code fob")
      assert_response :success, response.body
      right = device_code
      assert_match(/\A\d{6}\z/, right)
      body = verify('anjali_pc', wrong_for(right))
      assert_response :unprocessable_entity
      assert_equal true, body['mfaIncorrect']
      assert_operator body['attemptsLeft'], :>=, 1
      assert_equal 1, count('mfa_code_wrong')
      assert_nil state['sessions']['anjali_pc']
      body = verify('anjali_pc', right)
      assert_response :success, response.body
      assert body['success']
      assert_equal({ 'id' => 'anjali_rao', 'via' => 'password' }, state['sessions']['anjali_pc'])
      assert_nil state['mfaPending']['anjali_pc']
      assert_equal 1, count('mfa_code_ok')
      assert_equal 1, count('signin_ok')
      get game_path('mfa/device'), params: { item_id: 'anjali_fob' }, as: :json
      assert_equal true, response.parsed_body['used']
    end

    # ---- M7: a phone left by the coffee -----------------------------------------------------------------

    test 'M7: with Yusuf\'s phone, a wrong number cancels without a failed sign-in; the shown number signs in' do
      right = sign_in('yusuf_pc', *YUSUF)['number']
      assert_kind_of Integer, right
      get game_path('mfa/phone'), params: { npc_id: 'yusuf_demir' }, as: :json
      assert_not_equal 200, response.status, 'the phone shows nothing until it is held'
      take('yusuf_phone', 'phone_friendface', "Yusuf's phone")
      assert_response :success, response.body
      get game_path('mfa/phone'), params: { npc_id: 'yusuf_demir' }, as: :json
      assert_response :success
      choices = response.parsed_body['requests'].first['numbers']
      assert_equal 3, choices.size
      assert_includes choices, right
      before = state['loginFailures']
      body = approve('yusuf_pc', number: (choices - [right]).first)
      assert_response :unprocessable_entity
      assert_equal true, body['cancelled']
      assert_nil state['mfaPending']['yusuf_pc']
      assert_equal before, state['loginFailures'], 'a cancelled step is not a failed sign-in'
      assert_equal 1, count('mfa_prompt_denied')
      right = sign_in('yusuf_pc', *YUSUF)['number']
      body = approve('yusuf_pc', number: right)
      assert_response :success, response.body
      assert body['success']
      assert_equal 'player', body['approvedBy']
      assert_equal 'yusuf_demir', state['sessions']['yusuf_pc']['id']
      assert_equal 'held_phone', rows('mfa_prompt_approved').last['detail']['approver']
    end

    test 'M7: with nobody holding the phone, Yusuf never approves a number-matching sign-in himself' do
      sign_in('yusuf_pc', *YUSUF)
      5.times do
        assert_equal false, prompt('yusuf_pc')['approved']
        later(3)
      end
      assert_nil state['sessions']['yusuf_pc']
      assert_equal 0, count('mfa_prompt_approved')
    end

    # ---- M1, M2, M3: passwords escape (the routes whose answer is the password itself) -------------------

    test 'M1: Anjali\'s sign-in screen carries her note; Lorna\'s, Darren\'s and Yusuf\'s carry none' do
      assert_equal "arao / #{ANJALI.last}", accounts('anjali_pc')['postitNote']
      assert_equal 'no-store', response.headers['Cache-Control']
      %w[lorna_pc darren_pc yusuf_pc].each do |pc|
        body = accounts(pc)
        assert_nil body['postitNote'], "#{pc} shows a note"
        PCS.each_value { |c| assert_not_includes body.to_json, c.last, "#{pc} answer holds a password" }
      end
    end

    test 'M2: Darren writes his password down only after two failed prints and the workaround done; a third fail starts no second one' do
      assert_nil accounts('darren_pc')['postitNote']
      printer_off!
      first, second = frustrate('darren_price')
      assert_nil first['run'], 'one failed print is not enough'
      run = second['run']
      assert_equal({ 'index' => 0, 'hand' => 1, 'do' => 'writes_down', 'dwell' => 6 }, run)
      assert_not_includes [first, second].to_json, DARREN.last
      assert_nil accounts('darren_pc')['postitNote'], 'handed over is not done'
      later(7)
      res = workaround_done('darren_price', run)
      assert_response :success, res.body
      assert_equal({ 'pcId' => 'darren_pc', 'hasPostit' => true }, res.parsed_body)
      assert_equal "dprice / #{DARREN.last}", accounts('darren_pc')['postitNote']
      later(25)
      assert_nil frustration('darren_price')['run'], 'the note is written once'
    end

    test 'M3: Yusuf\'s login said aloud: an unheard share gives nothing; a heard one in the office gives his login' do
      printer_off!
      first, second = frustrate('yusuf_demir')
      assert_nil first['run']
      run = second['run']
      assert_equal({ 'index' => 0, 'hand' => 1, 'do' => 'share_login', 'dwell' => 6, 'with' => 'anjali_rao' }, run)
      later(7)
      res = workaround_done('yusuf_demir', run, heard: false)
      assert_response :success, res.body
      assert_equal({}, res.parsed_body)
      assert_not_includes res.body, YUSUF.last
      assert_nil state['sharedLogins']&.first
      later(25)
      again = frustration('yusuf_demir')['run']
      assert_equal 'share_login', again['do'], 'a share repeats on the next failed print'
      later(7)
      res = workaround_done('yusuf_demir', again, heard: true, room_id: 'office')
      assert_response :success, res.body
      body = res.parsed_body
      assert_equal 'yusuf_demir', body.dig('capture', 'targetId')
      assert_includes body['line'], YUSUF.last
      assert_equal ['yusuf_demir'], state['sharedLogins']
    end

    # ---- M8: the way round ----------------------------------------------------------------------------------

    test 'M8: an owner\'s open screen is claimed with no step and no sign-in row; Lorna, who always locks, is refused' do
      body = claim('darren_pc')
      assert_response :success, response.body
      assert body['success']
      assert_equal 'darren_price', state['sessions']['darren_pc']['id']
      assert_equal 'claim', state['sessions']['darren_pc']['via']
      assert_nil state['mfaPending']['darren_pc']
      assert_equal 0, count('mfa_challenge') + count('mfa_prompt_sent') + count('signin_ok'), 'a claim writes no sign-in row'
      body = claim('lorna_pc')
      assert_response :unprocessable_entity
      assert_not body['success']
      assert_nil state['sessions']['lorna_pc']
    end

    # ---- M9: an exempt account --------------------------------------------------------------------------------

    test 'M9: the kiosk card\'s login is the clue; the account has no step and the answer asks for none' do
      body = sign_in('visitor_kiosk', *NIAMH)
      assert body['success']
      assert_nil body['mfaRequired']
      assert_nil state['mfaPending']['visitor_kiosk']
      assert_equal 0, count('mfa_challenge')
    end

    # ---- M10: the log -------------------------------------------------------------------------------------------

    test 'M10: the approvals log shows the seed rows, the overnight burst, and the rows the beats wrote; none holds a code or number' do
      body = read_log
      assert_response :success, body.inspect
      assert_equal 'Sign-in and approvals', body['title']
      burst = body['rows'].select { |r| r['as'] == 'Darren Price' && r['at'].to_s.include?('01:') }
      assert_equal 12, burst.size
      sign_in('anjali_pc', *ANJALI)
      take('anjali_fob', 'code_device', "Anjali's code fob")
      code = device_code
      verify('anjali_pc', wrong_for(code))
      verify('anjali_pc', code)
      sign_in('lorna_pc', *LORNA)
      prompt('lorna_pc')
      later(3)
      prompt('lorna_pc')
      body = read_log
      mine = body['rows'].reject { |r| r['id'].to_s.start_with?('s') && r['id'].to_s.match?(/\As\d+\z/) }
      assert_operator mine.size, :>=, 5
      assert_equal 1, count('mfa_code_wrong')
      assert_equal 1, count('mfa_code_ok')
      assert_equal 2, count('mfa_prompt_sent')
      assert_equal 0, count('mfa_prompt_approved') + count('mfa_prompt_denied')
      assert_not_includes body.to_json, code
      assert_not_includes body.to_json, LORNA.last
      assert_equal 's5', scenario['rooms']['it_room']['objects'].find { |o| o['id'] == 'mfa_log_pc' }.dig('minigameData', 'anomaly', 'rowId')
      assert_includes body['rows'].map { |r| r['id'] }, 's5'
      before = rows.size
      read_log
      assert_equal before, rows.size, 'a read writes no row'
    end

    # ---- the leak scanner over a played run -------------------------------------------------------------------

    def rec(mark = nil, extra = {})
      row = { 't' => (Time.utc(2026, 1, 1) + @log.length).iso8601(3), 'method' => request.request_method,
              'path' => request.path, 'status' => response.status, 'body' => response.parsed_body }
      row['query'] = request.query_string unless request.query_string.to_s.empty?
      @log << row.merge(extra)
      @marks[mark] = @log.last if mark
      @log.last
    end

    def sign_in_row(pc, creds, mark)
      sign_in(pc, *creds)
      rec(mark, 'login' => { 'pcId' => pc })
    end

    def take_row(id, type, name, mark, npc: nil)
      take(id, type, name, npc: npc)
      assert_response :success, response.body
      rec(mark, 'inv' => { 'action' => 'add', 'itemId' => id, 'usedOn' => nil })
    end

    def get_row(path, params, mark)
      get params.empty? ? game_path(path) : "#{game_path(path)}?#{params.to_query}", as: :json
      rec(mark)
    end

    def post_row(path, params, mark)
      post game_path(path), params: params, as: :json
      rec(mark)
    end

    def run_game
      get_row('scenario', {}, :boot0)
      ROOMS.each { |room| get_row("room/#{room}", {}, nil) }
      # M1: Anjali's note at her keyboard; M2 and M3: the printer goes off, Darren writes his down, Yusuf says his aloud
      get_row('login_accounts', { pc_id: 'anjali_pc' }, :anjali_note)
      put game_path('sync_state'), params: { globalVariables: { 'printer_off' => true } }, as: :json
      rec(:printer_off)
      %w[darren_price yusuf_demir].each do |npc|
        post_row('npc_frustration', { reports: [print_fail(npc)] }, nil)
        later(25)
        post_row('npc_frustration', { reports: [print_fail(npc)] }, :"#{npc}_handed")
      end
      later(7)
      darren_run = @marks[:darren_price_handed]['body']['answers'].first['run']
      post_row('npc_workaround', { npc_id: 'darren_price', index: darren_run['index'], hand: darren_run['hand'] }, :darren_wrote)
      get_row('login_accounts', { pc_id: 'darren_pc' }, :darren_note)
      yusuf_run = @marks[:yusuf_demir_handed]['body']['answers'].first['run']
      post_row('npc_workaround', { npc_id: 'yusuf_demir', index: yusuf_run['index'], hand: yusuf_run['hand'], heard: true, room_id: 'office' },
               :yusuf_heard)
      take_row('lorna_login_card', 'text_file', "Lorna's sign-in card", :take_card, npc: 'ama_owusu')
      # M4: the push that nobody answers
      sign_in_row('lorna_pc', LORNA, :lorna_required)
      post_row('mfa/prompt', { pc_id: 'lorna_pc' }, :lorna_prompt1)
      later(3)
      post_row('mfa/prompt', { pc_id: 'lorna_pc' }, :lorna_prompt2)
      # M5: Darren approves the third request
      sign_in_row('darren_pc', DARREN, :darren_required)
      post_row('mfa/prompt', { pc_id: 'darren_pc' }, :darren_prompt1)
      later(3)
      post_row('mfa/prompt', { pc_id: 'darren_pc' }, :darren_prompt2)
      later(3)
      post_row('mfa/prompt', { pc_id: 'darren_pc' }, :darren_pass)
      # M6: the fob, a wrong code, the right one
      sign_in_row('anjali_pc', ANJALI, :anjali_required)
      take_row('anjali_fob', 'code_device', "Anjali's code fob", :take_fob)
      get_row('mfa/device', { item_id: 'anjali_fob' }, :device)
      right = @marks[:device]['body']['code']
      post_row('mfa/verify', { pc_id: 'anjali_pc', code: wrong_for(right) }, :wrong_code)
      post_row('mfa/verify', { pc_id: 'anjali_pc', code: right }, :pass_code)
      # M7: the phone, a wrong number, the shown number
      sign_in_row('yusuf_pc', YUSUF, :yusuf_required)
      take_row('yusuf_phone', 'phone_friendface', "Yusuf's phone", :take_phone)
      get_row('mfa/phone', { npc_id: 'yusuf_demir' }, :phone)
      choices = @marks[:phone]['body']['requests'].first['numbers']
      shown = @marks[:yusuf_required]['body']['number']
      post_row('mfa/approve', { pc_id: 'yusuf_pc', number: (choices - [shown]).first }, :cancel)
      sign_in_row('yusuf_pc', YUSUF, :yusuf_required2)
      post_row('mfa/approve', { pc_id: 'yusuf_pc', number: @marks[:yusuf_required2]['body']['number'] }, :yusuf_pass)
      # M9: the exempt account; M10: the reader
      sign_in_row('visitor_kiosk', NIAMH, :kiosk_signin)
      get_row('log_rows', { object_id: 'mfa_log_pc' }, :log)
      get_row('scenario', {}, :boot_end)
      @log
    end

    def scan(rows)
      AccessLeakScanner.new(scenario, game: Game.find(@game.id)).scan(rows.each_with_index.map { |r, i| ['run.jsonl', i + 1, r] })
    end

    test 'the leak scanner over the whole played run reports nothing, and the run holds every earned answer' do
      run_game
      assert_operator @log.length, :>, 25
      assert_equal [], scan(@log).map { |f| [f.line, f.rule, f.owner, f.route] }
      assert_match(/\A\d{6}\z/, @marks[:device]['body']['code'])
      assert_equal 3, @marks[:phone]['body']['requests'].first['numbers'].size
      assert_equal 'owner', @marks[:darren_pass]['body']['approvedBy']
      assert_equal 'player', @marks[:yusuf_pass]['body']['approvedBy']
      assert_equal "arao / #{ANJALI.last}", @marks[:anjali_note]['body']['postitNote']
      assert_equal "dprice / #{DARREN.last}", @marks[:darren_note]['body']['postitNote']
      assert_includes @marks[:yusuf_heard]['body']['line'], YUSUF.last
      assert_equal 422, @marks[:cancel]['status']
      assert_equal 'anjali_rao', @marks[:boot_end]['body']['sessions']['anjali_pc']['npcId']
      assert_not_includes @marks[:boot_end]['body'].to_json, 'mfaPending'
    end
  end
end
