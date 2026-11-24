# frozen_string_literal: true

module BreakEscape
  # Second step on any lock (S8c): the NPC that opened a gated door.
  # STUB (unit 04): no-ops; unit 17 fills them in this file.
  module LockStepDoors
    extend ActiveSupport::Concern

    def note_npc_step_grant!(_room_id, _npc_id)
      nil
    end

    # Must not create the npcStepGrants key
    def clear_npc_step_grant!(_room_id)
      nil
    end

    def npc_step_opener_for(_room_id)
      nil
    end
  end
end
