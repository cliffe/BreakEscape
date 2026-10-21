# frozen_string_literal: true

# Social lints for the board area (P1-H, phase 1a): 03 N6 for `social.intelBoard.readinessSlots`.
# The rest of N6 (plan picks, question cards, steps, factMitigations) belongs to the packet that
# builds those board items.
#
# Returns an array of issue strings starting with "❌" (error, fails --strict-social) or "⚠️"
# (warning), in the style of validate_scenario.rb. Runs only when the scenario has a `social` key.
module ValidateSocial
  module Board
    # ctx: ValidateSocial::Context (json, repo_root, valid_item_types, imports, ...)
    def self.check(ctx)
      return [] unless ctx.social.is_a?(Hash)

      board = ctx.social['intelBoard']
      return [] unless board.is_a?(Hash)

      slots = board['readinessSlots']
      return [] if slots.nil? && !board['people'].is_a?(Array)

      issues = []
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
      issues
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
  end
end
