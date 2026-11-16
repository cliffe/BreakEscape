# frozen_string_literal: true

require 'test_helper'
require 'json'

module BreakEscape
  # Every scenario object written in the object form (`position: { x, y }`) carries room-relative
  # TILE coordinates (rooms.js: roomPos + x * TILE_SIZE). The client keeps a random spot for a tile
  # value outside the room's Tiled map (0..width, 0..height), so a value that looks like pixels
  # silently puts an object at a random place. This renders every scenario and checks each such
  # value against the room type's map size, so authored data and the client bound cannot drift apart.
  # Objects inside a table's `tableItems` are not checked: rooms.js reads a table item's top-level
  # `x`/`y` as table-relative pixels, and any `position` inside `tableItems` is not read at all.
  # Rooms also stack with a two-tile overlap: the bottom two rows of a room that has a `south`
  # connection sit under the top wall of that room, so an object placed by its top-left corner on
  # those rows is drawn hidden. A second test flags that (see below). Hacktivity loads test_objectives and test_simple_success from here:
  # do not edit those two to satisfy this test; report instead.
  class ScenarioObjectTileBoundsTest < ActiveSupport::TestCase
    ROOT = BreakEscape::Engine.root
    # The runtime asks Phaser for the room type as an exact key, so build the lookup from the
    # `tilemapTiledJSON('<key>', '<file>')` pairs in game.js and match the type exactly (no case folding).
    SIZES = Dir[ROOT.join('public/break_escape/assets/rooms/*.json').to_s].each_with_object({}) do |f, h|
      j = JSON.parse(File.read(f)) rescue nil # rubocop:disable Style/RescueModifier
      h[File.basename(f)] = [j['width'], j['height']] if j.is_a?(Hash) && j['width'] && j['height']
    end
    GAME_JS = ROOT.join('public/break_escape/js/core/game.js').read
    MAPS = GAME_JS.scan(%r{tilemapTiledJSON\('([^']+)',\s*'rooms/([^']+)'\)}).each_with_object({}) do |(key, file), h|
      h[key] = SIZES[file] if SIZES[file]
    end
    # Hacktivity loads these two from here, so they are report-only.
    REPORT_ONLY = %w[test_objectives test_simple_success].freeze
    # Objects deliberately placed under the south room's wall: test_behind_wall_fade checks that an
    # object in office_n's bottom row (y 8 of 10) is drawn under the hall's back wall and never fades.
    DELIBERATE_UNDER_WALL = [%w[test_behind_wall_fade office_n north_card]].freeze

    def scenario_files
      (Dir[ROOT.join('scenarios/*/scenario.json.erb').to_s] + Dir[ROOT.join('scenarios/*/scenario.json').to_s] +
        Dir[ROOT.join('scenarios/*.json').to_s] + Dir[ROOT.join('scenarios/*.json.erb').to_s]).sort
    end

    def render_scenario(f)
      text = File.read(f)
      JSON.parse(f.end_with?('.erb') ? BreakEscape::ScenarioBinding.render(text, {}) : text)
    end

    # The bottom two rows of a room with a south neighbour sit under that room's top wall.
    def hidden_under_south_wall?(y, rows)
      y >= rows - 2
    end

    def collect(obj, acc)
      return unless obj.is_a?(Hash)

      acc << obj
      Array(obj['contents']).each { |c| collect(c, acc) }
    end

    test 'every object-form tile x/y fits its room type map' do
      files = scenario_files
      assert_operator files.size, :>, 100, 'expected to find the scenario corpus'
      bad = []
      checked = 0
      files.each do |f|
        text = File.read(f)
        data = JSON.parse(f.end_with?('.erb') ? BreakEscape::ScenarioBinding.render(text, {}) : text)
        (data['rooms'] || {}).each do |room_id, room|
          size = MAPS[room['type'].to_s]
          assert size, "#{f} #{room_id}: no Tiled map for room type #{room['type'].inspect}"
          objs = []
          Array(room['objects']).each { |o| collect(o, objs) }
          objs.each do |o|
            pos = o['position']
            next unless pos.is_a?(Hash)

            [['x', size[0]], ['y', size[1]]].each do |k, limit|
              next unless pos.key?(k)

              checked += 1
              v = pos[k]
              next if v.is_a?(Numeric) && v >= 0 && v <= limit

              bad << "#{f.sub("#{ROOT}/", '')} #{room_id} (#{room['type']}) #{o['type']} #{o['name'].inspect}: #{k}=#{v.inspect}, room is #{size[0]}x#{size[1]} tiles"
            end
          end
        end
      end
      assert_operator checked, :>, 500
      assert_empty bad, "tile x/y outside the room map (pixels by mistake?):\n#{bad.join("\n")}"
    end

    # An object whose tile row is in the last two rows of a room with a `south` connection is drawn
    # under the south room's top wall. Test scenarios must avoid it. Real missions are only reported
    # (the list is printed, not failed) because moving mission objects is a separate decision.
    test 'no object sits in the bottom two rows of a room that has a south neighbour' do
      test_hits = []
      mission_hits = []
      scenario_files.each do |f|
        data = render_scenario(f)
        name = File.basename(File.dirname(f))
        name = File.basename(f).sub(/\.json(\.erb)?\z/, '') if File.dirname(f) == ROOT.join('scenarios').to_s
        (data['rooms'] || {}).each do |room_id, room|
          size = MAPS[room['type'].to_s]
          next unless size && room['connections'].is_a?(Hash) && room['connections']['south']

          objs = []
          Array(room['objects']).each { |o| collect(o, objs) }
          objs.each do |o|
            pos = o['position']
            next unless pos.is_a?(Hash) && pos['y'].is_a?(Numeric) && hidden_under_south_wall?(pos['y'], size[1]) && !DELIBERATE_UNDER_WALL.include?([name, room_id, o['id']])

            line = "#{f.sub("#{ROOT}/", '')} #{room_id} #{o['type']} #{o['name'].inspect}: y=#{pos['y']} (room #{size[1]} rows, south neighbour)"
            (name.start_with?('test') && !REPORT_ONLY.include?(name) ? test_hits : mission_hits) << line
          end
        end
      end
      warn "Objects in the bottom two rows of a room with a south neighbour (report only):\n#{mission_hits.join("\n")}" if mission_hits.any?
      assert_empty test_hits, "hidden under the south room's wall:\n#{test_hits.join("\n")}"
    end

    # The rule is inclusive: in a 10-row room y 8 is already inside the hidden band (rows 8 and 9).
    test 'y equal to height - 2 is flagged and y below it is not' do
      size = MAPS['room_office']
      assert size, 'room_office map missing'
      assert_equal 10, size[1]
      assert hidden_under_south_wall?(8, size[1]), 'y 8 in a 10-row room with a south neighbour must be flagged'
      assert hidden_under_south_wall?(9, size[1])
      assert_not hidden_under_south_wall?(7, size[1])
    end
  end
end
