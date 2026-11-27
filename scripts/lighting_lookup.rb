#!/usr/bin/env ruby
# frozen_string_literal: true

# Room lighting lookup: has this room been lit before, and how?
#
# Lighting is configured per scenario room, but the reusable unit is the room
# *type* (the Tiled map). Its size, panel grid, objects and tile coordinates are
# the same in every mission that uses it, so a lighting block written for one
# mission usually drops straight into another.
#
#   ruby scripts/lighting_lookup.rb scenarios/m03_x/scenario.json.erb   # every room in a scenario
#   ruby scripts/lighting_lookup.rb room_hospital_servers               # one room type
#   ruby scripts/lighting_lookup.rb --all                               # every lit room type
#
# For each room type it prints the lighting blocks other scenarios already use
# (with whether that room had people in it, which decides whether it starts
# lit), and the objects in the map that look like light sources but don't match
# EMITTERS in systems/lighting.js, so the light-source list can be extended.

require 'json'
require_relative 'validate_scenario'

ROOT = File.expand_path('..', __dir__)
ROOMS_DIR = File.join(ROOT, 'public/break_escape/assets/rooms')
LIGHTING_JS = File.join(ROOT, 'public/break_escape/js/systems/lighting.js')
LIGHTISH = /lamp|light|screen|monitor|display|terminal|\bpc\d|laptop|\btv|exit|neon|led\b|_panel|(?<!c)rack|server|kiosk|vending|fridge|projector|alarm|fireplace|candle|aquarium/i

def emitter_patterns
  File.read(LIGHTING_JS).scan(/\{\s*re:\s*\/(.+?)\/[gimsuy]*,/).map { |(src)| Regexp.new(src) }
rescue Errno::ENOENT
  []
end

# Texture keys of the objects a Tiled room map places (object layers -> tile images).
def map_objects(room_type)
  path = File.join(ROOMS_DIR, "#{room_type}.json")
  path = Dir.glob(File.join(ROOMS_DIR, '*.json')).find { |p| File.basename(p, '.json').casecmp?(room_type) } unless File.exist?(path)
  return nil unless path && File.exist?(path)

  map = JSON.parse(File.read(path))
  images = {}
  map['tilesets'].each do |ts|
    (ts['tiles'] || []).each do |t|
      images[ts['firstgid'] + t['id']] = File.basename(t['image'].to_s, '.png') if t['image']
    end
  end
  keys = []
  map['layers'].each do |layer|
    next unless layer['type'] == 'objectgroup'
    (layer['objects'] || []).each do |o|
      gid = o['gid'] && (o['gid'] & 0x1FFFFFFF)
      keys << images[gid] if gid && images[gid]
    end
  end
  keys.uniq.sort
end

def scenario_files
  Dir.glob(File.join(ROOT, 'scenarios/*/scenario.json.erb')).sort
end

def load_scenario(path)
  render_erb_to_json(path)
rescue StandardError => e
  warn "  (skipped #{path.sub(ROOT + '/', '')}: #{e.message.lines.first.strip})"
  nil
end

def people?(room)
  (room['npcs'] || []).any? { |n| n['npcType'] != 'phone' && !n.dig('behavior', 'initiallyHidden') }
end

# room_type => [{scenario, room_id, lighting, people, scenario_lighting}]
def lit_rooms_index
  index = Hash.new { |h, k| h[k] = [] }
  scenario_files.each do |path|
    data = load_scenario(path) or next
    top = data['lighting']
    next unless top && top['enabled'] != false
    (data['rooms'] || {}).each do |room_id, room|
      index[room['type']] << {
        scenario: File.basename(File.dirname(path)), room_id: room_id,
        lighting: room['lighting'], people: people?(room), scenario_lighting: top
      }
    end
  end
  index
end

def report_type(room_type, index, patterns, this_scenario: nil)
  uses = index[room_type].reject { |u| u[:scenario] == this_scenario }
  if uses.empty?
    puts '  not lit in any other scenario yet'
  else
    uses.each do |u|
      cfg = u[:lighting] ? JSON.generate(u[:lighting]) : "(none: scenario default '#{u[:scenario_lighting]['defaultMode'] || 'on'}')"
      puts "  #{u[:scenario]} / #{u[:room_id]}#{u[:people] ? ' [people]' : ''}: #{cfg}"
    end
  end
  objs = map_objects(room_type)
  if objs.nil?
    puts '  (map not found)'
    return
  end
  lit = objs.select { |k| patterns.any? { |re| re.match?(k) } }
  missed = objs.select { |k| k.match?(LIGHTISH) && patterns.none? { |re| re.match?(k) } }
  puts "  light sources in the map: #{lit.empty? ? 'none' : lit.join(', ')}"
  puts "  light-looking but not in EMITTERS: #{missed.join(', ')}" unless missed.empty?
end

arg = ARGV[0]
if arg.nil? || %w[-h --help].include?(arg)
  puts File.read(__FILE__).lines.drop(3).take_while { |l| l.start_with?('#') }.map { |l| l.sub(/^# ?/, '') }.join
  exit(arg ? 0 : 1)
end

patterns = emitter_patterns
index = lit_rooms_index

if arg == '--all'
  index.keys.sort.each do |type|
    puts type
    report_type(type, index, patterns)
  end
elsif arg.end_with?('.erb', '.json') || File.directory?(arg)
  path = File.directory?(arg) ? File.join(arg, 'scenario.json.erb') : arg
  data = load_scenario(path) or exit 1
  name = File.basename(File.dirname(File.expand_path(path)))
  puts "#{name}: scenario lighting #{data['lighting'] ? JSON.generate(data['lighting']) : 'not enabled'}"
  (data['rooms'] || {}).each do |room_id, room|
    own = room['lighting'] ? JSON.generate(room['lighting']) : 'no lighting block'
    puts "#{room_id} (#{room['type']})#{people?(room) ? ' [people]' : ''}: #{own}"
    report_type(room['type'], index, patterns, this_scenario: name)
  end
else
  puts arg
  report_type(arg, index, patterns)
end
