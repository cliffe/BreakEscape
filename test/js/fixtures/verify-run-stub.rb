# Loaded with `ruby -r` before tools/playtest/verify-run.rb so it runs without Rails or a database.
# STUB_FLAGS is a comma list of submitted flags; STUB_CREATED_AGO is seconds of play.
# STUB_PLAYER_STATE is JSON merged into the player state (the access model keys, for example).
require 'json'
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
    # STUB_SCENARIO: JSON scenario data (the habits block reads it). STUB_POSTIT: a comma list
    # of PC ids that show a sticky note. pc_always_locks? follows the server's rule.
    def scenario_data; JSON.parse(ENV.fetch('STUB_SCENARIO', '{}')); end
    def pc_always_locks?(pc, owner); BreakEscape::AccessIdentities.screen_always_locks?(pc, owner); end
    def login_postit_for(pc); ENV.fetch('STUB_POSTIT', '').split(',').include?(pc['id']) ? 'x' : nil; end

    def player_state
      { 'currentRoom' => 'r1', 'unlockedRooms' => %w[r1 r2], 'unlockedObjects' => [], 'inventory' => [],
        'submitted_flags' => ENV.fetch('STUB_FLAGS', '').split(','), 'globalVariables' => {}, 'encounteredNPCs' => [] }
        .merge(JSON.parse(ENV.fetch('STUB_PLAYER_STATE', '{}')))
    end
  end
end
