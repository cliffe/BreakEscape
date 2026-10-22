# frozen_string_literal: true

# Social lints for the awareness episodes (Phase 7, P7-D): the shell around an episode, per
# 11_awareness_product_episodes.md S5.1 and S5.2 (N16 validator half, N3 and N9 lints) and
# PHASE7_PACKETS.md S2.1. The block is `social.awarenessEpisode`; its shape is the
# `socialAwarenessEpisode` definition in scenario-schema.json. The kiosk's `{ episodeId }` is in
# minigame-data-schemas.json.
#
# Three kinds of shell share the block:
#   full       stages brief, osint, write, flip, defend, debrief
#   defendOnly stages brief, defend, debrief; the id ends in `_defend`; the attack block is not read
#   check      stages ["check"] and defend.stage "pre" or "post" (the spot-the-phish pair, S5.2)
#
# The triage set's own rules (message shapes, tells, scoring) stay in triage.rb. This file lints
# what binds the set to the episode: ids, counts, the done global, the host NPC and the carry-over.
module ValidateSocial
  module Awareness
    STAGES = %w[brief osint build write flip defend debrief check mfa].freeze
    STAGES_BY_VARIANT = {
      'full' => %w[brief osint write flip defend debrief],
      'defendOnly' => %w[brief defend debrief]
    }.freeze
    # Wave 3 (E3): the push-stream beat, an unscored attack demonstration. It sits straight after
    # `write` or straight after `flip`, never in a defendOnly or check shell.
    MFA_AFTER = %w[write flip].freeze
    # E5: the landing-page builder, straight after `osint` and before `write`. It needs
    # attack.landingPageId and is never in a defendOnly or check shell.
    BUILD_AFTER = 'osint'
    CHECK_STAGES = %w[pre post].freeze
    EPISODE_MESSAGES = (5..8)
    CHECK_MESSAGES = 10
    REPLY_DELAY = (5..8)
    PRE_NAMES = %w[triage_pre_percent triage_pre_reportRate triage_pre_done].freeze
    PRE_COMPLETED = 'pre_check_completed'

    def self.check(ctx)
      return [] unless ctx.social.is_a?(Hash)

      ep = ctx.social['awarenessEpisode']
      kiosks = kiosk_objects(ctx)
      return orphan_kiosk(kiosks) if ep.nil?
      return [err('social.awarenessEpisode must be an object')] unless ep.is_a?(Hash)

      issues = []
      id = ep['id']
      if Mail.blank?(id)
        return [err('social.awarenessEpisode.id is empty or missing; the kiosk, the state global and the done global are all named from it')]
      end

      issues.concat(kiosk_checks(kiosks, id))
      issues.concat(stage_checks(ep))
      issues.concat(id_suffix_checks(ep))
      issues.concat(attack_checks(ctx, ep)) if full?(ep)
      issues.concat(string_checks(ep))
      issues.concat(mfa_checks(ep))
      set = defend_set(ctx, ep, issues)
      done = nil
      if set
        issues.concat(set_checks(ep, set))
        issues.concat(call_checks(ctx, ep, set))
        done = done_global(ep, set)
        issues.concat(result_global_checks(ctx, ep, set))
        issues.concat(player_sent_auth_checks(ctx, ep, set)) if full?(ep)
      end
      issues.concat(conclusion_checks(ctx, ep, done)) if done
      issues.concat(state_global_checks(ctx, id))
      issues.concat(check_mission_checks(ctx, ep, set)) if check_mission?(ep) && set
      issues.concat(carry_over_checks(ctx, ep, set)) if check_mission?(ep) && set
      issues
    end

    # ---- helpers ---------------------------------------------------------------

    def self.err(msg)
      Mail.err("awarenessEpisode: #{msg}")
    end

    def self.warn_(msg)
      Mail.warn_("awarenessEpisode: #{msg}")
    end

    def self.check_mission?(ep)
      defend = ep['defend']
      (defend.is_a?(Hash) && CHECK_STAGES.include?(defend['stage'])) || ep['stages'] == ['check']
    end

    def self.full?(ep)
      ep['variant'] == 'full' && !check_mission?(ep)
    end

    def self.kiosk_objects(ctx)
      list = []
      Mail.each_object(ctx.json) { |obj, path| list << [obj, path] if obj['type'] == 'kiosk' }
      list
    end

    def self.orphan_kiosk(kiosks)
      kiosks.map do |_, path|
        err("'#{path}' is a kiosk but social.awarenessEpisode is missing; the episode runner would find no episode to start")
      end
    end

    # ---- the kiosk -------------------------------------------------------------

    def self.kiosk_checks(kiosks, id)
      return [err("no kiosk object; the learner has nothing to open the episode '#{id}' with")] if kiosks.empty?

      issues = []
      if kiosks.length > 1
        issues << err("#{kiosks.length} kiosk objects (#{kiosks.map { |_, p| p }.join(', ')}); a shell has exactly one, " \
                      'so a second one could start a second runner on the same state')
      end
      kiosks.each do |obj, path|
        md = obj['minigameData']
        eid = md.is_a?(Hash) ? md['episodeId'] : nil
        if eid != id
          issues << err("'#{path}' kiosk minigameData.episodeId is #{eid.inspect} but social.awarenessEpisode.id is '#{id}'; " \
                        'the runner shows an alert and does not start when the two differ')
        end
      end
      issues
    end

    # ---- stages and ids ----------------------------------------------------------

    def self.stage_checks(ep)
      stages = ep['stages']
      unless stages.is_a?(Array) && !stages.empty?
        return [err('stages is missing or empty')]
      end

      issues = []
      stages.each do |s|
        issues << err("stages lists '#{s}', which is not one of #{STAGES.join(', ')}") unless STAGES.include?(s)
      end
      if check_mission?(ep)
        issues << err("a check mission (defend.stage pre or post) has stages #{stages.inspect}; it must be [\"check\"]") unless stages == ['check']
        stage = ep.dig('defend', 'stage')
        issues << err("stages is [\"check\"] but defend.stage is #{stage.inspect}; a check names its stage, pre or post") unless CHECK_STAGES.include?(stage)
      elsif STAGES_BY_VARIANT.key?(ep['variant'])
        want = STAGES_BY_VARIANT[ep['variant']]
        unless stage_orders(ep['variant'], want).include?(stages)
          extra = ep['variant'] == 'full' ? " (or the same with 'build' straight after 'osint', and/or 'mfa' straight after 'write' or straight after 'flip')" : ''
          issues << err("variant '#{ep['variant']}' has stages #{stages.inspect}; it must be #{want.inspect}#{extra}")
        end
      elsif !ep.key?('variant')
        issues << err("variant is missing; it is full or defendOnly (only a check mission, stages [\"check\"], may leave it out)")
      else
        issues << err("variant '#{ep['variant']}' must be full or defendOnly")
      end
      issues
    end

    # The stage lists a variant may author: its own order, and for a full episode that order with
    # `build` inserted after `osint` and/or `mfa` inserted after `write` or after `flip`.
    def self.stage_orders(variant, want)
      return [want] unless variant == 'full'

      bases = [want, want.dup.insert(want.index(BUILD_AFTER) + 1, 'build')]
      bases.flat_map do |base|
        [base] + MFA_AFTER.map do |after|
          i = base.index(after)
          base[0..i] + ['mfa'] + base[(i + 1)..]
        end
      end
    end

    def self.id_suffix_checks(ep)
      id = ep['id']
      if ep['variant'] == 'defendOnly' && !id.end_with?('_defend')
        [err("a defendOnly episode's id '#{id}' must end in '_defend' (the full episode's id plus the suffix), so the two never share state")]
      elsif ep['variant'] == 'full' && id.end_with?('_defend') && !check_mission?(ep)
        [err("the full episode's id '#{id}' ends in '_defend', which is the defendOnly suffix")]
      else
        []
      end
    end

    # ---- the attack block (full episodes) ----------------------------------------

    def self.attack_checks(ctx, ep)
      atk = ep['attack']
      return [err('a full episode needs an attack block (target, siteIds, accountIds)')] unless atk.is_a?(Hash)

      issues = []
      # A call attack (E3) places a pretext call, not a mail send: no mail account, no send cap.
      by_call = atk.key?('callId')
      unless by_call
        issues << err("attack.maxMessages is #{atk['maxMessages'].inspect}; it must be 1 (one send, then the flip)") unless atk['maxMessages'] == 1
      end
      # Unscored always: the attack beat is a demonstration or a checklist (E7's cloned-voice script
      # is modelled as an unscored mail write). Nothing here reads a mail score, so an unscored
      # attack needs no relaxation.
      issues << err("attack.scored is #{atk['scored'].inspect}; it must be false (the write stage is never scored)") unless atk['scored'] == false
      issues.concat(call_and_page_checks(ctx, ep, atk))

      target = atk['target']
      targets = Mail.hash_list(ctx.social['phishTargets'])
      found = targets.find { |t| t['id'] == target }
      if by_call && !atk.key?('target')
        found = nil
      elsif Mail.blank?(target) || found.nil?
        issues << err("attack.target '#{target}' is not a social.phishTargets id")
      else
        delay = found['emailReplyDelay']
        unless delay.is_a?(Numeric) && REPLY_DELAY.cover?(delay)
          issues << warn_("target '#{target}' emailReplyDelay is #{delay.inspect}; an episode wants #{REPLY_DELAY.first} to #{REPLY_DELAY.last} seconds " \
                          '(the default is 20, too long to wait in a 13 minute episode)')
        end
      end

      site_ids = Array(ctx.social.dig('osint', 'sites')).filter_map { |s| s['id'] if s.is_a?(Hash) }
      Array(atk['siteIds']).each do |sid|
        issues << err("attack.siteIds '#{sid}' is not a social.osint.sites id") unless site_ids.include?(sid)
      end
      issues << err('attack.siteIds is empty; the OSINT stage would show nothing') if Array(atk['siteIds']).empty?

      account_ids = Mail.hash_list(ctx.social.dig('mailClient', 'accounts')).filter_map { |a| a['id'] }
      Array(atk['accountIds']).each do |aid|
        issues << err("attack.accountIds '#{aid}' is not a social.mailClient.accounts id") unless account_ids.include?(aid)
      end
      issues << err('attack.accountIds is empty; the mail client would open with no account') if Array(atk['accountIds']).empty? && !by_call
      if atk.key?('defaultAccount') && !Array(atk['accountIds']).include?(atk['defaultAccount'])
        issues << err("attack.defaultAccount '#{atk['defaultAccount']}' is not in attack.accountIds")
      end
      issues
    end

    # attack.callId (a call attack) and attack.landingPageId with the `build` stage (a page attack).
    def self.call_and_page_checks(ctx, ep, atk)
      issues = []
      stages = Array(ep['stages'])
      if atk.key?('callId')
        call_id = atk['callId']
        ids = Mail.hash_list(ctx.social['pretextNpcs']).filter_map { |n| n['callId'] }
        if Mail.blank?(call_id) || !ids.include?(call_id)
          issues << err("attack.callId '#{call_id}' is not a callId in social.pretextNpcs")
        end
      end

      page_id = atk['landingPageId']
      if stages.include?('build') && !atk.key?('landingPageId')
        issues << err("stages lists 'build' but attack.landingPageId is missing; the builder would open on no page")
      end
      if atk.key?('landingPageId')
        issues << warn_("attack.landingPageId is set but stages has no 'build'; the page is never built") unless stages.include?('build')
        pages = Mail.hash_list(ctx.social['landingPages'])
        page = pages.find { |pg| pg['id'] == page_id }
        if Mail.blank?(page_id) || page.nil?
          issues << err("attack.landingPageId '#{page_id}' is not a social.landingPages id")
        elsif atk.key?('target') && !(page['targets'].is_a?(Hash) && page['targets'].key?(atk['target']))
          issues << err("attack.landingPageId '#{page_id}' has no targets entry for attack.target '#{atk['target']}'; the builder could not aim the page at them")
        end
      end
      issues
    end

    # ---- strings ---------------------------------------------------------------------

    FACILITATOR_KEYS = %w[brief osint build write mfa flip defend debrief check pause].freeze

    def self.string_checks(ep)
      strings = ep['strings']
      return [] unless strings.is_a?(Hash)

      issues = []
      if strings.key?('brief') && (!strings['brief'].is_a?(String) || strings['brief'].strip.empty?)
        issues << err('strings.brief is empty; the brief stage would open on a blank panel')
      end
      %w[conceptPanel voicePanel].each do |key|
        next unless strings.key?(key)

        v = strings[key]
        text = v.is_a?(Hash) ? v['text'] : v
        issues << err("strings.#{key} has no text; the debrief would show an empty panel") if !text.is_a?(String) || text.strip.empty?
      end
      if strings.key?('facilitator')
        f = strings['facilitator']
        if f.is_a?(Hash)
          f.each_key do |k|
            next if FACILITATOR_KEYS.include?(k) || k.to_s.start_with?('_')

            issues << err("strings.facilitator.#{k} is not a stage id or 'pause' (#{FACILITATOR_KEYS.join(', ')})")
          end
          stages = Array(ep['stages'])
          (stages & FACILITATOR_KEYS).each do |st|
            issues << warn_("strings.facilitator has no line for stage '#{st}'; a facilitated run would show nothing for it") unless f.key?(st)
          end if ep['facilitated'] == true
        else
          issues << err('strings.facilitator must be an object { <stageId>: string, pause: string }')
        end
      end
      issues
    end

    # ---- the defend set ----------------------------------------------------------

    def self.defend_set(ctx, ep, issues)
      defend = ep['defend']
      unless defend.is_a?(Hash) && !Mail.blank?(defend['setId'])
        issues << err('defend.setId is missing')
        return nil
      end
      set = Mail.hash_list(ctx.social['triageSets']).find { |s| s['id'] == defend['setId'] }
      issues << err("defend.setId '#{defend['setId']}' is not a social.triageSets id") unless set
      set
    end

    def self.set_checks(ep, set)
      where = "defend set '#{set['id']}'"
      issues = []
      profile = Triage.profile(set)
      issues << err("#{where} has scoringProfile '#{profile}'; an episode's set uses awareness") unless profile == 'awareness'
      pass = set.dig('outcome', 'passPercent')
      issues << err("#{where} has passPercent #{pass.inspect}; it must be 0, so the done global does not trip the pass-mark warning and the round is never a 'try again'") unless pass == 0

      calls = ep.dig('defend', 'calls')
      count = Array(set['messages']).length + (calls.is_a?(Array) ? calls.length : 0)
      with_calls = calls.is_a?(Array) && !calls.empty? ? ' including defend.calls' : ''
      if check_mission?(ep)
        issues << err("#{where} has #{count} message(s)#{with_calls}; a check form has #{CHECK_MESSAGES}") unless count == CHECK_MESSAGES
      else
        unless EPISODE_MESSAGES.cover?(count)
          issues << err("#{where} has #{count} message(s)#{with_calls}; an episode's defend set has #{EPISODE_MESSAGES.first} to #{EPISODE_MESSAGES.last}")
        end
        want = "episode_#{ep['id']}_defend_"
        prefix = set.dig('outcome', 'setGlobalPrefix')
        if prefix != want
          extra = ep['variant'] == 'defendOnly' ? " (a defendOnly id already ends in '_defend', so the prefix reads '_defend_defend_'; the runner's defendPrefix() builds it the same way)" : ''
          issues << err("#{where} outcome.setGlobalPrefix is #{prefix.inspect}; it must be '#{want}', so its done global is '#{want}done'#{extra}")
        end
      end
      issues
    end

    # The done global the set writes for the stage this episode launches.
    def self.done_global(ep, set)
      prefix = set.dig('outcome', 'setGlobalPrefix')
      return nil if Mail.blank?(prefix)

      stage = ep.dig('defend', 'stage')
      return nil if prefix.include?('{stage}') && Mail.blank?(stage)

      "#{prefix.gsub('{stage}', stage.to_s)}done"
    end

    # The shell reads percent, reportRate, done and pass from the set's prefix. `done` is an error in
    # conclusion_checks; the other three are a warning here.
    def self.result_global_checks(ctx, ep, set)
      prefix = set.dig('outcome', 'setGlobalPrefix')
      return [] if Mail.blank?(prefix)

      stage = ep.dig('defend', 'stage')
      return [] if prefix.include?('{stage}') && Mail.blank?(stage)

      base = prefix.gsub('{stage}', stage.to_s)
      %w[percent reportRate pass].filter_map do |suffix|
        name = "#{base}#{suffix}"
        next if ctx.all_globals.key?(name)

        warn_("the result global '#{name}' is not declared in globalVariables; the shell declares all four (percent, reportRate, done, pass)")
      end
    end

    # A full mail episode: the flip replays the learner's send through the defend set, and that needs a
    # playerSentAuth row for the sending account. Without it the flip falls back silently.
    def self.player_sent_auth_checks(ctx, ep, set)
      atk = ep['attack']
      return [] unless atk.is_a?(Hash) && !atk.key?('callId')

      accounts = Array(atk['accountIds'])
      accounts = [atk['defaultAccount']] if accounts.empty? && !Mail.blank?(atk['defaultAccount'])
      rows = set.dig('playerSentAuth', 'accounts')
      accounts.filter_map do |aid|
        next if rows.is_a?(Hash) && rows.key?(aid)

        warn_("defend set '#{set['id']}' has no playerSentAuth.accounts.#{aid} row; the flip cannot replay a send from the attack account '#{aid}'")
      end
    end

    # ---- the conclusion: one aim, a host NPC ---------------------------------------

    def self.conclusion_checks(ctx, ep, done)
      issues = []
      aims = Array(ctx.json['objectives']).select { |a| a.is_a?(Hash) && a['missionConclusion'] == true }
      aim = aims.first
      if aims.empty?
        issues << err('no aim has missionConclusion: true; without a concluded run the shell has no result to count or export')
      elsif aims.length > 1
        issues << err("#{aims.length} aims have missionConclusion: true; a shell has one")
      end
      if aim
        globals = aim.dig('concludeRequires', 'globals')
        unless globals.is_a?(Array) && globals.include?(done)
          issues << err("aim '#{aim['aimId']}' concludeRequires.globals #{globals.inspect} must list '#{done}'; " \
                        'it gates the ending on a finished round, not on the declared defaults')
        end
      end

      task_id = ep['conclusionTaskId']
      if Mail.blank?(task_id)
        issues << err('conclusionTaskId is missing; the starter cannot re-emit the done event on a reopen without it')
      else
        if aim && Array(aim['tasks']).none? { |t| t.is_a?(Hash) && t['taskId'] == task_id }
          issues << err("conclusionTaskId '#{task_id}' is not a task of the conclusion aim '#{aim['aimId']}'")
        end
        pattern = "global_variable_changed:#{done}"
        mapped = ValidateSocial.npc_records(ctx.json).any? do |npc|
          Array(npc['eventMappings']).any? do |m|
            m.is_a?(Hash) && m['eventPattern'] == pattern && m['completeTask'] == task_id
          end
        end
        unless mapped
          issues << err("no NPC has an eventMappings entry for '#{pattern}' with completeTask '#{task_id}'; " \
                        'a global cannot complete a task by itself, so the host NPC carries the mapping')
        end
      end
      unless ctx.all_globals.key?(done)
        issues << err("the done global '#{done}' is not declared in globalVariables")
      end
      issues
    end

    # ---- the mfa stage and its push stream (11 N11, P7-M) ----------------------------------

    TIME_RE = /\A(\d{1,2}):(\d{2})\z/.freeze

    # Minutes since midnight for an authored time ("HH:MM" or a number), or nil when it is neither.
    def self.time_key(t)
      return t if t.is_a?(Numeric) && t.to_f.finite?

      m = t.is_a?(String) ? TIME_RE.match(t.strip) : nil
      return nil unless m && m[1].to_i < 24 && m[2].to_i < 60

      (m[1].to_i * 60) + m[2].to_i
    end

    def self.mfa_checks(ep)
      stages = Array(ep['stages'])
      has_stage = stages.include?('mfa')
      has_data = ep.key?('mfa')
      issues = []
      if has_stage && !has_data
        return [err("stages lists 'mfa' but there is no awarenessEpisode.mfa (pushes and approvesAt); the authenticator would open on an empty phone")]
      end
      if has_data && !has_stage
        issues << warn_("awarenessEpisode.mfa is set but stages has no 'mfa'; the push stream is never played")
      end
      return issues unless has_data

      mfa = ep['mfa']
      return issues << err('awarenessEpisode.mfa must be an object { pushes, approvesAt }') unless mfa.is_a?(Hash)

      issues << err("awarenessEpisode.mfa.mode is #{mfa['mode'].inspect}; the only mode is \"attacker\"") if mfa.key?('mode') && mfa['mode'] != 'attacker'
      pushes = mfa['pushes']
      keys = []
      if !pushes.is_a?(Array) || pushes.empty?
        issues << err('awarenessEpisode.mfa.pushes must be a non-empty array; the stream has nothing to play')
      else
        issues << warn_('awarenessEpisode.mfa.pushes has one push; MFA fatigue is a run of prompts, so two or more show it') if pushes.length == 1
        ids = []
        formats = []
        pushes.each_with_index do |p, i|
          w = "awarenessEpisode.mfa.pushes[#{i}]"
          unless p.is_a?(Hash)
            issues << err("#{w} must be an object { at, app, account?, location?, device? }")
            next
          end
          issues << err("#{w}.app is missing; the prompt would not say which app is asking") if Mail.blank?(p['app'])
          k = time_key(p['at'])
          if k.nil?
            issues << err("#{w}.at is #{p['at'].inspect}; give a time as \"HH:MM\" (00:00 to 23:59) or a number")
          else
            keys << k
            formats << (p['at'].is_a?(String) ? :string : :number)
          end
          ids << p['id'] if p['id'].is_a?(String) && !p['id'].empty?
        end
        dupes = ids.select { |x| ids.count(x) > 1 }.uniq
        issues << err("awarenessEpisode.mfa.pushes repeats the id #{dupes.map(&:inspect).join(', ')}") unless dupes.empty?
        if formats.uniq.length > 1 || (formats.uniq == [:string] && mfa['approvesAt'].is_a?(Numeric)) || (formats.uniq == [:number] && mfa['approvesAt'].is_a?(String))
          issues << warn_('awarenessEpisode.mfa mixes "HH:MM" strings and plain numbers; the timeline orders them together, which is rarely what you mean')
        end
      end

      if !mfa.key?('approvesAt')
        issues << err('awarenessEpisode.mfa.approvesAt is missing; the demonstration ends with the target tapping approve')
      else
        ak = time_key(mfa['approvesAt'])
        if ak.nil?
          issues << err("awarenessEpisode.mfa.approvesAt is #{mfa['approvesAt'].inspect}; give a time as \"HH:MM\" (00:00 to 23:59) or a number")
        elsif !keys.empty? && ak < keys.min
          issues << err("awarenessEpisode.mfa.approvesAt (#{mfa['approvesAt']}) is before the first push; the target cannot approve a prompt that has not arrived")
        end
      end
      issues
    end

    # ---- the role swap's calls (11 N15, P7-P) ------------------------------------------------

    def self.call_checks(ctx, ep, set)
      defend = ep['defend']
      return [] unless defend.is_a?(Hash) && defend.key?('calls')

      calls = defend['calls']
      return [err('defend.calls must be an array of { id, genuine, callerId, claims, tells, transcript, notes }')] unless calls.is_a?(Array)
      return [err("defend.calls is empty; leave it out, or give the learner calls to take")] if calls.empty?

      issues = []
      where = "defend set '#{set['id']}'"
      unless Triage.profile(set) == 'awareness' && set['verifyVerdict'] == true
        issues << err("defend.calls become call messages, which belong in an awareness set with verifyVerdict: true; #{where} is not one")
      end
      universe = Triage.flag_universe(set, where, [])
      knows = knows_for(ctx, defend, issues)
      # A defendOnly shell has no attack, so it may carry no pretextNpcs for the claims to resolve
      # against. Then each claim says what it shows (claim.label) and callsFrom is not read.
      labels_only = knows.nil?
      labels = labels_only ? {} : value_labels(ctx)
      taken = Mail.hash_list(set['messages']).filter_map { |m| m['id'] }
      seen = []
      calls.each_with_index do |c, i|
        w = "defend.calls[#{i}]#{c.is_a?(Hash) && c['id'].is_a?(String) ? " (#{c['id']})" : ''}"
        unless c.is_a?(Hash)
          issues << err("#{w} must be an object")
          next
        end
        id = c['id']
        if Mail.blank?(id)
          issues << err("#{w}.id is missing")
        elsif seen.include?(id)
          issues << err("#{w}.id '#{id}' is used by an earlier call")
        elsif taken.include?(id)
          issues << err("#{w}.id '#{id}' is also a message id in #{where}; the merged set would hold the id twice")
        end
        seen << id
        unless [true, false].include?(c['genuine'])
          issues << err("#{w}.genuine must be true or false")
          next
        end
        issues.concat(claim_checks(c, w, knows, labels))
        issues.concat(call_message_checks(c, w, universe))
      end
      issues << err('defend.calls has no genuine call; refusing every caller would win. Include a genuine (ideally awkward) caller') if calls.all? { |c| c.is_a?(Hash) && c['genuine'] == false }
      issues << err('defend.calls has no impostor call; the learner would have nothing to catch') if calls.all? { |c| c.is_a?(Hash) && c['genuine'] == true }
      issues
    end

    def self.hash_of(v)
      v.is_a?(Hash) ? v : {}
    end

    # intelFacts provides { value => label }, the way role-swap.js reads it (object keyed by id, or array).
    def self.value_labels(ctx)
      raw = ctx.social['intelFacts']
      facts = raw.is_a?(Hash) ? raw.values : Array(raw)
      facts.each_with_object({}) do |f, out|
        Array(f.is_a?(Hash) ? f['provides'] : nil).each do |p|
          out[p['value']] ||= p['label'] if p.is_a?(Hash) && p['value'].is_a?(String) && p['label'].is_a?(String)
        end
      end
    end

    # The knows hash claims resolve against: the named pretext call's, or every pretext call's.
    # nil when a defendOnly shell has no pretextNpcs: the claims then carry their own labels.
    def self.knows_for(ctx, defend, issues)
      npcs = Mail.hash_list(ctx.social['pretextNpcs'])
      return nil if npcs.empty? && ctx.social.dig('awarenessEpisode', 'variant') == 'defendOnly'

      if defend.key?('callsFrom')
        found = npcs.find { |n| n['callId'] == defend['callsFrom'] }
        if found.nil?
          issues << err("defend.callsFrom '#{defend['callsFrom']}' is not a callId in social.pretextNpcs")
          return {}
        end
        return hash_of(found['knows'])
      end
      npcs.each_with_object({}) { |n, all| all.merge!(hash_of(n['knows'])) { |_, a, _| a } }
    end

    def self.claim_checks(c, w, knows, labels = {})
      claims = c['claims']
      return [] if claims.nil?
      return [err("#{w}.claims must be an array of { fact, value }")] unless claims.is_a?(Array)

      claims.each_with_index.flat_map do |cl, i|
        cw = "#{w}.claims[#{i}]"
        next [err("#{cw} must be an object { fact, value }")] unless cl.is_a?(Hash)

        out = []
        fact = cl['fact']
        out << err("#{cw}.value is missing; say what the caller claims") if Mail.blank?(cl['value'])
        out << err("#{cw}.label must be a non-empty string") if cl.key?('label') && Mail.blank?(cl['label'])
        if knows.nil?
          out << err("#{cw}.fact is missing") if Mail.blank?(fact)
          out << err("#{cw}.label is missing; this shell has no social.pretextNpcs, so nothing else tells the card what '#{cl['value']}' reads as") if Mail.blank?(cl['label'])
          next out
        end
        if Mail.blank?(cl['label']) && !Mail.blank?(cl['value']) && !labels.key?(cl['value'].to_s)
          out << warn_("#{cw}: value '#{cl['value']}' has no label (no claim.label, and no social.intelFacts provides carries it); the card would show the raw id")
        end
        if Mail.blank?(fact)
          out << err("#{cw}.fact is missing")
        elsif !knows.key?(fact)
          out << err("#{cw}.fact '#{fact}' is not a knows id of the pretext call the learner attacked (social.pretextNpcs); " \
                     'the facts the learner exploited are the ones they now check')
        elsif c['genuine'] == true && cl['value'].is_a?(String)
          k = knows[fact]
          good = k.is_a?(Hash) ? [k['value']] + Array(k['accept']) : []
          out << warn_("#{cw}: a genuine caller claims '#{cl['value']}' for '#{fact}', which is not the value the record holds (#{good.compact.join(', ')})") unless good.include?(cl['value'])
        end
        out
      end
    end

    # The call as the call message it becomes, run through the triage set's own message rules.
    def self.call_message_checks(c, w, universe)
      tells = c['tells']
      issues = []
      issues << err("#{w}.tells must be an array of channel tell ids") unless tells.nil? || tells.is_a?(Array)
      notes = c['notes'].is_a?(Hash) ? c['notes'] : {}
      truth = notes.merge('isPhish' => !c['genuine'], 'flags' => tells.is_a?(Array) ? tells : [])
      m = { 'kind' => 'call', 'callerId' => c['callerId'], 'transcript' => c['transcript'], 'truth' => truth }
      issues.concat(Triage.kind_field_checks(m, 'call', w))
      issues.concat(Triage.truth_checks(m, universe, w))
      issues
    end

    # The state global is an object that starts empty. The records global is written as an array by
    # the store and older shells declare it as an object, so it may start as [] or {}.
    def self.state_global_checks(ctx, id)
      ["episode_#{id}_state", 'se_awareness_records'].filter_map do |name|
        v = ctx.all_globals[name]
        empty_ok = (v.is_a?(Hash) && v.empty?) || (name == 'se_awareness_records' && v.is_a?(Array) && v.empty?)
        next if empty_ok

        want = name == 'se_awareness_records' ? '[] (or {}, which the reader also takes)' : '{}'
        if ctx.all_globals.key?(name)
          err("global '#{name}' is declared as #{v.inspect}; it must be #{want} (it starts empty)")
        else
          err("global '#{name}' is not declared in globalVariables; declare it as #{want} (an undeclared name is not saved)")
        end
      end
    end

    # ---- check missions: the set binds to defend.stage (S5.2) ----------------------

    def self.check_mission_checks(ctx, ep, set)
      issues = []
      stage = ep.dig('defend', 'stage')
      if set.key?('stage') && CHECK_STAGES.include?(stage) && set['stage'] != stage
        issues << err("defend set '#{set['id']}' has stage #{set['stage'].inspect} but defend.stage is #{stage.inspect}; a check mission runs its set at the one stage it names")
      end
      if set.key?('pairedWith')
        partner = Mail.hash_list(ctx.social['triageSets']).find { |t| t['id'] == set['pairedWith'] }
        if partner
          issues << err("defend set '#{set['id']}' has pairedWith '#{set['pairedWith']}', which is in the same game; a check mission holds one form, and its partner form is a separate mission")
        end
      end
      issues.concat(pre_redeclared(ctx)) if stage == 'post'
      issues
    end

    # A pre export the post check imports must not also be declared in its own globalVariables
    # (carry-over rejects the collision; this names the cause). Reads the original declaration from
    # ctx.raw, because prepare_carry_over_globals has already merged the imports into globalVariables.
    def self.pre_redeclared(ctx)
      return [] if ctx.raw.nil?

      declared = begin
        g = JSON.parse(ctx.raw)['globalVariables']
        g.is_a?(Hash) ? g.keys : []
      rescue JSON::ParserError
        []
      end
      imported = Array(ctx.imports || ctx.json['importGlobals']).select { |e| e.is_a?(Hash) }.filter_map { |e| ValidateSocial.import_name(e) }
      (declared & imported).map do |n|
        err("the post check declares '#{n}' in globalVariables and also imports it; the import declares it, so leave the declaration out")
      end
    end

    # ---- check missions: carry-over (S5.2) -----------------------------------------

    def self.carry_over_checks(ctx, ep, set)
      stage = ep.dig('defend', 'stage')
      case stage
      when 'pre' then pre_exports(ctx, set)
      when 'post' then post_imports(ctx)
      else []
      end
    end

    def self.pre_exports(ctx, set)
      prefix = set.dig('outcome', 'setGlobalPrefix').to_s.gsub('{stage}', 'pre')
      names = %w[percent reportRate done].map { |s| "#{prefix}#{s}" }
      exports = Array(ctx.json['exportGlobals'])
      names.reject { |n| exports.include?(n) }.map do |n|
        err("the pre check does not list '#{n}' in exportGlobals; the post check could not import its baseline")
      end
    end

    def self.post_imports(ctx)
      imports = Array(ctx.imports || ctx.json['importGlobals']).select { |e| e.is_a?(Hash) }
      issues = []
      froms = []
      PRE_NAMES.each do |name|
        entry = imports.find { |e| e['var'] == name || e['as'] == name }
        if entry.nil?
          issues << err("the post check does not import '#{name}'; it needs the pre check's baseline for the comparison panel")
          next
        end
        froms << entry['from']
        issues << err("the import of '#{name}' has as: #{entry['as'].inspect}; it must be '#{name}' so the comparison reader finds it") unless entry['as'] == name
        issues << err("the import of '#{name}' has no from (the pre mission)") if Mail.blank?(entry['from'])
      end
      completed = imports.find { |e| e['completed'] == PRE_COMPLETED }
      if completed.nil?
        issues << err("the post check has no import with completed: \"#{PRE_COMPLETED}\"; the no-baseline gate could not tell a missing pre check from a failed one")
      else
        froms << completed['from']
        issues << err("the \"#{PRE_COMPLETED}\" import has no from (the pre mission)") if Mail.blank?(completed['from'])
      end
      froms = froms.compact.uniq
      issues << err("the post check imports from more than one mission (#{froms.join(', ')}); the baseline comes from one pre mission") if froms.length > 1
      issues
    end
  end
end
