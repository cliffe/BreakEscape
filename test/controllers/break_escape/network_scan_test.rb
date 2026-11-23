require 'test_helper'
require_relative '../../support/network_ops_scenario'

module BreakEscape
  # Ops core S1 (OPS_CORE_PLAN.md sections 6 and 13): POST /network/scan, the sweep and the host
  # scan. Each check in order with its status and reason, the 400, the log rows and what is saved.
  class NetworkScanTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests

    OFFICE = NetworkOpsScenario::OFFICE
    NOT_FOUND = { 'success' => false, 'reason' => 'not_found' }.freeze
    BAD_REQUEST = { 'success' => false, 'reason' => 'bad_request' }.freeze

    def assert_refused(status, reason, extra = {})
      assert_response status, response.body
      assert_equal({ 'success' => false, 'reason' => reason }.merge(extra), response.parsed_body)
    end

    def assert_state_unchanged_after
      before = ops_state.deep_dup
      yield
      assert_equal before, ops_state, 'the request changed state'
    end

    # ---- the 400 ----------------------------------------------------------------------------

    test 'a malformed request is one 400 that names no id, and writes no row and changes nothing' do
      hold_office_foothold
      bad = [
        { network_id: 'office_lan' },                                  # no foothold
        { foothold: OFFICE },                                          # neither id
        { foothold: OFFICE, network_id: 'office_lan', host_id: 'sam_pc' }, # both
        { foothold: OFFICE, network_id: '' },
        { foothold: OFFICE, network_id: %w[office_lan] },
        { foothold: OFFICE, network_id: { 'a' => 1 } },
        { foothold: OFFICE, host_id: 12 },
        { foothold: %w[x], host_id: 'sam_pc' },
        { foothold: OFFICE, network_id: 'a' * 201 },
        { foothold: 'f' * 201, host_id: 'sam_pc' },
        { foothold: OFFICE, host_id: 'h' * 201 }
      ]
      assert_state_unchanged_after do
        bad.each do |params|
          post game_path('network/scan'), params: params, as: :json
          assert_refused :bad_request, 'bad_request'
          assert_equal BAD_REQUEST, response.parsed_body, params.inspect
        end
      end
      assert_equal [], ops_rows
      # a real id and an invented one cannot be told apart by it
      post game_path('network/scan'), params: { foothold: OFFICE, network_id: 'office_lan', host_id: 'sam_pc' }, as: :json
      real = response.body
      post game_path('network/scan'), params: { foothold: OFFICE, network_id: 'zz', host_id: 'zz' }, as: :json
      assert_equal real, response.body
    end

    test 'an id of 200 characters is a 404, not a 400' do
      hold_office_foothold
      ops_scan(OFFICE, network_id: 'a' * 200)
      assert_refused :not_found, 'not_found'
    end

    # ---- the sweep ---------------------------------------------------------------------------

    test 'a sweep through an unheld foothold, an invented id and a non-id string are the one 404' do
      hold_office_foothold
      assert_state_unchanged_after do
        [[OFFICE, 'nowhere'], [OFFICE, 'Not An Id!'], ['jack_nothing', 'office_lan'], [OFFICE, '_note'], [OFFICE, 'server_net']].each do |foothold, net|
          ops_scan(foothold, network_id: net)
          assert_equal [404, NOT_FOUND], [response.status, response.parsed_body], "#{foothold} #{net}"
        end
      end
      assert_equal [], ops_rows
    end

    test 'a sweep of a network that is not a discovery network is 422 not_needed and records nothing' do
      hold_office_foothold({}, ops_scenario(discovery: nil))
      assert_state_unchanged_after { ops_scan(OFFICE, network_id: 'office_lan') }
      assert_refused :unprocessable_entity, 'not_needed'
      assert_equal [], ops_rows
    end

    test 'the first sweep adds the network, writes one network_swept row and answers the rows' do
      hold_office_foothold
      body = ops_scan(OFFICE, network_id: 'office_lan')
      assert_response :success
      assert_equal true, body['success']
      assert_nil body['already']
      assert_equal 'office_lan', body['network']['id']
      assert_equal true, body['network']['swept']
      ids = body['network']['hosts'].map { |h| h['id'] }
      assert_includes ids, 'sam_pc'
      assert_includes ids, 'print_srv'
      assert_includes ids, 'scanned_inbox'
      assert_equal({ 'networks' => ['office_lan'] }, ops_state['opsDiscovered'])
      row = ops_rows.last
      assert_equal 1, ops_rows.size
      assert_equal 'network_swept', row['event']
      assert_equal({ 'kind' => 'network', 'id' => 'office_lan' }, row['where'])
      assert_equal({ 'from' => OFFICE }, row['detail'])
      assert_equal 'ok', row['result']
      assert_nil row['as']
    end

    test 'a repeated sweep answers already with the same rows, changes no state and merges its row into a count' do
      hold_office_foothold
      first = ops_scan(OFFICE, network_id: 'office_lan')
      state = ops_state.except('opsLog', 'opsLogSeq', 'opsLogSaves', 'opsLogOnce', 'opsLogClockAt')
      again = ops_scan(OFFICE, network_id: 'office_lan')
      assert_response :success
      assert_equal true, again['already']
      assert_equal first['network'], again['network']
      assert_equal state, ops_state.except('opsLog', 'opsLogSeq', 'opsLogSaves', 'opsLogOnce', 'opsLogClockAt')
      assert_equal 1, ops_rows.size, 'a repeat merges into the newest row'
      assert_equal 2, ops_rows.last['n']
      ops_scan(OFFICE, network_id: 'office_lan')
      assert_equal 3, ops_rows.last['n']
    end

    # Counts Game#save! calls made while it is switched on (the requests load their own Game).
    module SaveCounter
      class << self
        attr_accessor :on, :count
      end

      def save!(*args, **opts)
        SaveCounter.count += 1 if SaveCounter.on
        super
      end
    end
    Game.prepend(SaveCounter)

    def saves_during
      SaveCounter.count = 0
      SaveCounter.on = true
      yield
      SaveCounter.count
    ensure
      SaveCounter.on = false
    end

    test 'repeated sweeps save only while the log helper keeps the row: the tenth repeat saves, the eleventh does not' do
      hold_office_foothold
      ops_scan(OFFICE, network_id: 'office_lan')
      counts = Array.new(12) { saves_during { ops_scan(OFFICE, network_id: 'office_lan') } }
      assert_equal [1] * 10, counts.first(10), 'a stored repeat saves once'
      assert_equal [0, 0], counts.last(2), 'a repeat the helper refuses saves nothing'
      assert_equal 11, ops_rows.last['n'], 'the row stopped merging at the limit'
      assert_response :success
    end

    test 'a sweep through a foothold that does not reach the network is a 404 and a pivot session opens it' do
      hold_office_foothold
      assert_state_unchanged_after { ops_scan(OFFICE, network_id: 'server_net') }
      assert_refused :not_found, 'not_found'
      pivot_through_lena
      body = ops_scan(OFFICE, network_id: 'server_net')
      assert_response :success
      assert_equal 'server_net', body['network']['id']
      assert_includes body['network']['hosts'].map { |h| h['id'] }, 'sv_fs02'
      assert_equal %w[server_net], ops_state['opsDiscovered']['networks']
    end

    test 'discovery is kept across an unplug and a new foothold' do
      hold_office_foothold
      ops_scan(OFFICE, network_id: 'office_lan')
      ops_scan(OFFICE, host_id: 'sam_pc')
      unplug('comms_port')
      assert_response :success
      ops_scan(OFFICE, network_id: 'office_lan')
      assert_refused :not_found, 'not_found' # stale: the foothold is gone
      assert_equal({ 'networks' => ['office_lan'], 'hosts' => ['sam_pc'] }, ops_state['opsDiscovered'])
      take_drop_box if held_ids.exclude?('kit_dropbox')
      plant('comms_port')
      assert_response :success
      body = ops_scan(OFFICE, network_id: 'office_lan')
      assert_equal true, body['already'], 'still swept'
      assert_equal true, ops_scan(OFFICE, host_id: 'sam_pc')['already'], 'still scanned'
    end

    test 'a sweep through the open workshop foothold reaches only its own network' do
      build_ops_game
      take_drop_box
      plant('bench_port')
      assert_response :success
      ops_scan(NetworkOpsScenario::BENCH, network_id: 'office_lan')
      assert_refused :not_found, 'not_found'
      ops_scan(NetworkOpsScenario::BENCH, network_id: 'workshop_lan')
      assert_refused :unprocessable_entity, 'not_needed'
    end

    # ---- the host scan -----------------------------------------------------------------------

    test 'a host scan before the sweep answers as an invented id, and a scan of an unreached host too' do
      hold_office_foothold
      ops_scan(OFFICE, host_id: 'sam_pc')
      real = [response.status, response.body]
      ops_scan(OFFICE, host_id: 'made_up')
      assert_equal real, [response.status, response.body]
      assert_equal [404, NOT_FOUND.to_json], real
      ops_scan(OFFICE, host_id: 'sv_fs02') # on a network out of reach
      assert_equal real, [response.status, response.body]
      assert_equal [], ops_rows
      assert_equal({}, ops_state['opsDiscovered'])
    end

    test 'a host scan after the sweep adds the host, writes one host_scanned row and answers the services' do
      hold_office_foothold
      ops_scan(OFFICE, network_id: 'office_lan')
      body = ops_scan(OFFICE, host_id: 'sam_pc')
      assert_response :success
      assert_equal true, body['success']
      assert_nil body['already']
      assert_equal 'sam_pc', body['host']['id']
      assert_equal true, body['host']['scanned']
      assert_equal %w[web files], body['host']['services'].map { |s| s['name'] }
      assert_equal({ 'name' => 'web', 'label' => NetworkOpsScenario::SERVICE_LABEL, 'port' => 80,
                     'product' => "#{NetworkOpsScenario::PRODUCT_SECRET} web", 'version' => NetworkOpsScenario::VERSION_SECRET },
                   body['host']['services'].first)
      assert_equal %w[sam_pc], ops_state['opsDiscovered']['hosts']
      row = ops_rows.last
      assert_equal 'host_scanned', row['event']
      assert_equal({ 'kind' => 'pc', 'id' => 'sam_pc' }, row['where'])
      assert_equal({ 'from' => OFFICE }, row['detail'])
    end

    test 'a device scan names the host kind in its row and answers a device row' do
      hold_office_foothold
      ops_scan(OFFICE, network_id: 'office_lan')
      body = ops_scan(OFFICE, host_id: 'print_srv')
      assert_response :success
      assert_equal 'device', body['host']['kind']
      assert_equal NetworkOpsScenario::DEVICE_NAME, body['host']['name']
      assert_equal({ 'kind' => 'host', 'id' => 'print_srv' }, ops_rows.last['where'])
    end

    test 'a repeated host scan answers already with the same fields and writes no row and saves nothing' do
      hold_office_foothold
      ops_scan(OFFICE, network_id: 'office_lan')
      first = ops_scan(OFFICE, host_id: 'sam_pc')
      rows = ops_rows
      assert_state_unchanged_after do
        again = ops_scan(OFFICE, host_id: 'sam_pc')
        assert_equal true, again['already']
        assert_equal first['host'], again['host']
      end
      assert_equal rows, ops_rows
      assert_equal 1, ops_rows.count { |r| r['event'] == 'host_scanned' }
    end

    test 'a host with no services is 422 not_needed and records nothing' do
      hold_office_foothold
      ops_scan(OFFICE, network_id: 'office_lan')
      assert_state_unchanged_after do
        %w[lena_pc plain_cam].each do |id|
          ops_scan(OFFICE, host_id: id)
          assert_refused :unprocessable_entity, 'not_needed'
        end
      end
      assert_equal 1, ops_rows.size
    end

    test 'a powered-down host answers not_responding with and without services, and writes nothing' do
      hold_office_foothold('globalVariables' => { 'lab_off' => true, 'cam_off' => true })
      ops_scan(OFFICE, network_id: 'office_lan')
      assert_state_unchanged_after do
        %w[lab_box cam_one].each do |id|
          ops_scan(OFFICE, host_id: id)
          assert_refused :forbidden, 'not_responding'
        end
      end
      assert_equal 1, ops_rows.size
    end

    test 'a scan of a powered-down sign-in host answers not_responding' do
      data = ops_scenario
      data['rooms']['desk_room']['objects'].find { |o| o['id'] == 'sam_pc' }['offWhen'] = 'sam_off'
      hold_office_foothold({ 'globalVariables' => { 'sam_off' => true } }, data)
      ops_scan(OFFICE, network_id: 'office_lan')
      ops_scan(OFFICE, host_id: 'sam_pc')
      assert_refused :forbidden, 'not_responding'
    end

    test 'a host on an open network is scanned with no sweep' do
      build_ops_game
      take_drop_box
      plant('bench_port')
      body = ops_scan(NetworkOpsScenario::BENCH, host_id: 'bench_pc')
      assert_response :success
      assert_equal %w[web], body['host']['services'].map { |s| s['name'] }
      assert_equal %w[bench_pc], ops_state['opsDiscovered']['hosts']
    end

    test 'a second network is scanned only after a pivot session, and its host after its sweep' do
      hold_office_foothold
      ops_scan(OFFICE, host_id: 'sv_dev')
      assert_refused :not_found, 'not_found'
      pivot_through_lena
      ops_scan(OFFICE, host_id: 'sv_dev')
      assert_refused :not_found, 'not_found' # reached, not swept
      ops_scan(OFFICE, network_id: 'server_net')
      body = ops_scan(OFFICE, host_id: 'sv_dev')
      assert_response :success
      assert_equal %w[mgmt], body['host']['services'].map { |s| s['name'] }
    end

    # ---- logs and saving ---------------------------------------------------------------------

    test 'a scenario with no log source writes no log state, but still records discovery' do
      hold_office_foothold({}, ops_scenario(logged: false))
      ops_scan(OFFICE, network_id: 'office_lan')
      ops_scan(OFFICE, host_id: 'sam_pc')
      state = ops_state
      assert_equal [], %w[opsLog opsLogSeq opsLogClockAt opsLogOnce opsLogSaves].select { |k| state.key?(k) }
      assert_equal({ 'networks' => ['office_lan'], 'hosts' => ['sam_pc'] }, state['opsDiscovered'])
    end

    test 'a sweep and a scan through a joined Wi-Fi foothold and an implanted PC foothold write their rows' do
      data = ops_scenario
      data['networks']['guest_wifi'] = { 'name' => 'Guest Wi-Fi', 'discovery' => 'scan', 'wifi' => { 'ssid' => 'Quill-Guest' } }
      data['rooms']['lobby']['objects'] << { 'id' => 'guest_ap', 'type' => 'pc', 'sprite' => 'wifi_ap1',
                                             'name' => 'Guest access point', 'wifiAp' => true, 'network' => 'guest_wifi' }
      data['hosts']['wifi_cam'] = { 'name' => 'Wifi camera', 'network' => 'guest_wifi', 'services' => [NetworkOpsScenario.service('web', 80)] }
      build_ops_game({}, data)
      post game_path('network/join'), params: { ap_id: 'guest_ap' }, as: :json
      assert_response :success, response.body
      ops_scan('wifi_guest_wifi', network_id: 'guest_wifi')
      assert_response :success, response.body
      ops_scan('wifi_guest_wifi', host_id: 'wifi_cam')
      assert_response :success, response.body
      assert_equal %w[network_swept host_scanned], ops_rows.map { |r| r['event'] }
    end

    test 'a sweep through an implanted PC foothold writes its row' do
      data = ops_scenario
      build_ops_game({}, data)
      state = @game.player_state
      state['footholds'] = { 'implant_sam_pc' => { 'via' => 'implant', 'source' => 'sam_pc', 'network' => 'office_lan', 'seq' => 1 } }
      @game.save!
      ops_scan('implant_sam_pc', network_id: 'office_lan')
      assert_response :success, response.body
      assert_equal 'office_lan', ops_rows.last['where']['id']
    end

    # A built foothold id (jack_ + id) can pass 40 characters; a row cannot store it. The validator
    # refuses it in a scenario with logSources; if one reaches the route anyway, the scan succeeds
    # and no row is written (in every environment, the test guard included).
    LONG_JACK = ('c' * 36).freeze

    def long_jack_game
      data = JSON.parse(ops_scenario.to_json.gsub('comms_port', LONG_JACK))
      build_ops_game({}, data)
      take_drop_box
      plant(LONG_JACK)
      assert_response :success, response.body
      "jack_#{LONG_JACK}"
    end

    test 'a foothold id too long for a row still sweeps and scans: the route answers 200 and writes no row' do
      foothold = long_jack_game
      assert_equal 41, foothold.length
      body = ops_scan(foothold, network_id: 'office_lan')
      assert_response :success, response.body
      assert_equal true, body['network']['swept']
      assert_includes ops_state['opsDiscovered']['networks'], 'office_lan'
      ops_scan(foothold, network_id: 'office_lan')
      assert_response :success, response.body
      assert_equal true, response.parsed_body['already']
      body = ops_scan(foothold, host_id: 'sam_pc')
      assert_response :success, response.body
      assert_equal true, body['host']['scanned']
      assert_includes ops_state['opsDiscovered']['hosts'], 'sam_pc'
      assert_equal [], ops_rows, 'no row names a foothold id a row cannot store'
    end

    test 'no row holds a secret' do
      hold_office_foothold
      ops_scan(OFFICE, network_id: 'office_lan')
      ops_scan(OFFICE, host_id: 'sam_pc')
      ops_log = ops_rows.to_json
      [NetworkOpsScenario::PRODUCT_SECRET, NetworkOpsScenario::VERSION_SECRET, NetworkModelScenario::LENA_PASSWORD].each do |text|
        refute_includes ops_log, text
      end
    end

    test 'no ops route answer carries a refusal code outside the list' do
      hold_office_foothold
      list = JSON.parse(File.read(file_fixture('ops_refusal_codes.json')))
      seen = []
      answer = lambda do |status, **ids|
        ops_scan(ids.delete(:foothold) || OFFICE, **ids)
        assert_response status, response.body
        reason = response.parsed_body['reason']
        assert_includes list, reason
        seen << reason
      end
      answer.call(:not_found, network_id: 'nowhere')                       # 404
      answer.call(:bad_request)                                            # 400
      ops_scan(OFFICE, network_id: 'office_lan')
      answer.call(:unprocessable_entity, host_id: 'lena_pc')               # not_needed (a host with no services)
      @game.reload.player_state['globalVariables'] = (@game.player_state['globalVariables'] || {}).merge('lab_off' => true)
      @game.save!
      answer.call(:forbidden, host_id: 'lab_box')                          # not_responding
      assert_equal %w[bad_request not_found not_needed not_responding], seen.uniq.sort
    end
  end
end
