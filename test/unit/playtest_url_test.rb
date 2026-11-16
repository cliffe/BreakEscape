require 'test_helper'
require Rails.root.join('../../tools/playtest/lib/playtest_url').to_s

# tools/playtest/new-game.rb prints the game's URL on the caller's PLAYTEST_PORT,
# and never a guessed :3000 (the user's own server) when the port is not set.
class PlaytestUrlTest < ActiveSupport::TestCase
  test 'the URL uses PLAYTEST_PORT' do
    assert_equal ['URL=http://127.0.0.1:3496/break_escape/games/42'], PlaytestUrl.lines(42, '3496')
  end

  test 'with no port there is no URL line, only the path and a note' do
    [nil, '', '  ', 'abc'].each do |port|
      out = PlaytestUrl.lines(42, port)
      assert_includes out, 'URL_PATH=/break_escape/games/42'
      assert out.none? { |l| l.start_with?('URL=') }, "no URL= line for #{port.inspect}"
      assert out.none? { |l| l.include?('127.0.0.1:3000') }
      assert out.any? { |l| l.start_with?('URL_NOTE=') && l.include?('PLAYTEST_PORT') }
    end
  end

  test 'new-game.rb prints through the helper, not a :3000 fallback' do
    src = File.read(Rails.root.join('../../tools/playtest/new-game.rb'))
    assert_includes src, "PlaytestUrl.lines(g.id, ENV['PLAYTEST_PORT'])"
    refute_match(/fetch\('PLAYTEST_PORT', '3000'\)/, src)
  end
end
