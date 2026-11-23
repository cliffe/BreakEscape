module BreakEscape
  # Network operations, stage S1 (docs/achitechture/OPS_CORE_PLAN.md sections 5.2, 6 and 8): the
  # server side of scanning. A sweep lists the hosts of a discovery network; a host scan lists
  # the services of one host. Included in Game beside NetworkAccess, which keeps the view
  # builders; this file holds the route's model methods and the rows only scanning adds.
  #
  # player_state key (in Game::ACCESS_STATE_DEFAULTS, server-written only, never read from a sync
  # body, never sent whole):
  #   opsDiscovered  { 'networks' => [networkId], 'hosts' => [hostId] }, grow-only, bounded by the
  #                  scenario's networks and 64 hosts. It decides which rows GET /network builds.
  #
  # Discovery changes the view and nothing else (5.2): sign-in, the desktop, shares and the
  # keyring never read opsDiscovered.
  module NetworkOps
    # The one 404 answer (section 6). Built here and nowhere else; no branch adds a field.
    NOT_FOUND_BODY = { success: false, reason: 'not_found' }.freeze

    # The keys a `cli` object may give each kind of row (5.2). Any other key, a `_` note
    # included, is never copied.
    CLI_RANGE_KEYS = %w[range].freeze
    CLI_ADDRESS_KEYS = %w[address].freeze
    CLI_SERVICE_KEYS = %w[protocol service banner].freeze
    SERVICE_KEYS = %w[name label port product version].freeze

    # --- the checks ---------------------------------------------------------------------------

    def ops_not_found
      { status: :not_found, body: NOT_FOUND_BODY.dup }
    end

    def ops_refusal(status, reason)
      { status: status, body: { success: false, reason: reason } }
    end

    def ops_bad_request
      { status: :bad_request, body: { success: false, reason: 'bad_request' } }
    end

    # Is the target listed for this player through this foothold? target is { network: id } or
    # { host: id }. A network: the foothold is held and the network is in its reach. A host of
    # either kind: it exists on such a network and that network is open or swept.
    def ops_listed?(foothold_id, target)
      return false unless target.is_a?(Hash)
      return !ops_listed_host(foothold_id, target[:host]).nil? if target.key?(:host)

      ops_listed_network?(foothold_id, target[:network])
    end

    def ops_listed_network?(foothold_id, network_id)
      ops_foothold_held?(foothold_id) && network_id.is_a?(String) &&
        NetworkModel.networks(scenario_data).key?(network_id) && player_reach(foothold_id).include?(network_id)
    end

    # The host record (NetworkModel.hosts_on) when listed, else nil.
    def ops_listed_host(foothold_id, host_id)
      return nil unless ops_foothold_held?(foothold_id) && host_id.is_a?(String)

      player_reach(foothold_id).to_a.sort.each do |net|
        next unless ops_network_listing?(net)

        record = NetworkModel.hosts_on(net, scenario_data).find { |rec| rec[:id] == host_id }
        return record if record
      end
      nil
    end

    def ops_foothold_held?(foothold_id)
      foothold_id.is_a?(String) && network_footholds[foothold_id].is_a?(Hash)
    end

    # A network lists its hosts when it is open or has been swept.
    def ops_network_listing?(network_id)
      !NetworkModel.discovery?(scenario_data, network_id) || ops_discovered_list('networks').include?(network_id)
    end

    def ops_host_off?(record)
      host_service_off?(record[:object])
    end

    # --- the actions --------------------------------------------------------------------------

    # POST /network/scan with network_id: the sweep. Returns { status:, body: }.
    def scan_network!(foothold_id, network_id)
      return ops_not_found unless ops_listed?(foothold_id, network: network_id)
      return ops_refusal(:unprocessable_entity, 'not_needed') unless NetworkModel.discovery?(scenario_data, network_id)

      already = ops_discovered_list('networks').include?(network_id)
      ops_discover!('networks', network_id) unless already
      # Every sweep writes a row. The first one changed state and saves anyway; a repeat saves
      # only when the helper kept the row.
      result = write_log_row!('network_swept', as: nil, where: { kind: 'network', id: network_id },
                              detail: { 'from' => foothold_id }, save_limit: already)
      save! if !already || result&.stored?

      body = { success: true }
      body[:already] = true if already
      body[:network] = { id: network_id, swept: true, hosts: network_rows(network_id) }
      { status: :ok, body: body }
    end

    # POST /network/scan with host_id: the host scan. Returns { status:, body: }.
    def scan_host!(foothold_id, host_id)
      record = ops_listed_host(foothold_id, host_id)
      return ops_not_found unless record
      return ops_refusal(:forbidden, 'not_responding') if ops_host_off?(record)
      return ops_refusal(:unprocessable_entity, 'not_needed') if record[:services].empty?

      already = ops_discovered_list('hosts').include?(host_id)
      unless already
        ops_discover!('hosts', host_id)
        write_log_row!('host_scanned', as: nil, where: { kind: record[:kind] == 'pc' ? 'pc' : 'host', id: host_id },
                                       detail: { 'from' => foothold_id })
        save!
      end

      body = { success: true }
      body[:already] = true if already
      body[:host] = ops_host_row(record)
      { status: :ok, body: body }
    end

    # --- state --------------------------------------------------------------------------------

    def ops_discovered
      held = player_state.is_a?(Hash) ? player_state['opsDiscovered'] : nil
      held.is_a?(Hash) ? held : {}
    end

    # A missing or malformed list reads as empty.
    def ops_discovered_list(key)
      list = ops_discovered[key]
      list.is_a?(Array) ? list : []
    end

    # Adds an id to one list, creating the list; the other lists are kept.
    def ops_discover!(key, id)
      held = ops_discovered.dup
      held[key] = ops_discovered_list(key) + [id]
      player_state['opsDiscovered'] = held
    end

    # --- rows ---------------------------------------------------------------------------------

    # A host row for a host the player can see, of either kind, as GET /network lists it.
    def ops_host_row(record)
      record[:kind] == 'pc' ? host_row(record[:object]) : ops_device_row(record)
    end

    # The row of a host with no sign-in: { id, kind: 'device', name, sprite?, responding? },
    # plus address, scanned and services by the same rules as a PC's row.
    def ops_device_row(record)
      entry = record[:object]
      row = { 'id' => record[:id], 'kind' => 'device', 'name' => entry['name'] }
      row['sprite'] = entry['sprite'] if entry['sprite'].present?
      row['responding'] = false if host_service_off?(entry)
      ops_add_host_fields!(row, record[:id], record[:network], record[:services])
    end

    # The fields a host row gains from discovery: `address` when its network lists it, and
    # `scanned` with `services` once scanned. Changes and answers row.
    def ops_add_host_fields!(row, host_id, network_id, services)
      address = ops_host_address(host_id, network_id)
      row['address'] = address if address
      if ops_discovered_list('hosts').include?(host_id) && services.any?
        row['scanned'] = true
        row['services'] = services.map { |svc| ops_service_row(svc) }
      end
      row
    end

    # `address` from networks.<id>.cli.hosts.<hostId>, only when the host's own network lists
    # it (open, or swept). nil when not authored or not yet listed.
    def ops_host_address(host_id, network_id)
      return nil unless network_id && ops_network_listing?(network_id)

      cli = ops_dig(NetworkModel.networks(scenario_data)[network_id], 'cli', 'hosts', host_id)
      ops_cli_copy(cli, CLI_ADDRESS_KEYS)&.[]('address')
    end

    def ops_service_row(service)
      row = {}
      SERVICE_KEYS.each { |key| row[key] = service[key] unless service[key].nil? }
      cli = ops_cli_copy(service['cli'], CLI_SERVICE_KEYS)
      row['cli'] = cli if cli
      row
    end

    # The fields a network block gains (5.2): `cli: { range }` where authored; `swept` on a
    # discovery network; `ops: true` when a host there declares services, only on an open or a
    # swept network. A block of a network with none of these gains nothing.
    def ops_block_fields(network_id, with_ops: true)
      fields = {}
      cli = ops_cli_copy(NetworkModel.networks(scenario_data).dig(network_id, 'cli'), CLI_RANGE_KEYS)
      fields['cli'] = cli if cli
      fields['swept'] = ops_discovered_list('networks').include?(network_id) if NetworkModel.discovery?(scenario_data, network_id)
      if with_ops && ops_network_listing?(network_id) &&
         NetworkModel.hosts_on(network_id, scenario_data).any? { |rec| rec[:services].any? }
        fields['ops'] = true
      end
      fields
    end

    # The rows of the PCs the player holds a session on, on a network that lists no host yet.
    def ops_held_session_rows(network_id)
      held = view_session_hosts.select { |h| h[:net] == network_id }.map { |h| h[:pc_id] }
      NetworkModel.sign_in_objects_on(network_id, scenario_data).select { |entry| held.include?(entry[:object]['id'].to_s) }
                  .map { |entry| host_row(entry[:object]) }
    end

    # The device rows of a network's view: none until the network lists its hosts.
    def ops_device_rows(network_id)
      return [] unless ops_network_listing?(network_id)

      NetworkModel.hosts_on(network_id, scenario_data).select { |rec| rec[:kind] == 'device' }.map { |rec| ops_device_row(rec) }
    end

    # Copies the named keys of a `cli` object, never the object: only non-empty strings, and
    # nil when none is left, so an answer never carries `{}` or `null`.
    def ops_cli_copy(cli, keys)
      return nil unless cli.is_a?(Hash)

      out = {}
      keys.each { |key| out[key] = cli[key] if cli[key].is_a?(String) && !cli[key].empty? }
      out.empty? ? nil : out
    end

    # dig that stops at anything that is not a Hash instead of raising.
    def ops_dig(node, *path)
      path.each do |key|
        return nil unless node.is_a?(Hash)

        node = node[key]
      end
      node
    end
  end
end
