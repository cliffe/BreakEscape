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
  # Card-reference kinds: `requires` names a collectible card/device id, which is equally valid as a
  # string ("badge") or a one-element array (["badge"]). The client fills and checks either, so the
  # two shapes are the same card and must not read as a mismatch.
  CARD_REFERENCE_LOCK_TYPES = %w[rfid biometric bluetooth].freeze

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
      # Yield the array whole so a combination answer can match an equal array (the array branch
      # of answer_matches_leaf?), then descend into its elements as scalars for every other kind.
      yield node, path
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

  # Always-shipped framing strings. GET /scenario ships scenario_brief and endGoal verbatim, and
  # GET /room ships each object's/room's name, door_sign and lockedHint; none is ever stripped. These
  # fields frame the mission and are never where a clue belongs, so an answer written out in one is a
  # slip (a player reading the Mission Brief sees the code). Note text and observations are left out
  # on purpose: they are the game's clue surfaces (a password on a post-it is the puzzle), and
  # checking them warned on every deliberate clue in the corpus. The copy-sink channels
  # (globalVariables/minigameData/scenarioData) are the error path above; these framing fields are
  # the warning path below.
  NARRATIVE_STRING_KEYS = %w[name door_sign lockedHint].freeze
  COPY_SINK_KEYS = %w[globalVariables minigameData scenarioData].freeze

  # The two conditional-text surfaces: an object's textVariants/observationVariants are arrays of
  # { condition, value } and the client ships EVERY variant's `value` at load, picking one by the
  # live globals (public/break_escape/js/utils/conditional-text.js). Nothing in app/ or lib/ reads
  # these keys, so the server never withholds a later variant, and an answer written into one is in
  # the browser before the condition that reveals it holds. This is the warning path (like the
  # narrative fields): a deliberate gated clue is declared with an acknowledgedClues entry.
  VARIANT_FIELD_KEYS = %w[textVariants observationVariants].freeze

  # The schema file, read once to list every property the server strips (x-serverOnly). A
  # revealOnGlobal object ships whole at load (revealOnGlobal is client-only too), so its
  # client-visible string leaves are scanned, minus the server-only keys and the lock answer.
  SCHEMA_PATH = File.expand_path('scenario-schema.json', __dir__)

  # Every property name the schema marks x-serverOnly (true or a conditional form). The server
  # deletes these before a payload ships, so a copy of an answer under one of them does not reach
  # the browser and must not be flagged as a revealOnGlobal leak. None of the display-text fields
  # (name, text, observations, door_sign, lockedHint) is server-only, so the scan keeps reading them.
  def server_only_keys
    @server_only_keys ||= begin
      schema = JSON.parse(File.read(SCHEMA_PATH))
      keys = Set.new
      walk = lambda do |node|
        case node
        when Hash
          props = node['properties']
          props.each { |name, sub| keys << name if sub.is_a?(Hash) && sub.key?('x-serverOnly') } if props.is_a?(Hash)
          node.each_value { |v| walk.call(v) }
        when Array
          node.each { |v| walk.call(v) }
        end
      end
      walk.call(schema)
      keys
    rescue StandardError
      Set.new
    end
  end

  # The shipped prose strings, each with its path and the id of the nearest enclosing object/room
  # (for an acknowledgedClues `in` match). Only strings the browser actually receives at game
  # start: the copy-sink subtrees are skipped (they are the error path above), and so is anything
  # inside a LOCKED node's `contents`, which the server strips and lazy-loads only once the lock
  # opens (Game#filter_requires_and_contents_recursive). A string inside a lock is withheld by the
  # same mechanism step 3 verifies, so flagging it would contradict that guarantee.
  def collect_narrative_strings(data)
    out = []
    %w[scenario_brief endGoal].each do |k|
      out << { value: data[k], path: k, container: k } if data[k].is_a?(String)
    end

    walk = lambda do |node, path, here_id, hidden|
      case node
      when Hash
        nid = node['id'].is_a?(String) ? node['id'] : here_id
        room_match = path.match(%r{\A/rooms/([^/]+)\z})
        container = room_match ? room_match[1] : nid
        unless hidden
          NARRATIVE_STRING_KEYS.each do |k|
            out << { value: node[k], path: "#{path}/#{k}", container: container } if node[k].is_a?(String)
          end
        end
        node_locked = node['locked'] == true
        node.each do |k, v|
          next if COPY_SINK_KEYS.include?(k)

          walk.call(v, "#{path}/#{k}", nid, hidden || (k == 'contents' && node_locked))
        end
      when Array
        node.each_with_index { |v, i| walk.call(v, "#{path}[#{i}]", here_id, hidden) }
      end
    end
    walk.call(data, '', nil, false)
    out
  end

  # The answer form used to match a narrative string: a combination is compared by its canonical
  # dash form ("12-30-5"), long enough for the whole-word rule, through the password branch of
  # answer_matches_leaf?; every other kind keeps its own value and kind, so the same minimum-length,
  # whole-word and case rules apply. A combination that does not parse yields nil (no match).
  def narrative_answer(answer)
    return answer unless answer[:kind] == 'combination'

    nums = BreakEscape::CaptureModel.combination_numbers(answer[:value])
    return nil if nums.nil?

    answer.merge(kind: 'password', value: nums.join('-'))
  end

  # Matches (answer, narrative string) in one render, keyed by (answer path, narrative path). Flags
  # are left out: a flag format in a brief is common flavour, not a leak of this class.
  def narrative_matches_for(data)
    answers = collect_answers(data).reject { |a| a[:kind] == 'flag' }
    narratives = collect_narrative_strings(data)
    out = {}
    answers.each do |answer|
      na = narrative_answer(answer)
      next if na.nil?

      narratives.each do |narr|
        next unless answer_matches_leaf?(na, { value: narr[:value] })

        out[[answer[:path], narr[:path]]] = { answer: answer, narrative: narr }
      end
    end
    out
  end

  # Every textVariants/observationVariants `value` string, with its path and the id of the nearest
  # enclosing object/room (for an acknowledgedClues `in` match). A variant inside a LOCKED object's
  # `contents` is withheld fresh (the server strips `contents`), so the same hidden rule as the
  # narrative walk skips it; a variant on an object that only hides client-side (revealOnGlobal, or
  # a conditional display) still ships, so it is kept.
  def collect_variant_strings(data)
    out = []
    walk = lambda do |node, path, here_id, hidden|
      case node
      when Hash
        nid = node['id'].is_a?(String) ? node['id'] : here_id
        room_match = path.match(%r{\A/rooms/([^/]+)\z})
        container = room_match ? room_match[1] : nid
        unless hidden
          VARIANT_FIELD_KEYS.each do |k|
            next unless node[k].is_a?(Array)

            node[k].each_with_index do |v, i|
              out << { value: v['value'], path: "#{path}/#{k}[#{i}]/value", container: container, field: k } if v.is_a?(Hash) && v['value'].is_a?(String)
            end
          end
        end
        node_locked = node['locked'] == true
        node.each { |k, v| walk.call(v, "#{path}/#{k}", nid, hidden || (k == 'contents' && node_locked)) }
      when Array
        node.each_with_index { |v, i| walk.call(v, "#{path}[#{i}]", here_id, hidden) }
      end
    end
    walk.call(data, '', nil, false)
    out
  end

  # The keys skipped when scanning a revealOnGlobal object's string leaves: the server-strips set,
  # the copy-sink and variant subtrees (their own surfaces above), the narrative display fields (the
  # narrative walk already warns on them), and the lock answer / reveal-trigger / sprite-name fields
  # (not display text). What is left is the client-visible prose the narrative walk leaves out on
  # purpose (`text`, `observations` and the like), which for a hidden-but-shipped object is the leak.
  def revealed_skip_keys
    @revealed_skip_keys ||=
      server_only_keys +
      COPY_SINK_KEYS + VARIANT_FIELD_KEYS + NARRATIVE_STRING_KEYS +
      %w[requires spriteVariants revealOnGlobal acknowledgedClues]
  end

  # Every client-visible string leaf of an object carrying revealOnGlobal (the object ships in the
  # room payload at load and is only hidden client-side until the global is set), with its path and
  # the reveal object's id as the container for an acknowledgedClues `in` match. A nested LOCKED
  # container's `contents` is still withheld fresh, so the hidden rule skips it.
  def collect_revealed_strings(data)
    out = []
    skip = revealed_skip_keys
    gather = lambda do |node, path, container, hidden|
      case node
      when Hash
        locked = node['locked'] == true
        node.each do |k, v|
          next if skip.include?(k)

          child_hidden = hidden || (k == 'contents' && locked)
          if v.is_a?(String)
            out << { value: v, path: "#{path}/#{k}", container: container, field: 'revealOnGlobal' } unless hidden
          else
            gather.call(v, "#{path}/#{k}", container, child_hidden)
          end
        end
      when Array
        node.each_with_index { |v, i| gather.call(v, "#{path}[#{i}]", container, hidden) }
      end
    end

    walk = lambda do |node, path|
      case node
      when Hash
        if node['revealOnGlobal'].is_a?(String)
          room_match = path.match(%r{\A/rooms/([^/]+)\z})
          rid = node['id'].is_a?(String) ? node['id'] : (room_match && room_match[1])
          gather.call(node, path, rid, false)
        end
        node.each { |k, v| walk.call(v, "#{path}/#{k}") }
      when Array
        node.each_with_index { |v, i| walk.call(v, "#{path}[#{i}]") }
      end
    end
    walk.call(data, '')
    out
  end

  # Matches (answer, variant/revealed string) in one render, keyed by (answer path, string path).
  # Flags are left out as the narrative check leaves them out (a flag format is common flavour), and
  # a combination is collapsed to its dash form by narrative_answer so the whole-word rule applies.
  def variant_matches_for(data)
    answers = collect_answers(data).reject { |a| a[:kind] == 'flag' }
    strings = collect_variant_strings(data) + collect_revealed_strings(data)
    out = {}
    answers.each do |answer|
      na = narrative_answer(answer)
      next if na.nil?

      strings.each do |str|
        next unless answer_matches_leaf?(na, { value: str[:value] })

        out[[answer[:path], str[:path]]] = { answer: answer, string: str }
      end
    end
    out
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

    # Narrative leaks (warning): an answer in an always-shipped prose field. Same double render, so a
    # random value that only collides under one seed is dropped.
    n1 = narrative_matches_for(first)
    n2 = narrative_matches_for(second)
    (n1.keys & n2.keys).each do |key|
      hit = n1[key]
      answer = hit[:answer]
      narr = hit[:narrative]
      container = narr[:container]
      lock_id = answer[:lock_id]

      clue = clues.find do |c|
        next false if lock_id.nil?

        c['lock'].to_s == lock_id.to_s && c['in'].to_s == container.to_s
      end

      if clue
        used_clues << clue.object_id
        issues << "ℹ️ acknowledged clue in narrative: #{lock_id} in #{container}: #{clue['reason']}"
      else
        issues << "⚠️ WARNING: possible secret leak: the #{answer[:kind]} answer at #{answer[:path]} also appears in the shipped narrative string at #{narr[:path]}, which the browser receives at game start. Reword it so the answer is not written out, or, if it is a deliberate clue, add an acknowledgedClues entry"
      end
    end

    # Variant and revealOnGlobal leaks (warning): an answer in a textVariants/observationVariants
    # value or in a revealOnGlobal object's shipped display text. Same double render, so a random
    # value that only collides under one seed is dropped.
    v1 = variant_matches_for(first)
    v2 = variant_matches_for(second)
    (v1.keys & v2.keys).each do |key|
      hit = v1[key]
      answer = hit[:answer]
      str = hit[:string]
      container = str[:container]
      lock_id = answer[:lock_id]

      clue = clues.find do |c|
        next false if lock_id.nil?

        c['lock'].to_s == lock_id.to_s && c['in'].to_s == container.to_s
      end

      if clue
        used_clues << clue.object_id
        issues << "ℹ️ acknowledged clue in #{str[:field]}: #{lock_id} in #{container}: #{clue['reason']}"
      else
        opens = lock_id ? "opens the '#{lock_id}' lock" : "a #{answer[:kind]} secret"
        marker = "lock: #{lock_id || '<lock id>'}, in: #{container}"
        issues << "⚠️ WARNING: possible secret leak: the #{answer[:kind]} answer at #{answer[:path]} (#{opens}) also appears in the #{str[:field]} field at #{str[:path]}, which the browser receives at game start though the object is hidden until earned. Move the text so the browser does not get it until the lock opens, or, if it is a deliberate gated clue, add an acknowledgedClues entry (#{marker})"
      end
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
    issues + door_entry_issues(rooms)
  end

  # Item 4, door entries. The server strips `requires` only from a node that carries its own
  # lockType (GamesController#filter_requires_recursive, Game#filter_inventory_for_client!), so a
  # bare door entry's `requires` ships in the room payload. Two findings:
  #   error: a bare entry (no own lockType) whose connected room has a secret lock type (pin,
  #     password, combination, cryptex); its `requires` ships and, if it equals the room answer,
  #     reads the room code off the door. An rfid/biometric/bluetooth card id is not a secret, so
  #     it is not flagged;
  #   warning: an entry whose own lock type or `requires` differs from its connected room's; the
  #     server checks the room's lock, so the player sees one lock and the server checks another.
  # Only entries NpcHabits.doorway_problem clears are resolved, as each_lock_answer does; an entry
  # it flags is one the client never reads.
  def door_entry_issues(rooms)
    issues = []
    rooms.each do |room_id, room|
      next unless room.is_a?(Hash) && room['doors'].is_a?(Array)

      room['doors'].each_with_index do |entry, i|
        next unless entry.is_a?(Hash)
        next unless BreakEscape::NpcHabits.doorway_problem(room, i).nil?

        connected = rooms[entry['connectedRoom']]
        next unless connected.is_a?(Hash)

        own_lock_type = entry['lockType'].is_a?(String) ? entry['lockType'] : nil
        room_lock_type = connected['lockType'].is_a?(String) ? connected['lockType'] : nil
        resolved = own_lock_type || room_lock_type
        path = "rooms/#{room_id}/doors[#{i}]"

        if own_lock_type.nil? && entry.key?('requires') && ANSWER_LOCK_TYPES.include?(resolved)
          issues << "❌ ERROR: secret leak: #{path} ships its `requires` because the server filter reads the entry's own `lockType` and this entry has none while its connected room '#{entry['connectedRoom']}' is a #{resolved} lock; set a `lockType` on the entry, or remove `requires` and let the room carry it"
          next
        end

        lock_type_differs = !own_lock_type.nil? && own_lock_type != room_lock_type
        # For a card-reference lock the card id is the same whether written as a string or a
        # one-element array, so normalise both sides to an array before comparing; a string in one
        # place and an array in the other is not a mismatch. Secret kinds stay a raw comparison,
        # where a true display/server split matters.
        requires_differs =
          if !entry.key?('requires')
            false
          elsif CARD_REFERENCE_LOCK_TYPES.include?(resolved)
            Array(entry['requires']) != Array(connected['requires'])
          else
            entry['requires'] != connected['requires']
          end
        if lock_type_differs || requires_differs
          issues << "⚠️ WARNING: #{path} has a lock type or `requires` that differs from its connected room '#{entry['connectedRoom']}'; the server checks the room's lock, so the player sees one lock and the server checks another"
        end
      end
    end
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
