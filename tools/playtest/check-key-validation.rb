# Ask the server directly whether a game's inventory satisfies each key lock.
#
# This is the server half of a key unlock -- has_key_in_inventory?, the same
# call validate_unlock makes -- isolated from the browser, pathfinding and the
# rest of a playtest. Use it to tell "the player never reached the door" apart
# from "the door refused the key".
#
#   BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/check-key-validation.rb <game_id> [<game_id> ...]

ARGV.each do |gid|
  game = BreakEscape::Game.find(gid)

  fields = (game.scenario_data.to_json.scan(/"(opens_lock|key_id)"/).flatten.uniq)
  puts "=" * 70
  puts "game #{game.id}  (mission #{game.mission_id})  snapshot uses: #{fields.empty? ? 'neither' : fields.join(', ')}"

  # Every key lock the mission defines.
  locks = []
  game.scenario_data['rooms']&.each do |room_id, room|
    next unless room['locked'] && room['requires'].present?
    locks << [room_id, room['lockType'], room['requires']]
  end

  inventory = game.player_state['inventory'] || []
  puts "inventory: #{inventory.map { |i| i['name'] }.join(', ')}"
  puts

  locks.each do |room_id, lock_type, requires|
    unlocked = (game.player_state['unlockedRooms'] || []).include?(room_id)
    if %w[key rfid keycard].include?(lock_type)
      accepted = game.has_key_in_inventory?(requires)
      verdict = accepted ? 'ACCEPTS' : 'REFUSES'
      flag = if accepted && !unlocked
               '   <- server would open it; the run never did'
      elsif !accepted && unlocked
               '   <- UNLOCKED BUT SERVER NOW REFUSES (regression)'
      elsif !accepted
               '   <- server refuses'
      else
               ''
      end
      puts format('  %-22s %-10s requires=%-24s server %s  room_unlocked=%s%s',
                  room_id, lock_type, requires, verdict, unlocked, flag)
    else
      puts format('  %-22s %-10s requires=%-24s (not a key lock)     room_unlocked=%s',
                  room_id, lock_type, requires, unlocked)
    end
  end
  puts
end
