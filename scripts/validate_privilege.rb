# frozen_string_literal: true

# Privilege on a session (docs/achitechture/OPS_PRIVILEGE_ACCOUNTS_PLAN.md section 9), stage S5a.
# One entry point, check_privilege, called by scripts/validate_scenario.rb beside check_network_ops.
# Admission is always asked through BreakEscape::CredentialModel.pc_admits_account?, so the
# validator and the server agree. Messages never quote a password.
#
# Warnings (S5a):
#   (a) two profiles with top-level items of the same name that meet on one PC only through an
#       admin session, when the PC's owner is admitted by one of the two profiles;
#   (b) a remove_item that is not the first action of its list on a USB-governed object;
#   (c) one object whose needsSession grants name two different PCs.
# S5b adds the cached accounts checks (privilege_cached_accounts); S5c adds the account kind and
# account-only checks (privilege_account_kinds).
# A scenario with no `creds.admin` account and no admin grant gets no line from this file.
require 'json'
require 'set'
require_relative '../lib/break_escape/network_model'
require_relative '../lib/break_escape/access_identities'
require_relative '../lib/break_escape/credential_model'
require_relative '../lib/break_escape/cached_accounts'
require_relative '../lib/break_escape/access_work' unless defined?(BreakEscape::AccessWork)

def check_privilege(json_data)
  issues = []
  return issues unless json_data.is_a?(Hash)

  err = ->(msg) { issues << "❌ ERROR: privilege: #{msg}" }
  warn = ->(msg) { issues << "⚠️ WARNING: privilege: #{msg}" }
  info = ->(msg) { issues << "ℹ️ INFO: privilege: #{msg}" }
  privilege_cached_accounts(json_data, err, warn, info) # S5b
  privilege_port_of(json_data, err, warn) # S5 ruling A
  privilege_account_kinds(json_data, err, warn, info) # S5c
  privilege_admin_profile_collisions(json_data, warn)
  privilege_object_warnings(json_data, warn)
  issues
end

def privilege_present?(value)
  BreakEscape::CredentialModel.present_string?(value)
end

# The accounts that can hold an admin session at a PC: a `creds.admin: true` account the PC's
# access list admits, and the account named by an admin grant of a weakness on the PC's own host.
def privilege_admin_accounts_at(json_data, pc)
  cm = BreakEscape::CredentialModel
  ai = BreakEscape::AccessIdentities
  out = []
  ai.room_npcs(json_data).each do |e|
    npc = e[:npc]
    creds = npc['creds']
    next unless creds.is_a?(Hash) && creds['admin'] == true && ai.account?(npc)

    out << npc if cm.pc_admits_account?(pc, npc)
  end
  BreakEscape::NetworkModel.weaknesses(json_data).each do |rec|
    next unless rec[:host_id].to_s == pc['id'].to_s

    session = rec[:entry].dig('grants', 'session')
    next unless session.is_a?(Hash) && session['access'] == 'admin'

    npc = cm.account_npc(json_data, session['account'])
    out << npc if npc && cm.pc_admits_account?(pc, npc)
  end
  out.uniq { |n| n['id'] }
end

# (a) An admin session at a PC opens the profiles of the PC's owner on top of its own account's.
# Two profiles that both show a top-level item of one name collide only there when the owner is
# admitted by one of them (A) and the admin account by the other (B), and no account is admitted by
# both.
def privilege_admin_profile_collisions(json_data, warn)
  profiles = json_data['accountProfiles'].is_a?(Hash) ? json_data['accountProfiles'] : {}
  return if profiles.empty?

  ai = BreakEscape::AccessIdentities
  cm = BreakEscape::CredentialModel
  admitting = ->(npc) { profiles.select { |_id, p| p.is_a?(Hash) && ai.acl_admits?(p['for'], npc) }.keys }
  names = lambda do |profile_id|
    Array(profiles[profile_id]['contents']).select { |i| i.is_a?(Hash) && privilege_present?(i['name']) }
                                           .map { |i| i['name'].to_s.strip.downcase }.to_set
  end

  ai.sign_in_pcs(json_data).each do |entry|
    pc = entry[:object]
    owner = cm.account_npc(json_data, ai.owner_id(pc, json_data))
    next unless owner

    owner_profiles = admitting.call(owner)
    next if owner_profiles.empty?

    privilege_admin_accounts_at(json_data, pc).each do |admin|
      next if admin['id'].to_s == owner['id'].to_s

      admin_profiles = admitting.call(admin)
      owner_profiles.each do |a|
        next if admin_profiles.include?(a)

        admin_profiles.each do |b|
          next if owner_profiles.include?(b) || a == b

          (names.call(a) & names.call(b)).each do |name|
            warn.call("sign-in PC '#{pc['id']}': profiles '#{a}' and '#{b}' both hold a top-level item named " \
                      "'#{name}', and they meet on this PC only in an admin session by '#{admin['id']}'. " \
                      'Rename one so the admin desktop does not show two of them.')
          end
        end
      end
    end
  end
end

# Every action list of an object's triggerOnInteract, each confirm_action onConfirm included.
def privilege_action_lists(actions, out = [])
  return out unless actions.is_a?(Array)

  out << actions
  actions.each do |action|
    privilege_action_lists(action['onConfirm'], out) if action.is_a?(Hash) && action['type'] == 'confirm_action'
  end
  out
end

# Every needsSession grant_foothold action of an object, at any depth, in list order.
def privilege_session_grants(actions, out = [])
  return out unless actions.is_a?(Array)

  actions.each do |action|
    next unless action.is_a?(Hash)

    out << action if action['type'] == 'grant_foothold' && action['needsSession']
    privilege_session_grants(action['onConfirm'], out) if action['type'] == 'confirm_action'
  end
  out
end

# (b) a remove_item after another action on a USB-governed object; (c) needsSession grants that
# name two PCs.
def privilege_object_warnings(json_data, warn)
  BreakEscape::AccessIdentities.room_objects(json_data).each do |entry|
    obj = entry[:object]
    where = "#{entry[:path]} (#{obj['id'] || obj['name'] || '?'})"

    if BreakEscape::AccessWork.usb_governed?(obj)
      privilege_action_lists(obj['triggerOnInteract']).each do |list|
        next unless list.each_with_index.any? { |a, i| i.positive? && a.is_a?(Hash) && a['type'] == 'remove_item' }

        warn.call("#{where}: a remove_item that is not the first action of its list on a USB-governed object. " \
                  'A gated remove stops its list there and waits, so the actions before it run even when the ' \
                  'server refuses the plant. Put the remove_item first.')
      end
    end

    pcs = privilege_session_grants(obj['triggerOnInteract']).map { |a| a['pc'].to_s.strip }.reject(&:empty?).uniq
    next unless pcs.length > 1

    warn.call("#{where}: its needsSession grants name more than one PC (#{pcs.join(', ')}). " \
              "The engine judges only the first, '#{pcs.first}'.")
  end
end

# ---- S5b: cached accounts ---------------------------------------------------------------------
# Every message below needs a `cachedAccounts` list or a `harvested` proof to be present, so a
# scenario with neither gets no line from this part.
PRIVILEGE_PC_ID_MAX = 40

def privilege_cached_accounts(json_data, err, warn, info)
  ai = BreakEscape::AccessIdentities
  cm = BreakEscape::CredentialModel
  ca = BreakEscape::CachedAccounts
  pcs = ai.sign_in_pcs(json_data).to_h { |e| [e[:object]['id'].to_s, e[:object]] }
  registry = cm.registry(json_data)

  ai.room_objects(json_data).each do |entry|
    obj = entry[:object]
    next unless obj.key?('cachedAccounts')

    where = "#{entry[:path]} (#{obj['id'] || obj['name'] || '?'})"
    unless ai.login_pc?(obj)
      err.call("#{where}: cachedAccounts is only for a sign-in PC (a sign-in PC has lockType \"login\")")
      next
    end
    privilege_check_cache_list(json_data, obj, where, registry, err, warn, info)
  end

  registry.each do |id, rec|
    proof = rec['proof']
    next unless proof.is_a?(Hash) && proof.key?('harvested')

    label = "credentials/#{id.to_s[0, 64]}"
    unless rec['kind'] == 'hash'
      err.call("#{label}: a harvested proof is only for a hash credential")
      next
    end
    pc_id = proof['harvested']
    pc = pc_id.is_a?(String) ? pcs[pc_id] : nil
    unless pc
      err.call("#{label}: harvested names '#{pc_id.to_s[0, 60]}', which is not a sign-in PC")
      next
    end
    next if ca.candidates(pc).any? { |c| c['npc'] == rec['account'] }

    err.call("#{label}: account '#{rec['account'].to_s[0, 60]}' is not in the cachedAccounts of '#{pc_id}'")
  end
end

def privilege_check_cache_list(json_data, pc, where, registry, err, warn, info)
  cm = BreakEscape::CredentialModel
  ai = BreakEscape::AccessIdentities
  ca = BreakEscape::CachedAccounts
  pc_id = pc['id'].to_s
  list = pc['cachedAccounts']
  unless list.is_a?(Array)
    err.call("#{where}: cachedAccounts must be a list of { npc, after? } entries")
    return
  end
  err.call("#{where}: cachedAccounts lists #{list.length} accounts; the server reads at most #{ca::MAX_CANDIDATES}") if list.length > ca::MAX_CANDIDATES
  err.call("#{where}: PC id '#{pc_id[0, 60]}' holds a '#{ca::PAIR_SEPARATOR}', which the cached-account pair strings use as a separator") if pc_id.include?(ca::PAIR_SEPARATOR)
  err.call("#{where}: PC id '#{pc_id[0, 60]}' is #{pc_id.length} characters; a cached-accounts PC id is at most #{PRIVILEGE_PC_ID_MAX}") if pc_id.length > PRIVILEGE_PC_ID_MAX

  owned = !ai.owner_id(pc).nil?
  headless = BreakEscape::NetworkModel.headless?(pc)
  seen = {}
  named_ok = []
  list.each_with_index do |item, i|
    unless item.is_a?(Hash) && item['npc'].is_a?(String) && !item['npc'].empty?
      err.call("#{where}: cachedAccounts[#{i}] must be an object with an npc id")
      next
    end
    npc_id = item['npc']
    if seen[npc_id]
      err.call("#{where}: cachedAccounts names '#{npc_id[0, 60]}' more than once")
      next
    end
    seen[npc_id] = true
    err.call("#{where}: account id '#{npc_id[0, 60]}' holds a '#{ca::PAIR_SEPARATOR}', which the cached-account pair strings use as a separator") if npc_id.include?(ca::PAIR_SEPARATOR)
    npc = cm.account_npc(json_data, npc_id)
    unless npc
      err.call("#{where}: cachedAccounts names '#{npc_id[0, 60]}', which is not an account holder")
      next
    end
    named_ok << npc

    after = item['after']
    err.call("#{where}: cachedAccounts['#{npc_id[0, 60]}'] 'after' must be \"borrow\" or absent") unless ca::AFTER_VALUES.include?(after)
    privilege_check_borrow_candidate(json_data, pc, npc, where, owned, headless, err) if after == 'borrow'

    hashes = registry.select do |_id, rec|
      rec['kind'] == 'hash' && rec['account'] == npc_id && cm.proof_kind(rec['proof']) == 'harvested' && rec.dig('proof', 'harvested') == pc_id
    end
    unless hashes.length == 1
      err.call("#{where}: cached accounts are hashes: author one hash record per PC and account (PC '#{pc_id[0, 60]}', account '#{npc_id[0, 60]}')")
    end
    info.call("#{where}: account '#{npc_id}' is collect-only on PC '#{pc_id}' (the PC's access list does not admit it)") unless cm.pc_admits_account?(pc, npc)
  end

  admins = privilege_admin_accounts_at(json_data, pc)
  if admins.empty?
    warn.call("#{where}: PC '#{pc_id}' caches accounts but no admin path reaches it (no admitted account with creds.admin and no step-up weakness on its host), so nothing here can be collected")
    return
  end
  owner = owned ? cm.account_npc(json_data, ai.owner_id(pc)) : nil
  return unless owner && named_ok.none? { |n| n['id'] == owner['id'] }

  info.call("#{where}: owner '#{owner['id']}' of PC '#{pc_id}' is not collectable here (its cachedAccounts does not name the owner)")
end

# An `after: "borrow"` candidate: an unowned, non-headless PC (the engine performs a borrow only
# there), and a borrow_session workaround of the account holder that names this PC.
def privilege_check_borrow_candidate(json_data, pc, npc, where, owned, headless, err)
  pc_id = pc['id'].to_s
  err.call("#{where}: after \"borrow\" is only for a PC with no owner ('#{pc_id}' has owner '#{pc['owner'].to_s[0, 60]}'); the engine never borrows an owned PC") if owned
  err.call("#{where}: after \"borrow\" is not allowed on a headless PC ('#{pc_id}'); the engine never borrows one") if headless
  borrows = BreakEscape::AccessWork.workarounds(json_data, npc).any? { |w| w['do'] == 'borrow_session' && w['pc'].to_s == pc_id }
  return if borrows

  err.call("#{where}: '#{npc['id']}' has no borrow_session workaround for PC '#{pc_id}', so the account is never cached after a borrow")
end

# ---- S5 ruling A: portOf ----------------------------------------------------------------------
# A USB-governed object may say which sign-in PC it is the port of (`portOf`), so an admin session at
# that PC can plant a storage stick the object's policy would refuse. Every message below needs a
# `portOf` key, so a scenario with none gets no line from this part.
def privilege_port_of(json_data, err, warn)
  ai = BreakEscape::AccessIdentities
  aw = BreakEscape::AccessWork
  pcs = ai.sign_in_pcs(json_data).to_h { |e| [e[:object]['id'].to_s, e[:object]] }

  ai.room_objects(json_data).each do |entry|
    obj = entry[:object]
    next unless obj.key?('portOf')

    where = "#{entry[:path]} (#{obj['id'] || obj['name'] || '?'})"
    port = obj['portOf']
    if ai.login_pc?(obj)
      err.call("#{where}: portOf is not for a sign-in PC; a sign-in PC is its own port")
      next
    end
    if !port.is_a?(String) || port.strip.empty?
      err.call("#{where}: portOf must name a sign-in PC by its id (a non-blank string)")
    elsif !pcs.key?(port)
      err.call("#{where}: portOf names '#{port[0, 60]}', which is not a sign-in PC in a room")
    end
    err.call("#{where}: portOf needs a USB-governed object, and no policy governs this object (give it a policy)") unless aw.usb_governed?(obj)

    grant = privilege_session_grants(obj['triggerOnInteract']).map { |a| a['pc'].to_s.strip }.find { |pc| !pc.empty? }
    if grant && port.is_a?(String) && grant != port
      err.call("#{where}: its needsSession grant names '#{grant[0, 60]}', not the port's PC '#{port[0, 60]}'. " \
               'The engine judges the grant first, so the port would be ignored.')
    end

    pc = port.is_a?(String) ? pcs[port] : nil
    next unless pc && aw.usb_governed?(obj)

    mine = aw.usb_policy_for(json_data, obj)
    theirs = aw.usb_policy_for(json_data, pc)
    next if mine == theirs

    warn.call("#{where}: the port's USB policy ('#{mine}') differs from the policy of '#{port[0, 60]}' ('#{theirs}'). " \
              "The stick is judged by the port's own policy.")
  end
end

# ---- S5c: account kinds and account-only accounts ---------------------------------------------
# Every message below needs `creds.accountKind`, `localTo`, `creds.domain`, a PC `domain` or an
# `accountOnly` key to be present, so a scenario with none gets no line from this part.
PRIVILEGE_DOMAIN_PATTERN = /\A[A-Za-z0-9.-]{1,32}\z/
PRIVILEGE_ACCOUNT_ONLY_KEYS = %w[id displayName npcType creds role staff accountOnly].freeze

def privilege_account_kinds(json_data, err, warn, info)
  ai = BreakEscape::AccessIdentities
  cm = BreakEscape::CredentialModel
  pcs = ai.sign_in_pcs(json_data).to_h { |e| [e[:object]['id'].to_s, e[:object]] }
  pc_domains = privilege_pc_domains(json_data, err)
  npcs = privilege_all_npcs(json_data)
  used_domains = Set.new

  npcs.each do |npc, path|
    creds = npc['creds']
    next unless creds.is_a?(Hash)

    where = "#{path} (#{npc['id'] || '?'})"
    used_domains.merge(privilege_check_kind(npc, where, pcs, pc_domains, err, warn, info))
  end

  # An owner whose account kind refuses its own PC could never sign in at it.
  pcs.each_value do |pc|
    owner = cm.account_npc(json_data, ai.owner_id(pc))
    next unless owner && !ai.account_kind_admits?(pc, owner)

    err.call("sign-in PC '#{pc['id'].to_s[0, 60]}': its owner '#{owner['id'].to_s[0, 60]}' has an account kind that refuses this PC, so the owner could never sign in at it")
  end

  # A borrower at a PC whose account kind refuses that PC could never use the borrowed session.
  npcs.each do |npc, path|
    next unless cm.account_npc(json_data, npc['id'])

    BreakEscape::AccessWork.workarounds(json_data, npc).each do |w|
      next unless w['do'] == 'borrow_session'

      pc = pcs[w['pc'].to_s]
      next unless pc && !ai.account_kind_admits?(pc, npc)

      err.call("#{path} (#{npc['id']}): its borrow_session at PC '#{w['pc'].to_s[0, 60]}' needs an account that the account kind refuses there")
    end
  end

  pc_domains.each do |pc_id, dom|
    next if used_domains.include?(dom)

    warn.call("sign-in PC '#{pc_id[0, 60]}': domain '#{dom[0, 40]}' is used by no account's creds.domain")
  end

  privilege_account_only(json_data, npcs, err, warn)
end

# Every sign-in PC's authored domain, as { pc id => domain }; a bad one is an error and left out.
def privilege_pc_domains(json_data, err)
  ai = BreakEscape::AccessIdentities
  out = {}
  ai.room_objects(json_data).each do |entry|
    obj = entry[:object]
    next unless obj.key?('domain')

    where = "#{entry[:path]} (#{obj['id'] || obj['name'] || '?'})"
    dom = obj['domain']
    unless ai.login_pc?(obj)
      err.call("#{where}: domain is only for a sign-in PC (a sign-in PC has lockType \"login\")")
      next
    end
    unless dom.is_a?(String) && dom.match?(PRIVILEGE_DOMAIN_PATTERN)
      err.call("#{where}: domain must be 1 to 32 letters, digits, dots or hyphens")
      next
    end
    out[obj['id'].to_s] = dom
  end
  out
end

# Room NPCs and phone NPCs, as [npc, path].
def privilege_all_npcs(json_data)
  npcs = BreakEscape::AccessIdentities.room_npcs(json_data).map { |e| [e[:npc], e[:path]] }
  %w[npcs phoneNPCs].each do |key|
    next unless json_data[key].is_a?(Array)

    json_data[key].each_with_index { |npc, i| npcs << [npc, "#{key}[#{i}]"] if npc.is_a?(Hash) }
  end
  npcs
end

# The kind fields of one account. Returns the domains this account uses.
def privilege_check_kind(npc, where, pcs, pc_domains, err, warn, info)
  creds = npc['creds']
  used = []
  return used unless creds.key?('accountKind') || creds.key?('localTo') || creds.key?('domain')

  kind = creds['accountKind']
  if creds.key?('accountKind') && !%w[local domain].include?(kind)
    err.call("#{where}: creds.accountKind must be \"local\" or \"domain\"")
    return used
  end

  if creds.key?('domain')
    dom = creds['domain']
    if !dom.is_a?(String) || !dom.match?(PRIVILEGE_DOMAIN_PATTERN)
      err.call("#{where}: creds.domain must be 1 to 32 letters, digits, dots or hyphens")
    elsif kind != 'domain'
      warn.call("#{where}: creds.domain does nothing without accountKind \"domain\"")
    end
  end
  warn.call("#{where}: creds.localTo does nothing without accountKind \"local\"") if creds.key?('localTo') && kind != 'local'

  case kind
  when 'local'
    privilege_check_local(npc, where, pcs, err, info)
  when 'domain'
    dom = creds['domain']
    if !dom.is_a?(String) || dom.empty?
      err.call("#{where}: a domain account needs creds.domain")
    elsif dom.match?(PRIVILEGE_DOMAIN_PATTERN)
      used << dom
      err.call("#{where}: creds.domain '#{dom[0, 40]}' is the domain of no sign-in PC") unless pc_domains.value?(dom)
    end
  end
  used
end

def privilege_check_local(npc, where, pcs, err, info)
  creds = npc['creds']
  list = creds['localTo']
  unless list.is_a?(Array) && !list.empty? && list.all? { |id| id.is_a?(String) }
    err.call("#{where}: a local account needs creds.localTo, a list of sign-in PC ids")
    return
  end
  list.each do |id|
    unless pcs.key?(id)
      err.call("#{where}: creds.localTo names '#{id[0, 60]}', which is not a sign-in PC")
      next
    end
    acl = pcs[id]['access']
    next if acl.nil? || BreakEscape::AccessIdentities.acl_admits?(acl, npc)

    err.call("#{where}: creds.localTo names '#{id[0, 60]}', but that PC's access list refuses the account, so it could never sign in there")
  end
  info.call("#{where}: a shared local administrator (it opens #{list.uniq.length} PCs once cracked)") if creds['admin'] == true && list.uniq.length > 1
end

# accountOnly: an account with no person behind it.
def privilege_account_only(json_data, npcs, err, warn = nil)
  ai = BreakEscape::AccessIdentities
  aw = BreakEscape::AccessWork
  only = {}
  npcs.each do |npc, path|
    next unless npc.key?('accountOnly')

    where = "#{path} (#{npc['id'] || '?'})"
    unless [true, false].include?(npc['accountOnly'])
      err.call("#{where}: accountOnly must be true or false")
      next
    end
    next unless npc['accountOnly'] == true

    only[npc['id'].to_s] = npc
    creds = npc['creds']
    err.call("#{where}: an account-only NPC needs creds.username") unless creds.is_a?(Hash) && privilege_present?(creds['username'])
    if creds.is_a?(Hash) && creds.key?('card')
      err.call("#{where}: an account-only NPC cannot carry creds.card; it is not a person who holds a badge")
    end
    unless [true, false].include?(npc['staff'])
      err.call("#{where}: an account-only NPC needs staff set to true or false (an NPC with creds is staff unless it says false)")
    end
    npc.each_key do |key|
      next if PRIVILEGE_ACCOUNT_ONLY_KEYS.include?(key) || key.to_s.start_with?('_')

      err.call("#{where}: an account-only NPC may not carry '#{key.to_s[0, 40]}'; it has no person, position or story")
    end
    err.call("#{where}: an account-only NPC cannot have workarounds (it is not a person who acts)") if aw.workarounds(json_data, npc).any?
  end
  return if only.empty?

  privilege_account_only_names(json_data, only, npcs, err, warn || ->(_msg) { })
  # An account-only account owns no items (it has no itemsHeld); an item owner is a person
  BreakEscape::MfaModel.each_authored_item(json_data).each do |entry|
    item = entry[:item]
    owner = item['owner']
    next unless owner.is_a?(String) && only.key?(owner)

    err.call("item '#{item['id'].to_s[0, 60]}': its owner '#{owner[0, 60]}' is an account-only NPC; an account with no person behind it owns no items")
  end
  ai.sign_in_pcs(json_data).each do |entry|
    pc = entry[:object]
    owner = ai.owner_id(pc)
    err.call("sign-in PC '#{pc['id'].to_s[0, 60]}': its owner '#{owner.to_s[0, 60]}' is an account-only NPC; an owner is a person who sits at the PC") if owner && only.key?(owner)
    Array(pc['cachedAccounts']).each do |item|
      next unless item.is_a?(Hash) && item['after'] == 'borrow' && only.key?(item['npc'].to_s)

      err.call("sign-in PC '#{pc['id'].to_s[0, 60]}': cachedAccounts names account-only '#{item['npc'].to_s[0, 60]}' after \"borrow\"; nobody borrows for it")
    end
  end
  npcs.each do |npc, path|
    aw.workarounds(json_data, npc).each do |w|
      next unless w['do'] == 'share_login' && only.key?(w['with'].to_s)

      err.call("#{path} (#{npc['id']}): share_login names account-only '#{w['with'].to_s[0, 60]}' as the colleague; it is not a person who can be asked")
    end
  end
end

# L9 (S5bc R1): an account-only account is found by its display name and username in the answers the
# scanner reads, so a name that is also something else would make honest answers look like leaks.
# Error: the display name or username equals, whole and in any case, another NPC's id, display name or
# username, a sign-in PC's name or host, a room name, a log source title, or a word the answers carry
# (the scanner's own lists, so the two agree). Warning: an authored string the browser is served holds
# the name as a whole word.
PRIVILEGE_L9_SKIP_KEYS = %w[id npc npcId owner account for with pc host].freeze

def privilege_l9_answer_words
  require_relative '../tools/playtest/lib/access_leak_scanner' unless defined?(AccessLeakScanner)
  s = AccessLeakScanner
  keys = s::HARVEST_ANSWER_KEYS + s::HARVEST_ROW_KEYS + s::RELAY_FORBIDDEN_KEYS + s::HARVEST_SESSION_WORDS +
         s::OPS_SESSION_KEYS + s::LOG_ANSWER_KEYS + s::LOG_ROW_KEYS.flatten + s::CRACK_ROW_KEYS +
         s::CRACK_ACCOUNT_KEYS + s::CRACK_ENTRY_KEYS + s::CRACK_CREDENTIAL_KEYS + s::KEYRING_CAPTURE_KEYS
  (s::HARVEST_ANSWER_WORDS + s::HARVEST_PLAIN_WORDS + keys).map { |w| w.strip.downcase }.to_set
end

def privilege_l9_name_sources(json_data, npcs, own)
  out = {}
  add = lambda do |word, what|
    out[word.strip.downcase] ||= what if word.is_a?(String) && !word.strip.empty?
  end
  npcs.each do |npc, _|
    next if npc.equal?(own)

    add.call(npc['id'], "another NPC's id")
    add.call(npc['displayName'], "another NPC's display name")
    add.call(npc.dig('creds', 'username'), "another NPC's username") if npc['creds'].is_a?(Hash)
  end
  BreakEscape::AccessIdentities.sign_in_pcs(json_data).each do |e|
    add.call(e[:object]['name'], 'a PC name')
    add.call(e[:object]['host'], 'a PC host')
  end
  rooms = json_data['rooms'].is_a?(Hash) ? json_data['rooms'].values : []
  rooms.each { |room| add.call(room['name'], 'a room name') if room.is_a?(Hash) }
  logs = json_data['logSources'].is_a?(Hash) ? json_data['logSources'].values : []
  logs.each { |src| add.call(src['title'], 'a log source title') if src.is_a?(Hash) }
  out
end

def privilege_account_only_names(json_data, only, npcs, err, warn)
  words = privilege_l9_answer_words
  names = {} # lowercase name => account-only id
  only.each do |id, npc|
    sources = privilege_l9_name_sources(json_data, npcs, npc)
    [['display name', npc['displayName']], ['username', npc.dig('creds', 'username')]].each do |label, value|
      next unless value.is_a?(String) && !value.strip.empty?

      low = value.strip.downcase
      names[low] ||= id
      what = sources[low] || (words.include?(low) ? 'a word the answers carry' : nil)
      err.call("account-only NPC '#{id[0, 60]}': its #{label} '#{value[0, 40]}' is also #{what}, so honest answers would look like leaks; rename it") if what
    end
  end
  privilege_l9_served_strings(json_data, only, names, warn)
end

def privilege_l9_served_strings(json_data, only, names, warn)
  return if names.empty?

  s = AccessLeakScanner
  skip = Set.new(s::WITHHELD_KEYS + s::WITHHELD_ROOM_KEYS + s::WITHHELD_WORK_KEYS + PRIVILEGE_L9_SKIP_KEYS +
                 %w[creds cachedAccounts accountOnly credentials workarounds])
  patterns = names.keys.to_h { |n| [n, /(?<![[:alnum:]_])#{Regexp.escape(n)}(?![[:alnum:]_])/i] }
  seen = Set.new
  walk = lambda do |value, path|
    case value
    when Hash
      return if value.key?('id') && only.key?(value['id'].to_s) && value['accountOnly'] == true

      value.each { |k, v| walk.call(v, "#{path}.#{k}") unless skip.include?(k.to_s) || k.to_s.start_with?('_') }
    when Array
      value.each_with_index { |v, i| walk.call(v, "#{path}[#{i}]") }
    when String
      patterns.each do |n, re|
        next unless value.match?(re) && seen.add?([path, n])

        tail = if path.match?(/access\.people\[\d+\]\z/)
                 'the server strips it from every answer, so it does nothing here (authoring hint only)'
        else
                 'and the browser is served it'
        end
        warn.call("#{path.sub(/\A\./, "")[0, 80]}: authored text holds the account-only name '#{n[0, 40]}' as a whole word; #{tail}")
      end
    end
  end
  walk.call(json_data, '')
end
