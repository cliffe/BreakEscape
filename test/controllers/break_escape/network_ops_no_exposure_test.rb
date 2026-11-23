require 'test_helper'
require_relative '../../support/network_ops_scenario'
require_relative '../../support/payload_scan'

module BreakEscape
  # Ops core S1 (OPS_CORE_PLAN.md section 7, "No-exposure tests"): what the browser is not told,
  # at each step of a run. S2 and S3 add their own steps to this file.
  class NetworkOpsNoExposureTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests

    OFFICE = NetworkOpsScenario::OFFICE
    PRODUCT = NetworkOpsScenario::PRODUCT_SECRET
    VERSION = NetworkOpsScenario::VERSION_SECRET
    SERVICE_STRINGS = [PRODUCT, VERSION, NetworkOpsScenario::SERVICE_LABEL].freeze
    HOST_STRINGS = [NetworkOpsScenario::DEVICE_NAME, 'print_srv', 'lab_box', 'cam_one', 'sv_dev', 'Lobby camera', 'Server device'].freeze

    def hash_keys(node, out = [])
      case node
      when Hash then node.each { |k, v| out << k.to_s; hash_keys(v, out) }
      when Array then node.each { |v| hash_keys(v, out) }
      end
      out
    end

    # The bootstrap and every room answer carry no hosts, services or ops state, and none of
    # their strings.
    def assert_world_answers_clean(label)
      forbidden = SERVICE_STRINGS + HOST_STRINGS
      bootstrap_scenario
      check_world_answer(label + ' bootstrap', forbidden)
      @game.reload.scenario_data['rooms'].each_key do |room_id|
        get game_path("room/#{room_id}"), as: :json
        check_world_answer("#{label} room #{room_id}", forbidden)
      end
    end

    def check_world_answer(label, forbidden)
      keys = hash_keys(response.parsed_body)
      %w[hosts services opsDiscovered opsFindings opsUsed networks].each { |k| refute_includes keys, k, "#{label} carries key #{k}" }
      forbidden.each { |text| refute_includes response.body, text, "#{label} exposes #{text}" }
    end

    test 'the bootstrap and every room answer name no host or service, before and after a full run' do
      hold_office_foothold
      assert_world_answers_clean('before the sweep')
      ops_scan(OFFICE, network_id: 'office_lan')
      assert_world_answers_clean('after the sweep')
      ops_scan(OFFICE, host_id: 'sam_pc')
      ops_scan(OFFICE, host_id: 'print_srv')
      assert_world_answers_clean('after the scans')
    end

    test 'GET /network before a sweep names no host of a discovery network but a held-session one, and no ops key' do
      hold_office_foothold
      text = network_view(OFFICE).to_json
      (HOST_STRINGS + %w[sam_pc kiosk_pc door_box scanned_inbox]).each { |t| refute_includes text, t, t }
      refute_includes text, '"ops"'
      sign_in('lena_pc', 'lfox', NetworkModelScenario::LENA_PASSWORD, foothold: OFFICE)
      text = network_view(OFFICE).to_json
      assert_includes text, 'lena_pc'
      %w[sam_pc print_srv].each { |t| refute_includes text, t }
      refute_includes text, '"ops"'
      refute_includes text, '"services"'
    end

    test 'GET /network before a host scan names no product or version, and the scan answer is the first to' do
      hold_office_foothold
      ops_scan(OFFICE, network_id: 'office_lan')
      before = network_view(OFFICE).to_json
      [PRODUCT, VERSION, '"services"', '"scanned"'].each { |t| refute_includes before, t, t }
      assert_includes before, '"ops":true'
      ops_scan(OFFICE, host_id: 'sam_pc')
      assert_includes response.body, PRODUCT
      after = network_view(OFFICE).to_json
      assert_includes after, PRODUCT
      refute_includes after, "#{PRODUCT} queue", 'a host not scanned stays unscanned'
    end

    test 'the block says nothing about weaknesses, findings or how many hosts a network has' do
      hold_office_foothold
      ops_scan(OFFICE, network_id: 'office_lan')
      ops_scan(OFFICE, host_id: 'sam_pc')
      keys = hash_keys(network_view(OFFICE))
      %w[weaknesses decoys findings grants needs fixedIf falseBecause opsFindings techniques count].each { |k| refute_includes keys, k, k }
    end

    test 'GET /keyring and GET /container carry no host or service string' do
      hold_office_foothold
      ops_scan(OFFICE, network_id: 'office_lan')
      ops_scan(OFFICE, host_id: 'sam_pc')
      get game_path('keyring'), as: :json
      container('scanned_inbox', foothold: OFFICE)
      (SERVICE_STRINGS + HOST_STRINGS).each { |t| refute_includes response.body, t }
      get game_path('keyring'), as: :json
      (SERVICE_STRINGS + HOST_STRINGS).each { |t| refute_includes response.body, t }
    end

    test 'a refusal or the one 404 carries only success and reason' do
      hold_office_foothold
      ops_scan(OFFICE, host_id: 'sam_pc')
      assert_equal({ 'success' => false, 'reason' => 'not_found' }, response.parsed_body)
      ops_scan(OFFICE, network_id: 'office_lan', host_id: 'sam_pc')
      assert_equal({ 'success' => false, 'reason' => 'bad_request' }, response.parsed_body)
      ops_scan(OFFICE, network_id: 'office_lan')
      ops_scan(OFFICE, host_id: 'lena_pc')
      assert_equal({ 'success' => false, 'reason' => 'not_needed' }, response.parsed_body)
    end

    test 'the bootstrap holds no service string after a sweep and a host scan' do
      hold_office_foothold
      ops_scan(OFFICE, network_id: 'office_lan')
      ops_scan(OFFICE, host_id: 'sam_pc')
      bootstrap_scenario
      assert_equal [], SERVICE_STRINGS.select { |t| response.body.include?(t) }
    end

    test 'the payload scan finds nothing in the bootstrap or a room after a sweep and a host scan' do
      hold_office_foothold
      ops_scan(OFFICE, network_id: 'office_lan')
      ops_scan(OFFICE, host_id: 'sam_pc')
      data = @game.reload.scenario_data
      answers = SecretLeaks.collect_answers(data)
      clues = SecretLeaks.acknowledged_clues(data)
      ss = BreakEscape::ScenarioSchema
      findings = BreakEscape::PayloadScan.scan_body(ss.root, bootstrap_scenario, 'GET scenario', '', 'test_ops', answers, clues)
      data['rooms'].each_key do |room_id|
        get game_path("room/#{room_id}"), as: :json
        findings.concat(BreakEscape::PayloadScan.scan_body(ss.at('#/definitions/room'), response.parsed_body['room'], 'GET room/:id',
                                                           "rooms/#{room_id}", 'test_ops', answers, clues))
      end
      assert_equal [], findings.map { |f| f.slice(:route, :path, :klass) }
    end

    # ---- S2: findings (OPS_CORE_PLAN.md section 7) ---------------------------------------------

    NOS = NetworkOpsScenario
    FINDING_STRINGS = [NOS::FACTORY_SUMMARY, NOS::BANNER_SUMMARY, NOS::BANNER_FALSE, NOS::NOTES_LABEL, NOS::DOOR_LABEL,
                       NOS::DOOR_GLOBAL, NOS::PATCHED_GLOBAL, 'factory_login', 'old_banner', 'side_entry', 'open_listing',
                       'spool_default', 'lab_open', 'default_creds', 'weak_auth', NOS::MANUAL_NAME].freeze
    FINDING_KEYS = %w[weaknesses decoys findings falseBecause fixedIf needs fixed grants opsFindings].freeze

    def findings_run
      findings_game
      sweep_and_scan('sam_pc')
    end

    test 'S2: the bootstrap and every room name no weakness, decoy or finding string, before and after a check and confirms' do
      findings_run
      check = lambda do |label|
        bootstrap_scenario
        texts = [response.body]
        @game.reload.scenario_data['rooms'].each_key do |room_id|
          get game_path("room/#{room_id}"), as: :json
          texts << response.body
        end
        texts.each do |body|
          # a declared global's name is in the bootstrap's globalVariables, as ever; the ops answers are the ones that never carry it
          (FINDING_STRINGS - [NOS::MANUAL_NAME, NOS::DOOR_GLOBAL, NOS::PATCHED_GLOBAL]).each { |t| refute_includes body, t, "#{label} exposes #{t}" }
          # `needs` is also an NPC's own key, so it is left to the string checks
          (FINDING_KEYS - %w[needs]).each { |k| refute_includes body, "\"#{k}\"", "#{label} carries #{k}" }
        end
      end
      check.call('before the check')
      ops_check(OFFICE, host_id: 'sam_pc', service: 'web')
      check.call('after the check')
      ops_confirm(OFFICE, NOS::FACTORY)
      ops_confirm(OFFICE, NOS::OLD_BANNER)
      check.call('after the confirms')
    end

    test 'S2: GET /network before a check carries no class, summary or finding key; the check answer is the first to' do
      findings_run
      before = network_view(OFFICE).to_json
      (FINDING_STRINGS - [NOS::MANUAL_NAME]).each { |t| refute_includes before, t, "scanned, unchecked: #{t}" }
      FINDING_KEYS.each { |k| refute_includes before, "\"#{k}\"", k }
      ops_check(OFFICE, host_id: 'sam_pc', service: 'web')
      assert_includes response.body, NOS::FACTORY_SUMMARY
      assert_includes network_view(OFFICE).to_json, NOS::FACTORY_SUMMARY
    end

    test 'S2: before the confirm nothing differs between a decoy and a weakness, fixed or not; falseBecause and needs wait' do
      findings_run
      ops_check(OFFICE, host_id: 'sam_pc', service: 'web')
      [false, true].each do |fixed|
        set_global(NOS::PATCHED_GLOBAL, fixed)
        text = network_view(OFFICE).to_json
        %w[falseBecause needs fixed fixedIf grants].each { |k| refute_includes text, "\"#{k}\"", "fixed=#{fixed}: #{k}" }
        [NOS::BANNER_FALSE, NOS::DOOR_GLOBAL, NOS::PATCHED_GLOBAL, NOS::DOOR_LABEL, NOS::NOTES_LABEL].each { |t| refute_includes text, t }
        listed = view_hosts.find { |h| h['id'] == 'sam_pc' }['findings']
        assert_equal 1, listed.map { |f| f.keys }.uniq.length, 'one key set for every unconfirmed finding'
      end
    end

    test 'S2: after the confirm, falseBecause rides only a false finding and needs only a confirmed one, never a global name' do
      findings_run
      ops_check(OFFICE, host_id: 'sam_pc', service: 'web')
      ops_confirm(OFFICE, NOS::FACTORY)
      ops_confirm(OFFICE, NOS::OLD_BANNER)
      listed = view_hosts.find { |h| h['id'] == 'sam_pc' }['findings'].to_h { |f| [f['id'], f] }
      assert_equal NOS::BANNER_FALSE, listed[NOS::OLD_BANNER]['falseBecause']
      refute listed[NOS::OLD_BANNER].key?('needs')
      assert listed[NOS::FACTORY].key?('needs')
      refute listed[NOS::FACTORY].key?('falseBecause')
      refute listed[NOS::OPEN_LISTING].key?('needs'), 'unconfirmed: no needs'
      text = network_view(OFFICE).to_json
      [NOS::DOOR_GLOBAL, NOS::PATCHED_GLOBAL, '"grants"', '"fixedIf"'].each { |t| refute_includes text, t }
    end

    test 'S2: a refusal of check or confirm carries only success and reason' do
      findings_run
      ops_check(OFFICE, host_id: 'print_srv', service: 'queue')
      assert_equal({ 'success' => false, 'reason' => 'not_found' }, response.parsed_body)
      ops_confirm(OFFICE, NOS::FACTORY)
      assert_equal({ 'success' => false, 'reason' => 'not_found' }, response.parsed_body)
      ops_check(OFFICE, host_id: 'sam_pc')
      assert_equal({ 'success' => false, 'reason' => 'bad_request' }, response.parsed_body)
    end

    test 'S2: GET /keyring and GET /container carry no finding string after a full run' do
      findings_run
      ops_check(OFFICE, host_id: 'sam_pc', service: 'web')
      ops_confirm(OFFICE, NOS::FACTORY)
      get game_path('keyring'), as: :json
      (FINDING_STRINGS - [NOS::MANUAL_NAME]).each { |t| refute_includes response.body, t, t }
      container('scanned_inbox', foothold: OFFICE)
      (FINDING_STRINGS - [NOS::MANUAL_NAME]).each { |t| refute_includes response.body, t, t }
    end

    test 'S2: the payload scan finds nothing in the bootstrap or a room after a check and a confirm' do
      findings_run
      ops_check(OFFICE, host_id: 'sam_pc', service: 'web')
      ops_confirm(OFFICE, NOS::FACTORY)
      data = @game.reload.scenario_data
      answers = SecretLeaks.collect_answers(data)
      clues = SecretLeaks.acknowledged_clues(data)
      ss = BreakEscape::ScenarioSchema
      findings = BreakEscape::PayloadScan.scan_body(ss.root, bootstrap_scenario, 'GET scenario', '', 'test_ops', answers, clues)
      data['rooms'].each_key do |room_id|
        get game_path("room/#{room_id}"), as: :json
        findings.concat(BreakEscape::PayloadScan.scan_body(ss.at('#/definitions/room'), response.parsed_body['room'], 'GET room/:id',
                                                           "rooms/#{room_id}", 'test_ops', answers, clues))
      end
      assert_equal [], findings.map { |f| f.slice(:route, :path, :klass) }
    end

    test 'S3: after a session grant and a credential grant the bootstrap and every room name no technique, grant, product or finding string' do
      techniques_game
      ops_technique(OFFICE, 'sam_pc.web.factory_login', 'card_factory')
      ops_technique(OFFICE, NetworkOpsScenario::SPOOL, 'card_factory')
      # The registry's content (names, summaries, worksOn) and the findings are never in a world answer. A card
      # object's own `technique_card` key (the registry key) rides its room object as authored.
      forbidden = SERVICE_STRINGS + HOST_STRINGS + ['Factory accounts', 'Devices often ship', 'worksOn', 'factory_login', 'spool_default', 'sam_pc.web']
      bootstrap_scenario
      check_world_answer('S3 bootstrap', forbidden)
      @game.reload.scenario_data['rooms'].each_key do |room_id|
        get game_path("room/#{room_id}"), as: :json
        check_world_answer("S3 room #{room_id}", forbidden)
      end
      %w[techniques grants].each { |word| refute_includes bootstrap_scenario.to_json, word }
    end

    test 'S3: a technique not held is never named: GET /network lists only held cards and a refusal names no other technique' do
      techniques_game(cards: %w[card_factory])
      text = network_view(OFFICE).to_json
      %w[Build\ flaw Other\ product Other\ version Listing\ flaw Unheld\ flaw build_flaw other_product listing_flaw unheld_flaw].each { |t| refute_includes text, t }
      post game_path('network/technique'), params: { foothold: OFFICE, finding_id: 'sam_pc.web.old_build', item_id: 'card_factory' }, as: :json
      assert_response :unprocessable_entity
      assert_equal %w[reason success], response.parsed_body.keys.sort
      %w[build_flaw Build\ flaw unpatched].each { |t| refute_includes response.body, t }
    end

    test 'S3: a no_grant refusal carries reason and nothing else' do
      techniques_game
      post game_path('network/technique'), params: { foothold: OFFICE, finding_id: 'sam_pc.web.quiet_leak', item_id: 'card_factory' }, as: :json
      assert_response :unprocessable_entity
      assert_equal({ 'success' => false, 'reason' => 'no_grant' }, response.parsed_body)
      assert_equal({ success: false, reason: 'no_grant' }.to_json, response.body)
    end
  end
end
