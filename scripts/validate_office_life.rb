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
#   V10 pools, exchanges and calls nothing can trigger (check_v10, below V8; warnings only)
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
    issues.concat(check_v10(json))                       # V10 (own world/held view, see below)
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

  # A magnet the player can carry and drop elsewhere: takeable (the engine picks up only a truthy
  # takeable, interactions.js), droppable, or in the starting inventory.
  def self.carried?(o)
    o.room.nil? || o.data['takeable'] == true || o.data['droppable'] == true
  end

  # Rooms other than its home that its needs can take it to, under its leash: an object meeting a
  # need that it may use; the output tray of a printer it prints to (a print fetch); an item tagged
  # for one of its interests; a magnet meeting one of its needs (its own room when fixed, any room
  # it can reach when the player can carry it); and its workaround visits with a fixed target (a
  # prop_door's prop, a borrow_session's PC, a share_login colleague's room). [rooms, reasons].
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
    w.objs.each do |o|
      m = o.data['affordance']
      next unless m.is_a?(Hash) && m['magnet'].is_a?(Hash) && (VN.list(m['satisfies']) & needs).any?

      carried?(o) ? reach.each { |r| add.call(r, 'magnet') } : add.call(o.room, 'magnet')
    end
    # workaround visits with a fixed target: the room of the prop a prop_door props (a visit to the
    # prop only, npc-workarounds.js; the door's room is the one propped open, never visited), the
    # PC a borrow_session sits at, and the colleague a share_login goes to (`with`), resolved as
    # validate_access_work.rb does (AW.object_index)
    index = AW.object_index(w.json)
    AW.workarounds(w.json, npc).each do |wa|
      case wa['do']
      when 'prop_door'
        add.call(index.dig(wa['prop'], :room_id), 'workaround visit') if wa['prop'].is_a?(String)
      when 'borrow_session'
        add.call(index.dig(wa['pc'], :room_id), 'workaround visit') if wa['pc'].is_a?(String)
      when 'share_login'
        mate = w.npcs.find { |_r, n| n.is_a?(Hash) && n['id'] == wa['with'] } if wa['with'].is_a?(String)
        add.call(home_room(w, mate[1], mate[0]), 'workaround visit') if mate
      end
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
        c['dropped magnet items'] += 1 if carried?(o)
      end
      left = o.data['revealOnGlobal'].is_a?(String) && (o.data.key?('outputOf') || o.data.key?('leftBehindChance'))
      c['reveal and left-behind globals'] += 1 if left
      magnet = a.is_a?(Hash) && a['magnet'].is_a?(Hash)
      c['office-life items'] += 1 if (left && o.data['takeable'] != false) || (magnet && carried?(o))
    end
    globals = office_life_globals(w)
    c['office-life onceOnly mappings'] = w.mappings.count do |m, _|
      m['onceOnly'] == true && (office_life_event?(m['eventPattern']) || office_life_action?(m, globals))
    end
    BUDGET_CAPS.map { |kind, cap| [kind, c[kind], cap] }
  end

  # A mapping that drives office life whatever its trigger: a needs command (print included) or an
  # emitted office-life event (desk_phone_ring and the like). A patrolOverride counts only on an
  # office-life trigger (an event, or a global only office life writes); on a story trigger it is
  # scripted patrol (m02's roaming nurse, m09's old_coyote).
  def self.office_life_action?(m, globals = {})
    return true if m['needs'].is_a?(Hash) || office_life_event?(m['emitEvent'])

    m['patrolOverride'].is_a?(Hash) && !office_trigger(m, globals).nil?
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

  # ── V10: pools, exchanges and calls nothing can trigger (build/ol-sims, SIMS-5) ──────────────
  # V10 keeps its own world/held split (top-level objects with positions versus container contents)
  # and its own entry point, check_v10, called from check at the V10 slot.

  # Topics the engine speaks from a pool, by call site in npc-needs.js:
  #   grumble / grumble_<reason>: _turnBack -> _grumbleTopic (avoid -> 'grumble'; off/gone -> their
  #   own pool when the merged pool has lines, else 'grumble'); a judged need's off or failed
  #   turn-back speaks _failTopic instead; _printBlocked speaks 'grumble_printer_off' (no fallback).
  #   phone / phone_message: _chooseCall (owner from _ownerAnswers, colleague from _claimAnswerer).
  #   A chatter-object topic (affordance.chatter): _maybePair, _tickQueueChats, _tickChats.
  #   A magnet's announce pool ('news' when it names none): _tickNews.
  GRUMBLE_TOPICS = %w[grumble grumble_off grumble_gone grumble_printer_off].freeze
  PHONE_TOPICS = %w[phone phone_message].freeze
  # PICTURE_CHATTER topics the office-life engine speaks itself; V10 judges every one of them.
  OFFICE_TOPICS = (%w[coffee cooler greet news] + GRUMBLE_TOPICS + PHONE_TOPICS).freeze
  # _avoidRadius: needsCompany.avoidRadius (0 to 10), else 2 when the NPC declares avoids, else 0.
  AVOID_RADIUS_TILES = 2
  # magnetOf: newsRadius default (NEWS_RADIUS), in tiles.
  NEWS_RADIUS_TILES = 5
  # How many partners, pairs or objects a chatter-pool warning names before "and N more".
  SHOWN = 3

  # Every topic the needs engine (and its access/workaround siblings) can speak, read from
  # PICTURE_CHATTER in npc-needs.js so the list cannot drift. The ones outside OFFICE_TOPICS
  # (work-failure and access/workaround topics, spoken by _failTopic, npc-workarounds.js and
  # workstation-state.js) are another check's concern, so V10 does not flag them. A topic on none
  # of these lists, and on no chatter object or magnet, is one nothing speaks.
  NEEDS_JS = File.expand_path('../public/break_escape/js/systems/npc-needs.js', __dir__)

  def self.known_engine_topics
    @known_engine_topics ||= begin
      src = File.file?(NEEDS_JS) ? File.read(NEEDS_JS) : ''
      block = src[/PICTURE_CHATTER\s*=\s*Object\.freeze\(\{(.+?)\n\}\);/m, 1] || ''
      Set.new(block.scan(/^\s*([a-z_]+)\s*:/).flatten)
    end
  end

  # Spoken by another subsystem (work failures, access workarounds): outside V10.
  def self.other_subsystem_topic?(topic)
    topic == 'work_fail' || topic.start_with?('work_fail_') ||
      (known_engine_topics.include?(topic) && !OFFICE_TOPICS.include?(topic))
  end

  def self.check_v10(json)
    return [] unless json.is_a?(Hash) && json['rooms'].is_a?(Hash)

    world = []   # top-level room objects: the sprites listObjects gives the needs engine
    held = []    # container contents, itemsHeld and the player's start inventory: only a magnet
    # counts (onItemDropped makes a dropped magnet a source where it lies)
    npcs = []
    json['rooms'].each do |room_id, room|
      next unless room.is_a?(Hash)

      Array(room['objects']).each do |o|
        next unless o.is_a?(Hash)

        pos = o['position'].is_a?(Hash) ? o['position'] : {}
        world << VN::Obj.new(id: o['id'], room: room_id, data: o, x: pos['x'].to_f, y: pos['y'].to_f)
        (Array(o['contents']) + Array(o['itemsHeld'])).each { |c| VN.collect(c, nil, held) }
      end
      Array(room['npcs']).each do |n|
        next unless n.is_a?(Hash)

        npcs << [room_id, n]
        Array(n['itemsHeld']).each { |o| VN.collect(o, nil, held) }
      end
    end
    Array(json['startItemsInInventory']).each { |o| VN.collect(o, nil, held) }
    world = VN.expand_presets(json, world, [])
    held = VN.expand_presets(json, held, [])

    ctx = build_context(json, world, held, npcs)
    issues = []
    check_pools(json, npcs, ctx, issues)
    check_knots(json, npcs, ctx, issues)
    issues
  end

  Ctx = Struct.new(:npc_room, :home_room, :by_topic, :announce, :phones, :rung, :world, :magnets,
                   :npc_list, :reach, :rooms, :knows, :tellers, :phone_owners, keyword_init: true)

  def self.build_context(json, world, held, npcs)
    by_id = world.select(&:id).group_by(&:id)
    npc_room = {}.compare_by_identity
    home_room = {}.compare_by_identity
    npcs.each do |room_id, n|
      npc_room[n] = room_id
      home_room[n] = home_room_of(json, n, room_id, by_id)
    end
    # A magnet with no servings is never a source, never gone and never told (magnetOf, _tickNews).
    magnets = (world + held).select { |o| magnet_of(o) && servings(o) >= 1 }
    sources = world.reject { |o| magnet_of(o) && servings(o) < 1 } +
              held.select { |o| magnet_of(o) && servings(o) >= 1 }   # a held magnet's room is wherever it is dropped (nil)
    chatter_objs = sources.select do |o|
      a = o.data['affordance']
      a.is_a?(Hash) && a['chatter'].is_a?(String) && !a['chatter'].empty?
    end
    announce = {}
    magnets.each do |o|
      m = magnet_of(o)
      topic = m['announce'].is_a?(String) && !m['announce'].empty? ? m['announce'] : 'news'
      (announce[topic] ||= []) << o
    end
    ctx = Ctx.new(
      npc_room: npc_room, home_room: home_room,
      by_topic: chatter_objs.group_by { |o| o.data['affordance']['chatter'] },
      announce: announce,
      # onPhoneRing ignores a phone whose owner is not a String
      phones: world.select { |o| o.data['deskPhone'] == true && !o.id.to_s.empty? && o.data['owner'].is_a?(String) && !o.data['owner'].empty? },
      rung: ring_targets(json),
      # validate_npc_needs.rb check_phones reads any deskPhone object's owner (for its pointer)
      phone_owners: Set.new((world + held).select { |o| o.data['deskPhone'] == true }.map { |o| o.data['owner'] }),
      world: sources, magnets: magnets,
      npc_list: npcs.map(&:last),
      reach: {}.compare_by_identity
    )
    build_rooms(json, ctx)
    ctx
  end

  def self.magnet_of(o)
    a = o.data['affordance']
    m = a.is_a?(Hash) ? a['magnet'] : nil
    m.is_a?(Hash) ? m : nil
  end

  # JavaScript Number(v) for JSON values (nil is null); NaN for anything Number cannot read. An
  # array reads as its string form ([] is 0, [3] is 3, [true] and [1, 2] are NaN); an object is NaN.
  def self.js_number(v)
    case v
    when Numeric then v.to_f
    when nil, false then 0.0
    when true then 1.0
    when String then js_number_string(v)
    when Array
      return 0.0 if v.empty?
      return Float::NAN unless v.length == 1

      e = v.first
      e.nil? || e.is_a?(Numeric) || e.is_a?(String) || e.is_a?(Array) ? js_number(e) : Float::NAN
    else Float::NAN
    end
  end

  # Number(string): trimmed; empty is 0; decimal with optional exponent, 0x/0b/0o integers, Infinity.
  def self.js_number_string(str)
    s = str.strip
    return 0.0 if s.empty?
    return (s.start_with?('-') ? -Float::INFINITY : Float::INFINITY) if s.match?(/\A[+-]?Infinity\z/)
    return Integer(s[2..], { 'x' => 16, 'b' => 2, 'o' => 8 }[s[1].downcase]).to_f if s.match?(/\A0(?:[xX]\h+|[bB][01]+|[oO][0-7]+)\z/)
    return Float::NAN unless s.match?(/\A[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?\z/)

    Float(s.sub(/\A([+-]?)\./, '\10.').sub(/\.(?=[eE]|\z)/, '.0'))
  end

  # magnetOf: Math.floor(Number(servings) clamped to 0..1000), 1 when absent or not a number.
  def self.servings(o)
    m = magnet_of(o)
    v = m.key?('servings') ? js_number(m['servings']) : Float::NAN
    v.finite? ? v.clamp(0, 1000).floor : 1
  end

  # A magnet fixed in a room (not held): a source only for an NPC that knows of it (_magnetBarred).
  def self.fixed_magnet?(o)
    !o.room.nil? && !magnet_of(o).nil?
  end

  def self.home_room_of(_json, npc, npc_room, by_id)
    h = npc['needsHome']
    if h.is_a?(String)
      o = by_id[h]&.first
      return o ? o.room : npc_room
    elsif h.is_a?(Hash) && h['room'].is_a?(String)
      return h['room']
    end
    npc_room
  end

  # Every phone id a desk_phone_ring:<id> emitter names anywhere in the scenario: an emitEvent (an
  # event mapping, a needs hook, a launch device) or an emit_event action's event_name. A listener
  # (an eventPattern) rings nothing. onPhoneRing listens on desk_phone_ring:*.
  def self.ring_targets(node, out = Set.new)
    case node
    when Array then node.each { |v| ring_targets(v, out) }
    when Hash
      emits = [node['emitEvent']]
      emits << node['event_name'] if node['type'] == 'emit_event'
      emits.each { |e| out << Regexp.last_match(1) if e.is_a?(String) && e =~ /\Adesk_phone_ring:(.+)\z/ }
      node.each_value { |v| ring_targets(v, out) }
    end
    out
  end

  # ── company: groups, avoids, radius (npc-needs.js _groups, _avoidsOneWay, _avoidRadius) ─────

  def self.company(n)
    c = n['needsCompany']
    c.is_a?(Hash) ? c : nil
  end

  def self.groups(n)
    g = company(n)&.dig('groups')
    g.is_a?(Array) ? g.select { |x| x.is_a?(String) && !x.empty? } : []
  end

  # Does a's avoids list name b? As _avoidsOneWay. A requireGlobal entry counts only when
  # `conditional` is true (it holds while its global does): a turn-back or grumble that needs the
  # avoid counts it, while a check that the avoid would block (a chat, a hearer, an answerer) does
  # not, since there is a state in which it does not hold.
  def self.avoids_one_way?(a, b, conditional: false)
    list = company(a)&.dig('avoids')
    return false unless list.is_a?(Array)

    hit = lambda do |who|
      who == '*' || (!b['id'].nil? && who == b['id']) ||
        (who.is_a?(String) && who.start_with?('group:') && groups(b).include?(who[6..]))
    end
    list.any? do |e|
      next hit.call(e) if e.is_a?(String)
      next false unless e.is_a?(Hash)

      named = e['npc'].is_a?(String) ? hit.call(e['npc']) : (e['group'].is_a?(String) && groups(b).include?(e['group']))
      named && (conditional || !e.key?('requireGlobal'))
    end
  end

  def self.avoids_either?(a, b, conditional: false)
    avoids_one_way?(a, b, conditional: conditional) || avoids_one_way?(b, a, conditional: conditional)
  end

  # _compatible: no avoid either way, and a shared group unless one has none. Pairing only.
  def self.compatible?(a, b)
    return false if avoids_either?(a, b)

    ga = groups(a)
    gb = groups(b)
    ga.empty? || gb.empty? || (ga & gb).any?
  end

  def self.avoid_radius(n)
    c = company(n)
    return 0 unless c

    # Number(avoidRadius) when it is set and finite ("" is 0, true is 1); absent or null: the default
    v = c['avoidRadius'].nil? ? Float::NAN : js_number(c['avoidRadius'])
    return v.clamp(0, 10) if v.finite?

    c['avoids'].is_a?(Array) && !c['avoids'].empty? ? AVOID_RADIUS_TILES : 0
  end

  # ── needs, use and reach ─────────────────────────────────────────────────────────────────────

  # The needs register keeps: normaliseNeed drops one without decayPerMin > 0 and urgentAt > 0.
  def self.needs_of(n)
    return [] unless n['needs'].is_a?(Hash)

    n['needs'].select do |_k, v|
      v.is_a?(Hash) && js_number(v['decayPerMin']) > 0 && js_number(v['urgentAt']) > 0
    end.keys
  end

  # normaliseInterest: a number is the weight; a weight above 0 keeps it.
  def self.interests_of(n)
    return [] unless n['interests'].is_a?(Hash)

    n['interests'].select { |_k, v| js_number(v.is_a?(Hash) ? v['weight'] : (v.is_a?(Numeric) ? v : Float::NAN)) > 0 }.keys
  end

  # Does the needs engine run this NPC? register keeps it only with a need or interest that
  # survives normalising, and every rule V10 mirrors reads this.states. A phone contact
  # (npcType "phone") has no sprite, so npcPos is null and it never tells, hears, answers or is avoided.
  def self.runs?(n)
    n['npcType'] != 'phone' && (!needs_of(n).empty? || !interests_of(n).empty?)
  end

  # JavaScript truthiness for JSON values.
  def self.js_truthy?(v)
    !(v.nil? || v == false || v == '' || (v.is_a?(Numeric) && (v.zero? || (v.is_a?(Float) && v.nan?))))
  end

  # The rooms a patrol (npc-behavior.js) walks, or nil with no patrol. It is on when `enabled` is
  # truthy, or when waypoints (non-empty) or bounds are given, whatever `enabled` says (the
  # constructor's auto-enable). A multiRoom route that validateMultiRoomRoute accepts walks its
  # rooms; anything else stays in the start room. The needs leash does not govern a patrol.
  def self.patrol_rooms(json, n, start_room)
    p = n['behavior'].is_a?(Hash) ? n['behavior']['patrol'] : nil
    return nil unless p.is_a?(Hash)

    wp = p['waypoints']
    on = js_truthy?(p['enabled']) || ((wp.is_a?(Array) || wp.is_a?(String)) && !wp.empty?) || js_truthy?(p['bounds'])
    return nil unless on

    route = p['route']
    return Set[start_room] unless js_truthy?(p['multiRoom']) && route.is_a?(Array) && !route.empty?

    rooms = multi_room_route(json, route)
    rooms ? Set.new(rooms) | [start_room] : Set[start_room]
  end

  # validateMultiRoomRoute: every segment names a scenario room, its waypoints (when an array) all
  # have x and y, and each room connects to the next (the last loops back to the first). Returns the
  # route's rooms, or nil when the engine turns multiRoom off.
  def self.multi_room_route(json, route)
    rooms = json['rooms']
    ids = route.map do |seg|
      return nil unless seg.is_a?(Hash) && seg['room'].is_a?(String) && !seg['room'].empty? && rooms[seg['room']].is_a?(Hash)

      w = seg['waypoints']
      return nil if w.is_a?(Array) && !w.all? { |pt| pt.is_a?(Hash) && pt.key?('x') && pt.key?('y') }

      seg['room']
    end
    ids.each_with_index do |id, i|
      nxt = ids[(i + 1) % ids.length]
      conns = rooms[id]['connections']
      linked = conns.is_a?(Hash) && conns.values.any? { |v| (v.is_a?(Array) ? v : [v]).include?(nxt) }
      return nil unless linked
    end
    ids
  end

  # _judged: social_media, or work with a work plan. Their off and failed turn-backs speak
  # _failTopic, never the grumble family.
  def self.judged?(json, n, need)
    need == 'social_media' || (need == 'work' && AW.work_plan?(json, n))
  end

  def self.reach(json, n, ctx)
    ctx.reach[n] ||= VN.leash_reach(json, n, ctx.home_room[n])
  end

  # Can NPC `n` stand in `room` at some point? `room` nil is a dropped magnet, wherever it lies.
  def self.can_be_in?(_json, n, room, ctx)
    room.nil? || ctx.rooms[n].include?(room)
  end

  def self.knows?(n, o, ctx)
    ctx.knows[n].include?(o.object_id)
  end

  # Where each NPC can be, and which fixed magnets it can know of. Nothing in the needs engine
  # wanders: an NPC moves only to a source it may use for one of its needs (_select), a magnet it
  # knows of (_magnetsFor reads s.knows), the reveal slot of a print it owns (the fetch errand), an
  # interest item, a workaround visit, or along a patrol. So the rooms are the home and start
  # rooms, the rooms of usable world objects, the slot rooms of owned prints (errand_rooms), the
  # whole leash reach for an interest or a work plan (whose targets V10 does not model), and a
  # patrol's own rooms (patrol_rooms: the start room, or a multiRoom route, which the needs leash
  # does not govern). A magnet becomes known by sight (_sight: being in its room) or by word
  # (_tickNews: a knower at home away from it tells a hearer in that room); a known magnet it may
  # use adds its room. Repeat until nothing changes.
  def self.build_rooms(json, ctx)
    ctx.rooms = {}.compare_by_identity
    ctx.knows = {}.compare_by_identity
    ctx.npc_list.each do |n|
      r = Set[ctx.home_room[n], ctx.npc_room[n]]
      ctx.knows[n] = Set.new
      if runs?(n)
        ctx.world.each { |o| r << o.room if o.room && !fixed_magnet?(o) && can_use?(json, n, o, nil, ctx) }
        r.merge(errand_rooms(json, n, ctx, known: false))
        r.merge(reach(json, n, ctx)) if !interests_of(n).empty? || AW.work_plan?(json, n)
      end
      pr = patrol_rooms(json, n, ctx.npc_room[n])
      r.merge(pr) if pr
      ctx.rooms[n] = r
    end
    fixed = ctx.magnets.select { |o| fixed_magnet?(o) }
    actors = ctx.npc_list.select { |n| runs?(n) }
    loop do
      changed = false
      fixed.each do |o|
        actors.each do |m|
          if !knows?(m, o, ctx) && ctx.rooms[m].include?(o.room)
            ctx.knows[m] << o.object_id
            changed = true
          end
          next unless knows?(m, o, ctx) && !ctx.rooms[m].include?(o.room) && can_use?(json, m, o, nil, ctx, known: false)

          ctx.rooms[m] << o.room
          changed = true
        end
        news_pairs(o, actors, ctx).each do |_k, h|
          next if knows?(h, o, ctx)

          ctx.knows[h] << o.object_id
          changed = true
        end
      end
      break unless changed
    end
    ctx.tellers = {}.compare_by_identity
    fixed.each { |o| ctx.tellers[o] = news_pairs(o, actors, ctx).map(&:first).uniq(&:object_id) }
  end

  # [teller, hearer] pairs for a fixed magnet: _tickNews runs for a knower in its home room when
  # that is not the magnet's room; _newsHearers takes any other running NPC that can be in that
  # room, does not know yet and that neither avoids (groups do not matter). A magnet whose
  # newsRadius reads 0 is told to nobody (a hearer would have to stand on the teller's centre, and
  # NPC bodies collide). An NPC that starts in the room of a magnet shown from the start sees it on
  # its first tick, before any teller can be home, so it is never a hearer of that magnet.
  def self.news_pairs(o, actors, ctx)
    return [] if news_radius(o) <= 0

    seen_at_start = !revealed_later?(o)
    actors.select { |k| knows?(k, o, ctx) && ctx.home_room[k] != o.room }.flat_map do |k|
      home = ctx.home_room[k]
      actors.select do |h|
        !h.equal?(k) && ctx.rooms[h].include?(home) && !avoids_either?(k, h) &&
          !(seen_at_start && ctx.npc_room[h] == o.room)
      end.map { |h| [k, h] }
    end
  end

  # magnetOf: Number(newsRadius) clamped to 0..50, the default (above 0) when absent or not a number.
  def self.news_radius(o)
    m = magnet_of(o)
    v = m.key?('newsRadius') ? js_number(m['newsRadius']) : Float::NAN
    v.finite? ? v.clamp(0, 50) : NEWS_RADIUS_TILES
  end

  # _hidden: a revealOnGlobal object is not shown until its global holds, so it can be news later
  # even to an NPC that starts in its room.
  def self.revealed_later?(o)
    g = o.data['revealOnGlobal']
    g.is_a?(String) && !g.empty?
  end

  # The producer lists of an NPC's onUse print hooks that can print: _startJob rolls a hook only on
  # a use job of the hook's own object, and _completeJob prints only when that job was for a need
  # (so the NPC must be able to use the object for one), the roll succeeded (`chance` absent, not a
  # finite number, or above 0: a chance of 0, null or "" never prints) and the list is not empty.
  # The use counts through `satisfies` or, for social_media, the NPC's own station (social_home?).
  # `known: false` (the reach pass) does not ask whether a fixed magnet is known yet. Returns
  # [producer list, rooms of the hook's object] pairs.
  def self.hook_prints(json, n, ctx, known: true)
    return [] unless n['onUse'].is_a?(Hash)

    n['onUse'].filter_map do |obj_id, h|
      next unless h.is_a?(Hash)

      list = VN.printer_list(h['revealOutput'])
      next if list.empty?

      if h.key?('chance')
        c = js_number(h['chance'])
        next if c.finite? && c <= 0
      end
      objs = ctx.world.select { |o| o.id == obj_id && (can_use?(json, n, o, nil, ctx, known: known) || social_home?(json, n, o)) }
      next if objs.empty?

      [list, objs.map(&:room).uniq]
    end
  end

  def self.hook_print_lists(json, n, ctx, known: true)
    hook_prints(json, n, ctx, known: known).map(&:first)
  end

  # _socialCandidate: for social_media the NPC's own station (its needsHome, a desk by isDeskData)
  # is a source whatever its affordance says, so a print hook on it rolls on that use. A blocked or
  # locked-out station only costs a missed warning. A borrowed PC (_borrowCandidate) is another use
  # outside satisfies, but a hook on another NPC's PC is too unlikely to model.
  def self.social_home?(json, n, o)
    runs?(n) && needs_of(n).include?('social_media') && n['needsHome'].is_a?(String) &&
      o.id == n['needsHome'] && AW.social_station?(json, n, 'social_media')
  end

  # needs.print mapping producer lists, as control reads them: a string or a list is the producer,
  # an object its `producer`.
  def self.command_print_lists(n)
    Array(n['eventMappings']).filter_map do |em|
      pr = em.is_a?(Hash) && em['needs'].is_a?(Hash) ? em['needs']['print'] : nil
      spec = pr.is_a?(String) || pr.is_a?(Array) ? pr : (pr.is_a?(Hash) ? pr['producer'] : nil)
      list = VN.printer_list(spec)
      list.empty? ? nil : list
    end
  end

  # habits.print as _completeJob reads it (typeof 'object': an array counts, null does not).
  def self.print_habit?(n)
    h = n['habits'].is_a?(Hash) ? n['habits']['print'] : nil
    h.is_a?(Hash) || h.is_a?(Array)
  end

  # Producers whose prints this NPC owns and so fetches (_reserve, _errandCandidate): every needs.print
  # mapping (control always owns its print), and a print hook only with a habits.print. The errand
  # carries the slot to the needsHome object, so it needs one.
  def self.errand_producers(json, n, ctx, known: true)
    return [] unless n['needsHome'].is_a?(String) && ctx.world.any? { |o| o.id == n['needsHome'] }

    lists = command_print_lists(n)
    lists += hook_print_lists(json, n, ctx, known: known) if print_habit?(n)
    lists.flatten.uniq
  end

  # The rooms of a producer's reveal slots (outputOf) the leash lets this NPC walk to: where a
  # fetch errand goes (_errandCandidate checks _permitted on the slot, not the printer).
  def self.errand_rooms(json, n, ctx, known: true)
    prods = errand_producers(json, n, ctx, known: known)
    return [] if prods.empty?

    ctx.world.select { |o| o.room && prods.include?(o.data['outputOf']) && VN.leash_rule(json, n, o.room, ctx.home_room[n]).nil? }.map(&:room)
  end

  # May npc use obj for one of `needs` (default all its needs)? The engine runs it (runs?: a
  # phone contact with needs has no sprite and uses nothing), a need obj satisfies, no
  # leash/privacy rule bars it, and a fixed magnet is one it knows of (`known: false` skips that).
  def self.can_use?(json, npc, obj, _npcs, ctx, needs = needs_of(npc), known: true)
    use_block(json, npc, obj, ctx, needs, known: known).nil?
  end

  # The first rule in can_use? that stops `npc` using `obj`, as [kind, text, fix], or nil when it may.
  # The text and fix name the NPC, so a warning can say what to change.
  def self.use_block(json, npc, obj, ctx, needs = needs_of(npc), known: true)
    who = "'#{npc['id']}'"
    return [:phone_contact, "#{who} is a phone contact", "pair with an NPC who stands in a room instead of #{who}; a phone contact uses nothing"] if npc['npcType'] == 'phone'
    return [:not_run, "the needs engine does not run #{who} (it has no need or interest)", "give #{who} a need or interest, so the needs engine runs it"] unless runs?(npc)

    aff = obj.data['affordance']
    meets = aff.is_a?(Hash) ? VN.list(aff['satisfies']).select { |x| x.is_a?(String) } : []
    if (needs & meets).empty?
      return [:need, "#{who} has no need it meets" + (meets.empty? ? '' : " (it meets #{meets.join(', ')})"),
              "give #{who} a need '#{obj.id}' meets (affordance.satisfies)"]
    end
    if known && fixed_magnet?(obj) && !knows?(npc, obj, ctx)
      return [:unknown_magnet, "#{who} never learns of it",
              "let #{who} see '#{obj.id}' (start in its room, or have another reason to visit it) or be told of it"]
    end

    rule = VN.use_rule(json, npc, obj, ctx.home_room[npc], ctx.npc_list)
    return nil unless rule

    if rule.start_with?('it is private')
      [:private, "#{who} may not use it: #{rule}", "drop private from '#{obj.id}', or make #{who} one of its owners"]
    else
      [:leash, "#{who} may not use it: #{rule}", "let #{who} use room '#{obj.room}' (its needsRooms or needsAvoidRooms, or the room's needsPrivateTo)"]
    end
  end

  # _queueCfg: a queue is a Hash whose cells hold at least one numeric { dx, dy }.
  def self.queue?(q)
    return false unless q.is_a?(Hash) && q['cells'].is_a?(Array)

    num = ->(v) { v.is_a?(Numeric) || (v.is_a?(String) && !Float(v, exception: false).nil?) }
    q['cells'].any? { |c| c.is_a?(Hash) && num.call(c['dx']) && num.call(c['dy']) }
  end

  # _maxQueue: Math.max(0, floor(Number(maxQueue))), or no limit when absent or not a number.
  def self.max_queue(n)
    return nil if n['maxQueue'].nil?

    v = js_number(n['maxQueue'])
    v.finite? ? [0, v.floor].max : nil
  end

  # Does this object pair users a and b: Number(capacity) 2 or more (_maybePair), or a queue the second
  # joins (_tickQueueChats), which _balks refuses an NPC whose maxQueue is 0? With no pair given,
  # whether it can pair anyone.
  def self.pairs?(obj, a = nil, b = nil)
    aff = obj.data['affordance']
    return false unless aff.is_a?(Hash)
    cap = js_number(aff['capacity'])
    return true if cap.finite? && cap >= 2
    return false unless queue?(aff['queue'])

    a.nil? || b.nil? || max_queue(a) != 0 || max_queue(b) != 0
  end

  # Can NPC `n` and some compatible partner meet at an object with this chatter topic (both may use
  # it, it pairs)? If `n` is nil, any compatible pair in the scenario counts (a scenario-level pool).
  def self.chatter_pair?(json, topic, n, npcs, ctx)
    objs = ctx.by_topic[topic] || []
    objs.any? do |o|
      next false unless pairs?(o)

      users = ctx.npc_list.select { |m| can_use?(json, m, o, npcs, ctx) }
      if n
        users.any? { |u| u.equal?(n) } && users.any? { |m| !m.equal?(n) && compatible?(n, m) && pairs?(o, n, m) }
      else
        users.combination(2).any? { |a, b| compatible?(a, b) && pairs?(o, a, b) }
      end
    end
  end

  # ── turn-backs (npc-needs.js TURN_BACK, _recheck, _avoidedAt, _grumbleTopic) ────────────────

  # avoid: _recheck runs only for an NPC with _avoidRadius > 0, on a use job for a deferrable need.
  # _avoidedAt then turns it back from any use object (not its own needsHome) when an NPC it
  # avoids, or that avoids it, is using it, queued for it or standing near it in its room. Any NPC
  # counts, needs or not (it stays at its post), but not a phone contact, which has no position;
  # groups play no part; a requireGlobal avoid counts while its global holds.
  def self.avoid_turn_back?(json, n, npcs, ctx)
    return false if avoid_radius(n) <= 0

    needs = needs_of(n).reject { |k| n.dig('needs', k).is_a?(Hash) && n.dig('needs', k, 'deferrable') == false }
    return false if needs.empty?

    others = ctx.npc_list.reject { |m| m.equal?(n) || m['npcType'] == 'phone' }.select { |m| avoids_either?(n, m, conditional: true) }
    return false if others.empty?

    ctx.world.any? do |o|
      next false if n['needsHome'].is_a?(String) && o.id == n['needsHome']
      next false unless can_use?(json, n, o, npcs, ctx, needs)

      others.any? { |m| can_be_in?(json, m, o.room, ctx) }
    end
  end

  # off: a world object with offWhen that `n` walks to for a need that is not judged.
  def self.off_turn_back?(json, n, npcs, ctx)
    needs = needs_of(n).reject { |k| judged?(json, n, k) }
    ctx.world.any? do |o|
      o.data['offWhen'] && can_use?(json, n, o, npcs, ctx, needs)
    end
  end

  # gone: a magnet with servings that `n` knows of and may use (need, leash, privacy). Every such
  # magnet runs out (magnetOf: servings default 1, at most 1000), and a hidden one is gone too.
  def self.gone_turn_back?(json, n, npcs, ctx)
    ctx.magnets.any? { |o| can_use?(json, n, o, npcs, ctx) }
  end

  # printer_off: an onUse print hook that can print (hook_print_lists) all of whose producers have
  # offWhen. _printBlocked speaks grumble_printer_off only (no fallback to grumble), and only from
  # _completeJob: a needs.print mapping goes through control with viaCommand, which never speaks.
  # In a list of two or more, _pickProducer also treats a producer the world does not know as off
  # (its room not loaded: the live getObject finds only sprites in loaded rooms). The hook object's
  # room is loaded while the NPC uses it, so a producer there is known; one in another room, or not
  # a world object at all, can be off.
  def self.printer_off_turn_back?(json, n, _npcs, ctx)
    return false unless runs?(n)

    hook_prints(json, n, ctx).any? do |list, rooms|
      list.all? do |id|
        objs = ctx.world.select { |x| x.id == id }
        next true if list.length >= 2 && (objs.empty? || objs.any? { |o| !rooms.include?(o.room) })

        objs.any? { |o| o.data['offWhen'] }
      end
    end
  end

  # chatterPool merges the scenario pool and the NPC's own: does `n` have lines for `topic`?
  def self.merged_lines?(json, n, topic)
    sc = json['chatter'].is_a?(Hash) ? json['chatter'] : {}
    own = n['chatter'].is_a?(Hash) ? n['chatter'] : {}
    !VN.pool_lines(sc[topic]).empty? || !VN.pool_lines(own[topic]).empty?
  end

  # Is `topic` (a grumble-family pool) spoken by NPC `n`?
  def self.grumble_for?(json, topic, n, npcs, ctx)
    case topic
    when 'grumble'
      avoid_turn_back?(json, n, npcs, ctx) ||
        (off_turn_back?(json, n, npcs, ctx) && !merged_lines?(json, n, 'grumble_off')) ||
        (gone_turn_back?(json, n, npcs, ctx) && !merged_lines?(json, n, 'grumble_gone'))
    when 'grumble_off' then off_turn_back?(json, n, npcs, ctx)
    when 'grumble_gone' then gone_turn_back?(json, n, npcs, ctx)
    when 'grumble_printer_off' then printer_off_turn_back?(json, n, npcs, ctx)
    end
  end

  # ── phones (onPhoneRing, _ownerAnswers, _claimAnswerer) ─────────────────────────────────────

  def self.rung_phones(ctx)
    ctx.phones.select { |p| ctx.rung.include?(p.id) }
  end

  # _tickRings answers for an owner only through this.states: an owner the engine does not run
  # never picks up, and the phone rings out (or a colleague claims it).
  def self.owns_rung_phone?(n, ctx)
    !n['id'].nil? && runs?(n) && rung_phones(ctx).any? { |p| p.data['owner'] == n['id'] }
  end

  # _claimAnswerer: a running answersPhones NPC, idle at its post in the phone's room (its home
  # room is that room), that does not avoid the owner either way (checked only for a running owner,
  # as the engine reads the owner from this.states).
  def self.answers_rung_phone?(_json, n, _npcs, ctx)
    return false unless n['answersPhones'] == true && runs?(n)

    rung_phones(ctx).any? do |p|
      owner_id = p.data['owner']
      next false if owner_id == n['id'] || ctx.home_room[n] != p.room

      owner = ctx.npc_list.find { |m| m['id'] == owner_id && runs?(m) }
      !(owner && avoids_either?(n, owner))
    end
  end

  # ── news (_sight, _tickNews, _newsHearers) ──────────────────────────────────────────────────

  # The NPCs that can announce this magnet (build_rooms). A held (droppable) magnet has no
  # fixed room, so it is not judged: whoever is near where it is dropped can tell.
  def self.news_tellers(_json, o, ctx)
    return ctx.npc_list.select { |n| runs?(n) } unless fixed_magnet?(o)

    ctx.tellers[o] || []
  end

  def self.announce_triggerable?(json, topic, n, ctx)
    (ctx.announce[topic] || []).any? do |o|
      tellers = news_tellers(json, o, ctx)
      n ? tellers.any? { |t| t.equal?(n) } : !tellers.empty?
    end
  end

  # ── pools ────────────────────────────────────────────────────────────────────────────────────

  def self.pool_topics(pools)
    pools.is_a?(Hash) ? pools.keys.reject { |k| k == '_comment' } : []
  end

  # "has 1 line ... speak it" or "has 3 lines ... speak them".
  def self.lines_phrase(pool)
    k = VN.pool_lines(pool).length
    k == 1 ? ['1 line', 'it'] : ["#{k} lines", 'them']
  end

  def self.check_pools(json, npcs, ctx, issues)
    scenario = json['chatter']
    pool_topics(scenario).each do |topic|
      next if VN.pool_lines(scenario[topic]).empty?

      ok, why, fix = topic_triggerable?(json, topic, nil, npcs, ctx)
      issues << "⚠️ WARNING: scenario chatter pool '#{topic}' has #{lines_phrase(scenario[topic])[0]} but no NPC will ever speak #{lines_phrase(scenario[topic])[1]}: #{why}. To fix: #{fix}; or remove the lines." unless ok
    end
    npcs.each do |_r, n|
      next unless n['chatter'].is_a?(Hash)

      pool_topics(n['chatter']).each do |topic|
        next if VN.pool_lines(n['chatter'][topic]).empty?

        ok, why, fix = topic_triggerable?(json, topic, n, npcs, ctx)
        issues << "⚠️ WARNING: NPC '#{n['id']}' chatter pool '#{topic}' has #{lines_phrase(n['chatter'][topic])[0]} but that NPC will never speak #{lines_phrase(n['chatter'][topic])[1]}: #{why}. To fix: #{fix}; or remove the lines." unless ok
      end
    end
  end

  # [said when it can happen, said when it cannot, the fix]
  GRUMBLE_REASON = {
    'grumble' => ['an avoidance turn-back, or an off or gone turn-back with no lines of its own, can happen',
                  'no avoidance turn-back can happen (that needs an avoid radius above 0 and an avoided NPC who can be at a source this NPC uses), and no off or gone turn-back falls back to it',
                  'give the NPC needsCompany.avoids naming an NPC who can be at a source it uses, with avoidRadius above 0 or unset (the default is 2 tiles)'],
    'grumble_off' => ['a dead-machine (offWhen) turn-back can happen',
                      'no source it uses for a need that is not judged has an offWhen',
                      'give an offWhen to a source the NPC uses for a need other than social_media (or work with a work plan, which speaks its own failure pools)'],
    'grumble_gone' => ['a magnet can run out', 'no magnet this NPC knows of and may use, so none can run out on it',
                       'give the NPC a need that a magnet it can reach meets, and a way to see it or be told of it'],
    'grumble_printer_off' => ['a print with every listed printer off can happen',
                              'no onUse print hook on an object it uses for a need lists only printers that can be off',
                              'add an onUse hook with revealOutput on an object the NPC uses for a need, and give every printer in that list an offWhen']
  }.freeze

  # The NPCs a pool's warning is about: `n`, or every NPC for a scenario-level pool.
  def self.who_phrase(n)
    n ? "'#{n['id']}'" : 'any NPC'
  end

  # [triggerable?, reason, fix]. `n` nil for a scenario-level pool (any NPC). V10 judges every
  # office-life topic; a topic another subsystem speaks (work failures, access workarounds) is left
  # to that subsystem's check, and a topic nothing speaks at all is a warning.
  def self.topic_triggerable?(json, topic, n, npcs, ctx)
    who = n ? [n] : ctx.npc_list
    if GRUMBLE_TOPICS.include?(topic)
      ok = who.any? { |m| grumble_for?(json, topic, m, npcs, ctx) }
      can, cannot, fix = GRUMBLE_REASON[topic]
      return [ok, ok ? can : cannot, fix]
    end
    if topic == 'phone'
      return [true, 'an owner answers a rung phone'] if who.any? { |m| owns_rung_phone?(m, ctx) }

      return [false, *phone_owner_reason(n, ctx)]
    end
    if topic == 'phone_message'
      return [true, 'a colleague answers a rung phone'] if who.any? { |m| answers_rung_phone?(json, m, npcs, ctx) }

      return [false, *phone_answer_reason(n, ctx)]
    end
    tried = []
    fixes = []
    if ctx.announce.key?(topic)
      return [true, 'an NPC can tell people about the magnet'] if announce_triggerable?(json, topic, n, ctx)

      tried << 'no NPC can see the magnet and then, in its own home room away from the magnet, tell another NPC'
      fixes << 'give an NPC who can see the magnet a home room away from it, and another NPC who can be in that home room to hear'
    end
    if ctx.by_topic.key?(topic)
      return [true, 'a compatible pair can share the object'] if chatter_pair?(json, topic, n, npcs, ctx)

      why, fix = chatter_reason(json, ctx.by_topic[topic], n, ctx)
      tried << why
      fixes << fix
    end
    return [false, tried.join('; '), fixes.join('; ')] unless tried.empty?
    return [false, 'no magnet without its own announce pool, so nobody tells news', 'add a magnet (affordance.magnet) with no announce pool of its own'] if topic == 'news'
    if OFFICE_TOPICS.include?(topic)
      return [false, "no object has affordance.chatter \"#{topic}\"", "give an object affordance.chatter \"#{topic}\" with capacity 2 or a queue"]
    end
    return [true, 'spoken by another engine subsystem (work failures or access workarounds); outside V10'] if other_subsystem_topic?(topic)

    [false, 'the needs engine speaks no pool for this topic (not a chatter object, magnet announce, grumble, work-failure or phone topic)',
     'rename the pool to a topic the engine speaks, such as the affordance.chatter of an object or a magnet\'s announce']
  end

  # ── why a chatter object pairs nobody (V10 R2 design review M5) ─────────────────────────────

  # The capacity check in validate_npc_needs.rb (check_social) fires for this object too.
  def self.capacity_warned?(o)
    aff = o.data['affordance']
    cap = aff['capacity'] || 1
    cap = cap.respond_to?(:to_i) ? cap.to_i : 0
    cap < 2 && !aff['queue'].is_a?(Hash)
  end

  def self.seat_block(o)
    [:seat, 'it seats one and has no queue' + (capacity_warned?(o) ? ', as the capacity warning above says' : ''),
     "set '#{o.id}' affordance.capacity to 2 or more, or give it a queue"]
  end

  # The first rule that stops `a` and `b` meeting at `o`, which pairs? someone: [kind, text, fix] or nil.
  def self.pair_block(json, o, a, b, ctx)
    [a, b].each { |m| (r = use_block(json, m, o, ctx)) && (return r) }
    if avoids_either?(a, b)
      x, y = avoids_one_way?(a, b) ? [a, b] : [b, a]
      return [:avoid, "'#{x['id']}' avoids '#{y['id']}'", "drop '#{y['id']}' from the needsCompany.avoids of '#{x['id']}'"]
    end
    pair = "'#{a['id']}' and '#{b['id']}'"
    return [:groups, "#{pair} share no needsCompany group", "give #{pair} a shared needsCompany group, or leave one of them with none"] unless compatible?(a, b)
    unless pairs?(o, a, b)
      return [:max_queue, "#{pair} both have maxQueue 0, so neither joins its queue",
              "raise maxQueue above 0 for one of #{pair}, or set '#{o.id}' capacity to 2"]
    end

    nil
  end

  # How near each block is to letting the pair meet (V10 design review R3 M4): a pair rule (avoid,
  # groups, maxQueue) or the object's own seat comes first, then the object being private to its
  # owners, then a partner with no need it meets, then an NPC the engine does not run. A room leash
  # (needsRooms, needsAvoidRooms, needsPrivateTo) is the far miss: the pair would also have to be
  # let into another room. A need miss counts as far when either NPC is leashed out of the room too.
  NEAR_RANK = { avoid: 0, groups: 0, max_queue: 0, seat: 0, lone: 0, private: 1, need: 2, unknown_magnet: 2,
                not_run: 3, phone_contact: 3 }.freeze
  FAR_RANK = 4

  def self.block_rank(json, o, block, who, ctx)
    r = NEAR_RANK.fetch(block[0], FAR_RANK)
    return r unless %i[need unknown_magnet].include?(block[0])

    leashed = who.compact.any? do |m|
      rule = runs?(m) && VN.use_rule(json, m, o, ctx.home_room[m], ctx.npc_list)
      rule && !rule.start_with?('it is private')
    end
    leashed ? FAR_RANK : r
  end

  # [[rank, block]] sorted nearest first (stable, so scenario order breaks ties); far misses are
  # dropped whenever a nearer one exists, so the fix never opens a room to bystanders.
  def self.rank_blocks(json, o, pairs, ctx)
    ranked = pairs.each_with_index.map { |(who, b), i| [block_rank(json, o, b, who, ctx), i, b] }
    ranked = ranked.reject { |r, _, _| r == FAR_RANK } if ranked.any? { |r, _, _| r < FAR_RANK }
    ranked.sort_by { |r, i, _| [r, i] }.map { |r, _, b| [r, b] }
  end

  # The ranked blocks at one object for pool owner `n` (nil: any pair) and its possible partners.
  def self.object_blocks(json, o, n, ctx)
    return [[0, seat_block(o)]] unless pairs?(o)

    unless n
      users = ctx.npc_list.select { |m| can_use?(json, m, o, nil, ctx) }
      if users.length >= 2
        return rank_blocks(json, o, users.combination(2).filter_map { |x, y| (b = pair_block(json, o, x, y, ctx)) && [[x, y], b] }, ctx)
      elsif users.empty?
        runners = ctx.npc_list.select { |m| runs?(m) }
        return [[0, [:lone, 'no NPC the needs engine runs', "give two NPCs a need '#{o.id}' meets"]]] if runners.empty?

        return rank_blocks(json, o, runners.filter_map { |m| (b = use_block(json, m, o, ctx)) && [[m], b] }, ctx)
      end
      n = users.first
    end
    (r = use_block(json, n, o, ctx)) && (return rank_blocks(json, o, [[[n], r]], ctx))
    others = ctx.npc_list.reject { |m| m.equal?(n) || !runs?(m) }
    return [[0, [:lone, "'#{n['id']}' is the only NPC the needs engine runs", "add a second NPC with a need '#{o.id}' meets"]]] if others.empty?

    rank_blocks(json, o, others.filter_map { |m| (b = pair_block(json, o, n, m, ctx)) && [[n, m], b] }, ctx)
  end

  def self.shown(list, noun)
    return list.join(', ') if list.length <= SHOWN

    "#{list.first(SHOWN).join(', ')} and #{list.length - SHOWN} more #{noun}"
  end

  # [reason, fix] for a chatter-object topic no pair can speak: each object, and the first rule
  # that stopped each partner there; the fixes for the rules named.
  def self.chatter_reason(json, objs, n, ctx)
    blocks_why(objs.uniq(&:object_id).map { |o| [o, object_blocks(json, o, n, ctx)] })
  end

  # [reason, fix] from [object, ranked blocks] pairs; the fixes follow the objects and partners
  # shown. Objects whose nearest block is nearer come first; objects that only far misses stop are
  # dropped while another object has a nearer one. The fixes are those of the nearest blocks.
  def self.blocks_why(per_obj)
    per_obj = per_obj.reject { |_o, rb| rb.empty? }
    best = ->(rb) { rb.map(&:first).min }
    per_obj = per_obj.each_with_index.sort_by { |(_o, rb), i| [best.call(rb), i] }.map(&:first)
    per_obj = per_obj.reject { |_o, rb| best.call(rb) == FAR_RANK } if per_obj.any? { |_o, rb| best.call(rb) < FAR_RANK }
    top = per_obj.map { |_o, rb| best.call(rb) }.min
    fixes = []
    parts = per_obj.first(SHOWN).map do |o, rb|
      fixes.concat(rb.first(SHOWN).select { |r, _| r == top }.map { |_, b| b.last })
      "at '#{o.id}': #{shown(rb.map { |_, b| b[1] }.uniq, 'NPCs')}"
    end
    parts << "and #{per_obj.length - SHOWN} more objects" if per_obj.length > SHOWN
    [parts.join('; '), fixes.uniq.join('; ')]
  end

  # ── why nobody answers (phone, phone_message) ──────────────────────────────────────────────

  # A desk_phone_ring:<id> emit whose id is no desk phone's (design review R3 m3): likely a typo.
  def self.stray_rings(ctx)
    ids = ctx.world.select { |o| o.data['deskPhone'] == true }.map(&:id)
    (ctx.rung.to_a - ids).sort
  end

  def self.ring_fix(phones, ctx)
    ids = phones.map(&:id).uniq
    fix = "have an event mapping, a needs hook or an emit_event action emit #{ids.map { |i| "desk_phone_ring:#{i}" }.join(' or ')}"
    stray = stray_rings(ctx)
    return fix if stray.empty?

    "#{fix} (the scenario emits #{stray.map { |i| "desk_phone_ring:#{i}" }.join(' and ')}, but no desk phone has the id #{stray.map { |i| "'#{i}'" }.join(' or ')}: check the spelling)"
  end

  # [reason, fix] when no owner answers a rung phone.
  def self.phone_owner_reason(n, ctx)
    if n
      return ["the needs engine does not run '#{n['id']}' (it has no need or interest), so it never picks up", "give '#{n['id']}' a need or interest"] unless runs?(n)

      own = ctx.phones.select { |p| p.data['owner'] == n['id'] }
      return ["'#{n['id']}' owns no deskPhone", "give '#{n['id']}' a deskPhone with owner \"#{n['id']}\", and have something emit desk_phone_ring:<that phone's id>"] if own.empty?

      return ["nothing rings #{shown(own.map { |p| "'#{p.id}'" }.uniq, 'phones')}", ring_fix(own, ctx)]
    end
    return ['no deskPhone has an owner', 'give a deskPhone an owner the needs engine runs, and have something emit desk_phone_ring:<its id>'] if ctx.phones.empty?

    unrung = ctx.phones.reject { |p| ctx.rung.include?(p.id) }
    return ["nothing rings #{shown(unrung.map { |p| "'#{p.id}'" }.uniq, 'phones')}", ring_fix(unrung, ctx)] if unrung.length == ctx.phones.length

    ['the needs engine runs no owner of a rung phone (an owner needs a need or interest)', 'give the owner of a rung phone a need or interest']
  end

  # [reason, fix] when no colleague answers a rung phone.
  def self.phone_answer_reason(n, ctx)
    fix = 'set answersPhones: true on an NPC the needs engine runs whose home room holds another NPC\'s rung desk phone, and who does not avoid that owner'
    if n
      return ["'#{n['id']}' does not have answersPhones: true", fix] unless n['answersPhones'] == true
      return ["the needs engine does not run '#{n['id']}' (it has no need or interest)", "give '#{n['id']}' a need or interest"] unless runs?(n)
      return ['nothing rings any desk phone', ring_fix(ctx.phones, ctx)] if rung_phones(ctx).empty? && !ctx.phones.empty?

      return ["no rung desk phone of another NPC is in its home room '#{ctx.home_room[n]}', or that phone's owner and it avoid each other", fix]
    end
    ['no answersPhones NPC that the needs engine runs is at home in the room of another NPC\'s rung phone', fix]
  end

  # ── exchanges and calls ──────────────────────────────────────────────────────────────────────

  def self.check_knots(json, npcs, ctx, issues)
    by_id = npcs.to_h { |_r, n| [n['id'], n] }
    entries = Hash.new { |h, k| h[k] = [] }   # knot -> [[npc, kind, with]]
    npcs.each do |_r, n|
      if n['exchanges'].is_a?(Array)
        n['exchanges'].each do |e|
          next unless e.is_a?(Hash) && e['knot'].is_a?(String)

          entries[e['knot']] << [n, 'exchange', e['with']]
          next unless e['with'].is_a?(String)

          partners = exchange_partners(n, e['with'], by_id, npcs)
          next if partners.any? { |p| share_any_object?(json, n, p, npcs, ctx) }

          issues << "⚠️ WARNING: NPC '#{n['id']}' exchange '#{e['knot']}' (with '#{e['with']}') can never play: #{exchange_reason(json, n, partners, ctx)}"
        end
      end
      next unless n['phoneCalls'].is_a?(Array)

      n['phoneCalls'].each do |e|
        next unless e.is_a?(Hash) && e['knot'].is_a?(String)

        entries[e['knot']] << [n, 'phoneCalls', nil]
        next if owns_rung_phone?(n, ctx) || answers_rung_phone?(json, n, npcs, ctx)

        issues << "⚠️ WARNING: NPC '#{n['id']}' phoneCalls knot '#{e['knot']}' can never play: #{call_reason(n, ctx)}"
      end
    end
    # _exchangeHeard is shared by exchanges and calls: one heard_<knot> global per knot name.
    entries.each do |knot, list|
      next if list.length < 2
      next if mirrored_pair?(list, npcs)

      desc = list.map { |n, kind, with| kind == 'exchange' ? "#{n['id']} exchange with #{with}" : "#{n['id']} phoneCalls" }
      issues << "⚠️ WARNING: knot '#{knot}' is used by more than one exchange or phone call (#{desc.join('; ')}); heard_#{knot} is one global by name, so hearing one silences the others."
    end
  end

  # `a` lists the knot with `b` and `b` lists it with `a`: one exchange, written on both NPCs. A
  # group `with` counts when the group's only other member is the partner.
  def self.mirrored_pair?(list, npcs)
    return false unless list.length == 2 && list.all? { |_n, kind, _w| kind == 'exchange' }

    (a, _, wa), (b, _, wb) = list
    names = lambda do |n, with, partner|
      next false unless with.is_a?(String)
      next with == partner['id'] unless with.start_with?('group:')

      members = exchange_partners(n, with, {}, npcs)
      members.length == 1 && members.first.equal?(partner)
    end
    !a.equal?(b) && names.call(a, wa, b) && names.call(b, wb, a)
  end

  def self.exchange_partners(n, with, by_id, npcs)
    if with.start_with?('group:')
      g = with[6..]
      npcs.map(&:last).select { |m| !m.equal?(n) && groups(m).include?(g) }
    else
      [by_id[with]].compact
    end
  end

  # Why an exchange never plays: the pair meet at no chatter object. Names each object and the
  # rule that stopped each partner, with the fixes for those rules.
  def self.exchange_reason(json, n, partners, ctx)
    objs = ctx.by_topic.values.flatten.uniq(&:object_id)
    return 'it has no partner: no NPC is in that group.' if partners.empty?
    return 'no object has an affordance.chatter, so no pair ever meets to speak. To fix: give an object they both use affordance.chatter, with capacity 2 or a queue.' if objs.empty?

    why, fix = blocks_why(objs.map { |o| [o, pairs?(o) ? rank_blocks(json, o, partners.filter_map { |p| (b = pair_block(json, o, n, p, ctx)) && [[n, p], b] }, ctx) : [[0, seat_block(o)]]] })
    "the two never meet at a chatter object: #{why}. To fix: #{fix}."
  end

  # Why a phoneCalls knot never plays: the NPC answers no rung phone, as owner or colleague. Points
  # at validate_npc_needs.rb's phoneCalls warning when that fires for the same cause.
  def self.call_reason(n, ctx)
    owned = ctx.phone_owners.include?(n['id'])
    see = !owned && n['answersPhones'] != true ? ' (the phoneCalls warning above has the same cause)' : ''
    if !runs?(n)
      "the needs engine does not run this NPC (it has no need or interest), so it never picks up#{see}. To fix: give it a need or interest."
    elsif n['answersPhones'] == true && !owned
      "#{phone_answer_reason(n, ctx).first}. To fix: #{phone_answer_reason(n, ctx).last}."
    else
      why, fix = phone_owner_reason(n, ctx)
      fix += '; or set answersPhones: true on it, with its home in the room of a colleague\'s rung phone' unless n['answersPhones'] == true
      "#{why}, and it answers no colleague's phone#{see}. To fix: #{fix}."
    end
  end

  def self.share_any_object?(json, a, b, npcs, ctx)
    return false unless compatible?(a, b)

    ctx.by_topic.values.flatten.uniq.any? do |o|
      pairs?(o, a, b) && can_use?(json, a, o, npcs, ctx) && can_use?(json, b, o, npcs, ctx)
    end
  end
end
