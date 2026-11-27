require 'test_helper'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Showcase leak review (demo_ops_recon game 326, responses 145, 147, 164): a `fixedIf` global that an NPC's ink WRITES
  # with a `set_global:<name>:` tag is public the way a switch's room-text global is: the ink answer carries it as a `VAR?`
  # and the bootstrap's savedGlobalVariables as a key, and neither is a leak. A global the ink only reads, or no ink sets,
  # stays a finding in the same rows, and the name is still judged inside a finding row.
  class AccessLeakScannerOpsInkGlobalTest < ActiveSupport::TestCase
    SCENARIO_PATH = File.expand_path('../../../scenarios/test_ops_findings/scenario.json.erb', __dir__)
    BE_ROOT = File.expand_path('../../..', __dir__)
    BASE = '/break_escape/games/1'.freeze
    GATE = 'lobby_gate_quiet'.freeze

    setup { @files = [] }
    teardown { @files.each { |f| FileUtils.rm_f(f) } }

    # A compiled ink that reads the gate and, when `writes`, sets it with the tag the game sends to the server.
    def ink(writes:)
      body = ['ev', { 'VAR?' => GATE }, '!', '/ev', '^Fixed it tonight.', '\n']
      body += ['ev', true, '/ev', { 'VAR=' => GATE, 're' => true }, '#', "^set_global:#{GATE}:true", '/#'] if writes
      { 'inkVersion' => 21, 'root' => [['done', nil], 'done', { 'offer' => body, 'global decl' => ['ev', false, { 'VAR=' => GATE }, '/ev', 'end', nil] }], 'listDefs' => {} }
    end

    def scenario(ink_body)
      data = JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
      data['globalVariables'][GATE] = false
      find_weakness(data)['fixedIf'] = GATE
      rel = "tmp/leak_ink_global_#{Process.pid}_#{@files.size}.json"
      if ink_body
        File.write(File.join(BE_ROOT, rel), JSON.generate(ink_body))
        @files << File.join(BE_ROOT, rel)
      end
      data['rooms'].each_value { |room| (room['npcs'] || []).each { |npc| npc['storyPath'] = rel if npc['id'] == 'ian' } }
      data
    end

    def find_weakness(node)
      case node
      when Hash
        return node if node['id'] == 'open_share' && node.key?('fixedIf')

        node.each_value { |v| (w = find_weakness(v)) && (return w) }
      when Array then node.each { |v| (w = find_weakness(v)) && (return w) }
      end
      nil
    end

    def rows(ink_body)
      [
        { 't' => '2026-01-01T00:00:01.000Z', 'method' => 'GET', 'path' => "#{BASE}/ink", 'query' => 'npc=ian', 'status' => 200, 'body' => ink_body },
        { 't' => '2026-01-01T00:00:02.000Z', 'method' => 'GET', 'path' => "#{BASE}/scenario", 'status' => 200,
          'body' => { 'savedGlobalVariables' => { GATE => true } } }
      ]
    end

    def scan(data, list)
      scanner = AccessLeakScanner.new(data)
      [scanner, scanner.scan(list.each_with_index.map { |r, i| ['r.jsonl', i + 1, r] })]
    end

    def gate_findings(found)
      found.select { |f| f.rule == 'ops_string' && f.owner.to_s.include?('open_share') }
    end

    test 'a gate the ink writes is clear in the ink answer and the saved globals' do
      body = ink(writes: true)
      _, found = scan(scenario(body), rows(body))
      assert_empty gate_findings(found), found.map(&:to_s).join("\n")
    end

    test 'tamper: a gate the ink only reads is reported in the ink answer and the saved globals' do
      body = ink(writes: false)
      _, found = scan(scenario(body), rows(body))
      lines = gate_findings(found).map(&:line).uniq.sort
      assert_equal [1, 2], lines
    end

    test 'tamper: a gate set by no ink (no story file) is reported in both rows' do
      body = ink(writes: true)
      _, found = scan(scenario(nil), rows(body))
      assert_equal [1, 2], gate_findings(found).map(&:line).uniq.sort
    end

    test 'the ink-set gate is still judged inside a finding row' do
      body = ink(writes: true)
      scanner, = scan(scenario(body), rows(body))
      assert_includes scanner.instance_variable_get(:@ops_gating_globals), GATE
      assert scanner.instance_variable_get(:@ops_global_names).key?(GATE)
    end

    # Review R3 minor 3: the name is public only from the row that serves the setter's ink, not from the start of the run.
    test 'tamper: the ink-set gate sent before its setter ink is served is reported at that early row' do
      body = ink(writes: true)
      early = { 't' => '2026-01-01T00:00:00.500Z', 'method' => 'GET', 'path' => "#{BASE}/scenario", 'status' => 200,
                'body' => { 'savedGlobalVariables' => { GATE => true }, 'note' => GATE } }
      _, found = scan(scenario(body), [early] + rows(body))
      assert_equal [1], gate_findings(found).map(&:line).uniq.sort
    end

    test 'tamper: another NPC\'s ink carrying the writing tag makes the gate public for no one' do
      body = ink(writes: true)
      list = rows(body)
      list[0] = list[0].merge('query' => 'npc=someone_else')
      _, found = scan(scenario(body), list)
      assert_equal [1, 2], gate_findings(found).map(&:line).uniq.sort
    end

    test 'tamper: the setter NPC\'s ink served WITHOUT the writing tag makes the gate public for no one' do
      list = rows(ink(writes: false))
      _, found = scan(scenario(ink(writes: true)), list)
      assert_equal [1, 2], gate_findings(found).map(&:line).uniq.sort
    end

    test 'a failed ink answer makes nothing public' do
      body = ink(writes: true)
      list = rows(body)
      list[0] = list[0].merge('status' => 500, 'body' => { 'error' => 'x' })
      _, found = scan(scenario(body), list)
      assert_equal [2], gate_findings(found).map(&:line).uniq.sort
    end
  end
end
