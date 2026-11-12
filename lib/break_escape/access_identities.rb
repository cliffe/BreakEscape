# frozen_string_literal: true

require 'set'

module BreakEscape
  # Access model identities (docs/achitechture/ACCESS_MODEL_PLAN.md, sections 3 and 4): which
  # NPC cards and accounts a scenario defines, and which locks and sign-in PCs each one opens.
  #
  # The rules mirror the server's (BreakEscape::Game.identity_roles, acl_admits?,
  # needs_tracked?, account_holder?, npc_card, normalise_username, login_pc?), read from the
  # authored scenario, so the validator and the dungeon-graph generator agree with the server
  # on who an identity is and what it may pass.
  #
  # Plain Ruby, no ActiveSupport, so scripts/validate_scenario.rb and
  # scripts/generate_dungeon_graph.rb can require_relative it.
  module AccessIdentities
    module_function

    # [{ room:, npc:, path: }] for every rooms.<id>.npcs[] record, the only NPCs allowed
    # role and creds (section 3).
    def room_npcs(scenario)
      rooms = scenario.is_a?(Hash) ? scenario['rooms'] : nil
      return [] unless rooms.is_a?(Hash)

      rooms.flat_map do |room_id, room|
        next [] unless room.is_a?(Hash) && room['npcs'].is_a?(Array)

        room['npcs'].each_with_index.filter_map do |npc, idx|
          { room: room_id, npc: npc, path: "rooms/#{room_id}/npcs[#{idx}]" } if npc.is_a?(Hash)
        end
      end
    end

    # The card an NPC carries: creds.card, else a legacy rfidCard.
    def npc_card(npc)
      return nil unless npc.is_a?(Hash)

      card = npc['creds'].is_a?(Hash) ? npc['creds']['card'] : nil
      card = npc['rfidCard'] unless card.is_a?(Hash)
      card.is_a?(Hash) ? card : nil
    end

    def card_id_of(card)
      id = card.is_a?(Hash) ? card['card_id'] : nil
      id.nil? || id.to_s.empty? ? nil : id.to_s
    end

    # An NPC has an account when creds.username is a non-empty string.
    def account?(npc)
      creds = npc.is_a?(Hash) ? npc['creds'] : nil
      creds.is_a?(Hash) && creds['username'].is_a?(String) && !creds['username'].strip.empty?
    end

    def normalise_username(value)
      value.to_s.strip.downcase[0, 64]
    end

    # Authored role(s) plus the implicit `staff` of an NPC with creds or a card, unless
    # "staff": false.
    def identity_roles(npc)
      return [] unless npc.is_a?(Hash)

      roles = Array(npc['role']).select { |role| role.is_a?(String) && !role.empty? }
      roles += ['staff'] if (npc['creds'].is_a?(Hash) || npc_card(npc)) && npc['staff'] != false
      roles.uniq
    end

    def acl_admits?(acl, npc)
      return false unless acl.is_a?(Hash) && npc.is_a?(Hash)
      return true if npc['id'] && !npc['id'].to_s.empty? && Array(acl['people']).map(&:to_s).include?(npc['id'].to_s)

      (Array(acl['roles']).map(&:to_s) & identity_roles(npc)).any?
    end

    # The needs system's register rule: a need with decayPerMin and urgentAt above 0, or an
    # interest that is a number above 0 or an object whose weight is above 0.
    def needs_tracked?(npc)
      return false unless npc.is_a?(Hash)

      needs = npc['needs']
      if needs.is_a?(Hash) && needs.values.any? { |n| n.is_a?(Hash) && js_positive?(n['decayPerMin']) && js_positive?(n['urgentAt']) }
        return true
      end

      interests = npc['interests']
      interests.is_a?(Hash) && interests.values.any? do |interest|
        interest.is_a?(Hash) ? js_positive?(interest['weight']) : (interest.is_a?(Numeric) && interest.positive?)
      end
    end

    # Number(value) > 0, as normaliseNeed and normaliseInterest read decayPerMin, urgentAt and
    # weight. positive_number? or a JavaScript reading of true (1) and of a one-element array
    # (Number([5]) is 5), so it is never narrower than positive_number?.
    def js_positive?(value)
      return true if positive_number?(value)

      n = value.is_a?(Array) ? js_array_number(value) : js_number(value)
      n.finite? && n.positive?
    end

    # Number(array): Number(String(array)). An empty array is 0; one element reads as that
    # element's string (null is empty, so 0; true is "true", so NaN); more than one has a comma,
    # so NaN.
    def js_array_number(array)
      return 0.0 if array.empty?
      return Float::NAN unless array.size == 1

      el = array.first
      case el
      when nil then 0.0
      when Numeric, String then js_number(el.to_s)
      when Array then js_array_number(el)
      else Float::NAN
      end
    end

    def positive_number?(value)
      number = value if value.is_a?(Numeric)
      number = Float(value.strip, exception: false) if value.is_a?(String)
      !number.nil? && number.finite? && number.positive?
    end

    def login_pc?(obj)
      obj.is_a?(Hash) && obj['lockType'] == 'login'
    end

    # The workstation-state.js isWorkstation rule, plus every sign-in PC (section 5.2).
    def workstation?(obj)
      return false unless obj.is_a?(Hash) && obj['id'].is_a?(String) && !obj['id'].empty?

      login_pc?(obj) || obj['workstation'] == true || obj.key?('locksScreenOnLeave') || obj.key?('lockChance')
    end

    # [{ object:, room:, path: }] for every object under rooms.<id>.objects, recursing into
    # contents, and every item an NPC holds (recursing likewise).
    def room_objects(scenario)
      out = []
      walk = lambda do |list, room_id, path|
        next unless list.is_a?(Array)

        list.each_with_index do |obj, idx|
          next unless obj.is_a?(Hash)

          here = "#{path}[#{idx}]"
          out << { object: obj, room: room_id, path: here }
          walk.call(obj['contents'], room_id, "#{here}/contents")
        end
      end
      rooms = scenario.is_a?(Hash) ? scenario['rooms'] : nil
      return out unless rooms.is_a?(Hash)

      rooms.each do |room_id, room|
        next unless room.is_a?(Hash)

        walk.call(room['objects'], room_id, "rooms/#{room_id}/objects")
        next unless room['npcs'].is_a?(Array)

        room['npcs'].each_with_index do |npc, i|
          walk.call(npc['itemsHeld'], room_id, "rooms/#{room_id}/npcs[#{i}]/itemsHeld") if npc.is_a?(Hash)
        end
      end
      out
    end

    # Does every leave lock this screen? decideLocked's order (workstation-state.js) without
    # the policy: the PC's numeric lockChance, else its locksScreenOnLeave key, else the
    # owner's screenHabit (slice 9.1, 5.2). A habit that is not an object, or no habit, locks;
    # a habit with a numeric lockIfAwayOverSeconds can leave it open on a short trip; else the
    # habit's numeric lockChance must be 1 or more; a habit with neither locks. The rule of
    # ValidateNpcNeeds.habit_leaves_open?, negated, wherever the PC sets no field.
    def screen_always_locks?(pc, owner)
      pc = {} unless pc.is_a?(Hash)
      chance = pc['lockChance']
      return chance >= 1 if chance.is_a?(Numeric)
      return pc['locksScreenOnLeave'] != false if pc.key?('locksScreenOnLeave')

      habit = owner.is_a?(Hash) ? owner['screenHabit'] : nil
      return true unless habit.is_a?(Hash)
      # decideLocked: a trip expected to last at most lockIfAwayOverSeconds stays open, the value
      # read with Number() (so "20" counts). Owner claim q78: a negative threshold can never be
      # met (an expected absence is never below 0), so lockChance alone decides there.
      over = js_number(habit['lockIfAwayOverSeconds']) if habit.key?('lockIfAwayOverSeconds')
      return false if over&.finite? && over >= 0
      return habit['lockChance'] >= 1 if habit['lockChance'].is_a?(Numeric)

      true
    end

    # JavaScript's Number(x) for a JSON value: nil, "" and false are 0, true is 1, a numeric
    # string its number; anything else NaN. Known gaps, which no scenario authors: an array is NaN
    # here where Number([]) is 0 and Number([n]) is n, and Float() reads "1_000" as 1000 where
    # Number() gives NaN. js_positive? (needs_tracked?, OwnerClaim) reads arrays and true as
    # Number() does.
    def js_number(value)
      case value
      when Numeric then value.to_f
      when nil, false then 0.0
      when true then 1.0
      when String
        s = value.strip
        s.empty? ? 0.0 : Float(s, exception: false) || Float::NAN
      else Float::NAN
      end
    end

    def sign_in_pcs(scenario)
      room_objects(scenario).select { |entry| login_pc?(entry[:object]) }
    end

    # A workstation's owner id: screenOwner, else the room NPC whose needsHome names it.
    def owner_id(obj, scenario)
      return obj['screenOwner'] if obj['screenOwner'].is_a?(String) && !obj['screenOwner'].empty?

      found = room_npcs(scenario).find { |entry| entry[:npc]['needsHome'] == obj['id'] }
      found && found[:npc]['id']
    end

    # Every rfid lock and sign-in PC: [{ kind: 'door' | 'object' | 'login', id:, room:,
    # lock:, path: }]. A door is a locked room (the server reads the room's own fields).
    def locks(scenario)
      out = []
      rooms = scenario.is_a?(Hash) && scenario['rooms'].is_a?(Hash) ? scenario['rooms'] : {}
      rooms.each do |room_id, room|
        next unless room.is_a?(Hash) && room['lockType'] == 'rfid' && room['locked']

        out << { kind: 'door', id: room_id, room: room_id, lock: room, path: "rooms/#{room_id}" }
      end
      room_objects(scenario).each do |entry|
        obj = entry[:object]
        if login_pc?(obj)
          out << { kind: 'login', id: obj['id'], room: entry[:room], lock: obj, path: entry[:path] }
        elsif obj['lockType'] == 'rfid' && obj['locked']
          out << { kind: 'object', id: obj['id'], room: entry[:room], lock: obj, path: entry[:path] }
        end
      end
      out
    end

    # { card_id => { card:, holders: [{ room:, npc:, path: }] } } in scenario order.
    def cards(scenario)
      out = {}
      room_npcs(scenario).each do |entry|
        card = npc_card(entry[:npc])
        id = card_id_of(card)
        next unless id

        (out[id] ||= { card: card, holders: [] })[:holders] << entry
      end
      out
    end

    # Does a card (one card_id, carried by these holders) open an rfid lock: its id is in
    # requires, or any holder's identity passes access (section 4.1)?
    def card_opens?(lock, card_id, holders)
      return false unless lock.is_a?(Hash) && lock['lockType'] == 'rfid'
      return true if Array(lock['requires']).map(&:to_s).include?(card_id.to_s)

      lock['access'].is_a?(Hash) && holders.any? { |h| acl_admits?(lock['access'], h[:npc]) }
    end

    # Opened through access alone (not through requires).
    def card_opens_by_access?(lock, card_id, holders)
      card_opens?(lock, card_id, holders) && !Array(lock['requires']).map(&:to_s).include?(card_id.to_s)
    end

    # May an account sign in at this PC? No access list admits every account (section 5.2).
    def account_admitted?(pc, npc)
      return false unless account?(npc)

      pc['access'].is_a?(Hash) ? acl_admits?(pc['access'], npc) : true
    end

    # Identity reach (section 8, step 4):
    #   { cards: [{ card_id:, card:, holders:, opens: [lock entries] }],
    #     accounts: [{ npc:, room:, path:, opens: [login entries] }] }
    def reach(scenario)
      all_locks = locks(scenario)
      rfid = all_locks.reject { |l| l[:kind] == 'login' }
      pcs = all_locks.select { |l| l[:kind] == 'login' }
      card_reach = cards(scenario).map do |card_id, info|
        { card_id: card_id, card: info[:card], holders: info[:holders],
          opens: rfid.select { |l| card_opens?(l[:lock], card_id, info[:holders]) } }
      end
      account_reach = room_npcs(scenario).select { |e| account?(e[:npc]) }.map do |entry|
        entry.merge(opens: pcs.select { |l| account_admitted?(l[:lock], entry[:npc]) })
      end
      { cards: card_reach, accounts: account_reach }
    end

    # Whether the scenario uses any access model field, so tooling can leave other
    # scenarios' output unchanged.
    def uses_access_model?(scenario)
      return false unless scenario.is_a?(Hash)
      return true if %w[accountProfiles policies defaultPolicy].any? { |k| scenario.key?(k) }
      return true if room_npcs(scenario).any? { |e| e[:npc].key?('creds') || e[:npc].key?('role') }

      rooms = scenario['rooms'].is_a?(Hash) ? scenario['rooms'] : {}
      return true if rooms.values.any? { |r| r.is_a?(Hash) && r.key?('access') }

      room_objects(scenario).any? { |e| e[:object].key?('access') || login_pc?(e[:object]) }
    end
  end
end
