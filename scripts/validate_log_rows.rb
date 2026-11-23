# frozen_string_literal: true

# Ops log sources (docs/achitechture/OPS_LOG_ROWS_PLAN.md, sections 4.1 and 9), stage L1a: the
# `logSources` block. One entry point, check_log_rows, called by scripts/validate_scenario.rb. The event
# list is read from lib/break_escape/ops_log_events.rb, the file the helper (BreakEscape::OpsLog) checks
# against, so the validator and the server agree on which events exist. Seed rows, readers and the graph
# are L2 and not checked here. Messages never quote a password.
require 'json'
require 'set'
require_relative '../lib/break_escape/ops_log_events'
require_relative '../lib/break_escape/capture_model'

LOG_SOURCE_ID = /\A[a-z][a-z0-9_]{0,39}\z/.freeze
LOG_STORED_ID = /\A[A-Za-z0-9_.:-]+\z/.freeze
LOG_MAX_SOURCES = 30
LOG_MAX_TOTAL_ROWS = 300
LOG_MIN_SOURCE_ROWS = 10
LOG_MAX_SOURCE_ROWS = 150
LOG_DEFAULT_SOURCE_ROWS = 50
LOG_MAX_TITLE = 40
LOG_MAX_ID = 40
LOG_MAX_USERNAME = 32
LOG_MAX_SAVE_KEYS = 256
LOG_CAPTURE_KEYS = %w[capture addCapture usePayload].freeze # Game::CAPTURE_SECRET_KEYS
LOG_ID_MAPS = %w[rooms networks resources accountProfiles credentials logSources].freeze

# events: the registry to check against (the shipped one unless a test passes its own).
# kinds: the place kinds an event can name.
def check_log_rows(json_data, events: BreakEscape::OpsLogEvents::EVENTS, kinds: BreakEscape::OpsLogEvents::KINDS)
  issues = []
  return issues unless json_data.is_a?(Hash) && json_data.key?('logSources')

  err = ->(msg) { issues << "❌ ERROR: log sources: #{msg}" }
  warn = ->(msg) { issues << "⚠️ WARNING: log sources: #{msg}" }
  sources = json_data['logSources']
  unless sources.is_a?(Hash)
    err.call('logSources must be an object of source id to source')
    return issues
  end

  err.call('logSources needs a gameClock (rows are stamped with game time)') unless json_data['gameClock'].is_a?(Hash)
  # A key starting `_` is an author note (the schema's ^_ pattern), not a source.
  sources = sources.reject { |id, _source| id.is_a?(String) && id.start_with?('_') }
  err.call("more than #{LOG_MAX_SOURCES} sources (#{sources.size})") if sources.size > LOG_MAX_SOURCES

  names = log_scenario_names(json_data)
  index = log_place_index(json_data)
  total = 0
  taken = {}

  sources.each do |id, source|
    label = "source \"#{id.to_s[0, 40]}\""
    err.call("#{label}: id must match #{LOG_SOURCE_ID.source}") unless id.is_a?(String) && id.match?(LOG_SOURCE_ID)
    unless source.is_a?(Hash)
      err.call("#{label} must be an object")
      next
    end

    title = source['title']
    if !title.is_a?(String) || title.empty? || title.length > LOG_MAX_TITLE
      err.call("#{label}: title must be a string of 1 to #{LOG_MAX_TITLE} characters")
    elsif title.match?(/[[:cntrl:]]/)
      err.call("#{label}: title holds control characters")
    end

    rows = source.key?('maxRows') ? source['maxRows'] : LOG_DEFAULT_SOURCE_ROWS
    if rows.is_a?(Integer) && rows >= LOG_MIN_SOURCE_ROWS && rows <= LOG_MAX_SOURCE_ROWS
      total += rows
    else
      err.call("#{label}: maxRows must be an integer from #{LOG_MIN_SOURCE_ROWS} to #{LOG_MAX_SOURCE_ROWS}")
      total += LOG_DEFAULT_SOURCE_ROWS
    end

    names_taken = log_check_events(source['events'], events, label, err)
    taken[id] = names_taken
    check_log_where(source['where'], label, index, kinds, err)

    show = source['showCardHolder']
    err.call("#{label}: showCardHolder must be true or false") unless show.nil? || [true, false].include?(show)

    where_given = source['where'].is_a?(Hash) && %w[rooms objects places].any? { |k| source['where'].key?(k) }
    wildcard = Array(source['events']).any? { |e| e.is_a?(String) && e.end_with?('_*') }
    if wildcard && !where_given
      warn.call("#{label}: a prefix wildcard with no \"where\" takes those events at every place; " \
                'name the places or list the events')
    end
  end
  err.call("the sources' maxRows add up to #{total}, over #{LOG_MAX_TOTAL_ROWS}") if total > LOG_MAX_TOTAL_ROWS

  log_check_stored_ids(log_stored_id_names(json_data), json_data, err)
  log_warn_protected_rows(sources, taken, events, index, warn)
  log_warn_save_counters(sources, taken, events, index, warn)
  log_warn_secret_collisions(json_data, names, events, kinds, warn)
  issues
end

# Expand a source's `events` list to the registered event names it takes; report each bad entry.
def log_check_events(list, events, label, err)
  if !list.is_a?(Array) || list.empty?
    err.call("#{label}: events must be a non-empty array")
    return []
  end
  out = []
  list.each do |entry|
    unless entry.is_a?(String) && entry.match?(/\A[a-z][a-z0-9_]{1,39}(_\*)?\z/)
      err.call("#{label}: event \"#{entry.to_s[0, 40]}\" is not an event name or a prefix ending _*")
      next
    end
    matched = if entry.end_with?('*') then events.keys.select { |e| e.start_with?(entry.delete_suffix('*')) }
    else events.key?(entry) ? [entry] : []
    end
    if matched.empty?
      err.call("#{label}: event \"#{entry}\" is not registered" \
               "#{entry.end_with?('*') ? ' and no registered event starts with that prefix' : ''} (lib/break_escape/ops_log_events.rb)")
    end
    out.concat(matched)
  end
  out.uniq
end

# How to list the places of each kind that exists in the scenario (m10). A kind with no entry is not
# existence-checked (a host, network, share, jack, access point or foothold id cannot be listed from
# here yet): the stage that adds such a kind to the registry adds its lister here in the same commit.
LOG_PLACE_LISTERS = {
  'door' => ->(index) { index[:rooms] },
  'object' => ->(index) { index[:objects].keys },
  'pc' => ->(index) { index[:pcs].keys },
  'npc' => ->(index) { index[:npcs] }
}.freeze

def check_log_where(where, label, index, kinds, err)
  return if where.nil?
  unless where.is_a?(Hash)
    err.call("#{label}: where must be an object")
    return
  end
  extra = where.keys - %w[rooms objects places]
  err.call("#{label}: where has unknown keys #{extra.map { |k| "\"#{k}\"" }.join(', ')}") unless extra.empty?
  log_where_list(where, 'rooms', label, err).each do |room|
    err.call("#{label}: where.rooms names \"#{room.to_s[0, 40]}\", which is not a room") unless index[:rooms].include?(room)
  end
  log_where_list(where, 'objects', label, err).each do |object|
    err.call("#{label}: where.objects names \"#{object.to_s[0, 40]}\", which is not an object") unless index[:object_ids].include?(object)
  end
  log_where_list(where, 'places', label, err).each do |place|
    kind, id = place.is_a?(String) ? place.split(':', 2) : [nil, nil]
    if id.nil? || !kinds.key?(kind)
      err.call("#{label}: where.places entry \"#{place.to_s[0, 40]}\" must be \"kind:id\" with a kind from #{kinds.keys.join(', ')}")
    elsif LOG_PLACE_LISTERS[kind] && !LOG_PLACE_LISTERS[kind].call(index).include?(id)
      err.call("#{label}: where.places \"#{place[0, 40]}\" names a #{kind == 'door' ? 'room' : 'thing'} that does not exist in the scenario")
    end
  end
end

def log_where_list(where, key, label, err)
  return [] unless where.key?(key)
  unless where[key].is_a?(Array) && where[key].any? && where[key].all?(String)
    err.call("#{label}: where.#{key} must be a non-empty array of strings")
    return []
  end
  where[key]
end

# Every id and map key a row can store, as a flat set (rooms, objects, NPCs, items, hosts, networks,
# shares, desks, footholds, access points all carry an `id` or sit under one of LOG_ID_MAPS).
def log_scenario_names(data)
  names = Set.new
  walk = lambda do |node|
    case node
    when Hash
      node.each do |key, value|
        names.merge(value.keys.map(&:to_s)) if LOG_ID_MAPS.include?(key) && value.is_a?(Hash)
        names << value if key == 'id' && value.is_a?(String)
        walk.call(value)
      end
    when Array then node.each { |value| walk.call(value) }
    end
  end
  walk.call(data)
  names
end

# What the scenario holds, for place checks: room ids, every object id with the room that holds it,
# the sign-in PCs (lockType login) among them, and NPC ids.
def log_place_index(data)
  rooms = data['rooms'].is_a?(Hash) ? data['rooms'] : {}
  objects = {}
  pcs = {}
  walk = lambda do |node, room_id|
    case node
    when Hash
      if node['id'].is_a?(String)
        objects[node['id']] = room_id
        pcs[node['id']] = room_id if node['lockType'] == 'login'
      end
      node.each_value { |value| walk.call(value, room_id) }
    when Array then node.each { |value| walk.call(value, room_id) }
    end
  end
  rooms.each { |room_id, room| walk.call(room['objects'], room_id.to_s) if room.is_a?(Hash) }
  npcs = rooms.values.flat_map { |r| r.is_a?(Hash) ? Array(r['npcs']).filter_map { |n| n['id'] if n.is_a?(Hash) && n['id'].is_a?(String) } : [] }
  { rooms: rooms.keys.map(&:to_s), objects: objects, pcs: pcs, npcs: npcs, object_ids: Set.new(objects.keys) | npcs }
end

# The ids a row can store (13.1, plan section 9): rooms, objects, NPCs, items, hosts, networks, shares,
# desks, footholds and access points. Their map keys under rooms, networks and resources, and every `id`
# inside rooms and resources. Objective, task and message ids are not stored in a row.
def log_stored_id_names(data)
  names = Set.new
  %w[rooms networks resources].each { |key| names.merge(data[key].keys.map(&:to_s)) if data[key].is_a?(Hash) }
  walk = lambda do |node|
    case node
    when Hash
      node.each do |key, value|
        names << value if key == 'id' && value.is_a?(String)
        walk.call(value)
      end
    when Array then node.each { |value| walk.call(value) }
    end
  end
  %w[rooms resources].each { |key| walk.call(data[key]) }
  names
end

# 13.1: an id a row can store is at most 40 characters of [A-Za-z0-9_.:-]; an account username at most 32.
def log_check_stored_ids(names, data, err)
  names.each do |name|
    next unless name.is_a?(String)

    if name.length > LOG_MAX_ID
      err.call("id \"#{name[0, 40]}...\" is over #{LOG_MAX_ID} characters (an ops log row cannot store it)")
    elsif !name.match?(LOG_STORED_ID)
      err.call("id \"#{name[0, 40]}\" holds characters outside A-Z a-z 0-9 _ . : - (an ops log row cannot store it)")
    end
  end
  rooms = data['rooms'].is_a?(Hash) ? data['rooms'] : {}
  rooms.each_value do |room|
    next unless room.is_a?(Hash)

    Array(room['npcs']).each do |npc|
      user = npc.is_a?(Hash) && npc['creds'].is_a?(Hash) ? npc['creds']['username'] : nil
      next unless user.is_a?(String) && user.length > LOG_MAX_USERNAME

      err.call("account username \"#{user[0, 32]}...\" is over #{LOG_MAX_USERNAME} characters (an ops log row cannot store it)")
    end
  end
end

# The places of one kind that a source admits, from the scenario (an approximation: a kind the scenario
# cannot list cheaply counts none). A source with no `where` admits every place of the kind; with one,
# the union of what its rooms, objects and places admit, as the server does (ops_log_place_admitted?).
def log_places_for(kind, source, index)
  where = source['where'].is_a?(Hash) ? source['where'] : {}
  base = case kind
  when 'door' then index[:rooms]
  when 'object' then index[:objects].keys
  when 'pc' then index[:pcs].keys
  when 'npc' then index[:npcs]
  else []
  end
  return base unless %w[rooms objects places].any? { |k| where[k].is_a?(Array) }

  admitted = []
  room_of = { 'door' => ->(id) { id }, 'object' => ->(id) { index[:objects][id] }, 'pc' => ->(id) { index[:pcs][id] } }[kind]
  if room_of
    admitted.concat(base.select { |id| Array(where['rooms']).include?(room_of.call(id)) }) if where['rooms'].is_a?(Array)
    admitted.concat(base & where['objects']) if where['objects'].is_a?(Array) && kind != 'door'
  end
  if where['places'].is_a?(Array)
    admitted.concat(where['places'].filter_map { |p| p.split(':', 2)[1] if p.is_a?(String) && p.start_with?("#{kind}:") })
  end
  admitted.uniq
end

# A source whose maxRows is under the events it takes plus its limited places can evict a protected row.
def log_warn_protected_rows(sources, taken, events, index, warn)
  sources.each do |id, source|
    next unless source.is_a?(Hash)

    max_rows = source['maxRows'].is_a?(Integer) ? source['maxRows'] : LOG_DEFAULT_SOURCE_ROWS
    names = taken[id] || []
    limited = names.select { |e| events[e][:save_limit].is_a?(Hash) }
    kinds = limited.flat_map { |e| Array(events[e][:places]) }.uniq
    places = kinds.flat_map { |k| log_places_for(k, source, index) }.uniq.size
    need = names.size + places
    next unless max_rows < need

    warn.call("source \"#{id}\": maxRows #{max_rows} is below the #{names.size} events it takes plus " \
              "#{places} limited places (#{need}); a protected row may be evicted")
  end
end

# More possible opsLogSaves keys than the 256 the store holds.
def log_warn_save_counters(sources, taken, events, index, warn)
  keys = Set.new
  sources.each do |id, source|
    next unless source.is_a?(Hash)

    (taken[id] || []).each do |event|
      limit = events[event][:save_limit]
      next unless limit.is_a?(Hash)

      Array(events[event][:places]).each do |kind|
        log_places_for(kind, source, index).each do |place|
          limit.each_key { |result| keys << [event, kind, place, result] }
        end
      end
    end
  end
  return unless keys.size > LOG_MAX_SAVE_KEYS

  warn.call("up to #{keys.size} save-counter keys are possible, over the #{LOG_MAX_SAVE_KEYS} the store holds; " \
            'refusals past that are dropped rather than counted')
end

# A secret that equals a username, an id or a code in the registry: a row naming that thing shows text
# equal to the secret, so the helper leaves that secret out of its comparison (13.2 step 2).
def log_warn_secret_collisions(data, names, events, kinds, warn)
  codes = Set.new(kinds.keys)
  events.each_value do |entry|
    codes.merge(Array(entry[:results]))
    codes.merge(Array(entry[:places]))
    (entry[:detail] || {}).each_value { |rule| codes.merge(rule) if rule.is_a?(Array) }
  end
  usernames = Set.new
  log_npc_creds(data).each { |creds| usernames << creds['username'].to_s if creds['username'] }
  secrets = log_registered_secrets(data)
  secrets.uniq.each do |secret|
    next unless secret.is_a?(String) && (names.include?(secret) || usernames.include?(secret) || codes.include?(secret))

    warn.call('a declared password, code or key equals a username, an id or a registered event code; ' \
              'the log guard leaves it out of its comparison (change the secret)')
    break
  end
end

# Every creds hash in the scenario (room NPCs, top-level npcs and phoneNPCs).
def log_npc_creds(data)
  out = []
  walk = lambda do |node|
    case node
    when Hash
      out << node['creds'] if node['creds'].is_a?(Hash)
      node.each_value { |v| walk.call(v) }
    when Array then node.each { |v| walk.call(v) }
    end
  end
  walk.call(data)
  out
end

# The secrets the server's guard registers (BreakEscape::OpsLog's L1a sources): pin, password,
# combination and cryptex answers, wifi keys, capture secrets, NPC passwords (wherever an NPC carries
# creds) and scenario flag values. Not a card id or an owner name (rfid and biometric `requires`).
def log_registered_secrets(data)
  out = []
  add = lambda do |value|
    parts = value.is_a?(Array) ? value.map(&:to_s) : [value]
    forms = value.is_a?(Array) && parts.any? ? [parts.join('-'), parts.join] : parts
    forms.each { |v| out << v.to_s if (v.is_a?(String) || v.is_a?(Integer)) && !v.to_s.strip.empty? }
  end
  BreakEscape::CaptureModel.each_lock_answer(data) do |lock_type, value, _path|
    add.call(value) if BreakEscape::CaptureModel::LOCK_ANSWER_TYPES.include?(lock_type)
  end
  nets = data['networks'].is_a?(Hash) ? data['networks'].values : []
  nets.each { |net| add.call(net['wifi']['psk']) if net.is_a?(Hash) && net['wifi'].is_a?(Hash) }
  flags = data['flags'].is_a?(Hash) ? data['flags'] : {}
  flags.each_value { |group| group.each_value { |v| add.call(v) } if group.is_a?(Hash) }
  walk = lambda do |node|
    case node
    when Hash
      add.call(node['creds']['password']) if node['creds'].is_a?(Hash)
      LOG_CAPTURE_KEYS.each { |key| add.call(node[key]['secret']) if node[key].is_a?(Hash) }
      node.each_value { |v| walk.call(v) }
    when Array then node.each { |v| walk.call(v) }
    end
  end
  walk.call(data)
  out
end
