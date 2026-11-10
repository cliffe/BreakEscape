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

    # Ends every session opened through this foothold (4.1, an unplug); returns their
    # PC ids. The caller saves.
    def end_sessions_through!(foothold_id)
      sessions = player_state['sessions'].is_a?(Hash) ? player_state['sessions'] : {}
      ended = sessions.select { |_pc_id, session| session.is_a?(Hash) && session['foothold'] == foothold_id }.keys
      player_state['sessions'] = sessions.except(*ended)
      ended
    end

    def link_item_id(foothold_id)
      "netlink_#{foothold_id}"
    end

    # The link item for a held foothold, in exactly the shape of 4.1.
    def link_item_for(foothold_id)
      foothold = network_footholds[foothold_id] || {}
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

    # Every held foothold for GET /scenario: no hosts (section 6).
    def footholds_for_client
      held_foothold_ids.map { |id| foothold_for_client(id) }
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
        foothold_for_client(id).merge('hosts' => network_rows(network_footholds[id]['network']))
      end
      { status: :ok, body: { footholds: footholds } }
    end

    # The rows of a network's view: each sign-in host, then each resource, in scenario order.
    def network_rows(network_id)
      hosts = NetworkModel.sign_in_objects_on(network_id, scenario_data).map { |entry| host_row(entry[:object]) }
      hosts + NetworkModel.resources_on(network_id, scenario_data).map { |id, resource| resource_row(id, resource) }
    end

    # A sign-in PC's label on the network (3.2).
    def host_label(pc)
      pc['host'].presence || pc['name']
    end

    # The PC's policy turns remote sign-in off (3.4).
    def remote_blocked?(pc)
      effective_policy(pc)['remote'] == 'blocked'
    end

    def host_row(pc)
      remote = !remote_blocked?(pc)
      row = { 'id' => pc['id'], 'kind' => 'pc', 'name' => pc['name'], 'host' => host_label(pc),
              'sprite' => pc['sprite'].presence || 'pc_desktop', 'headless' => NetworkModel.headless?(pc),
              'remoteSignIn' => remote }
      session = access_sessions[pc['id'].to_s]
      # A claimed session is physical and not offered over the network (4.3)
      if remote && session.is_a?(Hash) && session['via'] == 'password'
        npc = scenario_room_npc(session['id'])
        if npc && self.class.account_holder?(npc)
          row['session'] = { 'username' => npc['creds']['username'], 'displayName' => npc['displayName'] || npc['id'],
                             'via' => 'password', 'remote' => session['foothold'].present? }
        end
      end
      row
    end

    def resource_row(resource_id, resource)
      row = { 'id' => resource_id, 'kind' => resource['kind'], 'name' => resource['name'], 'host' => resource['host'],
              'open' => resource['access'].nil? }
      row['observations'] = resource['observations'] if resource['contents'].nil? && resource['observations'].present?
      row
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
