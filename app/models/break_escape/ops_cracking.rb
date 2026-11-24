# frozen_string_literal: true

require 'openssl'

module BreakEscape
  # Hash records and the offline cracker (S7 units 08 and 11, feature A21): the token a hash row
  # shows, the password class of a record, its status and the row itself (reads), then the
  # refusal checks, the run and the grant (writes, under the caller's game lock). See docs/agents/ops_core_build/S7_BUILD_BRIEF.md, section 4.
  #
  # Nothing here reaches the browser except the row: token, salted, status, readyInSeconds and the
  # account block. The recipe (crack, passwordDifficulty) and the password stay on the server.
  #
  # player_state keys read (server-written only, never sent whole): crackRuns { hashId => Integer },
  # crackStarted { hashId => { 'at' => seconds, 'hit' => bool } }, crackedAccounts [npcId].
  module OpsCracking
    extend ActiveSupport::Concern

    CRACK_CLASSES = %w[strong guessable reused common].freeze
    # A strong password is tried twice at most: the second run is the one that says infeasible.
    STRONG_RUN_CAP = 2
    TOKEN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    TOKEN_LENGTH = 24

    # The invented token shown on a hash row: 24 characters of a 32-letter alphabet in groups of
    # four. Derived on each answer, never stored. Keyed with a key from the app's secret, over the
    # game id plus, for an unsalted record, the account's password or, for a salted one, the record
    # id. "Salted" is the resolved value (CrackDifficulty), not only the field on the record.
    def crack_token(id, entry, npc)
      resolved = CrackDifficulty.resolve(entry, npc)
      salted = resolved.nil? ? false : resolved[:salted]
      password = npc.is_a?(Hash) ? npc.dig('creds', 'password') : nil
      basis = salted || !CredentialModel.present_string?(password) ? "salt:#{id}" : "plain:#{password}"
      digest = OpenSSL::HMAC.digest('SHA256', crack_token_key, "#{self.id}|#{basis}")
      bits = digest.unpack1('B*')
      chars = Array.new(TOKEN_LENGTH) { |i| TOKEN_ALPHABET[bits[i * 5, 5].to_i(2)] }
      chars.each_slice(4).map(&:join).join('-')
    end

    # The password class of a record: crack.password, else the NPC's habits.password. nil (the
    # caller fails closed as no_recipe) for no class, an unknown value, an unresolvable grade or an
    # account with no creds.password.
    def crack_class(entry, npc)
      return nil unless entry.is_a?(Hash) && npc.is_a?(Hash)
      return nil unless CredentialModel.present_string?(npc.dig('creds', 'password'))
      return nil unless CrackDifficulty.resolve(entry, npc)

      crack = entry['crack']
      written = crack.is_a?(Hash) ? crack['password'] : nil
      habits = npc['habits']
      klass = written || (habits.is_a?(Hash) ? habits['password'] : nil)
      CRACK_CLASSES.include?(klass) ? klass : nil
    end

    # { status:, ready_in_seconds: } for one hash record. cracked when the account's password is
    # held; running (with the seconds left, 0 once the wait is over) while a salted run is stored;
    # infeasible after the cap of runs on a strong password; else ready.
    def crack_status(id, entry, npc)
      return { status: 'cracked' } if password_held_for?(npc['id'])

      started = crack_started_for(id)
      if started
        resolved = CrackDifficulty.resolve(entry, npc)
        wait = resolved && resolved[:crack_seconds] ? resolved[:crack_seconds] : CrackDifficulty::DEFAULT_WAIT
        left = (started['at'].to_f + wait - server_now).ceil
        return { status: 'running', ready_in_seconds: [left, 0].max }
      end

      runs = player_state['crackRuns']
      count = runs.is_a?(Hash) ? runs[id].to_i : 0
      return { status: 'infeasible' } if count >= STRONG_RUN_CAP

      { status: 'ready' }
    end

    # Whether the player holds this account's password: it is in crackedAccounts, or the keyring
    # lists for it a capture entry (with or without the value) or a registry password entry whose
    # proof holds.
    def password_held_for?(npc_id)
      cracked = player_state['crackedAccounts']
      return true if cracked.is_a?(Array) && cracked.include?(npc_id)

      return true if implicit_keyring_entries.any? { |e| e.dig('account', 'npcId') == npc_id }

      CredentialModel.registry(scenario_data).any? do |cred_id, entry|
        entry['kind'] == 'password' && entry['account'] == npc_id && credential_proof_holds?(cred_id, entry)
      end
    end

    # The keyring row of a hash record whose proof holds: no routes, no connectsTo, no password.
    # nil when the record's grade does not resolve (no row is listed).
    def hash_keyring_entry(id, entry, npc)
      resolved = CrackDifficulty.resolve(entry, npc)
      return nil unless resolved

      state = crack_status(id, entry, npc)
      row = {
        'id' => id,
        'kind' => 'hash',
        'source' => 'registry',
        'account' => account_block(npc, npc.dig('creds', 'username')),
        'label' => credential_label(entry),
        'token' => crack_token(id, entry, npc),
        'salted' => resolved[:salted],
        'status' => state[:status]
      }
      row['readyInSeconds'] = state[:ready_in_seconds] if state[:status] == 'running'
      row
    end

    # { hashId => readyInSeconds } for the running rows of a keyring answer, for the controller's
    # `unchanged` answer. Empty when none runs.
    def keyring_live_crack_waits(entries)
      Array(entries).each_with_object({}) do |e, out|
        next unless e.is_a?(Hash) && e['kind'] == 'hash' && e['status'] == 'running' && e.key?('readyInSeconds')

        out[e['id']] = e['readyInSeconds']
      end
    end

    CRACK_STATE_CAP = 64

    # The refusal code (a Symbol) for a crack request, or nil when the run may go ahead. Pure:
    # writes nothing. Covers checks 3, 5 and 6 of the route, in order: :not_found (not a registry
    # id, unknown, not a hash record, or a proof that does not hold now), then, unless the
    # account's password is already held (the route's check 4: run_crack! answers cracked), :no_recipe
    # and :fact_not_held (a picked id outside the earned set; compared exactly).
    def crack_refusal(hash_id, facts)
      found = crack_record(hash_id)
      return :not_found unless found

      entry, npc = found
      return nil if password_held_for?(npc['id'])
      return :no_recipe unless crack_class(entry, npc)
      # R1-S3: a post during a wait reads no pick (run_crack! answers running), so a pick that is
      # not held cannot refuse it
      return nil if crack_started_for(hash_id)

      earned = earned_fact_ids
      return :fact_not_held unless Array(facts).all? { |f| f.is_a?(String) && earned.include?(f) }

      nil
    end

    # One crack run (section 4). The caller holds the game lock and has passed crack_refusal.
    # Returns { status:, runs:?, missingCount:?, readyInSeconds:?, accountId:?, credentialIds:? }
    # and saves when it changed state. Never carries the password. Time comes only from server_now.
    def run_crack!(hash_id, facts)
      found = crack_record(hash_id)
      return { status: 'nomatch' } unless found

      entry, npc = found
      return { status: 'cracked' } if password_held_for?(npc['id'])

      klass = crack_class(entry, npc)
      return { status: 'nomatch' } unless klass

      resolved = CrackDifficulty.resolve(entry, npc)
      started = crack_started_for(hash_id)
      return crack_finish_wait!(hash_id, npc, resolved, started) if started

      return crack_strong_run!(hash_id) if klass == 'strong'

      pick = Array(facts).grep(String).uniq
      case klass
      when 'common'
        hit = true
      when 'guessable'
        wanted = Array(entry.dig('crack', 'facts')).map(&:to_s).uniq
        missing = (wanted - earned_fact_ids).size
        return { status: 'needMoreFacts', missingCount: missing } if missing.positive?

        hit = pick.sort == wanted.sort
      else # reused
        hit = crack_reused_hit?(npc)
      end

      if resolved[:salted]
        crack_store_state!('crackStarted', hash_id, { 'at' => server_now, 'hit' => hit })
        save!
        return { status: 'running', readyInSeconds: resolved[:crack_seconds] }
      end

      return { status: 'nomatch' } unless hit

      crack_grant!(npc, hash_id, batch: true)
    end

    private

    # [entry, npc] for a hash record whose proof holds now, else nil.
    def crack_record(hash_id)
      return nil unless hash_id.is_a?(String) && !hash_id.empty?

      entry = CredentialModel.registry(scenario_data)[hash_id]
      return nil unless entry.is_a?(Hash) && entry['kind'] == 'hash' && credential_proof_holds?(hash_id, entry)

      npc = CredentialModel.account_npc(scenario_data, entry['account'])
      npc ? [entry, npc] : nil
    end

    # A strong password never yields: the first run says nomatch, later ones infeasible.
    def crack_strong_run!(hash_id)
      runs = crack_state_hash('crackRuns')
      count = [runs[hash_id].to_i + 1, STRONG_RUN_CAP].min
      crack_store_state!('crackRuns', hash_id, count)
      save!
      { status: count >= STRONG_RUN_CAP ? 'infeasible' : 'nomatch', runs: count }
    end

    # A post for a salted record whose run is stored: during the wait it answers running and reads
    # no pick; after it, the stored verdict (a hit grants that record alone, a miss clears the wait).
    def crack_finish_wait!(hash_id, npc, resolved, started)
      wait = resolved[:crack_seconds] || CrackDifficulty::DEFAULT_WAIT
      left = (started['at'].to_f + wait - server_now).ceil
      return { status: 'running', readyInSeconds: [left, 0].max } if left.positive?

      crack_clear_state!('crackStarted', hash_id)
      return crack_grant!(npc, hash_id, batch: false) if started['hit'] == true

      save!
      { status: 'nomatch' }
    end

    # Another account the player already holds the password of has an equal password.
    def crack_reused_hit?(npc)
      mine = npc.dig('creds', 'password')
      account_npcs.any? do |other|
        other['id'] != npc['id'] && other.dig('creds', 'password') == mine && password_held_for?(other['id'])
      end
    end

    # Grant this record's account and, for an unsalted run (batch), the account of every other held
    # unsalted hash record with an equal password. Saves.
    def crack_grant!(npc, hash_id, batch:)
      accounts = [npc['id']]
      if batch
        password = npc.dig('creds', 'password')
        CredentialModel.registry(scenario_data).each do |id, other|
          next if id == hash_id || !other.is_a?(Hash) || other['kind'] != 'hash'

          other_npc = CredentialModel.account_npc(scenario_data, other['account'])
          next unless other_npc && other_npc.dig('creds', 'password') == password
          next unless CrackDifficulty.resolve(other, other_npc)&.fetch(:salted) == false
          next unless credential_proof_holds?(id, other)

          accounts << other_npc['id']
        end
      end
      accounts = accounts.uniq
      list = Array(player_state['crackedAccounts']).grep(String)
      accounts.each { |a| list << a unless list.include?(a) }
      player_state['crackedAccounts'] = list.first(CRACK_STATE_CAP)
      save!
      { status: 'cracked', accountId: npc['id'], credentialIds: accounts.map { |a| "#{a}.cracked" } }
    end

    def crack_state_hash(key)
      store = player_state[key]
      player_state[key] = {} unless store.is_a?(Hash)
      player_state[key]
    end

    # Writes one entry, dropping the oldest when a new key would pass the 64-entry bound.
    def crack_store_state!(key, id, value)
      store = crack_state_hash(key)
      store.delete(store.keys.first) if !store.key?(id) && store.size >= CRACK_STATE_CAP
      store[id] = value
    end

    def crack_clear_state!(key, id)
      crack_state_hash(key).delete(id)
    end

    def crack_started_for(id)
      store = player_state['crackStarted']
      row = store.is_a?(Hash) ? store[id] : nil
      row.is_a?(Hash) && row['at'].is_a?(Numeric) ? row : nil
    end

    def crack_token_key
      Rails.application.key_generator.generate_key('break_escape_crack_token')
    end
  end
end
