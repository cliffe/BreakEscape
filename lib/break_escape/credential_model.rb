# frozen_string_literal: true

require 'set'
require_relative 'access_identities' unless defined?(BreakEscape::AccessIdentities)
require_relative 'declared_grants' unless defined?(BreakEscape::DeclaredGrants)

module BreakEscape
  # The credential keyring model (docs/achitechture/CREDENTIAL_KEYRING_PLAN.md, sections 3 and 6),
  # read from the authored scenario. Plain Ruby, no ActiveSupport, so scripts/validate_scenario.rb
  # and the dungeon-graph generator can require_relative it and agree with the server, as
  # CaptureModel is shared.
  #
  # A credential is anything the player holds that a PC accepts as proof that they are a particular
  # account. The registry is a top-level `credentials` map, server-only (stripped from the
  # bootstrap). Every entry's proof reads state the server already writes.
  module CredentialModel
    module_function

    # The kind catalogue (section 3.6). `built` says which kinds this phase ships; a kind not built
    # is refused by the validator. K5 built `token` (section 10); phase 3 builds hash.
    KINDS = {
      'password'         => { built: true,  connects: false },
      'saved_connection' => { built: true,  connects: true, routes: %w[foothold from], honours_lockout: true, password: true },
      'assist_invite'    => { built: true,  connects: true, routes: %w[relay],         honours_lockout: false },
      'token'            => { built: true,  connects: true, routes: %w[proof_foothold], honours_lockout: false },
      'hash'             => { built: true,  connects: false } # S7: a hash record, cracked offline
    }.freeze

    # The kinds a PC accepts when its policy names no `accepts` list.
    DEFAULT_ACCEPTS = %w[password saved_connection assist_invite token].freeze

    # A token's life in minutes is 1..TOKEN_MAX_MIN (section 10).
    TOKEN_MAX_MIN = 240

    # Exactly one of these keys names a proof (section 3.5).
    PROOF_KINDS = %w[session planted dropped held foothold technique_card harvested].freeze

    # Registry caps (section 3.3).
    MAX_ENTRIES = 64
    ID_PATTERN = /\A[a-z][a-z0-9_]{0,63}\z/.freeze

    def present_string?(value)
      value.is_a?(String) && !value.strip.empty?
    end

    def kind_built?(kind)
      meta = KINDS[kind]
      meta.is_a?(Hash) && meta[:built] == true
    end

    def connecting?(kind)
      meta = KINDS[kind]
      meta.is_a?(Hash) && meta[:connects] == true
    end

    def honours_lockout?(kind)
      meta = KINDS[kind]
      meta.is_a?(Hash) && meta[:honours_lockout] == true
    end

    # The proof's kind (section 3.5) or nil for a malformed proof (not exactly one known key).
    def proof_kind(proof)
      return nil unless proof.is_a?(Hash)

      kinds = PROOF_KINDS.select { |k| present_string?(proof[k]) }
      kinds.length == 1 ? kinds.first : nil
    end

    # A token entry's life in whole minutes (Integer 1..TOKEN_MAX_MIN), or nil when absent or
    # invalid. A nil answer means the token is treated as expired (fail closed).
    def token_expires_min(entry)
      value = entry.is_a?(Hash) ? entry['expiresMin'] : nil
      return nil unless value.is_a?(Integer)
      return nil unless value >= 1 && value <= TOKEN_MAX_MIN

      value
    end

    # The bare foothold id a token's proof names (`proof: { foothold: id }`), or nil when the proof
    # is not exactly one foothold key. The foothold id carries its prefix (jack_, wifi_, implant_).
    def token_proof_foothold(entry)
      proof = entry.is_a?(Hash) ? entry['proof'] : nil
      return nil unless proof_kind(proof) == 'foothold'

      proof['foothold'].to_s
    end

    # The registry: the first MAX_ENTRIES entries by sorted id whose value is a Hash. Server reads
    # only these, so an over-long map cannot smuggle extra entries in. The schema and the validator
    # (check_credentials) enforce the shape; this reader is permissive by design.
    def registry(scenario)
      creds = scenario.is_a?(Hash) ? scenario['credentials'] : nil
      return {} unless creds.is_a?(Hash)

      out = {}
      creds.keys.sort.first(MAX_ENTRIES).each do |id|
        entry = creds[id]
        out[id] = entry if entry.is_a?(Hash)
      end
      out
    end

    # The kinds a policy accepts, the authored `accepts` list or DEFAULT_ACCEPTS when absent.
    def accepts(policy)
      list = policy.is_a?(Hash) ? policy['accepts'] : nil
      return list.select { |k| k.is_a?(String) } if list.is_a?(Array)

      DEFAULT_ACCEPTS
    end

    # Whether a policy accepts a kind. password is always accepted (section 3.2): a PC that refused
    # typed passwords would be unusable, so a list without it still takes one (the validator warns).
    def accepts?(policy, kind)
      return true if kind == 'password'

      accepts(policy).include?(kind)
    end

    # { global => [credId, ...] } for every assist_invite entry with an `endsOnGlobal` (section 7.1).
    # Bounded by the registry (MAX_ENTRIES).
    def end_globals(scenario)
      out = {}
      registry(scenario).each do |id, entry|
        next unless entry['kind'] == 'assist_invite'

        global = entry['endsOnGlobal']
        next unless present_string?(global)

        (out[global] ||= []) << id
      end
      out
    end

    # Every room NPC (across rooms.*.npcs).
    def room_npcs(scenario)
      rooms = scenario.is_a?(Hash) ? scenario['rooms'] : nil
      return [] unless rooms.is_a?(Hash)

      rooms.values.flat_map do |room|
        room.is_a?(Hash) && room['npcs'].is_a?(Array) ? room['npcs'].select { |n| n.is_a?(Hash) } : []
      end
    end

    # The account holder NPC with this id, or nil (an account is a room NPC with creds, section 3.1).
    def account_npc(scenario, npc_id)
      return nil unless present_string?(npc_id)

      room_npcs(scenario).find { |npc| npc['id'].to_s == npc_id.to_s && AccessIdentities.account?(npc) }
    end

    # Every sign-in PC object (lockType == 'login'), with its id. Walks room objects and their
    # contents, as AccessIdentities.room_objects does.
    def sign_in_pcs(scenario)
      AccessIdentities.room_objects(scenario).map { |entry| entry[:object] }.select { |obj| AccessIdentities.login_pc?(obj) }
    end

    def sign_in_pc(scenario, pc_id)
      return nil unless present_string?(pc_id)

      sign_in_pcs(scenario).find { |pc| pc['id'].to_s == pc_id.to_s }
    end

    # The resolved policy Hash for a PC (its own `policy`, else defaultPolicy), or nil.
    def policy_for(scenario, pc)
      policies = scenario.is_a?(Hash) && scenario['policies'].is_a?(Hash) ? scenario['policies'] : {}
      name = pc.is_a?(Hash) && present_string?(pc['policy']) ? pc['policy'] : scenario['defaultPolicy']
      name.is_a?(String) ? policies[name] : nil
    end

    # The sign-in PCs that would accept a credential: policy accepts the kind, the access list admits
    # the account, and (for a connecting kind) the PC is its connectsTo. Used by the validator's
    # "no machine accepts" warning. account is resolved from the entry.
    def pcs_accepting(scenario, id)
      entry = registry(scenario)[id]
      return [] unless entry.is_a?(Hash)

      kind = entry['kind']
      npc = account_npc(scenario, entry['account'])
      return [] unless npc

      candidates =
        if connecting?(kind)
          pc = sign_in_pc(scenario, entry['connectsTo'])
          pc ? [pc] : []
        else
          sign_in_pcs(scenario)
        end

      candidates.select do |pc|
        accepts?(policy_for(scenario, pc), kind) && pc_admits_account?(pc, npc)
      end
    end

    # Whether a sign-in PC's access list admits an account. No access list admits every account
    # (AccessIdentities.acl_admits? rule, with an absent list as open), and (S5c) the account's
    # kind allows it at this PC.
    def pc_admits_account?(pc, npc)
      # S5c: the account's kind is judged first; kinds only narrow, the access list is judged after
      return false unless AccessIdentities.account_kind_admits?(pc, npc)

      acl = pc.is_a?(Hash) ? pc['access'] : nil
      return true if acl.nil?

      AccessIdentities.acl_admits?(acl, npc)
    end

    # The authored definition of a scenario item by id, from the `held` scope of section 3.5: every
    # sign-in PC's contents and account profiles' contents, every resource's contents, room objects,
    # container contents, NPC and flag-station itemsHeld and flag rewards, startItemsInInventory and
    # declared-grant items. A static walk with no session. Returns the first item-shaped Hash whose
    # id matches, or nil. The held proof compares type and the stored `credential` against it, so a
    # broad walk cannot be exploited: a definition that matches only by id still fails the type and
    # credential checks unless it is the scenario's own item.
    def item_definition(scenario, item_id)
      return nil unless present_string?(item_id)

      target = item_id.to_s
      found = nil
      visit = lambda do |item|
        return if found
        return unless item.is_a?(Hash)

        if present_string?(item['type']) && item['id'].to_s == target
          found = item
          return
        end
        Array(item['contents']).each { |c| visit.call(c) }
        Array(item['itemsHeld']).each { |c| visit.call(c) }
      end

      # The whole scenario (room objects and their contents, NPC itemsHeld, account profiles,
      # resources, flag rewards, timers, etc.): any item-shaped hash with an id.
      walk = lambda do |node|
        return if found

        case node
        when Hash
          if present_string?(node['type']) && node['id'].to_s == target && (node.key?('name') || node.key?('takeable') || node.key?('readable') || node.key?('credential'))
            found = node
            return
          end
          node.each_value { |v| walk.call(v) }
        when Array
          node.each { |v| walk.call(v) }
        end
      end
      walk.call(scenario)
      return found if found

      Array(scenario.is_a?(Hash) ? scenario['startItemsInInventory'] : nil).each { |i| visit.call(i) }
      return found if found

      DeclaredGrants.for(scenario).each { |grant| visit.call(grant['item']) }
      found
    end

    # Whether a held item reaches the player as a gift (K3d's "Given" source tag): it sits, at any
    # depth, in the start inventory, a declared grant's item, or an `itemsHeld` list (an NPC's or
    # a flag station's). Any other placement (a room, a container, a desktop, a share) is found.
    def held_item_given?(scenario, item_id)
      return false unless present_string?(item_id) && scenario.is_a?(Hash)

      target = item_id.to_s
      has_item = lambda do |node|
        case node
        when Hash then (present_string?(node['type']) && node['id'].to_s == target) || node.each_value.any? { |v| has_item.call(v) }
        when Array then node.any? { |v| has_item.call(v) }
        else false
        end
      end
      return true if has_item.call(scenario['startItemsInInventory'])
      return true if DeclaredGrants.for(scenario).any? { |grant| has_item.call(grant['item']) }

      in_held = false
      walk = lambda do |node|
        return if in_held

        case node
        when Hash
          if node['itemsHeld'].is_a?(Array) && has_item.call(node['itemsHeld'])
            in_held = true
            return
          end
          node.each_value { |v| walk.call(v) }
        when Array then node.each { |v| walk.call(v) }
        end
      end
      walk.call(scenario)
      in_held
    end
  end
end
