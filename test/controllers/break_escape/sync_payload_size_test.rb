require 'test_helper'

module BreakEscape
  # Credential keyring K1 (CREDENTIAL_KEYRING_PLAN.md 6.4, 6.6): the bootstrap carries no credential
  # registry, and GET /keyring stays small even at the registry cap. The registry is server-only,
  # stripped from GET /scenario; the keyring answer is a read, bounded by the 64-entry cap, so it
  # never approaches the 16 KB a synced payload must respect.
  class SyncPayloadSizeTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    MAX_ENTRIES = 64
    SIZE_LIMIT = 16 * 1024

    def keyring_path(game)
      "/break_escape/games/#{game.id}/keyring"
    end

    # A registry of `count` saved_connection entries, all proven by one held foothold.
    def registry(count)
      (0...count).each_with_object({}) do |i, out|
        id = format('cred%02d', i)
        out[id] = {
          'kind' => 'saved_connection', 'account' => 'acct', 'connectsTo' => "pc_#{i}",
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
              { 'id' => 'acct', 'displayName' => 'Account Holder',
                'creds' => { 'username' => 'aholder', 'password' => 'Vault-Acct-9' } }
            ]
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
      refute_includes response.body, 'credentials', 'the server-only registry must never reach the browser'
    end

    test 'GET /keyring at the 64-entry cap stays well under 16 KB' do
      game = build_game(MAX_ENTRIES)
      get keyring_path(game), as: :json
      assert_response :success
      assert_equal MAX_ENTRIES, response.parsed_body['entries'].length, 'all 64 proven entries are served'
      assert_operator response.body.bytesize, :<, SIZE_LIMIT,
                       "the keyring answer was #{response.body.bytesize} bytes"
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
