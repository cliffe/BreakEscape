# frozen_string_literal: true

require_relative 'access_identities' unless defined?(BreakEscape::AccessIdentities)
require_relative 'access_work' unless defined?(BreakEscape::AccessWork)

module BreakEscape
  # The owner claim (POST /login with claim: "owner", ACCESS_MODEL_PLAN.md section 6) is a client
  # claim: the server cannot see NPC positions or the seeded screen roll. User decision q78: it is
  # best effort where it only saves the student time, but where honest play can never leave the
  # owner's session open the server refuses it. This module answers the "can the owner ever
  # leave?" half of that from scenario data alone, statically, for the server and the validator.
  #
  # It mirrors what makes npc-needs.js emit npc_left_post (a job whose target is not the NPC's
  # own needsHome) and what workstation-state.js counts as a leave (also a knock-out of a tracked
  # owner). Every test leans towards "can leave": a route that might exist counts, so a claim is
  # never refused where honest play could produce an open screen.
  #
  # Plain Ruby with no Rails methods, as AccessIdentities and AccessWork are.
  module OwnerClaim
    module_function

    # The first way honest play can make this owner leave their post, as a short label, or nil
    # when nothing ever does. Labels: "knock_out", "answers_phones", "prints",
    # "need:<name>:<object id>", "fails:<need>" (a judged need that can fail, so checks and
    # workarounds walk), "interest:<tag>".
    def leave_route(data, owner)
      return nil unless data.is_a?(Hash) && owner.is_a?(Hash)

      # workstation-state.js onKnockedOut: a knock-out counts as a leave for a tracked owner.
      # The punch is refused only by disableAttacks (player-combat.js) or koImmune (npc-hostile.js).
      return 'knock_out' unless data['disableAttacks'] == true || owner['koImmune'] == true
      # A colleague's desk phone (npc-needs.js _claimAnswerer): a walk to it is a real leave
      return 'answers_phones' if owner['answersPhones'] == true

      AccessWork.with_index(data) do
        objects = scenario_objects(data)
        # A print errand (slice 17) fetches a printout: any printer hook may give one
        return 'prints' if key_anywhere?(data, 'revealOutput')

        home_id = owner['needsHome'].is_a?(String) ? owner['needsHome'] : nil
        home_room = home_room(data, owner, home_id)
        needs = owner['needs'].is_a?(Hash) ? owner['needs'] : {}
        needs.each do |name, raw|
          next unless valid_need?(raw)

          judged = AccessWork.judged?(data, owner, name)
          # A judged use that fails queues a check visit or a workaround (npc-needs.js
          # _countFailure, npc-workarounds.js), and either can walk
          return "fails:#{name}" if judged && AccessWork.can_fail?(data, owner, name)

          found = objects.find do |e|
            o = e[:obj]
            next false if home_id && o['id'] == home_id   # a use of the own post never leaves it
            next false unless AccessWork.satisfies?(data, o, name)
            # _otherDesk: a judged need never uses somebody else's desk (a borrow comes from a
            # workaround, which needs a failure, handled above)
            next false if judged && AccessWork.desk?(data, o)

            permitted?(data, owner, o, e[:room], home_room)
          end
          return "need:#{name}:#{found[:obj]['id']}" if found
        end

        interests = owner['interests'].is_a?(Hash) ? owner['interests'] : {}
        interests.each do |tag, raw|
          next unless valid_interest?(raw)

          # _carryCandidate: an item with the tag, and somewhere that accepts it
          item = objects.any? { |e| e[:obj]['needsTag'] == tag }
          target = objects.any? { |e| Array(AccessWork.affordance(data, e[:obj])&.dig('accepts')).include?(tag) }
          return "interest:#{tag}" if item && target
        end
      end
      nil
    end

    def never_leaves?(data, owner)
      leave_route(data, owner).nil?
    end

    # normaliseNeed: decayPerMin and urgentAt both read as numbers above 0
    def valid_need?(raw)
      raw.is_a?(Hash) && AccessIdentities.positive_number?(raw['decayPerMin']) &&
        AccessIdentities.positive_number?(raw['urgentAt'])
    end

    # normaliseInterest: a number, or { weight }, above 0
    def valid_interest?(raw)
      return raw.positive? if raw.is_a?(Numeric)

      raw.is_a?(Hash) && AccessIdentities.positive_number?(raw['weight'])
    end

    # Every hash with a non-empty string id anywhere in the scenario, with the room it sits in
    # (nil outside rooms: start inventory, items given later). Wider than the needs system's
    # loaded room objects on purpose: an item the player or a script can drop counts too.
    def scenario_objects(data)
      out = []
      seen = {}.compare_by_identity
      add = lambda do |node, room_id|
        case node
        when Array then node.each { |n| add.call(n, room_id) }
        when Hash
          next if seen[node]

          seen[node] = true
          out << { obj: node, room: room_id } if node['id'].is_a?(String) && !node['id'].empty?
          node.each_value { |v| add.call(v, room_id) }
        end
      end
      rooms = data['rooms'].is_a?(Hash) ? data['rooms'] : {}
      rooms.each { |room_id, room| add.call(room, room_id) }
      data.each { |k, v| add.call(v, nil) unless k == 'rooms' }
      out
    end

    def key_anywhere?(node, key)
      case node
      when Hash then node.key?(key) || node.each_value.any? { |v| key_anywhere?(v, key) }
      when Array then node.any? { |v| key_anywhere?(v, key) }
      else false
      end
    end

    # npc-needs.js _homeRoom: needsHome { room }, else the needsHome object's room, else the
    # NPC's own room
    def home_room(data, owner, home_id)
      h = owner['needsHome']
      return h['room'] if h.is_a?(Hash) && h['room'].is_a?(String)

      if home_id
        entry = AccessWork.object_index(data)[home_id]
        return entry[:room_id] if entry
      end
      AccessIdentities.room_npcs(data).find { |e| e[:npc].equal?(owner) || e[:npc]['id'] == owner['id'] }&.dig(:room)
    end

    # _permitted(s, o, use = true): the room leash, then a private affordance's owners
    def permitted?(data, owner, obj, room_id, home_room)
      return false if room_forbidden?(data, owner, room_id, home_room)

      aff = AccessWork.affordance(data, obj)
      return true unless aff.is_a?(Hash) && aff['private'] == true

      owners_of(data, obj, aff).include?(owner['id'])
    end

    # _roomForbidden: needsRooms (allow), needsAvoidRooms (deny) and the room's needsPrivateTo;
    # the home room never is. An object outside any room is never forbidden here.
    def room_forbidden?(data, owner, room_id, home_room)
      return false if room_id.nil? || room_id == home_room

      allow = room_list(owner['needsRooms'])
      deny = room_list(owner['needsAvoidRooms'])
      out = (!allow.nil? || deny&.any?) && ((allow && !allow.include?(room_id)) || Array(deny).include?(room_id))
      unless out
        priv = data.dig('rooms', room_id, 'needsPrivateTo') if data['rooms'].is_a?(Hash) && data['rooms'][room_id].is_a?(Hash)
        out = priv.is_a?(Array) && !priv.include?(owner['id'])
      end
      out
    end

    def room_list(value)
      value.is_a?(Array) ? value.select { |r| r.is_a?(String) && !r.empty? } : nil
    end

    # _owners: affordance.owners, else screenOwner, else the NPCs whose needsHome is the object
    # (every one of them, where the client takes the first: wider, so never a wrongful refusal)
    def owners_of(data, obj, aff)
      return aff['owners'] if aff['owners'].is_a?(Array)
      return [obj['screenOwner']] if obj['screenOwner'].is_a?(String) && !obj['screenOwner'].empty?

      AccessIdentities.room_npcs(data).filter_map { |e| e[:npc]['id'] if e[:npc]['needsHome'] == obj['id'] }
    end
  end
end
