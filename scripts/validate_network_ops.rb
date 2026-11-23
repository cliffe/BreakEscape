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
require_relative '../lib/break_escape/credential_model'

NETWORK_OPS_ID = /\A[a-z][a-z0-9_]{0,39}\z/.freeze
NETWORK_OPS_MAX_ID = 40
NETWORK_OPS_MAX_SERVICES = 8
NETWORK_OPS_MAX_SERVICE_HOSTS = 64
NETWORK_OPS_OBJECTS_DIR = File.expand_path('../public/break_escape/assets/objects', __dir__)
NETWORK_OPS_PRODUCTS_FILE = File.expand_path('real_product_names.txt', __dir__)

# Which feature ids are built. N13 = S1, N14 = S2, N15 = S3.
NETWORK_OPS_BUILT = { 'N13' => true, 'N14' => true, 'N15' => true }.freeze

# Field => feature id, by where the field sits. `discovery` is checked by value (only "scan" does
# anything; "open" is the default).
NETWORK_OPS_TOP_LEVEL = { 'hosts' => 'N13', 'techniques' => 'N15' }.freeze
NETWORK_OPS_OBJECT_FIELDS = { 'services' => 'N13', 'technique_card' => 'N15' }.freeze
NETWORK_OPS_SERVICE_FIELDS = { 'weaknesses' => 'N14', 'decoys' => 'N14' }.freeze
NETWORK_OPS_DISCOVERY = 'N13'
NETWORK_OPS_WEAKNESS_GRANTS = 'N15'
NETWORK_OPS_MAX_FINDINGS = 128
NETWORK_OPS_MAX_TECHNIQUES = 32
# Game::SERVER_OWNED_GLOBAL_NAMES (game.rb), the fixed list of globals only the server writes.
NETWORK_OPS_SERVER_OWNED_GLOBALS = %w[se_captures].freeze
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

  # ---- Technique cards, grants and their credentials (S3) ----
  network_ops_check_techniques(json_data, err, warn) if built['N15']

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

# The names any door gate's creditOnPass sets (Game.credit_global_names_in): server-written only.
def network_ops_credit_globals(json_data)
  rooms = json_data['rooms']
  return [] unless rooms.is_a?(Hash)

  rooms.each_value.flat_map do |room|
    doors = room.is_a?(Hash) && room['doors'].is_a?(Array) ? room['doors'] : []
    doors.flat_map do |door|
      credit = door.is_a?(Hash) && door['gate'].is_a?(Hash) ? door['gate']['creditOnPass'] : nil
      next [] unless credit.is_a?(Hash)

      credit.each_value.flat_map { |block| block.is_a?(Hash) && block['setGlobal'].is_a?(Hash) ? block['setGlobal'].keys.map(&:to_s) : [] }
    end
  end.uniq
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
  # The client-writable test mirrors Game#server_owned_global_name? (app/models/break_escape/game.rb),
  # without Rails: worn globals, imported globals, every creditOnPass setGlobal name on any door gate,
  # and the fixed list (Game::SERVER_OWNED_GLOBAL_NAMES). A global on none of them is client-writable.
  server_owned_names = (BreakEscape::WearableModel.worn_globals(json_data).to_a +
                        Array(json_data['importGlobals']).filter_map { |e| carry_over_import_name(e) } +
                        network_ops_credit_globals(json_data) + NETWORK_OPS_SERVER_OWNED_GLOBALS).map(&:to_s).to_set
  client_writable = ->(name) { !server_owned_names.include?(name.to_s) }

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
        warn.call("#{label} service '#{sname}': the id '#{id[0, 40]}' holds a telltale word (decoy, fake, false, real, true, bait, as a whole word between underscores or at an end); it reaches the browser inside the finding id") if id.is_a?(String) && id.match?(NETWORK_OPS_TELLTALE)
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

# S3 (OPS_CORE_PLAN.md 9.2): the technique card registry, card items, weakness grants and the
# credentials they name. Runs only when N15 is built; while it is not, the not-built table has
# already refused the fields. Messages say "technique card" and "technique card registry", never
# "technique" alone (section 4.3).
def network_ops_check_techniques(json_data, err, warn)
  nm = BreakEscape::NetworkModel
  registry = nm.techniques(json_data)
  weaknesses = nm.weaknesses(json_data)
  decoys = nm.decoys(json_data)
  services = nm.hosts_on_all(json_data).flat_map { |rec| rec[:services] }
  cards = network_ops_card_items(json_data)
  have_cards = !cards.empty?
  finding_ids = weaknesses.to_h { |rec| [rec[:finding_id], rec] }

  network_ops_check_registry(json_data, registry, services, cards, err)
  network_ops_check_card_items(registry, cards, err)
  network_ops_check_registry_use(registry, weaknesses, decoys, services, warn)

  credentials = json_data['credentials'].is_a?(Hash) ? json_data['credentials'] : {}
  granted = {}
  weaknesses.each do |rec|
    network_ops_check_weakness_grants(json_data, rec, registry, credentials, granted, have_cards, err, warn)
  end
  credentials.each do |cid, entry|
    proof = entry.is_a?(Hash) ? entry['proof'] : nil
    next unless proof.is_a?(Hash) && proof.key?('technique_card')

    fid = proof['technique_card']
    rec = finding_ids[fid]
    if rec.nil?
      err.call("credential '#{cid.to_s[0, 40]}': proof.technique_card '#{fid.to_s[0, 80]}' names no weakness (a finding id is <hostId>.<serviceName>.<weaknessId>)")
    elsif !(rec[:entry]['grants'].is_a?(Hash) && rec[:entry]['grants']['credential'] == cid)
      err.call("credential '#{cid.to_s[0, 40]}': proof.technique_card '#{fid.to_s[0, 80]}' names a weakness whose `grants` does not name this credential; the two must name each other")
    end
  end
end

# [[hash, path]] for every item-shaped hash that carries `technique_card` or is of type
# "technique_card", author notes skipped. The credentials registry (a proof of that name) and the
# techniques registry are not items and are skipped.
def network_ops_card_items(data)
  out = []
  walk = lambda do |node, path|
    case node
    when Hash
      out << [node, path] if node.key?('technique_card') || node['type'] == 'technique_card'
      node.each do |k, v|
        next if k.to_s.start_with?('_') || (path.empty? && %w[credentials techniques].include?(k.to_s))

        walk.call(v, path.empty? ? k.to_s : "#{path}/#{k}")
      end
    when Array then node.each_with_index { |v, i| walk.call(v, "#{path}[#{i}]") }
    end
  end
  walk.call(data, '')
  out
end

# The registry itself: count, key shape, a card for each entry, and `worksOn` against the services.
def network_ops_check_registry(json_data, registry, services, cards, err)
  raw = json_data['techniques'].is_a?(Hash) ? json_data['techniques'].keys.reject { |k| k.to_s.start_with?('_') } : []
  err.call("#{raw.length} entries in `techniques`; at most #{NETWORK_OPS_MAX_TECHNIQUES}") if raw.length > NETWORK_OPS_MAX_TECHNIQUES
  carried = cards.filter_map { |item, _| item['technique_card'] if item['technique_card'].is_a?(String) }.to_set
  registry.each do |id, entry|
    if !id.is_a?(String) || id.length > NETWORK_OPS_MAX_ID
      err.call("technique card registry key '#{id.to_s[0, 40]}' is longer than #{NETWORK_OPS_MAX_ID} characters")
    elsif !id.match?(NETWORK_OPS_ID)
      err.call("technique card registry key '#{id[0, 40]}' must match #{NETWORK_OPS_ID.source}")
    end
    err.call("technique card registry entry '#{id.to_s[0, 40]}' is carried by no item; add an item with `technique_card: \"#{id.to_s[0, 40]}\"`") unless carried.include?(id)
    works = entry['worksOn']
    unless works.is_a?(Hash) && works['class'].is_a?(String) && !works['class'].empty?
      err.call("technique card registry entry '#{id.to_s[0, 40]}' needs `worksOn` with a `class`")
      next
    end
    next unless works.key?('product') || works.key?('versions')

    product = works['product']
    same = works.key?('product') ? services.select { |svc| svc['product'] == product } : services
    if works.key?('product') && same.empty?
      err.call("technique card registry entry '#{id.to_s[0, 40]}': worksOn.product '#{product.to_s[0, 40]}' equals no service's product")
    end
    Array(works['versions']).each do |version|
      next if same.any? { |svc| svc['version'] == version }

      err.call("technique card registry entry '#{id.to_s[0, 40]}': worksOn.versions entry '#{version.to_s[0, 40]}' equals no version of " \
               "#{works.key?('product') ? "the product '#{product.to_s[0, 40]}'" : 'any service'}")
    end
  end
end

# A card item must have type technique_card and a key of the registry; an item of that type must
# carry the key.
def network_ops_check_card_items(registry, cards, err)
  cards.each do |item, path|
    key = item['technique_card']
    if item.key?('technique_card') && item['type'] != 'technique_card'
      err.call("'#{path}' has `technique_card` but its type is '#{item['type'].to_s[0, 40]}'; a technique card item must have type \"technique_card\"")
    end
    if item['type'] == 'technique_card' && !item.key?('technique_card')
      err.call("'#{path}' is of type \"technique_card\" but has no `technique_card` naming a technique card registry entry")
    end
    next unless item.key?('technique_card')

    err.call("'#{path}' technique_card '#{key.to_s[0, 40]}' is not a key of the technique card registry (`techniques`)") unless key.is_a?(String) && registry.key?(key)
  end
end

# Warnings about the registry's use: ids that name a product, and an entry that fits only decoys.
def network_ops_check_registry_use(registry, weaknesses, decoys, services, warn)
  words = services.flat_map { |svc| svc['product'].to_s.downcase.scan(/[a-z0-9]+/) }.select { |w| w.length >= 3 }.to_set
  registry.each do |id, entry|
    next unless id.is_a?(String)

    hit = id.downcase.scan(/[a-z0-9]+/).find { |w| words.include?(w) }
    warn.call("technique card registry key '#{id[0, 40]}' holds '#{hit}', a word of a product name in the scenario; the key rides on the card item before the card is picked up") if hit
    fits = ->(rec) { BreakEscape::NetworkModel.technique_matches?(entry, rec[:service], rec[:entry]) }
    next unless weaknesses.none?(&fits) && decoys.any?(&fits)

    warn.call("technique card registry entry '#{id[0, 40]}' fits only decoys, no weakness; a card with no use")
  end
end

# One weakness: its grants, needs.session, and the warnings that read the cards. `granted` maps a
# credential id to the finding that grants it (two weaknesses granting one credential is an error).
def network_ops_check_weakness_grants(json_data, rec, registry, credentials, granted, have_cards, err, warn)
  weakness = rec[:entry]
  fid = rec[:finding_id].to_s[0, 120]
  where = "host '#{rec[:host_id].to_s[0, 40]}' service '#{rec[:service_name].to_s[0, 40]}' weakness '#{rec[:id].to_s[0, 40]}'"
  grants = weakness['grants']
  needs = weakness['needs'].is_a?(Hash) ? weakness['needs'] : {}
  if grants.is_a?(Hash)
    if grants['session'].is_a?(Hash)
      network_ops_check_session_grant(json_data, rec, where, grants['session'], needs, err, warn)
    end
    if grants.key?('credential')
      cid = grants['credential']
      entry = cid.is_a?(String) ? credentials[cid] : nil
      if !entry.is_a?(Hash)
        err.call("#{where}: grants.credential '#{cid.to_s[0, 40]}' names no entry in 'credentials'")
      else
        err.call("#{where}: grants.credential '#{cid[0, 40]}' is also granted by weakness '#{granted[cid][0, 120]}'; one credential has one granting weakness") if granted.key?(cid)
        granted[cid] ||= fid
        proof = entry['proof']
        unless proof.is_a?(Hash) && proof['technique_card'] == rec[:finding_id]
          err.call("#{where}: credential '#{cid[0, 40]}' must have proof { \"technique_card\": \"#{fid}\" } so that the two name each other")
        end
        err.call("#{where}: credential '#{cid[0, 40]}' is of kind '#{entry['kind'].to_s[0, 40]}'; a granted credential must be of kind saved_connection") unless entry['kind'] == 'saved_connection'
        network_ops_check_granted_use(json_data, where, cid, entry, err)
      end
    end
    if weakness.key?('fixedIf') && needs.empty?
      warn.call("#{where}: `fixedIf` is the only thing before the grant, and globals are client-synced, so it is a soft gate; add an item or credential need beside it where the grant matters")
    end
    unless registry.values.any? { |tech| BreakEscape::NetworkModel.technique_matches?(tech, rec[:service], weakness) }
      err.call("#{where}: has `grants` but no technique card registry entry matches it (class, product and version), so it could never be used")
    end
  else
    if have_cards
      warn.call("#{where}: grants nothing, so a technique card used on it is refused with no_grant; fine for a finding that is only there to be read or reported")
      warn.call("#{where}: has `needs` but grants nothing; the player is sent to fetch something that then opens nothing") unless needs.empty?
    end
  end
  if needs.key?('session') && rec[:host][:kind] != 'pc'
    err.call("#{where}: needs.session on a `hosts` entry; a device has no sessions, so the need could never be met")
    return
  end
  return unless needs.key?('session') && !(grants.is_a?(Hash) && grants['session'].is_a?(Hash))

  err.call("#{where}: needs.session is allowed only on a weakness that grants a session on this host (grants.session)")
end

# grants.session: only on a host with a sign-in, an account the host's access list admits, a level
# step up checked against needs.session, and the warnings about a sign-in the card could replace.
def network_ops_check_session_grant(json_data, rec, where, session, needs, err, warn)
  cm = BreakEscape::CredentialModel
  if rec[:host][:kind] != 'pc'
    err.call("#{where}: grants.session on a `hosts` entry; a session needs a host with a sign-in (lockType \"login\")")
    return
  end
  account = session['account']
  npc = cm.account_npc(json_data, account)
  if npc.nil?
    err.call("#{where}: grants.session.account '#{account.to_s[0, 40]}' is not an account holder (an NPC with creds)")
  elsif !cm.pc_admits_account?(rec[:host][:object], npc)
    err.call("#{where}: grants.session.account '#{account.to_s[0, 40]}' is not admitted by the access list of host '#{rec[:host_id].to_s[0, 40]}'")
  end
  if needs['session'] == 'admin' && session['access'] == 'user'
    err.call("#{where}: needs.session is \"admin\" but grants.session.access is \"user\"; a step up cannot grant less than it needs")
  end
  cred_loop = needs['credential'].is_a?(String) && json_data.dig('credentials', needs['credential']).is_a?(Hash) &&
              json_data.dig('credentials', needs['credential'], 'connectsTo') == rec[:host_id]
  warn.call("#{where}: grants a session on host '#{rec[:host_id].to_s[0, 40]}' but needs a credential that connects to that same host (only that is tested, not whether the host has another way in); the way in needs the way in (a loop)") if cred_loop
  if network_ops_signin_named?(json_data, rec[:host_id])
    warn.call("#{where}: grants a session on host '#{rec[:host_id].to_s[0, 40]}', which a sign-in task, a capture proof or a keyring session proof also names; a card can complete that step without the password. Gate a password-only step on the password item or credential")
  end
end

# A granted credential must be usable: its connectsTo PC allows remote sign-in, its policy accepts
# saved_connection and its access list admits the entry's account.
def network_ops_check_granted_use(json_data, where, cid, entry, err)
  cm = BreakEscape::CredentialModel
  pc = cm.sign_in_pc(json_data, entry['connectsTo'])
  return if pc.nil? # check_credentials reports a missing or unknown connectsTo

  policy = cm.policy_for(json_data, pc)
  if policy.is_a?(Hash) && policy['remote'] == 'blocked'
    err.call("#{where}: credential '#{cid[0, 40]}' connects to '#{pc['id'].to_s[0, 40]}', whose policy blocks remote sign-in; the granted entry could never be used")
  end
  unless cm.accepts?(policy, 'saved_connection')
    err.call("#{where}: credential '#{cid[0, 40]}' connects to '#{pc['id'].to_s[0, 40]}', whose policy does not accept saved_connection; the granted entry could never be used")
  end
  npc = cm.account_npc(json_data, entry['account'])
  return if npc.nil? || cm.pc_admits_account?(pc, npc)

  err.call("#{where}: credential '#{cid[0, 40]}' account is not admitted by the access list of '#{pc['id'].to_s[0, 40]}'; the granted entry could never be used")
end

# Does a sign-in task (an unlock_object task on the PC), a capture proof of kind session or a keyring
# `session` proof name this PC?
def network_ops_signin_named?(json_data, pc_id)
  found = false
  walk = lambda do |node, path|
    case node
    when Hash
      found = true if node['type'] == 'unlock_object' && node['targetObject'] == pc_id
      found = true if node.key?('captureProof') && Array(node['captureProof']).any? { |p| p.is_a?(Hash) && p['session'] == pc_id }
      found = true if path == 'credentials' && node.values.any? { |e| e.is_a?(Hash) && e['proof'].is_a?(Hash) && e['proof']['session'] == pc_id }
      node.each { |k, v| walk.call(v, path.empty? ? k.to_s : 'x') unless k.to_s.start_with?('_') || found }
    when Array then node.each { |v| walk.call(v, 'x') unless found }
    end
  end
  walk.call(json_data, '')
  found
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
