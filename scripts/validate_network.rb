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
require_relative '../lib/break_escape/access_work'
require_relative '../lib/break_escape/declared_grants'
require_relative '../lib/break_escape/npc_habits/clues'

# Items that are physical things: taken down the wire from a remote desktop, they would
# arrive in the player's hand (7.2).
NETWORK_PHYSICAL_ITEM_TYPES = %w[key keycard lockpick lockpick_set rfid_cloner key-ring].freeze

def check_network_model(json_data, scenario_dir = nil)
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

  # ---- Port security (sub-slice P, section 5.4 / 9.2) ----
  # portSecurity is only valid on a networkJack; portSecurityMessage needs portSecurity;
  # a jack cannot be a secured port and a Wi-Fi access point at once (4.4).
  all_objects.each do |e|
    obj = e[:object]
    if obj['portSecurity'] && !nm.jack?(obj)
      err.call("'#{e[:path]}' has 'portSecurity' but is not a networkJack; port security is only valid on a jack.")
    end
    if obj.key?('portSecurityMessage') && !obj['portSecurity']
      err.call("'#{e[:path]}' has 'portSecurityMessage' without 'portSecurity': true.")
    elsif obj.key?('portSecurityMessage') && obj['portSecurityMessage'].to_s.strip.empty?
      warn.call("'#{e[:path]}' has a blank 'portSecurityMessage'; the default refusal line is shown instead. " \
                'Remove the field, or write the line the switch should show.')
    end
    if obj['portSecurity'] && obj['wifiAp']
      err.call("'#{e[:path]}' is both 'portSecurity' and 'wifiAp'; a jack cannot be a secured port and an access point.")
    end
  end

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

  # ---- Wi-Fi (slice 9.3b sub-slice W, 5.3 and 9.2) ----
  networks.each do |net_id, net|
    wifi = net['wifi']
    next unless wifi

    unless wifi.is_a?(Hash)
      err.call("'networks/#{net_id}/wifi' must be an object { ssid, psk }.")
      next
    end
    err.call("'networks/#{net_id}/wifi' has no 'ssid'.") unless nm.present_string?(wifi['ssid'])
    err.call("'networks/#{net_id}/wifi' psk must be a string.") if wifi.key?('psk') && !wifi['psk'].is_a?(String)
    if wifi['psk'].is_a?(String) && !wifi['psk'].empty? && wifi['psk'].strip.empty?
      err.call("'networks/#{net_id}/wifi' psk is only whitespace; omit the key or use '' for an open network " \
               '(the server treats a blank psk as open, so a whitespace key would never be asked for).')
    end
  end
  readable = BreakEscape::NpcHabits::Clues.readable_texts(json_data, scenario_dir).map { |t| t[:text].to_s }.join("\n")
  networks.each do |net_id, net|
    wifi = net['wifi']
    psk = wifi.is_a?(Hash) ? wifi['psk'] : nil
    next unless psk.is_a?(String) && !psk.strip.empty?

    warn.call("'networks/#{net_id}/wifi' psk is shorter than eight characters.") if psk.length < 8
    unless readable.include?(psk)
      warn.call("'networks/#{net_id}/wifi' psk appears nowhere the player can read (a note, a document or ink); " \
                'the key is a lock secret the player must be able to find.')
    end
  end
  all_objects.each do |e|
    obj = e[:object]
    next unless obj['wifiAp'] == true

    where = "'#{label.call(obj, e[:path])}'"
    net = nm.network_of(obj, rooms[e[:room]])
    if net.nil?
      err.call("#{where} has 'wifiAp' but no network of its own or from its room.")
    elsif !networks.key?(net) || nm.wifi_of(json_data, net).nil?
      err.call("#{where} has 'wifiAp' but its network '#{net}' defines no 'wifi' block.")
    end
    err.call("#{where} is a sign-in object (lockType \"login\") with 'wifiAp'; an access point is not a sign-in host.") if nm.sign_in_object?(obj)
    err.call("#{where} is a network jack with 'wifiAp'; an object is one or the other.") if nm.jack?(obj)
    if obj['locked'] == true || obj.key?('lockType')
      err.call("#{where} has 'wifiAp' and a lock; an access point's click is the join flow, which runs before any lock.")
    end
  end

  # ---- Links and the pivot (slice 9.3b sub-slice K, 5.1 and 9.2) ----
  links_raw = json_data['networkLinks']
  if links_raw && !links_raw.is_a?(Array)
    err.call("'networkLinks' must be a list of two-item [networkA, networkB] lists.")
  elsif links_raw.is_a?(Array)
    links_raw.each_with_index do |entry, i|
      where = "networkLinks[#{i}]"
      unless entry.is_a?(Array) && entry.length == 2 && entry.all? { |v| v.is_a?(String) }
        err.call("'#{where}' must be a two-item list of network ids.")
        next
      end
      a, b = entry
      err.call("'#{where}' links a network to itself ('#{a}').") if a == b
      [a, b].each do |net|
        err.call("'#{where}' network '#{net}' names no entry in 'networks'.") unless networks.key?(net)
      end
    end
  end

  jacked_nets = jacks.map { |j| j[:network] }.compact.to_set
  host_on = ->(net) { nm.sign_in_objects_on(net, json_data).any? }
  carries = ->(net) { host_on.call(net) || nm.resources_on(net, json_data).any? }
  # A network reachable only through a pivot but with no host to open the pivot session.
  networks.each_key do |net_id|
    next if jacked_nets.include?(net_id) || !carries.call(net_id)

    paths = jacked_nets.flat_map { |src| nm.all_reach_paths(json_data, src, net_id) }
    next if paths.empty? # unreachable by a pivot too: the no-jack info line covers it

    # Judged per path (review K R2 m1): a path is usable only when every network before the
    # target carries a sign-in host to open the next hop's pivot session; the target needs none.
    next if paths.any? { |path| path[0..-2].all? { |net| host_on.call(net) } }

    warn.call("network '#{net_id}' is reachable only by pivoting over a link, but no network on the way to it has " \
              'a sign-in host a foothold can use to open the pivot session; it can never be reached.')
  end
  # More than eight simple paths between two networks that both carry hosts or resources.
  net_ids = networks.keys
  net_ids.combination(2).each do |a, b|
    next unless carries.call(a) && carries.call(b)

    count = nm.all_reach_paths(json_data, a, b).length
    next if count <= BreakEscape::NetworkModel::REACH_PATHS_CAP

    # all_reach_paths stops at REACH_PATHS_CEILING, so a count at the ceiling may understate
    # the true total; word it "at least" so a very dense graph is not reported as exact.
    ceiling = BreakEscape::NetworkModel::REACH_PATHS_CEILING
    shown = count >= ceiling ? "at least #{ceiling}" : count.to_s
    warn.call("networks '#{a}' and '#{b}' are joined by #{shown} link paths; the pivot keeps only the first " \
              "#{BreakEscape::NetworkModel::REACH_PATHS_CAP}. Simplify the link graph.")
  end

  # ---- Outages (slice 9.3b sub-slice O, 5.2 and 9.2) ----
  # A network downIf names a global; the network is down while it is truthy. The value must be
  # a string, and the global should be declared. 9.2 owns the resource downIf checks
  # (validate_access_work.rb); this adds the network side and the start-down open-share warning.
  decl_globals = json_data['globalVariables'].is_a?(Hash) ? json_data['globalVariables'] : {}
  networks.each do |net_id, net|
    next unless net.key?('downIf')

    dn = net['downIf']
    unless dn.is_a?(String)
      err.call("'networks/#{net_id}/downIf' must be a string naming a global.")
      next
    end
    next if dn.strip.empty?

    warn.call("networks.#{net_id}.downIf '#{dn}' is not declared in globalVariables.") unless decl_globals.key?(dn)
  end
  # An open share with contents on a network whose downIf default is truthy (it starts down): a
  # browser can write the global false, so a secret that must not be read early needs a session
  # as well, not an outage alone.
  net_starts_down = lambda do |net_id|
    net = networks[net_id]
    dn = net.is_a?(Hash) ? net['downIf'] : nil
    nm.present_string?(dn) && nm.truthy?(decl_globals[dn])
  end
  resources.each do |res_id, res|
    next unless res['kind'] == 'file_share' && res['access'].nil? && nm.resource_contents?(res)

    net = res['network']
    next unless net.is_a?(String) && net_starts_down.call(net)

    warn.call("open share '#{res_id}' with contents is on network '#{net}', which starts down (its downIf default is " \
              'truthy); a browser can set that global false, so a secret that must not be read early needs an ' \
              'account-gated share or a session as well, not an outage alone.')
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
    elsif res.key?('contents') && !res['contents'].is_a?(Array)
      # The engine reads a non-list contents as none (NetworkModel.listed_only_share?), so a
      # typo would turn an openable share into a listed-only one without a word.
      kind = { Hash => 'an object', String => 'a string', NilClass => 'null' }.fetch(res['contents'].class, 'a value')
      warn.call("'resources/#{res_id}' contents is #{kind}, not a list; " \
                'the share is treated as listed only (nothing to open). Use a list of items, or [] for none.')
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

  # ---- Implants: grant_foothold actions (sub-slice I, 5.5 and 9.2) ----
  # Walk the scenario, carrying the nearest object that owns an action list as the action's
  # host, and test each grant_foothold against the same DeclaredGrants.executed? rule the
  # server's NetworkModel.grant_foothold_actions uses, so the two agree on "declared".
  # onConfirm is a server-run action list on its confirm_action object (DeclaredGrants.executed?),
  # so it hosts its actions like the object keys do. timers are handled below: each timer element
  # is carried as the host of its own actions, so the two session-shape guards do not go dark for a
  # grant_foothold placed in a timer or onConfirm (review R2 m2).
  host_action_keys = %w[triggerOnInteract onInteract conditionalActions completionActions onConfirm].freeze
  grant_entries = [] # { node:, keys:, path:, host: }
  gf_walk = lambda do |node, keys, host|
    case node
    when Array
      node.each_with_index { |n, i| gf_walk.call(n, keys + [i], host) }
    when Hash
      grant_entries << { node: node, keys: keys, path: BreakEscape::DeclaredGrants.path_string(keys), host: host } if node['type'] == 'grant_foothold'
      node.each do |k, v|
        if k.to_s == 'timers' && v.is_a?(Array)
          v.each_with_index { |timer, i| gf_walk.call(timer, keys + ['timers', i], timer.is_a?(Hash) ? timer : host) }
        else
          gf_walk.call(v, keys + [k.to_s], host_action_keys.include?(k.to_s) ? node : host)
        end
      end
    end
  end
  gf_walk.call(json_data, [], nil)

  # Every item a needsHeld could name (room objects, NPC items, start items, declared
  # grants and resource contents), with each id/type/name mapped to its object so the USB
  # warning can read the named device's usbClass.
  item_refs = Set.new
  item_by_ref = {}
  add_item_ref = lambda do |item|
    next unless item.is_a?(Hash)

    %w[id type name].each do |f|
      next unless nm.present_string?(item[f])

      item_refs << item[f].to_s
      item_by_ref[item[f].to_s] ||= item
    end
  end
  all_objects.each { |e| add_item_ref.call(e[:object]) }
  Array(json_data['startItemsInInventory']).each { |item| add_item_ref.call(item) }
  BreakEscape::DeclaredGrants.for(json_data).each { |grant| add_item_ref.call(grant['item']) }
  resources.each_value { |res| walk_items.call(res['contents'], 'contents') { |item, _p| add_item_ref.call(item) } }

  signin_on_network = ->(pc_id) { hosts.find { |h| h[:object]['id'].to_s == pc_id.to_s } }
  seen_pc_shape = {}
  grant_entries.each do |entry|
    node = entry[:node]
    path = entry[:path]
    where = "grant_foothold at '#{path}'"
    unless BreakEscape::DeclaredGrants.executed?(entry[:keys])
      err.call("#{where} is on a path the engine does not run server-side (e.g. under flagRewards or eventMappings); " \
               'a grant_foothold must sit on a timer, triggerOnInteract, onInteract, conditionalActions, completionActions or onConfirm.')
      next
    end
    dropped = node.key?('needsDropped')
    session = node['needsSession'] == true
    if dropped && session
      err.call("#{where} sets both 'needsDropped' and 'needsSession'; it must be one shape or the other.")
    elsif !dropped && !session
      err.call("#{where} sets neither 'needsDropped' nor 'needsSession'; it must be one or the other.")
    end
    shape = session ? 'session' : 'dropped'
    pc = node['pc']
    if !nm.present_string?(pc) || !signin_on_network.call(pc)
      err.call("#{where} names pc '#{pc}', which is not a sign-in object (lockType \"login\") on a network.")
    end
    key = [pc.to_s, shape]
    if seen_pc_shape[key]
      err.call("#{where} and '#{seen_pc_shape[key]}' are both grant_foothold for pc '#{pc}' with the same shape; the " \
               'route cannot tell them apart. Give the PC one action per shape.')
    else
      seen_pc_shape[key] = path
    end
    if session
      needs_held = node['needsHeld']
      if !nm.present_string?(needs_held)
        err.call("#{where} is a 'needsSession' action with no 'needsHeld'; name the device the player plugs in.")
      elsif !item_refs.include?(needs_held.to_s)
        err.call("#{where} 'needsHeld' names '#{needs_held}', which is no item in the scenario.")
      end
      host = entry[:host]
      if host.is_a?(Hash) && host['id'].to_s == pc.to_s
        err.call("#{where} is a 'needsSession' action on the sign-in PC it targets; a sign-in PC never runs its own " \
                 'actions, so it must sit on a separate desk-side prop.')
      end
      if host.is_a?(Hash) && host['consumesItem'] == true
        err.call("#{where} is a 'needsSession' action whose host object sets 'consumesItem'; the server removes " \
                 "'needsHeld' itself, and a client consume would race it. Drop consumesItem.")
      end
      # consumedId is keyed on the device's id, and syncInventoryFromServer keys tray items on id,
      # so an id-less device can never be reconciled off the tray (review R2 m1).
      held_item = item_by_ref[needs_held.to_s]
      if held_item.is_a?(Hash) && !nm.present_string?(held_item['id'])
        err.call("#{where} 'needsHeld' names '#{needs_held}', whose device object has no 'id'; the implant is " \
                 'reconciled by id, so an id-less device would stay in the tray. Give the device an id.')
      end
      # USB policy warning: the target PC would refuse its own device.
      pc_obj = signin_on_network.call(pc)&.dig(:object)
      if held_item && pc_obj && BreakEscape::AccessWork.plant_refused?(json_data, pc_obj, held_item)
        warn.call("#{where} targets pc '#{pc}', whose USB policy refuses the usbClass of '#{needs_held}', so the " \
                  'implant can never be used there.')
      end
    end
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
  # Link reach: for each network with a link, the networks a pivot reaches from it, and a
  # sign-in host on it that can bridge (the pivot session is opened at a host on the network).
  networks.keys.sort.each do |net_id|
    reached = nm.networks(json_data).keys.select do |other|
      other != net_id && nm.all_reach_paths(json_data, net_id, other).any?
    end
    next if reached.empty?

    host_ids = nm.sign_in_objects_on(net_id, json_data).map { |h| h[:object]['id'] || h[:path] }
    via = host_ids.empty? ? 'no sign-in host to pivot through' : "pivot hosts #{quote_list.call(host_ids)}"
    info << "ℹ️ Link reach: from '#{net_id}' a pivot reaches #{quote_list.call(reached)}; #{via}"
  end
  # Outages: each network and resource with a downIf, and its declared starting state (5.2).
  networks.keys.sort.each do |net_id|
    dn = networks[net_id]['downIf']
    next unless nm.present_string?(dn)

    info << "ℹ️ Outage: network '#{net_id}' is down while '#{dn}' is truthy; it starts #{nm.truthy?(decl_globals[dn]) ? 'down' : 'up'}."
  end
  resources.keys.sort.each do |res_id|
    dn = resources[res_id]['downIf']
    next unless nm.present_string?(dn)

    info << "ℹ️ Outage: resource '#{res_id}' is down while '#{dn}' is truthy; it starts #{nm.truthy?(decl_globals[dn]) ? 'down' : 'up'}."
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
