# frozen_string_literal: true

# Plant hiding (docs/achitechture/PLANT_HIDING_PLAN.md section 9). One entry point,
# check_plant_hiding, called by scripts/validate_scenario.rb. The plant rule and the decor list
# come from BreakEscape::HidingSpots, which the server shares.
require 'json'
require_relative '../lib/break_escape/hiding_spots'

PLANT_HIDING_JS = 'public/break_escape/js/systems/plant-hiding.js'

# The texture prefixes PLANT_ANCHORS measures, read from the client file so the two cannot drift.
def plant_hiding_anchor_prefixes(repo_root)
  path = File.join(repo_root, PLANT_HIDING_JS)
  return [] unless File.exist?(path)

  body = File.read(path)[/export const PLANT_ANCHORS = \{(.*?)\n\};/m, 1].to_s
  body.scan(/^\s*'([^']+)'\s*:/).flatten
end

# room type -> map file, from the loader in game.js (the same table validate_scenario.rb reads).
def plant_hiding_tilemaps(repo_root)
  game_js = File.join(repo_root, 'public/break_escape/js/core/game.js')
  return {} unless File.exist?(game_js)

  File.read(game_js).scan(/tilemapTiledJSON\('([^']+)',\s*'rooms\/([^']+)'\)/).to_h
end

def plant_hiding_texture?(repo_root, key)
  return false if key.to_s.empty?

  dir = File.join(repo_root, 'public/break_escape/assets/objects')
  File.exist?(File.join(dir, "#{key}.png")) || !Dir.glob(File.join(dir, "#{key}[0-9]*.png")).empty?
end

# Every { 'planted' => id, 'on' => ... } proof hash, wherever it sits.
def plant_hiding_proofs(node, out = [])
  case node
  when Hash
    out << node if node['planted'].is_a?(String) && node.key?('on')
    node.each_value { |v| plant_hiding_proofs(v, out) }
  when Array
    node.each { |v| plant_hiding_proofs(v, out) }
  end
  out
end

def check_plant_hiding(json_data, repo_root)
  issues = []
  return issues unless json_data.is_a?(Hash) && json_data['rooms'].is_a?(Hash)

  hs = BreakEscape::HidingSpots
  err = ->(msg) { issues << "❌ ERROR: plant hiding: #{msg}" }
  warn = ->(msg) { issues << "⚠️ WARNING: plant hiding: #{msg}" }

  defs = hs.item_defs(json_data)
  rooms = json_data['rooms']
  objects_of = ->(room_id) { Array(rooms.dig(room_id, 'objects')).select { |o| o.is_a?(Hash) } }
  all_objects = rooms.keys.flat_map { |rid| objects_of.call(rid).map { |o| [rid, o] } }
  type_map = plant_hiding_tilemaps(repo_root)
  anchors = plant_hiding_anchor_prefixes(repo_root)

  decor_of = lambda do |room_id|
    type = rooms.dig(room_id, 'type')
    file = type_map[type]
    path = file && File.join(repo_root, 'public/break_escape/assets/rooms', file)
    map = path && File.exist?(path) ? (JSON.parse(File.read(path)) rescue nil) : nil
    hs.decor_spots(map, room_id, json_data)
  end

  # Objects that declare hiddenWith.
  all_objects.each do |rid, obj|
    next unless obj.key?('hiddenWith')

    label = "object '#{obj['id']}' (room '#{rid}')"
    item = defs[obj['hiddenWith']]
    err.call("#{label} has hiddenWith '#{obj['hiddenWith']}', which is not an item with a hideable block.") unless item
    err.call("#{label} has hiddenWith and 'position'. It is drawn only as the overlay on a plant; remove position.") if obj.key?('position')
    err.call("#{label} has hiddenWith and 'revealOnGlobal'. That was the old pairing; the hide sets the globals through onHidden.") if obj.key?('revealOnGlobal')
  end

  defs.each do |item_id, defn|
    label = "item '#{item_id}'"
    listed = defn['rooms']
    err.call("#{label} hideable.rooms is empty.") if listed.empty?
    listed.each { |rid| err.call("#{label} hideable.rooms names '#{rid}', which is not a room in this scenario.") unless rooms.key?(rid) }
    listed = listed.select { |rid| rooms.key?(rid) }

    # Spots per listed room: scenario objects (by the plant rule, hidingSpot, spots, exclude) plus decor.
    eligible = {}
    named_pool = {}
    listed.each do |rid|
      scenario_spots = objects_of.call(rid).select { |o| hs.spot_object?(o) && hs.listed?(defn, o['id'].to_s) }
      decor = decor_of.call(rid)
      decor_ok = decor.select { |d| hs.listed?(defn, d[:id]) }
      eligible[rid] = scenario_spots.map { |o| { id: o['id'].to_s, key: (o['sprite'].to_s.empty? ? o['type'] : o['sprite']).to_s, obj: o } } +
                      decor_ok.map { |d| { id: d[:id], key: d[:image], obj: nil } }
      # Ids a scenario may legitimately name: any scenario spot by shape (even one opted out) and all decor.
      named_pool[rid] = objects_of.call(rid).select { |o| o['hidingSpot'] == true || hs.plant_family_key?(o['sprite'].to_s.empty? ? o['type'] : o['sprite']) }.map { |o| o['id'].to_s } +
                        decor.map { |d| d[:id] }
      err.call("#{label} has no eligible hiding spot in room '#{rid}' after spots, exclude and hidingSpot. The device could never be hidden there.") if eligible[rid].empty?
    end

    pool = named_pool.values.flatten
    { 'spots' => (defn['spots'].is_a?(Array) ? defn['spots'] : []), 'exclude' => defn['exclude'], 'spotAt' => defn['spotAt'].keys }.each do |field, ids|
      ids.each do |sid|
        err.call("#{label} hideable.#{field} names '#{sid}', which is not a plant or hidingSpot object, or a hideable decor plant, in a listed room (small plants are not default spots).") unless pool.include?(sid)
      end
    end

    # The device object.
    if defn['device']
      found = all_objects.find { |_, o| o['id'].to_s == defn['device'] }
      if found.nil?
        err.call("#{label} hideable.device '#{defn['device']}' names no object.")
      else
        rid, dev = found
        err.call("#{label} hideable.device '#{defn['device']}' has hiddenWith #{dev['hiddenWith'].inspect}; it must be '#{item_id}'.") unless dev['hiddenWith'] == item_id
        err.call("#{label} hideable.device '#{defn['device']}' is declared in room '#{rid}', outside hideable.rooms.") unless defn['rooms'].include?(rid)
      end
    end

    # The overlay texture.
    sprite = defn['overlay']['sprite']
    err.call("#{label} hideable.overlay.sprite '#{sprite}' has no texture in assets/objects/.") unless plant_hiding_texture?(repo_root, sprite)

    # Old path and carried spots.
    all_objects.each do |rid, obj|
      names = Array(obj['requiresItem'])
      err.call("object '#{obj['id']}' (room '#{rid}') has requiresItem '#{item_id}'. A hideable item is planted only through the hide flow; the server refuses the old path.") if names.include?(item_id)
    end
    eligible.each do |rid, spots|
      spots.each do |sp|
        obj = sp[:obj]
        next unless obj

        err.call("hiding spot '#{sp[:id]}' (room '#{rid}') is takeable. A spot that can be carried away would leave its overlay behind.") if obj['takeable']
        err.call("hiding spot '#{sp[:id]}' (room '#{rid}') has needsTag, which lets an office-life NPC carry it away from its overlay.") if obj['needsTag']
        warn.call("hiding spot '#{sp[:id]}' (room '#{rid}') has authored actions. Its action menu opens before the hide flow.") if obj['actions']
        next if obj['hideAt'] || defn['overlay']['at'] || defn['spotAt'].key?(sp[:id])

        warn.call("hiding spot '#{sp[:id]}' (texture '#{sp[:key]}') has no PLANT_ANCHORS entry and the item has no overlay.at, so the overlay falls back to 50, 60.") unless anchors.any? { |a| sp[:key].start_with?(a) }
      end
      next if spots.empty?

      decor_missing = spots.reject { |sp| sp[:obj] || defn['overlay']['at'] || defn['spotAt'].key?(sp[:id]) || anchors.any? { |a| sp[:key].start_with?(a) } }
      decor_missing.each do |sp|
        warn.call("hiding spot '#{sp[:id]}' (texture '#{sp[:key]}') has no PLANT_ANCHORS entry and the item has no overlay.at, so the overlay falls back to 50, 60.")
      end
    end

    # Lighting: the LED needs an emitter for the device in each listed room.
    if defn['device']
      listed.each do |rid|
        emitters = rooms.dig(rid, 'lighting', 'emitters')
        warn.call("#{label}: room '#{rid}' has no lighting.emitters entry for '#{defn['device']}', so the LED would not show.") unless emitters.is_a?(Hash) && emitters.key?(defn['device'])
      end
    end

    # Planted proofs with `on`.
    plant_hiding_proofs(json_data).each do |proof|
      next unless proof['planted'] == item_id

      warn.call("a planted proof for '#{item_id}' has on '#{proof['on']}', which pins one plant. Drop `on` to accept any spot.")
    end
  end
  issues.uniq
end
