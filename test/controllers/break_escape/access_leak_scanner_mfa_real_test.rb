require 'test_helper'
require_relative '../../support/network_ops_scenario'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops S8a unit 23 (feature A22, the leak scanner's second-step rules): the scanner run over REAL answers of a game of
  # scenarios/test_ops_mfa, recorded as the browser's capture holds them (method, path, query, status, body, and the
  # `inv` tag of a POST /inventory row and a `login` tag naming the PC of a sign-in). The whole run must report nothing;
  # then one fault at a time is made in a copy of one answer, or one earlier step is left out, and must be reported.
  # The earned cases (the device's own code from a taken device, the choices from a taken phone, the one right number in
  # the number-matching sign-in answer, a session after a passed step, an exempt way in) are allowed, and each near miss
  # (another account's device, a code on the wrong route, a number in a sign-in answer, a forged-looking body, the wrong
  # HTTP status) is still a finding.
  class AccessLeakScannerMfaRealTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests

    SCENARIO_PATH = File.expand_path('../../../scenarios/test_ops_mfa/scenario.json.erb', __dir__)
    T0 = Time.zone.at(1_800_000_000)
    OFFICE = 'jack_office_port'.freeze
    HANA = ['hquill', 'Quillmere-Hana-31'].freeze
    INES = ['ibrandt', 'Brandwick-Ines-44'].freeze
    SYNC = ['svc_sync', 'Tidewater-Sync-90'].freeze
    CAL = ['cmoss', 'Mossbank-Cal-12'].freeze
    NIA = ['nfaraday', 'Faradale-Nia-58'].freeze

    def scenario
      JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
    end

    setup do
      travel_to T0
      @log = []
      @marks = {}
    end

    teardown do
      travel_back
      OpsLog::Current.reset
    end

    # One recorded answer, in the browser capture's shape.
    def rec(mark = nil, extra = {})
      row = { 't' => (Time.utc(2026, 1, 1) + @log.length).iso8601(3), 'method' => request.request_method,
              'path' => request.path, 'status' => response.status, 'body' => response.parsed_body }
      row['query'] = request.query_string unless request.query_string.to_s.empty?
      @log << row.merge(extra)
      @marks[mark] = @log.last if mark
      @log.last
    end

    def sign_in_row(pc, creds, mark, foothold: nil)
      sign_in(pc, *creds, foothold: foothold)
      rec(mark, 'login' => { 'pcId' => pc })
    end

    def take_row(id, type, name, mark, npc: nil)
      params = { action_type: 'add', item: { type: type, id: id, name: name } }
      params[:source_npc_id] = npc if npc
      post game_path('inventory'), params: params, as: :json
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

    def later(seconds)
      travel_to Time.zone.at(Time.current.to_i + seconds)
    end

    # The played run: every second-step route, with each thing taken before its answer.
    def run_game
      build_network_game({ 'unlockedRooms' => %w[lobby floor store], 'currentRoom' => 'lobby',
                           'encounteredNPCs' => %w[hana ines svc_sync cal dev nia] }, scenario)
      get_row('scenario', {}, :boot0)
      %w[lobby floor store].each { |room| get_row("room/#{room}", {}, nil) }
      # the code kind: a password, the device, a wrong code, the right code, a lock and the unlock with the password alone
      sign_in_row('code_pc1', HANA, :hana_required)
      take_row('hana_device', 'code_device', 'Code device', :take_device, npc: 'hana')
      get_row('mfa/device', { item_id: 'hana_device' }, :device)
      post_row('mfa/verify', { pc_id: 'code_pc1', code: '000000' }, :wrong_code)
      right = @marks[:device]['body']['code']
      post_row('mfa/verify', { pc_id: 'code_pc1', code: right }, :pass_code)
      get_row('scenario', {}, :boot_signed)
      post_row('lock_session', { pc_id: 'code_pc1' }, :lock)
      sign_in_row('code_pc1', HANA, :unlock)
      post_row('logout', { pc_id: 'code_pc1' }, nil)
      # a token way in is outside the step
      take_row('kit_dropbox', 'pc', 'Network drop box', nil)
      post_row('network/plant', { jack_id: 'office_port' }, nil)
      post_row('login', { pc_id: 'code_pc1', credential: 'hana_token', foothold: OFFICE }, :token)
      @marks[:token]['login'] = { 'pcId' => 'code_pc1' }
      # push: the owner approves the third request
      sign_in_row('push_pc', CAL, :cal_required)
      post_row('mfa/prompt', { pc_id: 'push_pc' }, :prompt1)
      later(3)
      post_row('mfa/prompt', { pc_id: 'push_pc' }, :prompt2)
      later(3)
      post_row('mfa/prompt', { pc_id: 'push_pc' }, :cal_pass)
      # number matching: the phone after a knock-out, the choices, a wrong number, the shown number
      sign_in_row('match_pc', NIA, :nia_required)
      post game_path('update_room'), params: { roomId: 'store', actionType: 'update_npc_state',
                                               data: { npcId: 'nia', stateChanges: { isKO: true, currentHP: 0 } } }, as: :json
      take_row('nia_phone', 'phone_friendface', "Nia's phone", :take_phone, npc: 'nia')
      get_row('mfa/phone', { npc_id: 'nia' }, :phone)
      choices = @marks[:phone]['body']['requests'].first['numbers']
      right = @marks[:nia_required]['body']['number']
      post_row('mfa/approve', { pc_id: 'match_pc', number: (choices - [right]).first }, :cancel)
      sign_in_row('match_pc', NIA, :nia_required2)
      post_row('mfa/approve', { pc_id: 'match_pc', number: @marks[:nia_required2]['body']['number'] }, :nia_pass)
      # a loose device, an account with no step, and a PC with none
      take_row('ines_device', 'code_device', 'Code device', :take_ines)
      sign_in_row('code_pc2', INES, :ines_required)
      get_row('mfa/device', { item_id: 'ines_device' }, :ines_device)
      post_row('mfa/verify', { pc_id: 'code_pc2', code: @marks[:ines_device]['body']['code'] }, :ines_pass)
      sign_in_row('code_pc2', SYNC, :sync_signin)
      sign_in_row('plain_pc', CAL, :plain_signin)
      get_row('scenario', {}, :boot_end)
      @log
    end

    def scan(rows)
      AccessLeakScanner.new(scenario).scan(rows.each_with_index.map { |r, i| ['run.jsonl', i + 1, r] })
    end

    def mfa(findings)
      findings.select { |f| f.rule.start_with?('mfa_') }.map { |f| [f.rule, f.owner] }.uniq.sort
    end

    def deep(row)
      Marshal.load(Marshal.dump(row))
    end

    # The whole log with the row `mark` replaced by what the block makes of a copy of it.
    def doctored(mark)
      index = @log.index { |r| r.equal?(@marks[mark]) }
      rows = @log.map { |r| deep(r) }
      yield rows[index]
      rows
    end

    # The log without the rows `marks` (a step left out).
    def without(*marks)
      @log.reject { |r| marks.any? { |m| r.equal?(@marks[m]) } }.map { |r| deep(r) }
    end

    def assert_found(expected, rows)
      assert_includes mfa(scan(rows)), expected
    end

    def assert_only(expected, rows)
      assert_equal [expected], mfa(scan(rows))
    end

    # ---- the real run -------------------------------------------------------------------------------------------------

    test 'the whole played run reports nothing, and the run holds every earned case' do
      run_game
      assert_operator @log.length, :>, 25
      assert_equal [], scan(@log).map { |f| [f.line, f.rule, f.owner, f.route] }
      assert_match(/\A\d{6}\z/, @marks[:device]['body']['code'])
      assert_equal 'item_id=hana_device', @marks[:device]['query']
      assert_equal 3, @marks[:phone]['body']['requests'].first['numbers'].size
      assert_kind_of Integer, @marks[:nia_required]['body']['number']
      assert_equal 'owner', @marks[:cal_pass]['body']['approvedBy']
      assert_equal 'player', @marks[:nia_pass]['body']['approvedBy']
      assert_equal 'token', @marks[:token]['body']['kind']
      assert_equal 'hana', @marks[:boot_signed]['body']['sessions']['code_pc1']['npcId']
      assert_equal 422, @marks[:cancel]['status']
    end

    test 'a scenario with no second step and no mfa key is judged as before' do
      scanner = AccessLeakScanner.new(JSON.parse(ScenarioBinding.render(File.read(File.expand_path('../../../scenarios/test_ops_privilege/scenario.json.erb', __dir__)))))
      body = { 'success' => true, 'npcId' => 'uma', 'via' => 'password', 'host' => 'nowhere' }
      row = { 'method' => 'POST', 'path' => '/break_escape/games/1/login', 'status' => 200, 'body' => body }
      assert_equal [], scanner.scan([['x.jsonl', 1, row]]).select { |f| f.rule.start_with?('mfa_') }
    end

    # ---- the keys that are a finding wherever they appear -------------------------------------------------------

    test 'the habit and state keys, and mfa inside creds, are reported anywhere' do
      run_game
      %w[approvesPrompts promptPatience mfaPending mfaAccounts mfaPrompts].each do |key|
        assert_found ['mfa_secret', "mfa:key:#{key}"], doctored(:boot0) { |r| r['body']['npcs'] = [{ 'id' => 'x', key => 3 }] }
        assert_found ['mfa_secret', "mfa:key:#{key}"], doctored(:hana_required) { |r| r['body'][key] = {} }
        assert_found ['mfa_secret', "mfa:key:#{key}"], doctored(:device) { |r| r['body'][key] = 1 }
      end
      assert_found ['mfa_secret', 'mfa:key:creds.mfa'], doctored(:boot0) { |r| r['body']['creds'] = { 'mfa' => false } }
      assert_found ['mfa_secret', 'mfa:key:creds.mfa'], doctored(:boot0) { |r| r['body']['npcs'] = [{ 'id' => 'svc_sync', 'creds' => { 'mfa' => false } }] }
      # the policies' own `mfa` and a sign-in answer's `mfa` are sent on purpose
      assert_equal [], mfa(scan(@log))
    end

    # ---- the code ------------------------------------------------------------------------------------------------------

    test 'a code is allowed only in the device answer of a taken device, in the shape the controller sends' do
      run_game
      assert_equal [], mfa(scan(@log))
      # anywhere else
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:boot0) { |r| r['body']['code'] = '123456' }
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:hana_required) { |r| r['body']['code'] = '123456' }
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:wrong_code) { |r| r['body']['code'] = '123456' }
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:pass_code) { |r| r['body']['code'] = '123456' }
      # nested inside the device answer
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:device) { |r| r['body'] = { 'x' => r['body'] } }
    end

    test 'a device answer on the wrong route, with the wrong status, wrong query or wrong shape is reported' do
      run_game
      # a device answer on another route (the verify route, the sign-in route, a POST)
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:wrong_code) { |r| r['body'] = deep(@marks[:device]['body']) }
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:hana_required) { |r| r['body'] = deep(@marks[:device]['body']) }
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:device) { |r| r['method'] = 'POST' }
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:device) { |r| r['path'] = r['path'].sub('/mfa/device', '/mfa/devices') }
      # the wrong HTTP status
      [201, 202, 403, 404, 422].each do |status|
        assert_found ['mfa_secret', 'mfa:key:code'], doctored(:device) { |r| r['status'] = status }
      end
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:device) { |r| r['status'] = '200' }
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:device) { |r| r.delete('status') }
      # a forged-looking body: an extra key, a missing key, a short code, a non-digit code, a number, a bad timer, a bad flag
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:device) { |r| r['body']['extra'] = 1 }
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:device) { |r| r['body'].delete('used') }
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:device) { |r| r['body']['code'] = '12345' }
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:device) { |r| r['body']['code'] = '1234567' }
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:device) { |r| r['body']['code'] = '12345a' }
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:device) { |r| r['body']['code'] = 123_456 }
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:device) { |r| r['body']['secondsLeft'] = 0 }
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:device) { |r| r['body']['secondsLeft'] = 61 }
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:device) { |r| r['body']['secondsLeft'] = '30' }
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:device) { |r| r['body']['used'] = 'no' }
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:device) { |r| r['body']['displayName'] = 'Someone else' }
      # the body names another device or owner than the one asked for
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:device) { |r| r['body']['deviceId'] = 'ines_device' }
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:device) { |r| r['body']['npcId'] = 'ines' }
      # the query: another item, two parameters, none, an array
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:device) { |r| r['query'] = 'item_id=ines_device' }
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:device) { |r| r['query'] = 'item_id=hana_device&item_id=hana_device' }
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:device) { |r| r['query'] = 'item_id=hana_device&own=1' }
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:device) { |r| r.delete('query') }
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:device) { |r| r['query'] = 'item_id%5B%5D=hana_device' }
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:device) { |r| r['query'] = 'item_id=%ZZ' }
      # not a body at all
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:device) { |r| r['body'] = [deep(r['body'])] }
    end

    test 'a device never taken in the run, or taken by another account, earns nothing' do
      run_game
      # the add answer left out (or not tagged, or refused, or another item's)
      assert_found ['mfa_secret', 'mfa:key:code'], without(:take_device)
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:take_device) { |r| r.delete('inv') }
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:take_device) { |r| r['inv'] = nil }
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:take_device) { |r| r['status'] = 422 }
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:take_device) { |r| r['body'] = { 'success' => false } }
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:take_device) { |r| r['inv']['action'] = 'remove' }
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:take_device) { |r| r['inv']['itemId'] = 'ines_device' }
      # the add answer comes AFTER the device answer
      rows = @log.map { |r| deep(r) }
      add = rows.delete_at(@log.index { |r| r.equal?(@marks[:take_device]) })
      rows.insert(rows.index { |r| r['query'] == 'item_id=hana_device' } + 1, add)
      assert_found ['mfa_secret', 'mfa:key:code'], rows
      # one account's device earned and another's answer: Ines's device answer asked for under Hana's id, and Hana's body under Ines's
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:ines_device) { |r| r['query'] = 'item_id=hana_device' }
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:ines_device) { |r| r['body'] = deep(@marks[:device]['body']) }
      assert_found ['mfa_secret', 'mfa:key:code'], doctored(:device) { |r| r['body'] = deep(@marks[:ines_device]['body']) }
    end

    # ---- the choices and the number ---------------------------------------------------------------------------------------

    test 'the number choices are allowed only for a taken phone, in the shape the controller sends' do
      run_game
      assert_equal [], mfa(scan(@log))
      numbers = ['mfa_secret', 'mfa:key:numbers']
      # in a sign-in answer, a prompt answer, the bootstrap, the device answer
      assert_found numbers, doctored(:nia_required) { |r| r['body']['numbers'] = [11, 22, 33] }
      assert_found numbers, doctored(:hana_required) { |r| r['body']['numbers'] = [11, 22, 33] }
      assert_found numbers, doctored(:cal_pass) { |r| r['body']['numbers'] = [11, 22, 33] }
      assert_found numbers, doctored(:boot0) { |r| r['body']['numbers'] = [11, 22, 33] }
      assert_found numbers, doctored(:device) { |r| r['body']['numbers'] = [11, 22, 33] }
      # the phone answer on another route
      assert_found numbers, doctored(:device) { |r| r['body'] = deep(@marks[:phone]['body']) }
      assert_found numbers, doctored(:nia_required) { |r| r['body'] = deep(@marks[:phone]['body']) }
      assert_found numbers, doctored(:phone) { |r| r['method'] = 'POST' }
      assert_found numbers, doctored(:phone) { |r| r['path'] = r['path'].sub('/mfa/phone', '/mfa/phones') }
      # the wrong status
      [201, 202, 403, 422].each { |status| assert_found numbers, doctored(:phone) { |r| r['status'] = status } }
      # the phone never taken, or another owner's phone taken (Dev's phone was not), or the add refused
      assert_found numbers, without(:take_phone)
      assert_found numbers, doctored(:take_phone) { |r| r['status'] = 422 }
      assert_found numbers, doctored(:take_phone) { |r| r['inv']['itemId'] = 'dev_phone' }
      assert_found numbers, doctored(:phone) { |r| r['query'] = 'npc_id=dev' }
      assert_found numbers, doctored(:phone) { |r| r['query'] = 'npc_id=nia&own=1' }
      assert_found numbers, doctored(:phone) { |r| r.delete('query') }
      # asked as another owner whose phone WAS taken is not possible here: the body names Nia's account and PC
      assert_found numbers, doctored(:phone) { |r| r['query'] = 'npc_id=cal' }
      # the step it answers for was never opened in the run
      assert_found numbers, without(:nia_required, :cancel, :nia_required2, :nia_pass)
      # a forged-looking body
      assert_found numbers, doctored(:phone) { |r| r['body']['requests'].first['numbers'] = [11, 22] }
      assert_found numbers, doctored(:phone) { |r| r['body']['requests'].first['numbers'] = [11, 11, 22] }
      assert_found numbers, doctored(:phone) { |r| r['body']['requests'].first['numbers'] = [11, 22, 100] }
      assert_found numbers, doctored(:phone) { |r| r['body']['requests'].first['numbers'] = [9, 22, 33] }
      assert_found numbers, doctored(:phone) { |r| r['body']['requests'].first['numbers'] = %w[11 22 33] }
      assert_found numbers, doctored(:phone) { |r| r['body']['requests'].first['numbers'] = [11.0, 22, 33] }
      assert_found numbers, doctored(:phone) { |r| r['body']['requests'].first['numbers'] = { 'a' => 1 } }
      assert_found numbers, doctored(:phone) { |r| r['body']['requests'].first['extra'] = 1 }
      assert_found numbers, doctored(:phone) { |r| r['body']['requests'].first['username'] = 'hquill' }
      assert_found numbers, doctored(:phone) { |r| r['body']['requests'].first['host'] = 'ELSEWHERE' }
      assert_found numbers, doctored(:phone) { |r| r['body']['requests'].first['pcId'] = 'push_pc' }
      assert_found numbers, doctored(:phone) { |r| r['body']['requests'].first['pcId'] = 'nope' }
      assert_found numbers, doctored(:phone) { |r| r['body']['requests'].first['n'] = -1 }
      assert_found numbers, doctored(:phone) { |r| r['body']['requests'].first['n'] = 'x' }
      assert_found numbers, doctored(:phone) { |r| r['body']['extra'] = 1 }
      assert_found numbers, doctored(:phone) { |r| r['body']['requests'] << { 'pcId' => 'push_pc', 'host' => 'ORD01', 'username' => 'cmoss', 'n' => 1, 'numbers' => [11, 22, 33] } }
      assert_found numbers, doctored(:phone) { |r| r['body']['requests'] = { 'x' => r['body']['requests'] } }
      # a second copy of the choices nested elsewhere in the same answer
      assert_found numbers, doctored(:phone) { |r| r['body']['more'] = { 'numbers' => [11, 22, 33] } }
    end

    test 'the one right number is allowed only in the number-matching sign-in answer' do
      run_game
      number = ['mfa_secret', 'mfa:key:number']
      assert_kind_of Integer, @marks[:nia_required]['body']['number']
      # a push or code sign-in answer, a prompt answer, a phone answer, a wrong HTTP status, a wrong route
      assert_found number, doctored(:cal_required) { |r| r['body']['number'] = 42 }
      assert_found number, doctored(:hana_required) { |r| r['body']['number'] = 42 }
      assert_found number, doctored(:prompt1) { |r| r['body']['number'] = 42 }
      assert_found number, doctored(:phone) { |r| r['body']['number'] = 42 }
      assert_found number, doctored(:nia_pass) { |r| r['body']['number'] = 42 }
      assert_found number, doctored(:nia_required) { |r| r['body'] = { 'x' => r['body'] } }
      assert_found number, doctored(:nia_required) { |r| r['status'] = 422 }
      assert_found number, doctored(:nia_required) { |r| r['method'] = 'GET' }
      assert_found number, doctored(:nia_required) { |r| r['path'] = r['path'].sub('/login', '/mfa/prompt') }
      # a forged-looking number answer
      assert_found number, doctored(:nia_required) { |r| r['body']['number'] = 9 }
      assert_found number, doctored(:nia_required) { |r| r['body']['number'] = 100 }
      assert_found number, doctored(:nia_required) { |r| r['body']['number'] = '42' }
      assert_found number, doctored(:nia_required) { |r| r['body']['number'] = nil }
      assert_found number, doctored(:nia_required) { |r| r['body']['numbers'] = [11, 22, 33] }
      assert_found number, doctored(:nia_required) { |r| r['body']['success'] = true }
      assert_found number, doctored(:nia_required) { |r| r['body']['mfa'] = 'push' }
      assert_found number, doctored(:nia_required) { |r| r['body']['pcId'] = 'push_pc' }
      assert_found number, doctored(:nia_required) { |r| r['body']['npcId'] = 'cal' }
      assert_found number, doctored(:nia_required) { |r| r['body']['code'] = '123456' }
      assert_found number, doctored(:nia_required) { |r| r.delete('status') }
      # a sign-in answer that says a step is owed at a PC and account that owe none
      assert_found ['mfa_secret', 'mfa:answer:mfaRequired'], doctored(:cal_required) { |r| r['body']['pcId'] = 'plain_pc' }
      assert_found ['mfa_secret', 'mfa:answer:mfaRequired'], doctored(:cal_required) { |r| r['body']['extra'] = 1 }
      assert_found ['mfa_secret', 'mfa:answer:mfaRequired'], doctored(:cal_required) { |r| r['body']['mfa'] = 'code' }
      assert_found ['mfa_secret', 'mfa:answer:mfaRequired'], doctored(:boot0) { |r| r['body']['mfaRequired'] = true }
      assert_found ['mfa_secret', 'mfa:answer:mfaRequired'], doctored(:plain_signin) { |r| r['body'] = { 'success' => false, 'mfaRequired' => true, 'mfa' => 'push', 'pcId' => 'plain_pc', 'npcId' => 'cal' } }
      assert_found ['mfa_secret', 'mfa:answer:mfaRequired'], doctored(:sync_signin) { |r| r['body'] = { 'success' => false, 'mfaRequired' => true, 'mfa' => 'code', 'pcId' => 'code_pc2', 'npcId' => 'svc_sync' } }
    end

    # ---- the sessions --------------------------------------------------------------------------------------------------

    test 'a session answer at a PC that asks for a second step needs that step passed in the run' do
      run_game
      session = ['mfa_session', 'mfa:session:hana']
      # the step left out: the pass answer with no opened step, and the sign-in with no step at all
      assert_found session, without(:hana_required)
      assert_found session, without(:hana_required, :wrong_code, :pass_code, :lock)
      assert_found session, doctored(:hana_required) { |r| r['body'] = deep(@marks[:unlock]['body']) }
      # the pass answer that is not in shape: the wrong HTTP status, wrong route for the kind, the wrong approver, no phone
      assert_found session, doctored(:pass_code) { |r| r['status'] = 422 }
      assert_found session, doctored(:pass_code) { |r| r['status'] = 201 }
      assert_found session, doctored(:pass_code) { |r| r['method'] = 'GET' }
      assert_found session, doctored(:pass_code) { |r| r['path'] = r['path'].sub('/mfa/verify', '/mfa/prompt'); r['body']['approvedBy'] = 'owner' }
      assert_found session, doctored(:pass_code) { |r| r['path'] = r['path'].sub('/mfa/verify', '/mfa/approve'); r['body']['approvedBy'] = 'player' }
      assert_found session, doctored(:pass_code) { |r| r['body']['approvedBy'] = 'owner' }
      assert_found session, doctored(:pass_code) { |r| r['body']['via'] = 'claim' }
      assert_found session, doctored(:pass_code) { |r| r['body'].delete('via') }
      assert_found session, doctored(:pass_code) { |r| r['body']['npcId'] = 'ines' }
      # the sign-in after the pass, left unnamed and unlocked: a session again with no step
      assert_found session, doctored(:unlock) { |r| r.delete('login') }
      assert_found session, without(:lock)
      assert_found session, doctored(:lock) { |r| r['status'] = 422 }
      assert_found session, doctored(:lock) { |r| r['body']['locked'] = false }
      assert_found session, doctored(:lock) { |r| r['body']['pcId'] = 'code_pc2' }
      # the bootstrap listing a session the step never earned
      assert_found session, without(:pass_code, :hana_required, :wrong_code, :lock, :unlock, :token)
    end

    test 'the second step of a push or a number is judged by its own proof' do
      run_game
      cal = ['mfa_session', 'mfa:session:cal']
      nia = ['mfa_session', 'mfa:session:nia']
      assert_found cal, without(:cal_required)
      assert_found cal, doctored(:cal_pass) { |r| r['body']['approvedBy'] = 'player' }
      assert_found cal, doctored(:cal_pass) { |r| r['status'] = 422 }
      assert_found cal, doctored(:cal_pass) { |r| r['path'] = r['path'].sub('/mfa/prompt', '/mfa/approve'); r['body']['approvedBy'] = 'player' }
      assert_found cal, doctored(:cal_pass) { |r| r['path'] = r['path'].sub('/mfa/prompt', '/mfa/verify'); r.delete('query') }
      # number matching is never approved by its owner
      assert_found nia, doctored(:nia_pass) { |r| r['path'] = r['path'].sub('/mfa/approve', '/mfa/prompt'); r['body']['approvedBy'] = 'owner' }
      # an approval by the player needs the phone the run took
      assert_found nia, without(:take_phone)
      assert_found nia, without(:nia_required2)
      assert_found nia, doctored(:nia_pass) { |r| r['body']['approvedBy'] = 'owner' }
      assert_found nia, doctored(:nia_pass) { |r| r['status'] = 500 }
      # two steps open for one account: a pass answer with no host label closes neither (ambiguous)
      rows = @log.map { |r| deep(r) }
      first = rows.index { |r| r['body'].is_a?(Hash) && r['body']['mfaRequired'] && r['body']['pcId'] == 'match_pc' }
      second = deep(rows[first])
      second['body']['pcId'] = 'push_pc'
      second['body']['npcId'] = 'nia'
      rows.insert(first + 1, second)
      assert_found ['mfa_secret', 'mfa:answer:mfaRequired'], rows
    end

    test 'an unnamed sign-in answer that could be at a PC that asks for a step is reported; the exempt ways in are not' do
      run_game
      # Cal is admitted at the push PC and the plain PC: unnamed, the plain PC's sign-in could be the push PC's
      assert_found ['mfa_session', 'mfa:session:cal'], doctored(:plain_signin) { |r| r.delete('login') }
      assert_found ['mfa_session', 'mfa:session:cal'], doctored(:plain_signin) { |r| r['login'] = { 'pcId' => 'push_pc' } }
      assert_found ['mfa_session', 'mfa:session:cal'], doctored(:plain_signin) { |r| r['login'] = { 'pcId' => 'nope' } }
      assert_found ['mfa_session', 'mfa:session:cal'], doctored(:plain_signin) { |r| r.delete('login'); r['body']['host'] = 'NOWHERE' }
      assert_equal [], mfa(scan(doctored(:plain_signin) { |r| r['login'] = { 'pcId' => 'plain_pc' } }))
      # the exempt: the service account (creds.mfa false), a token, an invite relay, a claim, a technique
      assert_equal [], mfa(scan(doctored(:sync_signin) { |r| r.delete('login') }))
      assert_equal [], mfa(scan(doctored(:token) { |r| r.delete('login') }))
      # not exempt by saying so only: a typed answer that claims to be a token with no kind, a kind that is not a token
      assert_found ['mfa_session', 'mfa:session:hana'], doctored(:token) { |r| r['body'].delete('kind') }
      assert_found ['mfa_session', 'mfa:session:hana'], doctored(:token) { |r| r['body']['kind'] = 'saved_connection' }
      assert_found ['mfa_session', 'mfa:session:hana'], doctored(:token) { |r| r['body']['via'] = 'password' }
      assert_found ['mfa_session', 'mfa:session:hana'], doctored(:token) { |r| r['body']['relay'] = false; r['body']['via'] = 'unknown' }
      # the claim is the one answer of POST login that skips the step; the server never answers a sign-in as a technique (S8a R1-L3)
      assert_equal [], mfa(scan(doctored(:token) { |r| r['body'] = r['body'].merge('via' => 'claim').except('kind', 'label', 'expiresInS', 'route') }))
      assert_found ['mfa_session', 'mfa:session:hana'], doctored(:token) { |r| r['body'] = r['body'].merge('via' => 'technique').except('kind', 'label', 'expiresInS', 'route') }
      assert_equal [], mfa(scan(doctored(:token) { |r| r['body'] = r['body'].merge('relay' => true) }))
      # a body that says the account is unenrolled exempts nothing, and a host label names the PC as the tag does
      rows = doctored(:unlock) { |r| r['body']['mfa'] = false; r.delete('login'); r['body']['host'] = 'ACC01' }
      assert_equal [], mfa(scan(rows)), 'the unlock of the locked session, named by its host label'
      rows.delete_if { |r| r['path'].end_with?('/lock_session') }
      assert_found ['mfa_session', 'mfa:session:hana'], rows
    end
  end
end
