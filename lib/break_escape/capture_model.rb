# frozen_string_literal: true

require 'set'
# Step 2b: author_notes (and, through it, scenario_schema) so each_capture_writer can skip notes.
require_relative 'author_notes' unless defined?(BreakEscape::AuthorNotes)

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

    # The two capture kinds a client entry may carry, mirroring captures.js CAPTURE_KINDS. A
    # missing or unknown kind counts as credential (makeCaptureEntry does the same), so the two
    # sides never disagree about an authored writer.
    CAPTURE_KINDS = %w[credential foothold].freeze

    # Capture string limits (sync deltas R2, 6a). The validator reports an authored capture
    # string over its limit; record_capture! refuses a client string over it. Measured in code
    # points (Ruby String#length counts code points for valid UTF-8).
    MAX_CAPTURE_NOTE_CHARS = 2000
    MAX_CAPTURE_FIELD_CHARS = 200
    MAX_CAPTURE_TARGET_CHARS = 100

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
    # Step 2b: notes: :skip (the default) skips a writer an author parked in a "_" note, so such
    # a writer never widens the target ids the server accepts, never serves or shadows a secret,
    # and never turns proof-gating on or satisfies it. notes: :visit visits notes too, which the
    # withholding callers (item 4) pass. Free data holds no notes and is visited either way.
    def each_capture_writer(data, notes: :skip, &block)
      return enum_for(:each_capture_writer, data, notes: notes) unless block

      walk = lambda do |node, snode, path, owner|
        case node
        when Hash
          here_owner = node['eventMappings'].is_a?(Array) ? node : owner
          if node['type'] == 'add_capture' && node['capture'].is_a?(Hash)
            yield node['capture'], :action, path, here_owner
          end
          yield node['addCapture'], :mapping, "#{path}/addCapture", here_owner if node['addCapture'].is_a?(Hash)
          node.each do |key, value|
            ks = key.to_s
            next if notes == :skip && AuthorNotes.note?(snode, ks)

            walk.call(value, ScenarioSchema.child(snode, ks), "#{path}/#{ks}", here_owner)
          end
        when Array
          inode = ScenarioSchema.item(snode)
          node.each_with_index { |value, idx| walk.call(value, inode, "#{path}[#{idx}]", owner) }
        end
      end
      walk.call(data, ScenarioSchema.root, '', nil)
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

    # The lock types whose requires value grants hard access if known: a password or PIN code,
    # and the card/owner value an RFID or biometric lock accepts.
    HARD_ACCESS_LOCK_TYPES = %w[password pin rfid biometric].freeze

    # Every value that grants hard access if known, as strings: the code of a password or PIN
    # lock, the requires of an RFID or biometric lock, a Wi-Fi PSK, or a flag value. A capture
    # secret equal to one of these is never served on the capture record alone (the server's
    # authored_capture_secret withholds it). A secret that opens nothing is not in this set.
    def hard_access_values(data)
      out = Set.new
      add = lambda do |value|
        Array(value).each do |v|
          out << v.to_s if (v.is_a?(String) || v.is_a?(Integer)) && !v.to_s.strip.empty?
        end
      end

      walk = lambda do |node|
        case node
        when Hash
          add.call(node['requires']) if HARD_ACCESS_LOCK_TYPES.include?(node['lockType'])
          node.each_value { |value| walk.call(value) }
        when Array
          node.each { |value| walk.call(value) }
        end
      end
      walk.call(data)

      networks = data.is_a?(Hash) ? data['networks'] : nil
      if networks.is_a?(Hash)
        networks.each_value do |net|
          wifi = net.is_a?(Hash) ? net['wifi'] : nil
          add.call(wifi['psk']) if wifi.is_a?(Hash)
        end
      end

      flags = data.is_a?(Hash) ? data['flags'] : nil
      if flags.is_a?(Hash)
        flags.each_value { |group| group.each_value { |v| add.call(v) } if group.is_a?(Hash) }
      end

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

    # --- Server-owned capture record (sync deltas R2, 6a) -------------------------------------

    # Whether this scenario reveals a captured secret (social.captures.revealSecret). A pure
    # copy of Game#reveal_capture_secret?, so shared_login_capture composes the same note the
    # heard answer does.
    def reveal_secret?(data)
      social = data.is_a?(Hash) ? data['social'] : nil
      cap = social.is_a?(Hash) ? social['captures'] : nil
      cap.is_a?(Hash) && cap['revealSecret'] == true
    end

    # The target ids a client capture may legitimately carry: the authored writers, usePayload
    # targets and phish targets. Heard-share ids are not in it (the server records those itself).
    def client_target_ids(data)
      declared_target_ids(data)
    end

    # One capture entry's fields, built as the honest client's makeCaptureEntry builds them
    # (captures.js): only the closed keys, the kind defaulted to credential, blank strings
    # dropped, no secret. Returns nil without a present targetId.
    def capture_entry_fields(raw)
      return nil unless raw.is_a?(Hash) && present_string?(raw['targetId'])

      kind = CAPTURE_KINDS.include?(raw['kind']) ? raw['kind'] : 'credential'
      out = { 'targetId' => raw['targetId'], 'kind' => kind }
      %w[roleLabel address host note].each { |k| out[k] = raw[k] if present_string?(raw[k]) }
      out
    end

    def landing_pages(data)
      social = data.is_a?(Hash) ? data['social'] : nil
      list = social.is_a?(Hash) ? social['landingPages'] : nil
      return list if list.is_a?(Array)

      list.is_a?(Hash) ? list.values : []
    end

    def landing_page_capture(data, page_id)
      page = landing_pages(data).find { |p| p.is_a?(Hash) && p['id'] == page_id }
      page.is_a?(Hash) && page['capture'].is_a?(Hash) ? page['capture'] : nil
    end

    def phish_targets(data)
      social = data.is_a?(Hash) ? data['social'] : nil
      list = social.is_a?(Hash) ? social['phishTargets'] : nil
      list.is_a?(Hash) ? list.values : Array(list)
    end

    def phish_target(data, target_id)
      phish_targets(data).find { |t| t.is_a?(Hash) && t['id'] == target_id }
    end

    # { pageId => { address:, kits: [kitIds] } } for every landing page a link kit in
    # social.mailClient.payloadKit names (part 2 evidence; here used to build phish credential
    # candidates, one per such page).
    def page_evidence_kits(data)
      social = data.is_a?(Hash) ? data['social'] : nil
      mail_client = social.is_a?(Hash) ? social['mailClient'] : nil
      kits = mail_client.is_a?(Hash) ? mail_client['payloadKit'] : nil
      out = {}
      Array(kits).each do |kit|
        next unless kit.is_a?(Hash) && kit['kind'] == 'link' && present_string?(kit['landingPageId'])

        page_id = kit['landingPageId']
        entry = (out[page_id] ||= { address: nil, kits: [] })
        entry[:kits] << kit['id'] if present_string?(kit['id'])
      end
      out.each do |page_id, info|
        cap = landing_page_capture(data, page_id)
        info[:address] = cap['address'] if cap.is_a?(Hash) && present_string?(cap['address'])
      end
      out
    end

    def owner_id_of(owner)
      owner.is_a?(Hash) ? owner['id'] : nil
    end
    private_class_method :owner_id_of

    # A capture whose owner NPC holds an account, authored with no address, takes the account's
    # username as its address: the server owns the record, and both readers key an account
    # holder's secret on entry['address'] (capture_secrets_for_client's by_username and
    # NetworkAccess#account_capture_usernames), so the username is the address the server stores.
    # Only a self-capture (the writer's targetId is the owner's own id) takes the owner's
    # username (review 6a-server M2). A writer on account holder A that captures a different
    # target B must author an explicit address, or the server would bind A's username to B
    # and serve A's password for B. The validator errors when that address is missing, so a
    # scoped-out default here fails loudly at authoring time, not silently at serve time.
    def default_account_address!(fields, owner)
      return if present_string?(fields['address'])
      return unless account_holder?(owner)
      return unless owner_id_of(owner).to_s == fields['targetId'].to_s

      username = owner['creds']['username']
      fields['address'] = username if present_string?(username)
    end
    private_class_method :default_account_address!

    # Every capture entry the scenario could write for any target: an add_capture action or
    # addCapture mapping (plain, and overlaid with the owner NPC's usePayload where it has one,
    # payload wins), a phish credential (one per named landing page) and a phish foothold. Each
    # { fields:, source: }; source[:overlaid] marks an overlaid candidate so record_capture!
    # prefers a plain one.
    def all_capture_candidates(data)
      out = []
      each_capture_writer(data) do |capture, kind, path, owner|
        base = capture_entry_fields(capture)
        if base
          default_account_address!(base, owner)
          out << { fields: base, source: { writer: path, proof: capture['proof'], owner: owner_id_of(owner), overlaid: false } }
        end

        next unless kind == :mapping && owner.is_a?(Hash) && owner['usePayload'].is_a?(Hash)

        overlaid = capture_entry_fields(capture.merge(owner['usePayload']))
        next unless overlaid

        default_account_address!(overlaid, owner)
        out << { fields: overlaid,
                 source: { writer: "#{path}+payload:#{owner_id_of(owner)}", proof: capture['proof'],
                           owner: owner_id_of(owner), payload_owner: owner_id_of(owner), overlaid: true } }
      end

      # An NPC whose usePayload carries its own targetId is a standalone writer (usepayload_captures
      # "with its own targetId the payload fills that one"), with no addCapture mapping to overlay.
      room_npc_list(data).each do |npc|
        payload = npc['usePayload']
        next unless payload.is_a?(Hash) && present_string?(payload['targetId'])

        fields = capture_entry_fields(payload)
        next unless fields

        default_account_address!(fields, npc)
        out << { fields: fields,
                 source: { writer: "/usePayload:#{owner_id_of(npc)}", owner: owner_id_of(npc),
                           payload_owner: owner_id_of(npc), overlaid: true } }
      end

      phish_target_ids(data).each do |target_id|
        target = phish_target(data, target_id)
        role = target && present_string?(target['role']) ? target['role'] : nil
        page_evidence_kits(data).each do |page_id, info|
          cap = landing_page_capture(data, page_id)
          address = cap && present_string?(cap['address']) ? cap['address'] : (target && present_string?(target['address']) ? target['address'] : nil)
          note = cap && present_string?(cap['note']) ? cap['note'] : nil
          fields = capture_entry_fields({ 'targetId' => target_id, 'kind' => 'credential', 'roleLabel' => role, 'address' => address, 'note' => note })
          out << { fields: fields, source: { page: page_id, kits: info[:kits], overlaid: false } } if fields
        end

        foothold = target && target['foothold'].is_a?(Hash) ? target['foothold'] : nil
        next unless foothold

        fields = capture_entry_fields({ 'targetId' => target_id, 'kind' => 'foothold', 'roleLabel' => role, 'host' => foothold['host'], 'note' => foothold['note'] })
        out << { fields: fields, source: { phish_foothold: true, overlaid: false } } if fields
      end

      out
    end

    # The candidates for a (target, kind): what the server may store when the client claims that
    # target. The client may choose only between these (plain or overlaid, a page's address or
    # the target's own), never an arbitrary string.
    def capture_candidates(data, target_id, kind)
      all_capture_candidates(data).select do |cand|
        cand[:fields]['targetId'] == target_id && cand[:fields]['kind'] == kind
      end
    end

    # Whether an NPC has a share_login workaround (its own list, else its role's).
    def share_login_npc?(data, npc_id)
      npc = room_npc_list(data).find { |n| n['id'] == npc_id }
      return false unless npc

      BreakEscape::AccessWork.workarounds(data, npc).any? { |w| w.is_a?(Hash) && w['do'] == 'share_login' }
    end

    # An NPC whose only capture route is a heard share_login: it has a share_login workaround and
    # no authored writer, usePayload or phish target declares its id. The server records such a
    # capture itself, from its own sharedLogins record.
    def share_only_target?(data, target_id)
      return false if client_target_ids(data).include?(target_id)

      share_login_npc?(data, target_id)
    end

    # The capture hash npc_frustration.rb shared_login_body composes, as a pure function of the
    # scenario: the NPC's username as the address, and a note naming the colleague of the given
    # share_login workaround (or the NPC's first one when none is given), with the password only
    # where social.captures.revealSecret is on.
    def shared_login_capture(data, npc_id, workaround: nil)
      npc = room_npc_list(data).find { |n| n['id'] == npc_id }
      return nil unless npc.is_a?(Hash) && account_holder?(npc)

      work = workaround
      work ||= BreakEscape::AccessWork.workarounds(data, npc).find { |w| w.is_a?(Hash) && w['do'] == 'share_login' }
      username = npc['creds']['username'].to_s
      password = npc['creds']['password'].to_s
      name = npc['displayName'] || npc['id']
      colleague = work.is_a?(Hash) ? room_npc_list(data).find { |n| n['id'] == work['with'] } : nil
      other = colleague && (colleague['displayName'] || colleague['id'])
      note = "#{name} told #{other} their login out loud: #{username} / #{password}"
      capture_note = reveal_secret?(data) ? note : "#{name} told #{other} their login out loud: #{username}"
      # The composed note is the one capture string with no authored bound (review 6a-server N3):
      # a very long displayName would otherwise ship unbounded. Clip to the same limit the
      # validator enforces on authored notes.
      capture_note = capture_note[0, MAX_CAPTURE_NOTE_CHARS] if capture_note.length > MAX_CAPTURE_NOTE_CHARS
      { 'targetId' => npc_id, 'kind' => 'credential', 'address' => username, 'note' => capture_note }
    end

    # Landing page ids that carry a non-empty capture secret. The single-secret fallback (the
    # reader's only_secret pass, and part 2's single-page evidence) counts these.
    def pages_with_secret(data)
      landing_pages(data).filter_map do |page|
        next unless page.is_a?(Hash)

        cap = page['capture']
        next unless cap.is_a?(Hash) && present_string?(cap['secret']) && present_string?(page['id'])

        page['id']
      end
    end

    # Part 3's proofs for a target (sync deltas R2, 6b): for each credential candidate for that
    # target, the proofs of the account it captures. When a candidate's address is an account
    # holder's username, that holder's proofs (proofs_for, as the account pass keys them); else
    # the captureProof of the candidate's owner or payload_owner NPC and the candidate's own
    # `proof`. Keyed on the captured account, not the mapping owner, so a mapping that captures
    # another NPC's account applies that account's proofs. Empty means the entry is revealable
    # once part 2 (if any) holds.
    def target_capture_proofs(data, target_id)
      holders = room_npc_list(data).select { |npc| account_holder?(npc) }
      by_username = holders.to_h { |npc| [normalise_username(npc['creds']['username']), npc] }
      proofs = []
      capture_candidates(data, target_id, 'credential').each do |cand|
        fields = cand[:fields]
        source = cand[:source] || {}
        holder = present_string?(fields['address']) ? by_username[normalise_username(fields['address'])] : nil
        if holder
          proofs.concat(proofs_for(holder, data))
        else
          [source[:owner], source[:payload_owner]].compact.uniq.each do |npc_id|
            npc = room_npc_list(data).find { |n| n['id'] == npc_id }
            next unless npc.is_a?(Hash) && npc['captureProof'].is_a?(Array)

            proofs.concat(npc['captureProof'].select { |p| p.is_a?(Hash) })
          end
          proofs << source[:proof] if source[:proof].is_a?(Hash)
        end
      end
      proofs.uniq
    end
  end
end
