# frozen_string_literal: true

# Ops log sources (docs/achitechture/OPS_LOG_ROWS_PLAN.md, sections 4.1 and 9), stage L1a: the
# `logSources` block. One entry point, check_log_rows, called by scripts/validate_scenario.rb. The event
# list is read from lib/break_escape/ops_log_events.rb, the file the helper (BreakEscape::OpsLog) checks
# against, so the validator and the server agree on which events exist. Readers (L2a), seed rows and an
# anomaly's row (L2b) are checked here too; the graph note node is in generate_dungeon_graph.rb. Messages
# never quote a password.
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
LOG_MAX_SEED_ROWS = 100
LOG_SEED_ID = /\As[0-9]{1,3}\z/.freeze
LOG_SEED_AT = /\A(?:(Sun|Mon|Tue|Wed|Thu|Fri|Sat) )?([01][0-9]|2[0-3]):([0-5][0-9])\z/.freeze
LOG_SEED_USERNAME = /\A[A-Za-z0-9_.@-]{1,32}\z/.freeze
LOG_SEED_KEYS = %w[id at event as where result detail].freeze
LOG_WEEKDAYS = %w[Sun Mon Tue Wed Thu Fri Sat].freeze

# events: the registry to check against (the shipped one unless a test passes its own).
# kinds: the place kinds an event can name.
def check_log_rows(json_data, events: BreakEscape::OpsLogEvents::EVENTS, kinds: BreakEscape::OpsLogEvents::KINDS)
  issues = []
  return issues unless json_data.is_a?(Hash)

  err = ->(msg) { issues << "❌ ERROR: log sources: #{msg}" }
  warn = ->(msg) { issues << "⚠️ WARNING: log sources: #{msg}" }
  log_check_readers(json_data, err, warn)
  return issues unless json_data.key?('logSources')

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
    log_check_seed_rows(source, label, json_data, events, kinds, index, names_taken, err, warn) if source.key?('seedRows')

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
  log_warn_share_once_limit(json_data, warn)
  issues
end

# Plan 13.8: the share row is once-only per folder and account, and the log remembers the last
# LOG_ONCE_KEYS once-keys. A scenario with more shares plus share folders than that could pass the
# limit, and a player walking them in a ring would write a row (and a save) per request.
LOG_ONCE_KEYS = 200

def log_warn_share_once_limit(json_data, warn)
  resources = json_data['resources']
  return unless resources.is_a?(Hash)

  count = resources.sum do |id, share|
    next 0 if id.to_s.start_with?('_') || !share.is_a?(Hash)

    1 + log_count_folders(share['contents'])
  end
  return unless count > LOG_ONCE_KEYS

  warn.call("shares and share folders add up to #{count}, over #{LOG_ONCE_KEYS}: the once-only limit of the log " \
            'could be passed, and a share row could then be written again for a folder already logged')
end

def log_count_folders(contents)
  return 0 unless contents.is_a?(Array)

  contents.sum { |o| o.is_a?(Hash) && o['contents'].is_a?(Array) ? 1 + log_count_folders(o['contents']) : 0 }
end

# Plan section 9: an ops_log_terminal needs an `id` (the route checks reach by id) and a `logSource`
# naming a declared source, and cannot be a sign-in object (the route refuses it, so it could never be
# read). Walks every object, container content, profile and share in the scenario.
def log_check_readers(data, err, warn)
  sources = data['logSources'].is_a?(Hash) ? data['logSources'].keys.reject { |k| k.to_s.start_with?('_') } : []
  walk = lambda do |node|
    case node
    when Hash
      if node['type'] == 'ops_log_terminal'
        name = node['id'].is_a?(String) && !node['id'].empty? ? "\"#{node['id'][0, 40]}\"" : '(no id)'
        err.call("ops_log_terminal #{name} needs an id") unless node['id'].is_a?(String) && !node['id'].empty?
        source = node.dig('minigameData', 'logSource')
        if source.is_a?(String) && !sources.include?(source)
          err.call("ops_log_terminal #{name}: logSource \"#{source[0, 40]}\" is not a declared source in logSources")
        end
        if node['lockType'] == 'login'
          err.call("ops_log_terminal #{name} cannot have lockType login (it can never be read): put it in a " \
                   "sign-in PC's contents or a profile")
        end
        log_check_anomaly(node, name, source, data, err, warn)
      end
      node.each_value { |value| walk.call(value) }
    when Array then node.each { |value| walk.call(value) }
    end
  end
  walk.call(data)
end

# Plan sections 4.2 and 9: `anomaly.rowId` of a reader names one of its source's seed rows, never a play
# row (a play row's id is not stable across games and the source's own cap can drop it). A source with
# a single seed row gives the player one candidate: warned. The flag's actions are read by the minigame
# schema check; here only the shape of `anomaly` is judged.
def log_check_anomaly(node, name, source, data, err, warn)
  mg = node['minigameData']
  return unless mg.is_a?(Hash) && mg.key?('anomaly')

  anomaly = mg['anomaly']
  unless anomaly.is_a?(Hash) && anomaly['rowId'].is_a?(String) && (anomaly.keys - %w[rowId]).all? { |k| k.to_s.start_with?('_') }
    err.call("ops_log_terminal #{name}: anomaly must be { \"rowId\": \"<a seed row id>\" }")
    return
  end
  actions = %w[flagActions completionActions].flat_map { |k| mg[k].is_a?(Array) ? mg[k] : [] }
  if actions.empty?
    warn.call("ops_log_terminal #{name}: the anomaly has no flagActions or completionActions, so flagging does nothing")
  elsif actions.none? { |a| a.is_a?(Hash) && a['type'] == 'set_global' && a['value'] == true }
    warn.call("ops_log_terminal #{name}: no flagActions or completionActions set a global to true, so the flagged " \
              'mark and the once-only guard do not last past a reload')
  end
  return unless source.is_a?(String)

  block = data['logSources'].is_a?(Hash) ? data['logSources'][source] : nil
  seeds = block.is_a?(Hash) && block['seedRows'].is_a?(Array) ? block['seedRows'].select { |r| r.is_a?(Hash) } : []
  unless seeds.any? { |row| row['id'] == anomaly['rowId'] }
    err.call("ops_log_terminal #{name}: anomaly.rowId \"#{anomaly['rowId'][0, 20]}\" is not one of source " \
             "\"#{source[0, 40]}\"'s seed rows (a play row cannot be an anomaly)")
    return
  end
  return unless seeds.size < 2

  warn.call("ops_log_terminal #{name}: source \"#{source[0, 40]}\" has one seed row, so the flag has a single " \
            'candidate (the anomaly cannot hide among other seed rows)')
end

# Plan sections 4.2 and 9: a source's authored `seedRows`. Each row is an authored line of history shown
# before the rows play writes: unique id `s<n>`, an `at` stamp in the form the game clock prints, an event
# the registry knows with a result and detail it allows, an `as` that is an NPC id (or, for a signin_*
# event, a plain username), a `where` that exists. Rows must ascend and end at or before the clock's start,
# so the scenario needs `gameClock.start`. A row whose text equals a declared secret is refused.
def log_check_seed_rows(source, label, data, events, kinds, index, taken, err, warn)
  rows = source['seedRows']
  unless rows.is_a?(Array)
    err.call("#{label}: seedRows must be an array")
    return
  end
  err.call("#{label}: more than #{LOG_MAX_SEED_ROWS} seed rows (#{rows.size})") if rows.size > LOG_MAX_SEED_ROWS

  start = log_clock_start(data['gameClock'])
  err.call("#{label}: seedRows need gameClock.start (a time, with a day if a row names one)") if start.nil? && rows.any?
  secrets = log_seed_secrets(data)
  seen = {}
  previous = nil
  rows.first(LOG_MAX_SEED_ROWS + 1).each_with_index do |row, i|
    what = "#{label}: seed row #{i + 1}"
    unless row.is_a?(Hash)
      err.call("#{what} must be an object")
      next
    end
    id = row['id']
    what = "#{label}: seed row \"#{id.to_s[0, 10]}\"" if id.is_a?(String)
    extra = row.keys.reject { |k| LOG_SEED_KEYS.include?(k) || k.to_s.start_with?('_') }
    err.call("#{what} has unknown keys #{extra.map { |k| "\"#{k.to_s[0, 20]}\"" }.join(', ')}") unless extra.empty?
    if !id.is_a?(String) || !id.match?(LOG_SEED_ID)
      err.call("#{what}: id must match #{LOG_SEED_ID.source}")
    elsif seen[id]
      err.call("#{what}: id is used twice in the source")
    end
    seen[id] = true if id.is_a?(String)

    gap = log_seed_gap(row['at'], start, what, err)
    err.call("#{what}: rows must ascend in time (this one is earlier than the row before)") if gap && previous && gap > previous
    previous = gap if gap

    definition = row['event'].is_a?(String) ? events[row['event']] : nil
    if definition.nil?
      err.call("#{what}: event \"#{row['event'].to_s[0, 40]}\" is not registered")
      next
    end
    warn.call("#{what}: event \"#{row['event']}\" is not one the source records") unless taken.include?(row['event'])
    unless row['result'].is_a?(String) && Array(definition[:results]).include?(row['result'])
      err.call("#{what}: result \"#{row['result'].to_s[0, 20]}\" is not one of #{Array(definition[:results]).join(', ')} for #{row['event']}")
    end
    log_check_seed_where(row['where'], definition, row['event'], what, kinds, index, err)
    log_check_seed_as(row['as'], row['event'], what, index, err)
    log_check_seed_detail(row['detail'], definition, index, what, err)
    next unless log_seed_texts(row).any? { |text| secrets.include?(text.strip.downcase) }

    err.call("#{what} holds text equal to a declared password or credential value")
  end
end

# The clock's start, read as game-clock.js does: { day: index or nil, minutes: since midnight }, or nil.
def log_clock_start(config)
  raw = config.is_a?(String) ? config : (config.is_a?(Hash) ? config['start'] : nil)
  m = raw.is_a?(String) ? raw.strip.match(/\A(?:([A-Za-z]{3,9})\.?\s+)?(\d{1,2}):(\d{2})(?::(\d{2}))?\z/) : nil
  return nil unless m && m[2].to_i <= 23 && m[3].to_i <= 59

  day = m[1] ? LOG_WEEKDAYS.index { |d| m[1].downcase.start_with?(d.downcase) } : nil
  return nil if m[1] && day.nil?

  { day: day, minutes: m[2].to_i * 60 + m[3].to_i }
end

# Minutes between a seed row's stamp and the clock's start (0 or more), or nil with an error given.
def log_seed_gap(at, start, what, err)
  m = at.is_a?(String) ? at.match(LOG_SEED_AT) : nil
  unless m
    err.call("#{what}: at must be HH:MM, with an optional day (\"Mon 23:58\"), as the game clock prints it")
    return nil
  end
  return nil if start.nil?

  if m[1] && start[:day].nil?
    err.call("#{what}: at names a day but gameClock.start has none")
    return nil
  end
  days = m[1] ? (start[:day] - LOG_WEEKDAYS.index(m[1])) % 7 : 0
  gap = days * 1440 + start[:minutes] - (m[2].to_i * 60 + m[3].to_i)
  if gap.negative?
    err.call("#{what}: at is after the mission's start time (seed rows end at or before it)")
    return nil
  end
  gap
end

def log_check_seed_where(where, definition, event, what, kinds, index, err)
  places = Array(definition[:places])
  if where.nil?
    err.call("#{what}: where is missing (#{event} has places)") if places.any?
    return
  end
  unless where.is_a?(Hash) && where.keys.sort == %w[id kind]
    err.call("#{what}: where must be { \"kind\": ..., \"id\": ... }")
    return
  end
  kind = where['kind']
  unless kind.is_a?(String) && places.include?(kind) && kinds.key?(kind)
    err.call("#{what}: where.kind \"#{kind.to_s[0, 20]}\" is not one #{event} allows (#{places.join(', ')})")
    return
  end
  log_seed_thing(kind, where['id'], 'where.id', what, index, err)
end

# An id a seed row names: a stored-id shape, and, where the scenario can list the kind, an existing thing.
def log_seed_thing(kind, id, path, what, index, err)
  unless id.is_a?(String) && id.match?(BreakEscape::OpsLogEvents::ID_PATTERN)
    err.call("#{what}: #{path} is not a valid id")
    return
  end
  return unless LOG_PLACE_LISTERS[kind] && !LOG_PLACE_LISTERS[kind].call(index).include?(id)

  err.call("#{what}: #{path} \"#{id[0, 40]}\" names a #{kind == 'door' ? 'room' : kind} that does not exist in the scenario")
end

def log_check_seed_as(as, event, what, index, err)
  return if as.nil?

  unless as.is_a?(String)
    err.call("#{what}: as must be an NPC id#{event.start_with?('signin_') ? ' or a username' : ''}")
    return
  end
  return if index[:npcs].include?(as)

  if !event.start_with?('signin_')
    err.call("#{what}: as \"#{as[0, 32]}\" is not an NPC id (only a signin_* row can name a typed username)")
  elsif !as.match?(LOG_SEED_USERNAME)
    err.call("#{what}: as is neither an NPC id nor a plain username of at most #{LOG_MAX_USERNAME} characters (A-Z a-z 0-9 _ . @ -)")
  end
end

def log_check_seed_detail(detail, definition, index, what, err)
  return if detail.nil?

  unless detail.is_a?(Hash) && detail.size <= BreakEscape::OpsLogEvents::MAX_DETAIL_KEYS
    err.call("#{what}: detail must be an object of at most #{BreakEscape::OpsLogEvents::MAX_DETAIL_KEYS} keys")
    return
  end
  rules = definition[:detail] || {}
  detail.each do |key, value|
    rule = rules[key.to_s]
    if rule.nil?
      err.call("#{what}: detail key \"#{key.to_s[0, 20]}\" is not registered for the event")
    elsif rule.is_a?(Hash) && rule[:show] == false
      err.call("#{what}: detail key \"#{key.to_s[0, 20]}\" is stored-only; an authored row cannot carry it")
    elsif rule.is_a?(Array)
      err.call("#{what}: detail.#{key} is not one of #{rule.join(', ')}") unless value.is_a?(String) && rule.include?(value)
    elsif rule.key?(:count)
      ok = value.is_a?(Integer) && value >= 0 && value <= rule[:count]
      err.call("#{what}: detail.#{key} must be a count from 0 to #{rule[:count]}") unless ok
    elsif rule.key?(:id)
      log_seed_thing(rule[:id], value, "detail.#{key}", what, index, err)
    elsif !(value.is_a?(String) && value.match?(BreakEscape::OpsLogEvents::ALIAS_PATTERN))
      err.call("#{what}: detail.#{key} is not a server-made alias")
    end
  end
end

# Every string a seed row would show (not its event or result code).
def log_seed_texts(row)
  out = [row['as'], row['at']]
  out << row['where']['id'] if row['where'].is_a?(Hash)
  out.concat(row['detail'].values) if row['detail'].is_a?(Hash)
  out.select { |t| t.is_a?(String) && !t.strip.empty? }
end

def log_seed_secrets(data)
  log_registered_secrets(data).map { |v| v.to_s.strip.downcase }.reject(&:empty?).to_set
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
  %w[rooms networks resources accountProfiles].each { |key| names.merge(data[key].keys.map(&:to_s)) if data[key].is_a?(Hash) }
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
      add.call(node['combination']) if node['lockType'] == 'combination'
      add.call(node['cryptexConfig']['answer']) if node['cryptexConfig'].is_a?(Hash)
      if %w[flag-station launch-device].include?(node['type']) && node['flags'].is_a?(Array)
        node['flags'].each { |f| add.call(f) if f.is_a?(String) && !f.include?(':') }
      end
      LOG_CAPTURE_KEYS.each { |key| add.call(node[key]['secret']) if node[key].is_a?(Hash) }
      node.each_value { |v| walk.call(v) }
    when Array then node.each { |v| walk.call(v) }
    end
  end
  walk.call(data)
  out
end
