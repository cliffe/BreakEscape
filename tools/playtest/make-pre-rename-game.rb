# Turn a freshly created game back into a pre-rename one.
#
# Games created before the key_id -> opens_lock split still carry the old field
# in their snapshot, and the back-compat fallbacks (window.lockRef,
# BreakEscape::ItemIdentity) exist so those games stay playable. There is no
# way to create such a game any more, so to test that path we make one: create
# a game normally, then rewrite opens_lock back to key_id in its stored data.
#
# This is the inverse of rake break_escape:migrate_key_id, for one game, and it
# exists ONLY so a playtest can prove the fallbacks work. Never run it against
# a game someone is playing, and never in production.
#
#   BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/make-pre-rename-game.rb <game_id>

game_id = ARGV[0]
abort "usage: make-pre-rename-game.rb <game_id>" if game_id.blank?

if Rails.env.production?
  abort "refusing to run in production -- this deliberately writes stale field names"
end

game = BreakEscape::Game.find(game_id)

# Depth-first rename of opens_lock back to key_id. Counts what it touched.
unrename = lambda do |node|
  count = 0
  case node
  when Hash
    if node.key?('opens_lock') && !node.key?('key_id')
      node['key_id'] = node.delete('opens_lock')
      count += 1
    end
    node.each_value { |v| count += unrename.call(v) }
  when Array
    node.each { |v| count += unrename.call(v) }
  end
  count
end

scenario = game.scenario_data.deep_dup
state    = game.player_state.deep_dup
n = unrename.call(scenario) + unrename.call(state)

game.scenario_data = scenario
game.player_state  = state
game.save!(validate: false)

puts "GAME_ID=#{game.id}"
puts "REVERTED_FIELDS=#{n}"
puts "STATE=pre-rename (scenario_data and player_state now use key_id)"
if n.zero?
  puts "WARNING: nothing was reverted -- this mission may define no keys, " \
       "in which case it cannot test the lock fallback."
end
