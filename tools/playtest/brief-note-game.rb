# Test only: create two games on a host mission whose stored scenarios differ only in whether they
# carry a `scenario_brief`, so the live proof can show the REAL client path (introduceScenario,
# helpers.js) adding a "Mission Brief" note to the Notepad only when a brief is present (commit
# eb42245bc). The scenarios are held in memory, not files: no Mission row is created.
#
#   BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/brief-note-game.rb <host_mission>
#
# Prints BRIEF_GAME_ID=<id> and NO_BRIEF_GAME_ID=<id>. Aborts if the Mission count moves.
require 'json'

host_name = ARGV[0] or abort 'usage: brief-note-game.rb <host_mission>'
missions_before = BreakEscape::Mission.count
host = BreakEscape::Mission.find_by(name: host_name) or abort "no mission '#{host_name}'"

def base_scenario
  {
    'startRoom' => 'office',
    'formatVersion' => BreakEscape::FormatUpgrade.current,
    'show_scenario_brief' => 'always',
    'rooms' => {
      'office' => {
        'type' => 'room_office', 'name' => 'Office', 'locked' => false,
        'connections' => {}, 'objects' => [], 'npcs' => []
      }
    }
  }
end

def make_game(host, scenario)
  player = BreakEscape::DemoUser.first || BreakEscape::DemoUser.create!(username: 'playtest')
  g = BreakEscape::Game.new(player: player, mission: host)
  g.player_state = { BreakEscape::CarryOver::OVERRIDES_KEY => {} }
  g.save!
  g.scenario_data = scenario
  g.save!
  g.id
end

brief = base_scenario
brief['scenario_brief'] = 'Get into the office, find the drive, and get out before the shift changes.'
brief_id = make_game(host, brief)

no_brief_id = make_game(host, base_scenario) # no scenario_brief key at all

abort 'refusing to run: a Mission row was created' unless BreakEscape::Mission.count == missions_before

puts "BRIEF_GAME_ID=#{brief_id}"
puts "NO_BRIEF_GAME_ID=#{no_brief_id}"
