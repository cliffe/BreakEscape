# frozen_string_literal: true

require 'digest'
require 'set'

module BreakEscape
  # The one helper every ops plan writes log rows through, and the storage and reading of those
  # rows (docs/achitechture/OPS_LOG_ROWS_PLAN.md, section 13; L1a build items 2 to 4). Included in
  # Game. No call site writes a row yet.
  #
  # write_log_row! records one event in every declared log source that takes it. It never saves:
  # the caller's own save! persists the row in the same request and game lock as the action it
  # records, and a branch with no save of its own calls save! only when `r&.stored?`.
  #
  # player_state keys (all server-only, none in ACCESS_STATE_DEFAULTS, never sent):
  #   opsLog        { sourceId => [row, ...] }
  #   opsLogSeq     the last row number
  #   opsLogOnce    [12-hex digest, ...], at most 256
  #   opsLogSaves   { 12-hex digest => [count, windowStartMs] }, at most 256
  #   opsLogClockAt server epoch ms at which scenarioClock.elapsedMs was last true (stamped
  #                 elsewhere; read here for the game-time estimate)
  module OpsLog
    extend ActiveSupport::Concern

    EVENTS = OpsLogEvents::EVENTS
    KINDS = OpsLogEvents::KINDS

    SAVE_WINDOW_MS = 300_000
    MAX_ROW_BYTES = 400
    MAX_OPS_LOG_BYTES = 128 * 1024
    MAX_ONCE_KEYS = 256
    MAX_SAVE_KEYS = 256
    MAX_COUNT_CLAMP = OpsLogEvents::MAX_COUNT
    MAX_SOURCES = 30
    MAX_TOTAL_ROWS = 300
    MIN_SOURCE_ROWS = 10
    MAX_SOURCE_ROWS = 150
    MAX_SEED_ROWS = 100
    SEED_ID = /\As[0-9]{1,3}\z/.freeze
    SEED_AT = /\A(?:(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat) )?(?:[01][0-9]|2[0-3]):[0-5][0-9]\z/.freeze
    DEFAULT_SOURCE_ROWS = 50
    MAX_N = 99_999
    MERGE_WINDOW = 10
    CLOCK_ESTIMATE_CAP_MS = 300_000
    MAX_ACCOUNT_CHARS = 32
    MAX_TYPED_CHARS = 32
    MAX_TYPED_BYTES = 96
    REFUSAL_FREE_RESULTS = %w[ok granted].freeze
    AS_FORMS = %w[account npc card typed].freeze
    ID_MAPS = %w[rooms networks resources accountProfiles credentials logSources].freeze

    # A call the checks refuse (13.2 step 2). Raised in test and development; in production the
    # call answers nil and logs one warning line.
    class Malformed < ArgumentError; end

    # The guard's refusal: a value in a row equals a registered secret. The message starts with
    # `secret in` and never holds the value.
    class SecretInRow < ArgumentError; end

    # Per-request store of derived secrets (a code or number a function issues and never stores).
    # Cleared at the end of each request by the Rails executor.
    class Current < ActiveSupport::CurrentAttributes
      attribute :issued_secrets
    end

    # What a call did (13.1).
    class Result
      def initialize(appended:, merged:)
        @appended = appended
        @merged = merged
      end

      def appended?
        @appended
      end

      def merged?
        @merged
      end

      def stored?
        appended? || merged?
      end
    end

    class << self
      # --- tables, clock and switches (all thread-local overlays, for tests) ------------------

      def events
        overlay = Thread.current[:ops_log_overlay]
        overlay ? EVENTS.merge(overlay[:events]) : EVENTS
      end

      def kinds
        overlay = Thread.current[:ops_log_overlay]
        overlay ? KINDS.merge(overlay[:kinds]) : KINDS
      end

      # Test only: adds events (and kinds) for the block, over the shipped tables.
      def with_events(extra_events, kinds: {})
        saved = Thread.current[:ops_log_overlay]
        Thread.current[:ops_log_overlay] = { events: (saved ? saved[:events] : {}).merge(extra_events),
                                             kinds: (saved ? saved[:kinds] : {}).merge(kinds) }
        yield
      ensure
        Thread.current[:ops_log_overlay] = saved
      end

      # Server time in ms: the one source of a row's serverMs and of every window.
      def clock
        override = Thread.current[:ops_log_clock]
        return override.respond_to?(:call) ? override.call : override if override

        # Time.now, not Process.clock_gettime, so travel_to / freeze_time move it (golden runs).
        (Time.now.to_f * 1000).to_i
      end

      # Tests set the clock with this: OpsLog.with_clock(ms) { ... } (a number, or a callable).
      def with_clock(ms)
        saved = Thread.current[:ops_log_clock]
        Thread.current[:ops_log_clock] = ms
        yield
      ensure
        Thread.current[:ops_log_clock] = saved
      end

      # The guard switch. On (test and development only, 13.2): a failed check or a secret hit
      # raises. Off (every other environment, or with_guard(false)): the guard does not run, a
      # failed check writes nothing and logs one warning line, and the call never raises.
      def guard_enabled?
        override = Thread.current[:ops_log_guard]
        override.nil? ? (Rails.env.test? || Rails.env.development?) : override
      end

      def with_guard(enabled)
        saved = Thread.current[:ops_log_guard]
        Thread.current[:ops_log_guard] = enabled
        yield
      ensure
        Thread.current[:ops_log_guard] = saved
      end

      # --- the secret registry (13.2 step 2) -------------------------------------------------

      def secret_sources
        @secret_sources ||= {}
      end

      # A feature registers its own beside its EVENTS entries: a block over the game that returns
      # the secret values its scenario fields and stored state hold. Re-registering a name
      # replaces it.
      def register_secret_source(name, &block)
        raise ArgumentError, 'a secret source needs a block' unless block

        secret_sources[name.to_sym] = block
      end

      def unregister_secret_source(name)
        secret_sources.delete(name.to_sym)
      end

      # Test only: a source for the block.
      def with_secret_source(name, source)
        previous = secret_sources[name.to_sym]
        register_secret_source(name, &source)
        yield
      ensure
        previous ? secret_sources[name.to_sym] = previous : unregister_secret_source(name)
      end

      # A derived value no stored field holds (a second-step code, a matching number), noted by
      # the function that issues it. Held for this request only.
      def note_issued_secret(value)
        text = value.to_s
        return if text.empty?

        Current.issued_secrets = (Current.issued_secrets || []) | [text]
      end

      def issued_secrets
        Array(Current.issued_secrets)
      end

      # The union of the registered sources' values and this request's issued values.
      def secret_values(game)
        registered_secret_values(game) | issued_secrets
      end

      def registered_secret_values(game)
        secret_sources.values.flat_map { |source| Array(source.call(game)) }
                      .reject { |v| v.nil? || v.to_s.strip.empty? }.map(&:to_s).uniq
      end

      # Authored values the matcher leaves out: registered values equal to a declared username, a
      # scenario id or a code in EVENTS. A weak password therefore never makes a valid scenario raise.
      def authored_collisions(game)
        # Computed once per scenario and registry (13.2): kept on the game, keyed on their content.
        key = [game.scenario_data.hash, events.hash, kinds.keys.hash]
        cached = game.instance_variable_get(:@ops_log_collisions)
        return cached[1] if cached && cached[0] == key

        names = collect_authored_collisions(game)
        game.instance_variable_set(:@ops_log_collisions, [key, names])
        names
      end

      def collect_authored_collisions(game)
        names = Set.new
        collect_scenario_ids(game.scenario_data, names)
        game.account_npcs.each do |npc|
          names << npc['creds']['username'].to_s
          names << game.class.normalise_username(npc['creds']['username'])
        end
        events.each_value do |entry|
          names.merge(Array(entry[:results]))
          names.merge(Array(entry[:places]))
          (entry[:detail] || {}).each_value { |rule| names.merge(rule) if rule.is_a?(Array) }
        end
        names.merge(kinds.keys)
        names
      end

      # The secrets the matcher compares: registered minus authored collisions, plus every issued
      # value (never excused).
      def compared_secrets(game)
        (registered_secret_values(game) - authored_collisions(game).to_a) | issued_secrets
      end

      # The one matcher, used by the guard, the helper, assert_ops_log_holds_no_secret and
      # verify-run.rb --ops-log. `fields` holds string-keyed 'as', 'where' and 'detail' (a stored row
      # works as is). Every string under them is compared exactly with each secret, and each count
      # with each numeric secret of 10 or more. as.typed is never compared; counters and times are
      # not part of `fields`. Answers the key path of the first hit (never the value), or nil.
      def find_secret_hit(secrets, fields)
        strings = Set.new(secrets.map(&:to_s))
        numbers = Set.new(secrets.filter_map { |s| s.to_s.match?(/\A\d+\z/) && s.to_s.to_i >= 10 ? s.to_s.to_i : nil })
        %w[as where detail].each do |top|
          hit = secret_hit_in(fields[top], top, strings, numbers)
          return hit if hit
        end
        nil
      end

      # The matcher over one stored row.
      def row_secret_hit(game, row)
        find_secret_hit(compared_secrets(game), row)
      end

      # --- sources ---------------------------------------------------------------------------

      # The sources in scenario data, caps clamped once (4.1): each to 10..150, then in declaration
      # order each to at most 300 less the caps before it and 10 for each source after it; the
      # thirty-first and later sources are ignored. [[id, source, cap], ...]
      def sources_for(data)
        block = data.is_a?(Hash) ? data['logSources'] : nil
        return [] unless block.is_a?(Hash)

        list = block.select { |id, source| id.is_a?(String) && !id.start_with?('_') && source.is_a?(Hash) }.first(MAX_SOURCES)
        spent = 0
        list.each_with_index.map do |(id, source), index|
          cap = source['maxRows'].is_a?(Integer) ? source['maxRows'] : DEFAULT_SOURCE_ROWS
          cap = cap.clamp(MIN_SOURCE_ROWS, MAX_SOURCE_ROWS)
          cap = [cap, MAX_TOTAL_ROWS - spent - (list.size - index - 1) * MIN_SOURCE_ROWS].min
          spent += cap
          [id, source, cap]
        end
      end

      def canonical(value)
        case value
        when Hash then value.sort_by { |k, _| k.to_s }.map { |k, v| [k.to_s, canonical(v)] }
        when Array then value.map { |v| canonical(v) }
        else value
        end
      end

      # The id of a play row for the browser (7): ten hex characters of an HMAC of the game, the
      # source and the row's seq under a purpose key, so the browser cannot recover seq.
      def row_id(game_id, source_id, seq)
        key = Rails.application.key_generator.generate_key('ops_log_row_id')
        OpenSSL::HMAC.hexdigest('SHA256', key, [game_id, source_id, seq].to_json)[0, 10]
      end

      # Six characters of MD5 over the title and the client rows, as keyring_rev does (6).
      def rows_rev(title, rows)
        Digest::MD5.hexdigest(JSON.generate([title, rows]))[0, 6]
      end

      def digest(*parts)
        Digest::SHA256.hexdigest(canonical(parts).to_json)[0, 12]
      end

      private

      def collect_scenario_ids(node, names)
        case node
        when Hash
          node.each do |key, value|
            names.merge(value.keys.map(&:to_s)) if ID_MAPS.include?(key) && value.is_a?(Hash)
            names << value if key == 'id' && value.is_a?(String)
            collect_scenario_ids(value, names)
          end
        when Array
          node.each { |value| collect_scenario_ids(value, names) }
        end
      end

      def secret_hit_in(node, path, strings, numbers)
        case node
        when Hash
          node.each do |key, value|
            next if path == 'as' && %w[typed cut].include?(key.to_s)

            hit = secret_hit_in(value, "#{path}.#{key}", strings, numbers)
            return hit if hit
          end
          nil
        when String
          strings.include?(node) ? path : nil
        when Integer
          numbers.include?(node) ? path : nil
        end
      end
    end

    # =========================================================================================
    # The helper
    # =========================================================================================

    # Records one event in every declared log source that takes it. Never saves. See the header.
    # Answers an OpsLog::Result, or nil when nothing could change.
    def write_log_row!(event, as:, where:, result: 'ok', detail: nil, once: false, save_limit: false)
      return ops_log_write(event, as, where, result, detail, once, save_limit) if OpsLog.guard_enabled?

      # Off the guard (production) the helper never raises: any error is one warning line (the
      # event name only, never a value) and the call answers nil (13.1).
      begin
        ops_log_write(event, as, where, result, detail, once, save_limit)
      rescue StandardError => e
        Rails.logger.warn("ops log: #{event.is_a?(String) ? event : event.class} failed (#{e.class})")
        nil
      end
    end

    def ops_log_write(event, as, where, result, detail, once, save_limit)
      # Step 1: opt-in. No logSources, or a game loaded without its scenario: nothing to do.
      return nil unless has_attribute?(:scenario_data) && has_attribute?(:player_state)

      sources = OpsLog.sources_for(scenario_data)
      return nil if sources.empty?
      return nil unless player_state.is_a?(Hash)

      call = nil
      begin
        call = ops_log_check_call(event, as, where, result, detail, once, save_limit)
        ops_log_guard!(call) if OpsLog.guard_enabled?
      rescue OpsLog::Malformed, OpsLog::SecretInRow => e
        raise e if OpsLog.guard_enabled?

        Rails.logger.warn("ops log: #{e.message}")
        return nil
      end

      ops_log_store(call, sources)
    end
    private :ops_log_write

    # The play rows stored for a source, for server-side readers: each row as stored, in seq order.
    # With compare: true, each row as [event, as, where, result, detail, n] with every time removed
    # (S6's parity run compares that). Neither writes.
    def log_rows_for(source_id, compare: false)
      log = has_attribute?(:player_state) && player_state.is_a?(Hash) ? player_state['opsLog'] : nil
      rows = log.is_a?(Hash) && log[source_id.to_s].is_a?(Array) ? log[source_id.to_s].select { |r| r.is_a?(Hash) } : []
      rows = rows.sort_by { |row| row['seq'].to_i }
      return rows.map(&:deep_dup) unless compare

      rows.map { |row| [row['event'], row['as'], row['where'], row['result'], row['detail'], row['n'] || 1].deep_dup }
    end

    # What the browser may see of one declared source (OPS_LOG_ROWS_PLAN.md sections 5.1 and 7):
    # { rev:, title:, rows: [...] }, or nil for a source the scenario does not declare. Each row is
    # built from an allow-list of exactly seven keys (id, elapsedMs, event, as, where, result,
    # detail); seq, serverMs, `last`, `p` (only the trailing `+`), raw ids and `show: false`
    # detail keys never leave. Seed rows (L2b) come first, with `at` for `elapsedMs`. Writes nothing.
    def log_rows_for_client(source_id)
      entry = OpsLog.sources_for(scenario_data).find { |id, _source, _cap| id == source_id.to_s }
      return nil unless entry

      source = entry[1]
      title = source['title'].is_a?(String) && !source['title'].empty? ? source['title'] : 'Log'
      show_holder = source['showCardHolder'] == true
      # The authored seed rows come first (4.2), then the play rows. A seed row is built by its own
      # path and never reads `flagged`: it is authored, not stored, so no card holder rule applies.
      rows = ops_log_seed_rows(source).map { |row| ops_log_client_seed_row(row) }
      rows += log_rows_for(source_id).map do |row|
        ops_log_client_row(source_id.to_s, row, hide_holder: !show_holder)
      end
      { rev: OpsLog.rows_rev(title, rows), title: title, rows: rows }
    end

    # A source's authored seed rows (4.2): the first 100 hashes of `seedRows` with an id and an event
    # the registry knows, an id and a stamp of the authored forms and a result the event allows. A snapshot
    # is not re-validated (the validator is), so a malformed entry is skipped, not raised or shown.
    def ops_log_seed_rows(source)
      list = source.is_a?(Hash) ? source['seedRows'] : nil
      return [] unless list.is_a?(Array)

      seen = {}
      list.first(OpsLog::MAX_SEED_ROWS).select do |row|
        definition = row.is_a?(Hash) ? OpsLog.events[row['event'].to_s] : nil
        ok = definition && row['id'].is_a?(String) && OpsLog::SEED_ID.match?(row['id']) && !seen[row['id']] &&
             row['at'].is_a?(String) && OpsLog::SEED_AT.match?(row['at']) &&
             row['result'].is_a?(String) && Array(definition[:results]).include?(row['result'])
        seen[row['id']] = true if ok
        ok
      end
    end

    # Game time at this moment (13.4): the saved elapsedMs plus the server time since
    # opsLogClockAt, capped at five minutes past the saved value; 0 with no clock key.
    def ops_log_elapsed_ms
      clock_at = player_state['opsLogClockAt']
      return 0 unless clock_at.is_a?(Numeric)

      saved = player_state.dig('scenarioClock', 'elapsedMs').to_i
      saved + (OpsLog.clock - clock_at.to_i).clamp(0, OpsLog::CLOCK_ESTIMATE_CAP_MS)
    end

    private

    # ----- the reader (L2a) -------------------------------------------------------------------

    def ops_log_client_row(source_id, row, hide_holder:)
      definition = OpsLog.events[row['event'].to_s]
      {
        id: OpsLog.row_id(id, source_id, row['seq']),
        elapsedMs: row['elapsedMs'].to_i,
        event: definition ? definition[:label] : row['event'].to_s.upcase,
        as: ops_log_client_as(row, hide_holder: hide_holder),
        where: ops_log_client_where(row['where']),
        result: ops_log_client_result(row),
        detail: ops_log_client_detail(definition, row['detail'], row['where'])
      }
    end

    # A seed row for the browser: the same seven keys as a play row, with `at` (the authored stamp, in
    # the game clock's form) where a play row has `elapsedMs`. Its `id` is the authored one (`s1`).
    def ops_log_client_seed_row(row)
      definition = OpsLog.events[row['event'].to_s]
      {
        id: row['id'],
        at: row['at'],
        event: definition[:label],
        as: ops_log_client_seed_as(row['as']),
        where: ops_log_client_where(row['where']),
        result: row['result'].upcase,
        detail: ops_log_client_detail(definition, row['detail'], row['where'])
      }
    end

    # An NPC id shows the NPC's name; any other text is a username, in the normalised form a typed
    # one has (7). `-` when there is none.
    def ops_log_client_seed_as(as)
      return '-' unless as.is_a?(String) && !as.empty?

      npc = ops_log_client_thing('npc', as)
      npc == '-' ? self.class.normalise_username(as) : npc
    end

    # A source without showCardHolder never names a card's holder (L1b ruling): the stored row is
    # shared between sources, and a badge row whose identity is kept by the flag alone carries the
    # hidden detail `flagged` (written by ops_badge_as), so a source without the flag reads `-`.
    def ops_log_client_as(row, hide_holder:)
      as = row['as']
      return '-' unless as.is_a?(Hash)

      if as['account'].is_a?(String)
        self.class.normalise_username(as['account'])
      elsif as['typed'].is_a?(String)
        as['cut'] ? "#{as['typed']}~" : as['typed']
      elsif hide_holder && row['event'] == 'badge_swipe' && row['detail'].is_a?(Hash) && row['detail']['flagged']
        '-'
      elsif as['npc'].is_a?(String)
        ops_log_client_thing('npc', as['npc'])
      elsif as['card'].is_a?(String)
        ops_log_client_thing('card', as['card'])
      else
        '-'
      end
    end

    def ops_log_client_where(where)
      return '-' unless where.is_a?(Hash)

      where['id'].is_a?(String) ? ops_log_client_thing(where['kind'].to_s, where['id']) : '-'
    end

    # A thing's authored name; `-` when the kind is unknown or the id no longer resolves; its kind
    # word when it has no authored name (the KINDS lookups fall back to the id), never the raw id.
    def ops_log_client_thing(kind, id)
      lookup = OpsLog.kinds[kind]
      name = lookup && lookup[:name].call(self, id)
      return '-' unless name.is_a?(String)
      return name if kind == 'account'

      [id, id.sub(/\A(?:jack|wifi|implant)_/, '')].include?(name) ? kind : name
    end

    def ops_log_client_result(row)
      text = row['result'].to_s.upcase
      text += " x#{row['n']}" if row['n'].to_i > 1
      text += '+' if row['p']
      text
    end

    def ops_log_client_detail(definition, detail, where = nil)
      return '' unless definition && detail.is_a?(Hash)

      rules = definition[:detail] || {}
      parts = detail.filter_map do |key, value|
        rule = rules[key.to_s]
        next if rule.nil? || (rule.is_a?(Hash) && rule[:show] == false)

        shown = if rule.is_a?(Hash) && rule[:id] == 'profile'
                  name = OpsLogEvents.profile_shown_name(self, value.to_s, where)
                  name.nil? ? '-' : (name == value.to_s ? rule[:id] : name)
        elsif rule.is_a?(Hash) && rule.key?(:id)
                  ops_log_client_thing(rule[:id], value.to_s)
        else
                  value.to_s
        end
        # a name that is just the kind word reads once ("profile"), never "profile: profile"
        shown == key.to_s ? shown : "#{key}: #{shown}"
      end
      parts.join(', ')
    end

    # ----- step 2: checks ----------------------------------------------------------------------

    def ops_log_check_call(event, as, where, result, detail, once, save_limit)
      definition = OpsLog.events[event] if event.is_a?(String)
      ops_log_refuse(event, 'event', 'is not registered') unless definition.is_a?(Hash)

      checked_result = ops_log_check_result(event, definition, result)
      checked_where = ops_log_check_where(event, definition, where)
      checked_as = ops_log_check_as(event, as)
      checked_detail = ops_log_check_detail(event, definition, detail)
      ops_log_refuse(event, 'once', 'is not a Boolean') unless [true, false].include?(once)
      ops_log_refuse(event, 'save_limit', 'is not a Boolean') unless [true, false].include?(save_limit)
      ops_log_refuse(event, 'once', 'cannot be used with as.typed') if once && checked_as&.key?('typed')
      limit = nil
      if save_limit
        ops_log_refuse(event, 'save_limit', 'cannot be used with once') if once
        limit = definition[:save_limit]&.[](checked_result)
        ops_log_refuse(event, 'save_limit', "has no registered limit for result #{checked_result}") unless limit
      end

      { event: event, definition: definition, as: checked_as, where: checked_where, result: checked_result,
        detail: checked_detail, once: once, save_limit: save_limit, limit: limit }
    end

    def ops_log_refuse(event, path, message)
      raise OpsLog::Malformed, "ops log #{event.is_a?(String) ? event : event.class}: #{path} #{message}"
    end

    def ops_log_check_result(event, definition, result)
      unless result.is_a?(String) && Array(definition[:results]).include?(result)
        ops_log_refuse(event, 'result', 'is not in the event list')
      end
      result
    end

    def ops_log_check_where(event, definition, where)
      if where.nil?
        ops_log_refuse(event, 'where', 'is missing (the event has places)') if Array(definition[:places]).any?
        return nil
      end

      ops_log_refuse(event, 'where', 'is not a { kind:, id: } hash') unless where.is_a?(Hash)
      kind = where[:kind] || where['kind']
      id = where[:id] || where['id']
      ops_log_refuse(event, 'where.kind', 'is not one the event allows') unless kind.is_a?(String) && Array(definition[:places]).include?(kind)
      ops_log_check_id(event, 'where.id', kind, id)
      { 'kind' => kind, 'id' => id }
    end

    def ops_log_check_id(event, path, kind, id)
      ops_log_refuse(event, path, 'is not a valid id') unless id.is_a?(String) && id.match?(OpsLogEvents::ID_PATTERN)
      lookup = OpsLog.kinds[kind]
      ops_log_refuse(event, path, "has no lookup for kind #{kind}") unless lookup
      ops_log_refuse(event, path, 'does not resolve') if lookup[:name].call(self, id).nil?
    end

    def ops_log_check_as(event, as)
      return nil if as.nil?

      ops_log_refuse(event, 'as', 'is not a one-key hash') unless as.is_a?(Hash) && as.size == 1
      form = as.keys.first.to_s
      value = as.values.first
      ops_log_refuse(event, 'as', 'form is not account, npc, card or typed') unless OpsLog::AS_FORMS.include?(form)
      return ops_log_typed(value, event) if form == 'typed'

      ops_log_refuse(event, "as.#{form}", 'is not a string') unless value.is_a?(String)
      if form == 'account'
        ops_log_refuse(event, 'as.account', 'is over 32 characters') if value.length > OpsLog::MAX_ACCOUNT_CHARS
        npc = OpsLogEvents.account_npc(self, value)
        ops_log_refuse(event, 'as.account', 'does not resolve') if npc.nil?
        return { 'account' => npc['creds']['username'] }
      end
      ops_log_check_id(event, "as.#{form}", form, value)
      { form => value }
    end

    # as: { typed: } (13.1): the normalise_username form, control characters stripped, cut to 32
    # characters, then by whole characters until its JSON form is at most 96 bytes.
    def ops_log_typed(value, event)
      ops_log_refuse(event, 'as.typed', 'is not a string') unless value.is_a?(String)

      text = value.dup.force_encoding(Encoding::UTF_8)
      text = text.scrub('')
      normalised = self.class.normalise_username(text)
      plain = normalised.gsub(/[[:cntrl:]]/, '')
      cut = plain.length < normalised.length || text.strip.downcase.length > normalised.length
      if plain.length > OpsLog::MAX_TYPED_CHARS
        plain = plain[0, OpsLog::MAX_TYPED_CHARS]
        cut = true
      end
      while plain.to_json.bytesize > OpsLog::MAX_TYPED_BYTES
        plain = plain[0, plain.length - 1]
        cut = true
      end
      out = { 'typed' => plain }
      out['cut'] = true if cut
      out
    end

    def ops_log_check_detail(event, definition, detail)
      return nil if detail.nil? || (detail.respond_to?(:empty?) && detail.empty?)

      ops_log_refuse(event, 'detail', 'is not a hash') unless detail.is_a?(Hash)
      ops_log_refuse(event, 'detail', 'has more than 4 keys') if detail.size > OpsLogEvents::MAX_DETAIL_KEYS
      rules = definition[:detail] || {}
      detail.each_with_object({}) do |(key, value), out|
        name = key.to_s
        rule = rules[name]
        ops_log_refuse(event, "detail.#{name}", 'is not registered') if rule.nil?
        out[name] = ops_log_check_detail_value(event, "detail.#{name}", rule, value)
      end
    end

    def ops_log_check_detail_value(event, path, rule, value)
      if rule.is_a?(Array)
        ops_log_refuse(event, path, 'is not a registered code') unless value.is_a?(String) && rule.include?(value)
        return value
      end
      if rule.key?(:count)
        ops_log_refuse(event, path, 'is not a count') unless value.is_a?(Integer) && value >= 0
        return [value, [rule[:count], OpsLog::MAX_COUNT_CLAMP].min].min
      end
      if rule.key?(:id)
        ops_log_check_id(event, path, rule[:id], value)
        return value
      end
      ops_log_refuse(event, path, 'is not a server-made alias') unless value.is_a?(String) && value.match?(OpsLogEvents::ALIAS_PATTERN)
      value
    end

    # ----- the guard (step 2) ------------------------------------------------------------------

    def ops_log_guard!(call)
      fields = { 'as' => call[:as], 'where' => call[:where], 'detail' => call[:detail] }
      path = OpsLog.find_secret_hit(OpsLog.compared_secrets(self), fields)
      raise OpsLog::SecretInRow, "secret in #{call[:event]} #{path}" if path
    end

    # ----- steps 3 to 8 ------------------------------------------------------------------------

    def ops_log_store(call, sources)
      targets = ops_log_targets(call, sources)
      return nil if targets.empty?

      now = OpsLog.clock
      once_key = call[:once] ? OpsLog.digest(call[:event], call[:as], call[:where], call[:result], call[:detail]) : nil
      return nil if once_key && Array(player_state['opsLogOnce']).include?(once_key)

      save_key = nil
      save_count = 0
      reclaim = []
      if call[:save_limit]
        save_key = OpsLog.digest(call[:event], call[:where], call[:result])
        saves = player_state['opsLogSaves'].is_a?(Hash) ? player_state['opsLogSaves'] : {}
        entry = saves[save_key]
        save_count = ops_log_open_count(entry, now)
        return nil if save_count >= call[:limit]

        if entry.nil? && saves.size >= OpsLog::MAX_SAVE_KEYS
          reclaim = saves.select { |_k, e| ops_log_open_count(e, now).zero? }.keys
          return nil if reclaim.empty?
        end
      end

      elapsed = ops_log_elapsed_ms
      row = ops_log_build_row(call, elapsed, now)
      touched = ops_log_write_rows(targets, row, call, elapsed, now)
      return nil if touched.empty?

      # A game started before L1a has no clock key: the first stored row seeds it (13.4).
      player_state['opsLogClockAt'] ||= now
      ops_log_record(call, once_key, save_key, save_count, reclaim, touched, now)
      OpsLog::Result.new(appended: touched.any? { |t| t[:kind] == :appended }, merged: touched.any? { |t| t[:kind] == :merged })
    end

    # The count of an opsLogSaves entry that still counts: 0 when its window has passed or starts
    # in the future (a server clock that stepped back), or the entry is missing or malformed.
    def ops_log_open_count(entry, now)
      return 0 unless entry.is_a?(Array) && entry[0].is_a?(Integer) && entry[1].is_a?(Integer)

      started = entry[1]
      return 0 if started > now || now - started >= OpsLog::SAVE_WINDOW_MS

      entry[0]
    end

    # Step 3: the sources that take the event. [[id, cap], ...]
    def ops_log_targets(call, sources)
      event = call[:event]
      place = call[:where]
      room = place && OpsLog.kinds[place['kind']][:room].call(self, place['id'])
      sources.filter_map do |id, source, cap|
        events = Array(source['events']).select { |e| e.is_a?(String) }
        exact = events.include?(event)
        wildcard = events.any? { |e| e.end_with?('_*') && event.start_with?(e.delete_suffix('*')) }
        next unless exact || (wildcard && !place.nil?)

        filter = source['where'].is_a?(Hash) ? source['where'] : {}
        filtered = %w[rooms objects places].any? { |k| filter[k].is_a?(Array) }
        next [id, cap] unless filtered
        next unless place && ops_log_place_admitted?(filter, place, room)

        [id, cap]
      end
    end

    # A room or an object id admits only a kind with a room lookup (door, object, pc, jack, ap); a
    # host, network or share matches only `where.places` (4.1).
    def ops_log_place_admitted?(filter, place, room)
      roomed = !room.nil?
      return true if roomed && Array(filter['rooms']).include?(room)
      return true if roomed && Array(filter['objects']).include?(place['id'])

      Array(filter['places']).include?("#{place['kind']}:#{place['id']}")
    end

    def ops_log_build_row(call, elapsed, now)
      row = { 'event' => call[:event] }
      row['as'] = call[:as] if call[:as]
      row['where'] = call[:where] if call[:where]
      row['result'] = call[:result]
      row['detail'] = call[:detail] if call[:detail]
      row['elapsedMs'] = elapsed
      row['serverMs'] = now
      row
    end

    # Steps 5 and 6: merge into an identical recent row, else append; evict past the cap. Returns
    # the rows touched: [{ source:, row:, kind: }].
    def ops_log_write_rows(targets, built, call, elapsed, now)
      log = player_state['opsLog'].is_a?(Hash) ? player_state['opsLog'].dup : {}
      seq = nil
      touched = []
      same = %w[event as where result detail]
      targets.each do |source_id, cap|
        rows = log[source_id].is_a?(Array) ? log[source_id].dup : []
        index = rows.length - 1
        found = nil
        while call[:definition][:merge] != false && index >= 0 && rows.length - index <= OpsLog::MERGE_WINDOW
          candidate = rows[index]
          if candidate.is_a?(Hash) && same.all? { |k| candidate[k] == built[k] }
            found = index
            break
          end
          index -= 1
        end
        if found
          merged = rows[found].dup
          merged['n'] = [(merged['n'] || 1).to_i + 1, OpsLog::MAX_N].min
          # Only a save_limit merge refreshes `last` of a row marked `p` (13.2 step 6), so a noisy
          # refusal merging into it does not extend its protection.
          merged['last'] = [elapsed, now] unless merged['p'] && !call[:save_limit]
          rows[found] = merged
          touched << { source: source_id, row: merged, kind: :merged, index: found }
        else
          seq ||= player_state['opsLogSeq'].to_i + 1
          appended = built.merge('seq' => seq).sort_by { |k, _| k == 'seq' ? 0 : 1 }.to_h
          appended = ops_log_check_size!(call, appended)
          return [] unless appended

          rows << appended
          touched << { source: source_id, row: appended, kind: :appended }
        end
        log[source_id] = ops_log_evict(rows, cap, now)
      end
      ops_log_enforce_total!(log, touched.last[:source], now) if touched.any?
      player_state['opsLog'] = log
      player_state['opsLogSeq'] = seq if seq
      touched
    end

    # Step 7: a built row over 400 bytes is not written (the malformed-call rule).
    def ops_log_check_size!(call, row)
      return row if row.to_json.bytesize <= OpsLog::MAX_ROW_BYTES

      raise OpsLog::Malformed, "ops log #{call[:event]}: row is over #{OpsLog::MAX_ROW_BYTES} bytes" if OpsLog.guard_enabled?

      Rails.logger.warn("ops log: #{call[:event]} row is over #{OpsLog::MAX_ROW_BYTES} bytes")
      nil
    end

    # Eviction by class (step 6), one row per excess row, from this source only.
    def ops_log_evict(rows, cap, now)
      rows = ops_log_evict_one(rows, now) while rows.length > cap
      rows
    end

    def ops_log_evict_one(rows, now)
      first_of_event = {}
      rows.each_with_index { |row, i| first_of_event[row['event']] ||= i }
      protected_row = lambda do |row, i|
        first_of_event[row['event']] == i || (row['p'] && ops_log_in_window?(row, now))
      end
      refusal = ->(row) { !OpsLog::REFUSAL_FREE_RESULTS.include?(row['result']) }
      pick = nil
      pick ||= rows.each_index.find { |i| refusal.call(rows[i]) && (rows[i]['n'] || 1) > 1 && !protected_row.call(rows[i], i) }
      pick ||= rows.each_index.find { |i| refusal.call(rows[i]) && !protected_row.call(rows[i], i) }
      pick ||= rows.each_index.find { |i| !refusal.call(rows[i]) && !protected_row.call(rows[i], i) }
      pick ||= rows.each_index.find { |i| first_of_event[rows[i]['event']] == i }
      pick ||= 0
      rows.each_with_index.reject { |_row, i| i == pick }.map(&:first)
    end

    def ops_log_in_window?(row, now)
      latest = row['last'].is_a?(Array) ? row['last'][1] : row['serverMs']
      return false unless latest.is_a?(Integer)

      age = now - latest
      age >= 0 && age < OpsLog::SAVE_WINDOW_MS
    end

    # The 128 KB whole-value guard, which evicts from the source being appended to.
    def ops_log_enforce_total!(log, source_id, now)
      total = log.values.sum(&:length)
      return if total < 250

      while log.to_json.bytesize > OpsLog::MAX_OPS_LOG_BYTES && log[source_id].length > 1
        log[source_id] = ops_log_evict_one(log[source_id], now)
      end
    end

    # Step 6, "when any source stored": the once digest, the save counter and the `p` mark.
    def ops_log_record(call, once_key, save_key, save_count, reclaim, touched, now)
      if once_key
        once = Array(player_state['opsLogOnce']) + [once_key]
        player_state['opsLogOnce'] = once.last(OpsLog::MAX_ONCE_KEYS)
      end
      return unless save_key

      saves = player_state['opsLogSaves'].is_a?(Hash) ? player_state['opsLogSaves'].dup : {}
      reclaim.each { |key| saves.delete(key) }
      count = save_count + 1
      started = save_count.zero? ? now : saves[save_key][1]
      saves[save_key] = [count, started]
      player_state['opsLogSaves'] = saves
      return if count < call[:limit]

      # The mark lives on the row (it outlasts the entry's reset): `p` on each row this call stored
      # or merged into, in every source. A merge into a marked row keeps it.
      touched.each { |t| t[:row]['p'] = 1 }
    end
  end

  # ===========================================================================================
  # L1a's own secret sources (13.2 step 2): the secrets the engine has today. A sibling plan
  # registers its own beside its EVENTS entries. None registers a display name, id or username, nor
  # the `requires` of a key, biometric, bluetooth or rfid lock (they name an item or a person).
  # ===========================================================================================
  module OpsLog
    class << self
      def scalar_secret(value)
        case value
        when String then value.strip.empty? ? [] : [value]
        when Integer then [value.to_s]
        else []
        end
      end

      # A lock answer as written, plus the joined forms of an Array (a combination "12-30-5" and "12305").
      def answer_forms(value)
        return value.map(&:to_s).then { |parts| [parts.join('-'), parts.join] } if value.is_a?(Array) && value.any?

        scalar_secret(value)
      end

      # Every hash in the scenario, depth first.
      def each_scenario_hash(node, &block)
        case node
        when Hash
          yield node
          node.each_value { |v| each_scenario_hash(v, &block) }
        when Array
          node.each { |v| each_scenario_hash(v, &block) }
        end
      end
    end

    # Account and NPC passwords: the creds.password of every NPC record wherever the schema lets
    # one carry creds (room NPCs, top-level npcs and phoneNPCs), and the password of the account
    # each credential registry entry names. A registry entry holds no value of its own (its fields
    # are kind, account, proof, connectsTo, foundIn, endsOnGlobal, label, expiresMin).
    register_secret_source(:account_passwords) do |game|
      data = game.scenario_data
      out = []
      OpsLog.each_scenario_hash(data) do |node|
        out.concat(OpsLog.scalar_secret(node['creds']['password'])) if node['creds'].is_a?(Hash)
      end
      credentials = data.is_a?(Hash) ? data['credentials'] : nil
      if credentials.is_a?(Hash)
        holders = {}
        OpsLog.each_scenario_hash(data) { |node| holders[node['id']] = node if node['id'].is_a?(String) && node['creds'].is_a?(Hash) }
        credentials.each_value do |entry|
          holder = entry.is_a?(Hash) ? holders[entry['account']] : nil
          out.concat(OpsLog.scalar_secret(holder['creds']['password'])) if holder
        end
      end
      out
    end

    # Lock answers: the answer of every pin, password, combination and cryptex lock, as the
    # server reads it (`requires`, from CaptureModel.each_lock_answer, which also resolves a door
    # entry's inherited lock), plus the authored copies the bootstrap filters strip (a
    # combination lock's `combination`, a cryptex's cryptexConfig.answer).
    register_secret_source(:lock_answers) do |game|
      out = []
      CaptureModel.each_lock_answer(game.scenario_data) do |lock_type, requires, _path|
        next unless CaptureModel::LOCK_ANSWER_TYPES.include?(lock_type)

        out.concat(OpsLog.answer_forms(requires))
      end
      OpsLog.each_scenario_hash(game.scenario_data) do |node|
        out.concat(OpsLog.answer_forms(node['combination'])) if node['lockType'] == 'combination'
        out.concat(OpsLog.scalar_secret(node['cryptexConfig']['answer'])) if node['cryptexConfig'].is_a?(Hash)
      end
      out
    end

    # The scenario `flags` values (VM flag strings): beyond the plan, the safe side. Also the
    # literal answers on a flag station's (or launch device's) own `flags` list: an entry with no
    # colon is a literal, one with a colon is a reference (game.rb reads them the same way).
    register_secret_source(:scenario_flags) do |game|
      data = game.scenario_data
      flags = data.is_a?(Hash) ? data['flags'] : nil
      out = flags.is_a?(Hash) ? flags.values.flat_map { |group| group.is_a?(Hash) ? group.values.flat_map { |v| OpsLog.scalar_secret(v) } : [] } : []
      OpsLog.each_scenario_hash(data) do |node|
        next unless %w[flag-station launch-device].include?(node['type']) && node['flags'].is_a?(Array)

        node['flags'].each { |f| out.concat(OpsLog.scalar_secret(f)) if f.is_a?(String) && !f.include?(':') }
      end
      out
    end

    # A wifi network's psk.
    register_secret_source(:wifi_keys) do |game|
      NetworkModel.networks(game.scenario_data).values.flat_map do |net|
        net['wifi'].is_a?(Hash) ? OpsLog.scalar_secret(net['wifi']['psk']) : []
      end
    end

    # The capture `secret` fields (capture, addCapture, usePayload descriptors).
    register_secret_source(:capture_secrets) do |game|
      out = []
      OpsLog.each_scenario_hash(game.scenario_data) do |node|
        Game::CAPTURE_SECRET_KEYS.each do |key|
          out.concat(OpsLog.scalar_secret(node[key]['secret'])) if node[key].is_a?(Hash)
        end
      end
      out
    end
  end
end
