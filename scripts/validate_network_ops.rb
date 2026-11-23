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
NETWORK_OPS_BUILT = { 'N13' => false, 'N14' => false, 'N15' => false }.freeze

# Field => feature id, by where the field sits. `discovery` is checked by value (only "scan" does
# anything; "open" is the default).
NETWORK_OPS_TOP_LEVEL = { 'hosts' => 'N13', 'techniques' => 'N15' }.freeze
NETWORK_OPS_OBJECT_FIELDS = { 'services' => 'N13', 'technique_card' => 'N15' }.freeze
NETWORK_OPS_SERVICE_FIELDS = { 'weaknesses' => 'N14', 'decoys' => 'N14' }.freeze
NETWORK_OPS_DISCOVERY = 'N13'
NETWORK_OPS_WEAKNESS_GRANTS = 'N15'

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
  end

  issues
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
