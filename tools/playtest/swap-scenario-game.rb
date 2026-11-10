# Test only: play a scenario that has no Mission row, by swapping one game's stored scenario.
# (SEAT_BOX_PLAN.md slice 0, review R1 B2; promoted from the seat-box experiment's swap_game.rb.)
#
#   BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/swap-scenario-game.rb \
#       <host_mission> <scenario_dir> [--start-room ROOM_ID] [--unlock-all]
#
# Makes one game of an existing mission (<host_mission>, e.g. test_seating) the way new-game.rb
# does (demo player, carry-over imports "never played"), then replaces THAT game row's
# scenario_data with <scenario_dir>/scenario.json.erb rendered with no VM context, and rebuilds
# its player_state from the new scenario (start room, start items, scoring totals) as a new game
# would. --start-room starts in another room (it is unlocked); --unlock-all unlocks every room,
# as tools/playtest/unlock-all-rooms.rb does. Prints GAME_ID=<id>.
#
# No db: task, no db/seeds.rb, no Mission row: the script checks the Mission count before and
# after and aborts if it changed. <scenario_dir> is a folder name under scenarios/ or a path.
require 'json'
require 'erb'

args = ARGV.dup
start_room = nil
unlock_all = false
rest = []
until args.empty?
  a = args.shift
  case a
  when '--start-room' then start_room = args.shift or abort '--start-room needs a room id'
  when /\A--start-room=(.+)\z/ then start_room = Regexp.last_match(1)
  when '--unlock-all' then unlock_all = true
  else rest << a
  end
end
host_name, scen_arg = rest
abort 'usage: swap-scenario-game.rb <host_mission> <scenario_dir> [--start-room ROOM_ID] [--unlock-all]' unless host_name && scen_arg

missions_before = BreakEscape::Mission.count
host = BreakEscape::Mission.find_by(name: host_name) or abort "no mission '#{host_name}'"
dir = File.directory?(scen_arg) ? scen_arg : File.join('scenarios', scen_arg)
template = File.join(dir, 'scenario.json.erb')
template = File.join(dir, 'scenario.json') unless File.exist?(template)
abort "no scenario.json.erb or scenario.json in #{dir}" unless File.exist?(template)

src = File.read(template)
rendered = template.end_with?('.erb') ? ERB.new(src).result(BreakEscape::Mission::ScenarioBinding.new({}).get_binding) : src
sd = begin
  JSON.parse(rendered)
rescue JSON::ParserError => e
  abort "invalid JSON in #{template} after ERB: #{e.message.lines.first}"
end
rooms = sd['rooms'] || {}
abort "--start-room: no room '#{start_room}' in #{dir}. Rooms: #{rooms.keys.join(', ')}" if start_room && !rooms.key?(start_room)
sd['startRoom'] = start_room if start_room

g = BreakEscape::Game.new(player: BreakEscape::DemoUser.first || BreakEscape::DemoUser.create!(username: 'playtest'),
                          mission: host)
g.player_state = { BreakEscape::CarryOver::OVERRIDES_KEY => {} }
g.save!

# Swap this row's scenario and rebuild its state from it, as a new game of that scenario would.
g.scenario_data = sd
g.player_state = { BreakEscape::CarryOver::OVERRIDES_KEY => {} }
g.send(:initialize_player_state)
g.send(:set_scoring_totals)
if unlock_all
  ps = g.player_state
  ps['unlockedRooms'] = (Array(ps['unlockedRooms']) + rooms.keys).uniq
  g.player_state = ps
end
g.save!

missions_after = BreakEscape::Mission.count
abort "Mission count changed (#{missions_before} -> #{missions_after}): this script must not create missions" if missions_after != missions_before
puts "swapped game #{g.id}: host #{host.name}, scenario #{dir} (#{rooms.size} rooms, start #{g.player_state['currentRoom']}" \
     "#{unlock_all ? ', all rooms unlocked' : ''}); missions #{missions_before} before and after"
puts "GAME_ID=#{g.id}"
