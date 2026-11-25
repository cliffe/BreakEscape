require 'test_helper'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

# Ops S7 fix (playtest game 85): the network's name in the LOCATION cell of a NET_SWEEP log row, after a 200 sweep answer
# for that network earlier in the capture, is not a leak. Every near miss stays a finding. The honest case is real data
# (test/fixtures/files/ops_crack_game85_net_sweep.jsonl: the plant, the sweep and the log read of that run, trimmed).
class AccessLeakScannerNetSweepLogTest < ActiveSupport::TestCase
  SCENARIO = File.expand_path('../../scenarios/test_ops_crack/scenario.json.erb', __dir__)
  FIXTURE = File.expand_path('../fixtures/files/ops_crack_game85_net_sweep.jsonl', __dir__)
  BASE = '/break_escape/games/85'.freeze

  def scenario
    @scenario ||= JSON.parse(BreakEscape::ScenarioBinding.render(File.read(SCENARIO)))
  end

  def real
    File.readlines(FIXTURE).map { |l| JSON.parse(l) }
  end

  def scan(rows)
    lines = rows.each_with_index.map { |r, i| ['r.jsonl', i + 1, r] }
    AccessLeakScanner.new(scenario).scan(lines).map { |f| [f.rule, f.owner, f.json_path] }
  end

  def sweep(over = {}, status: 200)
    { 'method' => 'POST', 'path' => "#{BASE}/network/scan", 'status' => status,
      'body' => { 'success' => true, 'network' => { 'id' => 'office_lan', 'swept' => true, 'hosts' => [] } }.merge(over) }
  end

  def log(cells, path: "#{BASE}/log_rows", status: 200, key: 'where', event: 'NET_SWEEP')
    row = { 'id' => 'abc123', 'elapsedMs' => 5, 'event' => event, 'as' => '-', 'where' => '-', 'result' => 'OK', 'detail' => '' }.merge(key => cells)
    { 'method' => 'GET', 'path' => path, 'status' => status, 'body' => { 'rev' => 'a', 'title' => 'Office audit', 'rows' => [row] } }
  end

  NAME = 'Office network'.freeze
  LEAK = [['network_string', 'network:office_lan', '$.rows[0].where']].freeze

  test 'the real capture of game 85 scans clean' do
    assert_empty scan(real)
  end

  test 'the real capture without its sweep answer is the finding' do
    assert_equal [['network_string', 'network:office_lan', '$.rows[0].where']], scan([real[0], real[2]])
  end

  test 'a swept network name in the NET_SWEEP location cell is clean' do
    assert_empty scan([sweep, log(NAME)])
  end

  test 'near misses are findings' do
    assert_equal LEAK, scan([log(NAME), sweep])
    assert_equal LEAK, scan([log(NAME)])
    assert_equal LEAK, scan([sweep, log(NAME, event: 'HOST_SCAN')])
    assert_equal LEAK, scan([sweep, log(NAME, event: 'SHARE_OPEN')])
    assert_equal LEAK, scan([sweep, log("From #{NAME} port")])
    assert_equal [['network_string', 'network:office_lan', '$.rows[0].detail']], scan([sweep, log('x', key: 'detail').tap { |r| r['body']['rows'][0]['detail'] = NAME }])
    assert_equal [['network_string', 'network:office_lan', '$.rows[0].as']], scan([sweep, log('-').tap { |r| r['body']['rows'][0]['as'] = NAME }])
    assert_equal LEAK, scan([sweep, log(NAME, path: "#{BASE}/room/lobby")]).map { |r| [r[0], r[1], '$.rows[0].where'] }
    assert_equal LEAK, scan([sweep, log(NAME, status: 500)])
  end

  test 'a sweep that does not count stands for nothing' do
    assert_equal LEAK, scan([sweep({}, status: 422), log(NAME)])
    assert_equal LEAK, scan([sweep({ 'success' => false }), log(NAME)])
    assert_equal LEAK, scan([sweep({ 'network' => { 'id' => 'office_lan', 'hosts' => [] } }), log(NAME)])
    assert_equal LEAK, scan([sweep({ 'network' => { 'id' => 'office_lan', 'swept' => false } }), log(NAME)])
    assert_equal LEAK, scan([sweep({ 'network' => { 'id' => 'other_lan', 'swept' => true } }), log(NAME)])
    assert_equal LEAK, scan([sweep({ 'network' => nil, 'host' => { 'id' => 'desk_panel' } }), log(NAME)])
    other = sweep.merge('path' => "#{BASE}/network/check")
    assert_equal LEAK, scan([other, log(NAME)])
  end
end
