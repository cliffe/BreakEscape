# frozen_string_literal: true

module BreakEscape
  # The second sign-in step's subject functions (S8a, feature A22), shared by the code and push
  # kinds. They take an owner (an NPC id), a subject `{ kind:, id: }` and a record map, and read
  # nothing about the subject but its kind and id. A map holds one record per key; the caller adds
  # the lockout failure and drops the record on a pass for a `pc` subject, and marks `passed` for
  # any other subject.
  # Time comes only through `mfa_now`, which MfaSignIn defines (both modules are included in Game).
  module MfaAccess
    extend ActiveSupport::Concern

    CODE_FORMAT = /\A\d{6}\z/.freeze

    # The one key a subject has wherever it is keyed by kind and id together (numbers, request
    # keys): "<kind>:<id>". A door `x` and a PC `x` never share one. A record map's own key stays
    # the bare id.
    def mfa_subject_key(subject)
      "#{subject[:kind]}:#{subject[:id]}"
    end

    # Drops records older than PENDING_SECONDS, except one marked passed. Run on every read and
    # write of a map.
    def tidy_pending!(map)
      return map unless map.is_a?(Hash)

      now = mfa_now
      map.delete_if do |_key, rec|
        !rec.is_a?(Hash) || (rec['passed'] != true && now - rec['at'].to_i > MfaModel::PENDING_SECONDS)
      end
      map
    end

    # Starts a second step for the key: counts it against the account, writes the record
    # (one per key, a new one overwrites) and answers it.
    def issue_second_step!(map, key, npc_id, kind, extra = {})
      tidy_pending!(map)
      account = mfa_account_for(npc_id)
      account['started'] = account['started'].to_i + 1
      map[key] = { 'id' => key, 'kind' => kind, 'n' => 0, 'tries' => 0, 'nonce' => account['started'],
                   'at' => mfa_now, 'last' => 0 }.merge(extra.transform_keys(&:to_s))
    end

    # The model's code for the current window (noted as an issued secret)
    def code_device_code(device_id, window = mfa_window)
      mfa_code_for_window(device_id, window)
    end

    # :passed, [:stale, 'used' | 'expired'], :wrong, :expired (the fifth wrong try; the record is
    # dropped), [:closed, retry_in] or :malformed (not six digits; counted nowhere). A wrong try
    # that closes the account's step answers [:wrong, :closed] ([:expired, :closed] on the fifth
    # try), so the caller writes ONE mfa_code_locked row.
    def verify_second_step_code(map, key, subject, typed, device_id, npc_id:)
      tidy_pending!(map)
      account = mfa_account_for(npc_id)
      now = mfa_now
      if account['closedAt']
        left = account['closedAt'].to_i + MfaModel::CODE_CLOSED_SECONDS - now
        return [:closed, left] if left.positive?

        account.delete('closedAt')
        account['wrong'] = 0
      end
      record = map[key]
      return :expired unless record.is_a?(Hash) && subject.is_a?(Hash) && record['kind'] == 'code'
      return :malformed unless typed.is_a?(String) && typed.match?(CODE_FORMAT)

      window = now / MfaModel::STEP_SECONDS
      codes = (window - 3..window).to_h { |w| [w, mfa_code_for_window(device_id, w)] }
      used = account['used']
      state, reason = MfaModel.code_state(typed, codes, used, window)
      case state
      when :right
        account['used'] = matched_window(codes, typed, window, used)
        :passed
      when :stale
        [:stale, reason.to_s]
      else
        record['tries'] = record['tries'].to_i + 1
        account['wrong'] = account['wrong'].to_i + 1
        closed = account['wrong'] >= MfaModel::MAX_CODE_WRONG_TOTAL
        account['closedAt'] = now if closed
        fifth = record['tries'] >= MfaModel::MAX_CODE_TRIES
        map.delete(key) if fifth
        result = fifth ? :expired : :wrong
        closed ? [result, :closed] : result
      end
    end

    PUSH_KINDS = %w[push push_number_match].freeze

    # Sends (or repeats) the push prompt for the key. Answers [:too_soon, retry_after], :expired
    # (no live push record, or the twentieth prompt: the record is dropped), [:waiting, 'own_phone'
    # | 'held_phone' | 'owner'], :nobody (the owner's phone was taken and is not held, or the owner
    # is recorded as knocked out: refuse only) or :passed (the owner approves). `npc_id` is the
    # account's owner. A caller drops the record (pc) or marks it passed (other subjects).
    def send_second_step_prompt(map, key, subject, npc_id:, reenrolled: false)
      tidy_pending!(map)
      record = map[key]
      return :expired unless push_record?(record, subject)

      now = mfa_now
      gap = MfaModel::PROMPT_GAP_SECONDS
      return [:too_soon, gap - (now - record['last'].to_i)] if record['last'].to_i.positive? && now - record['last'].to_i < gap

      if record['n'].to_i >= MfaModel::MAX_PROMPTS
        map.delete(key)
        return :expired
      end
      record['n'] = record['n'].to_i + 1
      record['last'] = now
      return [:waiting, 'own_phone'] if reenrolled && subject[:kind] == 'pc'
      return [:waiting, 'held_phone'] if held_friendface_phone(npc_id)
      return :nobody if friendface_phone_taken?(npc_id) || npc_ko_record_present?(npc_id)

      owner_receives_prompt(record, npc_id)
    end

    # The three numbers of a number-matching attempt, in display order: { right:, wrong:, choices: }.
    # All three are noted as issued secrets.
    def second_step_numbers(subject, pending, npc_id:)
      numbers = MfaModel.numbers(mfa_key, id, mfa_subject_key(subject), npc_id, pending['nonce'])
      numbers[:choices].each { |n| OpsLog.note_issued_secret(n.to_s) }
      numbers
    end

    # The player, holding the owner's phone (or the re-enrolled own phone for a pc subject),
    # answers the prompt. :no_phone, :cancelled (deny or a wrong number: the record is dropped,
    # nothing counted towards a lockout) or :passed.
    #
    # `own_form` says the answer came through the own-phone form. For a re-enrolled account on a
    # pc subject the old phone is no longer its second factor: an approval is accepted only through
    # the own-phone form, and one through a held old phone is refused as :no_phone with nothing
    # changed. Any other account is judged as before, whatever `own_form` says.
    def approve_second_step(map, key, subject, npc_id:, number: nil, deny: false, reenrolled: false, own_form: true)
      tidy_pending!(map)
      record = map[key]
      own_pc = reenrolled && subject.is_a?(Hash) && subject[:kind] == 'pc'
      phone = own_pc ? own_form == true : held_friendface_phone(npc_id)
      return :no_phone unless push_record?(record, subject) && phone

      right = record['kind'] != 'push_number_match' ||
              (!number.nil? && number.to_s == second_step_numbers(subject, record, npc_id: npc_id)[:right].to_s)
      if deny || !right
        map.delete(key)
        return :cancelled
      end
      mfa_prompts_map[npc_id.to_s] = 0
      :passed
    end

    # The waiting push requests for an owner across the given record sets, one per subject. Each
    # set is `{ kind:, map: }` (the subject kind and the map holding its records, keyed by the
    # bare id). An entry is { 'key' => "<kind>:<id>", 'subject' => kind, 'id', 'kind' (the step
    # kind), 'n' } and, for number matching, 'numbers' in model order (none marked).
    def second_step_requests(sets, npc_id:)
      seen = {}
      Array(sets).each do |set|
        map = set[:map]
        tidy_pending!(map)
        map.each do |id, rec|
          subject = { kind: set[:kind].to_s, id: id.to_s }
          key = mfa_subject_key(subject)
          next if seen.key?(key) || !rec.is_a?(Hash) || rec['passed'] == true || !PUSH_KINDS.include?(rec['kind'])

          entry = { 'key' => key, 'subject' => subject[:kind], 'id' => subject[:id], 'kind' => rec['kind'],
                    'n' => rec['n'].to_i }
          entry['numbers'] = second_step_numbers(subject, rec, npc_id: npc_id)[:choices] if rec['kind'] == 'push_number_match'
          seen[key] = entry
        end
      end
      seen.values
    end

    private

    def push_record?(record, subject)
      record.is_a?(Hash) && subject.is_a?(Hash) && PUSH_KINDS.include?(record['kind'])
    end

    # Case 5: the owner receives the prompt. The count (kept per owner, across attempts) rises;
    # number matching never approves; `push` approves for `always`, or for `pestered` at patience.
    def owner_receives_prompt(record, npc_id)
      prompts = mfa_prompts_map
      count = prompts[npc_id.to_s] = prompts[npc_id.to_s].to_i + 1
      return [:waiting, 'owner'] if record['kind'] == 'push_number_match'

      npc = find_npc_in_scenario(npc_id)
      habit = MfaModel.prompt_habit(npc, scenario_data)
      approves = habit == 'always' || (habit == 'pestered' && count >= MfaModel.prompt_patience(npc))
      return [:waiting, 'owner'] unless approves

      prompts[npc_id.to_s] = 0
      :passed
    end

    def mfa_prompts_map
      player_state['mfaPrompts'] = {} unless player_state['mfaPrompts'].is_a?(Hash)
      player_state['mfaPrompts']
    end

    def mfa_window
      mfa_now / MfaModel::STEP_SECONDS
    end

    def mfa_key
      Rails.application.key_generator.generate_key('break_escape/mfa')
    end

    def mfa_code_for_window(device_id, window)
      code = MfaModel.code(mfa_key, id, device_id, window)
      OpsLog.note_issued_secret(code)
      code
    end

    # The window of the live code the player typed, compared in constant time
    def matched_window(codes, typed, window, used)
      [window, window - 1].find do |w|
        codes[w].bytesize == typed.bytesize && ActiveSupport::SecurityUtils.fixed_length_secure_compare(codes[w], typed) &&
          (used.nil? || w > used)
      end
    end

    def mfa_accounts_map
      player_state['mfaAccounts'] = {} unless player_state['mfaAccounts'].is_a?(Hash)
      player_state['mfaAccounts']
    end

    def mfa_account_for(npc_id)
      accounts = mfa_accounts_map
      accounts[npc_id.to_s] = {} unless accounts[npc_id.to_s].is_a?(Hash)
      accounts[npc_id.to_s]
    end
  end
end
