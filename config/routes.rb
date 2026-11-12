BreakEscape::Engine.routes.draw do
  # Static files - caught by routes and served by lightweight controller
  # This ensures files are served from the engine's public directory
  # Constraint { path: /.*/ } ensures we capture the full path including filename with extension
  get '/css/*path',    to: 'static_files#serve', constraints: { path: /.*/ }
  get '/js/*path',     to: 'static_files#serve', constraints: { path: /.*/ }
  get '/assets/*path', to: 'static_files#serve', constraints: { path: /.*/ }
  get '/stylesheets/*path', to: 'static_files#serve', constraints: { path: /.*/ }
  get '/:filename.html', to: 'static_files#serve', constraints: { filename: /test-.*|index/ }

  # Mission selection
  resources :missions, only: [:index, :show]

  # Player configuration
  get 'configuration', to: 'player_preferences#show', as: :configuration
  patch 'configuration', to: 'player_preferences#update'

  # Game management
  resources :games, only: [:new, :show, :create] do
    member do
      # Scenario and NPC data
      get 'scenario'          # Returns the bootstrap scenario: rooms stripped to navigation fields, plus characterSprites
      get 'scenario_map'      # Returns minimal layout metadata for navigation
      get 'ink'               # Returns NPC script (JIT compiled)
      post 'tts'              # Generate TTS audio for NPC dialogue
      get 'room/:room_id', to: 'games#room', as: 'room'            # Returns room data for lazy-loading
      get 'container/:container_id', to: 'games#container'  # Returns locked container contents

      # Game state and actions
      post 'reset'        # Reset game to initial state
      post 'new_session'  # Create a new game for the same mission
      put 'sync_state'    # Periodic state sync
      post 'update_room'  # Update dynamic room state (items, NPCs, object states)
      post 'unlock'       # Validate unlock attempt
      post 'inventory'    # Update inventory

      # Access model: sign-in PCs and card copies (docs/achitechture/ACCESS_MODEL_PLAN.md section 6)
      post 'login'           # Sign in at a sign-in PC (password, or claim the owner's open session)
      post 'logout'          # End the session at a sign-in PC
      get 'login_accounts'   # Account tiles for a sign-in PC's loginPicker
      post 'clone_card'      # Record a card copy the card copier saved
      post 'wear'            # Put a held wearable item on or take it off (docs/achitechture/WEARABLE_BUILD_LOG.md)
      post 'npc_frustration' # Slice 9.2: an NPC's failed and met uses (ACCESS_MODEL_SLICE_9_2_PLAN.md 9.1)
      post 'npc_workaround'  # Slice 9.2: a workaround performed or dropped (plan 6)
      post 'feed_post'       # Slice 9.2 C: an NPC's next social media post (plan 8.3)

      # Networks (docs/achitechture/ACCESS_MODEL_SLICE_9_3_PLAN.md section 5)
      get  'network',         to: 'games#network',         as: 'network'          # The view for each held foothold
      post 'network/plant',   to: 'games#network_plant',   as: 'network_plant'    # Plant a rogue device in a jack
      post 'network/unplug',  to: 'games#network_unplug',  as: 'network_unplug'   # Take it back
      post 'network/implant', to: 'games#network_implant', as: 'network_implant' # Foothold from a device in a PC (9.3b I)
      post 'network/join',    to: 'games#network_join',    as: 'network_join'     # Join an in-game Wi-Fi network (slice 9.3b W)

      # Objectives system
      get 'objectives'                                      # Get current objective state
      get 'capture_secrets'   # SE: authored secret for each earned credential capture (stripped from the bootstrap)
      post 'objectives/tasks/:task_id', to: 'games#complete_task', as: 'complete_task'
      post 'objectives/tasks/:task_id/skip', to: 'games#skip_task', as: 'skip_task'  # Story closed a task off: shown skipped, not counted
      put 'objectives/tasks/:task_id', to: 'games#update_task_progress', as: 'update_task_progress'
      post 'objectives/unlock', to: 'games#unlock_objective', as: 'unlock_objective'  # Persist an ink/eventMapping aim or task unlock

      post 'conclude', to: 'games#conclude_mission'  # Client reports the story ended; server gates on concludeRequires

      # VM/Flag integration
      post 'flags', to: 'games#submit_flag'  # Submit CTF flag for validation

      # Hacktivity VM panel endpoints (vm_set_panel body added in Phase 4.4.3)
      get 'vm_panel'
      get 'vm_set_panel'
    end
  end

  root to: 'missions#index'
end
