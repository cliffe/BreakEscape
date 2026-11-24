# frozen_string_literal: true

require_relative 'mfa_model' unless defined?(BreakEscape::MfaModel)
require_relative 'declared_grants' unless defined?(BreakEscape::DeclaredGrants)

module BreakEscape
  # The second step on a lock (S8c, feature A25), read from the authored scenario. Plain Ruby, no
  # Rails and no ActiveSupport, so the validator and the dungeon-graph generator can require it
  # and agree with the server, as MfaModel is shared. Deterministic: no random draw, no clock.
  #
  # A lockable (a room object, a `contents` entry, a room, a carried item) may carry
  # `secondStep: { kind, owner }`.
  module LockStepModel
    module_function

    LOCK_KINDS = %w[push push_number_match code].freeze
    CODE_LOCK_TYPES = %w[password pin].freeze
    PUSH_LOCK_TYPES = %w[password pin key rfid combination cryptex biometric bluetooth ble].freeze
    PHONE_TYPE = 'phone_friendface'

    # The lockable's `{ 'kind' =>, 'owner' => }`, or nil unless `secondStep` is a Hash with a kind
    # in LOCK_KINDS. The owner is the authored one when it is a non-empty String, else the
    # object's own `owner` when that names exactly one NPC (a String, or an Array of one String),
    # else nil.
    def lock_step(lockable)
      return nil unless lockable.is_a?(Hash)

      step = lockable['secondStep']
      return nil unless step.is_a?(Hash) && LOCK_KINDS.include?(step['kind'])

      owner = string_id(step['owner']) || single_owner(lockable['owner'])
      { 'kind' => step['kind'], 'owner' => owner }
    end

    # One walk over every authored home. Each gated lockable (one `lock_step` answers for) is
    # yielded as (lockable, kind, id, home, where), where kind is :object or :door, id is the
    # object's `id` (nil when it has none) or the room's key, home is where the outermost carrier
    # sits (:room, :door, :npc, :start or :grant) and `where` is a Hash with :room, :npc, :parent
    # (the carrying object, or nil) and :path (the ids of the carriers above, outermost first).
    # Without a block, answers the same as an Array of Hashes (:lockable, :kind, :id, :home,
    # :room, :npc, :parent, :path, :step).
    def each_lock_step(scenario, &block)
      out = []
      emit = lambda do |lockable, kind, id, home, where|
        step = lock_step(lockable)
        next unless step

        out << { lockable: lockable, kind: kind, id: id, home: home, step: step }.merge(where)
      end
      walk = lambda do |list, home, base, parent, path|
        Array(list).each do |o|
          next unless o.is_a?(Hash)

          where = base.merge(parent: parent, path: path)
          emit.call(o, :object, string_id(o['id']), home, where)
          inner = path + [o['id']]
          walk.call(o['contents'], home, base, o, inner)
          walk.call(o['itemsHeld'], home, base, o, inner)
        end
      end
      return out unless scenario.is_a?(Hash)

      rooms = scenario['rooms'].is_a?(Hash) ? scenario['rooms'] : {}
      rooms.each do |room_id, room|
        next unless room.is_a?(Hash)

        base = { room: room_id, npc: nil }
        emit.call(room, :door, room_id, :door, base.merge(parent: nil, path: []))
        walk.call(room['objects'], :room, base, nil, [])
        Array(room['npcs']).each do |npc|
          walk.call(npc['itemsHeld'], :npc, { room: room_id, npc: npc['id'] }, nil, []) if npc.is_a?(Hash)
        end
      end
      headless_held(scenario).each do |npc_id, held|
        walk.call(held, :npc, { room: nil, npc: npc_id }, nil, [])
      end
      walk.call(scenario['startItemsInInventory'], :start, { room: nil, npc: nil }, nil, [])
      DeclaredGrants.for(scenario).each do |grant|
        walk.call([grant['item']], :grant, { room: nil, npc: nil }, nil, [])
      end

      return out unless block

      out.each { |e| block.call(e[:lockable], e[:kind], e[:id], e[:home], e.slice(:room, :npc, :parent, :path)) }
      out
    end

    # True when the second step can never pass: the owner's code device (kind code) or phone (the
    # push kinds) is in no place the player can take it from (MfaModel.held_item_sources) and,
    # for plain `push`, the owner's prompt habit is `never` (an owner who approves when pestered
    # or always still passes it). A lockable with no step never fails here (false). `&story_file`
    # is handed to held_item_sources.
    def lock_step_never_passes?(scenario, lockable, &story_file)
      step = lock_step(lockable)
      return false unless step

      owner = step['owner']
      return true if owner.nil?

      case step['kind']
      when 'code'
        !owner_item_held?(scenario, owner, MfaModel::CODE_DEVICE, &story_file)
      when 'push_number_match'
        !owner_item_held?(scenario, owner, PHONE_TYPE, &story_file)
      else
        !owner_item_held?(scenario, owner, PHONE_TYPE, &story_file) &&
          MfaModel.prompt_habit(find_npc(scenario, owner), scenario) == 'never'
      end
    end

    # Is an item of `type` owned by the NPC one the player can come to hold?
    def owner_item_held?(scenario, owner, type, &story_file)
      owned = MfaModel.each_authored_item(scenario).select do |e|
        e[:item]['type'] == type && e[:item]['owner'] == owner && string_id(e[:item]['id'])
      end.map { |e| e[:item]['id'] }
      return false if owned.empty?

      MfaModel.held_item_sources(scenario, [type], &story_file).any? { |s| owned.include?(s[:id]) }
    end

    # The authored NPC record (room NPC or headless record) with the id, or nil
    def find_npc(scenario, npc_id)
      rooms = scenario['rooms'].is_a?(Hash) ? scenario['rooms'] : {}
      rooms.each_value do |room|
        next unless room.is_a?(Hash)

        Array(room['npcs']).each { |n| return n if n.is_a?(Hash) && n['id'] == npc_id }
      end
      nil
    end

    # [[npc id, itemsHeld]] for each headless record (a social character with an emailRecord and
    # an email channel id), as Game.headless_npc_records builds them
    def headless_held(scenario)
      social = scenario['social']
      characters = social.is_a?(Hash) && social['characters'].is_a?(Hash) ? social['characters'] : {}
      characters.each_value.filter_map do |character|
        next unless character.is_a?(Hash)

        record = character['emailRecord']
        id = character['channels'].is_a?(Hash) ? character['channels']['email'] : nil
        next unless record.is_a?(Hash) && id.is_a?(String) && !id.empty?
        next unless record['itemsHeld'].is_a?(Array)

        [id, record['itemsHeld']]
      end
    end

    def string_id(value)
      value.is_a?(String) && !value.empty? ? value : nil
    end

    def single_owner(value)
      return string_id(value) if value.is_a?(String)

      value.is_a?(Array) && value.size == 1 ? string_id(value.first) : nil
    end
  end
end
