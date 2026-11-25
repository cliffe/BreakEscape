require 'test_helper'
require(ENV['SCANNER_UNDER_TEST'] || Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s)

# Scanner hardening U2: the recorder's `hash` tag in the crack rules (brief 3.4, H1 to H4). Per hash id: running credits, the
# current run's start and bound, and the running / nomatch / infeasible flags. Rows are the answers of
# c3_test_ops_crack_game241.jsonl (scenarios/test_ops_crack), tagged as the recorder tags them. Dana (guessable, salted, 10 s)
# and farah (reused, salted, 60 s) share a password; deskadmin and sparedesk are common and unsalted; eli is strong.
# Set SCANNER_UNDER_TEST to another copy of the scanner to check that a tamper test fails there ("fails on main").
class AccessLeakScannerTagsCrackTest < ActiveSupport::TestCase
  FIXTURES = File.expand_path('../fixtures/files/access_leak/tagged', __dir__)
  SCENARIO = File.expand_path('../../scenarios/test_ops_crack/scenario.json.erb', __dir__)
  BASE = '/break_escape/games/241'.freeze

  def scenario
    @scenario ||= JSON.parse(BreakEscape::ScenarioBinding.render(File.read(SCENARIO)))
  end

  def ts(sec)
    (Time.utc(2026, 11, 25, 10, 0, 0) + sec).strftime('%Y-%m-%dT%H:%M:%S.000Z')
  end

  def scan(rows)
    lines = rows.each_with_index.map { |r, i| ['r.jsonl', i + 1, r] }
    scanner = AccessLeakScanner.new(scenario)
    scanner.method(:scan).parameters.any? { |_, n| n == :tags } ? scanner.scan(lines, tags: :required) : scanner.scan(lines)
  end

  def hits(rows)
    scan(rows).map { |f| [f.line, f.rule, f.owner] }
  end

  def crack(sec, tag, body, status: 200)
    { 't' => ts(sec), 'method' => 'POST', 'path' => "#{BASE}/crack", 'status' => status,
      'hash' => tag.nil? ? nil : { 'hashId' => tag }, 'body' => body }
  end

  def running(sec, tag, ready)
    crack(sec, tag, { 'success' => true, 'status' => 'running', 'readyInSeconds' => ready })
  end

  def nomatch(sec, tag, runs: nil)
    crack(sec, tag, { 'success' => true, 'status' => 'nomatch' }.merge(runs ? { 'runs' => runs } : {}))
  end

  def cracked(sec, tag, account, ids = nil)
    crack(sec, tag, { 'success' => true, 'status' => 'cracked', 'accountId' => account, 'credentialIds' => ids || ["#{account}.cracked"] })
  end

  def infeasible(sec, tag)
    crack(sec, tag, { 'success' => true, 'status' => 'infeasible', 'runs' => 2 })
  end

  # dana earned at t=12, so farah's reused record may be cracked
  def dana_first
    [running(0, 'dana_hash', 10), cracked(12, 'dana_hash', 'dana')]
  end

  def keyring_with(row_status, id, npc, ready: nil)
    row = { 'id' => id, 'kind' => 'hash', 'source' => 'registry', 'status' => row_status }
    row['readyInSeconds'] = ready if ready
    row
  end

  # ---- the real capture ---------------------------------------------------------------------------------------------------
  test 'the real tagged capture C3 gives no finding' do
    rows = File.readlines(File.join(FIXTURES, 'c3_test_ops_crack_game241.jsonl')).map { |l| JSON.parse(l) }
    assert_empty hits(rows).select { |_, rule, _| rule.to_s.start_with?('crack') }
  end

  test 'an honest tagged run: dana, then farah after her whole wait (within the 2 second tolerance), then the unsalted batch' do
    rows = dana_first + [running(20, 'farah_hash', 60), cracked(78, 'farah_hash', 'farah'),
                         cracked(90, 'sparedesk_hash', 'sparedesk', %w[sparedesk.cracked deskadmin.cracked])]
    assert_empty hits(rows)
  end

  # ---- T11, H2: credits per record ----------------------------------------------------------------------------------------
  test 'T11: two clicks on one record leave a credit that only that record may spend' do
    rows = [running(0, 'dana_hash', 10), running(1, 'dana_hash', 9), cracked(12, 'dana_hash', 'dana'),
            cracked(100, 'farah_hash', 'farah')]
    assert_equal [[4, 'crack_unearned', 'crack:answer:farah']], hits(rows)
  end

  test 'T11: a running answer of another record gives farah no credit' do
    rows = dana_first + [running(20, 'dana_hash', 10), cracked(100, 'farah_hash', 'farah')]
    assert_equal [[4, 'crack_unearned', 'crack:answer:farah']], hits(rows)
  end

  # ---- T12, H3: the wait is timed -----------------------------------------------------------------------------------------
  test 'T12: a salted grant before the run is over is reported, and passes from two seconds before its end' do
    early = dana_first + [running(20, 'farah_hash', 60), cracked(50, 'farah_hash', 'farah')]
    assert_equal [[4, 'crack_unearned', 'crack:answer:farah']], hits(early)
    just_early = dana_first + [running(20, 'farah_hash', 60), cracked(77, 'farah_hash', 'farah')]
    assert_equal [[4, 'crack_unearned', 'crack:answer:farah']], hits(just_early)
    assert_empty hits(dana_first + [running(20, 'farah_hash', 60), cracked(78, 'farah_hash', 'farah')])
  end

  test 'T12: a later running row of the same run does not move the bound' do
    rows = dana_first + [running(20, 'farah_hash', 60), running(60, 'farah_hash', 20), cracked(78, 'farah_hash', 'farah')]
    assert_empty hits(rows)
  end

  # ---- T12b: the current run -----------------------------------------------------------------------------------------------
  test 'T12b: a nomatch row ends the run, so a grant with no new running row earns nothing' do
    rows = dana_first + [running(20, 'farah_hash', 60), nomatch(30, 'farah_hash'), cracked(100, 'farah_hash', 'farah')]
    assert_equal [[5, 'crack_unearned', 'crack:answer:farah']], hits(rows)
  end

  test 'T12b: the bound is the second run\'s start, not the first' do
    base = dana_first + [running(20, 'farah_hash', 60), nomatch(30, 'farah_hash'), running(40, 'farah_hash', 60)]
    assert_equal [[6, 'crack_unearned', 'crack:answer:farah']], hits(base + [cracked(90, 'farah_hash', 'farah')])
    assert_empty hits(base + [cracked(98, 'farah_hash', 'farah')])
  end

  test 'T12b: a cracked row ends the run too, so a second grant needs a new running row' do
    rows = dana_first + [running(20, 'farah_hash', 60), running(21, 'farah_hash', 59), cracked(80, 'farah_hash', 'farah'),
                         cracked(200, 'farah_hash', 'farah')]
    assert_equal [[6, 'crack_unearned', 'crack:answer:farah']], hits(rows)
  end

  test 'T12: an unreadable time earns nothing (fails closed)' do
    rows = dana_first + [running(20, 'farah_hash', 60), cracked(200, 'farah_hash', 'farah')]
    rows.last.delete('t')
    assert_equal [[4, 'crack_unearned', 'crack:answer:farah']], hits(rows)
  end

  # ---- T13, H1: the tagged record ------------------------------------------------------------------------------------------
  test 'T13: a cracked answer must carry a tag naming a record of its own account' do
    wrong = dana_first + [running(20, 'farah_hash', 60), cracked(90, 'dana_hash', 'farah')]
    assert_equal [[4, 'crack_unearned', 'crack:answer:farah']], hits(wrong)
    no_tag = dana_first + [running(20, 'farah_hash', 60), cracked(90, nil, 'farah')]
    assert_includes hits(no_tag), [4, 'crack_unearned', 'crack:answer:farah']
    unknown = dana_first + [running(20, 'farah_hash', 60), cracked(90, 'ghost_hash', 'farah')]
    assert_includes hits(unknown), [4, 'crack_unearned', 'crack:answer:farah']
  end

  test 'T13: an unsalted answer tagged with another account\'s record, or with none, earns nothing' do
    assert_empty hits([cracked(1, 'deskadmin_hash', 'deskadmin', %w[deskadmin.cracked sparedesk.cracked])])
    assert_equal [[1, 'crack_unearned', 'crack:answer:deskadmin']], hits([cracked(1, 'sparedesk_hash', 'deskadmin')])
    assert_equal [[1, 'crack_unearned', 'crack:answer:deskadmin']], hits([cracked(1, nil, 'deskadmin')])
  end

  test 'T13: a tagged cracked row that names no account still passes (the bare answer)' do
    assert_empty hits([crack(1, nil, { 'success' => true, 'status' => 'cracked' })])
  end

  # ---- H4: flags per record ------------------------------------------------------------------------------------------------
  test 'H4: a keyring row running, and a wait map, are judged against their own record\'s running answer' do
    wait_map = lambda do |id|
      { 'method' => 'GET', 'path' => "#{BASE}/keyring", 'status' => 200,
        'body' => { 'rev' => 'abc', 'unchanged' => true, 'readyInSeconds' => { id => 5 } } }
    end
    assert_empty hits([running(0, 'dana_hash', 10), wait_map.call('dana_hash')])
    assert_includes hits([running(0, 'farah_hash', 60), wait_map.call('dana_hash')]).map { |_, r, o| [r, o] }, ['crack_row', 'crack:row:readyInSeconds']
  end

  test 'H4: infeasible needs the tagged strong record and its own nomatch with runs 1' do
    assert_empty hits([nomatch(0, 'eli_hash', runs: 1), infeasible(1, 'eli_hash')])
    assert_equal [[2, 'crack_answer', 'crack:answer']], hits([nomatch(0, 'dana_hash', runs: 1), infeasible(1, 'eli_hash')]).select { |l, *| l == 2 }
    assert_includes hits([nomatch(0, 'eli_hash', runs: 1), infeasible(1, nil)]), [2, 'crack_answer', 'crack:answer']
    assert_includes hits([nomatch(0, 'eli_hash', runs: 1), infeasible(1, 'dana_hash')]), [2, 'crack_answer', 'crack:answer']
  end

  test 'H4: nomatch with runs 1 must name the strong record' do
    assert_includes hits([nomatch(0, 'dana_hash', runs: 1)]), [1, 'crack_answer', 'crack:answer']
    assert_includes hits([nomatch(0, nil, runs: 1)]), [1, 'crack_answer', 'crack:answer']
  end

  test 'H4: a running wait beyond the tagged record\'s own wait is reported' do
    assert_includes hits([running(0, 'dana_hash', 60)]), [1, 'crack_answer', 'crack:answer']
  end
end
