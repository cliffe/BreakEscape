# frozen_string_literal: true

module BreakEscape
  # Second step on any lock (S8c): the rules that decide whether a gated object is open.
  # STUB (unit 04): every function is neutral, so every hook in Game is inert. Unit 12 fills in
  # the rule bodies in this file.
  module LockSecondStep
    extend ActiveSupport::Concern

    # Memoised Set of the ids of objects that carry a second step
    def second_step_ids
      Set.new
    end

    # { object:, path: } for an object id, or nil
    def resolve_unlock_target(_target_id)
      nil
    end

    # Rule B: the object's id is in unlockedObjects (never a name)
    def step_object_open?(_object)
      true
    end

    # Rule A: the only writer of a gated id into unlockedObjects
    def record_step_open!(_object)
      nil
    end

    # Rule C: true when a closed gated container sits above this path
    def behind_closed_step?(_path)
      false
    end

    # { subject:, key:, step:, object: | room: } by id only, or nil
    def lock_step_for(_target_type, _target_id)
      nil
    end

    # The lockSteps state map
    def lock_steps_map
      {}
    end
  end
end
