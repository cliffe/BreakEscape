# frozen_string_literal: true

# Multi-factor sign-in lints (MFA plan, stage S8a, feature A22). One entry point, check_mfa, called
# by scripts/validate_scenario.rb beside check_privilege. Every question about who a policy asks,
# which accounts are enrolled and which devices the player can come to hold is answered through
# BreakEscape::MfaModel and CredentialModel, so the validator and the server agree. No line ever
# quotes a code, a number or a password.
#
# A scenario with no `mfa` policy value, no `code_device` item, no `creds.mfa`, no prompt habit key
# and none of the S8b fields gets no line from this file (except the loose owned phone warning,
# which reads an item type that already exists).
require 'json'
require_relative '../lib/break_escape/access_identities'
require_relative '../lib/break_escape/credential_model'
require_relative '../lib/break_escape/network_model'
require_relative '../lib/break_escape/mfa_model'
require_relative 'validate_access_work'

MFA_PUSH_KINDS = %w[push push_number_match].freeze
MFA_PROMPT_KEYS = %w[approvesPrompts promptPatience].freeze
MFA_PHONE = 'phone_friendface'

def check_mfa(json_data)
  issues = []
  return issues unless json_data.is_a?(Hash)

  err = ->(msg) { issues << "❌ ERROR: mfa: #{msg}" }
  warn = ->(msg) { issues << "⚠️ WARNING: mfa: #{msg}" }
  info = ->(msg) { issues << "ℹ️ INFO: mfa: #{msg}" }
  mm = BreakEscape::MfaModel
  story = ->(path) { ValidateAccessWork.story_file(path) }

  mfa_not_built(json_data, err)
  mfa_policy_values(json_data, err)
  mfa_creds_values(json_data, err)
  mfa_device_errors(json_data, err)
  mfa_pc_errors(json_data, err, warn, info, mm)
  mfa_device_warnings(json_data, warn, info, mm, story)
  mfa_loose_phones(json_data, warn, mm)
  mfa_patience_warnings(json_data, warn, mm)
  mfa_saved_connections(json_data, warn, mm)
  issues
end

def mfa_room_npcs(json_data)
  BreakEscape::AccessIdentities.room_npcs(json_data).map { |e| [e[:npc], e[:path]] }
end

def mfa_name(npc)
  "NPC '#{npc['id']}'"
end

# The S8b fields: one fixed line each, an error (follows validate_privilege.rb).
def mfa_not_built(json_data, err)
  line = ->(field) { "\"#{field}\" is not built yet (MFA plan stage S8b)" }
  err.call(line.call('helpdesks')) if json_data.key?('helpdesks')
  mfa_room_npcs(json_data).each do |npc, path|
    creds = npc['creds']
    next unless creds.is_a?(Hash)

    %w[recovery resetPassword].each do |field|
      err.call("#{path}: creds.#{line.call(field)}") if creds.key?(field)
    end
  end
  social = json_data['social']
  calls = social.is_a?(Hash) && social['pretextNpcs'].is_a?(Array) ? social['pretextNpcs'] : []
  calls.each_with_index do |call, i|
    next unless call.is_a?(Hash) && call['asks'].is_a?(Hash)

    call['asks'].each do |ask_id, ask|
      next unless ask.is_a?(Hash) && ask.key?('helpdesk')

      err.call("social.pretextNpcs[#{i}].asks.#{ask_id}: #{line.call('helpdesk')}")
    end
  end
end

def mfa_policy_values(json_data, err)
  policies = json_data['policies']
  return unless policies.is_a?(Hash)

  policies.each do |name, policy|
    next unless policy.is_a?(Hash) && policy.key?('mfa')
    next if BreakEscape::MfaModel::KINDS.include?(policy['mfa'])

    err.call("policy '#{name}' has mfa #{policy['mfa'].inspect}; allowed: #{BreakEscape::MfaModel::KINDS.join(', ')}.")
  end
end

def mfa_creds_values(json_data, err)
  mfa_room_npcs(json_data).each do |npc, path|
    creds = npc['creds']
    next unless creds.is_a?(Hash) && creds.key?('mfa') && creds['mfa'] != false

    err.call("#{path}: creds.mfa must be false (exempt this account) or absent; any other value is refused.")
  end
end

# Code devices: one owner, an account owner, at most one per owner.
def mfa_device_errors(json_data, err)
  mm = BreakEscape::MfaModel
  cm = BreakEscape::CredentialModel
  devices = mm.each_authored_item(json_data).map { |e| e[:item] }.select { |i| i['type'] == mm::CODE_DEVICE }
  devices.each do |item|
    name = item['id'] || mm::CODE_DEVICE
    owner = item['owner']
    if !cm.present_string?(owner)
      err.call("code_device '#{name}' has no owner: it belongs to one account's NPC.")
    elsif cm.account_npc(json_data, owner).nil?
      err.call("code_device '#{name}' owner '#{owner}' is not an account (a room NPC with creds).")
    end
  end
  devices.select { |i| cm.present_string?(i['owner']) }.group_by { |i| i['owner'] }.each do |owner, list|
    err.call("#{list.size} code_devices belong to '#{owner}': an account has one.") if list.size > 1
  end
end

# [{ pc:, policy_name:, kind:, accounts: [admitted enrolled account NPCs] }] for every PC whose
# policy asks a second step
def mfa_pcs(json_data)
  mm = BreakEscape::MfaModel
  cm = BreakEscape::CredentialModel
  accounts = mfa_room_npcs(json_data).map(&:first).select { |n| BreakEscape::AccessIdentities.account?(n) }
  cm.sign_in_pcs(json_data).filter_map do |pc|
    policy = cm.policy_for(json_data, pc)
    kind = mm.kind(policy)
    next if kind == 'none'

    name = cm.present_string?(pc['policy']) ? pc['policy'] : json_data['defaultPolicy']
    { pc: pc, policy_name: name, policy: policy, kind: kind,
      accounts: accounts.select { |n| cm.pc_admits_account?(pc, n) && mm.enrolled?(n) } }
  end
end

# The ways round or through the second step for one account at one PC, as words
def mfa_ways(json_data, entry, npc, mm, holdable_phones)
  cm = BreakEscape::CredentialModel
  pc = entry[:pc]
  ways = []
  registry = cm.registry(json_data)
  registry.each do |id, cred|
    next unless %w[token assist_invite].include?(cred['kind']) && cred['account'].to_s == npc['id'].to_s
    next unless cm.pcs_accepting(json_data, id).any? { |p| p['id'] == pc['id'] }

    ways << (cred['kind'] == 'token' ? 'a token' : 'a help invite')
  end
  BreakEscape::NetworkModel.weaknesses(json_data).each do |rec|
    next unless rec[:host_id].to_s == pc['id'].to_s

    session = rec[:entry].dig('grants', 'session')
    ways << 'a technique session on that host' if session.is_a?(Hash) && session['account'].to_s == npc['id'].to_s
  end
  owner = BreakEscape::AccessIdentities.owner_id(pc)
  if owner.to_s == npc['id'].to_s && !BreakEscape::AccessIdentities.screen_always_locks?(pc, npc)
    ways << "the owner's open screen, if claimed"
  end
  ways.uniq!
  device = entry[:kind] == 'code' ? mm.device_for(json_data, npc['id']) : nil
  ways.unshift('the account\'s code device') if device
  ways.unshift("the account's phone") if MFA_PUSH_KINDS.include?(entry[:kind]) && holdable_phones.include?(npc['id'])
  ways
end

# Phone items the player can come to hold, as a set of owner ids
def mfa_holdable_phone_owners(json_data, mm, story)
  held = mm.held_item_sources(json_data, [MFA_PHONE], &story).map { |h| h[:id] }
  mm.each_authored_item(json_data).filter_map do |e|
    i = e[:item]
    i['owner'] if i['type'] == MFA_PHONE && i['owner'].is_a?(String) && held.include?(i['id'])
  end.uniq
end

def mfa_pc_errors(json_data, err, warn, info, mm)
  story = ->(path) { ValidateAccessWork.story_file(path) }
  phones = nil
  pcs = mfa_pcs(json_data)
  pcs.each do |entry|
    pc = entry[:pc]
    who = "PC '#{pc['id']}' (policy '#{entry[:policy_name]}', #{entry[:kind]})"
    entry[:accounts].each do |npc|
      if entry[:kind] == 'code' && mm.device_for(json_data, npc['id']).nil?
        err.call("#{who}: account #{mfa_name(npc)} is admitted and enrolled but has no code_device.")
      end
      if MFA_PUSH_KINDS.include?(entry[:kind]) && npc['phone'] == false
        err.call("#{who}: account #{mfa_name(npc)} is admitted and enrolled but is \"phone\": false: a push has nowhere to go.")
      end
    end
    if entry[:kind] == 'code' && entry[:policy].is_a?(Hash) && !entry[:policy]['maxAttempts'].nil?
      warn.call("#{who}: the policy has maxAttempts #{entry[:policy]['maxAttempts'].inspect}, so wrong codes can lock the sign-in for good. " \
                'Remove maxAttempts, or give the player another way through.')
    end
    next if entry[:accounts].empty?

    phones ||= mfa_holdable_phone_owners(json_data, mm, story)
    all_ways = entry[:accounts].to_h { |npc| [npc, mfa_ways(json_data, entry, npc, mm, phones)] }
    info.call("#{who}: " + entry[:accounts].map do |npc|
      ways = all_ways[npc]
      "#{mfa_name(npc)} through #{ways.empty? ? 'no listed way' : ways.join(', ')}"
    end.join('; '))
    next unless MFA_PUSH_KINDS.include?(entry[:kind])

    stuck = entry[:accounts].all? do |npc|
      mm.prompt_habit(npc, json_data) == 'never' && all_ways[npc].reject { |w| w == "the account's phone" }.empty? &&
        !phones.include?(npc['id'])
    end
    warn.call("#{who}: nobody passes this push step (every admitted owner never approves, no phone can be held, no other way through).") if stuck
  end
  # the policy does nothing
  pcs.group_by { |e| e[:policy_name] }.each do |name, list|
    next unless list.all? { |e| e[:accounts].empty? }

    warn.call("policy '#{name}' asks #{list.first[:kind]} but every account its PCs admit is exempt (creds.mfa false) or none is admitted: it does nothing.")
  end
end

def mfa_device_warnings(json_data, warn, info, mm, story)
  items = mm.each_authored_item(json_data).select { |e| e[:item]['type'] == mm::CODE_DEVICE }
  return if items.empty?

  sources = mm.held_item_sources(json_data, [mm::CODE_DEVICE], &story)
  cm = BreakEscape::CredentialModel
  items.each do |e|
    item = e[:item]
    name = item['id'] || mm::CODE_DEVICE
    routes = sources.select { |s| s[:id] == item['id'] }.map { |s| s[:via] }.uniq
    if routes.empty?
      warn.call("code_device '#{name}' cannot be held: it is not placed, offered or held by an NPC who can be knocked out.")
    else
      info.call("code_device '#{name}': the player can get it by #{routes.map { |r| r.to_s.tr('_', ' ') }.join(', ')}.")
    end
    owner = cm.present_string?(item['owner']) ? mfa_room_npcs(json_data).map(&:first).find { |n| n['id'] == item['owner'] } : nil
    next unless owner

    unfiltered = BreakEscape::AccessWork.offer_texts(owner, &story).any? do |t|
      t.is_a?(String) && t.scan(BreakEscape::AccessWork::GIVE_INVENTORY_RE).any? do |(param)|
        param.to_s.split(',').map(&:strip).reject(&:empty?).empty?
      end
    end
    next unless unfiltered

    warn.call("code_device '#{name}' is not gated: #{owner['id']}'s story has give_npc_inventory_items with no type filter, which hands over everything they hold, the device included.")
  end
end

# A phone with an owner belongs in that NPC's itemsHeld; one lying in a room or a container is
# free to take
def mfa_loose_phones(json_data, warn, mm)
  mm.each_authored_item(json_data).each do |e|
    item = e[:item]
    next unless item['type'] == MFA_PHONE && item['owner'].is_a?(String) && e[:via] == :object

    warn.call("Friendface phone '#{item['id'] || MFA_PHONE}' (#{item['owner']}'s) lies loose in a room or container: anyone can take it, so a push to it is no check.")
  end
end

def mfa_patience_warnings(json_data, warn, mm)
  mfa_room_npcs(json_data).each do |npc, path|
    habits = npc['habits']
    next unless habits.is_a?(Hash) && habits.key?('promptPatience')
    next if mm.prompt_habit(npc, json_data) == 'pestered'

    warn.call("#{path}: habits.promptPatience has no effect: #{mfa_name(npc)} approves prompts '#{mm.prompt_habit(npc, json_data)}', and only 'pestered' reads it.")
  end
end

# A saved connection to an MFA PC still asks the enrolled account to pass the second step
def mfa_saved_connections(json_data, warn, mm)
  cm = BreakEscape::CredentialModel
  pcs = mfa_pcs(json_data).to_h { |e| [e[:pc]['id'].to_s, e] }
  cm.registry(json_data).each do |id, cred|
    next unless cred['kind'] == 'saved_connection'

    entry = pcs[cred['connectsTo'].to_s]
    next unless entry && entry[:accounts].any? { |n| n['id'].to_s == cred['account'].to_s }

    warn.call("credentials/#{id}: a saved connection to PC '#{entry[:pc]['id']}' still asks #{cred['account']} for the second step (#{entry[:kind]}); it must be typed.")
  end
end
