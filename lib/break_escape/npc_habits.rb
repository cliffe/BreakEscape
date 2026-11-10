# frozen_string_literal: true

module BreakEscape
  # NPC awareness and habits (docs/achitechture/ACCESS_MODEL_SLICE_9_1_PLAN.md, sections 4
  # and 5). An NPC gets an awareness level and a set of habits; the loader turns each habit
  # into the fields the existing systems already read, once, into the saved scenario data.
  #
  # Plain Ruby, no Rails and no ActiveSupport, and no require: the engine finds it by
  # autoload, and the scripts require_relative access_identities.rb before this file.
  # Used by the server (Game#prepare_scenario_data!), the validator and the dungeon graph.
  #
  # Rules every habit shares: a field the author wrote is never changed by a habit, and a
  # scenario that uses none of these fields is untouched. Malformed input is skipped, never
  # raised on, so a scenario the validator would reject still creates a game.
  module NpcHabits
    module_function

    LEVELS = %w[low medium high].freeze

    # Each habit's allowed values. holdsDoors is added by step 5, with the gate fill.
    HABITS = {
      'locksScreen' => %w[never sometimes always].freeze,
      'writesDown' => [true, false].freeze,
      'password' => %w[strong guessable reused].freeze
    }.freeze

    # Keys allowed in `habits` that are not habits.
    PARAMETERS = %w[passwordPattern].freeze

    # writesDown and password are in no preset (section 3).
    PRESETS = {
      'low' => { 'locksScreen' => 'never' }.freeze,
      'medium' => { 'locksScreen' => 'sometimes' }.freeze,
      'high' => { 'locksScreen' => 'always' }.freeze
    }.freeze

    LOCK_CHANCES = { 'never' => 0, 'sometimes' => 0.5, 'always' => 1 }.freeze

    LOCK_FIELDS = %w[lockChance locksScreenOnLeave].freeze

    def level?(value)
      value.is_a?(String) && LEVELS.include?(value)
    end

    def valid_habit?(name, value)
      HABITS.key?(name) && HABITS[name].include?(value)
    end

    def valid_parameter?(name, value)
      name == 'passwordPattern' && value.is_a?(String) && !value.empty?
    end

    # [level, source] where source is :own or "role:<name>"; [nil, nil] when none.
    def level_with_source(npc, scenario)
      return [nil, nil] unless npc.is_a?(Hash)
      return [npc['awareness'], :own] if level?(npc['awareness'])

      roles = scenario.is_a?(Hash) ? scenario['roles'] : nil
      return [nil, nil] unless roles.is_a?(Hash)

      AccessIdentities.identity_roles(npc).each do |role|
        entry = roles[role]
        return [entry['awareness'], "role:#{role}"] if entry.is_a?(Hash) && level?(entry['awareness'])
      end
      [nil, nil]
    end

    # The NPC's level: its own awareness, else that of the first role in identity_roles
    # (authored roles in order, then the implicit staff) that has one under the top-level
    # roles, else nil.
    def level_of(npc, scenario)
      level_with_source(npc, scenario).first
    end

    # The valid authored entries of `habits` (habits and parameters), or nil when `habits`
    # is absent or not an object.
    def authored(npc)
      habits = npc.is_a?(Hash) ? npc['habits'] : nil
      return nil unless habits.is_a?(Hash)

      habits.select { |k, v| valid_habit?(k, v) || valid_parameter?(k, v) }
    end

    # The NPC's habits after the preset and the overrides; nil when it has neither a level
    # nor a `habits` object.
    def expanded(npc, scenario)
      level = level_of(npc, scenario)
      own = authored(npc)
      return nil if level.nil? && own.nil?

      (level ? PRESETS[level].dup : {}).merge(own || {})
    end

    # { habit => :explicit | :preset } for each expanded habit. Meaningful on authored
    # data only. Parameters are not listed.
    def sources(npc, scenario)
      habits = expanded(npc, scenario)
      return {} unless habits

      own = authored(npc) || {}
      habits.each_with_object({}) do |(name, _), out|
        next if PARAMETERS.include?(name)

        out[name] = own.key?(name) ? :explicit : :preset
      end
    end

    def lock_chance(value)
      LOCK_CHANCES[value]
    end

    # Run the whole expansion on the scenario hash in place and return the report: one
    # entry per room NPC with a level or a `habits` object, saying what was filled or left
    # alone and why. Idempotent.
    def expand!(scenario)
      report = []
      return report unless scenario.is_a?(Hash) && scenario['rooms'].is_a?(Hash)

      entries = AccessIdentities.room_npcs(scenario)
      # Work out everything from the data as it stands before writing anything, so one
      # NPC's fill never changes what another NPC's expansion reads.
      plans = entries.filter_map do |entry|
        npc = entry[:npc]
        next if npc.key?('habits') && !npc['habits'].is_a?(Hash)

        habits = expanded(npc, scenario)
        next unless habits

        level, level_source = level_with_source(npc, scenario)
        { entry: entry, habits: habits, level: level, level_source: level_source,
          sources: sources(npc, scenario) }
      end
      stations = owned_workstations(scenario)

      plans.each do |plan|
        npc = plan[:entry][:npc]
        npc['habits'] = plan[:habits] if plan[:level] || npc['habits'] != plan[:habits]
        item = { id: npc['id'], room: plan[:entry][:room], path: plan[:entry][:path],
                 level: plan[:level], level_source: plan[:level_source],
                 habits: plan[:habits].dup, sources: plan[:sources], screen: nil }
        item[:screen] = fill_screen_habit!(npc, plan[:habits]['locksScreen'], stations) if plan[:habits].key?('locksScreen')
        report << item
      end
      report
    rescue StandardError
      # Never raise (the plan's expand! row). An error part way through the writes leaves
      # the NPCs before it expanded and the rest as authored: still a playable game, and
      # the report lists only the NPCs that were written.
      report
    end

    # { npc_id => [{ object:, room:, path: }] } for every workstation an NPC owns. An object
    # with no id is never matched to an owner (owner_id would match a missing id to the
    # first NPC with no needsHome); AccessIdentities.workstation? needs an id.
    def owned_workstations(scenario)
      out = Hash.new { |h, k| h[k] = [] }
      AccessIdentities.room_objects(scenario).each do |entry|
        obj = entry[:object]
        next unless AccessIdentities.workstation?(obj)

        owner = AccessIdentities.owner_id(obj, scenario)
        out[owner] << entry if owner.is_a?(String) && !owner.empty?
      end
      out
    end

    # The locksScreen fill (5.2): the NPC's own screenHabit, unless the author wrote one,
    # or the NPC owns no workstation, or every workstation it owns sets its own lock field.
    # No object is written. Returns the report's screen entry.
    def fill_screen_habit!(npc, value, stations)
      chance = lock_chance(value)
      own = npc['id'].is_a?(String) ? stations.fetch(npc['id'], []) : []
      pcs = own.map do |entry|
        obj = entry[:object]
        field = LOCK_FIELDS.find { |f| obj.key?(f) }
        { id: obj['id'], path: entry[:path], room: entry[:room], login: AccessIdentities.login_pc?(obj),
          applied: field.nil?, field: field }
      end
      screen = { value: value, lock_chance: chance, pcs: pcs, filled: false, reason: nil }
      if npc.key?('screenHabit')
        screen[:reason] = :authored_screen_habit
        pcs.each { |pc| pc[:applied] = false }
      elsif pcs.empty?
        screen[:reason] = :no_workstation
      elsif pcs.none? { |pc| pc[:applied] }
        screen[:reason] = :every_pc_sets_a_field
      else
        npc['screenHabit'] = { 'lockChance' => chance }
        screen[:filled] = true
      end
      screen
    end

    # For the scripts: a deep copy of the authored scenario with ids stamped onto room
    # objects and their contents that lack one, by the server's rule
    # (Game#stamp_scenario_object_ids!), then expand! on the copy. [copy, report]. The
    # authored hash is not changed. Profiles and resources are not stamped: nothing here
    # reads their ids.
    def expanded_copy(scenario)
      copy = Marshal.load(Marshal.dump(scenario))
      stamp_room_object_ids!(copy)
      [copy, expand!(copy)]
    end

    def stamp_room_object_ids!(scenario)
      rooms = scenario.is_a?(Hash) ? scenario['rooms'] : nil
      return unless rooms.is_a?(Hash)

      rooms.each do |room_id, room|
        next unless room.is_a?(Hash) && room['objects'].is_a?(Array)

        room['objects'].each_with_index do |obj, i|
          next unless obj.is_a?(Hash)

          obj['id'] ||= "#{room_id}_#{obj['type']}_#{i}"
          stamp_contents_ids!(obj)
        end
      end
    end

    def stamp_contents_ids!(parent)
      return unless parent['contents'].is_a?(Array)

      parent['contents'].each_with_index do |item, i|
        next unless item.is_a?(Hash)

        item['id'] ||= "#{parent['id']}_content_#{i}"
        stamp_contents_ids!(item)
      end
    end
  end
end
