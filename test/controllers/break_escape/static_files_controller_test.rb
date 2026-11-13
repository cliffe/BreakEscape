require 'test_helper'

module BreakEscape
  class StaticFilesControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    # CSS file serving tests
    test 'CSS: should serve files with correct MIME type' do
      get '/break_escape/css/hud.css'
      assert_response :success
      assert_equal 'text/css', response.content_type
    end

    test 'CSS: should serve with inline disposition' do
      get '/break_escape/css/hud.css'
      assert_response :success
      assert_match /inline/, response.headers['Content-Disposition']
    end

    test 'CSS: should return 404 for non-existent files' do
      get '/break_escape/css/non-existent.css'
      assert_response :not_found
    end

    # JavaScript file serving tests
    test 'JS: should serve files with correct MIME type' do
      get '/break_escape/js/main.js'
      assert_response :success
      assert_equal 'application/javascript', response.content_type
    end

    test 'JS: should serve nested files' do
      get '/break_escape/js/utils/constants.js'
      assert_response :success
      assert_equal 'application/javascript', response.content_type
    end

    test 'JS: should serve core game module' do
      get '/break_escape/js/core/game.js'
      assert_response :success
      assert_equal 'application/javascript', response.content_type
    end

    test 'JS: should return 404 for non-existent files' do
      get '/break_escape/js/non-existent.js'
      assert_response :not_found
    end

    # Asset file serving tests
    test 'Assets: should serve audio with correct MIME type' do
      get '/break_escape/assets/sounds/lockpick_binding.mp3'
      assert_response :success
      assert_equal 'audio/mpeg', response.content_type
    end

    test 'Assets: should serve PNG tiles with correct MIME type' do
      get '/break_escape/assets/tiles/door_32.png'
      assert_response :success
      assert_equal 'image/png', response.content_type
    end

    test 'Assets: should serve nested files' do
      get '/break_escape/assets/tiles/door_32.png'
      assert_response :success
      assert_equal 'image/png', response.content_type
    end

    test 'Assets: should return 404 for non-existent files' do
      get '/break_escape/assets/sounds/non-existent.mp3'
      assert_response :not_found
    end

    # HTML test page serving tests
    test 'HTML: should serve test files with correct MIME type' do
      get '/break_escape/test-assets.html'
      assert_response :success
      assert_equal 'text/html', response.content_type
    end

    test 'HTML: should return 404 for non-existent files' do
      get '/break_escape/non-existent.html'
      assert_response :not_found
    end

    # Route parameter capture tests
    test 'Routes: should capture full filename with extension' do
      get '/break_escape/css/hud.css'
      assert_response :success
    end

    test 'Routes: should capture complex paths with segments' do
      get '/break_escape/js/utils/constants.js'
      assert_response :success
    end

    test 'Routes: should handle files with multiple dots' do
      get '/break_escape/assets/tiles/door_sheet_32.png'
      assert_response :success
      assert_equal 'image/png', response.content_type
    end

    # Security tests - directory traversal
    test 'Security: should prevent directory traversal in CSS' do
      get '/break_escape/css/../../config/database.yml'
      assert_response :not_found
    end

    test 'Security: should prevent directory traversal in JS' do
      get '/break_escape/js/../../config/secrets.yml'
      assert_response :not_found
    end

    test 'Security: should prevent directory traversal in assets' do
      get '/break_escape/assets/../../config/database.yml'
      assert_response :not_found
    end

    # Phaser asset configuration
    test 'Phaser: main JS imports GAME_CONFIG' do
      get '/break_escape/js/main.js'
      assert_response :success
      assert_includes response.body, 'GAME_CONFIG'
    end

    test 'Phaser: constants define GAME_CONFIG with baseURL' do
      get '/break_escape/js/utils/constants.js'
      assert_response :success
      content = response.body
      assert_includes content, 'GAME_CONFIG'
      assert_includes content, 'baseURL'
      assert_includes content, '/break_escape/assets'
    end

    test 'Phaser: game.js has asset references without prefix' do
      get '/break_escape/js/core/game.js'
      assert_response :success
      content = response.body
      assert_includes content, 'this.load.audio'
      assert content.include?('sounds/'), "Should reference sounds without assets/ prefix"
    end

    # File integrity tests
    test 'Integrity: CSS files are non-empty' do
      get '/break_escape/css/hud.css'
      assert_response :success
      assert response.body.length > 0
    end

    test 'Integrity: JavaScript files are non-empty' do
      get '/break_escape/js/main.js'
      assert_response :success
      assert response.body.length > 0
    end

    test 'Integrity: audio files are non-empty' do
      get '/break_escape/assets/sounds/lockpick_binding.mp3'
      assert_response :success
      assert response.body.length > 0
    end

    test 'Integrity: image files are non-empty' do
      get '/break_escape/assets/tiles/door_32.png'
      assert_response :success
      assert response.body.length > 0
    end

    # Response header tests
    test 'Headers: should include Cache-Control' do
      get '/break_escape/css/hud.css'
      assert_response :success
      assert response.headers['Cache-Control']
    end

    test 'Headers: should set Content-Disposition to inline' do
      get '/break_escape/css/hud.css'
      assert_response :success
      assert_match /inline/, response.headers['Content-Disposition']
    end

    test 'Headers: should include Content-Length' do
      get '/break_escape/css/hud.css'
      assert_response :success
      assert response.headers['Content-Length']
    end

    # Minigame asset loading tests
    test 'Minigame: should serve lockpicking script' do
      get '/break_escape/js/minigames/lockpicking/lockpicking-game-phaser.js'
      assert_response :success
      assert_equal 'application/javascript', response.content_type
    end

    test 'Minigame: should serve lockpicking sounds' do
      sounds = ['lockpick_binding.mp3', 'lockpick_click.mp3', 'lockpick_success.mp3']
      sounds.each do |sound|
        get "/break_escape/assets/sounds/#{sound}"
        assert_response :success, "Failed to serve #{sound}"
        assert_equal 'audio/mpeg', response.content_type
      end
    end
  end
end
