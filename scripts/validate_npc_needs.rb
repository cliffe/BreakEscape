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
    droppables = objs.select { |o| o.data['droppable'] == true }
    droppables.each do |o|
      issues << "⚠️ WARNING: item '#{o.id || o.data['name']}' is droppable without a needsTag — dropping it will not attract any NPC." unless o.data['needsTag'].is_a?(String)
      issues << "❌ ERROR: droppable item '#{o.data['name']}' has no id; the drop is saved by id, so give it a unique one." if o.id.to_s.empty?
    end

    check_private(json, npcs, objs, issues)
    npcs.each { |room_id, npc| check_npc(json, npc, room_id, objs, issues, npcs) }
    issues
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

    (npc['onUse'].is_a?(Hash) ? npc['onUse'] : {}).each_key do |oid|
      issues << "❌ ERROR: #{where} onUse names '#{oid}', which is not an object id in this scenario." unless by_id.key?(oid)
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

  # A target in another room may be unloaded when needed (rooms load lazily and the
  # system only sees loaded rooms); behind a locked room it may be unreachable.
  def self.room_warnings(json, where, what, target, home_room, issues)
    return if target.room.nil? || target.room == home_room

    issues << "⚠️ WARNING: #{where} #{what} is in room '#{target.room}', not the NPC's home room '#{home_room}'; it may be unloaded when needed."
    return unless json.dig('rooms', target.room, 'locked') == true

    issues << "⚠️ WARNING: #{where} #{what} is in locked room '#{target.room}'; the NPC cannot reach it until the door is open (the selector skips it until then)."
  end
end
