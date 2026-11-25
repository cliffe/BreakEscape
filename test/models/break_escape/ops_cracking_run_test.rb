require 'test_helper'

module BreakEscape
  # Hash records, S7 unit 11: the refusal checks, the run, the grant and the cracked keyring row
  # (S7_BUILD_BRIEF.md, 4). Crafted scenarios under a frozen clock; the lock is the caller's, so
  # these call run_crack! directly.
  class OpsCrackingRunTest < ActiveSupport::TestCase
    include ActiveSupport::Testing::TimeHelpers

    PASSWORD = 'Ledger-Lena-9'.freeze

    setup do
      @mission = Mission.create!(name: 'test_simple_success', display_name: 'Crack run', published: true, difficulty_level: 1)
      @game = Game.create!(mission: @mission, player: break_escape_demo_users(:test_user)).reload
      @game.scenario_data = scenario
      @game.player_state = Game::ACCESS_STATE_DEFAULTS.transform_values(&:dup).merge('inventory' => [])
      @game.player_state['inventory'] = %w[strong guess reuse common_ lena jake held].map { |n| file(n) }
      travel_to Time.zone.local(2026, 11, 24, 12, 0, 0)
    end

    teardown { travel_back }

    def file(name)
      { 'id' => "#{name}_file", 'type' => 'text_file', 'name' => "#{name} file", 'credential' => "#{name}_hash" }
    end

    def npc(id, password)
      { 'id' => id, 'displayName' => id.capitalize, 'creds' => { 'username' => "u_#{id}", 'password' => password } }
    end

    def record(name, account, crack = {}, extra = {})
      { 'kind' => 'hash', 'account' => account, 'proof' => { 'held' => "#{name}_file" } }.merge(extra).merge('crack' => crack)
    end

    def scenario
      {
        'social' => { 'intelFacts' => { 'pet' => { 'label' => 'Pet' }, 'town' => { 'label' => 'Town' }, 'year' => { 'label' => 'Year' } } },
        'rooms' => { 'office' => { 'npcs' => [
          npc('sam', 'Strong-Sam-1'), npc('gus', 'Gus-Rex-1980'), npc('rae', PASSWORD), npc('cal', 'Shared-Cal-3'),
          npc('lena', 'Twin-Pass-7'), npc('jake', 'Twin-Pass-7'), npc('twin', PASSWORD), npc('held', 'Twin-Pass-7')
        ], 'objects' => %w[strong guess reuse common_ lena jake held].map { |n| file(n).merge('takeable' => true) } } },
        'credentials' => {
          'strong_hash' => record('strong', 'sam', { 'password' => 'strong' }),
          'guess_hash' => record('guess', 'gus', { 'password' => 'guessable', 'facts' => %w[pet year] }),
          'reuse_hash' => record('reuse', 'rae', { 'password' => 'reused' }),
          'common__hash' => record('common_', 'cal', { 'password' => 'common' }),
          'lena_hash' => record('lena', 'lena', { 'password' => 'common' }),
          'jake_hash' => record('jake', 'jake', { 'password' => 'common' }),
          'held_hash' => record('held', 'held', { 'password' => 'common' })
        }
      }
    end

    def creds
      @game.scenario_data['credentials']
    end

    def crack(id, facts = [])
      @game.run_crack!(id, facts)
    end

    def crack_state
      @game.player_state.slice('earnedFacts', 'crackRuns', 'crackStarted', 'crackedAccounts').deep_dup
    end

    def earn(*ids)
      @game.player_state['earnedFacts'] = ids
    end

    def row(id)
      @game.keyring_for_client[:entries].find { |e| e['id'] == id }
    end

    def password_rows(npc_id)
      @game.keyring_for_client[:entries].select { |e| e['kind'] == 'password' && e.dig('account', 'npcId') == npc_id }
    end

    test 'strong: nomatch once, then infeasible, and the row reads infeasible' do
      assert_equal 'nomatch', crack('strong_hash')[:status]
      assert_equal 'ready', row('strong_hash')['status']
      assert_equal 'infeasible', crack('strong_hash')[:status]
      assert_equal 'infeasible', crack('strong_hash')[:status]
      assert_equal 'infeasible', row('strong_hash')['status']
      assert_equal 2, @game.player_state['crackRuns']['strong_hash']
    end

    test 'a salted strong record answers at once' do
      creds['strong_hash']['salted'] = true
      assert_equal 'nomatch', crack('strong_hash')[:status]
      assert_empty @game.player_state['crackStarted']
    end

    test 'common yields on the first run and the password row appears' do
      out = crack('common__hash')
      assert_equal 'cracked', out[:status]
      assert_equal 'cal', out[:accountId]
      assert_equal ['cal.cracked'], out[:credentialIds]
      assert_equal 'cracked', row('common__hash')['status']
      assert_equal 'Shared-Cal-3', row('cal.cracked')['password']
      assert_equal 'cracked', row('cal.cracked')['source']
    end

    test 'guessable: missing facts report a count and ignore the pick' do
      earn('pet')
      out = crack('guess_hash', %w[pet year])
      assert_equal({ status: 'needMoreFacts', missingCount: 1 }, out)
      assert_empty @game.player_state['crackedAccounts']
      earn
      assert_equal 2, crack('guess_hash', %w[year])[:missingCount]
    end

    test 'guessable: the exact set yields, any other set misses' do
      earn('pet', 'year', 'town')
      assert_equal 'nomatch', crack('guess_hash', %w[pet])[:status]
      assert_equal 'nomatch', crack('guess_hash', %w[pet year town])[:status]
      assert_equal 'cracked', crack('guess_hash', %w[year pet])[:status]
    end

    test 'reused yields only when another account is held with an equal password' do
      assert_equal 'nomatch', crack('reuse_hash')[:status]
      @game.player_state['crackedAccounts'] = ['twin']
      assert_equal 'cracked', crack('reuse_hash', [])[:status]
    end

    test 'a row held from any source reads cracked, and a run answers cracked with no change' do
      @game.player_state['crackedAccounts'] = ['sam']
      assert_equal 'cracked', row('strong_hash')['status']
      assert_equal 'cracked', crack('strong_hash')[:status]
      assert_empty @game.player_state['crackRuns']
    end

    test 'refusals: not_found, no_recipe and fact_not_held, writing nothing' do
      earn('pet')
      before = crack_state
      assert_equal :not_found, @game.crack_refusal('nope', [])
      assert_equal :not_found, @game.crack_refusal(nil, [])
      creds['plain'] = { 'kind' => 'saved_connection', 'account' => 'sam', 'proof' => { 'held' => 'strong_file' } }
      assert_equal :not_found, @game.crack_refusal('plain', [])
      @game.player_state['inventory'].reject! { |i| i['id'] == 'reuse_file' }
      assert_equal :not_found, @game.crack_refusal('reuse_hash', [])
      creds['strong_hash']['crack'] = { 'difficulty' => 'extreme' }
      assert_equal :no_recipe, @game.crack_refusal('strong_hash', [])
      creds['strong_hash']['crack'] = {}
      assert_equal :no_recipe, @game.crack_refusal('strong_hash', [])
      assert_nil @game.crack_refusal('guess_hash', %w[pet])
      assert_equal :fact_not_held, @game.crack_refusal('guess_hash', %w[se_intel_pet])
      assert_equal :fact_not_held, @game.crack_refusal('guess_hash', %w[year])
      assert_equal before, crack_state
    end

    test 'a held account is never refused for recipe or facts' do
      @game.player_state['crackedAccounts'] = ['gus']
      assert_nil @game.crack_refusal('guess_hash', %w[unheld])
    end

    test 'unsalted batch grants every held equal record and no unheld one' do
      @game.player_state['inventory'].reject! { |i| i['id'] == 'jake_file' }
      out = crack('lena_hash')
      assert_equal 'lena', out[:accountId]
      assert_equal %w[held lena], out[:credentialIds].map { |c| c.delete_suffix('.cracked') }.sort
      assert_equal %w[held lena], @game.player_state['crackedAccounts'].sort
      assert_nil row('jake.cracked')
    end

    test 'medium salted: both picks answer running with the same wait, then the verdicts' do
      creds['guess_hash']['crack']['difficulty'] = 'medium'
      earn('pet', 'year')
      right = crack('guess_hash', %w[pet year])
      assert_equal({ status: 'running', readyInSeconds: 60 }, right)
      assert_equal 'running', row('guess_hash')['status']
      assert_equal 60, row('guess_hash')['readyInSeconds']
      travel 20.seconds
      assert_equal({ status: 'running', readyInSeconds: 40 }, crack('guess_hash', %w[town]))
      assert_empty @game.player_state['crackedAccounts']
      travel 41.seconds
      assert_equal 'cracked', crack('guess_hash', %w[town])[:status]
      assert_equal ['gus'], @game.player_state['crackedAccounts']
      assert_empty @game.player_state['crackStarted']
    end

    test 'a wrong salted pick runs the same wait, then nomatch, then a fresh wait' do
      creds['guess_hash']['crack']['difficulty'] = 'medium'
      earn('pet', 'year', 'town')
      wrong = crack('guess_hash', %w[pet])
      assert_equal({ status: 'running', readyInSeconds: 60 }, wrong)
      travel 61.seconds
      assert_equal 'nomatch', crack('guess_hash', %w[pet year])[:status]
      assert_empty @game.player_state['crackStarted']
      assert_equal({ status: 'running', readyInSeconds: 60 }, crack('guess_hash', %w[pet year]))
    end

    test 'the wait stays running at zero until a post' do
      creds['guess_hash']['crack']['difficulty'] = 'medium'
      earn('pet', 'year')
      crack('guess_hash', %w[pet year])
      travel 60.seconds
      assert_equal 'running', row('guess_hash')['status']
      assert_equal 0, row('guess_hash')['readyInSeconds']
      assert_equal 'cracked', crack('guess_hash', [])[:status]
    end

    test 'wait lengths: hard 120, crackSeconds 30, NPC hard 120, record easy over NPC hard is unsalted' do
      earn('pet', 'year')
      creds['guess_hash']['crack']['difficulty'] = 'hard'
      assert_equal 120, crack('guess_hash', %w[pet year])[:readyInSeconds]
      @game.player_state['crackStarted'] = {}
      creds['guess_hash']['crackSeconds'] = 30
      assert_equal 30, crack('guess_hash', %w[pet year])[:readyInSeconds]
      @game.player_state['crackStarted'] = {}
      creds['guess_hash']['crack'].delete('difficulty')
      creds['guess_hash'].delete('crackSeconds')
      @game.scenario_data['rooms']['office']['npcs'].find { |n| n['id'] == 'gus' }['habits'] = { 'passwordDifficulty' => 'hard' }
      assert_equal 120, crack('guess_hash', %w[pet year])[:readyInSeconds]
      @game.player_state['crackStarted'] = {}
      creds['guess_hash']['crack']['difficulty'] = 'easy'
      assert_equal 'cracked', crack('guess_hash', %w[pet year])[:status]
    end

    test 'a missing habit and an unknown grade are no_recipe and write nothing' do
      before = crack_state
      creds['guess_hash']['crack'] = {}
      assert_equal :no_recipe, @game.crack_refusal('guess_hash', [])
      creds['guess_hash']['crack'] = { 'password' => 'guessable', 'difficulty' => 'nope' }
      assert_equal :no_recipe, @game.crack_refusal('guess_hash', [])
      assert_equal before, crack_state
    end

    test 'a captured then cracked account shows one password row, with the value when the capture hides it' do
      @game.player_state['crackedAccounts'] = ['cal']
      capture = { 'id' => 'cal.password', 'kind' => 'password', 'source' => 'capture', 'account' => { 'npcId' => 'cal' } }
      @game.define_singleton_method(:implicit_keyring_entries) { [capture] }
      rows = password_rows('cal')
      assert_equal 1, rows.size
      assert_equal 'cracked', rows.first['source']
      assert_equal 'Shared-Cal-3', rows.first['password']
      with_value = capture.merge('password' => 'Shared-Cal-3')
      @game.define_singleton_method(:implicit_keyring_entries) { [with_value] }
      rows = password_rows('cal')
      assert_equal 1, rows.size
      assert_equal 'capture', rows.first['source']
    end

    test 'earning a fact changes rev; a running wait keeps rev stable while the waits fall' do
      creds['guess_hash']['crack']['difficulty'] = 'medium'
      earn('pet', 'year')
      crack('guess_hash', %w[pet year])
      first = @game.keyring_for_client
      travel 1.second
      second = @game.keyring_for_client
      assert_equal first[:rev], second[:rev]
      assert_equal({ 'guess_hash' => 60 }, @game.keyring_live_crack_waits(first[:entries]))
      assert_equal({ 'guess_hash' => 59 }, @game.keyring_live_crack_waits(second[:entries]))
      earn('pet', 'year', 'town')
      refute_equal first[:rev], @game.keyring_for_client[:rev]
    end
  end
end
