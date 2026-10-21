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
          t['replies'].each { |k, v| issues << err("#{where}.replies.#{k} is empty; the reply would be blank") if blank?(v) }
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
        issues.concat(string_entry(entry, "#{where}.#{factor}", factor == 'attachmentPlausible'))
      end
      issues
    end

    def self.string_entry(entry, where, with_states)
      issues = []
      entry.each do |k, v|
        case k
        when 'pass', 'fail'
          issues << err("#{where}.#{k} is empty; omit the key (or use null) to take the canonical line") if v.nil? ? false : blank?(v)
        when 'redFlag'
          issues << err("#{where}.redFlag is empty; use null for 'deliberately none' or omit it for the canonical line") if !v.nil? && blank?(v)
        else
          if with_states && ATTACHMENT_STATES.include?(k) && v.is_a?(Hash)
            issues.concat(string_entry(v.reject { |sk, _| sk == 'pass' }, "#{where}.#{k}", false))
            issues << err("#{where}.#{k} has a pass line; the states are failures") if v.key?('pass')
          else
            issues << err("#{where} has the key '#{k}'; allowed: pass, fail, redFlag#{with_states ? ", #{ATTACHMENT_STATES.join(', ')}" : ''}")
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
        issues.concat(target_subjects(t, where))
        issues.concat(target_values(ctx, t, prov, people, where))
        issues.concat(target_outcome(ctx, t, where))
        issues.concat(target_sender_auth(t, where))
        issues.concat(target_requires_intel(ctx, t, where))
      end
      issues
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

    def self.target_subjects(t, where)
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
  end
end
