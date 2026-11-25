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
    PCS = %w[delphine_pc jun_pc graham_pc partner_pc].freeze
    ROOMS = %w[office kitchen it_room partner_office].freeze
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
      assert_equal %w[graham_whitfield], data['rooms'].values.flat_map { |r| Array(r['npcs']) }.select { |n| n.dig('creds', 'admin') }.map { |n| n['id'] }
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
      3.times { sign_in('graham_pc', 'gwhitfield', 'not-the-password') }
      assert_equal 1, rows('signin_fail').size, 'the failures merge into one row'
      body = sign_in('graham_pc', *GRAHAM)
      assert body['success'], body.to_s
      assert_equal 'admin', level('graham_pc')
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
        # reload, then P9
        bootstrap_scenario
        desktop_ids('partner_pc')
        reader = reader_rows
        assert_includes reader['rows'].map { |r| r['id'] }, 's2'
        assert_includes reader['rows'].map { |r| r['event'] }, 'USB_OVERRIDE'
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

    # Filter (listed in planning/BUILD_REPORT.md): the server's hash row carries `heldItem` (follow-up A1, the held file's
    # id, no secret), which tools/playtest/lib/access_leak_scanner.rb CRACK_ROW_KEYS does not list yet, so the scanner
    # reads every hash row as foreign. The raw run must give findings of no other rule and only on keyring hash rows;
    # with that one key removed it must give none. When the scanner lists the key, the raw scan alone passes.
    def scan_run(rows)
      lines = rows.each_with_index.map { |r, i| ['run.jsonl', i + 1, r] }
      AccessLeakScanner.new(scenario, game: Game.find(@game.id)).scan(lines, signins: @signins)
    end

    def without_held_item(rows)
      copy = Marshal.load(Marshal.dump(rows))
      copy.each do |r|
        next unless r['path'].to_s.end_with?('/keyring') && r['body'].is_a?(Hash)

        Array(r['body']['entries']).each { |e| e.delete('heldItem') if e['kind'] == 'hash' }
      end
      copy
    end

    test 'the leak scanner judges every answer of the whole run clean' do
      play_whole_run
      assert_operator captured.size, :>, 40
      raw = scan_run(captured)
      assert_equal [], raw.map(&:rule).uniq - ['crack_row'], 'only the heldItem key may be flagged'
      held = captured.flat_map { |r| r['path'].to_s.end_with?('/keyring') && r['body'].is_a?(Hash) ? Array(r['body']['entries']) : [] }
                     .select { |e| e['kind'] == 'hash' }.map { |e| e['heldItem'] }.uniq.sort
      assert_equal %w[delphine_record_file graham_record_file julian_record_file], held
      assert_equal [], scan_run(without_held_item(captured)).map { |f| [f.line, f.rule, f.owner, f.route] }
    end

    test 'the scanner is not blind: the same run with a password put into a keyring answer is a finding' do
      play_whole_run
      rows_copy = Marshal.load(Marshal.dump(captured))
      last = rows_copy.rindex { |r| r['method'] == 'GET' && r['path'].end_with?('/keyring') && r['body'].is_a?(Hash) }
      rows_copy[last]['body']['entries'].find { |e| e['id'] == 'julian_hash' }['label'] = JULIAN_PASSWORD
      found = scan_run(without_held_item(rows_copy))
      refute_empty found
    end
  end
end
