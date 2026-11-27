require 'test_helper'

module BreakEscape
  # config.can_create_game gates GET /games/new and POST /games (the direct
  # creation path). Hosts such as Hacktivity launch slot games themselves and
  # use this hook to stop other users creating games outside a slot.
  class CreateGameGateTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @original = BreakEscape.configuration.can_create_game
    end

    teardown do
      BreakEscape.configuration.can_create_game = @original
    end

    test "POST /games is refused when the hook refuses" do
      BreakEscape.configuration.can_create_game = ->(_user, _mission) { false }

      assert_no_difference 'Game.count' do
        post games_url, params: { mission_id: @mission.id }, as: :json
      end
      assert_response :forbidden
    end

    test "GET /games/new is refused when the hook refuses" do
      BreakEscape.configuration.can_create_game = ->(_user, _mission) { false }

      get new_game_url(mission_id: @mission.id)
      assert_response :redirect
      assert_match(/not authorized/i, flash[:alert].to_s)
    end

    test "POST /games works when the hook allows" do
      BreakEscape.configuration.can_create_game = ->(_user, _mission) { true }

      assert_difference 'Game.count', 1 do
        post games_url, params: { mission_id: @mission.id }
      end
    end

    test "POST /games works when no hook is set" do
      BreakEscape.configuration.can_create_game = nil

      assert_difference 'Game.count', 1 do
        post games_url, params: { mission_id: @mission.id }
      end
    end

    # GET /missions/:id auto-creates a game for non-VM missions, so it needs the same gate.
    test "GET /missions/:id creates no game when the hook refuses and the player has none" do
      BreakEscape.configuration.can_create_game = ->(_user, _mission) { false }
      Game.where(mission: @mission).delete_all

      assert_no_difference 'Game.count' do
        get mission_url(@mission)
      end
      assert_response :redirect
      assert_no_match(/\/games\/\d+/, response.location)
    end

    test "GET /missions/:id still redirects to an existing game when the hook refuses" do
      player = break_escape_demo_users(:test_user)
      game = Game.where(mission: @mission, player: player).first ||
             Game.create!(mission: @mission, player: player)
      BreakEscape.configuration.can_create_game = ->(_user, _mission) { false }

      assert_no_difference 'Game.count' do
        get mission_url(@mission)
      end
      assert_redirected_to "/break_escape/games/#{game.id}"
    end

    test "GET /missions/:id creates a game when no hook is set" do
      BreakEscape.configuration.can_create_game = nil
      Game.where(mission: @mission).delete_all

      assert_difference 'Game.count', 1 do
        get mission_url(@mission)
      end
      assert_match(/\/games\/\d+/, response.location)
    end
  end
end
