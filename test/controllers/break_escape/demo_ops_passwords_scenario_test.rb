require 'test_helper'
require 'open3'
require_relative '../../support/network_ops_scenario'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops showcase P-T (SHOWCASE_PLAN.md 8.3, 8.4): the real scenarios/demo_ops_passwords/scenario.json.erb driven
  # through the routes, each assertion read from a re-read game or a fresh answer. The browser part (toasts, the
  # taskbar marker, the cracker's countdown bar, the feed kiosk, the office-life windows) is PLAYTEST.md's. The last
  # case passes every answer of a whole played run through the leak scanner and asserts no finding.
  class DemoOpsPasswordsScenarioTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests
    include ActiveSupport::Testing::TimeHelpers

    ROOT = File.expand_path('../../..', __dir__)
    SCENARIO_PATH = File.join(ROOT, 'scenarios/demo_ops_passwords/scenario.json.erb')
    AUDIT = 'signin_log'.freeze
    T0 = Time.zone.local(2026, 11, 25, 12, 0, 0)
    # The scenario's own secrets, held here as constants (SHOWCASE_PLAN.md rule 7).
    DELPHINE = %w[darvanitis Pepper2016].freeze
    GRAHAM = %w[gwhitfield Brindle-Copper-Gate-52].freeze
    PRINTER = %w[svc_printer Brindle-Copper-Gate-52].freeze
    JULIAN_PASSWORD = 'Ferrous-Lantern-Quill-84'.freeze
    PASSWORDS = [DELPHINE[1], GRAHAM[1], JULIAN_PASSWORD, 'Marlow-Quarry-Tide-71', 'Cobalt-Fennel-Rook-38'].freeze
    FACTS = %w[delphine_dog_name delphine_dog_year].freeze
    PCS = %w[delphine_pc jun_pc graham_pc partner_pc hot_desk].freeze
    ROOMS = %w[office kitchen it_room partner_office].freeze
    # S5b and S5c (P-S5): the appended accounts, held here as constants like the rest.
    JUN = %w[jwatanabe Biscuit123].freeze
    NIAMH = %w[ndoherty Welcome2024].freeze
    DESKADMIN = %w[deskadmin Spring2026].freeze
    NEW_PASSWORDS = [JUN[1], NIAMH[1], DESKADMIN[1]].freeze
    CAST = %w[delphine_arvanitis graham_whitfield julian_sallow jun_watanabe niamh_doherty printer_svc ama_owusu].freeze

    def scenario
      JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
    end

    def build(data = scenario, player_state = {})
      start = data['startItemsInInventory'].map(&:dup)
      build_network_game({ 'currentRoom' => 'office', 'unlockedRooms' => ROOMS.dup, 'encounteredNPCs' => CAST.dup,
                           'inventory' => start }.merge(player_state), data)
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

    def keyring
      get game_path('keyring'), as: :json
      assert_response :success, response.body
      response.parsed_body
    end

    def row(id)
      keyring['entries'].find { |e| e['id'] == id }
    end

    def crack(hash_id, facts = [])
      post game_path('crack'), params: { hash_id: hash_id, facts: facts }, as: :json
      response.parsed_body
    end

    def earned
      fresh.earned_fact_ids
    end

    def take_file(id, name)
      body = add_item('text_file', id, name)
      assert_response :success, body.to_s
      assert_includes held_ids, id
    end

    def open_container(id)
      body = unlock_object(id, 'unlocked')
      assert_response :success, body.to_s
    end

    def take_records
      open_container('secure_bin')
      take_file('delphine_record_file', 'delphine_record.dat')
      take_file('graham_record_file', 'graham_record.dat')
      take_file('julian_record_file', 'julian_record.dat')
    end

    def take_photo
      body = add_item('notes1', 'delphine_photo', 'Photo on Delphine\'s desk')
      assert_response :success, body.to_s
    end

    def serve_feed_post
      post feed_post_game_url(@game), params: { npc_id: 'delphine_arvanitis' }, as: :json
      assert_response :success, response.body
      response.parsed_body
    end

    def take_note
      open_container('printer_cupboard')
      take_file('printer_admin_note', 'Printer admin.txt')
    end

    def remove(item_id, used_on)
      post game_path('inventory'), params: { action_type: 'remove', item: { id: item_id }, used_on: used_on }, as: :json
      response.parsed_body
    end

    def implant(pc = 'partner_pc')
      post game_path('network/implant'), params: { pc_id: pc, shape: 'session' }, as: :json
      response.parsed_body
    end

    def level(pc)
      fresh.session_access(pc)
    end

    def desktop_ids(pc)
      get game_path("container/#{pc}"), as: :json
      assert_response :success, response.body
      Array(response.parsed_body['contents']).map { |c| c['id'] }
    end

    def reader_rows
      get game_path('log_rows'), params: { object_id: 'signin_log_pc' }, as: :json
      assert_response :success, response.body
      response.parsed_body
    end

    # ---- the scenario's shape ---------------------------------------------------------------

    test 'the validator reports no error' do
      out, status = Open3.capture2e('ruby', 'scripts/validate_scenario.rb', SCENARIO_PATH, '--no-graph', chdir: ROOT)
      assert status.success?, out.last(2000)
      assert_match(/Result: 0 errors/, out)
    end

    test 'mapping indexes have not drifted' do
      out, status = Open3.capture2e('ruby', 'tools/check_mapping_index_drift.rb', chdir: ROOT)
      assert status.success?, out
    end

    test 'every sign-in PC has an access list and none admits the service role' do
      data = scenario
      pcs = data['rooms'].values.flat_map { |r| Array(r['objects']) }.select { |o| o['lockType'] == 'login' }
      assert_equal PCS.sort, pcs.map { |o| o['id'] }.sort
      pcs.each do |pc|
        refute_nil pc['access'], "#{pc['id']} has no access list"
        refute_includes Array(pc.dig('access', 'roles')), 'service', pc['id']
      end
      assert_equal 'service', data['rooms']['it_room']['npcs'].find { |n| n['id'] == 'printer_svc' }['role']
      assert_equal %w[deskadmin graham_whitfield], data['rooms'].values.flat_map { |r| Array(r['npcs']) }.select { |n| n.dig('creds', 'admin') }.map { |n| n['id'] }.sort
    end

    test 'the levers are counters with the section 4 shape, and the reported ticks are gated on what makes them possible' do
      data = scenario
      npcs = data['rooms'].values.flat_map { |r| Array(r['npcs']) }.index_by { |n| n['id'] }
      delphine = npcs['delphine_arvanitis']
      { 'coffee_call' => 'caffeine', 'ask_weekend' => 'social_media' }.each do |global, need|
        assert_equal 0, data['globalVariables'][global], global
        m = delphine['eventMappings'].find { |e| e['eventPattern'] == "global_variable_changed:#{global}" }
        refute_nil m, global
        assert_equal 0, m['cooldown'], global
        assert_nil m['condition'], global
        assert_operator m.dig('needs', 'set', need), :<, delphine.dig('needs', need, 'urgentAt'), global
      end
      ama = npcs['ama_owusu']['eventMappings']
      { 'kitchen' => 'kitchen_seen', 'it_room' => 'it_room_seen', 'partner_office' => 'partner_office_seen' }.each do |room, global|
        assert(ama.any? { |m| m['eventPattern'] == "room_entered:#{room}" && m.dig('setGlobal', global) == true }, room)
        assert_equal false, data['globalVariables'][global], global
      end
      assert_equal "data.username === 'darvanitis'", ama.find { |m| m['eventPattern'] == 'pc_signed_in:delphine_pc' }['condition']
      ink = File.read(File.join(ROOT, 'scenarios/demo_ops_passwords/ink/ama_owusu.ink'))
      lunch = ink[/=== lever_lunch ===.*?(?====)/m]
      assert_includes lunch, 'not (kitchen_seen and it_room_seen and partner_office_seen)', 'lunch waits until every room an NPC needs is loaded'
      assert_match(/\+ \{ not earn_facts_done and se_intel_delphine_dog_name and se_intel_delphine_dog_year \}/, ink)
      assert_match(/\+ \{ admin_signin_done and not profile_read_done \}/, ink)
    end

    test 'the log seed has exactly one night-time failure, and it is the anomaly' do
      data = scenario
      night = data['logSources']['signin_log']['seedRows'].select { |r| r['event'] == 'signin_fail' && r['at'] =~ /\A\w+ 0[0-5]:/ }
      assert_equal %w[s2], night.map { |r| r['id'] }
      reader = data['rooms']['it_room']['objects'].find { |o| o['id'] == 'signin_log_pc' }
      assert_equal 's2', reader.dig('minigameData', 'anomaly', 'rowId')
    end

    test 'no password appears in ink, notices, objectives or the mission file outside creds and the printer note' do
      files = Dir[File.join(ROOT, 'scenarios/demo_ops_passwords/ink/*.{ink,json}')] + [File.join(ROOT, 'scenarios/demo_ops_passwords/mission.json')]
      files.each do |path|
        text = File.read(path)
        PASSWORDS.each { |pw| refute_includes text, pw, "#{File.basename(path)} holds a password" }
      end
      stripped = scenario
      stripped['rooms'].each_value { |r| Array(r['npcs']).each { |n| n.delete('creds') } }
      stripped['rooms']['office']['objects'].find { |o| o['id'] == 'printer_cupboard' }['contents'].clear
      text = stripped.to_json
      PASSWORDS.each { |pw| refute_includes text, pw }
    end

    test 'a new game lists no hash row and holds no crack state' do
      build
      assert_empty keyring['entries'].select { |e| e['kind'] == 'hash' }
      assert_empty earned
      assert_empty Array(state['crackedAccounts'])
    end

    test 'the boot answer holds no password, recipe or crack state key' do
      build
      body = bootstrap_scenario
      assert_response :success, body.to_s
      PASSWORDS.each { |pw| refute_includes response.body, pw }
      %w[crackRuns crackStarted crackedAccounts earnedFacts passwordDifficulty revealsFacts].each { |k| refute_includes response.body, k }
      refute_includes response.body, '"crack"'
    end

    # ---- P1, P2 and P3: the records, the facts, the guessable one -------------------------------

    test 'P1: the three record files from the bin are three ready rows, with no password on them' do
      build
      open_container('secure_bin')
      get game_path('container/secure_bin'), as: :json
      assert_response :success, response.body
      assert_equal %w[delphine_record_file graham_record_file julian_record_file], response.parsed_body['contents'].map { |c| c['id'] }
      take_records
      hashes = keyring['entries'].select { |e| e['kind'] == 'hash' }
      assert_equal %w[delphine_hash graham_hash julian_hash], hashes.map { |e| e['id'] }.sort
      assert(hashes.all? { |e| e['status'] == 'ready' })
      assert_equal true, row('graham_hash')['salted']
      assert_equal false, row('delphine_hash')['salted']
      assert_empty rows.select { |r| r['event'].to_s.include?('take') }
      PASSWORDS.each { |pw| refute_includes response.body, pw }
    end

    test 'P2 and P3: facts from the photo and the feed, then missing, wrong and right picks all answer at once' do
      travel_to T0 do
        build
        take_records
        # no fact yet: the pick of a fact not earned is refused, and a bare press says two are missing
        post game_path('crack'), params: { hash_id: 'delphine_hash', facts: ['delphine_dog_year'] }, as: :json
        assert_response :unprocessable_entity
        assert_equal 'fact_not_held', response.parsed_body['reason']
        body = crack('delphine_hash')
        assert_equal 'needMoreFacts', body['status']
        assert_equal 2, body['missingCount']
        # the photo: one fact
        take_photo
        assert_equal %w[delphine_dog_name], earned
        body = crack('delphine_hash', %w[delphine_dog_name])
        assert_equal 'needMoreFacts', body['status']
        assert_equal 1, body['missingCount']
        assert_nil body['readyInSeconds']
        # the feed post: the other fact
        served = serve_feed_post
        refute_nil served['post'], served.to_s
        assert_equal %w[delphine_dog_name delphine_dog_year], earned.sort
        assert_equal FACTS.sort, keyring['crackFacts'].sort
        # a wrong pick answers no match at once, with no wait
        body = crack('delphine_hash', %w[delphine_dog_name])
        assert_equal 'nomatch', body['status']
        assert_equal 'ready', row('delphine_hash')['status']
        assert_nil row('delphine_arvanitis.cracked')
        # the right pick answers cracked at once
        body = crack('delphine_hash', FACTS.reverse)
        assert_equal 'cracked', body['status']
        refute_includes response.body, DELPHINE[1]
        cracked = row('delphine_arvanitis.cracked')
        assert_equal DELPHINE[1], cracked['password']
        assert_equal 'cracked', cracked['source']
        assert_equal DELPHINE[0], cracked.dig('account', 'username')
        assert_equal 'cracked', row('delphine_hash')['status']
        assert_equal %w[delphine_arvanitis], state['crackedAccounts']
        assert_empty rows.select { |r| r['event'].to_s.include?('crack') }
      end
    end

    test 'the feed post that carries the year is served first, whatever else the feed holds' do
      build
      body = serve_feed_post
      refute_nil body['post'], body.to_s
      assert_equal %w[delphine_dog_year], earned
    end

    # ---- P4 and P5: reuse with a wait, and the one that never falls ---------------------------------

    test 'P4: a press before the note ends no match even if the note is taken during the wait, then the next press cracks' do
      travel_to T0 do
        build
        take_records
        body = crack('graham_hash')
        assert_equal 'running', body['status']
        assert_equal 20, body['readyInSeconds']
        assert_equal %w[readyInSeconds status success], body.keys.sort
        travel 8.seconds
        take_note
        assert_equal 'running', crack('graham_hash')['status'], 'a press inside the wait reads no pick'
        assert_equal 12, row('graham_hash')['readyInSeconds']
        travel 13.seconds
        assert_equal 'nomatch', crack('graham_hash')['status'], 'the verdict was fixed when the run began'
        assert_equal 'ready', row('graham_hash')['status']
        assert_nil row('graham_whitfield.cracked')
        # a second run starts after the note is held, waits again and cracks
        body = crack('graham_hash')
        assert_equal 'running', body['status']
        assert_equal 20, body['readyInSeconds']
        travel 21.seconds
        body = crack('graham_hash')
        assert_equal 'cracked', body['status']
        refute_includes response.body, GRAHAM[1]
        assert_equal GRAHAM[1], row('graham_whitfield.cracked')['password']
        assert_equal 'cracked', row('graham_hash')['status']
        assert_equal %w[graham_whitfield], state['crackedAccounts']
      end
    end

    test 'P4: with the note taken first the run cracks after its wait and not before' do
      travel_to T0 do
        build
        take_records
        take_note
        assert_equal 'running', crack('graham_hash')['status']
        travel 19.seconds
        assert_equal 'running', crack('graham_hash')['status']
        travel 2.seconds
        assert_equal 'cracked', crack('graham_hash')['status']
        assert_equal GRAHAM[1], row('graham_whitfield.cracked')['password']
      end
    end

    test 'P4: a reload keeps the countdown, it does not restart' do
      travel_to T0 do
        build
        take_records
        take_note
        crack('graham_hash')
        travel 5.seconds
        assert_equal 15, row('graham_hash')['readyInSeconds']
        get game_path('keyring'), params: { rev: response.parsed_body['rev'] }, as: :json
        assert_equal({ 'graham_hash' => 15 }, response.parsed_body['readyInSeconds'])
      end
    end

    test 'P5: the strong record says no match once, then that it will not fall, and never cracks' do
      build
      take_records
      body = crack('julian_hash')
      assert_equal 'nomatch', body['status']
      assert_equal 1, body['runs']
      assert_equal 'ready', row('julian_hash')['status']
      assert_equal 'infeasible', crack('julian_hash')['status']
      assert_equal 'infeasible', row('julian_hash')['status']
      assert_equal 'infeasible', crack('julian_hash')['status']
      assert_nil row('julian_sallow.cracked')
      assert_equal 2, state['crackRuns']['julian_hash']
      assert_empty Array(state['crackedAccounts'])
      refute_includes response.body, JULIAN_PASSWORD
    end

    test 'P5: the strong record never falls, even with both facts earned and picked and the note held' do
      travel_to T0 do
        build
        take_records
        take_photo
        serve_feed_post
        take_note
        assert_equal FACTS.sort, earned.sort
        body = crack('julian_hash', FACTS)
        assert_equal 'nomatch', body['status']
        assert_equal 1, body['runs']
        assert_equal 'infeasible', crack('julian_hash', FACTS)['status']
        assert_equal 'infeasible', crack('julian_hash')['status']
        assert_equal 'infeasible', row('julian_hash')['status']
        assert_nil row('julian_sallow.cracked')
        assert_equal 2, state['crackRuns']['julian_hash']
        refute_includes Array(state['crackedAccounts']), 'julian_sallow'
        refute_includes response.body, JULIAN_PASSWORD
      end
    end

    # ---- P6: user sign-in, the printer account, the USB policy --------------------------------------

    test 'P6: the cracked password signs in at Delphine\'s PC as a user, with no access level, and the stick is refused' do
      build
      body = sign_in('delphine_pc', *DELPHINE)
      assert body['success'], body.to_s
      refute body.key?('access'), body.to_s
      assert_equal 'user', level('delphine_pc')
      body = remove('kit_stick', 'desk_usb_port')
      assert_response :unprocessable_entity, body.to_s
      assert_equal 'usb_refused', body['reason']
      assert_includes held_ids, 'kit_stick'
      assert_empty Array(state['plantedItems'])
      assert_equal 1, rows('signin_ok').size
      assert_equal({ 'account' => DELPHINE[0] }, rows('signin_ok').first['as'])
    end

    test 'P6: the printer account is refused at every PC, with its own correct password, and no session opens' do
      build
      take_note
      PCS.each do |pc|
        body = sign_in(pc, *PRINTER)
        refute body['success'], "#{pc}: #{body}"
        assert_nil level(pc), pc
      end
      assert_empty state['sessions'].to_h
    end

    test 'the owner-only PCs refuse an ordinary account that is not named' do
      build
      body = sign_in('partner_pc', *DELPHINE)
      refute body['success'], body.to_s
      body = sign_in('graham_pc', *DELPHINE)
      refute body['success'], body.to_s
      assert_nil level('partner_pc')
    end

    # ---- P7 and P8: the administrator's reach, the profile read and the override ---------------------------------

    test 'P7: Graham signs in at the partner PC as an administrator, reads Julian\'s folder once, and the user cannot' do
      build
      body = sign_in('partner_pc', *GRAHAM)
      assert body['success'], body.to_s
      assert_equal 'admin', body['access']
      assert_equal 'admin', level('partner_pc')
      ids = desktop_ids('partner_pc')
      assert_includes ids, 'julian_client_files'
      get game_path('container/julian_client_files'), as: :json
      assert_response :success, response.body
      assert_equal %w[julian_client_note], response.parsed_body['contents'].map { |c| c['id'] }
      assert_equal 1, rows('admin_profile_read').size
      read = rows('admin_profile_read').first
      assert_equal({ 'account' => GRAHAM[0] }, read['as'])
      assert_equal({ 'kind' => 'pc', 'id' => 'partner_pc' }, read['where'])
      get game_path('container/julian_client_files'), as: :json
      assert_equal 1, rows('admin_profile_read').size, 'a reopen stores none'
    end

    test 'P7: a user session at Delphine\'s PC cannot read the partner\'s folder' do
      build
      assert sign_in('delphine_pc', *DELPHINE)['success']
      get game_path('container/julian_client_files'), as: :json
      assert_response :forbidden
      refute_includes response.body, 'Harrow Lane'
      assert_empty rows('admin_profile_read')
    end

    test 'free play: the note\'s password typed for Graham signs in at his own PC (the reuse done by hand), a wrong one is a failed row' do
      build
      take_note
      body = sign_in('graham_pc', 'gwhitfield', 'not-the-password')
      refute body['success'], body.to_s
      assert_equal 1, rows('signin_fail').size
      sign_in('graham_pc', 'gwhitfield', 'not-the-password')
      assert_equal 1, rows('signin_fail').size, 'the failures merge into one row'
      assert_equal 2, rows('signin_fail').first['n'].to_i, 'the merged row counts every failure'
      # the password read from the note's own text, typed for Graham's account
      note = scenario['rooms']['office']['objects'].find { |o| o['id'] == 'printer_admin_note' } ||
             scenario['rooms']['office']['objects'].find { |o| o['id'] == 'printer_cupboard' }['contents'].find { |c| c['id'] == 'printer_admin_note' }
      account, typed = note['text'].lines.last.strip.split(' / ')
      assert_equal PRINTER[0], account
      body = sign_in('graham_pc', GRAHAM[0], typed)
      assert body['success'], body.to_s
      assert_equal 'admin', level('graham_pc')
    end

    test 'free play: Graham\'s PC has its own policy, and a third wrong password locks the account out' do
      build
      assert_equal 3, scenario['policies']['it_desk']['maxAttempts']
      pc = scenario['rooms']['it_room']['objects'].find { |o| o['id'] == 'graham_pc' }
      assert_equal 'it_desk', pc['policy']
      3.times { sign_in('graham_pc', 'gwhitfield', 'not-the-password') }
      assert_equal 3, rows('signin_fail').first['n'].to_i
      assert_equal 1, rows('signin_lockout').size, 'the lockout is logged'
      body = sign_in('graham_pc', GRAHAM[0], 'whatever')
      refute body['success'], 'a locked-out account is refused'
    end

    test 'P8: the keystroke device is accepted at the partner PC in an administrator session, once, and logs the override' do
      build
      sign_in('partner_pc', *GRAHAM)
      body = implant
      assert_response :success, body.to_s
      assert_equal true, body['success']
      refute_includes held_ids, 'kit_badusb'
      assert_includes state['footholds'].keys, 'implant_partner_pc'
      override = rows('usb_install_overridden')
      assert_equal 1, override.size
      assert_equal({ 'device' => 'hid' }, override.first['detail'])
      assert_equal({ 'account' => GRAHAM[0] }, override.first['as'])
      assert_equal 1, state['footholds'].keys.grep(/partner_pc/).size
    end

    test 'P8: with no session at the partner PC the device answers not ready and stays held' do
      build
      body = implant
      refute body['success'], body.to_s
      assert_includes held_ids, 'kit_badusb'
      assert_empty rows('usb_install_overridden')
      assert_empty state['footholds'].to_h
    end

    test 'P8: a user-level session at Delphine\'s PC cannot place the device there (no socket object, no override)' do
      build
      sign_in('delphine_pc', *DELPHINE)
      body = implant('delphine_pc')
      refute body['success'], body.to_s
      assert_includes held_ids, 'kit_badusb'
      assert_empty rows('usb_install_overridden')
    end

    test 'a locked administrator session overrides nothing' do
      build
      sign_in('partner_pc', *GRAHAM)
      post game_path('lock_session'), params: { pc_id: 'partner_pc' }, as: :json
      assert_response :success, response.body
      assert_nil level('partner_pc')
      body = implant
      refute body['success'], body.to_s
      assert_includes held_ids, 'kit_badusb'
      assert_empty rows('usb_install_overridden')
    end

    # ---- the tour (SHOWCASE_TOUR_PLAN.md 2.5): order, gate, P8b, the collects, the barks ---------------

    test 'tour: the aims run morning, midday, afternoon, evening, and the midday aim ends with the stick override' do
      data = scenario
      assert_equal %w[morning midday afternoon_cache evening], data['objectives'].sort_by { |o| o['order'] }.map { |o| o['aimId'] }
      assert_equal [0, 1, 2, 3], data['objectives'].map { |o| o['order'] }.sort
      midday = data['objectives'].find { |o| o['aimId'] == 'midday' }
      assert_equal 'stick_override', midday['tasks'].last['taskId']
      assert_equal true, data['ttsPregenerateChatter']
      %w[stick_override stick_override_done collect_after_borrow_done].each do |g|
        assert_equal false, data['globalVariables'][g], "#{g} is a declared scenario global (ink reads only declared globals)"
      end
    end

    test 'tour: the ink declares the new tour variables and holds the day-end gate and the collect gates' do
      ink = File.read(File.join(ROOT, 'scenarios/demo_ops_passwords/ink/ama_owusu.ink'))
      %w[stick_override_done collect_after_borrow_done].each { |v| assert_match(/^VAR #{v} = false$/, ink) }
      day = ink[/=== lever_day_end ===.*?(?====)/m]
      %w[earn_facts get_records crack_guessable crack_reused crack_strong user_signin usb_refused admin_signin profile_read override
         stick_override collect_partner collect_hot_desk see_borrow collect_after_borrow crack_cached local_account local_refused].each do |t|
        assert_includes day, "#{t}_done", "the day-end gate waits for #{t}"
      end
      assert_includes day, 'lever_day_refused'
      refute_includes day, 'read_log_done', 'the gate never waits for the evening task'
      assert_includes ink, '+ { hot_desk_signin_done and not see_borrow_done and not collect_hot_desk_done } [I collected at the hot desk.]'
      # round 1 m4: once the borrow is seen the player says which came first, so the reply is true of what they saw
      assert_includes ink, "+ { hot_desk_signin_done and see_borrow_done and not collect_hot_desk_done } [I collected at the hot desk before Jun borrowed it.]\n    -> tell_collect_hot_desk\n"
      assert_includes ink, "+ { hot_desk_signin_done and see_borrow_done and not collect_hot_desk_done } [I collected at the hot desk after Jun borrowed it.]\n    -> tell_collect_hot_desk_late\n"
      assert_includes ink, '+ { see_borrow_done and collect_hot_desk_done and not collect_after_borrow_done } [I collected there again.]'
      assert_includes ink, '+ { not act_evening and not jun_pc_off and collect_hot_desk_done } [Switch Jun\'s PC off.]'
      refuse = ink[/=== lever_day_refused ===.*?(?====)/m]
      assert_includes refuse, '-> day_end_go', 'the skip goes straight home, with no second warning (round 1 m3)'
      late = ink[/=== tell_collect_hot_desk_late ===.*?(?====)/m]
      assert_includes late, '#complete_task:collect_after_borrow', 'a borrow-first collect ticks both beats'
      assert_includes late, '#complete_task:collect_hot_desk'
    end

    test 'tour: the barks are appended after the old mappings, gated, and name no secret' do
      data = scenario
      ama = data['rooms'].values.flat_map { |r| Array(r['npcs']) }.find { |n| n['id'] == 'ama_owusu' }['eventMappings']
      old_last = ama.index { |m| m['eventPattern'] == 'pc_signed_in:hot_desk' && m['completeTask'] == 'local_account' }
      tour = ama[(old_last + 1)..]
      assert_equal %w[stick_override get_records_done user_signin_done usb_refused_done admin_signin_done see_borrow_done local_account_done read_log_done].map { |g| "global_variable_changed:#{g}" },
                   tour.map { |m| m['eventPattern'] }
      tour.each do |m|
        assert_equal true, m['onceOnly']
        assert_equal 0, m['cooldown']
        assert_operator m['bark'].split.size, :<=, 30
        PASSWORDS.each { |pw| refute_includes m['bark'], pw }
      end
      tour.drop(1).each { |m| assert_includes m['condition'], 'data.oldValue !== true' }
      tick = tour.first
      assert_equal 'stick_override', tick['completeTask']
      assert_equal({ 'stick_override_done' => true }, tick['setGlobal'])
    end

    test 'tour: every voice is the shared wording and the stale firm wording is gone' do
      npcs = scenario['rooms'].values.flat_map { |r| Array(r['npcs']) }.index_by { |n| n['id'] }
      assert_includes npcs['ama_owusu']['voice']['style'], "Security lead on Merrin & Sallow's outsourced IT provider (Fenlow Managed IT)"
      assert_includes npcs['delphine_arvanitis']['voice']['style'], 'poised and polite under a little pressure at the desk'
      assert_includes npcs['julian_sallow']['voice']['style'], 'sits on planning panels'
      voices = npcs.values.map { |n| n.dig('voice', 'name') }.compact
      assert_equal voices.uniq.size, voices.size, 'no two speakers share a voice name'
    end

    # P8b: a stick the desk policy refuses for a user goes through in an administrator's session at the same PC (ruling A).
    test 'P8b: the desk port refuses with no session and with a user session, and takes the stick in Graham\'s session at Delphine\'s PC, logging an override' do
      build
      port = scenario['rooms']['office']['objects'].find { |o| o['id'] == 'desk_usb_port' }
      assert_equal 'delphine_pc', port['portOf']
      confirm = port['triggerOnInteract'].find { |a| a['type'] == 'confirm_action' }
      assert_includes confirm['onConfirm'], { 'type' => 'set_global', 'key' => 'stick_override', 'value' => true }
      # round 1 m7: the confirm waits for P6b, and an administrator's session before it gets a pointer back
      assert_equal 'globalVars.usb_refused_done', confirm['condition']
      assert_equal '!globalVars.usb_refused_done', port['triggerOnInteract'].first['condition']
      body = remove('kit_stick', 'desk_usb_port')
      assert_response :unprocessable_entity, body.to_s
      assert_includes held_ids, 'kit_stick'
      sign_in('delphine_pc', *DELPHINE)
      body = remove('kit_stick', 'desk_usb_port')
      assert_response :unprocessable_entity, body.to_s
      assert_includes held_ids, 'kit_stick'
      assert_empty rows('usb_install_overridden')
      logout('delphine_pc')
      body = sign_in('delphine_pc', *GRAHAM)
      assert body['success'], body.to_s
      assert_equal 'admin', level('delphine_pc')
      body = remove('kit_stick', 'desk_usb_port')
      assert_response :success, body.to_s
      refute_includes held_ids, 'kit_stick'
      assert_equal 1, Array(state['plantedItems']).size
      override = rows('usb_install_overridden')
      assert_equal 1, override.size
      assert_equal({ 'device' => 'storage' }, override.first['detail'])
      assert_equal({ 'account' => GRAHAM[0] }, override.first['as'])
    end

    test 'P8b: a locked administrator session at Delphine\'s PC does not take the stick either' do
      build
      sign_in('delphine_pc', *GRAHAM)
      post game_path('lock_session'), params: { pc_id: 'delphine_pc' }, as: :json
      assert_response :success, response.body
      body = remove('kit_stick', 'desk_usb_port')
      assert_response :unprocessable_entity, body.to_s
      assert_includes held_ids, 'kit_stick'
      assert_empty rows('usb_install_overridden')
    end

    # ---- P9: the log ----------------------------------------------------------------------------------

    test 'P9: the sign-in log reader lists the seed rows with the 02:10 failure, and the player\'s own rows after a run' do
      build
      body = reader_rows
      assert_equal 'Sign-in log', body['title']
      seed = body['rows'].map { |r| r['id'] }
      assert_includes seed, 's2'
      assert_equal 6, body['rows'].size
      sign_in('partner_pc', *GRAHAM)
      get game_path('container/julian_client_files'), as: :json
      implant
      after = reader_rows['rows']
      events = after.map { |r| r['event'] }
      assert_includes events, 'SIGN_IN'
      assert_includes events, 'ADMIN_READ'
      assert_includes events, 'USB_OVERRIDE'
      assert_equal 9, after.size
      refute_includes after.to_json, GRAHAM[1]
      refute_includes after.to_json, JULIAN_PASSWORD
    end

    test 'a crack, a take and a feed post leave no row of their own' do
      travel_to T0 do
        build
        take_records
        take_photo
        serve_feed_post
        before = rows
        crack('delphine_hash', FACTS)
        crack('julian_hash')
        assert_equal before, rows
      end
    end

    # ---- the whole run ----------------------------------------------------------------------------------

    def captured
      @captured ||= []
    end

    %i[get post patch put delete].each do |verb|
      define_method(verb) do |*args, **opts, &blk|
        result = super(*args, **opts, &blk)
        text = response.body.to_s
        parsed = begin
          JSON.parse(text)
        rescue JSON::ParserError
          nil
        end
        entry = { 'method' => request.request_method, 'path' => request.path, 'status' => response.status }
        entry[parsed.nil? ? 'bodyText' : 'body'] = parsed.nil? ? text : parsed
        # The browser capture tags each inventory change (action, item, used on); the scanner reads the tag to
        # know which files the player holds, so the tag is written here from the request the same way.
        if request.request_method == 'POST' && request.path.end_with?('/inventory')
          sent = request.request_parameters
          entry['inv'] = { 'action' => sent['action_type'], 'itemId' => sent.dig('item', 'id'), 'usedOn' => sent['used_on'] }
        end
        captured << entry
        result
      end
    end

    # The whole played day, in the order PLAYTEST.md plays it, with every assertion in place.
    def play_whole_run
      travel_to T0 do
        build
        bootstrap_scenario
        ROOMS.each { |room| get game_path("room/#{room}"), as: :json }
        # P1 and P2
        take_records
        take_photo
        assert_equal 'needMoreFacts', crack('delphine_hash', %w[delphine_dog_name])['status']
        serve_feed_post
        # P3
        assert_equal 'nomatch', crack('delphine_hash', %w[delphine_dog_name])['status']
        assert_equal 'cracked', crack('delphine_hash', FACTS)['status']
        assert_equal DELPHINE[1], row('delphine_arvanitis.cracked')['password']
        # P4: a press before the note, the note taken inside the wait, a second press after
        assert_equal 'running', crack('graham_hash')['status']
        travel 8.seconds
        take_note
        travel 13.seconds
        assert_equal 'nomatch', crack('graham_hash')['status']
        assert_equal 'running', crack('graham_hash')['status']
        travel 21.seconds
        assert_equal 'cracked', crack('graham_hash')['status']
        assert_equal GRAHAM[1], row('graham_whitfield.cracked')['password']
        # P5
        assert_equal 'nomatch', crack('julian_hash')['status']
        assert_equal 'infeasible', crack('julian_hash')['status']
        keyring
        # P6
        @signins = []
        counts = Hash.new(0)
        sign = lambda do |pc, creds|
          body = sign_in(pc, *creds)
          if body['success']
            counts[body['npcId']] += 1
            @signins << "#{body['npcId']}@#{pc}##{counts[body['npcId']]}"
          end
          body
        end
        assert sign.call('delphine_pc', [DELPHINE[0], row('delphine_arvanitis.cracked')['password']])['success']
        desktop_ids('delphine_pc')
        body = remove('kit_stick', 'desk_usb_port')
        assert_equal 'usb_refused', body['reason']
        refute sign.call('graham_pc', PRINTER)['success']
        refute sign.call('partner_pc', PRINTER)['success']
        post game_path('logout'), params: { pc_id: 'delphine_pc' }, as: :json
        # P7
        body = sign.call('partner_pc', [GRAHAM[0], row('graham_whitfield.cracked')['password']])
        assert_equal 'admin', body['access']
        assert_includes desktop_ids('partner_pc'), 'julian_client_files'
        get game_path('container/julian_client_files'), as: :json
        assert_response :success, response.body
        # P8
        body = implant
        assert_equal true, body['success'], body.to_s
        network_view('implant_partner_pc')
        # P8b (round 1 m5): the same stick in Graham's session at Delphine's PC goes through, so the scan judges it too
        body = sign.call('delphine_pc', [GRAHAM[0], row('graham_whitfield.cracked')['password']])
        assert_equal 'admin', body['access']
        body = remove('kit_stick', 'desk_usb_port')
        assert_response :success, body.to_s
        refute_includes held_ids, 'kit_stick'
        @signin_counts = counts   # the afternoon numbers Graham's later sign-ins on from these
        # reload, then P9
        bootstrap_scenario
        desktop_ids('partner_pc')
        reader = reader_rows
        assert_includes reader['rows'].map { |r| r['id'] }, 's2'
        assert_equal 2, reader['rows'].count { |r| r['event'] == 'USB_OVERRIDE' }, 'the keystroke device and the stick each leave an override row'
        assert_equal %w[delphine_arvanitis graham_whitfield], state['crackedAccounts'].sort
        assert_equal 2, state['crackRuns']['julian_hash']
      end
    end

    test 'the whole run: records, facts, three cracks, both sign-ins, the refusal, the read, the override and the log' do
      play_whole_run
      assert_operator captured.size, :>, 40
      shapes = captured.select { |r| r['path'].end_with?('/crack') && r['method'] == 'POST' }
                       .map { |r| r['body'].is_a?(Hash) ? (r['body']['status'] || r['body']['reason']) : nil }.uniq.compact.sort
      assert_equal %w[cracked infeasible needMoreFacts nomatch running], shapes
    end

    # The scanner lists the hash row's `heldItem` key since Track A's fix (c153103d8), so the raw run is scanned as it is.
    def scan_run(rows)
      lines = rows.each_with_index.map { |r, i| ['run.jsonl', i + 1, r] }
      AccessLeakScanner.new(scenario, game: Game.find(@game.id)).scan(lines, signins: @signins)
    end

    test 'the leak scanner judges every answer of the whole run clean' do
      play_whole_run
      assert_operator captured.size, :>, 40
      assert_equal [], scan_run(captured).map { |f| [f.line, f.rule, f.owner, f.route] }
    end

    test 'the scanner is not blind: the same run with a password put into a keyring answer is a finding' do
      play_whole_run
      rows_copy = Marshal.load(Marshal.dump(captured))
      last = rows_copy.rindex { |r| r['method'] == 'GET' && r['path'].end_with?('/keyring') && r['body'].is_a?(Hash) }
      rows_copy[last]['body']['entries'].find { |e| e['id'] == 'julian_hash' }['label'] = JULIAN_PASSWORD
      found = scan_run(rows_copy)
      refute_empty found
    end

    # ================================================================================================
    # P-S5: S5b (cached accounts, the borrow) and S5c (account kinds, domains, the shared desk account)
    # appended after the existing cases, which are unchanged but for the two shape lines the hot desk and the
    # shared account widen (the PC list and the administrator list).
    # ================================================================================================

    def harvest(pc, **extra)
      post game_path('harvest_credentials'), params: { pc_id: pc }.merge(extra), as: :json
      response.parsed_body
    end

    def logout(pc)
      post game_path('logout'), params: { pc_id: pc }, as: :json
    end

    def report(*reports)
      post npc_frustration_game_url(@game), params: { reports: reports }, as: :json
      (response.parsed_body.is_a?(Hash) && response.parsed_body['answers']) || flunk("#{response.status} #{response.body[0, 300]}")
    end

    def set_scenario_global(name, value)
      @game.reload
      @game.player_state['globalVariables'] ||= {}
      @game.player_state['globalVariables'][name] = value
      @game.save!
    end

    def take_cabinet_record
      open_container('backups_cabinet')
      take_file('desk_rounds_record_file', 'desk_rounds_record.dat')
    end

    # A sign-out the scanner needs named (a logout answer does not say which PC it was at): the n-th successful POST /logout of the run.
    def named_logout(pc, account)
      logout(pc)
      assert_response :success, response.body
      n = captured.count { |r| r['method'] == 'POST' && r['path'].end_with?('/logout') && r['status'] == 200 }
      (@logouts ||= []) << "#{account}@#{pc}##{n}"
    end

    # Jun's PC is off; he fails twice, the second reaching his `at` of 60, and the borrow is handed over and made.
    def make_jun_borrow
      set_scenario_global('jun_pc_off', true)
      fail_report = { npc_id: 'jun_watanabe', event: 'fail', need: 'work', object_id: 'jun_pc', missing: [{ id: 'jun_pc', why: 'off' }] }
      report(npc_id: 'jun_watanabe', event: 'check', object_id: 'jun_pc')
      travel 10.seconds
      report(fail_report)
      travel 25.seconds
      run = report(fail_report).first['run']
      assert_equal 'borrow_session', run['do']
      assert_equal 'hot_desk', run['pc']
      assert_equal [], Array(state['cachedAt']), 'not cached by the hand-over alone'
      travel 65.seconds
      post npc_workaround_game_url(@game), params: { npc_id: 'jun_watanabe', index: run['index'], hand: run['hand'] }, as: :json
      assert_response :success, response.body
    end

    test 'P-S5 shape: the cached accounts, the borrow, the kinds and the domain are declared as planned, and the earlier accounts keep their reach' do
      data = scenario
      pcs = data['rooms'].values.flat_map { |r| Array(r['objects']) }.select { |o| o['lockType'] == 'login' }.index_by { |o| o['id'] }
      npcs = data['rooms'].values.flat_map { |r| Array(r['npcs']) }.index_by { |n| n['id'] }
      assert_equal [{ 'npc' => 'julian_sallow' }, { 'npc' => 'delphine_arvanitis' }], pcs['partner_pc']['cachedAccounts']
      assert_equal [{ 'npc' => 'niamh_doherty' }, { 'npc' => 'jun_watanabe', 'after' => 'borrow' }], pcs['hot_desk']['cachedAccounts']
      assert_nil pcs['hot_desk']['owner'], 'a hot desk is a PC nobody owns'
      assert_equal [{ 'at' => 60, 'do' => 'borrow_session', 'pc' => 'hot_desk' }], npcs['jun_watanabe']['workarounds']
      assert_equal 'jun_pc_off', pcs['jun_pc']['offWhen']
      assert_equal false, data['globalVariables']['jun_pc_off']
      assert_nil pcs['hot_desk']['access']['roles'].find { |r| r == 'service' }
      # every sign-in PC and every person account is in one domain, so every PC that admitted an account before still does
      assert_equal ['merrin'], pcs.values.map { |o| o['domain'] }.uniq
      persons = %w[delphine_arvanitis graham_whitfield julian_sallow jun_watanabe niamh_doherty]
      persons.each do |id|
        assert_equal 'domain', npcs[id]['creds']['accountKind'], id
        assert_equal 'merrin', npcs[id]['creds']['domain'], id
      end
      assert_nil npcs['printer_svc']['creds']['accountKind'], 'the printer account has no kind, and no PC admits it anyway'
      deskadmin = npcs['deskadmin']
      assert_equal true, deskadmin['accountOnly']
      assert_equal %w[delphine_pc hot_desk jun_pc], deskadmin['creds']['localTo'].sort
      assert_equal 'local', deskadmin['creds']['accountKind']
      assert_equal %w[accountOnly creds displayName id npcType role staff], deskadmin.keys.sort
      # one hash record per PC and cached account, and the shared account's record is a held file outside the bin
      creds = data['credentials']
      assert_equal 'hot_desk', creds['jun_cached']['proof']['harvested']
      assert_equal 'hot_desk', creds['niamh_cached_hot_desk']['proof']['harvested']
      assert_equal 'partner_pc', creds['delphine_cached_partner']['proof']['harvested']
      assert_equal 'partner_pc', creds['julian_cached_partner']['proof']['harvested']
      assert_equal 'desk_rounds_record_file', creds['desk_rounds_hash']['proof']['held']
      it_room = data['rooms']['it_room']['objects'].index_by { |o| o['id'] }
      assert_equal %w[delphine_record_file graham_record_file julian_record_file], it_room['secure_bin']['contents'].map { |c| c['id'] }
      assert_equal %w[desk_rounds_record_file], it_room['backups_cabinet']['contents'].map { |c| c['id'] }
      assert_includes data['logSources']['signin_log']['events'], 'credentials_harvested'
      assert_includes data['logSources']['signin_log']['events'], 'signin_refused'
      aim = data['objectives'].find { |o| o['aimId'] == 'afternoon_cache' }
      assert_equal %w[collect_partner collect_hot_desk see_borrow collect_after_borrow crack_cached local_account local_refused], aim['tasks'].map { |t| t['taskId'] }
      assert_equal 2, aim['order']
    end

    test 'P-S5: the appended passwords stay out of ink, notices, objectives and the mission file, and the name of the shared account stays out of every mapping and served text' do
      files = Dir[File.join(ROOT, 'scenarios/demo_ops_passwords/ink/*.{ink,json}')] + [File.join(ROOT, 'scenarios/demo_ops_passwords/mission.json')]
      files.each do |path|
        text = File.read(path)
        NEW_PASSWORDS.each { |pw| refute_includes text, pw, "#{File.basename(path)} holds a password" }
        refute_match(/deskadmin|Desk administrator/i, text, "#{File.basename(path)} names the shared account")
      end
      stripped = scenario
      stripped['rooms'].each_value { |r| Array(r['npcs']).each { |n| n.delete('creds') } }
      text = stripped.to_json
      NEW_PASSWORDS.each { |pw| refute_includes text, pw }
      # the account's own NPC carries the name; nothing else in the file may (the authored `credentials` label says "shared desk account")
      outside = stripped
      outside['rooms'].each_value { |r| Array(r['npcs']).reject! { |n| n['id'] == 'deskadmin' } }
      outside['credentials'].delete('desk_rounds_hash')
      refute_match(/deskadmin/i, outside.to_json.gsub(/"(?:id|account|credential)":\s*"deskadmin[a-z_]*"/, ''))
    end

    test 'P-S5: a new game holds no cached hash, and the boot answer names neither the shared account nor its password' do
      build
      assert_empty keyring['entries'].select { |e| e['kind'] == 'hash' }
      assert_empty Array(state['cachedAt'])
      assert_empty Array(state['harvestedAccounts'])
      bootstrap_scenario
      assert_response :success
      NEW_PASSWORDS.each { |pw| refute_includes response.body, pw }
      refute_match(/deskadmin|Desk administrator|cachedAccounts|harvest/i, response.body)
    end

    test 'P10: in Graham\'s admin session the partner PC gives Julian and Delphine as hashes, a second press nothing, and no password' do
      travel_to T0 do
        build
        assert sign_in('partner_pc', *GRAHAM)['success']
        body = harvest('partner_pc')
        assert_response :success, body.to_s
        assert_equal %w[julian_sallow delphine_arvanitis], body['harvested'].map { |r| r['npcId'] }
        assert_equal %w[julian_sallow delphine_arvanitis], body['held'].map { |r| r['npcId'] }
        assert_equal %w[julian_cached_partner delphine_cached_partner], body['held'].map { |r| r['hashId'] }
        assert_equal %w[displayName hashId npcId portrait avatar username].sort, body['held'].first.keys.sort
        NEW_PASSWORDS.each { |pw| refute_includes response.body, pw }
        [JULIAN_PASSWORD, DELPHINE[1]].each { |pw| refute_includes response.body, pw }
        again = harvest('partner_pc')
        assert_equal [], again['harvested']
        assert_equal 2, again['held'].size
        hashes = keyring['entries'].select { |e| e['kind'] == 'hash' }.map { |e| e['id'] }
        assert_equal %w[delphine_cached_partner julian_cached_partner], hashes.sort
        assert_equal 1, rows('credentials_harvested').size, 'one row for the press that added a pair, none for the repeat'
        assert_equal({ 'count' => 2 }, rows('credentials_harvested').first['detail'])
        assert_equal({ 'account' => GRAHAM[0] }, rows('credentials_harvested').first['as'])
      end
    end

    test 'P10: no session, a user session and a locked administrator session collect nothing' do
      build
      body = harvest('partner_pc')
      refute_equal 200, response.status, body.to_s
      assert_empty Array(state['harvestedAccounts'])
      assert sign_in('delphine_pc', *DELPHINE)['success']
      harvest('delphine_pc')
      assert_response :unprocessable_entity
      assert sign_in('partner_pc', *GRAHAM)['success']
      post game_path('lock_session'), params: { pc_id: 'partner_pc' }, as: :json
      harvest('partner_pc')
      assert_response :unprocessable_entity
      assert_empty Array(state['harvestedAccounts'])
      assert_empty rows('credentials_harvested')
    end

    test 'P10: the collected record of Delphine cracks at once when her own password is already held, and Julian\'s never falls' do
      travel_to T0 do
        build
        take_records
        take_photo
        serve_feed_post
        assert_equal 'cracked', crack('delphine_hash', FACTS)['status']
        assert sign_in('partner_pc', *GRAHAM)['success']
        harvest('partner_pc')
        assert_equal 'cracked', crack('delphine_cached_partner')['status'], 'the account is already held: answered at once, with no pick'
        assert_equal 'nomatch', crack('julian_cached_partner')['status']
        assert_equal 'infeasible', crack('julian_cached_partner')['status']
        assert_equal 'infeasible', row('julian_cached_partner')['status']
        assert_equal %w[delphine_arvanitis], state['crackedAccounts']
      end
    end

    test 'P11: the hot desk caches Niamh from the start and Jun only after his borrow; the borrow is made by switching his PC off' do
      travel_to T0 do
        build
        assert sign_in('hot_desk', *GRAHAM)['success']
        assert_equal 'admin', level('hot_desk')
        body = harvest('hot_desk')
        assert_response :success, body.to_s
        assert_equal %w[niamh_doherty], body['harvested'].map { |r| r['npcId'] }
        assert_equal %w[niamh_cached_hot_desk], body['held'].map { |r| r['hashId'] }
        assert_equal [], harvest('hot_desk')['harvested']
        make_jun_borrow
        assert_includes state['cachedAt'], 'hot_desk|jun_watanabe'
        assert_nil level('hot_desk'), 'the borrow ends the session the player held at the hot desk'
        assert sign_in('hot_desk', *GRAHAM)['success']
        after = harvest('hot_desk')
        assert_equal %w[jun_watanabe], after['harvested'].map { |r| r['npcId'] }
        assert_equal %w[niamh_doherty jun_watanabe], after['held'].map { |r| r['npcId'] }
        assert_equal %w[jun_cached niamh_cached_hot_desk], keyring['entries'].select { |e| e['kind'] == 'hash' }.map { |e| e['id'] }.sort
        assert_equal 1, rows('credentials_harvested').size, 'the two collects at one PC by one account merge into one row'
        assert_equal 2, rows('credentials_harvested').first['n'].to_i
        NEW_PASSWORDS.each { |pw| refute_includes response.body, pw }
      end
    end

    test 'P11: Jun\'s own failed uses alone, with his PC still on, borrow nothing' do
      travel_to T0 do
        build
        fail_report = { npc_id: 'jun_watanabe', event: 'fail', need: 'work', object_id: 'jun_pc', missing: [{ id: 'jun_pc', why: 'off' }] }
        report(npc_id: 'jun_watanabe', event: 'check', object_id: 'jun_pc')
        answer = report(fail_report).first
        assert_equal true, answer['stale'], 'the server has not seen his PC off, so the report counts for nothing'
        assert_empty Array(state['cachedAt'])
      end
    end

    test 'P12: Niamh\'s record falls at once with no fact, and Jun\'s needs the one fact from his feed post' do
      travel_to T0 do
        build
        assert sign_in('hot_desk', *GRAHAM)['success']
        harvest('hot_desk')
        make_jun_borrow
        assert sign_in('hot_desk', *GRAHAM)['success']
        harvest('hot_desk')
        assert_equal 'cracked', crack('niamh_cached_hot_desk')['status']
        refute_includes response.body, NIAMH[1]
        assert_equal NIAMH[1], row('niamh_doherty.cracked')['password']
        body = crack('jun_cached')
        assert_equal 'needMoreFacts', body['status']
        assert_equal 1, body['missingCount']
        post feed_post_game_url(@game), params: { npc_id: 'jun_watanabe' }, as: :json
        assert_response :success, response.body
        assert_equal %w[jun_cat_name], earned
        assert_equal 'cracked', crack('jun_cached', %w[jun_cat_name])['status']
        refute_includes response.body, JUN[1]
        assert_equal JUN[1], row('jun_watanabe.cracked')['password']
        assert_equal %w[jun_watanabe niamh_doherty], state['crackedAccounts'].sort
        assert_empty rows.select { |r| r['event'].to_s.include?('crack') }
      end
    end

    test 'P13 and P14: the shared desk account is found in the cabinet, cracks at once, signs in on its desks, and is refused at the partner PC and Graham\'s' do
      travel_to T0 do
        build
        take_cabinet_record
        assert_equal 'ready', row('desk_rounds_hash')['status']
        assert_equal 'cracked', crack('desk_rounds_hash')['status']
        refute_includes response.body, DESKADMIN[1]
        cracked = row('deskadmin.cracked')
        assert_equal DESKADMIN[1], cracked['password']
        assert_equal DESKADMIN[0], cracked.dig('account', 'username')
        %w[delphine_pc jun_pc hot_desk].each do |pc|
          body = sign_in(pc, *DESKADMIN)
          assert body['success'], "#{pc}: #{body}"
          assert_equal 'admin', body['access'], pc
          logout(pc)
        end
        %w[partner_pc graham_pc].each do |pc|
          body = sign_in(pc, *DESKADMIN)
          refute body['success'], "#{pc}: #{body}"
          assert_response :unprocessable_entity, pc
          assert_match(/This account can't sign in on this PC/, body['message'] || body['error'], pc)
          assert_nil level(pc), pc
        end
        assert_empty rows('signin_fail'), 'a refusal by kind is not a failed sign-in and counts no lockout'
        assert_equal %w[partner_pc graham_pc], rows('signin_refused').map { |r| r.dig('where', 'id') }
        assert(rows('signin_refused').all? { |r| r['detail'] == { 'kind' => 'local' } })
        assert_empty Array(state['loginLockouts'])
      end
    end

    test 'P13: the shared account\'s record is not in the bin, and nothing about it is listed before it is taken' do
      build
      open_container('secure_bin')
      get game_path('container/secure_bin'), as: :json
      refute_includes response.body, 'deskadmin'
      refute_includes response.body, 'desk_rounds'
      assert_empty keyring['entries'].select { |e| e['id'].to_s.include?('deskadmin') }
    end

    test 'P15: every PC carries the domain, and each person account is a domain account that still signs in where it did before' do
      build
      data = bootstrap_scenario
      assert_response :success
      { 'delphine_pc' => DELPHINE, 'jun_pc' => JUN, 'partner_pc' => GRAHAM, 'graham_pc' => GRAHAM, 'hot_desk' => JUN }.each do |pc, who|
        get game_path("room/#{pc == 'partner_pc' ? 'partner_office' : pc == 'graham_pc' ? 'it_room' : 'office'}"), as: :json
        assert_response :success, response.body
        found = Array(response.parsed_body.dig('room', 'objects')).find { |o| o['id'] == pc }
        assert found, "#{pc} is in its room answer"
        assert_equal 'merrin', found.fetch('domain'), "#{pc} shows its domain on the sign-in screen"
        body = sign_in(pc, *who)
        assert body['success'], "#{pc}: #{body}"
        logout(pc)
      end
      refute_nil data
    end

    test 'P-S5: the sign-in log lists a collect and a refusal by kind, in the reader\'s words' do
      travel_to T0 do
        build
        take_cabinet_record
        crack('desk_rounds_hash')
        sign_in('partner_pc', *GRAHAM)
        harvest('partner_pc')
        sign_in('hot_desk', *DESKADMIN)
        sign_in('partner_pc', *DESKADMIN)
        reader = reader_rows['rows']
        events = reader.map { |r| r['event'] }
        assert_includes events, 'CRED_COLLECT'
        denied = reader.select { |r| r['result'] == 'DENIED' }
        assert_equal ['kind: local'], denied.map { |r| r['detail'] }
        assert_equal ["Julian's PC"], denied.map { |r| r['where'] }
      end
    end

    # The afternoon, appended to the whole run: collect at the partner PC (the administrator session of P7 is still open),
    # the borrow, the hot desk, the cracks, the shared desk account on its desks and refused at the partner PC.
    def play_afternoon
      travel_to T0 + 10.minutes do
        @counts_after = Hash.new(0)
        # P10: the session of P7 is still held at the partner PC
        body = harvest('partner_pc')
        assert_equal %w[julian_sallow delphine_arvanitis], body['harvested'].map { |r| r['npcId'] }
        assert_equal [], harvest('partner_pc')['harvested']
        assert_equal 'cracked', crack('delphine_cached_partner')['status']
        assert_equal 'nomatch', crack('julian_cached_partner')['status']
        assert_equal 'infeasible', crack('julian_cached_partner')['status']
        # P11: the hot desk before and after the borrow
        body = sign_in('hot_desk', *GRAHAM)
        assert body['success'], body.to_s
        @signins << "#{body['npcId']}@hot_desk##{@signin_counts[body['npcId']] += 1}"
        assert_equal %w[niamh_doherty], harvest('hot_desk')['harvested'].map { |r| r['npcId'] }
        make_jun_borrow
        body = sign_in('hot_desk', *GRAHAM)
        assert body['success'], body.to_s
        @signins << "#{body['npcId']}@hot_desk##{@signin_counts[body['npcId']] += 1}"
        assert_equal %w[jun_watanabe], harvest('hot_desk')['harvested'].map { |r| r['npcId'] }
        # P12
        assert_equal 'cracked', crack('niamh_cached_hot_desk')['status']
        post feed_post_game_url(@game), params: { npc_id: 'jun_watanabe' }, as: :json
        assert_response :success, response.body
        assert_equal 'cracked', crack('jun_cached', %w[jun_cat_name])['status']
        keyring
        # P13 and P14
        take_cabinet_record
        assert_equal 'ready', row('desk_rounds_hash')['status'], 'the player sees the row in the capture log before cracking it'
        assert_equal 'cracked', crack('desk_rounds_hash')['status']
        secret = row('deskadmin.cracked')
        body = sign_in('delphine_pc', secret.dig('account', 'username'), secret['password'])
        assert body['success'], body.to_s
        @signins << "#{body['npcId']}@delphine_pc#1"
        desktop_ids('delphine_pc')
        refute sign_in('partner_pc', secret.dig('account', 'username'), secret['password'])['success']
        refute sign_in('graham_pc', secret.dig('account', 'username'), secret['password'])['success']
        named_logout('delphine_pc', 'deskadmin')
        named_logout('hot_desk', 'graham_whitfield')
        reader = reader_rows
        assert_includes reader['rows'].map { |r| r['event'] }, 'CRED_COLLECT'
        bootstrap_scenario
        desktop_ids('partner_pc')
      end
    end

    test 'P-S5: the whole run with the afternoon appended, and the scanner judges every answer clean' do
      play_whole_run
      before = captured.size
      play_afternoon
      assert_operator captured.size, :>, before + 20
      scanner = AccessLeakScanner.new(scenario, game: Game.find(@game.id))
      lines = captured.each_with_index.map { |r, i| ['run.jsonl', i + 1, r] }
      found = scanner.scan(lines, signins: @signins, logouts: @logouts)
      assert_equal [], found.map { |f| [f.line, f.rule, f.owner, f.route] }
      assert_equal [], scanner.unused_entries, 'every named sign-in and sign-out did its work'
      assert_equal %w[delphine_arvanitis graham_whitfield jun_watanabe niamh_doherty deskadmin].sort, state['crackedAccounts'].sort
    end

    test 'P-S5: the scanner is not blind to the afternoon: a cached password put into a collect answer is a finding' do
      play_whole_run
      play_afternoon
      rows_copy = Marshal.load(Marshal.dump(captured))
      hit = rows_copy.rindex { |r| r['method'] == 'POST' && r['path'].end_with?('/harvest_credentials') && r['body'].is_a?(Hash) && r['body']['held'].to_a.any? }
      rows_copy[hit]['body']['held'].first['username'] = NIAMH[1]
      lines = rows_copy.each_with_index.map { |r, i| ['run.jsonl', i + 1, r] }
      refute_empty AccessLeakScanner.new(scenario, game: Game.find(@game.id)).scan(lines, signins: @signins, logouts: @logouts)
    end
  end
end
