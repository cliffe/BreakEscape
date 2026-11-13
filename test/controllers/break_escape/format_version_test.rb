require 'test_helper'
require 'minitest/mock'

# Step 7. The server side of formatVersion and the load-time upgrader, over HTTP: the X-Break-Escape-Format
# header on every engine response and every early exit, the 409 refusal for a too-new or unreadable game,
# the sync_state refusal under its row lock, creation stamping, and re-preparing only on change. STEPS is
# empty in step 7, so a test that needs a non-zero current stubs FormatUpgrade.steps with a fixture list.
module BreakEscape
  class FormatVersionTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    FU = BreakEscape::FormatUpgrade
    HEADER = 'X-Break-Escape-Format'.freeze

    # A fixture step list that raises current to 1 by a step that renames a scenario key (so it runs
    # prepare again) and one that changes nothing on the deployed/test scenarios.
    def noop_steps
      [{ version: 1, name: 'noop', scenario: ->(_d) { }, player_state: ->(_s) { }, retired: [] }]
    end

    def rename_steps
      [{ version: 1, name: 'rename',
         scenario: ->(d) { d['renamedRoom'] = d.delete('spareKey') if d.is_a?(Hash) && d.key?('spareKey') },
         player_state: ->(_s) { }, retired: [{ path: nil, key: 'spareKey', now: 'renamedRoom' }] }]
    end

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @owner   = break_escape_demo_users(:test_user)
      PlayerPreference.find_or_create_by!(player: @owner) do |pref|
        pref.selected_sprite = 'female_hacker_hood_v2'
        pref.in_game_name    = 'TestAgent'
      end
    end

    def scenario(extra = {})
      {
        'scenario_brief' => 'brief', 'startRoom' => 'lobby',
        'rooms' => { 'lobby' => { 'type' => 'room_office', 'locked' => false, 'connections' => {},
                                  'objects' => [], 'npcs' => [] } },
        'globalVariables' => {}
      }.merge(extra)
    end

    def make_game(player_state: nil, scenario_data: nil)
      Game.create!(mission: @mission, player: @owner,
                   scenario_data: scenario_data || scenario,
                   player_state: player_state || { 'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'] })
    end

    # --- stamping at creation ---

    test 'creation stamps current (0 in step 7)' do
      game = make_game
      assert_equal 0, game.scenario_data['formatVersion']
    end

    test 'supplied data with formatVersion 0 keeps 0' do
      game = make_game(scenario_data: scenario('formatVersion' => 0))
      assert_equal 0, game.scenario_data['formatVersion']
    end

    # --- a game from before step 7 is never written by step 7 ---

    test 'a game with no formatVersion is not written on load and ships and headers 0' do
      game = make_game
      game.update_column(:scenario_data, scenario) # strip the stamp: now no formatVersion
      before = game.reload.updated_at

      get scenario_game_url(game)
      assert_response :success
      assert_equal 0, response.parsed_body['formatVersion']
      assert_equal '0', response.headers[HEADER]
      assert_nil game.reload.scenario_data['formatVersion'], 'nothing written to scenario_data'
      assert_equal before.to_i, game.updated_at.to_i
    end

    # --- the header ---

    test 'the header is present and equal to current on an ordinary route' do
      game = make_game
      get scenario_game_url(game)
      assert_response :success
      assert_equal '0', response.headers[HEADER]
    end

    test 'set_format_header is the first before callback of every engine controller except the static one' do
      [GamesController, MissionsController, PlayerPreferencesController, Api::GamesController].each do |ctrl|
        first = ctrl._process_action_callbacks.select { |c| c.kind == :before }.first
        assert_equal :set_format_header, first.filter, "#{ctrl} first before callback"
      end
      static_before = StaticFilesController._process_action_callbacks.select { |c| c.kind == :before }.map(&:filter)
      refute_includes static_before, :set_format_header
    end

    # --- the refusal: too new ---

    test 'a too-new game is refused on scenario and room with 409 json and the header, nothing written' do
      game = make_game
      game.update_column(:scenario_data, scenario('formatVersion' => 5))
      before = game.reload.scenario_data

      get scenario_game_url(game)
      assert_response :conflict
      assert_equal 'format', response.parsed_body['error']
      assert_equal 0, response.parsed_body['current']
      assert_match(/newer version/, response.parsed_body['message'])
      assert_equal '0', response.headers[HEADER]

      get room_game_url(game, room_id: 'lobby')
      assert_response :conflict
      assert_equal 'format', response.parsed_body['error']

      assert_equal before, game.reload.scenario_data, 'nothing written'
    end

    test 'a too-new game shows the HTML refusal page on show' do
      game = make_game
      game.update_column(:scenario_data, scenario('formatVersion' => 5))
      get game_url(game)
      assert_response :conflict
      assert_match(/newer version/, response.body)
    end

    test 'an unreadable formatVersion is refused' do
      game = make_game
      game.update_column(:scenario_data, scenario('formatVersion' => '1'))
      get scenario_game_url(game)
      assert_response :conflict
      assert_match(/cannot be read/, response.parsed_body['message'])
    end

    # --- sync_state refusal ---

    test 'sync_state refuses a too-new game with 409 and writes nothing' do
      game = make_game
      game.update_column(:scenario_data, scenario('formatVersion' => 5))
      state_before = game.reload.player_state
      updated_before = game.updated_at

      put sync_state_game_url(game), params: { globalVariables: { 'g' => 1 }, clientTs: 1 }, as: :json
      assert_response :conflict
      assert_equal 'format', response.parsed_body['error']
      assert_equal '0', response.headers[HEADER]

      game.reload
      assert_equal state_before, game.player_state
      assert_equal updated_before.to_i, game.updated_at.to_i
    end

    test 'sync_state refuses a game whose formatVersion is a JSON string scalar, as set_game does' do
      game = make_game
      # A stored JSON string scalar "1": set_game refuses it as unreadable (see the GET scenario test
      # above). sync_format_refusal must agree, reading the value the same way regardless of adapter.
      game.update_column(:scenario_data, scenario('formatVersion' => '1'))
      state_before = game.reload.player_state
      updated_before = game.updated_at

      put sync_state_game_url(game), params: { globalVariables: { 'g' => 1 }, clientTs: 1 }, as: :json
      assert_response :conflict
      assert_equal 'format', response.parsed_body['error']
      assert_match(/cannot be read/, response.parsed_body['message'])
      assert_equal '0', response.headers[HEADER]

      game.reload
      assert_equal state_before, game.player_state
      assert_equal updated_before.to_i, game.updated_at.to_i
    end

    # --- upgrade on load, with a fixture step list ---

    test 'a game at 0 is upgraded and ships formatVersion 1 on GET scenario' do
      game = make_game
      game.update_column(:scenario_data, scenario('spareKey' => 'x')) # no formatVersion, renamable key
      FU.stub(:steps, rename_steps) do
        get scenario_game_url(game)
        assert_response :success
        assert_equal 1, response.parsed_body['formatVersion']
      end
      game.reload
      assert_equal 1, game.scenario_data['formatVersion']
      assert_equal 'x', game.scenario_data['renamedRoom']
      assert_nil game.scenario_data['spareKey']
    end

    test 'ensure_current_format! re-prepares exactly once when the scenario changed' do
      game = make_game
      game.update_column(:scenario_data, scenario('spareKey' => 'x'))
      game.reload
      prepare_calls = 0
      game.stub(:prepare_scenario_data!, -> { prepare_calls += 1 }) do
        FU.stub(:steps, rename_steps) { game.ensure_current_format! }
      end
      assert_equal 1, prepare_calls, 'prepared again once because the scenario changed'
      assert_equal 1, game.reload.scenario_data['formatVersion']
      assert_equal 'x', game.scenario_data['renamedRoom']
    end

    test 'ensure_current_format! stamps the version but does not re-prepare on a no-op step' do
      game = make_game
      game.update_column(:scenario_data, scenario) # no formatVersion
      game.reload
      prepare_calls = 0
      game.stub(:prepare_scenario_data!, -> { prepare_calls += 1 }) do
        FU.stub(:steps, noop_steps) { game.ensure_current_format! }
      end
      assert_equal 0, prepare_calls, 'a no-op step does not re-prepare'
      assert_equal 1, game.reload.scenario_data['formatVersion']
    end

    test 'the lock reruns version_of inside it and a second ensure runs no step' do
      game = make_game
      game.update_column(:scenario_data, scenario)
      game.reload
      calls = 0
      FU.stub(:steps, noop_steps) do
        game.ensure_current_format! # upgrades 0 -> 1
        game.reload
        # already at 1 now: a second call takes no lock and runs nothing
        game.stub(:prepare_scenario_data!, -> { calls += 1 }) { game.ensure_current_format! }
      end
      assert_equal 0, calls
      assert_equal 1, game.reload.scenario_data['formatVersion']
    end

    # --- the header on early exits ---

    test 'the header is present on a Pundit refusal' do
      other = break_escape_demo_users(:other_user)
      other_game = Game.create!(mission: @mission, player: other,
                                scenario_data: scenario,
                                player_state: { 'currentRoom' => 'lobby' })
      get scenario_game_url(other_game), as: :json
      assert_response :forbidden
      assert_equal '0', response.headers[HEADER]
    end

    test 'the header is present on a CSRF failure, answered 422 for a JSON request' do
      game = make_game
      BreakEscape::ApplicationController.allow_forgery_protection = true
      put sync_state_game_url(game), params: { clientTs: 1 }.to_json,
                                     headers: { 'CONTENT_TYPE' => 'application/json' }
      assert_response :unprocessable_entity
      assert_equal 'invalid_authenticity_token', response.parsed_body['error']
      assert_equal '0', response.headers[HEADER]
    ensure
      BreakEscape::ApplicationController.allow_forgery_protection = false
    end

    test 'the header is present on refuse_oversized_body' do
      game = make_game
      big = 'x' * (GamesController::OVERSIZED_BODY_LIMITS['npc_frustration'] + 10)
      post npc_frustration_game_url(game), params: { blob: big }.to_json,
                                           headers: { 'CONTENT_TYPE' => 'application/json' }
      assert_response :payload_too_large
      assert_equal '0', response.headers[HEADER]
    end

    test 'sync_state on a game at 0 succeeds and runs no upgrade even when current is 1' do
      game = make_game
      game.update_column(:scenario_data, scenario) # no formatVersion
      FU.stub(:steps, noop_steps) do
        put sync_state_game_url(game), params: { globalVariables: { 'g' => 1 }, clientTs: 1 }, as: :json
        assert_response :success
      end
      assert_nil game.reload.scenario_data['formatVersion'], 'sync never upgrades scenario_data'
    end
  end
end
