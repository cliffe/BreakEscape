# frozen_string_literal: true

require 'openssl'

module BreakEscape
  # Hash records and the offline cracker, the keyring half (S7 unit 08, feature A21): the token a
  # hash row shows, the password class of a record, its status and the row itself. Reads only; the
  # run and the grant are another unit's. See docs/agents/ops_core_build/S7_BUILD_BRIEF.md, section 4.
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

    private

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
