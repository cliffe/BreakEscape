# frozen_string_literal: true

# NPC awareness and habits lints (docs/achitechture/ACCESS_MODEL_SLICE_9_1_PLAN.md, 7.2).
#
# Entry points, called from scripts/validate_scenario.rb after the library is loaded
# (access_identities, npc_habits, npc_habits/clues):
#
#   ValidateNpcHabits.check(json_data, expanded:, report:, scenario_dir: nil)
#     -> issue strings ("❌ ERROR: habits: ...", "⚠️ WARNING: habits: ...",
#        "💡 SUGGESTION: habits: ...")
#   ValidateNpcHabits.report_lines(json_data, expanded:, report:, scenario_dir: nil)
#     -> the habits report as lines; [] when no NPC has a level or `habits`
#
# json_data is the authored scenario; expanded and report are what
# BreakEscape::NpcHabits.expanded_copy(json_data) returns. No line ever quotes a password or
# any text from one: pieces are named by position and kind, sources by path.
module ValidateNpcHabits
  NH = BreakEscape::NpcHabits
  AI = BreakEscape::AccessIdentities
  CL = BreakEscape::NpcHabits::Clues

  module_function

  def err(issues, msg) = issues << "❌ ERROR: habits: #{msg}"
  def warn(issues, msg) = issues << "⚠️ WARNING: habits: #{msg}"
  def suggest(issues, msg) = issues << "💡 SUGGESTION: habits: #{msg}"

  def check(json_data, expanded:, report:, scenario_dir: nil)
    issues = []
    return issues unless json_data.is_a?(Hash)

    check_records(json_data, issues)
    check_values(json_data, expanded, issues)
    texts = nil
    homes = nil
    ink_failures = []
    by_id = report.to_h { |item| [item[:id], item] }
    expanded_npcs = AI.room_npcs(expanded).to_h { |e| [e[:npc]['id'], e[:npc]] }

    report.each do |item|
      npc = expanded_npcs[item[:id]]
      next unless npc

      habits = item[:habits]
      check_locks_screen(item, issues)
      check_writes_down(npc, item, expanded, issues) if habits.key?('writesDown')
      if habits.key?('password') || habits.key?('passwordPattern')
        texts ||= CL.readable_texts(expanded, scenario_dir, ink_failures: ink_failures)
        homes ||= CL.secret_homes(expanded)
        check_password(npc, item, expanded, texts, homes, issues)
      end
    end
    ink_failures.each do |f|
      warn(issues, "#{f[:path]} could not be read as ink JSON (#{f[:error]}): its text is not counted as a clue source.")
    end
    check_mappings(json_data, expanded, by_id, issues)
    check_ids(json_data, expanded, issues)
    check_sprites(report, expanded, issues)
    issues
  end

  # awareness and habits only on room NPCs.
  def check_records(json_data, issues)
    records = []
    %w[npcs phoneNPCs].each do |key|
      Array(json_data[key]).each_with_index { |npc, i| records << [npc, "#{key}[#{i}]"] if npc.is_a?(Hash) }
    end
    records.concat(headless_npc_records(json_data)) if Object.private_method_defined?(:headless_npc_records)
    records.each do |npc, path|
      %w[awareness habits].each do |field|
        next unless npc.key?(field)

        err(issues, "'#{path}' has '#{field}', which is allowed only on room NPCs (rooms.<id>.npcs[]): other NPC " \
                    'records reach the browser unfiltered.')
      end
    end
  end

  def check_values(json_data, expanded, issues)
    roles = json_data['roles']
    if json_data.key?('roles')
      if roles.is_a?(Hash)
        roles.each do |name, entry|
          next if name.to_s.start_with?('_')

          unless entry.is_a?(Hash)
            err(issues, "roles.#{name} must be an object.")
            next
          end
          next unless entry.key?('awareness') && !NH.level?(entry['awareness'])

          err(issues, "roles.#{name}.awareness '#{entry['awareness']}' is not one of #{NH::LEVELS.join(', ')}.")
        end
      else
        err(issues, "'roles' must be an object of role names.")
      end
    end
    AI.room_npcs(json_data).each do |entry|
      npc = entry[:npc]
      who = "NPC '#{npc['id']}'"
      if npc.key?('awareness') && !NH.level?(npc['awareness'])
        err(issues, "#{who} awareness '#{npc['awareness']}' is not one of #{NH::LEVELS.join(', ')}.")
      end
      next unless npc.key?('habits')

      habits = npc['habits']
      unless habits.is_a?(Hash)
        err(issues, "#{who} habits must be an object of habit names.")
        next
      end
      habits.each do |name, value|
        next if name == '_comment'

        if NH::PARAMETERS.include?(name)
          err(issues, "#{who} habits.#{name} must be a non-empty string.") unless NH.valid_parameter?(name, value)
        elsif !NH::HABITS.key?(name)
          err(issues, "#{who} has unknown habit '#{name}' (known: #{NH::HABITS.keys.join(', ')}).")
        elsif !NH.valid_habit?(name, value)
          err(issues, "#{who} habit '#{name}' has value #{value.inspect}; allowed: #{NH::HABITS[name].map(&:inspect).join(', ')}.")
        end
      end
      pattern = habits['passwordPattern']
      if NH.valid_parameter?('passwordPattern', pattern) && CL.find_object(json_data, pattern).nil? &&
         CL.find_object(expanded, pattern).nil?
        err(issues, "#{who} habits.passwordPattern '#{pattern}' names no object in the scenario.")
      end
    end
  end

  def check_locks_screen(item, issues)
    screen = item[:screen]
    return unless screen

    who = "NPC '#{item[:id]}'"
    explicit = item[:sources]['locksScreen'] == :explicit
    if explicit
      case screen[:reason]
      when :no_workstation
        warn(issues, "#{who} has locksScreen '#{screen[:value]}' but owns no workstation: the habit does nothing.")
      when :every_pc_sets_a_field
        warn(issues, "#{who} has locksScreen '#{screen[:value]}' but every workstation it owns " \
                     "(#{screen[:pcs].map { |pc| pc[:id] }.join(', ')}) sets lockChance or locksScreenOnLeave, which wins: " \
                     'the habit does nothing.')
      when :authored_screen_habit
        warn(issues, "#{who} has locksScreen '#{screen[:value]}' and an authored screenHabit: the authored screenHabit " \
                     'wins and the habit is not applied.')
      end
    end
    return unless screen[:filled] && screen[:value] == 'sometimes'

    screen[:pcs].select { |pc| pc[:applied] && pc[:login] }.each do |pc|
      if explicit
        warn(issues, "#{who} has locksScreen 'sometimes' by name, so a session at sign-in PC '#{pc[:id]}' rests on a " \
                     'seeded roll. Set locksScreen to never or always, or make sure another route exists.')
      else
        suggest(issues, "#{who} locks sign-in PC '#{pc[:id]}' 'sometimes' from the medium preset, so a session there " \
                        'rests on a seeded roll. Set locksScreen by name if a puzzle needs it.')
      end
    end
  end

  def owned_login_pcs(npc, expanded)
    AI.sign_in_pcs(expanded).select { |e| AI.owner_id(e[:object], expanded) == npc['id'] }
  end

  def check_writes_down(npc, item, expanded, issues)
    return unless item[:habits]['writesDown'] == true

    who = "NPC '#{npc['id']}'"
    unless AI.account?(npc)
      warn(issues, "#{who} has writesDown but no account (creds.username): there is no password to write down.")
      return
    end
    own = owned_login_pcs(npc, expanded)
    if own.empty?
      warn(issues, "#{who} has writesDown but owns no sign-in PC (needsHome or screenOwner): the note has nowhere to show.")
    elsif own.all? { |e| note_blocked?(e[:object]) }
      warn(issues, "#{who} has writesDown but every sign-in PC it owns (#{own.map { |e| e[:object]['id'] }.join(', ')}) " \
                   'authors its own postitNote or sets showPostit: false, which wins.')
    end
  end

  def note_blocked?(pc)
    (pc['postitNote'].is_a?(String) && !pc['postitNote'].strip.empty?) || pc['showPostit'] == false
  end

  def check_password(npc, item, expanded, texts, homes, issues)
    who = "NPC '#{npc['id']}'"
    habit = item[:habits]['password']
    pattern = item[:habits]['passwordPattern']
    if pattern && habit != 'guessable'
      warn(issues, "#{who} has habits.passwordPattern without password: \"guessable\": the pattern clue is not used.")
    end
    return unless habit

    unless AI.account?(npc) && npc['creds']['password'].is_a?(String)
      warn(issues, "#{who} has password '#{habit}' but no account with a password.")
      return
    end
    case habit
    when 'guessable'
      backing = CL.backing(npc, expanded, texts, pattern)
      unless backing[:backed]
        warn(issues, "#{who} has password \"guessable\" but it is not backed: #{backing[:reasons].join('; ')}. " \
                     'See the habits report for each piece.')
      end
      pcs = AI.sign_in_pcs(expanded).select { |e| AI.account_admitted?(e[:object], npc) }
      if pcs.any? && pcs.all? { |e| max_attempts?(e[:object], expanded) }
        warn(issues, "#{who} has password \"guessable\" and can sign in only at PCs under a policy with maxAttempts: " \
                     'a wrong guess counts towards a lockout that lasts the mission.')
      end
    when 'reused'
      if CL.reuse_homes(npc, expanded, homes).empty?
        warn(issues, "#{who} has password \"reused\" but no other secret in the scenario equals it.")
      end
    when 'strong'
      if CL.reuse_homes(npc, expanded, homes).any?
        warn(issues, "#{who} has password \"strong\" but another secret in the scenario equals it.")
      elsif CL.parts_all_sourced?(npc, expanded, texts)
        warn(issues, "#{who} has password \"strong\" but every word and number part of it can be read in the scenario.")
      end
    end
  end

  def max_attempts?(pc, scenario)
    policies = scenario['policies'].is_a?(Hash) ? scenario['policies'] : {}
    policy = policies[(pc['policy'] || scenario['defaultPolicy']).to_s]
    policy.is_a?(Hash) && AI.positive_number?(policy['maxAttempts'])
  end

  # ---- Screen state mappings ------------------------------------------------------

  # The effective lock on a leave, in decideLocked's order: [value, where, late]. value is 0,
  # 1 or :partial; late is true when a policy autoLockMin above 0 or the PC's
  # autoLockSeconds can lock an open screen during the absence.
  def effective_lock(pc, scenario, owner, item)
    policies = scenario['policies'].is_a?(Hash) ? scenario['policies'] : {}
    policy = policies[(pc['policy'] || scenario['defaultPolicy']).to_s]
    auto = policy.is_a?(Hash) ? policy['autoLockMin'] : nil
    late = (auto.is_a?(Numeric) && auto.positive?) || (pc['autoLockSeconds'].is_a?(Numeric) && pc['autoLockSeconds'].positive?)
    return [1, 'its policy (autoLockMin 0)', late] if auto.is_a?(Numeric) && auto.zero?

    chance = pc['lockChance']
    return [fraction(chance), 'its lockChance', late] if chance.is_a?(Numeric)
    return [pc['locksScreenOnLeave'] == false ? 0 : 1, 'its locksScreenOnLeave', late] if pc.key?('locksScreenOnLeave')

    habit = owner.is_a?(Hash) ? owner['screenHabit'] : nil
    if habit.is_a?(Hash)
      where = habit_source(owner, item)
      if habit['lockIfAwayOverSeconds'].is_a?(Numeric)
        return [habit['lockChance'] == 0 ? 0 : :partial, where, late]
      end
      return [habit['lockChance'].is_a?(Numeric) ? fraction(habit['lockChance']) : 1, where, late]
    end
    [1, 'the default (no lock field and no screenHabit)', late]
  end

  def fraction(value)
    v = value.clamp(0, 1)
    return 0 if v.zero?
    return 1 if v >= 1

    :partial
  end

  def habit_source(owner, item)
    screen = item && item[:screen]
    return "the owner '#{owner['id']}' screenHabit" unless screen && screen[:filled]

    from = item[:sources]['locksScreen'] == :explicit ? 'by name' : "from the #{item[:level]} preset"
    "the owner '#{owner['id']}' locksScreen '#{screen[:value]}' (#{from})"
  end

  # What a mapping needs from the screen: :locked, :open, :late or nil.
  def mapping_needs(event, pc_id, condition)
    cond = condition.is_a?(String) ? condition : ''
    case event
    when "workstation_locked_attempt:#{pc_id}" then [:locked]
    when "workstation_accessed:#{pc_id}" then [:open]
    when "workstation_screen_changed:#{pc_id}"
      cond.match?(/data\.how\s*===?\s*['"]auto['"]/) ? %i[locked late] : [:locked]
    when "workstation_owner_returned:#{pc_id}"
      if cond.match?(/data\.wasLocked\s*===?\s*true/) || cond.match?(/(?<!!)data\.wasLocked(?!\s*[=!<>])/)
        [:locked]
      elsif cond.match?(/data\.wasLocked\s*===?\s*false/) || cond.match?(/data\.wasLocked\s*!==?\s*true/) ||
            cond.match?(/!\s*data\.wasLocked(?!\s*[=!<>])/)
        [:open]
      else
        []
      end
    else
      []
    end
  end

  def npc_records(json_data)
    records = []
    AI.room_npcs(json_data).each { |e| records << e[:npc] }
    %w[npcs phoneNPCs].each { |key| Array(json_data[key]).each { |n| records << n if n.is_a?(Hash) } }
    if Object.private_method_defined?(:headless_npc_records)
      headless_npc_records(json_data).each { |npc, _| records << npc if npc.is_a?(Hash) }
    end
    records
  end

  def check_mappings(json_data, expanded, by_id, issues)
    mappings = npc_records(json_data).flat_map do |npc|
      Array(npc['eventMappings']).select { |m| m.is_a?(Hash) && m['eventPattern'].is_a?(String) }
    end
    return if mappings.empty?

    owners = AI.room_npcs(expanded).to_h { |e| [e[:npc]['id'], e[:npc]] }
    AI.room_objects(expanded).each do |entry|
      pc = entry[:object]
      next unless AI.workstation?(pc)

      owner = owners[AI.owner_id(pc, expanded)]
      value, where, late = effective_lock(pc, expanded, owner, owner && by_id[owner['id']])
      mappings.each do |mapping|
        needs = mapping_needs(mapping['eventPattern'], pc['id'], mapping['condition'])
        next if needs.empty?

        label = "the mapping on '#{mapping['eventPattern']}'"
        if needs.include?(:late) && !late
          warn(issues, "#{label} never fires: it waits for an auto lock, and workstation '#{pc['id']}' has no late lock " \
                       '(a policy autoLockMin above 0 or autoLockSeconds).')
          next
        end
        if needs.include?(:locked) && !late
          if value == 0
            warn(issues, "#{label} never fires: it needs a locked screen, and workstation '#{pc['id']}' never locks on a " \
                         "leave (#{where}).")
          elsif value == :partial
            warn(issues, "#{label} fires on some leaves only: it needs a locked screen, and whether workstation " \
                         "'#{pc['id']}' locks on a leave depends on #{where}.")
          end
        elsif needs.include?(:open)
          if value == 1
            warn(issues, "#{label} never fires: it needs an open screen, and workstation '#{pc['id']}' locks on every " \
                         "leave (#{where}).")
          elsif value == :partial
            warn(issues, "#{label} fires on some leaves only: it needs an open screen, and whether workstation " \
                         "'#{pc['id']}' stays open depends on #{where}.")
          end
        end
      end
    end
  end

  # A workstation with no authored id that something owns: the stamped id moves when
  # objects are added or reordered.
  def check_ids(json_data, expanded, issues)
    authored = AI.room_objects(json_data)
    copies = AI.room_objects(expanded)
    return unless authored.size == copies.size

    needs_homes = AI.room_npcs(expanded).map { |e| e[:npc]['needsHome'] }.select { |h| h.is_a?(String) }
    authored.zip(copies).each do |raw, copy|
      next if raw[:object].key?('id')

      obj = copy[:object]
      next unless AI.workstation?(obj)

      owned = (obj['screenOwner'].is_a?(String) && !obj['screenOwner'].empty?) || needs_homes.include?(obj['id'])
      next unless owned

      warn(issues, "workstation at #{raw[:path]} has no authored id but is owned (screenOwner or a needsHome naming " \
                   "'#{obj['id']}'). That id is stamped from its position and moves when objects change: give the " \
                   "object the id '#{obj['id']}' that the owner relies on.")
    end
  end

  # The sprite suggestion: a workstation where a locksScreen habit applies whose sprite has
  # no locked art.
  def check_sprites(report, expanded, issues)
    objects = AI.room_objects(expanded).to_h { |e| [e[:object]['id'], e[:object]] }
    report.each do |item|
      screen = item[:screen]
      next unless screen && screen[:filled]

      screen[:pcs].select { |pc| pc[:applied] }.each do |pc|
        obj = objects[pc[:id]]
        next if obj.nil? || obj['sprite'] == 'pc_desktop'

        suggest(issues, "workstation '#{pc[:id]}' follows NPC '#{item[:id]}' locksScreen habit but its sprite has no " \
                        'locked art: the lock will sound but not show. Set "sprite": "pc_desktop".')
      end
    end
  end

  # ---- The habits report ----------------------------------------------------------

  def report_lines(json_data, expanded:, report:, scenario_dir: nil)
    return [] if report.empty?

    texts = nil
    homes = nil
    expanded_npcs = AI.room_npcs(expanded).to_h { |e| [e[:npc]['id'], e[:npc]] }
    lines = ['NPC habits report (for authors and regression testers; never shown to a tester playing blind):']
    report.each do |item|
      npc = expanded_npcs[item[:id]] || {}
      level = if item[:level].nil? then 'no level'
              elsif item[:level_source] == :own then "level #{item[:level]} (its own awareness)"
              else "level #{item[:level]} (level from role #{item[:level_source].to_s.delete_prefix('role:')})"
              end
      lines << "- #{item[:id]}: #{level}"
      item[:habits].each do |name, value|
        next if NH::PARAMETERS.include?(name)

        how = item[:sources][name] == :explicit ? 'by name' : 'preset'
        lines << "  - #{name} #{value} (#{how})"
        effects = case name
                  when 'locksScreen' then screen_effects(item[:screen])
                  when 'writesDown' then note_effects(npc, expanded, value)
                  when 'password'
                    texts ||= CL.readable_texts(expanded, scenario_dir)
                    homes ||= CL.secret_homes(expanded)
                    password_effects(npc, expanded, value, item[:habits]['passwordPattern'], texts, homes)
                  else []
                  end
        effects.each { |e| lines << "      #{e}" }
      end
    end
    lines
  end

  def screen_effects(screen)
    return [] unless screen

    case screen[:reason]
    when :authored_screen_habit then return ['habit not applied: the NPC sets screenHabit']
    when :no_workstation then return ['no effect: owns no workstation']
    end
    out = []
    applied = screen[:pcs].select { |pc| pc[:applied] }
    if screen[:filled]
      out << "screenHabit lockChance #{screen[:lock_chance]}, read at #{applied.map { |pc| pc[:id] }.join(', ')}"
    end
    screen[:pcs].reject { |pc| pc[:applied] }.each do |pc|
      out << "#{pc[:id]}: the PC sets #{pc[:field]}, habit not applied there"
    end
    out
  end

  def note_effects(npc, expanded, value)
    return [] unless value == true
    return ['no effect: no account'] unless AI.account?(npc)

    own = owned_login_pcs(npc, expanded)
    return ['no effect: owns no sign-in PC'] if own.empty?

    out = own.map do |e|
      note_blocked?(e[:object]) ? "#{e[:object]['id']}: the PC's own note setting wins, no note" : "sticky note at #{e[:object]['id']}"
    end
    opens = AI.sign_in_pcs(expanded).select { |e| AI.account_admitted?(e[:object], npc) }.map { |e| e[:object]['id'] }
    out << 'opens only its own PC' if (opens - own.map { |e| e[:object]['id'] }).empty?
    out
  end

  def password_effects(npc, expanded, value, pattern, texts, homes)
    return ['no effect: no account with a password'] unless AI.account?(npc) && npc['creds']['password'].is_a?(String)

    out = []
    case value
    when 'guessable'
      b = CL.backing(npc, expanded, texts, pattern)
      out << (b[:backed] ? 'backed' : "not backed: #{b[:reasons].join('; ')}")
      b[:pieces].each do |p|
        where = if p[:sources].any?
                  p[:sources].map { |s| s[:locks].any? ? "#{s[:path]} (behind lock #{s[:locks].join(', ')})" : s[:path] }.join(', ')
                elsif p[:clue] then 'in the pattern clue'
                else 'no source'
                end
        where += ' (common punctuation: check the clue states it)' if p[:common]
        where += ' (case differs from its source: the pattern clue must state it)' if p[:case_differs]
        out << "piece #{p[:index]} of #{b[:total]}, #{p[:kind]}: #{where}"
      end
      if pattern
        clue = b[:pattern]
        path = clue && clue[:path] ? clue[:path] : pattern
        path += " (behind lock #{clue[:locks].join(', ')})" if clue && clue[:locks]&.any?
        out << "pattern clue at #{path}"
      end
      cover = [count(b[:capitals], 'capital'), count(b[:symbols], 'symbol')]
      cover << count(b[:case_changes], 'case change') if b[:case_changes].positive?
      out << "the pattern clue must cover: #{cover.join(', ')}, #{count(b[:total], 'piece')} in order"
    when 'reused'
      reused = CL.reuse_homes(npc, expanded, homes)
      out << 'no other secret equals it' if reused.empty?
      reused.each do |h|
        out << (h[:kind] == :account ? "shared with #{h[:npc_id]}" : "same password as #{h[:path]}")
      end
    when 'strong'
      out << 'reused elsewhere' if CL.reuse_homes(npc, expanded, homes).any?
    end
    CL.backing(npc, expanded, texts, nil)[:written].each { |path| out << "written in full at #{path}" }
    out
  end

  def count(n, word)
    "#{n} #{word}#{n == 1 ? '' : 's'}"
  end
end
