module BreakEscape
  # Carrying story choices between missions (docs/agents/CARRY_OVER_PLAN.md).
  #
  # A source mission lists the globals another mission may read:
  #   "exportGlobals": ["assets_seized", "monitoring_enabled"]
  # A reading mission declares what it takes, with a default for a player who
  # never finished the source:
  #   "importGlobals": [
  #     { "from": "m06_follow_the_money", "var": "assets_seized", "default": false },
  #     { "from": "m06_follow_the_money", "completed": "m06_completed" }
  #   ]
  # `as` (the name in this mission) defaults to the source's mNN_/sisNN_ prefix
  # plus the variable name: m06_assets_seized.
  #
  # The values are fixed once per Game row, at creation: they are written into
  # scenario_data['globalVariables'] as the scenario's own defaults, so the
  # client, ink, conditions and credits see them with no further change. A
  # Restart keeps them; a New Session (a new row) looks them up again.
  #
  # Which run counts: the player's newest *story snapshot* of the source
  # mission. A snapshot is written when a game concludes and again each time a
  # concluded game reaches /conclude (the credits) with its concludeRequires
  # globals met. Restart keeps it, so replaying the source without finishing
  # leaves the last finished run in place. Only games with mission_concluded_at
  # count: Hacktivity's Finish button (status 'completed' alone) is a give-up.
  #
  # Read-only: the server never merges a client write to an imported name
  # (player_state['importedGlobalNames'], read by merge_global_variables! with
  # only the sync columns loaded), the validator rejects any write in the
  # mission's own content, and the client refuses ink and tag writes.
  module CarryOver
    SNAPSHOT_KEY       = 'storySnapshot'.freeze
    IMPORTED_NAMES_KEY = 'importedGlobalNames'.freeze
    # Set by tools/playtest/new-game.rb --imports: { as => value } replaces the
    # lookup (an empty hash means "never played"). Removed once read.
    OVERRIDES_KEY      = 'importOverrides'.freeze

    PREFIX_RE = /\A((?:m|sis)\d\d)_/.freeze

    # The name an import is known by in the reading mission, or nil.
    def self.import_name(entry)
      return nil unless entry.is_a?(Hash)
      return entry['completed'].to_s.presence if entry.key?('completed')
      return entry['as'].to_s if entry['as'].present?

      prefix = entry['from'].to_s[PREFIX_RE, 1]
      prefix && entry['var'].present? ? "#{prefix}_#{entry['var']}" : nil
    end

    # Same JSON type: a snapshot value from before a type change falls back to
    # the default rather than reaching ink as the wrong kind of value.
    def self.same_json_type?(value, default)
      case default
      when true, false then value == true || value == false
      when Numeric     then value.is_a?(Numeric)
      when String      then value.is_a?(String)
      else false
      end
    end

    # Names imported into this game. Lives in player_state because sync_state
    # loads only the sync columns, not scenario_data.
    def imported_global_names
      names = player_state.is_a?(Hash) ? player_state[IMPORTED_NAMES_KEY] : nil
      names.is_a?(Array) ? names : []
    end

    def imported_global?(name)
      imported_global_names.include?(name.to_s)
    end

    # The game's own globals at this moment, minus anything it imported, so a
    # value never passes second-hand from m06 through m07 to m08. Does not save.
    def write_story_snapshot
      globals = player_state['globalVariables'].is_a?(Hash) ? player_state['globalVariables'] : {}
      player_state[SNAPSHOT_KEY] = {
        'at' => Time.current.utc.iso8601(6),
        'globals' => globals.except(*imported_global_names).deep_dup
      }
    end

    # concludeRequires.globals only. tasksCompleted is not re-checked when a
    # concluded game reaches the credits again: a Restart wipes the flag tasks.
    def conclude_story_globals_met?(aim)
      Array(aim&.dig('concludeRequires', 'globals')).all? do |var|
        player_state.dig('globalVariables', var) == true
      end
    end

    private

    # before_create, after generate_scenario_data and before
    # initialize_player_state. Never blocks game creation: a failed lookup
    # leaves every import at its default.
    def resolve_imported_globals
      overrides = player_state.is_a?(Hash) ? player_state.delete(OVERRIDES_KEY) : nil
      return unless scenario_data.is_a?(Hash)

      entries = scenario_data['importGlobals']
      return unless entries.is_a?(Array) && entries.any?
      return if scenario_data['importedGlobals'].is_a?(Hash) # already resolved

      sources = overrides.is_a?(Hash) ? {} : lookup_carry_over_sources(entries)
      globals = scenario_data['globalVariables'] = (scenario_data['globalVariables'] || {})
      record = {}

      entries.each do |entry|
        name = CarryOver.import_name(entry)
        next unless name && entry['from'].is_a?(String)

        source = sources[entry['from']]
        if entry.key?('completed')
          found = overrides.is_a?(Hash) ? overrides[name] == true : !source.nil?
          globals[name] = found
          record[name] = { 'from' => entry['from'], 'completed' => true, 'found' => found,
                           'sourceGameId' => (found ? source&.dig(:id) : nil) }
          next
        end

        default = entry['default']
        value = default
        found = false
        # An override is keyed by the import's own name, a source by its var.
        values, key = overrides.is_a?(Hash) ? [overrides, name] : [source&.dig(:globals), entry['var']]
        if values.is_a?(Hash) && values.key?(key) && CarryOver.same_json_type?(values[key], default)
          value = values[key]
          found = true
        end
        globals[name] = value
        record[name] = { 'from' => entry['from'], 'var' => entry['var'], 'found' => found,
                         'sourceGameId' => (found ? source&.dig(:id) : nil) }
      end

      scenario_data['importedGlobals'] = record
    end

    # { from_name => { id:, at:, globals: } } for the newest concluded run of
    # each source mission. Old rows with no snapshot (concluded before carry-over
    # shipped) are read as their current globals minus their own imports,
    # timestamped with mission_concluded_at. Nothing is written to those rows.
    def lookup_carry_over_sources(entries)
      froms = entries.map { |e| e['from'] if e.is_a?(Hash) }.grep(String).uniq
      return {} if froms.empty? || player.nil?

      result = {}
      self.class.transaction(requires_new: true) do
        mission_names = Mission.where(name: froms).pluck(:id, :name).to_h
        next if mission_names.empty?

        table = self.class.table_name
        rows = self.class.where(player: player, mission_id: mission_names.keys)
                   .where.not(mission_concluded_at: nil)
                   .pluck(:id, :mission_id, :mission_concluded_at,
                          Arel.sql("#{table}.player_state -> '#{SNAPSHOT_KEY}'"),
                          Arel.sql("#{table}.player_state -> 'globalVariables'"),
                          Arel.sql("#{table}.player_state -> '#{IMPORTED_NAMES_KEY}'"))

        rows.each do |id, mission_id, concluded_at, snapshot, live, imported|
          snapshot = parse_json_cell(snapshot)
          if snapshot.is_a?(Hash) && snapshot['globals'].is_a?(Hash)
            at = (Time.iso8601(snapshot['at'].to_s) rescue concluded_at)
            globals = snapshot['globals']
          else
            live = parse_json_cell(live)
            imported = parse_json_cell(imported)
            at = concluded_at
            globals = live.is_a?(Hash) ? live.except(*Array(imported).map(&:to_s)) : {}
          end
          name = mission_names[mission_id]
          current = result[name]
          result[name] = { id: id, at: at, globals: globals } if current.nil? || at > current[:at]
        end
      end
      result
    rescue StandardError => e
      Rails.logger.error "[BreakEscape] carry-over lookup failed, using defaults: #{e.class}: #{e.message}"
      {}
    end

    def parse_json_cell(value)
      return value unless value.is_a?(String)

      JSON.parse(value)
    rescue JSON::ParserError
      nil
    end

    # From initialize_player_state (creation and Restart): put the imported
    # values into the saved globals, so server-side reads see them, and record
    # the read-only names. The values come from scenario_data, never a new
    # lookup, so a restarted game keeps what it was created with.
    def apply_imported_globals_to_state
      record = scenario_data.is_a?(Hash) ? scenario_data['importedGlobals'] : nil
      return unless record.is_a?(Hash) && record.any?

      defaults = scenario_data['globalVariables'] || {}
      player_state['globalVariables'] ||= {}
      record.each_key { |name| player_state['globalVariables'][name] = defaults[name] }
      player_state[IMPORTED_NAMES_KEY] = record.keys
    end
  end
end
