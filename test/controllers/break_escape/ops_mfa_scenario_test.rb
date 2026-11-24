require 'test_helper'
require_relative '../../support/network_ops_scenario'

module BreakEscape
  # Ops S8a unit 22 (feature A22, the S8a feature scenario): the real
  # scenarios/test_ops_mfa/scenario.json.erb driven through the routes, one test per PLAYTEST.md
  # beat, each assertion read from a re-read game or a fresh answer. Time is frozen, so a code is
  # read from the held device's route (as the browser does) and the one wait of beat 4 is a
  # travel_to. The browser half (panes, buttons, scenes) is PLAYTEST.md's.
  class OpsMfaScenarioTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests

    SCENARIO_PATH = File.expand_path('../../../scenarios/test_ops_mfa/scenario.json.erb', __dir__)
    T0 = Time.zone.at(1_800_000_000)
    OFFICE = 'jack_office_port'.freeze
    LOG = 'mfa_audit'.freeze
    HANA = ['hquill', 'Quillmere-Hana-31'].freeze
    INES = ['ibrandt', 'Brandwick-Ines-44'].freeze
    SYNC = ['svc_sync', 'Tidewater-Sync-90'].freeze
    CAL = ['cmoss', 'Mossbank-Cal-12'].freeze
    DEV = ['dkapoor', 'Kaporwell-Dev-77'].freeze
    NIA = ['nfaraday', 'Faradale-Nia-58'].freeze
    NPCS = { 'floor' => %w[hana ines svc_sync], 'store' => %w[cal dev nia] }.freeze

    def scenario
      JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
    end

    def build(player_state = {})
      build_network_game({ 'unlockedRooms' => %w[lobby floor store], 'currentRoom' => 'lobby',
                           'encounteredNPCs' => %w[hana ines svc_sync cal dev nia] }.merge(player_state), scenario)
    end

    setup do
      travel_to T0
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

    def take(id, type, name, npc: nil)
      params = { action_type: 'add', item: { type: type, id: id, name: name } }
      params[:source_npc_id] = npc if npc
      post game_path('inventory'), params: params, as: :json
      response
    end

    def knock_out(npc_id, room)
      post game_path('update_room'), params: { roomId: room, actionType: 'update_npc_state',
                                               data: { npcId: npc_id, stateChanges: { isKO: true, currentHP: 0 } } }, as: :json
      assert_response :success
    end

    def hold_hana_device
      take('hana_device', 'code_device', 'Code device', npc: 'hana')
      assert_response :success, response.body
    end

    def hold_dev_phone
      take('dev_phone', 'phone_friendface', "Dev's phone", npc: 'dev')
      assert_response :success, response.body
    end

    def device_code(id = 'hana_device')
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

    def wrong_for(right)
      right == '000000' ? '000001' : '000000'
    end

    def hold_foothold
      take_drop_box
      plant('office_port')
      assert_response :success, response.body
    end

    # ---- the scenario's shape -----------------------------------------------------------------

    test 'the real scenario holds the policies, the accounts and the devices the beats need' do
      data = scenario
      assert_equal %w[code none push push_number_match].sort,
                   data['policies'].values.map { |p| p['mfa'] || 'none' }.sort
      assert_equal [8, 8, 5, 8], data['policies'].values_at('code_gate', 'push_gate', 'plain_gate', 'match_gate').map { |p| p['maxAttempts'] }
      npcs = data['rooms'].values.flat_map { |r| Array(r['npcs']) }
      assert_equal %w[cal dev hana ines nia svc_sync], npcs.map { |n| n['id'] }.sort
      assert_equal %w[svc_sync], npcs.select { |n| n.dig('creds', 'mfa') == false }.map { |n| n['id'] }
      assert_equal %w[low high medium], %w[cal dev nia].map { |id| npcs.find { |n| n['id'] == id }['awareness'] }
      assert_nil((npcs.find { |n| n['id'] == 'cal' }['itemsHeld']))
      assert_equal %w[hana_saved hana_token], data['credentials'].keys.sort
      assert_equal 'mfa_audit', data['rooms']['lobby']['objects'].find { |o| o['id'] == 'audit_log_pc' }.dig('minigameData', 'logSource')
      assert_empty(data['rooms'].values.flat_map { |r| r['objects'].map { |o| o['id'] } }.grep(/desk/))
    end

    # ---- beat 1 and 2: password, then the pane; no device, no button ----------------------------

    test 'beat 1 and 2: a right password opens no session; a wrong code is counted and shows the tries left' do
      body = sign_in('code_pc1', *HANA)
      assert_equal true, body['mfaRequired']
      assert_equal 'code', body['mfa']
      assert_equal 'hana', body['npcId']
      assert_nil state['sessions']['code_pc1']
      assert_equal 1, count('mfa_challenge')
      get game_path('mfa/device'), params: { item_id: 'hana_device' }, as: :json
      assert_response :forbidden
      body = verify('code_pc1', '123456')
      assert_response :unprocessable_entity
      assert_equal true, body['mfaIncorrect']
      assert_operator body['attemptsLeft'], :>=, 1
      assert_equal 1, count('mfa_code_wrong')
      assert_nil state['sessions']['code_pc1']
    end

    # ---- beat 3: handed the device -----------------------------------------------------------

    test 'beat 3: the owner hands over the device; the right code signs in; session via password, nothing pending, used set' do
      sign_in('code_pc1', *HANA)
      hold_hana_device
      assert_equal 'hana', Game.find(@game.id).player_state['inventory'].find { |i| (i['scenarioData'] || i)['id'] == 'hana_device' }.then { |i| (i['scenarioData'] || i)['owner'] }
      body = verify('code_pc1', device_code)
      assert_equal 'no-store', response.headers['Cache-Control']
      assert_response :success, response.body
      assert body['success']
      assert_equal({ 'id' => 'hana', 'via' => 'password' }, state['sessions']['code_pc1'])
      assert_nil state['mfaPending']['code_pc1']
      assert_equal Time.current.to_i / MfaModel::STEP_SECONDS, state['mfaAccounts']['hana']['used']
      assert_equal %w[mfa_challenge mfa_code_ok], rows.map { |r| r['event'] }.grep(/mfa_/)
      assert_equal 1, count('signin_ok')
    end

    # ---- beat 4: one code, one use --------------------------------------------------------------

    test 'beat 4: the same code at a second PC is used and moves no counter; the next window accepts the fresh one' do
      hold_hana_device
      sign_in('code_pc1', *HANA)
      first = device_code
      verify('code_pc1', first)
      assert_response :success
      sign_in('code_pc2', *HANA)
      before = [state['loginFailures'], state['mfaAccounts']['hana']['wrong'], state['mfaPending']['code_pc2']['tries']]
      body = verify('code_pc2', first)
      assert_response :unprocessable_entity
      assert_equal 'used', body['stale']
      assert_equal before, [state['loginFailures'], state['mfaAccounts']['hana']['wrong'], state['mfaPending']['code_pc2']['tries']]
      get game_path('mfa/device'), params: { item_id: 'hana_device' }, as: :json
      assert_equal true, response.parsed_body['used'], 'the device greys a used code'
      later(response.parsed_body['secondsLeft'].to_i + 1)
      fresh = device_code
      assert_not_equal first, fresh
      body = verify('code_pc2', fresh)
      assert_response :success, response.body
      assert body['success']
      assert_equal 'hana', state['sessions']['code_pc2']['id']
    end

    # ---- beat 5: drop it -----------------------------------------------------------------------

    test 'beat 5: a dropped device shows nothing; picked up again it does' do
      hold_hana_device
      assert_equal 200, (get game_path('mfa/device'), params: { item_id: 'hana_device' }, as: :json).then { response.status }
      post game_path('update_room'), params: { roomId: 'lobby', actionType: 'add_object', sourceType: 'player_drop',
                                               data: { type: 'code_device', id: 'hana_device', x: 64, y: 64 } }, as: :json
      assert_response :success, response.body
      post game_path('inventory'), params: { action_type: 'remove', item: { id: 'hana_device' } }, as: :json
      get game_path('mfa/device'), params: { item_id: 'hana_device' }, as: :json
      assert_response :forbidden
      take('hana_device', 'code_device', 'Code device')
      assert_response :success, response.body
      get game_path('mfa/device'), params: { item_id: 'hana_device' }, as: :json
      assert_response :success
    end

    # ---- beat 6: the loose device and the exempt account -------------------------------------------

    test 'beat 6: the loose device opens Ines at her PC with no meeting; the service account signs in at once' do
      take('ines_device', 'code_device', 'Code device')
      assert_response :success, response.body
      assert_equal 'ines', sign_in('code_pc2', *INES)['npcId']
      body = verify('code_pc2', device_code('ines_device'))
      assert body['success'], body.to_s
      assert_equal 'ines', state['sessions']['code_pc2']['id']
      body = sign_in('code_pc2', *SYNC)
      assert body['success'], body.to_s
      assert_nil body['mfaRequired']
      assert_equal 'svc_sync', state['sessions']['code_pc2']['id']
      assert_nil state['mfaPending']['code_pc2']
    end

    # ---- beat 7: unlock needs no device ------------------------------------------------------------

    test 'beat 7: a locked own session unlocks with the password alone, with the device dropped' do
      hold_hana_device
      sign_in('code_pc1', *HANA)
      verify('code_pc1', device_code)
      post game_path('lock_session'), params: { pc_id: 'code_pc1' }, as: :json
      assert_response :success
      assert_equal true, state['sessions']['code_pc1']['locked']
      post game_path('inventory'), params: { action_type: 'remove', item: { id: 'hana_device' } }, as: :json
      body = sign_in('code_pc1', *HANA)
      assert body['success'], body.to_s
      assert_nil body['mfaRequired']
      assert_nil state['sessions']['code_pc1']['locked']
      assert_nil state['mfaPending']['code_pc1']
    end

    # ---- beat 8: the route is re-judged -------------------------------------------------------------

    test 'beat 8: a sign-in over the foothold that is unplugged before the code is refused as out of reach' do
      hold_hana_device
      hold_foothold
      body = sign_in('code_pc1', *HANA, foothold: OFFICE)
      assert_equal true, body['mfaRequired']
      code = device_code
      unplug('office_port')
      body = verify('code_pc1', code)
      assert_response :forbidden
      assert_equal 'PC not reachable', body['message']
      assert_nil state['sessions']['code_pc1']
    end

    # ---- beat 9: token and saved connection ------------------------------------------------------------

    test 'beat 9: the token signs in at once; the saved connection is told to type the password, and that reaches the pane' do
      hold_foothold
      post game_path('login'), params: { pc_id: 'code_pc1', credential: 'hana_token', foothold: OFFICE }, as: :json
      assert_response :success, response.body
      assert response.parsed_body['success']
      assert_equal 'hana', state['sessions']['code_pc1']['id']
      post game_path('logout'), params: { pc_id: 'code_pc1' }, as: :json
      unlock_object('lobby_cabinet', 'unlocked')
      assert_response :success, response.body
      take('hana_saved_file', 'text_file', 'Accounts PC.rdp')
      assert_response :success, response.body
      post game_path('login'), params: { pc_id: 'code_pc1', credential: 'hana_saved', foothold: OFFICE }, as: :json
      assert_response :unprocessable_entity
      assert_equal({ 'success' => false, 'typeToSignIn' => 'second_step' }, response.parsed_body)
      assert_nil state['sessions']['code_pc1']
      assert_nil((state['mfaPending'] || {})['code_pc1'])
      assert_equal true, sign_in('code_pc1', *HANA, foothold: OFFICE)['mfaRequired']
    end

    # ---- beat 10: pestering --------------------------------------------------------------------------

    test 'beat 10: the low-awareness owner approves the third request; the count survives a reload and returns to 0' do
      assert_equal 'push', sign_in('push_pc', *CAL)['mfa']
      assert_equal false, prompt('push_pc')['approved']
      later(3)
      assert_equal false, prompt('push_pc')['approved']
      # the page is reloaded here: the pending step is on the server, a new password restarts it, the count stays
      assert_equal 2, state['mfaPrompts']['cal']
      assert_equal 'push', sign_in('push_pc', *CAL)['mfa']
      assert_equal 2, state['mfaPrompts']['cal']
      later(3)
      body = prompt('push_pc')
      assert_response :success, response.body
      assert body['success']
      assert_equal 'owner', body['approvedBy']
      assert_equal 0, state['mfaPrompts']['cal']
      assert_equal 3, count('mfa_prompt_sent')
      assert_equal 'owner', rows('mfa_prompt_approved').last['detail']['approver']
    end

    # ---- beat 11: a careful owner -----------------------------------------------------------------------

    test 'beat 11: the high-awareness owner is never approved; the attempt ends at the cap' do
      sign_in('push_pc', *DEV)
      MfaModel::MAX_PROMPTS.times do
        assert_equal false, prompt('push_pc')['approved']
        later(3)
      end
      body = prompt('push_pc')
      assert_response :unprocessable_entity
      assert_equal true, body['expired']
      assert_nil state['sessions']['push_pc']
      assert_equal 1, count('mfa_expired')
    end

    # ---- beat 12: his phone ----------------------------------------------------------------------------------

    test 'beat 12: with the owner\'s phone from his story, Approve signs in; approver held_phone' do
      hold_dev_phone
      sign_in('push_pc', *DEV)
      get game_path('mfa/phone'), params: { npc_id: 'dev' }, as: :json
      assert_response :success
      assert_equal 'push_pc', response.parsed_body['requests'].first['pcId']
      body = approve('push_pc')
      assert_response :success, response.body
      assert body['success']
      assert_equal 'player', body['approvedBy']
      assert_equal 'dev', state['sessions']['push_pc']['id']
      assert_equal 'held_phone', rows('mfa_prompt_approved').last['detail']['approver']
    end

    # ---- beat 13: X is not cancel ------------------------------------------------------------------------------

    test 'beat 13: opening and closing the device or the phone is reads only; the pending step is still live and no failure is written' do
      hold_hana_device
      hold_dev_phone
      sign_in('code_pc1', *HANA)
      sign_in('push_pc', *DEV)
      before = rows.size
      device_code
      get game_path('mfa/phone'), params: { npc_id: 'dev' }, as: :json
      assert_response :success
      assert state['mfaPending']['code_pc1']
      assert state['mfaPending']['push_pc']
      assert_equal before, rows.size
      assert_equal 0, count('mfa_expired') + count('mfa_prompt_denied')
    end

    # ---- beat 14 and 15: number matching ---------------------------------------------------------------------------

    test 'beat 14: with the owner holding the phone a number-matching sign-in is never approved' do
      body = sign_in('match_pc', *NIA)
      assert_equal 'push_number_match', body['mfa']
      assert_kind_of Integer, body['number']
      5.times do
        assert_equal false, prompt('match_pc')['approved']
        later(3)
      end
      assert_nil state['sessions']['match_pc']
      assert_equal 0, count('mfa_prompt_approved')
    end

    test 'beat 15: with the phone after a knock-out, a wrong number cancels and the shown number signs in' do
      take('nia_phone', 'phone_friendface', "Nia's phone", npc: 'nia')
      assert_response :unprocessable_entity, 'the phone stays with its owner until a knock-out'
      knock_out('nia', 'store')
      take('nia_phone', 'phone_friendface', "Nia's phone", npc: 'nia')
      assert_response :success, response.body
      right = sign_in('match_pc', *NIA)['number']
      get game_path('mfa/phone'), params: { npc_id: 'nia' }, as: :json
      assert_response :success
      choices = response.parsed_body['requests'].first['numbers']
      assert_equal 3, choices.size
      assert_includes choices, right
      wrong = (choices - [right]).first
      body = approve('match_pc', number: wrong)
      assert_response :unprocessable_entity
      assert_equal true, body['cancelled']
      assert_nil state['mfaPending']['match_pc']
      assert_equal 1, count('mfa_prompt_denied')
      sign_in('match_pc', *NIA)
      right = Game.find(@game.id).player_state['mfaPending']['match_pc'] && response.parsed_body['number']
      body = approve('match_pc', number: right)
      assert_response :success, response.body
      assert body['success']
      assert_equal 'nia', state['sessions']['match_pc']['id']
    end

    # ---- the PC with no second step -------------------------------------------------------------------------------

    test 'the PC with maxAttempts and no second step signs in on a right password and locks on wrong ones' do
      body = sign_in('plain_pc', *CAL)
      assert body['success'], body.to_s
      assert_nil body['mfaRequired']
      5.times { sign_in('plain_pc', 'cmoss', 'wrong-password') }
      assert_equal true, sign_in('plain_pc', 'cmoss', 'wrong-password')['lockedOut']
      assert_equal 0, count('mfa_challenge')
    end

    # ---- the log reader ------------------------------------------------------------------------------------------------

    test 'the audit terminal reads rows the beats wrote, and none holds a code or a number' do
      hold_hana_device
      sign_in('code_pc1', *HANA)
      code = device_code
      verify('code_pc1', code)
      assert_operator rows.size, :>=, 3
      assert_not_includes rows.to_json, code
      get game_path('scenario'), as: :json
      assert_response :success
    end
  end
end
