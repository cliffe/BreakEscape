# Loaded with `ruby -r` before tools/playtest/verify-run.rb so it runs without Rails or a database.
# STUB_FLAGS is a comma list of submitted flags; STUB_CREATED_AGO is seconds of play.
module BreakEscape
  class Game
    def self.find(id)
      new
    end

    def id; 1; end
    def mission_id; 'stub'; end
    def created_at; Time.at(1_000_000); end
    def updated_at; Time.at(1_000_100); end
    def tasks_completed; 0; end
    def score; 0; end
    def scenario_data; {}; end

    def player_state
      { 'currentRoom' => 'r1', 'unlockedRooms' => %w[r1 r2], 'unlockedObjects' => [], 'inventory' => [],
        'submitted_flags' => ENV.fetch('STUB_FLAGS', '').split(','), 'globalVariables' => {}, 'encounteredNPCs' => [] }
    end
  end
end
