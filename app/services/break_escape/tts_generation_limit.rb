module BreakEscape
  # Caps how many cache misses (each a paid TTS generation on a server with a
  # key) one game may cause in a rolling window. A clip already in the cache is
  # served without limit and does not count.
  #
  # LIMIT is sized so normal play never reaches it. Every clip the endpoint can
  # generate is a line of the game's own scenario, voiced only by its own
  # speaker (TtsLineResolver), so one game can ask for at most the scenario's
  # reachable clips: the batch's lines, the untagged form of each tagged line,
  # barks, chatter, Narrator: lines of every story and lines the walker can't
  # place. That is 1,274 for the largest (m10), 1,145 for m02, under 640 for
  # the rest (2026-11-11). 1,500 an hour covers the whole of the largest
  # mission in one hour with room for retries after failed generations. A
  # clip once generated is cached for every game, so across all games a
  # mission costs at most its reachable clips once per voice.
  #
  # Counts are held per server process (one Rails process per worker), so with
  # several workers a game's real cap is LIMIT times the number of workers.
  class TtsGenerationLimit
    LIMIT = 1_500
    WINDOW = 3_600 # seconds
    # How often (seconds) an allowed call drops the stamps of games idle for a
    # whole WINDOW, so memory follows the games active in the last hour
    PRUNE_EVERY = 60

    @lock = Mutex.new
    @stamps = {}
    @pruned_at = nil

    class << self
      # Records a generation for game_id and returns true, or returns false
      # (recording nothing) when the game has reached LIMIT in the last WINDOW.
      def allow?(game_id, now: clock)
        @lock.synchronize do
          stamps = recent(game_id, now)
          return false if stamps.length >= LIMIT

          stamps << now
          @stamps[game_id] = stamps
          prune(now) if @pruned_at.nil? || now - @pruned_at >= PRUNE_EVERY
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
        @lock.synchronize do
          @stamps = {}
          @pruned_at = nil
        end
      end

      # Tests only: games with stamps held
      def tracked_games
        @lock.synchronize { @stamps.size }
      end

      private

      def recent(game_id, now)
        stamps = @stamps[game_id] || []
        stamps.shift while stamps.any? && stamps.first <= now - WINDOW
        stamps
      end

      def prune(now)
        @pruned_at = now
        @stamps.delete_if { |_id, stamps| stamps.empty? || stamps.last <= now - WINDOW }
      end

      def clock
        Process.clock_gettime(Process::CLOCK_MONOTONIC)
      end
    end
  end
end
