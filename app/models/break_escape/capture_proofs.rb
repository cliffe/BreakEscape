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

    # --- Phish evidence: landing-page build route (Route 1) ---------------------------------
    #
    # docs/achitechture/PHISH_EVIDENCE_SERVER_PLAN.md sections 3.1, 3.2, 4. The server records the
    # landing-page build itself, in player_state['seLandingPages'] = { pageId => entry }, each
    # { pageId, targetId, choices, credibility, meetsThreshold, built: true, at }. The client's
    # choices are validated field by field against the page's own authored menus (the same
    # closed-menu discipline pick_capture_candidate applies to a capture), and the verdict is
    # recomputed with BreakEscape::PhishScore, never taken from the body (the body carries no
    # score). This chunk only writes the store; nothing reads it for the gate yet (the reader
    # change and the capture re-stamp land later in the build order, plan section 14).

    # Record one client-claimed landing-page build, server-verified. Returns
    # { result: :recorded, entry: } or { result: :refused, reason: 'invalid' }. Does not save;
    # the route wrapper saves once. First-wins on the page, last-score-wins on a rebuild (a repeat
    # build with different choices replaces choices/credibility/meetsThreshold, keeping built).
    def record_landing_page_build!(input, scenario:)
      return { result: :refused, reason: 'invalid' } unless input.is_a?(Hash)

      page_id = input['pageId']
      return { result: :refused, reason: 'invalid' } unless valid_capture_target_id?(page_id)

      page_def = CaptureModel.landing_page(scenario, page_id)
      return { result: :refused, reason: 'invalid' } unless page_def.is_a?(Hash)

      target_id = input['targetId']
      return { result: :refused, reason: 'invalid' } unless valid_landing_target?(page_def, target_id, scenario)

      choices = input['choices']
      return { result: :refused, reason: 'invalid' } unless valid_build_choices?(page_def, choices)

      verdict = recompute_page_verdict?(scenario, page_id) ? BreakEscape::PhishScore.score(page_def, choices, target_id.to_s) : nil
      meets = verdict ? verdict[:meets_threshold] == true : false
      credibility = verdict ? verdict[:credibility] : nil

      store = (player_state['seLandingPages'] ||= {})
      existing = store[page_id]
      # A+B R2 minor 1: a reload re-drive must never downgrade a recorded build. The reload re-drive
      # marks its body redrive:true; the server trusts that flag only in the downgrade-refusing
      # direction, so a client global that drifted weaker than a correct server build cannot launder
      # a weaker verdict over it on reload. A normal rebuild (no flag) stays last-wins, so an honest
      # deliberate weaken, and an honest improve-after-weak (live case f), both still apply.
      if input['redrive'] == true && existing.is_a?(Hash) && existing['meetsThreshold'] == true &&
         redrive_downgrade?(existing, meets, credibility)
        return { result: :already, entry: existing }
      end

      entry = {
        'pageId' => page_id, 'targetId' => target_id.to_s,
        'choices' => normalise_build_choices(choices),
        'credibility' => credibility, 'meetsThreshold' => meets,
        'built' => true, 'at' => capture_now_ms
      }
      store[page_id] = entry
      { result: :recorded, entry: entry }
    end

    # Whether a re-drive's recomputed verdict is weaker than the recorded build (A+B R2 minor 1):
    # the new verdict fails the threshold, or scores a lower credibility than the recorded one. An
    # equal or stronger re-drive replaces in place (a no-op for identical choices).
    def redrive_downgrade?(existing, meets, credibility)
      return true unless meets

      existing_cred = existing['credibility']
      existing_cred.is_a?(Numeric) && credibility.is_a?(Numeric) && credibility < existing_cred
    end

    # Route-facing wrapper (POST se/landing_page): validate, record, save, and answer the shape
    # the controller renders.
    def build_landing_page!(input)
      result = record_landing_page_build!(input, scenario: scenario_data)
      if result[:result] == :refused
        return { status: :unprocessable_entity, body: { success: false, reason: result[:reason] || 'invalid' } }
      end

      save!
      entry = result[:entry]
      { status: :ok, body: { success: true, pageId: entry['pageId'],
                             meetsThreshold: entry['meetsThreshold'], credibility: entry['credibility'] } }
    end

    # --- Phish evidence: phish send route (Route 2) -----------------------------------------
    #
    # docs/achitechture/PHISH_EVIDENCE_SERVER_PLAN.md sections 3.3, 5, 13. The server records each
    # phish send in player_state['sePhishSends'] = { "targetId/kitId" => entry }, each
    # { targetId, kitId, pageId, landed, at }. Under the settled lighter gate (decision two,
    # section 13) `landed` is true exactly when the kit's landing page is server-recorded built by
    # Route 1 with the server's own meetsThreshold holding: the route resolves NO account and
    # judges NO message. The composed message is validated field by field against the target's
    # authored accounts and payload kits as hostile-input hygiene only (like a typed lock code); it
    # never decides `landed`. The body's `landed` is ignored. Nothing reads sePhishSends for the
    # gate yet (the reader change is a later chunk, plan section 14); the re-stamp here runs the
    # existing client-evidence reader, so honest play is unaffected.

    # Record one client-claimed phish send, server-verified. Returns
    # { result: :recorded|:already, entry:, retryable: } or { result: :refused, reason: 'invalid' }.
    # Does not save; the route wrapper saves once. First-wins on landed:true (a later send cannot
    # un-land an earlier success), last-wins while still landed:false (a resend after the page is
    # built overwrites the earlier miss). `retryable` is true only when no built page is recorded
    # yet (the send arrived before Route 1 committed); a built-but-weak page is a permanent miss.
    def record_phish_send!(input, scenario:)
      return { result: :refused, reason: 'invalid' } unless input.is_a?(Hash)

      target_id = input['targetId']
      return { result: :refused, reason: 'invalid' } unless valid_capture_target_id?(target_id)
      return { result: :refused, reason: 'invalid' } unless CaptureModel.phish_target_ids(scenario).include?(target_id)

      kit_id = input['kitId']
      return { result: :refused, reason: 'invalid' } unless valid_capture_target_id?(kit_id)
      kit = CaptureModel.link_payload_kit(scenario, kit_id)
      return { result: :refused, reason: 'invalid' } unless kit.is_a?(Hash)

      return { result: :refused, reason: 'invalid' } unless valid_send_message?(scenario, input)

      page_id = kit['landingPageId']
      page = player_state.dig('seLandingPages', page_id)
      page_built = page.is_a?(Hash) && page['built'] == true
      # Shared with the legacy migration (chunk B): one definition of a landed build, so Route 2
      # and the imported send never diverge (plan section 5; chunk B review minor 3).
      landed = phish_page_build_landed?(page)

      store = (player_state['sePhishSends'] ||= {})
      key = "#{target_id}/#{kit_id}"
      existing = store[key]
      return { result: :already, entry: existing, retryable: false } if existing.is_a?(Hash) && existing['landed'] == true

      entry = { 'targetId' => target_id.to_s, 'kitId' => kit_id.to_s, 'pageId' => page_id,
                'landed' => landed, 'at' => capture_now_ms }
      store[key] = entry
      { result: :recorded, entry: entry, retryable: !page_built }
    end

    # Route-facing wrapper (POST se/phish_send): validate, record the send, re-stamp any capture
    # whose evidence now holds, save once, and answer. The answer carries the send verdict plus,
    # in the sync's captures shape, any capture this send freshly made revealable (plan section 6);
    # a send that arrived before its build returns retryable so the client re-posts once.
    def send_phish!(input)
      result = record_phish_send!(input, scenario: scenario_data)
      if result[:result] == :refused
        return { status: :unprocessable_entity, body: { success: false, reason: result[:reason] || 'invalid' } }
      end

      before = proven_capture_target_ids
      stamp_proven_captures!(scenario: scenario_data)
      save!

      entry = result[:entry]
      landed = entry['landed'] == true
      body = { success: true, targetId: entry['targetId'], kitId: entry['kitId'],
               pageId: entry['pageId'], landed: landed }
      unless landed
        if result[:retryable]
          body[:reason] = 'page_not_built_yet'
          body[:retryable] = true
        else
          body[:reason] = 'page_below_threshold'
        end
      end

      newly = proven_capture_target_ids - before
      if newly.any?
        cleaned = captures_for_client(scenario: scenario_data)
        answers = {}
        newly.each { |tid| answers[tid] = cleaned[tid] if cleaned.key?(tid) }
        body[:captures] = answers if answers.any?
      end
      { status: :ok, body: body }
    end

    # The set of currently-proven credential targetIds, for a before/after diff around a stamp.
    def proven_capture_target_ids
      record = player_state['seCaptures']
      return [] unless record.is_a?(Hash)

      record.filter_map { |target_id, entry| target_id if entry.is_a?(Hash) && entry['proven'] == true }
    end

    # Validate a phish send's composed message against the scenario's authored accounts and payload
    # kits (plan section 3.3 step 3). Hostile-input hygiene only: it bounds the body to authored
    # options and caps id/slot lengths so a tampered body cannot inject arbitrary data or raise; it
    # does NOT judge the message and does not feed `landed`. An unset (nil) field passes, as an
    # honest composition may omit optional fields.
    def valid_send_message?(scenario, input)
      from_account = input['fromAccount']
      unless from_account.nil?
        return false unless valid_choice_id?(from_account)
        return false unless CaptureModel.mail_account_ids(scenario).include?(from_account)
      end

      %w[link attachment].each do |key|
        value = input[key]
        next if value.nil?
        return false unless valid_choice_id?(value)
        return false unless CaptureModel.payload_kit_id?(scenario, value)
      end

      # headerFrom is the claimed sender (plan section 5 step 3). A string form must name an
      # authored account; the composer's object form ({ account: true } or { name, address } of
      # authored slot values) is bounded. nil passes.
      return false unless valid_header_from?(scenario, input['headerFrom'])

      return false unless bounded_string_map?(input['slots'])
      return false unless bounded_string_map?(input['templates'])
      return false unless bounded_info_map?(input['linkInfo'])

      # The remaining free-text fields are never stored and never judged, but a tampered body must
      # not carry an arbitrarily large value (plan section 5, chunk A review minor 5). nil or empty
      # passes; anything else is a string capped at the id length. `to` stays an address, not an
      # authored id, so it is only length-capped, not menu-checked (keeps the superset honest).
      %w[to subject linkText attachmentKind inReplyTo].each do |key|
        return false unless length_capped?(input[key])
      end

      true
    end

    # Whether a composed headerFrom is bounded. nil passes; a string must be an authored account; a
    # Hash (the client's composed form) must have bounded keys and only nil/boolean/bounded-string
    # values, so an oversized name or address is refused without rejecting an honest send.
    def valid_header_from?(scenario, value)
      return true if value.nil?
      if value.is_a?(String)
        return false unless valid_choice_id?(value)

        return CaptureModel.mail_account_ids(scenario).include?(value)
      end
      return false unless value.is_a?(Hash)

      value.all? do |key, v|
        next false unless valid_choice_id?(key)
        next true if v.nil? || v == true || v == false

        v.is_a?(String) ? valid_choice_id?(v) : false
      end
    end

    # nil or empty passes; otherwise a string capped at the id length. For free-text fields the gate
    # neither stores nor reads, so only size matters.
    def length_capped?(value)
      value.nil? || (value.is_a?(String) && value.length <= CaptureModel::MAX_CAPTURE_TARGET_CHARS)
    end

    # A bounded info object (linkInfo): nil passes; otherwise a Hash of bounded keys whose values
    # are nil, boolean, numeric, or a length-capped string. A nested object or oversized string is
    # refused. Lenient on scalar types so an honest linkInfo (domainId/pageId/domain strings) passes.
    def bounded_info_map?(map)
      return true if map.nil?
      return false unless map.is_a?(Hash)

      map.all? do |key, value|
        next false unless valid_choice_id?(key)

        case value
        when nil, true, false, Numeric then true
        when String then value.length <= CaptureModel::MAX_CAPTURE_TARGET_CHARS
        else false
        end
      end
    end

    # A nil map passes; otherwise every key and string value must be a bounded choice id (shape and
    # length cap), and a non-string leaf is refused. Keeps a hostile slots/templates object bounded
    # without a deep authored-value match (the gate does not read these).
    def bounded_string_map?(map)
      return true if map.nil?
      return false unless map.is_a?(Hash)

      map.all? do |key, value|
        next false unless valid_choice_id?(key)
        next true if value.nil?

        value.is_a?(String) ? valid_choice_id?(value) : false
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

    # --- legacy phish evidence: a one-time import (plan sections 9, 9.1) --------------------
    #
    # A save made before the phish-evidence server stores existed holds its build and send facts
    # in the client global globalVariables.se_landing_pages, not in seLandingPages / sePhishSends.
    # On the first bootstrap that holds scenario_data, migrate it once: re-derive the build verdict
    # with PhishScore from the stored choices (never trusting the old meetsThreshold), and import a
    # landed send off the save's own durable victim.submitted marker, gated on that re-derived
    # build. No stored sent mail is consulted (the mailbox cap can trim it), and no client landed is
    # trusted. Mirrors migrate_legacy_captures!: a data move inside player_state, no schema change.

    # Whether an old save still holds legacy phish evidence to import: a non-empty
    # globalVariables.se_landing_pages with the migration not yet run. player_state alone (no
    # scenario), so it is a cheap predicate for bootstrap_state_needs_write? (plan section 9.1).
    def legacy_phish_evidence?
      return false if player_state['phishEvidenceMigrated'] == true

      legacy = player_state.dig('globalVariables', 'se_landing_pages')
      legacy.is_a?(Hash) && legacy.any?
    end

    # Import the legacy phish evidence into the two server-owned stores once, gated on a top-level
    # server-owned phishEvidenceMigrated flag. Ordered before stamp_proven_captures! in
    # run_bootstrap_writers!, so the stamp in the same locked pass picks up the migrated evidence.
    # Returns whether anything changed. Idempotent: the entry guard returns at once once the flag is
    # set (the lock can be taken by any other writer's predicate, and this migration leaves
    # se_landing_pages in place for the builder UI, so without the guard it would re-read that
    # client-writable global on every later locked bootstrap).
    def migrate_legacy_phish_evidence!(scenario:)
      return false if player_state['phishEvidenceMigrated'] == true

      legacy = player_state.dig('globalVariables', 'se_landing_pages')
      if legacy.is_a?(Hash) && legacy.any?
        land_store = (player_state['seLandingPages'] ||= {})
        send_store = (player_state['sePhishSends'] ||= {})

        legacy.each do |page_id, rec|
          next unless valid_capture_target_id?(page_id)
          next unless rec.is_a?(Hash) && rec['built'] == true

          page_def = CaptureModel.landing_page(scenario, page_id)
          next unless page_def.is_a?(Hash)

          choices = rec['choices']
          # Off-menu or absent choices migrate as not built: the player rebuilds, honest play
          # reaches it again (plan section 9).
          next unless valid_build_choices?(page_def, choices)

          target_id = rec['targetId']
          next unless valid_landing_target?(page_def, target_id, scenario)

          # Re-derive the build verdict (first-wins per page), storing the server's own
          # meetsThreshold, never the old record's. A forged meetsThreshold: true over junk choices
          # migrates to the server verdict computed from those choices.
          build = (land_store[page_id] ||= migrated_build_entry(scenario, page_def, page_id, target_id, choices, rec))

          # Import the landed send off the durable victim.submitted marker, gated on the re-derived
          # build above. No stored sent mail is consulted.
          victim = rec['victim']
          next unless victim.is_a?(Hash) && victim['submitted'] == true
          next unless CaptureModel.phish_target_ids(scenario).include?(target_id.to_s)

          info = CaptureModel.page_evidence_kits(scenario)[page_id]
          # page_evidence_kits already keeps only present-string kit ids (capture_model.rb).
          kit_ids = info ? Array(info[:kits]) : []
          next if kit_ids.empty?

          kit_id = kit_ids.min
          landed = phish_page_build_landed?(build)
          key = "#{target_id}/#{kit_id}"
          existing = send_store[key]
          # First-wins on landed: true; a later live Route 2 send for the same target/kit credits once.
          next if existing.is_a?(Hash) && existing['landed'] == true

          send_store[key] = {
            'targetId' => target_id.to_s, 'kitId' => kit_id, 'pageId' => page_id,
            'landed' => landed, 'at' => migrated_at(rec)
          }
        end
      end

      # Runs a single time: set the flag whatever the save held, so a later locked bootstrap never
      # re-reads the client-writable se_landing_pages global (plan section 9.1).
      player_state['phishEvidenceMigrated'] = true
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
    #     server must hold that page's build record (built, meetsThreshold) in seLandingPages and a
    #     landed send to this target carrying one of the page's link kits in sePhishSends, both
    #     server-owned stores written only by the two gated routes (plan section 6);
    #   part 3 (proofs): when the target's capture proofs are not empty, one of them must hold.
    # Every other credential holds.
    def capture_evidence_holds?(entry, scenario:)
      return true unless entry.is_a?(Hash)

      kind = entry['kind'] || 'credential'
      return true unless kind == 'credential'

      target_id = entry['targetId']
      page_id = phish_evidence_page_for(entry, scenario)
      if page_id
        return false unless phish_page_evidence_holds?(page_id, target_id, scenario)
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

    # entry['proven'] once stamped, else whether the evidence holds now (an honest capture whose
    # evidence arrived a moment after it is served the instant the evidence is there).
    def capture_revealable?(entry, scenario:)
      return false unless entry.is_a?(Hash)
      return true if entry['proven'] == true

      capture_evidence_holds?(entry, scenario: scenario)
    end

    # Stamp proven: true on each stored entry whose evidence now holds. The proof records
    # (plantedItems, droppedItems, signedInPcs, gainedFootholds) only grow, so a proof that held
    # keeps holding; the phish evidence now lives in the two server-owned stores, written only by
    # the two gated routes (each of which re-stamps), and the bootstrap stamp picks up a migrated
    # legacy save. No save; the caller saves. Returns whether anything changed.
    def stamp_proven_captures!(scenario:)
      record = player_state['seCaptures']
      return false unless record.is_a?(Hash)

      changed = false
      record.each_value do |entry|
        next unless entry.is_a?(Hash)
        next if entry['proven'] == true
        next unless capture_evidence_holds?(entry, scenario: scenario)

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

    # Q1 (plan section 16): option A, the recommendation. Recompute the page verdict for every
    # scenario, one code path. The server owns the page score outright, so it never trusts a
    # client verdict. Switching to option B (recompute only when the page's served secret is
    # protected) is this one predicate returning false for an unprotected page.
    def recompute_page_verdict?(_scenario, _page_id)
      true
    end

    # Whether a build's targetId is one the page is authored for: a key of the page's targets
    # map, or a declared phish target (plan section 3.2 step 2).
    def valid_landing_target?(page_def, target_id, scenario)
      return false unless valid_capture_target_id?(target_id)

      targets = page_def['targets']
      return true if targets.is_a?(Hash) && targets.key?(target_id)

      CaptureModel.phish_target_ids(scenario).include?(target_id)
    end

    # Validate the build choices field by field against the page's authored menus (plan section
    # 3.2 step 3). A value naming something off the menu is refused; an unset (nil) choice is
    # allowed, as the scorer treats it. The fake-check variant validates choices.check.
    def valid_build_choices?(page_def, choices)
      return false unless choices.is_a?(Hash)
      return valid_check_choices?(page_def, choices['check']) if page_def['pageType'] == 'fakeCheck'

      return false unless choice_on_menu_or_nil?(choices['brand'], landing_menu_ids(page_def['brands']))
      return false unless valid_purpose_choice?(page_def, choices['purpose'])
      # logo and padlock are fixed closed option sets, not page-authored menus (plan section 3.2
      # step 3); a page need not author a `logos` list. An unrecognised logo only scores zero on
      # recompute, so this guards shape and hostile input, not the gate.
      return false unless choice_on_menu_or_nil?(choices['logo'], LANDING_LOGO_IDS)
      return false unless choice_on_menu_or_nil?(choices['wording'], landing_menu_ids(page_def['wordings']))
      return false unless valid_build_padlock?(choices['padlock'])
      return false unless valid_build_fields?(page_def, choices['fields'])
      # The domain must resolve to an option under the chosen brand (same resolver the scorer
      # uses), so a stored build can never be the guard's blocked case.
      return false if choices['domainId'].nil?
      return false unless valid_choice_id?(choices['domainId'])

      !BreakEscape::PhishScore.find_domain_option(page_def, choices['brand'], choices['domainId']).nil?
    end

    # The fixed logo closed set (landing-page-model.js scoreLogo recognises crisp/blurry/stretched,
    # anything else scores zero; the builder also offers 'none').
    LANDING_LOGO_IDS = Set['crisp', 'blurry', 'stretched', 'none'].freeze
    # Fallback purpose ids for a page that authors no purposes menu.
    LANDING_PURPOSE_FALLBACK_IDS = Set['signin', 'expired', 'payslip'].freeze

    # purpose validates against the page's authored purposes menu when it has one, else the fixed
    # fallback (plan section 3.2 step 3 groups purpose with the closed option sets).
    def valid_purpose_choice?(page_def, value)
      ids = landing_menu_ids(page_def['purposes'])
      ids = LANDING_PURPOSE_FALLBACK_IDS if ids.empty?
      choice_on_menu_or_nil?(value, ids)
    end

    def valid_check_choices?(page_def, check)
      return false unless check.is_a?(Hash)

      menus = page_def['check'].is_a?(Hash) ? page_def['check'] : {}
      choice_on_menu_or_nil?(check['hostId'], landing_menu_ids(menus['hosts'])) &&
        choice_on_menu_or_nil?(check['pretextId'], landing_menu_ids(menus['pretexts'])) &&
        choice_on_menu_or_nil?(check['stepsId'], landing_menu_ids(menus['steps'])) &&
        choice_on_menu_or_nil?(check['urgencyId'], landing_menu_ids(menus['urgencies']))
    end

    # The id set of an authored menu list ([{ 'id' => .. }, ..]).
    def landing_menu_ids(list)
      Array(list).filter_map { |opt| opt['id'] if opt.is_a?(Hash) && opt['id'].is_a?(String) }.to_set
    end

    # A single choice id: nil (unset) passes; otherwise a non-empty string within the cap that
    # names a value in the menu id set.
    def choice_on_menu_or_nil?(value, ids)
      return true if value.nil?
      return false unless valid_choice_id?(value)

      ids.include?(value)
    end

    def valid_choice_id?(value)
      value.is_a?(String) && !value.empty? && value.length <= CaptureModel::MAX_CAPTURE_TARGET_CHARS
    end

    def valid_build_padlock?(value)
      value.nil? || value == true || value == false
    end

    # fields is nil (treated as none) or an array of known field ids on the page, each within
    # the cap. Anything else is refused.
    def valid_build_fields?(page_def, fields)
      return true if fields.nil?
      return false unless fields.is_a?(Array)

      known = Array(page_def['fields']).select { |f| f.is_a?(String) }.to_set
      fields.all? { |f| valid_choice_id?(f) && known.include?(f) }
    end

    # The closed choice set stored on the build entry, mirroring landing-page-model.js normChoices:
    # the seven sign-in keys, plus the four-key `check` only when present (fake check).
    def normalise_build_choices(choices)
      c = choices.is_a?(Hash) ? choices : {}
      out = {
        'brand' => c['brand'], 'purpose' => c['purpose'], 'domainId' => c['domainId'],
        'logo' => c['logo'], 'wording' => c['wording'],
        'fields' => (c['fields'].is_a?(Array) ? c['fields'].dup : []),
        'padlock' => c['padlock'] == true
      }
      if c['check'].is_a?(Hash)
        chk = c['check']
        out['check'] = {
          'hostId' => chk['hostId'], 'pretextId' => chk['pretextId'],
          'urgencyId' => chk['urgencyId'], 'stepsId' => chk['stepsId']
        }
      end
      out
    end

    # The seLandingPages entry the legacy migration writes for one page: the server's re-derived
    # verdict (plan section 9), the same shape record_landing_page_build! stores. First-wins per
    # page (the caller only builds it when the store has no entry).
    def migrated_build_entry(scenario, page_def, page_id, target_id, choices, rec)
      verdict = recompute_page_verdict?(scenario, page_id) ? BreakEscape::PhishScore.score(page_def, choices, target_id.to_s) : nil
      {
        'pageId' => page_id, 'targetId' => target_id.to_s,
        'choices' => normalise_build_choices(choices),
        'credibility' => verdict ? verdict[:credibility] : nil,
        'meetsThreshold' => verdict ? verdict[:meets_threshold] == true : false,
        'built' => true, 'at' => migrated_at(rec)
      }
    end

    # The legacy record's own timestamp when numeric, else the migration time.
    def migrated_at(rec)
      at = rec.is_a?(Hash) ? rec['at'] : nil
      at.is_a?(Numeric) ? at : capture_now_ms
    end

    # The server's "landed" rule: a send lands exactly when its kit's landing page has been
    # recorded built by Route 1 and the server's own recomputed meetsThreshold holds. Route 2
    # (chunk A) computes landed the same way off the same seLandingPages entry; shared here so the
    # two paths cannot drift. Takes a seLandingPages entry (or nil for a page the server has no
    # build for).
    def phish_page_build_landed?(page_entry)
      page_entry.is_a?(Hash) && page_entry['built'] == true && page_entry['meetsThreshold'] == true
    end

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

    # Whether the two server-owned stores hold the part 2 evidence (plan section 6). The gate reads
    # only seLandingPages (the build route's record) and sePhishSends (the send route's record),
    # never the client's se_landing_pages global or mailState: the page must be recorded built with
    # the server's own meetsThreshold, and a send that landed to this target carrying one of the
    # page's authored link kits must be recorded. The derived victim submission is exactly these two
    # server facts holding together (page meetsThreshold and send landed).
    def phish_page_evidence_holds?(page_id, target_id, scenario)
      page = player_state.dig('seLandingPages', page_id)
      return false unless page.is_a?(Hash) && page['built'] == true && page['meetsThreshold'] == true

      info = CaptureModel.page_evidence_kits(scenario)[page_id]
      kit_ids = info ? Array(info[:kits]) : []
      return false if kit_ids.empty?

      Array(player_state['sePhishSends']).any? do |_key, send|
        send.is_a?(Hash) && send['landed'] == true &&
          send['targetId'].to_s == target_id.to_s && kit_ids.include?(send['kitId'])
      end
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
