require 'test_helper'
require_relative 'ops_crack_scenario_test'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops S7 fix (leak scanner review R1-L14): the whole-run test of scenarios/test_ops_crack, with every request and its
  # answer recorded and then scanned with the real game. Honest play must give 0 findings, so a later change to the scanner
  # (or to an answer) that flags it fails here. Then one mutation of the real capture per scanner rule must be a finding.
  class OpsCrackScannerRealAnswersTest < OpsCrackScenarioTest
    def self.runnable_methods
      super.grep(/whole_run/)
    end

    def captured
      @captured ||= []
    end

    %i[get post patch put delete].each do |verb|
      define_method(verb) do |*args, **opts, &blk|
        result = super(*args, **opts, &blk)
        text = response.body.to_s
        parsed = begin
          JSON.parse(text)
        rescue JSON::ParserError
          nil
        end
        row = { 'method' => request.request_method, 'path' => request.path, 'status' => response.status }
        row[parsed.nil? ? 'bodyText' : 'body'] = parsed.nil? ? text : parsed
        captured << row
        result
      end
    end

    def scan_capture(rows)
      lines = rows.each_with_index.map { |r, i| ['capture.jsonl', i + 1, r] }
      AccessLeakScanner.new(scenario, game: Game.find(@game.id)).scan(lines)
    end

    def crack_rows
      captured.select { |r| r['path'].end_with?('/crack') && r['method'] == 'POST' }
    end

    teardown do
      next unless @game && captured.any?

      found = scan_capture(captured)
      assert_empty found.map { |f| [f.line, f.rule, f.owner, f.route] }, 'honest play must give no finding'
      assert_operator captured.size, :>, 40
      assert_operator crack_rows.size, :>=, 9
      shapes = crack_rows.map { |r| r['body'].is_a?(Hash) ? (r['body']['status'] || r['body']['reason']) : nil }.uniq.compact.sort
      assert_equal %w[cracked infeasible needMoreFacts nomatch running], shapes

      mutations.each do |name, rule, rows|
        assert_includes scan_capture(rows).map(&:rule), rule, "mutation #{name} must be a finding of #{rule}"
      end
    end

    def deep(rows)
      Marshal.load(Marshal.dump(rows))
    end

    def mutations
      first_running = captured.index { |r| r['method'] == 'POST' && r['path'].end_with?('/crack') && r['body'].is_a?(Hash) && r['body']['status'] == 'running' }
      first_cracked = captured.index { |r| r['method'] == 'POST' && r['path'].end_with?('/crack') && r['body'].is_a?(Hash) && r['body']['status'] == 'cracked' }
      last_keyring = captured.rindex { |r| r['method'] == 'GET' && r['path'].end_with?('/keyring') && r['body'].is_a?(Hash) && r['body']['entries'] }
      assert first_running && first_cracked && last_keyring
      out = []

      rows = deep(captured)
      rows[first_running]['body']['hit'] = false
      out << ['a running answer with a hit word', 'crack_answer', rows]

      rows = deep(captured)
      rows.delete_at(first_running)
      rows.delete_if { |r| r['method'] == 'POST' && r['path'].end_with?('/crack') && r['body'].is_a?(Hash) && r['body']['status'] == 'running' }
      out << ['no running answer before a salted crack', 'crack_unearned', rows]

      rows = deep(captured)
      rows[last_keyring]['body']['entries'].find { |e| e['kind'] == 'hash' }['token'] = 'AAAA-AAAA-AAAA-AAAA-AAAA-AAAA'
      out << ['a forged token on a hash row', 'crack_row', rows]

      rows = deep(captured)
      rows[last_keyring]['body']['entries'].find { |e| e['kind'] == 'hash' }['label'] = 'guessable: dana_pet'
      out << ['a recipe in a hash row label', 'crack_row', rows]

      rows = deep(captured)
      rows[last_keyring]['body']['entries'].find { |e| e['source'] == 'cracked' }['account']['username'] = 'someone_else'
      out << ['a cracked entry for another username', 'crack_unearned', rows]

      rows = deep(captured)
      rows[last_keyring]['body']['entries'] << { 'id' => 'eli.cracked', 'kind' => 'password', 'source' => 'cracked', 'label' => 'Cracked',
                                                 'password' => PASSWORDS['eli'],
                                                 'account' => { 'npcId' => 'eli', 'username' => 'ebrandt', 'displayName' => 'Eli Brandt' } }
      out << ['eli (strong) as a cracked entry', 'crack_unearned', rows]

      rows = deep(captured)
      rows[first_cracked]['path'] = '/evil/crack'
      out << ['the cracked answer on another route', 'crack_unearned', rows]

      rows = deep(captured)
      rows[last_keyring]['body']['crack'] = { 'password' => 'strong' }
      out << ['a recipe key in the keyring answer', 'crack_key', rows]

      # R2-L1: an item fact's entry put into the very first answer (the bootstrap), before the take that earns it
      rows = deep(captured)
      entry = scenario.dig('social', 'intelFacts', 'dana_pet')
      rows.unshift({ 'method' => 'GET', 'path' => rows.first['path'].sub(%r{/games/(\d+)/.*\z}, '/games/\\1/scenario'), 'status' => 200,
                     'body' => { 'social' => { 'intelFacts' => { 'dana_pet' => entry } } } })
      out << ['an unearned fact entry in the bootstrap', 'fact_unearned', rows]
      out
    end
  end
end
