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
# concludeRequires. The diff names what changed and flags any new lock node or gate whose far side
# holds a required task or a critical-path (non-optional) lock.
#
# V9 consumes the graph's output and shares none of its code, so a change to the graph's JSON
# format needs a matching change here; test/js/lock-key-diff.test.mjs pins the fields read:
# nodes[].id/kind/optional and edges[].from/to/soft.
#
# Exit status: 0 no change; 1 changes, none guarding required content; 2 a new door or gate guards
# required content (rule 2); 64 usage or input error.
#
# Renders through BreakEscape::ScenarioBinding (the one render path), with its random values fixed
# so the requirement hashes are stable from run to run.
require 'json'
require 'digest'
require 'optparse'
require 'rbconfig'
require_relative '../lib/break_escape/scenario_binding'

module LockKeyDiff
  TOOL = 'scripts/lock_key_diff.rb (V9)'
  FORMAT = 1
  REQ_KEYS = %w[lockType requires keyPins key_id targetFlags difficulty requiresGlobal requireGlobal].freeze
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

  def render(erb_path)
    JSON.parse(StableBinding.render(File.read(erb_path)))
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

  # Walk the rendered scenario. Array members are keyed by id where they have one, so a new object
  # declared before an existing one does not shift the existing paths.
  def walk(node, path, &blk)
    case node
    when Hash
      blk.call(node, path)
      node.each { |k, v| walk(v, "#{path}/#{k}", &blk) }
    when Array
      node.each_with_index do |v, i|
        key = v.is_a?(Hash) && (v['id'] || v['taskId'] || v['aimId'])
        walk(v, key ? "#{path}[#{key}]" : "#{path}[#{i}]", &blk)
      end
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
                   'locked' => o['locked'], 'requirementHash' => h(o.slice(*REQ_KEYS)) }
      end
      GATE_KEYS.each { |k| gates << { 'path' => path, 'field' => k, 'valueHash' => h(o[k]) } if o.key?(k) }
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
      'placement' => placement.sort.to_h
    }
  end

  SECTIONS = %w[graph locks gates aims concludeRequires].freeze

  # Rooms that hold required content: a required task's targetRoom, or the room of its
  # targetObject / targetNPC (the snapshot's id-to-room placement).
  def required_rooms(snap)
    rooms = []
    room_of = ->(id) { snap['placement'][id] }
    snap['aims'].each do |aim|
      next if aim['optional']

      aim['tasks'].each do |t|
        next if t['optional'] == true

        rooms << t['targetRoom'] if t['targetRoom'].is_a?(String)
        [t['targetObject'], t['targetNPC']].each { |id| (r = room_of.call(id)) && rooms << r if id.is_a?(String) }
      end
    end
    rooms.uniq
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
    hits = reach.select { |n| req_rooms.include?(n) }.map { |r| "room '#{r}' (required task)" }
    hits += (reach - [start]).select { |n| critical.include?(n) }.map { |l| "critical-path lock '#{l}'" }
    hits.uniq
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
    cur['graph']['lockNodes'].each do |n|
      next if old_locks.include?(n['id'])

      g = guards(cur, n['id'])
      flagged << "new lock '#{n['id']}' guards #{g.join(', ')}" unless g.empty?
    end
    old_gates = base['gates'].map { |g| [g['path'], g['field']] }
    cur['gates'].each do |gt|
      next if old_gates.include?([gt['path'], gt['field']])

      room = gt['path'][%r{\A/rooms/([^/\[]+)}, 1]
      id = gt['path'][/\[([^\]]+)\]\z/, 1] || gt['path'][%r{/([^/\[]+)\z}, 1]
      start = cur['graph']['lockNodes'].any? { |n| n['id'] == id } ? id : room
      next unless start

      g = guards(cur, start)
      g |= ["room '#{room}' (required task)"] if room && required_rooms(cur).include?(room)
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
