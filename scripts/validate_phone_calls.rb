# frozen_string_literal: true

# Phone calls: the `ring` and `call` scenario forms, `#place_call`, voicemail knots and the "call me"
# rule (docs/achitechture/PHONE_CALLS_PLAN.md, 3.1 to 3.5 and 4.3). One entry point,
# check_phone_calls(json_data, base_dir), called by scripts/validate_scenario.rb.
#
# Field names, values and defaults follow public/break_escape/js/minigames/phone-chat/phone-ring-config.js
# (normaliseRing, normaliseCall). Where the engine warns and falls back, this check reports the same
# problem: an error where the plan says error, a warning where it says warning.
#
# It reads the compiled ink JSON next to each contact's story (the validator compiles it first) for
# knots and diverts, and the .ink source for tags, VAR lines and spoken text.
require 'json'
require 'set'

module ValidatePhoneCalls
  RING_KEYS = %w[onMissed voicemailKnot withheld untilAnswered].freeze
  CALL_KEYS = %w[knot when unavailable button].freeze
  ON_MISSED = %w[callback voicemail].freeze
  UNAVAILABLE = %w[no_answer hidden].freeze
  CALL_ME = /\b(?:call|ring) me\b/i.freeze
  # Stage business between asterisks or in parentheses (dialoguelint.mjs STAGE_VERB)
  STAGE_VERB = /\A(?:sigh|laugh|pause|nod|shrug|cough|exhale|inhale|smile|grin|wink|chuckle|snort|groan|gasp|sniff|frown|scoff|smirk|yawn|whistle|mutter|whisper|wince|blink|glance|cry|sob|giggle|shudder|gulp|swallow|hesitate|beat|beep|grunt|huff|tut|clap|squint)(?:s|es|ed|d|ing)?\z/i.freeze
  DIVERT_KEYS = %w[-> ->t-> f() ^-> *].freeze

  module_function

  def check(json_data, base_dir)
    issues = []
    return issues unless json_data.is_a?(Hash)

    phones = phone_objects(json_data)
    records(json_data).each do |npc, path|
      next unless npc.is_a?(Hash)

      issues.concat(check_npc(npc, path, base_dir, phones))
    end
    issues
  end

  # ---- records, ink ----------------------------------------------------------------------

  def records(json_data)
    list = []
    if json_data['rooms'].is_a?(Hash)
      json_data['rooms'].each do |room_id, room|
        next unless room.is_a?(Hash) && room['npcs'].is_a?(Array)

        room['npcs'].each_with_index { |npc, i| list << [npc, "rooms/#{room_id}/npcs[#{i}]"] }
      end
    end
    list += scenario_npc_records(json_data).reject { |_, p| p.start_with?('rooms/') } if respond_to?(:scenario_npc_records, true)
    list
  end

  # Phone items anywhere in the scenario: { phoneId => Set of npcIds }
  def phone_objects(json_data)
    out = Hash.new { |h, k| h[k] = Set.new }
    walk = lambda do |node|
      case node
      when Hash
        if node['npcIds'].is_a?(Array) && node['phoneId'].is_a?(String)
          node['npcIds'].each { |id| out[node['phoneId']] << id.to_s }
          out[node['phoneId']] # make the key exist even for an empty list
        end
        node.each_value { |v| walk.call(v) }
      when Array
        node.each { |v| walk.call(v) }
      end
    end
    walk.call(json_data)
    out
  end

  def knot_name(path)
    path.to_s.split('.').first.to_s
  end

  def read_ink(npc, base_dir)
    sp = npc['storyPath']
    return [nil, nil] unless sp.is_a?(String) && !sp.empty?

    json_path = File.join(base_dir, sp.sub(/\.ink\z/, '.json'))
    src_path = File.join(base_dir, sp.sub(/\.(?:ink\.)?json\z/, '.ink'))
    compiled = nil
    if File.exist?(json_path)
      begin
        compiled = JSON.parse(File.read(json_path))
      rescue JSON::ParserError
        compiled = nil
      end
    end
    source = File.exist?(src_path) ? File.readlines(src_path, chomp: true) : nil
    [compiled, source]
  end

  def named_knots(compiled)
    root = compiled.is_a?(Hash) ? compiled['root'] : nil
    named = root.is_a?(Array) ? root.last : nil
    named.is_a?(Hash) ? named : nil
  end

  def divert_targets(node, out = [])
    case node
    when Array
      node.each { |n| divert_targets(n, out) }
    when Hash
      node.each do |key, value|
        if DIVERT_KEYS.include?(key)
          out << value if value.is_a?(String) && !value.start_with?('.') && !node['var']
        elsif value.is_a?(Array) || value.is_a?(Hash)
          divert_targets(value, out)
        end
      end
    end
    out
  end

  # The knots reachable from `starts`, never entering `home` (nil: no stop). Mirrors
  # TtsLineExtractor.reachable_knots.
  def reachable_knots(named, starts, home)
    knots = Set.new
    return knots unless named

    known = ->(name) { name != 'global decl' && named[name].is_a?(Array) }
    queue = starts.select { |k| known.call(k) }
    until queue.empty?
      knot = queue.shift
      next unless knots.add?(knot)

      divert_targets(named[knot]).each do |target|
        nxt = knot_name(target)
        queue << nxt if nxt != home && known.call(nxt) && !knots.include?(nxt)
      end
    end
    knots
  end

  def reads_var?(node, name)
    case node
    when Array then node.any? { |n| reads_var?(n, name) }
    when Hash then node['VAR?'] == name || node.each_value.any? { |v| reads_var?(v, name) }
    else false
    end
  end

  # { line index => knot name } for an ink source (stitches belong to their knot)
  def knot_of_lines(source)
    knot = nil
    source.map do |line|
      if (m = line.strip.match(/\A={2,}\s*(?:function\s+)?(\w+)/))
        knot = m[1]
      end
      knot
    end
  end

  # ---- per-NPC ----------------------------------------------------------------------------

  def check_npc(npc, path, base_dir, phones)
    issues = []
    err = ->(msg) { issues << "❌ ERROR: phone calls: '#{path}' (#{npc['id']}) #{msg}" }
    warn = ->(msg) { issues << "⚠️ WARNING: phone calls: '#{path}' (#{npc['id']}) #{msg}" }

    is_phone = npc['npcType'] == 'phone'
    voiced = npc['voiced'] == true
    home = knot_name(npc['currentKnot'] || 'start')
    compiled, source = read_ink(npc, base_dir)
    named = named_knots(compiled)
    knot_exists = ->(k) { named.nil? || (k != 'global decl' && named[k].is_a?(Array)) }

    # ---- ring units: mappings and the timedConversation ----
    rings = []
    Array(npc['eventMappings']).each_with_index do |m, i|
      next unless m.is_a?(Hash) && ring_present?(m)

      rings << { cfg: m, where: "eventMappings[#{i}]", mapping: true }
    end
    tc = npc['timedConversation']
    rings << { cfg: tc, where: 'timedConversation', mapping: false } if tc.is_a?(Hash) && ring_present?(tc)

    ring_starts = []
    ring_callback = false
    voicemail_knots = []
    rings.each do |r|
      cfg = r[:cfg]
      where = r[:where]
      forced = cfg['disableClose'] == true
      mode = r[:mapping] ? cfg['conversationMode'] : (cfg['videoCall'] == true || cfg['conversationMode'] == 'video-call' ? 'video-call' : 'phone-chat')
      err.call("#{where}: ring is not allowed on a non-phone NPC (npcType #{npc['npcType'].inspect})") unless is_phone
      if mode == 'video-call'
        err.call("#{where}: ring is not allowed on a video call")
      elsif mode != 'phone-chat'
        err.call("#{where}: ring needs conversationMode \"phone-chat\" (got #{mode.inspect})")
      end

      raw = cfg['ring']
      src = raw == true ? {} : raw
      unless raw == true || raw.is_a?(Hash)
        err.call("#{where}: ring must be true or an object, got #{raw.class.to_s.downcase}")
        src = {}
      end
      src.each_key { |k| warn.call("#{where}: ring has an unknown field \"#{k}\" (the engine ignores it)") unless RING_KEYS.include?(k) }

      on_missed = 'callback'
      if src.key?('onMissed')
        if ON_MISSED.include?(src['onMissed'])
          on_missed = src['onMissed']
        else
          err.call("#{where}: ring.onMissed must be \"callback\" or \"voicemail\", got #{src['onMissed'].inspect}")
        end
      end
      vm = src['voicemailKnot']
      unless vm.nil?
        if vm.is_a?(String) && !vm.strip.empty?
          vm = vm.strip
          voicemail_knots << vm
          err.call("#{where}: ring.voicemailKnot \"#{vm}\" is not a knot in the contact's ink") unless knot_exists.call(vm)
        else
          err.call("#{where}: ring.voicemailKnot must be a non-empty string")
          vm = nil
        end
      end
      err.call("#{where}: ring.onMissed \"voicemail\" needs ring.voicemailKnot") if on_missed == 'voicemail' && vm.nil?
      ring_callback = true if on_missed == 'callback'

      withheld = false
      if src.key?('withheld')
        if [true, false].include?(src['withheld'])
          withheld = src['withheld']
        else
          err.call("#{where}: ring.withheld must be true or false")
        end
      end
      if withheld && on_missed != 'voicemail' && !forced
        err.call("#{where}: a withheld call cannot be rung back, so ring.withheld needs ring.onMissed \"voicemail\" (or disableClose)")
      end

      until_answered = false
      if src.key?('untilAnswered')
        if [true, false].include?(src['untilAnswered'])
          until_answered = src['untilAnswered']
        else
          err.call("#{where}: ring.untilAnswered must be true or false")
        end
      end
      warn.call("#{where}: ring.untilAnswered has no effect on a forced call (disableClose), which auto-answers") if until_answered && forced

      target = cfg['targetKnot'] || cfg['knot']
      if target.is_a?(String) && !target.empty?
        tk = knot_name(target)
        ring_starts << tk
        err.call("#{where}: targetKnot \"#{tk}\" is the contact's home knot; put the call in its own knot (plan 3.1)") if tk == home && !voiced
        err.call("#{where}: targetKnot \"#{tk}\" is not a knot in the contact's ink") unless knot_exists.call(tk)
        if until_answered && !forced && named && knot_exists.call(tk)
          reach = reachable_knots(named, [tk], home)
          unless reach.any? { |k| reads_var?(named[k], 'call_answer_seconds') }
            warn.call("#{where}: ring.untilAnswered, but the call never reads call_answer_seconds; add a line for a long wait (plan 3.1, 2.11)")
          end
        end
      end
    end

    # ---- contact `call` entries ----
    call_entries = []
    raw_call = npc['call']
    unless raw_call.nil? || raw_call == false
      if !is_phone
        err.call('call is only for phone NPCs')
      end
      list = raw_call.is_a?(Array) ? raw_call : [raw_call]
      err.call('call must be an object or a list of objects') unless raw_call.is_a?(Hash) || raw_call.is_a?(Array)
      list.each_with_index do |entry, i|
        where = raw_call.is_a?(Array) ? "call[#{i}]" : 'call'
        unless entry.is_a?(Hash)
          err.call("#{where} must be an object")
          next
        end
        entry.each_key { |k| warn.call("#{where}: unknown field \"#{k}\" (the engine ignores it)") unless CALL_KEYS.include?(k) }
        knot = entry['knot']
        unless knot.is_a?(String) && !knot.strip.empty?
          err.call("#{where}.knot is required and must be a string")
          next
        end
        knot = knot.strip
        call_entries << knot
        err.call("#{where}.knot \"#{knot}\" is the contact's home knot; put the call in its own knot (plan 3.2)") if knot == home && !voiced
        err.call("#{where}.knot \"#{knot}\" is not a knot in the contact's ink") unless knot_exists.call(knot)
        if entry.key?('when') && !entry['when'].nil?
          if entry['when'].is_a?(String) && !entry['when'].strip.empty?
            bad = when_misuse(entry['when'])
            err.call("#{where}.when uses #{bad}, which a call condition cannot read (only globalVars. terms; plan 3.2)") if bad
          else
            err.call("#{where}.when must be a condition string")
          end
        end
        if entry.key?('unavailable') && !UNAVAILABLE.include?(entry['unavailable'])
          err.call("#{where}.unavailable must be \"no_answer\" or \"hidden\", got #{entry['unavailable'].inspect}")
        end
        err.call("#{where}.button must be true or false") if entry.key?('button') && ![true, false].include?(entry['button'])
      end
    end

    has_ring = !rings.empty?
    has_call = !call_entries.empty?
    call_contact = has_ring || has_call
    # A contact with an old-style voiced form (voiced contact, mapping or timedConversation) already
    # takes calls, so the "call me" and unused-VAR warnings leave it alone (plan gap, see the log).
    voiced_form = voiced || (tc.is_a?(Hash) && tc['voiced'] == true) ||
                  Array(npc['eventMappings']).any? { |m| m.is_a?(Hash) && m['voiced'] == true && m['conversationMode'] == 'phone-chat' }

    warn.call('has a ring or call entry but no voice; the call would have no voice (plan 4.3)') if call_contact && (npc['voice'].nil? || npc['voice'] == {} || npc['voice'].to_s.strip.empty?)
    warn.call('has callId and a call entry: the call button is hidden while callId is set') if has_call && npc['callId']

    # A `call` contact the phone never lists
    if has_call && is_phone
      listed = phones[npc['phoneId'] || 'player_phone']
      gives_history = has_ring || !Array(npc['timedMessages']).empty? ||
                      Array(npc['eventMappings']).any? { |m| m.is_a?(Hash) && m['sendTimedMessage'].is_a?(Hash) }
      if phones.key?(npc['phoneId'] || 'player_phone') && !listed.include?(npc['id'].to_s) && !gives_history
        warn.call("has a call entry but is not in its phone's npcIds and nothing gives it history (no ring, timedMessages or sendTimedMessage): its thread, and so its call button, never appears")
      end
    end

    # ---- ink: VARs, #place_call, call set ----
    if source
      issues.concat(ink_var_checks(source, npc, path, call_contact || voiced_form))
      issues.concat(place_call_checks(source, npc, path, call_entries, has_ring, ring_callback))
    end

    starts = (ring_starts + call_entries).uniq
    if named && !starts.empty? && !voiced
      reach_home = reachable_knots(named, [home], nil)
      starts.each do |s|
        warn.call("call start knot \"#{s}\" is reachable from the home knot \"#{home}\": a thread opened by hand would replay the call as silent texts (plan 3.5)") if reach_home.include?(s) && s != home
      end
      call_set = reachable_knots(named, starts, home)
      (call_set - starts.to_set).each do |k|
        warn.call("knot \"#{k}\" is in the call and also reachable from the home knot \"#{home}\": the thread and the call share it, and the call voices it (plan 3.5)") if reach_home.include?(k) && k != home
      end
      call_set.each do |k|
        if divert_targets(named[k]).any? { |t| knot_name(t) == home }
          warn.call("call knot \"#{k}\" diverts to the home knot \"#{home}\": the text thread's lines would run inside the call; end with #exit_conversation and -> DONE (plan 3.5)")
        end
      end
    end

    # Voiced-line checks: the call set and the voicemail knots
    if source && named && call_contact
      voiced_knots = reachable_knots(named, starts + voicemail_knots, home)
      voiced_knots += reachable_knots(named, voicemail_knots, nil)
      issues.concat(voiced_line_checks(source, voiced_knots, path, npc))
    end

    # "Call me" with nothing to call
    issues.concat(call_me_checks(npc, path, source, named, home)) unless call_contact || voiced_form

    issues
  end

  def ring_present?(cfg)
    cfg.key?('ring') && !cfg['ring'].nil? && cfg['ring'] != false
  end

  # `value`, `name` or `data.` in a call.when
  def when_misuse(cond)
    s = cond.gsub(/(["'])(?:\\.|(?!\1).)*\1/, '""').gsub(/globalVars\.\w+/, 'GV')
    return '`data.`' if s =~ /\bdata\s*\./
    return '`value`' if s =~ /\bvalue\b/
    return '`name`' if s =~ /\bname\b/

    nil
  end

  # ---- ink source checks ----------------------------------------------------------------

  def ink_var_checks(source, npc, path, call_contact)
    issues = []
    source.each_with_index do |line, i|
      m = line.match(/\A\s*VAR\s+(call_answer_seconds|call_is_callback)\s*=\s*(.+?)\s*(?:\/\/.*)?\z/)
      next unless m

      name = m[1]
      default = m[2].strip
      ok = name == 'call_answer_seconds' ? default.match?(/\A-?\d+\z/) : %w[true false].include?(default)
      want = name == 'call_answer_seconds' ? 'an integer' : 'true or false'
      sp = File.basename(npc['storyPath'].to_s).sub(/\.json\z/, '.ink')
      if !ok
        issues << "❌ ERROR: phone calls: '#{path}' (#{npc['id']}) #{sp}:#{i + 1}: VAR #{name} must default to #{want}, got #{default}"
      elsif !call_contact
        issues << "⚠️ WARNING: phone calls: '#{path}' (#{npc['id']}) #{sp}:#{i + 1}: VAR #{name} is declared, but the contact has no ring and no call entry, so it is always #{name == 'call_answer_seconds' ? '0' : 'false'}"
      end
    end
    issues
  end

  def place_call_checks(source, npc, path, call_entries, has_ring, ring_callback)
    issues = []
    sp = File.basename(npc['storyPath'].to_s).sub(/\.json\z/, '.ink')
    source.each_with_index do |line, i|
      code = line.sub(%r{(^|\s)//.*\z}, '')
      m = code.match(/(?<!\\)#\s*place_call\b(?:\s*:\s*([\w.]+))?/)
      next unless m

      at = "'#{path}' (#{npc['id']}) #{sp}:#{i + 1}"
      knot = m[1] ? knot_name(m[1]) : nil
      if code.strip.match?(/\A[*+]/)
        issues << "❌ ERROR: phone calls: #{at}: #place_call on a choice line is never run (a tag in or after a choice's brackets does not fire); put the tag on its own line in the choice's body, then -> DONE (plan 3.2)"
      else
        nxt = source[(i + 1)..].to_a.map { |l| l.sub(%r{(^|\s)//.*\z}, '').strip }.find { |l| !l.empty? }
        unless nxt && nxt.match?(/\A->\s*DONE\b/)
          issues << "⚠️ WARNING: phone calls: #{at}: the line after #place_call is not -> DONE, so the next visible line would be typed before the phone dials (plan 2.5)"
        end
      end
      if knot
        unless call_entries.include?(knot)
          issues << "❌ ERROR: phone calls: #{at}: #place_call:#{knot} is not one of the contact's call entries"
        end
      elsif call_entries.empty? && !(has_ring && ring_callback)
        issues << "❌ ERROR: phone calls: #{at}: #place_call with no knot, but the contact has no call entry and no ring with onMissed \"callback\" to dial"
      end
    end
    issues
  end

  # A spoken NPC line of the voiced set: not a comment, choice header, tag, logic, divert or Narrator line.
  # Returns the text to inspect or nil.
  def spoken_text(line)
    s = line.sub(%r{(^|\s)//.*\z}, '').strip
    return nil if s.empty? || s.start_with?('#', '~', '->', '<-', '=') || s.match?(/\A(?:VAR|CONST|EXTERNAL|INCLUDE|LIST)\b/)

    if s.match?(/\A[*+]/)
      # a choice: only text after the closing bracket is the NPC's
      after = s[/\]\s*(.*)\z/, 1]
      s = after.to_s
    end
    s = s.sub(/\A-(?!>)\s*(?:[^:{}]*:\s*)?/, '') if s.start_with?('-')
    s = s.sub(/(?<!\\)\s#.*\z/, '').sub(/\s*->\s*\S+\s*\z/, '')
    return nil if s.strip.empty? || s.match?(/\ANarrator(?:\[[^\]]*\])?:/i)

    s
  end

  def voiced_line_checks(source, knots, path, npc)
    issues = []
    sp = File.basename(npc['storyPath'].to_s).sub(/\.json\z/, '.ink')
    knot_at = knot_of_lines(source)
    source.each_with_index do |line, i|
      next unless knots.include?(knot_at[i])

      s = spoken_text(line)
      next unless s

      at = "'#{path}' (#{npc['id']}) #{sp}:#{i + 1}"
      printed = s.scan(/\{([^{}]*)\}/).flatten.find do |inner|
        inner = inner.strip
        !inner.empty? && !inner.match?(/[:|]/) && !inner.match?(/\A[-~&!]/)
      end
      if printed
        issues << "⚠️ WARNING: phone calls: #{at}: a voiced call line prints {#{printed.strip}}; voiced lines can't print variables (choose between whole lines with conditionals)"
      end
      stage = s.scan(/\*([^*\s][^*]{0,60})\*/).flatten.find { |c| c =~ /\s/ || c.match?(STAGE_VERB) } ||
              s.scan(/\(([A-Za-z]+)[^)]*\)/).flatten.find { |c| c.match?(STAGE_VERB) }
      if stage
        issues << "⚠️ WARNING: phone calls: #{at}: a voiced call line has an inline stage direction (#{stage}); use a #delivery: tag"
      end
    end
    issues
  end

  # ---- "call me" --------------------------------------------------------------------------

  def message_texts(npc)
    out = []
    Array(npc['timedMessages']).each_with_index do |t, i|
      out << ["timedMessages[#{i}]", t['message']] if t.is_a?(Hash)
    end
    Array(npc['eventMappings']).each_with_index do |m, i|
      next unless m.is_a?(Hash)

      stm = m['sendTimedMessage']
      out << ["eventMappings[#{i}].sendTimedMessage", stm['message']] if stm.is_a?(Hash)
      bark = m['bark']
      out << ["eventMappings[#{i}].bark", bark.is_a?(Hash) ? bark['message'] : bark] if bark
      out << ["eventMappings[#{i}].message", m['message']] if m['message'].is_a?(String)
    end
    out
  end

  def call_me_checks(npc, path, source, named, home)
    issues = []
    # Phone contacts only: an in-person NPC quoting "call me" is a person-chat line, not a text thread.
    return issues unless npc['npcType'] == 'phone'

    # The same text on many mappings (m06 repeats one per branch) is one warning with a count.
    grouped = {}
    message_texts(npc).each do |where, text|
      next unless text.is_a?(String) && text.match?(CALL_ME)

      (grouped[text] ||= []) << where
    end
    grouped.each do |text, wheres|
      more = wheres.size > 1 ? " (and #{wheres.size - 1} more with the same text: #{wheres[1..].first(3).join(', ')}#{wheres.size > 4 ? ', ...' : ''})" : ''
      issues << "⚠️ WARNING: phone calls: '#{path}/#{wheres.first}' (#{npc['id']}) says \"#{text[0, 80]}\", but this contact has no call entry and no ring, so the player can't call (plan 3.5, 7.3)#{more}"
    end
    return issues unless source

    # Old-style voiced calls (voiced contact, mapping or timed) are calls already: skip their knots.
    skip = Set.new
    if named
      starts = []
      starts << home if npc['voiced'] == true
      Array(npc['eventMappings']).each do |m|
        next unless m.is_a?(Hash) && m['voiced'] == true && m['conversationMode'] == 'phone-chat'

        starts << knot_name(m['targetKnot'] || m['knot'] || home)
      end
      tc = npc['timedConversation']
      starts << knot_name(tc['targetKnot']) if tc.is_a?(Hash) && tc['voiced'] == true && tc['targetKnot']
      skip = reachable_knots(named, starts, nil)
    end
    sp = File.basename(npc['storyPath'].to_s).sub(/\.json\z/, '.ink')
    knot_at = knot_of_lines(source)
    source.each_with_index do |line, i|
      next if skip.include?(knot_at[i])

      s = line.sub(%r{(^|\s)//.*\z}, '').strip
      next if s.empty? || s.start_with?('#', '~', '=')

      s = s[/\]\s*(.*)\z/, 1].to_s if s.match?(/\A[*+]/)
      next unless s.match?(CALL_ME)

      issues << "⚠️ WARNING: phone calls: '#{path}' (#{npc['id']}) #{sp}:#{i + 1} says \"#{s[0, 80]}\", but this contact has no call entry and no ring, so the player can't call (plan 3.5, 7.3)"
    end
    issues
  end
end

def check_phone_calls(json_data, base_dir)
  ValidatePhoneCalls.check(json_data, base_dir)
end
