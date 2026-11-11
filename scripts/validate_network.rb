# frozen_string_literal: true

# Networks (docs/achitechture/ACCESS_MODEL_SLICE_9_3_PLAN.md, section 7.2): jacks, rogue
# devices, headless hosts, resources and shares. One entry point, check_network_model,
# called by scripts/validate_scenario.rb beside check_access_model. The rules come from
# BreakEscape::NetworkModel (membership, jacks, hosts and resources on a network, sorted by
# id, hosts before resources) and BreakEscape::AccessIdentities (roles, accounts), so the
# validator agrees with the server. Messages never quote a password.
require 'json'
require 'set'
require_relative '../lib/break_escape/network_model'
require_relative '../lib/break_escape/access_identities'
require_relative '../lib/break_escape/declared_grants'

# Fields reserved for slice 9.3b (3.1). 9.3a refuses them.
NETWORK_RESERVED_OBJECT_FIELDS = %w[wifiAp portSecurity portSecurityMessage].freeze
NETWORK_RESERVED_NETWORK_FIELDS = %w[downIf wifi].freeze

# Items that are physical things: taken down the wire from a remote desktop, they would
# arrive in the player's hand (7.2).
NETWORK_PHYSICAL_ITEM_TYPES = %w[key keycard lockpick lockpick_set rfid_cloner key-ring].freeze

def check_network_model(json_data)
  issues = []
  return issues unless json_data.is_a?(Hash)

  nm = BreakEscape::NetworkModel
  ai = BreakEscape::AccessIdentities
  err = ->(msg) { issues << "❌ ERROR: network model: #{msg}" }
  warn = ->(msg) { issues << "⚠️ WARNING: network model: #{msg}" }
  info = []

  networks = nm.networks(json_data)
  resources = nm.resources(json_data)
  rooms = json_data['rooms'].is_a?(Hash) ? json_data['rooms'] : {}
  policies = json_data['policies'].is_a?(Hash) ? json_data['policies'] : {}
  profiles = json_data['accountProfiles'].is_a?(Hash) ? json_data['accountProfiles'] : {}
  objects = nm.room_objects(json_data)
  all_objects = ai.room_objects(json_data) # also NPC items, and under sign-in objects
  room_npcs = ai.room_npcs(json_data)
  npc_ids = room_npcs.map { |e| e[:npc]['id'].to_s }.to_set
  accounts = room_npcs.select { |e| ai.account?(e[:npc]) }
  roles_held = room_npcs.flat_map { |e| ai.identity_roles(e[:npc]) }.to_set
  label = ->(obj, fallback) { obj['id'] || fallback }
  effective_policy = lambda do |pc|
    name = pc['policy'].is_a?(String) && !pc['policy'].empty? ? pc['policy'] : json_data['defaultPolicy']
    policy = name.is_a?(String) ? policies[name] : nil
    policy.is_a?(Hash) ? policy : {}
  end
  quote_list = ->(ids) { ids.map { |id| "'#{id}'" }.join(', ') }

  # ---- Reserved for 9.3b (3.1) ----
  err.call("top-level 'networkLinks' needs slice 9.3b.") if json_data.key?('networkLinks')
  networks.each do |net_id, net|
    NETWORK_RESERVED_NETWORK_FIELDS.each do |field|
      err.call("'networks/#{net_id}' has '#{field}', which needs slice 9.3b.") if net.key?(field)
    end
  end
  all_objects.each do |e|
    NETWORK_RESERVED_OBJECT_FIELDS.each do |field|
      err.call("'#{e[:path]}' has '#{field}', which needs slice 9.3b.") if e[:object].key?(field)
    end
  end
  find_grant_foothold = lambda do |node, path|
    case node
    when Array then node.each_with_index { |n, i| find_grant_foothold.call(n, "#{path}[#{i}]") }
    when Hash
      err.call("'#{path}' is a 'grant_foothold' action, which needs slice 9.3b.") if node['type'] == 'grant_foothold'
      node.each { |k, v| find_grant_foothold.call(v, path.empty? ? k.to_s : "#{path}/#{k}") }
    end
  end
  find_grant_foothold.call(json_data, '')

  # ---- Network references ----
  net_ref = lambda do |value, where|
    next if value.nil?
    next if value.is_a?(String) && networks.key?(value)

    err.call("'#{where}' network '#{value}' names no entry in 'networks'.")
  end
  rooms.each { |room_id, room| net_ref.call(room['network'], "rooms/#{room_id}") if room.is_a?(Hash) && room.key?('network') }
  all_objects.each { |e| net_ref.call(e[:object]['network'], e[:path]) if e[:object].key?('network') }
  resources.each { |res_id, res| net_ref.call(res['network'], "resources/#{res_id}") if res.key?('network') }

  # ---- Jacks (3.3) ----
  jack_entries = []
  find_jacks = lambda do |node, path|
    case node
    when Array then node.each_with_index { |n, i| find_jacks.call(n, "#{path}[#{i}]") }
    when Hash
      jack_entries << [node, path] if nm.jack?(node)
      node.each { |k, v| find_jacks.call(v, path.empty? ? k.to_s : "#{path}/#{k}") }
    end
  end
  find_jacks.call(rooms, 'rooms')
  find_jacks.call(profiles, 'accountProfiles')
  find_jacks.call(resources, 'resources')
  find_jacks.call(json_data['startItemsInInventory'], 'startItemsInInventory') if json_data['startItemsInInventory'].is_a?(Array)
  top_level_jack = %r{\Arooms/[^/]+/objects\[\d+\]\z}
  jack_entries.each do |jack, path|
    where = "jack '#{label.call(jack, path)}'"
    unless path.match?(top_level_jack)
      err.call("#{where} at '#{path}' is inside a container, a profile or a share; a jack must be a room object.")
    end
    err.call("#{where} is a sign-in object (lockType \"login\"); a jack's click is the plant flow.") if nm.sign_in_object?(jack)
    %w[triggerOnInteract requiresItem locked lockType].each do |field|
      next unless jack.key?(field)
      next if field == 'locked' && jack['locked'] == false

      err.call("#{where} has '#{field}'; a jack takes none: its click is the plant flow.")
    end
    err.call("#{where} is takeable; a jack must stay where it is.") if jack['takeable'] == true
  end
  jacks = nm.jacks(json_data)
  jacks.each do |entry|
    next if entry[:network]

    err.call("jack '#{label.call(entry[:object], entry[:path])}' has no network of its own or from its room.")
  end

  # ---- Rogue devices (3.3) ----
  device_entries = []
  all_objects.each { |e| device_entries << [e[:object], e[:path], e[:path].include?('/itemsHeld') ? :npc : :room] }
  Array(json_data['startItemsInInventory']).each_with_index do |item, i|
    device_entries << [item, "startItemsInInventory[#{i}]", :start] if item.is_a?(Hash)
  end
  BreakEscape::DeclaredGrants.for(json_data).each { |grant| device_entries << [grant['item'], grant['path'], :grant] }
  device_entries.select! { |item, _path, _home| nm.rogue_device?(item) }
  device_entries.each do |item, path, home|
    where = "rogue device at '#{path}'"
    err.call("#{where} has no 'id'; the server finds a planted device by its id.") unless nm.present_string?(item['id'])
    if item['takeable'] == false || (home == :room && item['takeable'] != true)
      err.call("#{where} is not takeable; a rogue device is carried to the jack.")
    end
    if item['droppable'] == true
      err.call("#{where} is droppable; a dropped item stays in the server's inventory, so the device could be " \
               'in a room and in a jack at once.')
    end
  end
  device_refs = device_entries.flat_map { |item, _p, _h| [item['id'], item['name'], item['type']] }.compact.map(&:to_s).to_set
  all_objects.each do |e|
    obj = e[:object]
    next unless obj.key?('requiresItem') && obj['consumesItem'] == true

    named = Array(obj['requiresItem']).map(&:to_s) & device_refs.to_a
    next if named.empty?

    err.call("'#{e[:path]}' requires and consumes #{quote_list.call(named)}, a rogue device: it would be used up " \
             'there and could never reach a jack.')
  end
  if jacks.any? && device_entries.empty?
    warn.call("the scenario has a jack (#{quote_list.call(jacks.map { |j| label.call(j[:object], j[:path]) })}) " \
              "but no item with \"rogueDevice\": true, so nothing can be planted.")
  end
  if device_entries.any? && jacks.empty?
    warn.call("the scenario has a rogue device (#{quote_list.call(device_entries.map { |i, p, _| i['id'] || p })}) " \
              'but no jack to plant it in.')
  end

  # ---- Headless hosts (3.4) ----
  all_objects.each do |e|
    obj = e[:object]
    next unless obj.key?('headless') && obj['headless'] != false

    where = "'#{label.call(obj, e[:path])}'"
    unless nm.sign_in_object?(obj)
      err.call("#{where} has 'headless' but is not lockType \"login\"; only a sign-in object can be headless.")
      next
    end
    room = rooms[e[:room]]
    err.call("headless host #{where} has no network of its own or from its room; it could never be reached.") unless nm.network_of(obj, room)
    if ai.owner_id(obj, json_data)
      err.call("headless host #{where} is a workstation with an owner (screenOwner or an NPC's needsHome); a " \
               'headless host has no screen for anyone to sit at.')
    end
  end

  # ---- Policies ----
  policies.each do |policy_id, policy|
    next unless policy.is_a?(Hash) && policy.key?('remote')
    next if %w[allowed blocked].include?(policy['remote'])

    err.call("'policies/#{policy_id}' remote '#{policy['remote']}' must be \"allowed\" or \"blocked\".")
  end

  # ---- Resources (3.4, 4.5) ----
  resources.each do |res_id, res|
    if res.key?('contents') && res['kind'] != 'file_share'
      err.call("'resources/#{res_id}' has contents but kind '#{res['kind']}'; only a file_share holds contents.")
    end
  end

  # Resource ids and content ids against room objects, profile items and other resources.
  shadow_names = Hash.new { |h, k| h[k] = [] } # value => [where it is an id or a name]
  all_objects.each do |e|
    %w[id name].each { |f| shadow_names[e[:object][f].to_s] << "room object '#{e[:path]}'" if nm.present_string?(e[:object][f]) }
  end
  walk_items = lambda do |list, path, &blk|
    next unless list.is_a?(Array)

    list.each_with_index do |item, i|
      next unless item.is_a?(Hash)

      blk.call(item, "#{path}[#{i}]")
      walk_items.call(item['contents'], "#{path}[#{i}]/contents", &blk)
    end
  end
  profiles.each do |profile_id, profile|
    next unless profile.is_a?(Hash)

    walk_items.call(profile['contents'], "accountProfiles/#{profile_id}/contents") do |item, path|
      %w[id name].each { |f| shadow_names[item[f].to_s] << "profile item '#{path}'" if nm.present_string?(item[f]) }
    end
  end
  share_entries = [] # [id, path, resource id, item or nil]
  resources.each do |res_id, res|
    share_entries << [res_id, "resources/#{res_id}", res_id, nil]
    walk_items.call(res['contents'], "resources/#{res_id}/contents") do |item, path|
      share_entries << [item['id'], path, res_id, item]
      if nm.sign_in_object?(item)
        err.call("'#{path}' is a sign-in object (lockType \"login\") inside a resource's contents; a sign-in host " \
                 'is a room object.')
      end
    end
  end
  share_entries.each do |id, path, res_id, _item|
    next unless nm.present_string?(id)

    clashes = shadow_names[id.to_s].dup
    share_entries.each do |other_id, other_path, other_res, other_item|
      next if other_path == path

      clashes << "resource entry '#{other_path}'" if other_id.to_s == id.to_s
      clashes << "resource entry '#{other_path}'" if other_item && other_res != res_id && other_item['name'].to_s == id.to_s
    end
    next if clashes.empty?

    err.call("'#{path}' id '#{id}' is also the id or name of #{clashes.uniq.join(', ')}. The server matches a " \
             'share item on id or name after rooms and profiles, so the other would shadow it. Ids are global.')
  end

  # Access lists on resources: people must be room NPCs, roles should be held by someone.
  resources.each do |res_id, res|
    next unless res.key?('access')

    acl = res['access']
    where = "resources/#{res_id}/access"
    unless acl.is_a?(Hash)
      err.call("'#{where}' access list must be an object { roles, people }.")
      next
    end
    Array(acl['people']).each do |person|
      err.call("'#{where}' names unknown person '#{person}' (people must be room NPC ids).") unless npc_ids.include?(person.to_s)
    end
    Array(acl['roles']).each do |role|
      warn.call("'#{where}' admits role '#{role}', which no NPC holds.") unless roles_held.include?(role.to_s)
    end
  end

  # Passwords in the strings every foothold's view shows.
  passwords = accounts.filter_map do |e|
    pw = e[:npc]['creds']['password']
    [e[:npc]['id'], pw] if pw.is_a?(String) && !pw.empty?
  end
  shown = []
  networks.each { |net_id, net| shown << ["networks/#{net_id}/name", net['name']] }
  resources.each { |res_id, res| %w[name host observations].each { |f| shown << ["resources/#{res_id}/#{f}", res[f]] } }
  shown.each do |where, text|
    next unless text.is_a?(String)

    passwords.each do |npc_id, pw|
      next unless text.include?(pw)

      err.call("NPC '#{npc_id}' creds.password appears in '#{where}', which every foothold's view shows. A clue " \
               'belongs in the text of an item.')
    end
  end

  # ---- Hosts ----
  hosts = objects.select { |e| nm.sign_in_object?(e[:object]) && e[:network] && networks.key?(e[:network]) }
  account_admitted_at = ->(pc, npc) { ai.account_admitted?(pc, npc) }
  share_admits = ->(res, npc) { res['access'].nil? || ai.acl_admits?(res['access'], npc) }

  # Doors skipped: remote sign-in reaches a PC in a locked room from a jack outside it.
  hosts.each do |e|
    pc = e[:object]
    room = rooms[e[:room_id]]
    next if nm.headless?(pc)
    next unless room.is_a?(Hash) && room['locked'] == true
    next if effective_policy.call(pc).key?('remote')

    outside = jacks.select { |j| j[:network] == e[:network] && j[:room_id] != e[:room_id] }
    next if outside.empty?

    warn.call("sign-in PC '#{label.call(pc, e[:path])}' sits in locked room '#{e[:room_id]}' on network " \
              "'#{e[:network]}', which has a jack outside that room (#{quote_list.call(outside.map { |j| label.call(j[:object], j[:path]) })}). " \
              'Remote sign-in reaches it without the door. Write "remote": "allowed" in its policy to acknowledge ' \
              'the route, or "blocked" to close it.')
  end

  # A listed-only share (no contents) is mapped on no desktop, so an access list on it does nothing.
  resources.each do |res_id, res|
    next unless nm.listed_only_share?(res) && res['access'].is_a?(Hash)

    warn.call("share '#{res_id}' has an access list and no contents: no desktop maps it, and every foothold " \
              'on its network sees its observations. Give it contents, or drop the list.')
  end

  # Shares nobody can map.
  resources.each do |res_id, res|
    next unless res['kind'] == 'file_share' && res['access'].is_a?(Hash)
    next if nm.listed_only_share?(res)

    net = res['network']
    on_net = net.is_a?(String) ? hosts.select { |h| h[:network] == net } : []
    admitted = accounts.select { |a| share_admits.call(res, a[:npc]) }
    if on_net.empty?
      warn.call("share '#{res_id}' has an access list but no sign-in object on its network can map it, so no " \
                'desktop will ever show it.')
    elsif admitted.empty?
      warn.call("share '#{res_id}' has an access list that admits no account.")
    elsif admitted.none? { |a| on_net.any? { |h| account_admitted_at.call(h[:object], a[:npc]) } }
      warn.call("share '#{res_id}' admits #{quote_list.call(admitted.map { |a| a[:npc]['id'] })}, but none of them " \
                'can sign in at an object on its network.')
    end
  end

  # Two hosts with one label.
  host_label = ->(pc) { nm.present_string?(pc['host']) ? pc['host'] : pc['name'].to_s }
  hosts.group_by { |h| host_label.call(h[:object]) }.each do |host, list|
    next if host.empty? || list.size < 2

    warn.call("sign-in objects #{quote_list.call(list.map { |h| label.call(h[:object], h[:path]) })} share the host " \
              "label '#{host}'; a network view would list two hosts the player cannot tell apart.")
  end

  # Physical items on a host's desktop.
  hosts.each do |e|
    walk_items.call(e[:object]['contents'], "#{e[:path]}/contents") do |item, path|
      next unless NETWORK_PHYSICAL_ITEM_TYPES.include?(item['type'].to_s)

      warn.call("'#{path}' is a #{item['type']} on the desktop of host '#{label.call(e[:object], e[:path])}'; over " \
                'the network it would be taken down the wire.')
    end
  end

  # Remote-only hosts under a lockout policy.
  reachable_rooms = Set.new
  start = json_data['startRoom']
  queue = rooms.key?(start) ? [start] : []
  until queue.empty?
    room_id = queue.shift
    next if reachable_rooms.include?(room_id)

    reachable_rooms << room_id
    conns = rooms[room_id].is_a?(Hash) ? rooms[room_id]['connections'] : nil
    next unless conns.is_a?(Hash)

    conns.each_value { |v| Array(v).each { |t| queue << t if t.is_a?(String) && rooms.key?(t) } }
  end
  hosts.each do |e|
    pc = e[:object]
    remote_only = nm.headless?(pc) || (!start.nil? && !reachable_rooms.include?(e[:room_id]))
    next unless remote_only
    next if effective_policy.call(pc)['remote'] == 'blocked'

    max = effective_policy.call(pc)['maxAttempts']
    next unless ai.positive_number?(max)

    warn.call("host '#{label.call(pc, e[:path])}' can be signed in to only over the network, under a policy with " \
              "maxAttempts #{max}: a lockout lasts the mission and there is no keyboard to fall back on.")
  end

  # An authored actions list shows before the jack or the sign-in host branch.
  (jacks + hosts).uniq { |e| e[:path] }.each do |e|
    next unless e[:object].key?('actions')

    kind = nm.jack?(e[:object]) ? 'jack' : 'sign-in host'
    warn.call("#{kind} '#{label.call(e[:object], e[:path])}' has an 'actions' list; the object action menu runs " \
              'first and would show before its own flow.')
  end

  # ---- Information lines ----
  names_on = lambda do |net_id|
    host_ids = nm.sign_in_objects_on(net_id, json_data).map { |h| h[:object]['id'] || h[:path] }
    res_ids = nm.resources_on(net_id, json_data).map(&:first)
    [host_ids, res_ids]
  end
  jacks.each do |j|
    next unless j[:network] && networks.key?(j[:network])

    host_ids, res_ids = names_on.call(j[:network])
    hosts_txt = host_ids.empty? ? 'no hosts' : "hosts #{quote_list.call(host_ids)}"
    res_txt = res_ids.empty? ? 'no resources' : "resources #{quote_list.call(res_ids)}"
    info << "ℹ️ Network reach: jack '#{label.call(j[:object], j[:path])}' on '#{j[:network]}' lists #{hosts_txt}; #{res_txt}"
  end
  resources.keys.sort.each do |res_id|
    res = resources[res_id]
    next unless res['kind'] == 'file_share' && res['access'].is_a?(Hash) && res['network'].is_a?(String)
    next if nm.listed_only_share?(res)

    pcs = nm.sign_in_objects_on(res['network'], json_data).reject { |h| nm.headless?(h[:object]) }
    pairs = pcs.filter_map do |h|
      admitted = accounts.select { |a| share_admits.call(res, a[:npc]) && account_admitted_at.call(h[:object], a[:npc]) }
      next if admitted.empty?

      "'#{label.call(h[:object], h[:path])}' (#{admitted.map { |a| a[:npc]['id'] }.join(', ')})"
    end
    next if pairs.empty?

    info << "ℹ️ Reachable without a foothold: share '#{res_id}' maps on #{pairs.join(', ')}"
  end
  hosts.sort_by { |h| h[:object]['id'].to_s }.each do |h|
    next if nm.headless?(h[:object])
    room = rooms[h[:room_id]]
    next if room.is_a?(Hash) && room['locked'] == true

    info << "ℹ️ Reachable without a foothold: sign-in host '#{label.call(h[:object], h[:path])}' in open room '#{h[:room_id]}'"
  end
  networks.keys.sort.each do |net_id|
    next if jacks.any? { |j| j[:network] == net_id }

    host_ids, res_ids = names_on.call(net_id)
    next if host_ids.empty? && res_ids.empty?

    info << "ℹ️ Network '#{net_id}' has hosts or resources and no jack (it may exist only for NPC work)"
  end

  issues + info
end
