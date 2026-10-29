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
#   brief      stages ["brief"] only (ENG-10, the core_00 first-play brief): no attack, no defend set,
#              a doneGlobal the objective concludes on
#
# The triage set's own rules (message shapes, tells, scoring) stay in triage.rb. This file lints
# what binds the set to the episode: ids, counts, the done global, the host NPC and the carry-over.
module ValidateSocial
  module Awareness
    STAGES = %w[brief osint build write flip defend debrief check mfa mistake guess].freeze
    STAGES_BY_VARIANT = {
      'full' => %w[brief osint write flip defend debrief],
      'defendOnly' => %w[brief defend debrief],
      'brief' => %w[brief]
    }.freeze
    # Wave 3 (E3): the push-stream beat, an unscored attack demonstration. It sits straight after
    # `write` or straight after `flip`, never in a defendOnly or check shell.
    MFA_AFTER = %w[write flip].freeze
    # E5: the landing-page builder, straight after `osint` and before `write`. It needs
    # attack.landingPageId and is never in a defendOnly or check shell.
    BUILD_AFTER = 'osint'
    # ENG-04 (E11, E15, E16, E19, E20): a consequence-flip episode. No attacker and no target: the
    # learner makes everyday choices in a sandbox (`mistake`, with awarenessEpisode.mistake), then the
    # flip runs as a montage (flip.mode "montage"). No `osint`, `build`, `write`, `mfa` or `guess`.
    MISTAKE_ORDER = %w[brief mistake flip defend debrief].freeze
    # ENG-02 (E9, and E18 through ENG-02b): the attack half ends in the password guesser, with no `write`.
    # `guess` sits after `osint` and before `flip`.
    GUESS_ORDER = %w[brief osint guess flip defend debrief].freeze
    # The stages that make something the attack half's checks read (the attack block).
    ATTACK_ARTEFACT_STAGES = %w[osint build write mfa guess].freeze
    FLIP_MODES = %w[montage].freeze
    CHECK_STAGES = %w[pre post].freeze
    EPISODE_MESSAGES = (4..8) # 4 since the E3 timing trim (TIMING_TRIM_PLAN Cut D)
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
      issues.concat(attack_checks(ctx, ep)) if full?(ep) && attack_artefact_stage?(ep)
      issues.concat(mistake_checks(ep))
      issues.concat(guess_checks(ctx, ep))
      issues.concat(string_checks(ctx, ep))
      issues.concat(flip_aftermath_checks(ep)) if ep.key?('flipAftermath')
      issues.concat(step_label_checks(ep)) if ep.key?('stepLabels')
      issues.concat(done_global_checks(ctx, ep))
      issues.concat(settings_checks(ctx, ep))
      issues.concat(mfa_checks(ep))
      issues.concat(sort_drill_checks(ep)) if ep.key?('sortDrill')
      if brief?(ep)
        # ENG-10: a brief-only episode has no defend set, so the whole defend-set group is skipped
        # (defend_set, set_checks, call_checks, result_global_checks, player_sent_auth_checks and the
        # set's done global). Its own lints: no defend/attack block, and the doneGlobal.
        issues.concat(brief_checks(ctx, ep))
        issues.concat(state_global_checks(ctx, id))
        return issues
      end
      issues.concat(concern_form_checks(ep)) if ep.key?('concernForm')
      issues.concat(privacy_panel_checks(ctx, ep)) if ep.key?('privacyPanel')
      issues.concat(world_checks(ctx, ep)) if ep.key?('world')
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

    # ENG-10: the brief-only episode (variant "brief", stages ["brief"]).
    def self.brief?(ep)
      ep['variant'] == 'brief' && !check_mission?(ep)
    end

    def self.full?(ep)
      ep['variant'] == 'full' && !check_mission?(ep)
    end

    # Whether the stage list has an attack-artefact stage (osint, build, write, mfa, guess). A
    # consequence episode (ENG-04) has none, so it has no attack block to lint. With no usable stage
    # list the stage lint reports it and the attack block is linted as before.
    def self.attack_artefact_stage?(ep)
      stages = ep['stages']
      return true unless stages.is_a?(Array)

      stages.any? { |s| ATTACK_ARTEFACT_STAGES.include?(s) }
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
          extra = ep['variant'] == 'full' ? " (or the same with 'build' straight after 'osint', and/or 'mfa' straight after 'write' or straight after 'flip'; or a consequence episode, #{MISTAKE_ORDER.inspect}; or a password-guessing episode, #{GUESS_ORDER.inspect})" : ''
          issues << err("variant '#{ep['variant']}' has stages #{stages.inspect}; it must be #{want.inspect}#{extra}")
        end
      elsif !ep.key?('variant')
        issues << err("variant is missing; it is full, defendOnly or brief (only a check mission, stages [\"check\"], may leave it out)")
      else
        issues << err("variant '#{ep['variant']}' must be full, defendOnly or brief")
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
      end + [MISTAKE_ORDER, GUESS_ORDER]
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
      # ENG-02: an episode with no `write` stage (the guesser is the attack artefact) sends no mail, so
      # it needs no mail account, no send cap and no mail target, exactly as a call attack does not.
      no_mail = by_call || !Array(ep['stages']).include?('write')
      unless no_mail
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
      if no_mail && !atk.key?('target')
        found = nil
      elsif Mail.blank?(target) || found.nil?
        issues << err("attack.target '#{target}' is not a social.phishTargets id")
      else
        delay = found['emailReplyDelay']
        unless delay.is_a?(Numeric) && REPLY_DELAY.cover?(delay)
          issues << warn_("target '#{target}' emailReplyDelay is #{delay.inspect}; an episode wants #{REPLY_DELAY.first} to #{REPLY_DELAY.last} seconds " \
                          '(the default is 20, too long to wait in an episode of about 15 minutes)')
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
      issues << err('attack.accountIds is empty; the mail client would open with no account') if Array(atk['accountIds']).empty? && !no_mail
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

    # ---- deployment settings (social.awareness: aw1, aw4, aw6) ------------------------

    REPORT_ROUTE_SLOT = 'slot:customer_report_route'
    SETTING_MAX = 600

    def self.settings_checks(ctx, ep)
      issues = []
      debrief = ep['debrief']
      if debrief.is_a?(Hash) && debrief.key?('mondayCard') && debrief['mondayCard'] != REPORT_ROUTE_SLOT
        issues << warn_("debrief.mondayCard is '#{debrief['mondayCard']}'; only '#{REPORT_ROUTE_SLOT}' is read (it asks for the 'How to report here' box)")
      end
      aw = ctx.social['awareness']
      return issues if aw.nil?
      return issues << Mail.err('social.awareness must be an object { reportRoute, ruleOfThumb, teamSize }') unless aw.is_a?(Hash)

      { 'reportRoute' => 'the generic "find out how to report" line shows instead',
        'ruleOfThumb' => 'nothing is shown' }.each do |key, fallback|
        next unless aw.key?(key)

        v = aw[key]
        text = v.is_a?(Hash) ? v['text'] : v
        if !text.is_a?(String) || text.strip.empty?
          issues << Mail.warn_("social.awareness.#{key} has no text; #{fallback}")
        elsif text.strip.length > SETTING_MAX
          issues << Mail.warn_("social.awareness.#{key} is #{text.strip.length} characters; the debrief shows the first #{SETTING_MAX}")
        end
      end
      if aw.key?('teamSize') && !(aw['teamSize'].is_a?(Integer) && aw['teamSize'] >= 2)
        issues << Mail.err("social.awareness.teamSize is #{aw['teamSize'].inspect}; it must be a whole number of people, 2 or more (the team line drops it otherwise)")
      end
      issues
    end

    # ---- world-play modifier (ENG-05a, ENG-05b) -------------------------------------

    # `world` moves the learner into another room for a call attack and dresses them in a costume.
    # It only means something on a full episode whose write stage is a call, and its two rooms must
    # exist: the hand-back returns the learner to the room the scenario starts in, so a reload and
    # a failed call both land them at the kiosk.
    def self.world_checks(ctx, ep)
      world = ep['world']
      return [err('world must be an object { room, startRoom, costume?, spawn? }')] unless world.is_a?(Hash)

      if ep['variant'] == 'defendOnly'
        return [err('a defendOnly episode has an awarenessEpisode.world block; the shell drops the attack it modifies, so remove it')]
      end

      issues = []
      atk = ep['attack']
      unless Array(ep['stages']).include?('write') && atk.is_a?(Hash) && atk.key?('callId')
        issues << err('world modifies a call attack, but this episode has no write stage with attack.callId; the learner would never be moved')
      end

      rooms = ctx.json['rooms'].is_a?(Hash) ? ctx.json['rooms'] : {}
      %w[room startRoom].each do |k|
        v = world[k]
        if Mail.blank?(v)
          issues << err("world.#{k} is empty or missing")
        elsif !rooms.key?(v)
          issues << err("world.#{k} '#{v}' is not a room in this scenario (#{rooms.keys.join(', ')})")
        end
      end
      if !Mail.blank?(world['room']) && world['room'] == world['startRoom']
        issues << err("world.room and world.startRoom are both '#{world['room']}'; the learner would never move")
      end
      top = ctx.json['startRoom']
      if !Mail.blank?(world['startRoom']) && world['startRoom'] != top
        issues << err("world.startRoom '#{world['startRoom']}' is not the scenario startRoom '#{top}'; a reload would leave the learner away from the kiosk")
      end

      if world.key?('costume')
        c = world['costume']
        if !c.is_a?(Hash) || Mail.blank?(c['sprite'])
          issues << err('world.costume must name a sprite (assets/characters/<sprite>.png)')
        elsif Mail.blank?(c['talk'])
          issues << warn_("world.costume.talk is missing; the talk portrait is derived as assets/characters/#{c['sprite']}_talk.png, which must exist")
        end
      end
      issues
    end

    # ---- flipAftermath and stepLabels (ENG-01) ---------------------------------------

    AFTERMATH_KINDS = %w[email sms voicemail qr page call push].freeze

    def self.flip_aftermath_checks(ep)
      block = ep['flipAftermath']
      return [err('flipAftermath must be an object { heading?, victimName?, intro?, items: [...], line? }')] unless block.is_a?(Hash)

      issues = []
      if !full?(ep) || !Array(ep['stages']).include?('flip')
        issues << warn_("flipAftermath is set but this episode runs no flip stage (variant '#{ep['variant']}'); it would never show")
      end
      items = block['items']
      unless items.is_a?(Array) && !items.empty?
        return issues << err('flipAftermath.items must be a non-empty list; without a valid item the aftermath is not drawn')
      end

      seen = {}
      items.each_with_index do |it, i|
        w = "flipAftermath.items[#{i}]"
        unless it.is_a?(Hash)
          issues << err("#{w} must be an object")
          next
        end
        if Mail.blank?(it['id'])
          issues << err("#{w}.id is empty or missing; an item without an id is not drawn")
        elsif seen[it['id']]
          issues << err("#{w}.id '#{it['id']}' repeats flipAftermath.items[#{seen[it['id']]}]")
        else
          seen[it['id']] = i
        end
        kind = it['kind']
        unless AFTERMATH_KINDS.include?(kind)
          issues << err("#{w}.kind is #{kind.inspect}; it must be one of #{AFTERMATH_KINDS.join(', ')}")
          next
        end
        issues << err("#{w}: an email row needs a to or a subject; it would be blank") if kind == 'email' && Mail.blank?(it['to']) && Mail.blank?(it['subject'])
        issues << err("#{w}.push.app is missing; the prompt would not say which app is asking") if kind == 'push' && (!it['push'].is_a?(Hash) || Mail.blank?(it['push']['app']))
        issues << err("#{w}.page.url is missing; the address bar would be blank") if kind == 'page' && (!it['page'].is_a?(Hash) || Mail.blank?(it['page']['url']))
        issues << err("#{w}.qr.destination is missing") if kind == 'qr' && (!it['qr'].is_a?(Hash) || Mail.blank?(it['qr']['destination']))
        issues << err("#{w}.body is empty; the text bubble would be blank") if kind == 'sms' && Mail.blank?(it['body'])
      end
      issues
    end

    def self.step_label_checks(ep)
      labels = ep['stepLabels']
      return [err('stepLabels must be an object { <stageId>: string }')] unless labels.is_a?(Hash)

      labels.each_with_object([]) do |(k, v), out|
        next if k.to_s.start_with?('_')

        out << err("stepLabels.#{k} is not a stage id (#{STAGES.join(', ')})") unless STAGES.include?(k)
        out << err("stepLabels.#{k} is empty; the step would show no name") if Mail.blank?(v)
      end
    end

    # ---- strings ---------------------------------------------------------------------

    FACILITATOR_KEYS = %w[brief osint build write mfa mistake guess flip defend debrief check pause].freeze

    def self.string_checks(ctx, ep)
      strings = ep['strings']
      return [] unless strings.is_a?(Hash)

      issues = []
      if strings.key?('brief') && (!strings['brief'].is_a?(String) || strings['brief'].strip.empty?)
        issues << err('strings.brief is empty; the brief stage would open on a blank panel')
      end
      issues.concat(flip_by_choice_checks(ctx, strings['flipDefenderLineByChoice'])) if strings.key?('flipDefenderLineByChoice')
      issues.concat(brief_card_checks(strings))
      %w[conceptPanel voicePanel].each do |key|
        next unless strings.key?(key)

        v = strings[key]
        if key == 'conceptPanel' && v.is_a?(Array)
          # ENG-09b: several concept panels, drawn in order; each needs text.
          issues << err('strings.conceptPanel is an empty list; the debrief would show no panel') if v.empty?
          v.each_with_index do |entry, i|
            t = entry.is_a?(Hash) ? entry['text'] : nil
            issues << err("strings.conceptPanel entry #{i + 1} has no text; the debrief would show an empty panel") if !t.is_a?(String) || t.strip.empty?
          end
          next
        end
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

    # aw2: the choice-aware flip defender line (strings.flipDefenderLineByChoice). Keyed by the
    # template id the learner picked (state.sent.templateId, which is always a pretext). A key that
    # is not a template id, or a template that is not a pretext, would never be shown; warn on it.
    def self.flip_by_choice_checks(ctx, by)
      return [err('strings.flipDefenderLineByChoice must be an object { <pretext templateId>: string }')] unless by.is_a?(Hash)

      templates = ctx.social['templates']
      template_ids = templates.is_a?(Hash) ? templates.keys : []
      pretext_ids = templates.is_a?(Hash) ? templates.select { |_, t| t.is_a?(Hash) && t['part'] == 'pretext' }.keys : []
      issues = []
      by.each do |key, val|
        next if key.to_s.start_with?('_')

        if !val.is_a?(String) || val.strip.empty?
          issues << err("strings.flipDefenderLineByChoice.#{key} has no text; drop the key and the branch falls back to flipDefenderLine")
          next
        end
        if !template_ids.include?(key)
          issues << warn_("strings.flipDefenderLineByChoice.#{key} is not a social.templates id; the flip keys this map on the pretext the learner chose (state.sent.templateId), so this line would never be shown")
        elsif !pretext_ids.include?(key)
          issues << warn_("strings.flipDefenderLineByChoice.#{key} is the template '#{key}', which is not a 'pretext'; only the chosen pretext is recorded as the flip's templateId, so this line would never be shown")
        end
      end
      issues
    end

    # ---- the consequence stage (ENG-04) ----------------------------------------------

    def self.mistake_checks(ep)
      stages = Array(ep['stages'])
      has_stage = stages.include?('mistake')
      has_block = ep.key?('mistake')
      has_mode = ep['flip'].is_a?(Hash) && ep['flip'].key?('mode')
      montage_lines = ep['strings'].is_a?(Hash) && ep['strings'].key?('flipMontageByChoice')
      issues = []
      if ep['variant'] == 'defendOnly'
        issues << err('a defendOnly episode has an awarenessEpisode.mistake block; the shell drops the mistake stage, so remove it') if has_block
        issues << err('a defendOnly episode has an awarenessEpisode.flip block; the shell drops the flip, so remove it') if ep.key?('flip')
        issues << warn_('a defendOnly episode has strings.flipMontageByChoice; its shell has no flip, so the line is never shown') if montage_lines
        return issues
      end
      if has_stage
        issues << err("stages lists 'mistake' but there is no awarenessEpisode.mistake block (beats and flipBeat); the sandbox would open on nothing") unless has_block
        issues << err('a mistake episode has an attack block; it has no attacker and no target, so remove it') if ep.key?('attack')
        unless has_mode && ep['flip']['mode'] == 'montage'
          issues << err('stages lists \'mistake\' but awarenessEpisode.flip.mode is not "montage"; the flip would look for a sent message and find none')
        end
      elsif has_block
        issues << warn_("awarenessEpisode.mistake is set but stages has no 'mistake'; the sandbox is never played")
      end
      if ep.key?('flip')
        flip = ep['flip']
        if !flip.is_a?(Hash)
          issues << err('awarenessEpisode.flip must be an object { mode }')
        elsif has_mode && !FLIP_MODES.include?(flip['mode'])
          issues << err("awarenessEpisode.flip.mode is #{flip['mode'].inspect}; the only mode is \"montage\"")
        elsif flip['mode'] == 'montage' && !has_block
          issues << err('awarenessEpisode.flip.mode is "montage" but there is no awarenessEpisode.mistake block to replay')
        end
      end
      return issues unless has_block

      mistake = ep['mistake']
      return issues << err('awarenessEpisode.mistake must be an object { scored, beats, flipBeat }') unless mistake.is_a?(Hash)

      issues << err("awarenessEpisode.mistake.scored is #{mistake['scored'].inspect}; it must be false (the sandbox is never scored)") if mistake.key?('scored') && mistake['scored'] != false
      beats = mistake['beats']
      if !beats.is_a?(Array) || beats.empty?
        issues << err('awarenessEpisode.mistake.beats must be a non-empty array; the sandbox has nothing to ask')
        beats = []
      end
      beat_ids = []
      option_ids = {}
      beats.each_with_index do |beat, i|
        w = "awarenessEpisode.mistake.beats[#{i}]"
        unless beat.is_a?(Hash)
          issues << err("#{w} must be an object { id, situation, options }")
          next
        end
        bid = beat['id']
        if Mail.blank?(bid)
          issues << err("#{w}.id is empty or missing; the montage and the state key on it")
        elsif beat_ids.include?(bid)
          issues << err("#{w}.id '#{bid}' is used by an earlier beat; beat ids are unique")
        else
          beat_ids << bid
        end
        w = "awarenessEpisode.mistake.beats[#{bid || i}]"
        issues << err("#{w}.situation is empty or missing; the learner sees nothing to decide") if Mail.blank?(beat['situation'])
        options = beat['options']
        unless options.is_a?(Array) && options.length >= 2
          issues << err("#{w}.options must list at least two options; one choice is not a choice")
          next
        end
        ids = []
        safe = 0
        approved = 0
        options.each_with_index do |opt, j|
          ow = "#{w}.options[#{j}]"
          unless opt.is_a?(Hash)
            issues << err("#{ow} must be an object { id, label, safe }")
            next
          end
          if Mail.blank?(opt['id'])
            issues << err("#{ow}.id is empty or missing")
          elsif ids.include?(opt['id'])
            issues << err("#{ow}.id '#{opt['id']}' is used by an earlier option of this beat")
          else
            ids << opt['id']
          end
          issues << err("#{ow}.label is empty or missing; the learner sees a blank option") if Mail.blank?(opt['label'])
          issues << err("#{ow}.safe is #{opt['safe'].inspect}; it must be true or false") unless [true, false].include?(opt['safe'])
          safe += 1 if opt['safe'] == true
          next unless opt['approvedRoute'] == true

          approved += 1
          issues << err("#{ow} is marked approvedRoute but is not safe; the approved route is the safe option") unless opt['safe'] == true
        end
        issues << err("#{w} has #{safe} options with safe: true; it must have exactly one (the approved route)") unless safe == 1
        issues << err("#{w} has #{approved} options marked approvedRoute; at most one is the modelled best move") if approved > 1
        option_ids[bid] = ids if bid.is_a?(String)
      end

      flip_beat = mistake['flipBeat']
      if Mail.blank?(flip_beat)
        issues << err('awarenessEpisode.mistake.flipBeat is missing; the montage needs the one consequential choice to lead with')
      elsif !beat_ids.include?(flip_beat)
        issues << err("awarenessEpisode.mistake.flipBeat '#{flip_beat}' is not a beat id (#{beat_ids.join(', ')})")
      end
      issues.concat(montage_line_checks(ep, option_ids))
      issues
    end

    # strings.flipMontageByChoice: { <beatId>: { <optionId>: line } }. Every key is real, every line has
    # text. A beat with no lines at all shows only its situation in the montage.
    def self.montage_line_checks(ep, option_ids)
      strings = ep['strings']
      by = strings.is_a?(Hash) ? strings['flipMontageByChoice'] : nil
      if by.nil?
        return [err('a mistake episode needs strings.flipMontageByChoice; the montage has no lines to show')] if Array(ep['stages']).include?('mistake')

        return []
      end
      return [err('strings.flipMontageByChoice must be an object { <beatId>: { <optionId>: string } }')] unless by.is_a?(Hash)

      issues = []
      by.each do |bid, lines|
        next if bid.to_s.start_with?('_')

        unless option_ids.key?(bid)
          issues << err("strings.flipMontageByChoice.#{bid} is not a beat id of awarenessEpisode.mistake (#{option_ids.keys.join(', ')})")
          next
        end
        unless lines.is_a?(Hash)
          issues << err("strings.flipMontageByChoice.#{bid} must be an object { <optionId>: string }")
          next
        end
        lines.each do |oid, line|
          next if oid.to_s.start_with?('_')

          if !option_ids[bid].include?(oid)
            issues << err("strings.flipMontageByChoice.#{bid}.#{oid} is not an option of beat '#{bid}' (#{option_ids[bid].join(', ')})")
          elsif !line.is_a?(String) || line.strip.empty?
            issues << err("strings.flipMontageByChoice.#{bid}.#{oid} has no text; the montage would show a blank line")
          end
        end
      end
      option_ids.each_key do |bid|
        issues << warn_("strings.flipMontageByChoice has no lines for beat '#{bid}'; the montage would show only its situation") unless by.key?(bid)
      end
      issues
    end

    # ENG-10: strings.briefCards is a non-empty array of { heading?, text } with real text;
    # briefDone and alreadySeen are non-empty strings. Read only by the brief stage, but linted wherever
    # authored, so a typo does not ship as a blank card.
    def self.brief_card_checks(strings)
      issues = []
      if strings.key?('briefCards')
        cards = strings['briefCards']
        if !cards.is_a?(Array) || cards.empty?
          issues << err('strings.briefCards must be a non-empty array of { heading?, text }; an empty list would leave the brief with no card')
        else
          cards.each_with_index do |card, i|
            if !card.is_a?(Hash) || !card['text'].is_a?(String) || card['text'].strip.empty?
              issues << err("strings.briefCards[#{i}] has no text; the card would be blank")
            elsif card.key?('heading') && (!card['heading'].is_a?(String) || card['heading'].strip.empty?)
              issues << err("strings.briefCards[#{i}].heading is empty; drop the key or give it text")
            end
          end
        end
      end
      %w[briefDone alreadySeen].each do |key|
        next unless strings.key?(key)

        issues << err("strings.#{key} is empty; drop the key and the runner's own line stands") if !strings[key].is_a?(String) || strings[key].strip.empty?
      end
      issues
    end

    # ENG-10: lints for a brief-only episode. No defend set exists, so the done global comes from
    # doneGlobal, and the conclusion aim has to wait on it.
    def self.brief_checks(ctx, ep)
      issues = []
      %w[defend attack].each do |key|
        issues << err("a brief episode has a #{key} block; it runs the brief stage only and never reads it") if ep.key?(key)
      end
      strings = ep['strings']
      if !strings.is_a?(Hash) || (!strings.key?('briefCards') && Mail.blank?(strings['brief']))
        issues << err('a brief episode has neither strings.briefCards nor strings.brief; the learner would see an empty brief')
      end
      done = ep['doneGlobal']
      if Mail.blank?(done)
        issues << err('a brief episode needs doneGlobal; without it nothing is written when the brief ends and the objective cannot conclude')
        return issues
      end
      issues.concat(conclusion_checks(ctx, ep, done))
      issues
    end

    # doneGlobal (any episode that authors it) starts false once declared; an undeclared name is
    # reported by conclusion_checks for a brief episode and here for any other. oncePerLearner reads
    # the global, so it needs one.
    def self.done_global_checks(ctx, ep)
      issues = []
      done = ep['doneGlobal']
      if ep.key?('doneGlobal')
        if !done.is_a?(String) || done.strip.empty?
          issues << err('doneGlobal is empty; name the global the runner sets true when the last stage ends')
        elsif ctx.all_globals.key?(done)
          issues << err("doneGlobal '#{done}' is declared as #{ctx.all_globals[done].inspect}; it must start false") unless ctx.all_globals[done] == false
        elsif !brief?(ep)
          issues << err("doneGlobal '#{done}' is not declared in globalVariables; an undeclared name is not saved")
        end
      end
      if ep.key?('oncePerLearner')
        if ep['oncePerLearner'] != true && ep['oncePerLearner'] != false
          issues << err('oncePerLearner must be true or false')
        elsif ep['oncePerLearner'] == true && Mail.blank?(done)
          issues << err('oncePerLearner is true but there is no doneGlobal; the runner has nothing to read to know the learner has seen it')
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
      # standalone: false makes the episode one beat in a bigger mission, so the mission owns its
      # conclusion: only the done global has to exist.
      if ep['standalone'] == false
        issues << err("the done global '#{done}' is not declared in globalVariables") unless ctx.all_globals.key?(done)
        return issues
      end
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
      return issues << err('awarenessEpisode.mfa must be an object: { pushes, approvesAt } (scripted) or { choice, pushTemplate, defenderNote } (a learner decision)') unless mfa.is_a?(Hash)

      issues << err("awarenessEpisode.mfa.mode is #{mfa['mode'].inspect}; the only mode is \"attacker\"") if mfa.key?('mode') && mfa['mode'] != 'attacker'

      # Decision mode (E3-11): the learner chooses when and how many, so there are no authored
      # `pushes`/`approvesAt`; the burst and the approval are built at runtime from the choice.
      return issues + decision_checks(mfa) if mfa.key?('choice')

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

    # The learner-decision shape (E3-11): mfa.choice { timing, count }, mfa.pushTemplate, defenderNote.
    # Every combination must land (the scene always plays an approval), so the checks are about the
    # decision being real (two or more options each side) and every option carrying its teaching copy.
    def self.decision_checks(mfa)
      issues = []
      %w[pushes approvesAt].each do |k|
        issues << err("awarenessEpisode.mfa has both 'choice' and '#{k}'; a decision builds its own stream, so drop '#{k}'") if mfa.key?(k)
      end

      choice = mfa['choice']
      return issues << err('awarenessEpisode.mfa.choice must be an object { timing, count }') unless choice.is_a?(Hash)

      issues.concat(choice_group_checks(choice['timing'], 'timing', %w[at outcome]))
      issues.concat(choice_group_checks(choice['count'], 'count', %w[n note]))

      tmpl = mfa['pushTemplate']
      if !tmpl.is_a?(Hash)
        issues << err('awarenessEpisode.mfa.pushTemplate must be an object { app, account?, location?, device? }; the prompt cards need something to show')
      elsif Mail.blank?(tmpl['app'])
        issues << err('awarenessEpisode.mfa.pushTemplate.app is missing; the prompt would not say which app is asking')
      end

      issues << err('awarenessEpisode.mfa.defenderNote is missing; a decision must name the defender\'s control (number matching, report, rate limit)') if Mail.blank?(mfa['defenderNote'])
      issues
    end

    # One side of the decision (timing or count): a legend-and-options object whose options each carry
    # an id, a label and the fields that make the outcome teach (`extra`). Needs two or more options,
    # or the learner is not really choosing.
    def self.choice_group_checks(group, name, extra)
      w = "awarenessEpisode.mfa.choice.#{name}"
      return [err("#{w} must be an object { legend?, options }")] unless group.is_a?(Hash)

      opts = group['options']
      return [err("#{w}.options must be a non-empty array")] unless opts.is_a?(Array) && !opts.empty?

      issues = []
      issues << err("#{w}.options has one option; a decision needs two or more to choose between") if opts.length == 1
      ids = []
      opts.each_with_index do |o, i|
        at = "#{w}.options[#{i}]"
        unless o.is_a?(Hash)
          issues << err("#{at} must be an object")
          next
        end
        issues << err("#{at}.id is missing") if Mail.blank?(o['id'])
        issues << err("#{at}.label is missing") if Mail.blank?(o['label'])
        ids << o['id'] if o['id'].is_a?(String) && !o['id'].empty?
        if name == 'count'
          n = o['n']
          issues << err("#{at}.n must be a whole number of prompts (1 or more)") unless n.is_a?(Integer) && n >= 1
          issues << err("#{at}.note is missing; it explains what this volume leans on") if Mail.blank?(o['note'])
        else
          issues << err("#{at}.at is #{o['at'].inspect}; give a time as \"HH:MM\" (00:00 to 23:59) or a number") if time_key(o['at']).nil?
          issues << err("#{at}.outcome is missing; it explains why this timing made the target approve") if Mail.blank?(o['outcome'])
        end
      end
      dupes = ids.select { |x| ids.count(x) > 1 }.uniq
      issues << err("#{w}.options repeats the id #{dupes.map(&:inspect).join(', ')}") unless dupes.empty?
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

    # ---- the password guesser (ENG-02) -------------------------------------------------

    # `guess.mode` picks the guesser's builder. ENG-02b appends 'spray' and 'stuff' here, with their own
    # lints (a branch beside guess_target_checks); E9's block authors no mode and is the 'target' mode.
    GUESS_MODES = %w[target].freeze
    # The guesser is a made-up model, never a password list: a short common list, patterns from collected
    # facts, one reuse step. These caps keep a pasted list out of the data.
    GUESS_COMMON_MAX = 8
    GUESS_WORD_MAX = 24
    # Keys that name a credential. `passphraseDemo` (three game words that never land) does not match.
    CREDENTIAL_KEY = /password|passwd|pwd|secret|credential|hash/i

    # `guess` is the stage's authored guesser. Opt-in: a `guess` stage needs the block, and the block
    # needs the stage. Everything in it is authored data, so the lints check that every fact it reads is
    # a declared one, that it can land, and that it holds nothing that looks like a credential.
    def self.guess_checks(ctx, ep)
      stages = Array(ep['stages'])
      has_stage = stages.include?('guess')
      has_block = ep.key?('guess')
      return [] unless has_stage || has_block
      if ep['variant'] == 'defendOnly'
        return has_block ? [err('a defendOnly episode has an awarenessEpisode.guess block; the shell drops the guess stage, so remove it')] : []
      end
      return [err("stages lists 'guess' but there is no awarenessEpisode.guess block; the guesser would open on nothing")] if has_stage && !has_block
      return [warn_("awarenessEpisode.guess is set but stages has no 'guess'; the guesser is never played")] unless has_stage

      g = ep['guess']
      return [err('awarenessEpisode.guess must be an object { commonList, patternSlots, reuseStep, passphraseDemo, landedGlobal }')] unless g.is_a?(Hash)

      issues = []
      mode = g.fetch('mode', 'target')
      if GUESS_MODES.include?(mode)
        issues.concat(guess_target_checks(ctx, g))
      else
        issues << err("awarenessEpisode.guess.mode is #{mode.inspect}; it must be one of #{GUESS_MODES.join(', ')}")
      end
      issues.concat(guess_common_checks(g))
      name = g['landedGlobal']
      if Mail.blank?(name)
        issues << err('awarenessEpisode.guess.landedGlobal is missing; the flip could not tell whether the guesser landed')
      elsif !ctx.all_globals.key?(name)
        issues << err("awarenessEpisode.guess.landedGlobal '#{name}' is not declared in globalVariables; an undeclared name is not saved (declare it false)")
      elsif ctx.all_globals[name] != false
        issues << err("awarenessEpisode.guess.landedGlobal '#{name}' must be declared false (it starts not landed), not #{ctx.all_globals[name].inspect}")
      end
      issues.concat(guess_credential_checks(g, 'awarenessEpisode.guess'))
      issues
    end

    # Every mode: the common list is short, the fixed lines are strings.
    def self.guess_common_checks(g)
      issues = []
      if g.key?('commonList')
        list = g['commonList']
        if !list.is_a?(Array)
          issues << err('awarenessEpisode.guess.commonList must be a list of short made-up strings')
        else
          issues << err("awarenessEpisode.guess.commonList has #{list.length} entries; keep it to #{GUESS_COMMON_MAX} (it is the starting point of the demonstration, not a list of passwords)") if list.length > GUESS_COMMON_MAX
          list.each_with_index do |w, i|
            issues << err("awarenessEpisode.guess.commonList[#{i}] must be a short string (#{GUESS_WORD_MAX} characters at most)") if !w.is_a?(String) || w.strip.empty? || w.length > GUESS_WORD_MAX
          end
        end
      end
      if g.key?('strings')
        st = g['strings']
        issues << err('awarenessEpisode.guess.strings must be an object of strings keyed by line') if !st.is_a?(Hash) || st.any? { |_, v| !v.is_a?(String) }
      end
      issues
    end

    # mode "target" (E9): pattern slots read one fact each, the reuse step reads one, the passphrase never lands.
    def self.guess_target_checks(ctx, g)
      issues = []
      facts = Mail.facts(ctx).keys
      people = Mail.people_ids(ctx)
      if g.key?('target') && (Mail.blank?(g['target']) || !people.include?(g['target']))
        issues << warn_("awarenessEpisode.guess.target '#{g['target']}' is not a social.people id; it is shown as the colleague the guesser runs against")
      end
      slots = g['patternSlots']
      if g.key?('patternSlots') && !slots.is_a?(Array)
        issues << err('awarenessEpisode.guess.patternSlots must be a list of { id, factId, word, template }')
        slots = nil
      end
      ids = []
      Array(slots).each_with_index do |slot, i|
        w = "awarenessEpisode.guess.patternSlots[#{i}]"
        unless slot.is_a?(Hash)
          issues << err("#{w} must be an object { id, factId, word, template }")
          next
        end
        sid = slot['id']
        if Mail.blank?(sid)
          issues << err("#{w}.id is missing; it names the one token the template may use")
        else
          issues << err("#{w}.id '#{sid}' is used by an earlier slot") if ids.include?(sid)
          ids << sid
        end
        issues << err("#{w}.factId '#{slot['factId']}' is not a social.intelFacts id; the guess is built only from a fact the learner collected") if Mail.blank?(slot['factId']) || !facts.include?(slot['factId'])
        issues << err("#{w}.word is missing; it is the made-up word the fact stands for, put in the template's {#{sid}} token") if Mail.blank?(slot['word'])
        tpl = slot['template']
        if Mail.blank?(tpl)
          issues << err("#{w}.template is missing")
        else
          tokens = tpl.scan(/\{([^}]*)\}/).flatten.uniq
          issues << err("#{w}.template uses #{tokens.map { |t| "{#{t}}" }.join(', ')}; a slot's template may use only its own {#{sid}} (tokens never cross slots)") unless (tokens - [sid]).empty?
          issues << warn_("#{w}.template has no {#{sid}} token, so the fact does not change the guess") unless tokens.include?(sid)
          issues << err("#{w}.template is longer than #{GUESS_WORD_MAX * 2} characters; a guess is a short made-up string") if tpl.length > GUESS_WORD_MAX * 2
        end
      end
      reuse = g['reuseStep']
      if g.key?('reuseStep')
        if !reuse.is_a?(Hash)
          issues << err('awarenessEpisode.guess.reuseStep must be an object { site, domain, factId, landsOn, note }')
        else
          issues << err("awarenessEpisode.guess.reuseStep.factId '#{reuse['factId']}' is not a social.intelFacts id; the reused password opens the account only if the learner found where it was reused") if Mail.blank?(reuse['factId']) || !facts.include?(reuse['factId'])
          issues << err('awarenessEpisode.guess.reuseStep.site is missing; the step has to name the other site the password came from') if Mail.blank?(reuse['site'])
        end
      else
        issues << warn_('awarenessEpisode.guess has no reuseStep; nothing in it can land, so the flip always shows the did-not-land view')
      end
      if g.key?('passphraseDemo')
        demo = g['passphraseDemo']
        if !demo.is_a?(Hash)
          issues << err('awarenessEpisode.guess.passphraseDemo must be an object { words, neverLands: true }')
        else
          issues << err('awarenessEpisode.guess.passphraseDemo.neverLands must be true; the passphrase is still being tried when the rig is switched off') unless demo['neverLands'] == true
          words = demo['words']
          issues << err('awarenessEpisode.guess.passphraseDemo.words must be a list of game words') if !words.is_a?(Array) || words.empty? || words.any? { |x| Mail.blank?(x) }
        end
      end
      issues
    end

    # No key in the block names a credential: the guesser holds authored guesses, never a password field.
    def self.guess_credential_checks(node, path)
      case node
      when Hash
        node.flat_map do |k, v|
          here = "#{path}.#{k}"
          named = k.to_s.match?(CREDENTIAL_KEY) && !k.to_s.start_with?('_')
          (named ? [err("#{here} looks like a credential field; the guesser holds authored guesses only, never a password, secret or hash")] : []) +
            guess_credential_checks(v, here)
        end
      when Array
        node.each_with_index.flat_map { |v, i| guess_credential_checks(v, "#{path}[#{i}]") }
      else
        []
      end
    end

    # ---- the sort drill (ENG-11) ---------------------------------------------------

    SORT_DRILL_BINS = (2..4)

    # `sortDrill` runs first inside the defend stage. Its bins, cards and scoring are data; the lints
    # keep every card answerable (an answer naming a real bin) and a scored drill tied to a key.
    def self.sort_drill_checks(ep)
      d = ep['sortDrill']
      return [err('sortDrill must be an object { bins, cards, scored?, ... }')] unless d.is_a?(Hash)

      issues = []
      stages = ep['stages']
      if check_mission?(ep) || !(stages.is_a?(Array) && stages.include?('defend'))
        issues << err("sortDrill runs inside the defend stage; this episode's stages #{stages.inspect} have none to host it")
      end
      bins = d['bins']
      ids = []
      if bins.is_a?(Array) && SORT_DRILL_BINS.cover?(bins.length)
        bins.each_with_index do |b, i|
          unless b.is_a?(Hash) && !Mail.blank?(b['id']) && !Mail.blank?(b['label'])
            issues << err("sortDrill.bins[#{i}] needs a non-empty id and label")
            next
          end
          issues << err("sortDrill.bins: id '#{b['id']}' is used more than once") if ids.include?(b['id'])
          ids << b['id']
        end
      else
        issues << err("sortDrill.bins must hold #{SORT_DRILL_BINS.first} to #{SORT_DRILL_BINS.last} bins (a sort needs a choice, and more than four will not fit a row)")
      end
      scored = d['scored']
      issues << err('sortDrill.scored must be true or false') unless [true, false].include?(scored)
      if scored == true
        issues << err("sortDrill is scored but names no answerKeyProfile; say which answer key the cards' answers come from") if Mail.blank?(d['answerKeyProfile'])
      elsif scored == false
        %w[answerKeyProfile alwaysScoresBin].each do |k|
          issues << warn_("sortDrill.#{k} is set on an unscored drill; it is never read") if d.key?(k)
        end
      end
      if d.key?('alwaysScoresBin') && !ids.include?(d['alwaysScoresBin'])
        issues << err("sortDrill.alwaysScoresBin '#{d['alwaysScoresBin']}' is not one of the bins (#{ids.join(', ')})")
      end
      issues.concat(sort_drill_card_checks(d, ids))
      issues
    end

    def self.sort_drill_card_checks(d, ids)
      cards = d['cards']
      return [err('sortDrill.cards must be a non-empty array')] unless cards.is_a?(Array) && !cards.empty?

      issues = []
      seen = []
      answered = []
      drawable = 0
      cards.each_with_index do |c, i|
        unless c.is_a?(Hash)
          issues << err("sortDrill.cards[#{i}] must be an object")
          next
        end
        cw = "sortDrill.cards[#{c['id'] || i}]"
        issues << err("#{cw} has no id") if Mail.blank?(c['id'])
        issues << err("sortDrill.cards: id '#{c['id']}' is used more than once") if !Mail.blank?(c['id']) && seen.include?(c['id'])
        seen << c['id']
        issues << err("#{cw}.situation is empty or missing; the card would show nothing") if Mail.blank?(c['situation'])
        issues << err("#{cw}.reason is empty or missing; every drop shows its reason") if Mail.blank?(c['reason'])
        answers = Array(c['answer'])
        if answers.empty?
          issues << err("#{cw}.answer is missing; name a bin id (or a list of bin ids)")
        else
          answers.each { |a| issues << err("#{cw}.answer '#{a}' is not one of the bins (#{ids.join(', ')})") unless ids.include?(a) }
          issues << err("#{cw}.answer lists the same bin twice") if answers.uniq.length != answers.length
          answered << answers.first
        end
        if c['locked'] == true
          issues << err("#{cw} is locked but has more than one accepted answer; a locked card has one fixed answer") if answers.length > 1
          issues << err("#{cw} is locked and confirmed: false; a locked card is always drawn") if c['confirmed'] == false
        end
        drawable += 1 if c['locked'] == true || c['confirmed'] != false
      end
      issues << err('sortDrill has no confirmed card to draw') if drawable.zero?
      rules = d['drawRules']
      count = d['drawCount']
      if count && !(count.is_a?(Integer) && count >= 1)
        issues << err('sortDrill.drawCount must be a whole number of cards, 1 or more')
      elsif count && rules.is_a?(Hash) && rules['oneOfEachAnswer'] == true && count < answered.uniq.length
        issues << err("sortDrill.drawCount #{count} is below the #{answered.uniq.length} bins the cards answer, so oneOfEachAnswer cannot hold")
      end
      issues
    end

    # ---- the concern form (ENG-12) -------------------------------------------------

    CONCERN_KINDS = %w[what when where who].freeze

    # `concernForm` runs inside the defend stage (after any sortDrill, before the triage set). The lints
    # keep every fact chip usable (a known kind, a unique id) and the minimum reachable.
    def self.concern_form_checks(ep)
      f = ep['concernForm']
      return [err('concernForm must be an object { factChips, conclusionChips?, guidance?, minFacts? }')] unless f.is_a?(Hash)

      issues = []
      stages = ep['stages']
      if check_mission?(ep) || !(stages.is_a?(Array) && stages.include?('defend'))
        issues << err("concernForm runs inside the defend stage; this episode's stages #{stages.inspect} have none to host it")
      end
      chips = f['factChips']
      ids = []
      if chips.is_a?(Array) && !chips.empty?
        chips.each_with_index do |c, i|
          unless c.is_a?(Hash) && !Mail.blank?(c['id']) && !Mail.blank?(c['label'])
            issues << err("concernForm.factChips[#{i}] needs a non-empty id and label")
            next
          end
          cw = "concernForm.factChips[#{c['id']}]"
          issues << err("#{cw}.kind '#{c['kind']}' is not one of #{CONCERN_KINDS.join(', ')}") unless CONCERN_KINDS.include?(c['kind'])
          issues << err("concernForm.factChips: id '#{c['id']}' is used more than once") if ids.include?(c['id'])
          ids << c['id']
        end
      else
        issues << err('concernForm.factChips must be a non-empty array; the learner builds the report from facts')
      end
      conclusions = f['conclusionChips']
      unless conclusions.nil? || conclusions.is_a?(Array)
        issues << err('concernForm.conclusionChips must be an array')
        conclusions = nil
      end
      (conclusions || []).each_with_index do |c, i|
        unless c.is_a?(Hash) && !Mail.blank?(c['id']) && !Mail.blank?(c['label'])
          issues << err("concernForm.conclusionChips[#{i}] needs a non-empty id and label")
          next
        end
        issues << err("concernForm.conclusionChips: id '#{c['id']}' is also used by another chip") if ids.include?(c['id'])
        ids << c['id']
      end
      if f.key?('minFacts')
        min = f['minFacts']
        fact_count = chips.is_a?(Array) ? chips.length : 0
        if !(min.is_a?(Integer) && min >= 1)
          issues << err('concernForm.minFacts must be a whole number, 1 or more')
        elsif min > fact_count
          issues << err("concernForm.minFacts #{min} is more than the #{fact_count} fact chips, so no report could be complete")
        end
      end
      issues
    end

    # ---- the privacy-settings panel (ENG-13) ---------------------------------------

    PRIVACY_STATES = %w[open tight].freeze
    PRIVACY_SECRET_KEY = /pass(word)?|secret|credential|token/i.freeze

    # `privacyPanel` runs in the defend stage and closes found facts in its own view (unscored,
    # view-only). Each setting must name facts the scenario declares, so it can never close a fact
    # the board does not know. A fact id may carry the `se_intel_` prefix or not.
    def self.privacy_panel_checks(ctx, ep)
      p = ep['privacyPanel']
      return [err('privacyPanel must be an object { settings, note? }')] unless p.is_a?(Hash)

      issues = []
      stages = ep['stages']
      if check_mission?(ep) || !(stages.is_a?(Array) && stages.include?('defend'))
        issues << err("privacyPanel runs inside the defend stage; this episode's stages #{stages.inspect} have none to host it")
      end
      declared = ctx.social['intelFacts'].is_a?(Hash) ? ctx.social['intelFacts'].keys : []
      settings = p['settings']
      return issues << err('privacyPanel.settings must be a non-empty array') unless settings.is_a?(Array) && !settings.empty?

      seen = []
      settings.each_with_index do |s, i|
        unless s.is_a?(Hash)
          issues << err("privacyPanel.settings[#{i}] must be an object")
          next
        end
        w = "privacyPanel.settings[#{s['id'] || i}]"
        issues << err("#{w} needs a non-empty id") if Mail.blank?(s['id'])
        issues << err("privacyPanel.settings: id '#{s['id']}' is used more than once") if !Mail.blank?(s['id']) && seen.include?(s['id'])
        seen << s['id']
        issues << err("#{w}.label is empty or missing") if Mail.blank?(s['label'])
        if s.key?('default') && !PRIVACY_STATES.include?(s['default'])
          issues << err("#{w}.default #{s['default'].inspect} must be 'open' or 'tight'")
        end
        s.each_key do |k|
          issues << err("#{w}.#{k} looks like a credential field; the panel is a teaching view and never holds one") if k.to_s.match?(PRIVACY_SECRET_KEY)
        end
        closes = s['closesFacts']
        unless closes.is_a?(Array) && !closes.empty?
          issues << err("#{w}.closesFacts must be a non-empty array of se_intel_* fact ids")
          next
        end
        closes.each do |f|
          id = f.is_a?(String) ? f.sub(/\Ase_intel_/, '') : nil
          if id.nil? || id.empty?
            issues << err("#{w}.closesFacts holds an entry that is not a fact id")
          elsif !declared.include?(id)
            issues << err("#{w}.closesFacts: '#{f}' is not a declared social.intelFacts id (#{declared.empty? ? 'none are declared' : declared.join(', ')}); the panel would close nothing")
          end
        end
        dup = closes.select { |f| f.is_a?(String) }.map { |f| f.sub(/\Ase_intel_/, '') }
        issues << warn_("#{w}.closesFacts names the same fact more than once") if dup.uniq.length != dup.length
      end
      issues
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
