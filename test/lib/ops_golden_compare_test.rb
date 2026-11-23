require 'test_helper'
require_relative '../support/ops_golden'

# The golden helper's own spec (OPS_LOG_ROWS_PLAN.md section 11, "Golden helper, L1a"): an identical
# run matches; a changed body, status or state value fails; an empty ACCESS_STATE_DEFAULTS key absent
# from the fixture is stripped, a non-empty one fails; runs at different wall times match.
module BreakEscape
  class OpsGoldenCompareTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    DEFAULTS = Game::ACCESS_STATE_DEFAULTS

    def result(status: 200, body: { 'ok' => true }, state: { 'currentRoom' => 'lobby' })
      { 'answers' => [{ 'id' => 'a', 'status' => status, 'body' => body }], 'state' => state }
    end

    def diffs(expected, actual)
      OpsGolden.compare(expected, actual, defaults: DEFAULTS)
    end

    test 'an identical run matches' do
      assert_empty diffs(result, result)
    end

    test 'a changed body fails and names the field' do
      out = diffs(result, result(body: { 'ok' => false }))
      assert_equal 1, out.size
      assert_match(/answers\[a\]\.body\.ok/, out.first)
    end

    test 'an added or a missing body field fails' do
      assert_match(/unexpected/, diffs(result, result(body: { 'ok' => true, 'opsLog' => [] })).first)
      assert_match(/missing/, diffs(result, result(body: {})).first)
    end

    test 'a changed status fails' do
      assert_match(/status/, diffs(result, result(status: 422)).first)
    end

    test 'a changed state value fails' do
      assert_match(/state\.currentRoom/, diffs(result, result(state: { 'currentRoom' => 'finance' })).first)
    end

    test 'a different number of answers fails' do
      two = result.merge('answers' => result['answers'] * 2)
      assert_match(/answer count/, diffs(result, two).first)
    end

    test 'an empty ACCESS_STATE_DEFAULTS key absent from the fixture is stripped' do
      live = result(state: { 'currentRoom' => 'lobby', 'sessions' => {}, 'signedInPcs' => [], 'loginLockouts' => [] })
      assert_empty diffs(result, live)
    end

    test 'a non-empty ACCESS_STATE_DEFAULTS key absent from the fixture fails' do
      live = result(state: { 'currentRoom' => 'lobby', 'signedInPcs' => ['jake_pc'] })
      assert_match(/signedInPcs/, diffs(result, live).first)
    end

    test 'an empty key outside ACCESS_STATE_DEFAULTS is not stripped' do
      live = result(state: { 'currentRoom' => 'lobby', 'opsLog' => [] })
      assert_match(/opsLog/, diffs(result, live).first)
    end

    test 'an empty default key the fixture holds must still match' do
      expected = result(state: { 'currentRoom' => 'lobby', 'sessions' => {} })
      assert_match(/sessions/, diffs(expected, result).first)
    end

    test 'the same script played at different wall times matches (clock frozen)' do
      fixture = OpsGolden.load_fixture(OpsGolden.fixture_paths.first)
      args = { mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user) }
      first = OpsGolden.play(self, fixture, **args)
      sleep 1.1 # real time moves on between the two plays; the frozen clock hides it
      later = OpsGolden.play(self, fixture, **args)
      assert_empty diffs(first, later)
      assert_empty diffs(fixture['expected'], first)
    end

    test 'a game id is replaced everywhere it appears' do
      assert_equal({ 'url' => '/break_escape/games/{game}/x', 'gameId' => '{game}', 'n' => 7 },
                   OpsGolden.scrub({ 'url' => '/break_escape/games/12/x', 'gameId' => 12, 'n' => 7 }, 12))
    end
  end
end
