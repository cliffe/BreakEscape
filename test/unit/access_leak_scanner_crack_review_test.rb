require 'test_helper'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

# Ops S7 fixes for the leak scanner review R1 (docs/agents/ops_core_build/reviews/S7_scanner_R1.md). Each test is the
# reviewer's capture, judged against the real scenarios/test_ops_crack: a capture the server could not have produced must
# be a finding. In that scenario dana (guessable, hard, three facts, salted) and farah (reused, medium, salted) share one
# password; deskadmin and sparedesk (common, unsalted) share another; eli is strong.
class AccessLeakScannerCrackReviewTest < ActiveSupport::TestCase
  SCENARIO = File.expand_path('../../scenarios/test_ops_crack/scenario.json.erb', __dir__)
  BASE = '/break_escape/games/1'.freeze
  DANA_PW = 'JuniperAshby2003'.freeze
  DESK_PW = 'Welcome-Desk-1'.freeze
  ELI_PW = 'Tq7-orchid-kelp-N2vX'.freeze
  TOKEN = 'ABCD-EFGH-JKLM-NPQR-STUV-2345'.freeze
  FACTS = %w[dana_pet dana_town dana_year].freeze

  # A game in which every hash proof holds (or the listed ones), the listed facts are earned and no password is held.
  Game = Struct.new(:held, :earned, :cracked_accounts, :held_other) do
    def credential_proof_holds?(id, _entry)
      held.nil? || held.include?(id)
    end

    def earned_fact_ids
      earned
    end

    def player_state
      { 'crackedAccounts' => cracked_accounts || [] }
    end

    def password_held_for?(npc_id)
      Array(held_other).include?(npc_id) || Array(cracked_accounts).include?(npc_id)
    end
  end

  def full_game(**over)
    Game.new(nil, FACTS, [], []).tap { |g| over.each { |k, v| g[k] = v } }
  end

  def scenario
    @scenario ||= JSON.parse(BreakEscape::ScenarioBinding.render(File.read(SCENARIO)))
  end

  def scan(rows, game: nil)
    lines = rows.each_with_index.map { |r, i| ['r.jsonl', i + 1, r] }
    AccessLeakScanner.new(scenario, game: game).scan(lines)
  end

  def rules(rows, **opts)
    scan(rows, **opts).map(&:rule).uniq.sort
  end

  def post_crack(body, status: 200, path: "#{BASE}/crack", method: 'POST')
    { 'method' => method, 'path' => path, 'status' => status, 'body' => body }
  end

  def keyring(entries, extra = {}, path: "#{BASE}/keyring", status: 200)
    { 'method' => 'GET', 'path' => path, 'status' => status,
      'body' => { 'rev' => 'abc', 'entries' => entries, 'captures' => {} }.merge(extra) }
  end

  def cracked_answer(account = 'dana', ids = nil)
    post_crack({ 'success' => true, 'status' => 'cracked', 'accountId' => account,
                 'credentialIds' => ids || ["#{account}.cracked"] })
  end

  def running
    post_crack({ 'success' => true, 'status' => 'running', 'readyInSeconds' => 10 })
  end

  def acct(npc, user)
    { 'npcId' => npc, 'username' => user, 'displayName' => npc.capitalize }
  end

  def entry(npc, user, password)
    { 'id' => "#{npc}.cracked", 'kind' => 'password', 'source' => 'cracked', 'account' => acct(npc, user),
      'label' => 'Cracked', 'password' => password }
  end

  def hash_row(id, npc, status: 'ready', salted: true, extra: {})
    { 'id' => id, 'kind' => 'hash', 'source' => 'registry', 'account' => acct(npc, npc), 'label' => 'Stored record',
      'token' => TOKEN, 'salted' => salted, 'status' => status }.merge(extra)
  end

  USERS = { 'dana' => 'dreyes', 'farah' => 'fnkemelu', 'eli' => 'ebrandt', 'deskadmin' => 'fdadmin', 'sparedesk' => 'spare' }.freeze
  PASSWORDS = { 'dana' => DANA_PW, 'farah' => DANA_PW, 'eli' => ELI_PW, 'deskadmin' => DESK_PW, 'sparedesk' => DESK_PW }.freeze

  def own_entry(npc)
    entry(npc, USERS[npc], PASSWORDS[npc])
  end

  # ---- R1-L1: a strong account is never cracked -----------------------------------------------------

  test 'R1-L1: a cracked answer naming eli (strong) earns nothing, with and without a game' do
    [nil, full_game].each do |game|
      found = rules([cracked_answer('eli'), keyring([own_entry('eli')])], game: game)
      assert_includes found, 'crack_unearned'
      assert_includes found, 'password'
    end
  end

  test 'R1-L1: a record with no resolvable class (class removed) earns nothing' do
    data = JSON.parse(scenario.to_json)
    data['credentials']['deskadmin_hash']['crack'].delete('password')
    data['credentials']['sparedesk_hash']['crack'].delete('password')
    lines = [cracked_answer('deskadmin', %w[deskadmin.cracked]), keyring([own_entry('deskadmin')])].each_with_index.map { |r, i| ['r.jsonl', i + 1, r] }
    assert_includes AccessLeakScanner.new(data, game: full_game).scan(lines).map(&:rule), 'crack_unearned'
  end

  # ---- R1-L2: a batch only from an unsalted hit, to unsalted held records -----------------------------

  test 'R1-L2: a batch of the salted pair (dana, farah) earns nothing, named either way round' do
    [%w[dana farah], %w[farah dana]].each do |first, second|
      rows = [running, cracked_answer(first, ["#{first}.cracked", "#{second}.cracked"]), keyring([own_entry('dana'), own_entry('farah')])]
      found = rules(rows, game: full_game(held_other: ['dana']))
      assert_includes found, 'crack_unearned', "#{first} first"
      assert_includes found, 'password', "#{first} first"
    end
  end

  test 'R1-L2: the unsalted pair batches, and a single salted crack after a running answer passes' do
    pair = [cracked_answer('deskadmin', %w[deskadmin.cracked sparedesk.cracked]), keyring([own_entry('deskadmin'), own_entry('sparedesk')])]
    assert_empty scan(pair, game: full_game)
    assert_empty scan(pair)
    assert_empty scan([running, cracked_answer('dana'), keyring([own_entry('dana')])], game: full_game)
  end

  test 'R1-L2: a batch from an unsalted record to a record that is salted earns nothing' do
    data = JSON.parse(scenario.to_json)
    data['credentials']['sparedesk_hash']['salted'] = true
    lines = [cracked_answer('deskadmin', %w[deskadmin.cracked sparedesk.cracked]), keyring([own_entry('sparedesk')])].each_with_index.map { |r, i| ['r.jsonl', i + 1, r] }
    assert_includes AccessLeakScanner.new(data, game: full_game).scan(lines).map(&:rule), 'crack_unearned'
  end

  # ---- R1-L3: the recipe the game can already show ---------------------------------------------------

  test 'R1-L3 (A9): a guessable crack with the facts not earned earns nothing' do
    rows = [running, cracked_answer('dana'), keyring([own_entry('dana')])]
    assert_includes rules(rows, game: full_game(earned: [])), 'crack_unearned'
    assert_includes rules(rows, game: full_game(earned: %w[dana_pet dana_town])), 'crack_unearned'
    assert_empty scan(rows, game: full_game)
  end

  test 'R1-L3 (A11): a salted crack with no running answer before it earns nothing; each running answer pays for one' do
    assert_includes rules([cracked_answer('dana'), keyring([own_entry('dana')])], game: full_game), 'crack_unearned'
    assert_includes rules([cracked_answer('dana'), keyring([own_entry('dana')])]), 'crack_unearned'
    # the running answer must be well formed and a 200
    bad = post_crack({ 'success' => true, 'status' => 'running', 'readyInSeconds' => 10, 'hit' => true })
    assert_includes rules([bad, cracked_answer('dana'), keyring([own_entry('dana')])]), 'crack_unearned'
    late = [cracked_answer('dana'), running, keyring([own_entry('dana')])]
    assert_includes rules(late), 'crack_unearned'
    # one running answer, two salted cracks of different accounts: the second has nothing to use
    two = [running, cracked_answer('dana'), cracked_answer('farah'), keyring([own_entry('dana'), own_entry('farah')])]
    assert_includes scan(two, game: full_game(held_other: [])).map(&:owner), 'crack:entry:farah.cracked'
    paid = [running, cracked_answer('dana'), running, cracked_answer('farah'), keyring([own_entry('dana'), own_entry('farah')])]
    assert_empty scan(paid, game: full_game)
  end

  test 'R1-L3 (A10): a reused crack needs an equal-password account the player already holds' do
    rows = [running, cracked_answer('farah'), keyring([own_entry('farah')])]
    assert_includes rules(rows, game: full_game), 'crack_unearned'
    assert_includes rules(rows), 'crack_unearned'
    # dana earned in this run, or held by another route in the game, makes farah's reuse real
    after_dana = [running, cracked_answer('dana'), running, cracked_answer('farah'), keyring([own_entry('dana'), own_entry('farah')])]
    assert_empty scan(after_dana, game: full_game)
    assert_empty scan(rows, game: full_game(held_other: ['dana']))
  end

  # ---- R1-L10: a row says cracked only for an account something granted ------------------------------

  test 'R1-L10: a hash row that says cracked for an account nothing granted is a finding' do
    row = keyring([hash_row('eli_hash', 'eli', status: 'cracked')])
    assert_includes rules([row]), 'crack_row'
    assert_includes rules([row], game: full_game), 'crack_row'
    during_wait = [running, keyring([hash_row('dana_hash', 'dana', status: 'cracked')])]
    assert_includes rules(during_wait, game: full_game), 'crack_row'
    # earned by a crack, or held by another route in the game, it passes
    assert_empty scan([running, cracked_answer('dana'), keyring([hash_row('dana_hash', 'dana', status: 'cracked'), own_entry('dana')])], game: full_game)
    assert_empty scan([keyring([hash_row('eli_hash', 'eli', status: 'cracked')])], game: full_game(held_other: ['eli']))
  end

  # R1-L4: routes and statuses are matched exactly for the two crack uses
  test 'R1-L4 a cracked answer only at a game crack route' do
    ok = [running, cracked_answer('dana'), keyring([own_entry('dana')])]
    assert_empty scan(ok, game: full_game)
    ['/evil/crack', "#{BASE}/x/crack", "#{BASE}/crack/x", '/break_escape/games/crack'].each do |path|
      rows = [running, post_crack(cracked_answer('dana')['body'], path: path), keyring([own_entry('dana')])]
      assert_includes rules(rows, game: full_game), 'crack_unearned', path
    end
    odd = ['200abc', '200', 200.0, nil].map do |st|
      [running, post_crack(cracked_answer('dana')['body'], status: st), keyring([own_entry('dana')])]
    end
    odd.each { |rows| assert_includes rules(rows, game: full_game), 'crack_unearned', rows[1]['status'].inspect }
  end

  test 'R1-L4 a keyring answer only at a game keyring route with status 200' do
    earned = [running, cracked_answer('dana')]
    ['/evil/keyring', "#{BASE}/x/keyring", "#{BASE}/keyring/x"].each do |path|
      found = rules(earned + [keyring([own_entry('dana')], path: path)], game: full_game)
      assert_includes found, 'crack_unearned', path
      assert_includes found, 'password', path
    end
    [500, '200abc', nil].each do |st|
      found = rules(earned + [keyring([own_entry('dana')], status: st)], game: full_game)
      assert_includes found, 'crack_unearned', st.inspect
      assert_includes found, 'password', st.inspect
    end
    assert_includes rules([keyring([hash_row('dana_hash', 'dana')], path: '/evil/keyring')]), 'crack_row'
  end

  # ---- R1-L5: every hash body on the crack route is judged ---------------------------------------------

  test 'R1-L5: a non-200 crack answer with other keys is a finding; the app error shapes and a non-JSON body are not' do
    [[500, { 'hit' => true, 'match' => 'dana' }], [422, { 'error' => 'x', 'hit' => true }], [500, { 'success' => false }],
     [403, { 'error' => 'Not authorized', 'hit' => true }], [500, { 'error' => 'Not authorized' }], [403, { 'error' => 'other' }],
     [404, {}], [500, []]].each do |http, body|
      assert_includes rules([post_crack(body, status: http)]), 'crack_answer', [http, body].inspect
    end
    assert_empty scan([post_crack({ 'error' => 'Not authorized' }, status: 403),
                       post_crack({ 'error' => 'invalid_authenticity_token' }, status: 422),
                       post_crack('<html>Server error</html>', status: 500)])
  end

  # ---- R1-L12: the ranges of the route -------------------------------------------------------------------

  test 'R1-L12: nomatch runs 2, a wait or missing count beyond the scenario are findings' do
    [{ 'status' => 'nomatch', 'runs' => 2 }, { 'status' => 'running', 'readyInSeconds' => 600 }, { 'status' => 'running', 'readyInSeconds' => 61 },
     { 'status' => 'needMoreFacts', 'missingCount' => 4 }].each do |body|
      assert_includes rules([post_crack({ 'success' => true }.merge(body))]), 'crack_answer', body.inspect
    end
    assert_includes rules([keyring([hash_row('dana_hash', 'dana', status: 'running', extra: { 'readyInSeconds' => 100 })])]), 'crack_row'
    assert_empty scan([post_crack({ 'success' => true, 'status' => 'nomatch', 'runs' => 1 }),
                       post_crack({ 'success' => true, 'status' => 'running', 'readyInSeconds' => 60 }),
                       post_crack({ 'success' => true, 'status' => 'needMoreFacts', 'missingCount' => 3 })])
  end

  test 'R1-L12: a scenario with no salted record never answers running' do
    data = JSON.parse(scenario.to_json)
    data['credentials'].each_value { |e| e['salted'] = false if e['kind'] == 'hash' }
    lines = [post_crack({ 'success' => true, 'status' => 'running', 'readyInSeconds' => 10 })].each_with_index.map { |r, i| ['r.jsonl', i + 1, r] }
    assert_includes AccessLeakScanner.new(data).scan(lines).map(&:rule), 'crack_answer'
  end
end
