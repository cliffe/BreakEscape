# Marks every room unlocked for one game, so a visual tour can load locked rooms.
# For throwaway screenshot games only: it changes that game's saved state.
#
#   BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/unlock-all-rooms.rb <game_id>
g = BreakEscape::Game.find(ARGV[0].to_i)
ids = g.scenario_data['rooms'].keys
g.player_state['unlockedRooms'] = ((g.player_state['unlockedRooms'] || []) + ids).uniq
g.save!
puts "unlocked #{ids.size} rooms for game #{g.id}"
