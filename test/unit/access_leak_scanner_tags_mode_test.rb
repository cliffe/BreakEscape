require 'test_helper'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

# Scanner hardening U1a: capture modes, refusals (`tag_problem`), the reader API (`@tags_on`, `row_pc_tag`, `row_hash_tag`), and
# the recorder's `pc` tag in the privilege rules (sign-in, sign-out, lock, the rejected-tag rule and the `ops_tag` finding).
# The rows are the real ones of ops_privilege_browser_run_1.jsonl (rows 23, 24, 36, 43), tagged the way the recorder (1.0.21)
# writes them; scenarios/test_ops_privilege is the scenario. Every test that closes a recorded limit also holds the untagged
# half, which still gives the limit (the old exit 2 or false finding).
class AccessLeakScannerTagsModeTest < ActiveSupport::TestCase
  FIXTURES = File.expand_path('../fixtures/files', __dir__)
  RECORDER = File.expand_path('../../.claude/skills/playtest-scenario/scripts/response-capture.js', __dir__)
  SCENARIO = File.expand_path('../../scenarios/test_ops_privilege/scenario.json.erb', __dir__)
  BASE = '/break_escape/games/68'.freeze

  def scenario
    JSON.parse(BreakEscape::ScenarioBinding.render(File.read(SCENARIO)))
  end

  def real_rows
    @real_rows ||= File.readlines(File.join(FIXTURES, 'ops_privilege_browser_run_1.jsonl')).map { |l| JSON.parse(l) }
  end

  def real(n)
    Marshal.load(Marshal.dump(real_rows.fetch(n - 1)))
  end

  # time-stamped copies so the rows of one run are in order
  def at(row, second)
    row.merge('t' => format('2026-11-24T00:10:%02d.000Z', second))
  end

  def pc(id)
    id.nil? ? nil : { 'pcId' => id }
  end

  # Adel's keyboard sign-in (real row 23), tagged with `tag` unless it is :none
  def adel_login(second, tag)
    row = at(real(23), second)
    row['pc'] = tag == :none ? nil : pc(tag)
    row.delete('pc') if tag == :none
    row
  end

  # an administrator who is local to desk_a and desk_b: bay_pc does not admit it
  def deskadmin_login(second, tag)
    at({ 'method' => 'POST', 'path' => "#{BASE}/login", 'status' => 200, 'pc' => pc(tag),
         'body' => { 'success' => true, 'npcId' => 'deskadmin', 'username' => 'deskadmin', 'displayName' => 'Desk administrator',
                     'via' => 'password', 'access' => 'admin' } }, second)
  end

  def bay_desktop(second)
    at(real(24), second)
  end

  def logout_row(second, tag)
    at({ 'method' => 'POST', 'path' => "#{BASE}/logout", 'status' => 200, 'pc' => pc(tag),
         'body' => { 'success' => true, 'endedPcIds' => [] } }, second)
  end

  def lock_row(second, tag, answer_pc: 'bay_pc')
    body = { 'success' => true, 'locked' => true }
    body['pcId'] = answer_pc if answer_pc
    at({ 'method' => 'POST', 'path' => "#{BASE}/lock_session", 'status' => 200, 'pc' => pc(tag), 'body' => body }, second)
  end

  def strip_tags(rows)
    rows.map { |r| r.reject { |k, _| %w[pc hash].include?(k) } }
  end

  def lines(rows, source = 'cap.jsonl')
    rows.each_with_index.map { |r, i| [source, i + 1, r] }
  end

  def scan(rows, **opts)
    scanner = AccessLeakScanner.new(scenario)
    findings = scanner.scan(lines(rows), **opts)
    [scanner, findings]
  end

  def rules(findings)
    findings.map { |f| [f.line, f.rule, f.owner] }
  end

  # only the tag findings: a sign-in that earns nothing also leaves its `access` key unexplained (`ops_string`), as on `main`
  def tag_rules(findings)
    rules(findings).select { |r| r[1] == 'ops_tag' }
  end

  def earned(scanner)
    scanner.instance_variable_get(:@ops_earned).to_a.grep(/\Aadmin:/).sort
  end

  def held(scanner)
    scanner.instance_variable_get(:@ops_session_accounts).dup
  end

  # ---- the route lists (3.1) ---------------------------------------------------------------------------------------------

  test 'the scanner holds the recorder route lists (the recorder source is read)' do
    source = File.read(RECORDER)
    pc = source[%r{^const PC_ROUTE_RE = /\\/\((.+?)\)\$/;}, 1]
    crack = source[%r{^const CRACK_ROUTE_RE = /\\/\((.+?)\)\$/;}, 1] || source[%r{^const CRACK_ROUTE_RE = /\\/(\w+)\$/;}, 1]
    assert pc, 'PC_ROUTE_RE was found in the recorder'
    assert crack, 'CRACK_ROUTE_RE was found in the recorder'
    assert_equal pc.split('|').map { |r| r.delete('\\') }.sort, AccessLeakScanner::PC_TAG_ROUTES.sort
    assert_equal crack.split('|').sort, AccessLeakScanner::CRACK_TAG_ROUTES.sort
  end

  test 'a row is tag-bearing only as a POST on one of the routes, query ignored' do
    kind = ->(method, path) { AccessLeakScanner.tag_route_kind('method' => method, 'path' => path) }
    assert_equal :pc, kind.call('POST', "#{BASE}/login")
    assert_equal :pc, kind.call('POST', "#{BASE}/mfa/verify?x=1")
    assert_equal :hash, kind.call('POST', "#{BASE}/crack")
    assert_nil kind.call('GET', "#{BASE}/login")
    assert_nil kind.call('POST', "#{BASE}/login_accounts")
    assert_nil kind.call('POST', "#{BASE}/inventory")
  end

  # ---- refusals (T1 to T5, T16) ------------------------------------------------------------------------------------------

  test 'T1: a PC-route row without its pc key in a file whose other rows have one is refused as mixed' do
    rows = [adel_login(1, 'bay_pc'), logout_row(2, 'bay_pc')]
    assert_nil AccessLeakScanner.tag_problem({ 'cap.jsonl' => rows }, :auto)
    rows[1].delete('pc')
    assert_match(/both with and without their tag key/, AccessLeakScanner.tag_problem({ 'cap.jsonl' => rows }, :auto))
    assert_raises(ArgumentError) { scan(rows) }
  end

  test 'T2: stripping every tag is refused when tags are required and read as untagged otherwise' do
    tagged = [adel_login(1, 'bay_pc'), bay_desktop(2)]
    stripped = strip_tags(tagged)
    assert_match(/no recorder tags/, AccessLeakScanner.tag_problem({ 'cap.jsonl' => stripped }, :required))
    assert_nil AccessLeakScanner.tag_problem({ 'cap.jsonl' => stripped }, :absent)
    assert_nil AccessLeakScanner.tag_problem({ 'cap.jsonl' => stripped }, :auto)
    assert_raises(ArgumentError) { scan(stripped, tags: :required) }
    # library :auto reads the stripped file as untagged: today's rules, never fewer findings than the same rows give
    # when judged as untagged (an admin sign-in no PC is named for earns nothing, so the profile read is reported)
    _, auto = scan(stripped)
    _, absent = scan(stripped, tags: :absent)
    assert_equal rules(absent), rules(auto)
    assert_includes auto.map(&:rule), 'profile_admin_read'
  end

  test 'a file with no tag-bearing row fits every mode' do
    rows = [bay_desktop(1)]
    %i[required absent auto].each { |mode| assert_nil AccessLeakScanner.tag_problem({ 'cap.jsonl' => rows }, mode), mode.to_s }
    %i[required absent auto].each { |mode| scan(rows, tags: mode) }
  end

  test 'an unknown mode is an error' do
    assert_raises(ArgumentError) { AccessLeakScanner.tag_problem({}, :loose) }
    assert_raises(ArgumentError) { scan([bay_desktop(1)], tags: :loose) }
  end

  test 'T3: a pc tag on a row that is not a PC route, a hash tag off /crack, a pc tag on /crack, a hash tag on /login are refused' do
    get_row = bay_desktop(1).merge('pc' => pc('bay_pc'))
    assert_match(/`pc` tag on a row that is not a PC/, AccessLeakScanner.tag_problem({ 'cap.jsonl' => [get_row] }, :auto))
    assert_match(/`hash` tag on a row that is not a POST \/crack/,
                 AccessLeakScanner.tag_problem({ 'cap.jsonl' => [adel_login(1, 'bay_pc').merge('hash' => { 'hashId' => 'hash_a' })] }, :auto))
    crack = { 'method' => 'POST', 'path' => "#{BASE}/crack", 'status' => 200, 'body' => {}, 'pc' => pc('bay_pc') }
    assert_match(/`pc` tag on a row that is not a PC/, AccessLeakScanner.tag_problem({ 'cap.jsonl' => [crack] }, :auto))
    assert_raises(ArgumentError) { scan([get_row]) }
  end

  test 'T4: a tag value that is not null or exactly one id of 1 to 200 characters is refused' do
    bad = [{ 'pcId' => 5 }, { 'pcId' => '' }, { 'pcId' => 'x' * 201 }, { 'pcId' => 'bay_pc', 'extra' => 1 }, { 'pcid' => 'bay_pc' },
           'bay_pc', ['bay_pc'], {}]
    bad.each do |value|
      row = adel_login(1, 'bay_pc').merge('pc' => value)
      assert_match(/neither null nor exactly/, AccessLeakScanner.tag_problem({ 'cap.jsonl' => [row] }, :auto), value.inspect)
      assert_raises(ArgumentError, value.inspect) { scan([row]) }
    end
    [nil, { 'pcId' => 'x' * 200 }, { 'pcId' => 'a' }].each do |value|
      assert_nil AccessLeakScanner.tag_problem({ 'cap.jsonl' => [adel_login(1, 'bay_pc').merge('pc' => value)] }, :auto), value.inspect
    end
    bad_hash = { 'method' => 'POST', 'path' => "#{BASE}/crack", 'status' => 200, 'body' => {}, 'hash' => { 'hashId' => 3 } }
    assert_match(/neither null nor exactly/, AccessLeakScanner.tag_problem({ 'cap.jsonl' => [bad_hash] }, :auto))
  end

  test 'T5: a login key on any row is refused by the library and by the file check' do
    [bay_desktop(1), adel_login(1, 'bay_pc')].each do |row|
      row = row.merge('login' => { 'pcId' => 'bay_pc' })
      assert_match(/holds a `login` tag/, AccessLeakScanner.tag_problem({ 'cap.jsonl' => [row] }, :auto))
      assert_raises(ArgumentError) { scan([row]) }
    end
    # a `login` key inside an answer body (a route name) is not a tag
    row = bay_desktop(1)
    row['body']['login'] = 'something'
    assert_nil AccessLeakScanner.tag_problem({ 'cap.jsonl' => [row] }, :auto)
  end

  # ---- T6e on the privilege rules: the present map with an admin and a non-admin account, with and without --resume ------------

  def priv_desktop(second, pc_id, session_account, status: 200, access: nil)
    row = bay_desktop(second)
    row['path'] = "#{BASE}/container/#{pc_id}"
    row['status'] = status
    row['body'] = if status == 200
                    sess = { 'npcId' => session_account, 'via' => 'password' }
                    sess['access'] = access if access
                    { 'container_id' => pc_id, 'contents' => [], 'session' => sess }
                  else
                    { 'error' => 'no', 'reason' => 'off' }
                  end
    row
  end

  def priv_signin(second, tag, account, access: nil)
    body = { 'success' => true, 'npcId' => account, 'username' => account, 'displayName' => account, 'via' => 'password' }
    body['access'] = access if access
    at({ 'method' => 'POST', 'path' => "#{BASE}/login", 'status' => 200, 'pc' => pc(tag), 'body' => body }, second)
  end

  # the account kept at B through a 403 `off`, a tagged sign-in at A, then B's desktop first: clean, whichever kind of account and
  # with or without a --resume entry (the tags do not reach a resumed session, and the map keeps the account at B)
  [['admin', 'deskadmin', 'desk_a', 'desk_b', 'admin'], ['non-admin', 'priya', 'bay_pc', 'sam_pc', nil]].each do |kind, who, a, b, access|
    [false, true].each do |resume|
      test "T6e (privilege rules): #{kind} account, #{resume ? 'with' : 'without'} a --resume entry, is clean" do
        rows = [priv_signin(1, b, who, access: access), priv_desktop(2, b, who, access: access),
                priv_desktop(3, b, nil, status: 403),
                priv_signin(4, a, who, access: access), priv_desktop(5, b, who, access: access)]
        opts = resume ? { resumes: ["#{who}@#{b}@#{rows.last['t']}"] } : {}
        scanner, findings = scan(rows, **opts)
        assert_empty tag_rules(findings), "#{kind} resume=#{resume}"
      end
    end
  end

  # R1-m9: the real tagged capture C2 (test_ops_privilege, dev game 243) is read by the library. With no game record the harvest rules
  # report what only the game's `cachedAt` record clears (the CLI, with the game, is clean), so only the tag rules are held to nothing.
  test 'the real tagged capture C2 is accepted in the required mode and raises no tag finding' do
    c2 = File.readlines(File.join(FIXTURES, 'access_leak/tagged/c2_test_ops_privilege_game243.jsonl')).map { |l| JSON.parse(l) }
    assert_nil AccessLeakScanner.tag_problem({ 'c2.jsonl' => c2 }, :required)
    scanner, findings = scan(c2, tags: :required)
    assert_empty tag_rules(findings)
    assert_empty scanner.unused_entries
    assert_equal %w[harvest_hash harvest_unearned log_row ops_string], findings.map(&:rule).uniq.sort
  end

  test 'T16: a tagged file and an untagged file of one run are refused, in either order' do
    tagged = [adel_login(1, 'bay_pc')]
    untagged = strip_tags([adel_login(2, 'bay_pc')])
    problem = AccessLeakScanner.tag_problem({ 'a.jsonl' => tagged, 'b.jsonl' => untagged }, :auto)
    assert_match(/different modes/, problem)
    assert_match(/different modes/, AccessLeakScanner.tag_problem({ 'b.jsonl' => untagged, 'a.jsonl' => tagged }, :auto))
    err = assert_raises(ArgumentError) { AccessLeakScanner.new(scenario).scan(lines(tagged, 'a.jsonl') + lines(untagged, 'b.jsonl')) }
    assert_match(/different modes/, err.message)
    # a file with no tag-bearing row joins either
    assert_nil AccessLeakScanner.tag_problem({ 'a.jsonl' => tagged, 'b.jsonl' => [bay_desktop(3)] }, :auto)
    assert_nil AccessLeakScanner.tag_problem({ 'a.jsonl' => untagged, 'b.jsonl' => [bay_desktop(3)] }, :auto)
  end

  test 'T8 (library half): names given with a tagged file are an argument error; resumes are allowed' do
    rows = [adel_login(1, 'bay_pc'), bay_desktop(2)]
    assert_raises(ArgumentError) { scan(rows, signins: ['adel@bay_pc#1']) }
    assert_raises(ArgumentError) { scan(rows, logouts: ['adel@bay_pc#1']) }
    scanner, = scan(rows, resumes: ['adel@bay_pc@2026-11-24T00:10:01.000Z'])
    assert_equal ['adel@bay_pc@2026-11-24T00:10:01.000Z (--resume)'], scanner.unused_entries
    # the same names with the same rows untagged are accepted, as before
    scan(strip_tags(rows), signins: ['adel@bay_pc#1'])
    scan(rows, signins: [], logouts: [])
  end

  # ---- the reader API ----------------------------------------------------------------------------------------------------

  test 'tags are read only in a tagged run: @tags_on, row_pc_tag and row_hash_tag' do
    scanner = AccessLeakScanner.new(scenario)
    assert_equal false, scanner.instance_variable_get(:@tags_on)
    row = adel_login(1, 'bay_pc')
    assert_nil scanner.send(:row_pc_tag, row)
    scanner.scan(lines([row]))
    assert_equal true, scanner.instance_variable_get(:@tags_on)
    assert_equal 'bay_pc', scanner.send(:row_pc_tag, row)
    assert_equal 'bay_pc', scanner.send(:mfa_row_pc_tag, row)
    assert_nil scanner.send(:row_pc_tag, adel_login(1, nil)), 'null is no tag'
    assert_nil scanner.send(:row_pc_tag, adel_login(1, 'not_a_pc')), 'only a sign-in PC of the scenario'
    assert_nil scanner.send(:row_pc_tag, adel_login(1, :none))
    assert_equal 'hash_a', scanner.send(:row_hash_tag, 'hash' => { 'hashId' => 'hash_a' })
    assert_nil scanner.send(:row_hash_tag, 'hash' => nil)
    assert_nil scanner.send(:row_hash_tag, {})
    again = AccessLeakScanner.new(scenario)
    again.scan(lines(strip_tags([row])))
    assert_equal false, again.instance_variable_get(:@tags_on)
    assert_nil again.send(:row_pc_tag, row), 'an untagged run reads no tag'
    assert_nil again.send(:row_hash_tag, 'hash' => { 'hashId' => 'hash_a' })
  end

  # ---- sign-in (P1, P12) -------------------------------------------------------------------------------------------------

  test 'P1: a tagged sign-in at one of several admitting PCs earns its step with no entry; untagged it needs --signin' do
    rows = [adel_login(1, 'bay_pc'), bay_desktop(2)]
    scanner, findings = scan(rows)
    assert_empty rules(findings)
    assert_equal ['admin:bay_pc'], earned(scanner)
    assert_equal 'adel', held(scanner)['bay_pc']
    # the same rows without the tag: seven PCs admit Adel, so nothing is earned and the read is reported (the old limit)
    _, untagged = scan(strip_tags(rows))
    assert_includes untagged.map(&:rule), 'profile_admin_read'
    _, named = scan(strip_tags(rows), signins: ['adel@bay_pc#1'])
    assert_empty rules(named)
  end

  test 'P12: a tag places a sign-in that has no host label, and null falls back to the old placement' do
    scanner, = scan([adel_login(1, 'store_pc')])
    assert_equal 'adel', held(scanner)['store_pc']
    assert_equal ['admin:store_pc'], earned(scanner)
    scanner, = scan([adel_login(1, nil)])
    assert_empty earned(scanner), 'pc: null (a body the recorder could not read, or a query that beat it) places nothing'
    assert_empty held(scanner)
  end

  # ---- sign-out (P3) -----------------------------------------------------------------------------------------------------

  test 'P3: a tagged sign-out ends its PC only; null and a rejected tag end every PC' do
    both = [adel_login(1, 'bay_pc'), adel_login(2, 'store_pc')]
    scanner, = scan(both + [logout_row(3, 'store_pc')])
    assert_equal ['admin:bay_pc'], earned(scanner)
    scanner, = scan(both + [logout_row(3, 'bay_pc')])
    assert_equal ['admin:store_pc'], earned(scanner)
    scanner, = scan(both + [logout_row(3, nil)])
    assert_empty earned(scanner), 'null ends every PC'
    scanner, findings = scan(both + [logout_row(3, 'not_a_pc')])
    assert_empty earned(scanner), 'a tag that names no PC ends every PC'
    assert_equal [[3, 'ops_tag', 'tag:logout']], rules(findings)
    # the old limit: untagged, an unnamed sign-out ends every PC
    scanner, = scan(strip_tags(both + [logout_row(3, 'store_pc')]), signins: %w[adel@bay_pc#1 adel@store_pc#2])
    assert_empty earned(scanner)
  end

  # ---- lock (P6) ---------------------------------------------------------------------------------------------------------

  test 'P6: a tagged lock ends its PC even when the answer names none; null with no pcId ends every PC' do
    both = [adel_login(1, 'bay_pc'), adel_login(2, 'store_pc')]
    scanner, = scan(both + [lock_row(3, 'bay_pc', answer_pc: nil)])
    assert_equal ['admin:store_pc'], earned(scanner)
    scanner, = scan(both + [lock_row(3, nil, answer_pc: nil)])
    assert_empty earned(scanner)
    scanner, = scan(both + [lock_row(3, nil, answer_pc: 'bay_pc')])
    assert_equal ['admin:store_pc'], earned(scanner), 'a null tag still takes the answer pcId'
    scanner, = scan(both + [lock_row(3, 'bay_pc', answer_pc: 'bay_pc')])
    assert_equal ['admin:store_pc'], earned(scanner)
    # the old limit: untagged and with no pcId in the answer, the lock ends every PC
    scanner, = scan(strip_tags(both + [lock_row(3, 'bay_pc', answer_pc: nil)]), signins: %w[adel@bay_pc#1 adel@store_pc#2])
    assert_empty earned(scanner)
  end

  # ---- the rejected tag and the ops_tag finding (3.2, 3.3; T6b, T9, T10) -------------------------------------------------

  test 'T10: a 200 row whose tag names no sign-in PC of the scenario is an ops_tag finding that names no value' do
    scanner, findings = scan([adel_login(1, 'no_such_pc')])
    assert_equal [[1, 'ops_tag', 'tag:login']], tag_rules(findings)
    assert_empty earned(scanner)
    assert_empty held(scanner)
    text = scanner.report_lines(findings).join("\n")
    assert_includes text, 'ops_tag'
    refute_includes text, 'no_such_pc'
    # a refused (non-200) answer is not judged
    refused = adel_login(1, 'no_such_pc').merge('status' => 401)
    _, findings = scan([refused])
    assert_empty tag_rules(findings)
    # the rule is in the rule list the command line prints
    assert AccessLeakScanner::RULE_TEXT.key?('ops_tag')
  end

  test 'T6b (privilege half): a sign-in tagged at a PC that does not admit the account is a finding, earns nothing and takes back' do
    # deskadmin is local to desk_a and desk_b; bay_pc does not admit it
    honest, findings = scan([deskadmin_login(1, 'desk_a')])
    assert_empty findings
    assert_equal ['admin:desk_a'], earned(honest)
    scanner, findings = scan([deskadmin_login(1, 'desk_a'), deskadmin_login(2, 'bay_pc')])
    assert_equal [[2, 'ops_tag', 'tag:login']], tag_rules(findings)
    assert_empty earned(scanner), 'no admin:bay_pc earned, and the step held at the admitting PC is taken back'
    assert_nil held(scanner)['bay_pc']
    assert_nil held(scanner)['desk_a']
    # the old shape: untagged, the second sign-in is unplaced between desk_a and desk_b and takes both back (no ops_tag finding)
    scanner, findings = scan(strip_tags([deskadmin_login(1, 'desk_a'), deskadmin_login(2, 'bay_pc')]), signins: ['deskadmin@desk_a#1'])
    assert_empty tag_rules(findings)
    assert_empty earned(scanner)
  end

  test 'a rejected tag earns nothing even where only one PC admits the account' do
    # lab_pc is the only PC besides desk_a/b and the open PCs that admits labadmin; labadmin sign-in tagged at bay_pc
    body = { 'success' => true, 'npcId' => 'labadmin', 'username' => 'labadmin', 'displayName' => 'Lab administrator', 'via' => 'password', 'access' => 'admin' }
    row = at({ 'method' => 'POST', 'path' => "#{BASE}/login", 'status' => 200, 'pc' => pc('bay_pc'), 'body' => body }, 1)
    scanner, findings = scan([row])
    assert_equal [[1, 'ops_tag', 'tag:login']], tag_rules(findings)
    assert_empty earned(scanner)
    scanner, findings = scan([row.merge('pc' => pc('lab_pc'))])
    assert_empty findings
    assert_equal ['admin:lab_pc'], earned(scanner)
  end

  test 'T9: a lock answer that names another PC than the tag is a finding and ends what a null tag ends' do
    both = [adel_login(1, 'bay_pc'), adel_login(2, 'store_pc')]
    scanner, findings = scan(both + [lock_row(3, 'store_pc', answer_pc: 'bay_pc')])
    assert_equal [[3, 'ops_tag', 'tag:lock_session']], rules(findings)
    assert_equal ['admin:store_pc'], earned(scanner), 'the answer pcId ends bay_pc only, as for a null tag'
    _, findings = scan(both + [lock_row(3, 'bay_pc', answer_pc: 'bay_pc')])
    assert_empty findings
    _, findings = scan(both + [lock_row(3, nil, answer_pc: 'bay_pc')])
    assert_empty findings
  end

  test 'T9: a remote sign-in whose host label names another PC than the tag is a finding' do
    remote = real(59)
    remote['pc'] = pc('bay_pc')
    scanner, findings = scan([remote])
    assert_empty findings, 'BAY01 is the bay PC'
    assert_equal 'adel', held(scanner)['bay_pc']
    remote['pc'] = pc('store_pc')
    scanner, findings = scan([remote])
    assert_equal [[1, 'ops_tag', 'tag:login']], tag_rules(findings)
    assert_empty held(scanner).compact
    assert_empty earned(scanner)
  end

  test 'a second-step route row with an unknown PC tag is a finding too; a good tag is not' do
    row = at({ 'method' => 'POST', 'path' => "#{BASE}/mfa/verify", 'status' => 200, 'pc' => pc('no_such_pc'), 'body' => { 'success' => false } }, 1)
    _, findings = scan([row])
    assert_equal [[1, 'ops_tag', 'tag:mfa/verify']], tag_rules(findings)
    _, findings = scan([row.merge('pc' => pc('bay_pc'))])
    assert_empty findings.select { |f| f.rule == 'ops_tag' }
    _, findings = scan([row.merge('pc' => nil)])
    assert_empty findings.select { |f| f.rule == 'ops_tag' }
  end

  # ---- untagged captures are judged as before ----------------------------------------------------------------------------

  test 'the untagged real privilege capture gives the same findings under :auto and :absent, with its names' do
    signins = %w[uma@bay_pc#1 adel@bay_pc#1 adel@bay_pc#2 adel@bay_pc#5]
    files = %w[ops_privilege_browser_run_1.jsonl ops_privilege_browser_run_2.jsonl].map { |n| [n, File.readlines(File.join(FIXTURES, n)).map { |l| JSON.parse(l) }] }
    all = files.flat_map { |name, rows| rows.each_with_index.map { |r, i| [name, i + 1, r] } }
    results = %i[auto absent].map do |mode|
      scanner = AccessLeakScanner.new(scenario)
      found = scanner.scan(all, signins: signins, tags: mode)
      [rules(found), scanner.unused_entries]
    end
    assert_equal results.first, results.last
    assert_equal [[], []], results.first
  end
end
