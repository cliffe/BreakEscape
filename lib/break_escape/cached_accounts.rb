# frozen_string_literal: true

require_relative 'access_identities' unless defined?(BreakEscape::AccessIdentities)
require_relative 'credential_model' unless defined?(BreakEscape::CredentialModel)

module BreakEscape
  # S5b: the accounts a sign-in PC remembers (`cachedAccounts`), as pure readers of the authored
  # scenario. Plain Ruby, no Rails, so the server, the validator and the graph can agree. Nothing
  # here reads or writes game state; the server-only state keys are handled by the model concern.
  module CachedAccounts
    module_function

    MAX_CANDIDATES = 8
    AFTER_VALUES = [nil, 'borrow'].freeze
    PAIR_SEPARATOR = '|'

    # The declared cached accounts of a sign-in PC, in authored order: up to MAX_CANDIDATES
    # `{ 'npc' => id, 'after' => nil | 'borrow' }`. A malformed list, an entry that is not a Hash with
    # a usable npc id, an unknown `after` or a repeated npc is ignored; a PC that is not a sign-in PC
    # holds none.
    def candidates(pc)
      return [] unless AccessIdentities.login_pc?(pc)

      list = pc['cachedAccounts']
      return [] unless list.is_a?(Array)

      seen = {}
      out = []
      list.first(MAX_CANDIDATES).each do |entry|
        next unless entry.is_a?(Hash)

        npc = entry['npc']
        next unless usable_id?(npc)

        after = entry['after']
        next unless AFTER_VALUES.include?(after)
        next if seen[npc]

        seen[npc] = true
        out << { 'npc' => npc, 'after' => after }
      end
      out
    end

    # The "<pcId>|<npcId>" pair string used by the server's `cachedAt` and `harvestedAccounts`, or nil
    # when either id is not a non-empty string without the separator.
    def pair(pc_id, npc_id)
      return nil unless usable_id?(pc_id) && usable_id?(npc_id)

      "#{pc_id}#{PAIR_SEPARATOR}#{npc_id}"
    end

    # The id of the one hash record that `proof: { harvested: pc_id }` ties to this account, or nil
    # when there is none or more than one (the validator wants exactly one).
    def hash_record_id(scenario, pc_id, npc_id)
      return nil unless usable_id?(pc_id) && usable_id?(npc_id)

      ids = CredentialModel.registry(scenario).select do |_id, entry|
        entry['kind'] == 'hash' && entry['account'] == npc_id &&
          CredentialModel.proof_kind(entry['proof']) == 'harvested' && entry.dig('proof', 'harvested') == pc_id
      end.keys
      ids.length == 1 ? ids.first : nil
    end

    # Whether the PC declares this account as cached only after its holder has borrowed the desk.
    def borrow_candidate?(pc, npc_id)
      candidates(pc).any? { |c| c['npc'] == npc_id && c['after'] == 'borrow' }
    end

    def usable_id?(value)
      value.is_a?(String) && !value.empty? && !value.include?(PAIR_SEPARATOR)
    end
  end
end
