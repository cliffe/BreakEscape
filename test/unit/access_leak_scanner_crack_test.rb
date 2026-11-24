require 'test_helper'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

# Ops S7 unit 14: the leak scanner's rules for hash records and the cracker (rules crack_key, crack_row,
# crack_answer, crack_unearned), judged against the real scenarios/test_ops_crack. Every rule is tested both ways:
# the earned shape is clean, and each near miss is a finding.
#
# In that scenario dana and farah share one password (reused, salted records) and deskadmin and sparedesk share
# another (common, unsalted records); eli's is strong.
class AccessLeakScannerCrackTest < ActiveSupport::TestCase
  SCENARIO = File.expand_path('../../scenarios/test_ops_crack/scenario.json.erb', __dir__)
  BASE = '/break_escape/games/1'.freeze
  DANA_PW = 'JuniperAshby2003'.freeze
  DESK_PW = 'Welcome-Desk-1'.freeze
  TOKEN = 'ABCD-EFGH-JKLM-NPQR-STUV-2345'.freeze

  # A game that says which hash proofs hold and which facts are earned.
  GameStub = Struct.new(:held, :earned) do
    def credential_proof_holds?(id, _entry)
      held.nil? || held.include?(id)
    end

    def earned_fact_ids
      earned
    end

    def player_state
      {}
    end

    # R2-L5: the scanner needs every method of the checks the scenario can reach, or it stops
    def crack_token(_id, _entry, _npc)
      TOKEN
    end

    def password_held_for?(_npc_id)
      false
    end
  end

  def scenario
    @scenario ||= JSON.parse(BreakEscape::ScenarioBinding.render(File.read(SCENARIO)))
  end

  def scan(rows, game: nil)
    lines = rows.each_with_index.map { |r, i| ['r.jsonl', i + 1, r] }
    AccessLeakScanner.new(scenario, game: game).scan(lines)
  end

  def hits(rows, **opts)
    scan(rows, **opts).map { |f| [f.line, f.rule, f.owner] }
  end

  def rules(rows, **opts)
    scan(rows, **opts).map(&:rule).uniq.sort
  end

  def post_crack(body, status: 200)
    { 'method' => 'POST', 'path' => "#{BASE}/crack", 'status' => status, 'body' => body }
  end

  def keyring(entries, extra = {})
    { 'method' => 'GET', 'path' => "#{BASE}/keyring", 'status' => 200,
      'body' => { 'rev' => 'abc', 'entries' => entries, 'captures' => {} }.merge(extra) }
  end

  def cracked_answer(account = 'dana', ids = nil)
    post_crack({ 'success' => true, 'status' => 'cracked', 'accountId' => account,
                 'credentialIds' => ids || ["#{account}.cracked"] })
  end

  # A salted record is granted only by a post after a stored run, so a running answer comes first (R1-L3).
  def running_answer
    post_crack({ 'success' => true, 'status' => 'running', 'readyInSeconds' => 10 })
  end

  # The account block the server builds (account_block): the NPC's id, its creds.username and its displayName.
  DISPLAY = { 'dana' => 'Dana Reyes', 'farah' => 'Farah Nkemelu', 'eli' => 'Eli Brandt', 'deskadmin' => 'Front desk administrator',
              'sparedesk' => 'Spare desk login' }.freeze
  USERNAMES = { 'dana' => 'dreyes', 'farah' => 'fnkemelu', 'eli' => 'ebrandt', 'deskadmin' => 'fdadmin', 'sparedesk' => 'spare' }.freeze

  def acct(npc, user)
    { 'npcId' => npc, 'username' => user, 'displayName' => DISPLAY[npc] || npc.capitalize }
  end

  def entry(npc, user, password)
    { 'id' => "#{npc}.cracked", 'kind' => 'password', 'source' => 'cracked', 'account' => acct(npc, user),
      'label' => 'Cracked', 'password' => password }
  end

  LABELS = { 'dana_hash' => 'Stored record: Dana', 'farah_hash' => 'Stored record: Farah', 'deskadmin_hash' => 'Stored record: desk admin',
             'sparedesk_hash' => 'Stored record: spare desk', 'eli_hash' => 'Stored record: Eli' }.freeze

  def hash_row(id, npc, status: 'ready', salted: true, extra: {})
    { 'id' => id, 'kind' => 'hash', 'source' => 'registry', 'account' => acct(npc, USERNAMES[npc] || npc),
      'label' => LABELS[id] || 'Stored record',
      'token' => TOKEN, 'salted' => salted, 'status' => status }.merge(extra)
  end

  def dana_entry
    entry('dana', 'dreyes', DANA_PW)
  end

  # ---- a clean captured run ---------------------------------------------------------------------

  test 'a clean run passes: hash rows, running and cracked answers, then the cracked entry' do
    rows = [
      keyring([hash_row('dana_hash', 'dana'), hash_row('farah_hash', 'farah')], 'crackFacts' => %w[dana_pet]),
      post_crack({ 'success' => true, 'status' => 'needMoreFacts', 'missingCount' => 2 }),
      post_crack({ 'success' => true, 'status' => 'running', 'readyInSeconds' => 10 }),
      keyring([hash_row('dana_hash', 'dana', status: 'running', extra: { 'readyInSeconds' => 4 }), hash_row('farah_hash', 'farah')]),
      { 'method' => 'GET', 'path' => "#{BASE}/keyring", 'status' => 200, 'body' => { 'rev' => 'abc', 'unchanged' => true, 'readyInSeconds' => { 'dana_hash' => 3 } } },
      cracked_answer('dana'),
      keyring([hash_row('dana_hash', 'dana', status: 'cracked'), dana_entry])
    ]
    assert_empty hits(rows)
    assert_empty hits(rows, game: GameStub.new(nil, %w[dana_pet dana_town dana_year]))
  end

  test 'refusals, nomatch, infeasible and an already held answer have the route shapes and pass' do
    rows = [
      post_crack({ 'success' => false, 'reason' => 'bad_request' }, status: 400),
      post_crack({ 'success' => false, 'reason' => 'not_found' }, status: 404),
      post_crack({ 'success' => false, 'reason' => 'no_recipe' }, status: 422),
      post_crack({ 'success' => false, 'reason' => 'fact_not_held' }, status: 422),
      post_crack({ 'success' => true, 'status' => 'nomatch', 'runs' => 1 }),
      post_crack({ 'success' => true, 'status' => 'nomatch' }),
      post_crack({ 'success' => true, 'status' => 'infeasible', 'runs' => 2 }),
      post_crack({ 'success' => true, 'status' => 'cracked' })
    ]
    assert_empty hits(rows)
  end

  # ---- the earned password ------------------------------------------------------------------------

  test 'earned: a cracked entry carries its own password after a cracked answer that named the account' do
    assert_empty hits([running_answer, cracked_answer('dana'), keyring([dana_entry])])
  end

  test 'earned: an unsalted crack names every account with an equal password, and each entry may carry it' do
    rows = [cracked_answer('deskadmin', %w[deskadmin.cracked sparedesk.cracked]),
            keyring([entry('deskadmin', 'fdadmin', DESK_PW), entry('sparedesk', 'spare', DESK_PW)])]
    assert_empty hits(rows)
  end

  test 'earned: the password stays allowed on later keyring answers of the run' do
    assert_empty hits([running_answer, cracked_answer, keyring([dana_entry]), keyring([dana_entry])])
  end

  test 'near miss: the entry before the crack answer is a finding, and the password too' do
    found = hits([running_answer, keyring([dana_entry]), cracked_answer])
    assert_equal [[2, 'crack_unearned', 'crack:entry:dana.cracked'], [2, 'password', 'npc:dana'], [2, 'password', 'npc:farah']].sort, found.sort
  end

  test 'near miss: wrong account (the answer named dana, the entry is farah, whose password is equal)' do
    found = hits([cracked_answer('dana'), keyring([entry('farah', 'fnkemelu', DANA_PW)])])
    assert_includes found, [2, 'crack_unearned', 'crack:entry:farah.cracked']
    assert_includes found.map { |f| f[1] }, 'password'
  end

  test 'near miss: the batch rule needs an equal password: dana is not named by a deskadmin crack' do
    rows = [cracked_answer('deskadmin', %w[deskadmin.cracked dana.cracked]), keyring([dana_entry])]
    assert_equal %w[crack_unearned password], rules(rows)
  end

  test 'near miss: an account with no hash record or no password in the scenario earns nothing' do
    rows = [cracked_answer('ghost'), keyring([entry('ghost', 'g', 'x-secret-value')])]
    assert_includes rules(rows), 'crack_unearned'
    # a password-bearing NPC with no hash record: take eli's record away in a copy of the scenario
    data = JSON.parse(scenario.to_json)
    data['credentials'].delete('eli_hash')
    lines = [cracked_answer('eli'), keyring([entry('eli', 'ebrandt', 'Tq7-orchid-kelp-N2vX')])].each_with_index.map { |r, i| ['r.jsonl', i + 1, r] }
    assert_includes AccessLeakScanner.new(data).scan(lines).map(&:rule), 'crack_unearned'
  end

  test 'near miss: a refused, infeasible, nomatch, running or needMoreFacts answer earns nothing' do
    [
      [{ 'success' => false, 'reason' => 'no_recipe' }, 422],
      [{ 'success' => true, 'status' => 'infeasible', 'runs' => 2 }, 200],
      [{ 'success' => true, 'status' => 'nomatch', 'runs' => 1 }, 200],
      [{ 'success' => true, 'status' => 'running', 'readyInSeconds' => 30 }, 200],
      [{ 'success' => true, 'status' => 'needMoreFacts', 'missingCount' => 1 }, 200],
      [{ 'success' => true, 'status' => 'cracked' }, 200]
    ].each do |body, http|
      found = hits([running_answer, post_crack(body, status: http), keyring([dana_entry])])
      assert_includes found.map { |f| f[1] }, 'crack_unearned', body.inspect
      assert_includes found.map { |f| f[1] }, 'password', body.inspect
    end
  end

  test 'near miss: a running answer, then the entry before the wait ended, is a finding' do
    rows = [post_crack({ 'success' => true, 'status' => 'running', 'readyInSeconds' => 10 }), keyring([dana_entry]), cracked_answer, keyring([dana_entry])]
    assert_equal [[2, 'crack_unearned', 'crack:entry:dana.cracked'], [2, 'password', 'npc:dana'], [2, 'password', 'npc:farah']].sort,
                 hits(rows).sort
  end

  test 'near miss: forged-looking cracked answers earn nothing' do
    good = { 'success' => true, 'status' => 'cracked', 'accountId' => 'dana', 'credentialIds' => ['dana.cracked'] }
    forged = [
      good.merge('password' => DANA_PW),
      good.merge('hit' => true),
      good.except('success'),
      good.merge('success' => 'true'),
      good.merge('accountId' => 'farah'),
      good.merge('credentialIds' => []),
      good.merge('credentialIds' => 'dana.cracked'),
      good.merge('credentialIds' => ['dana.cracked', 'dana.cracked']),
      good.merge('credentialIds' => ['dana.password']),
      good.except('credentialIds')
    ]
    forged.each do |body|
      assert_includes rules([running_answer, post_crack(body), keyring([dana_entry])]), 'crack_unearned', body.inspect
    end
    # a good body at another status, on another route or on another method earns nothing either
    assert_includes rules([running_answer, post_crack(good, status: 500), keyring([dana_entry])]), 'crack_unearned'
    other = { 'method' => 'POST', 'path' => "#{BASE}/unlock", 'status' => 200, 'body' => good }
    assert_includes rules([running_answer, other, keyring([dana_entry])]), 'crack_unearned'
    other = { 'method' => 'GET', 'path' => "#{BASE}/crack", 'status' => 200, 'body' => good }
    assert_includes rules([running_answer, other, keyring([dana_entry])]), 'crack_unearned'
  end

  test 'near miss: a cracked answer for a record whose proof does not hold in the game earns nothing' do
    game = GameStub.new(%w[farah_hash], [])
    assert_includes rules([running_answer, cracked_answer('dana'), keyring([dana_entry])], game: game), 'crack_unearned'
    game = GameStub.new(%w[dana_hash], %w[dana_pet dana_town dana_year])
    assert_empty hits([running_answer, cracked_answer('dana'), keyring([hash_row('dana_hash', 'dana', status: 'cracked'), dana_entry])], game: game)
  end

  test 'near miss: the entry is not the server row (extra key, wrong id, kind, account, password, source elsewhere)' do
    bad = [
      dana_entry.merge('routes' => []),
      dana_entry.merge('id' => 'dana.password'),
      dana_entry.merge('kind' => 'hash'),
      dana_entry.merge('account' => acct('farah', 'fnkemelu')),
      dana_entry.merge('account' => acct('dana', 'dreyes').merge('password' => 'x')),
      dana_entry.merge('password' => DANA_PW + '!'),
      dana_entry.except('password')
    ]
    bad.each do |e|
      assert_includes rules([cracked_answer('dana'), keyring([e])]), 'crack_unearned', e.inspect
    end
  end

  test 'near miss: the password anywhere but the entry password stays a password finding' do
    moved = dana_entry.merge('label' => DANA_PW)
    assert_includes rules([cracked_answer, keyring([dana_entry.except('password').merge('label' => DANA_PW)])]), 'password'
    assert_includes rules([cracked_answer, keyring([dana_entry, { 'id' => 'x', 'note' => DANA_PW }])]), 'password'
    assert_includes rules([cracked_answer, keyring([moved])]), 'password'
    # the same value in another route's answer, or on a cracked entry served by another route
    other = { 'method' => 'GET', 'path' => "#{BASE}/container/dana_pc", 'status' => 200, 'body' => { 'entries' => [dana_entry], 'note' => DANA_PW } }
    assert_includes rules([cracked_answer, other]), 'password'
    assert_includes rules([cracked_answer, other]), 'crack_unearned'
    in_answer = post_crack({ 'success' => true, 'status' => 'cracked', 'accountId' => 'dana', 'credentialIds' => ['dana.cracked'], 'password' => DANA_PW })
    assert_equal %w[crack_answer password], rules([in_answer])
  end

  test 'near miss: a cracked entry in an answer that is not a keyring answer, or not under entries, is a finding' do
    loose = { 'method' => 'GET', 'path' => "#{BASE}/keyring", 'status' => 200, 'body' => { 'rev' => 'abc', 'entries' => [], 'extra' => dana_entry } }
    assert_includes rules([cracked_answer, loose]), 'crack_unearned'
    wrong_route = { 'method' => 'POST', 'path' => "#{BASE}/keyring", 'status' => 200, 'body' => { 'rev' => 'abc', 'entries' => [dana_entry] } }
    assert_includes rules([cracked_answer, wrong_route]), 'crack_unearned'
  end

  # ---- hash rows ---------------------------------------------------------------------------------

  test 'a hash row with password, routes or connectsTo is a finding for each' do
    %w[password routes connectsTo].each do |key|
      found = hits([keyring([hash_row('dana_hash', 'dana', extra: { key => key == 'routes' ? [] : 'x' })])])
      assert_includes found, [1, 'crack_row', "crack:row:#{key}"]
    end
  end

  test 'a hash row has the server row shape or it is a finding' do
    row = hash_row('dana_hash', 'dana')
    bad = [
      row.merge('source' => 'capture'), row.merge('status' => 'hit'), row.merge('token' => 'JuniperAshby2003'),
      row.merge('token' => TOKEN.downcase), row.merge('salted' => 'yes'), row.merge('extra' => 1),
      row.merge('id' => 'nobody_hash'), row.merge('account' => acct('dana', 'd').merge('password' => 'p')),
      row.merge('status' => 'running'), row.merge('status' => 'running', 'readyInSeconds' => -1),
      row.merge('status' => 'running', 'readyInSeconds' => 'soon'), row.merge('readyInSeconds' => 5),
      row.merge('status' => 'running', 'readyInSeconds' => 9999)
    ]
    bad.each { |r| assert_includes rules([keyring([r])]), 'crack_row', r.inspect }
    # R2-L4: a running row follows a running answer; an infeasible row is a strong record's, after its two runs
    strong = hash_row('eli_hash', 'eli', status: 'infeasible', salted: false)
    two_runs = [post_crack({ 'success' => true, 'status' => 'nomatch', 'runs' => 1 }), post_crack({ 'success' => true, 'status' => 'infeasible', 'runs' => 2 })]
    assert_empty hits([running_answer] + two_runs + [keyring([row.merge('status' => 'running', 'readyInSeconds' => 0), strong])])
  end

  test 'a hash row outside a GET /keyring entries list is a finding' do
    assert_includes rules([{ 'method' => 'GET', 'path' => "#{BASE}/scenario", 'status' => 200, 'body' => { 'x' => hash_row('dana_hash', 'dana') } }]), 'crack_row'
    assert_includes rules([post_crack(hash_row('dana_hash', 'dana'))]), 'crack_row'
  end

  test 'the unchanged answer wait map holds whole seconds for hash record ids only' do
    ok = { 'method' => 'GET', 'path' => "#{BASE}/keyring", 'status' => 200, 'body' => { 'rev' => 'a', 'unchanged' => true, 'readyInSeconds' => { 'dana_hash' => 0 } } }
    assert_empty hits([running_answer, ok])
    [{ 'dana' => 3 }, { 'dana_hash' => 'x' }, { 'dana_hash' => -2 }, 'soon', [3]].each do |waits|
      row = ok.merge('body' => ok['body'].merge('readyInSeconds' => waits))
      assert_includes rules([row]), 'crack_row', waits.inspect
    end
  end

  # ---- POST /crack answers -----------------------------------------------------------------------

  test 'a running answer carries only the wait: any hit, miss or account marker is a finding' do
    base = { 'success' => true, 'status' => 'running', 'readyInSeconds' => 10 }
    [{ 'accountId' => 'dana' }, { 'credentialIds' => ['dana.cracked'] }, { 'hit' => true }, { 'hit' => false },
     { 'missingCount' => 0 }, { 'runs' => 1 }, { 'reason' => 'ok' }, { 'cracked' => true }, { 'verdict' => 'nomatch' }].each do |extra|
      assert_includes rules([post_crack(base.merge(extra))]), 'crack_answer', extra.inspect
    end
    assert_includes rules([post_crack(base.except('readyInSeconds'))]), 'crack_answer'
    assert_includes rules([post_crack(base.merge('readyInSeconds' => 1.5))]), 'crack_answer'
    assert_empty hits([post_crack(base)])
  end

  test 'other POST /crack answers must match their status, refusal code and HTTP status' do
    [
      [{ 'success' => true, 'status' => 'nomatch', 'runs' => 3 }, 200],
      [{ 'success' => true, 'status' => 'infeasible' }, 200],
      [{ 'success' => true, 'status' => 'infeasible', 'runs' => 1 }, 200],
      [{ 'success' => true, 'status' => 'needMoreFacts' }, 200],
      [{ 'success' => true, 'status' => 'needMoreFacts', 'missingCount' => 9 }, 200],
      [{ 'success' => true, 'status' => 'maybe' }, 200],
      [{ 'success' => true }, 200],
      [{ 'success' => false, 'reason' => 'no_recipe' }, 200],
      [{ 'success' => false, 'reason' => 'no_recipe' }, 404],
      [{ 'success' => false, 'reason' => 'weak_password' }, 422],
      [{ 'success' => false, 'reason' => 'no_recipe', 'status' => 'nomatch' }, 422],
      [{ 'success' => true, 'status' => 'nomatch' }, 422]
    ].each do |body, http|
      assert_includes rules([post_crack(body, status: http)]), 'crack_answer', [body, http].inspect
    end
    assert_includes rules([post_crack('not json', status: 200)]), 'crack_answer'
  end

  # ---- keys that never reach the browser ---------------------------------------------------------

  test 'each recipe and state key is a finding wherever it appears' do
    %w[crack passwordPattern passwordDifficulty earnedFacts crackRuns crackStarted crackedAccounts].each do |key|
      body = { 'a' => [{ 'b' => { key => 1 } }] }
      found = hits([{ 'method' => 'GET', 'path' => "#{BASE}/scenario", 'status' => 200, 'body' => body }])
      assert_equal [[1, 'crack_key', "crack:key:#{key}"]], found, key
    end
  end

  test 'facts on a credential-shaped hash and difficulty off a lock are findings; a lock difficulty and a plain facts list are not' do
    get = ->(body) { { 'method' => 'GET', 'path' => "#{BASE}/scenario", 'status' => 200, 'body' => body } }
    assert_includes hits([get.call({ 'c' => { 'kind' => 'hash', 'facts' => ['dana_pet'] } })]), [1, 'crack_key', 'crack:key:facts']
    assert_includes hits([get.call({ 'c' => { 'account' => { 'npcId' => 'dana' }, 'facts' => [] } })]), [1, 'crack_key', 'crack:key:facts']
    assert_includes hits([get.call({ 'c' => { 'id' => 'x', 'difficulty' => 'hard' } })]), [1, 'crack_key', 'crack:key:difficulty']
    assert_includes hits([keyring([hash_row('dana_hash', 'dana', extra: { 'difficulty' => 'easy' })])]), [1, 'crack_key', 'crack:key:difficulty']
    assert_includes hits([keyring([hash_row('dana_hash', 'dana', extra: { 'difficulty' => 'easy', 'locked' => true })])]), [1, 'crack_key', 'crack:key:difficulty']
    assert_empty hits([get.call({ 'door' => { 'locked' => true, 'lockType' => 'key', 'difficulty' => 'medium' }, 'list' => { 'facts' => [1] } })])
  end

  test 'crackFacts is allowed only as the keyring list beside a hash row, of known bare ids' do
    row = [hash_row('dana_hash', 'dana')]
    assert_empty hits([keyring(row, 'crackFacts' => %w[dana_pet dana_town])])
    [%w[dana_pet dana_pet], %w[se_intel_dana_pet], %w[nobody_knows], [1], 'dana_pet'].each do |list|
      assert_includes hits([keyring(row, 'crackFacts' => list)]), [1, 'crack_key', 'crack:key:crackFacts'], list.inspect
    end
    assert_includes rules([keyring([], 'crackFacts' => %w[dana_pet])]), 'crack_key'
    assert_includes rules([{ 'method' => 'GET', 'path' => "#{BASE}/scenario", 'status' => 200, 'body' => { 'crackFacts' => [] } }]), 'crack_key'
    assert_includes rules([keyring(row, 'nested' => { 'crackFacts' => [] })]), 'crack_key'
    # given the game, an id it has not earned is a finding
    game = GameStub.new(nil, %w[dana_pet])
    assert_empty hits([keyring(row, 'crackFacts' => %w[dana_pet])], game: game)
    assert_includes rules([keyring(row, 'crackFacts' => %w[dana_town])], game: game), 'crack_key'
  end
end
