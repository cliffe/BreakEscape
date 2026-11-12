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
    check_usb_stick_ids(json_data, issues)
    check_work(json_data, issues)
    check_workarounds(json_data, issues)
    check_social(json_data, issues)
    check_friendface_phones(json_data, issues)
    issues
  end

  # ── Friendface phone items (q35, docs/achitechture/FRIENDFACE_PHONE_ITEM_PLAN.md section 3) ──

  FRIENDFACE_PHONE = 'phone_friendface'

  # An NPC's Friendface phone (`phoneOf`) sits in that NPC's itemsHeld, the NPC has a phone, and it
  # holds at most one; an NPC with a social_media need, a feed and a phone holds its phone. A phone
  # with no phoneOf is the player's own and may be anywhere; its `site` must be a social site.
  def check_friendface_phones(json_data, issues)
    npcs = room_npcs(json_data).to_h { |e| [e[:npc]['id'], e[:npc]] }
    sites = osint_sites(json_data).to_h { |site| [site['id'], site] }
    held_by = Hash.new { |h, k| h[k] = [] }
    room_npcs(json_data).each do |e|
      Array(e[:npc]['itemsHeld']).each { |i| held_by[e[:npc]['id']] << i if i.is_a?(Hash) && i['type'] == FRIENDFACE_PHONE }
    end
    social_site = sites.values.any? { |site| site['type'] == 'social' }
    no_site_said = false
    all_objects(json_data).each do |o|
      item = o[:obj]
      if item['type'] != FRIENDFACE_PHONE
        if item.key?('phoneOf')
          warn(issues, "'#{item['name'] || item['id'] || item['type']}' (type '#{item['type']}') has phoneOf, which only a " \
                       "#{FRIENDFACE_PHONE} reads: it is ignored here.")
        end
        next
      end

      owner = item['phoneOf']
      name = item['name'] || item['id'] || FRIENDFACE_PHONE
      # Review R1 m4: the phone opens a social site (its owner's feed site, else the first one)
      if !social_site && !no_site_said
        err(issues, "Friendface phone '#{name}': the scenario has no social osint site, so the phone has nowhere to open.")
        no_site_said = true
      end
      err(issues, "Friendface phone '#{name}' needs an id: the server matches a held phone to the scenario's by id.") unless item['id'].is_a?(String) && !item['id'].empty?
      if owner.nil?
        if item.key?('site') && !(sites[item['site']] && sites[item['site']]['type'] == 'social')
          err(issues, "Friendface phone '#{name}' site '#{item['site']}' names no social osint site.")
        end
        next
      end
      if !owner.is_a?(String) || !npcs.key?(owner)
        err(issues, "Friendface phone '#{name}' phoneOf '#{owner}' names no room NPC.")
      elsif !held_by[owner].any? { |i| i.equal?(item) }
        err(issues, "Friendface phone '#{name}' is #{owner}'s (phoneOf) but is not in #{owner}'s itemsHeld: an NPC's phone starts with that NPC.")
      elsif !AW.phone?(npcs[owner])
        err(issues, "Friendface phone '#{name}' belongs to #{owner}, who is \"phone\": false: that NPC has no personal phone.")
      end
      err(issues, "Friendface phone '#{name}' has a site field; only the player's own phone (no phoneOf) takes one.") if item.key?('site')
      # Review R1 m3: an NPC phone that is not takeable can never be given or picked up
      err(issues, "Friendface phone '#{name}' (#{owner}'s) is not \"takeable\": true, so it can never be given or picked up.") unless item['takeable'] == true
      # Review R2 m2, R3 m1: the server hands an NPC's phone over only when its story or record
      # offers it (the same patterns, AccessWork.offers_item_text?); otherwise a KO drop does,
      # which is a valid route (q35), unless the NPC is koImmune and cannot be knocked out
      if npcs.key?(owner) && !npc_offers_phone?(npcs[owner])
        if npcs[owner]['koImmune'] == true
          err(issues, "Friendface phone '#{name}' (#{owner}'s): no give_item:#{FRIENDFACE_PHONE} and no give_npc_inventory_items that " \
                      "includes it in #{owner}'s story or record, and #{owner} is koImmune, so the player can never obtain it.")
        else
          issues << "ℹ️ work: Friendface phone '#{name}' (#{owner}'s): no give offers it, so a KO drop is the only way to obtain it."
        end
      end
    end
    # Review R3 n2: a JSON give_item action carries an inline item with no NPC source, which the
    # server never matches to a declared phone; phones are given by ink tags only
    json_actions(json_data).each do |a|
      next unless a['type'] == 'give_item' && a['item'].is_a?(Hash) && a['item']['type'] == FRIENDFACE_PHONE

      err(issues, "A JSON give_item action gives a #{FRIENDFACE_PHONE} ('#{a['item']['name'] || a['item']['id'] || FRIENDFACE_PHONE}'): " \
                  "the server refuses it. Give a phone with an ink tag (#give_item:#{FRIENDFACE_PHONE}) from its owner's story.")
    end
    # Review R2 n4: the server resolves an add to the first item with a matching id, so two phones
    # sharing an id would hand over the wrong one
    all_objects(json_data).map { |o| o[:obj] }.select { |i| i['type'] == FRIENDFACE_PHONE && i['id'].is_a?(String) }
                          .group_by { |i| i['id'] }.each do |id, list|
      err(issues, "Friendface phone id '#{id}' is used by #{list.size} phones: each phone needs its own id.") if list.size > 1
    end
    npcs.each do |nid, npc|
      own = held_by[nid].select { |i| i['phoneOf'] == nid }
      err(issues, "#{nid} holds #{own.size} Friendface phones of its own; an NPC carries one.") if own.size > 1
      next unless AW.need?(npc, 'social_media') && npc['feed'].is_a?(Hash) && AW.phone?(npc) && own.empty?

      err(issues, "#{nid} posts from a phone (social_media need, a feed, no \"phone\": false) but holds no Friendface phone: " \
                  "add { \"type\": \"#{FRIENDFACE_PHONE}\", \"phoneOf\": \"#{nid}\", \"takeable\": true } to its itemsHeld (q35).")
    end
  end

  REPO_ROOT = File.expand_path('..', __dir__)

  # An NPC's offers, read as the server reads them (SocialFeed#npc_offers_item?): its record, then
  # its compiled story, or the .ink source when there is no compiled file
  # Review R3 n4: an .ink source (a story never compiled) brings in its INCLUDEd files too.
  def npc_offers_phone?(npc)
    texts = AW.offer_texts(npc) { |story_path| story_file(story_path) }
    sp = npc['storyPath']
    path = sp.is_a?(String) && !sp.empty? ? story_file(sp) : nil
    texts += ink_included_texts(path) if path&.end_with?('.ink')
    texts.any? { |t| AW.offers_item_text?(t, FRIENDFACE_PHONE) }
  end

  # The text of every file an .ink file INCLUDEs, followed recursively, each read once
  def ink_included_texts(path)
    seen = Set[path]
    queue = [path]
    out = []
    until queue.empty?
      f = queue.shift
      File.readlines(f, encoding: 'UTF-8').each do |l|
        next unless l =~ /^\s*INCLUDE\s+(\S+)/

        inc = File.expand_path(Regexp.last_match(1), File.dirname(f))
        next if seen.include?(inc) || !File.file?(inc)

        seen << inc
        queue << inc
        out << File.read(inc, encoding: 'UTF-8')
      end
    end
    out
  end

  # Every hash in the scenario with a String `type` and an `item` (the shape of a JSON give_item
  # action, wherever it sits: eventMappings, timers, flag stations), found by walking the document
  def json_actions(json_data)
    out = []
    walk = lambda do |v|
      case v
      when Hash
        out << v if v['type'].is_a?(String) && v.key?('item')
        v.each_value { |x| walk.call(x) }
      when Array then v.each { |x| walk.call(x) }
      end
    end
    walk.call(json_data)
    out
  end

  def story_file(story_path)
    base = File.expand_path(story_path, REPO_ROOT)
    [base, base.sub(/\.json\z/, '.ink.json'), base.sub(/\.ink\.json\z/, '.json'), base.sub(/\.(ink\.)?json\z/, '.ink')]
      .find { |f| File.file?(f) }
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
    check_usb_stick(json_data, npc, issues)
    unless plan
      warn(issues, "#{nid} has a usbHabit but no work plan (a work need and a non-empty workNeeds list): only judged work " \
                   'uses are checked, so the habit never acts. Give it a work plan, or remove the habit.')
      return
    end
    # Review R1 m5: the copy is made at the NPC's own PC only
    st = AW.station(json_data, npc)
    unless st
      warn(issues, "#{nid} has a usbHabit but no station (needsHome naming an object in a room): the copy is made only " \
                   "at the NPC's own PC, so the habit never acts. Set needsHome, or remove the habit.")
      return
    end
    return unless h['setGlobal'].is_a?(String) && !AW.usb_habit_refused?(json_data, npc)

    warn(issues, "#{nid}.usbHabit.setGlobal '#{h['setGlobal']}' can never be set: the policy at '#{st['id']}' allows a USB " \
                 'stick, so the copy is never refused. Check the policy name (an unknown one falls back to the default) ' \
                 'or its usb field.')
  end

  # The habit's stick (2026-11-12): a storage `usb` item with an id in itemsHeld, its files well formed
  def check_usb_stick(json_data, npc, issues)
    nid = npc['id']
    stick = AW.usb_stick(npc)
    unless stick
      other = Array(npc['itemsHeld']).find { |i| i.is_a?(Hash) && i['type'] == 'usb' && AW.present_string?(i['id']) }
      extra = other ? " ('#{other['id']}' has usbClass '#{other['usbClass']}'; a habit stick is a storage stick)" : ''
      err(issues, "#{nid} has a usbHabit but holds no USB stick#{extra}: add a { \"type\": \"usb\", \"id\": ..., \"sprite\": " \
                  "\"usb_bowl1\", \"usbClass\": \"storage\", \"takeable\": true } item to its itemsHeld. Its files default to " \
                  "#{AW::USB_STICK_DEFAULT_FILE}; list others in its contents.")
      return
    end
    sid = stick['id']
    err(issues, "#{nid}'s USB stick '#{sid}' is locked: a habit stick opens for whoever holds it, so drop the lock.") if stick['locked']
    unless stick['takeable']
      warn(issues, "#{nid}'s USB stick '#{sid}' is not takeable, so it cannot be handed over or picked up unless " \
                   "#{nid} is knocked out. Set takeable: true for a give.")
    end
    check_usb_give_order(json_data, npc, stick, issues)
    check_usb_ko_route(json_data, npc, issues)
    return unless stick.key?('contents')

    files = stick['contents']
    unless files.is_a?(Array) && !files.empty?
      err(issues, "#{nid}'s USB stick '#{sid}'.contents must be a non-empty list of files (leave it out for the default " \
                  "#{AW::USB_STICK_DEFAULT_FILE}).")
      return
    end
    ids = []
    check_usb_stick_entries(files, "#{nid}'s USB stick '#{sid}'.contents", ids, issues)
    dup = ids.group_by(&:itself).select { |_id, v| v.size > 1 }.keys
    err(issues, "#{nid}'s USB stick '#{sid}' lists the id(s) #{dup.join(', ')} more than once.") unless dup.empty?
  end

  # Review R2 m1: a stick holds text files and unlocked folders or archives (any item with its own
  # contents), nested to any depth; the server serves each nested one to the holder by its id.
  def check_usb_stick_entries(entries, path, ids, issues, depth = 0)
    entries.each_with_index do |f, i|
      where = "#{path}[#{i}]"
      unless f.is_a?(Hash)
        err(issues, "#{where} must be a file or a folder.")
        next
      end
      ids << f['id'] if AW.present_string?(f['id'])
      err(issues, "#{where} needs an id (a string), so it can be told apart.") unless AW.present_string?(f['id'])
      err(issues, "#{where} needs a name (the name the player sees).") unless AW.present_string?(f['name'])
      err(issues, "#{where} is locked: everything on a stick opens for whoever holds it.") if f['locked']
      # Review R2 n2: the take control would be refused, since a held stick is not searched for items
      warn(issues, "#{where} is takeable, but nothing can be taken off a stick: set takeable: false.") if f['takeable'] == true
      if f['type'] == 'text_file'
        err(issues, "#{where} needs a text (what the file says).") unless AW.present_string?(f['text'])
        err(issues, "#{where} is a text file with contents: a file holds no other files.") if f.key?('contents')
      elsif f['contents'].is_a?(Array) && !f['contents'].empty?
        if depth >= 4
          err(issues, "#{where} is nested more than five levels deep on the stick.")
        else
          check_usb_stick_entries(f['contents'], "#{where}.contents", ids, issues, depth + 1)
        end
      else
        err(issues, "#{where} must be a file { \"type\": \"text_file\", \"id\", \"name\", \"text\" } or a folder or " \
                    'archive with a non-empty contents list.')
      end
    end
  end

  # Review R2 M1: a give of the stick before the habit's first refusal stops the habit for good,
  # so a task, mapping, condition or post keyed on the refusal can then never happen. Warn unless
  # every ink give of the stick (#give_item, or #give_npc_inventory_items that offers it, in the
  # NPC's own ink or a mail reply's, review R3 n1) sits under a choice or inside a conditional
  # block gated on the habit's setGlobal.
  def check_usb_give_order(json_data, npc, stick, issues)
    nid = npc['id']
    glob = npc.dig('usbHabit', 'setGlobal')
    return unless usb_refusal_beats?(json_data, nid, glob)

    ungated = usb_stick_gives(json_data, npc, stick).reject { |_where, conds| conds.any? { |c| names_global?(c, glob) } }
    return if ungated.empty?

    want = glob.is_a?(String) ? "a choice gated on {#{glob}}" : 'a choice offered only after the refusal (set usbHabit.setGlobal and gate on it)'
    warn(issues, "#{nid}'s ink gives the USB stick '#{stick['id']}' (#{ungated.map(&:first).join(', ')}) where the player " \
                 "can take it before #{nid}'s first refusal; the habit then stops and anything keyed on the refusal " \
                 "(npc_usb_refused:#{nid}#{glob ? ", #{glob}" : ''}, a usb_refused post) never happens. Offer the give from #{want}.")
  end

  # Review R3 m3: a knock-out before the first refusal stops the habit as well (the NPC's work
  # stops with it), and the player chooses when it happens. Warn when a required task waits only
  # on the refusal and the NPC can be knocked out with no fallback for that task.
  def check_usb_ko_route(json_data, npc, issues)
    nid = npc['id']
    return if npc['koImmune'] == true || json_data['disableAttacks'] == true

    glob = npc.dig('usbHabit', 'setGlobal')
    vents = Array(npc.dig('feed', 'posts')).select { |p| p.is_a?(Hash) && p.dig('when', 'cause') == 'usb_refused' }.map { |p| p['id'] }.compact
    refusal = lambda do |m|
      pat = m['eventPattern'].to_s
      next true if pat == "npc_usb_refused:#{nid}"
      next true if glob.is_a?(String) && pat == "global_variable_changed:#{glob}"
      pat == "npc_posted:#{nid}" && vents.any? { |v| m['condition'].to_s.include?(v) }
    end
    by_task = Hash.new { |h, k| h[k] = [] }
    ko_tasks = Set.new
    inks = []
    walk = lambda do |v|
      case v
      when Hash
        Array(v['eventMappings']).each { |m| by_task[m['completeTask']] << m if m.is_a?(Hash) && AW.present_string?(m['completeTask']) }
        ko_tasks << v['taskOnKO'] if AW.present_string?(v['taskOnKO'])
        inks << v['storyPath'] if AW.present_string?(v['storyPath'])
        v.each_value { |x| walk.call(x) }
      when Array then v.each { |x| walk.call(x) }
      end
    end
    walk.call(json_data)
    ink_text = inks.uniq.map { |sp| ink_file(sp) }.compact.map { |f| File.read(f, encoding: 'UTF-8') }.join("\n")
    stranded = required_task_ids(json_data).select do |tid|
      maps = by_task[tid]
      !maps.empty? && maps.all?(&refusal) && !ko_tasks.include?(tid) && !ink_text.include?("complete_task:#{tid}")
    end
    return if stranded.empty?

    ko_glob = AW.present_string?(npc['globalVarOnKO']) ? " or global_variable_changed:#{npc['globalVarOnKO']}" : ''
    warn(issues, "#{nid} can be knocked out before its first USB refusal, which stops the habit, and the required task(s) " \
                 "#{stranded.join(', ')} complete only on that refusal, so a knock-out strands them. Set koImmune: true on " \
                 "#{nid}, give it a taskOnKO, or add an eventMapping completing the task on #{nid}'s knock-out " \
                 "(npc_ko:#{nid}#{ko_glob}).")
  end

  def required_task_ids(json_data)
    Array(json_data['objectives']).flat_map { |a| a.is_a?(Hash) ? Array(a['tasks']) : [] }
                                  .select { |t| t.is_a?(Hash) && !t['optional'] && AW.present_string?(t['taskId']) }
                                  .map { |t| t['taskId'] }
  end

  # Whether anything in the scenario waits on the habit's first refusal
  def usb_refusal_beats?(json_data, nid, glob)
    pattern = glob.is_a?(String) && !glob.empty? ? /npc_usb_refused:#{Regexp.escape(nid)}\b|\b#{Regexp.escape(glob)}\b/ : /npc_usb_refused:#{Regexp.escape(nid)}\b/
    found = false
    walk = lambda do |v, key|
      return if found
      case v
      when Hash
        v.each do |k, x|
          next if %w[globalVariables usbHabit].include?(k)
          found = true if k == 'cause' && x == 'usb_refused'
          walk.call(x, k)
        end
      when Array then v.each { |x| walk.call(x, key) }
      when String then found = true if key != 'setGlobal' && v =~ pattern
      end
    end
    walk.call(json_data, nil)
    found
  end

  REPO_ROOT = File.expand_path('..', __dir__)

  def ink_file(story_path)
    return nil unless story_path.is_a?(String) && !story_path.empty?

    ink = story_path.sub(/\.json\z/, '.ink')
    ink = File.join(REPO_ROOT, ink) unless ink.start_with?('/')
    File.exist?(ink) ? ink : nil
  end

  # The ink files that can hand over the habit's stick: the NPC's own storyPath, and a mail
  # reply's (review R3 n1). A reply runs its gives as the headless record it speaks for
  # (mail-runner.js, scenario-npc-records.js: social.characters.*.emailRecord under its
  # channels.email id, or social.mailClient.contacts[].emailRecord under its npc id), taking
  # from that record's own itemsHeld, so a record's ink counts only when it holds the stick's
  # id. A record that reuses the NPC's id is the NPC, whose storyPath is read already.
  def usb_give_inks(json_data, npc, stick)
    paths = [npc['storyPath']]
    social = json_data['social'].is_a?(Hash) ? json_data['social'] : {}
    chars = social['characters'].is_a?(Hash) ? social['characters'].values : []
    contacts = social.dig('mailClient', 'contacts')
    headless = chars.map { |c| c.is_a?(Hash) ? [c.dig('channels', 'email'), c['emailRecord']] : nil } +
               (contacts.is_a?(Array) ? contacts : []).map { |c| c.is_a?(Hash) ? [c['npc'], c['emailRecord']] : nil }
    headless.compact.each do |rid, rec|
      next unless rec.is_a?(Hash) && AW.present_string?(rid) && rid != npc['id']
      next unless Array(rec['itemsHeld']).any? { |i| i.is_a?(Hash) && i['id'] == stick['id'] }

      paths << rec['storyPath']
    end
    paths.map { |sp| ink_file(sp) }.compact.uniq
  end

  # [["file:line", [conditions]]] for each give of the stick: the governing choice line's {..}
  # conditions and the conditions of every conditional block enclosing the give (review R3 n1)
  def usb_stick_gives(json_data, npc, stick)
    sid = Regexp.escape(stick['id'].to_s)
    give = /#\s*give_item:\s*(?:usb|#{sid})\b/
    offer = /#\s*give_npc_inventory_items\b(?::\s*([^#\n]*))?/
    out = []
    usb_give_inks(json_data, npc, stick).each do |ink|
      lines = File.readlines(ink, encoding: 'UTF-8')
      lines.each_with_index do |l, i|
        next if l.strip.start_with?('//')

        hit = l =~ give
        if !hit && (m = l.match(offer))
          types = m[1].to_s.split(',').map(&:strip).reject(&:empty?)
          hit = types.empty? || types.include?('usb') || types.include?(stick['id'].to_s)
        end
        next unless hit

        out << ["#{File.basename(ink)} line #{i + 1}", give_conditions(lines, i)]
      end
    end
    out
  end

  # The conditions gating line i: its choice's {..} parts, and the open conditional blocks
  # ({cond: ... } across lines, or a { - cond: ... } branch) from the knot's start down to it
  def give_conditions(lines, i)
    top = i
    top -= 1 while top.positive? && !lines[top].strip.start_with?('===')
    conds = []
    i.downto(top) do |j|
      t = lines[j].strip
      break if t.start_with?('===') || (t.start_with?('=') && j < i)
      if t =~ /\A[*+]/
        conds.concat(t.scan(/\{([^{}]*)\}/).flatten)
        break
      end
    end
    stack = []
    (top..i).each do |j|
      t = lines[j].strip
      next if t.start_with?('//')

      if t =~ /\A-\s*(.+?):\s*\z/ && !stack.empty?
        stack[-1] = Regexp.last_match(1) == 'else' ? '' : Regexp.last_match(1)
        next
      end
      k = 0
      while k < t.length
        c = t[k]
        if c == '{'
          close = t.index('}', k)
          colon = t.index(':', k)
          text = colon && (close.nil? || colon < close) ? t[(k + 1)...colon] : ''
          stack << text
        elsif c == '}'
          stack.pop
        end
        k += 1
      end
    end
    conds + stack.reject(&:empty?)
  end

  # The condition names the global, not negated
  def names_global?(cond, glob)
    return false unless glob.is_a?(String) && !glob.empty?

    g = Regexp.escape(glob)
    cond.to_s.scan(/(\bnot\s+|!\s*)?\b#{g}\b/).any? { |m| m.first.nil? }
  end

  # Review R2 n2: the filter, held_usb_sticks and the browser's habit all key on the stick's id
  def check_usb_stick_ids(json_data, issues)
    seen = Hash.new { |h, k| h[k] = [] }
    AW.usb_habit_sticks(json_data).each { |npc, stick| seen[stick['id']] << npc['id'] }
    seen.each do |sid, nids|
      next if nids.size < 2

      err(issues, "the USB stick id '#{sid}' is held by #{nids.join(' and ')}: each habit NPC needs its own stick id.")
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
    check_hot_desk_reach(json_data, issues, expanded)
    check_workaround_globals_read_by_server(json_data, issues)
  end

  # Review 9.2 H R1 m5 (user decision q44): only a borrower's sitting down at a hot desk signs in
  # there (npc_sat_at), which ends the player's session and a guest left there. Any other use of
  # it, for a need that is not judged (so the desk is not filtered out), sits down with neither:
  # the player's desktop stays open under the NPC and a guest session survives it. Warned per
  # NPC and need; a leash that keeps the NPC out of the desk's room means it never gets there.
  def check_hot_desk_reach(json_data, issues, expanded = {})
    index = AW.object_index(json_data)
    entries = room_npcs(json_data)
    hot = entries.flat_map { |e| AW.borrow_pcs(json_data, e[:npc]) }.uniq.select { |id| index.key?(id) }
    hot.each do |pid|
      pc = index[pid][:obj]
      next if private_pc?(json_data, pc)

      room = index[pid][:room_id]
      entries.each do |e|
        npc = expanded[e[:npc]['id']] || e[:npc]
        next unless npc['needs'].is_a?(Hash)
        next if leash_forbids?(npc, room, e[:room])

        npc['needs'].each_key do |need|
          next unless AW.need?(npc, need) && AW.satisfies?(json_data, pc, need)
          next if AW.judged?(json_data, npc, need)

          warn(issues, "hot desk '#{pid}' (a borrow_session names it) satisfies #{need}, which #{npc['id']} can use it for " \
                       'without borrowing it: only a borrower sitting down signs in there, so that use leaves the ' \
                       "player's session and any guest session open under #{npc['id']}. Give the desk only the borrowed " \
                       'need, or keep the NPC out of its room (needsRooms or needsAvoidRooms).')
        end
      end
    end
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
    reply_report_lines(json_data, lines)
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

    ['Work report (access slice 9.2):'] + lines.sort_by.with_index { |l, i| [l.start_with?('ℹ️ Feed', 'ℹ️ Reactive feed', 'ℹ️   ', 'ℹ️ Reply', 'ℹ️ Complaint') ? 1 : 0, i] }
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

  # C3 (plan 7): the text of every story the scenario ships (any `storyPath` anywhere: room NPCs,
  # phone contacts, timed conversations, mail-reply records, objects), compiled or .ink source with
  # its INCLUDEs, read as plain text. A reply piece inside an ink line ships from the start.
  # Bounded: each file is read once, however many records name it (review C3 R1 m3).
  def story_texts(json_data)
    paths = []
    walk = lambda do |v|
      case v
      when Hash
        paths << v['storyPath'] if AW.present_string?(v['storyPath'])
        v.each_value { |x| walk.call(x) }
      when Array then v.each { |x| walk.call(x) }
      end
    end
    walk.call(json_data)
    files = paths.uniq.flat_map { |sp| [story_file(sp), ink_file(sp)] }.compact.uniq
    files.flat_map do |f|
      [File.read(f, encoding: 'UTF-8')] + (f.end_with?('.ink') ? ink_included_texts(f) : [])
    rescue SystemCallError
      []
    end
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
    netstrs = network_leak_strings(json_data)
    shipped = nil
    reply_shipped = nil
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
        reply = AW.reply_post?(post)
        texts = reply ? [] : [[post['text'], "#{tag}.text"]]
        check_reply_text(json_data, npc, tag, post, pws, issues, netstrs) { reply_shipped ||= shipped_strings(json_data, feed_facts) + story_texts(json_data) } if reply
        if !reply && post['text'].is_a?(String) && post['text'].include?('{name}')
          warn(issues, "#{tag}.text holds {name} but is not a reply: it would ship as written.")
        end
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
          warn_network_text(text, where, netstrs, issues)
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

    check_replies(json_data, issues)

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

      # Replies stand in for an own post's slot and never fire at their own position, so they
      # are counted apart and their detail left to the Reply lines (review C3 R1 m4)
      reactive = AW.own_feed_posts(npc).select { |p| AW.reactive_post?(p) }
      replies = AW.feed_replies(npc)
      next if reactive.empty? && replies.empty?

      extra = replies.empty? ? '' : ", #{replies.size} repl#{replies.size == 1 ? 'y' : 'ies'}"
      lines << "ℹ️ Reactive feed #{npc['id']}: order #{AW.feed_order(npc)}, #{reactive.size} reactive post(s)#{extra}."
      reactive.each do |post|
        lines << "ℹ️   #{post['id']}: #{reactive_condition_words(json_data, npc, post['when'])}"
      end
      replies.each do |r|
        lines << "ℹ️   #{r['id']}: a reply, stands in for '#{r['insteadOf']}' (see the Reply lines)"
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
      # One post per alternative set: a reply only takes its own post's slot (review C3 R1 m4)
      posts = AW.own_feed_posts(npc)
      nrep = AW.feed_replies(npc).size
      counted = "#{posts.size} post#{posts.size == 1 ? '' : 's'}"
      counted += " (plus #{nrep} repl#{nrep == 1 ? 'y' : 'ies'}, each in place of an own post)" if nrep.positive?
      unless decay && urgent
        lines << "ℹ️ Feed #{npc['id']}: #{counted}, but its social_media need has no valid decayPerMin and urgentAt: it never posts."
        next
      end
      initial = n['initial'].is_a?(Numeric) ? n['initial'].to_f.clamp(0, 100) : 100.0
      first = [initial - urgent, 0].max / decay * 60
      # Review C3 R2 m1: a counted work failure drains every other need by breakDrain
      # (npc-needs.js _countFailure), so an NPC whose work resource starts down posts sooner
      drain_note = ''
      fail_at = work_failure_seconds(json_data, npc)
      if fail_at && fail_at < first
        drain = AW.frustration(json_data, npc)['breakDrain'].to_f
        if drain.positive?
          first = [[initial - drain - urgent, 0].max / decay * 60, fail_at].max
          drain_note = " (after one work failure's breakDrain of #{drain.round}: its work resource starts down)"
        end
      end
      period = AW.post_period_seconds(json_data, npc)
      use = AW.shortest_use_seconds(json_data, npc, 'social_media')
      times = posts.each_index.map { |i| first + use + (i * (period + use)) }
      at = times.map { |t| secs = t.round; format('%d:%02d', secs / 60, secs % 60) }.join(', ')
      lines << "ℹ️ Feed #{npc['id']} (#{npc['feed']['site']}, #{npc['feed']['person']}): #{counted}; first urgent at " \
               "#{first.round} s#{drain_note}, then about every #{(period + use).round} s; posts expected at about #{at} (needs clock, " \
               "after the room loads). Server floor #{AW.post_floor(json_data, npc).round} s between posts."
    end
  end

  # When the NPC's work need first turns urgent (seconds, needs clock), if its work plan reaches
  # a resource that starts down (its downIf, or its network's, is truthy at load); else nil.
  # That is the earliest its first counted work failure can come.
  def work_failure_seconds(json_data, npc)
    return nil unless AW.work_plan?(json_data, npc)

    globals = json_data['globalVariables'].is_a?(Hash) ? json_data['globalVariables'] : {}
    nets = json_data['networks'].is_a?(Hash) ? json_data['networks'] : {}
    res = AW.resources(json_data)
    down = ->(item) { item.is_a?(Hash) && AW.present_string?(item['downIf']) && ![nil, false, 0, ''].include?(globals[item['downIf']]) }
    starts_down = AW.work_list(json_data, npc).any? do |id|
      r = res[id]
      r && (down.call(r) || down.call(nets[r['network']]))
    end
    return nil unless starts_down

    w = npc['needs']['work']
    decay = w['decayPerMin'].is_a?(Numeric) && w['decayPerMin'].positive? ? w['decayPerMin'].to_f : nil
    urgent = w['urgentAt'].is_a?(Numeric) ? w['urgentAt'].to_f : nil
    return nil unless decay && urgent

    initial = w['initial'].is_a?(Numeric) ? w['initial'].to_f.clamp(0, 100) : 100.0
    [initial - urgent, 0].max / decay * 60
  end

  # ── Replies between NPCs (sub-slice C3, ACCESS_MODEL_SLICE_9_2_C3_PLAN.md section 7) ──────

  # { postId => [npc, post] } over every room NPC's feed
  def feed_post_index(json_data)
    out = {}
    room_npcs(json_data).each do |e|
      AW.feed_posts(e[:npc]).each { |p| out[p['id']] ||= [e[:npc], p] }
    end
    out
  end

  def same_site?(a, b)
    a.dig('feed', 'site') == b.dig('feed', 'site')
  end

  # [[poster, thread post], ...] a reply can ever join, read statically
  def reply_threads(json_data, npc, reply, index = feed_post_index(json_data))
    if AW.present_string?(reply['replyTo'])
      owner, post = index[reply['replyTo']]
      return [] unless owner && !AW.reply_post?(post) && same_site?(owner, npc)

      [[owner, post]]
    elsif AW.present_string?(reply['replyToComplaint'])
      room_npcs(json_data).flat_map do |e|
        other = e[:npc]
        next [] if other['id'] == npc['id'] || !same_site?(other, npc)

        AW.own_feed_posts(other).select { |p| p['complaint'] == reply['replyToComplaint'] }.map { |p| [other, p] }
      end
    else
      []
    end
  end

  def answer?(npc, reply)
    AW.present_string?(reply['replyTo']) && AW.own_feed_posts(npc).any? { |p| p['id'] == reply['replyTo'] }
  end

  # The NPCs whose replies can open an answer's thread
  def answer_repliers(json_data, npc, reply)
    tpost = AW.own_feed_posts(npc).find { |p| p['id'] == reply['replyTo'] }
    room_npcs(json_data).map { |e| e[:npc] }.select do |other|
      next false if other['id'] == npc['id'] || !same_site?(other, npc)

      AW.feed_replies(other).any? do |r|
        r['replyTo'] == reply['replyTo'] ||
          (tpost && AW.present_string?(tpost['complaint']) && r['replyToComplaint'] == tpost['complaint'])
      end
    end
  end

  # Every Friendface name a reply's {name} can take (section 7), through the route's helper
  def reply_names(json_data, npc, reply)
    who = answer?(npc, reply) ? answer_repliers(json_data, npc, reply) : reply_threads(json_data, npc, reply).map(&:first)
    who.map { |n| AW.friendface_name(json_data, n) }.uniq
  end

  # Review C3 R2 m2: the strings the live leak check registers as network strings
  # (tools/playtest/lib/access_leak_scanner.rb collect_network_secrets): each network name and each
  # resource name, host and observations of MIN_NETWORK_STRING characters or more.
  # { string => [owner, ...] }
  NETWORK_STRING_MIN = 3        # AccessLeakScanner::MIN_NETWORK_STRING
  NETWORK_SUBSTRING_MIN = 6     # AccessLeakScanner::MIN_SUBSTRING_NETWORK
  def network_leak_strings(json_data)
    out = {}
    add = lambda do |val, owner|
      next unless val.is_a?(String) && val.strip.length >= NETWORK_STRING_MIN

      (out[val.strip] ||= []) << owner
    end
    nets = json_data['networks'].is_a?(Hash) ? json_data['networks'] : {}
    nets.each { |id, net| add.call(net['name'], "network '#{id}' name") if net.is_a?(Hash) }
    AW.resources(json_data).each do |id, res|
      %w[name host observations].each { |f| add.call(res[f], "resource '#{id}' #{f}") }
    end
    out
  end

  # The scanner's network_match?: the whole text, or a substring from NETWORK_SUBSTRING_MIN
  def warn_network_text(text, where, netstrs, issues)
    s = text.strip
    netstrs.each do |str, owners|
      next unless s == str || (str.length >= NETWORK_SUBSTRING_MIN && s.include?(str))

      warn(issues, "#{where} contains \"#{str}\" (#{owners.join(', ')}): it ships once the post is out, and the live leak " \
                   'check reports it as network_string. Rename the resource or reword the post.')
    end
  end

  # The password scan, the 12-character warning and the unique-text warning for a reply, read
  # through each name {name} can take and piece by piece around it. `shipped` is a block.
  def check_reply_text(json_data, npc, tag, post, pws, issues, netstrs = {})
    text = post['text']
    return unless text.is_a?(String)

    pieces = AW.reply_text_pieces(text)
    names = reply_names(json_data, npc, post)
    filled = names.empty? ? [text.gsub('{name}', '')] : names.map { |n| text.gsub('{name}') { n } }
    filled.each do |f|
      pws.each do |owner, pw|
        err(issues, "#{tag}.text contains #{owner}'s password: feed text ships once its post is out.") if f.include?(pw)
      end
    end
    filled.each { |f| warn_network_text(f, "#{tag}.text", netstrs, issues) }
    longest = pieces.max_by(&:length).to_s
    if longest.length < SHORT_TEXT
      warn(issues, "#{tag}.text has no piece of #{SHORT_TEXT} characters or more around {name}: the leak checks " \
                   'match a reply by those pieces and cannot protect it.')
      return
    end
    shipped = yield
    (pieces.select { |pc| pc.length >= SHORT_TEXT } + filled).uniq.each do |piece|
      next unless shipped.any? { |str| str.include?(piece) }

      warn(issues, "#{tag}.text piece \"#{piece.strip}\" occurs inside another string that ships from the start: the leak checks cannot protect it.")
    end
  end

  def walk_pos(npc, id)
    AW.walk_order(npc).index { |p| p['id'] == id }
  end

  def check_replies(json_data, issues)
    index = feed_post_index(json_data)
    room_npcs(json_data).each do |e|
      npc = e[:npc]
      nid = npc['id']
      own = AW.own_feed_posts(npc)
      replies = AW.feed_replies(npc)
      AW.feed_posts(npc).each_with_index do |post, i|
        next unless AW.reply_post?(post)

        check_reply(json_data, npc, "#{nid}.feed.posts[#{i}]", post, index, issues)
      end

      # A complaint member with no complaint reply
      own.map { |p| p['complaint'] }.select { |c| AW.present_string?(c) }.uniq.each do |c|
        next if replies.any? { |r| r['replyToComplaint'] == c }

        warn(issues, "#{nid} vents in complaint '#{c}' but has no replyToComplaint reply to it: if #{nid} posts after another member, it vents too.")
      end

      # Order: two replies by one NPC into one thread, or two answers in one thread
      replies.group_by { |r| r['replyTo'] || "c:#{r['replyToComplaint']}" }.each_value do |group|
        group.each_cons(2) do |a, b|
          pa = walk_pos(npc, a['insteadOf'])
          pb = walk_pos(npc, b['insteadOf'])
          next unless pa && pb && pb < pa

          warn(issues, "#{nid}'s replies '#{a['id']}' and '#{b['id']}' join the same thread but '#{b['id']}' stands in for a post " \
                       'earlier in walk order: these come out the other way round.')
        end
      end
    end
  end

  def check_reply(json_data, npc, tag, post, index, issues)
    nid = npc['id']
    err(issues, "#{tag} is a reply with no `when`: a reply carries a when, an insteadOf and one thread field.") unless AW.reactive_post?(post)
    err(issues, "#{tag} is a reply with no insteadOf: every reply stands in for one of its NPC's own reactive posts.") unless AW.present_string?(post['insteadOf'])
    named = [AW.present_string?(post['replyTo']), AW.present_string?(post['replyToComplaint'])].count(true)
    err(issues, "#{tag} needs exactly one of replyTo and replyToComplaint (it has #{named}).") unless named == 1
    # The server counts any non-null thread field (AccessWork.well_formed_reply?), so an empty or
    # non-string one beside a valid one stops the reply ever serving (review C3 R1 m2)
    %w[replyTo replyToComplaint].each do |k|
      next if post[k].nil? || AW.present_string?(post[k])

      err(issues, "#{tag}.#{k} is present but not a non-empty string: the server then counts two thread fields " \
                  'and never serves the reply. Remove the field or give it a post id or complaint tag.')
    end
    err(issues, "#{tag} is a reply and carries `complaint`: only an own post (a vent) can be tagged.") unless post['complaint'].nil?
    err(issues, "#{tag} is a reply and carries a fact: replies are about the needs only (q60).") unless post['fact'].nil?

    if AW.present_string?(post['replyTo'])
      owner, target = index[post['replyTo']]
      if !owner
        err(issues, "#{tag}.replyTo '#{post['replyTo']}' names no post on any room NPC's feed.")
      elsif AW.reply_post?(target)
        err(issues, "#{tag}.replyTo '#{post['replyTo']}' names a reply: nothing replies to a reply.")
      elsif !same_site?(owner, npc)
        err(issues, "#{tag}.replyTo '#{post['replyTo']}' is on '#{owner.dig('feed', 'site')}', not #{nid}'s site.")
      end
    end
    if AW.present_string?(post['replyToComplaint']) && reply_threads(json_data, npc, post, index).empty?
      err(issues, "#{tag}.replyToComplaint '#{post['replyToComplaint']}' is carried by no own post on another NPC's feed on the same site.")
    end

    instead = AW.feed_posts(npc).find { |p| p['id'] == post['insteadOf'] }
    if AW.present_string?(post['insteadOf'])
      if !instead
        err(issues, "#{tag}.insteadOf '#{post['insteadOf']}' names no post of #{nid}.")
      elsif AW.reply_post?(instead)
        err(issues, "#{tag}.insteadOf '#{post['insteadOf']}' names a reply.")
      elsif !AW.reactive_post?(instead)
        err(issues, "#{tag}.insteadOf '#{post['insteadOf']}' names an ordered post: a reply stands in for a reactive post.")
      elsif post['insteadOf'] == post['replyTo']
        err(issues, "#{tag}.insteadOf names the post its own replyTo names.")
      elsif !instead['fact'].nil?
        err(issues, "#{tag}.insteadOf '#{post['insteadOf']}' carries a fact: a post a reply stands in for carries none (q60).")
      end
    end

    if AW.reactive_post?(post) && !AW.when_reachable?(json_data, npc, post['when'])
      warn(issues, "#{tag}.when can never hold for #{nid}: the reply never fires, and its insteadOf post always comes out instead.")
    end
    if instead && AW.reactive_post?(instead) && !AW.when_reachable?(json_data, npc, instead['when'])
      warn(issues, "#{tag}.insteadOf '#{instead['id']}' can never fire: the reply cannot fire either.")
    end

    if answer?(npc, post)
      if answer_repliers(json_data, npc, post).empty?
        warn(issues, "#{tag} is an answer in '#{post['replyTo']}' that no reply can open: no other NPC replies to it. The answer never fires.")
      end
      tp = walk_pos(npc, post['replyTo'])
      ip = walk_pos(npc, post['insteadOf'])
      if tp && ip && ip < tp
        warn(issues, "#{tag} is an answer whose insteadOf comes before its thread post in walk order: if both are due at one use, " \
                     "'#{post['insteadOf']}' comes out first and the answer is spent.")
      end
      return
    end

    threads = reply_threads(json_data, npc, post, index)
    if !threads.empty? && threads.none? { |poster, t| AW.feeds?(poster) && (!AW.reactive_post?(t) || AW.when_reachable?(json_data, poster, t['when'])) }
      warn(issues, "#{tag}'s thread can never open: every post it can join belongs to an NPC that never posts or has an unreachable when. " \
                   'The reply never fires; its own post comes out instead.')
    end

    # A one-way named link
    if AW.present_string?(post['replyTo']) && (owner = index[post['replyTo']]&.first) && owner['id'] != nid
      mine = AW.own_feed_posts(npc).map { |p| p['id'] }
      unless AW.feed_replies(owner).any? { |r| mine.include?(r['replyTo']) }
        warn(issues, "#{tag}: #{nid} replies to #{owner['id']} but #{owner['id']} has no reply to #{nid}: if #{owner['id']} " \
                     "posts after #{nid}, both post their own vent.")
      end
    end

    # A second reply that no answer can open
    same = AW.feed_replies(npc).select do |r|
      (AW.present_string?(post['replyTo']) && r['replyTo'] == post['replyTo']) ||
        (AW.present_string?(post['replyToComplaint']) && r['replyToComplaint'] == post['replyToComplaint'])
    end
    return unless same.index(post).to_i.positive?

    opened = threads.any? do |poster, t|
      AW.feed_replies(poster).any? { |r| r['replyTo'] == t['id'] }
    end
    return if opened

    extra = AW.present_string?(post['replyToComplaint']) ? ' It can still land in another member\'s vent when two vents are out.' : ''
    warn(issues, "#{tag} is a second reply that no answer can open: the thread's poster has no answer to it.#{extra}")
  end

  def reply_report_lines(json_data, lines)
    index = feed_post_index(json_data)
    name = ->(n) { AW.friendface_name(json_data, n) }
    complaints = {}
    repliers = Hash.new { |h, k| h[k] = [] }
    room_npcs(json_data).each do |e|
      npc = e[:npc]
      AW.own_feed_posts(npc).each { |p| (complaints[p['complaint']] ||= []) << npc if AW.present_string?(p['complaint']) }
      seen = Hash.new(0)
      AW.feed_replies(npc).each do |r|
        key = r['replyTo'] || "c:#{r['replyToComplaint']}"
        nth = (seen[key] += 1)
        if AW.present_string?(r['replyToComplaint'])
          (complaints[r['replyToComplaint']] ||= []) << npc
          repliers[r['replyToComplaint']] << npc
          next if nth == 1

          lines << "ℹ️ Reply #{name.call(npc)} may reply again in a '#{r['replyToComplaint']}' vent's thread, in place of " \
                   "'#{r['insteadOf']}', only if the vent's poster has answered since #{name.call(npc)}'s last reply in it."
          next
        end
        owner, tpost = index[r['replyTo']]
        next unless owner

        if owner['id'] == npc['id']
          lines << if nth == 1
                     "ℹ️ Reply #{name.call(npc)} answers in the thread of '#{r['replyTo']}', in place of '#{r['insteadOf']}', only if a reply " \
                       'is out by the time that post is due.'
                   else
                     "ℹ️ Reply #{name.call(npc)} may answer again in the thread of '#{r['replyTo']}', in place of '#{r['insteadOf']}', only " \
                       "if another NPC has replied since #{name.call(npc)}'s last answer by the time that post is due."
                   end
          next
        end
        line = if nth == 1
                 "ℹ️ Reply #{name.call(npc)} replies to #{name.call(owner)}'s '#{r['replyTo']}', in place of '#{r['insteadOf']}'"
               else
                 "ℹ️ Reply #{name.call(npc)} may reply again in the thread of '#{r['replyTo']}', in place of '#{r['insteadOf']}', only if " \
                   "#{name.call(owner)} has answered there since #{name.call(npc)}'s last reply by the time that post is due"
               end
        line += ". When: #{reactive_condition_words(json_data, npc, r['when'])}" if r['when'].is_a?(Hash)
        if r['when'].is_a?(Hash) && tpost && tpost['when'].is_a?(Hash) &&
           %w[cause need].none? { |k| !r['when'][k].nil? && r['when'][k] == tpost['when'][k] }
          line += ' (the reply and its thread post share no cause or need: is this the same complaint?)'
        end
        lines << "#{line}."
      end
    end
    complaints.each do |c, members|
      who = members.uniq.map { |n| name.call(n) }
      rep = repliers[c].uniq.map { |n| name.call(n) }
      lines << "ℹ️ Complaint '#{c}': #{rep.empty? ? 'no member' : rep.join(', ')} can reply in place of their vent. " \
               "Possible members: #{who.join(', ')}."
    end
  end
end
