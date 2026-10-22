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
    STAGES = %w[brief osint write flip defend debrief check].freeze
    STAGES_BY_VARIANT = {
      'full' => %w[brief osint write flip defend debrief],
      'defendOnly' => %w[brief defend debrief]
    }.freeze
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
      set = defend_set(ctx, ep, issues)
      done = nil
      if set
        issues.concat(set_checks(ep, set))
        done = done_global(ep, set)
      end
      issues.concat(conclusion_checks(ctx, ep, done)) if done
      issues.concat(state_global_checks(ctx, id))
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
        unless stages == want
          issues << err("variant '#{ep['variant']}' has stages #{stages.inspect}; it must be #{want.inspect}")
        end
      else
        issues << err("variant '#{ep['variant']}' must be full or defendOnly")
      end
      issues
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
      issues << err("attack.maxMessages is #{atk['maxMessages'].inspect}; it must be 1 (one send, then the flip)") unless atk['maxMessages'] == 1
      issues << err("attack.scored is #{atk['scored'].inspect}; it must be false (the write stage is never scored)") unless atk['scored'] == false

      target = atk['target']
      targets = Mail.hash_list(ctx.social['phishTargets'])
      found = targets.find { |t| t['id'] == target }
      if Mail.blank?(target) || found.nil?
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
      issues << err('attack.accountIds is empty; the mail client would open with no account') if Array(atk['accountIds']).empty?
      if atk.key?('defaultAccount') && !Array(atk['accountIds']).include?(atk['defaultAccount'])
        issues << err("attack.defaultAccount '#{atk['defaultAccount']}' is not in attack.accountIds")
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

      count = Array(set['messages']).length
      if check_mission?(ep)
        issues << err("#{where} has #{count} message(s); a check form has #{CHECK_MESSAGES}") unless count == CHECK_MESSAGES
      else
        unless EPISODE_MESSAGES.cover?(count)
          issues << err("#{where} has #{count} message(s); an episode's defend set has #{EPISODE_MESSAGES.first} to #{EPISODE_MESSAGES.last}")
        end
        want = "episode_#{ep['id']}_defend_"
        prefix = set.dig('outcome', 'setGlobalPrefix')
        if prefix != want
          issues << err("#{where} outcome.setGlobalPrefix is #{prefix.inspect}; it must be '#{want}', so its done global is '#{want}done'")
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

    def self.state_global_checks(ctx, id)
      ["episode_#{id}_state", 'se_awareness_records'].filter_map do |name|
        v = ctx.all_globals[name]
        next if v.is_a?(Hash) && v.empty?

        if ctx.all_globals.key?(name)
          err("global '#{name}' is declared as #{v.inspect}; it must be {} (an object that starts empty)")
        else
          err("global '#{name}' is not declared in globalVariables; declare it as {} (an undeclared name is not saved)")
        end
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
