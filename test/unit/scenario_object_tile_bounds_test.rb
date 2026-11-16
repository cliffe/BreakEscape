# frozen_string_literal: true

require 'test_helper'
require 'json'

module BreakEscape
  # Every scenario object written in the object form (`position: { x, y }`) carries room-relative
  # TILE coordinates (rooms.js: roomPos + x * TILE_SIZE). The client keeps a random spot for a tile
  # value outside the room's Tiled map (0..width, 0..height), so a value that looks like pixels
  # silently puts an object at a random place. This renders every scenario and checks each such
  # value against the room type's map size, so authored data and the client bound cannot drift apart.
  # Objects inside a table's `tableItems` use table-relative pixels and are not checked, matching
  # how rooms.js reads them. Hacktivity loads test_objectives and test_simple_success from here:
  # do not edit those two to satisfy this test; report instead.
  class ScenarioObjectTileBoundsTest < ActiveSupport::TestCase
    ROOT = BreakEscape::Engine.root
    MAPS = Dir[ROOT.join('public/break_escape/assets/rooms/*.json').to_s].each_with_object({}) do |f, h|
      j = JSON.parse(File.read(f)) rescue nil # rubocop:disable Style/RescueModifier
      h[File.basename(f, '.json').downcase] = [j['width'], j['height']] if j.is_a?(Hash) && j['width'] && j['height']
    end

    def scenario_files
      (Dir[ROOT.join('scenarios/*/scenario.json.erb').to_s] + Dir[ROOT.join('scenarios/*/scenario.json').to_s] +
        Dir[ROOT.join('scenarios/*.json').to_s] + Dir[ROOT.join('scenarios/*.json.erb').to_s]).sort
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
          size = MAPS[room['type'].to_s.downcase]
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
  end
end
