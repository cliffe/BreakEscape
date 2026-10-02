import { MinigameScene } from '../framework/base-minigame.js';

// Load title screen CSS
const titleScreenCSS = document.createElement('link');
titleScreenCSS.rel = 'stylesheet';
titleScreenCSS.href = '/break_escape/css/title-screen.css';
titleScreenCSS.id = 'title-screen-css';
if (!document.getElementById('title-screen-css')) {
    document.head.appendChild(titleScreenCSS);
}

/**
 * Title Screen Minigame
 * Phase 1: Hacktivity logo fades in, zooms to 200%, fades out.
 * Phase 2: Mission display_name typed out terminal-style with blinking cursor.
 * Phase 3: "Click to continue" prompt — player gesture required before closing.
 *          This also satisfies the browser's autoplay policy for audio.
 */
export class TitleScreenMinigame extends MinigameScene {
    constructor(container, params) {
        super(container, params);
        this.autoCloseTimeout = params?.autoCloseTimeout ?? 3000;
    }

    init() {
        this.container.innerHTML = `
            <div class="title-screen-container">
                <img src="/break_escape/assets/logos/hacktivity-logo.svg" alt="Hacktivity Logo" class="title-screen-logo">
                <div class="title-screen-title" style="visibility: hidden;">
                    <span class="title-screen-typed-text"></span><span class="title-screen-cursor">█</span>
                </div>
                <div class="title-screen-prompt" style="visibility: hidden;">Continue?</div>
            </div>
        `;

        this.container.style.cssText = `
            width: 100%;
            height: 100%;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #1a1a1a;
            margin: 0;
            padding: 0;
        `;

        this.titleScreenContainer = this.container.querySelector('.title-screen-container');
        this._typingStarted = false;
        this._typingTimer = null;
        this._loadingTimer = null;
        this._typingDone = false;
        this._gameLoaded = false;
        this._playerClicked = false;
        this._clickHandler = null;
    }

    start() {
        super.start();
        console.log('🎬 Title Screen started');

        const logo      = this.container.querySelector('.title-screen-logo');
        const titleEl   = this.container.querySelector('.title-screen-title');
        const typedText = this.container.querySelector('.title-screen-typed-text');
        const promptEl  = this.container.querySelector('.title-screen-prompt');

        // Phase 1 → 2: fixed timer matching the CSS animation duration.
        // animationend is unreliable when CSS loads async after the element is in the DOM.
        setTimeout(() => {
            logo.style.visibility = 'hidden';
            titleEl.style.visibility = 'visible'; // cursor blinks immediately
            this._startTyping(typedText, promptEl);
        }, 2500);

        // game_loaded fires when the world finishes building.
        // We close only when BOTH this fires AND the player has clicked.
        this._onGameLoaded = () => {
            window.eventDispatcher?.off('game_loaded', this._onGameLoaded);
            this._onGameLoaded = null;
            console.log('🎬 Title screen: game_loaded received');
            this._gameLoaded = true;
            if (this._playerClicked) {
                this.complete(true);
            }
        };

        if (window.eventDispatcher) {
            window.eventDispatcher.on('game_loaded', this._onGameLoaded);
        } else {
            console.warn('🎬 Title screen: eventDispatcher not ready');
            this._gameLoaded = true; // treat as loaded so click closes immediately
        }

        if (this.autoCloseTimeout) {
            // Dev/test mode: auto-close after timeout, no click required.
            this.autoCloseTimer = setTimeout(() => {
                console.log('⏱️ Title screen auto-closing after timeout');
                this.complete(true);
            }, this.autoCloseTimeout);
        } else {
            // Failsafe: close after 2 minutes even if player never clicks.
            this.autoCloseTimer = setTimeout(() => {
                if (window.MinigameFramework?.currentMinigame === this) {
                    console.log('⏱️ Title screen: failsafe close');
                    this.complete(true);
                }
            }, 120000);
        }
    }

    _startTyping(typedTextEl, promptEl) {
        if (this._typingStarted) return;
        this._typingStarted = true;

        const name = window.breakEscapeConfig?.missionDisplayName ?? '';
        const CHAR_DELAY = 85;
        let i = 0;

        const tick = () => {
            if (i < name.length) {
                typedTextEl.textContent = name.slice(0, ++i);
                this._typingTimer = setTimeout(tick, CHAR_DELAY);
            } else {
                this._onTypingComplete(promptEl);
            }
        };
        this._typingTimer = setTimeout(tick, CHAR_DELAY);
    }

    _onTypingComplete(promptEl) {
        this._typingDone = true;
        promptEl.style.visibility = 'visible';

        this._clickHandler = () => {
            this._playerClicked = true;
            if (this._gameLoaded) {
                this.complete(true);
            } else {
                // Remove click listener — no further interaction needed
                this.container.removeEventListener('click', this._clickHandler);
                this._clickHandler = null;
                // Stop blinking and type the loading state
                promptEl.style.animation = 'none';
                this._typeLoadingPrompt(promptEl);
            }
        };
        this.container.addEventListener('click', this._clickHandler);
    }

    _typeLoadingPrompt(promptEl) {
        const LOADING_TEXT = 'Loading';
        const CHAR_DELAY = 85;
        const DOT_DELAY = 700;

        promptEl.textContent = '';
        let i = 0;

        const typeLoading = () => {
            if (i < LOADING_TEXT.length) {
                promptEl.textContent = LOADING_TEXT.slice(0, ++i);
                this._loadingTimer = setTimeout(typeLoading, CHAR_DELAY);
            } else {
                this._loadingTimer = setTimeout(addDot, DOT_DELAY);
            }
        };

        const addDot = () => {
            promptEl.textContent += '.';
            this._loadingTimer = setTimeout(addDot, DOT_DELAY);
        };

        this._loadingTimer = setTimeout(typeLoading, CHAR_DELAY);
    }

    complete(success) {
        console.log('🎬 Title screen closing');
        if (this.autoCloseTimer) clearTimeout(this.autoCloseTimer);
        super.complete(success);
    }

    cleanup() {
        if (this.autoCloseTimer) clearTimeout(this.autoCloseTimer);
        if (this._typingTimer) clearTimeout(this._typingTimer);
        if (this._onGameLoaded) {
            window.eventDispatcher?.off('game_loaded', this._onGameLoaded);
            this._onGameLoaded = null;
        }
        if (this._loadingTimer) clearTimeout(this._loadingTimer);
        if (this._clickHandler) {
            this.container.removeEventListener('click', this._clickHandler);
            this._clickHandler = null;
        }
        super.cleanup();
    }
}

/**
 * Helper function to start the title screen minigame
 */
export function startTitleScreenMinigame(params = {}) {
    if (!window.MinigameFramework) {
        console.error('MinigameFramework not initialized');
        return;
    }

    const container = document.createElement('div');
    container.className = 'minigame-container';
    container.style.cssText = `
        width: 100%;
        height: 100%;
        position: fixed;
        top: 0;
        left: 0;
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        background: rgba(26, 26, 26, 0.95);
    `;
    document.body.appendChild(container);

    return window.MinigameFramework.startMinigame('title-screen', container, {
        title: 'BreakEscape',
        hideGameDuringMinigame: false,
        showCancel: false,
        headerElement: null,
        disableGameInput: true,
        ...params
    });
}
