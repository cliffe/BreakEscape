# frozen_string_literal: true

# Office-life validator checks (OFFICE_LIFE_MISSIONS_PLAN section 4). Office-life checks live here,
# apart from the readers in validate_npc_needs.rb, validate_access_work.rb and validate_scenario.rb.
#
#   V1  office_summary(json)            one line per NPC, sorted by id so it diffs (--office-summary)
#   V2  story NPC whose needs can take it out of its room     warning, campaign only
#   V3  npc_arrived:<id> mapping on an NPC that has needs      warning
#   V4  needs NPC in a scenario without disableAttacks         warning (info once E1 passes), campaign only
#   V5  required content triggered only by office life         error, campaign only
#   V7  chatter line repeating a pool line, a bark or the opener   warning
#   V8  sync budget (section 7)          sync_budget_lines(json) info; warning above a cap
#   V10 pools, exchanges and calls nothing can trigger (build/ol-sims; slot marked in check below)
#
# V6 is the rake task app:break_escape:tts:office_lines (BreakEscape::TtsOfficeLines) and V9 is
# scripts/lock_key_diff.rb; neither lives here.
#
# Entry point: ValidateOfficeLife.check(json, scenario_id:, campaign:) returns issue strings
# ("❌ ERROR ..." / "⚠️ WARNING ..."). It reads owner, habit and affordance keys by their format 3
# names only (the retired-key check rejects old names); a format step that renames one edits this
# file in the same commit.
require 'json'
require 'set'
require_relative 'validate_npc_needs'
require_relative '../lib/break_escape/access_work'

module ValidateOfficeLife
  VN = ValidateNpcNeeds
  AW = BreakEscape::AccessWork
  REPO_ROOT = File.expand_path('..', __dir__)

  # The ten campaign missions V2, V4 and V5 protect. m09 and m10 get analysis only, but are in scope.
  # validate_scenario.rb --campaign adds the scenario being checked for one run (fixture tests).
  CAMPAIGN_MISSIONS = %w[
    m01_first_contact m02_ransomed_trust m03_ghost_in_the_machine m04_critical_failure
    m05_insider_trading m06_follow_the_money m07_architects_gambit m08_the_mole
    m09_digital_archaeology m10_full_disclosure
  ].freeze

  # V4: becomes an info line once the E1 attack probe has passed (plan section 9).
  E1_PROBE_PASSED = false

  # ── V5: office-life event names ─────────────────────────────────────────────────────────────
  # Derived from the engine's emit sites under public/break_escape/js/ (plan section 4). An entry
  # ending in `_` matches any name that starts with it; any other entry matches the name exactly,
  # alone or followed by `:`. test/js/validator-office-life-events.test.mjs collects every literal
  # with an office-life stem from the engine and fails on one that is on no list below, and on an
  # entry no literal matches.
  OFFICE_LIFE_EVENT_PREFIXES = %w[
    npc_print_ npc_need_ npc_visit_ npc_usb_ npc_use_ npc_borrow_ workstation_ desk_phone_ magnet_ room_tone_
    npc_action_windup npc_announced npc_avoided npc_borrowed_session npc_call_heard npc_caught_at_post
    npc_chatted npc_checked npc_exchange_heard npc_fetching_chair npc_frustration_changed npc_guest_left
    npc_job_failed npc_left_item_gone npc_left_post npc_locked_out npc_mutter npc_needs_leashed
    npc_overheard npc_overheard_login npc_picked_up npc_placed npc_posted npc_reacted npc_queued
    npc_returned_post npc_sat npc_sat_at npc_saw_magnet npc_stood npc_swivelled npc_told npc_turned_back
    npc_used npc_used_phone npc_workaround npc_workaround_due object_revealed door_propped item_dropped
  ].freeze

  # Literals with an office-life stem that are events but not office life (combat, KO, story,
  # conversation, inventory, scripted patrol), so never a V5 trigger.
  OFFICE_LIFE_EVENT_EXCLUSIONS = %w[
    npc_ko npc_attacked npc_became_hostile npc_hostile_changed npc_hostile_state_changed
    npc_influence_changed npc_items_changed npc_reported npc_arrived npc_used_object npc_used_object_done
    item_picked_up item_unlocked item_consumed item_removed_from_scene
  ].freeze

  # Literals with an office-life stem that are not event names (ink variables and functions, object
  # types and id prefixes, storage keys, an error message, labels, sound keys, a job-abort reason).
  OFFICE_LIFE_EVENT_IGNORE = [
    'npc_name', 'npc_location', 'npc_inventory', 'npc_container_', 'npc_gift_', 'npc_story_state_',
    'npc_frustration request timed out', 'npc_defeated', 'npc_hostile_system',
    'item_gone', 'item_interact', 'item_interact_1', 'item_interact_2', 'item_interact_3'
  ].freeze

  def self.entry_matches?(entry, name)
    entry.end_with?('_') ? name.start_with?(entry) : (name == entry || name.start_with?("#{entry}:"))
  end

  def self.office_life_event?(name)
    return false unless name.is_a?(String) && !name.empty?
    return false if OFFICE_LIFE_EVENT_EXCLUSIONS.any? { |e| name == e || name.start_with?("#{e}:") }

    OFFICE_LIFE_EVENT_PREFIXES.any? { |e| entry_matches?(e, name) }
  end

  # ── entry point ─────────────────────────────────────────────────────────────────────────────

  def self.campaign?(scenario_id, campaign)
    campaign == true || CAMPAIGN_MISSIONS.include?(scenario_id.to_s)
  end

  def self.check(json, scenario_id: nil, campaign: false)
    return [] unless json.is_a?(Hash) && json['rooms'].is_a?(Hash)

    w = World.build(json)
    issues = []
    check_npc_arrived(w, issues)                         # V3
    check_chatter_repeats(w, issues)                     # V7
    check_sync_budget(w, issues)                         # V8 (warnings above a cap)
    if campaign?(scenario_id, campaign)
      check_story_npcs_leave(w, issues)                  # V2
      check_attackable_needs(w, issues)                  # V4
      check_office_life_triggers(w, issues)              # V5
    end
    # ── V10 slot (build/ol-sims scripts/validate_office_life.rb) ──────────────────────────────
    # On merge: V10's check_pools / check_exchanges / check_phone_calls (and their build_context)
    # are called here with V10's own npcs/objs lists, which World holds as w.npcs / w.objs.
    issues
  end

  # ── shared scenario view ────────────────────────────────────────────────────────────────────

  World = Struct.new(:json, :objs, :npcs, :mappings, :required_tasks, :scenario_ink, keyword_init: true) do
    def self.build(json)
      objs = []
      npcs = []
      json['rooms'].each do |room_id, room|
        next unless room.is_a?(Hash)

        Array(room['objects']).each { |o| VN.collect(o, room_id, objs) }
        Array(room['npcs']).each do |n|
          next unless n.is_a?(Hash)

          npcs << [room_id, n]
          Array(n['itemsHeld']).each { |o| VN.collect(o, room_id, objs) }
        end
      end
      Array(json['startItemsInInventory']).each { |o| VN.collect(o, nil, objs) }
      objs = VN.expand_presets(json, objs, [])
      mappings = []
      ValidateOfficeLife.each_mapping(json) { |m, owner| mappings << [m, owner] }
      new(json: json, objs: objs, npcs: npcs, mappings: mappings,
          required_tasks: ValidateOfficeLife.required_tasks(json))
    end

    def npc_ids
      npcs.map { |_r, n| n['id'] }.compact
    end
  end

  # Every eventMapping in the scenario, with the NPC id that holds it (nil at the top level).
  def self.each_mapping(json, &blk)
    Array(json['eventMappings']).each { |m| blk.call(m, nil) if m.is_a?(Hash) }
    json['rooms'].each_value do |room|
      next unless room.is_a?(Hash)

      Array(room['npcs']).each do |n|
        next unless n.is_a?(Hash)

        Array(n['eventMappings']).each { |m| blk.call(m, n['id']) if m.is_a?(Hash) }
      end
    end
  end

  # { taskId => aimId } for tasks that are not optional in aims that are not optional.
  def self.required_tasks(json)
    out = {}
    Array(json['objectives']).each do |aim|
      next unless aim.is_a?(Hash) && aim['optional'] != true

      Array(aim['tasks']).each do |t|
        out[t['taskId'].to_s] = aim['aimId'] if t.is_a?(Hash) && t['optional'] != true && t['taskId']
      end
    end
    out
  end

  def self.names(v)
    case v
    when String then [v]
    when Array then v.select { |x| x.is_a?(String) }
    when Hash then v.keys.map(&:to_s)
    else []
    end
  end

  def self.needs_npc?(n)
    n['needs'].is_a?(Hash) && !n['needs'].empty?
  end

  def self.home_room(w, npc, room)
    h = npc['needsHome']
    if h.is_a?(String)
      o = w.objs.find { |x| x.id == h }
      return o&.room || room
    end
    return h['room'] if h.is_a?(Hash) && h['room'].is_a?(String)

    room
  end

  # The ink source (.ink) beside a storyPath's compiled .json, or nil.
  def self.ink_source(story_path)
    return nil unless story_path.is_a?(String) && !story_path.empty?

    base = story_path.sub(/\.json\z/, '')
    ["#{base}.ink", story_path].map { |p| File.expand_path(p, REPO_ROOT) }.find { |p| p.end_with?('.ink') && File.file?(p) }
  end

  def self.ink_text(npc)
    path = ink_source(npc['storyPath'])
    path ? File.read(path, encoding: 'UTF-8') : ''
  rescue StandardError
    ''
  end

  # The story as text for global-writer scans: the .ink source, or the compiled JSON when no
  # .ink is committed beside it.
  def self.story_text(npc)
    src = ink_text(npc)
    return src unless src.empty?

    p = npc['storyPath']
    return '' unless p.is_a?(String) && !p.empty?

    full = File.expand_path(p, REPO_ROOT)
    File.file?(full) ? File.read(full, encoding: 'UTF-8') : ''
  rescue StandardError
    ''
  end

  # ── V1: --office-summary ────────────────────────────────────────────────────────────────────

  KEY_ITEM_TYPES = %w[key keycard id_badge rfid_card access_card].freeze

  def self.key_source?(npc)
    Array(npc['itemsHeld']).any? do |i|
      i.is_a?(Hash) && (KEY_ITEM_TYPES.include?(i['type'].to_s) || i.key?('key_id') || i.key?('keyPins') || i.key?('rfid_data'))
    end
  end

  # Required task ids an NPC's ink sets with #complete_task (anywhere in the story).
  def self.ink_required_tasks(w, npc)
    ink_text(npc).scan(/#\s*complete_task\s*:\s*([A-Za-z0-9_\-]+)/).flatten.uniq.select { |t| w.required_tasks.key?(t) }
  end

  # V1 'task': the NPC's ink sets a task with #complete_task.
  def self.ink_sets_task?(npc)
    ink_text(npc) =~ /#\s*complete_task\s*:/ ? true : false
  end

  # V1 'task-mapping': a mapping the NPC holds completes a task (observer mappings included).
  def self.mapping_sets_task?(npc)
    Array(npc['eventMappings']).any? { |m| m.is_a?(Hash) && !names(m['completeTask']).empty? }
  end

  def self.conversation_target?(w, npc)
    w.mappings.any? do |m, owner|
      m['conversationMode'].is_a?(String) && (owner == npc['id'] || m['targetNPC'] == npc['id'] || m['npcId'] == npc['id'])
    end
  end

  # Scenario-level disableAttacks is the only switch the engine reads (player-combat.js), and
  # koImmune makes the punch pass over. Phone NPCs have no sprite to punch.
  def self.attackable?(json, npc)
    json['disableAttacks'] != true && npc['koImmune'] != true && npc['npcType'] != 'phone'
  end

  # behavior.hostile is the combat tuning block (npc-hostile.js); only startHostile makes the NPC
  # hostile from the start (npc-behavior.js). A bare `hostile: true` is kept for safety.
  def self.starts_hostile?(npc)
    h = npc.dig('behavior', 'hostile')
    h == true || (h.is_a?(Hash) && h['startHostile'] == true)
  end

  # The engine enables a patrol when it is enabled, or has waypoints or bounds (npc-behavior.js).
  def self.patrols?(npc)
    p = npc.dig('behavior', 'patrol')
    return false unless p.is_a?(Hash)

    p['enabled'] == true || (p['waypoints'].is_a?(Array) && !p['waypoints'].empty?) || p['bounds'].is_a?(Hash)
  end

  # Exchanges the NPC starts plus those another NPC starts `with` it.
  def self.exchange_count(w, npc)
    others = w.npcs.sum do |_r, o|
      next 0 if o.equal?(npc)

      Array(o['exchanges']).count { |e| e.is_a?(Hash) && names(e['with']).include?(npc['id'].to_s) }
    end
    Array(npc['exchanges']).size + others
  end

  def self.class_hints(w, npc)
    hints = []
    hints << 'task' if ink_sets_task?(npc)
    hints << 'task-mapping' if mapping_sets_task?(npc)
    hints << 'conv' if conversation_target?(w, npc)
    hints << 'key' if key_source?(npc)
    if starts_hostile?(npc)
      hints << 'hostile'
    elsif npc.dig('behavior', 'hostile').is_a?(Hash)
      hints << 'fights'
    end
    hints << 'patrol' if patrols?(npc)
    hints << 'hidden' if npc['initiallyHidden'] == true
    hints << 'attackable' if attackable?(w.json, npc)
    hints
  end

  def self.list_s(v)
    a = Array(v).map { |x| x.is_a?(Hash) ? (x['npc'] || (x['group'] && "group:#{x['group']}") || x.to_json) : x.to_s }
    a.empty? ? '-' : a.join(',')
  end

  def self.office_summary(json)
    return [] unless json.is_a?(Hash) && json['rooms'].is_a?(Hash)

    w = World.build(json)
    w.npcs.sort_by { |r, n| [n['id'].to_s, r.to_s] }.map do |room, n|
      post = n['needsHome'].is_a?(String) ? n['needsHome'] : home_room(w, n, room)
      leash = []
      leash << "rooms=#{list_s(n['needsRooms'])}" if n.key?('needsRooms')
      leash << "avoid=#{list_s(n['needsAvoidRooms'])}" if n.key?('needsAvoidRooms')
      habits = n['habits'].is_a?(Hash) ? n['habits'].keys.sort.join(',') : '-'
      chatter = n['chatter'].is_a?(Hash) ? ScenarioChatter.texts(n['chatter']).size : 0
      [
        "#{n['id']} (#{room})",
        "class=#{class_hints(w, n).join(',').then { |s| s.empty? ? '-' : s }}",
        "post=#{post}",
        "leash=#{leash.empty? ? '-' : leash.join(';')}",
        "needs=#{n['needs'].is_a?(Hash) && !n['needs'].empty? ? n['needs'].keys.sort.join(',') : '-'}",
        "groups=#{list_s(n.dig('needsCompany', 'groups'))}",
        "avoids=#{list_s(n.dig('needsCompany', 'avoids'))}",
        "habits=#{habits}",
        "chatter=#{chatter}",
        "exchanges=#{exchange_count(w, n)}",
        "calls=#{Array(n['phoneCalls']).size}"
      ].join(' ')
    end
  end

  # Chatter pool text, as ScenarioBarkValidator.chatter_texts reads it (plain Ruby, no Rails).
  module ScenarioChatter
    def self.pools(chatter)
      return {} unless chatter.is_a?(Hash)

      chatter.transform_values do |pool|
        lines = pool.is_a?(Hash) ? pool['lines'] : pool
        Array(lines).select { |l| l.is_a?(String) && !l.strip.empty? }
      end
    end

    def self.texts(chatter)
      pools(chatter).values.flatten
    end
  end

  # ── V2 ──────────────────────────────────────────────────────────────────────────────────────

  # Producer ids the NPC prints to: onUse revealOutput hooks, and mapping needs.print commands.
  def self.print_producers(npc)
    out = []
    (npc['onUse'].is_a?(Hash) ? npc['onUse'] : {}).each_value do |hook|
      out.concat(VN.printer_list(hook['revealOutput'])) if hook.is_a?(Hash) && hook.key?('revealOutput')
    end
    Array(npc['eventMappings']).each do |m|
      next unless m.is_a?(Hash) && m['needs'].is_a?(Hash) && m['needs'].key?('print')

      cmd = m['needs']['print']
      out.concat(VN.printer_list(cmd.is_a?(Hash) ? cmd['producer'] : cmd))
    end
    out.uniq
  end

  # Rooms other than its home that its needs can take it to, under its leash: an object meeting a
  # need that it may use; the output tray of a printer it prints to (a print fetch); an item tagged
  # for one of its interests; and, when a droppable magnet satisfies one of its needs, any room it
  # can reach (the player can drop the magnet anywhere). [rooms, reasons].
  def self.away_need_rooms(w, npc, room)
    home = home_room(w, npc, room)
    reach = VN.leash_reach(w.json, npc, home)
    away = ->(r) { r && r != home && reach.include?(r) }
    needs = npc['needs'].keys
    rooms = {}
    add = ->(r, why) { (rooms[r] ||= []) << why if away.call(r) }
    w.objs.each do |o|
      a = o.data['affordance']
      next unless a.is_a?(Hash) && (VN.list(a['satisfies']) & needs).any?
      next if a['magnet'].is_a?(Hash)

      add.call(o.room, 'need') if VN.use_rule(w.json, npc, o, home, w.npcs).nil?
    end
    prods = print_producers(npc)
    unless prods.empty?
      w.objs.each { |o| add.call(o.room, 'print fetch') if prods.include?(o.data['outputOf']) || prods.include?(o.id) }
    end
    tags = npc['interests'].is_a?(Hash) ? npc['interests'].keys : []
    w.objs.each { |o| add.call(o.room, 'interest') if tags.include?(o.data['needsTag']) } unless tags.empty?
    if w.objs.any? { |o| (m = o.data['affordance']).is_a?(Hash) && m['magnet'].is_a?(Hash) && (VN.list(m['satisfies']) & needs).any? }
      reach.each { |r| add.call(r, 'magnet') }
    end
    rooms.keys.sort.map { |r| "#{r} (#{rooms[r].uniq.join('/')})" }
  end

  # A patrolOverride walks to a tile in the room the NPC is in when it fires (npc-manager.js), so
  # it returns the NPC to its post only when that room is its home and the trigger is a story
  # event (an office-life event fires while it is away).
  def self.post_override?(w, npc, room)
    return false unless home_room(w, npc, room) == room

    Array(npc['eventMappings']).any? do |m|
      m.is_a?(Hash) && m.dig('patrolOverride', 'targetTile').is_a?(Hash) && !office_life_event?(m['eventPattern'])
    end
  end

  def self.check_story_npcs_leave(w, issues)
    w.npcs.each do |room, n|
      next unless needs_npc?(n)

      why = []
      tasks = ink_required_tasks(w, n)
      tasks += Array(n['eventMappings']).flat_map { |m| m.is_a?(Hash) && m['conversationMode'] ? names(m['completeTask']) : [] }
                                        .select { |t| w.required_tasks.key?(t) }
      why << "owns a knot that sets required task(s) #{tasks.uniq.sort.join(', ')}" unless tasks.empty?
      why << 'is the target of a conversation-mode mapping' if conversation_target?(w, n)
      why << 'is a key or card source' if key_source?(n)
      next if why.empty? || post_override?(w, n, room)

      away = away_need_rooms(w, n, room)
      next if away.empty?

      issues << "⚠️ WARNING: office life V2: NPC '#{n['id']}' #{why.join(' and ')}, and its needs can take it out of " \
                "its own room (to #{away.join(', ')}). A story NPC must stay reachable: leash it (needsRooms), or add " \
                'a patrolOverride.targetTile mapping that returns it to its post before the beat. deferrable: false does not exempt it.'
    end
  end

  # ── V3 ──────────────────────────────────────────────────────────────────────────────────────

  def self.check_npc_arrived(w, issues)
    needs_ids = w.npcs.select { |_r, n| needs_npc?(n) }.map { |_r, n| n['id'] }.to_set
    w.mappings.each do |m, owner|
      pat = m['eventPattern']
      next unless pat.is_a?(String)

      if pat == 'npc_arrived:*' && !needs_ids.empty?
        issues << "⚠️ WARNING: office life V3: eventMapping '#{pat}'#{owner ? " on '#{owner}'" : ''} listens for any arrival, " \
                  "and #{needs_ids.to_a.sort.join(', ')} ha#{needs_ids.size == 1 ? 's' : 've'} needs; needs walks fire npc_arrived too, so it fires on every coffee run."
        next
      end
      next unless (id = pat[/\Anpc_arrived:(.+)\z/, 1]) && needs_ids.include?(id)

      issues << "⚠️ WARNING: office life V3: eventMapping '#{pat}'#{owner ? " on '#{owner}'" : ''} listens for an arrival of " \
                "'#{id}', which has needs; its needs walks also fire npc_arrived, so the mapping can fire on a coffee run."
    end
  end

  # ── V4 ──────────────────────────────────────────────────────────────────────────────────────

  # The KO drops: itemsHeld ids (else type), as plan 6.10 asks the info line to list.
  def self.held_s(npc)
    list_s(Array(npc['itemsHeld']).select { |i| i.is_a?(Hash) }.map { |i| i['id'] || i['type'] || i['name'] })
  end

  def self.check_attackable_needs(w, issues)
    w.npcs.each do |_room, n|
      next unless needs_npc?(n) && attackable?(w.json, n)

      drops = "KO globals #{list_s(n['globalVarOnKO'])}, KO tasks #{list_s(n['taskOnKO'])}, held items #{held_s(n)}"
      ignored = n['disableAttacks'] == true ? ' Its own disableAttacks has no effect: the engine reads only the scenario-level flag.' : ''
      if E1_PROBE_PASSED
        issues << "ℹ office life V4: needs NPC '#{n['id']}' can be attacked; #{drops}.#{ignored}"
      else
        issues << "⚠️ WARNING: office life V4: needs NPC '#{n['id']}' can be attacked mid-walk (no disableAttacks, " \
                  "not koImmune) and the E1 attack probe has not passed. #{drops}.#{ignored}"
      end
    end
  end

  # ── V5 ──────────────────────────────────────────────────────────────────────────────────────

  # { global => source } for every global office life writes (plan section 4, V5), and nothing
  # else does. Followed to a fixed point: a mapping triggered by an office-life global is itself
  # office life, so the globals it sets count too, and it no longer counts as another writer.
  def self.office_life_globals(w)
    base = base_office_globals(w)
    globals = {}
    20.times do
      cand = base.dup
      w.mappings.each do |m, owner|
        why = office_trigger(m, globals)
        next unless why

        names(m['setGlobal']).each do |g|
          cand[g] ||= "set by the office-life mapping '#{m['eventPattern']}'#{owner ? " on '#{owner}'" : ''}"
        end
      end
      other = other_global_writes(w, globals)
      nxt = cand.reject { |g, _| other.include?(g) }
      break if nxt == globals

      globals = nxt
    end
    globals
  end

  def self.base_office_globals(w)
    out = {}
    w.npcs.each do |_r, n|
      AW.workarounds(w.json, n).each { |wa| names(wa['setGlobal']).each { |g| out[g] ||= "workaround setGlobal on '#{n['id']}'" } }
      (n['onUse'].is_a?(Hash) ? n['onUse'] : {}).each do |oid, hook|
        names(hook.is_a?(Hash) ? hook['setGlobal'] : nil).each { |g| out[g] ||= "onUse '#{oid}' setGlobal on '#{n['id']}'" }
      end
      (Array(n['exchanges']) + Array(n['phoneCalls'])).each do |e|
        out["heard_#{e['knot']}"] ||= "heard_ global of '#{n['id']}' knot '#{e['knot']}'" if e.is_a?(Hash) && e['knot'].is_a?(String)
      end
    end
    w.objs.each do |o|
      next if o.id.to_s.empty?

      a = o.data['affordance']
      out["#{o.id}_servings"] ||= "magnet '#{o.id}' servings" if a.is_a?(Hash) && a['magnet'].is_a?(Hash)
      if VN.workstation?(o.data) && VN.station_owner(o.data)
        %w[screen_locked owner_away accessed].each { |s| out["#{o.id}_#{s}"] ||= "workstation '#{o.id}'" }
      end
      g = o.data['revealOnGlobal']
      if g.is_a?(String) && (o.data.key?('outputOf') || o.data.key?('leftBehindChance'))
        out[g] ||= "reveal global of '#{o.id}'"
      end
    end
    out
  end

  OFFICE_HOLDERS = %w[workarounds onUse].freeze

  # Globals written by anything that is not office life: a mapping whose trigger is not office
  # life (given the office globals so far), an object, an action list ({ type: set_global, key }),
  # a social-influence effect ({ type: setGlobal, global }), or a story the NPCs load (ink
  # #set_global / #set_variable tags and `~ name =`; the compiled JSON when no .ink is committed).
  def self.other_global_writes(w, globals = {})
    set = Set.new
    walk = lambda do |node, skip|
      case node
      when Hash
        office = skip || (node.key?('eventPattern') && office_trigger(node, globals))
        unless office
          set << node['key'] if node['type'] == 'set_global' && node['key'].is_a?(String)
          set << node['global'] if node['type'] == 'setGlobal' && node['global'].is_a?(String)
        end
        node.each do |k, v|
          next if OFFICE_HOLDERS.include?(k)

          names(v).each { |g| set << g } if k == 'setGlobal' && !office
          walk.call(v, office)
        end
      when Array then node.each { |v| walk.call(v, skip) }
      end
    end
    walk.call(w.json, false)
    w.npcs.map { |_r, n| story_text(n) }.uniq.each do |src|
      src.scan(/#\s*set_(?:global|variable)\s*:\s*([A-Za-z0-9_]+)/).flatten.each { |g| set << g }
      src.scan(/^\s*~\s*([A-Za-z0-9_]+)\s*=(?!=)/).flatten.each { |g| set << g }
      src.scan(/"VAR=":\s*"([A-Za-z0-9_]+)"/).flatten.each { |g| set << g }
    end
    set
  end

  def self.globals_in(text)
    text.to_s.scan(/globalVars\.([A-Za-z0-9_]+)/).flatten
  end

  # [why] if a mapping's trigger is office life: its event, or a global its condition reads.
  def self.office_trigger(m, globals)
    pat = m['eventPattern']
    return "office-life event '#{pat}'" if office_life_event?(pat)
    if pat.is_a?(String) && (g = pat[/\Aglobal_variable_changed:(.+)\z/, 1]) && globals[g]
      return "global '#{g}' (#{globals[g]}), which only office life writes"
    end

    g = globals_in(m['condition']).find { |x| globals[x] }
    g ? "global '#{g}' (#{globals[g]}) in its condition, which only office life writes" : nil
  end

  # { 'object:<id>' / 'room:<id>' => [required task ids] } for required unlock_object / unlock_room tasks,
  # which complete when their targetObject / targetRoom unlocks (objectives-manager.js).
  def self.required_unlock_targets(json)
    req = required_tasks(json)
    out = Hash.new { |h, k| h[k] = [] }
    Array(json['objectives']).each do |aim|
      next unless aim.is_a?(Hash)

      Array(aim['tasks']).each do |t|
        next unless t.is_a?(Hash) && req.key?(t['taskId'].to_s)

        if t['type'] == 'unlock_object' && t['targetObject'].is_a?(String)
          out["object:#{t['targetObject']}"] << t['taskId']
        elsif t['type'] == 'unlock_room' && t['targetRoom'].is_a?(String)
          out["room:#{t['targetRoom']}"] << t['taskId']
        end
      end
    end
    out
  end

  def self.check_office_life_triggers(w, issues)
    globals = office_life_globals(w)
    unlock_tasks = required_unlock_targets(w.json)
    w.mappings.each do |m, owner|
      why = office_trigger(m, globals)
      next unless why

      where = "eventMapping '#{m['eventPattern']}'#{owner ? " on '#{owner}'" : ''}"
      req = names(m['completeTask']).select { |t| w.required_tasks.key?(t) }
      unless req.empty?
        issues << "❌ ERROR: office life V5: #{where} completes required task(s) #{req.join(', ')} from #{why}. " \
                  'Required content must not wait on office life (rule 1): key it on a story event or global.'
      end
      targets = names(m['unlockDoor']).map { |t| ['room', t] } + names(m['unlockObject']).map { |t| ['object', t] }
      next if targets.empty?

      proven, other = targets.partition { |k, t| unlock_tasks.key?("#{k}:#{t}") }
      other = other.map(&:last)
      proven.each do |k, t|
        issues << "❌ ERROR: office life V5: #{where} unlocks #{k} '#{t}' from #{why}, and required task(s) " \
                  "#{unlock_tasks["#{k}:#{t}"].join(', ')} complete when it unlocks. Required content must not wait on office life (rule 1)."
      end
      next if other.empty?

      issues << "⚠️ WARNING: office life V5: #{where} unlocks #{other.join(', ')} " \
                "from #{why}. If that lock is on the critical path, it waits on office life (rule 1)."
    end
    Array(w.json['objectives']).each do |aim|
      next unless aim.is_a?(Hash) && aim['optional'] != true

      g = aim.dig('unlockCondition', 'globalVariable')
      next unless g.is_a?(String) && globals[g]

      issues << "❌ ERROR: office life V5: aim '#{aim['aimId']}' unlockCondition reads global '#{g}' (#{globals[g]}), which " \
                'only office life writes (rule 1).'
    end
    conclude_nodes(w.json).each do |cr|
      names(cr['globals']).each do |g|
        next unless globals[g]

        issues << "❌ ERROR: office life V5: concludeRequires needs global '#{g}' (#{globals[g]}), which only office life writes (rule 1)."
      end
    end
  end

  def self.conclude_nodes(node, out = [])
    case node
    when Hash
      out << node['concludeRequires'] if node['concludeRequires'].is_a?(Hash)
      node.each_value { |v| conclude_nodes(v, out) }
    when Array then node.each { |v| conclude_nodes(v, out) }
    end
    out
  end

  # ── V7 ──────────────────────────────────────────────────────────────────────────────────────

  def self.norm(text)
    text.to_s.downcase.gsub(/[^\w\s]/, '').strip.gsub(/\s+/, ' ')
  end

  def self.bark_texts(w)
    out = []
    walk = lambda do |node|
      case node
      when Hash
        node.each do |k, v|
          if %w[bark barks].include?(k)
            Array(v).each { |b| out << (b.is_a?(Hash) ? b['text'] : b) }
          elsif k != 'chatter'
            walk.call(v)
          end
        end
      when Array then node.each { |v| walk.call(v) }
      end
    end
    walk.call(w.json)
    out.select { |t| t.is_a?(String) && !t.strip.empty? }
  end

  # The first spoken line of an NPC's opener knot (currentKnot, else start), speaker prefix stripped.
  def self.opener_line(npc)
    src = ink_text(npc)
    return nil if src.empty?

    knot = npc['currentKnot'].is_a?(String) ? npc['currentKnot'] : 'start'
    body = src.split(/^\s*={2,}\s*#{Regexp.escape(knot)}\b[^\n]*\n/, 2)[1]
    return nil unless body

    body.each_line do |l|
      s = l.strip
      break if s =~ /\A={2,}/
      next if s.empty? || s =~ %r{\A(~|#|\*|\+|-|//|\{|\}|VAR|CONST|INCLUDE|<>)}

      s = s.sub(/\s#.*\z/, '').sub(/\A[A-Za-z_][\w ]{0,30}:\s*/, '')
      return s unless s.empty?
    end
    nil
  end

  def self.check_chatter_repeats(w, issues)
    seen = {}
    shared = ScenarioChatter.pools(w.json['chatter']).flat_map { |topic, ls| ls.map { |l| ['scenario', topic, l] } }
    own = w.npcs.flat_map { |_r, n| ScenarioChatter.pools(n['chatter']).flat_map { |topic, ls| ls.map { |l| [n['id'], topic, l] } } }
    barks = bark_texts(w).map { |t| norm(t) }.to_set
    openers = w.npcs.to_h { |_r, n| [n['id'], (o = opener_line(n)) && norm(o)] }
    (shared + own).each do |who, topic, line|
      key = norm(line)
      next if key.empty?

      where = "#{who == 'scenario' ? 'scenario' : "NPC '#{who}'"} chatter '#{topic}' line \"#{line}\""
      if (first = seen[key])
        issues << "⚠️ WARNING: office life V7: #{where} repeats #{first} word for word (the same fact twice)."
      else
        seen[key] = "#{who == 'scenario' ? 'scenario' : "NPC '#{who}'"} chatter '#{topic}'"
      end
      issues << "⚠️ WARNING: office life V7: #{where} repeats an existing bark word for word." if barks.include?(key)
      issues << "⚠️ WARNING: office life V7: #{where} matches the first line of its ink opener." if who != 'scenario' && openers[who] == key
    end
  end

  # ── V8: sync budget (plan section 7) ────────────────────────────────────────────────────────

  BUDGET_CAPS = [
    ['workstation globals', 24], ['frustration', 6], ['workaround slots', 4], ['workaround and onUse globals', 8],
    ['heard_ globals', 8], ['magnet servings', 2], ['reveal and left-behind globals', 6], ['Friendface posts', 10],
    ['dropped magnet items', 2], ['office-life onceOnly mappings', 10], ['office-life items', 4]
  ].freeze

  # [[kind, count, cap]] for every row of section 7 the scenario can write.
  def self.sync_budget(w)
    c = Hash.new(0)
    w.npcs.each do |_r, n|
      c['frustration'] += 1 unless AW.work_list(w.json, n).empty?
      was = AW.workarounds(w.json, n)
      c['workaround slots'] += was.size
      c['workaround and onUse globals'] += was.sum { |wa| names(wa['setGlobal']).size }
      (n['onUse'].is_a?(Hash) ? n['onUse'] : {}).each_value { |h| c['workaround and onUse globals'] += names(h.is_a?(Hash) ? h['setGlobal'] : nil).size }
      c['heard_ globals'] += (Array(n['exchanges']) + Array(n['phoneCalls'])).count { |e| e.is_a?(Hash) && e['knot'].is_a?(String) }
      c['Friendface posts'] += AW.feed_posts(n).size
    end
    w.objs.each do |o|
      a = o.data['affordance']
      c['workstation globals'] += 3 if VN.workstation?(o.data) && VN.station_owner(o.data)
      if a.is_a?(Hash) && a['magnet'].is_a?(Hash)
        c['magnet servings'] += 1
        c['dropped magnet items'] += 1
      end
      left = o.data['revealOnGlobal'].is_a?(String) && (o.data.key?('outputOf') || o.data.key?('leftBehindChance'))
      c['reveal and left-behind globals'] += 1 if left
      c['office-life items'] += 1 if (left || (a.is_a?(Hash) && a['magnet'].is_a?(Hash))) && o.data['takeable'] != false
    end
    c['office-life onceOnly mappings'] = w.mappings.count { |m, _| m['onceOnly'] == true && (office_life_event?(m['eventPattern']) || office_life_action?(m)) }
    BUDGET_CAPS.map { |kind, cap| [kind, c[kind], cap] }
  end

  # A mapping that drives office life whatever its trigger: a needs command (print included), a
  # patrolOverride, or an emitted office-life event (desk_phone_ring and the like).
  def self.office_life_action?(m)
    m['needs'].is_a?(Hash) || m['patrolOverride'].is_a?(Hash) || office_life_event?(m['emitEvent'])
  end

  def self.check_sync_budget(w, issues)
    sync_budget(w).each do |kind, n, cap|
      next unless n > cap

      issues << "⚠️ WARNING: office life V8: sync budget #{kind} is #{n}, above its cap of #{cap} (plan section 7). " \
                'A plan that needs more must say why.'
    end
  end

  # Info lines for the report: each kind with a count, and the small-key sum. Empty when the
  # scenario writes no office-life state.
  def self.sync_budget_lines(json)
    return [] unless json.is_a?(Hash) && json['rooms'].is_a?(Hash)

    rows = sync_budget(World.build(json)).select { |_k, n, _c| n.positive? }
    return [] if rows.empty?

    keys = rows.reject { |k, _, _| ['workaround slots', 'Friendface posts', 'dropped magnet items', 'office-life items'].include?(k) }.sum { |_, n, _| n }
    ["ℹ Office-life sync budget (V8): " + rows.map { |k, n, cap| "#{k} #{n}/#{cap}" }.join('; ') + "; small keys #{keys}/64"]
  end
end
