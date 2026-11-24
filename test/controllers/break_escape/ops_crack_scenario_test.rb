require 'test_helper'
require 'open3'
require_relative '../../support/network_ops_scenario'

module BreakEscape
  # Ops S7 unit 13 (S7_BUILD_BRIEF.md, section 7): the real scenarios/test_ops_crack/scenario.json.erb
  # driven through the routes with a frozen clock. Every beat reads a fresh keyring answer or a
  # re-read game. The browser part (the scene, the countdown bar, the toast) is PLAYTEST.md's.
  class OpsCrackScenarioTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests
    include ActiveSupport::Testing::TimeHelpers

    ROOT = File.expand_path('../../..', __dir__)
    SCENARIO_PATH = File.join(ROOT, 'scenarios/test_ops_crack/scenario.json.erb')
    OFFICE = 'jack_office_port'.freeze
    FINDING = 'desk_panel.admin_page.factory_login'.freeze
    FLAG = 'flag{crack_floor_year}'.freeze
    AUDIT = 'crack_audit'.freeze
    PASSWORDS = { 'dana' => 'JuniperAshby2003', 'deskadmin' => 'Welcome-Desk-1', 'eli' => 'Tq7-orchid-kelp-N2vX' }.freeze
    T0 = Time.zone.local(2026, 11, 24, 12, 0, 0)

    def scenario
      JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
    end

    def build
      build_network_game({ 'unlockedRooms' => %w[lobby bay store], 'encounteredNPCs' => %w[dana farah eli deskadmin sparedesk] }, scenario)
    end

    def fresh
      Game.find(@game.id)
    end

    def state
      fresh.player_state
    end

    def audit
      fresh.log_rows_for(AUDIT)
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

    def plant_office
      take_drop_box
      plant('office_port')
      assert_response :success, response.body
    end

    def take_from_share(id, name)
      body = add_item('text_file', id, name, source_resource_id: 'shared_drive', transfer: 'copy')
      assert_response :success, body.to_s
      assert_includes held_ids, id
    end

    def serve_feed_post
      post feed_post_game_url(@game), params: { npc_id: 'dana' }, as: :json
      assert_response :success, response.body
      response.parsed_body
    end

    def earned
      fresh.earned_fact_ids
    end

    # ---- the scenario's shape --------------------------------------------------------------

    test 'the validator reports no error, and the only warning is the grant_fact stand-in notice' do
      out, status = Open3.capture2e('ruby', 'scripts/validate_scenario.rb', SCENARIO_PATH, chdir: ROOT)
      assert status.success?, out.last(2000)
      assert_match(/Result: 0 errors/, out)
      warnings = out.lines.grep(/WARNING|⚠️ SOCIAL/)
      assert_equal 1, warnings.size, warnings.join
      assert_match(/dana_year.*grant_fact/, warnings.first)
    end

    test 'mapping indexes have not drifted' do
      out, status = Open3.capture2e('ruby', 'tools/check_mapping_index_drift.rb', chdir: ROOT)
      assert status.success?, out
    end

    test 'no object id or name gives away a password or a recipe' do
      text = scenario['rooms'].values.flat_map { |r| Array(r['objects']) }.flat_map { |o| [o['id'], o['name']] }.join(' ').downcase
      %w[crack hash password strong common guess].each { |w| refute_includes text, w }
      assert_equal false, scenario['accountProfiles']['eli_files']['contents'].find { |c| c['id'] == 'eli_folder' }['locked']
    end

    # R1-S8: the same words must not appear in what else the player can read by name: share and profile
    # files, credential labels, fact ids, and the NPC and record ids a keyring row shows.
    test 'no share file, profile file, credential label, fact id or npc id gives away a password or a recipe' do
      sc = scenario
      files = Array(sc['resources']).flat_map { |_k, r| r.is_a?(Hash) ? Array(r['contents'] || r['files']) : [] }
      files += sc['accountProfiles'].values.flat_map { |p| Array(p['contents']) }
      names = files.flat_map { |f| f.is_a?(Hash) ? [f['id'], f['name']] : [] }.compact
      names += sc['credentials'].values.map { |c| c['label'] }.compact
      names += sc['social']['intelFacts'].keys
      names += sc['rooms'].values.flat_map { |r| Array(r['npcs']).map { |n| n['id'] } }
      words = %w[crack password strong common guess]
      words.each { |w| refute_includes names.join(' ').downcase, w }
      # the profile file ids and names also avoid the word hash
      profile = sc['accountProfiles'].values.flat_map { |p| Array(p['contents']) }.flat_map { |c| [c['id'], c['name']] }.join(' ').downcase
      refute_includes profile, 'hash'
    end

    # R1-C2, R1-S12: the player reaches the Crack button by clicks, and can read the flag in the game
    test 'the player starts with a capture log that lists hash rows, and the lobby sign shows the flag' do
      sc = scenario
      log = sc['startItemsInInventory'].find { |i| i['type'] == 'capture_log' }
      assert log, 'a capture log is the only way to the Crack button'
      assert_equal true, log.dig('holds', 'captures')
      sign = sc['rooms']['lobby']['objects'].find { |o| o['id'] == 'sign_lobby' }
      assert_includes sign['text'], 'flag{crack_floor_year}'
    end

    test 'a new game lists no hash row and holds no crack state' do
      build
      body = keyring
      assert_empty body['entries'].select { |e| e['kind'] == 'hash' }
      assert_nil body['crackFacts']
      assert_empty earned
      assert_empty audit
    end

    test 'the game boots: the bootstrap answers and holds no password, recipe or crack state key' do
      build
      body = bootstrap_scenario
      assert_response :success, body.to_s
      PASSWORDS.each_value { |pw| refute_includes response.body, pw }
      %w[crackRuns crackStarted crackedAccounts earnedFacts passwordDifficulty revealsFacts].each { |k| refute_includes response.body, k }
      refute_includes response.body, '"crack"'
    end

    # ---- the beats --------------------------------------------------------------------------

    test 'the whole run: dana, farah, the common pair, the administrator and eli' do
      travel_to T0 do
        build
        plant_office
        crack_rows = []

        # 2. First hash: the share opens, the file is taken, a salted ready row appears.
        container('shared_drive', foothold: OFFICE)
        assert_response :success
        take_from_share('dana_file', 'dana_record.dat')
        dana = row('dana_hash')
        assert_equal 'ready', dana['status']
        assert_equal true, dana['salted']
        assert_equal 24, dana['token'].delete(' -').length
        assert_equal [], keyring['crackFacts']
        refute_includes response.body, PASSWORDS['dana']

        # 3. Missing facts: the notes item gives one, a pick of it says how many are missing.
        add_item('notes1', 'desk_notes', 'Reception notes')
        assert_response :success
        assert_equal %w[dana_pet], earned
        body = crack('dana_hash', %w[dana_pet])
        assert_equal 'needMoreFacts', body['status']
        assert_equal 2, body['missingCount']
        assert_nil body['readyInSeconds']
        crack_rows << audit.size

        # 4. The rest: a served feed post and the flag reward.
        served = serve_feed_post
        refute_nil served['post'], served.to_s
        post flags_game_url(@game), params: { flag: 'flag{wrong}', stationId: 'records_station' }, as: :json
        refute_includes earned, 'dana_year'
        post flags_game_url(@game), params: { flag: FLAG, stationId: 'records_station' }, as: :json
        assert_response :success, response.body
        assert_equal %w[dana_pet dana_town dana_year], earned.sort
        assert_equal %w[dana_pet dana_town dana_year], keyring['crackFacts']

        # 5. A wrong pick costs the wait and says nothing before it ends.
        body = crack('dana_hash', %w[dana_pet dana_town])
        assert_equal 'running', body['status']
        assert_equal 10, body['readyInSeconds']
        assert_equal %w[readyInSeconds status success], body.keys.sort
        assert_equal 'running', crack('dana_hash', %w[dana_pet dana_town dana_year])['status'], 'a post inside the wait reads no pick'
        assert_equal 'running', row('dana_hash')['status']
        travel 11.seconds
        assert_equal 'nomatch', crack('dana_hash', %w[dana_pet dana_town])['status']
        assert_equal 'ready', row('dana_hash')['status']
        crack_rows << audit.size

        # 6. The right pick.
        assert_equal 'running', crack('dana_hash', %w[dana_year dana_pet dana_town])['status']
        travel 11.seconds
        body = crack('dana_hash', %w[dana_year dana_pet dana_town])
        assert_equal 'cracked', body['status']
        refute_includes response.body, PASSWORDS['dana']
        entries = keyring['entries']
        assert_equal 'cracked', entries.find { |e| e['id'] == 'dana_hash' }['status']
        pw = entries.find { |e| e['id'] == 'dana.cracked' }
        assert_equal PASSWORDS['dana'], pw['password']
        assert_equal 'cracked', pw['source']
        assert_equal 'password', pw['kind']

        # 7. Reuse: farah's file cracks with no pick after the medium default wait, and a reload resumes.
        take_from_share('farah_file', 'farah_record.dat')
        assert_equal true, row('farah_hash')['salted']
        body = crack('farah_hash')
        assert_equal 'running', body['status']
        assert_equal 60, body['readyInSeconds']
        travel 20.seconds
        assert_equal 40, row('farah_hash')['readyInSeconds']
        get game_path('keyring'), params: { rev: response.parsed_body['rev'] }, as: :json
        assert_equal({ 'farah_hash' => 40 }, response.parsed_body['readyInSeconds'])
        travel 41.seconds
        assert_equal 'cracked', crack('farah_hash')['status']
        assert_equal PASSWORDS['dana'], row('farah.cracked')['password']
        crack_rows << audit.size

        # 8. The common pair: equal unsalted tokens, one run grants both.
        take_from_share('sparedesk_file', 'sparedesk_record.dat')
        spare = row('sparedesk_hash')
        assert_equal false, spare['salted']
        unlock_object('lobby_cabinet', 'unlocked')
        assert_response :success, response.body
        add_item('technique_card', 'card_factory', 'Field note: shipped accounts')
        assert_response :success
        ops_scan(OFFICE, network_id: 'office_lan')
        ops_scan(OFFICE, host_id: 'desk_panel')
        ops_check(OFFICE, host_id: 'desk_panel', service: 'admin_page')
        ops_confirm(OFFICE, FINDING)
        assert_nil row('deskadmin_hash'), 'the record appears only when the technique has run'
        body = ops_technique(OFFICE, FINDING, 'card_factory')
        assert_response :success, body.to_s
        admin = row('deskadmin_hash')
        assert_equal false, admin['salted']
        assert_equal spare['token'], admin['token']
        assert_equal 'cracked', crack('sparedesk_hash')['status']
        assert_equal 'cracked', row('deskadmin_hash')['status']
        assert_equal 'cracked', row('sparedesk_hash')['status']
        assert_equal PASSWORDS['deskadmin'], row('deskadmin.cracked')['password']
        crack_rows << audit.size

        # 9. The real path: the cracked password signs in as the administrator.
        body = sign_in('eli_pc', 'fdadmin', row('deskadmin.cracked')['password'], foothold: OFFICE)
        assert body['success'], body.to_s
        assert_equal 'admin', fresh.session_access('eli_pc')

        # 10. Strong is a dead end.
        get game_path('container/eli_pc'), as: :json
        assert_includes response.parsed_body['contents'].map { |c| c['id'] }, 'eli_folder'
        get game_path('container/eli_folder'), as: :json
        assert_equal %w[eli_hash_file], response.parsed_body['contents'].map { |c| c['id'] }
        add_item('text_file', 'eli_hash_file', 'eli_record.dat', source_pc_id: 'eli_pc', transfer: 'copy')
        assert_response :success
        assert_equal 'ready', row('eli_hash')['status']
        crack_rows << audit.size
        assert_equal 'nomatch', crack('eli_hash')['status']
        body = crack('eli_hash', [])
        assert_equal 'infeasible', body['status']
        assert_equal 'infeasible', row('eli_hash')['status']
        assert_nil row('eli.cracked')
        crack_rows << audit.size
        assert_equal crack_rows.last, crack_rows[-2], 'the strong runs add no row'

        # 11. Checks: four accounts cracked, eli's record infeasible, the log holds only the moves around it.
        assert_equal %w[dana deskadmin farah sparedesk], state['crackedAccounts'].sort
        assert_equal 2, state['crackRuns']['eli_hash']
        events = audit.map { |r| r['event'] }.uniq.sort
        assert_equal %w[admin_profile_read finding_confirmed host_scanned network_swept service_checked share_folder_opened signin_ok technique_used], events
        technique = audit.find { |r| r['event'] == 'technique_used' }
        assert_equal 'credential', technique.dig('detail', 'grant')
        refute_includes audit.to_json, PASSWORDS['dana']
        refute_includes audit.to_json, PASSWORDS['deskadmin']
      end
    end

    test 'a crack adds no log row, whatever its answer' do
      travel_to T0 do
        build
        plant_office
        container('shared_drive', foothold: OFFICE)
        take_from_share('dana_file', 'dana_record.dat')
        before = audit
        crack('dana_hash', [])
        crack('dana_hash', ['dana_pet'])
        assert_equal before, audit
      end
    end

    test 'the 120 s default of a hard record with no crackSeconds is proved here with a frozen clock' do
      travel_to T0 do
        data = scenario
        data['credentials']['dana_hash'].delete('crackSeconds')
        build_network_game({ 'unlockedRooms' => %w[lobby bay store], 'encounteredNPCs' => %w[dana],
                             'earnedFacts' => %w[dana_pet dana_town dana_year],
                             'inventory' => [{ 'id' => 'dana_file', 'type' => 'text_file', 'name' => 'dana_record.dat', 'credential' => 'dana_hash' }] }, data)
        body = crack('dana_hash', %w[dana_pet dana_town dana_year])
        assert_equal 'running', body['status']
        assert_equal 120, body['readyInSeconds']
      end
    end
  end
end
