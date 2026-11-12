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

    # Links (slice 9.3b sub-slice K, docs/achitechture/ACCESS_MODEL_SLICE_9_3B_PLAN.md 5.1).
    # Two in-game networks joined by a link; a link is undirected. networkLinks is a list of
    # two-item lists of network ids; a malformed entry or one naming an undefined network is
    # dropped here (the validator reports it). Returns a list of [a, b] pairs.
    def network_links(data)
      list = data.is_a?(Hash) ? data['networkLinks'] : nil
      return [] unless list.is_a?(Array)

      nets = networks(data)
      list.filter_map do |entry|
        next unless entry.is_a?(Array) && entry.length == 2

        a, b = entry
        next unless present_string?(a) && present_string?(b) && a != b && nets.key?(a) && nets.key?(b)

        [a, b]
      end
    end

    # The networks directly joined to a network by a link (undirected), sorted by id.
    def linked_networks(data, network)
      return [] unless present_string?(network)

      out = []
      network_links(data).each do |a, b|
        out << b if a == network
        out << a if b == network
      end
      out.uniq.sort
    end

    # The cap on how many simple paths reach_paths returns (plan 5.1, open question 6): the
    # validator warns above it. A hard ceiling on the enumeration keeps a dense link graph
    # from a runaway walk on every GET /network.
    REACH_PATHS_CAP = 8
    REACH_PATHS_CEILING = 64

    # Every simple path of network ids from `from` to `to` over the link graph, shortest
    # first and, within one length, ordered by the id list, so the output is stable. Bounded
    # by REACH_PATHS_CEILING to cap the walk; the caller (reach_paths) applies the eight cap.
    def all_reach_paths(data, from, to)
      nets = networks(data)
      return [] unless present_string?(from) && present_string?(to) && nets.key?(from) && nets.key?(to)
      return [[from]] if from == to

      adj = Hash.new { |h, k| h[k] = [] }
      network_links(data).each do |a, b|
        adj[a] << b
        adj[b] << a
      end
      adj.each_value { |v| v.uniq!; v.sort! }

      found = []
      walk = lambda do |path|
        return if found.length >= REACH_PATHS_CEILING

        last = path.last
        if last == to
          found << path
          return
        end
        adj[last].each do |nb|
          next if path.include?(nb)

          walk.call(path + [nb])
        end
      end
      walk.call([from])
      found.sort_by { |p| [p.length, p] }
    end

    # The simple paths reach_paths exposes: all of them, shortest first, capped at eight.
    def reach_paths(data, from, to)
      all_reach_paths(data, from, to).first(REACH_PATHS_CAP)
    end

    # How a station on station_network reaches a resource (4.2), as a list of routes, each a
    # list of condition globals: [[]] is one route with no conditions, [] is no route. A
    # resource with no network is reachable with no condition; one on the station's own
    # network is reached by the station network's own outage condition; one on another
    # network is reached over the links, each route the downIf globals of the networks on one
    # of its simple paths (the station's, every intermediate's and the resource's network,
    # not the resource's own downIf). No path means no route. In sub-slice K no network
    # carries downIf (sub-slice O un-reserves it), so every route is empty; the shape is
    # ready for O. 9.2's NPC-work composer reads this as `routes`.
    def reach_conditions(data, station_network, resource)
      target = resource.is_a?(Hash) ? resource['network'] : nil
      return [[]] unless present_string?(target)
      return [] unless present_string?(station_network)

      paths = reach_paths(data, station_network, target)
      return [] if paths.empty?

      nets = networks(data)
      down_of = lambda do |net_id|
        net = nets[net_id]
        down = net.is_a?(Hash) ? net['downIf'] : nil
        present_string?(down) ? down : nil
      end
      paths.map { |path| path.map { |net_id| down_of.call(net_id) }.compact.uniq }
    end

    # Wi-Fi (slice 9.3b sub-slice W, docs/achitechture/ACCESS_MODEL_SLICE_9_3B_PLAN.md 5.3).
    # The { ssid, psk } block of a network, or nil. It lives on the network and never ships
    # to the browser; psk absent means an open network.
    def wifi_of(data, network_id)
      net = networks(data)[network_id]
      wifi = net.is_a?(Hash) ? net['wifi'] : nil
      wifi.is_a?(Hash) ? wifi : nil
    end

    # Every room object with wifiAp: true whose network defines a wifi block (5.3), as
    # room_objects entries. Several access points may serve one network.
    def wifi_aps(data)
      room_objects(data).select do |entry|
        obj = entry[:object]
        obj.is_a?(Hash) && obj['wifiAp'] == true && present_string?(entry[:network]) &&
          !wifi_of(data, entry[:network]).nil?
      end
    end

    def present_string?(value)
      value.is_a?(String) && !value.strip.empty?
    end
  end
end
