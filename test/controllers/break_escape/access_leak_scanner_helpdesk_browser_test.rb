require 'test_helper'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops S8b R1: the browser playtest of test_ops_helpdesk (game 163) fetched `GET keyring?pc_id=<PC>` after Tess's password grant.
  # The server scopes every entry of such an answer with `forThisPc` and `accepted` (keyring_scope_to_pc); the scanner's exact
  # key set for the reset entry did not know them and reported the honest entry. These rows are the two rows of that capture
  # (the grant, then the keyring answer), trimmed. The scope keys are allowed only with a pc_id naming a sign-in PC, with the
  # values the server computes.
  class AccessLeakScannerHelpdeskBrowserTest < ActiveSupport::TestCase
    ROWS = File.readlines(File.expand_path('../../fixtures/files/ops_helpdesk_browser_keyring_rows.jsonl', __dir__)).map { |l| JSON.parse(l) }.freeze
    SCENARIO = File.expand_path('../../../scenarios/test_ops_helpdesk/scenario.json.erb', __dir__)

    def data
      JSON.parse(ScenarioBinding.render(File.read(SCENARIO)))
    end

    def scan(rows)
      AccessLeakScanner.new(data).scan(rows.each_with_index.map { |r, i| ['browser.jsonl', i + 1, r] })
    end

    def rows
      Marshal.load(Marshal.dump(ROWS))
    end

    def reset_entry(rs)
      rs[1]['body']['entries'].find { |e| e['id'] == 'tess.reset' }
    end

    test 'the browser capture (grant, then the pc-scoped keyring answer) reports nothing' do
      assert_equal 'records_pc', ROWS[1]['query'][/pc_id=([a-z_]+)/, 1]
      found = scan(rows)
      assert_empty found, found.map { |f| [f.rule, f.owner, f.line, f.json_path].inspect }.join("\n")
    end

    test 'the scope keys are findings with a wrong value, no pc_id, an unknown pc_id or a repeated one' do
      cases = {
        'forThisPc false' => ->(rs) { reset_entry(rs)['forThisPc'] = false },
        'accepted not the policy answer' => ->(rs) { reset_entry(rs)['accepted'] = !reset_entry(rs)['accepted'] },
        'accepted a string' => ->(rs) { reset_entry(rs)['accepted'] = 'yes' },
        'no pc_id in the query' => ->(rs) { rs[1]['query'] = 'rev=052708' },
        'unknown pc_id' => ->(rs) { rs[1]['query'] = 'pc_id=ghost_pc' },
        'pc_id twice' => ->(rs) { rs[1]['query'] = 'pc_id=records_pc&pc_id=records_pc' },
        'a third extra key' => ->(rs) { reset_entry(rs)['extra'] = 1 },
        'one scope key missing' => ->(rs) { reset_entry(rs).delete('accepted') },
        'no grant before it' => ->(rs) { rs.shift }
      }
      cases.each do |label, change|
        rs = rows
        change.call(rs)
        assert_includes scan(rs).map(&:owner), 'helpdesk:keyring:tess', label
      end
    end

    test 'the scope keys without a pc_id are not allowed on the unscoped answer' do
      rs = rows
      rs[1]['query'] = nil
      rs[1].delete('query')
      assert_includes scan(rs).map(&:owner), 'helpdesk:keyring:tess'
    end
  end
end
