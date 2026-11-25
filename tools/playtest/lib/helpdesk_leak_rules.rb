# frozen_string_literal: true

require 'set'
require 'uri'
require_relative '../../../lib/break_escape/helpdesk_model' unless defined?(BreakEscape::HelpdeskModel)

# Ops S8b unit 17 (feature A23, helpdesk recovery): the leak scanner's helpdesk rules, kept in this file so the main scanner
# takes only seven changed lines (a require, an include, the `helpdesk_begin_scan` call, the `scan_helpdesk` call just before
# `scan_mfa`, the rule text table entry, the `mfa_kind_at` clause and the approve clause of `mfa_pass_pc`: see the end of this
# header). This file also writes three pieces of the second-step rules' state, each only in the stricter direction (it never
# clears a count or a mark that excuses an answer): it turns `@mfa_active` ON (a scenario whose only second step is one a
# re-enrolment creates); it takes steps out of `@mfa_pending` (a credited FIRST password grant drops that account's pending
# steps, as the server does; a repeat grant drops nothing); and it adds to `@mfa_wrong_unknown` each pair of that account that
# has a wrong-code count (the server clears the count at that grant, the scanner cannot without excusing a lock answer, so it
# stops crediting a lock for that pair). Included into AccessLeakScanner; it reads the scanner's own state (`@data`,
# `@priv_npcs`, `@priv_pcs`, `@mfa_*`, including `@mfa_devices`, `@mfa_taken`, `@mfa_code_possible`) and reuses the second-step
# rules' helpers (`mfa_route`, `mfa_route_name`, `mfa_npc`, `mfa_query_value`, `mfa_row_pc_tag`, `mfa_pass_pc`,
# `mfa_required_answer_ok?`, `mfa_phone_entry_ok?`, `mfa_phone_taken?`, `mfa_walk`, `capture_time`, `contains_password?`).
#
# Every rule is structural and fails closed: a value is allowed only in the exact answer the server gives for a thing the run
# earned, and where the proof is missing, ambiguous or malformed the value is a finding. Nothing here is ever loosened to let
# a run pass. Two existing rules were given a clause (`mfa_kind_at`, `mfa_pass_pc`: see the end of this header) and the state
# writes above are the only other change to them. The rules are inert for a scenario with no `helpdesks`, no `resetPassword`
# and no `recovery`.
#
# helpdesk_secret
#   - the keys recovery, resetPassword, helpdesks, accountResets, helpdeskTries, minCorrect, maxTries anywhere; a hash that
#     carries a desk question id beside an account's authored recovery answer for it (as a key, or as a value);
#   - `helpdeskForms`: only at the root of a 200 GET scenario answer, each entry exactly what HelpdeskModel.forms builds;
#   - an answer on POST helpdesk/request that is not one of the SHAPES entries (status, exact keys, value types, retryIn 1 to
#     300, triesLeft below the largest maxTries), or is on another verb or a loose path;
#   - an account's `resetPassword` VALUE anywhere, except `password` of a credited 200 grant answer for the one account
#     whose value it is, and (after that grant) the `password` of the GET keyring entry `<npcId>.reset` of that account (label
#     `Reset`, how `issued`, the account's display name): exactly the plain key set or, only when the query names one sign-in
#     PC (`pc_id`), exactly that set plus `forThisPc` true and `accepted` the policy's answer for a password (the server adds
#     both when that PC's screen is openable from the request and neither when it is not; the capture cannot show which);
#   - the own-phone forms (a deviceId `own:<npc>`, an `enrolled: false` device answer, `ownPhone: true`, a GET mfa/phone with
#     an `own` query), unless the answer is exactly the SHAPES shape for an account a credited second-step grant NAMED;
#   - a plain `mfaRequired` for such an account, a pass for it on a push route other than `approvedBy: own_phone` (always a
#     finding, whether or not an own-phone step is open; the hook in `mfa_pass_pc` credits that one with proof), the old held device's code or old phone's list for
#     it, and, where no code device is authored, any six-digit code that is not an earned own-device answer.
# helpdesk_grant
#   - a `granted` answer that is not credited (see `hd_grant_credit`).
#
# A grant is credited only when: the route is the strict POST helpdesk/request, the status is 200, the body is exactly the
# SHAPES entry (`granted` the boolean true, plus `npcId` and `deskId`), the desk has not stopped (a `blocked` answer's retryIn, or
# the stop a refusal with triesLeft 0 starts, is still running at the row's time; a row with no readable time while any stop was
# seen counts as stopped), `npcId` is an account and `deskId` a desk of the scenario, that desk covers the account for `what`
# (a `callback` desk only while the run holds the account's phone at that row), and for a password the value is the one the
# account alone owns. A repeat grant names the same account again and adds nothing. A grant that is NOT credited (an honest one inside a stop,
# limit 1) drops no step and marks no pair; the row is already a `helpdesk_grant` finding.
#
# LIMITS (the recorder keeps no request bodies): (1) a stop on any desk or username stops every grant until it runs out, because
# a refusal names no username, so a grant for another account inside that time is not credited: the scripted playtest plays its
# refusals last. The stop rule therefore depends on playtest ORDER (a refusal row is `{reason, triesLeft}` or `{reason, retryIn}`
# on a path with no query and nothing in it names the desk or the username). Two ways to close it, both leaving every answer for
# an unknown username identical to one for a real account: (a) the client sends `desk_id` and `username` in the URL query of
# `POST helpdesk/request` (as it sends `own=1`), so the scanner holds a stop against `desk|normalised username` (cost: a typed
# username in URLs and server logs); or (b) one opaque key on `refused` with `triesLeft: 0`, on `blocked` and on `granted`, such
# as a short keyed hash of `HelpdeskModel.tries_key` (cost: a refusal then carries more than the reason and the count). The
# recorder change is a later stage.
# (2) A desk NPC being met, a typed answer being right and the typed username cannot be checked; only that the named desk could
# have granted the named account. (3) A code's value is never checked. (4) An earlier stop, grant or phone before the first
# captured row is unknown. (5) A recovery answer is caught as `{<question id>: <answer>}`, as a hash holding the id as a value
# beside the answer, as `{<question id>: [<answer>, ...]}`, as an array (nested ones flattened) holding the id beside the answer,
# and one level or more below its question id (`{staff_no: {value: ...}}`); one split across two keys or two places is not, and
# an answer served as a JSON number is not (`{"staff_no": {"value": 40612}}` is clean). (6) A reset password is caught as a
# value and as a hash key. (7) The scanner cannot tell whether a `pc_id` keyring screen was openable, so both honest forms of
# the reset entry (plain, scoped) are accepted; nothing else is. (8) After a credited first password grant the server clears the
# account's wrong-code count; the scanner cannot clear its own, so a lock answer for an account that had wrong codes before its
# grant is reported even when honest, until a pass answer for that pair removes the mark (the stricter side: a lock the server could not give is reported too).
#
# The main scanner is touched in seven places (S8c merges keep all of them): the require, the include, the `helpdesk_begin_scan`
# call, the `scan_helpdesk` call just before `scan_mfa`, the rule text table, `mfa_kind_at` (`hd_reenrolled?`) and the approve
# clause of `mfa_pass_pc` (`hd_own_approval?`).
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
  HD_KEYRING_SCOPE_KEYS = %w[accepted forThisPc].freeze
  HD_ACCOUNT_KEYS = %w[displayName npcId username].freeze
  HD_OWN_NAME = 'My phone'
  HD_NO_PHONE = { 'success' => false, 'error' => 'no such phone' }.freeze
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
    @hd_mfa_earned = Set.new   # npc ids a credited second-step grant answer named (by its npcId, with its deskId judged at the grant)
    @hd_own_steps = {}         # pc id => npc id of an own-phone step an allowed `ownPhone` answer opened and nothing has closed
    @hd_own_listed = Set.new   # [pc id, npc id] an allowed own-phone list showed
    @hd_close_after = []       # own steps to close before the next row (a row never closes the step it is judged against)
    @hd_mfa_reset_possible = @hd_desks.values.any? { |d| d['resets'].include?('mfa') }
    @hd_max_tries = [@hd_desks.values.map { |d| d['maxTries'].to_i }.max.to_i, 1].max
    @hd_stop_until = nil       # the time (seconds) the latest stop seen runs to
    @hd_stop_unknown = false   # a stop was seen on a row with no readable time
    @hd_row_time = nil
    # R1-SCANNER3: a scenario whose only second step is one a re-enrolment creates still gets the session rules. This only turns
    # checking ON: before a grant every PC still owes nothing (`mfa_kind_at` answers `none`).
    @mfa_active ||= @hd_mfa_reset_possible && @priv_pcs.any? do |_id, pc|
      BreakEscape::MfaModel.kind(BreakEscape::CredentialModel.policy_for(@data, pc)) == 'code' &&
        @hd_accounts.any? { |_nid, npc| BreakEscape::MfaModel.enrolled?(npc) && BreakEscape::CredentialModel.pc_admits_account?(pc, npc) }
    end
  end

  # One response row. Judges it, then lets it earn what it proves (so a row never proves itself). Answers the body the
  # second-step rules are to see: the same body, or a copy without the own-phone code, number choices and flag this row was
  # allowed to carry (those rules know nothing of an own phone and would call them leaks).
  def scan_helpdesk(body, row, add)
    return body unless @hd_active

    @hd_close_after.each { |pc| @hd_own_steps.delete(pc) }
    @hd_close_after = []
    @hd_row = row
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
    hd_judge_own_step(body, minfo, flags, add)
    hd_judge_old_forms(body, minfo, add)
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
    add.call('helpdesk_secret', 'helpdesk:recovery:pair', '$') if body.is_a?(Array) && hd_recovery_in_array?(body)
    mfa_walk(body) do |hash, path, _parent|
      add.call('helpdesk_secret', 'helpdesk:recovery:pair', safe_path(path)) if hd_recovery_pair?(hash)
      hash.each do |key, value|
        at = safe_path("#{path}.#{key}")
        if value.is_a?(Array) && hd_recovery_in_array?(value, key)
          # an answer (or a question id beside one) inside an array: `{staff_no: ['40612']}`, `['staff_no', '40612']`
          add.call('helpdesk_secret', 'helpdesk:recovery:array', at)
        elsif (value.is_a?(Hash) || value.is_a?(Array)) && hd_recovery_below?(key, value)
          # R1-SCANNER4: under a question id, an authored answer to it at any depth: `{staff_no: {value: '40612'}}`
          add.call('helpdesk_secret', "helpdesk:recovery:#{key}", at)
        end
        if HD_NEVER_KEYS.include?(key)
          add.call('helpdesk_secret', "helpdesk:key:#{key}", at)
        elsif key == 'helpdeskForms'
          if root_forms && hash.equal?(body)
            hd_judge_forms(value, at, add)
          else
            add.call('helpdesk_secret', 'helpdesk:key:helpdeskForms', at)
          end
        elsif key == 'code' && @hd_mfa_reset_possible && !@mfa_code_possible && value.to_s.delete(" \t-").match?(/\d{6}/) &&
              !(hash.equal?(body) && flags[:device])
          # no code device is authored, so the second-step rules treat every code as impossible and say nothing; here a
          # six-digit code (however spaced) is allowed only as the root code of an earned own-device answer
          add.call('helpdesk_secret', 'helpdesk:own:code', at)
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

  # R1-L12: a hash holding a desk question id as a VALUE beside an authored answer to it (`{id: 'staff_no', answer: '40612'}`).
  def hd_recovery_pair?(hash)
    hash.values.any? do |qid|
      next false unless qid.is_a?(String) && @hd_recovery.key?(qid)

      hash.values.any? { |v| !v.equal?(qid) && v.is_a?(String) && @hd_recovery[qid].include?(BreakEscape::HelpdeskModel.normalise_answer(v)) }
    end
  end

  # Every string anywhere inside a hash or an array.
  def hd_deep_strings(node)
    case node
    when String then [node]
    when Array then node.flat_map { |v| hd_deep_strings(v) }
    when Hash then node.values.flat_map { |v| hd_deep_strings(v) }
    else []
    end
  end

  # An authored answer to question `qid` among the strings below `node`.
  def hd_recovery_below?(qid, node)
    answers = @hd_recovery[qid.to_s]
    !answers.nil? && hd_deep_strings(node).any? { |v| answers.include?(BreakEscape::HelpdeskModel.normalise_answer(v)) }
  end

  # The strings of an array, nested arrays flattened (a hash inside is judged by the walk itself).
  def hd_array_strings(array)
    array.flat_map { |v| v.is_a?(Array) ? hd_array_strings(v) : [v] }.grep(String)
  end

  # A recovery answer inside an array: under a key that is a desk question id, any string of the array is an authored answer to
  # it; or the array holds a question id and, beside it, an authored answer to that id.
  def hd_recovery_in_array?(array, key = nil)
    strings = hd_array_strings(array)
    norms = strings.map { |v| BreakEscape::HelpdeskModel.normalise_answer(v) }
    return true if key.is_a?(String) && @hd_recovery.key?(key) && norms.any? { |n| @hd_recovery[key].include?(n) }

    strings.each_with_index.any? do |qid, i|
      @hd_recovery.key?(qid) && norms.each_with_index.any? { |n, j| j != i && @hd_recovery[qid].include?(n) }
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

  # The entry is exactly what the server builds for that desk (R1-L8): its npc, its resets, its labels cut as the server cuts them.
  def hd_form_ok?(desk, form)
    form == BreakEscape::HelpdeskModel.forms(@data)[@hd_desks.key(desk)]
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

      return nil unless body['npcId'].is_a?(String) && body['deskId'].is_a?(String)

      if body['what'] == 'password'
        pcs = body['lockoutPcIds']
        keys == %w[deskId granted lockoutPcIds npcId password what] && body['password'].is_a?(String) && !body['password'].empty? &&
          pcs.is_a?(Array) && pcs.all? { |pc| pc.is_a?(String) && @priv_pcs.key?(pc) } ? :granted_password : nil
      elsif body['what'] == 'mfa'
        keys == %w[deskId granted npcId what] ? :granted_mfa : nil
      end
    when 422
      case body['reason']
      when 'refused'
        left = body['triesLeft']
        return nil unless keys == %w[reason triesLeft] && left.is_a?(Integer) && left.between?(0, @hd_max_tries - 1)

        left.zero? ? :refused_last : :refused
      when 'blocked'
        keys == %w[reason retryIn] && body['retryIn'].is_a?(Integer) && body['retryIn'].between?(1, BreakEscape::HelpdeskModel::DESK_STOP_SECONDS) ? :blocked : nil
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

  # The accounts a grant answer is credited for, or nil: the answer names an account (npcId) and a desk (deskId) of the
  # scenario, that desk covers the account for `what` (a callback desk only while the run holds the account's phone at this
  # row), and for a password the value is the one reset password that account owns.
  def hd_grant_credit(shape, body, info)
    return nil unless info[:status] == 200 && info[:method] == 'POST' && info[:strict]
    return nil if hd_stopped?(@hd_row_time)

    npc = @hd_accounts[body['npcId']]
    desk = @hd_desks[body['deskId']]
    what = shape == :granted_password ? 'password' : 'mfa'
    return nil unless npc && desk && hd_desk_covers?(desk, npc, what)

    if shape == :granted_password
      owners = @hd_reset_pw[body['password']]
      return nil unless owners == [npc['id']]
    end
    [npc['id']]
  end

  # The desk could grant `what` for this account NPC, and a `callback` desk only while the run holds the account's phone.
  def hd_desk_covers?(desk, npc, what)
    BreakEscape::HelpdeskModel.covers?(desk, npc, what) && (desk['verify'] != 'callback' || mfa_phone_taken?(npc['id']))
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
    when :granted_password
      if earned[:kind]
        fresh = earned[:accounts].reject { |id| @hd_earned_pw.include?(id) }
        @hd_earned_pw.merge(earned[:accounts])
        hd_drop_steps(fresh)
      end
    when :granted_mfa then @hd_mfa_earned.merge(earned[:accounts]) if earned[:kind]
    when :blocked then hd_note_stop(body['retryIn'])
    when :refused_last then hd_note_stop(BreakEscape::HelpdeskModel::DESK_STOP_SECONDS)
    end
  end

  # A FIRST password grant for an account drops its pending second steps on the server (a repeat grant is answered before that
  # and drops nothing), so a pass for it needs a new step. Only a credited grant drops (an uncredited one is a finding of its
  # own). The server also clears the account's wrong-code count; the scanner cannot clear its own count without letting a lock
  # answer be credited, so it marks each pair of that account that has a count as unknown (the lock rule then reports a lock
  # at that pair until a pass answer for it): a write that only adds findings. Dropping a step takes the pass allowances away; it
  # can also leave one open code step where two were open, which the server does too.
  def hd_drop_steps(accounts)
    @mfa_pending.delete_if { |_pc, rec| accounts.include?(rec[:npc]) }
    @hd_own_steps.delete_if { |_pc, npc| accounts.include?(npc) }
    @mfa_wrong.each { |(pc, npc), n| @mfa_wrong_unknown << [pc, npc] if n.to_i.positive? && accounts.include?(npc) }
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

    scope = hd_keyring_scope(row)
    strict = row['method'].to_s.upcase == 'GET' && row['status'] == 200 && row['path'].to_s.split('?', 2).first.to_s.match?(%r{/games/[^/]+/keyring\z})
    body['entries'].each_with_index do |entry, i|
      next unless entry.is_a?(Hash) && (entry['source'] == 'helpdesk' || entry['id'].to_s.end_with?('.reset'))

      npc_id = entry['id'].to_s.delete_suffix('.reset')
      if strict && hd_reset_entry_ok?(entry, npc_id, scope)
        allowed["$.entries[#{i}].password"] = entry['password']
      else
        add.call('helpdesk_secret', "helpdesk:keyring:#{npc_id}", safe_path("$.entries[#{i}]"))
      end
    end
    allowed
  end

  # The server scopes the entries of `GET keyring?pc_id=<a sign-in PC>` with `forThisPc` and `accepted` (credential_keyring.rb
  # keyring_scope_to_pc) only when that PC's screen is openable from the request. Answers: nil when the query names no such PC
  # (an entry then takes no scope keys), else { accepts: } for that PC's policy (the entry may then be scoped or plain). A pc_id twice, or one that is not a sign-in PC of the scenario, gives no scope.
  def hd_keyring_scope(row)
    pairs = URI.decode_www_form(row['query'].to_s)
    ids = pairs.select { |k, _| k == 'pc_id' }.map(&:last)
    return nil unless ids.size == 1

    pc = BreakEscape::CredentialModel.sign_in_pc(@data, ids.first)
    return nil unless pc

    { accepts: BreakEscape::CredentialModel.accepts?(BreakEscape::CredentialModel.policy_for(@data, pc), 'password') }
  rescue ArgumentError
    nil
  end

  # Exactly the plain key set, or (only when the query names a sign-in PC) exactly the plain set plus both scope keys with the
  # values the server computes. The server leaves the scope keys out when that PC's screen is not openable from the request
  # (a refused `from` route, a foothold that does not reach), and the capture cannot show which, so both forms are honest; one
  # scope key alone, a third key or a wrong value is neither.
  def hd_reset_entry_keys_ok?(entry, scope)
    keys = entry.keys.sort
    return true if keys == HD_KEYRING_RESET_KEYS
    return false unless scope && keys == (HD_KEYRING_RESET_KEYS + HD_KEYRING_SCOPE_KEYS).sort

    entry['forThisPc'] == true && entry['accepted'] == scope[:accepts]
  end

  def hd_reset_entry_ok?(entry, npc_id, scope = nil)
    npc = @hd_accounts[npc_id]
    return false unless npc && entry['id'] == "#{npc_id}.reset" && @hd_earned_pw.include?(npc_id) && hd_reset_entry_keys_ok?(entry, scope)

    account = entry['account']
    owners = @hd_reset_pw[npc['creds']['resetPassword']]
    entry['source'] == 'helpdesk' && entry['kind'] == 'password' && entry['label'] == 'Reset' && entry['how'] == 'issued' &&
      owners == [npc_id] && entry['password'] == npc['creds']['resetPassword'] &&
      account.is_a?(Hash) && account.keys.sort == HD_ACCOUNT_KEYS && account['npcId'] == npc_id && account['username'] == npc['creds']['username'] &&
      account['displayName'] == (npc['displayName'] || npc['id'])
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
    # R1-SCANNER8: a reset password used as a hash KEY is a finding wherever it is (a key is never an allowed place)
    mfa_walk(body) do |hash, path, _parent|
      hash.each_key do |key|
        next unless key.is_a?(String)

        @hd_reset_pw.each do |pw, ids|
          add.call('helpdesk_secret', "helpdesk:reset:#{ids.sort.join(',')}", safe_path("#{path}.<key>")) if contains_password?(key, pw)
        end
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

    body['deviceId'] == "own:#{id}" && body['npcId'] == id && body['displayName'] == HD_OWN_NAME &&
         body['code'].is_a?(String) && body['code'].match?(/\A\d{6}\z/) &&
         body['secondsLeft'].is_a?(Integer) && (1..BreakEscape::MfaModel::STEP_SECONDS).cover?(body['secondsLeft']) &&
         [true, false].include?(body['used']) && hd_account_earned?(id)
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
    body['deviceId'] == id && body['npcId'] == owner && body['displayName'] == shown && hd_account_earned?(owner)
  end

  # The 200 POST login answer of a re-enrolled account's second step: the usual mfaRequired shape plus `ownPhone: true`.
  def hd_own_required_ok?(body, minfo, row)
    return false unless body['ownPhone'] == true

    plain = body.reject { |k, _| k == 'ownPhone' }
    mfa_required_answer_ok?(plain, minfo, row) && hd_account_earned?(body['npcId'])
  end

  # The entries of a 200 GET mfa/phone?own=1 answer (nil unless the whole answer is in shape for earned accounts).
  def hd_own_phone_entries(body, minfo)
    return nil unless minfo[:method] == 'GET' && minfo[:route] == 'mfa/phone' && minfo[:ok]
    return nil unless mfa_query_value(minfo, 'own') == '1' && body.keys == ['requests'] && body['requests'].is_a?(Array)
    return nil if @hd_mfa_earned.empty?
    # an entry in lock form (it names a lock) is the lock rules' answer, never an own phone's: it is not allowed, consumed or
    # stripped here, so the lock rules judge it whole and this row is still judged as an own-phone list that is out of shape
    return nil if body['requests'].any? { |entry| entry.is_a?(Hash) && (entry.key?('targetType') || entry.key?('targetId')) }

    owners = body['requests'].map do |entry|
      name = entry.is_a?(Hash) ? entry['username'] : nil
      found = @hd_accounts.select { |_id, npc| npc['creds']['username'] == name }.keys
      found.size == 1 ? found.first : nil
    end
    return nil unless owners.all?
    return nil unless body['requests'].each_with_index.all? { |entry, i| mfa_phone_entry_ok?(entry, owners[i], @hd_accounts[owners[i]]) }
    return nil unless owners.all? { |owner| hd_account_earned?(owner) }

    body['requests'].each_with_index { |entry, i| @hd_own_listed << [entry['pcId'], owners[i]] }
    body['requests']
  end

  # ---- the own-phone step: who may close it ---------------------------------------------------------------------------------

  # An allowed `ownPhone` login answer opens an own-phone step at its PC for its account. The server never sends a plain
  # `mfaRequired` for a re-enrolled account, and never lets the owner, the old phone or a held phone close an own-phone step: an
  # approval for the account while the step is open is allowed only as `approvedBy: "own_phone"` (and then only by the hook in
  # `mfa_pass_pc`, which asks `hd_own_approval?`). Every other pass for the account is a finding.
  def hd_judge_own_step(body, minfo, flags, add)
    return unless body.is_a?(Hash)

    route = mfa_route_name(minfo)
    if route == 'login' && minfo[:method] == 'POST' && body['mfaRequired'] == true && body['pcId'].is_a?(String)
      if flags[:required]
        @hd_own_steps[body['pcId']] = body['npcId']
      else
        @hd_own_steps.delete(body['pcId'])
        add.call('helpdesk_secret', 'helpdesk:own:plain', '$') if hd_account_earned?(body['npcId'])
      end
      return
    end
    hd_note_own_close(body, minfo, route)
    return unless %w[mfa/prompt mfa/approve].include?(route) && body['success'] == true && hd_reenrolled?(body['npcId'])
    return if route == 'mfa/approve' && body['approvedBy'] == 'own_phone'

    add.call('helpdesk_secret', 'helpdesk:own:pass', '$')
  end

  # The record closes exactly what the second-step rule closes on the same row (R1-SCANNER1), so the two never disagree about an
  # open step: a pass closes the one PC `mfa_pass_pc` names (nothing when the pass is not proved); a cancel, an expiry or a
  # lockout closes the own steps whose pending step is of the kind the route handles (that PC alone when the row's tag names
  # one). An ended PC closes nothing: the server ends a session there, not a pending step, and `@mfa_pending` keeps it too.
  def hd_note_own_close(body, minfo, route)
    return unless %w[mfa/verify mfa/prompt mfa/approve].include?(route)

    if body['success'] == true
      pc = mfa_pass_pc(body, minfo, @hd_row || {})
      @hd_close_after << pc if pc
    elsif body['cancelled'] == true || body['expired'] == true || body['lockedOut'] == true
      kinds = route == 'mfa/verify' ? %w[code] : AccessLeakScanner::MFA_PUSH_KINDS
      tag = hd_row_tag
      @hd_close_after.concat(@hd_own_steps.keys.select do |pc|
        rec = @mfa_pending[pc]
        (rec.nil? || kinds.include?(rec[:kind])) && (tag.nil? || pc == tag)
      end)
    end
  end

  def hd_row_tag
    @hd_row && mfa_row_pc_tag(@hd_row)
  end

  # The hook `mfa_pass_pc` asks for an approval answer: `approvedBy` is `own_phone`, the row's query is exactly `own=1`, the
  # open step at that PC was opened by an allowed `ownPhone` answer for this account, an allowed own-phone list showed the
  # account's request at that PC, and a credited grant named the account. A pure question: it changes nothing.
  def hd_own_approval?(body, info, pc, npc)
    return false unless @hd_active && body.is_a?(Hash) && body['approvedBy'] == 'own_phone'

    hd_own_query_ok?(info) && @hd_own_steps[pc] == npc && @hd_own_listed.include?([pc, npc]) && hd_account_earned?(npc)
  end

  # The client sends `own=1` in the URL query of an approval (the recorder keeps the query, not the body): the row must carry
  # exactly that one parameter. No query, another value or a second parameter is not proof of an own request.
  def hd_own_query_ok?(info)
    mfa_query_value(info, 'own') == '1'
  end

  # Whether a credited grant re-enrolled the account (the hook in `mfa_kind_at`: such an account owes a code step without an
  # authored device).
  def hd_reenrolled?(npc_id)
    !@hd_mfa_earned.nil? && @hd_mfa_earned.include?(npc_id)
  end

  # R1-L10: once a grant re-enrolled an account, its held device answers `enrolled: false` and its held phone 403s: a code on
  # `mfa/device?item_id=` or a 200 list on `mfa/phone?npc_id=` for that account is a finding.
  def hd_judge_old_forms(body, minfo, add)
    return unless body.is_a?(Hash) && minfo[:method] == 'GET' && minfo[:ok]

    case minfo[:route]
    when 'mfa/device'
      owners = hd_query_values(minfo, 'item_id').map { |item| @mfa_devices[item] ? @mfa_devices[item]['owner'] : body['npcId'] }
      add.call('helpdesk_secret', 'helpdesk:old:code', '$.code') if body.key?('code') && owners.any? { |owner| hd_reenrolled?(owner) }
    when 'mfa/phone'
      owners = hd_query_values(minfo, 'npc_id')
      add.call('helpdesk_secret', 'helpdesk:old:phone', '$.requests') if body.key?('requests') && owners.any? { |owner| hd_reenrolled?(owner) }
    end
  end

  # A GET mfa/phone with an `own` query: judged here whatever the status; only the canonical 403 and an earned list pass.
  def hd_judge_phone_route(body, minfo, row, flags, add)
    return unless mfa_route_name(minfo) == 'mfa/phone' && hd_query_names?(minfo, 'own')
    return if flags[:phone]
    return if minfo[:method] == 'GET' && row['status'] == 403 && body == HD_NO_PHONE

    add.call('helpdesk_secret', 'helpdesk:own:phone', '$')
  end

  # Every non-empty value of a query parameter, whatever other parameters the query has (Rails reads the last of a repeated
  # name, so a rule that only reports judges all of them). `mfa_query_value` answers nil for a second parameter, which would let
  # the extra parameter hide the rule.
  def hd_query_values(minfo, name)
    hd_query_pairs(minfo[:query]).select { |key, value| key == name && !value.empty? }.map(&:last)
  rescue ArgumentError
    []
  end

  # The query split as the server's Rack (2.2) does: on `&` or `;` (each with any spaces after it), empty parts skipped, each
  # part cut at its first `=`, both sides percent-decoded, a part with no `=` has an empty value. `URI.decode_www_form` splits
  # on `&` only, so `npc_id=nia;npc_id=hana` would be one pair to it and two to the server.
  def hd_query_pairs(query)
    query.to_s.split(/[&;] */).reject(&:empty?).map do |part|
      key, value = part.split('=', 2)
      [URI.decode_www_form_component(key), URI.decode_www_form_component(value.to_s)]
    end
  end

  def hd_query_names?(minfo, name)
    hd_query_pairs(minfo[:query]).any? { |key, _| key == name }
  rescue ArgumentError
    true
  end

  # An account an own-phone form may be for: it asks a second step and a credited grant answer named it (the cover was judged
  # at that row, and is not asked again: handing a borrowed phone back changes nothing).
  def hd_account_earned?(npc_id)
    npc = npc_id.is_a?(String) ? @hd_accounts[npc_id] : nil
    !npc.nil? && BreakEscape::MfaModel.enrolled?(npc) && @hd_mfa_earned.include?(npc_id)
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
