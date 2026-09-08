module BreakEscape
  class Game < ApplicationRecord
    self.table_name = 'break_escape_games'

    # Associations
    belongs_to :player, polymorphic: true
    belongs_to :mission, class_name: 'BreakEscape::Mission'

    # Validations
    validates :player, presence: true
    validates :mission, presence: true
    validates :status, inclusion: { in: %w[in_progress completed abandoned] }

    # Scopes
    scope :active, -> { where(status: 'in_progress') }
    scope :completed, -> { where(status: 'completed') }

    # Callbacks
    before_create :sync_vm_set_id_column
    before_create :generate_scenario_data
    before_create :initialize_player_state
    before_create :set_started_at
    before_create :set_scoring_totals
    after_commit :fire_completion_callback, if: :status_previously_changed_to_completed?
    after_commit :fire_completion_callback, if: :task_progress_previously_changed?
    after_commit :fire_completion_callback, if: :mission_conclusion_previously_changed?

    # Returns true if the game has meaningful progress beyond the initial state
    def has_progress?
      return false unless player_state.is_a?(Hash)
      unlocked = player_state['unlockedRooms'] || []
      encountered = player_state['encounteredNPCs'] || []
      unlocked.length > 1 || encountered.any? || player_state['objectivesState'].present?
    end

    # Check if mission is completed
    def mission_completed?
      status == 'completed' || mission_concluded_at.present?
    end

    # Calculate task-based score (task completion scoring method)
    def calculate_task_score
      return 0.0 if total_tasks.zero?

      task_score = (tasks_completed.to_f / total_tasks) * 70
      aim_score = total_aims.positive? ? (objectives_completed.to_f / total_aims) * 30 : 0

      task_score + aim_score
    end

    # Get score based on game_slot scoring method (if available)
    def calculate_score
      # Try to get scoring method from game_slot if available
      scoring_method = game_slot&.scoring_method

      case scoring_method
      when 'flags'
        # Use VM set score directly
        vm_set&.score || 0.0
      when 'task_completion', nil
        # Default to task-based scoring
        calculate_task_score
      else
        # Fallback for unknown methods
        Rails.logger.warn "Unknown scoring_method: #{scoring_method}"
        calculate_task_score
      end
    end

    # Resets player_state to initial values, preserving mission context (VM/flags)
    def reset_player_state!
      preserved_keys = %w[vm_set_id vm_ips flags_by_vm standalone_flags]
      new_state = player_state.slice(*preserved_keys)
      self.player_state = new_state
      initialize_player_state
      self.tasks_completed = 0
      self.objectives_completed = 0
      self.score = 0
      save!
    end

    # Room management
    def unlock_room!(room_id)
      player_state['unlockedRooms'] ||= []
      player_state['unlockedRooms'] << room_id unless player_state['unlockedRooms'].include?(room_id)
      save!
    end

    def room_unlocked?(room_id)
      player_state['unlockedRooms']&.include?(room_id) || start_room?(room_id)
    end

    def start_room?(room_id)
      scenario_data['startRoom'] == room_id
    end

    # Object management
    def unlock_object!(object_id)
      player_state['unlockedObjects'] ||= []
      player_state['unlockedObjects'] << object_id unless player_state['unlockedObjects'].include?(object_id)
      save!
    end

    def object_unlocked?(object_id)
      player_state['unlockedObjects']&.include?(object_id)
    end

    # Inventory management
    def add_inventory_item!(item)
      player_state['inventory'] ||= []

      # Check if item already exists in inventory (by id or combination of type and name)
      item_exists = player_state['inventory'].any? do |existing_item|
        # Match by ID if both have IDs
        if item['id'].present? && existing_item['id'].present?
          existing_item['id'] == item['id']
        else
          # Match by type and name as fallback
          existing_item['type'] == item['type'] &&
          existing_item['name'] == item['name']
        end
      end

      unless item_exists
        player_state['inventory'] << item
        save!
      else
        Rails.logger.info "[BreakEscape] Item already in inventory, skipping: #{item['type']} / #{item['name']}"
      end
    end

    def remove_inventory_item!(item_id)
      player_state['inventory']&.reject! { |item| item['id'] == item_id }
      save!
    end

    # Check if player has a specific key in inventory
    def has_key_in_inventory?(key_id)
      inventory = player_state['inventory'] || []

      Rails.logger.info "[BreakEscape] Checking for key #{key_id} in inventory (#{inventory.length} items)"

      # Check for key with matching key_id
      found = inventory.any? do |item|
        is_match = item['scenarioData']&.dig('key_id') == key_id ||
                   item['scenarioData']&.dig('id') == key_id ||
                   item['key_id'] == key_id ||
                   item['id'] == key_id

        item_key_id = item['scenarioData']&.dig('key_id') || item['key_id']
        item_name = item['scenarioData']&.dig('name') || item['name']
        Rails.logger.debug "[BreakEscape] Inventory item: name=#{item_name}, key_id=#{item_key_id}, is_match=#{is_match}"
        is_match
      end

      Rails.logger.info "[BreakEscape] Key #{key_id} found in inventory: #{found}"
      found
    end

    # Check if player has a lockpick in inventory
    def has_lockpick_in_inventory?
      inventory = player_state['inventory'] || []

      Rails.logger.info "[BreakEscape] Checking for lockpick in inventory (#{inventory.length} items)"

      # Check for lockpick item in scenarioData or at top level
      found = inventory.any? do |item|
        is_lockpick = item['scenarioData']&.dig('type') == 'lockpick' ||
                      item['type'] == 'lockpick'
        Rails.logger.debug "[BreakEscape] Inventory item: type=#{item['type']}, scenarioData.type=#{item['scenarioData']&.dig('type')}, is_lockpick=#{is_lockpick}"
        is_lockpick
      end

      Rails.logger.info "[BreakEscape] Lockpick found in inventory: #{found}"
      found
    end

    # NPC tracking
    def encounter_npc!(npc_id)
      player_state['encounteredNPCs'] ||= []
      unless player_state['encounteredNPCs'].include?(npc_id)
        player_state['encounteredNPCs'] << npc_id

        # Try to get NPC display name from scenario for better logging
        npc_display_name = npc_id
        if scenario_data && scenario_data['rooms']
          scenario_data['rooms'].each do |_room_id, room_data|
            npc_data = room_data['npcs']&.find { |npc| npc['id'] == npc_id }
            if npc_data && npc_data['displayName']
              npc_display_name = npc_data['displayName']
              break
            end
          end
        end

        Rails.logger.info "[BreakEscape] 🎭 NPC ENCOUNTERED (via encounter_npc!): #{npc_display_name} (#{npc_id})"
        save!
      end
    end

    # Global variables (synced with client)
    def update_global_variables!(variables)
      player_state['globalVariables'] ||= {}
      player_state['globalVariables'].merge!(variables)
      save!
    end

    # Minigame state
    def add_biometric_sample!(sample)
      player_state['biometricSamples'] ||= []
      player_state['biometricSamples'] << sample
      save!
    end

    def add_bluetooth_device!(device)
      player_state['bluetoothDevices'] ||= []
      unless player_state['bluetoothDevices'].any? { |d| d['mac'] == device['mac'] }
        player_state['bluetoothDevices'] << device
      end
      save!
    end

    def add_note!(note)
      player_state['notes'] ||= []
      player_state['notes'] << note
      save!
    end

    # ==========================================
    # Dynamic Room State Management
    # ==========================================

    # Add an item to a room (e.g., NPC drops item)
    def add_item_to_room!(room_id, item, source_data = {})
      player_state['room_states'] ||= {}
      player_state['room_states'][room_id] ||= { 'objects_added' => [], 'objects_removed' => [], 'object_states' => {}, 'npc_states' => {} }

      # Validate item has required fields
      unless item.is_a?(Hash) && item['type'].present?
        Rails.logger.error "[BreakEscape] Invalid item for add_item_to_room: #{item.inspect}"
        return false
      end

      # Validate source if provided
      if source_data['npc_id'].present?
        # Verify NPC exists in scenario and is in this room
        npc_in_room = npc_in_room?(source_data['npc_id'], room_id)
        unless npc_in_room
          Rails.logger.warn "[BreakEscape] NPC #{source_data['npc_id']} not in room #{room_id}, rejecting item add"
          return false
        end

        # SECURITY: Verify the item matches an item the NPC actually holds
        npc_data = find_npc_in_scenario(source_data['npc_id'])
        unless npc_data && npc_has_item?(npc_data, item)
          Rails.logger.warn "[BreakEscape] NPC #{source_data['npc_id']} does not have item type=#{item['type']}, id=#{item['id']}, rejecting item add"
          return false
        end
      end

      # Generate unique ID if not provided
      item['id'] ||= "#{room_id}_added_#{SecureRandom.hex(4)}"

      # Add to room state
      player_state['room_states'][room_id]['objects_added'] << item
      save!

      Rails.logger.info "[BreakEscape] Added item #{item['type']} (#{item['id']}) to room #{room_id}"
      true
    end

    # Remove an item from a room (e.g., player picks up)
    def remove_item_from_room!(room_id, item_id)
      player_state['room_states'] ||= {}
      player_state['room_states'][room_id] ||= { 'objects_added' => [], 'objects_removed' => [], 'object_states' => {}, 'npc_states' => {} }

      # Check if item exists in room (scenario or added)
      item_exists = item_in_room?(room_id, item_id)
      unless item_exists
        Rails.logger.warn "[BreakEscape] Item #{item_id} not found in room #{room_id}"
        return false
      end

      # If item was previously added (in objects_added), remove it from there
      player_state['room_states'][room_id]['objects_added'].reject! { |obj| obj['id'] == item_id }

      # Otherwise, add to objects_removed list
      unless player_state['room_states'][room_id]['objects_removed'].include?(item_id)
        player_state['room_states'][room_id]['objects_removed'] << item_id
      end

      save!
      Rails.logger.info "[BreakEscape] Removed item #{item_id} from room #{room_id}"
      true
    end

    # Update object state (e.g., container opened, light switched on)
    def update_object_state!(room_id, object_id, state_changes)
      player_state['room_states'] ||= {}
      player_state['room_states'][room_id] ||= { 'objects_added' => [], 'objects_removed' => [], 'object_states' => {}, 'npc_states' => {} }

      # Validate object exists
      unless item_in_room?(room_id, object_id)
        Rails.logger.warn "[BreakEscape] Object #{object_id} not found in room #{room_id}"
        return false
      end

      # Merge state changes
      player_state['room_states'][room_id]['object_states'][object_id] ||= {}
      player_state['room_states'][room_id]['object_states'][object_id].merge!(state_changes)

      save!
      Rails.logger.info "[BreakEscape] Updated object #{object_id} state in room #{room_id}: #{state_changes.inspect}"
      true
    end

    # Update NPC state (e.g., defeated/KO, health changes)
    def update_npc_state!(room_id, npc_id, state_changes)
      player_state['room_states'] ||= {}
      player_state['room_states'][room_id] ||= { 'objects_added' => [], 'objects_removed' => [], 'object_states' => {}, 'npc_states' => {} }

      # Ensure npc_states key exists (for backwards compatibility with existing data)
      player_state['room_states'][room_id]['npc_states'] ||= {}

      # Validate NPC exists in room
      unless npc_in_room?(npc_id, room_id)
        Rails.logger.warn "[BreakEscape] NPC #{npc_id} not found in room #{room_id}"
        return false
      end

      # Merge state changes
      player_state['room_states'][room_id]['npc_states'][npc_id] ||= {}
      player_state['room_states'][room_id]['npc_states'][npc_id].merge!(state_changes)

      save!
      Rails.logger.info "[BreakEscape] Updated NPC #{npc_id} state in room #{room_id}: #{state_changes.inspect}"
      true
    end

    # Remove NPC from scene permanently (arrested, surrendered, escorted away)
    def remove_npc_from_scene!(room_id, npc_id)
      player_state['room_states'] ||= {}
      player_state['room_states'][room_id] ||= { 'objects_added' => [], 'objects_removed' => [], 'object_states' => {}, 'npc_states' => {} }
      player_state['room_states'][room_id]['npcs_removed'] ||= []

      unless npc_in_room?(npc_id, room_id)
        Rails.logger.warn "[BreakEscape] NPC #{npc_id} not found in room #{room_id}, cannot remove from scene"
        return false
      end

      unless player_state['room_states'][room_id]['npcs_removed'].include?(npc_id)
        player_state['room_states'][room_id]['npcs_removed'] << npc_id
      end

      save!
      Rails.logger.info "[BreakEscape] NPC #{npc_id} removed from scene in room #{room_id}"
      true
    end

    # Move NPC between rooms
    def move_npc_to_room!(npc_id, from_room_id, to_room_id)
      player_state['room_states'] ||= {}

      # Validate rooms exist and are connected (or NPC is phone-type that can teleport)
      unless rooms_connected?(from_room_id, to_room_id)
        # Check if NPC is phone-type (can be anywhere)
        npc_data = find_npc_in_scenario(npc_id)
        if npc_data && npc_data['npcType'] == 'phone'
          # Phone NPCs can "move" freely (they're not physical)
          Rails.logger.info "[BreakEscape] Phone NPC #{npc_id} can move freely"
        else
          Rails.logger.warn "[BreakEscape] Rooms #{from_room_id} and #{to_room_id} not connected, rejecting NPC move"
          return false
        end
      end

      # Remove NPC from source room
      player_state['room_states'][from_room_id] ||= { 'objects_added' => [], 'objects_removed' => [], 'object_states' => {}, 'npcs_removed' => [] }
      player_state['room_states'][from_room_id]['npcs_removed'] ||= []
      player_state['room_states'][from_room_id]['npcs_removed'] << npc_id unless player_state['room_states'][from_room_id]['npcs_removed'].include?(npc_id)

      # Add NPC to target room
      player_state['room_states'][to_room_id] ||= { 'objects_added' => [], 'objects_removed' => [], 'object_states' => {}, 'npcs_added' => [] }
      player_state['room_states'][to_room_id]['npcs_added'] ||= []

      # Store full NPC data in target room
      npc_data = find_npc_in_scenario(npc_id)
      if npc_data
        npc_with_new_room = npc_data.merge('roomId' => to_room_id)
        player_state['room_states'][to_room_id]['npcs_added'] << npc_with_new_room
      end

      save!
      Rails.logger.info "[BreakEscape] Moved NPC #{npc_id} from #{from_room_id} to #{to_room_id}"
      true
    end

    private

    def sync_vm_set_id_column
      state = player_state.is_a?(String) ? JSON.parse(player_state) : player_state
      self.vm_set_id ||= state&.dig('vm_set_id')&.to_i
    rescue JSON::ParserError
      nil
    end

    def status_previously_changed_to_completed?
      saved_change_to_status?(to: 'completed')
    end

    def task_progress_previously_changed?
      return false if saved_change_to_status?(to: 'completed')
      # Use saved_changes.key? rather than the auto-generated predicate so this
      # works even before the mission_concluded_at migration has been applied.
      return false if saved_changes.key?('mission_concluded_at')

      saved_change_to_tasks_completed? || saved_change_to_objectives_completed?
    end

    def mission_conclusion_previously_changed?
      # Guard: when status also changed to completed in the same save, let
      # status_previously_changed_to_completed? own the callback to avoid double-fire.
      return false if saved_change_to_status?(to: 'completed')

      saved_changes.key?('mission_concluded_at') && mission_concluded_at.present?
    end

    def fire_completion_callback
      return unless BreakEscape.configuration&.on_game_complete
      BreakEscape.configuration.on_game_complete.call(self)
    rescue => e
      Rails.logger.error "[BreakEscape] on_game_complete hook raised: #{e.class}: #{e.message}"
    end

    # Check if NPC exists in a room (scenario or moved)
    def npc_in_room?(npc_id, room_id)
      # Check scenario data
      room = scenario_data.dig('rooms', room_id)
      return false unless room

      scenario_has_npc = room['npcs']&.any? { |npc| npc['id'] == npc_id }

      # Check if NPC was removed from this room
      removed = player_state.dig('room_states', room_id, 'npcs_removed')&.include?(npc_id)

      # Check if NPC was added to this room
      added = player_state.dig('room_states', room_id, 'npcs_added')&.any? { |npc| npc['id'] == npc_id }

      (scenario_has_npc && !removed) || added
    end

    # Check if item exists in a room
    def item_in_room?(room_id, item_id)
      room = scenario_data.dig('rooms', room_id)
      return false unless room

      # IDs are always stamped at game creation by stamp_scenario_object_ids!
      scenario_has_item = room['objects']&.any? { |obj| obj['id'] == item_id }

      # Check added objects
      added = player_state.dig('room_states', room_id, 'objects_added')&.any? { |obj| obj['id'] == item_id }

      # Check if removed
      removed = player_state.dig('room_states', room_id, 'objects_removed')&.include?(item_id)

      (scenario_has_item || added) && !removed
    end

    # Check if two rooms are connected
    def rooms_connected?(room1_id, room2_id)
      room1 = scenario_data.dig('rooms', room1_id)
      room2 = scenario_data.dig('rooms', room2_id)

      return false unless room1 && room2

      # Check if room1 has connection to room2
      room1_connections = room1['connections']&.values || []
      room2_connections = room2['connections']&.values || []

      room1_connections.include?(room2_id) || room2_connections.include?(room1_id)
    end

    # Find NPC in scenario data
    def find_npc_in_scenario(npc_id)
      scenario_data['rooms']&.each do |_room_id, room|
        npc = room['npcs']&.find { |n| n['id'] == npc_id }
        return npc if npc
      end
      nil
    end

    # Check if an item is already in the player's inventory
    # Matches by type, id, or name (similar to container filtering logic)
    def item_in_inventory?(item, inventory)
      return false if inventory.blank? || item.blank?

      # Normalize item data (handle both string and symbol keys)
      item_type = item['type'] || item[:type]
      item_id = item['key_id'] || item[:key_id] || item['id'] || item[:id]
      item_name = item['name'] || item[:name]

      inventory.any? do |inv_item|
        # Inventory items are stored as flat objects (not nested in scenarioData)
        # Handle both string and symbol keys
        inv_type = inv_item['type'] || inv_item[:type]
        inv_id = inv_item['key_id'] || inv_item[:key_id] || inv_item['id'] || inv_item[:id]
        inv_name = inv_item['name'] || inv_item[:name]

        # Must match type
        next false unless inv_type == item_type

        # If both have IDs, match by ID (most specific)
        if item_id.present? && inv_id.present?
          return true if inv_id.to_s == item_id.to_s
        end

        # If both have names, match by name (fallback if no ID match)
        if item_name.present? && inv_name.present?
          return true if inv_name.to_s == item_name.to_s
        end

        # If item has no ID or name, match by type only (less specific, but works for generic items)
        if item_id.blank? && item_name.blank?
          return true
        end

        false
      end
    end

    # Check if an NPC has a specific item in their itemsHeld array
    # Used for security validation when adding items to rooms
    def npc_has_item?(npc_data, item)
      return false unless npc_data['itemsHeld'].present?

      item_type = item['type']
      item_id = item['key_id'] || item['id']
      item_name = item['name']

      npc_data['itemsHeld'].any? do |held_item|
        held_type = held_item['type']
        held_id = held_item['key_id'] || held_item['id']
        held_name = held_item['name']

        # Must match type
        next false unless held_type == item_type

        # If both have IDs, match by ID
        if item_id.present? && held_id.present?
          return true if held_id.to_s == item_id.to_s
        end

        # If both have names, match by name
        if item_name.present? && held_name.present?
          return true if held_name.to_s == item_name.to_s
        end

        # If no ID or name, match by type only
        if item_id.blank? && item_name.blank?
          return true
        end

        false
      end
    end

    public

    # Health management
    def update_health!(value)
      player_state['health'] = value.clamp(0, 100)
      save!
    end

    # Scenario data access
    def room_data(room_id)
      scenario_data.dig('rooms', room_id)
    end

    # Resolve a flag reference ("vm_name:flag_n") to its actual value from the
    # top-level "flags" section of the scenario.  Returns nil if unresolvable.
    def resolve_flag_ref(ref)
      return nil unless ref.is_a?(String) && ref.include?(':')
      vm_name, flag_key = ref.split(':', 2)
      scenario_data.dig('flags', vm_name, flag_key)
    end

    def filtered_scenario_for_bootstrap
      # Returns scenario data without room contents for lazy-loading
      # This significantly reduces initial payload by only sending metadata
      filtered = scenario_data.deep_dup

      # Remove all room contents - they'll be lazy-loaded via /room/:room_id endpoint
      unlocked_rooms = player_state['unlockedRooms'] || []
      if filtered['rooms'].present?
        filtered['rooms'].each do |room_id, room_data|
          # Keep only essential fields for navigation and metadata
          # keyPins MUST be included: Door locks need pin configuration at interaction time,
          # before the connected room is lazy-loaded. Without keyPins here, lockpicking uses random pins.
          kept_fields = {}
          %w[type connections locked lockType requires difficulty door_sign keyPins ambientSound ambientVolume].each do |field|
            kept_fields[field] = room_data[field] if room_data.key?(field)
          end

          # If the player has already unlocked this room, mark it as unlocked so the
          # client renders the door as passable on session restore.
          kept_fields['locked'] = false if unlocked_rooms.include?(room_id)

          # Replace room data with filtered version
          filtered['rooms'][room_id] = kept_fields
        end
      end

      # Strip targetFlags from objectives — these are the expected flag answers and
      # must never be sent to the client (they would trivially allow completion bypass).
      filtered['objectives'] = filter_target_flags(filtered['objectives']) if filtered['objectives'].present?

      # Strip top-level flag values — client must never see actual flag answers.
      filtered.delete('flags')

      filtered
    end

    def filtered_room_data(room_id)
      room = room_data(room_id)&.deep_dup
      return nil unless room

      # Apply dynamic room state changes (delta overlay)
      apply_room_state_changes!(room, room_id)

      # Remove ONLY the 'requires' field (the solution) and locked 'contents'
      # Keep lockType, locked, observations visible to client
      filter_requires_and_contents_recursive(room)

      room
    end

    # Apply room_states delta to room data
    def apply_room_state_changes!(room, room_id)
      # Apply room_states delta (removals, additions, state changes) if an entry exists.
      if player_state['room_states']&.key?(room_id)
        room_state = player_state['room_states'][room_id]

        # Apply object removals
        if room_state['objects_removed'].present?
          removed_ids = room_state['objects_removed']
          room['objects']&.reject! { |obj| removed_ids.include?(obj['id']) }
        end

        # Apply object additions
        if room_state['objects_added'].present?
          room['objects'] ||= []
          room['objects'].concat(room_state['objects_added'])
        end

        # Apply object state changes
        if room_state['object_states'].present?
          room['objects']&.each do |obj|
            if room_state['object_states'][obj['id']]
              obj.merge!(room_state['object_states'][obj['id']])
            end
          end
        end

        # Apply NPC removals
        if room_state['npcs_removed'].present?
          room['npcs']&.reject! { |npc| room_state['npcs_removed'].include?(npc['id']) }
        end

        # Apply NPC additions
        if room_state['npcs_added'].present?
          room['npcs'] ||= []
          room['npcs'].concat(room_state['npcs_added'])
        end

        # Apply NPC state changes
        if room_state['npc_states'].present?
          room['npcs']&.each do |npc|
            if room_state['npc_states'][npc['id']]
              npc.merge!(room_state['npc_states'][npc['id']])
            end
          end
        end
      end

      # These filters always run regardless of whether a room_states entry exists,
      # so that items/notes already collected in a previous session are suppressed
      # even when objects_removed was never written (e.g. StateSync beat removeItemFromRoom).

      # Filter out items that are already in player's inventory
      if player_state['inventory'].present? && room['objects'].present?
        room['objects'].reject! { |obj| item_in_inventory?(obj, player_state['inventory']) }
      end

      # Filter out takeable notes whose content the player has already collected.
      # Only filter takeable notes (non-takeable notes, e.g. fixed signs, always appear).
      # Match on name+text together because note titles are not guaranteed unique.
      if player_state['notes'].present? && room['objects'].present?
        saved_notes = player_state['notes']
        room['objects'].reject! do |obj|
          next false unless obj['type'] == 'notes' && obj['takeable']
          obj_name = obj['name'].to_s
          obj_text = obj['text'].to_s
          saved_notes.any? do |n|
            n['title'].to_s == obj_name &&
              (obj_text.empty? || n['text'].to_s.start_with?(obj_text))
          end
        end
      end

      # Mark previously-unlocked objects as locked=false so the client skips the
      # lock minigame and opens them directly on interaction.
      if player_state['unlockedObjects'].present? && room['objects'].present?
        unlocked_ids = player_state['unlockedObjects']
        room['objects'].each_with_index do |obj, index|
          client_generated_id = "#{room_id}_#{obj['type']}_#{index}"
          if unlocked_ids.include?(obj['id']) ||
             unlocked_ids.include?(obj['name']) ||
             unlocked_ids.include?(client_generated_id)
            obj['locked'] = false
          end
        end
      end
    end

    # Unlock validation
    def validate_unlock(target_type, target_id, attempt, method)
      Rails.logger.info "[BreakEscape] validate_unlock: type=#{target_type}, id=#{target_id}, attempt=#{attempt}, method=#{method}"

      if target_type == 'door'
        # Check if already unlocked in player state (grants access regardless of method)
        if room_unlocked?(target_id)
          Rails.logger.info "[BreakEscape] Door already unlocked in player state, granting access"
          return true
        end

        room = room_data(target_id)
        return false unless room

        Rails.logger.debug "[BreakEscape] Room data: locked=#{room['locked']}, lockType=#{room['lockType']}, requires=#{room['requires']}"

        # If room is LOCKED, it requires validation
        if room['locked']
          Rails.logger.info "[BreakEscape] Room is LOCKED, method must be valid: #{method}"

          # Handle method='unlocked' - REJECT for locked doors
          if method == 'unlocked'
            Rails.logger.warn "[BreakEscape] SECURITY VIOLATION: Client sent method='unlocked' for LOCKED door: #{target_id}"
            return false
          end

          # NPC unlock: Validate NPC has been encountered and has permission to unlock this door
          if method == 'npc'
            npc_id = attempt  # NPC id is passed as 'attempt'
            return validate_npc_unlock(npc_id, target_id)
          end

          result = case method
          when 'key'
            # Server validates player has the correct key in inventory
            is_valid = room['requires'].present? && has_key_in_inventory?(room['requires'])
            Rails.logger.info "[BreakEscape] Key validation result: #{is_valid}"
            is_valid
          when 'lockpick'
            # Server validates player has lockpick in inventory
            # Lockpick can bypass any key-based lock
            is_valid = has_lockpick_in_inventory?
            Rails.logger.info "[BreakEscape] Lockpick validation result: #{is_valid}"
            is_valid
          when 'biometric', 'bluetooth', 'rfid'
            # Client validated these - trust it
            # (player had fingerprint, had bluetooth device, had RFID card)
            Rails.logger.info "[BreakEscape] #{method} validation passed (trusted client)"
            true
          when 'pin', 'password'
            # Server validates password/PIN attempts
            is_valid = room['requires'].to_s == attempt.to_s
            Rails.logger.info "[BreakEscape] #{method} validation result: #{is_valid}"
            is_valid
          else
            Rails.logger.warn "[BreakEscape] SECURITY VIOLATION: No valid unlock method for LOCKED door: #{target_id}, method=#{method}"
            false
          end

          Rails.logger.info "[BreakEscape] validate_unlock returning: #{result}"
          result
        else
          # Room is unlocked
          if method == 'unlocked'
            Rails.logger.info "[BreakEscape] Door is unlocked in scenario data, granting access"
            true
          else
            Rails.logger.warn "[BreakEscape] Client sent method='#{method}' for UNLOCKED door: #{target_id}, but room has no lock"
            true # Still allow access since room is unlocked
          end
        end
      else
        # Check if already unlocked in player state (grants access regardless of method)
        if object_unlocked?(target_id)
          Rails.logger.info "[BreakEscape] Object already unlocked in player state, granting access"
          return true
        end

        # Find object in all rooms - check id, name, or generated client ID
        object = nil
        scenario_data['rooms'].each do |room_id, room_data|
          next unless room_data['objects']
          room_data['objects'].each_with_index do |obj, index|
            # Client generates IDs as: roomId_type_index
            client_generated_id = "#{room_id}_#{obj['type']}_#{index}"
            if obj['id'] == target_id || obj['name'] == target_id || client_generated_id == target_id
              object = obj
              break
            end
          end
          break if object
        end

        if object
          Rails.logger.info "[BreakEscape] Found object: id=#{object['id']}, name=#{object['name']}, locked=#{object['locked']}, requires=#{object['requires']}"

          # Handle method='unlocked' - verify against scenario data
          if method == 'unlocked'
            if !object['locked']
              Rails.logger.info "[BreakEscape] Object is unlocked in scenario data, granting access"
              return true
            else
              Rails.logger.warn "[BreakEscape] SECURITY VIOLATION: Client sent method='unlocked' for LOCKED object: #{target_id}"
              return false
            end
          end

          # NPC unlock: Validate NPC has been encountered and has permission to unlock this object
          if method == 'npc'
            npc_id = attempt  # NPC id is passed as 'attempt'
            return validate_npc_unlock(npc_id, target_id)
          end

          case method
          when 'key', 'lockpick', 'biometric', 'bluetooth', 'ble', 'rfid', 'flag_reward'
            # Client validated the unlock - trust it
            return true
          when 'flag'
            # Resolve the flag reference and validate — client never sees the correct value
            actual_flag = resolve_flag_ref(object['requires'])
            result = actual_flag.present? && actual_flag.downcase == attempt.to_s.downcase
            Rails.logger.info "[BreakEscape] Flag lock validation: result=#{result}"
            return result
          when 'pin', 'password'
            result = object['requires'].to_s == attempt.to_s
            Rails.logger.info "[BreakEscape] Password validation: required='#{object['requires']}', attempt='#{attempt}', result=#{result}"
            return result
          end
        end
        Rails.logger.warn "[BreakEscape] Object not found: #{target_id}"
        false
      end
    end

    # Validate NPC unlock permission
    def validate_npc_unlock(npc_id, target_id)
      Rails.logger.info "[BreakEscape] Validating NPC unlock: npc=#{npc_id}, target=#{target_id}"

      # Find NPC in scenario data
      npc = find_npc_in_scenario(npc_id)
      unless npc
        Rails.logger.warn "[BreakEscape] NPC not found: #{npc_id}"
        return false
      end

      # Check if player has encountered this NPC
      unless player_state['encounteredNPCs']&.include?(npc_id)
        Rails.logger.warn "[BreakEscape] Player has not encountered NPC: #{npc_id}"
        return false
      end

      # Check if NPC has permission to unlock this target
      unlockable = npc['unlockable']
      unless unlockable.is_a?(Array) && unlockable.include?(target_id)
        Rails.logger.warn "[BreakEscape] NPC #{npc_id} does not have permission to unlock #{target_id}"
        return false
      end

      Rails.logger.info "[BreakEscape] NPC unlock validated: #{npc_id} can unlock #{target_id}"
      true
    end

    # Find NPC in scenario data
    def find_npc_in_scenario(npc_id)
      scenario_data['rooms']&.each do |_room_id, room_data|
        room_data['npcs']&.each do |npc|
          return npc if npc['id'] == npc_id
        end
      end
      nil
    end

    # ==========================================
    # Objectives System
    # ==========================================

    # Initialize objectives state structure
    def initialize_objectives
      return unless scenario_data['objectives'].present?

      player_state['objectivesState'] ||= {
        'aims' => {},      # { aimId: { status, completedAt } }
        'tasks' => {},     # { taskId: { status, progress, completedAt } }
        'itemCounts' => {} # { itemType: count } for collect objectives
      }
    end

    # Complete a task with server-side validation
    def complete_task!(task_id, validation_data = {})
      initialize_objectives

      task = find_task_in_scenario(task_id)
      return { success: false, error: 'Task not found' } unless task

      # Check if already completed
      if player_state.dig('objectivesState', 'tasks', task_id, 'status') == 'completed'
        return { success: true, taskId: task_id, message: 'Already completed' }
      end

      # Validate based on task type
      case task['type']
      when 'collect_items'
        unless validate_collection(task, validation_data)
          return { success: false, error: 'Insufficient items collected' }
        end
      when 'unlock_room'
        unless room_unlocked?(task['targetRoom'])
          return { success: false, error: 'Room not unlocked' }
        end
      when 'unlock_object'
        unless object_unlocked?(task['targetObject'])
          return { success: false, error: 'Object not unlocked' }
        end
      when 'npc_conversation'
        target_npc = task['targetNPC'] || task['targetNpc']
        unless npc_encountered?(target_npc)
          return { success: false, error: 'NPC not encountered' }
        end
      when 'enter_room'
        # Room entry is validated by the client having discovered the room
        # Trust the client for this low-stakes validation
      when 'submit_flags'
        unless validate_flag_submission(task, validation_data[:submittedFlags])
          return { success: false, error: 'Not all required flags submitted' }
        end
      when 'custom'
        # Custom tasks are completed via ink tags - no validation needed
      end

      # Capture before any completion side-effects so we can report whether this
      # save is the one that first triggers mission conclusion.
      was_concluded_before = mission_concluded_at.nil?

      # Mark task complete
      player_state['objectivesState']['tasks'][task_id] = {
        'status' => 'completed',
        'completedAt' => Time.current.iso8601
      }

      # Process onComplete actions
      process_task_completion(task)

      # Check if aim is now complete (may set mission_concluded_at)
      # Returns false when a missionConclusion aim's requiresCompleted gate is unmet
      conclusion_result = check_aim_completion(task['aimId'])

      # This task may be a requiresCompleted gate task for a *different*
      # missionConclusion aim that already finished its own tasks earlier
      # and was blocked pending this one — re-check those too.
      recheck_pending_mission_conclusions!

      # Update statistics
      self.tasks_completed = (self.tasks_completed || 0) + 1
      self.score = calculate_task_score.round

      save!

      mission_just_concluded = was_concluded_before && mission_concluded_at.present?
      response = { success: true, taskId: task_id, missionConcluded: mission_just_concluded }
      response[:warning] = 'Complete required objectives first to conclude the mission.' if conclusion_result == false
      response
    end

    # Update task progress (for collect_items and submit_flags tasks)
    def update_task_progress!(task_id, progress, submitted_flags = nil)
      initialize_objectives

      progress = [progress, 0].max
      task = find_task_in_scenario(task_id)
      if (max_progress = task&.dig('maxProgress'))
        progress = [progress, max_progress].min
      end

      player_state['objectivesState']['tasks'][task_id] ||= {}
      player_state['objectivesState']['tasks'][task_id]['progress'] = progress

      # Store submittedFlags for submit_flags tasks
      if submitted_flags.is_a?(Array)
        player_state['objectivesState']['tasks'][task_id]['submittedFlags'] = submitted_flags
      end

      save!

      { success: true, taskId: task_id, progress: progress }
    end

    # Get current objectives state
    def objectives_state
      {
        'objectives' => filter_target_flags(scenario_data['objectives']&.map(&:deep_dup)),
        'state' => player_state['objectivesState'] || {}
      }
    end

    # Aim/Task status helpers
    def aim_status(aim_id)
      player_state.dig('objectivesState', 'aims', aim_id, 'status') || 'active'
    end

    def task_status(task_id)
      player_state.dig('objectivesState', 'tasks', task_id, 'status') || 'active'
    end

    def task_progress(task_id)
      player_state.dig('objectivesState', 'tasks', task_id, 'progress') || 0
    end

    # Server-side task completion driven by flag submission.
    # Called from submit_flag after a flag is validated and recorded.
    #
    # flag_ids is the set of identifiers this one submission can satisfy — the
    # station-qualified form and the legacy unqualified form (a bare String is
    # still accepted). A submit_flags task matches if its targetFlags contains
    # ANY of them.
    #
    # What gets recorded in submittedFlags is the matched targetFlags ENTRY, not
    # the identifier that matched it. For an unqualified target the two strings
    # are identical, so this is a no-op for every already-cached scenario_data —
    # and it keeps the all-submitted check working against progress a live game
    # persisted before this change, so a half-finished multi-flag task still
    # completes when its remaining flag arrives.
    #
    # Returns { completed_tasks: [...taskIds], updated_tasks: [...taskIds] }
    def process_flag_task_completions!(flag_ids)
      initialize_objectives
      candidate_ids   = Array(flag_ids)
      completed_tasks = []
      updated_tasks   = []

      scenario_data['objectives']&.each do |aim|
        aim_id = aim['aimId']

        aim['tasks']&.each do |task|
          next unless task['type'] == 'submit_flags'

          # Which of this task's targetFlags does this submission satisfy?
          matched = Array(task['targetFlags']) & candidate_ids
          next if matched.empty?

          task_id = task['taskId']

          # Skip already-completed tasks
          next if player_state.dig('objectivesState', 'tasks', task_id, 'status') == 'completed'

          # Record the matched targetFlags entries in submittedFlags (merge, not
          # replace) so stored progress stays in the same form as targetFlags.
          player_state['objectivesState']['tasks'][task_id] ||= {}
          task_state = player_state['objectivesState']['tasks'][task_id]
          task_state['submittedFlags'] ||= []

          matched.each do |entry|
            task_state['submittedFlags'] << entry unless task_state['submittedFlags'].include?(entry)
          end

          # Check if all targetFlags are now submitted
          all_submitted = Array(task['targetFlags']).all? do |tf|
            task_state['submittedFlags'].include?(tf)
          end

          if all_submitted
            # Mark complete (merge-style — preserves submittedFlags)
            task_state['status']      = 'completed'
            task_state['completedAt'] = Time.current.iso8601
            # process_task_completion expects aimId on the task hash
            process_task_completion(task.merge('aimId' => aim_id))
            check_aim_completion(aim_id)
            self.tasks_completed = (self.tasks_completed || 0) + 1
            completed_tasks << task_id
          else
            updated_tasks << task_id
          end
        end
      end

      recheck_pending_mission_conclusions! if completed_tasks.any?

      save! if completed_tasks.any? || updated_tasks.any?
      { completed_tasks: completed_tasks, updated_tasks: updated_tasks }
    end

    private

    # NOTE: targetFlags must be authored in the DISPLAY form the controller
    # generates ("hospital_backup_server-flag1"), not the scenario reference
    # form ("hospital_backup_server:flag_1"). The comparison above is a plain
    # string match, so a reference-form entry silently never completes its task.
    # Normalising here was tried and reverted: m01 is deployed and mixes both
    # forms, so normalisation would newly complete its submit_ssh_flag task and
    # unlock decrypt_entropy_intel earlier than live players see it.
    #
    # Two authored forms now work, and only these two:
    #   "hospital_backup_server-flag1"                        any station (legacy)
    #   "flag_station_dropsite:hospital_backup_server-flag1"  that station only
    # The second is a station key (id, or name when the station has no id)
    # prefixed to the display form. Do not confuse it with the scenario
    # reference form "hospital_backup_server:flag_1", which still never matches.

    # Set mission_concluded_at when a missionConclusion aim completes, and
    # transition the game to completed status so Hacktivity shows it as done
    # and GameCompletionScoringJob can record completed_flags_date.
    # Called from check_aim_completion — does NOT call save! (caller is responsible).
    # Also acts as a backstop for paths that bypass complete_task! (e.g. process_flag_task_completions!).
    def check_mission_conclusion(aim)
      return unless aim['missionConclusion']
      return unless mission_concluded_at.nil?

      required_task_ids = Array(aim['requiresCompleted'])
      if required_task_ids.any?
        unmet = required_task_ids.reject do |req_id|
          player_state.dig('objectivesState', 'tasks', req_id, 'status') == 'completed'
        end
        return false if unmet.any?  # gate blocked
      end

      now = Time.current
      self.mission_concluded_at = now
      self.status               = 'completed'
      self.completed_at         = now
      true  # concluded
    end

    # Re-evaluate any missionConclusion aims whose own tasks are already
    # complete but whose requiresCompleted gate wasn't satisfied at the time
    # they first tried to conclude. A gate task can belong to a *different*
    # aim and complete afterward — check_aim_completion only re-runs
    # check_mission_conclusion for the aim owning the task that just
    # completed, so without this, that later gate task never re-triggers
    # conclusion for the aim that was blocked on it.
    def recheck_pending_mission_conclusions!
      return if mission_concluded_at.present?

      scenario_data['objectives']&.each do |aim|
        next unless aim['missionConclusion']
        next unless player_state.dig('objectivesState', 'aims', aim['aimId'], 'status') == 'completed'

        break if check_mission_conclusion(aim)
      end
    end

    # Find a task in scenario objectives by taskId
    def find_task_in_scenario(task_id)
      scenario_data['objectives']&.each do |aim|
        task = aim['tasks']&.find { |t| t['taskId'] == task_id }
        return task.merge('aimId' => aim['aimId']) if task
      end
      nil
    end

    # Validate collection tasks
    # Supports both type-based matching (targetItems) and ID-based matching (targetItemIds)
    # validation_data may include currentCount from the client to handle async inventory race conditions
    def validate_collection(task, validation_data = {})
      target_count = task['targetCount'] || 1

      # Trust client-provided currentCount for collect_items tasks.
      # Notes-type items are registered via addToInventory but skip the inventory UI,
      # so the inventory array may not reflect them yet when the completion request arrives.
      if validation_data[:currentCount].present? && validation_data[:currentCount].to_i >= target_count
        return true
      end

      inventory = player_state['inventory'] || []
      target_items = Array(task['targetItems'] || [])
      target_item_ids = Array(task['targetItemIds'] || [])

      count = inventory.count do |item|
        item_type = item['type'] || item.dig('scenarioData', 'type')
        item_id = item['id'] || item.dig('scenarioData', 'id')
        item_name = item['name'] || item.dig('scenarioData', 'name')
        identifier = item_id || item_name

        matches = false

        # Type-based matching
        if target_items.any?
          matches = target_items.include?(item_type)
        end

        # ID-based matching (more specific)
        if target_item_ids.any?
          matches = target_item_ids.include?(identifier)
        end

        # If both specified, match either
        if target_items.any? && target_item_ids.any?
          type_match = target_items.include?(item_type)
          id_match = target_item_ids.include?(identifier)
          matches = type_match || id_match
        end

        matches
      end

      count >= target_count
    end

    # Validate submit_flags tasks.
    # submitted_flags_from_request MUST be provided — stored state is never used
    # for validation to prevent pre-injection via update_task_progress.
    def validate_flag_submission(task, submitted_flags_from_request = nil)
      return false unless task['targetFlags'].is_a?(Array)

      # Require flags to be supplied in the request body; reject attempts that
      # omit them (which would otherwise fall through to manipulable stored state).
      return false unless submitted_flags_from_request.present?

      submitted = Array(submitted_flags_from_request)
      Rails.logger.debug "[BreakEscape] Validating flags using request data: #{submitted.inspect}"

      # Check that all targetFlags are in submittedFlags
      all_submitted = task['targetFlags'].all? { |target_flag| submitted.include?(target_flag) }

      Rails.logger.debug "[BreakEscape] Flag validation: targetFlags=#{task['targetFlags'].inspect}, submitted=#{submitted.inspect}, result=#{all_submitted}"

      all_submitted
    end

    # Check if NPC was encountered
    def npc_encountered?(npc_id)
      player_state['encounteredNPCs']&.include?(npc_id)
    end

    # Process task.onComplete actions
    def process_task_completion(task)
      return unless task['onComplete']

      if task['onComplete']['unlockTask']
        unlock_objective_task!(task['onComplete']['unlockTask'])
      end

      if task['onComplete']['unlockAim']
        unlock_objective_aim!(task['onComplete']['unlockAim'])
      end
    end

    # Unlock a task (change status to active)
    def unlock_objective_task!(task_id)
      player_state['objectivesState']['tasks'][task_id] ||= {}
      player_state['objectivesState']['tasks'][task_id]['status'] = 'active'
    end

    # Unlock an aim (change status to active)
    def unlock_objective_aim!(aim_id)
      player_state['objectivesState']['aims'][aim_id] ||= {}
      player_state['objectivesState']['aims'][aim_id]['status'] = 'active'
    end

    # Check if all tasks in an aim are complete
    def check_aim_completion(aim_id)
      aim = scenario_data['objectives']&.find { |a| a['aimId'] == aim_id }
      return unless aim

      # Already counted — without this guard, completing a later optional
      # task in an aim that's already 'completed' would re-run the block
      # below and double-increment objectives_completed, pushing score
      # past 100%.
      return if player_state.dig('objectivesState', 'aims', aim_id, 'status') == 'completed'

      all_complete = aim['tasks'].all? do |task|
        task['optional'] == true || task_status(task['taskId']) == 'completed'
      end

      if all_complete
        player_state['objectivesState']['aims'][aim_id] = {
          'status' => 'completed',
          'completedAt' => Time.current.iso8601
        }
        self.objectives_completed = (self.objectives_completed || 0) + 1
        check_mission_conclusion(aim)  # returns true (concluded), false (gate blocked), nil (not a conclusion aim)
      end
    end

    # ==========================================
    # End Objectives System
    # ==========================================

    # Strip targetFlags from every task in an objectives array.
    # targetFlags are the expected flag answers used server-side for validation;
    # they must never reach the client.
    def filter_target_flags(objectives)
      return objectives unless objectives.is_a?(Array)

      objectives.map do |aim|
        aim = aim.dup
        aim['tasks'] = aim['tasks']&.map do |task|
          task = task.dup
          task.delete('targetFlags')
          task
        end
        aim
      end
    end

    def filter_requires_and_contents_recursive(obj)
      case obj
      when Hash
        # Remove 'requires' for exploitable lock types (key/pin/password)
        # Keep it for biometric/bluetooth/rfid since they reference collectible items, not answers
        # - biometric: requires fingerprint owner name (e.g., "Mrs Moo")
        # - bluetooth: requires device MAC/name (e.g., "00:11:22:33:44:55")
        # - rfid: requires card IDs (e.g., ["master_keycard"])
        lock_type = obj['lockType']
        if lock_type && !%w[biometric bluetooth rfid].include?(lock_type)
          obj.delete('requires')
        end

        # Remove 'contents' if locked (lazy-loaded via separate endpoint)
        obj.delete('contents') if obj['locked']

        # Strip flag values from flag-stations / launch-devices. The top-level
        # 'flags' block is deleted in filtered_scenario_for_bootstrap, but each
        # station carries its OWN ordered 'flags' array, which rode along in the
        # lazy-loaded room payload and handed the player every answer.
        #
        # The client never needs the values: submission is validated server-side
        # (POST /games/:id/flags) and the only client use was `.length`, so send
        # the count instead. Entries may be references ("vm:flag_n") or literal
        # values; strip either way rather than trying to tell them apart.
        if obj['flags'].is_a?(Array)
          obj['flagCount'] = obj['flags'].length
          obj.delete('flags')
        end
        # hintOnlyFlags is a Hash of flag-ref => hint message. It is consumed
        # entirely server-side (find_hint_only_message); the client never reads
        # it, so remove it outright rather than keeping a count.
        obj.delete('hintOnlyFlags')

        # Keep lockType - client needs it to show correct UI
        # Keep locked - client needs it to show lock status

        # Recursively filter nested objects, NPCs, tableItems and NPC-held items.
        # itemsHeld matters: an NPC can carry a flag-station or launch-device
        # (see find_flag_station_for_flag), so skipping it leaves a leak.
        obj['objects']&.each { |o| filter_requires_and_contents_recursive(o) }
        obj['npcs']&.each { |n| filter_requires_and_contents_recursive(n) }
        obj['tableItems']&.each { |t| filter_requires_and_contents_recursive(t) }
        obj['itemsHeld']&.each { |i| filter_requires_and_contents_recursive(i) }

      when Array
        obj.each { |item| filter_requires_and_contents_recursive(item) }
      end
    end

    def generate_scenario_data
      # Only generate scenario data if it's not already set (e.g., in tests)
      return if self.scenario_data.present?

      # Build VM context only if mission requires VMs and we're in Hacktivity mode
      vm_context = if mission&.requires_vms? && BreakEscape::Mission.hacktivity_mode?
                     build_vm_context
      else
                     {}
      end

      # Add flags_by_vm and vm_ips from player_state for standalone mode
      state = player_state.is_a?(Hash) ? player_state : {}
      if state['flags_by_vm'].present?
        vm_context['flags_by_vm'] = state['flags_by_vm']
      end
      if state['vm_ips'].present?
        vm_context['vm_ips'] = state['vm_ips']
      end

      # Generate with VM context (or empty context for non-VM missions)
      self.scenario_data = mission.generate_scenario_data(vm_context)

      # Inject player preferences into scenario
      inject_player_preferences(self.scenario_data)

      # Stamp stable object IDs into scenario_data now, once, so every downstream
      # code path (item_in_room?, apply_room_state_changes!, client fetch) reads
      # the same id without ever re-deriving it from an index.
      stamp_scenario_object_ids!
    end

    # Write a stable 'id' field onto every scenario object and container item that
    # lacks one. Top-level objects mirror rooms.js: `${roomId}_${type}_${index}`.
    # Nested contents encode their full path: `${parent_id}_content_${index}`.
    # Called once at game creation so every ID is persisted to the DB and both
    # the server and client always read the same value without reconstruction.
    def stamp_scenario_object_ids!
      scenario_data['rooms']&.each do |room_id, room|
        room['objects']&.each_with_index do |obj, i|
          obj['id'] ||= "#{room_id}_#{obj['type']}_#{i}"
          stamp_contents_ids!(obj)
        end
      end
    end

    # Recursively stamp IDs on items nested inside a container's 'contents' array.
    def stamp_contents_ids!(parent_obj)
      parent_obj['contents']&.each_with_index do |item, i|
        item['id'] ||= "#{parent_obj['id']}_content_#{i}"
        stamp_contents_ids!(item) # recurse for sub-containers
      end
    end

    def initialize_player_state
      # Ensure player_state is always a hash
      self.player_state = {} unless self.player_state.is_a?(Hash)

      self.player_state['currentRoom'] ||= scenario_data['startRoom']
      self.player_state['unlockedRooms'] ||= [scenario_data['startRoom']]
      self.player_state['unlockedObjects'] ||= []

      # Ensure inventory is always an array, even if it was corrupted
      unless self.player_state['inventory'].is_a?(Array)
        self.player_state['inventory'] = []
      end

      # Initialize starting items from scenario (only if inventory is empty)
      # This prevents duplicates if initialize_player_state is called multiple times
      if scenario_data && scenario_data['startItemsInInventory'] && self.player_state['inventory'].empty?
        start_items = scenario_data['startItemsInInventory']
        if start_items.is_a?(Array)
          # Use dup instead of deep_dup to avoid issues with ActiveSupport extensions
          start_items.each do |item|
            self.player_state['inventory'] << (item.is_a?(Hash) ? item.dup : item)
          end
        else
          Rails.logger.warn "[BreakEscape] startItemsInInventory is not an Array: #{start_items.class}"
        end
      end

      self.player_state['encounteredNPCs'] ||= []
      self.player_state['globalVariables'] ||= {}
      self.player_state['biometricSamples'] ||= []
      self.player_state['biometricUnlocks'] ||= []
      self.player_state['bluetoothDevices'] ||= []
      self.player_state['notes'] ||= []
      self.player_state['health'] ||= 100

      # VM/Flag tracking fields
      self.player_state['submitted_flags'] ||= []       # Array of submitted flag strings
      self.player_state['flag_rewards_claimed'] ||= []  # Track claimed rewards
      self.player_state['pending_events'] ||= []        # Events to emit on next sync

      # Dynamic room state tracking (delta overlay on scenario_data)
      self.player_state['room_states'] ||= {}           # Hash of room modifications
    end

    def set_started_at
      self.started_at ||= Time.current
    end

    def set_scoring_totals
      return unless scenario_data.present?

      objectives = scenario_data['objectives'] || []

      self.total_tasks = objectives.sum { |aim| (aim['tasks'] || []).size }
      self.total_aims = objectives.size

      Rails.logger.info "Game #{id}: Set total_tasks=#{total_tasks}, total_aims=#{total_aims}"
    end

    # Build VM context from player_state vm_set_id (Hacktivity mode only)
    def build_vm_context
      # CRITICAL: player_state may still be a JSON string during callbacks
      # Ensure it's a hash before attempting to access it
      state = player_state.is_a?(Hash) ? player_state : {}
      vm_set_id = state['vm_set_id']

      return {} unless vm_set_id && BreakEscape::Mission.hacktivity_mode?

      vm_set = ::VmSet.find_by(id: vm_set_id)
      return {} unless vm_set

      # Eager-load associations to avoid N+1 queries
      sec_gen_batch = vm_set.sec_gen_batch

      # Build context hash for ERB template
      {
        'vm_set_id' => vm_set.id,
        'vms' => vm_set.vms.map do |vm|
          {
            'id' => vm.id,
            'title' => vm.title,
            'ip' => vm.ip_address,
            'enable_console' => vm.respond_to?(:enable_console) ? vm.enable_console : false,
            # event_id and sec_gen_batch_id come from the vm_set's batch, not the VM itself
            'event_id' => sec_gen_batch.event_id,
            'sec_gen_batch_id' => sec_gen_batch.id
          }
        end,
        # flags_by_vm is a hash of vm_title => [flag_key, ...] used by flags_for_vm() in ERB templates
        'flags_by_vm' => extract_flags_by_vm(vm_set),
        'hacktivity_mode' => true
      }
    end

    # Build a hash of vm_title => [flag_key, ...] for use in ERB scenario templates.
    # In Hacktivity, flags belong to individual VMs (not to SecGenBatch).
    def extract_flags_by_vm(vm_set)
      vm_set.vms.each_with_object({}) do |vm, hash|
        # Hacktivity's read_secgen_flags_job inserts flags in reverse XML order,
        # so reversing here restores flag_1..flag_N to match the scenario's references.
        hash[vm.title] = vm.flags.order(:id).map(&:flag_key).reverse
      end
    end

    # Inject player preferences into scenario data
    def inject_player_preferences(scenario_data)
      player_pref = if player.respond_to?(:break_escape_preference)
                      player.break_escape_preference
      elsif player.respond_to?(:preference)
                      player.preference
      end

      return unless player_pref&.selected_sprite # Safety: don't inject if nil

      # Map simplified sprite name to actual filename
      sprite_filename = PlayerPreference.sprite_filename(player_pref.selected_sprite)

      scenario_data['player'] ||= {}
      scenario_data['player']['spriteSheet'] = sprite_filename
      scenario_data['player']['displayName'] = player_pref.in_game_name
    end

    public

    # ==========================================
    # Flag Submission System
    # ==========================================

    # Submit a CTF flag
    def submit_flag(flag_key)
      # Check if already submitted
      if flag_submitted?(flag_key)
        # Backward compat: a flag previously consumed by the wrong station (under old
        # buggy code where find_flag_station_for_flag missed launch-device room objects)
        # may already be solved in the Hacktivity DB. Check the DB directly — if the
        # flag is solved there, allow game-side processing (task completions, rewards)
        # to proceed. The caller skips re-calling FlagService in this case.
        if BreakEscape::Mission.hacktivity_mode? && hacktivity_flag_solved?(flag_key)
          return { success: true, message: 'Flag accepted!', already_in_hacktivity: true }
        end
        return { success: false, message: 'Flag already submitted' }
      end

      # Validate flag exists in scenario
      valid_flags = extract_valid_flags_from_scenario
      unless valid_flags.any? { |f| f.downcase == flag_key.downcase }
        return { success: false, message: 'Invalid flag' }
      end

      # Submit to Hacktivity if in Hacktivity mode
      if BreakEscape::Mission.hacktivity_mode? && player_state['vm_set_id'].present?
        result = submit_to_hacktivity(flag_key)
        return result unless result[:success]
      end

      # Track submission
      player_state['submitted_flags'] ||= []
      player_state['submitted_flags'] << flag_key
      save!

      { success: true, message: 'Flag accepted!' }
    end

    # Check if flag was already submitted
    def flag_submitted?(flag_key)
      player_state['submitted_flags']&.any? { |f| f.downcase == flag_key.downcase }
    end

    private

    # Extract valid flags from scenario data (flag-station objects)
    def extract_valid_flags_from_scenario
      flags = []

      # Check standalone flags first (flat list for backward compatibility)
      if player_state['standalone_flags'].present?
        flags.concat(player_state['standalone_flags'])
      end

      # Check flags_by_vm (new XML-based format)
      if player_state['flags_by_vm'].present?
        player_state['flags_by_vm'].each_value do |vm_flags|
          flags.concat(vm_flags) if vm_flags.is_a?(Array)
        end
      end

      # Extract from top-level flags section (reference-based system — primary source)
      if scenario_data['flags'].is_a?(Hash)
        scenario_data['flags'].each_value do |vm_flags|
          flags.concat(vm_flags.values.compact) if vm_flags.is_a?(Hash)
        end
      end

      # Extract from flag-station and launch-device objects in scenario (backward compat: literal values only)
      scenario_data['rooms']&.each do |_room_id, room|
        room['objects']&.each do |obj|
          next unless obj['type'] == 'flag-station' || obj['type'] == 'launch-device'
          obj['flags']&.each { |f| flags << f unless f.include?(':') }
        end
      end

      flags.uniq
    end

    # Check whether this flag is already solved in the Hacktivity Flag DB.
    # Used for backward compat when a flag was previously consumed by the wrong
    # station but already counted in Hacktivity.
    def hacktivity_flag_solved?(flag_key)
      return false unless defined?(::Flag) && player_state['vm_set_id'].present?

      vm_set = ::VmSet.find_by(id: player_state['vm_set_id'])
      return false unless vm_set

      ::Flag.joins(:vm)
            .where('vms.vm_set_id': vm_set.id)
            .where('lower(flags.flag_key) = ?', flag_key.downcase)
            .where(solved: true)
            .exists?
    end

    # Submit flag to Hacktivity's FlagService
    def submit_to_hacktivity(flag_key)
      return { success: false, message: 'FlagService not available' } unless defined?(::FlagService)
      return { success: false, message: 'No VM set associated' } unless player_state['vm_set_id'].present?

      vm_set = ::VmSet.find_by(id: player_state['vm_set_id'])
      return { success: false, message: 'VM set not found' } unless vm_set

      # Find the specific VM that owns this flag — FlagService.process_flag takes a VM, not a user
      target_vm = vm_set.vms.find do |vm|
        vm.flags.any? { |f| f.flag_key.downcase == flag_key.downcase }
      end
      return { success: false, message: 'Flag not found in VM set' } unless target_vm

      begin
        # FlagService.process_flag(vm, submitted_flag, user, flash)
        mock_flash = {}
        ::FlagService.process_flag(target_vm, flag_key, vm_set.user || player, mock_flash)
        { success: true, message: mock_flash[:notice] || 'Flag submitted to Hacktivity' }
      rescue StandardError => e
        Rails.logger.error "[BreakEscape] FlagService error: #{e.message}"
        { success: false, message: 'Error submitting flag to Hacktivity' }
      end
    end
  end
end
