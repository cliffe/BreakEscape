require 'test_helper'

module BreakEscape
  class TtsGenerationLimitTest < ActiveSupport::TestCase
    setup { TtsGenerationLimit.reset! }
    teardown { TtsGenerationLimit.reset! }

    test "allows LIMIT generations per game in the window, then refuses" do
      TtsGenerationLimit::LIMIT.times { |i| assert TtsGenerationLimit.allow?(1, now: 1000.0 + i * 0.01) }
      refute TtsGenerationLimit.allow?(1, now: 1100.0)
      # Another game has its own count
      assert TtsGenerationLimit.allow?(2, now: 1100.0)
    end

    test "a refused request is not counted, and the window rolls" do
      TtsGenerationLimit::LIMIT.times { assert TtsGenerationLimit.allow?(7, now: 0.0) }
      5.times { refute TtsGenerationLimit.allow?(7, now: 10.0) }
      assert_equal TtsGenerationLimit::WINDOW - 10, TtsGenerationLimit.retry_after(7, now: 10.0)
      assert TtsGenerationLimit.allow?(7, now: TtsGenerationLimit::WINDOW + 0.5)
      assert_equal 0, TtsGenerationLimit.retry_after(8, now: 0.0)
    end

    test "the limit covers a whole play-through of the largest mission" do
      # Largest scenario line count (m10_full_disclosure, 1,195 batch lines)
      assert_operator TtsGenerationLimit::LIMIT, :>=, 1_195
    end

    test "a game idle for a whole window is dropped by a later call, on a clock not on size" do
      assert TtsGenerationLimit.allow?(1, now: 0.0)
      assert TtsGenerationLimit.allow?(2, now: 30.0)
      assert_equal 2, TtsGenerationLimit.tracked_games
      assert TtsGenerationLimit.allow?(3, now: TtsGenerationLimit::WINDOW + 1.0)
      assert_equal 2, TtsGenerationLimit.tracked_games, "game 1 dropped, game 2 still in its window"
      assert TtsGenerationLimit.allow?(3, now: TtsGenerationLimit::WINDOW + 10.0)
      assert_equal 2, TtsGenerationLimit.tracked_games, "no prune within PRUNE_EVERY"
      assert TtsGenerationLimit.allow?(3, now: TtsGenerationLimit::WINDOW + 30.0 + TtsGenerationLimit::PRUNE_EVERY)
      assert_equal 1, TtsGenerationLimit.tracked_games
    end
  end
end
