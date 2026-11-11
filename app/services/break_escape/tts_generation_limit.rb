module BreakEscape
  # Caps how many cache misses (each a paid TTS generation on a server with a
  # key) one game may cause in a rolling window. A clip already in the cache is
  # served without limit and does not count.
  #
  # LIMIT is sized so normal play never reaches it. Every clip the endpoint can
  # generate is a line of the game's own scenario (InkTextValidator and friends
  # never voice request text), so one game can ask for at most about as many
  # clips as its scenario has lines: 1,195 for the largest (m10), 1,048 for m02,
  # under 610 for the rest. 1,500 an hour covers the whole of the largest
  # mission in one hour with room for retries after failed generations.
  #
  # Counts are held per server process (one Rails process per worker), so with
  # several workers a game's real cap is LIMIT times the number of workers.
  class TtsGenerationLimit
    LIMIT = 1_500
    WINDOW = 3_600 # seconds

    @lock = Mutex.new
    @stamps = {}

    class << self
      # Records a generation for game_id and returns true, or returns false
      # (recording nothing) when the game has reached LIMIT in the last WINDOW.
      def allow?(game_id, now: clock)
        @lock.synchronize do
          stamps = recent(game_id, now)
          return false if stamps.length >= LIMIT

          stamps << now
          @stamps[game_id] = stamps
          prune(now) if @stamps.size > 10_000
          true
        end
      end

      # Whole seconds until game_id may generate again (0 if it may now).
      def retry_after(game_id, now: clock)
        @lock.synchronize do
          stamps = recent(game_id, now)
          stamps.length < LIMIT ? 0 : (stamps.first + WINDOW - now).ceil
        end
      end

      # Tests only
      def reset!
        @lock.synchronize { @stamps = {} }
      end

      private

      def recent(game_id, now)
        stamps = @stamps[game_id] || []
        stamps.shift while stamps.any? && stamps.first <= now - WINDOW
        stamps
      end

      def prune(now)
        @stamps.delete_if { |_id, stamps| stamps.empty? || stamps.last <= now - WINDOW }
      end

      def clock
        Process.clock_gettime(Process::CLOCK_MONOTONIC)
      end
    end
  end
end
