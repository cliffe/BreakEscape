# frozen_string_literal: true

# Social lints for the pretext area (P4-F, Phase 4). Design: 06 N10 and N12.
#
#   06 N10  data in social.pretextNpcs: every entry names a social.characters entry that has a
#           `reports` threshold; line and ask ids that ink passes to pretext_say / pretext_ask exist
#           in the JSON, in every channel story that carries the call; every claim fact is in
#           `knows` or marked `"unverifiable": true`; each ink choice that calls a line shows the
#           blanks the JSON declares for it; output globals (grants.setGlobal, outcomes.*.setGlobal)
#           are declared and not imported; the three per-call globals (pretext_<callId>_state,
#           _outcome, _lowest) are declared and no ink story declares a variable of that name; a
#           route to "got it" exists under the tuning; a lockout on a call character has an expiry or
#           a route (the generic character lint) and a lockout released by a global has something
#           that sets it; `recoverTo` against `A + rearmMargin` (the generic character lint, which
#           covers every character); non-empty `tells`; callId pointers on phone objects and NPCs
#           resolve, and minigame-data-schemas.json lists callId for `phone`.
#   06 N12  no once-only (`*`) choice in a knot that calls pretext_say or pretext_ask.
#
# Blank VARs: a blank's value reaches the ink through two VARs named for the FACT the blank feeds
# (the blanks map is blankId => factId), `pretext_<factId>_name` (the label, for choice text) and
# `pretext_<factId>_value` (the value id, for fixed reactions), as in 06 section 5.
#
# Returns an array of issue strings starting with "❌" (error, fails --strict-social) or "⚠️"
# (warning), in the style of validate_scenario.rb. Runs only when the scenario has a `social` key.
module ValidateSocial
  module Pretext
    TECHNIQUES = %w[urgency authority_borrowed reciprocity shared_detail candour deflect].freeze
    FEEDBACK_MODES = %w[live debriefOnly].freeze
    TELL_DETAILS = %w[full category none].freeze
    SHOW_TECHNIQUE = %w[live debriefOnly].freeze
    GRADES = %w[identity lesser].freeze
    FACT_TELLS = %w[pass fail failCategory unknown].freeze
    ASK_TELLS = %w[accepted pending refused].freeze
    OUTCOMES = %w[got_it reported walked_away].freeze
    PLACEHOLDERS = %w[said actual].freeze

    # ctx: ValidateSocial::Context (json, repo_root, valid_item_types, imports, ...)
    def self.check(ctx)
      return [] unless ctx.social.is_a?(Hash)

      calls = hash_list(ctx.social['pretextNpcs'])
      issues = []
      issues.concat(pointers(ctx, calls))
      return issues if calls.empty?

      ids = calls.map { |c| c['callId'] }.compact
      ids.group_by(&:itself).select { |_, v| v.length > 1 }.each_key do |d|
        issues << err("social.pretextNpcs has the callId '#{d}' more than once")
      end
      calls.each_with_index do |call, i|
        where = "social.pretextNpcs[#{i}]#{call['callId'].is_a?(String) ? " (#{call['callId']})" : ''}"
        issues.concat(call_data(ctx, call, where))
        issues.concat(call_globals(ctx, call, where))
        issues.concat(call_tells(ctx, call, where))
        issues.concat(route_to_got_it(ctx, call, where))
        issues.concat(lockout_release(ctx, call, where))
        issues.concat(ink_checks(ctx, call, where))
      end
      issues
    end

    # ---- small helpers -------------------------------------------------------

    def self.blank?(v)
      !v.is_a?(String) || v.strip.empty?
    end

    def self.hash_list(v)
      v.is_a?(Array) ? v.select { |e| e.is_a?(Hash) } : []
    end

    def self.hash(v)
      v.is_a?(Hash) ? v : {}
    end

    def self.err(msg)
      "❌ SOCIAL: #{msg}"
    end

    def self.warn_(msg)
      "⚠️ SOCIAL: #{msg}"
    end

    def self.num?(v)
      v.is_a?(Numeric)
    end

    def self.character_of(ctx, call)
      ValidateSocial.characters_hash(ctx)[call['character'].to_s]
    end

    # the same default as the engine and the generic character lint: influence.start, else the
    # influence global's declared default, else 0
    def self.start_of(ctx, call)
      ch = character_of(ctx, call) || {}
      infl = hash(ch['influence'])
      g = (infl['global'] || "#{call['character']}_influence").to_s
      return infl['start'] if num?(infl['start'])
      return ctx.all_globals[g] if num?(ctx.all_globals[g])

      0
    end

    def self.bounds_of(ctx, call)
      infl = hash((character_of(ctx, call) || {})['influence'])
      [num?(infl['min']) ? infl['min'] : -100, num?(infl['max']) ? infl['max'] : 100]
    end

    def self.thresholds_of(ctx, call)
      hash_list((character_of(ctx, call) || {})['thresholds'])
    end

    # ---- callId pointers -----------------------------------------------------

    # phone objects (minigameData.callId) and NPC sprites (top-level callId) name a pretextNpcs entry;
    # the phone pointer needs a `phone` entry in minigame-data-schemas.json that lists callId.
    def self.pointers(ctx, calls)
      issues = []
      by_id = calls.each_with_object({}) { |c, h| h[c['callId'].to_s] = c if c['callId'] }
      chars = ValidateSocial.characters_hash(ctx)
      phone_pointer = false

      resolve = lambda do |cid, path, channel, holder_id|
        call = by_id[cid.to_s]
        if call.nil?
          issues << err("#{path} has callId '#{cid}', which is not a callId in social.pretextNpcs")
          next
        end
        ch = chars[call['character'].to_s]
        next unless ch

        channels = hash(ch['channels'])
        if channels[channel].nil?
          issues << err("#{path} has callId '#{cid}' but social.characters.#{call['character']}.channels has no '#{channel}' record to open")
        elsif holder_id && channel == 'person' && channels['person'] != holder_id
          issues << warn_("#{path} has callId '#{cid}' but its id is not social.characters.#{call['character']}.channels.person ('#{channels['person']}')")
        end
      end

      walk = lambda do |obj, path|
        next unless obj.is_a?(Hash)

        md = hash(obj['minigameData'])
        if obj['type'] == 'phone' && (md.key?('callId') || obj.key?('callId'))
          phone_pointer = true if md.key?('callId')
          resolve.call(md['callId'] || obj['callId'], path, 'phone', nil)
        end
        %w[contents itemsHeld].each { |k| Array(obj[k]).each_with_index { |c, i| walk.call(c, "#{path}/#{k}[#{i}]") } }
      end
      ValidateSocial.rooms(ctx.json).each do |room_id, room|
        Array(room['objects']).each_with_index { |o, i| walk.call(o, "/rooms/#{room_id}/objects[#{i}]") }
        Array(room['npcs']).each_with_index do |n, i|
          next unless n.is_a?(Hash)

          resolve.call(n['callId'], "/rooms/#{room_id}/npcs[#{i}] (#{n['id']})", 'person', n['id']) if n.key?('callId')
          Array(n['itemsHeld']).each_with_index { |o, j| walk.call(o, "/rooms/#{room_id}/npcs[#{i}]/itemsHeld[#{j}]") }
        end
      end
      Array(ctx.json['startItemsInInventory']).each_with_index { |o, i| walk.call(o, "/startItemsInInventory[#{i}]") }

      if phone_pointer
        path = File.join(ctx.repo_root.to_s, 'scripts', 'minigame-data-schemas.json')
        schema = begin
          JSON.parse(File.read(path))['phone']
        rescue StandardError
          nil
        end
        listed = schema.is_a?(Hash) && (Array(schema['required']) + Array(schema['optional'])).include?('callId')
        unless listed
          issues << err("a phone object carries minigameData.callId but scripts/minigame-data-schemas.json has no 'phone' entry that lists callId; " \
                        'the schema check would reject the pointer as an undeclared field')
        end
      end
      issues
    end

    # ---- the call's data -----------------------------------------------------

    def self.call_data(ctx, call, where)
      issues = []
      issues << err("#{where} needs a callId string") if blank?(call['callId'])
      char_id = call['character'].to_s
      ch = character_of(ctx, call)
      if ch.nil?
        issues << err("#{where}.character '#{char_id}' is not an entry in social.characters")
      else
        thresholds = thresholds_of(ctx, call)
        unless thresholds.any? { |t| t['id'] == 'reports' }
          issues << err("#{where}: social.characters.#{char_id} has call data but no threshold with the id 'reports'; " \
                        'a failed verification or the refusal limit forces a report, and a character without one cannot report')
        end
        channels = hash(ch['channels'])
        unless channels.key?('person') || channels.key?('phone')
          issues << err("#{where}: social.characters.#{char_id}.channels has neither a 'person' nor a 'phone' record, so the call has nothing to open")
        end
      end

      tuning = hash(call['tuning'])
      issues << err("#{where}.tuning.feedbackMode '#{tuning['feedbackMode']}' is not one of #{FEEDBACK_MODES.join(', ')}") if tuning.key?('feedbackMode') && !FEEDBACK_MODES.include?(tuning['feedbackMode'])
      issues << err("#{where}.tuning.tellDetail '#{tuning['tellDetail']}' is not one of #{TELL_DETAILS.join(', ')}") if tuning.key?('tellDetail') && !TELL_DETAILS.include?(tuning['tellDetail'])
      issues << err("#{where}.tuning.showTechniqueNames '#{tuning['showTechniqueNames']}' is not one of #{SHOW_TECHNIQUE.join(', ')}") if tuning.key?('showTechniqueNames') && !SHOW_TECHNIQUE.include?(tuning['showTechniqueNames'])
      if tuning.key?('maxRefusals') && !(tuning['maxRefusals'].is_a?(Integer) && tuning['maxRefusals'].positive?)
        issues << err("#{where}.tuning.maxRefusals must be a positive integer (got #{tuning['maxRefusals'].inspect})")
      end
      if tuning.key?('matchCreditCapPerLine') && !(num?(tuning['matchCreditCapPerLine']) && tuning['matchCreditCapPerLine'] >= 0)
        issues << err("#{where}.tuning.matchCreditCapPerLine must be a number of zero or more")
      end

      knows = hash(call['knows'])
      knows.each do |fid, k|
        if !k.is_a?(Hash) || blank?(k['value'].is_a?(String) ? k['value'] : nil)
          issues << err("#{where}.knows.#{fid} needs a 'value' (a value id from a provides entry)")
          next
        end
        issues << err("#{where}.knows.#{fid}.grade '#{k['grade']}' is not one of #{GRADES.join(', ')}") unless GRADES.include?(k['grade'])
        if k.key?('accept') && !(k['accept'].is_a?(Array) && k['accept'].all? { |a| a.is_a?(String) && !a.empty? })
          issues << err("#{where}.knows.#{fid}.accept must be a list of value ids")
        end
      end

      susc = hash(call['susceptibility'])
      susc.each do |tech, v|
        issues << err("#{where}.susceptibility has the key '#{tech}'; the vocabulary is #{TECHNIQUES.join(', ')} (a new key is an engine and validator change)") unless TECHNIQUES.include?(tech)
        issues << err("#{where}.susceptibility.#{tech} must be a number") unless num?(v)
      end
      issues << err("#{where}.unverifiableCost must be a number") if call.key?('unverifiableCost') && !num?(call['unverifiableCost'])

      lines = hash(call['lines'])
      lines.each do |lid, line|
        lw = "#{where}.lines.#{lid}"
        unless line.is_a?(Hash)
          issues << err("#{lw} must be an object")
          next
        end
        if line.key?('requires')
          req = line['requires']
          facts = ctx.social['intelFacts']
          if !req.is_a?(Array) || req.any? { |f| blank?(f) }
            issues << err("#{lw}.requires must be an array of social.intelFacts ids")
          else
            req.each { |f| issues << err("#{lw}.requires '#{f}' is not a social.intelFacts id, so the line would never show") if facts.is_a?(Hash) && !facts.key?(f) }
          end
        end
        blanks = hash(line['blanks'])
        if blanks.length > 2
          issues << err("#{lw}.blanks has #{blanks.length} blanks; a template carries at most two")
        end
        blanks.each do |bid, fid|
          issues << err("#{lw}.blanks.#{bid} must name a fact id (the fact the blank feeds)") if blank?(fid)
        end
        hash_list(line['claims']).each_with_index do |cl, ci|
          fid = cl['fact']
          from = cl['from'].to_s
          if blank?(fid)
            issues << err("#{lw}.claims[#{ci}] needs a 'fact'")
            next
          end
          if from.start_with?('blank:')
            bid = from.sub('blank:', '')
            issues << err("#{lw}.claims[#{ci}].from '#{from}' names no blank of the line (blanks: #{blanks.keys.join(', ')})") unless blanks.key?(bid)
            if blanks.key?(bid) && blanks[bid] != fid
              issues << err("#{lw}.claims[#{ci}] claims fact '#{fid}' from blank '#{bid}', which feeds '#{blanks[bid]}'")
            end
          elsif blank?(cl['from'])
            issues << err("#{lw}.claims[#{ci}] needs a 'from' ('blank:<blankId>' or a fixed value id)")
          end
          if cl['unverifiable'] == true
            issues << warn_("#{lw}.claims[#{ci}] is marked unverifiable but fact '#{fid}' is in knows; the NPC can check it") if knows.key?(fid)
          elsif !knows.key?(fid)
            issues << warn_("#{lw}.claims[#{ci}]: fact '#{fid}' is not in knows, so the NPC cannot check it (each such claim costs unverifiableCost); " \
                            'add it to knows, or mark the claim "unverifiable": true if that is the intent')
          end
        end
        %w[repairs doublesDown].each do |key|
          next unless line.key?(key)

          issues << err("#{lw}.#{key} names '#{line[key]}', which is not in knows") unless knows.key?(line[key])
        end
        issues << err("#{lw}.extra must be a number") if line.key?('extra') && !num?(line['extra'])
        ([line['technique']] + Array(line['also'])).compact.each do |t|
          issues << err("#{lw} uses technique '#{t}', which is not in the vocabulary (#{TECHNIQUES.join(', ')})") unless TECHNIQUES.include?(t)
          issues << warn_("#{lw} uses technique '#{t}' but susceptibility has no value for it (it moves influence by 0)") if TECHNIQUES.include?(t) && !susc.key?(t)
        end
      end

      hash(call['asks']).each do |aid, ask|
        aw = "#{where}.asks.#{aid}"
        unless ask.is_a?(Hash)
          issues << err("#{aw} must be an object")
          next
        end
        issues << err("#{aw}.pressure must be a number") if ask.key?('pressure') && !num?(ask['pressure'])
        issues << err("#{aw}.floor must be a number") if ask.key?('floor') && !num?(ask['floor'])
        Array(ask['verification']).each do |f|
          issues << err("#{aw}.verification names '#{f}', which is not in knows; the NPC cannot check what it does not know") unless knows.key?(f)
        end
        intel = hash(ask['grants'])['intel']
        facts = ctx.social['intelFacts']
        Array(intel).each do |f|
          issues << err("#{aw}.grants.intel '#{f}' is not a social.intelFacts id") if facts.is_a?(Hash) && !facts.key?(f)
        end
      end

      hash(call['outcomes']).each_key do |o|
        issues << err("#{where}.outcomes has the key '#{o}'; only #{OUTCOMES.join(', ')} are outcomes") unless OUTCOMES.include?(o)
      end
      issues
    end

    # ---- globals: outputs, report globals, the per-call keys -------------------

    def self.call_globals(ctx, call, where)
      issues = []
      check = lambda do |name, why|
        if ctx.import_names.include?(name)
          issues << err("#{where}: global '#{name}' (#{why}) is imported (importGlobals), but the pretext call writes it; the write would be refused, so declare it in globalVariables instead")
        elsif !ctx.own_globals.key?(name)
          issues << err("#{where}: global '#{name}' (#{why}) is not declared in globalVariables; an undeclared name is silently not synced to ink")
        end
      end

      hash(call['asks']).each do |aid, ask|
        sg = hash(hash(ask)['grants'])['setGlobal']
        hash(sg).each_key { |g| check.call(g, "grants.setGlobal of ask '#{aid}'") }
      end
      hash(call['outcomes']).each do |oid, out|
        hash(hash(out)['setGlobal']).each_key { |g| check.call(g, "setGlobal of outcome '#{oid}'") }
      end
      # report globals: the setGlobal effects of the reports threshold (the generic character lint
      # covers every threshold; this repeats the reports one under the call's own heading)
      thresholds_of(ctx, call).select { |t| t['id'] == 'reports' }.each do |t|
        Array(t['effects']).each do |e|
          check.call(e['global'].to_s, "report global of social.characters.#{call['character']}") if e.is_a?(Hash) && e['type'] == 'setGlobal' && e['global'].is_a?(String)
        end
      end

      cid = call['callId']
      return issues if blank?(cid)

      %w[state outcome lowest].each do |suffix|
        name = "pretext_#{cid}_#{suffix}"
        if ctx.import_names.include?(name)
          issues << err("#{where}: global '#{name}' (written by the pretext session) is imported; declare it in globalVariables instead")
        elsif !ctx.own_globals.key?(name)
          kind = { 'state' => 'an object', 'outcome' => 'a string', 'lowest' => 'an integer' }[suffix]
          issues << err("#{where}: global '#{name}' is not declared in globalVariables (the session writes it; declare #{kind})")
        end
      end
      state = ctx.all_globals["pretext_#{cid}_state"]
      issues << err("#{where}: global 'pretext_#{cid}_state' must be declared as an object ({}), got #{state.inspect}") if ctx.all_globals.key?("pretext_#{cid}_state") && !state.is_a?(Hash)
      outcome = ctx.all_globals["pretext_#{cid}_outcome"]
      issues << err("#{where}: global 'pretext_#{cid}_outcome' must be declared as a string (\"\"), got #{outcome.inspect}") if ctx.all_globals.key?("pretext_#{cid}_outcome") && !outcome.is_a?(String)
      lowest = ctx.all_globals["pretext_#{cid}_lowest"]
      issues << err("#{where}: global 'pretext_#{cid}_lowest' must be declared as an integer, got #{lowest.inspect}") if ctx.all_globals.key?("pretext_#{cid}_lowest") && !lowest.is_a?(Integer)

      # no ink story may declare a variable of those names
      names = %w[state outcome lowest].map { |s| "pretext_#{cid}_#{s}" }
      ValidateSocial.social_story_roots(ctx).each do |root|
        vars = ValidateSocial.ink_vars(ValidateSocial.ink_files(root))
        names.each do |n|
          next unless vars.key?(n)

          rel = root.sub("#{ctx.repo_root}/", '')
          issues << err("#{rel} declares VAR #{n}; the session owns that global and syncing it into ink would clash (an ink story must not declare the call's state keys)")
        end
      end
      issues
    end

    # ---- tells: no empty strings -------------------------------------------------

    def self.call_tells(ctx, call, where)
      issues = []
      tells = call['tells']
      detail = hash(call['tuning'])['tellDetail']
      if !tells.is_a?(Hash)
        issues << err("#{where}.tells is missing; the tells panel has nothing to print") unless detail == 'none'
        return issues
      end
      full = detail != 'none'
      knows = hash(call['knows'])
      lines = hash(call['lines'])

      knows.each_key do |fid|
        t = tells[fid]
        if !t.is_a?(Hash)
          issues << err("#{where}.tells.#{fid} is missing (one block per fact in knows)") if full
          next
        end
        FACT_TELLS.each do |k|
          if !t.key?(k)
            issues << err("#{where}.tells.#{fid}.#{k} is missing") if full
          elsif blank?(t[k])
            issues << err("#{where}.tells.#{fid}.#{k} is empty; the panel would print a blank line")
          end
        end
        %w[fail failCategory pass unknown].each do |k|
          next unless t[k].is_a?(String)

          t[k].scan(/\{(\w+)\}/).flatten.uniq.each do |ph|
            issues << warn_("#{where}.tells.#{fid}.#{k} uses {#{ph}}; only #{PLACEHOLDERS.map { |p| "{#{p}}" }.join(' and ')} are filled in") unless PLACEHOLDERS.include?(ph)
          end
        end
      end

      techniques = hash(tells['techniques'])
      in_use = hash(call['susceptibility']).keys
      lines.each_value { |l| in_use.concat(([l['technique']] + Array(l['also'])).compact) if l.is_a?(Hash) }
      in_use.uniq.each do |tech|
        if !techniques.key?(tech)
          issues << err("#{where}.tells.techniques.#{tech} is missing (one per technique in use)") if full
        elsif blank?(techniques[tech])
          issues << err("#{where}.tells.techniques.#{tech} is empty")
        end
      end
      techniques.each { |k, v| issues << err("#{where}.tells.techniques.#{k} is empty") if blank?(v) && !in_use.include?(k) }

      if lines.values.any? { |l| l.is_a?(Hash) && l['repairs'] }
        if !tells.key?('repair')
          issues << err("#{where}.tells.repair is missing (a line repairs a fact)") if full
        elsif blank?(tells['repair'])
          issues << err("#{where}.tells.repair is empty")
        end
      elsif tells.key?('repair') && blank?(tells['repair'])
        issues << err("#{where}.tells.repair is empty")
      end

      if !hash(call['asks']).empty?
        ask = tells['ask']
        if !ask.is_a?(Hash)
          issues << err("#{where}.tells.ask is missing (accepted, pending, refused)") if full
        else
          ASK_TELLS.each do |k|
            if !ask.key?(k)
              issues << err("#{where}.tells.ask.#{k} is missing") if full
            elsif blank?(ask[k])
              issues << err("#{where}.tells.ask.#{k} is empty")
            end
          end
        end
      end

      band_ids = thresholds_of(ctx, call).map { |t| t['id'] }
      wanted = %w[calm]
      wanted << 'wary' if band_ids.include?('wary')
      wanted << 'refusing' if band_ids.include?('refuses')
      bands = tells['bands']
      if !bands.is_a?(Hash)
        issues << err("#{where}.tells.bands is missing (#{wanted.join(', ')})") if full
      else
        wanted.each do |k|
          if !bands.key?(k)
            issues << err("#{where}.tells.bands.#{k} is missing") if full
          elsif blank?(bands[k])
            issues << err("#{where}.tells.bands.#{k} is empty")
          end
        end
        bands.each { |k, v| issues << err("#{where}.tells.bands.#{k} is empty") if blank?(v) && !wanted.include?(k) }
      end
      issues
    end

    # ---- a route to "got it" exists under the tuning ---------------------------

    # Static: could some ask be granted at all? Influence can rise only through a line that earns
    # something (a claim on a fact the NPC knows is +10, a technique with a positive value, a repair).
    def self.route_to_got_it(ctx, call, where)
      asks = hash(call['asks'])
      return [] unless ValidateSocial.characters_hash(ctx).key?(call['character'].to_s)

      if asks.empty?
        return [err("#{where} has no asks, so no line of play can ever reach \"got it\"")]
      end

      issues = []
      knows = hash(call['knows'])
      susc = hash(call['susceptibility'])
      lines = hash(call['lines']).select { |_, l| l.is_a?(Hash) }
      lo, hi = bounds_of(ctx, call)
      start = start_of(ctx, call)
      thresholds = thresholds_of(ctx, call)
      reports_at = thresholds.find { |t| t['id'] == 'reports' && num?(t['at']) }&.dig('at')
      refuses_at = thresholds.find { |t| t['id'] == 'refuses' && num?(t['at']) }&.dig('at')

      can_rise = lines.values.any? do |l|
        Array(l['claims']).any? { |c| c.is_a?(Hash) && knows.key?(c['fact']) } ||
          ([l['technique']] + Array(l['also'])).compact.any? { |t| num?(susc[t]) && susc[t].positive? } ||
          l['repairs']
      end
      reach = can_rise ? hi : start
      reach = [[reach, hi].min, lo].max

      reachable = asks.select do |aid, ask|
        next false unless ask.is_a?(Hash)

        pressure = num?(ask['pressure']) ? ask['pressure'] : 0
        after = reach + pressure
        floor = ask['floor']
        ok = if num?(floor) then after >= floor
             elsif refuses_at then after > refuses_at
             else true
             end
        ok &&= after > reports_at if reports_at
        verify = Array(ask['verification'])
        supplied = verify.all? do |f|
          lines.values.any? { |l| Array(l['claims']).any? { |c| c.is_a?(Hash) && c['fact'] == f } }
        end
        unless supplied
          missing = verify.reject { |f| lines.values.any? { |l| Array(l['claims']).any? { |c| c.is_a?(Hash) && c['fact'] == f } } }
          issues << err("#{where}.asks.#{aid}.verification needs #{missing.map { |m| "'#{m}'" }.join(', ')}, but no line has a claim on it; the player can never supply it and the ask can never pass")
        end
        ok && supplied
      end

      if reachable.empty?
        best = asks.map do |aid, a|
          a = hash(a)
          "#{aid} (floor #{a['floor'].inspect}, pressure #{a['pressure'].inspect})"
        end.join('; ')
        issues << err("#{where}: no ask can be granted under this tuning. The most influence the player can reach is #{reach} " \
                      "(start #{start}, #{can_rise ? 'a line can raise it' : 'no line can raise it'}, max #{hi}); asks: #{best}")
      end
      issues
    end

    # ---- lockout release ---------------------------------------------------------

    # The generic character lint already requires an expiry or an alternativeRoute on every lockout.
    # Here: a lockout released by `until.global` needs something that sets that global.
    def self.lockout_release(ctx, call, where)
      issues = []
      thresholds_of(ctx, call).each do |t|
        Array(t['effects']).each do |e|
          next unless e.is_a?(Hash) && e['type'] == 'lockout'

          g = hash(e['until'])['global']
          next unless g.is_a?(String) && ctx.all_globals.key?(g)
          next if sets_global?(ctx, g)

          issues << warn_("#{where}: lockout of social.characters.#{call['character']} threshold '#{t['id']}' is released by global '#{g}', " \
                          'but nothing in the scenario sets it (no setGlobal, set_global action or ink tag); the lockout would never lift')
        end
      end
      issues
    end

    # Does anything set the global? A `setGlobal` map or `set_global` action naming it, a
    # {type: setGlobal|set_global, global: name} effect, or an ink `#set_global:name` tag. The
    # declaration (globalVariables, importGlobals) and a lockout's own `until.global` do not count.
    def self.sets_global?(ctx, name)
      found = false
      walk = lambda do |node|
        case node
        when Hash
          if %w[setGlobal set_global].include?(node['type'].to_s) && node['global'] == name
            found = true
          end
          node.each do |k, v|
            next if %w[globalVariables importGlobals].include?(k)

            found = true if %w[setGlobal set_global setVariable].include?(k) && v.is_a?(Hash) && v.key?(name)
            walk.call(v)
          end
        when Array then node.each { |v| walk.call(v) }
        end
      end
      walk.call(ctx.json)
      return true if found

      ValidateSocial.social_story_roots(ctx).any? do |root|
        ValidateSocial.ink_files(root).any? { |f| File.read(f, encoding: 'UTF-8').include?("#set_global:#{name}") }
      end
    end

    # ---- ink: ids, blanks and sticky choices ---------------------------------------

    CALL_RE = /\bpretext_(say|ask)\s*\(\s*("[^"]*"|[^)]*?)\s*\)/.freeze
    CHOICE_RE = /^\s*[+*]+(?!\s*->)/.freeze
    ONCE_RE = /^\s*\*+(?!\s*->)/.freeze
    KNOT_RE = /^\s*={2,}\s*(?:function\s+)?(\w+)/.freeze
    REF_RE = /\bpretext_([A-Za-z0-9_]+?)_(name|value)\b/.freeze

    def self.strip_comment(line)
      line.sub(%r{\s//.*\z}, '')
    end

    # [[file, index, text], ...] for one ink file, without comment lines or inline comments
    def self.source_lines(file)
      File.readlines(file, encoding: 'UTF-8').each_with_index.reject { |l, _| l.lstrip.start_with?('//') }
          .map { |l, i| [i + 1, strip_comment(l.chomp)] }
    end

    def self.scan_story(root)
      files = ValidateSocial.ink_files(root)
      calls = [] # { kind, id (nil when not a literal), file, line, choice (text or nil), knot }
      once = []  # { file, line, knot, text } for every once-only choice
      refs = Set.new
      files.each do |f|
        lines = source_lines(f)
        knot = nil
        choice = nil
        knot_calls = Hash.new(false)
        lines.each do |no, text|
          if text =~ KNOT_RE
            knot = Regexp.last_match(1)
            choice = nil
          end
          if text =~ CHOICE_RE
            choice = text
            once << { file: f, line: no, knot: knot, text: text.strip } if text =~ ONCE_RE
          end
          text.scan(REF_RE) { |fid, _| refs << fid }
          next if text =~ /^\s*(EXTERNAL\b|={2,}\s*function\b)/

          text.scan(CALL_RE) do |kind, arg|
            lit = arg =~ /\A"([^"]*)"\z/ ? Regexp.last_match(1) : nil
            calls << { kind: kind, id: lit, arg: arg, file: f, line: no, choice: choice, knot: knot }
            knot_calls[[f, knot]] = true
          end
        end
        once.each { |o| o[:call_knot] = true if o[:file] == f && knot_calls[[f, o[:knot]]] }
      end
      [files, calls, once.select { |o| o[:call_knot] }, refs]
    end

    def self.ink_checks(ctx, call, where)
      issues = []
      char_id = call['character'].to_s
      return issues unless ValidateSocial.characters_hash(ctx).key?(char_id)

      stories = ValidateSocial.character_stories(ctx)[char_id] || {}
      lines = hash(call['lines'])
      asks = hash(call['asks'])
      carrying = 0

      if stories.empty?
        issues << warn_("#{where}: no ink source was found for any channel of social.characters.#{char_id}, so line and ask ids, blanks and sticky choices were not checked")
        return issues
      end

      stories.each do |chan, (label, src)|
        files, found, once, refs = scan_story(src)
        externals = ValidateSocial.ink_externals(files)
        carries = !found.empty? || externals.key?('pretext_say') || externals.key?('pretext_ask')
        next unless carries

        carrying += 1
        rel = src.sub("#{ctx.repo_root}/", '')
        vars = ValidateSocial.ink_vars(files)
        tag = "#{rel} (channel '#{chan}', #{label})"

        used_lines = Set.new
        used_asks = Set.new
        found.each do |c|
          crel = c[:file].sub("#{ctx.repo_root}/", '')
          at = "#{crel}:#{c[:line]}"
          if c[:id].nil?
            issues << warn_("#{at}: pretext_#{c[:kind]}(#{c[:arg]}) does not pass a string literal, so the id cannot be checked")
            next
          end
          if c[:kind] == 'say'
            used_lines << c[:id]
            unless lines.key?(c[:id])
              issues << err("#{at}: pretext_say(\"#{c[:id]}\") but social.pretextNpcs '#{call['callId']}' has no line '#{c[:id]}'")
              next
            end
            issues.concat(blank_checks(at, c, hash(lines[c[:id]]), vars, call))
          else
            used_asks << c[:id]
            issues << err("#{at}: pretext_ask(\"#{c[:id]}\") but social.pretextNpcs '#{call['callId']}' has no ask '#{c[:id]}'") unless asks.key?(c[:id])
          end
        end
        (lines.keys - used_lines.to_a).each do |l|
          issues << warn_("#{tag} never calls pretext_say(\"#{l}\"); the line is in social.pretextNpcs '#{call['callId']}' but this channel cannot play it")
        end
        (asks.keys - used_asks.to_a).each do |a|
          issues << warn_("#{tag} never calls pretext_ask(\"#{a}\"); the ask is in social.pretextNpcs '#{call['callId']}' but this channel cannot make it")
        end
        refs.each do |fid|
          next if vars.key?("pretext_#{fid}_name") || vars.key?("pretext_#{fid}_value")

          issues << err("#{tag} uses pretext_#{fid}_name/_value but declares no VAR for it; the engine fills declared VARs only")
        end
        once.each do |o|
          orel = o[:file].sub("#{ctx.repo_root}/", '')
          issues << err("#{orel}:#{o[:line]}: once-only choice (`*`) in knot '#{o[:knot]}', which calls pretext_say/pretext_ask; " \
                        "ink state persists, so a retry would find the choice gone (use a sticky `+`): #{o[:text][0, 70]}")
        end
      end

      if carrying.zero?
        issues << err("#{where}: no ink story of social.characters.#{char_id} calls pretext_say or pretext_ask (or declares them EXTERNAL), so the call cannot be played")
      end
      issues
    end

    # The choice that holds a pretext_say call shows the line's blanks, and only those.
    def self.blank_checks(at, c, line, vars, call)
      issues = []
      facts = hash(line['blanks']).values.compact.uniq
      choice = c[:choice]
      shown = choice ? choice.scan(REF_RE).select { |_, k| k == 'name' }.map(&:first).uniq : nil

      facts.each do |fid|
        unless vars.key?("pretext_#{fid}_name")
          issues << err("#{at}: line '#{c[:id]}' has a blank that feeds '#{fid}' but the story declares no VAR pretext_#{fid}_name for its choice text")
        end
      end
      return issues if shown.nil?

      (facts - shown).each do |fid|
        issues << err("#{at}: line '#{c[:id]}' declares a blank for '#{fid}' in the JSON but the choice that calls it never shows {pretext_#{fid}_name}")
      end
      (shown - facts).each do |fid|
        issues << err("#{at}: the choice that calls line '#{c[:id]}' shows {pretext_#{fid}_name}, but the JSON declares no blank for '#{fid}' on that line")
      end
      issues
    end
  end
end
