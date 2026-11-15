# frozen_string_literal: true

# Office-life validator checks (OFFICE_LIFE_MISSIONS_PLAN section 4). This file holds V10 only;
# the missions tooling adds V1 to V9 here later, so office-life checks stay apart from the readers
# in validate_npc_needs.rb, validate_access_work.rb and validate_scenario.rb.
#
# Entry point: ValidateOfficeLife.check(json) returns issue strings ("⚠️ WARNING ..."). It reuses
# ValidateNpcNeeds's object/preset/leash/privacy helpers so its reasoning matches the needs engine
# (public/break_escape/js/systems/npc-needs.js: _pickBark and its call sites). It reads owner,
# habit and affordance keys by their format 3 names only (the retired-key check rejects old names).
# Engine functions are cited by name, not line number, since the file moves.
#
# V10: a chatter pool, exchange or call that nothing in the scenario can trigger. A lone NPC at a
# chatter object says nothing, so an untriggerable pool is voiced and paid for and never heard.
require 'json'
require 'set'
require_relative 'validate_npc_needs'
require_relative '../lib/break_escape/access_work' unless defined?(BreakEscape::AccessWork)

module ValidateOfficeLife
  VN = ValidateNpcNeeds
  AW = BreakEscape::AccessWork

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
  POOL_FIX = 'give it a partner or trigger, or remove the lines'

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

  def self.check(json)
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
                   :npc_list, :reach, :rooms, :knows, :tellers, keyword_init: true)

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

  # JavaScript Number(v) for JSON values (nil is null); NaN for anything Number cannot read.
  def self.js_number(v)
    case v
    when Numeric then v.to_f
    when nil, false then 0.0
    when true then 1.0
    when String then v.strip.empty? ? 0.0 : (Float(v.strip, exception: false) || Float::NAN)
    else Float::NAN
    end
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

    r = c['avoidRadius']
    v = r.is_a?(Numeric) ? r : (r.is_a?(String) ? Float(r, exception: false) : nil)
    return v.to_f.clamp(0, 10) unless v.nil?

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

  def self.patrols?(n)
    n['behavior'].is_a?(Hash) && n['behavior']['patrol'].is_a?(Hash) && n['behavior']['patrol']['enabled'] == true
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
  # knows of (_magnetsFor reads s.knows), a print errand's printer, an interest item, a workaround
  # visit, or along a patrol. So the rooms are the home and start rooms, the rooms of usable world
  # objects and print producers, and the whole leash reach for a patrol, an interest or a work
  # plan (whose targets V10 does not model). A magnet becomes known by sight (_sight: being in
  # its room) or by word (_tickNews: a knower at home away from it tells a hearer in that room);
  # a known magnet it may use adds its room. Repeat until nothing changes.
  def self.build_rooms(json, ctx)
    ctx.rooms = {}.compare_by_identity
    ctx.knows = {}.compare_by_identity
    prods = ctx.world.select(&:id).group_by(&:id)
    ctx.npc_list.each do |n|
      r = Set[ctx.home_room[n], ctx.npc_room[n]]
      ctx.knows[n] = Set.new
      if runs?(n)
        ctx.world.each { |o| r << o.room if o.room && !fixed_magnet?(o) && can_use?(json, n, o, nil, ctx) }
        print_producers(n).flatten.each { |id| (prods[id] || []).each { |o| r << o.room if o.room } }
      end
      r.merge(reach(json, n, ctx)) if patrols?(n) || (runs?(n) && (!interests_of(n).empty? || AW.work_plan?(json, n)))
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
  # room and that neither avoids (groups do not matter).
  def self.news_pairs(o, actors, ctx)
    actors.select { |k| knows?(k, o, ctx) && ctx.home_room[k] != o.room }.flat_map do |k|
      home = ctx.home_room[k]
      actors.select { |h| !h.equal?(k) && ctx.rooms[h].include?(home) && !avoids_either?(k, h) }.map { |h| [k, h] }
    end
  end

  # Print producer lists for an NPC's print habit (onUse revealOutput) and needs.print mappings.
  def self.print_producers(n)
    prods = []
    (n['onUse'].is_a?(Hash) ? n['onUse'].values : []).each do |h|
      prods << VN.printer_list(h['revealOutput']) if h.is_a?(Hash) && h['revealOutput']
    end
    Array(n['eventMappings']).each do |em|
      pr = em.is_a?(Hash) && em['needs'].is_a?(Hash) && em['needs']['print'].is_a?(Hash) ? em['needs']['print']['producer'] : nil
      prods << VN.printer_list(pr) if pr
    end
    prods
  end

  # May npc use obj for one of `needs` (default all its needs)? A need obj satisfies, no
  # leash/privacy rule bars it, and a fixed magnet is one it knows of (`known: false` skips that).
  def self.can_use?(json, npc, obj, _npcs, ctx, needs = needs_of(npc), known: true)
    aff = obj.data['affordance']
    return false unless aff.is_a?(Hash)
    return false if (needs & VN.list(aff['satisfies'])).empty?
    return false if known && fixed_magnet?(obj) && !knows?(npc, obj, ctx)

    VN.use_rule(json, npc, obj, ctx.home_room[npc], ctx.npc_list).nil?
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

  # Does this object pair users a and b: capacity 2 or more (_maybePair), or a queue the second
  # joins (_tickQueueChats), which _balks refuses an NPC whose maxQueue is 0? With no pair given,
  # whether it can pair anyone.
  def self.pairs?(obj, a = nil, b = nil)
    aff = obj.data['affordance']
    return false unless aff.is_a?(Hash)
    return true if (aff['capacity'] || 1).to_i >= 2
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

  # printer_off: a print source (onUse revealOutput, or a needs.print mapping) all of whose producers
  # have offWhen. _printBlocked speaks grumble_printer_off only (no fallback to grumble).
  def self.printer_off_turn_back?(_json, n, _npcs, ctx)
    return false unless runs?(n)

    off = ->(id) { (o = ctx.world.find { |x| x.id == id }) && o.data['offWhen'] }
    all_off = ->(list) { !list.empty? && list.all? { |id| off.call(id) } }
    print_producers(n).any? { |list| all_off.call(list) }
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

  def self.check_pools(json, npcs, ctx, issues)
    scenario = json['chatter']
    pool_topics(scenario).each do |topic|
      next if VN.pool_lines(scenario[topic]).empty?

      ok = topic_triggerable?(json, topic, nil, npcs, ctx)
      issues << "⚠️ WARNING: scenario chatter pool '#{topic}' is voiced but nothing in the scenario can trigger it (#{ok[1]}); no NPC will ever speak it: #{POOL_FIX}." unless ok[0]
    end
    npcs.each do |_r, n|
      next unless n['chatter'].is_a?(Hash)

      pool_topics(n['chatter']).each do |topic|
        next if VN.pool_lines(n['chatter'][topic]).empty?

        ok = topic_triggerable?(json, topic, n, npcs, ctx)
        issues << "⚠️ WARNING: NPC '#{n['id']}' chatter pool '#{topic}' is voiced but nothing can trigger it (#{ok[1]}); that NPC's own lines for it are never heard: #{POOL_FIX}." unless ok[0]
      end
    end
  end

  # [said when it can happen, said when it cannot]
  GRUMBLE_REASON = {
    'grumble' => ['an avoidance turn-back, or an off or gone turn-back with no lines of its own, can happen',
                  'no avoidance turn-back, which needs an avoid radius and an avoided NPC who can be at a source this NPC uses, and no off or gone turn-back falls back to it'],
    'grumble_off' => ['a dead-machine (offWhen) turn-back can happen',
                      'no dead-machine (offWhen) turn-back can happen for a need that is not judged'],
    'grumble_gone' => ['a magnet can run out', 'no magnet this NPC knows of and may use, so none can run out on it'],
    'grumble_printer_off' => ['a print with every listed printer off can happen',
                              'no print with every listed printer off can happen']
  }.freeze

  # [triggerable?, reason]. `n` nil for a scenario-level pool (any NPC). V10 judges every
  # office-life topic; a topic another subsystem speaks (work failures, access workarounds) is left
  # to that subsystem's check, and a topic nothing speaks at all is a warning.
  def self.topic_triggerable?(json, topic, n, npcs, ctx)
    who = n ? [n] : ctx.npc_list
    if GRUMBLE_TOPICS.include?(topic)
      ok = who.any? { |m| grumble_for?(json, topic, m, npcs, ctx) }
      return [ok, GRUMBLE_REASON[topic][ok ? 0 : 1]]
    end
    if topic == 'phone'
      ok = who.any? { |m| owns_rung_phone?(m, ctx) }
      return [ok, ok ? 'an owner answers a rung phone' : 'no NPC the needs engine runs owns a desk phone that something rings']
    end
    if topic == 'phone_message'
      ok = who.any? { |m| answers_rung_phone?(json, m, npcs, ctx) }
      return [ok, ok ? 'a colleague answers a rung phone' : 'no answersPhones NPC that the needs engine runs is at home in the room of another NPC\'s rung phone']
    end
    tried = []
    if ctx.announce.key?(topic)
      return [true, 'an NPC can tell people about the magnet'] if announce_triggerable?(json, topic, n, ctx)

      tried << 'no NPC can see the magnet and then, in its own home room away from the magnet, tell another NPC'
    end
    if ctx.by_topic.key?(topic)
      return [true, 'a compatible pair can share the object'] if chatter_pair?(json, topic, n, npcs, ctx)

      tried << 'no compatible pair of NPCs can share an object with this chatter'
    end
    return [false, tried.join('; ')] unless tried.empty?
    return [false, 'no magnet without its own announce pool, so nobody tells news'] if topic == 'news'
    return [false, "no object has affordance.chatter \"#{topic}\""] if OFFICE_TOPICS.include?(topic)
    return [true, 'spoken by another engine subsystem (work failures or access workarounds); outside V10'] if other_subsystem_topic?(topic)

    [false, 'the needs engine speaks no pool for this topic (not a chatter object, magnet announce, grumble, work-failure or phone topic)']
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

          issues << "⚠️ WARNING: NPC '#{n['id']}' exchange '#{e['knot']}' (with '#{e['with']}') can never play: the two NPCs share no chatter object they can both use, so they never meet to speak it."
        end
      end
      next unless n['phoneCalls'].is_a?(Array)

      n['phoneCalls'].each do |e|
        next unless e.is_a?(Hash) && e['knot'].is_a?(String)

        entries[e['knot']] << [n, 'phoneCalls', nil]
        next if owns_rung_phone?(n, ctx) || answers_rung_phone?(json, n, npcs, ctx)

        issues << "⚠️ WARNING: NPC '#{n['id']}' phoneCalls knot '#{e['knot']}' can never play: this NPC owns no desk phone that something rings, and answers none either (answersPhones, at home in the phone's room)."
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

  def self.share_any_object?(json, a, b, npcs, ctx)
    return false unless compatible?(a, b)

    ctx.by_topic.values.flatten.uniq.any? do |o|
      pairs?(o, a, b) && can_use?(json, a, o, npcs, ctx) && can_use?(json, b, o, npcs, ctx)
    end
  end
end
