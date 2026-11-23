# frozen_string_literal: true

# Ops core (docs/achitechture/OPS_CORE_PLAN.md, sections 3 and 9.2), stage S1: hosts, services and
# discovery. One entry point, check_network_ops, called by scripts/validate_scenario.rb beside
# check_credentials. Everything it reads about hosts goes through BreakEscape::NetworkModel, so the
# validator, the server and the graph agree on what a host is. Messages never quote a password.
#
# The not-built-yet table (section 3): while a stage is not built, each of its fields is a validator
# error naming the feature id, because a field that does nothing is too quiet for a warning. A stage
# flips its own entries to built when it LANDS (S1 at core step 5, S2 at step 8, S3 at step 13), not
# when its server code arrives, so the table is NETWORK_OPS_BUILT below and the last stage removes it.
require 'json'
require 'set'
require_relative '../lib/break_escape/network_model'
require_relative '../lib/break_escape/access_identities'

NETWORK_OPS_ID = /\A[a-z][a-z0-9_]{0,39}\z/.freeze
NETWORK_OPS_MAX_ID = 40
NETWORK_OPS_MAX_SERVICES = 8
NETWORK_OPS_MAX_SERVICE_HOSTS = 64
NETWORK_OPS_OBJECTS_DIR = File.expand_path('../public/break_escape/assets/objects', __dir__)
NETWORK_OPS_PRODUCTS_FILE = File.expand_path('real_product_names.txt', __dir__)

# Which feature ids are built. N13 = S1, N14 = S2, N15 = S3.
NETWORK_OPS_BUILT = { 'N13' => true, 'N14' => true, 'N15' => false }.freeze

# Field => feature id, by where the field sits. `discovery` is checked by value (only "scan" does
# anything; "open" is the default).
NETWORK_OPS_TOP_LEVEL = { 'hosts' => 'N13', 'techniques' => 'N15' }.freeze
NETWORK_OPS_OBJECT_FIELDS = { 'services' => 'N13', 'technique_card' => 'N15' }.freeze
NETWORK_OPS_SERVICE_FIELDS = { 'weaknesses' => 'N14', 'decoys' => 'N14' }.freeze
NETWORK_OPS_DISCOVERY = 'N13'
NETWORK_OPS_WEAKNESS_GRANTS = 'N15'
NETWORK_OPS_MAX_FINDINGS = 128
NETWORK_OPS_TELLTALE = /(?:\A|_)(?:decoy|fake|false|real|true|bait)s?(?:_|\z)/.freeze
# A summary that reads as a procedure: a path, a flag, a pipe, a backtick or a command substitution.
NETWORK_OPS_PROCEDURE = %r{(?:\A|\s)-{1,2}[A-Za-z]|[|`]|\$\(|(?:\A|\s)(?:\.{0,2}/|~/)[\w.-]+|\b[A-Za-z]:\\}.freeze

# built: the feature ids that are built (the shipped table unless a test passes its own).
# objects_dir: where a host's sprite PNG is looked for. products: the real-product-name list.
def check_network_ops(json_data, built: NETWORK_OPS_BUILT, objects_dir: NETWORK_OPS_OBJECTS_DIR,
                      products: network_ops_real_products)
  issues = []
  return issues unless json_data.is_a?(Hash)

  err = ->(msg) { issues << "❌ ERROR: network ops: #{msg}" }
  warn = ->(msg) { issues << "⚠️ WARNING: network ops: #{msg}" }
  nm = BreakEscape::NetworkModel
  ai = BreakEscape::AccessIdentities

  networks = nm.networks(json_data)
  host_map = json_data['hosts'].is_a?(Hash) ? json_data['hosts'] : {}
  all_objects = ai.room_objects(json_data)
  not_built = ->(feature) { !built[feature] }

  # A scenario with none of the feature's fields has nothing to check (OPS_CORE_PLAN.md section 10),
  # except the foothold-id length rule, which reads `logSources` scenarios whatever else they hold.
  has_fields = json_data.key?('hosts') || json_data.key?('techniques') || json_data.key?('logSources') ||
               networks.each_value.any? { |net| net['discovery'] == 'scan' } ||
               all_objects.any? { |e| e[:object].key?('services') || e[:object].key?('technique_card') } ||
               network_ops_walk_items(json_data).any? { |item, _| item.key?('technique_card') }
  return issues unless has_fields

  # ---- The not-built-yet table (section 3) ----
  NETWORK_OPS_TOP_LEVEL.each do |key, feature|
    err.call("`#{key}` is not built yet: #{feature}") if json_data.key?(key) && not_built.call(feature)
  end
  all_objects.each do |e|
    NETWORK_OPS_OBJECT_FIELDS.each do |key, feature|
      next unless e[:object].key?(key) && not_built.call(feature)

      err.call("'#{e[:path]}' has `#{key}`, which is not built yet: #{feature}")
    end
  end
  network_ops_walk_items(json_data).each do |item, path|
    next unless item.key?('technique_card') && item['type'] && not_built.call('N15')
    next if all_objects.any? { |e| e[:object].equal?(item) } # reported above

    err.call("'#{path}' has `technique_card`, which is not built yet: N15")
  end
  networks.each do |net_id, net|
    next unless net['discovery'] == 'scan' && not_built.call(NETWORK_OPS_DISCOVERY)

    err.call("'networks/#{net_id}' has `discovery`, which is not built yet: #{NETWORK_OPS_DISCOVERY}")
  end

  # ---- Hosts: ids, networks, sprites ----
  object_ids = all_objects.map { |e| e[:object]['id'] }.compact.map(&:to_s).to_set
  resource_ids = nm.resources(json_data).keys.to_set
  host_map.each do |id, entry|
    next if id.is_a?(String) && id.start_with?('_')

    where = "hosts/#{id.to_s[0, 40]}"
    if !id.is_a?(String) || id.length > NETWORK_OPS_MAX_ID
      err.call("'#{where}' id is longer than #{NETWORK_OPS_MAX_ID} characters (it must fit a log row)")
    elsif !id.match?(NETWORK_OPS_ID)
      err.call("'#{where}' id must match #{NETWORK_OPS_ID.source}")
    end
    err.call("'#{where}' id is also a room object id; hosts, objects and resources share one id space") if object_ids.include?(id)
    err.call("'#{where}' id is also a resources key; hosts, objects and resources share one id space") if resource_ids.include?(id)
    next unless entry.is_a?(Hash)

    net = entry['network']
    err.call("'#{where}' network '#{net.to_s[0, 40]}' names no entry in 'networks'") unless net.is_a?(String) && networks.key?(net)
    sprite = entry['sprite']
    if !sprite.nil? && !(sprite.is_a?(String) && sprite.match?(/\A[A-Za-z0-9_]+\z/) && File.file?(File.join(objects_dir, "#{sprite}.png")))
      err.call("'#{where}' sprite '#{sprite.to_s[0, 40]}' names no PNG in assets/objects/")
    end
  end

  # ---- Services: where they sit, how many, names ----
  carriers = [] # [label, path, host_entry_or_object, network, device?]
  host_map.each do |id, entry|
    next if id.is_a?(String) && id.start_with?('_')
    next unless entry.is_a?(Hash)

    carriers << ["host '#{id.to_s[0, 40]}'", "hosts/#{id.to_s[0, 40]}", entry, entry['network'], true]
  end
  all_objects.each do |e|
    obj = e[:object]
    next unless obj.key?('services')

    unless nm.sign_in_object?(obj)
      err.call("'#{e[:path]}' has `services` but is not a sign-in object (lockType \"login\"); only a sign-in " \
               'object or a `hosts` entry runs services')
      next
    end
    carriers << ["host '#{obj['id']}'", e[:path], obj, nm.network_of(obj, json_data.dig('rooms', e[:room])), false]
  end

  with_services = 0
  carriers.each do |label, _path, host, network, _device|
    list = host.key?('services') ? host['services'] : []
    unless list.is_a?(Array)
      err.call("#{label}: `services` must be a list")
      next
    end
    with_services += 1 unless list.empty?
    err.call("#{label} has #{list.length} services; at most #{NETWORK_OPS_MAX_SERVICES}") if list.length > NETWORK_OPS_MAX_SERVICES
    seen = Set.new
    list.each_with_index do |svc, idx|
      unless svc.is_a?(Hash)
        err.call("#{label}: services[#{idx}] must be an object")
        next
      end
      name = svc['name']
      err.call("#{label}: two services are named '#{name.to_s[0, 40]}'; a name is the service's id on its host") unless seen.add?(name)
      err.call("#{label}: service name '#{name.to_s[0, 40]}' is longer than #{NETWORK_OPS_MAX_ID} characters") if name.is_a?(String) && name.length > NETWORK_OPS_MAX_ID
      network_ops_service_stage_checks(svc, label, built, err)
    end
    next if list.empty?
    next unless network.is_a?(String) && networks.key?(network) && !nm.discovery?(json_data, network)
    next if list.any? { |svc| svc.is_a?(Hash) && (Array(svc['weaknesses']).any? || Array(svc['decoys']).any?) }

    warn.call("#{label} runs services on the open network '#{network}' and nothing on it has a weakness; services " \
              'that are only scenery are allowed, but it is usually a slip')
  end
  if with_services > NETWORK_OPS_MAX_SERVICE_HOSTS
    err.call("#{with_services} hosts carry services; at most #{NETWORK_OPS_MAX_SERVICE_HOSTS}")
  end

  # ---- discovery: "scan" on a network with nothing to find ----
  networks.each do |net_id, net|
    next unless net['discovery'] == 'scan'
    next unless net['wifi'].is_a?(Hash) || nm.jacks(json_data).any? { |j| j[:network] == net_id }
    next unless nm.hosts_on(net_id, json_data).empty?

    err.call("'networks/#{net_id}' is a discovery network (\"scan\") with a Wi-Fi block or a jack but no host at all; " \
             'a sweep would find nothing')
  end

  # ---- Findings: weaknesses and decoys (S2) ----
  network_ops_check_findings(json_data, carriers, err, warn) if built['N14']

  # ---- Passwords in the strings a foothold's view shows ----
  passwords = ai.room_npcs(json_data).filter_map do |e|
    creds = e[:npc]['creds']
    pw = creds.is_a?(Hash) ? creds['password'] : nil
    [e[:npc]['id'], pw] if pw.is_a?(String) && !pw.empty?
  end
  shown = []
  carriers.each do |_label, path, host, _network, device|
    shown << ["#{path}/name", host['name']] if device
    Array(host['services']).each_with_index do |svc, idx|
      next unless svc.is_a?(Hash)

      %w[product version label].each { |f| shown << ["#{path}/services[#{idx}]/#{f}", svc[f]] }
    end
  end
  shown.each do |where, text|
    next unless text.is_a?(String)

    passwords.each do |npc_id, pw|
      next unless text.include?(pw)

      err.call("NPC '#{npc_id}' creds.password appears in '#{where}', which a foothold's view shows. A clue belongs " \
               'in the text of an item.')
    end
  end

  # ---- Real product names ----
  carriers.each do |label, _path, host, _network, _device|
    Array(host['services']).each do |svc|
      next unless svc.is_a?(Hash) && svc['product'].is_a?(String)

      hit = products.find { |name| svc['product'].match?(/(?<![[:alnum:]])#{Regexp.escape(name)}(?![[:alnum:]])/i) }
      next unless hit

      warn.call("#{label}: product '#{svc['product'][0, 40]}' holds the real product name '#{hit}' " \
                '(scripts/real_product_names.txt); products in this game are invented')
    end
  end

  # ---- Ids that must fit a log row (a scenario that declares logSources) ----
  if json_data.key?('logSources')
    networks.each_key do |net_id|
      err.call("network id '#{net_id.to_s[0, 40]}' is longer than #{NETWORK_OPS_MAX_ID} characters; it would not fit a log row") if net_id.to_s.length > NETWORK_OPS_MAX_ID
    end
    all_objects.each do |e|
      obj = e[:object]
      next unless obj['id'].is_a?(String) && obj['id'].length > NETWORK_OPS_MAX_ID
      next unless (nm.sign_in_object?(obj) && obj.key?('services')) || nm.rogue_device?(obj)

      err.call("'#{e[:path]}' id is longer than #{NETWORK_OPS_MAX_ID} characters; a host or foothold device id must " \
               'fit a log row')
    end
    nm.rogue_device_definitions(json_data).each do |d|
      id = d[:item]['id']
      next if all_objects.any? { |e| e[:object].equal?(d[:item]) }
      next unless id.length > NETWORK_OPS_MAX_ID

      err.call("'#{d[:path]}' id is longer than #{NETWORK_OPS_MAX_ID} characters; a foothold device id must fit a log row")
    end
    # A foothold's id in a row is built from its object's id with a prefix (core plan section 0): the
    # built id must fit too.
    nm.jacks(json_data).each do |e|
      network_ops_built_foothold_id(err, "'#{e[:path]}'", 'jack', 'jack_', e[:object]['id'])
    end
    networks.each do |net_id, net|
      network_ops_built_foothold_id(err, "network '#{net_id.to_s[0, 40]}'", 'Wi-Fi network', 'wifi_', net_id) if net.is_a?(Hash) && net['wifi'].is_a?(Hash)
    end
    nm.grant_foothold_actions(json_data).map { |a| a[:pc] }.uniq.each do |pc_id|
      network_ops_built_foothold_id(err, "PC '#{pc_id[0, 40]}'", 'implantable PC', 'implant_', pc_id)
    end
  end

  issues
end

# S2 (OPS_CORE_PLAN.md 9.2): weaknesses, decoys and their needs and fixedIf. carriers are
# [label, path, host, network, device?] as built by check_network_ops. Runs only when N14 is built;
# while it is not, the not-built table has already refused the fields.
def network_ops_check_findings(json_data, carriers, err, warn)
  nm = BreakEscape::NetworkModel
  credentials = json_data['credentials'].is_a?(Hash) ? json_data['credentials'] : {}
  items = network_ops_item_definitions(json_data)
  declared = json_data['globalVariables'].is_a?(Hash) ? json_data['globalVariables'] : {}
  known_globals = build_reference_index(json_data)['global']
  other_names = nil # strings elsewhere in the scenario, read once when a fixedIf needs them
  foothold_networks = network_ops_foothold_networks(json_data)
  client_writable = lambda do |name|
    server_owned = BreakEscape::WearableModel.worn_globals(json_data).include?(name) ||
                   Array(json_data['importGlobals']).filter_map { |e| carry_over_import_name(e) }.include?(name)
    !server_owned
  end

  total = 0
  carriers.each do |label, path, host, network, _device|
    Array(host['services']).each do |svc|
      next unless svc.is_a?(Hash)

      sname = svc['name'].to_s[0, 40]
      weaknesses = Array(svc['weaknesses'])
      decoys = Array(svc['decoys'])
      err.call("#{label} service '#{sname}': #{weaknesses.length} weaknesses; at most #{nm::FINDINGS_PER_LIST}") if weaknesses.length > nm::FINDINGS_PER_LIST
      err.call("#{label} service '#{sname}': #{decoys.length} decoys; at most #{nm::FINDINGS_PER_LIST}") if decoys.length > nm::FINDINGS_PER_LIST
      total += weaknesses.length + decoys.length
      seen = Set.new
      (weaknesses + decoys).each do |entry|
        next unless entry.is_a?(Hash)

        id = entry['id']
        if id.is_a?(String) && !seen.add?(id)
          err.call("#{label} service '#{sname}': the id '#{id[0, 40]}' is used twice among its weaknesses and decoys; the id is part of the finding id")
        end
        if id.is_a?(String) && id.length > NETWORK_OPS_MAX_ID
          err.call("#{label} service '#{sname}': finding id '#{id[0, 40]}' is longer than #{NETWORK_OPS_MAX_ID} characters")
        end
        warn.call("#{label} service '#{sname}': the id '#{id[0, 40]}' holds a telltale word (decoy, fake, false, real, true, bait); it reaches the browser inside the finding id") if id.is_a?(String) && id.match?(NETWORK_OPS_TELLTALE)
        %w[summary falseBecause].each do |field|
          text = entry[field]
          next unless text.is_a?(String)

          if text.length > 200 || text.match?(NETWORK_OPS_PROCEDURE)
            warn.call("#{label} service '#{sname}': `#{field}` of '#{id.to_s[0, 40]}' reads as a procedure (a path, flag, pipe or over 200 characters); write what is wrong, never how to exploit it")
          end
        end
      end
      weaknesses.each do |weakness|
        next unless weakness.is_a?(Hash)

        network_ops_check_needs(weakness, label, sname, credentials, items, known_globals, client_writable, err, warn)
        network_ops_check_fixed_if(json_data, weakness, label, sname, declared, known_globals, path, err) do
          other_names ||= network_ops_other_strings(json_data)
        end
        if network.is_a?(String) && nm.networks(json_data).key?(network) && !foothold_networks.include?(network)
          err.call("#{label} service '#{sname}': weakness '#{weakness['id'].to_s[0, 40]}' sits on network '#{network}', which no foothold can reach (no jack, Wi-Fi block, implantable PC or link leads there)")
        end
      end
      weaknesses.each do |w|
        decoys.each do |d|
          next unless w.is_a?(Hash) && d.is_a?(Hash) && w['class'] == d['class'] && w['severity'] == d['severity']
          next if w['summary'].is_a?(String) || d['summary'].is_a?(String)

          warn.call("#{label} service '#{sname}': weakness '#{w['id'].to_s[0, 40]}' and decoy '#{d['id'].to_s[0, 40]}' have the same class and severity and no summary on either; after confirming, the player has nothing to tell them apart by")
        end
      end
    end
  end
  err.call("#{total} weaknesses and decoys in the scenario; at most #{NETWORK_OPS_MAX_FINDINGS}") if total > NETWORK_OPS_MAX_FINDINGS
end

# One weakness's `needs` map (section 4.2): every entry names something that exists, labels are
# where they belong. needs.session is the N15 table's.
def network_ops_check_needs(weakness, label, sname, credentials, items, known_globals, client_writable, err, warn)
  needs = weakness['needs']
  return if needs.nil?

  where = "#{label} service '#{sname}' weakness '#{weakness['id'].to_s[0, 40]}'"
  unless needs.is_a?(Hash)
    err.call("#{where}: `needs` must be an object")
    return
  end
  if needs.key?('credential') && !(needs['credential'].is_a?(String) && credentials.key?(needs['credential']))
    err.call("#{where}: needs.credential '#{needs['credential'].to_s[0, 40]}' names no entry in 'credentials'")
  end
  if needs.key?('item')
    item = needs['item']
    if !item.is_a?(String) || !items.key?(item)
      by_name = item.is_a?(String) && items.values.any? { |d| d[:name] == item }
      err.call("#{where}: needs.item '#{item.to_s[0, 40]}' names no item id" + (by_name ? ' (an item is named by its id, never by its display name)' : ''))
    end
  end
  if needs.key?('itemType')
    type = needs['itemType']
    if type == 'technique_card'
      err.call("#{where}: needs.itemType may not be \"technique_card\"; a card is never a need")
    elsif !type.is_a?(String) || items.values.none? { |d| d[:type] == type }
      err.call("#{where}: needs.itemType '#{type.to_s[0, 40]}' is the type of no item in the scenario")
    end
  end
  err.call("#{where}: needs holds both `item` and `itemType`; use one") if needs.key?('item') && needs.key?('itemType')
  if needs.key?('global')
    names = offwhen_names(needs['global'])
    if names.nil?
      err.call("#{where}: needs.global must be a global name or { name: value }")
    else
      names.each do |name|
        err.call("#{where}: needs.global names '#{name.to_s[0, 40]}', which is not a declared global") unless known_globals.include?(name.to_s)
        next unless client_writable.call(name.to_s)

        warn.call("#{where}: needs.global '#{name.to_s[0, 40]}' is a global the client can write, so it is a soft gate; add an item or credential need beside it where the step matters")
      end
    end
  end
  err.call("#{where}: needs holds both `itemType` and `global`; a needs map has one label, so split them") if needs.key?('itemType') && needs.key?('global')
  wants_label = needs.key?('itemType') || needs.key?('global')
  if wants_label && !(needs['label'].is_a?(String) && !needs['label'].strip.empty?)
    err.call("#{where}: needs with `itemType` or `global` needs a `label`, the words the player is shown")
  elsif !wants_label && needs.key?('label')
    err.call("#{where}: needs.label is allowed only beside `itemType` or `global`")
  end
  err.call("#{where}: needs.label must be 1 to 40 characters") if needs['label'].is_a?(String) && needs['label'].length > 40
end

# fixedIf names declared globals, and its starting value does not already hold with nothing in the
# scenario that can change it (the weakness would never be found). "Nothing can change it" is read
# from the scenario file only: an ink file that sets the global is not seen, so a global set only
# from ink looks unchangeable here; set it from a mapping or declare it so that it starts false.
def network_ops_check_fixed_if(json_data, weakness, label, sname, declared, known_globals, _path, err)
  return unless weakness.key?('fixedIf')

  cond = weakness['fixedIf']
  where = "#{label} service '#{sname}' weakness '#{weakness['id'].to_s[0, 40]}'"
  names = offwhen_names(cond)
  if names.nil?
    err.call("#{where}: fixedIf must be a global name or { name: value } (the requireGlobal form)")
    return
  end
  names.each do |name|
    err.call("#{where}: fixedIf names '#{name.to_s[0, 40]}', which is not a declared global") unless known_globals.include?(name.to_s)
  end
  return unless offwhen_holds_on?(cond, declared, BreakEscape::NetworkModel)

  others = yield
  return if names.any? { |name| others.include?(name.to_s) }

  err.call("#{where}: fixedIf already holds at the start and nothing in the scenario changes it; the weakness could never be found")
end

# { itemId => { type:, name: } } for every hash in the scenario with a string id and a string type,
# author notes skipped. Over-inclusive on purpose: it answers "is there an item of this id or type".
def network_ops_item_definitions(data)
  out = {}
  walk = lambda do |node|
    case node
    when Hash
      out[node['id']] = { type: node['type'], name: node['name'] } if node['id'].is_a?(String) && node['type'].is_a?(String)
      node.each { |k, v| walk.call(v) unless k.to_s.start_with?('_') }
    when Array then node.each { |v| walk.call(v) }
    end
  end
  walk.call(data)
  out
end

# Every string in the scenario outside `globalVariables` and outside the ops fields that merely read a
# global (a weakness's fixedIf and needs, any offWhen), as a Set. Used to ask
# whether anything else mentions a global.
def network_ops_other_strings(data)
  out = Set.new
  walk = lambda do |node, key|
    case node
    when Hash
      node.each do |k, v|
        next if k.to_s.start_with?('_') || k == 'globalVariables'
        next if k.to_s == 'offWhen' || (%w[fixedIf needs].include?(k.to_s) && node.key?('class'))

        out << k.to_s
        walk.call(v, k)
      end
    when Array then node.each { |v| walk.call(v, key) }
    when String then out << node
    end
  end
  walk.call(data, nil)
  out
end

# The networks some foothold's reach can include: a jack's network, a Wi-Fi network, an implantable
# PC's network, and every network a link path reaches from one of those.
def network_ops_foothold_networks(json_data)
  nm = BreakEscape::NetworkModel
  start = Set.new
  nm.jacks(json_data).each { |j| start << j[:network] if j[:network] }
  nm.networks(json_data).each { |id, net| start << id if net.is_a?(Hash) && net['wifi'].is_a?(Hash) }
  pcs = nm.grant_foothold_actions(json_data).map { |a| a[:pc] }.uniq
  nm.networks(json_data).each_key do |net|
    nm.sign_in_objects_on(net, json_data).each { |e| start << net if pcs.include?(e[:object]['id']) }
  end
  reach = start.dup
  nm.networks(json_data).each_key do |other|
    reach << other if start.any? { |from| from != other && nm.all_reach_paths(json_data, from, other).any? }
  end
  reach
end

# One built foothold id (prefix plus the object's id) must be at most NETWORK_OPS_MAX_ID characters.
def network_ops_built_foothold_id(err, where, kind, prefix, id)
  return unless id.is_a?(String) && (prefix.length + id.length) > NETWORK_OPS_MAX_ID

  err.call("#{where}: the foothold id '#{prefix}...' of this #{kind} would be #{prefix.length + id.length} characters, over " \
           "#{NETWORK_OPS_MAX_ID}; its id must be at most #{NETWORK_OPS_MAX_ID - prefix.length} characters to fit a log row")
end

# S2 and S3 fields on a service and its weaknesses: not built until their stage lands.
def network_ops_service_stage_checks(svc, label, built, err)
  NETWORK_OPS_SERVICE_FIELDS.each do |key, feature|
    err.call("#{label}: a service has `#{key}`, which is not built yet: #{feature}") if svc.key?(key) && !built[feature]
  end
  return if built[NETWORK_OPS_WEAKNESS_GRANTS]

  Array(svc['weaknesses']).each do |weakness|
    next unless weakness.is_a?(Hash)

    err.call("#{label}: a weakness has `grants`, which is not built yet: #{NETWORK_OPS_WEAKNESS_GRANTS}") if weakness.key?('grants')
    needs = weakness['needs']
    if needs.is_a?(Hash) && needs.key?('session')
      err.call("#{label}: a weakness has `needs.session`, which is not built yet: #{NETWORK_OPS_WEAKNESS_GRANTS}")
    end
  end
end

# Every hash in the scenario with a `type` (an item or an object), with a path, skipping author notes.
# Used only to find a `technique_card` on an item outside the room objects (an inventory item, an NPC's).
def network_ops_walk_items(data)
  out = []
  walk = lambda do |node, path|
    case node
    when Hash
      out << [node, path] if node.key?('technique_card') && node.key?('type')
      node.each { |k, v| walk.call(v, path.empty? ? k.to_s : "#{path}/#{k}") unless k.to_s.start_with?('_') }
    when Array then node.each_with_index { |v, i| walk.call(v, "#{path}[#{i}]") }
    end
  end
  walk.call(data, '')
  out
end

def network_ops_real_products
  return [] unless File.file?(NETWORK_OPS_PRODUCTS_FILE)

  File.readlines(NETWORK_OPS_PRODUCTS_FILE, chomp: true).map(&:strip).reject { |l| l.empty? || l.start_with?('#') }
end
