require 'test_helper'

module BreakEscape
  class AssetLoadingIntegrationTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    test 'should load all required game files in correct order' do
      get '/break_escape/js/main.js'
      assert_response :success
      assert_includes response.body, 'GAME_CONFIG'
    end

    test 'should load GAME_CONFIG with proper baseURL' do
      get '/break_escape/js/utils/constants.js'
      assert_response :success
      content = response.body
      assert_match /export const GAME_CONFIG/, content
      assert_match /baseURL/, content
      assert_match /\/break_escape\/assets/, content
    end

    test 'CSS files should be accessible from main game' do
      get '/break_escape/css/hud.css'
      assert_response :success
      assert_equal 'text/css', response.content_type
    end

    test 'should serve game core with asset references' do
      get '/break_escape/js/core/game.js'
      assert_response :success
      content = response.body
      assert_includes content, 'preload'
      assert_includes content, 'this.load'
    end

    test 'should serve sound manager module' do
      get '/break_escape/js/systems/sound-manager.js'
      assert_response :success
      assert_equal 'application/javascript', response.content_type
    end

    test 'should serve minigame starters' do
      get '/break_escape/js/systems/minigame-starters.js'
      assert_response :success
      assert_equal 'application/javascript', response.content_type
    end

    test 'should serve lockpicking minigame' do
      get '/break_escape/js/minigames/lockpicking/lockpicking-game-phaser.js'
      assert_response :success
      assert_equal 'application/javascript', response.content_type
      content = response.body
      assert_match /baseURL/, content
    end

    test 'complete asset loading path for lockpicking' do
      get '/break_escape/js/minigames/lockpicking/lockpicking-game-phaser.js'
      assert_response :success

      lockpick_sounds = [
        'lockpick_binding.mp3',
        'lockpick_click.mp3',
        'lockpick_overtension.mp3',
        'lockpick_reset.mp3',
        'lockpick_set.mp3',
        'lockpick_success.mp3',
        'lockpick_tension.mp3',
        'lockpick_wrong.mp3'
      ]

      lockpick_sounds.each do |sound|
        get "/break_escape/assets/sounds/#{sound}"
        assert_response :success, "Lockpick sound not found: #{sound}"
        assert_equal 'audio/mpeg', response.content_type
      end

      get '/break_escape/assets/tiles/door_32.png'
      assert_response :success
      assert_equal 'image/png', response.content_type
    end

    test 'route constraints correctly capture file extensions' do
      files_to_test = [
        '/break_escape/css/hud.css',
        '/break_escape/js/main.js',
        '/break_escape/assets/tiles/door_32.png',
        '/break_escape/assets/sounds/lockpick_binding.mp3'
      ]

      files_to_test.each do |file_path|
        get file_path
        assert_response :success, "Failed to load file with extension: #{file_path}"
      end
    end

    test 'baseURL prevents duplicate asset paths' do
      get '/break_escape/js/utils/constants.js'
      assert_response :success
      content = response.body
      assert !content.include?('assets/assets'), "Should not have duplicate assets/ prefix"
    end

    test 'asset paths work without assets prefix in load calls' do
      get '/break_escape/js/core/game.js'
      assert_response :success
      content = response.body
      assert_match /this\.load\.audio\(['"][\w_]+['"],\s*['"]sounds\//, content
    end

    test 'security: cannot access files outside break_escape directory' do
      get '/break_escape/css/../../config/secrets.yml'
      assert_response :not_found

      get '/break_escape/js/../../config/database.yml'
      assert_response :not_found

      get '/break_escape/assets/../../config/secrets.yml'
      assert_response :not_found
    end

    test 'all response headers are correct' do
      [
        '/break_escape/css/hud.css',
        '/break_escape/js/main.js',
        '/break_escape/assets/sounds/lockpick_binding.mp3'
      ].each do |path|
        get path
        assert_response :success
        assert response.headers['Content-Type'], "Missing Content-Type for #{path}"
        assert_match /inline/, response.headers['Content-Disposition']
        assert response.headers['Content-Length']
      end
    end

    test 'test asset page loads correctly' do
      get '/break_escape/test-assets.html'
      assert_response :success
      assert_equal 'text/html', response.content_type
      assert_includes response.body, 'Asset Loading Test'
    end

    test 'should serve door tile image' do
      get '/break_escape/assets/tiles/door.png'
      assert_response :success
      assert_equal 'image/png', response.content_type
      assert response.body.length > 0, 'Door image should not be empty'
    end

    test 'should serve key-operations minigame module' do
      get '/break_escape/js/minigames/lockpicking/key-operations.js'
      assert_response :success
      assert_equal 'application/javascript', response.content_type
      assert_includes response.body, 'KeyOperations'
      assert_includes response.body, 'this.parent.startWithKeySelection'
    end
  end
end
