#!/usr/bin/env ruby
# frozen_string_literal: true

# Interim stand-in for V9 (OFFICE_LIFE_MISSIONS_PLAN.md section 4) until
# scripts/lock_key_diff.rb exists. Writes a lock and key baseline for one
# scenario, or diffs the current scenario against a saved baseline.
#
#   ruby tools/office_life/lock_key_baseline.rb <scenario.json.erb> > baseline_locks.json
#   ruby tools/office_life/lock_key_baseline.rb <scenario.json.erb> --diff baseline_locks.json
#
# It reads lock nodes, key edges and optional flags from the dungeon graph JSON
# beside the scenario (run scripts/generate_dungeon_graph.rb first; the script
# refuses a graph older than the scenario file), and adds from the rendered
# scenario: a SHA-256 of each lock's requirement (never the secret itself), every
# gate, access list and wearable, every task and objective with its trigger, and
# concludeRequires. Secrets are never written out.

require 'json'
require 'erb'
require 'securerandom'
require 'digest'

scenario_file = ARGV[0] or abort 'usage: lock_key_baseline.rb <scenario.json.erb> [--diff baseline.json]'
diff_file = ARGV.index('--diff') && ARGV[ARGV.index('--diff') + 1]
repo = File.expand_path('../..', __dir__)

# Deterministic copy of the dungeon graph's ScenarioBinding, so hashes are stable.
class BaselineBinding
  def random_password
    'BASELINEPW'
  end
  def random_pin
    '0000'
  end
  def random_code
    'deadbeef'
  end
  def vm_context
    nil
  end
  def vm_object(_t, fallback = {})
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

graph_file = File.join(File.dirname(scenario_file), 'dungeon_graph.json')
abort "no #{graph_file}: run scripts/generate_dungeon_graph.rb first" unless File.exist?(graph_file)
if File.mtime(graph_file) < File.mtime(scenario_file)
  abort "#{graph_file} is older than the scenario: run scripts/generate_dungeon_graph.rb first"
end
graph = JSON.parse(File.read(graph_file))
scenario = JSON.parse(ERB.new(File.read(scenario_file)).result(BaselineBinding.new.get_binding))

def h(obj)
  Digest::SHA256.hexdigest(JSON.generate(obj))[0, 16]
end

REQ_KEYS = %w[requires keyPins targetFlags difficulty].freeze
locks = []
gates = []
walk = lambda do |o, path|
  case o
  when Hash
    if o.key?('lockType') || o['locked'] == true
      locks << {
        'path' => path, 'id' => o['id'] || o['name'], 'lockType' => o['lockType'],
        'locked' => o['locked'], 'requirementHash' => h(o.slice(*REQ_KEYS))
      }
    end
    %w[gate access wearable].each do |k|
      gates << { 'path' => path, 'field' => k, 'valueHash' => h(o[k]) } if o.key?(k)
    end
    o.each { |k, v| walk.call(v, "#{path}/#{k}") }
  when Array
    # Key array members by id where they have one, so a new object declared before an
    # existing one does not shift the existing paths.
    o.each_with_index { |v, i| walk.call(v, v.is_a?(Hash) && v['id'] ? "#{path}[#{v['id']}]" : "#{path}[#{i}]") }
  end
end
walk.call(scenario, '')

objectives = (scenario['objectives'] || []).map do |aim|
  {
    'aimId' => aim['aimId'], 'order' => aim['order'], 'status' => aim['status'],
    'unlockCondition' => aim['unlockCondition'],
    'tasks' => (aim['tasks'] || []).map { |t| t.reject { |k, _| %w[title description].include?(k) } }
  }
end
conclude = []
walk2 = lambda do |o, path|
  case o
  when Hash
    conclude << { 'path' => path, 'concludeRequires' => o['concludeRequires'] } if o.key?('concludeRequires')
    o.each { |k, v| walk2.call(v, "#{path}/#{k}") }
  when Array then o.each_with_index { |v, i| walk2.call(v, "#{path}[#{i}]") }
  end
end
walk2.call(scenario, '')

md = File.join(File.dirname(scenario_file), 'dungeon_graph.md')
crit = File.exist?(md) ? File.read(md)[/^\d+ hops[^\n]*\n\n\*\*([^*]+)\*\*/, 1] : nil

out = {
  'scenario' => File.basename(File.dirname(scenario_file)),
  'tool' => 'tools/office_life/lock_key_baseline.rb (interim V9)',
  'criticalPath' => crit,
  'graph' => {
    'lockNodes' => graph['nodes'].select { |n| n['kind'] == 'lock' }.map { |n| n.slice('id', 'optional') },
    'keyNodes' => graph['nodes'].select { |n| n['kind'] == 'key' }.map { |n| n.slice('id', 'optional') },
    'edges' => graph['edges'].map { |e| [e['from'], e['to'], e['soft']] }.sort
  },
  'locks' => locks.sort_by { |l| l['path'] },
  'gatesAccessWearable' => gates,
  'objectives' => objectives,
  'concludeRequires' => conclude
}

if diff_file
  base = JSON.parse(File.read(diff_file))
  changed = %w[graph locks gatesAccessWearable objectives concludeRequires].reject { |k| base[k] == out[k] }
  if changed.empty?
    puts 'lock and key diff: empty'
  else
    changed.each do |k|
      a = JSON.pretty_generate(base[k]).lines
      b = JSON.pretty_generate(out[k]).lines
      puts "== #{k}: #{(a - b).size} removed, #{(b - a).size} added"
      (a - b).each { |l| puts "- #{l}" }
      (b - a).each { |l| puts "+ #{l}" }
    end
    exit 1
  end
else
  puts JSON.pretty_generate(out)
end
