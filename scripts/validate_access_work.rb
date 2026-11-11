# frozen_string_literal: true

# Access model slice 9.2 lints: the USB policy (sub-slice U) and work, outages and frustration
# (sub-slice A). docs/achitechture/ACCESS_MODEL_SLICE_9_2_PLAN.md section 10.
#
# Entry points, called from scripts/validate_scenario.rb:
#
#   ValidateAccessWork.check(json_data)        -> issue strings ("❌ ERROR: work: ...", ...)
#   ValidateAccessWork.report_lines(json_data) -> the work report as lines; [] when nothing applies
#
# No line ever quotes a password.
require 'set'
require_relative '../lib/break_escape/access_work' unless defined?(BreakEscape::AccessWork)

module ValidateAccessWork
  USB_VALUES = %w[allowed storage_blocked blocked].freeze
  SOCIAL_VALUES = %w[allowed blocked].freeze
  USB_CLASSES = %w[storage hid].freeze

  module_function

  def err(issues, msg)
    issues << "❌ ERROR: work: #{msg}"
  end
  def warn(issues, msg)
    issues << "⚠️ WARNING: work: #{msg}"
  end

  def check(json_data)
    issues = []
    return issues unless json_data.is_a?(Hash)

    check_usb(json_data, issues)
    check_work(json_data, issues)
    issues
  end

  # ── shared walks ──────────────────────────────────────────────────────

  # Every object in every room, with nested contents and itemsHeld: [{ obj:, room: }]
  def all_objects(json_data)
    out = []
    walk = lambda do |list, room|
      Array(list).each do |o|
        next unless o.is_a?(Hash)

        out << { obj: o, room: room }
        walk.call(o['contents'], room)
        walk.call(o['itemsHeld'], room)
      end
    end
    (json_data['rooms'] || {}).each do |room_id, room|
      next unless room.is_a?(Hash)

      walk.call(room['objects'], room_id)
      Array(room['npcs']).each { |n| walk.call(n['itemsHeld'], room_id) if n.is_a?(Hash) }
    end
    walk.call(json_data['startItemsInInventory'], nil)
    out
  end

  def room_npcs(json_data)
    (json_data['rooms'] || {}).flat_map do |room_id, room|
      next [] unless room.is_a?(Hash)

      Array(room['npcs']).select { |n| n.is_a?(Hash) && n['id'] }.map { |n| { npc: n, room: room_id } }
    end
  end

  def workstation?(o)
    o.is_a?(Hash) && o['id'] &&
      (o['workstation'] == true || o.key?('locksScreenOnLeave') || o.key?('lockChance') || o['lockType'] == 'login')
  end

  def chatter_off?(json_data)
    json_data['chatter'] == false
  end

  # Whether pool `topic` has a line for this NPC: the scenario's pool plus the NPC's own.
  def pool_has_line?(json_data, npc, topic)
    [json_data['chatter'], npc['chatter']].any? do |c|
      next false unless c.is_a?(Hash)

      v = c[topic]
      v = v['lines'] if v.is_a?(Hash)
      Array(v).any? { |l| l.is_a?(String) && !l.strip.empty? }
    end
  end

  # ── sub-slice U: the USB policy ──────────────────────────────────────

  def accepts_of(o)
    a = o.is_a?(Hash) ? o['affordance'] : nil
    a.is_a?(Hash) ? a['accepts'] : nil
  end

  def usb_governed?(o)
    workstation?(o) || (o['policy'].is_a?(String) && !o['policy'].empty?)
  end

  def effective_policy_name(o, json_data)
    name = o['policy'].is_a?(String) && !o['policy'].empty? ? o['policy'] : json_data['defaultPolicy']
    name.is_a?(String) ? name : nil
  end

  def usb_value(json_data, name)
    p = (json_data['policies'] || {})[name]
    v = p.is_a?(Hash) ? p['usb'] : nil
    USB_VALUES.include?(v) ? v : 'allowed'
  end

  def usb_refused?(usb, cls)
    return false unless USB_CLASSES.include?(cls)
    return true if usb == 'blocked'

    usb == 'storage_blocked' && cls == 'storage'
  end

  # The object's effective usb value, or nil when not governed
  def usb_policy_for(o, json_data)
    return nil unless usb_governed?(o)

    name = effective_policy_name(o, json_data)
    name ? usb_value(json_data, name) : 'allowed'
  end

  # Items an object takes: by an NPC delivery (affordance.accepts tags) or the player's plant (requiresItem)
  def taken_items(o, items)
    tags = Array(accepts_of(o)).grep(String)
    req = o['requiresItem']
    wanted = req.nil? ? [] : Array(req).grep(String)
    items.select do |it|
      (tags.include?(it['needsTag']) && it['needsTag']) ||
        wanted.include?(it['type']) || wanted.include?(it['id']) || wanted.include?(it['name'])
    end
  end

  def check_usb(json_data, issues)
    (json_data['policies'] || {}).each do |name, p|
      next unless p.is_a?(Hash)

      err(issues, "policies.#{name}.usb is '#{p['usb']}'; use one of #{USB_VALUES.join(', ')}.") if p.key?('usb') && !USB_VALUES.include?(p['usb'])
      err(issues, "policies.#{name}.social is '#{p['social']}'; use one of #{SOCIAL_VALUES.join(', ')}.") if p.key?('social') && !SOCIAL_VALUES.include?(p['social'])
    end
    entries = all_objects(json_data)
    entries.each do |e|
      o = e[:obj]
      next unless o.key?('usbClass')

      err(issues, "item '#{o['id'] || o['name']}' has usbClass '#{o['usbClass']}'; use storage or hid.") unless USB_CLASSES.include?(o['usbClass'])
    end
    items = entries.map { |e| e[:obj] }
    takers = entries.map { |e| e[:obj] }.select { |o| accepts_of(o) || o['requiresItem'] }

    # A blocking policy that governs only objects whose items have no usbClass does nothing there
    (json_data['policies'] || {}).each do |name, p|
      next unless p.is_a?(Hash) && USB_VALUES.include?(p['usb']) && p['usb'] != 'allowed'

      governed = takers.select { |o| usb_governed?(o) && effective_policy_name(o, json_data) == name }
      next if governed.empty?
      next if governed.any? { |o| taken_items(o, items).any? { |it| USB_CLASSES.include?(it['usbClass']) } }

      warn(issues, "policies.#{name} sets usb '#{p['usb']}', but every object it governs that takes an item " \
                   "(#{governed.map { |o| o['id'] }.compact.join(', ')}) takes only items with no usbClass: the policy refuses nothing there.")
    end

    # A device accepted by an object no policy governs while the default policy blocks its class
    default_name = json_data['defaultPolicy'].is_a?(String) ? json_data['defaultPolicy'] : nil
    default_usb = default_name ? usb_value(json_data, default_name) : 'allowed'
    if default_usb != 'allowed'
      takers.reject { |o| usb_governed?(o) }.each do |o|
        devices = taken_items(o, items).select { |it| usb_refused?(default_usb, it['usbClass']) }
        next if devices.empty?

        warn(issues, "'#{o['id']}' takes #{devices.map { |it| "'#{it['id']}'" }.join(', ')} (usbClass #{devices.map { |it| it['usbClass'] }.uniq.join(', ')}) " \
                     "and is not a workstation and names no policy, so the default policy '#{default_name}' (usb #{default_usb}) " \
                     "does not reach it: it accepts the device. Name a policy on it if a refusal was meant.")
      end
    end

    # The mutter: an NPC that can be refused a device needs a usb_refused line (plan 5.5)
    return if chatter_off?(json_data)

    room_npcs(json_data).each do |e|
      npc = e[:npc]
      tags = (npc['interests'].is_a?(Hash) ? npc['interests'].keys : [])
      next if tags.empty?

      refusable = tags.any? do |tag|
        devices = items.select { |it| it['needsTag'] == tag && USB_CLASSES.include?(it['usbClass']) }
        devices.any? do |it|
          takers.any? do |o|
            Array(accepts_of(o)).include?(tag) && usb_refused?(usb_policy_for(o, json_data), it['usbClass'])
          end
        end
      end
      next unless refusable
      next if pool_has_line?(json_data, npc, 'usb_refused')

      warn(issues, "#{npc['id']} can be refused a USB device, but no usb_refused line is in the scenario's chatter " \
                   "or the NPC's own: the student sees only a picture. Copy the pool from test_access_work.")
    end
  end

  # ── sub-slice A: work, outages and frustration ───────────────────────

  AW = BreakEscape::AccessWork
  A_ONLY_FIELDS = %w[workNeeds frustration workarounds feed].freeze
  STATION_POOL = 'station_fail'
  NO_ACCESS_POOL = 'work_fail_no_access'
  FALLBACK_POOL = 'work_fail'
  FED_UP_POOL = 'work_fail_fed_up'
  MIN_DEFER_MIN = 0.5

  # NPC records that are not room NPCs: top-level npcs and phoneNPCs, and headless records
  def other_npc_records(json_data)
    out = []
    %w[npcs phoneNPCs].each do |key|
      next unless json_data[key].is_a?(Array)

      json_data[key].each_with_index { |npc, i| out << [npc, "#{key}[#{i}]"] if npc.is_a?(Hash) }
    end
    out.concat(headless_npc_records(json_data)) if respond_to?(:headless_npc_records, true)
    out
  end

  def declared_globals(json_data)
    g = json_data['globalVariables']
    g.is_a?(Hash) ? g : {}
  end

  def object_ids(json_data)
    AW.object_index(json_data).keys
  end

  def coordinate?(home)
    home.is_a?(Hash) || (home.is_a?(Array) && home.size == 2)
  end

  # The PCs an NPC owns through screenOwner
  def screen_owned_pcs(json_data, npc)
    AW.object_index(json_data).values.map { |e| e[:obj] }.select { |o| o['screenOwner'] == npc['id'] }.map { |o| o['id'] }
  end

  def check_work(json_data, issues)
    resources = AW.resources(json_data)
    globals = declared_globals(json_data)
    ids = object_ids(json_data)
    npcs = room_npcs(json_data)

    # Fields allowed only on room NPCs (plan 4): other records reach the browser unfiltered
    other_npc_records(json_data).each do |npc, path|
      A_ONLY_FIELDS.each do |field|
        next unless npc.key?(field)

        err(issues, "'#{path}' has '#{field}', which is allowed only on room NPCs (rooms.<id>.npcs[]): " \
                    'other NPC records reach the browser unfiltered.')
      end
    end

    # Engine-owned globals: <npcId>_frustration
    globals.each_key do |name|
      next unless name.to_s.end_with?('_frustration')

      err(issues, "global '#{name}' ends in '_frustration', a suffix the engine owns (it writes <npcId>_frustration). Rename it.")
    end

    # Resources: references and outage globals
    resources.each do |rid, r|
      if r.key?('object') && !ids.include?(r['object'])
        err(issues, "resources.#{rid}.object '#{r['object']}' names no room object.")
      end
      dn = r['downIf']
      if AW.present_string?(dn) && !globals.key?(dn)
        warn(issues, "resources.#{rid}.downIf '#{dn}' is not declared in globalVariables.")
      end
    end

    # Frustration bounds, on roles and NPCs
    sources = AW.roles_block(json_data).map { |role, r| [r.is_a?(Hash) ? r['frustration'] : nil, "roles.#{role}.frustration"] }
    npcs.each { |e| sources << [e[:npc]['frustration'], "#{e[:npc]['id']}.frustration"] }
    sources.each do |f, where|
      next if f.nil?
      unless f.is_a?(Hash)
        err(issues, "#{where} must be an object { perFail, easePerSuccess, breakDrain }.")
        next
      end
      AW::FRUSTRATION_BOUNDS.each do |field, (lo, hi)|
        next unless f.key?(field)

        v = f[field]
        next if v.is_a?(Numeric) && v >= lo && v <= hi

        err(issues, "#{where}.#{field} is #{v.inspect}; it must be a number from #{lo} to #{hi}.")
      end
    end

    # workNeeds entries that resolve to nothing, on roles and NPCs
    refs = AW.roles_block(json_data).flat_map do |role, r|
      Array(r.is_a?(Hash) ? r['workNeeds'] : nil).map { |x| [x, "roles.#{role}.workNeeds"] }
    end
    npcs.each { |e| Array(e[:npc]['workNeeds']).each { |x| refs << [x, "#{e[:npc]['id']}.workNeeds"] } }
    refs.each do |entry, where|
      id = entry.is_a?(String) ? entry.sub(/\A[+-]/, '') : nil
      next if id && resources.key?(id)

      err(issues, "#{where} entry #{entry.inspect} names no resource in 'resources'.")
    end

    needed = Set.new
    npcs.each do |e|
      npc = e[:npc]
      list = AW.work_list(json_data, npc)
      needed.merge(list) if AW.need?(npc, 'work')
      check_work_npc(json_data, npc, list, resources, issues)
    end

    # A resource no NPC needs, with no contents and no host, exists for nobody
    resources.each do |rid, r|
      next if needed.include?(rid) || r.key?('contents') || AW.present_string?(r['host'])

      warn(issues, "resource '#{rid}' is in no NPC's work list and has no contents and no host: nothing uses it.")
    end
  end

  def check_work_npc(json_data, npc, list, resources, issues)
    nid = npc['id']
    plan = AW.work_plan?(json_data, npc)
    social = AW.need?(npc, 'social_media') && !AW.phone?(npc)

    if plan || social
      dm = npc['needsDeferMin']
      dm = dm.is_a?(Numeric) && dm.positive? ? dm : AW::NEEDS_DEFER_MIN
      if dm < MIN_DEFER_MIN
        why = plan ? 'a work plan' : "a social_media need and \"phone\": false"
        warn(issues, "#{nid} has #{why} and needsDeferMin #{dm}: the park is the retry wait, and the server's park " \
                     "floor needs at least #{MIN_DEFER_MIN} minutes of slack. Raise it to #{MIN_DEFER_MIN} or more.")
      end
    end
    return unless plan

    # Resources it is not admitted to, or can never reach
    list.each do |rid|
      r = resources[rid]
      next unless r

      unless AW.admitted?(r, npc)
        warn(issues, "#{nid} needs '#{rid}' but its access list does not admit #{nid}: its work never succeeds, " \
                     'so it fails (and its workarounds happen) without the player doing anything.')
      end
      rt = AW.routes(json_data, npc, r)
      if rt && rt.empty?
        warn(issues, "#{nid} needs '#{rid}' but its station can never reach it (no route from its network): " \
                     'its work fails from the first use, with no player action.')
      end
    end

    # The station
    home = npc['needsHome']
    st = AW.station(json_data, npc)
    if coordinate?(home) || st.nil? || !AW.satisfies?(json_data, st, 'work')
      owned = screen_owned_pcs(json_data, npc)
      what = coordinate?(home) ? 'a coordinate' : (st ? "'#{home}', which satisfies no work" : (home ? "'#{home}', which names no object" : 'unset'))
      hint = if owned.any?
               " It owns #{owned.map { |id| "'#{id}'" }.join(', ')} through screenOwner: make that its needsHome " \
                 '(a PC owned only through screenOwner is a desk like any other for a judged need).'
             else
               ' Give it a station that authors affordance.satisfies "work" (a sign-in PC takes no office preset).'
             end
      warn(issues, "#{nid} has a work plan, but its needsHome is #{what}: it has no station, so its work goes to " \
                   "any non-desk source or nowhere, and a dead or locked PC never counts.#{hint}")
    elsif !(AW.affordance(json_data, st) || {}).key?('restores')
      warn(issues, "#{nid}'s station '#{st['id']}' satisfies work but has no affordance.restores: each use restores 0, " \
                   'so the NPC works back to back and never rests between uses. Author a restores value (10 suits a fast need).')
    end

    check_mutters(json_data, npc, list, resources, st, issues)

    # Workaround timing (plan 10): no warning before it, or a long wait to watch
    AW.workarounds(json_data, npc).each_with_index do |w, i|
      next unless AW.can_fail?(json_data, npc, 'work')

      t = workaround_timing(json_data, npc, w, resources)
      if !t[:warned] && w['noWarning'] != true
        warn(issues, "#{nid}'s workaround #{i} (#{w['do']}) is at #{t[:at]}, at or below perFail #{t[:per].round}: it comes " \
                     'on the first failure with no tell 1 or 2 before it. Lower perFail, or mark it "noWarning": true.')
      end
      if t[:honest] > 300
        warn(issues, "#{nid}'s workaround #{i} (#{w['do']}) needs about #{t[:honest].round} s of outage to come on: the " \
                     'player stands and watches for more than five minutes.')
      end
    end
  end

  # For each cause the NPC can meet, the cause's own pool or work_fail needs a line (plan 5.5)
  def check_mutters(json_data, npc, list, resources, st, issues)
    return if chatter_off?(json_data)

    causes = [] # [description, pool]
    pcs = [st] + AW.borrow_pcs(json_data, npc).map { |id| AW.object(json_data, id) }
    if pcs.compact.any? { |pc| AW.off_when?(json_data, pc) }
      causes << ['its station going off', STATION_POOL]
    end
    list.each do |rid|
      r = resources[rid]
      next unless r

      causes << ["no access to '#{rid}'", NO_ACCESS_POOL] unless AW.admitted?(r, npc)
      rt = AW.routes(json_data, npc, r)
      can_drop = AW.present_string?(r['downIf']) || (rt && (rt.empty? || rt.any? { |route| !route.empty? }))
      kind = AW.present_string?(r['kind']) ? r['kind'] : nil
      causes << ["'#{rid}' going down", kind ? "work_fail_#{kind}" : nil] if can_drop
    end
    causes.each do |what, pool|
      next if pool && pool_has_line?(json_data, npc, pool)
      next if pool_has_line?(json_data, npc, FALLBACK_POOL)

      named = [pool, FALLBACK_POOL].compact.join(' or ')
      warn(issues, "#{npc['id']} can fail for #{what}, but no #{named} line is in the scenario's chatter or the NPC's own " \
                   "(#{FED_UP_POOL} does not count): the student sees only a picture. Copy the pool from test_access_work.")
    end
  end

  # ── the work report ───────────────────────────────────────────────────

  def report_lines(json_data)
    return [] unless json_data.is_a?(Hash)

    resources = AW.resources(json_data)
    lines = []
    room_npcs(json_data).each do |e|
      npc = e[:npc]
      next unless AW.work_plan?(json_data, npc)

      parts = AW.work_list(json_data, npc).map do |rid|
        r = resources[rid]
        next "#{rid} (unknown)" unless r

        bits = [AW.admitted?(r, npc) ? 'admitted' : 'NOT admitted']
        rt = AW.routes(json_data, npc, r)
        bits << 'never reachable from its station' if rt && rt.empty?
        downs = []
        downs << r['downIf'] if AW.present_string?(r['downIf'])
        rt&.each { |route| downs.concat(route) }
        bits << (downs.empty? ? 'nothing takes it down' : "down while #{downs.uniq.join(' or ')}")
        "#{rid} (#{bits.join(', ')})"
      end
      st = AW.station(json_data, npc)
      station_off = st && AW.off_when?(json_data, st) ? "; station '#{st['id']}' off while #{AW.affordance(json_data, st)['offWhen']}" : ''
      lines << "ℹ️ Work #{npc['id']}: #{parts.join('; ')}#{station_off}."
      AW.workarounds(json_data, npc).each_with_index do |w, i|
        lines << workaround_line(json_data, npc, w, i, resources)
      end
    end
    return [] if lines.empty?

    ['Work report (access slice 9.2):'] + lines
  end

  def workaround_opens(npc, w)
    case w['do']
    when 'writes_down' then "the account of #{npc['id']} (a note at #{npc['needsHome'] || 'its home PC'})"
    when 'share_login' then "the account of #{npc['id']}, said to #{w['with']}"
    when 'borrow_session' then "the session at PC '#{w['pc']}'"
    when 'prop_door' then "room '#{w['door']}', which stays open for the mission"
    when 'emit' then "event '#{w['event']}'"
    else "nothing known ('#{w['do']}')"
    end
  end

  # Plan 10's honest time and earliest time, in seconds
  def workaround_timing(json_data, npc, w, resources)
    per = AW.frustration(json_data, npc)['perFail']
    at = w['at'].is_a?(Numeric) ? w['at'] : 100
    n = (at.to_f / per).ceil
    n = 1 if n < 1
    st = AW.station(json_data, npc)
    use = st ? AW.use_seconds(json_data, st) : AW::NEEDS_DEFAULT_USE_SECONDS
    defer = AW.defer_min(npc)
    honest = use + ((n - 1) * ((defer * 60) + use))
    unadmitted = AW.work_list(json_data, npc).any? { |rid| resources[rid] && !AW.admitted?(resources[rid], npc) }
    earliest = if unadmitted
                 (n - 1) * ((0.9 * defer * 60) - 3)
               else
                 (n - 1) * [(0.9 * AW.shortest_use_seconds(json_data, npc, 'work')) - 3, 0].max
               end
    earliest /= 2.0 if AW.can_fail?(json_data, npc, 'work') && AW.can_fail?(json_data, npc, 'social_media')
    { n: n, per: per, at: at, honest: honest, earliest: [earliest, 0].max, warned: at > per }
  end

  def workaround_line(json_data, npc, w, idx, resources)
    t = workaround_timing(json_data, npc, w, resources)
    warning = t[:warned] ? 'tell 1, tell 2, then the workaround' : 'no warning'
    earliest = t[:n] == 1 ? 'at once' : "#{t[:earliest].round} s"
    "ℹ️ Workaround #{npc['id']}[#{idx}] #{w['do']} at #{t[:at]}: opens #{workaround_opens(npc, w)}; " \
      "#{t[:n]} failed use(s) at perFail #{t[:per].round}; #{warning}; about #{t[:honest].round} s of outage; " \
      "earliest by a modified browser #{earliest} after the first counted fail."
  end
end
