require 'test_helper'

module BreakEscape
  class MissionsControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    test "should get index" do
      get missions_url
      assert_response :success
    end

    test "index should return HTML with mission list" do
      get missions_url
      assert_response :success
      assert_select 'h1', text: /BreakEscape/
      assert_select '.mission-card', minimum: 1
    end

    test "index should display published missions" do
      get missions_url
      assert_response :success

      # Should show published mission
      assert_select '.mission-title', text: break_escape_missions(:ceo_exfil).display_name
    end

    test "should show published mission" do
      mission = break_escape_missions(:ceo_exfil)
      get mission_url(mission)
      assert_response :redirect  # Redirects to game
    end

    test "should create game and redirect when showing mission" do
      mission = break_escape_missions(:ceo_exfil)

      assert_difference 'Game.count', 1 do
        get mission_url(mission)
      end

      assert_response :redirect
      assert_match /\/games\/\d+/, @response.location
    end
  end
end
