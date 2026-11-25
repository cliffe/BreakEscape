# frozen_string_literal: true

module BreakEscape
  # Second step on any lock (S8c, Rule D, and G4): reach of a carried object.
  #
  # An item the player can carry off (a start item, an NPC's held item, a declared grant, a
  # takeable room object) that has a lock or `contents` is a carrier. A request that names a
  # carrier, or anything inside one, is refused once the carrier has left the player and the
  # place the scenario put it. Nothing here writes state.
  module LockStepReach
    extend ActiveSupport::Concern

    # Ids of every top-level carried item (an id-less one is not covered) that has a lock or
    # `contents`, gated or not. Memoised per instance: the scenario is the game's snapshot.
    def carried_step_ids
      @carried_step_ids ||= Set.new(carried_step_chains.select { |_id, c| c['chain'].size == 1 }.keys)
    end

    # { id => { 'chain' => [carrier ids, outermost first, ending in id], 'home' => home, 'room' => room_id
    # or nil } } for every top-level carrier and every container with a lock or `contents`
    # nested inside one. `home` is the OUTERMOST carrier's: 'room' (a takeable object listed
    # directly in the room), 'nested' (a takeable inside another object's contents), 'npc',
    # 'start' or 'grant'.
    def carried_step_chains
      @carried_step_chains ||= build_carried_step_chains
    end

    # True when nothing at or above `object` (path: the containers above it, outermost first) is
    # a carrier the player no longer has within reach; otherwise the deepest carrier chain is
    # walked: (1) held, or dropped in a room the player may enter, innermost first; (2) still in
    # its authored place, which only a `room` or `nested` home can be.
    def carried_step_reachable?(object, path)
      return true unless object.is_a?(Hash)

      links = (Array(path) + [object]).map { |o| o.is_a?(Hash) && o['id'].is_a?(String) ? o['id'] : nil }
      return true unless links.any? { |id| id && carried_step_ids.include?(id) }

      deepest = links.reverse.find { |id| id && carried_step_chains.key?(id) }
      chain = carried_step_chains.dig(deepest, 'chain') || []
      return false if chain.empty?

      # Leg 1: held, or a dropped copy in a room that is open
      return true if chain.reverse.any? { |id| carried_step_held?(id) || carried_step_dropped?(id) }

      # Leg 2: still where the scenario put it
      %w[room nested].include?(carried_step_chains.dig(chain.first, 'home'))
    end

    # True when a gated object (the object itself, or a container above it on `path`) sits in a
    # room the player has not opened: such a thing is refused as an invented id is, so a
    # hand-built request neither opens it nor tells it from one that does not exist. Only a
    # lock authored in a room counts; a carried one is judged by carried_step_reachable?.
    def step_room_unreached?(object, path)
      return false if second_step_ids.empty?

      gated = (Array(path) + [object]).find do |o|
        o.is_a?(Hash) && o['id'].is_a?(String) && second_step_ids.include?(o['id'])
      end
      return false unless gated

      home = step_object_homes[gated['id']]
      # A route room the player slipped into is not unreached: the route-room refusal answers it
      home.present? && !room_unlocked?(home) && !in_npc_route_room?(home)
    end

    private

    # { gated object id => the room it is authored in } for the objects listed in a room
    def step_object_homes
      @step_object_homes ||= BreakEscape::LockStepModel.each_lock_step(scenario_data).each_with_object({}) do |e, homes|
        homes[e[:id]] ||= e[:room] if e[:kind] == :object && e[:id] && e[:home] == :room
      end
    end

    def carried_step_lockish?(item)
      return false unless item.is_a?(Hash)

      item['locked'] == true || item['lockType'].present? ||
        (item['contents'].is_a?(Array) && !item['contents'].empty?)
    end

    def build_carried_step_chains
      chains = {}
      @carried_step_items = {}
      add = lambda do |item, home, room, outer|
        next unless item.is_a?(Hash)

        id = item['id']
        id = nil unless id.is_a?(String) && !id.empty?
        mine = outer
        if id && carried_step_lockish?(item)
          mine = (outer || []) + [id]
          chains[id] ||= { 'chain' => mine, 'home' => home, 'room' => room }
          @carried_step_items[id] ||= item
        end
        Array(item['contents']).each { |c| add.call(c, home, room, mine) } if mine
      end

      data = scenario_data.is_a?(Hash) ? scenario_data : {}
      rooms = data['rooms'].is_a?(Hash) ? data['rooms'] : {}
      walk_room = lambda do |list, room_id, nested|
        Array(list).each do |o|
          next unless o.is_a?(Hash)

          if o['takeable'] == true
            add.call(o, nested ? 'nested' : 'room', room_id, nil)
          elsif o['contents'].is_a?(Array)
            walk_room.call(o['contents'], room_id, true)
          end
        end
      end
      rooms.each do |room_id, room|
        next unless room.is_a?(Hash)

        walk_room.call(room['objects'], room_id, false)
        Array(room['npcs']).each do |npc|
          Array(npc['itemsHeld']).each { |i| add.call(i, 'npc', room_id, nil) } if npc.is_a?(Hash)
        end
      end
      BreakEscape::LockStepModel.headless_held(data).each do |_npc_id, held|
        Array(held).each { |i| add.call(i, 'npc', nil, nil) }
      end
      Array(data['startItemsInInventory']).each { |i| add.call(i, 'start', nil, nil) }
      BreakEscape::DeclaredGrants.for(data).each { |g| add.call(g['item'], 'grant', nil, nil) }
      chains
    end

    # The carrier is in the player's inventory (a forged client item stands in for nothing)
    def carried_step_held?(id)
      carried_step_chains
      item = @carried_step_items[id]
      inventory = Array(player_state['inventory']).reject { |i| BreakEscape::ItemIdentity.client_forged?(i) }
      return false if item.nil? || inventory.empty?

      BreakEscape::ItemIdentity.held_in?(item, inventory)
    end

    # A dropped copy of the carrier lies in a room the player can enter
    def carried_step_dropped?(id)
      (player_state['room_states'] || {}).any? do |room_id, rs|
        next false unless rs.is_a?(Hash) && room_unlocked?(room_id)

        Array(rs['objects_added']).any? do |o|
          o.is_a?(Hash) && o['id'] == id && !BreakEscape::ItemIdentity.client_forged?(o)
        end
      end
    end
  end
end
