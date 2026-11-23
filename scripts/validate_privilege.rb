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
# Errors: a field of a later stage (S5b, S5c) is not built yet, so it fails loudly.
# A scenario with no `creds.admin` account and no admin grant gets no line from this file.
require 'json'
require 'set'
require_relative '../lib/break_escape/network_model'
require_relative '../lib/break_escape/access_identities'
require_relative '../lib/break_escape/credential_model'
require_relative '../lib/break_escape/access_work' unless defined?(BreakEscape::AccessWork)

# Field => stage, by where the field sits.
PRIVILEGE_NOT_BUILT_S5B = %w[cachedAccounts].freeze
PRIVILEGE_NOT_BUILT_S5C_CREDS = %w[accountKind localTo domain].freeze

def check_privilege(json_data)
  issues = []
  return issues unless json_data.is_a?(Hash)

  err = ->(msg) { issues << "❌ ERROR: privilege: #{msg}" }
  warn = ->(msg) { issues << "⚠️ WARNING: privilege: #{msg}" }
  privilege_not_built(json_data, err)
  privilege_admin_profile_collisions(json_data, warn)
  privilege_object_warnings(json_data, warn)
  issues
end

def privilege_present?(value)
  BreakEscape::CredentialModel.present_string?(value)
end

# Fields of later stages: one fixed line each, an error, because a field that does nothing is too
# quiet for a warning.
def privilege_not_built(json_data, err)
  ai = BreakEscape::AccessIdentities
  cm = BreakEscape::CredentialModel
  line = ->(field, stage) { "\"#{field}\" is not built yet (privilege plan stage #{stage})" }

  # S5b: cachedAccounts on any object, and a harvested credential proof.
  ai.room_objects(json_data).each do |entry|
    obj = entry[:object]
    err.call("#{entry[:path]}: #{line.call('cachedAccounts', 'S5b')}") if obj.key?('cachedAccounts')
    err.call("#{entry[:path]}: #{line.call('domain', 'S5c')}") if ai.login_pc?(obj) && obj.key?('domain')
  end
  cm.registry(json_data).each do |id, entry|
    proof = entry['proof']
    err.call("credentials/#{id}: #{line.call('harvested', 'S5b')}") if proof.is_a?(Hash) && proof.key?('harvested')
  end

  # S5c: account kinds on creds, and accountOnly on an NPC (the NPC schema is open).
  npcs = ai.room_npcs(json_data).map { |e| [e[:npc], e[:path]] }
  %w[npcs phoneNPCs].each do |key|
    next unless json_data[key].is_a?(Array)

    json_data[key].each_with_index { |npc, i| npcs << [npc, "#{key}[#{i}]"] if npc.is_a?(Hash) }
  end
  npcs.each do |npc, path|
    creds = npc['creds']
    if creds.is_a?(Hash)
      PRIVILEGE_NOT_BUILT_S5C_CREDS.each do |field|
        err.call("#{path}: creds.#{line.call(field, 'S5c')}") if creds.key?(field)
      end
    end
    err.call("#{path}: #{line.call('accountOnly', 'S5c')}") if npc.key?('accountOnly')
  end
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
