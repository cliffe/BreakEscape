# frozen_string_literal: true

# Wearable items (docs/achitechture/WEARABLE_BUILD_LOG.md). One entry point, check_wearables,
# called by scripts/validate_scenario.rb. Which items are wearable and which globals they own
# come from BreakEscape::WearableModel, which the server shares.
require 'json'
require 'set'
require_relative '../lib/break_escape/wearable_model'

WEARABLE_KEYS = %w[costume global unseenOnly seenBy confirmOn confirmOff onWear onRemove _comment].freeze

def wearable_npc_ids(json_data)
  ids = Set.new
  rooms = json_data['rooms'].is_a?(Hash) ? json_data['rooms'] : {}
  rooms.each_value do |room|
    next unless room.is_a?(Hash) && room['npcs'].is_a?(Array)

    room['npcs'].each { |npc| ids << npc['id'].to_s if npc.is_a?(Hash) && npc['id'] }
  end
  ids
end

# Ink writers in the scenario's own ink sources: assignments `~ name = ...` (not `==`) and the
# `# set_global:name:value` tag the chat runners act on. [{ name:, path: }]
def wearable_ink_writers(scenario_dir, names)
  return [] if scenario_dir.nil? || names.empty?

  out = []
  Dir.glob(File.join(scenario_dir, 'ink', '**', '*.ink')).sort.each do |file|
    File.foreach(file).with_index(1) do |line, n|
      names.each do |name|
        quoted = Regexp.escape(name)
        next unless line =~ /~\s*(?:temp\s+)?#{quoted}\s*=(?!=)/ || line =~ /#\s*set_global\s*:\s*#{quoted}\s*:/

        out << { name: name, path: "#{File.basename(file)}:#{n}" }
      end
    end
  end
  out
end

def check_wearables(json_data, scenario_dir = nil)
  issues = []
  return issues unless json_data.is_a?(Hash)

  wm = BreakEscape::WearableModel
  err = ->(msg) { issues << "❌ ERROR: wearable: #{msg}" }
  warn = ->(msg) { issues << "⚠️ WARNING: wearable: #{msg}" }

  entries = wm.wearable_items(json_data)
  disguises = json_data['disguises'].is_a?(Hash) ? json_data['disguises'] : {}
  declared = json_data['globalVariables'].is_a?(Hash) ? json_data['globalVariables'] : {}
  npc_ids = wearable_npc_ids(json_data)
  owner_of = {}
  wearable_ids = Set.new

  entries.each do |entry|
    item = entry[:item]
    raw = item['wearable']
    path = entry[:path]
    unless raw.is_a?(Hash)
      err.call("#{path}/wearable must be an object { costume, global, ... }")
      next
    end
    spec = wm.spec(item)
    unless spec
      err.call("#{path}/wearable needs a non-empty 'costume' and 'global'")
      next
    end
    id = item['id']
    if !id.is_a?(String) || id.strip.empty?
      err.call("#{path}: a wearable item needs an id (the server records the worn item by id)")
    else
      wearable_ids << id
    end
    unless disguises.key?(spec['costume'])
      err.call("#{path}/wearable/costume '#{spec['costume']}' is not a key of the scenario's disguises")
    end
    if !declared.key?(spec['global'])
      err.call("#{path}/wearable/global '#{spec['global']}' is not declared in globalVariables")
    elsif declared[spec['global']] != false
      warn.call("#{path}/wearable/global '#{spec['global']}' should start false (the item starts off)")
    end
    # The same item definition may appear twice (a give_item copy and its declared grant): a
    # shared global is an error only between two different item ids.
    prev = owner_of[spec['global']]
    if prev && prev[:id] != id
      err.call("#{path}: global '#{spec['global']}' is already the worn global of '#{prev[:id]}' (#{prev[:path]}); " \
               'give each wearable its own global')
    else
      owner_of[spec['global']] ||= { id: id, path: path }
    end
    extra = raw.keys - WEARABLE_KEYS
    warn.call("#{path}/wearable has unrecognised key(s): #{extra.join(', ')}") unless extra.empty?
    if raw.key?('unseenOnly') && ![true, false].include?(raw['unseenOnly'])
      err.call("#{path}/wearable/unseenOnly must be true or false")
    end
    if raw.key?('seenBy')
      ignore = raw['seenBy'].is_a?(Hash) ? raw['seenBy']['ignore'] : nil
      if !ignore.is_a?(Array) || !ignore.all? { |v| v.is_a?(String) }
        err.call("#{path}/wearable/seenBy must be { ignore: [npc ids] }")
      else
        (ignore - npc_ids.to_a).each { |gone| err.call("#{path}/wearable/seenBy/ignore names '#{gone}', which is no room NPC") }
      end
      warn.call("#{path}/wearable/seenBy has no effect without unseenOnly: true") unless raw['unseenOnly'] == true
    end
    %w[confirmOn confirmOff].each do |k|
      err.call("#{path}/wearable/#{k} must be a non-empty string") if raw.key?(k) && !(raw[k].is_a?(String) && !raw[k].strip.empty?)
    end
    %w[onWear onRemove].each do |k|
      err.call("#{path}/wearable/#{k} must be an array of actions") if raw.key?(k) && !raw[k].is_a?(Array)
    end
    if item['triggerOnInteract']
      warn.call("#{path}: a wearable's tray click puts it on or takes it off, so its triggerOnInteract never runs from the tray")
    end
  end

  return issues if entries.empty? && !actions_named?(json_data, %w[wear take_off])

  # ---- No other writer of a worn global ----
  worn = owner_of.keys
  wm.global_writers(json_data).each do |w|
    next unless worn.include?(w[:name])

    err.call("#{w[:path]} writes '#{w[:name]}', the worn global of '#{owner_of[w[:name]][:id]}': only putting the item " \
             'on or taking it off may write it (use a wear or take_off action)')
  end
  wearable_ink_writers(scenario_dir, worn).each do |w|
    err.call("ink #{w[:path]} writes '#{w[:name]}', the worn global of '#{owner_of[w[:name]][:id]}': ink may read it, never write it")
  end

  # ---- Costume actions beside wearables, and wear / take_off targets ----
  walk_actions(json_data) do |action, path|
    case action['type']
    when 'set_costume', 'clear_costume'
      if entries.any?
        warn.call("#{path}: #{action['type']} in a scenario with wearable items: the costume and the worn item " \
                  'can disagree; put the costume on through a wearable')
      end
    when 'wear'
      id = action['itemId']
      if !id.is_a?(String) || id.empty?
        err.call("#{path}: wear needs an itemId")
      elsif !wearable_ids.include?(id)
        err.call("#{path}: wear names '#{id}', which is no wearable item")
      end
    when 'take_off'
      id = action['itemId']
      if !id.nil? && !wearable_ids.include?(id)
        err.call("#{path}: take_off names '#{id}', which is no wearable item")
      end
    end
  end
  issues
end

def actions_named?(json_data, types)
  found = false
  walk_actions(json_data) { |a, _| found ||= types.include?(a['type']) }
  found
end

# Every hash with a string 'type' that sits in an action list (an array under a key the engine
# runs as actions): yields (action, path).
WEARABLE_ACTION_LIST_KEYS = %w[triggerOnInteract onConfirm onWear onRemove onProceed onDecline actions onComplete
                               onOwnerNoticesMissing].freeze

def walk_actions(node, path = '', &block)
  case node
  when Hash
    node.each do |k, v|
      sub = path.empty? ? k.to_s : "#{path}/#{k}"
      if WEARABLE_ACTION_LIST_KEYS.include?(k.to_s) && v.is_a?(Array)
        v.each_with_index do |a, i|
          block.call(a, "#{sub}[#{i}]") if a.is_a?(Hash) && a['type'].is_a?(String)
        end
      end
      walk_actions(v, sub, &block)
    end
  when Array
    node.each_with_index { |v, i| walk_actions(v, "#{path}[#{i}]", &block) }
  end
end
