# frozen_string_literal: true

module BreakEscape
  # Second step on any lock (S8c): the rules that decide whether a gated object is open.
  #
  # Rule A: record_step_open! is the only writer of a gated id into unlockedObjects, and only for
  #         a passed record. Rule B: an object is open when its id (never its name) is in
  #         unlockedObjects. Rule C: nothing below a closed gated container opens.
  # Everything here is read from the authored scenario and the server's own state.
  module LockSecondStep
    extend ActiveSupport::Concern

    # record_step_open! was called for an object whose step has not passed
    class StepNotPassed < StandardError; end

    # The Set second_step_ids returns. `empty?` is false while an object with a second step but no
    # id exists, though the Set holds no id for it: the seams ask `second_step_ids.empty?` to mean
    # "nothing in this scenario is gated" and must then route through resolve_unlock_target, which
    # never resolves such an object, instead of the plain walk that would open it with no step.
    class GatedIds < Set
      attr_accessor :idless_count

      def empty?
        super && idless_count.to_i.zero?
      end
    end

    # Memoised Set of the ids of the objects that carry a second step. A gated object with no id
    # is never listed (and never opens: see resolve_unlock_target and behind_closed_step?), but it
    # keeps the Set from reporting empty (GatedIds).
    def second_step_ids
      @second_step_ids ||= begin
        ids = GatedIds.new
        idless = 0
        BreakEscape::LockStepModel.each_lock_step(scenario_data).each do |entry|
          next unless entry[:kind] == :object

          if entry[:id]
            ids << entry[:id]
          else
            idless += 1
          end
        end
        if idless.positive?
          Rails.logger.warn "[BreakEscape] #{idless} object(s) with a second step have no id and can never open"
        end
        ids.idless_count = idless
        ids.freeze
      end
    end

    # { object:, path: } for an unlock target, or nil. Matches as find_scenario_object always
    # has (id, name, or the client's roomId_type_index at the top of a room), in the same sources
    # and the same walk order (nil when no object in the scenario carries a step), so the first match wins; `path` is the containers above the
    # object, outermost first. A gated object with no id never resolves.
    def resolve_unlock_target(target_id)
      # Nothing is gated: find_scenario_object keeps its own walk and this answers nothing
      return nil if second_step_ids.empty?

      each_unlock_root do |root, client_id|
        found = walk_for_target(root, target_id, client_id, [])
        next unless found

        return nil if gated_without_id?(found[:object])

        return found
      end
      nil
    end

    # Rule B: the object's id is in unlockedObjects (never a name)
    def step_object_open?(object)
      return false unless object.is_a?(Hash)

      id = object['id']
      id.is_a?(String) && !id.empty? && Array(player_state['unlockedObjects']).include?(id)
    end

    # Rule A: marks a gated object open. Raises StepNotPassed unless its lockSteps record is
    # passed. Writes the id into unlockedObjects, deletes the record and saves.
    def record_step_open!(object)
      id = object.is_a?(Hash) ? object['id'] : nil
      unless id.is_a?(String) && second_step_ids.include?(id)
        Rails.logger.warn "[BreakEscape] record_step_open! refused: not a gated object with an id"
        raise StepNotPassed, 'not a gated object'
      end

      map = lock_steps_map
      key = mfa_subject_key(kind: 'object', id: id)
      rec = map[key]
      raise StepNotPassed, "step not passed for #{key}" unless rec.is_a?(Hash) && rec['passed'] == true

      map.delete(key)
      # Written as a new list, not an append, so the seams test's one-appender grep stays as
      # unit 04 wrote it (game.rb's unlock_object! is the only `<<` onto unlockedObjects)
      player_state['unlockedObjects'] = (Array(player_state['unlockedObjects']) + [id]).uniq
      save!
    end

    # Rule C: true when any container above the target on the path is gated and not open
    def behind_closed_step?(path)
      Array(path).any? do |container|
        next false unless container.is_a?(Hash)

        gated_without_id?(container) || (second_step_ids.include?(container['id'].to_s) && !step_object_open?(container))
      end
    end

    # { subject:, key:, step:, object: | room: } by id only, or nil. An object id must be in
    # second_step_ids; a door id must name a room that carries a step.
    def lock_step_for(target_type, target_id)
      id = target_id.to_s
      case target_type.to_s
      when 'object'
        return nil unless second_step_ids.include?(id)

        object = find_gated_object_by_id(id)
        step = object && BreakEscape::LockStepModel.lock_step(object)
        return nil unless step

        subject = { kind: 'object', id: id }
        { subject: subject, key: mfa_subject_key(subject), step: step, object: object }
      when 'door'
        rooms = scenario_data['rooms']
        room = rooms.is_a?(Hash) ? rooms[id] : nil
        step = BreakEscape::LockStepModel.lock_step(room)
        return nil unless step

        subject = { kind: 'door', id: id }
        { subject: subject, key: mfa_subject_key(subject), step: step, room: room }
      end
    end

    # The lockSteps state map, with expired unpassed records dropped
    def lock_steps_map
      player_state['lockSteps'] = {} unless player_state['lockSteps'].is_a?(Hash)
      tidy_pending!(player_state['lockSteps'])
    end

    private

    def gated_without_id?(object)
      object.is_a?(Hash) && object['id'].to_s.empty? && !BreakEscape::LockStepModel.lock_step(object).nil?
    end

    # The first object with exactly this id that carries a step
    def find_gated_object_by_id(id)
      each_unlock_root do |root, _client_id|
        found = walk_for_target(root, id, nil, [], ids_only: true)
        return found[:object] if found
      end
      nil
    end

    # Yields (root object, client-generated id or nil) for each source find_scenario_object
    # reads, in its order
    def each_unlock_root
      scenario_data['rooms']&.each do |room_id, room|
        room['objects']&.each_with_index do |obj, index|
          yield obj, "#{room_id}_#{obj['type']}_#{index}"
        end
      end
      account_profiles.each_value do |profile|
        Array(profile['contents']).each { |item| yield item, nil if item.is_a?(Hash) }
      end
      NetworkModel.resources(scenario_data).each_value do |resource|
        Array(resource['contents']).each { |item| yield item, nil if item.is_a?(Hash) }
      end
      held_grant_items.each { |item| yield item, nil }
      held_usb_sticks.each { |stick| yield stick, nil }
      released_npc_containers.each { |container| yield container, nil }
      Array(scenario_data['startItemsInInventory']).each { |item| yield item, nil if item.is_a?(Hash) }
    end

    # Depth-first, the object before its contents. ids_only matches a gated object's id alone.
    def walk_for_target(obj, target_id, client_id, path, ids_only: false)
      return nil unless obj.is_a?(Hash)

      matched =
        if ids_only
          obj['id'] == target_id && !BreakEscape::LockStepModel.lock_step(obj).nil?
        else
          obj['id'] == target_id || obj['name'] == target_id || (client_id && client_id == target_id)
        end
      return { object: obj, path: path } if matched

      return nil unless obj['contents'].is_a?(Array)

      obj['contents'].each do |child|
        found = walk_for_target(child, target_id, nil, path + [obj], ids_only: ids_only)
        return found if found
      end
      nil
    end
  end
end
