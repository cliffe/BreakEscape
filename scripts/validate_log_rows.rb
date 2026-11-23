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
  err.call("more than #{LOG_MAX_SOURCES} sources (#{sources.size})") if sources.size > LOG_MAX_SOURCES

  names = log_scenario_names(json_data)
  rooms = json_data['rooms'].is_a?(Hash) ? json_data['rooms'].keys.map(&:to_s) : []
  object_ids = log_object_ids(json_data)
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
    check_log_where(source['where'], label, rooms, object_ids, kinds, err)

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

  log_check_stored_ids(names, json_data, err)
  log_warn_protected_rows(sources, taken, events, json_data, rooms, object_ids, warn)
  log_warn_save_counters(sources, taken, events, json_data, rooms, object_ids, warn)
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

def check_log_where(where, label, rooms, object_ids, kinds, err)
  return if where.nil?
  unless where.is_a?(Hash)
    err.call("#{label}: where must be an object")
    return
  end
  extra = where.keys - %w[rooms objects places]
  err.call("#{label}: where has unknown keys #{extra.map { |k| "\"#{k}\"" }.join(', ')}") unless extra.empty?
  log_where_list(where, 'rooms', label, err).each do |room|
    err.call("#{label}: where.rooms names \"#{room.to_s[0, 40]}\", which is not a room") unless rooms.include?(room)
  end
  log_where_list(where, 'objects', label, err).each do |object|
    err.call("#{label}: where.objects names \"#{object.to_s[0, 40]}\", which is not an object") unless object_ids.include?(object)
  end
  log_where_list(where, 'places', label, err).each do |place|
    kind, id = place.is_a?(String) ? place.split(':', 2) : [nil, nil]
    if id.nil? || !kinds.key?(kind)
      err.call("#{label}: where.places entry \"#{place.to_s[0, 40]}\" must be \"kind:id\" with a kind from #{kinds.keys.join(', ')}")
    elsif kind == 'door' && !rooms.include?(id)
      err.call("#{label}: where.places \"#{place[0, 40]}\" names a room that does not exist")
    elsif !%w[door account].include?(kind) && !object_ids.include?(id)
      err.call("#{label}: where.places \"#{place[0, 40]}\" names a thing that does not exist in the scenario")
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

def log_object_ids(data)
  ids = Set.new
  rooms = data['rooms'].is_a?(Hash) ? data['rooms'] : {}
  walk = lambda do |node|
    case node
    when Hash
      ids << node['id'] if node['id'].is_a?(String)
      node.each_value { |value| walk.call(value) }
    when Array then node.each { |value| walk.call(value) }
    end
  end
  rooms.each_value { |room| walk.call(room['objects']) if room.is_a?(Hash) }
  ids.merge(rooms.values.flat_map { |r| r.is_a?(Hash) ? Array(r['npcs']).filter_map { |n| n['id'] if n.is_a?(Hash) } : [] })
  ids
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

# The places of one kind that a source admits (an approximation from the scenario: rooms for doors,
# objects for objects and PCs, NPC ids for npc). Kinds the scenario cannot list cheaply count none.
def log_places_for(kind, source, data, rooms, object_ids)
  where = source['where'].is_a?(Hash) ? source['where'] : {}
  base = case kind
  when 'door' then rooms
  when 'object', 'pc' then object_ids.to_a
  when 'npc' then log_npc_ids(data)
  else []
  end
  base &= where['rooms'] if where['rooms'].is_a?(Array) && kind == 'door'
  base &= where['objects'] if where['objects'].is_a?(Array) && %w[object pc].include?(kind)
  if where['places'].is_a?(Array)
    named = where['places'].filter_map { |p| p.split(':', 2)[1] if p.is_a?(String) && p.start_with?("#{kind}:") }
    base &= named if where['rooms'].nil? && where['objects'].nil?
  end
  base
end

def log_npc_ids(data)
  rooms = data['rooms'].is_a?(Hash) ? data['rooms'] : {}
  rooms.values.flat_map { |r| r.is_a?(Hash) ? Array(r['npcs']).filter_map { |n| n['id'] if n.is_a?(Hash) } : [] }
end

# A source whose maxRows is under the events it takes plus its limited places can evict a protected row.
def log_warn_protected_rows(sources, taken, events, data, rooms, object_ids, warn)
  sources.each do |id, source|
    next unless source.is_a?(Hash) && source['maxRows'].is_a?(Integer)

    names = taken[id] || []
    limited = names.select { |e| events[e][:save_limit].is_a?(Hash) }
    kinds = limited.flat_map { |e| Array(events[e][:places]) }.uniq
    places = kinds.flat_map { |k| log_places_for(k, source, data, rooms, object_ids) }.uniq.size
    need = names.size + places
    next unless source['maxRows'] < need

    warn.call("source \"#{id}\": maxRows #{source['maxRows']} is below the #{names.size} events it takes plus " \
              "#{places} limited places (#{need}); a protected row may be evicted")
  end
end

# More possible opsLogSaves keys than the 256 the store holds.
def log_warn_save_counters(sources, taken, events, data, rooms, object_ids, warn)
  keys = Set.new
  sources.each do |id, source|
    next unless source.is_a?(Hash)

    (taken[id] || []).each do |event|
      limit = events[event][:save_limit]
      next unless limit.is_a?(Hash)

      Array(events[event][:places]).each do |kind|
        log_places_for(kind, source, data, rooms, object_ids).each do |place|
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
  secrets = BreakEscape::CaptureModel.hard_access_raw_values(data).to_a
  log_npc_creds(data).each { |creds| secrets << creds['password'] if creds['password'].is_a?(String) }
  secrets.uniq.each do |secret|
    next unless secret.is_a?(String) && (names.include?(secret) || usernames.include?(secret) || codes.include?(secret))

    warn.call('a declared password, code or key equals a username, an id or a registered event code; ' \
              'the log guard leaves it out of its comparison (change the secret)')
    break
  end
end

def log_npc_creds(data)
  rooms = data['rooms'].is_a?(Hash) ? data['rooms'] : {}
  rooms.values.flat_map do |room|
    room.is_a?(Hash) ? Array(room['npcs']).filter_map { |n| n['creds'] if n.is_a?(Hash) && n['creds'].is_a?(Hash) } : []
  end
end
