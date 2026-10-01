// Base class for minigame scenes
export class MinigameScene {
    constructor(container, params) {
        this.container = container;
        this.params = params;
        this.gameState = {
            isActive: false,
            mouseDown: false,
            currentTool: null
        };
        this.gameResult = null;
        this._eventListeners = [];
    }
    
    init() {
        // Check if cancel button should be shown (default: true)
        // disableClose hides the × button and the cancel button and blocks Esc — useful for forced cutscene conversations
        const disableClose = this.params.disableClose === true;
        const showCancel = this.params.showCancel !== false && !disableClose;

        this.container.innerHTML = `
            <button class="minigame-close-button" id="minigame-close" ${disableClose ? 'style="display:none"' : ''}>&times;</button>
            <div class="minigame-header">
                <h3>${this.params.title || 'Minigame'}</h3>
            </div>
            <div class="minigame-game-container"></div>
            <div class="minigame-message-container"></div>
            ${showCancel ? `<div class="minigame-controls"><button class="minigame-button" id="minigame-cancel">${this.params.cancelText || 'Cancel'}</button></div>` : ''}
        `;

        this.headerElement = this.container.querySelector('.minigame-header');
        this.gameContainer = this.container.querySelector('.minigame-game-container');
        this.messageContainer = this.container.querySelector('.minigame-message-container');
        this.controlsElement = this.container.querySelector('.minigame-controls');

        // Set up close button (skipped if disableClose)
        const closeBtn = document.getElementById('minigame-close');
        if (!disableClose) {
            this.addEventListener(closeBtn, 'click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Close button clicked');
                this.complete(false);
            });
        }
        
        // Set up cancel button only if it exists
        const cancelBtn = document.getElementById('minigame-cancel');
        if (cancelBtn) {
            console.log('Cancel button found, setting up event listener');
            this.addEventListener(cancelBtn, 'click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Cancel button clicked');
                this.complete(false);
            });
        } else {
            console.log('Cancel button not found');
        }

        // hide the header if the params.headerElement is empty
        if (!this.params.headerElement) {
            this.headerElement.style.display = 'none';
        }
    }
    
    start() {
        this.gameState.isActive = true;
        console.log("Minigame started");
        
        // Esc-to-close handler — skipped if disableClose is set
        if (this.params.disableClose !== true) {
            this._fallbackCloseHandler = (e) => {
                if (e.key === 'Escape') {
                    console.log('Escape key pressed, closing minigame');
                    this.complete(false);
                }
            };
            document.addEventListener('keydown', this._fallbackCloseHandler);
        }
    }
    
    complete(success) {
        console.log('Minigame complete called with success:', success);

        // Guard against stale minigame instances (e.g. a deferred showSuccess timer
        // from an NPC chat firing after a new minigame has already started).
        if (window.MinigameFramework && window.MinigameFramework.currentMinigame !== this) {
            console.warn('complete() called on a superseded minigame instance — ignoring', this.constructor.name);
            return;
        }

        this.gameState.isActive = false;
        
        // Emit minigame completion event
        console.log('🎮 Checking for eventDispatcher:', !!window.eventDispatcher);
        if (window.eventDispatcher) {
            const eventName = success ? 'minigame_completed' : 'minigame_failed';
            console.log(`🎮 Emitting ${eventName} event for minigame:`, this.constructor.name);
            window.eventDispatcher.emit(eventName, {
                minigameName: this.constructor.name,
                success: success,
                result: this.gameResult
            });
        } else {
            console.warn('🎮 eventDispatcher not available - minigame event not emitted');
        }
        
        if (window.MinigameFramework) {
            window.MinigameFramework.endMinigame(success, this.gameResult);
        } else {
            console.error('MinigameFramework not available');
        }
    }
    
    addEventListener(element, eventType, handler) {
        element.addEventListener(eventType, handler);
        this._eventListeners.push({ element, eventType, handler });
    }
    
    showSuccess(message, autoClose = true, duration = 2000) {
        const messageElement = document.createElement('div');
        messageElement.className = 'minigame-success-message';
        messageElement.innerHTML = message;
        
        this.messageContainer.appendChild(messageElement);
        
        if (autoClose) {
            setTimeout(() => {
                this.complete(true);
            }, duration);
        }
    }
    
    showFailure(message, autoClose = true, duration = 2000) {
        const messageElement = document.createElement('div');
        messageElement.className = 'minigame-failure-message';
        messageElement.innerHTML = message;
        
        this.messageContainer.appendChild(messageElement);
        
        if (autoClose) {
            setTimeout(() => {
                this.complete(false);
            }, duration);
        }
    }
    
    updateProgress(current, total) {
        const progressBar = this.container.querySelector('.minigame-progress-bar');
        if (progressBar) {
            const percentage = (current / total) * 100;
            progressBar.style.width = `${percentage}%`;
        }
    }
    
    /**
     * ── Test bridge hook ─────────────────────────────────────────────────────
     *
     * Return a JSON-safe snapshot of this minigame for window.__test.
     *
     * The base implementation reflects the overlay's DOM: the visible text,
     * the clickable controls and any text fields. That is enough for an agent
     * to drive ANY minigame generically, so a newly added minigame works with
     * the test bridge without extra effort.
     *
     * Override this in a subclass when the minigame has state a human reads
     * that the raw DOM does not express well (attempts remaining, which pin is
     * set, whose dialogue line is showing). Call super.getTestState() and
     * spread it so the generic controls stay available:
     *
     *     getTestState() {
     *         return { ...super.getTestState(), attemptsLeft: this.attempts };
     *     }
     *
     * Rules for overrides: return plain JSON only (no DOM nodes, no Phaser
     * objects), and never mutate game state from here — this is read-only.
     */
    getTestState() {
        const root = this.container;
        if (!root) return { available: false };

        const visible = (el) => {
            if (!el) return false;
            if (el.hidden) return false;
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') return false;
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
        };

        const controls = Array.from(
            root.querySelectorAll('button, [role="button"], a[href], .clickable, input[type="button"], input[type="submit"]')
        ).filter(visible).slice(0, 60).map((el, i) => ({
            index: i,
            label: (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().slice(0, 120),
            id: el.id || null,
            classes: el.className || null,
            disabled: !!el.disabled
        }));

        const fields = Array.from(
            root.querySelectorAll('input:not([type="button"]):not([type="submit"]), textarea, select')
        ).filter(visible).slice(0, 30).map((el, i) => ({
            index: i,
            id: el.id || null,
            name: el.name || null,
            type: el.type || el.tagName.toLowerCase(),
            placeholder: el.placeholder || null,
            value: el.type === 'password' ? '[hidden]' : String(el.value ?? '').slice(0, 120)
        }));

        return {
            available: true,
            title: this.params?.title || null,
            // A viewer opened from inside a container re-opens that container
            // when it closes (window.pendingContainerReturn). Without this an
            // agent reads the bounce-back as a stray minigame appearing from
            // nowhere, or loops closing the same pair forever.
            returnsToContainer: !!window.pendingContainerReturn,
            isActive: !!this.gameState?.isActive,
            isComplete: this.gameState?.isActive === false,
            result: this.gameResult ?? null,
            text: (root.innerText || '').trim().replace(/\n{3,}/g, '\n\n').slice(0, 2000),
            controls,
            fields
        };
    }

    cleanup() {
        this._eventListeners.forEach(({ element, eventType, handler }) => {
            element.removeEventListener(eventType, handler);
        });
        this._eventListeners = [];
        
        // Clean up fallback close handler
        if (this._fallbackCloseHandler) {
            document.removeEventListener('keydown', this._fallbackCloseHandler);
            this._fallbackCloseHandler = null;
        }
    }
} 