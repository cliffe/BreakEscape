#!/usr/bin/env ruby
# frozen_string_literal: true

# Train check: eventMappings must not shift index.
#
# The engine keys once-only records as `${npcId}:${eventPattern}:${handlerIndex}`
# (public/break_escape/js/systems/npc-manager.js, _mappingWouldFire), where handlerIndex is the
# position in the NPC's eventMappings array. Inserting or removing a mapping before existing ones
# moves their indices, so saved games re-fire once-only texts. Appends and content edits are fine.
#
# Usage:
#   tools/check_mapping_index_drift.rb BASE_REF [scenario.json.erb ...]
#       Compares each changed scenarios/*/scenario.json.erb (BASE_REF to the working tree) or the
#       paths given. A scenario absent from BASE_REF is new and skipped.
#   tools/check_mapping_index_drift.rb --pair NAME BASE.erb HEAD.erb
#       Compares two files directly (used by tests and for branches not checked out).
#
# Prints "MAPDRIFT <scenario> <npc> base[i]=<pattern> head[i]=<pattern>" per failure and
# "MAPDRIFT-CHECK n scenarios, f failures". Exit 1 on any failure.

require 'json'
require 'open3'
require_relative '../lib/break_escape/scenario_binding'

module MappingDrift
  module_function

  # { "npc id" => [eventMappings array, ...] } for every hash carrying an eventMappings array,
  # wherever it sits (rooms' npcs, top-level npcs, phone NPCs). A repeated id gets "#2", "#3".
  def collect(node, out = {})
    case node
    when Hash
      if node['eventMappings'].is_a?(Array)
        id = (node['id'] || node['npcId']).to_s
        id = '(no id)' if id.empty?
        key = id
        n = 1
        key = "#{id}##{n += 1}" while out.key?(key)
        out[key] = node['eventMappings']
      end
      node.each_value { |v| collect(v, out) }
    when Array
      node.each { |v| collect(v, out) }
    end
    out
  end

  def pattern(entry)
    entry.is_a?(Hash) ? entry['eventPattern'].to_s : entry.to_s
  end

  def render(erb_text)
    JSON.parse(BreakEscape::ScenarioBinding.render(erb_text, {}))
  end

  # Array of [npc, i, base_pattern, head_pattern_or_nil] failures.
  def compare(base_json, head_json)
    base = collect(base_json)
    head = collect(head_json)
    fails = []
    base.each do |npc, entries|
      next unless head.key?(npc)

      entries.each_index do |i|
        bp = pattern(entries[i])
        hp = head[npc][i] && pattern(head[npc][i])
        fails << [npc, i, bp, hp] unless hp == bp
      end
    end
    fails
  end

  def check_texts(name, base_erb, head_erb)
    compare(render(base_erb), render(head_erb)).map do |npc, i, bp, hp|
      "MAPDRIFT #{name} #{npc} base[#{i}]=#{bp} head[#{i}]=#{hp.nil? ? '(missing)' : hp}"
    end
  end
end

def git(*args)
  out, status = Open3.capture2(*%w[git] + args, err: File::NULL)
  [out, status.success?]
end

if $PROGRAM_NAME == __FILE__
  lines = []
  count = 0
  if ARGV[0] == '--pair'
    _, name, base_file, head_file = ARGV
    abort 'usage: --pair NAME BASE.erb HEAD.erb' unless head_file
    lines.concat(MappingDrift.check_texts(name, File.read(base_file), File.read(head_file)))
    count = 1
  else
    base_ref = ARGV.shift || 'main'
    paths = ARGV.dup
    if paths.empty?
      out, = git('diff', '--name-only', base_ref, '--', 'scenarios')
      paths = out.split("\n").grep(%r{\Ascenarios/[^/]+/scenario\.json\.erb\z})
    end
    paths.each do |path|
      base_text, ok = git('show', "#{base_ref}:#{path}")
      next unless ok && File.exist?(path) # new or deleted scenario: nothing to drift

      count += 1
      lines.concat(MappingDrift.check_texts(path, base_text, File.read(path)))
    rescue StandardError => e
      lines << "MAPDRIFT #{path} render-error #{e.class}: #{e.message[0, 160]}"
    end
  end
  lines.each { |l| puts l }
  puts "MAPDRIFT-CHECK #{count} scenarios, #{lines.size} failures"
  exit(lines.empty? ? 0 : 1)
end
