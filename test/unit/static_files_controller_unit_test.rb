require 'test_helper'

module BreakEscape
  class StaticFilesControllerUnitTest < ActiveSupport::TestCase
    # Test the content type determination logic in isolation

    setup do
      @controller = StaticFilesController.new
    end

    test 'determines CSS content type' do
      content_type = @controller.send(:determine_content_type, '/path/to/file.css')
      assert_equal 'text/css', content_type
    end

    test 'determines JavaScript content type' do
      content_type = @controller.send(:determine_content_type, '/path/to/file.js')
      assert_equal 'application/javascript', content_type
    end

    test 'determines HTML content type' do
      content_type = @controller.send(:determine_content_type, '/path/to/file.html')
      assert_equal 'text/html', content_type
    end

    test 'determines JSON content type' do
      content_type = @controller.send(:determine_content_type, '/path/to/file.json')
      assert_equal 'application/json', content_type
    end

    test 'determines PNG content type' do
      content_type = @controller.send(:determine_content_type, '/path/to/file.png')
      assert_equal 'image/png', content_type
    end

    test 'determines JPEG content type' do
      content_type = @controller.send(:determine_content_type, '/path/to/file.jpg')
      assert_equal 'image/jpeg', content_type
    end

    test 'determines GIF content type' do
      content_type = @controller.send(:determine_content_type, '/path/to/file.gif')
      assert_equal 'image/gif', content_type
    end

    test 'determines SVG content type' do
      content_type = @controller.send(:determine_content_type, '/path/to/file.svg')
      assert_equal 'image/svg+xml', content_type
    end

    test 'determines MP3 content type' do
      content_type = @controller.send(:determine_content_type, '/path/to/file.mp3')
      assert_equal 'audio/mpeg', content_type
    end

    test 'determines WAV content type' do
      content_type = @controller.send(:determine_content_type, '/path/to/file.wav')
      assert_equal 'audio/wav', content_type
    end

    test 'determines OGG content type' do
      content_type = @controller.send(:determine_content_type, '/path/to/file.ogg')
      assert_equal 'audio/ogg', content_type
    end

    test 'determines WOFF font content type' do
      content_type = @controller.send(:determine_content_type, '/path/to/font.woff')
      assert_equal 'font/woff', content_type
    end

    test 'determines WOFF2 font content type' do
      content_type = @controller.send(:determine_content_type, '/path/to/font.woff2')
      assert_equal 'font/woff2', content_type
    end

    test 'determines TTF font content type' do
      content_type = @controller.send(:determine_content_type, '/path/to/font.ttf')
      assert_equal 'font/ttf', content_type
    end

    test 'is case insensitive' do
      content_type = @controller.send(:determine_content_type, '/path/to/FILE.CSS')
      assert_equal 'text/css', content_type

      content_type = @controller.send(:determine_content_type, '/path/to/FILE.JS')
      assert_equal 'application/javascript', content_type

      content_type = @controller.send(:determine_content_type, '/path/to/FILE.PNG')
      assert_equal 'image/png', content_type
    end

    test 'handles multiple dots in filename' do
      # Files like door_sheet_32.png should work
      content_type = @controller.send(:determine_content_type, '/path/to/door_sheet_32.png')
      assert_equal 'image/png', content_type

      content_type = @controller.send(:determine_content_type, '/path/to/lockpick_binding.mp3')
      assert_equal 'audio/mpeg', content_type
    end

    test 'returns octet-stream for unknown extensions' do
      content_type = @controller.send(:determine_content_type, '/path/to/file.unknown')
      assert_equal 'application/octet-stream', content_type
    end
  end
end
