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
      get  'mfa/device',     to: 'games#mfa_device', as: 'mfa_device'   # What a held code device shows (S8a)
      post 'mfa/verify',     to: 'games#mfa_verify', as: 'mfa_verify'   # The code for a pending second step (S8a)
      post 'mfa/prompt',     to: 'games#mfa_prompt', as: 'mfa_prompt'   # Ask the owner to approve a push (S8a)
      get  'mfa/phone',      to: 'games#mfa_phone', as: 'mfa_phone'     # Requests waiting on a held phone (S8a)
      post 'mfa/approve',    to: 'games#mfa_approve', as: 'mfa_approve' # Approve or deny from a held phone (S8a)
      post 'login'           # Sign in at a sign-in PC (password, or claim the owner's open session)
      post 'logout'          # End the session at a sign-in PC
      post 'lock_session'    # Lock a held session (UI slice 6): stays held, needs the password again
      get 'login_accounts'   # Account tiles for a sign-in PC's loginPicker
      post 'clone_card'      # Record a card copy the card copier saved
      post 'pin_dust'        # Dust a PIN pad with the fingerprint kit: the PIN's distinct digits, once per lock
      post 'wear'            # Put a held wearable item on or take it off (docs/achitechture/WEARABLE_BUILD_LOG.md)
      post 'npc_frustration' # Slice 9.2: an NPC's failed and met uses (ACCESS_MODEL_SLICE_9_2_PLAN.md 9.1)
      post 'npc_workaround'  # Slice 9.2: a workaround performed or dropped (plan 6)
      post 'feed_post'       # Slice 9.2 C: an NPC's next social media post (plan 8.3)
      post 'friendface_phone' # q35: open a Friendface phone the player holds

      # Networks (docs/achitechture/ACCESS_MODEL_SLICE_9_3_PLAN.md section 5)
      get  'network',         to: 'games#network',         as: 'network'          # The view for each held foothold
      post 'network/plant',   to: 'games#network_plant',   as: 'network_plant'    # Plant a rogue device in a jack
      post 'network/unplug',  to: 'games#network_unplug',  as: 'network_unplug'   # Take it back
      post 'network/implant', to: 'games#network_implant', as: 'network_implant' # Foothold from a device in a PC (9.3b I)
      post 'network/join',    to: 'games#network_join',    as: 'network_join'     # Join an in-game Wi-Fi network (slice 9.3b W)
      post 'network/scan',    to: 'games#network_scan',    as: 'network_scan'     # Sweep a network or scan a host (ops core S1)
      post 'network/check',   to: 'games#network_check',   as: 'network_check'    # Check a scanned service for findings (ops core S2)
      post 'network/confirm', to: 'games#network_confirm', as: 'network_confirm'  # Confirm a finding (ops core S2)
      post 'network/technique', to: 'games#network_technique', as: 'network_technique' # Use a technique card on a finding (ops core S3)

      # Objectives system
      get 'objectives'                                      # Get current objective state
      get 'capture_secrets'   # SE: authored secret for each earned credential capture (stripped from the bootstrap)
      get 'log_rows'          # Ops log reader (OPS_LOG_ROWS_PLAN.md section 6): the rows of an ops_log_terminal's source
      get 'keyring'           # Credential keyring (CREDENTIAL_KEYRING_PLAN.md K1): the player's earned credentials, computed server-side
      post 'crack', to: 'games#crack', as: 'crack' # Offline cracking of a hash record (ops S7): one run, the server decides
      post 'se/landing_page', to: 'games#se_landing_page', as: 'se_landing_page' # SE: record a landing-page build server-side (phish evidence plan, Route 1)
      post 'se/phish_send',   to: 'games#se_phish_send',   as: 'se_phish_send'   # SE: record a phish send server-side (phish evidence plan, Route 2)
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
      # Called by the vm-launcher minigame when it opens in Hacktivity mode, to set the
      # reached VM's console to its default (attack VMs on, "*server*" targets stay locked).
      post 'unlock_vm_console'
    end
  end

  root to: 'missions#index'
end
