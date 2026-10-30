# frozen_string_literal: true

# Social lints for the mail area (P1-H, phase 1a).
#
#   04 N3   empty-string lint on authored feedback, and the single factorStrings shape
#   04 N11  validator half of the pre-send gate: no scenario string may replace the fixed line
#   04 N10  the subset Hampshire exercises (templates, subjects, distinctiveValues, outcome owner,
#           outcome globals, trusts, senderAuth, requiresIntelToAttempt)
#   01 N18  accounts, mailboxes, seeded messages, contacts, mail_terminal accountIds
#   P0-R R-12  a channels.email id that clashes with a room NPC id (error)
#
# Returns an array of issue strings starting with "❌" (error, fails --strict-social) or "⚠️"
# (warning), in the style of validate_scenario.rb. Runs only when the scenario has a `social` key.
module ValidateSocial
  module Mail
    PARTS = %w[from greeting pretext ask].freeze
    FACTORS = %w[open senderTrust senderAuth addressedTo pretextRelevant attachmentPlausible
                 urgencyCalibrated linkCredible].freeze
    ATTACHMENT_STATES = %w[missing wrong-type].freeze
    # Per-state { fail, redFlag } entries a factor may carry (phish-rules.js entry(): ts[state]).
    FACTOR_STATES = { 'attachmentPlausible' => ATTACHMENT_STATES, 'senderTrust' => %w[mismatch] }.freeze
    ACCOUNT_KINDS = %w[given found created].freeze
    BUILTIN_PLACEHOLDERS = %w[account_name account_address].freeze
    # 04 "Pre-send gate": the fixed neutral line. The mail client owns it.
    PRESEND_LINE = "A blank needs evidence you haven't found yet"

    # ctx: ValidateSocial::Context (json, repo_root, valid_item_types, imports, ...)
    def self.check(ctx)
      return [] unless ctx.social.is_a?(Hash)

      issues = []
      issues.concat(empty_strings(ctx))
      issues.concat(presend_line(ctx))
      issues.concat(phish_targets(ctx))
      issues.concat(mail_client_checks(ctx))
      issues.concat(mail_terminals(ctx))
      issues.concat(email_record_clash(ctx))
      issues.concat(email_stories(ctx))
      issues.concat(MailInk.check(ctx))
      issues
    end

    # ---- small helpers -------------------------------------------------------

    def self.blank?(v)
      !v.is_a?(String) || v.strip.empty?
    end

    def self.list(v)
      v.is_a?(Array) ? v : []
    end

    def self.hash_list(v)
      list(v).select { |e| e.is_a?(Hash) }
    end

    def self.err(msg)
      "❌ SOCIAL: #{msg}"
    end

    def self.warn_(msg)
      "⚠️ SOCIAL: #{msg}"
    end

    def self.facts(ctx)
      f = ctx.social['intelFacts']
      f.is_a?(Hash) ? f.select { |_, v| v.is_a?(Hash) } : {}
    end

    def self.people_ids(ctx)
      hash_list(ctx.social['people']).filter_map { |p| p['id'] if p['id'].is_a?(String) }.to_set
    end

    def self.targets(ctx)
      hash_list(ctx.social['phishTargets'])
    end

    def self.templates(ctx)
      t = ctx.social['templates']
      t.is_a?(Hash) ? t.select { |_, v| v.is_a?(Hash) } : {}
    end

    def self.mail_client(ctx)
      mc = ctx.social['mailClient']
      mc.is_a?(Hash) ? mc : {}
    end

    # value id => [fact ids that provide it]
    def self.providers(ctx)
      map = Hash.new { |h, k| h[k] = [] }
      facts(ctx).each do |fid, f|
        hash_list(f['provides']).each { |p| map[p['value']] << fid if p['value'].is_a?(String) }
      end
      map
    end

    # A global the social system or engine writes: must be declared and not imported.
    def self.declared_written(ctx, name, why)
      if ctx.import_names.include?(name)
        err("global '#{name}' (#{why}) is imported (importGlobals), but the mail client writes it; declare it in globalVariables instead")
      elsif !ctx.own_globals.key?(name)
        err("global '#{name}' (#{why}) is not declared in globalVariables; an undeclared name is silently not synced to ink")
      end
    end

    # A global something else sets and the mail data only reads or names: declared (imports allowed).
    def self.declared_read(ctx, name, why)
      return nil if ctx.all_globals.key?(name)

      err("global '#{name}' (#{why}) is not declared in globalVariables; an undeclared name is silently not synced to ink")
    end

    # ---- 04 N3: empty strings and the factorStrings shape ----------------------

    def self.empty_strings(ctx)
      issues = []
      s = ctx.social
      facts(ctx).each do |fid, f|
        issues << err("social.intelFacts.#{fid}.text is empty; the board would show a blank card") if f.key?('text') && blank?(f['text'])
        hash_list(f['provides']).each_with_index do |p, i|
          issues << err("social.intelFacts.#{fid}.provides[#{i}].label is empty; the blank would offer an unlabelled option") if p.key?('label') && blank?(p['label'])
        end
      end
      templates(ctx).each do |tid, t|
        issues << err("social.templates.#{tid}.text is empty") if blank?(t['text'])
      end
      targets(ctx).each do |t|
        id = t['id']
        where = "social.phishTargets[#{id}]"
        list(t['hints']).each_with_index { |h, i| issues << err("#{where}.hints[#{i}] is empty; a hint stage would show nothing") if blank?(h) }
        if t['replies'].is_a?(Hash)
          # byChoice is a nested object (checked by target_replies), not a reply string.
          t['replies'].each { |k, v| next if k == 'byChoice'; issues << err("#{where}.replies.#{k} is empty; the reply would be blank") if blank?(v) }
        end
        issues.concat(factor_strings(t['factorStrings'], "#{where}.factorStrings")) if t.key?('factorStrings')
      end
      issues
    end

    # One shape for every factor: { pass, fail, redFlag }, each a non-empty string (redFlag may be
    # null). attachmentPlausible adds a { fail, redFlag } entry per state. Absent or null = canonical.
    def self.factor_strings(fs, where)
      return [err("#{where} must be an object keyed by factor")] unless fs.is_a?(Hash)

      issues = []
      fs.each do |factor, entry|
        unless FACTORS.include?(factor)
          issues << err("#{where} has the key '#{factor}', which is not a factor (allowed: #{FACTORS.join(', ')})")
          next
        end
        unless entry.is_a?(Hash)
          issues << err("#{where}.#{factor} must be an object with pass, fail and redFlag")
          next
        end
        issues.concat(string_entry(entry, "#{where}.#{factor}", FACTOR_STATES[factor]))
      end
      issues
    end

    def self.string_entry(entry, where, states)
      issues = []
      entry.each do |k, v|
        case k
        when 'pass', 'fail'
          issues << err("#{where}.#{k} is empty; omit the key (or use null) to take the canonical line") if v.nil? ? false : blank?(v)
        when 'redFlag'
          issues << err("#{where}.redFlag is empty; use null for 'deliberately none' or omit it for the canonical line") if !v.nil? && blank?(v)
        when 'failMissed'
          # The advisory line on a send that did not land (mail-bridge renderChecklist); "" hides it.
          issues << err("#{where}.failMissed must be a string (\"\" hides the line on a miss)") unless v.is_a?(String)
        else
          if states && states.include?(k) && v.is_a?(Hash)
            issues.concat(string_entry(v.reject { |sk, _| sk == 'pass' }, "#{where}.#{k}", nil))
            issues << err("#{where}.#{k} has a pass line; the states are failures") if v.key?('pass')
          else
            issues << err("#{where} has the key '#{k}'; allowed: pass, fail, failMissed, redFlag#{states ? ", #{states.join(', ')}" : ''}")
          end
        end
      end
      if entry['fail'].is_a?(String) && !entry['fail'].strip.empty? && !entry.key?('redFlag')
        issues << warn_("#{where} supplies its own 'fail' line and has no 'redFlag' key; the canonical red flag may name a different tell " \
                        "(redFlag: null records that none is intended)")
      end
      issues
    end

    # ---- 04 N11: nothing in the scenario replaces the pre-send line ------------

    def self.fold(str)
      str.to_s.downcase.tr("‘’ʼ`", "'").gsub(/\s+/, ' ')
    end

    def self.presend_line(ctx)
      issues = []
      line = fold(PRESEND_LINE)
      walk = lambda do |node, path|
        case node
        when Hash
          node.each do |k, v|
            if k.to_s.match?(/pre[-_ ]?send/i)
              issues << err("#{path}.#{k}: the pre-send line is fixed by the mail client and a scenario cannot set or replace it")
            end
            walk.call(v, "#{path}.#{k}")
          end
        when Array
          node.each_with_index { |v, i| walk.call(v, "#{path}[#{i}]") }
        when String
          folded = fold(node)
          if folded.include?(line) || (folded.include?('needs evidence') && folded.include?('found yet'))
            issues << err("#{path} repeats or rewords the fixed pre-send line (\"#{PRESEND_LINE}\"); " \
                          'the mail client shows it, and scenario text must not stand in for it')
          end
        end
      end
      walk.call(ctx.social, 'social')
      issues
    end

    # ---- 04 N10 subset ---------------------------------------------------------

    def self.phish_targets(ctx)
      issues = []
      tlist = targets(ctx)
      return issues if tlist.empty?

      tpls = templates(ctx)
      prov = providers(ctx)
      people = people_ids(ctx)
      chars = ValidateSocial.characters_hash(ctx)
      ids = {}
      tlist.each do |t|
        id = t['id']
        where = "social.phishTargets[#{id}]"
        if blank?(id)
          issues << err('social.phishTargets has an entry with no id')
          next
        end
        issues << err("#{where}: target id is used more than once") if ids[id]
        ids[id] = true

        issues << err("#{where}.character '#{t['character']}' is not a social.characters entry") if t['character'] && !chars.key?(t['character'])
        issues.concat(target_templates(t, tpls, where))
        issues.concat(closed_target_decoy(ctx, t, tpls, where))
        issues.concat(target_subjects(t, where, ctx.social['intelFacts']))
        issues.concat(target_values(ctx, t, prov, people, where))
        issues.concat(target_outcome(ctx, t, where))
        issues.concat(target_sender_auth(t, where))
        issues.concat(target_expected_link(t, where))
        issues.concat(target_requires_intel(ctx, t, where))
        issues.concat(target_sender_values(ctx, t, tpls, where))
        issues.concat(target_factor_bias(ctx, t, where))
        issues.concat(target_replies(t, tpls, where))
      end
      issues
    end

    # E13 D1: replies.byChoice gives a data-only target a reply per sent pretext. Each key names a
    # social.templates id (the pick the write-stage reply branches on), and each value is a reply
    # string or a { landed, missed } pair of reply strings.
    def self.target_replies(t, tpls, where)
      issues = []
      replies = t['replies']
      return issues unless replies.is_a?(Hash) && replies.key?('byChoice')
      by = replies['byChoice']
      unless by.is_a?(Hash)
        return [err("#{where}.replies.byChoice must be an object keyed by template id")]
      end
      by.each do |tid, v|
        next if tid.start_with?('_')
        issues << err("#{where}.replies.byChoice names template '#{tid}', which is not in social.templates") unless tpls.key?(tid)
        if v.is_a?(String)
          issues << err("#{where}.replies.byChoice.#{tid} is empty; the reply would be blank") if blank?(v)
        elsif v.is_a?(Hash)
          present = %w[landed missed].select { |k| v.key?(k) }
          issues << err("#{where}.replies.byChoice.#{tid} has neither a landed nor a missed reply") if present.empty?
          present.each { |k| issues << err("#{where}.replies.byChoice.#{tid}.#{k} is empty; the reply would be blank") if blank?(v[k]) }
        else
          issues << err("#{where}.replies.byChoice.#{tid} must be a reply string or a { landed, missed } object")
        end
      end
      issues
    end

    # 00 §7, N-5: boostIfGlobal / strictIfGlobal name boolean flag globals and the
    # mail bridge compares them with === true. A key pointed at a global declared
    # with a non-boolean default therefore never flips its factor and the bias is a
    # silent no-op (T2-8). A character's influence is the separate route read by the
    # on_email ink, not here.
    def self.target_factor_bias(ctx, t, where)
      issues = []
      %w[boostIfGlobal strictIfGlobal].each do |key|
        hooks = t[key]
        next unless hooks.is_a?(Hash)
        hooks.each_key do |g|
          next unless ctx.all_globals.key?(g)
          default = ctx.all_globals[g]
          next if [true, false].include?(default)
          issues << warn_("#{where}.#{key} names global '#{g}', declared with a non-boolean default " \
                          "(#{default.inspect}); the hook fires only on === true, so it can never flip a factor " \
                          "(name a boolean flag global, or use the character's influence route read by the on_email ink)")
        end
      end
      issues
    end

    # Shape only. The brand/host checks on expectedLink (brandId is a brand in 07, realDomain host
    # rules) belong to the landing-page lint (scripts/validate_social/landing.rb, P5-C), which owns
    # 07's brands; here we only reject a malformed expectedLink so linkCredible cannot read a blank.
    def self.target_expected_link(t, where)
      el = t['expectedLink']
      return [] if el.nil?

      issues = []
      unless el.is_a?(Hash)
        return [err("#{where}.expectedLink must be an object { brandId, realDomain }")]
      end
      issues << err("#{where}.expectedLink.brandId is missing; linkCredible and its tell read the claimed brand") if blank?(el['brandId'])
      issues << err("#{where}.expectedLink.realDomain is missing; the link tell compares against it") if blank?(el['realDomain'])
      issues
    end

    # 04 N10, "Closed and open targets": a closed target (primedFor.trusts is not ["*"]) must offer at
    # least one pretext template that, on its own, cannot satisfy pretextRelevant — the plausible-but-
    # wrong decoy that carries the lesson. A template can satisfy it when its slots and `implies` can
    # together hold minDistinct of the target's distinctiveValues. An open-inbox target is exempt.
    def self.closed_target_decoy(ctx, t, tpls, where)
      primed = t['primedFor']
      return [] unless primed.is_a?(Hash)
      return [] if primed['trusts'] == ['*'] # open target: exempt (04 §7)

      pretexts = list(t.dig('templateSets', 'pretext')).uniq.filter_map { |n| tpls[n] }
      return [] if pretexts.empty?

      distinct = list(primed['distinctiveValues'])
      return [] if distinct.empty?

      min = primed['minDistinct'].is_a?(Numeric) && primed['minDistinct'] > 0 ? primed['minDistinct'] : 1
      meta = value_meta(ctx)
      has_decoy = pretexts.any? { |tpl| pretext_distinct_reach(tpl, distinct, meta) < min }
      return [] if has_decoy

      [err("#{where}.templateSets.pretext: every pretext template can satisfy pretextRelevant; a closed " \
           'target needs one plausible-but-wrong decoy whose slots and implies cannot carry a distinctive value')]
    end

    # value id => [{ 'type', 'about' }, ...] from every fact's provides (00 §1).
    def self.value_meta(ctx)
      @value_meta ||= {}
      @value_meta[ctx.object_id] ||= begin
        map = Hash.new { |h, k| h[k] = [] }
        facts(ctx).each_value do |f|
          hash_list(f['provides']).each do |p|
            map[p['value']] << { 'type' => p['type'], 'about' => p['about'] } if p['value'].is_a?(String)
          end
        end
        map
      end
    end

    # How many of the target's distinctiveValues one pretext template can carry: `implies` values that
    # are distinctive, plus a greedy one-per-slot match of a distinctive value the slot can offer
    # (a provides entry of the slot's type whose `about` matches, 04 appendix "about" rule).
    def self.pretext_distinct_reach(tpl, distinct, meta)
      used = []
      hash_list(tpl['implies']).each { |im| used << im['value'] if distinct.include?(im['value']) }
      used.uniq!
      hash_list(tpl['slots']).each do |s|
        cand = distinct.find do |v|
          next false if used.include?(v)

          (meta[v] || []).any? { |m| m['type'] == s['type'] && norm_about(m['about']) == norm_about(s['about']) }
        end
        used << cand if cand
      end
      used.uniq.length
    end

    def self.norm_about(a)
      a.is_a?(String) && !a.empty? ? a : nil
    end

    # P5-8: social.templates[id].flags names the channel tells the wording carries (the
    # flip, the replayed defend card and the composer's meter read them).
    TEMPLATE_FLAG_IDS = %w[lookalike_domain changed_bank_details unexpected_qr unrequested_mfa_push
                           smish_shortlink_urgency vish_callback_pressure secrecy_or_bypass
                           borrowed_authority reply_to_differs reply_stop_trick padlock_myth
                           enable_content_prompt].freeze

    def self.template_flags(name, tpl, where)
      return [] unless tpl.key?('flags')

      fl = tpl['flags']
      unless fl.is_a?(Array) && fl.all? { |f| f.is_a?(String) && !f.empty? }
        return [err("#{where}: template '#{name}'.flags must be an array of channel tell ids")]
      end
      fl.reject { |f| TEMPLATE_FLAG_IDS.include?(f) }.map do |f|
        err("#{where}: template '#{name}'.flags '#{f}' is not a channel tell (#{TEMPLATE_FLAG_IDS.join(', ')}); the meter and flip would have no sentence for it")
      end
    end

    def self.target_templates(t, tpls, where)
      issues = []
      sets = t['templateSets']
      unless sets.is_a?(Hash)
        return [err("#{where}.templateSets is missing; a target offers templates for all four parts (#{PARTS.join(', ')})")]
      end

      slot_owner = {}
      PARTS.each do |part|
        names = sets[part]
        if !names.is_a?(Array) || names.empty?
          issues << err("#{where}.templateSets.#{part} is missing or empty; the composer would have nothing to offer for the #{part} part")
          next
        end
        dupes = names.group_by { |n| n }.select { |_, v| v.length > 1 }.keys
        issues << err("#{where}.templateSets.#{part} lists #{dupes.map { |d| "'#{d}'" }.join(', ')} more than once") unless dupes.empty?
        names.each do |name|
          tpl = tpls[name]
          unless tpl
            issues << err("#{where}.templateSets.#{part} names template '#{name}', which is not in social.templates")
            next
          end
          issues << err("#{where}.templateSets.#{part} offers template '#{name}', whose part is '#{tpl['part']}'") if tpl['part'] != part
          issues.concat(template_slots(name, tpl, where))
          issues.concat(template_flags(name, tpl, where))
          list(tpl['slots']).each do |s|
            next unless s.is_a?(Hash) && s['id'].is_a?(String)

            (slot_owner[s['id']] ||= {})[part] = true
          end
        end
      end
      # the composed message keeps one flat slots map, so an id cannot repeat across parts
      slot_owner.each do |sid, parts|
        issues << err("#{where}: slot id '#{sid}' is used in more than one part (#{parts.keys.join(', ')}); slot ids are unique within a target's template set") if parts.length > 1
      end

      pretext = list(sets['pretext']).uniq.length
      closed = !(t.dig('primedFor', 'trusts') == ['*'])
      if pretext.positive? && pretext < 2
        issues << err("#{where}.templateSets.pretext offers #{pretext} template; a target offers at least two, so the pick matters")
      end
      if closed && pretext > 4
        issues << err("#{where}.templateSets.pretext offers #{pretext} templates; a closed target offers two to four")
      end
      issues
    end

    def self.template_slots(name, tpl, where)
      issues = []
      slots = hash_list(tpl['slots'])
      sids = slots.map { |s| s['id'] }
      dupes = sids.group_by { |s| s }.select { |s, v| s && v.length > 1 }.keys
      issues << err("#{where}: template '#{name}' repeats slot id #{dupes.map { |d| "'#{d}'" }.join(', ')}") unless dupes.empty?
      slots.each do |s|
        issues << err("#{where}: template '#{name}' has a slot with no id or no type") if blank?(s['id']) || blank?(s['type'])
      end
      issues << err("#{where}: template '#{name}' has #{slots.length} blanks; at most two") if slots.length > 2
      used = tpl['text'].to_s.scan(/\{([^{}]+)\}/).flatten
      (used - sids - BUILTIN_PLACEHOLDERS).uniq.each do |u|
        issues << err("#{where}: template '#{name}' text uses {#{u}} but declares no slot with that id")
      end
      (sids.compact - used).uniq.each do |u|
        issues << err("#{where}: template '#{name}' declares slot '#{u}' but its text never uses {#{u}}")
      end
      issues
    end

    def self.target_subjects(t, where, intel_facts = nil)
      issues = []
      subs = list(t['subjects'])
      if subs.empty?
        issues << err("#{where}.subjects is missing or empty; the composer's Subject pick needs at least one { id, text, topic }")
      end
      seen = {}
      subs.each_with_index do |s, i|
        unless s.is_a?(Hash)
          issues << err("#{where}.subjects[#{i}] must be an object")
          next
        end
        issues << err("#{where}.subjects[#{i}] has no id") if blank?(s['id'])
        issues << err("#{where}.subjects: id '#{s['id']}' is used more than once") if s['id'].is_a?(String) && seen[s['id']]
        seen[s['id']] = true if s['id'].is_a?(String)
        issues << err("#{where}.subjects[#{i}].text is empty; the sent record and reply subject read it") if blank?(s['text'])
        issues << err("#{where}.subjects[#{i}].topic is missing; the open check reads it") if blank?(s['topic'])
        if s.key?('requires')
          req = s['requires']
          if !req.is_a?(Array) || req.any? { |f| blank?(f) }
            issues << err("#{where}.subjects[#{i}].requires must be an array of social.intelFacts ids")
          elsif intel_facts.is_a?(Hash)
            req.each { |f| issues << err("#{where}.subjects[#{i}].requires '#{f}' is not a social.intelFacts id, so the subject would never be offered") unless intel_facts.key?(f) }
          end
        end
      end
      # P5-7: subjects[].requiresTemplate binds a subject to the templates it fits (the
      # composer offers it only while one of them is chosen, and picks it when one is chosen).
      set_ids = (t['templateSets'].is_a?(Hash) ? t['templateSets'].values : []).select { |v| v.is_a?(Array) }.flatten
      subs.each_with_index do |s, i|
        next unless s.is_a?(Hash) && s.key?('requiresTemplate')
        rt = s['requiresTemplate']
        ids = rt.is_a?(String) ? [rt] : rt
        if !ids.is_a?(Array) || ids.empty? || ids.any? { |x| blank?(x) || !x.is_a?(String) }
          issues << err("#{where}.subjects[#{i}].requiresTemplate must be a template id or a non-empty array of them")
          next
        end
        ids.each do |x|
          next if set_ids.include?(x)
          issues << err("#{where}.subjects[#{i}].requiresTemplate '#{x}' is not in this target's templateSets, so the subject would never be offered")
        end
      end
      bound = subs.select { |s| s.is_a?(Hash) && s.key?('requiresTemplate') }
      if !subs.empty? && bound.length == subs.length
        issues << warn_("#{where}.subjects all carry 'requiresTemplate'; before a pretext is chosen (or with an unbound one) the composer falls back to offering every one")
      end
      if !subs.empty? && subs.all? { |s| s.is_a?(Hash) && s.key?('requires') }
        issues << warn_("#{where}.subjects all carry 'requires'; with nothing found the composer falls back to offering every one")
      end
      topics = t.dig('interests', 'topics')
      if !topics.is_a?(Array) || topics.empty?
        issues << err("#{where}.interests.topics is missing or empty")
      elsif t.dig('primedFor', 'trusts') != ['*'] && subs.all? { |s| s.is_a?(Hash) && topics.include?(s['topic']) } && !subs.empty?
        issues << err("#{where}.subjects: every subject has a topic the target opens (#{topics.join(', ')}); " \
                      'offer at least one it does not, so the pick matters for a stranger')
      end
      issues
    end

    def self.target_values(ctx, t, prov, people, where)
      issues = []
      primed = t['primedFor']
      distinct = primed.is_a?(Hash) ? list(primed['distinctiveValues']) : []
      distinct.each do |v|
        issues << err("#{where}.primedFor.distinctiveValues: '#{v}' is not provided by any fact in social.intelFacts") if prov[v].empty?
      end
      if primed.is_a?(Hash)
        min = primed['minDistinct'].is_a?(Numeric) ? primed['minDistinct'] : 1
        req = list(t['requiredFactors'])
        if req.include?('pretextRelevant') && distinct.length < min
          issues << err("#{where}.primedFor lists #{distinct.length} distinctiveValues but minDistinct is #{min}; pretextRelevant could never pass")
        end
        trusts = primed['trusts']
        if trusts.is_a?(Array)
          trusts.each do |tr|
            next if tr == '*' || people.include?(tr)

            issues << err("#{where}.primedFor.trusts: '#{tr}' is not a social.people id")
          end
        end
        att = primed['expectedAttachment']
        if req.include?('attachmentPlausible') && blank?(att)
          issues << err("#{where}: attachmentPlausible is required but primedFor.expectedAttachment is not set")
        end
      end
      if list(t['requiredFactors']).include?('addressedTo')
        forms = list(t['addressedAs'])
        if forms.empty?
          issues << err("#{where}: addressedTo is required but addressedAs is empty")
        else
          forms.each do |f|
            issues << err("#{where}.addressedAs: '#{f}' is not provided by any fact, so no greeting blank could ever offer it") if prov[f].empty?
          end
        end
      end
      issues
    end

    # One owner: a target with a `character` has its on_email knot set the outcome; a data-only
    # target authors outcome.setGlobal. Outcome globals are declared, and something should read them.
    def self.target_outcome(ctx, t, where)
      issues = []
      outcome = t['outcome']
      if t['character'] && outcome
        issues << err("#{where} has both a character (whose on_email knot sets the outcome) and an outcome block; a target has one outcome owner")
      elsif !t['character'] && !outcome.is_a?(Hash)
        issues << err("#{where} has no character and no outcome.setGlobal; nothing would record that a send landed")
      end
      return issues unless outcome.is_a?(Hash)

      sets = outcome['setGlobal']
      unless sets.is_a?(Hash) && !sets.empty?
        return issues << err("#{where}.outcome needs a setGlobal object naming the global to set")
      end

      sets.each_key do |g|
        d = declared_written(ctx, g, "outcome of #{where}")
        issues << d if d
        issues << warn_("#{where}.outcome global '#{g}' is declared but nothing else in the scenario reads it") if d.nil? && global_reads(ctx.json, g) < 1
      end
      issues
    end

    # How many times the global's name appears in the scenario once its declaration and the
    # phishTargets outcome blocks are removed (an objective, an event pattern such as global_variable_changed:<name>, an object).
    def self.global_reads(json, name)
      copy = JSON.parse(JSON.generate(json))
      copy.delete('globalVariables')
      hash_list(copy.dig('social', 'phishTargets')).each { |t| t.delete('outcome') }
      JSON.generate(copy).scan(/(?<![A-Za-z0-9_])#{Regexp.escape(name)}(?![A-Za-z0-9_])/).length
    end

    def self.target_sender_auth(t, where)
      sa = t['senderAuth']
      return [] unless sa.is_a?(Hash)

      issues = []
      if sa['domainPublishesAuth'] == true && blank?(sa['dmarcPolicy'])
        issues << err("#{where}.senderAuth publishes auth but has no dmarcPolicy (none, quarantine or reject)")
      elsif sa.key?('dmarcPolicy') && !%w[none quarantine reject].include?(sa['dmarcPolicy'])
        issues << err("#{where}.senderAuth.dmarcPolicy '#{sa['dmarcPolicy']}' must be none, quarantine or reject")
      end
      issues
    end

    # Suffixes phish-rules.js personOfValue resolves to a person id.
    NAME_SUFFIXES = %w[_first _short _formal _full _address].freeze

    def self.person_of_value(v)
      return nil unless v.is_a?(String)

      suf = NAME_SUFFIXES.find { |x| v.end_with?(x) && v.length > x.length }
      suf && v[0...-suf.length]
    end

    # The From part's name and address blanks offer the `provides` values of type name (about matching
    # the slot's) and address. The judge turns each into a person with personOfValue, so a value without
    # one of NAME_SUFFIXES resolves to nobody and can never satisfy senderTrust. That is fine for a decoy.
    # It is an error only when senderTrust is required and the slot offers no value that resolves to a
    # person in primedFor.trusts (the correct answer could not be composed). Any other unresolvable value
    # is a warning. An open inbox (trusts ['*']) never reads the From person, so it is skipped; address
    # entries carrying a `rule` are derived by the composer and count as able to reach a trusted person.
    def self.target_sender_values(ctx, t, tpls, where)
      trusts = list(t.dig('primedFor', 'trusts'))
      return [] if trusts == ['*']

      required = list(t['requiredFactors']).include?('senderTrust') ||
                 hash_list(t['factors']).any? { |f| f['id'] == 'senderTrust' && f['mode'] == 'required' }
      listed = required || list(t['advisoryFactors']).include?('senderTrust') ||
               hash_list(t['factors']).any? { |f| f['id'] == 'senderTrust' }
      return [] unless listed

      provides = facts(ctx).flat_map do |fid, f|
        hash_list(f['provides']).select { |p| %w[name address].include?(p['type']) && p['value'].is_a?(String) }
                                .map { |p| [fid, p] }
      end
      issues = []
      list(t.dig('templateSets', 'from')).uniq.each do |tn|
        hash_list(tpls.dig(tn, 'slots')).each do |slot|
          next unless %w[name address].include?(slot['type'])

          offered = provides.select do |_, p|
            p['type'] == slot['type'] && (p['type'] == 'address' || norm_about(slot['about']) == norm_about(p['about']))
          end
          derived = offered.any? { |_, p| p['rule'].is_a?(String) && !p['rule'].empty? }
          offered = offered.reject { |_, p| p['rule'].is_a?(String) && !p['rule'].empty? }
          bad = offered.reject { |_, p| person_of_value(p['value']) }
          next if bad.empty?

          reaches = derived || offered.any? { |_, p| trusts.include?(person_of_value(p['value'])) }
          names = bad.map { |fid, p| "'#{p['value']}' (social.intelFacts.#{fid})" }.uniq.join(', ')
          cannot = "does not end in #{NAME_SUFFIXES.join(', ')}, so personOfValue cannot resolve it to a person"
          if required && !reaches
            issues << err("#{where}: the From blank '#{slot['id']}' of template '#{tn}' offers no value that resolves to a trusted person " \
                          "(#{trusts.join(', ')}), so senderTrust can never pass; #{names} #{cannot}")
          else
            issues << warn_("#{where}: From blank '#{slot['id']}' of template '#{tn}' offers #{names}, which #{cannot} " \
                            'and can never satisfy senderTrust (fine for a decoy)')
          end
        end
      end
      issues
    end

    def self.target_requires_intel(ctx, t, where)
      list(t['requiresIntelToAttempt']).filter_map do |g|
        next if facts(ctx).key?(g) || ctx.all_globals.key?(g)

        err("#{where}.requiresIntelToAttempt: '#{g}' is neither a social.intelFacts id nor a declared global")
      end
    end

    # ---- 01 N18: accounts, mailboxes, seeded mail, contacts ---------------------

    def self.account_ids(ctx)
      hash_list(mail_client(ctx)['accounts']).filter_map { |a| a['id'] if a['id'].is_a?(String) }.to_set
    end

    def self.mail_client_checks(ctx)
      issues = []
      mc = mail_client(ctx)
      return issues if mc.empty?

      people = people_ids(ctx)
      boxes = hash_list(mc['mailboxes'])
      box_ids = boxes.filter_map { |b| b['id'] if b['id'].is_a?(String) }
      accounts = hash_list(mc['accounts'])
      acct_ids = account_ids(ctx)

      issues.concat(unique_ids(boxes, 'social.mailClient.mailboxes'))
      boxes.each do |b|
        issues << err("social.mailClient.mailboxes: '#{b['id']}' has owner '#{b['owner']}', which is not a social.people id") if b['owner'] && !people.include?(b['owner'])
      end
      issues.concat(unique_ids(accounts, 'social.mailClient.accounts'))
      accounts.each { |a| issues.concat(account_checks(ctx, a, box_ids, people)) }

      targets(ctx).each do |t|
        next if blank?(t['id'])

        d = declared_written(ctx, "phish_#{t['id']}_attempts", "attempt counter of social.phishTargets[#{t['id']}]")
        issues << d if d
      end

      issues.concat(seeded_checks(ctx, mc, box_ids, acct_ids))
      issues.concat(contact_checks(ctx, mc, acct_ids, people))
      issues.concat(dotted_ids(boxes, hash_list(mc['seededMessages'])))
      issues
    end

    # 00 §10a "Persistence": mailState saves one key per message,
    # mailboxes.<box>.<msgId>, and the server splits it on the dots. A dot in a
    # mailbox or seeded message id would misfile the message.
    def self.dotted_ids(boxes, seeds)
      issues = []
      boxes.each do |b|
        issues << err("social.mailClient.mailboxes: id '#{b['id']}' contains a dot; mailbox ids are saved in dotted keys (mailboxes.<box>.<msgId>)") if b['id'].is_a?(String) && b['id'].include?('.')
      end
      seeds.each do |m|
        issues << err("social.mailClient.seededMessages: id '#{m['id']}' contains a dot; message ids are saved in dotted keys (mailboxes.<box>.<msgId>)") if m['id'].is_a?(String) && m['id'].include?('.')
      end
      issues
    end

    def self.unique_ids(records, where)
      seen = {}
      issues = []
      records.each_with_index do |r, i|
        id = r['id']
        if blank?(id)
          issues << err("#{where}[#{i}] has no id")
        elsif seen[id]
          issues << err("#{where}: id '#{id}' is used more than once")
        end
        seen[id] = true if id.is_a?(String)
      end
      issues
    end

    def self.account_checks(ctx, a, box_ids, people)
      issues = []
      id = a['id']
      return issues if blank?(id)

      where = "social.mailClient.accounts[#{id}]"
      kind = a['kind']
      issues << err("#{where}.kind '#{kind}' must be one of #{ACCOUNT_KINDS.join(', ')}") unless ACCOUNT_KINDS.include?(kind)
      if blank?(a['mailbox'])
        issues << err("#{where} names no mailbox")
      elsif !box_ids.include?(a['mailbox'])
        issues << err("#{where}.mailbox '#{a['mailbox']}' is not in social.mailClient.mailboxes")
      end
      issues << err("#{where}.person '#{a['person']}' is not a social.people id") if a['person'] && !people.include?(a['person'])

      if kind == 'created'
        issues.concat(create_menu_checks(a, where))
        [["acct_#{id}", 'availability flag'], ["acct_#{id}_choice", 'chosen menu entry']].each do |name, why|
          d = declared_written(ctx, name, "#{why} of #{where}")
          issues << d if d
        end
      else
        issues << err("#{where} has no address") if blank?(a['address'])
      end
      if kind == 'found' && blank?(a['unlockedBy'])
        issues << err("#{where} is a found account with no unlockedBy; nothing would ever make it available")
      end
      if a['unlockedBy'].is_a?(String) && !a['unlockedBy'].empty?
        d = declared_read(ctx, a['unlockedBy'], "unlockedBy of #{where}")
        issues << d if d
      end
      issues
    end

    def self.create_menu_checks(a, where)
      menu = a['createMenu']
      return [err("#{where} is a created account with no createMenu; the player would have no address to pick")] unless menu.is_a?(Array) && !menu.empty?

      issues = unique_ids(hash_list(menu), "#{where}.createMenu")
      menu.each_with_index do |m, i|
        unless m.is_a?(Hash)
          issues << err("#{where}.createMenu[#{i}] must be an object")
          next
        end
        issues << err("#{where}.createMenu[#{i}] has no address") if blank?(m['address'])
        issues << err("#{where}.createMenu[#{i}] has no displayName") if blank?(m['displayName'])
      end
      issues
    end

    def self.seeded_checks(ctx, mc, box_ids, acct_ids)
      issues = []
      msgs = hash_list(mc['seededMessages'])
      issues.concat(unique_ids(msgs, 'social.mailClient.seededMessages'))
      granted = {}
      msgs.each do |m|
        where = "social.mailClient.seededMessages[#{m['id']}]"
        if blank?(m['mailbox'])
          issues << err("#{where} names no mailbox")
        elsif !box_ids.include?(m['mailbox'])
          issues << err("#{where}.mailbox '#{m['mailbox']}' is not in social.mailClient.mailboxes")
        end
        issues << err("#{where}.folder '#{m['folder']}' must be inbox or sent") unless %w[inbox sent].include?(m['folder'])
        if m['folder'] == 'sent'
          if blank?(m['fromAccount'])
            issues << err("#{where} is a sent message with no fromAccount")
          elsif !acct_ids.include?(m['fromAccount'])
            issues << err("#{where}.fromAccount '#{m['fromAccount']}' is not a social.mailClient.accounts id")
          end
        end
        if m.key?('deliverAt')
          d = m['deliverAt']
          if !d.is_a?(Hash) || !(d['afterSeconds'].is_a?(Numeric) || d['global'].is_a?(String))
            issues << err("#{where}.deliverAt needs afterSeconds (a number) or global (a declared name)")
          elsif d['global'].is_a?(String)
            e = declared_read(ctx, d['global'], "deliverAt of #{where}")
            issues << e if e
          end
        end
        hash_list(m['highlights']).each do |h|
          if !h['text'].is_a?(String) || h['text'].empty?
            issues << err("#{where}: highlight '#{h['id']}' has no text")
          elsif !m['body'].to_s.include?(h['text'])
            issues << err("#{where}: highlight '#{h['id']}' text #{h['text'].inspect} is not an exact substring of the message body")
          end
          next unless h['grants']

          if facts(ctx).key?(h['grants'])
            (granted[h['grants']] ||= []) << "#{m['id']}/#{h['id']}"
          else
            issues << err("#{where}: highlight '#{h['id']}' grants '#{h['grants']}', which is not a social.intelFacts id")
          end
        end
      end
      granted.each do |fact, where|
        issues << err("fact '#{fact}' is granted by more than one highlight (#{where.join(', ')}); each fact has one source") if where.length > 1
      end
      issues
    end

    def self.contact_checks(ctx, mc, acct_ids, people)
      issues = []
      contacts = hash_list(mc['contacts'])
      issues.concat(unique_ids(contacts, 'social.mailClient.contacts'))
      chars = ValidateSocial.characters_hash(ctx)
      tmap = targets(ctx).to_h { |t| [t['id'], t] }
      contacts.each do |c|
        where = "social.mailClient.contacts[#{c['id']}]"
        issues << err("#{where}.person '#{c['person']}' is not a social.people id") if c['person'] && !people.include?(c['person'])
        addrs = list(c['addresses'])
        issues << err("#{where}.addresses is missing or empty") if addrs.empty? || addrs.any? { |a| blank?(a) }
        list(c['accountIds']).each do |a|
          issues << err("#{where}.accountIds names '#{a}', which is not a social.mailClient.accounts id") unless acct_ids.include?(a)
        end
        issues << err("#{where}.character '#{c['character']}' is not a social.characters entry") if c['character'] && !chars.key?(c['character'])
        if c['targetId']
          t = tmap[c['targetId']]
          if t.nil?
            issues << err("#{where}.targetId '#{c['targetId']}' is not a social.phishTargets id")
          elsif !addrs.include?(t['address'])
            issues << err("#{where}: target '#{c['targetId']}' has address #{t['address'].inspect}, which is not one of the contact's addresses")
          end
        end
        if c['revealedBy'].is_a?(String) && !c['revealedBy'].empty?
          e = declared_read(ctx, c['revealedBy'], "revealedBy of #{where}")
          issues << e if e
        end
      end
      issues
    end

    # ---- mail_terminal objects ---------------------------------------------------

    def self.each_object(json)
      walk = lambda do |obj, path, &blk|
        next unless obj.is_a?(Hash)

        blk.call(obj, path)
        %w[contents itemsHeld].each { |k| Array(obj[k]).each_with_index { |c, i| walk.call(c, "#{path}/#{k}[#{i}]", &blk) } }
      end
      ValidateSocial.rooms(json).each do |rid, room|
        Array(room['objects']).each_with_index { |o, i| walk.call(o, "/rooms/#{rid}/objects[#{i}]") { |x, p| yield x, p } }
        Array(room['npcs']).each_with_index do |n, i|
          next unless n.is_a?(Hash)

          Array(n['itemsHeld']).each_with_index { |o, j| walk.call(o, "/rooms/#{rid}/npcs[#{i}]/itemsHeld[#{j}]") { |x, p| yield x, p } }
        end
      end
      Array(json['startItemsInInventory']).each_with_index { |o, i| walk.call(o, "/startItemsInInventory[#{i}]") { |x, p| yield x, p } }
    end

    def self.mail_terminals(ctx)
      issues = []
      acct_ids = account_ids(ctx)
      each_object(ctx.json) do |obj, path|
        next unless obj['type'] == 'mail_terminal'

        md = obj['minigameData'].is_a?(Hash) ? obj['minigameData'] : {}
        ids = md['accountIds']
        if !ids.is_a?(Array) || ids.empty?
          issues << err("#{path} (mail_terminal) has no minigameData.accountIds; the device would offer no account")
          next
        end
        ids.each do |a|
          issues << err("#{path}: minigameData.accountIds names '#{a}', which is not a social.mailClient.accounts id") unless acct_ids.include?(a)
        end
        issues << err("#{path}: minigameData.maxSends must be a whole number of 1 or more") if md.key?('maxSends') && !(md['maxSends'].is_a?(Integer) && md['maxSends'] >= 1)
        issues << err("#{path}: minigameData.layout is #{md['layout'].inspect}; the only layout is \"phone\"") if md.key?('layout') && md['layout'] != 'phone'
        issues << err("#{path}: minigameData.readOnly must be true or false") if md.key?('readOnly') && ![true, false].include?(md['readOnly'])
        d = md['defaultAccount']
        next if d.nil?

        issues << err("#{path}: minigameData.defaultAccount '#{d}' is not a social.mailClient.accounts id") unless acct_ids.include?(d)
        issues << err("#{path}: minigameData.defaultAccount '#{d}' is not in this device's accountIds") if acct_ids.include?(d) && !ids.include?(d)
      end
      issues
    end

    # ---- P0-R R-12: a headless email record whose id a room NPC already holds ------

    # The server drops the headless record whenever any room NPC has its id; the client registers it
    # until that room loads. An error, so the two cannot disagree. A character with no emailRecord
    # has no headless record, and its channels.email may legitimately name a room NPC.
    def self.email_record_clash(ctx)
      room_ids = Hash.new { |h, k| h[k] = [] }
      ValidateSocial.rooms(ctx.json).each do |rid, room|
        Array(room['npcs']).each { |n| room_ids[n['id']] << rid if n.is_a?(Hash) && n['id'].is_a?(String) }
      end
      ValidateSocial.characters_hash(ctx).filter_map do |cid, ch|
        next unless ch['emailRecord'].is_a?(Hash)

        eid = ch.dig('channels', 'email')
        next unless eid.is_a?(String) && room_ids.key?(eid)

        err("social.characters.#{cid}.channels.email '#{eid}' is also the id of an NPC in room #{room_ids[eid].uniq.join(', ')}; " \
            'the server drops the headless emailRecord and the client registers it until that room loads, so give the email record its own id')
      end
    end

    # ---- 04 N10 / 01 N18: the character email story (on_email, email_* VARs, se_influence, ----
    #      #compose_reply, emailKnots) ---------------------------------------------------------
    #
    # Runs on a character's email-channel story when the .ink source exists (as the characters()
    # lint does; a missing storyPath file is the ink/storyPath layer's concern, not this one). The
    # VAR <character>_influence declaration is checked by validate_social.rb characters().
    EMAIL_VAR_RE = /(?<![A-Za-z0-9_])(email_[A-Za-z0-9_]+)/.freeze

    def self.email_stories(ctx)
      return [] unless ctx.social.is_a?(Hash)

      issues = []
      chars = ValidateSocial.characters_hash(ctx)
      stories = character_email_stories(ctx)
      parsed = stories.transform_values { |src| parse_email_story(src, ctx.repo_root) }
      tlist = targets(ctx)
      acct_ids = account_ids(ctx)

      # (A) every character phish target has an on_email knot that declares the email_* VARs it reads
      # and calls se_influence on both branches.
      tlist.each do |t|
        cid = t['character']
        next unless cid.is_a?(String) && chars.key?(cid)

        ps = parsed[cid]
        next unless ps # no story file; owned by the ink/storyPath layer

        where = "social.phishTargets[#{t['id']}]"
        rel = ps[:rel]
        unless ps[:knots].key?('on_email')
          issues << err("#{where}.character '#{cid}' email story #{rel} has no '=== on_email ===' knot; the mail runner enters on_email")
          next
        end
        (ps[:email_reads] - ps[:email_vars]).sort.each do |v|
          issues << err("#{where}.character '#{cid}' email story #{rel} reads #{v} but declares no 'VAR #{v}'; " \
                        'the engine writes the email_* set before on_email and ink must declare each one it reads')
        end
        unless se_influence_both_branches?(ps)
          issues << err("#{where}.character '#{cid}' on_email (#{rel}) must call se_influence on both branches; " \
                        'write { email_landed: ... ~ se_influence(...) - else: ... ~ se_influence(...) } (a divert into a reply knot that calls it also counts)')
        end
      end

      # (B) #compose_reply:<targetId> names an existing phishTarget of the same character.
      parsed.each do |cid, ps|
        ps[:compose_reply].each do |tid|
          tgt = tlist.find { |t| t['id'] == tid }
          if tgt.nil?
            issues << err("social.characters.#{cid} email story #{ps[:rel]}: #compose_reply:#{tid} names '#{tid}', which is not a social.phishTargets id")
          elsif tgt['character'] != cid
            issues << err("social.characters.#{cid} email story #{ps[:rel]}: #compose_reply:#{tid} names target '#{tid}', whose character is #{tgt['character'].inspect}, not '#{cid}'")
          end
        end
      end

      # (C) emailKnots (01 N18): each key is a real account; each value names a knot the story defines.
      chars.each do |cid, ch|
        ek = ch['emailKnots']
        next unless ek.is_a?(Hash)

        ps = parsed[cid]
        ek.each do |acct, knot|
          issues << err("social.characters.#{cid}.emailKnots key '#{acct}' is not a social.mailClient.accounts id") unless acct_ids.include?(acct)
          next unless ps

          unless knot.is_a?(String) && ps[:knots].key?(knot)
            issues << err("social.characters.#{cid}.emailKnots maps '#{acct}' to knot #{knot.inspect}, which the email story #{ps[:rel]} does not define")
          end
        end
      end

      issues
    end

    # character id => root .ink source path, for characters whose email story file exists.
    def self.character_email_stories(ctx)
      out = {}
      ValidateSocial.character_stories(ctx).each do |cid, chans|
        entry = chans['emailRecord'] || chans['email']
        out[cid] = entry.last if entry.is_a?(Array) && entry.last.is_a?(String)
      end
      out
    end

    # Parse the story's .ink files (root + INCLUDEs). Returns:
    #   knots: { name => [body line, ...] }, email_reads: Set, email_vars: Set,
    #   compose_reply: [targetId, ...], rel: repo-relative root path.
    def self.parse_email_story(src, repo_root = nil)
      return nil unless src.is_a?(String) && File.exist?(src)

      files = ValidateSocial.ink_files(src)
      knots = {}
      current = nil
      email_reads = []
      email_vars = []
      compose_reply = []
      files.each do |f|
        ValidateSocial.ink_lines(f).each do |line, _|
          code = line.sub(%r{//.*\z}, '')
          if code =~ /^\s*={2,}\s*(?:function\s+)?(\w+)/
            current = Regexp.last_match(1)
            knots[current] ||= []
            next
          end
          (knots[current] ||= []) << code if current
          if code =~ /^\s*VAR\s+(email_[A-Za-z0-9_]+)\s*=/
            email_vars << Regexp.last_match(1)
          else
            code.scan(EMAIL_VAR_RE) { |m| email_reads << m[0] }
          end
          code.scan(/#\s*compose_reply\s*:\s*([A-Za-z0-9_]+)/) { |m| compose_reply << m[0] }
        end
      end
      rel = repo_root.is_a?(String) ? src.sub("#{repo_root}/", '') : src
      { knots: knots, email_reads: email_reads.uniq, email_vars: email_vars.uniq,
        compose_reply: compose_reply, rel: rel }
    end

    # True when on_email calls se_influence on both the landing and the failing path (following
    # diverts). It accepts both authored idioms (04 worked example, 00 §10): the else form
    # `{ email_landed: ...se_influence(+)... - else: ...se_influence(-)... }`, and the early-return
    # form `{ email_landed: ...se_influence(+)... -> DONE }` followed by a fall-through that calls
    # se_influence(-). The landing path is the positive email_landed arm; the failing path is the
    # else arm plus everything after the conditional (the fall-through, reached only when not landed).
    def self.se_influence_both_branches?(ps)
      body = (ps[:knots]['on_email'] || []).join("\n")
      arms = landed_arms(body)
      return false unless arms

      landed_text, else_text, tail_text = arms
      calls_influence?(ps, landed_text, []) && calls_influence?(ps, "#{else_text}\n#{tail_text}", [])
    end

    # Find the first positive { email_landed: ... } conditional; return [positive arm, else arm,
    # the body after the closing brace], or nil if there is none.
    def self.landed_arms(text)
      i = 0
      while (i = text.index('{', i))
        depth = 0
        head_end = nil
        close = nil
        j = i
        while j < text.length
          case text[j]
          when '{' then depth += 1
          when '}'
            depth -= 1
            if depth.zero?
              close = j
              break
            end
          when ':' then head_end ||= j if depth == 1
          end
          j += 1
        end
        break unless close

        head = head_end ? text[(i + 1)...head_end] : ''
        if positive_landed?(head)
          inner = text[((head_end || i) + 1)...close]
          pos, els = split_else(inner)
          return [pos, els, text[(close + 1)..] || '']
        end
        i = close + 1
      end
      nil
    end

    # A head that tests email_landed truthy (not `not email_landed`, `email_landed == false`, etc.).
    def self.positive_landed?(head)
      head.include?('email_landed') && head !~ /\bnot\b/ && head !~ /false/ && head !~ /[<>]/
    end

    # Split a conditional's inner text at its top-level `- else:`; [whole, ""] when there is none.
    def self.split_else(inner)
      depth = 0
      pos = 0
      inner.each_line do |line|
        if depth.zero? && line =~ /^\s*-\s*else\s*:?/
          idx = inner.index(line, pos)
          return [inner[0...idx], inner[(idx + line.length)..] || '']
        end
        depth += line.count('{') - line.count('}')
        pos += line.length
      end
      [inner, '']
    end

    # se_influence called directly in the arm, or in a knot the arm diverts to (bounded).
    def self.calls_influence?(ps, text, seen)
      return true if text =~ /se_influence\s*\(/

      text.scan(/->\s*(\w+)/).flatten.each do |k|
        next if seen.include?(k) || !ps[:knots].key?(k)

        seen << k
        return true if calls_influence?(ps, ps[:knots][k].join("\n"), seen)
      end
      false
    end
  end
end

require_relative 'mail_ink'
