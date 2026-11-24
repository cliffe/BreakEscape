require 'test_helper'
require_relative '../../support/network_ops_scenario'

module BreakEscape
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
      assert_equal %w[adel], admins
      assert_equal %w[adel_files olu_files uma_files], data['accountProfiles'].keys.sort
      bay = data['rooms']['bay']['objects'].find { |o| o['id'] == 'bay_pc' }
      assert_equal 'olu', bay['owner']
      assert_equal 'blocked', data['policies'][bay['policy']]['usb']
      assert_equal 'priv_audit', data['logSources'].keys.first
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
      assert_equal %w[adel_runbook olu_notes olu_folder].sort, ids.sort
      refute_includes ids, 'uma_todo'
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
end
