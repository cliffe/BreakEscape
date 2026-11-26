#!/usr/bin/env ruby
# frozen_string_literal: true

# Break Escape Scenario Validator
# Validates scenario.json.erb files by rendering ERB to JSON and checking against schema
#
# Usage:
#   ruby scripts/validate_scenario.rb scenarios/ceo_exfil/scenario.json.erb
#   ruby scripts/validate_scenario.rb scenarios/ceo_exfil/scenario.json.erb --schema scripts/scenario-schema.json

require 'erb'
require 'json'
require 'optparse'

# Scenario, ink and schema files are UTF-8. Read them so whatever the shell's locale: under
# LANG=C (US-ASCII) the ERB render, the ink compile and the clue texts would otherwise fail
# or drop files.
Encoding.default_external = Encoding::UTF_8
require 'pathname'
require 'set'
require 'base64'
require 'open3'
require_relative 'validator_report'
require_relative 'validate_social'
require_relative 'validate_npc_needs'
require_relative 'validate_network'
require_relative 'validate_capture_log'
require_relative 'validate_log_rows'
require_relative 'validate_network_ops'
require_relative 'validate_privilege'
require_relative 'validate_mfa'
require_relative 'validate_lock_step'
require_relative 'validate_helpdesk'
require_relative 'validate_realism_skin'
require_relative 'validate_secret_leaks'
require_relative 'validate_wearable'
require_relative 'validate_plant_hiding'
require_relative 'validate_phone_calls'
require_relative 'validate_cracking'
require_relative '../lib/break_escape/scenario_schema'
require_relative '../lib/break_escape/author_notes'
require_relative '../lib/break_escape/schema_walk'
require_relative '../lib/break_escape/format_upgrade'
require_relative '../lib/break_escape/declared_grants'
require_relative '../lib/break_escape/access_identities'
require_relative '../lib/break_escape/capture_model'
require_relative '../lib/break_escape/credential_model'
require_relative '../lib/break_escape/phish_score'
require_relative '../lib/break_escape/npc_habits'
require_relative '../lib/break_escape/npc_habits/clues'
require_relative 'validate_npc_habits'
require_relative '../lib/break_escape/access_work'
require_relative '../lib/break_escape/owner_claim'
require_relative 'validate_access_work'
require_relative 'validate_office_life'

# Try to load json-schema gem, provide helpful error if missing
begin
  require 'json-schema'
rescue LoadError
  $stderr.puts <<~ERROR
    ERROR: json-schema gem is required for validation.

    Install it with:
      gem install json-schema

    Or add to Gemfile:
      gem 'json-schema'

    Then run: bundle install
  ERROR
  exit 1
end

# One ERB binding for every renderer (plan step 5): the validator renders through the same
# BreakEscape::ScenarioBinding as the server, so a top-level `flags` block is the Hash the server
# builds, not the plain array the validator's old copy produced.
require_relative '../lib/break_escape/scenario_binding'

# Load valid item types from the objects asset directory.
# Returns a Set of type strings (filenames without .png extension), or nil if the directory
# cannot be found (in which case callers should skip the check).
def load_valid_item_types(base_dir)
  assets_dir = File.join(base_dir, 'public', 'break_escape', 'assets', 'objects')
  return nil unless Dir.exist?(assets_dir)

  types = Dir.glob(File.join(assets_dir, '*.png')).map do |f|
    File.basename(f, '.png')
  end
  Set.new(types)
end

# Load valid room types from the engine's room map registry. A room's "type" is the key the engine
# registers with this.load.tilemapTiledJSON('<type>', 'rooms/<file>.json') in game.js; a type with
# no registration cannot load. This reads those keys straight from the engine, the way the sprite
# check reads the object asset files, so a new room map is accepted the moment the engine loads it
# and no hand-maintained enum can drift. Returns a Set of type strings, or nil when game.js cannot be
# found (callers skip the check).
def load_valid_room_types(base_dir)
  game_js = File.join(base_dir, 'public', 'break_escape', 'js', 'core', 'game.js')
  return nil unless File.exist?(game_js)

  types = File.read(game_js).scan(/tilemapTiledJSON\(\s*['"]([^'"]+)['"]/).flatten
  return nil if types.empty?

  Set.new(types)
end

# Render ERB template to JSON
def render_erb_to_json(erb_path, vm_context = {}, include_rendered: false)
  unless File.exist?(erb_path)
    raise "ERB file not found: #{erb_path}"
  end

  erb_content = File.read(erb_path)
  json_output = BreakEscape::ScenarioBinding.render(erb_content, vm_context)

  parsed = JSON.parse(json_output)
  include_rendered ? [parsed, json_output] : parsed
rescue JSON::ParserError => e
  raise "Invalid JSON after ERB processing: #{e.message}\n\nGenerated JSON:\n#{json_output}"
rescue StandardError => e
  raise "Error processing ERB: #{e.class}: #{e.message}\n#{e.backtrace.first(5).join("\n")}"
end

# Parse top-level JSON keys directly from rendered text so duplicate keys can be detected
# before JSON.parse key-collision overwrite semantics hide them.
def top_level_key_counts(json_text)
  counts = Hash.new(0)
  i = 0
  depth = 0

  while i < json_text.length
    ch = json_text[i]

    if ch == '"'
      key_text, next_idx = read_json_string(json_text, i)

      if depth == 1
        j = next_idx
        j += 1 while j < json_text.length && json_text[j].match?(/\s/)
        counts[key_text] += 1 if j < json_text.length && json_text[j] == ':'
      end

      i = next_idx
      next
    end

    if ch == '{'
      depth += 1
    elsif ch == '}'
      depth -= 1 if depth > 0
    end

    i += 1
  end

  counts
end

def read_json_string(json_text, start_idx)
  out = +' '
  out.clear
  i = start_idx + 1
  escaped = false

  while i < json_text.length
    ch = json_text[i]

    if escaped
      out << ch
      escaped = false
    elsif ch == '\\'
      out << ch
      escaped = true
    elsif ch == '"'
      return [out, i + 1]
    else
      out << ch
    end

    i += 1
  end

  # Unterminated string: return what we captured so caller can continue safely.
  [out, i]
end

def check_duplicate_show_scenario_brief(rendered_json)
  issues = []
  key_count = top_level_key_counts(rendered_json)['show_scenario_brief']

  if key_count > 1
    issues << "❌ ERROR: Top-level field 'show_scenario_brief' is defined #{key_count} times. Keep exactly one declaration. Use 'show_scenario_brief': 'on_resume' when using an opening timedConversation briefing so both UIs do not appear at mission start."
  end

  issues
end

# THREAT row `outcome` checks for a music event's credits (credits-theme.js creditsThreat).
# A line, person, clause or section may carry `outcome`; only "contained" and "active" are read.
# A title, headerText or statusText that says FAILED or COMPROMISED, with no outcome and no
# threatText anywhere, is left to the engine's word sniffing: warn so the author states it.
CREDITS_OUTCOMES = %w[contained active].freeze
CREDITS_BAD_WORDS = /\b(?:FAILED|FAILURES?|COMPROMISED)\b/i

def credits_nodes(items)
  Array(items).flat_map do |item|
    next [] unless item.is_a?(Hash)

    [item] + credits_nodes(item['lines']) + credits_nodes(item['people']) + credits_nodes(item['clauses'])
  end
end

def credits_outcome_issues(event, path)
  nodes = credits_nodes(event['credits'])
  found = []
  nodes.each do |n|
    next unless n.key?('outcome') && !CREDITS_OUTCOMES.include?(n['outcome'])

    found << "❌ ERROR: '#{path}/credits' has outcome #{n['outcome'].inspect}; use \"contained\" or \"active\", lowercase, as the schema enum does for an entry."
  end
  stated = event.key?('outcome') || nodes.any? { |n| n.key?('outcome') } || event['threatText'].to_s.strip != ''
  titles = nodes.select { |n| n['style'] == 'title' }.map { |n| n['text'].to_s }
  wording = [event['headerText'], event['statusText'], *titles].compact.select { |t| t.to_s.match?(CREDITS_BAD_WORDS) }
  if !stated && wording.any?
    found << "⚠️ WARNING: '#{path}' reads #{wording.first.inspect} but sets no \"outcome\" (\"contained\" or \"active\") or threatText, " \
             "so the THREAT row guesses from the words. Set outcome on the entry or its title line to say what it shows."
  end
  found
end

# Validate JSON against schema
def validate_json(json_data, schema_path)
  unless File.exist?(schema_path)
    raise "Schema file not found: #{schema_path}"
  end

  schema = JSON.parse(File.read(schema_path))
  errors = JSON::Validator.fully_validate(schema, json_data, strict: false)

  errors + validate_grant_foothold_actions(schema, json_data)
rescue JSON::ParserError => e
  raise "Invalid JSON schema: #{e.message}"
end

# A grant_foothold action may sit in any action list (timers, triggerOnInteract, onConfirm and
# others), several of which the schema leaves open. The schema's grantFootholdAction definition is
# the one list of its keys; this applies it to every such action, wherever it is, and returns
# json-schema's own messages with the action's pointer in front.
def validate_grant_foothold_actions(schema, json_data)
  definition = schema.dig('definitions', 'grantFootholdAction')
  return [] unless definition

  sub = { 'definitions' => schema['definitions'], '$ref' => '#/definitions/grantFootholdAction' }
  out = []
  # The walk carries the ScenarioSchema Node for each value (nil where the schema does not describe
  # it), so it tells a note from an id from free data through the shared resolver: a key of an id map
  # (rooms, networks, an NPC's needs, any node whose additionalProperties is a schema) is an id and
  # is walked even when it starts with "_"; a key inside free data (minigameData, config, ...) is
  # walked whatever its first character; a "_" key anywhere else is an author note and is skipped.
  # Resolution uses the repository schema (ScenarioSchema.root), so the validator and the server
  # agree even when --schema names another file.
  walk = lambda do |node, pointer, snode|
    case node
    when Hash
      if node['type'] == 'grant_foothold'
        JSON::Validator.fully_validate(sub, node, strict: false).each do |msg|
          out << msg.sub(/\AThe property '#\/?([^']*)'/) do
            rest = Regexp.last_match(1)
            "The property '#{rest.empty? ? pointer : "#{pointer}/#{rest}"}'"
          end
        end
      end
      node.each do |k, v|
        key = k.to_s
        next if BreakEscape::AuthorNotes.note?(snode, key)

        child_pointer = "#{pointer}/#{key.gsub('~', '~0').gsub('/', '~1')}"
        walk.call(v, child_pointer, BreakEscape::ScenarioSchema.child(snode, key))
      end
    when Array
      items = BreakEscape::ScenarioSchema.item(snode)
      node.each_with_index { |v, i| walk.call(v, "#{pointer}/#{i}", items) }
    end
  end
  walk.call(json_data, '#', BreakEscape::ScenarioSchema.root)
  out
end

# Step 2 of the format hardening: json-schema reports every unknown key of a closed block in one
# message ("contains additional properties [...] outside of the schema"). This rewrites it as one
# line per key, "unknown key '<k>'", with "did you mean '<known>'?" when one known key is close,
# and drops the "required property" error a misspelt required key would also raise, so one slip
# prints one line. The schema stays the definition of the keys; this only words the message.
ADDITIONAL_PROPERTIES_RE = /\AThe property '(#[^']*)' contains additional properties (\[.*\]) outside of the schema when none are allowed/m.freeze

def format_schema_errors(json_data, messages, schema = nil)
  schema ||= JSON.parse(File.read(File.join(__dir__, 'scenario-schema.json')))
  texts = messages.map { |m| m.to_s.sub(/ in schema [0-9a-f-]+#?\s*\z/, '') }
  # A retired key reintroduced in a closed block reaches the schema as an unknown key and is also
  # caught by check_retired_keys, which prints the rename line. Suppress the schema line for it, so
  # one slip prints one line (the rename). The retired pointers are the json-pointer paths
  # FormatUpgrade.retired_keys_in finds in this data.
  retired_pointers = BreakEscape::FormatUpgrade.retired_keys_in(json_data).map { |r| r[:path] }
  retired_ptr = lambda do |ptr, key|
    "#{ptr}/#{key.to_s.gsub('~', '~0').gsub('/', '~1')}"
  end
  unknown = []   # [index, pointer, key, suggestion]
  additional = []  # message indices that matched the additional-properties rule
  texts.each_with_index do |text, i|
    m = text.match(ADDITIONAL_PROPERTIES_RE)
    next unless m

    keys = begin
      JSON.parse(m[2])
    rescue JSON::ParserError
      next
    end
    additional << i
    known = schema_known_keys(schema, json_data, m[1], underscore: true)
    plain = known.reject { |k| k.start_with?('_') }
    keys.each do |k|
      next if retired_pointers.include?(retired_ptr.call(m[1], k))

      unknown << [i, m[1], k.to_s, suggest_key(k.to_s, plain, known - plain)]
    end
  end
  suggested = unknown.map { |_, ptr, _, s| [ptr, s] if s }.compact.to_set
  replaced = unknown.map(&:first).to_set
  additional = additional.to_set
  out = []
  texts.each_with_index do |text, i|
    if replaced.include?(i)
      unknown.select { |idx, *| idx == i }.each do |_, ptr, key, sugg|
        hint = sugg ? ", did you mean '#{sugg}'?" : ''
        out << "❌ ERROR: schema: #{ptr}#{describe_schema_pointer(json_data, ptr)}: unknown key '#{key}'#{hint}"
      end
      next
    end
    # An additional-properties message whose only unknown keys were retired keys: the rename line
    # (check_retired_keys) stands in for it, so the raw schema message is dropped.
    next if additional.include?(i)
    req = text.match(/\AThe property '(#[^']*)' did not contain a required property of '([^']*)'\z/)
    next if req && suggested.include?([req[1], req[2]])

    out << format_schema_error(json_data, text)
  end
  # One slip can reach json-schema twice (a grant_foothold in triggerOnInteract is checked by the
  # main schema and again by validate_grant_foothold_actions); the raw messages differ only in
  # their "in schema" suffix, so the formatted lines are the same and one is kept.
  out.uniq
end

# The keys the schema declares for the object at a data pointer (properties of the node and of its
# allOf/anyOf/oneOf branches), without "_" keys unless underscore is true. A grant_foothold action
# uses its own definition.
def schema_known_keys(schema, data, pointer, underscore: false)
  segs = pointer.sub(%r{\A#/?}, '').split('/').map { |s| s.gsub('~1', '/').gsub('~0', '~') }
  node = data
  segs.each do |seg|
    node = node.is_a?(Hash) ? node[seg] : (node.is_a?(Array) && seg.match?(/\A\d+\z/) ? node[seg.to_i] : nil)
  end
  if node.is_a?(Hash) && node['type'] == 'grant_foothold' && schema.dig('definitions', 'grantFootholdAction')
    keys = (schema.dig('definitions', 'grantFootholdAction', 'properties') || {}).keys
    return underscore ? keys : keys.reject { |k| k.start_with?('_') }
  end

  # Resolve the schema Node at this data pointer through the shared resolver (the repository schema),
  # following child for a Hash key and item for an array index. declared_property_keys flattens the
  # declared property names across every object-capable branch, where the old schema_resolve took the
  # first branch, so the known-key list can only grow.
  snode = BreakEscape::ScenarioSchema.root
  segs.each do |seg|
    break if snode.nil?

    nxt = BreakEscape::ScenarioSchema.child(snode, seg)
    nxt = BreakEscape::ScenarioSchema.item(snode) if nxt.nil? && seg.match?(/\A\d+\z/)
    snode = nxt
  end
  keys = snode.is_a?(BreakEscape::ScenarioSchema::Node) ? snode.declared_property_keys : []
  underscore ? keys : keys.reject { |k| k.start_with?('_') }
rescue StandardError
  []
end

# ", did you mean '<k>'?" for an unknown field, or '' when no known key is close.
def unknown_key_hint(key, known)
  s = suggest_key(key.to_s, known.reject { |k| k.start_with?('_') }, known.select { |k| k.start_with?('_') })
  s ? ", did you mean '#{s}'?" : ''
end

NOTE_LIKE_KEYS = %w[comment comments note notes].freeze

# The one known key a slip most likely meant: a case-insensitive match; else, for a note key
# written without its "_" (comment, comments, note, notes, any case), "_<k>" when the block
# declares it and "_comment" otherwise; else the single closest key within edit distance 2 (1 for
# keys under 5 characters; a swap of two neighbouring letters is one edit), and with none close,
# "_<k>" when the block declares it. nil when none or more than one is closest.
def suggest_key(key, known, underscore_known = [])
  low = key.downcase
  same = known.select { |k| k.downcase == low }
  return same.first if same.length == 1
  return nil if same.length > 1

  # a note key written without its "_" ("comments" is two edits from "contents") points at the note
  if NOTE_LIKE_KEYS.include?(low)
    return "_#{key}" if underscore_known.include?("_#{key}")

    return '_comment'
  end

  limit = key.length < 5 ? 1 : 2
  scored = known.map { |k| [k, key_edit_distance(low, k.downcase)] }.select { |_, d| d <= limit }
  if scored.empty?
    return nil if key.start_with?('_')
    return "_#{key}" if underscore_known.include?("_#{key}")

    return nil
  end

  best = scored.map(&:last).min
  top = scored.select { |_, d| d == best }
  top.length == 1 ? top.first.first : nil
end

# Optimal string alignment distance: Levenshtein plus a swap of two neighbouring letters as one edit.
def key_edit_distance(a, b)
  d = Array.new(a.length + 1) { |i| Array.new(b.length + 1) { |j| i.zero? ? j : (j.zero? ? i : 0) } }
  (1..a.length).each do |i|
    (1..b.length).each do |j|
      cost = a[i - 1] == b[j - 1] ? 0 : 1
      d[i][j] = [d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost].min
      if i > 1 && j > 1 && a[i - 1] == b[j - 2] && a[i - 2] == b[j - 1]
        d[i][j] = [d[i][j], d[i - 2][j - 2] + 1].min
      end
    end
  end
  d[a.length][b.length]
end

# Validate that scenario follows proper directory structure
# Scenarios must be in their own directory with a mission.json file
def check_scenario_directory_structure(erb_path)
  # Get the directory containing the scenario.json.erb file
  scenario_dir = File.dirname(erb_path)
  scenario_name = File.basename(scenario_dir)

  # Expected mission.json path
  mission_json_path = File.join(scenario_dir, 'mission.json')

  issues = []

  # Check that mission.json exists in the scenario directory
  unless File.exist?(mission_json_path)
    issues << "❌ ERROR: Scenario directory '#{scenario_name}/' is missing required 'mission.json' file. Structure should be: scenarios/#{scenario_name}/mission.json"
  end

  # Validate mission.json structure if it exists
  if File.exist?(mission_json_path)
    begin
      mission = JSON.parse(File.read(mission_json_path))

      # Check required fields
      required_fields = %w[display_name description difficulty_level]
      missing_fields = required_fields.filter { |field| !mission.key?(field) || mission[field].to_s.strip.empty? }

      if missing_fields.any?
        issues << "❌ ERROR: mission.json is missing required fields: #{missing_fields.join(', ')}"
      end
      # scoring and endingCheck are checked once, by the objective wiring check (with the rendered data)
    rescue JSON::ParserError => e
      issues << "❌ ERROR: mission.json contains invalid JSON: #{e.message}"
    rescue StandardError => e
      issues << "❌ ERROR: Error reading mission.json: #{e.message}"
    end
  end

  issues
end

# mission.json "scoring" (read by BreakEscape::Mission#scoring_mode). An unknown
# value is an error (the engine would silently fall back to "tasks"). With the
# rendered scenario, warn when a mode that only reaches 100 on conclusion has no
# missionConclusion aim, since such a mission can never score 100.
SCORING_MODES = %w[tasks partial_then_complete completion].freeze

def check_mission_scoring(mission, json_data = nil)
  return [] unless mission.is_a?(Hash) && mission.key?('scoring')

  mode = mission['scoring']
  unless SCORING_MODES.include?(mode)
    return ["❌ ERROR: mission.json 'scoring' is #{mode.inspect}; it must be one of #{SCORING_MODES.join(', ')} " \
            "(or left out, which means tasks)"]
  end
  return [] if json_data.nil? || mode == 'tasks'

  has_conclusion = (json_data['objectives'] || []).any? { |aim| aim.is_a?(Hash) && aim['missionConclusion'] }
  return [] if has_conclusion

  ["⚠️ WARNING: mission.json 'scoring' is \"#{mode}\" but no aim has missionConclusion:true, so " \
   "mission_concluded_at is never set and the score can never reach 100"]
end

# mission.json "resultGlobal" / "stage" (read by BreakEscape::Mission#result_global
# and #result_stage) and "endingCheck". resultGlobal names the numeric game global
# that holds an awareness check's result percent; with the rendered scenario it
# must be declared there as a number. stage says where the result sits in the
# course. endingCheck, when present, must be true or false.
RESULT_STAGES = %w[pre post episode].freeze
RESULT_GLOBAL_PATTERN = /\A[A-Za-z][A-Za-z0-9_]*_percent\z/

def check_mission_result(mission, json_data = nil)
  return [] unless mission.is_a?(Hash)

  issues = []
  if mission.key?('endingCheck') && ![true, false].include?(mission['endingCheck'])
    issues << "❌ ERROR: mission.json 'endingCheck' is #{mission['endingCheck'].inspect}; it must be true or false " \
              "(false turns off the warning before the ending)"
  end
  if mission.key?('stage') && !RESULT_STAGES.include?(mission['stage'])
    issues << "❌ ERROR: mission.json 'stage' is #{mission['stage'].inspect}; it must be one of #{RESULT_STAGES.join(', ')}"
  end
  return issues unless mission.key?('resultGlobal')

  name = mission['resultGlobal']
  unless name.is_a?(String) && RESULT_GLOBAL_PATTERN.match?(name)
    issues << "❌ ERROR: mission.json 'resultGlobal' is #{name.inspect}; it must be a global name ending in _percent " \
              "(for example triage_pre_percent)"
    return issues
  end
  if json_data
    declared = json_data['globalVariables']
    declared = {} unless declared.is_a?(Hash)
    if !declared.key?(name)
      issues << "❌ ERROR: mission.json 'resultGlobal' names #{name.inspect}, which the scenario does not declare in globalVariables"
    elsif !declared[name].is_a?(Numeric)
      issues << "❌ ERROR: mission.json 'resultGlobal' names #{name.inspect}, which is declared as #{declared[name].inspect} (it must be a number)"
    end
  end
  unless mission.key?('stage')
    issues << "⚠️ WARNING: mission.json has 'resultGlobal' but no 'stage' (pre, post or episode); the engine will guess it from the global's name"
  end
  issues
end

# True when any eventMapping in the scenario carries "endingCheck": true — the engine-level
# point-of-no-return warning (npc-manager.js _handleEventMapping, systems/ending-check.js).
# That mapping asks before it opens the debrief and, on "Keep going", holds the ending for the
# objectives panel, so a debrief with no player choice to tag can still warn in time without a
# soft-lock. Walks the whole tree because mappings live under rooms[].npcs[].eventMappings[]
# (array or object form).
def scenario_has_ending_check_mapping?(node)
  case node
  when Hash
    return true if node['endingCheck'] == true && (node.key?('eventPattern') || node.key?('eventMappings') || node.key?('eventMapping'))
    node.values.any? { |v| scenario_has_ending_check_mapping?(v) }
  when Array
    node.any? { |v| scenario_has_ending_check_mapping?(v) }
  else
    false
  end
end

# The ending warning (public/break_escape/js/systems/ending-check.js). The engine asks
# the player before the credits and before the last task of a missionConclusion aim is
# posted, but it cannot warn in time for a one-shot debrief unless the choice that starts
# it carries `#ending_check`, or an eventMapping that opens the debrief carries
# "endingCheck": true. Warn when a mission has optional tasks, has not opted out with
# "endingCheck": false, concludes through a missionConclusion aim, and neither route is used.
# `scenario_dir` is the scenario's directory (its ink/ folder is searched).
def check_mission_ending_check(mission, json_data, scenario_dir)
  return [] unless mission.is_a?(Hash) && json_data.is_a?(Hash)
  return [] if mission['endingCheck'] == false

  aims = (json_data['objectives'] || []).select { |a| a.is_a?(Hash) }
  return [] unless aims.any? { |aim| aim['missionConclusion'] }
  return [] unless aims.any? { |aim| (aim['tasks'] || []).any? { |t| t.is_a?(Hash) && t['optional'] == true } }

  return [] if scenario_has_ending_check_mapping?(json_data)

  # The engine runs the compiled .json, not the .ink source. A #ending_check tag compiles to
  # "^ending_check" in the sibling .json, so accept the tag only when that compiled .json carries
  # it. If the .ink has the tag but its sibling .json does not, the compile is stale and the live
  # game will not warn before the debrief, so flag that separately.
  ink_files = Dir.glob(File.join(scenario_dir.to_s, '{ink,}', '*.ink'))
  json_files = Dir.glob(File.join(scenario_dir.to_s, '{ink,}', '*.json'))
  json_has_tag = json_files.any? { |f| File.read(f).match?(/\^\s*ending_check\b/) }
  stale = ink_files.select do |f|
    next false unless File.read(f).match?(/#\s*ending_check\b/)
    compiled = f.sub(/\.ink\z/, '.json')
    !(File.file?(compiled) && File.read(compiled).match?(/\^\s*ending_check\b/))
  end.map { |f| File.basename(f) }

  unless stale.empty?
    return ["⚠️ WARNING: #{stale.join(', ')} uses #ending_check in its ink, but the compiled .json beside it " \
            "does not carry the tag (stale compile). The engine runs the compiled .json, not the .ink source, so " \
            "the ending warning will not fire in the live game. Recompile the ink (bin/inklecate) so the tag " \
            "reaches the .json."]
  end
  return [] if json_has_tag

  ["⚠️ WARNING: the mission has optional tasks and concludes through a missionConclusion aim, but it neither uses " \
   "#ending_check in its ink nor carries \"endingCheck\": true on the eventMapping that opens the debrief. The engine still " \
   "asks before the credits, but it can only warn before the debrief starts if the choice that starts it begins with " \
   "#ending_check (before its #set_global or #complete_task), or the mapping that opens it sets \"endingCheck\": true. Add " \
   "one of those, or set \"endingCheck\": false in mission.json if the mission is under time pressure."]
end

# Step 2b: an author note (a "_"-prefixed property name, by the schema) is never read by the engine
# and never ships. If a note parks an action (a Hash with a string "type", at any depth of the note's
# value), it is dead code, so warn the author. Walks with the shared resolver, so it tells a note
# from an id from free data exactly as the engine does: it never looks inside an id or free data (a
# "_" key there is real), only inside genuine notes. The corpus has none, so this adds no lines.
# Step 7. A rendered template carries current field names and no formatVersion. Error on a template
# that sets formatVersion (the server stamps it at creation), and on every retired key present
# (renamed by a FormatUpgrade step), unless an alias keeps it for a deployed scenario (a warning).
# Author notes and free data are skipped (FormatUpgrade.retired_keys_in). STEPS is empty in step 7,
# so this adds no line to the corpus until a rename step lands.
def check_retired_keys(json_data)
  issues = []
  if json_data.is_a?(Hash) && json_data.key?('formatVersion')
    issues << "❌ ERROR: '#/formatVersion': the server stamps formatVersion at creation; remove it from the template"
  end
  BreakEscape::FormatUpgrade.retired_keys_in(json_data).each do |r|
    issues << if r[:aliased]
                "⚠️ WARNING: #{r[:path]}: '#{r[:key]}' was renamed to '#{r[:now]}' in format #{r[:version]} (kept as an alias for a deployed scenario)"
    else
                "❌ ERROR: #{r[:path]}: '#{r[:key]}' was renamed to '#{r[:now]}' in format #{r[:version]}"
    end
  end
  issues
end

# "wallMounted": true is for a tall interactable fixed to a back wall (a power socket): reach is
# measured to the nearest part of the sprite's height (interaction-reach.js reachY). Warn where it
# sits on something it cannot help: an NPC, an object with interactable: false, or a type that is
# not one of generate_rooms.py's WALL_MOUNTED_EXTRAS (read from that file, so there is one list).
# An object given an explicit position (tiles from the room's top-left) is judged by position.y,
# which is the sprite's TOP edge (origin 0,0; rooms.js sets sprite.y = room y + position.y * TILE_SIZE).
# The back wall is 2 rows in every room, so a top edge at y >= 2 starts on the floor, not the wall.
# Not judged: objects with no position (they take the room template's slot) and objects placed with
# pixel position.px/py (not converted here).
WALL_MOUNTED_MAX_Y = 2.0
WALL_MOUNTED_EXTRAS_FILE = File.join(File.expand_path('..', __dir__), 'scripts', 'generate_rooms.py')

def wall_mounted_extras
  @wall_mounted_extras ||= begin
    m = File.read(WALL_MOUNTED_EXTRAS_FILE).match(/WALL_MOUNTED_EXTRAS = \{\n(.*?)\n\}/m)
    m ? m[1].scan(/"([a-z0-9_]+)"/).flatten : nil
  end
end

def check_wall_mounted(json_data, extras = wall_mounted_extras)
  issues = []
  return issues unless json_data.is_a?(Hash) && json_data['rooms'].is_a?(Hash)
  json_data['rooms'].each do |rid, room|
    next unless room.is_a?(Hash)
    { 'objects' => 'object', 'npcs' => 'NPC' }.each do |key, kind|
      Array(room[key]).each_with_index do |o, i|
        next unless o.is_a?(Hash) && o['wallMounted'] == true
        why = if kind == 'NPC'
          'it is an NPC (the key is read for scenario objects only)'
        elsif o['interactable'] == false
          'the object has interactable: false, so nothing reaches for it'
        elsif extras && !extras.include?(o['type'].to_s.sub(/\d+\z/, ''))
          "type '#{o['type']}' is not a wall-mounted type (WALL_MOUNTED_EXTRAS in scripts/generate_rooms.py)"
        elsif o['position'].is_a?(Hash) && o['position']['y'].is_a?(Numeric) && o['position']['y'] >= WALL_MOUNTED_MAX_Y
          "position.y #{o['position']['y']} starts at or below the back wall's floor line (#{WALL_MOUNTED_MAX_Y.to_i} tiles, top edge), so the object is not on a wall"
        end
        next unless why
        issues << "⚠️ WARNING: rooms/#{rid}/#{key}[#{i}] '#{o['id'] || o['name']}': wallMounted is set but #{why}. " \
                  'Use it only on a tall interactable fixed to a back wall, such as a power socket.'
      end
    end
  end
  issues
end

# Step 8b (format 2). The merged `owner` field: a single-owner kind (a workstation, a desk phone,
# a Friendface phone, a left-behind item) carries one NPC id, never a list; a private object may
# list several. Warn where a workstation or private object has no owner of its own but an NPC's
# needsHome names it (needsHome no longer sets an owner). Report the pre-rename two-field conflict
# (`screenOwner` against `affordance.owners` naming different owners); none is expected.
def check_owner_fields(json_data)
  ai = BreakEscape::AccessIdentities
  issues = []
  home_npc = {}
  ai.room_npcs(json_data).each do |e|
    h = e[:npc]['needsHome']
    next unless h.is_a?(String) && !h.empty?
    next unless e[:npc]['id'].is_a?(String) && !e[:npc]['id'].empty?

    home_npc[h] ||= e[:npc]['id']
  end

  ai.room_objects(json_data).each do |e|
    obj = e[:object]
    where = "object '#{obj['id'] || e[:path]}'"
    owner = obj['owner']
    owner_set = (owner.is_a?(String) && !owner.empty?) || (owner.is_a?(Array) && !owner.empty?)

    single_kind = if ai.workstation?(obj) then 'a workstation'
    elsif obj['deskPhone'] == true then 'a desk phone'
    elsif obj['type'] == 'phone_friendface' then 'a Friendface phone'
    elsif obj.key?('leftBehindChance') then 'a left-behind item'
    end
    if owner.is_a?(Array) && single_kind
      issues << "❌ ERROR: #{where}: #{single_kind} has one owner; owner must be a single NPC id (not a list)."
    end

    # The pre-rename conflict: an object that still names an owner two ways, differently.
    aff = obj['affordance']
    if obj.key?('screenOwner') && aff.is_a?(Hash) && aff.key?('owners') &&
       Array(aff['owners']).map(&:to_s) != [obj['screenOwner'].to_s]
      issues << "❌ ERROR: #{where}: names an owner both as screenOwner and affordance.owners, and they differ; set a single owner."
    end

    # needsHome no longer sets an owner: warn where the owner would have been derived from it.
    old_explicit = obj.key?('screenOwner') || obj.key?('phoneOwner') ||
                   (aff.is_a?(Hash) && aff.key?('owners'))
    private_obj = obj['private'] == true || (aff.is_a?(Hash) && aff['private'] == true)
    if !owner_set && !old_explicit && (ai.workstation?(obj) || private_obj) && home_npc[obj['id'].to_s]
      issues << "⚠️ WARNING: #{where}: needsHome no longer sets an owner; add owner: '#{home_npc[obj['id'].to_s]}' if this is theirs."
    end
  end
  issues
end

def check_notes_hold_no_actions(json_data)
  warnings = []
  holds_action = lambda do |val|
    case val
    when Hash
      val['type'].is_a?(String) || val.values.any? { |v| holds_action.call(v) }
    when Array
      val.any? { |v| holds_action.call(v) }
    else
      false
    end
  end
  walk = lambda do |node, pointer, snode|
    case node
    when Hash
      node.each do |k, v|
        key = k.to_s
        child_pointer = "#{pointer}/#{key.gsub('~', '~0').gsub('/', '~1')}"
        if BreakEscape::AuthorNotes.note?(snode, key)
          if holds_action.call(v)
            warnings << "⚠️ WARNING: #{child_pointer}: this author note holds an action, which the engine never runs"
          end
        else
          walk.call(v, child_pointer, BreakEscape::ScenarioSchema.child(snode, key))
        end
      end
    when Array
      items = BreakEscape::ScenarioSchema.item(snode)
      node.each_with_index { |v, i| walk.call(v, "#{pointer}/#{i}", items) }
    end
  end
  walk.call(json_data, '#', BreakEscape::ScenarioSchema.root)
  warnings
end

# q94: desktopUser on a PC or laptop is { name, character? }: an object with a non-empty string name,
# and character (if set) a non-empty string. A character with no <key>_headshot.png in the character
# assets is a warning, since the desktop frame then shows a silhouette. Walks room objects (and
# their contents and itemsHeld), NPC itemsHeld and the starting inventory. Warns when set on a sign-in PC (lockType login).
# An unknown key inside desktopUser is reported once, by the schema (additionalProperties false).
DESKTOP_USER_CHARS_DIR = File.join(File.expand_path('..', __dir__), 'public/break_escape/assets/characters')

def check_desktop_users(json_data, chars_dir = DESKTOP_USER_CHARS_DIR)
  issues = []
  check = lambda do |item, path|
    return unless item.is_a?(Hash)

    if item.key?('desktopUser')
      du = item['desktopUser']
      where = "'#{path}' desktopUser"
      if item['lockType'] == 'login'
        issues << "⚠️ WARNING: #{where} is set on a sign-in PC (lockType login): " \
                  'the live session shows the signed-in user there, so desktopUser is ignored or conflicts. Remove it.'
      end
      if !du.is_a?(Hash)
        issues << "❌ ERROR: #{where} must be an object { \"name\": \"...\", \"character\": \"...\" }."
      else
        unless du['name'].is_a?(String) && !du['name'].strip.empty?
          issues << "❌ ERROR: #{where} needs a non-empty string 'name' (the display name shown as signed in)."
        end
        if du.key?('character')
          ch = du['character']
          if !ch.is_a?(String) || ch.strip.empty?
            issues << "❌ ERROR: #{where} 'character' must be a non-empty string (a character key)."
          elsif !File.exist?(File.join(chars_dir, "#{ch}_headshot.png"))
            issues << "⚠️ WARNING: #{where} character '#{ch}' has no assets/characters/#{ch}_headshot.png: " \
                      'the desktop frame shows a silhouette instead.'
          end
        end
      end
    end
    item['contents']&.each_with_index { |c, i| check.call(c, "#{path}/contents[#{i}]") } if item['contents'].is_a?(Array)
    item['itemsHeld']&.each_with_index { |c, i| check.call(c, "#{path}/itemsHeld[#{i}]") } if item['itemsHeld'].is_a?(Array)
  end
  rooms = json_data.is_a?(Hash) && json_data['rooms'].is_a?(Hash) ? json_data['rooms'] : {}
  rooms.each do |room_id, room|
    next unless room.is_a?(Hash) && room['objects'].is_a?(Array)

    room['objects'].each_with_index do |obj, i|
      check.call(obj, "rooms/#{room_id}/objects[#{i}](#{(obj.is_a?(Hash) && (obj['id'] || obj['name'])) || '?'})")
    end
  end
  inv = json_data.is_a?(Hash) ? json_data['startItemsInInventory'] : nil
  inv.each_with_index { |obj, i| check.call(obj, "startItemsInInventory[#{i}]") } if inv.is_a?(Array)
  # Objects an NPC carries (itemsHeld), on room NPCs and on the top-level npcs list.
  npc_held = lambda do |npc, npath|
    next unless npc.is_a?(Hash) && npc['itemsHeld'].is_a?(Array)

    npc['itemsHeld'].each_with_index { |obj, i| check.call(obj, "#{npath}/itemsHeld[#{i}]") }
  end
  rooms.each do |room_id, room|
    next unless room.is_a?(Hash) && room['npcs'].is_a?(Array)

    room['npcs'].each_with_index { |n, i| npc_held.call(n, "rooms/#{room_id}/npcs[#{i}](#{(n.is_a?(Hash) && n['id']) || '?'})") }
  end
  if json_data.is_a?(Hash) && json_data['npcs'].is_a?(Array)
    json_data['npcs'].each_with_index { |n, i| npc_held.call(n, "npcs[#{i}](#{(n.is_a?(Hash) && n['id']) || '?'})") }
  end
  issues
end

# Check for keys the schema does not declare. The schema (scripts/scenario-schema.json) is the one
# list of known keys: every open block it describes (rooms, objects, NPCs, event mappings, timers,
# music events and the rest) is checked against the properties it declares there, so there is no
# second list in this file. A closed block (additionalProperties: false) is left to json-schema,
# which reports its unknown keys as errors. A "_" author note, an id-map key and anything inside
# free data are never unknown. Unknown keys here stay warnings.
def schema_unknown_key_warnings(data, node, warnings, prefix: nil, seen: nil)
  retired = BreakEscape::FormatUpgrade.retired_entries.map { |e| e[:key] }.to_set
  schema = BreakEscape::ScenarioSchema
  item_def = schema.at('#/definitions/item').branches.first
  room_def = schema.at('#/definitions/room').branches.first
  BreakEscape::SchemaWalk.walk(data, node) do |value, vnode, vpath|
    next unless value.is_a?(Hash) && vnode.is_a?(schema::Node)
    next if vnode.free_branch?
    # a hash reached twice (a declared grant's item is also under timers[].actions) is checked once
    next if seen&.include?(value.object_id)

    seen&.add(value.object_id)
    # A grant_foothold action is checked against its closed definition (validate_grant_foothold_actions),
    # which reports an unknown key as an error, so it is not warned about again here.
    next if value['type'] == 'grant_foothold'

    obranches = vnode.object_branches
    next if obranches.empty? || obranches.any? { |b| schema.map_branch?(b) }
    next if obranches.any? { |b| b['additionalProperties'] == false }

    declared = vnode.declared_property_keys
    next if declared.empty?

    is_item = vnode.branches.any? { |b| b.equal?(item_def) }
    is_room = vnode.branches.any? { |b| b.equal?(room_def) }
    value.each_key do |key|
      k = key.to_s
      next if declared.include?(k)
      next if BreakEscape::AuthorNotes.note?(vnode, k)
      # A retired key (renamed by a FormatUpgrade step) already gets its rename line from
      # check_retired_keys, so one slip prints one line.
      next if retired.include?(k)
      # fingerprintQuality has its own line ("ignored: lift quality comes from the dusting minigame").
      next if is_item && k == 'fingerprintQuality'

      rel = unknown_key_path(data, vpath)
      rel = "#{prefix}#{rel.empty? || rel.start_with?('[') ? '' : '/'}#{rel}" if prefix
      room_id = vpath.last if is_room && vpath.length == 2 && vpath.first == 'rooms'
      warnings << unknown_key_message(k, unknown_key_hint(k, declared), rel,
                                      top: vpath.empty? && prefix.nil?, room_id: room_id, item: is_item)
    end
  end
  warnings
end

# The unknown-key warning, worded for where the key sits (the wording the hand-list checks used).
def unknown_key_message(key, hint, where, top:, room_id:, item:)
  ignored = 'this field will be ignored by the game engine.'
  if top
    "⚠️ WARNING: Top-level field '#{key}' is not recognized in the schema#{hint} — #{ignored} " \
      'Remove it if not needed, or check if the spelling is correct.'
  elsif room_id
    "⚠️ WARNING: Room '#{room_id}' has unknown field '#{key}'#{hint} — #{ignored}"
  elsif item
    "⚠️ WARNING: '#{where}' has unknown field '#{key}'#{hint} — " \
      "if this is minigame-specific configuration data, nest it under 'minigameData' instead."
  else
    "⚠️ WARNING: '#{where}' has unknown field '#{key}'#{hint} — #{ignored}"
  end
end

# "rooms/office/objects[2](safe)/minigameData": the data path, with the id (or name or type) of
# each array entry, as the unknown-key warnings print it.
def unknown_key_path(data, vpath)
  out = +''
  cur = data
  vpath.each do |seg|
    cur = cur.is_a?(Hash) ? cur[seg] : (cur.is_a?(Array) && seg.is_a?(Integer) ? cur[seg] : nil)
    if seg.is_a?(Integer)
      tag = cur.is_a?(Hash) ? (cur['id'] || cur['name'] || cur['type']) : nil
      out << "[#{seg}]"
      out << "(#{tag})" if tag.is_a?(String) || tag.is_a?(Numeric)
    else
      out << '/' unless out.empty?
      out << seg.to_s
    end
  end
  out
end

# The keys the schema declares for the Node reached from the root by the given data keys ("[]" for
# an array item, any id for a map key). Used by the checks below that word their own
# message for a closed block (personalSpace, los, challengeOnSight).
def schema_keys_at(*keys)
  node = BreakEscape::ScenarioSchema.root
  keys.each do |k|
    node = k == '[]' ? BreakEscape::ScenarioSchema.item(node) : BreakEscape::ScenarioSchema.child(node, k)
  end
  node.is_a?(BreakEscape::ScenarioSchema::Node) ? node.declared_property_keys : []
end

def check_unknown_fields(json_data)
  warnings = []

  # Unknown keys are checked below, against the schema: declared grants and account profile items
  # first (so their warnings name the grant), then everything the root reaches.
  checked = Set.new

  # NPC los and the opt-in los.challengeOnSight inside it, and behavior.personalSpace: closed in
  # the schema (so json-schema reports an unknown key there as an error), and worded here as well
  # with the known keys, which come from the schema.
  known_los_fields = schema_keys_at('rooms', 'x', 'npcs', '[]', 'los') + ['_comment']
  known_sight_challenge_fields = schema_keys_at('rooms', 'x', 'npcs', '[]', 'los', 'challengeOnSight') + ['_comment']
  known_personal_space_fields = schema_keys_at('rooms', 'x', 'npcs', '[]', 'behavior', 'personalSpace') | ['_comment']
  sight_challenges = []   # { path:, event: } checked against every eventMapping below
  mapping_patterns = []
  # Load minigameData schemas (flat map; entries with _dispatch:"lockType" are matched by lockType)
  minigame_schemas_path = File.join(__dir__, 'minigame-data-schemas.json')
  minigame_schemas = if File.exist?(minigame_schemas_path)
    JSON.parse(File.read(minigame_schemas_path)).reject { |k, _| k.start_with?('_') }
  else
    {}
  end

  # Alarm-panel lamps name CSS classes; the SVG fill comes from alarm-panel-minigame.css. A class with
  # no `fill:` rule paints the lamp black. A two-state lamp with no class falls back in the engine
  # (ap-off / ap-amber), so only a class that is named and undefined is flagged there. A multi-state
  # state has no fallback: a missing cssClass is written as "undefined", so it is flagged too. A value
  # may be a space-separated list (the engine writes it to className), which is fine when any token
  # has a fill rule.
  alarm_css_path = File.expand_path('../public/break_escape/css/alarm-panel-minigame.css', __dir__)
  alarm_css = File.exist?(alarm_css_path) ? File.read(alarm_css_path) : nil
  alarm_fill_classes = {}
  alarm_css&.gsub(%r{/\*.*?\*/}m, '')&.scan(/([^{}]+)\{([^}]*)\}/) do |sel, body|
    next unless body =~ /(?:\A|[;\s])fill\s*:/

    sel.split(',').each { |one| (m = one.strip.match(/\.([A-Za-z_][\w-]*)\z/)) && alarm_fill_classes[m[1]] = true }
  end
  alarm_css_missing_warned = false
  check_alarm_lamps = lambda do |md, path|
    next unless md['lamps'].is_a?(Array) && !md['lamps'].empty?

    unless alarm_css
      unless alarm_css_missing_warned
        alarm_css_missing_warned = true
        warnings << "⚠️ WARNING: '#{path}/minigameData/lamps' lamp class check skipped: public/break_escape/css/alarm-panel-minigame.css is missing, so lamp classes cannot be verified."
      end
      next
    end

    md['lamps'].each_with_index do |lamp, li|
      next unless lamp.is_a?(Hash)

      named = [['onClass', lamp['onClass'], false], ['offClass', lamp['offClass'], false]]
      (lamp['states'].is_a?(Array) ? lamp['states'] : []).each_with_index do |st, si|
        named << ["states[#{si}]/cssClass", st['cssClass'], true] if st.is_a?(Hash)
      end
      where = "'#{path}/minigameData/lamps[#{li}](#{lamp['label'] || lamp['variable'] || '?'})'"
      named.each do |field, cls, required|
        if !cls.is_a?(String) || cls.strip.empty?
          next unless required

          warnings << "⚠️ WARNING: #{where} #{field} is missing, so the lamp paints black (a multi-state lamp has no fallback class)."
          next
        end
        next if cls.split.any? { |tok| alarm_fill_classes[tok] }

        warnings << "⚠️ WARNING: #{where} #{field} names class '#{cls}', " \
                    "which has no fill rule in alarm-panel-minigame.css, so the lamp paints black. Add the rule or use an existing class."
      end
    end
  end

  check_minigame_data = lambda do |obj, path|
    md = obj['minigameData']
    return unless md.is_a?(Hash)

    check_alarm_lamps.call(md, path)

    # Every layer that reads minigameData has its own schema, and an object can hit
    # several: a locked 'pc' (type: the requiresGlobal gate) with lockType
    # ransomware_display (the ransom screen) reads both. So the fields of every
    # matching schema are known. interactionType last: a generic 'pc' that opens a
    # named minigame (blockchain_explorer). id and lockType count only for schemas
    # whose _dispatch names that key, as the engine dispatches them.
    dispatched_on = ->(k, key) { minigame_schemas[k] && minigame_schemas[k]['_dispatch'] == key }
    schema_keys = [
      (obj['type'] if minigame_schemas[obj['type']]),
      (obj['lockType'] if dispatched_on.call(obj['lockType'], 'lockType')),
      (obj['id'] if dispatched_on.call(obj['id'], 'id')),
      (obj['interactionType'] if minigame_schemas[obj['interactionType']])
    ].compact.uniq
    if schema_keys.empty?
      dispatch_key = obj['type'] || obj['lockType'] || obj['id']
      warnings << "⚠️ WARNING: '#{path}' has minigameData but no schema is defined for '#{dispatch_key}' — add an entry to minigame-data-schemas.json."
      return
    end
    schema_key = schema_keys.join("' or '")

    required = schema_keys.flat_map { |k| minigame_schemas[k]['required'] || [] }.uniq
    optional = schema_keys.flat_map { |k| minigame_schemas[k]['optional'] || [] }.uniq
    known    = (required + optional + ['_comment']).to_set

    missing = required.reject { |k| md.key?(k) && !md[k].nil? }
    missing.each do |k|
      warnings << "❌ ERROR: '#{path}' minigameData is missing required field '#{k}'."
    end

    md.each_key do |k|
      unless known.include?(k)
        warnings << "❌ ERROR: '#{path}' minigameData has undeclared field '#{k}' — not in schema for '#{schema_key}'. Add it to minigame-data-schemas.json or remove it."
      end
    end
  end

  # Item checks that are not key lists: fingerprintQuality is ignored. Recurses into contents and
  # itemsHeld, as the item walk does.
  check_item_fields = lambda do |item, path|
    next unless item.is_a?(Hash)
    warnings << "⚠️ WARNING: '#{path}' sets fingerprintQuality, which is ignored: lift quality now comes from the dusting minigame." if item.key?('fingerprintQuality')
    item['contents']&.each_with_index { |c, i| check_item_fields.call(c, "#{path}/contents[#{i}](#{c['id'] || c['type'] || '?'})") if c.is_a?(Hash) }
    item['itemsHeld']&.each_with_index { |c, i| check_item_fields.call(c, "#{path}/itemsHeld[#{i}](#{c['type'] || '?'})") if c.is_a?(Hash) }
  end
  item_node = BreakEscape::ScenarioSchema.at('#/definitions/item')

  # Check startItemsInInventory fields
  json_data['startItemsInInventory']&.each_with_index do |item, idx|
    next unless item.is_a?(Hash)
    inv_path = "startItemsInInventory[#{idx}](#{item['id'] || item['type'] || '?'})"
    check_item_fields.call(item, inv_path)
    check_minigame_data.call(item, inv_path)
  end

  # Declared grants (give_item rewards the server allowlists) carry their own item and
  # contents, which sit in no room: check their fields too (declared grants plan R2 M1).
  BreakEscape::DeclaredGrants.for(json_data).each do |grant|
    grant_path = "#{grant['path']}/item(#{grant['item']['id'] || grant['item']['type'] || '?'})"
    check_item_fields.call(grant['item'], grant_path)
    schema_unknown_key_warnings(grant['item'], item_node, warnings, prefix: grant_path, seen: checked)
    check_minigame_data.call(grant['item'], grant_path)
  end

  # Account profile items (access model 5.1) sit in no room: check their fields too.
  if json_data['accountProfiles'].is_a?(Hash)
    json_data['accountProfiles'].each do |profile_id, profile|
      next unless profile.is_a?(Hash) && profile['contents'].is_a?(Array)

      profile['contents'].each_with_index do |item, idx|
        next unless item.is_a?(Hash)
        item_path = "accountProfiles/#{profile_id}/contents[#{idx}](#{item['id'] || item['name'] || '?'})"
        check_item_fields.call(item, item_path)
        schema_unknown_key_warnings(item, item_node, warnings, prefix: item_path, seen: checked)
        check_minigame_data.call(item, item_path)
      end
    end
  end

  schema_unknown_key_warnings(json_data, BreakEscape::ScenarioSchema.root, warnings, seen: checked) if json_data.is_a?(Hash)

  # Room objects and NPCs: the checks that are not key lists
  if json_data['rooms']
    json_data['rooms'].each do |room_id, room|
      next unless room.is_a?(Hash)

      room['objects']&.each_with_index do |obj, idx|
        next unless obj.is_a?(Hash)
        obj_path = "rooms/#{room_id}/objects[#{idx}](#{obj['id'] || obj['name'] || '?'})"
        check_item_fields.call(obj, obj_path)
        check_minigame_data.call(obj, obj_path)
      end

      room['npcs']&.each_with_index do |npc, idx|
        next unless npc.is_a?(Hash)
        npc_path = "rooms/#{room_id}/npcs[#{idx}](#{npc['id'] || '?'})"

        # NPC behavior values (unknown keys are checked against the schema above)
        if npc['behavior'].is_a?(Hash)
          fpd = npc['behavior']['facePlayerDistance']
          if npc['behavior'].key?('facePlayerDistance') && !(fpd.is_a?(Numeric) && fpd > 0)
            warnings << "⚠️ WARNING: '#{npc_path}/behavior/facePlayerDistance' should be a positive number of pixels " \
                        "(default 96); #{fpd.inspect} falls back to the default."
          end
          ps = npc['behavior']['personalSpace']
          if npc['behavior'].key?('personalSpace')
            if ps.is_a?(Hash)
              ps.each_key do |key|
                next if known_personal_space_fields.include?(key)
                warnings << "⚠️ WARNING: '#{npc_path}/behavior/personalSpace' has unknown field '#{key}' — " \
                            "known: #{(known_personal_space_fields - ['_comment']).join(', ')}."
              end
              if !ps.key?('enabled') && ps.keys.any? { |k| %w[distance backAwaySpeed backAwayDistance].include?(k) }
                warnings << "⚠️ WARNING: '#{npc_path}/behavior/personalSpace' sets distances but not \"enabled\": true, " \
                            "so the NPC never backs away."
              end
            else
              warnings << "⚠️ WARNING: '#{npc_path}/behavior/personalSpace' should be an object " \
                          "{ enabled, distance, backAwaySpeed, backAwayDistance }; #{ps.inspect} is ignored."
            end
          end
        end

        # Check los fields, and the opt-in challengeOnSight inside it (npc-sight-challenge.js)
        if npc['los'].is_a?(Hash)
          npc['los'].each_key do |key|
            unless known_los_fields.include?(key)
              warnings << "⚠️ WARNING: '#{npc_path}/los' has unknown field '#{key}' — this field will be ignored by the game engine."
            end
          end
          if npc['los'].key?('origin') && !%w[torch body].include?(npc['los']['origin'])
            warnings << "⚠️ WARNING: '#{npc_path}/los/origin' is #{npc['los']['origin'].inspect}; use \"torch\" (sight starts at the torch hand) or \"body\" (sprite centre and feet). The engine falls back to the default."
          end
          challenge = npc['los']['challengeOnSight']
          challenge = {} if challenge == true
          if challenge.is_a?(Hash) && challenge['enabled'] != false
            challenge.each_key do |key|
              unless known_sight_challenge_fields.include?(key)
                warnings << "⚠️ WARNING: '#{npc_path}/los/challengeOnSight' has unknown field '#{key}' — this field will be ignored by the game engine."
              end
            end
            if npc['npcType'] != 'person'
              warnings << "⚠️ WARNING: '#{npc_path}/los/challengeOnSight' is on a #{npc['npcType'] || 'non-person'} NPC — only person NPCs in the player's room can spot the player, so it never fires."
            end
            event = challenge['event'].is_a?(String) && !challenge['event'].empty? ? challenge['event'] : "player_spotted:#{npc['id']}"
            sight_challenges << { path: npc_path, event: event }
          end
        end

        # Check eventMapping fields
        npc['eventMappings']&.each_with_index do |mapping, midx|
          next unless mapping.is_a?(Hash)
          mapping_path = "#{npc_path}/eventMappings[#{midx}]"
          mapping_patterns << mapping['eventPattern'] if mapping['eventPattern'].is_a?(String)
          # unlockDoor (F19): each room it names must exist, or the server refuses the unlock
          [mapping['unlockDoor']].flatten.compact.each do |rid|
            next if rid.is_a?(String) && json_data['rooms'].is_a?(Hash) && json_data['rooms'].key?(rid)
            warnings << "❌ ERROR: '#{mapping_path}/unlockDoor' names room #{rid.inspect}, which is not a room in this scenario."
          end
        end
      end
    end
  end

  # A challengeOnSight event that no eventMapping listens to does nothing
  # (phone contacts listen too: scenario-level npcs / phoneNPCs)
  [json_data['npcs'], json_data['phoneNPCs']].each do |list|
    next unless list.is_a?(Array)
    list.each do |npc|
      next unless npc.is_a?(Hash) && npc['eventMappings'].is_a?(Array)
      npc['eventMappings'].each { |m| mapping_patterns << m['eventPattern'] if m.is_a?(Hash) && m['eventPattern'].is_a?(String) }
    end
  end
  sight_challenges.each do |c|
    heard = mapping_patterns.any? do |p|
      p == c[:event] || (p.end_with?('*') && c[:event].start_with?(p.chomp('*')))
    end
    unless heard
      warnings << "⚠️ WARNING: '#{c[:path]}/los/challengeOnSight' emits '#{c[:event]}' but no NPC eventMapping listens for it, so spotting the player does nothing."
    end
  end

  warnings
end

# Pre-validation: check critical structure issues before schema validation
# This prevents cryptic nil errors from deeply nested code
def check_structure_validity(json_data)
  issues = []

  # Validate rooms structure
  if json_data.key?('rooms')
    if json_data['rooms'].is_a?(Array)
      issues << "❌ ERROR: 'rooms' must be a JSON object {}, not an array []. Structure should be: \"rooms\": { \"room_id\": { ... }, \"another_room\": { ... } }"
    elsif !json_data['rooms'].is_a?(Hash)
      issues << "❌ ERROR: 'rooms' must be a JSON object {} (hash), got #{json_data['rooms'].class}"
    end
  end

  # Validate startItemsInInventory structure
  if json_data.key?('startItemsInInventory')
    if json_data['startItemsInInventory'].is_a?(Hash)
      issues << "❌ ERROR: 'startItemsInInventory' must be a JSON array [], not an object {}. Structure should be: \"startItemsInInventory\": [ { \"type\": \"phone\", \"name\": \"...\" }, ... ]"
    elsif !json_data['startItemsInInventory'].is_a?(Array)
      issues << "❌ ERROR: 'startItemsInInventory' must be a JSON array [], got #{json_data['startItemsInInventory'].class}"
    end
  end

  # Validate NPCs structure if present
  if json_data.key?('npcs')
    if !json_data['npcs'].is_a?(Array)
      issues << "❌ ERROR: 'npcs' must be a JSON array [], got #{json_data['npcs'].class}"
    end
  end

  # Validate objectives structure if present
  if json_data.key?('objectives')
    if !json_data['objectives'].is_a?(Array)
      issues << "❌ ERROR: 'objectives' must be a JSON array [], got #{json_data['objectives'].class}"
    end
  end

  issues
end

# Check that ink files exist and compile
# Every "Name: text" dialogue prefix is resolved at runtime by
# person-chat-minigame.js -> normalizeSpeakerId(), which matches the text before
# the colon against an NPC id or displayName (plus the special cases player / npc /
# you / narrator). A prefix that does NOT resolve is not an error at compile time —
# the engine silently treats the whole line as unprefixed and appends it, colon and
# all, to whichever character spoke last. The player then sees "Marcus: I told them"
# sitting inside somebody else's speech bubble. This is invisible until playtest,
# so it is checked here.
INK_SPEAKER_SPECIALS = %w[narrator player npc you computer].freeze

# Abstract nouns that turn up as prose/terminal labels ("Reasoning: ...",
# "Command: nmap -sV"). Title Case and repeated, so they look like speakers to a
# naive check, but they render exactly as written and are not attribution bugs.
INK_LABEL_WORDS = %w[
  command reasoning inside note notes warning status result results reason outcome
  evidence recommendation recommendations objective objectives target targets summary
  action actions impact background context method methods tools tool step steps
  host hosts port ports service services payload output input example examples
  question answer options option task tasks goal goals risk risks finding findings
].freeze

# Words that read as physical stage direction rather than a vocal/emotional cue.
# Used only for a soft suggestion — the call is a judgement one.
INK_ACTION_EMOTE_HINTS = /\b(walks?|walking|crosses|steps?|moves?|leaves?|returns?|fetch|fetches|comes? back|goes? (?:over|off)|wanders?|paces?|strides?)\b/i.freeze

def check_ink_dialogue_hazards(ink_lines, source_ink_path, valid_speakers)
  issues = []
  unresolved = Hash.new { |h, k| h[k] = [] }

  ink_lines.each_with_index do |line, i|
    ln = i + 1
    stripped = line.strip
    next if stripped.empty?

    is_meta   = stripped.start_with?('//', '=', '~', '#', '->', 'VAR ', 'EXTERNAL ', 'CONST ', '{', '}', '>')
    is_choice = stripped.start_with?('*', '+', '-')

    # 1. A flavour emote written on its own line starts with '*', which ink parses
    #    as a choice. It becomes a phantom choice button and can dead-end a branch.
    if stripped.start_with?('*') && stripped.end_with?('*') && !stripped.include?('[') && stripped.count('*') >= 2
      issues << "❌ ERROR: '#{source_ink_path}' line #{ln}: '#{stripped[0, 60]}' is a standalone emote starting " \
                "with '*', which ink parses as a CHOICE. Attach it to a spoken line " \
                "(\"Marcus Webb: *sighs* ...\") or make it a 'Narrator:' beat."
    end

    # 2. '//' inside dialogue is an ink comment — everything after it is dropped.
    if !is_meta && stripped.include?('//')
      issues << "❌ ERROR: '#{source_ink_path}' line #{ln}: contains '//', which ink treats as a comment. " \
                "The rest of the line will be silently discarded at compile time. Rephrase or escape it."
    end

    # 3. Markdown bold is not supported and renders literally.
    if stripped.include?('**')
      issues << "⚠️ WARNING: '#{source_ink_path}' line #{ln}: '**' markdown bold is not supported by ink and " \
                "will render literally. Use capitals or plain wording instead."
    end

    # 4. An unpaired '*' inside a dialogue line breaks emote pairing.
    if !is_meta && !is_choice && stripped.count('*').odd?
      issues << "⚠️ WARNING: '#{source_ink_path}' line #{ln}: odd number of '*' characters — an emote is " \
                "probably unclosed, which will render the asterisk to the player."
    end

    # 5. A choice whose brackets don't balance swallows the rest of the line.
    if is_choice && stripped.count('[') != stripped.count(']')
      issues << "❌ ERROR: '#{source_ink_path}' line #{ln}: unbalanced '[' / ']' in a choice."
    end

    # 6. Speaker-prefix resolution.
    next if is_meta || is_choice
    m = stripped.match(/\A([A-Z][A-Za-z0-9.'\- ]{0,30}):\s+\S/)
    next unless m

    speaker = m[1].strip
    key = speaker.downcase
    next if INK_SPEAKER_SPECIALS.include?(key)
    next if key.start_with?('narrator')      # Narrator[character_id]: form
    next if valid_speakers.include?(key)

    # Only flag things that actually look like a character name, so terminal /
    # computer output ("CONFIRM: Do not transmit?", "Evidence release held: ...")
    # is not mistaken for broken attribution. A name is Title Case in every word
    # and is not a shouted all-caps label.
    words = speaker.split(/\s+/)
    next if words.size > 4
    next if speaker == speaker.upcase && speaker.length > 3   # ALL-CAPS label
    next unless words.all? { |w| w.match?(/\A[A-Z]/) }

    unresolved[speaker] << ln
  end

  unresolved.each do |speaker, lines|
    shown = lines.first(6).join(', ')
    more  = lines.size > 6 ? " (+#{lines.size - 6} more)" : ''
    is_label_word = INK_LABEL_WORDS.include?(speaker.downcase)
    if lines.size >= 5 && !is_label_word
      # Used repeatedly in one file — this is somebody's dialogue, not a label.
      issues << "❌ ERROR: '#{source_ink_path}': speaker prefix '#{speaker}:' is used #{lines.size} times but " \
                "matches no NPC id or displayName in this scenario (lines #{shown}#{more}). The engine will render " \
                "the literal text '#{speaker}: ...' inside the previous speaker's bubble. Use the NPC's exact " \
                "displayName, or 'Narrator:' / 'You:'."
    else
      # One or two uses is more often a prose label ("Command: sudo ...",
      # "Inside: network diagrams"), which renders harmlessly. Flag it quietly.
      issues << "💡 SUGGESTION: '#{source_ink_path}' line#{lines.size > 1 ? 's' : ''} #{shown}: '#{speaker}:' looks " \
                "like a speaker prefix but matches no NPC. If it is a label (e.g. 'Command: nmap ...') this is fine " \
                "and renders as written; if it is meant to be dialogue, use the NPC's exact displayName."
    end
  end

  issues
end

# Headless NPC records (social build item 0.5; data contract 00 S8): one per
# social.characters entry with an emailRecord. The id is the character's
# channels.email (an entry without one has no record); npcType "phone", phoneId
# "mail_only", no room. Mirrors BreakEscape::Game.headless_npc_records and
# public/break_escape/js/systems/scenario-npc-records.js. A record that reuses a
# room NPC's id is dropped (the room NPC wins). Returns [[record, path], ...];
# a scenario with no `social` key has none.
def headless_npc_records(json_data)
  social = json_data.is_a?(Hash) ? json_data['social'] : nil
  characters = social.is_a?(Hash) ? social['characters'] : nil
  return [] unless characters.is_a?(Hash)

  room_ids = Set.new
  if json_data['rooms'].is_a?(Hash)
    json_data['rooms'].each_value do |room|
      next unless room.is_a?(Hash) && room['npcs'].is_a?(Array)

      room['npcs'].each { |npc| room_ids << npc['id'] if npc.is_a?(Hash) }
    end
  end
  characters.filter_map do |character_id, character|
    next unless character.is_a?(Hash)

    record = character['emailRecord']
    record_id = character['channels'].is_a?(Hash) ? character['channels']['email'] : nil
    next unless record.is_a?(Hash) && record_id.is_a?(String) && !record_id.empty?
    next if room_ids.include?(record_id)

    npc = record.merge(
      'id' => record_id,
      'displayName' => record['displayName'] || character['displayName'] || record_id,
      'npcType' => 'phone',
      'phoneId' => 'mail_only',
      'itemsHeld' => record['itemsHeld'].is_a?(Array) ? record['itemsHeld'] : []
    )
    [npc, "social/characters/#{character_id}/emailRecord"]
  end
end

# { npc id => habits.screen } for every room NPC with one in the expanded copy (slice 9.1):
# authored and filled alike, for ValidateNpcNeeds.check's screen_habits: keyword.
def npc_screen_habits(expanded)
  BreakEscape::AccessIdentities.room_npcs(expanded).each_with_object({}) do |entry, out|
    npc = entry[:npc]
    habits = npc['habits']
    out[npc['id']] = habits['screen'] if habits.is_a?(Hash) && habits.key?('screen') && npc['id']
  end
end

# Every NPC record: each room's npcs, in room order, then the headless records.
# Returns [[npc, path], ...]. With no `social` key, exactly the room NPCs.
def scenario_npc_records(json_data)
  records = []
  json_data['rooms']&.each do |room_id, room|
    room['npcs']&.each_with_index { |npc, idx| records << [npc, "rooms/#{room_id}/npcs[#{idx}]"] }
  end
  records + headless_npc_records(json_data)
end

# Item types whose has_<type> ink variable the engine can set from something other than the NPC's
# itemsHeld: syncInventoryVariablesToStory (npc-conversation-state.js) sets has_keycard to "the
# player holds anything" and has_rfid_cloner to "the player holds a cloner" in person-chat, after
# the itemsHeld sync. A #give_item inside {has_keycard: ...} can therefore render for an NPC that
# holds none, so it is still checked. Every other has_<type> comes only from itemsHeld
# (person-chat-conversation.js syncItemsToInk), so its branch cannot render for an NPC without
# the item.
GIVE_ITEM_PLAYER_SYNCED_HAS_VARS = %w[keycard rfid_cloner].freeze

# For each line of an ink file, the has_<type> item types whose `{has_<type>:` branch encloses it.
# Brace-depth tracking over the file; only plain `{has_x:` or `{has_x and ...:` conditions count
# (a condition with `or` or `not has_x` does not prove the NPC holds x).
def ink_has_item_branches(ink_lines)
  stack = []
  ink_lines.map do |line|
    types_at_start = stack.flat_map(&:itself).compact
    here = types_at_start.dup
    i = 0
    text = line.sub(%r{//.*}, '')
    while i < text.length
      ch = text[i]
      if ch == '{'
        cond = text[i + 1..].to_s[/\A([^:{}|]*):/, 1].to_s.strip
        terms = cond.split(/\s+and\s+/).map(&:strip)
        types = cond.match?(/\bor\b|\bnot\b|!/) ? [] : terms.filter_map { |t| t[/\Ahas_(\w+)\z/, 1] }
        stack << types
        here.concat(types)
      elsif ch == '}'
        stack.pop
      end
      i += 1
    end
    here
  end
end

# True when a #give_item:<type> sits in a {has_<type>: ...} branch that only the NPC's itemsHeld can open.
def give_item_guarded_by_has_branch?(branch_types, item_type)
  branch_types.include?(item_type) && !GIVE_ITEM_PLAYER_SYNCED_HAS_VARS.include?(item_type)
end

# Check for #give_item tags left after the last line of text they belong to.
# A tag on its own line attaches to the next line of text below it (inkjs gives it
# with that line's Continue(), and every chat reads tags line by line), so a tag
# between two lines of text fires with the second one: that is the README's
# "above the line it belongs to" and is fine (DOCS_GAPS gap 24). The case to warn
# on is a tag after text with no text directly below it (a divert, choice, gather,
# brace or the end of the file next): it then fires on whatever line prints next,
# often in another knot, or with no line at all.
def give_item_placement_issues(ink_lines, source_ink_path)
  issues = []
  ink_lines.each_with_index do |line, i|
    stripped = line.strip
    next unless stripped.start_with?('#give_item:')

    # Find the nearest preceding non-blank line
    j = i - 1
    j -= 1 while j >= 0 && ink_lines[j].strip.empty?
    next if j < 0

    prev = ink_lines[j].strip
    # Skip if preceding line is a tag, choice, divert, code, knot/stitch header, comment, or brace
    next if prev.start_with?('#', '*', '+', '->', '~', '=', '//', '{', '}')
    next if prev.empty?

    # Skip if a line of text follows (past blank lines and further tag lines):
    # the tag belongs to that line
    k = i + 1
    k += 1 while k < ink_lines.size && (ink_lines[k].strip.empty? || ink_lines[k].strip.start_with?('#'))
    if k < ink_lines.size
      nxt = ink_lines[k].strip
      next unless nxt.start_with?('*', '+', '-', '<-', '~', '=', '//', '{', '}')
    end

    item_type = stripped.sub(/^#give_item:/, '').strip
    issues << "⚠️ WARNING: '#{source_ink_path}' line #{i + 1}: '#give_item:#{item_type}' appears after " \
              "a text/dialogue line. Move '#give_item:#{item_type}' to the line immediately BEFORE " \
              "the dialogue so the item transfer fires on the same story.Continue() call. " \
              "Wrong: dialogue → tag. Correct: tag → dialogue."
  end
  issues
end

# A1 R1 m1: a record whose id is another record's display name (ignoring case). A line prefix such as
# "ghost:" then names different records on the phone client (display names first) and the extractor
# (first match in scenario order), so the voiced speaker can differ from the one shown.
def check_speaker_id_name_clashes(json_data)
  records = scenario_npc_records(json_data).map { |npc, path| [npc, path] }.select { |npc, _| npc['id'] }
  records.flat_map do |npc, path|
    id = npc['id'].to_s.downcase
    records.filter_map do |other, other_path|
      next if other.equal?(npc) || other['displayName'].to_s.downcase != id

      "⚠️ WARNING: #{path}: NPC id '#{npc['id']}' is also the display name of '#{other['id']}' (#{other_path}); " \
        "a '#{npc['id']}:' line prefix is ambiguous between the two. Rename one of them, or avoid the prefix."
    end
  end
end

def check_ink_files(json_data, base_dir, scenario_dir = nil)
  issues = []
  ink_files_to_check = Set.new
  narrator_used_files = []  # ink files that use a #speaker:narrator / Narrator: line

  # Every id / displayName the engine's character registry will know about.
  valid_speakers = Set.new
  scenario_npc_records(json_data).each do |npc, _path|
    valid_speakers << npc['id'].to_s.downcase if npc['id']
    valid_speakers << npc['displayName'].to_s.downcase if npc['displayName']
  end
  if json_data['player']
    valid_speakers << json_data['player']['id'].to_s.downcase if json_data['player']['id']
    valid_speakers << json_data['player']['displayName'].to_s.downcase if json_data['player']['displayName']
  end

  # Collect all referenced ink files from NPCs (room NPCs and headless records)
  scenario_npc_records(json_data).each do |npc, path|
    if npc['storyPath']
      items_held = npc['itemsHeld'] || []
      items_held_types = (npc['itemsHeld'] || []).map { |item| item['type'] }.compact
      ink_files_to_check.add({ path: path, storyPath: npc['storyPath'], items_held_types: items_held_types, items_held: items_held })
    end
  end

  # Check each ink file
  ink_files_to_check.each do |entry|
    story_path = entry[:storyPath]
    npc_path = entry[:path]

    # Enforce that storyPath uses the full scenarios/ relative path format
    if story_path.start_with?('ink/')
      issues << "❌ ERROR: '#{npc_path}' uses deprecated relative path '#{story_path}'. Must use full path format: \"scenarios/SCENARIO_NAME/ink/FILENAME.ink.json\" (e.g., \"scenarios/test_npc_visibility/ink/test_dispatcher.ink.json\")"
      next
    end

    unless story_path.start_with?('scenarios/')
      issues << "❌ ERROR: '#{npc_path}' storyPath '#{story_path}' must start with 'scenarios/' (e.g., \"scenarios/SCENARIO_NAME/ink/FILENAME.ink.json\"). Absolute paths and other relative paths are not supported."
      next
    end

    # Determine the correct path to check for the ink file
    json_path = story_path.sub(/\.ink$/, '.json')

    # Resolve relative to repo root
    full_json_path = File.join(base_dir, json_path)
    full_ink_path = File.join(base_dir, story_path.sub(/\.json$/, '.ink'))

    source_ink_path = story_path.sub(/\.json$/, '.ink')
    inklecate_bin = File.join(base_dir, 'bin', 'inklecate')

    if full_ink_path && File.exist?(full_ink_path)
      # Source .ink exists — compile it to disk (creates/overwrites the JSON)
      # Each run compiles to its own temp file and renames it into place, so validator runs in
      # parallel (a merge batch, shared ink such as scenarios/ink/helper-npc.ink) never read a
      # half-written JSON file. The rename is atomic on one file system.
      tmp_json_path = "#{full_json_path}.tmp-#{Process.pid}-#{rand(1 << 32).to_s(16)}"
      begin
        output = `"#{inklecate_bin}" -o "#{tmp_json_path}" "#{full_ink_path}" 2>&1`
        status = $?.exitstatus

        if status != 0 || output.include?('ERROR') || output.include?('error')
          issues << "❌ ERROR: '#{npc_path}' references ink file '#{source_ink_path}' which fails to compile:\n#{output.strip}"
        elsif !File.exist?(tmp_json_path)
          issues << "❌ ERROR: '#{npc_path}' references ink file '#{source_ink_path}' — compiled but output file was not created"
        else
          # Verify the output is valid JSON before it replaces the old file
          begin
            JSON.parse(File.read(tmp_json_path))
            File.rename(tmp_json_path, full_json_path)
          rescue JSON::ParserError => e
            issues << "❌ ERROR: '#{npc_path}' compiled ink file produced invalid JSON: #{e.message}"
          end
        end
      rescue => e
        issues << "❌ ERROR: '#{npc_path}' references ink file '#{source_ink_path}' but compilation failed: #{e.message}"
      ensure
        File.delete(tmp_json_path) if File.exist?(tmp_json_path)
      end

      begin
        ink_lines = File.readlines(full_ink_path)
        issues.concat(give_item_placement_issues(ink_lines, source_ink_path))

        # Cross-reference: every #give_item:type used in this file must match an item
        # in the NPC's itemsHeld array. If not, the give will silently fail at runtime.
        items_held_types = entry[:items_held_types] || []
        items_held = entry[:items_held] || []
        has_branches = ink_has_item_branches(ink_lines)
        ink_lines.each_with_index do |line, i|
          stripped = line.strip
          next unless stripped.start_with?('#give_item:')

          item_spec = stripped.sub(/^#give_item:/, '').strip
          item_type, item_selector = item_spec.split(/[|:]/, 2).map(&:strip)
          # Inside {has_<type>: ...} the choice only renders when the NPC holds the type.
          next if give_item_guarded_by_has_branch?(has_branches[i], item_type)

          if item_selector.nil? || item_selector.empty?
            unless items_held_types.include?(item_type)
              issues << "❌ ERROR: '#{source_ink_path}' line #{i + 1}: '#give_item:#{item_spec}' but " \
                        "NPC '#{npc_path}' has no item with type '#{item_type}' in itemsHeld. " \
                        "Add { \"type\": \"#{item_type}\", ... } to the NPC's itemsHeld array in the scenario JSON."
            end
          else
            matches_selector = items_held.any? do |item|
              next false unless item['type'] == item_type

              # opens_lock is accepted because giveItem matches a selector against it
              # (npc-game-bridge.js) as well as against id and name.
              candidates = [item['id'], item['opens_lock'], item['key_id'], item['name']].compact.map(&:to_s)
              candidates.include?(item_selector)
            end

            unless matches_selector
              issues << "❌ ERROR: '#{source_ink_path}' line #{i + 1}: '#give_item:#{item_spec}' but " \
                        "NPC '#{npc_path}' has no itemsHeld entry matching type '#{item_type}' and selector '#{item_selector}' " \
                        "(selector checks id, opens_lock, or name)."
            end
          end
        end

        # Track Narrator usage (checked against a defined narrator voice after the loop),
        # and discourage resolving combat inside ink. Ink is for talk/messages; fights
        # should switch the NPC hostile (#hostile:<npc_id>) and let the combat system /
        # a minigame decide the outcome — not choose-your-own-adventure fight branches.
        ink_lines.each_with_index do |line, i|
          stripped = line.strip
          if stripped.start_with?('#speaker:narrator') || stripped.start_with?('Narrator:')
            narrator_used_files << source_ink_path unless narrator_used_files.include?(source_ink_path)
          end
          if stripped.start_with?('#take_damage') || stripped.match?(/^#mission_failed(:|\b)/)
            issues << "💡 SUGGESTION: '#{source_ink_path}' line #{i + 1}: '#{stripped}' resolves combat/damage " \
                      "inside ink. Ink should carry dialogue/messages only — drive fights by switching the NPC " \
                      "hostile (#hostile:<npc_id>) and let the combat system / a minigame decide the outcome. " \
                      "See scenarios/ink/security-guard.ink for the talk-then-#hostile pattern."
          end
        end

        # Speaker-prefix resolution + ink character hazards.
        issues.concat(check_ink_dialogue_hazards(ink_lines, source_ink_path, valid_speakers))
        issues.concat(realism_skin_ink_wording(ink_lines, source_ink_path)) if realism_skin_uses_services?(json_data)
      rescue => e
        # Non-fatal — file was already compiled successfully above
      end
    elsif File.exist?(full_json_path)
      # No source .ink — validate the existing compiled JSON
      begin
        json_content = File.read(full_json_path)
        JSON.parse(json_content)
      rescue JSON::ParserError => e
        issues << "❌ ERROR: '#{npc_path}' references compiled ink file '#{story_path}' but the file contains invalid JSON: #{e.message}"
      rescue => e
        issues << "❌ ERROR: '#{npc_path}' references compiled ink file '#{story_path}' but failed to read it: #{e.message}"
      end
    else
      issues << "❌ ERROR: '#{npc_path}' references ink file '#{story_path}' which does not exist (checked for both .json and .ink versions)"
    end
  end

  # If any ink narrates via a Narrator speaker, the scenario must define a narrator voice,
  # otherwise the line plays with no voice profile. See scenarios/m01_first_contact.
  if !narrator_used_files.empty?
    narrator_def = json_data['narrator']
    unless narrator_def.is_a?(Hash) && narrator_def['voice'].is_a?(Hash)
      issues << "⚠️ WARNING: Ink narrates via '#speaker:narrator' (in #{narrator_used_files.uniq.join(', ')}) " \
                "but the scenario defines no top-level 'narrator' voice. Add: " \
                "\"narrator\": { \"id\": \"narrator\", \"skipTextValidation\": true, \"voice\": { \"name\": \"...\", \"style\": \"...\", \"language\": \"en-GB\" } }. " \
                "See scenarios/m01_first_contact/scenario.json.erb."
    end
  end

  issues
end

# Check that objective task completion events are correctly wired.
#
# Three failure modes caught here, each stemming from a real bug in sis01_healthcare:
#
# 1. npc_conversation tasks whose target NPC ink file has no #complete_task:<taskId> tag.
#    The engine's only mechanism for this task type is chat-helpers.js processing that tag,
#    or the NPC being knocked out with taskOnKO set.  Without one of those two paths the
#    task counter never moves.
#
# 2. unlock_object tasks whose target object has a lockType that is not in the known set
#    of types that emit the 'item_unlocked' event.  Standard lock types (password, pin,
#    rfid, bluetooth, key, biometric) all call unlockTarget() which emits the event.  Custom minigame
#    lock types may not — the validator warns so the author can verify or fix the minigame.
#
# 3. collect_items tasks that match notes-family items (type: notes, notes2, …) where the
#    item is missing readable: true or a non-empty text field.  interactions.js only enters
#    the notes branch (which emits item_picked_up) when BOTH fields are present.  Without
#    them the item is silently registered server-side but the task counter never increments.
def check_objectives_wiring(json_data, base_dir)
  issues = []
  return issues unless json_data['objectives']&.any?

  # Build lookup maps from room contents
  npc_info_by_id = {}       # npc_id => { story_path:, task_on_ko:, room_id: }
  all_objects_by_id = {}    # object_id => object hash
  objects_by_group = {}     # collection_group => [object, …]

  collect_item = lambda do |item|
    all_objects_by_id[item['id']] = item if item['id']
    if item['collection_group']
      objects_by_group[item['collection_group']] ||= []
      objects_by_group[item['collection_group']] << item
    end
    item['contents']&.each  { |c| collect_item.call(c) }
    item['itemsHeld']&.each { |c| collect_item.call(c) }
  end

  json_data['rooms']&.each do |room_id, room|
    room['npcs']&.each do |npc|
      next unless npc['id']
      npc_info_by_id[npc['id']] = {
        story_path:  npc['storyPath'],
        task_on_ko:  npc['taskOnKO'],
        room_id:     room_id
      }
    end
    room['objects']&.each { |obj| collect_item.call(obj) }
  end
  json_data['startItemsInInventory']&.each { |item| collect_item.call(item) }

  # All items by type (for targetItems array matching)
  all_objects_list = all_objects_by_id.values

  # Lock types guaranteed to emit 'item_unlocked' via unlockTarget() or their own emit.
  # Standard types call unlockTarget() in unlock-system.js.
  # Extended types have explicit window.eventDispatcher.emit('item_unlocked', …) calls.
  # biometric: the fingerprint reader's accepted path calls unlockTarget() (unlock-system.js, case 'biometric').
  standard_unlock_types  = %w[password pin rfid bluetooth key biometric].freeze
  # ransomware_display is intentionally absent: the object stays locked (ransom is never
  # paid), so it completes tasks via completesTask + task_completed_by_npc, not item_unlocked.
  # Use a manual task type and set completesTask on the scenario object instead.
  extended_unlock_types  = %w[
    siem_dashboard network-segmentation-map
    backup_recovery dual_auth infusion_pump ehr-terminal command_board
    esd-pushbutton
  ].freeze
  all_unlock_emitting_types = (standard_unlock_types + extended_unlock_types).freeze

  json_data['objectives']&.each_with_index do |aim, oi|
    aim['tasks']&.each_with_index do |task, ti|
      task_path = "objectives[#{oi}]/tasks[#{ti}] (#{task['taskId']})"
      task_id   = task['taskId']

      case task['type']

      # ─────────────────────────────────────────────────────────────
      # CHECK 1  npc_conversation — #complete_task tag in ink
      # ─────────────────────────────────────────────────────────────
      when 'npc_conversation'
        target_npc = task['targetNPC']
        next unless target_npc

        npc = npc_info_by_id[target_npc]
        unless npc
          # NPC ID mismatch already caught by targetNPC cross-ref check; skip here.
          next
        end

        # taskOnKO is a valid alternative completion path — skip ink check.
        if npc[:task_on_ko] == task_id
          next
        end

        story_path = npc[:story_path]
        unless story_path
          issues << "❌ ERROR: #{task_path} is type 'npc_conversation' targeting NPC '#{target_npc}', " \
                    "but that NPC has no 'storyPath'. Without an Ink story the '#complete_task:#{task_id}' " \
                    "tag can never fire. Add a storyPath to the NPC or use taskOnKO to complete the task " \
                    "when the NPC is knocked out."
          next
        end

        # Resolve compiled .json and source .ink paths (storyPath may end in .ink or .json)
        json_relative = story_path.sub(/\.ink$/, '.json')
        ink_relative  = story_path.sub(/\.json$/, '.ink')
        full_json = File.join(base_dir, json_relative)
        full_ink  = File.join(base_dir, ink_relative)

        content_to_search = nil
        searched_file     = nil

        if File.exist?(full_json)
          content_to_search = File.read(full_json)
          searched_file = json_relative
        elsif File.exist?(full_ink)
          content_to_search = File.read(full_ink)
          searched_file = ink_relative
        else
          # Ink file missing — already caught by check_ink_files; skip.
          next
        end

        tag = "complete_task:#{task_id}"
        unless content_to_search.include?(tag)
          issues << "❌ ERROR: #{task_path} is type 'npc_conversation' targeting NPC '#{target_npc}', " \
                    "but '##{tag}' was not found in '#{searched_file}'. " \
                    "The engine completes npc_conversation tasks only when chat-helpers.js processes a " \
                    "'#complete_task:#{task_id}' ink tag (or when the NPC is knocked out and taskOnKO matches). " \
                    "Add '##{tag}' to the NPC's Ink story — typically at the top of the '=== start ===' knot " \
                    "so it fires on every conversation, or inside the specific knot where the task is resolved."
        end

      # ─────────────────────────────────────────────────────────────
      # CHECK 2  unlock_object — lockType must emit item_unlocked
      # ─────────────────────────────────────────────────────────────
      when 'unlock_object'
        target_id = task['targetObject']
        next unless target_id

        obj = all_objects_by_id[target_id]
        next unless obj  # Missing object already flagged by targetObject cross-ref check.

        lock_type = obj['lockType']
        next unless lock_type  # Unlocked objects can only be targeted via other mechanisms.

        next if all_unlock_emitting_types.include?(lock_type)
        # A 'flag' lock only has its `locked` flag cleared by the flag reward; the player's next click
        # on a container goes through handleUnlock -> unlockTarget, which emits item_unlocked for any
        # object with `contents` (m07 crisis_control_system, m01 entropy_encrypted_archive).
        next if lock_type == 'flag' && obj['contents'].is_a?(Array) && !obj['contents'].empty?
        # A sign-in PC (access model 5.3): the objectives manager meets the task on pc_signed_in,
        # and the server's complete_task! reads signedInPcs.
        next if lock_type == 'login'

        issues << "⚠️ WARNING: #{task_path} is type 'unlock_object' targeting '#{target_id}' " \
                  "(lockType: '#{lock_type}'). This lockType is not in the known set of types that emit " \
                  "the 'item_unlocked' event (which is how unlock_object tasks complete). " \
                  "Standard types (#{standard_unlock_types.join(', ')}) all call unlockTarget() in " \
                  "unlock-system.js which emits the event. " \
                  "Verify that the '#{lock_type}' minigame calls " \
                  "window.eventDispatcher.emit('item_unlocked', { itemId: …, itemType: …, itemName: … }) " \
                  "on completion, or add it. Known safe extended types: #{extended_unlock_types.join(', ')}."

      # ─────────────────────────────────────────────────────────────
      # CHECK 3  collect_items — notes items need readable + text
      # ─────────────────────────────────────────────────────────────
      when 'collect_items'
        # objectives-manager.js has no default for targetCount (only submit_flags derives one
        # from targetFlags), so a collect task without it can't track or complete progress.
        unless task.key?('targetCount')
          issues << "⚠️ WARNING: #{task_path} (collect_items) has no 'targetCount'. The engine does not " \
                    "default it for collect_items tasks, so progress and completion are unreliable. " \
                    "Set 'targetCount' to the number of items to collect."
        end

        # Collect candidate items matched by this task's targeting strategy.
        candidates = []

        if task['targetGroup']
          candidates.concat(objects_by_group[task['targetGroup']] || [])
        end

        if task['targetItemIds']
          task['targetItemIds'].each do |item_id|
            obj = all_objects_by_id[item_id]
            candidates << obj if obj
          end
        end

        if task['targetItems']
          task['targetItems'].each do |type_name|
            matched = all_objects_list.select { |o| o['type'] == type_name }
            candidates.concat(matched)
          end
        end

        candidates.uniq.each do |item|
          next unless /^notes\d*$/.match?(item['type'].to_s)

          item_label = item['id'] || item['name'] || item['type']

          unless item['readable']
            issues << "❌ ERROR: #{task_path} (collect_items) targets item '#{item_label}' " \
                      "(type: #{item['type']}), but the item is missing 'readable: true'. " \
                      "interactions.js only enters the notes branch — which emits 'item_picked_up' " \
                      "and drives task progress — when both 'readable: true' and a non-empty 'text' " \
                      "field are present. Without 'readable: true' the item is silently collected " \
                      "server-side but the task counter never increments. Add 'readable: true' to the item."
          end

          if item['text'].to_s.strip.empty?
            issues << "❌ ERROR: #{task_path} (collect_items) targets item '#{item_label}' " \
                      "(type: #{item['type']}), but the item has no 'text' field (or it is empty). " \
                      "interactions.js only enters the notes branch — which emits 'item_picked_up' " \
                      "and drives task progress — when both 'readable: true' and a non-empty 'text' " \
                      "field are present. Without 'text' the notes minigame never opens and the task " \
                      "counter never increments. Add readable text content to the item."
          end
        end

      end
    end
  end

  # ─────────────────────────────────────────────────────────────
  # CHECK 4  NPC knockout resilience — required tasks must survive a KO
  #
  # KO is permanent in this engine and the player can attack any NPC. If a
  # required task's ONLY completion path is talking to a person NPC (a
  # '#complete_task' tag in their ink) with no taskOnKO / eventMapping /
  # world-event fallback, knocking that NPC out strands the task and can
  # soft-lock the mission. Note that an NPC's taskOnKO can name only ONE
  # task, so an NPC whose ink completes two required tasks needs an
  # eventMapping fallback (keyed to its KO global) for the second one.
  # Reference: m01_first_contact gives every conversation-gated task a
  # taskOnKO (e.g. dr_sarah_kim→meet_dr_kim, derek_lawson→confront_derek).
  # Skipped when the scenario sets "disableAttacks": true. A task one of whose completing
  # NPCs has "koImmune": true is KO-safe.
  # ─────────────────────────────────────────────────────────────
  begin
    # Tasks completed via any eventMapping (phones, handlers, objects, rooms) — KO-safe.
    event_completed_tasks = Set.new
    # Tasks named by any NPC's taskOnKO — KO-safe.
    taskonko_tasks = Set.new

    scan_event_mappings = lambda do |mappings|
      Array(mappings).each do |m|
        event_completed_tasks << m['completeTask'] if m.is_a?(Hash) && m['completeTask']
      end
    end

    # NPCs with koImmune: true can't be knocked out, so their conversations are KO-safe.
    ko_immune_ids = Set.new
    json_data['rooms']&.each do |_room_id, room|
      room['npcs']&.each do |npc|
        scan_event_mappings.call(npc['eventMappings'])
        taskonko_tasks << npc['taskOnKO'] if npc['taskOnKO']
        ko_immune_ids << npc['id'] if npc['koImmune'] == true
      end
      room['objects']&.each { |obj| scan_event_mappings.call(obj['eventMappings']) }
    end
    json_data['startItemsInInventory']&.each { |item| scan_event_mappings.call(item['eventMappings']) }

    # Phone NPCs whose eventMapping fires on 'npc_ko:<id>' open a phone conversation after that
    # NPC is knocked out. A '#complete_task:' tag in such a phone NPC's ink is a KO fallback for
    # the knocked-out NPC (m06 Satoshi, m05 Patricia), so remember the ink per KO'd NPC id.
    ko_phone_ink = Hash.new { |h, k| h[k] = [] }
    scenario_npc_records(json_data).each do |npc, _path|
      next unless npc['npcType'] == 'phone' && npc['storyPath']
      ko_ids = Array(npc['eventMappings']).map { |m| m.is_a?(Hash) && m['eventPattern'].to_s[/\Anpc_ko:(.+)\z/, 1] }.compact
      next if ko_ids.empty?
      ink_text = nil
      [npc['storyPath'].sub(/\.json$/, '.ink'), npc['storyPath'].sub(/\.ink$/, '.json')].each do |rel|
        full = File.join(base_dir, rel)
        if File.exist?(full)
          ink_text = File.read(full)
          break
        end
      end
      ko_ids.each { |kid| ko_phone_ink[kid] << ink_text } if ink_text
    end

    # Required (non-optional) tasks and their types.
    required_task_types = {}
    json_data['objectives']&.each do |aim|
      aim['tasks']&.each do |t|
        next if t['optional']
        required_task_types[t['taskId']] = t['type']
      end
    end

    # Critical-path tasks: those whose completion is genuinely required to finish the
    # mission. A KO stranding a *side-aim* (lore / optional-arc) task is acceptable by
    # design — only a KO that blocks mission completion is a real problem. We derive the
    # critical set from the missionConclusion aim and its unlockCondition ancestry.
    aims_by_id = {}
    json_data['objectives']&.each { |a| aims_by_id[a['aimId']] = a }
    conclusion_aim = json_data['objectives']&.find { |a| a['missionConclusion'] }

    critical_aim_ids = Set.new
    if conclusion_aim
      queue = [conclusion_aim['aimId']]
      until queue.empty?
        aid = queue.shift
        next if critical_aim_ids.include?(aid)
        critical_aim_ids << aid
        aim = aims_by_id[aid]
        next unless aim
        dep = aim.dig('unlockCondition', 'aimCompleted')
        Array(dep).each { |d| queue << d } if dep
      end
    end

    # Task ids required for mission completion. For the conclusion aim, only the
    # tasks in concludeRequires are strictly required; for every other aim, all
    # non-optional tasks must complete for the aim to count as completed.
    critical_task_ids = Set.new
    critical_aim_ids.each do |aid|
      aim = aims_by_id[aid]
      next unless aim
      gate = aim.dig('concludeRequires', 'tasksCompleted')
      if aim['missionConclusion'] && gate.is_a?(Array) && gate.any?
        # The conclusion aim is gated only on its declared technical work; its
        # remaining tasks cost score but never block the ending.
        gate.each { |tid| critical_task_ids << tid }
      else
        aim['tasks']&.each { |t| critical_task_ids << t['taskId'] unless t['optional'] }
      end
    end
    # If we cannot identify a conclusion aim, we cannot prove any task is non-critical —
    # treat every required task as critical so nothing mission-blocking slips through.
    critical_path_known = !critical_aim_ids.empty?

    # These task types complete via movement / unlock / flag / pickup events,
    # not through conversation, so they are not KO-vulnerable.
    world_event_types = %w[enter_room unlock_object submit_flags collect_items].freeze

    # For each required task, find the person NPC(s) whose ink completes it.
    person_ink_completions = Hash.new { |h, k| h[k] = [] } # task_id => [{ npc_id, taskonko_match }]

    json_data['rooms']&.each do |_room_id, room|
      room['npcs']&.each do |npc|
        next if npc['npcType'] == 'phone'                     # phones can't be KO'd
        next if npc.dig('behavior', 'initiallyHidden')        # hidden cutscene NPCs aren't attackable
        story = npc['storyPath']
        next unless story

        content = nil
        [story.sub(/\.json$/, '.ink'), story.sub(/\.ink$/, '.json')].each do |rel|
          full = File.join(base_dir, rel)
          if File.exist?(full)
            content = File.read(full)
            break
          end
        end
        next unless content

        required_task_types.each_key do |tid|
          next if content.include?("complete_task:#{tid}") == false
          person_ink_completions[tid] << { npc_id: npc['id'], taskonko_match: (npc['taskOnKO'] == tid) }
        end
      end
    end

    person_ink_completions.each do |tid, sources|
      type = required_task_types[tid]
      next if world_event_types.include?(type)
      next if event_completed_tasks.include?(tid)          # eventMapping fallback exists
      next if taskonko_tasks.include?(tid)                 # some NPC's taskOnKO covers it
      next if sources.any? { |s| s[:taskonko_match] }      # a completing NPC has taskOnKO for it
      next if sources.any? { |s| ko_immune_ids.include?(s[:npc_id]) } # a completing NPC can't be KO'd (koImmune)
      # every completing NPC has a KO-triggered phone conversation whose ink also completes the task
      next if sources.all? { |s| ko_phone_ink[s[:npc_id]].any? { |c| c.include?("complete_task:#{tid}") } }

      npc_list = sources.map { |s| s[:npc_id] }.compact.uniq.join(', ')
      whom = sources.size == 1 ? 'that NPC' : 'those NPCs'
      fix = "Add 'taskOnKO': '#{tid}' to the NPC; if the NPC's taskOnKO is already used for another task " \
            "(it can name only one), add an eventMapping with 'completeTask': '#{tid}' on a phone/handler NPC " \
            "keyed to the NPC's KO global instead. Reference: m01_first_contact wires a taskOnKO for " \
            "conversation-gated tasks."

      if !critical_path_known || critical_task_ids.include?(tid)
        issues << "⚠️ WARNING: Mission-critical task '#{tid}' completes only through conversation with person " \
                  "NPC(s) [#{npc_list}] (a '#complete_task:#{tid}' ink tag) with no knockout-safe fallback. " \
                  "KO is permanent — knocking out #{whom} strands a task required for mission completion, " \
                  "soft-locking the mission. #{fix}"
      else
        issues << "💡 SUGGESTION: Side-objective task '#{tid}' completes only through conversation with person " \
                  "NPC(s) [#{npc_list}] (a '#complete_task:#{tid}' ink tag) with no knockout-safe fallback, so " \
                  "knocking out #{whom} strands it. This is acceptable if intended — the task is not on the " \
                  "critical path, so it does not block mission completion (a KO may legitimately close off a " \
                  "side/lore objective). If you want the side aim to survive a KO anyway: #{fix}"
      end
    end
  rescue => e
    # Non-fatal — KO-resilience analysis is best-effort.
  end unless json_data['disableAttacks'] == true # no attacks, so no NPC can be knocked out

  # ─────────────────────────────────────────────────────────────
  # CHECK 5  onceOnly handlers sharing (npc/object, eventPattern)
  #
  # npc-manager.js dedups onceOnly per handler (its index in eventMappings), not
  # per (holder, eventPattern) pair — so every onceOnly handler on the same pair
  # fires independently the first time ITS OWN condition passes. If two or more
  # such handlers' conditions can be true at the same moment (including two with
  # identical conditions), they will all fire when that happens. That may be
  # intended (e.g. one silently completes a task while another sends a message)
  # or it may be an authoring mistake expecting only one to win — flag it so the
  # author decides, rather than finding out three playtests later.
  # ─────────────────────────────────────────────────────────────
  begin
    parse_literal = lambda do |token|
      t = token.strip
      next true if t == 'true'
      next false if t == 'false'
      next nil if t == 'null'
      next nil if t == 'undefined'
      n = Float(t) rescue nil
      next n if n && t != ''
      m = t.match(/^['"](.*)['"]$/)
      next m[1] if m
      t
    end

    resolve_lhs = lambda do |token, env|
      t = token.strip
      next env[:value] if t == 'value'
      next env[:name] if t == 'name'
      m = t.match(/^globalVars\.(\w+)$/)
      next env[:globalVars][m[1]] if m
      nil
    end

    apply_op = lambda do |lhs, op, rhs|
      case op
      when '===' then lhs == rhs
      when '!==' then lhs != rhs
      when '>=' then lhs && rhs && lhs >= rhs
      when '<=' then lhs && rhs && lhs <= rhs
      when '>' then lhs && rhs && lhs > rhs
      when '<' then lhs && rhs && lhs < rhs
      else false
      end
    end

    evaluate_single = lambda do |expr, env|
      e = expr.strip
      next !evaluate_single.call(e[1..-1].strip, env) if e.start_with?('!')
      cmp = e.match(/^(value|name|globalVars\.\w+)\s*(===|!==|>=|<=|>|<)\s*(.+)$/)
      if cmp
        next apply_op.call(resolve_lhs.call(cmp[1], env), cmp[2], parse_literal.call(cmp[3]))
      end
      next !!resolve_lhs.call(e, env) if e =~ /^(value|name|globalVars\.\w+)$/
      true # unsupported term (e.g. .includes(), data.*) — assume it could pass
    end

    eval_condition = lambda do |cond, env|
      next true if cond.nil?
      s = cond.strip
      next s.split('&&').all? { |part| evaluate_single.call(part, env) } if s.include?('&&')
      evaluate_single.call(s, env)
    end

    extract_vars = lambda do |cond|
      return [] unless cond
      cond.scan(/\b(?:value|globalVars\.\w+)\b/).uniq
    end

    # Globals the scenario declares as mutually exclusive: at most one member of
    # each set is ever true at once. The brute force below assigns every boolean
    # independently, so without this it reaches states the game cannot be in --
    # advised_board_pay && advised_board_refuse both true -- and reports handlers
    # as overlapping when the scenario keeps them apart by construction. A
    # warning authors learn to ignore is worse than no warning, so let the
    # scenario say so and skip those assignments.
    exclusive_sets = begin
      declared = json_data['mutuallyExclusiveGlobals']
      declared.is_a?(Array) ? declared.select { |s| s.is_a?(Array) && s.size > 1 } : []
    end

    # `data.<field> === 'literal'` terms of a condition, as { field => literal }.
    data_equalities = lambda do |cond|
      next {} unless cond
      cond.split('&&').each_with_object({}) do |part, h|
        m = part.strip.match(/\Adata\.(\w+)\s*===\s*(['"])(.*)\2\z/m)
        h[m[1]] = m[3] if m
      end
    end
    data_disjoint = lambda do |c1, c2|
      e1 = data_equalities.call(c1)
      e2 = data_equalities.call(c2)
      e1.any? { |k, v| e2.key?(k) && e2[k] != v }
    end

    # Returns the set of indices (within `handlers`) that would newly become live
    # under the per-handler fix but are dominated (blocked) by an earlier handler
    # under some reachable variable assignment — i.e. two+ handlers can pass at once.
    find_overlapping = lambda do |handlers|
      vars = handlers.flat_map { |h| extract_vars.call(h[:condition]) }.uniq
      n = vars.length
      overlapping = Set.new
      total = [2**n, 4096].min
      # Positions within `vars` that a declared exclusive set covers. Sets that
      # touch fewer than two of this group's variables constrain nothing here.
      exclusive_positions = exclusive_sets.map { |set|
        set.map { |g| vars.index("globalVars.#{g}") }.compact
      }.select { |positions| positions.size > 1 }
      (0...total).each do |mask|
        next if exclusive_positions.any? { |positions|
          positions.count { |i| mask[i] == 1 } > 1
        }
        env = { globalVars: {}, value: nil, name: nil }
        vars.each_with_index do |v, i|
          val = mask[i] == 1
          if v == 'value'
            env[:value] = val
          else
            m = v.match(/^globalVars\.(\w+)$/)
            env[:globalVars][m[1]] = val
          end
        end
        passing = handlers.select { |h| eval_condition.call(h[:condition], env) }
        # Handlers that test the same event field against different literals
        # (data.itemId === 'a' vs 'b') cannot both pass for one event.
        passing.combination(2).each do |x, y|
          next if data_disjoint.call(x[:condition], y[:condition])
          overlapping << x[:idx] << y[:idx]
        end
      end
      overlapping
    end

    check_mapping_group = lambda do |holder_label, mappings|
      return unless mappings.is_a?(Array)
      by_pattern = Hash.new { |h, k| h[k] = [] }
      mappings.each_with_index do |m, idx|
        next unless m.is_a?(Hash)
        pattern = m['eventPattern']
        next unless pattern
        by_pattern[pattern] << { idx: idx, once: !!(m['onceOnly'] || m['once']), condition: m['condition'] }
      end
      by_pattern.each do |pattern, list|
        next if list.size < 2
        once_list = list.select { |h| h[:once] }
        next if once_list.empty?
        overlapping = find_overlapping.call(list)
        overlapping_once = once_list.select { |h| overlapping.include?(h[:idx]) }
        next if overlapping_once.empty?
        idxs = overlapping_once.map { |h| h[:idx] }.sort.join(', ')
        issues << "⚠️ WARNING: #{holder_label} has #{list.size} eventMappings for '#{pattern}' " \
                  "(indices #{list.map { |h| h[:idx] }.join(', ')}), of which onceOnly handler(s) at " \
                  "index #{idxs} can pass at the same time as another handler on the same pair " \
                  "(including two with identical conditions). Each onceOnly handler now fires " \
                  "independently the first time its own condition is met — if these are meant to be " \
                  "mutually exclusive alternatives, make their conditions disjoint; if they are kept " \
                  "apart by globals that can never be true together, declare those in the scenario's " \
                  "top-level \"mutuallyExclusiveGlobals\"; if firing together is intended, ignore this warning."
      end
    end

    json_data['rooms']&.each do |room_id, room|
      room['npcs']&.each do |npc|
        check_mapping_group.call("NPC '#{npc['id']}' (room '#{room_id}')", npc['eventMappings'])
      end
      room['objects']&.each do |obj|
        check_mapping_group.call("Object '#{obj['id']}' (room '#{room_id}')", obj['eventMappings'])
      end
    end
    json_data['startItemsInInventory']&.each do |item|
      check_mapping_group.call("Inventory item '#{item['id']}'", item['eventMappings'])
    end
  rescue => e
    # Non-fatal — this is an authoring-quality warning, not a structural check.
  end

  # ─────────────────────────────────────────────────────────────
  # CHECK 6  a required task whose only completion route is one branch of a choice
  #
  # Three separate mission-blockers have had exactly this shape: a task that can
  # only be completed by a single '#complete_task:' tag, sitting inside one
  # branch of an ink choice. A player who picks any other branch can never
  # complete it, and if an aim's concludeRequires names it, the mission cannot
  # conclude — which does not show up until someone plays the other branch.
  #
  # Only tasks with no other route are flagged. A task with a second tag, a
  # scenario-side completeTask, a completesTask object or a taskOnKO has a way
  # out, and server-validated types (collect_items, unlock_room, …) complete
  # from gameplay rather than a tag.
  # ─────────────────────────────────────────────────────────────
  begin
    # Task types the server completes from gameplay state, not from an ink tag.
    self_completing_types = %w[collect_items unlock_room unlock_object enter_room submit_flags].freeze

    # Every non-ink route that can complete a task.
    other_routes = Hash.new { |h, k| h[k] = [] }
    record_mappings = lambda do |label, mappings|
      next unless mappings.is_a?(Array)
      mappings.each do |m|
        next unless m.is_a?(Hash)
        t = m['completeTask']
        other_routes[t] << label if t.is_a?(String)
      end
    end
    walk_object = lambda do |obj, room_id|
      next unless obj.is_a?(Hash)
      label = "object '#{obj['id']}' (room '#{room_id}')"
      record_mappings.call(label, obj['eventMappings'])
      ct = obj['completesTask']
      other_routes[ct] << "#{label} completesTask" if ct.is_a?(String)
      obj['contents']&.each  { |c| walk_object.call(c, room_id) }
      obj['itemsHeld']&.each { |c| walk_object.call(c, room_id) }
    end

    ink_dirs = Set.new
    json_data['rooms']&.each do |room_id, room|
      room['npcs']&.each do |npc|
        label = "NPC '#{npc['id']}' (room '#{room_id}')"
        record_mappings.call(label, npc['eventMappings'])
        ko = npc['taskOnKO']
        other_routes[ko] << "#{label} taskOnKO" if ko.is_a?(String)
        sp = npc['storyPath']
        ink_dirs << File.dirname(File.join(base_dir, sp)) if sp.is_a?(String)
      end
      room['objects']&.each { |obj| walk_object.call(obj, room_id) }
    end
    json_data['startItemsInInventory']&.each { |i| walk_object.call(i, 'inventory') }
    json_data['timers']&.each_with_index do |t, i|
      next unless t.is_a?(Hash)
      ct = t['completeTask']
      other_routes[ct] << "timer[#{i}]" if ct.is_a?(String)
    end

    # Ink '#complete_task:' tags, with whether each sits inside a choice branch.
    # A tag is "under a choice" when the nearest enclosing line at lower
    # indentation is a choice marker ('*' one-time or '+' sticky).
    ink_tags = Hash.new { |h, k| h[k] = [] }
    ink_dirs.each do |dir|
      Dir.glob(File.join(dir, '*.ink')).sort.each do |ink_path|
        lines = File.read(ink_path).lines
        rel = ink_path.sub("#{base_dir}/", '')
        lines.each_with_index do |line, idx|
          m = line.match(/#\s*complete_task:([A-Za-z0-9_]+)/)
          next unless m
          indent = line[/\A[ \t]*/].length
          under_choice = false
          (idx - 1).downto(0) do |j|
            prev = lines[j]
            next if prev.strip.empty?
            prev_indent = prev[/\A[ \t]*/].length
            next if prev_indent >= indent
            under_choice = !!(prev.strip =~ /\A[*+]/)
            break
          end
          ink_tags[m[1]] << { file: rel, line: idx + 1, under_choice: under_choice }
        end
      end
    end

    # Which tasks does an aim actually gate its conclusion on?
    required = Set.new
    json_data['objectives']&.each do |aim|
      req = aim.dig('concludeRequires', 'tasksCompleted')
      req.each { |t| required << t } if req.is_a?(Array)
    end

    json_data['objectives']&.each_with_index do |aim, oi|
      aim['tasks']&.each_with_index do |task, ti|
        task_id = task['taskId']
        next unless task_id
        next if self_completing_types.include?(task['type'])
        next unless required.include?(task_id)
        next if other_routes[task_id].any?

        tags = ink_tags[task_id]
        next unless tags.length == 1
        tag = tags.first
        next unless tag[:under_choice]

        issues << "⚠️ WARNING: objectives[#{oi}]/tasks[#{ti}] ('#{task_id}') is named in an aim's " \
                  "concludeRequires, but its only completion route is a single '#complete_task:#{task_id}' " \
                  "tag at #{tag[:file]}:#{tag[:line]}, which sits inside one branch of a choice. A player " \
                  "who picks a different branch can never complete it, and the aim can then never conclude. " \
                  "Give it a second route — the tag at the top of the knot so every branch fires it, a " \
                  "scenario-side completeTask, or taskOnKO on the NPC."
      end
    end
  rescue => e
    # Non-fatal — authoring-quality warning, must never break validation.
  end

  issues
end

# Check for common issues and structural problems
# ─────────────────────────────────────────────────────────────
# Lock credentials: 'opens_lock' names the LOCK an item opens.
#
# It is a many-to-one reference -- two spare keys to the same door share one
# 'opens_lock' and keep distinct 'id's. 'id' names the object; 'opens_lock'
# names what it opens; 'type' names its class.
#
# The field used to be called 'key_id', and because the name said nothing about
# locks, 49 of its 82 uses had drifted into being plain identity strings on
# items that open nothing (field guides, notes, lanyards). Those are 'id' now.
#
# The engine reads it through window.lockRef() (utils/helpers.js), which falls
# back to key_id ONLY so missions started before the rename can finish -- a game
# snapshots its scenario_data at creation. A scenario file must not use key_id.
# ─────────────────────────────────────────────────────────────
def check_lock_credentials(json_data)
  issues = []

  # Locks that are opened by carrying an item. Every other lockType ('password',
  # 'pin', 'biometric', 'flag', ...) puts a secret in 'requires', not an item.
  # An rfid lock's 'requires' may be a single id or (unlock-system.js) an array
  # of accepted ids -- flatten either into the set.
  credential_requires = { 'key' => Set.new, 'rfid' => Set.new }
  walk_locks = lambda do |node|
    case node
    when Array then node.each { |n| walk_locks.call(n) }
    when Hash
      lt = node['lockType']
      if credential_requires.key?(lt) && node['requires']
        Array(node['requires']).each { |r| credential_requires[lt] << r }
      end
      node.each_value { |v| walk_locks.call(v) }
    end
  end
  walk_locks.call(json_data)

  # [name, credential, lockType] for items whose type is a physical key or an
  # keycard credential. A physical key is matched by 'opens_lock'
  # (falling back to 'key_id' -- ItemIdentity.lock_ref). An RFID/keycard is
  # matched by 'card_id' first, falling back to 'opens_lock'/'key_id'
  # (unlock-system.js getCardId) -- so card_id is the credential that
  # actually satisfies the door when both are present.
  key_items = []
  # Only 'keycard' counts as a card: the engine (Game#held_keycard_ref_ids, held_keycard_ids) takes
  # type == 'keycard' alone, so a 'fob' or 'rfid' item never opens a requires lock.
  credential_item_types = { 'key' => 'key', 'keycard' => 'rfid' }
  walk_items = lambda do |node|
    case node
    when Array then node.each { |n| walk_items.call(n) }
    when Hash
      if node.key?('key_id')
        issues << "❌ ERROR: item '#{node['name'] || node['key_id']}' uses 'key_id', which was renamed to " \
                  "'opens_lock' (the lock this item opens). If the value does not name a lock, it is an " \
                  "identity and belongs in 'id' instead. key_id survives in the engine only so missions " \
                  "started before the rename can finish -- it must not appear in a scenario."
      end
      lt = credential_item_types[node['type']]
      if lt
        credential = lt == 'rfid' ? (node['card_id'] || node['opens_lock']) : node['opens_lock']
        key_items << [node['name'] || credential, credential, lt] if credential
      end
      node.each_value { |v| walk_items.call(v) }
    end
  end
  walk_items.call(json_data)

  # A card an NPC carries opens every rfid lock whose access list admits that NPC (access
  # model 4.1), so a keycard with that card_id is not a credential that opens nothing.
  ai = BreakEscape::AccessIdentities
  rfid_locks = ai.locks(json_data).reject { |l| l[:kind] == 'login' }
  identity_opens = ai.cards(json_data).select do |card_id, info|
    rfid_locks.any? { |l| ai.card_opens_by_access?(l[:lock], card_id, info[:holders]) }
  end.keys.to_set

  # A credential item that opens nothing.
  key_items.each do |name, credential, lock_kind|
    next if credential_requires[lock_kind].include?(credential)
    next if lock_kind == 'rfid' && identity_opens.include?(credential.to_s)
    issues << "⚠️ WARNING: key '#{name}' has credential '#{credential}', but no #{lock_kind} lock 'requires' it. " \
              "Either the lock is missing, the value is a typo, or this is really an identity and belongs in " \
              "'id'. A deliberate decoy key is the one legitimate case -- say so in a comment."
  end

  # A key/RFID lock with no matching credential item. This is a soft-lock
  # unless the door is meant to be opened another way (e.g. lockpicked). A card a room
  # NPC carries (creds.card or rfidCard) declares its card_id too when an rfid_cloner
  # exists anywhere (an object, a start item or an NPC's item). Without a cloner, each
  # lock that requires the card is decided on its own, and a lock that also accepts a card
  # the player can hold as an item is passed. A locked room is open to the player only
  # through a gate into that room that he can follow someone through. A gate opens for a
  # room NPC in its openFor who has a sprite (npcType person or both, as core/rooms.js
  # makes them), carrying the card or not, as door-gates.js opens for them; a phone NPC or
  # an id with no NPC behind it never comes near. A gate on a door entry that matches no doorway
  # is no gate (doors.js never reads it; check_access_model warns). A gate is a way in when it opens for someone
  # and sets playerMayPassIf, or when an NPC it opens for holds doors, that is, is not in the
  # gate's noHold once habits are expanded (plan 5.4). A gate that opens only for careful
  # guards cannot be tailgated. A lock on an object (a safe, a cabinet) or on a start item is
  # never opened by tailgating, which does not give the player the card. A lock counts only
  # while locked is true. This is a warning heuristic, not a proof of solvability: whether a
  # cloner is itself reachable, and whether a guard ever walks the gate, are not checked.
  declared = { 'key' => Set.new, 'rfid' => Set.new }
  key_items.each { |_name, credential, lt| declared[lt] << credential }
  # Cards the player can hold as an item: a lock that accepts one of them is open to him
  item_cards = declared['rfid'].map(&:to_s).to_set
  accepts_item = ->(lock) { Array(lock['requires']).any? { |r| item_cards.include?(r.to_s) } }
  has_cloner = false
  find_cloner = lambda do |node|
    case node
    when Array then node.each { |n| find_cloner.call(n) }
    when Hash
      has_cloner ||= node['type'] == 'rfid_cloner'
      node.each_value { |v| find_cloner.call(v) } unless has_cloner
    end
  end
  find_cloner.call(json_data)
  rooms = json_data['rooms'].is_a?(Hash) ? json_data['rooms'] : {}
  # A lock only while locked: interactions.js opens an object's lock on locked === true and
  # doors.js locks a door on a truthy room 'locked'
  requires_card = lambda do |lock, card_id|
    lock.is_a?(Hash) && lock['locked'] == true && lock['lockType'] == 'rfid' &&
      Array(lock['requires']).map(&:to_s).include?(card_id)
  end
  rooms_requiring = lambda do |card_id|
    rooms.select { |_id, r| requires_card.call(r, card_id) && !accepts_item.call(r) }.keys
  end
  # Object locks (in rooms, in containers, in NPCs' items) on the card: no gate opens them
  objects_requiring = lambda do |card_id|
    ai.room_objects(json_data).map { |e| e[:path] if requires_card.call(e[:object], card_id) && !accepts_item.call(e[:object]) }
      .compact
  end
  # Every other lock on the card, outside the rooms and their objects (a locked container in
  # startItemsInInventory): no gate leads to it either. A door entry is skipped: play never
  # reads a lock on it (the bootstrap scenario has no doors; check_access_model warns).
  counted = {}.compare_by_identity
  rooms.each_value do |r|
    next unless r.is_a?(Hash)

    counted[r] = true
    Array(r['doors']).each { |d| counted[d] = true if d.is_a?(Hash) }
  end
  ai.room_objects(json_data).each { |e| counted[e[:object]] = true }
  other_requiring = lambda do |card_id|
    out = []
    walk = lambda do |node, path|
      case node
      when Array then node.each_with_index { |n, i| walk.call(n, "#{path}[#{i}]") }
      when Hash
        out << path if !counted.key?(node) && requires_card.call(node, card_id) && !accepts_item.call(node)
        node.each { |k, v| walk.call(v, path.empty? ? k.to_s : "#{path}/#{k}") }
      end
    end
    walk.call(json_data, '')
    out
  end
  gates = rooms.empty? ? [] : BreakEscape::NpcHabits.gate_entries(BreakEscape::NpcHabits.expanded_copy(json_data).first)
  # Only a gate the engine registers: on an entry doors.js matches to a doorway
  # (check_access_model warns otherwise). North, south, east and west doors all work.
  gates = gates.reject { |g| g[:doorway] }
  # The NPCs a gate can open for: those with a sprite. A phone NPC (npcType phone, or none,
  # which npc-manager.js reads as phone) or an openFor id with no NPC behind it never comes near
  room_npc_ids = rooms.values.flat_map { |r| r.is_a?(Hash) && r['npcs'].is_a?(Array) ? r['npcs'] : [] }
                      .select { |n| n.is_a?(Hash) && %w[person both].include?(n['npcType']) }
                      .map { |n| n['id'] }.grep(String).to_set
  # :open (a way in), :careful (opens only for careful guards) or nil (opens for nobody)
  gate_state = lambda do |g|
    guards = g[:open_for].select { |id| room_npc_ids.include?(id) }
    return nil if guards.empty?

    pass_if = g[:gate]['playerMayPassIf']
    return :open if pass_if.is_a?(String) && !pass_if.empty?

    (guards - BreakEscape::NpcHabits.gate_no_hold(g[:gate])).any? ? :open : :careful
  end
  # card_id => { careful: [room ids], npc_only: [room ids], object: [object paths] }, for the
  # locks the player cannot open
  npc_card_gaps = {}
  ai.cards(json_data).each_key do |card_id|
    next if declared['rfid'].include?(card_id)

    if has_cloner
      declared['rfid'] << card_id
      next
    end

    # Each locked room is decided by its gates. Every other lock on the card (an object, a
    # start item) is a gap no gate fills; a lock that also accepts an item card is open to
    # the player.
    gap = { careful: [], npc_only: [], object: objects_requiring.call(card_id) + other_requiring.call(card_id) }
    rooms_requiring.call(card_id).each do |room_id|
      states = gates.select { |g| g[:connected_room] == room_id }.map { |g| gate_state.call(g) }
      next if states.include?(:open)

      gap[states.include?(:careful) ? :careful : :npc_only] << room_id
    end
    if gap.values.all?(&:empty?)
      declared['rfid'] << card_id
    else
      npc_card_gaps[card_id] = gap
    end
  end
  quote = ->(ids) { ids.map { |r| "'#{r}'" }.join(', ') }
  %w[key rfid].each do |lock_kind|
    credential_requires[lock_kind].each do |req|
      next if declared[lock_kind].include?(req)

      gap = lock_kind == 'rfid' ? npc_card_gaps[req.to_s] : nil
      if gap
        unless gap[:careful].empty?
          issues << "⚠️ WARNING: a lock requires rfid '#{req}', which only an NPC carries, and every gate into " \
                    "#{quote.call(gap[:careful])} opens only for careful guards (holdsDoors false), who do not hold " \
                    "it for the player. Unless another way in exists, the player is likely stuck there. Add a " \
                    "cloner, a keycard item, a guard who holds doors, playerMayPassIf on the gate or another door."
        end
        unless gap[:npc_only].empty?
          issues << "⚠️ WARNING: a lock requires rfid '#{req}', and only an NPC carries that card. There is no " \
                    "rfid_cloner in the scenario and no gate into #{quote.call(gap[:npc_only])} opens for an NPC, so the player " \
                    "cannot use it. Add a cloner, a keycard item or a gate, or the door is a soft-lock."
        end
        unless gap[:object].empty?
          issues << "⚠️ WARNING: #{quote.call(gap[:object])} #{gap[:object].size == 1 ? 'is' : 'are'} locked with rfid " \
                    "'#{req}', a card only an NPC carries. Following someone through a gate does not give " \
                    "the player the card, and there is no rfid_cloner in the scenario, so nothing opens " \
                    "#{gap[:object].size == 1 ? 'it' : 'them'}. Add a cloner or a keycard item."
        end
        next
      end
      field = lock_kind == 'rfid' ? "card_id (or opens_lock)" : 'opens_lock'
      issues << "⚠️ WARNING: a lock requires #{lock_kind} '#{req}', but no item declares #{field} '#{req}'. " \
                "Unless that door is meant to be lockpicked only, nothing in the scenario can open it."
    end
  end

  issues
end

# ─────────────────────────────────────────────────────────────
# PIN locks the pad can't open. The PIN pad (minigames/pin/pin-minigame.js)
# has digit keys only and takes exactly `pinLength` digits, 4 if none is sent.
# The PIN never reaches the client, so the server sends its length as
# pinLength (Game.set_pin_length!), overriding an authored pinLength. So:
#   - a PIN with anything but digits can never be typed;
#   - an authored pinLength that disagrees with the PIN is wrong (the server
#     ignores it; before Game.set_pin_length! it made the lock unsolvable);
#   - a locked PIN lock with no PIN is checked against "" and never opens,
#     unless something else (an unlock_door event, a flag reward) opens it.
# ─────────────────────────────────────────────────────────────
def check_pin_locks(json_data)
  issues = []
  walk = lambda do |node, path|
    case node
    when Array then node.each_with_index { |n, i| walk.call(n, "#{path}[#{i}]") }
    when Hash
      if node['lockType'] == 'pin'
        where = "'#{path}'#{node['name'] ? " (#{node['name']})" : ''}"
        issues << "❌ ERROR: #{where} dustable must be true or false, got #{node['dustable'].inspect}." if node.key?('dustable') && ![true, false].include?(node['dustable'])
        issues << "❌ ERROR: #{where} dustHint must be a non-empty string, got #{node['dustHint'].inspect}." if node.key?('dustHint') && (!node['dustHint'].is_a?(String) || node['dustHint'].strip.empty?)
        where_hint = where
        issues << "⚠️ WARNING: #{where_hint} sets dustHint without dustable: true, so the hint is never shown (dusting is opt-in)." if node.key?('dustHint') && node['dustable'] != true
        if node['dustable'] == true && node['requires'].to_s =~ /\A\d+\z/ && node['requires'].to_s.chars.uniq.length <= 2
          issues << "⚠️ WARNING: #{where_hint} is dustable but its PIN uses only one or two distinct digits, so dusting reveals all or nearly all of it."
        end
        pin = node['requires']
        declared = node['pinLength']
        if pin.nil? || pin.to_s.empty?
          if node['locked']
            issues << "⚠️ WARNING: #{where} is a locked PIN lock with no 'requires' PIN. The server checks guesses " \
                      "against an empty PIN, so the pad never opens it; only an unlock_door event or flag reward can."
          end
        elsif !pin.is_a?(String) && !pin.is_a?(Integer)
          issues << "❌ ERROR: #{where} PIN lock 'requires' must be a string of digits, got #{pin.class}."
        elsif pin.to_s !~ /\A\d+\z/
          issues << "❌ ERROR: #{where} PIN '#{pin}' has characters other than digits. The PIN pad has keys 0-9 " \
                    "only, so it can never be entered. Use lockType 'password' for letters, or a digits-only PIN."
        elsif !declared.nil? && declared != pin.to_s.length
          issues << "❌ ERROR: #{where} has pinLength #{declared.inspect} but its PIN is #{pin.to_s.length} digits. " \
                    "The server sends the PIN's own length, so remove pinLength (it is not needed) or fix the PIN."
        end
      end
      if node['lockType'] != 'pin' && (node.key?('dustable') || node.key?('dustHint'))
        where = "'#{path}'#{node['name'] ? " (#{node['name']})" : ''}"
        issues << "⚠️ WARNING: #{where} sets dustable/dustHint but is not a PIN lock (lockType #{node['lockType'].inspect}). " \
                  "Dusting applies to PIN keypads only, so these fields are ignored."
      end
      node.each { |k, v| walk.call(v, path.empty? ? k.to_s : "#{path}/#{k}") }
    end
  end
  walk.call(json_data, '')
  issues
end

# ─────────────────────────────────────────────────────────────
# Combination padlocks and cryptexes the minigame can't open (unlock gaps build,
# 2026-11-12). The server checks the answer against `requires`, which never reaches
# the client. The padlock has three dials of 0-39 (minigames/combination); the
# cryptex has `cryptexConfig.wheelCount` wheels (5 if unset) of `alphabets` (A-Z if
# unset). The old client copies of the answer (`combination`, `cryptexConfig.answer`)
# are stripped from every payload, so they no longer open anything.
# ─────────────────────────────────────────────────────────────
def check_combination_cryptex_locks(json_data)
  issues = []
  walk = lambda do |node, path|
    case node
    when Array then node.each_with_index { |n, i| walk.call(n, "#{path}[#{i}]") }
    when Hash
      kind = node['lockType']
      if %w[combination cryptex].include?(kind)
        where = "'#{path}'#{node['name'] ? " (#{node['name']})" : ''}"
        secret = node['requires']
        if secret.nil? || secret.to_s.strip.empty?
          moved = kind == 'combination' ? node['combination'] : node.dig('cryptexConfig', 'answer')
          note = moved ? " Move the answer from '#{kind == 'combination' ? 'combination' : 'cryptexConfig.answer'}' into 'requires'." : ''
          issues << "❌ ERROR: #{where} is a #{kind} lock with no 'requires'. The server checks the answer " \
                    "against 'requires' only, so it can never open.#{note}"
        elsif kind == 'combination'
          parts = secret.is_a?(Array) ? secret.map(&:to_s) : secret.to_s.split(/[^0-9]+/).reject(&:empty?)
          unless parts.length == 3 && parts.all? { |p| p.match?(/\A\d+\z/) && p.to_i.between?(0, 39) }
            issues << "❌ ERROR: #{where} combination '#{secret.is_a?(Array) ? secret.join('-') : secret}' must be " \
                      "three numbers from 0 to 39 (the padlock's dials), such as \"12-30-5\"."
          end
        else
          config = node['cryptexConfig'].is_a?(Hash) ? node['cryptexConfig'] : {}
          wheels = config.key?('wheelCount') ? Integer(config['wheelCount'], exception: false) : 5
          unless wheels.is_a?(Integer) && wheels.positive?
            issues << "❌ ERROR: #{where} cryptexConfig.wheelCount must be a whole number such as 6, not " \
                      "#{config['wheelCount'].inspect}."
            wheels = 5
          end
          word = secret.to_s.strip
          alphabets = config['alphabets'] || Array.new(wheels, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')
          if word.length != wheels
            issues << "❌ ERROR: #{where} cryptex word is #{word.length} letters but the cryptex has #{wheels} " \
                      "wheels (cryptexConfig.wheelCount, 5 if unset), so it can never be spelt."
          elsif word.chars.each_with_index.any? { |c, w| !alphabets[w].to_s.upcase.include?(c.upcase) }
            issues << "❌ ERROR: #{where} cryptex word '#{word}' has a letter that is not on its wheel."
          end
        end
        if node.key?('combination') || (node['cryptexConfig'].is_a?(Hash) && node['cryptexConfig'].key?('answer'))
          issues << "⚠️ WARNING: #{where} still has the answer in '#{node.key?('combination') ? 'combination' : 'cryptexConfig.answer'}'. " \
                    "The server strips it and reads 'requires' only; remove it."
        end
      end
      node.each { |k, v| walk.call(v, path.empty? ? k.to_s : "#{path}/#{k}") }
    end
  end
  walk.call(json_data, '')
  issues
end

# A container an NPC carries is released (by a give or a KO) only through its scenario
# `id` (Game#released_npc_containers). Without one the player can never open it, and
# sees "Access denied" (unlock gaps R1 m2). The container test matches the server's:
# contents, locked, or a container type.
NPC_CONTAINER_TYPES = %w[suitcase briefcase bag1 bin1].freeze
# A container marked "dispenses" hands its contents straight to the inventory when opened (any
# lock type), through dispense-on-unlock.js. Items that need the container screen (not takeable, or
# a notes-family item that opens the notes minigame) make the engine fall back to the screen, so
# the flag does nothing useful there.
def check_dispenses_containers(json_data)
  issues = []
  walk = lambda do |node, path|
    case node
    when Array then node.each_with_index { |n, i| walk.call(n, "#{path}[#{i}]") }
    when Hash
      if node['dispenses'] == true
        Array(node['contents']).each_with_index do |c, i|
          next unless c.is_a?(Hash)
          if c['takeable'] == false || c['type'].to_s =~ /\Anotes\d*\z/
            issues << "⚠️ WARNING: '#{path}'#{node['name'] ? " (#{node['name']})" : ''} sets dispenses but its contents[#{i}] " \
                      "(#{c['id'] || c['name'] || c['type']}) is not takeable or is a notes item, so the engine opens the container screen instead of dispensing."
          end
        end
      end
      node.each { |k, v| walk.call(v, "#{path}/#{k}") if v.is_a?(Hash) || v.is_a?(Array) }
    end
  end
  walk.call(json_data, '')
  issues
end

# A container with contents and no `locked` key, and a nested container the player cannot open.
# The client reads a missing `locked` as a key lock (unlock-system.js), so a container that
# means to be open must say `"locked": false`. Seven types already raise an error for this in
# check_common_issues; they are skipped here so no object gets two lines.
UNOPENABLE_ERROR_TYPES = %w[briefcase bag bag1 suitcase safe pc bin1].freeze
# Types that open their own screen, so their `contents` are never shown whatever `locked` says. Derived from the client code, not listed by hand: the object types systems/interactions.js sends to
# their own screen (the dispatch block from the workstation branch up to the lockpick branch) and the
# keys of systems/minigame-registry.js, minus mail_terminal (its screen comes after the container branch)
# and the inventory-only tools that are not placed in rooms.
OWN_SCREEN_SOURCE_DIR = File.expand_path('../public/break_escape/js/systems', __dir__)
OWN_SCREEN_INVENTORY_ONLY = %w[ble_scanner bluetooth_scanner fingerprint_kit rfid_cloner keycard].freeze

def derive_own_screen_types(dir = OWN_SCREEN_SOURCE_DIR)
  types = []
  inter = File.join(dir, 'interactions.js')
  if File.exist?(inter)
    src = File.read(inter)
    from = src.index(/scenarioData\.type === ["']workstation["']/)
    upto = src.index(/scenarioData\.type === ["']lockpick["']/)
    if from && upto && upto > from
      types += src[from...upto].scan(/scenarioData\.type === ["']([^"']+)["']/).flatten
    end
  end
  reg = File.join(dir, 'minigame-registry.js')
  if File.exist?(reg)
    block = File.read(reg)[/const BUILT_IN = \{(.*?)^\};/m, 1].to_s
    types += block.scan(/^\s*'([^']+)':\s*\{/).flatten
  end
  (types - %w[mail_terminal] - OWN_SCREEN_INVENTORY_ONLY).uniq.freeze
end

OWN_SCREEN_TYPES = derive_own_screen_types

def check_unopenable_containers(json_data)
  issues = []
  label = lambda do |obj|
    obj['name'] ? " (#{obj['name']})" : ''
  end
  walk = lambda do |obj, path, nested|
    return unless obj.is_a?(Hash)
    contents = obj['contents']
    if contents.is_a?(Array) && !contents.empty? && !nested && OWN_SCREEN_TYPES.include?(obj['type'])
      issues << "⚠️ WARNING: '#{path}'#{label.call(obj)} (type '#{obj['type']}') opens its own screen, so its contents are never shown " \
                "to the player, whatever 'locked' says. Move the item out of contents (into a room object or an NPC)."
    elsif contents.is_a?(Array) && !contents.empty?
      exempt = (!nested && UNOPENABLE_ERROR_TYPES.include?(obj['type'])) ||
               (obj['type'] == 'pc' && obj['lockType'] == 'login') || obj['type'] == 'usb'
      if !exempt && !obj.key?('locked')
        issues << "⚠️ WARNING: '#{path}'#{label.call(obj)} has contents but no 'locked' key. The game reads a missing " \
                  "'locked' as a key lock, so the player may be unable to open it. Add \"locked\": false, or \"locked\": true with a lock type."
      end
      # Neither the container window (isInteractiveItem: a locked item, or an unlocked folder)
      # nor the take path (takeable items go to the inventory and open from there) opens it.
      if nested && obj['locked'] != true && obj['type'] != 'folder' && obj['takeable'] != true &&
         obj['type'] != 'usb' && !(obj['type'] == 'pc' && obj['lockType'] == 'login')
        issues << "⚠️ WARNING: '#{path}'#{label.call(obj)} is a nested container (type '#{obj['type']}') with contents that the " \
                  "player cannot open: it is not locked, not a folder and not takeable, so its icon does nothing. Make it a folder, lock it, or make it takeable."
      end
      contents.each_with_index { |c, i| walk.call(c, "#{path}/contents[#{i}]", true) }
    end
  end
  (json_data['rooms'] || {}).each do |room_id, room|
    next unless room.is_a?(Hash)
    Array(room['objects']).each_with_index { |o, i| walk.call(o, "rooms/#{room_id}/objects[#{i}]", false) }
  end
  if json_data['accountProfiles'].is_a?(Hash)
    json_data['accountProfiles'].each do |id, profile|
      next unless profile.is_a?(Hash) && profile['contents'].is_a?(Array)
      profile['contents'].each_with_index { |c, i| walk.call(c, "accountProfiles/#{id}/contents[#{i}]", true) }
    end
  end
  issues
end

def check_npc_held_containers(json_data)
  issues = []
  npcs = []
  (json_data['rooms'] || {}).each do |room_id, room|
    Array(room.is_a?(Hash) ? room['npcs'] : nil).each { |n| npcs << [n, "rooms/#{room_id}/npcs"] if n.is_a?(Hash) }
  end
  Array(json_data['npcs']).each { |n| npcs << [n, 'npcs'] if n.is_a?(Hash) }
  npcs.each do |npc, where|
    Array(npc['itemsHeld']).each_with_index do |item, i|
      next unless item.is_a?(Hash)
      container = item.key?('contents') || item['locked'] == true || NPC_CONTAINER_TYPES.include?(item['type'])
      next unless container
      next if item['id'].is_a?(String) && !item['id'].strip.empty?

      issues << "❌ ERROR: '#{where}/#{npc['id']}/itemsHeld[#{i}]'#{item['name'] ? " (#{item['name']})" : ''} is a " \
                "container an NPC carries but has no 'id'. The server releases it after a give or a KO only by its " \
                "id, so without one the player can never open it. Give it an id."
    end
  end
  issues
end

# ─────────────────────────────────────────────────────────────
# Patrol legs the re-target timer cuts short, and lockpick catches that name a lock
# the NPC can't see being picked (m02 Val and Gary).
#
# 1. npc-behavior.js parseConfig: patrol.speed defaults to 100 px/s and
#    patrol.changeDirectionInterval to 3000 ms. Waypoints are room-relative TILES
#    (world = room origin + x * TILE_SIZE, TILE_SIZE 32; validateWaypoints). An engine that
#    re-targets every interval cuts a leg longer than speed * interval short, so the NPC never
#    arrives or dwells (m02 Val: 3.6 s legs against the 3 s default). The current engine
#    exempts waypoint patrols (_isWaypointPatrol: only a stall of one whole interval
#    re-targets), so this only fires when that exemption is missing from npc-behavior.js
#    (pass engine_cuts_legs: true to force it). Legs are straight lines between consecutive
#    waypoints of one room (wrapping last to first in sequential mode); the walked path is
#    never shorter. Random mode picks any waypoint next, so every pair counts.
# 2. A lockpick_used_in_view mapping whose condition tests
#    data.lockable.scenarioData.id === 'x' needs a lock with that id that can actually be
#    picked (locked, lockType 'key'), inside the NPC's own room: the catch gate only watches
#    the player's room and the lock's room (lockpick-catch.js lockpickWatchRooms), and a
#    container's room is the one it loaded in. Whether the NPC's room has any pickable lock
#    at all is check_recurring_bugs.
# ─────────────────────────────────────────────────────────────
PATROL_DEFAULT_SPEED = 100
PATROL_DEFAULT_INTERVAL = 3000
PATROL_TILE_PX = 32
PATROL_LEG_MARGIN = 0.9
PATROL_EDGE_TILES = 2 # npc-pathfinding.js PATROL_EDGE_OFFSET

def check_npc_patrol_and_catch_locks(json_data, repo_root = nil, engine_cuts_legs: nil)
  issues = []
  rooms = json_data['rooms'].is_a?(Hash) ? json_data['rooms'] : {}

  if engine_cuts_legs.nil?
    behavior_js = repo_root && File.join(repo_root, 'public/break_escape/js/systems/npc-behavior.js')
    engine_cuts_legs = !!(behavior_js && File.exist?(behavior_js) && !File.read(behavior_js).include?('_isWaypointPatrol'))
  end

  each_npc = lambda do |&blk|
    rooms.each do |rid, room|
      next unless room.is_a?(Hash)
      Array(room['npcs']).each_with_index { |npc, i| blk.call(rid, i, npc) if npc.is_a?(Hash) }
    end
  end

  # --- 1. patrol legs longer than the re-target interval -------------------------------------
  if engine_cuts_legs
    each_npc.call do |rid, i, npc|
      patrol = npc.dig('behavior', 'patrol')
      next unless patrol.is_a?(Hash) && patrol['enabled'] != false
      speed = patrol['speed'].is_a?(Numeric) && patrol['speed'] > 0 ? patrol['speed'] : PATROL_DEFAULT_SPEED
      interval = patrol['changeDirectionInterval'].is_a?(Numeric) && patrol['changeDirectionInterval'] > 0 ? patrol['changeDirectionInterval'] : PATROL_DEFAULT_INTERVAL
      random_mode = patrol['waypointMode'] == 'random'
      lists = []
      lists << [Array(patrol['waypoints']), "rooms/#{rid}/npcs[#{i}]"] if patrol['waypoints'].is_a?(Array)
      if patrol['multiRoom'] && patrol['route'].is_a?(Array)
        patrol['route'].each_with_index { |seg, si| lists << [Array(seg['waypoints']), "rooms/#{rid}/npcs[#{i}]/route[#{si}]"] if seg.is_a?(Hash) }
      end
      lists.each do |wps, where|
        wps = wps.select { |w| w.is_a?(Hash) && w['x'].is_a?(Numeric) && w['y'].is_a?(Numeric) }
        next if wps.length < 2
        pairs = if random_mode
                  (0...wps.length).to_a.combination(2).to_a
        else
                  (0...wps.length).map { |k| [k, (k + 1) % wps.length] }.uniq { |a, b| [a, b].sort }
        end
        pairs.each do |a, b|
          px = Math.hypot(wps[b]['x'] - wps[a]['x'], wps[b]['y'] - wps[a]['y']) * PATROL_TILE_PX
          ms = px / speed * 1000
          next unless ms > interval * PATROL_LEG_MARGIN
          issues << "⚠️ WARNING: '#{where}' (#{npc['id']}) patrol leg waypoint #{a} (#{wps[a]['x']},#{wps[a]['y']}) to " \
                    "waypoint #{b} (#{wps[b]['x']},#{wps[b]['y']}) is #{px.round} px, #{(ms / 1000.0).round(1)} s at speed #{speed}, " \
                    "but changeDirectionInterval is #{(interval / 1000.0).round(1)} s. The re-target timer fires before " \
                    "the NPC arrives, so it never reaches or dwells at that waypoint (m02 Val). Raise changeDirectionInterval " \
                    "to at least #{((ms * 1.25) / 500.0).ceil * 500} ms, shorten the leg or raise the speed."
        end
      end
    end
  end

  # --- 2. catch conditions that name a lock the NPC can't see picked --------------------------
  # id => [[room, locked_key?]] for every object, nested contents included
  objects_by_id = Hash.new { |h, k| h[k] = [] }
  collect = lambda do |list, rid|
    Array(list).each do |o|
      next unless o.is_a?(Hash)
      objects_by_id[o['id']] << [rid, o['locked'] == true && o['lockType'] == 'key'] if o['id'].is_a?(String)
      collect.call(o['contents'], rid)
    end
  end
  rooms.each { |rid, room| collect.call(room['objects'], rid) if room.is_a?(Hash) }

  each_npc.call do |rid, i, npc|
    Array(npc['eventMappings']).each_with_index do |m, mi|
      next unless m.is_a?(Hash) && m['eventPattern'] == 'lockpick_used_in_view' && m['condition'].is_a?(String)
      cond = m['condition']
      ids = cond.scan(/data\.lockable\.scenarioData\.id\s*={2,3}\s*['"]([^'"]+)['"]/).flatten
      next if ids.empty?
      mpath = "rooms/#{rid}/npcs[#{i}]/eventMappings[#{mi}]"
      ids.uniq.each do |id|
        found = objects_by_id[id]
        if found.empty?
          issues << "⚠️ WARNING: '#{mpath}' (#{npc['id']}) only catches a pick of the lock with id '#{id}', but no object in " \
                    "the scenario has that id, so the condition is never true and the catch never fires. Fix the id."
        elsif found.none? { |r, _| r == rid }
          issues << "⚠️ WARNING: '#{mpath}' (#{npc['id']}) only catches a pick of '#{id}', which is in #{found.map(&:first).uniq.map { |r| "'#{r}'" }.join(', ')}, " \
                    "not '#{rid}'. The catch gate watches only the player's room and the lock's room, so an NPC in '#{rid}' " \
                    "never sees it picked. Move the NPC, or the lock."
        elsif found.none? { |r, pickable| r == rid && pickable }
          issues << "⚠️ WARNING: '#{mpath}' (#{npc['id']}) only catches a pick of '#{id}', but that object isn't a locked " \
                    "lockType 'key' lock, so the lockpick minigame never opens on it and the catch never fires."
        end
      end
    end
  end

  # --- 3. a route unlockRoom needs an unlockDoor mapping on the same NPC ----------------------
  # The server lets an NPC open a door only if its eventMappings carry `unlockDoor: <room>`
  # (game.rb npc_mapping_unlocks_door?). Without one the unlock is refused and the NPC
  # retries at the door every 5 s forever (test_gate_tailgate; the lab's Len).
  each_npc.call do |rid, i, npc|
    patrol = npc.dig('behavior', 'patrol')
    next unless patrol.is_a?(Hash)
    wp_lists = []
    wp_lists << [patrol['waypoints'], "rooms/#{rid}/npcs[#{i}]"] if patrol['waypoints'].is_a?(Array)
    if patrol['route'].is_a?(Array)
      patrol['route'].each_with_index { |seg, si| wp_lists << [seg['waypoints'], "rooms/#{rid}/npcs[#{i}]/route[#{si}]"] if seg.is_a?(Hash) && seg['waypoints'].is_a?(Array) }
    end
    mapped = Array(npc['eventMappings']).flat_map { |m| m.is_a?(Hash) ? Array(m['unlockDoor']) : [] }
    wp_lists.each do |wps, where|
      wps.each_with_index do |wp, wi|
        action = wp.is_a?(Hash) && wp['action'].is_a?(Hash) ? wp['action'] : nil
        # useMs (q53 e): how long the NPC stands keying at useObject before npc_used_object_done
        if action&.key?('useMs')
          ms = action['useMs']
          issues << "❌ ERROR: '#{where}' (#{npc['id']}) waypoint #{wi} action.useMs must be a number of ms from 0 to 30000." unless ms.is_a?(Numeric) && ms >= 0 && ms <= 30000
          issues << "⚠️ WARNING: '#{where}' (#{npc['id']}) waypoint #{wi} has action.useMs but no useObject; it does nothing without one." unless action['useObject'].is_a?(String)
        end
        # The engine runs actions only when multiRoom is true and the route has segments
        multi_room = patrol['multiRoom'] == true && patrol['route'].is_a?(Array) && !patrol['route'].empty?
        if action && !multi_room && (action['useObject'] || action['unlockRoom'])
          issues << "⚠️ WARNING: '#{where}' (#{npc['id']}) waypoint #{wi} has an action, but waypoint actions run only on a multi-room route (behavior.patrol.multiRoom true with a route)."
        end
        target = action ? action['unlockRoom'] : nil
        next unless target.is_a?(String) && !mapped.include?(target)
        issues << "❌ ERROR: '#{where}' (#{npc['id']}) waypoint #{wi} has action.unlockRoom '#{target}', but #{npc['id']} has no " \
                  "eventMapping with unlockDoor: \"#{target}\". The server refuses the unlock (game.rb npc_mapping_unlocks_door?) " \
                  "and the NPC retries at the door forever. Add an eventMapping with \"unlockDoor\": \"#{target}\" to this NPC."
      end
    end
  end

  # --- 4. waypoints outside the room's patrol bounds ----------------------------------------
  # npc-behavior.js validateWaypoints drops any patrol.waypoints entry outside the room's patrol
  # bounds (npc-pathfinding.js: PATROL_EDGE_OFFSET 2 tiles in from each edge of the tilemap), so
  # the NPC walks the rest, or stands still if none survive. Route (multiRoom) waypoints and
  # patrolOverride targets are not filtered this way. Skipped when the room's map is unreadable.
  if repo_root
    each_npc.call do |rid, i, npc|
      patrol = npc.dig('behavior', 'patrol')
      next unless patrol.is_a?(Hash) && patrol['waypoints'].is_a?(Array)
      type = rooms.dig(rid, 'type')
      map_file = type.is_a?(String) ? File.join(repo_root, 'public/break_escape/assets/rooms', "#{type}.json") : nil
      next unless map_file && File.exist?(map_file)
      map = (JSON.parse(File.read(map_file)) rescue nil)
      next unless map.is_a?(Hash) && map['width'].is_a?(Integer) && map['height'].is_a?(Integer)
      max_x = map['width'] - PATROL_EDGE_TILES
      max_y = map['height'] - PATROL_EDGE_TILES
      patrol['waypoints'].each_with_index do |w, wi|
        next unless w.is_a?(Hash) && w['x'].is_a?(Numeric) && w['y'].is_a?(Numeric)
        next if w['x'].between?(PATROL_EDGE_TILES, max_x) && w['y'].between?(PATROL_EDGE_TILES, max_y)
        issues << "⚠️ WARNING: 'rooms/#{rid}/npcs[#{i}]' (#{npc['id']}) patrol waypoint #{wi} (#{w['x']},#{w['y']}) is outside the " \
                  "room's patrol bounds (x and y from #{PATROL_EDGE_TILES} to #{max_x} / #{max_y} tiles in '#{type}'), so the engine drops it " \
                  "(npc-behavior.js validateWaypoints). Move it inside the bounds."
      end
    end
  end
  issues
end

# A scenario-side `give_item` action (timers, triggerOnInteract, onInteract ...) only
# reaches the player if the server's validate_item_collectible accepts the add
# (games_controller.rb). Two kinds (docs/achitechture/DECLARED_GRANTS_PLAN.md §4.3):
#
# - A declared grant (BreakEscape::DeclaredGrants: an item with an id or opens_lock, on a
#   path the engine runs) is accepted because the scenario declares it, and its contents
#   are served from the held item. It needs no world object; the checks here are that it
#   is well formed, and that it collides with nothing, because the grant step runs before
#   every other lookup and would hand a gated item over without its gate.
# - A give_item whose item has no identity is matched (ItemIdentity.addressed_by?) against
#   a takeable world object: a room object, container contents, a flag station or an NPC's
#   itemsHeld (lab_physical_pentest F11).
#
# Ink #give_item needs no extra check here: it names an NPC itemsHeld entry, which the ink
# cross-reference in check_ink_files already requires.
GIVE_ITEM_ALWAYS_ALLOWED = %w[notepad].freeze
GIVE_ITEM_DECOR_CUPS = %w[office-misc-cup office-misc-cup2 office-misc-cup3 office-misc-cup4
                          office-misc-cup5 coffee_cups1 mugs_tray1].freeze
GRANT_SENSITIVE_TYPES = %w[key keycard lockpick rfid_cloner].freeze

def check_give_item_collectible(json_data)
  issues = []
  rooms = json_data['rooms'].is_a?(Hash) ? json_data['rooms'] : {}
  grants_mod = BreakEscape::DeclaredGrants
  identities = ->(o) { grants_mod.identities(o) }
  # Mirrors ItemIdentity.addressed_by?(obj, type, id, name)
  addressed = lambda do |obj, type, id, name|
    next false unless obj.is_a?(Hash) && obj['type'] == type
    ids = identities.call(obj)
    next ids.include?(id.to_s) if id && !id.to_s.empty? && ids.any?
    next false if obj['name'].to_s.empty?
    [name, id].any? { |n| n && n.to_s == obj['name'].to_s }
  end

  # Every candidate holder: [match_target, room_id, kind, locked_room, locked_container, where]
  # Room objects and their contents at any depth, any object's itemsHeld, NPC itemsHeld.
  holders = []
  rooms.each do |rid, room|
    next unless room.is_a?(Hash)
    room_locked = room['locked'] == true
    add_obj = lambda do |obj, depth, cont_locked|
      next unless obj.is_a?(Hash)
      holders << [obj, rid, depth.zero? ? :room : :container, room_locked, cont_locked]
      Array(obj['contents']).each { |c| add_obj.call(c, depth + 1, cont_locked || obj['locked'] == true) }
      kind = obj['type'] == 'flag-station' ? :flag_station : :object_held
      Array(obj['itemsHeld']).each { |c| holders << [c, rid, kind, room_locked, false] if c.is_a?(Hash) }
    end
    Array(room['objects']).each { |obj| add_obj.call(obj, 0, false) }
    Array(room['npcs']).each do |npc|
      next unless npc.is_a?(Hash)
      Array(npc['itemsHeld']).each { |c| holders << [c, rid, :npc, room_locked, false, npc['id']] if c.is_a?(Hash) }
    end
  end
  gate_of = lambda do |(_, rid, kind, room_locked, cont_locked, npc_id)|
    case kind
    when :flag_station then "the flag-station reward in '#{rid}' (needs its flag)"
    when :npc then "NPC '#{npc_id}''s itemsHeld in '#{rid}' (needs the encounter)"
    when :object_held then "an object's itemsHeld in '#{rid}'"
    else
      if cont_locked then "a locked container in '#{rid}'"
      elsif room_locked then "locked room '#{rid}'"
      else "an object in '#{rid}'"
      end
    end
  end
  start_items = Array(json_data['startItemsInInventory']).select { |i| i.is_a?(Hash) }

  grants = grants_mod.for(json_data)
  grant_paths = grants.map { |g| g['path'] }

  # Identified give_items the engine never runs (e.g. an NPC eventMapping): not grants,
  # so the reward never arrives (R2 m2).
  grants_mod.unexecuted(json_data).each do |g|
    issues << "❌ ERROR: '#{g['path']}' is a give_item for '#{g['item']['type']}/#{identities.call(g['item']).first}', but " \
              "the engine never runs a give_item from there (only timers[].actions, triggerOnInteract, onInteract.actions, " \
              "esd completionActions/conditionalActions[].actions and confirm_action onConfirm). The player never receives it. " \
              "Fix: give it from a timer started by the same global (startOnGlobal)."
  end

  walk_contents = lambda do |list, &blk|
    Array(list).each do |c|
      blk.call(c)
      walk_contents.call(c['contents'], &blk) if c.is_a?(Hash)
    end
  end
  room_object_ids = holders.select { |_, _, kind| %i[room container].include?(kind) }
                           .map { |h, *| h['id'] }.compact.map(&:to_s)

  check_grant = lambda do |grant, index|
    item = grant['item']
    path = grant['path']
    type = item['type']
    ids = identities.call(item)
    label = "#{type}/#{ids.first}"

    contents = item['contents']
    if item['hasContents'] == true && !(contents.is_a?(Array) && contents.any?)
      issues << "❌ ERROR: '#{path}' declares hasContents for '#{label}' but carries no contents. The opener would show an empty desktop. " \
                "Fix: put the contents in the grant's item (they no longer live on a hidden room object)."
    end
    walk_contents.call(contents) do |c|
      unless c.is_a?(Hash) && c['type'].is_a?(String)
        issues << "❌ ERROR: '#{path}' grant '#{label}' has a contents entry with no string type."
        next
      end
      if c['locked'] == true && %w[pin password key].include?(c['lockType']) && c['requires'].to_s.empty?
        issues << "❌ ERROR: '#{path}' grant '#{label}' contains locked '#{c['name'] || c['type']}' (#{c['lockType']}) with no requires: it can never be opened."
      end
      if c['locked'] == true && c.key?('contents') && c['id'].to_s.empty?
        issues << "❌ ERROR: '#{path}' grant '#{label}' contains a locked container '#{c['name'] || c['type']}' with no id: its unlock and contents fetch key on the id."
      end
      if c['id'] && room_object_ids.include?(c['id'].to_s)
        issues << "❌ ERROR: '#{path}' grant '#{label}' contains '#{c['id']}', which a room object also uses as its id. The room lookups run first and would answer instead of the grant."
      end
    end

    grants.each_with_index do |other, j|
      next if j <= index
      o = other['item']
      next unless o['type'] == type
      if (identities.call(o) & ids).any? && o != item
        issues << "❌ ERROR: '#{path}' and '#{other['path']}' grant '#{label}' with different fields. Which copy is stored depends on walk order; make them identical or give them different ids."
      elsif (identities.call(o) & ids).empty? && !item['name'].to_s.empty? && o['name'].to_s == item['name'].to_s
        issues << "❌ ERROR: '#{path}' and '#{other['path']}' grant two '#{type}' items both named '#{item['name']}' with different ids. A name-only claim would take the first; rename one."
      end
    end

    holders.each do |h|
      obj = h[0]
      next unless obj['type'] == type
      obj_ids = identities.call(obj)
      if (obj_ids & ids).any?
        if %i[room container].include?(h[2]) && obj['active'] == false
          issues << "❌ ERROR: '#{path}' grant '#{label}' still has its hidden twin in '#{h[1]}'. A declared grant needs no world object, and the room lookups would answer instead of the grant. " \
                    "Fix: move the twin's contents into the grant's item and delete the twin."
        else
          issues << "❌ ERROR: '#{path}' grant '#{label}' shares its type and id with #{gate_of.call(h)}. The grant step runs first, so that item could be claimed without its gate. " \
                    "Fix: give the grant its own id."
        end
      elsif obj_ids.empty? && !item['name'].to_s.empty? && obj['name'].to_s == item['name'].to_s
        issues << "❌ ERROR: '#{path}' grant '#{label}' has the same type and name as an id-less item (#{gate_of.call(h)}). Picking that item up would be decided by the grant and store the grant's copy. " \
                  "Fix: give the other item an id, or rename one."
      end
    end

    if item['opens_lock'] || item['keyId'] || item['key_id'] || GRANT_SENSITIVE_TYPES.include?(type)
      issues << "⚠️ WARNING: '#{path}' grants '#{label}', a key or lock tool. A declared grant can be claimed from the first second of the game (no trigger check), so this opens its lock for anyone who asks the server directly."
    end

    if (m = path.match(/\Atimers\[(\d+)\]/))
      timer = Array(json_data['timers'])[m[1].to_i]
      if timer.is_a?(Hash) && (Array(timer['actions']).length > 1 || timer['setGlobal'])
        issues << "⚠️ WARNING: timer '#{timer['id']}' gives '#{label}' and also has other actions or a setGlobal. If the page closes while the give is retrying, a reload fires the timer again and re-runs them. Put the give in a timer of its own."
      end
    end
  end
  grants.each_with_index { |g, i| check_grant.call(g, i) }

  # give_items that are not grants: the world-object rule
  walk = lambda do |node, path|
    case node
    when Hash
      if node['type'] == 'give_item' && node['item'].is_a?(Hash) && node['item']['type'].is_a?(String) &&
         identities.call(node['item']).empty?
        item = node['item']
        type = item['type']
        name = item['name']
        label = type
        skip = GIVE_ITEM_ALWAYS_ALLOWED.include?(type) ||
               start_items.any? { |si| si['type'] == type && si['name'] == name }
        unless skip
          found = holders.select { |h, *| addressed.call(h, type, nil, name) }
          if found.empty?
            issues << "❌ ERROR: '#{path}' is a give_item for '#{label}' with no id, and no object in the scenario has that type and name. " \
                      "The server refuses an item it cannot find, so the player never receives it. " \
                      "Fix: give the item an id; it is then a declared grant and needs no object."
          elsif found.none? { |h, *| h['takeable'] }
            issues << "❌ ERROR: '#{path}' is a give_item for '#{label}', but the matching object in " \
                      "#{found.map { |_, r, *| "'#{r}'" }.uniq.join(', ')} is not takeable, so the server refuses it. " \
                      "Fix: give the item an id (a declared grant needs no object), or set takeable: true on that object."
          else
            ok = found.select { |h, *| h['takeable'] }
            if ok.all? { |_, _, kind, room_locked, cont_locked| %i[room container].include?(kind) && (room_locked || cont_locked) }
              where = ok.map { |_, r, kind, rl, cl| cl ? "a locked container in '#{r}'" : "locked room '#{r}'" }.uniq.join(', ')
              issues << "⚠️ WARNING: '#{path}' give_item '#{label}' only matches an object in #{where}. The server accepts the " \
                        "add only once that room (or container) is unlocked, so a reward that fires earlier is refused. " \
                        "Move the object to a room the player has already opened, or check the trigger can't fire first."
            end
            issues << "⚠️ WARNING: '#{path}' give_item '#{label}' has no id, so it depends on a world object with the same name. " \
                      "Give it an id to make it a declared grant and drop the hidden object."
          end
        end
      end
      node.each { |k, v| walk.call(v, "#{path}/#{k}") unless k == 'flagRewards' }
    when Array
      node.each_with_index { |v, i| walk.call(v, "#{path}[#{i}]") }
    end
  end
  json_data.each { |k, v| walk.call(v, k) unless %w[startItemsInInventory].include?(k) }
  issues
end

# interactionWarning (systems/interactions.js): an author-defined "are you sure?" any
# object may carry, shown before the object's normal interaction. Validate its shape
# wherever it appears (walk the whole document, so nested contents/itemsHeld are covered).
CONFIRM_LABEL_MAX = 16

# Keys each apply-actions.js action reads: scripts/action_key_table.json (drift-tested against the
# case labels of apply-actions.js by test/js/action-key-table.test.mjs). Its keys are the
# known_actions vocabulary below.
ACTION_KEY_TABLE = JSON.parse(File.read(File.join(__dir__, 'action_key_table.json')))['actions'].freeze

def check_interaction_warnings(json_data)
  issues = []
  # The apply-actions.js action vocabulary (its case labels) plus the extra names the
  # triggerOnInteract schema enum accepts. Unknown types are a soft warning, not an error.
  known_actions = ACTION_KEY_TABLE.keys
  check_actions = lambda do |acts, p|
    unless acts.is_a?(Array)
      issues << "❌ ERROR: '#{p}' must be an array of actions."
      return
    end
    acts.each_with_index do |a, i|
      if !a.is_a?(Hash)
        issues << "❌ ERROR: '#{p}[#{i}]' must be an action object."
      elsif !a['type'].is_a?(String) || a['type'].empty?
        issues << "❌ ERROR: '#{p}[#{i}]' needs a string 'type'."
      elsif !known_actions.include?(a['type'])
        issues << "⚠️ WARNING: '#{p}[#{i}]' has unknown action type '#{a['type']}'. " \
                  "Known types: #{known_actions.join(', ')}."
      end
    end
  end
  walk = nil
  walk = lambda do |node, path|
    case node
    when Hash
      if node.key?('interactionWarning')
        w = node['interactionWarning']
        wp = "#{path}/interactionWarning"
        if !w.is_a?(Hash)
          issues << "❌ ERROR: '#{wp}' must be an object { text, proceedLabel, declineLabel, onProceed, onDecline, once }."
        else
          if !w['text'].is_a?(String) || w['text'].strip.empty?
            issues << "❌ ERROR: '#{wp}/text' is required and must be a non-empty string."
          end
          ['proceedLabel', 'declineLabel'].each do |lk|
            if w.key?(lk) && !w[lk].is_a?(String)
              issues << "❌ ERROR: '#{wp}/#{lk}' must be a string."
            end
          end
          if w.key?('once') && ![true, false].include?(w['once'])
            issues << "❌ ERROR: '#{wp}/once' must be a boolean."
          end
          check_actions.call(w['onProceed'], "#{wp}/onProceed") if w.key?('onProceed')
          check_actions.call(w['onDecline'], "#{wp}/onDecline") if w.key?('onDecline')
          extra = w.keys - %w[text proceedLabel declineLabel onProceed onDecline once _comment]
          unless extra.empty?
            issues << "⚠️ WARNING: '#{wp}' has unrecognised key(s): #{extra.join(', ')}."
          end
        end
      end
      # A confirm's button label stays on one line (notifications.css nowrap), and at phone
      # width a button holds about 18 characters before the frame cuts it (UX slice 16 R1 m9).
      %w[confirmLabel cancelLabel proceedLabel declineLabel].each do |lk|
        label = node[lk]
        next unless label.is_a?(String) && label.strip.length > CONFIRM_LABEL_MAX
        issues << "⚠️ WARNING: '#{path}/#{lk}' is #{label.strip.length} characters (\"#{label.strip}\"). " \
                  "A confirm button label of more than #{CONFIRM_LABEL_MAX} characters is cut off at phone width; " \
                  "shorten it (\"Switch off\", \"Leave it\")."
      end
      # A minigame's own data is its own format: the EHR terminal's medication rows carry a
      # string 'interactionWarning' that the object-level warning code never reads.
      node.each { |k, v| walk.call(v, path.empty? ? k.to_s : "#{path}/#{k}") unless k == 'minigameData' }
    when Array
      node.each_with_index { |v, i| walk.call(v, "#{path}[#{i}]") }
    end
  end
  walk.call(json_data, '')
  issues
end

# E4: the keys of every action in an action list. An eventMapping's `actions` list is strict
# (a missing required key, an unknown key or an unknown type is an error, so `{ type: 'hint',
# text: ... }` fails); the older lists (triggerOnInteract, onConfirm, onProceed, onDecline, timer
# and onInteract `actions`, onWear, onRemove) report the same findings as warnings. `type`,
# `condition` and keys starting with `_` are allowed on every action.
ACTION_LIST_KEY_NAMES = %w[actions triggerOnInteract onConfirm onProceed onDecline onWear onRemove].freeze

def check_action_keys(json_data)
  issues = []
  rooms = json_data['rooms'].is_a?(Hash) ? json_data['rooms'] : {}
  globals = json_data['globalVariables'].is_a?(Hash) ? json_data['globalVariables'] : {}
  npc_ids = []
  npc_nodes = {}
  started = []   # npc ids named by any start_patrol action anywhere
  droppable = []
  collect = nil
  collect = lambda do |node|
    case node
    when Hash
      if node['npcType'] || node['behavior'] || node.key?('eventMappings')
        npc_ids << node['id']
        npc_nodes[node['id']] = node if node['id'].is_a?(String)
      end
      started << node['npc'] if node['type'] == 'start_patrol' && node['npc'].is_a?(String)
      droppable << node['id'] if node['droppable'] == true && node['id'].is_a?(String)
      node.each_value { |v| collect.call(v) }
    when Array
      node.each { |v| collect.call(v) }
    end
  end
  collect.call(json_data)

  check_list = lambda do |acts, p, strict|
    sev = strict ? '❌ ERROR' : '⚠️ WARNING'
    unless acts.is_a?(Array)
      issues << "❌ ERROR: '#{p}' must be an array of actions." if strict
      next
    end
    acts.each_with_index do |a, i|
      ap = "#{p}[#{i}]"
      unless a.is_a?(Hash)
        issues << "❌ ERROR: '#{ap}' must be an action object." if strict
        next
      end
      type = a['type']
      unless type.is_a?(String) && !type.empty?
        issues << "❌ ERROR: '#{ap}' needs a string 'type'." if strict
        next
      end
      spec = ACTION_KEY_TABLE[type]
      unless spec
        issues << "❌ ERROR: '#{ap}' has unknown action type '#{type}'. Known types: #{ACTION_KEY_TABLE.keys.join(', ')}." if strict
        next
      end
      allowed = spec['required'] + spec['optional'] + %w[type condition]
      spec['required'].each do |k|
        issues << "#{sev}: '#{ap}' (#{type}) is missing required key '#{k}'." unless a.key?(k)
      end
      if type == 'set_costume' && %w[costume id value].none? { |k| a.key?(k) }
        issues << "#{sev}: '#{ap}' (set_costume) needs 'costume'."
      end
      extra = a.keys.reject { |k| allowed.include?(k) || k.start_with?('_') }
      unless extra.empty?
        issues << "#{sev}: '#{ap}' (#{type}) has unknown key(s): #{extra.join(', ')}. Keys read: #{(spec['required'] + spec['optional']).join(', ')}."
      end
      if a.key?('condition') && (!a['condition'].is_a?(String) || a['condition'].strip.empty?)
        issues << "#{sev}: '#{ap}' condition must be a non-empty string; a bad condition never holds, so the action never runs."
      end
      if type == 'remove_world_item'
        item = a['item']
        if item.is_a?(String) && !droppable.include?(item)
          issues << "#{sev}: '#{ap}' (remove_world_item) names '#{item}', which is not a declared item with droppable: true."
        end
        named = [a['roomId']].compact + (a['roomIds'].is_a?(Array) ? a['roomIds'] : [])
        named.each do |rid|
          issues << "#{sev}: '#{ap}' (remove_world_item) names room '#{rid}', which the scenario does not declare." unless rooms.key?(rid)
        end
      end
      if %w[start_patrol resume_patrol].include?(type) && a['npc'].is_a?(String) && !npc_ids.include?(a['npc'])
        issues << "#{sev}: '#{ap}' (#{type}) names npc '#{a['npc']}', which the scenario does not declare."
      end
      if %w[start_patrol resume_patrol].include?(type) && a['npc'].is_a?(String) && npc_nodes[a['npc']]
        pat = npc_nodes[a['npc']].dig('behavior', 'patrol')
        authored = pat.is_a?(Hash) && (Array(pat['waypoints']).any? || (pat['multiRoom'] && Array(pat['route']).any?) || pat['bounds'] || pat['worldBounds'])
        issues << "⚠️ WARNING: '#{ap}' (#{type}) names '#{a['npc']}', which has no authored patrol (behavior.patrol waypoints, a multiRoom route or bounds), so the action does nothing." unless authored
      end
      # E4 R1 m4: these actions run client-side only from a mapping (no gameId), so nothing is saved
      if strict && %w[unlock_door unlock_object complete_task].include?(type)
        field = { 'unlock_door' => "the mapping's own 'unlockDoor'", 'unlock_object' => "a server-side unlock (the mapping has no unlockObject field)", 'complete_task' => "the mapping's own 'completeTask'" }[type]
        issues << "⚠️ WARNING: '#{ap}' (#{type}) in a mapping's actions is not saved by the server (no game id), so it is lost on reload; use #{field}."
      end
      if type == 'set_global' && a['key'].is_a?(String) && !globals.key?(a['key'])
        issues << "⚠️ WARNING: '#{ap}' (set_global) sets '#{a['key']}', which is not a declared global."
      end
    end
  end

  walk = nil
  walk = lambda do |node, path|
    case node
    when Hash
      node.each do |k, v|
        next if k == 'minigameData' || k == 'flagRewards'
        child = path.empty? ? k.to_s : "#{path}/#{k}"
        mapping_actions = k == 'actions' && path =~ /eventMappings\[\d+\]\z/
        # an onConfirm list nested inside a mapping's actions is as strict as the list around it
        nested_in_mapping = path =~ %r{eventMappings\[\d+\]/actions\[}
        if ACTION_LIST_KEY_NAMES.include?(k) && !mapping_actions && v.is_a?(Array) && !v.empty? &&
           v.all? { |e| e.is_a?(Hash) && e['type'].is_a?(String) }
          check_list.call(v, child, nested_in_mapping ? true : false)
        end
        check_list.call(v, child, true) if mapping_actions
        walk.call(v, child)
      end
    when Array
      node.each_with_index { |v, i| walk.call(v, "#{path}[#{i}]") }
    end
  end
  walk.call(json_data, '')
  npc_nodes.each do |id, node|
    pat = node.dig('behavior', 'patrol')
    next unless pat.is_a?(Hash)
    next unless pat['startDeferred'] == true || (pat['startWhen'].is_a?(String) && pat['startWhen'].strip != '')
    unless started.include?(id) || (pat['startWhen'].is_a?(String) && pat['startWhen'].strip != '')
      issues << "⚠️ WARNING: '#{id}' has a startDeferred patrol that no start_patrol action names (and no startWhen), so it never moves."
    end
    if node['needs'] || node.dig('behavior', 'needs')
      issues << "⚠️ WARNING: '#{id}' has a deferred patrol and needs; start_patrol suspends its needs for good (as any scripted move does)."
    end
  end
  issues
end

# A scenario that cancels a card (apply-actions.js revoke_card, the left-card consequence §3.3b)
# must declare the globalVariables.revoked_card_ids array. The server enforces the cancellation
# from that global (Game#revoked_card_ids), stored grow-only, and round-trips it to the client for
# the UI filter. Without the declared array the revocation is unenforceable: nothing seeds the
# server default and the client has no base value to add to, so a cancelled card keeps opening its
# door. Both test_clone_left_card and lab_physical_pentest already declare it.
def check_revoke_card_globals(json_data)
  issues = []
  found = false
  revoked_ids = []
  granted = {} # card_id => the pointer of the give_item or start item that hands it over

  # Every card_id string under a granted item subtree: its own card_id and any nested
  # rfidCard/card/contents card_id, so a card handed over inside a container counts too.
  card_ids_under = nil
  card_ids_under = lambda do |node, out|
    case node
    when Hash
      cid = node['card_id']
      out << cid if cid.is_a?(String) && !cid.empty?
      out.concat(cid.select { |c| c.is_a?(String) && !c.empty? }) if cid.is_a?(Array)
      node.each_value { |v| card_ids_under.call(v, out) }
    when Array
      node.each { |v| card_ids_under.call(v, out) }
    end
    out
  end

  walk = nil
  walk = lambda do |node, pointer|
    case node
    when Hash
      if node['type'] == 'revoke_card'
        found = true
        cid = node['card_id']
        revoked_ids << cid if cid.is_a?(String) && !cid.empty?
        revoked_ids.concat(cid.select { |c| c.is_a?(String) && !c.empty? }) if cid.is_a?(Array)
      end
      if node['type'] == 'give_item' && node['item'].is_a?(Hash)
        card_ids_under.call(node['item'], []).each { |c| granted[c] ||= "#{pointer}/item" }
      end
      node.each { |k, v| walk.call(v, "#{pointer}/#{k}") }
    when Array
      node.each_with_index { |v, i| walk.call(v, "#{pointer}/#{i}") }
    end
  end
  walk.call(json_data, '#')

  # Start items the player begins with: each carried card_id is granted at game start.
  if json_data['startItemsInInventory'].is_a?(Array)
    json_data['startItemsInInventory'].each_with_index do |item, i|
      next unless item.is_a?(Hash)

      card_ids_under.call(item, []).each { |c| granted[c] ||= "#/startItemsInInventory/#{i}" }
    end
  end

  return issues unless found

  globals = json_data['globalVariables']
  value = globals.is_a?(Hash) ? globals['revoked_card_ids'] : nil
  unless value.is_a?(Array)
    issues << "❌ ERROR: a 'revoke_card' action is used but 'globalVariables.revoked_card_ids' is " \
              "not declared as an array. The server enforces card cancellation from this global " \
              "(stored grow-only) and the client reads it for the UI; without the declared array " \
              "default [] the cancellation never takes, so a revoked card keeps opening its door."
  end

  # Advisory (hardening item 2): a card handed to the player that a revoke_card also cancels.
  # revoked_card_ids is grow-only (merge_global_variables! unions it every sync and there is no
  # un-revoke path), so a card re-issued under the same id after revocation stays dead. Fires on
  # nothing in the corpus; purely an authoring guard.
  (revoked_ids.uniq & granted.keys).sort.each do |cid|
    issues << "⚠️ WARNING: #{granted[cid]}: card_id '#{cid}' is handed to the player (give_item or a " \
              "start item) and is also cancelled by a 'revoke_card' action. revoked_card_ids is " \
              "grow-only, so once this id is revoked it stays refused for the rest of the game. That is " \
              "fine for a card given and later cancelled. If the player is meant to get a working card " \
              "back after the revoke, give the re-issued card a fresh card_id."
  end
  issues
end

# ---------------------------------------------------------------------------------------------
# NPC walk-in / walk-out (docs/agents/NPC_WALK_IN_OUT_PLAN.md sections 2 and 8)
#
# An eventMapping may carry `walkIn` or `walkOut` in place of `setVisible`:
#   walkIn:  true | { from: <roomId>|"offscreen"|{room,x,y}, to: {x,y}, speed, timeoutMs }
#   walkOut: true | { to: <roomId>|"offscreen"|{room,x,y}, speed, timeoutMs }
# This check validates their shape, the rooms they name and the tiles they use. The "pop" check
# (a visible NPC shown or hidden in place by setVisible) lives in check_npc_pop below.
WALK_IN_KEYS = %w[from to speed timeoutMs].freeze
WALK_OUT_KEYS = %w[to speed timeoutMs].freeze

def walk_event_mappings(npc)
  maps = npc['eventMappings']
  maps = maps.values if maps.is_a?(Hash)
  maps.is_a?(Array) ? maps : []
end

def walk_room_connections(room)
  return [] unless room.is_a?(Hash) && room['connections'].is_a?(Hash)

  room['connections'].values.flatten.compact.map(&:to_s)
end

# The gate on the door between two rooms, from either room's `doors` list, or nil.
def walk_door_gate(rooms, a, b)
  [[a, b], [b, a]].each do |here, there|
    doors = rooms.dig(here, 'doors')
    next unless doors.is_a?(Array)

    doors.each do |d|
      return d['gate'] if d.is_a?(Hash) && d['connectedRoom'].to_s == there.to_s && d['gate'].is_a?(Hash)
    end
  end
  nil
end

def check_npc_walk(json_data, repo_root = nil)
  issues = []
  rooms = json_data['rooms']
  return issues unless rooms.is_a?(Hash)

  repo_root ||= File.expand_path('..', __dir__)
  type_map = geom_type_to_tilemap(repo_root)
  dim_cache = {}
  dims_of = lambda do |room_id|
    room = rooms[room_id]
    room.is_a?(Hash) && room['type'] ? geom_room_dimensions(room['type'], type_map, repo_root, dim_cache) : nil
  end
  tile_ok = ->(t) { t.is_a?(Hash) && t['x'].is_a?(Numeric) && t['y'].is_a?(Numeric) }

  rooms.each do |room_id, room|
    next unless room.is_a?(Hash) && room['npcs'].is_a?(Array)

    room['npcs'].each_with_index do |npc, nidx|
      next unless npc.is_a?(Hash)

      walk_event_mappings(npc).each_with_index do |m, idx|
        next unless m.is_a?(Hash) && (m.key?('walkIn') || m.key?('walkOut'))

        mp = "rooms/#{room_id}/npcs[#{nidx}]/eventMappings[#{idx}]"
        if npc['npcType'] == 'phone'
          issues << "❌ ERROR: '#{mp}' uses walkIn/walkOut on a phone NPC. Phone NPCs have no sprite to walk; remove it."
        end
        if m.key?('walkIn') && m.key?('walkOut')
          issues << "❌ ERROR: '#{mp}' has both walkIn and walkOut. Use one mapping for each direction."
        end
        %w[setVisible patrolOverride].each do |other|
          next unless m.key?(other)

          issues << "❌ ERROR: '#{mp}' has walkIn/walkOut and #{other}. walkIn/walkOut replace #{other == 'setVisible' ? 'setVisible' : 'a patrolOverride to the door'} " \
                    "in the same mapping; keep only one."
        end

        # [field, allowed keys, rooms the far end may name]
        [['walkIn', WALK_IN_KEYS], ['walkOut', WALK_OUT_KEYS]].each do |field, allowed|
          next unless m.key?(field)

          cfg = m[field]
          fp = "#{mp}/#{field}"
          next if cfg == true

          unless cfg.is_a?(Hash)
            issues << "❌ ERROR: '#{fp}' must be true or an object (#{allowed.join(', ')})."
            next
          end
          (cfg.keys - allowed).each do |k|
            issues << "❌ ERROR: '#{fp}' has unknown key '#{k}'. Allowed: #{allowed.join(', ')}."
          end
          if cfg.key?('speed') && (!cfg['speed'].is_a?(Numeric) || cfg['speed'] <= 0)
            issues << "❌ ERROR: '#{fp}/speed' must be a positive number (pixels per second)."
          end
          if cfg.key?('timeoutMs') && (!cfg['timeoutMs'].is_a?(Numeric) || cfg['timeoutMs'] <= 0)
            issues << "❌ ERROR: '#{fp}/timeoutMs' must be a positive number (milliseconds)."
          end

          # The walk's own-room destination tile (walkIn only)
          if field == 'walkIn' && cfg.key?('to')
            if !tile_ok.call(cfg['to'])
              issues << "❌ ERROR: '#{fp}/to' must be a tile {x: number, y: number} in the NPC's own room."
            else
              d = dims_of.call(room_id)
              if d && (cfg['to']['x'] < 0 || cfg['to']['y'] < 0 || cfg['to']['x'] >= d[:w_tiles] || cfg['to']['y'] >= d[:h_tiles])
                issues << "❌ ERROR: '#{fp}/to' (#{cfg['to']['x']}, #{cfg['to']['y']}) is outside room '#{room_id}' " \
                          "(#{d[:w_tiles]}x#{d[:h_tiles]} tiles)."
              end
              pos = npc['position']
              if pos.is_a?(Hash) && (pos['x'] != cfg['to']['x'] || pos['y'] != cfg['to']['y'])
                issues << "⚠️ WARNING: '#{fp}/to' differs from the NPC's position (#{pos['x']}, #{pos['y']}). " \
                          "A reload puts the NPC at its position, not at 'to'."
              end
            end
          end

          # The far end: walkIn.from, walkOut.to
          far_key = field == 'walkIn' ? 'from' : 'to'
          next if field == 'walkIn' && !cfg.key?('from')
          next if field == 'walkOut' && !cfg.key?('to')

          far = cfg[far_key]
          fa = "#{fp}/#{far_key}"
          next if far == 'offscreen'

          far_room = nil
          if far.is_a?(String)
            far_room = far
          elsif far.is_a?(Hash)
            far_room = far['room'].to_s
            if !tile_ok.call(far) || far['room'].to_s.empty?
              issues << "❌ ERROR: '#{fa}' as an object must be {room: roomId, x: number, y: number}."
              next
            end
            d = dims_of.call(far_room)
            if d && (far['x'] < 0 || far['y'] < 0 || far['x'] >= d[:w_tiles] || far['y'] >= d[:h_tiles])
              issues << "❌ ERROR: '#{fa}' tile (#{far['x']}, #{far['y']}) is outside room '#{far_room}' " \
                        "(#{d[:w_tiles]}x#{d[:h_tiles]} tiles)."
            end
          else
            issues << "❌ ERROR: '#{fa}' must be a room id, \"offscreen\" or {room, x, y}."
            next
          end

          if !rooms.key?(far_room)
            issues << "❌ ERROR: '#{fa}' names room '#{far_room}', which does not exist."
          elsif far_room != room_id
            if !walk_room_connections(room).include?(far_room) && !walk_room_connections(rooms[far_room]).include?(room_id)
              issues << "❌ ERROR: '#{fa}' names room '#{far_room}', which is not connected to the NPC's room '#{room_id}'. " \
                        "Name a room beside it, or \"offscreen\"."
            else
              gate = walk_door_gate(rooms, room_id, far_room)
              if gate
                unless Array(gate['openFor']).map(&:to_s).include?(npc['id'].to_s)
                  issues << "❌ ERROR: '#{fa}' goes through the gate to '#{far_room}', whose openFor does not list '#{npc['id']}'. " \
                            "The walk would wait at the gate until it times out."
                end
              elsif rooms[far_room].is_a?(Hash) && rooms[far_room]['locked']
                issues << "⚠️ WARNING: '#{fa}' names '#{far_room}', which is locked and not a gate. " \
                          "The NPC will fade at the doorway instead of walking through."
              end
            end
          end
        end
      end
    end
  end
  issues
end

# The "pop" check: a visible NPC shown or hidden in place by setVisible in mid-scene. Patterns
# (all on a person NPC, in a mapping without walkIn/walkOut):
#   - setVisible on room_entered:<the NPC's own room> (the player sees the NPC blink in or out)
#   - setVisible with a bark or a conversation in the same mapping (it speaks as it appears)
#   - setVisible false on npc_arrived:<self> (walk to the door, then vanish)
# POP_CHECK_LEVEL was chosen by running the check over every scenario on 2026-11-25
# (docs/agents/NPC_WALK_IN_OUT_HANDOVER.md "B2 status"): the hits outside the known cases set it.
POP_CHECK_LEVEL = :info
POP_CHECK_KNOWN = %w[archive_guard monitor_guard farah_guard kit_camila_ospina].freeze

def check_npc_pop(json_data)
  issues = []
  rooms = json_data['rooms']
  return issues unless rooms.is_a?(Hash)

  rooms.each do |room_id, room|
    next unless room.is_a?(Hash) && room['npcs'].is_a?(Array)

    room['npcs'].each_with_index do |npc, nidx|
      next unless npc.is_a?(Hash) && npc['npcType'] != 'phone'

      walk_event_mappings(npc).each_with_index do |m, idx|
        next unless m.is_a?(Hash) && m.key?('setVisible') && !m.key?('walkIn') && !m.key?('walkOut')
        next if m['_comment'].to_s.start_with?('Retired') && m['condition'].to_s.include?('retired_')

        pattern = m['eventPattern'].to_s
        why = []
        why << "it is on room_entered:#{room_id}, the NPC's own room" if pattern == "room_entered:#{room_id}"
        why << 'it also has a bark or conversation' if m['bark'] || m['conversationMode']
        why << 'it hides the NPC on its own arrival' if m['setVisible'] == false && pattern == "npc_arrived:#{npc['id']}"
        next if why.empty?

        msg = "'rooms/#{room_id}/npcs[#{nidx}]/eventMappings[#{idx}]' (#{npc['id']}) shows or hides a visible NPC in place " \
              "with setVisible: #{why.join('; ')}. The NPC will pop; use walkIn/walkOut."
        issues << (POP_CHECK_LEVEL == :warn ? "⚠️ WARNING: pop check: #{msg}" : "ℹ️ INFO: pop check: #{msg}")
      end
    end
  end
  issues
end

def check_common_issues(json_data, valid_item_types = nil)
  issues = []

  # Validate a voice.fx config (Web Audio distortion/filtering applied to a speaker's TTS).
  # Appends to `issues`. Keep the preset list in sync with TTSManager.VOICE_FX_PRESETS in
  # public/break_escape/js/systems/tts-manager.js.
  check_voice_fx = lambda do |fx, fx_path|
    known_fx_presets = ['voice-distortion', 'radio', 'robot']
    if fx.is_a?(String)
      unless known_fx_presets.include?(fx)
        issues << "❌ ERROR: '#{fx_path}' is an unknown voice FX preset '#{fx}'. Use one of: #{known_fx_presets.join(', ')}, or a custom object { highpass, lowpass, drive, ringMod: { frequency, mix }, makeup }."
      end
    elsif fx.is_a?(Hash)
      allowed_fx_keys = ['highpass', 'lowpass', 'drive', 'ringMod', 'makeup']
      unknown_keys = fx.keys - allowed_fx_keys
      unless unknown_keys.empty?
        issues << "⚠️ WARNING: '#{fx_path}' has unrecognised FX key(s): #{unknown_keys.join(', ')}. Recognised keys: #{allowed_fx_keys.join(', ')}."
      end
      ['highpass', 'lowpass', 'drive', 'makeup'].each do |k|
        if fx.key?(k) && !fx[k].is_a?(Numeric)
          issues << "❌ ERROR: '#{fx_path}/#{k}' must be a number."
        end
      end
      ['highpass', 'lowpass'].each do |k|
        if fx[k].is_a?(Numeric) && (fx[k] <= 0 || fx[k] > 20000)
          issues << "⚠️ WARNING: '#{fx_path}/#{k}' = #{fx[k]}Hz is outside the sensible audio range (1–20000Hz)."
        end
      end
      if fx['drive'].is_a?(Numeric) && (fx['drive'] < 0 || fx['drive'] > 100)
        issues << "⚠️ WARNING: '#{fx_path}/drive' = #{fx['drive']} is outside the sensible range (0–100; ~6 subtle, ~20 heavy)."
      end
      if fx.key?('ringMod')
        rm = fx['ringMod']
        if !rm.is_a?(Hash)
          issues << "❌ ERROR: '#{fx_path}/ringMod' must be an object { frequency, mix }."
        else
          if rm.key?('frequency')
            if !rm['frequency'].is_a?(Numeric)
              issues << "❌ ERROR: '#{fx_path}/ringMod/frequency' must be a number (Hz)."
            elsif rm['frequency'] <= 0 || rm['frequency'] > 20000
              issues << "⚠️ WARNING: '#{fx_path}/ringMod/frequency' = #{rm['frequency']}Hz is outside the sensible audio range (1–20000Hz)."
            end
          end
          if rm.key?('mix')
            if !rm['mix'].is_a?(Numeric)
              issues << "❌ ERROR: '#{fx_path}/ringMod/mix' must be a number between 0 and 1."
            elsif rm['mix'] < 0 || rm['mix'] > 1
              issues << "❌ ERROR: '#{fx_path}/ringMod/mix' must be between 0 and 1 (got #{rm['mix']})."
            end
          end
        end
      end
    else
      issues << "❌ ERROR: '#{fx_path}' must be a preset name (string) or a config object { highpass, lowpass, drive, ringMod, makeup }."
    end
  end

  # Player voice may also carry fx
  if json_data['player'].is_a?(Hash) && json_data['player']['voice'].is_a?(Hash) && json_data['player']['voice'].key?('fx')
    check_voice_fx.call(json_data['player']['voice']['fx'], 'player/voice/fx')
  end

  # Recursive helper: check item type and all nested contents/itemsHeld
  # A type is valid if an exact asset file exists, OR if any numbered/variant file starting with
  # that type name exists (e.g. type "safe" is valid when safe1.png, safe2.png etc. exist).
  check_item_type = lambda do |item, item_path, in_contents = false|
    if valid_item_types && item['type']
      t = item['type']
      exact_match = valid_item_types.include?(t)
      variant_match = !exact_match && valid_item_types.any? { |v| v.start_with?(t) }
      # The capture log holder (engine plan section 6) is an engine type: until its own
      # picture exists, an item of that type that names a sprite draws that sprite, so the
      # sprite must be a picture in assets/objects/ (laptop1 until the content plan supplies
      # capture_log.png).
      engine_type = t == 'capture_log' && item['sprite'].is_a?(String) && valid_item_types.include?(item['sprite'])
      # A folder is a desktop-only entry inside a PC or share (container minigame); it has no
      # world sprite, so it needs no picture in assets/objects/. Only a folder nested in a
      # container's contents is exempt: a room-level folder is drawn in the world and needs one.
      engine_type ||= t == 'folder' && in_contents
      engine_type ||= t == 'helpdesk_form' && in_contents
      # The ops log terminal reuses the existing log terminal's sprite (log_filter_terminal.png)
      engine_type ||= t == 'ops_log_terminal'
      unless exact_match || variant_match || engine_type
        issues << "❌ ERROR: '#{item_path}' has type '#{t}' but no matching sprite found at assets/objects/#{t}.png (nor any #{t}*.png variant) — check the spelling or add the asset"
      end
    end
    item['contents']&.each_with_index { |c, i| check_item_type.call(c, "#{item_path}/contents[#{i}]", true) }
    item['itemsHeld']&.each_with_index { |c, i| check_item_type.call(c, "#{item_path}/itemsHeld[#{i}]") }
  end
  start_room_id = json_data['startRoom']
  if json_data.dig('player', 'startRoom')
    issues << "❌ ERROR: 'startRoom' must be a top-level field, not nested under 'player'. Move it to the top level and remove player.startRoom."
  end
  if start_room_id.nil?
    issues << "❌ ERROR: Missing top-level 'startRoom' — every scenario must declare which room the player starts in."
  end

  # Valid directions for room connections
  valid_directions = %w[north south east west]

  # Track features for suggestions
  has_vm_launcher = false
  has_flag_station = false
  has_pc_with_files = false
  has_phone_npc_with_messages = false
  has_phone_npc_with_events = false
  has_opening_cutscene = false
  has_opening_briefing_timed_conversation = false
  has_closing_debrief = false
  mission_ending_phone_candidates = []  # only reported when the mission has no event-driven closing debrief
  has_person_npcs = false
  has_npc_with_waypoints = false
  has_phone_contacts = false
  phone_npcs_without_messages = []
  lock_types_used = Set.new
  has_rfid_lock = false
  has_bluetooth_lock = false
  has_pin_lock = false
  has_password_lock = false
  has_key_lock = false
  has_security_tools = false
  has_container_with_contents = false
  has_readable_items = false
  has_music = json_data.key?('music')
  has_launch_device = false
  has_hostile_npcs = false
  has_global_var_on_ko = false
  has_skip_if_global = false
  has_collection_groups = false
  # For cross-reference checks
  collection_groups_used = Set.new  # collection_group values on items
  target_groups_used = Set.new      # targetGroup values on tasks
  all_npc_ids = Set.new             # all NPC IDs in rooms
  all_room_ids = Set.new            # all room IDs
  all_object_ids = Set.new          # all object IDs with explicit id field
  has_puzzle_graph_metadata = false # true if any object/item has puzzle_graph_unlocks
  puzzle_graph_unlock_targets = []  # [{target: str, path: str}] for post-loop cross-ref
  locked_room_ids = Set.new         # room IDs that are locked (for graph key-coverage analysis)
  locked_objects_info = []          # [{path:, name:, useful:}] locked containers for dead-end check
  vm_launcher_room_ids = Set.new    # room IDs containing a vm-launcher (any variant)
  lockpick_items = []               # [{path:, has_unlocks:}] lockpick items for graph annotation check
  key_locked_targets = []           # [{path:, name:}] all key-lockable things (lockType: 'key') for hint list

  # Collect global variables defined in scenario (needed for cross-reference checks)
  global_variables_defined = Set.new
  if json_data['globalVariables']
    global_variables_defined.merge(json_data['globalVariables'].keys)
  end

  # Collect all valid task IDs from objectives (for taskOnKO and concludeRequires cross-reference)
  all_task_ids = Set.new
  json_data['objectives']&.each do |obj|
    obj['tasks']&.each { |t| all_task_ids.add(t['taskId']) if t['taskId'] }
  end

  # Validate missionConclusion / concludeRequires / conclusionScreen on aims
  mission_conclusion_aims = json_data['objectives']&.select { |a| a['missionConclusion'] } || []
  if mission_conclusion_aims.size > 1
    issues << "❌ ERROR: Multiple aims have missionConclusion:true (#{mission_conclusion_aims.map { |a| a['aimId'] }.join(', ')}). At most one aim per scenario may be the conclusion aim."
  end
  # requiresCompleted was the old ending gate. It is no longer read by anything:
  # concludeRequires replaced it. Flag it so a stale list cannot sit in a
  # scenario looking like it still gates the ending when it gates nothing.
  json_data['objectives']&.each do |aim|
    next unless aim.key?('requiresCompleted')
    issues << "❌ ERROR: objectives/#{aim['aimId']} declares 'requiresCompleted', which no longer gates " \
              "anything. The ending gate is 'concludeRequires': { \"tasksCompleted\": [...] } on the " \
              "missionConclusion aim. Remove requiresCompleted, and move any genuinely required technical " \
              "work into concludeRequires."
  end

  json_data['objectives']&.each do |aim|
    aim_path = "objectives/#{aim['aimId']}"
    next unless aim['missionConclusion']
    if aim['conclusionScreen'].nil?
      issues << "⚠️ WARNING: #{aim_path} has missionConclusion:true but no conclusionScreen — the player will see no end-of-mission overlay. " \
                "Choose one per scenario: { \"type\": \"bond_visualiser\" } for a story mission (the credits, rolled from a music event), " \
                "or { \"type\": \"success\", \"title\": \"...\" } for a short training episode (see the ending convention in README_scenario_design.md)."
    end
    Array(aim.dig('concludeRequires', 'tasksCompleted')).each do |task_id|
      unless all_task_ids.include?(task_id)
        issues << "❌ ERROR: #{aim_path} concludeRequires.tasksCompleted references unknown taskId '#{task_id}'."
      end
    end

    # The ending gate. The client decides when the story is over; concludeRequires
    # is where the scenario declares the technical work the server will not let
    # the story skip. Absent, the client is trusted outright -- fine for a
    # scenario with no VM work, a real hole for one whose whole point is the CTF
    # challenges, since the player could then reach the credits without them.
    conclude_requires = aim['concludeRequires']
    flag_task_ids = []
    json_data['objectives']&.each do |a|
      a['tasks']&.each do |t|
        flag_task_ids << t['taskId'] if t['type'] == 'submit_flags'
      end
    end

    if conclude_requires.nil?
      if flag_task_ids.any?
        issues << "⚠️ WARNING: #{aim_path} has missionConclusion:true but no concludeRequires, while the " \
                  "scenario has #{flag_task_ids.size} submit_flags task(s) (#{flag_task_ids.join(', ')}). " \
                  "The client is therefore trusted to end the mission outright and the player can reach the " \
                  "credits without doing the VM work. A hard block belongs on the large technical " \
                  "achievements -- the VM and CTF work the mission exists to teach -- and nowhere else. Do " \
                  "not list story tasks here: story progress is scored, not gated, and micro-managing it is " \
                  "how a finished run gets stranded short of its own ending. Declare the gate: " \
                  "\"concludeRequires\": { \"tasksCompleted\": [#{flag_task_ids.map { |t| "\"#{t}\"" }.join(', ')}] }."
      else
        issues << "💡 SUGGESTION: #{aim_path} has missionConclusion:true but no concludeRequires, so reaching " \
                  "the end of the story is the whole condition for concluding. That is the right answer for a " \
                  "scenario with no large technical work to gate on -- there is nothing here a player could " \
                  "skip. To say so deliberately rather than by omission, declare an empty gate: " \
                  "\"concludeRequires\": {}."
      end
    else
      unknown_keys = conclude_requires.keys - %w[tasksCompleted globals]
      if unknown_keys.any?
        issues << "❌ ERROR: #{aim_path} concludeRequires has unknown key(s): #{unknown_keys.join(', ')}. " \
                  "Only 'tasksCompleted' and 'globals' are read by the server."
      end

      Array(conclude_requires['tasksCompleted']).each do |task_id|
        unless all_task_ids.include?(task_id)
          issues << "❌ ERROR: #{aim_path} concludeRequires.tasksCompleted references unknown taskId '#{task_id}' " \
                    "— the gate can never be satisfied and the mission will never conclude."
        end
      end

      declared_globals = json_data['globalVariables']&.keys || []
      Array(conclude_requires['globals']).each do |var|
        unless declared_globals.include?(var)
          issues << "❌ ERROR: #{aim_path} concludeRequires.globals references '#{var}', which is not declared in " \
                    "globalVariables — the gate can never be satisfied and the mission will never conclude."
        end
      end

      # A gate listing story tasks is the failure mode this field exists to
      # prevent: it withholds the ending for narrative bookkeeping, which is
      # what stranded a finished m02 run in in_progress forever.
      story_gate_tasks = Array(conclude_requires['tasksCompleted']) - flag_task_ids
      if story_gate_tasks.any?
        issues << "⚠️ WARNING: #{aim_path} concludeRequires.tasksCompleted names non-flag task(s): " \
                  "#{story_gate_tasks.join(', ')}. A hard block should cover the large technical " \
                  "achievements only. Leave story tasks out of the gate: they are already scored " \
                  "proportionally, and a story task with one completion route becomes an unannounced " \
                  "dead end here, with no way for the player to know why the credits never came."
      end

      missing_flag_tasks = flag_task_ids - Array(conclude_requires['tasksCompleted'])
      if missing_flag_tasks.any? && Array(conclude_requires['tasksCompleted']).any?
        issues << "⚠️ WARNING: #{aim_path} concludeRequires.tasksCompleted omits submit_flags task(s): " \
                  "#{missing_flag_tasks.join(', ')}. Those flags can be skipped and the mission will still " \
                  "conclude. Correct for an optional or bonus flag; otherwise add them, since the VM work is " \
                  "exactly what the gate is for."
      end
    end
  end

  # Collect targetGroup values from tasks (for collection_group cross-reference)
  json_data['objectives']&.each do |obj|
    obj['tasks']&.each do |t|
      target_groups_used.add(t['targetGroup']) if t['targetGroup']
    end
  end

  # Helper: recursively scan items (including contents) for collection_groups and object IDs
  scan_item_for_groups = lambda do |item|
    collection_groups_used.add(item['collection_group']) if item['collection_group']
    all_object_ids.add(item['id']) if item['id']
    item['contents']&.each { |c| scan_item_for_groups.call(c) }
    item['itemsHeld']&.each { |c| scan_item_for_groups.call(c) }
  end

  # Check rooms
  if json_data['rooms']
    json_data['rooms'].each do |room_id, room|
      all_room_ids.add(room_id)
      locked_room_ids.add(room_id) if room['locked']
      # Collect NPC IDs and object IDs for cross-reference
      room['npcs']&.each { |npc| all_npc_ids.add(npc['id']) if npc['id'] }
      room['objects']&.each_with_index do |obj, idx|
        scan_item_for_groups.call(obj)

        # Check for old x/y format (deprecated in favor of position object)
        path = "rooms/#{room_id}/objects[#{idx}]"
        if obj['x'] && obj['y'] && !obj['position']
          issues << "❌ ERROR: '#{path}' uses deprecated x/y format. Must use position object: \"position\": { \"x\": #{obj['x']}, \"y\": #{obj['y']} } (optional: add \"elevation\": <value> for z-ordering)"
        end
      end

      # Check for invalid room connection directions (diagonal directions)
      if room['connections']
        room['connections'].each do |direction, target|
          unless valid_directions.include?(direction)
            issues << "❌ ERROR: Room '#{room_id}' uses invalid direction '#{direction}' - only north, south, east, west are valid (not northeast, southeast, etc.)"
          end

          # Check reverse connections if target is a single room
          if target.is_a?(String) && json_data['rooms'][target]
            reverse_dir = case direction
            when 'north' then 'south'
            when 'south' then 'north'
            when 'east' then 'west'
            when 'west' then 'east'
            end
            target_room = json_data['rooms'][target]
            if target_room['connections']
              has_reverse = target_room['connections'].any? do |dir, targets|
                (dir == reverse_dir) && (targets == room_id || (targets.is_a?(Array) && targets.include?(room_id)))
              end
              unless has_reverse
                issues << "⚠️ WARNING: Room '#{room_id}' connects #{direction} to '#{target}', but '#{target}' doesn't connect #{reverse_dir} back - bidirectional connections recommended"
              end
            end
          end
        end
      end

      # Check room objects
      if room['objects']
        room['objects'].each_with_index do |obj, idx|
          path = "rooms/#{room_id}/objects[#{idx}]"

          # Check item type (and all nested contents/itemsHeld) against known asset files
          check_item_type.call(obj, path)

          # Check for incorrect VM launcher configuration (type: "pc" with vmAccess)
          if obj['type'] == 'pc' && obj['vmAccess']
            issues << "❌ ERROR: '#{path}' uses type: 'pc' with vmAccess - should use type: 'vm-launcher' instead. See scenarios/secgen_vm_lab/scenario.json.erb for example"
          end

          # Track VM launchers (including variants: vm-launcher-kali, vm-launcher-desktop)
          if obj['type']&.start_with?('vm-launcher')
            vm_launcher_room_ids.add(room_id)
          end
          if obj['type'] == 'vm-launcher'
            has_vm_launcher = true
            unless obj['vm']
              issues << "⚠️ WARNING: '#{path}' (vm-launcher) missing 'vm' object - use ERB helper vm_object()"
            end
            unless obj.key?('hacktivityMode')
              issues << "⚠️ WARNING: '#{path}' (vm-launcher) missing 'hacktivityMode' field"
            end
          end

          # Track launch-device items
          if obj['type'] == 'launch-device'
            has_launch_device = true
            missing_launch_fields = []
            missing_launch_fields << 'mode' unless obj['mode']
            missing_launch_fields << 'acceptsVms' unless obj['acceptsVms'] && !obj['acceptsVms'].empty?
            missing_launch_fields << 'flags' unless obj['flags'] && !obj['flags'].empty?
            missing_launch_fields << 'onAbort' unless obj['onAbort']
            missing_launch_fields << 'onLaunch' unless obj['onLaunch']
            missing_launch_fields << 'abortConfirmText' unless obj['abortConfirmText']
            missing_launch_fields << 'launchConfirmText' unless obj['launchConfirmText']
            if missing_launch_fields.any?
              issues << "⚠️ WARNING: '#{path}' (launch-device) missing fields: #{missing_launch_fields.join(', ')} — launch-device items require mode, acceptsVms, flags, onAbort/onLaunch handlers, and confirm text for player dialogs. See scenarios/m01_first_contact/scenario.json.erb for reference"
            end
          end

          # Track flag stations
          if obj['type'] == 'flag-station'
            has_flag_station = true
            unless obj['acceptsVms'] && !obj['acceptsVms'].empty?
              issues << "⚠️ WARNING: '#{path}' (flag-station) missing or empty 'acceptsVms' array"
            end
            unless obj['flags']
              issues << "⚠️ WARNING: '#{path}' (flag-station) missing 'flags' array - use ERB helper flags_for_vm()"
            end
          end

          # Check for PC containers with files
          if obj['type'] == 'pc' && obj['contents'] && obj['contents'].any? { |item| item['type'] == 'text_file' || item['readable'] }
            has_pc_with_files = true
          end

          # Track containers with contents (safes, suitcases, bins, PCs, briefcases, etc.)
          container_types_with_contents = %w[safe suitcase bin bin1 pc briefcase bag]
          if container_types_with_contents.include?(obj['type']) && obj['contents'] && !obj['contents'].empty?
            has_container_with_contents = true
          end

          # REQUIRED: Containers with contents must specify locked field explicitly
          container_types = ['briefcase', 'bag', 'bag1', 'suitcase', 'safe', 'pc', 'bin1']
          if container_types.include?(obj['type']) && obj['contents'] && !obj['contents'].empty?
            unless obj.key?('locked')
              issues << "❌ ERROR: '#{path}' is a container with contents but missing required 'locked' field - must be explicitly true or false for server-side validation"
            end

            # Track dead-end locks: locked containers where no content is useful to the player
            if obj['locked']
              clue_types = %w[notes notes2 notes3 notes4 notes5 text_file key lockpick
                              fingerprint_kit rfid_cloner pin-cracker bluetooth_scanner phone]
              useful = obj['contents'].any? { |c| c['takeable'] || c['readable'] || clue_types.include?(c['type']) }
              locked_objects_info << { path: path, name: (obj['name'] || obj['type']), useful: useful }
            end
          end

          # Track readable items (notes, documents)
          if obj['readable'] || (obj['type'] == 'notes' && obj['text'])
            has_readable_items = true
          end

          # Track security tools
          if ['lockpick', 'fingerprint_kit', 'pin-cracker', 'bluetooth_scanner', 'rfid_cloner'].include?(obj['type'])
            has_security_tools = true
          end

          # Track lockpick items for graph annotation check
          if obj['type'] == 'lockpick'
            lockpick_items << { path: path, has_unlocks: !obj['puzzle_graph_unlocks'].nil? }
          end

          # Track lock types
          if obj['locked'] && obj['lockType']
            lock_types_used.add(obj['lockType'])
            case obj['lockType']
            when 'rfid'
              has_rfid_lock = true
            when 'bluetooth'
              has_bluetooth_lock = true
            when 'pin'
              has_pin_lock = true
            when 'password'
              has_password_lock = true
            when 'key'
              has_key_lock = true
              key_locked_targets << { path: path, name: (obj['name'] || obj['type']) }
              # Check for key locks without keyPins (REQUIRED, not recommended)
              unless obj['keyPins']
                issues << "❌ ERROR: '#{path}' has lockType: 'key' but missing required 'keyPins' array - key locks must specify keyPins array for lockpicking minigame"
              end
            end
          end

          # Check for key items without keyPins (REQUIRED, not recommended)
          if obj['type'] == 'key' && !obj['keyPins']
            issues << "❌ ERROR: '#{path}' (key item) missing required 'keyPins' array - key items must specify keyPins array for lockpicking"
          end

          # Cross-reference onRead.setVariable against globalVariables
          if obj['onRead']&.dig('setVariable')
            obj['onRead']['setVariable'].each_key do |var_name|
              unless global_variables_defined.include?(var_name)
                issues << "❌ ERROR: '#{path}/onRead/setVariable' references variable '#{var_name}' not defined in scenario.globalVariables. Add '#{var_name}': false to globalVariables."
              end
            end
          end

          # Cross-reference onPickup.setVariable against globalVariables
          if obj['onPickup']&.dig('setVariable')
            obj['onPickup']['setVariable'].each_key do |var_name|
              unless global_variables_defined.include?(var_name)
                issues << "❌ ERROR: '#{path}/onPickup/setVariable' references variable '#{var_name}' not defined in scenario.globalVariables. Add '#{var_name}': false to globalVariables."
              end
            end
          end

          # Cross-reference onInteract.setVariable against globalVariables
          if obj['onInteract']&.dig('setVariable')
            obj['onInteract']['setVariable'].each_key do |var_name|
              unless global_variables_defined.include?(var_name)
                issues << "❌ ERROR: '#{path}/onInteract/setVariable' references variable '#{var_name}' not defined in scenario.globalVariables. Add '#{var_name}': false to globalVariables."
              end
            end
          end

          # Warn if confirmationText appears at the top level instead of inside onInteract
          if obj['confirmationText']
            issues << "⚠️ WARNING: '#{path}' has top-level 'confirmationText' — move it inside 'onInteract': { \"confirmationText\": \"...\", ... }"
          end

          # Validate onInteract.display value
          valid_display_modes = %w[gameAlert gameDisplay]
          if obj['onInteract']&.key?('display')
            mode = obj['onInteract']['display']
            unless valid_display_modes.include?(mode)
              issues << "❌ ERROR: '#{path}/onInteract/display' has unknown value '#{mode}'. Valid values: #{valid_display_modes.join(', ')}."
            end
          end

          # Held items are matched by '#give_item:<type>[:<selector>]': the type
          # picks the class, the optional selector picks which one when an NPC
          # holds several of that type. 'id' IS the selector (it also becomes
          # data.itemId on item_picked_up), so it is required here, not banned.
          if obj['itemsHeld']
            obj['itemsHeld'].each_with_index do |item, item_idx|
              unless item['type']
                issues << "❌ ERROR: '#{path}/itemsHeld[#{item_idx}]' has no 'type' field - #give_item matches on type."
              end
              # Flag-station rewards live in the station's itemsHeld; their graph edges count too.
              if item['puzzle_graph_unlocks']
                has_puzzle_graph_metadata = true
                Array(item['puzzle_graph_unlocks']).each do |target|
                  next if Array(obj['puzzle_graph_unlocks']).include?(target) # same route as the station itself
                  puzzle_graph_unlock_targets << { target: target, path: "#{path}/itemsHeld[#{item_idx}]", optional: (item['puzzle_graph_optional'] == true) }
                end
              end
            end
          end

          # puzzle_graph_* metadata tracking and suggestions (dungeon graph)
          if obj['puzzle_graph_unlocks']
            has_puzzle_graph_metadata = true
            Array(obj['puzzle_graph_unlocks']).each do |target|
              puzzle_graph_unlock_targets << { target: target, path: path, optional: (obj['puzzle_graph_optional'] == true) }
            end
          end

          # Suggest puzzle_graph_unlocks on clue items inside locked containers
          # Only fire when the container itself is already in the graph (has puzzle_graph_unlocks)
          if obj['locked'] && obj['puzzle_graph_unlocks'] && obj['contents']&.any?
            clue_types = %w[notes text_file phone]
            clue_contents = obj['contents'].select { |c| c['readable'] || clue_types.include?(c['type']) }
            clue_contents.each_with_index do |c, ci|
              c_path = "#{path}/contents[#{ci}] (#{c['type'] || c['name']})"
              if c['puzzle_graph_unlocks']
                has_puzzle_graph_metadata = true
                Array(c['puzzle_graph_unlocks']).each do |target|
                  puzzle_graph_unlock_targets << { target: target, path: c_path, optional: (c['puzzle_graph_optional'] == true) }
                end
              else
                issues << "💡 SUGGESTION: '#{c_path}' is a clue item inside locked container '#{obj['name'] || obj['type']}' but has no 'puzzle_graph_unlocks'. Add puzzle_graph_unlocks: '<lock_or_room_id>' to connect this clue to the dungeon graph (scripts/generate_dungeon_graph.rb)"
              end
            end
          end
        end
      end

      # Track room lock types
      if room['locked'] && room['lockType']
        lock_types_used.add(room['lockType'])
        case room['lockType']
        when 'rfid'
          has_rfid_lock = true
        when 'bluetooth'
          has_bluetooth_lock = true
        when 'pin'
          has_pin_lock = true
        when 'password'
          has_password_lock = true
        when 'key'
          has_key_lock = true
          key_locked_targets << { path: "rooms/#{room_id}", name: (room['name'] || room_id) }
          # Check for key locks without keyPins (REQUIRED, not recommended)
          unless room['keyPins']
            issues << "❌ ERROR: 'rooms/#{room_id}' has lockType: 'key' but missing required 'keyPins' array - key locks must specify keyPins array for lockpicking minigame"
          end
        end
      end

      # Check NPCs in rooms
      if room['npcs']
        room['npcs'].each_with_index do |npc, idx|
          path = "rooms/#{room_id}/npcs[#{idx}]"

          # Validate optional voice FX (Web Audio distortion/filtering applied to this NPC's TTS).
          if npc['voice'].is_a?(Hash) && npc['voice'].key?('fx')
            check_voice_fx.call(npc['voice']['fx'], "#{path}/voice/fx")
          end

          # Track person NPCs
          if npc['npcType'] == 'person' || (!npc['npcType'] && npc['position'])
            has_person_npcs = true

            # Check for waypoints in behavior.patrol
            if npc['behavior'] && npc['behavior']['patrol']
              patrol = npc['behavior']['patrol']
              # Check for single-room waypoints
              if patrol['waypoints'] && !patrol['waypoints'].empty?
                has_npc_with_waypoints = true
              end
              # Check for multi-room route waypoints
              if patrol['route'] && patrol['route'].is_a?(Array) && patrol['route'].any? { |segment| segment['waypoints'] && !segment['waypoints'].empty? }
                has_npc_with_waypoints = true
              end
            end
          end

          # Track hostile NPCs (hostile can be true or a config object)
          if npc['behavior']&.key?('hostile') && npc['behavior']['hostile']
            has_hostile_npcs = true
          end

          # koImmune: the player can't fight or knock out this NPC (npc-hostile.js isNPCKOImmune)
          if npc.key?('koImmune')
            if npc['koImmune'] != true && npc['koImmune'] != false
              issues << "❌ ERROR: '#{path}' koImmune must be true or false (got #{npc['koImmune'].inspect})."
            elsif npc['koImmune'] == true
              dead = %w[taskOnKO globalVarOnKO].select { |k| npc[k] }
              if dead.any?
                issues << "⚠️ WARNING: '#{path}' has koImmune: true, so it can never be knocked out and its #{dead.join(' and ')} never fires. Drop #{dead.length == 1 ? 'it' : 'them'}, or drop koImmune."
              end
              if npc['behavior'].is_a?(Hash) && npc['behavior']['hostile']
                issues << "⚠️ WARNING: '#{path}' has koImmune: true and behavior.hostile: it would attack the player and can't be hit back. Drop one of them."
              end
            end
          end

          # Track and cross-reference globalVarOnKO
          if npc['globalVarOnKO']
            has_global_var_on_ko = true
            var_name = npc['globalVarOnKO']
            unless global_variables_defined.include?(var_name)
              issues << "❌ ERROR: '#{path}' globalVarOnKO references '#{var_name}' which is not defined in scenario.globalVariables. Add '#{var_name}': false to globalVariables."
            end
          end

          # Track and cross-reference taskOnKO
          if npc['taskOnKO']
            task_id = npc['taskOnKO']
            unless all_task_ids.include?(task_id)
              issues << "❌ ERROR: '#{path}' taskOnKO references task '#{task_id}' which does not exist in any objective's tasks. Ensure the taskId is correct."
            end
          end

          # Track timedConversation.skipIfGlobal
          if npc['timedConversation']&.dig('skipIfGlobal')
            has_skip_if_global = true
          end

          # Check for opening cutscene in starting room
          if room_id == start_room_id && npc['timedConversation']
            has_opening_cutscene = true
            if npc['timedConversation']['delay'] == 0 &&
               npc['timedConversation']['waitForEvent'] == 'game_loaded'
              has_opening_briefing_timed_conversation = true
            end
            if npc['timedConversation']['delay'] != 0
              issues << "⚠️ WARNING: '#{path}' timedConversation delay is #{npc['timedConversation']['delay']} - opening cutscenes typically use delay: 0"
            end
          end

          # Validate timedConversation structure
          if npc['timedConversation']
            tc = npc['timedConversation']
            # Check for incorrect property name
            if tc['knot'] && !tc['targetKnot']
              issues << "❌ ERROR: '#{path}' timedConversation uses 'knot' property - should use 'targetKnot' instead. Change 'knot' to 'targetKnot'"
            end
            # Check for missing targetKnot
            unless tc['targetKnot']
              issues << "❌ ERROR: '#{path}' timedConversation missing required 'targetKnot' property - must specify the Ink knot to navigate to"
            end
            # Check for missing delay
            unless tc.key?('delay')
              issues << "⚠️ WARNING: '#{path}' timedConversation missing 'delay' property - should specify delay in milliseconds (0 for immediate)"
            end
          end

          # Validate eventMapping vs eventMappings (parameter name mismatch)
          if npc['eventMapping'] && !npc['eventMappings']
            issues << "❌ ERROR: '#{path}' uses 'eventMapping' (singular) - should use 'eventMappings' (plural). The NPCManager expects 'eventMappings' and won't register event listeners with 'eventMapping'"
          end

          # Validate eventMappings structure
          if npc['eventMappings']
            # Check if it's an array
            unless npc['eventMappings'].is_a?(Array)
              issues << "❌ ERROR: '#{path}' eventMappings is not an array - must be an array of event mapping objects"
            else
              npc['eventMappings'].each_with_index do |mapping, idx|
                mapping_path = "#{path}/eventMappings[#{idx}]"

                # Check for incorrect property name (knot vs targetKnot)
                if mapping['knot'] && !mapping['targetKnot']
                  issues << "❌ ERROR: '#{mapping_path}' uses 'knot' property - should use 'targetKnot' instead. Change 'knot' to 'targetKnot'"
                end

                # Check for missing eventPattern
                unless mapping['eventPattern']
                  issues << "❌ ERROR: '#{mapping_path}' missing required 'eventPattern' property - must specify the event pattern to listen for (e.g., 'global_variable_changed:varName')"
                end

                # For person NPCs only: conversationMode: 'person-chat' requires targetKnot.
                # targetKnot alone (without conversationMode) is also valid — it just updates currentKnot
                # for the next conversation, which is the correct pattern for bark-only event mappings.
                # (phone NPCs have a different pattern — see phone NPC checks below)
                if npc['npcType'] != 'phone' && mapping['conversationMode'] == 'person-chat' && !mapping['targetKnot']
                  issues << "⚠️ WARNING: '#{mapping_path}' has conversationMode: 'person-chat' but no targetKnot - person-chat cutscenes need a targetKnot to know which Ink knot to jump to"
                end

                # Validate patrolOverride structure
                if mapping['patrolOverride']
                  po = mapping['patrolOverride']
                  unless po.is_a?(Hash) && po['targetTile'].is_a?(Hash) &&
                         po['targetTile']['x'].is_a?(Numeric) && po['targetTile']['y'].is_a?(Numeric)
                    issues << "❌ ERROR: '#{mapping_path}/patrolOverride' must have targetTile: {x: number, y: number}"
                  end
                  if po['speed'] && (!po['speed'].is_a?(Numeric) || po['speed'] <= 0)
                    issues << "❌ ERROR: '#{mapping_path}/patrolOverride/speed' must be a positive number"
                  end
                end

                # Validate barkDelay
                if mapping.key?('barkDelay') && (!mapping['barkDelay'].is_a?(Numeric) || mapping['barkDelay'] < 0)
                  issues << "❌ ERROR: '#{mapping_path}/barkDelay' must be a non-negative number (milliseconds)"
                end

                # Validate setPatrolSpeed
                if mapping.key?('setPatrolSpeed') && (!mapping['setPatrolSpeed'].is_a?(Numeric) || mapping['setPatrolSpeed'] <= 0)
                  issues << "❌ ERROR: '#{mapping_path}/setPatrolSpeed' must be a positive number"
                end

                # Validate setDwellMultiplier
                if mapping.key?('setDwellMultiplier') && (!mapping['setDwellMultiplier'].is_a?(Numeric) || mapping['setDwellMultiplier'] <= 0)
                  issues << "❌ ERROR: '#{mapping_path}/setDwellMultiplier' must be a positive number"
                end

                # Phone NPC event mapping anti-patterns
                if npc['npcType'] == 'phone'
                  # Supported event-driven conversation triggers for a phone NPC:
                  #   - "phone-chat": opens the phone texting UI at targetKnot
                  #   - "video-call": opens the person-chat overlay framed as a secure video call
                  #     (see npc-manager.js video-call branch). Both jump straight to targetKnot via
                  #     the minigame's startKnot path, which bypasses saved-state restoration, so
                  #     targetKnot is honoured on an event/onceOnly trigger.
                  phone_trigger_modes = ['phone-chat', 'video-call']
                  phone_chat_trigger = phone_trigger_modes.include?(mapping['conversationMode']) && mapping['targetKnot']

                  # Any conversationMode outside the supported set is not used for phone NPCs.
                  if mapping['conversationMode'] && !phone_trigger_modes.include?(mapping['conversationMode'])
                    issues << "❌ ERROR: '#{mapping_path}' is a phone NPC event mapping with 'conversationMode: \"#{mapping['conversationMode']}\"' — this field is not used for phone NPCs and has no effect. Remove it (supported: 'phone-chat', 'video-call')."
                  end

                  # targetKnot without a supported conversation trigger does NOT work after the first
                  # conversation. After the first open, storyState is restored and currentKnot is bypassed.
                  if mapping['targetKnot'] && !phone_chat_trigger
                    issues << "❌ ERROR: '#{mapping_path}' is a phone NPC event mapping with 'targetKnot' — this does NOT work after the first conversation. Once a storyState is saved, targetKnot is ignored on reopen. Correct pattern: use 'setGlobal' to set a flag, then add a conditional hub option in the Ink story: '+ {flag_var} [Ask about it] -> knot'. Also add 'sendTimedMessage' to notify the player that new content is available."
                  end

                  # NOTE: 'targetKnot' inside sendTimedMessage IS used by the engine
                  # (npc-manager.js hands it to npc-barks.js, which opens the chat at that knot),
                  # so it is deliberately not flagged.

                  # Event mappings that produce no visible effect are likely broken/incomplete.
                  # phone-chat trigger mappings are self-evidently visible (they open the chat), so skip that check.
                  has_effect = phone_chat_trigger || mapping['setGlobal'] || mapping['sendTimedMessage'] ||
                               mapping['completeTask'] || mapping['unlockTask'] || mapping['unlockAim'] ||
                               mapping['unlockDoor'] || mapping['bark'] || mapping['sendEmail']
                  # A mapping retired in place (a "Retired ..." _comment and a condition that can never be
                  # true) is an inert slot kept so later mappings keep their once-only index: not a defect.
                  retired_slot = mapping['_comment'].to_s.start_with?('Retired') &&
                                 mapping['condition'].to_s.include?('retired_')
                  unless has_effect || retired_slot
                    issues << "⚠️ WARNING: '#{mapping_path}' is a phone NPC event mapping with no visible effect (no setGlobal, sendTimedMessage, completeTask, unlockTask, unlockAim, unlockDoor, bark or phone-chat trigger). Use 'sendTimedMessage' to notify the player, and 'setGlobal' to flag that a new hub option is available. Example: { \"eventPattern\": \"...\", \"onceOnly\": true, \"setGlobal\": { \"flag_var\": true }, \"sendTimedMessage\": { \"delay\": 1000, \"message\": \"...\" } }"
                  end
                end
              end
            end
          end

          # Track phone NPCs (phone contacts)
          if npc['npcType'] == 'phone'
            has_phone_contacts = true

            # Validate phone NPC structure - should have phoneId
            unless npc['phoneId']
              issues << "❌ ERROR: '#{path}' (phone NPC) missing required 'phoneId' field - phone NPCs must specify which phone they appear on (e.g., 'player_phone')"
            end

            # Validate phone NPC structure - should have storyPath
            unless npc['storyPath']
              issues << "❌ ERROR: '#{path}' (phone NPC) missing required 'storyPath' field - phone NPCs must have a path to their Ink story JSON file"
            end

            # Validate phone NPC structure - should NOT have position (phone NPCs don't have positions)
            if npc['position']
              issues << "⚠️ WARNING: '#{path}' (phone NPC) has 'position' field - phone NPCs should NOT have position (they're not in-world sprites). Remove the position field."
            end

            # Validate phone NPC structure - should NOT have spriteSheet (phone NPCs don't have sprites)
            if npc['spriteSheet']
              issues << "⚠️ WARNING: '#{path}' (phone NPC) has 'spriteSheet' field - phone NPCs should NOT have spriteSheet (they're not in-world sprites). Remove the spriteSheet field."
            end

            # Validate timedMessages structure for phone NPCs
            if npc['timedMessages']
              unless npc['timedMessages'].is_a?(Array)
                issues << "❌ ERROR: '#{path}' timedMessages is not an array - must be an array of timed message objects"
              else
                npc['timedMessages'].each_with_index do |msg, idx|
                  msg_path = "#{path}/timedMessages[#{idx}]"

                  # Check for missing message field
                  unless msg['message']
                    issues << "❌ ERROR: '#{msg_path}' missing required 'message' field - must specify the text content of the message"
                  end

                  # Check for incorrect property name (text vs message)
                  if msg['text'] && !msg['message']
                    issues << "❌ ERROR: '#{msg_path}' uses 'text' property - should use 'message' instead. The NPCManager reads msg.message, not msg.text"
                  end

                  # Check for missing delay field
                  unless msg.key?('delay')
                    issues << "⚠️ WARNING: '#{msg_path}' missing 'delay' property - should specify delay in milliseconds (0 for immediate)"
                  end

                  # Check for incorrect property name (knot vs targetKnot) in timed messages
                  if msg['knot'] && !msg['targetKnot']
                    issues << "❌ ERROR: '#{msg_path}' uses 'knot' property - should use 'targetKnot' instead. Change 'knot' to 'targetKnot'"
                  end
                end
              end
            end

            # Track phone NPCs with messages in rooms
            if npc['timedMessages'] && !npc['timedMessages'].empty?
              has_phone_npc_with_messages = true
            else
              # Track phone NPCs without timed messages
              phone_npcs_without_messages << "#{path} (#{npc['displayName'] || npc['id']})"
            end

            # Track phone NPCs with event mappings in rooms
            if npc['eventMappings'] && !npc['eventMappings'].empty?
              has_phone_npc_with_events = true
            end
          end

          # '#give_item:<type>[:<selector>]' matches on type, then on the optional
          # selector (id / key_id / name). 'id' on a held item IS that selector,
          # so it is expected here. What breaks play is several items of one type
          # with no way to tell them apart -- the first one always wins.
          if npc['itemsHeld']
            npc['itemsHeld'].each_with_index do |item, item_idx|
              unless item['type']
                issues << "❌ ERROR: '#{path}/itemsHeld[#{item_idx}]' has no 'type' field - #give_item matches on type."
              end

              # Check item type against known asset files
              check_item_type.call(item, "#{path}/itemsHeld[#{item_idx}]")

              # Track security tools in NPC itemsHeld
              if ['lockpick', 'fingerprint_kit', 'pin-cracker', 'bluetooth_scanner', 'rfid_cloner'].include?(item['type'])
                has_security_tools = true
              end

              # Track lockpick items in NPC itemsHeld for graph annotation check
              if item['type'] == 'lockpick'
                lockpick_items << { path: "#{path}/itemsHeld[#{item_idx}]", has_unlocks: !item['puzzle_graph_unlocks'].nil? }
              end

              # Track launch-device in NPC itemsHeld
              has_launch_device = true if item['type'] == 'launch-device'

              # Track puzzle_graph_unlocks on NPC-held items (e.g., Sarah's key chain)
              if item['puzzle_graph_unlocks']
                has_puzzle_graph_metadata = true
                Array(item['puzzle_graph_unlocks']).each do |target|
                  puzzle_graph_unlock_targets << { target: target, path: "#{path}/itemsHeld[#{item_idx}]", optional: (item['puzzle_graph_optional'] == true) }
                end
              end
            end
          end
        end
      end
    end
  end

  # Declared grants and their contents need sprites too (declared grants plan R2 M1)
  BreakEscape::DeclaredGrants.for(json_data).each do |grant|
    check_item_type.call(grant['item'], "#{grant['path']}/item")
  end

  # Check startItemsInInventory for security tools and readable items
  if json_data['startItemsInInventory']
    json_data['startItemsInInventory'].each_with_index do |item, idx|
      check_item_type.call(item, "startItemsInInventory[#{idx}]")
      # Track security tools
      if ['lockpick', 'fingerprint_kit', 'pin-cracker', 'bluetooth_scanner', 'rfid_cloner'].include?(item['type'])
        has_security_tools = true
      end

      # Track lockpick items in startItemsInInventory for graph annotation check
      if item['type'] == 'lockpick'
        lockpick_items << { path: "startItemsInInventory[#{idx}]", has_unlocks: !item['puzzle_graph_unlocks'].nil? }
      end

      # Starting items with puzzle_graph_unlocks are valid graph sources (e.g. a
      # starting lockpick that opens locked rooms). Register their targets so locked
      # rooms they open are not reported as missing an inbound graph edge.
      if item['puzzle_graph_unlocks']
        has_puzzle_graph_metadata = true
        Array(item['puzzle_graph_unlocks']).each do |target|
          puzzle_graph_unlock_targets << { target: target, path: "startItemsInInventory[#{idx}]", optional: (item['puzzle_graph_optional'] == true) }
        end
      end

      # Track readable items
      if item['readable'] || (item['type'] == 'notes' && item['text'])
        has_readable_items = true
      end
    end
  end

  # Headless NPC records (social.characters.*.emailRecord) are phone NPCs with no
  # room: the same phoneId and storyPath checks as a room phone NPC. They are not
  # phone contacts, so the phone-contact suggestions leave them out.
  headless_npc_records(json_data).each do |npc, path|
    all_npc_ids.add(npc['id'])
    unless npc['phoneId']
      issues << "❌ ERROR: '#{path}' (phone NPC) missing required 'phoneId' field - phone NPCs must specify which phone they appear on (e.g., 'player_phone')"
    end
    unless npc['storyPath']
      issues << "❌ ERROR: '#{path}' (headless NPC record) missing required 'storyPath' field - a headless record must have a path to its Ink story JSON file"
    end
  end

  # Check phoneNPCs section - this is the OLD/INCORRECT format
  if json_data['phoneNPCs']
    json_data['phoneNPCs'].each_with_index do |npc, idx|
      path = "phoneNPCs[#{idx}]"

      # Flag incorrect structure - phone NPCs should be in rooms, not phoneNPCs section
      issues << "❌ ERROR: '#{path}' - Phone NPCs should be defined in 'rooms/{room_id}/npcs[]' arrays, NOT in a separate 'phoneNPCs' section. See scenarios/npc-sprite-test3/scenario.json.erb for correct format. Phone NPCs should be in the starting room (or room where phone is accessible) with npcType: 'phone'"

      # Track phone NPCs (phone contacts) - but note they're in wrong location
      has_phone_contacts = true

      # Track phone NPCs with messages
      if npc['timedMessages'] && !npc['timedMessages'].empty?
        has_phone_npc_with_messages = true
      else
        # Track phone NPCs without timed messages
        phone_npcs_without_messages << "#{path} (#{npc['displayName'] || npc['id']})"
      end

      # Track phone NPCs with event mappings (for closing debriefs)
      if npc['eventMappings'] && !npc['eventMappings'].any? { |m| m['eventPattern']&.include?('global_variable_changed') }
        has_phone_npc_with_events = true
      end

      # Check for closing debrief trigger
      if npc['eventMappings']
        npc['eventMappings'].each do |mapping|
          if mapping['eventPattern']&.include?('global_variable_changed')
            has_closing_debrief = true
          end
        end
      end
    end
  end

  # Check for event-driven cutscene architecture patterns
  person_npcs_with_event_cutscenes = []
  global_variables_referenced = Set.new
  # global_variables_defined already populated above

  # Check all NPCs for event-driven cutscene patterns
  json_data['rooms']&.each do |room_id, room|
    room['npcs']&.each_with_index do |npc, idx|
      path = "rooms/#{room_id}/npcs[#{idx}]"

      # Check for person NPCs with eventMappings (cutscene NPCs)
      if npc['npcType'] == 'person' && npc['eventMappings']
        npc['eventMappings'].each_with_index do |mapping, mapping_idx|
          mapping_path = "#{path}/eventMappings[#{mapping_idx}]"

          # Check if this is a cutscene trigger (has conversationMode)
          if mapping['conversationMode'] == 'person-chat'
            person_npcs_with_event_cutscenes << {
              npc_id: npc['id'],
              path: path,
              mapping: mapping
            }

            # Extract global variable name from event pattern
            if mapping['eventPattern']&.match(/global_variable_changed:(\w+)/)
              var_name = $1
              global_variables_referenced << var_name

              # Check if the global variable is defined
              unless global_variables_defined.include?(var_name)
                issues << "❌ ERROR: '#{mapping_path}' references global variable '#{var_name}' in eventPattern, but it's not defined in scenario.globalVariables. Add '#{var_name}' with an initial value (typically false) to globalVariables"
              end
            end

            # Check for missing spriteTalk when using non-numeric frame sprites.
            # The engine falls back to '{spriteSheet}_talk.png' (then '_headshot.png'),
            # so only warn when neither derived file actually exists.
            if !npc['spriteTalk'] && npc['spriteSheet']
              # Sprites with named frames (not numeric indices) need a portrait image
              named_frame_sprites = ['female_spy', 'agent_hax', 'male_spy', 'female_hacker_hood', 'male_doctor']
              if named_frame_sprites.include?(npc['spriteSheet'])
                chars_dir = File.join(File.expand_path('..', __dir__), 'public/break_escape/assets/characters')
                derived = ["#{npc['spriteSheet']}_talk.png", "#{npc['spriteSheet']}_headshot.png"]
                unless derived.any? { |f| File.exist?(File.join(chars_dir, f)) }
                  issues << "⚠️ WARNING: '#{path}' uses spriteSheet '#{npc['spriteSheet']}' which has named frames, but no 'spriteTalk' property and no derived portrait ('assets/characters/#{derived[0]}' or '#{derived[1]}'). Person-chat cutscenes will show frame errors. Add one of those images, or a 'spriteTalk' property pointing to a portrait"
                end
              end
            end

            # Validate background for person-chat cutscenes. The engine falls back to the
            # room's chatBackground (person-chat-background.js), so that counts too.
            unless mapping['background'] || room['chatBackground']
              issues << "⚠️ WARNING: '#{mapping_path}' is a person-chat cutscene but has no 'background' property. Person-chat cutscenes should have a background image for better visual presentation (e.g., 'assets/backgrounds/hq1.png')"
            end

            # Check for onceOnly to prevent repeated cutscenes
            unless mapping['onceOnly']
              issues << "⚠️ WARNING: '#{mapping_path}' is a person-chat cutscene without 'onceOnly: true'. Cutscenes typically should only trigger once. Add 'onceOnly: true' unless you want the cutscene to repeat"
            end
          end
        end
      end

      # Check for phone NPCs setting global variables in their stories
      if npc['npcType'] == 'phone' && npc['storyPath']
        if npc['eventMappings']
          # Only flag if an eventMapping's sendTimedMessage looks like a cutscene trigger
          # (has targetKnot or conversationMode), not standard hint messages
          cutscene_event_mappings = npc['eventMappings'].select do |m|
            m['sendTimedMessage']&.key?('targetKnot') || m['sendTimedMessage']&.key?('conversationMode')
          end
          if cutscene_event_mappings.any?
            mission_ending_phone_candidates << "💡 BEST PRACTICE: '#{path}' appears to be a mission-ending phone NPC with sendTimedMessage. Consider using event-driven cutscene architecture instead: 1) Add #set_global:variable_name:true tag in Ink story, 2) Add #exit_conversation tag to close phone, 3) Create separate person NPC with eventMapping listening for global_variable_changed:variable_name. See scenarios/m01_first_contact/scenario.json.erb for reference implementation"
          end
        end
      end
    end
  end

  # The same phone-globals check for headless records (social.characters.*.emailRecord)
  headless_npc_records(json_data).each do |npc, path|
    next unless npc['storyPath'] && npc['eventMappings'].is_a?(Array)

    cutscene_event_mappings = npc['eventMappings'].select do |m|
      m['sendTimedMessage']&.key?('targetKnot') || m['sendTimedMessage']&.key?('conversationMode')
    end
    if cutscene_event_mappings.any?
      mission_ending_phone_candidates << "💡 BEST PRACTICE: '#{path}' appears to be a mission-ending phone NPC with sendTimedMessage. Consider using event-driven cutscene architecture instead: 1) Add #set_global:variable_name:true tag in Ink story, 2) Add #exit_conversation tag to close phone, 3) Create separate person NPC with eventMapping listening for global_variable_changed:variable_name. See scenarios/m01_first_contact/scenario.json.erb for reference implementation"
    end
  end

  # Detect closing debrief: a person NPC with a person-chat eventMapping that is NOT the
  # opening cutscene (i.e. uses eventPattern, not timedConversation). m01 pattern: person NPC
  # with behavior.initiallyHidden: true listening for a global_variable_changed event.
  if person_npcs_with_event_cutscenes.any?
    has_closing_debrief = true
  end

  # Also detect closing debrief from room NPCs with global_variable_changed eventPatterns
  # (catches the pattern even if conversationMode is absent)
  unless has_closing_debrief
    json_data['rooms']&.each do |room_id, room|
      room['npcs']&.each do |npc|
        next unless npc['npcType'] == 'person' && npc['eventMappings']
        next unless npc['behavior']&.dig('initiallyHidden')
        if npc['eventMappings'].any? { |m| m['eventPattern']&.include?('global_variable_changed') }
          has_closing_debrief = true
          break
        end
      end
      break if has_closing_debrief
    end
  end

  issues.concat(mission_ending_phone_candidates) unless has_closing_debrief

  # Check for orphaned global variable references
  orphaned_vars = global_variables_referenced - global_variables_defined
  orphaned_vars.each do |var_name|
    issues << "❌ ERROR: Global variable '#{var_name}' is referenced in eventPatterns but not defined in scenario.globalVariables. Add '#{var_name}' to globalVariables with an initial value (typically false for cutscene triggers)"
  end

  # Cross-reference task targetGroup against item collection_groups
  target_groups_used.each do |group|
    unless collection_groups_used.include?(group)
      issues << "❌ ERROR: Task uses targetGroup '#{group}' but no items have collection_group: '#{group}'. Add collection_group: '#{group}' to the relevant items."
    end
  end
  orphaned_groups = collection_groups_used - target_groups_used
  orphaned_groups.each do |group|
    issues << "⚠️ WARNING: Items use collection_group '#{group}' but no task has targetGroup: '#{group}'. Add a task with targetGroup: '#{group}' to track collection progress."
  end

  # Cross-reference task targetNPC, targetRoom, targetObject
  json_data['objectives']&.each_with_index do |obj, oi|
    obj['tasks']&.each_with_index do |task, ti|
      task_path = "objectives[#{oi}]/tasks[#{ti}] (#{task['taskId']})"
      if task['targetNPC'] && !all_npc_ids.include?(task['targetNPC'])
        issues << "❌ ERROR: #{task_path} references targetNPC '#{task['targetNPC']}' which does not exist in any room. Check the NPC id."
      end
      if task['targetRoom'] && !all_room_ids.include?(task['targetRoom'])
        issues << "❌ ERROR: #{task_path} references targetRoom '#{task['targetRoom']}' which is not a defined room."
      end
      if task['targetObject'] && !all_object_ids.include?(task['targetObject'])
        issues << "⚠️ WARNING: #{task_path} references targetObject '#{task['targetObject']}' but no object with that id was found. Ensure the object has an explicit 'id' field matching '#{task['targetObject']}'."
      end

      # A submit_flags task with no targetFlags/targetCount has nothing to match a
      # submission against, so it can never complete. That silently strands its aim —
      # and if the aim gates the mission-conclusion aim, the scenario becomes
      # unfinishable in a way nothing else in this validator would catch.
      if task['type'] == 'submit_flags'
        flags = task['targetFlags']
        if !flags.is_a?(Array) || flags.empty?
          issues << "❌ ERROR: #{task_path} is type 'submit_flags' but has no 'targetFlags' array. " \
                    "The task can never complete. Add \"targetFlags\": [\"<vm_name>:flag_1\"] and " \
                    "\"targetCount\": 1. See scenarios/m01_first_contact/scenario.json.erb."
        elsif !task['targetCount'].is_a?(Integer) || task['targetCount'] < 1
          issues << "❌ ERROR: #{task_path} (submit_flags) has targetFlags but no valid 'targetCount'. " \
                    "Add \"targetCount\": #{flags.size}."
        end
      end

      # Suggest puzzle_graph_unlocks on submit_flags tasks that gate further progress
      if task['type'] == 'submit_flags' && !task['puzzle_graph_unlocks'] && task['onComplete']
        issues << "💡 SUGGESTION: #{task_path} (submit_flags) has no 'puzzle_graph_unlocks'. Add puzzle_graph_unlocks: '<flag_node_id>' to connect flag submission to the dungeon graph (scripts/generate_dungeon_graph.rb)"
      elsif task['puzzle_graph_unlocks']
        has_puzzle_graph_metadata = true
      end
    end
  end

  # Check music section
  if json_data['music']
    music_events = json_data['music']['events'] || []
    music_events.each_with_index do |event, idx|
      music_path = "music/events[#{idx}]"
      issues.concat(credits_outcome_issues(event, music_path)) if event.is_a?(Hash)
      next unless event['trigger']
      if (m = event['trigger'].match(/^conversation_closed:(.+)$/))
        npc_id = m[1]
        unless all_npc_ids.include?(npc_id)
          issues << "⚠️ WARNING: '#{music_path}' trigger references NPC '#{npc_id}' via conversation_closed but that NPC id was not found in any room."
        end
      elsif (m = event['trigger'].match(/^global_variable_changed:(.+)$/))
        var_name = m[1]
        unless global_variables_defined.include?(var_name)
          issues << "⚠️ WARNING: '#{music_path}' trigger references global variable '#{var_name}' via global_variable_changed but it is not defined in scenario.globalVariables."
        end
      end
    end
  end

  # Cross-reference puzzle_graph_unlocks targets against known room/object IDs
  puzzle_graph_unlock_targets.each do |entry|
    target = entry[:target]
    entry_path = entry[:path]
    # Only warn for targets that don't look like lock IDs and aren't known rooms/objects
    unless target.start_with?('lock_') || all_room_ids.include?(target) || all_object_ids.include?(target)
      issues << "⚠️ WARNING: '#{entry_path}' has puzzle_graph_unlocks: '#{target}' which is not a known room ID or object ID and doesn't look like a lock ID (lock_*). Verify this target is correct."
    end
  end

  # Graph structural analysis (when puzzle_graph metadata exists)
  if has_puzzle_graph_metadata && puzzle_graph_unlock_targets.any?
    # Count inbound edges per target — exclude optional paths
    target_counts = Hash.new(0)
    puzzle_graph_unlock_targets.each { |e| target_counts[e[:target]] += 1 unless e[:optional] }

    # Multiple solutions: more than one mandatory item unlocks the same target
    target_counts.each do |target, count|
      next if count < 2
      sources = puzzle_graph_unlock_targets.select { |e| e[:target] == target && !e[:optional] }.map { |e| e[:path] }
      issues << "⚠️ WARNING: #{count} items all point to the same unlock target '#{target}' — multiple solution paths exist. Sources: [#{sources.join(', ')}]. If one path is intentionally optional, add puzzle_graph_optional: true to that item. Otherwise this may allow players to bypass a challenge."
    end

    # Locked rooms with no inbound graph edge: the key for this door isn't mapped
    graph_targets = Set.new(puzzle_graph_unlock_targets.map { |e| e[:target] })
    locked_room_ids.each do |room_id|
      # Locked rooms can be targeted as room_id (door node) in puzzle_graph_unlocks
      unless graph_targets.include?(room_id)
        issues << "⚠️ WARNING: Room '#{room_id}' is locked but nothing has puzzle_graph_unlocks: '#{room_id}' — the key or clue for this door is not mapped in the dungeon graph. Add puzzle_graph_unlocks: '#{room_id}' to the item that provides access (key, PIN note, keycard, etc.)."
      end
    end
  end

  # Dead-end locks: locked containers where no content is useful
  locked_objects_info.each do |info|
    next if info[:useful]
    issues << "⚠️ WARNING: '#{info[:path]}' is locked ('#{info[:name]}') but contains no takeable items, readable notes, or clue objects — players have no reward for solving this lock. Add useful contents or remove the lock (set locked: false)."
  end

  # Lockpick items without puzzle_graph_unlocks
  unannotated_lockpicks = lockpick_items.reject { |lp| lp[:has_unlocks] }
  if unannotated_lockpicks.any?
    hint_list = key_locked_targets.map { |t| "'#{t[:path]}' (#{t[:name]})" }.join(', ')
    hint_list = hint_list.empty? ? 'none found' : hint_list
    unannotated_lockpicks.each do |lp|
      issues << "⚠️ WARNING: '#{lp[:path]}' is a lockpick but has no 'puzzle_graph_unlocks' — the dungeon graph won't show what it opens. Add puzzle_graph_unlocks: '<target>' (or an array). Key-locked targets in this scenario: #{hint_list}"
    end
  end

  # Check for submit_flags bypass: aims where VM flag tasks can be skipped
  json_data['objectives']&.each_with_index do |aim, oi|
    next unless aim['tasks']
    flag_tasks = aim['tasks'].select { |t| t['type'] == 'submit_flags' }
    next if flag_tasks.empty?
    # Non-flag tasks in the same aim that advance the scenario via onComplete
    bypass_tasks = aim['tasks'].reject { |t| t['type'] == 'submit_flags' }.select do |t|
      t.dig('onComplete', 'unlockAim') || t.dig('onComplete', 'unlockTask') || t.dig('onComplete', 'completeTask')
    end
    if bypass_tasks.any?
      task_ids = bypass_tasks.map { |t| t['taskId'] }.join(', ')
      aim_path = "objectives[#{oi}] (#{aim['aimId']})"
      issues << "⚠️ WARNING: #{aim_path} contains submit_flags task(s) but non-flag tasks [#{task_ids}] also have onComplete actions — players may advance the scenario without submitting VM flags. If VM completion is mandatory for this aim, ensure non-flag tasks do not independently unlock subsequent aims or tasks."
    end
  end

  # VM launcher reachability: technical challenge accessible without any physical lock
  vm_launcher_room_ids.each do |room_id|
    unless locked_room_ids.include?(room_id)
      issues << "💡 SUGGESTION: Room '#{room_id}' contains a VM launcher but the room itself is not locked — the technical challenge has no physical access barrier. Consider adding a door lock (rfid, key, or pin) to require players to gain physical access first, reinforcing the layered access control learning objective."
    end
  end

  # Provide best practice guidance for event-driven cutscenes
  if person_npcs_with_event_cutscenes.any?
    issues << "✅ GOOD PRACTICE: Scenario uses event-driven cutscene architecture with #{person_npcs_with_event_cutscenes.size} person-chat cutscene(s). Ensure corresponding phone NPCs use #set_global tags to trigger these cutscenes"
  end

  # Good practice confirmations
  if has_global_var_on_ko
    issues << "✅ GOOD PRACTICE: Scenario uses globalVarOnKO on NPCs — global variables are set when NPCs are knocked out, enabling event-driven story progression. Ensure all referenced variables are in globalVariables."
  end

  if has_skip_if_global
    issues << "✅ GOOD PRACTICE: Scenario uses timedConversation.skipIfGlobal — the opening briefing will not replay when the player resumes the scenario."
  end

  # "once" is fine too: the engine holds the popup until the opening cutscene has closed
  # (helpers.js showBriefWhenClear) and records it, so a reload doesn't reopen it.
  if has_opening_briefing_timed_conversation && !%w[on_resume once].include?(json_data['show_scenario_brief'])
    issues << "⚠️ WARNING: Scenario has a start-room opening timedConversation briefing (delay: 0 + waitForEvent: 'game_loaded') but show_scenario_brief is '#{json_data['show_scenario_brief'] || 'missing'}'. Set 'show_scenario_brief': 'on_resume' (brief only on resume) or 'once' (brief once, after the opening, never again) so the scenario brief does not pop up on every load."
  end

  if collection_groups_used.any? && (collection_groups_used & target_groups_used).any?
    issues << "✅ GOOD PRACTICE: Scenario uses collection_group on items with matching task targetGroup — item collection progress is tracked correctly."
  end

  if has_music
    issues << "✅ GOOD PRACTICE: Scenario uses the music system — dynamic music changes based on in-game events significantly enhance immersion."
  end

  if has_launch_device
    issues << "✅ GOOD PRACTICE: Scenario uses a launch-device — this is a high-stakes interactive prop used for the mission climax. See scenarios/m01_first_contact/scenario.json.erb (derek_office) for a complete reference implementation."
  end

  if has_hostile_npcs
    issues << "✅ GOOD PRACTICE: Scenario uses hostile NPCs — this adds physical challenge and urgency. Ensure hostile NPCs have behavior.chaseSpeed, attackDamage, and pauseToAttack configured."
  end

  # Feature suggestions
  unless has_vm_launcher
    issues << "💡 SUGGESTION: Consider adding VM launcher terminals (type: 'vm-launcher') for hacking challenges. See scenarios/m01_first_contact/scenario.json.erb (server_room) for example"
  end

  unless has_flag_station
    issues << "💡 SUGGESTION: Consider adding flag station terminals (type: 'flag-station') for VM flag submission. See scenarios/m01_first_contact/scenario.json.erb (server_room) for example"
  end

  unless has_pc_with_files
    issues << "💡 SUGGESTION: Consider adding at least one PC container (type: 'pc') with files (type: 'text_file') in 'contents' array. Use collection_group on files and a matching targetGroup task to track reading progress. See scenarios/m01_first_contact/scenario.json.erb (it_room/kevin_office) for example"
  end

  unless has_phone_npc_with_messages || has_phone_npc_with_events
    issues << "💡 SUGGESTION: Consider adding at least one phone NPC (npcType: 'phone') with timedMessages and eventMappings. Phone NPCs are contacts in the player's phone that send messages, respond to events, and drive narrative. See scenarios/m01_first_contact/scenario.json.erb (agent_0x99) for a full example"
  end

  unless has_opening_cutscene
    issues << "💡 SUGGESTION: Consider adding an opening briefing cutscene — a person NPC with timedConversation (delay: 0, targetKnot: '...', waitForEvent: 'game_loaded', skipIfGlobal: 'briefing_played', setGlobalOnStart: 'briefing_played') in the starting room. See scenarios/m01_first_contact/scenario.json.erb (briefing_cutscene) for example"
  end

  unless has_closing_debrief
    issues << "💡 SUGGESTION: Consider adding event-driven closing debrief cutscene using this architecture:"
    issues << "   1. Add global variable to scenario.globalVariables (e.g., 'start_debrief_cutscene': false)"
    issues << "   2. In phone NPC's Ink story, add tags: #set_global:start_debrief_cutscene:true and #exit_conversation"
    issues << "   3. Create person NPC with eventMappings: [{eventPattern: 'global_variable_changed:start_debrief_cutscene', condition: 'value === true', conversationMode: 'person-chat', targetKnot: 'start', background: 'assets/backgrounds/hq1.png', onceOnly: true}]"
    issues << "   4. Add behavior: {initiallyHidden: true} to person NPC so it doesn't appear in-world"
    issues << "   See scenarios/m01_first_contact/scenario.json.erb (closing_debrief_person) for complete reference implementation"
  end

  # Check for NPCs without waypoints
  if has_person_npcs && !has_npc_with_waypoints
    issues << "💡 SUGGESTION: Consider adding patrol waypoints to at least one person NPC for dynamic movement. Add behavior.patrol.waypoints array with {x, y} coordinates, or behavior.patrol.route for multi-room patrols. See scenarios/m01_first_contact/scenario.json.erb for NPCs with hostile behavior and movement."
  end

  # Check for phone contacts without timed messages
  if has_phone_contacts && !phone_npcs_without_messages.empty?
    npc_list = phone_npcs_without_messages.join(', ')
    issues << "💡 SUGGESTION: Consider adding timedMessages to phone contacts for narrative delivery — timed messages drive the story forward at key moments. Phone NPCs without timed messages: #{npc_list}. See scenarios/m01_first_contact/scenario.json.erb (agent_0x99) for example"
  end

  # Suggest variety in lock types
  if lock_types_used.size < 2
    issues << "💡 SUGGESTION: Consider adding variety in lock types — scenarios typically use 3+ different mechanisms (key, pin, rfid, password, flag). Currently using: #{lock_types_used.to_a.join(', ').then { |s| s.empty? ? 'none' : s }}. m01 uses all five lock types: key (doors/briefcases), pin (safes/cabinets), rfid (server room), password (computers), flag (encrypted archive). See scenarios/m01_first_contact/scenario.json.erb for examples"
  end

  # Suggest RFID locks
  unless has_rfid_lock
    issues << "💡 SUGGESTION: Consider adding RFID locks (lockType: 'rfid') for high-security areas. Requires an rfid_cloner tool and an NPC or item with a card_id. See scenarios/m01_first_contact/scenario.json.erb (server_room) for example"
  end

  # Suggest PIN locks
  unless has_pin_lock
    issues << "💡 SUGGESTION: Consider adding PIN locks (lockType: 'pin') for safes, cabinets, and doors — PIN codes are found as clues elsewhere in the scenario. See scenarios/m01_first_contact/scenario.json.erb (storage_safe, filing cabinets) for examples"
  end

  # Suggest password locks
  unless has_password_lock
    issues << "💡 SUGGESTION: Consider adding password locks (lockType: 'password') for computers and workstations — passwords are discovered through investigation. See scenarios/m01_first_contact/scenario.json.erb (derek_computer, kevin workstation) for examples"
  end

  # Suggest security tools
  unless has_security_tools
    issues << "💡 SUGGESTION: Consider adding security tools (lockpick, fingerprint_kit, pin-cracker, bluetooth_scanner, rfid_cloner) for interactive gameplay. In m01, a lockpick is held by kevin_park and obtained by defeating him, enabling key-locked doors. See scenarios/m01_first_contact/scenario.json.erb for examples"
  end

  # Suggest containers with contents
  unless has_container_with_contents
    issues << "💡 SUGGESTION: Consider adding containers (safe, bin, pc, briefcase, suitcase) with contents for hidden items and layered puzzle design. In m01, multiple safes and bins contain key evidence items. See scenarios/m01_first_contact/scenario.json.erb for examples"
  end

  # Suggest readable items
  unless has_readable_items
    issues << "💡 SUGGESTION: Consider adding readable items (notes, notes2, notes5, text_file) for storytelling and clues. Readable items with onRead.setVariable can trigger story events when a player reads them. See scenarios/m01_first_contact/scenario.json.erb for examples"
  end

  # Suggest music system
  unless has_music
    issues << "💡 SUGGESTION: Consider adding a 'music' section with events array to drive dynamic music changes. In m01, music changes when the briefing ends, when a threat is revealed, and when the debrief begins. See scenarios/m01_first_contact/scenario.json.erb for example"
  end

  # Suggest hostile NPCs
  unless has_hostile_npcs
    issues << "💡 SUGGESTION: Consider adding at least one hostile NPC (behavior: { hostile: true }) to create physical danger and tension. In m01, sarah_martinez, derek_lawson, and kevin_park are all hostile. See scenarios/m01_first_contact/scenario.json.erb for examples"
  end

  # Dungeon graph metadata
  if has_puzzle_graph_metadata
    issues << "✅ GOOD PRACTICE: Scenario uses puzzle_graph_* metadata — run 'ruby scripts/generate_dungeon_graph.rb scenarios/my_scenario/scenario.json.erb' to generate an interactive puzzle dependency graph."
  else
    issues << "💡 SUGGESTION: Consider adding puzzle_graph_unlocks to key items (clue notes inside locked containers, NPC-held keys, submit_flags tasks) to enable the dungeon graph generator. Run 'ruby scripts/generate_dungeon_graph.rb <scenario>' to visualise puzzle flow. See README_scenario_design.md §Dungeon Graph Metadata for field reference."
  end

  issues
end

# Check for recommended fields and return warnings
def check_recommended_fields(json_data)
  warnings = []

  # Top-level recommended fields
  warnings << "Missing recommended field: 'globalVariables' - useful for Ink dialogue state management" unless json_data.key?('globalVariables')
  warnings << "Missing recommended field: 'player' - player sprite configuration improves visual experience" unless json_data.key?('player')

  # Check for objectives with tasks (recommended for structured gameplay)
  if !json_data['objectives'] || json_data['objectives'].empty?
    warnings << "Missing recommended: 'objectives' array with tasks - helps structure gameplay and track progress"
  elsif json_data['objectives'].none? { |obj| obj['tasks'] && !obj['tasks'].empty? }
    warnings << "Missing recommended: objectives should include tasks - objectives without tasks don't provide clear goals"
  end

  # Track if there's at least one NPC with timed conversation (for cut-scenes)
  has_timed_conversation_npc = false

  # Check rooms
  if json_data['rooms']
    json_data['rooms'].each do |room_id, room|
      # Check room objects
      if room['objects']
        room['objects'].each_with_index do |obj, idx|
          path = "rooms/#{room_id}/objects[#{idx}]"
          # Skip observations warning for readable items that already provide their content via 'text'
          # (the text is the description; observations would be redundant)
          skip_obs = obj['readable'] && obj['text'] && !obj['text'].empty?
          unless obj.key?('observations') || skip_obs
            warnings << "Missing recommended field: '#{path}/observations' - helps players understand what items are"
          end
        end
      end


      # Check NPCs
      if room['npcs']
        room['npcs'].each_with_index do |npc, idx|
          path = "rooms/#{room_id}/npcs[#{idx}]"
          # An account-only NPC is an account, not a person in the world: it may not carry a position or behaviour
          next if npc['accountOnly'] == true

          # Phone NPCs should have avatar
          if npc['npcType'] == 'phone' && !npc['avatar']
            warnings << "Missing recommended field: '#{path}/avatar' - phone NPCs should have avatar images"
          end

          # Person NPCs should have position (unless initiallyHidden — cutscene-only NPCs have no in-world sprite)
          if npc['npcType'] == 'person' && !npc['position'] && !npc['behavior']&.dig('initiallyHidden')
            warnings << "Missing recommended field: '#{path}/position' - person NPCs need x,y coordinates (unless behavior.initiallyHidden: true for cutscene-only NPCs)"
          end

          # NPCs with storyPath should have currentKnot
          if npc['storyPath'] && !npc['currentKnot']
            warnings << "Missing recommended field: '#{path}/currentKnot' - specifies starting dialogue knot"
          end

          # Check for NPCs without behavior (no storyPath, no timedMessages, no timedConversation, no eventMappings)
          has_behavior = npc['storyPath'] ||
                         (npc['timedMessages'] && !npc['timedMessages'].empty?) ||
                         npc['timedConversation'] ||
                         (npc['eventMappings'] && !npc['eventMappings'].empty?)

          unless has_behavior
            warnings << "Missing recommended: '#{path}' has no behavior - NPCs should have storyPath, timedMessages, timedConversation, or eventMappings"
          end

          # Track timed conversations (for cut-scene recommendation)
          if npc['timedConversation']
            has_timed_conversation_npc = true
          end
        end
      end
    end
  end

  # Check for at least one NPC with timed conversation (recommended for starting cut-scenes)
  unless has_timed_conversation_npc
    warnings << "Missing recommended: No NPCs with 'timedConversation' - consider adding one for immersive starting cut-scenes"
  end

  # Check objectives
  if json_data['objectives']
    json_data['objectives'].each_with_index do |objective, idx|
      path = "objectives[#{idx}]"
      warnings << "Missing recommended field: '#{path}/description' - helps players understand the objective" unless objective.key?('description')

      if objective['tasks']
        objective['tasks'].each_with_index do |task, task_idx|
          task_path = "#{path}/tasks[#{task_idx}]"
          # Tasks with targetCount should have showProgress
          if task['targetCount'] && !task['showProgress']
            warnings << "Missing recommended field: '#{task_path}/showProgress' - shows progress for collect_items tasks"
          end
        end
      end
    end
  end

  # Check startItemsInInventory
  if json_data['startItemsInInventory']
    json_data['startItemsInInventory'].each_with_index do |item, idx|
      path = "startItemsInInventory[#{idx}]"

      # Check for deprecated position property (must use x/y instead)
      warnings << "Missing recommended field: '#{path}/observations' - helps players understand starting items" unless item.key?('observations')
    end
  end

  warnings
end

# ============================================================================
# RECURRING-BUG CHECKS (pass 4, October 2026)
#
# Each check below is a bug class that turned up in more than one mission's
# pass-4 design review, dialogue review or playtest. README_scenario_design.md
# ("Common bugs and how to avoid them") has the rule and an example of each.
# All are WARNING or SUGGESTION: they point at something to look at, and a
# deliberate design can stand. The ink-only classes (fall-through, blank
# re-entry, popup placement, phone prefixes, exits with no reply, stage cues)
# live in scripts/ink_runtime_check/dialoguelint.mjs instead.
# ============================================================================

# Engine-synced ink variables that are never scenario globals
# (npc-conversation-state.js syncInventoryVariablesToStory, plus the bound externals).
RECURRING_SYNCED_INK_VARS = %w[
  has_keycard has_rfid_cloner card_protocol card_name card_card_id card_instant_clone
  card_needs_attack card_uid_only player_name current_mission_id npc_location mission_phase
  operational_stress_level equipment_status
  call_answer_seconds call_is_callback
].freeze

def recurring_norm_words(text)
  text.to_s.downcase.gsub(/<%.*?%>/, ' ').gsub(/\*[^*]*\*/, ' ').scan(/[a-z0-9']+/)
end

# ─────────────────────────────────────────────────────────────
# NPC eventMappings that can miss their event (sis01 Priya S., ico_deadline_missed)
#
# NPCs register room by room as the player gets there (npc-lazy-loader.js loadNPCsForRoom ->
# npc-manager.js registerNPC -> _setupEventMappings), and the start room loads first. A mapping on
# an NPC in any other room only listens once that room has loaded, so a global change, pickup,
# KO or objective completion that happens earlier passes unheard. Phone NPCs are not special:
# they register with the room that lists them (conventionally the start room), so the same
# rule applies to one placed elsewhere. Only mappings with a lasting effect (anything beyond
# bark/barkDelay and the trigger fields) are judged: a missed bark harms nobody. A mapping opts out with "fireOnlyWhenLoaded": true.
# Events tied to a place (door_*, object_interacted, lockpick_used_in_view, minigame_*,
# fingerprint_*, card_cloned, attack/hostile events) are not judged: they depend on where the
# player is, which the validator can't tell.
# ─────────────────────────────────────────────────────────────
def check_unheard_room_triggers(json_data, repo_root)
  issues = []
  rooms = json_data['rooms'].is_a?(Hash) ? json_data['rooms'] : {}
  start_room = json_data['startRoom']
  return issues unless start_room && rooms[start_room]

  npc_room = {}
  npc_person = {}
  rooms.each do |rid, room|
    Array(room['npcs']).each do |n|
      next unless n.is_a?(Hash)
      npc_room[n['id']] = rid
      npc_person[n['id']] = true if n['npcType'] == 'person'
    end
  end

  # item type -> rooms that hold one (objects, their contents, NPC itemsHeld). Start inventory
  # counts as the start room.
  type_rooms = Hash.new { |h, k| h[k] = Set.new }
  collect = lambda do |rid, list|
    Array(list).each do |o|
      next unless o.is_a?(Hash)
      type_rooms[o['type']] << rid if o['type']
      type_rooms[o['id']] << rid if o['id']
      collect.call(rid, o['contents'])
    end
  end
  rooms.each do |rid, room|
    collect.call(rid, room['objects'])
    Array(room['npcs']).each { |n| collect.call(rid, n['itemsHeld']) if n.is_a?(Hash) }
  end
  collect.call(start_room, json_data['startItemsInInventory'])

  globals = (json_data['globalVariables'] || {}).keys.to_set
  tasks_by_id = {}
  Array(json_data['objectives']).each { |a| Array(a['tasks']).each { |t| tasks_by_id[t['taskId']] = t if t.is_a?(Hash) } }

  # Where each global gets set. A global only ever set by a person NPC's ink in the listener's own
  # room (or a note in it) can't change before the player is there, so it needs no relay. Anything
  # else (mapping setGlobal, timers, phone NPCs, engine-set, no setter found) is :any.
  setters = Hash.new { |h, k| h[k] = Set.new }
  rooms.each do |rid, room|
    Array(room['npcs']).each do |n|
      next unless n.is_a?(Hash) && n['storyPath'].is_a?(String)
      ink = File.join(repo_root, n['storyPath'].sub(/\.json\z/, '.ink'))
      next unless File.exist?(ink)
      code = File.readlines(ink).reject { |l| l.strip.start_with?('//') }.join
      where = n['npcType'] == 'phone' ? :any : rid
      code.scan(/#\s*set_global:(\w+)/).flatten.each { |g| setters[g] << where }
      code.scan(/~\s*(\w+)\s*(?:=|\+\+|--|\+=|-=)/).flatten.each { |g| setters[g] << where }
    end
  end
  walk_setters = lambda do |node, room_id|
    case node
    when Hash
      node.each do |k, v|
        if k == 'setVariable' && v.is_a?(Hash)
          v.each_key { |g| setters[g] << (room_id || :any) } # a note's onRead/onPickup: happens where the note is
        elsif k == 'setGlobal' && v.is_a?(Hash)
          # A mapping's setGlobal happens where its trigger does: entering a room, or a KO or
          # conversation with a person NPC. Any other trigger (timer, global change) is :any.
          pe = node['eventPattern'].to_s
          pev, parg = pe.split(':', 2)
          at = case pev
          when 'room_entered' then parg if rooms.key?(parg)
          when 'npc_ko', 'conversation_closed' then npc_room[parg] if npc_person[parg]
          end
          v.each_key { |g| setters[g] << (at || :any) }
        elsif k == 'globalVarOnKO' && v.is_a?(String)
          setters[v] << (node['npcType'] == 'person' && room_id ? room_id : :any)
        elsif k == 'setGlobalOnStart' && v.is_a?(String)
          setters[v] << :any
        end
        walk_setters.call(v, room_id)
      end
    when Array
      node.each { |v| walk_setters.call(v, room_id) }
    end
  end
  rooms.each { |rid, room| walk_setters.call(room, rid) }
  # A minigame object names the global it sets in its own config ("key": "x", "setGlobal": ...),
  # and it can only be used where it stands. Fields that only read a global don't count.
  reads_only = /skipIf|requires?|condition|waitFor|unlock|visible|hide|show|only/i
  # Globals an object type's minigame sets from engine code, with no name in the object's config.
  # backup-recovery-minigame.js: setGlobalAndNotify on confirm.
  minigame_sets = { 'backup_recovery' => %w[backup_recovery_source recovery_eta_hours backup_restore_initiated] }
  scan_object = lambda do |node, rid|
    case node
    when Hash
      (minigame_sets[node['type']] || []).each { |g| setters[g] << rid }
      node.each do |k, v|
        next if k == 'eventMappings' || k =~ reads_only
        setters[v] << rid if v.is_a?(String) && globals.include?(v)
        scan_object.call(v, rid)
      end
    when Array
      node.each { |v| scan_object.call(v, rid) }
    end
  end
  rooms.each { |rid, room| scan_object.call(room['objects'], rid) }
  walk_setters.call(json_data.reject { |k, _| k == 'rooms' }, nil)

  # Relays: mappings on start-room NPCs (always loaded) that set globals, by event pattern
  relays = Hash.new { |h, k| h[k] = Set.new }
  Array(rooms[start_room]['npcs']).each do |n|
    next unless n.is_a?(Hash)
    Array(n['eventMappings']).each do |m|
      next unless m.is_a?(Hash) && m['setGlobal'].is_a?(Hash)
      relays[m['eventPattern']].merge(m['setGlobal'].keys)
    end
  end

  adjacency = Hash.new { |h, k| h[k] = Set.new }
  rooms.each do |r, room|
    (room['connections'] || {}).each_value do |v|
      Array(v).each { |o| (adjacency[r] << o; adjacency[o] << r) if o.is_a?(String) }
    end
  end
  reach_cache = {}
  reachable_without = lambda do |blocked| # rooms reachable from the start room without entering `blocked`
    reach_cache[blocked] ||= begin
      seen = Set[start_room]
      queue = [start_room]
      until queue.empty?
        cur = queue.shift
        adjacency[cur].each { |o| next if o == blocked || seen.include?(o); seen << o; queue << o }
      end
      seen
    end
  end
  presentation_only_fields = %w[eventPattern condition onceOnly maxTriggers cooldown fireOnlyWhenLoaded bark message barkDelay _comment]

  rooms.each do |rid, room|
    next if rid == start_room
    Array(room['npcs']).each_with_index do |npc, ni|
      next unless npc.is_a?(Hash)
      # What this NPC's own room-entry mappings read (a relay sets one of these globals)
      entry_reads = Array(npc['eventMappings'])
                    .select { |m| m.is_a?(Hash) && m['eventPattern'].to_s == "room_entered:#{rid}" }
                    .map { |m| m['condition'].to_s }.join(' ')
      Array(npc['eventMappings']).each_with_index do |m, mi|
        next unless m.is_a?(Hash) && m['eventPattern'].is_a?(String)
        next if m['fireOnlyWhenLoaded'] == true
        # A bark (or any presentation-only mapping) missed in another room is harmless: nobody was
        # there to hear it. Warn only if the mapping changes state the player meets later.
        next if (m.keys - presentation_only_fields).empty?
        pat = m['eventPattern']
        ev, arg = pat.split(':', 2)
        reason = nil
        case ev
        when 'global_variable_changed'
          # Fine if only this room can set it, or if the NPC's own room_entered mapping reads the
          # same global (a catch-up for a player who arrives after the change)
          # Also fine if the mapping's own condition needs a global that only this room can set
          # (the player has been here already, so the NPC is registered).
          needs_local = m['condition'].to_s.scan(/(?<!!)globalVars\.(\w+)/).flatten.any? { |g| g != arg && setters[g] == Set[rid] }
          unless setters[arg] == Set[rid] || needs_local || entry_reads =~ /\b#{Regexp.escape(arg.to_s)}\b/
            reason = "global '#{arg}' can change before the player has been in '#{rid}'"
          end
        when 'room_entered'
          # Fine if every route from the start room to '#{arg}' passes through this NPC's room
          if arg && arg != rid && rooms.key?(arg) && reachable_without.call(rid).include?(arg)
            reason = "the player can enter '#{arg}' before '#{rid}' has loaded"
          end
        when 'item_picked_up'
          if arg == '*'
            reason = "an item can be picked up before the player reaches '#{rid}'"
          elsif arg && (type_rooms[arg].empty? || type_rooms[arg].any? { |r| r != rid })
            reason = "item '#{arg}' can be picked up elsewhere before the player reaches '#{rid}'"
          end
        when 'npc_ko'
          reason = "'#{arg}' can be knocked out before the player reaches '#{rid}'" if arg && npc_room[arg] != rid
        when 'objective_task_completed'
          # Fine if the task can only be done in this room: talking to an NPC here, or
          # collecting items that only exist here.
          task = tasks_by_id[arg]
          local = task && ((task['type'] == 'npc_conversation' && npc_room[task['targetNPC']] == rid) ||
                           (task['type'] == 'collect_items' && Array(task['targetItemIds']).any? &&
                            Array(task['targetItemIds']).all? { |i| type_rooms[i] == Set[rid] }))
          reason = "the objective can complete before the player reaches '#{rid}'" unless local
        when 'objective_aim_completed'
          reason = "the objective can complete before the player reaches '#{rid}'"
        when 'game_loaded'
          reason = "'game_loaded' fires before '#{rid}' has loaded"
        else
          reason = "a timer event can fire before the player reaches '#{rid}'" if ev =~ /\Atimer/ || ev =~ /_timer\z/
        end
        next unless reason
        # A start-room relay that sets a global this NPC's room-entry mappings read is the fix
        next if relays[pat].any? { |g| entry_reads =~ /\b#{Regexp.escape(g)}\b/ }
        mpath = "rooms/#{rid}/npcs[#{ni}]/eventMappings[#{mi}]"
        who = npc['npcType'] == 'phone' ? "#{npc['id']}, phone NPC" : npc['id'].to_s
        issues << "⚠️ WARNING: '#{mpath}' (#{who}) listens for '#{pat}', but the NPC is in '#{rid}', " \
                  "not the start room ('#{start_room}'), so the mapping only exists once '#{rid}' has loaded and #{reason}. " \
                  "An event that fires earlier passes unheard (sis01: Priya S.'s ico_deadline_missed mapping never ran if the " \
                  "player hadn't visited the incident room). Relay it: add a mapping for '#{pat}' on an NPC in the start room " \
                  "that sets a global, and have this NPC's room_entered:#{rid} mapping read that global (sis01's Sarah relay). " \
                  "If missing the event is fine (the effect only matters when the player is there), add " \
                  "\"fireOnlyWhenLoaded\": true to the mapping."
      end
    end
  end
  issues
rescue => e
  warn "check_unheard_room_triggers skipped: #{e.message}"
  []
end

def check_recurring_bugs(json_data, repo_root)
  issues = []
  rooms = json_data['rooms'].is_a?(Hash) ? json_data['rooms'] : {}
  globals = (json_data['globalVariables'] || {}).keys.to_set
  public_dir = File.join(repo_root, 'public/break_escape')

  all_npcs = []
  rooms.each do |rid, room|
    Array(room['npcs']).each_with_index do |npc, i|
      all_npcs << [rid, i, npc] if npc.is_a?(Hash)
    end
  end

  # --- 1. lockpick_used_in_view mappings that can never fire (m02 Val, Bernie) -----------------
  # The only emitter is the catch gate (lockpick-catch.js), which looks only at person NPCs in the
  # player's room or the lock's room, and only at mappings with conversationMode 'person-chat'
  # (npc-manager.js shouldInterruptLockpickingWithPersonChat).
  neighbours = Hash.new { |h, k| h[k] = Set.new }
  rooms.each do |rid, room|
    (room['connections'] || {}).each_value do |v|
      Array(v).each do |other|
        next unless other.is_a?(String)
        neighbours[rid] << other
        neighbours[other] << rid
      end
    end
  end
  key_locked_object = lambda do |list|
    Array(list).any? do |o|
      next false unless o.is_a?(Hash)
      (o['locked'] == true && o['lockType'] == 'key') || key_locked_object.call(o['contents'])
    end
  end
  room_key_locked = ->(rid) { r = rooms[rid]; r.is_a?(Hash) && r['locked'] == true && r['lockType'] == 'key' }

  all_npcs.each do |rid, i, npc|
    Array(npc['eventMappings']).each_with_index do |m, mi|
      next unless m.is_a?(Hash) && m['eventPattern'] == 'lockpick_used_in_view'
      mpath = "rooms/#{rid}/npcs[#{i}]/eventMappings[#{mi}]"
      if npc['npcType'] != 'person'
        issues << "⚠️ WARNING: '#{mpath}' is a lockpick_used_in_view catch on a #{npc['npcType'] || 'non-person'} NPC. " \
                  "Only person NPCs can see a pick (npc-manager.js), so it never fires. Move it to the watching person NPC."
      elsif m['conversationMode'] != 'person-chat'
        issues << "⚠️ WARNING: '#{mpath}' is a lockpick_used_in_view catch without \"conversationMode\": \"person-chat\". " \
                  "The catch gate only looks at person-chat mappings (npc-manager.js shouldInterruptLockpickingWithPersonChat), " \
                  "and nothing else emits the event, so a bark or setGlobal here never fires (m02 Bernie). Add the person-chat " \
                  "conversation, or drop the mapping."
      else
        can_fire = key_locked_object.call(rooms[rid]['objects']) || room_key_locked.call(rid) ||
                   neighbours[rid].any? { |n| room_key_locked.call(n) }
        unless can_fire
          issues << "⚠️ WARNING: '#{mpath}' (#{npc['id']}) is a lockpick_used_in_view catch, but room '#{rid}' has no " \
                    "pickable lock: no key-locked container in it, it isn't key-locked itself, and no neighbouring room is " \
                    "key-locked. The catch can only fire in the player's room or the lock's room, so it never fires (m02 Val " \
                    "before the fix). Put the NPC where the pick happens, or give the room a key lock."
        end
      end
    end
  end

  # --- 2. opening cutscene that doesn't wait for the game to load (m04) ----------------------------
  start_room = json_data['startRoom']
  if start_room && rooms[start_room]
    Array(rooms[start_room]['npcs']).each_with_index do |npc, i|
      tc = npc.is_a?(Hash) ? npc['timedConversation'] : nil
      next unless tc.is_a?(Hash) && (tc['waitForEvent'].nil? || tc['waitForEvent'].to_s.empty?)
      issues << "⚠️ WARNING: 'rooms/#{start_room}/npcs[#{i}]' (#{npc['id']}) has a start-room timedConversation with no " \
                "waitForEvent, so it fires on the first timer tick while the game is still loading (the title screen and " \
                "Mission Brief can land on top of it; m04). Add \"waitForEvent\": \"game_loaded\" as m01-m03 do."
    end
  end

  # --- 3. an NPC-held note whose onRead/onPickup sets a gating global (m05 vetting files) -----------
  # A handed-over note fires its onRead at once (npc-game-bridge.js _receiveNote), and a KO drop
  # fires it on pickup: the global means "received", not "read".
  dump = JSON.generate(json_data)
  objectives_dump = JSON.generate(json_data['objectives'] || [])
  all_npcs.each do |rid, i, npc|
    Array(npc['itemsHeld']).each_with_index do |item, ii|
      next unless item.is_a?(Hash)
      %w[onRead onPickup].each do |hook|
        vars = item.dig(hook, 'setVariable')
        next unless vars.is_a?(Hash)
        vars.each_key do |var|
          gates = dump.include?("global_variable_changed:#{var}") || dump =~ /globalVars\.#{Regexp.escape(var)}\b/ ||
                  objectives_dump =~ /\b#{Regexp.escape(var)}\b/
          next unless gates
          issues << "💡 SUGGESTION: 'rooms/#{rid}/npcs[#{i}]/itemsHeld[#{ii}]' (#{item['name'] || item['id']}) sets " \
                    "'#{var}' in #{hook}, and '#{var}' drives a mapping, condition or objective. An NPC's note fires " \
                    "#{hook} the moment it is handed over or picked up after a KO (npc-game-bridge.js), so '#{var}' means " \
                    "\"received\", not \"read\" (m05 vetting files). Fine if that's the intent; otherwise gate on a later step."
        end
      end
    end
  end

  # --- 4. sprites: missing files, legacy sheets, missing talk/viseme art (m04 Vance, m05, m06 Satoshi)
  # Character atlases are loaded by key from assets/characters (js/systems/character-textures.js);
  # frame-based sheets (legacy hacker, beds) are preloaded with this.load.spritesheet in game.js.
  game_js = File.join(public_dir, 'js/core/game.js')
  preloaded_sheets = File.exist?(game_js) ? File.read(game_js).scan(/this\.load\.spritesheet\(\s*'([^']+)'/).flatten.to_set : Set.new
  sheet_loadable = lambda do |key|
    preloaded_sheets.include?(key) ||
      %w[png json].all? { |ext| File.exist?(File.join(public_dir, "assets/characters/#{key}.#{ext}")) }
  end
  unloadable_sheet = lambda do |key|
    "neither assets/characters/#{key}.png and #{key}.json nor a this.load.spritesheet('#{key}' entry in game.js exists"
  end
  legacy_talk = { 'hacker' => 'assets/characters/hacker-talk.png', 'hacker-red' => 'assets/characters/hacker-red-talk.png' }
  asset_exists = ->(rel) { rel.is_a?(String) && File.exist?(File.join(public_dir, rel)) }
  all_npcs.each do |rid, i, npc|
    next if npc['npcType'] == 'phone'
    path = "rooms/#{rid}/npcs[#{i}]"
    sheet = npc['spriteSheet']
    if %w[person both].include?(npc['npcType'])
      world_sheet = sheet || 'hacker'
      unless sheet_loadable.call(world_sheet)
        issues << "❌ ERROR: '#{path}' (#{npc['id']}) uses spriteSheet '#{world_sheet}', but #{unloadable_sheet.call(world_sheet)}. " \
                  "The NPC gets no world sprite. Use an existing sheet, or add the atlas files."
      end
    end
    %w[spriteTalk spriteVisemes avatar].each do |field|
      val = npc[field]
      next unless val.is_a?(String) && !val.empty?
      next if asset_exists.call(val)
      issues << "⚠️ WARNING: '#{path}' (#{npc['id']}) #{field} '#{val}' does not exist under public/break_escape/."
    end
    next unless sheet
    if !npc['spriteTalk']
      derived = legacy_talk[sheet] || "assets/characters/#{sheet}_talk.png"
      unless asset_exists.call(derived)
        issues << "⚠️ WARNING: '#{path}' (#{npc['id']}) has no spriteTalk and the derived portrait '#{derived}' doesn't " \
                  "exist, so person-chat shows no face for them. Set spriteTalk to an existing *_talk.png."
      end
    end
    if legacy_talk.key?(sheet)
      issues << "💡 SUGGESTION: '#{path}' (#{npc['id']}) uses the legacy '#{sheet}' sheet: a generic hooded figure with no " \
                "headshot or lip-sync. Give a speaking character a v2 sheet with talk, viseme and headshot art (m04 Vance, m05 recast)."
    elsif !npc['spriteVisemes']
      base = sheet.sub(/_v2\z/, '')
      cand = ["assets/characters/#{sheet}_visemes.png", "assets/characters/#{base}_visemes.png"].find { |c| asset_exists.call(c) }
      if cand
        issues << "💡 SUGGESTION: '#{path}' (#{npc['id']}) has no spriteVisemes, but '#{cand}' exists for its sheet. " \
                  "Add \"spriteVisemes\": \"#{cand}\" so their portrait lip-syncs."
      end
    end
  end

  player_sheet = json_data['player'].is_a?(Hash) ? json_data['player']['spriteSheet'] : nil
  if player_sheet.is_a?(String) && !player_sheet.empty? && !sheet_loadable.call(player_sheet)
    issues << "❌ ERROR: 'player' uses spriteSheet '#{player_sheet}', but #{unloadable_sheet.call(player_sheet)}. " \
              "In standalone mode (and Rails games with no saved sprite) the player has no texture."
  end

  # Top-level pcWallpaper (utils/pc-monitor.js): a missing file falls back to the shared wallpaper
  # in game, so say so here. pcWallpaperFocus is [x, y], shares of the picture (0 to 1).
  if json_data.key?('pcWallpaper') && json_data['pcWallpaper'].is_a?(String) && !asset_exists.call(json_data['pcWallpaper'])
    issues << "⚠️ WARNING: pcWallpaper '#{json_data['pcWallpaper']}' does not exist under public/break_escape/. " \
              "Every PC screen shows the shared wallpaper instead."
  end
  if json_data.key?('pcWallpaperFocus')
    pf = json_data['pcWallpaperFocus']
    unless pf.is_a?(Array) && pf.size == 2 && pf.all? { |n| n.is_a?(Numeric) && n >= 0 && n <= 1 }
      issues << "⚠️ WARNING: pcWallpaperFocus should be [x, y], shares of the wallpaper's width and height between 0 and 1. The centre is used."
    end
  end

  # Room chatBackground: person-chat's fallback background (person-chat-background.js). A missing
  # file fails quietly in game (plain frame), so say so here.
  rooms.each do |rid, room|
    next unless room.is_a?(Hash) && room.key?('chatBackground')
    val = room['chatBackground']
    # A path, or views by the NPC's x and/or a condition: [{ "x": [0, 0.5], "condition": "globalVars.night === true", "image": "..." }, ...] (x = share of the room's width)
    entries = if val.is_a?(Array)
                if val.empty?
                  issues << "⚠️ WARNING: 'rooms/#{rid}' chatBackground is an empty list."
                end
                val.each_with_index.map do |v, i|
                  x = v.is_a?(Hash) ? v['x'] : nil
                  unless x.nil? || (x.is_a?(Array) && x.size == 2 && x.all? { |n| n.is_a?(Numeric) && n >= 0 && n <= 1 } && x[0] <= x[1])
                    issues << "⚠️ WARNING: 'rooms/#{rid}' chatBackground[#{i}] x should be [from, to], shares of the room's width between 0 and 1."
                  end
                  # Optional condition (globalVars syntax, as lighting variants), e.g. a night view.
                  cond = v.is_a?(Hash) ? v['condition'] : nil
                  unless cond.nil?
                    if !cond.is_a?(String) || cond !~ /globalVars\.\w+/
                      issues << "⚠️ WARNING: 'rooms/#{rid}' chatBackground[#{i}] condition should be a string such as \"globalVars.night === true\"."
                    else
                      declared = (json_data['globalVariables'] || {}).keys
                      cond.scan(/globalVars\.(\w+)/).flatten.uniq.each do |gv|
                        next if declared.include?(gv)
                        issues << "⚠️ WARNING: 'rooms/#{rid}' chatBackground[#{i}] condition uses globalVars.#{gv}, which is not in globalVariables, so the view never shows."
                      end
                    end
                  end
                  [v.is_a?(Hash) ? v['image'] : nil, "chatBackground[#{i}] image"]
                end
    else
                [[val, 'chatBackground']]
    end
    entries.each do |img, label|
      if !img.is_a?(String) || img.strip.empty?
        issues << "⚠️ WARNING: 'rooms/#{rid}' #{label} should be an image path such as 'assets/backgrounds/rooms/<name>.png'."
      elsif !asset_exists.call(img)
        issues << "⚠️ WARNING: 'rooms/#{rid}' #{label} '#{img}' does not exist under public/break_escape/. " \
                  "Conversations in this room show the plain frame."
      end
    end
  end

  # NPC chatBackground: the NPC's own person-chat background (beats the room's), e.g. a bedside view.
  rooms.each do |rid, room|
    next unless room.is_a?(Hash) && room['npcs'].is_a?(Array)
    room['npcs'].each_with_index do |npc, i|
      next unless npc.is_a?(Hash) && npc.key?('chatBackground')
      val = npc['chatBackground']
      if !val.is_a?(String) || val.strip.empty? || !asset_exists.call(val)
        issues << "⚠️ WARNING: 'rooms/#{rid}/npcs[#{i}]' (#{npc['id']}) chatBackground '#{val}' is not an existing image under public/break_escape/."
      end
    end
  end

  # NPC portraitVariants: alternative dialogue portraits (utils/portrait-variants.js), e.g. m05 Torres
  # knocked out. Each picks by a globalVars condition and/or ko, or by name from a `# portrait:` tag.
  declared_globals = (json_data['globalVariables'] || {}).keys
  portrait_names = {}   # npc id => variant names, for the ink tag check below
  known_variant_fields = %w[name condition ko spriteTalk spriteVisemes avatar _comment]
  all_npcs.each do |rid, i, npc|
    next unless npc.key?('portraitVariants')
    path = "rooms/#{rid}/npcs[#{i}]"
    list = npc['portraitVariants']
    unless list.is_a?(Array)
      issues << "⚠️ WARNING: '#{path}' (#{npc['id']}) portraitVariants should be a list of { condition/ko, spriteTalk, spriteVisemes, avatar }."
      next
    end
    names = []
    list.each_with_index do |v, j|
      where = "'#{path}' (#{npc['id']}) portraitVariants[#{j}]"
      unless v.is_a?(Hash)
        issues << "⚠️ WARNING: #{where} should be an object."
        next
      end
      (v.keys - known_variant_fields).each do |k|
        issues << "⚠️ WARNING: #{where} has unknown field '#{k}' (known: #{known_variant_fields.join(', ')})."
      end
      if v.key?('name')
        if !v['name'].is_a?(String) || v['name'] !~ /\A\w+\z/
          issues << "⚠️ WARNING: #{where} name should be a word such as \"ko\" (letters, digits, _), so a # portrait:<name> tag can name it."
        elsif v['name'] == 'base'
          issues << "⚠️ WARNING: #{where} name 'base' is reserved: # portrait:base means the NPC's own fields."
        elsif names.include?(v['name'])
          issues << "⚠️ WARNING: #{where} name '#{v['name']}' is used twice; a # portrait tag picks the first."
        else
          names << v['name']
        end
      end
      if v.key?('ko') && ![true, false].include?(v['ko'])
        issues << "⚠️ WARNING: #{where} ko should be true (knocked out) or false."
      end
      cond = v['condition']
      unless cond.nil?
        if !cond.is_a?(String) || cond !~ /globalVars\.\w+/
          issues << "⚠️ WARNING: #{where} condition should be a string such as \"globalVars.torres_ko === true\"."
        else
          cond.scan(/globalVars\.(\w+)/).flatten.uniq.each do |gv|
            next if declared_globals.include?(gv)
            issues << "⚠️ WARNING: #{where} condition uses globalVars.#{gv}, which is not in globalVariables, so the variant never shows."
          end
        end
      end
      if cond.nil? && !v.key?('ko') && !v.key?('name')
        issues << "⚠️ WARNING: #{where} has no condition, ko or name, so nothing can ever select it."
      end
      fields = %w[spriteTalk spriteVisemes avatar].select { |f| v.key?(f) }
      if fields.empty?
        issues << "⚠️ WARNING: #{where} sets none of spriteTalk, spriteVisemes or avatar, so it changes nothing."
      end
      fields.each do |f|
        val = v[f]
        if !val.is_a?(String) || val.strip.empty?
          issues << "⚠️ WARNING: #{where} #{f} should be an image path under public/break_escape/."
        elsif !asset_exists.call(val)
          issues << "⚠️ WARNING: #{where} #{f} '#{val}' does not exist under public/break_escape/, so the portrait falls back."
        end
      end
    end
    portrait_names[npc['id']] = names
  end
  # NPC spriteStyle: a see-through / glowing / flickering look over the frames, e.g. m08's ATHENA
  # hologram (systems/npc-sprite-style.js). The engine clamps values; flag what it would ignore.
  known_style_fields = %w[alpha glow glowStrength flicker light _comment]
  all_npcs.each do |rid, i, npc|
    next unless npc.key?('spriteStyle')
    where = "'rooms/#{rid}/npcs[#{i}]' (#{npc['id']}) spriteStyle"
    st = npc['spriteStyle']
    unless st.is_a?(Hash)
      issues << "⚠️ WARNING: #{where} should be an object such as { \"alpha\": 0.8, \"glow\": \"#7fe8ff\", \"flicker\": true }."
      next
    end
    (st.keys - known_style_fields).each do |k|
      issues << "⚠️ WARNING: #{where} has unknown field '#{k}' (known: #{known_style_fields.join(', ')})."
    end
    if st.key?('alpha') && (!st['alpha'].is_a?(Numeric) || st['alpha'] < 0.3 || st['alpha'] > 1)
      issues << "⚠️ WARNING: #{where} alpha should be a number from 0.3 to 1 (lower is clamped to 0.3, so the NPC stays visible and clickable)."
    end
    hex = /\A#?[0-9a-fA-F]{6}\z/
    if st.key?('glow') && !(st['glow'].is_a?(String) && st['glow'] =~ hex)
      issues << "⚠️ WARNING: #{where} glow should be a colour such as \"#7fe8ff\"; anything else draws no glow."
    end
    if st.key?('glowStrength') && (!st['glowStrength'].is_a?(Numeric) || st['glowStrength'] < 0.5 || st['glowStrength'] > 6)
      issues << "⚠️ WARNING: #{where} glowStrength should be a number from 0.5 to 6."
    end
    if st.key?('flicker') && ![true, false].include?(st['flicker'])
      issues << "⚠️ WARNING: #{where} flicker should be true or false."
    end
    if st.key?('light')
      l = st['light']
      if !st.key?('glow')
        issues << "⚠️ WARNING: #{where} light has no effect without a glow colour."
      elsif l.is_a?(Hash)
        (l.keys - %w[radius intensity color]).each do |k|
          issues << "⚠️ WARNING: #{where} light has unknown field '#{k}' (known: radius, intensity, color)."
        end
        if l.key?('color') && !(l['color'].is_a?(String) && l['color'] =~ hex)
          issues << "⚠️ WARNING: #{where} light color should be a colour such as \"#7fe8ff\"."
        end
      elsif ![true, false].include?(l)
        issues << "⚠️ WARNING: #{where} light should be true, false or { radius, intensity, color }."
      end
    end
    if (st.keys - ['_comment']).empty? || (st['alpha'].nil? || st['alpha'] == 1) && !st.key?('glow') && st['flicker'] != true
      issues << "⚠️ WARNING: #{where} changes nothing (set alpha below 1, a glow colour or flicker)."
    end
  end

  # `# portrait:<name>` / `# portrait:<npc_id>:<name>` in an NPC's ink must name one of the variants.
  all_npcs.each do |rid, i, npc|
    sp = npc['storyPath']
    next unless sp.is_a?(String)
    ink_path = File.join(repo_root, sp.sub(/\.json\z/, '.ink'))
    next unless File.exist?(ink_path)
    code = File.readlines(ink_path).reject { |l| l.strip.start_with?('//') }.join
    code.scan(/#\s*portrait:\s*([\w:]+)/).flatten.uniq.each do |arg|
      parts = arg.split(':')
      target, name = parts.size == 2 ? parts : [npc['id'], parts[0]]
      next if name == 'base'
      next if (portrait_names[target] || []).include?(name)
      issues << "⚠️ WARNING: #{sp.sub(/\.json\z/, '.ink')}: # portrait:#{arg} names no portraitVariants entry " \
                "#{name.inspect} on #{target}, so the tag does nothing."
    end
  end

  # --- 5. different characters sharing one sprite sheet (m04 guard/operatives, m08 Phantom/Netherton)
  player = json_data['player'].is_a?(Hash) ? json_data['player'] : {}
  by_sheet = Hash.new { |h, k| h[k] = [] }
  by_sheet[player['spriteSheet']] << [player['displayName'] || 'the player', 'player'] if player['spriteSheet']
  all_npcs.each do |_rid, _i, npc|
    next if npc['npcType'] == 'phone' || !npc['spriteSheet']
    by_sheet[npc['spriteSheet']] << [npc['displayName'] || npc['id'], npc['id']]
  end
  by_sheet.each do |sheet, list|
    names = list.map { |n, _| n.to_s.strip.downcase }.uniq
    next if names.size < 2
    who = list.map { |n, id| "#{n} (#{id})" }.uniq.join(', ')
    issues << "💡 SUGGESTION: spriteSheet '#{sheet}' is shared by different characters: #{who}. On screen and in the " \
              "portrait they look like the same person. Fine for a uniformed crew; otherwise give each their own sheet " \
              "(m04 gate guard vs operatives, m08 Phantom vs Netherton)."
  end

  # --- 6. two pinned objects inside one interaction range of each other (m06 rack sheet / flag station)
  rooms.each do |rid, room|
    pinned = Array(room['objects']).each_with_index.select do |o, _|
      o.is_a?(Hash) && o['position'].is_a?(Hash) && o['position']['x'].is_a?(Numeric) && o['position']['y'].is_a?(Numeric)
    end
    pinned.combination(2).each do |(a, ai), (b, bi)|
      dx = (a['position']['x'] - b['position']['x']) * 32.0
      dy = (a['position']['y'] - b['position']['y']) * 32.0
      dist = Math.sqrt(dx * dx + dy * dy)
      next if dist >= 32.0
      # Reveal slots (NPC needs, slice 7) sit on their producer's tray on purpose: a slot and its
      # producer, or two slots of one producer, are meant to share a spot
      next if a['outputOf'].is_a?(String) && (a['outputOf'] == b['id'] || a['outputOf'] == b['outputOf'])
      next if b['outputOf'].is_a?(String) && b['outputOf'] == a['id']
      # A click cannot open an object with interactable: false (the tap filter in game.js and the
      # proximity pass in interactions.js both skip it), so such a pair cannot steal clicks. The
      # lab's plain corridor extinguisher and its revealed wedge share one spot on purpose.
      next if a['interactable'] == false || b['interactable'] == false
      issues << "⚠️ WARNING: rooms/#{rid}: objects[#{ai}] '#{a['name'] || a['id']}' and objects[#{bi}] '#{b['name'] || b['id']}' " \
                "are pinned #{dist.round} px apart, inside the 32 px interaction range (constants.js INTERACTION_RANGE), so " \
                "one click can open the other. Move them at least a tile apart. (Objects placed by Tiled slots aren't " \
                "checked here; walk up to each one in a playtest.)"
    end
  end

  # --- 7-9. ink cross-checks: timed text repeated in the ink, dead VARs, undeclared set_global ------
  seen_ink = {}
  all_npcs.each do |rid, i, npc|
    sp = npc['storyPath']
    next unless sp.is_a?(String)
    ink_path = File.join(repo_root, sp.sub(/\.json\z/, '.ink'))
    next unless File.exist?(ink_path)
    code_lines = File.readlines(ink_path).reject { |l| l.strip.start_with?('//') }
    code = code_lines.join

    # 7. a bark/timed text repeated as the first line of the conversation it opens (m07 Architect)
    messages = []
    Array(npc['timedMessages']).each { |t| messages << t['message'] if t.is_a?(Hash) }
    Array(npc['eventMappings']).each { |m| messages << m.dig('sendTimedMessage', 'message') if m.is_a?(Hash) && m['sendTimedMessage'].is_a?(Hash) }
    spoken = code_lines.map(&:strip).reject { |l| l.empty? || l =~ /\A(?:[#~=*+{}\-<]|->|VAR |CONST |EXTERNAL |INCLUDE )/ }
                       .map { |l| l.sub(/\A[A-Z][\w.'’() ]{0,40}:\s+/, '') }
    messages.compact.uniq.each do |msg|
      mw = recurring_norm_words(msg)
      next if mw.size < 4
      hit = spoken.find do |l|
        lw = recurring_norm_words(l)
        lw.size >= mw.size && lw.first(mw.size) == mw
      end
      next unless hit
      issues << "⚠️ WARNING: rooms/#{rid}/npcs[#{i}] (#{npc['id']}): the timed text \"#{msg.to_s[0, 70]}\" is repeated at the start " \
                "of a line in #{sp.sub(/\.json\z/, '.ink')} (\"#{hit[0, 70]}\"). The bark shows first and the chat opens on " \
                "the same words (m07 Architect). Make the bark a teaser, or start the line somewhere else."
    end

    next if seen_ink[ink_path]
    seen_ink[ink_path] = true
    rel = sp.sub(/\.json\z/, '.ink')

    # 8. a VAR the ink reads but nothing ever sets: its condition is dead (m06 recruitment_accepted)
    code.scan(/^\s*VAR\s+(\w+)\s*=\s*(.+?)\s*$/).each do |var, default|
      next if globals.include?(var) || RECURRING_SYNCED_INK_VARS.include?(var)
      # The pretext card writes these from the chosen blank (06 §5). The ink only reads them.
      next if var.match?(/\Apretext_[A-Za-z0-9_]+_(?:name|value)\z/)
      next unless ['false', '0', '""'].include?(default.strip)
      assigned = code =~ /~\s*#{var}\s*(?:=|\+\+|--|\+=|-=)/ || code =~ /#\s*set_(?:variable|global):#{var}\b/
      next if assigned
      reads = code.scan(/\b#{var}\b/).size - 1
      next if reads < 1
      issues << "⚠️ WARNING: '#{rel}': VAR #{var} is read but never set (no '~ #{var} = …', and no scenario global of " \
                "that name to sync in), so every condition on it is fixed at #{default.strip}. Set it where it should " \
                "change, or test the variable that actually changes."
    end

    # 9. #set_global for a global the scenario never declares (typo, or missing from globalVariables)
    code.scan(/#\s*set_global:(\w+)/).flatten.uniq.each do |var|
      next if globals.include?(var)
      issues << "⚠️ WARNING: '#{rel}' sets global '#{var}' (#set_global), but '#{var}' is not in scenario.globalVariables. " \
                "Declare it (with its starting value) so it saves, syncs into other inks and can drive mappings, or fix the name."
    end

    # 10. #trigger_minigame:<type>[ key=value...] must name a registry type, and an exercise-station's
    #     exerciseId must be in social.exercises (an unknown type only warns in the game and opens nothing)
    code.scan(/#\s*trigger_minigame:([^\n#]*)/).flatten.each do |param|
      type = param.strip[/\A[A-Za-z0-9_-]+/]
      known = ValidateSocial::Exercises::REGISTRY_TYPES
      unless known.include?(type)
        issues << "❌ ERROR: '#{rel}' has #trigger_minigame:#{param.strip}, but #{type.inspect} is not a minigame type (#{known.join(', ')}); nothing would open."
        next
      end
      next unless type == 'exercise-station'

      ex_id = param[/[\s|]exerciseId=([^|\s]+)/, 1] || param[/"exerciseId"\s*:\s*"([^"]+)"/, 1]
      ids = Array(json_data.dig('social', 'exercises')).filter_map { |e| e['id'] if e.is_a?(Hash) }
      if ex_id && !ids.include?(ex_id.delete('"'))
        issues << "❌ ERROR: '#{rel}' has #trigger_minigame:#{param.strip}, but exerciseId '#{ex_id}' is not in social.exercises."
      elsif ex_id.nil? && !param.include?('"config"')
        issues << "❌ ERROR: '#{rel}' has #trigger_minigame:#{param.strip}, which names no exerciseId; the station would open on nothing."
      end
    end
  end

  issues
end

# ============================================================================
# TOOLING PASS 4c CHECKS: stacked timed texts, globals nothing reads, credit
# sections that can print empty. All SUGGESTION or WARNING, never ERROR.
# (README_scenario_design.md "Common bugs and how to avoid them".)
# ============================================================================

# Split a condition into &&-joined terms and describe each one as
# [subject, :true | :false | [:eq, literal] | [:ne, literal]], or nil if it isn't a simple term.
def pass4c_condition_terms(condition)
  return [] unless condition.is_a?(String)
  condition.split('&&').map(&:strip).reject(&:empty?).filter_map do |t|
    t = t.sub(/\A\((.*)\)\z/, '\1').strip
    lit = '(\'[^\']*\'|"[^"]*"|-?\d+(?:\.\d+)?)'
    if t =~ /\A!\s*([\w.\[\]'"]+)\z/ then [$1, :false]
    elsif t =~ /\A([\w.\[\]'"]+)\s*===?\s*true\z/ then [$1, :true]
    elsif t =~ /\A([\w.\[\]'"]+)\s*===?\s*false\z/ then [$1, :false]
    elsif t =~ /\A([\w.\[\]'"]+)\s*!==?\s*true\z/ then [$1, :false]
    elsif t =~ /\A([\w.\[\]'"]+)\s*===?\s*#{lit}\z/ then [$1, [:eq, $2]]
    elsif t =~ /\A([\w.\[\]'"]+)\s*!==?\s*#{lit}\z/ then [$1, [:ne, $2]]
    elsif t =~ /\A([\w.\[\]'"]+)\z/ then [$1, :true]
    end
  end
end

# True when two conditions can never both hold (x vs !x, value === 'a' vs value === 'b').
def pass4c_conditions_exclusive?(a, b)
  ta = pass4c_condition_terms(a)
  tb = pass4c_condition_terms(b)
  ta.any? do |sa, va|
    tb.any? do |sb, vb|
      next false unless sa == sb
      (va == :true && vb == :false) || (va == :false && vb == :true) ||
        (va.is_a?(Array) && vb.is_a?(Array) && va[0] == :eq && vb[0] == :eq && va[1] != vb[1]) ||
        (va.is_a?(Array) && vb.is_a?(Array) && va[0] == :eq && vb[0] == :ne && va[1] == vb[1]) ||
        (va.is_a?(Array) && vb.is_a?(Array) && va[0] == :ne && vb[0] == :eq && va[1] == vb[1])
    end
  end
end

# a. Two or more timed texts triggered by the same event, less than 4 s apart: the phone toasts stack
#    on top of each other and the first is gone before it can be read (m04, m05 playtests).
STACKED_TEXT_GAP_MS = 4000

def check_stacked_timed_texts(json_data)
  issues = []
  rooms = json_data['rooms'].is_a?(Hash) ? json_data['rooms'] : {}
  entries = Hash.new { |h, k| h[k] = [] }
  rooms.each do |rid, room|
    Array(room['npcs']).each_with_index do |npc, i|
      next unless npc.is_a?(Hash)
      who = npc['id'] || "npcs[#{i}]"
      Array(npc['timedMessages']).each do |tm|
        next unless tm.is_a?(Hash) && tm['delay'].is_a?(Numeric)
        ev = tm['waitForEvent'].to_s.empty? ? '(game start)' : tm['waitForEvent']
        entries[ev] << { delay: tm['delay'], msg: tm['message'], cond: nil, who: who, sets: [] }
      end
      Array(npc['eventMappings']).each do |m|
        next unless m.is_a?(Hash) && m['sendTimedMessage'].is_a?(Hash)
        d = m['sendTimedMessage']['delay']
        next unless d.is_a?(Numeric) && m['eventPattern'].is_a?(String)
        # a mapping's own delayMs holds the whole action back, so it adds to the text's delay
        d += m['delayMs'] if m['delayMs'].is_a?(Numeric) && m['delayMs'] > 0
        entries[m['eventPattern']] << { delay: d, msg: m['sendTimedMessage']['message'], cond: m['condition'], who: who,
                                       sets: m['setGlobal'].is_a?(Hash) ? m['setGlobal'].keys : [] }
      end
    end
  end
  entries.each do |ev, list|
    next if list.size < 2
    pairs = []
    list.combination(2).each do |x, y|
      next unless (x[:delay] - y[:delay]).abs < STACKED_TEXT_GAP_MS
      next if pass4c_conditions_exclusive?(x[:cond], y[:cond])
      # a mapping that sets a global the other one requires to be unset: the first to fire blocks the second
      next if x[:sets].any? { |g| pass4c_condition_terms(y[:cond]).include?(["globalVars.#{g}", :false]) }
      next if y[:sets].any? { |g| pass4c_condition_terms(x[:cond]).include?(["globalVars.#{g}", :false]) }
      pairs << [x, y]
    end
    next if pairs.empty?
    shown = pairs.first(2).map do |x, y|
      "#{x[:who]} @#{x[:delay]} ms \"#{x[:msg].to_s[0, 36]}\" + #{y[:who]} @#{y[:delay]} ms \"#{y[:msg].to_s[0, 36]}\""
    end.join('; ')
    more = pairs.size > 2 ? " (and #{pairs.size - 2} more pair#{pairs.size - 2 == 1 ? '' : 's'})" : ''
    issues << "⚠️ WARNING: event '#{ev}' can send timed texts less than #{STACKED_TEXT_GAP_MS / 1000} s apart that fire together: " \
              "#{shown}#{more}. Their toasts stack and the first is gone before it can be read. Space them 4-6 s apart, " \
              "or fold them into one message."
  end
  issues
end

# b. A global something sets (setGlobal, setGlobalOnStart, globalVarOnKO, onRead/onPickup setVariable,
#    ink #set_global / #set_variable, or an ink '~ x =' on a declared global) that nothing ever reads:
#    no condition, skipIfGlobal-style field, event pattern, credit/music condition or ink read (m05
#    mission_priority, m08 witness_heard). Mirror of the "read but never set" check above.
PASS4C_SET_KEYS_HASH = %w[setGlobal setVariable].freeze

def check_globals_never_read(json_data, repo_root)
  issues = []
  declared = (json_data['globalVariables'] || {}).keys
  setters = {}   # name => first place
  strings = []   # every string that can read a global

  walk = lambda do |node, path|
    case node
    when Hash
      node.each do |k, v|
        if k == 'globalVariables'
          next
        elsif PASS4C_SET_KEYS_HASH.include?(k) && v.is_a?(Hash)
          v.each_key { |name| setters[name] ||= "#{path}/#{k}" }
        elsif k != 'setGlobalPrefix' && (k =~ /\AsetGlobal/ || k == 'globalVarOnKO') && v.is_a?(String)
          setters[v] ||= "#{path}/#{k}"
        elsif k == 'setGlobal' && v.is_a?(String)
          setters[v] ||= "#{path}/#{k}"
        elsif k == 'onHidden' && v.is_a?(Array)
          # hideable.onHidden actions: a set_global key is a setter, and its key string is not a read
          v.each_with_index do |act, i|
            if act.is_a?(Hash) && act['type'] == 'set_global' && act['key'].is_a?(String)
              setters[act['key']] ||= "#{path}/#{k}[#{i}]"
              walk.call(act.reject { |ak, _| ak == 'key' }, "#{path}/#{k}[#{i}]")
            else
              walk.call(act, "#{path}/#{k}[#{i}]")
            end
          end
        else
          walk.call(v, "#{path}/#{k}")
        end
      end
    when Array
      node.each_with_index { |v, i| walk.call(v, "#{path}[#{i}]") }
    when String
      strings << node
    end
  end
  walk.call(json_data, '')

  # ink: setters and reads, per story file (storyPath of every NPC, plus INCLUDEd files)
  ink_files = []
  queue = []
  (json_data['rooms'] || {}).each_value do |room|
    Array(room['npcs']).each do |npc|
      sp = npc.is_a?(Hash) ? npc['storyPath'] : nil
      queue << File.join(repo_root, sp.sub(/\.json\z/, '.ink')) if sp.is_a?(String)
    end
  end
  # Ink-email correspondents (social.mailClient.contacts[].emailRecord.storyPath) read and set globals too
  contacts = json_data.dig('social', 'mailClient', 'contacts')
  Array(contacts.is_a?(Array) ? contacts : nil).each do |c|
    sp = c.is_a?(Hash) && c['emailRecord'].is_a?(Hash) ? c['emailRecord']['storyPath'] : nil
    queue << File.join(repo_root, sp.sub(/\.json\z/, '.ink')) if sp.is_a?(String)
  end
  until queue.empty?
    f = queue.shift
    next if ink_files.include?(f) || !File.exist?(f)
    ink_files << f
    File.readlines(f).each do |l|
      queue << File.expand_path($1, File.dirname(f)) if l =~ /^\s*INCLUDE\s+(\S+)/
    end
  end
  ink_read_text = []
  ink_files.each do |f|
    rel = f.sub("#{repo_root}/", '')
    File.readlines(f).each_with_index do |raw, li|
      line = raw.sub(%r{(^|\s)//.*$}, '\1')
      line.scan(/#\s*set_(?:global|variable):(\w+)/) { |(v)| setters[v] ||= "#{rel}:#{li + 1}" }
      if line =~ /^\s*~\s*(\w+)\s*(?:=|\+\+|--|\+=|-=)/ && declared.include?($1)
        setters[$1] ||= "#{rel}:#{li + 1}"
      end
      next if line =~ /^\s*(?:VAR|CONST|EXTERNAL|INCLUDE)\b/
      stripped = line.gsub(/#\s*set_(?:global|variable):\w+(?::[^\s#]*)?/, ' ')
                     .sub(/^(\s*~\s*)\w+\s*(?:=|\+\+|--|\+=|-=)/, '\1 ')
      ink_read_text << stripped
    end
  end
  ink_blob = ink_read_text.join("\n")
  json_blob = strings.join("\n")
  # The engine reads some globals by name (minigames, interactions); count those as read.
  engine_blob = nil
  engine_text = lambda do
    engine_blob ||= (Dir.glob(File.join(repo_root, 'public/break_escape/js/**/*.js')) +
                     Dir.glob(File.join(repo_root, 'app/**/*.rb')) + Dir.glob(File.join(repo_root, 'lib/**/*.rb')))
                    .map { |f| File.read(f, encoding: 'UTF-8', invalid: :replace, undef: :replace) rescue '' }.join("\n")
  end

  setters.each do |name, where|
    next if RECURRING_SYNCED_INK_VARS.include?(name)
    re = /(?<![\w.])(?:globalVars\.)?#{Regexp.escape(name)}(?!\w)/
    next if json_blob.match?(re) || ink_blob.match?(re)
    next if engine_text.call.match?(/(?<![\w])#{Regexp.escape(name)}(?!\w)/)
    issues << "💡 SUGGESTION: global '#{name}' is set (#{where}) but nothing reads it: no condition, skipIfGlobal, " \
              "global_variable_changed mapping, credit or music condition, objective field or ink VAR read mentions it. " \
              "Either use it (gate a line, a credit or a hub choice on it) or drop the setter so it doesn't look like it matters " \
              "(m05 mission_priority, m08 witness_heard)."
  end
  issues
end

# c. A credits section (a 'section-header' line plus the entries under it) whose every entry carries a
#    condition and which has no unconditional fallback can print as a bare heading (m05 Recruiter).
def check_credit_sections(json_data)
  issues = []
  walk = lambda do |node, path|
    case node
    when Hash
      node.each do |k, v|
        if k == 'credits' && v.is_a?(Array) && v.all? { |e| e.is_a?(Hash) }
          sections = []
          cur = { header: '(top of the credits)', entries: [] }
          v.each do |e|
            if e['style'] == 'section-header'
              sections << cur
              cur = { header: e['text'].to_s, entries: [] }
            elsif !e['text'].to_s.strip.empty?
              cur[:entries] << e
            end
          end
          sections << cur
          sections.each do |sec|
            next if sec[:entries].empty?
            next unless sec[:entries].all? { |e| e['condition'].is_a?(String) && !e['condition'].strip.empty? }
            issues << "💡 SUGGESTION: credits section \"#{sec[:header].gsub(/[─\-]+/, '').strip}\" (#{path}/credits) has #{sec[:entries].size} " \
                      "entr#{sec[:entries].size == 1 ? 'y' : 'ies'} and every one is conditional, with no unconditional fallback line. " \
                      "If no condition holds the heading prints over nothing (m05 Recruiter). Add an unconditional line, " \
                      "or make sure the conditions cover every path."
          end
        else
          walk.call(v, "#{path}/#{k}")
        end
      end
    when Array
      node.each_with_index { |v, i| walk.call(v, "#{path}[#{i}]") }
    end
  end
  walk.call(json_data, '')
  issues
end

# c. An ink VAR that shares its name with a scenario global. The engine syncs every ink VAR named like a
#    scenario global both ways (npc-conversation-state.js syncGlobalVariablesToStory and
#    observeGlobalVariableChanges), so an ink that uses the name as its own local flag writes into the
#    global and reads other writers' values back. m03 round 2: a new global guard_hostile ("the guard is
#    attacking", set on npc_hostile_state_changed and read by HaX's hints) collided with the guard ink's own
#    guard_hostile (set on a peaceful telling-off), so HaX said "stand and fight" after a scolding (P1-38).
#    Warned when the types disagree, or when the ink assigns the VAR (~ x = ...) while something else
#    also sets the global (a scenario setGlobal/setVariable/globalVarOnKO, or another ink) and the ink
#    doesn't say the VAR is the scenario's: a comment naming it synced / a global, either trailing the
#    VAR's own line or in the run of comment lines directly above it (the run stops at the previous VAR,
#    a blank line or any other non-comment line), which is the house convention. "scenario" and
#    "engine" alone don't count, and a header above a block of VARs acknowledges only the first: an
#    unrelated "the engine binds only six" note two VARs up hid m03's handler_trust.
INK_GLOBAL_ACK_RE = /\b(?:sync|synced|syncs|global|globals|globalVars|globalVariables)\b/i.freeze

def ink_global_value_type(v)
  case v
  when true, false then :bool
  when Numeric then :number
  when String then :string
  end
end

def ink_literal_type(src)
  s = src.to_s.sub(%r{\s*//.*\z}, '').strip
  case s
  when 'true', 'false' then :bool
  when /\A-?\d+(?:\.\d+)?\z/ then :number
  when /\A"(?:[^"\\]|\\.)*"\z/ then :string
  end
end

def check_ink_global_collisions(json_data, repo_root)
  issues = []
  globals = json_data['globalVariables'].is_a?(Hash) ? json_data['globalVariables'] : {}
  return issues if globals.empty?

  scenario_writers = Hash.new { |h, k| h[k] = [] }  # name => [path]
  walk = lambda do |node, path|
    case node
    when Hash
      node.each do |k, v|
        next if k == 'globalVariables'
        if PASS4C_SET_KEYS_HASH.include?(k) && v.is_a?(Hash)
          v.each_key { |name| scenario_writers[name] << "#{path}/#{k}" }
        elsif k != 'setGlobalPrefix' && (k == 'setGlobal' || k == 'globalVarOnKO' || k =~ /\AsetGlobal/) && v.is_a?(String)
          scenario_writers[v] << "#{path}/#{k}"
        else
          walk.call(v, "#{path}/#{k}")
        end
      end
    when Array
      node.each_with_index { |v, i| walk.call(v, "#{path}[#{i}]") }
    end
  end
  walk.call(json_data, '')

  npcs = Array(json_data['npcs']) + (json_data['rooms'].is_a?(Hash) ? json_data['rooms'].values : []).flat_map { |r| Array(r['npcs']) }
  queue = npcs.map { |n| n.is_a?(Hash) && n['storyPath'].is_a?(String) ? File.join(repo_root, n['storyPath'].sub(/\.json\z/, '.ink')) : nil }.compact
  ink_files = []
  until queue.empty?
    f = queue.shift
    next if ink_files.include?(f) || !File.exist?(f)
    ink_files << f
    File.readlines(f, encoding: 'UTF-8').each { |l| queue << File.expand_path($1, File.dirname(f)) if l =~ /^\s*INCLUDE\s+(\S+)/ }
  end

  write_re = ->(name) { /^\s*~\s*#{Regexp.escape(name)}\s*(?:=|\+\+|--|\+=|-=)|#\s*set_(?:global|variable):#{Regexp.escape(name)}\b/ }
  texts = ink_files.to_h { |f| [f, File.readlines(f, encoding: 'UTF-8')] }
  texts.each do |f, lines|
    rel = f.sub("#{repo_root}/", '')
    lines.each_with_index do |line, i|
      next unless line =~ /^\s*VAR\s+(\w+)\s*=\s*(.+?)\s*$/
      name, default = $1, $2
      next unless globals.key?(name) && !RECURRING_SYNCED_INK_VARS.include?(name)

      gtype = ink_global_value_type(globals[name])
      assigns = lines.each_with_index.select { |l, _| l =~ /^\s*~\s*#{Regexp.escape(name)}\s*(?:=|\+\+|--|\+=|-=)/ }

      # types: the VAR's default, and each literal it is assigned
      bad = []
      dt = ink_literal_type(default)
      bad << "declared #{default.sub(%r{\s*//.*\z}, '')}" if gtype && dt && dt != gtype
      assigns.each do |l, li|
        lt = l =~ /=\s*(.+)$/ ? ink_literal_type($1) : nil
        bad << "assigned #{l.strip} (line #{li + 1})" if gtype && lt && lt != gtype && l !~ /(?:\+\+|--|\+=|-=)/
      end
      unless bad.empty?
        issues << "⚠️ WARNING: '#{rel}:#{i + 1}': VAR #{name} shares its name with scenario global '#{name}' " \
                  "(#{globals[name].inspect}) but is #{bad.first(2).join(', ')}. The engine syncs the two, so the types fight. " \
                  "Rename the ink VAR if it is a different thing, or match the global's type."
        next
      end

      next if assigns.empty?
      ack = line =~ %r{//.*#{INK_GLOBAL_ACK_RE}}
      k = i - 1
      while !ack && k >= 0 && lines[k] =~ %r{^\s*//}
        ack = true if lines[k] =~ %r{^\s*//.*#{INK_GLOBAL_ACK_RE}}
        k -= 1
      end
      next if ack

      others = scenario_writers[name].first(2)
      others += texts.reject { |o, _| o == f }.select { |_, ol| ol.any? { |l| l =~ write_re.call(name) } }
                     .map { |o, _| o.sub("#{repo_root}/", '') }.first(2)
      next if others.empty?
      issues << "⚠️ WARNING: '#{rel}:#{i + 1}': VAR #{name} is assigned in this ink (line #{assigns.first(3).map { |_, li| li + 1 }.join(', ')}) " \
                "and is also scenario global '#{name}', which #{others.join(' and ')} also set#{others.size == 1 ? 's' : ''}. " \
                "The engine syncs an ink VAR to the global of the same name, so if this ink means its own flag the two " \
                "overwrite each other (m03 guard_hostile, P1-38). Rename the ink VAR if it is a different thing; if it is " \
                "the scenario's global, say so in a comment on the VAR's line or directly above it (e.g. \"// Synced scenario global\")."
    end
  end
  issues
end

# ============================================================================
# CARRY-OVER: importGlobals / exportGlobals (docs/agents/CARRY_OVER_PLAN.md 2.8)
# A reading mission imports another mission's exported globals as read-only
# values, fixed when the game is created. Both ends are checked here.
# ============================================================================

CARRY_OVER_NAME_RE = /\A[a-z][a-z0-9]*_[a-z0-9_]+\z/.freeze
CARRY_OVER_STRUCTURAL_MAPPING_KEYS = %w[setVisible completeTask unlockAim unlockTask skipTask emitEvent].freeze
$carry_over_source_cache = {}

# A triage set writes camelCase result globals (<setGlobalPrefix>reportRate), and a post check
# imports the pre check's. Those names are set by the set's prefix, not chosen, so the lower_snake_case
# rule does not apply to them: the prefix with {stage} filled by pre or post (or left as is) plus a
# result suffix, the comparison.prePrefix, and the fixed baseline names the comparison reads.
CARRY_OVER_PRE_NAMES = %w[triage_pre_percent triage_pre_reportRate triage_pre_complete].freeze
CARRY_OVER_RESULT_NAME_RE = /\A[A-Za-z_][A-Za-z0-9_]*\z/.freeze

def carry_over_triage_result_name?(json_data, name)
  return false unless name.is_a?(String) && name.match?(CARRY_OVER_RESULT_NAME_RE)
  return true if CARRY_OVER_PRE_NAMES.include?(name)

  sets = json_data.is_a?(Hash) ? json_data.dig('social', 'triageSets') : nil
  return false unless sets.is_a?(Array)

  sets.any? do |set|
    next false unless set.is_a?(Hash)

    prefixes = []
    prefix = set.dig('outcome', 'setGlobalPrefix')
    if prefix.is_a?(String) && !prefix.empty?
      prefixes += prefix.include?('{stage}') ? %w[pre post training mission].map { |st| prefix.gsub('{stage}', st) } : [prefix]
    end
    pre = set.dig('comparison', 'prePrefix')
    prefixes << pre if pre.is_a?(String) && !pre.empty?
    prefixes.any? { |pf| TRIAGE_RESULT_SUFFIXES.any? { |suf| name == "#{pf}#{suf}" } }
  end
end

# The name an import is known by in this mission (Game CarryOver.import_name).
def carry_over_import_name(entry)
  return nil unless entry.is_a?(Hash)
  return entry['completed'].to_s if entry.key?('completed')
  return entry['as'].to_s if entry['as'].is_a?(String) && !entry['as'].empty?

  prefix = entry['from'].to_s[/\A((?:m|sis)\d\d)_/, 1]
  prefix && entry['var'].is_a?(String) ? "#{prefix}_#{entry['var']}" : nil
end

# Before the other checks run: the imports become declared globals (with their
# defaults), so every "is this global declared?" check accepts them. Returns the
# original import list.
def prepare_carry_over_globals(json_data)
  imports = json_data['importGlobals']
  return [] unless imports.is_a?(Array)

  json_data['globalVariables'] = {} unless json_data['globalVariables'].is_a?(Hash)
  imports.each do |entry|
    name = carry_over_import_name(entry)
    next if name.nil? || json_data['globalVariables'].key?(name)

    json_data['globalVariables'][name] = entry.key?('completed') ? false : entry['default']
  end
  imports
end

def carry_over_ink_files(json_data, repo_root)
  queue = []
  walk = lambda do |node|
    case node
    when Hash
      node.each do |k, v|
        if k == 'storyPath' && v.is_a?(String)
          queue << File.join(repo_root, v.sub(/\.json\z/, '.ink'))
        else
          walk.call(v)
        end
      end
    when Array then node.each { |v| walk.call(v) }
    end
  end
  walk.call(json_data)
  files = []
  until queue.empty?
    f = queue.shift
    next if files.include?(f) || !File.exist?(f)
    files << f
    File.readlines(f, encoding: 'UTF-8').each { |l| queue << File.expand_path($1, File.dirname(f)) if l =~ /^\s*INCLUDE\s+(\S+)/ }
  end
  files
end

# name => [[where, value-or-nil], ...] for every write in the scenario JSON.
def carry_over_json_writes(json_data)
  writes = Hash.new { |h, k| h[k] = [] }
  walk = lambda do |node, path|
    case node
    when Hash
      if node['type'] == 'set_global' && node['key'].is_a?(String)
        writes[node['key']] << ["#{path} (applyActions set_global)", node['value']]
      end
      node.each do |k, v|
        next if %w[globalVariables importGlobals exportGlobals].include?(k)
        if PASS4C_SET_KEYS_HASH.include?(k) && v.is_a?(Hash)
          v.each { |name, val| writes[name] << ["#{path}/#{k}", val] }
        elsif k != 'setGlobalPrefix' && (k == 'setGlobal' || k == 'globalVarOnKO' || k =~ /\AsetGlobal/) && v.is_a?(String)
          writes[v] << ["#{path}/#{k}", nil]
        else
          walk.call(v, "#{path}/#{k}")
        end
      end
    when Array
      node.each_with_index { |v, i| walk.call(v, "#{path}[#{i}]") }
    end
  end
  walk.call(json_data, '')
  # A triage set's four result globals are written by the starter, not by ink or a
  # scenario setter (05 N5). {stage} is filled the way the starter does: the
  # workstation's stage, else the set's stage, else mission.
  carry_over_record_triage_writes(json_data, writes)
  writes
end

# Records <setGlobalPrefix>percent, reportRate and complete as writes, plus pass when passPercent > 0.
TRIAGE_RESULT_SUFFIXES = %w[percent reportRate complete pass].freeze
TRIAGE_BASE_SUFFIXES = %w[percent reportRate complete].freeze

def carry_over_record_triage_writes(json_data, writes)
  sets = json_data.is_a?(Hash) ? json_data.dig('social', 'triageSets') : nil
  return unless sets.is_a?(Array)

  by_id = {}
  sets.each_with_index do |set, i|
    by_id[set['id']] = i if set.is_a?(Hash) && set['id'].is_a?(String)
  end

  launches = Hash.new { |h, k| h[k] = [] }
  each_obj = lambda do |obj|
    return unless obj.is_a?(Hash)

    if obj['type'] == 'triage-workstation'
      md = obj['minigameData'].is_a?(Hash) ? obj['minigameData'] : {}
      sid = md['triageSetId']
      launches[sid] << md['stage'] if sid.is_a?(String) && by_id.key?(sid)
    end
    %w[contents itemsHeld].each { |k| Array(obj[k]).each { |child| each_obj.call(child) } }
  end
  rooms = json_data['rooms'].is_a?(Hash) ? json_data['rooms'] : {}
  rooms.each_value do |room|
    next unless room.is_a?(Hash)

    Array(room['objects']).each { |obj| each_obj.call(obj) }
    Array(room['npcs']).each do |npc|
      next unless npc.is_a?(Hash)

      Array(npc['itemsHeld']).each { |obj| each_obj.call(obj) }
    end
  end
  Array(json_data['startItemsInInventory']).each { |obj| each_obj.call(obj) }

  sets.each_with_index do |set, i|
    next unless set.is_a?(Hash)

    prefix = set.dig('outcome', 'setGlobalPrefix')
    next unless prefix.is_a?(String) && !prefix.empty?
    next if prefix.gsub('{stage}', '') =~ /[{}]/

    stages = if prefix.include?('{stage}')
               found = set['id'].is_a?(String) ? launches[set['id']] : []
               (found.empty? ? [nil] : found).map do |stage|
                 if stage.is_a?(String) && !stage.empty?
                   stage
                 elsif set['stage'].is_a?(String) && !set['stage'].empty?
                   set['stage']
                 else
                   'mission'
                 end
               end.uniq
    else
               [nil]
    end
    where = "/social/triageSets[#{i}] (triage starter)"
    pp = set.dig('outcome', 'passPercent')
    suffixes = TRIAGE_BASE_SUFFIXES.dup
    suffixes << 'pass' if pp.is_a?(Integer) && pp.positive?
    stages.each do |stage|
      resolved = stage ? prefix.gsub('{stage}', stage) : prefix
      suffixes.each do |suffix|
        name = "#{resolved}#{suffix}"
        writes[name] << [where, nil] if name.match?(/\A[A-Za-z_][A-Za-z0-9_]*\z/)
      end
    end
  end
end

# name => [[where, value-or-nil], ...] for every write in the mission's ink.
def carry_over_ink_writes(ink_files, repo_root)
  writes = Hash.new { |h, k| h[k] = [] }
  ink_files.each do |f|
    rel = f.sub("#{repo_root}/", '')
    File.readlines(f, encoding: 'UTF-8').each_with_index do |raw, i|
      line = raw.sub(%r{(^|\s)//.*$}, '\1')
      if line =~ /^\s*~\s*(\w+)\s*=\s*(.+?)\s*$/
        var, lit = $1, $2
        writes[var] << ["#{rel}:#{i + 1}", lit[/\A"(.*)"\z/, 1]]
      elsif line =~ /^\s*~\s*(\w+)\s*(?:\+\+|--|\+=|-=)/
        writes[$1] << ["#{rel}:#{i + 1}", nil]
      end
      line.scan(/#\s*set_global:(\w+):([^\s#]*)/) { |n, v| writes[n] << ["#{rel}:#{i + 1}", v] }
      line.scan(/#\s*set_variable:(\w+)(?:=([^\s#]*))?/) { |n, v| writes[n] << ["#{rel}:#{i + 1}", v] }
    end
  end
  writes
end

def carry_over_load_source(scenarios_dir, from)
  return $carry_over_source_cache[[scenarios_dir, from]] if $carry_over_source_cache.key?([scenarios_dir, from])

  dir = File.join(scenarios_dir, from)
  erb = File.join(dir, 'scenario.json.erb')
  plain = File.join(dir, 'scenario.json')
  data = if File.exist?(erb)
           render_erb_to_json(erb)
  elsif File.exist?(plain)
           JSON.parse(File.read(plain))
  end
  $carry_over_source_cache[[scenarios_dir, from]] = data
rescue StandardError => e
  $carry_over_source_cache[[scenarios_dir, from]] = { '__error' => e.message.lines.first.to_s.strip }
end

# imports: the list prepare_carry_over_globals returned. own_globals: this
# mission's globalVariables before the imports were merged in.
def check_carry_over(json_data, repo_root, mission_name, scenarios_dir, imports, own_globals)
  issues = []
  imports = Array(imports)
  exports = json_data['exportGlobals']
  return issues if imports.empty? && exports.nil?

  ink_files = carry_over_ink_files(json_data, repo_root)
  ink_writes = carry_over_ink_writes(ink_files, repo_root)
  json_writes = carry_over_json_writes(json_data)
  own_globals = own_globals.is_a?(Hash) ? own_globals : {}

  # ---- exports (this mission as a source) ----
  unless exports.nil?
    if !exports.is_a?(Array) || !exports.all? { |e| e.is_a?(String) }
      issues << "❌ ERROR: exportGlobals must be a list of global names."
    else
      imported_names = imports.map { |e| carry_over_import_name(e) }.compact.reject { |n| own_globals.key?(n) }
      exports.each do |name|
        if imported_names.include?(name)
          issues << "❌ ERROR: exportGlobals lists '#{name}', which this mission imports. Imports never pass on second-hand; " \
                    "a later mission imports from the original source."
        elsif !own_globals.key?(name)
          issues << "❌ ERROR: exportGlobals lists '#{name}', which is not in this mission's globalVariables."
        elsif ink_writes[name].empty? && json_writes[name].empty?
          issues << "⚠️ WARNING: exported global '#{name}' is never written in this mission (no ink assignment, tag or " \
                    "scenario setter), so every mission that imports it always sees the default."
        end
      end
    end
  end

  # ---- imports (this mission as a reader) ----
  names_seen = {}
  imports.each_with_index do |entry, i|
    at = "importGlobals[#{i}]"
    unless entry.is_a?(Hash) && entry['from'].is_a?(String) && !entry['from'].empty?
      issues << "❌ ERROR: #{at} needs a \"from\" (the source mission's folder name)."
      next
    end
    from = entry['from']
    name = carry_over_import_name(entry)
    completed_form = entry.key?('completed')

    if from == mission_name
      issues << "❌ ERROR: #{at} imports from this mission itself (#{from})."
      next
    end
    if completed_form && (entry.key?('var') || entry.key?('as') || entry.key?('default'))
      issues << "❌ ERROR: #{at}: the \"completed\" form takes only \"from\" and \"completed\" (no var, as or default)."
    end
    if !completed_form && !entry['var'].is_a?(String)
      issues << "❌ ERROR: #{at} needs a \"var\" (a global the source exports) or a \"completed\" name."
      next
    end
    if name.nil?
      issues << "❌ ERROR: #{at}: \"as\" is required when \"from\" (#{from}) doesn't start with an mNN_ or sisNN_ prefix."
      next
    end
    # Server-owned globals (sync deltas R2, 6a) are never written by an import. This literal must
    # track Game::SERVER_OWNED_GLOBAL_NAMES (app/models/break_escape/game.rb); the validator cannot
    # load the Rails constant, so carry_over_server_owned_globals_test guards that the two agree.
    if %w[se_captures].include?(name)
      issues << "❌ ERROR: #{at}: '#{name}' is a server-owned global and cannot be imported."
      next
    end
    if (name !~ CARRY_OVER_NAME_RE && !carry_over_triage_result_name?(json_data, name)) || name.start_with?('global_')
      issues << "❌ ERROR: #{at}: imported name '#{name}' must be lower_snake_case with a prefix (e.g. m06_assets_seized), " \
                "and must not start with global_."
    end
    if own_globals.key?(name)
      issues << "❌ ERROR: #{at}: imported name '#{name}' collides with this mission's own globalVariables."
      next
    end
    if names_seen.key?(name)
      issues << "❌ ERROR: #{at}: imported name '#{name}' is already used by #{names_seen[name]}."
    end
    names_seen[name] = at

    source = carry_over_load_source(scenarios_dir, from)
    if source.nil?
      issues << "❌ ERROR: #{at}: source mission '#{from}' not found (no #{from}/scenario.json.erb next to this mission)."
    elsif source['__error']
      issues << "❌ ERROR: #{at}: source mission '#{from}' failed to render: #{source['__error']}"
    elsif !completed_form
      var = entry['var']
      sglobals = source['globalVariables'].is_a?(Hash) ? source['globalVariables'] : {}
      if !entry.key?('default')
        issues << "❌ ERROR: #{at}: '#{name}' needs a \"default\", the value used when the player never finished #{from}."
      end
      if !sglobals.key?(var)
        issues << "❌ ERROR: #{at}: '#{var}' is not a global in #{from}'s globalVariables."
      else
        unless Array(source['exportGlobals']).include?(var)
          issues << "❌ ERROR: #{at}: #{from} does not list '#{var}' in its exportGlobals. Add it there, so a rename in " \
                    "#{from} is caught."
        end
        if entry.key?('default') && ink_global_value_type(entry['default']) != ink_global_value_type(sglobals[var])
          issues << "❌ ERROR: #{at}: default #{entry['default'].inspect} for '#{name}' is not the same type as " \
                    "#{from}'s own default for '#{var}' (#{sglobals[var].inspect})."
        end
        # String values this mission compares against that the source never assigns.
        if sglobals[var].is_a?(String)
          src_ink = carry_over_ink_writes(carry_over_ink_files(source, repo_root), repo_root)
          src_json = carry_over_json_writes(source)
          known = ([sglobals[var]] + (src_ink[var] + src_json[var]).map(&:last)).compact.map(&:to_s)
          compared = []
          ink_files.each do |f|
            File.read(f, encoding: 'UTF-8').scan(/\b#{Regexp.escape(name)}\s*(?:==|!=)\s*"([^"]*)"/) { |(v)| compared << v }
          end
          json_strings = []
          sw = lambda do |n|
            case n
            when Hash then n.each { |k, v| sw.call(v) unless k == 'importGlobals' }
            when Array then n.each { |v| sw.call(v) }
            when String then json_strings << n
            end
          end
          sw.call(json_data)
          json_strings.each do |s|
            s.scan(/globalVars\.#{Regexp.escape(name)}\s*(?:===|!==|==|!=)\s*['"]([^'"]*)['"]/) { |(v)| compared << v }
          end
          (compared.uniq - known).each do |v|
            issues << "⚠️ WARNING: '#{name}' is compared with \"#{v}\", a value #{from} never assigns to '#{var}' " \
                      "(it assigns #{known.uniq.map(&:inspect).join(', ')})."
          end
        end
      end
    end

    # Read-only: nothing in this mission may write an import.
    (ink_writes[name] + json_writes[name]).each do |where, _|
      issues << "❌ ERROR: imported global '#{name}' is written at #{where}. Imports are read-only: the server drops the " \
                "write, and the value would differ from what was carried in."
    end
  end

  # Solvability: the mission must be finishable with every import at its default.
  imported = names_seen.keys
  unless imported.empty?
    Array(json_data['objectives']).each do |aim|
      next unless aim.is_a?(Hash)
      Array(aim.dig('concludeRequires', 'globals')).each do |g|
        issues << "❌ ERROR: aim '#{aim['aimId']}' concludeRequires.globals uses imported '#{g}'. A player who never finished the " \
                  "source could not end this mission." if imported.include?(g)
      end
    end
    uc_walk = lambda do |node, path|
      case node
      when Hash
        if node['unlockCondition'].is_a?(Hash) && imported.include?(node['unlockCondition']['globalVariable'])
          issues << "❌ ERROR: #{path}/unlockCondition gates on imported '#{node['unlockCondition']['globalVariable']}'. " \
                    "The mission must be solvable with every import at its default."
        end
        if node['eventPattern'].is_a?(String) && node['condition'].is_a?(String)
          hit = imported.find { |g| node['condition'] =~ /(?<![\w])#{Regexp.escape(g)}(?!\w)/ }
          structural = CARRY_OVER_STRUCTURAL_MAPPING_KEYS.select { |k| node.key?(k) }
          if hit && structural.any?
            issues << "⚠️ WARNING: #{path}: eventMapping on #{node['eventPattern']} has a condition on imported '#{hit}' and " \
                      "changes the game (#{structural.join(', ')}). Check in a design review that the mission is still " \
                      "solvable with every import at its default."
          end
        end
        node.each { |k, v| uc_walk.call(v, "#{path}/#{k}") unless %w[importGlobals globalVariables].include?(k) }
      when Array
        node.each_with_index { |v, i| uc_walk.call(v, "#{path}[#{i}]") }
      end
    end
    uc_walk.call(json_data, '')
  end

  issues
end

def check_tooling_pass4c(json_data, repo_root)
  check_stacked_timed_texts(json_data) + check_globals_never_read(json_data, repo_root) + check_credit_sections(json_data) +
    check_ink_global_collisions(json_data, repo_root)
end

# ============================================================================
# DIALOGUE LINT: runs scripts/ink_runtime_check/dialoguelint.mjs over the mission folder.
# Findings are advisory (WARNING in the validator's terms) and never change the exit code.
# ============================================================================

DIALOGUE_LINT_PER_RULE = 4

# dialoguelint.mjs is an ES module importing node: built-ins, which Node 10/12 cannot load (a
# SyntaxError on the first import). Ubuntu 20.04's /usr/bin/node is 10.19, so the lint looks past it.
DIALOGUE_LINT_MIN_NODE = 16

# Major version of a node binary, or nil if it doesn't run.
def node_major_version(bin)
  out, status = Open3.capture2e(bin, '--version')
  status.success? && out[/\Av?(\d+)\./, 1]&.to_i
rescue StandardError
  nil
end

# The node to run the lint with: $BE_NODE, then each node on PATH, then the user-local install
# (~/.local/node/bin/node); the first at DIALOGUE_LINT_MIN_NODE or newer. Returns [path, nil], or
# [nil, reason] when there is none, so the skip is reported rather than silent.
def dialogue_lint_node(env = ENV, home = (Dir.home rescue nil))
  cands = []
  cands << env['BE_NODE'] unless env['BE_NODE'].to_s.empty?
  cands += env['PATH'].to_s.split(File::PATH_SEPARATOR).map { |d| File.join(d, 'node') }
  cands << File.join(home, '.local/node/bin/node') if home
  seen = []
  cands.uniq.each do |f|
    next unless File.file?(f) && File.executable?(f)
    major = node_major_version(f)
    return [f, nil] if major && major >= DIALOGUE_LINT_MIN_NODE
    seen << "#{f} (#{major ? "v#{major}" : 'does not run'})"
  end
  [nil, seen.empty? ? 'no node found' : "node #{DIALOGUE_LINT_MIN_NODE}+ needed, found #{seen.join(', ')}"]
end

def run_dialogue_lint(mission_dir, repo_root)
  node, why = dialogue_lint_node
  unless node
    puts "DIALOGUE LINT skipped: #{why}. Set BE_NODE to a node #{DIALOGUE_LINT_MIN_NODE}+ binary."
    puts
    return nil
  end
  tool = File.join(repo_root, 'scripts/ink_runtime_check/dialoguelint.mjs')
  return nil unless File.exist?(tool)
  out, status = Open3.capture2(node, tool, mission_dir, '--json', chdir: repo_root)
  return nil unless status.success?
  JSON.parse(out)
rescue StandardError
  nil
end

def print_dialogue_lint(report, repo_root)
  rel = ->(p) { p.to_s.sub("#{repo_root}/", '') }
  all = []
  (report['files'] || []).each { |f| f['findings'].each { |x| all << [rel.call(f['file']), x] } }
  (report['texts'] || []).each { |f| f['findings'].each { |x| all << [rel.call(f['file']), x] } }
  puts "DIALOGUE LINT (scripts/ink_runtime_check/dialoguelint.mjs; advisory, does not affect the result)"
  if all.empty?
    puts "✓ No dialogue lint findings"
    puts
    return
  end
  puts "⚠️ WARNING: #{all.size} dialogue lint finding(s)"
  counts = report['counts'] || all.group_by { |_, x| x['rule'] }.transform_values(&:size)
  puts "  Totals by rule: " + counts.sort_by { |_, v| -v }.map { |k, v| "#{k}=#{v}" }.join(' ')
  # Rules with error-level hits (hard caps, standing rules such as voiced-variable) list first
  all.group_by { |_, x| x['rule'] }.sort_by { |_, v| [v.any? { |_, x| x['level'] == 'error' } ? 0 : 1, -v.size] }.each do |rule, list|
    puts "  #{rule} (#{list.size}):"
    list.first(DIALOGUE_LINT_PER_RULE).each do |file, x|
      detail =
        if x['words'] then "#{x['words']} words (cap #{x['cap'] || 15})"
        elsif x['note'] then x['note'].to_s
        elsif x['match'] then "\"#{x['match']}\""
        else ''
        end
      detail = "#{detail[0, 150]}..." if detail.length > 150
      text = x['text'].to_s
      text = "#{text[0, 60]}..." if text.length > 60
      puts "    #{x['level'].to_s.upcase.ljust(5)} #{file}:#{x['line']}  #{detail}  | #{text}"
    end
    puts "    ...and #{list.size - DIALOGUE_LINT_PER_RULE} more" if list.size > DIALOGUE_LINT_PER_RULE
  end
  puts
end

# ============================================================================
# ROOM GEOMETRY CHECK
#
# Faithful Ruby port of the game engine's room-layout algorithm
# (public/break_escape/js/core/rooms.js: calculateRoomPositions +
# validateNoOverlaps). Rooms carry no explicit world position — the engine
# lays them out breadth-first from startRoom, placing each room edge-to-edge
# with the first neighbour that reaches it, using the real tile dimensions
# from each room type's Tiled tilemap (NOT the optional JSON `dimensions`
# field, which the engine ignores). We reproduce that placement here and
# flag any pair of rooms whose axis-aligned bounding boxes overlap in world
# space — the same defect the engine's own validateNoOverlaps detects, but
# usable at authoring time without launching Phaser.
# ============================================================================

GEOM_TILE_SIZE   = 32
GEOM_GU_W_PX     = 160  # GRID_UNIT_WIDTH_TILES(5)  * TILE_SIZE
GEOM_GU_H_PX     = 128  # GRID_UNIT_HEIGHT_TILES(4) * TILE_SIZE
GEOM_VISUAL_TOP  = 2    # VISUAL_TOP_TILES

# A Tiled map property, read the way desk-footprints.js mapProperty reads it: Tiled's
# array of {name, type, value}, or a plain object; nil when absent.
def tiled_map_property(map_json, name)
  props = map_json.is_a?(Hash) ? map_json['properties'] : nil
  case props
  when Array then props.find { |p| p.is_a?(Hash) && p['name'] == name }&.fetch('value', nil)
  when Hash then props[name]
  end
end

# Desk collision boxes per map (SEAT_BOX_PLAN.md slice 2): which of the scenario's room maps
# have opted in to footprint boxes (map property deskBoxes = footprint) and which are legacy.
# Returns { footprint: [types], legacy: [types] }; types whose map can't be found are skipped.
def desk_box_maps(json_data, repo_root)
  type_map = geom_type_to_tilemap(repo_root)
  out = { footprint: [], legacy: [] }
  types = (json_data['rooms'] || {}).values.map { |r| r.is_a?(Hash) ? r['type'] : nil }.compact.uniq.sort
  types.each do |type|
    file = type_map[type]
    path = file && File.join(repo_root, 'public/break_escape/assets/rooms', file)
    next unless path && File.exist?(path)
    map = JSON.parse(File.read(path)) rescue nil
    next unless map
    (tiled_map_property(map, 'deskBoxes') == 'footprint' ? out[:footprint] : out[:legacy]) << type
  end
  out
end

COMPASS8_ANGLE = %w[south south-east east north-east north north-west west south-west].each_with_index.to_h { |n, i| [n, i * 45] }.freeze

# Static chairs' fixed facings, read from seating.js (STATIC_SEATS, HOSPITAL_S/N), by texture name.
def static_seat_facings(repo_root)
  js = File.join(repo_root, 'public/break_escape/js/systems/seating.js')
  return {} unless File.exist?(js)
  src = File.read(js)
  alias_facing = {}
  src.scan(/const (HOSPITAL_[SN]) = \{ facing: '([\w-]+)'/) { |n, f| alias_facing[n] = f }
  body = src[/const STATIC_SEATS = \{(.*?)^\};/m, 1].to_s
  out = {}
  body.scan(/['"]?([\w-]+)['"]?: (?:\{ facing: '([\w-]+)'|(HOSPITAL_[SN]))/) { |k, f, a| out[k] = f || alias_facing[a] }
  out
end

# Warnings for a coordinate needsHome whose `facing` is more than 67 degrees off a static chair within
# 36 px of the home: seating.js refuses such a chair (it cannot turn), so the NPC stands or fetches a swivel.
def home_facing_static_chair_conflicts(json_data, repo_root, room_npcs)
  facings = static_seat_facings(repo_root)
  return [] if facings.empty?
  type_map = geom_type_to_tilemap(repo_root)
  out = []
  room_npcs.each do |e|
    h = e[:npc]['needsHome']
    next unless h.is_a?(Hash) && COMPASS8_ANGLE.key?(h['facing']) && h['room']
    type = (json_data['rooms'] || {}).dig(h['room'], 'type')
    file = type && type_map[type]
    path = file && File.join(repo_root, 'public/break_escape/assets/rooms', file)
    next unless path && File.exist?(path)
    map = JSON.parse(File.read(path)) rescue next
    hx = h['x'].to_f * GEOM_TILE_SIZE
    hy = h['y'].to_f * GEOM_TILE_SIZE
    sets = (map['tilesets'] || []).select { |t| t['firstgid'] }.sort_by { |t| -t['firstgid'] }
    (map['layers'] || []).each do |layer|
      (layer['objects'] || []).each do |o|
        next unless o['gid']
        ts = sets.find { |t| t['firstgid'] <= o['gid'] }
        img = ts && (ts['tiles'] || []).find { |t| t['id'] == o['gid'] - ts['firstgid'] }&.fetch('image', nil)
        facing = img && facings[File.basename(img, '.png')]
        next unless facing
        next if Math.hypot(o['x'].to_f + o['width'].to_f / 2 - hx, o['y'].to_f - 4 - hy) > 36
        d = (COMPASS8_ANGLE[h['facing']] - COMPASS8_ANGLE[facing]).abs % 360
        d = 360 - d if d > 180
        next if d <= 67
        out << "NPC '#{e[:npc]['id']}' needsHome facing '#{h['facing']}' contradicts the static chair '#{File.basename(img, '.png')}' " \
               "(faces #{facing}) at its home: a static chair more than 67 degrees off the facing is refused, so the NPC stands or fetches a loose swivel chair."
      end
    end
  end
  out
end

# Build the room-type -> tilemap-file map from the engine's loader.
def geom_type_to_tilemap(repo_root)
  game_js = File.join(repo_root, 'public/break_escape/js/core/game.js')
  return {} unless File.exist?(game_js)
  map = {}
  File.read(game_js).scan(/tilemapTiledJSON\('([^']+)',\s*'rooms\/([^']+)'\)/) do |type, file|
    map[type] = file
  end
  map
end

# Real tile dimensions for a room type, read from its Tiled tilemap.
# Returns nil if the tilemap can't be located (so the check can degrade
# gracefully rather than guessing).
def geom_room_dimensions(type, type_map, repo_root, cache)
  return cache[type] if cache.key?(type)
  file = type_map[type]
  dims = nil
  if file
    path = File.join(repo_root, 'public/break_escape/assets/rooms', file)
    if File.exist?(path)
      tj = JSON.parse(File.read(path)) rescue nil
      if tj && tj['width'] && tj['height']
        wt = tj['width']; ht = tj['height']
        dims = {
          width_px: wt * GEOM_TILE_SIZE,
          # Vertical extent used for both placement and overlap is the
          # "stacking height" — full height minus the top visual wall rows.
          stack_px: (ht - GEOM_VISUAL_TOP) * GEOM_TILE_SIZE,
          w_tiles: wt, h_tiles: ht
        }
      end
    end
  end
  cache[type] = dims
  dims
end

def geom_align(x, y)
  [(x.to_f / GEOM_GU_W_PX).floor * GEOM_GU_W_PX,
   (y.to_f / GEOM_GU_H_PX).floor * GEOM_GU_H_PX]
end

def geom_world_to_grid_sum(x, y)
  (x.to_f / GEOM_GU_W_PX).floor + (y.to_f / GEOM_GU_H_PX).floor
end

# Parity-based edge alignment for north/south single placement when the two
# rooms differ in width (mirrors positionNorth/SouthSingle).
def geom_edge_x(cd, kd, cpos)
  return cpos[0] if cd[:width_px] == kd[:width_px]
  sum = geom_world_to_grid_sum(cpos[0], cpos[1])
  use_right = ((sum % 2) + 2) % 2 == 1
  use_right ? cpos[0] + cd[:width_px] - kd[:width_px] : cpos[0]
end

def geom_place_single(dir, cur, con, cpos, dims)
  cd = dims[cur]; kd = dims[con]
  case dir
  when 'north' then geom_align(geom_edge_x(cd, kd, cpos), cpos[1] - kd[:stack_px])
  when 'south' then geom_align(geom_edge_x(cd, kd, cpos), cpos[1] + cd[:stack_px])
  when 'east'  then geom_align(cpos[0] + cd[:width_px], cpos[1])
  when 'west'  then geom_align(cpos[0] - kd[:width_px], cpos[1])
  end
end

# Multiple rooms sharing one direction are spread along the shared edge,
# with a min 1-GU overlap nudge against the parent (mirrors
# positionNorth/South/East/WestMultiple).
def geom_place_multiple(dir, cur, list, cpos, dims)
  cd = dims[cur]
  out = {}
  if dir == 'north' || dir == 'south'
    total = list.sum { |r| dims[r][:width_px] }
    ax = geom_align(cpos[0] + (cd[:width_px] - total) / 2.0, 0)[0]
    min_ov = GEOM_GU_W_PX
    first = dims[list.first]
    first_ov = [ax + first[:width_px], cpos[0] + cd[:width_px]].min - [ax, cpos[0]].max
    ax = geom_align(cpos[0] - first[:width_px] + min_ov, 0)[0] if first_ov < min_ov
    last = dims[list.last]
    last_start = ax + total - last[:width_px]
    last_ov = [ax + total, cpos[0] + cd[:width_px]].min - [last_start, cpos[0]].max
    ax = geom_align(cpos[0] + cd[:width_px] - total - last[:width_px] + min_ov, 0)[0] if last_ov < min_ov
    cx = ax
    ay = dir == 'south' ? geom_align(0, cpos[1] + cd[:stack_px])[1] : nil
    list.each do |rid|
      kd = dims[rid]
      ry = dir == 'north' ? geom_align(0, cpos[1] - kd[:stack_px])[1] : ay
      out[rid] = [cx, ry]
      cx += kd[:width_px]
    end
  else # east / west
    total = list.sum { |r| dims[r][:stack_px] }
    ay = geom_align(0, cpos[1] + (cd[:stack_px] - total) / 2.0)[1]
    min_ov = GEOM_GU_H_PX
    first = dims[list.first]
    first_ov = [ay + first[:stack_px], cpos[1] + cd[:stack_px]].min - [ay, cpos[1]].max
    ay = geom_align(0, cpos[1] - first[:stack_px] + min_ov)[1] if first_ov < min_ov
    last = dims[list.last]
    last_start = ay + total - last[:stack_px]
    last_ov = [ay + total, cpos[1] + cd[:stack_px]].min - [last_start, cpos[1]].max
    ay = geom_align(0, cpos[1] + cd[:stack_px] - total - last[:stack_px] + min_ov)[1] if last_ov < min_ov
    cy = ay
    list.each do |rid|
      kd = dims[rid]
      x = dir == 'east' ? geom_align(cpos[0] + cd[:width_px], 0)[0] : geom_align(cpos[0] - kd[:width_px], 0)[0]
      out[rid] = [x, cy]
      cy += kd[:stack_px]
    end
  end
  out
end

def geom_boxes_overlap(a, b, positions, dims)
  p1 = positions[a]; d1 = dims[a]
  p2 = positions[b]; d2 = dims[b]
  !(p1[0] + d1[:width_px] <= p2[0] ||
    p2[0] + d2[:width_px] <= p1[0] ||
    p1[1] + d1[:stack_px]  <= p2[1] ||
    p2[1] + d2[:stack_px]  <= p1[1])
end

# Returns a list of issue strings (warnings). Empty when the layout is clean
# or when tilemaps are unavailable (skips gracefully with one note).
def check_room_geometry(json_data, repo_root)
  issues = []
  rooms = json_data['rooms']
  start = json_data['startRoom']
  return issues unless rooms.is_a?(Hash) && start && rooms[start]

  type_map = geom_type_to_tilemap(repo_root)
  cache = {}
  dims = {}
  missing = []
  rooms.each do |id, r|
    d = geom_room_dimensions(r['type'], type_map, repo_root, cache)
    if d.nil?
      missing << (r['type'] || '(no type)')
    else
      dims[id] = d
    end
  end

  unless missing.empty?
    issues << "💡 SUGGESTION: Room geometry overlap check skipped — could not read tilemap dimensions for room type(s): #{missing.uniq.join(', ')}."
    return issues
  end

  # Breadth-first placement from startRoom (mirrors calculateRoomPositions).
  positions = { start => [0, 0] }
  processed = { start => true }
  queue = [start]
  until queue.empty?
    cid = queue.shift
    conns = rooms[cid]['connections']
    next unless conns.is_a?(Hash)
    cpos = positions[cid]
    %w[north south east west].each do |dir|
      con = conns[dir]
      next unless con
      list = (con.is_a?(Array) ? con : [con]).reject { |rid| processed[rid] || !rooms[rid] }
      next if list.empty?
      placed = list.size == 1 ? { list[0] => geom_place_single(dir, cid, list[0], cpos, dims) } \
                              : geom_place_multiple(dir, cid, list, cpos, dims)
      placed.each do |rid, pos|
        positions[rid] = pos
        processed[rid] = true
        queue.push(rid)
      end
    end
  end

  ids = positions.keys
  ids.combination(2).each do |a, b|
    next unless geom_boxes_overlap(a, b, positions, dims)
    pa = positions[a]; pb = positions[b]
    issues << "⚠️ WARNING: Rooms '#{a}' and '#{b}' overlap in world-space layout " \
              "('#{a}' at grid (#{(pa[0]/GEOM_GU_W_PX)},#{(pa[1]/GEOM_GU_H_PX)}), " \
              "'#{b}' at grid (#{(pb[0]/GEOM_GU_W_PX)},#{(pb[1]/GEOM_GU_H_PX)})). " \
              "The engine lays rooms out breadth-first from startRoom by tilemap size; " \
              "check the connection directions/room-size mix so branches don't collide."
  end
  issues
end

# ─────────────────────────────────────────────────────────────────────────────
# Engine-limit checks: patterns that validate against the schema but silently
# do nothing (or the wrong thing) at runtime. See scenarios/PASS2_APPROVAL_LOG.md.
# ─────────────────────────────────────────────────────────────────────────────

# Conditions evaluated by an &&-only evaluator can't take '||' or parentheses.
# allow_includes: npc-manager.js safeEvaluateCondition also accepts
# "<value|data.x|globalVars.x>.includes('…')" terms; scenario-timer.js and
# conditional-text.js don't. Credits/music-event conditions are run through
# `new Function` (scenario-music-events.js) and can use any JS, so they are
# deliberately not checked.
def unsupported_condition_syntax(condition, allow_includes:)
  return nil unless condition.is_a?(String)
  stripped = allow_includes ? condition.gsub(/\.includes\((['"])[^'"]*\1\)/, '.includes()') : condition
  stripped = stripped.gsub('.includes()', '') if allow_includes
  problems = []
  problems << "'||'" if stripped.include?('||')
  problems << 'parentheses' if stripped.match?(/[()]/)
  problems.empty? ? nil : problems.join(' and ')
end

# requiresItemCondition and its hint variants are evaluated by evaluateGlobalCondition
# (utils/conditional-text.js): '&&'-joined terms, each globalVars.x, !globalVars.x, or
# globalVars.x with ===, !==, >, <, >= or <= and a true/false/null/number/quoted literal.
# With '||' or parentheses it quietly reads the first globalVars name, so a bad condition
# can refuse the use for good. Returns a description of the problem, or nil.
ITEM_CONDITION_TERM = /\A(!\s*globalVars\.\w+|globalVars\.\w+(\s*(===|!==|>=|<=|>|<)\s*(true|false|null|-?\d+(\.\d+)?|'[^'"]*'|"[^'"]*"))?)\z/
def item_condition_problem(condition)
  return 'is not a string' unless condition.is_a?(String)
  return 'is empty' if condition.strip.empty?
  if (bad = unsupported_condition_syntax(condition, allow_includes: false))
    return "uses #{bad}"
  end
  condition.split('&&').each do |term|
    return "has the term \"#{term.strip}\", which is not globalVars.x, !globalVars.x or globalVars.x with === !== > < >= <= and a literal" unless term.strip.match?(ITEM_CONDITION_TERM)
  end
  nil
end

# R29 (VM integration review): every VM flag a mission's stations accept must be
# load-bearing for the ending. A flag counts when the server can't conclude
# without it: a submit_flags task matching it is in the conclusion aim's
# concludeRequires.tasksCompleted, a flag lock taking it completes such a task
# (completesTask), or its reward / launch choice sets a global listed in
# concludeRequires.globals (for a launch device both choices must set it).
# A flag that is none of these can be dropped from the critical path by a later
# edit without anything noticing (m01 flag_3 was load-bearing only through the
# finale's launch aim). Warning level: an optional or bonus flag is a valid
# design, and says so in the message. hintOnlyFlags are not accepted, so they are
# skipped. Scenarios with no concludeRequires are covered by the gate check.
def check_vm_flags_load_bearing(json_data)
  issues = []
  aim = Array(json_data['objectives']).find { |a| a.is_a?(Hash) && a['missionConclusion'] }
  return issues unless aim && aim['concludeRequires'].is_a?(Hash)

  gate_tasks = Array(aim['concludeRequires']['tasksCompleted'])
  gate_globals = Array(aim['concludeRequires']['globals'])
  tasks = Array(json_data['objectives']).flat_map { |a| Array(a.is_a?(Hash) ? a['tasks'] : nil) }
  gate_targets = tasks.select { |t| t['type'] == 'submit_flags' && gate_tasks.include?(t['taskId']) }
                      .flat_map { |t| Array(t['targetFlags']) }

  # Literal flag value -> "vm:flag_N", from the top-level flags block (vm_flags_json)
  literal_refs = {}
  (json_data['flags'].is_a?(Hash) ? json_data['flags'] : {}).each do |vm, by_n|
    next unless by_n.is_a?(Hash)
    by_n.each { |n, value| literal_refs[value.to_s.downcase] = "#{vm}:#{n}" if value.is_a?(String) }
  end
  ref_of = ->(entry) { entry.to_s.match?(/\A[\w.-]+:flag_\d+\z/) ? entry.to_s : literal_refs[entry.to_s.downcase] }

  sets_gate_global = lambda do |hash|
    hash.is_a?(Hash) && hash.any? { |k, v| gate_globals.include?(k) && v }
  end

  stations = []
  locks = []
  walk = lambda do |obj, path|
    return unless obj.is_a?(Hash)
    if %w[flag-station flag_station launch-device].include?(obj['type']) && obj['flags'].is_a?(Array)
      stations << [obj, path]
    elsif obj['lockType'] == 'flag' && obj['requires'].is_a?(String) && !obj['requires'].empty?
      locks << [obj, path]
    end
    Array(obj['itemsHeld']).each_with_index { |i, idx| walk.call(i, "#{path}/itemsHeld[#{idx}]") }
    Array(obj['contents']).each_with_index { |i, idx| walk.call(i, "#{path}/contents[#{idx}]") }
  end
  (json_data['rooms'] || {}).each do |room_id, room|
    next unless room.is_a?(Hash)
    Array(room['objects']).each_with_index { |o, i| walk.call(o, "rooms/#{room_id}/objects[#{i}]") }
    Array(room['npcs']).each_with_index { |n, i| walk.call(n, "rooms/#{room_id}/npcs[#{i}]") }
  end

  stations.each do |obj, path|
    vm = Array(obj['acceptsVms']).first
    key = obj['id'].to_s.empty? ? obj['name'] : obj['id']
    choice_ok = obj['type'] == 'launch-device' &&
                sets_gate_global.call(obj.dig('onLaunch', 'setGlobal')) &&
                sets_gate_global.call(obj.dig('onAbort', 'setGlobal'))
    obj['flags'].each_with_index do |entry, i|
      ids = []
      ids << "#{vm}-flag#{i + 1}" if vm
      ids << "#{key}:#{vm}-flag#{i + 1}" if vm && key
      ref = ref_of.call(entry)
      ids << ref if ref
      next if (ids & gate_targets).any? || choice_ok

      reward = obj['flagRewards'].is_a?(Array) ? obj['flagRewards'][i] : nil
      next if reward.is_a?(Hash) && reward['type'] == 'set_global' && gate_globals.include?(reward['key'])

      label = ref || "#{vm}-flag#{i + 1}"
      issues << "⚠️ WARNING: '#{path}' (#{obj['name'] || key}) accepts VM flag #{label}, but nothing the " \
                "conclusion aim's concludeRequires needs depends on it: no submit_flags task in " \
                "tasksCompleted targets it (#{ids.map { |x| "\"#{x}\"" }.join(' or ')}), and it sets no " \
                "concludeRequires global. The mission can conclude without it, and a later edit could drop " \
                "it from the critical path unnoticed (R29). Add its task to concludeRequires.tasksCompleted, " \
                "or leave it out only if this flag is meant to be optional."
    end
  end

  locks.each do |obj, path|
    ref = ref_of.call(obj['requires']) || obj['requires']
    next if gate_targets.include?(ref)
    next if obj['completesTask'] && gate_tasks.include?(obj['completesTask'])
    next if Array(obj['flagRewards']).any? { |r| r.is_a?(Hash) && r['type'] == 'set_global' && gate_globals.include?(r['key']) }

    issues << "⚠️ WARNING: '#{path}' (#{obj['name'] || obj['id']}) is a flag lock taking #{ref}, but the " \
              "conclusion aim's concludeRequires doesn't depend on it (no gate task targets it or is its " \
              "completesTask). The mission can conclude without this VM flag (R29). Add its task to " \
              "concludeRequires.tasksCompleted, or leave it out only if the flag is meant to be optional."
  end

  issues
end

def check_engine_limits(json_data)
  issues = []
  rooms = json_data['rooms'].is_a?(Hash) ? json_data['rooms'] : {}
  globals = json_data['globalVariables'].is_a?(Hash) ? json_data['globalVariables'].keys : []

  task_types = {}
  Array(json_data['objectives']).each do |aim|
    Array(aim.is_a?(Hash) ? aim['tasks'] : nil).each do |t|
      task_types[t['taskId']] = t['type'] if t.is_a?(Hash) && t['taskId']
    end
  end

  # 2. eventMapping conditions (NPC mappings go through safeEvaluateCondition)
  # 5. completeTask on a collect_items task from an eventMapping
  check_mappings = lambda do |holder_path, mappings|
    Array(mappings).each_with_index do |m, i|
      next unless m.is_a?(Hash)
      mp = "#{holder_path}/eventMappings[#{i}]"
      if (bad = unsupported_condition_syntax(m['condition'], allow_includes: true))
        issues << "❌ ERROR: '#{mp}' condition \"#{m['condition']}\" uses #{bad}. npc-manager.js " \
                  "safeEvaluateCondition supports only '&&'-joined simple terms (value/data.x[.y]/globalVars.x " \
                  "with ===, !==, >, <, >=, <= against a literal or a data./globalVars. operand, '!' or .includes('…')), so this evaluates to false and the " \
                  "mapping never fires. Split it into simpler mappings, one per '||' branch."
      end
      ct = m['completeTask']
      if ct.is_a?(String) && task_types[ct] == 'collect_items'
        issues << "⚠️ WARNING: '#{mp}' completeTask '#{ct}' targets a collect_items task. The mapping can " \
                  "reach the server before the pickup POST, which rejects it ('Insufficient items collected') " \
                  "and reverts the task. Let the pickup complete a collect_items task, or make the task a manual type."
      end
    end
  end

  rooms.each do |room_id, room|
    next unless room.is_a?(Hash)
    Array(room['npcs']).each do |npc|
      next unless npc.is_a?(Hash)
      check_mappings.call("rooms/#{room_id}/npcs(#{npc['id']})", npc['eventMappings'])
    end
    Array(room['objects']).each do |obj|
      next unless obj.is_a?(Hash)
      check_mappings.call("rooms/#{room_id}/objects(#{obj['id'] || obj['name']})", obj['eventMappings']) if obj['eventMappings']
    end
  end

  # Timer conditions and text/sprite/observation variants use the &&-only
  # evaluator in scenario-timer.js / conditional-text.js (no '||', no parens).
  Array(json_data['timers']).each_with_index do |t, i|
    next unless t.is_a?(Hash)
    if (bad = unsupported_condition_syntax(t['condition'], allow_includes: false))
      issues << "❌ ERROR: 'timers[#{i}]' condition \"#{t['condition']}\" uses #{bad}. scenario-timer.js " \
                "_evaluateCondition supports only '&&'-joined terms (globalVars.x, !globalVars.x, ===, !==, >, <, >=, <=); " \
                "'||' and parentheses are mis-read (the first globalVars name wins)."
    end
  end

  # Generic walk: complete_task without taskId (3), notes given by flagRewards (6),
  # setVariable arithmetic strings (9), variant conditions.
  notes_re = /\Anotes\d*\z/
  walk = nil
  walk = lambda do |node, path, holder_items|
    case node
    when Array
      node.each_with_index { |v, i| walk.call(v, "#{path}[#{i}]", holder_items) }
    when Hash
      if node['type'] == 'complete_task' && node['taskId'].to_s.strip.empty?
        hint = node['task_id'] ? " It has 'task_id', which the engine does not read; rename it to 'taskId'." : ''
        issues << "❌ ERROR: '#{path}' is a complete_task action with no 'taskId'. apply-actions.js reads " \
                  "action.taskId, so this does nothing at runtime.#{hint}"
      end

      if node['flagRewards'].is_a?(Array)
        held = Array(node['itemsHeld']).select { |h| h.is_a?(Hash) }
        node['flagRewards'].each_with_index do |r, i|
          next unless r.is_a?(Hash) && r['type'] == 'give_item'
          matches = held.select { |h| (r['item_type'] && h['type'] == r['item_type']) || (r['item_name'] && h['name'] == r['item_name']) }
          if matches.any? { |h| notes_re.match?(h['type'].to_s) } || notes_re.match?(r['item_type'].to_s)
            issues << "⚠️ WARNING: '#{path}/flagRewards[#{i}]' gives a notes-type item " \
                      "('#{r['item_name'] || r['item_type']}'). inventory.js addToInventory skips notes types that arrive " \
                      "outside the notes minigame, so the player never sees it (not in the inventory, not in the notepad). " \
                      "Use type 'text_file' instead."
          end
        end
      end

      if node['setVariable'].is_a?(Hash)
        node['setVariable'].each do |var, val|
          next unless val.is_a?(String)
          m = val.match(/\A\s*(\w+)\s*[+-]/)
          if m && globals.include?(m[1])
            issues << "⚠️ WARNING: '#{path}/setVariable' sets '#{var}' to the string \"#{val}\". setVariable assigns " \
                      "values literally, so this stores that text instead of doing arithmetic. Set a number, or " \
                      "use separate flags per step."
          end
        end
      end

      # requiresItemHintVariants is read only in the requiresItem refusal (interactions.js),
      # so without requiresItem the hints are authored and never shown.
      if node['requiresItemHintVariants'].is_a?(Array) && !node['requiresItemHintVariants'].empty? &&
         (node['requiresItem'].nil? || node['requiresItem'] == '' || node['requiresItem'] == [])
        issues << "⚠️ WARNING: '#{path}' has requiresItemHintVariants but no requiresItem, so none of those hints " \
                  "is ever shown. Add requiresItem (with triggerOnInteract), or use observationVariants or " \
                  "textVariants for text that does not depend on a carried item."
      end

      # requiresItemCondition (interactions.js, through requires-item-hint.js) gates the use of a
      # held item on a globals condition. Only the requiresItem + triggerOnInteract branch reads it.
      cond_hint_fields = %w[requiresItemConditionHint requiresItemConditionHintVariants]
      if node.key?('requiresItemCondition')
        if (problem = item_condition_problem(node['requiresItemCondition']))
          issues << "❌ ERROR: '#{path}/requiresItemCondition' #{problem}. conditional-text.js evaluateGlobalCondition " \
                    "supports only '&&'-joined terms; anything else is mis-read, so the use could be refused for good."
        else
          node['requiresItemCondition'].scan(/globalVars\.(\w+)/).flatten.uniq.each do |gv|
            next if globals.include?(gv) || gv.match?(/\A(\w+)_(screen_locked|owner_away|accessed)\z/)
            issues << "⚠️ WARNING: '#{path}/requiresItemCondition' uses globalVars.#{gv}, which is not in globalVariables " \
                      "and is not a workstation global (<id>_screen_locked, _owner_away, _accessed). Declare it, or the " \
                      "condition reads a name nothing is known to set."
          end
        end
        if node['requiresItem'].nil? || node['requiresItem'] == '' || node['requiresItem'] == []
          issues << "⚠️ WARNING: '#{path}' has requiresItemCondition but no requiresItem, so the condition is never read."
        elsif !node['triggerOnInteract'].is_a?(Array) || node['triggerOnInteract'].empty?
          issues << "⚠️ WARNING: '#{path}' has requiresItemCondition but no triggerOnInteract. Only the triggerOnInteract " \
                    "branch of interactions.js reads it (a networkJack or other interaction ignores it), so it is never applied."
        end
      elsif cond_hint_fields.any? { |f| node.key?(f) && !(node[f].respond_to?(:empty?) && node[f].empty?) }
        issues << "⚠️ WARNING: '#{path}' has requiresItemConditionHint(Variants) but no requiresItemCondition, so those hints are never shown."
      end

      %w[observationVariants spriteVariants textVariants requiresItemHintVariants requiresItemConditionHintVariants postitNoteVariants].each do |vk|
        Array(node[vk]).each_with_index do |v, i|
          next unless v.is_a?(Hash)
          if vk == 'requiresItemConditionHintVariants' && v.key?('condition')
            # Same grammar as requiresItemCondition itself (evaluateGlobalCondition).
            if (problem = item_condition_problem(v['condition']))
              issues << "❌ ERROR: '#{path}/#{vk}[#{i}]' condition \"#{v['condition']}\" #{problem}. conditional-text.js " \
                        "supports only '&&'-joined terms of the globalVars.x / !globalVars.x / comparison forms."
            end
            next
          end
          if vk == 'postitNoteVariants' && !(v['submitText'].is_a?(String) && !v['submitText'].strip.empty?)
            issues << "❌ ERROR: '#{path}/#{vk}[#{i}]' needs a non-empty submitText (the line a submit shows, with no server check): " \
                      "the note view has no lock, and without the line the engine refuses to open it."
          end
          if (bad = unsupported_condition_syntax(v['condition'], allow_includes: false))
            issues << "❌ ERROR: '#{path}/#{vk}[#{i}]' condition \"#{v['condition']}\" uses #{bad}. conditional-text.js " \
                      "supports only '&&'-joined terms; '||' and parentheses are mis-read."
          end
        end
      end

      if node['postitNoteVariants']
        if node['type'] != 'pc' || node['lockType']
          issues << "❌ ERROR: '#{path}' has postitNoteVariants but is #{node['type'] != 'pc' ? "type '#{node['type']}', not 'pc'" : "a PC with lockType '#{node['lockType']}'"}. " \
                    "Only a plain PC (no lockType) shows the note, so it would never appear."
        end
        if node['locked'] == true
          issues << "❌ ERROR: '#{path}' has postitNoteVariants and locked: true. The note view opens in place of the unlock, so the PC could never be opened."
        end
        if node['triggerOnInteract'].is_a?(Array) && !node['triggerOnInteract'].empty?
          issues << "❌ ERROR: '#{path}' has postitNoteVariants and a non-empty triggerOnInteract. The note view pre-empts it while a note is up."
        end
      end

      node.each do |k, v|
        next if k == 'objectives' && path.empty?
        walk.call(v, path.empty? ? k.to_s : "#{path}/#{k}", holder_items)
      end
    end
  end
  walk.call(json_data.reject { |k, _| k == 'objectives' }, '', nil)

  issues.concat(check_or_in_global_conditions(json_data))
  issues.concat(check_action_conditions(json_data))
  issues
end

# A scenario action's `condition` (apply-actions.js). The client reads it strictly
# (utils/global-condition.js parseActionCondition): anything outside the grammar below
# does not hold, so the action is silently never run. This is the same grammar, term
# by term, so what passes here is what the engine evaluates.
# Whitespace is the ASCII set only, as in the engine: Ruby's strip also drops NUL, and
# JavaScript's \s and trim() also take Unicode spaces, so neither side uses them.
ACTION_CONDITION_NAME = /\A(![ \t\n\r\f\v]*)*globalVars\.\w+\z/
ACTION_CONDITION_COMPARE = /\AglobalVars\.\w+[ \t\n\r\f\v]*(===|!==|>=|<=|>|<)[ \t\n\r\f\v]*(true|false|null|-?\d+(?:\.\d+)?|'[^'"]*'|"[^'"]*")\z/
ACTION_CONDITION_TRIM = /\A[ \t\n\r\f\v]+|[ \t\n\r\f\v]+\z/
ACTION_LIST_KEYS = %w[actions triggerOnInteract onConfirm completionActions flagRewards].freeze

# nil when the condition is in the grammar, else what is wrong with it.
def action_condition_problem(condition)
  return "is not a string (#{condition.inspect})" unless condition.is_a?(String)
  return 'is empty' if condition.gsub(ACTION_CONDITION_TRIM, '').empty?
  condition.split('||', -1).each do |alt|
    return "has an empty term (a stray '&&' or '||')" if alt.gsub(ACTION_CONDITION_TRIM, '').empty?
    alt.split('&&', -1).each do |term|
      t = term.gsub(ACTION_CONDITION_TRIM, '')
      return "has an empty term (a stray '&&' or '||')" if t.empty?
      next if t.match?(ACTION_CONDITION_NAME) || t.match?(ACTION_CONDITION_COMPARE)
      return "has a term the engine cannot read: \"#{t}\""
    end
  end
  nil
end

# Every action list the engine runs through applyActions: timers[].actions,
# triggerOnInteract, onInteract.actions, confirm_action onConfirm, the ESD minigame's
# completionActions and conditionalActions[].actions, and flagRewards. An entry of a
# conditionalActions list is not an action (its own `condition` belongs to the
# minigame), so only the entries of the keys above are read.
def check_action_conditions(json_data)
  issues = []
  declared = (json_data['globalVariables'] || {}).keys
  walk = nil
  walk = lambda do |node, path|
    case node
    when Array
      node.each_with_index { |v, i| walk.call(v, "#{path}[#{i}]") }
    when Hash
      node.each do |k, v|
        child = path.empty? ? k.to_s : "#{path}/#{k}"
        if ACTION_LIST_KEYS.include?(k) && v.is_a?(Array)
          v.each_with_index do |action, i|
            next unless action.is_a?(Hash) && action.key?('condition') && action.key?('type')
            where = "'#{child}[#{i}]' (#{action['type']})"
            cond = action['condition']
            if k == 'flagRewards'
              issues << "❌ ERROR: #{where} is a flag reward with a 'condition'. The server applies flag rewards " \
                        "and does not read an action's condition, so the reward would be skipped on the page and " \
                        "granted on the server. Remove the condition; gate the reward by which flag earns it."
              next
            end
            if (problem = action_condition_problem(cond))
              issues << "❌ ERROR: #{where} condition #{problem}. An action's condition is joined by '&&' and '||' " \
                        "(no parentheses) from terms of the form globalVars.x, !globalVars.x, or globalVars.x " \
                        "===, !==, >, <, >=, <= true, false, null, a number or a quoted string. The engine " \
                        "(global-condition.js parseActionCondition) treats anything else as not holding, so this " \
                        "action never runs."
              next
            end
            cond.scan(/globalVars\.(\w+)/).flatten.uniq.each do |gv|
              next if declared.include?(gv)
              issues << "⚠️ WARNING: #{where} condition uses globalVars.#{gv}, which is not in globalVariables. " \
                        "Declare it, or the condition reads a name nothing is known to set."
            end
            if action['type'] == 'give_item'
              issues << "⚠️ WARNING: #{where} is a give_item with a 'condition'. The server does not read the condition: " \
                        "the item is a declared grant whatever it says, and only the page skips it."
            end
          end
        end
        walk.call(v, child)
      end
    end
  end
  walk.call(json_data, '')
  issues
end

# '||' (and parentheses) in the conditions the &&-only evaluators read, beyond the
# eventMappings, timers and text/sprite/observation variants checked above (m04 L3):
# lighting (scenario and room blocks, their variants, emitter variants), NPC
# behavior.torch, chatBackground views and gameClock anchors all go through conditional-text.js
# evaluateGlobalCondition, which splits on '&&' only and reads the first globalVars
# name of a term, so "globalVars.a || globalVars.b" is just "globalVars.a".
# Skipped: music events and credits (run as JS by scenario-music-events.js) and
# command-board timeline/statusRows and NPC portraitVariants (global-condition.js, which supports '||').
# Any other condition with '||' gets a softer warning naming its path.
def check_or_in_global_conditions(json_data)
  issues = []
  checked_elsewhere = /(\A|\/)(eventMappings|timers|observationVariants|spriteVariants|textVariants|requiresItemHintVariants|requiresItemConditionHintVariants|postitNoteVariants|conceptPanel)(\[|\/|\z)/
  walk = nil
  walk = lambda do |node, path, ctx|
    case node
    when Array
      # The entries of an action list are actions (see :action below)
      entry_ctx = ctx == :action_list ? :action : ctx
      node.each_with_index { |v, i| walk.call(v, "#{path}[#{i}]", entry_ctx) }
    when Hash
      # An action's own condition supports '||' (check_action_conditions reads its syntax),
      # so it is exempt here. Only that one: what is nested inside the action (a give_item's
      # item with a lighting block, say) is read by its own evaluator and checked as usual.
      # A hash with no type is not an action (check_action_conditions skips it too), so
      # its condition is checked here like any other.
      is_action = ctx == :action && node.key?('type')
      ctx = nil if ctx == :action || ctx == :action_list
      cond = node['condition']
      if !is_action && cond.is_a?(String) && !path.match?(checked_elsewhere)
        case ctx
        when :lighting, :torch, :chat_background, :clock
          if (bad = unsupported_condition_syntax(cond, allow_includes: false))
            where = { lighting: 'lighting', torch: 'NPC torch', chat_background: 'chatBackground', clock: 'gameClock anchor' }[ctx]
            issues << "❌ ERROR: '#{path}' #{where} condition \"#{cond}\" uses #{bad}. conditional-text.js " \
                      "evaluateGlobalCondition supports only '&&'-joined terms, so '||' is mis-read (each term " \
                      "reads its first globalVars name: \"globalVars.a || globalVars.b\" is just globalVars.a). " \
                      "Use one variant per '||' branch, or a global that the story sets for either case."
          end
        when :js, :or_ok
          if ctx == :or_ok && cond.match?(/[()]/)
            issues << "⚠️ WARNING: '#{path}' condition \"#{cond}\" uses parentheses. global-condition.js " \
                      "supports '&&' and '||' (|| binds looser) but not parentheses."
          end
        else
          if cond.include?('||')
            issues << "⚠️ WARNING: '#{path}' condition \"#{cond}\" uses '||'. Most scenario condition " \
                      "evaluators support only '&&' (music events, credits and command-board timelines are the " \
                      "exceptions). Check which evaluator reads this field before relying on '||'."
          end
        end
      end
      node.each do |k, v|
        child_ctx = ctx
        child_ctx = :js if path.empty? && k == 'music'
        child_ctx = :clock if path.empty? && k == 'gameClock'
        child_ctx = :lighting if k == 'lighting' && ctx.nil?
        child_ctx = :torch if k == 'torch' && ctx.nil?
        child_ctx = :chat_background if k == 'chatBackground' && ctx.nil?
        child_ctx = :or_ok if %w[timeline statusRows portraitVariants].include?(k) && ctx.nil?
        # An action list: its entries' own conditions are exempt (see :action above)
        child_ctx = :action_list if ACTION_LIST_KEYS.include?(k) && ctx.nil?
        walk.call(v, path.empty? ? k.to_s : "#{path}/#{k}", child_ctx)
      end
    end
  end
  walk.call(json_data.reject { |k, _| k == 'objectives' }, '', nil)
  issues
end

# Door alignment: shells out to scripts/check_door_alignment.py (a port of the
# engine's room placement + door placement). Returns issue strings.
def check_door_alignment(erb_path, repo_root)
  issues = []
  script = File.join(repo_root, 'scripts', 'check_door_alignment.py')
  return issues unless File.exist?(script)

  out, status = Open3.capture2e('python3', script, '--json', erb_path)
  res = begin
    JSON.parse(out.lines.reject { |l| l.strip.empty? }.last.to_s)
  rescue JSON::ParserError
    nil
  end
  if res.nil? || res['error']
    issues << "💡 SUGGESTION: Door alignment check skipped — #{res ? res['error'] : (status.success? ? 'no output' : out.strip[0, 200])}"
    return issues
  end
  Array(res['bad']).each do |b|
    issues << "❌ ERROR: Doors between '#{b['a']}' and '#{b['b']}' (#{b['dir']}) are misaligned, so the player " \
              "can't walk straight through: #{b['detail']}. Change the room types/sizes or the connection so the " \
              "two door gaps meet (see scripts/check_door_alignment.py)."
  end
  Array(res['unmodelled']).each do |u|
    issues << "⚠️ WARNING: UNMODELLED multi-door connection #{u} — door alignment for array connections is not checked. " \
              "Verify these doors line up in the browser."
  end
  issues
end

# ─────────────────────────────────────────────────────────────
# Access model (docs/achitechture/ACCESS_MODEL_PLAN.md, section 8 step 4): NPC roles and
# sign-in details, access lists on rfid locks and sign-in PCs, account profiles and
# policies. The identity rules come from BreakEscape::AccessIdentities, which mirrors the
# server's. repo_root (for storyPath) and scenario_dir (for ink/*.json) enable the ink
# checks; without them those are skipped. Messages never quote a password.
# ─────────────────────────────────────────────────────────────

# Lock fields doors.js would take from a door entry before the room's (lockProps), and
# never does in play, since the bootstrap scenario has no doors. requires is checked on
# its own (a copy of the room's is harmless); access and acceptsUIDOnly are errors.
DOOR_ENTRY_LOCK_FIELDS = %w[locked lockType keyPins key_pins difficulty lockedHint biometricMatchThreshold
                            maxAttempts lockoutSeconds passwordHint showHint postitNote showPostit showKeyboard pinLength dustable dustHint].freeze
# ─────────────────────────────────────────────────────────────
# Gated-door credit (GATED_DOOR_SERVER_CHECK_PLAN.md §12). The server owns the credit for
# passing a split gated door: at promotion it sets the gate's creditOnPass globals and completes
# the credited task itself, and those globals are read-only to a client sync_state. These checks
# keep an author from writing a scenario where that ownership can be defeated (a second unlock
# route, a client-writable pass global, an ACL rfid lock, a flag-completed credited task) or
# where a credit could never fire.
# ─────────────────────────────────────────────────────────────

# The runtime server-owned global names (Game::SERVER_OWNED_GLOBAL_NAMES). Kept in step by
# carry_over_server_owned_globals_test, which guards that the two literals agree.
GATED_SERVER_OWNED_GLOBALS = %w[se_captures].freeze

# True when the scenario defines any rfid_cloner object anywhere (nested contents included). This
# mirrors Game#scenario_has_rfid_cloner?, the runtime split proxy for "a requires card is obtainable".
def scenario_contains_rfid_cloner?(node)
  case node
  when Array then node.any? { |n| scenario_contains_rfid_cloner?(n) }
  when Hash
    return true if node['type'] == 'rfid_cloner'
    node.each_value.any? { |v| scenario_contains_rfid_cloner?(v) }
  else
    false
  end
end

def check_gated_door_credit(json_data)
  issues = []
  return issues unless json_data.is_a?(Hash)
  rooms = json_data['rooms']
  return issues unless rooms.is_a?(Hash)

  declared = json_data['globalVariables'].is_a?(Hash) ? json_data['globalVariables'].keys.map(&:to_s).to_set : Set.new

  # task id -> type, so a creditOnPass.completeTask can be checked to exist and not be a submit_flags task.
  task_types = {}
  Array(json_data['objectives']).each do |aim|
    next unless aim.is_a?(Hash)
    Array(aim['tasks']).each do |t|
      task_types[t['taskId'].to_s] = t['type'].to_s if t.is_a?(Hash) && t['taskId']
    end
  end

  # Globals a client sync_state cannot write (mirrors Game#server_owned_global_name?): worn-costume
  # globals, imported globals, the creditOnPass credit globals, and the runtime server-owned names.
  worn = BreakEscape::WearableModel.worn_globals(json_data)
  imported = Array(json_data['importGlobals']).filter_map { |e| carry_over_import_name(e) }

  # The runtime serverCompletedOnly set (mirrors Game.completed_only_task_ids_in): every task named
  # by any door gate's creditOnPass.completeTask, independent of openFor or whether the gate splits.
  credited_task_ids = Set.new
  rooms.each_value do |room|
    next unless room.is_a?(Hash) && room['doors'].is_a?(Array)
    room['doors'].each do |door|
      credit = door.is_a?(Hash) && door['gate'].is_a?(Hash) ? door['gate']['creditOnPass'] : nil
      next unless credit.is_a?(Hash)
      credit.each_value do |block|
        t = block.is_a?(Hash) ? block['completeTask'] : nil
        credited_task_ids << t.to_s if t.is_a?(String) && !t.strip.empty?
      end
    end
  end

  # First pass: collect every openFor gate, its credit blocks and the credit globals.
  gates = []            # [{ room_id, i, connected, gate, requires, open_for }]
  credit_globals = Set.new
  credit_block_paths = Set.new
  rooms.each do |room_id, room|
    next unless room.is_a?(Hash) && room['doors'].is_a?(Array)
    room['doors'].each_with_index do |door, i|
      next unless door.is_a?(Hash)
      gate = door['gate']
      next unless gate.is_a?(Hash) && Array(gate['openFor']).any?
      connected = door['connectedRoom'].to_s
      target = rooms[connected]
      gates << { room_id: room_id, i: i, connected: connected, gate: gate,
                 requires: Array(target.is_a?(Hash) ? target['requires'] : nil).map(&:to_s).reject(&:empty?),
                 open_for: Array(gate['openFor']).map(&:to_s).to_set }
      credit = gate['creditOnPass']
      next unless credit.is_a?(Hash)
      credit.each do |path_key, block|
        set = block.is_a?(Hash) ? block['setGlobal'] : nil
        next unless set.is_a?(Hash)
        set.each_key { |n| credit_globals << n.to_s }
        credit_block_paths << "rooms/#{room_id}/doors[#{i}]/gate/creditOnPass/#{path_key}/setGlobal"
      end
    end
  end

  server_owned = (worn + imported + credit_globals.to_a + GATED_SERVER_OWNED_GLOBALS).to_set
  has_cloner = scenario_contains_rfid_cloner?(json_data)

  split_rooms = {}  # connected_room -> open_for set (only splitting gates)
  gates.each do |g|
    at = "rooms/#{g[:room_id]}/doors[#{g[:i]}]"
    gate = g[:gate]
    pass = gate['playerMayPassIf']
    pass_present = pass.is_a?(String) && !pass.strip.empty?
    pass_server_owned = pass_present && server_owned.include?(pass)
    # A gate splits (its NPC route records the room in npcRouteRooms rather than unlockedRooms) when a
    # provable path exists: a server-owned pass, or an rfid_cloner anywhere in the scenario. This
    # mirrors runtime Game#gate_splits? exactly (R3 minor 3): the runtime does not condition the
    # cloner term on the target room carrying a `requires` card, so neither does this. Dropping the
    # former `&& !requires.empty?` closes the hole where the runtime split a cloner gate but the
    # validator stayed silent on a client-writable pass; for every deployed/test scenario the only
    # cloner gates (lab, test_gate_tailgate) carry a requires card, so the split decision is
    # unchanged. Keep this in step with Game#gate_splits? and generate_dungeon_graph.rb.
    splits = pass_server_owned || has_cloner
    credit = gate['creditOnPass']

    if splits
      split_rooms[g[:connected]] = g[:open_for]
      # §12: a split gate's playerMayPassIf must be a global a client sync_state cannot write; a
      # client-writable pass global could be forged to fake the viaPass promotion.
      if pass_present && !pass_server_owned
        issues << "❌ ERROR: '#{at}' is a split gated door whose playerMayPassIf '#{pass}' is a " \
                  "client-writable global. It must be server-owned (a worn-costume global, an imported " \
                  "global, or a creditOnPass credit global), or a tampered client could forge the viaPass pass."
      end
      # §12 / Chunk E to-do (b): a split gate's rfid room lock must be requires-only, never an ACL
      # (access-list) lock. credit_via_credential! re-asserts possession with rfid_lock_passes!, which for
      # a requires-only lock delegates to rfid_requires_held? (server inventory + clones, ignores the
      # client card_ids). An ACL lock would consult the client card_ids through the access model, so the
      # credential credit would inherit the client-driven access semantics rather than a server check.
      target = rooms[g[:connected]]
      if target.is_a?(Hash) && target['lockType'].to_s == 'rfid' && target.key?('access')
        issues << "❌ ERROR: split gated room '#{g[:connected]}' has an rfid lock with an 'access' ACL list. " \
                  "A split gate's credential credit re-asserts server possession (rfid_requires_held?), which " \
                  "needs a requires-only lock; make the lock requires-only (drop the access list)."
      end
    elsif credit.is_a?(Hash)
      # §12: a gate that does not split named a creditOnPass, so the credit can never fire.
      issues << "⚠️ WARNING: '#{at}' names a creditOnPass but the gate does not split (no server-owned " \
                "playerMayPassIf and no obtainable requires card), so the server credit can never fire."
    end

    next unless credit.is_a?(Hash)
    credit.each do |path_key, block|
      next unless block.is_a?(Hash)
      cat = "#{at}/gate/creditOnPass/#{path_key}"
      set = block['setGlobal']
      if set.is_a?(Hash)
        set.each_key do |name|
          unless declared.include?(name.to_s)
            issues << "❌ ERROR: '#{cat}/setGlobal' sets '#{name}', which is not declared in globalVariables."
          end
        end
      end
      task_id = block['completeTask']
      if task_id.is_a?(String) && !task_id.strip.empty?
        if !task_types.key?(task_id)
          issues << "❌ ERROR: '#{cat}/completeTask' names task '#{task_id}', which no objective defines."
        elsif task_types[task_id] == 'submit_flags'
          issues << "❌ ERROR: '#{cat}/completeTask' names submit_flags task '#{task_id}'. Flag completion " \
                    "(process_flag_task_completions!) writes task status directly, bypassing the server-completed-only " \
                    "guard, so a credited task must never be a submit_flags task."
        end
      end
    end
  end

  # §12: a credit global still written by a client set_global / setGlobal mapping is a half-done
  # migration (the client writer races the server credit and is no longer read-only to sync_state).
  unless credit_globals.empty?
    BreakEscape::WearableModel.global_writers(json_data).each do |w|
      name = w[:name].to_s
      next unless credit_globals.include?(name)
      # Skip the creditOnPass setGlobal nodes themselves (the server writer, not a client one).
      next if credit_block_paths.include?(w[:path].to_s)
      issues << "⚠️ WARNING: credit global '#{name}' is still written by a client setter at '#{w[:path]}'. " \
                "The server owns it through creditOnPass; remove the client writer so the credit cannot be forged or raced."
    end
  end

  # §12 / R3 minor 2: a credited task (named by a creditOnPass.completeTask, so serverCompletedOnly
  # at runtime) that is ALSO completed by a client completeTask (an eventMapping, reward or action)
  # is a half-done migration. With the server-completed-only guard now behind the already-completed
  # branch (R3 minor 1), such a client completer, fired before the server credit lands, reaches the
  # guard on a not-yet-completed task and surfaces a hard "Objective Blocked" to an honest player.
  # Mirrors the credit-global client-writer warning above. The creditOnPass blocks themselves (the
  # server writer) are pruned, so only a genuine client completer trips it.
  unless credited_task_ids.empty?
    walk_client_complete = lambda do |node|
      case node
      when Array then node.each { |n| walk_client_complete.call(n) }
      when Hash
        ct = node['completeTask']
        if ct.is_a?(String) && credited_task_ids.include?(ct.to_s)
          issues << "⚠️ WARNING: task '#{ct}' is credited by a gate's creditOnPass (server-completed only) but is " \
                    "also completed by a client completeTask. Remove the client completer, or the credited task is " \
                    "shown as 'Objective Blocked' to an honest player when the client fires before the server credit."
        end
        node.each do |k, v|
          next if k.to_s == 'creditOnPass' # the server writer itself, not a client completer
          walk_client_complete.call(v)
        end
      end
    end
    walk_client_complete.call(json_data)
  end

  unless split_rooms.empty?
    # §12 / Chunk E to-do (a): a second unlock route into a split gated room would unlock it without
    # the gate credit, silently defeating the split. A flag or action unlock_door reward, or a
    # non-openFor NPC unlockDoor mapping, is such a route.
    walk_unlock_door = lambda do |node|
      case node
      when Array then node.each { |n| walk_unlock_door.call(n) }
      when Hash
        if node['type'] == 'unlock_door'
          target = %w[target_room roomId room connectedRoom].map { |k| node[k] }.compact.first.to_s
          if split_rooms.key?(target)
            issues << "❌ ERROR: an unlock_door reward/action targets split gated room '#{target}', a second " \
                      "unlock route that opens the room without the gate credit and defeats the split."
          end
        end
        node.each_value { |v| walk_unlock_door.call(v) }
      end
    end
    walk_unlock_door.call(json_data)

    rooms.each do |room_id, room|
      next unless room.is_a?(Hash)
      Array(room['npcs']).each do |npc|
        next unless npc.is_a?(Hash)
        npc_id = npc['id'].to_s
        Array(npc['eventMappings']).each do |m|
          next unless m.is_a?(Hash)
          Array(m['unlockDoor']).map(&:to_s).each do |target|
            next unless split_rooms.key?(target)
            next if split_rooms[target].include?(npc_id)  # the gate's own openFor NPC: the intended route
            issues << "❌ ERROR: NPC '#{npc_id}' in '#{room_id}' has an unlockDoor mapping for split gated room " \
                      "'#{target}' but is not in that gate's openFor, a second unlock route that defeats the split."
          end
        end
      end
    end

    # §12 / Q5: a server-enforced lock code placed in a split gated room's readable text leaks to an
    # un-promoted client the moment the room is served (filtered_room_data serves its text). A warning,
    # not an error: the lab's deeds_signout combination is a deliberate teaching pattern the author keeps
    # where the leak only saves time.
    codes = Set.new
    collect_codes = lambda do |node|
      case node
      when Array then node.each { |n| collect_codes.call(n) }
      when Hash
        if %w[pin password combination cryptex key rfid].include?(node['lockType'])
          Array(node['requires']).each { |r| codes << r.to_s unless r.to_s.strip.empty? }
        end
        node.each_value { |v| collect_codes.call(v) }
      end
    end
    collect_codes.call(json_data)

    unless codes.empty?
      scan_readables = lambda do |node, &blk|
        case node
        when Array then node.each { |n| scan_readables.call(n, &blk) }
        when Hash
          blk.call(node) if node['readable'] == true && node['text'].is_a?(String)
          node.each_value { |v| scan_readables.call(v, &blk) }
        end
      end
      split_rooms.each_key do |rid|
        room = rooms[rid]
        next unless room.is_a?(Hash)
        scan_readables.call(room) do |obj|
          text = obj['text'].to_s
          leaked = codes.select { |c| text =~ /(?<![\w])#{Regexp.escape(c)}(?![\w])/ }
          next if leaked.empty?
          name = obj['name'] || obj['id'] || obj['type']
          issues << "⚠️ WARNING: readable '#{name}' in split gated room '#{rid}' contains a server-enforced " \
                    "lock code (#{leaked.size} value#{leaked.size == 1 ? '' : 's'}) in its text, which leaks to an " \
                    "un-promoted client the moment the room is served. Keep real secrets out of a route room's " \
                    "readable text, or accept it where the leak only saves time."
        end
      end
    end
  end

  issues
end

# Whether some closed-menu choice set for this landing page reaches meets_threshold for the given
# target, proving an honest player can build a convincing page (PHISH_EVIDENCE_SERVER_PLAN section
# 13: "Share PhishScore with the validator so an authored page can be checked for being solvable,
# some choice set meets its linkThreshold"). It reuses the shared BreakEscape::PhishScore port
# (lib/break_escape/phish_score.rb), the same scorer the build route recomputes with, so the
# validator and the server agree on what is buildable and the check cannot drift from the runtime.
#
# This is a bounded exhaustive search, not a blind best-choice-per-part pick, because one choice is
# coupled: the brand choice feeds the brand points, the brand gate and the domain menu, and a domain
# option lives under the brand that owns it. So the search enumerates every (brand, domain) pair and,
# within it, every authored purpose and wording option. The three remaining factors are fixed to
# their own factor maximum, which is independent of every other choice, so fixing them loses no
# reachable credibility: logo 'crisp' is the only full-points logo (score_logo), padlock true is the
# only full-points padlock (score_padlock), and choosing exactly a brand's realFields is always full
# form points (score_form rule 4) for that brand. Each menu is a handful of options, so the product
# is tiny and the search is exact: if it finds no meeting choice set, none exists.
def landing_page_buildable?(page_def, target_id)
  return false unless page_def.is_a?(Hash)
  return fake_check_buildable?(page_def, target_id) if page_def['pageType'] == 'fakeCheck'

  pretext = page_def['pretext'].is_a?(Hash) ? page_def['pretext'] : {}
  purposes = Array(page_def['purposes']).filter_map { |p| p['id'] if p.is_a?(Hash) }
  purposes = (purposes + [pretext['purposeId'], 'signin']).compact.uniq
  purposes = [nil] if purposes.empty?
  wordings = Array(page_def['wordings']).filter_map { |w| w['id'] if w.is_a?(Hash) }
  wordings = (wordings + [nil]).uniq
  brands = page_def['brands'].is_a?(Array) ? page_def['brands'] : []

  brands.each do |brand|
    next unless brand.is_a?(Hash)

    real_fields = brand['realFields'].is_a?(Array) ? brand['realFields'] : []
    domains = brand['domains'].is_a?(Array) ? brand['domains'] : []
    # A page with no domain options still gets the no-domain case: guard_domain blocks it (so it is
    # never convincing), but enumerating [nil] keeps the search total.
    (domains.empty? ? [nil] : domains).each do |domain|
      domain_id = domain.is_a?(Hash) ? domain['id'] : nil
      purposes.each do |purpose|
        wordings.each do |wording|
          choices = {
            'brand' => brand['id'], 'domainId' => domain_id, 'purpose' => purpose,
            'logo' => 'crisp', 'wording' => wording, 'fields' => real_fields, 'padlock' => true
          }
          return true if BreakEscape::PhishScore.score(page_def, choices, target_id)[:meets_threshold]
        end
      end
    end
  end
  false
end

# The fake-check variant (scoreFakeCheck): four independent menus (hosts, pretexts, steps,
# urgencies) and no gates. Each factor's points depend only on its own menu option, so the full
# product of the four menus is a small, exact search.
def fake_check_buildable?(page_def, target_id)
  check = page_def['check'].is_a?(Hash) ? page_def['check'] : {}
  ids = lambda do |key|
    out = Array(check[key]).filter_map { |o| o['id'] if o.is_a?(Hash) }
    out.empty? ? [nil] : out
  end
  ids.call('hosts').each do |host_id|
    ids.call('pretexts').each do |pretext_id|
      ids.call('steps').each do |steps_id|
        ids.call('urgencies').each do |urgency_id|
          choices = { 'check' => { 'hostId' => host_id, 'pretextId' => pretext_id,
                                   'stepsId' => steps_id, 'urgencyId' => urgency_id } }
          return true if BreakEscape::PhishScore.score(page_def, choices, target_id)[:meets_threshold]
        end
      end
    end
  end
  false
end

def check_credentials(json_data)
  issues = []
  return issues unless json_data.is_a?(Hash)

  creds = json_data['credentials']
  return issues unless creds.is_a?(Hash)

  cm = BreakEscape::CredentialModel
  ai = BreakEscape::AccessIdentities
  capm = BreakEscape::CaptureModel
  nm = BreakEscape::NetworkModel
  err  = ->(msg) { issues << "❌ ERROR: credentials: #{msg}" }
  warn = ->(msg) { issues << "⚠️ WARNING: credentials: #{msg}" }
  info = ->(msg) { issues << "ℹ️ INFO: credentials: #{msg}" }

  # Account holders and sign-in PCs, by id.
  accounts_by_id = cm.room_npcs(json_data).select { |n| ai.account?(n) }.to_h { |n| [n['id'].to_s, n] }
  pcs = cm.sign_in_pcs(json_data)
  pcs_by_id = pcs.to_h { |pc| [pc['id'].to_s, pc] }
  headless_pc_ids = pcs.select { |pc| nm.headless?(pc) }.map { |pc| pc['id'].to_s }.to_set

  # Foothold ids any jack, access point or implant/grant can create. The runtime only ever keys
  # player_state['footholds'] by the prefixed forms (plan 9.1 authors "jack_comms_port"): a jack is
  # "jack_<jackId>" (foothold_id_for), a Wi-Fi AP is "wifi_<network>" (wifi_foothold_id), an implant
  # is "implant_<pc>". A proof must name one of those to fire live. `foothold_ids` holds the runtime
  # (prefixed) forms a proof may name; `bare_foothold_ids` holds the matching bare source ids, so a
  # proof written with a bare id can be told apart and warned about rather than passed (R2 m1).
  foothold_ids = Set.new
  bare_foothold_ids = Set.new
  nm.jacks(json_data).each do |e|
    jid = e[:object]['id'].to_s
    next if jid.empty?

    bare_foothold_ids << jid
    foothold_ids << "jack_#{jid}"
  end
  nm.wifi_aps(json_data).each do |e|
    ap = e[:object]
    bare_foothold_ids << ap['id'].to_s if ap.is_a?(Hash) && ap['id']
    foothold_ids << "wifi_#{e[:network]}" if e[:network]
  end
  # A grant_foothold action (scripted or a player implant) grants its foothold through POST
  # /network/implant, whose runtime id is "implant_<pc>" (implant_foothold_id_for). The runtime
  # keys the foothold by that prefixed id; the bare PC id is tracked only to warn on a proof that
  # names it (R1 m4, R2 m1). The runtime reads player_state['footholds'].
  nm.grant_foothold_actions(json_data).each do |a|
    pc = a[:pc].to_s
    next if pc.empty?

    bare_foothold_ids << pc
    foothold_ids << "implant_#{pc}"
  end

  declared_globals = json_data['globalVariables'].is_a?(Hash) ? json_data['globalVariables'].keys.map(&:to_s).to_set : Set.new

  notes_family = %w[notes notes2 notes4 notes5].to_set
  always_allowed = BreakEscape::DeclaredGrants::ALWAYS_ALLOWED.to_set
  # Client-built decor cups (games_controller DECOR_CUP_TYPES, mirrored by DeclaredGrants::DECOR_CUPS)
  # have no scenario lookup either, so a credential on one would be keyed on a client-chosen id (R3 m1).
  decor_cups = BreakEscape::DeclaredGrants::DECOR_CUPS.to_set

  # Count and id-pattern checks over the raw map (not the 64-capped reader).
  err.call("more than #{cm::MAX_ENTRIES} entries (#{creds.size}); the server reads only the first #{cm::MAX_ENTRIES} by sorted id.") if creds.size > cm::MAX_ENTRIES
  creds.each_key do |id|
    err.call("credential id '#{id}' is outside the pattern ^[a-z][a-z0-9_]{0,63}$.") unless id.is_a?(String) && id.match?(cm::ID_PATTERN)
  end

  # Every item carrying a `credential`, by path (for the item-field checks).
  cred_items = []
  walk_items = lambda do |node, path|
    case node
    when Hash
      if node['type'].is_a?(String) && node['credential'].is_a?(String)
        cred_items << { item: node, path: path }
      end
      node.each { |k, v| walk_items.call(v, "#{path}/#{k}") }
    when Array
      node.each_with_index { |v, i| walk_items.call(v, "#{path}[#{i}]") }
    end
  end
  walk_items.call(json_data, '')

  # policy accepts checks (independent of the registry).
  policies = json_data['policies'].is_a?(Hash) ? json_data['policies'] : {}
  used_policy_names = Set.new
  pcs.each do |pc|
    used_policy_names << (cm.present_string?(pc['policy']) ? pc['policy'] : json_data['defaultPolicy']).to_s
  end
  policies.each do |pname, policy|
    next unless policy.is_a?(Hash) && policy.key?('accepts')

    list = policy['accepts']
    if list.is_a?(Array)
      list.each do |k|
        err.call("policy '#{pname}' accepts an unknown kind '#{k}'.") unless cm::KINDS.key?(k)
      end
      warn.call("policy '#{pname}' accepts a list without 'password'; password is always accepted anyway, so the list is misleading.") unless list.include?('password')
    end
    warn.call("policy '#{pname}' sets 'accepts' but no PC uses it.") unless used_policy_names.include?(pname.to_s)
  end

  # unlock_object tasks, for the "relay sign-in never completes it" warning.
  invite_connect_pcs = creds.select { |_id, e| e.is_a?(Hash) && e['kind'] == 'assist_invite' }
                            .filter_map { |_id, e| e['connectsTo'].to_s if cm.present_string?(e['connectsTo']) }.to_set
  if !invite_connect_pcs.empty? && json_data['objectives'].is_a?(Array)
    json_data['objectives'].each do |obj|
      Array(obj.is_a?(Hash) ? obj['tasks'] : nil).each do |task|
        next unless task.is_a?(Hash) && task['type'] == 'unlock_object'

        target = task['targetObject'] || task['target'] || task['object']
        warn.call("an unlock_object task targets '#{target}', an assist_invite's connectsTo; a relay sign-in never completes it.") if invite_connect_pcs.include?(target.to_s)
      end
    end
  end

  # Tokens (K5): a token sign-in never adds its PC to signedInPcs, so a session proof or an
  # unlock_object task on a token's connectsTo is never satisfied by it.
  token_connect_pcs = creds.select { |_id, e| e.is_a?(Hash) && e['kind'] == 'token' }
                           .filter_map { |_id, e| e['connectsTo'].to_s if cm.present_string?(e['connectsTo']) }.to_set
  if !token_connect_pcs.empty? && json_data['objectives'].is_a?(Array)
    json_data['objectives'].each do |obj|
      Array(obj.is_a?(Hash) ? obj['tasks'] : nil).each do |task|
        next unless task.is_a?(Hash) && task['type'] == 'unlock_object'

        target = task['targetObject'] || task['target'] || task['object']
        warn.call("an unlock_object task targets '#{target}', a token's connectsTo; a token sign-in never completes it.") if token_connect_pcs.include?(target.to_s)
      end
    end
  end

  # The network a foothold id sits on: a jack's own, wifi_<network>, or an implant PC's.
  net_entries = nm.room_objects(json_data)
  foothold_network = lambda do |fid|
    if fid.start_with?('jack_')
      jid = fid.delete_prefix('jack_')
      nm.jacks(json_data).find { |e| e[:object]['id'].to_s == jid }&.dig(:network)
    elsif fid.start_with?('wifi_')
      fid.delete_prefix('wifi_')
    elsif fid.start_with?('implant_')
      pid = fid.delete_prefix('implant_')
      net_entries.find { |e| e[:object].is_a?(Hash) && e[:object]['id'].to_s == pid }&.dig(:network)
    end
  end
  networks_reach = lambda do |from, to|
    seen = Set[from]
    queue = [from]
    until queue.empty?
      cur = queue.shift
      return true if cur == to

      nm.linked_networks(json_data, cur).each { |nb| queue << nb if seen.add?(nb) }
    end
    false
  end

  creds.each do |id, entry|
    next unless entry.is_a?(Hash)

    kind = entry['kind']
    label = "credential '#{id}'"

    # Kind.
    if !cm::KINDS.key?(kind)
      err.call("#{label} has an unknown kind '#{kind}'.")
    elsif !cm.kind_built?(kind)
      err.call("#{label} kind '#{kind}' is not supported until phase 3.")
    end

    # Token (K5, plan section 10): a label, a bounded life and a foothold proof.
    if kind == 'token'
      err.call("#{label} is a token and must set label (the sign-in screen and the Sign-ins list name it).") unless cm.present_string?(entry['label'])
      err.call("#{label} expiresMin must be a whole number of minutes from 1 to #{cm::TOKEN_MAX_MIN}.") if cm.token_expires_min(entry).nil?
      pk0 = cm.proof_kind(entry['proof'])
      err.call("#{label} is a token and its proof must be a foothold (the token is recorded by the foothold that holds it).") if pk0 && pk0 != 'foothold'
      info.call("#{label} a token expires on a clock that starts when its foothold is first gained; it must not be the only route to something the mission needs.")
    end

    # Label: the sign-in screen and desktop keep it on one line and cut it with an ellipsis.
    if entry['label'].is_a?(String) && entry['label'].length > 32
      warn.call("#{label} label is #{entry['label'].length} characters; over 32 it is cut with an ellipsis on a narrow screen. Shorten it.")
    end

    # Account.
    npc = accounts_by_id[entry['account'].to_s]
    err.call("#{label} account '#{entry['account']}' is not an account holder.") unless npc

    # connectsTo.
    connecting = cm.connecting?(kind)
    connects_to = entry['connectsTo']
    if kind == 'password'
      err.call("#{label} is a password and must not set connectsTo.") if entry.key?('connectsTo')
    elsif connecting
      if !cm.present_string?(connects_to)
        err.call("#{label} is a connecting kind and must set connectsTo.")
      elsif !pcs_by_id.key?(connects_to.to_s)
        err.call("#{label} connectsTo '#{connects_to}' is not a sign-in PC.")
      elsif kind == 'assist_invite' && headless_pc_ids.include?(connects_to.to_s)
        err.call("#{label} is an assist_invite whose connectsTo '#{connects_to}' is headless; there is no screen to share.")
      end
    end

    # foundIn.
    if kind == 'password'
      err.call("#{label} is a password and must set foundIn.") unless cm.present_string?(entry['foundIn'])
    elsif entry.key?('foundIn')
      err.call("#{label} sets foundIn, which is only allowed on a password.")
    end

    # endsOnGlobal.
    if entry.key?('endsOnGlobal')
      if kind != 'assist_invite'
        err.call("#{label} sets endsOnGlobal, which is only allowed on an assist_invite.")
      elsif !declared_globals.include?(entry['endsOnGlobal'].to_s)
        err.call("#{label} endsOnGlobal '#{entry['endsOnGlobal']}' names no declared globalVariable.")
      end
    end

    # proof.
    proof = entry['proof']
    pk = cm.proof_kind(proof)
    if pk.nil?
      err.call("#{label} proof must name exactly one of #{cm::PROOF_KINDS.join(', ')}.")
    else
      case pk
      when 'session'
        session_pc = proof['session'].to_s
        if !pcs_by_id.key?(session_pc)
          err.call("#{label} proof session '#{session_pc}' is not a sign-in PC.")
        elsif kind == 'assist_invite' && connects_to.to_s == session_pc
          warn.call("#{label} proof is a session on the invite's own connectsTo; a relay sign-in never satisfies it.")
        elsif token_connect_pcs.include?(session_pc)
          warn.call("#{label} proof is a session on '#{session_pc}', a token's connectsTo; a token sign-in never adds the PC to the signed-in list, so it never satisfies it.")
        end
      when 'held'
        item_id = proof['held'].to_s
        definition = cm.item_definition(json_data, item_id)
        if definition.nil?
          err.call("#{label} proof held '#{item_id}' names no item in the held scope.")
        else
          placeable = definition['takeable'] == true
          grant_ids = BreakEscape::DeclaredGrants.for(json_data).map { |g| g['item'].is_a?(Hash) ? g['item']['id'].to_s : nil }.compact.to_set
          held_in_itemsheld = cm.room_npcs(json_data).any? { |n| Array(n['itemsHeld']).any? { |i| i.is_a?(Hash) && i['id'].to_s == item_id } }
          start_ids = Array(json_data['startItemsInInventory']).filter_map { |i| i['id'].to_s if i.is_a?(Hash) }.to_set
          reachable = placeable || grant_ids.include?(item_id) || held_in_itemsheld || start_ids.include?(item_id)
          err.call("#{label} proof held '#{item_id}' can never hold: the item is not takeable and is in no declared grant, NPC itemsHeld or start inventory.") unless reachable

          # Item-field and cross-reference checks on the definition.
          if notes_family.include?(definition['type'])
            err.call("#{label} held item '#{item_id}' is a notes-family type ('#{definition['type']}'); it never reaches the tray, so use text_file.")
          elsif always_allowed.include?(definition['type'])
            err.call("#{label} held item '#{item_id}' is an always-allowed type ('#{definition['type']}'); the client could build one, so use text_file.")
          end
          if definition['credential'].to_s != id.to_s
            warn.call("#{label} proof held '#{item_id}' but that item does not carry credential '#{id}' (it carries '#{definition['credential']}').")
          end
          if kind == 'assist_invite' && grant_ids.include?(item_id) && !held_in_itemsheld
            warn.call("#{label} is an assist_invite whose code is a declared grant; it can be claimed at once. Give it from the NPC's itemsHeld through an ink gift.")
          end
          if kind == 'saved_connection' && grant_ids.include?(item_id) && !placeable && !held_in_itemsheld && !start_ids.include?(item_id)
            warn.call("#{label} is a saved_connection placed only by a declared grant; a tampered client can claim it at once. Place it in a room, on a desktop or in a share.")
          end
        end
      when 'foothold'
        fid = proof['foothold'].to_s
        if foothold_ids.include?(fid)
          # Runtime (prefixed) form: fires live.
        elsif bare_foothold_ids.include?(fid)
          warn.call("#{label} proof foothold '#{fid}' names a bare source id; the runtime only keys footholds by the prefixed form (jack_, wifi_ or implant_), so this proof can never fire. Use 'jack_#{fid}', 'wifi_<network>' or 'implant_#{fid}' as the source requires.")
        else
          err.call("#{label} proof foothold '#{fid}' names no foothold any jack, access point or implant action can create.")
        end
      when 'planted', 'dropped'
        # Capture proofs; reachability is covered by the capture model's own checks.
      end
    end

    # Warnings that need the account and PC.
    if npc && connecting && pcs_by_id.key?(connects_to.to_s)
      pc = pcs_by_id[connects_to.to_s]
      warn.call("#{label} connectsTo '#{connects_to}' whose access list does not admit account '#{entry['account']}'.") unless cm.pc_admits_account?(pc, npc)
      policy = cm.policy_for(json_data, pc)
      if kind == 'saved_connection' && policy.is_a?(Hash) && policy['maxAttempts']
        info.call("#{label} connectsTo '#{connects_to}' whose policy sets maxAttempts; a lockout there refuses the connection for the rest of the game (lockouts never expire), so it must not be the only route to something the mission needs.")
      end
    end

    # Token warnings: the proof foothold must be able to reach the PC, and its policy must accept tokens.
    if kind == 'token' && connecting && pcs_by_id.key?(connects_to.to_s)
      tpc = pcs_by_id[connects_to.to_s]
      tpolicy = cm.policy_for(json_data, tpc)
      if tpolicy.is_a?(Hash) && tpolicy['accepts'].is_a?(Array) && !tpolicy['accepts'].include?('token')
        warn.call("#{label} connectsTo '#{connects_to}' whose policy '#{tpc['policy'] || json_data['defaultPolicy']}' does not accept 'token'; add it to the policy's accepts list.")
      end
      fid = cm.token_proof_foothold(entry)
      from_net = fid ? foothold_network.call(fid) : nil
      to_net = net_entries.find { |e| e[:object].is_a?(Hash) && e[:object]['id'].to_s == connects_to.to_s }&.dig(:network)
      if from_net && to_net && !networks_reach.call(from_net, to_net)
        warn.call("#{label} proof foothold network cannot reach '#{connects_to}': '#{from_net}' has no link path to '#{to_net}'.")
      end
    end

    # No machine accepts this credential.
    if npc && (kind == 'password' || connecting)
      warn.call("#{label} is accepted by no machine: no sign-in PC's policy accepts kind '#{kind}', admits the account and (for a connecting kind) is its connectsTo.") if cm.pcs_accepting(json_data, id).empty?
    end

    # A saved_connection whose connectsTo nothing can reach.
    if kind == 'saved_connection' && pcs_by_id.key?(connects_to.to_s) && foothold_ids.empty?
      warn.call("#{label} is a saved_connection but no foothold or access point can reach its connectsTo.")
    end
  end

  # Items carrying a credential: the registry id must exist, and its entry's proof must be `held`
  # on that item.
  cred_items.each do |rec|
    item = rec[:item]
    cid = item['credential'].to_s
    entry = creds[cid]
    if !entry.is_a?(Hash)
      err.call("item '#{item['id'] || item['name']}' names credential '#{cid}', which is not a registry id.")
      next
    end
    if notes_family.include?(item['type'])
      err.call("item '#{item['id'] || item['name']}' carries a credential but is a notes-family type ('#{item['type']}'); use text_file.")
    elsif always_allowed.include?(item['type'])
      err.call("item '#{item['id'] || item['name']}' carries a credential but is an always-allowed type ('#{item['type']}'); use text_file.")
    elsif decor_cups.include?(item['type'])
      err.call("item '#{item['id'] || item['name']}' carries a credential but is a decor-cup type ('#{item['type']}'); the server cannot look it up in the scenario, so use text_file.")
    end
    held_id = entry['proof'].is_a?(Hash) ? entry['proof']['held'].to_s : nil
    unless held_id && held_id == item['id'].to_s
      warn.call("item '#{item['id'] || item['name']}' carries credential '#{cid}' but that entry's proof is not held on this item.")
    end
  end

  issues
end

def check_access_model(json_data, repo_root = nil, scenario_dir = nil)
  issues = []
  return issues unless json_data.is_a?(Hash)

  ai = BreakEscape::AccessIdentities
  err = ->(msg) { issues << "❌ ERROR: access model: #{msg}" }
  warn = ->(msg) { issues << "⚠️ WARNING: access model: #{msg}" }

  room_npcs = ai.room_npcs(json_data)
  npc_by_id = {}
  room_npcs.each { |e| npc_by_id[e[:npc]['id'].to_s] ||= e if e[:npc]['id'] }
  accounts = room_npcs.select { |e| ai.account?(e[:npc]) }
  objects = ai.room_objects(json_data)
  pcs = objects.select { |e| ai.login_pc?(e[:object]) }
  pc_ids = pcs.map { |e| e[:object]['id'] }.compact.map(&:to_s).to_set
  rooms = json_data['rooms'].is_a?(Hash) ? json_data['rooms'] : {}
  policies = json_data['policies'].is_a?(Hash) ? json_data['policies'] : {}
  profiles = json_data['accountProfiles'].is_a?(Hash) ? json_data['accountProfiles'] : {}
  name_of = ->(npc) { "'#{npc['id']}'" }

  # role and creds only on room NPCs (section 3)
  other_records = []
  %w[npcs phoneNPCs].each do |key|
    next unless json_data[key].is_a?(Array)

    json_data[key].each_with_index { |npc, i| other_records << [npc, "#{key}[#{i}]"] if npc.is_a?(Hash) }
  end
  other_records.concat(headless_npc_records(json_data))
  other_records.each do |npc, path|
    %w[role creds].each do |field|
      next unless npc.key?(field)

      err.call("'#{path}' has '#{field}', which is allowed only on room NPCs (rooms.<id>.npcs[]): " \
               'other NPC records reach the browser unfiltered.')
    end
  end

  # Accounts: a password, unique usernames, one home for the password (section 3)
  by_username = Hash.new { |h, k| h[k] = [] }
  accounts.each do |e|
    npc = e[:npc]
    creds = npc['creds']
    username = creds['username']
    password = creds['password']
    unless password.is_a?(String) && !password.empty?
      err.call("NPC #{name_of.call(npc)} has creds.username '#{username}' but no creds.password.")
    end
    by_username[ai.normalise_username(username)] << npc['id']

    payload = npc['usePayload']
    if payload.is_a?(Hash)
      if payload.key?('address') && ai.normalise_username(payload['address']) != ai.normalise_username(username)
        err.call("NPC #{name_of.call(npc)} has usePayload.address '#{payload['address']}', which differs from " \
                 "creds.username '#{username}'. The loader fills it from creds: remove it or make them match.")
      end
      if payload.key?('secret') && payload['secret'] != password
        err.call("NPC #{name_of.call(npc)} has a usePayload.secret that differs from creds.password. The loader " \
                 'fills it from creds: remove it.')
      end
    end
    Array(npc['eventMappings']).each_with_index do |mapping, i|
      capture = mapping.is_a?(Hash) ? mapping['addCapture'] : nil
      next unless capture.is_a?(Hash)

      if capture.key?('secret')
        err.call("NPC #{name_of.call(npc)} eventMappings[#{i}].addCapture has a 'secret'. An account holder's " \
                 'capture takes its secret from creds; a PIN or other capture belongs on an NPC without an account.')
      end
      if capture.key?('address') && ai.normalise_username(capture['address']) != ai.normalise_username(username)
        err.call("NPC #{name_of.call(npc)} eventMappings[#{i}].addCapture.address '#{capture['address']}' differs " \
                 "from creds.username '#{username}'.")
      end
    end

    capture_route = payload.is_a?(Hash) ||
                    Array(npc['eventMappings']).any? { |m| m.is_a?(Hash) && m['addCapture'].is_a?(Hash) }
    captures_cfg = json_data['social'].is_a?(Hash) && json_data['social']['captures'].is_a?(Hash) ? json_data['social']['captures'] : {}
    # An explicit revealSecret: false is a choice (the password is typed from its earned
    # source), not a forgotten switch, so only a missing one is warned about
    if capture_route && !captures_cfg.key?('revealSecret')
      warn.call("NPC #{name_of.call(npc)} has a capture route (usePayload or addCapture), but " \
                'social.captures.revealSecret is not set, so a captured sign-in never shows its password.')
    end
  end
  by_username.each do |username, ids|
    next if ids.size < 2

    err.call("accounts #{ids.map { |id| "'#{id}'" }.join(', ')} share the username '#{username}' " \
             '(usernames compare trimmed and case-insensitively).')
  end

  # A non-account capture secret that is also a hard-access value (a password or PIN lock code, an
  # RFID or biometric requires, a Wi-Fi PSK or a flag) is withheld until a capture proof holds
  # (Game#authored_capture_secret / authored_capture_served?), so one authored with no proof is never
  # served and the capture silently stops working. Warn the author (usePayload/capture review R1,
  # widened from lock codes to the full hard-access set at phish-evidence review R1, Minor 2: the
  # server withholds a PSK or flag secret the same way it withholds a lock code). Stays a warning,
  # not an error: the server never over-serves such a capture, it only withholds it.
  hard_access = BreakEscape::CaptureModel.hard_access_values(json_data)
  unless hard_access.empty?
    room_npcs.reject { |e| ai.account?(e[:npc]) }.each do |e|
      npc = e[:npc]
      payload = npc['usePayload']
      if payload.is_a?(Hash) && BreakEscape::CaptureModel.lock_answer?(hard_access, payload['secret'])
        own = payload['targetId']
        ungated = if own.is_a?(String) && !own.strip.empty?
                    !payload['proof'].is_a?(Hash)
        else
                    Array(npc['eventMappings']).any? do |m|
                      ac = m.is_a?(Hash) ? m['addCapture'] : nil
                      ac.is_a?(Hash) && BreakEscape::CaptureModel.present_string?(ac['targetId']) &&
                        !(ac['proof'].is_a?(Hash) || payload['proof'].is_a?(Hash))
                    end
        end
        if ungated
          warn.call("NPC #{name_of.call(npc)} has a usePayload.secret that is also a hard-access value (a " \
                    'password or PIN lock code, an RFID or biometric requires, a Wi-Fi PSK or a flag) but no ' \
                    'capture proof gates it, so the capture is withheld and never served. Add a ' \
                    "'proof' to the capture, or make the secret open nothing.")
        end
      end
      Array(npc['eventMappings']).each_with_index do |mapping, i|
        capture = mapping.is_a?(Hash) ? mapping['addCapture'] : nil
        next unless capture.is_a?(Hash) && BreakEscape::CaptureModel.lock_answer?(hard_access, capture['secret'])
        next if capture['proof'].is_a?(Hash)

        warn.call("NPC #{name_of.call(npc)} eventMappings[#{i}].addCapture.secret is also a hard-access value " \
                  '(a password or PIN lock code, an RFID or biometric requires, a Wi-Fi PSK or a flag) but the ' \
                  "mapping has no 'proof', so the capture is withheld and never served. " \
                  "Add a 'proof' to the capture, or make the secret open nothing.")
      end
    end
  end

  # Phish evidence: a landing page whose capture.secret is a hard-access value (a password or PIN
  # lock code, an RFID or biometric requires, a Wi-Fi PSK or a flag) is only safe to serve once the
  # server has recorded a built, convincing page and a landed send for it (PHISH_EVIDENCE_SERVER_PLAN
  # sections 11 to 13). For such a page three facts must all hold, or a tampered client can forge the
  # build and send state and be served the secret without running the minigames:
  #   1. a social.mailClient.payloadKit link kit names the page (landingPageId), so there is a kit to
  #      attach and the server has something to record a send against;
  #   2. some authored social.phishTargets entry is one the page aims at (its own 'targets' map), so
  #      the link kit has an authored target that can be sent it and the server can record a landed
  #      send to a real target. This is a STRUCTURAL check only: it proves a phish target the page is
  #      aimed at exists and carries the per-target threshold. The full "a message can land" check
  #      (does a composed message actually pass the target's required factors) needs the send judge
  #      BreakEscape::PhishJudge, which lands in chunk 4; it should be added here then, so an aimed
  #      target that no message could ever satisfy is also caught at authoring time;
  #   3. the page is buildable: some closed-menu choice set reaches the aimed target's linkThreshold
  #      (checked with the shared BreakEscape::PhishScore port, section 13 bullet 3). If no choice set
  #      can ever be convincing, the server can never record a built page, so the secret is withheld
  #      from honest play forever while the validator would otherwise pass.
  # Error on any of the three so a future author cannot quietly reopen the forge or ship an
  # unsolvable protected page. Where the landing secret is not a hard-access value (every awareness
  # page), nothing fires.
  #
  # Only the Array form of social.landingPages is iterated, matching exactly what the server serves a
  # phish secret from (Game#capture_secrets_for_client, game.rb:1428, `pages.is_a?(Array) ? pages :
  # []`). A Hash-form landingPages is never read by that serve path, so a hard-access secret authored
  # under a Hash form can never be served through the forge and needs no gate here; erroring on it
  # would be a false positive the server cannot reach (review R1, Minor 1).
  unless hard_access.empty?
    evidence_kits = BreakEscape::CaptureModel.page_evidence_kits(json_data)
    phish_target_ids = BreakEscape::CaptureModel.phish_target_ids(json_data).to_set
    social = json_data['social']
    array_pages = social.is_a?(Hash) && social['landingPages'].is_a?(Array) ? social['landingPages'] : []
    array_pages.each do |page|
      next unless page.is_a?(Hash)

      capture = page['capture']
      next unless capture.is_a?(Hash)

      secret = capture['secret']
      next unless BreakEscape::CaptureModel.present_string?(secret) && BreakEscape::CaptureModel.lock_answer?(hard_access, secret)

      page_id = page['id']
      page_label = BreakEscape::CaptureModel.present_string?(page_id) ? page_id : '(no id)'

      # 1. A link kit must name the page.
      info = BreakEscape::CaptureModel.present_string?(page_id) ? evidence_kits[page_id] : nil
      unless info.is_a?(Hash) && Array(info[:kits]).any?
        err.call("landing page '#{page_label}' carries a capture.secret that is also a password or PIN " \
                 'lock code, an RFID or biometric requires, a Wi-Fi PSK or a flag, but no ' \
                 'social.mailClient.payloadKit link kit names it (landingPageId), so the server cannot ' \
                 'gate the reveal on a built page and a landed send. A tampered client could forge the ' \
                 'build and send and be served the secret. Wire the page through a link kit, or make the ' \
                 'secret open nothing.')
        next
      end

      # 2. Some authored phish target the page aims at must exist (kit reachability, structural).
      page_targets = page['targets'].is_a?(Hash) ? page['targets'].keys : []
      aimed = page_targets.select { |t| phish_target_ids.include?(t.to_s) }
      if aimed.empty?
        err.call("landing page '#{page_label}' carries a capture.secret that is also a password or PIN " \
                 'lock code, an RFID or biometric requires, a Wi-Fi PSK or a flag, and a link kit names ' \
                 'it, but no authored social.phishTargets entry is one the page aims at (its \'targets\' ' \
                 'map), so the link kit has no real target to be sent to and the server can never record ' \
                 'a landed send for it. Add a phish target id to the page\'s targets map, or make the ' \
                 'secret open nothing. (The full check that a composed message can actually land needs ' \
                 'the send judge PhishJudge, chunk 4.)')
        next
      end

      # 3. The page must be buildable for some aimed target (PhishScore: a choice set meets threshold).
      next if aimed.any? { |target_id| landing_page_buildable?(page, target_id) }

      err.call("landing page '#{page_label}' carries a capture.secret that is also a password or PIN " \
               'lock code, an RFID or biometric requires, a Wi-Fi PSK or a flag wired through a link ' \
               'kit, but no closed-menu choice set reaches its linkThreshold for any phish target the ' \
               'page aims at (checked with BreakEscape::PhishScore), so the page can never be scored ' \
               'convincing, the server can never record a built page, and the secret is withheld from ' \
               'honest play. Lower the target linkThreshold or minDomainTier, fix the page menus, or ' \
               'make the secret open nothing.')
    end
  end

  # Access lists: people must be room NPCs; roles should be held by someone
  roles_held = room_npcs.flat_map { |e| ai.identity_roles(e[:npc]) }.to_set
  acl_sources = []
  rooms.each { |room_id, room| acl_sources << [room['access'], "rooms/#{room_id}"] if room.is_a?(Hash) && room.key?('access') }
  objects.each { |e| acl_sources << [e[:object]['access'], e[:path]] if e[:object].key?('access') }
  profiles.each do |profile_id, profile|
    next unless profile.is_a?(Hash)

    acl = profile['for']
    if !acl.is_a?(Hash) || (Array(acl['roles']).empty? && Array(acl['people']).empty?)
      warn.call("profile 'accountProfiles/#{profile_id}' has no 'for' roles or people, so it admits nobody.")
    else
      acl_sources << [acl, "accountProfiles/#{profile_id}/for"]
    end
  end
  acl_sources.each do |acl, where|
    unless acl.is_a?(Hash)
      err.call("'#{where}' access list must be an object { roles, people }.")
      next
    end
    Array(acl['people']).each do |person|
      next if npc_by_id.key?(person.to_s)

      err.call("'#{where}' names unknown person '#{person}' (people must be room NPC ids).")
    end
    Array(acl['roles']).each do |role|
      next if roles_held.include?(role.to_s)

      warn.call("'#{where}' admits role '#{role}', which no NPC holds.")
    end
  end

  # Policies
  if json_data.key?('defaultPolicy') && !policies.key?(json_data['defaultPolicy'].to_s)
    err.call("defaultPolicy '#{json_data['defaultPolicy']}' names no entry in 'policies'.")
  end
  objects.each do |e|
    next unless e[:object].key?('policy')
    next if policies.key?(e[:object]['policy'].to_s)

    err.call("'#{e[:path]}' policy '#{e[:object]['policy']}' names no entry in 'policies'.")
  end

  # remoteScreen (credential keyring K0, section 5.3): a policy with remoteScreen on a
  # remote: "blocked" policy warns (no remote screen opens); remoteScreen: "tiles" on a
  # policy only PCs with loginPicker:false or headless PCs use draws an info line (no PC
  # tiles ever show through it).
  # The sign-in PCs whose effective policy is the named one. The policy name is resolved
  # without ActiveSupport (the validator never requires it; .presence would crash, R1 B1),
  # matching the idiom used for defaultPolicy above.
  pcs_under = lambda do |policy_name|
    pcs.select do |e|
      p = e[:object]['policy']
      used = (p.is_a?(String) && !p.empty? ? p : json_data['defaultPolicy']).to_s
      used == policy_name
    end
  end
  tiles_capable = lambda do |pc|
    picker = pc.key?('loginPicker') ? pc['loginPicker'] : 'accounts'
    !(picker == false) && !(pc['headless'] == true)
  end
  policies.each do |policy_name, policy|
    next unless policy.is_a?(Hash) && policy.key?('remoteScreen')

    if policy['remote'] == 'blocked'
      warn.call("policy '#{policy_name}' sets remoteScreen but remote is 'blocked', so no remote sign-in screen opens under it.")
      # The warning already says no screen opens under a blocked policy; the info line below
      # would double the noise for the same condition (R1 m2), so stop here.
      next
    end
    # Only when PCs are actually under the policy and none could ever tile: a policy no PC
    # uses is odd on its own but does not mean "no PC tiles show" (R1 m1).
    under = pcs_under.call(policy_name.to_s)
    if policy['remoteScreen'] == 'tiles' && under.any? && under.none? { |e| tiles_capable.call(e[:object]) }
      issues << "ℹ️ access model: policy '#{policy_name}' has remoteScreen 'tiles' but every PC under it has loginPicker false or is headless, so no PC tiles show over the network."
    end
  end

  # Profile item ids: unique across profiles and room objects (section 5.1)
  room_ids = objects.map { |e| e[:object]['id'] }.compact.map(&:to_s).to_set
  profile_items = []
  walk_profile = lambda do |list, path|
    next unless list.is_a?(Array)

    list.each_with_index do |item, i|
      next unless item.is_a?(Hash)

      profile_items << [item, "#{path}[#{i}]"]
      walk_profile.call(item['contents'], "#{path}[#{i}]/contents")
    end
  end
  profiles.each { |profile_id, profile| walk_profile.call(profile['contents'], "accountProfiles/#{profile_id}/contents") if profile.is_a?(Hash) }
  seen_profile_ids = {}
  profile_items.each do |item, path|
    id = item['id']
    next if id.nil? || id.to_s.empty?

    if seen_profile_ids.key?(id.to_s)
      err.call("profile item id '#{id}' is used twice ('#{seen_profile_ids[id.to_s]}' and '#{path}'). Item ids are global.")
    else
      seen_profile_ids[id.to_s] = path
    end
    err.call("profile item id '#{id}' at '#{path}' is also a room object's id. Item ids are global.") if room_ids.include?(id.to_s)
  end

  # Cards: a keycard's identity must carry its card_id; a requires card on an access lock must exist
  card_info = ai.cards(json_data)
  keycard_items = objects.map { |e| [e[:object], e[:path]] } + profile_items
  Array(json_data['startItemsInInventory']).each_with_index { |item, i| keycard_items << [item, "startItemsInInventory[#{i}]"] if item.is_a?(Hash) }
  keycard_items.each do |item, path|
    next unless item.key?('identity')

    holder = npc_by_id[item['identity'].to_s]
    holder_card = holder && ai.card_id_of(ai.npc_card(holder[:npc]))
    next if holder_card && holder_card == item['card_id'].to_s

    err.call("'#{path}' identity '#{item['identity']}' names no NPC carrying its card_id '#{item['card_id']}'.")
  end
  known_cards = Set.new(card_info.keys)
  find_card_ids = lambda do |node|
    case node
    when Array then node.each { |n| find_card_ids.call(n) }
    when Hash
      known_cards << node['card_id'].to_s if node['card_id'].is_a?(String) || node['card_id'].is_a?(Integer)
      node.each_value { |v| find_card_ids.call(v) }
    end
  end
  find_card_ids.call(json_data)

  # lockoutSeconds only does anything on a password lock (room or object)
  lockout_nodes = rooms.filter_map { |id, room| [room, "rooms/#{id}"] if room.is_a?(Hash) }
  lockout_nodes += objects.map { |e| [e[:object], e[:path]] }
  lockout_nodes.each do |lock, path|
    next unless lock.key?('lockoutSeconds') && lock['lockType'] != 'password'

    warn.call("'#{path}' has 'lockoutSeconds' but its lock is not a password lock (lockType " \
              "#{lock['lockType'].inspect}); only a password pad reads it.")
  end

  # rfid locks: requires or access; requires cards on an access lock must exist
  rfid_nodes = rooms.filter_map { |id, room| [room, "rooms/#{id}"] if room.is_a?(Hash) && room['lockType'] == 'rfid' }
  rfid_nodes += objects.filter_map { |e| [e[:object], e[:path]] if e[:object]['lockType'] == 'rfid' }
  rfid_nodes.each do |lock, path|
    requires = Array(lock['requires']).reject { |r| r.nil? || r.to_s.empty? }
    if requires.empty? && !lock.key?('access')
      err.call("'#{path}' is an rfid lock with neither 'requires' nor 'access', so no card can open it.")
    end
    next unless lock.key?('access')

    requires.each do |card_id|
      next if known_cards.include?(card_id.to_s)

      err.call("'#{path}' requires card '#{card_id}', which no NPC or keycard carries.")
    end
  end

  # Gate doors take no access list in the first slice (section 4.1)
  rooms.each do |room_id, room|
    next unless room.is_a?(Hash) && room['doors'].is_a?(Array)

    room['doors'].each_with_index do |door, i|
      # The schema types each entry as an object, so from the command line validation stops
      # before this; these cover a scenario checked without the schema. doors.js reads
      # connectedRoom on every entry: null throws and the room's doors are never built, and
      # any other non-object has no connectedRoom, so it matches no doorway and is skipped.
      if door.nil?
        err.call("'rooms/#{room_id}/doors[#{i}]' is null; doors.js throws reading its connectedRoom, so the " \
                 "doors of '#{room_id}' are never built.")
        next
      end
      unless door.is_a?(Hash)
        warn.call("'rooms/#{room_id}/doors[#{i}]' is not an object, so the engine skips it.")
        next
      end

      # A lock on a door entry is never read: the bootstrap scenario has no doors, so doors.js
      # finds no entry to read lock fields from, and the door and the server take the lock
      # from the room it leads into. That includes requires: a gate's card is the room's
      # requires. A requires that repeats the room's is harmless and draws nothing.
      target_room = rooms[door['connectedRoom']]
      if door.key?('requires')
        door_cards = Array(door['requires']).map(&:to_s).sort
        room_cards = Array(target_room.is_a?(Hash) ? target_room['requires'] : nil).map(&:to_s).sort
        if door_cards != room_cards
          # Either value may be a PIN or password (on the room, or meant for the entry), so
          # neither is shown
          warn.call("'rooms/#{room_id}/doors[#{i}]' has a 'requires' that differs from the requires on room " \
                    "'#{door['connectedRoom']}' (values not shown); the gate and the door use the room's, and " \
                    'the game never reads requires on a door entry.')
        end
      end
      DOOR_ENTRY_LOCK_FIELDS.each do |field|
        next unless door.key?(field)

        warn.call("'rooms/#{room_id}/doors[#{i}]' has '#{field}', which the game never reads on a door entry " \
                  "(the bootstrap scenario has no doors); put it on room '#{door['connectedRoom']}'.")
      end

      # An access list belongs on the room the door leads into: the server reads the room
      # (section 6), so a list on a door entry would be a client-only rule.
      %w[access acceptsUIDOnly].each do |field|
        next unless door.key?(field)

        err.call("'rooms/#{room_id}/doors[#{i}]' has '#{field}'; put it on room '#{door['connectedRoom']}', " \
                 'which is where the server reads it.')
      end
      next unless door['gate'].is_a?(Hash) && door['gate']['enabled'] != false

      # doors.js reads a door entry only when it matches a doorway of the room (connections
      # plus direction, first match wins), so a gate on any other entry does nothing
      at = "'rooms/#{room_id}/doors[#{i}]' has a gate into '#{door['connectedRoom']}'"
      dead = 'so the engine never reads it: the gate does nothing and the door behaves as an ordinary door.'
      case BreakEscape::NpcHabits.doorway_problem(room, i)
      when :no_direction
        said = if door.key?('direction')
                 "direction #{door['direction'].inspect}, which is not north, south, east or west (lower case),"
        else
                 "no 'direction' (north, south, east or west),"
        end
        warn.call("#{at} but #{said} #{dead} Add the direction under which room '#{room_id}' lists " \
                  "'#{door['connectedRoom']}' in its connections.")
        next
      when :no_connection
        warn.call("#{at} on its '#{door['direction']}' door, but room '#{room_id}' lists no " \
                  "'#{door['connectedRoom']}' under connections.#{door['direction']}, #{dead} Fix the direction " \
                  'or the connectedRoom.')
        next
      when :shadowed
        warn.call("#{at}, but an earlier entry in doors matches the same doorway and the engine reads only " \
                  "the first, #{dead} Put the gate on the first entry and drop this one.")
        next
      end

      target = rooms[door['connectedRoom']]
      if door.key?('access') || (target.is_a?(Hash) && target.key?('access'))
        err.call("'rooms/#{room_id}/doors[#{i}]' is a gate door into '#{door['connectedRoom']}' with an 'access' " \
                 'list; gate doors open from requires alone, so use requires (or drop the gate).')
      end

      # The live window (door-gates.js isInert): an optional condition in the action-condition
      # grammar. The engine treats an unparsable one as always live, so it is an error here.
      if door['gate'].key?('activeIf')
        active_if = door['gate']['activeIf']
        problem = action_condition_problem(active_if)
        if problem
          err.call("'rooms/#{room_id}/doors[#{i}]/gate/activeIf' #{problem}. The engine reads an unparsable " \
                   'condition as always live, so the gate would never be inert.')
        else
          declared = json_data['globalVariables'].is_a?(Hash) ? json_data['globalVariables'] : {}
          active_if.scan(/globalVars\.(\w+)/).flatten.uniq.each do |name|
            next if declared.key?(name)

            err.call("'rooms/#{room_id}/doors[#{i}]/gate/activeIf' reads globalVars.#{name}, which is not a declared global.")
          end
        end
      end

      # The gate's secured room is its entry's connectedRoom, so the entry must lead into
      # the locked room of the pair
      here_locked = room['locked'] == true
      there_locked = target.is_a?(Hash) && target['locked'] == true
      if here_locked && !there_locked
        err.call("'rooms/#{room_id}/doors[#{i}]' puts a gate on the door out of locked room '#{room_id}' into " \
                 "'#{door['connectedRoom']}'. Put the gate on the door that leads into the locked room " \
                 "(a door entry in '#{door['connectedRoom']}' with connectedRoom '#{room_id}').")
      end
    end
  end

  # Sign-in PCs
  npc_records = scenario_npc_records(json_data).map(&:first) + other_records.map(&:first)
  reward_targets = Set.new
  find_rewards = lambda do |node|
    case node
    when Array then node.each { |n| find_rewards.call(n) }
    when Hash
      reward_targets << node['objectId'].to_s if node['type'] == 'unlock_object' && node.key?('objectId')
      node.each_value { |v| find_rewards.call(v) }
    end
  end
  find_rewards.call(json_data)
  # Owner claim q78, judged as the server judges it: on the data as prepared at game creation
  # (habits expanded, so habits.screen is filled; object ids stamped), and only where check 10 is
  # the reason the claim is refused. An owner with no account or not on the PC's access list, a
  # screen that always locks and a policy with autoLockMin 0 are refused by an earlier check.
  claim_data = nil
  owner_never_leaves = lambda do |raw_pc, owner_id|
    claim_data ||= BreakEscape::NpcHabits.expanded_copy(json_data).first
    c_pc = ai.sign_in_pcs(claim_data).map { |x| x[:object] }.find { |o| raw_pc['id'] && o['id'] == raw_pc['id'] } || raw_pc
    c_owner = ai.room_npcs(claim_data).map { |x| x[:npc] }.find { |n| n['id'].to_s == owner_id.to_s }
    next false unless c_owner
    # Game#claim_login_session! checks 4 and 5 (account_holder?, pc_admits_account?)
    next false unless ai.account_admitted?(c_pc, c_owner)
    next false if ai.screen_always_locks?(c_pc, c_owner)

    c_policy = claim_data['policies'].is_a?(Hash) ? claim_data['policies'][(c_pc['policy'] || claim_data['defaultPolicy']).to_s] : nil
    next false if c_policy.is_a?(Hash) && c_policy['autoLockMin'].is_a?(Numeric) && c_policy['autoLockMin'].zero?

    BreakEscape::OwnerClaim.never_leaves?(claim_data, c_owner, c_pc)
  end
  pcs.each do |e|
    pc = e[:object]
    where = "sign-in PC '#{pc['id'] || e[:path]}'"
    err.call("#{where} id contains '|', which the server uses as a separator in sign-in failure keys.") if pc['id'].to_s.include?('|')
    if pc.key?('triggerOnInteract')
      err.call("#{where} has triggerOnInteract; its interaction is the sign-in flow. Map pc_signed_in or " \
               'workstation events instead.')
    end
    npc_records.each do |npc|
      next unless npc['unlockable'].is_a?(Array) && npc['unlockable'].map(&:to_s).include?(pc['id'].to_s)

      err.call("NPC '#{npc['id']}' lists #{where} in 'unlockable'; a sign-in PC opens only through a sign-in.")
    end
    if [pc['id'], pc['name']].compact.map(&:to_s).any? { |ref| reward_targets.include?(ref) }
      err.call("an unlock_object flag reward names #{where}; a sign-in PC opens only through a sign-in.")
    end

    owner_id = ai.owner_id(pc, json_data)
    if owner_id
      owner = npc_by_id[owner_id.to_s]
      if owner.nil?
        err.call("#{where} owner '#{owner_id}' names unknown person (it must be a room NPC id).")
      else
        lock_chance = pc['lockChance']
        if lock_chance.is_a?(Numeric) && lock_chance.positive? && lock_chance < 1
          warn.call("#{where} has lockChance #{lock_chance}: whether its owner's session is left open depends on a " \
                    'seeded roll. Fix the chance at 0 or 1, or make sure another route exists.')
        end
        if !ai.needs_tracked?(owner[:npc])
          warn.call("#{where} is owned by '#{owner_id}', who has no valid needs or interests entry, so the owner " \
                    'never leaves and no unlocked session is possible there.')
        elsif owner_never_leaves.call(pc, owner_id)
          # Owner claim q78: the server refuses a claim here too
          warn.call("#{where} is owned by '#{owner_id}', whom nothing sends away from the post in a way that " \
                    'can leave the screen open: no need is met by any object other than their own post (in any room), no ' \
                    'print errand or failure route, no patrol, scripted move, patrol_mode ink tag or unreadable story, ' \
                    'social media need, station hook, interest, phone answering, print habit or movable source, and a ' \
                    'knock-out is either ' \
                    'impossible (disableAttacks or koImmune) or always locks this screen. No unlocked session is ' \
                    'possible there and the server refuses a claim. If the screen is meant to be found open, give ' \
                    'the owner a need met somewhere else, or allow attacks and give the PC a lockChance below 1.')
        end
      end
    end

    policy = policies[(pc['policy'] || json_data['defaultPolicy']).to_s]
    if policy.is_a?(Hash) && ai.positive_number?(policy['maxAttempts'])
      warn.call("#{where} is under a policy with maxAttempts #{policy['maxAttempts']}: a lockout lasts the mission, " \
                'so confirm another route exists.')
    end
  end
  accounts.each do |e|
    home = e[:npc]['needsHome']
    next unless home.is_a?(String) && pc_ids.include?(home)

    pc = pcs.find { |p| p[:object]['id'] == home }[:object]
    next if ai.account_admitted?(pc, e[:npc])

    warn.call("account '#{e[:npc]['id']}' has needsHome '#{home}', a sign-in PC whose access list does not admit it.")
  end

  if repo_root
    home_facing_static_chair_conflicts(json_data, repo_root, room_npcs).each { |m| warn.call(m) }
  end

  # Owners placed in a different room from their workstation (section 5.4)
  workstations = objects.select { |e| ai.workstation?(e[:object]) }
  ws_room = {}
  workstations.each { |e| ws_room[e[:object]['id']] ||= e[:room] }
  reported = Set.new
  owner_pairs = []
  room_npcs.each do |e|
    home = e[:npc]['needsHome']
    owner_pairs << [e, home] if home.is_a?(String) && ws_room.key?(home)
  end
  workstations.each do |w|
    owner = w[:object]['owner']
    owner_pairs << [npc_by_id[owner], w[:object]['id']] if owner.is_a?(String) && npc_by_id[owner]
  end
  owner_pairs.each do |e, ws_id|
    next if e[:room] == ws_room[ws_id] || reported.include?([e[:npc]['id'], ws_id])

    reported << [e[:npc]['id'], ws_id]
    warn.call("NPC '#{e[:npc]['id']}' owns workstation '#{ws_id}' in room '#{ws_room[ws_id]}' but is placed in room " \
              "'#{e[:room]}'. The needs system starts every NPC at its post, so the PC reads as in use until the " \
              "owner's first leave.")
  end

  # Ink: no account password in any compiled ink file; #clone_keycard of another NPC's card
  if repo_root
    ink_users = Hash.new { |h, k| h[k] = Set.new }
    find_story = lambda do |node|
      case node
      when Array then node.each { |n| find_story.call(n) }
      when Hash
        if node['storyPath'].is_a?(String) && node['storyPath'].start_with?('scenarios/')
          compiled = File.expand_path(File.join(repo_root, node['storyPath'].sub(/\.ink\z/, '.json')))
          ink_users[compiled]
          ink_users[compiled] << node['id'].to_s if node['id']
        end
        node.each_value { |v| find_story.call(v) }
      end
    end
    find_story.call(json_data)
    Dir.glob(File.join(scenario_dir, 'ink', '*.json')).each { |f| ink_users[File.expand_path(f)] } if scenario_dir
    root_prefix = "#{File.expand_path(repo_root)}/"
    passwords = accounts.filter_map do |e|
      pw = e[:npc]['creds']['password']
      [e[:npc]['id'], pw] if pw.is_a?(String) && !pw.empty?
    end
    ink_users.each do |compiled, users|
      source = compiled.sub(/\.json\z/, '.ink')
      label = File.expand_path(compiled).delete_prefix(root_prefix)
      compiled_text = if File.exist?(compiled)
                        begin
                          strings = []
                          collect = lambda do |node|
                            case node
                            when String then strings << node
                            when Array then node.each { |n| collect.call(n) }
                            when Hash then node.each { |k, v| strings << k.to_s; collect.call(v) }
                            end
                          end
                          collect.call(JSON.parse(File.read(compiled)))
                          strings.join("\n")
                        rescue JSON::ParserError
                          File.read(compiled)
                        end
      end
      source_text = File.exist?(source) ? File.read(source) : nil
      text = compiled_text || source_text
      next unless text

      passwords.each do |npc_id, pw|
        next unless text.include?(pw)

        err.call("NPC '#{npc_id}' creds.password appears in ink file '#{label}'. Ink is served verbatim; give the " \
                 'password away through a capture or an authored note instead.')
      end

      next if users.empty?

      (source_text || text).scan(/#\s*\^?clone_keycard:([A-Za-z0-9_.\-]+)/).flatten.uniq.each do |card_id|
        holders = card_info[card_id]
        next unless holders

        holder_ids = holders[:holders].map { |h| h[:npc]['id'].to_s }
        next if (holder_ids & users.to_a).any?

        warn.call("'#{label}' has #clone_keycard:#{card_id}, which is #{holder_ids.map { |id| "'#{id}'" }.join(', ')}'s " \
                  "card, not the speaking NPC's (#{users.map { |id| "'#{id}'" }.join(', ')}). The copy works through " \
                  "'requires' only and carries no identity.")
      end
    end
  end

  # Shared cards at access locks, and identity reach
  reach = ai.reach(json_data)
  reach[:cards].each do |c|
    next unless c[:holders].size > 1

    access_locks = c[:opens].select { |l| l[:lock].key?('access') }
    next if access_locks.empty?

    warn.call("card '#{c[:card_id]}' is carried by #{c[:holders].map { |h| "'#{h[:npc]['id']}'" }.join(', ')} and is " \
              "used at access lock(s) #{access_locks.map { |l| "'#{l[:id]}'" }.join(', ')}: it opens what any holder may.")
  end
  if ai.uses_access_model?(json_data)
    describe = ->(l) { "#{l[:kind] == 'door' ? 'door' : 'object'} '#{l[:id]}'" }
    reach[:cards].each do |c|
      holders = c[:holders].map { |h| h[:npc]['id'] }.join(', ')
      opens = c[:opens].empty? ? 'nothing' : c[:opens].map(&describe).join(', ')
      issues << "ℹ️ Identity reach: card '#{c[:card_id]}' (#{holders}) opens #{opens}"
    end
    reach[:accounts].each do |a|
      opens = a[:opens].empty? ? 'no sign-in PC' : a[:opens].map { |l| "'#{l[:id]}'" }.join(', ')
      issues << "ℹ️ Identity reach: account '#{a[:npc]['creds']['username']}' (#{a[:npc]['id']}) signs in at #{opens}"
    end
  end

  # closeDoor names a room with no gate (scenario-schema.json closeDoor: "Warns if the door is
  # not a gate"). door-gates.js closeNow matches a gate whose own room or connectedRoom is the
  # id, among the gates it registers: enabled, on an entry doors.js
  # reads. Anything else only logs a console warning in play. Unknown room ids are reported by
  # the schema's room reference check, so they are skipped here.
  if rooms.any?
    gated = BreakEscape::NpcHabits.gate_entries(json_data)
                                  .reject { |g| g[:doorway] }
                                  .flat_map { |g| [g[:room], g[:connected_room]] }.grep(String).to_set
    walk_close = lambda do |node, path|
      case node
      when Hash
        if node.key?('closeDoor')
          Array(node['closeDoor']).grep(String).each do |rid|
            next unless rooms.key?(rid) && !gated.include?(rid)

            warn.call("'#{path}' closeDoor '#{rid}': no gate door leads into or out of that room, so " \
                      'nothing shuts in play. Add a gate on a north or south door of that room, or name ' \
                      'the room the gate is on.')
          end
        end
        node.each { |k, v| walk_close.call(v, path.empty? ? k.to_s : "#{path}/#{k}") }
      when Array
        node.each_with_index { |v, i| walk_close.call(v, "#{path}/#{i}") }
      end
    end
    walk_close.call(json_data, '')
  end

  issues
end

# Main execution
# A json-schema message as one validator line: "❌ ERROR: schema: <json pointer> (<where>): <message>",
# without the gem's opaque "in schema <uuid>" tail, naming the room, object or NPC the pointer reaches.
def format_schema_error(json_data, message)
  text = message.to_s.sub(/ in schema [0-9a-f-]+#?\s*\z/, '')
  m = text.match(/\AThe property '(#[^']*)' (.*)\z/m)
  return "❌ ERROR: schema: #{text}" unless m

  "❌ ERROR: schema: #{m[1]}#{describe_schema_pointer(json_data, m[1])}: #{m[2]}"
end

def describe_schema_pointer(data, pointer)
  segs = pointer.sub(%r{\A#/?}, '').split('/').map { |s| s.gsub('~1', '/').gsub('~0', '~') }
  node = data
  labels = []
  segs.each_with_index do |seg, i|
    node =
      if node.is_a?(Hash) then node[seg]
      elsif node.is_a?(Array) && seg.match?(/\A\d+\z/) then node[seg.to_i]
      end
    parent = i.positive? ? segs[i - 1] : nil
    if i == 1 && segs[0] == 'rooms'
      labels << "room '#{seg}'"
    elsif parent == 'objects' && node.is_a?(Hash)
      labels << "object '#{node['id'] || node['name'] || seg}'"
    elsif parent == 'npcs' && node.is_a?(Hash)
      labels << "NPC '#{node['id'] || node['displayName'] || seg}'"
    end
    break if node.nil?
  end
  labels.empty? ? '' : " (#{labels.join(', ')})"
rescue StandardError
  ''
end

# Ink issues that mean a file did not compile: the checks that read its compiled JSON were skipped.
INK_COMPILE_FAILURE_RE = ValidatorReport::INK_COMPILE_FAILURE_RE

def print_issue_list(report, issues, error_header:, warning_header:, ok_line:, blank_after_each: true)
  report.run_check(report.stage, 'print_issue_list', fallback: nil) do
    print_issue_list_unguarded(report, issues, error_header: error_header, warning_header: warning_header,
                                               ok_line: ok_line, blank_after_each: blank_after_each)
  end
end

def print_issue_list_unguarded(report, issues, error_header:, warning_header:, ok_line:, blank_after_each:)
  errors = issues.count { |i| report.error_line?(i) }
  if errors.positive?
    report.header("✗ #{error_header} #{errors} error(s):")
  elsif issues.any?
    report.header("⚠️ #{warning_header.sub('%d', issues.length.to_s)}")
  else
    puts ok_line
    puts
    return
  end
  puts
  issues.each_with_index do |issue, index|
    puts "#{index + 1}. #{issue}"
    puts if blank_after_each
  end
  puts unless blank_after_each
end

def main
  options = {
    schema_path: File.join(__dir__, 'scenario-schema.json'),
    verbose: false,
    output_json: false,
    no_graph: false,
    skip_ink: false,
    no_lint: false,
    strict_social: false,
    known_failures: File.join(__dir__, 'validator_known_failures.json'),
    campaign: false,
    office_summary: false
  }

  OptionParser.new do |opts|
    opts.banner = "Usage: #{$PROGRAM_NAME} <scenario.json.erb> [options]\n" \
                  'Exits 1 when any ❌ line is not covered by the known-failures list.'

    opts.on('-s', '--schema PATH', 'Path to JSON schema file') do |path|
      options[:schema_path] = path
    end

    opts.on('-v', '--verbose', 'Show detailed validation output') do
      options[:verbose] = true
    end

    opts.on('-o', '--output-json', 'Output the rendered JSON to stdout') do
      options[:output_json] = true
    end

    opts.on('--no-graph', 'Skip dungeon graph generation (dungeon_graph.html/.md/.json are not written or rewritten)') do
      options[:no_graph] = true
    end

    opts.on('--skip-ink', 'Skip ink file compilation validation (faster, but less thorough)') do
      options[:skip_ink] = true
    end

    opts.on('--strict-social', 'Accepted for older callers (CI). Every ❌ line, social ones included, already fails the run') do
      options[:strict_social] = true
    end

    opts.on('--no-lint', 'Skip the DIALOGUE LINT section (dialoguelint.mjs over the mission folder)') do
      options[:no_lint] = true
    end

    opts.on('--known-failures PATH', 'Known-failures list to read (default scripts/validator_known_failures.json)') do |path|
      options[:known_failures] = path
    end

    opts.on('--no-known-failures', 'Ignore the known-failures list and show the raw result') do
      options[:known_failures] = nil
    end

    opts.on('--campaign', 'Treat this scenario as a campaign mission for the office-life checks V2, V4 and V5 (fixture tests)') do
      options[:campaign] = true
    end

    opts.on('--office-summary', 'Print the office-life summary (V1): one line per NPC, sorted by id so it diffs') do
      options[:office_summary] = true
    end

    opts.on('-h', '--help', 'Show this help message') do
      puts opts
      exit 0
    end
  end.parse!

  erb_path = ARGV[0]

  if erb_path.nil? || erb_path.empty?
    $stderr.puts "ERROR: No scenario.json.erb file specified"
    $stderr.puts "Usage: #{$PROGRAM_NAME} <scenario.json.erb> [options]"
    exit 1
  end

  erb_path = File.expand_path(erb_path)
  schema_path = File.expand_path(options[:schema_path])
  repo_root = File.expand_path('..', __dir__)
  rel_path = erb_path.start_with?("#{repo_root}/") ? erb_path.delete_prefix("#{repo_root}/") : erb_path

  known_error = nil
  known = begin
    ValidatorReport.load_known_failures(options[:known_failures] && File.expand_path(options[:known_failures]))
  rescue StandardError => e
    known_error = e
    []
  end

  real_out = $stdout
  real_out.sync = true
  report = ValidatorReport.new(real_out, scenario_paths: [rel_path, erb_path], known_failures: known)
  $stdout = report
  code = 1
  begin
    if known_error
      report.stage = 'common'
      puts "❌ ERROR: known-failures list could not run: #{known_error.message.to_s.lines.first.to_s.strip}"
      puts
    end
    run_validation(report, erb_path, schema_path, repo_root, options)
  rescue StandardError, ScriptError => e
    report.stage = 'common'
    puts "❌ ERROR: validator could not run: #{e.class}: #{e.message.to_s.lines.first.to_s.strip}"
    puts e.backtrace.join("\n") if options[:verbose]
    ValidatorReport::STAGES.each { |s| report.not_full!(s, 'validator raised') }
  ensure
    code = report.finish
    $stdout = real_out
  end
  exit code
end

# ---------------------------------------------------------------------------
# Step 4. Reference and id checks driven by schema annotations.
#
# Every property that names something carries "x-ref": "<kind>" in the schema (on the property, or,
# for an array of references, on its items). This check walks the scenario with the shared schema
# walker (BreakEscape::SchemaWalk, which pairs each value with its schema Node through the step 2b
# resolver), reads the x-ref kind off each string leaf's Node, and resolves it against an index of
# every id of that kind in the scenario. An unresolved reference is a ⚠️ WARNING; the existing
# one-off checks that already error (connections, targetRoom, unlockDoor, setVariable globals) keep
# their level, so x-ref is placed on the fields they do not cover.
#
# It also reports id-uniqueness: an object id used by two objects at any depth, and an NPC id used
# twice, each a warning (the social lint already errors on duplicate top-level room-object ids, so
# those are left to it); a string used as both a task id and a global is a note.

# Collect every object/item id at any depth: rooms[*].objects and their contents/itemsHeld, plus
# startItemsInInventory. Yields [id, path_string] for each object that carries a non-empty id.
def each_object_id(json_data)
  return enum_for(:each_object_id, json_data) unless block_given?

  visit = lambda do |obj, path|
    next unless obj.is_a?(Hash)

    id = obj['id']
    yield id, path if id.is_a?(String) && !id.empty?
    %w[contents itemsHeld].each do |key|
      Array(obj[key]).each_with_index { |child, i| visit.call(child, "#{path}/#{key}[#{i}]") }
    end
  end

  (json_data['rooms'] || {}).each do |room_id, room|
    next unless room.is_a?(Hash)

    Array(room['objects']).each_with_index { |obj, i| visit.call(obj, "rooms/#{room_id}/objects[#{i}]") }
  end
  Array(json_data['startItemsInInventory']).each_with_index do |obj, i|
    visit.call(obj, "startItemsInInventory[#{i}]")
  end
end

# Every id of an item that an action creates in the inventory: a give_item action's nested "item"
# object, anywhere in the scenario (triggerOnInteract, flagRewards, onConfirm, timers, onInteract).
# Yields the id string. These are not in any room's objects, so each_object_id misses them, but a
# wear/take_off/unlock_object reference can name them, so the index needs them.
def each_given_item_id(json_data)
  return enum_for(:each_given_item_id, json_data) unless block_given?

  visit = lambda do |node|
    case node
    when Hash
      item = node['item']
      if item.is_a?(Hash) && item['id'].is_a?(String) && !item['id'].empty?
        yield item['id']
      end
      node.each_value { |v| visit.call(v) }
    when Array
      node.each { |v| visit.call(v) }
    end
  end
  visit.call(json_data)
end

# Every NPC id: rooms[*].npcs, top-level npcs and phoneNPCs. Yields [id, path_string].
def each_npc_id(json_data)
  return enum_for(:each_npc_id, json_data) unless block_given?

  (json_data['rooms'] || {}).each do |room_id, room|
    next unless room.is_a?(Hash)

    Array(room['npcs']).each_with_index do |npc, i|
      yield npc['id'], "rooms/#{room_id}/npcs[#{i}]" if npc.is_a?(Hash) && npc['id'].is_a?(String) && !npc['id'].empty?
    end
  end
  %w[npcs phoneNPCs].each do |key|
    Array(json_data[key]).each_with_index do |npc, i|
      yield npc['id'], "#{key}[#{i}]" if npc.is_a?(Hash) && npc['id'].is_a?(String) && !npc['id'].empty?
    end
  end
end

# The index of every id by x-ref kind. Globals are the declared globalVariables plus the
# engine-written patterns the schema lists under "x-engineGlobals" (e.g. "<npcId>_frustration").
def build_reference_index(json_data)
  object_ids = Set.new
  each_object_id(json_data) { |id, _| object_ids.add(id) }
  # Items defined inside a give_item action (triggerOnInteract, flagRewards, onConfirm, timers) are
  # real inventory ids a wear/take_off/unlock_object action can name, but they live in an action,
  # not in a room's objects, so each_object_id does not see them. Fold them into the object/item
  # index so such a reference resolves (e.g. lab_physical_pentest's granted hi-vis vest).
  each_given_item_id(json_data) { |id| object_ids.add(id) }
  npc_ids = Set.new
  each_npc_id(json_data) { |id, _| npc_ids.add(id) }
  room_ids = (json_data['rooms'] || {}).keys.to_set
  task_ids = Set.new
  aim_ids = Set.new
  Array(json_data['objectives']).each do |aim|
    next unless aim.is_a?(Hash)

    aim_ids.add(aim['aimId']) if aim['aimId'].is_a?(String)
    Array(aim['tasks']).each { |t| task_ids.add(t['taskId']) if t.is_a?(Hash) && t['taskId'].is_a?(String) }
  end

  globals = (json_data['globalVariables'] || {}).keys.to_set
  engine = begin
    BreakEscape::ScenarioSchema.root.table.root_schema['x-engineGlobals']
  rescue StandardError
    nil
  end
  Array(engine).each do |pat|
    next unless pat.is_a?(Hash) && pat['suffix'].is_a?(String)

    over = pat['over'] == 'npc' ? npc_ids : object_ids
    over.each { |id| globals.add("#{id}#{pat['suffix']}") }
  end

  {
    'room' => room_ids,
    'npc' => npc_ids,
    'object' => object_ids,
    'item' => object_ids,
    'task' => task_ids,
    'aim' => aim_ids,
    'global' => globals,
    'network' => (json_data['networks'] || {}).keys.to_set,
    'resource' => (json_data['resources'] || {}).keys.to_set,
    'policy' => (json_data['policies'] || {}).keys.to_set,
    'role' => (json_data['roles'] || {}).keys.to_set
  }
end

def check_references(json_data, _repo_root = nil)
  issues = []
  return issues unless json_data.is_a?(Hash)

  index = build_reference_index(json_data)
  root = BreakEscape::ScenarioSchema.root
  BreakEscape::SchemaWalk.walk(json_data, root) do |value, node, path|
    next unless value.is_a?(String) && !value.empty?

    kind = BreakEscape::SchemaWalk.ref_kind(node)
    next unless kind

    known = index[kind]
    next if known.nil? || known.include?(value)

    issues << "⚠️ WARNING: '#{BreakEscape::SchemaWalk.path_string(path)}' references #{kind} '#{value}', " \
              'which is not defined in this scenario.'
  end

  issues.concat(reference_uniqueness_issues(json_data, index))
  issues
end

# Every room's "type" must be a room map the engine can load. The valid set is the engine's own
# tilemapTiledJSON registry (load_valid_room_types), the same way the sprite check reads the object
# asset files, so no hand-maintained enum can drift. An unknown type is an ❌ ERROR, as the sprite
# check reports an unknown object type: the room cannot load. Skipped when game.js cannot be found.
def check_room_types(json_data, repo_root)
  issues = []
  return issues unless json_data.is_a?(Hash)

  valid = load_valid_room_types(repo_root)
  if valid.nil?
    # Fail loudly, never silently: a missing game.js or a parse that finds no room maps means
    # the check could not run, and the author must know that rather than read a clean pass.
    return ["⚠️ WARNING: room type check skipped: public/break_escape/js/core/game.js is missing " \
            "or registers no tilemapTiledJSON room maps, so room 'type' values were not checked."]
  end

  (json_data['rooms'] || {}).each do |room_id, room|
    next unless room.is_a?(Hash)

    type = room['type']
    next unless type.is_a?(String) && !type.empty?
    next if valid.include?(type)

    issues << "❌ ERROR: room '#{room_id}' has type '#{type}', which no room map registers (no " \
              "tilemapTiledJSON('#{type}', ...) in game.js); check the spelling or add the room map."
  end

  issues
end

# Object ids reused at any depth, and NPC ids reused, each a warning. The social lint already errors
# on duplicate top-level room-object ids, so a set of occurrences that are all top-level room objects
# is left to it (no double report); any set that includes a nested occurrence is reported here.
def reference_uniqueness_issues(json_data, index = nil)
  index ||= build_reference_index(json_data)
  issues = []

  obj_paths = Hash.new { |h, k| h[k] = [] }
  each_object_id(json_data) { |id, path| obj_paths[id] << path }
  top_level = /\Arooms\/[^\/]+\/objects\[\d+\]\z/
  obj_paths.each do |id, paths|
    next if paths.length < 2
    next if paths.all? { |p| p =~ top_level } # the social lint's duplicate-object-ids error owns these

    issues << "⚠️ WARNING: object id '#{id}' is used by more than one object (#{paths.join(', ')}); " \
              'the unlock endpoint takes the first hit by id, so the others could never be targeted.'
  end

  npc_paths = Hash.new { |h, k| h[k] = [] }
  each_npc_id(json_data) { |id, path| npc_paths[id] << path }
  npc_paths.each do |id, paths|
    next if paths.length < 2

    issues << "⚠️ WARNING: NPC id '#{id}' is used by more than one NPC (#{paths.join(', ')}); give each a unique id."
  end

  # A string used as both a task id and a global can be confused by a bare-string reference field.
  (index['task'] & index['global']).each do |name|
    issues << "💡 SUGGESTION: '#{name}' is both a task id and a global variable; a bare-string reference to " \
              'it is ambiguous. Consider renaming one.'
  end

  issues
end

# The body of a run. It never exits: every section prints, and ValidatorReport#finish decides
# the exit code from the ❌ lines it counted.
def run_validation(report, erb_path, schema_path, repo_root, options)
  scenario_dir = File.dirname(erb_path)

  puts "Validating scenario: #{erb_path}"
  puts "Using schema: #{schema_path}"
  if File.expand_path(schema_path) != File.expand_path(BreakEscape::ScenarioSchema::DEFAULT_PATH)
    puts "Note: json-schema validation uses the above file, but note/id/free resolution (the grant walker, " \
         "unknown-key suggestions) always uses the repository schema, so the validator matches the server."
  end
  puts

  # Check scenario directory structure
  report.stage = 'common'
  puts "Checking scenario directory structure..."
  dir_issues = report.run_check('common', 'check_scenario_directory_structure') { check_scenario_directory_structure(erb_path) }
  if dir_issues.empty?
    puts "✓ Directory structure is valid"
  else
    puts "✗ Directory structure validation failed with #{dir_issues.length} error(s):"
    puts
    dir_issues.each_with_index { |issue, index| puts "#{index + 1}. #{issue}"; puts }
  end
  puts

  # Load valid item types from assets directory
  valid_item_types = load_valid_item_types(repo_root)
  if valid_item_types
    puts "Loaded #{valid_item_types.size} valid item types from assets/objects/"
  else
    report.header("⚠️ assets/objects/ directory not found — item type validation skipped")
  end
  puts

  # Render ERB to JSON. Nothing else can run without the rendered data.
  puts "Rendering ERB template..."
  begin
    json_data, rendered_json = render_erb_to_json(erb_path, {}, include_rendered: true)
  rescue StandardError, ScriptError => e
    puts "❌ ERROR: ERB render could not run: #{e.message.to_s.lines.first.to_s.strip}"
    puts
    ValidatorReport::STAGES.each { |s| report.not_full!(s, 'render failed') }
    return
  end
  puts "✓ ERB rendered successfully"
  puts

  # Carry-over: imported globals count as declared for every later check.
  own_globals = json_data.is_a?(Hash) ? (json_data['globalVariables'] || {}).dup : {}
  carry_imports = report.run_check('common', 'prepare_carry_over_globals', fallback: nil) { prepare_carry_over_globals(json_data) }

  if options[:output_json]
    puts "Rendered JSON:"
    report.raw(JSON.pretty_generate(json_data))
    puts
  end

  # Pre-validate structure. Structure errors are schema errors: they print, and the run goes on.
  report.stage = 'schema'
  puts "Checking JSON structure..."
  structure_issues = report.run_check('schema', 'check_structure_validity') do
    check_structure_validity(json_data) + check_duplicate_show_scenario_brief(rendered_json)
  end
  if structure_issues.empty?
    puts "✓ JSON structure is valid"
  else
    puts "✗ Structure validation failed with #{structure_issues.length} error(s):"
    puts
    structure_issues.each_with_index { |issue, index| puts "#{index + 1}. #{issue}"; puts }
  end
  puts

  # Check for unknown fields (warnings, not errors)
  report.stage = 'common'
  puts "Checking for unknown fields..."
  unknown_fields_warnings = report.run_check('common', 'check_unknown_fields') { check_unknown_fields(json_data) }
  if unknown_fields_warnings.any?
    report.header("⚠️ Found #{unknown_fields_warnings.length} unknown field(s):")
    puts
    unknown_fields_warnings.each_with_index { |warning, index| puts "#{index + 1}. #{warning}" }
  else
    puts "✓ No unknown fields"
  end
  puts

  puts "Checking desktop users (q94)..."
  desktop_user_issues = report.run_check('common', 'check_desktop_users') { check_desktop_users(json_data) }
  print_issue_list(report, desktop_user_issues, error_header: 'Desktop user check failed with',
                                                warning_header: 'Found %d desktop user warning(s):', ok_line: '✓ Desktop users valid')

  puts "Checking author notes hold no actions..."
  note_action_warnings = report.run_check('common', 'check_notes_hold_no_actions') { check_notes_hold_no_actions(json_data) }
  if note_action_warnings.any?
    report.header("⚠️ Found #{note_action_warnings.length} author note(s) holding an action:")
    puts
    note_action_warnings.each_with_index { |warning, index| puts "#{index + 1}. #{warning}" }
  else
    puts "✓ No author note holds an action"
  end
  puts

  # Check ink files exist and compile (unless skipped). An ink failure no longer stops the run.
  report.stage = 'ink'
  if options[:skip_ink]
    report.not_full!('ink', '--skip-ink')
    puts "⏭️ Skipping ink file validation (--skip-ink)"
    puts
  else
    puts "Checking ink files..."
    ink_issues = report.run_check('ink', 'check_ink_files') { check_ink_files(json_data, repo_root, scenario_dir) }
    print_issue_list(report, ink_issues, error_header: 'Ink file validation failed with',
                                         warning_header: 'Found %d ink file warning(s):', ok_line: '✓ All ink files valid')
    compile_failures = ink_issues.count { |i| i.to_s.start_with?('❌') && i.to_s.match?(INK_COMPILE_FAILURE_RE) }
    if compile_failures.positive?
      report.not_full!('ink', 'ink compile failure')
      puts "⏭️ #{compile_failures} ink file(s) failed to compile: the checks that read their compiled JSON were skipped."
      puts
    end
  end

  # Dialogue lint over the mission folder (advisory; needs node; off with --no-lint or --skip-ink)
  unless options[:skip_ink] || options[:no_lint]
    lint_report = report.run_check('ink', 'dialogue lint', fallback: nil) { run_dialogue_lint(scenario_dir, repo_root) }
    report.run_check('ink', 'dialogue lint', fallback: nil) { print_dialogue_lint(lint_report, repo_root) } if lint_report
  end

  # Check objective task completion wiring
  report.stage = 'common'
  puts "Checking objective task wiring..."
  wiring_issues = report.run_check('common', 'check_objectives_wiring') { check_objectives_wiring(json_data, repo_root) }
  scoring_mission = begin
    JSON.parse(File.read(File.join(scenario_dir, 'mission.json')))
  rescue StandardError
    nil # mission.json problems were already reported by the directory check
  end
  if scoring_mission
    wiring_issues += report.run_check('common', 'check_mission_scoring') { check_mission_scoring(scoring_mission, json_data) }
    wiring_issues += report.run_check('common', 'check_mission_result') { check_mission_result(scoring_mission, json_data) }
    wiring_issues += report.run_check('common', 'check_mission_ending_check') do
      check_mission_ending_check(scoring_mission, json_data, scenario_dir)
    end
  end
  print_issue_list(report, wiring_issues, error_header: 'Objective wiring check found',
                                          warning_header: 'Found %d objective wiring warning(s):', ok_line: '✓ Objective task wiring OK')
  puts if wiring_issues.any?

  # Check room layout geometry (world-space overlaps)
  puts "Checking room layout geometry..."
  geometry_issues = report.run_check('common', 'check_room_geometry') { check_room_geometry(json_data, repo_root) }
  puts "Checking door alignment..."
  door_issues = report.run_check('common', 'check_door_alignment') { check_door_alignment(erb_path, repo_root) }
  if geometry_issues.any? { |i| i.start_with?("⚠️") }
    report.header("⚠️ Found #{geometry_issues.count { |i| i.start_with?('⚠️') }} room overlap warning(s):")
    puts
    geometry_issues.each_with_index { |issue, index| puts "#{index + 1}. #{issue}"; puts }
  elsif geometry_issues.any?
    geometry_issues.each { |issue| puts issue }
    puts
  else
    puts "✓ Room layout geometry OK — no world-space overlaps"
    puts
  end
  if door_issues.any? { |i| i.include?("❌") }
    puts "✗ Door alignment check found #{door_issues.count { |i| i.include?('❌') }} error(s):"
    puts
    door_issues.each_with_index { |issue, index| puts "#{index + 1}. #{issue}"; puts }
  elsif door_issues.any?
    report.header("⚠️ Door alignment: #{door_issues.length} note(s):")
    puts
    door_issues.each_with_index { |issue, index| puts "#{index + 1}. #{issue}"; puts }
  else
    puts "✓ Door alignment OK"
    puts
  end

  # Validate against schema
  puts "Validating against schema..."
  raw_schema_errors = report.run_check('schema', 'schema validation') { validate_json(json_data, schema_path) }

  # Check for common issues and structural problems. Each check runs under its own rescue, so a
  # check that raises (on data that failed the schema, say) prints "could not run" and the checks
  # after it still run.
  puts "Checking for common issues..."
  common_issues = []
  run = ->(name, &blk) { common_issues.concat(report.run_check('common', name, &blk)) }
  run.call('check_common_issues') { check_common_issues(json_data, valid_item_types) }
  run.call('check_npc_walk') { check_npc_walk(json_data, repo_root) }
  run.call('check_npc_pop') { check_npc_pop(json_data) }
  run.call('check_references') { check_references(json_data, repo_root) }
  run.call('check_room_types') { check_room_types(json_data, repo_root) }
  run.call('check_lock_credentials') { check_lock_credentials(json_data) }
  run.call('check_pin_locks') { check_pin_locks(json_data) }
  run.call('check_combination_cryptex_locks') { check_combination_cryptex_locks(json_data) }
  run.call('check_dispenses_containers') { check_dispenses_containers(json_data) }
  run.call('check_unopenable_containers') { check_unopenable_containers(json_data) }
  run.call('check_npc_held_containers') { check_npc_held_containers(json_data) }
  run.call('check_npc_patrol_and_catch_locks') { check_npc_patrol_and_catch_locks(json_data, repo_root) }
  run.call('check_give_item_collectible') { check_give_item_collectible(json_data) }
  run.call('check_interaction_warnings') { check_interaction_warnings(json_data) }
  run.call('check_action_keys') { check_action_keys(json_data) }
  run.call('check_revoke_card_globals') { check_revoke_card_globals(json_data) }
  run.call('check_engine_limits') { check_engine_limits(json_data) }
  run.call('check_vm_flags_load_bearing') { check_vm_flags_load_bearing(json_data) }
  run.call('check_recurring_bugs') { check_recurring_bugs(json_data, repo_root) }
  run.call('check_retired_keys') { check_retired_keys(json_data) }
  run.call('check_owner_fields') { check_owner_fields(json_data) }
  run.call('check_wall_mounted') { check_wall_mounted(json_data) }
  run.call('check_unheard_room_triggers') { check_unheard_room_triggers(json_data, repo_root) }
  habits_copy = nil
  habits_report = nil
  run.call('NpcHabits.expanded_copy') do
    habits_copy, habits_report = BreakEscape::NpcHabits.expanded_copy(json_data)
    []
  end
  run.call('ValidateNpcNeeds') { ValidateNpcNeeds.check(json_data, screen_habits: npc_screen_habits(habits_copy)) }
  run.call('check_access_model') { check_access_model(json_data, repo_root, scenario_dir) }
  run.call('check_credentials') { check_credentials(json_data) }
  run.call('check_cracking') { check_cracking(json_data) }
  run.call('check_gated_door_credit') { check_gated_door_credit(json_data) }
  run.call('check_speaker_id_name_clashes') { check_speaker_id_name_clashes(json_data) }
  run.call('check_network_model') { check_network_model(json_data, scenario_dir) }
  run.call('check_capture_log') { check_capture_log(json_data) }
  run.call('check_log_rows') { check_log_rows(json_data) }
  run.call('check_network_ops') { check_network_ops(json_data) }
  run.call('check_privilege') { check_privilege(json_data) }
  run.call('check_mfa') { check_mfa(json_data) }
  run.call('check_lock_step') { check_lock_step(json_data) }
  run.call('check_helpdesk') { check_helpdesk(json_data, repo_root, scenario_dir) }
  run.call('check_realism_skin') { check_realism_skin(json_data) }
  run.call('check_secret_leaks') { check_secret_leaks(json_data, erb_path) }
  run.call('check_wearables') { check_wearables(json_data, scenario_dir) }
  run.call('check_plant_hiding') { check_plant_hiding(json_data, repo_root) }
  run.call('check_phone_calls') { check_phone_calls(json_data, repo_root) }
  run.call('ValidateAccessWork') { ValidateAccessWork.check(json_data) }
  run.call('ValidateOfficeLife') do
    ValidateOfficeLife.check(json_data, scenario_id: File.basename(scenario_dir), campaign: options[:campaign])
  end
  run.call('ValidateNpcHabits') do
    ValidateNpcHabits.check(json_data, expanded: habits_copy, report: habits_report, scenario_dir: scenario_dir)
  end
  run.call('check_tooling_pass4c') { check_tooling_pass4c(json_data, repo_root) }
  run.call('check_carry_over') do
    check_carry_over(json_data, repo_root, File.basename(scenario_dir), File.dirname(scenario_dir), carry_imports, own_globals)
  end

  # Social-engineering lints (scripts/validate_social.rb). Two lints (aim unlockCondition
  # keys, object id uniqueness) apply to every scenario; the rest need a `social` key.
  social_issues = report.run_check('social', 'ValidateSocial') do
    ValidateSocial.check(json_data, repo_root: repo_root, valid_item_types: valid_item_types,
                                    imports: carry_imports, raw: rendered_json)
  end
  # Schema errors under /social are listed with the social lints. Like every ❌ line they fail the run.
  # The schema report under its own rescue: if splitting or formatting raises, the raw messages
  # print as schema errors with a "could not run" line, and the rest of the report still prints.
  schema_marked = raw_schema_errors.select { |e| e.start_with?('❌') }
  schema_plain = raw_schema_errors.reject { |e| e.start_with?('❌') }
  begin
    social_schema, schema_errors = ValidateSocial.split_schema_errors(schema_plain)
    schema_errors = format_schema_errors(json_data, schema_errors, JSON.parse(File.read(schema_path))) + schema_marked
  rescue StandardError, ScriptError => e
    report.not_full!('schema', 'schema report raised')
    social_schema = []
    schema_errors = schema_plain.map { |m| "❌ ERROR: schema: #{m}" } + schema_marked +
                    ["❌ ERROR: schema report could not run: #{e.class}: #{e.message.to_s.lines.first.to_s.strip}"]
  end
  social_issues = social_schema + social_issues

  # Check for recommended fields
  puts "Checking recommended fields..."
  warnings = report.run_check('common', 'check_recommended_fields') { check_recommended_fields(json_data) }

  # Report schema errors
  report.stage = 'schema'
  if schema_errors.empty?
    puts "✓ Schema validation passed!"
  else
    puts "✗ Schema validation failed with #{schema_errors.length} error(s):"
    puts
    schema_errors.each_with_index { |error, index| puts "#{index + 1}. #{error}"; puts }
    if options[:verbose]
      puts "Full JSON structure:"
      report.raw(JSON.pretty_generate(json_data))
    end
  end

  # Report common issues, then the social lints (their own stage, one numbered list)
  all_issues = common_issues.map { |i| ['common', i] } + social_issues.map { |i| ['social', i] }
  if all_issues.empty?
    puts "✓ No common issues found."
    puts
  else
    report.header("⚠️ Found #{all_issues.length} issue(s) and suggestion(s):")
    puts
    all_issues.each_with_index do |(stage, issue), index|
      report.stage = stage
      puts "#{index + 1}. #{issue}"
    end
    report.stage = 'common'
    puts
  end

  # The habits report (slice 9.1, 7.2): who never locks and whose password is on a note
  report.stage = 'habits'
  habits_lines = report.run_check('habits', 'habits report') do
    ValidateNpcHabits.report_lines(json_data, expanded: habits_copy, report: habits_report, scenario_dir: scenario_dir)
  end
  unless habits_lines.empty?
    habits_lines.each { |line| puts line }
    puts
  end

  # The work report (access slice 9.2, section 10): work lists and workaround timing
  report.stage = 'work'
  work_lines = report.run_check('work', 'work report') { ValidateAccessWork.report_lines(json_data) }
  unless work_lines.empty?
    work_lines.each { |line| puts line }
    puts
  end

  # The office-life sync budget (V8) and, with --office-summary, the per-NPC summary (V1)
  report.stage = 'work'
  budget_lines = report.run_check('work', 'office-life sync budget') { ValidateOfficeLife.sync_budget_lines(json_data) }
  unless budget_lines.empty?
    budget_lines.each { |line| puts line }
    puts
  end
  if options[:office_summary]
    summary = report.run_check('work', 'office-life summary') { ValidateOfficeLife.office_summary(json_data) }
    puts "OFFICE-LIFE SUMMARY (V1): #{summary.length} NPC(s)"
    summary.each { |line| puts "  #{line}" }
    puts
  end

  # Report warnings
  report.stage = 'common'
  if warnings.empty?
    puts "✓ No missing recommended fields."
    puts
  else
    report.header("⚠️ Found #{warnings.length} missing recommended field(s):")
    puts
    warnings.each_with_index { |warning, index| puts "#{index + 1}. #{warning}" }
    puts
  end

  # Generate dungeon graph (runs by default, suppress with --no-graph)
  unless options[:no_graph]
    graph_script = File.join(__dir__, 'generate_dungeon_graph.rb')
    if File.exist?(graph_script)
      puts "Generating dungeon graph..."
      # The generator's test switch (it turns the Wi-Fi key scrub off) never reaches a real run.
      result = system({ 'DUNGEON_GRAPH_TEST_NO_SCRUB' => nil }, 'ruby', graph_script, erb_path)
      graph_out = File.join(scenario_dir, 'dungeon_graph.html')
      if result
        # The path the author typed, as the "Validating scenario:" line prints it.
        puts "✓ Dungeon graph: #{graph_out}"
      elsif $?.exitstatus == 3
        # The generator's key check stopped the run (KEY_STOP_STATUS) and deleted the old graph files.
        puts "❌ ERROR: Dungeon graph stopped: an output still held a Wi-Fi key (see the message above); " \
             'the old dungeon_graph files were deleted.'
      else
        # Any other failure (an abort, a crash) printed its reason on stderr; it fails the run too.
        puts "❌ ERROR: dungeon graph could not run (exit #{$?.exitstatus.inspect}); see the message above."
      end
      puts
    end
  end

  # --strict-social no longer changes the exit code (every ❌ line fails the run); it still names
  # the count, as older callers read it.
  if options[:strict_social] && json_data.is_a?(Hash) && json_data.key?('social')
    report.stage = 'social'
    report.run_check('social', 'strict-social count', fallback: nil) do
      social_errors = ValidateSocial.errors(social_issues).length
      report.header("✗ --strict-social: #{social_errors} social lint error(s)") if social_errors.positive?
    end
    report.stage = 'common'
  end

  # Info: desk collision boxes per map (footprint maps opt in with a Tiled map property)
  desk_maps = report.run_check('common', 'desk_box_maps', fallback: { legacy: [], footprint: [] }) do
    desk_box_maps(json_data, repo_root)
  end
  if desk_maps[:legacy].any? || desk_maps[:footprint].any?
    puts "ℹ Desk boxes: legacy in #{desk_maps[:legacy].length} map(s)" \
         "#{desk_maps[:legacy].any? ? " (#{desk_maps[:legacy].join(', ')})" : ''}; " \
         "footprint in #{desk_maps[:footprint].length}" \
         "#{desk_maps[:footprint].any? ? " (#{desk_maps[:footprint].join(', ')})" : ''}"
    puts
  end

  puts "✓ Validation complete!"
end

main if __FILE__ == $PROGRAM_NAME
