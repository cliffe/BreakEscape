# frozen_string_literal: true

# Social lints for the board area (P1-H, phase 1a): 03 N6 for `social.intelBoard.readinessSlots`.
# P3-E adds the defender half of N6 (`social.engagement.defender`, below). The rest of N6 (plan picks, question cards, steps, factMitigations) belongs to the packet that
# builds those board items.
#
# Returns an array of issue strings starting with "❌" (error, fails --strict-social) or "⚠️"
# (warning), in the style of validate_scenario.rb. Runs only when the scenario has a `social` key.
module ValidateSocial
  module Board
    # ctx: ValidateSocial::Context (json, repo_root, valid_item_types, imports, ...)
    def self.check(ctx)
      return [] unless ctx.social.is_a?(Hash)

      defender = defender_checks(ctx)
      board = ctx.social['intelBoard']
      return defender unless board.is_a?(Hash)

      slots = board['readinessSlots']
      return defender if slots.nil? && !board['people'].is_a?(Array)

      issues = defender
      # The board persists its "seen ready" state to se_board_state (00 §11; board-model STATE_KEY);
      # when a board exists it must be declared, or the object is silently not synced to ink (N-1).
      d = Mail.declared_written(ctx, 'se_board_state', 'the intel board recon state')
      issues << d if d
      slots = {} unless slots.is_a?(Hash)
      issues << err('social.intelBoard.readinessSlots must be an object keyed by target id') if board.key?('readinessSlots') && !board['readinessSlots'].is_a?(Hash)

      tmap = Mail.targets(ctx).to_h { |t| [t['id'], t] }
      facts = Mail.facts(ctx)
      prov = Mail.providers(ctx)

      slots.each_key do |tid|
        issues << err("social.intelBoard.readinessSlots.#{tid} is not a social.phishTargets id") unless tmap.key?(tid)
      end

      tmap.each do |tid, t|
        next if Mail.blank?(tid)

        arr = slots[tid]
        where = "social.intelBoard.readinessSlots.#{tid}"
        if !arr.is_a?(Array) || arr.empty?
          issues << err("#{where} is missing or empty; every target needs at least one readiness slot or its card can never read ready")
          next
        end
        needed = Set.new
        arr.each_with_index do |slot, i|
          issues.concat(slot_checks(ctx, slot, "#{where}[#{i}]", facts, needed))
        end
        issues.concat(addressing_in_slots(t, needed, prov, where))
        issues.concat(contacts_in_slots(ctx, tid, needed, where))
      end

      Mail.list(board['people']).each do |pid|
        next if slots.key?(pid)

        issues << err("social.intelBoard.people lists '#{pid}', which has no readinessSlots entry; osint_done could never be reached")
      end
      issues.uniq
    end

    def self.err(msg)
      Mail.err(msg)
    end

    def self.slot_checks(ctx, slot, where, facts, needed)
      return [err("#{where} must be an object")] unless slot.is_a?(Hash)

      issues = []
      %w[label goalString doneString].each do |k|
        issues << err("#{where}.#{k} is empty or missing; the card would show a blank line") if Mail.blank?(slot[k])
      end
      intel = Mail.list(slot['needsIntel'])
      globals = Mail.list(slot['needsGlobal'])
      issues << err("#{where} needs neither needsIntel nor needsGlobal; it would be done from the start") if intel.empty? && globals.empty?
      intel.each do |fid|
        if facts.key?(fid)
          needed << fid
        else
          issues << err("#{where}.needsIntel: '#{fid}' is not a social.intelFacts id")
        end
      end
      globals.each do |g|
        v = ctx.all_globals[g]
        if !ctx.all_globals.key?(g)
          issues << err("#{where}.needsGlobal: '#{g}' is not declared in globalVariables")
        elsif v != true && v != false
          issues << err("#{where}.needsGlobal: '#{g}' is not a boolean (needsGlobal takes booleans only)")
        end
      end
      issues
    end

    # A target's addressedAs forms must be provided by facts inside its slots, so a card never
    # reads ready while the composer has no name to greet the target with.
    def self.addressing_in_slots(target, needed, prov, where)
      Mail.list(target['addressedAs']).filter_map do |form|
        sources = prov[form]
        next if sources.empty? || sources.any? { |f| needed.include?(f) } # no provider at all is a mail.rb error

        err("#{where}: addressedAs '#{form}' is provided only by #{sources.map { |f| "'#{f}'" }.join(', ')}, none of them in this target's readiness slots; " \
            'the card could read ready while the composer has no name form to greet the target with')
      end
    end

    # A contact joined to the target by targetId is revealed by an se_intel_<fact> global; that fact
    # must sit inside the slots, so the card cannot read ready while the contact is unreachable.
    def self.contacts_in_slots(ctx, tid, needed, where)
      Mail.hash_list(Mail.mail_client(ctx)['contacts']).filter_map do |c|
        next unless c['targetId'] == tid

        rb = c['revealedBy']
        next unless rb.is_a?(String) && rb.start_with?('se_intel_')

        fact = rb.delete_prefix('se_intel_')
        next if needed.include?(fact)

        err("#{where}: contact '#{c['id']}' is revealed by '#{rb}', but fact '#{fact}' is not in this target's readiness slots; " \
            'the card could read ready while the contact cannot be reached')
      end
    end

    # ---- 03 N6, defender mode (P3-E) -------------------------------------------

    # `social.engagement.defender.factMitigations` is `[ { intel, options: [ { id, text, good, why } ] } ]`.
    # Each `intel` is a fact with a `reduceNote` (00 section 1), each pick list needs a way to be right
    # and a way to be wrong, and every global the block sets is declared. The mode completes when each
    # fact has a `good` option chosen, so a fact with none could never finish `profile_done`.
    def self.defender_checks(ctx)
      issues = []
      eng = ctx.social['engagement']
      block = eng.is_a?(Hash) ? eng['defender'] : nil
      objects = defender_objects(ctx)
      if block.nil?
        objects.each do |path|
          issues << err("#{path} is a case-file in defender mode, but social.engagement.defender is missing; the board would have nothing to show")
        end
        return issues
      end
      return [err('social.engagement.defender must be an object')] unless block.is_a?(Hash)

      where = 'social.engagement.defender'
      issues << warn_("#{objects[1..].join(', ')}: more than one defender-mode case-file; the contract has one board object per mode") if objects.length > 1
      d = Mail.declared_written(ctx, 'se_board_state', 'the defender mitigation picks are saved there')
      issues << d if d
      issues.concat(defender_globals(ctx, block, where))
      issues.concat(mitigation_checks(ctx, block['factMitigations'], where))
      issues << err("#{where}.indicators must be an array when authored (it is off by default)") if block.key?('indicators') && !block['indicators'].is_a?(Array)
      issues
    end

    def self.warn_(msg)
      Mail.warn_(msg)
    end

    def self.defender_objects(ctx)
      found = []
      Mail.each_object(ctx.json) do |obj, path|
        next unless obj['type'] == 'case-file'

        md = obj['minigameData']
        found << path if md.is_a?(Hash) && md['mode'] == 'defender'
      end
      found
    end

    # onCompleteGlobal (the block's done global) and any step globals: declared and written, not imported.
    def self.defender_globals(ctx, block, where)
      issues = []
      g = block['onCompleteGlobal']
      if Mail.blank?(g)
        issues << err("#{where}.onCompleteGlobal is missing; nothing would record that the defender profile is done, so its task could never complete")
      else
        d = Mail.declared_written(ctx, g, "#{where}.onCompleteGlobal")
        issues << d if d
      end
      return issues unless block.key?('steps')

      unless block['steps'].is_a?(Array)
        return issues << err("#{where}.steps must be an array of { id, onCompleteGlobal }")
      end
      seen = Set.new
      block['steps'].each_with_index do |st, i|
        unless st.is_a?(Hash) && !Mail.blank?(st['id'])
          issues << err("#{where}.steps[#{i}] needs an id")
          next
        end
        issues << err("#{where}.steps: id '#{st['id']}' is used more than once") unless seen.add?(st['id'])
        if Mail.blank?(st['onCompleteGlobal'])
          issues << err("#{where}.steps[#{st['id']}] has no onCompleteGlobal")
        else
          d = Mail.declared_written(ctx, st['onCompleteGlobal'], "#{where}.steps[#{st['id']}].onCompleteGlobal")
          issues << d if d
        end
      end
      issues
    end

    def self.mitigation_checks(ctx, list, where)
      unless list.is_a?(Array) && !list.empty?
        return [err("#{where}.factMitigations is missing or empty; the mode would have nothing to pick and could never complete")]
      end

      issues = []
      facts = Mail.facts(ctx)
      seen = Set.new
      list.each_with_index do |m, i|
        unless m.is_a?(Hash)
          issues << err("#{where}.factMitigations[#{i}] must be an object")
          next
        end
        w = "#{where}.factMitigations[#{m['intel'] || i}]"
        fid = m['intel']
        if Mail.blank?(fid)
          issues << err("#{w} has no intel (the fact id it mitigates)")
        elsif !facts.key?(fid)
          issues << err("#{w}.intel: '#{fid}' is not a social.intelFacts id")
        else
          issues << err("#{w}.intel: fact '#{fid}' has no reduceNote; only a fact with a one-line 'reduce this' prompt can appear in defender mode") if Mail.blank?(facts[fid]['reduceNote'])
          issues << err("#{where}.factMitigations names fact '#{fid}' more than once") unless seen.add?(fid)
        end
        issues.concat(option_checks(m['options'], w))
      end
      issues
    end

    def self.option_checks(opts, w)
      unless opts.is_a?(Array) && opts.length >= 2
        return [err("#{w}.options needs at least two options; one option is not a pick")]
      end

      issues = []
      ids = Set.new
      good = 0
      opts.each_with_index do |o, i|
        unless o.is_a?(Hash)
          issues << err("#{w}.options[#{i}] must be an object")
          next
        end
        ow = "#{w}.options[#{o['id'] || i}]"
        if Mail.blank?(o['id'])
          issues << err("#{w}.options[#{i}] has no id")
        elsif !ids.add?(o['id'])
          issues << err("#{w}.options: id '#{o['id']}' is used more than once")
        end
        issues << err("#{ow}.text is empty; the pick would show a blank button") if Mail.blank?(o['text'])
        issues << err("#{ow}.why is empty; a pick shows what it would and would not fix") if Mail.blank?(o['why'])
        if ![true, false].include?(o['good'])
          issues << err("#{ow}.good must be true or false")
        elsif o['good']
          good += 1
        end
      end
      issues << err("#{w}.options has no option with good: true; the fact could never be mitigated and profile_done could not be reached") if good.zero?
      issues << warn_("#{w}.options: every option is good, so there is no decision to make") if good == opts.length
      issues
    end
  end
end
