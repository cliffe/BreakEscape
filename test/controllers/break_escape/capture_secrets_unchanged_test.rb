require 'test_helper'

module BreakEscape
  # Credential keyring K1 (CREDENTIAL_KEYRING_PLAN.md 6.4): the golden check that GET
  # /capture_secrets answers are byte-identical whether or not the scenario carries a credential
  # registry. K1 edits none of capture_secrets' readers (the keyring's implicit entries are built
  # from the same readers, never the other way round), so adding a `credentials` block, which the
  # server strips from the bootstrap and only the keyring reads, must leave this answer untouched.
  class CaptureSecretsUnchangedTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    SECRET = 'Sofia2026!'.freeze
    EARNED = { 'globalVariables' => { 'se_captures' => {
      'lord' => { 'targetId' => 'lord', 'kind' => 'credential', 'address' => 's.lord@ledgerwell.example', 'at' => 1 }
    } } }.freeze

    # The credential registry the keyring reads; inert for GET /capture_secrets.
    REGISTRY = {
      'credentials' => {
        'lord_pw' => { 'kind' => 'password', 'account' => 'lord', 'proof' => { 'planted' => 'lord' }, 'foundIn' => 'inbox' }
      }
    }.freeze

    def scenario_data(with_registry: false)
      base = {
        'startRoom' => 'start',
        'rooms' => { 'start' => { 'type' => 'room_office', 'connections' => {} } },
        'social' => {
          'captures' => { 'revealSecret' => true },
          'landingPages' => [
            { 'id' => 'payroll_login',
              'capture' => { 'address' => 's.lord@ledgerwell.example', 'secret' => SECRET, 'note' => 'captured' } }
          ],
          'phishTargets' => [{ 'id' => 'lord', 'address' => 's.lord@ledgerwell.example' }]
        }
      }
      with_registry ? base.merge(REGISTRY) : base
    end

    def build_game(with_registry: false, player_state: {})
      Game.create!(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario_data: scenario_data(with_registry: with_registry),
        player_state: { 'currentRoom' => 'start', 'unlockedRooms' => ['start'] }.merge(player_state)
      )
    end

    def capture_body(game)
      get capture_secrets_game_url(game), as: :json
      assert_response :success
      response.body
    end

    test 'the registry does not change the GET /capture_secrets bytes, before the capture' do
      plain = capture_body(build_game)
      with_reg = capture_body(build_game(with_registry: true))
      assert_equal plain, with_reg
      assert_equal '{"secrets":{}}', plain
    end

    test 'the registry does not change the GET /capture_secrets bytes, after the capture' do
      plain = capture_body(build_game(player_state: EARNED))
      with_reg = capture_body(build_game(with_registry: true, player_state: EARNED))
      assert_equal plain, with_reg
      assert_equal '{"secrets":{"lord":"Sofia2026!"}}', plain
    end

    test 'GET /capture_secrets never carries a credentials key' do
      body = capture_body(build_game(with_registry: true, player_state: EARNED))
      refute_includes body, 'credentials', 'the server-only registry must never reach the browser'
    end

    test 'the answer is deterministic across two reads' do
      game = build_game(with_registry: true, player_state: EARNED)
      assert_equal capture_body(game), capture_body(game)
    end
  end
end
