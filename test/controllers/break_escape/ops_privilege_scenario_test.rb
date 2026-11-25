require 'test_helper'
require 'minitest/mock'
require_relative '../../support/network_ops_scenario'
require_relative '../../support/privilege_answers'

module BreakEscape
  # Ops S5bc unit 19 (S5b, ruling A, ruling B): the beats of S5BC brief section 7 that the real
  # scenario can play (1 to 10) as one run through the real routes. Every collect, keyring,
  # crack, stick and relay answer is named; the scenario test records them
  # (PRIV_ANSWERS_RECORD=1) or asserts them equal the fixture, and the no-exposure test scans them.
  # `checkpoint(label)` is called after the start and after every beat.
  module OpsPrivilegeBeats
    include ActiveSupport::Testing::TimeHelpers

    BEATS_SCENARIO = File.expand_path('../../../scenarios/test_ops_privilege/scenario.json.erb', __dir__)
    BEATS_GAME_ID = 190_019
    BEATS_START = Time.utc(2026, 11, 24, 9, 0, 0)
    OLU_PW = 'Harbourlight-Olu-08'.freeze
    UMA_LOGIN = ['umaquay', 'Quayside-Uma-17'].freeze
    ADEL_LOGIN = ['adelwick', 'Lanternwick-Adel-52'].freeze
    OLU_LOGIN = ['omarsh', 'Harbourlight-Olu-08'].freeze
    SAM_LOGIN = ['sokoro', 'Granary-Sam-47'].freeze
    PASSWORDS = %w[Harbourlight-Olu-08 Quayside-Uma-17 Tidewater-Priya-31 Granary-Sam-47 Lanternwick-Adel-52].freeze
    # S5c (unit 24): the account-only local administrators and the domain administrator
    DESKADMIN_LOGIN = %w[deskadmin Winter2026].freeze
    LABADMIN_PASSWORD = 'q8-Fen-31-Lab'.freeze
    RAVI_LOGIN = %w[rmenon-adm Tidewater-Ravi-64].freeze
    S5C_PASSWORDS = [DESKADMIN_LOGIN[1], LABADMIN_PASSWORD, RAVI_LOGIN[1]].freeze

    def beats_scenario
      JSON.parse(ScenarioBinding.render(File.read(BEATS_SCENARIO)))
    end

    def beats_build
      game = Game.new(
        id: BEATS_GAME_ID, mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
        scenario_data: beats_scenario,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby bay store it_room],
                        'encounteredNPCs' => %w[olu uma adel priya sam ravi],
                        'unlockedObjects' => %w[lobby_cabinet] }
      )
      game.prepare_scenario_data!
      game.save!
      @game = game
      @answers = {}
    end

    def b_path(suffix)
      "/break_escape/games/#{@game.id}/#{suffix}"
    end

    # Names the answer just received.
    def name_answer(name)
      raise "answer #{name} named twice" if @answers.key?(name)

      @answers[name] = { 'status' => response.status, 'body' => JSON.parse(response.body) }
      response.parsed_body
    end

    def b_login(pc, who, name = nil, **extra)
      post b_path('login'), params: { pc_id: pc, username: who[0], password: who[1] }.merge(extra), as: :json
      name ? name_answer(name) : response.parsed_body
    end

    def b_logout(pc)
      post b_path('logout'), params: { pc_id: pc }, as: :json
    end

    def b_lock(pc)
      post b_path('lock_session'), params: { pc_id: pc }, as: :json
    end

    def b_collect(pc, name, **extra)
      post b_path('harvest_credentials'), params: { pc_id: pc }.merge(extra), as: :json
      name_answer(name)
    end

    def b_keyring(name)
      get b_path('keyring'), as: :json
      name_answer(name)
    end

    def b_take(type, id, name)
      post b_path('inventory'), params: { action_type: 'add', item: { type: type, id: id, name: name } }, as: :json
      assert_response :success, response.body
      response.parsed_body
    end

    def b_crack(hash_id, facts, name)
      post b_path('crack'), params: { hash_id: hash_id, facts: facts }, as: :json
      name_answer(name)
    end

    def b_remove(item_id, used_on, name)
      post b_path('inventory'), params: { action_type: 'remove', item: { id: item_id }, used_on: used_on }, as: :json
      name_answer(name)
    end

    def b_container(id, name = nil, **params)
      get b_path("container/#{id}"), params: params, as: :json
      name ? name_answer(name) : response.parsed_body
    end

    def b_room(id, name)
      get b_path("room/#{id}"), as: :json
      assert_response :success, response.body
      name_answer(name)
    end

    def b_state
      Game.find(@game.id).player_state
    end

    def b_game
      Game.find(@game.id)
    end

    def b_report(*reports)
      post npc_frustration_game_url(@game), params: { reports: reports }, as: :json
      response.parsed_body['answers']
    end

    def checkpoint(_label); end

    def held_hash_ids
      b_state['harvestedAccounts'].to_a
    end

    # beat 1: no collect as a user
    def beat_user_no_collect
      travel_to(BEATS_START)
      beats_build
      checkpoint('start')
      body = b_login('bay_pc', UMA_LOGIN, 'signin_user_bay')
      refute body.key?('access'), body.to_s
      b_container('bay_pc', 'desktop_user_bay')
      b_collect('bay_pc', 'collect_refused_not_admin')
      assert_response :unprocessable_entity
      b_logout('bay_pc')
      checkpoint('beat 1')
    end

    # beat 2 and 3: the collect as an administrator and the hash rows
    def beat_collect_at_bay
      body = b_login('bay_pc', ADEL_LOGIN, 'signin_admin_bay')
      assert_equal 'admin', body['access']
      b_keyring('keyring_before_collect')
      b_collect('bay_pc', 'collect_bay_first')
      assert_response :success
      checkpoint('beat 2 first collect')
      b_collect('bay_pc', 'collect_bay_repeat')
      assert_response :success
      b_lock('bay_pc')
      b_collect('bay_pc', 'collect_refused_locked')
      assert_response :unprocessable_entity
      b_login('bay_pc', ADEL_LOGIN)
      b_collect('bay_pc', 'collect_refused_not_reachable', relay: 1)
      assert_response :forbidden
      b_collect('no_such_pc', 'collect_refused_unknown_pc')
      assert_response :not_found
      checkpoint('beat 2')
      b_logout('bay_pc')
      b_keyring('keyring_after_bay_collect')
      checkpoint('beat 3')
    end

    # beat 4: crack one, sign in with it elsewhere
    def beat_crack_olu
      b_take('notes1', 'bay_pinboard', 'Bay pinboard')
      b_crack('baypc_olu', ['olu_pet'], 'crack_olu')
      assert_response :success
      b_keyring('keyring_after_crack_olu')
      body = b_login('hot_desk', OLU_LOGIN, 'signin_olu_hot_desk')
      assert body['success'], body.to_s
      b_logout('hot_desk')
      checkpoint('beat 4')
    end

    # beat 5 and 6: the hot desk before and after the borrow, then crack from the panel
    def beat_hot_desk_borrow
      b_login('hot_desk', ADEL_LOGIN, 'signin_admin_hot_desk')
      b_collect('hot_desk', 'collect_hot_desk_before_borrow')
      assert_response :success
      b_logout('hot_desk')
      checkpoint('beat 5 before the borrow')
      3.times { |i| b_login('sam_pc', ['sokoro', "wrong-#{i}"]) }
      assert_includes b_state['loginLockouts'].to_a, 'sam_pc|sokoro'
      b_report(npc_id: 'sam', event: 'check', object_id: 'sam_pc')
      fail_report = { npc_id: 'sam', event: 'fail', need: 'work', object_id: 'sam_pc', missing: [{ id: 'sam_pc', why: 'locked_out' }] }
      travel_to(BEATS_START + 10) { b_report(fail_report) }
      run = nil
      travel_to(BEATS_START + 35) { run = b_report(fail_report).first['run'] }
      assert_equal 'borrow_session', run['do']
      travel_to(BEATS_START + 100) do
        post npc_workaround_game_url(@game), params: { npc_id: 'sam', index: run['index'], hand: run['hand'] }, as: :json
      end
      assert_response :success, response.body
      assert_includes b_state['cachedAt'], 'hot_desk|sam'
      claim = nil
      travel_to(BEATS_START + 110) do
        post b_path('login'), params: { pc_id: 'hot_desk', claim: 'guest' }, as: :json
        claim = name_answer('claim_hot_desk_guest')
      end
      assert claim['success'], claim.to_s
      b_collect('hot_desk', 'collect_refused_claim_user')
      assert_response :unprocessable_entity
      # a reload (the bootstrap a checkpoint reads) ends the claimed session
      checkpoint('beat 5 after the borrow')
      b_logout('hot_desk')
      b_login('hot_desk', ADEL_LOGIN)
      b_collect('hot_desk', 'collect_hot_desk_after_borrow')
      assert_response :success
      b_logout('hot_desk')
      checkpoint('beat 5')
      b_take('notes1', 'lobby_noticeboard', 'Front desk noticeboard')
      b_keyring('keyring_before_crack_sam')
      b_crack('hotdesk_sam', ['sam_year'], 'crack_sam_from_panel')
      assert_response :success
      checkpoint('beat 6')
    end

    # beat 7 and 8: ruling A
    def beat_survey_stick
      b_take('usb', 'survey_stick', 'Survey USB stick')
      b_remove('survey_stick', 'bay_usb_port', 'stick_refused_no_session')
      assert_response :unprocessable_entity
      assert_includes b_state['inventory'].map { |i| i['id'] }, 'survey_stick'
      checkpoint('beat 7')
      b_login('bay_pc', ADEL_LOGIN)
      b_remove('survey_stick', 'bay_usb_port', 'stick_planted_admin')
      assert_response :success
      refute_includes b_state['inventory'].map { |i| i['id'] }, 'survey_stick'
      get b_path('log_rows'), params: { object_id: 'audit_log_pc' }, as: :json
      audit = name_answer('audit_rows_after_override')
      assert_equal 1, audit['rows'].count { |r| r['event'] == 'USB_OVERRIDE' && r['detail'] == 'device: storage' }
      assert_equal 1, b_game.log_rows_for('priv_audit').count { |r| r['event'] == 'usb_install_overridden' }
      assert_equal 1, Array(b_state['plantedItems']).size
      b_logout('bay_pc')
      checkpoint('beat 8')
    end

    # S5c: the remote sign-in screen's tile answer for the bay PC, over the office foothold, carries the PC's
    # domain (the client test signin-domain.test.mjs reads this answer by name).
    def beat_remote_domain
      post b_path('inventory'), params: { action_type: 'add', item: { type: 'pc', id: 'kit_dropbox', name: 'Network drop box' } }, as: :json
      assert_response :success, response.body
      post b_path('network/plant'), params: { jack_id: 'office_port' }, as: :json
      assert_response :success, response.body
      get b_path('login_accounts'), params: { pc_id: 'bay_pc', foothold: 'jack_office_port' }, as: :json
      assert_response :success, response.body
      body = name_answer('remote_lockable_bay_pc')
      assert_equal 'northwind', body['domain'], body.to_s
    end

    # beat 9 and 10: ruling B
    def beat_relay
      b_take('text_file', 'adel_assist_code', 'Adel assist code.txt')
      b_keyring('keyring_with_adel_assist')
      post b_path('login'), params: { pc_id: 'hot_desk', credential: 'adel_assist', relay: true }, as: :json
      body = name_answer('relay_signin_adel_hot_desk')
      assert_equal 'admin', body['access'], body.to_s
      b_container('hot_desk', 'relay_desktop_hot_desk', relay: 1)
      b_collect('hot_desk', 'collect_relay_admin', relay: 1)
      assert_response :success
      %w[user admin].each do |level|
        assert_equal false, b_game.ops_need_session('hot_desk', level)['met'], "a relay never meets a #{level} session need"
      end
      checkpoint('beat 9')
      b_take('text_file', 'assist_code', 'Uma assist code.txt')
      post b_path('login'), params: { pc_id: 'store_pc', credential: 'uma_assist', relay: true }, as: :json
      body = name_answer('relay_signin_uma_store')
      refute body.key?('access'), body.to_s
      post b_path('harvest_credentials'), params: { pc_id: 'store_pc', relay: 1 }, as: :json
      name_answer('collect_refused_relay_user')
      assert_response :unprocessable_entity
      checkpoint('beat 10')
    end

    # S5c beat 11 and 12: collect the shared local administrator at desk A, crack it, reuse it at desk B
    def beat_shared_local_admin
      b_logout('hot_desk')
      body = b_login('desk_a', ADEL_LOGIN, 'signin_admin_desk_a')
      assert_equal 'admin', body['access']
      tiles = b_container('desk_a', 'desktop_admin_desk_a')
      refute_includes tiles.to_s, 'deskadmin', 'the desktop of desk_a names no account-only account before the collect'
      b_collect('desk_a', 'collect_desk_a_deskadmin')
      assert_response :success
      row = response.parsed_body['harvested'].first
      assert_equal 'deskadmin', row['username']
      assert_nil row['portrait']
      assert_equal 'desk_a_deskadmin', row['hashId']
      b_collect('desk_a', 'collect_desk_a_repeat')
      assert_response :success
      b_logout('desk_a')
      checkpoint('beat 11')
      b_take('notes1', 'it_rota_poster', 'IT rota poster')
      b_crack('desk_a_deskadmin', ['it_rota_seen'], 'crack_deskadmin_desk_a')
      assert_response :success
      b_keyring('keyring_after_crack_deskadmin')
      body = b_login('desk_b', DESKADMIN_LOGIN, 'signin_deskadmin_desk_b')
      assert body['success'], body.to_s
      assert_equal 'admin', body['access']
      b_container('desk_b', 'desktop_deskadmin_desk_b')
      b_collect('desk_b', 'collect_desk_b_deskadmin')
      assert_response :success
      assert_equal %w[desk_b_deskadmin], response.parsed_body['harvested'].map { |r| r['hashId'] }
      b_logout('desk_b')
      b_keyring('keyring_after_collect_desk_b')
      checkpoint('beat 12')
    end

    # S5c beat 13: the hardened PC holds
    def beat_hardened_lab
      body = b_login('lab_pc', DESKADMIN_LOGIN, 'signin_deskadmin_lab_refused')
      assert_equal false, body['success']
      assert_response :unprocessable_entity
      refused = b_game.log_rows_for('priv_audit').select { |r| r['event'] == 'signin_refused' }
      assert_equal({ 'kind' => 'local' }, refused.last['detail'])
      b_login('lab_pc', ADEL_LOGIN, 'signin_admin_lab')
      b_collect('lab_pc', 'collect_lab_labadmin')
      assert_response :success
      assert_equal %w[labadmin], response.parsed_body['harvested'].map { |r| r['npcId'] }
      b_logout('lab_pc')
      body = b_crack('lab_labadmin', ['it_rota_seen'], 'crack_labadmin_nomatch')
      assert_response :success
      assert_equal 'nomatch', body['status'], 'the strong password of the hardened PC does not fall to the rota fact'
      refute_includes b_state['crackedAccounts'].to_a, 'labadmin'
      b_keyring('keyring_after_collect_lab')
      checkpoint('beat 13')
    end

    # S5c beat 14: the domain administrator
    def beat_domain_admin
      b_take('notes1', 'ravi_note', "Note: Ravi's login")
      %w[bay_pc hot_desk].each do |pc|
        body = b_login(pc, RAVI_LOGIN, "signin_ravi_#{pc}")
        assert body['success'], body.to_s
        assert_equal 'admin', body['access']
        b_logout(pc)
      end
      body = b_login('desk_a', RAVI_LOGIN, 'signin_ravi_desk_a_refused')
      assert_equal false, body['success']
      assert_response :unprocessable_entity
      # The PC objects as the server sends them (the sign-in screens read their domain from these)
      %w[lobby bay it_room].each { |room| b_room(room, "room_#{room}") }
      checkpoint('beat 14')
    end

    def play_all_beats
      beat_user_no_collect
      beat_collect_at_bay
      beat_crack_olu
      beat_hot_desk_borrow
      beat_survey_stick
      beat_relay
      beat_shared_local_admin
      beat_hardened_lab
      beat_domain_admin
      beat_remote_domain
      @answers
    end
  end

  # Ops S5a unit 15 (OPS_PRIVILEGE_ACCOUNTS_PLAN.md, the S5a feature scenario): the real
  # scenarios/test_ops_privilege/scenario.json.erb driven through the routes, each assertion read
  # from a re-read game or a fresh answer. The browser part (taskbar marker, toasts, the remote
  # view) is PLAYTEST.md's. Beats that no validator-clean scenario can show in a browser (a stick
  # taken by a sign-in PC itself) are made on a copy of the real scenario and say so.
  class OpsPrivilegeScenarioTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests

    SCENARIO_PATH = File.expand_path('../../../scenarios/test_ops_privilege/scenario.json.erb', __dir__)
    OFFICE = 'jack_office_port'.freeze
    UMA = ['umaquay', 'Quayside-Uma-17'].freeze
    ADEL = ['adelwick', 'Lanternwick-Adel-52'].freeze
    OLU_PASSWORD = 'Harbourlight-Olu-08'.freeze
    FINDING = 'store_pc.records.stale_build'.freeze
    AUDIT = 'priv_audit'.freeze
    STICK = { 'id' => 'kit_stick_a', 'type' => 'usb', 'name' => 'Grey USB stick', 'takeable' => true, 'usbClass' => 'storage' }.freeze
    BADUSB = { 'id' => 'kit_badusb', 'type' => 'pc', 'name' => 'Keystroke injector', 'takeable' => true, 'usbClass' => 'hid' }.freeze
    NEEDS_CONSOLE = 'Nobody is signed in at this keyboard.'.freeze

    def scenario
      JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
    end

    def build(data = scenario, player_state = {})
      build_network_game({ 'unlockedRooms' => %w[lobby bay store], 'encounteredNPCs' => %w[olu uma adel] }.merge(player_state), data)
    end

    def fresh
      Game.find(@game.id)
    end

    def state
      fresh.player_state
    end

    def rows(event = nil)
      list = fresh.log_rows_for(AUDIT)
      event ? list.select { |r| r['event'] == event } : list
    end

    def give(*items)
      @game.reload
      @game.player_state['inventory'] += items.map(&:dup)
      @game.save!
    end

    def hold_foothold
      take_drop_box
      plant('office_port')
      assert_response :success, response.body
    end

    def user_in(pc = 'bay_pc')
      body = sign_in(pc, *UMA)
      assert body['success'], body.to_s
      body
    end

    def admin_in(pc = 'bay_pc', foothold: nil)
      body = sign_in(pc, *ADEL, foothold: foothold)
      assert body['success'], body.to_s
      body
    end

    def lock(pc = 'bay_pc')
      post game_path('lock_session'), params: { pc_id: pc }, as: :json
      assert_response :success, response.body
    end

    def implant(pc = 'bay_pc')
      post game_path('network/implant'), params: { pc_id: pc, shape: 'session' }, as: :json
      response.parsed_body
    end

    def remove(item_id, used_on)
      post game_path('inventory'), params: { action_type: 'remove', item: { id: item_id }, used_on: used_on }, as: :json
      response.parsed_body
    end

    def desktop_ids(pc = 'bay_pc')
      get game_path("container/#{pc}"), as: :json
      assert_response :success, response.body
      Array(response.parsed_body['contents']).map { |c| c['id'] }
    end

    def folder(id = 'olu_folder')
      get game_path("container/#{id}"), as: :json
      response.parsed_body
    end

    def level(pc = 'bay_pc')
      fresh.session_access(pc)
    end

    # ---- the scenario's shape --------------------------------------------------------------

    test 'the real scenario holds the accounts, the profiles and the governed PC the beats need' do
      data = scenario
      npcs = data['rooms'].values.flat_map { |r| Array(r['npcs']) }
      admins = npcs.select { |n| n.dig('creds', 'admin') == true }.map { |n| n['id'] }
      # S5c adds the two shared and hardened local administrators and the domain administrator
      assert_equal %w[adel deskadmin labadmin ravi], admins
      assert_equal %w[adel_files olu_files uma_files], data['accountProfiles'].keys.sort
      bay = data['rooms']['bay']['objects'].find { |o| o['id'] == 'bay_pc' }
      assert_equal 'olu', bay['owner']
      assert_equal 'blocked', data['policies'][bay['policy']]['usb']
      assert_equal 'priv_audit', data['logSources'].keys.first
    end


    test 'the S5b, ruling A and ruling B parts of the real scenario hold what the beats need' do
      data = scenario
      objects = data['rooms'].values.flat_map { |r| Array(r['objects']) }
      by_id = objects.to_h { |o| [o['id'], o] }
      hot = by_id['hot_desk']
      assert_equal 'login', hot['lockType']
      assert_equal true, hot['locked']
      refute hot.key?('owner')
      assert_equal [{ 'npc' => 'priya' }, { 'npc' => 'sam', 'after' => 'borrow' }], hot['cachedAccounts']
      assert_equal [{ 'npc' => 'olu' }, { 'npc' => 'uma' }], by_id['bay_pc']['cachedAccounts']
      port = by_id['bay_usb_port']
      assert_equal 'bay_pc', port['portOf']
      assert_equal 'bay_locked', port['policy']
      assert_equal false, port['locked'] == true
      start = data['startItemsInInventory']
      assert_equal 'storage', start.find { |i| i['id'] == 'survey_stick' }['usbClass']
      log = start.find { |i| i['type'] == 'capture_log' }
      assert_equal true, log.dig('holds', 'captures')
      hashes = data['credentials'].select { |_, c| c['kind'] == 'hash' }
      assert_equal %w[baypc_olu baypc_uma hotdesk_priya hotdesk_sam desk_a_deskadmin desk_b_deskadmin lab_labadmin], hashes.keys
      assert_equal %w[bay_pc bay_pc hot_desk hot_desk desk_a desk_b lab_pc], hashes.values.map { |c| c.dig('proof', 'harvested') }
      assert_equal({ 'kind' => 'assist_invite', 'account' => 'adel', 'connectsTo' => 'hot_desk', 'label' => "Adel's assist code",
                     'proof' => { 'held' => 'adel_assist_code' } }, data['credentials']['adel_assist'])
      # every fact a hash needs comes from a takeable note in an open room, not inside a locked container
      facts = hashes.values.flat_map { |c| c.dig('crack', 'facts') }.compact
      notes = objects.select { |o| Array(o['revealsFacts']).any? }
      assert_equal facts.uniq.sort, notes.flat_map { |n| n['revealsFacts'] }.sort
      notes.each { |n| assert_equal true, n['takeable'], n['id'] }
      sam = data['rooms']['lobby']['npcs'].find { |n| n['id'] == 'sam' }
      assert_equal [{ 'at' => 40, 'do' => 'borrow_session', 'pc' => 'hot_desk' }], sam['workarounds']
    end

    test 'the S5c part of the real scenario holds what beats 11 to 14 need, and the borrow can be made by clicking' do
      data = scenario
      objects = data['rooms'].values.flat_map { |r| Array(r['objects']) }
      by_id = objects.to_h { |o| [o['id'], o] }
      npcs = data['rooms'].values.flat_map { |r| Array(r['npcs']) }.to_h { |n| [n['id'], n] }
      assert_equal 'it_room', data['rooms']['lobby']['connections']['south']
      assert_equal 'lobby', data['rooms']['it_room']['connections']['north']
      %w[desk_a desk_b lab_pc].each do |id|
        assert_equal 'login', by_id[id]['lockType']
        assert_equal true, by_id[id]['locked']
        # the list names no account-only id: roles only (an id in `access.people` reaches the browser in the room answer)
        assert_equal({ 'roles' => %w[it] }, by_id[id]['access'])
      end
      assert_equal [{ 'npc' => 'deskadmin' }], by_id['desk_a']['cachedAccounts']
      assert_equal [{ 'npc' => 'deskadmin' }], by_id['desk_b']['cachedAccounts']
      assert_equal [{ 'npc' => 'labadmin' }], by_id['lab_pc']['cachedAccounts']
      assert_equal %w[northwind northwind], %w[bay_pc hot_desk].map { |id| by_id[id]['domain'] }
      deskadmin = npcs['deskadmin']
      assert_equal true, deskadmin['accountOnly']
      assert_equal false, deskadmin['staff']
      assert_equal({ 'accountKind' => 'local', 'localTo' => %w[desk_a desk_b] }, deskadmin['creds'].slice('accountKind', 'localTo'))
      assert_equal %w[lab_pc], npcs['labadmin']['creds']['localTo']
      assert_equal({ 'accountKind' => 'domain', 'domain' => 'northwind', 'admin' => true }, npcs['ravi']['creds'].slice('accountKind', 'domain', 'admin'))
      assert_nil npcs['ravi']['accountOnly']
      assert_equal %w[it it it it], %w[adel deskadmin labadmin ravi].map { |id| npcs[id]['role'] }
      assert_nil data['social']['intelFacts']['it_rota_seen']['subject'], 'a fact subject would name the account-only id before its collect'
      crack = ->(id) { data['credentials'][id]['crack'] }
      assert_equal({ 'password' => 'guessable', 'facts' => %w[it_rota_seen] }, crack.('desk_a_deskadmin').slice('password', 'facts'))
      assert_equal 'strong', crack.('lab_labadmin')['password']
      assert_equal true, by_id['it_rota_poster']['takeable']
      assert_equal %w[it_rota_seen], by_id['it_rota_poster']['revealsFacts']
      # the borrow of beat 16: a power switch the player can click makes Sam's PC fail his work, so he asks for the hot desk
      assert_equal 'sam_pc_off', by_id['sam_pc']['offWhen']
      assert_equal false, data['globalVariables']['sam_pc_off']
      assert_equal 'sam_pc_off', by_id['sam_breaker']['triggerOnInteract'].last['onConfirm'].first['key']
    end

    # ---- beat 1 and 2: the ordinary account and the administrator ----------------------------

    test 'an ordinary account sees only its own profile and no access level; the owner profile is refused' do
      build
      body = user_in
      refute body.key?('access'), body.to_s
      assert_equal 'user', level
      assert_equal %w[uma_todo], desktop_ids
      body = folder
      assert_response :forbidden, body.to_s
      assert_equal 'Container not unlocked: olu_folder', body['error']
      refute_includes response.body, 'olu_budget'
      assert_empty rows('admin_profile_read')
    end

    test 'the administrator sees the owner profile as well, and one folder open leaves one audit row' do
      build
      body = admin_in
      assert_equal 'admin', body['access']
      assert_equal 'admin', level
      ids = desktop_ids
      # S5b: Uma is cached at the bay PC, so the administrator reaches her profile there as well
      assert_equal %w[adel_runbook olu_notes olu_folder uma_todo].sort, ids.sort
      body = folder
      assert_response :success, body.to_s
      assert_equal %w[olu_budget], body['contents'].map { |c| c['id'] }
      assert_equal 1, rows('admin_profile_read').size
      row = rows('admin_profile_read').first
      assert_equal({ 'account' => 'adelwick' }, row['as'])
      assert_equal({ 'kind' => 'pc', 'id' => 'bay_pc' }, row['where'])
      folder
      assert_equal 1, rows('admin_profile_read').size, 'a reopen stores none'
      refute_includes fresh.log_rows_for(AUDIT).to_json, OLU_PASSWORD
    end

    # S5a R1 F11: the lobby's reader terminal shows the audit rows, and reading them writes none.
    test 'the audit reader shows the admin read row and GET /log_rows saves nothing' do
      build
      admin_in
      folder
      assert_equal 1, rows('admin_profile_read').size
      saves = 0
      sub = ActiveSupport::Notifications.subscribe('sql.active_record') do |*, payload|
        sql = payload[:sql].to_s
        saves += 1 if sql.start_with?('UPDATE') && sql.include?('break_escape_games')
      end
      begin
        get game_path('log_rows'), params: { object_id: 'audit_log_pc' }, as: :json
      ensure
        ActiveSupport::Notifications.unsubscribe(sub)
      end
      assert_response :success, response.body
      assert_equal 0, saves
      assert_includes response.body, 'ADMIN_READ'
      cell = response.parsed_body['rows'].find { |r| r['event'] == 'ADMIN_READ' }['detail']
      assert_equal 'profile: Olu Marsh', cell
      refute_includes response.body, 'olu_files'
      refute_includes response.body, OLU_PASSWORD
      assert_equal 1, rows('admin_profile_read').size
    end

    test 'the owner opens the same folder as an ordinary read and leaves no audit row' do
      build
      assert sign_in('bay_pc', 'omarsh', OLU_PASSWORD)['success']
      folder
      assert_response :success
      assert_empty rows('admin_profile_read')
    end

    test 'the administrator at another PC gets no profile of the first PC owner' do
      build
      admin_in('store_pc')
      refute_includes desktop_ids('store_pc'), 'olu_notes'
      folder
      assert_response :forbidden
      assert_equal 'Container not unlocked: olu_folder', response.parsed_body['error']
    end

    # ---- beats 3 and 4: the keystroke device, keyboard and remote ---------------------------

    test 'a keystroke device is refused for a user session with the policy line, the device stays held' do
      build(scenario, 'inventory' => [BADUSB.dup])
      user_in
      body = implant
      assert_response :unprocessable_entity
      assert_equal 'usb_refused', body['reason']
      assert_includes held_ids, 'kit_badusb'
      assert_empty rows('usb_install_overridden')
    end

    test 'at the keyboard an administrator installs it, and the override is logged once' do
      build(scenario, 'inventory' => [BADUSB.dup])
      admin_in
      body = implant
      assert_response :success, body.to_s
      assert_equal true, body['success']
      refute_includes held_ids, 'kit_badusb'
      assert_includes state['footholds'].keys, 'implant_bay_pc'
      override = rows('usb_install_overridden')
      assert_equal 1, override.size
      assert_equal({ 'device' => 'hid' }, override.first['detail'])
      assert_equal({ 'account' => 'adelwick' }, override.first['as'])
    end

    test 'a locked administrator session overrides nothing' do
      build(scenario, 'inventory' => [BADUSB.dup])
      admin_in
      lock
      assert_nil level
      body = implant
      assert_response :unprocessable_entity
      assert_equal 'usb_refused', body['reason']
      assert_includes held_ids, 'kit_badusb'
      assert_empty rows('usb_install_overridden')
    end

    test 'a remote administrator session is told nobody is at the keyboard and keeps the device' do
      build(scenario, 'inventory' => [BADUSB.dup])
      hold_foothold
      admin_in(foothold: OFFICE)
      assert_equal 'admin', level
      body = implant
      assert_response :unprocessable_entity
      assert_equal 'needs_console', body['reason']
      assert_equal NEEDS_CONSOLE, body['error']
      assert_includes held_ids, 'kit_badusb'
      assert_empty rows('usb_install_overridden')
      refute fresh.keyboard_admin?('bay_pc')
      assert fresh.session_admin?('bay_pc')
    end

    test 'the token session of the administrator is admin until it expires, then the implant answers not_ready' do
      build(scenario, 'inventory' => [BADUSB.dup])
      hold_foothold
      post game_path('login'), params: { pc_id: 'bay_pc', credential: 'adel_token', foothold: OFFICE }, as: :json
      assert response.parsed_body['success'], response.body
      assert_equal 'admin', level
      travel_to(Time.current + 2.hours) do
        assert_nil fresh.session_access('bay_pc')
        body = implant
        assert_equal 'not_ready', body['reason']
        assert_includes held_ids, 'kit_badusb'
      end
    end

    test 'the bay power switch ends the level: no access, and no override' do
      build(scenario, 'inventory' => [BADUSB.dup])
      admin_in
      assert_equal 'admin', level
      @game.reload.player_state['globalVariables'] = (@game.player_state['globalVariables'] || {}).merge('bay_off' => true)
      @game.save!
      assert_nil level
      body = implant
      refute body['success'], body.to_s
      assert_includes held_ids, 'kit_badusb'
      assert_empty rows('usb_install_overridden')
      # the second switch (`bay_breaker_on`) sets the global back: the same password session is an administrator again
      @game.reload.player_state['globalVariables'] = (@game.player_state['globalVariables'] || {}).merge('bay_off' => false)
      @game.save!
      assert_equal 'admin', level
    end

    # ---- the stick port ------------------------------------------------------------------

    test 'the stick port takes no stick the policy refuses, for a user or an administrator, and nothing is recorded' do
      build(scenario, 'inventory' => [STICK.dup])
      [-> { user_in }, -> { admin_in }].each do |sign|
        sign.call
        body = remove('kit_stick_a', 'bay_port')
        assert_response :unprocessable_entity, body.to_s
        assert_equal 'usb_refused', body['reason']
        assert_includes held_ids, 'kit_stick_a'
        assert_empty Array(state['plantedItems'])
        post game_path('logout'), params: { pc_id: 'bay_pc' }, as: :json
      end
    end

    # The authorable scenario has no object a remote or keyboard administrator can override at:
    # a sign-in PC may carry no triggerOnInteract (validator), so a stick target is never a sign-in
    # PC. These three tests make that object on a COPY of the real scenario (one edit) to prove the
    # engine's lapsed-override refusals against the real accounts, token, owner and power switch.
    def with_pc_stick_target
      data = scenario
      pc = data['rooms']['bay']['objects'].find { |o| o['id'] == 'bay_pc' }
      pc['requiresItem'] = 'usb'
      pc['triggerOnInteract'] = [{ 'type' => 'remove_item', 'item' => 'usb' }]
      data
    end

    test 'on a copy where the bay PC takes a stick: a live remote administrator plants it, an expired token session does not' do
      build(with_pc_stick_target, 'inventory' => [STICK.dup, STICK.merge('id' => 'kit_stick_b').dup])
      hold_foothold
      admin_in(foothold: OFFICE)
      body = remove('kit_stick_a', 'bay_pc')
      assert_response :success, body.to_s
      refute_includes held_ids, 'kit_stick_a'
      assert_equal 1, Array(state['plantedItems']).size
      assert_equal 1, rows('usb_install_overridden').size
      post game_path('logout'), params: { pc_id: 'bay_pc' }, as: :json
      post game_path('login'), params: { pc_id: 'bay_pc', credential: 'adel_token', foothold: OFFICE }, as: :json
      assert response.parsed_body['success'], response.body
      travel_to(Time.current + 2.hours) do
        body = remove('kit_stick_b', 'bay_pc')
        assert_response :unprocessable_entity, body.to_s
        assert_equal 'usb_refused', body['reason']
        assert_includes held_ids, 'kit_stick_b'
        assert_equal 1, Array(state['plantedItems']).size
      end
    end

    test 'on that copy a locked session and a switched-off PC are refused and keep the stick' do
      build(with_pc_stick_target, 'inventory' => [STICK.dup])
      admin_in
      lock
      body = remove('kit_stick_a', 'bay_pc')
      assert_response :unprocessable_entity
      assert_equal 'usb_refused', body['reason']
      post game_path('logout'), params: { pc_id: 'bay_pc' }, as: :json
      admin_in
      @game.reload.player_state['globalVariables'] = (@game.player_state['globalVariables'] || {}).merge('bay_off' => true)
      @game.save!
      body = remove('kit_stick_a', 'bay_pc')
      assert_response :unprocessable_entity
      assert_equal 'usb_refused', body['reason']
      assert_includes held_ids, 'kit_stick_a'
      assert_empty Array(state['plantedItems'])
    end

    test 'on that copy a user session is refused too (the stricter check)' do
      build(with_pc_stick_target, 'inventory' => [STICK.dup])
      user_in
      body = remove('kit_stick_a', 'bay_pc')
      assert_response :unprocessable_entity
      assert_equal 'usb_refused', body['reason']
      assert_includes held_ids, 'kit_stick_a'
    end

    # ---- the step up (S3's path to admin) ---------------------------------------------------

    def survey_records
      hold_foothold
      ops_scan(OFFICE, network_id: 'office_lan')
      ops_scan(OFFICE, host_id: 'store_pc')
      ops_check(OFFICE, host_id: 'store_pc', service: 'records')
      ops_confirm(OFFICE, FINDING)
      give('id' => 'card_stale', 'type' => 'technique_card', 'name' => 'Field note: records updates', 'technique_card' => 'field_release_notes',
           'takeable' => true)
    end

    test 'a typed user session at the records PC meets the need and the card steps it up to admin' do
      build
      survey_records
      body = ops_technique(OFFICE, FINDING, 'card_stale')
      assert_response :unprocessable_entity, body.to_s
      assert_equal 'need_unmet', body['reason']
      sign_in('store_pc', *UMA, foothold: OFFICE)
      assert_equal 'user', level('store_pc')
      body = ops_technique(OFFICE, FINDING, 'card_stale')
      assert_response :success, body.to_s
      record = state['sessions']['store_pc']
      assert_equal 'technique', record['via']
      assert_equal 'admin', record['access']
      assert_equal 'admin', level('store_pc')
      assert_equal 1, rows('technique_used').size
    end

    # R1-SERVER8: a technique's session grant is judged against the PC's admission, kind included, at run time.
    test 'a technique grant for a local account on a PC outside its localTo gives no session' do
      data = scenario
      data['rooms'].each_value do |room|
        Array(room['objects']).each do |o|
          next unless o['id'] == 'store_pc'

          o['services'].each { |svc| svc['weaknesses'].each { |w| w['grants']['session']['account'] = 'deskadmin' if w.dig('grants', 'session') } } if o['services']
        end
      end
      build(data)
      survey_records
      sign_in('store_pc', *UMA, foothold: OFFICE)
      body = ops_technique(OFFICE, FINDING, 'card_stale')
      assert_response :unprocessable_entity, body.to_s
      assert_equal 'no_grant', body['reason']
      assert_equal 'user', level('store_pc')
      assert_empty rows('technique_used')
    end

    test 'a relay session (the assist code) does not meet the need and the card refuses' do
      build
      survey_records
      give('id' => 'assist_code', 'type' => 'text_file', 'name' => 'Uma assist code.txt', 'credential' => 'uma_assist', 'takeable' => true)
      post game_path('login'), params: { pc_id: 'store_pc', credential: 'uma_assist', relay: true }, as: :json
      assert response.parsed_body['success'], response.body
      assert state['sessions']['store_pc']['relay']
      assert_equal 'user', level('store_pc')
      body = ops_technique(OFFICE, FINDING, 'card_stale')
      assert_response :unprocessable_entity, body.to_s
      assert_equal 'need_unmet', body['reason']
      assert_equal 'user', level('store_pc')
      assert_nil state['sessions']['store_pc']['access']
    end

    test 'a claim record of the records PC feeds the step up into a technique session, never a keyboard admin' do
      build
      survey_records
      @game.reload.player_state['sessions'] = { 'store_pc' => { 'id' => 'uma', 'via' => 'claim' } }
      @game.save!
      body = ops_technique(OFFICE, FINDING, 'card_stale')
      assert_response :success, body.to_s
      assert_equal 'admin', level('store_pc')
      refute fresh.keyboard_admin?('store_pc')
      assert_equal OFFICE, state['sessions']['store_pc']['foothold']
    end

    # ---- a refused or unearned request writes nothing -----------------------------------------

    test 'a use of the card with no confirmed finding, or a finding that is not there, writes nothing' do
      build
      hold_foothold
      give('id' => 'card_stale', 'type' => 'technique_card', 'name' => 'Field note: records updates', 'technique_card' => 'field_release_notes',
           'takeable' => true)
      before = state.slice('sessions', 'plantedItems', 'footholds', 'opsUsed')
      body = ops_technique(OFFICE, FINDING, 'card_stale')
      assert_response :not_found, body.to_s
      body = ops_technique(OFFICE, 'invented.finding.id', 'card_stale')
      assert_response :not_found, body.to_s
      assert_equal before, state.slice('sessions', 'plantedItems', 'footholds', 'opsUsed')
      assert_empty rows('technique_used')
    end

    test 'a refused implant, a refused remove and a refused folder open leave sessions, plants and rows as they were' do
      build(scenario, 'inventory' => [BADUSB.dup, STICK.dup])
      user_in
      before = state.slice('sessions', 'plantedItems', 'footholds', 'inventory')
      implant
      assert_response :unprocessable_entity
      remove('kit_stick_a', 'bay_port')
      assert_response :unprocessable_entity
      folder
      assert_response :forbidden
      assert_equal 'Container not unlocked: olu_folder', response.parsed_body['error']
      assert_equal before, state.slice('sessions', 'plantedItems', 'footholds', 'inventory')
      assert_empty rows('usb_install_overridden')
      assert_empty rows('admin_profile_read')
    end

    test 'the validator-clean scenario is read again from the stored game and answers the same' do
      build
      admin_in
      first = [level, desktop_ids.sort]
      reread = Game.find(@game.id)
      assert_equal first, [reread.session_access('bay_pc'), desktop_ids.sort]
    end
  end

  # Ops S5bc unit 19: the beats of S5BC brief section 7 (S5b, A, B) in one run. With
  # PRIV_ANSWERS_RECORD=1 it writes every named real answer to test/fixtures/files/ops_privilege_answers.json;
  # without it, each answer must equal the fixture.
  class OpsPrivilegeCachedBeatsTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include OpsPrivilegeBeats

    teardown { travel_back }

    # The answers carry values keyed from the app's secret (hash tokens, log row ids), and the
    # secret differs per checkout (test/dummy/tmp/development_secret.txt is random per tree). The
    # run is therefore played under one fixed key generator, and the fixture is recorded under it
    # too, so the comparison holds in every tree and in any test order. The stub is put back by
    # `stub` itself when the block ends.
    FIXTURE_KEY_GENERATOR = ActiveSupport::CachingKeyGenerator.new(
      ActiveSupport::KeyGenerator.new('ops-privilege-answers-fixture-secret', iterations: 1000)
    )

    test 'the run in order plays every beat and each real answer equals the recorded one' do
      answers = Rails.application.stub(:key_generator, FIXTURE_KEY_GENERATOR) { play_all_beats }
      if ENV['PRIV_ANSWERS_RECORD'] == '1'
        File.write(PrivilegeAnswers::PATH, "#{JSON.pretty_generate(answers)}\n")
      else
        recorded = PrivilegeAnswers.all
        assert_equal recorded.keys.sort, answers.keys.sort
        answers.each { |name, entry| assert_equal recorded[name], entry, "answer #{name} differs from the fixture" }
      end
    end
  end
end
