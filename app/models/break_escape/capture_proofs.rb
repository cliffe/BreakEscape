module BreakEscape
  # Capture proofs (docs/achitechture/PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md, section 6): the
  # facts the server records itself about plants and drops, and the check that a captured
  # account password is served only once one of that account's proofs holds.
  #
  # The scenario-level rules (the capture-writer walk, declared target ids, where a proof lives)
  # are in BreakEscape::CaptureModel, which the validator shares.
  #
  # player_state keys (in Game::ACCESS_STATE_DEFAULTS):
  #   plantedItems  [{ 'item' => itemId, 'on' => objectId }], devices seen leaving the inventory
  #                 at an object made for them, in a room the player had unlocked
  #   droppedItems  [itemId, ...], items accepted as a player_drop
  module CaptureProofs
    extend ActiveSupport::Concern

    # At most this many capture entries are taken from one sync body (sync deltas R2, 6a).
    MAX_CAPTURES_PER_SYNC = 64

    # Records a plant when the inventory remove names the object it was used on. Appends
    # { item, on } to plantedItems only if the item is held, the object (a room object with that
    # id) requires and consumes the item, its USB policy does not refuse it (sub-slice U), and its
    # room is the start room or unlocked. Called
    # before the removal; the removal happens either way. Returns true when recorded.
    def record_planted_item!(item_id, used_on)
      item_id = item_id.to_s
      used_on = used_on.to_s
      return false if item_id.empty? || used_on.empty?

      held = (player_state['inventory'] || []).find do |inv|
        # An object added to a room with no server-known source is a bare client hash
        # stamped clientAdded (ItemIdentity::CLIENT_ADDED_MARKER): its type/name are
        # client-chosen, so a forged device must never be matched against a plant
        # target's requiresItem and mint a capture proof (code review R2, B1).
        next false if BreakEscape::ItemIdentity.client_forged?(inv)

        data = inv.is_a?(Hash) ? (inv['scenarioData'] || inv) : nil
        data.is_a?(Hash) && data['id'].to_s == item_id
      end
      held_data = held && (held['scenarioData'] || held)
      return false unless held_data.is_a?(Hash)

      found = planted_target_object(used_on)
      return false unless found
      return false unless CaptureModel.object_takes_item?(found[:object], held_data)
      # Slice 9.2 sub-slice U: a plant the object's USB policy refuses is never recorded, whatever
      # the browser decided (review R1, client reviewer's server item 1)
      return false if AccessWork.plant_refused?(scenario_data, found[:object], held_data)
      return false unless room_unlocked?(found[:room_id])

      list = (player_state['plantedItems'] ||= [])
      entry = { 'item' => item_id, 'on' => used_on }
      list << entry unless list.include?(entry)
      save!
      true
    end

    # Whether one authored proof holds, from server state only.
    def capture_proof_holds?(proof)
      case CaptureModel.proof_kind(proof)
      when 'planted'
        on = proof['on']
        planted = Array(player_state['plantedItems']).any? do |entry|
          entry.is_a?(Hash) && entry['item'] == proof['planted'] && (on.nil? || entry['on'] == on)
        end
        planted || (CaptureModel.present_string?(on) && Array(player_state['gainedFootholds']).include?(on))
      when 'dropped'
        Array(player_state['droppedItems']).include?(proof['dropped'])
      when 'session'
        Array(player_state['signedInPcs']).include?(proof['session'])
      else
        false
      end
    end

    def capture_proofs_for(npc)
      CaptureModel.proofs_for(npc, scenario_data)
    end

    def scenario_declares_capture_proofs?
      CaptureModel.declares_proofs?(scenario_data)
    end

    # Whether an account's password opens something: the account is admitted at a sign-in PC
    # (a room object login_pc? accepts; a PC with no access list admits every account), or, in a
    # scenario with networks, at a share whose access list admits it. A share with no access
    # list is reached by a foothold alone, so the password adds nothing there. Also when the
    # password is the code of a password or PIN lock anywhere in the scenario
    # (CaptureModel.password_opens_lock?, which the validator shares).
    def account_password_opens_something?(npc)
      return true if CaptureModel.password_opens_lock?(npc, scenario_data)

      pcs =AccessIdentities.room_objects(scenario_data).map { |entry| entry[:object] }.select { |obj| self.class.login_pc?(obj) }
      return true if pcs.any? { |pc| pc_admits_account?(pc, npc) }
      return false unless network_scenario?

      NetworkModel.resources(scenario_data).values.any? do |resource|
        !resource['access'].nil? && resource_acl_admits?(resource, npc)
      end
    end

    # The account check inside account_capture_passwords: in a scenario that declares proofs,
    # an account whose password opens something is served only once one of its proofs holds.
    # Elsewhere every account is served as before, with an info line when it has no proof.
    def account_capture_served?(npc)
      proofs = capture_proofs_for(npc)
      unless scenario_declares_capture_proofs?
        if proofs.empty?
          Rails.logger.info "[BreakEscape] capture_secrets: account #{npc['id']} served without a capture proof (scenario declares none)"
        end
        return true
      end
      return true unless account_password_opens_something?(npc)

      proofs.any? { |proof| capture_proof_holds?(proof) }
    end

    # The capture target ids the scenario declares (CaptureModel.declared_target_ids).
    # A heard share (slice 9.2 sub-slice H) declares its sharer too (review R1 m2), so both
    # readers, capture_secrets_for_client and NetworkAccess#account_capture_usernames, agree.
    def declared_capture_target_ids
      shared = Array(player_state['sharedLogins']).select { |id| id.is_a?(String) }
      CaptureModel.declared_target_ids(scenario_data).to_set | shared
    end

    # --- Server-owned capture record (sync deltas R2, 6a) -----------------------------------
    #
    # The record lives in player_state['seCaptures'] = { targetId => entry }, each entry
    # { targetId, roleLabel, address, kind, host, note, at, proven }. Every field but `at` and
    # `proven` is taken from the scenario (CaptureModel.capture_candidates), so the server owns
    # it: the client names the target and the kind and chooses between the candidate values the
    # writers allow, nothing more. Under 6a every entry is stored proven: true (everything is
    # revealable); 6b computes `proven`. None of these methods saves; the caller saves once.
    # They take `scenario:` explicitly because the sync_state row lock loads a narrow column set
    # without scenario_data.

    # Record one client-claimed capture. Returns { result: :recorded | :already | :refused,
    # entry:, reason: }.
    def record_capture!(input, scenario:, by: :client)
      return { result: :refused, reason: 'invalid' } unless input.is_a?(Hash)

      target_id = input['targetId']
      return { result: :refused, reason: 'invalid' } unless valid_capture_target_id?(target_id)

      kind = input['kind']
      kind = 'credential' if kind.nil? || kind == ''
      return { result: :refused, reason: 'invalid' } unless CaptureModel::CAPTURE_KINDS.include?(kind)

      %w[address host roleLabel].each do |field|
        value = input[field]
        next if value.nil?
        return { result: :refused, reason: 'invalid' } unless value.is_a?(String) && value.length <= CaptureModel::MAX_CAPTURE_FIELD_CHARS
      end

      record = (player_state['seCaptures'] ||= {})
      return { result: :already, entry: record[target_id] } if record[target_id].is_a?(Hash)

      if by == :client && !CaptureModel.client_target_ids(scenario).include?(target_id)
        return record_heard_or_refuse(target_id, scenario: scenario)
      end

      candidates = CaptureModel.capture_candidates(scenario, target_id, kind)
      return { result: :refused, reason: 'invalid' } if candidates.empty?

      chosen = pick_capture_candidate(candidates, input)
      # 6a stored proven: true on every entry (everything was revealable, as today). 6b computes
      # it: a credential whose phish evidence or capture proof does not yet hold is stored
      # proven: false and stamped later (stamp_proven_captures!) once the evidence reaches the
      # server. A foothold, and a credential with no evidence to wait on, is proven at once.
      proven = capture_evidence_holds?(chosen[:fields], scenario: scenario)
      entry = store_capture_entry(record, chosen[:fields], proven: proven)
      { result: :recorded, entry: entry }
    end

    # Record the capture of a heard share from the server's own composition, first wins.
    def record_shared_login!(npc_id, scenario:, workaround: nil, at: nil)
      record = (player_state['seCaptures'] ||= {})
      return { result: :already, entry: record[npc_id] } if record[npc_id].is_a?(Hash)

      capture = CaptureModel.shared_login_capture(scenario, npc_id, workaround: workaround)
      return { result: :refused, reason: 'invalid' } unless capture

      entry = { 'targetId' => capture['targetId'], 'kind' => capture['kind'], 'address' => capture['address'],
                'note' => capture['note'], 'at' => (at.is_a?(Numeric) ? at : capture_now_ms), 'proven' => true }
      record[npc_id] = entry
      { result: :recorded, entry: entry }
    end

    # Record every sharedLogins id whose NPC still has a share_login workaround and has no record
    # entry (the bootstrap backfill). Returns whether anything changed.
    def record_shared_logins!(scenario:)
      changed = false
      record = (player_state['seCaptures'] ||= {})
      Array(player_state['sharedLogins']).each do |npc_id|
        next unless npc_id.is_a?(String)
        next if record[npc_id].is_a?(Hash)
        next unless CaptureModel.share_login_npc?(scenario, npc_id)

        result = record_shared_login!(npc_id, scenario: scenario)
        changed = true if result[:result] == :recorded
      end
      changed
    end

    # Cheap predicate (player_state + scenario NPC list) for the locked bootstrap step.
    def unrecorded_shared_logins?(scenario: scenario_data)
      record = player_state['seCaptures']
      rec = record.is_a?(Hash) ? record : {}
      Array(player_state['sharedLogins']).any? do |npc_id|
        npc_id.is_a?(String) && !rec[npc_id].is_a?(Hash) && CaptureModel.share_login_npc?(scenario, npc_id)
      end
    end

    # Whether an old save still holds a non-empty legacy globalVariables.se_captures to migrate.
    def legacy_captures?
      legacy = player_state.dig('globalVariables', 'se_captures')
      legacy.is_a?(Hash) && legacy.any?
    end

    # Move a legacy globalVariables.se_captures map into player_state['seCaptures'] once (a data
    # move inside player_state, no schema change), then delete the global. A declared target goes
    # through the candidate match and keeps its stored `at`; a heard share in sharedLogins is
    # recorded from the server's composition; any other target is dropped. First wins. Returns
    # whether anything changed.
    def migrate_legacy_captures!(scenario:)
      globals = player_state['globalVariables']
      legacy = globals.is_a?(Hash) ? globals['se_captures'] : nil
      unless legacy.is_a?(Hash)
        return false unless globals.is_a?(Hash) && globals.key?('se_captures')

        globals.delete('se_captures')
        return true
      end

      record = (player_state['seCaptures'] ||= {})
      legacy.each do |target_id, entry|
        next if record[target_id].is_a?(Hash)
        next unless entry.is_a?(Hash)

        at = entry['at']
        if CaptureModel.share_login_npc?(scenario, target_id) && Array(player_state['sharedLogins']).include?(target_id)
          record_shared_login!(target_id, scenario: scenario, at: at)
        elsif CaptureModel.client_target_ids(scenario).include?(target_id)
          kind = entry['kind']
          kind = 'credential' if kind.nil? || kind == ''
          candidates = CaptureModel.capture_candidates(scenario, target_id, kind)
          next if candidates.empty?

          chosen = pick_capture_candidate(candidates, entry)
          stored = store_capture_entry(record, chosen[:fields], proven: true)
          stored['at'] = at if at.is_a?(Numeric)
        end
      end

      globals.delete('se_captures')
      true
    end

    # The record for the browser: every entry without the server-only keys (proven) and never a
    # secret. The bootstrap and every sync answer use this shape. Reads se_captures_record, so an
    # old save whose captures still sit in the legacy global reads through in place until the
    # bootstrap migrates them.
    def captures_for_client(scenario: nil)
      record = se_captures_record
      out = {}
      record.each do |target_id, entry|
        next unless entry.is_a?(Hash)

        cleaned = { 'targetId' => (entry['targetId'] || target_id), 'kind' => (entry['kind'] || 'credential') }
        %w[roleLabel address host note at].each { |k| cleaned[k] = entry[k] if entry.key?(k) && !entry[k].nil? }
        out[target_id] = cleaned
      end
      out
    end

    # --- 6b: reveal/proof gating ------------------------------------------------------------
    #
    # Under 6a every entry is stored proven: true, so everything is revealable as soon as it is
    # recorded (as today). 6b closes that window: a capture recorded on a client claim alone is
    # no longer served until its evidence holds. The readers (capture_secrets_for_client,
    # NetworkAccess#account_capture_usernames) serve an entry only when capture_revealable? is
    # true. None of these methods saves; the caller saves once.

    # Whether a stored entry's evidence holds now. A foothold (and any non-credential) reveals
    # nothing, so it always holds. For a credential:
    #   part 2 (phish): when the entry's address is a landing page's capture address, or the
    #     target is a phish target with exactly one page secret (the single-secret fallback), the
    #     server must hold that page's record (built, meetsThreshold, victim.submitted all true)
    #     and a sent message that landed to this target carrying one of the page's link kits,
    #     either in the stored mailState or in extra_sent (the request's own sent messages);
    #   part 3 (proofs): when the target's capture proofs are not empty, one of them must hold.
    # Every other credential holds.
    def capture_evidence_holds?(entry, scenario:, extra_sent: [])
      return true unless entry.is_a?(Hash)

      kind = entry['kind'] || 'credential'
      return true unless kind == 'credential'

      target_id = entry['targetId']
      page_id = phish_evidence_page_for(entry, scenario)
      if page_id
        return false unless phish_page_evidence_holds?(page_id, target_id, scenario, extra_sent)
      end

      # Part 3 (6b review n1): a non-empty proof list must have one proof hold, even for an account
      # whose password opens nothing. This is stricter than main's account pass
      # (account_capture_served? short-circuits when account_password_opens_something? is false), so
      # a credential with a captureProof whose password opens nothing is withheld until the proof
      # holds. The direction is safe (it only ever withholds, never over-serves) and no authored
      # scenario hits it today; kept deliberately and logged here and in the build log.
      proofs = CaptureModel.target_capture_proofs(scenario, target_id)
      if proofs.any?
        return false unless proofs.any? { |pr| capture_proof_holds?(pr) }
      end

      true
    end

    # A cheap, bounded, scenario-free fingerprint of the part 2 phish evidence a sync_state request
    # can advance: each landing page's built / meetsThreshold / victim.submitted flags, and the set
    # of landed sent-mail (targetId, kitId) pairs, from stored state plus the request's own sent
    # messages. It needs no scenario_data, so the sync step can compare it before and after the
    # merge and skip the scenario load when a request brought no new phish evidence (6b review m1:
    # a forged, never-provable unproven entry no longer forces the load on every later sync). The
    # string is bounded by the declared pages and declared phish targets, so it never grows without
    # bound; it is computed only, never stored.
    def phish_evidence_fingerprint(extra_sent: [])
      pages = player_state.dig('globalVariables', 'se_landing_pages')
      page_part = if pages.is_a?(Hash)
        pages.keys.sort.map do |pid|
          rec = pages[pid]
          next pid.to_s unless rec.is_a?(Hash)

          victim = rec['victim']
          submitted = victim.is_a?(Hash) && victim['submitted'] == true
          "#{pid}:#{rec['built'] == true ? 1 : 0}#{rec['meetsThreshold'] == true ? 1 : 0}#{submitted ? 1 : 0}"
        end.join(',')
      else
        ''
      end

      keys = []
      add_sent_key = lambda do |msg|
        next unless msg.is_a?(Hash) && msg['folder'] == 'sent' && msg['landed'] == true

        link = msg['link']
        keys << "#{msg['targetId']}/#{link.is_a?(Hash) ? link['kitId'] : nil}"
      end
      each_stored_sent_message.each(&add_sent_key)
      Array(extra_sent).each(&add_sent_key)

      "#{page_part}|#{keys.uniq.sort.join(',')}"
    end

    # entry['proven'] once stamped, else whether the evidence holds now (an honest capture whose
    # evidence arrived a moment after it is served the instant the evidence is there).
    def capture_revealable?(entry, scenario:, extra_sent: [])
      return false unless entry.is_a?(Hash)
      return true if entry['proven'] == true

      capture_evidence_holds?(entry, scenario: scenario, extra_sent: extra_sent)
    end

    # Stamp proven: true on each stored entry whose evidence now holds, counting extra_sent (the
    # request's own sent messages). The proof records (plantedItems, droppedItems, signedInPcs,
    # gainedFootholds) only grow, so a proof that held keeps holding; the stamp matters for the
    # page evidence, which the client can change. No save; the caller saves. Returns whether
    # anything changed.
    def stamp_proven_captures!(scenario:, extra_sent: [])
      record = player_state['seCaptures']
      return false unless record.is_a?(Hash)

      changed = false
      record.each_value do |entry|
        next unless entry.is_a?(Hash)
        next if entry['proven'] == true
        next unless capture_evidence_holds?(entry, scenario: scenario, extra_sent: extra_sent)

        entry['proven'] = true
        changed = true
      end
      changed
    end

    # Cheap-first predicate for the bootstrap lock (SYNC_DELTAS_PLAN 2.4): true only when some
    # unproven entry's evidence holds now. Returns false at once when nothing is unproven.
    def stampable_captures?(scenario: scenario_data)
      return false unless unproven_captures?

      record = player_state['seCaptures']
      record.each_value.any? do |entry|
        entry.is_a?(Hash) && entry['proven'] != true &&
          capture_evidence_holds?(entry, scenario: scenario)
      end
    end

    # Cheap: whether any stored entry is not yet proven (player_state alone).
    def unproven_captures?
      record = player_state['seCaptures']
      record.is_a?(Hash) && record.each_value.any? { |entry| entry.is_a?(Hash) && entry['proven'] != true }
    end

    private

    # The landing page id whose part 2 evidence a credential entry needs, or nil. The entry's
    # address matching a page's capture address names that page; otherwise a phish target with
    # exactly one page secret takes that single secret's page (the reader's single-secret
    # fallback).
    def phish_evidence_page_for(entry, scenario)
      address = entry['address']
      if CaptureModel.present_string?(address)
        kits = CaptureModel.page_evidence_kits(scenario)
        match = kits.find { |_pid, info| info[:address] == address }
        return match[0] if match
      end

      phish = CaptureModel.phish_target_ids(scenario).to_set
      return nil unless phish.include?(entry['targetId'].to_s)

      secret_pages = CaptureModel.pages_with_secret(scenario)
      secret_pages.size == 1 ? secret_pages.first : nil
    end

    # Whether the server holds the page record and the landed sent mail part 2 needs.
    def phish_page_evidence_holds?(page_id, target_id, scenario, extra_sent)
      pages = player_state.dig('globalVariables', 'se_landing_pages')
      rec = pages.is_a?(Hash) ? pages[page_id] : nil
      return false unless rec.is_a?(Hash)
      return false unless rec['built'] == true && rec['meetsThreshold'] == true

      victim = rec['victim']
      return false unless victim.is_a?(Hash) && victim['submitted'] == true

      info = CaptureModel.page_evidence_kits(scenario)[page_id]
      kit_ids = info ? Array(info[:kits]) : []
      return false if kit_ids.empty?

      matcher = lambda do |msg|
        msg.is_a?(Hash) && msg['folder'] == 'sent' && msg['landed'] == true &&
          msg['targetId'].to_s == target_id.to_s &&
          msg['link'].is_a?(Hash) && kit_ids.include?(msg['link']['kitId'])
      end
      return true if each_stored_sent_message.any?(&matcher)

      Array(extra_sent).any?(&matcher)
    end

    # Every stored mail message, as an Array of hashes. Memoised per request against the identity
    # of the mailboxes hash (6b review n2): several capture_revealable? / stamp checks in one
    # request, or several unproven entries, reuse one scan instead of walking the whole mailbox each
    # time. merge_mail_state! replaces player_state['mailState'] with a fresh object, so a merge
    # within the request changes the mailboxes identity and the memo recomputes.
    def each_stored_sent_message
      mail = player_state['mailState']
      boxes = mail.is_a?(Hash) ? mail['mailboxes'] : nil
      return [] unless boxes.is_a?(Hash)

      return @stored_sent_message_memo[1] if @stored_sent_message_memo && @stored_sent_message_memo[0].equal?(boxes)

      list = []
      boxes.each_value do |box|
        msgs = box.is_a?(Hash) ? box['messages'] : nil
        Array(msgs).each { |m| list << m }
      end
      @stored_sent_message_memo = [boxes, list]
      list
    end

    def capture_now_ms
      (Time.now.to_f * 1000).round
    end

    def valid_capture_target_id?(target_id)
      target_id.is_a?(String) && !target_id.empty? && target_id.length <= CaptureModel::MAX_CAPTURE_TARGET_CHARS
    end

    # The candidate whose client-given address/host/roleLabel all match, preferring a plain
    # candidate to an overlaid one; else the first (plain-first) candidate.
    def pick_capture_candidate(candidates, input)
      ordered = candidates.sort_by { |c| c[:source][:overlaid] ? 1 : 0 }
      ordered.find { |c| capture_candidate_matches_client?(c, input) } || ordered.first
    end

    def capture_candidate_matches_client?(candidate, input)
      %w[address host roleLabel].all? do |field|
        value = input[field]
        value.nil? || value == '' || candidate[:fields][field] == value
      end
    end

    # Store the candidate's fields whole (nothing authored is cut), with the server's `at` and
    # `proven`. Returns the stored entry.
    def store_capture_entry(record, fields, proven:)
      entry = { 'targetId' => fields['targetId'], 'kind' => fields['kind'] }
      %w[roleLabel address host note].each { |k| entry[k] = fields[k] if fields.key?(k) }
      entry['at'] = capture_now_ms
      entry['proven'] = proven
      record[fields['targetId']] = entry
      entry
    end

    # Record a heard share itself, or refuse a client claim for an undeclared target.
    def record_heard_or_refuse(target_id, scenario:)
      if CaptureModel.share_only_target?(scenario, target_id)
        return record_shared_login!(target_id, scenario: scenario) if Array(player_state['sharedLogins']).include?(target_id)

        return { result: :refused, reason: 'server_only' }
      end
      { result: :refused, reason: 'undeclared' }
    end

    # { object:, room_id: } for the room object (under rooms.<id>.objects, by id only, never by
    # name) that a plant names, or nil.
    def planted_target_object(object_id)
      rooms = scenario_data['rooms']
      return nil unless rooms.is_a?(Hash)

      rooms.each do |room_id, room|
        next unless room.is_a?(Hash) && room['objects'].is_a?(Array)

        obj = room['objects'].find { |o| o.is_a?(Hash) && o['id'].to_s == object_id }
        return { object: obj, room_id: room_id } if obj
      end
      nil
    end
  end
end
