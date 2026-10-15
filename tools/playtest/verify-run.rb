# Dumps the server-side truth about a playtest game, so a report can be checked
# against what the game actually recorded rather than against itself.
#
# A playtest report is written by an agent and proves nothing on its own. This
# reads the persisted player_state: if the report claims the player reached the
# server room and this says one unlocked room and the starting inventory, the
# report is fiction. Run it after every playtest and paste the output into the
# report.
#
#   BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id>
#
# Exit status is 1 when the game shows no progress at all, so a fabricated run
# fails rather than merely looking odd.

game_id = ARGV[0] or abort 'usage: verify-run.rb <game_id>'
g = BreakEscape::Game.find(game_id)
ps = g.player_state || {}

inv     = (ps['inventory'] || []).map { |i| i.is_a?(Hash) ? (i['name'] || i['id']) : i }
rooms   = ps['unlockedRooms'] || []
objects = ps['unlockedObjects'] || []
flags   = ps['submitted_flags'] || []
globals = (ps['globalVariables'] || {}).select { |_, v| v == true || v.is_a?(String) }
npcs    = ps['encounteredNPCs'] || []

puts "game            #{g.id}  (mission #{g.mission_id})"
puts "created         #{g.created_at}"
puts "last write      #{g.updated_at}"
puts "played for      #{(g.updated_at - g.created_at).round}s of wall clock"
puts "current room    #{ps['currentRoom'].inspect}"
puts "unlocked rooms  #{rooms.length}: #{rooms.join(', ')}"
puts "unlocked objs   #{objects.length}: #{objects.join(', ')}"
puts "inventory       #{inv.length}: #{inv.join(', ')}"
puts "NPCs met        #{npcs.length}: #{npcs.join(', ')}"
puts "flags submitted #{flags.length}: #{flags.join(', ')}"
puts "globals set     #{globals.length}: #{globals.keys.sort.join(', ')}"

# What counts as evidence of play. Rooms and NPCs are seeded at creation for
# some missions, and the opening cutscene sets several globals before the
# player has done anything, so neither is proof. Only these can happen by
# playing: leaving the starting room, opening something, or submitting a flag.
signals = {
  'rooms beyond the first' => rooms.length - 1,
  'objects unlocked' => objects.length,
  'flags submitted' => flags.length
}
played = signals.values.sum

puts
if g.updated_at <= g.created_at + 1
  puts 'VERDICT: NO PROGRESS RECORDED — the game was never written to.'
  puts 'Any report claiming steps against it is unsupported.'
  exit 1
elsif played.zero?
  puts "VERDICT: BOOTSTRAP ONLY — #{signals.map { |k, v| "#{v} #{k}" }.join(', ')}."
  puts 'Nothing here could only have come from playing: the player never left'
  puts 'the starting room, opened anything, or submitted a flag. Globals and'
  puts 'encountered NPCs are set by mission setup and the opening cutscene, so'
  puts 'they are not evidence. A report claiming steps is unsupported.'
  exit 1
end
puts "VERDICT: progress recorded — #{signals.map { |k, v| "#{v} #{k}" }.join(', ')}."
puts 'Cross-check the specifics above against the report.'
