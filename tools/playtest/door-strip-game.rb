# Test only: create a game whose stored scenario carries a door entry `requires` the validator
# would reject (a bare PIN door entry), so the live proof can show the RUNTIME strip
# (Game#filter_requires_and_contents_recursive / strip_door_entry_requires!) removing it from the
# real GET /room payload while keeping an rfid entry's card id. The scenario is held in memory, not
# a file: the validator rejects a bare pad-lock door entry (secret-leak M1), so it cannot be a
# corpus scenario, but the engine serves whatever scenario_data a game row holds. This proves the
# server does not rely on the validator alone.
#
#   BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/door-strip-game.rb <host_mission>
#
# Prints GAME_ID=<id>. No db: task, no Mission row created (aborts if the Mission count moves).
require 'json'

host_name = ARGV[0] or abort 'usage: door-strip-game.rb <host_mission>'
missions_before = BreakEscape::Mission.count
host = BreakEscape::Mission.find_by(name: host_name) or abort "no mission '#{host_name}'"

# office reaches the pin vault (north) and the rfid secure room (east). The vault door entry carries
# its own PIN with no lockType (the leak the runtime strip closes); the secure door entry carries the
# card id (kept). Both resolve through NpcHabits.doorway_problem (connections name each direction).
scenario = {
  'startRoom' => 'office',
  'formatVersion' => BreakEscape::FormatUpgrade.current,
  'rooms' => {
    'office' => {
      'type' => 'room_office', 'name' => 'Office',
      'connections' => { 'north' => 'vault', 'east' => 'secure' },
      'doors' => [
        { 'connectedRoom' => 'vault', 'direction' => 'north', 'requires' => '7781' },
        { 'connectedRoom' => 'secure', 'direction' => 'east', 'requires' => 'badge01' }
      ],
      'objects' => [], 'npcs' => []
    },
    'vault' => { 'type' => 'room_office', 'name' => 'Vault', 'locked' => true, 'lockType' => 'pin',
                 'requires' => '7781', 'connections' => { 'south' => 'office' }, 'objects' => [], 'npcs' => [] },
    'secure' => { 'type' => 'room_office', 'name' => 'Secure', 'locked' => true, 'lockType' => 'rfid',
                  'requires' => 'badge01', 'connections' => { 'west' => 'office' }, 'objects' => [], 'npcs' => [] }
  }
}

g = BreakEscape::Game.new(player: BreakEscape::DemoUser.first || BreakEscape::DemoUser.create!(username: 'playtest'),
                          mission: host)
g.player_state = { BreakEscape::CarryOver::OVERRIDES_KEY => {} }
g.save!
g.scenario_data = scenario
g.player_state = { BreakEscape::CarryOver::OVERRIDES_KEY => {} }
g.send(:initialize_player_state)
g.send(:set_scoring_totals)
g.save!

missions_after = BreakEscape::Mission.count
abort "Mission count changed (#{missions_before} -> #{missions_after}): this script must not create missions" if missions_after != missions_before
puts "door-strip game #{g.id}: host #{host.name}, start #{g.player_state['currentRoom']}"
puts "GAME_ID=#{g.id}"
