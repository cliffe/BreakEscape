require 'test_helper'
require_relative '../support/cached_accounts_fixture'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

# Ops S5bc unit 15: the leak scanner's cached-account, account-only and relay-admin rules. One capture per rule that must be
# flagged, and its nearest clean twin. The recorder keeps no request body, so the collect's PC is the `pcId` the server's 200
# answer names (R1-L11). The admin sign-in rows here carry a `login.pcId` tag for brevity: the recorder does NOT write that
# tag (R1-L17), so a real run earns the step by one PC admitting the account or by a `--signin` entry; see the review test.
class AccessLeakScannerHarvestTest < ActiveSupport::TestCase
  BASE = '/break_escape/games/1'.freeze

  # The game readers the scanner reads (the real Game has both).
  class FakeGame
    attr_reader :player_state

    def initialize(cached_at: [])
      @player_state = { 'cachedAt' => cached_at }
    end

    # the cracker's readers, answered neutrally (no proof withheld, nothing cracked, no fact earned)
    def credential_proof_holds?(*)
      true
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

  def collect_row(npc, hash_id, extra = {})
    { 'npcId' => npc, 'displayName' => npc.capitalize, 'username' => "u_#{npc}", 'portrait' => nil, 'avatar' => nil, 'hashId' => hash_id }.merge(extra)
  end

  def collect(rows, held: nil, status: 200, pc: 'profile_pc', extra: {})
    body = { 'success' => true, 'pcId' => pc, 'harvested' => rows, 'held' => held || rows, 'keyringRev' => 3 }.merge(extra)
    row(body, path: 'harvest_credentials', method: 'POST', status: status)
  end

  def scan(rows, scenario: data, game: nil)
    lines = rows.each_with_index.map { |r, i| ['r.jsonl', i + 1, r] }
    AccessLeakScanner.new(scenario, game: game).scan(lines)
  end

  def hits(findings)
    findings.map { |f| [f.rule, f.owner] }.uniq.sort
  end

  def rules(findings)
    findings.map(&:rule).uniq.sort
  end

  # A GET /keyring answer holding the server's own hash rows (each as the cracker's row check wants it).
  def keyring(*ids, scenario: data)
    scanner = AccessLeakScanner.new(scenario)
    records = scanner.instance_variable_get(:@crack_records)
    entries = ids.map do |id|
      record = records.find { |r| r[:id] == id }
      { 'id' => id, 'kind' => 'hash', 'source' => 'registry', 'label' => scanner.send(:crack_record_label, record[:entry]),
        'account' => scanner.send(:crack_account_block, record[:npc]), 'token' => 'ABCD-EFGH-JKLM-NPQR-STUV-WXYZ',
        'salted' => record[:resolved][:salted], 'status' => 'ready' }
    end
    row({ 'rev' => 2, 'entries' => entries }, path: 'keyring')
  end

  # ---- collect rows ----

  test 'a collect row for a start candidate after an admin sign-in at its PC is clean' do
    assert_empty scan([admin_signin, collect([collect_row('jake', 'hot_jake'), collect_row('dana', 'hot_dana')])])
  end

  test 'a collect row with no admin session earned is flagged, and so is one after the session ended' do
    assert_equal [%w[harvest_unearned account:jake]], hits(scan([collect([collect_row('jake', 'hot_jake')])]))
    ended = row({ 'success' => true, 'locked' => true, 'pcId' => 'profile_pc' }, path: 'lock_session', method: 'POST')
    assert_includes rules(scan([admin_signin, ended, collect([collect_row('jake', 'hot_jake')])])), 'harvest_unearned'
  end

  test 'an admin session at a PC that does not declare the account earns nothing for it' do
    scenario = data
    scenario['rooms']['finance']['objects'].find { |o| o['id'] == 'it_pc' }['access'] = { 'roles' => %w[it staff] }
    scenario['rooms']['finance']['npcs'].find { |n| n['id'] == 'dana' }['creds']['admin'] = true
    assert_empty scan([admin_signin, collect([collect_row('jake', 'hot_jake')])], scenario: scenario)
    assert_includes rules(scan([admin_signin('it_pc'), collect([collect_row('jake', 'hot_jake')])], scenario: scenario)), 'harvest_unearned'
  end

  test 'a borrow-gated account needs the game record of the borrow' do
    rows = [admin_signin, collect([collect_row('sam', 'hot_sam')])]
    assert_includes rules(scan(rows)), 'harvest_unearned'
    assert_includes rules(scan(rows, game: FakeGame.new)), 'harvest_unearned'
    assert_empty scan(rows, game: FakeGame.new(cached_at: ['profile_pc|sam']))
    assert_includes rules(scan(rows, game: FakeGame.new(cached_at: ['it_pc|sam']))), 'harvest_unearned'
  end

  test 'a wrong, swapped or invented hashId is flagged; a nil hashId only where the PC has no record' do
    [collect_row('jake', 'hot_dana'), collect_row('jake', 'nope'), collect_row('jake', nil)].each do |bad|
      assert_includes rules(scan([admin_signin, collect([bad])])), 'harvest_unearned', bad.to_s
    end
    scenario = data
    scenario['credentials'].delete('hot_jake')
    assert_empty scan([admin_signin, collect([collect_row('jake', nil)])], scenario: scenario)
  end

  test 'an account no PC declares is flagged even with an admin session' do
    assert_includes rules(scan([admin_signin, collect([collect_row('gary', nil)])])), 'harvest_unearned'
  end

  test 'a held row is judged like a harvested row' do
    assert_includes rules(scan([admin_signin, collect([], held: [collect_row('gary', nil)])])), 'harvest_unearned'
    assert_empty scan([admin_signin, collect([], held: [collect_row('jake', 'hot_jake')])])
  end

  test 'the collect answer must be exactly the server shape' do
    ok = collect_row('jake', 'hot_jake')
    assert_includes rules(scan([admin_signin, collect([ok], extra: { 'password' => 'x' })])), 'harvest_row'
    assert_includes rules(scan([admin_signin, collect([ok.merge('password' => 'x')])])), 'harvest_row'
    assert_includes rules(scan([admin_signin, collect([ok.reject { |k, _| k == 'avatar' }])])), 'harvest_row'
    assert_includes rules(scan([admin_signin, collect([ok], extra: { 'keyringRev' => 'x' })])), 'harvest_row'
    assert_includes rules(scan([admin_signin, collect([ok], status: 422, extra: { 'reason' => 'not_admin' })])), 'harvest_row'
    refusal = row({ 'success' => false, 'reason' => 'not_admin' }, path: 'harvest_credentials', method: 'POST', status: 422)
    assert_empty scan([admin_signin, refusal])
  end

  test 'a hashId key outside a collect answer is flagged' do
    assert_includes rules(scan([row({ 'rows' => [{ 'hashId' => 'hot_jake' }] }, path: 'keyring')])), 'harvest_key'
  end

  # ---- hash rows in the keyring ----

  test 'a harvested hash row in the keyring before the collect that named it is flagged' do
    assert_equal [%w[harvest_hash credential:hot_jake]], hits(scan([keyring('hot_jake')]))
    assert_includes rules(scan([admin_signin, keyring('hot_jake'), collect([collect_row('jake', 'hot_jake')])])), 'harvest_hash'
    assert_empty scan([admin_signin, collect([collect_row('jake', 'hot_jake')]), keyring('hot_jake')])
  end

  test 'a credited collect names only its own hash rows' do
    rows = [admin_signin, collect([collect_row('jake', 'hot_jake')]), keyring('hot_jake', 'hot_dana')]
    assert_equal [%w[harvest_hash credential:hot_dana]], hits(scan(rows))
  end

  # ---- the never list ----

  test 'the never-list keys are flagged anywhere' do
    %w[cachedAccounts cachedAt harvestedAccounts accountKind localTo accountOnly].each do |key|
      assert_includes rules(scan([row({ 'a' => [{ 'b' => { key => [] } }] }, path: 'room/finance')])), 'harvest_key', key
    end
    assert_includes rules(scan([row({ 'objects' => [{ 'creds' => { 'domain' => 'corp.example' } }] }, path: 'scenario')])), 'harvest_key'
    # the nearest clean twin: a domain on a PC object is shown
    assert_empty scan([row({ 'objects' => [{ 'id' => 'profile_pc', 'domain' => 'corp.example' }] }, path: 'room/finance')])
  end

  # ---- account-only ----

  def account_only_scenario
    scenario = data
    scenario['rooms']['finance']['npcs'].find { |n| n['id'] == 'jake' }['accountOnly'] = true
    scenario
  end

  test 'an account-only username or display name before its earning answer is flagged' do
    s = account_only_scenario
    assert_includes hits(scan([row({ 'note' => 'ask jbrooks' }, path: 'room/finance')], scenario: s)), %w[account_only npc:jake/username]
    assert_includes hits(scan([row({ 'note' => 'Jake Brooks was here' }, path: 'room/finance')], scenario: s)), %w[account_only npc:jake/name]
    assert_empty scan([row({ 'note' => 'Jake Brookshire and jbrookstone' }, path: 'room/finance')], scenario: s)
  end

  test 'an account-only room entry or tile is flagged' do
    s = account_only_scenario
    assert_includes hits(scan([row({ 'npcs' => [{ 'id' => 'jake', 'npcType' => 'person' }] }, path: 'room/finance')], scenario: s)), %w[account_only npc:jake/entry]
    assert_includes hits(scan([row({ 'objects' => [{ 'id' => 'profile_pc', 'loginAccounts' => [{ 'npcId' => 'jake' }] }] }, path: 'room/finance')], scenario: s)), %w[account_only npc:jake/tile]
  end

  test 'a credited collect row earns the name and the username; an uncredited one does not' do
    s = account_only_scenario
    row_jake = collect_row('jake', 'hot_jake', 'displayName' => 'Jake Brooks', 'username' => 'jbrooks')
    assert_empty scan([admin_signin, collect([row_jake]), row({ 'note' => 'jbrooks, Jake Brooks' }, path: 'room/finance')], scenario: s)
    found = scan([collect([row_jake])], scenario: s)
    assert_includes rules(found), 'harvest_unearned'
    assert_includes rules(found), 'account_only'
    assert_includes rules(scan([collect([row_jake]), row({ 'note' => 'jbrooks' }, path: 'room/finance')], scenario: s)), 'account_only'
  end

  test 'a collect row for an account-only account carries no picture' do
    s = account_only_scenario
    pic = collect_row('jake', 'hot_jake', 'displayName' => 'Jake Brooks', 'username' => 'jbrooks', 'avatar' => 'jake.png')
    assert_includes rules(scan([admin_signin, collect([pic])], scenario: s)), 'harvest_row'
  end

  test 'a typed sign-in earns the display name only' do
    s = account_only_scenario
    login = row({ 'success' => true, 'npcId' => 'jake', 'displayName' => 'Jake Brooks', 'via' => 'password' }, path: 'login', method: 'POST')
    assert_empty scan([login, row({ 'x' => 'Jake Brooks' }, path: 'room/finance')], scenario: s) - scan([login], scenario: s)
    after = scan([login, row({ 'x' => 'jbrooks' }, path: 'room/finance')], scenario: s)
    assert_includes hits(after), %w[account_only npc:jake/username]
    refute_includes hits(scan([login, row({ 'x' => 'Jake Brooks' }, path: 'room/finance')], scenario: s)), %w[account_only npc:jake/name]
    failed = row({ 'success' => false, 'npcId' => 'jake', 'via' => 'password' }, path: 'login', method: 'POST', status: 401)
    assert_includes hits(scan([failed, row({ 'x' => 'Jake Brooks' }, path: 'room/finance')], scenario: s)), %w[account_only npc:jake/name]
  end

  test 'a keyring hash row of an account-only account earns the name and the username' do
    s = account_only_scenario
    rows = [admin_signin, collect([collect_row('jake', 'hot_jake', 'displayName' => 'Jake Brooks', 'username' => 'jbrooks')]), keyring('hot_jake')]
    assert_empty scan(rows, scenario: s)
  end

  # ---- relay admin (ruling B) ----

  def relay_scenario(account: 'dana', pc: 'profile_pc', admin: true)
    scenario = data
    scenario['credentials']['invite'] = { 'kind' => 'assist_invite', 'account' => account, 'connectsTo' => pc }
    scenario['rooms']['finance']['npcs'].find { |n| n['id'] == account }['creds']['admin'] = admin
    scenario
  end

  def relay_row(npc: 'dana', host: 'Hot desk', extra: {})
    session = { 'npcId' => npc, 'username' => 'x', 'displayName' => 'x', 'via' => 'credential', 'kind' => 'assist_invite',
                'relay' => true, 'host' => host, 'access' => 'admin' }.merge(extra)
    row({ 'session' => session }, path: 'container/profile_pc')
  end

  def access_hits(findings)
    findings.select { |f| f.owner == 'ops:key:access' }
  end

  test 'a relay admin with an invite, an admin account, an admitting PC and a game is clean' do
    assert_empty scan([relay_row], scenario: relay_scenario, game: FakeGame.new)
  end

  test 'a relay admin is flagged in each missing-proof case' do
    game = FakeGame.new
    assert_equal 1, access_hits(scan([relay_row], scenario: data, game: game)).length, 'no assist invite'
    assert_equal 1, access_hits(scan([relay_row], scenario: relay_scenario(admin: false), game: game)).length, 'account not an administrator'
    assert_equal 1, access_hits(scan([relay_row], scenario: relay_scenario, game: nil)).length, 'no game to read'
    assert_equal 1, access_hits(scan([relay_row], scenario: relay_scenario(pc: 'it_pc'), game: game)).length, 'invite for another PC'
    assert_equal 1, access_hits(scan([relay_row(host: 'Nowhere')], scenario: relay_scenario, game: game)).length, 'PC not known'
    assert_equal 1, access_hits(scan([relay_row(extra: { 'kind' => 'saved_connection' })], scenario: relay_scenario, game: game)).length, 'not an invite'
    pc_refuses = relay_scenario(account: 'jake', pc: 'it_pc')
    assert_equal 1, access_hits(scan([relay_row(npc: 'jake', host: 'IT PC')], scenario: pc_refuses, game: game)).length, 'PC does not admit the account'
  end

  test 'a claim shown with admin is still flagged, and a relay user is clean' do
    game = FakeGame.new
    claim = relay_row(extra: { 'via' => 'claim', 'relay' => nil })
    assert_equal 1, access_hits(scan([claim], scenario: relay_scenario, game: game)).length
    assert_empty scan([relay_row(extra: { 'access' => nil }).tap { |r| r['body']['session'].delete('access') }], scenario: relay_scenario, game: game)
  end

  test 'a game without the readers is refused' do
    bare = Object.new
    assert_raises(ArgumentError) { AccessLeakScanner.new(relay_scenario, game: bare) }
    # a game with the cracker's readers but without the borrow record or the admin check
    partial = FakeGame.new
    partial.singleton_class.send(:undef_method, :player_state)
    assert_raises(ArgumentError) { AccessLeakScanner.new(data, game: partial) }
  end
end
