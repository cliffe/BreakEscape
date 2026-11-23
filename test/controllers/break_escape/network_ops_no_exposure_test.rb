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
  end
end
