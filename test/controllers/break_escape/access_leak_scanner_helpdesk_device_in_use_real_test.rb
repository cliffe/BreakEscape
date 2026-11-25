require 'test_helper'
require_relative '../../support/lock_step_routes'
require_relative '../../support/helpdesk_reenrol_scenario'
require_relative '../../support/helpdesk_route_scenario'
require_relative '../../support/network_model_scenario'
require_relative '../../support/lock_step_real_rows'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Wire S8b device_in_use? to S8c, unit U3 (real run): the rows are the answers the routes really gave while a desk re-enrolled
  # sam and a code lock of sam was gated. The leak scan of the honest run reports no `helpdesk:old:code` (this runs the real `t`
  # strings through `capture_time` and `ls_time`, so a Float/Time mix would raise here); the same rows without the gate row do.
  class AccessLeakScannerHelpdeskDeviceInUseRealTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests
    include LockStepRoutes
    include LockStepRealRows

    HR = HelpdeskReenrolScenario
    HS = HelpdeskRouteScenario
    NS = NetworkModelScenario
    LOCK = 'sam_code_safe'.freeze

    setup do
      @rows = []
      travel_to T0
    end

    teardown { travel_back }

    def record(method, suffix, query = nil)
      @rows << { 't' => Time.current.utc.iso8601(3), 'method' => method, 'path' => game_path(suffix), 'status' => response.status,
                 'body' => response.parsed_body }.tap { |r| r['query'] = query if query }
    end

    def scenario
      data = HR.scenario(kind: 'code')
      data['rooms']['lobby']['objects'] << { 'type' => 'safe', 'id' => LOCK, 'name' => LOCK, 'locked' => true, 'lockType' => 'pin', 'requires' => '1234',
                                             'secondStep' => { 'kind' => 'code', 'owner' => 'sam' },
                                             'contents' => [{ 'type' => 'notes', 'id' => "#{LOCK}_note", 'name' => 'Note', 'takeable' => true }] }
      data
    end

    def run_rows
      build_network_game({ 'encounteredNPCs' => %w[ria sam lena ian jake], 'inventory' => [HR.held(HR::FOB)] }, scenario)
      post game_path('helpdesk/request'), params: { desk_id: 'it_desk', username: 'sokafor', what: 'mfa', answers: HS::RIGHT_SAM }, as: :json
      record('POST', 'helpdesk/request')
      later(1)
      post game_path('unlock'), params: { targetType: 'object', targetId: LOCK, attempt: '1234', method: 'pin' }, as: :json
      record('POST', 'unlock')
      later(1)
      get game_path('mfa/device'), params: { item_id: 'sam_fob' }
      assert response.parsed_body.key?('code'), response.body
      record('GET', 'mfa/device', 'item_id=sam_fob')
      @rows
    end

    def old_code?(rows)
      scan_with(rows, scenario).any? { |f| f.owner == 'helpdesk:old:code' }
    end

    test 'the honest run is not reported, and the same rows without the gate row are' do
      rows = run_rows
      assert_not old_code?(rows)
      assert old_code?(rows.reject { |r| r['path'].end_with?('/unlock') })
    end
  end
end
