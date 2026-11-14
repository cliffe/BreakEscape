# frozen_string_literal: true

# Step 3 of the scenario format hardening plan: the secret-leak check.
#
# Nothing else stops an author copying a lock answer to a place the browser receives at game
# start: globalVariables ship in the bootstrap and in player_state, and a minigameData or
# scenarioData object ships with its room. This check compares every lock answer (pin, password,
# combination, cryptex), flag answer, account password, Wi-Fi PSK and capture secret against the
# values under globalVariables, minigameData and scenarioData, and reports a copy as an error
# unless an acknowledgedClues marker covers it (a clue that is the puzzle).
#
# Random values (a @random_pin written into a lock) are handled by the double render: the caller
# seeds the default generator twice (srand(1), srand(2)) and a match is reported only when the
# same answer path and leaf path match under both seeds, so a coincidental collision under one
# seed is dropped.
#
# Plain Ruby so scripts/validate_scenario.rb can require_relative it; it shares
# BreakEscape::CaptureModel with the server.
require 'json'
require 'set'
require_relative '../lib/break_escape/capture_model'
require_relative '../lib/break_escape/scenario_binding'

module SecretLeaks
  module_function

  # Whether the global: acknowledged-clue form is accepted (as a warning). The user's q85
  # decision: m08's door PIN in a global is best effort. Set to false and the form is an error.
  GLOBAL_CLUES_ALLOWED = true

  ANSWER_LOCK_TYPES = %w[pin password combination cryptex].freeze

  # An answer and the lock it opens: { kind:, value:, path:, lock_id: }. lock_id is the id of the
  # object, room or item carrying the lockType, used to match an acknowledgedClues marker; nil for
  # answers that are not lock codes (flags, PSKs, capture secrets).
  def collect_answers(data)
    cm = BreakEscape::CaptureModel
    answers = []

    # Lock answers with their lock id, from a tree walk that tracks the nearest enclosing id.
    walk = lambda do |node, path, lock_id|
      case node
      when Hash
        here_id = node['id'].is_a?(String) ? node['id'] : lock_id
        lt = node['lockType']
        if lt.is_a?(String) && ANSWER_LOCK_TYPES.include?(lt)
          # A room is keyed by its id in the rooms map and carries no `id` field, so derive it
          # from the path when the node is a top-level room.
          id = here_id
          id ||= Regexp.last_match(1) if path.match(%r{\A/rooms/([^/]+)\z})
          answers << { kind: lt, value: node['requires'], path: "#{path}/requires", lock_id: id }
        end
        node.each { |k, v| walk.call(v, "#{path}/#{k}", here_id) }
      when Array
        node.each_with_index { |v, i| walk.call(v, "#{path}[#{i}]", lock_id) }
      end
    end
    walk.call(data, '', nil)

    # Resolved door-entry answers (the client reads the connected room's lock through the entry).
    cm.each_lock_answer(data) do |lt, value, dpath|
      next unless dpath.start_with?('rooms/') && dpath.include?('/doors[')
      next unless ANSWER_LOCK_TYPES.include?(lt)

      answers << { kind: lt, value: value, path: dpath, lock_id: nil }
    end

    # Top-level flags, task targetFlags, flag-station flags, as flag answers.
    add_flag = ->(value, path) { Array(value).each_with_index { |leaf, i| answers << { kind: 'flag', value: leaf, path: "#{path}[#{i}]", lock_id: nil } if scalar?(leaf) } }
    flags = data['flags']
    if flags.is_a?(Hash)
      flags.each do |group_key, group|
        next unless group.is_a?(Hash)

        group.each { |fk, v| add_flag.call(v, "flags/#{group_key}/#{fk}") }
      end
    end
    each_in(data, 'targetFlags') { |value, path| add_flag.call(value, path) }
    # A flag station object carries a `flags` list (array of flag ids/answers).
    flag_station_walk(data) { |value, path| add_flag.call(value, path) }

    # Account passwords.
    cm.room_npc_list(data).each do |npc|
      creds = npc['creds']
      next unless creds.is_a?(Hash) && cm.present_string?(creds['password'])

      answers << { kind: 'password', value: creds['password'], path: "creds/#{npc['id']}", lock_id: nil }
    end

    # Wi-Fi PSKs.
    networks = data['networks']
    if networks.is_a?(Hash)
      networks.each do |net_id, net|
        wifi = net.is_a?(Hash) ? net['wifi'] : nil
        answers << { kind: 'password', value: wifi['psk'], path: "networks/#{net_id}/wifi/psk", lock_id: nil } if wifi.is_a?(Hash) && scalar?(wifi['psk'])
      end
    end

    # Capture secrets (usePayload.secret, addCapture.secret, capture.secret).
    each_capture_secret(data) { |value, path| answers << { kind: 'password', value: value, path: path, lock_id: nil } if scalar?(value) }

    answers.select { |a| scalar?(a[:value]) || a[:value].is_a?(Array) }
  end

  def scalar?(v)
    v.is_a?(String) || v.is_a?(Integer) || v.is_a?(Float)
  end

  # Every leaf (string/number) under a globalVariables, minigameData or scenarioData node, with
  # its path, its source (:global, :minigame, :scenario_data) and the id of the nearest enclosing
  # object (for a minigame/scenarioData leaf) or the global name (for a global leaf).
  def collect_leaves(data)
    leaves = []
    globals = data['globalVariables']
    if globals.is_a?(Hash)
      globals.each do |name, value|
        collect_scalars(value, "globalVariables/#{name}") { |v, p| leaves << { value: v, path: p, source: :global, container: "global:#{name}" } }
      end
    end

    walk = lambda do |node, path, container_id|
      case node
      when Hash
        here_id = node['id'].is_a?(String) ? node['id'] : container_id
        %w[minigameData scenarioData].each do |key|
          next unless node[key]

          source = key == 'minigameData' ? :minigame : :scenario_data
          collect_scalars(node[key], "#{path}/#{key}") { |v, p| leaves << { value: v, path: p, source: source, container: here_id } }
        end
        node.each { |k, v| walk.call(v, "#{path}/#{k}", here_id) unless %w[minigameData scenarioData].include?(k) }
      when Array
        node.each_with_index { |v, i| walk.call(v, "#{path}[#{i}]", container_id) }
      end
    end
    walk.call(data, '', nil)
    leaves
  end

  def collect_scalars(node, path, &block)
    case node
    when Hash
      node.each { |k, v| collect_scalars(v, "#{path}/#{k}", &block) }
    when Array
      node.each_with_index { |v, i| collect_scalars(v, "#{path}[#{i}]", &block) }
    else
      yield node, path if scalar?(node)
    end
  end

  # Whether an answer matches a leaf, after the plan's text forms.
  def answer_matches_leaf?(answer, leaf)
    kind = answer[:kind]
    value = answer[:value]
    lv = leaf[:value]

    if kind == 'combination'
      nums = BreakEscape::CaptureModel.combination_numbers(value)
      return false if nums.nil?

      if lv.is_a?(Array)
        return BreakEscape::CaptureModel.combination_numbers(lv) == nums
      end

      return false unless lv.is_a?(String)
      # A common combination form: only digits and separators, same numbers in order.
      stripped = lv.strip
      return false unless stripped.match?(/\A\d+(?:[\s,\-]+\d+)*\z/)

      return BreakEscape::CaptureModel.combination_numbers(stripped) == nums
    end

    av = value.to_s
    return false if av.strip.empty?

    # Numbers compare to their string form; cryptex answers and passwords compare case-insensitively.
    ci = %w[cryptex password].include?(kind)
    if lv.is_a?(String)
      return true if ci ? av.casecmp?(lv) : av == lv
      return true if ci ? av.casecmp?(lv.strip) : av == lv.strip
      # A whole word inside a longer string, for an answer of 6 or more characters.
      if av.length >= 6
        pattern = /(?<![[:alnum:]])#{Regexp.escape(av)}(?![[:alnum:]])/
        pattern = /#{pattern.source}/i if ci
        return true if lv.match?(pattern)
      end
      false
    else
      av == lv.to_s
    end
  end

  # The acknowledgedClues entries, validated to the shape the schema declares.
  def acknowledged_clues(data)
    list = data['acknowledgedClues']
    list.is_a?(Array) ? list.select { |e| e.is_a?(Hash) } : []
  end

  # Whether the object id `inner` is the lock `lock_id` or an object inside its contents at any
  # depth (a marker there is a leak or needless).
  def inside_lock?(data, lock_id, inner)
    return true if lock_id && inner == lock_id

    lock = find_object(data, lock_id)
    return false unless lock.is_a?(Hash)

    found = false
    collect_scalars_objects(lock['contents']) { |obj| found = true if obj['id'] == inner }
    found
  end

  def collect_scalars_objects(node, &block)
    case node
    when Hash
      yield node if node['id'].is_a?(String)
      node.each_value { |v| collect_scalars_objects(v, &block) }
    when Array
      node.each { |v| collect_scalars_objects(v, &block) }
    end
  end

  def find_object(data, id)
    return nil unless id

    result = nil
    collect_scalars_objects(data) { |obj| result ||= obj if obj['id'] == id }
    result
  end

  # The matches (answer, leaf) in one render, keyed by (answer path, leaf path) so two renders can
  # be intersected.
  def matches_for(data)
    answers = collect_answers(data)
    leaves = collect_leaves(data)
    out = {}
    answers.each do |answer|
      leaves.each do |leaf|
        next unless answer_matches_leaf?(answer, leaf)

        out[[answer[:path], leaf[:path]]] = { answer: answer, leaf: leaf }
      end
    end
    out
  end

  # The check. json_data is the first render (already parsed); erb_path lets us render again under
  # a second seed to drop coincidental matches.
  def check(json_data, erb_path = nil)
    return [] unless json_data.is_a?(Hash)

    issues = []

    first = render_seeded(erb_path, 1) || json_data
    second = render_seeded(erb_path, 2) || json_data
    m1 = matches_for(first)
    m2 = matches_for(second)
    stable_keys = m1.keys & m2.keys

    clues = acknowledged_clues(json_data)
    used_clues = Set.new

    # Secret leaks.
    stable_keys.each do |key|
      hit = m1[key]
      answer = hit[:answer]
      leaf = hit[:leaf]
      container = leaf[:container]
      lock_id = answer[:lock_id]

      clue = clues.find do |c|
        next false unless c['lock'].to_s == lock_id.to_s && !lock_id.nil?

        c['in'].to_s == container.to_s
      end

      if clue
        used_clues << clue.object_id
        if container.to_s.start_with?('global:')
          if GLOBAL_CLUES_ALLOWED
            issues << "⚠️ WARNING: acknowledged clue in a global ships at game start: #{lock_id} in #{container}: #{clue['reason']}"
          else
            issues << "❌ ERROR: secret leak: acknowledged clue in a global is not allowed: #{lock_id} in #{container}"
          end
        elsif inside_lock?(json_data, lock_id, container)
          issues << "❌ ERROR: secret leak: acknowledgedClues entry for '#{lock_id}' names '#{container}', which is the lock itself or inside its contents; that minigameData ships while the lock is shut"
        else
          issues << "ℹ️ acknowledged clue: #{lock_id} in #{container}: #{clue['reason']}"
        end
        next
      end

      where = container.to_s.start_with?('global:') ? container.to_s : "#{leaf[:source]} of #{container}"
      issues << "❌ ERROR: secret leak: the #{answer[:kind]} answer at #{answer[:path]} is also at #{leaf[:path]} (#{where}), which the browser receives at game start. Keep the value where the browser does not get it, or mark it as an acknowledgedClues entry"
    end

    # Stale and malformed markers.
    clues.each do |clue|
      next if used_clues.include?(clue.object_id)

      issues << "⚠️ WARNING: acknowledgedClues entry for '#{clue['lock']}' in '#{clue['in']}' matches no shown value (stale): remove it"
    end

    issues + lock_type_issues(json_data) + usepayload_issues(json_data)
  end

  # Item 4: requires with no resolved lock type, and the inert legacy fields.
  def lock_type_issues(data)
    issues = []
    rooms = data['rooms']
    return issues unless rooms.is_a?(Hash)

    # A room, object or item with a `requires` and no lockType anywhere: locked -> error, unlocked -> warning.
    walk = lambda do |node, path, in_doors|
      case node
      when Hash
        unless in_doors
          req = node['requires']
          if req && !node['lockType'].is_a?(String) && !path.include?('/social') && !node.key?('conditions')
            if node['locked'] == true
              issues << "❌ ERROR: secret leak: #{path} is locked with a `requires` but no `lockType`, so the server never strips it and the value ships. Set a `lockType`, or remove `requires`"
            else
              issues << "⚠️ WARNING: #{path} has a `requires` but no `lockType` and is not locked; the field is inert (delete it)"
            end
          end
        end
        node.each { |k, v| walk.call(v, "#{path}/#{k}", k == 'doors') }
      when Array
        node.each_with_index { |v, i| walk.call(v, "#{path}[#{i}]", in_doors) }
      end
    end
    walk.call(data, '', false)
    issues
  end

  # Item 6: a non-account usePayload with a secret but no targetId and no addCapture mapping on its
  # NPC can never be served.
  def usepayload_issues(data)
    cm = BreakEscape::CaptureModel
    issues = []
    cm.room_npc_list(data).each do |npc|
      payload = npc['usePayload']
      next unless payload.is_a?(Hash) && cm.present_string?(payload['secret'])
      next if cm.present_string?(payload['targetId'])
      next if cm.account_holder?(npc)

      has_mapping = Array(npc['eventMappings']).any? { |m| m.is_a?(Hash) && m['addCapture'].is_a?(Hash) }
      next if has_mapping

      issues << "⚠️ WARNING: NPC #{npc['id']} has a usePayload.secret but no targetId and no addCapture mapping, so this capture secret can never be served"
    end
    issues
  end

  # --- helpers -----------------------------------------------------------------------------

  def render_seeded(erb_path, seed)
    return nil unless erb_path && File.exist?(erb_path)

    srand(seed)
    text = BreakEscape::ScenarioBinding.render(File.read(erb_path))
    JSON.parse(text)
  rescue StandardError
    nil
  ensure
    srand(Random.new_seed)
  end

  def each_in(node, key, path = '', &block)
    case node
    when Hash
      node.each do |k, v|
        yield v, "#{path}/#{k}" if k == key
        each_in(v, key, "#{path}/#{k}", &block)
      end
    when Array
      node.each_with_index { |v, i| each_in(v, key, "#{path}[#{i}]", &block) }
    end
  end

  def flag_station_walk(data, &block)
    walk = lambda do |node, path|
      case node
      when Hash
        yield node['flags'], "#{path}/flags" if node['flags'].is_a?(Array) && node.key?('flagRewards')
        node.each { |k, v| walk.call(v, "#{path}/#{k}") }
      when Array
        node.each_with_index { |v, i| walk.call(v, "#{path}[#{i}]") }
      end
    end
    walk.call(data, '')
  end

  def each_capture_secret(data, &block)
    walk = lambda do |node, path|
      case node
      when Hash
        %w[usePayload addCapture capture].each do |key|
          sub = node[key]
          yield sub['secret'], "#{path}/#{key}/secret" if sub.is_a?(Hash) && sub.key?('secret')
        end
        node.each { |k, v| walk.call(v, "#{path}/#{k}") }
      when Array
        node.each_with_index { |v, i| walk.call(v, "#{path}[#{i}]") }
      end
    end
    walk.call(data, '')
  end
end

# The entry point validate_scenario.rb registers.
def check_secret_leaks(json_data, erb_path = nil)
  SecretLeaks.check(json_data, erb_path)
end
