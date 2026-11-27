require 'test_helper'

module BreakEscape
  # The SE lab's credential-capture secret (e.g. a phished portal password) must not reach the
  # browser until the capture is earned. The bootstrap strips it; the server serves it from
  # Game#capture_secrets_for_client only once its own se_captures record shows the phish landed.
  class CaptureSecretTest < ActiveSupport::TestCase
    PAGE = {
      'id' => 'payroll_login',
      'capture' => {
        'address' => 's.lord@ledgerwell.example',
        'secret' => 'Sofia2026!',
        'note' => 'Sofia Lord\'s portal sign-in was captured by your page.'
      }
    }.freeze

    def scenario_data(reveal: true)
      {
        'startRoom' => 'start',
        'rooms' => { 'start' => { 'type' => 'room_office', 'connections' => {} } },
        'social' => {
          'captures' => { 'revealSecret' => reveal },
          'landingPages' => [PAGE.deep_dup],
          # The phish target the captures below are keyed by: a target id declared nowhere
          # is never served (engine plan section 6).
          'phishTargets' => [{ 'id' => 'lord', 'address' => 's.lord@ledgerwell.example' }]
        }
      }
    end

    def build_game(data, player_state = {})
      game = Game.new(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario_data: data,
        player_state: player_state
      )
      game.save(validate: false)
      game
    end

    test 'filtered_scenario_for_bootstrap strips the capture secret but keeps address, note and revealSecret' do
      game = build_game(scenario_data)
      filtered = game.filtered_scenario_for_bootstrap

      page = filtered.dig('social', 'landingPages', 0)
      assert_not_nil page, 'the landing page survives the bootstrap filter'
      refute page['capture'].key?('secret'), 'the authored secret must not ship in the bootstrap'
      assert_equal 's.lord@ledgerwell.example', page['capture']['address'], 'the address (not secret) stays'
      assert page['capture']['note'].present?, 'the note (not secret) stays'
      assert_equal true, filtered.dig('social', 'captures', 'revealSecret'), 'the reveal flag stays'

      # The original scenario data is untouched (the filter works on a deep copy).
      assert_equal 'Sofia2026!', game.scenario_data.dig('social', 'landingPages', 0, 'capture', 'secret')
    end

    test 'capture_secrets_for_client is empty before any capture is earned' do
      game = build_game(scenario_data, 'globalVariables' => {})
      assert_equal({}, game.capture_secrets_for_client)
    end

    test 'capture_secrets_for_client serves the authored secret once the capture is earned' do
      earned = { 'globalVariables' => { 'se_captures' => {
        'lord' => { 'targetId' => 'lord', 'kind' => 'credential', 'address' => 's.lord@ledgerwell.example', 'at' => 1 }
      } } }
      game = build_game(scenario_data, earned)
      assert_equal({ 'lord' => 'Sofia2026!' }, game.capture_secrets_for_client)
    end

    test 'capture_secrets_for_client stays empty when the scenario does not reveal' do
      earned = { 'globalVariables' => { 'se_captures' => {
        'lord' => { 'targetId' => 'lord', 'kind' => 'credential', 'address' => 's.lord@ledgerwell.example', 'at' => 1 }
      } } }
      game = build_game(scenario_data(reveal: false), earned)
      assert_equal({}, game.capture_secrets_for_client)
    end

    test 'capture_secrets_for_client ignores a foothold capture (no secret to serve)' do
      earned = { 'globalVariables' => { 'se_captures' => {
        'ops' => { 'targetId' => 'ops', 'kind' => 'foothold', 'host' => 'WS-014', 'at' => 2 }
      } } }
      game = build_game(scenario_data, earned)
      assert_equal({}, game.capture_secrets_for_client)
    end

    test 'capture_secrets_for_client falls back to the single authored secret when the address differs' do
      # One landing page with a secret: an earned entry whose stored address does not match still
      # resolves (the capture can only have come from that page).
      earned = { 'globalVariables' => { 'se_captures' => {
        'lord' => { 'targetId' => 'lord', 'kind' => 'credential', 'address' => 'other@ledgerwell.example', 'at' => 1 }
      } } }
      game = build_game(scenario_data, earned)
      assert_equal({ 'lord' => 'Sofia2026!' }, game.capture_secrets_for_client)
    end

    test 'capture_secrets_for_client skips an entry whose target id no capture route declares' do
      # A browser can write any se_captures entry through PUT /sync_state; one keyed by a target
      # id the scenario never declares cannot have been earned, by address or by the fallback.
      earned = { 'globalVariables' => { 'se_captures' => {
        'forged' => { 'targetId' => 'forged', 'kind' => 'credential', 'address' => 's.lord@ledgerwell.example', 'at' => 1 },
        'stray' => { 'targetId' => 'stray', 'kind' => 'credential', 'address' => 'other@ledgerwell.example', 'at' => 2 }
      } } }
      game = build_game(scenario_data, earned)
      assert_equal({}, game.capture_secrets_for_client)
    end
  end
end
