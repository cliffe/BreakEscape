module BreakEscape
  # Networks for the player (docs/achitechture/ACCESS_MODEL_SLICE_9_3_PLAN.md, slice 9.3a):
  # footholds gained by planting a rogue device in a network jack, the link item that
  # stands for each, the network view, remote sign-in through a foothold, hosts with no
  # screen of their own, and file shares.
  #
  # The scenario-level rules (membership, jacks, hosts, resources, reach) are in
  # BreakEscape::NetworkModel, which the validator and the dungeon graph share. This
  # concern holds the player-side model code, so Game takes only small hooks.
  #
  # player_state keys (in Game::ACCESS_STATE_DEFAULTS):
  #   footholds        { footholdId => { 'via', 'network', 'source', 'device', 'seq' } }
  #   gainedFootholds  [jackId, ...], every jack a foothold was ever gained from
  module NetworkAccess
    extend ActiveSupport::Concern

    # Top-level scenario keys the bootstrap never ships (section 6).
    WITHHELD_SCENARIO_KEYS = %w[networks networkLinks resources].freeze
    # Fields deleted from every object the server sends: membership, and the jack's
    # link name and holder, which arrive on the link item (section 6).
    WITHHELD_OBJECT_FIELDS = %w[network linkName linkStoreIn].freeze

    def withhold_network_keys!(filtered)
      WITHHELD_SCENARIO_KEYS.each { |key| filtered.delete(key) }
      filtered
    end

    # Room data (section 6): each jack carries jackPlanted, true while the server holds a
    # foothold there, so the jack's look survives a reload.
    def attach_network_state!(objects)
      Array(objects).each do |obj|
        next unless obj.is_a?(Hash)

        obj['jackPlanted'] = network_footholds.key?(foothold_id_for(obj['id'])) if NetworkModel.jack?(obj)
        attach_network_state!(obj['contents']) if obj['contents'].is_a?(Array)
      end
    end

    # A jack's foothold id (4.1).
    def foothold_id_for(jack_id)
      "jack_#{jack_id}"
    end

    # The footholds held now. A game from before this slice has no key: read as none.
    def network_footholds
      held = player_state.is_a?(Hash) ? player_state['footholds'] : nil
      held.is_a?(Hash) ? held : {}
    end

    def gained_footholds
      list = player_state.is_a?(Hash) ? player_state['gainedFootholds'] : nil
      list.is_a?(Array) ? list : []
    end

    # Ids for items in a resource's contents (3.4): `<resourceId>_content_<n>`, nested
    # as Game#stamp_contents_ids! nests them. Called by stamp_scenario_object_ids!.
    def stamp_resource_content_ids!
      NetworkModel.resources(scenario_data).each do |resource_id, resource|
        next unless resource['contents'].is_a?(Array)

        resource['contents'].each_with_index do |item, i|
          next unless item.is_a?(Hash)

          item['id'] ||= "#{resource_id}_content_#{i}"
          stamp_contents_ids!(item)
        end
      end
    end

    # ==========================================
    # Jacks, devices and footholds (step 3; sections 4.1 and 5)
    # ==========================================

    JACK_NOT_FOUND = 'Jack not found'.freeze
    NO_DEVICE = 'You have nothing to plug into this port.'.freeze
    DEVICE_IN_USE = 'That device is already in use'.freeze
    # Default shown when a secured jack refuses an unknown device (section 5.4): names
    # the fix the lab's own text teaches, disabling unused ports. Overridden per jack by
    # portSecurityMessage.
    PORT_SECURITY_REFUSAL = 'This switch port only takes known machines. Unused ports like this one should be disabled.'.freeze

    # A room object found by id alone, as jacks and devices are named:
    # { object:, room_id:, room:, path: } with path the containers between the room and
    # the object. Nothing under a sign-in object is searched (its contents are a desktop).
    def network_room_object(object_id)
      return nil if object_id.blank? || !scenario_data.is_a?(Hash) || !scenario_data['rooms'].is_a?(Hash)

      scenario_data['rooms'].each do |room_id, room|
        next unless room.is_a?(Hash)

        found = network_object_in(room['objects'], object_id.to_s, [])
        return found.merge(room_id: room_id, room: room) if found
      end
      nil
    end

    # The jack with this id (a room object with networkJack: true on a network the
    # scenario defines) with its network, or nil.
    def find_jack(jack_id)
      info = network_room_object(jack_id)
      return nil unless info && NetworkModel.jack?(info[:object])

      network = NetworkModel.network_of(info[:object], info[:room])
      return nil unless network && NetworkModel.networks(scenario_data).key?(network)

      info.merge(network: network)
    end

    # The refusal text when a jack object has port security (section 5.4), or nil when it
    # does not. The authored portSecurityMessage wins; a default names the fix otherwise.
    def port_security_refusal(jack_object)
      return nil unless jack_object.is_a?(Hash) && jack_object['portSecurity']

      message = jack_object['portSecurityMessage']
      message.is_a?(String) && !message.strip.empty? ? message : PORT_SECURITY_REFUSAL
    end

    # "Object reachable" (section 5): a room object whose room is unlocked or never
    # locked, with every locked container above it unlocked. The server cannot see where
    # the player stands (main plan 4.2).
    def object_reachable?(info)
      return false unless info && info[:room_id]

      room = room_data(info[:room_id])
      room.is_a?(Hash) && (!room['locked'] || room_unlocked?(info[:room_id])) && path_unlocked?(info[:path])
    end

    # The first rogue device the server inventory holds, in scenario order, or the one
    # named by device_id with no fallback (section 5, "Rogue device held"). The flag is
    # read from the scenario definition, never from the stored inventory entry.
    # { definition:, entry: } or nil.
    def held_rogue_device(device_id = nil)
      inventory = Array(player_state['inventory']).select { |item| item.is_a?(Hash) }
      return nil if inventory.empty?

      seen = {}
      NetworkModel.rogue_device_definitions(scenario_data).each do |found|
        definition = found[:item]
        next if seen[definition['id']]

        seen[definition['id']] = true
        next if device_id.present? && definition['id'] != device_id.to_s

        entry = inventory.find { |item| ItemIdentity.held_in?(definition, [item]) }
        return { definition: definition, entry: entry } if entry
      end
      nil
    end

    # Is this item a device planted in a jack right now (4.1)? Matched on identity
    # against the server's copy kept in each foothold.
    def planted_device?(item)
      return false unless item.is_a?(Hash)

      devices = network_footholds.values.filter_map { |foothold| foothold['device'] if foothold.is_a?(Hash) && foothold['device'].is_a?(Hash) }
      devices.any? && ItemIdentity.held_in?(item, devices)
    end

    # Room data never offers a planted device (4.1): not as a room object, not inside
    # an open container, not in an NPC's itemsHeld. Called by apply_room_state_changes!,
    # beside the rule for items in the inventory.
    def hide_planted_devices!(room)
      return if network_footholds.empty?

      strip = lambda do |list|
        next unless list.is_a?(Array)

        list.reject! { |obj| planted_device?(obj) }
        list.each { |obj| strip.call(obj['contents']) if obj.is_a?(Hash) }
      end
      strip.call(room['objects'])
      return unless room['npcs'].is_a?(Array)

      room['npcs'] = room['npcs'].map do |npc|
        next npc unless npc.is_a?(Hash) && npc['itemsHeld'].is_a?(Array) && npc['itemsHeld'].any? { |held| planted_device?(held) }

        # A copy: NPCs from npcs_added belong to player_state
        npc.merge('itemsHeld' => npc['itemsHeld'].reject { |held| planted_device?(held) })
      end
    end

    # POST /network/plant (section 5). Returns { status:, body: }.
    def plant_device!(jack_id, device_id = nil)
      jack = find_jack(jack_id)
      return { status: :not_found, body: { success: false, error: JACK_NOT_FOUND } } unless jack
      unless object_reachable?(jack)
        return { status: :forbidden, body: { success: false, reason: 'unreachable', error: 'Jack not reachable' } }
      end

      # Port security (section 5.4): a secured jack takes the device in, refuses an
      # unknown machine, gives no foothold and leaves the device in the inventory. It
      # only refuses; a bypass is not part of this slice.
      if (refusal = port_security_refusal(jack[:object]))
        return { status: :unprocessable_entity, body: { success: false, reason: 'port_security', error: refusal } }
      end

      jack_id = jack[:object]['id'].to_s
      foothold_id = foothold_id_for(jack_id)
      if network_footholds.key?(foothold_id)
        return { status: :ok, body: { success: true, already: true, first: false, foothold: foothold_for_client(foothold_id),
                                      inventory: player_state['inventory'] } }
      end

      device = held_rogue_device(device_id)
      return { status: :unprocessable_entity, body: { success: false, reason: 'no_device', error: NO_DEVICE } } unless device

      definition = device[:definition]
      copy = device[:entry].deep_dup
      player_state['inventory'] = Array(player_state['inventory']).reject do |item|
        item.is_a?(Hash) && ItemIdentity.held_in?(definition, [item])
      end
      hide_device_in_its_room!(definition)

      first = !gained_footholds.include?(jack_id)
      player_state['footholds'] = network_footholds
      seq = network_footholds.values.map { |f| f.is_a?(Hash) ? f['seq'].to_i : 0 }.max.to_i + 1
      player_state['footholds'][foothold_id] = {
        'via' => 'jack', 'network' => jack[:network], 'source' => jack_id, 'device' => copy, 'seq' => seq
      }
      player_state['gainedFootholds'] = gained_footholds
      player_state['gainedFootholds'] << jack_id if first
      player_state['inventory'] << link_item_for(foothold_id)
      # A worn device planted in a jack comes off (Wearables)
      release_worn_unless_held!
      save!

      { status: :ok, body: { success: true, foothold: foothold_for_client(foothold_id), inventory: player_state['inventory'],
                             first: first } }
    end

    # POST /network/unplug (section 5). Returns { status:, body: }.
    def unplug_device!(jack_id)
      jack = find_jack(jack_id)
      return { status: :not_found, body: { success: false, error: JACK_NOT_FOUND } } unless jack

      foothold_id = foothold_id_for(jack[:object]['id'])
      unless network_footholds.key?(foothold_id)
        return { status: :unprocessable_entity, body: { success: false, reason: 'not_planted', error: 'Nothing is plugged in here' } }
      end
      unless object_reachable?(jack)
        return { status: :forbidden, body: { success: false, reason: 'unreachable', error: 'Jack not reachable' } }
      end

      player_state['footholds'] = network_footholds
      foothold = player_state['footholds'].delete(foothold_id)
      link_id = link_item_id(foothold_id)
      player_state['inventory'] = Array(player_state['inventory']).reject { |item| item.is_a?(Hash) && item['id'] == link_id }
      device = foothold.is_a?(Hash) ? foothold['device'] : nil
      if device.is_a?(Hash) && device.any? && !ItemIdentity.held_in?(device, player_state['inventory'])
        player_state['inventory'] << device
      end
      ended = end_sessions_through!(foothold_id)
      save!

      { status: :ok, body: { success: true, inventory: player_state['inventory'], endedPcIds: ended } }
    end

    # ==========================================
    # Wi-Fi (slice 9.3b sub-slice W; sections 4.3 and 5.3)
    # ==========================================

    AP_NOT_FOUND = 'Access point not found'.freeze
    WRONG_WIFI_KEY = 'That key was not accepted'.freeze

    # A Wi-Fi foothold's id (5.3): one per network, so a second access point of a network
    # already joined is the same foothold.
    def wifi_foothold_id(network_id)
      "wifi_#{network_id}"
    end

    # The access point with this id: a room object with wifiAp: true on a network the
    # scenario defines with a wifi block, with its network and { ssid, psk }, or nil.
    def find_wifi_ap(ap_id)
      info = network_room_object(ap_id)
      return nil unless info && info[:object].is_a?(Hash) && info[:object]['wifiAp'] == true

      network = NetworkModel.network_of(info[:object], info[:room])
      return nil unless network && NetworkModel.networks(scenario_data).key?(network)

      wifi = NetworkModel.wifi_of(scenario_data, network)
      return nil unless wifi

      info.merge(network: network, wifi: wifi)
    end

    # POST /network/join (5.3, section 6). Returns { status:, body: }. The key is compared
    # on the server (an open network, psk absent, skips the check). A wrong key is never
    # counted. Joining a network already held answers already: true and still records the
    # access point in gainedFootholds.
    def join_network!(ap_id, key = nil)
      ap = find_wifi_ap(ap_id)
      return { status: :not_found, body: { success: false, error: AP_NOT_FOUND } } unless ap
      unless object_reachable?(ap)
        return { status: :forbidden, body: { success: false, reason: 'unreachable', error: 'Access point not reachable' } }
      end

      network_id = ap[:network]
      ap_object_id = ap[:object]['id'].to_s
      foothold_id = wifi_foothold_id(network_id)
      if network_footholds.key?(foothold_id)
        record_gained_ap!(ap_object_id)
        return { status: :ok, body: { success: true, already: true, first: false,
                                      foothold: foothold_for_client(foothold_id), inventory: player_state['inventory'] } }
      end

      psk = ap[:wifi]['psk']
      if NetworkModel.present_string?(psk) && !(key.is_a?(String) && key == psk)
        return { status: :unprocessable_entity, body: { success: false, reason: 'wrong_key', error: WRONG_WIFI_KEY } }
      end

      first = !gained_footholds.include?(ap_object_id)
      player_state['footholds'] = network_footholds
      seq = network_footholds.values.map { |f| f.is_a?(Hash) ? f['seq'].to_i : 0 }.max.to_i + 1
      net_name = network_name(network_id).presence || 'Wi-Fi'
      record = { 'via' => 'wifi', 'network' => network_id, 'source' => ap_object_id,
                 'name' => ap[:object]['linkName'].presence || "Wi-Fi: #{net_name}", 'seq' => seq }
      ap_sprite = ap[:object]['sprite']
      record['sprite'] = ap_sprite if ap_sprite.is_a?(String) && !ap_sprite.empty?
      player_state['footholds'][foothold_id] = record
      player_state['gainedFootholds'] = gained_footholds
      player_state['gainedFootholds'] << ap_object_id if first
      player_state['inventory'] = Array(player_state['inventory'])
      player_state['inventory'] << link_item_for(foothold_id)
      save!

      { status: :ok, body: { success: true, foothold: foothold_for_client(foothold_id),
                             inventory: player_state['inventory'], first: first } }
    end

    # Add an access point id to gainedFootholds if absent, and save (5.3, N9): a task or
    # mapping on a second access point of a joined network still completes.
    def record_gained_ap!(ap_object_id)
      return if gained_footholds.include?(ap_object_id)

      player_state['gainedFootholds'] = gained_footholds
      player_state['gainedFootholds'] << ap_object_id
      save!
    end

    # Ends every session opened through this foothold (4.1, an unplug); returns their
    # PC ids. The caller saves.
    def end_sessions_through!(foothold_id)
      sessions = player_state['sessions'].is_a?(Hash) ? player_state['sessions'] : {}
      ended = sessions.select { |_pc_id, session| session.is_a?(Hash) && session['foothold'] == foothold_id }.keys
      player_state['sessions'] = sessions.except(*ended)
      ended
    end

    # ==========================================
    # Implants (sub-slice I; sections 4.5 and 5.5)
    # ==========================================

    IMPLANT_NO_ACTION = 'No such implant here'.freeze
    IMPLANT_NOT_READY = 'The device did not take.'.freeze
    # The server's copy of the client's USB refusal lines (pc-policy.js), so a blocked
    # implant shows the same authored line.
    USB_REFUSAL_LINES = { 'storage_blocked' => 'USB storage is disabled on this PC.',
                          'blocked' => 'USB devices are disabled on this PC.' }.freeze

    def implant_foothold_id_for(pc_id)
      "implant_#{pc_id}"
    end

    # The grow-only record of item ids the player has ever dropped (Game#add_item_to_room!),
    # the durable proof the dropped shape reads (5.5). Empty before this slice.
    def dropped_items
      list = player_state.is_a?(Hash) ? player_state['droppedItems'] : nil
      list.is_a?(Array) ? list : []
    end

    # The declared grant_foothold action for this PC and shape (5.5). The rule is one action
    # per [pc, shape]: the validator (validate_network.rb) errors on two grant_footholds that
    # share a PC and shape, so the spec, the validator and this selection all key on the pair.
    # `path` is still forwarded from the client (apply-actions passes action.path) and used only
    # as an extra tie-break if ever present; it is not load-bearing, because the validator never
    # lets two actions reach the same [pc, shape] for it to tell apart (review R1 server minor 1).
    def grant_foothold_action_for(pc_id, shape, path)
      NetworkModel.grant_foothold_actions(scenario_data).find do |a|
        a[:pc] == pc_id.to_s && a[:shape] == shape.to_s && (path.to_s.empty? || a[:path] == path.to_s)
      end
    end

    # A held inventory item named by needsHeld (its id, type or name), or nil. needsHeld should
    # name a device by its id when two held items share a type: id is matched first, so an
    # id-named needsHeld is unambiguous where a type-named one could pick either (review R1 nit 2).
    def inventory_item_matching(needs_held)
      needs = needs_held.to_s
      return nil if needs.empty?

      Array(player_state['inventory']).find do |item|
        item.is_a?(Hash) && [item['id'], item['type'], item['name']].compact.map(&:to_s).include?(needs)
      end
    end

    # POST /network/implant (5.5, section 6). shape is 'dropped' or 'session'; path picks the
    # action when a PC has several. Returns { status:, body: }. It gives a foothold on the PC's
    # own network and nothing else: no session, no desktop, no owner's access.
    def implant_foothold!(pc_id, shape, path)
      pc_id = pc_id.to_s
      shape = shape.to_s
      action = grant_foothold_action_for(pc_id, shape, path)
      return implant_no_action unless action

      foothold_id = implant_foothold_id_for(pc_id)
      # Already held (before the preconditions, m2): a repeat answers already, never not_ready.
      # Name the device the first (successful) call consumed, from the stored foothold record, so
      # a retry after a lost response reconciles the tray exactly as the first success would have
      # (review R2 M1). The dropped shape stores no device, so consumedId is nil there.
      if network_footholds.key?(foothold_id)
        held = network_footholds[foothold_id]
        consumed = held.is_a?(Hash) && held['device'].is_a?(Hash) ? held['device']['id'] : nil
        return { status: :ok, body: { success: true, already: true, first: false, consumedId: consumed,
                                      foothold: foothold_for_client(foothold_id), inventory: player_state['inventory'] } }
      end

      info = find_login_pc(pc_id)
      return implant_no_action unless info

      network = object_network(info[:object])
      return implant_not_ready unless NetworkModel.present_string?(network)

      device_copy = nil
      if shape == 'session'
        session = access_sessions[pc_id]
        # A non-foothold session only: a claim or a keyboard sign-in, never a live
        # remote-through-foothold session (testing via alone is wrong, 5.5).
        return implant_not_ready unless session.is_a?(Hash) && session['foothold'].blank?

        entry = inventory_item_matching(action[:needs_held])
        return implant_not_ready unless entry

        # The USB hook (5.5): the PC's policy must not refuse the device's usbClass. Reuses
        # AccessWork.plant_refused?, the table pc-policy.js uses, never a parallel method.
        if BreakEscape::AccessWork.plant_refused?(scenario_data, info[:object], entry)
          usb = BreakEscape::AccessWork.usb_policy_for(scenario_data, info[:object])
          message = USB_REFUSAL_LINES[usb] || USB_REFUSAL_LINES['blocked']
          return { status: :unprocessable_entity, body: { success: false, reason: 'usb_refused', error: message } }
        end

        device_copy = entry.deep_dup
        player_state['inventory'] = Array(player_state['inventory']).reject { |item| item.equal?(entry) }
      else # dropped
        return implant_not_ready unless dropped_items.include?(action[:needs_dropped].to_s)
      end

      first = !gained_footholds.include?(pc_id)
      # The dropped branch never normalised the inventory (the session branch did at its reject);
      # guard once here so the << below is safe on a nil/non-array inventory (review R1 nit 1).
      player_state['inventory'] = Array(player_state['inventory'])
      player_state['footholds'] = network_footholds
      seq = network_footholds.values.map { |f| f.is_a?(Hash) ? f['seq'].to_i : 0 }.max.to_i + 1
      record = { 'via' => 'implant', 'network' => network, 'source' => pc_id, 'seq' => seq,
                 'name' => action[:name], 'sprite' => implant_sprite(device_copy, info[:object]) }
      record['device'] = device_copy if device_copy.is_a?(Hash)
      player_state['footholds'][foothold_id] = record
      player_state['gainedFootholds'] = gained_footholds
      player_state['gainedFootholds'] << pc_id if first
      player_state['inventory'] << link_item_for(foothold_id)
      save!

      # consumedId names the one tray device the session shape removed, so the client reconciles
      # only the ids that changed (review R1 client M1); the dropped shape consumes nothing.
      consumed_id = device_copy['id'] if device_copy.is_a?(Hash)
      { status: :ok, body: { success: true, consumedId: consumed_id, foothold: foothold_for_client(foothold_id),
                             inventory: player_state['inventory'], first: first } }
    end

    def implant_no_action
      { status: :not_found, body: { success: false, reason: 'no_action', error: IMPLANT_NO_ACTION } }
    end

    def implant_not_ready
      { status: :unprocessable_entity, body: { success: false, reason: 'not_ready', error: IMPLANT_NOT_READY } }
    end

    # The sprite stored on an implant foothold: the device's own, else the PC's (5.3).
    def implant_sprite(device_copy, pc)
      (device_copy.is_a?(Hash) && (device_copy['sprite'].presence || device_copy['type'].presence)) ||
        (pc.is_a?(Hash) ? pc['sprite'] : nil)
    end

    # The link item for an implant foothold (5.3): its name and sprite from the foothold
    # record stored at implant time, its observations naming the PC.
    def implant_link_item(foothold_id, foothold)
      device = foothold['device'].is_a?(Hash) ? foothold['device'] : {}
      pc = find_login_pc(foothold['source'])&.dig(:object) || {}
      host = pc['host'].presence || pc['name'].presence || foothold['source'].to_s
      item = {
        'id' => link_item_id(foothold_id),
        'type' => 'network_link',
        'name' => foothold['name'].presence || "Implant: #{host}",
        'sprite' => foothold['sprite'].presence || device['sprite'].presence || device['type'],
        'takeable' => false,
        'footholdId' => foothold_id,
        'sourceId' => foothold['source'],
        'observations' => "Your implant on #{host}. Open it to see what it reaches."
      }
      item
    end

    def link_item_id(foothold_id)
      "netlink_#{foothold_id}"
    end

    # The link item for a held foothold, in exactly the shape of 4.1. An implant's source
    # is a PC, not a jack, so it builds from the name and sprite stored on the foothold
    # record at implant time (5.3). A Wi-Fi foothold (5.3) likewise reads its name and sprite
    # from the record written at join, so each handle survives a reload when the device or the
    # access point is no longer in hand, rather than re-deriving from a jack.
    def link_item_for(foothold_id)
      foothold = network_footholds[foothold_id] || {}
      return implant_link_item(foothold_id, foothold) if foothold['via'] == 'implant'
      return wifi_link_item_for(foothold_id, foothold) if foothold['via'] == 'wifi'

      device = foothold['device'].is_a?(Hash) ? foothold['device'] : {}
      jack = find_jack(foothold['source'])&.dig(:object) || {}
      device_name = device['name'].presence || 'Device'
      jack_name = jack['name'].presence || foothold['source'].to_s
      item = {
        'id' => link_item_id(foothold_id),
        'type' => 'network_link',
        'name' => jack['linkName'].presence || "#{device_name}: #{jack_name}",
        'sprite' => device['sprite'].presence || device['type'],
        'takeable' => false,
        'footholdId' => foothold_id,
        'sourceId' => foothold['source'],
        'observations' => "Your #{device_name} on #{jack_name}. Open it to see what it reaches."
      }
      item['storeIn'] = jack['linkStoreIn'] if jack['linkStoreIn'].is_a?(String) && !jack['linkStoreIn'].empty?
      item
    end

    # The link item for a Wi-Fi foothold (5.3): the name and sprite come from the foothold
    # record (stored at join), the observations name the network.
    def wifi_link_item_for(foothold_id, foothold)
      net_name = network_name(foothold['network']).presence || 'Wi-Fi'
      name = foothold['name'].presence || "Wi-Fi: #{net_name}"
      item = {
        'id' => link_item_id(foothold_id),
        'type' => 'network_link',
        'name' => name,
        'takeable' => false,
        'footholdId' => foothold_id,
        'sourceId' => foothold['source'],
        'observations' => "Your Wi-Fi link to #{net_name}. Open it to see what it reaches."
      }
      item['sprite'] = foothold['sprite'] if foothold['sprite'].is_a?(String) && !foothold['sprite'].empty?
      item
    end

    def network_name(network_id)
      NetworkModel.networks(scenario_data).dig(network_id, 'name')
    end

    # A held foothold as the bootstrap and the plant answer give it (section 6).
    def foothold_for_client(foothold_id)
      foothold = network_footholds[foothold_id] || {}
      link = link_item_for(foothold_id)
      { 'id' => foothold_id, 'via' => foothold['via'], 'name' => link['name'], 'itemId' => link['id'],
        'sourceId' => foothold['source'], 'network' => { 'id' => foothold['network'], 'name' => network_name(foothold['network']) } }
    end

    def held_foothold_ids
      network_footholds.sort_by { |_id, foothold| foothold.is_a?(Hash) ? foothold['seq'].to_i : 0 }.map(&:first)
    end

    # Every held foothold for GET /scenario: no hosts (section 6). Each also carries its link
    # item's sprite, observations and, when set, storeIn (none is secret), so a client that
    # lost the link item rebuilds the real one (restoreHandles, network-links.js).
    def footholds_for_client
      held_foothold_ids.map do |id|
        link = link_item_for(id)
        foothold_for_client(id).merge(link.slice('sprite', 'observations', 'storeIn'))
      end
    end

    # GET /network (sections 4.3, 5 and 6). Returns { status:, body: }.
    def network_view(foothold_id = nil)
      ids =
        if foothold_id.present?
          unless network_footholds.key?(foothold_id.to_s)
            return { status: :not_found, body: { error: "Foothold not found: #{foothold_id}" } }
          end

          [foothold_id.to_s]
        else
          held_foothold_ids
        end
      footholds = ids.map do |id|
        # An implant on a switched-off PC (review R3 M1) is listed, marked not responding, and
        # reaches nothing: no rows of its own network, and only greyed blocks
        if implant_source_off?(id)
          source = find_login_pc(network_footholds[id]['source'])
          next foothold_for_client(id).merge('responding' => false, 'sourceHost' => source ? host_label(source[:object]) : nil,
                                             'hosts' => [], 'networks' => network_blocks(id))
        end

        foothold_for_client(id).merge('hosts' => network_rows(network_footholds[id]['network']),
                                      'networks' => network_blocks(id))
      end
      { status: :ok, body: { footholds: footholds } }
    end

    # The per-foothold network blocks (5.1): one `up` entry per network in player_reach (the
    # own network with via null, a pivot-reached network naming the host and session it is
    # reached through), and one greyed `down` entry per network the player holds a session on
    # through this foothold but cannot reach now (its hosts limited to the held-session rows).
    # A network the player neither reaches nor holds a session on is absent and unnamed. The
    # own network's rows also stay in the flat `hosts` array (9.3a); the block is additive.
    def network_blocks(foothold_id)
      own = network_footholds[foothold_id]['network']
      reach = player_reach(foothold_id)
      session_hosts = view_session_hosts
      # An up block is reached through a host that answers (review R2 m2): an off host relays
      # nothing, so it is never named there. A down block keeps naming it (the right hint).
      live_hosts = session_hosts.reject { |h| host_service_off?(h[:pc]) }
      blocks = reach.to_a.sort.map do |net|
        { 'id' => net, 'name' => network_name(net), 'via' => (net == own ? nil : via_for(net, live_hosts, reach)),
          'hosts' => network_rows(net), 'route' => 'up' }
      end
      blocks + down_blocks(foothold_id, reach, session_hosts)
    end

    # The greyed blocks (5.1): a network the player holds a session on, reached through this
    # foothold, that player_reach no longer includes. Its name is safe to show (the player
    # learned it by signing in there); its rows are only the held-session hosts. None appears
    # in sub-slice K (no outages), but O reuses this.
    def down_blocks(foothold_id, reach, session_hosts)
      structural = structural_reach(foothold_id)
      nets = session_hosts.map { |h| h[:net] }.uniq.reject { |net| reach.include?(net) }
      nets.select { |net| structural.include?(net) }.sort.map do |net|
        # A down block advertises no action the server would refuse: no sign-in, no session
        rows = session_hosts.select { |h| h[:net] == net }.map { |h| host_row(h[:pc]).except('remoteSignIn', 'session', 'responding', 'heldAs') }
        { 'id' => net, 'name' => network_name(net), 'via' => via_for(net, session_hosts, structural),
          'hosts' => rows, 'route' => 'down' }
      end
    end

    # [{ pc_id:, pc:, host_id:, net:, seq: }] for every held session at a sign-in host, for
    # the view blocks. The `via` of a pivot-reached network names the bridging session. `seq`
    # is the session's position in the stored sessions hash, the primary tie-break for `via`
    # (5.1). The column is jsonb, which keeps object keys sorted by length then bytewise, so
    # after a save this is that order, not the order of sign-in; it is still deterministic.
    def view_session_hosts
      access_sessions.each_with_index.filter_map do |(pc_id, session), seq|
        next unless session.is_a?(Hash)

        info = find_login_pc(pc_id)
        next unless info

        net = object_network(info[:object])
        net ? { pc_id: pc_id.to_s, pc: info[:object], host_id: info[:object]['id'], net: net, seq: seq } : nil
      end
    end

    # The bridging host a network is reached through (5.1): a held session at a host on a
    # network linked to it and itself reached; when several bridge, the one with the lowest
    # session seq, then by host id, so the label is deterministic (plan 5.1). nil when none
    # (the own network, via null). `displayName` is the bridging session's account.
    def via_for(network, session_hosts, reach)
      linked = NetworkModel.linked_networks(scenario_data, network)
      candidates = session_hosts.select { |h| linked.include?(h[:net]) && reach.include?(h[:net]) }
      return nil if candidates.empty?

      best = candidates.min_by { |h| [h[:seq].to_i, h[:host_id].to_s] }
      via = { 'hostId' => best[:host_id], 'host' => host_label(best[:pc]) }
      session = access_sessions[best[:host_id].to_s]
      npc = session.is_a?(Hash) ? scenario_room_npc(session['id']) : nil
      via['displayName'] = npc['displayName'] || npc['id'] if npc
      via
    end

    # The rows of a network's view: each sign-in host, then each resource, each sorted by id.
    def network_rows(network_id)
      hosts = NetworkModel.sign_in_objects_on(network_id, scenario_data).map { |entry| host_row(entry[:object]) }
      # A resource whose own downIf is truthy is withheld while down (5.2), as a resource on a
      # down network is: its row leaves the view until the global clears.
      resources = NetworkModel.resources_on(network_id, scenario_data).reject { |_id, resource| resource_down?(resource) }
      hosts + resources.map { |id, resource| resource_row(id, resource) }
    end

    # A sign-in PC's label on the network (3.2).
    def host_label(pc)
      pc['host'].presence || pc['name']
    end

    # The PC's policy turns remote sign-in off (3.4).
    def remote_blocked?(pc)
      effective_policy(pc)['remote'] == 'blocked'
    end

    # A sign-in host whose own office-life service is off (9.3b plan 5.2): its
    # `affordance.offWhen` (9.2's field) holds on the server's copy of the globals, read the way
    # the NPC frustration path reads them. Its row answers "not responding", and a remote
    # sign-in, a remote desktop and a scoped request under a remote session there are refused
    # 403 not_responding. Off is off at its own keyboard too (user decision q72): a walk-up
    # sign-in, a claim, the keyboard desktop and the shares mapped there are refused 403 off,
    # "This PC is off." A session already held there, remote or local, is kept, as one over a
    # down route is, and works again when the PC is back on.
    #
    # Like an outage (network_up?), this is a soft gate, not a security boundary: the global is
    # client-synced. Clearing it only lets the player use a PC they could already reach.
    # `globals` lets a caller that asks for many hosts build the merged globals once.
    def host_service_off?(pc, globals = nil)
      cond = BreakEscape::AccessWork.affordance(scenario_data, pc)&.dig('offWhen')
      return false if cond.nil? || cond == false || cond == ''

      BreakEscape::AccessWork.globals_hold?(cond, globals || frustration_globals)
    end

    # An implant foothold (`via: "implant"`) is software running on its source PC, so while that
    # PC's own service is off the foothold reaches nothing (review R3 M1): the outage walk
    # returns no networks, the view marks it not responding, and a remote sign-in, a share or
    # a session through it is refused. structural_reach ignores this, so nothing is pruned and
    # the foothold works again, with no new implant, when the PC is back on.
    def implant_source_off?(foothold_id, globals = nil)
      foothold = network_footholds[foothold_id.to_s]
      return false unless foothold.is_a?(Hash) && foothold['via'] == 'implant'

      info = find_login_pc(foothold['source'])
      info ? host_service_off?(info[:object], globals) : false
    end

    PC_OFF_MESSAGE = 'This PC is off.'.freeze
    PC_NOT_RESPONDING_MESSAGE = 'PC not responding'.freeze

    # Why a desktop request is refused (render_login_desktop's 403 reason), or nil when it is
    # allowed. 'not_responding': through a foothold that reaches the host, whose own service is
    # off. 'off': at the keyboard of a reachable PC that is off (q72). Else 'unreachable'. The
    # power state is told only where the PC itself could be reached.
    def desktop_refusal(info, foothold_id)
      return nil if desktop_request_allowed?(info, foothold_id)

      pc = info[:object]
      if foothold_id.present?
        return 'not_responding' if host_reachable_through?(foothold_id, pc) && !remote_blocked?(pc) && host_service_off?(pc)
      elsif login_pc_reachable?(info) && !NetworkModel.headless?(pc) && host_service_off?(pc)
        return 'off'
      end
      'unreachable'
    end

    def host_row(pc)
      row = { 'id' => pc['id'], 'kind' => 'pc', 'name' => pc['name'], 'host' => host_label(pc),
              'sprite' => pc['sprite'].presence || 'pc_desktop', 'headless' => NetworkModel.headless?(pc) }
      remote = !remote_blocked?(pc)
      session = access_sessions[pc['id'].to_s]
      held = nil
      # A claimed session is physical and not offered over the network (4.3)
      if remote && session.is_a?(Hash) && session['via'] == 'password'
        npc = scenario_room_npc(session['id'])
        if npc && self.class.account_holder?(npc)
          held = { 'username' => npc['creds']['username'], 'displayName' => npc['displayName'] || npc['id'],
                   'via' => 'password', 'remote' => session['foothold'].present? }
        end
      end
      # A host whose service is off offers nothing: no sign-in and no session to open (5.2).
      # A session held there is kept, so the row names it (heldAs) rather than drop it silently.
      if host_service_off?(pc)
        row['responding'] = false
        row['heldAs'] = held['displayName'] if held
        return row
      end

      row['remoteSignIn'] = remote
      row['session'] = held if held
      row
    end

    def resource_row(resource_id, resource)
      row = { 'id' => resource_id, 'kind' => resource['kind'], 'name' => resource['name'], 'host' => resource['host'],
              'open' => resource['access'].nil? }
      # The client keys on 'listed', never on whether observations came with the row
      row['listed'] = true if NetworkModel.listed_only_share?(resource)
      row['observations'] = resource['observations'] if !NetworkModel.resource_contents?(resource) && resource['observations'].present?
      row
    end

    # ==========================================
    # Remote sign-in, headless hosts and shares (step 4; sections 4.4, 4.5 and 5)
    # ==========================================

    REMOTE_BLOCKED = 'Remote sign-in is turned off on this PC'.freeze

    # Does the scenario define any network? Without one there are no footholds, no
    # remote sign-in and nothing to map.
    def network_scenario?
      NetworkModel.networks(scenario_data).any?
    end

    # The network a sign-in object (or any room object) is on, read from the scenario's
    # own definition and its room (3.2), or nil.
    def object_network(obj)
      info = obj.is_a?(Hash) ? network_room_object(obj['id']) : nil
      info ? NetworkModel.network_of(info[:object], info[:room]) : nil
    end

    # ==========================================
    # Links and the pivot (slice 9.3b sub-slice K; sections 4.1 and 5.1)
    # ==========================================

    # Is a network's route up now (5.1, 5.2)? A network with no downIf is always up.
    # Otherwise the network is down while its downIf global is truthy (NetworkModel.truthy?).
    # The global is read from server state (player_state, falling back to the scenario's
    # declared default), never from a parameter in this access call, so the server decides the
    # route from its own view rather than from a value the request carries.
    #
    # The outage global is itself client-published: plan 5.2 has the browser sync it, so a
    # tampered client CAN clear it (merge_global_variables! does not protect it, by design).
    # An outage alone is therefore not a security boundary, only a soft gate. Clearing it buys
    # nothing a boundary would stop: a down-by-default network nobody has reached stays absent
    # and unnamed because reach still needs a server-held foothold or session, and a host
    # brought back into reach still demands its own password or ACL. validate_network.rb warns
    # that a secret which must not be read early needs an account-gated share or a session, not
    # an outage. network_outages_test's N5 cases drive the hostile sync and prove this.
    def network_up?(network_id)
      return true unless NetworkModel.present_string?(network_id)

      net = NetworkModel.networks(scenario_data)[network_id]
      down_if = net.is_a?(Hash) ? net['downIf'] : nil
      return true unless NetworkModel.present_string?(down_if)

      !NetworkModel.truthy?(outage_global(down_if))
    end

    # A resource whose own downIf is truthy (5.2, the player side of 9.2's resource downIf):
    # its own service is off, so it is withheld from the view and never served, exactly as a
    # resource on a down network is. A resource with no downIf is never down. 9.2 owns the NPC
    # side of a resource outage; this reads the same field for the player.
    def resource_down?(resource)
      down_if = resource.is_a?(Hash) ? resource['downIf'] : nil
      return false unless NetworkModel.present_string?(down_if)

      NetworkModel.truthy?(outage_global(down_if))
    end

    # A global's current value for an outage test (5.2). Delegates to Game#global_variable_value,
    # the shared globals reader; npc_frustration.rb#frustration_globals applies the same
    # key-presence merge for NPC frustration, so both read the same server state.
    def outage_global(name)
      global_variable_value(name)
    end

    # The scoped-request route test (5.2), judged from the server's own session record, never
    # a client-sent foothold. A scoped request (a folder under a desktop, an inventory add, an
    # unlock) under a remote session (its sessions[pc] carries a foothold) is allowed only
    # while that PC is in the player_reach of that foothold, so a lost pivot or an outage over
    # the route is caught though the session record survives. A local session (blank foothold:
    # a local sign-in, a claim, or a remote session settled at the keyboard) is judged as 9.3a
    # did, except that a PC whose own service is off (5.2, q72) refuses every session's scoped
    # requests, local ones included: off is off at the keyboard too.
    def session_route_up?(pc_id)
      session = access_sessions[pc_id.to_s]
      return true unless session.is_a?(Hash)

      info = find_login_pc(pc_id)
      return false if info && host_service_off?(info[:object])

      fid = session['foothold']
      return true if fid.blank?
      return false unless network_footholds.key?(fid.to_s)

      net = info ? object_network(info[:object]) : nil
      # A deliberate deny when the PC cannot be resolved (info nil) or has no network (net nil):
      # a session whose host the server can no longer place is treated as off-route rather than
      # trusted. This is the safe default; a future change that makes a legitimately reachable
      # remote PC momentarily unresolvable would silently deny a held session here, so the
      # happy path (a present, reachable PC passing) is covered by a test in network_outages_test.
      !net.nil? && player_reach(fid.to_s).include?(net)
    end

    # What a foothold could reach if nothing were down (5.1): start from the foothold's own
    # network and, repeatedly, from every network already reached on which the player holds
    # a session at a sign-in host, add that network's linked networks, to a fixpoint. A bare
    # foothold with no session reaches only its own network. Outages are ignored.
    def structural_reach(foothold_id)
      reach_walk(foothold_id, ignore_outages: true)
    end

    # The same walk with outages applied (5.1): the own network only when up, and a link is
    # crossed only into an up network, from a session on a network that is itself up. This is
    # the access reach. In K it equals structural_reach (network_up? is always true).
    def player_reach(foothold_id)
      reach_walk(foothold_id, ignore_outages: false)
    end

    # Memoised per game object on what the walk reads (review O R2 nit 2): the foothold record,
    # the held session keys and every network's downIf value. A scoped request asks once per held
    # session (session_admits?'s profile scope), so repeat asks in one request reuse the walk; any
    # change to the inputs (a sign-in, an unplug, an outage global) misses the cache. A copy is
    # returned so a caller that changes the set cannot alter the cached one.
    def reach_walk(foothold_id, ignore_outages:)
      key = reach_cache_key(foothold_id, ignore_outages)
      @reach_cache = {} if !defined?(@reach_cache) || @reach_cache.nil? || @reach_cache.size > 64
      (@reach_cache[key] ||= reach_walk_uncached(foothold_id, ignore_outages: ignore_outages).freeze).dup
    end

    def reach_cache_key(foothold_id, ignore_outages)
      fid = foothold_id.to_s
      outages = ignore_outages ? nil : NetworkModel.networks(scenario_data).map { |id, net| [id, net.is_a?(Hash) ? outage_global(net['downIf']) : nil] }
      # The off state of each session host, which the outage walk reads (5.2)
      # (the merged globals are built once for them all, review R2 nit 2)
      unless ignore_outages
        globals = frustration_globals
        hosts_off = access_sessions.keys.map(&:to_s).sort.map { |id| (info = find_login_pc(id)) ? host_service_off?(info[:object], globals) : nil }
        # and the power of an implant's source PC (review R3 M1)
        source_off = implant_source_off?(fid, globals)
      end
      [fid, ignore_outages, network_footholds[fid].to_json, access_sessions.keys.map(&:to_s).sort, outages, hosts_off, source_off,
       scenario_data.object_id, scenario_data['networks'].to_json, scenario_data['networkLinks'].to_json]
    end

    def reach_walk_uncached(foothold_id, ignore_outages:)
      foothold = foothold_id.present? ? network_footholds[foothold_id.to_s] : nil
      return Set.new unless foothold.is_a?(Hash)

      own = foothold['network']
      return Set.new unless NetworkModel.present_string?(own)

      up = ->(net) { ignore_outages || network_up?(net) }
      return Set.new unless up.call(own)
      # An implant on a switched-off PC relays nothing (review R3 M1). Outages only.
      return Set.new if !ignore_outages && implant_source_off?(foothold_id)

      reached = Set.new([own])
      session_hosts = reach_session_hosts
      changed = true
      while changed
        changed = false
        session_hosts.each do |host|
          net = host[:net]
          next unless reached.include?(net) && up.call(net)
          # A host whose own service is off relays nothing onward (5.2), the host-level
          # counterpart of a down network. Outages only: structural_reach still counts it, so
          # nothing is pruned and the onward session returns with the power.
          next if !ignore_outages && host_service_off?(host[:pc])

          NetworkModel.linked_networks(scenario_data, net).each do |linked|
            next unless up.call(linked)

            changed = true if reached.add?(linked)
          end
        end
      end
      reached
    end

    # [{ pc_id:, net: }] for every held session at a sign-in host on a network, used by the
    # reach walk. Any session counts (a claim or a password sign-in, however opened), so
    # sitting down at a pivot host (which clears the session's foothold in 9.3a) does not cut
    # the pivot.
    def reach_session_hosts
      access_sessions.filter_map do |pc_id, session|
        next unless session.is_a?(Hash)

        info = find_login_pc(pc_id)
        next unless info

        net = object_network(info[:object])
        net ? { pc_id: pc_id.to_s, net: net, pc: info[:object] } : nil
      end
    end

    # The networks reachable over up links from a network (5.1): the pivot walk from a host
    # the player is signed in at. Used by the shares a signed-in desktop maps.
    def networks_reachable_from(network)
      return Set.new unless NetworkModel.present_string?(network) && network_up?(network)

      reached = Set.new([network])
      frontier = [network]
      until frontier.empty?
        net = frontier.shift
        NetworkModel.linked_networks(scenario_data, net).each do |linked|
          next unless network_up?(linked)

          frontier << linked if reached.add?(linked)
        end
      end
      reached
    end

    # Ends every session over a pivot that is gone (5.1): after any session ends, every
    # session that carries a foothold whose PC network is in no held foothold's
    # structural_reach is ended, and their ids returned. A session with a blank foothold is
    # physical (a local sign-in, a claim, or a remote session settled at the keyboard) and is
    # never pruned. The caller saves. An outage never prunes (structural_reach ignores them).
    def prune_unreachable_sessions!
      sessions = player_state['sessions']
      return [] unless sessions.is_a?(Hash) && sessions.any?

      reachable = Set.new
      network_footholds.keys.each { |fid| reachable.merge(structural_reach(fid)) }

      ended = sessions.select do |pc_id, session|
        next false unless session.is_a?(Hash) && session['foothold'].present?

        info = find_login_pc(pc_id)
        net = info ? object_network(info[:object]) : nil
        net.nil? || !reachable.include?(net)
      end.keys
      player_state['sessions'] = sessions.except(*ended)
      ended
    end

    # "Host reachable through a foothold" (section 5.1): the foothold is held, the target is
    # a sign-in object on a network, and that network is in the foothold's player_reach (its
    # own network, or a linked network reached through a held, up pivot session).
    def host_reachable_through?(foothold_id, pc)
      foothold = foothold_id.present? ? network_footholds[foothold_id.to_s] : nil
      return false unless foothold.is_a?(Hash) && NetworkModel.sign_in_object?(pc)

      network = object_network(pc)
      !network.nil? && player_reach(foothold_id.to_s).include?(network)
    end

    # The one place a desktop request is judged (4.4). With a foothold: it reaches the
    # host, the host's policy allows remote sign-in and the session there is not a claim;
    # the room is not consulted. Without: the PC is physically reachable and not headless;
    # the network is not consulted.
    def desktop_request_allowed?(info, foothold_id)
      pc = info[:object]
      if foothold_id.present?
        session = access_sessions[pc['id'].to_s]
        host_reachable_through?(foothold_id, pc) && !remote_blocked?(pc) && !host_service_off?(pc) &&
          !(session.is_a?(Hash) && session['via'] == 'claim')
      else
        # Off is off at the keyboard too (q72): a held session is kept, its desktop refused
        login_pc_reachable?(info) && !NetworkModel.headless?(pc) && !host_service_off?(pc)
      end
    end

    # A desktop served at the keyboard (4.4): the player is sitting at it now, so the
    # session no longer depends on a foothold and an unplug elsewhere does not end it.
    def settle_session_at_keyboard!(pc_id)
      session = access_sessions[pc_id.to_s]
      return unless session.is_a?(Hash) && session.key?('foothold')

      player_state['sessions'][pc_id.to_s] = session.except('foothold')
      save!
    end

    # A share's access list (4.5): a missing list admits everyone. Game.acl_admits? reads a
    # missing list as nobody, so it is not used for that case.
    def resource_acl_admits?(resource, npc)
      return true if resource['access'].nil?

      self.class.acl_admits?(resource['access'], npc)
    end

    # The rule of 4.5, from server state only: some source the player holds reaches the
    # resource, and the source is allowed. A source is a held foothold (allowed for a
    # resource with no access list) or the PC of a session the player holds (allowed when
    # the list admits the session's identity). A resource with no network is reached by
    # nothing.
    def resource_admits_player?(resource)
      return false unless resource.is_a?(Hash)
      # A listed-only share has nothing to serve, so GET /container answers "not found"
      return false if NetworkModel.listed_only_share?(resource)
      # A resource whose own downIf is truthy is off (5.2): not served, like one on a down
      # network. network_up? below also refuses a resource on a down network (player_reach).
      return false if resource_down?(resource)

      network = resource['network']
      return false unless NetworkModel.present_string?(network)
      # An open share (no access list) is reached by any held foothold whose player_reach
      # includes the resource's network (its own, or a linked network through a pivot).
      if resource['access'].nil? && network_footholds.keys.any? { |fid| player_reach(fid).include?(network) }
        return true
      end

      # A session the player holds at a host whose network reaches the resource's network,
      # whose identity the list admits, opens it from that desktop. An access-listed share
      # maps across the pivot walk over up links (the member-of-staff model); an open share
      # is reached from a session only on its own network, never across a link (m3): a linked
      # open share needs a foothold that pivots to it (the branch above), like every other
      # resource on a linked network.
      open_share = resource['access'].nil?
      access_sessions.any? do |pc_id, session|
        next false unless session.is_a?(Hash)

        info = find_login_pc(pc_id)
        npc = scenario_room_npc(session['id'])
        next false unless info && npc

        # A session at a host whose own service is off reaches nothing through it, at the
        # keyboard or remotely, and a remote session whose route is down (an outage, a lost
        # pivot) serves nothing either (5.2, q72): session_route_up? judges both
        next false unless session_route_up?(pc_id)

        host_net = object_network(info[:object])
        next false unless host_net

        reaches = open_share ? host_net == network : networks_reachable_from(host_net).include?(network)
        reaches && resource_acl_admits?(resource, npc)
      end
    end

    # The file shares a session at this PC maps on its desktop (4.5): every file_share on
    # the PC's network whose access list admits the session's identity, as [[id, resource]].
    # A PC on no network maps none. A listed-only share (NetworkModel.listed_only_share?,
    # no contents or an empty list) is never mapped: the view shows its observations.
    def mapped_shares(pc, npc)
      return [] unless pc.is_a?(Hash) && npc.is_a?(Hash)

      network = object_network(pc)
      return [] unless network

      # Every file_share on a network reachable from the PC's own network over up links (the
      # pivot walk, 5.1), so a finance PC maps an access-listed share on a linked server
      # network as it does for the member of staff. An open share maps only on its own
      # network, never across a link (m3), so a linked open share is not named here without a
      # foothold that pivots to it. Across networks the result is sorted by resource id.
      shares = []
      networks_reachable_from(network).each do |net|
        NetworkModel.resources_on(net, scenario_data).each do |id, resource|
          next unless resource['kind'] == 'file_share' && !NetworkModel.listed_only_share?(resource)
          # A share whose own downIf is truthy is off (5.2): not mapped while down.
          next if resource_down?(resource)

          admit = resource['access'].nil? ? net == network : resource_acl_admits?(resource, npc)
          shares << [id, resource] if admit
        end
      end
      shares.sort_by { |id, _resource| id.to_s }
    end

    # The folder stub for each mapped share, appended to a desktop after the profiles.
    def mapped_share_stubs(pc, npc)
      mapped_shares(pc, npc).map do |id, resource|
        name = resource['name'].presence || id
        host = resource['host']
        label = host.is_a?(String) && !host.empty? ? "#{name} (\\\\#{host}\\#{name})" : name
        { 'id' => id, 'type' => 'network_share', 'name' => label, 'takeable' => false, 'locked' => false, 'hasContents' => true }
      end
    end

    # Where a resource, or an item in one, sits (4.5): { object:, scope:, path:, room_id: nil }
    # with the scope { type: 'resource', id: } for the record itself as well as for what is
    # in it, never a nil scope. Called by login_scope_of after the rooms and profiles. The
    # record is matched on its id only.
    def resource_scope_of(target)
      NetworkModel.resources(scenario_data).each do |resource_id, resource|
        scope = { type: 'resource', id: resource_id }
        return { object: resource, scope: scope, path: [], room_id: nil } if resource_id == target

        Array(resource['contents']).each do |item|
          found = locate_object_in(item, target, scope, [])
          return found.merge(room_id: nil) if found
        end
      end
      nil
    end

    # An item in a resource's contents, matched as find_scenario_object matches.
    def find_resource_item(target_id)
      NetworkModel.resources(scenario_data).each_value do |resource|
        Array(resource['contents']).each do |item|
          found = item.is_a?(Hash) && find_object_in_contents(item, target_id)
          return found if found
        end
      end
      nil
    end

    # A takeable item in a share mapped for the session at this PC (an add from a
    # desktop): { object:, scope:, path: } or nil.
    def find_mapped_share_item(pc, &match)
      npc = session_identity(pc['id'])
      return nil unless npc

      mapped_shares(pc, npc).each do |resource_id, resource|
        found = find_in_tree(resource['contents'], { type: 'resource', id: resource_id }, [], &match)
        return found if found
      end
      nil
    end

    # Is a share mapped for the session at this PC (scope_admitted_by_session?)?
    def share_mapped_at?(resource_id, pc_id)
      info = find_login_pc(pc_id)
      npc = session_identity(pc_id)
      return false unless info && npc

      mapped_shares(info[:object], npc).any? { |id, _resource| id == resource_id.to_s }
    end

    # POST /inventory add with source_resource_id, a share opened from the view (section
    # 5): 1. the rule of 4.5, else the answer for an invented item; 2. the item is in the
    # share; 3. every folder above it is unlocked; 4. it is takeable; 5. its transfer
    # allows the choice. { error: } or { item:, location:, transfer: }.
    def resource_item_for_add(resource_id, item_type, item_id, item_name, transfer)
      unknown = { error: "Item not found in scenario: #{item_type}" }
      resource = NetworkModel.resources(scenario_data)[resource_id.to_s]
      return unknown unless resource && resource_admits_player?(resource)

      scope = { type: 'resource', id: resource_id.to_s }
      found = find_in_tree(resource['contents'], scope, []) { |obj| ItemIdentity.addressed_by?(obj, item_type, item_id, item_name) }
      return unknown unless found

      locked = found[:path].find { |container| container['locked'] && !object_unlocked?(container['id']) }
      return { error: "Container not unlocked: #{locked['id']}" } if locked

      file = found[:object]
      return { error: "Item is not takeable: #{file['name']}" } unless file['takeable']

      choice = transfer.presence || 'move'
      return { error: "Invalid transfer: #{choice}" } unless %w[copy move].include?(choice)

      allowed = file['transfer'].presence || 'both'
      return { error: "This file can only be #{allowed == 'copy' ? 'copied' : 'moved'}" } unless allowed == 'both' || allowed == choice

      { item: file, transfer: choice,
        location: { type: 'resource', resource_id: resource_id.to_s, path: found[:path].map { |c| c['id'] } } }
    end

    # The accounts map of GET /capture_secrets (4.4): { targetId => address } for each
    # credential capture under a declared target id whose address, normalised as usernames
    # are, is a username the account-holder pass would answer (a key of
    # account_capture_passwords). Whatever
    # revealSecret says, and never from the landing-page or single-secret passes. It
    # carries only the address the browser wrote, so it reveals no secret.
    def account_capture_usernames
      earned = player_state.dig('globalVariables', 'se_captures')
      return {} unless earned.is_a?(Hash) && earned.any?

      usernames = account_capture_passwords
      return {} if usernames.empty?

      # As in capture_secrets_for_client, an entry whose target id no capture route declares
      # cannot have been earned (engine plan section 6), so it is skipped here too.
      declared = declared_capture_target_ids
      earned.each_with_object({}) do |(target_id, entry), out|
        next unless entry.is_a?(Hash)
        next if entry['kind'] && entry['kind'] != 'credential'
        next unless declared.include?(target_id.to_s)

        address = entry['address']
        next unless address.is_a?(String) && !address.strip.empty?

        out[target_id] = address.strip if usernames.key?(self.class.normalise_username(address))
      end
    end

    private

    def network_object_in(list, object_id, path)
      return nil unless list.is_a?(Array)

      list.each do |obj|
        next unless obj.is_a?(Hash)
        return { object: obj, path: path } if obj['id'].to_s == object_id
        next if NetworkModel.sign_in_object?(obj)

        found = network_object_in(obj['contents'], object_id, path + [obj])
        return found if found
      end
      nil
    end

    # A device defined as a room object leaves its room's data while planted (4.1). The
    # planted_device? filter hides it as well, so a lost write cannot bring it back.
    def hide_device_in_its_room!(definition)
      info = network_room_object(definition['id'])
      return unless info && info[:object].equal?(definition) && info[:path].empty?

      room_id = info[:room_id]
      player_state['room_states'] ||= {}
      player_state['room_states'][room_id] ||= { 'objects_added' => [], 'objects_removed' => [], 'object_states' => {}, 'npc_states' => {} }
      removed = player_state['room_states'][room_id]['objects_removed'] ||= []
      removed << definition['id'] unless removed.include?(definition['id'])
    end
  end
end
