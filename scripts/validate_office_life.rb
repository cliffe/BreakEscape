# frozen_string_literal: true

# Office-life validator checks (OFFICE_LIFE_MISSIONS_PLAN section 4). This file holds V10 only;
# the missions tooling adds V1 to V9 here later, so office-life checks stay apart from the readers
# in validate_npc_needs.rb, validate_access_work.rb and validate_scenario.rb.
#
# Entry point: ValidateOfficeLife.check(json) returns issue strings ("⚠️ WARNING ..."). It reuses
# ValidateNpcNeeds's object/preset/leash/privacy helpers so its reasoning matches the needs engine
# (public/break_escape/js/systems/npc-needs.js: _pickBark 2740 and its call sites). It reads owner,
# habit and affordance keys by their format 3 names only (the retired-key check rejects old names).
#
# V10: a chatter pool, exchange or call that nothing in the scenario can trigger. A lone NPC at a
# chatter object says nothing, so an untriggerable pool is voiced and paid for and never heard.
require 'json'
require 'set'
require_relative 'validate_npc_needs'

module ValidateOfficeLife
  VN = ValidateNpcNeeds

  # Topics the engine speaks from a pool, by call site in npc-needs.js:
  #   grumble / grumble_<reason>: _grumbleTopic 2188 (avoid -> 'grumble'; off/gone/printer_off ->
  #   their own pool when it has lines, else 'grumble'); _failTopic 2296 (judged work failures);
  #   the print-all-off path at 3673 ('grumble_printer_off'). phone / phone_message: _chooseCall 4278.
  #   A chatter-object topic (affordance.chatter): _maybePair 3972, _tickQueueChats 4575, _tickChats.
  #   A magnet's announce pool: _tickNews via _pickBark. 'greet' is just a chatter-object topic.
  GRUMBLE_TOPICS = %w[grumble grumble_off grumble_gone grumble_printer_off].freeze
  PHONE_TOPICS = %w[phone phone_message].freeze

  # Every topic the needs engine (and its access/workaround siblings) can speak, read from
  # PICTURE_CHATTER in npc-needs.js so the list cannot drift. V10 actively judges triggerability for
  # the office-life kinds it models (chatter-object topics, the grumble family, phone topics and
  # magnet announce pools); the rest here (work-failure and access/workaround topics, spoken by
  # npc-workarounds.js and workstation-state.js) are another check's concern, so V10 does not flag
  # them. A topic on none of these lists, and on no chatter object or magnet, is one nothing speaks.
  NEEDS_JS = File.expand_path('../public/break_escape/js/systems/npc-needs.js', __dir__)

  def self.known_engine_topics
    @known_engine_topics ||= begin
      src = File.file?(NEEDS_JS) ? File.read(NEEDS_JS) : ''
      block = src[/PICTURE_CHATTER\s*=\s*Object\.freeze\(\{(.+?)\n\}\);/m, 1] || ''
      Set.new(block.scan(/^\s*([a-z_]+)\s*:/).flatten)
    end
  end

  # work_fail and work_fail_<kind> are spoken by _failTopic for a judged worker's failure.
  def self.work_failure_topic?(topic)
    topic == 'work_fail' || topic.start_with?('work_fail_')
  end

  def self.check(json)
    return [] unless json.is_a?(Hash) && json['rooms'].is_a?(Hash)

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

    ctx = build_context(json, objs, npcs)
    issues = []
    check_pools(json, npcs, ctx, issues)
    check_exchanges(json, npcs, ctx, issues)
    check_phone_calls(json, npcs, ctx, issues)
    issues
  end

  Ctx = Struct.new(:npc_room, :home_room, :by_topic, :announce, :phones, :rung, :all_objs, keyword_init: true)

  def self.build_context(json, objs, npcs)
    by_id = objs.select(&:id).group_by(&:id)
    npc_room = {}
    home_room = {}
    npcs.each do |room_id, n|
      npc_room[n['id']] = room_id
      home_room[n['id']] = home_room_of(json, n, room_id, by_id)
    end
    chatter_objs = objs.select do |o|
      a = o.data['affordance']
      a.is_a?(Hash) && a['chatter'].is_a?(String) && !a['chatter'].empty?
    end
    announce = {}
    objs.each do |o|
      a = o.data['affordance']
      m = a.is_a?(Hash) ? a['magnet'] : nil
      next unless m.is_a?(Hash) && m['announce'].is_a?(String) && !m['announce'].empty?

      (announce[m['announce']] ||= []) << o
    end
    Ctx.new(
      npc_room: npc_room, home_room: home_room,
      by_topic: chatter_objs.group_by { |o| o.data['affordance']['chatter'] },
      announce: announce,
      phones: objs.select { |o| o.data['deskPhone'] == true && !o.id.to_s.empty? },
      rung: ring_targets(json),
      all_objs: objs
    )
  end

  def self.home_room_of(json, npc, npc_room, by_id)
    h = npc['needsHome']
    if h.is_a?(String)
      o = by_id[h]&.first
      return o ? o.room : npc_room
    elsif h.is_a?(Hash) && h['room'].is_a?(String)
      return h['room']
    end
    npc_room
  end

  # Every phone id named by a desk_phone_ring:<id> emit anywhere in the scenario (an object's
  # triggerOnInteract emit_event, or a mapping's emitEvent). onPhoneRing (npc-needs.js 4124) listens
  # on desk_phone_ring:* (5456).
  def self.ring_targets(node, out = Set.new)
    case node
    when String
      out << Regexp.last_match(1) if node =~ /\Adesk_phone_ring:(.+)\z/
    when Array then node.each { |v| ring_targets(v, out) }
    when Hash then node.each_value { |v| ring_targets(v, out) }
    end
    out
  end

  # ── compatibility and reachability, as the engine (npc-needs.js _compatible 3953) ──────────

  def self.groups(n)
    Array(n.dig('needsCompany', 'groups')).select { |x| x.is_a?(String) && !x.empty? }
  end

  # Does a's avoids list name b unconditionally? A requireGlobal-conditioned avoid is skipped: there
  # is a state in which the two can chat, so it never makes a pool untriggerable.
  def self.avoids_one_way?(a, b)
    list = a.dig('needsCompany', 'avoids')
    return false unless list.is_a?(Array)

    list.any? do |e|
      next false if e.is_a?(Hash) && e.key?('requireGlobal')

      who = e.is_a?(Hash) ? (e['npc'] || (e['group'] && "group:#{e['group']}")) : e
      next false unless who.is_a?(String)

      who == '*' || who == b['id'] || (who.start_with?('group:') && groups(b).include?(who[6..]))
    end
  end

  def self.compatible?(a, b)
    return false if avoids_one_way?(a, b) || avoids_one_way?(b, a)

    ga = groups(a)
    gb = groups(b)
    ga.empty? || gb.empty? || (ga & gb).any?
  end

  # May npc use obj for one of its needs? It has a need obj satisfies, and no leash/privacy bars it.
  def self.can_use?(json, npc, obj, npcs, ctx)
    aff = obj.data['affordance']
    return false unless aff.is_a?(Hash)

    needs = npc['needs'].is_a?(Hash) ? npc['needs'].keys : []
    return false if (needs & VN.list(aff['satisfies'])).empty?

    VN.use_rule(json, npc, obj, ctx.home_room[npc['id']], npcs).nil?
  end

  # An object pairs two users: capacity 2 or more, or capacity 1 with a queue the second joins.
  def self.pairs?(obj)
    aff = obj.data['affordance']
    return false unless aff.is_a?(Hash)

    (aff['capacity'] || 1).to_i >= 2 || aff['queue'].is_a?(Hash)
  end

  # Can NPC `n` and some compatible partner meet at an object with this chatter topic (both may use
  # it, it pairs)? If `n` is nil, any compatible pair in the scenario counts (a scenario-level pool).
  def self.chatter_pair?(json, topic, n, npcs, ctx)
    objs = ctx.by_topic[topic] || []
    objs.any? do |o|
      next false unless pairs?(o)

      users = npcs.map(&:last).select { |m| can_use?(json, m, o, npcs, ctx) }
      if n
        users.include?(n) && users.any? { |m| m != n && compatible?(n, m) }
      else
        users.combination(2).any? { |a, b| compatible?(a, b) }
      end
    end
  end

  # ── turn-backs (npc-needs.js TURN_BACK 130, _grumbleTopic 2188) ─────────────────────────────

  # avoid: `n` contends at an object a compatible check would block. Any pair for a scenario pool.
  def self.avoid_turn_back?(json, n, npcs, ctx)
    users_at = lambda do |o|
      npcs.map(&:last).select { |m| can_use?(json, m, o, npcs, ctx) }
    end
    ctx_objs = all_need_objects(json, npcs, ctx)
    if n
      ctx_objs.any? do |o|
        us = users_at.call(o)
        us.include?(n) && us.any? { |m| m != n && !compatible?(n, m) }
      end
    else
      ctx_objs.any? do |o|
        us = users_at.call(o)
        us.combination(2).any? { |a, b| !compatible?(a, b) }
      end
    end
  end

  def self.all_need_objects(_json, _npcs, ctx)
    ctx.by_topic.values.flatten.uniq
  end

  # off: a need object with offWhen that `n` (or any NPC) uses.
  def self.off_turn_back?(json, n, npcs, ctx, objs)
    objs.any? do |o|
      next false unless o.data['offWhen'] && o.data['affordance'].is_a?(Hash)

      if n then can_use?(json, n, o, npcs, ctx)
      else npcs.map(&:last).any? { |m| can_use?(json, m, o, npcs, ctx) }
      end
    end
  end

  # gone: a magnet `n` (or any NPC) has a need for and that can run out (finite servings).
  def self.gone_turn_back?(json, n, npcs, ctx, objs)
    objs.any? do |o|
      a = o.data['affordance']
      m = a.is_a?(Hash) ? a['magnet'] : nil
      next false unless m.is_a?(Hash)

      serv = m['servings']
      next false unless serv.nil? || serv.is_a?(Numeric) # a magnet is served a serving at a time

      want = lambda { |npc| (npc['needs'].is_a?(Hash) ? npc['needs'].keys : []) & VN.list(a['satisfies']) }
      if n then !want.call(n).empty?
      else npcs.map(&:last).any? { |npc| !want.call(npc).empty? }
      end
    end
  end

  # printer_off: a print source (onUse revealOutput, or a needs.print mapping) all of whose producers
  # have offWhen. Checked for one NPC, or any NPC for a scenario pool.
  def self.printer_off_turn_back?(json, n, npcs, ctx, objs)
    off = ->(id) { (o = objs.find { |x| x.id == id }) && o.data['offWhen'] }
    all_off = ->(list) { !list.empty? && list.all? { |id| off.call(id) } }
    list_for = lambda do |npc|
      prods = []
      (npc['onUse'].is_a?(Hash) ? npc['onUse'].values : []).each do |h|
        prods << VN.printer_list(h['revealOutput']) if h.is_a?(Hash) && h['revealOutput']
      end
      Array(npc['eventMappings']).each do |em|
        pr = em.is_a?(Hash) ? em.dig('needs', 'print', 'producer') : nil
        prods << VN.printer_list(pr) if pr
      end
      prods
    end
    targets = n ? [n] : npcs.map(&:last)
    targets.any? { |npc| list_for.call(npc).any? { |list| all_off.call(list) } }
  end

  # ── phones ──────────────────────────────────────────────────────────────────────────────────

  def self.rung_phones(ctx)
    ctx.phones.select { |p| ctx.rung.include?(p.id) }
  end

  # Does `n` own a rung phone?
  def self.owns_rung_phone?(n, ctx)
    rung_phones(ctx).any? { |p| VN.owners_of(p).include?(n['id']) }
  end

  # Can `n` answer a rung phone someone else owns (a colleague answering), by its leash reaching the
  # phone's room?
  def self.answers_rung_phone?(json, n, npcs, ctx)
    rung_phones(ctx).any? do |p|
      owners = VN.owners_of(p)
      next false if owners.include?(n['id']) || owners.empty?

      reach = VN.leash_reach(json, n, ctx.home_room[n['id']])
      reach.include?(p.room)
    end
  end

  # ── the three checks ─────────────────────────────────────────────────────────────────────────

  def self.pool_topics(pools)
    pools.is_a?(Hash) ? pools.keys.reject { |k| k == '_comment' } : []
  end

  def self.check_pools(json, npcs, ctx, issues)
    scenario = json['chatter']
    pool_topics(scenario).each do |topic|
      next if VN.pool_lines(scenario[topic]).empty?

      ok = topic_triggerable?(json, topic, nil, npcs, ctx)
      issues << "⚠️ WARNING: scenario chatter pool '#{topic}' is voiced but nothing in the scenario can trigger it (#{ok[1]}); no NPC will ever speak it." unless ok[0]
    end
    npcs.each do |_r, n|
      next unless n['chatter'].is_a?(Hash)

      pool_topics(n['chatter']).each do |topic|
        next if VN.pool_lines(n['chatter'][topic]).empty?

        ok = topic_triggerable?(json, topic, n, npcs, ctx)
        issues << "⚠️ WARNING: NPC '#{n['id']}' chatter pool '#{topic}' is voiced but nothing can trigger it (#{ok[1]}); that NPC's own lines for it are never heard." unless ok[0]
      end
    end
  end

  # [triggerable?, reason]. `n` nil for a scenario-level pool. V10 judges the office-life kinds; a
  # topic the engine speaks through another subsystem (work failures, access workarounds) is left to
  # that subsystem's check, and a topic nothing speaks at all is a warning.
  def self.topic_triggerable?(json, topic, n, npcs, ctx)
    objs = ctx.all_objs
    if GRUMBLE_TOPICS.include?(topic)
      return grumble_triggerable?(json, topic, n, npcs, ctx, objs)
    end
    if PHONE_TOPICS.include?(topic)
      if topic == 'phone'
        ok = n ? owns_rung_phone?(n, ctx) : npcs.map(&:last).any? { |m| owns_rung_phone?(m, ctx) }
        return [ok, ok ? 'an owner answers a rung phone' : 'no NPC owns a desk phone that something rings']
      end
      ok = n ? answers_rung_phone?(json, n, npcs, ctx) : npcs.map(&:last).any? { |m| answers_rung_phone?(json, m, npcs, ctx) }
      return [ok, ok ? 'a colleague answers a rung phone' : 'no NPC can answer another NPC\'s rung phone']
    end
    if ctx.announce.key?(topic)
      ok = announce_triggerable?(json, topic, n, npcs, ctx)
      return [ok, ok ? 'an NPC can see the magnet' : 'no NPC that needs it can see the magnet it announces']
    end
    if ctx.by_topic.key?(topic)
      ok = chatter_pair?(json, topic, n, npcs, ctx)
      return [ok, ok ? 'a compatible pair can share the object' : 'no compatible pair of NPCs can share an object with this chatter']
    end
    if work_failure_topic?(topic) || known_engine_topics.include?(topic)
      return [true, 'spoken by another engine subsystem (work failures or access workarounds); outside V10']
    end
    [false, 'the needs engine speaks no pool for this topic (not a chatter object, magnet announce, grumble, work-failure or phone topic)']
  end

  def self.grumble_triggerable?(json, topic, n, npcs, ctx, objs)
    ok =
      case topic
      when 'grumble' then avoid_turn_back?(json, n, npcs, ctx)
      when 'grumble_off' then off_turn_back?(json, n, npcs, ctx, objs)
      when 'grumble_gone' then gone_turn_back?(json, n, npcs, ctx, objs)
      when 'grumble_printer_off' then printer_off_turn_back?(json, n, npcs, ctx, objs)
      end
    reason = {
      'grumble' => 'an avoidance turn-back', 'grumble_off' => 'a dead-machine (offWhen) turn-back',
      'grumble_gone' => 'a magnet that runs out', 'grumble_printer_off' => 'a print with every listed printer off'
    }[topic]
    [!!ok, ok ? "#{reason} can happen" : "no #{reason} can happen"]
  end

  def self.announce_triggerable?(json, topic, n, npcs, ctx)
    (ctx.announce[topic] || []).any? do |o|
      a = o.data['affordance']
      sat = VN.list(a['satisfies'])
      want = lambda do |m|
        return false if (m['needs'].is_a?(Hash) ? m['needs'].keys : []).&(sat).empty?
        # a fixed-room magnet must be reachable; an inventory/droppable one (no room) is not fixed
        o.room.nil? || VN.leash_reach(json, m, ctx.home_room[m['id']]).include?(o.room)
      end
      n ? want.call(n) : npcs.map(&:last).any? { |m| want.call(m) }
    end
  end

  # An exchange is heard only when both speakers share one chatter object (capacity 2+, or a queue).
  def self.check_exchanges(json, npcs, ctx, issues)
    by_id = npcs.to_h { |_r, n| [n['id'], n] }
    knot_npcs = Hash.new { |h, k| h[k] = [] }
    npcs.each do |_r, n|
      Array(n['exchanges']).each { |e| knot_npcs[e['knot']] << n['id'] if e.is_a?(Hash) && e['knot'].is_a?(String) }
    end
    npcs.each do |_r, n|
      next unless n['exchanges'].is_a?(Array)

      n['exchanges'].each do |e|
        next unless e.is_a?(Hash) && e['knot'].is_a?(String) && e['with'].is_a?(String)

        partners = exchange_partners(n, e['with'], by_id, npcs)
        shared = partners.any? { |p| share_any_object?(json, n, p, npcs, ctx) }
        unless shared
          issues << "⚠️ WARNING: NPC '#{n['id']}' exchange '#{e['knot']}' (with '#{e['with']}') can never play: the two NPCs share no chatter object they can both use, so they never meet to speak it."
        end
        if knot_npcs[e['knot']].uniq.length > 1
          issues << "⚠️ WARNING: exchange knot '#{e['knot']}' is used by more than one NPC (#{knot_npcs[e['knot']].uniq.sort.join(', ')}); heard_#{e['knot']} is one global by name, so hearing one silences the others."
        end
      end
    end
  end

  def self.exchange_partners(n, with, by_id, npcs)
    if with.start_with?('group:')
      g = with[6..]
      npcs.map(&:last).select { |m| m['id'] != n['id'] && groups(m).include?(g) }
    else
      [by_id[with]].compact
    end
  end

  def self.share_any_object?(json, a, b, npcs, ctx)
    return false unless compatible?(a, b)

    ctx.by_topic.values.flatten.uniq.any? do |o|
      pairs?(o) && can_use?(json, a, o, npcs, ctx) && can_use?(json, b, o, npcs, ctx)
    end
  end

  def self.check_phone_calls(json, npcs, ctx, issues)
    knot_npcs = Hash.new { |h, k| h[k] = [] }
    npcs.each do |_r, n|
      Array(n['phoneCalls']).each { |e| knot_npcs[e['knot']] << n['id'] if e.is_a?(Hash) && e['knot'].is_a?(String) }
    end
    npcs.each do |_r, n|
      next unless n['phoneCalls'].is_a?(Array)

      n['phoneCalls'].each do |e|
        next unless e.is_a?(Hash) && e['knot'].is_a?(String)

        unless owns_rung_phone?(n, ctx) || answers_rung_phone?(json, n, npcs, ctx)
          issues << "⚠️ WARNING: NPC '#{n['id']}' phoneCalls knot '#{e['knot']}' can never play: this NPC owns no desk phone that something rings, and answers none either."
        end
        if knot_npcs[e['knot']].uniq.length > 1
          issues << "⚠️ WARNING: phoneCalls knot '#{e['knot']}' is used by more than one NPC (#{knot_npcs[e['knot']].uniq.sort.join(', ')}); heard_#{e['knot']} is one global by name, so hearing one silences the others."
        end
      end
    end
  end
end
