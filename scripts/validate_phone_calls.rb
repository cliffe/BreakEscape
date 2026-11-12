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
  RING_KEYS = %w[onMissed voicemailKnot withheld untilAnswered callbackWhen ringWhile].freeze
  CALL_KEYS = %w[knot when unavailable button].freeze
  ON_MISSED = %w[callback voicemail].freeze
  UNAVAILABLE = %w[no_answer hidden].freeze
  CALL_ME = /\b(?:call|ring|phone) me\b/i.freeze
  # A promise of a call without "me": "Call anytime.", "Call if you get stuck.", "Phone me when ..."
  # (review A7a R2, N1). A match inside CALL_NOUN ("your call if") or SELF_RING ("I'll ring when")
  # is not a request to the player.
  CALL_PROMISE = /\b(?:call|ring|phone)(?:\s+me)?\s+(?:anytime|any\s+time|whenever|if|when|once)\b|\b(?:call|ring|phone)\s+back\b|\bcall\s+it\s+in\b/i.freeze
  CALL_NOUN = /\b(?:a|the|your|my|his|her|our|their|that|this|next|last|first|one|whose|on)\s+(?:(?:judg(?:e)?ment|conference|phone|video|voice|quick|short|long|bad|good|close|tough|hard|big|hot)\s+)?(?:call|ring|phone)\b/i.freeze
  SELF_RING = /\b(?:I['\u2019]ll|I will|we['\u2019]ll|she['\u2019]ll|he['\u2019]ll|they['\u2019]ll|I['\u2019]d)\s+(?:call|ring|phone)\b/i.freeze
  # Someone else's call back (review A7a R3, m1): "Tell him to call back", "Did she call back?",
  # "Ask Dev to ring back", "We will call back". "you to call back" is still a request.
  OTHER_RING = /\b(?:(?:he|she|they|we|it)(?:\s+(?:will|would|shall|should|may|might|must|could))?|(?!you\b)\w+\s+to)\s+(?:call|ring|phone)\b/i.freeze
  # Stage business between asterisks or in parentheses (dialoguelint.mjs STAGE_VERB)
  STAGE_VERB = /\A(?:sigh|laugh|pause|nod|shrug|cough|exhale|inhale|smile|grin|wink|chuckle|snort|groan|gasp|sniff|frown|scoff|smirk|yawn|whistle|mutter|whisper|wince|blink|glance|cry|sob|giggle|shudder|gulp|swallow|hesitate|beat|beep|grunt|huff|tut|clap|squint)(?:s|es|ed|d|ing)?\z/i.freeze
  DIVERT_KEYS = %w[-> ->t-> f() ^-> *].freeze

  module_function

  def check(json_data, base_dir)
    issues = []
    return issues unless json_data.is_a?(Hash)

    phones = phone_objects(json_data)
    recs = records(json_data).select { |npc, _| npc.is_a?(Hash) }
    globals = known_globals(json_data, recs, base_dir)
    recs.each do |npc, path|
      issues.concat(check_npc(npc, path, base_dir, phones, globals))
    end
    issues
  end

  # True when the text asks the player to call: "call me", or a call promise that is not a noun use
  # ("your call if") or the NPC's own ring ("I'll ring when ...").
  def call_promise?(text)
    return true if text.match?(CALL_ME)

    excuses = text.to_enum(:scan, Regexp.union(CALL_NOUN, SELF_RING, OTHER_RING)).map { Regexp.last_match.then { |m| m.begin(0)...m.end(0) } }
    text.to_enum(:scan, CALL_PROMISE).any? do
      m = Regexp.last_match
      excuses.none? { |r| r.begin < m.end(0) && m.begin(0) < r.end }
    end
  end

  # ---- globals (N2) ---------------------------------------------------------------------

  # Names a `globalVars.<name>` condition can see: globalVariables keys, the names a game merges in at
  # creation from importGlobals (CarryOver.import_name; they are not in globalVariables in the file),
  # names any engine setter writes (see the walk below), and `#set_global:` / `#set_variable:` tags in any contact's ink.
  def known_globals(json_data, recs, base_dir)
    names = Set.new
    gv = json_data['globalVariables']
    names.merge(gv.keys.map(&:to_s)) if gv.is_a?(Hash)
    imported = json_data['importedGlobals']
    names.merge(imported.keys.map(&:to_s)) if imported.is_a?(Hash)
    Array(json_data['importGlobals']).each do |e|
      n = carry_over_name(e)
      names << n if n
    end
    # Every setter the engine has (same set as validate_scenario.rb check_globals_never_read, plus
    # `set_global` action nodes): setGlobal / setVariable hashes, setGlobal* and globalVarOnKO strings
    # (not setGlobalPrefix), {type: set_global, key:}.
    walk = lambda do |node|
      case node
      when Hash
        node.each do |k, v|
          if %w[setGlobal setVariable].include?(k) && v.is_a?(Hash)
            v.each_key { |n| names << n.to_s }
          elsif k != 'setGlobalPrefix' && (k.to_s.start_with?('setGlobal') || k == 'globalVarOnKO') && v.is_a?(String) && !v.empty?
            names << v
          end
        end
        names << node['key'].to_s if node['type'] == 'set_global' && node['key'].is_a?(String)
        node.each_value { |v| walk.call(v) }
      when Array
        node.each { |v| walk.call(v) }
      end
    end
    walk.call(json_data)
    recs.each do |npc, _|
      _, source = read_ink(npc, base_dir)
      source&.each { |l| l.scan(/#\s*set_(?:global|variable)\s*:\s*(\w+)/) { |(n)| names << n } }
    end
    names
  end

  # Mirrors the engine model BreakEscape::CarryOver.import_name (app/models/break_escape/carry_over.rb),
  # which is what actually merges the imports into globalVariables at game creation. This is a separate
  # copy from validate_scenario.rb's carry_over_import_name (review A7a R3 nit 4): that one keeps a
  # blank `completed`/`as` as "" where this one treats a blank as "no name", because here the result
  # feeds a `globalVars.\w+` match that a "" could never satisfy. Keep this copy faithful to the model.
  def carry_over_name(entry)
    return nil unless entry.is_a?(Hash)
    return (entry['completed'].to_s.empty? ? nil : entry['completed'].to_s) if entry.key?('completed')
    return entry['as'].to_s unless entry['as'].to_s.empty?

    prefix = entry['from'].to_s[/\A((?:m|sis)\d\d)_/, 1]
    prefix && !entry['var'].to_s.empty? ? "#{prefix}_#{entry['var']}" : nil
  end

  def global_names(cond)
    cond.to_s.scan(/globalVars\.(\w+)/).flatten.uniq
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

  # Functions: called from both sides without being a shared knot. The names come from the `f()` diverts
  # of the compiled ink, which holds INCLUDE'd functions too (review A7a R2, m3), and from
  # `=== function name(...) ===` lines in the source.
  def function_names(source, compiled = nil)
    names = source ? source.filter_map { |l| l.strip[/\A={2,}\s*function\s+(\w+)/, 1] }.to_set : Set.new
    collect = lambda do |node|
      case node
      when Array then node.each { |n| collect.call(n) }
      when Hash
        names << knot_name(node['f()']) if node['f()'].is_a?(String)
        node.each_value { |v| collect.call(v) }
      end
    end
    collect.call(compiled['root']) if compiled.is_a?(Hash)
    names
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

  def check_npc(npc, path, base_dir, phones, globals = Set.new)
    issues = []
    err = ->(msg) { issues << "❌ ERROR: phone calls: '#{path}' (#{npc['id']}) #{msg}" }
    warn = ->(msg) { issues << "⚠️ WARNING: phone calls: '#{path}' (#{npc['id']}) #{msg}" }

    is_phone = npc['npcType'] == 'phone'
    voiced = npc['voiced'] == true
    home = knot_name(npc['currentKnot'] || 'start')
    compiled, source = read_ink(npc, base_dir)
    named = named_knots(compiled)
    fns = function_names(source, compiled)
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
      warn.call("#{where}: ring.onMissed \"voicemail\" has no effect on a forced call (disableClose), which cannot be missed") if on_missed == 'voicemail' && forced

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

      if src.key?('callbackWhen') && !src['callbackWhen'].nil?
        cbw = src['callbackWhen']
        if cbw.is_a?(String) && !cbw.strip.empty?
          bad = when_misuse(cbw)
          if bad
            err.call("#{where}: ring.callbackWhen uses #{bad}, which a call condition cannot read (only globalVars. terms; plan 3.1)")
          elsif (gbad = ring_grammar_misuse(cbw))
            err.call("#{where}: ring.callbackWhen #{gbad}")
          end
          global_names(cbw).reject { |n| globals.include?(n) }.each do |n|
            err.call("#{where}: ring.callbackWhen reads globalVars.#{n}, which is not in globalVariables and nothing sets it: the condition sees undefined#{var_hint(source, n)}")
          end
          warn.call("#{where}: ring.callbackWhen has no effect unless ring.onMissed is \"callback\" (got #{on_missed.inspect})") if on_missed != 'callback'
        else
          err.call("#{where}: ring.callbackWhen must be a non-empty condition string")
        end
      end

      if src.key?('ringWhile') && !src['ringWhile'].nil?
        rw = src['ringWhile']
        if rw.is_a?(String) && !rw.strip.empty?
          bad = when_misuse(rw)
          if bad
            err.call("#{where}: ring.ringWhile uses #{bad}, which a call condition cannot read (only globalVars. terms; plan 3.1)")
          elsif (gbad = ring_grammar_misuse(rw))
            err.call("#{where}: ring.ringWhile #{gbad}")
          end
          global_names(rw).reject { |n| globals.include?(n) }.each do |n|
            err.call("#{where}: ring.ringWhile reads globalVars.#{n}, which is not in globalVariables and nothing sets it: the condition sees undefined#{var_hint(source, n)}")
          end
          warn.call("#{where}: ring.ringWhile has no effect on a forced call (disableClose), which is never dropped") if forced
        else
          err.call("#{where}: ring.ringWhile must be a non-empty condition string")
        end
      end

      target = cfg['targetKnot'] || cfg['knot']
      if !(target.is_a?(String) && !target.empty?) && !voiced
        # The engine falls back to the thread's current knot (npc-manager.js: targetKnot || knot || currentKnot),
        # so the call would open on the text hub, and the audio extractor adds no start knot for it.
        err.call("#{where}: ring needs a targetKnot: the call's own knot (plan 3.1, 3.5); without one the engine opens the thread's current knot")
      end
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

    # A voicemail knot that produces no `voice:` line (it only sets VARs) is overwritten, on a
    # contact the player has never texted, by the next intro preload (review A6 n-e, plan 2.6): the
    # preload sees only the "Voicemail" row, runs a fresh story and saves it over the voicemail's.
    # The shipped missions never hit this (every voicemail knot speaks); warn so it stays that way.
    if source && named && !voicemail_knots.empty?
      knot_at = knot_of_lines(source)
      voicemail_knots.uniq.each do |vm|
        next unless knot_exists.call(vm)

        reach = reachable_knots(named, [vm], home)
        speaks = source.each_with_index.any? { |line, i| reach.include?(knot_at[i]) && line.sub(%r{(^|\s)//.*\z}, '').strip.downcase.start_with?('voice:') }
        warn.call("ring.voicemailKnot \"#{vm}\" produces no voice: line (it only sets variables); a lines-less voicemail on a contact the player never texts is overwritten by the intro preload (review A6 n-e, plan 2.6)") unless speaks
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
            global_names(entry['when']).reject { |n| globals.include?(n) }.each do |n|
              err.call("#{where}.when reads globalVars.#{n}, which is not in globalVariables and nothing sets it: the condition sees undefined#{var_hint(source, n)}")
            end
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

    # Conditions on the mappings that open the thread or ring (the timedConversation too)
    cond_units = Array(npc['eventMappings']).each_with_index.select { |m, _| m.is_a?(Hash) && (ring_present?(m) || m['conversationMode'] == 'phone-chat') }
                                            .map { |m, i| [m, "eventMappings[#{i}]"] }
    cond_units << [tc, 'timedConversation'] if tc.is_a?(Hash)
    cond_units.each do |cfg, where|
      next unless cfg['condition'].is_a?(String)

      global_names(cfg['condition']).reject { |n| globals.include?(n) }.each do |n|
        warn.call("#{where}.condition reads globalVars.#{n}, which is not in globalVariables and nothing sets it: the condition sees undefined#{var_hint(source, n)}")
      end
    end

    has_ring = !rings.empty?
    has_call = !call_entries.empty?
    call_contact = has_ring || has_call
    # A contact with an old-style voiced form already takes calls, so the unused-VAR warning leaves it
    # alone. The "call me" warning is exempt only for a contact-level `voiced: true`: the player can ring
    # that one through callLaunch, but a mapping or timedConversation call cannot be rung (review A7a R1 m2).
    voiced_form = voiced || (tc.is_a?(Hash) && tc['voiced'] == true) ||
                  Array(npc['eventMappings']).any? { |m| m.is_a?(Hash) && m['voiced'] == true && m['conversationMode'] == 'phone-chat' }

    warn.call('has a ring or call entry but no voice; the call would have no voice (plan 4.3)') if call_contact && (npc['voice'].nil? || npc['voice'] == {} || npc['voice'].to_s.strip.empty?)
    # A call and its thread each emit conversation_closed:<npc> (review A5 R1 item 3, plan 3.2), so an
    # unguarded mapping on a calling contact can fire twice.
    if call_contact
      Array(npc['eventMappings']).each_with_index do |m, i|
        next unless m.is_a?(Hash) && m['eventPattern'].is_a?(String) && m['eventPattern'].start_with?('conversation_closed:')
        next if m['onceOnly'] == true || (m['condition'].is_a?(String) && !m['condition'].strip.empty?)

        warn.call("eventMappings[#{i}] listens for #{m['eventPattern']} with neither onceOnly nor a condition: a call and its thread each emit it, so it can fire twice (plan 3.2)")
      end
    end
    warn.call('has callId and a call entry: the call button is hidden while callId is set') if has_call && npc['callId']

    # A `call` contact the phone never lists
    if has_call && is_phone
      listed = phones.fetch(npc['phoneId'] || 'player_phone', nil) # fetch: the default proc would create the key
      # A phone-chat mapping also opens the thread, and the minigame writes the history as it plays
      # (phone-chat-history.js addMessage), so the contact is listed afterwards.
      gives_history = has_ring || !Array(npc['timedMessages']).empty? ||
                      Array(npc['eventMappings']).any? { |m| m.is_a?(Hash) && (m['sendTimedMessage'].is_a?(Hash) || m['conversationMode'] == 'phone-chat') }
      # an empty npcIds filters nothing (phone-chat-ui.js: allowedNpcIds.length > 0), so it lists everyone
      if listed && !listed.empty? && !listed.include?(npc['id'].to_s) && !gives_history
        warn.call("has a call entry but is not in its phone's npcIds and nothing gives it history (no ring, timedMessages, sendTimedMessage or phone-chat mapping): its thread, and so its call button, never appears")
      end
    end

    # ---- ink: VARs, #place_call, call set ----
    if source
      issues.concat(ink_var_checks(source, npc, path, call_contact || voiced_form))
      issues.concat(place_call_checks(source, npc, path, call_entries, has_ring, ring_callback))
    end

    starts = (ring_starts + call_entries).uniq
    if named && !starts.empty? && !voiced
      reach_home = reachable_knots(named, [home], nil) - fns
      starts.each do |s|
        warn.call("call start knot \"#{s}\" is reachable from the home knot \"#{home}\": a thread opened by hand would replay the call as silent texts (plan 3.5)") if reach_home.include?(s) && s != home
      end
      call_set = reachable_knots(named, starts, home)
      (call_set - starts.to_set - fns).each do |k|
        warn.call("knot \"#{k}\" is in the call and also reachable from the home knot \"#{home}\": the thread and the call share it, and the call voices it (plan 3.5)") if reach_home.include?(k) && k != home
      end
      (call_set - fns).each do |k|
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
    issues.concat(call_me_checks(npc, path, source, named, home)) unless call_contact || voiced

    issues
  end

  def var_hint(source, name)
    return '' unless source&.any? { |l| l.match?(/\A\s*VAR\s+#{Regexp.escape(name)}\b/) }

    "; #{name} is a VAR in the contact's ink: declare it in globalVariables so the ink VAR syncs to it"
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

  # ring.ringWhile / ring.callbackWhen are an `&&` chain of `globalVars.` terms — the only grammar
  # the engine's ringConditionHolds / callConditionHolds evaluates (mirrors globalOnly in
  # npc-manager.js). An `||`, or a term that reads anything but a single-segment `globalVars.` value
  # (optionally negated or compared to a literal or another `globalVars.` value), is skipped by the
  # engine, so the ring would never drop (ringWhile) or the callback never be offered (callbackWhen).
  # Returns a predicate fragment for the error message, or nil when the condition is a clean chain.
  # Assumes when_misuse has already cleared `value`, `name` and `data.`.
  RING_GRAMMAR_LITERALS = %w[true false null undefined].freeze
  def ring_grammar_misuse(cond)
    s = cond.to_s
    return 'contains `||`, but only `&&` chains of globalVars. terms are evaluated' if s.include?('||')
    s.split('&&').map(&:strip).reject(&:empty?).each do |term|
      rest = term.gsub(/globalVars\.[A-Za-z_$][\w$]*/, ' ').gsub(/(['"])(?:\\.|(?!\1).)*\1/, ' ')
      ids = rest.scan(/[A-Za-z_$][\w$]*/).reject { |id| RING_GRAMMAR_LITERALS.include?(id) }
      return "has the non-globalVars. term `#{term}`; only globalVars. terms (optionally negated or compared to a literal) are evaluated" unless ids.empty?
    end
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
      next unless text.is_a?(String) && call_promise?(text)

      (grouped[text] ||= []) << where
    end
    grouped.each do |text, wheres|
      more = wheres.size > 1 ? " (and #{wheres.size - 1} more with the same text: #{wheres[1..].first(3).join(', ')}#{wheres.size > 4 ? ', ...' : ''})" : ''
      issues << "⚠️ WARNING: phone calls: '#{path}/#{wheres.first}' (#{npc['id']}) says \"#{text[0, 80]}\", but this contact has no call entry and no ring, so the player can't call (plan 3.5, 7.3)#{more}"
    end
    return issues unless source

    # A contact-level voiced contact is a call already (the player can ring it): skip its knots.
    skip = Set.new
    skip = reachable_knots(named, [home], nil) if named && npc['voiced'] == true
    sp = File.basename(npc['storyPath'].to_s).sub(/\.json\z/, '.ink')
    knot_at = knot_of_lines(source)
    source.each_with_index do |line, i|
      next if skip.include?(knot_at[i])

      s = line.sub(%r{(^|\s)//.*\z}, '').strip
      next if s.empty? || s.start_with?('#', '~', '=')

      s = s[/\]\s*(.*)\z/, 1].to_s if s.match?(/\A[*+]/)
      next unless call_promise?(s)

      issues << "⚠️ WARNING: phone calls: '#{path}' (#{npc['id']}) #{sp}:#{i + 1} says \"#{s[0, 80]}\", but this contact has no call entry and no ring, so the player can't call (plan 3.5, 7.3)"
    end
    issues
  end
end

def check_phone_calls(json_data, base_dir)
  ValidatePhoneCalls.check(json_data, base_dir)
end
