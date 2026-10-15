import { MinigameScene } from './base-minigame.js';

// Minigame Framework Manager
export const MinigameFramework = {
    mainGameScene: null,
    currentMinigame: null,
    registeredScenes: {},
    MinigameScene: MinigameScene, // Export the base class
    
    init(gameScene) {
        this.mainGameScene = gameScene;
        console.log("MinigameFramework initialized with main game scene:", gameScene);
    },
    
    startMinigame(sceneType, container, params) {
        if (!this.registeredScenes[sceneType]) {
            console.error(`Minigame scene '${sceneType}' not registered`);
            return null;
        }
        
        // If there's already a minigame running, end it first
        // (a minigame already mid-end, i.e. we were called from its onComplete, is
        // finished: ending it again would re-run cleanup and its callback)
        if (this.currentMinigame && !this.currentMinigame._ending) {
            console.log('Ending current minigame before starting new one');
            this.endMinigame(false, null);
        }
        
        // Check if this minigame requires keyboard input
        const requiresKeyboardInput = params?.requiresKeyboardInput || false;
        
        console.log('🎮 Starting minigame:', sceneType, 'requiresKeyboardInput:', requiresKeyboardInput);
        
        // Pause keyboard input for game controls if minigame needs keyboard
        if (requiresKeyboardInput) {
            console.log('🔍 Checking for window.pauseKeyboardInput...');
            // Try to access player module functions from window first (already loaded)
            if (window.pauseKeyboardInput) {
                console.log('✅ Found window.pauseKeyboardInput, calling it now...');
                window.pauseKeyboardInput();
                console.log('✅ Paused keyboard input for minigame that requires text input');
            } else {
                console.warn('⚠️ window.pauseKeyboardInput not found, trying dynamic import...');
                // Fallback to dynamic import if not available on window
                import('../../../js/core/player.js').then(module => {
                    if (module.pauseKeyboardInput) {
                        module.pauseKeyboardInput();
                        console.log('Paused keyboard input for minigame that requires text input (via import)');
                    }
                });
            }
        }
        
        // Disable main game input if we have a main game scene
        // (unless the minigame explicitly allows game input via disableGameInput: false)
        if (this.mainGameScene && this.mainGameScene.input) {
            const shouldDisableInput = params ? (params.disableGameInput !== false) : true;
            if (shouldDisableInput) {
                this.mainGameScene.input.mouse.enabled = false;
                this.mainGameScene.input.keyboard.enabled = false;
                this.gameInputDisabled = true;
                console.log('Disabled main game input for minigame', {
                    sceneType: sceneType,
                    mainGameScene: this.mainGameScene,
                    inputDisabled: true
                });
            } else {
                this.gameInputDisabled = false;
                console.log('Keeping main game input enabled for minigame', {
                    sceneType: sceneType,
                    mainGameScene: this.mainGameScene,
                    inputDisabled: false
                });
            }
        } else {
            console.warn('Cannot disable main game input - no main game scene or input available', {
                sceneType: sceneType,
                mainGameScene: this.mainGameScene,
                hasInput: this.mainGameScene ? !!this.mainGameScene.input : false
            });
        }
        
        // Stop the player from walking when a minigame opens
        if (window.cancelClickToMove) {
            window.cancelClickToMove();
        }

        // Use provided container or create one
        if (!container) {
            container = document.createElement('div');
            container.className = 'minigame-container';
            document.body.appendChild(container);
        }
        
        // Show the popup overlay to darken the background
        const popupOverlay = document.querySelector('.popup-overlay');
        if (popupOverlay) {
            popupOverlay.classList.add('active');
        }
        
        // Create and start the minigame
        const MinigameClass = this.registeredScenes[sceneType];
        this.currentMinigame = new MinigameClass(container, params);
        this.currentMinigame._sceneType = sceneType;
        this._updateBarkLayer();
        this.currentMinigame.init();
        this.currentMinigame.start();
        
        console.log(`Started minigame: ${sceneType}`);
        return this.currentMinigame;
    },
    
    /**
     * True while a minigame that barks would cover is open. Barks are then held and
     * played when it closes (npc-barks.js), and any already showing drop behind it:
     * they sat on top and hid minigame panels (D5). Phone chat keeps barks on top,
     * since a bark there is a notification for another thread.
     */
    holdsBarks() {
        const m = this.currentMinigame;
        if (!m || m._ending) return false;
        return m._sceneType !== 'phone-chat';
    },

    /**
     * True while a minigame of this type is open and not already closing.
     * @param {string} sceneType - registered scene name, e.g. 'rfid'
     */
    isOpen(sceneType) {
        const m = this.currentMinigame;
        return !!m && !m._ending && m._sceneType === sceneType;
    },

    _updateBarkLayer() {
        if (typeof document === 'undefined' || !document.body) return;
        document.body.classList.toggle('minigame-holds-barks', this.holdsBarks());
    },

    endMinigame(success, result) {
        console.log('endMinigame called with success:', success, 'result:', result);
        if (this.currentMinigame && this.currentMinigame._ending) {
            console.log('Minigame is already ending, ignoring re-entrant endMinigame');
            return;
        }
        if (this.currentMinigame) {
            const ending = this.currentMinigame;
            ending._ending = true;
            console.log('Cleaning up current minigame');
            ending.cleanup();
            
            // Hide the popup overlay
            const popupOverlay = document.querySelector('.popup-overlay');
            if (popupOverlay) {
                popupOverlay.classList.remove('active');
            }
            
            // Remove minigame container only if it was auto-created
            // (remove THIS minigame's container, not whichever comes first in the DOM)
            const container = ending.container || document.querySelector('.minigame-container');
            if (container && !container.hasAttribute('data-external')) {
                console.log('Removing minigame container');
                container.remove();
            }
            
            // Resume keyboard input for game controls
            if (window.resumeKeyboardInput) {
                window.resumeKeyboardInput();
                console.log('Resumed keyboard input after minigame ended');
            } else {
                // Fallback to dynamic import if not available on window
                import('../../../js/core/player.js').then(module => {
                    if (module.resumeKeyboardInput) {
                        module.resumeKeyboardInput();
                        console.log('Resumed keyboard input after minigame ended (via import)');
                    }
                });
            }
            
            // Re-enable main game input if we have a main game scene and we disabled it
            if (this.mainGameScene && this.mainGameScene.input && this.gameInputDisabled) {
                this.mainGameScene.input.mouse.enabled = true;
                this.mainGameScene.input.keyboard.enabled = true;
                this.gameInputDisabled = false;
                console.log('Re-enabled main game input');
            }
            
            // Call completion callback
            // onComplete may start another minigame (cloner save -> return to the
            // conversation); that one is now currentMinigame and must not be
            // cleared here, or its container is orphaned with input disabled.
            try {
                if (ending.params && ending.params.onComplete) {
                    console.log('Calling onComplete callback');
                    ending.params.onComplete(success, result);
                }
            } finally {
                if (this.currentMinigame === ending) {
                    this.currentMinigame = null;
                }
            }
            // Nothing is running now, so any auto-created container still in the
            // DOM is an orphan (it would sit over the canvas swallowing clicks).
            if (!this.currentMinigame) {
                document.querySelectorAll('.minigame-container:not([data-external])').forEach(el => el.remove());
            }
            // Barks held back while the minigame was open play now (D5)
            this._updateBarkLayer();
            if (!this.currentMinigame) {
                window.barkSystem?.drainDeferredBarks?.();
            }
            console.log(`Ended minigame with success: ${success}`);
        } else {
            console.log('No current minigame to end');
        }
    },
    
    registerScene(sceneType, SceneClass) {
        this.registeredScenes[sceneType] = SceneClass;
        console.log(`Registered minigame scene: ${sceneType}`);
    },
    
    // Force restart the current minigame
    restartCurrentMinigame() {
        if (this.currentMinigame) {
            console.log('Force restarting current minigame');
            const currentParams = this.currentMinigame.params;
            const currentSceneType = this.currentMinigame.constructor.name.toLowerCase().replace('minigame', '');
            
            // End the current minigame
            this.endMinigame(false, null);
            
            // Restart with the same parameters
            if (currentParams) {
                setTimeout(() => {
                    this.startMinigame(currentSceneType, null, currentParams);
                }, 100); // Small delay to ensure cleanup is complete
            }
        } else {
            console.log('No current minigame to restart');
        }
    },
    
    // Force close any running minigame
    forceCloseMinigame() {
        if (this.currentMinigame) {
            console.log('Force closing current minigame');
            this.endMinigame(false, null);
        } else {
            console.log('No current minigame to close');
        }
    }
}; 