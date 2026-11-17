# Read-only: print the size of one game's persisted player_state, for reload growth checks.
#
#   BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/player-state-size.rb <game_id>
#
# Prints JSON: { "game": id, "bytes": n, "keys": { key: bytes, ... } }. Never writes the row.
require 'json'
id = ARGV[0] or abort('usage: player-state-size.rb <game_id>')
ps = BreakEscape::Game.find(id).player_state || {}
keys = ps.each_with_object({}) { |(k, v), h| h[k] = v.to_json.bytesize }
puts({ game: id.to_i, bytes: ps.to_json.bytesize, keys: keys }.to_json)
