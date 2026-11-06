# frozen_string_literal: true

# NPC needs system lints (docs/achitechture/NPC_NEEDS_SYSTEM.md section 11).
#
# Entry point: ValidateNpcNeeds.check(json) returns issue strings: "❌ ERROR ..." for
# errors, "⚠️ WARNING ..." for warnings, and "ℹ️ NPC needs ..." for the per-need
# timing report (T1 = minutes to the first beat, P = minutes between top-ups).
# A scenario with no NPC `needs`/`interests` and no `droppable` item gets no output.
require 'json'

module ValidateNpcNeeds
  T1_WARN_MIN = 5.0

  Obj = Struct.new(:id, :room, :data, :x, :y, keyword_init: true)

  def self.check(json)
    return [] unless json.is_a?(Hash) && json['rooms'].is_a?(Hash)

    objs = []
    npcs = []
    json['rooms'].each do |room_id, room|
      next unless room.is_a?(Hash)

      Array(room['objects']).each { |o| collect(o, room_id, objs) }
      Array(room['npcs']).each do |n|
        next unless n.is_a?(Hash)

        npcs << [room_id, n]
        Array(n['itemsHeld']).each { |o| collect(o, room_id, objs) }
      end
    end
    Array(json['startItemsInInventory']).each { |o| collect(o, nil, objs) }

    issues = []
    objs = expand_presets(json, objs, issues)
    droppables = objs.select { |o| o.data['droppable'] == true }
    droppables.each do |o|
      magnet = o.data['affordance'].is_a?(Hash) && o.data['affordance']['magnet'].is_a?(Hash)
      issues << "⚠️ WARNING: item '#{o.id || o.data['name']}' is droppable without a needsTag — dropping it will not attract any NPC." unless o.data['needsTag'].is_a?(String) || magnet
      issues << "❌ ERROR: droppable item '#{o.data['name']}' has no id; the drop is saved by id, so give it a unique one." if o.id.to_s.empty?
    end

    check_private(json, npcs, objs, issues)
    check_visuals(json, objs, issues)
    check_slots(json, objs, issues)
    check_left_behind(json, npcs, objs, issues)
    check_social(json, npcs, objs, issues)
    check_exchanges(json, npcs, issues)
    check_queues(json, npcs, objs, issues)
    npcs.each { |room_id, npc| check_npc(json, npc, room_id, objs, issues, npcs) }
    check_swivel(npcs, issues)
    check_lock_habits(json, npcs, objs, issues)
    check_off_when(json, npcs, objs, issues)
    check_print_habits(json, npcs, objs, issues)
    check_magnets(json, npcs, objs, issues)
    issues
  end

  # Slice 18b-i (OFFICE_LIFE_PLAN 12.4): a magnet is a droppable held item carrying
  # affordance.magnet, dropped anywhere (item-drop.js). It needs a fixed id (the servings global and
  # the decision log are keyed on it) and no needsTag (an interested NPC would carry it off); the
  # engine-owned <id>_servings global is declared at the starting count; tempt, servings and
  # perPerson are numbers in range; satisfies names a need some NPC has. A magnet as a room object
  # (the declared spot) is not built yet.
  def self.check_magnets(json, npcs, objs, issues)
    globals = json['globalVariables'].is_a?(Hash) ? json['globalVariables'] : {}
    have = npcs.flat_map { |_, n| n['needs'].is_a?(Hash) ? n['needs'].keys : [] }.uniq
    objs.each do |o|
      aff = o.data['affordance']
      next unless aff.is_a?(Hash) && aff.key?('magnet')

      m = aff['magnet']
      label = o.id || o.data['name'] || o.data['type']
      unless m.is_a?(Hash)
        issues << "❌ ERROR: item '#{label}' affordance.magnet must be an object ({ tempt, servings, perPerson })."
        next
      end
      unless o.data['droppable'] == true && o.room.nil?
        issues << "⚠️ WARNING: '#{label}' has affordance.magnet but is not a droppable item the player holds; only a dropped magnet is built (slice 18b-i), so it draws nobody."
      end
      issues << "❌ ERROR: magnet item '#{label}' has no id; its servings global and the decision log are keyed on the item's id, so give it a fixed one." if o.id.to_s.empty?
      issues << "❌ ERROR: magnet item '#{label}' has a needsTag; an NPC with that interest would pick it up and carry it off. Remove it." if o.data.key?('needsTag')
      { 'tempt' => [0, 95], 'servings' => [1, 1000], 'perPerson' => [1, 1000] }.each do |k, (lo, hi)|
        next unless m.key?(k)

        v = m[k]
        issues << "❌ ERROR: magnet '#{label}' magnet.#{k} must be a number from #{lo} to #{hi} (got #{v.inspect})." unless v.is_a?(Numeric) && v >= lo && v <= hi
      end
      servings = m['servings'].is_a?(Numeric) ? m['servings'].floor : 1
      unless o.id.to_s.empty?
        key = "#{o.id}_servings"
        if !globals.key?(key)
          issues << "❌ ERROR: magnet '#{o.id}' needs '#{key}' declared in globalVariables at #{servings} (the engine saves the servings left there, so a reload keeps a half-eaten one)."
        elsif globals[key] != servings
          issues << "❌ ERROR: magnet '#{o.id}' globalVariables '#{key}' is #{globals[key].inspect}; declare it at the starting count, #{servings}."
        end
      end
      Array(aff['satisfies']).each do |need|
        next if have.include?(need)

        issues << "⚠️ WARNING: magnet '#{label}' satisfies '#{need}', which no NPC has; nobody will come for that."
      end
    end
  end

  # Slice 17 (OFFICE_LIFE_PLAN 12.3): print and forget. A hook's chance (0-1); printHabit's shape
  # and bounds; a mapping's needs.print command; affordance.uncollectedAfterSeconds. An owner (a
  # printHabit or a print command) needs a needsHome object, where the errand takes the print; a
  # habit with nothing that prints for it does nothing; a producer in a room the owner may not
  # reach is never fetched from. Per producer, slots against printing NPCs (forgotten prints hold
  # slots until a reload or a recycle).
  PRINT_HABIT_KEYS = %w[fetchAfterSeconds forgetChance weight shareAfterSeconds _comment].freeze

  def self.fetch_range_ok?(v)
    v.is_a?(Array) && v.length == 2 && v.all? { |x| x.is_a?(Numeric) && x >= 0 && x <= 3600 } && v[0] <= v[1]
  end

  def self.check_print_habits(json, npcs, objs, issues)
    by_id = objs.select(&:id).group_by(&:id)
    printers = Hash.new { |h, k| h[k] = [] }
    objs.each do |o|
      v = o.data.dig('affordance', 'uncollectedAfterSeconds')
      next if v.nil? || (v.is_a?(Numeric) && v >= 0 && v <= 3600)

      issues << "❌ ERROR: object '#{o.id}' affordance.uncollectedAfterSeconds must be seconds from 0 to 3600 (default 60)."
    end
    npcs.each do |npc_room, npc|
      where = "NPC '#{npc['id']}'"
      hooks = npc['onUse'].is_a?(Hash) ? npc['onUse'] : {}
      hooked = []
      hooks.each do |oid, hook|
        next unless hook.is_a?(Hash)

        if hook.key?('chance') && !(hook['chance'].is_a?(Numeric) && hook['chance'] >= 0 && hook['chance'] <= 1)
          issues << "❌ ERROR: #{where} onUse '#{oid}' chance must be a number from 0 to 1 (default 1)."
        end
        issues << "⚠️ WARNING: #{where} onUse '#{oid}' sets chance without revealOutput; chance applies to prints only." if hook.key?('chance') && !hook.key?('revealOutput')
        hooked << hook['revealOutput'] if hook['revealOutput'].is_a?(String)
      end
      commanded = []
      Array(npc['eventMappings']).each do |m|
        next unless m.is_a?(Hash) && m['needs'].is_a?(Hash) && m['needs'].key?('print')

        cmd = m['needs']['print']
        spec = cmd.is_a?(String) ? { 'producer' => cmd } : cmd
        unless spec.is_a?(Hash) && spec['producer'].is_a?(String)
          issues << "❌ ERROR: #{where} mapping '#{m['eventPattern']}' needs.print must be a producer id or { producer, fetchAfterSeconds, forget }."
          next
        end
        prod = spec['producer']
        if by_id.key?(prod)
          commanded << prod
          issues << "⚠️ WARNING: #{where} mapping '#{m['eventPattern']}' prints to '#{prod}', but no object has outputOf '#{prod}'; every print is only a cosmetic copy." if objs.none? { |o| o.data['outputOf'] == prod }
        else
          issues << "❌ ERROR: #{where} mapping '#{m['eventPattern']}' needs.print producer '#{prod}' is not an object id in this scenario."
        end
        if spec.key?('fetchAfterSeconds') && !fetch_range_ok?(spec['fetchAfterSeconds'])
          issues << "❌ ERROR: #{where} mapping '#{m['eventPattern']}' needs.print fetchAfterSeconds must be [min, max] seconds, 0 <= min <= max <= 3600."
        end
        issues << "❌ ERROR: #{where} mapping '#{m['eventPattern']}' needs.print forget must be true or false." if spec.key?('forget') && ![true, false].include?(spec['forget'])
      end
      habit = npc['printHabit']
      unless habit.nil?
        if habit.is_a?(Hash)
          (habit.keys - PRINT_HABIT_KEYS).each { |k| issues << "⚠️ WARNING: #{where} printHabit has unknown key '#{k}'." }
          if habit.key?('fetchAfterSeconds') && !fetch_range_ok?(habit['fetchAfterSeconds'])
            issues << "❌ ERROR: #{where} printHabit.fetchAfterSeconds must be [min, max] seconds, 0 <= min <= max <= 3600 (default [20, 60])."
          end
          issues << "❌ ERROR: #{where} printHabit.forgetChance must be a number from 0 to 1 (default 0)." if habit.key?('forgetChance') && !(habit['forgetChance'].is_a?(Numeric) && habit['forgetChance'] >= 0 && habit['forgetChance'] <= 1)
          issues << "❌ ERROR: #{where} printHabit.weight must be 0.1 to 10 (default 2)." if habit.key?('weight') && !(habit['weight'].is_a?(Numeric) && habit['weight'] >= 0.1 && habit['weight'] <= 10)
          issues << "❌ ERROR: #{where} printHabit.shareAfterSeconds must be seconds > 0 (unset: a forgotten print stays reserved)." if habit.key?('shareAfterSeconds') && !(habit['shareAfterSeconds'].is_a?(Numeric) && habit['shareAfterSeconds'].positive?)
        else
          issues << "❌ ERROR: #{where} printHabit must be an object."
        end
        if hooked.empty? && commanded.empty?
          issues << "⚠️ WARNING: #{where} has a printHabit but no revealOutput hook and no mapping print command; nothing prints as it, so the habit does nothing."
        end
      end
      owner_prods = (habit.nil? ? [] : hooked) + commanded
      owner_prods.uniq.each { |prod| printers[prod] << npc['id'] }
      hooked.uniq.each { |prod| printers[prod] << npc['id'] unless printers[prod].include?(npc['id']) }
      next if owner_prods.empty?

      home = npc['needsHome']
      home_obj = home.is_a?(String) ? by_id[home]&.first : nil
      unless home_obj
        issues << "❌ ERROR: #{where} owns its prints (printHabit or a print command) but has no needsHome object; the fetch errand takes the print to its needsHome object and has nowhere to go."
        next
      end
      home_room = home_obj.room || npc_room
      reach = leash_reach(json, npc, home_room)
      owner_prods.uniq.each do |prod|
        p_obj = by_id[prod]&.first
        next if p_obj.nil? || p_obj.room.nil? || reach.include?(p_obj.room)

        issues << "⚠️ WARNING: #{where} prints to '#{prod}' in room '#{p_obj.room}', which its home room '#{home_room}' does not join through rooms it may enter; its prints are never fetched."
      end
    end
    printers.each do |prod, ids|
      slots = objs.count { |o| o.data['outputOf'] == prod }
      issues << "ℹ️ Printing NPCs for '#{prod}': #{ids.length} (#{ids.sort.join(', ')}) for #{slots} slot(s); a forgotten print holds its slot until a reload, or until a print finds the pool full and recycles it (an empty pool prints only cosmetic copies)."
    end
  end

  # Slice 18a (OFFICE_LIFE_PLAN 12.4): affordance.offWhen (the requireGlobal form) takes a source
  # out while it holds. Each name it reads must be a declared global (error); something should set
  # it (warning; ink is not read). A hint action with no title shows "Intelligence Received", a spy
  # title, so in a scenario with needs NPCs or officePresets it warns.
  def self.check_off_when(json, npcs, objs, issues)
    globals = json['globalVariables'].is_a?(Hash) ? json['globalVariables'] : {}
    objs.each do |o|
      aff = o.data['affordance']
      next unless aff.is_a?(Hash) && aff.key?('offWhen')

      cond = aff['offWhen']
      names = if cond.is_a?(String) && !cond.empty? then [cond]
              elsif cond.is_a?(Hash) && !cond.empty? then cond.keys
              end
      unless names
        issues << "❌ ERROR: object '#{o.id}' affordance.offWhen must be a global name or { name: value } (the requireGlobal form)."
        next
      end
      names.each do |name|
        unless globals.key?(name)
          issues << "❌ ERROR: object '#{o.id}' affordance offWhen '#{name}' is not declared in globalVariables."
          next
        end
        next if global_set_somewhere?(json, name)

        issues << "⚠️ WARNING: object '#{o.id}' affordance offWhen '#{name}': nothing in the scenario sets it (a set_global action or a mapping's setGlobal; ink is not checked), so the source is never switched off."
      end
    end
    needs_scenario = json['officePresets'] == true || npcs.any? { |_, n| n['needs'].is_a?(Hash) || n['interests'].is_a?(Hash) }
    return unless needs_scenario

    untitled_hints(json, nil).each do |owner|
      issues << "⚠️ WARNING: #{owner || 'scenario'} has a hint action with no title; it shows under \"Intelligence Received\", a spy title. Give it a neutral title (e.g. the object's name)."
    end
  end

  def self.global_set_somewhere?(json, name)
    case json
    when Hash
      return true if json['type'] == 'set_global' && json['key'] == name
      return true if json['setGlobal'].is_a?(Hash) && json['setGlobal'].key?(name)

      json.any? { |k, v| k != 'globalVariables' && global_set_somewhere?(v, name) }
    when Array then json.any? { |v| global_set_somewhere?(v, name) }
    else false
    end
  end

  # Owners ("object 'x'", "NPC 'y'") of every { type: 'hint' } action without a title
  def self.untitled_hints(v, owner, out = [])
    case v
    when Hash
      if v['id'].is_a?(String) && (v.key?('npcType') || v.key?('type'))
        owner = v.key?('npcType') ? "NPC '#{v['id']}'" : "object '#{v['id']}'"
      end
      out << owner if v['type'] == 'hint' && v.key?('message') && !v.key?('title')
      v.each { |k, x| untitled_hints(x, owner, out) unless k == '_comment' }
    when Array then v.each { |x| untitled_hints(x, owner, out) }
    end
    out
  end

  # Slice 16 (OFFICE_LIFE_PLAN 12.2): the owner's screenHabit and the machine's autoLockSeconds.
  # The same rules as systems/workstation-state.js: an object's own lockChance or
  # locksScreenOnLeave wins over the habit; auto-lock only ever locks an open screen.
  LOCK_FIELDS = %w[lockChance locksScreenOnLeave].freeze

  def self.workstation?(data)
    data['workstation'] == true || LOCK_FIELDS.any? { |f| data.key?(f) }
  end

  def self.station_owner(data, npcs)
    return data['screenOwner'] if data['screenOwner'].is_a?(String) && !data['screenOwner'].empty?

    npcs.find { |_, n| n['needsHome'] == data['id'] }&.last&.dig('id')
  end

  # Does this habit ever leave the screen open on a leave?
  def self.habit_leaves_open?(habit)
    return false unless habit.is_a?(Hash)
    return true if habit['lockIfAwayOverSeconds'].is_a?(Numeric)

    habit['lockChance'].is_a?(Numeric) && habit['lockChance'] < 1
  end

  def self.check_lock_habits(json, npcs, objs, issues)
    if json.key?('lockCues') && ![true, false].include?(json['lockCues'])
      issues << "❌ ERROR: lockCues must be true or false (default true)."
    end
    stations = objs.select { |o| o.data.is_a?(Hash) && o.data['id'].is_a?(String) && workstation?(o.data) }
    npcs.each do |_, npc|
      next unless npc.key?('screenHabit')

      where = "NPC '#{npc['id']}' screenHabit"
      h = npc['screenHabit']
      unless h.is_a?(Hash)
        issues << "❌ ERROR: #{where} must be an object { lockChance, lockIfAwayOverSeconds }."
        next
      end
      (h.keys - %w[lockChance lockIfAwayOverSeconds _comment]).each do |k|
        issues << "⚠️ WARNING: #{where} has unknown field '#{k}' (lockChance, lockIfAwayOverSeconds)."
      end
      if h.key?('lockChance') && !(h['lockChance'].is_a?(Numeric) && h['lockChance'] >= 0 && h['lockChance'] <= 1)
        issues << "❌ ERROR: #{where}.lockChance must be a number from 0 to 1."
      end
      if h.key?('lockIfAwayOverSeconds') && !(h['lockIfAwayOverSeconds'].is_a?(Numeric) && h['lockIfAwayOverSeconds'] >= 0)
        issues << "❌ ERROR: #{where}.lockIfAwayOverSeconds must be a number of seconds, 0 or more."
      end
      own = stations.select { |o| station_owner(o.data, npcs) == npc['id'] }
      if own.empty?
        issues << "⚠️ WARNING: #{where} but the NPC owns no workstation (needsHome or screenOwner on an object with workstation: true): nothing to lock."
      elsif own.all? { |o| LOCK_FIELDS.any? { |f| o.data.key?(f) } }
        issues << "⚠️ WARNING: #{where} never applies: every station it owns (#{own.map(&:id).join(', ')}) sets lockChance or locksScreenOnLeave, and the object wins. Remove the object's field to use the habit."
      end
    end
    objs.each do |o|
      d = o.data
      next unless d.is_a?(Hash) && d.key?('autoLockSeconds')

      where = "object '#{o.id}' autoLockSeconds"
      unless d['autoLockSeconds'].is_a?(Numeric) && d['autoLockSeconds'] > 0
        issues << "❌ ERROR: #{where} must be a number of seconds above 0."
        next
      end
      unless workstation?(d)
        issues << "⚠️ WARNING: #{where} is set on an object that is not a workstation (workstation: true): it never locks."
        next
      end
      owner_id = station_owner(d, npcs)
      habit = npcs.find { |_, n| n['id'] == owner_id }&.last&.dig('screenHabit')
      always = d['lockChance'].is_a?(Numeric) ? d['lockChance'] >= 1 : (d.key?('locksScreenOnLeave') ? d['locksScreenOnLeave'] != false : !habit_leaves_open?(habit))
      if always
        issues << "⚠️ WARNING: #{where} never applies: the screen always locks when its owner leaves (locksScreenOnLeave, lockChance 1 or no habit that leaves it open), and auto-lock only locks an open screen."
      end
    end
  end

  # Slice 21 (OFFICE_LIFE_PLAN 12.7): the idle swivel turns needs NPCs' swivel chairs. `swivel` on
  # an NPC with no needs does nothing; LOS cones read the facing the swivel sets.
  def self.check_swivel(npcs, issues)
    npcs.each do |_, npc|
      where = "NPC '#{npc['id']}'"
      needs_npc = npc['needs'].is_a?(Hash) || npc['interests'].is_a?(Hash)
      if (npc.key?('swivel') || npc.key?('swivelChance')) && !needs_npc
        issues << "⚠️ WARNING: #{where} sets swivel/swivelChance but has no needs; only needs NPCs swivel, so it does nothing."
      end
      if npc.key?('swivel') && ![true, false].include?(npc['swivel'])
        issues << "❌ ERROR: #{where} swivel must be true or false."
      end
      if npc.key?('swivelChance') && !(npc['swivelChance'].is_a?(Numeric) && npc['swivelChance'] >= 0 && npc['swivelChance'] <= 1)
        issues << "❌ ERROR: #{where} swivelChance must be a number from 0 to 1 (default 0.05)."
      end
      if needs_npc && npc.dig('los', 'enabled') == true && npc['swivel'] != false
        issues << "⚠️ WARNING: #{where} is a needs NPC with los.enabled; the idle swivel would turn its sight cone, so it never swivels. Set swivel: false to say so."
      end
    end
  end

  # ── affordance presets (OFFICE_LIFE_PLAN 2.1, slice 4) ───────────────────
  # The same table and rules as systems/office-presets.js: with "officePresets": true a declared
  # object (has an id, not decor, not takeable, no lockType, affordance not false) gets the preset
  # for its officeType, else its exact type; its own affordance fields win. Every later check sees
  # the expanded affordances, and each object that gained a preset is listed.

  PRESETS_FILE = File.expand_path('../public/break_escape/js/data/office-presets.json', __dir__)

  def self.preset_table
    @preset_table ||= File.file?(PRESETS_FILE) ? (JSON.parse(File.read(PRESETS_FILE))['presets'] || {}) : {}
  end

  def self.preset_id_for(data, table = preset_table)
    return nil unless data.is_a?(Hash)
    return nil if !data['id'].is_a?(String) || data['id'].empty? || data['decor'] == true
    return nil if data['affordance'] == false || data['takeable'] == true || data['lockType']
    return (table.key?(data['officeType']) ? data['officeType'] : nil) if data['officeType'].is_a?(String)

    table.find { |_id, p| Array(p['types']).include?(data['type']) }&.first
  end

  def self.resolve_affordance(data, on, table = preset_table)
    own = data['affordance'].is_a?(Hash) ? data['affordance'] : nil
    return nil if data['affordance'] == false
    return own unless on

    pid = preset_id_for(data, table)
    return own unless pid

    JSON.parse(JSON.generate(table[pid]['affordance'] || {})).merge(own || {})
  end

  def self.expand_presets(json, objs, issues)
    on = json['officePresets'] == true
    objs.each do |o|
      ot = o.data['officeType']
      next unless ot

      if !on
        issues << "⚠️ WARNING: object '#{o.id}' has officeType '#{ot}' but the scenario does not set \"officePresets\": true; it gets no preset."
      elsif !preset_table.key?(ot)
        issues << "❌ ERROR: object '#{o.id}' officeType '#{ot}' is not a preset (#{preset_table.keys.join(', ')})."
      end
    end

    objs.map do |o|
      pid = on ? preset_id_for(o.data) : nil
      # affordance: false (no affordance, no preset) is dropped so later checks see no Hash
      next o unless pid || (o.data.key?('affordance') && !o.data['affordance'].is_a?(Hash))

      if pid
        own = o.data['affordance'].is_a?(Hash) ? o.data['affordance'].keys - ['_comment'] : []
        note = own.empty? ? '' : " (own: #{own.join(', ')})"
        issues << "ℹ️ Office preset: '#{o.id}' (type '#{o.data['type']}') gets '#{pid}'#{note}."
      end
      aff = resolve_affordance(o.data, on)
      data = o.data.reject { |k, _| k == 'affordance' }
      data['affordance'] = aff if aff
      Obj.new(id: o.id, room: o.room, data: data, x: o.x, y: o.y)
    end
  end

  # ── social pairing and compatibility (OFFICE_LIFE_PLAN 2.4, 7.3; slice 8) ──
  # Chatter lines are one bubble each: at most 40 characters, no line breaks. An object's
  # affordance.chatter must name a pool (built-in, scenario or some NPC's) and needs capacity 2+.
  # needsCompany: avoids name real NPCs and declared groups; a requireGlobal names a declared
  # global (warning). Info: an NPC whose every object for some need is shared with someone it
  # avoids (either way, unconditionally) can only use it when they are not there.

  BUILTIN_CHATTER = %w[coffee cooler greet grumble].freeze
  # Slice 14: needs the validator warns about when declared deferrable: false (environmental)
  ENVIRONMENTAL_NEEDS = %w[caffeine thirst hunger rest].freeze
  CHAT_LINE_MAX = 40

  def self.pool_lines(pool)
    return pool if pool.is_a?(Array)
    return Array(pool['lines']) if pool.is_a?(Hash)

    []
  end

  def self.check_pool_lines(where, pools, issues)
    return unless pools.is_a?(Hash)

    pools.each do |topic, pool|
      next if topic == '_comment'

      unless pool.is_a?(Array) || (pool.is_a?(Hash) && pool['lines'].is_a?(Array))
        issues << "❌ ERROR: #{where} chatter '#{topic}' must be a list of lines or { lines: [...] }."
        next
      end
      pool_lines(pool).each do |line|
        if !line.is_a?(String) || line.strip.empty?
          issues << "❌ ERROR: #{where} chatter '#{topic}' has an empty or non-text line."
        elsif line.include?("\n")
          issues << "❌ ERROR: #{where} chatter '#{topic}' line #{line.inspect} has a line break; a bubble is one line."
        elsif line.length > CHAT_LINE_MAX
          issues << "❌ ERROR: #{where} chatter '#{topic}' line #{line.inspect} is #{line.length} characters; a bubble holds at most #{CHAT_LINE_MAX}."
        elsif line.match?(/[{}]/)
          # Slice 15: chatter is voiced; the TTS speaks the text as written (tts-audio rule 2)
          issues << "❌ ERROR: #{where} chatter '#{topic}' line #{line.inspect} has a { } variable; spoken lines must not print variables."
        end
      end
    end
  end

  def self.avoid_hits?(entry, other, groups_of)
    who = entry.is_a?(Hash) ? (entry['npc'] || (entry['group'] && "group:#{entry['group']}")) : entry
    return false unless who.is_a?(String)
    return true if who == '*' || who == other['id']

    who.start_with?('group:') && groups_of.call(other).include?(who.sub('group:', ''))
  end

  # ── queues at shared machines (OFFICE_LIFE_PLAN 2.5, slice 10) ─────────
  # affordance.queue: { cells: [{dx, dy}], maxWaitSeconds }, offsets in tiles from the approach
  # cell (useFrom, else the object's own tile). The engine drops a cell that is not walkable and
  # skips one in a room forbidden to the queuer; this flags what can be seen without the map: a
  # malformed cell, a cell beside a wall with a door (it may sit in the doorway), and a cell
  # outside the room in a neighbour forbidden to an NPC that needs the machine (review m8).

  GAME_JS = File.expand_path('../public/break_escape/js/core/game.js', __dir__)

  def self.room_tiles(type)
    @room_tiles ||= {}
    return @room_tiles[type] if @room_tiles.key?(type)

    @tilemaps ||= File.exist?(GAME_JS) ? File.read(GAME_JS).scan(/tilemapTiledJSON\('([^']+)',\s*'rooms\/([^']+)'\)/).to_h : {}
    file = @tilemaps[type]
    path = file && File.expand_path("../public/break_escape/assets/rooms/#{file}", __dir__)
    tj = path && File.exist?(path) ? (JSON.parse(File.read(path)) rescue nil) : nil
    @room_tiles[type] = tj && tj['width'] ? [tj['width'].to_i, tj['height'].to_i] : nil
  end

  def self.check_queues(json, npcs, objs, issues)
    objs.each do |o|
      aff = o.data['affordance']
      next unless aff.is_a?(Hash) && aff.key?('queue')

      q = aff['queue']
      next if q == false   # switches a preset's queue off

      where = "object '#{o.id}' affordance.queue"
      cells = q.is_a?(Hash) ? q['cells'] : nil
      unless cells.is_a?(Array) && !cells.empty? && cells.all? { |c| c.is_a?(Hash) && c['dx'].is_a?(Numeric) && c['dy'].is_a?(Numeric) }
        issues << "❌ ERROR: #{where} needs cells: a non-empty list of { dx, dy } tile offsets from the approach cell."
        next
      end
      w = q['maxWaitSeconds']
      issues << "⚠️ WARNING: #{where}.maxWaitSeconds must be a positive number of seconds (default 30)." if q.key?('maxWaitSeconds') && !(w.is_a?(Numeric) && w.positive?)
      satisfies = list(aff['satisfies'])
      issues << "⚠️ WARNING: #{where} is on an object that satisfies no need; nobody will queue there." if satisfies.empty?
      room = json.dig('rooms', o.room)
      dims = room.is_a?(Hash) ? room_tiles(room['type']) : nil
      next if dims.nil? || o.room.nil?

      uf = aff['useFrom'].is_a?(Hash) ? aff['useFrom'] : {}
      bx = o.x.floor + uf['dx'].to_i
      by = o.y.floor + uf['dy'].to_i
      conns = room['connections'].is_a?(Hash) ? room['connections'] : {}
      needers = npcs.select { |_r, n| n['needs'].is_a?(Hash) && (n['needs'].keys & satisfies).any? }
      cells.each_with_index do |c, i|
        cx = bx + c['dx'].round
        cy = by + c['dy'].round
        side = if cx.negative? then 'west' elsif cx >= dims[0] then 'east' elsif cy.negative? then 'north' elsif cy >= dims[1] then 'south' end
        if side
          nbr = Array(conns[side]).first
          issues << "⚠️ WARNING: #{where} cell #{i + 1} (tile #{cx},#{cy}) lies outside room '#{o.room}'#{nbr ? " in '#{nbr}'" : ''}; it may sit in a doorway or a wall, and the engine drops a cell that is not walkable."
          next unless nbr.is_a?(String)

          needers.each do |hr, n|
            rule = leash_rule(json, n, nbr, n['needsHome'].is_a?(Hash) ? n['needsHome']['room'] : hr)
            issues << "⚠️ WARNING: #{where} cell #{i + 1} is in room '#{nbr}', #{rule} for NPC '#{n['id']}', who needs this machine; that NPC skips the cell (and waits at its post if no cell is left)." if rule
          end
        else
          near = conns.keys.select do |dir|
            (dir == 'west' && cx <= 1) || (dir == 'east' && cx >= dims[0] - 2) || (dir == 'north' && cy <= 2) || (dir == 'south' && cy >= dims[1] - 2)
          end
          issues << "⚠️ WARNING: #{where} cell #{i + 1} (tile #{cx},#{cy}) is within a tile of the #{near.join('/')} wall, which has a door; if it lands in the doorway a queuer blocks it." if near.any?
        end
      end
    end
  end

  def self.spoken_topic?(json, npcs, topic)
    sc = json['chatter']
    return true if sc.is_a?(Hash) && pool_lines(sc[topic]).any?

    npcs.any? { |_r, n| n['chatter'].is_a?(Hash) && pool_lines(n['chatter'][topic]).any? }
  end

  # ── scripted exchanges (slice 15, OFFICE_LIFE_PLAN 11.4) ───────────────────
  # exchanges: [{ with, knot, requireGlobal }]. The knot must be in the NPC's compiled story; every
  # speaker it names ("Name: line", by id or displayName) must be an NPC in the scenario (error) with
  # a voice (warning), and should be the owner or the `with` NPC (the engine plays only the pair's
  # lines). No { } in the knot's text (rule 2). heard_<knot> is set when it ends: declare it.
  REPO_ROOT = File.expand_path('..', __dir__)

  def self.ink_knot_texts(story_path, knot)
    path = File.join(REPO_ROOT, story_path.to_s)
    return nil unless File.exist?(path)

    root = JSON.parse(File.read(path).sub(/\A\uFEFF/, ''))['root']
    named = root.is_a?(Array) ? root.last : nil
    return nil unless named.is_a?(Hash) && named[knot].is_a?(Array)

    out = []
    walk = lambda do |node|
      case node
      when String then out << node[1..].strip if node.start_with?('^') && !node[1..].strip.empty?
      when Array then node.each { |c| walk.call(c) }
      when Hash then node.each { |k, v| walk.call(v) unless k == '#f' }
      end
    end
    walk.call(named[knot])
    out
  rescue JSON::ParserError
    nil
  end

  def self.check_exchanges(json, npcs, issues)
    by_name = {}
    npcs.each do |_r, n|
      by_name[n['id'].to_s.downcase] = n if n['id']
      by_name[n['displayName'].to_s.downcase] = n if n['displayName']
    end
    ids = npcs.map { |_r, n| n['id'] }
    groups = npcs.flat_map { |_r, n| Array(n.is_a?(Hash) ? n.dig('needsCompany', 'groups') : nil) }.uniq
    globals = json['globalVariables'].is_a?(Hash) ? json['globalVariables'] : {}
    npcs.each do |_r, n|
      next unless n.key?('exchanges')

      where = "NPC '#{n['id']}' exchanges"
      unless n['exchanges'].is_a?(Array)
        issues << "❌ ERROR: #{where} must be a list of { with, knot, requireGlobal }."
        next
      end
      n['exchanges'].each do |e|
        unless e.is_a?(Hash) && e['knot'].is_a?(String) && e['with'].is_a?(String)
          issues << "❌ ERROR: #{where}: each entry needs a 'with' (an NPC id or group:<name>) and a 'knot'."
          next
        end
        w = e['with']
        if w.start_with?('group:')
          issues << "⚠️ WARNING: #{where} '#{e['knot']}' with '#{w}': no NPC declares that group." unless groups.include?(w[6..])
        elsif !ids.include?(w)
          issues << "❌ ERROR: #{where} '#{e['knot']}' with '#{w}' is not an NPC in this scenario."
        end
        rg = e['requireGlobal']
        if rg.is_a?(String) && !globals.key?(rg)
          issues << "⚠️ WARNING: #{where} '#{e['knot']}' requireGlobal '#{rg}' is not declared in globalVariables."
        end
        unless globals.key?("heard_#{e['knot']}")
          issues << "⚠️ WARNING: #{where} '#{e['knot']}': declare heard_#{e['knot']} (false) in globalVariables; it is set when the exchange has been heard."
        end
        texts = n['storyPath'] ? ink_knot_texts(n['storyPath'], e['knot']) : nil
        if texts.nil?
          issues << "❌ ERROR: #{where}: knot '#{e['knot']}' is not in #{n['storyPath'] || 'a story (no storyPath)'}."
          next
        end
        issues << "❌ ERROR: #{where}: knot '#{e['knot']}' has no lines." if texts.empty?
        texts.each do |t|
          m = /\A([^:\n]+?):\s+(\S.*)\z/m.match(t)
          speaker = m ? by_name[m[1].strip.downcase] : n
          speaker = n if m && m[1].strip.downcase == 'npc'
          if m && speaker.nil?
            issues << "❌ ERROR: #{where}: knot '#{e['knot']}' line #{t.inspect} names '#{m[1].strip}', who is not an NPC in this scenario."
            next
          end
          unless speaker['voice'].is_a?(Hash)
            issues << "⚠️ WARNING: #{where}: knot '#{e['knot']}' speaker '#{speaker['id']}' has no voice; the line shows as a bubble only."
          end
          if !w.start_with?('group:') && ![n['id'], w].include?(speaker['id'])
            issues << "⚠️ WARNING: #{where}: knot '#{e['knot']}' line #{t.inspect} is spoken by '#{speaker['id']}', not by the pair; the engine will not play it."
          end
          issues << "❌ ERROR: #{where}: knot '#{e['knot']}' line #{t.inspect} has a { } variable; spoken lines must not print variables." if t.match?(/[{}]/)
        end
      end
    end
  end

  def self.check_social(json, npcs, objs, issues)
    sc = json['chatter']
    if json.key?('chatter') && sc != false && !sc.is_a?(Hash)
      issues << "❌ ERROR: chatter must be an object of pools by topic, or false."
    end
    check_pool_lines('scenario', sc, issues) if sc.is_a?(Hash)
    pools = (sc == false ? [] : BUILTIN_CHATTER) + (sc.is_a?(Hash) ? sc.keys : [])
    npcs.each do |_r, n|
      check_pool_lines("NPC '#{n['id']}'", n['chatter'], issues) if n['chatter'].is_a?(Hash)
      pools += n['chatter'].keys if n['chatter'].is_a?(Hash)
    end
    objs.each do |o|
      aff = o.data['affordance']
      next unless aff.is_a?(Hash) && aff.key?('chatter')

      topic = aff['chatter']
      issues << "⚠️ WARNING: object '#{o.id}' affordance.chatter '#{topic}' is not a chatter pool (#{pools.uniq.sort.join(', ')}); nobody will speak there." unless pools.include?(topic)
      if pools.include?(topic) && sc != false && !spoken_topic?(json, npcs, topic)
        # Slice 15: the engine has no spoken lines; a built-in topic is picture chat only
        issues << "⚠️ WARNING: object '#{o.id}' affordance.chatter '#{topic}' has no lines in the scenario's or any NPC's chatter; its pairs show picture chat only (built-in pools are not spoken)."
      end
      issues << "⚠️ WARNING: object '#{o.id}' affordance.chatter needs capacity 2 or more, or a queue; one NPC at a time never chats." if (aff['capacity'] || 1).to_i < 2 && !aff['queue'].is_a?(Hash)
    end

    ids = npcs.map { |_r, n| n['id'] }
    groups_of = ->(n) { Array(n.is_a?(Hash) ? n.dig('needsCompany', 'groups') : nil).select { |g| g.is_a?(String) } }
    groups = npcs.flat_map { |_r, n| groups_of.call(n) }.uniq
    globals = json['globalVariables'].is_a?(Hash) ? json['globalVariables'].keys : []
    npcs.each do |_r, n|
      nc = n['needsCompany']
      next if nc.nil?

      where = "NPC '#{n['id']}' needsCompany"
      unless nc.is_a?(Hash)
        issues << "❌ ERROR: #{where} must be an object { groups, avoids }."
        next
      end
      if nc.key?('avoidRadius') && !(nc['avoidRadius'].is_a?(Numeric) && nc['avoidRadius'] >= 0 && nc['avoidRadius'] <= 10)
        issues << "❌ ERROR: #{where} avoidRadius must be a number of tiles from 0 to 10 (default 2 with avoids; 0 is slice 8's sharing-only rule)."
      end
      Array(nc['avoids']).each do |e|
        who = e.is_a?(Hash) ? (e['npc'] || (e['group'] && "group:#{e['group']}")) : e
        unless who.is_a?(String)
          issues << "❌ ERROR: #{where} avoids entry #{e.inspect} needs an NPC id, 'group:<name>', '*', or { npc | group, requireGlobal }."
          next
        end
        if who.start_with?('group:')
          g = who.sub('group:', '')
          issues << "⚠️ WARNING: #{where} avoids group '#{g}', which no NPC lists in needsCompany.groups." unless groups.include?(g)
        elsif who != '*' && !ids.include?(who)
          issues << "❌ ERROR: #{where} avoids unknown NPC '#{who}'."
        elsif who == n['id']
          issues << "⚠️ WARNING: #{where} avoids itself."
        end
        rg = e.is_a?(Hash) ? e['requireGlobal'] : nil
        names = rg.is_a?(String) ? [rg] : (rg.is_a?(Hash) ? rg.keys : [])
        names.each do |g|
          issues << "⚠️ WARNING: #{where} requireGlobal '#{g}' is not in globalVariables; the avoidance applies only once something sets it." unless globals.include?(g)
        end
      end
    end

    # Info: every object for one of an NPC's needs is shared with someone it avoids unconditionally
    avoid_pair = lambda do |a, b|
      [[a, b], [b, a]].any? do |x, y|
        Array(x.dig('needsCompany', 'avoids')).any? { |e| !(e.is_a?(Hash) && e.key?('requireGlobal')) && avoid_hits?(e, y, groups_of) }
      end
    end
    return unless npcs.any? { |_r, n| n['needsCompany'].is_a?(Hash) }

    npcs.each do |_r, n|
      next unless n['needs'].is_a?(Hash)

      n['needs'].each_key do |need|
        sat = objs.select { |o| o.data['affordance'].is_a?(Hash) && list(o.data['affordance']['satisfies']).include?(need) }
        next if sat.empty? || sat.any? { |o| (o.data['affordance']['capacity'] || 1).to_i < 2 }

        blockers = sat.map do |o|
          users = npcs.map(&:last).select do |m|
            m != n && m['needs'].is_a?(Hash) && m['needs'].keys.any? { |k| list(o.data['affordance']['satisfies']).include?(k) } && avoid_pair.call(n, m)
          end
          users.map { |m| m['id'] }
        end
        next if blockers.any?(&:empty?)

        issues << "ℹ️ NPC needs #{n['id']}.#{need}: every object for it (#{sat.map(&:id).sort.join(', ')}) is shared with someone it avoids (#{blockers.flatten.uniq.sort.join(', ')}); it uses them only while they are not there."
      end
    end
  end

  # ── office visuals (OFFICE_LIFE_PLAN 2.12, slice 3) ──────────────────────

  ASSETS = File.expand_path('../public/break_escape/assets', __dir__)
  SOUND_MANAGER = File.expand_path('../public/break_escape/js/systems/sound-manager.js', __dir__)
  HELD_MAX_PX = 24

  # [width, height] from a PNG header, or nil.
  def self.png_size(path)
    return nil unless File.file?(path)

    head = File.binread(path, 24)
    return nil unless head && head.bytesize == 24 && head[0, 8] == "\x89PNG\r\n\x1A\n".b

    head[16, 8].unpack('NN')
  rescue StandardError
    nil
  end

  def self.loaded_sounds
    @loaded_sounds ||= File.file?(SOUND_MANAGER) ? File.read(SOUND_MANAGER).scan(/load\.audio\(\s*'([^']+)'/).flatten : []
  end

  # A carried item shows in the NPC's hand at native size: over 24 px looks like furniture.
  # useSound must be a sound the game loads. actionIcons textures must exist.
  def self.check_visuals(json, objs, issues)
    objs.each do |o|
      if o.data['needsTag'].is_a?(String) && o.data['type'].is_a?(String)
        size = png_size(File.join(ASSETS, 'objects', "#{o.data['type']}.png"))
        if size && (size[0] > HELD_MAX_PX || size[1] > HELD_MAX_PX)
          issues << "⚠️ WARNING: needsTag item '#{o.id}' (#{o.data['type']}, #{size[0]}x#{size[1]}) is over #{HELD_MAX_PX} px on a side; an NPC carries it in hand at native size, so it will look like carrying furniture."
        end
      end
      snd = o.data.dig('affordance', 'useSound') if o.data['affordance'].is_a?(Hash)
      next unless snd.is_a?(String) && !loaded_sounds.empty? && !loaded_sounds.include?(snd)

      issues << "⚠️ WARNING: object '#{o.id}' affordance.useSound '#{snd}' is not a sound the game loads (sound-manager.js); it will not play."
    end
    if json.key?('showNpcIntentBubbles')
      issues << "⚠️ WARNING: showNpcIntentBubbles was renamed to showPressingNeeds (OFFICE_LIFE_PLAN 9.2); the old name is ignored."
    end
    if json.key?('showPressingNeeds') && ![true, false].include?(json['showPressingNeeds'])
      issues << "❌ ERROR: showPressingNeeds must be true or false."
    end
    icons = json['actionIcons']
    return unless icons.is_a?(Hash)

    icons.each do |key, v|
      path = if v.is_a?(String) && v.start_with?('icon:') then File.join(ASSETS, 'icons', "#{v[5..]}.png")
      elsif v.is_a?(Hash) && v['sprite'].is_a?(String) then File.join(ASSETS, 'objects', "#{v['sprite']}.png")
      end
      next if path.nil? || File.file?(path)

      issues << "⚠️ WARNING: actionIcons '#{key}' texture #{path.sub("#{ASSETS}/", 'assets/')} does not exist; the text stand-in shows instead."
    end
  end

  # ── room leash and private objects (OFFICE_LIFE_PLAN 7.2, slice 2a) ──────

  # Room-level needsPrivateTo and object-level affordance.private / owners.
  def self.check_private(json, npcs, objs, issues)
    npc_ids = npcs.map { |_, n| n['id'] }.compact
    json['rooms'].each do |room_id, room|
      next unless room.is_a?(Hash) && room.key?('needsPrivateTo')

      unless room['needsPrivateTo'].is_a?(Array)
        issues << "❌ ERROR: room '#{room_id}' needsPrivateTo must be a list of NPC ids."
        next
      end
      room['needsPrivateTo'].each do |id|
        issues << "❌ ERROR: room '#{room_id}' needsPrivateTo names unknown NPC '#{id}'." unless npc_ids.include?(id)
      end
    end
    objs.each do |o|
      aff = o.data['affordance']
      next unless aff.is_a?(Hash)

      Array(aff['owners']).each do |id|
        issues << "❌ ERROR: object '#{o.id}' affordance.owners names unknown NPC '#{id}'." unless npc_ids.include?(id)
      end
      next unless aff['private'] == true && owners_of(o, npcs).empty?

      issues << "⚠️ WARNING: object '#{o.id}' is private but has no owner (no affordance.owners, no screenOwner, no NPC with it as needsHome); it serves nobody."
    end
  end

  # affordance.owners, else screenOwner, else the first NPC whose needsHome is the object.
  def self.owners_of(obj, npcs)
    aff = obj.data['affordance'].is_a?(Hash) ? obj.data['affordance'] : {}
    return aff['owners'] if aff['owners'].is_a?(Array)
    return [obj.data['screenOwner']] if obj.data['screenOwner'].is_a?(String) && !obj.data['screenOwner'].empty?

    first = npcs.find { |_, n| n['needsHome'] == obj.id && !obj.id.nil? }
    first ? [first[1]['id']] : []
  end

  # Why an NPC's needs may not enter a room, or nil. The home room is never forbidden here; the
  # caller reports an author forbidding it.
  def self.leash_rule(json, npc, room_id, home_room)
    return nil if room_id.nil? || room_id == home_room

    allow = npc['needsRooms']
    return "outside needsRooms" if allow.is_a?(Array) && !allow.include?(room_id)
    return "in needsAvoidRooms" if Array(npc['needsAvoidRooms']).include?(room_id)

    priv = json.dig('rooms', room_id, 'needsPrivateTo')
    return "private to #{priv.inspect}" if priv.is_a?(Array) && !priv.include?(npc['id'])

    nil
  end

  # Why this NPC may not use obj for a need, or nil (private applies to uses only, OQ26).
  def self.use_rule(json, npc, obj, home_room, npcs)
    rule = leash_rule(json, npc, obj.room, home_room)
    return "room '#{obj.room}' is #{rule}" if rule
    return nil unless obj.data.dig('affordance', 'private') == true

    owners = owners_of(obj, npcs)
    owners.include?(npc['id']) ? nil : "it is private to #{owners.inspect}"
  end

  def self.leashed?(json, npc, objs)
    npc.key?('needsRooms') || npc.key?('needsAvoidRooms') ||
      json['rooms'].any? { |_, r| r.is_a?(Hash) && r['needsPrivateTo'].is_a?(Array) } ||
      objs.any? { |o| o.data.dig('affordance', 'private') == true }
  end

  # Rooms reachable from home over `connections` without entering a forbidden room.
  def self.leash_reach(json, npc, home_room)
    seen = [home_room]
    queue = [home_room]
    until queue.empty?
      r = queue.shift
      conns = json.dig('rooms', r, 'connections')
      next unless conns.is_a?(Hash)

      conns.values.flat_map { |v| Array(v) }.each do |n|
        next if !n.is_a?(String) || seen.include?(n) || !json['rooms'].key?(n) || leash_rule(json, npc, n, home_room)

        seen << n
        queue << n
      end
    end
    seen
  end

  def self.collect(item, room_id, out)
    return unless item.is_a?(Hash)

    pos = item['position'].is_a?(Hash) ? item['position'] : {}
    out << Obj.new(id: item['id'], room: room_id, data: item, x: pos['x'].to_f, y: pos['y'].to_f)
    Array(item['contents']).each { |c| collect(c, room_id, out) }
    Array(item['itemsHeld']).each { |c| collect(c, room_id, out) }
  end

  def self.list(v)
    v.is_a?(Array) ? v : (v.nil? ? [] : [v])
  end

  def self.check_npc(json, npc, npc_room, objs, issues, npcs = [])
    nid = npc['id']
    needs = npc['needs']
    interests = npc['interests']
    return unless needs.is_a?(Hash) || interests.is_a?(Hash)

    where = "NPC '#{nid}'"
    patrol = npc.dig('behavior', 'patrol', 'enabled') == true
    issues << "❌ ERROR: #{where} declares needs/interests and behavior.patrol.enabled: true; a needs NPC must not patrol (the needs loop owns its movement)." if patrol
    # Slice 14: balking and parked needs
    if npc.key?('maxQueue') && !(npc['maxQueue'].is_a?(Integer) && npc['maxQueue'] >= 0)
      issues << "❌ ERROR: #{where} maxQueue must be a whole number >= 0 (0 never queues; unset is no limit)."
    end
    if npc.key?('needsDeferMin') && !(npc['needsDeferMin'].is_a?(Numeric) && npc['needsDeferMin'].positive? && npc['needsDeferMin'] <= 120)
      issues << "❌ ERROR: #{where} needsDeferMin must be minutes > 0 and <= 120 (default 4)."
    end

    by_id = objs.select(&:id).group_by(&:id)
    home = npc['needsHome']
    home_room = npc_room
    if home.is_a?(String)
      h = by_id[home]&.first
      if h.nil?
        issues << "❌ ERROR: #{where} needsHome '#{home}' is not an object id in this scenario."
      else
        home_room = h.room
      end
    elsif home.is_a?(Hash)
      home_room = home['room']
      issues << "❌ ERROR: #{where} needsHome room '#{home_room}' does not exist." unless json['rooms'].key?(home_room)
    end

    leashed = leashed?(json, npc, objs)
    if leashed
      %w[needsRooms needsAvoidRooms].each do |f|
        next unless npc.key?(f)

        unless npc[f].is_a?(Array)
          issues << "❌ ERROR: #{where} #{f} must be a list of room ids."
          next
        end
        npc[f].each { |r| issues << "❌ ERROR: #{where} #{f} names unknown room '#{r}'." unless json['rooms'].key?(r) }
      end
      if Array(npc['needsAvoidRooms']).include?(home_room)
        issues << "❌ ERROR: #{where} needsAvoidRooms lists its own home room '#{home_room}'; the home room is always allowed."
      end
      priv = json.dig('rooms', home_room, 'needsPrivateTo')
      if priv.is_a?(Array) && !priv.include?(nid)
        issues << "❌ ERROR: #{where} home room '#{home_room}' is needsPrivateTo #{priv.inspect}, which does not list it."
      end
      if home.is_a?(String) && (h = by_id[home]&.first) && h.data.dig('affordance', 'private') == true && !owners_of(h, npcs).include?(nid)
        issues << "❌ ERROR: #{where} needsHome '#{home}' is private to #{owners_of(h, npcs).inspect}."
      end
      reach = leash_reach(json, npc, home_room)
    end

    (npc['onUse'].is_a?(Hash) ? npc['onUse'] : {}).each do |oid, hook|
      issues << "❌ ERROR: #{where} onUse names '#{oid}', which is not an object id in this scenario." unless by_id.key?(oid)
      prod = hook.is_a?(Hash) ? hook['revealOutput'] : nil
      next if prod.nil?

      if !prod.is_a?(String) || !by_id.key?(prod)
        issues << "❌ ERROR: #{where} onUse '#{oid}' revealOutput names '#{prod}', which is not an object id in this scenario."
      elsif objs.none? { |o| o.data['outputOf'] == prod }
        issues << "⚠️ WARNING: #{where} onUse '#{oid}' revealOutput names '#{prod}', but no object has outputOf '#{prod}'; every print shows only a cosmetic copy."
      end
    end
    has_on_use = npc['onUse'].is_a?(Hash) && !npc['onUse'].empty?

    (needs.is_a?(Hash) ? needs : {}).each do |name, n|
      unless n.is_a?(Hash)
        issues << "❌ ERROR: #{where} need '#{name}' must be an object."
        next
      end
      decay = n['decayPerMin']
      urgent = n['urgentAt']
      initial = n.key?('initial') ? n['initial'] : 100
      issues << "❌ ERROR: #{where} need '#{name}' decayPerMin must be a number > 0 and <= 600." unless decay.is_a?(Numeric) && decay > 0 && decay <= 600
      issues << "❌ ERROR: #{where} need '#{name}' urgentAt must be a number from 1 to 99." unless urgent.is_a?(Numeric) && urgent >= 1 && urgent <= 99
      issues << "❌ ERROR: #{where} need '#{name}' initial must be 0 to 100." unless initial.is_a?(Numeric) && initial >= 0 && initial <= 100
      if n.key?('weight') && !(n['weight'].is_a?(Numeric) && n['weight'] >= 0.1 && n['weight'] <= 10)
        issues << "❌ ERROR: #{where} need '#{name}' weight must be 0.1 to 10."
      end
      if n.key?('jitterPct') && !(n['jitterPct'].is_a?(Numeric) && n['jitterPct'] >= 0 && n['jitterPct'] <= 50)
        issues << "❌ ERROR: #{where} need '#{name}' jitterPct must be 0 to 50."
      end
      if n.key?('deferrable')
        if n['deferrable'] != true && n['deferrable'] != false
          issues << "❌ ERROR: #{where} need '#{name}' deferrable must be true or false."
        elsif n['deferrable'] == false && ENVIRONMENTAL_NEEDS.include?(name)
          issues << "⚠️ WARNING: #{where} need '#{name}' is deferrable: false; the NPC will walk past anyone it avoids and join any queue for it. That is meant for story needs (rounds, a delivery), rarely for #{name}."
        end
      end
      next unless decay.is_a?(Numeric) && decay > 0 && urgent.is_a?(Numeric) && initial.is_a?(Numeric)

      targets = objs.select { |o| o.data['affordance'].is_a?(Hash) && list(o.data['affordance']['satisfies']).include?(name) }
      if targets.empty?
        issues << "❌ ERROR: #{where} need '#{name}' has no object whose affordance.satisfies it; the NPC could never act on it."
        next
      end
      if leashed
        excluded = targets.map { |t| [t, use_rule(json, npc, t, home_room, npcs)] }.select { |_, why| why }
        if excluded.length == targets.length
          why = excluded.map { |t, w| "'#{t.id}' (#{w})" }.join(', ')
          issues << "❌ ERROR: #{where} need '#{name}' is impossible under its room leash: every object that satisfies it is excluded: #{why}."
          next
        end
        targets -= excluded.map(&:first)
        targets.each do |t|
          next if t.room.nil? || reach.include?(t.room)

          issues << "⚠️ WARNING: #{where} need '#{name}' target '#{t.id}' in room '#{t.room}' can only be reached through a room its leash forbids; the engine will skip it."
        end
      end
      nearest = targets.find { |o| o.room == home_room } || targets.first
      restores = nearest.data['affordance']['restores'].to_f
      t1 = [(initial - urgent) / decay.to_f, 0].max
      p_min = ([100, urgent + restores].min - urgent) / decay.to_f
      issues << "ℹ️ NPC needs #{nid}.#{name}: T1 = #{t1.round(2)} min to first use, P = #{p_min.round(2)} min between uses (via '#{nearest.id}', restores #{restores.round})."
      if has_on_use && t1 > T1_WARN_MIN
        issues << "⚠️ WARNING: #{where} need '#{name}' first fires after #{t1.round(1)} min (T1 > #{T1_WARN_MIN.round} min) and the NPC has an onUse hook; lower initial or raise decayPerMin, or a player may never see the beat."
      end
      targets.each { |t| room_warnings(json, where, "need '#{name}' target '#{t.id}'", t, home_room, issues) }
    end

    (interests.is_a?(Hash) ? interests : {}).each do |tag, raw|
      w = raw.is_a?(Hash) ? raw['weight'] : raw
      issues << "❌ ERROR: #{where} interest '#{tag}' weight must be a number from 0.1 to 10." unless w.is_a?(Numeric) && w >= 0.1 && w <= 10
      items = objs.select { |o| o.data['needsTag'] == tag }
      accepters = objs.select { |o| o.data['affordance'].is_a?(Hash) && list(o.data['affordance']['accepts']).include?(tag) }
      issues << "❌ ERROR: #{where} interest '#{tag}' has no item with needsTag '#{tag}' anywhere in the scenario." if items.empty?
      if leashed && raw.is_a?(Hash) && raw['noticeRooms'].is_a?(Array)
        raw['noticeRooms'].each do |r|
          rule = leash_rule(json, npc, r, home_room)
          issues << "⚠️ WARNING: #{where} interest '#{tag}' noticeRooms names room '#{r}', which its leash forbids (#{rule})." if rule
        end
      end
      if leashed && !accepters.empty?
        kept = accepters.reject { |t| leash_rule(json, npc, t.room, home_room) }
        if kept.empty?
          issues << "❌ ERROR: #{where} interest '#{tag}' is impossible under its room leash: every accepting object is in a room it may not enter (#{accepters.map(&:id).inspect})."
          next
        end
        accepters = kept
        free_items = items.reject { |i| leash_rule(json, npc, i.room, home_room) }
        if !items.empty? && free_items.empty?
          issues << "⚠️ WARNING: #{where} interest '#{tag}' items all sit in rooms its leash forbids; it will never fetch one."
        end
      end
      if accepters.empty?
        issues << "❌ ERROR: #{where} interest '#{tag}' has no object whose affordance.accepts includes '#{tag}'; a collected item would have nowhere to go."
      else
        accepters.each { |t| room_warnings(json, where, "interest '#{tag}' accepting object '#{t.id}'", t, home_room, issues) }
      end
      next if items.empty?

      notice = raw.is_a?(Hash) && raw['noticeRooms'].is_a?(Array) ? raw['noticeRooms'] : [home_room]
      if raw.is_a?(Hash) && raw['noticeRooms'].is_a?(Array)
        raw['noticeRooms'].each { |r| issues << "❌ ERROR: #{where} interest '#{tag}' noticeRooms names unknown room '#{r}'." unless json['rooms'].key?(r) }
      end
      item_rooms = items.map(&:room).compact.uniq
      next unless (item_rooms & notice).empty? && !item_rooms.empty?

      if items.all? { |i| i.data['droppable'] == true }
        issues << "ℹ️ NPC needs #{nid}.#{tag}: tagged items start outside #{notice.inspect}; the player must drop one in #{notice.join(' or ')}."
      else
        issues << "⚠️ WARNING: #{where} interest '#{tag}' only notices #{notice.inspect} but items with that tag sit in #{item_rooms.inspect}; the NPC will not see them there."
      end
    end
  end

  # ── reveal slots and carry outcomes (OFFICE_LIFE_PLAN 2.2 Part A, slice 7) ──
  # A slot is a declared object with outputOf and an engine-owned revealOnGlobal: the engine sets
  # that global true on reveal and false on stow, so nothing else may use it. A non-takeable
  # readable notes* slot must read in place (readDisplay gameDisplay): the notes minigame removes
  # what it opens, so the slot could never cycle. onDeliver only affects slots.
  def self.check_slots(json, objs, issues)
    slots = objs.select { |o| o.data.key?('outputOf') }
    by_id = objs.group_by(&:id)
    slots.each do |o|
      d = o.data
      label = "slot '#{o.id || d['name']}'"
      issues << "❌ ERROR: #{label} has no id; reveal slots are revealed and stowed by id." if o.id.to_s.empty?
      unless d['outputOf'].is_a?(String) && by_id.key?(d['outputOf'])
        issues << "❌ ERROR: #{label} outputOf names '#{d['outputOf']}', which is not an object id in this scenario."
      end
      g = d['revealOnGlobal']
      unless g.is_a?(String) && !g.empty?
        issues << "❌ ERROR: #{label} has outputOf but no revealOnGlobal; the engine shows and files a slot through its own global."
        next
      end
      others = objs.reject { |x| x.equal?(o) }.select { |x| x.data['revealOnGlobal'] == g }
      issues << "❌ ERROR: #{label} revealOnGlobal '#{g}' is shared with #{others.map(&:id).inspect}; each slot needs its own global." unless others.empty?
      if global_used_elsewhere?(json, g)
        issues << "❌ ERROR: #{label} revealOnGlobal '#{g}' is used elsewhere in the scenario; the engine owns it (true on reveal, false on stow), so no condition or mapping may read or set it."
      end
      if d['readable'] == true && d['type'].to_s.start_with?('notes') && d['takeable'] != true && d['readDisplay'] != 'gameDisplay'
        issues << "❌ ERROR: #{label} is a non-takeable readable #{d['type']} without readDisplay \"gameDisplay\"; the notes minigame removes what it opens, so the slot would vanish on first read. Add \"readDisplay\": \"gameDisplay\" (reads in place) or make it takeable (one beat)."
      end
    end
    slots.group_by { |o| o.data['outputOf'] }.each do |prod, list|
      takeable = list.count { |o| o.data['takeable'] == true }
      cycling = list.length - takeable
      issues << "ℹ️ Reveal slots for '#{prod}': #{list.length} (#{takeable} takeable, one beat each; #{cycling} read in place and cycle). Used in id order: #{list.map(&:id).sort.inspect}."
    end
    slot_tags = slots.map { |o| o.data['needsTag'] }.compact
    objs.each do |o|
      aff = o.data['affordance']
      next unless aff.is_a?(Hash) && aff.key?('onDeliver')

      unless %w[place stow].include?(aff['onDeliver'])
        issues << "❌ ERROR: object '#{o.id}' affordance.onDeliver must be \"place\" or \"stow\"."
        next
      end
      next unless (list(aff['accepts']) & slot_tags).empty?

      issues << "⚠️ WARNING: object '#{o.id}' sets affordance.onDeliver, but no slot's needsTag is in its accepts; onDeliver only affects reveal slots (plain items are always consumed)."
    end
  end

  # ── left-behind items (OFFICE_LIFE_PLAN 2.10, slice 11) ─────────────────
  # A declared item with leftBehindBy "<npcId>" is a slot by Part A's definition: the engine shows
  # it at the owner's post on a real leave (seeded roll under leftBehindChance) and stows it on
  # return, through its own revealOnGlobal. Same global and read-in-place rules as a reveal slot.
  def self.check_left_behind(json, npcs, objs, issues)
    by_npc = npcs.to_h { |room_id, n| [n['id'], [room_id, n]] }
    by_id = objs.group_by(&:id)
    objs.each do |o|
      d = o.data
      if d.key?('leftBehindChance') && !d.key?('leftBehindBy')
        issues << "⚠️ WARNING: object '#{o.id || d['name']}' sets leftBehindChance without leftBehindBy; nothing rolls it."
      end
      next unless d.key?('leftBehindBy')

      label = "left-behind item '#{o.id || d['name']}'"
      issues << "❌ ERROR: #{label} has no id; left-behind items are shown and stowed by id." if o.id.to_s.empty?
      issues << "❌ ERROR: #{label} has both outputOf and leftBehindBy; a slot belongs to a producer or an owner, not both." if d.key?('outputOf')
      owner = by_npc[d['leftBehindBy']]
      if owner.nil?
        issues << "❌ ERROR: #{label} leftBehindBy names '#{d['leftBehindBy']}', which is not an NPC id in this scenario."
      elsif owner[1]['needsHome'].nil?
        issues << "❌ ERROR: #{label} leftBehindBy '#{d['leftBehindBy']}' has no needsHome; only a leave from a post can leave something behind."
      else
        home = owner[1]['needsHome']
        home_room = home.is_a?(Hash) ? home['room'] : by_id[home]&.first&.room
        if home_room && o.room && o.room != home_room
          issues << "⚠️ WARNING: #{label} is in room '#{o.room}', but its owner's post is in '#{home_room}'; it shows wherever it is declared, so put it at the post."
        end
      end
      c = d['leftBehindChance']
      if c.nil?
        issues << "⚠️ WARNING: #{label} has no leftBehindChance; the default is 0, so it is never left."
      elsif !c.is_a?(Numeric) || c.negative? || c > 1
        issues << "❌ ERROR: #{label} leftBehindChance must be a number from 0 to 1."
      end
      g = d['revealOnGlobal']
      unless g.is_a?(String) && !g.empty?
        issues << "❌ ERROR: #{label} has leftBehindBy but no revealOnGlobal; the engine shows and stows it through its own global."
        next
      end
      others = objs.reject { |x| x.equal?(o) }.select { |x| x.data['revealOnGlobal'] == g }
      issues << "❌ ERROR: #{label} revealOnGlobal '#{g}' is shared with #{others.map(&:id).inspect}; each left-behind item needs its own global." unless others.empty?
      if global_used_elsewhere?(json, g)
        issues << "❌ ERROR: #{label} revealOnGlobal '#{g}' is used elsewhere in the scenario; the engine owns it (true when left, false when collected), so no condition or mapping may read or set it."
      end
      if d['readable'] == true && d['type'].to_s.start_with?('notes') && d['takeable'] != true && d['readDisplay'] != 'gameDisplay'
        issues << "❌ ERROR: #{label} is a non-takeable readable #{d['type']} without readDisplay \"gameDisplay\"; the notes minigame removes what it opens. Add \"readDisplay\": \"gameDisplay\" or make it takeable (one beat)."
      end
      beat = d['takeable'] == true ? 'takeable: one beat, gone for good once taken' : 'not takeable: repeats on later leaves'
      issues << "ℹ️ Left-behind item '#{o.id}' (#{d['leftBehindBy']}, chance #{c.inspect}): #{beat}."
    end
  end

  # Any string in the scenario (conditions, mappings, ink-free fields) naming the global, other than
  # the slots' own revealOnGlobal and the globalVariables declaration.
  def self.global_used_elsewhere?(json, name)
    re = /(?<![A-Za-z0-9_])#{Regexp.escape(name)}(?![A-Za-z0-9_])/
    walk = lambda do |v, key|
      case v
      when Hash then v.any? { |k, x| k != 'globalVariables' && (re.match?(k.to_s) && key != 'globalVariables' ? true : walk.call(x, k)) }
      when Array then v.any? { |x| walk.call(x, key) }
      when String then key != 'revealOnGlobal' && re.match?(v)
      else false
      end
    end
    walk.call(json, nil)
  end

  # A target in another room may be unloaded when needed (rooms load lazily and the
  # system only sees loaded rooms); behind a locked room it may be unreachable.
  def self.room_warnings(json, where, what, target, home_room, issues)
    return if target.room.nil? || target.room == home_room

    issues << "⚠️ WARNING: #{where} #{what} is in room '#{target.room}', not the NPC's home room '#{home_room}'; it may be unloaded when needed."
    return unless json.dig('rooms', target.room, 'locked') == true

    issues << "⚠️ WARNING: #{where} #{what} is in locked room '#{target.room}'; the NPC cannot reach it until the door is open (the selector skips it until then)."
  end
end
