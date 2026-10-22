# frozen_string_literal: true

# Social lints for the late options (MECHANICS_AUDIT packet M3): options added in the lab's fix
# rounds after their area's lints were written, each read by one engine function that ignores a
# wrong value without a word.
#
#   hintsByFactor     social.phishTargets[].hintsByFactor   systems/phish-rules.js selectFactorHint
#   labelBy           social.engagement.report.labelBy      engagement-report/report-model.js targetNameResolver
#   checklistTiming   social.mailClient.checklistTiming     mail-client-minigame.js _checklistTiming
#   mirrorToBehavior  social.characters.<id>.mirrorToBehavior  systems/social-influence.js _mirror
#   lockedHint        rooms, rooms[].doors[], rooms[].objects[]  utils/locked-hint.js, unlock-system.js
#
# lockedHint is engine-wide (doors.js, unlock-system.js), so Options.locked_hints runs for every
# scenario; the rest run only when the scenario has a `social` key. No shipped mission authors
# lockedHint, so their output is unchanged.
module ValidateSocial
  module Options
    # phish-rules.js FACTOR_ORDER. `open` is a gate, not a factor, and never gets a keyed hint.
    HINT_FACTORS = %w[senderTrust senderAuth addressedTo pretextRelevant attachmentPlausible
                      urgencyCalibrated linkCredible].freeze
    # The variant keys selectFactorHint reads from an object value, per factor. Any other factor
    # reads h.spoof || h.forced.
    HINT_VARIANTS = {
      'senderTrust' => %w[spoof ownFrom forced],
      'linkCredible' => %w[missing wrong]
    }.freeze
    HINT_VARIANTS_OTHER = %w[spoof forced].freeze
    LABEL_BY = %w[name role].freeze
    CHECKLIST_TIMINGS = %w[onSend withReply].freeze
    BODY_MODES = %w[templates freeText].freeze

    def self.check(ctx)
      return [] unless ctx.social.is_a?(Hash)

      issues = []
      issues.concat(hints_by_factor(ctx))
      issues.concat(label_by(ctx))
      issues.concat(checklist_timing(ctx))
      issues.concat(body_mode(ctx))
      issues.concat(mirror_to_behavior(ctx))
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

    # ---- hintsByFactor ---------------------------------------------------------

    # The factors selectFactorHint can be asked about for this target: it is called only with the
    # first failed *required* factor (phish-rules.js evaluateMessage, failedRequired[0]).
    # listedMode: factors[] (mode 'required', else advisory), then requiredFactors, advisoryFactors.
    # modeFor: urgencyCalibrated is never required; linkCredible with an expectedLink is required
    # unless listed advisory.
    def self.required_factors(t)
      listed = {}
      if t['factors'].is_a?(Array)
        t['factors'].each do |f|
          next unless f.is_a?(Hash) && f['id'].is_a?(String) && !listed.key?(f['id'])

          listed[f['id']] = f['mode'] == 'required' ? 'required' : 'advisory'
        end
      end
      Mail.list(t['requiredFactors']).each { |id| listed[id] ||= 'required' if id.is_a?(String) }
      Mail.list(t['advisoryFactors']).each { |id| listed[id] ||= 'advisory' if id.is_a?(String) }
      req = listed.select { |_, m| m == 'required' }.keys.to_set
      req.delete('urgencyCalibrated')
      req << 'linkCredible' if t['expectedLink'] && !listed.key?('linkCredible')
      req
    end

    def self.hints_by_factor(ctx)
      issues = []
      Mail.targets(ctx).each_with_index do |t, i|
        next unless t.key?('hintsByFactor')

        where = "social.phishTargets[#{t['id'] || i}].hintsByFactor"
        hbf = t['hintsByFactor']
        unless hbf.is_a?(Hash)
          issues << err("#{where} must be an object keyed by factor id (got #{type_name(hbf)}); the judge ignores anything else and falls back to the hints ladder")
          next
        end
        required = required_factors(t)
        hbf.each do |factor, hint|
          next if factor.start_with?('_')

          unless HINT_FACTORS.include?(factor)
            issues << err("#{where} has the key '#{factor}', which is not a factor id " \
                          "(allowed: #{HINT_FACTORS.join(', ')}); the hint would never be shown")
            next
          end
          unless required.include?(factor)
            issues << warn_("#{where}.#{factor}: this target does not require '#{factor}', and a keyed hint is shown only for " \
                            'the first failed required factor, so it would never be shown')
          end
          issues.concat(hint_value(hint, factor, "#{where}.#{factor}"))
        end
      end
      issues
    end

    def self.hint_value(hint, factor, where)
      if hint.is_a?(String)
        return blank?(hint) ? [err("#{where} is empty; a hint stage would show nothing")] : []
      end
      unless hint.is_a?(Hash)
        return [err("#{where} must be a hint string or an object of variants (got #{type_name(hint)}); the judge ignores it")]
      end

      allowed = HINT_VARIANTS.fetch(factor, HINT_VARIANTS_OTHER)
      issues = []
      hint.each do |k, v|
        next if k.start_with?('_')

        if !allowed.include?(k)
          issues << err("#{where} has the variant '#{k}', which the judge never reads (allowed for #{factor}: #{allowed.join(', ')})")
        elsif blank?(v)
          issues << err("#{where}.#{k} must be a non-empty string (got #{type_name(v)})")
        end
      end
      if factor == 'senderTrust' && !hint['spoof'].is_a?(String)
        issues << warn_("#{where} has no 'spoof' variant; a send whose From line was set by hand would fall back to the hints ladder")
      end
      if allowed.none? { |k| hint[k].is_a?(String) && !blank?(hint[k]) }
        issues << err("#{where} has none of the variants #{allowed.join(', ')}; the hint would never be shown")
      end
      issues
    end

    # ---- labelBy ---------------------------------------------------------------

    def self.label_by(ctx)
      report = ctx.social.dig('engagement', 'report')
      return [] unless report.is_a?(Hash) && report.key?('labelBy')

      where = 'social.engagement.report.labelBy'
      v = report['labelBy']
      unless LABEL_BY.include?(v)
        return [err("#{where} is #{v.inspect}; it must be \"role\" (label result rows by role) or \"name\" (the default). " \
                    'Any other value labels by name')]
      end
      return [] unless v == 'role'

      # role: the target's role, else its contact's role, else the name (report-model.js)
      contacts = Mail.hash_list(Mail.mail_client(ctx)['contacts'])
      Mail.targets(ctx).filter_map do |t|
        next unless t['id'].is_a?(String)

        contact = contacts.find { |c| c['targetId'] == t['id'] }
        next if !blank?(t['role']) || (contact && !blank?(contact['role']))

        warn_("#{where} is \"role\", but social.phishTargets[#{t['id']}] has no role and no contact with one; " \
              'its result row falls back to the person\'s name')
      end
    end

    # ---- checklistTiming -------------------------------------------------------

    def self.checklist_timing(ctx)
      mc = ctx.social['mailClient']
      return [] unless mc.is_a?(Hash) && mc.key?('checklistTiming')

      v = mc['checklistTiming']
      return [] if CHECKLIST_TIMINGS.include?(v)

      [err("social.mailClient.checklistTiming is #{v.inspect}; it must be \"onSend\" (the default) or \"withReply\". " \
           'Any other value means the send checklist is never shown')]
    end

    # ---- bodyMode / freeTextFlavour --------------------------------------------

    # The composer shows the unscored free-text box when bodyMode is "freeText" or
    # freeTextFlavour is true (mail-composer.js freeTextEnabled). Either way the box is
    # flavour: never judged, never read by the ink (00 §13). The lint only guards the two
    # keys; the "no ink reads it" rule holds structurally, since no scenario field routes
    # the free text anywhere (the engine writes no global or ink VAR from it).
    def self.body_mode(ctx)
      mc = ctx.social['mailClient']
      return [] unless mc.is_a?(Hash)

      issues = []
      if mc.key?('bodyMode')
        v = mc['bodyMode']
        unless BODY_MODES.include?(v)
          issues << err("social.mailClient.bodyMode is #{v.inspect}; it must be \"templates\" (the default, scored template parts only) " \
                        'or "freeText" (the template parts plus an unscored free-text box). Any other value is read as "templates"')
        end
      end
      if mc.key?('freeTextFlavour')
        f = mc['freeTextFlavour']
        unless f == true || f == false
          issues << err("social.mailClient.freeTextFlavour must be true or false (got #{type_name(f)}); the composer treats anything but true as off")
        end
        if f == true && mc['bodyMode'] == 'templates'
          issues << warn_('social.mailClient.freeTextFlavour is true but bodyMode is "templates"; the free-text box still shows. ' \
                          'Set bodyMode to "freeText" (or drop it) so the two keys agree')
        end
      end
      issues
    end

    # ---- mirrorToBehavior ------------------------------------------------------

    def self.mirror_to_behavior(ctx)
      issues = []
      person_ids = person_npc_ids(ctx.json)
      ValidateSocial.characters_hash(ctx).each do |id, ch|
        next unless ch.key?('mirrorToBehavior')

        where = "social.characters.#{id}.mirrorToBehavior"
        v = ch['mirrorToBehavior']
        unless v == true || v == false
          issues << err("#{where} must be true or false (got #{v.inspect}); the service treats anything but true as off")
          next
        end
        next unless v

        npc = ch['channels'].is_a?(Hash) ? ch['channels']['person'] : nil
        if !npc.is_a?(String) || npc.empty?
          issues << err("#{where} is true, but social.characters.#{id}.channels has no 'person' NPC; there is no behaviour to mirror the influence to")
        elsif !person_ids.include?(npc)
          issues << err("#{where} is true, but channels.person '#{npc}' is not an NPC in any room; there is no behaviour to mirror the influence to")
        end
      end
      issues
    end

    def self.person_npc_ids(json)
      ids = Set.new
      ValidateSocial.rooms(json).each_value do |room|
        Array(room['npcs']).each { |n| ids << n['id'] if n.is_a?(Hash) && n['id'].is_a?(String) }
      end
      ids
    end

    # ---- lockedHint (every scenario) ---------------------------------------------

    # The hint is appended to the "Requires key" and wrong-key alerts only (unlock-system.js case
    # 'key', minigame-starters.js key selection). getLockedHint returns '' for a non-string.
    def self.locked_hints(json)
      issues = []
      ValidateSocial.rooms(json).each do |room_id, room|
        issues.concat(locked_hint_on(room, "/rooms/#{room_id}"))
        Array(room['doors']).each_with_index do |d, i|
          issues.concat(locked_hint_on(d, "/rooms/#{room_id}/doors[#{i}]", fallback: room)) if d.is_a?(Hash)
        end
        Array(room['objects']).each_with_index do |o, i|
          issues.concat(locked_hint_objects(o, "/rooms/#{room_id}/objects[#{i}]"))
        end
      end
      issues
    end

    def self.locked_hint_objects(obj, path)
      return [] unless obj.is_a?(Hash)

      issues = locked_hint_on(obj, path)
      Array(obj['contents']).each_with_index { |c, i| issues.concat(locked_hint_objects(c, "#{path}/contents[#{i}]")) }
      issues
    end

    # fallback: a door definition reads locked/lockType from the connected room when it has none.
    def self.locked_hint_on(lockable, path, fallback: nil)
      return [] unless lockable.key?('lockedHint')

      hint = lockable['lockedHint']
      if !hint.is_a?(String) || hint.strip.empty?
        return ["❌ SOCIAL: #{path} lockedHint must be a non-empty string (got #{type_name(hint)}); " \
                'the engine drops anything else and shows the plain "Requires key" line']
      end
      locked = lockable.key?('locked') ? lockable['locked'] : fallback&.dig('locked')
      lock_type = lockable['lockType'] || fallback&.dig('lockType')
      if locked != true
        ["⚠️ SOCIAL: #{path} has a lockedHint but is not locked; the hint is shown only on a locked key lock"]
      elsif lock_type != 'key'
        ["⚠️ SOCIAL: #{path} has a lockedHint but its lockType is #{lock_type.inspect}; the hint is shown only for a key lock"]
      else
        []
      end
    end

    def self.type_name(v)
      case v
      when nil then 'null'
      when true, false then 'a boolean'
      when Numeric then 'a number'
      when String then v.strip.empty? ? 'an empty string' : 'a string'
      when Array then 'an array'
      when Hash then 'an object'
      else v.class.name
      end
    end
  end
end
