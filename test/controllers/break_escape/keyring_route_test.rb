require 'test_helper'

module BreakEscape
  # Credential keyring K1 (CREDENTIAL_KEYRING_PLAN.md 6.2): GET /games/:id/keyring. A read with no
  # side effects: the registry never reaches the browser, a password value is served only where GET
  # /capture_secrets already serves it, and a `rev` that matches gets { rev, unchanged: true }.
  class KeyringRouteTest < ActionDispatch::IntegrationTest
    def game_path(id, suffix)
      "/break_escape/games/#{id}/#{suffix}"
    end

    setup do
      mission = Mission.create!(name: 'test_simple_success', display_name: 'Keyring', published: true, difficulty_level: 1)
      @game = Game.create!(mission: mission, player: break_escape_demo_users(:test_user)).reload
      state = @game.player_state.merge(
        'inventory' => [{ 'id' => 'lena_rdp_file', 'type' => 'text_file', 'name' => 'HB-FIN-02.rdp', 'credential' => 'lena_rdp' }],
        'signedInPcs' => %w[lena_pc]
      )
      # update_column bypasses the format/callbacks; the scenario carries the current format stamp.
      data = scenario.merge('formatVersion' => BreakEscape::FormatUpgrade.current)
      @game.update_columns(scenario_data: data, player_state: state)
    end

    def scenario
      {
        'scenario_brief' => 'keyring route test', 'startRoom' => 'office',
        'rooms' => {
          'office' => {
            'npcs' => [
              { 'id' => 'lena', 'displayName' => 'Lena Fox', 'creds' => { 'username' => 'lfox', 'password' => 'Ledger-Lena-9' } },
              { 'id' => 'jake', 'displayName' => 'Jake Brooks', 'creds' => { 'username' => 'jbrooks', 'password' => 'Vault-Jake-4' } }
            ],
            'objects' => [
              { 'id' => 'lena_pc', 'type' => 'pc', 'lockType' => 'login', 'name' => 'Lena PC', 'host' => 'HB-FIN-02',
                'access' => { 'people' => %w[lena jake] },
                'contents' => [
                  { 'id' => 'lena_passwords_txt', 'type' => 'text_file', 'name' => 'passwords.txt' },
                  { 'id' => 'lena_rdp_file', 'type' => 'text_file', 'name' => 'HB-FIN-02.rdp', 'takeable' => true, 'credential' => 'lena_rdp' }
                ] }
            ]
          }
        },
        'credentials' => {
          'lena_rdp' => { 'kind' => 'saved_connection', 'account' => 'lena', 'connectsTo' => 'lena_pc', 'proof' => { 'held' => 'lena_rdp_file' } },
          'jake_pw_note' => { 'kind' => 'password', 'account' => 'jake', 'proof' => { 'session' => 'lena_pc' }, 'foundIn' => 'lena_passwords_txt' }
        }
      }
    end

    def keyring(params = {})
      get game_path(@game.id, 'keyring'), params: params, as: :json
      response.parsed_body
    end

    test 'answers rev and the proven entries, no-store' do
      body = keyring
      assert_response :success
      assert_match(/\A[0-9a-f]{6}\z/, body['rev'])
      assert_equal 'no-store', response.headers['Cache-Control']
      ids = body['entries'].map { |e| e['id'] }
      assert_includes ids, 'lena_rdp', 'the held saved connection is listed'
      assert_includes ids, 'jake_pw_note', 'the session-proven found password is listed'
    end

    test 'no entry carries a non-password value' do
      keyring['entries'].each do |e|
        next if e['kind'] == 'password' && e['source'] == 'capture'

        refute e.key?('password'), "#{e['id']} must not carry a value"
      end
    end

    test 'a matching rev gets unchanged' do
      rev = keyring['rev']
      body = keyring(rev: rev)
      assert_response :success
      assert_equal true, body['unchanged']
      assert_equal rev, body['rev']
      refute body.key?('entries')
    end

    test 'a stale rev gets the full answer' do
      body = keyring(rev: 'zzzzzz')
      refute body['unchanged']
      assert body['entries'].is_a?(Array)
    end

    test 'pc_id adds forThisPc and accepted' do
      e = keyring(pc_id: 'lena_pc')['entries'].find { |x| x['id'] == 'lena_rdp' }
      assert_equal true, e['forThisPc']
      assert_equal true, e['accepted']
    end

    test 'a held-proof entry names its tray item (K3b Connect), a session-proven one names none' do
      entries = keyring['entries']
      assert_equal 'lena_rdp_file', entries.find { |x| x['id'] == 'lena_rdp' }['heldItem']
      refute entries.find { |x| x['id'] == 'jake_pw_note' }.key?('heldItem')
    end

    test 'the scenario answer carries credentialsDeclared and never the registry' do
      get "/break_escape/games/#{@game.id}/scenario", as: :json
      assert_response :success
      assert_equal true, response.parsed_body['credentialsDeclared']
      refute response.parsed_body.key?('credentials'), 'the registry stays on the server'
    end

    test 'a scenario without credentials answers credentialsDeclared false' do
      @game.update_columns(scenario_data: @game.scenario_data.except('credentials'))
      get "/break_escape/games/#{@game.id}/scenario", as: :json
      assert_response :success
      assert_equal false, response.parsed_body['credentialsDeclared']
    end

    test "another player's game answers as GET /capture_secrets does (forbidden)" do
      other = Game.create!(mission: @game.mission, player: break_escape_demo_users(:other_user)).reload
      get game_path(other.id, 'keyring'), as: :json
      cap_status = begin
        get game_path(other.id, 'capture_secrets'), as: :json
        response.status
      end
      get game_path(other.id, 'keyring'), as: :json
      assert_equal cap_status, response.status, 'keyring and capture_secrets share the same policy'
    end
  end
end
