require 'test_helper'
require_relative '../../support/network_ops_scenario'

module BreakEscape
  # Stage S6 unit 08: the real scenarios/test_ops_skin/scenario.json.erb driven through the routes, beats
  # T1 to T9 of the S6 build brief (section 7). The skin is the browser's business, so these are the
  # requests and the server record the two looks must both end with; PLAYTEST.md holds the browser part.
  class OpsSkinScenarioTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests

    SCENARIO_PATH = File.expand_path('../../../scenarios/test_ops_skin/scenario.json.erb', __dir__)
    OFFICE = 'jack_office_port'.freeze
    SESSION_FINDING = 'files01.storage.entry_a'.freeze
    DECOY = 'files01.storage.entry_b'.freeze
    CREDENTIAL_FINDING = 'files01.storage.entry_c'.freeze
    ALL_FINDINGS = [SESSION_FINDING, DECOY, CREDENTIAL_FINDING].freeze
    AUDIT = 'network_audit'.freeze
    CARDS = {
      'card_update' => 'Field note: file server updates',
      'card_settings' => 'Field note: reviewing settings'
    }.freeze

    def scenario
      JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
    end

    def build(player_state = {})
      build_network_game({ 'unlockedRooms' => %w[lobby comms_room], 'encounteredNPCs' => %w[ian] }.merge(player_state), scenario)
    end

    def fresh
      Game.find(@game.id)
    end

    def state
      fresh.player_state
    end

    def audit(event = nil)
      rows = fresh.log_rows_for(AUDIT)
      event ? rows.select { |r| r['event'] == event } : rows
    end

    def take_cards
      unlock_object('lobby_cabinet', 'unlocked')
      assert_response :success, response.body
      CARDS.each do |id, name|
        add_item('technique_card', id, name)
        assert_response :success, response.body
      end
    end

    def planted
      build
      add_item('pc', 'kit_dropbox', 'Network drop box')
      body = plant('office_port')
      assert_response :success, response.body
      body
    end

    def swept
      planted
      ops_scan(OFFICE, network_id: 'office_lan')
      assert_response :success, response.body
    end

    def scanned
      swept
      ops_scan(OFFICE, host_id: 'files01')
      assert_response :success, response.body
    end

    def checked
      scanned
      ops_check(OFFICE, host_id: 'files01', service: 'storage')
      assert_response :success, response.body
    end

    def host_row(id)
      view_hosts(OFFICE).find { |h| h['id'] == id }
    end

    def findings
      host_row('files01')['findings'] || []
    end

    def refused(finding, card, reason)
      body = ops_technique(OFFICE, finding, card)
      assert_response :unprocessable_entity, response.body
      assert_equal false, body['success']
      assert_equal reason, body['reason']
      body
    end

    def granted(finding, card)
      body = ops_technique(OFFICE, finding, card)
      assert_response :success, response.body
      assert_equal true, body['success']
      body
    end

    test 'the scenario has one discovery network, two sign-in hosts, one service with two weaknesses and a decoy, and two cards' do
      build
      data = fresh.scenario_data
      assert_equal %w[office_lan], data['networks'].keys
      assert_equal 'scan', data['networks']['office_lan']['discovery']
      assert_equal %w[office_drop floor_printer].sort, data['resources'].keys.sort
      assert_equal %w[settings_review update_notes], data['techniques'].keys.sort
      assert_equal [AUDIT], data['logSources'].keys
      model = NetworkModel.weaknesses(data)
      assert_equal [SESSION_FINDING, CREDENTIAL_FINDING].sort, model.map { |w| w[:finding_id] }.sort
      assert_equal [DECOY], NetworkModel.decoys(data).map { |d| d[:finding_id] }
      assert_equal %w[session credential].sort, model.map { |w| w[:entry]['grants'].keys.first }.sort
      refute data.key?('networkView')
      refute data.key?('cli')
      refute data.key?('realism')
      assert_equal({}, state['opsUsed'].to_h)
    end

    test 'T1: planting the box holds a foothold and the office block lists no host' do
      body = planted
      assert_equal true, body['success'], body.to_s
      assert_includes state['footholds'].to_h.keys, OFFICE
      assert_equal [], view_blocks(OFFICE).find { |b| b['id'] == 'office_lan' }['hosts']
      assert_equal false, view_blocks(OFFICE).find { |b| b['id'] == 'office_lan' }['swept']
      assert_empty audit
    end

    test 'T2 and T3: a scan before the sweep is the same 404 for a real and an invented host; the sweep lists two hosts, the scan their services' do
      planted
      real = [ops_scan(OFFICE, host_id: 'files01'), response.status]
      invented = [ops_scan(OFFICE, host_id: 'invented_one'), response.status]
      assert_equal invented, real
      assert_equal 404, real.last
      assert_empty audit
      ops_scan(OFFICE, network_id: 'office_lan')
      assert_response :success, response.body
      assert_equal %w[files01 floor_printer office_drop records01], view_hosts(OFFICE).map { |h| h['id'] }.sort
      assert_equal 1, audit('network_swept').length
      assert_equal ['office_lan'], state['opsDiscovered']['networks']
      ops_scan(OFFICE, host_id: 'files01')
      assert_response :success, response.body
      assert_equal 1, audit('host_scanned').length
      assert_equal %w[storage], host_row('files01')['services'].map { |s| s['name'] }
    end

    test 'T3: a sign-in on the sealed host is refused as remote blocked and records no session; the file server takes it' do
      swept
      sign_in('records01', 'iokafor', 'Dockyard-Ian-41', foothold: OFFICE)
      assert_response :unprocessable_entity
      assert_equal true, response.parsed_body['remoteBlocked']
      assert_nil state['sessions']&.[]('records01')
      assert_equal false, host_row('records01')['remoteSignIn']
      assert_equal true, host_row('files01')['remoteSignIn'] != false
    end

    test 'T4: the check lists three findings under the server aliases; two are confirmed, the decoy settles false, one stays open' do
      checked
      assert_equal ALL_FINDINGS.sort, findings.map { |f| f['id'] }.sort
      assert_equal ['unconfirmed'], findings.map { |f| f['status'] }.uniq
      ops_confirm(OFFICE, SESSION_FINDING)
      assert_response :success, response.body
      ops_confirm(OFFICE, DECOY)
      assert_response :success, response.body
      by_id = findings.to_h { |f| [f['id'], f['status']] }
      assert_equal 'confirmed', by_id[SESSION_FINDING]
      assert_equal 'false', by_id[DECOY]
      assert_equal 'unconfirmed', by_id[CREDENTIAL_FINDING]
      assert_equal 2, audit('finding_confirmed').length
      ops_confirm(OFFICE, 'files01.storage.no_such')
      refute_equal 200, response.status
      assert_equal 2, audit('finding_confirmed').length
    end

    test 'T5: a card on the decoy is refused false_positive and on the unconfirmed finding not_confirmed; then it confirms' do
      checked
      take_cards
      ops_confirm(OFFICE, SESSION_FINDING)
      ops_confirm(OFFICE, DECOY)
      refused(DECOY, 'card_settings', 'false_positive')
      refused(CREDENTIAL_FINDING, 'card_settings', 'not_confirmed')
      assert_equal 2, audit('technique_refused').length
      assert_empty audit('technique_used')
      assert_equal({}, state['opsUsed'].to_h)
      ops_confirm(OFFICE, CREDENTIAL_FINDING)
      assert_response :success, response.body
      assert_equal 'confirmed', findings.find { |f| f['id'] == CREDENTIAL_FINDING }['status']
    end

    test 'T7 and T8: the first card opens a user session, the second a keyring entry; the share opens and the printer reads' do
      checked
      take_cards
      ALL_FINDINGS.each { |id| ops_confirm(OFFICE, id) }
      first = granted(SESSION_FINDING, 'card_update')
      assert_equal 'session', first['grant']
      assert_equal 'technique', first['session']['via']
      assert_equal({ 'id' => 'ian', 'via' => 'technique', 'foothold' => OFFICE, 'access' => 'user', 'technique' => SESSION_FINDING },
                   state['sessions']['files01'])
      assert_includes state['signedInPcs'], 'files01'
      second = granted(CREDENTIAL_FINDING, 'card_settings')
      assert_equal 'credential', second['grant']
      assert_equal true, second['keyringChanged']
      get game_path('keyring'), as: :json
      assert_equal %w[file_link], response.parsed_body['entries'].map { |e| e['id'] }
      assert_equal [SESSION_FINDING, CREDENTIAL_FINDING], state['opsUsed']
      assert_equal 2, audit('technique_used').length
      assert_equal 'technique', host_row('files01')['session']['via']
      container('office_drop', foothold: OFFICE)
      assert_response :success, response.body
      assert_includes response.body, 'welcome.txt'
      container('floor_printer', foothold: OFFICE)
      assert_response :success, response.body
      assert_equal [SESSION_FINDING, CREDENTIAL_FINDING], state['opsUsed'], 'looking at the share and the printer changes nothing'
    end

    test 'T9: unplugging ends the foothold and the session; the used findings and the keyring entry stay' do
      checked
      take_cards
      ALL_FINDINGS.each { |id| ops_confirm(OFFICE, id) }
      granted(SESSION_FINDING, 'card_update')
      granted(CREDENTIAL_FINDING, 'card_settings')
      ended = unplug('office_port')
      assert_response :success, response.body
      assert_equal %w[files01], Array(ended['endedPcIds'])
      assert_nil state['sessions']&.[]('files01')
      assert_empty state['footholds'].to_h
      get game_path('network'), params: { foothold: OFFICE }, as: :json
      assert_response :not_found
      assert_equal [SESSION_FINDING, CREDENTIAL_FINDING], state['opsUsed']
      get game_path('keyring'), as: :json
      assert_equal %w[file_link], response.parsed_body['entries'].map { |e| e['id'] }
    end
  end
end
