#!/usr/bin/env ruby
# frozen_string_literal: true

# V9 (OFFICE_LIFE_MISSIONS_PLAN.md section 4): the lock and key diff for rule 2. An office-life
# slice must add no door or gate in front of required content.
#
#   ruby scripts/lock_key_diff.rb <scenario.json.erb> --write <baseline.json>   # stage 0 baseline
#   ruby scripts/lock_key_diff.rb <scenario.json.erb> <baseline.json>           # diff against it
#
# Options:
#   --graph-json PATH   read this dungeon graph JSON instead of running generate_dungeon_graph.rb
#                       (fixture tests); it is still refused when older than the scenario file
#   --json              print the diff as JSON
#
# It runs scripts/generate_dungeon_graph.rb first (the committed dungeon_graph.json can be stale),
# then reads the lock nodes, key nodes, edges and `optional` flags the graph writes. From the
# rendered scenario it adds a hash of each lock's requirement (never the secret itself), every
# `gate`, `access` list and `wearable`, every task with its trigger, the aim chain and
# concludeRequires, and the rooms that hold required content (requiredContent, see
# required_content). The diff names what changed and flags any new lock node or gate whose far
# side holds required content or a critical-path (non-optional) lock: a door gate's far side is its
# connectedRoom, an object gate's is the object's lock node and the object itself. A new lock on an
# object is checked the same way: downstream of its lock node, and the object itself.
#
# Which rooms a new locked room, door or gate cuts off is worked out from the scenario's own
# connections and doors (snapshot 'layout', both directions, locks ignored), never from the
# graph's room edges: the graph draws none into or out of a locked room. The rooms holding
# required content or a critical-path lock that the start room reaches now but not once that room
# (or door) is removed are named. A critical-path lock the baseline had that is gone, or no longer
# locked: true, is a bypass and a RULE 2 line too, and so is a critical-path lock whose lockType or
# requirement (requires, key_id, targetFlags, requiresGlobal; keyPins and difficulty are left out)
# changed: nothing here can rank two requirements, so any change is reported, and a lock that is
# only tuned or made stricter is for the reviewer to wave through. Array members with no id are
# keyed by type and name (position when those repeat), so inserting a prop shifts nothing; locks
# whose paths differ only by the suffix a same-named sibling adds are still matched, by best fit.
#
# V9 consumes the graph's output and shares none of its code, so a change to the graph's JSON
# format needs a matching change here; test/js/lock-key-diff.test.mjs pins the fields read:
# nodes[].id/kind/optional and edges[].from/to/soft.
#
# Exit status: 0 no change; 1 changes, none guarding required content; 2 a new door or gate guards
# required content, or a critical-path lock is removed, switched off or has its lockType or
# requirement changed (rule 2); 64 usage or
# input error.
#
# Renders through BreakEscape::ScenarioBinding (the one render path), with its random values fixed
# so the requirement hashes are stable from run to run.
require 'json'
require 'digest'
require 'optparse'
require 'set'
require 'rbconfig'
require_relative '../lib/break_escape/scenario_binding'

module LockKeyDiff
  TOOL = 'scripts/lock_key_diff.rb (V9)'
  FORMAT = 3
  REQ_KEYS = %w[lockType requires keyPins key_id targetFlags difficulty requiresGlobal requireGlobal].freeze
  # What a lock asks of the player (a change is a rule 2 line on a critical-path lock); keyPins and
  # difficulty are left out, they tune a lock without swapping what opens it.
  REQUIRES_KEYS = %w[requires key_id targetFlags requiresGlobal requireGlobal].freeze
  GATE_KEYS = %w[gate access wearable].freeze
  TASK_DROP = %w[title description _comment status currentCount showProgress].freeze

  # The shared binding with its random draws fixed, so two renders of one template hash alike.
  class StableBinding < BreakEscape::ScenarioBinding
    def initialize(vm_context = {})
      super
      @random_password = 'V9STABLEPW'
      @random_pin = '0000'
      @random_code = 'deadbeef'
    end
  end

  module_function

  def h(obj)
    Digest::SHA256.hexdigest(JSON.generate(obj))[0, 16]
  end

  RENDER_SEED = 0x5EED

  # Kernel#rand is seeded around each render, so a template that calls rand itself also hashes
  # alike. Anything unseeded (SecureRandom in the template) is caught by rendering twice.
  def render(erb_path)
    text = File.read(erb_path)
    once = lambda do
      srand(RENDER_SEED)
      StableBinding.render(text)
    end
    first = once.call
    second = once.call
    srand
    unless first == second
      raise "#{erb_path} renders differently each time (a random value outside random_password/random_pin/random_code " \
            'or Kernel#rand, such as SecureRandom): the requirement hashes would not be stable'
    end
    JSON.parse(first)
  end

  def run_graph(erb_path)
    script = File.expand_path('generate_dungeon_graph.rb', __dir__)
    ok = system({ 'DUNGEON_GRAPH_TEST_NO_SCRUB' => nil }, RbConfig.ruby, script, erb_path, out: File::NULL)
    raise "generate_dungeon_graph.rb failed (exit #{$?.exitstatus.inspect})" unless ok

    File.join(File.dirname(erb_path), 'dungeon_graph.json')
  end

  def load_graph(graph_path, erb_path)
    raise "no dungeon graph JSON at #{graph_path}" unless File.file?(graph_path)
    if File.mtime(graph_path) < File.mtime(erb_path)
      raise "#{graph_path} is older than #{erb_path}: regenerate it (scripts/generate_dungeon_graph.rb)"
    end

    g = JSON.parse(File.read(graph_path))
    unless g['nodes'].is_a?(Array) && g['edges'].is_a?(Array)
      raise "#{graph_path} has no nodes/edges arrays: the dungeon graph format changed, update lock_key_diff.rb"
    end

    g
  end

  # The key an array member goes by in a path: its id (doors by connectedRoom), else its own
  # fields (type and name, the position when two members share them), never its array position,
  # so a new object declared before an existing one does not shift the paths.
  def member_keys(arr)
    keys = arr.map do |v|
      next nil unless v.is_a?(Hash)

      k = v['id'] || v['taskId'] || v['aimId'] || v['connectedRoom']
      k ||= [v['type'], v['name']].select { |x| x.is_a?(String) && !x.empty? }.join('|') if v['type'] || v['name']
      k && k.to_s.gsub(/[\[\]]/, '')
    end
    seen = Hash.new(0)
    counts = keys.compact.tally
    keys.each_with_index.map do |k, i|
      next nil unless k

      seen[k] += 1
      next k if counts[k] == 1

      pos = arr[i]['position'] || arr[i].slice('x', 'y')
      pos.is_a?(Hash) && pos['x'] ? "#{k}@#{pos['x']},#{pos['y']}" : "#{k}##{seen[k]}"
    end
  end

  def walk(node, path, &blk)
    case node
    when Hash
      blk.call(node, path)
      node.each { |k, v| walk(v, "#{path}/#{k}", &blk) }
    when Array
      keys = member_keys(node)
      node.each_with_index { |v, i| walk(v, keys[i] ? "#{path}[#{keys[i]}]" : "#{path}[#{i}]", &blk) }
    end
  end

  def snapshot(erb_path, graph)
    scenario = render(erb_path)
    locks = []
    gates = []
    conclude = []
    walk(scenario, '') do |o, path|
      if o.key?('lockType') || o['locked'] == true
        locks << { 'path' => path, 'id' => o['id'] || o['name'], 'lockType' => o['lockType'],
                   'locked' => o['locked'], 'requirementHash' => h(o.slice(*REQ_KEYS)),
                   'requiresHash' => h(o.slice(*REQUIRES_KEYS)) }
      end
      GATE_KEYS.each { |k| gates << { 'path' => path, 'field' => k, 'valueHash' => h(o[k]), 'on' => gate_on(o, path) } if o.key?(k) }
      conclude << { 'path' => path, 'concludeRequires' => o['concludeRequires'] } if o.key?('concludeRequires')
    end
    aims = Array(scenario['objectives']).select { |a| a.is_a?(Hash) }.map do |aim|
      { 'aimId' => aim['aimId'], 'order' => aim['order'], 'optional' => aim['optional'] == true,
        'unlockCondition' => aim['unlockCondition'],
        'tasks' => Array(aim['tasks']).select { |t| t.is_a?(Hash) }.map { |t| t.reject { |k, _| TASK_DROP.include?(k) } } }
    end
    nodes = graph['nodes'].select { |n| n.is_a?(Hash) }
    placement = {}
    (scenario['rooms'] || {}).each do |room_id, room|
      next unless room.is_a?(Hash)

      walk(room, '') { |o, _p| placement[o['id'].to_s] ||= room_id if o['id'].is_a?(String) }
    end
    {
      'tool' => TOOL, 'format' => FORMAT,
      'scenario' => File.basename(File.dirname(File.expand_path(erb_path))),
      'graph' => {
        'lockNodes' => nodes.select { |n| n['kind'] == 'lock' }.map { |n| { 'id' => n['id'], 'optional' => n['optional'] == true } }.sort_by { |n| n['id'].to_s },
        'keyNodes' => nodes.select { |n| n['kind'] == 'key' }.map { |n| { 'id' => n['id'], 'optional' => n['optional'] == true } }.sort_by { |n| n['id'].to_s },
        'roomNodes' => nodes.select { |n| n['kind'] == 'room' }.map { |n| n['id'] }.sort,
        'edges' => graph['edges'].select { |e| e.is_a?(Hash) }.map { |e| [e['from'], e['to'], e['soft'] == true] }.sort_by(&:to_s)
      },
      'locks' => locks.sort_by { |l| l['path'] },
      'gates' => gates.sort_by { |g| [g['path'], g['field']] },
      'aims' => aims,
      'concludeRequires' => conclude.sort_by { |c| c['path'] },
      'placement' => placement.sort.to_h,
      'layout' => layout(scenario),
      'requiredContent' => required_content(scenario, placement, erb_path)
    }
  end

  # The physical layout from the scenario's own connections and doors, locks ignored (the dungeon
  # graph draws no room edge into or out of a locked room, so it cannot show what lies beyond one):
  # { 'start' => room, 'adj' => { room => [rooms, both directions] } }.
  def layout(scenario)
    rooms = scenario['rooms'].is_a?(Hash) ? scenario['rooms'] : {}
    adj = Hash.new { |hh, k| hh[k] = [] }
    parallel = {}
    rooms.each do |rid, room|
      next unless room.is_a?(Hash)

      adj[rid]
      Array(room['doors']).select { |d| d.is_a?(Hash) && d['connectedRoom'].is_a?(String) }.map { |d| d['connectedRoom'] }.tally.each do |d, n|
        parallel[[rid, d].sort.join('|')] = true if n > 1
      end
      dests = (room['connections'].is_a?(Hash) ? room['connections'].values : []).flat_map { |d| Array(d) }
      dests += Array(room['doors']).select { |d| d.is_a?(Hash) }.map { |d| d['connectedRoom'] }
      dests.select { |d| d.is_a?(String) && rooms.key?(d) }.each do |d|
        adj[rid] << d
        adj[d] << rid
      end
    end
    out = { 'start' => scenario['startRoom'], 'adj' => adj.transform_values { |v| v.uniq.sort }.sort.to_h }
    # room pairs with two doors in one room: locking one leaves the other way through
    out['parallel'] = parallel.keys.sort unless parallel.empty?
    out
  end

  # What a gate sits on: a door (its far side, connectedRoom), a room, or an object.
  def gate_on(o, path)
    return { 'door' => o['connectedRoom'] } if path =~ %r{/doors\[[^\]]+\]\z} && o['connectedRoom'].is_a?(String)
    return { 'room' => path[%r{\A/rooms/([^/\[]+)\z}, 1] } if path =~ %r{\A/rooms/[^/\[]+\z}

    { 'object' => o['id'].is_a?(String) ? o['id'] : nil, 'lock' => o['locked'] == true }
  end

  def required_task_ids(scenario)
    Array(scenario['objectives']).select { |a| a.is_a?(Hash) && a['optional'] != true }.flat_map do |aim|
      Array(aim['tasks']).select { |t| t.is_a?(Hash) && t['optional'] != true && t['taskId'] }
    end
  end

  # The story text an NPC loads: the .ink beside its compiled storyPath, else the compiled JSON.
  def story_text(npc, base_dir)
    p = npc['storyPath']
    return '' unless p.is_a?(String) && !p.empty?

    [p.sub(/\.json\z/, '.ink'), p].each do |c|
      [File.expand_path(c, File.expand_path('..', __dir__)), File.expand_path(c, base_dir)].each do |f|
        return File.read(f, encoding: 'UTF-8') if File.file?(f)
      end
    end
    ''
  rescue StandardError
    ''
  end

  # [[room, why, id]] for every room holding required content (id: the object or NPC, when one).
  # A required task's own refs: targetRoom, targetObject, targetNPC, targetItemIds (matched on an
  # item's id, opens_lock, key_id or name, as objectives-manager.js targetIdMatches does),
  # targetItems by type and targetGroup by collection_group. Then the room of each NPC whose story
  # sets it with #complete_task; each object (or room) whose action lists hold a
  # { type: complete_task } (triggerOnInteract, completionActions and the like, apply-actions.js);
  # each mapping that completes it, at the object, NPC or room its eventPattern names (else the NPC
  # holding the mapping); and for submit_flags the station its targetFlags name. Every VM launcher
  # counts too, as one row each, when any required task submits flags.
  def required_content(scenario, placement, erb_path)
    out = []
    tasks = required_task_ids(scenario)
    ids = tasks.map { |t| t['taskId'].to_s }
    rooms = scenario['rooms'].is_a?(Hash) ? scenario['rooms'] : {}
    objs = []
    rooms.each { |rid, room| walk(room, '') { |o, pa| objs << [rid, o] if pa != '' } if room.is_a?(Hash) }
    ref = ->(o) { o['id'].is_a?(String) ? o['id'] : o['name'] }
    by_type = Hash.new { |hh, k| hh[k] = [] }
    aliases = Hash.new { |hh, k| hh[k] = [] }
    groups = Hash.new { |hh, k| hh[k] = [] }
    objs.each do |rid, o|
      by_type[o['type']] << [rid, o['id']] if o['type'].is_a?(String)
      %w[id name opens_lock key_id].each { |k| aliases[o[k]] << [rid, ref.call(o)] if o[k].is_a?(String) && !o[k].empty? }
      g = o['collection_group'] || o['collectionGroup']
      groups[g] << [rid, ref.call(o)] if g.is_a?(String)
    end
    tasks.each do |t|
      tid = t['taskId']
      out << [t['targetRoom'], "task #{tid}", nil] if t['targetRoom'].is_a?(String)
      [t['targetObject'], t['targetNPC']].each { |id| out << [placement[id], "task #{tid}", id] if id.is_a?(String) && placement[id] }
      Array(t['targetItemIds']).each { |id| aliases[id].uniq.each { |r, x| out << [r, "task #{tid}", x] } if id.is_a?(String) }
      Array(t['targetItems']).each { |ty| by_type[ty.to_s].uniq.each { |r, id| out << [r, "task #{tid}", id] } }
      groups[t['targetGroup']].uniq.each { |r, id| out << [r, "task #{tid} (group '#{t['targetGroup']}')", id] } if t['targetGroup'].is_a?(String)
      next unless t['type'] == 'submit_flags'

      flag_stations(t, objs, placement, by_type).each { |r, id| out << [r, "task #{tid} (flag station)", id] }
    end
    if tasks.any? { |t| t['type'] == 'submit_flags' }
      by_type['vm-launcher'].uniq.each { |r, id| out << [r, 'VM launcher (flag tasks)', id] }
    end
    # completesTask on a flag-locked object (games_controller.rb) and completesTaskOnOpen
    # (unlock-system.js): the object itself completes the task
    objs.each do |rid, o|
      %w[completesTask completesTaskOnOpen].each do |k|
        Array(o[k]).map(&:to_s).select { |tid| ids.include?(tid) }.each { |tid| out << [rid, "task #{tid} (#{k} on '#{ref.call(o)}')", ref.call(o)] }
      end
    end
    rooms.each do |rid, room|
      next unless room.is_a?(Hash)

      complete_task_actions(room, nil) do |owner, tid|
        out << [rid, "task #{tid} (action on #{owner ? "'#{owner}'" : "room '#{rid}'"})", owner] if ids.include?(tid)
      end
    end
    base_dir = File.dirname(File.expand_path(erb_path))
    mappings = Array(scenario['eventMappings']).map { |m| [m, nil] }
    rooms.each do |rid, room|
      next unless room.is_a?(Hash)

      Array(room['npcs']).each do |n|
        next unless n.is_a?(Hash)

        Array(n['eventMappings']).each { |m| mappings << [m, rid] }
        story_text(n, base_dir).scan(/complete_task\s*:\s*([A-Za-z0-9_\-]+)/).flatten.uniq.each do |tid|
          out << [rid, "task #{tid} (ink of '#{n['id']}')", n['id']] if ids.include?(tid)
        end
      end
    end
    mappings.each do |m, holder_room|
      next unless m.is_a?(Hash)

      done = (m['completeTask'].is_a?(Array) ? m['completeTask'] : [m['completeTask']]).map(&:to_s)
      complete_task_actions(m, nil) { |_o, tid| done << tid }
      done = done.uniq & ids
      next if done.empty?

      kind, tgt = m['eventPattern'].to_s.split(':', 2)
      id = tgt && placement[tgt] ? tgt : nil
      # a global trigger names no room: the rooms where the scenario sets that global stand for it,
      # and so does the holding NPC's room, because engine code (a minigame result) may set it too
      # and nothing here can tell whether the scripted setters are all of them. No task is left
      # naming only an optional room.
      rs = if kind == 'global_variable_changed'
             global_set_rooms(rooms, tgt, base_dir) | [holder_room]
           else
             [(tgt && (placement[tgt] || (rooms.key?(tgt) ? tgt : nil))) || holder_room]
           end
      rs.compact.each { |room| done.each { |tid| out << [room, "task #{tid} (mapping '#{m['eventPattern']}')", id] } }
    end
    out.uniq.sort_by { |r| r.map(&:to_s) }
  end

  # The rooms where this global can be set: a { type: set_global } action, a setGlobal or
  # setVariable map naming it (onRead, onPickup and the like), or the ink of an NPC there that
  # assigns it (`~ name =` or `# set_global:name`).
  def global_set_rooms(rooms, name, base_dir = nil)
    out = []
    return out unless name.is_a?(String)

    rooms.each do |rid, room|
      next unless room.is_a?(Hash)

      walk(room, '') do |o, _p|
        out << rid if o['type'] == 'set_global' && (o['key'] || o['global'] || o['name']) == name
        %w[setGlobal setVariable].each { |k| out << rid if o[k].is_a?(Hash) && o[k].key?(name) }
        out << rid if o['npcType'] && base_dir && story_text(o, base_dir) =~ /(~\s*#{Regexp.escape(name)}\s*=|set_global\s*:\s*#{Regexp.escape(name)}\b)/
      end
    end
    out.uniq
  end

  # Yields [owner id, taskId] for each { type: complete_task } action under node; the owner is the
  # nearest enclosing hash with a string id (nil for the room itself).
  def complete_task_actions(node, owner, &blk)
    case node
    when Hash
      owner = node['id'] if node['id'].is_a?(String)
      blk.call(owner, node['taskId'].to_s) if node['type'] == 'complete_task' && node['taskId']
      node.each_value { |v| complete_task_actions(v, owner, &blk) }
    when Array then node.each { |v| complete_task_actions(v, owner, &blk) }
    end
  end

  # The stations a submit_flags task's targetFlags (<station>:<vm>-flagN, or <vm>:flag_N) point
  # at: the object the prefix names (any type); else objects whose flags list holds the ref; else
  # objects whose acceptsVms holds the prefix; else every flag station. [[room, id]].
  def flag_stations(task, objs, placement, by_type)
    refs = Array(task['targetFlags']).select { |f| f.is_a?(String) }
    found = refs.flat_map do |f|
      pre = f.split(':', 2)[0]
      next [[placement[pre], pre]] if placement[pre]

      hit = objs.select { |_r, o| Array(o['flags']).include?(f) || o['requires'] == f }
      # <vm>:flag_N is a reference, never accepted by VM at a station: only the lock requiring it
      # (and the object's completesTask) names the place. <vm>-flagN goes to every object
      # accepting the VM, of any type.
      vm = f.include?(':') ? nil : f.sub(/-flag\d+\z/, '')
      hit = objs.select { |_r, o| Array(o['acceptsVms']).include?(vm) } if hit.empty? && vm
      hit.map { |r, o| [r, o['id'].is_a?(String) ? o['id'] : o['name']] }
    end
    found = by_type['flag-station'] if found.empty?
    found.uniq
  end

  SECTIONS = %w[graph locks gates aims concludeRequires].freeze

  # Rooms that hold required content (the snapshot's requiredContent).
  def required_rooms(snap)
    Array(snap['requiredContent']).map(&:first).uniq
  end

  # Nodes reachable downstream from a start over the graph's edges.
  def downstream(snap, start)
    out = {}
    adj = Hash.new { |hh, k| hh[k] = [] }
    snap['graph']['edges'].each { |from, to, _soft| adj[from] << to }
    queue = [start]
    until queue.empty?
      n = queue.shift
      adj[n].each do |m|
        next if out[m]

        out[m] = true
        queue << m
      end
    end
    out.keys
  end

  def guards(snap, start)
    critical = snap['graph']['lockNodes'].reject { |n| n['optional'] }.map { |n| n['id'] }
    req_rooms = required_rooms(snap)
    reach = downstream(snap, start) + [start]
    hits = reach.select { |n| req_rooms.include?(n) }.map { |r| "room '#{r}' (required content)" }
    hits += (reach - [start]).select { |n| critical.include?(n) }.map { |l| "critical-path lock '#{l}'" }
    hits.uniq
  end

  def reachable(layout, cut_room: nil, cut_edge: nil)
    start = layout['start']
    seen = {}
    return [] if start.nil? || start == cut_room

    queue = [start]
    seen[start] = true
    until queue.empty?
      n = queue.shift
      Array(layout['adj'][n]).each do |m|
        next if seen[m] || m == cut_room || (cut_edge && cut_edge.sort == [n, m].sort)

        seen[m] = true
        queue << m
      end
    end
    seen.keys
  end

  # The room a critical-path lock node sits in: door_<room> is the room, lock_<id> the room of the
  # object (placement, by the graph's node name).
  def lock_rooms(snap)
    place = (snap['placement'] || {}).to_h { |id, r| [graph_nid(id), r] }
    rooms = (snap['layout']['adj'] || {}).keys
    snap['graph']['lockNodes'].reject { |n| n['optional'] }.filter_map do |n|
      id = n['id'].to_s
      if id.start_with?('door_') && rooms.include?(id.sub('door_', '')) then id.sub('door_', '')
      elsif id.start_with?('lock_') then place[id.sub('lock_', '')]
      end
    end
  end

  # Rooms that hold required content or a critical-path lock, which the player can reach from the
  # start room in this layout but not once the room (or the door between two rooms) is taken out:
  # a locked room or corridor in front of them. The room itself is left out (its own content is
  # judged separately). Nothing when the layout is unknown (an old snapshot).
  def cut_off(snap, room: nil, edge: nil)
    lay = snap['layout']
    return [] unless lay.is_a?(Hash) && lay['start']
    return [] if edge && Array(lay['parallel']).include?(edge.sort.join('|'))

    lost = reachable(lay) - reachable(lay, cut_room: room, cut_edge: edge) - [room].compact
    needed = required_rooms(snap) + lock_rooms(snap)
    (lost & needed).sort.map { |r| "room '#{r}' (reachable only through #{room ? "'#{room}'" : "door #{edge.join(' to ')}"})" }
  end

  # A door's path key is its connectedRoom, with @x,y or #n added when a room has two doors to
  # one room (member_keys): the room name is what the layout and graph know it by.
  def door_room(key)
    key.to_s.sub(/(?:@[^\]]*|#\d+)\z/, '')
  end

  def graph_nid(s)
    s.to_s.downcase.gsub(/[^a-z0-9]/, '_').gsub(/_+/, '_').sub(/\A_+/, '').sub(/_+\z/, '')
  end

  # The object itself, when required content names it (a task target, a station, the object whose
  # action completes a task).
  def object_guards(snap, id)
    why = Array(snap['requiredContent']).select { |_r, _w, x| x == id }.map { |_r, w, _x| w }.uniq
    why.empty? ? [] : ["object '#{id}' (#{why.join('; ')})"]
  end

  # A lock in effect: locked: true, as the engine and the graph read it (a lockType alone is not
  # a lock, interactions.js).
  def lock_on?(l)
    l['locked'] == true
  end

  # What a new lock entry sits on and guards: a room lock guards the room, a door lock its
  # connectedRoom (the path key), an object lock the object when required content names it.
  def lock_entry_guards(snap, l)
    path = l['path'].to_s
    if (room = path[%r{\A/rooms/([^/\[]+)\z}, 1])
      return (required_rooms(snap).include?(room) ? ["room '#{room}' (required content)"] : []) | cut_off(snap, room: room)
    end
    if (m = path.match(%r{\A/rooms/([^/\[]+)/doors\[([^\]]+)\]\z}))
      room = door_room(m[2])
      return (required_rooms(snap).include?(room) ? ["room '#{room}' (required content)"] : []) | cut_off(snap, edge: [m[1], room])
    end

    l['id'].is_a?(String) ? object_guards(snap, l['id']) : []
  end

  # Where a new gate's far side starts in the graph, and what it guards. A door gate starts at
  # door_<connectedRoom> (or the room itself); a room gate at door_<room>; an object gate at its
  # lock node lock_<id>, else its own node. An object gate also guards the object when a required
  # task names it or it is a lock.
  def gate_guards(snap, gt)
    nodes = (snap['graph']['lockNodes'].map { |n| n['id'] } + snap['graph']['keyNodes'].map { |n| n['id'] } +
             snap['graph']['roomNodes']).to_set
    edge_nodes = snap['graph']['edges'].flat_map { |f, t, _| [f, t] }.to_set
    known = ->(n) { nodes.include?(n) || edge_nodes.include?(n) }
    on = gt['on'] || {}
    if (room = on['door'] || on['room'])
      start = known.call("door_#{room}") ? "door_#{room}" : room
      g = guards(snap, start)
      g |= ["room '#{room}' (required content)"] if required_rooms(snap).include?(room)
      door = gt['path'].to_s.match(%r{\A/rooms/([^/\[]+)/doors\[([^\]]+)\]\z})
      g |= door ? cut_off(snap, edge: [door[1], door_room(door[2])]) : cut_off(snap, room: room)
      return g
    end
    id = on['object']
    return [] unless id

    start = ["lock_#{graph_nid(id)}", id].find { |n| known.call(n) }
    g = start ? guards(snap, start) : []
    g |= object_guards(snap, id)
    g |= ["object '#{id}' (critical-path lock)"] if on['lock'] && !(start && snap['graph']['lockNodes'].any? { |n| n['id'] == start && n['optional'] })
    g
  end

  # Whether graph lock node `node` is the one this lock entry makes: lock_<id> for an object, the
  # door_<room> node for a room's own lock or a door's.
  def lock_node_of?(l, node)
    path = l['path'].to_s
    room = path[%r{\A/rooms/([^/\[]+)\z}, 1] || path[%r{/doors\[([^\]]+)\]\z}, 1]
    return node == "door_#{door_room(room)}" if room

    l['id'].is_a?(String) && ["lock_#{l['id']}", "lock_#{graph_nid(l['id'])}"].include?(node)
  end

  # [[baseline lock, current lock]]: equal paths first, then the rest by best fit, locks whose
  # paths differ only in the @x,y or #n a same-named sibling adds (member_keys).
  def pair_locks(base_locks, cur_locks)
    stem = ->(l) { l['path'].to_s.sub(/(?:@[^\]\/]*|#\d+)\]\z/, ']') }
    by_path = cur_locks.to_h { |l| [l['path'], l] }
    pairs = []
    rest_b = []
    taken = {}
    base_locks.each do |l|
      if (c = by_path[l['path']]) && !taken[c['path']]
        taken[c['path']] = true
        pairs << [l, c]
      else
        rest_b << l
      end
    end
    rest_c = cur_locks.reject { |c| taken[c['path']] }
    rest_b.each do |l|
      c = rest_c.find { |x| stem.call(x) == stem.call(l) } or next
      rest_c.delete(c)
      pairs << [l, c]
    end
    pairs
  end

  def lines_of(obj)
    case obj
    when Array then obj.map { |x| JSON.generate(x) }
    else JSON.pretty_generate(obj).lines.map(&:rstrip)
    end
  end

  def diff(base, cur)
    changes = {}
    SECTIONS.each do |k|
      a = k == 'graph' ? base[k].flat_map { |kk, v| v.map { |x| "#{kk} #{JSON.generate(x)}" } } : lines_of(base[k])
      b = k == 'graph' ? cur[k].flat_map { |kk, v| v.map { |x| "#{kk} #{JSON.generate(x)}" } } : lines_of(cur[k])
      removed = a - b
      added = b - a
      changes[k] = { 'removed' => removed, 'added' => added } unless removed.empty? && added.empty?
    end
    flagged = []
    old_locks = base['graph']['lockNodes'].map { |n| n['id'] }
    done = []
    cur['graph']['lockNodes'].each do |n|
      next if old_locks.include?(n['id'])

      g = guards(cur, n['id'])
      # the locked object itself: the generator names its node lock_<id> (generate_dungeon_graph.rb)
      cur['locks'].select { |l| lock_node_of?(l, n['id']) }.each do |l|
        done << l['path']
        g |= lock_entry_guards(cur, l)
      end
      flagged << "new lock '#{n['id']}' guards #{g.join(', ')}" unless g.empty?
    end
    # a lock put on, or switched on, where the graph has no new node for it. Locks are matched to
    # the baseline's by path, else by best fit (pair_locks), so a same-named sibling that shifts an
    # id-less lock's path neither makes it a new lock nor a removed one.
    pairs = pair_locks(base['locks'], cur['locks'])
    old_of = pairs.to_h { |b, c| [c['path'], b] }
    new_of = pairs.to_h { |b, c| [b['path'], c] }
    cur['locks'].each do |l|
      next if !lock_on?(l) || (old_of[l['path']] && lock_on?(old_of[l['path']])) || done.include?(l['path'])

      g = lock_entry_guards(cur, l)
      flagged << "new lock at #{l['path']} guards #{g.join(', ')}" unless g.empty?
    end
    # rule 2 also forbids a lock removed or switched off: a critical-path (non-optional) lock of
    # the baseline that is gone, or whose entry is no longer locked: true (the graph keeps the node
    # of an object left with a lockType), is a bypass; so is a changed lockType or requirement on
    # one, which may swap what the player must hold for something they already have (or for
    # something they cannot get). Any change is reported, as nothing here can rank two requirements.
    now_locks = cur['graph']['lockNodes'].map { |n| n['id'] }
    gone = base['graph']['lockNodes'].reject { |n| n['optional'] || now_locks.include?(n['id']) }.map { |n| n['id'] }
    changed = []
    base['locks'].select { |l| lock_on?(l) }.each do |l|
      node = base['graph']['lockNodes'].find { |n| !n['optional'] && lock_node_of?(l, n['id']) }
      next unless node

      c = new_of[l['path']]
      if c.nil? || !lock_on?(c)
        gone << node['id']
      else
        what = []
        what << "lockType #{l['lockType'].inspect} to #{c['lockType'].inspect}" if l['lockType'] != c['lockType']
        what << 'requirement' if l['requiresHash'] && l['requiresHash'] != c['requiresHash']
        changed << "critical-path lock '#{node['id']}' changed (#{what.join(', ')}): a bypass or a block" unless what.empty?
      end
    end
    gone.uniq.each { |id| flagged << "critical-path lock '#{id}' removed or switched off (a bypass)" }
    flagged.concat(changed.uniq)
    old_gates = base['gates'].map { |g| [g['path'], g['field']] }
    cur['gates'].each do |gt|
      next if old_gates.include?([gt['path'], gt['field']])

      g = gate_guards(cur, gt)
      flagged << "new #{gt['field']} at #{gt['path']} guards #{g.join(', ')}" unless g.empty?
    end
    { 'changes' => changes, 'flagged' => flagged }
  end

  def main(argv)
    opts = {}
    OptionParser.new do |o|
      o.banner = 'Usage: lock_key_diff.rb <scenario.json.erb> (<baseline.json> | --write <baseline.json>) [--graph-json PATH] [--json]'
      o.on('--write PATH') { |p| opts[:write] = p }
      o.on('--graph-json PATH') { |p| opts[:graph] = p }
      o.on('--json') { opts[:json] = true }
    end.parse!(argv)
    erb = argv[0]
    baseline = argv[1]
    if erb.nil? || (baseline.nil? && !opts[:write])
      warn 'usage: lock_key_diff.rb <scenario.json.erb> (<baseline.json> | --write <baseline.json>) [--graph-json PATH] [--json]'
      return 64
    end
    graph_path = opts[:graph] || run_graph(erb)
    cur = snapshot(erb, load_graph(graph_path, erb))
    if opts[:write]
      File.write(opts[:write], "#{JSON.pretty_generate(cur)}\n")
      puts "lock and key baseline written: #{opts[:write]} (#{cur['graph']['lockNodes'].size} lock nodes, #{cur['gates'].size} gates)"
      return 0
    end
    base = JSON.parse(File.read(baseline))
    raise "#{baseline} is not a #{TOOL} baseline (format #{FORMAT})" unless base['format'] == FORMAT

    d = diff(base, cur)
    if opts[:json]
      puts JSON.pretty_generate(d)
    elsif d['changes'].empty?
      puts 'lock and key diff: empty'
    else
      d['changes'].each do |k, c|
        puts "== #{k}: #{c['removed'].size} removed, #{c['added'].size} added"
        c['removed'].each { |l| puts "- #{l}" }
        c['added'].each { |l| puts "+ #{l}" }
      end
      d['flagged'].each { |f| puts "RULE 2: #{f}" }
    end
    return 2 unless d['flagged'].empty?

    d['changes'].empty? ? 0 : 1
  rescue StandardError => e
    warn "lock_key_diff: #{e.message}"
    64
  end
end

exit LockKeyDiff.main(ARGV.dup) if __FILE__ == $PROGRAM_NAME
