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

        // A tap or key menu left open would sit over the minigame
        window.closeInteractionMenu?.();

        // Where focus was before any minigame took it, so the close can give it back.
        // Only the first minigame of a chain notes it: a chained one opens while focus is
        // already inside the previous panel (or on a stale element).
        const notedOpener = !this.currentMinigame;
        if (notedOpener) this._noteFocusOpener();

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
            this._displacing = true;
            try {
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
            } finally {
                this._displacing = false;
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

        // Create and start the minigame
        const MinigameClass = this.registeredScenes[sceneType];
        try {
            this.currentMinigame = new MinigameClass(container, params);
        } catch (err) {
            // Nothing opened, so nothing will close and hand focus back: drop the opener this call
            // noted (a chained start keeps the first one, which the running chain still owns)
            if (notedOpener) {
                this._focusOpener = null;
                this._focusOpenerKeyboard = false;
            }
            throw err;
        }
        this.currentMinigame._sceneType = sceneType;
        // The player's phone pose for a phone-style minigame (systems/player-poses.js)
        try { window.playerPoses?.onMinigameStart?.(sceneType, params, this.currentMinigame); } catch (e) { /* cosmetic */ }
        this._updateBarkLayer();
        this._installFocusTrap();
        // A task or pickup toast raised just before this opened waits for it to close
        // (notifications.js; m07 confirmation N1)
        window.holdRecentNotifications?.();
        // Warnings and errors over the panel are placed clear of its title, X and controls
        // (ui/hud-lanes.js placeNotifyBlock, toast plan 2.8)
        try { window.hudLanesRelayout?.(); } catch (e) { /* the lanes re-place on their own frame */ }
        // The panel the toasts were waiting for is here: it holds them from now on
        window.clearExpectedPanel?.();
        this.currentMinigame.init();
        this.currentMinigame.start();
        // The ringer re-checks after this swap has finished (phone calls plan 2.9)
        try { window.phoneRinger?.onMinigameStarted?.(sceneType, params); } catch (e) { console.error('phoneRinger start hook failed', e); }
        
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

    // ---- Focus trap (UI sweep) -------------------------------------------------------
    // While a modal minigame is open, Tab and Shift+Tab cycle inside its container and never
    // reach the HUD behind it. One capture-phase listener serves every minigame: the
    // focusable set is recomputed on each Tab because panels change their content. It steps
    // aside for a higher modal (the ending confirm, gameConfirm, the game menu), for an
    // element inside a modal or listbox that runs its own Tab cycle, and for an embedded
    // container (data-external) or a scene that opts out with params.focusTrap === false.
    // An inner panel opts in to stepping aside by carrying data-own-tab-cycle (it must handle
    // Tab itself); a listbox always does. Any other inner aria-modal or role=dialog becomes
    // the trap's scope (_innerDialog). Limit: Tab pressed inside an iframe (the VM console) is
    // delivered to the iframe's document, so this listener never sees it; focus stays in the
    // frame until the browser's Tab leaves it, and the next Tab out here lands back in the trap.
    // The ring banner joins the cycle only while no inner dialog is open: an open inner dialog
    // is modal and holds Tab to itself, so a call waits behind it (intended).
    // Gap: role="alertdialog" is not treated as a dialog here. Nothing in the game uses one today;
    // the phone-chat-ui ring panel would be the first to be caught by adding it.

    FOCUSABLE_SELECTOR: 'a[href], button, input, select, textarea, summary, iframe, object, embed, audio[controls], video[controls], [tabindex], [contenteditable]:not([contenteditable="false"])',

    _installFocusTrap() {
        if (this._trapHandler || typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
        this._trapHandler = (e) => this._onTrapKeyDown(e);
        document.addEventListener('keydown', this._trapHandler, true);
    },

    _removeFocusTrap() {
        if (!this._trapHandler) return;
        try { document.removeEventListener('keydown', this._trapHandler, true); } catch (e) { /* torn down */ }
        this._trapHandler = null;
    },

    /**
     * True when the element is rendered: no display:none, hidden, inert or closed <details>
     * on it or an ancestor. Uses checkVisibility where the browser has it; jsdom does not,
     * so the ancestor walk (up to `root`'s parent, or the document) stands in.
     */
    _isRendered(el, root = null) {
        if (!el) return false;
        if (typeof el.checkVisibility === 'function') {
            try { if (!el.checkVisibility({ checkVisibilityCSS: true })) return false; } catch (e) { /* older signature */ }
            for (let n = el; n; n = n.parentElement) if (n.hasAttribute?.('inert')) return false;
            return true;
        }
        const gcs = typeof window !== 'undefined' ? window.getComputedStyle : null;
        const stop = root ? root.parentNode : null;
        for (let n = el; n && n !== stop; n = n.parentElement) {
            if (n.hidden || n.hasAttribute?.('inert')) return false;
            if (n.tagName === 'DETAILS' && !n.open && n !== el && !(el.tagName === 'SUMMARY' && el.parentElement === n)) return false;
            const cs = gcs ? gcs.call(window, n) : null;
            if (cs && (cs.display === 'none' || (n === el && cs.visibility === 'hidden'))) return false;
        }
        return true;
    },

    /** True when the element can take focus by Tab: enabled, shown, not inert. */
    _isTabbable(el, root) {
        if (!el || el.disabled || el.hidden) return false;
        try { if (typeof el.matches === 'function' && el.matches(':disabled')) return false; } catch (e) { /* selector unsupported */ }
        const ti = el.getAttribute?.('tabindex');
        if (ti !== null && ti !== undefined && Number.isFinite(parseInt(ti, 10)) && parseInt(ti, 10) < 0) return false;
        if (el.tagName === 'INPUT' && el.type === 'hidden') return false;
        if (el.getAttribute?.('aria-hidden') === 'true') return false;
        return this._isRendered(el, root);
    },

    /** Keep one radio per name group (the checked one, else the first), as the browser's Tab does. */
    _collapseRadios(items) {
        const chosen = new Map();
        for (const el of items) {
            if (el.tagName !== 'INPUT' || el.type !== 'radio' || !el.name) continue;
            const key = `${el.form ? 'f' : ''}|${el.name}`;
            const cur = chosen.get(key);
            if (!cur || (el.checked && !cur.checked)) chosen.set(key, el);
        }
        return items.filter((el) => !(el.tagName === 'INPUT' && el.type === 'radio' && el.name)
            || chosen.get(`${el.form ? 'f' : ''}|${el.name}`) === el);
    },

    /**
     * The tabbable elements, in DOM order, then those of any [data-focus-trap-include]
     * element outside the root (the incoming-call banner rings over a minigame).
     */
    _trapFocusables(root, withIncluded = false) {
        const own = Array.from(root.querySelectorAll(this.FOCUSABLE_SELECTOR)).filter((el) => this._isTabbable(el, root));
        let all = own;
        if (withIncluded && typeof document !== 'undefined') {
            for (const host of document.querySelectorAll('[data-focus-trap-include]')) {
                if (root.contains(host) || !this._isRendered(host)) continue;
                const extra = Array.from(host.querySelectorAll(this.FOCUSABLE_SELECTOR)).filter((el) => this._isTabbable(el, host));
                if (host.matches?.(this.FOCUSABLE_SELECTOR) && this._isTabbable(host, host)) extra.unshift(host);
                all = all.concat(extra);
            }
        }
        return this._collapseRadios(all);
    },

    /** A rendered modal above the minigame, with its own keys: the trap leaves Tab to it. */
    _higherModalOpen(root) {
        if (window.gameConfirmOpen?.()) return true;
        if ((window.openModalCount?.() || 0) > 0) return true;
        const above = document.querySelectorAll('[aria-modal="true"], .game-confirm-overlay');
        for (const m of above) {
            if (!root.contains(m) && this._isRendered(m)) return true;
        }
        return false;
    },

    /**
     * A rendered dialog inside the minigame (the last one), or null. A dialog that is the
     * scene itself (the only child of the game container, or the minigame's own root element) is
     * the minigame, not an inner panel, so it does not count.
     */
    _innerDialog(root) {
        const m = this.currentMinigame;
        const sceneRoots = [root, m?.gameContainer, m?.rootElement, m?.root, m?.element];
        const isSceneRoot = (el) => el.parentElement === root || (m?.gameContainer && el.parentElement === m.gameContainer && m.gameContainer.children.length === 1) || sceneRoots.includes(el);
        const found = Array.from(root.querySelectorAll('[aria-modal="true"], [role="dialog"]'))
            .filter((el) => !isSceneRoot(el) && this._isRendered(el, root));
        return found.length ? found[found.length - 1] : null;
    },

    _onTrapKeyDown(e) {
        if (!e || e.key !== 'Tab' || e.defaultPrevented || e.ctrlKey || e.altKey || e.metaKey) return;
        const m = this.currentMinigame;
        if (!m || m._ending) return;
        const root = m.container;
        if (!root || root.isConnected === false || typeof root.querySelectorAll !== 'function') return;
        if (m.params?.focusTrap === false || root.hasAttribute?.('data-external')) return;
        if (this._higherModalOpen(root)) return;
        const active = document.activeElement;
        // A modal or listbox inside the minigame that cycles Tab itself keeps it
        if (active && root.contains(active) && active.closest?.('[role="listbox"], [data-own-tab-cycle]')) return;

        // A visible inner dialog is the trap root even before focus has moved into it
        const dialog = this._innerDialog(root);
        const scope = dialog || root;
        const items = this._trapFocusables(scope, !dialog);
        e.preventDefault();
        if (!items.length) {
            if (scope.getAttribute('tabindex') === null) scope.setAttribute('tabindex', '-1');
            try { scope.focus({ preventScroll: true }); } catch (err) { /* no focus in this environment */ }
            return;
        }
        const i = active ? items.indexOf(active) : -1;
        let next;
        if (i === -1) next = e.shiftKey ? items[items.length - 1] : items[0];
        else next = items[(i + (e.shiftKey ? -1 : 1) + items.length) % items.length];
        try {
            next.focus();
            // Panels that scroll keep the focused control on screen
            next.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
        } catch (err) { /* no focus in this environment */ }
    },

    /** Remember the element that had focus when the first minigame of a chain opened. */
    _noteFocusOpener() {
        if (typeof document === 'undefined') return;
        const a = document.activeElement;
        if (!a || a === document.body || a === document.documentElement) return;
        if (a.closest?.('.minigame-container')) return;
        this._focusOpener = a;
        let kb = false;
        try { kb = !!a.matches?.(':focus-visible'); } catch (err) { /* selector unsupported */ }
        this._focusOpenerKeyboard = kb;
    },

    /** Give focus back once the whole chain has closed, if nothing else took it. */
    _restoreFocusOpener() {
        const el = this._focusOpener;
        const viaKeyboard = this._focusOpenerKeyboard === true;
        this._focusOpener = null;
        this._focusOpenerKeyboard = false;
        if (!el || typeof document === 'undefined' || el.isConnected === false) return;
        if (!this._isRendered(el)) return;
        // A button focused by mouse or E stays off: a focused button makes WASD/E/Space count as UI keys
        const isControl = el.matches?.('button, input, select, textarea, a[href]');
        if (isControl && !viaKeyboard) return;
        const now = document.activeElement;
        if (now && now !== document.body && now !== document.documentElement) return;
        try { el.focus({ preventScroll: true }); } catch (err) { /* no focus in this environment */ }
    },

    _updateBarkLayer() {
        if (typeof document === 'undefined' || !document.body) return;
        document.body.classList.toggle('minigame-holds-barks', this.holdsBarks());
    },

    /**
     * A child opened from a chat (the NPC's inventory, the card reader) leaves a pending return
     * to that chat. If the child ends any way but complete() handing back to it (force close,
     * displaced by another scene), nothing would ever clear the record and the NPC would stay
     * "in chat" for the session (POSE_FIXES_REVIEW_R3 M1).
     */
    _dropStrandedChatReturn(ending) {
        if (typeof window === 'undefined' || !window.pendingConversationReturn) return;
        const isChild = ending.mode === 'npc' || ending._sceneType === 'rfid';
        if (isChild && ending._returnsToChat !== true) window.pendingConversationReturn = null;
    },

    /**
     * The one clearing point for a pending chat return that nothing will resume
     * (POSE_FIXES_REVIEW_R4 M1). A note, file or other item opened from the NPC's inventory
     * hands the chat on to a reader; if the reader is closed by a hit, a knockout, a
     * conversation or a room change, or the item never returns to a container, no later end
     * names the record. So every minigame end that leaves a record behind queues one check a
     * moment later (long enough for the 100 ms container reopen): the record stays only while
     * the chat is coming back (`returning`), the NPC inventory or card reader is open, or a
     * reader started from the inventory is still open (pendingContainerReturn). Otherwise it
     * names nobody and is dropped.
     */
    CHAT_RETURN_SETTLE_MS: 400,

    _queueChatReturnSettle() {
        if (typeof window === 'undefined') return;
        const rec = window.pendingConversationReturn;
        if (!rec || rec.returning === true) return;
        setTimeout(() => this._settleChatReturn(rec), this.CHAT_RETURN_SETTLE_MS);
    },

    _settleChatReturn(rec) {
        if (typeof window === 'undefined' || window.pendingConversationReturn !== rec) return;
        if (rec.returning === true) return;
        const cur = this.currentMinigame;
        const open = !!cur && !cur._ending;
        // The inventory itself, or the clone reader this chat started (not a door reader)
        if (open && (cur.mode === 'npc' || (cur._sceneType === 'rfid' && cur.params?.mode === 'clone'))) return;
        // A reader started from THIS NPC's inventory; a stale return from any other container
        // does not count
        const fromInventory = rec.npcId != null
            && window.pendingContainerReturn?.npcOptions?.npcId === rec.npcId;
        if (open && fromInventory) return;
        // An interactionWarning confirm for an inventory item is a dialog, not a minigame:
        // look again once it is answered
        if (!open && fromInventory && window.gameConfirmOpen?.()) {
            setTimeout(() => this._settleChatReturn(rec), this.CHAT_RETURN_SETTLE_MS);
            return;
        }
        window.pendingConversationReturn = null;
    },

    endMinigame(success, result) {
        console.log('endMinigame called with success:', success, 'result:', result);
        if (this.currentMinigame && this.currentMinigame._ending) {
            console.log('Minigame is already ending, ignoring re-entrant endMinigame');
            return;
        }
        if (this.currentMinigame) {
            const ending = this.currentMinigame;
            // A success already decided and shown, closed during its hold by X, Esc, a click
            // outside or a forced end, still counts: the unlock must not be lost
            if (!success && ending._successPending === true) {
                success = true;
                if (result == null) result = ending.gameResult;
            }
            ending._ending = true;
            this._dropStrandedChatReturn(ending);
            try { window.playerPoses?.onMinigameEnd?.(ending); } catch (e) { /* cosmetic */ }
            // Held toasts wait a moment: a panel reopened a tick after this one closes would
            // otherwise pull them back and show them twice (notifications.js PANEL_SETTLE_MS)
            window.settleAfterPanelClose?.();
            console.log('Cleaning up current minigame');
            // The end hook runs from the finally below, so a throwing cleanup or onComplete
            // cannot skip it (phone calls plan 2.9, review R2 M2).
            try {
            ending.cleanup();
            
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
            // A minigame that cancels touch events can leave the main game's touch pointers
            // held down (Phaser drops a cancelled touchend), and then the world ignores every
            // later touch (slice 7 R4 B1): let go of any still held
            this.releaseHeldTouchPointers();

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
            // The settle window counts from now, after the close work (cleanup, onComplete),
            // which can take longer than the window under load
            if (!this.currentMinigame) window.settleAfterPanelClose?.();
            // Nothing is running now, so any auto-created container still in the
            // DOM is an orphan (it would sit over the canvas swallowing clicks).
            if (!this.currentMinigame) {
                document.querySelectorAll('.minigame-container:not([data-external])').forEach(el => el.remove());
            }
            // Barks held back while the minigame was open play now (D5)
            this._updateBarkLayer();
            if (!this.currentMinigame) {
                this._removeFocusTrap();
                // A minigame displaced by another keeps the chain's opener for the new one
                if (!this._displacing) this._restoreFocusOpener();
                window.barkSystem?.drainDeferredBarks?.();
            }
            console.log(`Ended minigame with success: ${success}`);
            } finally {
                // A parent handing over to a child does not end for the ringer's purposes (2.9).
                // The hook gets the ending minigame: it reads params.ringerCall, _endedByCall and
                // _callFinished off it.
                if (ending._suspendedForChild !== true) {
                    try { window.phoneRinger?.onMinigameEnded?.(ending); } catch (e) { console.error('phoneRinger end hook failed', e); }
                }
                // Toasts placed over the panel go back to the lane; waiting ones show (toast plan 2.8)
                try { window.hudLanesRelayout?.(); } catch (e) { /* the lanes re-place on their own frame */ }
                // Keyring Connect's returnTo listens for this (K3b R3 t1); a parent paused for a
                // child has not ended, so it sends nothing
                // The chat-return record is queued here so a throwing cleanup or onComplete cannot skip it;
                // a parent handing over to a child leaves it to the child (POSE_FIXES_REVIEW_R5 m3)
                if (ending._suspendedForChild !== true) {
                    try { window.eventDispatcher?.emit?.('minigame_ended', { success: !!success }); } catch (e) { console.warn('minigame_ended listeners threw', e); }
                    try { this._queueChatReturnSettle(); } catch (e) { console.error('chat return settle failed', e); }
                }
            }
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
    
    /**
     * Release the main game's touch pointers that are still marked down or active. Phaser
     * 3.60 has a fixed number of touch pointers and gives a new touch only a free one, so a
     * pointer whose touchend it never saw blocks touch input until a reload. The mouse
     * pointer is left alone. Returns how many pointers were released.
     */
    releaseHeldTouchPointers() {
        // The main scene, or failing that window.game: the main scene once its create() ran,
        // or the Phaser.Game before then, whose `input` is the manager itself (slice 7 R5 m2)
        const src = this.mainGameScene || (typeof window !== 'undefined' ? window.game : null);
        const manager = src?.input?.manager || (Array.isArray(src?.input?.pointers) ? src.input : null);
        const pointers = Array.isArray(manager?.pointers) ? manager.pointers : [];
        let released = 0;
        for (const p of pointers) {
            if (!p || p === manager.mousePointer) continue;
            if (!p.isDown && !p.active) continue;
            p.isDown = false;
            p.primaryDown = false;
            p.buttons = 0;
            p.active = false;
            p.wasCanceled = true;
            p.identifier = -1;
            p.pointerId = null;
            released += 1;
        }
        if (released) console.log(`Released ${released} held main-game touch pointer(s)`);
        return released;
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