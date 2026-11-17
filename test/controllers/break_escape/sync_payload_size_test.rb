require 'test_helper'

module BreakEscape
  # Credential keyring K1 (CREDENTIAL_KEYRING_PLAN.md 6.4, 6.6): the bootstrap carries no credential
  # registry, and GET /keyring stays small even at the registry cap. The registry is server-only,
  # stripped from GET /scenario; the keyring answer is a read, bounded by the 64-entry cap, so it
  # never approaches the 16 KB a synced payload must respect.
  # Named distinctly from test/integration/sync_payload_size_test.rb's SyncPayloadSizeTest: two files
  # under one fully-qualified class name would reopen and merge into one class under a full test run
  # (R2 m2).
  class KeyringSyncSizeTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    MAX_ENTRIES = 64
    # 2026-11-16, K3d R2: GET /keyring is a read sent only when its rev moves, never part of
    # player_state, so the 16 KB sync budget does not apply to it. K3d added how and gainedAt
    # (about 42 bytes per entry) and the fixture is now realistic, so the cap is 24 KB and a
    # per-entry guard shows any later field that adds bloat.
    SIZE_LIMIT = 24 * 1024
    MAX_BYTES_PER_ENTRY = 360

    def keyring_path(game)
      "/break_escape/games/#{game.id}/keyring"
    end

    # A registry of `count` saved_connection entries, all proven by one held foothold.
    def registry(count)
      (0...count).each_with_object({}) do |i, out|
        id = format('cred%02d', i)
        out[id] = {
          'kind' => 'saved_connection', 'account' => 'acct', 'connectsTo' => "pc_#{i}",
          'label' => format('Saved connection to finance server %02d', i)[0, 32],
          'proof' => { 'foothold' => 'fh1' }
        }
      end
    end

    def scenario(count)
      {
        'scenario_brief' => 'keyring size test', 'startRoom' => 'office',
        'rooms' => {
          'office' => {
            'npcs' => [
              { 'id' => 'acct', 'displayName' => 'Account Holder Finance',
                'creds' => { 'username' => 'aholder.finance', 'password' => 'Vault-Acct-9' } }
            ],
            'objects' => (0...count).map do |i|
              { 'id' => "pc_#{i}", 'type' => 'pc', 'lockType' => 'login', 'name' => "Finance PC #{i}",
                'host' => format('HB-FIN-%02d.hartbridge.example', i) }
            end
          }
        },
        'credentials' => registry(count)
      }
    end

    def build_game(count)
      mission = Mission.create!(name: 'test_simple_success', display_name: 'Keyring size',
                                published: true, difficulty_level: 1)
      game = Game.create!(mission: mission, player: break_escape_demo_users(:test_user)).reload
      data = scenario(count).merge('formatVersion' => BreakEscape::FormatUpgrade.current)
      state = game.player_state.merge('footholds' => { 'fh1' => { 'at' => 1 } })
      game.update_columns(scenario_data: data, player_state: state)
      game
    end

    test 'the bootstrap scenario carries no credentials key' do
      game = build_game(2)
      get scenario_game_url(game), as: :json
      assert_response :success
      refute response.parsed_body.key?('credentials'), 'the registry must be stripped from the bootstrap'
      # The K3a flag credentialsDeclared is allowed; the registry's own key and its entries are not
      refute_match(/"credentials"\s*:/, response.body, 'the server-only registry must never reach the browser')
    end

    test 'GET /keyring at the 64-entry cap stays under 24 KB and 360 bytes an entry' do
      game = build_game(MAX_ENTRIES)
      get keyring_path(game), as: :json
      assert_response :success
      assert_equal MAX_ENTRIES, response.parsed_body['entries'].length, 'all 64 proven entries are served'
      assert_operator response.body.bytesize, :<, SIZE_LIMIT,
                       "the keyring answer was #{response.body.bytesize} bytes"
      assert_operator response.body.bytesize / MAX_ENTRIES, :<, MAX_BYTES_PER_ENTRY,
                       "#{response.body.bytesize} bytes, #{response.body.bytesize / MAX_ENTRIES} an entry: a new field adds bloat"
      sample = response.parsed_body['entries'].first
      assert sample['label'].to_s.length >= 20 && sample['host'].present?, 'the fixture fills labels and hosts'
    end

    test 'a repeat with a matching rev returns a few bytes' do
      game = build_game(MAX_ENTRIES)
      get keyring_path(game), as: :json
      rev = response.parsed_body['rev']
      get keyring_path(game), params: { rev: rev }, as: :json
      assert_response :success
      assert_equal true, response.parsed_body['unchanged']
      assert_operator response.body.bytesize, :<, 64, 'an unchanged answer is tiny'
    end
  end
end
