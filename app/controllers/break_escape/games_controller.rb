require 'open3'

module BreakEscape
  class GamesController < ApplicationController
    helper PlayerPreferencesHelper

    # Phaser.js creates blob-URL web workers (physics, audio) and uses eval
    # internally. Fonts are loaded via direct <link> tags (no JS loader) so
    # no CDN script allowlist is needed beyond self/https.
    #
    # unsafe-inline is included as a fallback for standalone mode (no nonce
    # generator configured). When the host app (e.g. Hacktivity) provides a
    # nonce, modern browsers see 'nonce-xxx' in the header and automatically
    # ignore unsafe-inline — so there is no security regression in mounted mode.
    content_security_policy do |policy|
      policy.default_src :self, :https
      policy.font_src    :self, :https, :data
      policy.img_src     :self, :https, :data, :blob
      policy.object_src  :none
      policy.script_src  :self, :https, :unsafe_eval, :unsafe_inline, :blob
      policy.style_src   :self, :https, :unsafe_inline
      policy.connect_src :self, :https, "wss:"
      policy.media_src   :self, :https, :data, :blob
      policy.worker_src  :self, :blob
    end

    before_action :set_game, only: [:show, :scenario, :scenario_map, :ink, :room, :container, :sync_state, :update_room, :unlock, :inventory, :objectives, :complete_task, :update_task_progress, :submit_flag, :tts, :reset, :new_session, :vm_panel, :vm_set_panel, :conclude_mission]

    # Actions that read-modify-write @game.player_state and then save! need a
    # row lock, or two concurrent requests for the same game (e.g. a single
    # client event that fires several completeTask calls without awaiting
    # each other) can race: both load the same pre-update player_state, and
    # whichever save! commits last silently overwrites the other's change.
    #
    # FUTURE IMPROVEMENT (not yet needed — no evidence of lock contention):
    # complete_task and submit_flag are the only two of these actions whose
    # writes depend on reading *multiple* player_state keys to decide what to
    # write (check_aim_completion / check_mission_conclusion evaluate every
    # task in an aim, and gate tasks that can belong to a different aim, before
    # deciding whether to flip a status or bump objectives_completed/score).
    # That's exactly the kind of compound, conditional read-then-write that
    # can't be expressed as a single atomic per-path SQL update — Postgres's
    # own row-level MVCC can't help you if the *decision* of what to write
    # requires Ruby-side business logic across several keys.
    #
    # The other actions here (container, sync_state, update_room, unlock,
    # update_task_progress, reset, new_session) only set or append to a single
    # independent JSON path each time (currentRoom, a note, an unlocked room
    # id, a task's progress counter, etc.) — two concurrent writers touching
    # *different* paths don't need to be serialized at all. If this lock ever
    # shows up as real contention, those actions are the candidates to move to
    # atomic per-path writes (e.g. Postgres jsonb_set in a single UPDATE) and
    # drop from this list, narrowing the locked surface down to just
    # complete_task/submit_flag. Doing so means bypassing/reimplementing the
    # ActiveRecord callbacks these actions currently get for free via a normal
    # save! (e.g. after_commit :fire_completion_callback relies on
    # previous_changes, which raw update_all doesn't populate), and writing
    # parallel SQL for the SQLite test adapter (no jsonb_set there) — so treat
    # this as a scoped, deliberate optimization to reach for if lock
    # contention is actually observed, not a default to prefer today.
    # inventory and room are on this list because they were found off it, the
    # expensive way. One ink line can fire #complete_task, #complete_task and
    # #give_item together, which the client sends as three parallel POSTs. The
    # two task writes took the lock; the unlocked inventory add read
    # player_state before them and saved after, discarding both. Game 1022 lost
    # seven tasks that way -- including talk_to_gary, an ending gate at the
    # time, so the mission could never conclude -- while every request
    # returned 200.
    #
    # The signature is a game whose tasks_completed counter exceeds the number
    # of entries in objectivesState.tasks: the counter is its own column and
    # survives the partial write, the JSON blob does not. Note this is not the
    # SQLite BusyException that was blamed for the same symptom earlier. Moving
    # to Postgres removed the error, not the race: the losing writer now
    # succeeds silently, so a client-side retry never fires.
    #
    # room is here for the same reason -- track_npc_encounters appends to
    # encounteredNPCs and saves, and npc_conversation tasks validate against
    # that list, so losing an entry rejects a legitimate completion.
    around_action :with_game_lock, only: [:container, :sync_state, :update_room, :unlock, :complete_task, :update_task_progress, :submit_flag, :reset, :new_session, :inventory, :room]

    # GET /games/new?mission_id=:id
    # Show VM set selection page for VM-required missions
    def new
      @mission = Mission.find(params[:mission_id])
      authorize @mission, :create_game? if defined?(Pundit)

      if @mission.requires_vms?
        @available_vm_sets = @mission.valid_vm_sets_for_user(current_player)
        @existing_games = Game.where(player: current_player, mission: @mission)
      end
    end

    # POST /games
    # Create a new game instance for a mission
    def create
      @mission = Mission.find(params[:mission_id])
      authorize @mission, :create_game? if defined?(Pundit)

      # Build initial player_state with VM/flag context
      initial_player_state = {}

      # Hacktivity mode with VM set
      if params[:vm_set_id].present? && defined?(::VmSet)
        vm_set = ::VmSet.find_by(id: params[:vm_set_id])
        return render json: { error: 'VM set not found' }, status: :not_found unless vm_set

        # Validate VM set belongs to user and matches mission
        if BreakEscape::Mission.hacktivity_mode?
          unless @mission.valid_vm_sets_for_user(current_user).include?(vm_set)
            return render json: { error: 'Invalid VM set for this mission' }, status: :forbidden
          end
          initial_player_state['vm_set_id'] = vm_set.id
        else
          # Standalone mode - vm_set_id shouldn't be used
          Rails.logger.warn "[BreakEscape] vm_set_id provided but not in Hacktivity mode, ignoring"
        end
      end

      # Standalone mode with VM IPs JSON
      if params[:vm_ips_json].present?
        begin
          vm_ips = JSON.parse(params[:vm_ips_json])
          initial_player_state['vm_ips'] = vm_ips if vm_ips.is_a?(Hash)
        rescue JSON::ParserError => e
          Rails.logger.warn "[BreakEscape] Invalid vm_ips_json: #{e.message}"
        end
      end

      # Standalone mode with XML flag hints
      if params[:flag_hints_xml].present?
        flags_by_vm = Mission.parse_flag_hints_xml(params[:flag_hints_xml])
        initial_player_state['flags_by_vm'] = flags_by_vm
        # Also store flat list for backward compatibility
        initial_player_state['standalone_flags'] = flags_by_vm.values.flatten.uniq
      # Legacy: comma-separated flags (backward compatibility)
      elsif params[:standalone_flags].present?
        flags = if params[:standalone_flags].is_a?(Array)
                  params[:standalone_flags]
        else
                  params[:standalone_flags].split(',').map(&:strip).reject(&:blank?)
        end
        initial_player_state['standalone_flags'] = flags
      end

      # CRITICAL: Set player_state BEFORE save! so callbacks can read vm_set_id
      # Callback order is:
      # 1. before_create :generate_scenario_data_with_context (reads player_state['vm_set_id'])
      # 2. before_create :initialize_player_state (adds default fields)
      @game = Game.new(
        player: current_player,
        mission: @mission
      )
      @game.player_state = initial_player_state
      @game.save!

      # Check if player's sprite is valid for this scenario
      player_pref = current_player_preference || create_default_preference

      if !player_pref.sprite_selected?
        # No sprite selected - MUST configure
        flash[:alert] = 'Please select your character before starting.'
        redirect_to configuration_path(game_id: @game.id)
      elsif !player_pref.sprite_valid_for_scenario?(@game.scenario_data)
        # Sprite selected but invalid for this scenario
        flash[:alert] = 'Your selected character is not available for this mission. Please choose another.'
        redirect_to configuration_path(game_id: @game.id)
      else
        # All good - start game
        redirect_to game_path(@game)
      end
    end

    def show
      authorize @game if defined?(Pundit)
      @mission = @game.mission

      # Load player preference data for the in-game modal
      @player_preference = current_player_preference || create_default_preference
      @available_sprites = PlayerPreference::AVAILABLE_SPRITES

      # Guard: player must have selected a valid sprite before entering the game
      if !@player_preference.sprite_selected?
        flash[:alert] = 'Please select your character before starting.'
        redirect_to configuration_path(game_id: @game.id) and return
      elsif !@player_preference.sprite_valid_for_scenario?(@game.scenario_data)
        flash[:alert] = 'Your selected character is not available for this mission. Please choose another.'
        redirect_to configuration_path(game_id: @game.id) and return
      end

      # All game sessions for this player + mission, ordered oldest first
      @mission_sessions = Game.where(player: current_player, mission: @mission)
                              .order(:created_at)
                              .pluck(:id)

      # Debug logging
      Rails.logger.info "[BreakEscape] Loading game#show for player: #{current_player.class.name}##{current_player.id}"
      Rails.logger.info "[BreakEscape] Player preference: #{@player_preference.inspect}"
      Rails.logger.info "[BreakEscape] Selected sprite: #{@player_preference.selected_sprite.inspect}"
    end

    # POST /games/:id/reset
    # Resets the game session to the initial state, preserving mission context
    #
    # Wrapped in with_game_lock (see around_action above): reset_player_state!
    # overwrites player_state wholesale, so it must not race with any other
    # in-flight write to the same game. It doesn't read multiple keys to
    # decide what to write, so it's a candidate to drop the lock if this ever
    # moves to atomic per-path writes — see the FUTURE IMPROVEMENT note above.
    def reset
      authorize @game if defined?(Pundit)
      @game.reset_player_state!
      render json: { success: true }
    rescue Pundit::NotAuthorizedError
      raise
    rescue => e
      Rails.logger.error "[BreakEscape] reset error: #{e.message}"
      render json: { success: false, error: e.message }, status: :internal_server_error
    end

    # POST /games/:id/new_session
    # Creates a fresh game record for the same mission, preserving VM context
    #
    # Wrapped in with_game_lock (see around_action above): the abandon-the-old-
    # game update below must not race with another write still in flight
    # against @game. It's a single status field flip, not a cross-key
    # decision, so it's a candidate to drop the lock if this ever moves to
    # atomic per-path writes — see the FUTURE IMPROVEMENT note above. (The new
    # Game record created afterward needs no locking — it doesn't exist yet.)
    def new_session
      authorize @game if defined?(Pundit)

      preserved_keys = %w[vm_set_id vm_ips flags_by_vm standalone_flags]
      initial_state = @game.player_state.is_a?(Hash) ? @game.player_state.slice(*preserved_keys) : {}

      # Abandon the current game before creating a new one.
      # The unique partial index allows only one in_progress game per player+mission.
      @game.update!(status: 'abandoned') if @game.status == 'in_progress'

      new_game = Game.new(player: current_player, mission: @game.mission)
      new_game.player_state = initial_state
      new_game.save!

      render json: { success: true, redirect_url: game_path(new_game, skip_resume: 1) }
    rescue Pundit::NotAuthorizedError
      raise
    rescue => e
      Rails.logger.error "[BreakEscape] new_session error: #{e.message}"
      render json: { success: false, error: e.message }, status: :internal_server_error
    end

    # GET /games/:id/scenario
    # Returns filtered scenario JSON for this game instance
    # Uses filtered_scenario_for_bootstrap for lazy-loading support
    def scenario
      authorize @game if defined?(Pundit)

      begin
        # Use filtered bootstrap scenario and remove 'requires' fields for security
        filtered = @game.filtered_scenario_for_bootstrap

        # Remove 'requires' fields recursively for security
        filter_requires_recursive(filtered)

        # Include objectives state for page reload recovery
        # This allows the client to restore completed/progress state
        if @game.player_state['objectivesState'].present?
          filtered['objectivesState'] = @game.player_state['objectivesState']
        end

        # Include submitted flags for flag station minigame
        if @game.player_state['submitted_flags'].present?
          filtered['submittedFlags'] = @game.player_state['submitted_flags']
        end

        # Include saved global variables so the client can restore them on session resume.
        # These are merged over the scenario defaults in game.js, allowing flags like
        # `briefing_played` to persist across page reloads.
        if @game.player_state['globalVariables'].present?
          filtered['savedGlobalVariables'] = @game.player_state['globalVariables']
        end

        # Include saved notes (with player observations) for session resume.
        if @game.player_state['notes'].present?
          filtered['savedNotes'] = @game.player_state['notes']
        end

        # Include current inventory from player_state for page reload recovery
        # This allows the client to restore inventory state on reload
        if @game.player_state['inventory'].present? && @game.player_state['inventory'].is_a?(Array)
          filtered['playerInventory'] = @game.player_state['inventory']

          # Remove startItemsInInventory from scenario to prevent duplicates
          # Since we're sending the actual inventory, we don't need the starting items
          filtered.delete('startItemsInInventory')
        end

        render json: filtered
      rescue => e
        Rails.logger.error "[BreakEscape] scenario error: #{e.message}\n#{e.backtrace.first(5).join("\n")}"
        render_error("Failed to generate scenario: #{e.message}", :internal_server_error)
      end
    end

    # GET /games/:id/scenario_map
    # Returns minimal scenario metadata for navigation (no room contents)
    def scenario_map
      authorize @game if defined?(Pundit)

      begin
        # Check if scenario_data exists
        unless @game.scenario_data.present?
          Rails.logger.error "[BreakEscape] scenario_map: Game #{@game.id} has no scenario_data"
          return render_error('Scenario data not available', :internal_server_error)
        end

        # Return minimal room/connection metadata without contents
        layout = {}
        rooms = @game.scenario_data['rooms'] || {}

        Rails.logger.debug "[BreakEscape] scenario_map: Processing #{rooms.keys.length rescue 0} rooms"

        rooms.each do |room_id, room_data|
          next unless room_data.is_a?(Hash)

          begin
            layout[room_id] = {
              type: room_data['type'],
              connections: room_data['connections'] || {},
              locked: room_data['locked'] || false,
              lockType: room_data['lockType'],
              hasNPCs: (room_data['npcs']&.length || 0) > 0,
              accessible: @game.room_unlocked?(room_id)
            }
          rescue => e
            Rails.logger.error "[BreakEscape] Error processing room #{room_id}: #{e.message}"
            # Skip this room and continue
            next
          end
        end

        render json: {
          startRoom: @game.scenario_data['startRoom'],
          currentRoom: @game.player_state['currentRoom'],
          rooms: layout
        }
      rescue => e
        Rails.logger.error "[BreakEscape] scenario_map error: #{e.message}\n#{e.backtrace.first(5).join("\n")}"
        render_error("Failed to generate scenario map: #{e.message}", :internal_server_error)
      end
    end

    # GET /games/:id/room/:room_id
    # Returns room data for a specific room (lazy-loading support)
    def room
      authorize @game if defined?(Pundit)

      begin
        room_id = params[:room_id]
        return render_error('Missing room_id parameter', :bad_request) unless room_id.present?

        # Check if scenario_data exists
        unless @game.scenario_data.present?
          Rails.logger.error "[BreakEscape] room: Game #{@game.id} has no scenario_data"
          return render_error('Scenario data not available', :internal_server_error)
        end

        # Check if room exists in scenario FIRST (before accessibility check)
        unless @game.scenario_data['rooms']&.key?(room_id)
          return render_error("Room not found: #{room_id}", :not_found)
        end

        # Check if room is accessible (starting room OR in unlockedRooms)
        is_start_room = @game.scenario_data['startRoom'] == room_id
        is_unlocked = @game.player_state['unlockedRooms']&.include?(room_id)

        unless is_start_room || is_unlocked
          return render_error("Room not accessible: #{room_id}", :forbidden)
        end

        # Auto-add room to unlockedRooms when accessed
        # This ensures items in the room can be collected
        if !is_unlocked
          @game.player_state['unlockedRooms'] ||= []
          @game.player_state['unlockedRooms'] << room_id unless @game.player_state['unlockedRooms'].include?(room_id)
          @game.save!
          Rails.logger.info "[BreakEscape] Auto-unlocked room #{room_id} on access"
        end

        # Get and filter room data
        room_data = @game.filtered_room_data(room_id)
        return render_error("Room not found: #{room_id}", :not_found) unless room_data

        # Annotate flag-stations and launch-devices with whether all their flags are submitted
        annotate_station_submission_status!(room_data)

        # Track NPC encounters BEFORE sending response
        npc_count = room_data['npcs']&.length || 0
        Rails.logger.info "[BreakEscape] 📦 Loading room: #{room_id} (NPCs: #{npc_count})"
        track_npc_encounters(room_id, room_data)

        Rails.logger.debug "[BreakEscape] Serving room data for: #{room_id}"

        render json: { room_id: room_id, room: room_data }
      rescue => e
        Rails.logger.error "[BreakEscape] room error: #{e.message}\n#{e.backtrace.first(10).join("\n")}"
        render_error("Failed to load room: #{e.message}", :internal_server_error)
      end
    end

    # GET /games/:id/container/:container_id
    # Returns container contents after unlock (lazy-loaded)
    #
    # Wrapped in with_game_lock (see around_action above) even though this
    # action never writes player_state — it only reads unlockedObjects and
    # inventory. The lock is here purely as a read barrier: without it, this
    # request could race a concurrent unlock/inventory write and serve a
    # stale "not unlocked yet" response from before that write committed. The
    # cost is that this request also blocks any concurrent writer for its own
    # (brief, read-only) duration. This is a different situation from the
    # other locked actions below — it's not a candidate for atomic per-path
    # writes (there's nothing to write), it's a candidate to simply drop the
    # lock and rely on the plain @game.reload already below if that
    # write-blocking turns out to matter in practice.
    def container
      authorize @game if defined?(Pundit)

      # Reload game to get latest player_state (in case inventory was updated)
      @game.reload

      container_id = params[:container_id]
      return render_error('Missing container_id parameter', :bad_request) unless container_id.present?

      # Find container in scenario data
      container_data = find_container_in_scenario(container_id)
      return render_error("Container not found: #{container_id}", :not_found) unless container_data

      # Check if container is unlocked (check multiple possible identifiers)
      is_unlocked = check_container_unlocked(container_id, container_data)

      unless is_unlocked
        return render_error("Container not unlocked: #{container_id}", :forbidden)
      end

      # Return filtered contents
      contents = filter_container_contents(container_data)

      Rails.logger.info "[BreakEscape] Serving container contents for: #{container_id} - returning #{contents.length} items"
      Rails.logger.debug "[BreakEscape] Container contents: #{contents.map { |c| "#{c['type']}/#{c['id']}/#{c['name']}" }.join(', ')}"

      render json: {
        container_id: container_id,
        contents: contents
      }
    end

    # GET /games/:id/ink?npc=helper1
    # Returns NPC script (JIT compiled if needed)
    def ink
      authorize @game if defined?(Pundit)

      npc_id = params[:npc]
      return render_error('Missing npc parameter', :bad_request) unless npc_id.present?

      Rails.logger.debug "[BreakEscape] Loading ink for NPC: #{npc_id}"

      # Find NPC in scenario data
      npc = find_npc_in_scenario(npc_id)
      return render_error("NPC not found in scenario: #{npc_id}", :not_found) unless npc

      Rails.logger.debug "[BreakEscape] Found NPC: #{npc['id']} with storyPath: #{npc['storyPath']}"

      # Check if storyPath is set
      unless npc['storyPath'].present?
        Rails.logger.warn "[BreakEscape] NPC #{npc['id']} has no storyPath defined"
        return render_error("NPC #{npc['id']} has no storyPath defined", :bad_request)
      end

      # Resolve ink file path and compile if needed
      ink_json_path = resolve_and_compile_ink(npc['storyPath'])
      unless ink_json_path && File.exist?(ink_json_path)
        Rails.logger.error "[BreakEscape] Ink file not found for #{npc['storyPath']} (resolved to #{ink_json_path})"
        return render_error("Ink script not found for #{npc['storyPath']}", :not_found)
      end

      Rails.logger.debug "[BreakEscape] Serving ink from: #{ink_json_path}"

      # Serve compiled JSON
      render json: JSON.parse(File.read(ink_json_path))
    rescue JSON::ParserError => e
      render_error("Invalid JSON in compiled ink: #{e.message}", :internal_server_error)
    end

    # POST /games/:id/tts
    # Generate TTS audio for NPC dialogue line
    def tts
      authorize @game if defined?(Pundit)

      npc_id = params[:npc_id]
      text = params[:text]

      return render_error('Missing npc_id or text', :bad_request) unless npc_id.present? && text.present?
      return render_error('Text too long', :bad_request) if text.length > 1000

      # Find NPC in scenario
      npc = find_npc_in_scenario(npc_id)
      return render_error("NPC not found: #{npc_id}", :not_found) unless npc

      # Get voice config — NPCs use 'voice' (Hash), room objects use 'ttsVoice'
      voice_config = npc['voice'].is_a?(Hash) ? npc['voice'] : npc['ttsVoice']
      return render_error("No voice configured for NPC: #{npc_id}", :bad_request) unless voice_config

      # Validate text exists in the NPC's content (anti-abuse)
      # Narrator lines are sourced from another NPC's ink story (already server-side trusted)
      if npc['skipTextValidation']
        Rails.logger.debug "[TTS] Skipping text validation for #{npc_id} (skipTextValidation=true)"
      elsif npc['storyPath']
        # Full Ink story — validate against compiled JSON first, then fall back to
        # scenario-defined barks (eventMappings / timedMessages).  NPCs can have both
        # a story *and* standalone barks defined in the scenario JSON; the Ink story
        # should not block those bark-only TTS requests.
        ink_json_path = resolve_and_compile_ink(npc['storyPath'])
        unless ink_json_path
          Rails.logger.error "[TTS] Ink story file not found for NPC #{npc_id}: #{npc['storyPath']}"
          return render_error('NPC story file not found', :not_found)
        end

        ink_valid  = InkTextValidator.validate(ink_json_path.to_s, text)
        bark_valid = ScenarioBarkValidator.validate(npc, text)

        unless ink_valid || bark_valid
          Rails.logger.warn "[TTS] Text validation failed for NPC #{npc_id}: #{text.truncate(60)}"
          return render_error('Text not found in NPC story or barks', :forbidden)
        end
      elsif npc['voice'].is_a?(Hash)
        # Scenario-only NPC with voice config but no Ink story — validate against
        # the bark texts declared in the scenario (eventMappings / timedMessages).
        unless ScenarioBarkValidator.validate(npc, text)
          Rails.logger.warn "[TTS] Bark text validation failed for NPC #{npc_id}: #{text.truncate(60)}"
          return render_error('Text not found in NPC barks', :forbidden)
        end
      elsif npc['voice'].is_a?(String)
        # Room object with a fixed voice message — validate directly
        normalized_request = text.downcase.gsub(/[^\w\s]/, '').strip.gsub(/\s+/, ' ')
        normalized_stored  = npc['voice'].downcase.gsub(/[^\w\s]/, '').strip.gsub(/\s+/, ' ')
        unless normalized_request == normalized_stored
          Rails.logger.warn "[TTS] Text validation failed for room object #{npc_id}: #{text.truncate(60)}"
          return render_error('Text not found in object', :forbidden)
        end
      else
        return render_error('Cannot validate text for this object', :bad_request)
      end

      # Generate or retrieve cached audio
      tts_service = TtsService.new
      mp3_path = tts_service.generate(
        text,
        voice_config['name'],
        voice_config['style'],
        voice_config['language'],
        scenario_name: @game.mission&.name
      )
      unless mp3_path && File.exist?(mp3_path)
        if tts_service.enabled?
          return render_error('TTS generation failed', :internal_server_error)
        else
          return render_error('TTS not configured (missing GEMINI_API_KEY) and no cached audio available', :service_unavailable)
        end
      end

      send_file mp3_path, type: 'audio/mpeg', disposition: 'inline'
    end

    # PUT /games/:id/sync_state
    # Periodic state sync from client
    #
    # Wrapped in with_game_lock (see around_action above): writes currentRoom,
    # globalVariables, and notes, each an independent path rather than a
    # cross-key decision, so it's a candidate to drop the lock if this ever
    # moves to atomic per-path writes — see the FUTURE IMPROVEMENT note above.
    #
    # NOTE — separate, still-open concern the lock does NOT address: this
    # writes plain client-supplied snapshot values (e.g. currentRoom = ...),
    # not idempotent/commutative operations. The lock only guarantees two
    # concurrent syncs can't corrupt each other's write; it does not guarantee
    # they apply in the client's intended chronological order. If a delayed or
    # retried sync_state request reaches the lock *after* a newer one, it will
    # still fully overwrite the newer value with older data — that requires a
    # client-supplied sequence number/timestamp to fix, not locking or atomic
    # writes.
    def sync_state
      authorize @game if defined?(Pundit)

      # Update allowed fields
      if params[:currentRoom]
        # Verify room is accessible
        if @game.player_state['unlockedRooms'].include?(params[:currentRoom]) ||
           @game.scenario_data['startRoom'] == params[:currentRoom]
          @game.player_state['currentRoom'] = params[:currentRoom]
        else
          return render json: {
            success: false,
            message: "Cannot enter locked room: #{params[:currentRoom]}"
          }, status: :forbidden
        end
      end

      if params[:globalVariables]
        @game.update_global_variables!(params[:globalVariables].to_unsafe_h)
      end

      # Persist notes (including player observations).
      # Merge by id so edits made mid-session overwrite older snapshots, but
      # notes not yet in player_state are added fresh.
      if params[:notes].present?
        incoming = params[:notes].map(&:to_unsafe_h)
        existing = @game.player_state['notes'] ||= []
        incoming.each do |note|
          idx = existing.index { |n| n['id'].to_s == note['id'].to_s }
          if idx
            existing[idx] = note
          else
            existing << note
          end
        end
        @game.player_state['notes'] = existing
      end

      @game.save!

      render json: { success: true }
    end

    # POST /games/:id/update_room
    # Update dynamic room state (items added/removed, NPCs moved, object state changes)
    #
    # Wrapped in with_game_lock (see around_action above): writes are scoped
    # to a single room_id's entry under player_state['room_states'], an
    # independent path rather than a cross-key decision, so it's a candidate
    # to drop the lock if this ever moves to atomic per-path writes — see the
    # FUTURE IMPROVEMENT note above.
    def update_room
      authorize @game if defined?(Pundit)

      room_id = params[:roomId]
      action_type = params[:actionType]  # Renamed from 'action' to avoid Rails conflict
      data = params[:data]

      unless room_id.present? && action_type.present?
        return render json: { success: false, message: 'Missing roomId or actionType' }, status: :bad_request
      end

      # Validate room is accessible
      unless @game.room_unlocked?(room_id)
        return render json: { success: false, message: 'Room not accessible' }, status: :forbidden
      end

      success = case action_type
      when 'add_object'
        # Validate item data (data is ActionController::Parameters)
        unless data.present? && (data[:type].present? || data['type'].present?)
          return render json: { success: false, message: 'Invalid item data' }, status: :bad_request
        end

        source_data = {
          'npc_id' => params[:sourceNpcId],
          'source_type' => params[:sourceType]
        }.compact

        # Use strong parameters instead of to_unsafe_h
        @game.add_item_to_room!(room_id, item_add_params, source_data)

      when 'remove_object'
        item_id = data[:id] || data['id'] || data[:itemId] || data['itemId']
        unless item_id.present?
          return render json: { success: false, message: 'Missing item id' }, status: :bad_request
        end

        @game.remove_item_from_room!(room_id, item_id)

      when 'update_object_state'
        object_id = data[:objectId] || data['objectId']
        state_changes = data[:stateChanges] || data['stateChanges']

        unless object_id.present? && state_changes.present?
          return render json: { success: false, message: 'Invalid object state data' }, status: :bad_request
        end

        # Use strong parameters instead of to_unsafe_h
        @game.update_object_state!(room_id, object_id, object_state_params)

      when 'update_npc_state'
        npc_id = data[:npcId] || data['npcId']
        state_changes = data[:stateChanges] || data['stateChanges']

        unless npc_id.present? && state_changes.present?
          return render json: { success: false, message: 'Invalid NPC state data' }, status: :bad_request
        end

        # Use strong parameters instead of to_unsafe_h
        @game.update_npc_state!(room_id, npc_id, npc_state_params)

      when 'move_npc'
        npc_id = data[:npcId] || data['npcId']
        from_room = data[:fromRoom] || data['fromRoom']
        to_room = data[:toRoom] || data['toRoom']

        unless npc_id.present? && from_room.present? && to_room.present?
          return render json: { success: false, message: 'Invalid NPC move data' }, status: :bad_request
        end

        @game.move_npc_to_room!(npc_id, from_room, to_room)

      when 'remove_npc_from_scene'
        npc_id = data[:npcId] || data['npcId']

        unless npc_id.present?
          return render json: { success: false, message: 'Missing npcId' }, status: :bad_request
        end

        @game.remove_npc_from_scene!(room_id, npc_id)

      else
        return render json: { success: false, message: "Unknown action: #{action_type}" }, status: :bad_request
      end

      if success
        render json: { success: true }
      else
        render json: { success: false, message: 'Failed to update room state' }, status: :unprocessable_entity
      end
    end

    # POST /games/:id/unlock
    # Validate unlock attempt
    #
    # Wrapped in with_game_lock (see around_action above): a successful unlock
    # appends to unlockedRooms/unlockedObjects, an independent path rather
    # than a cross-key decision, so it's a candidate to drop the lock if this
    # ever moves to atomic per-path writes — see the FUTURE IMPROVEMENT note
    # above.
    def unlock
      authorize @game if defined?(Pundit)

      target_type = params[:targetType]
      target_id = params[:targetId]
      attempt = params[:attempt]
      method = params[:method]

      is_valid = @game.validate_unlock(target_type, target_id, attempt, method)

      unless is_valid
        return render json: {
          success: false,
          message: 'Invalid attempt'
        }, status: :unprocessable_entity
      end

      # Use transaction to ensure atomic update
      ActiveRecord::Base.transaction do
        if target_type == 'door'
          @game.unlock_room!(target_id)

          room_data = @game.filtered_room_data(target_id)

          # Track NPC encounters when unlocking a door (room data is cached by client)
          # This ensures NPCs are tracked even if loadRoom() uses cached data
          track_npc_encounters(target_id, room_data)

          render json: {
            success: true,
            type: 'door',
            roomData: room_data
          }
        else
          # Object/container unlock
          @game.unlock_object!(target_id)

          # Find the unlocked object and return its contents if it's a container
          object_data = find_object_in_scenario(target_id)
          response = {
            success: true,
            type: 'object'
          }

          # If object has contents, include them in response
          if object_data && object_data['contents'].present?
            response[:hasContents] = true
            response[:contents] = object_data['contents']
          end

          # If this was a flag-unlock: submit to Hacktivity, process rewards, complete linked task
          if method == 'flag' && attempt.present?
            # Submit flag to Hacktivity and mark in submitted_flags (ignore if already submitted)
            @game.submit_flag(attempt)

            rewards = find_flag_rewards(attempt)
            unless rewards.empty?
              reward_results = process_flag_rewards(attempt, rewards)
              response[:rewards] = reward_results
            end

            # Complete any task declared on the flag-locked object
            completed_tasks = []
            if object_data && (task_id = object_data['completesTask'])
              # Use the flag ref directly ("vm:flag_N") as the submitted identifier —
              # avoids collision with station-position-based flag_ids ("vm-flagN").
              flag_ref    = object_data['requires'] || ''
              task_result = @game.complete_task!(task_id, { submittedFlags: [flag_ref] })
              completed_tasks << task_id if task_result[:success]
            end
            response[:completedTasks] = completed_tasks
            response[:updatedTasks]   = []
          end

          render json: response
        end
      end
    rescue ActiveRecord::RecordInvalid => e
      render json: {
        success: false,
        message: "Failed to save unlock: #{e.message}"
      }, status: :unprocessable_entity
    end

    # POST /games/:id/inventory
    # Update inventory
    def inventory
      authorize @game if defined?(Pundit)

      action_type = params[:action_type] || params[:actionType]
      item = params[:item]

      Rails.logger.info "[BreakEscape] inventory endpoint: action=#{action_type}, item=#{item.inspect}"

      begin
        case action_type
        when 'add'
          # Validate item exists and is collectible
          validation_error = validate_item_collectible(item)
          if validation_error
            Rails.logger.warn "[BreakEscape] inventory validation failed: #{validation_error}"
            return render json: { success: false, message: validation_error },
                         status: :unprocessable_entity
          end

          Rails.logger.info "[BreakEscape] Adding item to inventory: #{item['type']} / #{item['name']}"
          @game.add_inventory_item!(item.to_unsafe_h)
          Rails.logger.info "[BreakEscape] Item added successfully. Current inventory size: #{@game.player_state['inventory']&.length}"
          render json: { success: true, inventory: @game.player_state['inventory'] }

        when 'remove'
          @game.remove_inventory_item!(item['id'])
          render json: { success: true, inventory: @game.player_state['inventory'] }

        else
          render json: { success: false, message: 'Invalid action' }, status: :bad_request
        end
      rescue ActiveRecord::RecordInvalid => e
        Rails.logger.error "[BreakEscape] Inventory save failed: #{e.message}"
        render json: { success: false, message: "Failed to save inventory: #{e.message}" },
               status: :unprocessable_entity
      rescue => e
        Rails.logger.error "[BreakEscape] Inventory error: #{e.class} - #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
        render json: { success: false, message: "Inventory error: #{e.message}" },
               status: :internal_server_error
      end
    end

    # ==========================================
    # Objectives System
    # ==========================================

    # GET /games/:id/objectives
    # Returns current objectives and their state
    def objectives
      authorize @game if defined?(Pundit)

      render json: @game.objectives_state
    end

    # POST /games/:id/objectives/tasks/:task_id
    # Complete a specific task
    #
    # Wrapped in with_game_lock (see around_action above) and MUST STAY LOCKED
    # even if the other actions in that list are ever narrowed to atomic
    # per-path writes: complete_task! calls check_aim_completion /
    # check_mission_conclusion, which read every task in an aim (and gate
    # tasks that can belong to a *different* aim) before deciding whether to
    # flip an aim's status or bump objectives_completed/score. That's a
    # cross-key decision, not an independent field write, and it's exactly
    # the logic that produced both the >100% score bug and the mission stuck
    # in 'abandoned' with all real objectives complete — see the FUTURE
    # IMPROVEMENT note above for why this can't become a single atomic SQL
    # statement without moving that decision logic into the database.
    def complete_task
      authorize @game if defined?(Pundit)

      task_id = params[:task_id]

      unless task_id.present?
        return render json: { success: false, error: 'Missing task_id' }, status: :bad_request
      end

      # For submit_flags tasks, accept submittedFlags from request body for validation
      # For collect_items tasks, accept currentCount from client (avoids inventory async race)
      validation_data = params[:validation_data] || {}
      if params[:submittedFlags].present?
        validation_data[:submittedFlags] = params[:submittedFlags]
      end
      if params[:currentCount].present?
        validation_data[:currentCount] = params[:currentCount].to_i
      end

      result = @game.complete_task!(task_id, validation_data)

      if result[:success]
        Rails.logger.info "[BreakEscape] Task completed: #{task_id}"
        if (cb = BreakEscape.configuration&.on_task_complete)
          begin
            cb.call(@game)
          rescue => e
            Rails.logger.error "[BreakEscape] on_task_complete hook raised: #{e.class}: #{e.message}"
          end
        end
        render json: result
      else
        Rails.logger.warn "[BreakEscape] Task completion failed: #{task_id} - #{result[:error]}"
        render json: result, status: :unprocessable_entity
      end
    end

    # PUT /games/:id/objectives/tasks/:task_id
    # Update task progress (for collect_items and submit_flags tasks)
    #
    # Wrapped in with_game_lock (see around_action above): unlike complete_task
    # right above it, update_task_progress! only writes this one task's own
    # progress/submittedFlags — it never calls check_aim_completion, so it's a
    # candidate to drop the lock if this ever moves to atomic per-path writes
    # — see the FUTURE IMPROVEMENT note above. Don't confuse this with
    # complete_task's lock requirement; they look similar but touch very
    # different logic.
    def update_task_progress
      authorize @game if defined?(Pundit)

      task_id = params[:task_id]
      progress = params[:progress].to_i
      submitted_flags = params[:submittedFlags]

      unless task_id.present?
        return render json: { success: false, error: 'Missing task_id' }, status: :bad_request
      end

      result = @game.update_task_progress!(task_id, progress, submitted_flags)

      Rails.logger.debug "[BreakEscape] Task progress updated: #{task_id} = #{progress}, submittedFlags: #{submitted_flags&.length || 0}"
      render json: result
    end

    # ==========================================
    # VM/Flag Integration
    # ==========================================

    # POST /games/:id/flags
    # Submit a CTF flag for validation
    #
    # Wrapped in with_game_lock (see around_action above) and MUST STAY LOCKED
    # even if the other actions in that list are ever narrowed to atomic
    # per-path writes: this calls @game.process_flag_task_completions!, which
    # — like complete_task! above — calls check_aim_completion for every
    # matching task and can trigger check_mission_conclusion. Same cross-key
    # aggregation logic, same reasoning as complete_task; see the FUTURE
    # IMPROVEMENT note above.
    # The client has reached the end of the story and wants the credits.
    #
    # The client is the authority on the narrative being over; the server is the
    # authority on whether the scenario's declared technical work was done. See
    # Game#conclude_mission!. A refusal is not an error — it is the answer
    # "not yet", with the outstanding requirements named so the client can tell
    # the player what is left rather than rolling credits that do not count.
    def conclude_mission
      authorize @game if defined?(Pundit)

      result = with_game_lock { @game.conclude_mission! }

      render json: {
        success: result[:concluded],
        alreadyConcluded: result[:already],
        missing: result[:missing],
        missionConcludedAt: @game.mission_concluded_at,
        status: @game.status,
        score: @game.score
      }
    end

    def submit_flag
      authorize @game if defined?(Pundit)

      flag_key = params[:flag]
      station_id = params[:stationId]

      unless flag_key.present?
        return render json: { success: false, message: 'No flag provided' }, status: :bad_request
      end

      # Development-only convenience: allow test:flag:1, test:flag:2, ... as
      # stand-ins for this station's real flags, so one playtest trace runs
      # unchanged in BOTH environments — a standalone game whose flags came from
      # flag-hint XML, and a Hacktivity game whose flags come from the real VM
      # build. In neither case does the client ever see the flag values (see
      # Game#filter_requires_and_contents_recursive).
      #
      # This is an ALIAS, not a bypass. It resolves to the real flag value and then
      # every downstream check runs untouched: station-ownership, already-submitted,
      # scenario validation, Hacktivity scoring, rewards and task completion. Real
      # flags continue to work exactly as before, in every environment.
      resolved_key, alias_used = resolve_test_flag_alias(flag_key, station_id)
      flag_key = resolved_key

      # hintOnlyFlags: flags listed on a station that should be validated but NOT submitted —
      # used when a flag is "used elsewhere" (e.g. archive key or launch code) and the station
      # just wants to tell the player that without consuming the flag or scoring it in Hacktivity.
      if station_id.present?
        hint_message = find_hint_only_message(flag_key, station_id)
        if hint_message
          valid_flags = @game.send(:extract_valid_flags_from_scenario)
          if valid_flags.any? { |f| f.downcase == flag_key.downcase }
            return render json: {
              success: true,
              hint: true,
              message: 'Flag recognised',
              flag: flag_key,
              flagId: nil,
              vmId: nil,
              rewards: [{ 'type' => 'hint', 'message' => hint_message }],
              completedTasks: [],
              updatedTasks: []
            }
          end
        end
      end

      # If the client reports which station the player is at, ensure the submitted flag
      # belongs to that station. This prevents a flag valid for one station being accepted
      # by a different station (e.g. the launch device accepting drop-site flags).
      # Strategy: find which station actually owns this flag value, then verify it matches
      # the station the player is interacting with.
      if station_id.present?
        owning_station = find_flag_station_for_flag(flag_key)
        owning_id = owning_station ? (owning_station['id'] || owning_station['name']) : nil
        Rails.logger.info "[FlagDebug] station_id=#{station_id.inspect} flag=#{flag_key.inspect} owning_id=#{owning_id.inspect} owning_type=#{owning_station&.dig('type').inspect}"
        if owning_station
          unless owning_id == station_id
            Rails.logger.info "[FlagDebug] REJECTED: owning #{owning_id.inspect} != submitted #{station_id.inspect}"
            return render json: { success: false, message: 'Incorrect flag', debug: { owning_id: owning_id, station_id: station_id } }, status: :unprocessable_entity
          end
        else
          Rails.logger.info "[FlagDebug] No owning station found for flag — will proceed to submit_flag validation"
        end
      end

      result = @game.submit_flag(flag_key)

      if result[:success]
        # Find flag-station and generate flag identifier
        flag_station = find_flag_station_for_flag(flag_key)
        flag_id = generate_flag_identifier(flag_key, flag_station)
        flag_ids = generate_flag_identifiers(flag_key, flag_station)
        vm_id = flag_station&.dig('acceptsVms', 0)

        # Find rewards for this flag in scenario
        rewards = find_flag_rewards(flag_key)

        # Process rewards (must run before task completions to minimise partial-state window)
        reward_results = process_flag_rewards(flag_key, rewards)

        # Server-side task/aim completion — runs after rewards so the final save!
        # captures all accumulated in-memory state changes
        task_outcomes = flag_ids.any? \
          ? @game.process_flag_task_completions!(flag_ids)
          : { completed_tasks: [], updated_tasks: [] }

        # Notify the host app so it can route this through its own flag-scoring pipeline
        # (e.g. FlagService in Hacktivity). Runs after task state is saved so the host
        # sees a consistent game state. Errors are logged and swallowed — a scoring
        # failure must not roll back the player's flag submission.
        # Skip when the flag was already counted in Hacktivity (backward compat for
        # flags previously consumed by the wrong station under the old buggy code).
        if (cb = BreakEscape.configuration&.on_flag_submit) && !result[:already_in_hacktivity]
          begin
            cb.call(@game, flag_key, vm_id)
          rescue => e
            Rails.logger.error "[BreakEscape] on_flag_submit callback error: #{e.class} #{e.message}"
          end
        end

        Rails.logger.info "[BreakEscape] Flag submitted: #{flag_key}, flagId: #{flag_id}, " \
                          "completedTasks: #{task_outcomes[:completed_tasks]}, rewards: #{reward_results.length}"

        render json: {
          success:        true,
          message:        result[:message],
          # Surfaced so a playtest report can never silently claim a VM step was
          # completed with a real flag when a dev stand-in was used.
          testFlagAlias:  alias_used,
          flag:           flag_key,
          flagId:         flag_id,
          vmId:           vm_id,
          rewards:        reward_results,
          completedTasks: task_outcomes[:completed_tasks],
          updatedTasks:   task_outcomes[:updated_tasks]
        }
      else
        render json: result, status: :unprocessable_entity
      end
    end

    # GET /games/:id/vm_panel?vm_title=:title
    # Redirects to the Hacktivity individual VM show page for the named VM in this game's VmSet,
    # with ?embedded=1 so Hacktivity's application layout hides navigation and footer.
    def vm_panel
      Rails.logger.info "[BreakEscape] vm_panel: player=#{current_player.class}##{current_player&.id} " \
                        "game_player=#{@game.player_type}##{@game.player_id} " \
                        "status=#{@game.status} vm_set_id=#{@game.vm_set_id}"
      authorize @game if defined?(Pundit)
      return head :not_found unless BreakEscape::Mission.hacktivity_mode? && @game.vm_set_id

      vm_set = defined?(::VmSet) ? ::VmSet.find_by(id: @game.vm_set_id) : nil
      return head :not_found unless vm_set

      # Nil-guard sec_gen_batch in case it was deleted by an admin after assignment.
      return head :not_found unless vm_set.sec_gen_batch
      batch = vm_set.sec_gen_batch
      event = batch.event
      # Nil-guard event — Event may have been hard-deleted by an admin.
      return head :not_found unless event

      vm = params[:vm_title].present? ? vm_set.vms.find_by(title: params[:vm_title])
                                      : vm_set.vms.first
      return head :not_found unless vm

      # Race guard: only unlock console if the game is still in_progress.
      return head :not_found unless @game.reload.status == 'in_progress'

      # Gate: verify the player has reached the room containing this terminal in-game.
      # Admins and account managers bypass this check.
      unless current_player.admin? || current_player.account_manager?
        launcher_room_id = find_vm_launcher_room(@game.scenario_data, vm.title)
        if launcher_room_id && !@game.room_unlocked?(launcher_room_id)
          Rails.logger.warn "[BreakEscape] vm_panel blocked: #{current_player.id} " \
                            "attempted VM #{vm.title} without unlocking #{launcher_room_id}"
          return head :forbidden
        end
      end

      # Player has reached this VM terminal legitimately in-game. Unlock console access.
      vm.update_column(:enable_console, true)

      redirect_to Rails.application.routes.url_helpers.event_sec_gen_batch_vm_set_vm_path(
        event,
        batch,
        vm_set,
        vm,
        embedded: 1
      )
    end

    # GET /games/:id/vm_set_panel
    # Redirects to the Hacktivity VmSet#show page for this game's assigned VM set,
    # with ?embedded=1 so Hacktivity hides navigation and footer.
    def vm_set_panel
      return head :not_found unless BreakEscape::Mission.hacktivity_mode? && @game.vm_set_id

      vm_set = defined?(::VmSet) ? ::VmSet.find_by(id: @game.vm_set_id) : nil
      return head :not_found unless vm_set&.sec_gen_batch&.event

      return head :not_found unless @game.reload.status == 'in_progress'

      batch = vm_set.sec_gen_batch
      event = batch.event

      redirect_to Rails.application.routes.url_helpers.event_sec_gen_batch_vm_set_path(
        event,
        batch,
        vm_set,
        embedded: 1
      )
    end

    private

    def find_vm_launcher_room(scenario_data, vm_title)
      # Returns the room_id containing a vm-launcher object for vm_title, or nil if not found.
      # If nil is returned (non-standard scenario structure), the gate is skipped.
      (scenario_data['rooms'] || {}).each do |room_id, room_data|
        (room_data['objects'] || []).each do |obj|
          return room_id if obj['type'] == 'vm-launcher' && obj.dig('vm', 'title') == vm_title
        end
      end
      nil
    end

    def set_game
      @game = Game.find(params[:id])
    end

    # Serializes all player_state read-modify-write actions for a single game
    # behind a row lock (SELECT ... FOR UPDATE on Postgres; whole-DB write
    # lock on SQLite). A second concurrent request blocks here until the
    # first transaction commits, then with_lock reloads @game's attributes
    # so it operates on the post-commit state instead of a stale copy.
    def with_game_lock
      @game.with_lock { yield }
    end

    def filter_requires_recursive(obj)
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

        # Recursively filter nested structures
        obj.each_value { |value| filter_requires_recursive(value) }
      when Array
        obj.each { |item| filter_requires_recursive(item) }
      end
    end

    def track_npc_encounters(room_id, room_data)
      return unless room_data['npcs'].present?

      begin
        npc_ids = room_data['npcs'].map { |npc| npc['id'] }

        # Ensure player_state is a hash
        unless @game.player_state.is_a?(Hash)
          Rails.logger.error "[BreakEscape] player_state is not a Hash: #{@game.player_state.class}"
          @game.player_state = {}
        end

        # Ensure encounteredNPCs is an array
        @game.player_state['encounteredNPCs'] ||= []

        # Handle case where encounteredNPCs might not be an array (legacy data)
        unless @game.player_state['encounteredNPCs'].is_a?(Array)
          Rails.logger.warn "[BreakEscape] encounteredNPCs is not an Array: #{@game.player_state['encounteredNPCs'].class}, resetting"
          @game.player_state['encounteredNPCs'] = []
        end

        new_npcs = npc_ids - @game.player_state['encounteredNPCs']
        return if new_npcs.empty?

        # Log detailed information about each new NPC encountered
        new_npcs.each do |npc_id|
          npc_data = room_data['npcs'].find { |npc| npc['id'] == npc_id }
          if npc_data
            display_name = npc_data['displayName'] || npc_id
            npc_type = npc_data['npcType'] || 'unknown'
            Rails.logger.info "[BreakEscape] 🎭 NPC ENCOUNTERED: #{display_name} (#{npc_id}) - Type: #{npc_type} - Room: #{room_id}"
          else
            Rails.logger.info "[BreakEscape] 🎭 NPC ENCOUNTERED: #{npc_id} - Room: #{room_id}"
          end
        end

        @game.player_state['encounteredNPCs'] = (@game.player_state['encounteredNPCs'] + new_npcs).uniq
        @game.save!

        total_encountered = @game.player_state['encounteredNPCs'].length
        Rails.logger.info "[BreakEscape] ✅ Tracked #{new_npcs.length} new NPC encounter(s) in room #{room_id}. Total NPCs encountered: #{total_encountered}"
      rescue => e
        Rails.logger.error "[BreakEscape] Error tracking NPC encounters: #{e.message}\n#{e.backtrace.first(5).join("\n")}"
        # Continue without tracking to avoid breaking room loading
      end
    end

    def find_container_in_scenario(container_id)
      @game.scenario_data['rooms'].each do |room_id, room_data|
        # Search objects for container
        container = find_container_recursive(room_data['objects'], container_id)
        return container if container

        # Search nested contents
        room_data['objects']&.each do |obj|
          container = search_nested_contents(obj['contents'], container_id)
          return container if container
        end
      end
      nil
    end

    def find_container_recursive(objects, container_id)
      return nil unless objects

      objects.each do |obj|
        # Check if this object matches
        if obj['id'] == container_id || (obj['name'] && obj['name'] == container_id)
          return obj if obj['contents'].present?
        end

        # Recursively search nested contents
        nested = find_container_recursive(obj['contents'], container_id)
        return nested if nested
      end
      nil
    end

    def find_object_in_scenario(object_id)
      # Search all rooms for the object
      @game.scenario_data['rooms'].each do |_room_id, room_data|
        object = room_data['objects']&.find { |obj|
          obj['id'] == object_id || obj['name'] == object_id
        }
        return object if object
      end
      nil
    end

    def search_nested_contents(contents, container_id)
      return nil unless contents

      contents.each do |item|
        return item if (item['id'] == container_id || item['name'] == container_id) && item['contents'].present?
        nested = search_nested_contents(item['contents'], container_id)
        return nested if nested
      end
      nil
    end

    def check_container_unlocked(container_id, container_data)
      unlocked_list = @game.player_state['unlockedObjects'] || []

      # Only match by ID — never by name or type, which are non-unique and could
      # grant access to all containers sharing a type/name string.
      unlocked_list.include?(container_id) ||
      unlocked_list.include?(container_data['id'])
    end

    def filter_container_contents(container_data)
      contents = container_data['contents']&.map do |item|
        item_copy = item.deep_dup
        @game.send(:filter_requires_and_contents_recursive, item_copy)
        item_copy
      end || []

      # Filter out items that are already in the player's inventory
      inventory = @game.player_state['inventory'] || []
      Rails.logger.debug "[BreakEscape] Filtering container contents. Inventory has #{inventory.length} items"
      Rails.logger.debug "[BreakEscape] Container has #{contents.length} items before filtering"

      filtered_contents = contents.reject do |item|
        in_inventory = item_in_inventory?(item, inventory)
        if in_inventory
          Rails.logger.debug "[BreakEscape] Filtering out item: #{item['type']} / #{item['id']} / #{item['name']} (already in inventory)"
        end
        in_inventory
      end

      Rails.logger.debug "[BreakEscape] Container has #{filtered_contents.length} items after filtering"
      filtered_contents
    end

    # Check if an item is already in the player's inventory
    # Matches by type, id, or name (similar to validation logic)
    def item_in_inventory?(item, inventory)
      return false if inventory.blank? || item.blank?

      # Normalize item data (handle both string and symbol keys)
      item_type = item['type'] || item[:type]
      item_id = item['key_id'] || item[:key_id] || item['id'] || item[:id]
      item_name = item['name'] || item[:name]

      Rails.logger.debug "[BreakEscape] Checking if item in inventory: type=#{item_type}, id=#{item_id}, name=#{item_name}"

      inventory.any? do |inv_item|
        # Inventory items are stored as flat objects (not nested in scenarioData)
        # Handle both string and symbol keys
        inv_type = inv_item['type'] || inv_item[:type]
        inv_id = inv_item['key_id'] || inv_item[:key_id] || inv_item['id'] || inv_item[:id]
        inv_name = inv_item['name'] || inv_item[:name]

        Rails.logger.debug "[BreakEscape] Comparing with inventory item: type=#{inv_type}, id=#{inv_id}, name=#{inv_name}"

        # Must match type
        next false unless inv_type == item_type

        # If both have IDs, match by ID (most specific)
        if item_id.present? && inv_id.present?
          match = inv_id.to_s == item_id.to_s
          Rails.logger.debug "[BreakEscape] ID match: #{match} (#{item_id} == #{inv_id})"
          return true if match
        end

        # If both have names, match by name (fallback if no ID match)
        if item_name.present? && inv_name.present?
          match = inv_name.to_s == item_name.to_s
          Rails.logger.debug "[BreakEscape] Name match: #{match} (#{item_name} == #{inv_name})"
          return true if match
        end

        # If item has no ID or name, match by type only (less specific, but works for generic items)
        if item_id.blank? && item_name.blank?
          Rails.logger.debug "[BreakEscape] Type-only match (no ID/name)"
          return true
        end

        false
      end
    end

    # Items that are always allowed in inventory (core game mechanics)
    ALWAYS_ALLOWED_ITEMS = %w[notepad].freeze

    def validate_item_collectible(item)
      item_type = item['type']
      # Use key_id for keys (more unique), fall back to id for other items
      item_id = item['key_id'] || item['id']
      item_name = item['name']

      Rails.logger.info "[BreakEscape] validate_item_collectible: type=#{item_type}, id=#{item_id}, name=#{item_name}"

      # Always allow core game items like notepad
      if ALWAYS_ALLOWED_ITEMS.include?(item_type)
        Rails.logger.info "[BreakEscape] Item is always allowed: #{item_type}"
        return nil
      end

      # Check if this is a starting item first (if so, skip all other checks)
      is_starting_item = @game.scenario_data['startItemsInInventory']&.any? do |start_item|
        start_item['type'] == item_type && (start_item['id'] == item_id || start_item['name'] == item_name)
      end

      if is_starting_item
        Rails.logger.info "[BreakEscape] Item is a starting item, skipping room/container checks"
        return nil # Starting items are always valid
      end

      # Search for item, prioritizing accessible locations (not locked containers/rooms)
      found_item_info = find_accessible_item(item_type, item_id, item_name)

      unless found_item_info
        error_msg = "Item not found in scenario: #{item_type}"
        Rails.logger.warn "[BreakEscape] #{error_msg}"
        return error_msg
      end

      found_item = found_item_info[:item]
      location = found_item_info[:location]

      # Check if item is takeable
      unless found_item['takeable']
        error_msg = "Item is not takeable: #{found_item['name']}"
        Rails.logger.warn "[BreakEscape] #{error_msg}"
        return error_msg
      end

      # Check access based on location type
      if location[:type] == 'container'
        container_id = location[:container_id]
        unless @game.player_state['unlockedObjects'].include?(container_id)
          error_msg = "Container not unlocked: #{container_id}"
          Rails.logger.warn "[BreakEscape] #{error_msg}"
          return error_msg
        end
      elsif location[:type] == 'room'
        room_id = location[:room_id]
        room_info = @game.scenario_data['rooms'][room_id]
        if room_info && room_info['locked'] && !@game.player_state['unlockedRooms'].include?(room_id)
          error_msg = "Room not unlocked: #{room_id}"
          Rails.logger.warn "[BreakEscape] #{error_msg}"
          return error_msg
        end
      elsif location[:type] == 'npc'
        npc_id = location[:npc_id]
        unless @game.player_state['encounteredNPCs'].include?(npc_id)
          error_msg = "NPC not encountered: #{npc_id}"
          Rails.logger.warn "[BreakEscape] #{error_msg}"
          return error_msg
        end
      elsif location[:type] == 'flag_station'
        # Flag station items are valid if they're in the player's inventory (already awarded server-side)
        # or if the corresponding flag has been submitted
        flag_station_id = location[:flag_station_id]
        Rails.logger.info "[BreakEscape] Item from flag station #{flag_station_id}, allowing (flag reward)"
        # Flag rewards are always valid - the server already validated and added them
      end

      Rails.logger.info "[BreakEscape] Item collection valid: #{item_type}"
      nil # No error
    end

    def find_accessible_item(item_type, item_id, item_name)
      # Priority 0: Dynamically-added items (e.g., dropped by defeated NPCs).
      # These were already security-validated by add_item_to_room! so they are always allowed.
      @game.player_state['room_states']&.each do |room_id, room_state|
        room_state['objects_added']&.each do |added_obj|
          next unless added_obj['type'] == item_type
          next unless added_obj['key_id'] == item_id || added_obj['id'] == item_id ||
                      added_obj['name'] == item_name || added_obj['name'] == item_id ||
                      item_id.nil?
          return { item: added_obj, location: { type: 'room', room_id: room_id } }
        end
      end

      # Priority 1: Items in unlocked rooms (most accessible)
      @game.scenario_data['rooms'].each do |room_id, room_data|
        if room_data['locked'] == false || @game.player_state['unlockedRooms'].include?(room_id)
          room_data['objects']&.each do |obj|
            if obj['type'] == item_type && (obj['key_id'] == item_id || obj['id'] == item_id || obj['name'] == item_name || obj['name'] == item_id)
              return { item: obj, location: { type: 'room', room_id: room_id } }
            end
          end
        end
      end

      # Priority 2: Items in any room (including locked ones - will validate in main method)
      @game.scenario_data['rooms'].each do |room_id, room_data|
        room_data['objects']&.each do |obj|
          if obj['type'] == item_type && (obj['key_id'] == item_id || obj['id'] == item_id || obj['name'] == item_name || obj['name'] == item_id)
            return { item: obj, location: { type: 'room', room_id: room_id } }
          end

          # Search nested contents in room objects
          obj['contents']&.each do |content|
            if content['type'] == item_type && (content['key_id'] == item_id || content['id'] == item_id || content['name'] == item_name || content['name'] == item_id)
              return { item: content, location: { type: 'container', container_id: obj['id'] || obj['name'] } }
            end
          end

          # Search flag-station itemsHeld (flag reward items)
          if obj['type'] == 'flag-station' && obj['itemsHeld'].present?
            obj['itemsHeld'].each do |held_item|
              if held_item['type'] == item_type && (held_item['key_id'] == item_id || held_item['keyId'] == item_id || held_item['id'] == item_id || held_item['name'] == item_name || held_item['name'] == item_id)
                return { item: held_item, location: { type: 'flag_station', flag_station_id: obj['id'] || obj['name'], room_id: room_id } }
              end
            end
          end
        end

        # Priority 3: Items held by NPCs in this room
        room_data['npcs']&.each do |npc|
          next unless npc['itemsHeld'].present?

          npc['itemsHeld'].each do |held_item|
            if held_item['type'] == item_type && (held_item['key_id'] == item_id || held_item['id'] == item_id || held_item['name'] == item_name || held_item['name'] == item_id)
              return { item: held_item, location: { type: 'npc', npc_id: npc['id'], room_id: room_id } }
            end
          end
        end
      end

      nil
    end

    def find_item_in_scenario(item_type, item_id, item_name = nil)
      # First check startItemsInInventory (items the player begins with)
      @game.scenario_data['startItemsInInventory']&.each do |item|
        if item['type'] == item_type && (item['key_id'] == item_id || item['id'] == item_id || item['name'] == item_name || item['name'] == item_id)
          return item
        end
      end

      # Then search room objects
      @game.scenario_data['rooms'].each do |room_id, room_data|
        # Search room objects
        room_data['objects']&.each do |obj|
          if obj['type'] == item_type && (obj['key_id'] == item_id || obj['id'] == item_id || obj['name'] == item_name || obj['name'] == item_id)
            return obj
          end

          # Search nested contents
          obj['contents']&.each do |content|
            if content['type'] == item_type && (content['key_id'] == item_id || content['id'] == item_id || content['name'] == item_name || content['name'] == item_id)
              return content
            end
          end
        end
      end
      nil
    end

    def find_item_container(item_type, item_id)
      @game.scenario_data['rooms'].each do |room_id, room_data|
        room_data['objects']&.each do |obj|
          obj['contents']&.each do |content|
            if content['type'] == item_type && (content['id'] == item_id || content['name'] == item_id)
              return { id: obj['id'] || obj['name'], locked: obj['locked'] }
            end
          end
        end
      end
      nil
    end

    def find_item_room(item_type, item_id)
      @game.scenario_data['rooms'].each do |room_id, room_data|
        room_data['objects']&.each do |obj|
          if obj['type'] == item_type && (obj['id'] == item_id || obj['name'] == item_id)
            return { id: room_id, locked: room_data['locked'] }
          end
        end
      end
      nil
    end

    def find_npc_holding_item(item_type, item_id)
      @game.scenario_data['rooms'].each do |room_id, room_data|
        room_data['npcs']&.each do |npc|
          next unless npc['itemsHeld'].present?

          # itemsHeld is array of full item objects (same structure as room objects)
          npc['itemsHeld'].each do |held_item|
            # Match by type (required) and optionally by id/name
            if held_item['type'] == item_type
              # If item_id provided, verify it matches
              if item_id.present?
                item_matches = (held_item['id'] == item_id) ||
                              (held_item['name'] == item_id) ||
                              (item_id == item_type) # Fallback if no id field
                next unless item_matches
              end

              return {
                id: npc['id'],
                npc: npc,
                item: held_item,
                type: 'npc'
              }
            end
          end
        end
      end
      nil
    end

    def find_npc_in_scenario(npc_id)
      # Narrator is defined at the top level of the scenario, not inside a room
      if npc_id == 'narrator' && @game.scenario_data['narrator']
        return @game.scenario_data['narrator']
      end

      available_npcs = []
      @game.scenario_data['rooms']&.each do |room_id, room_data|
        room_data['npcs']&.each do |npc|
          available_npcs << "#{npc['id']} (#{room_id})"
          return npc if npc['id'] == npc_id
        end

        # Also search room objects (e.g. phone items with ttsVoice config)
        room_data['objects']&.each do |obj|
          next unless obj['id'] == npc_id
          return obj
        end
      end

      # Log available NPCs for debugging
      if available_npcs.any?
        Rails.logger.debug "[BreakEscape] Available NPCs: #{available_npcs.join(', ')}"
      else
        Rails.logger.warn "[BreakEscape] No NPCs found in scenario data"
      end

      nil
    end

    # Resolve ink path and compile if necessary
    def resolve_and_compile_ink(story_path)
      # Use Engine root for Rails Engine context
      engine_root = BreakEscape::Engine.root
      base_path = engine_root.join(story_path)
      json_path = find_compiled_json(base_path)
      ink_path = find_ink_source(base_path)

      if ink_path && needs_compilation?(ink_path, json_path)
        Rails.logger.info "[BreakEscape] Compiling #{File.basename(ink_path)}..."
        json_path = compile_ink(ink_path)
      end

      json_path
    end

    def find_compiled_json(base_path)
      return base_path if File.exist?(base_path)

      ink_json_path = base_path.to_s.gsub(/\.json$/, '.ink.json')
      return Pathname.new(ink_json_path) if File.exist?(ink_json_path)

      json_path = base_path.to_s.gsub(/\.ink\.json$/, '.json')
      return Pathname.new(json_path) if File.exist?(json_path)

      nil
    end

    def find_ink_source(base_path)
      ink_path = base_path.to_s.gsub(/\.(ink\.)?json$/, '.ink')
      File.exist?(ink_path) ? Pathname.new(ink_path) : nil
    end

    def needs_compilation?(ink_path, json_path)
      return true unless json_path && File.exist?(json_path)
      File.mtime(ink_path) > File.mtime(json_path)
    end

    def compile_ink(ink_path)
      output_path = ink_path.to_s.gsub(/\.ink$/, '.json')
      inklecate_path = BreakEscape::Engine.root.join('bin', 'inklecate')

      stdout, stderr, status = Open3.capture3(
        inklecate_path.to_s,
        '-jo', output_path,
        ink_path.to_s
      )

      unless status.success?
        Rails.logger.error "[BreakEscape] Ink compilation failed: #{stderr}"
        raise "Ink compilation failed for #{File.basename(ink_path)}: #{stderr}"
      end

      if stderr.present?
        Rails.logger.warn "[BreakEscape] Ink compilation warnings: #{stderr}"
      end

      Rails.logger.info "[BreakEscape] Compiled #{File.basename(ink_path)} (#{(File.size(output_path) / 1024.0).round(2)} KB)"

      Pathname.new(output_path)
    end

    def render_error(message, status)
      render json: { error: message }, status: status
    end

    # Strong parameters for room state sync (SECURITY)
    def item_add_params
      # Allow common item properties, including nested scenarioData
      params.require(:data).permit(
        :id, :type, :name, :texture, :x, :y, :takeable, :interactable,
        scenarioData: [
          :type, :name, :takeable, :key_id, :observations, :active, :visible, :interactable,
          keyPins: []
        ]
      ).to_h
    end

    def object_state_params
      # Only allow safe state changes (not 'locked' which bypasses puzzles)
      params.require(:data).require(:stateChanges).permit(
        :opened, :on, :brightness, :screen_state
      ).to_h
    end

    def npc_state_params
      # Only allow KO status and HP changes (validated further in model)
      params.require(:data).require(:stateChanges).permit(
        :isKO, :currentHP
      ).to_h
    end

    # ==========================================
    # Flag Reward Helpers
    # ==========================================

    def find_flag_rewards(flag_key)
      rewards = []

      # Reuse find_flag_station_for_flag so the fallback path (flags_by_vm) is handled
      # consistently and flagRewards are always resolved from the correct scenario station.
      obj = find_flag_station_for_flag(flag_key)
      return rewards unless obj

      return rewards unless obj['flagRewards']

      flag_station_id = obj['id'] || obj['name']

      # Find the room_id for this station (used by unlock_door rewards as fallback)
      room_id = nil
      @game.scenario_data['rooms']&.each do |rid, room|
        if room['objects']&.any? { |o| (o['id'] || o['name']) == flag_station_id && o['type'] == 'flag-station' }
          room_id = rid
          break
        end
      end

      # Support both hash structure (preferred) and array structure (legacy)
      if obj['flagRewards'].is_a?(Hash)
        # Hash structure: { "flag{key}": { "type": "unlock_door", ... } }
        reward_key = obj['flagRewards'].keys.find { |k| k.downcase == flag_key.downcase }
        reward = obj['flagRewards'][reward_key] if reward_key
        if reward
          rewards << reward.merge('flag_station_id' => flag_station_id, 'room_id' => room_id)
        end
      elsif obj['flagRewards'].is_a?(Array)
        if obj['requires']
          # Flag-locked object (safe/container with lockType: 'flag' and a single requires flag).
          # All rewards apply when the lock flag matches — no index lookup needed.
          obj['flagRewards'].each do |r|
            rewards << r.merge('flag_station_id' => flag_station_id, 'room_id' => room_id)
          end
        else
          # Array structure: rewards[i] corresponds to flags[i]
          flag_index = obj['flags']&.find_index { |ref| resolve_flag_value(ref)&.downcase == flag_key.downcase }
          if flag_index && obj['flagRewards'][flag_index]
            rewards << obj['flagRewards'][flag_index].merge(
              'flag_station_id' => flag_station_id,
              'room_id' => room_id
            )
          end
        end
      end

      rewards
    end

    def process_flag_rewards(flag_key, rewards)
      results = []

      rewards.each do |reward|
        # Skip if already claimed
        if @game.player_state['flag_rewards_claimed']&.include?(flag_key)
          results << { type: 'skipped', reason: 'Already claimed' }
          next
        end

        # Process each reward type
        case reward['type']
        when 'give_item'
          results << process_item_reward(reward, flag_key)

        when 'unlock_door'
          results << process_door_unlock_reward(reward, flag_key)

        when 'emit_event'
          results << process_event_reward(reward, flag_key)

        when 'set_global', 'unlock_object', 'hint'
          # Client-side-only rewards — forward as-is so processRewardEvents() can handle them
          results << reward

        else
          results << { type: 'unknown', data: reward }
        end
      end

      # Mark rewards as claimed
      @game.player_state['flag_rewards_claimed'] ||= []
      @game.player_state['flag_rewards_claimed'] << flag_key
      @game.save!

      results
    end

    def process_item_reward(reward, flag_key)
      # Find the flag-station object to pull item from its itemsHeld
      flag_station = find_flag_station_by_id(reward['flag_station_id'])

      return { type: 'error', message: 'Flag station not found' } unless flag_station

      # Get item from itemsHeld (similar to NPC item giving)
      item = flag_station['itemsHeld']&.find { |i| i['type'] == reward['item_type'] || i['name'] == reward['item_name'] }

      return { type: 'error', message: 'Item not found in flag station' } unless item

      # Add to player inventory
      @game.add_inventory_item!(item)

      { type: 'give_item', item: item, success: true }
    end

    def process_door_unlock_reward(reward, flag_key)
      room_id = reward['room_id'] || reward['target_room']

      return { type: 'error', message: 'No room_id specified' } unless room_id

      # Unlock the door (same as NPC door unlock)
      @game.unlock_room!(room_id)

      { type: 'unlock_door', room_id: room_id, success: true }
    end

    def process_event_reward(reward, flag_key)
      # Emit event (NPC can listen and trigger conversations)
      event_name = reward['event_name'] || "flag_submitted:#{flag_key}"

      # Store event in player_state for client to emit
      @game.player_state['pending_events'] ||= []
      @game.player_state['pending_events'] << {
        'name' => event_name,
        'data' => { 'flag' => flag_key, 'timestamp' => Time.current.to_i }
      }
      @game.save!

      { type: 'emit_event', event_name: event_name, success: true }
    end

    # Annotate flag-station and launch-device objects in room data with `flagsAllSubmitted`,
    # derived from the server's submitted_flags list. Mutates room_data in place.
    def annotate_station_submission_status!(room_data)
      submitted = Set.new((@game.player_state['submitted_flags'] || []).map(&:downcase))
      station_types = %w[flag-station launch-device]

      annotate = lambda do |obj|
        return unless obj.is_a?(Hash) && station_types.include?(obj['type'])
        flags = Array(obj['flags'])
        obj['flagsAllSubmitted'] = flags.any? && flags.all? do |ref|
          resolved = resolve_flag_value(ref)&.downcase
          resolved && submitted.include?(resolved)
        end
      end

      room_data['objects']&.each { |obj| annotate.call(obj) }
      room_data['npcs']&.each do |npc|
        npc['itemsHeld']&.each { |item| annotate.call(item) }
      end
    end

    def find_flag_station_by_id(flag_station_id)
      flag_station_types = %w[flag-station launch-device]
      @game.scenario_data['rooms']&.each do |_room_id, room|
        room['objects']&.each do |obj|
          return obj if (obj['id'] || obj['name']) == flag_station_id && flag_station_types.include?(obj['type'])
        end

        # Also search items held by NPCs (e.g. launch-device carried by an NPC)
        room['npcs']&.each do |npc|
          npc['itemsHeld']&.each do |item|
            return item if (item['id'] || item['name']) == flag_station_id && flag_station_types.include?(item['type'])
          end
        end
      end

      # Also search player inventory (takeable flag-stations/launch-devices end up here)
      @game.player_state['inventory']&.each do |item|
        return item if (item['id'] || item['name']) == flag_station_id && flag_station_types.include?(item['type'])
      end

      nil
    end

    # Find the flag-station that contains the submitted flag.
    #
    # Primary: searches flag-station objects embedded in scenario rooms (exact flag match).
    #
    # Fallback: when flags live in player_state['flags_by_vm'] rather than the scenario
    # objects (happens when the ERB rendered with fallback values because the VM title in
    # flags_by_vm didn't match the identifier used in flags_for_vm()), we:
    #   1. Find which VM owns the flag.
    #   2. Look for a scenario flag-station whose acceptsVms includes that VM name.
    #   3. If no exact acceptsVms match, use the first available flag-station
    #      (unambiguous for single-station scenarios).
    #   4. Return the scenario station with 'flags' overlaid with the real values so
    #      generate_flag_identifier and find_flag_rewards both use the correct station
    #      metadata (acceptsVms, flagRewards) and the correct flag index.
    # Resolve a flag value that may be a reference ("vm_name:flag_n") or a literal.
    # Delegates to game.resolve_flag_ref for references; returns the string as-is otherwise.
    # Is the flag{N} testing alias available? Never in production — this is the
    # single gate, so keep it a plain environment check with no override.
    def test_flag_aliases_enabled?
      !Rails.env.production?
    end

    # Translate a flag{N} stand-in into the real flag value for the station being
    # submitted to. Returns [flag_key, alias_used].
    #
    # N is 1-based and indexes the station's own ordered `flags` array, so
    # flag{1} is "the first flag this station expects" — which is how the
    # walkthroughs number them. Falls back to the scenario's overall flag order
    # when the client did not say which station it is at.
    #
    # Anything that is not exactly flag{<digits>} is returned untouched, so real
    # flag values (including any genuinely named flag{...}) are unaffected.
    def resolve_test_flag_alias(flag_key, station_id)
      return [flag_key, false] unless test_flag_aliases_enabled?

      # Deliberately NOT flag{N}: SecGen flag-hint XML routinely uses flag{1},
      # flag{2}, ... as the ACTUAL flag values, so a positional reading of that
      # form would hijack real flags and silently submit the wrong one.
      # `test:flag:N` cannot collide with any real flag.
      match = flag_key.to_s.strip.match(/\Atest:flag:(\d+)\z/i)
      return [flag_key, false] unless match

      # Belt and braces: if this somehow IS a real flag value, it is itself.
      real_flags = @game.send(:extract_valid_flags_from_scenario)
      if real_flags.any? { |f| f.to_s.casecmp?(flag_key.to_s.strip) }
        return [flag_key, false]
      end

      index = match[1].to_i
      return [flag_key, false] if index < 1

      candidates = test_flag_candidates(station_id)
      real = candidates[index - 1]

      if real.blank?
        Rails.logger.warn "[BreakEscape][TestFlag] #{flag_key} has no match " \
                          "(station=#{station_id.inspect}, #{candidates.length} flag(s) available)"
        return [flag_key, false]
      end

      Rails.logger.warn "[BreakEscape][TestFlag] DEV ALIAS: #{flag_key} -> real flag " \
                        "##{index} for station=#{station_id.inspect}. Not available in production."
      [real, true]
    end

    # Ordered, resolved flag values a flag{N} alias can refer to.
    def test_flag_candidates(station_id)
      station = station_id.present? ? find_flag_station_by_id(station_id) : nil
      refs = station && station['flags'].is_a?(Array) ? station['flags'] : nil

      values =
        if refs
          refs.map { |ref| resolve_flag_value(ref) }
        else
          # No station context: fall back to every flag the scenario knows, in
          # declaration order.
          @game.send(:extract_valid_flags_from_scenario)
        end

      values.compact.reject(&:blank?)
    end

    def resolve_flag_value(ref_or_value)
      return nil unless ref_or_value.is_a?(String)
      return @game.resolve_flag_ref(ref_or_value) if ref_or_value.match?(/\A[^:]+:flag_\d+\z/)
      ref_or_value
    end

    # Check whether a flag matches a hintOnlyFlags entry on the station identified by station_id.
    # Returns the hint message string if matched, nil otherwise.
    def find_hint_only_message(flag_key, station_id)
      @game.scenario_data['rooms']&.each do |_room_id, room|
        room['objects']&.each do |obj|
          next unless obj['type'] == 'flag-station'
          next unless (obj['id'] || obj['name']) == station_id
          next unless obj['hintOnlyFlags'].is_a?(Hash)

          obj['hintOnlyFlags'].each do |flag_ref, hint_message|
            resolved = resolve_flag_value(flag_ref)
            return hint_message if resolved&.downcase == flag_key.downcase
          end
        end
      end
      nil
    end

    def find_flag_station_for_flag(flag_key)
      # Primary: flag-station objects, NPC-held flag devices, and flag-locked objects.
      # Flags arrays may contain references ("vm:flag_n") or literal values — resolve both.
      @game.scenario_data['rooms']&.each do |_room_id, room|
        room['objects']&.each do |obj|
          next unless obj['type'] == 'flag-station' || obj['type'] == 'launch-device'
          next unless obj['flags']&.any? { |ref| resolve_flag_value(ref)&.downcase == flag_key.downcase }

          return obj
        end

        # Also search flag-locked containers (e.g. saes with lockType: 'flag').
        # These "own" their required flag so it can't be submitted elsewhere.
        room['objects']&.each do |obj|
          next unless obj['lockType'] == 'flag' && obj['requires']
          next unless resolve_flag_value(obj['requires'])&.downcase == flag_key.downcase

          return obj
        end

        # Also search flag-station/launch-device items held by NPCs
        room['npcs']&.each do |npc|
          npc['itemsHeld']&.each do |held_item|
            next unless held_item['type'] == 'flag-station' || held_item['type'] == 'launch-device'
            next unless held_item['flags']&.any? { |ref| resolve_flag_value(ref)&.downcase == flag_key.downcase }

            return held_item
          end
        end
      end

      # Fallback: flag lives in player_state flags_by_vm (resolve_flag_value returned nil,
      # meaning scenario_data['flags'] is not populated for this game).
      # Use the flag's index in flags_by_vm to determine which station references flag_N,
      # so that multiple stations accepting the same VM are distinguished correctly.
      flags_by_vm = @game.player_state['flags_by_vm']
      return nil unless flags_by_vm.is_a?(Hash)

      flag_station_types = %w[flag-station launch-device]

      flags_by_vm.each do |vm_name, vm_flags|
        next unless vm_flags.is_a?(Array)
        flag_index = vm_flags.find_index { |f| f.downcase == flag_key.downcase }
        next unless flag_index

        # Determine the reference string this flag would appear as in a station's flags array
        flag_ref = "#{vm_name}:flag_#{flag_index + 1}"

        # Search all station-type objects (room objects + NPC itemsHeld) for one that
        # explicitly references this flag_N
        @game.scenario_data['rooms']&.each do |_room_id, room|
          room['objects']&.each do |obj|
            next unless flag_station_types.include?(obj['type'])
            next unless Array(obj['acceptsVms']).include?(vm_name)
            return obj.merge('flags' => vm_flags) if Array(obj['flags']).include?(flag_ref)
          end

          room['npcs']&.each do |npc|
            npc['itemsHeld']&.each do |item|
              next unless flag_station_types.include?(item['type'])
              next unless Array(item['acceptsVms']).include?(vm_name)
              return item.merge('flags' => vm_flags) if Array(item['flags']).include?(flag_ref)
            end
          end
        end

        # No explicit reference match — fall back to first station accepting this VM
        @game.scenario_data['rooms']&.each do |_room_id, room|
          room['objects']&.each do |obj|
            next unless obj['type'] == 'flag-station' || obj['type'] == 'launch-device'
            return obj.merge('flags' => vm_flags) if Array(obj['acceptsVms']).include?(vm_name)
          end
        end

        # No flag-station in scenario at all — minimal synthetic fallback
        return { 'acceptsVms' => [vm_name], 'flags' => vm_flags }
      end

      nil
    end

    # Generate a flag identifier in the format: {vmId}-flag{index}
    # Example: "desktop-flag1", "kali-flag2"
    #
    # This is the LEGACY, unqualified form. It numbers flags from 1 within the
    # station's own flags array, so two stations accepting the same VM collide
    # (m01's launch device and drop site both produce "shatter_server-flag1").
    # Kept as-is because it is what every cached scenario_data already holds and
    # what the client shows; see generate_flag_identifiers for the qualified form.
    def generate_flag_identifier(flag_key, flag_station)
      return nil unless flag_station

      # Find flag index in flags array (0-based); entries may be references or literals
      flag_index = flag_station['flags']&.find_index { |ref| resolve_flag_value(ref)&.downcase == flag_key.downcase }
      return nil unless flag_index

      # Get VM ID (use first VM if multiple)
      vm_id = flag_station['acceptsVms']&.first
      return nil unless vm_id

      # Generate identifier: "desktop-flag1" (1-indexed for display)
      "#{vm_id}-flag#{flag_index + 1}"
    end

    # The candidate identifiers a submission at this station can satisfy, most
    # specific first:
    #
    #   "flag_station_dropsite:hospital_backup_server-flag1"  station-qualified
    #   "hospital_backup_server-flag1"                        legacy, unqualified
    #
    # A submit_flags task matches on EITHER. A qualified target can only be
    # produced by its own station, so a scenario that opts in gets strict
    # station binding; one that does not opt in behaves exactly as before.
    #
    # station_key is the station id, falling back to its name when it has no id
    # (m01's ENTROPY Launch Device is name-only).
    def generate_flag_identifiers(flag_key, flag_station)
      legacy = generate_flag_identifier(flag_key, flag_station)
      return [] unless legacy

      station_key = flag_station['id'].presence || flag_station['name'].presence
      station_key ? ["#{station_key}:#{legacy}", legacy] : [legacy]
    end

    # Get current player's preference record
    def current_player_preference
      if current_player.respond_to?(:break_escape_preference)
        current_player.break_escape_preference
      elsif current_player.respond_to?(:preference)
        # Reload association to ensure fresh data
        current_player.reload.preference
      end
    end

    # Create default preference for player
    def create_default_preference
      if current_player.respond_to?(:ensure_break_escape_preference!)
        current_player.ensure_break_escape_preference!
        current_player.break_escape_preference
      elsif current_player.respond_to?(:ensure_preference!)
        current_player.ensure_preference!
        current_player.preference
      else
        # Fallback: find-or-create so repeated calls and race conditions are safe
        begin
          PlayerPreference.find_or_create_by!(player: current_player)
        rescue ActiveRecord::RecordNotUnique
          PlayerPreference.find_by!(player: current_player)
        end
      end
    end
  end
end
