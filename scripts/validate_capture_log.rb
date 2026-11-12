# frozen_string_literal: true

# The capture log and capture proofs (docs/achitechture/PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md,
# section 6). One entry point, check_capture_log, called by scripts/validate_scenario.rb beside
# check_network_model. The capture-writer walk and the proof rules come from
# BreakEscape::CaptureModel, which the server shares, so the validator agrees with the server on
# which target ids are declared and which proofs count for an account. Messages never quote a
# password.
require 'json'
require 'set'
require_relative '../lib/break_escape/capture_model'
require_relative '../lib/break_escape/access_identities'
require_relative '../lib/break_escape/network_model'

def check_capture_log(json_data)
  issues = []
  return issues unless json_data.is_a?(Hash)

  cm = BreakEscape::CaptureModel
  ai = BreakEscape::AccessIdentities
  nm = BreakEscape::NetworkModel
  err = ->(msg) { issues << "❌ ERROR: capture log: #{msg}" }
  warn = ->(msg) { issues << "⚠️ WARNING: capture log: #{msg}" }

  # ---- Unique target ids: first capture wins, so a second writer is never recorded ----
  seen = {}
  cm.capture_writers(json_data).each do |writer|
    id = writer[:target_id]
    if seen.key?(id)
      err.call("two capture routes write targetId \"#{id}\" (#{seen[id]} and #{writer[:path]}): " \
               'first capture wins: the second is never recorded. Give each capture its own targetId')
    else
      seen[id] = writer[:path]
    end
  end

  # ---- Authored capture strings are bounded (sync deltas R2, 6a) ----
  # A note is at most MAX_CAPTURE_NOTE_CHARS code points; roleLabel, address and host at most
  # MAX_CAPTURE_FIELD_CHARS; a target id at most MAX_CAPTURE_TARGET_CHARS. The server stores each
  # whole, so an over-long authored string is an error, not a cut.
  # A hard-access value (a lock-opening password/PIN, a Wi-Fi PSK, a flag) in a capture's own
  # note/roleLabel/address/host (review 6a-server M1): the secret field is withheld four ways on
  # the serving path, but these string fields ride the bootstrap mirror and the sync answer
  # verbatim, so an author who put a lock code into a note would leak it on a forged pre-beat
  # claim. Keep the note channel as safe as the secret channel.
  hard_values = cm.hard_access_values(json_data).to_a.select { |v| v.is_a?(String) && v.length >= 3 }
  cm.all_capture_candidates(json_data).each do |cand|
    fields = cand[:fields]
    tid = fields['targetId'].to_s
    err.call("capture targetId \"#{tid[0, 40]}...\" is over #{cm::MAX_CAPTURE_TARGET_CHARS} characters") if tid.length > cm::MAX_CAPTURE_TARGET_CHARS
    if fields['note'].is_a?(String) && fields['note'].length > cm::MAX_CAPTURE_NOTE_CHARS
      err.call("capture note for \"#{tid}\" is over #{cm::MAX_CAPTURE_NOTE_CHARS} characters")
    end
    %w[roleLabel address host].each do |field|
      value = fields[field]
      next unless value.is_a?(String) && value.length > cm::MAX_CAPTURE_FIELD_CHARS

      err.call("capture #{field} for \"#{tid}\" is over #{cm::MAX_CAPTURE_FIELD_CHARS} characters")
    end
    %w[note roleLabel address host].each do |field|
      value = fields[field]
      next unless value.is_a?(String)
      leaked = hard_values.find { |hv| value.include?(hv) }
      next unless leaked

      err.call("capture #{field} for \"#{tid}\" contains a hard-access value (a lock code, PSK or flag): " \
               'these fields ride the bootstrap and sync answer, so a secret here leaks on a forged claim. ' \
               'Keep lock-opening values out of capture note/roleLabel/address/host')
    end
  end

  # ---- Where a proof may live ----
  cm.action_proofs(json_data).each do |entry|
    err.call("#{entry[:path]}: a proof on an add_capture action is not read: put it on the account holder as captureProof")
  end
  shorthands = cm.shorthand_proofs(json_data)
  shorthands.each do |entry|
    next if entry[:holder]

    err.call("#{entry[:path]}: this proof resolves to no account holder (its capture's address names no " \
             'account, and the mapping is not on one): put it on the account holder as captureProof')
  end

  room_npcs = ai.room_npcs(json_data)
  holders = room_npcs.map { |e| e[:npc] }.select { |npc| ai.account?(npc) }

  # A capture writer on an account holder whose targetId is a different NPC must author an
  # explicit address (review 6a-server M2). The account-address default is scoped to self
  # captures, so without an address the server stores none and would key the holder's
  # password on the wrong target. Error at authoring time.
  account_holder_ids = holders.map { |npc| npc['id'].to_s }.to_set
  # One authored capture yields several candidates (the plain mapping and its usePayload
  # overlay), so report each (owner, targetId) pair once, not once per candidate.
  reported_missing_address = Set.new
  cm.all_capture_candidates(json_data).each do |cand|
    source = cand[:source] || {}
    owner_id = source[:owner].to_s
    next unless source.key?(:owner) && !owner_id.empty? && account_holder_ids.include?(owner_id)

    fields = cand[:fields]
    # Only a credential capture binds an account's secret by address (capture_secrets_for_client's
    # by_username); a foothold capture keys on host, so a missing address is fine there.
    next unless fields['kind'] == 'credential'
    next if owner_id == fields['targetId'].to_s
    next if fields['address'].is_a?(String) && !fields['address'].strip.empty?
    next unless reported_missing_address.add?([owner_id, fields['targetId'].to_s])

    err.call("capture for targetId \"#{fields['targetId']}\" is written on account holder " \
             "\"#{owner_id}\" but names no address: a cross-account capture must author an explicit " \
             'address, or the holder\'s password would be served for the wrong target')
  end

  objects = ai.room_objects(json_data)
  object_ids = objects.map { |e| e[:object]['id'] }.compact.map(&:to_s).to_set
  login_pcs = objects.map { |e| e[:object] }.select { |obj| ai.login_pc?(obj) }
  login_pc_ids = login_pcs.map { |pc| pc['id'].to_s }.to_set
  item_defs = capture_log_item_definitions(json_data)
  resources = nm.resources(json_data)
  networks = nm.networks(json_data).any?

  pc_admits = lambda do |pc, npc|
    pc['access'].nil? || ai.acl_admits?(pc['access'], npc)
  end
  lock_codes = cm.lock_codes(json_data)
  # The server's rule (CaptureProofs#account_password_opens_something?): a sign-in PC that
  # admits the account, a password or PIN lock whose code is the password, or an access-listed
  # share that admits it.
  opens_something = lambda do |npc|
    return true if cm.password_opens_lock?(npc, json_data, lock_codes)
    return true if login_pcs.any? { |pc| pc_admits.call(pc, npc) }
    return false unless networks

    resources.values.any? { |res| !res['access'].nil? && ai.acl_admits?(res['access'], npc) }
  end
  capture_route = lambda do |npc|
    npc['usePayload'].is_a?(Hash) ||
      (npc['eventMappings'].is_a?(Array) && npc['eventMappings'].any? { |m| m.is_a?(Hash) && m['addCapture'].is_a?(Hash) })
  end

  # ---- Each proof: well formed, naming what exists ----
  check_proof = lambda do |proof, where, holder|
    kind = cm.proof_kind(proof)
    unless kind
      err.call("#{where}: a proof is one of { \"planted\": item, \"on\"?: object }, { \"dropped\": item } " \
               "or { \"session\": pc }, got #{proof.to_json}")
      next
    end
    case kind
    when 'planted'
      item_id = proof['planted'].to_s
      on = proof['on']
      item = item_defs[item_id]
      err.call("#{where}: planted names \"#{item_id}\", which is no item in the scenario") unless item
      if on && !object_ids.include?(on.to_s)
        err.call("#{where}: planted on \"#{on}\", which is no room object")
        next
      end
      jack = on && objects.any? { |e| e[:object]['id'].to_s == on.to_s && nm.jack?(e[:object]) }
      next if jack || item.nil?

      takers = objects.select do |e|
        obj = e[:object]
        obj['id'].is_a?(String) && !obj['id'].empty? && (on.nil? || obj['id'] == on) && cm.object_takes_item?(obj, item)
      end
      takers.each do |e|
        obj = e[:object]
        wanted = Array(obj['requiresItem']).map(&:to_s)
        next if wanted.include?(item_id)

        shared = item_defs.reject { |id, other| id == item_id || !other.is_a?(Hash) }.select do |_id, other|
          %w[type name].any? { |k| other[k].is_a?(String) && wanted.include?(other[k]) }
        end
        next if shared.empty?

        warn.call("#{where}: \"#{obj['id']}\" asks for its item by type or name (#{wanted.join(', ')}), which " \
                  "#{shared.keys.first(3).join(', ')} also match: the player may plant one of those instead, and " \
                  "this proof names \"#{item_id}\". Name the item by id in requiresItem")
      end
      if takers.empty?
        err.call("#{where}: planted \"#{item_id}\"#{on ? " on \"#{on}\"" : ''} needs a room object with an id and a " \
                 'triggerOnInteract list, whose requiresItem names the item and which consumes it (consumesItem, or a ' \
                 'remove_item naming it), or a network jack: the server records a plant only there')
      end
    when 'dropped'
      item_id = proof['dropped'].to_s
      item = item_defs[item_id]
      if !item
        err.call("#{where}: dropped names \"#{item_id}\", which is no item in the scenario")
      elsif item['droppable'] != true
        err.call("#{where}: dropped names \"#{item_id}\", which is not droppable: the server records only a player_drop")
      end
    when 'session'
      pc_id = proof['session'].to_s
      unless login_pc_ids.include?(pc_id)
        err.call("#{where}: session names \"#{pc_id}\", which is no sign-in PC (lockType login)")
        next
      end
      pc = login_pcs.find { |p| p['id'].to_s == pc_id }
      others = holders.reject { |npc| npc.equal?(holder) }.select { |npc| pc_admits.call(pc, npc) }
      unless others.empty?
        warn.call("#{where}: the session proof on \"#{pc_id}\" also holds after another account signs in there " \
                  "(#{others.map { |n| n['id'] }.join(', ')}): signedInPcs records the PC, not the account")
      end
    end
  end

  room_npcs.each do |entry|
    npc = entry[:npc]
    next unless npc.key?('captureProof')

    unless ai.account?(npc)
      err.call("#{entry[:path]}/captureProof: #{npc['id']} has no account (creds.username), so the proof counts for nothing")
      next
    end
    list = npc['captureProof']
    unless list.is_a?(Array) && !list.empty?
      err.call("#{entry[:path]}/captureProof: a non-empty list of proofs")
      next
    end
    list.each_with_index { |proof, i| check_proof.call(proof, "#{entry[:path]}/captureProof[#{i}]", npc) }
  end
  shorthands.each { |entry| check_proof.call(entry[:proof], entry[:path], entry[:holder]) if entry[:holder] }

  # ---- When the rule is strict ----
  strict = cm.declares_proofs?(json_data)
  room_npcs.each do |entry|
    npc = entry[:npc]
    next unless ai.account?(npc) && capture_route.call(npc)

    password = npc['creds']['password']
    next unless password.is_a?(String) && !password.empty?
    next unless opens_something.call(npc)
    next unless cm.proofs_for(npc, json_data).empty?

    if strict
      err.call("#{npc['id']} (#{entry[:path]}): this scenario declares capture proofs and #{npc['id']}'s password " \
               "opens a sign-in PC or a lock, so #{npc['id']} needs captureProof: with none the password is never served")
    else
      warn.call("#{npc['id']} (#{entry[:path]}): a capture route and a password that opens a sign-in PC or a lock, with no " \
                'captureProof: a forged capture is served the password. Add a proof (engine plan section 6)')
    end
  end

  # ---- Items filed in a holder (storeIn) ----
  holder_ids = Set.new
  capture_log_each_item(json_data) do |item, _path, _how|
    holder_ids << item['id'].to_s if item['holds'].is_a?(Hash) && item['id'].is_a?(String)
  end
  secrets = capture_log_secret_strings(json_data, holders)
  capture_log_each_item(json_data) do |item, path, how|
    next unless item.key?('storeIn')

    store_in = item['storeIn']
    unless store_in.is_a?(String) && !store_in.empty?
      err.call("#{path}: storeIn is the id of a holder item (one with holds)")
      next
    end
    warn.call("#{path}: storeIn \"#{store_in}\" names no holder item (an item with holds) in this scenario") unless holder_ids.include?(store_in)
    if how == :room && item['takeable'] != true
      warn.call("#{path}: an item with storeIn is filed only once held: make it takeable, a grant or a gift")
    end
    if item.key?('addToNotes')
      warn.call("#{path}: addToNotes is ignored on an item with storeIn (it is filed in the holder, not added to the Notepad)")
    end
    text = [item['text'], item['observations']].select { |t| t.is_a?(String) }.join("\n")
    hit = secrets.find { |s| text.include?(s) }
    if hit
      warn.call("#{path}: this storeIn text contains a lock code or an account password, and a granted text ships " \
                'in the bootstrap: put it in the contents of a session-style item, which the server holds back')
    end
  end

  # ---- A jack's linkStoreIn: the server copies it into the link item's storeIn ----
  objects.each do |e|
    obj = e[:object]
    next unless nm.jack?(obj) && obj.key?('linkStoreIn')

    where = "#{e[:path]}/linkStoreIn"
    link_store_in = obj['linkStoreIn']
    unless link_store_in.is_a?(String) && !link_store_in.empty?
      err.call("#{where}: linkStoreIn is the id of a holder item (one with holds)")
      next
    end
    unless holder_ids.include?(link_store_in)
      warn.call("#{where}: linkStoreIn \"#{link_store_in}\" names no holder item (an item with holds) in this scenario, so the link item stays in the tray")
    end
  end

  issues
end

# { itemId => definition } for every item-like hash with an id: room objects (and their
# contents), NPC itemsHeld, startItemsInInventory and give_item items.
def capture_log_item_definitions(json_data)
  out = {}
  capture_log_each_item(json_data) { |item, _path, _how| out[item['id'].to_s] ||= item if item['id'].is_a?(String) }
  out
end

# Yields (item, path, how) for every item definition: how is :room (a room object or its
# contents), :held (an NPC's itemsHeld, a gift), :start (startItemsInInventory) or :grant (a
# give_item's item, anywhere).
def capture_log_each_item(json_data, &block)
  list_walk = lambda do |list, path, how|
    next unless list.is_a?(Array)

    list.each_with_index do |obj, i|
      next unless obj.is_a?(Hash)

      block.call(obj, "#{path}[#{i}]", how)
      list_walk.call(obj['contents'], "#{path}[#{i}]/contents", how)
    end
  end
  list_walk.call(json_data['startItemsInInventory'], 'startItemsInInventory', :start)
  rooms = json_data['rooms'].is_a?(Hash) ? json_data['rooms'] : {}
  rooms.each do |room_id, room|
    next unless room.is_a?(Hash)

    list_walk.call(room['objects'], "rooms/#{room_id}/objects", :room)
    Array(room['npcs']).each_with_index do |npc, i|
      list_walk.call(npc['itemsHeld'], "rooms/#{room_id}/npcs[#{i}]/itemsHeld", :held) if npc.is_a?(Hash)
    end
  end
  grant_walk = lambda do |node, path|
    case node
    when Hash
      if node['type'] == 'give_item' && node['item'].is_a?(Hash)
        block.call(node['item'], "#{path}/item", :grant)
        list_walk.call(node['item']['contents'], "#{path}/item/contents", :grant)
      end
      node.each { |k, v| grant_walk.call(v, "#{path}/#{k}") }
    when Array
      node.each_with_index { |v, i| grant_walk.call(v, "#{path}[#{i}]") }
    end
  end
  grant_walk.call(json_data, '')
end

# Every lock code (a string requires) and every account password, for the storeIn text check.
def capture_log_secret_strings(json_data, holders)
  out = Set.new
  holders.each do |npc|
    pw = npc['creds']['password']
    out << pw if pw.is_a?(String) && pw.length >= 3
  end
  walk = lambda do |node|
    case node
    when Hash
      req = node['requires']
      out << req if req.is_a?(String) && req.length >= 3 && node['lockType'].is_a?(String) && %w[pin password].include?(node['lockType'])
      node.each_value { |v| walk.call(v) }
    when Array
      node.each { |v| walk.call(v) }
    end
  end
  walk.call(json_data['rooms'])
  out.to_a
end
