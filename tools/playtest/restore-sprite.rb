# Undo the temporary sprite switch new-game.rb made for a sprite-restricted mission.
#
#   BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/restore-sprite.rb <game_id>
#
# Reads tools/playtest/sprite-restore-<game_id>.txt (pref id, sprite we set, original).
# Restores the original only if the preference still holds the sprite we set, so a
# change made by someone else in the meantime is left alone. No file means nothing to do.
gid = ARGV[0] or abort 'usage: restore-sprite.rb <game_id>'
f = File.join(__dir__, "sprite-restore-#{gid}.txt")
exit unless File.exist?(f)
id, set, orig = File.read(f).chomp.split("\t", 3)
pref = BreakEscape::PlayerPreference.find_by(id: id)
if pref && pref.read_attribute(:selected_sprite) == set
  pref.update_column(:selected_sprite, orig.to_s.empty? ? nil : orig)
  puts "sprite restored to #{orig.inspect}"
end
File.delete(f)
