# frozen_string_literal: true

# Under Rails the autoloader finds DeclaredGrants; the validator loads it by path.
require_relative 'declared_grants' unless defined?(BreakEscape::DeclaredGrants)

module BreakEscape
  # Networks (docs/achitechture/ACCESS_MODEL_SLICE_9_3_PLAN.md, sections 3 and 4.2): which
  # networks a scenario defines, which room objects are on each, the jacks, the hosts and
  # resources a network exposes, where a rogue device can come from, and what reaches what.
  #
  # The server (NetworkAccess), the validator and the dungeon graph all read these rules,
  # so they agree, as AccessIdentities does for identities.
  #
  # Plain Ruby, no ActiveSupport, so scripts/validate_scenario.rb and
  # scripts/generate_dungeon_graph.rb can require_relative it.
  module NetworkModel
    module_function

    # { networkId => { 'name' => ... } }, only the entries that are hashes.
    def networks(data)
      nets = data.is_a?(Hash) ? data['networks'] : nil
      return {} unless nets.is_a?(Hash)

      nets.select { |_id, net| net.is_a?(Hash) }
    end

    # { resourceId => resource }, only the entries that are hashes.
    def resources(data)
      res = data.is_a?(Hash) ? data['resources'] : nil
      return {} unless res.is_a?(Hash)

      res.select { |_id, resource| resource.is_a?(Hash) }
    end

    # An object's own network, else its room's default, else nil (3.2).
    def network_of(object, room = nil)
      own = object.is_a?(Hash) ? object['network'] : nil
      return own if present_string?(own)

      default = room.is_a?(Hash) ? room['network'] : nil
      present_string?(default) ? default : nil
    end

    def sign_in_object?(obj)
      obj.is_a?(Hash) && obj['lockType'] == 'login'
    end

    def jack?(obj)
      obj.is_a?(Hash) && obj['networkJack'] == true
    end

    def headless?(obj)
      obj.is_a?(Hash) && obj['headless'] == true
    end

    def rogue_device?(item)
      item.is_a?(Hash) && item['rogueDevice'] == true
    end

    # A resource holds something only when its contents are a non-empty list; nil, a
    # missing key and [] all mean none. The view shows the observations of a resource
    # with no contents.
    def resource_contents?(resource)
      resource.is_a?(Hash) && resource['contents'].is_a?(Array) && !resource['contents'].empty?
    end

    # A file share with no contents is listed only (4.5): the view shows its row with Look
    # and its observations, no desktop maps it, and nothing can be opened or taken from it.
    def listed_only_share?(resource)
      resource.is_a?(Hash) && resource['kind'] == 'file_share' && !resource_contents?(resource)
    end

    # [{ object:, room:, room_id:, path:, network: }] for every room object, in scenario
    # order, recursing into containers' contents. Nothing under a sign-in object is listed:
    # a sign-in PC's contents are its desktop, not objects in the room. NPCs' items are
    # not room objects.
    def room_objects(data)
      out = []
      rooms = data.is_a?(Hash) ? data['rooms'] : nil
      return out unless rooms.is_a?(Hash)

      walk = lambda do |list, room_id, room, path, container|
        next unless list.is_a?(Array)

        list.each_with_index do |obj, idx|
          next unless obj.is_a?(Hash)

          here = "#{path}[#{idx}]"
          out << { object: obj, room: room, room_id: room_id, path: here,
                   network: network_of(obj, room), container: container }
          walk.call(obj['contents'], room_id, room, "#{here}/contents", obj) unless sign_in_object?(obj)
        end
      end
      rooms.each do |room_id, room|
        next unless room.is_a?(Hash)

        walk.call(room['objects'], room_id, room, "rooms/#{room_id}/objects", nil)
      end
      out
    end

    # Every room object with networkJack: true, with its network (which may be nil: the
    # validator reports that; the server refuses to plant there).
    def jacks(data)
      room_objects(data).select { |entry| jack?(entry[:object]) }
    end

    # The sign-in objects on a network, sorted by id (3.4). Not scenario order: the
    # server stores scenario_data as jsonb, which keeps object keys sorted by length then
    # bytes, so the order rooms were written in is gone by the time the server reads them.
    # Sorting by id gives the server, the validator and the dungeon graph one order an
    # author can predict.
    def sign_in_objects_on(network_id, data)
      return [] unless present_string?(network_id)

      found = room_objects(data).select { |entry| sign_in_object?(entry[:object]) && entry[:network] == network_id }
      sort_by_id(found) { |entry| entry[:object]['id'] }
    end

    # [[resourceId, resource]] on a network, sorted by id as the sign-in objects are. A
    # resource with no network is never listed (3.4). A view lists hosts before resources.
    def resources_on(network_id, data)
      return [] unless present_string?(network_id)

      found = resources(data).select { |_id, resource| resource['network'] == network_id }.to_a
      sort_by_id(found, &:first)
    end

    # Sorted by the id the block returns, as a string; equal ids keep their order.
    def sort_by_id(list)
      list.each_with_index.sort_by { |item, idx| [yield(item).to_s, idx] }.map(&:first)
    end

    # Every definition of a rogue device (3.3): [{ item:, home:, path: }] where home is
    # 'room', 'container', 'start', 'npc' or 'grant'. Only items with an id count.
    def rogue_device_definitions(data)
      out = []
      return out unless data.is_a?(Hash)

      add = lambda do |item, home, path|
        out << { item: item, home: home, path: path } if rogue_device?(item) && present_string?(item['id'])
      end

      room_objects(data).each do |entry|
        add.call(entry[:object], entry[:container] ? 'container' : 'room', entry[:path])
      end

      start = data['startItemsInInventory']
      if start.is_a?(Array)
        start.each_with_index { |item, idx| add.call(item, 'start', "startItemsInInventory[#{idx}]") }
      end

      rooms = data['rooms'].is_a?(Hash) ? data['rooms'] : {}
      rooms.each do |room_id, room|
        next unless room.is_a?(Hash) && room['npcs'].is_a?(Array)

        room['npcs'].each_with_index do |npc, i|
          next unless npc.is_a?(Hash) && npc['itemsHeld'].is_a?(Array)

          npc['itemsHeld'].each_with_index do |item, j|
            add.call(item, 'npc', "rooms/#{room_id}/npcs[#{i}]/itemsHeld[#{j}]")
          end
        end
      end

      DeclaredGrants.for(data).each { |grant| add.call(grant['item'], 'grant', grant['path']) }
      out
    end

    # Every grant_foothold action the server can honour (slice 9.3b sub-slice I, 5.5).
    # Walks the scenario and keeps a grant_foothold only where DeclaredGrants.executed?
    # says the path is server-run (a timers entry's actions, an object's triggerOnInteract,
    # onInteract.actions, conditionalActions, or an onConfirm whose own path is server-run),
    # the same test the validator uses, so "declared" means one thing in both places. Each
    # entry: { pc:, shape: 'dropped' | 'session', needs_dropped:, needs_held:, name:, path: }.
    # Built beside the rogue-device walk, not inside DeclaredGrants.for (whose { path, item }
    # contract for give_item must stay untouched).
    def grant_foothold_actions(data)
      out = []
      return out unless data.is_a?(Hash)

      walk = lambda do |node, keys|
        case node
        when Hash
          if node['type'] == 'grant_foothold' && DeclaredGrants.executed?(keys)
            shape = node['needsSession'] ? 'session' : 'dropped'
            out << { pc: node['pc'].to_s, shape: shape, needs_dropped: node['needsDropped'],
                     needs_held: node['needsHeld'], name: node['name'], path: DeclaredGrants.path_string(keys) }
          end
          node.each { |k, v| walk.call(v, keys + [k.to_s]) }
        when Array
          node.each_with_index { |v, i| walk.call(v, keys + [i]) }
        end
      end
      walk.call(data, [])
      out
    end

    # How a station on station_network reaches a resource (4.2), as a list of routes, each
    # a list of conditions: [[]] is one route with no conditions, [] is no route. In 9.3a
    # a resource with no network, or on the station's own network, is reachable; anything
    # else is not. 9.3b extends the answer with links and outages, read from data.
    def reach_conditions(data, station_network, resource)
      _ = data
      target = resource.is_a?(Hash) ? resource['network'] : nil
      return [[]] unless present_string?(target)
      return [[]] if present_string?(station_network) && station_network == target

      []
    end

    def present_string?(value)
      value.is_a?(String) && !value.strip.empty?
    end
  end
end
