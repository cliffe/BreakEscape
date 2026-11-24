require 'test_helper'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

# Ops core S3 playtest PL1: a session answer (login_session_answer) has no `id`, only the PC's `host` label, and
# rides in GET /container/<pc id> and in an `already` technique answer as well as in a grant answer. The plan
# (OPS_CORE_PLAN.md 0 and 7) sends `via: "technique"` and `access: "admin"` in the session answer once granted at
# that host; the scanner's owner for such a hash must come from its label, not only from an `id`.
# The shapes are the live proof's answers (test/fixtures/files/access_leak/ops_access_session_answers.jsonl,
# lines 77 to 167 of its capture), judged against the real scenarios/test_ops_access.
class AccessLeakScannerOpsSessionAnswersTest < ActiveSupport::TestCase
  FIXTURE = File.expand_path('../fixtures/files/access_leak/ops_access_session_answers.jsonl', __dir__)
  SCENARIO = File.expand_path('../../scenarios/test_ops_access/scenario.json.erb', __dir__)
  BASE = '/break_escape/games/1'.freeze

  def scenario
    JSON.parse(BreakEscape::ScenarioBinding.render(File.read(SCENARIO)))
  end

  def captured
    File.readlines(FIXTURE).map { |l| JSON.parse(l) }
  end

  def scan(rows, **opts)
    lines = rows.each_with_index.map { |r, i| ['r.jsonl', i + 1, r] }
    AccessLeakScanner.new(scenario).scan(lines, **opts)
  end

  def owners(found)
    found.map(&:owner).uniq.sort
  end

  def grant_row(host, access: nil, already: false)
    session = { 'npcId' => 'ian', 'username' => 'iokafor', 'displayName' => 'Ian Okafor', 'via' => 'technique',
                'portrait' => 'assets/characters/male_office_worker_talk.png', 'remote' => true,
                'footholdId' => 'jack_office_port', 'host' => host }
    session['access'] = access if access
    body = { 'success' => true, 'grant' => 'session', 'session' => session }
    body['already'] = true if already
    { 'method' => 'POST', 'path' => "#{BASE}/network/technique", 'status' => 200, 'body' => body }
  end

  def container_row(pc, host: pc.upcase, access: nil)
    session = grant_row(host, access: access)['body']['session']
    { 'method' => 'GET', 'path' => "#{BASE}/container/#{pc}", 'status' => 200, 'body' => { 'container_id' => pc, 'contents' => [], 'session' => session } }
  end

  test 'the live proof answers (every grant, container and repeat answer of a technique session) report nothing' do
    rows = captured
    assert_equal 19, rows.size
    assert_equal 14, rows.count { |r| r['method'] == 'GET' || r['body']['already'] }, 'every container and repeat answer of the proof (13 of them were flagged by the first leak check)'
    assert_empty scan(rows)
  end

  test 'a container answer after the grant at that host is clear, and before it is a leak' do
    assert_empty scan([grant_row('VAULT01'), container_row('vault01')])
    assert_includes owners(scan([container_row('vault01')])), 'ops:key:via'
  end

  test 'a container answer is judged by the host it is for: a grant at vault01 does not clear desk01' do
    found = scan([grant_row('VAULT01'), container_row('desk01')])
    assert_includes owners(found), 'ops:key:via'
    assert_empty scan([grant_row('VAULT01'), grant_row('DESK01'), container_row('desk01')])
  end

  test 'a repeat grant answer (already) is judged by the host label it names' do
    assert_empty scan([grant_row('DESK01'), grant_row('DESK01', already: true)])
    assert_includes owners(scan([grant_row('VAULT01'), grant_row('DESK01', already: true)])), 'ops:key:via'
  end

  test 'access admin in a container answer needs an admin grant at that host' do
    assert_empty scan([grant_row('VAULT01', access: 'admin'), container_row('vault01', access: 'admin')])
    assert_includes owners(scan([grant_row('VAULT01'), container_row('vault01', access: 'admin')])), 'ops:key:access'
    assert_includes owners(scan([grant_row('DESK01', access: 'admin'), container_row('vault01', access: 'admin')])), 'ops:key:access'
    assert_includes owners(scan([grant_row('VAULT01', access: 'admin'), container_row('vault01', access: 'user')])), 'ops:key:access'
  end

  test 'the finding id under technique is still a leak in a container answer, and an unknown label fails closed' do
    leaked = container_row('vault01')
    leaked['body']['session']['technique'] = 'vault01.archive.old_release'
    assert_includes owners(scan([grant_row('VAULT01'), leaked])), 'ops:key:technique'
    assert_includes owners(scan([grant_row('VAULT01'), container_row('vault01', host: 'NOWHERE')])), 'ops:key:via'
  end

  test 'a session answer in a scan, check or confirm answer is still a leak after the grant' do
    session = grant_row('VAULT01')['body']['session']
    %w[scan check confirm].each do |step|
      row = { 'method' => 'POST', 'path' => "#{BASE}/network/#{step}", 'status' => 200, 'body' => { 'success' => true, 'session' => session } }
      assert_includes owners(scan([grant_row('VAULT01'), row])), 'ops:key:via', step
    end
  end
end
