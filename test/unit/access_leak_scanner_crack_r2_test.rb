require 'test_helper'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

# Ops S7 fixes for the leak scanner review R2 (docs/agents/ops_core_build/reviews/S7_scanner_R2.md), R2-L2 to R2-L4 and
# R2-L7: each capture is the reviewer's, judged against the real scenarios/test_ops_crack (dana guessable, salted, wait 10,
# three facts; farah reused, salted, wait 60; deskadmin and sparedesk common, unsalted; eli strong). Each is tested both
# ways: the honest capture is clean, the near miss is a finding.
class AccessLeakScannerCrackR2Test < ActiveSupport::TestCase
  SCENARIO = File.expand_path('../../scenarios/test_ops_crack/scenario.json.erb', __dir__)
  BASE = '/break_escape/games/1'.freeze
  TOKEN = 'ABCD-EFGH-JKLM-NPQR-STUV-2345'.freeze
  FACTS = %w[dana_pet dana_town dana_year].freeze

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

    def crack_token(*)
      TOKEN
    end
  end

  def full_game(held: nil)
    Game.new(held, FACTS, [], [])
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

  def post_crack(body, status: 200, path: "#{BASE}/crack")
    { 'method' => 'POST', 'path' => path, 'status' => status, 'body' => body }
  end

  def get_keyring(body, path: "#{BASE}/keyring")
    { 'method' => 'GET', 'path' => path, 'status' => 200, 'body' => body }
  end

  def cracked_answer(account = 'dana')
    post_crack({ 'success' => true, 'status' => 'cracked', 'accountId' => account, 'credentialIds' => ["#{account}.cracked"] })
  end

  def running(wait = 10)
    post_crack({ 'success' => true, 'status' => 'running', 'readyInSeconds' => wait })
  end

  DISPLAY = { 'dana' => 'Dana Reyes', 'farah' => 'Farah Nkemelu', 'eli' => 'Eli Brandt', 'deskadmin' => 'Front desk administrator',
              'sparedesk' => 'Spare desk login' }.freeze
  USERS = { 'dana' => 'dreyes', 'farah' => 'fnkemelu', 'eli' => 'ebrandt', 'deskadmin' => 'fdadmin', 'sparedesk' => 'spare' }.freeze
  LABELS = { 'dana_hash' => 'Stored record: Dana', 'farah_hash' => 'Stored record: Farah', 'deskadmin_hash' => 'Stored record: desk admin',
             'sparedesk_hash' => 'Stored record: spare desk', 'eli_hash' => 'Stored record: Eli' }.freeze

  def hash_row(id, npc, status: 'ready', salted: true, extra: {})
    { 'id' => id, 'kind' => 'hash', 'source' => 'registry',
      'account' => { 'npcId' => npc, 'username' => USERS[npc], 'displayName' => DISPLAY[npc] },
      'label' => LABELS[id], 'token' => TOKEN, 'salted' => salted, 'status' => status }.merge(extra)
  end

  def keyring(row)
    get_keyring({ 'rev' => 'a', 'entries' => [row], 'captures' => {} })
  end

  def unchanged(waits)
    get_keyring({ 'rev' => 'a', 'unchanged' => true, 'readyInSeconds' => waits })
  end

  def nomatch_runs
    post_crack({ 'success' => true, 'status' => 'nomatch', 'runs' => 1 })
  end

  def infeasible
    post_crack({ 'success' => true, 'status' => 'infeasible', 'runs' => 2 })
  end

  # ---- R2-L2: a cracked answer the server could not have given ----------------------------------------------

  test 'R2-L2: a cracked answer for a strong, unrun or unknown account is a finding by itself' do
    [cracked_answer('eli'), cracked_answer('dana'), cracked_answer('nobody')].each do |row|
      assert_includes rules([row], game: full_game), 'crack_unearned', row.inspect
    end
    assert_includes rules([cracked_answer('dana')]), 'crack_unearned'
  end

  test 'R2-L2: an earned cracked answer is clean' do
    assert_empty scan([running, cracked_answer('dana')], game: full_game)
    assert_empty scan([cracked_answer('deskadmin')], game: full_game)
    assert_empty scan([running, cracked_answer('dana')])
  end

  # ---- R2-L3: the other 200 answers ------------------------------------------------------------------------

  test 'R2-L3: running needs a held salted record of a crackable class and a wait no longer than the largest of those' do
    assert_empty scan([running(10)], game: full_game(held: %w[dana_hash]))
    assert_empty scan([running(60)], game: full_game(held: %w[farah_hash]))
    assert_includes rules([running(10)], game: full_game(held: %w[deskadmin_hash])), 'crack_answer'
    assert_includes rules([running(10)], game: full_game(held: %w[eli_hash])), 'crack_answer'
    assert_includes rules([running(60)], game: full_game(held: %w[dana_hash])), 'crack_answer'
  end

  test 'R2-L3: needMoreFacts needs a held guessable record and a count within its facts' do
    need = ->(n) { post_crack({ 'success' => true, 'status' => 'needMoreFacts', 'missingCount' => n }) }
    assert_empty scan([need.call(3)], game: full_game(held: %w[dana_hash]))
    assert_includes rules([need.call(2)], game: full_game(held: %w[deskadmin_hash farah_hash])), 'crack_answer'
    assert_includes rules([need.call(4)], game: full_game(held: %w[dana_hash])), 'crack_answer'
  end

  test 'R2-L3: runs need a held strong record, and infeasible an earlier runs answer' do
    assert_empty scan([nomatch_runs, infeasible], game: full_game(held: %w[eli_hash]))
    assert_includes rules([nomatch_runs], game: full_game(held: %w[dana_hash])), 'crack_answer'
    assert_includes rules([infeasible], game: full_game(held: %w[eli_hash])), 'crack_answer'
    assert_includes rules([infeasible], game: full_game(held: %w[dana_hash])), 'crack_answer'
    assert_includes rules([infeasible, nomatch_runs], game: full_game(held: %w[eli_hash])), 'crack_answer'
    assert_empty scan([post_crack({ 'success' => true, 'status' => 'nomatch' })], game: full_game(held: %w[dana_hash]))
  end

  # ---- R2-L4: a row's status and the wait map --------------------------------------------------------------

  test 'R2-L4: an infeasible row only for a strong record after an infeasible answer' do
    row = hash_row('eli_hash', 'eli', status: 'infeasible', salted: false)
    assert_empty scan([nomatch_runs, infeasible, keyring(row)], game: full_game)
    assert_includes rules([keyring(row)], game: full_game), 'crack_row'
    assert_includes rules([nomatch_runs, keyring(row)], game: full_game), 'crack_row'
    assert_includes rules([infeasible, keyring(hash_row('dana_hash', 'dana', status: 'infeasible'))], game: full_game), 'crack_row'
  end

  test 'R2-L4: a running row only for a salted crackable record, within its own wait, after a running answer' do
    ok = hash_row('dana_hash', 'dana', status: 'running', extra: { 'readyInSeconds' => 5 })
    assert_empty scan([running, keyring(ok)], game: full_game)
    assert_includes rules([keyring(ok)], game: full_game), 'crack_row'
    long = hash_row('dana_hash', 'dana', status: 'running', extra: { 'readyInSeconds' => 60 })
    assert_includes rules([running, keyring(long)], game: full_game), 'crack_row'
    desk = hash_row('deskadmin_hash', 'deskadmin', status: 'running', salted: false, extra: { 'readyInSeconds' => 5 })
    assert_includes rules([running, keyring(desk)], game: full_game), 'crack_row'
  end

  test 'R2-L4: the wait map only for a salted crackable record, within its wait, after a running answer' do
    assert_empty scan([running, unchanged({ 'dana_hash' => 3 })], game: full_game)
    assert_includes rules([unchanged({ 'dana_hash' => 3 })], game: full_game), 'crack_row'
    assert_includes rules([running, unchanged({ 'deskadmin_hash' => 3 })], game: full_game), 'crack_row'
    assert_includes rules([running, unchanged({ 'dana_hash' => 11 })], game: full_game), 'crack_row'
    assert_includes rules([running, unchanged({ 'eli_hash' => 3 })], game: full_game), 'crack_row'
  end
end
