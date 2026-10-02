#!/usr/bin/env ruby
# frozen_string_literal: true

# Generates scenarios/<name>/dungeon_graph.html from a scenario.json.erb
# Uses Mermaid.js (CDN) for automatic dependency-graph layout.
#
# Usage:
#   ruby scripts/generate_dungeon_graph.rb scenarios/m01_first_contact/scenario.json.erb

require 'erb'
require 'json'
require 'base64'
require 'securerandom'
require 'set'

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
LOCK_TYPE_LABELS = {
  'pin'                => 'PIN lock',
  'keycard'            => 'Keycard lock',
  'rfid'               => 'RFID lock',
  'key'                => 'Key lock',
  'biometric'          => 'Biometric lock',
  'flag'               => 'Flag lock',
  'password'           => 'Password lock',
  'lockpick'           => 'Pick the lock',
  'ransomware_display' => 'Ransomware terminal'
}.freeze

SCENARIO_FILE = ARGV[0] or abort "Usage: ruby scripts/generate_dungeon_graph.rb <scenario.json.erb>"
OUT_FILE      = File.join(File.dirname(SCENARIO_FILE), 'dungeon_graph.html')
MD_FILE       = File.join(File.dirname(SCENARIO_FILE), 'dungeon_graph.md')
JSON_FILE     = File.join(File.dirname(SCENARIO_FILE), 'dungeon_graph.json')
SCENARIO_ID   = File.basename(File.dirname(SCENARIO_FILE))

# ---------------------------------------------------------------------------
# ERB context — replicates app/models/break_escape/mission.rb ScenarioBinding
# ---------------------------------------------------------------------------
class ScenarioBinding
  def initialize
    @random_password = SecureRandom.alphanumeric(8)
    @random_pin      = rand(1000..9999).to_s
    @random_code     = SecureRandom.hex(4)
  end

  attr_reader :random_password, :random_pin, :random_code

  def vm_context
    nil
  end

  def vm_object(_title, fallback = {})
    fallback.to_json
  end

  def flags_for_vm(_vm, fallback = [])
    fallback.to_json
  end

  def vm_flags_json(_vm, fallback = [])
    fallback.to_json
  end

  def get_binding
    binding
  end
end

# ---------------------------------------------------------------------------
# Parse
# ---------------------------------------------------------------------------
src      = File.read(SCENARIO_FILE)
rendered = ERB.new(src).result(ScenarioBinding.new.get_binding)
scenario = JSON.parse(rendered)

# ---------------------------------------------------------------------------
# Graph state
# ---------------------------------------------------------------------------
$nodes   = {}  # id => { label:, klass:, optional: }
$edges   = []  # { from:, to:, dashed:, label: }
$and_idx = 0
$action_aim_links = []  # [{from: action_id, to: aim_id}] — wired into integrated graph

# Sanitise a string to a valid Mermaid node identifier
def nid(s)
  s.to_s.downcase.gsub(/[^a-z0-9]/, '_').gsub(/_+/, '_').sub(/\A_+/, '').sub(/_+\z/, '')
end

def add_node(id, label, klass, optional: false)
  $nodes[id] ||= { label: label.to_s, klass: klass.to_s, optional: optional }
  id
end

def add_edge(from, to, dashed: false, label: nil)
  return unless from && to && from != to
  $edges << { from: from, to: to, dashed: dashed, label: label }
end

# ---------------------------------------------------------------------------
# Room door-lock and room nodes for locked rooms
# ---------------------------------------------------------------------------
rooms = scenario['rooms'] || {}

def room_label(room_id, room)
  room['door_sign'] || room_id.tr('_', ' ').split.map(&:capitalize).join(' ')
end

rooms.each do |room_id, room|
  next unless room['locked']
  type_str = LOCK_TYPE_LABELS[room['lockType']] || 'Lock'
  sign     = room_label(room_id, room)
  add_node("door_#{room_id}", "#{sign}<br/>#{type_str}", 'lock')
  add_node(room_id, sign, 'room')
  add_edge("door_#{room_id}", room_id)
end

# ---------------------------------------------------------------------------
# Resolve a puzzle_graph_unlocks target to a node id, creating it if needed
# ---------------------------------------------------------------------------
def resolve_target(target, rooms)
  if rooms.key?(target)
    if rooms[target]['locked']
      "door_#{target}"
    else
      sign = room_label(target, rooms[target])
      add_node(target, sign, 'room')
      target
    end
  else
    # Check for a pre-existing lock node (e.g. lock_bed2_pump_terminal created by walk_objects)
    # before creating a new placeholder
    candidate_lock = "lock_#{nid(target)}"
    return candidate_lock if $nodes.key?(candidate_lock)

    # Check for an existing item/vm node (e.g. a named item created by another walk_objects pass)
    candidate_item = nid(target)
    return candidate_item if $nodes.key?(candidate_item)

    # Nothing found — create a placeholder lock node
    label = target.tr('_', ' ').split.map(&:capitalize).join(' ')
    add_node(candidate_lock, label, 'lock')
    candidate_lock
  end
end

# ---------------------------------------------------------------------------
# Recursive object walker — collects puzzle_graph_* items
# ---------------------------------------------------------------------------
$and_pending = []  # [{item_id:, tool_key:, targets:, optional:}]

def walk_objects(objects, source_id, rooms)
  (objects || []).each do |obj|
    obj_id   = obj['id'] || nid((obj['name'] || obj['type']).to_s)
    obj_name = obj['name'] || obj_id.tr('_', ' ').split.map(&:capitalize).join(' ')

    # Locked object → create lock node; recurse into contents if present
    if obj['locked']
      lock_id  = "lock_#{obj_id}"
      type_str = LOCK_TYPE_LABELS[obj['lockType']] || 'Lock'
      add_node(lock_id, "#{obj_name}<br/>#{type_str}", 'lock')
      add_edge(source_id, lock_id)
      walk_objects(obj['contents'], lock_id, rooms) if obj['contents']
    elsif obj['contents']
      walk_objects(obj['contents'], source_id, rooms)
    end

    pg_unlocks = obj['puzzle_graph_unlocks']
    pg_role    = obj['puzzle_graph_role']
    pg_opt     = obj['puzzle_graph_optional'] == true
    pg_and     = obj['puzzle_graph_and_with']

    next unless pg_unlocks || pg_role

    klass = case pg_role || obj['type']
    when 'vm'                         then 'vm'
    when 'lock'                       then 'lock'
    when 'key', 'keycard', 'lockpick' then 'key'
    else 'item'
    end

    # puzzle_graph_role:"lock" nodes get the lock_ prefix so integrated-graph
    # bridge edges (which look for "lock_<id>") can find them.
    item_id = if klass == 'lock' && !obj['locked']
                "lock_#{obj_id}"
    else
                nid(obj_name)
    end

    add_node(item_id, obj_name, klass, optional: pg_opt)
    add_edge(source_id, item_id, dashed: pg_opt)

    if pg_and && pg_unlocks
      $and_pending << {
        item_id:  item_id,
        tool_key: pg_and,
        targets:  Array(pg_unlocks),
        optional: pg_opt
      }
    elsif pg_unlocks
      Array(pg_unlocks).each do |target|
        target_node = resolve_target(target, rooms)
        add_edge(item_id, target_node, dashed: pg_opt)
      end
    end
  end
end

# ---------------------------------------------------------------------------
# Process startItemsInInventory (player's starting items)
# These items are available from the start, sourced from the starting room
# ---------------------------------------------------------------------------
start_room = scenario['startRoom'] || scenario.dig('player', 'startRoom')
starting_items = scenario['startItemsInInventory'] || []
if starting_items.any? { |i| i['puzzle_graph_unlocks'] || i['puzzle_graph_role'] }
  add_node(start_room, room_label(start_room, rooms[start_room]), 'room') if rooms.key?(start_room)
  walk_objects(starting_items, start_room, rooms)
end

# Walk all rooms: objects then NPC itemsHeld
rooms.each do |room_id, room|
  # Ensure room node exists when objects are found in it
  add_node(room_id, room_label(room_id, room), 'room') if (room['objects'] || []).any? { |o|
    o['puzzle_graph_unlocks'] || o['puzzle_graph_role'] ||
    (o['contents'] || []).any? { |c| c['puzzle_graph_unlocks'] || c['puzzle_graph_role'] }
  }

  walk_objects(room['objects'], room_id, rooms)

  (room['npcs'] || []).each do |npc|
    items   = npc['itemsHeld'] || []
    actions = npc['puzzle_graph_actions'] || []
    next unless items.any? { |i| i['puzzle_graph_unlocks'] || i['puzzle_graph_role'] } || actions.any?

    npc_display = npc['displayName'] || npc['name'] || npc['id'].to_s
    npc_nid     = "npc_#{nid(npc_display)}"
    add_node(npc_nid, npc_display, 'key')
    add_node(room_id, room_label(room_id, room), 'room')
    add_edge(room_id, npc_nid)
    walk_objects(items, npc_nid, rooms)

    # NPC conversation / interaction action nodes
    actions.each do |action|
      act_raw   = action['id'] || action['label'].to_s
      act_id    = "action_#{nid(act_raw)}"
      act_label = action['label'] || act_raw.tr('_', ' ').split.map(&:capitalize).join(' ')
      add_node(act_id, act_label, 'action')
      add_edge(npc_nid, act_id)
      $action_aim_links << { from: act_id, to: "aim_#{nid(action['unlocks_aim'])}" } if action['unlocks_aim']
    end
  end
end

# ---------------------------------------------------------------------------
# Resolve AND-gates
# Group by (tool_key + sorted targets) so the same gate is reused when
# the same tool decodes multiple notes pointing to the same locks.
# ---------------------------------------------------------------------------
gate_map = {}  # gate_key => gate_node_id

$and_pending.each do |entry|
  gate_key = "#{entry[:tool_key]}|#{entry[:targets].sort.join(',')}"

  unless gate_map[gate_key]
    $and_idx += 1
    gate_id  = "andgate#{$and_idx}"
    add_node(gate_id, '+', 'gate')

    # Tool → gate (dashed — tool is a helper, not consumed)
    tool_node = nid(entry[:tool_key])
    add_edge(tool_node, gate_id, dashed: true)

    # Gate → each unlock target
    entry[:targets].each do |target|
      add_edge(gate_id, resolve_target(target, rooms))
    end

    gate_map[gate_key] = gate_id
  end

  # Note item → gate
  add_edge(entry[:item_id], gate_map[gate_key])
end

# ---------------------------------------------------------------------------
# VM challenges from objectives
# ---------------------------------------------------------------------------
vm_challenge_ids = []
prev_flag_id     = nil

(scenario['objectives'] || []).each do |obj_block|
  (obj_block['tasks'] || []).each do |task|
    next unless task['type'] == 'submit_flags'

    task_id = task['taskId'] || "challenge_#{vm_challenge_ids.size + 1}"
    cid    = "vmch_#{nid(task_id)}"
    flid   = "vmfl_#{nid(task_id)}"
    clabel = task['title'] || task_id.tr('_', ' ').split.map(&:capitalize).join(' ')
    flabel = task_id.sub(/\Asubmit_/, '').sub(/_flag\z/, '').tr('_', ' ').split.map(&:capitalize).join(' ') + ' Flag'

    add_node(cid,  clabel, 'vm')
    add_node(flid, flabel, 'flag')
    add_edge(cid,  flid)
    add_edge(prev_flag_id, cid, dashed: true) if prev_flag_id

    if (pg_unlocks = task['puzzle_graph_unlocks'])
      Array(pg_unlocks).each { |t| add_edge(flid, resolve_target(t, rooms)) }
    end

    vm_challenge_ids << cid
    prev_flag_id = flid
  end
end

# Connect VM launcher lock node to first VM challenge
# Find any vm-launcher object in the scenario
vm_launcher_id = nil
vm_launcher_name = nil
vm_launcher_room_id = nil

rooms.each do |room_id, room|
  (room['objects'] || []).each do |obj|
    if obj['type'] == 'vm-launcher' && obj['id']
      vm_launcher_id = obj['id']
      vm_launcher_name = obj['name'] || obj['id'].tr('_', ' ').split.map(&:capitalize).join(' ')
      vm_launcher_room_id = room_id
      break
    end
  end
  break if vm_launcher_id
end

if vm_launcher_id && vm_challenge_ids.any?
  vm_lock_id = "lock_#{vm_launcher_id}"
  vm_node_id = nid(vm_launcher_name)

  # Connect lock → vm-launcher → first challenge
  if $nodes.key?(vm_lock_id) && $nodes.key?(vm_node_id)
    add_edge(vm_lock_id, vm_node_id)
    add_edge(vm_node_id, vm_challenge_ids.first)
  elsif $nodes.key?(vm_node_id)
    # No lock node, just connect vm-launcher directly to challenges
    add_edge(vm_node_id, vm_challenge_ids.first)
  end

  # Anchor the lock to its room if not already connected
  if vm_launcher_room_id && $nodes.key?(vm_lock_id)
    add_node(vm_launcher_room_id, room_label(vm_launcher_room_id, rooms[vm_launcher_room_id]), 'room')
    # Only add edge if it doesn't already exist (room might already reference the vm-launcher via puzzle_graph_role)
    existing_edge = $edges.any? { |e| e[:from] == vm_launcher_room_id && (e[:to] == vm_lock_id || e[:to] == vm_node_id) }
    add_edge(vm_launcher_room_id, vm_lock_id) unless existing_edge
  end
end

# ---------------------------------------------------------------------------
# Room-to-room connections (physical layout)
# Locked destinations are skipped — their access is shown via the key chain.
# Open connections are shown once per pair (sorted dedup).
# ---------------------------------------------------------------------------
seen_room_pairs = Set.new

rooms.each do |room_id, room|
  add_node(room_id, room_label(room_id, room), 'room')

  (room['connections'] || {}).each_value do |dest|
    Array(dest).each do |dest_id|
      # Locked source or destination — access already shown via key/puzzle chain
      next if room['locked'] || rooms.dig(dest_id, 'locked')

      pair_key = [room_id, dest_id].sort.join('|')
      next if seen_room_pairs.include?(pair_key)
      seen_room_pairs << pair_key

      if rooms.key?(dest_id)
        add_node(dest_id, room_label(dest_id, rooms[dest_id]), 'room')
      else
        add_node(dest_id, dest_id.tr('_', ' ').split.map(&:capitalize).join(' '), 'room')
      end

      add_edge(room_id, dest_id)
    end
  end
end

# ---------------------------------------------------------------------------
# puzzle_graph_links — explicit cross-object edges resolved after all nodes exist
# Use this to connect nodes whose IDs aren't yet known at walk_objects processing
# time (e.g. action nodes from later rooms, aim nodes, NPC nodes).
# ---------------------------------------------------------------------------
$pg_aim_links = []  # [{obj_id:, aim_id:}] for integrated bridge edges

rooms.each do |room_id, room|
  (room['objects'] || []).each do |obj|
    # puzzle_graph_links: add edges between named nodes (puzzle graph)
    (obj['puzzle_graph_links'] || []).each do |link|
      from_raw = link['from'].to_s
      to_raw   = link['to'].to_s
      from_id  = $nodes.key?(from_raw) ? from_raw : nid(from_raw)
      to_id    = $nodes.key?(to_raw)   ? to_raw   : nid(to_raw)
      add_edge(from_id, to_id, dashed: link.fetch('dashed', false))
    end

    # puzzle_graph_aim: connect this object to a story aim (integrated graph only)
    if (pg_aim = obj['puzzle_graph_aim'])
      obj_id  = obj['id'] || nid((obj['name'] || obj['type']).to_s)
      obj_nid = (obj['puzzle_graph_role'] == 'lock' && !obj['locked']) ? "lock_#{obj_id}" : nid(obj['name'] || obj_id)
      $pg_aim_links << { obj_id: obj_nid, aim_id: "aim_#{nid(pg_aim)}" }
    end
  end
end

# ---------------------------------------------------------------------------
# Prune nodes that ended up with no edges (never connected to anything)
# ---------------------------------------------------------------------------
connected = Set.new($edges.flat_map { |e| [e[:from], e[:to]] })
$nodes.reject! { |id, n| n[:klass] == 'room' && !connected.include?(id) }
$edges.reject! { |e| !$nodes.key?(e[:from]) || !$nodes.key?(e[:to]) }

# ---------------------------------------------------------------------------
# Build Aim (story) graph
# ---------------------------------------------------------------------------
aim_nodes    = {}
aim_edges    = []
aim_edge_set = Set.new

(scenario['objectives'] || []).each do |aim|
  aid = "aim_#{nid(aim['aimId'])}"
  aim_nodes[aid] = {
    label:    aim['title'],
    klass:    'aim',
    optional: aim['optional'] == true,
    order:    aim['order'] || 0
  }
end

(scenario['objectives'] || []).each do |aim|
  aid  = "aim_#{nid(aim['aimId'])}"
  cond = aim['unlockCondition']

  if cond&.key?('aimCompleted')
    prev = "aim_#{nid(cond['aimCompleted'])}"
    key  = "#{prev}|#{aid}"
    unless aim_edge_set.include?(key)
      aim_edges << { from: prev, to: aid, dashed: true }
      aim_edge_set << key
    end
  elsif cond&.key?('aimsCompleted')
    gate_id = "aim_andgate_#{nid(aim['aimId'])}"
    aim_nodes[gate_id] = { label: '+', klass: 'aim_gate', optional: false }
    cond['aimsCompleted'].each do |a|
      from_id = "aim_#{nid(a)}"
      key     = "#{from_id}|#{gate_id}"
      unless aim_edge_set.include?(key)
        aim_edges << { from: from_id, to: gate_id, dashed: false }
        aim_edge_set << key
      end
    end
    key2 = "#{gate_id}|#{aid}"
    unless aim_edge_set.include?(key2)
      aim_edges << { from: gate_id, to: aid, dashed: false }
      aim_edge_set << key2
    end
  end

  (aim['tasks'] || []).each do |task|
    next unless (ua = task.dig('onComplete', 'unlockAim'))
    to_id = "aim_#{nid(ua)}"
    next if to_id == aid  # skip self-referential onComplete (aim activating itself)
    key   = "#{aid}|#{to_id}"
    unless aim_edge_set.include?(key)
      aim_edges << { from: aid, to: to_id, dashed: true }
      aim_edge_set << key
    end
  end
end

# ---------------------------------------------------------------------------
# Integrated graph: puzzle + aims + bridge edges
# ---------------------------------------------------------------------------
int_nodes    = $nodes.merge(aim_nodes)
int_edges    = $edges.dup + aim_edges.dup
int_edge_set = Set.new(int_edges.map { |e| "#{e[:from]}|#{e[:to]}" })

add_bridge = lambda do |from_id, to_id, dashed: true|
  return unless from_id && to_id && from_id != to_id
  return unless int_nodes.key?(from_id) && int_nodes.key?(to_id)
  key = "#{from_id}|#{to_id}"
  return if int_edge_set.include?(key)
  int_edges << { from: from_id, to: to_id, dashed: dashed }
  int_edge_set << key
end

(scenario['objectives'] || []).each do |aim|
  aid = "aim_#{nid(aim['aimId'])}"

  (aim['tasks'] || []).each do |task|
    task_type   = task['type']
    target_room = task['targetRoom']
    target_obj  = task['targetObject']

    # enter_room / unlock_room → locked door or room node is a prereq for this aim
    if %w[enter_room unlock_room].include?(task_type) && target_room
      door_id = "door_#{target_room}"
      if int_nodes.key?(door_id)
        add_bridge.call(door_id, aid)
      elsif int_nodes.key?(target_room)
        add_bridge.call(target_room, aid)
      end
    end

    # submit_flags → the vm flag node is a prereq for this aim (auto-bridge)
    if task_type == 'submit_flags'
      flid = "vmfl_#{nid(task['taskId'] || '')}"
      add_bridge.call(flid, aid) if int_nodes.key?(flid)
    end

    # unlock_object → the object's lock node is a prereq for this aim
    if task_type == 'unlock_object' && target_obj
      lock_id = "lock_#{nid(target_obj)}"
      add_bridge.call(lock_id, aid) if int_nodes.key?(lock_id)
    end

    # collect_items with targetItemIds → each item node is a prereq (OR condition)
    Array(task['targetItemIds']).each do |item_id|
      add_bridge.call(nid(item_id), aid)
    end

    # onComplete.unlockAim — task completion triggers NEXT aim's unlock
    next unless (ua = task.dig('onComplete', 'unlockAim'))
    to_id = "aim_#{nid(ua)}"
    next if to_id == aid

    tid = task['taskId'] || ''
    add_bridge.call("vmfl_#{nid(tid)}", to_id)
    add_bridge.call(target_room, to_id) if target_room
  end
end

# NPC conversation action nodes → aim bridges (puzzle_graph_actions metadata)
$action_aim_links.each do |link|
  add_bridge.call(link[:from], link[:to])
end

# Object → aim bridges (puzzle_graph_aim metadata)
$pg_aim_links.each do |link|
  add_bridge.call(link[:obj_id], link[:aim_id])
end

# ---------------------------------------------------------------------------
# Critical path (longest path in aim DAG)
# ---------------------------------------------------------------------------
def longest_path_in_dag(nodes, edges)
  adj    = Hash.new { |h, k| h[k] = [] }
  in_deg = Hash.new(0)
  nodes.each_key { |id| in_deg[id] = 0 unless in_deg.key?(id) }
  edges.each do |e|
    next unless nodes.key?(e[:from]) && nodes.key?(e[:to])
    adj[e[:from]] << e[:to]
    in_deg[e[:to]] += 1
  end

  queue = in_deg.select { |_, d| d == 0 }.keys.sort
  topo  = []
  until queue.empty?
    u = queue.shift
    topo << u
    adj[u].sort.each do |v|
      in_deg[v] -= 1
      queue << v if in_deg[v] == 0
    end
  end

  dist   = Hash.new(0)
  parent = {}
  topo.each do |u|
    adj[u].each do |v|
      if dist[u] + 1 > dist[v]
        dist[v]   = dist[u] + 1
        parent[v] = u
      end
    end
  end

  sink = nodes.key?('aim_close_the_case') ? 'aim_close_the_case' : dist.max_by { |_, v| v }&.first
  path = []
  n    = sink
  while n
    path.unshift(n)
    n = parent[n]
  end
  [path, dist[sink] || 0]
end

critical_path, critical_length = longest_path_in_dag(aim_nodes, aim_edges)
critical_set = Set.new(critical_path)

# ---------------------------------------------------------------------------
# Mermaid emitter (shared by puzzle / story / integrated tabs)
# ---------------------------------------------------------------------------
def emit_mermaid_diagram(nodes, edges, critical_set: Set.new, start_node: nil)
  # Ensure the start room is present as a node even if it has no puzzle elements
  if start_node && !nodes.key?(start_node)
    label = start_node.tr('_', ' ').split.map(&:capitalize).join(' ')
    nodes = nodes.merge(start_node => { label: label, klass: 'room', optional: false })
  end

  lines = ['flowchart TD', '']
  lines << '  classDef room      fill:#0f2d2d,stroke:#22ddcc,color:#a0ffee'
  lines << '  classDef lock      fill:#2d0f0f,stroke:#e66060,color:#ffa0a0'
  lines << '  classDef key       fill:#2d0812,stroke:#e66060,color:#ffa0a0'
  lines << '  classDef item      fill:#2d1200,stroke:#e89030,color:#ffcc80'
  lines << '  classDef gate      fill:#111,stroke:#666,color:#eee'
  lines << '  classDef vm        fill:#0c1f40,stroke:#4a90d9,color:#a0c8ff'
  lines << '  classDef flag      fill:#1a0c2d,stroke:#9060d0,color:#cc99ff'
  lines << '  classDef action    fill:#1a1200,stroke:#cc9922,color:#ffee88'
  lines << '  classDef aim       fill:#0d2a0d,stroke:#44cc44,color:#88ff88'
  lines << '  classDef aim_gate  fill:#111111,stroke:#44cc44,color:#44cc44'
  lines << '  classDef container fill:#1a2d1a,stroke:#60b060,color:#a0e0a0'
  lines << '  classDef npc       fill:#2d1f0d,stroke:#d0a050,color:#ffe0a0'
  lines << '  classDef critical  fill:#2a1500,stroke:#ffaa00,color:#ffdd88'
  lines << '  classDef start     fill:#003322,stroke:#00ffaa,color:#00ffaa'
  lines << ''

  # Emit START anchor first so Mermaid places it at the top
  if start_node
    lines << '  node_start(("▶"))'
    lines << "  node_start --> #{start_node}"
    lines << ''
  end

  nodes.each do |id, n|
    lbl   = n[:label].to_s.gsub('"', "'")
    klass = n[:klass].to_s
    shape = case klass
    when 'room'                then "(\"#{lbl}\")"
    when 'lock', 'vm'          then "[\"#{lbl}\"]"
    when 'key', 'item', 'flag' then "{\"#{lbl}\"}"
    when 'gate', 'aim_gate'    then "((\" + \"))"
    when 'action'              then ">\"#{lbl}\"]"
    when 'aim'                 then "{{\"#{lbl}\"}}"
    when 'container'           then "[[\"#{lbl}\"]]"
    when 'npc'                 then "(\"#{lbl}\")"
    else                            "(\"#{lbl}\")"
    end
    lines << "  #{id}#{shape}"
  end
  lines << ''

  edges.each do |e|
    arr  = e[:dashed] ? '-.->' : '-->'
    elbl = e[:label] ? "|#{e[:label]}|" : ''
    lines << "  #{e[:from]} #{arr}#{elbl} #{e[:to]}"
  end
  lines << ''

  effective = nodes.to_h { |id, n| [id, critical_set.include?(id) ? 'critical' : n[:klass].to_s] }
  effective.group_by { |_, k| k }.each do |klass, grp|
    lines << "  class #{grp.map(&:first).join(',')} #{klass}"
  end

  opt_ids = nodes.reject { |id, _| critical_set.include?(id) }.select { |_, n| n[:optional] }.keys
  unless opt_ids.empty?
    lines << ''
    lines << '  classDef optional stroke-dasharray:5 2'
    lines << "  class #{opt_ids.join(',')} optional"
  end

  lines << '  class node_start start' if start_node

  lines.join("\n")
end

def js_escape_mermaid(src)
  src.gsub('`') { '\`' }.gsub('${') { '\${' }
end

mermaid_puzzle     = emit_mermaid_diagram($nodes,     $edges,     start_node: start_room)
mermaid_story      = emit_mermaid_diagram(aim_nodes,  aim_edges,  critical_set: critical_set)
mermaid_integrated = emit_mermaid_diagram(int_nodes,  int_edges,  critical_set: critical_set, start_node: start_room)

# ---------------------------------------------------------------------------
# Rooms-only graph (physical layout — all rooms + all connections)
# Locked rooms are styled as 'lock' (red) so inaccessible rooms stand out.
# ---------------------------------------------------------------------------
rooms_nodes    = {}
rooms_edges    = []
rooms_edge_set = Set.new

rooms.each do |room_id, room|
  klass = room['locked'] ? 'lock' : 'room'
  label = room_label(room_id, room)
  label += '<br/>(locked)' if room['locked']
  rooms_nodes[room_id] = { label: label, klass: klass, optional: false }
end

rooms.each do |room_id, room|
  (room['connections'] || {}).each_value do |dest|
    Array(dest).each do |dest_id|
      next unless rooms_nodes.key?(dest_id)
      pair_key = [room_id, dest_id].sort.join('|')
      next if rooms_edge_set.include?(pair_key)
      rooms_edge_set << pair_key
      rooms_edges << { from: room_id, to: dest_id, dashed: false }
    end
  end
end

mermaid_rooms = emit_mermaid_diagram(rooms_nodes, rooms_edges, start_node: start_room)

# ---------------------------------------------------------------------------
# Rooms + Contents graph (physical layout: rooms, items, containers, NPCs)
# ---------------------------------------------------------------------------
$rc_counter = 0
rc_nodes    = {}
rc_edges    = []
rc_edge_set = Set.new

def walk_room_contents(objects, parent_id, rc_nodes, rc_edges, rc_edge_set)
  (objects || []).each do |obj|
    $rc_counter += 1
    raw_id       = obj['id'] || "obj#{$rc_counter}"
    obj_name     = obj['name'] || raw_id.tr('_', ' ').split.map(&:capitalize).join(' ')
    node_id      = "rc_#{nid(raw_id)}_#{$rc_counter}"
    has_contents = !obj['contents'].nil? && !obj['contents'].empty?
    klass        = has_contents ? 'container' : 'item'
    rc_nodes[node_id] = { label: obj_name, klass: klass, optional: false }
    unless rc_edge_set.include?("#{parent_id}|#{node_id}")
      rc_edge_set << "#{parent_id}|#{node_id}"
      rc_edges << { from: parent_id, to: node_id, dashed: false }
    end
    walk_room_contents(obj['contents'], node_id, rc_nodes, rc_edges, rc_edge_set) if has_contents
  end
end

rooms.each do |room_id, room|
  klass = room['locked'] ? 'lock' : 'room'
  label = room_label(room_id, room)
  label += '<br/>(locked)' if room['locked']
  rc_nodes[room_id] = { label: label, klass: klass, optional: false }
end

rc_pair_set = Set.new
rooms.each do |room_id, room|
  (room['connections'] || {}).each_value do |dest|
    Array(dest).each do |dest_id|
      next unless rc_nodes.key?(dest_id)
      pair_key = [room_id, dest_id].sort.join('|')
      next if rc_pair_set.include?(pair_key)
      rc_pair_set << pair_key
      rc_edges << { from: room_id, to: dest_id, dashed: false }
    end
  end
end

rooms.each do |room_id, room|
  walk_room_contents(room['objects'], room_id, rc_nodes, rc_edges, rc_edge_set)
  (room['npcs'] || []).each do |npc|
    $rc_counter += 1
    npc_name = npc['displayName'] || npc['name'] || npc['id'].to_s
    npc_id   = "rc_npc_#{nid(npc_name)}_#{$rc_counter}"
    rc_nodes[npc_id] = { label: npc_name, klass: 'npc', optional: false }
    unless rc_edge_set.include?("#{room_id}|#{npc_id}")
      rc_edge_set << "#{room_id}|#{npc_id}"
      rc_edges << { from: room_id, to: npc_id, dashed: false }
    end
    walk_room_contents(npc['itemsHeld'], npc_id, rc_nodes, rc_edges, rc_edge_set)
  end
end

mermaid_contents = emit_mermaid_diagram(rc_nodes, rc_edges, start_node: start_room)

# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------
total_aims     = (scenario['objectives'] || []).size
total_tasks    = (scenario['objectives'] || []).sum { |a| (a['tasks'] || []).size }
optional_tasks = (scenario['objectives'] || []).sum { |a| (a['tasks'] || []).count { |t| t['optional'] } }
vm_tasks       = (scenario['objectives'] || []).sum { |a| (a['tasks'] || []).count { |t| t['type'] == 'submit_flags' } }
story_and_gates = (scenario['objectives'] || []).count { |a| a.dig('unlockCondition', 'aimsCompleted') }
and_gates_n     = $and_idx + story_and_gates
lock_count     = $nodes.count { |_, n| n[:klass] == 'lock' }
room_count     = $nodes.count { |_, n| n[:klass] == 'room' }

path_labels = critical_path.map { |id|
  (aim_nodes[id] || {})[:label] || id.sub(/\Aaim_andgate_/, '+ ').sub(/\Aaim_/, '').tr('_', ' ').split.map(&:capitalize).join(' ')
}.join(' → ')

# ---------------------------------------------------------------------------
# HTML wrapper — 3 tabs (Puzzle / Story Aims / Story + Puzzle) + stats panel
# ---------------------------------------------------------------------------
brief_full = (scenario['scenario_brief'] || SCENARIO_ID).to_s
brief = brief_full.length <= 160 ? brief_full : brief_full[0, 160].sub(/\s+\S*\z/, '') + '…'
html  = <<~HTML
  <!-- Auto-generated by scripts/generate_dungeon_graph.rb — do not edit by hand -->
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>#{SCENARIO_ID} — Dungeon Graph</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/svg-pan-zoom@3/dist/svg-pan-zoom.min.js"></script>
    <style>
      *, *::before, *::after { box-sizing: border-box; }
      body       { background: #0a0f0f; color: #ccc; font-family: monospace; margin: 0; padding: 16px; }
      h1         { font-size: 13px; color: #22ddcc; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px; }
      p.sub      { font-size: 11px; color: #555; margin: 0 0 12px; }
      .tab-bar   { display: flex; gap: 3px; margin-bottom: 0; border-bottom: 2px solid #1a3030; }
      .tab-bar button {
        background: #111e1e; color: #557; border: 1px solid #1a3030; border-bottom: none;
        padding: 6px 16px; font-family: monospace; font-size: 11px; cursor: pointer;
        text-transform: uppercase; letter-spacing: 1px; position: relative; top: 2px;
      }
      .tab-bar button.active  { background: #0a1a1a; color: #22ddcc; border-color: #22ddcc; border-bottom: 2px solid #0a1a1a; }
      .tab-bar button:hover:not(.active) { background: #141f1f; color: #aaa; }
      .diagram-container { position: relative; }
      .wrap      { overflow: hidden; background: #0a1a1a; height: 70vh; min-height: 300px; border: 1px solid #1a3030; border-top: none; }
      .zoom-controls {
        position: absolute; top: 8px; right: 8px; z-index: 10;
        display: flex; flex-direction: column; gap: 3px;
      }
      .zoom-btn {
        background: #0a1414cc; color: #22ddcc; border: 1px solid #1a4040;
        width: 28px; height: 28px; font-family: monospace; font-size: 14px;
        cursor: pointer; padding: 0; line-height: 26px; text-align: center;
        display: block; border-radius: 3px;
      }
      .zoom-btn:hover { background: #112828ee; border-color: #22ddcc; }
      #diagram-container:fullscreen { background: #0a0f0f; }
      #diagram-container:fullscreen .wrap { height: 100vh; border: none; }
      .stats     { margin-top: 20px; border-top: 2px solid #1a3030; padding-top: 14px; }
      .stats h2  { font-size: 12px; color: #22ddcc; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px; }
      .crit-path { font-size: 11px; color: #ffdd88; background: #111; border: 1px solid #333; padding: 8px 12px; margin-bottom: 10px; overflow-x: auto; white-space: nowrap; }
      .note-oos  { font-size: 11px; color: #a0a040; border-left: 2px solid #555; padding: 4px 8px; margin-bottom: 12px; }
      table      { border-collapse: collapse; font-size: 11px; }
      td, th     { padding: 3px 14px 3px 0; text-align: left; }
      th         { color: #22ddcc; font-weight: normal; }
      td.val     { color: #ffcc80; }
      .legend        { margin-top: 20px; border-top: 2px solid #1a3030; padding-top: 14px; }
      .legend h2     { font-size: 12px; color: #22ddcc; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px; }
      .legend-grid   { display: flex; flex-wrap: wrap; gap: 6px 24px; }
      .legend-section { min-width: 160px; }
      .legend-section h3 { font-size: 10px; color: #557; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 5px; }
      .legend-item   { display: flex; align-items: center; gap: 7px; margin-bottom: 4px; font-size: 11px; color: #aaa; }
      .ln            { display: inline-block; width: 14px; height: 14px; border-radius: 2px; flex-shrink: 0; }
      .ln-room       { background: #0f2d2d; border: 1px solid #22ddcc; border-radius: 6px; }
      .ln-lock       { background: #2d0f0f; border: 1px solid #e66060; }
      .ln-key        { background: #2d0812; border: 1px solid #e66060; transform: rotate(45deg); border-radius: 1px; }
      .ln-item       { background: #2d1200; border: 1px solid #e89030; transform: rotate(45deg); border-radius: 1px; }
      .ln-vm         { background: #0c1f40; border: 1px solid #4a90d9; }
      .ln-flag       { background: #1a0c2d; border: 1px solid #9060d0; transform: rotate(45deg); border-radius: 1px; }
      .ln-action     { background: #1a1200; border: 1px solid #cc9922; border-radius: 0 4px 4px 0; }
      .ln-aim        { background: #0d2a0d; border: 1px solid #44cc44; border-radius: 3px; }
      .ln-critical   { background: #2a1500; border: 1px solid #ffaa00; border-radius: 3px; }
      .ln-gate       { background: #111; border: 1px solid #666; border-radius: 7px; }
      .ln-container  { background: #1a2d1a; border: 1px solid #60b060; }
      .ln-npc        { background: #2d1f0d; border: 1px solid #d0a050; border-radius: 6px; }
      .edge-row      { display: flex; align-items: center; gap: 7px; margin-bottom: 4px; font-size: 11px; color: #aaa; }
      .edge-solid    { width: 28px; height: 2px; background: #888; }
      .edge-dashed   { width: 28px; height: 0; border-top: 2px dashed #666; }
      .edge-opt      { width: 28px; height: 0; border-top: 2px dashed #444; }
    </style>
  </head>
  <body>
    <h1>#{SCENARIO_ID} — dependency graph</h1>
    <p class="sub">#{brief}</p>
    <div class="tab-bar">
      <button class="tab-btn active" data-tab="puzzle"     onclick="showTab('puzzle',this)">Puzzle Graph</button>
      <button class="tab-btn"        data-tab="story"      onclick="showTab('story',this)">Story Aims</button>
      <button class="tab-btn"        data-tab="integrated" onclick="showTab('integrated',this)">Story + Puzzle</button>
      <button class="tab-btn"        data-tab="rooms"      onclick="showTab('rooms',this)">Rooms</button>
      <button class="tab-btn"        data-tab="contents"   onclick="showTab('contents',this)">Rooms &amp; Contents</button>
    </div>
    <div class="diagram-container" id="diagram-container">
      <div class="wrap" id="diagram-wrap">
        <p style="color:#555;font-size:11px;padding:12px">Loading…</p>
      </div>
      <div class="zoom-controls">
        <button class="zoom-btn" onclick="zoomIn()"          title="Zoom in">+</button>
        <button class="zoom-btn" onclick="zoomOut()"         title="Zoom out">−</button>
        <button class="zoom-btn" onclick="zoomFit()"         title="Fit to view" style="font-size:11px">Fit</button>
        <button class="zoom-btn" onclick="zoomReset()"       title="Reset zoom" style="font-size:11px">1:1</button>
        <button class="zoom-btn" onclick="toggleFullscreen()" title="Fullscreen">⛶</button>
      </div>
    </div>

    <div class="legend">
      <h2>Legend</h2>
      <div class="legend-grid">
        <div class="legend-section">
          <h3>Nodes</h3>
          <div class="legend-item"><span class="ln ln-room"></span> Room / area</div>
          <div class="legend-item"><span class="ln ln-lock"></span> Lock / interactive terminal</div>
          <div class="legend-item"><span class="ln ln-key"></span> NPC / physical key</div>
          <div class="legend-item"><span class="ln ln-item"></span> Inventory item / credential</div>
          <div class="legend-item"><span class="ln ln-vm"></span> VM challenge</div>
          <div class="legend-item"><span class="ln ln-flag"></span> VM flag (completion)</div>
          <div class="legend-item"><span class="ln ln-action"></span> NPC conversation / action gate</div>
          <div class="legend-item"><span class="ln ln-aim"></span> Story aim (objective)</div>
          <div class="legend-item"><span class="ln ln-critical"></span> Critical path node</div>
          <div class="legend-item"><span class="ln ln-gate"></span> AND gate (all inputs required)</div>
          <div class="legend-item"><span class="ln ln-container"></span> Container (holds items)</div>
          <div class="legend-item"><span class="ln ln-npc"></span> NPC (character in room)</div>
        </div>
        <div class="legend-section">
          <h3>Edges</h3>
          <div class="edge-row"><span class="edge-solid"></span> Hard dependency (required)</div>
          <div class="edge-row"><span class="edge-dashed"></span> Soft dependency / narrative unlock</div>
          <div class="edge-row"><span class="edge-opt"></span> Optional path</div>
        </div>
        <div class="legend-section">
          <h3>Shapes</h3>
          <div class="legend-item">Rounded rect — room</div>
          <div class="legend-item">Rectangle — lock / VM challenge</div>
          <div class="legend-item">Diamond — item / key / flag</div>
          <div class="legend-item">Ribbon — conversation / action gate</div>
          <div class="legend-item">Hexagon — story aim</div>
          <div class="legend-item">Circle — AND gate</div>
        </div>
      </div>
    </div>

    <div class="stats">
      <h2>Critical Path — #{critical_length} hops</h2>
      <div class="crit-path">#{path_labels}</div>
      <div class="note-oos">
        ⚠️&nbsp; Dashed aim arrows = narrative unlock only. A player with physical access to a room may complete an
        objective before the system unlocks that aim. Solid arrows indicate hard dependencies (AND gates, physical
        puzzle-lock chains). The critical path above shows the minimum mandatory sequence to reach mission completion.
      </div>
      <table>
        <tr><th>Aims (story objectives)</th><td class="val">#{total_aims}</td></tr>
        <tr><th>Total tasks</th><td class="val">#{total_tasks}</td></tr>
        <tr><th>Optional tasks</th><td class="val">#{optional_tasks} / #{total_tasks}</td></tr>
        <tr><th>VM flag challenges</th><td class="val">#{vm_tasks}</td></tr>
        <tr><th>AND-gate convergences</th><td class="val">#{and_gates_n}</td></tr>
        <tr><th>Physical locks (puzzle)</th><td class="val">#{lock_count}</td></tr>
        <tr><th>Rooms</th><td class="val">#{room_count}</td></tr>
        <tr><th>Puzzle nodes / edges</th><td class="val">#{$nodes.size} / #{$edges.size}</td></tr>
        <tr><th>Story nodes / edges</th><td class="val">#{aim_nodes.size} / #{aim_edges.size}</td></tr>
      </table>
    </div>

    <script>
      mermaid.initialize({ startOnLoad: false, theme: 'dark', flowchart: { curve: 'basis', htmlLabels: true } });

      const diagrams = {
        puzzle:     \`#{js_escape_mermaid(mermaid_puzzle)}\`,
        story:      \`#{js_escape_mermaid(mermaid_story)}\`,
        integrated: \`#{js_escape_mermaid(mermaid_integrated)}\`,
        rooms:      \`#{js_escape_mermaid(mermaid_rooms)}\`,
        contents:   \`#{js_escape_mermaid(mermaid_contents)}\`
      };
      const rendered = {};
      let seq = 0;
      let panZoom = null;

      function initPanZoom() {
        if (panZoom) { try { panZoom.destroy(); } catch(_) {} panZoom = null; }
        const svg = document.querySelector('#diagram-wrap svg');
        if (!svg) return;
        svg.style.maxWidth = 'none';
        svg.setAttribute('width',  '100%');
        svg.setAttribute('height', '100%');
        panZoom = svgPanZoom(svg, {
          zoomEnabled: true, controlIconsEnabled: false,
          fit: true, center: true,
          minZoom: 0.02, maxZoom: 30, zoomScaleSensitivity: 0.3
        });
      }

      function zoomIn()    { if (panZoom) panZoom.zoomIn(); }
      function zoomOut()   { if (panZoom) panZoom.zoomOut(); }
      function zoomFit()   { if (panZoom) { panZoom.fit(); panZoom.center(); } }
      function zoomReset() { if (panZoom) { panZoom.resetZoom(); panZoom.center(); } }

      function toggleFullscreen() {
        const el = document.getElementById('diagram-container');
        if (document.fullscreenElement) document.exitFullscreen();
        else el.requestFullscreen();
      }

      document.addEventListener('fullscreenchange', () => {
        setTimeout(() => { if (panZoom) { panZoom.resize(); panZoom.fit(); panZoom.center(); } }, 50);
      });

      async function showTab(name, btn) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        (btn || document.querySelector('.tab-btn[data-tab="' + name + '"]')).classList.add('active');
        const wrap = document.getElementById('diagram-wrap');
        if (!rendered[name]) {
          wrap.innerHTML = '<p style="color:#555;font-size:11px;padding:12px">Rendering\u2026</p>';
          try {
            const { svg } = await mermaid.render('diag_' + name + '_' + (++seq), diagrams[name]);
            rendered[name] = svg;
          } catch(e) {
            rendered[name] = '<pre style="color:#f66;font-size:10px;padding:12px">Render error: ' + e.message + '</pre>';
          }
        }
        wrap.innerHTML = rendered[name];
        initPanZoom();
      }
      showTab('puzzle');
    </script>
  </body>
  </html>
HTML

File.write(OUT_FILE, html)
puts "Written: #{OUT_FILE}"

# ---------------------------------------------------------------------------
# Companion Markdown — AI-readable graph reference
# Each diagram is a labelled fenced mermaid block with prose context so an
# AI agent can load this single file and reason about the scenario structure.
# ---------------------------------------------------------------------------
md = <<~MD
  <!-- Auto-generated by scripts/generate_dungeon_graph.rb — do not edit by hand -->

  # #{SCENARIO_ID} — Scenario Graph Reference

  #{brief_full}

  ## Scenario Statistics

  | Metric | Value |
  |---|---|
  | Story aims | #{total_aims} |
  | Total tasks | #{total_tasks} (#{optional_tasks} optional) |
  | VM flag challenges | #{vm_tasks} |
  | Physical locks | #{lock_count} |
  | AND-gate convergences | #{and_gates_n} |
  | Rooms | #{room_count} |
  | Puzzle graph nodes / edges | #{$nodes.size} / #{$edges.size} |
  | Story graph nodes / edges | #{aim_nodes.size} / #{aim_edges.size} |

  ## Critical Path

  #{critical_length} hops through story aims — minimum mandatory sequence to reach mission completion:

  **#{path_labels}**

  ## How to Read These Diagrams

  | Shape | Colour | Meaning |
  |---|---|---|
  | Rounded rectangle | Teal | Room / physical area |
  | Rectangle | Red | Lock, barrier, or interactive terminal |
  | Diamond | Orange | Inventory item or credential |
  | Diamond | Red/Pink | NPC or physical key |
  | Diamond | Purple | VM flag (challenge completion token) |
  | Rectangle | Blue | VM challenge |
  | Ribbon | Amber | NPC conversation / action gate |
  | Hexagon | Green | Story aim (objective) |
  | Hexagon | Amber | Critical path node |
  | Circle | Grey | AND gate (all inputs required) |
  | Subroutine rect `[[…]]` | Green | Container (holds items) |
  | Rounded rectangle | Amber | NPC in room (Rooms & Contents only) |

  Edges: `-->` solid = hard dependency; `-.->` dashed = soft / narrative dependency or optional path.

  The `▶` node marks the player's starting room.

  ## Puzzle Graph

  Physical lock–key dependency chain. Shows which items, codes, and NPC interactions are required to open each lock, and which locks gate access to each room or object. Use this to trace solvability, spot circular dependencies, and check that every key is reachable before the lock that needs it.

  ```mermaid
  #{mermaid_puzzle}
  ```

  ## Story Aims

  Narrative objective flow. Shows story aims and their unlock conditions. Critical path aims are highlighted in amber. Use this to check aim sequencing, identify gaps between objectives, and verify that the player always has a clear next goal.

  ```mermaid
  #{mermaid_story}
  ```

  ## Story + Puzzle (Integrated)

  Puzzle graph and story aims combined, with bridge edges connecting physical puzzle progress to story aim completion. Use this to verify that physical actions drive narrative progress and that no aim is left floating without a puzzle prerequisite.

  ```mermaid
  #{mermaid_integrated}
  ```

  ## Rooms

  Physical room layout with all connections. Locked rooms are shown in red. Use this to check room reachability, identify dead-end rooms with no content, and understand the spatial structure of the scenario.

  ```mermaid
  #{mermaid_rooms}
  ```

  ## Rooms & Contents

  Physical room layout with all objects, containers, NPCs, and held items. Use this to check clue distribution across rooms, verify that hints are placed before the locks they solve, and spot rooms that are under- or over-loaded with content.

  ```mermaid
  #{mermaid_contents}
  ```
MD

File.write(MD_FILE, md)

# Machine-readable puzzle graph, for tooling that needs the dependency order
# rather than a picture of it — notably the playtest harness, which uses it to
# check that a flag or lock is only reached after its prerequisites are held.
File.write(JSON_FILE, JSON.pretty_generate(
  'scenario' => File.basename(File.dirname(SCENARIO_FILE)),
  'start_room' => scenario['startRoom'],
  'nodes' => $nodes.map { |id, n| { 'id' => id, 'label' => n[:label], 'kind' => n[:klass], 'optional' => n[:optional] } },
  'edges' => $edges.map { |e| { 'from' => e[:from], 'to' => e[:to], 'soft' => e[:dashed], 'label' => e[:label] }.compact }
))
puts "Written: #{JSON_FILE}"
puts "Written: #{MD_FILE}"
puts "Puzzle     — Nodes: #{$nodes.size}  Edges: #{$edges.size}"
puts "Story      — Nodes: #{aim_nodes.size}  Edges: #{aim_edges.size}"
puts "Integrated — Nodes: #{int_nodes.size}  Edges: #{int_edges.size}"
puts "Rooms      — Nodes: #{rooms_nodes.size}  Edges: #{rooms_edges.size}"
puts "Contents   — Nodes: #{rc_nodes.size}  Edges: #{rc_edges.size}"
puts "Critical path (#{critical_length} hops): #{path_labels}"
