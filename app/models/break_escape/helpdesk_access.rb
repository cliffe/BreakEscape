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
    # Writes on first use: for writers only; readers use the view (account_resets_view).
    def account_resets
      player_state['accountResets'] = {} unless player_state['accountResets'].is_a?(Hash)
      player_state['accountResets']
    end

    # { "<deskId>|<normalised username>" => { 'n' =>, 'seq' =>, 'stoppedAt' =>? } }
    # Writes on first use: for writers only; readers use the view (helpdesk_tries_view).
    def helpdesk_tries
      player_state['helpdeskTries'] = {} unless player_state['helpdeskTries'].is_a?(Hash)
      player_state['helpdeskTries']
    end

    # Whether a desk has done this reset (`password` or `mfa`) for the account
    def account_reset?(npc_id, what)
      entry = account_resets_view[npc_id.to_s]
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
      entry = account_resets_view[npc_id.to_s]
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
      entry = helpdesk_tries_view[key]
      if entry.is_a?(Hash) && entry['stoppedAt'].is_a?(Integer)
        retry_in = entry['stoppedAt'] + HelpdeskModel::DESK_STOP_SECONDS - now
        # Past ten stored rows the log call stores nothing, so there is nothing to save
        save! if log_helpdesk_request(desk_id, typed, what, 'blocked')&.stored?
        return { status: :unprocessable_entity, body: { reason: 'blocked', retryIn: retry_in } }
      end

      npc = typed.empty? ? nil : account_for_username(typed)
      # The rule is judged for every name, account or not, and the result discarded for a non-account:
      # there is no branch on "is this an account" before the rule has run
      covered = helpdesk_covers_request?(desk, npc || { 'id' => typed, 'creds' => {} }, what, answers)
      if npc && covered
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

    # Non-writing readers: the stored Hash, or a frozen empty one. Never touch player_state.
    EMPTY_STATE = {}.freeze

    def account_resets_view
      stored = player_state['accountResets']
      stored.is_a?(Hash) ? stored : EMPTY_STATE
    end

    def helpdesk_tries_view
      stored = player_state['helpdeskTries']
      stored.is_a?(Hash) ? stored : EMPTY_STATE
    end

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
      entry = helpdesk_tries_view[key]
      return unless entry.is_a?(Hash) && entry['stoppedAt'].is_a?(Integer)

      helpdesk_tries.delete(key) if now - entry['stoppedAt'] >= HelpdeskModel::DESK_STOP_SECONDS
    end

    # The rule, and (for a password) the account having something to issue. The rule is always
    # evaluated first, so a name with no account does the same work as one with an account.
    def helpdesk_covers_request?(desk, npc, what, answers)
      creds = npc['creds'].is_a?(Hash) ? npc['creds'] : {}
      met =
        case desk['verify']
        when 'none' then true
        when 'callback' then !held_friendface_phone(npc['id']).nil?
        else
          given = answers.is_a?(Hash) ? answers : {}
          recovery = creds['recovery'].is_a?(Hash) ? creds['recovery'] : {}
          HelpdeskModel.rule_met?(desk, recovery, given)
        end
      issues = what != 'password' || (creds['resetPassword'].is_a?(String) && !creds['resetPassword'].empty?)
      met && issues
    end

    def refuse_helpdesk!(desk_id, desk, typed, what, key, now)
      tries = helpdesk_tries
      entry = tries[key]
      if entry.is_a?(Hash)
        entry['n'] = entry['n'].to_i + 1
      else
        retry_in = make_room_for_helpdesk_try!(tries, now)
        return helpdesk_blocked_by_cap!(desk_id, typed, what, retry_in) if retry_in

        seq = tries.values.map { |e| e.is_a?(Hash) ? e['seq'].to_i : 0 }.max.to_i + 1
        entry = tries[key] = { 'n' => 1, 'seq' => seq }
      end
      left = [desk['maxTries'] - entry['n'], 0].max
      entry['stoppedAt'] = now if left.zero?
      log_helpdesk_request(desk_id, typed, what, 'refused')
      save!
      { status: :unprocessable_entity, body: { reason: 'refused', triesLeft: left } }
    end

    # The tries table holds at most TRIES_CAP names, accounts and others alike, so a refusal never
    # tells one from the other. Room is made by dropping stops that have run out, then the oldest
    # name that is not stopped; a stopped name is never dropped (junk names cannot lift a stop).
    # Answers nil when there is room, else the seconds until the soonest stop ends: every held
    # name is stopped, and a new name is answered as stopped, account or not.
    def make_room_for_helpdesk_try!(tries, now)
      tries.delete_if do |_k, e|
        e.is_a?(Hash) && e['stoppedAt'].is_a?(Integer) && now - e['stoppedAt'] >= HelpdeskModel::DESK_STOP_SECONDS
      end
      while tries.size >= HelpdeskModel::TRIES_CAP
        loose = tries.reject { |_k, e| e.is_a?(Hash) && e['stoppedAt'].is_a?(Integer) }
        return tries.values.map { |e| e['stoppedAt'].to_i + HelpdeskModel::DESK_STOP_SECONDS - now }.min if loose.empty?

        tries.delete(loose.min_by { |_k, e| e.is_a?(Hash) ? e['seq'].to_i : 0 }.first)
      end
      nil
    end

    def helpdesk_blocked_by_cap!(desk_id, typed, what, retry_in)
      save! if log_helpdesk_request(desk_id, typed, what, 'blocked')&.stored?
      { status: :unprocessable_entity, body: { reason: 'blocked', retryIn: retry_in } }
    end

    def grant_helpdesk!(desk_id, desk, npc, typed, what, key)
      npc_id = npc['id']
      body = helpdesk_grant_body(npc, what, desk_id)
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
        body = helpdesk_grant_body(npc, what, desk_id)
        drop_pending_second_steps!(npc_id)
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

    # A step begun on the old password cannot finish on the new one: every pending second-step
    # record of this account goes. Reads the map only when it is already stored (creates no key).
    def drop_pending_second_steps!(npc_id)
      pending = player_state['mfaPending']
      return unless pending.is_a?(Hash)

      pending.delete_if { |_k, rec| rec.is_a?(Hash) && rec['npcId'].to_s == npc_id.to_s }
    end

    # npcId is the account NPC's id (never the typed username) and deskId the key the request was
    # judged against; a repeat grant carries the same two
    def helpdesk_grant_body(npc, what, desk_id)
      ids = { npcId: npc['id'].to_s, deskId: desk_id.to_s }
      if what == 'password'
        { granted: true, what: 'password', password: npc['creds']['resetPassword'], lockoutPcIds: lockout_pcs_for_client }.merge(ids)
      else
        { granted: true, what: 'mfa' }.merge(ids)
      end
    end

    def log_helpdesk_request(desk_id, typed, what, result)
      write_log_row!('helpdesk_request', as: { typed: typed }, where: { kind: 'desk', id: desk_id.to_s },
                                         result: result, detail: { what: what },
                                         save_limit: result == 'blocked')
    end
  end
end
