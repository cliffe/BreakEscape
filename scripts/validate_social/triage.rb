# frozen_string_literal: true

# Social lints for the triage area (P3-E, phase 3): 05 N5 for `social.triageSets` and the
# `triage-workstation` objects that launch them.
#
# Covered (05 N5):
#   - set shape: no `mailbox` field, enums, bands, outcome prefix and passPercent, chip overrides
#   - the `stage` launch parameter only with a `{stage}` prefix
#   - `call` and `push` messages only in `awareness` sets (`call` also needs `verifyVerdict`);
#     `analyst` sets never enable Verify
#   - the four `<prefix>` globals declared (and typed) for the stage each workstation launches,
#     skipping any name the mission imports
#   - the non-zero `passPercent` warning on a task keyed on `<prefix>done`
#   - parallel-form balance for `pairedWith` pairs (size, phish count, factor counts, pass-but-bad
#     and fail-but-fine), skipping `playerSent` entries
#   - non-empty authored strings; `perFlagNote` per flag; `whyFine` on real mail; `truth.flags`
#     ids in 00 section 2's factor library or the set's enabled channel tells
#   - `playerSentAuth`: a row per account id and per landing-page domain id, placeholders limited
#     to {account_address} and {domain}; `domainFrom` on `playerSent` entries only
#
# Phase 7 (05 N1 non-email kinds, N10, N11):
#   - each non-email kind's own fields (sms number and text, voicemail transcript, qr destination,
#     page url, call transcript, push app); fields that belong to another kind are ignored (warning)
#   - a non-email message's truth.flags are channel tells only (its chips leave out the seven email
#     factors), its `auth` is ignored, and a set holding one should enable some channel tells
#   - `comparison` (false or { prePrefix?, requireGlobal? }): only on a set that runs as post, a pre
#     prefix it can resolve, pre globals declared or imported, and a declared or imported flag
#
# Returns an array of issue strings starting with "❌" (error, fails --strict-social) or "⚠️"
# (warning), in the style of validate_scenario.rb. Runs only when the scenario has a `social` key.
module ValidateSocial
  module Triage
    # 00 section 2: the seven factors a defender is asked to find. `open` is a gate on the attack
    # side and not a chip.
    FACTORS = %w[senderTrust senderAuth addressedTo pretextRelevant attachmentPlausible
                 urgencyCalibrated linkCredible].freeze
    # 00 section 2 "Channel tells".
    CHANNEL_TELLS = %w[lookalike_domain changed_bank_details unexpected_qr unrequested_mfa_push
                       smish_shortlink_urgency vish_callback_pressure secrecy_or_bypass
                       borrowed_authority reply_to_differs reply_stop_trick padlock_myth
                       enable_content_prompt].freeze
    STAGES = %w[pre post training mission].freeze
    LAUNCH_STAGES = %w[pre post].freeze
    PROFILES = %w[analyst awareness].freeze
    FEEDBACK_MODES = %w[end immediate].freeze
    HEADER_PANELS = %w[collapsed open off].freeze
    GLOSSARIES = %w[closed open off].freeze
    CHIP_STYLES = %w[plain technical character].freeze
    AUTH_VALUES = %w[pass fail none].freeze
    NON_EMAIL_KINDS = %w[sms voicemail qr page call push].freeze
    # The fields each non-email kind reads (triage-kinds.js). Any of them on another kind is ignored.
    KIND_FIELDS = {
      'sms' => %w[earlier], 'voicemail' => %w[duration transcript audio], 'qr' => %w[qr],
      'page' => %w[page], 'call' => %w[callerId transcript], 'push' => %w[push]
    }.freeze
    KINDS = (%w[email playerSent] + NON_EMAIL_KINDS).freeze
    # The four globals a set writes, with the declared type each takes.
    RESULT_GLOBALS = { 'percent' => :number, 'reportRate' => :number, 'done' => :bool, 'pass' => :bool }.freeze
    PLACEHOLDERS = %w[account_address domain].freeze
    LINK_TOKEN_RE = /\{\{link:([^}]*)\}\}/.freeze
    GLOBAL_NAME_RE = /\A[A-Za-z_][A-Za-z0-9_]*\z/.freeze

    # ctx: ValidateSocial::Context (json, repo_root, valid_item_types, imports, ...)
    def self.check(ctx)
      return [] unless ctx.social.is_a?(Hash)

      issues = []
      raw = ctx.social['triageSets']
      issues << err('social.triageSets must be an array') if ctx.social.key?('triageSets') && !raw.is_a?(Array)
      sets = Mail.hash_list(raw)
      issues.concat(workstations(ctx, sets))
      return issues if sets.empty?

      by_id = {}
      sets.each_with_index do |s, i|
        id = s['id']
        if Mail.blank?(id)
          issues << err("social.triageSets[#{i}] has no id")
          next
        end
        issues << err("social.triageSets: id '#{id}' is used more than once") if by_id.key?(id)
        by_id[id] ||= s
      end
      sets.each { |s| issues.concat(set_checks(ctx, s, by_id)) unless Mail.blank?(s['id']) }
      issues.concat(pair_checks(sets, by_id))
      issues.concat(task_keys(ctx, sets))
      issues.concat(unlaunched(ctx, sets))
      issues
    end

    def self.err(msg)
      Mail.err(msg)
    end

    def self.warn_(msg)
      Mail.warn_(msg)
    end

    def self.blank?(v)
      Mail.blank?(v)
    end

    # ---- the set -------------------------------------------------------------

    def self.set_checks(ctx, set, by_id)
      issues = []
      where = "social.triageSets[#{set['id']}]"
      issues << err("#{where} has a 'mailbox' field; a set holds its own messages inline and has no mailbox") if set.key?('mailbox')
      issues.concat(enum_checks(set, where))
      issues << err("#{where}.title is empty") if set.key?('title') && blank?(set['title'])
      issues.concat(outcome_checks(set, where, episode_set: episode_set_ids(ctx).include?(set['id'])))
      universe = flag_universe(set, where, issues)
      issues.concat(chip_checks(set, universe, where))
      issues.concat(band_checks(set, where))
      issues.concat(profile_checks(set, where))
      issues.concat(message_checks(ctx, set, universe, where))
      issues.concat(player_sent_auth_checks(ctx, set, where))
      issues.concat(comparison_checks(ctx, set, where))
      if set.key?('pairedWith')
        pw = set['pairedWith']
        if !pw.is_a?(String) || !by_id.key?(pw)
          issues << err("#{where}.pairedWith '#{pw}' is not a social.triageSets id")
        elsif pw == set['id']
          issues << err("#{where}.pairedWith names the set itself")
        end
      end
      issues
    end

    def self.enum_checks(set, where)
      issues = []
      {
        'stage' => STAGES, 'scoringProfile' => PROFILES, 'feedbackMode' => FEEDBACK_MODES,
        'headerPanel' => HEADER_PANELS, 'glossary' => GLOSSARIES, 'chipStyle' => CHIP_STYLES
      }.each do |key, allowed|
        next unless set.key?(key)

        issues << err("#{where}.#{key} '#{set[key]}' must be one of #{allowed.join(', ')}") unless allowed.include?(set[key])
      end
      issues << err("#{where}.verifyVerdict must be true or false") if set.key?('verifyVerdict') && ![true, false].include?(set['verifyVerdict'])
      issues
    end

    # The profile scoring the set. Absent means awareness (05 "Scoring profiles").
    def self.profile(set)
      set['scoringProfile'] || 'awareness'
    end

    def self.profile_checks(set, where)
      return [] unless profile(set) == 'analyst' && set['verifyVerdict'] == true

      [err("#{where}: an analyst set cannot enable verifyVerdict; the Verify verdict is for awareness sets")]
    end

    # ---- outcome globals -----------------------------------------------------

    # The set ids named by social.awarenessEpisode.defend.setId. An episode's set is launched by
    # the episode runner, not by a triage-workstation, and must have passPercent 0 (awareness.rb).
    def self.episode_set_ids(ctx)
      ep = ctx.social.is_a?(Hash) ? ctx.social['awarenessEpisode'] : nil
      sid = ep.is_a?(Hash) && ep['defend'].is_a?(Hash) ? ep['defend']['setId'] : nil
      sid.is_a?(String) && !sid.empty? ? Set[sid] : Set.new
    end

    def self.outcome_checks(set, where, episode_set: false)
      issues = []
      o = set['outcome']
      unless o.is_a?(Hash)
        return [err("#{where}.outcome is missing; the round would write no result globals")]
      end

      prefix = o['setGlobalPrefix']
      if blank?(prefix)
        issues << err("#{where}.outcome.setGlobalPrefix is empty or missing; the result globals would have no names")
      else
        stripped = prefix.gsub('{stage}', '')
        if stripped =~ /[{}]/
          issues << err("#{where}.outcome.setGlobalPrefix '#{prefix}' holds a brace other than the {stage} token; no other placeholder is filled")
        else
          sample = prefix.gsub('{stage}', 'pre')
          RESULT_GLOBALS.each_key do |suffix|
            issues << err("#{where}.outcome.setGlobalPrefix '#{prefix}' gives '#{sample}#{suffix}', which is not a valid global name") unless "#{sample}#{suffix}".match?(GLOBAL_NAME_RE)
          end
        end
      end
      pp = o['passPercent']
      if !pp.is_a?(Integer) || pp.negative? || pp > 100
        issues << err("#{where}.outcome.passPercent must be a whole number from 0 to 100")
      elsif pp.zero? && !episode_set && %w[training mission].include?(set['stage'])
        issues << warn_("#{where}.outcome.passPercent is 0 on a #{set['stage']} set; every round would count as a pass and 'Try again' would never be offered. " \
                        '0 is for check sets (pre, post)')
      end
      issues
    end

    # The four names a launch writes, or nil when the prefix is unusable.
    def self.result_names(set, stage)
      prefix = set.dig('outcome', 'setGlobalPrefix') if set['outcome'].is_a?(Hash)
      return nil if blank?(prefix)
      return nil if prefix.include?('{stage}') && blank?(stage)

      RESULT_GLOBALS.keys.to_h { |suffix| [suffix, "#{prefix.gsub('{stage}', stage.to_s)}#{suffix}"] }
    end

    # ---- flags, chips, bands ---------------------------------------------------

    def self.flag_universe(set, where, issues)
      tells = set['channelTells']
      issues << err("#{where}.channelTells must be an array of channel tell ids") if set.key?('channelTells') && !tells.is_a?(Array)
      chips = set['flagChips'].is_a?(Hash) ? set['flagChips'] : {}
      enabled = []
      Mail.list(tells).each do |t|
        if !t.is_a?(String) || t.empty?
          issues << err("#{where}.channelTells holds an empty id")
        elsif CHANNEL_TELLS.include?(t) || (!blank?(chips[t]) && !FACTORS.include?(t))
          # a scenario-local tell is allowed when the set gives it a chip label (00 section 2)
          enabled << t
        else
          issues << err("#{where}.channelTells: '#{t}' is not one of 00 section 2's channel tells and flagChips gives it no label")
        end
      end
      FACTORS + enabled
    end

    def self.chip_checks(set, universe, where)
      return [] unless set.key?('flagChips')

      chips = set['flagChips']
      return [err("#{where}.flagChips must be an object keyed by factor or channel tell id")] unless chips.is_a?(Hash)

      issues = []
      chips.each do |k, v|
        issues << err("#{where}.flagChips.#{k} is empty; the chip would show a blank label") if blank?(v)
        issues << err("#{where}.flagChips has the key '#{k}', which is neither 'none', a factor, nor a tell this set enables") unless k == 'none' || universe.include?(k)
      end
      issues
    end

    def self.band_checks(set, where)
      return [] unless set.key?('bands')

      bands = set['bands']
      return [err("#{where}.bands must be an array of { min, headline }")] unless bands.is_a?(Array) && !bands.empty?

      issues = []
      mins = []
      bands.each_with_index do |b, i|
        unless b.is_a?(Hash)
          issues << err("#{where}.bands[#{i}] must be an object")
          next
        end
        issues << err("#{where}.bands[#{i}].headline is empty; the result screen would show a blank headline") if blank?(b['headline'])
        if b['min'].is_a?(Integer) && b['min'].between?(0, 100)
          mins << b['min']
        else
          issues << err("#{where}.bands[#{i}].min must be a whole number from 0 to 100")
        end
      end
      issues << err("#{where}.bands has no band with min 0; a low score would get no headline") unless mins.include?(0) || mins.length < bands.length
      issues << err("#{where}.bands repeats a min value; the headline for that score is ambiguous") if mins.uniq.length != mins.length
      issues
    end

    # ---- messages ------------------------------------------------------------

    def self.kind(m)
      m['kind'] || 'email'
    end

    def self.message_checks(ctx, set, universe, where)
      msgs = set['messages']
      return [err("#{where}.messages is missing or empty; the round has nothing to sort")] unless msgs.is_a?(Array) && !msgs.empty?

      issues = []
      seen = {}
      if msgs.any? { |m| m.is_a?(Hash) && NON_EMAIL_KINDS.include?(kind(m)) } && (universe - FACTORS).empty?
        issues << warn_("#{where} holds non-email messages but enables no channelTells; their chip list would offer only 'Nothing looks wrong'")
      end
      msgs.each_with_index do |m, i|
        unless m.is_a?(Hash)
          issues << err("#{where}.messages[#{i}] must be an object")
          next
        end
        mw = "#{where}.messages[#{m['id'] || i}]"
        if blank?(m['id'])
          issues << err("#{where}.messages[#{i}] has no id")
        elsif seen.key?(m['id'])
          issues << err("#{where}.messages: id '#{m['id']}' is used more than once")
        end
        seen[m['id']] = true
        k = kind(m)
        unless KINDS.include?(k)
          issues << err("#{mw}.kind '#{k}' must be one of #{KINDS.join(', ')}")
          next
        end
        issues.concat(kind_rules(set, m, k, mw))
        issues << err("#{mw} has domainFrom; it belongs to playerSent entries only (authored messages carry literal auth rows)") if k != 'playerSent' && m.key?('domainFrom')
        if k == 'playerSent'
          issues.concat(player_sent_checks(ctx, set, m, universe, mw))
        else
          issues.concat(authored_checks(m, k, universe, mw))
        end
      end
      issues
    end

    def self.kind_rules(set, _m, k, mw)
      issues = []
      aware = profile(set) == 'awareness'
      if k == 'call'
        issues << err("#{mw}: a call message belongs in an awareness set with verifyVerdict: true (analyst sets never enable Verify)") unless aware && set['verifyVerdict'] == true
      elsif k == 'push'
        issues << err("#{mw}: a push message belongs in an awareness set") unless aware
      end
      issues
    end

    def self.authored_checks(m, k, universe, mw)
      issues = []
      email = k == 'email'
      issues << err("#{mw}.from.name is empty") if blank?(m.dig('from', 'name')) && email
      issues << err("#{mw}.from.address is empty") if blank?(m.dig('from', 'address')) && email
      %w[to subject time body].each do |f|
        next unless email

        issues << err("#{mw}.#{f} is empty or missing; the reader would show a blank line") if blank?(m[f])
      end
      issues.concat(link_checks(m, mw)) if email || k == 'sms'
      issues.concat(attachment_checks(m, mw))
      if email
        issues.concat(auth_checks(m, email, mw))
      elsif m.key?('auth')
        issues << warn_("#{mw} is a #{k} message with 'auth'; only email has a header panel, so it is ignored")
      end
      issues.concat(kind_field_checks(m, k, mw))
      issues.concat(truth_checks(m, universe, mw))
      issues
    end

    # ---- non-email kinds (05 N1, N10) ---------------------------------------

    def self.kind_field_checks(m, k, mw)
      issues = []
      own = KIND_FIELDS[k] || []
      KIND_FIELDS.values.flatten.uniq.each do |f|
        next if own.include?(f) || !m.key?(f)

        issues << warn_("#{mw} has '#{f}', which a #{k} message does not read; it is ignored")
      end
      return issues unless NON_EMAIL_KINDS.include?(k)

      factors = Mail.list(m.dig('truth', 'flags')).select { |f| FACTORS.include?(f) }
      factors.each do |f|
        issues << err("#{mw}.truth.flags: '#{f}' is an email factor; a #{k} message offers only the set's channel tells as chips, so it could never be ticked")
      end
      who = !blank?(m.dig('from', 'name')) || !blank?(m.dig('from', 'address')) || (m['from'].is_a?(String) && !m['from'].empty?)
      case k
      when 'sms'
        issues << err("#{mw}.from.address is empty; a text message shows the sender's number") if blank?(m.dig('from', 'address'))
        issues << err("#{mw}.body is empty; the text bubble would be blank") if blank?(m['body'])
        Mail.list(m['earlier']).each_with_index do |e, i|
          issues << err("#{mw}.earlier[#{i}].text is empty") unless e.is_a?(Hash) && !blank?(e['text'])
        end
      when 'voicemail'
        issues << err("#{mw}: a voicemail needs from.name or from.address (the caller)") unless who
        if m.key?('transcript')
          issues.concat(transcript_checks(m['transcript'], "#{mw}.transcript"))
        elsif blank?(m['body'])
          issues << err("#{mw}: a voicemail needs a body or a transcript; the card would show no words")
        end
        issues << err("#{mw}.duration is empty") if m.key?('duration') && blank?(m['duration'])
        if m.key?('audio') && (!m['audio'].is_a?(Hash) || blank?(m['audio']['clipId']))
          issues << err("#{mw}.audio.clipId is empty or missing; name the clip as { clipId: 'VO6' }")
        end
      when 'qr'
        q = m['qr']
        if !q.is_a?(Hash) || blank?(q['destination'])
          issues << err("#{mw}.qr.destination is missing; 'Where does this code go?' would have nothing to show")
        end
        issues << warn_("#{mw}.subject is empty; the notice would be headed 'Notice'") if blank?(m['subject'])
      when 'page'
        pg = m['page']
        if !pg.is_a?(Hash) || blank?(pg['url'])
          issues << err("#{mw}.page.url is missing; the address bar would be blank")
        else
          issues << err("#{mw}.page.padlock must be true or false") if pg.key?('padlock') && ![true, false].include?(pg['padlock'])
          issues << err("#{mw}.page.fields must be an array of non-empty labels") if pg.key?('fields') && !(pg['fields'].is_a?(Array) && pg['fields'].all? { |f| !blank?(f) })
          issues.concat(certificate_checks(pg['certificate'], "#{mw}.page.certificate")) if pg.key?('certificate')
        end
      when 'call'
        issues.concat(transcript_checks(m['transcript'], "#{mw}.transcript", required: true))
        issues << warn_("#{mw} has no callerId or from; the card would say 'Unknown caller'") if blank?(m['callerId']) && !who
      when 'push'
        pu = m['push']
        issues << err("#{mw}.push.app is missing; the prompt would not say which app is asking") if !pu.is_a?(Hash) || blank?(pu['app'])
        issues << warn_("#{mw}.time is empty; the prompt's time is often the tell (an odd hour)") if blank?(m['time'])
      end
      issues
    end

    # "issued to" is a host name: dotted labels of letters, digits and hyphens, with an optional
    # leading wildcard label. No scheme, path, port, space or underscore.
    HOSTNAME_RE = /\A(\*\.)?[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+\z/i.freeze

    def self.certificate_checks(cert, where)
      return [err("#{where} must be an object { issuedTo, issuer?, note? }")] unless cert.is_a?(Hash)

      issued = cert['issuedTo']
      if blank?(issued)
        [err("#{where}.issuedTo is missing; the certificate check would show no host")]
      elsif !issued.is_a?(String) || !issued.match?(HOSTNAME_RE)
        [err("#{where}.issuedTo '#{issued}' does not look like a host name (for example 'sso.example.com'); give the host alone, with no scheme, path or port")]
      else
        []
      end
    end

    def self.transcript_checks(lines, where, required: false)
      unless lines.is_a?(Array) && !lines.empty?
        return required || !lines.nil? ? [err("#{where} must be a non-empty array of { who, text }")] : []
      end

      lines.each_with_index.filter_map do |l, i|
        err("#{where}[#{i}] needs a non-empty text") unless l.is_a?(Hash) && !blank?(l['text'])
      end
    end

    # ---- the pre/post comparison (05 N11) -------------------------------------

    # Whether the set runs at the post stage: its own stage, or a workstation launching it as post.
    def self.runs_as_post?(ctx, set)
      stages = []
      Mail.each_object(ctx.json) do |obj, _|
        md = obj['minigameData']
        next unless obj['type'] == 'triage-workstation' && md.is_a?(Hash) && md['triageSetId'] == set['id']

        stages << (md['stage'] || set['stage'])
      end
      # A check mission's kiosk launches the set at awarenessEpisode.defend.stage (the set itself
      # may omit `stage`).
      ep = ctx.social.is_a?(Hash) ? ctx.social['awarenessEpisode'] : nil
      defend = ep.is_a?(Hash) ? ep['defend'] : nil
      stages << defend['stage'] if defend.is_a?(Hash) && defend['setId'] == set['id'] && defend['stage'].is_a?(String)
      stages << set['stage'] if stages.empty?
      stages.include?('post')
    end

    def self.comparison_checks(ctx, set, where)
      return [] unless set.key?('comparison') || runs_as_post?(ctx, set)

      c = set['comparison']
      return [] if c == false
      return [err("#{where}.comparison must be false or an object { prePrefix?, requireGlobal? }")] if set.key?('comparison') && !c.is_a?(Hash)

      c ||= {}
      issues = []
      post = runs_as_post?(ctx, set)
      issues << warn_("#{where}.comparison is set but the set never runs as post; the panel only shows after a post round") if set.key?('comparison') && !post
      prefix = set.dig('outcome', 'setGlobalPrefix') if set['outcome'].is_a?(Hash)
      pre = c['prePrefix']
      if c.key?('prePrefix')
        if blank?(pre) || !pre.is_a?(String) || pre =~ /[{}]/ || !"#{pre}done".match?(GLOBAL_NAME_RE)
          issues << err("#{where}.comparison.prePrefix '#{pre}' must be a literal global-name prefix (no braces)")
          pre = nil
        end
      elsif prefix.is_a?(String) && prefix.include?('{stage}')
        pre = prefix.gsub('{stage}', 'pre')
      else
        issues << warn_("#{where} runs as post but its setGlobalPrefix has no {stage} token and comparison has no prePrefix; no comparison would show (set comparison.prePrefix, or comparison: false)") if post
        pre = nil
      end
      if pre && post
        %w[done percent reportRate].each do |suffix|
          name = "#{pre}#{suffix}"
          next if ctx.own_globals.key?(name) || ctx.import_names.include?(name)

          issues << warn_("#{where}: the comparison reads '#{name}', which is neither declared nor imported; the post round would always say 'No baseline'")
        end
      end
      if c.key?('requireGlobal')
        g = c['requireGlobal']
        if blank?(g) || !g.is_a?(String) || !g.match?(GLOBAL_NAME_RE)
          issues << err("#{where}.comparison.requireGlobal must be a global name")
        elsif !ctx.own_globals.key?(g) && !ctx.import_names.include?(g)
          issues << err("#{where}.comparison.requireGlobal '#{g}' is neither declared nor imported; the comparison could never show")
        end
      end
      issues
    end

    def self.link_checks(m, mw)
      issues = []
      links = m['links']
      issues << err("#{mw}.links must be an array") if m.key?('links') && !links.is_a?(Array)
      ids = {}
      Mail.hash_list(links).each_with_index do |l, i|
        if blank?(l['id'])
          issues << err("#{mw}.links[#{i}] has no id")
        elsif ids.key?(l['id'])
          issues << err("#{mw}.links: id '#{l['id']}' is used more than once")
        end
        ids[l['id']] = true
        issues << err("#{mw}.links[#{i}].text is empty; the link would show nothing to hover") if blank?(l['text'])
        issues << err("#{mw}.links[#{i}].destination is empty; the status bar would show nothing") if blank?(l['destination'])
      end
      used = m['body'].is_a?(String) ? m['body'].scan(LINK_TOKEN_RE).flatten : []
      used.each do |t|
        issues << err("#{mw}.body uses {{link:#{t}}}, which is not in links[]") unless ids.key?(t)
      end
      ids.each_key do |id|
        issues << warn_("#{mw}.links: '#{id}' is not used by a {{link:#{id}}} token in the body") unless used.include?(id)
      end
      issues
    end

    def self.attachment_checks(m, mw)
      issues = []
      Mail.hash_list(m['attachments']).each_with_index do |a, i|
        issues << err("#{mw}.attachments[#{i}].label is empty; the chip would be blank") if blank?(a['label'])
      end
      issues
    end

    def self.auth_checks(m, email, mw)
      a = m['auth']
      unless a.is_a?(Hash)
        return email ? [err("#{mw}.auth is missing; the header panel would show nothing")] : []
      end

      issues = []
      %w[spf dkim dmarc].each do |f|
        issues << err("#{mw}.auth.#{f} '#{a[f]}' must be one of #{AUTH_VALUES.join(', ')}") unless AUTH_VALUES.include?(a[f])
      end
      %w[envelopeFrom replyTo].each do |f|
        issues << err("#{mw}.auth.#{f} is empty") if a.key?(f) && blank?(a[f])
      end
      issues
    end

    def self.truth_checks(m, universe, mw)
      t = m['truth']
      return [err("#{mw}.truth is missing; the round could not score this message")] unless t.is_a?(Hash)

      issues = []
      unless [true, false].include?(t['isPhish'])
        issues << err("#{mw}.truth.isPhish must be true or false")
        return issues
      end
      flags = t['flags']
      flag_list = flags.is_a?(Array) ? flags : []
      issues << err("#{mw}.truth.flags must be an array of factor ids") unless flags.is_a?(Array)
      flag_list.each do |f|
        issues << err("#{mw}.truth.flags: '#{f}' is not in 00 section 2's factor library or this set's enabled channel tells") unless universe.include?(f)
      end
      issues << err("#{mw}.truth.flags lists the same id twice") if flag_list.uniq.length != flag_list.length

      # flagAlternatives: groups of flags that name one tell two ways (05 "Either tick counts").
      # Each group is scored as one unit: credited if any member is ticked, reported missed once
      # under its first authored member's note. At least one member must be an authored flag; a
      # member that is not in truth.flags is another name for the same tell (ticking it credits the
      # unit and is never "Not a flag here", P3 N-3), so it must be a tick the set offers. A flag
      # may sit in only one group.
      if t.key?('flagAlternatives')
        alts = t['flagAlternatives']
        if !alts.is_a?(Array) || alts.any? { |g| !g.is_a?(Array) }
          issues << err("#{mw}.truth.flagAlternatives must be an array of groups, each an array of flag ids")
        else
          issues << err("#{mw}.truth.flagAlternatives is set on real mail, which has no flags to group") unless t['isPhish']
          seen_alt = {}
          alts.each_with_index do |g, gi|
            issues << err("#{mw}.truth.flagAlternatives[#{gi}] needs at least two flag ids (a group names one tell two flags can describe)") if g.length < 2
            issues << err("#{mw}.truth.flagAlternatives[#{gi}] lists the same id twice") if g.uniq.length != g.length
            unless g.any? { |f| flag_list.include?(f) }
              issues << err("#{mw}.truth.flagAlternatives[#{gi}] names no flag in truth.flags, so it is never scored; at least one member must be an authored flag")
            end
            g.each do |f|
              unless flag_list.include?(f) || universe.include?(f)
                issues << err("#{mw}.truth.flagAlternatives[#{gi}]: '#{f}' is neither in truth.flags nor a tick this set offers (00 section 2's factors or its enabled channel tells)")
              end
              issues << err("#{mw}.truth.flagAlternatives: '#{f}' appears in more than one group") if seen_alt.key?(f)
              seen_alt[f] = true
            end
          end
        end
      end

      %w[headerNote ifTrusted reportReply].each do |f|
        issues << err("#{mw}.truth.#{f} is empty; the review card would show a blank line") if t.key?(f) && blank?(t[f])
      end
      if t['isPhish']
        issues.concat(phish_truth(t, flag_list, m, mw))
      else
        issues.concat(real_truth(t, flag_list, mw))
      end
      issues
    end

    def self.phish_truth(t, flag_list, m, mw)
      issues = []
      issues << err("#{mw}: a phish needs at least one truth.flags id (the reasons score divides by it)") if flag_list.empty?
      notes = t['perFlagNote']
      if !notes.is_a?(Hash)
        issues << err("#{mw}.truth.perFlagNote is missing; each flag needs a one-line note") unless flag_list.empty?
        notes = {}
      end
      flag_list.each do |f|
        issues << err("#{mw}.truth.perFlagNote.#{f} is missing or empty; the review card would list the flag with no explanation") if blank?(notes[f])
      end
      notes.each_key do |f|
        issues << warn_("#{mw}.truth.perFlagNote.#{f} has no matching truth.flags entry; the note is never shown") unless flag_list.include?(f)
      end
      a = m['auth']
      if flag_list.include?('senderAuth') && a.is_a?(Hash) && %w[spf dkim dmarc].all? { |f| a[f] == 'pass' }
        issues << warn_("#{mw}: truth.flags names senderAuth but the header panel shows SPF, DKIM and DMARC all passing; " \
                        'the flag could not be found from the panel (a pass is not a trust verdict)')
      end
      issues
    end

    def self.real_truth(t, flag_list, mw)
      issues = []
      issues << err("#{mw}: real mail must have no truth.flags (it has #{flag_list.join(', ')})") unless flag_list.empty?
      w = t['whyFine']
      if !w.is_a?(Hash) || w.empty?
        issues << err("#{mw}.truth.whyFine is missing or empty; a real message needs a reason it was fine")
      else
        w.each { |k, v| issues << err("#{mw}.truth.whyFine.#{k} is empty") if blank?(v) }
        issues << warn_("#{mw}.truth.whyFine has no 'default' line; a false flag with no specific reason would have nothing to show") unless w.key?('default')
      end
      issues
    end

    # ---- playerSent ------------------------------------------------------------

    def self.player_sent_checks(ctx, set, m, universe, mw)
      issues = []
      tid = m['targetId']
      if blank?(tid)
        issues << err("#{mw}.targetId is missing; a playerSent entry names the phishTarget whose message it replays")
      elsif Mail.targets(ctx).none? { |t| t['id'] == tid }
        issues << err("#{mw}.targetId '#{tid}' is not a social.phishTargets id")
      end
      if m.key?('domainFrom') && m['domainFrom'] != 'landing_domain'
        issues << err("#{mw}.domainFrom '#{m['domainFrom']}' must be \"landing_domain\"")
      end
      %w[from to subject body auth truth].each do |f|
        issues << warn_("#{mw} has '#{f}'; a playerSent entry is built from the stored sent record and this is ignored") if m.key?(f)
      end
      notes = m['notes']
      if !notes.is_a?(Hash)
        issues << err("#{mw}.notes is missing; the replay needs authored perFlagNote, headerNote, ifTrusted and reportReply")
        return issues
      end
      pf = notes['perFlagNote']
      if !pf.is_a?(Hash) || pf.empty?
        issues << err("#{mw}.notes.perFlagNote is missing or empty; a tell with no note would list with no explanation")
      else
        pf.each do |f, v|
          issues << err("#{mw}.notes.perFlagNote.#{f} is empty") if blank?(v)
          issues << err("#{mw}.notes.perFlagNote has the key '#{f}', which is not in the factor library or this set's channel tells") unless universe.include?(f)
        end
      end
      %w[headerNote ifTrusted reportReply].each do |f|
        issues << err("#{mw}.notes.#{f} is empty") if notes.key?(f) && blank?(notes[f])
      end
      issues << err("#{mw}: a playerSent entry has no set-level playerSentAuth to take its header results from") unless set['playerSentAuth'].is_a?(Hash)
      issues
    end

    def self.player_sent_auth_checks(ctx, set, where)
      msgs = Mail.hash_list(set['messages'])
      sent = msgs.select { |m| kind(m) == 'playerSent' }
      table = set['playerSentAuth']
      return [] if sent.empty? && table.nil?

      issues = []
      unless table.is_a?(Hash)
        issues << err("#{where}.playerSentAuth must be an object with accounts and domains tables") unless sent.empty?
        return issues
      end
      issues.concat(auth_table(table['accounts'], Mail.account_ids(ctx), 'account', "#{where}.playerSentAuth.accounts", true))
      uses_domain = sent.any? { |m| m['domainFrom'] == 'landing_domain' }
      menu = domain_menu_ids(ctx)
      if menu
        issues.concat(auth_table(table['domains'], menu, 'landing-page domain', "#{where}.playerSentAuth.domains", true))
      elsif uses_domain
        issues.concat(auth_table(table['domains'], Set.new, 'landing-page domain', "#{where}.playerSentAuth.domains", false))
        issues << err("#{where}.playerSentAuth.domains has no rows, but a playerSent entry uses domainFrom") if !table['domains'].is_a?(Hash) || table['domains'].empty?
      elsif table.key?('domains')
        issues.concat(auth_table(table['domains'], Set.new, 'landing-page domain', "#{where}.playerSentAuth.domains", false))
      end
      issues
    end

    # The landing-page domain menu ids (07), when the scenario carries a menu this lint can read:
    # `social.landingPages[*].domainMenu` (or `domains`/`menu`) as a list of { id }. nil when the
    # scenario has none, in which case only the rows that exist are checked.
    def self.domain_menu_ids(ctx)
      ids = Set.new
      Mail.hash_list(ctx.social['landingPages']).each do |p|
        %w[domainMenu domains menu].each do |k|
          Mail.hash_list(p[k]).each { |o| ids << o['id'] if o['id'].is_a?(String) }
        end
      end
      ids.empty? ? nil : ids
    end

    # One table of auth rows keyed by id. `expected` ids each need a row when `require_all`.
    def self.auth_table(rows, expected, label, where, require_all)
      unless rows.is_a?(Hash)
        return require_all && !expected.empty? ? [err("#{where} is missing; it needs a row for every #{label} id")] : []
      end

      issues = []
      if require_all
        expected.each { |id| issues << err("#{where} has no row for #{label} '#{id}'; a replay from it would show an empty header panel") unless rows.key?(id) }
        rows.each_key { |id| issues << warn_("#{where}.#{id} is not a known #{label} id; the row is never used") unless expected.include?(id) } unless expected.empty?
      end
      rows.each do |id, row|
        rw = "#{where}.#{id}"
        unless row.is_a?(Hash)
          issues << err("#{rw} must be an object")
          next
        end
        %w[spf dkim dmarc].each do |f|
          issues << err("#{rw}.#{f} '#{row[f]}' must be one of #{AUTH_VALUES.join(', ')} (authored literals only)") unless AUTH_VALUES.include?(row[f])
        end
        %w[envelopeFrom replyTo].each do |f|
          if blank?(row[f])
            issues << err("#{rw}.#{f} is empty or missing")
          else
            issues.concat(placeholder_checks(row[f], "#{rw}.#{f}"))
          end
        end
        issues << warn_("#{rw}: {domain} in an account row cannot be filled (an account row has no picked domain)") if label == 'account' && row.values.any? { |v| v.is_a?(String) && v.include?('{domain}') }
      end
      issues
    end

    # Exactly {account_address} and {domain} are substituted; any other brace is unresolved.
    def self.placeholder_checks(str, where)
      issues = []
      str.scan(/\{([^{}]*)\}/).flatten.each do |name|
        issues << err("#{where} uses {#{name}}; only {account_address} and {domain} are filled") unless PLACEHOLDERS.include?(name)
      end
      issues << err("#{where} has an unmatched brace; the placeholder would be left unresolved") if str.gsub(/\{[^{}]*\}/, '') =~ /[{}]/
      issues
    end

    # ---- parallel forms ------------------------------------------------------

    def self.pair_checks(sets, by_id)
      issues = []
      done = Set.new
      sets.each do |a|
        b = by_id[a['pairedWith']]
        next unless a['id'].is_a?(String) && b && !b.equal?(a)

        key = [a['id'], b['id']].sort
        next if done.include?(key)

        done << key
        where = "social.triageSets[#{a['id']}] and [#{b['id']}]"
        issues << warn_("#{where}: pairedWith is not mutual; set pairedWith on both") unless b['pairedWith'] == a['id']
        issues << warn_("#{where}: a pair should run as one pre and one post, got #{a['stage'].inspect} and #{b['stage'].inspect}") unless Set[a['stage'], b['stage']] == Set.new(%w[pre post])
        issues.concat(balance(a, b, where))
      end
      issues
    end

    def self.authored(set)
      Mail.hash_list(set['messages']).reject { |m| kind(m) == 'playerSent' }
    end

    def self.phish?(m)
      m.dig('truth', 'isPhish') == true
    end

    def self.factor_counts(msgs)
      counts = Hash.new(0)
      msgs.select { |m| phish?(m) }.each do |m|
        Mail.list(m.dig('truth', 'flags')).each { |f| counts[f] += 1 if f.is_a?(String) }
      end
      counts
    end

    def self.all_pass?(m)
      a = m['auth']
      a.is_a?(Hash) && %w[spf dkim dmarc].all? { |f| a[f] == 'pass' }
    end

    def self.any_fail?(m)
      a = m['auth']
      a.is_a?(Hash) && %w[spf dkim dmarc].any? { |f| a[f] == 'fail' }
    end

    def self.balance(a, b, where)
      issues = []
      [a, b].each do |s|
        if Mail.hash_list(s['messages']).any? { |m| kind(m) == 'playerSent' }
          issues << err("social.triageSets[#{s['id']}] holds playerSent entries, so it cannot be one half of a pairedWith pair (parallel-form checks skip them)")
        end
      end
      return issues unless issues.empty? # the pair is already refused; the counts would only repeat it

      ma = authored(a)
      mb = authored(b)
      issues << err("#{where}: sizes differ (#{ma.length} and #{mb.length} messages); parallel forms must match") if ma.length != mb.length
      pa = ma.count { |m| phish?(m) }
      pb = mb.count { |m| phish?(m) }
      issues << err("#{where}: phish counts differ (#{pa} and #{pb}); parallel forms must match") if pa != pb
      ca = factor_counts(ma)
      cb = factor_counts(mb)
      (ca.keys | cb.keys).sort.each do |f|
        issues << err("#{where}: factor '#{f}' appears #{ca[f]} time(s) in '#{a['id']}' and #{cb[f]} in '#{b['id']}'; parallel forms must match per factor") if ca[f] != cb[f]
      end
      [a, b].zip([ma, mb]).each do |s, msgs|
        issues << err("social.triageSets[#{s['id']}] has no pass-but-bad message (a phish whose SPF, DKIM and DMARC all pass); a pair needs one to teach that a pass is not a verdict") unless msgs.any? { |m| phish?(m) && all_pass?(m) }
        issues << err("social.triageSets[#{s['id']}] has no fail-but-fine message (real mail with a failed check); a pair needs one to teach that a fail is a clue, not proof") unless msgs.any? { |m| !phish?(m) && any_fail?(m) }
      end
      sig = ->(m) { [m.dig('from', 'address').to_s.downcase, m['subject'].to_s.strip.downcase] }
      shared = ma.map(&sig) & mb.map(&sig)
      shared.each do |addr, subj|
        issues << err("#{where}: both forms hold the same message (#{addr}, \"#{subj}\"); the same content in both would measure recall, not skill")
      end
      issues
    end

    # ---- the workstation objects ---------------------------------------------

    def self.workstations(ctx, sets)
      by_id = sets.to_h { |s| [s['id'], s] }
      issues = []
      Mail.each_object(ctx.json) do |obj, path|
        next unless obj['type'] == 'triage-workstation'

        md = obj['minigameData'].is_a?(Hash) ? obj['minigameData'] : {}
        sid = md['triageSetId']
        if blank?(sid)
          issues << err("#{path} (triage-workstation) has no minigameData.triageSetId; it would open no round")
          next
        end
        set = by_id[sid]
        unless set
          issues << err("#{path}: minigameData.triageSetId '#{sid}' is not a social.triageSets id")
          next
        end
        issues.concat(launch_checks(ctx, set, md, path))
      end
      issues
    end

    def self.launch_checks(ctx, set, md, path)
      issues = []
      prefix = set.dig('outcome', 'setGlobalPrefix') if set['outcome'].is_a?(Hash)
      has_token = prefix.is_a?(String) && prefix.include?('{stage}')
      if md.key?('stage')
        if !LAUNCH_STAGES.include?(md['stage'])
          issues << err("#{path}: minigameData.stage '#{md['stage']}' must be pre or post")
        elsif !has_token
          issues << err("#{path}: minigameData.stage is set but set '#{set['id']}' has setGlobalPrefix '#{prefix}' with no {stage} token; the stage would change nothing")
        end
      end
      stage = md['stage'] || set['stage']
      if has_token && !STAGES.include?(stage)
        issues << err("#{path}: set '#{set['id']}' has a {stage} prefix but no usable stage (set it on the set or as minigameData.stage)")
      end
      names = result_names(set, STAGES.include?(stage) ? stage : nil)
      issues.concat(result_global_checks(ctx, names, set, path)) if names
      issues.concat(conclusion_task_checks(ctx, md, path))
      issues
    end

    def self.result_global_checks(ctx, names, set, path)
      issues = []
      names.each do |suffix, name|
        next unless name.match?(GLOBAL_NAME_RE)
        next if ctx.import_names.include?(name) # an import is the mission's own declaration

        unless ctx.own_globals.key?(name)
          issues << err("global '#{name}' (#{suffix} of set '#{set['id']}', launched by #{path}) is not declared in globalVariables; an undeclared name is silently not synced to ink")
          next
        end
        v = ctx.own_globals[name]
        ok = RESULT_GLOBALS[suffix] == :bool ? [true, false].include?(v) : v.is_a?(Numeric)
        issues << err("global '#{name}' (set '#{set['id']}') must be declared as a #{RESULT_GLOBALS[suffix] == :bool ? 'boolean' : 'number'}, not #{v.inspect}") unless ok
      end
      issues
    end

    # `conclusionTaskId`: the task the host NPC's mapping completes (00 section 11 "Reopen re-emits").
    def self.conclusion_task_checks(ctx, md, path)
      return [] unless md.key?('conclusionTaskId')

      tid = md['conclusionTaskId']
      return [err("#{path}: minigameData.conclusionTaskId is empty")] if blank?(tid)

      issues = []
      issues << err("#{path}: conclusionTaskId '#{tid}' is not a task id in the scenario's objectives") unless task_ids(ctx.json).include?(tid)
      unless ValidateSocial.npc_records(ctx.json).any? { |n| Mail.hash_list(n['eventMappings']).any? { |e| e['completeTask'] == tid } }
        issues << err("#{path}: no NPC eventMapping completes '#{tid}'; a reopen would re-emit the done events and nothing would complete the task")
      end
      issues
    end

    def self.task_ids(json)
      ids = Set.new
      Mail.hash_list(json['objectives']).each do |aim|
        Mail.hash_list(aim['tasks']).each { |t| ids << t['taskId'] if t['taskId'].is_a?(String) }
      end
      ids
    end

    # A task keyed on `<prefix>done` while the set has a non-zero passPercent completes on a failed
    # round too (05 N6); key it on `<prefix>pass`. Check sets (passPercent 0) are exempt.
    def self.task_keys(ctx, sets)
      by_name = {}
      sets.each do |s|
        pp = s.dig('outcome', 'passPercent') if s['outcome'].is_a?(Hash)
        next unless pp.is_a?(Integer) && pp.positive?

        stages = s['outcome']['setGlobalPrefix'].to_s.include?('{stage}') ? LAUNCH_STAGES + %w[training mission] : [nil]
        stages.each do |st|
          n = result_names(s, st)
          by_name[n['done']] = s['id'] if n
        end
      end
      return [] if by_name.empty?

      issues = []
      ValidateSocial.npc_records(ctx.json).each do |npc|
        Mail.hash_list(npc['eventMappings']).each do |e|
          m = e['eventPattern'].to_s.match(/\Aglobal_variable_changed:(.+)\z/)
          next unless m && by_name.key?(m[1]) && (e['completeTask'] || e['unlockTask'])

          issues << warn_("eventMapping on '#{m[1]}' (#{npc['id']}) completes a task on the round being done, but set '#{by_name[m[1]]}' has a non-zero passPercent; " \
                          "a failed round would complete it. Key it on the matching 'pass' global")
        end
      end
      Mail.hash_list(ctx.json['objectives']).each do |aim|
        g = aim.dig('unlockCondition', 'globalVariable') if aim['unlockCondition'].is_a?(Hash)
        issues << warn_("aim '#{aim['aimId']}' unlocks on '#{g}', the round-done global of set '#{by_name[g]}' which has a non-zero passPercent; key it on the matching 'pass' global") if g && by_name.key?(g)
      end
      issues
    end

    def self.unlaunched(ctx, sets)
      launched = Set.new
      Mail.each_object(ctx.json) do |obj, _|
        md = obj['minigameData']
        launched << md['triageSetId'] if obj['type'] == 'triage-workstation' && md.is_a?(Hash)
      end
      launched.merge(episode_set_ids(ctx))
      sets.filter_map do |s|
        next if launched.include?(s['id'])
        next if s['pairedWith'] && launched.include?(s['pairedWith'])

        warn_("social.triageSets[#{s['id']}] is not launched by any triage-workstation object; nothing in this scenario opens it")
      end
    end
  end
end
