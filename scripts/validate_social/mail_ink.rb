# frozen_string_literal: true

# Social lints for ink-driven plain email (README_scenario_design.md "Ink-driven email").
#
# An ink contact is a social.mailClient.contacts entry with an `npc` id. Its ink story is the email
# thread: a run delivers one email, choices become the player's suggested replies, and these tags
# steer it:
#
#   # subject:<text>            the email's subject
#   # attach:<kitId>            a payloadKit item on the email (NPC's) or on the player's message
#   # forward:<messageId>       quote a received message under the player's lines
#   # reply_after:<seconds>     the line that follows is the NPC's reply, delivered after this delay
#   # speaker:player            marks a line as part of the player's message (when no reply_after)
#   # mail_later:<s>:<knot>     a chaser email from the same thread
#   # send_email:<npc>:<knot>[:<s>]   an ink contact starts a thread (from any chat or mail story)
#
# Called from Mail.check. Returns "❌" (error, fails --strict-social) and "⚠️" (warning) strings.
module ValidateSocial
  module MailInk
    JUDGED_VOCAB = /(?<![A-Za-z0-9_])(se_influence|email_landed|email_ok_[A-Za-z]+)/.freeze

    def self.check(ctx)
      mc = Mail.mail_client(ctx)
      contacts = Mail.hash_list(mc['contacts'])
      ink = contacts.select { |c| c['npc'].is_a?(String) }
      issues = []
      stories = {}
      issues.concat(contact_checks(ctx, mc, ink, stories))
      issues.concat(story_checks(ctx, mc, ink, stories))
      issues.concat(reference_checks(ctx, mc, ink, stories))
      issues
    end

    # ---- the contacts themselves ----------------------------------------------

    def self.room_npcs(ctx)
      ValidateSocial.npc_records(ctx.json).select { |n| n['id'].is_a?(String) }.to_h { |n| [n['id'], n] }
    end

    def self.contact_checks(ctx, mc, ink, stories)
      issues = []
      rooms = room_npcs(ctx)
      accounts = Mail.account_ids(ctx)
      seen = {}
      ink.each do |c|
        where = "social.mailClient.contacts[#{c['id']}]"
        npc = c['npc']
        if seen[npc]
          issues << Mail.err("#{where}.npc '#{npc}' is also the npc of contact '#{seen[npc]}'; two contacts cannot share one ink correspondent")
        end
        seen[npc] ||= c['id']
        rec = c['emailRecord']
        room_npc = rooms[npc]
        if rec.is_a?(Hash)
          if Mail.blank?(rec['storyPath'])
            issues << Mail.err("#{where}.emailRecord has no storyPath; the contact's ink story is the email thread")
          else
            src = ValidateSocial.ink_source_path(ctx.repo_root, rec['storyPath'])
            stories[npc] = src if src && File.exist?(src)
          end
          if room_npc
            issues << Mail.err("#{where}.npc '#{npc}' is also the id of an NPC in a room; the server drops the headless emailRecord and a room NPC wins, so give the email its own id")
          end
        elsif room_npc
          issues << Mail.warn_("#{where}.npc '#{npc}' names an existing NPC, so the email thread shares that NPC's ink state with its chat; give the correspondent its own emailRecord")
          src = ValidateSocial.ink_source_path(ctx.repo_root, room_npc['storyPath'])
          stories[npc] = src if src && File.exist?(src)
          if room_npc['voice'] || room_npc['ttsVoice']
            issues << Mail.warn_("#{where}.npc '#{npc}' is a voiced NPC; mail is never voiced, but its story is also voiced as a chat, so any mail knot there would be spoken")
          end
        else
          issues << Mail.err("#{where}.npc '#{npc}' has no emailRecord and is not an NPC in any room or phone list")
        end
        list_ok = ->(key) { c[key].nil? || c[key].is_a?(Array) }
        issues << Mail.err("#{where}.timedEmails must be a list") unless list_ok.call('timedEmails')
        Mail.list(c['timedEmails']).each_with_index do |te, i|
          tw = "#{where}.timedEmails[#{i}]"
          unless te.is_a?(Hash) && !Mail.blank?(te['knot'])
            issues << Mail.err("#{tw} needs a knot")
            next
          end
          issues << Mail.err("#{tw}.account '#{te['account']}' is not a social.mailClient.accounts id") if te['account'] && !accounts.include?(te['account'])
          issues << Mail.err("#{tw}.delaySeconds must be a number of 0 or more") if te.key?('delaySeconds') && !(te['delaySeconds'].is_a?(Numeric) && te['delaySeconds'] >= 0)
          if te['skipIfGlobal'].is_a?(String)
            e = Mail.declared_read(ctx, te['skipIfGlobal'], "skipIfGlobal of #{tw}")
            issues << e if e
          end
        end
        if c['judgedWhen']
          if Mail.blank?(c['targetId'])
            issues << Mail.warn_("#{where}.judgedWhen only matters on a contact that is also a judged target (targetId); it has none")
          else
            e = Mail.declared_read(ctx, c['judgedWhen'], "judgedWhen of #{where}")
            issues << e if e
          end
        end
        issues << Mail.err("#{where}.replyDelaySeconds must be a number of 0 or more") if c.key?('replyDelaySeconds') && !(c['replyDelaySeconds'].is_a?(Numeric) && c['replyDelaySeconds'] >= 0)
        issues << Mail.warn_("#{where} is an ink correspondent with no accountIds; the thread goes to the first account, so say which with accountIds") if Mail.list(c['accountIds']).empty? && accounts.size > 1
      end
      issues
    end

    # ---- the stories ------------------------------------------------------------

    def self.parse(ctx, src)
      Mail.parse_email_story(src, ctx.repo_root)
    end

    def self.story_lines(src)
      ValidateSocial.ink_files(src).flat_map do |f|
        ValidateSocial.ink_lines(f).map { |line, i| [f, i + 1, line.sub(%r{//.*\z}, '')] }
      end
    end

    def self.knot_exists?(parsed, name)
      parsed && parsed[:knots].key?(name.to_s.split('.').first)
    end

    def self.story_checks(ctx, mc, ink, stories)
      issues = []
      kit = Mail.hash_list(mc['payloadKit']).filter_map { |k| k['id'] if k['id'].is_a?(String) }
      seeded = Mail.hash_list(mc['seededMessages']).filter_map { |m| m['id'] if m['id'].is_a?(String) }
      inks = ink.to_h { |c| [c['npc'], c] }
      tmap = Mail.targets(ctx).to_h { |t| [t['id'], t] }
      ink.each do |c|
        npc = c['npc']
        src = stories[npc]
        next unless src

        parsed = parse(ctx, src)
        next unless parsed

        rel = parsed[:rel]
        who = "ink contact '#{c['id']}' story #{rel}"
        story_lines(src).each do |_file, no, code|
          at = "#{who}, line #{no}"
          if code =~ /#\s*attach\s*:\s*([A-Za-z0-9_\-]*)/
            id = Regexp.last_match(1)
            issues << Mail.err("#{at}: # attach:#{id} is not a social.mailClient.payloadKit id") unless kit.include?(id)
          end
          if code =~ /#\s*forward\s*:\s*([A-Za-z0-9_\-]*)/
            id = Regexp.last_match(1)
            issues << Mail.warn_("#{at}: # forward:#{id} is not a seeded message id; the choice is refused unless that message is in the inbox when the player picks it") unless seeded.include?(id)
          end
          issues << Mail.err("#{at}: # subject: has no text") if code =~ /#\s*subject\s*:\s*(?:#|$)/
          if code =~ /#\s*reply_after\s*:\s*([^\s#]*)/
            v = Regexp.last_match(1)
            issues << Mail.err("#{at}: # reply_after:#{v} must be a number of seconds, 0 or more") unless v =~ /\A\d+(\.\d+)?\z/
          end
          if code =~ /#\s*mail_later\s*:\s*[^:\s#]*:\s*([A-Za-z0-9_.]+)/
            knot = Regexp.last_match(1)
            issues << Mail.err("#{at}: # mail_later names knot '#{knot}', which this story does not define") unless knot_exists?(parsed, knot)
          end
          if code =~ /#\s*send_email\s*:\s*([A-Za-z0-9_]+)\s*:\s*([A-Za-z0-9_.]+)/
            issues.concat(send_email_issues(at, Regexp.last_match(1), Regexp.last_match(2), inks, stories, ctx))
          end
          if code =~ /#\s*compose_reply\s*:\s*([A-Za-z0-9_]+)/
            tid = Regexp.last_match(1)
            issues << Mail.err("#{at}: # compose_reply:#{tid} is not a social.phishTargets id") unless tmap.key?(tid)
          end
          issues << Mail.warn_("#{at}: # trigger_minigame in an email story opens over the world the moment the email is delivered, which may be while the player is elsewhere") if code =~ /#\s*trigger_minigame\s*:/
          issues << Mail.warn_("#{at}: #{Regexp.last_match(1)} is judged-phishing vocabulary; an ink contact's story is a plain thread") if code =~ JUDGED_VOCAB && !code.start_with?('//')
        end
        issues.concat(on_compose_checks(c, parsed, who, src))
        Mail.list(c['timedEmails']).each_with_index do |te, i|
          next unless te.is_a?(Hash) && te['knot'].is_a?(String)

          issues << Mail.err("social.mailClient.contacts[#{c['id']}].timedEmails[#{i}].knot '#{te['knot']}' is not a knot in #{rel}") unless knot_exists?(parsed, te['knot'])
        end
        if c['composeKnot'].is_a?(String)
          issues << Mail.err("social.mailClient.contacts[#{c['id']}].composeKnot '#{c['composeKnot']}' is not a knot in #{rel}") unless knot_exists?(parsed, c['composeKnot'])
        end
      end
      issues
    end

    # The compose knot runs headless to its first choices: text before them is dropped.
    def self.on_compose_checks(contact, parsed, who, _src)
      knot = contact['composeKnot'].is_a?(String) ? contact['composeKnot'] : 'on_compose'
      body = parsed[:knots][knot]
      return [] unless body

      body.each do |code|
        s = code.strip
        break if s =~ /\A[*+]/
        next if s.empty? || s =~ /\A(#|~|->|\{|\}|-|VAR|CONST|LIST|<-)/

        return [Mail.warn_("#{who}: knot #{knot} prints text before its first choice (#{s[0, 40].inspect}); Compose runs it headless and drops the text")]
      end
      []
    end

    def self.send_email_issues(at, npc, knot, inks, stories, ctx)
      target = inks[npc]
      return [Mail.err("#{at}: # send_email:#{npc}:#{knot} names '#{npc}', which is not the npc of any ink contact")] unless target

      src = stories[npc]
      return [] unless src

      parsed = parse(ctx, src)
      return [] if knot_exists?(parsed, knot)

      [Mail.err("#{at}: # send_email:#{npc}:#{knot} names knot '#{knot}', which #{parsed[:rel]} does not define")]
    end

    # ---- references from outside the contact's own story ----------------------------

    def self.reference_checks(ctx, mc, ink, stories)
      issues = []
      inks = ink.to_h { |c| [c['npc'], c] }
      acct_ids = Mail.account_ids(ctx)
      contact_names = Mail.hash_list(mc['contacts']).flat_map { |c| [c['id'], c['npc']] }.compact

      # eventMappings[].sendEmail on any NPC
      ValidateSocial.npc_records(ctx.json).each do |npc|
        Mail.list(npc['eventMappings']).each_with_index do |m, i|
          next unless m.is_a?(Hash) && m.key?('sendEmail')

          where = "NPC '#{npc['id']}' eventMappings[#{i}].sendEmail"
          se = m['sendEmail']
          unless se.is_a?(Hash) && !Mail.blank?(se['knot'])
            issues << Mail.err("#{where} needs { knot, npc?, delaySeconds?, account? }")
            next
          end
          who = se['npc'].is_a?(String) ? se['npc'] : npc['id']
          unless inks.key?(who)
            issues << Mail.err("#{where}: '#{who}' is not the npc of any ink contact (social.mailClient.contacts[].npc)")
            next
          end
          issues << Mail.err("#{where}.account '#{se['account']}' is not a social.mailClient.accounts id") if se['account'] && !acct_ids.include?(se['account'])
          src = stories[who]
          next unless src

          parsed = parse(ctx, src)
          issues << Mail.err("#{where}.knot '#{se['knot']}' is not a knot in #{parsed[:rel]}") unless knot_exists?(parsed, se['knot'])
        end
      end

      # every other story in the scenario: # send_email and composeTo
      other = ValidateSocial.npc_story_paths(ctx.json).filter_map do |id, sp|
        next if inks.key?(id) && stories[id]

        src = ValidateSocial.ink_source_path(ctx.repo_root, sp)
        [id, src] if src && File.exist?(src)
      end
      other.each do |id, src|
        story_lines(src).each do |_f, no, code|
          at = "NPC '#{id}' story, line #{no}"
          if code =~ /#\s*send_email\s*:\s*([A-Za-z0-9_]+)\s*:\s*([A-Za-z0-9_.]+)/
            issues.concat(send_email_issues(at, Regexp.last_match(1), Regexp.last_match(2), inks, stories, ctx))
          end
          next unless code =~ /#\s*trigger_minigame\s*:\s*mail_terminal\b[^\n]*?composeTo=([A-Za-z0-9_]+)/

          to = Regexp.last_match(1)
          issues << Mail.err("#{at}: composeTo=#{to} is not a contact id or npc in social.mailClient.contacts") unless contact_names.include?(to)
        end
      end

      # mail_terminal objects: minigameData.composeTo
      Mail.each_object(ctx.json) do |obj, path|
        next unless obj['type'] == 'mail_terminal'

        md = obj['minigameData'].is_a?(Hash) ? obj['minigameData'] : {}
        next unless md.key?('composeTo')

        to = md['composeTo']
        issues << Mail.err("#{path}: minigameData.composeTo '#{to}' is not a contact id or npc in social.mailClient.contacts") unless contact_names.include?(to)
      end
      issues
    end
  end
end
