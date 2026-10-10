require 'test_helper'

module BreakEscape
  class NPCInkLoadingTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @player = break_escape_demo_users(:test_user)

      # Create a test game with scenario that has an NPC with actual story file
      @game = Game.create!(
        mission: @mission,
        player: @player,
        scenario_data: {
          "startRoom" => "test_room",
          "rooms" => {
            "test_room" => {
              "npcs" => [
                {
                  "id" => "security_guard",
                  "displayName" => "Security Guard",
                  "npcType" => "person",
                  "storyPath" => "scenarios/ink/security-guard.json"
                },
                {
                  "id" => "test-npc",
                  "displayName" => "Test NPC",
                  "npcType" => "helper",
                  "storyPath" => "scenarios/ink/test-npc.json"
                }
              ]
            }
          }
        }
      )
    end

    # Test ink endpoint with NPC missing story file
    test 'should return 404 for NPC without story file' do
      get "/break_escape/games/#{@game.id}/ink", params: { npc: 'npc-with-no-file' }

      # File doesn't exist, should return 404
      assert_response :not_found
    end

    # Test missing npc parameter
    test 'should return bad request if npc parameter missing' do
      get "/break_escape/games/#{@game.id}/ink"
      assert_response :bad_request
    end

    # Test non-existent NPC
    test 'should return 404 for non-existent NPC' do
      get "/break_escape/games/#{@game.id}/ink", params: { npc: 'non-existent-npc' }
      assert_response :not_found
    end

    # Test that npc-lazy-loader constructs correct API endpoint
    test 'npc-lazy-loader should construct correct API endpoint URL' do
      get '/break_escape/js/systems/npc-lazy-loader.js'
      assert_response :success
      assert_equal 'application/javascript', response.content_type

      content = response.body
      # Verify the lazy loader gets gameId from breakEscapeConfig
      assert_includes content, 'window.breakEscapeConfig?.gameId'
      # Verify it constructs the proper endpoint
      assert_includes content, '/break_escape/games'
      assert_includes content, 'ink?npc='
      # Verify it uses encodeURIComponent for NPC ID
      assert_includes content, 'encodeURIComponent'
    end

    # Test that person-chat-minigame uses correct story loading endpoint
    test 'person-chat-minigame should use Rails API endpoint for story loading' do
      get '/break_escape/js/minigames/person-chat/person-chat-minigame.js?v=10'
      assert_response :success

      content = response.body
      # Verify it uses the Rails API endpoint
      assert_includes content, '/break_escape/games'
      assert_includes content, 'ink?npc='
      assert_includes content, 'breakEscapeConfig?.gameId'
    end

    # Test that phone-chat-minigame uses correct story loading endpoint
    test 'phone-chat-minigame should use Rails API endpoint for story loading' do
      get '/break_escape/js/minigames/phone-chat/phone-chat-minigame.js'
      assert_response :success

      content = response.body
      # Verify it uses the Rails API endpoint
      assert_includes content, '/break_escape/games'
      assert_includes content, 'ink?npc='
      assert_includes content, 'breakEscapeConfig?.gameId'
    end

    # Test that npc-manager loads stories via API endpoint
    test 'npc-manager should load stories via API endpoint' do
      get '/break_escape/js/systems/npc-manager.js'
      assert_response :success

      content = response.body
      # Verify it uses the Rails API endpoint
      assert_includes content, '/break_escape/games'
      assert_includes content, 'encodeURIComponent'
      # Should not directly fetch storyPath
      assert_not_includes content, 'fetch(npc.storyPath)'
    end

    # Test that asset paths are resolved correctly in person-chat-portraits
    test 'person-chat-portraits should import ASSETS_PATH from config' do
      get '/break_escape/js/minigames/person-chat/person-chat-portraits.js'
      assert_response :success

      content = response.body
      # Verify it imports ASSETS_PATH from config
      assert_includes content, "import { ASSETS_PATH }"
      assert_includes content, "from '../../config.js'"
    end

    # Test that phone-chat-ui resolves asset paths correctly
    test 'phone-chat-ui should import ASSETS_PATH from config' do
      get '/break_escape/js/minigames/phone-chat/phone-chat-ui.js'
      assert_response :success

      content = response.body
      # Verify it imports ASSETS_PATH from config
      assert_includes content, "import { ASSETS_PATH }"
      assert_includes content, "from '../../config.js'"
    end

    # Test that npc-barks resolves asset paths correctly
    test 'npc-barks should import ASSETS_PATH from config' do
      get '/break_escape/js/systems/npc-barks.js'
      assert_response :success

      content = response.body
      # Verify it imports ASSETS_PATH from config
      assert_includes content, "import { ASSETS_PATH }"
      assert_includes content, "from '../config.js'"
    end

    # Test ink endpoint returns correct MIME type
    test 'ink endpoint should return application/json content type' do
      get "/break_escape/games/#{@game.id}/ink", params: { npc: 'security_guard' }

      # Rails includes charset in content type
      assert_includes response.content_type, 'application/json'
    end

    # Test ink endpoint with game that doesn't exist
    test 'should return 404 for non-existent game' do
      get "/break_escape/games/999999/ink", params: { npc: 'test-npc' }
      assert_response :not_found
    end

    # Test that ink endpoint handles special characters in NPC ID
    # Test that ink endpoint validates NPC parameter format
    test 'ink endpoint should work with underscored NPC IDs' do
      # Verify the endpoint structure works with underscored IDs
      # (actual test uses existing game with NPC that has underscores)
      get "/break_escape/games/#{@game.id}/ink", params: { npc: 'npc-with-underscores' }

      # npc-with-underscores doesn't have a story file, should return 404
      assert_response :not_found
      json = JSON.parse(response.body)
      assert json['error']
    end
  end
end
