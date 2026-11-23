require 'test_helper'
require_relative '../../support/network_ops_scenario'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops core S2 R2 (M1, M2, N6): the leak scanner run over REAL answers of a game of
  # scenarios/test_ops_findings, built as ops_findings_scenario_test builds it. The answers are recorded
  # as the browser's log would hold them, then one structural fault at a time is injected into a copy and
  # the scanner must report it; the same answers uninjected must report nothing.
  class AccessLeakScannerOpsRealTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    SCENARIO_PATH = File.expand_path('../../../scenarios/test_ops_findings/scenario.json.erb', __dir__)
    OFFICE = 'jack_office_port'.freeze
    FACTORY = 'printer01.admin_page.factory_login'.freeze
    BANNER = 'printer01.admin_page.old_banner'.freeze
    SHARE = 'files01.files.open_share'.freeze
    GATE = 'share_locked'.freeze

    def scenario
      JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
    end

    def record(kind = nil)
      body = response.parsed_body
      @log << { 'method' => request.request_method, 'path' => request.path, 'status' => response.status, 'body' => body, 'kind' => kind }
      body
    end

    def post_json(suffix, params)
      post game_path(suffix), params: params, as: :json
      record
    end

    # The real run: bootstrap, room, plant, sweep, scans, check, view, confirms, a fix, views. @log holds
    # each answer in order; @steps names the rows by what they are.
    def run_game
      @log = []
      build_network_game({ 'unlockedRooms' => %w[lobby comms_room supply_room], 'encounteredNPCs' => %w[ian] }, scenario)
      get game_path('scenario'), as: :json
      record
      get game_path('room/lobby'), as: :json
      record
      add_item('pc', 'kit_dropbox', 'Network drop box')
      post_json('network/plant', { jack_id: 'office_port' })
      post_json('network/scan', { foothold: OFFICE, network_id: 'office_lan' })
      %w[printer01 files01].each { |h| post_json('network/scan', { foothold: OFFICE, host_id: h }) }
      post_json('network/check', { foothold: OFFICE, host_id: 'printer01', service: 'admin_page' })
      post_json('network/check', { foothold: OFFICE, host_id: 'files01', service: 'files' })
      get game_path('network'), params: { foothold: OFFICE }, as: :json
      record
      [BANNER, FACTORY, SHARE].each { |id| post_json('network/confirm', { foothold: OFFICE, finding_id: id }) }
      sync_globals(GATE => true)
      get game_path('network'), params: { foothold: OFFICE }, as: :json
      record
      @log
    end

    def lines(rows)
      rows.each_with_index.map { |r, i| ['run.jsonl', i + 1, r] }
    end

    def scanner
      AccessLeakScanner.new(scenario)
    end

    def scan(rows)
      scanner.scan(lines(rows))
    end

    # The answers up to the check of the printer: the sweep and scans earned, nothing confirmed.
    def before_confirm
      @log.take_while { |r| !r['path'].end_with?('/network/confirm') }.reject { |r| r['path'].end_with?('/sync_state') }
    end

    def answer(path_end, nth = 0)
      before_confirm.select { |r| r['path'].end_with?(path_end) && r['method'] == (path_end == '/network' ? 'GET' : 'POST') }[nth]
    end

    def printer_check
      answer('/network/check', 0)
    end

    def view
      answer('/network')
    end

    def deep(row)
      Marshal.load(Marshal.dump(row))
    end

    # The row of a finding inside an answer, yielded for the test to change; returns the changed copy.
    def injected(row, finding_id)
      copy = deep(row)
      found = false
      walk = lambda do |node|
        case node
        when Array then node.each(&walk)
        when Hash
          if node['id'] == finding_id && node.key?('summary')
            yield node
            found = true
          end
          node.each_value(&walk)
        end
      end
      walk.call(copy['body'])
      @original = row
      assert found, "no finding row #{finding_id} in the #{copy['path']} answer"
      copy
    end

    def owners(findings)
      findings.map(&:owner).uniq.sort
    end

    # The answers before the first confirm, minus the one being replaced, then the answer: the sweep, the
    # scans and the other checks are earned, so only the injected fault is at issue.
    def prior
      before_confirm.reject { |r| r.equal?(@original) }
    end

    def judged(answer_row)
      @original ||= answer_row
      earned = prior
      scan(earned + [answer_row]).select { |f| f.line == earned.length + 1 }
    end

    def assert_reported(answer_row, owner, message)
      assert_includes owners(judged(answer_row)), owner, message
    end

    test 'the collector registers the findings, the gating global and says the global is public' do
      run_game
      s = scanner
      assert_equal [BANNER, FACTORY, SHARE].sort, (s.instance_variable_get(:@ops_finding_ids).to_a & [BANNER, FACTORY, SHARE]).sort
      assert_includes s.instance_variable_get(:@ops_gating_globals), GATE
      assert_includes s.ops_notes, "global #{GATE} is in room text; judged only inside finding rows"
    end

    test 'the whole real run, uninjected, reports nothing (M1, M2 b)' do
      run_game
      assert_equal [], scan(@log).map { |f| [f.line, f.rule, f.owner] }
      @original = nil
      assert_equal [], judged(printer_check)
      @original = nil
      assert_equal [], judged(view)
    end

    # M1: before its confirm a finding row carries only the unconfirmed key set.
    [['/network/check', 'check answer'], ['/network', 'GET /network answer']].each do |path_end, label|
      test "M1: needs on an unconfirmed finding is reported in the #{label}" do
        run_game
        row = injected(path_end == '/network' ? view : printer_check, FACTORY) { |f| f['needs'] = [] }
        assert_reported(row, "ops:finding:#{FACTORY}", 'an empty needs list on an unconfirmed row')
      end

      test "M1: fixed true on an unconfirmed finding is reported in the #{label}" do
        run_game
        row = injected(path_end == '/network' ? view : printer_check, FACTORY) { |f| f['fixed'] = true }
        assert_reported(row, "ops:finding:#{FACTORY}", 'fixed on an unconfirmed row')
      end

      test "M1: a settled status on an unconfirmed finding is reported in the #{label}" do
        run_game
        %w[confirmed false].each do |status|
          row = injected(path_end == '/network' ? view : printer_check, FACTORY) { |f| f['status'] = status }
          assert_reported(row, "ops:finding:#{FACTORY}", "status #{status} before the confirm")
        end
      end

      test "M1: a falseBecause on an unconfirmed finding is reported in the #{label}" do
        run_game
        row = injected(path_end == '/network' ? view : printer_check, BANNER) { |f| f['falseBecause'] = 'Some words the author never wrote.' }
        assert_reported(row, "ops:finding:#{BANNER}", 'a reason of no registered text')
      end
    end

    test 'M1: the rows stay a leak after another finding is confirmed, and are clear after their own confirm' do
      run_game
      row = injected(printer_check, FACTORY) { |f| f['needs'] = [] }
      confirm = ->(id) { @log.find { |r| r['path'].end_with?('/network/confirm') && r['body']['finding'] && r['body']['finding']['id'] == id } }
      earned = prior
      after_other = scan(earned + [confirm.call(BANNER), row])
      assert_includes owners(after_other.select { |f| f.line == earned.length + 2 }), "ops:finding:#{FACTORY}"
      after_own = scan(earned + [confirm.call(FACTORY), row])
      assert_equal [], after_own.select { |f| f.line == earned.length + 2 }
    end

    # M2 a: the key names section 7 says are never sent, wherever they appear.
    %w[fixedIf grants realism].each do |key|
      test "M2: a #{key} key in a finding row is reported" do
        run_game
        row = injected(printer_check, FACTORY) { |f| f[key] = 'x' }
        assert_reported(row, "ops:key:#{key}", "#{key} in a check answer")
      end
    end

    test 'M2: a never key is reported anywhere in an answer, not only in a finding row' do
      run_game
      row = deep(view)
      row['body']['footholds'].first['extra'] = { 'fixedIf' => 'x', 'weaknesses' => [], 'decoys' => [] }
      assert_equal %w[ops:key:decoys ops:key:fixedIf ops:key:weaknesses], owners(judged(row)).grep(/ops:key/)
    end

    # M2 b: the gating global is public in the lobby's room data, and is still judged inside a finding row.
    test 'M2: the gating global as a value inside a finding row is reported (a public name)' do
      run_game
      assert_includes @log[1]['body'].to_json, GATE, 'the lobby answer does name the global'
      row = injected(answer('/network/check', 1), SHARE) { |f| f['class'] = GATE }
      assert_reported(row, "ops:finding:#{SHARE}", 'the global as a value')
    end

    test 'M2: the gating global as a key under a finding row is reported' do
      run_game
      row = injected(view, SHARE) { |f| f['cli'] = { GATE => true } }
      assert_reported(row, "ops:finding:#{SHARE}", 'the global as a key')
    end

    test 'M2: the global named in a room answer, outside a finding row, is clear' do
      run_game
      assert_equal [], scan(@log.first(2))
    end

    # N6: only the top-level declared-globals map is exempt.
    test 'N6: a declared-globals key is clear at the top level, a leak when it sits under a finding row' do
      run_game
      assert_equal [], scan([{ 'method' => 'GET', 'path' => game_path('scenario'), 'status' => 200, 'body' => { 'globalVariables' => { GATE => false } } }])
      row = injected(view, SHARE) { |f| f['globalVariables'] = { GATE => false } }
      assert_reported(row, "ops:finding:#{SHARE}", 'a globalVariables map under a finding row')
    end

    # PT1: the scanner stays strict. A host's exact name inside longer room text is still a leak on an
    # unswept network; the scenario's clue is worded to avoid it, and this pins the old wording as reported.
    OLD_CLUE = 'Camera recorder: the date it shows is left over'.freeze
    NEW_CLUE = 'The ceiling cameras: the date their recorder shows is left over'.freeze

    test 'PT1: the old maint_log wording, naming camrec01 exactly, is reported on the room answer; the new wording is not' do
      run_game
      room = @log[1]
      assert_includes room['body'].to_json, NEW_CLUE, 'the lobby answer carries the reworded clue'
      assert_equal [], scan([room]).map { |f| [f.rule, f.owner] }
      old_room = JSON.parse(room.to_json.sub(NEW_CLUE, OLD_CLUE))
      assert_includes old_room['body'].to_json, OLD_CLUE
      old_scenario = JSON.parse(JSON.generate(scenario).sub(NEW_CLUE, OLD_CLUE))
      found = AccessLeakScanner.new(old_scenario).scan(lines([old_room]))
      assert_includes found.map(&:owner).join(' '), 'camrec01', 'the host name inside room text is reported before any sweep'
    end

    # PT2: a resumed session's capture file starts after the sweep, scans and checks, which an earlier file
    # of the same game holds. access-leak-check.rb reads every file given as one log in order, so the
    # earlier file is given first; a file judged alone does not know the steps and its GET /network answer
    # looks like a leak.
    def resumed_files
      cut = @log.index { |r| r['method'] == 'GET' && r['path'].end_with?('/network') }
      [@log.first(cut), [@log[cut]]]
    end

    def file_lines(name, rows)
      rows.each_with_index.map { |r, i| [name, i + 1, r] }
    end

    test 'PT2: a resumed capture file judged alone reports the earned strings, and clear when the earlier file is given first' do
      run_game
      first, second = resumed_files
      alone = scanner.scan(file_lines('resumed.jsonl', second))
      assert_includes owners(alone), 'ops:service:files01', 'the scan was earned in the earlier file, so alone the answer looks like a leak'
      together = scanner.scan(file_lines('first.jsonl', first) + file_lines('resumed.jsonl', second))
      assert_equal [], together.map { |f| [f.source, f.line, f.rule, f.owner] }
    end

    test 'PT2: a real leak in the resumed file is still reported when the earlier file is given' do
      run_game
      first, second = resumed_files
      leaky = deep(second.first)
      camera = leaky['body']['footholds'].first['hosts'].find { |h| h['id'] == 'camrec01' }
      assert camera, 'the view lists the camera recorder'
      camera['services'] = [{ 'name' => 'stream', 'port' => 554, 'product' => 'Lookwell RecordView', 'version' => '5.0' }]
      found = scanner.scan(file_lines('first.jsonl', first) + file_lines('resumed.jsonl', [leaky]))
      assert_includes owners(found), 'ops:service:camrec01', 'camrec01 was never scanned in either file'
      assert(found.all? { |f| f.source.to_s.include?('resumed.jsonl') })
    end
  end
end
