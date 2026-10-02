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
      get 'scenario'          # Returns full scenario_data JSON (for compatibility)
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

      # Objectives system
      get 'objectives'                                      # Get current objective state
      post 'objectives/tasks/:task_id', to: 'games#complete_task', as: 'complete_task'
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
