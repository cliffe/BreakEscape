module BreakEscape
  # Wearable items, server side (docs/achitechture/WEARABLE_BUILD_LOG.md). The server owns
  # whether an item is worn: only wear! sets a worn global true, sync_state cannot write one
  # (worn_global_names joins the read-only names in merge_global_variables!), and an item that
  # leaves the inventory comes off.
  #
  # player_state keys:
  #   worn             { 'itemId', 'global', 'costume' } or absent: the one item worn now
  #   wearableGlobals  [names]: every wearable's global, read-only to sync_state
  module Wearables
    extend ActiveSupport::Concern

    # The costume global costume-actions.js writes; the server keeps it in step with the worn item.
    DISGUISE_GLOBAL = 'pp_disguise'.freeze

    def worn_record
      rec = player_state.is_a?(Hash) ? player_state['worn'] : nil
      rec.is_a?(Hash) && rec['itemId'].present? ? rec : nil
    end

    # The worn globals, read-only to sync_state. Every game made since this field existed stores
    # the list at creation. A game with no list (made before it) works it out from its own
    # scenario snapshot, which nothing regenerates: a game started before wearables gets [] and
    # keeps the old client-written costume until it is restarted (build log, review R2 m1).
    # sync_state loads the row without scenario_data, so that is read on its own.
    def worn_global_names
      return [] unless player_state.is_a?(Hash)

      names = player_state['wearableGlobals']
      return names.grep(String) if names.is_a?(Array)

      data = has_attribute?(:scenario_data) ? scenario_data : self.class.where(id: id).pick(:scenario_data)
      player_state['wearableGlobals'] = BreakEscape::WearableModel.worn_globals(data)
    end

    # The globals read-only to sync_state for wearables: the worn globals, and pp_disguise when
    # the scenario has any (only POST wear dresses the avatar then).
    def wearable_read_only_globals
      names = worn_global_names
      names.empty? ? [] : names + [DISGUISE_GLOBAL]
    end

    # Record the scenario's worn globals in player_state. Returns true when the list changed
    # (the caller saves). Called when the game is created.
    def refresh_wearable_globals!
      names = BreakEscape::WearableModel.worn_globals(scenario_data)
      return false if player_state['wearableGlobals'] == names

      player_state['wearableGlobals'] = names
      true
    end

    # Put a held wearable on (worn true) or take it off (worn false). Returns
    # { status:, body: } for the controller. Taking off with no item id takes off whatever is worn.
    def wear!(item_id, worn)
      item_id = item_id.to_s
      if worn
        held = held_inventory_item(item_id)
        return wear_refusal('That item is not in your inventory.') unless held

        spec = BreakEscape::WearableModel.spec(held)
        return wear_refusal('That item is not something you can wear.') unless spec

        disguises = scenario_data.is_a?(Hash) ? scenario_data['disguises'] : nil
        costume = disguises.is_a?(Hash) ? disguises[spec['costume']] : nil
        return wear_refusal('That costume is not in this scenario.') unless costume.is_a?(Hash)

        written = {}
        prev = worn_record
        if prev && prev['itemId'] != item_id
          written[prev['global']] = false if prev['global'].present?
        end
        written[spec['global']] = true
        written[DISGUISE_GLOBAL] = spec['costume']
        player_state['worn'] = { 'itemId' => item_id, 'global' => spec['global'], 'costume' => spec['costume'] }
        write_server_globals!(written)
      else
        prev = worn_record
        if prev && item_id.present? && prev['itemId'] != item_id
          return wear_refusal('That item is not being worn.')
        end

        # No record (a drop the server already took off, or a hand-edited game): clear any worn
        # global still true.
        written = prev ? clear_worn_record! : clear_stray_worn_globals!
      end
      save!
      { status: :ok, body: { success: true, worn: worn_record, globals: written } }
    end

    # The worn item has left the inventory: take it off. Returns the globals written (empty when
    # nothing was worn or the item is still held). Does not save; the caller does.
    def release_worn_unless_held!
      rec = worn_record
      return {} unless rec
      return {} if held_inventory_item(rec['itemId'])

      clear_worn_record!
    end

    # A player drop of the worn item (Game#add_item_to_room!): it leaves the inventory in the same
    # request and comes off, whether or not the client's inventory remove follows. Does not save.
    def release_dropped_worn_item!(item_id)
      rec = worn_record
      return {} unless rec && rec['itemId'] == item_id.to_s

      Array(player_state['inventory']).reject! do |inv|
        inv.is_a?(Hash) && (inv['scenarioData'].is_a?(Hash) ? inv['scenarioData'] : inv)['id'].to_s == rec['itemId']
      end
      release_worn_unless_held!
    end

    private

    # Take off with no worn record: every worn global still true goes false, and the costume with it.
    def clear_stray_worn_globals!
      globals = player_state['globalVariables'].is_a?(Hash) ? player_state['globalVariables'] : {}
      stuck = worn_global_names.select { |g| globals[g] == true }
      return {} if stuck.empty?

      written = stuck.to_h { |g| [g, false] }
      written[DISGUISE_GLOBAL] = ''
      write_server_globals!(written)
      written
    end

    def clear_worn_record!
      rec = worn_record
      player_state.delete('worn')
      written = { DISGUISE_GLOBAL => '' }
      written[rec['global']] = false if rec && rec['global'].present?
      write_server_globals!(written)
      written
    end

    def write_server_globals!(values)
      globals = (player_state['globalVariables'] ||= {})
      values.each { |k, v| globals[k] = v }
    end

    def held_inventory_item(item_id)
      return nil if item_id.to_s.empty?

      Array(player_state['inventory']).each do |inv|
        next unless inv.is_a?(Hash)

        data = inv['scenarioData'].is_a?(Hash) ? inv['scenarioData'] : inv
        return data if data['id'].to_s == item_id.to_s
      end
      nil
    end

    def wear_refusal(message)
      { status: :unprocessable_entity, body: { success: false, message: message } }
    end
  end
end
