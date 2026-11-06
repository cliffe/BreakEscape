require 'test_helper'

module BreakEscape
  # GET /games/:id/capture_secrets serves the authored secret for each earned SE credential
  # capture, and nothing before the capture is earned. The bootstrap (GET /scenario) must carry
  # no secret at all.
  class CaptureSecretEndpointTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    SECRET = 'Sofia2026!'.freeze

    def scenario_data
      {
        'startRoom' => 'start',
        'rooms' => { 'start' => { 'type' => 'room_office', 'connections' => {} } },
        'social' => {
          'captures' => { 'revealSecret' => true },
          'landingPages' => [
            { 'id' => 'payroll_login',
              'capture' => { 'address' => 's.lord@ledgerwell.example', 'secret' => SECRET, 'note' => 'captured' } }
          ]
        }
      }
    end

    def build_game(player_state = {})
      Game.create!(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario_data: scenario_data,
        player_state: { 'currentRoom' => 'start', 'unlockedRooms' => ['start'] }.merge(player_state)
      )
    end

    test 'the bootstrap scenario carries no capture secret' do
      game = build_game
      get scenario_game_url(game), as: :json
      assert_response :success
      refute_includes response.body, SECRET, 'the bootstrap must not ship the secret'
    end

    test 'capture_secrets is empty before the capture is earned, and refuses nothing' do
      game = build_game
      get capture_secrets_game_url(game), as: :json
      assert_response :success
      assert_equal({ 'secrets' => {} }, response.parsed_body)
    end

    test 'capture_secrets serves the secret once se_captures shows the phish landed' do
      game = build_game('globalVariables' => { 'se_captures' => {
        'lord' => { 'targetId' => 'lord', 'kind' => 'credential', 'address' => 's.lord@ledgerwell.example', 'at' => 1 }
      } })
      get capture_secrets_game_url(game), as: :json
      assert_response :success
      assert_equal({ 'secrets' => { 'lord' => SECRET } }, response.parsed_body)
    end
  end
end
