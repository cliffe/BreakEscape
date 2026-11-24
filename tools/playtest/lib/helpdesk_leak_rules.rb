# frozen_string_literal: true

require 'set'
require 'uri'
require_relative '../../../lib/break_escape/helpdesk_model' unless defined?(BreakEscape::HelpdeskModel)

# Ops S8b unit 17 (feature A23, helpdesk recovery): the leak scanner's helpdesk rules, kept in this file so the main scanner
# takes only a handful of one-line hooks (a require, an include, `helpdesk_begin_scan`, one `scan_helpdesk` call just before
# `scan_mfa`, one entry in the rule text table). Included into AccessLeakScanner; it reads the scanner's own state
# (`@data`, `@priv_npcs`, `@priv_pcs`, `@mfa_*`) and reuses the second-step rules' helpers (`mfa_route`, `mfa_query_value`,
# `mfa_required_answer_ok?`, `mfa_phone_entry_ok?`, `mfa_phone_taken?`, `mfa_walk`, `capture_time`, `contains_password?`).
#
# Every rule is structural and fails closed: a value is allowed only in the exact answer the server gives for a thing the run
# earned, and where the proof is missing, ambiguous or malformed the value is a finding. Nothing here is ever loosened to let
# a run pass, and no existing rule is touched. The rules are inert for a scenario with no `helpdesks`, no `resetPassword`
# and no `recovery`.
#
# helpdesk_secret
#   - the keys recovery, resetPassword, helpdesks, accountResets, helpdeskTries, minCorrect, maxTries anywhere; a hash that
#     carries a desk question id beside an account's authored recovery answer for it;
#   - `helpdeskForms`: only at the root of a 200 GET scenario answer, and each entry exactly npc, resets, questionLabels for a
#     desk of the scenario (every other key is its own finding);
#   - an answer on POST helpdesk/request that is not one of the SHAPES entries (status, exact keys, value types), or is on
#     another verb or a loose path;
#   - an account's `resetPassword` VALUE anywhere, except `password` of a credited 200 grant answer for the one account
#     whose value it is, and (after that grant) the `password` of the GET keyring entry `<npcId>.reset` of that account;
#   - the own-phone forms (a deviceId `own:<npc>`, an `enrolled: false` device answer, `ownPhone: true`, a GET mfa/phone with
#     an `own` query), unless the answer is exactly the SHAPES shape for an account some earned mfa grant covers.
# helpdesk_grant
#   - a `granted` answer that is not credited (see `hd_grant_credit`).
#
# A grant is credited only when: the route is the strict POST helpdesk/request, the status is 200, the body is exactly the
# SHAPES entry (`granted` the boolean true), the desk has not stopped (a `blocked` answer's retryIn, or the stop a refusal
# with triesLeft 0 starts, is still running at the row's time; a row with no readable time while any stop was seen counts as
# stopped), and some desk of the scenario covers the account: `what` is in its resets, the `questions` rule has an authored
# answer for each question, a `callback` desk only while the run holds the account's phone. A password grant names its
# account by the value it carries (a value two accounts share earns neither). A second-step grant names no account.
#
# THE LIMIT (the recorder keeps no request bodies): an answer cannot say which desk, which username or which `what` was asked.
# So (1) a second-step grant is tied to a SET of accounts it could be for, and an own-phone form for an account needs its own
# grant row (a matching of accounts to grant rows), no more; a repeat grant answer counts as another row. (2) A stop on any
# desk or username stops every grant until it runs out, so a grant for another account inside that time is not credited.
# (3) A desk NPC being met, a typed answer being right and the typed username cannot be checked; only that the scenario's
# desks could have granted it.
module HelpdeskLeakRules
  RULE_TEXT = {
    'helpdesk_secret' => 'a recovery answer or key, a helpdesk setting (helpdesks, accountResets, helpdeskTries, minCorrect, maxTries, a form key beyond ' \
                         'npc, resets and questionLabels), a helpdesk/request answer outside its shapes, a reset password outside the grant answer and ' \
                         'keyring entry that earned it, or an own-phone code, number choices or flag outside the answers of an account a desk re-enrolled',
    'helpdesk_grant' => 'a granted helpdesk answer with no desk that covers the account, after the desk stopped, on the wrong route or in a shape the ' \
                        'server never sends'
  }.freeze

  HD_NEVER_KEYS = %w[recovery resetPassword helpdesks accountResets helpdeskTries minCorrect maxTries].freeze
  HD_FORM_KEYS = %w[npc questionLabels resets].freeze
  HD_OWN_DEVICE_KEYS = %w[code deviceId displayName npcId secondsLeft used].freeze
  HD_UNENROLLED_KEYS = %w[deviceId displayName enrolled npcId].freeze
  HD_KEYRING_RESET_KEYS = %w[account how id kind label password source].freeze
  HD_ACCOUNT_KEYS = %w[displayName npcId username].freeze
  HD_OWN_NAME = 'My phone'
  HD_NO_PHONE = { 'success' => false, 'error' => 'no such phone' }.freeze
  HD_TRIES_MAX = 9
  HD_ID = /\A[A-Za-z0-9_.\-]{1,120}\z/.freeze

  # ---- the module functions the verify-run printing block calls (no scanner state) ----------------------------------

  # Whether the helpdesk rows print: the game holds one of its two state keys, or the saved scenario has a desk.
  def self.shown?(ps, game)
    return true if %w[accountResets helpdeskTries].any? { |k| ps[k].respond_to?(:empty?) && !ps[k].empty? }

    data = game.respond_to?(:scenario_data) ? game.scenario_data : nil
    data.is_a?(Hash) && data['helpdesks'].is_a?(Hash) && !data['helpdesks'].empty?
  rescue StandardError
    false
  end

  # The two printed rows: per account with an entry, `<id> reset password yes|no, reset second step yes|no, new password
  # typed yes|no`; per tries entry `<desk id> <account id or other> count <n>, stopped yes|no`. Words, counts and ids only: never a
  # password, an answer or a username (an entry for a name that is not an account prints as `other`).
  def self.verify_rows(ps, game)
    return [] unless shown?(ps, game)

    hash = ->(v) { v.is_a?(Hash) ? v : {} }
    yes = ->(v) { v == true ? 'yes' : 'no' }
    data = game.respond_to?(:scenario_data) && game.scenario_data.is_a?(Hash) ? game.scenario_data : {}
    now = game.respond_to?(:mfa_now) ? game.mfa_now : Time.now.to_i
    resets = hash.call(ps['accountResets']).select { |id, _| id.is_a?(String) && id.match?(HD_ID) }.sort.map do |id, rec|
      rec = hash.call(rec)
      "#{id} reset password #{yes.call(rec['password'])}, reset second step #{yes.call(rec['mfa'])}, new password typed #{yes.call(rec['typed'])}"
    end
    by_name = {}
    BreakEscape::Game.scenario_room_npcs(data).each do |npc|
      next unless npc['creds'].is_a?(Hash)

      name = BreakEscape::AccessIdentities.normalise_username(npc['creds']['username'])
      by_name[name] = npc['id'] if !name.empty? && npc['id'].is_a?(String) && npc['id'].match?(HD_ID)
    end
    tries = hash.call(ps['helpdeskTries']).filter_map do |key, rec|
      next unless key.is_a?(String)

      desk, _, name = key.partition('|')
      next unless desk.match?(HD_ID)

      rec = hash.call(rec)
      count = rec['n'].is_a?(Integer) && rec['n'].positive? ? rec['n'] : 0
      stopped = rec['stoppedAt'].is_a?(Integer) && now - rec['stoppedAt'] < BreakEscape::HelpdeskModel::DESK_STOP_SECONDS
      "#{desk} #{by_name[name] || 'other'} count #{count}, stopped #{stopped ? 'yes' : 'no'}"
    end.sort
    [['accountResets', resets], ['helpdeskTries', tries]]
  end

  private

  # ---- state -----------------------------------------------------------------------------------------------------

  def helpdesk_begin_scan
    @hd_desks = BreakEscape::HelpdeskModel.desks(@data)
    @hd_accounts = @priv_npcs.select { |_id, npc| npc['creds'].is_a?(Hash) && npc['creds']['username'].is_a?(String) && !npc['creds']['username'].empty? }
    @hd_reset_pw = {}  # reset password value => [npc ids whose resetPassword it is]
    @hd_recovery = {}  # question id => Set of normalised authored answers
    @hd_accounts.each do |id, npc|
      pw = npc['creds']['resetPassword']
      (@hd_reset_pw[pw] ||= []) << id if pw.is_a?(String) && !pw.empty?
      next unless npc['creds']['recovery'].is_a?(Hash)

      npc['creds']['recovery'].each do |qid, answer|
        norm = BreakEscape::HelpdeskModel.normalise_answer(answer)
        (@hd_recovery[qid.to_s] ||= Set.new) << norm unless norm.empty?
      end
    end
    @hd_active = !@hd_desks.empty? || !@hd_reset_pw.empty? || !@hd_recovery.empty?
    @hd_earned_pw = Set.new    # npc ids whose reset password a credited grant answer carried
    @hd_mfa_rows = []          # per credited second-step grant answer: the Set of accounts it could be for
    @hd_own_accounts = Set.new # accounts an own-phone form has been allowed for
    @hd_stop_until = nil       # the time (seconds) the latest stop seen runs to
    @hd_stop_unknown = false   # a stop was seen on a row with no readable time
    @hd_row_time = nil
  end

  # One response row. Judges it, then lets it earn what it proves (so a row never proves itself). Answers the body the
  # second-step rules are to see: the same body, or a copy without the own-phone code, number choices and flag this row was
  # allowed to carry (those rules know nothing of an own phone and would call them leaks).
  def scan_helpdesk(body, row, add)
    return body unless @hd_active

    @hd_row_time = capture_time(row)
    info = hd_route(row)
    minfo = mfa_route(row)
    earned = {}
    hd_judge_request(body, info, add, earned)
    allowed = hd_keyring_allowed(body, row, add)
    allowed[earned[:password_path]] = earned[:password] if earned[:password_path]
    hd_judge_passwords(body, allowed, add)
    flags = hd_own_flags(body, minfo, row)
    hd_judge_phone_route(body, minfo, row, flags, add)
    hd_walk_keys(body, minfo, flags, add)
    hd_note_request(body, info, earned)
    hd_strip_own(body, flags)
  end

  def hd_route(row)
    path = row['path'].to_s.split('?', 2).first.to_s
    { method: row['method'].to_s.upcase, status: row['status'].is_a?(Integer) ? row['status'] : nil,
      strict: path.match?(%r{/games/[^/]+/helpdesk/request\z}), desk_path: path.match?(%r{/games/[^/]+/helpdesk(?:[/.]|\z)}) }
  end

  # ---- keys everywhere, the form map, the recovery answers -------------------------------------------------------

  def hd_walk_keys(body, minfo, flags, add)
    root_forms = body.is_a?(Hash) && minfo[:method] == 'GET' && minfo[:route] == 'scenario' && minfo[:ok]
    mfa_walk(body) do |hash, path, _parent|
      hash.each do |key, value|
        at = safe_path("#{path}.#{key}")
        if HD_NEVER_KEYS.include?(key)
          add.call('helpdesk_secret', "helpdesk:key:#{key}", at)
        elsif key == 'helpdeskForms'
          if root_forms && hash.equal?(body)
            hd_judge_forms(value, at, add)
          else
            add.call('helpdesk_secret', 'helpdesk:key:helpdeskForms', at)
          end
        elsif key == 'ownPhone' && !(hash.equal?(body) && flags[:required])
          add.call('helpdesk_secret', 'helpdesk:own:ownPhone', at)
        elsif key == 'deviceId' && value.is_a?(String) && value.start_with?('own:') && !(hash.equal?(body) && flags[:device])
          add.call('helpdesk_secret', 'helpdesk:own:device', at)
        elsif key == 'enrolled' && hash.key?('deviceId') && !(hash.equal?(body) && flags[:unenrolled])
          add.call('helpdesk_secret', 'helpdesk:own:unenrolled', at)
        elsif value.is_a?(String) && @hd_recovery[key]&.include?(BreakEscape::HelpdeskModel.normalise_answer(value))
          add.call('helpdesk_secret', "helpdesk:recovery:#{key}", at)
        end
      end
    end
  end

  # helpdeskForms at the root of the bootstrap: a Hash of the scenario's desk ids, each exactly npc, resets, questionLabels
  # (each wrong key is a finding of its own).
  def hd_judge_forms(forms, at, add)
    unless forms.is_a?(Hash)
      add.call('helpdesk_secret', 'helpdesk:form:shape', at)
      return
    end
    forms.each do |desk_id, form|
      here = safe_path("#{at}.#{desk_id}")
      desk = @hd_desks[desk_id]
      unless desk && form.is_a?(Hash)
        add.call('helpdesk_secret', 'helpdesk:form:shape', here)
        next
      end
      (form.keys - HD_FORM_KEYS).each { |key| add.call('helpdesk_secret', "helpdesk:form:#{key}", safe_path("#{here}.#{key}")) }
      next if hd_form_ok?(desk, form)

      add.call('helpdesk_secret', 'helpdesk:form:shape', here)
    end
  end

  def hd_form_ok?(desk, form)
    labels = form['questionLabels']
    form.keys.sort == HD_FORM_KEYS && form['npc'] == desk['npc'] && form['resets'].is_a?(Array) &&
      form['resets'].all? { |r| desk['resets'].include?(r) } && labels.is_a?(Hash) &&
      labels.all? { |qid, label| desk['questions'].include?(qid) && label.is_a?(String) }
  end

  # ---- POST helpdesk/request -------------------------------------------------------------------------------------

  # The SHAPES entry the answer is, as a symbol (:granted_password, :granted_mfa, :refused, :refused_last, :blocked,
  # :unavailable, :not_found, :bad_request), else nil.
  def hd_request_shape(status, body)
    return nil unless body.is_a?(Hash)

    keys = body.keys.sort
    case status
    when 200
      return nil unless body['granted'] == true

      if body['what'] == 'password'
        pcs = body['lockoutPcIds']
        keys == %w[granted lockoutPcIds password what] && body['password'].is_a?(String) && !body['password'].empty? &&
          pcs.is_a?(Array) && pcs.all? { |pc| pc.is_a?(String) && @priv_pcs.key?(pc) } ? :granted_password : nil
      elsif body['what'] == 'mfa'
        keys == %w[granted what] ? :granted_mfa : nil
      end
    when 422
      case body['reason']
      when 'refused'
        left = body['triesLeft']
        return nil unless keys == %w[reason triesLeft] && left.is_a?(Integer) && left.between?(0, HD_TRIES_MAX - 1)

        left.zero? ? :refused_last : :refused
      when 'blocked'
        keys == %w[reason retryIn] && body['retryIn'].is_a?(Integer) && body['retryIn'].between?(0, BreakEscape::HelpdeskModel::DESK_STOP_SECONDS) ? :blocked : nil
      when 'unavailable' then keys == %w[reason] ? :unavailable : nil
      end
    when 404 then keys == %w[reason] && body['reason'] == 'not_found' ? :not_found : nil
    when 400 then keys == %w[reason] && body['reason'] == 'bad_request' ? :bad_request : nil
    end
  end

  # Judges the answer on the helpdesk route; fills `earned` (:kind, :accounts, :password, :password_path) for a credited grant.
  def hd_judge_request(body, info, add, earned)
    return unless info[:desk_path]

    shape = info[:method] == 'POST' && info[:strict] ? hd_request_shape(info[:status], body) : nil
    return add.call('helpdesk_secret', 'helpdesk:answer', '$') unless shape
    return unless %i[granted_password granted_mfa].include?(shape)

    credit = hd_grant_credit(shape, body, info)
    return add.call('helpdesk_grant', "helpdesk:grant:#{body['what']}", '$') unless credit

    earned[:kind] = shape
    earned[:accounts] = credit
    return unless shape == :granted_password

    earned[:password] = body['password']
    earned[:password_path] = '$.password'
  end

  # The accounts a grant answer is credited for, or nil.
  def hd_grant_credit(shape, body, info)
    return nil unless info[:status] == 200 && info[:method] == 'POST' && info[:strict]
    return nil if hd_stopped?(@hd_row_time)

    if shape == :granted_password
      owners = @hd_reset_pw[body['password']]
      return nil unless owners && owners.size == 1

      hd_desk_covers?(@hd_accounts[owners.first], 'password') ? [owners.first] : nil
    else
      ids = @hd_accounts.select { |_id, npc| BreakEscape::MfaModel.enrolled?(npc) && hd_desk_covers?(npc, 'mfa') }.keys
      ids.empty? ? nil : ids
    end
  end

  # Some desk could grant `what` for this account NPC, and a `callback` desk only while the run holds the account's phone.
  def hd_desk_covers?(npc, what)
    return false unless npc

    @hd_desks.values.any? do |desk|
      BreakEscape::HelpdeskModel.covers?(desk, npc, what) && (desk['verify'] != 'callback' || mfa_phone_taken?(npc['id']))
    end
  end

  def hd_stopped?(time)
    return true if @hd_stop_unknown
    return false if @hd_stop_until.nil?

    time.nil? || time < @hd_stop_until
  end

  # What an answer on the helpdesk route proves for the rows after it.
  def hd_note_request(body, info, earned)
    return unless info[:desk_path] && info[:strict] && info[:method] == 'POST'

    case hd_request_shape(info[:status], body)
    when :granted_password then @hd_earned_pw.merge(earned[:accounts]) if earned[:kind]
    when :granted_mfa then @hd_mfa_rows << Set.new(earned[:accounts]) if earned[:kind]
    when :blocked then hd_note_stop(body['retryIn'])
    when :refused_last then hd_note_stop(BreakEscape::HelpdeskModel::DESK_STOP_SECONDS)
    end
  end

  def hd_note_stop(seconds)
    if @hd_row_time.nil?
      @hd_stop_unknown = true
    else
      lifts = @hd_row_time + seconds
      @hd_stop_until = lifts if @hd_stop_until.nil? || lifts > @hd_stop_until
    end
  end

  # ---- reset passwords -------------------------------------------------------------------------------------------

  # { JSON path => password } of the keyring entries `<npcId>.reset` that may carry their password: a 200 GET keyring answer,
  # an account a credited grant earned, exactly the entry shape, the account block of that account. A helpdesk entry of
  # any other shape or account, or one before its grant, is a finding of its own.
  def hd_keyring_allowed(body, row, add)
    allowed = {}
    return allowed unless body.is_a?(Hash) && body['entries'].is_a?(Array)

    strict = row['method'].to_s.upcase == 'GET' && row['status'] == 200 && row['path'].to_s.split('?', 2).first.to_s.match?(%r{/games/[^/]+/keyring\z})
    body['entries'].each_with_index do |entry, i|
      next unless entry.is_a?(Hash) && (entry['source'] == 'helpdesk' || entry['id'].to_s.end_with?('.reset'))

      npc_id = entry['id'].to_s.delete_suffix('.reset')
      if strict && hd_reset_entry_ok?(entry, npc_id)
        allowed["$.entries[#{i}].password"] = entry['password']
      else
        add.call('helpdesk_secret', "helpdesk:keyring:#{npc_id}", safe_path("$.entries[#{i}]"))
      end
    end
    allowed
  end

  def hd_reset_entry_ok?(entry, npc_id)
    npc = @hd_accounts[npc_id]
    return false unless npc && entry['id'] == "#{npc_id}.reset" && @hd_earned_pw.include?(npc_id) && entry.keys.sort == HD_KEYRING_RESET_KEYS

    account = entry['account']
    owners = @hd_reset_pw[npc['creds']['resetPassword']]
    entry['source'] == 'helpdesk' && entry['kind'] == 'password' && entry['label'].is_a?(String) && entry['how'].is_a?(String) &&
      owners == [npc_id] && entry['password'] == npc['creds']['resetPassword'] &&
      account.is_a?(Hash) && account.keys.sort == HD_ACCOUNT_KEYS && account['npcId'] == npc_id && account['username'] == npc['creds']['username']
  end

  def hd_judge_passwords(body, allowed, add)
    return if @hd_reset_pw.empty?

    each_string(body) do |str, path, _owner|
      @hd_reset_pw.each do |pw, ids|
        next unless contains_password?(str, pw)
        next if allowed[path] == pw && str == pw && ids.size == 1

        add.call('helpdesk_secret', "helpdesk:reset:#{ids.sort.join(',')}", safe_path(path))
      end
    end
  end

  # ---- the own-phone forms ---------------------------------------------------------------------------------------

  # Which own-phone forms this answer is allowed to be: { device:, unenrolled:, required:, phone: [entries] }. An account is
  # allowed one only when a credited second-step grant row can be matched to it (`hd_account_earned?`).
  def hd_own_flags(body, minfo, row)
    flags = {}
    return flags unless body.is_a?(Hash)

    flags[:device] = true if hd_own_device_ok?(body, minfo)
    flags[:unenrolled] = true if hd_unenrolled_ok?(body, minfo)
    flags[:required] = true if hd_own_required_ok?(body, minfo, row)
    entries = hd_own_phone_entries(body, minfo)
    flags[:phone] = entries if entries
    flags
  end

  def hd_own_device_ok?(body, minfo)
    return false unless minfo[:method] == 'GET' && minfo[:route] == 'mfa/device' && minfo[:ok]

    id = mfa_query_value(minfo, 'npc_id')
    return false unless id && body.keys.sort == HD_OWN_DEVICE_KEYS

    ok = body['deviceId'] == "own:#{id}" && body['npcId'] == id && body['displayName'] == HD_OWN_NAME &&
         body['code'].is_a?(String) && body['code'].match?(/\A\d{6}\z/) &&
         body['secondsLeft'].is_a?(Integer) && (1..BreakEscape::MfaModel::STEP_SECONDS).cover?(body['secondsLeft']) &&
         [true, false].include?(body['used']) && hd_account_earned?(id)
    @hd_own_accounts << id if ok
    ok
  end

  # The answer for a held device whose owner a desk re-enrolled: no code, `enrolled: false`.
  def hd_unenrolled_ok?(body, minfo)
    return false unless minfo[:method] == 'GET' && minfo[:route] == 'mfa/device' && minfo[:ok]
    return false unless body.keys.sort == HD_UNENROLLED_KEYS && body['enrolled'] == false

    id = mfa_query_value(minfo, 'item_id')
    device = id && @mfa_devices[id]
    owner = device && device['owner']
    return false unless owner.is_a?(String) && @mfa_taken.include?(id)

    npc = mfa_npc(owner)
    shown = npc ? (npc['displayName'] || npc['id']) : owner
    ok = body['deviceId'] == id && body['npcId'] == owner && body['displayName'] == shown && hd_account_earned?(owner)
    @hd_own_accounts << owner if ok
    ok
  end

  # The 200 POST login answer of a re-enrolled account's second step: the usual mfaRequired shape plus `ownPhone: true`.
  def hd_own_required_ok?(body, minfo, row)
    return false unless body['ownPhone'] == true

    plain = body.reject { |k, _| k == 'ownPhone' }
    ok = mfa_required_answer_ok?(plain, minfo, row) && hd_account_earned?(body['npcId'])
    @hd_own_accounts << body['npcId'] if ok
    ok
  end

  # The entries of a 200 GET mfa/phone?own=1 answer (nil unless the whole answer is in shape for earned accounts).
  def hd_own_phone_entries(body, minfo)
    return nil unless minfo[:method] == 'GET' && minfo[:route] == 'mfa/phone' && minfo[:ok]
    return nil unless mfa_query_value(minfo, 'own') == '1' && body.keys == ['requests'] && body['requests'].is_a?(Array)
    return nil if @hd_mfa_rows.empty?

    owners = body['requests'].map do |entry|
      name = entry.is_a?(Hash) ? entry['username'] : nil
      found = @hd_accounts.select { |_id, npc| npc['creds']['username'] == name }.keys
      found.size == 1 ? found.first : nil
    end
    return nil unless owners.all?
    return nil unless body['requests'].each_with_index.all? { |entry, i| mfa_phone_entry_ok?(entry, owners[i], @hd_accounts[owners[i]]) }
    return nil unless owners.all? { |owner| hd_account_earned?(owner) }

    @hd_own_accounts.merge(owners)
    body['requests']
  end

  # A GET mfa/phone with an `own` query: judged here whatever the status; only the canonical 403 and an earned list pass.
  def hd_judge_phone_route(body, minfo, row, flags, add)
    return unless mfa_route_name(minfo) == 'mfa/phone' && hd_query_names?(minfo, 'own')
    return if flags[:phone]
    return if minfo[:method] == 'GET' && row['status'] == 403 && body == HD_NO_PHONE

    add.call('helpdesk_secret', 'helpdesk:own:phone', '$')
  end

  def hd_query_names?(minfo, name)
    URI.decode_www_form(minfo[:query].to_s).any? { |key, _| key == name }
  rescue ArgumentError
    true
  end

  # An account an own-phone form may be for: it asks a second step, a desk covers its second-step reset, and the credited
  # grant rows can be matched one to each account allowed so far (and this one).
  def hd_account_earned?(npc_id)
    npc = npc_id.is_a?(String) ? @hd_accounts[npc_id] : nil
    return false unless npc && BreakEscape::MfaModel.enrolled?(npc) && hd_desk_covers?(npc, 'mfa')

    hd_rows_match?(@hd_own_accounts | [npc_id])
  end

  # Each account in the set gets its own credited grant row it could be for (augmenting paths).
  def hd_rows_match?(accounts)
    owner = {}
    try = lambda do |account, seen|
      @hd_mfa_rows.each_index do |i|
        next if seen.include?(i) || !@hd_mfa_rows[i].include?(account)

        seen << i
        next unless owner[i].nil? || try.call(owner[i], seen)

        owner[i] = account
        return true
      end
      false
    end
    accounts.all? { |account| try.call(account, Set.new) }
  end

  # The body the second-step rules are shown: the allowed own-phone secrets taken out of a copy.
  def hd_strip_own(body, flags)
    return body unless body.is_a?(Hash) && (flags[:device] || flags[:required] || flags[:phone])

    copy = body.dup
    copy.delete('code') if flags[:device]
    copy.delete('ownPhone') if flags[:required]
    copy['requests'] = flags[:phone].map { |entry| entry.reject { |k, _| k == 'numbers' } } if flags[:phone]
    copy
  end
end
