require 'test_helper'
require_relative '../../support/network_ops_scenario'
require_relative '../../support/helpdesk_answer_shapes'

module BreakEscape
  # Ops S8b unit 23 (feature A23, the S8b feature scenario): the real scenarios/test_ops_helpdesk/scenario.json.erb driven
  # through the routes, one test per beat of the brief's section 6 that the server can answer, each assertion read from a
  # re-read game, the audit rows or a fresh answer. Time is frozen: the desk's five-minute stop lifts by `travel_to`, and a
  # code is read from the own-phone route, as the browser does. Every answer is checked against the shared shapes
  # (test/support/helpdesk_answer_shapes.rb), never against a hand-written copy. The browser half (forms, panes, buttons) is
  # PLAYTEST.md's.
  #
  # CAPTURE=1 also WRITES the answers the played run really received, in the capture-row format the leak scanner reads, to
  # test/fixtures/files/ops_helpdesk_real_capture_rows.jsonl (the committed fixture is that output; unit 24's scanner test reads it):
  #   CAPTURE=1 flock /home/deploy/BreakEscape/tmp/tests.lock bin/rails test test/controllers/break_escape/ops_helpdesk_scenario_test.rb
  class OpsHelpdeskScenarioTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests
    include HelpdeskAnswerShapes

    SCENARIO_PATH = File.expand_path('../../../scenarios/test_ops_helpdesk/scenario.json.erb', __dir__)
    CAPTURE_PATH = File.expand_path('../../fixtures/files/ops_helpdesk_real_capture_rows.jsonl', __dir__)
    T0 = Time.zone.at(1_800_000_000)
    LOG = 'helpdesk_audit'.freeze
    SAM = ['s.okoro', 'Okoro-Front-26'].freeze
    TESS = ['t.ama', 'Ambergate-Tess-27'].freeze
    TESS_NEW = 'Cobalt-Fenwick-58'.freeze
    UGO = ['u.reyes', 'Reyes-Harbour-14'].freeze
    VERA = ['v.holt', 'Holtwell-Vera-35'].freeze
    WIM = ['w.duarte', 'Duarte-Signal-72'].freeze
    TESS_ANSWERS = { 'staff_no' => '40517', 'manager' => 'Nell Brook' }.freeze
    WIM_ANSWERS = { 'staff_no' => '40612', 'manager' => 'Pia Hart' }.freeze
    WRONG = { 'staff_no' => '00000', 'manager' => 'Nobody' }.freeze
    SAVED_FILE = { 'id' => 'tess_saved_file', 'type' => 'text_file', 'name' => 'Records PC.rdp', 'credential' => 'tess_saved' }.freeze
    Reply = Struct.new(:status, :parsed_body)

    def scenario
      JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
    end

    def build(player_state = {})
      build_network_game({ 'unlockedRooms' => %w[front_office service_desk records], 'currentRoom' => 'front_office',
                           'encounteredNPCs' => %w[ria omar sam wim tess ugo vera] }.merge(player_state), scenario)
    end

    setup do
      travel_to T0
      @log = []
      @marks = {}
      build
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

    # ---- one recorded answer, in the browser capture's shape (what the scanner reads) -------------------------------------

    def rec(mark = nil, extra = {})
      row = { 't' => (Time.utc(2026, 1, 1) + @log.length).iso8601(3), 'method' => request.request_method,
              'path' => request.path.sub(%r{/games/\d+/}, '/games/1/'), 'status' => response.status, 'body' => response.parsed_body }
      row['query'] = request.query_string unless request.query_string.to_s.empty?
      @log << row.merge(extra)
      @marks[mark] = @log.last if mark
      @log.last
    end

    def get_row(path, params = {}, mark = nil)
      get params.empty? ? game_path(path) : "#{game_path(path)}?#{params.to_query}", as: :json
      rec(mark)
    end

    def post_row(path, params, mark = nil)
      post game_path(path), params: params, as: :json
      rec(mark)
    end

    def sign_in_row(pc, creds, mark = nil)
      sign_in(pc, *creds)
      rec(mark, 'login' => { 'pcId' => pc })
    end

    def take_row(id, type, name, mark = nil, npc: nil)
      params = { action_type: 'add', item: { type: type, id: id, name: name } }
      params[:source_npc_id] = npc if npc
      post game_path('inventory'), params: params, as: :json
      assert_response :success, response.body
      rec(mark, 'inv' => { 'action' => 'add', 'itemId' => id, 'usedOn' => nil })
    end

    def ask_row(username, what, answers, mark = nil, desk: 'it_desk', pc: nil)
      params = { desk_id: desk, username: username, what: what, answers: answers }
      params[:pc_id] = pc if pc
      post_row('helpdesk/request', params, mark)
    end

    def shaped(name)
      assert_answer_shape(name, response)
    end

    def ask(username, what, answers, desk: 'it_desk', pc: nil)
      params = { desk_id: desk, username: username, what: what, answers: answers }
      params[:pc_id] = pc if pc
      post game_path('helpdesk/request'), params: params, as: :json
      response.parsed_body
    end

    def ask_wrong(user = UGO[0])
      ask(user, 'password', WRONG)
    end

    def lock_tess
      3.times { sign_in('records_pc', TESS[0], 'wrong-password') }
    end

    def device_code(npc)
      get game_path('mfa/device'), params: { npc_id: npc }, as: :json
      assert_response :success, response.body
      response.parsed_body['code']
    end

    # The own-phone sign-in that a second-step reset opens: the plain-push form has no entry of its own in the shared shapes
    # (they hold the number-matching one), so it is derived from that entry: the same keys without `number`, `mfa` push.
    def derived_push_shape(body)
      entry = HelpdeskAnswerShapes.entries['login.mfa_required_own_push']
      want = entry['body'].except('number').merge('mfa' => 'push')
      assert_equal want.keys.sort, body.keys.sort
      assert_equal want.except(*Array(entry['vary']).map { |p| p.delete_prefix('body.') }),
                   body.except(*Array(entry['vary']).map { |p| p.delete_prefix('body.') })
    end

    # approve.own_passed and verify.own_passed in a scenario whose NPC has a talk sprite: the real sign-in answer also carries the
    # NPC's `portrait` (checked to be that path), so it is judged against the `_portrait` entry.
    def assert_signed_in_shape(name, status, body, npc_id)
      want = scenario['rooms'].values.flat_map { |r| Array(r['npcs']) }.find { |n| n['id'] == npc_id }['spriteTalk']
      assert_equal want, body['portrait']
      assert_answer_shape("#{name}_portrait", Reply.new(status, body))
    end

    def wim_reenrolled!
      assert_equal true, ask(WIM[0], 'mfa', WIM_ANSWERS)['granted']
    end

    # ---- the scenario's shape --------------------------------------------------------------------------------------------

    test 'the real scenario holds the desks, accounts, PCs and items the beats need' do
      data = scenario
      assert_equal %w[id_desk it_desk], data['helpdesks'].keys.sort
      assert_equal %w[questions callback], data['helpdesks'].values_at('it_desk', 'id_desk').map { |d| d['verify'] }
      npcs = data['rooms'].values.flat_map { |r| Array(r['npcs']) }
      with_reset = npcs.select { |n| n.dig('creds', 'resetPassword') }.map { |n| n['id'] }.sort
      assert_equal %w[tess ugo], with_reset
      pcs = data['rooms'].values.flat_map { |r| r['objects'] }.select { |o| o['type'] == 'pc' }.to_h { |o| [o['id'], o['policy']] }
      assert_equal({ 'front_pc' => 'front', 'ops_pc' => 'ops', 'records_pc' => 'strict', 'vault_pc' => 'vault' }, pcs)
      assert_equal({ 'maxAttempts' => 3, 'remote' => 'allowed' }, data['policies']['strict'])
      call = data['social']['pretextNpcs'].first
      assert_equal 'it_line_call', call['callId']
      assert_equal 'it_desk', call['asks']['reset_request']['helpdesk']
    end

    # ---- the bootstrap ----------------------------------------------------------------------------------------------------

    test 'the bootstrap carries helpdeskForms with exactly the three keys per desk, and no desk setting' do
      body = bootstrap_scenario
      assert_response :success
      forms = body['helpdeskForms']
      assert_equal %w[id_desk it_desk], forms.keys.sort
      # the shared entry holds the one desk it_desk; read it through the shape check
      assert_answer_shape('bootstrap.helpdesk_forms', Reply.new(response.status, forms.slice('it_desk')))
      want_keys = HelpdeskAnswerShapes.entries['bootstrap.helpdesk_forms']['body']['it_desk'].keys.sort
      assert_equal want_keys, forms['id_desk'].keys.sort
      assert_equal 'omar', forms['id_desk']['npc']
      assert_equal ['mfa'], forms['id_desk']['resets']
      assert_equal({}, forms['id_desk']['questionLabels'])
      assert_not body.key?('helpdesks')
      assert_not_includes response.body, 'minCorrect'
      assert_not_includes response.body, 'maxTries'
    end

    # ---- beat 1, 14 and 15: lock; refuse, stop, the same for a stranger (the last two are played last) ----------------------------------------------------------

    test 'beat 1: three wrong passwords lock the account at the records PC' do
      lock_tess
      assert_equal true, sign_in('records_pc', TESS[0], 'wrong-password')['lockedOut']
      assert_equal true, sign_in('records_pc', *TESS)['lockedOut'], 'the right password is refused while locked'
      assert state['loginLockouts'].any?
      assert_nil state['sessions']['records_pc']
    end

    test 'beat 14: two wrong answers per ask count down, the third stops the desk, the fourth is blocked, five minutes lift it' do
      ask_wrong
      shaped('helpdesk.refused')
      assert_equal 2, response.parsed_body['triesLeft']
      ask_wrong
      assert_equal 1, response.parsed_body['triesLeft']
      ask_wrong
      shaped('helpdesk.refused_last')
      ask_wrong
      shaped('helpdesk.blocked')
      assert_equal 'no-store', response.headers['Cache-Control']
      assert_equal 4, count('helpdesk_request'), 'three refusals and the blocked answer'
      assert_equal %w[refused refused refused blocked], rows('helpdesk_request').flat_map { |r| [r['result']] * (r['n'] || 1) }
      entry = state['helpdeskTries']['it_desk|u.reyes']
      assert_equal 3, entry['n']
      assert entry['stoppedAt']
      # a stop is per username: another name is still heard
      ask(TESS[0], 'password', WRONG)
      shaped('helpdesk.refused')
      later(HelpdeskModel::DESK_STOP_SECONDS - 1)
      ask_wrong
      shaped('helpdesk.blocked')
      assert_operator response.parsed_body['retryIn'], :<=, 1
      later(1)
      ask_wrong
      shaped('helpdesk.refused')
      assert_equal 2, response.parsed_body['triesLeft'], 'the lifted stop starts the count again'
    end

    test 'beat 15: a name nobody has gets the same answer and the same row shape as a wrong answer' do
      ask_wrong
      known = [response.status, response.parsed_body, rows('helpdesk_request').last.except('t', 'as', 'seq')]
      ask('nobody.here', 'password', WRONG)
      stranger = [response.status, response.parsed_body, rows('helpdesk_request').last.except('t', 'as', 'seq')]
      assert_equal known, stranger
      assert_equal rows('helpdesk_request').first.keys.sort, rows('helpdesk_request').last.keys.sort
    end

    # ---- beat 2: the facts are findable ----------------------------------------------------------------------------------

    test 'beat 2: the staff file and the team post carry the two facts the desk asks for, in public' do
      get game_path('room/records'), as: :json
      assert_response :success
      text = response.body
      assert_includes text, '40517'
      assert_includes text, '40612'
      assert_not_includes text, 'Cobalt-Fenwick-58', 'the reset password is in no room answer'
      body = bootstrap_scenario
      assert_includes JSON.generate(body['social']), 'Nell Brook'
    end

    # ---- beat 3 to 6: the reset, the stale saved connection, old out new in, asking twice ------------------------------------

    test 'beat 3: the reset grants the password, clears the lockout, and the keyring lists it once' do
      lock_tess
      3.times { sign_in('records_pc', UGO[0], 'wrong-password') }
      assert_equal 0, rows('account_password_reset').size
      body = ask(TESS[0], 'password', TESS_ANSWERS)
      shaped('helpdesk.granted_password')
      assert_equal TESS_NEW, body['password']
      assert_equal ['records_pc'], body['lockoutPcIds'], 'the list is what is still locked: Ugo, at the same PC'
      assert_equal 1, state['loginLockouts'].size
      assert_equal %w[records_pc u.reyes], AccessIdentities.lockout_key_parts(state['loginLockouts'].first)
      assert_equal true, state['accountResets']['tess']['password']
      assert_nil state['accountResets']['tess']['typed']
      assert_not_includes JSON.generate(state['loginLockouts']), 'tess'
      assert_equal 1, count('account_password_reset')
      assert_equal 1, rows('helpdesk_request').count { |r| r['result'] == 'granted' }
      get game_path('keyring'), as: :json
      entry = response.parsed_body['entries'].find { |e| e['id'] == 'tess.reset' }
      assert_answer_shape('keyring.reset_entry', Reply.new(200, entry))
      assert_equal TESS_NEW, entry['password']
    end

    test 'beat 3: the reset password is in no answer before the grant, and a wrong request grants nothing' do
      ask(TESS[0], 'password', WRONG)
      shaped('helpdesk.refused')
      get game_path('keyring'), as: :json
      assert_not_includes response.body, TESS_NEW
      assert_nil state['accountResets']
      assert_not_includes JSON.generate(state), TESS_NEW
    end

    test 'beats 4 and 5: the saved connection is stale after the reset, the old password is refused, the new one signs in' do
      build('inventory' => [SAVED_FILE])
      sign_in('front_pc', *SAM)
      post game_path('login'), params: { pc_id: 'records_pc', credential: 'tess_saved', from: 'front_pc' }, as: :json
      assert_response :success, response.body
      post game_path('logout'), params: { pc_id: 'records_pc' }, as: :json
      ask(TESS[0], 'password', TESS_ANSWERS)
      post game_path('login'), params: { pc_id: 'records_pc', credential: 'tess_saved', from: 'front_pc' }, as: :json
      assert_answer_shape('keyring.password_changed', response)
      assert_nil state['sessions']['records_pc']
      body = sign_in('records_pc', TESS[0], TESS[1])
      assert_not body['success'], 'the old password is refused after a reset'
      assert_equal 1, state['loginFailures']['records_pc|t.ama']['n']
      body = sign_in('records_pc', TESS[0], TESS_NEW)
      assert body['success'], body.to_s
      assert_equal 'tess', state['sessions']['records_pc']['id']
      assert_equal true, state['accountResets']['tess']['typed']
      post game_path('logout'), params: { pc_id: 'records_pc' }, as: :json
      post game_path('login'), params: { pc_id: 'records_pc', credential: 'tess_saved', from: 'front_pc' }, as: :json
      assert_response :success, 'once the new password is typed the saved connection signs in'
    end

    test 'beat 6: asking twice is harmless: the same grant, state and counters unchanged, no second reset row' do
      first = ask(TESS[0], 'password', TESS_ANSWERS)
      before = state.slice('accountResets', 'helpdeskTries', 'loginFailures', 'loginLockouts')
      resets = count('account_password_reset')
      second = ask(TESS[0], 'password', TESS_ANSWERS)
      shaped('helpdesk.granted_password')
      assert_equal first, second
      assert_equal before, state.slice('accountResets', 'helpdeskTries', 'loginFailures', 'loginLockouts')
      assert_equal resets, count('account_password_reset')
    end

    test 'a desk asked for what it does not reset, or an account with no reset password, is refused the same way' do
      ask(VERA[0], 'password', { 'staff_no' => '40388', 'manager' => 'Ruth Mace' })
      shaped('helpdesk.refused')
      ask(TESS[0], 'nonsense', TESS_ANSWERS)
      shaped('helpdesk.unavailable')
      ask(TESS[0], 'password', TESS_ANSWERS, desk: 'no_such_desk')
      shaped('helpdesk.not_found')
      post game_path('helpdesk/request'), params: { desk_id: 'it_desk', username: 'x' }, as: :json
      shaped('helpdesk.bad_request')
    end

    # ---- beat 7: over a PC, the form on the desktop ------------------------------------------------------------------------

    test 'beat 7: the desktop holds the form item with exactly four keys, it cannot be taken, and the PC form resets the second step' do
      assert_equal true, sign_in('front_pc', *SAM)['success']
      body = container('front_pc')
      assert_response :success
      form = body['contents'].find { |i| i['id'] == 'front_form' }
      assert_equal %w[desk id name type], form.keys.sort
      assert_equal({ 'type' => 'helpdesk_form', 'id' => 'front_form', 'name' => 'IT request form', 'desk' => 'it_desk' }, form)
      post game_path('inventory'), params: { action_type: 'add', item: { type: 'helpdesk_form', id: 'front_form', name: 'IT request form' },
                                             source_pc_id: 'front_pc' }, as: :json
      assert_response :unprocessable_entity
      assert_not Game.find(@game.id).player_state['inventory'].to_a.any? { |i| (i['scenarioData'] || i)['id'] == 'front_form' }
      post game_path('inventory'), params: { action_type: 'add', item: { type: 'helpdesk_form', id: 'front_form', name: 'IT request form' },
                                             source_pc_id: 'front_pc', source_resource_id: 'front_form', transfer: 'copy' }, as: :json
      assert_response :unprocessable_entity
      ask(WIM[0], 'mfa', WIM_ANSWERS, pc: 'front_pc')
      shaped('helpdesk.granted_mfa')
      assert_equal true, state['accountResets']['wim']['mfa']
      assert_nil state['accountResets']['wim']['password']
      assert_equal 1, count('account_mfa_reenrolled')
    end

    test 'beat 7: a desk request over a PC with no session, or a locked one, is unavailable' do
      ask(WIM[0], 'mfa', WIM_ANSWERS, pc: 'front_pc')
      shaped('helpdesk.unavailable')
      sign_in('front_pc', *SAM)
      post game_path('lock_session'), params: { pc_id: 'front_pc' }, as: :json
      ask(WIM[0], 'mfa', WIM_ANSWERS, pc: 'front_pc')
      shaped('helpdesk.unavailable')
    end

    # ---- beat 8: my phone, push -------------------------------------------------------------------------------------------

    test 'beat 8: before the reset a push at the ops PC has no own phone; after it the own phone approves, the old way is refused' do
      before = sign_in('ops_pc', *WIM)
      assert_equal true, before['mfaRequired']
      assert_nil before['ownPhone']
      get game_path('mfa/phone'), params: { own: 1 }, as: :json
      assert_answer_shape('phone.no_phone', response)
      wim_reenrolled!
      body = sign_in('ops_pc', *WIM)
      derived_push_shape(body)
      post game_path('mfa/prompt'), params: { pc_id: 'ops_pc' }, as: :json
      assert_answer_shape('prompt.waiting_own', response)
      get game_path('mfa/phone'), params: { own: 1 }, as: :json
      assert_answer_shape('phone.own', response)
      assert_equal 'ops_pc', response.parsed_body['requests'].first['pcId']
      post game_path('mfa/approve'), params: { pc_id: 'ops_pc' }, as: :json
      assert_response :forbidden, 'without own=1 a re-enrolled account is not approved'
      assert_nil state['sessions']['ops_pc']
      # the client sends own=1 in the URL query (the body carries pc_id only): the action reads params either way
      post "#{game_path('mfa/approve')}?own=1", params: { pc_id: 'ops_pc' }, as: :json
      assert_signed_in_shape('approve.own_passed', response.status, response.parsed_body, 'wim')
      assert_equal 'own_phone', response.parsed_body['approvedBy']
      assert_equal 'wim', state['sessions']['ops_pc']['id']
    end

    test 'beat 8: the own phone lists nothing for an account no desk re-enrolled, and approves for nobody else' do
      wim_reenrolled!
      get game_path('mfa/phone'), params: { own: 1 }, as: :json
      assert_response :success
      assert_equal [], response.parsed_body['requests'], 'no pending sign-in, so nothing to list'
      post "#{game_path('mfa/approve')}?own=1", params: { pc_id: 'ops_pc' }, as: :json
      assert_not state['sessions']['ops_pc']
    end

    # ---- beat 9 and 10: the callback desk -----------------------------------------------------------------------------------

    test 'beat 9 and 10: the callback desk refuses without her phone and grants with it; the grant re-enrols her' do
      ask(VERA[0], 'mfa', {}, desk: 'id_desk')
      shaped('helpdesk.refused')
      assert_nil state['accountResets']
      take_ok = lambda do
        post game_path('inventory'), params: { action_type: 'add', item: { type: 'phone_friendface', id: 'vera_phone', name: "Vera's phone" },
                                               source_npc_id: 'vera' }, as: :json
        response.status
      end
      assert_equal 200, take_ok.call
      ask(VERA[0], 'mfa', {}, desk: 'id_desk')
      shaped('helpdesk.granted_mfa')
      assert_equal true, state['accountResets']['vera']['mfa']
      assert_equal 1, count('account_mfa_reenrolled')
      # the desk that asks questions does not take a callback; the callback desk resets no password
      ask(VERA[0], 'password', {}, desk: 'id_desk')
      shaped('helpdesk.unavailable')
    end

    test 'a desk whose NPC has not been met, or is knocked out, serves nobody' do
      build('encounteredNPCs' => %w[sam])
      ask(TESS[0], 'password', TESS_ANSWERS)
      shaped('helpdesk.unavailable')
      build
      post game_path('update_room'), params: { roomId: 'service_desk', actionType: 'update_npc_state',
                                               data: { npcId: 'ria', stateChanges: { isKO: true, currentHP: 0 } } }, as: :json
      ask(TESS[0], 'password', TESS_ANSWERS)
      shaped('helpdesk.unavailable')
    end

    # ---- beat 11 and 12: my phone, code; the old device -------------------------------------------------------------------

    test 'beat 11 and 12: the own code signs in once, the loose old device shows no code afterwards' do
      post game_path('inventory'), params: { action_type: 'add', item: { type: 'phone_friendface', id: 'vera_phone', name: "Vera's phone" },
                                             source_npc_id: 'vera' }, as: :json
      ask(VERA[0], 'mfa', {}, desk: 'id_desk')
      body = sign_in('vault_pc', *VERA)
      assert_answer_shape('login.mfa_required_own_code', Reply.new(200, body))
      get game_path('mfa/device'), params: { npc_id: 'vera' }, as: :json
      assert_answer_shape('device.own', response)
      code = response.parsed_body['code']
      post game_path('mfa/verify'), params: { pc_id: 'vault_pc', code: code }, as: :json
      assert_signed_in_shape('verify.own_passed', response.status, response.parsed_body, 'vera')
      assert_equal 'vera', state['sessions']['vault_pc']['id']
      assert state['mfaAccounts']['vera']['used']
      get game_path('mfa/device'), params: { npc_id: 'vera' }, as: :json
      assert_answer_shape('device.own_used', response)
      # the old device: taken from the Records desk, it says it is no longer in use
      post game_path('inventory'), params: { action_type: 'add', item: { type: 'code_device', id: 'vera_device', name: 'Code device' } }, as: :json
      assert_response :success, response.body
      get game_path('mfa/device'), params: { item_id: 'vera_device' }, as: :json
      assert_answer_shape('device.unenrolled', response)
      assert_not_includes response.body, code
      assert_not response.parsed_body.key?('code')
    end

    test 'beat 12: before any reset the loose device is live' do
      post game_path('inventory'), params: { action_type: 'add', item: { type: 'code_device', id: 'vera_device', name: 'Code device' } }, as: :json
      get game_path('mfa/device'), params: { item_id: 'vera_device' }, as: :json
      assert_response :success
      assert_match(/\A\d{6}\z/, response.parsed_body['code'])
    end

    # ---- beat 13: from a call ------------------------------------------------------------------------------------------------

    test 'beat 13: the call ask names the IT desk, which the bootstrap forms carry' do
      body = bootstrap_scenario
      assert_equal 'ria', body['helpdeskForms']['it_desk']['npc']
      assert_includes JSON.generate(body), 'it_line_call'
    end

    # ---- beat 16: the audit rows and the verify-run lines ---------------------------------------------------------------------

    test 'beat 16: the verify lines match the beats and carry no password, answer or username' do
      require Rails.root.join('../../tools/playtest/lib/helpdesk_leak_rules').to_s
      3.times { ask_wrong }
      ask(TESS[0], 'password', TESS_ANSWERS)
      sign_in('records_pc', TESS[0], TESS_NEW)
      wim_reenrolled!
      game = Game.find(@game.id)
      lines = HelpdeskLeakRules.verify_rows(game.player_state, game)
      resets = lines.find { |k, _| k == 'accountResets' }.last
      tries = lines.find { |k, _| k == 'helpdeskTries' }.last
      assert_includes resets, 'tess reset password yes, reset second step no, new password typed yes'
      assert_includes resets, 'wim reset password no, reset second step yes, new password typed no'
      assert_includes tries, 'it_desk ugo count 3, stopped yes'
      text = JSON.generate(lines)
      [TESS_NEW, '40517', 'Nell Brook', TESS[0], UGO[0]].each { |s| assert_not_includes text, s }
    end

    # ---- the played run and its capture --------------------------------------------------------------------------------------

    # The whole played run, every answer recorded in the capture's shape. Each earned thing comes before the answer that needs it.
    def run_game
      build('inventory' => [SAVED_FILE])
      get_row('scenario', {}, :boot0)
      %w[front_office service_desk records].each { |room| get_row("room/#{room}") }
      # beat 1
      3.times { sign_in_row('records_pc', [TESS[0], 'wrong-password'], :tess_fail) }
      # beat 3 to 6
      get_row('keyring', {}, :keyring0)
      ask_row(TESS[0], 'password', TESS_ANSWERS, :grant_password)
      get_row('keyring', {}, :keyring1)
      sign_in_row('front_pc', SAM, :sam_first)
      post_row('login', { pc_id: 'records_pc', credential: 'tess_saved', from: 'front_pc' }, :stale)
      @marks[:stale]['login'] = { 'pcId' => 'records_pc' }
      sign_in_row('records_pc', [TESS[0], TESS[1]], :old_password)
      sign_in_row('records_pc', [TESS[0], TESS_NEW], :typed_new)
      post_row('logout', { pc_id: 'records_pc' })
      ask_row(TESS[0], 'password', TESS_ANSWERS, :grant_again)
      # beat 7
      sign_in_row('front_pc', SAM, :sam_in)
      get_row('container/front_pc', {}, :front_desktop)
      ask_row(WIM[0], 'mfa', WIM_ANSWERS, :grant_mfa_wim, pc: 'front_pc')
      # beat 8
      sign_in_row('ops_pc', WIM, :wim_required)
      post_row('mfa/prompt', { pc_id: 'ops_pc' }, :wim_prompt)
      get_row('mfa/phone', { own: 1 }, :own_phone)
      post "#{game_path('mfa/approve')}?own=1", params: { pc_id: 'ops_pc' }, as: :json
      rec(:own_approve)
      # beat 9 and 10
      ask_row(VERA[0], 'mfa', {}, :omar_refused, desk: 'id_desk')
      take_row('vera_phone', 'phone_friendface', "Vera's phone", :take_vera_phone, npc: 'vera')
      ask_row(VERA[0], 'mfa', {}, :grant_mfa_vera, desk: 'id_desk')
      # beat 11 and 12
      sign_in_row('vault_pc', VERA, :vera_required)
      get_row('mfa/device', { npc_id: 'vera' }, :own_device)
      post_row('mfa/verify', { pc_id: 'vault_pc', code: @marks[:own_device]['body']['code'] }, :vera_pass)
      get_row('mfa/device', { npc_id: 'vera' }, :own_device_used)
      take_row('vera_device', 'code_device', 'Code device', :take_old_device)
      get_row('mfa/device', { item_id: 'vera_device' }, :old_device)
      # beats 14 and 15, last on purpose: a stop on the desk stops credit for every grant for five minutes (R1-L1)
      ask_row(UGO[0], 'password', WRONG, :refused)
      ask_row('nobody.here', 'password', WRONG, :stranger)
      ask_row(UGO[0], 'password', WRONG)
      ask_row(UGO[0], 'password', WRONG, :refused_last)
      ask_row(UGO[0], 'password', WRONG, :blocked)
      # the audit rows through the lobby's reader terminal, the route a player uses (the scanner's log-row rules read them)
      get_row('log_rows', { object_id: 'audit_log_pc' }, :audit)
      get_row('scenario', {}, :boot_end)
      @log
    end

    test 'the whole played run: every answer matches a shared shape, and CAPTURE=1 writes the capture rows' do
      run_game
      assert_operator @log.length, :>, 30
      assert_answer_shape('helpdesk.refused', Reply.new(@marks[:refused]['status'], @marks[:refused]['body']))
      assert_answer_shape('helpdesk.refused', Reply.new(@marks[:stranger]['status'], @marks[:stranger]['body']))
      assert_answer_shape('helpdesk.refused_last', Reply.new(@marks[:refused_last]['status'], @marks[:refused_last]['body']))
      assert_answer_shape('helpdesk.blocked', Reply.new(@marks[:blocked]['status'], @marks[:blocked]['body']))
      assert_answer_shape('helpdesk.granted_password', Reply.new(200, @marks[:grant_password]['body']))
      assert_answer_shape('helpdesk.granted_password', Reply.new(200, @marks[:grant_again]['body']))
      assert_answer_shape('helpdesk.granted_mfa', Reply.new(200, @marks[:grant_mfa_wim]['body']))
      assert_answer_shape('helpdesk.granted_mfa', Reply.new(200, @marks[:grant_mfa_vera]['body']))
      assert_answer_shape('keyring.password_changed', Reply.new(422, @marks[:stale]['body']))
      assert_answer_shape('login.mfa_required_own_code', Reply.new(200, @marks[:vera_required]['body']))
      assert_answer_shape('prompt.waiting_own', Reply.new(200, @marks[:wim_prompt]['body']))
      assert_answer_shape('phone.own', Reply.new(200, @marks[:own_phone]['body']))
      assert_signed_in_shape('approve.own_passed', 200, @marks[:own_approve]['body'], 'wim')
      assert_answer_shape('device.own', Reply.new(200, @marks[:own_device]['body']))
      assert_signed_in_shape('verify.own_passed', 200, @marks[:vera_pass]['body'], 'vera')
      assert_answer_shape('device.own_used', Reply.new(200, @marks[:own_device_used]['body']))
      assert_answer_shape('device.unenrolled', Reply.new(200, @marks[:old_device]['body']))
      assert_equal 'own_phone', @marks[:own_approve]['body']['approvedBy']
      assert_equal TESS_NEW, @marks[:grant_password]['body']['password']
      assert_equal 'tess.reset', @marks[:keyring1]['body']['entries'].find { |e| e['id'] == 'tess.reset' }['id']
      assert_nil @marks[:keyring0]['body']['entries'].find { |e| e['id'] == 'tess.reset' }
      assert_equal 'item_id=vera_device', @marks[:old_device]['query']
      assert_equal 'npc_id=vera', @marks[:own_device]['query']
      assert_equal 'own=1', @marks[:own_phone]['query']
      assert_equal 'own=1', @marks[:own_approve]['query'], 'the approve row carries own=1 in its query, as the client sends it'
      assert_equal 200, @marks[:audit]['status']
      assert_includes @marks[:boot0]['body'].keys, 'helpdeskForms'
      assert_equal %w[desk id name type], @marks[:front_desktop]['body']['contents'].find { |i| i['id'] == 'front_form' }.keys.sort
      write_capture if ENV['CAPTURE']
      # the committed capture is this run's, row for row: same verbs, paths, queries and statuses
      committed = File.readlines(CAPTURE_PATH).map { |l| JSON.parse(l) }
      assert_equal @log.map { |r| r.values_at('method', 'path', 'query', 'status') },
                   committed.map { |r| r.values_at('method', 'path', 'query', 'status') },
                   'the committed capture is out of date: run this file with CAPTURE=1'
      assert_equal @log.map { |r| r.slice('login', 'inv') }, committed.map { |r| r.slice('login', 'inv') }
      # R2-SERVER4: and the answer bodies too, with the values that differ per game set aside
      @log.zip(committed).each_with_index do |(now, then_), i|
        assert_equal normalised_body(then_), normalised_body(now),
                     "row #{i} (#{now['method']} #{now['path']}): the answer body drifted from the committed capture; run this file with CAPTURE=1"
      end
    end

    # A row's body with the per-game values (the six-digit `code` of a code device, and the `rev` and
    # row `id` of the log rows) replaced by a marker; everything else must match
    def normalised_body(row)
      per_game = row['path'].end_with?('/mfa/device') ? %w[code] : (row['path'].end_with?('/log_rows') ? %w[rev id] : [])
      scrub = lambda do |v|
        case v
        when Hash then v.to_h { |k, x| [k, per_game.include?(k) ? '<per game>' : scrub.call(x)] }
        when Array then v.map { |x| scrub.call(x) }
        else v
        end
      end
      scrub.call(row['body'])
    end

    def write_capture
      File.write(CAPTURE_PATH, @log.map { |r| JSON.generate(r) }.join("\n") + "\n")
    end
  end
end
