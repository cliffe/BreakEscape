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
# Each warning names the rule that failed (and, for a chatter object, each object and partner)
# and a fix for that rule.
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
