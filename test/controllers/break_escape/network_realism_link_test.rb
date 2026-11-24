require 'test_helper'
require_relative '../../support/network_ops_scenario'
require_relative '../../support/realism_catalog_folder'

module BreakEscape
  # Stage S6 unit 23: what the server serves for the realism links of scenarios/test_ops_skin. A finding's
  # `cli` is copied from its catalog entry by key, at the check, the confirm and GET /network only, and
  # the link, the `realism` key and an unlinked entry never ride in any answer.
  class NetworkRealismLinkTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests
    include RealismCatalogFolder

    SCENARIO_PATH = File.expand_path('../../../scenarios/test_ops_skin/scenario.json.erb', __dir__)
    OFFICE = 'jack_office_port'.freeze
    LINKS = {
      'files01.storage.entry_a' => 'filehold_update_lag',
      'files01.storage.entry_b' => 'filehold_release_line',
      'files01.storage.entry_c' => 'filehold_link_setting'
    }.freeze
    CLI_KEYS = %w[title module script advisories output].freeze

    def scenario
      JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
    end

    def checked_game
      build_network_game({ 'unlockedRooms' => %w[lobby comms_room], 'encounteredNPCs' => %w[ian] }, scenario)
      add_item('pc', 'kit_dropbox', 'Network drop box')
      plant('office_port')
      ops_scan(OFFICE, network_id: 'office_lan')
      ops_scan(OFFICE, host_id: 'files01')
      ops_scan(OFFICE, host_id: 'records01')
    end

    def check_answer
      ops_check(OFFICE, host_id: 'files01', service: 'storage')
    end

    def view_findings
      network_view(OFFICE)['footholds'].find { |f| f['id'] == OFFICE }['hosts'].find { |h| h['id'] == 'files01' }['findings']
    end

    def expected_cli(id)
      entry = default_entry(LINKS.fetch(id))
      CLI_KEYS.to_h { |key| [key, entry[key]] }
    end

    def by_id(rows)
      rows.to_h { |row| [row['id'], row] }
    end

    def each_key(node, &block)
      case node
      when Hash then node.each { |k, v| block.call(k) && each_key(v, &block) }
      when Array then node.each { |v| each_key(v, &block) }
      end
    end

    def assert_unlinked_text_absent(text, label)
      refute_includes text, UNLINKED_MODULE, "#{label} holds the module of an unlinked entry"
      refute_includes text, UNLINKED_TITLE, "#{label} holds the title of an unlinked entry"
    end

    def assert_no_link(text, label)
      LINKS.each_value { |id| refute_includes text, id, "#{label} holds the link id #{id}" }
      refute_includes text, '"realism"', "#{label} holds the key realism"
      refute_includes text, UNLINKED_ID, "#{label} holds the unlinked entry's id"
    end

    test 'the check answer, the confirm answer and GET /network carry each linked finding its entry as cli, with the same keys on the decoy' do
      with_test_catalog(unlinked: true) do
        checked_game
        rows = by_id(check_answer['findings'])
        assert_equal LINKS.keys.sort, rows.keys.sort
        LINKS.each_key do |id|
          assert_equal expected_cli(id), rows[id]['cli'], "check answer, #{id}"
          assert_equal CLI_KEYS, rows[id]['cli'].keys, "check answer, #{id}: the entry's keys in the order served"
        end
        LINKS.each_key do |id|
          body = ops_confirm(OFFICE, id)
          assert_equal expected_cli(id), body['finding']['cli'], "confirm answer, #{id}"
        end
        served = by_id(view_findings)
        LINKS.each_key { |id| assert_equal expected_cli(id), served[id]['cli'], "GET /network, #{id}" }
        key_sets = served.values.map { |row| row['cli'].keys.sort }.uniq
        assert_equal 1, key_sets.length, 'the decoy has the same cli keys as the weaknesses'
      end
    end

    test 'no answer holds the key realism, a link id or an unlinked entry (the bootstrap and the room answers included)' do
      with_test_catalog(unlinked: true) do
        build_network_game({ 'unlockedRooms' => %w[lobby comms_room], 'encounteredNPCs' => %w[ian] }, scenario)
        bodies = []
        record = lambda do |label|
          bodies << [label, response.body]
          assert_response :success, "#{label}: #{response.body}"
        end
        bootstrap_scenario
        record.call('bootstrap')
        get game_path('room/lobby'), as: :json
        record.call('room lobby')
        add_item('pc', 'kit_dropbox', 'Network drop box')
        plant('office_port')
        record.call('plant')
        unlock_object('lobby_cabinet', 'unlocked')
        add_item('technique_card', 'card_update', 'Field note: file server updates')
        ops_scan(OFFICE, network_id: 'office_lan')
        record.call('sweep')
        ops_scan(OFFICE, host_id: 'files01')
        record.call('scan')
        check_answer
        record.call('check')
        LINKS.each_key do |id|
          ops_confirm(OFFICE, id)
          record.call("confirm #{id}")
        end
        ops_technique(OFFICE, 'files01.storage.entry_a', 'card_update')
        record.call('use')
        get game_path('room/comms_room'), params: { foothold: OFFICE }, as: :json
        record.call('room comms_room, held session on files01')
        network_view(OFFICE)
        record.call('GET /network')
        bodies.each do |label, text|
          assert_no_link(text, label)
          assert_unlinked_text_absent(text, label)
          each_key(JSON.parse(text)) { |key| refute_equal 'realism', key, "#{label} holds a realism key" }
        end
      end
    end

    test 'a catalog folder with a duplicate id loads as an empty map with one warning, and check and confirm answer normally with no cli' do
      with_test_catalog(files: { 'second_file.json' => { 'filehold_update_lag' => default_entry('filehold_update_lag') } }) do
        assert_equal [], BreakEscape::RealismCatalog.entry_ids, 'a duplicate id fails closed'
        warnings = captured_warnings do
          checked_game
          body = check_answer
          assert_equal 3, body['findings'].length
          body['findings'].each { |row| refute row.key?('cli'), "#{row['id']} has no cli" }
          body = ops_confirm(OFFICE, 'files01.storage.entry_a')
          assert_equal true, body['success']
          assert_equal 'confirmed', body['finding']['status']
          refute body['finding'].key?('cli')
          view_findings.each { |row| refute row.key?('cli') }
        end
        assert_empty warnings.reject { |l| l.include?('RealismCatalog') }, 'no other warning'
      end
      captured = captured_warnings do
        with_test_catalog(files: { 'second_file.json' => { 'filehold_update_lag' => default_entry('filehold_update_lag') } }) do
          checked_game
          check_answer
          ops_confirm(OFFICE, 'files01.storage.entry_a')
          view_findings
        end
      end
      loader = captured.select { |l| l.include?('RealismCatalog') }
      assert_equal 1, loader.length, captured.join("\n")
      assert_includes loader.first, 'duplicate_id'
      assert_equal 1, captured.length, 'no other warning (the unresolved-link warning stays quiet while the loader has spoken)'
    end

    test 'no answer holds the module of an unlinked entry' do
      with_test_catalog(unlinked: true) do
        checked_game
        texts = [response.body]
        texts << check_answer.to_json
        LINKS.each_key { |id| texts << ops_confirm(OFFICE, id).to_json }
        texts << network_view(OFFICE).to_json
        texts.each { |text| assert_unlinked_text_absent(text, 'an answer') }
      end
    end

    test 'a request for any path under the catalog folder answers 404' do
      paths = %w[
        /config/break_escape/realism_catalog/training_fixtures.json
        /config/break_escape/realism_catalog/
        /config/break_escape/realism_catalog.schema.json
        /break_escape/config/break_escape/realism_catalog/training_fixtures.json
        /break_escape/games/1/config/break_escape/realism_catalog/training_fixtures.json
      ]
      paths.each do |path|
        status =
          begin
            get path
            response.status
          rescue ActionController::RoutingError
            404
          end
        assert_equal 404, status, "GET #{path}"
      end
    end

    test 'a link removed from the loaded catalog leaves that finding without cli, logs one warning naming the id, and changes nothing else' do
      checked_game
      before = check_answer['findings'].map { |row| row.except('cli') }
      rows_before = Game.find(@game.id).log_rows_for('network_audit').length
      with_test_catalog(without: ['filehold_update_lag']) do
        warnings = captured_warnings do
          2.times do
            rows = by_id(check_answer['findings'])
            assert_equal before, rows.values.map { |row| row.except('cli') }.sort_by { |row| row['id'] }, 'status, alias and fields unchanged'
            refute rows['files01.storage.entry_a'].key?('cli')
            assert_equal expected_cli('files01.storage.entry_b'), rows['files01.storage.entry_b']['cli']
            assert_equal expected_cli('files01.storage.entry_c'), rows['files01.storage.entry_c']['cli']
          end
          view_findings
        end
        named = warnings.select { |l| l.include?('filehold_update_lag') }
        assert_equal 1, named.length, warnings.join("\n")
        assert_equal 1, warnings.length
      end
      assert_equal rows_before, Game.find(@game.id).log_rows_for('network_audit').length, 'no log row is added'
    end
  end
end
