require 'test_helper'
require_relative '../../support/network_ops_scenario'
require_relative '../../support/helpdesk_answer_shapes'
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
    include HelpdeskAnswerShapes

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
    DARREN_NEW = 'Pricesafe-Rst-81'.freeze
    DARREN_ANSWERS = { 'staff_no' => '40371', 'manager' => 'Marcus Hale' }.freeze
    YUSUF_ANSWERS = { 'staff_no' => '40459', 'manager' => 'Marcus Hale' }.freeze
    LORNA_ANSWERS = { 'staff_no' => '40118', 'manager' => 'Eleanor Marsh' }.freeze
    ANJALI_ANSWERS = { 'staff_no' => '40226', 'manager' => 'Eleanor Marsh' }.freeze
    WRONG = { 'staff_no' => '00000', 'manager' => 'Nobody' }.freeze
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
      assert_equal %w[ama_owusu anjali_rao darren_price fatima_begum gwen_pritchard it_line lorna_easton niamh_doherty priya_nair thandiwe_moyo yusuf_demir],
                   npcs.map { |n| n['id'] }.sort # S8c adds Gwen and Fatima; U3b adds Priya (call desk) and the IT line phone contact
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
      # the recorder's own rule: a POST to a PC route carries `pc` = { pcId } from the body's pc_id, else null
      row['pc'] = recorder_pc_tag if row['method'] == 'POST' && PC_ROUTE_RE.match?(row['path'])
      @log << row.merge(extra)
      @marks[mark] = @log.last if mark
      @log.last
    end

    PC_ROUTE_RE = %r{/(login|logout|lock_session|mfa/verify|mfa/prompt|mfa/approve)\z}

    def recorder_pc_tag
      id = request.request_parameters['pc_id']
      id.is_a?(String) && !id.empty? && !request.query_string.to_s.match?(/(\A|[?&;])(pc_id|target_type|target_id)(\[|=|&|;|\z)/) ? { 'pcId' => id } : nil
    end

    def sign_in_row(pc, creds, mark)
      sign_in(pc, *creds)
      rec(mark)
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

    # ---- S8b appended: the helpdesk (M11 to M13). Every case above is unchanged. -------------------------------

    def ask(username, what, answers, desk: 'it_desk', pc: nil)
      params = { desk_id: desk, username: username, what: what, answers: answers }
      params[:pc_id] = pc if pc
      post game_path('helpdesk/request'), params: params, as: :json
      response.parsed_body
    end

    def ask_row(username, what, answers, mark = nil, pc: nil)
      params = { desk_id: 'it_desk', username: username, what: what, answers: answers }
      params[:pc_id] = pc if pc
      post_row('helpdesk/request', params, mark)
    end

    def scenario_texts
      data = scenario
      data['rooms'].values.flat_map { |r| Array(r['objects']) }.select { |o| o['readable'] }.to_h { |o| [o['id'], o['text']] }
    end

    test 'S8b: the desk, the recovery answers and Darren\'s reset password are in the scenario; only the labels reach the browser' do
      data = scenario
      desk = data['helpdesks']['it_desk']
      assert_equal 'thandiwe_moyo', desk['npc']
      assert_equal %w[staff_no manager], desk['questions']
      assert_equal 2, desk['minCorrect']
      assert_equal %w[password mfa], desk['resets']
      npcs = data['rooms'].values.flat_map { |r| Array(r['npcs']) }.to_h { |n| [n['id'], n] }
      { 'lorna_easton' => LORNA_ANSWERS, 'darren_price' => DARREN_ANSWERS, 'anjali_rao' => ANJALI_ANSWERS,
        'yusuf_demir' => YUSUF_ANSWERS }.each { |id, answers| assert_equal answers, npcs[id].dig('creds', 'recovery'), id }
      assert_nil npcs['niamh_doherty']['creds']['recovery']
      assert_equal DARREN_NEW, npcs['darren_price'].dig('creds', 'resetPassword')
      %w[lorna_easton anjali_rao yusuf_demir].each { |id| assert_nil npcs[id]['creds']['resetPassword'], id }
      form = data['rooms']['office']['objects'].find { |o| o['id'] == 'darren_pc' }['contents'].first
      assert_equal({ 'type' => 'helpdesk_form', 'id' => 'darren_form', 'name' => 'IT request form', 'desk' => 'it_desk' }, form)
      get game_path('scenario'), as: :json
      body = response.parsed_body
      assert_equal %w[npc questionLabels resets], body['helpdeskForms']['it_desk'].keys.sort
      [*DARREN_ANSWERS.values, *LORNA_ANSWERS.values, *YUSUF_ANSWERS.values, *ANJALI_ANSWERS.values, DARREN_NEW].each do |secret|
        assert_not_includes body.to_json, secret
      end
      # the clue texts: Darren's number on his badge, his manager and Yusuf's answers on the board; Lorna's and Anjali's nowhere
      texts = scenario_texts
      assert_includes texts['darren_badge'], DARREN_ANSWERS['staff_no']
      assert_includes texts['staff_board'], DARREN_ANSWERS['manager']
      assert_includes texts['staff_board'], YUSUF_ANSWERS['staff_no']
      read = texts.values.join("\n")
      (LORNA_ANSWERS.values + ANJALI_ANSWERS.values + [DARREN_NEW]).each { |secret| assert_not_includes read, secret }
      ink = Dir[File.join(File.dirname(SCENARIO_PATH), 'ink', '*.json')].map { |f| File.read(f) }.join
      (DARREN_ANSWERS.values + YUSUF_ANSWERS.values + LORNA_ANSWERS.values + ANJALI_ANSWERS.values + [DARREN_NEW]).each do |secret|
        assert_not_includes ink, secret
      end
    end

    test 'S8b M11: the reset hands Darren a new password, the old note is stale, the new one reaches his second step' do
      note = accounts('darren_pc')
      assert_nil note['postitNote'], 'no note until the temper beat'
      ask('dprice', 'password', DARREN_ANSWERS.merge('manager' => 'marcus  HALE'))
      assert_answer_shape('helpdesk.granted_password', response)
      assert_equal DARREN_NEW, response.parsed_body['password']
      assert_equal 'darren_price', response.parsed_body['npcId']
      get game_path('keyring'), as: :json
      assert_equal DARREN_NEW, response.parsed_body['entries'].find { |e| e['id'] == 'darren_price.reset' }&.fetch('password')
      refused = sign_in('darren_pc', *DARREN)
      assert_not refused['success'], 'the old password is stale after the reset'
      assert_nil state['sessions']['darren_pc']
      body = sign_in('darren_pc', 'dprice', DARREN_NEW)
      assert_equal true, body['mfaRequired'], 'a new password still meets the second step'
      assert_equal 1, count('account_password_reset')
      assert_equal 1, rows('helpdesk_request').count { |r| r['result'] == 'granted' }
      assert_equal 1, rows('account_password_reset').size
    end

    test 'S8b M11: one right answer of two is not enough, and the refusal names no one' do
      ask('dprice', 'password', { 'staff_no' => DARREN_ANSWERS['staff_no'], 'manager' => 'Nobody' })
      assert_answer_shape('helpdesk.refused', response)
      assert_equal 2, response.parsed_body['triesLeft']
      ask('no.such.person', 'password', WRONG)
      assert_answer_shape('helpdesk.refused', response)
      assert_equal 2, response.parsed_body['triesLeft'], 'a name nobody has gets the same count'
      assert_equal 0, count('account_password_reset')
      assert_nil state['accountResets']
    end

    test 'S8b M12: the reset moves Yusuf\'s step to the player\'s phone; his old phone no longer approves' do
      body = sign_in('yusuf_pc', *YUSUF)
      assert_equal true, body['mfaRequired']
      assert_nil body['ownPhone']
      ask('ydemir', 'mfa', YUSUF_ANSWERS)
      assert_answer_shape('helpdesk.granted_mfa', response)
      assert_equal 'yusuf_demir', response.parsed_body['npcId']
      assert_equal true, state['accountResets']['yusuf_demir']['mfa']
      assert_nil state['accountResets']['yusuf_demir']['password'], 'a step reset gives no password'
      body = sign_in('yusuf_pc', *YUSUF)
      assert_equal true, body['mfaRequired']
      assert_equal true, body['ownPhone']
      post game_path('mfa/prompt'), params: { pc_id: 'yusuf_pc' }, as: :json
      assert_answer_shape('prompt.waiting_own', response)
      # the left-behind phone lists nothing now, and a plain approve is refused
      take('yusuf_phone', 'phone_friendface', "Yusuf's phone")
      get game_path('mfa/phone'), params: { npc_id: 'yusuf_demir' }, as: :json
      assert_empty Array(response.parsed_body['requests'])
      post game_path('mfa/approve'), params: { pc_id: 'yusuf_pc' }, as: :json
      assert_response :forbidden
      assert_nil state['sessions']['yusuf_pc']
      body = sign_in('yusuf_pc', *YUSUF)
      shown = body['number']
      post game_path('mfa/prompt'), params: { pc_id: 'yusuf_pc' }, as: :json
      get game_path('mfa/phone'), params: { own: 1 }, as: :json
      assert_response :success, response.body
      request_row = response.parsed_body['requests'].first
      assert_equal 'yusuf_pc', request_row['pcId']
      assert_equal 3, request_row['numbers'].size, 'the own phone shows the number-match choices'
      assert_includes request_row['numbers'], shown
      post "#{game_path('mfa/approve')}?own=1", params: { pc_id: 'yusuf_pc', number: shown }, as: :json
      assert_equal 'own_phone', response.parsed_body['approvedBy']
      assert_equal 'yusuf_demir', state['sessions']['yusuf_pc']['id']
      assert_equal 1, count('account_mfa_reenrolled')
    end

    test 'S8b M12: Anjali is not re-enrolled by any beat, so her fob stays live' do
      sign_in('anjali_pc', *ANJALI)
      take('anjali_fob', 'code_device', "Anjali's code fob")
      get game_path('mfa/device'), params: { item_id: 'anjali_fob' }, as: :json
      assert_match(/\A\d{6}\z/, response.parsed_body['code'])
      ask('ydemir', 'mfa', YUSUF_ANSWERS)
      ask('dprice', 'password', DARREN_ANSWERS)
      get game_path('mfa/device'), params: { item_id: 'anjali_fob' }, as: :json
      assert_match(/\A\d{6}\z/, response.parsed_body['code'], 'the other resets leave her fob live')
      assert_nil state['accountResets']['anjali_rao']
    end

    test 'S8b M13: three wrong answers for Lorna stop the desk for her name, a right answer then is blocked, five minutes lift it' do
      ask('leaston', 'password', WRONG)
      assert_answer_shape('helpdesk.refused', response)
      assert_equal 2, response.parsed_body['triesLeft']
      ask('leaston', 'password', WRONG)
      assert_equal 1, response.parsed_body['triesLeft']
      ask('leaston', 'password', WRONG)
      assert_answer_shape('helpdesk.refused_last', response)
      ask('leaston', 'password', LORNA_ANSWERS)
      assert_answer_shape('helpdesk.blocked', response)
      assert_equal %w[refused refused refused blocked], rows('helpdesk_request').flat_map { |r| [r['result']] * (r['n'] || 1) }
      assert state['helpdeskTries']['it_desk|leaston']['stoppedAt']
      assert_equal 0, count('account_password_reset')
      # the stop is per name: Lorna has no reset password, so a right answer for her would grant nothing, and Darren's name is still heard
      ask('dprice', 'password', DARREN_ANSWERS)
      assert_answer_shape('helpdesk.granted_password', response)
      later(HelpdeskModel::DESK_STOP_SECONDS)
      ask('leaston', 'password', WRONG)
      assert_answer_shape('helpdesk.refused', response)
      assert_equal 2, response.parsed_body['triesLeft'], 'the lifted stop starts the count again'
    end

    test 'S8b: the form on Darren\'s desktop is served only while his session is open, and the grant is for the typed name' do
      ask('dprice', 'password', DARREN_ANSWERS, pc: 'darren_pc')
      assert_response :unprocessable_entity, 'no session at Darren\'s PC'
      assert_equal 'unavailable', response.parsed_body['reason']
      assert_equal 0, count('account_password_reset')
      claim('darren_pc')
      get game_path('container/darren_pc'), as: :json
      assert_response :success, response.body
      form = response.parsed_body['contents'].find { |i| i['id'] == 'darren_form' }
      assert_equal %w[desk id name type], form.keys.sort
    end

    # ---- the leak scanner over a played helpdesk run -------------------------------------------------------------

    def run_helpdesk_game
      get_row('scenario', {}, :boot0)
      ROOMS.each { |room| get_row("room/#{room}", {}, nil) }
      take_row('darren_badge', 'id_badge', "Darren's ID badge", :take_badge)
      get_row('keyring', {}, :keyring0)
      # M11: Darren's reset, then the stale and the new password
      ask_row('dprice', 'password', DARREN_ANSWERS, :grant_password)
      get_row('keyring', {}, :keyring1)
      sign_in_row('darren_pc', DARREN, :old_password)
      sign_in_row('darren_pc', ['dprice', DARREN_NEW], :new_password)
      # M12: Yusuf's step moves to the player's phone
      sign_in_row('yusuf_pc', YUSUF, :yusuf_required)
      ask_row('ydemir', 'mfa', YUSUF_ANSWERS, :grant_mfa)
      sign_in_row('yusuf_pc', YUSUF, :yusuf_own)
      post_row('mfa/prompt', { pc_id: 'yusuf_pc' }, :yusuf_prompt)
      get_row('mfa/phone', { own: 1 }, :own_phone)
      post "#{game_path('mfa/approve')}?own=1", params: { pc_id: 'yusuf_pc', number: @marks[:yusuf_own]['body']['number'] }, as: :json
      rec(:own_approve)
      # M13, last on purpose: the stop on Lorna's name
      ask_row('leaston', 'password', WRONG, :refused)
      ask_row('leaston', 'password', WRONG)
      ask_row('leaston', 'password', WRONG, :refused_last)
      ask_row('leaston', 'password', WRONG, :blocked)
      get_row('scenario', {}, :boot_end)
      @log
    end

    test 'S8b: the leak scanner over a played helpdesk run reports nothing, and every grant matches its shared shape' do
      run_helpdesk_game
      assert_operator @log.length, :>, 20
      findings = scan(@log).map { |f| [f.line, f.rule, f.owner, f.route] }
      assert_equal [], findings
      assert_equal DARREN_NEW, @marks[:grant_password]['body']['password']
      assert_equal 'darren_price.reset', @marks[:keyring1]['body']['entries'].find { |e| e['id'] == 'darren_price.reset' }&.fetch('id')
      assert_nil @marks[:keyring0]['body']['entries'].find { |e| e['id'] == 'darren_price.reset' }
      assert_equal 'own_phone', @marks[:own_approve]['body']['approvedBy']
      assert_equal 422, @marks[:blocked]['status']
      assert_equal 'blocked', @marks[:blocked]['body']['reason']
      assert_not_includes @marks[:refused]['body'].to_json, 'leaston'
      assert_not_includes @marks[:boot_end]['body'].to_json, DARREN_NEW
    end

    # ---- U3b appended: the helpdesk's third way in, a phone call with a call-back desk (M13b). ------------------------
    # The call route itself is the browser's (person-chat-pretext opens the desk's form on a granted ask); here we drive
    # the server helpdesk route the ask opens, as the M11 to M13 cases do, and prove the call-back rule: the grant turns
    # on holding the account owner's Friendface phone, not on anything the call or the client says.

    def meet_priya
      game = Game.find(@game.id)
      game.player_state['encounteredNPCs'] = (PEOPLE + %w[priya_nair]).uniq
      game.save!
    end

    def call_desk_row(username, what, mark = nil)
      post_row('helpdesk/request', { desk_id: 'call_desk', username: username, what: what, answers: {} }, mark)
    end

    test 'U3b: the call desk, the IT line contact and the work phone are wired for the phone-call route' do
      data = scenario
      desk = data['helpdesks']['call_desk']
      assert_equal 'priya_nair', desk['npc']
      assert_equal 'callback', desk['verify']
      assert_equal %w[mfa], desk['resets']
      char = data['social']['characters']['it_line']
      assert_equal 'it_line', char['channels']['phone']
      pretext = data['social']['pretextNpcs'].find { |p| p['character'] == 'it_line' }
      assert_equal 'it_line_call', pretext['callId']
      assert_equal 'call_desk', pretext.dig('asks', 'reset_request', 'helpdesk')
      phone = data['startItemsInInventory'].find { |i| i['id'] == 'work_phone' }
      assert_equal 'phone', phone['type']
      assert_equal %w[it_line], phone['npcIds']
      contact = data['rooms']['it_room']['npcs'].find { |n| n['id'] == 'it_line' }
      assert_equal 'phone', contact['npcType']
      assert_equal 'it_line_call', contact['callId']
      assert data['rooms']['it_room']['npcs'].any? { |n| n['id'] == 'priya_nair' }
      tasks = data['objectives'].find { |a| a['aimId'] == 'afternoon_helpdesk' }['tasks'].map { |t| t['taskId'] }
      assert_includes tasks, 'desk_call'
      assert_equal false, data['globalVariables']['desk_call_done']
      assert_equal '', data['globalVariables']['helpdesk_call_desk_result']
    end

    test 'U3b M13b: the call-back desk grants an mfa reset only while the account owner phone is held' do
      meet_priya
      ask('ydemir', 'mfa', {}, desk: 'call_desk')
      assert_answer_shape('helpdesk.refused', response)
      assert_nil state['accountResets'], 'no phone held, so the call-back grants nothing'
      take('yusuf_phone', 'phone_friendface', "Yusuf's phone")
      ask('ydemir', 'mfa', {}, desk: 'call_desk')
      assert_answer_shape('helpdesk.granted_mfa', response)
      assert_equal 'yusuf_demir', response.parsed_body['npcId']
      assert_equal 'call_desk', response.parsed_body['deskId']
      assert_equal true, state['accountResets']['yusuf_demir']['mfa']
      assert_equal 1, count('account_mfa_reenrolled')
    end

    test 'U3b M13b: holding one owner phone does not open the call-back for another account' do
      meet_priya
      take('yusuf_phone', 'phone_friendface', "Yusuf's phone")
      # Darren has no takeable Friendface phone, so the player can never hold his number
      ask('dprice', 'mfa', {}, desk: 'call_desk')
      assert_answer_shape('helpdesk.refused', response)
      assert_nil state.dig('accountResets', 'darren_price')
      assert_equal 0, count('account_mfa_reenrolled')
    end

    test 'U3b M13b: before Priya is met the IT line reaches no desk' do
      take('yusuf_phone', 'phone_friendface', "Yusuf's phone")
      ask('ydemir', 'mfa', {}, desk: 'call_desk')
      assert_response :unprocessable_entity
      assert_equal 'unavailable', response.parsed_body['reason']
      assert_equal 0, count('account_mfa_reenrolled')
    end

    test 'U3b: the leak scanner over a played call-desk run reports nothing' do
      meet_priya
      get_row('scenario', {}, :boot0)
      ROOMS.each { |room| get_row("room/#{room}", {}, nil) }
      take_row('yusuf_phone', 'phone_friendface', "Yusuf's phone", :take_phone)
      call_desk_row('ydemir', 'mfa', :grant_call)
      get_row('scenario', {}, :boot_end)
      assert_operator @log.length, :>, 5
      assert_equal [], scan(@log).map { |f| [f.line, f.rule, f.owner, f.route] }
      assert_equal 'yusuf_demir', @marks[:grant_call]['body']['npcId']
      assert_equal true, state['accountResets']['yusuf_demir']['mfa']
    end

    # ---- S8c appended: a second step on locks (M14 to M17). Every case above is unchanged. ---------------------------

    RECORDS_PIN = '5821'.freeze
    ARCHIVE_PIN = '3074'.freeze
    SAFE_PIN = '6419'.freeze
    GWEN_PHONE = ['gwen_phone', 'phone_friendface', "Gwen's phone"].freeze
    FOB = ['anjali_fob', 'code_device', "Anjali's code fob"].freeze
    CASE = ['darren_case', 'briefcase', "Darren's case"].freeze
    CASE_KEY = ['darren_case_key', 'key', "Darren's case key"].freeze
    LOCK_SECRETS = [RECORDS_PIN, ARCHIVE_PIN, SAFE_PIN].freeze
    LOCK_NPCS = (PEOPLE + %w[gwen_pritchard fatima_begum]).freeze

    def meet_lock_cast
      game = Game.find(@game.id)
      game.player_state['encounteredNPCs'] = LOCK_NPCS.dup
      game.save!
    end

    def unlock_lock(type, id, attempt, method, extra = {})
      post game_path('unlock'), params: { targetType: type, targetId: id, attempt: attempt, method: method }.merge(extra), as: :json
      response.parsed_body
    end

    def lock_prompt(type, id)
      post game_path('mfa/prompt'), params: { target_type: type, target_id: id }, as: :json
      response.parsed_body
    end

    def lock_approve(type, id, params = {})
      post game_path('mfa/approve'), params: { target_type: type, target_id: id }.merge(params), as: :json
      response.parsed_body
    end

    def lock_verify(type, id, code)
      post game_path('mfa/verify'), params: { target_type: type, target_id: id, code: code }, as: :json
      response.parsed_body
    end

    def lock_phone(npc, type, id)
      get game_path('mfa/phone'), params: { npc_id: npc, target_type: type, target_id: id }, as: :json
      response.parsed_body
    end

    def open_rooms
      Array(state['unlockedRooms'])
    end

    def gate_rows(event, kind, id)
      rows(event).select { |r| r.dig('where', 'kind') == kind && r.dig('where', 'id') == id }
    end

    # M14 in full: the PIN, Gwen's phone from the charger, the approval, the open
    def open_records_room
      gate = unlock_lock('door', 'records_room', RECORDS_PIN, 'pin')
      assert_equal true, gate['secondStep'], gate.to_s
      take(*GWEN_PHONE)
      assert_response :success, response.body
      lock_approve('door', 'records_room')
      assert_response :success, response.body
      unlock_lock('door', 'records_room', RECORDS_PIN, 'pin')
      assert_includes open_rooms, 'records_room'
    end

    # A failed use of the records index, as the needs runner reports it (the index is down)
    def index_fail
      { npc_id: 'fatima_begum', event: 'fail', need: 'work', object_id: 'fatima_desk', missing: [{ id: 'index_service', why: 'down' }] }
    end

    def index_failure
      post game_path('npc_frustration'), params: { reports: [index_fail] }, as: :json
      assert_response :success, response.body
      response.parsed_body['answers'].first
    end

    def switch_index_off!
      put game_path('sync_state'), params: { globalVariables: { 'records_index_off' => true } }, as: :json
      assert_response :success, response.body
    end

    def hand_over_prop
      switch_index_off!
      first = index_failure
      later(25)
      second = index_failure
      [first, second]
    end

    test 'S8c: the two doors, the safe and the case, their owners, the prop and the clue texts are in the scenario' do
      data = scenario
      rooms = data['rooms']
      assert_equal({ 'kind' => 'push', 'owner' => 'gwen_pritchard' }, rooms['records_room']['secondStep'])
      assert_equal({ 'kind' => 'push', 'owner' => 'gwen_pritchard' }, rooms['archive_store']['secondStep'])
      assert_equal %w[pin pin], %w[records_room archive_store].map { |r| rooms[r]['lockType'] }
      assert_equal [RECORDS_PIN, ARCHIVE_PIN], %w[records_room archive_store].map { |r| rooms[r]['requires'] }
      assert_equal [%w[records_room archive_store]], [rooms['office']['connections']['north']]
      objects = rooms.values.flat_map { |r| Array(r['objects']) }.to_h { |o| [o['id'], o] }
      assert_equal({ 'kind' => 'code', 'owner' => 'anjali_rao' }, objects['records_safe']['secondStep'])
      assert_equal 'pin', objects['records_safe']['lockType']
      assert_equal({ 'kind' => 'push', 'owner' => 'darren_price' }, objects['darren_case']['secondStep'])
      assert_equal 'key', objects['darren_case']['lockType']
      assert objects['darren_case']['takeable'] && objects['darren_case']['droppable']
      assert_equal 'darren_case_key', objects['darren_case']['requires']
      key = objects['darren_drawer']['contents'].first
      assert_equal ['darren_case_key', objects['darren_case']['keyPins']], [key['opens_lock'], key['keyPins']]
      assert_equal false, objects['darren_drawer']['locked']
      assert_equal false, objects['gwen_drawer']['locked']
      assert_equal 'gwen_pritchard', objects['gwen_phone']['owner']
      assert_equal 'office', rooms.find { |_, r| Array(r['objects']).any? { |o| o['id'] == 'gwen_phone' } }.first
      assert_equal 'archive_door_propped', objects['archive_wedge']['revealOnGlobal']
      assert_equal 'office', rooms.find { |_, r| Array(r['objects']).any? { |o| o['id'] == 'archive_wedge' } }.first
      assert_equal false, data['globalVariables']['archive_door_propped']
      assert_equal({ 'name' => 'Index service', 'kind' => 'records', 'object' => 'fatima_desk', 'offWhen' => 'records_index_off' },
                   data['resources']['index_service'])
      npcs = rooms.values.flat_map { |r| Array(r['npcs']) }.to_h { |n| [n['id'], n] }
      assert_equal 'never', npcs['gwen_pritchard'].dig('habits', 'approvesPrompts')
      assert_equal [{ 'at' => 60, 'do' => 'prop_door', 'door' => 'archive_store', 'prop' => 'archive_wedge', 'setGlobal' => 'archive_door_propped' }],
                   npcs['fatima_begum']['workarounds']
      assert_equal %w[gwen_pritchard fatima_begum], rooms['office']['npcs'].map { |n| n['id'] }.last(2)
      assert_nil npcs['gwen_pritchard']['creds'], 'Gwen and Fatima sign in at no PC, so the helpdesk rule does not reach them'
      assert_nil npcs['fatima_begum']['creds']
      assert_equal %w[propped door_step safe_step case_step], data['objectives'].last['tasks'].map { |t| t['taskId'] }
      assert_equal 'late_locks', data['objectives'].last['aimId']
      # each PIN: its lock, and one clue each (the two doors on the kitchen notice, the safe in Gwen's drawer)
      texts = scenario_texts
      assert_includes texts['facilities_notice'], RECORDS_PIN
      assert_includes texts['facilities_notice'], ARCHIVE_PIN
      assert_not_includes texts['facilities_notice'], SAFE_PIN
      note = objects['gwen_drawer']['contents'].first
      assert_includes note['text'], SAFE_PIN
      assert_equal 'kitchen', rooms.find { |_, r| Array(r['objects']).any? { |o| o['id'] == 'facilities_notice' } }.first
      ink = Dir[File.join(File.dirname(SCENARIO_PATH), 'ink', '*.json')].map { |f| File.read(f) }.join
      LOCK_SECRETS.each { |secret| assert_not_includes ink, secret }
      chatter = [data['chatter'], npcs.values.map { |n| n['chatter'] }].to_json
      LOCK_SECRETS.each { |secret| assert_not_includes chatter, secret }
    end

    test 'S8c: nothing the browser is sent names a PIN of a gated lock or the contents of the records room' do
      get game_path('scenario'), as: :json
      body = response.parsed_body.to_json
      [RECORDS_PIN, ARCHIVE_PIN, SAFE_PIN, 'safe_papers', 'case_papers', 'Share certificates', 'darren_case_key"'].each do |word|
        assert_not_includes body, word, word
      end
      %w[lockSteps npcStepGrants mfaPrompts mfaAccounts].each { |key| assert_not_includes body, key }
      get game_path('room/records_room'), as: :json
      assert_not_includes response.body, 'records_safe'
      assert_not_includes open_rooms, 'records_room'
    end

    test 'S8c M14: the right PIN gives the gate and no room, Gwen never approves, her phone from the charger approves, then the door opens' do
      meet_lock_cast
      get game_path('room/records_room'), as: :json
      assert_not_includes response.body, 'records_safe', 'no room data before both checks'
      wrong = unlock_lock('door', 'records_room', ARCHIVE_PIN, 'pin')
      assert_response :unprocessable_entity
      assert_equal({ 'success' => false, 'message' => 'Invalid attempt' }, wrong)
      assert_equal 0, gate_rows('mfa_challenge', 'door', 'records_room').size, 'a wrong PIN starts no step'
      gate = unlock_lock('door', 'records_room', RECORDS_PIN, 'pin')
      assert_equal({ 'success' => false, 'secondStep' => true, 'kind' => 'push', 'targetType' => 'door', 'targetId' => 'records_room',
                     'npcId' => 'gwen_pritchard' }, gate)
      assert_equal 'no-store', response.headers['Cache-Control']
      assert_not_includes open_rooms, 'records_room'
      get game_path('room/records_room'), as: :json
      assert_not_includes response.body, 'records_safe'
      assert_equal 'pin', gate_rows('mfa_challenge', 'door', 'records_room').first.dig('detail', 'method')
      # Gwen never approves, however often she is asked (P7: nor does the asking raise anyone's frustration)
      5.times do |i|
        later(3)
        sent = lock_prompt('door', 'records_room')
        assert_equal false, sent['success'], "request #{i + 1} is not approved"
        assert_equal i + 1, sent['promptsSent']
      end
      assert_equal({}, state['npcFrustration'] || {}, 'P7: a held-up second step writes no frustration for anyone')
      assert_equal 5, count('mfa_prompt_sent')
      assert_equal 0, count('mfa_prompt_approved')
      # the phone is not held yet: no list, no approval
      lock_phone('gwen_pritchard', 'door', 'records_room')
      assert_response :forbidden
      lock_approve('door', 'records_room')
      assert_response :forbidden
      assert_not_includes open_rooms, 'records_room'
      take(*GWEN_PHONE)
      assert_response :success, response.body
      listed = lock_phone('gwen_pritchard', 'door', 'records_room')
      assert_response :success
      assert_equal 1, listed['requests'].size
      assert_equal %w[n name targetId targetType], listed['requests'].first.keys.sort
      assert_equal 5, listed['requests'].first['n']
      passed = lock_approve('door', 'records_room')
      assert_response :success
      assert_equal({ 'success' => true, 'stepPassed' => true, 'approvedBy' => 'player', 'targetType' => 'door', 'targetId' => 'records_room' }, passed)
      assert_not_includes open_rooms, 'records_room', 'the pass alone opens nothing'
      opened = unlock_lock('door', 'records_room', RECORDS_PIN, 'pin')
      assert_response :success
      assert_equal true, opened['success']
      assert opened['roomData'].is_a?(Hash)
      assert_includes open_rooms, 'records_room'
      assert_equal 1, gate_rows('mfa_prompt_approved', 'door', 'records_room').size
      assert_equal({ 'approver' => 'held_phone' }, gate_rows('mfa_prompt_approved', 'door', 'records_room').first['detail'])
      assert_not_includes Game.find(@game.id).player_state['opsLog'].to_json, RECORDS_PIN
    end

    test 'S8c M15: the archive store takes PIN and request, then Fatima props it and the room opens with no step and no approval row' do
      meet_lock_cast
      gate = unlock_lock('door', 'archive_store', ARCHIVE_PIN, 'pin')
      assert_equal %w[push door archive_store gwen_pritchard], gate.values_at('kind', 'targetType', 'targetId', 'npcId')
      assert_equal 1, lock_prompt('door', 'archive_store')['promptsSent']
      get game_path('room/archive_store'), as: :json
      assert_not_includes response.body, 'archive_boxes', 'shut'
      assert_not_includes open_rooms, 'archive_store'
      # the index goes off; Fatima fails twice (perFail 35, at 60) and is handed the prop
      first, second = hand_over_prop
      assert_nil first['run'], 'one failure is a warning only'
      run = second['run']
      assert run, second.to_s
      assert_equal 'prop_door', run['do']
      assert_equal 'archive_store', run['door']
      assert_equal 'archive_wedge', run['prop']
      later(5)
      workaround_done('fatima_begum', run)
      assert_response :success, response.body
      body = response.parsed_body
      assert_equal 'archive_store', body['roomId']
      assert body['roomData'].is_a?(Hash), 'the prop serves the room with no step'
      assert_includes open_rooms, 'archive_store'
      assert_equal 0, gate_rows('mfa_prompt_approved', 'door', 'archive_store').size, 'nothing was approved: the prop skipped the step'
      assert_equal 1, count('mfa_prompt_sent')
      get game_path('room/archive_store'), as: :json
      assert_response :success
      assert_includes response.body, 'archive_boxes'
      # the door stays open for the mission and the wedge's global is set
      assert_equal 'archive_door_propped', body['setGlobal']
      assert_equal true, state['globalVariables']['archive_door_propped']
      unlock_lock('door', 'archive_store', ARCHIVE_PIN, 'pin')
      assert_response :success
      assert_equal true, response.parsed_body['success'], 'no gate any more'
    end

    test 'S8c M15: with the index on, Fatima is never handed the prop; the records room stays shut and her door too' do
      meet_lock_cast
      post game_path('npc_frustration'), params: { reports: [index_fail] }, as: :json
      answer = response.parsed_body['answers'].first
      assert_nil answer['run'] if answer
      assert_not_includes open_rooms, 'archive_store'
      assert_not_includes open_rooms, 'records_room'
    end

    test 'S8c M15: the prop opens only the archive store; the records room still wants both checks' do
      meet_lock_cast
      _first, second = hand_over_prop
      later(5)
      workaround_done('fatima_begum', second['run'])
      assert_includes open_rooms, 'archive_store'
      assert_not_includes open_rooms, 'records_room'
      gate = unlock_lock('door', 'records_room', RECORDS_PIN, 'pin')
      assert_equal true, gate['secondStep'], 'the other door keeps its step'
      assert_not_includes open_rooms, 'records_room'
    end

    test 'S8c M16: the safe wants its PIN, then the code from Anjali\'s fob; nothing inside is listed before the pass' do
      meet_lock_cast
      # the safe is inside the records room: shut until that door has opened
      refused = unlock_lock('object', 'records_safe', SAFE_PIN, 'pin')
      assert_response :unprocessable_entity
      assert_equal({ 'success' => false, 'message' => 'Invalid attempt' }, refused)
      open_records_room
      wrong = unlock_lock('object', 'records_safe', ARCHIVE_PIN, 'pin')
      assert_response :unprocessable_entity
      assert_equal 0, gate_rows('mfa_challenge', 'object', 'records_safe').size
      gate = unlock_lock('object', 'records_safe', SAFE_PIN, 'pin')
      assert_equal({ 'success' => false, 'secondStep' => true, 'kind' => 'code', 'targetType' => 'object', 'targetId' => 'records_safe',
                     'npcId' => 'anjali_rao' }, gate)
      get game_path('container/records_safe'), as: :json
      assert_response :not_found
      assert_not_includes response.body, 'safe_papers'
      # no fob yet: the route says so
      lock_verify('object', 'records_safe', '123456')
      assert_response :forbidden
      assert_equal({ 'success' => false, 'error' => 'no such device' }, response.parsed_body)
      take(*FOB)
      assert_response :success, response.body
      code = device_code
      assert_match(/\A\d{6}\z/, code)
      bad = lock_verify('object', 'records_safe', wrong_for(code))
      assert_response :unprocessable_entity
      assert_equal true, bad['mfaIncorrect']
      assert_not_includes bad.keys, 'attemptsLeft'
      good = lock_verify('object', 'records_safe', code)
      assert_response :success
      assert_equal({ 'success' => true, 'stepPassed' => true, 'targetType' => 'object', 'targetId' => 'records_safe' }, good)
      get game_path('container/records_safe'), as: :json
      assert_response :not_found, 'the pass alone opens nothing'
      opened = unlock_lock('object', 'records_safe', SAFE_PIN, 'pin')
      assert_response :success
      assert_equal %w[safe_papers], opened['contents'].map { |c| c['id'] }
      assert_equal 1, gate_rows('mfa_code_ok', 'object', 'records_safe').size
      assert_equal 1, gate_rows('mfa_code_wrong', 'object', 'records_safe').size
      assert_not_includes Game.find(@game.id).player_state['opsLog'].to_json, SAFE_PIN
    end

    test 'S8c M16: the fob is still live after the helpdesk beats, and the safe\'s code comes from the same device as the PC\'s' do
      meet_lock_cast
      open_records_room
      ask('ydemir', 'mfa', YUSUF_ANSWERS)
      ask('dprice', 'password', DARREN_ANSWERS)
      unlock_lock('object', 'records_safe', SAFE_PIN, 'pin')
      take(*FOB)
      lock_verify('object', 'records_safe', device_code)
      assert_equal true, response.parsed_body['stepPassed']
    end

    test 'S8c M17: the carried case keeps its request count over a drop and a pick-up, and Darren approves on the third request' do
      meet_lock_cast
      unlock_lock('object', 'darren_drawer', nil, 'unlocked')
      assert_response :success, response.body
      get game_path('container/darren_drawer'), as: :json
      assert_response :success
      assert_equal %w[darren_case_key], response.parsed_body['contents'].map { |c| c['id'] }
      take(*CASE_KEY)
      assert_response :success, response.body
      take(*CASE)
      assert_response :success, response.body
      get game_path('container/darren_case'), as: :json
      assert_response :not_found, 'shut: nothing inside is on offer'
      gate = unlock_lock('object', 'darren_case', 'key', 'key')
      assert_equal({ 'success' => false, 'secondStep' => true, 'kind' => 'push', 'targetType' => 'object', 'targetId' => 'darren_case',
                     'npcId' => 'darren_price' }, gate)
      assert_equal 1, lock_prompt('object', 'darren_case')['promptsSent']
      drop_case
      take(*CASE)
      assert_response :success, response.body
      again = unlock_lock('object', 'darren_case', 'key', 'key')
      assert_equal true, again['secondStep']
      assert_equal 1, Game.find(@game.id).player_state['lockSteps']['object:darren_case']['n'], 'the count carried on'
      later(3)
      assert_equal 2, lock_prompt('object', 'darren_case')['promptsSent']
      drop_case
      take(*CASE)
      later(3)
      third = lock_prompt('object', 'darren_case')
      assert_response :success
      assert_equal({ 'success' => true, 'stepPassed' => true, 'approvedBy' => 'owner', 'targetType' => 'object', 'targetId' => 'darren_case' },
                   third.slice('success', 'stepPassed', 'approvedBy', 'targetType', 'targetId'))
      get game_path('container/darren_case'), as: :json
      assert_response :not_found, 'the pass alone opens nothing'
      opened = unlock_lock('object', 'darren_case', 'key', 'key')
      assert_equal %w[case_papers], opened['contents'].map { |c| c['id'] }
      assert_equal 3, count('mfa_prompt_sent')
      assert_equal({ 'approver' => 'owner' }, gate_rows('mfa_prompt_approved', 'object', 'darren_case').first['detail'])
      # M5's mapping must not tick on this approval: it carries no pcId (the lock form), so `data.pcId === 'darren_pc'` is false
      assert_equal 0, rows('mfa_prompt_approved').count { |r| r.dig('where', 'kind') == 'pc' && r.dig('where', 'id') == 'darren_pc' }
    end

    test 'S8c M17: without the key the case does not open, and a wrong key lock method is refused' do
      meet_lock_cast
      take(*CASE)
      unlock_lock('object', 'darren_case', 'key', 'key')
      assert_response :unprocessable_entity, 'no key held: the first factor fails and no step starts'
      assert_equal 0, gate_rows('mfa_challenge', 'object', 'darren_case').size
      unlock_lock('object', 'darren_case', '0000', 'pin')
      assert_response :unprocessable_entity
    end

    def drop_case
      post game_path('update_room'), params: { roomId: 'reception', actionType: 'add_object', sourceType: 'player_drop',
                                               data: { type: 'briefcase', id: 'darren_case', name: "Darren's case", position: { x: 4, y: 4 } } },
                                     as: :json
      assert_response :success, response.body
      post game_path('inventory'), params: { action_type: 'remove', item: { id: 'darren_case' } }, as: :json
      assert_response :success, response.body
    end

    # ---- the leak scanner over a played lock run -------------------------------------------------------------------

    def run_lock_game
      meet_lock_cast
      get_row('scenario', {}, :boot0)
      ROOMS.each { |room| get_row("room/#{room}", {}, nil) }
      # M15 first (Run E): the archive store's PIN and one request, then Fatima's prop
      post_row('unlock', { targetType: 'door', targetId: 'archive_store', attempt: ARCHIVE_PIN, method: 'pin' }, :archive_gate)
      post_row('mfa/prompt', { target_type: 'door', target_id: 'archive_store' }, :archive_prompt)
      put game_path('sync_state'), params: { globalVariables: { 'records_index_off' => true } }, as: :json
      rec(:index_off)
      post_row('npc_frustration', { reports: [index_fail] }, nil)
      later(25)
      post_row('npc_frustration', { reports: [index_fail] }, :fatima_handed)
      later(5)
      run = @marks[:fatima_handed]['body']['answers'].first['run']
      post_row('npc_workaround', { npc_id: 'fatima_begum', index: run['index'], hand: run['hand'] }, :prop_open)
      get_row('room/archive_store', {}, :archive_room)
      # M14: the records room, Gwen never answers, her phone from the charger
      post_row('unlock', { targetType: 'door', targetId: 'records_room', attempt: RECORDS_PIN, method: 'pin' }, :records_gate)
      post_row('mfa/prompt', { target_type: 'door', target_id: 'records_room' }, :records_prompt1)
      later(3)
      post_row('mfa/prompt', { target_type: 'door', target_id: 'records_room' }, :records_prompt2)
      take_row('gwen_phone', 'phone_friendface', "Gwen's phone", :take_gwen_phone)
      get_row('mfa/phone', { npc_id: 'gwen_pritchard', target_type: 'door', target_id: 'records_room' }, :gwen_phone)
      post_row('mfa/approve', { target_type: 'door', target_id: 'records_room' }, :records_pass)
      post_row('unlock', { targetType: 'door', targetId: 'records_room', attempt: RECORDS_PIN, method: 'pin' }, :records_open)
      # M16: the safe, a wrong code, the fob's code
      post_row('unlock', { targetType: 'object', targetId: 'records_safe', attempt: SAFE_PIN, method: 'pin' }, :safe_gate)
      take_row('anjali_fob', 'code_device', "Anjali's code fob", :take_fob)
      get_row('mfa/device', { item_id: 'anjali_fob' }, :fob_code)
      right = @marks[:fob_code]['body']['code']
      post_row('mfa/verify', { target_type: 'object', target_id: 'records_safe', code: wrong_for(right) }, :safe_wrong)
      post_row('mfa/verify', { target_type: 'object', target_id: 'records_safe', code: right }, :safe_pass)
      post_row('unlock', { targetType: 'object', targetId: 'records_safe', attempt: SAFE_PIN, method: 'pin' }, :safe_open)
      # M17: the case, a drop and a pick-up between the requests, Darren's approval
      post_row('unlock', { targetType: 'object', targetId: 'darren_drawer', method: 'unlocked' }, nil)
      get_row('container/darren_drawer', {}, :drawer)
      take_row('darren_case_key', 'key', "Darren's case key", :take_key)
      take_row('darren_case', 'briefcase', "Darren's case", :take_case)
      post_row('unlock', { targetType: 'object', targetId: 'darren_case', attempt: 'key', method: 'key' }, :case_gate)
      post_row('mfa/prompt', { target_type: 'object', target_id: 'darren_case' }, :case_prompt1)
      drop_case_row
      take_row('darren_case', 'briefcase', "Darren's case", nil)
      later(3)
      post_row('mfa/prompt', { target_type: 'object', target_id: 'darren_case' }, :case_prompt2)
      later(3)
      post_row('mfa/prompt', { target_type: 'object', target_id: 'darren_case' }, :case_pass)
      post_row('unlock', { targetType: 'object', targetId: 'darren_case', attempt: 'key', method: 'key' }, :case_open)
      get_row('scenario', {}, :boot_end)
      @log
    end

    def drop_case_row
      post_row('update_room', { roomId: 'reception', actionType: 'add_object', sourceType: 'player_drop',
                                data: { type: 'briefcase', id: 'darren_case', name: "Darren's case", position: { x: 4, y: 4 } } }, nil)
      post_row('inventory', { action_type: 'remove', item: { id: 'darren_case' } }, nil)
    end

    # The plan's 8.4 step 5 S8c exception (the older mfa_secret and mfa_session rules may flag an honest answer that echoes a lock)
    # did not arise: the scanner reports nothing of any rule over this run, so the plain zero stands. The docs still list the limit.
    test 'S8c: the leak scanner over the whole played lock run reports nothing, and the run holds every earned answer' do
      run_lock_game
      assert_operator @log.length, :>, 30
      assert_equal [], scan(@log).map { |f| [f.line, f.rule, f.owner, f.route] }
      assert_equal 'gwen_pritchard', @marks[:archive_gate]['body']['npcId']
      assert @marks[:prop_open]['body']['roomData'], 'the prop opens the archive store'
      assert_equal 'player', @marks[:records_pass]['body']['approvedBy']
      assert @marks[:records_open]['body']['roomData']
      assert_match(/\A\d{6}\z/, @marks[:fob_code]['body']['code'])
      assert_equal %w[safe_papers], @marks[:safe_open]['body']['contents'].map { |c| c['id'] }
      assert_equal 'owner', @marks[:case_pass]['body']['approvedBy']
      assert_equal %w[case_papers], @marks[:case_open]['body']['contents'].map { |c| c['id'] }
      assert_equal 422, @marks[:safe_wrong]['status']
      LOCK_SECRETS.each { |secret| assert_not_includes @marks[:boot_end]['body'].to_json, secret }
    end

    # ---- the guided tour (SHOWCASE_TOUR_PLAN.md 2.6, unit U3) ----------------------------------------

    TOUR_TASKS = %w[see_note see_temper_note overhear step_holds open_screen fob number_match exempt reset_password reenrol
                    desk_refuses desk_call door_step propped safe_step case_step].freeze

    def ama_mappings
      scenario['rooms'].values.flat_map { |r| Array(r['npcs']) }.find { |n| n['id'] == 'ama_owusu' }['eventMappings']
    end

    test 'tour: every beat has one once-only "what you just saw" bark on its done global, short and free of secrets' do
      maps = ama_mappings
      secrets = [LORNA, DARREN, ANJALI, YUSUF, NIAMH].flatten + [DARREN_NEW, '5821', '3074', '6419', '40118', '40371', '40226', '40459']
      TOUR_TASKS.each do |task|
        found = maps.select { |m| m['eventPattern'] == "global_variable_changed:#{task}_done" && m['bark'] }
        assert_equal 1, found.size, "#{task} has one bark"
        assert found.first['onceOnly'], "#{task} bark is once only"
        assert_includes found.first['condition'], 'data.value === true'
        assert_operator found.first['bark'].split.size, :<=, 30, "#{task} bark within the 30-word cap"
        secrets.each { |x| assert_not_includes found.first['bark'], x }
      end
      pointer = maps.find { |m| m['eventPattern'] == 'pc_in_use:lorna_pc' }
      assert_equal 'Nobody signs in at a PC while its owner is sitting there. Everything today waits until people step away.', pointer['bark']
    end

    test 'tour: Darren keeps his 90 s leave threshold and gains a 50 s idle lock; the lock bark reads the screen global' do
      data = scenario
      objects = data['rooms'].values.flat_map { |r| Array(r['objects']) }
      assert_equal 50, objects.find { |o| o['id'] == 'darren_pc' }['autoLockSeconds']
      darren = data['rooms'].values.flat_map { |r| Array(r['npcs']) }.find { |n| n['id'] == 'darren_price' }
      assert_equal 90, darren.dig('habits', 'screen', 'lockIfAwayOverSeconds')
      assert_equal false, data['globalVariables']['darren_pc_screen_locked']
      bark = ama_mappings.find { |m| m['eventPattern'] == 'global_variable_changed:darren_pc_screen_locked' }
      assert_includes bark['condition'], 'act_midday'
      assert_includes bark['condition'], 'pestered_done'
    end

    test 'tour: the desktop form ticks reenrol only after the password reset, and Thandiwe still ticks it in person' do
      m = ama_mappings.find { |x| x['eventPattern'] == 'helpdesk_answered:it_desk' && x['completeTask'] == 'reenrol' }
      assert_includes m['condition'], "reset_password_done === true"
      assert_includes m['condition'], "reenrol_done !== true"
      ink = File.read(File.expand_path('../../../scenarios/demo_ops_second_step/ink/thandiwe_moyo.ink', __dir__))
      assert_includes ink, '#complete_task:reenrol'
    end

    test 'tour: one voice per character, no two speakers share a voice, the four changed voices and the chatter pass' do
      data = scenario
      npcs = data['rooms'].values.flat_map { |r| Array(r['npcs']) }
      voices = npcs.to_h { |n| [n['id'], n.dig('voice', 'name')] }
      assert_equal voices.values.uniq.size, voices.values.size
      assert_equal({ 'niamh_doherty' => 'Kore', 'anjali_rao' => 'Aoede', 'lorna_easton' => 'Erinome', 'thandiwe_moyo' => 'Pulcherrima' },
                   voices.slice('niamh_doherty', 'anjali_rao', 'lorna_easton', 'thandiwe_moyo'))
      assert_includes npcs.find { |n| n['id'] == 'niamh_doherty' }.dig('voice', 'style'), 'covering reception today'
      assert_equal true, data['ttsPregenerateChatter']
    end

    test 'tour: the lunch lever waits for the temper note and the M12 pointer names Thandiwe and the desktop form' do
      ink = File.read(File.expand_path('../../../scenarios/demo_ops_second_step/ink/ama_owusu.ink', __dir__))
      lunch = ink[/=== lever_lunch ===.*?(?==== lever_index)/m]
      assert_includes lunch, 'not see_temper_note_done'
      assert_includes lunch, "let Darren's temper run first."
      # Tour round 1: the desktop form only sends while Darren's screen is open (a coffee trip measured 14 to 18 s,
      # and a form sent after his return is refused), so the pointer sends the player to Thandiwe and names the form as the other route
      assert_includes ink, 'Now ask Thandiwe for an approval reset for Yusuf.'
      assert_includes ink, "The same form is on Darren's desktop too, but it only sends while his screen is open."
    end

    # Tour round 1 fixes: the note is ticked only by seeing it (no hub claim), the IT line promises the call-back
    # rather than reporting it, and the IT line is a voiced call in a man's voice that nobody else here uses.
    test 'tour: no ink claim of the note, the IT line voiced and promising the call-back, the board and pointers in the panel order' do
      ama = File.read(File.expand_path('../../../scenarios/demo_ops_second_step/ink/ama_owusu.ink', __dir__))
      assert_not_includes ama, '=== tell_note ==='
      assert_not_includes ama, '#complete_task:'
      line = File.read(File.expand_path('../../../scenarios/demo_ops_second_step/ink/it_line.ink', __dir__))
      assert_not_includes line, 'came back fine'
      assert_includes line, "we'll ring the number we hold for that account to check."
      data = scenario
      npcs = data['rooms'].values.flat_map { |r| Array(r['npcs']) }
      it_line = npcs.find { |n| n['id'] == 'it_line' }
      assert_equal true, it_line['voiced']
      assert_equal 'Charon', it_line.dig('voice', 'name')
      assert BreakEscape::TtsLineExtractor.voiced_phone_call?(it_line)
      # the order of "What's next?" follows the panel, aim by aim
      tasks = data['objectives'].sort_by { |a| a['order'] }.flat_map { |a| a['tasks'].map { |t| t['taskId'] } }
      nxt = ama[/=== whats_next ===.*?(?==== give_lorna_card)/m].scan(/- not (\w+)_done:/).flatten
      assert_equal tasks, nxt
      board = data['rooms'].values.flat_map { |r| Array(r['objects']) }.find { |o| o['id'] == 'tour_notice' }['text']
      assert_includes board, 'Meet Priya in the IT room'
      assert_includes board, "The same form is on Darren's desktop"
      assert_operator board.index('archive store door'), :<, board.index('records room door')
    end
  end
end
