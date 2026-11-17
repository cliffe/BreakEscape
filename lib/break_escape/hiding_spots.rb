# frozen_string_literal: true

require 'json'

module BreakEscape
  # Hiding a planted device in any plant (docs/achitechture/PLANT_HIDING_PLAN.md, sections 3, 4
  # and 7). Pure functions over the scenario hash, with no ActiveSupport, so the validator can
  # require this file on its own (as it requires capture_model.rb).
  #
  # The plant rule is written twice, here and in public/break_escape/js/systems/plant-hiding.js
  # (PLANT_PREFIXES, PLANT_NEVER, isPlantKey). test/unit/hiding_spots_test.rb compares the lists.
  module HidingSpots
    module_function

    PLANT_PREFIXES = %w[
      plant-flat-pot plant-large planter_ planter- fig_plant office-misc-smallplant wilted_plant
    ].freeze
    PLANT_NEVER = %w[plant-large-displacement notes_plantlog m10_sign_plant].freeze

    # Small plants are left out of the default spot rule: the 12x10 tucked device is as wide as
    # their pots. A scenario can still opt one in with hidingSpot: true (spot_object?). A smaller
    # overlay for them is a possible follow-up (integrator decision, 2026-11-17).
    SMALL_PLANT = /\A(?:plant-flat-pot|office-misc-smallplant|plant-large(?:[1-9]|10)(?!\d))/.freeze

    SPOT_ID_PATTERN = /\A[A-Za-z0-9_.\-]+\z/.freeze
    SPOT_ID_MAX = 128

    # Whether a texture key (the image name Tiled gave a decor sprite, or an authored scenario
    # sprite/type) names a plant that is a hiding spot by default (small plants are not).
    def plant_key?(key)
      plant_family_key?(key) && !small_plant_key?(key)
    end

    # Any plant texture, small or not (the client reserves decor items for scenario objects
    # whatever their size, so decor_spots counts reservations over the whole family).
    def plant_family_key?(key)
      key = key.to_s
      return false if key.empty?
      return false if PLANT_NEVER.any? { |bad| key.start_with?(bad) }

      PLANT_PREFIXES.any? { |prefix| key.start_with?(prefix) }
    end

    def small_plant_key?(key)
      key.to_s.match?(SMALL_PLANT)
    end

    # Whether a scenario room object is a hiding spot by shape: hidingSpot false opts out,
    # hidingSpot true opts in, otherwise its authored sprite (or type when it has no sprite) is
    # a plant. Reads the authored fields, never a live texture (spriteVariants can swap it).
    def spot_object?(obj)
      return false unless obj.is_a?(Hash)
      return false if obj['hidingSpot'] == false
      return true if obj['hidingSpot'] == true

      key = obj['sprite'].to_s.empty? ? obj['type'] : obj['sprite']
      plant_key?(key)
    end

    def valid_spot_id?(spot_id)
      spot_id.is_a?(String) && spot_id.length <= SPOT_ID_MAX && spot_id.match?(SPOT_ID_PATTERN)
    end

    # itemId -> normalised hideable definition, for every item with a hideable block, wherever
    # it is declared: startItemsInInventory, each room's objects, nested contents at any depth
    # and each NPC's itemsHeld. The server's scenario copy only.
    def item_defs(scenario)
      out = {}
      return out unless scenario.is_a?(Hash)

      walk = lambda do |list|
        Array(list).each do |obj|
          next unless obj.is_a?(Hash)

          id = obj['id']
          if obj['hideable'].is_a?(Hash) && id.is_a?(String) && !id.empty? && !out.key?(id)
            out[id] = normalise(id, obj)
          end
          walk.call(obj['contents']) if obj['contents'].is_a?(Array)
          walk.call(obj['itemsHeld']) if obj['itemsHeld'].is_a?(Array)
        end
      end
      walk.call(scenario['startItemsInInventory'])
      rooms = scenario['rooms']
      if rooms.is_a?(Hash)
        rooms.each_value do |room|
          next unless room.is_a?(Hash)

          walk.call(room['objects'])
          Array(room['npcs']).each { |npc| walk.call(npc['itemsHeld']) if npc.is_a?(Hash) }
        end
      end
      Array(scenario['npcs']).each { |npc| walk.call(npc['itemsHeld']) if npc.is_a?(Hash) }
      out
    end

    def normalise(id, item)
      block = item['hideable']
      spots = block['spots']
      {
        'id' => id,
        'name' => item['name'].to_s,
        'rooms' => Array(block['rooms']).select { |r| r.is_a?(String) && !r.empty? },
        'spots' => spots.is_a?(Array) ? spots.map(&:to_s) : 'plants',
        'exclude' => Array(block['exclude']).map(&:to_s),
        'device' => block['device'].is_a?(String) ? block['device'] : nil,
        'overlay' => block['overlay'].is_a?(Hash) ? block['overlay'] : {},
        'spotAt' => block['spotAt'].is_a?(Hash) ? block['spotAt'] : {},
        'confirm' => block['confirm'].is_a?(String) ? block['confirm'] : "Hide the #{item['name']} in this plant?",
        'onHidden' => Array(block['onHidden'])
      }
    end

    # The decor id shape: "<roomId>_<imageName>_<tiledObjectId>". Returns [room, image] for the
    # first allowed room whose prefix fits and whose image name is a plant, else nil.
    def decor_room_and_image(spot_id, rooms)
      Array(rooms).each do |room|
        prefix = "#{room}_"
        next unless spot_id.start_with?(prefix)

        m = spot_id[prefix.length..].match(/\A(.+)_(\d+)\z/)
        return [room, m[1]] if m && plant_key?(m[1])
      end
      nil
    end

    # Whether the definition's spots/exclude allow this id.
    def listed?(defn, spot_id)
      return false if defn['exclude'].include?(spot_id)

      defn['spots'] == 'plants' || defn['spots'].include?(spot_id)
    end

    # The server's decision on one spot id for one item: { room: } or nil. A scenario object is
    # looked up through the caller's finder (object_id -> { object:, room_id: }), a decor id by
    # shape alone (the server does not read room maps; section 7).
    def resolve_spot(defn, spot_id, finder)
      return nil unless valid_spot_id?(spot_id)

      found = finder.call(spot_id)
      if found
        obj = found[:object]
        return nil unless defn['rooms'].include?(found[:room_id])
        return nil unless spot_object?(obj)
        return nil unless listed?(defn, spot_id)

        return { room: found[:room_id] }
      end

      room, = decor_room_and_image(spot_id, defn['rooms'])
      return nil unless room && listed?(defn, spot_id)

      { room: room }
    end

    # The same lookup as CaptureProofs#planted_target_object, for callers with no Game (the
    # validator and the log scanners): a top-level room object by id -> { object:, room_id: }.
    def find_object(scenario, object_id)
      rooms = scenario.is_a?(Hash) ? scenario['rooms'] : nil
      return nil unless rooms.is_a?(Hash)

      rooms.each do |room_id, room|
        next unless room.is_a?(Hash) && room['objects'].is_a?(Array)

        obj = room['objects'].find { |o| o.is_a?(Hash) && o['id'].to_s == object_id.to_s }
        return { object: obj, room_id: room_id } if obj
      end
      nil
    end

    # Plant decor in a room map, with the skips the client applies before it draws decor
    # (core/rooms.js: items and table_items layers only, image name from the tileset, items whose
    # base type is a start-inventory type skipped, and a scenario object with no explicit
    # position takes over the first Tiled item of its type). Returns [{ id:, image:, tiled_id: }]
    # in layer order.
    def decor_spots(map, room_id, scenario)
      return [] unless map.is_a?(Hash)

      start_types = Array(scenario && scenario['startItemsInInventory']).filter_map do |i|
        i['type'].to_s if i.is_a?(Hash)
      end
      room = scenario && scenario.dig('rooms', room_id)
      reserved = Hash.new(0)
      if room.is_a?(Hash)
        Array(room['objects']).each do |o|
          next unless o.is_a?(Hash) && !o['position'] && o['type']

          reserved[o['type'].to_s.sub(/\d+\z/, '')] += 1
        end
      end

      out = []
      %w[items table_items].each do |layer_name|
        layer = Array(map['layers']).find { |l| l['name'] == layer_name && l['type'] == 'objectgroup' }
        next unless layer

        Array(layer['objects']).each do |obj|
          image = tiled_image_name(obj, map)
          next unless image && plant_family_key?(image)

          base = image.sub(/\d+\z/, '')
          next if start_types.include?(base)

          if reserved[base].positive?
            reserved[base] -= 1
            next
          end
          next unless plant_key?(image)

          out << { id: "#{room_id}_#{image}_#{obj['id']}", image: image, tiled_id: obj['id'] }
        end
      end
      out
    end

    def tiled_image_name(obj, map)
      gid = obj['gid']
      return nil unless gid

      # The tileset's tilecount can be smaller than its highest tile id in these maps, so the
      # tile list decides: the highest firstgid at or below the gid that holds that tile.
      ts = Array(map['tilesets']).select { |t| gid >= t['firstgid'] }.sort_by { |t| -t['firstgid'] }.find do |t|
        Array(t['tiles']).any? { |tile| tile['id'] == gid - t['firstgid'] } || (t['tilecount'] && gid < t['firstgid'] + t['tilecount'])
      end
      return nil unless ts

      tile = Array(ts['tiles']).find { |t| t['id'] == gid - ts['firstgid'] }
      return File.basename(tile['image'], '.png') if tile && tile['image']

      ts['name'].to_s.include?('/') ? File.basename(ts['name'], '.png') : nil
    end
  end
end
