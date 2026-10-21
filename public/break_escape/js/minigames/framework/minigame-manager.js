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
    
    /**
     * Start a minigame. Besides each scene's own params, two framework params
     * handle nested overlays (SE contract 00 S12):
     *
     *   returnTo: { sceneType, params } - when this minigame ends on a normal
     *     exit (success true, result not { aborted: true }), the framework
     *     starts returnTo.sceneType after onComplete. If the running minigame
     *     this call displaces is a suspended parent of that same sceneType, the
     *     reopened parent gets the parent's original params with
     *     returnTo.params merged over them and suspended cleared, so its
     *     onComplete, requiresKeyboardInput and disableClose survive the trip.
     *   suspended: true - set by a parent on its OWN params just before it
     *     launches a child. When startMinigame ends it to make room, its
     *     onComplete is skipped (it is paused, not finished), and a parent that
     *     paused the world keys keeps them paused for the child. The flag is
     *     cleared again if the child fails to start.
     *
     * When the child ends and the parent is NOT reopened (a failure close, an
     * aborted result, a forced close, or a reopen that fails to start), the
     * parent's own onComplete runs once, as onComplete(false, { aborted: true,
     * viaChild: true, childSuccess, childResult }), so a starter's close work
     * (persist, emit, re-enable) is not skipped (P0-R R-05). It is not called
     * when the child's onComplete opened another minigame itself: that starter
     * has taken over the flow, as before.
     *
     * Without either param every minigame behaves as before.
     */
    startMinigame(sceneType, container, params) {
        if (!this.registeredScenes[sceneType]) {
            console.error(`Minigame scene '${sceneType}' not registered`);
            this._clearSuspend();
            return null;
        }

        // Nothing opens while the player is knocked out: it would sit under the
        // KNOCKED OUT screen (player-damage-interrupt.js; m04 confirmation R2 N1)
        if (window.playerIsKnockedOut?.()) {
            console.log(`Not starting minigame '${sceneType}': the player is knocked out`);
            this._clearSuspend();
            return null;
        }

        // If there's already a minigame running, end it first
        // (a minigame already mid-end, i.e. we were called from its onComplete, is
        // finished: ending it again would re-run cleanup and its callback)
        let suspendedParent = null;
        if (this.currentMinigame && !this.currentMinigame._ending) {
            const running = this.currentMinigame;
            if (running.params?.suspended === true) {
                // A parent handing over to a child (S12): ended without its onComplete
                running._suspendedForChild = true;
                suspendedParent = { sceneType: running._sceneType, params: running.params };
            }
            console.log('Ending current minigame before starting new one');
            this.endMinigame(false, null);
            // N-02 (Phase 0 round 2): ending the displaced minigame can run a
            // chain of onCompletes — a child's returnTo releasing a suspended
            // parent (_releaseParent), and that parent's own onComplete opening
            // its own minigame. Any minigame now running was opened during that
            // teardown, and installing this interrupting scene below would
            // overwrite currentMinigame and orphan it (its container left in the
            // DOM, cleanup never called, input disabled). End it too first. This
            // never fires for a clean S12 suspend (that path ends with no
            // minigame running); the guard bounds a pathological onComplete loop.
            let strayGuard = 0;
            while (this.currentMinigame && !this.currentMinigame._ending && strayGuard++ < 8) {
                const stray = this.currentMinigame;
                console.log('Ending a minigame opened during teardown before the interrupt (N-02)');
                this.endMinigame(false, null);
                if (this.currentMinigame === stray) { this.currentMinigame = null; break; }
            }
        }

        // The child's returnTo remembers the parent's full params, so the parent
        // reopens as it was started (a copy: the caller's object is not changed)
        if (suspendedParent && params?.returnTo && params.returnTo.sceneType === suspendedParent.sceneType) {
            params = { ...params, returnTo: { ...params.returnTo, _parentParams: suspendedParent.params } };
        }

        // Check if this minigame requires keyboard input
        // (a child of a parent that paused the world keys keeps them paused,
        // unless the child says requiresKeyboardInput: false)
        const requiresKeyboardInput = params?.requiresKeyboardInput ||
            (suspendedParent?.params?.requiresKeyboardInput === true && params?.requiresKeyboardInput !== false) ||
            false;
        
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
        // Lets the UI themes (css/ui-themes.css) frame the generic tool windows
        container.dataset.minigame = sceneType;

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
        // A task or pickup toast raised just before this opened waits for it to close
        // (notifications.js; m07 confirmation N1)
        window.holdRecentNotifications?.();
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
            // A suspended parent ended to make room for its child (S12) is paused,
            // not finished: no onComplete, and no return-to of its own.
            const suspendedForChild = ending._suspendedForChild === true;
            try {
                if (!suspendedForChild && ending.params && ending.params.onComplete) {
                    console.log('Calling onComplete callback');
                    ending.params.onComplete(success, result);
                }
            } finally {
                if (this.currentMinigame === ending) {
                    this.currentMinigame = null;
                }
            }
            // Return-to (S12): reopen the parent after onComplete, on a normal exit
            // only, and only if onComplete did not already open something
            if (!suspendedForChild && ending.params?.returnTo) {
                const reopened = this._startReturnTo(ending.params.returnTo, success, result);
                if (!reopened && !this.currentMinigame) {
                    this._releaseParent(ending.params.returnTo, success, result);
                }
            }
            // The child is about to start in the same call: leave its container
            // and the held barks alone until it is open
            if (suspendedForChild) {
                console.log(`Suspended minigame for a child (success: ${success})`);
                return;
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
    
    /**
     * S12 normal exit: the minigame finished (success true) and did not mark
     * its result as aborted. Failure closes (Cancel, a hit, the KO screen, a
     * forced conversation) and an aborted Esc do not reopen the parent.
     */
    isNormalExit(success, result) {
        return success === true && !(result && result.aborted === true);
    },

    _startReturnTo(returnTo, success, result) {
        if (!this.isNormalExit(success, result)) {
            console.log('returnTo skipped: not a normal exit');
            return null;
        }
        if (this.currentMinigame) {
            console.log('returnTo skipped: onComplete already opened', this.currentMinigame._sceneType);
            return null;
        }
        if (!returnTo || typeof returnTo.sceneType !== 'string') {
            console.warn('returnTo ignored: no sceneType', returnTo);
            return null;
        }
        const base = returnTo._parentParams || {};
        const params = { ...base, ...(returnTo.params || {}), suspended: false };
        try {
            return this.startMinigame(returnTo.sceneType, null, params);
        } catch (err) {
            console.error(`returnTo failed to reopen '${returnTo.sceneType}':`, err);
            return null;
        }
    },

    // The suspended parent will not come back: run its own onComplete once,
    // marked as an abnormal close through its child (R-05)
    _releaseParent(returnTo, success, result) {
        const parentParams = returnTo?._parentParams;
        if (!parentParams || typeof parentParams.onComplete !== 'function') return;
        if (this._releasedParents.has(parentParams)) return;
        this._releasedParents.add(parentParams);
        try {
            parentParams.onComplete(false, { aborted: true, viaChild: true, childSuccess: success, childResult: result ?? null });
        } catch (err) {
            console.error('Suspended parent onComplete failed:', err);
        }
    },

    _releasedParents: new WeakSet(),

    // A launch that never started must not leave the running parent marked
    // suspended, or a later close would skip its onComplete
    _clearSuspend() {
        const m = this.currentMinigame;
        if (m && !m._ending && m.params?.suspended === true) {
            m.params.suspended = false;
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