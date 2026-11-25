require 'test_helper'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

# Scanner hardening U1b: the recorder's `pc` tag in the second-step rules (placement, the rejected-tag take-back, P2 P5 P7 P8
# P10, the `mfaRequired` mismatch as one `ops_tag` finding) and the tag refutation rule (brief 3.3: window, deadline, present map).
# Rows are the real answers of c1_test_ops_mfa_game242.jsonl (scenarios/test_ops_mfa), tagged as the recorder tags them; the
# two-PC orders the capture did not drive (U6 README) are built from those answers. Hana is admitted at code_pc1 and code_pc2.
class AccessLeakScannerTagsMfaTest < ActiveSupport::TestCase
  FIXTURES = File.expand_path('../fixtures/files/access_leak/tagged', __dir__)
  SCENARIO = File.expand_path('../../scenarios/test_ops_mfa/scenario.json.erb', __dir__)
  BASE = '/break_escape/games/242'.freeze

  def scenario
    JSON.parse(BreakEscape::ScenarioBinding.render(File.read(SCENARIO)))
  end

  def c1_rows
    @c1_rows ||= File.readlines(File.join(FIXTURES, 'c1_test_ops_mfa_game242.jsonl')).map { |l| JSON.parse(l) }
  end

  def c1(n)
    Marshal.load(Marshal.dump(c1_rows.fetch(n - 1)))
  end

  def ts(sec)
    (Time.utc(2026, 11, 25, 10, 0, 0) + sec).strftime('%Y-%m-%dT%H:%M:%S.000Z')
  end

  def pc(id)
    id.nil? ? nil : { 'pcId' => id }
  end

  # ---- rows ---------------------------------------------------------------------------------------------------------------
  def post(route, sec, tag, body, status: 200)
    { 't' => ts(sec), 'method' => 'POST', 'path' => "#{BASE}/#{route}", 'status' => status, 'pc' => pc(tag), 'body' => body }
  end

  def get(path, sec, body, status: 200)
    { 't' => ts(sec), 'method' => 'GET', 'path' => "#{BASE}/#{path}", 'status' => status, 'body' => body }
  end

  # real answers: row 15 (mfaRequired), 29 (a passed step), 90 (lock), 32 (logout), 30 (desktop)
  def required(sec, at, npc = 'hana', tag: at)
    r = c1(15)
    r['t'] = ts(sec)
    r['pc'] = pc(tag)
    r['body'] = r['body'].merge('pcId' => at, 'npcId' => npc)
    r
  end

  def verify(sec, tag, npc = 'hana')
    r = c1(29)
    r['t'] = ts(sec)
    r['pc'] = pc(tag)
    r['body']['npcId'] = npc
    r
  end

  # a sign-in with no second step (row 79's shape: the exempt service account at code_pc2)
  def signin(sec, tag, extra = {})
    r = c1(79)
    r['t'] = ts(sec)
    r['pc'] = pc(tag)
    r['body'] = r['body'].merge(extra)
    r
  end

  def desktop(sec, at, account, status: 200, via: 'password', extra: {})
    session = account && c1(30)['body']['session'].merge('npcId' => account, 'via' => via).merge(extra)
    body = { 'container_id' => at, 'contents' => [], 'session' => session }.compact
    get("container/#{at}", sec, status == 200 ? body : { 'error' => 'no', 'reason' => 'off' }, status: status)
  end

  def sessions_map(sec, map)
    get('scenario', sec, { 'sessions' => map, 'lockoutPcs' => [] })
  end

  def session_of(account, via: 'password')
    c1(30)['body']['session'].merge('npcId' => account, 'via' => via)
  end

  def logout(sec, tag)
    r = c1(32)
    r['t'] = ts(sec)
    r['pc'] = pc(tag)
    r
  end

  def lock(sec, tag, answer_pc: tag)
    r = c1(90)
    r['t'] = ts(sec)
    r['pc'] = pc(tag)
    r['body'] = r['body'].merge('pcId' => answer_pc)
    r
  end

  def lines(rows)
    rows.each_with_index.map { |r, i| ['cap.jsonl', i + 1, r] }
  end

  def scan(rows, data: nil, **opts)
    scanner = AccessLeakScanner.new(data || scenario)
    [scanner, scanner.scan(lines(rows), **opts)]
  end

  def tag_findings(rows, **opts)
    _, findings = scan(rows, **opts)
    findings.select { |f| f.rule == 'ops_tag' }.map { |f| [f.line, f.owner] }
  end

  def ivar(scanner, name)
    scanner.instance_variable_get(name)
  end

  # an honest step sign-in of Hana at a PC: the question, the pass, her own desktop
  def honest_hana(start, at)
    [required(start, at), verify(start + 1, at), desktop(start + 2, at, 'hana')]
  end

  # ---- the real capture ---------------------------------------------------------------------------------------------------
  test 'the real tagged capture C1 gives no ops_tag finding (the refutation rule never flags an honest run)' do
    rows = c1_rows
    _, findings = scan(rows, tags: :required)
    assert_empty findings.select { |f| f.rule == 'ops_tag' }
    assert_empty findings
  end

  # ---- 3.3: the cross-PC check (T6, T6c, T6k) -----------------------------------------------------------------------------
  test 'T6: a sign-in tag moved to the other admitting PC is refuted by the real PC desktop' do
    rows = [signin(1, 'code_pc1', 'npcId' => 'hana'), desktop(2, 'code_pc2', 'hana')]
    assert_equal [[2, 'tag:login']], tag_findings(rows)
  end

  test 'an mfaRequired answer at A adds the account to the present map (over-count), so a moved step tag is the recorded residual' do
    rows = [required(1, 'code_pc1'), verify(2, 'code_pc2'), desktop(3, 'code_pc1', 'hana')]
    assert_empty tag_findings(rows)
  end

  test 'T6 honest twin: the same order with the tag at the real PC is clean' do
    assert_empty tag_findings(honest_hana(1, 'code_pc1'))
  end

  test 'T6c: a sign-in at A, a desktop of B held by another account, then the desktop of A is clean' do
    rows = [required(1, 'code_pc2', 'ines'), verify(2, 'code_pc2', 'ines'),
            required(3, 'code_pc1'), verify(4, 'code_pc1'),
            desktop(5, 'code_pc2', 'ines'), desktop(6, 'code_pc1', 'hana')]
    assert_empty tag_findings(rows)
  end

  test 'T6k: a sign-in at A, its own desktop, then B showing the same account where the map never saw it is clean' do
    rows = honest_hana(1, 'code_pc1') + [desktop(5, 'code_pc2', 'hana')]
    assert_empty tag_findings(rows)
  end

  test 'T6c variant: the cross check is spent by another PC desktop that does not refute' do
    # the first desktop row is B's, showing another account: the check is spent, the later desktop of B showing Hana is not judged
    rows = [required(1, 'code_pc1'), verify(2, 'code_pc1'), desktop(3, 'code_pc2', 'ines'), desktop(4, 'code_pc2', 'hana')]
    assert_empty tag_findings(rows)
  end

  test 'the cross check needs a keyboard password: a token session of the account at another PC does not refute' do
    rows = [signin(1, 'code_pc1', 'npcId' => 'hana'), desktop(2, 'code_pc2', 'hana', via: 'credential')]
    assert_empty tag_findings(rows)
    rows = [signin(1, 'code_pc1', 'npcId' => 'hana'), desktop(2, 'code_pc2', 'hana', extra: { 'remote' => true })]
    assert_empty tag_findings(rows)
  end

  # ---- 3.3: the tagged-PC check (T6g, T6l) --------------------------------------------------------------------------------
  test 'T6g: a 200 desktop of the tagged PC showing no session as the first answer is refuted when no deadline has passed' do
    rows = [required(1, 'code_pc1'), verify(2, 'code_pc1'), desktop(3, 'code_pc1', nil)]
    assert_equal [[3, 'tag:mfa/verify']], tag_findings(rows)
  end

  test 'a 200 desktop of the tagged PC showing another account as the first answer is refuted' do
    rows = [required(1, 'code_pc2'), verify(2, 'code_pc2'), desktop(3, 'code_pc2', 'ines')]
    assert_equal [[3, 'tag:mfa/verify']], tag_findings(rows)
  end

  test 'a sessions map showing another account at the tagged PC is refuted (T6m variant)' do
    rows = [required(1, 'code_pc2'), verify(2, 'code_pc2'), sessions_map(3, 'code_pc2' => session_of('ines'))]
    assert_equal [[3, 'tag:mfa/verify']], tag_findings(rows)
  end

  def token_signin(sec, tag, expires)
    signin(sec, tag, 'npcId' => 'hana', 'via' => 'credential', 'kind' => 'token', 'expiresInS' => expires)
  end

  test 'T6l: a no-session desktop 1 s before the scanner deadline is an end, 3 s before it is a finding' do
    near = [token_signin(0, 'code_pc2', 100), desktop(99, 'code_pc2', nil)]
    far = [token_signin(0, 'code_pc2', 100), desktop(97, 'code_pc2', nil)]
    assert_empty tag_findings(near)
    assert_equal [[2, 'tag:login']], tag_findings(far)
  end

  test 'T6l second half: a row with no readable time cannot show the deadline unpassed' do
    unread = desktop(50, 'code_pc2', nil)
    unread['t'] = 'not a time'
    assert_empty tag_findings([token_signin(0, 'code_pc2', 100), unread])
  end

  test 'T6d: a token sign-in, a row past its deadline, then a reload showing the PC empty is clean' do
    rows = [token_signin(0, 'code_pc2', 100), get('keyring', 120, { 'rev' => 'x', 'unchanged' => true }),
            sessions_map(121, {}), desktop(122, 'code_pc2', nil)]
    assert_empty tag_findings(rows)
  end

  # ---- 3.3: R5-1, the sessions map's absence is an end (T6m) ---------------------------------------------------------------
  test 'T6m: a reload whose sessions map omits the tagged PC is an end, in three sign-in shapes' do
    claim = signin(1, 'code_pc2', 'npcId' => 'hana', 'via' => 'claim')
    relay = signin(1, 'code_pc2', 'npcId' => 'hana', 'via' => 'credential', 'relay' => true, 'kind' => 'assist_invite')
    from = signin(1, 'code_pc2', 'npcId' => 'hana', 'via' => 'credential', 'remote' => true, 'footholdId' => 'jack_office_port')
    [claim, relay, from].each do |first|
      rows = [first, sessions_map(2, {}), desktop(3, 'code_pc2', nil)]
      assert_empty tag_findings(rows), first['body']['via']
    end
  end

  test 'T6m: a locked session of the same account in the map is an end as well' do
    rows = [signin(1, 'code_pc2', 'npcId' => 'hana'), sessions_map(2, 'code_pc2' => session_of('hana').merge('locked' => true)),
            desktop(3, 'code_pc2', 'ines')]
    assert_empty tag_findings(rows)
  end

  # ---- 3.3: the window (T6f, T6e, T6h, T6i, T6j) ------------------------------------------------------------------------
  test 'T6f: after another sign-in the window is closed, so a later empty desktop is an end' do
    rows = honest_hana(1, 'code_pc1') + [required(5, 'code_pc2', 'ines'), verify(6, 'code_pc2', 'ines'), desktop(7, 'code_pc1', nil)]
    assert_empty tag_findings(rows)
  end

  test 'T6f: after the first answer about the tagged PC, a later other-account desktop is an end' do
    rows = honest_hana(1, 'code_pc2') + [desktop(5, 'code_pc2', 'ines')]
    assert_empty tag_findings(rows)
  end

  test 'a 403 desktop of the tagged PC closes the window' do
    rows = [required(1, 'code_pc1'), verify(2, 'code_pc1'), desktop(3, 'code_pc1', nil, status: 403), desktop(4, 'code_pc1', nil)]
    assert_empty tag_findings(rows)
  end

  test 'a lock at the tagged PC closes the window' do
    rows = [required(1, 'code_pc1'), verify(2, 'code_pc1'), lock(3, 'code_pc1'), desktop(4, 'code_pc1', nil)]
    assert_empty tag_findings(rows)
  end

  test 'an endedPcIds naming the tagged PC closes the window' do
    ended = get('network/unplug', 3, { 'success' => true, 'endedPcIds' => ['code_pc1'] })
    ended['method'] = 'POST'
    rows = [required(1, 'code_pc1'), verify(2, 'code_pc1'), ended, desktop(4, 'code_pc1', nil)]
    assert_empty tag_findings(rows)
  end

  test 'a bodyless sign-in row closes the window' do
    lost = post('login', 3, 'code_pc2', nil)
    lost.delete('body')
    rows = [required(1, 'code_pc1'), verify(2, 'code_pc1'), lost, desktop(4, 'code_pc1', nil)]
    assert_empty tag_findings(rows)
  end

  test 'a mfaRequired answer opens no window, a pc: null success opens none' do
    assert_empty tag_findings([required(1, 'code_pc1'), desktop(2, 'code_pc1', nil)])
    rows = [verify(1, nil), desktop(2, 'code_pc1', nil)]
    assert_empty tag_findings(rows)
  end

  test 'a rejected tag opens no window and raises its own finding' do
    rows = [signin(1, 'code_pc1', 'npcId' => 'ines'), desktop(2, 'code_pc1', nil)]
    assert_equal [[1, 'tag:login']], tag_findings(rows)
  end

  test 'T6e: the account kept at B through a 403 off, a tagged sign-in at A, then B desktop first is clean' do
    rows = honest_hana(1, 'code_pc2')
    rows << desktop(5, 'code_pc2', nil, status: 403)
    rows += [required(6, 'code_pc1'), verify(7, 'code_pc1'), desktop(8, 'code_pc2', 'hana'), desktop(9, 'code_pc1', 'hana')]
    assert_empty tag_findings(rows)
  end

  test 'T6e: the same with a power cut and no other end in between, whichever account shows' do
    %w[hana].each do |who|
      rows = [signin(1, 'code_pc2', 'npcId' => who), desktop(2, 'code_pc2', nil, status: 403),
              required(3, 'code_pc1'), verify(4, 'code_pc1'), desktop(5, 'code_pc2', who)]
      assert_empty tag_findings(rows), who
    end
  end

  test 'T6h: a 403 unreachable removes nothing from the present map' do
    rows = [signin(1, 'code_pc2', 'npcId' => 'hana'), desktop(2, 'code_pc2', nil, status: 403),
            required(3, 'code_pc1'), verify(4, 'code_pc1'), desktop(5, 'code_pc2', 'hana')]
    assert_empty tag_findings(rows)
  end

  test 'T6i: a bodyless sign-in row and a session answer naming no PC remove nothing' do
    lost = post('login', 3, nil, nil)
    lost.delete('body')
    technique = post('network/technique', 4, nil, { 'success' => true, 'session' => session_of('hana').merge('host' => 'NOSUCH') })
    technique.delete('pc')
    rows = [signin(1, 'code_pc2', 'npcId' => 'hana'), lost, technique,
            required(5, 'code_pc1'), verify(6, 'code_pc1'), desktop(7, 'code_pc2', 'hana')]
    assert_empty tag_findings(rows)
  end

  test 'T6j: the map runs in a scenario with neither rule set active' do
    data = scenario
    data['rooms'].each_value do |room|
      Array(room['objects']).each { |o| o.delete('policy') if o.is_a?(Hash) }
    end
    scanner, = scan([signin(1, 'code_pc1', 'npcId' => 'hana')], data: data)
    assert_equal false, ivar(scanner, :@mfa_active)
    clean = [signin(1, 'code_pc2', 'npcId' => 'hana'), signin(2, 'code_pc1', 'npcId' => 'hana'), desktop(3, 'code_pc2', 'hana')]
    assert_empty tag_findings(clean, data: data)
    moved = [signin(1, 'code_pc1', 'npcId' => 'hana'), desktop(2, 'code_pc2', 'hana')]
    assert_equal [[2, 'tag:login']], tag_findings(moved, data: data)
  end

  test 'the map removes on a tagged logout, so the cross check then refutes a moved tag' do
    rows = [signin(1, 'code_pc2', 'npcId' => 'hana'), desktop(2, 'code_pc2', 'hana'), logout(3, 'code_pc2'),
            signin(4, 'code_pc1', 'npcId' => 'hana'), desktop(5, 'code_pc2', 'hana')]
    assert_equal [[5, 'tag:login']], tag_findings(rows)
  end

  test 'the map never removes on an untagged logout' do
    rows = [signin(1, 'code_pc2', 'npcId' => 'hana'), desktop(2, 'code_pc2', 'hana'), logout(3, nil),
            signin(4, 'code_pc1', 'npcId' => 'hana'), desktop(5, 'code_pc2', 'hana')]
    assert_empty tag_findings(rows)
  end

  test 'the window state is kept even though no earn rule reads it: the earn state is unchanged by the rule' do
    scanner, = scan(honest_hana(1, 'code_pc1'))
    assert_equal({ 'code_pc1' => 'hana' }, ivar(scanner, :@mfa_at))
    assert_equal ['hana'], ivar(scanner, :@tg_present)['code_pc1'].to_a
  end

  # ---- 3.2: the second-step rules --------------------------------------------------------------------------------------------
  test 'P5: a tagged sign-in is placed at its tag, with no entry' do
    scanner, = scan([signin(1, 'code_pc2', 'npcId' => 'svc_sync')])
    assert_equal 'svc_sync', ivar(scanner, :@mfa_at)['code_pc2']
    assert_equal 'svc_sync', ivar(scanner, :@mfa_placed)['code_pc2']
  end

  test 'T6b second-step half: a sign-in tagged to a PC that does not admit the account is one ops_tag finding and earns nothing' do
    scanner, findings = scan([signin(1, 'code_pc1', 'npcId' => 'svc_sync')])
    assert_equal [[1, 'tag:login']], findings.select { |f| f.rule == 'ops_tag' }.map { |f| [f.line, f.owner] }
    assert_nil ivar(scanner, :@mfa_at)['code_pc1']
    assert_empty ivar(scanner, :@mfa_placed)
  end

  test 'T6b: a rejected tag takes back what an unnamed row takes back at every admitting PC' do
    # Hana passes at code_pc2; a later sign-in of Hana, tagged to the PC that does not admit it, takes her step back
    rows = [required(1, 'code_pc2'), verify(2, 'code_pc2'), lock(3, 'code_pc2'),
            signin(4, 'code_pc1', 'npcId' => 'ines')]
    scanner, = scan(rows)
    assert_nil ivar(scanner, :@mfa_held)['code_pc2'], 'ines is admitted at code_pc2 only: the take-back reaches it'
    rows = rows.dup
    rows[3] = signin(4, 'code_pc2', 'npcId' => 'ines')
    exact, = scan(rows)
    assert_nil ivar(exact, :@mfa_held)['code_pc2']
  end

  test 'a rejected pass tag earns nothing: no held session, and its pending step is closed' do
    rows = [required(1, 'code_pc2'), verify(2, 'push_pc')] # push_pc does not admit Hana
    scanner, findings = scan(rows)
    assert_nil ivar(scanner, :@mfa_held)['code_pc2']
    assert_nil ivar(scanner, :@mfa_held)['push_pc']
    assert_empty ivar(scanner, :@mfa_pending)
    assert_includes findings.map(&:rule), 'ops_tag'
  end

  test 'T9: an mfaRequired answer whose pcId disagrees with the tag is one ops_tag finding, not the older rule too' do
    row = required(1, 'code_pc1', tag: 'code_pc2')
    _, findings = scan([row])
    assert_equal ['ops_tag'], findings.map(&:rule)
    # untagged, the same mismatch stays the second-step rule's own finding
    row.delete('pc')
    other = required(1, 'code_pc1')
    other.delete('pc')
    _, plain = scan([other, c1(29).merge('t' => ts(2)).tap { |r| r.delete('pc') }], tags: :absent)
    assert_not_includes plain.map(&:rule), 'ops_tag'
  end

  test 'P7 and P10: a pass or a cancel is placed at its tag when two steps are open' do
    rows = [required(1, 'code_pc1'), required(2, 'code_pc2'), verify(3, 'code_pc2')]
    scanner, findings = scan(rows)
    assert_equal 'hana', ivar(scanner, :@mfa_held)['code_pc2']
    assert_nil ivar(scanner, :@mfa_held)['code_pc1']
    assert_equal ['code_pc1'], ivar(scanner, :@mfa_pending).keys
    assert_empty findings
    cancel = post('mfa/verify', 4, 'code_pc1', { 'success' => false, 'cancelled' => true }, status: 422)
    scanner, = scan(rows + [cancel])
    assert_empty ivar(scanner, :@mfa_pending)
    other = post('mfa/verify', 4, 'code_pc2', { 'success' => false, 'cancelled' => true }, status: 422)
    scanner, = scan(rows + [other])
    assert_equal ['code_pc1'], ivar(scanner, :@mfa_pending).keys
  end

  test 'P2: a tagged logout ends the tagged PC only; an untagged one ends every PC' do
    rows = [required(1, 'code_pc2'), verify(2, 'code_pc2'), required(3, 'code_pc1'), verify(4, 'code_pc1')]
    scanner, = scan(rows + [logout(5, 'code_pc1')])
    assert_equal({ 'code_pc2' => 'hana' }, ivar(scanner, :@mfa_held))
    scanner, = scan(rows + [logout(5, nil)])
    assert_empty ivar(scanner, :@mfa_held)
  end

  test 'T7: a logout tagged at a PC the account was not at leaves the real session held' do
    rows = [required(1, 'code_pc2'), verify(2, 'code_pc2'), logout(3, 'code_pc1')]
    scanner, = scan(rows)
    assert_equal({ 'code_pc2' => 'hana' }, ivar(scanner, :@mfa_held))
    # and a later sign-in with no step at that PC (no lock before it) is still a second-step finding
    later = scan(rows + [signin(4, 'code_pc2', 'npcId' => 'hana')]).last
    assert_includes later.map(&:rule), 'mfa_session'
  end

  # P8: wrong codes counted at the tagged PC; the lock credited at the tagged PC only
  def wrong(sec, tag, left)
    post('mfa/verify', sec, tag, { 'success' => false, 'message' => 'Incorrect username or password', 'attemptsLeft' => left, 'mfaIncorrect' => true }, status: 422)
  end

  def lockout(sec, tag)
    post('mfa/verify', sec, tag, { 'success' => false, 'message' => BreakEscape::Game::LOGIN_LOCKED_OUT, 'lockedOut' => true, 'attemptsLeft' => 0 }, status: 422)
  end

  def lock_rows(tag_for_lock)
    rows = [required(1, 'code_pc1'), required(2, 'code_pc2', 'ines')]
    (1..4).each { |i| rows << wrong(2 + i, 'code_pc1', 5 - i) }
    rows << lockout(7, tag_for_lock)
    rows
  end

  test 'P8 (a): a wrong code is counted at the one open step of the tagged PC with two steps open' do
    scanner, = scan(lock_rows('code_pc1'))
    assert_equal 4, ivar(scanner, :@mfa_wrong)[%w[code_pc1 hana]]
    assert_equal 0, ivar(scanner, :@mfa_wrong)[%w[code_pc2 ines]]
    assert_empty ivar(scanner, :@mfa_wrong_unknown).to_a
  end

  test 'untagged, two open code steps leave the pair unknown (the closed limit)' do
    rows = lock_rows('code_pc1').map { |r| r.reject { |k, _| k == 'pc' } }
    scanner, = scan(rows, tags: :absent)
    assert_not_empty ivar(scanner, :@mfa_wrong_unknown).to_a
  end

  # only `login_max_attempts` is asked of the game by the lock credit
  class StubGame
    def login_max_attempts(_pc)
      5
    end
  end

  def lock_findings(rows, **opts)
    AccessLeakScanner.new(scenario, game: StubGame.new).scan(lines(rows), **opts).select { |f| f.rule == 'lockout_list' }
  end

  test 'P8 (b): the lock at the tagged PC with max less one wrong codes there is credited, with two code steps open' do
    assert_empty lock_findings(lock_rows('code_pc1'))
  end

  test 'T15b: the lock tagged to the other PC is reported (no credit where the count is not max less one)' do
    assert_equal 1, lock_findings(lock_rows('code_pc2')).size
  end

  test 'P8 (b) closed limit: untagged, two open code steps give no credit' do
    rows = lock_rows('code_pc1').map { |r| r.reject { |k, _| k == 'pc' } }
    assert_equal 1, lock_findings(rows, tags: :absent).size
  end

  test 'P8 (b): a lock with a null tag and two steps open is still reported' do
    assert_equal 1, lock_findings(lock_rows(nil)).size
  end

  # ---- P11 is U3's; the tag rule never reads or writes earn state --------------------------------------------------------
  test 'the tag rule changes no earn state: the same run with and without its window gives the same earned sets' do
    rows = honest_hana(1, 'code_pc1') + [desktop(5, 'code_pc2', 'hana')]
    a, = scan(rows)
    b = AccessLeakScanner.new(scenario)
    b.define_singleton_method(:scan_tag_rule) { |*| nil }
    b.scan(lines(rows))
    %i[@mfa_held @mfa_at @mfa_passed @mfa_locked @ops_earned].each do |name|
      assert_equal b.instance_variable_get(name), a.instance_variable_get(name), name.to_s
    end
  end
end
