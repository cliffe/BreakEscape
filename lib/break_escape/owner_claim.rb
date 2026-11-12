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
    # workarounds walk), "interest:<tag>". The label names the first route found, not
    # necessarily the one play uses most (a need's source elsewhere counts even where the own
    # needsHome usually serves it).
    #
    # pc: the PC the claim is for. A knock-out leave carries no time-away estimate, so it counts
    # only where decideLocked can leave this PC open without one (open_without_estimate?). With
    # no PC given the knock-out counts, the side that never refuses an honest claim.
    def leave_route(data, owner, pc = nil)
      return nil unless data.is_a?(Hash) && owner.is_a?(Hash)

      # workstation-state.js onKnockedOut: a knock-out counts as a leave for a tracked owner.
      # The punch is refused only by disableAttacks (player-combat.js) or koImmune (npc-hostile.js).
      can_ko = data['disableAttacks'] != true && owner['koImmune'] != true
      return 'knock_out' if can_ko && (pc.nil? || open_without_estimate?(pc, owner))

      AccessWork.with_index(data) do
        objects = scenario_objects(data)
        # A colleague's desk phone (npc-needs.js _claimAnswerer): an answersPhones NPC walks only
        # to a ringing phone whose phoneOwner is somebody else
        return 'answers_phones' if owner['answersPhones'] == true && objects.any? { |e| colleague_phone?(e[:obj], owner) }

        home_id = owner['needsHome'].is_a?(String) ? owner['needsHome'] : nil
        # A print errand (slice 17) carries an owned printout to the needsHome object
        return 'prints' if prints?(data, owner, objects, home_id)

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
          # (_permitted(s, o, false)). The item may be anywhere, since the player can drop one;
          # the accepting place is fixed, so the room leash applies to it.
          item = objects.any? { |e| e[:obj]['needsTag'] == tag }
          target = objects.any? do |e|
            Array(AccessWork.affordance(data, e[:obj])&.dig('accepts')).include?(tag) &&
              !room_forbidden?(data, owner, e[:room], home_room)
          end
          return "interest:#{tag}" if item && target
        end
      end
      nil
    end

    def never_leaves?(data, owner, pc = nil)
      leave_route(data, owner, pc).nil?
    end

    # decideLocked (workstation-state.js) with expectedAwayMs null, as for a knock-out: can this
    # leave find the PC open? The PC's numeric lockChance below 1 (0 opens, between 0 and 1 the
    # roll can), else its locksScreenOnLeave key set to false, else the owner's screenHabit with
    # a numeric lockChance below 1. A habit threshold (lockIfAwayOverSeconds) needs an estimate,
    # so it never opens this leave; a habit with no numeric lockChance locks.
    def open_without_estimate?(pc, owner)
      pc = {} unless pc.is_a?(Hash)
      chance = pc['lockChance']
      return chance < 1 if chance.is_a?(Numeric)
      return pc['locksScreenOnLeave'] == false if pc.key?('locksScreenOnLeave')

      habit = owner.is_a?(Hash) ? owner['screenHabit'] : nil
      return false unless habit.is_a?(Hash)

      raw = habit['lockChance']
      raw.is_a?(Numeric) && raw < 1
    end

    # An object somebody else answers to (phoneOwner set, and not this owner)
    def colleague_phone?(obj, owner)
      po = obj['phoneOwner']
      po.is_a?(String) && !po.empty? && po != owner['id']
    end

    # npc-needs.js: an owned print is fetched by an errand (_errandCandidate), a carry job to the
    # needsHome object, so needsHome must name an object. A print is owned when it comes from
    # (a) a print command: an event mapping on the owner's record whose needs.print names a
    # producer (control always owns it), or (b) the owner's own onUse hook with revealOutput on
    # an object one of their needs uses (only a need use prints, _completeJob), with a printHabit
    # (an unowned print is never fetched) and a hook chance that is not 0 or less.
    def prints?(data, owner, objects, home_id)
      return false unless home_id && objects.any? { |e| e[:obj]['id'] == home_id }
      return true if print_command?(owner)

      habit = owner['printHabit']
      return false unless habit.is_a?(Hash) || habit.is_a?(Array)

      hooks = owner['onUse'].is_a?(Hash) ? owner['onUse'] : {}
      needs = owner['needs'].is_a?(Hash) ? owner['needs'].select { |_, raw| valid_need?(raw) }.keys : []
      hooks.any? do |target_id, hook|
        next false unless hook.is_a?(Hash) && !printer_list(hook['revealOutput']).empty?
        if hook.key?('chance')
          c = AccessIdentities.js_number(hook['chance'])
          next false if c.finite? && c <= 0
        end
        target = objects.find { |e| e[:obj]['id'] == target_id }
        target && needs.any? { |n| AccessWork.satisfies?(data, target[:obj], n) }
      end
    end

    # An event mapping on the owner (eventMappings as a list or a pattern map, or the singular
    # eventMapping that npc-manager.js normalises) whose needs is { print: <producer or spec> }
    def print_command?(owner)
      raw = owner['eventMappings'] || owner['eventMapping']
      maps = raw.is_a?(Hash) ? raw.values : Array(raw)
      maps.any? do |m|
        cmd = m.is_a?(Hash) ? m['needs'] : nil
        next false unless cmd.is_a?(Hash) && cmd.key?('print')

        spec = cmd['print']
        producer = spec.is_a?(String) || spec.is_a?(Array) ? spec : (spec.is_a?(Hash) ? spec['producer'] : nil)
        !printer_list(producer).empty?
      end
    end

    # printerList: a non-empty string, or the non-empty strings of a list
    def printer_list(value)
      return (value.empty? ? [] : [value]) if value.is_a?(String)

      value.is_a?(Array) ? value.select { |x| x.is_a?(String) && !x.empty? } : []
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
