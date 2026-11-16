# frozen_string_literal: true

require 'set'
# Step 2b: author_notes (and, through it, scenario_schema) so each_capture_writer can skip notes.
require_relative 'author_notes' unless defined?(BreakEscape::AuthorNotes)
# Step 3: npc_habits for NpcHabits.doorway_problem, so each_lock_answer resolves door entries the
# client reads. The guarded form the other lib files use; the engine autoloads lib/ inside Rails,
# and NpcHabits uses AccessIdentities only inside methods, so this require order stays safe.
require_relative 'npc_habits' unless defined?(BreakEscape::NpcHabits)

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

    # Every shorthand proof: [{ proof:, holder: (the account holder NPC or nil), path:, secret: }].
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
        { proof: capture['proof'], holder: holder, path: "#{path}/proof", secret: capture['secret'] }
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
    # The answer kinds both sets collect (step 3). password and pin stay exact; combination and
    # cryptex are normalised by answer_key, the same normalisation Game.lock_answer_matches? uses.
    LOCK_ANSWER_TYPES = %w[password pin combination cryptex].freeze

    # The integers of a combination answer, or nil when there are none. The lambda moved verbatim
    # from Game.lock_answer_matches? (unlock gaps build): an Array's elements are converted with
    # to_s and stripped, a String is split on runs of non-digits, empty parts are dropped, and any
    # part that is not all digits gives nil. [12, 30, 5], "12-30-05", "12 30 5" and "L12 R30 L5"
    # all give [12, 30, 5]; nil, "", "twelve" and [] give nil (no numbers).
    def combination_numbers(value)
      parts = value.is_a?(Array) ? value.map(&:to_s) : value.to_s.split(/[^0-9]+/)
      parts = parts.map(&:strip).reject(&:empty?)
      return nil unless parts.all? { |p| p.match?(/\A\d+\z/) }

      nums = parts.map(&:to_i)
      nums.empty? ? nil : nums
    end

    # The canonical answer key for a lock answer, a String or nil. Shared by both answer sets and
    # by Game.lock_answer_matches?, so "what equal means" is decided in one place.
    #   combination: "combination:" + the integers joined by "-" (nil with no numbers).
    #   cryptex:     "cryptex:" + strip.downcase(:fold), the same Unicode folding casecmp? applies;
    #                nil unless the value is a String whose strip is non-empty.
    #   every other kind: "<kind>:" + to_s, exactly (nil for nil or an empty to_s). Passwords and
    #                PINs stay exact because the server's unlock compares them with to_s ==.
    def answer_key(lock_type, value)
      case lock_type
      when 'combination'
        nums = combination_numbers(value)
        nums ? "combination:#{nums.join('-')}" : nil
      when 'cryptex'
        return nil unless value.is_a?(String)

        folded = value.strip
        folded.empty? ? nil : "cryptex:#{folded.downcase(:fold)}"
      else
        return nil if value.nil?

        str = value.to_s
        str.empty? ? nil : "#{lock_type}:#{str}"
      end
    end

    # Yields (lock_type, requires, path) for every Hash that carries a String lockType, wherever it
    # sits (rooms, objects and contents at any depth, items held and granted, timers, flag rewards),
    # plus each rooms.*.doors[] entry the client reads, with its resolved lock type and requires
    # (the entry's own, else the connected room's: the client's rule, filled from the connected room
    # when the entry leaves a gap). Only door entries NpcHabits.doorway_problem clears are resolved;
    # an entry it flags is one the client never reads. Both answer sets and step 3's leak check are
    # built from this one walk.
    def each_lock_answer(data, &block)
      return enum_for(:each_lock_answer, data) unless block

      rooms = data.is_a?(Hash) ? data['rooms'] : nil
      if rooms.is_a?(Hash)
        rooms.each do |room_id, room|
          next unless room.is_a?(Hash) && room['doors'].is_a?(Array)

          room['doors'].each_with_index do |entry, i|
            next unless entry.is_a?(Hash)
            next unless BreakEscape::NpcHabits.doorway_problem(room, i).nil?

            connected = rooms[entry['connectedRoom']]
            lock_type = entry['lockType']
            lock_type = connected['lockType'] if lock_type.nil? && connected.is_a?(Hash)
            next unless lock_type.is_a?(String)

            requires = entry.key?('requires') ? entry['requires'] : (connected.is_a?(Hash) ? connected['requires'] : nil)
            yield lock_type, requires, "rooms/#{room_id}/doors[#{i}]"
          end
        end
      end

      # Every other lock-typed hash. A door entry is skipped here (resolved above): descending into
      # a value under the key "doors" marks its immediate hashes as door entries.
      walk = lambda do |node, path, in_doors|
        case node
        when Hash
          yield node['lockType'], node['requires'], path if !in_doors && node['lockType'].is_a?(String)
          node.each { |k, v| walk.call(v, "#{path}/#{k}", k == 'doors') }
        when Array
          node.each_with_index { |v, i| walk.call(v, "#{path}[#{i}]", in_doors) }
        end
      end
      walk.call(data, '', false)
    end

    # Whether a value could open a lock whose answer is in keys: builds every key the value could
    # match and tests each with include?. keys is an answer set (hard_access_values or
    # lock_answer_keys), both built from answer_key. Never matches nil or a blank value: a blank,
    # nil or malformed secret opens nothing, as Game.lock_answer_matches? also refuses.
    def lock_answer?(keys, value)
      return false if value.nil?

      str = value.to_s
      return false if str.strip.empty?

      candidates = LOCK_CODE_TYPES.map { |k| "#{k}:#{str}" }
      candidates << "rfid:#{str}" << "biometric:#{str}" << "flag:#{str}"
      combo = answer_key('combination', value)
      candidates << combo if combo
      cryptex = answer_key('cryptex', value)
      candidates << cryptex if cryptex
      candidates.any? { |candidate| keys.include?(candidate) }
    end

    # The lock types whose requires value grants hard access if known: a password or PIN code,
    # and the card/owner value an RFID or biometric lock accepts.
    HARD_ACCESS_LOCK_TYPES = %w[password pin rfid biometric].freeze

    # Every answer that opens a password, PIN, combination or cryptex lock anywhere in the scenario,
    # as canonical answer keys (answer_key). The set the capture-proof warning and
    # CaptureProofs#account_password_opens_something? probe through lock_answer?. Renamed from
    # lock_codes by step 3, and keyed, so a caller still treating it as raw values fails loudly.
    def lock_answer_keys(data)
      out = Set.new
      each_lock_answer(data) do |lock_type, value, _path|
        next unless LOCK_ANSWER_TYPES.include?(lock_type)

        key = answer_key(lock_type, value)
        out << key if key
      end
      out
    end

    # Every value that grants hard access if known, as canonical answer keys: the answer of a
    # password, PIN, combination or cryptex lock, the requires of an RFID or biometric lock
    # (each element, "<kind>:<v>"), a Wi-Fi PSK ("password:<psk>"), or a flag value ("flag:<v>").
    # A capture secret that lock_answer? finds in this set is never served on the capture record
    # alone (the server's authored_capture_secret withholds it). A secret that opens nothing is not
    # in this set: a stray "5" beside a combination [12, 30, 5] gives "combination:5", not here.
    def hard_access_values(data)
      out = Set.new
      each_lock_answer(data) do |lock_type, value, _path|
        case lock_type
        when 'password', 'pin', 'combination', 'cryptex'
          key = answer_key(lock_type, value)
          out << key if key
        when 'rfid', 'biometric'
          Array(value).each do |v|
            out << "#{lock_type}:#{v}" if (v.is_a?(String) || v.is_a?(Integer)) && !v.to_s.strip.empty?
          end
        end
      end

      networks = data.is_a?(Hash) ? data['networks'] : nil
      if networks.is_a?(Hash)
        networks.each_value do |net|
          wifi = net.is_a?(Hash) ? net['wifi'] : nil
          next unless wifi.is_a?(Hash)

          Array(wifi['psk']).each do |v|
            out << "password:#{v}" if (v.is_a?(String) || v.is_a?(Integer)) && !v.to_s.strip.empty?
          end
        end
      end

      flags = data.is_a?(Hash) ? data['flags'] : nil
      if flags.is_a?(Hash)
        flags.each_value do |group|
          next unless group.is_a?(Hash)

          group.each_value do |v|
            Array(v).each do |leaf|
              out << "flag:#{leaf}" if (leaf.is_a?(String) || leaf.is_a?(Integer)) && !leaf.to_s.strip.empty?
            end
          end
        end
      end

      out
    end

    # The raw hard-access strings (not keyed): the lock-opening values a capture note or other
    # string field must not quote. For substring/text checks only (validate_capture_log's note
    # leak), where the keyed set cannot help. Mirrors the pre-step-3 hard_access_values.
    def hard_access_raw_values(data)
      out = Set.new
      add = lambda do |value|
        Array(value).each do |v|
          out << v.to_s if (v.is_a?(String) || v.is_a?(Integer)) && !v.to_s.strip.empty?
        end
      end

      each_lock_answer(data) do |lock_type, value, _path|
        add.call(value) if HARD_ACCESS_LOCK_TYPES.include?(lock_type)
      end

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

    # Whether this account holder's password opens a password, PIN, combination or cryptex lock,
    # so a served password opens that lock. codes: lock_answer_keys(data), passed in when checking
    # many accounts.
    def password_opens_lock?(npc, data, codes = nil)
      password = npc.is_a?(Hash) && npc['creds'].is_a?(Hash) ? npc['creds']['password'] : nil
      return false unless present_string?(password)

      lock_answer?(codes || lock_answer_keys(data), password)
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

    # Whether a proof can be met in this scenario, as the server records it: a planted proof
    # needs the network jack that on names, or a room object with an id, a
    # triggerOnInteract list and a requiresItem that takes the item; a dropped proof needs a
    # droppable item; a session proof needs a sign-in PC (lockType login). item_defs is
    # { itemId => definition }, objects the room object hashes. holder (an account holder NPC
    # or nil) is accepted so both validators call it alike; no kind reads it today. Pure.
    #
    # objects is the top-level room object list (top_level_room_objects): where a non-jack plant
    # is recorded. The server resolves the other two kinds differently, so they take their own
    # id lists, defaulting to what objects holds: jack_ids (reachable_jack_ids, a jack plant is
    # a foothold on a jack found in nested contents) and sign_in_pc_ids (sign_in_pc_ids, the
    # server's login_scope_of rule).
    def proof_satisfiable?(proof, item_defs, objects, _holder = nil, jack_ids: nil, sign_in_pc_ids: nil)
      kind = proof_kind(proof)
      return false unless kind

      objects = Array(objects).select { |o| o.is_a?(Hash) }
      jack_ids ||= objects.select { |o| o['networkJack'] == true }.map { |o| o['id'].to_s }
      sign_in_pc_ids ||= objects.select { |o| o['lockType'] == 'login' }.map { |o| o['id'].to_s }
      case kind
      when 'planted'
        item = item_defs[proof['planted'].to_s]
        return false unless item

        on = proof['on']
        return false if on && objects.none? { |o| o['id'].to_s == on.to_s } && !jack_ids.include?(on.to_s)
        # A jack plant is recorded only against the jack it names: with no `on` the server reads
        # plantedItems alone (capture_proof_holds?), and only a non-jack plant writes that.
        return true if on && jack_ids.include?(on.to_s)

        objects.any? do |o|
          present_string?(o['id']) && (on.nil? || o['id'].to_s == on.to_s) && object_takes_item?(o, item)
        end
      when 'dropped'
        item = item_defs[proof['dropped'].to_s]
        !item.nil? && item['droppable'] == true
      when 'session'
        sign_in_pc_ids.include?(proof['session'].to_s)
      else
        false
      end
    end

    # The capture writers whose secret the server can serve, in the server's order: the mirror of
    # Game#build_authored_capture_secrets (first eligible writer per target id; a writer owned by an
    # account holder, or addressed to an account username, is skipped) behind
    # Game#capture_secrets_for_client's reveal gate (social.captures.revealSecret). Writers are
    # the identical hashes each_capture_writer yields. A usePayload writer is not listed (it comes
    # after the mapping and action writers server-side, and the validators read these only).
    def served_capture_writers(data)
      return [] unless reveal_secret?(data)

      holders = room_npc_list(data).select { |npc| account_holder?(npc) }
      usernames = holders.map { |npc| normalise_username(npc['creds']['username']) }.to_set
      # Game#capture_secrets_for_client answers by the earned entry's address first: a landing
      # page's capture.address, then an account username, then (for a phish target, when exactly
      # one landing page carries a secret) that one secret, and only then the authored secret
      # of the id's first writer. It also serves credential entries only and skips an id no
      # writer declares (present_string?). The first writer owns the id's authored secret, but
      # the entry may be earned through any writer of that id, so the id is served when some
      # writer of it could earn an entry that reaches the authored pass.
      social = data['social']
      list = social.is_a?(Hash) ? social['landingPages'] : nil
      pages = (list.is_a?(Array) ? list : []).select { |page| page.is_a?(Hash) && page['capture'].is_a?(Hash) }
      landing_secrets = pages.map { |page| page['capture']['secret'] }
                             .select { |sec| sec.is_a?(String) && !sec.empty? }
      landing = pages.filter_map do |page|
        cap = page['capture']
        cap['address'] if cap['secret'].is_a?(String) && !cap['secret'].empty? &&
                          cap['address'].is_a?(String) && !cap['address'].empty?
      end.to_set
      single_secret_phish = landing_secrets.size == 1 ? phish_target_ids(data).map(&:to_s).to_set : Set.new
      first = {}
      reachable = {}
      each_capture_writer(data) do |capture, _kind, _path, owner|
        # A holder-owned writer is skipped before reachable[id], unlike the server, which skips it
        # for the authored secret only: an entry earned through one with a non-username address
        # could still reach authored[id] set by another writer. Left as is: that needs a holder
        # writer with an explicit non-username address on an id a non-holder writer also names,
        # and the cost is a false warning only (E0 R4 t2).
        next if owner && holders.any? { |npc| npc.equal?(owner) }

        id = capture['targetId']
        next unless present_string?(id)

        addr = capture['address']
        next if addr.is_a?(String) && usernames.include?(normalise_username(addr))

        kind_ok = !CAPTURE_KINDS.include?(capture['kind']) || capture['kind'] == 'credential'
        reachable[id] = true if kind_ok && !(addr.is_a?(String) && landing.include?(addr))
        next unless capture['secret'].is_a?(String) && !capture['secret'].empty?

        first[id] ||= capture
      end
      first.filter_map do |id, capture|
        capture if reachable[id] && !single_secret_phish.include?(id)
      end
    end

    # Whether the server can serve this capture writer's secret (see served_capture_writers).
    def served_capture_writer?(data, capture)
      served_capture_writers(data).any? { |c| c.equal?(capture) }
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

    # The room objects a plant can land on, as the server records one: only a top-level entry of
    # rooms.<id>.objects (CaptureProofs#planted_target_object), never an object nested in a
    # container's contents or an NPC's itemsHeld. Plain object hashes.
    def top_level_room_objects(data)
      rooms = data.is_a?(Hash) ? data['rooms'] : nil
      return [] unless rooms.is_a?(Hash)

      rooms.values.flat_map { |room| room.is_a?(Hash) && room['objects'].is_a?(Array) ? room['objects'] : [] }
           .select { |o| o.is_a?(Hash) }
    end

    # The jacks a jack plant (a foothold, Game#find_jack via NetworkAccess#network_object_in) can
    # name: networkJack objects anywhere under rooms.<id>.objects through contents, but not under
    # a sign-in object and not on an NPC. Ids as strings. Unlike a plant, a nested jack counts.
    def reachable_jack_ids(data)
      ids = []
      walk = lambda do |list|
        Array(list).each do |obj|
          next unless obj.is_a?(Hash)

          ids << obj['id'].to_s if obj['networkJack'] == true
          walk.call(obj['contents']) unless obj['lockType'] == 'login'
        end
      end
      rooms = data.is_a?(Hash) ? data['rooms'] : nil
      rooms.values.each { |room| walk.call(room['objects']) if room.is_a?(Hash) } if rooms.is_a?(Hash)
      ids
    end

    # The sign-in PCs the server accepts a sign-in on (Game#find_login_pc via login_scope_of and
    # locate_object_in): a lockType login object found by walking rooms.<id>.objects through
    # contents, unless it sits inside another sign-in PC. A desk or cabinet around it does not
    # matter; an NPC's itemsHeld is never searched. Ids as strings.
    def sign_in_pc_ids(data)
      ids = []
      walk = lambda do |list, inside_pc|
        Array(list).each do |obj|
          next unless obj.is_a?(Hash)

          login = obj['lockType'] == 'login'
          ids << obj['id'].to_s if login && !inside_pc
          walk.call(obj['contents'], inside_pc || login)
        end
      end
      rooms = data.is_a?(Hash) ? data['rooms'] : nil
      rooms.values.each { |room| walk.call(room['objects'], false) if room.is_a?(Hash) } if rooms.is_a?(Hash)
      ids
    end

    # The authored landing-page definition (social.landingPages entry) for a page id, or nil.
    # The phish-evidence build route (CaptureProofs#record_landing_page_build!) validates the
    # client's choices against this page's own menus and recomputes its score from it.
    def landing_page(data, page_id)
      landing_pages(data).find { |p| p.is_a?(Hash) && p['id'] == page_id }
    end

    def landing_page_capture(data, page_id)
      page = landing_page(data, page_id)
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

    # All social.mailClient.payloadKit entries (an Array), or [].
    def payload_kits(data)
      social = data.is_a?(Hash) ? data['social'] : nil
      mail_client = social.is_a?(Hash) ? social['mailClient'] : nil
      kits = mail_client.is_a?(Hash) ? mail_client['payloadKit'] : nil
      Array(kits).select { |kit| kit.is_a?(Hash) }
    end

    # The authored `kind: 'link'` payload kit with a string landingPageId for a kit id, or nil
    # (the findLinkKit discipline, mail-bridge.js linkKitOf). Route 2 (record_phish_send!) resolves
    # the kit this way and takes its landingPageId as the send's pageId, never from the body.
    def link_payload_kit(data, kit_id)
      return nil unless present_string?(kit_id)

      payload_kits(data).find do |kit|
        kit['id'] == kit_id && kit['kind'] == 'link' && present_string?(kit['landingPageId'])
      end
    end

    # Whether a kit id names any authored payload kit (any kind): used by Route 2 to bound a
    # message's link/attachment fields to authored kits (hostile-input hygiene).
    def payload_kit_id?(data, kit_id)
      return false unless present_string?(kit_id)

      payload_kits(data).any? { |kit| kit['id'] == kit_id }
    end

    # Every authored mail account id (social.mailClient.accounts[].id): used by Route 2 to bound a
    # message's fromAccount to an authored account (hostile-input hygiene).
    def mail_account_ids(data)
      social = data.is_a?(Hash) ? data['social'] : nil
      mail_client = social.is_a?(Hash) ? social['mailClient'] : nil
      accounts = mail_client.is_a?(Hash) ? mail_client['accounts'] : nil
      Array(accounts).filter_map { |acct| acct['id'] if acct.is_a?(Hash) && present_string?(acct['id']) }.uniq
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
          out << { fields: base, source: { writer: path, proof: capture['proof'], owner: owner_id_of(owner), overlaid: false,
                                           **row_meta_source(capture) } }
        end

        next unless kind == :mapping && owner.is_a?(Hash) && owner['usePayload'].is_a?(Hash)

        merged = capture.merge(owner['usePayload'])
        overlaid = capture_entry_fields(merged)
        next unless overlaid

        default_account_address!(overlaid, owner)
        out << { fields: overlaid,
                 source: { writer: "#{path}+payload:#{owner_id_of(owner)}", proof: capture['proof'],
                           owner: owner_id_of(owner), payload_owner: owner_id_of(owner), overlaid: true,
                           **row_meta_source(merged) } }
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
                           payload_owner: owner_id_of(npc), overlaid: true, **row_meta_source(payload) } }
      end

      phish_target_ids(data).each do |target_id|
        target = phish_target(data, target_id)
        role = target && present_string?(target['role']) ? target['role'] : nil
        page_evidence_kits(data).each do |page_id, info|
          cap = landing_page_capture(data, page_id)
          address = cap && present_string?(cap['address']) ? cap['address'] : (target && present_string?(target['address']) ? target['address'] : nil)
          note = cap && present_string?(cap['note']) ? cap['note'] : nil
          fields = capture_entry_fields({ 'targetId' => target_id, 'kind' => 'credential', 'roleLabel' => role, 'address' => address, 'note' => note })
          out << { fields: fields, source: { page: page_id, kits: info[:kits], overlaid: false, secret: cap && cap['secret'] } } if fields
        end

        foothold = target && target['foothold'].is_a?(Hash) ? target['foothold'] : nil
        next unless foothold

        fields = capture_entry_fields({ 'targetId' => target_id, 'kind' => 'foothold', 'roleLabel' => role, 'host' => foothold['host'], 'note' => foothold['note'] })
        out << { fields: fields, source: { phish_foothold: true, overlaid: false } } if fields
      end

      out
    end

    # --- Row tags for the Sign-ins list (keyring K3d, plan 8.7) ------------------------------

    ROW_TAGS = { 'credential' => %w[password pin], 'foothold' => %w[foothold finding] }.freeze
    ROW_SOURCES = %w[phished recorded].freeze
    PIN_PATTERN = /\A\d{3,8}\z/

    # The writer's authored row fields, kept beside a candidate's source (never in its fields, so
    # capture_entry_fields never stores or sends them): the authored secret (read for the pin
    # default, since the record keeps none), and the optional rowTag and rowSource overrides.
    def row_meta_source(raw)
      return {} unless raw.is_a?(Hash)

      { secret: raw['secret'], row_tag: raw['rowTag'], row_source: raw['rowSource'] }
    end
    private_class_method :row_meta_source

    # The one account holder whose username is this address (normalised, as
    # NetworkAccess#account_capture_usernames compares), or nil for none or two or more.
    def capture_account_npc_id(data, address)
      return nil unless present_string?(address)

      want = normalise_username(address)
      matches = room_npc_list(data).select do |npc|
        account_holder?(npc) && normalise_username(npc['creds']['username']) == want
      end
      matches.size == 1 ? matches.first['id'] : nil
    end

    # Addresses that name two or more account holders (the validator's ambiguous-address warning).
    def ambiguous_account_address?(data, address)
      return false unless present_string?(address)

      want = normalise_username(address)
      room_npc_list(data).count { |npc| account_holder?(npc) && normalise_username(npc['creds']['username']) == want } > 1
    end

    # The Sign-ins list's view of one stored capture (plan 8.7): { 'tag', 'source', 'account'? },
    # computed from the stored entry and the scenario, never from the client. The candidate is the
    # first, in pick_capture_candidate's order (plain first), whose fields equal the stored ones,
    # so the read agrees with the record-time choice. `candidates` may be passed in (all of them)
    # so a caller listing every capture walks the writers once.
    def capture_row_meta(data, stored, candidates: nil)
      return nil unless stored.is_a?(Hash) && present_string?(stored['targetId'])

      kind = CAPTURE_KINDS.include?(stored['kind']) ? stored['kind'] : 'credential'
      all = candidates || all_capture_candidates(data)
      mine = all.select { |c| c[:fields]['targetId'] == stored['targetId'] && c[:fields]['kind'] == kind }
      ordered = mine.sort_by { |c| c[:source][:overlaid] ? 1 : 0 }
      chosen = ordered.find { |c| %w[roleLabel address host note].all? { |f| c[:fields][f] == stored[f] } } || ordered.first
      source = chosen ? chosen[:source] : {}

      account = kind == 'credential' ? capture_account_npc_id(data, stored['address']) : nil
      tag = ROW_TAGS[kind].include?(source[:row_tag]) ? source[:row_tag] : nil
      tag ||= if kind == 'credential'
                source[:secret].is_a?(String) && source[:secret].match?(PIN_PATTERN) && account.nil? ? 'pin' : 'password'
              else
                source[:phish_foothold] || source[:payload_owner] ? 'foothold' : 'finding'
              end
      row_source = source[:page] || source[:phish_foothold] ? 'phished' : 'recorded'
      row_source = 'phished' if kind == 'credential' && source[:row_source] == 'phished'

      out = { 'tag' => tag, 'source' => row_source }
      out['account'] = account if account
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
