module BreakEscape
  # Capture proofs (docs/achitechture/PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md, section 6): the
  # facts the server records itself about plants and drops, and the check that a captured
  # account password is served only once one of that account's proofs holds.
  #
  # The scenario-level rules (the capture-writer walk, declared target ids, where a proof lives)
  # are in BreakEscape::CaptureModel, which the validator shares.
  #
  # player_state keys (in Game::ACCESS_STATE_DEFAULTS):
  #   plantedItems  [{ 'item' => itemId, 'on' => objectId }], devices seen leaving the inventory
  #                 at an object made for them, in a room the player had unlocked
  #   droppedItems  [itemId, ...], items accepted as a player_drop
  module CaptureProofs
    extend ActiveSupport::Concern

    # Records a plant when the inventory remove names the object it was used on. Appends
    # { item, on } to plantedItems only if the item is held, the object (a room object with that
    # id) requires and consumes the item, and its room is the start room or unlocked. Called
    # before the removal; the removal happens either way. Returns true when recorded.
    def record_planted_item!(item_id, used_on)
      item_id = item_id.to_s
      used_on = used_on.to_s
      return false if item_id.empty? || used_on.empty?

      held = (player_state['inventory'] || []).find do |inv|
        data = inv.is_a?(Hash) ? (inv['scenarioData'] || inv) : nil
        data.is_a?(Hash) && data['id'].to_s == item_id
      end
      held_data = held && (held['scenarioData'] || held)
      return false unless held_data.is_a?(Hash)

      found = planted_target_object(used_on)
      return false unless found
      return false unless CaptureModel.object_takes_item?(found[:object], held_data)
      return false unless room_unlocked?(found[:room_id])

      list = (player_state['plantedItems'] ||= [])
      entry = { 'item' => item_id, 'on' => used_on }
      list << entry unless list.include?(entry)
      save!
      true
    end

    # Whether one authored proof holds, from server state only.
    def capture_proof_holds?(proof)
      case CaptureModel.proof_kind(proof)
      when 'planted'
        on = proof['on']
        planted = Array(player_state['plantedItems']).any? do |entry|
          entry.is_a?(Hash) && entry['item'] == proof['planted'] && (on.nil? || entry['on'] == on)
        end
        planted || (CaptureModel.present_string?(on) && Array(player_state['gainedFootholds']).include?(on))
      when 'dropped'
        Array(player_state['droppedItems']).include?(proof['dropped'])
      when 'session'
        Array(player_state['signedInPcs']).include?(proof['session'])
      else
        false
      end
    end

    def capture_proofs_for(npc)
      CaptureModel.proofs_for(npc, scenario_data)
    end

    def scenario_declares_capture_proofs?
      CaptureModel.declares_proofs?(scenario_data)
    end

    # Whether an account's password opens something: the account is admitted at a sign-in PC
    # (a room object login_pc? accepts; a PC with no access list admits every account), or, in a
    # scenario with networks, at a share whose access list admits it. A share with no access
    # list is reached by a foothold alone, so the password adds nothing there. Also when the
    # password is the code of a password or PIN lock anywhere in the scenario
    # (CaptureModel.password_opens_lock?, which the validator shares).
    def account_password_opens_something?(npc)
      return true if CaptureModel.password_opens_lock?(npc, scenario_data)

      pcs =AccessIdentities.room_objects(scenario_data).map { |entry| entry[:object] }.select { |obj| self.class.login_pc?(obj) }
      return true if pcs.any? { |pc| pc_admits_account?(pc, npc) }
      return false unless network_scenario?

      NetworkModel.resources(scenario_data).values.any? do |resource|
        !resource['access'].nil? && resource_acl_admits?(resource, npc)
      end
    end

    # The account check inside account_capture_passwords: in a scenario that declares proofs,
    # an account whose password opens something is served only once one of its proofs holds.
    # Elsewhere every account is served as before, with an info line when it has no proof.
    def account_capture_served?(npc)
      proofs = capture_proofs_for(npc)
      unless scenario_declares_capture_proofs?
        if proofs.empty?
          Rails.logger.info "[BreakEscape] capture_secrets: account #{npc['id']} served without a capture proof (scenario declares none)"
        end
        return true
      end
      return true unless account_password_opens_something?(npc)

      proofs.any? { |proof| capture_proof_holds?(proof) }
    end

    # The capture target ids the scenario declares (CaptureModel.declared_target_ids).
    def declared_capture_target_ids
      CaptureModel.declared_target_ids(scenario_data).to_set
    end

    private

    # { object:, room_id: } for the room object (under rooms.<id>.objects, by id only, never by
    # name) that a plant names, or nil.
    def planted_target_object(object_id)
      rooms = scenario_data['rooms']
      return nil unless rooms.is_a?(Hash)

      rooms.each do |room_id, room|
        next unless room.is_a?(Hash) && room['objects'].is_a?(Array)

        obj = room['objects'].find { |o| o.is_a?(Hash) && o['id'].to_s == object_id }
        return { object: obj, room_id: room_id } if obj
      end
      nil
    end
  end
end
