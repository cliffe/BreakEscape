require 'test_helper'
require_relative '../support/network_ops_scenario'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

# Ops core S1 (OPS_CORE_PLAN.md 11.4): collect_ops_secrets and the `ops_string` rule of the leak
# scanner. The scenario is the Ruby-built ops fixture with the test-only `cli` objects merged in.
class AccessLeakScannerOpsTest < ActiveSupport::TestCase
  ROOM = '/break_escape/games/1/room/lobby'.freeze
  VIEW = '/break_escape/games/1/network'.freeze
  SCAN = '/break_escape/games/1/network/scan'.freeze

  def data
    NetworkOpsScenario.with_cli(NetworkOpsScenario.scenario)
  end

  def row(body, path: VIEW, method: 'GET')
    { 'method' => method, 'path' => path, 'status' => 200, 'body' => body }
  end

  def scan(rows, ops_steps: nil, scenario: data)
    lines = rows.each_with_index.map { |r, i| ['r.jsonl', i + 1, r] }
    AccessLeakScanner.new(scenario).scan(lines, ops_steps: ops_steps)
  end

  def summary(findings)
    findings.map { |f| [f.line, f.rule, f.owner] }
  end

  def sweep_answer(network_id, hosts)
    row({ 'success' => true, 'network' => { 'id' => network_id, 'swept' => true, 'hosts' => hosts } }, path: SCAN, method: 'POST')
  end

  def scan_answer(host)
    row({ 'success' => true, 'host' => host.merge('scanned' => true) }, path: SCAN, method: 'POST')
  end

  def device_row(id, name)
    { 'id' => id, 'kind' => 'device', 'name' => name }
  end

  test 'the collector registers names, products, versions, labels, addresses, ranges and banners, with the shared word left out' do
    strings = AccessLeakScanner.new(data).instance_variable_get(:@ops_strings)
    [NetworkOpsScenario::DEVICE_NAME, 'Quillfeather queue', NetworkOpsScenario::VERSION_SECRET, NetworkOpsScenario::SERVICE_LABEL,
     '10.20.0.0/24', '10.20.0.15', '10.20.0.1', 'SVC-BANNER-TEXT ready', 'BANNER-ONLY-TEXT', '192.168.7.5'].each do |text|
      assert strings.key?(text), "#{text} not collected"
    end
    refute strings.key?('http'), 'a service word two services carry is left out'
    refute strings.key?('RANGE-NOTE-TEXT'), 'a _note is not a secret'
    assert_equal :listed, strings['10.20.0.0/24'].first[:tag]
    assert_equal :sweep, strings['10.20.0.15'].first[:tag]
    assert_equal :listed, strings['192.168.7.5'].first[:tag], 'an address on an open network is listed, not swept'
    assert_equal :scan, strings['SVC-BANNER-TEXT ready'].first[:tag]
    assert_operator AccessLeakScanner.new(data).counts[:ops_strings], :>, 10
  end

  test 'a host name in the view of an unswept network is reported; after the sweep answer it is not' do
    listed = row({ 'footholds' => [{ 'hosts' => [device_row('print_srv', NetworkOpsScenario::DEVICE_NAME)] }] })
    assert_equal [[1, 'ops_string', 'ops:host:print_srv']], summary(scan([listed]))
    swept = sweep_answer('office_lan', [device_row('print_srv', NetworkOpsScenario::DEVICE_NAME)])
    assert_empty scan([swept, listed])
    assert_equal [[1, 'ops_string', 'ops:host:print_srv']], summary(scan([listed, swept])),
                 'the order of the log counts: the first answer is before the sweep'
  end

  test 'a host name in a bootstrap or room answer is reported before the sweep' do
    assert_equal [[1, 'ops_string', 'ops:host:print_srv']], summary(scan([row({ 'note' => NetworkOpsScenario::DEVICE_NAME }, path: ROOM)]))
  end

  test 'sweeping one network does not earn another network host' do
    swept = sweep_answer('server_net', [])
    leak = row({ 'footholds' => [{ 'hosts' => [device_row('print_srv', NetworkOpsScenario::DEVICE_NAME)] }] })
    assert_equal [[2, 'ops_string', 'ops:host:print_srv']], summary(scan([swept, leak]))
  end

  test 'a held session row earns the address of its PC before any sweep' do
    pc = { 'id' => 'sam_pc', 'kind' => 'pc', 'address' => '10.20.0.15' }
    assert_equal [[1, 'ops_string', 'ops:address:sam_pc']], summary(scan([row({ 'hosts' => [pc] })]))
    assert_empty scan([row({ 'hosts' => [pc.merge('session' => { 'username' => 'sokafor' })] })])
    other = { 'id' => 'lena_pc', 'kind' => 'pc', 'address' => '10.20.0.21' }
    held = row({ 'hosts' => [pc.merge('session' => { 'username' => 'sokafor' }), other] })
    assert_equal [[1, 'ops_string', 'ops:address:lena_pc']], summary(scan([held])), 'a held session on one PC earns only that PC'
  end

  test 'a product and label are reported before the scan of their host, and only that host earns them' do
    leak = row({ 'host' => { 'id' => 'print_srv', 'services' => [{ 'name' => 'queue', 'product' => 'Quillfeather queue' }] } })
    assert_equal [[1, 'ops_string', 'ops:service:print_srv']], summary(scan([leak]))
    label = row({ 'host' => { 'id' => 'sam_pc', 'services' => [{ 'name' => 'web', 'label' => NetworkOpsScenario::SERVICE_LABEL }] } })
    assert_equal [[1, 'ops_string', 'ops:service:sam_pc']], summary(scan([label]))
    own = scan_answer('id' => 'print_srv', 'services' => [{ 'name' => 'queue', 'product' => 'Quillfeather queue' }])
    assert_empty scan([own, leak])
    other = scan_answer('id' => 'lab_box', 'services' => [{ 'name' => 'web', 'product' => 'Quillfeather web' }])
    assert_equal [[2, 'ops_string', 'ops:service:print_srv']], summary(scan([other, leak]))
  end

  # The row shape the server really sends (`network_ops.rb` ops_add_host_fields!): `scanned: true`
  # arrives together with `services`, so it cannot be what earns the scan step.
  def scanned_device_row
    { 'id' => 'print_srv', 'kind' => 'device', 'name' => NetworkOpsScenario::DEVICE_NAME, 'scanned' => true,
      'services' => [{ 'name' => 'queue', 'port' => 631, 'product' => 'Quillfeather queue', 'version' => NetworkOpsScenario::VERSION_SECRET }] }
  end

  test 'a /network row that lists a service for a host never scanned is reported, even with scanned true on the row' do
    view = row({ 'footholds' => [{ 'hosts' => [scanned_device_row] }] })
    findings = scan([view], ops_steps: ['sweep:office_lan'])
    assert_includes summary(findings), [1, 'ops_string', 'ops:service:print_srv']
    assert_empty scan([scan_answer('id' => 'print_srv'), view], ops_steps: ['sweep:office_lan'])
    assert_empty scan([view], ops_steps: ['sweep:office_lan', 'scan:print_srv']), 'the caller can name the scan'
  end

  test 'a sweep answer whose row lists a service for an unscanned host is reported' do
    answer = sweep_answer('office_lan', [scanned_device_row])
    assert_includes summary(scan([answer])), [1, 'ops_string', 'ops:service:print_srv']
    assert_empty scan([scan_answer('id' => 'print_srv'), answer])
  end

  test 'a device name on an open network is listed: a leak before the first answer that lists its row' do
    data = self.data
    data['hosts']['bench_dev'] = { 'name' => 'Vellum label printer', 'network' => 'workshop_lan' }
    registered = AccessLeakScanner.new(data).instance_variable_get(:@ops_strings)
    assert_equal :listed, registered['Vellum label printer'].first[:tag]
    bootstrap = row({ 'note' => 'Vellum label printer' }, path: '/break_escape/games/1/scenario')
    assert_equal [[1, 'ops_string', 'ops:host:bench_dev']], summary(scan([bootstrap], scenario: data))
    listing = row({ 'footholds' => [{ 'hosts' => [device_row('bench_dev', 'Vellum label printer')] }] })
    assert_empty scan([listing], scenario: data)
    assert_equal [[2, 'ops_string', 'ops:host:bench_dev']], summary(scan([listing, bootstrap], scenario: data))
  end

  test 'a version several hosts share is clear once any of them is scanned' do
    leak = row({ 'note' => NetworkOpsScenario::VERSION_SECRET })
    assert_operator scan([leak]).length, :>, 1
    assert_empty scan([scan_answer('id' => 'lab_box'), leak])
  end

  test 'the cli banner is a scan string; the sweep answer does not earn it' do
    banner = row({ 'hosts' => [{ 'id' => 'sam_pc', 'services' => [{ 'banner' => 'SVC-BANNER-TEXT ready' }] }] })
    sweep = sweep_answer('office_lan', [])
    assert_equal [[2, 'ops_string', 'ops:service:sam_pc']], summary(scan([sweep, banner]))
    assert_empty scan([scan_answer('id' => 'sam_pc'), banner])
  end

  test 'a range is a leak until its network block appears in a /network answer, and any time in a non-network answer' do
    text = { 'note' => '10.30.0.0/28' }
    assert_equal [[1, 'ops_string', 'ops:network:server_net']], summary(scan([row({ 'footholds' => [{ 'networks' => [text] }] })]))
    shown = row({ 'footholds' => [{ 'networks' => [{ 'id' => 'server_net', 'name' => 'Server network', 'cli' => { 'range' => '10.30.0.0/28' } }] }] })
    assert_empty scan([shown])
    assert_equal [[2, 'ops_string', 'ops:network:server_net']], summary(scan([shown, row(text, path: ROOM)]))
  end

  test 'an address on an open network is listed at the first answer that lists its row, and a bootstrap answer before it leaks' do
    bootstrap = row({ 'note' => '192.168.7.5' }, path: '/break_escape/games/1/scenario')
    assert_equal [[1, 'ops_string', 'ops:address:bench_pc']], summary(scan([bootstrap]))
    listing = row({ 'footholds' => [{ 'hosts' => [{ 'id' => 'bench_pc', 'kind' => 'pc', 'name' => 'Bench', 'address' => '192.168.7.5' }] }] })
    assert_empty scan([listing])
    assert_equal [[2, 'ops_string', 'ops:address:bench_pc']], summary(scan([listing, bootstrap]))
  end

  test 'addresses match as whole tokens: 10.20.0.1 is not found inside 10.20.0.15' do
    findings = scan([row({ 'note' => 'host 10.20.0.15 here' })])
    assert_equal [[1, 'ops_string', 'ops:address:sam_pc']], summary(findings)
    assert_equal [[1, 'ops_string', 'ops:address:print_srv']], summary(scan([row({ 'note' => 'host 10.20.0.1.' })]))
    assert_equal [[1, 'ops_string', 'ops:address:print_srv']], summary(scan([row({ 'note' => '10.20.0.1' })]))
    assert_empty scan([row({ 'note' => '110.20.0.1' })])
  end

  test 'steps named by the caller count as earned' do
    leak = row({ 'footholds' => [{ 'hosts' => [device_row('print_srv', NetworkOpsScenario::DEVICE_NAME)] }] })
    assert_empty scan([leak], ops_steps: ['sweep:office_lan'])
    assert_equal 1, scan([leak], ops_steps: ['sweep:server_net']).length
  end

  test 'a report line names the rule and the owner, never the string' do
    findings = scan([row({ 'note' => NetworkOpsScenario::DEVICE_NAME }, path: ROOM)])
    lines = AccessLeakScanner.new(data).report_lines(findings)
    assert_equal 1, lines.length
    refute_includes lines.first, NetworkOpsScenario::DEVICE_NAME
    assert_includes lines.first, 'ops_string'
  end

  test 'a scenario with no hosts and no discovery registers only the catalog entries it does not link' do
    scanner = AccessLeakScanner.new(NetworkModelScenario.scenario)
    modules = BreakEscape::RealismCatalog.entry_ids.map { |id| BreakEscape::RealismCatalog.lookup(id)['module'].to_s.strip }
    assert_equal modules.reject(&:empty?).uniq.length, scanner.counts[:ops_strings]
    owners = scanner.instance_variable_get(:@ops_strings).values.flatten.map { |o| o[:owner] }
    assert owners.all? { |o| o.start_with?('ops:catalog:') }, 'only unlinked catalog entries are registered'
  end
end
