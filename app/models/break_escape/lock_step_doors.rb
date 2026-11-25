# frozen_string_literal: true

module BreakEscape
  # Second step on any lock (S8c): the NPC that opened a gated door.
  # State: player_state['npcStepGrants'] = { "door:<roomId>" => npcId }. Server only; it is
  # written when the gate accepts an `npc` first factor at a gated door and deleted when that
  # door opens (unlock_room! calls clear_npc_step_grant!).
  module LockStepDoors
    extend ActiveSupport::Concern

    # Records that npc_id opened the door to room_id. Saves.
    def note_npc_step_grant!(room_id, npc_id)
      return nil if room_id.to_s.empty? || npc_id.to_s.empty?

      grants = player_state['npcStepGrants']
      grants = player_state['npcStepGrants'] = {} unless grants.is_a?(Hash)
      grants[npc_step_grant_key(room_id)] = npc_id.to_s
      save!
      npc_id.to_s
    end

    # Must not create the npcStepGrants key. Does not save: its caller (unlock_room!) saves.
    def clear_npc_step_grant!(room_id)
      grants = player_state['npcStepGrants']
      return nil unless grants.is_a?(Hash)

      grants.delete(npc_step_grant_key(room_id))
      nil
    end

    # The NPC that opened the gated door, or nil (no grant, or the room is already unlocked).
    def npc_step_opener_for(room_id)
      return nil if room_unlocked?(room_id)

      grants = player_state['npcStepGrants']
      return nil unless grants.is_a?(Hash)

      opener = grants[npc_step_grant_key(room_id)]
      opener.to_s.empty? ? nil : opener.to_s
    end

    private

    def npc_step_grant_key(room_id)
      "door:#{room_id}"
    end
  end
end
