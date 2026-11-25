require 'test_helper'

module BreakEscape
  # Hash records, S7 unit 08: the token, the status and the keyring row (S7_BUILD_BRIEF.md, 4).
  # Crafted scenarios, as in CredentialKeyringTest; nothing is saved.
  class CrackingRowTest < ActiveSupport::TestCase
    PASSWORD = 'Ledger-Lena-9'.freeze

    setup do
      @mission = Mission.create!(name: 'test_simple_success', display_name: 'Cracking', published: true, difficulty_level: 1)
      @game = build_game
    end

    def build_game(extra_state = {})
      game = Game.create!(mission: @mission, player: break_escape_demo_users(:test_user)).reload
      game.scenario_data = scenario
      game.player_state = Game::ACCESS_STATE_DEFAULTS.transform_values(&:dup).merge('inventory' => []).merge(extra_state)
      game
    end

    def scenario
      {
        'rooms' => { 'office' => {
          'npcs' => [
            { 'id' => 'lena', 'displayName' => 'Lena Fox', 'creds' => { 'username' => 'lfox', 'password' => PASSWORD } },
            { 'id' => 'jake', 'displayName' => 'Jake Brooks', 'creds' => { 'username' => 'jbrooks', 'password' => PASSWORD } },
            { 'id' => 'omar', 'displayName' => 'Omar Reed', 'creds' => { 'username' => 'oreed', 'password' => 'Other-Omar-2' } }
          ],
          'objects' => [
            { 'id' => 'lena_file', 'type' => 'text_file', 'name' => 'Lena share file', 'takeable' => true, 'credential' => 'lena_hash' },
            { 'id' => 'jake_file', 'type' => 'text_file', 'name' => 'Jake share file', 'takeable' => true, 'credential' => 'jake_hash' }
          ]
        } },
        'credentials' => {
          'lena_hash' => { 'kind' => 'hash', 'account' => 'lena', 'proof' => { 'held' => 'lena_file' }, 'crack' => { 'password' => 'reused' } },
          'jake_hash' => { 'kind' => 'hash', 'account' => 'jake', 'proof' => { 'held' => 'jake_file' }, 'crack' => { 'password' => 'reused' } },
          'omar_hash' => { 'kind' => 'hash', 'account' => 'omar', 'proof' => { 'technique_card' => 'svc.finding.one' }, 'salted' => true }
        }
      }
    end

    def hold_share_file(game = @game)
      game.player_state['inventory'] = [
        { 'id' => 'lena_file', 'type' => 'text_file', 'name' => 'Lena share file', 'credential' => 'lena_hash' },
        { 'id' => 'jake_file', 'type' => 'text_file', 'name' => 'Jake share file', 'credential' => 'jake_hash' }
      ]
    end

    def rows(game = @game)
      game.keyring_for_client[:entries].select { |e| e['kind'] == 'hash' }
    end

    def row(id, game = @game)
      rows(game).find { |e| e['id'] == id }
    end

    test 'taking the share file lists a ready hash row with token and username and no password' do
      assert_empty rows
      hold_share_file
      r = row('lena_hash')
      assert r
      assert_equal 'ready', r['status']
      assert_equal 'lfox', r.dig('account', 'username')
      assert_equal false, r['salted']
      assert_match(/\A([A-Z2-9]{4}-){5}[A-Z2-9]{4}\z/, r['token'])
      %w[password routes connectsTo readyInSeconds].each { |k| refute r.key?(k), k }
    end

    test 'a technique grant lists the same row' do
      @game.player_state['opsUsed'] = ['svc.finding.one']
      r = row('omar_hash')
      assert r
      assert_equal 'ready', r['status']
      assert_equal true, r['salted']
    end

    test 'the token is stable across reloads and differs between games' do
      hold_share_file
      first = row('lena_hash')['token']
      assert_equal first, row('lena_hash')['token']
      other = build_game
      hold_share_file(other)
      refute_equal first, row('lena_hash', other)['token']
    end

    test 'equal unsalted passwords give equal tokens; a salted record matches nothing' do
      hold_share_file
      assert_equal row('lena_hash')['token'], row('jake_hash')['token']
      @game.scenario_data['credentials']['lena_hash']['salted'] = true
      @game.scenario_data['credentials']['jake_hash']['salted'] = true
      refute_equal row('lena_hash')['token'], row('jake_hash')['token']
    end

    test 'grade rows: hard lists salted, hard with salted false shares its token, easy lists unsalted' do
      hold_share_file
      creds = @game.scenario_data['credentials']
      creds['lena_hash']['crack'] = { 'password' => 'reused', 'difficulty' => 'hard' }
      creds['jake_hash']['crack'] = { 'password' => 'reused', 'difficulty' => 'hard' }
      assert_equal true, row('lena_hash')['salted']
      creds['lena_hash']['salted'] = false
      creds['jake_hash']['salted'] = false
      assert_equal false, row('lena_hash')['salted']
      assert_equal row('lena_hash')['token'], row('jake_hash')['token']
      creds['lena_hash']['crack'] = { 'password' => 'reused', 'difficulty' => 'easy' }
      creds['lena_hash'].delete('salted')
      assert_equal false, row('lena_hash')['salted']
    end

    test 'an unknown grade lists no row' do
      hold_share_file
      @game.scenario_data['credentials']['lena_hash']['crack'] = { 'difficulty' => 'extreme' }
      assert_nil row('lena_hash')
      @game.scenario_data['credentials']['lena_hash']['crack'] = { 'password' => 'reused' }
      @game.scenario_data['rooms']['office']['npcs'][0]['habits'] = { 'passwordDifficulty' => 'nonsense' }
      assert_nil row('lena_hash')
    end

    test 'no answer body holds difficulty, facts or the password' do
      hold_share_file
      @game.scenario_data['credentials']['lena_hash']['crack'] = { 'password' => 'guessable', 'facts' => ['pet'], 'difficulty' => 'hard' }
      @game.player_state['earnedFacts'] = ['pet']
      body = JSON.generate(@game.keyring_for_client)
      refute_includes body, 'difficulty'
      refute_includes body, PASSWORD
      refute_includes body, '"facts"'
      assert_equal ['pet'], @game.keyring_for_client[:crackFacts]
    end

    test 'status follows the stored state: running, infeasible and cracked' do
      hold_share_file
      @game.scenario_data['credentials']['lena_hash']['salted'] = true
      @game.scenario_data['credentials']['lena_hash']['crackSeconds'] = 30
      now = @game.send(:server_now)
      @game.player_state['crackStarted'] = { 'lena_hash' => { 'at' => now - 10, 'hit' => true } }
      r = row('lena_hash')
      assert_equal 'running', r['status']
      assert_operator r['readyInSeconds'], :<=, 20
      assert_operator r['readyInSeconds'], :>=, 19
      @game.player_state['crackStarted'] = { 'lena_hash' => { 'at' => now - 100, 'hit' => true } }
      assert_equal 0, row('lena_hash')['readyInSeconds']
      assert_equal({ 'lena_hash' => 0 }, @game.keyring_live_crack_waits(@game.keyring_for_client[:entries]))
      @game.player_state['crackStarted'] = {}
      @game.player_state['crackRuns'] = { 'lena_hash' => 2 }
      assert_equal 'infeasible', row('lena_hash')['status']
      @game.player_state['crackedAccounts'] = ['lena']
      assert_equal 'cracked', row('lena_hash')['status']
    end

    test 'a hash never signs in' do
      hold_share_file
      assert_nil @game.send(:provable_connecting_credential, 'lena_hash')
    end

    test 'rev is the old digest with no hash row, and readyInSeconds stays out of it' do
      before = @game.keyring_for_client
      assert_equal @game.keyring_rev(before[:entries], before[:captures]), before[:rev]
      refute before.key?(:crackFacts)
      hold_share_file
      @game.scenario_data['credentials']['lena_hash']['salted'] = true
      now = @game.send(:server_now)
      @game.player_state['crackStarted'] = { 'lena_hash' => { 'at' => now, 'hit' => false } }
      a = @game.keyring_for_client
      @game.player_state['crackStarted'] = { 'lena_hash' => { 'at' => now + 5, 'hit' => false } }
      assert_equal a[:rev], @game.keyring_for_client[:rev]
    end
  end
end
