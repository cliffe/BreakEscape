# frozen_string_literal: true

# Under Rails the autoloader finds DeclaredGrants; the validator loads it by path.
require_relative 'declared_grants' unless defined?(BreakEscape::DeclaredGrants)
# Step 2b: author_notes (and, through it, scenario_schema) so grant_foothold_actions skips notes.
require_relative 'author_notes' unless defined?(BreakEscape::AuthorNotes)

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

      # Step 2b: walk the live scenario (AuthorNotes.each_live skips "_" notes and visits free
      # data in full), so a grant_foothold an author parked in a note never widens the server's
      # allow list, while a grant inside a minigame's action list (free data) is still honoured.
      AuthorNotes.each_live(data, ScenarioSchema.root) do |node, _snode, keys|
        next unless node.is_a?(Hash) && node['type'] == 'grant_foothold' && DeclaredGrants.executed?(keys)

        shape = node['needsSession'] ? 'session' : 'dropped'
        out << { pc: node['pc'].to_s, shape: shape, needs_dropped: node['needsDropped'],
                 needs_held: node['needsHeld'], name: node['name'], path: DeclaredGrants.path_string(keys) }
      end
      out
    end

    # How a station on station_network reaches a resource (4.2), as a list of routes, each a
    # list of condition globals: [[]] is one route with no conditions, [] is no route. A
    # resource with no network is reachable with no condition; one on the station's own
    # network is reached by the station network's own outage condition; one on another
    # network is reached over the links, each route the offWhen conditions of the networks on
    # one of its simple paths (the station's, every intermediate's and the resource's network,
    # not the resource's own offWhen). No path means no route. In sub-slice K no network
    # carries an outage (sub-slice O un-reserves it), so every route is empty; the shape is
    # ready for O. 9.2's NPC-work composer reads this as `routes`.
    def reach_conditions(data, station_network, resource)
      target = resource.is_a?(Hash) ? resource['network'] : nil
      return [[]] unless present_string?(target)
      return [] unless present_string?(station_network)

      paths = reach_paths(data, station_network, target)
      return [] if paths.empty?

      nets = networks(data)
      # Format 1 (step 8a): a route is a list of the outage conditions of the networks on its
      # path, each in the requireGlobal form the network's own offWhen carries. A bare name (every
      # corpus network) stays a String; the { name: value } form is kept whole, so a network that
      # is down under either form is down on a link route too, evaluated the same way as
      # network_up? (AccessWork.globals_hold?). A network with no outage contributes nothing.
      down_of = lambda do |net_id|
        net = nets[net_id]
        down = net.is_a?(Hash) ? net['offWhen'] : nil
        case down
        when String then down.strip.empty? ? nil : down
        when Hash then down.empty? ? nil : down
        end
      end
      paths.map { |path| path.map { |net_id| down_of.call(net_id) }.compact.uniq }
    end

    # Outages (slice 9.3b sub-slice O, docs/achitechture/ACCESS_MODEL_SLICE_9_3B_PLAN.md 5.2).
    # This is the single Ruby truthy source: AccessWork.truthy_global? delegates here,
    # and slice 9.2's npc-work.js `truthy` mirrors it on the client, so the server, the browser
    # and the validator decide an outage the same way. True unless the value is one of the
    # globals-relevant falsy forms: false, nil, 0, "" and a missing key (read as nil) are
    # falsy; everything else, the string "false" included, is truthy. 0.0 is falsy too, through
    # Ruby's 0.0 == 0 (and JS's 0.0 === 0), not a clause of its own. It is the globals-relevant
    # subset of JavaScript's rule: a scenario global is never NaN or undefined.
    def truthy?(value)
      !(value.nil? || value == false || value == 0 || value == '')
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

    # Ops core S1 (docs/achitechture/OPS_CORE_PLAN.md 5.1). Hosts, discovery and services.
    # SERVICES_PER_HOST is the schema's maxItems; services_of reads no more than that.
    SERVICES_PER_HOST = 8

    # { hostId => entry } for the top-level `hosts` map (hosts with no sign-in), only the
    # entries that are hashes. Notes (keys starting `_`) are not hosts.
    def hosts(data)
      map = data.is_a?(Hash) ? data['hosts'] : nil
      return {} unless map.is_a?(Hash)

      map.select { |id, entry| entry.is_a?(Hash) && !(id.is_a?(String) && id.start_with?('_')) }
    end

    # True when the network is a discovery network (`discovery: "scan"`); false for "open",
    # an absent key, any other value and an unknown network.
    def discovery?(data, network_id)
      net = networks(data)[network_id]
      net.is_a?(Hash) && net['discovery'] == 'scan'
    end

    # One record per host on a network, of either kind, sorted by id:
    # { id:, kind: 'pc' | 'device', object:, network:, services: }. A 'pc' is a sign-in
    # room object (object: the room object); a 'device' is a `hosts` entry (object: the
    # entry). A `hosts` entry whose network is not a `networks` key is left out. An id
    # held by both kinds (the validator refuses it) lists the sign-in object.
    def hosts_on(network_id, data)
      return [] unless present_string?(network_id) && networks(data).key?(network_id)

      out = sign_in_objects_on(network_id, data).map do |entry|
        obj = entry[:object]
        { id: obj['id'], kind: 'pc', object: obj, network: network_id, services: services_of(obj) }
      end
      taken = out.map { |rec| rec[:id] }
      hosts(data).each do |id, entry|
        next unless entry['network'] == network_id && !taken.include?(id)

        out << { id: id, kind: 'device', object: entry, network: network_id, services: services_of(entry) }
      end
      sort_by_id(out) { |rec| rec[:id] }
    end

    # The services a host declares, at most SERVICES_PER_HOST, malformed entries (not a hash)
    # skipped, never raised on. Takes a host record from hosts_on, a room object or a
    # `hosts` entry.
    def services_of(host)
      host = host[:object] if host.is_a?(Hash) && host.key?(:object)
      list = host.is_a?(Hash) ? host['services'] : nil
      return [] unless list.is_a?(Array)

      list.select { |svc| svc.is_a?(Hash) }.first(SERVICES_PER_HOST)
    end

    # Ops core S2 (OPS_CORE_PLAN.md 5.1). Weaknesses and decoys of services, at most
    # FINDINGS_PER_LIST of each kind per service (the schema's maxItems); a malformed entry
    # (not a hash, or with no usable id) is skipped, never raised on.
    FINDINGS_PER_LIST = 4

    # A finding id is built, never authored: three ids joined by dots.
    def finding_id(host_id, service_name, id)
      "#{host_id}.#{service_name}.#{id}"
    end

    # Every weakness of every service of every host, sorted by finding id, each
    # { finding_id:, host_id:, host: <hosts_on record>, service_name:, service:, kind: 'weakness', id:, entry: }.
    def weaknesses(data)
      service_findings(data, 'weaknesses', 'weakness')
    end

    # The same for decoys (kind: 'decoy').
    def decoys(data)
      service_findings(data, 'decoys', 'decoy')
    end

    # Every host record of every network, in network then id order.
    def hosts_on_all(data)
      networks(data).keys.flat_map { |net_id| hosts_on(net_id, data) }
    end

    def service_findings(data, key, kind)
      out = []
      networks(data).each_key do |net_id|
        hosts_on(net_id, data).each do |rec|
          rec[:services].each do |svc|
            findings_in(rec[:id], svc, key, kind).each { |found| out << found.merge(host: rec) }
          end
        end
      end
      out.sort_by { |rec| rec[:finding_id] }
    end

    # The weaknesses and decoys of one service of a host (by host id), together, sorted by finding id:
    # { finding_id:, host_id:, service_name:, service:, kind:, id:, entry: }. The one reader the
    # server's finding builder uses, so a decoy and a weakness are read the same way.
    def findings_of(host_id, service)
      # One record per finding id, a weakness before a decoy of the same id (sort_by is not stable), so
      # a scenario that was never validated still reads the same way every time.
      (findings_in(host_id, service, 'weaknesses', 'weakness') + findings_in(host_id, service, 'decoys', 'decoy'))
        .uniq { |rec| rec[:finding_id] }.sort_by { |rec| rec[:finding_id] }
    end

    def findings_in(host_id, svc, key, kind)
      return [] unless svc.is_a?(Hash) && present_string?(svc['name']) && svc[key].is_a?(Array)

      svc[key].select { |entry| entry.is_a?(Hash) && present_string?(entry['id']) }.first(FINDINGS_PER_LIST).map do |entry|
        { finding_id: finding_id(host_id, svc['name'], entry['id']), host_id: host_id,
          service_name: svc['name'], service: svc, kind: kind, id: entry['id'], entry: entry }
      end
    end

    # Ops core S3 (OPS_CORE_PLAN.md 4.3 and 5.1). The technique card registry and the cards that
    # carry its keys. A malformed entry is skipped, never raised on.

    # { techniqueId => entry } for the top-level `techniques` map: hashes only, `_` notes skipped.
    def techniques(data)
      map = data.is_a?(Hash) ? data['techniques'] : nil
      return {} unless map.is_a?(Hash)

      map.select { |id, entry| entry.is_a?(Hash) && !(id.is_a?(String) && id.start_with?('_')) }
    end

    # Can this registry entry be used on this weakness of this service? `technique` is the entry
    # (with its `worksOn`), `service` the service hash, `weakness` the weakness hash. The class must
    # be equal; the product must equal the service's product when `worksOn` gives one; the service's
    # version must be in the `versions` list when it gives one. No version comparison.
    def technique_matches?(technique, service, weakness)
      works = technique.is_a?(Hash) ? technique['worksOn'] : nil
      return false unless works.is_a?(Hash) && service.is_a?(Hash) && weakness.is_a?(Hash)
      return false unless present_string?(works['class']) && works['class'] == weakness['class']
      return false if works.key?('product') && works['product'] != service['product']
      return false if works.key?('versions') &&
                      !(works['versions'].is_a?(Array) && works['versions'].include?(service['version']))

      true
    end

    # Every item carrying `technique_card`, where an item can be: [{ item:, home:, path: }], home one
    # of 'room', 'container', 'start', 'npc', 'share', 'grant'. Found the way rogue_device_definitions
    # finds devices, plus a share's `contents`; a container item's own `contents` are walked too.
    # Items inside a sign-in PC's desktop are not listed (a card is a tray item, not a desktop file).
    def technique_items(data)
      out = []
      return out unless data.is_a?(Hash)

      add = lambda do |item, home, path|
        out << { item: item, home: home, path: path } if item.is_a?(Hash) && item.key?('technique_card')
      end
      walk = lambda do |list, home, path|
        next unless list.is_a?(Array)

        list.each_with_index do |item, idx|
          next unless item.is_a?(Hash)

          add.call(item, home, "#{path}[#{idx}]")
          walk.call(item['contents'], home, "#{path}[#{idx}]/contents")
        end
      end

      room_objects(data).each do |entry|
        add.call(entry[:object], entry[:container] ? 'container' : 'room', entry[:path])
      end
      walk.call(data['startItemsInInventory'], 'start', 'startItemsInInventory')
      rooms = data['rooms'].is_a?(Hash) ? data['rooms'] : {}
      rooms.each do |room_id, room|
        next unless room.is_a?(Hash) && room['npcs'].is_a?(Array)

        room['npcs'].each_with_index do |npc, i|
          walk.call(npc['itemsHeld'], 'npc', "rooms/#{room_id}/npcs[#{i}]/itemsHeld") if npc.is_a?(Hash)
        end
      end
      resources(data).each do |id, resource|
        walk.call(resource['contents'], 'share', "resources/#{id}/contents") if resource.is_a?(Hash)
      end
      DeclaredGrants.for(data).each { |grant| add.call(grant['item'], 'grant', grant['path']) }
      out
    end

    def present_string?(value)
      value.is_a?(String) && !value.strip.empty?
    end
  end
end
