# bin/rails runner dump_phone_state.rb <game_id> <npc_id>: the server's saved phoneState for one contact
g = BreakEscape::Game.find(ARGV[0])
ps = (g.player_state || {})['phoneState'] || {}
e = ps[ARGV[1]] || (ps['contacts'] || {})[ARGV[1]]
puts JSON.pretty_generate({ keys: ps.keys.first(20), npc: ARGV[1], entry: e })
