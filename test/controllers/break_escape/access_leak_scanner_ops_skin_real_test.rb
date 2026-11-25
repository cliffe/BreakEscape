require 'test_helper'
require_relative '../../support/network_ops_scenario'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s
require_relative '../../support/realism_catalog_folder'

module BreakEscape
  # Stage S6 unit 08: the leak scanner run over the REAL answers of a game of scenarios/test_ops_skin, played
  # as ops_skin_scenario_test plays it (plant, sweep, scan, check, confirm, both cards, the share and the
  # printer, the unplug). The answers are recorded as the browser's log would hold them (inventory adds carry
  # the recorder's `inv` tag). The whole run must report nothing.
  class AccessLeakScannerOpsSkinRealTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests
    include RealismCatalogFolder

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

    # Unit 23: the authored text reaches the browser in stages. Each string is looked for in the whole
    # body of every answer, and the first answer that holds it must be the stage that earned it.
    STAGED = {
      office_range: '10.20.0.0/24', files_address: '10.20.0.10', guest_range: '10.40.0.0/28', guest_address: '10.40.0.4',
      service_banner: 'Tarnwick FileHold 4.2 file service ready'
    }.freeze

    def held(text, what)
      text.include?(what)
    end

    test 'authored text is staged: the range at the first view, discovery addresses after the sweep, a service cli after its scan, a finding cli after the check' do
      with_test_catalog(unlinked: true) do
        @log = []
        build_network_game({ 'unlockedRooms' => %w[lobby comms_room], 'encounteredNPCs' => %w[ian] }, scenario)
        bootstrap_scenario
        rec
        take('technique_card', 'card_update', 'Field note: file server updates', container: 'lobby_cabinet')
        take('pc', 'kit_dropbox', 'Network drop box')
        plant('office_port')
        rec
        network_view(OFFICE)
        view = rec['body'].to_json
        assert held(view, STAGED[:office_range]), 'the range is in the first view'
        STAGED.except(:office_range).each_value { |text| refute held(view, text), "#{text} is in the first view" }
        ops_scan(OFFICE, network_id: 'office_lan')
        sweep = rec['body'].to_json
        assert held(sweep, STAGED[:files_address]), 'the sweep lists the address (the sign-in host included)'
        refute held(sweep, STAGED[:service_banner])
        refute held(sweep, STAGED[:guest_address])
        ops_scan(OFFICE, host_id: 'files01')
        scan = rec['body'].to_json
        assert held(scan, STAGED[:service_banner]), 'the service cli comes with the host scan'
        refute held(scan, default_entry('filehold_update_lag')['title']), 'no finding cli before the check'
        ops_check(OFFICE, host_id: 'files01', service: 'storage')
        check = rec['body'].to_json
        finding_links = %w[filehold_update_lag filehold_release_line filehold_link_setting]
        finding_links.each { |id| assert held(check, default_entry(id)['title']), "#{id} comes with the check" }
        FINDINGS.each do |id|
          ops_confirm(OFFICE, id)
          rec
        end
        ops_technique(OFFICE, FINDINGS[0], 'card_update')
        rec
        network_view(OFFICE)
        after = rec['body'].to_json
        assert held(after, STAGED[:guest_range]), 'the open network is listed once the session pivots'
        assert held(after, STAGED[:guest_address])
        @log.each_with_index do |row, i|
          text = row['body'].to_json
          finding_links.each { |id| refute_includes text, id, "answer #{i} holds a link id" }
          refute_includes text, UNLINKED_MODULE
          refute_includes text, UNLINKED_ID
          refute_includes text, '"realism"'
          walk = lambda do |node|
            case node
            when Hash then node.each { |k, v| refute k.to_s.start_with?('_'), "answer #{i} holds the key #{k}"; walk.call(v) }
            when Array then node.each { |v| walk.call(v) }
            end
          end
          walk.call(row['body'])
        end
        assert_equal [], AccessLeakScanner.new(scenario).scan(lines(@log)).map { |f| [f.line, f.rule, f.owner, f.route] }
      end
    end
  end
end
