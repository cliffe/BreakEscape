# frozen_string_literal: true

# Access model slice 9.2 lints: the USB policy (sub-slice U), work, outages and frustration
# (sub-slice A) and workarounds (sub-slice B). docs/achitechture/ACCESS_MODEL_SLICE_9_2_PLAN.md
# section 10.
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
    check_workarounds(json_data, issues)
    check_social(json_data, issues)
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

  # Review R2 n3: governed and the effective policy come from AccessWork, as the server's
  # plant check reads them, so the validator and the server cannot drift
  def usb_governed?(o)
    AW.usb_governed?(o)
  end

  def effective_policy_name(o, json_data)
    name = AW.present_string?(o['policy']) ? o['policy'] : json_data['defaultPolicy']
    AW.present_string?(name) ? name : nil
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
    AW.usb_policy_for(json_data, o)
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
            Array(accepts_of(o)).include?(tag) && AW.plant_refused?(json_data, o, it)
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
  A_ONLY_FIELDS = %w[workNeeds frustration workarounds feed usbHabit].freeze
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
    check_frustration_conditions(json_data, issues)

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
      # A 9.3a resource reached through a foothold (a network) or shown by its row
      # (observations) is used by the player (review R1 m3)
      next if needed.include?(rid) || r.key?('contents') || AW.present_string?(r['host']) ||
              AW.present_string?(r['network']) || AW.present_string?(r['observations'])

      warn(issues, "resource '#{rid}' is in no NPC's work list and has no contents and no host: nothing uses it.")
    end
  end

  # Review R2 n2: <npcId>_frustration is written by the browser. An aim or task unlockCondition
  # (checked on the server) or an event mapping condition that reads one is a gate the player's
  # browser decides; say so, as for any client-written global.
  FRUSTRATION_GLOBAL = /\b[A-Za-z0-9_]+_frustration\b/.freeze

  def check_frustration_conditions(json_data, issues, path = [])
    case json_data
    when Hash
      json_data.each do |k, v|
        if k == 'unlockCondition' && v.is_a?(Hash) && v['globalVariable'].to_s.end_with?('_frustration')
          warn(issues, "#{(path + [k]).join('.')} reads '#{v['globalVariable']}', which the player's browser writes: " \
                       'the gate is decided client-side. Gate on a server-recorded event instead if it must hold.')
        elsif k == 'condition' && v.is_a?(String) && v =~ FRUSTRATION_GLOBAL
          warn(issues, "#{(path + [k]).join('.')} reads '#{Regexp.last_match(0)}', which the player's browser writes: " \
                       'anything it unlocks is decided client-side.')
        else
          check_frustration_conditions(v, issues, path + [k])
        end
      end
    when Array
      json_data.each_with_index { |v, i| check_frustration_conditions(v, issues, path + [i]) }
    end
  end

  def check_work_npc(json_data, npc, list, resources, issues)
    nid = npc['id']
    plan = AW.work_plan?(json_data, npc)
    social = AW.need?(npc, 'social_media') && !AW.phone?(npc)
    check_usb_habit(json_data, npc, plan, issues) if npc.key?('usbHabit')

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

  # The USB habit (USB_HABIT_PLAN.md, q39): its shape, its global, and whether it can act
  def check_usb_habit(json_data, npc, plan, issues)
    nid = npc['id']
    h = npc['usbHabit']
    unless h.is_a?(Hash)
      err(issues, "#{nid}.usbHabit must be an object { every, setGlobal }.")
      return
    end
    if h.key?('every') && !(h['every'].is_a?(Integer) && AW::USB_EVERY_RANGE.cover?(h['every']))
      err(issues, "#{nid}.usbHabit.every is #{h['every'].inspect}; it must be a whole number from 1 to 10.")
    end
    if h.key?('setGlobal') && !(h['setGlobal'].is_a?(String) && declared_globals(json_data).key?(h['setGlobal']))
      err(issues, "#{nid}.usbHabit.setGlobal #{h['setGlobal'].inspect} is not declared in globalVariables: the server only sets a declared global.")
    end
    return if plan

    warn(issues, "#{nid} has a usbHabit but no work plan (a work need and a non-empty workNeeds list): only judged work " \
                 'uses are checked, so the habit never acts. Give it a work plan, or remove the habit.')
  end

  # For each cause the NPC can meet, the cause's own pool or work_fail needs a line (plan 5.5)
  def check_mutters(json_data, npc, list, resources, st, issues)
    return if chatter_off?(json_data)

    causes = [] # [description, pool]
    pcs = [st] + AW.borrow_pcs(json_data, npc).map { |id| AW.object(json_data, id) }
    if pcs.compact.any? { |pc| AW.off_when?(json_data, pc) }
      causes << ['its station going off', STATION_POOL]
    end
    # Sub-slice L (6.6): locked out at its own sign-in PC, a station failure (5.5)
    causes << ['its account being locked out at its station', STATION_POOL] if AW.lockout_station?(json_data, npc)
    causes << ['its PC refusing its USB stick', 'usb_refused'] if AW.usb_habit_refused?(json_data, npc)
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

  # ── sub-slice B: workarounds ─────────────────────────────────────────

  START_POOLS = { 'writes_down' => 'wk_writes_down', 'prop_door' => 'wk_prop_door',
                  'borrow_session' => 'wk_borrow', 'share_login' => 'wk_share_login' }.freeze
  OPENS_FORBIDDEN_TYPES = %w[flag-station vm-launcher].freeze

  def rooms_of(json_data)
    json_data['rooms'].is_a?(Hash) ? json_data['rooms'] : {}
  end

  # The rooms a room's connections name (a direction maps to a room id or a list of them)
  def connected_rooms(room)
    c = room.is_a?(Hash) ? room['connections'] : nil
    return [] unless c.is_a?(Hash)

    c.values.flat_map { |v| Array(v) }.select { |r| r.is_a?(String) }.uniq
  end

  # A gate door into this room: any room's door entry that connects to it with a gate
  def behind_gate?(json_data, room_id)
    rooms_of(json_data).values.any? do |room|
      room.is_a?(Hash) && Array(room['doors']).any? { |d| d.is_a?(Hash) && d['connectedRoom'] == room_id && d['gate'].is_a?(Hash) }
    end
  end

  # An object or anything nested in it of a type the player must not reach this way
  def holds_forbidden?(obj)
    return false unless obj.is_a?(Hash)
    return true if OPENS_FORBIDDEN_TYPES.include?(obj['type'])

    (Array(obj['contents']) + Array(obj['itemsHeld'])).any? { |o| holds_forbidden?(o) }
  end

  def leash_forbids?(npc, room_id, home_room)
    return false if room_id.nil? || room_id == home_room

    allow = npc['needsRooms'].is_a?(Array) ? npc['needsRooms'] : nil
    deny = npc['needsAvoidRooms'].is_a?(Array) ? npc['needsAvoidRooms'] : []
    (allow && !allow.include?(room_id)) || deny.include?(room_id)
  end

  def check_workarounds(json_data, issues)
    globals = declared_globals(json_data)
    rooms = rooms_of(json_data)
    npc_ids = room_npcs(json_data).map { |e| e[:npc]['id'] }
    index = AW.object_index(json_data)

    # Every authored list, on roles and on room NPCs: shape, bounds and kinds
    lists = AW.roles_block(json_data).filter_map { |role, r| r['workarounds'] && [r['workarounds'], "roles.#{role}.workarounds"] }
    room_npcs(json_data).each { |e| lists << [e[:npc]['workarounds'], "#{e[:npc]['id']}.workarounds"] if e[:npc].key?('workarounds') }
    lists.each do |list, where|
      unless list.is_a?(Array)
        err(issues, "#{where} must be a list of { at, do, ... }.")
        next
      end
      list.each_with_index do |w, i|
        unless w.is_a?(Hash)
          err(issues, "#{where}[#{i}] must be an object { at, do, ... }.")
          next
        end
        unless w['at'].is_a?(Numeric) && w['at'] >= 1 && w['at'] <= 100
          err(issues, "#{where}[#{i}].at is #{w['at'].inspect}; it must be a number from 1 to 100.")
        end
        unless AW::WORKAROUND_KINDS.include?(w['do'])
          err(issues, "#{where}[#{i}].do is #{w['do'].inspect}; it must be one of #{AW::WORKAROUND_KINDS.join(', ')}.")
        end
        if w.key?('setGlobal') && !(AW.present_string?(w['setGlobal']) && globals.key?(w['setGlobal']))
          err(issues, "#{where}[#{i}].setGlobal #{w['setGlobal'].inspect} is not declared in globalVariables.")
        end
        err(issues, "#{where}[#{i}] (emit) has no event.") if w['do'] == 'emit' && !AW.present_string?(w['event'])
        { 'pc' => :object, 'prop' => :object, 'door' => :room, 'with' => :npc }.each do |field, kind|
          next unless w.key?(field)

          v = w[field]
          ok = case kind
          when :object then v.is_a?(String) && index.key?(v)
          when :room then v.is_a?(String) && rooms.key?(v)
          else v.is_a?(String) && npc_ids.include?(v)
          end
          what = { object: 'room object', room: 'room', npc: 'room NPC' }[kind]
          err(issues, "#{where}[#{i}].#{field} #{v.inspect} names no #{what}.") unless ok
        end
      end
    end

    # Per room NPC, its resolved list: the kind's own rules. A guest's screen habit is read on
    # the copy with slice 9.1's habits expanded (locksScreen fills screenHabit), as the server reads it.
    expanded = expanded_room_npcs(json_data)
    room_npcs(json_data).each do |e|
      npc = e[:npc]
      list = AW.workarounds(json_data, npc)
      next if list.empty?

      check_npc_workarounds(json_data, npc, e[:room], list, issues, expanded[npc['id']] || npc)
    end
    check_workaround_globals_read_by_server(json_data, issues)
  end

  # Review 9.2 B R2: a workaround's setGlobal is written by the server on "done", but the
  # player's browser can write any global that is not imported. Nothing in B reads one on the
  # server, so writing it gains nothing; a server gate that reads the same name would be opened
  # with one sync. Warn so the author gates on the workaround's event instead.
  def check_workaround_globals_read_by_server(json_data, issues)
    names = room_npcs(json_data).flat_map do |e|
      AW.workarounds(json_data, e[:npc]).filter_map { |w| w.is_a?(Hash) && AW.present_string?(w['setGlobal']) ? w['setGlobal'] : nil }
    end.uniq
    return if names.empty?

    reads = server_read_globals(json_data)
    names.each do |name|
      where = reads[name]
      next if where.nil? || where.empty?

      warn(issues, "workaround setGlobal '#{name}' is also read on the server (#{where.uniq.join(', ')}), but the " \
                   "player's browser can write it, so that gate opens without the workaround. Gate on the workaround's " \
                   'npc_workaround event instead, or keep the global for display only.')
    end
  end

  # { global name => [where] } for the places the server reads a global: an unlockCondition
  # globalVariable, concludeRequires.globals, exportGlobals, a resource's downIf, a route's
  # gate globals and an affordance offWhen
  def server_read_globals(json_data)
    reads = Hash.new { |h, k| h[k] = [] }
    walk = lambda do |node|
      case node
      when Hash
        node.each do |k, v|
          if k == 'unlockCondition' && v.is_a?(Hash) && AW.present_string?(v['globalVariable'])
            reads[v['globalVariable']] << 'an unlockCondition'
          elsif k == 'concludeRequires' && v.is_a?(Hash)
            Array(v['globals']).each { |g| reads[g.to_s] << 'concludeRequires.globals' }
          end
          walk.call(v)
        end
      when Array then node.each { |v| walk.call(v) }
      end
    end
    walk.call(json_data)
    Array(json_data['exportGlobals']).each { |g| reads[g.to_s] << 'exportGlobals' }
    AW.resources(json_data).each do |rid, r|
      reads[r['downIf']] << "resources.#{rid}.downIf" if r.is_a?(Hash) && AW.present_string?(r['downIf'])
    end
    room_npcs(json_data).each do |e|
      AW.work_list(json_data, e[:npc]).each do |rid|
        res = AW.resources(json_data)[rid]
        next unless res

        Array(AW.routes(json_data, e[:npc], res)).flatten.each { |g| reads[g.to_s] << "a route to '#{rid}'" }
      end
    end
    AW.object_index(json_data).each do |oid, entry|
      off = AW.affordance(json_data, entry[:obj])&.dig('offWhen')
      off_names = case off
      when String then [off]
      when Hash then off.keys.map(&:to_s)
      else []
      end
      off_names.each { |g| reads[g] << "#{oid} offWhen" }
    end
    reads
  end

  # { npcId => the room NPC record with slice 9.1's habits expanded }, or {} where 9.1 is not loaded
  def expanded_room_npcs(json_data)
    return {} unless defined?(BreakEscape::NpcHabits) && BreakEscape::NpcHabits.respond_to?(:expanded_copy)

    copy = BreakEscape::NpcHabits.expanded_copy(json_data).first
    room_npcs(copy).each_with_object({}) { |e, h| h[e[:npc]['id']] = e[:npc] if e[:npc]['id'].is_a?(String) }
  rescue StandardError
    {}
  end

  # A PC marked private (office life: in its affordance, or on the object)
  def private_pc?(json_data, pc)
    pc['private'] == true || AW.affordance(json_data, pc)&.dig('private') == true
  end

  # Sub-slice H (plan 6.4 and section 10): the hot desk's rules
  def check_borrow(json_data, npc, w, tag, issues, guest)
    nid = npc['id']
    err(issues, "#{tag}: #{nid} has no account (creds.username), so there is no session to leave.") unless BreakEscape::AccessIdentities.account?(npc)
    pc = AW.present_string?(w['pc']) ? AW.object(json_data, w['pc']) : nil
    return if pc.nil? # "names no room object" is reported above

    pid = pc['id']
    unless BreakEscape::AccessIdentities.login_pc?(pc)
      err(issues, "#{tag}: '#{pid}' is not a sign-in PC (lockType \"login\"), so there is no session to borrow.")
      return
    end
    owner = BreakEscape::AccessIdentities.owner_id(pc, json_data)
    err(issues, "#{tag}: '#{pid}' has an owner (#{owner}); a hot desk is a PC nobody owns.") if owner
    err(issues, "#{tag}: '#{pid}' is private; nobody else may use it.") if private_pc?(json_data, pc)
    if defined?(BreakEscape::NetworkModel) && BreakEscape::NetworkModel.headless?(pc)
      err(issues, "#{tag}: '#{pid}' is headless (no screen), so nobody can sit at it.")
    end
    if BreakEscape::AccessIdentities.account?(npc) && !BreakEscape::AccessIdentities.account_admitted?(pc, npc)
      err(issues, "#{tag}: '#{pid}'s access list does not admit #{nid}.")
    end
    auto = AW.policy_of(json_data, pc)&.dig('autoLockMin')
    err(issues, "#{tag}: '#{pid}' is under a policy with autoLockMin: 0, so no session is ever left open.") if auto.is_a?(Numeric) && auto.zero?
    needs = AW::JUDGED_NEEDS.select { |need| AW.can_fail?(json_data, npc, need) }
    needs = AW::JUDGED_NEEDS.select { |need| AW.need?(npc, need) } if needs.empty?
    unless needs.any? { |need| AW.satisfies?(json_data, pc, need) }
      err(issues, "#{tag}: '#{pid}' has no authored affordance that satisfies #{needs.join(' or ')} (a sign-in PC takes no " \
                  'office preset), so the use there would restore nothing.')
    end
    # q33 review R1 N3: a borrow is for one need; a PC that satisfies another judged need only
    # restores nothing for this one (and, for social_media, its feed post is refused there)
    have = needs.select { |need| AW.satisfies?(json_data, pc, need) }
    lacking = needs - have
    if !have.empty? && !lacking.empty?
      warn(issues, "#{tag}: '#{pid}' satisfies #{have.join(' and ')} but not #{lacking.join(' or ')}, which #{nid} can also " \
                   'fail: a borrow for that need restores nothing there' \
                   "#{lacking.include?('social_media') ? ' and its feed post is refused' : ''}.")
    end
    if BreakEscape::AccessIdentities.screen_always_locks?({}, guest)
      warn(issues, "#{tag}: #{nid} is a careful guest (no screenHabit, or one that always locks), so it signs out of " \
                   "'#{pid}' and the workaround opens nothing. Author \"screenHabit\": { \"lockChance\": 0 } or " \
                   'locksScreen: "never" on a borrower meant to leave the session open.')
    end
    if pc.key?('lockChance') || pc.key?('locksScreenOnLeave')
      warn(issues, "#{tag}: '#{pid}' sets lockChance or locksScreenOnLeave, which a guest ignores (its own screenHabit decides).")
    end
    if holds_forbidden?(pc)
      warn(issues, "#{tag} opens a session at '#{pid}', which is a flag station or VM launcher: a modified browser can reach " \
                   'it this way; put it behind something the server checks.')
    end
  end

  # Sub-slice H (plan 6.5 and section 10): the shared login's rules
  def check_share(json_data, npc, w, tag, issues)
    nid = npc['id']
    err(issues, "#{tag}: #{nid} has no account (creds.username), so there is no login to say.") unless BreakEscape::AccessIdentities.account?(npc)
    err(issues, "#{tag}: with names #{nid} itself; a login is shared with a colleague.") if w['with'] == nid
    colleague = room_npcs(json_data).find { |e| e[:npc]['id'] == w['with'] }&.dig(:npc)
    if colleague && colleague['needsRooms'].is_a?(Array) && !colleague['needsRooms'].empty?
      warn(issues, "#{tag}: #{w['with']} has a needsRooms leash (#{colleague['needsRooms'].join(', ')}): the share can happen " \
                   'in any of those rooms, and is heard only in one the player has opened.')
    end
    if BreakEscape::AccessIdentities.account?(npc)
      bad = BreakEscape::AccessIdentities.sign_in_pcs(json_data).map { |x| x[:object] }.select do |pc|
        pc.is_a?(Hash) && BreakEscape::AccessIdentities.account_admitted?(pc, npc) && holds_forbidden?(pc)
      end.map { |pc| pc['id'] }
      warn(issues, "#{tag} opens #{nid}'s account, which signs in at #{bad.join(', ')}, holding a flag station or VM launcher: " \
                   'a modified browser can reach it this way; put it behind something the server checks.') if bad.any?
    end
    return if chatter_off?(json_data) || pool_has_line?(json_data, npc, 'login_aloud')

    warn(issues, "#{tag} has no login_aloud line in the scenario's chatter or the NPC's own: the student would see only a " \
                 'picture beside the colleague. Copy the pool from test_access_work.')
  end

  def check_npc_workarounds(json_data, npc, home_room, list, issues, guest = npc)
    nid = npc['id']
    rooms = rooms_of(json_data)
    index = AW.object_index(json_data)
    st = AW.station(json_data, npc)
    unless AW::JUDGED_NEEDS.any? { |need| AW.can_fail?(json_data, npc, need) }
      warn(issues, "#{nid} has workarounds but can never be frustrated (no need of its can fail): they will never happen.")
    end

    list.each_with_index do |w, i|
      tag = "#{nid}'s workaround #{i} (#{w['do']})"
      case w['do']
      when 'writes_down'
        err(issues, "#{tag}: #{nid} has no account (creds.username), so there is nothing to write down.") unless BreakEscape::AccessIdentities.account?(npc)
        if st.nil? || !BreakEscape::AccessIdentities.login_pc?(st)
          err(issues, "#{tag}: #{nid}'s needsHome is not a sign-in PC (lockType \"login\"), so no sign-in screen shows the note.")
        elsif (st['postitNote'].is_a?(String) && !st['postitNote'].strip.empty?) || st['showPostit'] == false
          warn(issues, "#{tag}: '#{st['id']}' authors its own postitNote or sets showPostit: false, which wins over the " \
                       'written-down note: the workaround shows nothing new.')
        else
          # The server's owner rule (Game#login_pc_owner): screenOwner first, else the first room
          # NPC whose needsHome is the PC. Another owner means a mark on the screen and no note.
          owner = st['screenOwner'].is_a?(String) && !st['screenOwner'].empty? ? st['screenOwner'] : room_npcs(json_data).map { |x| x[:npc] }.find { |n| n['needsHome'] == st['id'] }&.dig('id')
          if owner != nid
            err(issues, "#{tag}: '#{st['id']}' belongs to #{owner.inspect} (screenOwner, else the first NPC with it as needsHome), " \
                        "not #{nid}, so the sign-in screen shows no note.")
          end
        end
        if BreakEscape::AccessIdentities.account?(npc)
          pw = npc.dig('creds', 'password')
          err(issues, "#{tag}: #{nid} has no password (creds.password), so the note would be empty.") unless pw.is_a?(String) && !pw.empty?
        end
        pcs = BreakEscape::AccessIdentities.sign_in_pcs(json_data).map { |x| x[:object] }.select do |pc|
          pc.is_a?(Hash) && BreakEscape::AccessIdentities.account_admitted?(pc, npc)
        end
        bad = pcs.select { |pc| holds_forbidden?(pc) }.map { |pc| pc['id'] }
        warn(issues, "#{tag} opens #{nid}'s account, which signs in at #{bad.join(', ')}, holding a flag station or VM launcher: " \
                     'a modified browser can reach it this way; put it behind something the server checks.') if bad.any?
      when 'prop_door'
        door = w['door']
        err(issues, "#{tag} has no door (the locked room it props open); the server never hands it over.") unless AW.present_string?(door)
        err(issues, "#{tag} has no prop (the object the NPC walks to); the server never hands it over.") unless AW.present_string?(w['prop'])
        if !AW.present_string?(w['setGlobal'])
          warn(issues, "#{tag} has no setGlobal: nothing can reveal its prop when the door is propped.")
        elsif AW.present_string?(w['prop']) && index[w['prop']] && index[w['prop']][:obj].is_a?(Hash) &&
              index[w['prop']][:obj]['revealOnGlobal'] != w['setGlobal']
          warn(issues, "#{tag}: prop '#{w['prop']}' is not hidden with revealOnGlobal \"#{w['setGlobal']}\", so it is on show " \
                       'before the door is propped, or never.')
        end
        room = rooms[door]
        if room.is_a?(Hash)
          err(issues, "#{tag}: room '#{door}' is not locked; a propped door opens nothing.") unless room['locked'] == true
          err(issues, "#{tag}: room '#{door}' is behind a gate door; prop a plain locked door.") if behind_gate?(json_data, door)
          err(issues, "#{tag}: room '#{door}' is #{nid}'s own room (an NPC behind a locked door is never simulated).") if door == home_room
          card = BreakEscape::AccessIdentities.npc_card(npc)
          opens = room['lockType'] == 'rfid' && card &&
                  BreakEscape::AccessIdentities.card_opens?(room, BreakEscape::AccessIdentities.card_id_of(card).to_s, [{ npc: npc }])
          unless opens
            warn(issues, "#{tag}: #{nid}'s own card and role do not open '#{door}', so the student sees someone prop a door " \
                         'they could not open.')
          end
          if Array(room['objects']).any? { |o| holds_forbidden?(o) }
            warn(issues, "#{tag} opens room '#{door}', which holds a flag station or VM launcher: a modified browser can reach " \
                         'it this way; put it behind something the server checks.')
          end
        end
        prop_entry = AW.present_string?(w['prop']) ? index[w['prop']] : nil
        if prop_entry && room.is_a?(Hash)
          prop_room = prop_entry[:room_id]
          if prop_room == door
            err(issues, "#{tag}: prop '#{w['prop']}' is inside '#{door}' itself; the NPC must reach it while the door is shut.")
          elsif !connected_rooms(room).include?(prop_room) && !connected_rooms(rooms[prop_room]).include?(door)
            err(issues, "#{tag}: prop '#{w['prop']}' is in '#{prop_room}', which is not connected to '#{door}'.")
          end
          if leash_forbids?(npc, prop_room, home_room)
            warn(issues, "#{tag}: prop '#{w['prop']}' is in '#{prop_room}', a room #{nid}'s leash forbids, so the visit never starts.")
          end
        end
      when 'borrow_session'
        check_borrow(json_data, npc, w, tag, issues, guest)
      when 'share_login'
        check_share(json_data, npc, w, tag, issues)
      end
      pool = START_POOLS[w['do']]
      next if pool.nil? || chatter_off?(json_data) || pool_has_line?(json_data, npc, pool)

      warn(issues, "#{tag} has no #{pool} line in the scenario's chatter or the NPC's own: the act is not tied to the " \
                   'outage in words. Copy the pool from test_access_work.')
    end
  end

  # ── the work report ───────────────────────────────────────────────────

  def report_lines(json_data)
    return [] unless json_data.is_a?(Hash)

    resources = AW.resources(json_data)
    lines = []
    feed_report_lines(json_data, lines)
    reactive_report_lines(json_data, lines)
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
      if AW.lockout_station?(json_data, npc)
        max = AW.policy_of(json_data, st)['maxAttempts']
        station_off += "; locked out at '#{st['id']}' after #{max.to_i} wrong passwords for its username there (a denial of service)"
      end
      if AW.usb_habit(npc) && st
        every = AW.usb_every(npc)
        nth = every == 1 ? 'every' : "every #{every}#{every == 2 ? 'nd' : every == 3 ? 'rd' : 'th'}"
        station_off += if AW.usb_habit_refused?(json_data, npc)
                         "; #{nth} use at '#{st['id']}' copies to a USB stick, which its policy refuses (cause usb_refused)"
                       else
                         "; #{nth} use at '#{st['id']}' copies to a USB stick, which its policy allows"
                       end
      end
      lines << "ℹ️ Work #{npc['id']}: #{parts.join('; ')}#{station_off}."
      AW.workarounds(json_data, npc).each_with_index do |w, i|
        lines << workaround_line(json_data, npc, w, i, resources)
      end
    end
    return [] if lines.empty?

    ['Work report (access slice 9.2):'] + lines.sort_by.with_index { |l, i| [l.start_with?('ℹ️ Feed', 'ℹ️ Reactive feed', 'ℹ️   ') ? 1 : 0, i] }
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
    pace = earliest_pace(json_data, npc, st)
    earliest = (n - 1) * pace[:seconds]
    earliest /= 2.0 if AW.can_fail?(json_data, npc, 'work') && AW.can_fail?(json_data, npc, 'social_media')
    { n: n, per: per, at: at, honest: honest, earliest: [earliest, 0].max, warned: at > per, note: pace[:note] }
  end

  # The gap a modified browser can hold between counted fails (plan 9.1 and 9.3; review R1 m1, m2,
  # R2 m3):
  # - with a cause the server owns (not admitted, a [] route), `rearmed` is ignored and every
  #   work ease is refused (both causes hold at every place), so the gap is the park floor,
  #   halved when the station has an offWhen (R5 n1: an off fail and an owned-cause fail
  #   alternate, each held only to the use floor after the other).
  # - otherwise every cause can clear in play: the use floor.
  # - sub-slice L: an NPC whose only failure is a lockout at its station has an owned cause once
  #   the player has locked it out: `rearmed` is ignored and its station eases are refused, so a
  #   fail comes a use floor after the last only when an ease at another place (a non-desk source
  #   or a borrowed PC) lies between: "only by alternating eases and fails"; with no other place,
  #   the park floor.
  def earliest_pace(json_data, npc, st)
    use = [(0.9 * AW.shortest_use_seconds(json_data, npc, 'work')) - 3, 0].max
    owned = AW.owned_causes(json_data, npc, 'work', [])
    park = (0.9 * AW.defer_min(npc) * 60) - 3
    if owned.empty? && lockout_only?(json_data, npc, st)
      other = AW.places(json_data, npc, 'work').any? { |id| id != st['id'] } || AW.borrow_pcs(json_data, npc).any?
      return other ? { seconds: use, note: 'only by alternating eases and fails, once the player has locked it out' } : { seconds: park, note: nil }
    end
    return { seconds: use, note: nil } if owned.empty?

    park /= 2.0 if AW.off_when?(json_data, st)
    { seconds: park, note: nil }
  end

  # Sub-slice L: the lockout is the NPC's one way to fail at work (no resource can drop, its
  # station has no offWhen)
  def lockout_only?(json_data, npc, st)
    return false unless st && AW.lockout_station?(json_data, npc) && !AW.off_when?(json_data, st)

    res = AW.resources(json_data)
    AW.work_list(json_data, npc).filter_map { |id| res[id] }.none? do |r|
      rt = AW.routes(json_data, npc, r)
      !AW.admitted?(r, npc) || AW.present_string?(r['downIf']) || (rt && (rt.empty? || rt.any? { |route| !route.empty? }))
    end
  end

  def workaround_line(json_data, npc, w, idx, resources)
    t = workaround_timing(json_data, npc, w, resources)
    warning = t[:warned] ? 'tell 1, tell 2, then the workaround' : 'no warning'
    earliest = t[:n] == 1 ? 'at once' : "#{t[:earliest].round} s#{t[:note] ? " (#{t[:note]})" : ''}"
    "ℹ️ Workaround #{npc['id']}[#{idx}] #{w['do']} at #{t[:at]}: opens #{workaround_opens(npc, w)}; " \
      "#{t[:n]} failed use(s) at perFail #{t[:per].round}; #{warning}; about #{t[:honest].round} s of outage; " \
      "earliest by a modified browser #{earliest} after the first counted fail."
  end

  # ── sub-slice C: social media feeds (plan 8 and 10) ──────────────────

  SOCIAL_BLOCKED_POOL = 'social_blocked'
  SHORT_TEXT = 12
  # Keys never sent to the browser on a room NPC (game.rb WITHHELD_NPC_KEYS and
  # WITHHELD_WORK_NPC_KEYS); top-level blocks the bootstrap deletes
  WITHHELD_NPC_KEYS = %w[creds awareness habits role workarounds workNeeds frustration feed].freeze
  WITHHELD_TOP_KEYS = %w[flags accountProfiles roles resources networks].freeze

  def osint_sites(json_data)
    social = json_data['social'].is_a?(Hash) ? json_data['social'] : {}
    osint = social['osint'].is_a?(Hash) ? social['osint'] : {}
    Array(osint['sites']).select { |site| site.is_a?(Hash) }
  end

  # Every block or post id in social.osint (page blocks, profile posts and blocks, list items)
  def osint_block_ids(json_data)
    ids = []
    walk = lambda do |v|
      case v
      when Hash
        ids << v['id'] if v['id'].is_a?(String) && (v.key?('text') || v.key?('fact') || v.key?('kind'))
        v.each_value { |x| walk.call(x) }
      when Array then v.each { |x| walk.call(x) }
      end
    end
    osint_sites(json_data).each { |site| walk.call(site['pages']); walk.call(site['profiles']); walk.call(site['blocks']); walk.call(site['fields']) }
    ids
  end

  # Every place a fact is named outside a feed: a `fact` key anywhere (blocks, document fields,
  # tool results, a grant_fact action, a mail highlight) and a call grant's `intel` list.
  # [[fact, path]]
  def fact_mentions(json_data)
    out = []
    walk = lambda do |v, path|
      case v
      when Hash
        v.each do |k, x|
          next if k == 'feed' && path.match?(%r{\Arooms/[^/]+/npcs\[\d+\]\z})
          next if k == 'intelFacts' && path == 'social'

          out << [x, "#{path}/#{k}"] if k == 'fact' && x.is_a?(String)
          Array(x['intel']).each { |f| out << [f, "#{path}/#{k}/intel"] if f.is_a?(String) } if k == 'grants' && x.is_a?(Hash)
          walk.call(x, path.empty? ? k.to_s : "#{path}/#{k}")
        end
      when Array then v.each_with_index { |x, i| walk.call(x, "#{path}[#{i}]") }
      end
    end
    walk.call(json_data, '')
    out
  end

  # Every string that ships to the browser, approximately: the scenario less the keys the server
  # withholds, the feeds and the feed facts' entries. For the "occurs inside another string" warning.
  def shipped_strings(json_data, feed_facts)
    out = []
    walk = lambda do |v, path, npc_level|
      case v
      when String then out << v
      when Hash
        v.each do |k, x|
          next if path.empty? && WITHHELD_TOP_KEYS.include?(k)
          next if npc_level && WITHHELD_NPC_KEYS.include?(k)
          next if path == 'social/intelFacts' && feed_facts.include?(k)

          child = path.empty? ? k.to_s : "#{path}/#{k}"
          walk.call(x, child, false)
        end
      when Array
        v.each_with_index { |x, i| walk.call(x, "#{path}[#{i}]", path.match?(%r{\Arooms/[^/]+/npcs\z})) }
      end
    end
    walk.call(json_data, '', false)
    out
  end

  def awareness_level(json_data, npc)
    if defined?(BreakEscape::NpcHabits) && BreakEscape::NpcHabits.respond_to?(:level_of)
      [BreakEscape::NpcHabits.level_of(npc, json_data), true]
    else
      [npc['awareness'], false]
    end
  end

  def passwords(json_data)
    room_npcs(json_data).filter_map do |e|
      pw = e[:npc].dig('creds', 'password')
      [e[:npc]['id'], pw] if pw.is_a?(String) && pw.length >= 4
    end
  end

  # Every chatter pool's lines (the scenario's and each NPC's own): [[text, path]]
  def chatter_lines(json_data)
    out = []
    pools = [[json_data['chatter'], 'chatter']]
    room_npcs(json_data).each { |e| pools << [e[:npc]['chatter'], "#{e[:npc]['id']}.chatter"] }
    pools.each do |c, path|
      next unless c.is_a?(Hash)

      c.each do |topic, v|
        v = v['lines'] if v.is_a?(Hash)
        Array(v).each { |l| out << [l, "#{path}.#{topic}"] if l.is_a?(String) }
      end
    end
    out
  end

  def check_social(json_data, issues)
    sites = osint_sites(json_data).to_h { |site| [site['id'], site] }
    facts = json_data.dig('social', 'intelFacts')
    facts = {} unless facts.is_a?(Hash)
    feed_facts = AW.feed_facts(json_data)
    block_ids = osint_block_ids(json_data)
    seen_posts = {}
    pws = passwords(json_data)
    shipped = nil
    fed = []

    room_npcs(json_data).each do |e|
      npc = e[:npc]
      nid = npc['id']
      check_social_need(json_data, npc, issues)
      feed = npc['feed']
      next if feed.nil?

      unless feed.is_a?(Hash) && feed['posts'].is_a?(Array)
        err(issues, "#{nid}.feed must be an object with a posts list (feed.posts[]), not a bare list.")
        next
      end
      site = sites[feed['site']]
      if !site
        err(issues, "#{nid}.feed.site '#{feed['site']}' names no social.osint site.")
      elsif site['type'] != 'social'
        err(issues, "#{nid}.feed.site '#{feed['site']}' is a #{site['type'] || 'typeless'} site; a feed needs a social site.")
      elsif !Array(site['profiles']).any? { |pr| pr.is_a?(Hash) && pr['person'] == feed['person'] }
        err(issues, "#{nid}.feed.person '#{feed['person']}' is no profile on '#{feed['site']}': its posts would show nowhere.")
      end
      unless AW.need?(npc, 'social_media')
        # Review C R1 m1: a post with a fact hides that fact for good, so that is an error
        if feed['posts'].any? { |p| p.is_a?(Hash) && AW.present_string?(p['fact']) }
          err(issues, "#{nid} has a feed but no social_media need: it never posts, so its posts' facts can never be granted.")
        else
          warn(issues, "#{nid} has a feed but no social_media need: it never posts.")
        end
      end
      fed << npc if AW.feeds?(npc)
      check_feed_order(json_data, npc, nid, feed, issues)
      level, from_habits = awareness_level(json_data, npc)
      feed['posts'].each_with_index do |post, i|
        tag = "#{nid}.feed.posts[#{i}]"
        unless post.is_a?(Hash) && AW.present_string?(post['id'])
          err(issues, "#{tag} needs an id: a post without one is never served or clickable.")
          next
        end
        pid = post['id']
        if seen_posts.key?(pid)
          err(issues, "#{tag} id '#{pid}' is also #{seen_posts[pid]}'s feed post id.")
        elsif block_ids.include?(pid)
          err(issues, "#{tag} id '#{pid}' is also a post or block id in social.osint.")
        end
        seen_posts[pid] ||= nid
        check_reactive_post(json_data, npc, nid, tag, post, issues) if post.is_a?(Hash) && post.key?('when')
        texts = [[post['text'], "#{tag}.text"]]
        if post.key?('fact')
          fid = post['fact']
          if !AW.present_string?(fid) || !facts[fid].is_a?(Hash)
            err(issues, "#{tag}.fact '#{fid}' names no social.intelFacts entry.")
          else
            texts << [facts[fid]['text'], "social.intelFacts.#{fid}.text"]
            if level == 'high' && post['deliberate'] != true
              note = from_habits ? '' : ' (read from the authored awareness string; slice 9.1 is not loaded here)'
              warn(issues, "#{tag} carries the fact '#{fid}' but #{nid}'s awareness is high#{note}: a careful person " \
                           'would not post it. Mark the post "deliberate": true if that is meant.')
            end
          end
        end
        texts.each do |text, where|
          next unless text.is_a?(String)

          pws.each do |owner, pw|
            err(issues, "#{where} contains #{owner}'s password: feed text ships once its post is out.") if text.include?(pw)
          end
          if text.strip.length < SHORT_TEXT
            warn(issues, "#{where} is under #{SHORT_TEXT} characters: the leak checks match whole texts and cannot protect it.")
          else
            shipped ||= shipped_strings(json_data, feed_facts)
            if shipped.any? { |str| str.include?(text) }
              warn(issues, "#{where} occurs inside another string that ships from the start: the leak checks cannot protect it.")
            end
          end
        end
      end
    end

    # A feed fact may be granted only by its feed post (plan 8.3)
    unless feed_facts.empty?
      fact_mentions(json_data).each do |fid, path|
        next unless feed_facts.include?(fid)

        err(issues, "the feed fact '#{fid}' is also named at #{path}: that grant would need its text in the browser from the start. " \
                    'Name a feed fact only in its post (a readiness slot or phishing factor holding the id is fine).')
      end
    end

    chatter_lines(json_data).each do |line, path|
      pws.each do |owner, pw|
        err(issues, "#{path} contains #{owner}'s password: a chatter line ships with the scenario.") if line.include?(pw)
      end
    end
  end

  def check_social_need(json_data, npc, issues)
    return unless AW.need?(npc, 'social_media')

    nid = npc['id']
    st = AW.station(json_data, npc)
    desk = st && AW.desk?(json_data, st)
    unless AW.phone?(npc)
      if !desk && AW.places(json_data, npc, 'social_media').empty?
        err(issues, "#{nid} has a social_media need, \"phone\": false, no workstation for a home and no object whose " \
                    'affordance.satisfies social_media: the need has no source at all.')
      end
      # Review C R1 M2: the own PC is its only source and blocks social media, with no borrow to
      # go to: the need fails at every use and is never met (and the NPC never posts)
      if desk && AW.social_blocked?(json_data, npc) && (AW.places(json_data, npc, 'social_media') - [st['id']]).empty? &&
         AW.borrow_pcs(json_data, npc).empty?
        warn(issues, "#{nid} has a social_media need and \"phone\": false, and its only source is its own workstation " \
                     "'#{st['id']}', whose policy blocks social media, with no borrow_session workaround: the need is never met.")
      end
      if desk && AW.social_blocked?(json_data, npc) && !chatter_off?(json_data) && !pool_has_line?(json_data, npc, SOCIAL_BLOCKED_POOL)
        warn(issues, "#{nid} can fail social media at '#{st['id']}' (its policy blocks it), but no #{SOCIAL_BLOCKED_POOL} line " \
                     "is in the scenario's chatter or the NPC's own: the student sees only a picture.")
      end
      # q33 review R1 m3: a lockout at the own station fails the attempt with station_fail too
      causes = []
      causes << 'its station going off' if desk && AW.off_when?(json_data, st)
      causes << 'its account being locked out at its station' if desk && AW.lockout_station?(json_data, npc)
      if !causes.empty? && !AW.work_plan?(json_data, npc) && !chatter_off?(json_data) &&
         !pool_has_line?(json_data, npc, STATION_POOL) && !pool_has_line?(json_data, npc, FALLBACK_POOL)
        warn(issues, "#{nid} can fail social media with #{causes.join(' or ')}, but no #{STATION_POOL} or #{FALLBACK_POOL} line " \
                     "is in the scenario's chatter or the NPC's own: the student sees only a picture.")
      end
    end
    cos = npc.dig('los', 'challengeOnSight')
    if AW.phone?(npc) && cos && !(cos.is_a?(Hash) && cos['enabled'] == false)
      period = AW.post_period_seconds(json_data, npc)
      every = period ? " (about every #{period.round} s)" : ''
      warn(issues, "#{nid} challenges on sight and has a social_media need and a phone: while on the phone it does not look, " \
                   "so it can be walked past once every period of the need#{every}.")
    end
  end

  # ── sub-slice C2: reactive posts (plan ACCESS_MODEL_SLICE_9_2_C2_PLAN.md section 8) ──

  # A feed's `order` must be one of the three modes; a mode that does not fit the feed's mix of
  # ordered and reactive posts is a likely mistake (warn)
  def check_feed_order(json_data, npc, nid, feed, issues)
    order = feed['order']
    unless order.nil? || AW::FEED_ORDERS.include?(order)
      err(issues, "#{nid}.feed.order '#{order}' is not one of #{AW::FEED_ORDERS.join(', ')}.")
      return
    end
    posts = feed['posts'].select { |p| p.is_a?(Hash) }
    reactive = posts.select { |p| AW.reactive_post?(p) }
    ordered = posts.reject { |p| AW.reactive_post?(p) }
    if order == 'facts_first' && !reactive.empty? && ordered.empty?
      warn(issues, "#{nid}.feed.order is 'facts_first' but every post is reactive: there is no fact post to come " \
                   'first. Did you mean reactive_first or mixed?')
    elsif order == 'reactive_first' && reactive.empty? && !ordered.empty?
      warn(issues, "#{nid}.feed.order is 'reactive_first' but no post is reactive: it has no effect.")
    end
    return if reactive.empty?

    # The reactive posts read failure/frustration state the NPC can never produce
    unless AW::JUDGED_NEEDS.any? { |need| AW.can_fail?(json_data, npc, need) }
      warn(issues, "#{nid} has reactive feed posts but no work plan it can fail and no blockable social_media: their " \
                   'conditions read frustration state the NPC never produces, so they never fire.')
    end
  end

  # A reactive post (a `when` object): its predicates must be well formed, and it should be able to
  # fire (the shared AW.when_reachable? check, so a dead `when` warns here and does not hold the
  # feed open at run time either).
  def check_reactive_post(json_data, npc, nid, tag, post, issues)
    cond = post['when']
    unless cond.is_a?(Hash)
      err(issues, "#{tag}.when must be an object of condition predicates.")
      return
    end
    if cond.empty?
      err(issues, "#{tag}.when is empty: a reactive post that always fires is an ordered post, so drop `when`.")
      return
    end

    need = cond['need']
    err(issues, "#{tag}.when.need '#{need}' is not 'work' or 'social_media'.") if cond.key?('need') && !AW::JUDGED_NEEDS.include?(need)
    cond.each_key do |key|
      err(issues, "#{tag}.when has an unknown predicate '#{key}' (allowed: #{AW::WHEN_KEYS.join(', ')}).") unless AW::WHEN_KEYS.include?(key)
    end

    if cond.key?('cause')
      whys = Array(cond['cause'])
      bad = whys.reject { |w| AW::FAIL_CAUSES.include?(w) }
      err(issues, "#{tag}.when.cause names #{bad.map { |w| "'#{w}'" }.join(', ')}, not one of #{AW::FAIL_CAUSES.join(', ')}.") unless bad.empty?
    end
    %w[frustrationAtLeast frustrationBelow].each do |k|
      next unless cond.key?(k)

      v = cond[k]
      err(issues, "#{tag}.when.#{k} must be a number from 1 to 100.") unless v.is_a?(Numeric) && v >= 1 && v <= 100
    end
    if cond.key?('needMet')
      v = cond['needMet']
      err(issues, "#{tag}.when.needMet must be 'work', 'social_media' or true.") unless AW::JUDGED_NEEDS.include?(v) || v == true
    end
    check_reactive_workaround(json_data, npc, tag, cond['workaround'], issues) if cond.key?('workaround')

    # The whole-`when` reachability (shared with the route's `done` branch b)
    if AW.when_reachable?(json_data, npc, cond)
      # An unscoped `cause` on an NPC that can fail two needs matches whichever need last failed
      if cond.key?('cause') && !cond.key?('need') && AW::JUDGED_NEEDS.count { |need| AW.can_fail?(json_data, npc, need) } > 1
        warn(issues, "#{tag}.when.cause has no `need` scope and #{nid} can fail both work and social_media: it matches " \
                     'whichever need last failed, which may not be the one meant. Add a `need`.')
      end
      # A frustrationBelow-only post never fires until the NPC first fails or eases
      if cond.keys == ['frustrationBelow'] && !AW::JUDGED_NEEDS.any? { |need| AW.can_fail?(json_data, npc, need) }
        warn(issues, "#{tag}.when is only frustrationBelow and #{nid} has no failable need: it never gets a frustration " \
                     'entry, so the post never fires. An always-calm post should key on a `global`.')
      end
    else
      warn(issues, "#{tag}.when can never hold for #{nid} (a cause it cannot meet, a workaround it lacks, an undeclared " \
                   'global, or a frustration predicate on an NPC with no failable need): the reactive post never fires.')
    end
  end

  def check_reactive_workaround(json_data, npc, tag, val, issues)
    was = AW.workarounds(json_data, npc)
    case val
    when Integer
      err(issues, "#{tag}.when.workaround index #{val} is outside #{nil_safe_label(was)}.") unless val >= 0 && val < was.size
    when String
      err(issues, "#{tag}.when.workaround '#{val}' names no workaround `do` of this NPC.") unless was.any? { |w| w['do'] == val }
    else
      err(issues, "#{tag}.when.workaround must be a `do` kind (string) or an index (integer).")
    end
  end

  def nil_safe_label(was)
    was.empty? ? 'the NPC has no workarounds' : "the NPC's workarounds (0 to #{was.size - 1})"
  end

  # Per NPC with reactive posts: the order mode, a count, and each reactive post's condition in
  # words with which player action arms it (plan 8 report lines)
  def reactive_report_lines(json_data, lines)
    room_npcs(json_data).each do |e|
      npc = e[:npc]
      feed = npc['feed']
      next unless feed.is_a?(Hash) && feed['posts'].is_a?(Array)

      reactive = feed['posts'].select { |p| p.is_a?(Hash) && AW.reactive_post?(p) }
      next if reactive.empty?

      lines << "ℹ️ Reactive feed #{npc['id']}: order #{AW.feed_order(npc)}, #{reactive.size} reactive post(s)."
      reactive.each do |post|
        lines << "ℹ️   #{post['id']}: #{reactive_condition_words(json_data, npc, post['when'])}"
      end
    end
  end

  def reactive_condition_words(json_data, npc, cond)
    return 'always (empty when)' unless cond.is_a?(Hash) && !cond.empty?

    need = cond['need'].is_a?(String) ? cond['need'] : nil
    parts = cond.filter_map do |key, val|
      case key
      when 'need' then nil
      when 'cause' then reactive_cause_words(json_data, npc, val, need)
      when 'workaround' then "after the #{val} workaround"
      when 'needMet' then 'on recovery (including a workaround recovery, not only the cause clearing)'
      when 'frustrationAtLeast' then "frustration at least #{val}"
      when 'frustrationBelow' then "frustration below #{val}"
      when 'global' then "the global #{val.is_a?(Hash) ? val.map { |k, v| "#{k}=#{v}" }.join(',') : val}"
      end
    end
    parts.join('; ')
  end

  def reactive_cause_words(json_data, npc, val, need)
    whys = Array(val)
    resources = whys.include?('down') || whys.include?('unreachable') ? AW.work_list(json_data, npc).select { |id| AW.resources(json_data).key?(id) } : []
    named = resources.empty? ? '' : " (candidate resource(s): #{resources.join(', ')})"
    scope = need ? " for #{need}" : ''
    "fires when a cause with why #{whys.join('/')}#{scope} is live#{named}"
  end

  # Per NPC with a feed: when each post is expected (plan 10), from the need's timing
  def feed_report_lines(json_data, lines)
    room_npcs(json_data).each do |e|
      npc = e[:npc]
      next unless AW.feeds?(npc)

      n = npc['needs']['social_media']
      decay = n['decayPerMin'].is_a?(Numeric) && n['decayPerMin'].positive? ? n['decayPerMin'].to_f : nil
      urgent = n['urgentAt'].is_a?(Numeric) ? n['urgentAt'].to_f : nil
      posts = AW.feed_posts(npc)
      unless decay && urgent
        lines << "ℹ️ Feed #{npc['id']}: #{posts.size} posts, but its social_media need has no valid decayPerMin and urgentAt: it never posts."
        next
      end
      initial = n['initial'].is_a?(Numeric) ? n['initial'].to_f.clamp(0, 100) : 100.0
      first = [initial - urgent, 0].max / decay * 60
      period = AW.post_period_seconds(json_data, npc)
      use = AW.shortest_use_seconds(json_data, npc, 'social_media')
      times = posts.each_index.map { |i| first + use + (i * (period + use)) }
      at = times.map { |t| secs = t.round; format('%d:%02d', secs / 60, secs % 60) }.join(', ')
      lines << "ℹ️ Feed #{npc['id']} (#{npc['feed']['site']}, #{npc['feed']['person']}): #{posts.size} posts; first urgent at " \
               "#{first.round} s, then about every #{(period + use).round} s; posts expected at about #{at} (needs clock, " \
               "after the room loads). Server floor #{AW.post_floor(json_data, npc).round} s between posts."
    end
  end
end
