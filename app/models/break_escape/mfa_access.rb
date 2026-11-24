# frozen_string_literal: true

module BreakEscape
  # The second sign-in step's subject functions (S8a, feature A22), code kind. They take an owner
  # (an NPC id), a subject `{ kind:, id: }` and a record map, and read nothing about the subject
  # but its kind and id. A map holds one record per key; the caller adds the lockout failure and
  # drops the record on a pass for a `pc` subject, and marks `passed` for any other subject.
  # Time comes only through `mfa_now`.
  module MfaAccess
    extend ActiveSupport::Concern

    CODE_FORMAT = /\A\d{6}\z/.freeze

    # The server's wall clock, through one seam (unit 13 moves it to MfaSignIn)
    def mfa_now
      Time.current.to_i
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
    def code_device_code(device_id)
      mfa_code_for_window(device_id, mfa_window)
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

      window = mfa_window
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

    private

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
