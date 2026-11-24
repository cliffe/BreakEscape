require 'test_helper'
require_relative '../../support/network_ops_scenario'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Stage S6 unit 08: the leak scanner run over the REAL answers of a game of scenarios/test_ops_skin, played
  # as ops_skin_scenario_test plays it (plant, sweep, scan, check, confirm, both cards, the share and the
  # printer, the unplug). The answers are recorded as the browser's log would hold them (inventory adds carry
  # the recorder's `inv` tag). The whole run must report nothing.
  class AccessLeakScannerOpsSkinRealTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests

    SCENARIO_PATH = File.expand_path('../../../scenarios/test_ops_skin/scenario.json.erb', __dir__)
    OFFICE = 'jack_office_port'.freeze
    FINDINGS = %w[files01.storage.entry_a files01.storage.entry_b files01.storage.entry_c].freeze

    def scenario
      JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
    end

    def rec(extra = {})
      @log << { 'method' => request.request_method, 'path' => request.path, 'status' => response.status,
                'body' => response.parsed_body }.merge(extra)
      @log.last
    end

    def take(type, id, name, container: nil)
      if container
        unlock_object(container, 'unlocked')
        rec
      end
      add_item(type, id, name)
      rec('inv' => { 'action' => 'add', 'itemId' => id, 'usedOn' => nil })
    end

    def run_game
      @log = []
      build_network_game({ 'unlockedRooms' => %w[lobby comms_room], 'encounteredNPCs' => %w[ian] }, scenario)
      bootstrap_scenario
      rec
      get game_path('room/lobby'), as: :json
      rec
      take('technique_card', 'card_update', 'Field note: file server updates', container: 'lobby_cabinet')
      take('technique_card', 'card_settings', 'Field note: reviewing settings')
      take('pc', 'kit_dropbox', 'Network drop box')
      plant('office_port')
      rec
      ops_scan(OFFICE, network_id: 'office_lan')
      rec
      %w[files01 records01].each do |host|
        ops_scan(OFFICE, host_id: host)
        rec
      end
      ops_check(OFFICE, host_id: 'files01', service: 'storage')
      rec
      network_view(OFFICE)
      rec
      FINDINGS.each do |id|
        ops_confirm(OFFICE, id)
        rec
      end
      get game_path('keyring'), as: :json
      rec
      ops_technique(OFFICE, FINDINGS[0], 'card_update')
      rec
      ops_technique(OFFICE, FINDINGS[2], 'card_settings')
      rec
      get game_path('keyring'), as: :json
      rec
      network_view(OFFICE)
      rec
      container('office_drop', foothold: OFFICE)
      rec
      container('floor_printer', foothold: OFFICE)
      rec
      unplug('office_port')
      rec
      @log
    end

    def lines(rows)
      rows.each_with_index.map { |r, i| ['run.jsonl', i + 1, r] }
    end

    test 'the whole played run reports nothing' do
      run_game
      assert_operator @log.length, :>, 20
      assert_equal [], AccessLeakScanner.new(scenario).scan(lines(@log)).map { |f| [f.line, f.rule, f.owner, f.route] }
    end
  end
end
