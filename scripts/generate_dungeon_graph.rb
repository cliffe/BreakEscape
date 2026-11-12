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
require 'cgi'
require 'digest'

# Scenario and ink files are UTF-8: read them so whatever the shell's locale (LANG=C).
Encoding.default_external = Encoding::UTF_8

require_relative '../lib/break_escape/declared_grants'
require_relative '../lib/break_escape/access_identities'
require_relative '../lib/break_escape/network_model'
require_relative '../lib/break_escape/npc_habits'
require_relative '../lib/break_escape/npc_habits/clues'
require_relative '../lib/break_escape/access_work'

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
  'ransomware_display' => 'Ransomware terminal',
  'login'              => 'Sign-in'
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

def add_edge(from, to, dashed: false, label: nil, undirected: false)
  return unless from && to && from != to
  edge = { from: from, to: to, dashed: dashed, label: label }
  edge[:undirected] = true if undirected # a network link; the key is absent otherwise
  $edges << edge
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
# Declared grants: give_item rewards whose item (and contents) sit in no room, e.g. a
# timer's "Remote Session" opener (DECLARED_GRANTS_PLAN.md). Each gets a node, from the
# room of the object that gives it or else the start room, labelled with its trigger
# global, and its contents are walked so nested locks keep their lock nodes.
# ---------------------------------------------------------------------------
DECLARED_GRANTS = BreakEscape::DeclaredGrants.for(scenario)

def grant_source_room(grant, scenario, start_room)
  room_id = grant['path'][%r{\Arooms/([^/\[]+)}, 1]
  room_id || start_room
end

def grant_trigger(grant, scenario)
  m = grant['path'].match(/\Atimers\[(\d+)\]/)
  return nil unless m

  timer = (scenario['timers'] || [])[m[1].to_i] || {}
  timer['startOnGlobal'] || timer['id']
end

DECLARED_GRANTS.each do |grant|
  item     = grant['item']
  raw_id   = BreakEscape::DeclaredGrants.identities(item).first
  grant_id = "grant_#{nid(raw_id)}"
  src_room = grant_source_room(grant, scenario, start_room)
  add_node(grant_id, "#{item['name'] || raw_id}<br/>(granted)", 'item')
  if src_room && rooms.key?(src_room)
    add_node(src_room, room_label(src_room, rooms[src_room]), 'room')
    add_edge(src_room, grant_id, dashed: true, label: grant_trigger(grant, scenario))
  end
  walk_objects(item['contents'], grant_id, rooms)
end

# ---------------------------------------------------------------------------
# Access model identities (ACCESS_MODEL_PLAN.md, section 8 step 5). An NPC's card and an
# NPC's sign-in are key nodes, from the room the NPC stands in, with an edge to every rfid
# lock and sign-in PC the identity opens (BreakEscape::AccessIdentities, the server's
# rules). A card_id several NPCs carry is one node naming every holder. Drawn only for
# scenarios that use the access model, so other graphs are unchanged.
# ---------------------------------------------------------------------------
def access_lock_node(entry, rooms)
  return "door_#{entry[:room]}" if entry[:kind] == 'door'

  obj      = entry[:lock]
  obj_id   = obj['id'] || nid((obj['name'] || obj['type']).to_s)
  lock_id  = "lock_#{obj_id}"
  unless $nodes.key?(lock_id)
    obj_name = obj['name'] || obj_id.tr('_', ' ').split.map(&:capitalize).join(' ')
    add_node(lock_id, "#{obj_name}<br/>#{LOCK_TYPE_LABELS[obj['lockType']] || 'Lock'}", 'lock')
    add_node(entry[:room], room_label(entry[:room], rooms[entry[:room]]), 'room')
    add_edge(entry[:room], lock_id)
  end
  lock_id
end

if BreakEscape::AccessIdentities.uses_access_model?(scenario)
  reach = BreakEscape::AccessIdentities.reach(scenario)
  holder_name = ->(npc) { npc['displayName'] || npc['id'].to_s }

  reach[:cards].each do |card|
    next if card[:opens].empty?

    card_node = "card_#{nid(card[:card_id])}"
    holders   = card[:holders].map { |h| holder_name.call(h[:npc]) }.uniq
    add_node(card_node, "#{card[:card]['name'] || card[:card_id]}<br/>(#{holders.join(', ')})", 'key')
    card[:holders].map { |h| h[:room] }.uniq.each do |room_id|
      add_node(room_id, room_label(room_id, rooms[room_id]), 'room')
      add_edge(room_id, card_node)
    end
    card[:opens].each { |lock| add_edge(card_node, access_lock_node(lock, rooms)) }
  end

  reach[:accounts].each do |account|
    next if account[:opens].empty?

    npc         = account[:npc]
    signin_node = "signin_#{nid(npc['id'])}"
    add_node(signin_node, "#{holder_name.call(npc)} sign-in<br/>(#{npc['creds']['username']})", 'key')
    add_node(account[:room], room_label(account[:room], rooms[account[:room]]), 'room')
    add_edge(account[:room], signin_node)
    account[:opens].each { |pc| add_edge(signin_node, access_lock_node(pc, rooms)) }
  end
end

# ---------------------------------------------------------------------------
# NPC habits (ACCESS_MODEL_SLICE_9_1_PLAN.md, 7.3): how the player comes by an account's
# password, or an open screen that needs none, as labelled edges. Read from the expanded
# copy (BreakEscape::NpcHabits.expanded_copy, the server's ids and fills); every other node
# and edge above reads the authored data. Drawn only for NPCs with a level or `habits`.
# ---------------------------------------------------------------------------
habits_copy, habits_report = BreakEscape::NpcHabits.expanded_copy(scenario)
# Shared by the habits section and the Wi-Fi key sources (slice 9.3b) below.
room_node_for = lambda do |room_id|
  add_node(room_id, room_label(room_id, rooms[room_id] || {}), 'room')
end
# A clue's node: its object, hung from the innermost lock in front of it (a container's
# lock node) or from its room, so a clue behind the account it opens shows as a loop.
# A container lock the walk above did not draw (one in an NPC's itemsHeld, say) is
# added here, hung from the lock before it or the room, so the clue never floats.
container_lock_node_for = lambda do |lock_label, from|
  drawn = "lock_#{lock_label}"
  return drawn if $nodes.key?(drawn)

  node = "lock_#{nid(lock_label)}"
  unless $nodes.key?(node)
    obj = BreakEscape::NpcHabits::Clues.find_object(habits_copy, lock_label)
    name = (obj && obj['name']) || lock_label.to_s.tr('_', ' ')
    add_node(node, "#{name}<br/>#{LOCK_TYPE_LABELS[obj && obj['lockType']] || 'Lock'}", 'lock')
    add_edge(from, node) if from
  end
  node
end
clue_node_for = lambda do |source, label = nil|
  node = "clue_#{nid(source[:path])}"
  unless $nodes.key?(node)
    add_node(node, label || source[:name] || source[:path].to_s.tr('_', ' '), 'item')
    container_locks = source[:locks].to_a - [source[:room]]
    if container_locks.any?
      from = source[:room] ? room_node_for.call(source[:room]) : nil
      container_locks.each { |lock| from = container_lock_node_for.call(lock, from) }
      add_edge(from, node)
    elsif source[:room]
      add_edge(room_node_for.call(source[:room]), node)
    end
  end
  node
end

unless habits_report.empty?
  ai_h = BreakEscape::AccessIdentities
  cl_h = BreakEscape::NpcHabits::Clues
  copy_npcs = ai_h.room_npcs(habits_copy).to_h { |e| [e[:npc]['id'], e] }
  copy_pcs = ai_h.sign_in_pcs(habits_copy)
  copy_policies = habits_copy['policies'].is_a?(Hash) ? habits_copy['policies'] : {}
  habit_texts = nil
  habit_homes = nil

  signin_node_for = lambda do |entry|
    npc  = entry[:npc]
    node = "signin_#{nid(npc['id'])}"
    unless $nodes.key?(node)
      add_node(node, "#{npc['displayName'] || npc['id']} sign-in<br/>(#{npc['creds']['username']})", 'key')
      add_node(entry[:room], room_label(entry[:room], rooms[entry[:room]]), 'room')
      add_edge(entry[:room], node)
    end
    node
  end

  habits_report.each do |item|
    entry = copy_npcs[item[:id]]
    next unless entry && ai_h.account?(entry[:npc])

    npc = entry[:npc]
    habits = item[:habits]
    # writesDown: from the room of the owner's sign-in PC (not the PC: the account already
    # has an edge to it, and an edge back would draw a loop).
    if habits['writesDown'] == true
      copy_pcs.each do |pc_entry|
        pc = pc_entry[:object]
        next unless ai_h.owner_id(pc, habits_copy) == npc['id']
        next if (pc['postitNote'].is_a?(String) && !pc['postitNote'].strip.empty?) || pc['showPostit'] == false

        add_edge(room_node_for.call(pc_entry[:room]), signin_node_for.call(entry), label: "sticky note at #{pc['id']}")
      end
    end
    # locksScreen never or sometimes, where the server would allow a claim.
    screen = item[:screen]
    if screen && screen[:filled] && %w[never sometimes].include?(screen[:value]) && ai_h.needs_tracked?(npc)
      screen[:pcs].select { |pc| pc[:applied] && pc[:login] }.each do |pc_info|
        pc_entry = copy_pcs.find { |p| p[:object]['id'] == pc_info[:id] }
        next unless pc_entry

        pc = pc_entry[:object]
        policy = copy_policies[(pc['policy'] || habits_copy['defaultPolicy']).to_s]
        next if policy.is_a?(Hash) && policy['autoLockMin'].is_a?(Numeric) && policy['autoLockMin'].zero?
        next unless ai_h.account_admitted?(pc, npc)
        next if ai_h.screen_always_locks?(pc, npc)

        label = screen[:value] == 'sometimes' ? 'unlocked screen (roll)' : 'unlocked screen'
        add_edge(room_node_for.call(pc_entry[:room]), access_lock_node({ kind: 'login', lock: pc, room: pc_entry[:room] }, rooms),
                 label: label)
      end
    end
    next unless %w[reused guessable].include?(habits['password'])

    habit_homes ||= cl_h.secret_homes(habits_copy)
    habit_texts ||= cl_h.readable_texts(habits_copy, File.dirname(SCENARIO_FILE))
    account_node = signin_node_for.call(entry)
    if habits['password'] == 'reused'
      cl_h.reuse_homes(npc, habits_copy, habit_homes).each do |home|
        case home[:kind]
        when :account
          other = copy_npcs[home[:npc_id]]
          add_edge(signin_node_for.call(other), account_node, label: "shared with #{home[:npc_id]}") if other
        when :lock
          door = home[:path] == "rooms/#{home[:object_id]}"
          from = door ? "door_#{home[:object_id]}" : "lock_#{home[:object_id] || nid(home[:path])}"
          add_node(from, home[:path].to_s, 'lock') unless $nodes.key?(from)
          add_edge(from, account_node, label: 'same password')
        else
          from = "secret_#{nid(home[:path])}"
          add_node(from, home[:kind] == :wifi ? 'Wi-Fi key' : 'Captured sign-in', 'key')
          add_edge(from, account_node, label: 'same password')
        end
      end
    else
      backing = cl_h.backing(npc, habits_copy, habit_texts, habits['passwordPattern'])
      next unless backing[:backed]

      sources = backing[:pieces].flat_map { |p| p[:sources] }
      clue = backing[:pattern]
      sources << { path: clue[:path], locks: clue[:locks], room: clue[:room], name: clue[:name] } if clue && clue[:path]
      sources.uniq { |s| s[:path] }.each { |s| add_edge(clue_node_for.call(s), account_node, label: 'clue') }
    end
  end
end

# holdsDoors (ACCESS_MODEL_SLICE_9_1_PLAN.md 7.3, step 5): a gate with a noHold (filled by the
# loader, or authored) gets no node of its own; its secured room's door node says who holds
# it for the player and who does not. As the client reads it: a gate with enabled: false is
# no gate (gate_entries drops it), nor is one on an entry no doorway reads (entry[:doorway]),
# and a gate with playerMayPassIf ignores its noHold.
(habits_copy['rooms'].is_a?(Hash) ? BreakEscape::NpcHabits.gate_entries(habits_copy) : []).each do |entry|
  next if entry[:doorway]

  gate = entry[:gate]
  pass_if = gate['playerMayPassIf']
  next if pass_if.is_a?(String) && !pass_if.empty?
  next unless gate['noHold'].is_a?(Array) && gate['noHold'].any?

  node = $nodes["door_#{entry[:connected_room]}"]
  next unless node

  holders = entry[:open_for] - gate['noHold']
  parts = []
  parts << "held by #{holders.join(', ')}" if holders.any?
  parts << "not held by #{gate['noHold'].join(', ')}"
  node[:label] = "#{node[:label]}<br/>gate: #{parts.join('; ')}"
end

# ---------------------------------------------------------------------------
# Networks (ACCESS_MODEL_SLICE_9_3_PLAN.md, section 7.3). A jack is a lock-like node that
# the rogue device opens, from the jack's room, with an edge to its network's node. A
# network node exposes each sign-in host and each resource on it (BreakEscape::NetworkModel,
# hosts then resources, each by id). A headless host has no way in from its room: the
# network edge and the accounts' sign-in edges are its only routes. A share with an access
# list is reached from each admitted account's sign-in node (an account that signs in at an
# object on the share's network); an open share from the network. Drawn only for scenarios
# that define networks, so other graphs are unchanged.
# ---------------------------------------------------------------------------
NETWORKS = BreakEscape::NetworkModel.networks(scenario)
# Every Wi-Fi key (slice 9.3b): no label in any tab may print one.
WIFI_KEYS = NETWORKS.keys.filter_map { |id| (BreakEscape::NetworkModel.wifi_of(scenario, id) || {})['psk'] }
                    .select { |k| BreakEscape::NetworkModel.present_string?(k) }.freeze
# Authored text is scrubbed of each key where it enters an output, whatever field (an NPC
# name, a container, a task title, the brief) carried it in, never the page around it: every
# label, edge label, the title, the brief and the critical path, in any letter case and at any
# length, in each form an output encodes it (as written, with " shown as ', HTML, JSON, JS
# template, node id, and the label a fallback builds from an id: separators turned into
# spaces, then capitalised). A node id that holds a key is swapped for an opaque one
# (hidden_<n>), so every other id keeps its value. A final check on each output
# (check_wifi_key_free) stops the run if a key form is still there, and deletes the old graph
# files so a stale copy cannot stay on disk.
# A form that squeezes out punctuation (the id form, the spaced label form) is used only while
# it keeps at least half the key: psk '!!a!!' must not scrub every 'a' on the page or hide
# every id with an 'a' in it. The key as written is always used, however short.
squeezed_forms = lambda do |k|
  [nid(k), nid(k).tr('_', ' '), k.gsub(/[\s_-]+/, ' ').strip].select { |f| f.length * 2 >= k.length }
end
WIFI_KEY_FORMS = WIFI_KEYS.flat_map do |k|
  [k, k.tr('"', "'"), CGI.escapeHTML(k), JSON.generate(k)[1..-2], k.gsub('`') { '\\`' }.gsub('${') { '\\${' }] +
    squeezed_forms.call(k)
end.uniq.reject(&:empty?).sort_by { |f| -f.length }.freeze
# True when a word holds no key form; the stand-in text, the id prefix and every hidden id
# handed out must pass it.
def key_free?(word)
  WIFI_KEY_FORMS.none? { |f| word.downcase.include?(f.downcase) }
end
WIFI_KEY_TOKEN = (%w[WIFI_KEY_HIDDEN REDACTED *** ##].find { |w| key_free?(w) } || '').freeze
WIFI_ID_TOKEN = (%w[hidden opaque redacted zq].find { |w| key_free?(w) } || 'z').freeze
WIFI_LABEL_RE = WIFI_KEY_FORMS.empty? ? nil : Regexp.union(WIFI_KEY_FORMS.map { |f| Regexp.new(Regexp.escape(f), Regexp::IGNORECASE) })
WIFI_ID_RE = WIFI_KEYS.empty? ? nil : Regexp.union(WIFI_KEYS.flat_map { |k| [k, nid(k)].select { |f| f.length * 2 >= k.length } }.reject(&:empty?).uniq
                                                       .map { |f| Regexp.new(Regexp.escape(f), Regexp::IGNORECASE) })
$hidden_ids = {}
$scrub_hits = false
# Every string the scenario holds, as written and as a node id would spell it: a hidden id
# never takes one of these, so an authored id such as hidden_2 keeps its own node.
taken = Set.new
walk_strings = lambda do |v|
  case v
  when String then taken << v << nid(v)
  when Array then v.each { |x| walk_strings.call(x) }
  when Hash then v.each { |k, x| taken << k.to_s; walk_strings.call(x) }
  end
end
walk_strings.call(scenario) if WIFI_ID_RE
TAKEN_IDS = taken.freeze
def wifi_key_in?(text)
  WIFI_LABEL_RE ? WIFI_LABEL_RE.match?(text.to_s) : false
end
# The test switch: only the node tests set it, to prove the final check stops a leak. It is
# never silent, and the validator strips it before running the generator.
SCRUB_OFF_FOR_TEST = ENV['DUNGEON_GRAPH_TEST_NO_SCRUB'] == '1'
if SCRUB_OFF_FOR_TEST
  warn '⚠️ WARNING: DUNGEON_GRAPH_TEST_NO_SCRUB=1 is set, so the Wi-Fi key label scrub is OFF. ' \
       'It is a test switch: unset it before generating a real graph.'
end
# A label with every key form replaced; the generator's own <br/> joins are kept, so a short
# key never eats one.
def scrub_label(text)
  return text unless WIFI_LABEL_RE && text && !SCRUB_OFF_FOR_TEST

  out = text.to_s.split('<br/>', -1).map { |part| part.gsub(WIFI_LABEL_RE, WIFI_KEY_TOKEN) }.join('<br/>')
  $scrub_hits = true if out != text.to_s
  out
end
def hidden_id?(id)
  WIFI_ID_RE && id ? WIFI_ID_RE.match?(id.to_s) : false
end
# An id that holds a key becomes hidden_<n>. The number comes from a salted hash of the id with
# every key form cut out, so it never depends on the key, and it does not move when another
# part of the graph changes. A number whose id would hold a key form, is an authored string,
# or is already handed out, is skipped.
HIDDEN_ID_SALT = 'break-escape-dungeon-graph-hidden-id'
def hide_id(id)
  return id unless hidden_id?(id)

  $hidden_ids[id] ||= begin
    rest = id.to_s.gsub(WIFI_ID_RE, '~')
    n = Digest::SHA256.hexdigest("#{HIDDEN_ID_SALT}:#{rest}").to_i(16) % 10_000
    used = $hidden_ids.values.to_set
    # A one-character key such as '_' fails every candidate with that separator: try another.
    found = %w[_ x q].product((0...10_000).to_a).lazy.map { |sep, i| "#{WIFI_ID_TOKEN}#{sep}#{(n + i) % 10_000}" }
                     .find { |c| key_free?(c) && !TAKEN_IDS.include?(c) && !used.include?(c) && !$nodes.key?(c) }
    found || abort("❌ ERROR: no hidden id is free of the Wi-Fi key; use a longer key (WPA2 needs at least eight characters).")
  end
end
# Stops the run when an output holds a key form more often than the same page with every
# authored string blanked (the skeleton): the page's own text (a script that says `function`,
# a style that says `fullscreen`) is in both and never counts. A stop deletes the graph files
# a previous run left, since they may hold the very key, and exits with KEY_STOP_STATUS so the
# validator can count it as an error.
KEY_STOP_STATUS = 3
def check_wifi_key_free(outputs)
  outputs.each do |file, (real, skeleton)|
    leaked = WIFI_KEY_FORMS.any? do |f|
      re = Regexp.new(Regexp.escape(f), Regexp::IGNORECASE)
      real.scan(re).size > skeleton.scan(re).size
    end
    next unless leaked

    removed = outputs.keys.select { |f| File.exist?(f) }
    removed.each { |f| File.delete(f) }
    cause = if SCRUB_OFF_FOR_TEST
              'The label scrub was off because DUNGEON_GRAPH_TEST_NO_SCRUB=1 is set: unset it and run again.'
            else
              'An authored string reaches the output by a path scripts/generate_dungeon_graph.rb does not scrub.'
            end
    gone = removed.empty? ? 'No graph file was written.' : "No graph file was written, and the old #{removed.map { |f| File.basename(f) }.join(', ')} were deleted so a stale copy cannot stay on disk."
    warn "❌ ERROR: #{File.basename(file)} still holds a Wi-Fi key after the label scrub. #{gone} #{cause}"
    exit KEY_STOP_STATUS
  end
end
if NETWORKS.any?
  nm = BreakEscape::NetworkModel
  ai = BreakEscape::AccessIdentities
  # An outage (slice 9.3b, plan 9.3) is a condition on the network node, not a gate: the
  # label names the downIf global and says whether the network starts down.
  globals_g = scenario['globalVariables'].is_a?(Hash) ? scenario['globalVariables'] : {}
  # A label from an authored value only when it is a non-blank string, else the fallback.
  npc_text = ->(value, fallback) { nm.present_string?(value) ? value : fallback.to_s }
  # The same, and never a label that holds a Wi-Fi key (an SSID or a note named after it).
  safe_text = lambda do |value, fallback|
    text = npc_text.call(value, fallback)
    wifi_key_in?(text) ? fallback.to_s : text
  end
  net_node = lambda do |net_id|
    net = NETWORKS[net_id]
    label = "#{safe_text.call(net['name'], net_id)}<br/>Network"
    down = net['downIf']
    if nm.present_string?(down)
      label += "<br/>down while #{down}"
      label += ' (down at start)' if nm.truthy?(globals_g[down])
    end
    add_node("net_#{nid(net_id)}", label, 'room')
  end
  room_node = lambda do |room_id|
    next nil unless room_id && rooms.key?(room_id)

    add_node(room_id, room_label(room_id, rooms[room_id]), 'room')
  end

  # Rogue devices, from their home.
  device_nodes = nm.rogue_device_definitions(scenario).map do |found|
    item = found[:item]
    node = add_node("device_#{nid(item['id'])}", "#{item['name'] || item['id']}<br/>(rogue device)", 'key')
    room_id = found[:path][%r{\Arooms/([^/\[]+)}, 1]
    from = case found[:home]
    when 'start' then room_node.call(start_room)
    when 'grant' then "grant_#{nid(BreakEscape::DeclaredGrants.identities(item).first)}"
    else room_node.call(room_id)
    end
    add_edge(from, node) if from && $nodes.key?(from)
    node
  end

  # Jacks: from their room and from each device; to their network. A jack with port
  # security (slice 9.3b, plan 4.4) refuses every device and gives no foothold, so it has
  # no edge to its network and its label says so.
  nm.jacks(scenario).each do |entry|
    jack = entry[:object]
    jack_id = jack['id'] || nid(jack['name'] || 'jack')
    secured = jack['portSecurity'] ? true : false # truthy, as the server reads it
    label = "#{jack['name'] || jack_id}<br/>Network jack"
    label += '<br/>(port security: refuses the device)' if secured
    node = add_node("jack_#{nid(jack_id)}", label, 'lock')
    from = room_node.call(entry[:room_id])
    add_edge(from, node) if from
    device_nodes.each { |d| add_edge(d, node) }
    next if secured

    add_edge(node, net_node.call(entry[:network])) if entry[:network] && NETWORKS.key?(entry[:network])
  end

  accounts = ai.room_npcs(scenario).select { |e| ai.account?(e[:npc]) }
  # The networks joined to a network by links, itself included, transitively. A signed-in
  # desktop maps an access-listed file share on any of them (NetworkAccess#mapped_shares walks
  # networks_reachable_from, no pivot or foothold needed). Outages are ignored, as on every
  # other edge.
  link_component = lambda do |net_id|
    seen = Set[net_id]
    frontier = [net_id]
    until frontier.empty?
      nm.linked_networks(scenario, frontier.shift).each { |other| frontier << other if seen.add?(other) }
    end
    seen
  end
  # The networks a foothold lands on (an open jack with a device to plant, an access point,
  # an implant usable at its PC), grown by the server's one-hop pivot walk (a session at a
  # sign-in host on a reached network crosses its links). Read from the model before any
  # edge is drawn: the share edges below need it, and the pivots further down are drawn from it.
  foothold_reach = Set.new
  nm.jacks(scenario).each do |e|
    foothold_reach << e[:network] if device_nodes.any? && NETWORKS.key?(e[:network]) && !e[:object]['portSecurity']
  end
  nm.wifi_aps(scenario).each { |e| foothold_reach << e[:network] }
  pcs_by_id = {}
  nm.room_objects(scenario).each { |e| pcs_by_id[e[:object]['id']] ||= e if nm.present_string?(e[:object]['id']) }
  nm.grant_foothold_actions(scenario).group_by { |a| a[:pc] }.each do |pc_id, acts|
    pc = pcs_by_id[pc_id]
    next unless pc && NETWORKS.key?(pc[:network])
    next if nm.headless?(pc[:object]) && acts.all? { |a| a[:shape] == 'session' }

    foothold_reach << pc[:network]
  end
  loop do
    grown = false
    foothold_reach.to_a.each do |net|
      next if nm.sign_in_objects_on(net, scenario).empty?

      nm.linked_networks(scenario, net).each { |linked| grown = true if foothold_reach.add?(linked) }
    end
    break unless grown
  end
  # A headless host has no screen: a session there (so its mapped shares) needs a remote
  # sign-in, and so a foothold that reaches its network and a policy that does not say
  # remote: 'blocked' (Game#attempt_login!, NetworkAccess#remote_blocked?, the policy found as
  # Game#effective_policy finds it). Without both it opens no share, on its own network or
  # across a link.
  policies_g = scenario['policies'].is_a?(Hash) ? scenario['policies'] : {}
  remote_blocked = lambda do |pc|
    name = nm.present_string?(pc['policy']) ? pc['policy'] : scenario['defaultPolicy']
    policy = name.is_a?(String) ? policies_g[name] : nil
    policy.is_a?(Hash) && policy['remote'] == 'blocked'
  end
  share_host = lambda do |h|
    !nm.headless?(h[:object]) || (foothold_reach.include?(h[:network]) && !remote_blocked.call(h[:object]))
  end
  NETWORKS.each_key do |net_id|
    hosts = nm.sign_in_objects_on(net_id, scenario)
    shares = nm.resources_on(net_id, scenario)
    next if hosts.empty? && shares.empty?

    network = net_node.call(net_id)
    hosts.each do |entry|
      lock = access_lock_node({ kind: 'login', lock: entry[:object], room: entry[:room_id] }, rooms)
      # A headless host is reached only over the network: drop its room's edge.
      $edges.reject! { |e| e[:to] == lock && e[:from] == entry[:room_id] } if nm.headless?(entry[:object])
      add_edge(network, lock, label: 'exposes')
    end
    shares.each do |res_id, res|
      kind = res['kind'].to_s.empty? ? 'resource' : res['kind'].tr('_', ' ')
      node = add_node("resource_#{nid(res_id)}", "#{res['name'] || res_id}<br/>(#{kind})", 'container')
      if res['access'].is_a?(Hash)
        # A file share a desktop maps is reached from a host on any linked network; any
        # other access-listed resource only from a host on its own network.
        mapped = res['kind'] == 'file_share' && !nm.listed_only_share?(res)
        signin_hosts = mapped ? link_component.call(net_id).flat_map { |n| nm.sign_in_objects_on(n, scenario) } : hosts
        signin_hosts = signin_hosts.select(&share_host)
        accounts.each do |a|
          next unless ai.acl_admits?(res['access'], a[:npc])

          admitting = signin_hosts.select { |h| ai.account_admitted?(h[:object], a[:npc]) }
          next if admitting.empty?

          signin = "signin_#{nid(a[:npc]['id'])}"
          next unless $nodes.key?(signin)

          if admitting.all? { |h| nm.headless?(h[:object]) }
            # Only remote sessions reach the share, so it hangs from each host's sign-in lock,
            # which the network (so the foothold) and the account both feed.
            admitting.each do |h|
              lock = access_lock_node({ kind: 'login', lock: h[:object], room: h[:room_id] }, rooms)
              add_edge(lock, node) unless $edges.any? { |e| e[:from] == lock && e[:to] == node }
            end
          else
            add_edge(signin, node)
          end
        end
      else
        add_edge(network, node, label: 'exposes')
      end
    end
  end

  # Slice 9.3b (docs/achitechture/ACCESS_MODEL_SLICE_9_3B_PLAN.md, 9.3), all read through
  # NetworkModel. The pivot follows the server's reach walk (NetworkAccess#reach_walk): a
  # foothold reaches only its own network; a session at a sign-in host on a network already
  # reached crosses that network's links one hop, to its directly linked networks.
  edge_once = lambda do |from, to, **opts|
    add_edge(from, to, **opts) unless $edges.any? { |e| e[:from] == from && e[:to] == to }
  end

  # Links: structure, not reach. One dashed, undirected line per link (soft in the JSON),
  # so following solid arrows never crosses a link from a bare foothold.
  nm.network_links(scenario).each do |a, b|
    add_edge(net_node.call(a), net_node.call(b), dashed: true, label: 'link', undirected: true)
  end

  npc_node_for = lambda do |room_id, npc|
    display = npc_text.call(npc['displayName'] || npc['name'], npc['id'])
    node = add_node("npc_#{nid(display)}", display, 'key')
    from = room_node.call(room_id)
    add_edge(from, node) if from && !$edges.any? { |e| e[:from] == from && e[:to] == node }
    node
  end
  npc_at_path = lambda do |path|
    m = path.to_s.match(%r{\Arooms/([^/\[]+)/npcs\[(\d+)\]})
    next nil unless m && rooms[m[1]].is_a?(Hash) && rooms[m[1]]['npcs'].is_a?(Array)

    npc = rooms[m[1]]['npcs'][m[2].to_i]
    npc.is_a?(Hash) ? npc_node_for.call(m[1], npc) : nil
  end
  # item id => [room id, npc] for items an NPC holds, at any depth (a note in a folder the
  # NPC holds is the NPC's too).
  npc_holder = {}
  index_held = lambda do |items, room_id, npc|
    Array(items).each do |item|
      next unless item.is_a?(Hash)

      npc_holder[item['id']] ||= [room_id, npc] if nm.present_string?(item['id'])
      index_held.call(item['contents'], room_id, npc)
    end
  end
  rooms.each do |room_id, room|
    next unless room.is_a?(Hash) && room['npcs'].is_a?(Array)

    room['npcs'].each do |npc|
      index_held.call(npc['itemsHeld'], room_id, npc) if npc.is_a?(Hash) && npc['itemsHeld'].is_a?(Array)
    end
  end
  # Where an object is found: behind its own lock, the innermost locked container above it
  # (at any depth, as the server's object_reachable? checks every one), or in its room.
  entries_by_path = nil
  object_from = lambda do |entry|
    entries_by_path ||= nm.room_objects(scenario).to_h { |e| [e[:path], e] }
    chain = [entry[:object]]
    path = entry[:path].to_s
    while (m = path.match(%r{\A(.+)/contents\[\d+\]\z}))
      path = m[1]
      above = entries_by_path[path]
      break unless above

      chain << above[:object]
    end
    chain << entry[:container] if chain.size == 1 && entry[:container] # an entry with no room path
    lock = chain.compact.find { |o| o['locked'] && $nodes.key?("lock_#{o['id']}") }
    lock ? "lock_#{lock['id']}" : room_node.call(entry[:room_id])
  end
  start_ids = Array(scenario['startItemsInInventory']).filter_map { |i| i['id'] if i.is_a?(Hash) }
  start_from = -> { room_node.call(start_room) } # called only when used, so no stray node

  # Wi-Fi: an access point is a lock-like node, from its room, with an edge to its network.
  # The network's key is a key node, fed by every text the player can read that holds it,
  # each hung where the player finds it (behind a container's lock, from the NPC who holds
  # it, from a PC's desktop, from the start room); a text heard or read with no place (ink,
  # a profile, social content) is a dashed edge from the start room. An open network (no
  # psk) needs no key. No label ever prints the key.
  wifi_texts = nil
  # The locked folders (any lock but a sign-in) between a share's or a desktop's top level and
  # a text inside it, outer first, as [[label, object]]; the label is the text walk's own
  # (Clues.walk_objects: the id, else the path). The server serves an item only once every
  # folder above it is open (NetworkAccess#resource_item_for_add, and so on a desktop).
  inner_locks = lambda do |list, base, target|
    found = nil
    walk = lambda do |items, path, locks|
      Array(items).each_with_index do |obj, i|
        next if found || !obj.is_a?(Hash)

        here = "#{path}[#{i}]"
        label = obj['id'].is_a?(String) && !obj['id'].empty? ? obj['id'] : here
        next found = locks if label == target

        walk.call(obj['contents'], "#{here}/contents", obj['locked'] && obj['lockType'] != 'login' ? locks + [[label, obj]] : locks)
      end
    end
    walk.call(list, base, [])
    found || []
  end
  # The lock node of each such folder, chained from the share or the PC sign-in.
  behind_locks = lambda do |from, chain|
    chain.each do |label, obj|
      node = $nodes.key?("lock_#{label}") ? "lock_#{label}" : "lock_#{nid(label)}"
      add_node(node, "#{safe_text.call(obj['name'], label.tr('_', ' '))}<br/>#{LOCK_TYPE_LABELS[obj['lockType']] || 'Lock'}", 'lock')
      edge_once.call(from, node)
      from = node
    end
    from
  end
  nm.wifi_aps(scenario).each do |entry|
    ap = entry[:object]
    ap_key = nm.present_string?(ap['id']) ? ap['id'] : entry[:path]
    node = add_node("wifiap_#{nid(ap_key)}", "#{safe_text.call(ap['name'], ap_key)}<br/>Wi-Fi access point", 'lock')
    from = object_from.call(entry)
    edge_once.call(from, node) if from
    edge_once.call(node, net_node.call(entry[:network]))
    wifi = nm.wifi_of(scenario, entry[:network])
    psk = wifi['psk']
    next unless nm.present_string?(psk)

    key = "wifikey_#{nid(entry[:network])}"
    unless $nodes.key?(key)
      net_name = safe_text.call(NETWORKS[entry[:network]]['name'], entry[:network])
      add_node(key, "Wi-Fi key<br/>(#{safe_text.call(wifi['ssid'], net_name)})", 'key')
      unless wifi_texts
        wifi_texts = BreakEscape::NpcHabits::Clues.readable_texts(scenario, File.dirname(SCENARIO_FILE))
        # A text file on a share is served to whoever reaches the share, so it is a source too
        # (readable_texts does not walk resources).
        nm.resources(scenario).each do |res_id, res|
          next unless nm.resource_contents?(res)

          BreakEscape::NpcHabits::Clues.walk_objects(res['contents'], "resources/#{res_id}/contents", [],
                                                     { resource: res_id.to_s }, wifi_texts)
        end
      end
      wifi_texts.select { |t| t[:text].include?(psk) }.uniq { |t| t[:path] }.each do |t|
        label = safe_text.call(t[:name], nm.present_string?(t[:object_id]) ? t[:object_id] : 'note')
        holder = t[:object_id] && npc_holder[t[:object_id]]
        scope = t[:scope].is_a?(Hash) ? t[:scope] : {}
        pc_id = scope[:pc]
        share = scope[:resource] && "resource_#{nid(scope[:resource])}"
        hang = ->(from) { add_node("clue_#{nid(t[:path])}", label, 'item').tap { |c| edge_once.call(from, c) } }
        npc = nil
        clue = nil
        if pc_id && $nodes.key?("lock_#{pc_id}")
          pc_entry = pcs_by_id[pc_id]
          chain = pc_entry ? inner_locks.call(pc_entry[:object]['contents'], "#{pc_entry[:path]}/contents", t[:path]) : []
          clue = hang.call(behind_locks.call("lock_#{pc_id}", chain))
        elsif share && $nodes.key?(share)
          res = nm.resources(scenario).to_h[scope[:resource]] || {}
          chain = inner_locks.call(res['contents'], "resources/#{scope[:resource]}/contents", t[:path])
          clue = hang.call(behind_locks.call(share, chain))
        elsif holder
          clue = hang.call(npc_node_for.call(*holder))
        elsif (npc = npc_at_path.call(t[:path]))
          clue = hang.call(npc)
        elsif t[:room]
          clue = clue_node_for.call(t, label)
        elsif (start_ids.include?(t[:object_id]) || t[:path].to_s.start_with?('startItemsInInventory')) && start_from.call
          clue = hang.call(start_from.call)
        end
        if clue
          edge_once.call(clue, key)
        elsif start_from.call
          edge_once.call(start_from.call, key, dashed: true, label: 'heard or read elsewhere')
        end
      end
    end
    edge_once.call(key, node)
  end

  # Implants: one node per PC (the server keeps one implant_<pcId> foothold), from where its
  # action runs (the host prop's room or lock, a timer, an NPC), from the device (held or
  # dropped, found as the server finds it: id, then type, then name), from the PC's sign-in
  # for the session shape, and to the PC's network.
  implants = nm.grant_foothold_actions(scenario)
  if implants.any?
    room_entries = nm.room_objects(scenario)
    objects_by_id = room_entries.each_with_object({}) { |e, h| h[e[:object]['id']] ||= e if nm.present_string?(e[:object]['id']) }
    homes = nil
    build_homes = lambda do
      list = room_entries.map { |e| { item: e[:object], from: -> { object_from.call(e) } } }
      Array(scenario['startItemsInInventory']).each { |i| list << { item: i, from: start_from } if i.is_a?(Hash) }
      npc_holder.each_value.to_a.uniq.each do |room_id, npc|
        npc['itemsHeld'].each { |i| list << { item: i, from: -> { npc_node_for.call(room_id, npc) } } if i.is_a?(Hash) }
      end
      DECLARED_GRANTS.each do |g|
        grant_node = "grant_#{nid(BreakEscape::DeclaredGrants.identities(g['item']).first)}"
        list << { item: g['item'], from: -> { $nodes.key?(grant_node) ? grant_node : nil } } if g['item'].is_a?(Hash)
      end
      list
    end
    device_node_for = lambda do |needs|
      next nil unless nm.present_string?(needs)

      homes ||= build_homes.call
      home = %w[id type name].lazy.map { |k| homes.find { |h| h[:item][k].to_s == needs } }.find(&:itself)
      item = home ? home[:item] : {}
      node = "device_#{nid(nm.present_string?(item['id']) ? item['id'] : needs)}"
      next node if $nodes.key?(node)

      add_node(node, "#{safe_text.call(item['name'], needs)}<br/>(implant device)", 'key')
      from = home && home[:from].call
      add_edge(from, node) if from
      node
    end
    host_from = lambda do |act|
      path = act[:path].to_s
      host = room_entries.select { |e| path.start_with?("#{e[:path]}/") }.max_by { |e| e[:path].length }
      if host
        [object_from.call(host), { label: "at #{safe_text.call(host[:object]['name'], host[:object]['id'] || 'prop')}" }]
      elsif (m = path.match(/\Atimers\[(\d+)\]/))
        timer = Array(scenario['timers'])[m[1].to_i]
        trigger = timer.is_a?(Hash) ? (timer['startOnGlobal'] || timer['id']) : nil
        [start_from.call, { dashed: true, label: nm.present_string?(trigger) ? "timer: #{trigger}" : 'timer' }]
      elsif (npc = npc_at_path.call(path))
        [npc, { label: 'NPC beat' }]
      else
        [start_from.call, { dashed: true }]
      end
    end
    implants.group_by { |a| a[:pc] }.each do |pc_id, acts|
      pc = objects_by_id[pc_id]
      next unless pc

      names = acts.map { |a| safe_text.call(a[:name], '') }.reject(&:empty?).uniq
      headless = nm.headless?(pc[:object])
      label = "#{names.any? ? names.join(' / ') : "Implant: #{pc_id}"}<br/>(implant)"
      label += '<br/>(unusable: headless)' if headless && acts.all? { |a| a[:shape] == 'session' }
      node = add_node("implant_#{nid(pc_id)}", label, 'lock')
      acts.each do |act|
        from, opts = host_from.call(act)
        edge_once.call(from, node, **opts) if from
        if act[:shape] == 'session'
          device = device_node_for.call(act[:needs_held])
          edge_once.call(device, node, label: 'held') if device
          if nm.sign_in_object?(pc[:object]) && !headless
            edge_once.call(access_lock_node({ kind: 'login', lock: pc[:object], room: pc[:room_id] }, rooms), node,
                           label: 'session at PC')
          end
        else
          device = device_node_for.call(act[:needs_dropped])
          edge_once.call(device, node, label: 'dropped') if device
        end
      end
      next unless NETWORKS.key?(pc[:network])

      edge_once.call(node, net_node.call(pc[:network]))
    end
  end

  # Pivots: an AND gate per sign-in host, fed by the host's network (reached) and the host's
  # sign-in lock (a session held there), with a `pivot` edge to each directly linked network.
  # Drawn only for hosts on networks a foothold can reach, by the same one-hop walk
  # (foothold_reach, above).
  foothold_reach.to_a.sort_by(&:to_s).each do |net_id|
    linked = nm.linked_networks(scenario, net_id)
    next if linked.empty?

    nm.sign_in_objects_on(net_id, scenario).each do |entry|
      lock = access_lock_node({ kind: 'login', lock: entry[:object], room: entry[:room_id] }, rooms)
      host_key = nm.present_string?(entry[:object]['id']) ? entry[:object]['id'] : entry[:path]
      gate = add_node("pivot_#{nid(host_key)}", '+', 'gate')
      edge_once.call(net_node.call(net_id), gate)
      edge_once.call(lock, gate)
      linked.each { |other| edge_once.call(gate, net_node.call(other), label: 'pivot') }
    end
  end
end

# ---------------------------------------------------------------------------
# Workarounds (ACCESS_MODEL_SLICE_9_2_PLAN.md, section 10). Each workaround is an action node
# ("Jake: writes it down, at 50") with an edge to what it opens: the account's sign-in node
# for writes_down and share_login, the PC for borrow_session, the door for prop_door. An
# outage global (a resource's downIf in the NPC's work list, or its station's offWhen) is a
# gate node with an edge to each workaround of each NPC it can frustrate, so a chain reads
# outage, person and workaround, then the thing opened. Read through BreakEscape::AccessWork,
# the server's resolver.
# ---------------------------------------------------------------------------
WORKAROUND_VERBS = {
  'writes_down' => 'writes it down', 'prop_door' => 'props the door', 'emit' => 'gives up',
  'borrow_session' => 'uses the hot desk', 'share_login' => 'says the login out loud'
}.freeze
aw_g = BreakEscape::AccessWork
aw_g.with_index(scenario) do
  BreakEscape::AccessIdentities.room_npcs(scenario).each do |entry|
    npc = entry[:npc]
    list = aw_g.workarounds(scenario, npc)
    next if list.empty?

    name = npc['displayName'] || npc['id']
    outages = []
    res = aw_g.resources(scenario)
    if aw_g.need?(npc, 'work')
      aw_g.work_list(scenario, npc).each do |rid|
        dn = res.dig(rid, 'downIf')
        outages << dn if aw_g.present_string?(dn)
      end
    end
    st = aw_g.station(scenario, npc)
    off = st ? aw_g.affordance(scenario, st)&.dig('offWhen') : nil
    outages << off if off.is_a?(String) && !off.empty?
    outages.concat(off.keys.map(&:to_s)) if off.is_a?(Hash)

    list.each_with_index do |w, i|
      verb = WORKAROUND_VERBS[w['do']] || w['do'].to_s
      verb = "#{verb} (#{w['event']})" if w['do'] == 'emit' && w['event']
      node = add_node("workaround_#{nid(npc['id'])}_#{i}", "#{name}: #{verb}, at #{w['at']}", 'action')
      outages.uniq.each do |g|
        add_edge(add_node("outage_#{nid(g)}", "#{g}<br/>(outage)", 'gate'), node)
      end
      case w['do']
      when 'writes_down', 'share_login'
        next unless BreakEscape::AccessIdentities.account?(npc)

        signin = "signin_#{nid(npc['id'])}"
        unless $nodes.key?(signin)
          add_node(signin, "#{name} sign-in<br/>(#{npc['creds']['username']})", 'key')
          add_node(entry[:room], room_label(entry[:room], rooms[entry[:room]] || {}), 'room')
          add_edge(entry[:room], signin)
        end
        label = w['do'] == 'writes_down' ? 'sticky note' : "said to #{w['with']}"
        add_edge(node, signin, label: label)
      when 'borrow_session'
        pc = aw_g.object_index(scenario)[w['pc']]
        add_edge(node, access_lock_node({ kind: 'login', lock: pc[:obj], room: pc[:room_id] }, rooms), label: 'open session') if pc
      when 'prop_door'
        door = w['door']
        if $nodes.key?("door_#{door}")
          add_edge(node, "door_#{door}", label: 'propped open')
        else
          warn "dungeon graph: #{hide_id(node)} props open '#{scrub_label(door)}', which has no door node; edge left out"
        end
      end
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

(scenario['objectives'] || []).each_with_index do |aim, idx|
  aid = "aim_#{nid(aim['aimId'])}"
  tasks = aim['tasks'] || []
  aim_nodes[aid] = {
    label:    aim['title'],
    klass:    'aim',
    optional: aim['optional'] == true,
    order:    aim['order'] || 0,
    idx:      idx,
    bonus:    aim['optional'] == true || (tasks.any? && tasks.all? { |t| t['optional'] })
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
# Story gates: aims held back by unlockCondition.globalVariable, and aims
# opened by an NPC eventMapping's unlockAim. Each one is traced back to what
# sets the global (a task's onComplete.setGlobal, an eventMapping's setGlobal,
# an ink #set_global tag or `~ g = ...` on a synced VAR, an object's setGlobal)
# and through that setter's trigger (objective_task_completed:<task>,
# objective_aim_completed:<aim>, global_variable_changed:<g>, the scene that
# opens a conversation_closed:<npc>, positive globalVars tests in its
# condition) until it reaches an aim. The edge runs from that aim to the
# gated aim, labelled with the global. A setter that reaches no aim (a talk
# the player starts, a room entry) gets an action node of its own.
# ---------------------------------------------------------------------------
module StoryGates
  module_function

  # [{ npc:, mapping: }] for every NPC eventMapping in the scenario
  def mappings(scenario)
    npcs = (scenario['npcs'] || []) + (scenario['rooms'] || {}).values.flat_map { |r| r['npcs'] || [] }
    npcs.flat_map { |n| (n['eventMappings'] || []).map { |m| { npc: n, mapping: m } } }
  end

  def npcs_by_id(scenario)
    ((scenario['npcs'] || []) + (scenario['rooms'] || {}).values.flat_map { |r| r['npcs'] || [] }).to_h { |n| [n['id'], n] }
  end

  # Globals an ink file sets: #set_global:<g>:<v> tags, and ~ g = <v> on a VAR named like a scenario global
  def ink_setters(ink_text, globals)
    set = Set.new
    ink_text.scan(/#\s*set_global\s*:\s*(\w+)\s*:\s*(\S+)/) { |g, v| set << g unless %w[false 0 ""].include?(v) }
    ink_text.scan(/^\s*~\s*(\w+)\s*=\s*([^\n]+)/) do |g, v|
      set << g if globals.key?(g) && v.strip !~ /\A(?:false|0|""|'')\s*(?:\/\/.*)?\z/
    end
    set
  end

  # Globals a condition string needs to be set (positive tests only: === true / === 'x' / === n)
  def positive_condition_globals(cond)
    return [] unless cond.is_a?(String)
    cond.scan(/globalVars\.(\w+)\s*===?\s*(true|'[^']+'|"[^"]+"|[1-9]\d*)/).map(&:first).uniq
  end
end

story_gate_setters = Hash.new { |h, k| h[k] = [] }  # global => [setter ref]
task_aim = {}
(scenario['objectives'] || []).each do |aim|
  (aim['tasks'] || []).each do |task|
    task_aim[task['taskId']] = aim['aimId'] if task['taskId']
    (task.dig('onComplete', 'setGlobal') || {}).each do |g, v|
      story_gate_setters[g] << { kind: :aim, aim: aim['aimId'] } if v
    end
  end
end
all_mappings = StoryGates.mappings(scenario)
all_mappings.each do |e|
  (e[:mapping]['setGlobal'] || {}).each do |g, v|
    story_gate_setters[g] << { kind: :mapping, npc: e[:npc], mapping: e[:mapping] } if v && v != ''
  end
end
npc_index = StoryGates.npcs_by_id(scenario)
globals   = scenario['globalVariables'] || {}
ink_dir   = File.join(File.dirname(SCENARIO_FILE), 'ink')
npc_index.each_value do |npc|
  next unless npc['storyPath']
  ink_path = File.join(ink_dir, File.basename(npc['storyPath'].to_s).sub(/\.json\z/, '.ink'))
  next unless File.exist?(ink_path)
  StoryGates.ink_setters(File.read(ink_path, encoding: 'UTF-8'), globals).each do |g|
    story_gate_setters[g] << { kind: :talk, npc: npc }
  end
end
walk_obj_setters = lambda do |objs, room_id|
  (objs || []).each do |o|
    found = []
    scan = lambda do |x|
      case x
      when Hash
        (x['setGlobal'].is_a?(Hash) ? x['setGlobal'] : {}).each { |g, v| found << g if v && v != '' }
        x.each { |k, v| scan.call(v) unless k == 'contents' }
      when Array then x.each { |v| scan.call(v) }
      end
    end
    scan.call(o)
    found.uniq.each { |g| story_gate_setters[g] << { kind: :object, object: o, room: room_id } }
    walk_obj_setters.call(o['contents'], room_id)
  end
end
rooms.each { |rid, r| walk_obj_setters.call(r['objects'], rid) }

# Resolve a setter, an event pattern or a conversation to the aims it follows.
# Returns [[aim_ids], [root event labels]].
story_gate_resolve = nil
resolve_pattern = lambda do |pattern, condition, npc, depth, seen|
  aims, roots = [], []
  kind, arg = pattern.to_s.split(':', 2)
  return [[], []] if kind == 'game_loaded' # a reload backstop re-applies a gate; it doesn't open it
  case kind
  when 'objective_task_completed' then aims << task_aim[arg] if task_aim[arg]
  when 'objective_aim_completed'  then aims << arg
  when 'global_variable_changed'
    (story_gate_setters[arg] || []).each do |s|
      a, r = story_gate_resolve.call(s, depth + 1, seen)
      aims.concat(a); roots.concat(r)
    end
  when 'conversation_closed'
    target = npc_index[arg]
    if target
      a, r = story_gate_resolve.call({ kind: :talk, npc: target }, depth + 1, seen)
      aims.concat(a); roots.concat(r)
    end
  when 'room_entered'
    roots << "Enter #{room_label(arg, rooms[arg] || {})}"
  when '', nil
    nil
  else
    who  = npc_index[arg] && (npc_index[arg]['displayName'] || arg)
    verb = { 'npc_ko' => 'Knock out', 'item_picked_up' => 'Pick up', 'object_interacted' => 'Use',
             'card_cloned' => 'Clone card', 'npc_attacked' => 'Attack', 'fingerprint_collected' => 'Lift print',
             'fingerprint_identified' => 'Identify print', 'door_unlocked' => 'Unlock' }[kind]
    roots << (verb ? [verb, who || arg.to_s.tr('_', ' ')].join(' ').strip : pattern.to_s.tr('_:', '  ').strip)
  end
  StoryGates.positive_condition_globals(condition).each do |g|
    (story_gate_setters[g] || []).each do |s|
      a, = story_gate_resolve.call(s, depth + 1, seen)
      aims.concat(a)
    end
  end
  [aims.compact.uniq, roots.uniq]
end
story_gate_resolve = lambda do |setter, depth, seen|
  key = [setter[:kind], setter[:aim], setter[:npc]&.dig('id'), setter[:mapping]&.object_id, setter[:object]&.object_id]
  return [[], []] if depth > 6 || seen.include?(key)
  seen = seen | [key]
  case setter[:kind]
  when :aim then [[setter[:aim]], []]
  when :mapping
    resolve_pattern.call(setter[:mapping]['eventPattern'], setter[:mapping]['condition'], setter[:npc], depth, seen)
  when :talk
    # a scene the engine opens itself (a mapping that starts its conversation) follows that mapping's trigger;
    # otherwise the player starts it
    npc = setter[:npc]
    openers = (npc['eventMappings'] || []).select { |m| m['conversationMode'] || m['targetKnot'] }
    if openers.empty?
      [[], ["Talk to #{npc['displayName'] || npc['id']}"]]
    else
      aims, roots = [], []
      openers.each do |m|
        a, r = resolve_pattern.call(m['eventPattern'], m['condition'], npc, depth, seen)
        aims.concat(a); roots.concat(r)
      end
      [aims.uniq, roots.uniq]
    end
  when :object
    o = setter[:object]
    [[], ["Use #{o['name'] || o['id']}"]]
  else [[], []]
  end
end

aim_reaches = lambda do |from, to|
  stack, seen = [from], Set.new
  until stack.empty?
    n = stack.pop
    return true if n == to
    next if seen.include?(n)
    seen << n
    aim_edges.each { |e| stack << e[:to] if e[:from] == n }
  end
  false
end
add_story_gate_edge = lambda do |from, to, label|
  return if from == to || !aim_nodes.key?(from) || !aim_nodes.key?(to)
  existing = aim_edges.find { |e| e[:from] == from && e[:to] == to }
  if existing
    existing[:gates] << label if existing[:story_gate]
    return
  end
  return if aim_reaches.call(to, from)  # would close a cycle
  aim_edges << { from: from, to: to, dashed: true, story_gate: true, gates: [label] }
  aim_edge_set << "#{from}|#{to}"
end
story_gate_count = 0
story_gate_roots = []  # [root label, aim node, label]: drawn only for aims nothing else leads to
link_gate = lambda do |aims, roots, to_aid, label|
  aims.each { |a| add_story_gate_edge.call("aim_#{nid(a)}", to_aid, label) }
  roots.each { |r| story_gate_roots << [r, to_aid, label] } if aims.empty?
end

(scenario['objectives'] || []).each do |aim|
  g = aim.dig('unlockCondition', 'globalVariable')
  next unless g
  aid = "aim_#{nid(aim['aimId'])}"
  story_gate_count += 1
  aims, roots = [], []
  (story_gate_setters[g] || []).each do |s|
    a, r = story_gate_resolve.call(s, 0, [])
    aims.concat(a); roots.concat(r)
  end
  link_gate.call(aims.uniq - [aim['aimId']], roots.uniq, aid, g)
end
all_mappings.each do |e|
  next unless (ua = e[:mapping]['unlockAim'])
  aims, roots = resolve_pattern.call(e[:mapping]['eventPattern'], e[:mapping]['condition'], e[:npc], 0, [])
  Array(ua).each do |target|
    next unless aim_nodes.key?("aim_#{nid(target)}")
    link_gate.call(aims - [target], roots, "aim_#{nid(target)}", 'unlockAim')
  end
end

story_gate_roots.each do |r, to_aid, label|
  next if aim_edges.any? { |e| e[:to] == to_aid && !e[:root] }
  rid = "story_#{nid(r)}"
  aim_nodes[rid] ||= { label: r, klass: 'action', optional: false }
  add_story_gate_edge.call(rid, to_aid, label)
  aim_edges.last[:root] = true if aim_edges.last && aim_edges.last[:from] == rid
end

# Label each story-gate edge with its globals (just "unlockAim" when a mapping opens the aim directly),
# then drop a story-gate edge u->v when another path already leads from u to v (transitive reduction),
# so an aim gated on a late global isn't also drawn from every aim before it.
aim_edges.select { |e| e[:story_gate] }.each do |e|
  named = e[:gates].uniq - ['unlockAim']
  e[:label] = named.empty? ? 'unlockAim' : named.join(', ')
end
aim_edges.select { |e| e[:story_gate] }.each do |e|
  others = aim_edges.reject { |x| x.equal?(e) }
  stack  = others.select { |x| x[:from] == e[:from] }.map { |x| x[:to] }
  seen   = Set.new
  redundant = false
  until stack.empty?
    n = stack.pop
    next if seen.include?(n)
    seen << n
    if n == e[:to] then redundant = true; break; end
    others.each { |x| stack << x[:to] if x[:from] == n }
  end
  if redundant
    aim_edges.delete_if { |x| x.equal?(e) }
    aim_edge_set.delete("#{e[:from]}|#{e[:to]}")
  end
end
aim_edges.each { |e| e.delete(:gates); e.delete(:story_gate); e.delete(:root) }

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

  # The sink is the furthest aim (the first one found on a tie); bonus aims (every task optional) and
  # story-gate action nodes only when nothing else is reachable.
  sink = if nodes.key?('aim_close_the_case')
           'aim_close_the_case'
  else
           main = dist.keys.select { |id| nodes.dig(id, :klass) != 'action' && !nodes.dig(id, :bonus) }
           pool = main.any? ? main : dist.keys
           pool.max_by { |id| dist[id] }
  end
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
# Every label passes through scrub_label and every id through hide_id here, so no diagram
# prints a Wi-Fi key; the skeleton (skeleton_mermaid) is drawn with hide: false.
def emit_mermaid_diagram(nodes, edges, critical_set: Set.new, start_node: nil, hide: true)
  hid = hide ? method(:hide_id) : ->(id) { id }
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
    lines << "  node_start --> #{hid.call(start_node)}"
    lines << ''
  end

  nodes.each do |id, n|
    lbl   = scrub_label(n[:label].to_s).gsub('"', "'")
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
    lines << "  #{hid.call(id)}#{shape}"
  end
  lines << ''

  edges.each do |e|
    arr  = e[:dashed] ? '-.->' : '-->'
    arr  = e[:dashed] ? '-.-' : '---' if e[:undirected]
    elbl = e[:label] ? "|#{scrub_label(e[:label].to_s)}|" : ''
    lines << "  #{hid.call(e[:from])} #{arr}#{elbl} #{hid.call(e[:to])}"
  end
  lines << ''

  effective = nodes.to_h { |id, n| [id, critical_set.include?(id) ? 'critical' : n[:klass].to_s] }
  effective.group_by { |_, k| k }.each do |klass, grp|
    lines << "  class #{grp.map { |id, _| hid.call(id) }.join(',')} #{klass}"
  end

  opt_ids = nodes.reject { |id, _| critical_set.include?(id) }.select { |_, n| n[:optional] }.keys
  unless opt_ids.empty?
    lines << ''
    lines << '  classDef optional stroke-dasharray:5 2'
    lines << "  class #{opt_ids.map { |id| hid.call(id) }.join(',')} optional"
  end

  lines << '  class node_start start' if start_node

  lines.join("\n")
end

# Skeleton ids use the hidden-id prefix and skip any number that would hold a key form, so the
# skeleton holds no text the real page lacks (a counter n1 would hide a key 'n1').
def skeleton_counter
  ids = {}
  n = -1
  lambda do |id|
    ids[id] ||= begin
      n += 1
      n += 1 until key_free?("#{WIFI_ID_TOKEN}_#{n}") || n > 1_000_000
      "#{WIFI_ID_TOKEN}_#{n}"
    end
  end
end

# The same diagram with every authored string blanked: each id a counter, each label empty
# (the start room's too). Its text is the generator's own (shapes, classes, arrows), for
# check_wifi_key_free.
def skeleton_mermaid(nodes, edges, critical_set: Set.new, start_node: nil)
  idx = skeleton_counter
  sk_nodes = nodes.to_h { |id, n| [idx.call(id), n.merge(label: '')] }
  sk_nodes[idx.call(start_node)] ||= { label: '', klass: 'room', optional: false } if start_node
  sk_edges = edges.map { |e| e.merge(from: idx.call(e[:from]), to: idx.call(e[:to]), label: e[:label] && '') }
  emit_mermaid_diagram(sk_nodes, sk_edges, critical_set: Set.new(critical_set.map { |c| idx.call(c) }),
                                           start_node: start_node && idx.call(start_node), hide: false)
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
    # A name holding a Wi-Fi key (slice 9.3b) is shown by its id, so the key never prints.
    obj_name     = raw_id.to_s if wifi_key_in?(obj_name)
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

DECLARED_GRANTS.each do |grant|
  item = grant['item']
  $rc_counter += 1
  raw_id  = BreakEscape::DeclaredGrants.identities(item).first
  node_id = "rc_grant_#{nid(raw_id)}_#{$rc_counter}"
  has_contents = item['contents'].is_a?(Array) && item['contents'].any?
  rc_nodes[node_id] = { label: "#{item['name'] || raw_id}<br/>(granted)", klass: has_contents ? 'container' : 'item', optional: false }
  src_room = grant_source_room(grant, scenario, start_room)
  rc_edges << { from: src_room, to: node_id, dashed: true } if src_room && rc_nodes.key?(src_room)
  walk_room_contents(item['contents'], node_id, rc_nodes, rc_edges, rc_edge_set) if has_contents
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
  scrub_label((aim_nodes[id] || {})[:label] || id.sub(/\Aaim_andgate_/, '+ ').sub(/\Aaim_/, '').tr('_', ' ').split.map(&:capitalize).join(' '))
}.join(' → ')

# ---------------------------------------------------------------------------
# HTML wrapper — 3 tabs (Puzzle / Story Aims / Story + Puzzle) + stats panel
# ---------------------------------------------------------------------------
# Network edge notes (slice 9.3b), only for graphs that use links, pivots or implants, so every
# other graph keeps its legend byte for byte.
net_labels = $edges.map { |e| e[:label] }.to_set
net_notes = []
net_notes << '<code>-.-</code> link: two networks joined; crossed by a pivot, or by a signed-in desktop mapping an access-listed share' if $edges.any? { |e| e[:undirected] }
net_notes << '<b>+</b> then <code>pivot</code>: the network reached and a session at that host open the linked network' if net_labels.include?('pivot')
if (net_labels & Set['held', 'dropped', 'session at PC']).any?
  net_notes << '<code>held</code> / <code>dropped</code> / <code>session at PC</code>: what an implant needs'
end
net_legend_html = net_notes.map { |n| %(\n          <div class="edge-row">#{n}</div>) }.join
net_legend_md = net_notes.map { |n| "\n  Network edges: #{n.gsub(%r{</?code>}, '`').gsub(%r{</?b>}, '')}." }.join
# Scrubbed before the subtitle cuts it, so the cut never leaves part of a key.
brief_full = scrub_label((scenario['scenario_brief'] || SCENARIO_ID).to_s)
brief = brief_full.length <= 160 ? brief_full : brief_full[0, 160].sub(/\s+\S*\z/, '') + '…'
title_id = scrub_label(SCENARIO_ID)
json_scenario_name = scrub_label(File.basename(File.dirname(SCENARIO_FILE)))
# One legend line, only when something was hidden or scrubbed, so every other graph keeps its
# legend byte for byte.
if $hidden_ids.any? || $scrub_hits
  hidden_note = "<code>#{WIFI_KEY_TOKEN}</code> in a label, and an id <code>#{WIFI_ID_TOKEN}_&lt;n&gt;</code> " \
                '(marked "hidden": true in dungeon_graph.json), stand in for authored text that held a Wi-Fi key. ' \
                'Rename the id or text in the scenario to see it here.'
  net_legend_html += %(\n          <div class="edge-row">#{hidden_note}</div>)
  net_legend_md += "\n  Hidden: #{hidden_note.gsub(%r{</?code>}, '`').gsub('&lt;', '<').gsub('&gt;', '>')}"
end
# The pages are built twice: with the content, and as the skeleton (every authored string
# blanked) that check_wifi_key_free compares each output against.
skeletons = {
  mermaid_puzzle: skeleton_mermaid($nodes, $edges, start_node: start_room),
  mermaid_story: skeleton_mermaid(aim_nodes, aim_edges, critical_set: critical_set),
  mermaid_integrated: skeleton_mermaid(int_nodes, int_edges, critical_set: critical_set, start_node: start_room),
  mermaid_rooms: skeleton_mermaid(rooms_nodes, rooms_edges, start_node: start_room),
  mermaid_contents: skeleton_mermaid(rc_nodes, rc_edges, start_node: start_room)
}
render_html = lambda do |title_id, brief, path_labels, mermaid_puzzle, mermaid_story, mermaid_integrated, mermaid_rooms, mermaid_contents|
  <<~HTML
  <!-- Auto-generated by scripts/generate_dungeon_graph.rb — do not edit by hand -->
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>#{title_id} — Dungeon Graph</title>
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
    <h1>#{title_id} — dependency graph</h1>
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
          <div class="edge-row"><span class="edge-opt"></span> Optional path</div>#{net_legend_html}
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
end
html = render_html.call(title_id, brief, path_labels, mermaid_puzzle, mermaid_story, mermaid_integrated, mermaid_rooms, mermaid_contents)
html_skeleton = render_html.call('', '', '', *skeletons.values)

# ---------------------------------------------------------------------------
# Companion Markdown — AI-readable graph reference
# Each diagram is a labelled fenced mermaid block with prose context so an
# AI agent can load this single file and reason about the scenario structure.
# ---------------------------------------------------------------------------
render_md = lambda do |title_id, brief_full, path_labels, mermaid_puzzle, mermaid_story, mermaid_integrated, mermaid_rooms, mermaid_contents|
  <<~MD
  <!-- Auto-generated by scripts/generate_dungeon_graph.rb — do not edit by hand -->

  # #{title_id} — Scenario Graph Reference

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

  Edges: `-->` solid = hard dependency; `-.->` dashed = soft / narrative dependency or optional path.#{net_legend_md}

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
end
md = render_md.call(title_id, brief_full, path_labels, mermaid_puzzle, mermaid_story, mermaid_integrated, mermaid_rooms, mermaid_contents)
md_skeleton = render_md.call('', '', '', *skeletons.values)

# Machine-readable puzzle graph, for tooling that needs the dependency order
# rather than a picture of it — notably the playtest harness, which uses it to
# check that a flag or lock is only reached after its prerequisites are held.
# Ids pass through hide_id and labels through scrub_label, as in the diagrams; the skeleton
# blanks both (every id a counter, every label empty).
render_json = lambda do |scenario_name, start_id, id_of, label_of|
  JSON.pretty_generate(
    'scenario' => scenario_name,
    'start_room' => start_id,
    'nodes' => $nodes.map do |id, n|
      { 'id' => id_of.call(id), 'label' => label_of.call(n[:label]), 'kind' => n[:klass], 'optional' => n[:optional],
        'hidden' => (true if hidden_id?(id)) }.compact
    end,
    'edges' => $edges.map do |e|
      { 'from' => id_of.call(e[:from]), 'to' => id_of.call(e[:to]), 'soft' => e[:dashed],
        'label' => e[:label] && label_of.call(e[:label]), 'undirected' => e[:undirected] }.compact
    end
  )
end
json = render_json.call(json_scenario_name, hide_id(scenario['startRoom']),
                        method(:hide_id), ->(l) { scrub_label(l.to_s) })
json_skeleton = render_json.call('', scenario['startRoom'] && '', skeleton_counter, ->(_) { '' })

check_wifi_key_free(OUT_FILE => [html, html_skeleton], MD_FILE => [md, md_skeleton], JSON_FILE => [json, json_skeleton])
File.write(OUT_FILE, html)
puts "Written: #{scrub_label(OUT_FILE)}"
File.write(MD_FILE, md)
File.write(JSON_FILE, json)
puts "Written: #{scrub_label(JSON_FILE)}"
puts "Written: #{scrub_label(MD_FILE)}"
puts "Puzzle     — Nodes: #{$nodes.size}  Edges: #{$edges.size}"
puts "Story      — Nodes: #{aim_nodes.size}  Edges: #{aim_edges.size}"
puts "Integrated — Nodes: #{int_nodes.size}  Edges: #{int_edges.size}"
puts "Rooms      — Nodes: #{rooms_nodes.size}  Edges: #{rooms_edges.size}"
puts "Contents   — Nodes: #{rc_nodes.size}  Edges: #{rc_edges.size}"
puts "Critical path (#{critical_length} hops): #{path_labels}"
