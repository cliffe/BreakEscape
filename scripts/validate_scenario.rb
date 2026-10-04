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
require 'pathname'
require 'set'
require 'base64'
require 'open3'

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

# ScenarioBinding class - replicates the one from app/models/break_escape/mission.rb
class ScenarioBinding
  def initialize(vm_context = {})
    require 'securerandom'
    @random_password = SecureRandom.alphanumeric(8)
    @random_pin = rand(1000..9999).to_s
    @random_code = SecureRandom.hex(4)
    @vm_context = vm_context || {}
  end

  attr_reader :random_password, :random_pin, :random_code, :vm_context

  # Get a VM from the context by title, or return a fallback VM object
  def vm_object(title, fallback = {})
    if vm_context && vm_context['hacktivity_mode'] && vm_context['vms']
      vm = vm_context['vms'].find { |v| v['title'] == title }
      return vm.to_json if vm
    end

    result = fallback.dup
    if vm_context && vm_context['vm_ips'] && vm_context['vm_ips'][title]
      result['ip'] = vm_context['vm_ips'][title]
    end
    result.to_json
  end

  # Get flags for a specific VM from the context
  def flags_for_vm(vm_name, fallback = [])
    if vm_context && vm_context['flags_by_vm']
      flags = vm_context['flags_by_vm'][vm_name]
      return flags.to_json if flags
    end
    fallback.to_json
  end

  # Get VM flags as a JSON array for use in the top-level 'flags' object.
  # Mirrors flags_for_vm but used in the top-level flags: { vm_name: vm_flags_json('vm_name') } pattern.
  def vm_flags_json(vm_name, fallback = [])
    flags_for_vm(vm_name, fallback)
  end

  def get_binding
    binding
  end
end

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

# Render ERB template to JSON
def render_erb_to_json(erb_path, vm_context = {}, include_rendered: false)
  unless File.exist?(erb_path)
    raise "ERB file not found: #{erb_path}"
  end

  erb_content = File.read(erb_path)
  erb = ERB.new(erb_content)
  binding_context = ScenarioBinding.new(vm_context)
  json_output = erb.result(binding_context.get_binding)

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
    issues << "❌ INVALID: Top-level field 'show_scenario_brief' is defined #{key_count} times. Keep exactly one declaration. Use 'show_scenario_brief': 'on_resume' when using an opening timedConversation briefing so both UIs do not appear at mission start."
  end

  issues
end

# Validate JSON against schema
def validate_json(json_data, schema_path)
  unless File.exist?(schema_path)
    raise "Schema file not found: #{schema_path}"
  end

  schema = JSON.parse(File.read(schema_path))
  errors = JSON::Validator.fully_validate(schema, json_data, strict: false)

  errors
rescue JSON::ParserError => e
  raise "Invalid JSON schema: #{e.message}"
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
    issues << "❌ INVALID: Scenario directory '#{scenario_name}/' is missing required 'mission.json' file. Structure should be: scenarios/#{scenario_name}/mission.json"
  end

  # Validate mission.json structure if it exists
  if File.exist?(mission_json_path)
    begin
      mission = JSON.parse(File.read(mission_json_path))

      # Check required fields
      required_fields = %w[display_name description difficulty_level]
      missing_fields = required_fields.filter { |field| !mission.key?(field) || mission[field].to_s.strip.empty? }

      if missing_fields.any?
        issues << "❌ INVALID: mission.json is missing required fields: #{missing_fields.join(', ')}"
      end
    rescue JSON::ParserError => e
      issues << "❌ INVALID: mission.json contains invalid JSON: #{e.message}"
    rescue StandardError => e
      issues << "❌ INVALID: Error reading mission.json: #{e.message}"
    end
  end

  issues
end

# Check for unknown fields in JSON that aren't in the schema
def check_unknown_fields(json_data)
  warnings = []

  # Known top-level fields
  known_top_level = %w[
    scenario_id scenario_name scenario_brief endGoal version startRoom startPosition
    show_scenario_brief disableAttacks gameClock flags music startItemsInInventory globalVariables
    player objectives rooms npcs phoneNPCs narrator timers _comment mutuallyExclusiveGlobals
  ]

  # Check top-level unknown fields
  json_data.each_key do |key|
    unless known_top_level.include?(key)
      warnings << "⚠️ WARNING: Top-level field '#{key}' is not recognized in the schema — this field will be ignored by the game engine. Remove it if not needed, or check if the spelling is correct."
    end
  end

  # Known room fields
  known_room_fields = %w[
    type door_sign connections locked lockType requires keyPins difficulty
    ambientSound ambientVolume objects npcs _comment dimensions biometricMatchThreshold
  ]

  # Known NPC fields
  known_npc_fields = %w[
    id displayName npcType position spriteSheet spriteTalk spriteVisemes spriteConfig
    voice behavior globalVarOnKO restartOnRetalk taskOnKO storyPath currentKnot avatar
    phoneId phoneTheme unlockable externalVariables persistentVariables
    timedMessages timedConversation eventMappings itemsHeld puzzle_graph_actions
    observations disableClose los rfidCard _comment
  ]

  # Known NPC behavior fields
  known_behavior_fields = %w[
    initiallyHidden immovable hostile facePlayer patrol staticSprite collisionBox _comment
  ]

  # Known eventMapping fields
  known_event_mapping_fields = %w[
    eventPattern condition onceOnly maxTriggers cooldown fireOnlyWhenLoaded
    bark message barkDelay
    targetKnot conversationMode background disableClose
    patrolOverride setPatrolSpeed setDwellMultiplier setVisible
    sendTimedMessage setGlobal completeTask skipTask unlockTask unlockAim
    _comment
  ]

  # Load minigameData schemas (flat map; entries with _dispatch:"lockType" are matched by lockType)
  minigame_schemas_path = File.join(__dir__, 'minigame-data-schemas.json')
  minigame_schemas = if File.exist?(minigame_schemas_path)
    JSON.parse(File.read(minigame_schemas_path)).reject { |k, _| k.start_with?('_') }
  else
    {}
  end

  check_minigame_data = lambda do |obj, path|
    md = obj['minigameData']
    return unless md.is_a?(Hash)

    schema      = minigame_schemas[obj['type']] || minigame_schemas[obj['lockType']] || minigame_schemas[obj['id']]
    schema_key  = [obj['type'], obj['lockType'], obj['id']].find { |k| k && minigame_schemas[k] }
    unless schema
      dispatch_key = obj['type'] || obj['lockType'] || obj['id']
      warnings << "⚠️ WARNING: '#{path}' has minigameData but no schema is defined for '#{dispatch_key}' — add an entry to minigame-data-schemas.json."
      return
    end

    required = schema['required'] || []
    optional = schema['optional'] || []
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

  # Known item (object) fields — any unknown field should be inside minigameData
  known_item_fields = %w[
    type id name takeable readable interactable active locked important
    position observations observationVariants observationDisplay readDisplay addToNotes
    text textVariants
    voice ttsVoice sender timestamp avatar sprite
    collection_group onRead onPickup onInteract
    lockType requires opens_lock key_id keyPins card_id difficulty
    passwordHint showHint showKeyboard maxAttempts
    postitNote showPostit
    hasFingerprint fingerprintOwner fingerprintDifficulty fingerprintQuality
    fingerprintOwnerName fingerprintPattern fingerprintSurface fingerprintCandidates biometricMatchThreshold
    mac canScanBluetooth phoneId npcIds
    hacktivityMode vm acceptsVms flags flagRewards
    mode onAbort onLaunch abortConfirmText launchConfirmText
    itemsHeld contents triggerOnInteract
    minigameData
    gateVar sealedMessage openableReadyMessage
    puzzle_graph_role puzzle_graph_aim puzzle_graph_unlocks
    puzzle_graph_and_with puzzle_graph_reveals puzzle_graph_optional puzzle_graph_note
    storyPath currentKnot
    completesTask completesTaskOnOpen
    puzzle_graph_links
    _comment
  ]

  check_item_fields = lambda do |item, path|
    next unless item.is_a?(Hash)
    warnings << "⚠️ WARNING: '#{path}' sets fingerprintQuality, which is ignored: lift quality now comes from the dusting minigame." if item.key?('fingerprintQuality')
    item.each_key do |key|
      unless known_item_fields.include?(key)
        warnings << "⚠️ WARNING: '#{path}' has unknown field '#{key}' — if this is minigame-specific configuration data, nest it under 'minigameData' instead."
      end
    end
    item['contents']&.each_with_index { |c, i| check_item_fields.call(c, "#{path}/contents[#{i}](#{c['id'] || c['type'] || '?'})") }
    item['itemsHeld']&.each_with_index { |c, i| check_item_fields.call(c, "#{path}/itemsHeld[#{i}](#{c['type'] || '?'})") }
  end

  # Check startItemsInInventory fields
  json_data['startItemsInInventory']&.each_with_index do |item, idx|
    next unless item.is_a?(Hash)
    inv_path = "startItemsInInventory[#{idx}](#{item['id'] || item['type'] || '?'})"
    check_item_fields.call(item, inv_path)
    check_minigame_data.call(item, inv_path)
  end

  # Check room fields and recurse into NPCs and objects
  if json_data['rooms']
    json_data['rooms'].each do |room_id, room|
      next unless room.is_a?(Hash)
      room.each_key do |key|
        unless known_room_fields.include?(key)
          warnings << "⚠️ WARNING: Room '#{room_id}' has unknown field '#{key}' — this field will be ignored by the game engine."
        end
      end

      # Check object fields
      room['objects']&.each_with_index do |obj, idx|
        next unless obj.is_a?(Hash)
        obj_path = "rooms/#{room_id}/objects[#{idx}](#{obj['id'] || obj['name'] || '?'})"
        check_item_fields.call(obj, obj_path)
        check_minigame_data.call(obj, obj_path)
      end

      # Check NPC fields
      room['npcs']&.each_with_index do |npc, idx|
        next unless npc.is_a?(Hash)
        npc_path = "rooms/#{room_id}/npcs[#{idx}](#{npc['id'] || '?'})"
        npc.each_key do |key|
          unless known_npc_fields.include?(key)
            warnings << "⚠️ WARNING: '#{npc_path}' has unknown field '#{key}' — this field will be ignored by the game engine."
          end
        end

        # Check NPC behavior fields
        if npc['behavior'].is_a?(Hash)
          npc['behavior'].each_key do |key|
            unless known_behavior_fields.include?(key)
              warnings << "⚠️ WARNING: '#{npc_path}/behavior' has unknown field '#{key}' — this field will be ignored by the game engine."
            end
          end
        end

        # Check eventMapping fields
        npc['eventMappings']&.each_with_index do |mapping, midx|
          next unless mapping.is_a?(Hash)
          mapping_path = "#{npc_path}/eventMappings[#{midx}]"
          mapping.each_key do |key|
            unless known_event_mapping_fields.include?(key)
              warnings << "⚠️ WARNING: '#{mapping_path}' has unknown field '#{key}' — this field will be ignored by the game engine."
            end
          end
        end
      end
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
      issues << "❌ INVALID: 'rooms' must be a JSON object {}, not an array []. Structure should be: \"rooms\": { \"room_id\": { ... }, \"another_room\": { ... } }"
    elsif !json_data['rooms'].is_a?(Hash)
      issues << "❌ INVALID: 'rooms' must be a JSON object {} (hash), got #{json_data['rooms'].class}"
    end
  end

  # Validate startItemsInInventory structure
  if json_data.key?('startItemsInInventory')
    if json_data['startItemsInInventory'].is_a?(Hash)
      issues << "❌ INVALID: 'startItemsInInventory' must be a JSON array [], not an object {}. Structure should be: \"startItemsInInventory\": [ { \"type\": \"phone\", \"name\": \"...\" }, ... ]"
    elsif !json_data['startItemsInInventory'].is_a?(Array)
      issues << "❌ INVALID: 'startItemsInInventory' must be a JSON array [], got #{json_data['startItemsInInventory'].class}"
    end
  end

  # Validate NPCs structure if present
  if json_data.key?('npcs')
    if !json_data['npcs'].is_a?(Array)
      issues << "❌ INVALID: 'npcs' must be a JSON array [], got #{json_data['npcs'].class}"
    end
  end

  # Validate objectives structure if present
  if json_data.key?('objectives')
    if !json_data['objectives'].is_a?(Array)
      issues << "❌ INVALID: 'objectives' must be a JSON array [], got #{json_data['objectives'].class}"
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
      issues << "❌ INVALID: '#{source_ink_path}' line #{ln}: '#{stripped[0, 60]}' is a standalone emote starting " \
                "with '*', which ink parses as a CHOICE. Attach it to a spoken line " \
                "(\"Marcus Webb: *sighs* ...\") or make it a 'Narrator:' beat."
    end

    # 2. '//' inside dialogue is an ink comment — everything after it is dropped.
    if !is_meta && stripped.include?('//')
      issues << "❌ INVALID: '#{source_ink_path}' line #{ln}: contains '//', which ink treats as a comment. " \
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
      issues << "❌ INVALID: '#{source_ink_path}' line #{ln}: unbalanced '[' / ']' in a choice."
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
      issues << "❌ INVALID: '#{source_ink_path}': speaker prefix '#{speaker}:' is used #{lines.size} times but " \
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

def check_ink_files(json_data, base_dir, scenario_dir = nil)
  issues = []
  ink_files_to_check = Set.new
  narrator_used_files = []  # ink files that use a #speaker:narrator / Narrator: line

  # Every id / displayName the engine's character registry will know about.
  valid_speakers = Set.new
  json_data['rooms']&.each_value do |room|
    room['npcs']&.each do |npc|
      valid_speakers << npc['id'].to_s.downcase if npc['id']
      valid_speakers << npc['displayName'].to_s.downcase if npc['displayName']
    end
  end
  if json_data['player']
    valid_speakers << json_data['player']['id'].to_s.downcase if json_data['player']['id']
    valid_speakers << json_data['player']['displayName'].to_s.downcase if json_data['player']['displayName']
  end

  # Collect all referenced ink files from NPCs
  json_data['rooms']&.each do |room_id, room|
    room['npcs']&.each_with_index do |npc, idx|
      if npc['storyPath']
        path = "rooms/#{room_id}/npcs[#{idx}]"
        items_held = npc['itemsHeld'] || []
        items_held_types = (npc['itemsHeld'] || []).map { |item| item['type'] }.compact
        ink_files_to_check.add({ path: path, storyPath: npc['storyPath'], items_held_types: items_held_types, items_held: items_held })
      end
    end
  end

  # Check each ink file
  ink_files_to_check.each do |entry|
    story_path = entry[:storyPath]
    npc_path = entry[:path]

    # Enforce that storyPath uses the full scenarios/ relative path format
    if story_path.start_with?('ink/')
      issues << "❌ INVALID: '#{npc_path}' uses deprecated relative path '#{story_path}'. Must use full path format: \"scenarios/SCENARIO_NAME/ink/FILENAME.ink.json\" (e.g., \"scenarios/test_npc_visibility/ink/test_dispatcher.ink.json\")"
      next
    end

    unless story_path.start_with?('scenarios/')
      issues << "❌ INVALID: '#{npc_path}' storyPath '#{story_path}' must start with 'scenarios/' (e.g., \"scenarios/SCENARIO_NAME/ink/FILENAME.ink.json\"). Absolute paths and other relative paths are not supported."
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
      begin
        output = `"#{inklecate_bin}" -o "#{full_json_path}" "#{full_ink_path}" 2>&1`
        status = $?.exitstatus

        if status != 0 || output.include?('ERROR') || output.include?('error')
          issues << "❌ INVALID: '#{npc_path}' references ink file '#{source_ink_path}' which fails to compile:\n#{output.strip}"
        elsif !File.exist?(full_json_path)
          issues << "❌ INVALID: '#{npc_path}' references ink file '#{source_ink_path}' — compiled but output file was not created"
        else
          # Verify the output is valid JSON
          begin
            JSON.parse(File.read(full_json_path))
          rescue JSON::ParserError => e
            issues << "❌ INVALID: '#{npc_path}' compiled ink file produced invalid JSON: #{e.message}"
          end
        end
      rescue => e
        issues << "❌ INVALID: '#{npc_path}' references ink file '#{source_ink_path}' but compilation failed: #{e.message}"
      end

      # Check for #give_item tags placed after a dialogue/text line.
      # In Break Escape, the tag must appear BEFORE the dialogue line so that the item transfer
      # fires on the same story.Continue() call as the text that describes it. A tag on the
      # line immediately after dialogue is attached to that preceding text in Ink semantics,
      # which in some engine paths causes the tag to fire on a later Continue() with no NPC
      # context, silently dropping the item give.
      begin
        ink_lines = File.readlines(full_ink_path)
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

          item_type = stripped.sub(/^#give_item:/, '').strip
          issues << "⚠️ WARNING: '#{source_ink_path}' line #{i + 1}: '#give_item:#{item_type}' appears after " \
                    "a text/dialogue line. Move '#give_item:#{item_type}' to the line immediately BEFORE " \
                    "the dialogue so the item transfer fires on the same story.Continue() call. " \
                    "Wrong: dialogue → tag. Correct: tag → dialogue."
        end

        # Cross-reference: every #give_item:type used in this file must match an item
        # in the NPC's itemsHeld array. If not, the give will silently fail at runtime.
        items_held_types = entry[:items_held_types] || []
        items_held = entry[:items_held] || []
        ink_lines.each_with_index do |line, i|
          stripped = line.strip
          next unless stripped.start_with?('#give_item:')

          item_spec = stripped.sub(/^#give_item:/, '').strip
          item_type, item_selector = item_spec.split(/[|:]/, 2).map(&:strip)

          if item_selector.nil? || item_selector.empty?
            unless items_held_types.include?(item_type)
              issues << "❌ INVALID: '#{source_ink_path}' line #{i + 1}: '#give_item:#{item_spec}' but " \
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
              issues << "❌ INVALID: '#{source_ink_path}' line #{i + 1}: '#give_item:#{item_spec}' but " \
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
      rescue => e
        # Non-fatal — file was already compiled successfully above
      end
    elsif File.exist?(full_json_path)
      # No source .ink — validate the existing compiled JSON
      begin
        json_content = File.read(full_json_path)
        JSON.parse(json_content)
      rescue JSON::ParserError => e
        issues << "❌ INVALID: '#{npc_path}' references compiled ink file '#{story_path}' but the file contains invalid JSON: #{e.message}"
      rescue => e
        issues << "❌ INVALID: '#{npc_path}' references compiled ink file '#{story_path}' but failed to read it: #{e.message}"
      end
    else
      issues << "❌ INVALID: '#{npc_path}' references ink file '#{story_path}' which does not exist (checked for both .json and .ink versions)"
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
#    rfid, bluetooth, key) all call unlockTarget() which emits the event.  Custom minigame
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
  standard_unlock_types  = %w[password pin rfid bluetooth key].freeze
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
          issues << "❌ INVALID: #{task_path} is type 'npc_conversation' targeting NPC '#{target_npc}', " \
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
          issues << "❌ INVALID: #{task_path} is type 'npc_conversation' targeting NPC '#{target_npc}', " \
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
            issues << "❌ INVALID: #{task_path} (collect_items) targets item '#{item_label}' " \
                      "(type: #{item['type']}), but the item is missing 'readable: true'. " \
                      "interactions.js only enters the notes branch — which emits 'item_picked_up' " \
                      "and drives task progress — when both 'readable: true' and a non-empty 'text' " \
                      "field are present. Without 'readable: true' the item is silently collected " \
                      "server-side but the task counter never increments. Add 'readable: true' to the item."
          end

          if item['text'].to_s.strip.empty?
            issues << "❌ INVALID: #{task_path} (collect_items) targets item '#{item_label}' " \
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
  # Skipped when the scenario sets "disableAttacks": true.
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

    json_data['rooms']&.each do |_room_id, room|
      room['npcs']&.each do |npc|
        scan_event_mappings.call(npc['eventMappings'])
        taskonko_tasks << npc['taskOnKO'] if npc['taskOnKO']
      end
      room['objects']&.each { |obj| scan_event_mappings.call(obj['eventMappings']) }
    end
    json_data['startItemsInInventory']&.each { |item| scan_event_mappings.call(item['eventMappings']) }

    # Phone NPCs whose eventMapping fires on 'npc_ko:<id>' open a phone conversation after that
    # NPC is knocked out. A '#complete_task:' tag in such a phone NPC's ink is a KO fallback for
    # the knocked-out NPC (m06 Satoshi, m05 Patricia), so remember the ink per KO'd NPC id.
    ko_phone_ink = Hash.new { |h, k| h[k] = [] }
    json_data['rooms']&.each do |_room_id, room|
      room['npcs']&.each do |npc|
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
  # RFID/keycard/fob credential. A physical key is matched by 'opens_lock'
  # (falling back to 'key_id' -- ItemIdentity.lock_ref). An RFID/keycard is
  # matched by 'card_id' first, falling back to 'opens_lock'/'key_id'
  # (unlock-system.js getCardId) -- so card_id is the credential that
  # actually satisfies the door when both are present.
  key_items = []
  credential_item_types = { 'key' => 'key', 'keycard' => 'rfid', 'rfid' => 'rfid', 'fob' => 'rfid' }
  walk_items = lambda do |node|
    case node
    when Array then node.each { |n| walk_items.call(n) }
    when Hash
      if node.key?('key_id')
        issues << "❌ INVALID: item '#{node['name'] || node['key_id']}' uses 'key_id', which was renamed to " \
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

  # A credential item that opens nothing.
  key_items.each do |name, credential, lock_kind|
    next if credential_requires[lock_kind].include?(credential)
    issues << "⚠️ WARNING: key '#{name}' has credential '#{credential}', but no #{lock_kind} lock 'requires' it. " \
              "Either the lock is missing, the value is a typo, or this is really an identity and belongs in " \
              "'id'. A deliberate decoy key is the one legitimate case -- say so in a comment."
  end

  # A key/RFID lock with no matching credential item. This is a soft-lock
  # unless the door is meant to be opened another way (e.g. lockpicked).
  declared = { 'key' => Set.new, 'rfid' => Set.new }
  key_items.each { |_name, credential, lt| declared[lt] << credential }
  %w[key rfid].each do |lock_kind|
    credential_requires[lock_kind].each do |req|
      next if declared[lock_kind].include?(req)
      field = lock_kind == 'rfid' ? "card_id (or opens_lock)" : 'opens_lock'
      issues << "⚠️ WARNING: a lock requires #{lock_kind} '#{req}', but no item declares #{field} '#{req}'. " \
                "Unless that door is meant to be lockpicked only, nothing in the scenario can open it."
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
        issues << "❌ INVALID: '#{fx_path}' is an unknown voice FX preset '#{fx}'. Use one of: #{known_fx_presets.join(', ')}, or a custom object { highpass, lowpass, drive, ringMod: { frequency, mix }, makeup }."
      end
    elsif fx.is_a?(Hash)
      allowed_fx_keys = ['highpass', 'lowpass', 'drive', 'ringMod', 'makeup']
      unknown_keys = fx.keys - allowed_fx_keys
      unless unknown_keys.empty?
        issues << "⚠️ WARNING: '#{fx_path}' has unrecognised FX key(s): #{unknown_keys.join(', ')}. Recognised keys: #{allowed_fx_keys.join(', ')}."
      end
      ['highpass', 'lowpass', 'drive', 'makeup'].each do |k|
        if fx.key?(k) && !fx[k].is_a?(Numeric)
          issues << "❌ INVALID: '#{fx_path}/#{k}' must be a number."
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
          issues << "❌ INVALID: '#{fx_path}/ringMod' must be an object { frequency, mix }."
        else
          if rm.key?('frequency')
            if !rm['frequency'].is_a?(Numeric)
              issues << "❌ INVALID: '#{fx_path}/ringMod/frequency' must be a number (Hz)."
            elsif rm['frequency'] <= 0 || rm['frequency'] > 20000
              issues << "⚠️ WARNING: '#{fx_path}/ringMod/frequency' = #{rm['frequency']}Hz is outside the sensible audio range (1–20000Hz)."
            end
          end
          if rm.key?('mix')
            if !rm['mix'].is_a?(Numeric)
              issues << "❌ INVALID: '#{fx_path}/ringMod/mix' must be a number between 0 and 1."
            elsif rm['mix'] < 0 || rm['mix'] > 1
              issues << "❌ INVALID: '#{fx_path}/ringMod/mix' must be between 0 and 1 (got #{rm['mix']})."
            end
          end
        end
      end
    else
      issues << "❌ INVALID: '#{fx_path}' must be a preset name (string) or a config object { highpass, lowpass, drive, ringMod, makeup }."
    end
  end

  # Player voice may also carry fx
  if json_data['player'].is_a?(Hash) && json_data['player']['voice'].is_a?(Hash) && json_data['player']['voice'].key?('fx')
    check_voice_fx.call(json_data['player']['voice']['fx'], 'player/voice/fx')
  end

  # Recursive helper: check item type and all nested contents/itemsHeld
  # A type is valid if an exact asset file exists, OR if any numbered/variant file starting with
  # that type name exists (e.g. type "safe" is valid when safe1.png, safe2.png etc. exist).
  check_item_type = lambda do |item, item_path|
    if valid_item_types && item['type']
      t = item['type']
      exact_match = valid_item_types.include?(t)
      variant_match = !exact_match && valid_item_types.any? { |v| v.start_with?(t) }
      unless exact_match || variant_match
        issues << "❌ INVALID: '#{item_path}' has type '#{t}' but no matching sprite found at assets/objects/#{t}.png (nor any #{t}*.png variant) — check the spelling or add the asset"
      end
    end
    item['contents']&.each_with_index { |c, i| check_item_type.call(c, "#{item_path}/contents[#{i}]") }
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
      issues << "⚠️ WARNING: #{aim_path} has missionConclusion:true but no conclusionScreen — the player will see no end-of-mission overlay."
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
          issues << "❌ INVALID: '#{path}' uses deprecated x/y format. Must use position object: \"position\": { \"x\": #{obj['x']}, \"y\": #{obj['y']} } (optional: add \"elevation\": <value> for z-ordering)"
        end
      end

      # Check for invalid room connection directions (diagonal directions)
      if room['connections']
        room['connections'].each do |direction, target|
          unless valid_directions.include?(direction)
            issues << "❌ INVALID: Room '#{room_id}' uses invalid direction '#{direction}' - only north, south, east, west are valid (not northeast, southeast, etc.)"
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
            issues << "❌ INVALID: '#{path}' uses type: 'pc' with vmAccess - should use type: 'vm-launcher' instead. See scenarios/secgen_vm_lab/scenario.json.erb for example"
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
              issues << "❌ INVALID: '#{path}' is a container with contents but missing required 'locked' field - must be explicitly true or false for server-side validation"
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
                issues << "❌ INVALID: '#{path}' has lockType: 'key' but missing required 'keyPins' array - key locks must specify keyPins array for lockpicking minigame"
              end
            end
          end

          # Check for key items without keyPins (REQUIRED, not recommended)
          if obj['type'] == 'key' && !obj['keyPins']
            issues << "❌ INVALID: '#{path}' (key item) missing required 'keyPins' array - key items must specify keyPins array for lockpicking"
          end

          # Cross-reference onRead.setVariable against globalVariables
          if obj['onRead']&.dig('setVariable')
            obj['onRead']['setVariable'].each_key do |var_name|
              unless global_variables_defined.include?(var_name)
                issues << "❌ INVALID: '#{path}/onRead/setVariable' references variable '#{var_name}' not defined in scenario.globalVariables. Add '#{var_name}': false to globalVariables."
              end
            end
          end

          # Cross-reference onPickup.setVariable against globalVariables
          if obj['onPickup']&.dig('setVariable')
            obj['onPickup']['setVariable'].each_key do |var_name|
              unless global_variables_defined.include?(var_name)
                issues << "❌ INVALID: '#{path}/onPickup/setVariable' references variable '#{var_name}' not defined in scenario.globalVariables. Add '#{var_name}': false to globalVariables."
              end
            end
          end

          # Cross-reference onInteract.setVariable against globalVariables
          if obj['onInteract']&.dig('setVariable')
            obj['onInteract']['setVariable'].each_key do |var_name|
              unless global_variables_defined.include?(var_name)
                issues << "❌ INVALID: '#{path}/onInteract/setVariable' references variable '#{var_name}' not defined in scenario.globalVariables. Add '#{var_name}': false to globalVariables."
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
              issues << "❌ INVALID: '#{path}/onInteract/display' has unknown value '#{mode}'. Valid values: #{valid_display_modes.join(', ')}."
            end
          end

          # Held items are matched by '#give_item:<type>[:<selector>]': the type
          # picks the class, the optional selector picks which one when an NPC
          # holds several of that type. 'id' IS the selector (it also becomes
          # data.itemId on item_picked_up), so it is required here, not banned.
          if obj['itemsHeld']
            obj['itemsHeld'].each_with_index do |item, item_idx|
              unless item['type']
                issues << "❌ INVALID: '#{path}/itemsHeld[#{item_idx}]' has no 'type' field - #give_item matches on type."
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
            issues << "❌ INVALID: 'rooms/#{room_id}' has lockType: 'key' but missing required 'keyPins' array - key locks must specify keyPins array for lockpicking minigame"
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

          # Track and cross-reference globalVarOnKO
          if npc['globalVarOnKO']
            has_global_var_on_ko = true
            var_name = npc['globalVarOnKO']
            unless global_variables_defined.include?(var_name)
              issues << "❌ INVALID: '#{path}' globalVarOnKO references '#{var_name}' which is not defined in scenario.globalVariables. Add '#{var_name}': false to globalVariables."
            end
          end

          # Track and cross-reference taskOnKO
          if npc['taskOnKO']
            task_id = npc['taskOnKO']
            unless all_task_ids.include?(task_id)
              issues << "❌ INVALID: '#{path}' taskOnKO references task '#{task_id}' which does not exist in any objective's tasks. Ensure the taskId is correct."
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
              issues << "❌ INVALID: '#{path}' timedConversation uses 'knot' property - should use 'targetKnot' instead. Change 'knot' to 'targetKnot'"
            end
            # Check for missing targetKnot
            unless tc['targetKnot']
              issues << "❌ INVALID: '#{path}' timedConversation missing required 'targetKnot' property - must specify the Ink knot to navigate to"
            end
            # Check for missing delay
            unless tc.key?('delay')
              issues << "⚠️ WARNING: '#{path}' timedConversation missing 'delay' property - should specify delay in milliseconds (0 for immediate)"
            end
          end

          # Validate eventMapping vs eventMappings (parameter name mismatch)
          if npc['eventMapping'] && !npc['eventMappings']
            issues << "❌ INVALID: '#{path}' uses 'eventMapping' (singular) - should use 'eventMappings' (plural). The NPCManager expects 'eventMappings' and won't register event listeners with 'eventMapping'"
          end

          # Validate eventMappings structure
          if npc['eventMappings']
            # Check if it's an array
            unless npc['eventMappings'].is_a?(Array)
              issues << "❌ INVALID: '#{path}' eventMappings is not an array - must be an array of event mapping objects"
            else
              npc['eventMappings'].each_with_index do |mapping, idx|
                mapping_path = "#{path}/eventMappings[#{idx}]"

                # Check for incorrect property name (knot vs targetKnot)
                if mapping['knot'] && !mapping['targetKnot']
                  issues << "❌ INVALID: '#{mapping_path}' uses 'knot' property - should use 'targetKnot' instead. Change 'knot' to 'targetKnot'"
                end

                # Check for missing eventPattern
                unless mapping['eventPattern']
                  issues << "❌ INVALID: '#{mapping_path}' missing required 'eventPattern' property - must specify the event pattern to listen for (e.g., 'global_variable_changed:varName')"
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
                    issues << "❌ INVALID: '#{mapping_path}/patrolOverride' must have targetTile: {x: number, y: number}"
                  end
                  if po['speed'] && (!po['speed'].is_a?(Numeric) || po['speed'] <= 0)
                    issues << "❌ INVALID: '#{mapping_path}/patrolOverride/speed' must be a positive number"
                  end
                end

                # Validate barkDelay
                if mapping.key?('barkDelay') && (!mapping['barkDelay'].is_a?(Numeric) || mapping['barkDelay'] < 0)
                  issues << "❌ INVALID: '#{mapping_path}/barkDelay' must be a non-negative number (milliseconds)"
                end

                # Validate setPatrolSpeed
                if mapping.key?('setPatrolSpeed') && (!mapping['setPatrolSpeed'].is_a?(Numeric) || mapping['setPatrolSpeed'] <= 0)
                  issues << "❌ INVALID: '#{mapping_path}/setPatrolSpeed' must be a positive number"
                end

                # Validate setDwellMultiplier
                if mapping.key?('setDwellMultiplier') && (!mapping['setDwellMultiplier'].is_a?(Numeric) || mapping['setDwellMultiplier'] <= 0)
                  issues << "❌ INVALID: '#{mapping_path}/setDwellMultiplier' must be a positive number"
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
                    issues << "❌ INVALID: '#{mapping_path}' is a phone NPC event mapping with 'conversationMode: \"#{mapping['conversationMode']}\"' — this field is not used for phone NPCs and has no effect. Remove it (supported: 'phone-chat', 'video-call')."
                  end

                  # targetKnot without a supported conversation trigger does NOT work after the first
                  # conversation. After the first open, storyState is restored and currentKnot is bypassed.
                  if mapping['targetKnot'] && !phone_chat_trigger
                    issues << "❌ INVALID: '#{mapping_path}' is a phone NPC event mapping with 'targetKnot' — this does NOT work after the first conversation. Once a storyState is saved, targetKnot is ignored on reopen. Correct pattern: use 'setGlobal' to set a flag, then add a conditional hub option in the Ink story: '+ {flag_var} [Ask about it] -> knot'. Also add 'sendTimedMessage' to notify the player that new content is available."
                  end

                  # NOTE: 'targetKnot' inside sendTimedMessage IS used by the engine
                  # (npc-manager.js hands it to npc-barks.js, which opens the chat at that knot),
                  # so it is deliberately not flagged.

                  # Event mappings that produce no visible effect are likely broken/incomplete.
                  # phone-chat trigger mappings are self-evidently visible (they open the chat), so skip that check.
                  has_effect = phone_chat_trigger || mapping['setGlobal'] || mapping['sendTimedMessage'] ||
                               mapping['completeTask'] || mapping['unlockTask'] || mapping['unlockAim']
                  unless has_effect
                    issues << "⚠️ WARNING: '#{mapping_path}' is a phone NPC event mapping with no visible effect (no setGlobal, sendTimedMessage, completeTask, unlockTask, or unlockAim). Use 'sendTimedMessage' to notify the player, and 'setGlobal' to flag that a new hub option is available. Example: { \"eventPattern\": \"...\", \"onceOnly\": true, \"setGlobal\": { \"flag_var\": true }, \"sendTimedMessage\": { \"delay\": 1000, \"message\": \"...\" } }"
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
              issues << "❌ INVALID: '#{path}' (phone NPC) missing required 'phoneId' field - phone NPCs must specify which phone they appear on (e.g., 'player_phone')"
            end

            # Validate phone NPC structure - should have storyPath
            unless npc['storyPath']
              issues << "❌ INVALID: '#{path}' (phone NPC) missing required 'storyPath' field - phone NPCs must have a path to their Ink story JSON file"
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
                issues << "❌ INVALID: '#{path}' timedMessages is not an array - must be an array of timed message objects"
              else
                npc['timedMessages'].each_with_index do |msg, idx|
                  msg_path = "#{path}/timedMessages[#{idx}]"

                  # Check for missing message field
                  unless msg['message']
                    issues << "❌ INVALID: '#{msg_path}' missing required 'message' field - must specify the text content of the message"
                  end

                  # Check for incorrect property name (text vs message)
                  if msg['text'] && !msg['message']
                    issues << "❌ INVALID: '#{msg_path}' uses 'text' property - should use 'message' instead. The NPCManager reads msg.message, not msg.text"
                  end

                  # Check for missing delay field
                  unless msg.key?('delay')
                    issues << "⚠️ WARNING: '#{msg_path}' missing 'delay' property - should specify delay in milliseconds (0 for immediate)"
                  end

                  # Check for incorrect property name (knot vs targetKnot) in timed messages
                  if msg['knot'] && !msg['targetKnot']
                    issues << "❌ INVALID: '#{msg_path}' uses 'knot' property - should use 'targetKnot' instead. Change 'knot' to 'targetKnot'"
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
                issues << "❌ INVALID: '#{path}/itemsHeld[#{item_idx}]' has no 'type' field - #give_item matches on type."
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

  # Check phoneNPCs section - this is the OLD/INCORRECT format
  if json_data['phoneNPCs']
    json_data['phoneNPCs'].each_with_index do |npc, idx|
      path = "phoneNPCs[#{idx}]"

      # Flag incorrect structure - phone NPCs should be in rooms, not phoneNPCs section
      issues << "❌ INVALID: '#{path}' - Phone NPCs should be defined in 'rooms/{room_id}/npcs[]' arrays, NOT in a separate 'phoneNPCs' section. See scenarios/npc-sprite-test3/scenario.json.erb for correct format. Phone NPCs should be in the starting room (or room where phone is accessible) with npcType: 'phone'"

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
                issues << "❌ INVALID: '#{mapping_path}' references global variable '#{var_name}' in eventPattern, but it's not defined in scenario.globalVariables. Add '#{var_name}' with an initial value (typically false) to globalVariables"
              end
            end

            # Check for missing spriteTalk when using non-numeric frame sprites.
            # The engine falls back to '{spriteSheet}_talk.png' (then '_headshot.png'),
            # so only warn when neither derived file actually exists.
            if !npc['spriteTalk'] && npc['spriteSheet']
              # Sprites with named frames (not numeric indices) need a portrait image
              named_frame_sprites = ['female_spy', 'male_spy', 'female_hacker_hood', 'male_doctor']
              if named_frame_sprites.include?(npc['spriteSheet'])
                chars_dir = File.join(File.expand_path('..', __dir__), 'public/break_escape/assets/characters')
                derived = ["#{npc['spriteSheet']}_talk.png", "#{npc['spriteSheet']}_headshot.png"]
                unless derived.any? { |f| File.exist?(File.join(chars_dir, f)) }
                  issues << "⚠️ WARNING: '#{path}' uses spriteSheet '#{npc['spriteSheet']}' which has named frames, but no 'spriteTalk' property and no derived portrait ('assets/characters/#{derived[0]}' or '#{derived[1]}'). Person-chat cutscenes will show frame errors. Add one of those images, or a 'spriteTalk' property pointing to a portrait"
                end
              end
            end

            # Validate background for person-chat cutscenes
            unless mapping['background']
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
    issues << "❌ INVALID: Global variable '#{var_name}' is referenced in eventPatterns but not defined in scenario.globalVariables. Add '#{var_name}' to globalVariables with an initial value (typically false for cutscene triggers)"
  end

  # Cross-reference task targetGroup against item collection_groups
  target_groups_used.each do |group|
    unless collection_groups_used.include?(group)
      issues << "❌ INVALID: Task uses targetGroup '#{group}' but no items have collection_group: '#{group}'. Add collection_group: '#{group}' to the relevant items."
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
        issues << "❌ INVALID: #{task_path} references targetNPC '#{task['targetNPC']}' which does not exist in any room. Check the NPC id."
      end
      if task['targetRoom'] && !all_room_ids.include?(task['targetRoom'])
        issues << "❌ INVALID: #{task_path} references targetRoom '#{task['targetRoom']}' which is not a defined room."
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
          issues << "❌ INVALID: #{task_path} is type 'submit_flags' but has no 'targetFlags' array. " \
                    "The task can never complete. Add \"targetFlags\": [\"<vm_name>:flag_1\"] and " \
                    "\"targetCount\": 1. See scenarios/m01_first_contact/scenario.json.erb."
        elsif !task['targetCount'].is_a?(Integer) || task['targetCount'] < 1
          issues << "❌ INVALID: #{task_path} (submit_flags) has targetFlags but no valid 'targetCount'. " \
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
  game_js = File.join(public_dir, 'js/core/game.js')
  loaded_sheets = File.exist?(game_js) ? File.read(game_js).scan(/this\.load\.(?:atlas|spritesheet)\(\s*'([^']+)'/).flatten.to_set : nil
  legacy_talk = { 'hacker' => 'assets/characters/hacker-talk.png', 'hacker-red' => 'assets/characters/hacker-red-talk.png' }
  asset_exists = ->(rel) { rel.is_a?(String) && File.exist?(File.join(public_dir, rel)) }
  all_npcs.each do |rid, i, npc|
    next if npc['npcType'] == 'phone'
    path = "rooms/#{rid}/npcs[#{i}]"
    sheet = npc['spriteSheet']
    if sheet && loaded_sheets && !loaded_sheets.include?(sheet)
      issues << "⚠️ WARNING: '#{path}' (#{npc['id']}) uses spriteSheet '#{sheet}', which game.js never loads " \
                "(no this.load.atlas/spritesheet for it). The NPC renders as a missing texture. Use a loaded sheet or add it to game.js."
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
  end

  issues
end

# ============================================================================
# TOOLING PASS 4c CHECKS: stacked timed texts, globals nothing reads, credit
# sections that can print empty. All SUGGESTION or WARNING, never INVALID.
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
        elsif (k =~ /\AsetGlobal/ || k == 'globalVarOnKO') && v.is_a?(String)
          setters[v] ||= "#{path}/#{k}"
        elsif k == 'setGlobal' && v.is_a?(String)
          setters[v] ||= "#{path}/#{k}"
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

def check_tooling_pass4c(json_data, repo_root)
  check_stacked_timed_texts(json_data) + check_globals_never_read(json_data, repo_root) + check_credit_sections(json_data)
end

# ============================================================================
# DIALOGUE LINT: runs scripts/ink_runtime_check/dialoguelint.mjs over the mission folder.
# Findings are advisory (WARNING in the validator's terms) and never change the exit code.
# ============================================================================

DIALOGUE_LINT_PER_RULE = 4

def run_dialogue_lint(mission_dir, repo_root)
  node = ENV['PATH'].to_s.split(File::PATH_SEPARATOR).map { |d| File.join(d, 'node') }.find { |f| File.file?(f) && File.executable?(f) }
  return nil unless node
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
  all.group_by { |_, x| x['rule'] }.sort_by { |_, v| -v.size }.each do |rule, list|
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
        issues << "❌ INVALID: '#{mp}' condition \"#{m['condition']}\" uses #{bad}. npc-manager.js " \
                  "safeEvaluateCondition supports only '&&'-joined simple terms (value/data.x/globalVars.x " \
                  "with ===, !==, >, <, >=, <=, '!' or .includes('…')), so this evaluates to false and the " \
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
      issues << "❌ INVALID: 'timers[#{i}]' condition \"#{t['condition']}\" uses #{bad}. scenario-timer.js " \
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
        issues << "❌ INVALID: '#{path}' is a complete_task action with no 'taskId'. apply-actions.js reads " \
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

      %w[observationVariants spriteVariants textVariants].each do |vk|
        Array(node[vk]).each_with_index do |v, i|
          next unless v.is_a?(Hash)
          if (bad = unsupported_condition_syntax(v['condition'], allow_includes: false))
            issues << "❌ INVALID: '#{path}/#{vk}[#{i}]' condition \"#{v['condition']}\" uses #{bad}. conditional-text.js " \
                      "supports only '&&'-joined terms; '||' and parentheses are mis-read."
          end
        end
      end

      node.each do |k, v|
        next if k == 'objectives' && path.empty?
        walk.call(v, path.empty? ? k.to_s : "#{path}/#{k}", holder_items)
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
    issues << "❌ INVALID: Doors between '#{b['a']}' and '#{b['b']}' (#{b['dir']}) are misaligned, so the player " \
              "can't walk straight through: #{b['detail']}. Change the room types/sizes or the connection so the " \
              "two door gaps meet (see scripts/check_door_alignment.py)."
  end
  Array(res['unmodelled']).each do |u|
    issues << "⚠️ WARNING: UNMODELLED multi-door connection #{u} — door alignment for array connections is not checked. " \
              "Verify these doors line up in the browser."
  end
  issues
end

# Main execution
def main
  options = {
    schema_path: File.join(__dir__, 'scenario-schema.json'),
    verbose: false,
    output_json: false,
    no_graph: false,
    skip_ink: false,
    no_lint: false
  }

  OptionParser.new do |opts|
    opts.banner = "Usage: #{$PROGRAM_NAME} <scenario.json.erb> [options]"

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

    opts.on('--no-lint', 'Skip the DIALOGUE LINT section (dialoguelint.mjs over the mission folder)') do
      options[:no_lint] = true
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

  puts "Validating scenario: #{erb_path}"
  puts "Using schema: #{schema_path}"
  puts

  # Check scenario directory structure
  puts "Checking scenario directory structure..."
  dir_issues = check_scenario_directory_structure(erb_path)
  if !dir_issues.empty?
    puts "✗ Directory structure validation failed with #{dir_issues.length} error(s):"
    puts

    dir_issues.each_with_index do |issue, index|
      puts "#{index + 1}. #{issue}"
      puts
    end

    exit 1
  end
  puts "✓ Directory structure is valid"
  puts

  # Load valid item types from assets directory
  repo_root = File.expand_path('..', __dir__)
  valid_item_types = load_valid_item_types(repo_root)
  if valid_item_types
    puts "Loaded #{valid_item_types.size} valid item types from assets/objects/"
  else
    puts "⚠️ assets/objects/ directory not found — item type validation skipped"
  end
  puts

  begin
    # Render ERB to JSON
    puts "Rendering ERB template..."
    json_data, rendered_json = render_erb_to_json(erb_path, {}, include_rendered: true)
    puts "✓ ERB rendered successfully"
    puts

    # Output JSON if requested
    if options[:output_json]
      puts "Rendered JSON:"
      puts JSON.pretty_generate(json_data)
      puts
    end

    # Pre-validate structure before running schema validation
    puts "Checking JSON structure..."
    structure_issues = check_structure_validity(json_data)
    structure_issues.concat(check_duplicate_show_scenario_brief(rendered_json))

    # Report structure issues immediately and exit
    if !structure_issues.empty?
      puts "✗ Structure validation failed with #{structure_issues.length} error(s):"
      puts

      structure_issues.each_with_index do |issue, index|
        puts "#{index + 1}. #{issue}"
        puts
      end

      exit 1
    end
    puts "✓ JSON structure is valid"
    puts

    # Check for unknown fields (warnings, not errors)
    puts "Checking for unknown fields..."
    unknown_fields_warnings = check_unknown_fields(json_data)
    if unknown_fields_warnings.any?
      puts "⚠️ Found #{unknown_fields_warnings.length} unknown field(s):"
      puts
      unknown_fields_warnings.each_with_index do |warning, index|
        puts "#{index + 1}. #{warning}"
      end
      puts
    else
      puts "✓ No unknown fields"
      puts
    end

    # Check ink files exist and compile (unless skipped)
    unless options[:skip_ink]
      puts "Checking ink files..."
      scenario_dir = File.dirname(erb_path)
      ink_issues = check_ink_files(json_data, repo_root, scenario_dir)

      # Report ink issues immediately and exit if critical
      if ink_issues.any? { |issue| issue.start_with?("❌") }
        puts "✗ Ink file validation failed with #{ink_issues.count { |i| i.start_with?("❌") }} error(s):"
        puts

        ink_issues.each_with_index do |issue, index|
          puts "#{index + 1}. #{issue}"
          puts
        end

        exit 1
      elsif ink_issues.any?
        puts "⚠️ Found #{ink_issues.length} ink file warning(s):"
        puts

        ink_issues.each_with_index do |issue, index|
          puts "#{index + 1}. #{issue}"
          puts
        end
      else
        puts "✓ All ink files valid"
      end
      puts
    else
      puts "⏭️ Skipping ink file validation (--skip-ink)"
      puts
    end

    # Dialogue lint over the mission folder (advisory; needs node; off with --no-lint or --skip-ink)
    unless options[:skip_ink] || options[:no_lint]
      lint_report = run_dialogue_lint(File.dirname(erb_path), repo_root)
      print_dialogue_lint(lint_report, repo_root) if lint_report
    end

    # Check objective task completion wiring
    puts "Checking objective task wiring..."
    wiring_issues = check_objectives_wiring(json_data, repo_root)
    if wiring_issues.any? { |i| i.start_with?("❌") }
      puts "✗ Objective wiring check found #{wiring_issues.count { |i| i.start_with?('❌') }} error(s):"
      puts
      wiring_issues.each_with_index do |issue, index|
        puts "#{index + 1}. #{issue}"
        puts
      end
      # Non-fatal: continue so the author sees all problems at once.
      puts
    elsif wiring_issues.any?
      puts "⚠️ Found #{wiring_issues.length} objective wiring warning(s):"
      puts
      wiring_issues.each_with_index do |issue, index|
        puts "#{index + 1}. #{issue}"
        puts
      end
      puts
    else
      puts "✓ Objective task wiring OK"
      puts
    end

    # Check room layout geometry (world-space overlaps)
    puts "Checking room layout geometry..."
    geometry_issues = check_room_geometry(json_data, repo_root)
    puts "Checking door alignment..."
    door_issues = check_door_alignment(erb_path, repo_root)
    if geometry_issues.any? { |i| i.start_with?("⚠️") }
      puts "⚠️ Found #{geometry_issues.count { |i| i.start_with?('⚠️') }} room overlap warning(s):"
      puts
      geometry_issues.each_with_index do |issue, index|
        puts "#{index + 1}. #{issue}"
        puts
      end
    elsif geometry_issues.any?
      geometry_issues.each { |issue| puts issue }
      puts
    else
      puts "✓ Room layout geometry OK — no world-space overlaps"
      puts
    end
    if door_issues.any? { |i| i.start_with?("❌") }
      puts "✗ Door alignment check found #{door_issues.count { |i| i.start_with?('❌') }} error(s):"
      puts
      door_issues.each_with_index { |issue, index| puts "#{index + 1}. #{issue}"; puts }
    elsif door_issues.any?
      puts "⚠️ Door alignment: #{door_issues.length} note(s):"
      puts
      door_issues.each_with_index { |issue, index| puts "#{index + 1}. #{issue}"; puts }
    else
      puts "✓ Door alignment OK"
      puts
    end

    # Validate against schema
    puts "Validating against schema..."
    errors = validate_json(json_data, schema_path)

    # Check for common issues and structural problems
    puts "Checking for common issues..."
    common_issues = check_common_issues(json_data, valid_item_types)
    common_issues += check_lock_credentials(json_data)
    common_issues += check_engine_limits(json_data)
    common_issues += check_recurring_bugs(json_data, repo_root)
    common_issues += check_unheard_room_triggers(json_data, repo_root)
    common_issues += check_tooling_pass4c(json_data, repo_root)

    # Check for recommended fields
    puts "Checking recommended fields..."
    warnings = check_recommended_fields(json_data)

    # Report errors
    if errors.empty?
      puts "✓ Schema validation passed!"
    else
      puts "✗ Schema validation failed with #{errors.length} error(s):"
      puts

      errors.each_with_index do |error, index|
        puts "#{index + 1}. #{error}"
        puts
      end

      if options[:verbose]
        puts "Full JSON structure:"
        puts JSON.pretty_generate(json_data)
      end

      exit 1
    end

    # Report common issues
    if common_issues.empty?
      puts "✓ No common issues found."
      puts
    else
      puts "⚠️ Found #{common_issues.length} issue(s) and suggestion(s):"
      puts

      common_issues.each_with_index do |issue, index|
        puts "#{index + 1}. #{issue}"
      end
      puts
    end

    # Report warnings
    if warnings.empty?
      puts "✓ No missing recommended fields."
      puts
    else
      puts "⚠️ Found #{warnings.length} missing recommended field(s):"
      puts

      warnings.each_with_index do |warning, index|
        puts "#{index + 1}. #{warning}"
      end
      puts
    end

    # Generate dungeon graph (runs by default, suppress with --no-graph)
    unless options[:no_graph]
      graph_script = File.join(__dir__, 'generate_dungeon_graph.rb')
      if File.exist?(graph_script)
        puts "Generating dungeon graph..."
        result = system('ruby', graph_script, erb_path)
        graph_out = File.join(File.dirname(erb_path), 'dungeon_graph.html')
        if result
          puts "✓ Dungeon graph: #{graph_out}"
        else
          puts "⚠️ Dungeon graph generation failed (non-fatal)"
        end
        puts
      end
    end

    # Exit with success (warnings don't cause failure)
    puts "✓ Validation complete!"
    exit 0
  rescue StandardError => e
    $stderr.puts "ERROR: #{e.message}"
    if options[:verbose]
      $stderr.puts e.backtrace.join("\n")
    end
    exit 1
  end
end

main if __FILE__ == $PROGRAM_NAME
