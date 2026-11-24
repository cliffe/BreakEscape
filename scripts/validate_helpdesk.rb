# frozen_string_literal: true

# Helpdesk recovery lints (MFA plan, stage S8b, feature A23). One entry point, check_helpdesk, called by
# scripts/validate_scenario.rb beside check_mfa. Every question about what a desk covers is answered
# through BreakEscape::HelpdeskModel, so the validator, the dungeon graph and the server agree. No line
# ever quotes a recovery answer, a reset password or a code: lines name an account, a desk or a
# question id only.
#
# A scenario with no `helpdesks` key, no `creds.recovery`, no `creds.resetPassword`, no `helpdesk` on a
# pretext ask, no `helpdesk_form` item and no `#helpdesk_request:` ink tag gets no line from this file.
require 'json'
require 'set'
require_relative '../lib/break_escape/access_identities'
require_relative '../lib/break_escape/credential_model'
require_relative '../lib/break_escape/mfa_model'
require_relative '../lib/break_escape/helpdesk_model'
require_relative '../lib/break_escape/npc_habits/clues'
require_relative 'validate_mfa'
require_relative 'validate_access_work'

HELPDESK_FORM_TYPE = 'helpdesk_form'
HELPDESK_TAG = /helpdesk_request:([A-Za-z0-9_\-]*)/.freeze
HELPDESK_MFA_WAY = 'a helpdesk that resets mfa'

def check_helpdesk(json_data, repo_root = nil, scenario_dir = nil)
  issues = []
  return issues unless json_data.is_a?(Hash)

  err = ->(msg) { issues << "❌ ERROR: helpdesk: #{msg}" }
  warn = ->(msg) { issues << "⚠️ WARNING: helpdesk: #{msg}" }
  info = ->(msg) { issues << "ℹ️ INFO: helpdesk: #{msg}" }
  hm = BreakEscape::HelpdeskModel
  accounts = mfa_room_npcs(json_data).map(&:first).select { |n| BreakEscape::AccessIdentities.account?(n) }
  desks = json_data['helpdesks']
  desks = {} unless desks.is_a?(Hash)

  helpdesk_desk_errors(json_data, desks, accounts, err)
  helpdesk_recovery_errors(json_data, desks, accounts, err)
  helpdesk_password_errors(json_data, desks, accounts, repo_root, scenario_dir, err)
  helpdesk_reference_errors(json_data, desks, repo_root, scenario_dir, err)
  helpdesk_lock_for_good(json_data, desks, accounts, err, warn) unless desks.empty?
  helpdesk_desk_warnings(json_data, desks, accounts, scenario_dir, warn)
  helpdesk_info(json_data, desks, accounts, hm, info)
  issues
end

def helpdesk_desk_errors(json_data, desks, accounts, err)
  hm = BreakEscape::HelpdeskModel
  room_ids = mfa_room_npcs(json_data).map { |npc, _| npc['id'] }.compact
  served = Hash.new { |h, k| h[k] = [] }
  desks.each do |id, desk|
    at = "helpdesks.#{id}"
    unless desk.is_a?(Hash)
      err.call("#{at} must be an object.")
      next
    end
    npc = desk['npc']
    if !npc.is_a?(String) || !room_ids.include?(npc)
      err.call("#{at}: npc #{npc.inspect} is not a room NPC (an NPC under rooms.<id>.npcs).")
    else
      served[npc] << id
    end
    verify = desk['verify']
    unless hm::VERIFY.include?(verify)
      err.call("#{at}: verify #{verify.inspect} is not one of #{hm::VERIFY.join(', ')}.")
    end
    resets = desk['resets']
    if !resets.is_a?(Array) || resets.empty?
      err.call("#{at}: resets must list at least one of #{hm::RESETS.join(', ')}.")
    else
      resets.reject { |r| hm::RESETS.include?(r) }.each do |bad|
        err.call("#{at}: resets has #{bad.inspect}; allowed: #{hm::RESETS.join(', ')}.")
      end
    end
    if desk.key?('maxTries') && !(desk['maxTries'].is_a?(Integer) && desk['maxTries'].between?(1, 9))
      err.call("#{at}: maxTries must be a whole number from 1 to 9.")
    end
    helpdesk_question_errors(at, desk, err)
    if resets.is_a?(Array) && resets.include?('password') && accounts.none? { |n| helpdesk_reset_password(n) }
      err.call("#{at}: resets names password, but no account has a creds.resetPassword.")
    end
  end
  served.each do |npc, ids|
    err.call("NPC '#{npc}' serves #{ids.size} desks (#{ids.join(', ')}): one NPC serves at most one desk.") if ids.size > 1
  end
end

def helpdesk_question_errors(at, desk, err)
  hm = BreakEscape::HelpdeskModel
  questions = desk['questions']
  list = questions.is_a?(Array) ? questions.select { |q| q.is_a?(String) && !q.empty? }.uniq : []
  if desk['verify'] == 'questions' && list.empty?
    err.call("#{at}: verify is questions but the desk asks no question.")
  end
  if desk.key?('minCorrect')
    min = desk['minCorrect']
    if !min.is_a?(Integer) || min < 1
      err.call("#{at}: minCorrect must be a whole number of at least 1.")
    elsif min > list.size
      err.call("#{at}: minCorrect is #{min} but the desk asks #{list.size} question#{list.size == 1 ? '' : 's'}.")
    end
  end
  labels = desk['questionLabels'].is_a?(Hash) ? desk['questionLabels'] : {}
  list.each do |qid|
    label = labels[qid]
    if !label.is_a?(String) || label.empty?
      err.call("#{at}: question '#{qid}' has no questionLabels entry, so the form could not ask it.")
    elsif label.length > hm::LABEL_MAX
      err.call("#{at}: the label for question '#{qid}' is #{label.length} characters; at most #{hm::LABEL_MAX}.")
    end
  end
end

def helpdesk_reset_password(npc)
  creds = npc['creds']
  creds.is_a?(Hash) && creds['resetPassword'].is_a?(String) && !creds['resetPassword'].empty? ? creds['resetPassword'] : nil
end

# The right answers: 64 code points each, and present for every question a desk asks of an account
# that a reset could matter to
def helpdesk_recovery_errors(json_data, desks, accounts, err)
  hm = BreakEscape::HelpdeskModel
  mfa_accounts = mfa_pcs(json_data).flat_map { |e| e[:accounts] }.map { |n| n['id'] }.uniq
  mfa_room_npcs(json_data).each do |npc, path|
    recovery = npc.dig('creds', 'recovery') if npc['creds'].is_a?(Hash)
    next unless recovery.is_a?(Hash)

    recovery.each do |qid, value|
      if !value.is_a?(String) || value.empty?
        err.call("#{path}: creds.recovery.#{qid} must be a non-empty string.")
      elsif value.length > hm::ANSWER_MAX
        err.call("#{path}: creds.recovery.#{qid} is #{value.length} characters; at most #{hm::ANSWER_MAX}.")
      end
    end
  end
  desks.each do |id, desk|
    next unless desk.is_a?(Hash) && desk['verify'] == 'questions' && desk['questions'].is_a?(Array)

    questions = desk['questions'].select { |q| q.is_a?(String) && !q.empty? }.uniq
    accounts.each do |npc|
      next unless helpdesk_reset_password(npc) || mfa_accounts.include?(npc['id'])

      recovery = npc.dig('creds', 'recovery')
      recovery = {} unless recovery.is_a?(Hash)
      questions.reject { |q| recovery[q].is_a?(String) && !recovery[q].strip.empty? }.each do |qid|
        err.call("helpdesks.#{id}: question '#{qid}' is not in creds.recovery of #{mfa_name(npc)}, so the desk could never pass that account.")
      end
    end
  end
end

# resetPassword differs from password and never sits in ink (the rule creds.password has)
def helpdesk_password_errors(json_data, desks, accounts, repo_root, scenario_dir, err)
  resets = accounts.filter_map { |n| [n, helpdesk_reset_password(n)] if helpdesk_reset_password(n) }
  resets.each do |npc, pw|
    err.call("#{mfa_name(npc)}: creds.resetPassword is the same as creds.password.") if npc.dig('creds', 'password') == pw
  end
  return if resets.empty?

  helpdesk_ink_files(json_data, repo_root, scenario_dir).each do |file|
    resets.each do |npc, pw|
      next unless file[:text].include?(pw)

      err.call("#{mfa_name(npc)} creds.resetPassword appears in ink file '#{file[:label]}'. Ink is served verbatim; the desk gives " \
               'the password away in its answer instead.')
    end
  end
end

# Every ink file the scenario names or keeps: [{ label:, users: [npc ids], text:, tags: [desk ids] }].
# Compiled strings and the source, both read, since a tag shows in either.
def helpdesk_ink_files(json_data, repo_root, scenario_dir)
  users = Hash.new { |h, k| h[k] = Set.new }
  if repo_root
    find = lambda do |node|
      case node
      when Array then node.each { |n| find.call(n) }
      when Hash
        sp = node['storyPath']
        if sp.is_a?(String) && sp.start_with?('scenarios/')
          compiled = File.expand_path(File.join(repo_root, sp.sub(/\.ink\z/, '.json')))
          users[compiled]
          users[compiled] << node['id'].to_s if node['id']
        end
        node.each_value { |v| find.call(v) }
      end
    end
    find.call(json_data)
  end
  Dir.glob(File.join(scenario_dir, 'ink', '*.json')).each { |f| users[File.expand_path(f)] } if scenario_dir
  prefix = repo_root ? "#{File.expand_path(repo_root)}/" : ''
  users.filter_map do |compiled, who|
    source = compiled.sub(/\.json\z/, '.ink')
    texts = []
    if File.exist?(compiled)
      texts << begin
        strings = []
        collect = lambda do |node|
          case node
          when String then strings << node
          when Array then node.each { |n| collect.call(n) }
          when Hash then node.each { |k, v| strings << k.to_s; collect.call(v) }
          end
        end
        collect.call(JSON.parse(File.read(compiled)))
        strings.join("\n")
      rescue JSON::ParserError
        File.read(compiled)
      end
    end
    texts << File.read(source) if File.exist?(source)
    next if texts.empty?

    text = texts.join("\n")
    { label: compiled.delete_prefix(prefix), users: who.to_a, text: text, tags: text.scan(HELPDESK_TAG).flatten.uniq }
  end
end

# A pretext ask, an ink tag or a helpdesk_form item must name a desk that exists; the item lives in a
# sign-in PC's contents; the tag is in the desk NPC's own story
def helpdesk_reference_errors(json_data, desks, repo_root, scenario_dir, err)
  social = json_data['social']
  calls = social.is_a?(Hash) && social['pretextNpcs'].is_a?(Array) ? social['pretextNpcs'] : []
  calls.each_with_index do |call, i|
    next unless call.is_a?(Hash) && call['asks'].is_a?(Hash)

    call['asks'].each do |ask_id, ask|
      next unless ask.is_a?(Hash) && ask.key?('helpdesk')

      name = ask['helpdesk']
      next if name.is_a?(String) && desks.key?(name)

      err.call("social.pretextNpcs[#{i}].asks.#{ask_id}: helpdesk #{name.inspect} is not a desk in helpdesks.")
    end
  end
  helpdesk_form_items(json_data).each do |entry|
    item = entry[:item]
    where = item['id'] || entry[:path]
    name = item['desk']
    if !name.is_a?(String) || !desks.key?(name)
      err.call("helpdesk_form '#{where}': desk #{name.inspect} is not a desk in helpdesks.")
    end
    err.call("helpdesk_form '#{where}' is not in a sign-in PC's contents: the form is a request over that PC.") unless entry[:in_pc]
  end
  helpdesk_ink_files(json_data, repo_root, scenario_dir).each do |file|
    file[:tags].each do |name|
      desk = desks[name]
      if !desk.is_a?(Hash)
        err.call("ink file '#{file[:label]}' has #helpdesk_request:#{name}, which is not a desk in helpdesks.")
      elsif !file[:users].include?(desk['npc'].to_s)
        err.call("ink file '#{file[:label]}' has #helpdesk_request:#{name}, but it is not NPC '#{desk['npc']}''s story: the tag opens the form from the desk NPC's own conversation.")
      end
    end
  end
end

# [{ item:, path:, in_pc: }] for every helpdesk_form item anywhere in the rooms
def helpdesk_form_items(json_data)
  out = []
  walk = lambda do |list, path, in_pc|
    Array(list).each_with_index do |o, i|
      next unless o.is_a?(Hash)

      here = "#{path}[#{i}]"
      out << { item: o, path: here, in_pc: in_pc } if o['type'] == HELPDESK_FORM_TYPE
      inner = in_pc || BreakEscape::AccessIdentities.login_pc?(o)
      walk.call(o['contents'], "#{here}/contents", inner)
      walk.call(o['itemsHeld'], "#{here}/itemsHeld", false)
    end
  end
  rooms = json_data['rooms'].is_a?(Hash) ? json_data['rooms'] : {}
  rooms.each do |room_id, room|
    next unless room.is_a?(Hash)

    walk.call(room['objects'], "rooms/#{room_id}/objects", false)
    Array(room['npcs']).each_with_index do |npc, i|
      walk.call(npc['itemsHeld'], "rooms/#{room_id}/npcs[#{i}]/itemsHeld", false) if npc.is_a?(Hash)
    end
  end
  walk.call(json_data['startItemsInInventory'], 'startItemsInInventory', false)
  out
end

# A code step that can lock for good: wrong codes count towards the PC's lockout, and nothing in the
# scenario lifts it. A warning per account no desk covers for password; an error when that account is
# the PC's only admitted enrolled account and nothing goes round the step.
def helpdesk_lock_for_good(json_data, desks, accounts, err, warn)
  hm = BreakEscape::HelpdeskModel
  mm = BreakEscape::MfaModel
  built = hm.desks(json_data)
  mfa_pcs(json_data).each do |entry|
    policy = entry[:policy]
    next unless entry[:kind] == 'code' && policy.is_a?(Hash) && !policy['maxAttempts'].nil?

    who = "PC '#{entry[:pc]['id']}' (policy '#{entry[:policy_name]}', code)"
    entry[:accounts].each do |npc|
      next if built.values.any? { |desk| hm.covers?(desk, npc, 'password') }

      ways = mfa_ways(json_data, entry, npc, mm, [], []).reject { |w| w == HELPDESK_MFA_WAY }
      ways += helpdesk_exempt_saved_connections(json_data, entry)
      if entry[:accounts].size == 1 && ways.empty?
        err.call("#{who}: policy has maxAttempts and #{mfa_name(npc)} is the only account that can pass it; no desk resets that account's password and nothing goes round the step, so wrong codes can lock the sign-in for good.")
      else
        warn.call("#{who}: policy has maxAttempts and no desk resets the password of #{mfa_name(npc)}, so wrong codes can lock that sign-in for good.")
      end
    end
  end
end

# Saved connections of an exempt account that the PC admits: a way round the second step
def helpdesk_exempt_saved_connections(json_data, entry)
  cm = BreakEscape::CredentialModel
  pc = entry[:pc]
  cm.registry(json_data).filter_map do |id, cred|
    next unless cred['kind'] == 'saved_connection' && cred['connectsTo'].to_s == pc['id'].to_s

    npc = cm.account_npc(json_data, cred['account'])
    next unless npc && npc.dig('creds', 'mfa') == false && cm.pc_admits_account?(pc, npc)

    "a saved connection (#{id}) of an exempt account"
  end
end

def helpdesk_desk_warnings(json_data, desks, accounts, scenario_dir, warn)
  hm = BreakEscape::HelpdeskModel
  mm = BreakEscape::MfaModel
  built = hm.desks(json_data)
  return if built.empty?

  story = ->(path) { ValidateAccessWork.story_file(path) }
  pcs = mfa_pcs(json_data)
  mfa_accounts = pcs.flat_map { |e| e[:accounts] }
  phones = nil
  texts = nil
  built.each do |id, desk|
    covered = accounts.select { |n| desk['resets'].any? { |what| hm.covers?(desk, n, what) } }
    warn.call("helpdesk '#{id}' grants to anyone who asks (verify none): every account it covers can be reset by any caller.") if desk['verify'] == 'none'
    if desk['resets'].include?('mfa') && mfa_accounts.empty?
      warn.call("helpdesk '#{id}' resets mfa, but no account is under an MFA policy: that reset does nothing.")
    end
    if desk['verify'] == 'callback'
      phones ||= mfa_holdable_phone_owners(json_data, mm, story)
      covered.reject { |n| phones.include?(n['id']) }.each do |npc|
        warn.call("helpdesk '#{id}' uses a callback, but the player can never hold #{mfa_name(npc)}'s phone (no phone item of theirs they can come to hold): nobody can take that callback.")
      end
    end
    next unless desk['verify'] == 'questions'

    texts ||= helpdesk_readable_text(json_data, scenario_dir)
    covered.each do |npc|
      recovery = npc.dig('creds', 'recovery')
      next unless recovery.is_a?(Hash)

      desk['questions'].each do |qid|
        right = hm.normalise_answer(recovery[qid])
        next if right.empty? || texts.any? { |t| t.include?(right) }

        warn.call("helpdesk '#{id}': the player cannot find the answer to question '#{qid}' for #{mfa_name(npc)} in any readable text, feed post, document or ink line.")
      end
    end
  end
end

# Everything a player can read, lower-cased with inner spaces collapsed to match normalise_answer
def helpdesk_readable_text(json_data, scenario_dir)
  clues = BreakEscape::NpcHabits::Clues
  all = clues.readable_texts(json_data, scenario_dir) + clues.set_member_texts(json_data)
  all.map { |e| e[:text].to_s.scrub('').gsub(/\s+/, ' ').downcase }
end

def helpdesk_info(json_data, desks, accounts, hm, info)
  hm.desks(json_data).each do |id, desk|
    covered = accounts.filter_map do |npc|
      what = desk['resets'].select { |w| hm.covers?(desk, npc, w) }
      "#{npc['id']} (#{what.join(' and ')})" unless what.empty?
    end
    rule = desk['verify']
    rule += " (#{desk['minCorrect']} of #{desk['questions'].size})" if rule == 'questions'
    info.call("helpdesk '#{id}' (NPC '#{desk['npc']}'): rule #{rule}, resets #{desk['resets'].empty? ? 'nothing' : desk['resets'].join(' and ')}; " \
              "covers #{covered.empty? ? 'no account' : covered.join(', ')}.")
  end
end
