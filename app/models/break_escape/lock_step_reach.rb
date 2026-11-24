# frozen_string_literal: true

module BreakEscape
  # Second step on any lock (S8c, Rule D): reach of a carried gated object.
  # STUB (unit 04): neutral bodies; unit 16 fills them in this file.
  module LockStepReach
    extend ActiveSupport::Concern

    def carried_step_ids
      Set.new
    end

    def carried_step_chains
      {}
    end

    def carried_step_reachable?(_object, _path)
      true
    end
  end
end
