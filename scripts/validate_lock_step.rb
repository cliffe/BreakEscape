# frozen_string_literal: true

# Second-step lock lints (S8c, feature A25, unit 06). One entry point, check_lock_step, called by
# scripts/validate_scenario.rb beside check_mfa. Every question about who owns a step and whether
# it can pass is answered through BreakEscape::LockStepModel and MfaModel, so the validator and
# the server agree. No line quotes a code, a number or a password.
#
# A scenario with no `secondStep` anywhere gets no line from this file, except one warning that
# reads the carried containers (a carried container with a lock or contents and no id), because
# that shape exists without a step.
require 'json'
require_relative '../lib/break_escape/mfa_model'
require_relative '../lib/break_escape/lock_step_model'
require_relative '../lib/break_escape/declared_grants'
require_relative '../lib/break_escape/hiding_spots'
require_relative 'validate_access_work'

LOCK_STEP_ID_MAX = 40
LOCK_STEP_ID_PATTERN = /\A[A-Za-z0-9_.:-]+\z/
# A lock that no player action ever opens, or that opens by other means than a first factor
LOCK_STEP_NEVER_OPENS = %w[ransomware_display network_architecture alarm_panel].freeze
LOCK_STEP_OTHER_OPENERS = %w[flag login].freeze
LOCK_STEP_CONSUMABLES_JS = File.expand_path('../public/break_escape/js/systems/consumables.js', __dir__)

# The type patterns of JS/systems/consumables.js DEFAULT_HEAL_BY_TYPE, as Ruby Regexps. Read from
# the JS file so the two cannot drift; a test compares the lists. Empty when the file is missing.
def lock_step_consumable_patterns
  @lock_step_consumable_patterns ||= begin
    text = File.exist?(LOCK_STEP_CONSUMABLES_JS) ? File.read(LOCK_STEP_CONSUMABLES_JS) : ''
    block = text[/DEFAULT_HEAL_BY_TYPE\s*=\s*\[(.*?)^\];/m, 1].to_s
    block.lines.filter_map do |line|
      m = line.match(%r{\A\s*\[/(.+)/,\s*\d+\]})
      Regexp.new(m[1]) if m
    end
  end
end

def check_lock_step(json_data)
  issues = []
  return issues unless json_data.is_a?(Hash) && json_data['rooms'].is_a?(Hash)

  err = ->(msg) { issues << "❌ ERROR: lock step: #{msg}" }
  warn = ->(msg) { issues << "⚠️ WARNING: lock step: #{msg}" }
  model = BreakEscape::LockStepModel
  ctx = lock_step_context(json_data)

  lock_step_carried_warnings(ctx, warn)
  return issues unless ctx[:entries].any? { |e| e[:node].is_a?(Hash) && e[:node].key?('secondStep') } ||
                       ctx[:door_steps].any?

  ctx[:door_steps].each { |path| err.call("#{path}: secondStep belongs on the room the door leads into, not on a doors[] entry.") }
  ctx[:entries].each do |e|
    next unless e[:node].key?('secondStep')

    lock_step_entry_errors(json_data, ctx, e, model, err)
  end
  lock_step_object_names(ctx, err)
  lock_step_task_errors(json_data, ctx, model, err)
  lock_step_warnings(json_data, ctx, model, warn)
  issues
end

# Every authored lockable (rooms and objects) with where it sits.
def lock_step_context(json_data)
  entries = []
  door_steps = []
  walk = lambda do |list, o|
    Array(list).each_with_index do |node, i|
      next unless node.is_a?(Hash)

      here = o.merge(node: node, label: "#{o[:label]}[#{i}]#{node['id'].is_a?(String) ? " (#{node['id']})" : ''}",
                     index: i, kind: :object)
      here[:generated] = "#{o[:room]}_#{node['type']}_#{i}" if o[:top]
      entries << here
      inner = { room: o[:room], home: o[:home], ancestors: o[:ancestors] + [node], top: false, table: o[:table] }
      walk.call(node['contents'], inner.merge(label: "#{here[:label]}.contents", via: :contents))
      walk.call(node['itemsHeld'], inner.merge(label: "#{here[:label]}.itemsHeld", via: :itemsHeld))
      walk.call(node['tableItems'], inner.merge(label: "#{here[:label]}.tableItems", via: :tableItems, table: true))
    end
  end
  json_data['rooms'].each do |room_id, room|
    next unless room.is_a?(Hash)

    entries << { node: room, label: "rooms.#{room_id}", room: room_id, kind: :room, home: :door, ancestors: [], index: nil }
    Array(room['doors']).each_with_index do |door, i|
      door_steps << "rooms.#{room_id}.doors[#{i}]" if door.is_a?(Hash) && door.key?('secondStep')
    end
    base = { room: room_id, home: :room, ancestors: [], top: true, table: false }
    walk.call(room['objects'], base.merge(label: "rooms.#{room_id}.objects"))
    Array(room['npcs']).each_with_index do |npc, i|
      next unless npc.is_a?(Hash)

      walk.call(npc['itemsHeld'], base.merge(label: "rooms.#{room_id}.npcs[#{i}].itemsHeld", home: :npc, top: false))
    end
  end
  BreakEscape::LockStepModel.headless_held(json_data).each do |npc_id, held|
    walk.call(held, { room: nil, home: :npc, ancestors: [], top: false, table: false, label: "headless #{npc_id}.itemsHeld" })
  end
  walk.call(json_data['startItemsInInventory'], { room: nil, home: :start, ancestors: [], top: false, table: false,
                                                  label: 'startItemsInInventory' })
  BreakEscape::DeclaredGrants.for(json_data).each_with_index do |grant, i|
    walk.call([grant['item']], { room: nil, home: :grant, ancestors: [], top: false, table: false, label: "declared grant #{i}" })
  end
  { entries: entries, door_steps: door_steps, npc_ids: lock_step_npc_ids(json_data) }
end

def lock_step_npc_ids(json_data)
  ids = json_data['rooms'].values.flat_map do |room|
    room.is_a?(Hash) ? Array(room['npcs']).filter_map { |n| n['id'] if n.is_a?(Hash) } : []
  end
  ids + BreakEscape::LockStepModel.headless_held(json_data).map(&:first)
end

def lock_step_gated_door?(json_data, room_id)
  json_data['rooms'].each_value.any? do |room|
    next false unless room.is_a?(Hash)

    Array(room['doors']).any? do |door|
      door.is_a?(Hash) && door['connectedRoom'] == room_id && door['gate'].is_a?(Hash) && door['gate']['enabled'] != false
    end
  end
end

def lock_step_types(e)
  e[:ancestors].map { |a| a['type'] } + [e[:node]['type']]
end

def lock_step_entry_errors(json_data, ctx, e, model, err)
  node = e[:node]
  step = node['secondStep']
  at = e[:label]
  object = e[:kind] == :object
  err.call("#{at}: secondStep needs locked: true and a lockType.") unless node['locked'] == true && node['lockType'].is_a?(String)
  unless step.is_a?(Hash)
    err.call("#{at}: secondStep must be an object with a kind.")
    return
  end
  kind = step['kind']
  err.call("#{at}: secondStep kind #{kind.inspect} is not one of #{model::LOCK_KINDS.join(', ')}.") unless model::LOCK_KINDS.include?(kind)
  extra = step.keys - %w[kind owner]
  err.call("#{at}: secondStep has unknown keys #{extra.join(', ')}.") unless extra.empty?

  lock_type = node['lockType']
  if LOCK_STEP_OTHER_OPENERS.include?(lock_type) || LOCK_STEP_NEVER_OPENS.include?(lock_type)
    err.call("#{at}: a #{lock_type} lock takes no second step: it does not open by a first factor the server checks.")
  elsif model::LOCK_KINDS.include?(kind) && lock_type.is_a?(String)
    if kind == 'code' && !model::CODE_LOCK_TYPES.include?(lock_type)
      err.call("#{at}: a code step is for #{model::CODE_LOCK_TYPES.join(' and ')} locks, not #{lock_type}.")
    elsif !model::PUSH_LOCK_TYPES.include?(lock_type)
      err.call("#{at}: a #{lock_type} lock takes no second step (allowed: #{model::PUSH_LOCK_TYPES.join(', ')}).")
    end
  end

  lock_step_owner_errors(json_data, ctx, e, model, err)
  lock_step_where_errors(json_data, e, err) if object || e[:kind] == :room
  lock_step_object_errors(e, err) if object
  lock_step_carrier_errors(e, err) if object
end

def lock_step_owner_errors(json_data, ctx, e, model, err)
  node = e[:node]
  at = e[:label]
  kind = node['secondStep']['kind']
  owner = model.lock_step(node)&.fetch('owner')
  authored = node['secondStep']['owner']
  if owner.nil?
    err.call("#{at}: secondStep needs an owner (an NPC id)#{e[:kind] == :object ? ' or an object owned by exactly one NPC' : ''}.") if model::LOCK_KINDS.include?(kind) || authored.nil?
    return
  end
  unless ctx[:npc_ids].include?(owner)
    err.call("#{at}: secondStep owner '#{owner}' is not an NPC.")
    return
  end
  if kind == 'code' && BreakEscape::MfaModel.device_for(json_data, owner).nil?
    err.call("#{at}: secondStep owner '#{owner}' has no code_device (type code_device, owner '#{owner}', with an id) for the code step.")
  end
  npc = model.find_npc(json_data, owner)
  if %w[push push_number_match].include?(kind) && npc.is_a?(Hash) && npc['phone'] == false
    err.call("#{at}: secondStep owner '#{owner}' has phone: false, so a #{kind} step has no phone to ask.")
  end
end

def lock_step_where_errors(json_data, e, err)
  return unless e[:kind] == :room

  room_id = e[:room]
  err.call("#{e[:label]}: the start room cannot carry a second step.") if json_data['startRoom'] == room_id
  social = json_data['social']
  episode = social.is_a?(Hash) ? social['awarenessEpisode'] : nil
  world = episode.is_a?(Hash) ? episode['world'] : nil
  err.call("#{e[:label]}: the awareness world room cannot carry a second step.") if world.is_a?(Hash) && world['room'] == room_id
  err.call("#{e[:label]}: the doorway into this room carries a gate; a gate and a second step do not combine.") if lock_step_gated_door?(json_data, room_id)
end

def lock_step_object_errors(e, err)
  node = e[:node]
  at = e[:label]
  id = node['id']
  if !id.is_a?(String) || id.empty?
    err.call("#{at}: a gated object needs an id.")
  else
    err.call("#{at}: id is #{id.length} characters; the most is #{LOCK_STEP_ID_MAX}.") if id.length > LOCK_STEP_ID_MAX
    err.call("#{at}: id '#{id}' uses characters outside A-Z a-z 0-9 _ . : -.") unless id.match?(LOCK_STEP_ID_PATTERN)
  end
  types = lock_step_types(e)
  err.call("#{at}: a key or card takes no second step.") if lock_step_key_or_card?(node)
  err.call("#{at}: a usb item, or an item inside one, takes no second step.") if types.include?('usb')
  err.call("#{at}: a tableItems entry, or an item inside one, takes no second step.") if e[:table]
  err.call("#{at}: a consumable takes no second step.") if lock_step_consumable?(node)
  err.call("#{at}: a declared grant item that is droppable takes no second step.") if e[:home] == :grant && e[:ancestors].empty? && node['droppable'] == true
  err.call("#{at}: an item held by a flag station takes no second step.") if e[:ancestors].any? { |a| a['type'] == 'flag-station' }
  err.call("#{at}: a hideable device takes no second step.") if node['hideable'].is_a?(Hash)
end

def lock_step_key_or_card?(node)
  %w[key keycard].include?(node['type']) ||
    %w[opens_lock key_id card_id].any? { |k| node[k].is_a?(String) && !node[k].empty? } ||
    (node['keyPins'] && node['lockType'] != 'key') # a key lock's own keyPins are its pins, not a key's cuts
end

def lock_step_consumable?(node)
  return true if node['consumable'] == true

  type = node['type'].to_s.downcase
  lock_step_consumable_patterns.any? { |re| re.match?(type) }
end

def lock_step_carrier_errors(e, err)
  return unless e[:ancestors].any? { |a| !a['id'].is_a?(String) || a['id'].empty? }

  err.call("#{e[:label]}: a carrier above a gated object has no id; give every container above it an id.")
end

# A gated object's id and name must not be another object's id, name or generated id
def lock_step_object_names(ctx, err)
  objects = ctx[:entries].select { |e| e[:kind] == :object }
  ctx[:entries].each do |e|
    next unless e[:kind] == :object && e[:node].key?('secondStep')

    others = objects.reject { |o| o.equal?(e) }
    taken = others.flat_map { |o| [o[:node]['id'], o[:node]['name'], o[:generated]] }.compact.map(&:to_s)
    { 'id' => e[:node]['id'], 'name' => e[:node]['name'] }.each do |field, value|
      next unless value.is_a?(String) && !value.empty? && taken.include?(value)

      err.call("#{e[:label]}: #{field} '#{value}' is also another object's id, name or generated id; a gated object's names must be its own.")
    end
  end
end

# What a task needs: the object ids it unlocks and the rooms it unlocks or enters
def lock_step_task_targets(json_data)
  objects = {}
  rooms = {}
  Array(json_data['objectives']).each_with_index do |aim, oi|
    next unless aim.is_a?(Hash)

    Array(aim['tasks']).each_with_index do |task, ti|
      next unless task.is_a?(Hash)

      at = "objectives[#{oi}].tasks[#{ti}] (#{task['taskId']})"
      objects[task['targetObject']] = at if task['type'] == 'unlock_object' && task['targetObject'].is_a?(String)
      rooms[task['targetRoom']] = at if %w[unlock_room enter_room].include?(task['type']) && task['targetRoom'].is_a?(String)
    end
  end
  [objects, rooms]
end

def lock_step_task_errors(json_data, ctx, model, err)
  story = ->(path) { ValidateAccessWork.story_file(path) }
  object_tasks, room_tasks = lock_step_task_targets(json_data)
  ctx[:entries].each do |e|
    node = e[:node]
    next unless node.is_a?(Hash) && model.lock_step(node)

    task = e[:kind] == :room ? room_tasks[e[:room]] : object_tasks[node['id']]
    if e[:kind] == :object
      by_other = object_tasks.keys.find { |t| t != node['id'] && (t == node['name'] || t == e[:generated]) }
      err.call("#{object_tasks[by_other]} names the gated object '#{node['id']}' as '#{by_other}'; an unlock_object task must name it by its id.") if by_other
    end
    next unless task && model.lock_step_never_passes?(json_data, node, &story)

    err.call("#{e[:label]}: the second step never passes (#{lock_step_why(model, node)}) and #{task} needs this lock.")
  end
end

def lock_step_why(model, node)
  kind = node['secondStep']['kind']
  kind == 'code' ? 'the owner\'s code device is in no place the player can take it from' : 'the owner\'s phone is out of reach' + (kind == 'push' ? ' and the owner never approves' : '')
end

def lock_step_warnings(json_data, ctx, model, warn)
  story = ->(path) { ValidateAccessWork.story_file(path) }
  object_tasks, room_tasks = lock_step_task_targets(json_data)
  unlockable = lock_step_unlock_names(json_data)
  removed = lock_step_remove_names(json_data)
  ctx[:entries].each do |e|
    node = e[:node]
    next unless node.is_a?(Hash) && model.lock_step(node)

    at = e[:label]
    id = e[:kind] == :room ? e[:room] : node['id']
    needed = e[:kind] == :room ? room_tasks[e[:room]] : object_tasks[node['id']]
    if !needed && model.lock_step_never_passes?(json_data, node, &story)
      warn.call("#{at}: the second step never passes (#{lock_step_why(model, node)}); no task needs this lock, but nothing past it can be reached.")
    end
    warn.call("#{at}: '#{id}' is named in an NPC's unlockable or an eventMappings unlockDoor, which opens a lock; with a second step the NPC route still asks the step.") if id && unlockable.include?(id)
    next unless e[:kind] == :object

    warn.call("#{at}: a gated object with its own text; put the text in contents so it is shown only after the step passes.") if node['text'].is_a?(String) && !node['text'].empty?
    warn.call("#{at}: a gated room object's tableItems are not covered by the step.") if e[:home] == :room && node['tableItems'].is_a?(Array) && !node['tableItems'].empty?
    warn.call("#{at}: a gated file that can be copied (takeable, transfer #{node['transfer']}); the copy skips the step.") if node['takeable'] == true && %w[copy both].include?(node['transfer'])
    next unless node['takeable'] == true && !e[:ancestors].empty?

    hit = [node['id'], node['name']].compact.find { |n| removed.include?(n) }
    warn.call("#{at}: a remove_item action names this gated nested takeable ('#{hit}'); the step is not asked when it is removed.") if hit
  end
end

# The ids and room keys NPCs may unlock: unlockable lists and eventMappings unlockDoor
def lock_step_unlock_names(json_data)
  names = []
  scan = lambda do |npc|
    next unless npc.is_a?(Hash)

    names.concat(Array(npc['unlockable']).select { |s| s.is_a?(String) })
    Array(npc['eventMappings']).each { |m| names.concat([m['unlockDoor']].flatten.compact) if m.is_a?(Hash) }
  end
  json_data['rooms'].each_value { |room| Array(room['npcs']).each(&scan) if room.is_a?(Hash) }
  Array(json_data['npcs']).each(&scan)
  social = json_data['social']
  chars = social.is_a?(Hash) && social['characters'].is_a?(Hash) ? social['characters'] : {}
  chars.each_value { |c| names.concat(Array(c['emailRecord']['unlockable'])) if c.is_a?(Hash) && c['emailRecord'].is_a?(Hash) }
  names
end

def lock_step_remove_names(json_data)
  names = []
  walk = lambda do |node|
    case node
    when Hash
      names << node['item'] if node['type'] == 'remove_item' && node['item'].is_a?(String)
      node.each_value { |v| walk.call(v) }
    when Array
      node.each { |v| walk.call(v) }
    end
  end
  walk.call(json_data)
  names
end

# A carried container (start inventory, an NPC's itemsHeld, a declared grant) with a lock or
# contents and no id: the carried check cannot name it.
def lock_step_carried_warnings(ctx, warn)
  ctx[:entries].each do |e|
    next unless e[:kind] == :object && %i[start npc grant].include?(e[:home]) && e[:ancestors].empty?

    node = e[:node]
    next if node['id'].is_a?(String) && !node['id'].empty?
    next unless node['locked'] || (node['contents'].is_a?(Array) && !node['contents'].empty?)

    warn.call("#{e[:label]}: a carried container with a lock or contents and no id is not covered by the carried check; give it an id.")
  end
end
