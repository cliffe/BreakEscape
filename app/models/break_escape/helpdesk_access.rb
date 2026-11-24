# frozen_string_literal: true

module BreakEscape
  # Helpdesk recovery (S8b, feature A23): a desk resets an account's password or second factor when
  # a request meets its rule. Every grant is a server decision from server-held state; nothing the
  # client says about a global grants anything. The two state keys (accountResets, helpdeskTries)
  # are server-owned and read only through the accessors here. Time comes only through `mfa_now`.
  module HelpdeskAccess
    extend ActiveSupport::Concern

    # What the helpdesk log source treats as secret: every account's authored reset password.
    # Recovery answers are public facts and are deliberately not registered.
    OpsLog.register_secret_source(:helpdesk) do |game|
      out = []
      OpsLog.each_scenario_hash(game.scenario_data) do |node|
        out.concat(OpsLog.scalar_secret(node['creds']['resetPassword'])) if node['creds'].is_a?(Hash)
      end
      out
    end

    # { npcId => { 'password' => true?, 'mfa' => true?, 'typed' => true? } }
    def account_resets
      player_state['accountResets'] = {} unless player_state['accountResets'].is_a?(Hash)
      player_state['accountResets']
    end

    # { "<deskId>|<normalised username>" => { 'n' =>, 'seq' =>, 'stoppedAt' =>? } }
    def helpdesk_tries
      player_state['helpdeskTries'] = {} unless player_state['helpdeskTries'].is_a?(Hash)
      player_state['helpdeskTries']
    end

    # Whether a desk has done this reset (`password` or `mfa`) for the account
    def account_reset?(npc_id, what)
      entry = account_resets[npc_id.to_s]
      entry.is_a?(Hash) && entry[what.to_s] == true
    end

    # The password this account signs in with now: the desk's issued one once a desk has reset it,
    # else the authored one. A reset without an authored resetPassword changes nothing.
    def effective_password(npc)
      creds = npc.is_a?(Hash) && npc['creds'].is_a?(Hash) ? npc['creds'] : {}
      issued = creds['resetPassword']
      if account_reset?(npc['id'], 'password') && issued.is_a?(String) && !issued.empty?
        issued
      else
        creds['password']
      end
    end

    # Every loginFailures key and loginLockouts entry ("pcId|username") for this account
    def login_lockout_keys_for(npc)
      wanted = AccessIdentities.normalise_username(npc.dig('creds', 'username'))
      return [] if wanted.empty?

      (login_failures.keys + login_lockouts).select do |key|
        AccessIdentities.lockout_key_parts(key)&.last == wanted
      end.uniq
    end

    # A typed sign-in with the new password has happened: a saved connection made before the reset
    # no longer opens. A no-op for an account whose password no desk reset. The caller saves.
    def note_typed_sign_in!(npc_id)
      entry = account_resets[npc_id.to_s]
      entry['typed'] = true if entry.is_a?(Hash) && entry['password'] == true
    end

    # POST /helpdesk/request, checks 2 to 7 (check 1 is the controller's). `username` and `answers`
    # arrive as the controller got them; they are cut and cleaned here. Answers { status:, body: }.
    # Neither the typed username nor any answer is echoed. Runs inside with_game_lock.
    def request_helpdesk!(desk_id, username, what, answers, pc_id = nil)
      desk = HelpdeskModel.desks(scenario_data)[desk_id.to_s]
      return helpdesk_refusal(:not_found, 'not_found') unless desk

      npc_id = desk['npc']
      return helpdesk_refusal(:unprocessable_entity, 'unavailable') unless helpdesk_npc_serving?(npc_id)
      return helpdesk_refusal(:unprocessable_entity, 'unavailable') unless helpdesk_pc_open?(pc_id)
      return helpdesk_refusal(:unprocessable_entity, 'unavailable') unless desk['resets'].include?(what.to_s)

      what = what.to_s
      typed = AccessIdentities.normalise_username(HelpdeskModel.clean_username(username.to_s))
      key = HelpdeskModel.tries_key(desk_id, typed)
      now = mfa_now
      lift_helpdesk_stop!(key, now)
      entry = helpdesk_tries[key]
      if entry.is_a?(Hash) && entry['stoppedAt'].is_a?(Integer)
        retry_in = entry['stoppedAt'] + HelpdeskModel::DESK_STOP_SECONDS - now
        # Past ten stored rows the log call stores nothing, so there is nothing to save
        save! if log_helpdesk_request(desk_id, typed, what, 'blocked')&.stored?
        return { status: :unprocessable_entity, body: { reason: 'blocked', retryIn: retry_in } }
      end

      npc = typed.empty? ? nil : account_for_username(typed)
      if npc && helpdesk_covers_request?(desk, npc, what, answers)
        grant_helpdesk!(desk_id, desk, npc, typed, what, key)
      else
        refuse_helpdesk!(desk_id, desk, typed, what, key, now)
      end
    end

    # The bootstrap's helpdeskForms: per desk npc, resets, questionLabels. nil with no desk.
    def helpdesk_forms_for_client
      HelpdeskModel.forms(scenario_data)
    end

    # One keyring entry per account a desk has reset the password of (the `<npcId>.reset` entry)
    def helpdesk_keyring_entries
      account_npcs.filter_map do |npc|
        next unless account_reset?(npc['id'], 'password')

        secret = npc['creds']['resetPassword']
        next unless secret.is_a?(String) && !secret.empty?

        {
          'id' => "#{npc['id']}.reset",
          'kind' => 'password',
          'source' => 'helpdesk',
          'account' => account_block(npc, npc['creds']['username']),
          'label' => 'Reset',
          'how' => 'issued',
          'password' => secret
        }
      end
    end

    private

    def helpdesk_refusal(status, reason)
      { status: status, body: { reason: reason } }
    end

    # The desk's NPC exists, has been met and is not recorded as knocked out
    def helpdesk_npc_serving?(npc_id)
      return false unless npc_id.is_a?(String) && scenario_room_npc(npc_id)

      Array(player_state['encounteredNPCs']).include?(npc_id) && !npc_ko_record_present?(npc_id)
    end

    # No pc_id: no session needed. With one: a sign-in PC with an open, unlocked session record.
    # A real and an invented id fail the same way.
    def helpdesk_pc_open?(pc_id)
      return true if pc_id.nil?
      return false unless pc_id.is_a?(String) && find_login_pc(pc_id)

      session = access_sessions[pc_id]
      session.is_a?(Hash) && !session_locked?(session)
    end

    # A stop older than the stop length is lifted (entry deleted, count back to 0)
    def lift_helpdesk_stop!(key, now)
      entry = helpdesk_tries[key]
      return unless entry.is_a?(Hash) && entry['stoppedAt'].is_a?(Integer)

      helpdesk_tries.delete(key) if now - entry['stoppedAt'] >= HelpdeskModel::DESK_STOP_SECONDS
    end

    # The rule, and (for a password) the account having something to issue
    def helpdesk_covers_request?(desk, npc, what, answers)
      creds = npc['creds']
      return false if what == 'password' && !(creds['resetPassword'].is_a?(String) && !creds['resetPassword'].empty?)

      case desk['verify']
      when 'none' then true
      when 'callback' then !held_friendface_phone(npc['id']).nil?
      else
        given = answers.is_a?(Hash) ? answers : {}
        recovery = creds['recovery'].is_a?(Hash) ? creds['recovery'] : {}
        HelpdeskModel.rule_met?(desk, recovery, given)
      end
    end

    def refuse_helpdesk!(desk_id, desk, typed, what, key, now)
      tries = helpdesk_tries
      entry = tries[key]
      if entry.is_a?(Hash)
        entry['n'] = entry['n'].to_i + 1
      else
        seq = tries.values.map { |e| e.is_a?(Hash) ? e['seq'].to_i : 0 }.max.to_i + 1
        entry = tries[key] = { 'n' => 1, 'seq' => seq }
        trim_non_account_helpdesk_tries!
      end
      left = [desk['maxTries'] - entry['n'], 0].max
      entry['stoppedAt'] = now if left.zero?
      log_helpdesk_request(desk_id, typed, what, 'refused')
      save!
      { status: :unprocessable_entity, body: { reason: 'refused', triesLeft: left } }
    end

    # Entries for usernames that are not accounts are capped; the oldest (smallest seq) is dropped
    def trim_non_account_helpdesk_tries!
      tries = helpdesk_tries
      usernames = account_usernames
      loop do
        extra = tries.reject { |k, _| usernames.include?(k.partition('|').last) }
        break if extra.size <= HelpdeskModel::TRIES_CAP

        oldest = extra.min_by { |_k, e| e.is_a?(Hash) ? e['seq'].to_i : 0 }&.first
        break unless oldest

        tries.delete(oldest)
      end
    end

    def grant_helpdesk!(desk_id, desk, npc, typed, what, key)
      npc_id = npc['id']
      body = helpdesk_grant_body(npc, what)
      return { status: :ok, body: body } if account_reset?(npc_id, what)

      entry = account_resets[npc_id]
      entry = account_resets[npc_id] = {} unless entry.is_a?(Hash)
      entry[what] = true
      helpdesk_tries.delete(key)
      if what == 'password'
        login_lockout_keys_for(npc).each do |k|
          login_failures.delete(k)
          login_lockouts.delete(k)
        end
        body = helpdesk_grant_body(npc, what)
      else
        account = mfa_account_for(npc_id)
        account['wrong'] = 0
        account.delete('closedAt')
      end
      log_helpdesk_request(desk_id, typed, what, 'granted')
      account_name = AccessIdentities.normalise_username(npc['creds']['username'])
      write_log_row!(what == 'password' ? 'account_password_reset' : 'account_mfa_reenrolled',
                     as: { account: account_name }, where: { kind: 'desk', id: desk_id.to_s },
                     detail: { agent: desk['npc'] })
      save!
      { status: :ok, body: body }
    end

    def helpdesk_grant_body(npc, what)
      if what == 'password'
        { granted: true, what: 'password', password: npc['creds']['resetPassword'], lockoutPcIds: lockout_pcs_for_client }
      else
        { granted: true, what: 'mfa' }
      end
    end

    def log_helpdesk_request(desk_id, typed, what, result)
      write_log_row!('helpdesk_request', as: { typed: typed }, where: { kind: 'desk', id: desk_id.to_s },
                                         result: result, detail: { what: what },
                                         save_limit: result == 'blocked')
    end
  end
end
