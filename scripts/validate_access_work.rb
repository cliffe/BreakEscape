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
    issues
  end

  def report_lines(_json_data)
    []
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
end
