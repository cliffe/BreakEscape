require 'test_helper'
require_relative '../support/cached_accounts_fixture'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

# Ops S5bc fix: one test per capture of the S5bc scanner review R1 (docs/agents/ops_core_build/reviews/S5bc_scanner_R1.md),
# each built from the reviewer's scratch probes. Where the review shows an honest answer wrongly flagged, the clean case is
# here with the nearest case that must still be flagged (one per missing proof).
class AccessLeakScannerHarvestReviewTest < ActiveSupport::TestCase
  BASE = '/break_escape/games/1'.freeze

  # The game readers the scanner reads. `proof` is what credential_proof_holds? answers.
  class FakeGame
    attr_reader :player_state

    def initialize(cached_at: [], proof: true)
      @player_state = { 'cachedAt' => cached_at }
      @proof = proof
    end

    def credential_proof_holds?(*)
      @proof
    end

    def earned_fact_ids
      []
    end

    def crack_token(*)
      'ABCD-EFGH-JKLM-NPQR-STUV-WXYZ'
    end

    def password_held_for?(*)
      false
    end

    private

    def account_admin_at?(npc, pc)
      creds = npc['creds']
      creds.is_a?(Hash) && creds['admin'] == true && BreakEscape::CredentialModel.pc_admits_account?(pc, npc)
    end
  end

  def data
    CachedAccountsFixture.scenario
  end

  def row(body, path:, method: 'GET', status: 200, extra: {})
    { 'method' => method, 'path' => "#{BASE}/#{path}", 'status' => status, 'body' => body }.merge(extra)
  end

  def admin_signin(pc = 'profile_pc', npc = 'dana')
    row({ 'success' => true, 'npcId' => npc, 'username' => 'x', 'displayName' => 'x', 'via' => 'password' },
        path: 'login', method: 'POST', extra: { 'login' => { 'pcId' => pc } })
  end

  def crow(npc, hash_id, extra = {})
    scenario_npc = data['rooms']['finance']['npcs'].find { |n| n['id'] == npc }
    { 'npcId' => npc, 'displayName' => scenario_npc ? scenario_npc['displayName'] : npc, 'username' => scenario_npc&.dig('creds', 'username'),
      'portrait' => nil, 'avatar' => scenario_npc&.dig('avatar'), 'hashId' => hash_id }.merge(extra)
  end

  def collect(rows, held: nil, status: 200, pc: 'profile_pc', extra: {})
    row({ 'success' => true, 'pcId' => pc, 'harvested' => rows, 'held' => held || rows, 'keyringRev' => 'b86fb2' }.merge(extra),
        path: 'harvest_credentials', method: 'POST', status: status)
  end

  def refusal(body, status)
    row(body, path: 'harvest_credentials', method: 'POST', status: status)
  end

  def scan(rows, scenario: data, game: nil, **options)
    AccessLeakScanner.new(scenario, game: game).scan(rows.each_with_index.map { |r, i| ['r.jsonl', i + 1, r] }, **options)
  end

  def rules(findings)
    findings.map(&:rule).uniq.sort
  end

  def hits(findings)
    findings.map { |f| [f.rule, f.owner] }.uniq.sort
  end

  # ---- R1-L6, R1-L11, R1-L12: the collect answer is judged against a closed list ----

  test 'R1-L6: each refusal is exactly the server answer; rows under another key, an array, an extra key are flagged' do
    ok = [{ 'success' => false, 'reason' => 'bad_request' }, 400], [{ 'success' => false, 'reason' => 'not_reachable' }, 403],
         [{ 'success' => false, 'reason' => 'locked' }, 422], [{ 'success' => false, 'reason' => 'not_admin' }, 422],
         [{ 'error' => 'Container not found: x' }, 404]
    ok.each { |body, status| assert_empty scan([admin_signin, refusal(body, status)]), body.to_s }
    bad = [
      [{ 'success' => false, 'reason' => 'not_admin', 'accounts' => [crow('gary', 'hot_dana')] }, 422],
      [[crow('gary', 'hot_dana')], 200],
      [{ 'success' => false, 'reason' => 'not_admin', 'pc' => 'profile_pc', 'cached' => 3 }, 403],
      [{ 'success' => false, 'reason' => 'not_admin' }, 403],
      [{ 'success' => false, 'reason' => 'locked' }, 400],
      [{ 'error' => 3 }, 404],
      [{ 'error' => 'x', 'reason' => 'locked' }, 404],
      [{ 'success' => false, 'reason' => 'weird' }, 422],
      [{ 'success' => false, 'reason' => 'not_admin' }, 500]
    ]
    bad.each { |body, status| assert_includes rules(scan([admin_signin, refusal(body, status)])), 'harvest_row', "#{status} #{body}" }
  end

  test 'R1-L11: a 200 collect answer needs an admin session at the PC it names, even with no rows' do
    assert_equal [%w[harvest_unearned answer]], hits(scan([collect([])]))
    assert_empty scan([admin_signin, collect([])])
    # an admin session at another PC does not do, and neither does a PC that is no sign-in PC or no String
    assert_includes rules(scan([admin_signin('it_pc'), collect([])])), 'harvest_unearned'
    ['nope', nil, 3].each { |pc| assert_includes rules(scan([admin_signin, collect([], pc: pc)])), 'harvest_row', pc.inspect }
    # a missing pcId is not the server's shape
    no_pc = collect([])
    no_pc['body'].delete('pcId')
    assert_includes rules(scan([admin_signin, no_pc])), 'harvest_row'
  end

  test 'R1-L11: a row is credited at the PC the answer names, not at any PC that declares the account' do
    scenario = data
    scenario['rooms']['finance']['objects'].find { |o| o['id'] == 'it_pc' }['cachedAccounts'] = [{ 'npc' => 'jake' }]
    scenario['credentials']['it_jake'] = { 'kind' => 'hash', 'account' => 'jake', 'proof' => { 'harvested' => 'it_pc' }, 'crack' => { 'password' => 'reused' } }
    scenario['rooms']['finance']['npcs'].find { |n| n['id'] == 'dana' }['creds']['admin'] = true
    # admin at it_pc only, answer names profile_pc: flagged; naming it_pc with its own hash: clean
    assert_includes rules(scan([admin_signin('it_pc'), collect([crow('jake', 'hot_jake')], pc: 'profile_pc')], scenario: scenario)), 'harvest_unearned'
    assert_empty scan([admin_signin('it_pc'), collect([crow('jake', 'it_jake')], pc: 'it_pc')], scenario: scenario)
  end

  test 'R1-L12: held holds every harvested row, and an account appears once in a list' do
    jake = crow('jake', 'hot_jake')
    dana = crow('dana', 'hot_dana')
    assert_includes rules(scan([admin_signin, collect([jake], held: [])])), 'harvest_row'
    assert_includes rules(scan([admin_signin, collect([jake], held: [dana])])), 'harvest_row'
    assert_includes rules(scan([admin_signin, collect([], held: [jake, jake])])), 'harvest_row'
    assert_empty scan([admin_signin, collect([jake], held: [jake, dana])])
  end

  test 'R1-L12: a declared candidate that is no NPC, or has no username, is not a candidate' do
    scenario = data
    scenario['rooms']['finance']['objects'].find { |o| o['id'] == 'profile_pc' }['cachedAccounts'] << { 'npc' => 'ghost' }
    assert_includes rules(scan([admin_signin, collect([crow('ghost', nil, 'username' => 'g')])], scenario: scenario)), 'harvest_unearned'
    nameless = data
    nameless['rooms']['finance']['npcs'].find { |n| n['id'] == 'jake' }['creds'].delete('username')
    assert_includes rules(scan([admin_signin, collect([crow('jake', 'hot_jake', 'username' => 'x')])], scenario: nameless)), 'harvest_unearned'
  end

  # ---- R1-L8: a credited row's values are the scenario's ----

  test 'R1-L8: a credited row carrying another account\'s name or username, or any picture text, is flagged' do
    assert_empty scan([admin_signin, collect([crow('jake', 'hot_jake')])])
    swapped = [crow('jake', 'hot_jake', 'displayName' => 'Sam Ortiz'), crow('jake', 'hot_jake', 'username' => 'sortiz'),
               crow('jake', 'hot_jake', 'avatar' => 'localTo it_pc; harvestedAccounts'), crow('jake', 'hot_jake', 'portrait' => 'anything at all')]
    swapped.each { |bad| assert_includes rules(scan([admin_signin, collect([bad])])), 'harvest_row', bad.to_s }
  end

  test 'R1-L8: the portrait is the server\'s own talk portrait for the account' do
    scenario = data
    scenario['rooms']['finance']['npcs'].find { |n| n['id'] == 'jake' }['spriteSheet'] = 'male_office_worker'
    portrait = BreakEscape::Game.npc_talk_portrait(scenario['rooms']['finance']['npcs'].find { |n| n['id'] == 'jake' })
    assert portrait.is_a?(String)
    assert_empty scan([admin_signin, collect([crow('jake', 'hot_jake', 'portrait' => portrait)])], scenario: scenario)
    assert_includes rules(scan([admin_signin, collect([crow('jake', 'hot_jake', 'portrait' => 'x.png')])], scenario: scenario)), 'harvest_row'
    assert_includes rules(scan([admin_signin, collect([crow('jake', 'hot_jake')])], scenario: scenario)), 'harvest_row'
  end

  # ---- R1-L7: the borrow is proved by the capture's order, with the game's record as a floor ----

  def borrow_done(pc = 'profile_pc', extra = {})
    row({ 'pcId' => pc, 'guest' => true }.merge(extra), path: 'npc_workaround', method: 'POST')
  end

  test 'R1-L7: a borrow-gated row needs an earlier accepted borrow done answer for its PC' do
    game = FakeGame.new(cached_at: ['profile_pc|sam'])
    sam = collect([crow('sam', 'hot_sam')])
    assert_includes rules(scan([admin_signin, sam], game: game)), 'harvest_unearned'
    assert_empty scan([admin_signin, borrow_done, sam], game: game)
    assert_includes rules(scan([admin_signin, sam, borrow_done], game: game)), 'harvest_unearned'
    assert_includes rules(scan([admin_signin, borrow_done('it_pc'), sam], game: game)), 'harvest_unearned'
    # a writes_down answer, a dropped hand-over, a refused answer and a text body prove nothing
    [row({ 'pcId' => 'profile_pc', 'hasPostit' => true }, path: 'npc_workaround', method: 'POST'),
     row({ 'dropped' => true }, path: 'npc_workaround', method: 'POST'),
     row({ 'pcId' => 'profile_pc', 'guest' => true }, path: 'npc_workaround', method: 'POST', status: 422)].each do |not_a_done|
      assert_includes rules(scan([admin_signin, not_a_done, sam], game: game)), 'harvest_unearned', not_a_done['body'].to_s
    end
    # and the floor holds: the order proof alone is not enough
    assert_includes rules(scan([admin_signin, borrow_done, sam], game: FakeGame.new)), 'harvest_unearned'
  end

  # ---- relay admin (ruling B): R1-L1, R1-L4, R1-L5, R1-L14 ----

  def relay_scenario(account: 'dana', pc: 'profile_pc', admin: true, invite: true)
    scenario = data
    scenario['credentials']['invite'] = { 'kind' => 'assist_invite', 'account' => account, 'connectsTo' => pc } if invite
    scenario['rooms']['finance']['npcs'].find { |n| n['id'] == account }['creds']['admin'] = admin
    scenario
  end

  def relay_session(npc: 'dana', host: 'Hot desk', extra: {})
    { 'npcId' => npc, 'username' => 'x', 'displayName' => 'x', 'via' => 'credential', 'kind' => 'assist_invite',
      'relay' => true, 'host' => host, 'access' => 'admin' }.merge(extra)
  end

  def relay_login(**kw)
    row(relay_session(**kw).merge('success' => true), path: 'login', method: 'POST')
  end

  def relay_desktop(pc: 'profile_pc', **kw)
    row({ 'session' => relay_session(**kw) }, path: "container/#{pc}")
  end

  def access_hits(findings)
    findings.select { |f| f.owner == 'ops:key:access' }
  end

  test 'R1-L4: a relay admin is allowed only in the relay sign-in answer and that PC\'s own desktop answer' do
    game = FakeGame.new
    scenario = relay_scenario
    assert_empty access_hits(scan([relay_login], scenario: scenario, game: game))
    assert_empty access_hits(scan([relay_desktop], scenario: scenario, game: game))
    # the bootstrap sessions map, a network host row, any other route, another PC's desktop answer
    [row({ 'sessions' => { 'profile_pc' => relay_session } }, path: 'scenario'),
     row({ 'hosts' => [{ 'id' => 'profile_pc', 'kind' => 'pc', 'name' => 'Hot desk', 'session' => relay_session }] }, path: 'network'),
     row({ 'x' => relay_session }, path: 'room/finance'),
     relay_desktop(pc: 'it_pc'),
     row({ 'x' => relay_session }, path: 'container/profile_pc')].each do |shown|
      assert_equal 1, access_hits(scan([shown], scenario: scenario, game: game)).length, shown['path']
    end
    # a relay is never remote, foothold, onward or locked
    { 'remote' => true, 'footholdId' => 'fh1', 'fromPcId' => 'it_pc', 'locked' => true }.each do |key, value|
      assert_equal 1, access_hits(scan([relay_desktop(extra: { key => value })], scenario: scenario, game: game)).length, key
      assert_equal 1, access_hits(scan([relay_login(extra: { key => value })], scenario: scenario, game: game)).length, key
    end
    # a refused answer is no relay session
    assert_equal 1, access_hits(scan([relay_login.merge('status' => 403)], scenario: scenario, game: game)).length
  end

  test 'R1-L5: the invite\'s proof must hold in the game' do
    scenario = relay_scenario
    assert_empty access_hits(scan([relay_desktop], scenario: scenario, game: FakeGame.new(proof: true)))
    assert_equal 1, access_hits(scan([relay_desktop], scenario: scenario, game: FakeGame.new(proof: false))).length
    assert_equal 1, access_hits(scan([relay_desktop], scenario: scenario, game: FakeGame.new(proof: nil))).length
    bare = FakeGame.new
    bare.singleton_class.send(:undef_method, :credential_proof_holds?)
    assert_raises(ArgumentError) { AccessLeakScanner.new(scenario, game: bare) }
  end

  test 'R1-L14: a desktop answer names its PC, so a host label two PCs share does not flag it; a sign-in answer still does' do
    scenario = relay_scenario
    scenario['rooms']['finance']['objects'].find { |o| o['id'] == 'it_pc' }['name'] = 'Hot desk'
    game = FakeGame.new
    assert_empty access_hits(scan([relay_desktop], scenario: scenario, game: game))
    assert_equal 1, access_hits(scan([relay_login], scenario: scenario, game: game)).length
    # a desktop answer whose label is another PC's is not this PC's relay
    assert_equal 1, access_hits(scan([relay_desktop(host: 'IT PC')], scenario: scenario, game: game)).length
  end

  test 'R1-L1: an honest relay administrator collect is clean, from the sign-in answer or the desktop answer' do
    game = FakeGame.new
    scenario = relay_scenario
    collect_jake = collect([crow('jake', 'hot_jake')])
    assert_empty scan([relay_login, collect_jake], scenario: scenario, game: game)
    assert_empty scan([relay_desktop, collect_jake], scenario: scenario, game: game)
    assert_empty scan([relay_login, collect_jake, row({ 'rev' => 2, 'entries' => [] }, path: 'keyring')], scenario: scenario, game: game)
  end

  test 'R1-L1: the relay collect is flagged in each missing-proof case' do
    game = FakeGame.new
    collect_jake = collect([crow('jake', 'hot_jake')])
    unearned = ->(rows, scenario, g = game) { assert_includes rules(scan(rows, scenario: scenario, game: g)), 'harvest_unearned' }
    unearned.call([relay_login, collect_jake], relay_scenario(invite: false))
    unearned.call([relay_login, collect_jake], relay_scenario(admin: false))
    unearned.call([relay_login, collect_jake], relay_scenario, FakeGame.new(proof: false))
    unearned.call([relay_login, collect_jake], relay_scenario, nil)
    unearned.call([relay_login, collect_jake], relay_scenario(pc: 'it_pc'))
    # the relay is not at the PC the answer names
    unearned.call([relay_login, collect([crow('jake', 'hot_jake')], pc: 'it_pc')], relay_scenario)
    # a disconnect, a lock, a logout and a bootstrap each take the mark back
    scenario = relay_scenario
    ended = row({ 'success' => true, 'endedPcIds' => ['profile_pc'] }, path: 'network/technique', method: 'POST')
    lock = row({ 'success' => true, 'locked' => true, 'pcId' => 'profile_pc' }, path: 'lock_session', method: 'POST')
    logout = row({ 'success' => true }, path: 'logout', method: 'POST')
    boot = row({ 'sessions' => {} }, path: 'scenario')
    off = row({ 'session' => nil }, path: 'container/profile_pc')
    typed_user = row({ 'session' => { 'npcId' => 'jake', 'username' => 'x', 'displayName' => 'x', 'via' => 'password' } }, path: 'container/profile_pc')
    [ended, lock, logout, boot, off, typed_user].each do |between|
      unearned.call([relay_login, between, collect_jake], scenario)
    end
    # a later typed sign-in at that PC by another account ends it as well
    unearned.call([relay_login, admin_signin('profile_pc', 'jake'), collect_jake], scenario)
  end

  test 'R1-L1: a relay earns no admin step: a keyboard-shaped admin desktop after it is still flagged' do
    kb = row({ 'session' => { 'npcId' => 'dana', 'username' => 'x', 'displayName' => 'x', 'via' => 'password', 'access' => 'admin' } }, path: 'container/profile_pc')
    assert_equal 1, access_hits(scan([relay_login, kb], scenario: relay_scenario, game: FakeGame.new)).length
  end

  # ---- account-only accounts: R1-L2, R1-L9, R1-L10, R1-L13 ----

  def account_only(scenario = data, id = 'jake', user: nil, name: nil)
    npc = scenario['rooms']['finance']['npcs'].find { |n| n['id'] == id }
    npc['accountOnly'] = true
    npc['creds']['username'] = user if user
    npc['displayName'] = name if name
    scenario
  end

  def log_rows(*rows)
    row({ 'rev' => 'a', 'title' => 'Log', 'rows' => rows }, path: 'log_rows')
  end

  def log_row(event, as, result, detail)
    { 'id' => 'r1', 'elapsedMs' => 1, 'event' => event, 'as' => as, 'where' => 'Hot desk', 'result' => result, 'detail' => detail }
  end

  def typed_jake
    row({ 'success' => true, 'npcId' => 'jake', 'username' => 'jbrooks', 'displayName' => 'Jake Brooks', 'via' => 'password' }, path: 'login', method: 'POST')
  end

  test 'R1-L2: the server\'s own typed sign-in answer, the desktop after it and the log rows it writes are clean' do
    s = account_only
    assert_empty scan([typed_jake], scenario: s)
    assert_empty scan([typed_jake, row({ 'session' => { 'npcId' => 'jake', 'username' => 'jbrooks', 'displayName' => 'Jake Brooks', 'via' => 'password' } }, path: 'container/it_pc')], scenario: s)
    # unit 23: a CRED_COLLECT row needs an admin session shown at its PC, so the administrator signs in first
    assert_empty scan([admin_signin, typed_jake, log_rows(log_row('SIGN_IN', 'jbrooks', 'OK', 'method: password'), log_row('CRED_COLLECT', 'jbrooks', 'OK', 'count: 2'))], scenario: s)
  end

  test 'R1-L2: the typed sign-in earns only its own account, and only when it succeeded as a password sign-in' do
    s = account_only
    other = row({ 'success' => true, 'npcId' => 'dana', 'username' => 'x', 'displayName' => 'x', 'via' => 'password' }, path: 'login', method: 'POST')
    assert_includes rules(scan([other, row({ 'x' => 'jbrooks' }, path: 'room/finance')], scenario: s)), 'account_only'
    relay = typed_jake.tap { |r| r['body']['relay'] = true }
    assert_includes rules(scan([relay, row({ 'x' => 'jbrooks' }, path: 'room/finance')], scenario: s)), 'account_only'
    refused = typed_jake.merge('status' => 401)
    assert_includes rules(scan([refused, row({ 'x' => 'jbrooks' }, path: 'room/finance')], scenario: s)), 'account_only'
    # the typed answer is also the first place the username shows: before it, a username anywhere is flagged
    assert_includes rules(scan([row({ 'x' => 'jbrooks' }, path: 'room/finance'), typed_jake], scenario: s)), 'account_only'
  end

  test 'R1-L2: a registry keyring row carrying the account block of an account-only account earns both words' do
    s = account_only
    scenario_scanner = AccessLeakScanner.new(s)
    block = scenario_scanner.send(:crack_account_block, s['rooms']['finance']['npcs'].find { |n| n['id'] == 'jake' })
    entry = { 'id' => 'other', 'kind' => 'hash', 'source' => 'registry', 'account' => block }
    shown = row({ 'rev' => 2, 'entries' => [entry] }, path: 'keyring')
    assert_empty scan([shown, row({ 'x' => 'jbrooks Jake Brooks' }, path: 'room/finance')], scenario: s).select { |f| f.rule == 'account_only' }
    odd = row({ 'rev' => 2, 'entries' => [entry.merge('account' => block.merge('username' => 'zz'))] }, path: 'keyring')
    assert_includes rules(scan([odd, row({ 'x' => 'jbrooks' }, path: 'room/finance')], scenario: s)), 'account_only'
  end

  test 'R1-L9: an account-only word that is an ordinary word or another account\'s is refused at construction' do
    assert_raises(ArgumentError) { AccessLeakScanner.new(account_only(user: 'admin')) }
    assert_raises(ArgumentError) { AccessLeakScanner.new(account_only(user: 'Password')) }
    assert_raises(ArgumentError) { AccessLeakScanner.new(account_only(name: 'Local')) }
    dana = data['rooms']['finance']['npcs'].find { |n| n['id'] == 'dana' }
    assert_raises(ArgumentError) { AccessLeakScanner.new(account_only(user: dana['creds']['username'].upcase)) }
    assert_raises(ArgumentError) { AccessLeakScanner.new(account_only(name: dana['displayName'])) }
    assert_nothing_raised { AccessLeakScanner.new(account_only) }
    assert_nothing_raised { AccessLeakScanner.new(data) }
  end

  test 'R1-L10: the username is matched in any case, the display name exactly' do
    s = account_only(user: 'JBrooks')
    assert_includes rules(scan([log_rows(log_row('CRED_COLLECT', 'jbrooks', 'OK', '-'))], scenario: s)), 'account_only'
    assert_includes rules(scan([row({ 'x' => 'JBROOKS' }, path: 'room/finance')], scenario: s)), 'account_only'
    assert_empty scan([row({ 'x' => 'jake brooks' }, path: 'room/finance')], scenario: s)
  end

  test 'R1-L13: an account-only tile under any key, and a JSON key naming the account, are flagged' do
    s = account_only
    assert_includes hits(scan([row({ 'accounts' => [{ 'npc' => 'jake' }] }, path: 'login_accounts')], scenario: s)), %w[account_only npc:jake/tile]
    assert_includes hits(scan([row({ 'objects' => [{ 'id' => 'profile_pc', 'loginAccounts' => [{ 'who' => 'jake', 'x' => 1 }] }] }, path: 'room/finance')], scenario: s)), %w[account_only npc:jake/tile]
    assert_includes rules(scan([row({ 'jbrooks' => 1 }, path: 'room/finance')], scenario: s)), 'account_only'
    assert_includes rules(scan([row({ 'Jake Brooks' => 1 }, path: 'room/finance')], scenario: s)), 'account_only'
    assert_empty scan([row({ 'accounts' => [{ 'npc' => 'dana' }] }, path: 'login_accounts')], scenario: s)
  end

  # ---- R1-L17: an untagged sign-in, as the recorder writes it ----

  test 'R1-L17: an untagged admin sign-in of an account two PCs admit earns the step only with a --signin entry' do
    scenario = data
    scenario['rooms']['finance']['objects'].find { |o| o['id'] == 'it_pc' }['access'] = { 'roles' => %w[it staff] }
    scenario['rooms']['finance']['npcs'].find { |n| n['id'] == 'dana' }['creds']['admin'] = true
    untagged = row({ 'success' => true, 'npcId' => 'dana', 'username' => 'x', 'displayName' => 'x', 'via' => 'password' }, path: 'login', method: 'POST')
    rows = [untagged, collect([crow('jake', 'hot_jake')])]
    assert_includes rules(scan(rows, scenario: scenario)), 'harvest_unearned'
    assert_empty scan(rows, scenario: scenario, signins: ['dana@profile_pc#1'])
  end

  # ---- R1-L3: an admin's reach to the profile of an account cached at the PC ----

  def profile_read(pc, items)
    session = { 'npcId' => 'dana', 'username' => 'x', 'displayName' => 'x', 'via' => 'password', 'access' => 'admin' }
    row({ 'session' => session, 'contents' => items }, path: "container/#{pc}")
  end

  JAKE_ITEM = { 'id' => 'jake_budget', 'type' => 'text_file', 'name' => 'Q3 budget.xlsx', 'takeable' => true }.freeze
  SAM_ITEM = { 'id' => 'sam_note', 'type' => 'text_file', 'name' => 'Sam note', 'takeable' => true }.freeze

  test 'R1-L3: an admin session at a PC may read the profile of an account cached there, a borrow candidate only after its borrow' do
    game = FakeGame.new(cached_at: ['profile_pc|sam'])
    done = borrow_done
    assert_empty scan([admin_signin, profile_read('profile_pc', [JAKE_ITEM])], game: game)
    sam_read = profile_read('profile_pc', [SAM_ITEM])
    assert_equal [%w[profile_admin_read item:sam_note]], hits(scan([admin_signin, sam_read], game: game))
    assert_equal [%w[profile_admin_read item:sam_note]], hits(scan([admin_signin, sam_read], game: nil))
    assert_empty scan([admin_signin, done, sam_read], game: game)
    assert_equal [%w[profile_admin_read item:sam_note]], hits(scan([admin_signin, sam_read, done], game: game))
  end

  test 'R1-L3: the profile of an account neither owning nor cached at the PC is still flagged, and so is a read with no admin session' do
    game = FakeGame.new
    # jake is cached at profile_pc only: the admin session at it_pc (which jake owns) reaches him as owner, but not a hot-desk-only account
    # (no sign-in: the desktop answer's own `access: admin` is a finding too, so only the profile rule is compared)
    only_profile = ->(found) { hits(found.select { |f| f.rule == 'profile_admin_read' }) }
    assert_equal [%w[profile_admin_read item:jake_budget]], only_profile.call(scan([profile_read('profile_pc', [JAKE_ITEM])], game: game))
    scenario = data
    scenario['rooms']['finance']['objects'].find { |o| o['id'] == 'profile_pc' }['cachedAccounts'] = [{ 'npc' => 'dana' }]
    assert_equal [%w[profile_admin_read item:jake_budget]], hits(scan([admin_signin, profile_read('profile_pc', [JAKE_ITEM])], scenario: scenario, game: game))
  end

  test 'R1-L3: a proved relay administrator reaches the same profiles, and no further' do
    game = FakeGame.new
    scenario = relay_scenario
    relay = relay_session
    read = ->(items) { row({ 'session' => relay, 'contents' => items }, path: 'container/profile_pc') }
    assert_empty scan([relay_login, read.call([JAKE_ITEM])], scenario: scenario, game: game)
    assert_equal [%w[profile_admin_read item:sam_note]], hits(scan([relay_login, read.call([SAM_ITEM])], scenario: scenario, game: game))
    without = relay_scenario(invite: false)
    assert_includes rules(scan([relay_login, read.call([JAKE_ITEM])], scenario: without, game: game)), 'profile_admin_read'
  end
end
