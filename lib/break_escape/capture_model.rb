# frozen_string_literal: true

require 'set'

module BreakEscape
  # Capture routes and capture proofs (docs/achitechture/PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md,
  # section 6), read from the authored scenario.
  #
  # A capture writer is any action object with "type": "add_capture" and any mapping with an
  # "addCapture", wherever it sits: triggerOnInteract, confirm_action's onConfirm at any depth,
  # timers, onPickup, onOwnerNoticesMissing, interaction warnings, flag rewards, NPC event
  # mappings. The walk covers the whole scenario rather than a list of known keys, so a new kind
  # of action list cannot be missed.
  #
  # A capture proof is keyed by account: a list `captureProof` on the account holder NPC, or the
  # shorthand `"proof"` inside an NPC mapping's `addCapture`, which counts for the account whose
  # username equals the capture's address, or, with no address, for the NPC carrying the mapping.
  #
  # Plain Ruby, no ActiveSupport, so scripts/validate_scenario.rb can require_relative it and agree
  # with the server.
  module CaptureModel
    module_function

    PROOF_KINDS = %w[planted dropped session].freeze

    def present_string?(value)
      value.is_a?(String) && !value.strip.empty?
    end

    def normalise_username(value)
      value.to_s.strip.downcase[0, 64]
    end

    # Yields (capture_hash, kind, path, owner) for every capture writer in the scenario:
    # kind :action for an add_capture action (capture_hash is its `capture`), :mapping for a
    # mapping's addCapture. owner is the nearest enclosing hash that carries eventMappings (an
    # NPC), or nil.
    def each_capture_writer(data, &block)
      return enum_for(:each_capture_writer, data) unless block

      walk = lambda do |node, path, owner|
        case node
        when Hash
          here_owner = node['eventMappings'].is_a?(Array) ? node : owner
          if node['type'] == 'add_capture' && node['capture'].is_a?(Hash)
            yield node['capture'], :action, path, here_owner
          end
          yield node['addCapture'], :mapping, "#{path}/addCapture", here_owner if node['addCapture'].is_a?(Hash)
          node.each { |key, value| walk.call(value, "#{path}/#{key}", here_owner) }
        when Array
          node.each_with_index { |value, idx| walk.call(value, "#{path}[#{idx}]", owner) }
        end
      end
      walk.call(data, '', nil)
    end

    # [{ target_id:, kind:, path: }] for each capture writer with a target id.
    def capture_writers(data)
      each_capture_writer(data).filter_map do |capture, kind, path, _owner|
        id = capture['targetId']
        { target_id: id, kind: kind, path: path } if present_string?(id)
      end
    end

    # The target ids a capture entry may legitimately carry: a phish target whose landing page
    # carries the capture (or which carries a foothold), the targetId of an addCapture mapping,
    # of an NPC's usePayload, or of an add_capture action.
    def declared_target_ids(data)
      ids = capture_writers(data).map { |w| w[:target_id] }
      room_npc_list(data).each do |npc|
        payload = npc['usePayload']
        ids << payload['targetId'] if payload.is_a?(Hash) && present_string?(payload['targetId'])
      end
      (ids + phish_target_ids(data)).uniq
    end

    # Every phish target id: a link kit can land on any of them, and the mail bridge records a
    # credential for the target (with its own address when the page carries no capture) or a
    # foothold for one that carries one. phishTargets is a list, or a map whose values are the
    # targets (each still named by its own id), as mail-bridge.js resolveTarget reads it. The
    # single-secret fallback answers only for these, and only when one landing page carries a
    # secret.
    def phish_target_ids(data)
      social = data.is_a?(Hash) ? data['social'] : nil
      return [] unless social.is_a?(Hash)

      list = social['phishTargets']
      targets = list.is_a?(Hash) ? list.values : Array(list)
      targets.filter_map { |target| target['id'] if target.is_a?(Hash) && present_string?(target['id']) }.uniq
    end

    def room_npc_list(data)
      rooms = data.is_a?(Hash) ? data['rooms'] : nil
      return [] unless rooms.is_a?(Hash)

      rooms.values.flat_map do |room|
        room.is_a?(Hash) && room['npcs'].is_a?(Array) ? room['npcs'].select { |npc| npc.is_a?(Hash) } : []
      end
    end

    def account_holder?(npc)
      creds = npc.is_a?(Hash) ? npc['creds'] : nil
      creds.is_a?(Hash) && present_string?(creds['username'])
    end

    # Every shorthand proof: [{ proof:, holder: (the account holder NPC or nil), path: }].
    def shorthand_proofs(data)
      holders = room_npc_list(data).select { |npc| account_holder?(npc) }
      by_username = holders.to_h { |npc| [normalise_username(npc['creds']['username']), npc] }
      each_capture_writer(data).filter_map do |capture, kind, path, owner|
        next unless kind == :mapping && capture.key?('proof')

        holder = if present_string?(capture['address'])
                   by_username[normalise_username(capture['address'])]
        elsif owner && holders.any? { |npc| npc.equal?(owner) }
                   owner
        end
        { proof: capture['proof'], holder: holder, path: "#{path}/proof" }
      end
    end

    # Every add_capture action carrying a proof (the validator refuses these).
    def action_proofs(data)
      each_capture_writer(data).filter_map do |capture, kind, path, _owner|
        { proof: capture['proof'], path: "#{path}/proof" } if kind == :action && capture.key?('proof')
      end
    end

    # The proofs that count for this account holder: its own captureProof list and every
    # shorthand that resolves to it.
    def proofs_for(npc, data)
      own = npc.is_a?(Hash) && npc['captureProof'].is_a?(Array) ? npc['captureProof'] : []
      own = own.select { |p| p.is_a?(Hash) }
      own + shorthand_proofs(data).filter_map { |s| s[:proof] if s[:holder].equal?(npc) && s[:proof].is_a?(Hash) }
    end

    # A scenario declares proofs when any NPC has captureProof or any mapping's addCapture has proof.
    def declares_proofs?(data)
      return true if room_npc_list(data).any? { |npc| npc.key?('captureProof') }

      each_capture_writer(data).any? { |capture, kind, _path, _owner| kind == :mapping && capture.key?('proof') }
    end

    LOCK_CODE_TYPES = %w[password pin].freeze

    # Every code of a password or PIN lock anywhere in the scenario (rooms, doors, objects and
    # their contents at any depth, NPC items, granted items, timers), as strings.
    def lock_codes(data)
      out = Set.new
      walk = lambda do |node|
        case node
        when Hash
          req = node['requires']
          if LOCK_CODE_TYPES.include?(node['lockType']) && (req.is_a?(String) || req.is_a?(Integer))
            code = req.to_s
            out << code unless code.strip.empty?
          end
          node.each_value { |value| walk.call(value) }
        when Array
          node.each { |value| walk.call(value) }
        end
      end
      walk.call(data)
      out
    end

    # Whether this account holder's password is also the code of a password or PIN lock, so a
    # served password opens that lock. codes: lock_codes(data), passed in when checking many
    # accounts.
    def password_opens_lock?(npc, data, codes = nil)
      password = npc.is_a?(Hash) && npc['creds'].is_a?(Hash) ? npc['creds']['password'] : nil
      return false unless present_string?(password)

      (codes || lock_codes(data)).include?(password)
    end

    # The proof's kind ('planted', 'dropped' or 'session') or nil for a malformed proof.
    def proof_kind(proof)
      return nil unless proof.is_a?(Hash)

      kinds = PROOF_KINDS.select { |k| present_string?(proof[k]) }
      kinds.length == 1 ? kinds.first : nil
    end

    # Whether a remove_item action list (at any depth of confirm_action onConfirm) names the item.
    def removes_item?(actions, names)
      return false unless actions.is_a?(Array)

      actions.any? do |action|
        next false unless action.is_a?(Hash)

        if action['type'] == 'remove_item'
          (Array(action['item']).map(&:to_s) & names).any?
        elsif action['type'] == 'confirm_action'
          removes_item?(action['onConfirm'], names)
        else
          false
        end
      end
    end

    # Whether a room object takes this item when used: it has a triggerOnInteract list, its
    # requiresItem names the item (by id, type or name, as interactions.js matches) and it
    # consumes it (consumesItem, or a remove_item naming it in that list).
    def object_takes_item?(obj, item)
      return false unless obj.is_a?(Hash) && item.is_a?(Hash)
      # An object added to a room with no server-known source is a bare client hash
      # stamped clientAdded (ItemIdentity::CLIENT_ADDED_MARKER, via Game#add_item_to_room!);
      # its type/name are client-chosen, so it must never satisfy a plant target's
      # requiresItem (code review R2, B1). Literal to keep this file ActiveSupport-free
      # for the validator (validate_capture_log.rb requires it alone).
      return false if item['clientAdded'] == true

      names = %w[id type name].filter_map { |k| item[k].to_s if present_string?(item[k].to_s) }
      return false if names.empty?

      wanted = Array(obj['requiresItem']).map(&:to_s)
      return false if (wanted & names).empty?

      # The client consumes an item only inside its triggerOnInteract branch
      # (interactions.js, hasTriggerOnInteract: an array), so consumesItem counts only there.
      return false unless obj['triggerOnInteract'].is_a?(Array)

      obj['consumesItem'] == true || removes_item?(obj['triggerOnInteract'], names)
    end
  end
end
