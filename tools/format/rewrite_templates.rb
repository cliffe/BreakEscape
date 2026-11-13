#!/usr/bin/env ruby3.2
# frozen_string_literal: true

# Rewrite scenario templates for a format-upgrade step, in place, as surgical source edits that keep
# each file's own formatting. For step 8b (--step 2) it moves every scenario to the one owner field
# (format 2): it renames the retired owner keys (screenOwner / phoneOwner / phoneOf / leftBehindBy)
# to `owner`, moves affordance.owners / affordance.private up to object-level owner / private, marks a
# desk phone deskPhone: true, and writes the explicit owner the old needsHome rule derived onto a
# workstation or private object. The real FormatUpgrade step is the oracle: for each object the tool
# renders the current template, applies the step transform, and edits the source text to reach that
# shape, so the rewrite cannot drift from the transform.
#
# Only pure-JSON templates are rewritten here (no ERB tags). ERB-bearing templates
# (lab_physical_pentest, test_capture_log) are hand-edited; this tool refuses them.
#
# Usage: tools/format/rewrite_templates.rb --step 2 <scenario> [<scenario> ...]
#        tools/format/rewrite_templates.rb --step 2 --check <scenario>   (dry run, no write)

require 'json'
require 'erb'
require_relative File.expand_path('../../lib/break_escape/author_notes', __dir__)
require_relative File.expand_path('../../lib/break_escape/format_upgrade', __dir__)

FU = BreakEscape::FormatUpgrade

RETIRED_OWNER_KEYS = %w[screenOwner phoneOwner phoneOf leftBehindBy].freeze
ADD_KEYS = %w[owner private deskPhone leftBehindChance].freeze

def template_path(name)
  "scenarios/#{name}/scenario.json.erb"
end

def render_text(text)
  srand(1)
  JSON.parse(ERB.new(text).result(binding))
end

def transform(data)
  copy = Marshal.load(Marshal.dump(data))
  FU::STEP_8B[:scenario].call(copy)
  copy
end

# Every room object, keyed by id (ids are unique per scenario).
def objects_by_id(data)
  out = {}
  (data['rooms'] || {}).each_value do |room|
    next unless room.is_a?(Hash)

    Array(room['objects']).each { |o| out[o['id']] = o if o.is_a?(Hash) && o['id'] }
  end
  out
end

# Compact JSON that matches the hand-inline style used in some templates:
#   objects  -> { "k": v, "k2": v2 }  (padded inside the braces)
#   arrays   -> [a, b]                (no padding inside the brackets)
#   {} stays {} ; [] stays []
def compact(value)
  case value
  when Hash
    return '{}' if value.empty?

    inner = value.map { |k, v| "#{k.to_json}: #{compact(v)}" }.join(', ')
    "{ #{inner} }"
  when Array
    return '[]' if value.empty?

    "[#{value.map { |v| compact(v) }.join(', ')}]"
  else
    value.to_json
  end
end

# Multiline pretty JSON for a value, every line after the first prefixed with `indent`.
def multiline(value, indent)
  JSON.pretty_generate(value).gsub("\n", "\n#{indent}")
end

# Find the line index of an object's `"id": "<id>"` line.
def id_line_index(lines, id)
  needle = "\"id\": #{id.to_json}"
  lines.index { |l| l.include?(needle) } or raise "id line not found for #{id}"
end

# Leading whitespace of a line.
def indent_of(line)
  line[/\A\s*/]
end

# From a start line index, find the matching close of the first `{` at or after it on that line,
# returning [start_line, end_line] spanning the braced block. Used to locate an affordance block.
def brace_block(lines, start_idx)
  depth = 0
  started = false
  (start_idx...lines.length).each do |i|
    lines[i].each_char do |c|
      if c == '{'
        depth += 1
        started = true
      elsif c == '}'
        depth -= 1
        return [start_idx, i] if started && depth.zero?
      end
    end
  end
  raise "unterminated brace block from line #{start_idx}"
end

# The object's block [start,end] by brace-matching from its opening `{`. The opening brace is the
# line above the id line whose depth opens the object; we scan back to the nearest line that is just
# `{` or ends with `{` at indent == id_indent - 2 spaces.
def object_block(lines, id_idx)
  id_indent = indent_of(lines[id_idx]).length
  open_idx = (0...id_idx).to_a.reverse.find do |i|
    stripped = lines[i].rstrip
    stripped.end_with?('{') && indent_of(lines[i]).length == id_indent - 2
  end
  raise "object open brace not found for id line #{id_idx}" unless open_idx

  brace_block(lines, open_idx)
end

# Edit one object's lines array region in place. Returns the new region lines.
def rewrite_object(region, old_obj, new_obj, id)
  id_idx = region.index { |l| l.include?("\"id\": #{id.to_json}") }
  id_line = region[id_idx]
  obj_indent = indent_of(id_line)

  # (1) In-place renames of retired owner keys -> owner.
  region = region.map do |line|
    RETIRED_OWNER_KEYS.reduce(line) do |acc, key|
      acc.sub(/"#{key}"(\s*:)/, "\"owner\"\\1")
    end
  end

  # (2) Affordance move: if the new affordance differs from the old, replace the affordance block
  #     with the new value, matching inline-vs-multiline source style.
  old_aff = old_obj['affordance']
  new_aff = new_obj['affordance']
  if old_aff != new_aff && new_aff.is_a?(Hash)
    aff_idx = region.index { |l| l.include?('"affordance":') }
    raise "affordance line not found for #{id}" unless aff_idx

    aff_line = region[aff_idx]
    aff_indent = indent_of(aff_line)
    trailing = region[brace_block(region, aff_idx)[1]].rstrip.end_with?(',') ? ',' : ''
    inline = aff_line.rstrip.end_with?('}', '},')
    _s, aff_end = brace_block(region, aff_idx)
    body = inline ? compact(new_aff) : multiline(new_aff, aff_indent)
    region[aff_idx..aff_end] = ["#{aff_indent}\"affordance\": #{body}#{trailing}\n"]
  end

  # (3) Object-level additions that are NOT produced by a rename: a derived/affordance owner, a
  #     moved-up private, a deskPhone marker, a newly written leftBehindChance. An owner that came
  #     from renaming screenOwner/phoneOwner/phoneOf/leftBehindBy is already in place.
  renamed_owner = RETIRED_OWNER_KEYS.any? { |k| old_obj.key?(k) }
  from_aff_owner = old_aff.is_a?(Hash) && old_aff.key?('owners')
  additions = []
  if new_obj.key?('owner') && !renamed_owner
    # owner is either a derived string (no affordance.owners) or the moved-up affordance.owners list
    additions << ['owner', new_obj['owner']] if from_aff_owner || !old_obj.key?('owner')
  end
  additions << ['private', new_obj['private']] if new_obj.key?('private') && !old_obj.key?('private')
  if new_obj['deskPhone'] && !old_obj['deskPhone']
    additions << ['deskPhone', true]
  end
  if new_obj.key?('leftBehindChance') && !old_obj.key?('leftBehindChance')
    additions << ['leftBehindChance', new_obj['leftBehindChance']]
  end

  unless additions.empty?
    id_idx = region.index { |l| l.include?("\"id\": #{id.to_json}") } # may have shifted
    new_lines = additions.map { |k, v| "#{obj_indent}#{k.to_json}: #{compact(v)},\n" }
    region.insert(id_idx + 1, *new_lines)
  end

  region
end

def rewrite_scenario(name, write:)
  path = template_path(name)
  text = File.read(path)
  raise "#{name}: ERB template, hand-edit only" if text.include?('<%')

  old_data = render_text(text)
  new_data = transform(old_data)

  # File-level pure renames for owner keys that are not confined to room objects (an item's phoneOf /
  # leftBehindBy lives in an NPC's itemsHeld). These always map straight to `owner`. phoneOwner is
  # NOT here: it also marks a desk phone, so it is handled per object.
  %w[screenOwner phoneOf leftBehindBy].each do |key|
    text = text.gsub(/"#{key}"(\s*:)/, "\"owner\"\\1")
  end

  old_by_id = objects_by_id(old_data)
  new_by_id = objects_by_id(new_data)

  # ids whose object-level owner fields change
  changed_ids = new_by_id.keys.select do |id|
    o = old_by_id[id]
    n = new_by_id[id]
    owner_slice = ->(h) { ADD_KEYS.each_with_object({}) { |k, m| m[k] = h[k] if h.key?(k) } }
    o_aff = o['affordance']
    n_aff = n['affordance']
    owner_slice.call(o) != owner_slice.call(n) ||
      RETIRED_OWNER_KEYS.any? { |k| o.key?(k) } ||
      (o_aff.is_a?(Hash) && (o_aff.key?('owners') || o_aff.key?('private')) && o_aff != n_aff)
  end

  lines = text.lines
  # Edit objects bottom-up so earlier line indices stay valid.
  blocks = changed_ids.map { |id| [id, id_line_index(lines, id)] }.sort_by { |_, i| -i }
  blocks.each do |id, id_idx|
    s, e = object_block(lines, id_idx)
    region = lines[s..e]
    region = rewrite_object(region, old_by_id[id], new_by_id[id], id)
    lines[s..e] = region
  end
  result = lines.join

  # Verify: the rewritten template, rendered, equals the transform of the old render, and carries no
  # retired owner key.
  rewritten = render_text(result)
  unless rewritten == new_data
    raise "#{name}: rewrite does not match transform(old) (parsed inequality)"
  end
  retired = FU.retired_keys_in(rewritten)
  raise "#{name}: retired keys remain after rewrite: #{retired.inspect}" unless retired.empty?

  File.write(path, result) if write
  puts "#{name}: #{changed_ids.length} objects rewritten; render == transform(old); no retired keys"
end

# --- main ---
step = nil
check = false
names = []
ARGV.each_with_index do |a, _i|
  case a
  when '--step' then step = ARGV[ARGV.index('--step') + 1]
  when '--check' then check = true
  else names << a unless a == step && step
  end
end
names.reject! { |n| n == step }
abort 'only --step 2 is implemented' unless step == '2'
abort 'no scenarios given' if names.empty?

names.each { |n| rewrite_scenario(n, write: !check) }
