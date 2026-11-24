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
  #                  S2 adds `services`: ["<hostId>.<serviceName>"], the services checked.
  #   opsFindings    { "<findingId>" => "<u|c|f><n>" } (S2): the findings the player holds, the
  #                  letter its status (unconfirmed, confirmed, false) and n its alias number
  #                  (alias "f<n>", given in the order found, kept in the value because the JSON
  #                  column does not keep key order). Findings ride on host rows.
  #   opsUsed        [findingId] (S3): the findings a technique grant has been given for, once each.
  #                  The keyring's technique_card proof reads it. Server-owned, never synced.
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

    # S2: the player's own finding state. A stored value is a status letter and an alias number.
    FINDING_VALUE = /\A([ucf])([0-9]{1,4})\z/.freeze
    FINDING_STATUS = { 'u' => 'unconfirmed', 'c' => 'confirmed', 'f' => 'false' }.freeze
    # The catalog entry keys a finding's `cli` may copy (5.3), in this order, by name only: never a
    # `_` note, never the link id, never the entry as a whole.
    CLI_FINDING_KEYS = %w[title module script advisories output].freeze
    CLI_LIST_KEYS = %w[advisories output].freeze
    # What the view shows for a finding with no authored summary: one plain line per class.
    CLASS_SUMMARIES = {
      'default_creds' => 'A factory or default account may still be accepted.',
      'unpatched' => 'The service may be running an out-of-date build.',
      'misconfig' => 'A setting may have been left in an unsafe state.',
      'weak_auth' => 'The sign-in protection may be weak.',
      'cleartext' => 'Information may be sent without protection.'
    }.freeze

    # --- the checks ---------------------------------------------------------------------------

    def ops_not_found
      { status: :not_found, body: NOT_FOUND_BODY.dup }
    end

    def ops_refusal(status, reason)
      { status: status, body: { success: false, reason: reason } }
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
      result = ops_write_scan_row!('network_swept', foothold_id, { kind: 'network', id: network_id }, save_limit: already)
      save! if !already || result&.stored?

      body = { success: true }
      body[:already] = true if already
      body[:network] = { id: network_id, swept: true, hosts: network_rows(network_id, foothold_id) }
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
        ops_write_scan_row!('host_scanned', foothold_id, { kind: record[:kind] == 'pc' ? 'pc' : 'host', id: host_id })
        save!
      end

      body = { success: true }
      body[:already] = true if already
      body[:host] = ops_host_row(record, foothold_id)
      { status: :ok, body: body }
    end

    # The row of a scan. A row stores a foothold id of at most 40 characters; a built foothold id
    # (jack_, wifi_ or implant_ plus an authored id) can be longer, and the validator refuses that
    # in a scenario with logSources. Should one get here anyway, the row is not written (the guard
    # would raise in test and development, a 500) and the scan itself still succeeds.
    def ops_write_scan_row!(event, foothold_id, where, save_limit: false)
      return nil unless foothold_id.match?(OpsLogEvents::ID_PATTERN)

      write_log_row!(event, as: nil, where: where, detail: { 'from' => foothold_id }, save_limit: save_limit)
    end

    # --- S2: check and confirm ----------------------------------------------------------------

    # POST /network/check: records the service as checked and adds a finding, with the next alias, for
    # each weakness not fixed and each decoy the player does not hold yet (section 5.3). Returns
    # { status:, body: }.
    def check_service!(foothold_id, host_id, service_name)
      record = ops_listed_host(foothold_id, host_id)
      return ops_not_found unless record && ops_discovered_list('hosts').include?(host_id)

      service = record[:services].find { |svc| svc['name'] == service_name }
      return ops_not_found unless service
      return ops_refusal(:forbidden, 'not_responding') if ops_host_off?(record)

      key = "#{host_id}.#{service_name}"
      first = !ops_discovered_list('services').include?(key)
      ops_discover!('services', key) if first
      added = ops_add_findings!(host_id, service)
      if first
        write_log_row!('service_checked', as: nil, where: ops_where(record), detail: { 'service' => service_name })
      end
      save! if first || added.any?

      body = { success: true, hostId: host_id, service: service_name }
      body[:already] = true if !first && added.empty?
      body[:findings] = ops_service_findings(host_id, service)
      { status: :ok, body: body }
    end

    # POST /network/confirm: settles a held finding (free). A weakness becomes confirmed and a decoy
    # false. Returns { status:, body: }.
    def confirm_finding!(foothold_id, finding_id)
      found, record = ops_finding_reach(foothold_id, finding_id)
      return ops_not_found unless found
      return ops_refusal(:forbidden, 'not_responding') if ops_host_off?(record)

      letter, number = ops_finding_value(finding_id)
      settled = letter != 'u'
      unless settled
        letter = found[:kind] == 'weakness' ? 'c' : 'f'
        ops_set_finding!(finding_id, letter, number)
        write_log_row!('finding_confirmed', as: nil, where: ops_where(record),
                                            detail: { 'finding' => "f#{number}", 'status' => FINDING_STATUS[letter] })
        save!
      end

      body = { success: true }
      body[:already] = true if settled
      body[:finding] = ops_finding_row(found, letter, number)
      { status: :ok, body: body }
    end

    # The one preamble of confirm and use_technique! (the first 404): the held finding and its host
    # record, only when the finding is held and its host is listed through the foothold; else nil.
    def ops_finding_reach(foothold_id, finding_id)
      found = ops_held_finding(finding_id)
      return nil unless found

      record = ops_listed_host(foothold_id, found[:host_id])
      record ? [found, record] : nil
    end

    # The log place of a host record: a sign-in host is a pc, anything else a host.
    def ops_where(record)
      { kind: record[:kind] == 'pc' ? 'pc' : 'host', id: record[:id] }
    end

    # --- S2: findings state -------------------------------------------------------------------

    def ops_findings
      held = player_state.is_a?(Hash) ? player_state['opsFindings'] : nil
      held.is_a?(Hash) ? held : {}
    end

    # [letter, alias number] of a held finding, or nil (a missing or malformed value is not held).
    def ops_finding_value(finding_id)
      match = FINDING_VALUE.match(ops_findings[finding_id].to_s)
      match && [match[1], match[2].to_i]
    end

    def ops_set_finding!(finding_id, letter, number)
      player_state['opsFindings'] = ops_findings.merge(finding_id => "#{letter}#{number}")
    end

    # One more than the highest alias number held.
    def ops_next_alias_number
      ops_findings.each_value.filter_map { |value| FINDING_VALUE.match(value.to_s)&.[](2)&.to_i }.max.to_i + 1
    end

    # The authored record of a held finding id (NetworkModel.findings_of shape, with host_id), or nil
    # when the id is not held or names nothing in the scenario.
    def ops_held_finding(finding_id)
      return nil unless finding_id.is_a?(String) && ops_finding_value(finding_id)

      NetworkModel.hosts_on_all(scenario_data).each do |rec|
        rec[:services].each do |svc|
          found = NetworkModel.findings_of(rec[:id], svc).find { |f| f[:finding_id] == finding_id }
          return found if found
        end
      end
      nil
    end

    # Adds an unconfirmed entry, with the next alias, for each weakness not fixed and each decoy of
    # the service that has no entry yet. Answers the finding ids added.
    def ops_add_findings!(host_id, service)
      globals = frustration_globals
      added = []
      NetworkModel.findings_of(host_id, service).each do |found|
        next if ops_finding_value(found[:finding_id])
        next if found[:kind] == 'weakness' && ops_fixed?(found[:entry], globals)

        ops_set_finding!(found[:finding_id], 'u', ops_next_alias_number)
        added << found[:finding_id]
      end
      added
    end

    # fixedIf holds now (the requireGlobal form, read as offWhen is).
    def ops_fixed?(entry, globals = nil)
      cond = entry['fixedIf']
      return false unless BreakEscape::AccessWork.off_when_present?(cond)

      BreakEscape::AccessWork.globals_hold?(cond, globals || frustration_globals)
    end

    # --- S2: the finding builder --------------------------------------------------------------

    # The findings the player holds on one service, built by the one builder, in finding id order.
    def ops_service_findings(host_id, service)
      NetworkModel.findings_of(host_id, service).filter_map do |found|
        letter, number = ops_finding_value(found[:finding_id])
        ops_finding_row(found, letter, number) if letter
      end
    end

    # The findings the player holds on a host, across its services, in finding id order.
    def ops_host_findings(host_id, services)
      services.flat_map { |svc| ops_service_findings(host_id, svc) }.sort_by { |row| row['id'] }
    end

    # The one builder of a finding, for a weakness and a decoy alike: the same keys in the same order,
    # so nothing tells them apart before the confirm (section 5.3). A confirmed weakness gains `needs`
    # (and `fixed: true` while its fixedIf holds); a decoy that was confirmed false gains
    # `falseBecause`.
    def ops_finding_row(found, letter, number)
      entry = found[:entry]
      row = { 'id' => found[:finding_id], 'alias' => "f#{number}", 'hostId' => found[:host_id],
              'service' => found[:service_name], 'class' => entry['class'], 'severity' => entry['severity'],
              'summary' => ops_finding_summary(entry), 'status' => FINDING_STATUS[letter] }
      cli = ops_finding_cli(entry)
      row['cli'] = cli if cli
      if letter == 'c'
        row['needs'] = ops_needs_rows(entry['needs'], found[:host_id])
        row['fixed'] = true if ops_fixed?(entry)
      elsif letter == 'f'
        row['falseBecause'] = entry['falseBecause']
      end
      row
    end

    # A finding's `cli`, from the realism catalog entry its `realism` link names (5.3). Only a finding
    # with a link reads the loader. Copies the named keys the entry has, unchanged (a copy, so the frozen
    # entry is never shared), and nothing else; nil when there is no link, the link resolves to nothing
    # (one server warning naming the link id, never an answer) or the entry holds none of the keys, so
    # an answer never carries `cli: {}` or `null`. Nothing reads the result to decide anything.
    def ops_finding_cli(entry)
      link = entry['realism']
      return nil unless link.is_a?(String) && !link.empty?

      linked = BreakEscape::RealismCatalog.lookup(link)
      unless linked.is_a?(Hash)
        BreakEscape::RealismCatalog.warn_unresolved(link)
        return nil
      end

      out = {}
      CLI_FINDING_KEYS.each do |key|
        value = ops_cli_value(key, linked[key])
        out[key] = value if value
      end
      out.empty? ? nil : out
    end

    # One `cli` value by type: a non-empty String for title, module and script; the Strings of an
    # Array for advisories and output (nil when none is left). Nothing nested is ever copied, so a `_`
    # note key cannot ride along.
    def ops_cli_value(key, value)
      if CLI_LIST_KEYS.include?(key)
        list = value.is_a?(Array) ? value.select { |item| item.is_a?(String) && !item.empty? }.map(&:dup) : []
        list.empty? ? nil : list
      else
        value.is_a?(String) && !value.empty? ? value.dup : nil
      end
    end

    def ops_finding_summary(entry)
      text = entry['summary']
      text.is_a?(String) && !text.strip.empty? ? text : CLASS_SUMMARIES[entry['class']].to_s
    end

    # --- S2: needs ----------------------------------------------------------------------------

    # `needs` as rows { kind, label, met }, in the order credential, item, itemType, session, global. The
    # label is a name the scenario already shows (a credential's label, an item's name, a session's
    # host name) or the authored label of an itemType or global; never a global's name. This is the
    # one needs predicate: the confirmed finding's rows show `met`, and use_technique! refuses on the
    # first row not met (ops_unmet_need), so the tick and the refusal cannot disagree.
    def ops_needs_rows(needs, host_id = nil)
      return [] unless needs.is_a?(Hash)

      rows = []
      rows << ops_need_credential(needs['credential']) if needs['credential'].is_a?(String)
      rows << ops_need_item(needs['item']) if needs['item'].is_a?(String)
      if needs['itemType'].is_a?(String)
        # A technique card is refused as an itemType need (plan 348): the row stays and is never met.
        met = needs['itemType'] != 'technique_card' && ops_item_type_held?(needs['itemType'])
        rows << { 'kind' => 'itemType', 'label' => needs['label'].to_s, 'met' => met }
      end
      rows << ops_need_session(host_id, needs['session']) if needs['session'].is_a?(String)
      if BreakEscape::AccessWork.off_when_present?(needs['global'])
        rows << { 'kind' => 'global', 'label' => needs['label'].to_s,
                  'met' => BreakEscape::AccessWork.globals_hold?(needs['global'], frustration_globals) }
      end
      rows
    end

    # The first need row not met, as { 'kind', 'label' }, or nil when every need holds.
    def ops_unmet_need(needs, host_id)
      row = ops_needs_rows(needs, host_id).find { |r| !r['met'] }
      row && { 'kind' => row['kind'], 'label' => row['label'] }
    end

    # A LIVE session held at the host's PC, not locked, at the level named or above (plan 5.4; S3
    # server R1 M1). Live is what every other reader of a held session means: not a relay record
    # (relay_session?, the account holder's own screen) and not an expired token session
    # (credential_session_expired?, the one expiry predicate). The level is the record's own
    # `access`, worked out by session_access (S5a): a session whose route is down or whose account is
    # gone has no level and meets nothing; a `user` need is met by any other live session; an
    # `admin` need only by an admin one (session_admin?).
    def ops_need_session(host_id, level)
      pc = host_id.is_a?(String) ? find_login_pc(host_id)&.dig(:object) : nil
      session = pc ? access_sessions[host_id] : nil
      met = session.is_a?(Hash) && !relay_session?(session) && !credential_session_expired?(session) &&
            !session_locked?(session) &&
            !session_access(host_id).nil? &&
            (level == 'user' || (level == 'admin' && session_admin?(host_id)))
      { 'kind' => 'session', 'label' => pc ? host_label(pc).to_s : '', 'met' => met }
    end

    def ops_need_credential(cred_id)
      entry = CredentialModel.registry(scenario_data)[cred_id]
      label = entry.is_a?(Hash) ? ops_credential_label(entry) : ''
      { 'kind' => 'credential', 'label' => label, 'met' => entry.is_a?(Hash) && ops_keyring_serves?(cred_id) }
    end

    # Met by the keyring's own rule (plan 4.2): the registry entry is one the keyring would list now
    # (its kind is built, its proof holds and its account names an NPC) AND is still usable: the
    # keyring also lists an expired token and an ended assist invite as greyed rows (`expired`,
    # `ended`), which do not meet a need (S3 server R1 M1, S2 R2 N1).
    def ops_keyring_serves?(cred_id)
      registry_keyring_entries.any? do |item|
        item['id'] == cred_id && !item['expired'] && !item['ended']
      end
    end

    # A credential's label: its own, else (a password) the name of the item it is found in.
    def ops_credential_label(entry)
      label = credential_label(entry)
      return label unless label.empty?

      definition = CredentialModel.item_definition(scenario_data, entry['foundIn'])
      definition.is_a?(Hash) && definition['name'].is_a?(String) ? definition['name'] : ''
    end

    def ops_need_item(item_id)
      definition = CredentialModel.item_definition(scenario_data, item_id)
      name = definition.is_a?(Hash) && definition['name'].is_a?(String) ? definition['name'] : ''
      { 'kind' => 'item', 'label' => name, 'met' => ops_item_held?(item_id) }
    end

    # Identity-strict, as credential_held_proof_holds? is: an unforged inventory entry whose id and
    # type equal the authored definition's. Never by name.
    def ops_item_held?(item_id)
      definition = CredentialModel.item_definition(scenario_data, item_id)
      return false unless definition.is_a?(Hash) && definition['type'].is_a?(String) && definition['id'].to_s == item_id.to_s

      ops_held_items.any? { |data| data['id'].to_s == item_id.to_s && data['type'].to_s == definition['type'] }
    end

    # Some held, unforged entry whose id is an authored item of that type and whose own type equals it.
    def ops_item_type_held?(type)
      return false if type.to_s.empty?

      ops_held_items.any? do |data|
        definition = CredentialModel.item_definition(scenario_data, data['id'])
        definition.is_a?(Hash) && definition['type'] == type && data['type'].to_s == type
      end
    end

    # The inventory entries the player really holds (not client-forged), unwrapped.
    def ops_held_items
      Array(player_state['inventory']).filter_map do |inv|
        next if !inv.is_a?(Hash) || BreakEscape::ItemIdentity.client_forged?(inv)

        data = inv['scenarioData'] || inv
        data.is_a?(Hash) && data['id'].is_a?(String) ? data : nil
      end
    end

    # --- S3: use a technique card (plan 5.4) ---------------------------------------------------

    # GET /network gains a top-level `techniques` map for the cards the player holds, and nothing
    # else changes (a game holding no card answers exactly as before). NetworkOps is included after
    # NetworkAccess, so this wraps its builder.
    def network_view(foothold_id = nil)
      result = super
      if result[:status] == :ok && result[:body].is_a?(Hash)
        held = ops_held_techniques
        result[:body][:techniques] = held if held.any?
      end
      result
    end

    # { techniqueId => { name, summary?, worksOn, itemId } } for each registry entry whose card the
    # player holds; where several held items carry one technique, the first in id order is the itemId.
    def ops_held_techniques
      registry = NetworkModel.techniques(scenario_data)
      out = {}
      ops_held_items.map { |data| data['id'] }.sort.each do |item_id|
        technique_id = ops_card_technique(item_id)
        next if technique_id.nil? || out.key?(technique_id)

        entry = registry[technique_id]
        works_on = ops_works_on(entry['worksOn'])
        next if works_on.nil?

        row = { 'name' => entry['name'] }
        row['summary'] = entry['summary'] if entry['summary'].is_a?(String) && !entry['summary'].empty?
        row['worksOn'] = works_on
        row['itemId'] = item_id
        out[technique_id] = row
      end
      out.sort.to_h
    end

    # `worksOn` as sent: the named keys only, by type (class and product strings, versions an array of
    # strings), so a `_note` key an author left in it never reaches the browser (S3 server R1 m1).
    # nil when it is not a Hash with a class: that technique is not listed.
    def ops_works_on(works_on)
      return nil unless works_on.is_a?(Hash) && works_on['class'].is_a?(String) && !works_on['class'].empty?

      out = { 'class' => works_on['class'].dup }
      out['product'] = works_on['product'].dup if works_on['product'].is_a?(String)
      if works_on['versions'].is_a?(Array)
        out['versions'] = works_on['versions'].select { |version| version.is_a?(String) }.map(&:dup)
      end
      out
    end

    # The registry key a held card names, or nil. The item must be held, unforged, with its id and
    # type equal to the authored definition (ops_item_held?); the key is read from the authored
    # definition, never from the inventory copy, and must be a registry key.
    def ops_card_technique(item_id)
      definition = CredentialModel.item_definition(scenario_data, item_id)
      return nil unless definition.is_a?(Hash) && definition['type'] == 'technique_card' && ops_item_held?(item_id)

      key = definition['technique_card']
      key.is_a?(String) && NetworkModel.techniques(scenario_data).key?(key) ? key : nil
    end

    # POST /network/technique: a held technique card used on a held finding. Returns { status:, body: }.
    # Checks in order (5.4): the finding held and its host listed (404); the card (404); the host
    # responding (403); the repeat; confirmed; has a grant; not fixed; the match; the needs.
    def use_technique!(foothold_id, finding_id, item_id)
      found, record = ops_finding_reach(foothold_id, finding_id)
      return ops_not_found unless found

      technique_id = ops_card_technique(item_id)
      return ops_not_found unless technique_id

      letter, number = ops_finding_value(finding_id)
      refuse = lambda do |status, reason, need = nil|
        ops_technique_refusal(record, number, technique_id, status, reason, need)
      end
      return refuse.call(:forbidden, 'not_responding') if ops_host_off?(record)

      entry = found[:entry]
      grant = ops_grant_of(entry, record)
      repeat = ops_technique_repeat(grant, foothold_id, finding_id, record[:id])
      return ops_technique_repeat_answer(grant, repeat, foothold_id, record, number, technique_id) if repeat

      return refuse.call(:unprocessable_entity, 'not_confirmed') if letter == 'u'
      return refuse.call(:unprocessable_entity, 'false_positive') if letter == 'f'
      return refuse.call(:unprocessable_entity, 'no_grant') unless grant
      return refuse.call(:unprocessable_entity, 'fixed') if ops_fixed?(entry)

      service = record[:services].find { |svc| svc['name'] == found[:service_name] }
      mismatch = ops_technique_mismatch(NetworkModel.techniques(scenario_data)[technique_id], service, entry)
      return refuse.call(:unprocessable_entity, mismatch) if mismatch

      unmet = ops_unmet_need(entry['needs'], record[:id])
      return refuse.call(:unprocessable_entity, 'need_unmet', unmet) if unmet

      ops_technique_grant!(grant, foothold_id, finding_id, record, number, technique_id)
    end

    # The grant a weakness carries, or nil when it has none that can be given: a session on a host
    # with a sign-in for an account the scenario holds, or a credential the registry names.
    def ops_grant_of(entry, record)
      grants = entry['grants']
      return nil unless grants.is_a?(Hash)

      session = grants['session']
      if session.is_a?(Hash)
        npc = account_npcs.find { |n| n['id'].to_s == session['account'].to_s }
        level = session['access']
        return nil unless record[:kind] == 'pc' && npc && %w[user admin].include?(level)

        return { kind: 'session', npc: npc, access: level }
      end
      cred = grants['credential']
      return nil unless cred.is_a?(String) && CredentialModel.registry(scenario_data)[cred].is_a?(Hash)

      { kind: 'credential', id: cred }
    end

    # Why a card does not fit a finding's service: wrong_class, wrong_product, wrong_version, or nil.
    # technique_matches? decides; the code names the first part that differs.
    def ops_technique_mismatch(technique, service, entry)
      return nil if NetworkModel.technique_matches?(technique, service, entry)

      works = technique.is_a?(Hash) ? technique['worksOn'] : nil
      return 'wrong_class' unless works.is_a?(Hash) && service.is_a?(Hash) && works['class'] == entry['class']
      return 'wrong_product' if works.key?('product') && works['product'] != service['product']

      'wrong_version'
    end

    # The existing technique session an exact repeat reports: for a session grant, the held record when
    # it is a technique session for this finding through this foothold (and its account is known);
    # for a credential grant, true when opsUsed holds the finding. Otherwise nil.
    def ops_technique_repeat(grant, foothold_id, finding_id, host_id)
      return nil unless grant

      if grant[:kind] == 'credential'
        return technique_finding_used?(finding_id) ? true : nil
      end
      session = access_sessions[host_id]
      return nil unless session.is_a?(Hash) && session['via'] == 'technique' && session['technique'] == finding_id &&
                        session['foothold'] == foothold_id

      account_npcs.find { |n| n['id'].to_s == session['id'].to_s }
    end

    def ops_technique_repeat_answer(grant, repeat, foothold_id, record, number, technique_id)
      detail = { 'finding' => "f#{number}", 'technique' => technique_id, 'grant' => grant[:kind] }
      if grant[:kind] == 'session'
        stored = access_sessions[record[:id]]
        detail['access'] = stored.is_a?(Hash) && stored['access'] == 'admin' ? 'admin' : 'user'
        row = write_log_row!('technique_used', as: ops_account_as(repeat['id']), where: ops_where(record), detail: detail, save_limit: true)
        body = { success: true, already: true, grant: 'session',
                 session: login_session_answer(repeat, 'technique', pc_id: record[:id], foothold: foothold_id) }
      else
        row = write_log_row!('technique_used', as: nil, where: ops_where(record), detail: detail, save_limit: true)
        body = { success: true, already: true, grant: 'credential', keyringChanged: false }
      end
      save! if row&.stored?
      { status: :ok, body: body }
    end

    # A new use: the grant, the finding id in opsUsed (once), the row, the save.
    def ops_technique_grant!(grant, foothold_id, finding_id, record, number, technique_id)
      detail = { 'finding' => "f#{number}", 'technique' => technique_id, 'grant' => grant[:kind] }
      if grant[:kind] == 'session'
        npc = grant[:npc]
        ended = start_login_session!(record[:id], npc, 'technique', foothold: foothold_id, access: grant[:access], technique: finding_id)
        detail['access'] = grant[:access]
        as = ops_account_as(npc['id'])
        body = { success: true, grant: 'session',
                 session: login_session_answer(npc, 'technique', pc_id: record[:id], foothold: foothold_id) }
        body = with_ended_pc_ids(body, ended)
      else
        as = nil
        body = { success: true, grant: 'credential', keyringChanged: true }
      end
      used = player_state['opsUsed'].is_a?(Array) ? player_state['opsUsed'] : []
      player_state['opsUsed'] = used + [finding_id] unless used.include?(finding_id)
      write_log_row!('technique_used', as: as, where: ops_where(record), detail: detail)
      save!
      { status: :ok, body: body }
    end

    # A refusal past the two 404s: a `technique_refused` row (limited, so it saves only when it was
    # stored) and the refusal answer. Nothing else in the state changes.
    def ops_technique_refusal(record, number, technique_id, status, reason, need = nil)
      row = write_log_row!('technique_refused', as: nil, where: ops_where(record), result: 'refused', save_limit: true,
                                                detail: { 'finding' => "f#{number}", 'technique' => technique_id, 'reason' => reason })
      save! if row&.stored?
      body = { success: false, reason: reason }
      body[:need] = need if need
      { status: status, body: body }
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
    def ops_host_row(record, foothold_id = nil)
      record[:kind] == 'pc' ? host_row(record[:object], foothold_id) : ops_device_row(record)
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
        findings = ops_host_findings(host_id, services)
        row['findings'] = findings if findings.any?
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
    def ops_held_session_rows(network_id, foothold_id = nil)
      held = view_session_hosts.select { |h| h[:net] == network_id }.map { |h| h[:pc_id] }
      NetworkModel.sign_in_objects_on(network_id, scenario_data).select { |entry| held.include?(entry[:object]['id'].to_s) }
                  .map { |entry| host_row(entry[:object], foothold_id) }
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
