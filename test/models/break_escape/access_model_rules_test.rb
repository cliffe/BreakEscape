require 'test_helper'
require_relative '../../support/access_model_scenario'

module BreakEscape
  # Access model step 3: the class rules the routes share (ACCESS_MODEL_PLAN.md
  # sections 3, 4 and 6) and the scope lookup (5.1).
  class AccessModelRulesTest < ActiveSupport::TestCase
    test 'identity roles add staff for any NPC with creds or a card, unless staff is false' do
      assert_equal %w[finance staff], Game.identity_roles({ 'role' => 'finance', 'creds' => { 'username' => 'a' } })
      assert_equal %w[guard staff], Game.identity_roles({ 'role' => ['guard'], 'rfidCard' => { 'card_id' => 'x' } })
      assert_equal %w[finance], Game.identity_roles({ 'role' => 'finance', 'creds' => {}, 'staff' => false })
      assert_equal [], Game.identity_roles({ 'role' => nil })
    end

    test 'an access list admits by role or by person' do
      jake = { 'id' => 'jake', 'role' => 'finance', 'creds' => { 'username' => 'j' } }
      assert Game.acl_admits?({ 'roles' => ['finance'] }, jake)
      assert Game.acl_admits?({ 'roles' => ['staff'] }, jake)
      assert Game.acl_admits?({ 'people' => ['jake'] }, jake)
      refute Game.acl_admits?({ 'roles' => ['it'], 'people' => ['dana'] }, jake)
      refute Game.acl_admits?(nil, jake)
    end

    test 'needs_tracked? follows the needs system register rule' do
      assert Game.needs_tracked?({ 'needs' => { 'coffee' => { 'decayPerMin' => 30, 'urgentAt' => 40 } } })
      assert Game.needs_tracked?({ 'needs' => { 'coffee' => { 'decayPerMin' => '2.5', 'urgentAt' => '40' } } })
      refute Game.needs_tracked?({ 'needs' => { 'coffee' => { 'decayPerMin' => 0, 'urgentAt' => 40 } } })
      refute Game.needs_tracked?({ 'needs' => { 'coffee' => { 'decayPerMin' => 30 } } })
      assert Game.needs_tracked?({ 'interests' => { 'gossip' => 1 } })
      assert Game.needs_tracked?({ 'interests' => { 'gossip' => { 'weight' => 0.5 } } })
      refute Game.needs_tracked?({ 'interests' => { 'gossip' => 0 } })
      refute Game.needs_tracked?({ 'interests' => { 'gossip' => '2' } })
      refute Game.needs_tracked?({})
    end

    test 'login_scope_of reports scope and path' do
      game = create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                                scenario: AccessModelScenario.routes_scenario)
      pc = game.login_scope_of('jake_pc')
      assert_nil pc[:scope]
      assert_equal 'finance', pc[:room_id]
      assert_equal({ type: 'login_pc', id: 'jake_pc' }, game.login_scope_of('jake_local')[:scope])
      inner = game.login_scope_of('jake_inner')
      assert_equal({ type: 'profile', id: 'jake_files' }, inner[:scope])
      assert_equal %w[jake_archive], inner[:path].map { |c| c['id'] }
      assert_equal %w[lobby_safe], game.login_scope_of('safe_badge')[:path].map { |c| c['id'] }
      assert_nil game.login_scope_of('nothing_here')
    end

    test 'a new game starts with empty access model state' do
      game = create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                                scenario: AccessModelScenario.routes_scenario)
      Game::ACCESS_STATE_DEFAULTS.each { |key, empty| assert_equal empty, game.player_state[key], key }
    end
  end
end
