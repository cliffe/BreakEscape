import { displayDashes } from '../../utils/display-dashes.js';
import { escapeHtml } from '../../utils/escape-html.js';

// A title of the form "ORGANISATION // CONSOLE NAME" (or "ORGANISATION - CONSOLE NAME") keeps
// the organisation in its own span, which phones under 600px wide hide so the console's own
// name shows; the text content, and the bar's title attribute, stay whole.
function consoleTitleHtml(text) {
    const t = String(text || '');
    const m = t.match(/^(.+?)( \/\/ | - )(.+)$/);
    if (!m) return escapeHtml(t);
    return `<span class="console-title-org">${escapeHtml(m[1] + m[2])}</span>${escapeHtml(m[3])}`;
}

// params.title and params.cancelText are plain text: they often come from scenario
// object names, NPC names or server data, so they are escaped before they reach the
// header HTML. No caller needs markup in a title, and there is deliberately no option
// for an HTML title; a subclass that wants richer header content builds it with DOM
// nodes after super.init().
// Base class for minigame scenes
export class MinigameScene {
    // true on a full-window console that keeps Cancel overlaid on its own bottom bar
    static controlsOverlay = false;

    // The X closes a minigame (and Esc), so the shell draws no Cancel button beside it
    // (UX slice 7 R1, the user's screenshot notes). A scene whose bottom button is not a
    // second close opts back in: the notes reader (Continue). Conversations no longer keep
    // End Conversation (UX q100): the X and Esc end them. The .minigame-controls row is drawn
    // only when it has something to hold: the kept Cancel, or a scene's own footer button
    // (Add to Notepad) added through ensureControlsRow(). A scene with neither has no row.
    static keepsCancelButton = false;

    // true: the X sits inside the scene's frame at its top right, never on the frame's border
    // or out on the screen's corner (UX slice 7 R1). The frame is closeAnchor(), the game
    // area unless a scene names another element. Opt-in, because a few scenes place the X
    // with their own CSS (title bars, the blockchain explorer, the shredded document).
    static closeInsideFrame = false;

    // true: the scene draws inside the shared console window (UI decision X8): the theme's
    // 9-slice frame, at most 1280x880, centred over the dimmed game (the whole window less
    // 8px on phones), with one title bar holding the title (Press Start 2P 16px), an optional
    // GNF subtitle and the X. The scene fills the game area under the bar and draws no title
    // bar or outer frame of its own; its inner panels keep their own look. The title is
    // consoleTitle() and the subtitle consoleSubtitle(); setConsoleTitle() changes them later.
    static consoleWindow = false;
    // With consoleWindow: true for a data console whose own panes scroll (a diagram, a log,
    // a dashboard), so the window takes its full size instead of wrapping its content
    static consoleWindowFill = false;
    // A scene whose subtitle carries something the player needs sets this to true: on phones
    // under 600px wide the subtitle then stays, on a second line of the bar
    // (css/minigames-framework.css)
    static consoleSubtitleEssential = false;

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
        // disableClose hides the × button and the cancel button and blocks Esc, for forced
        // cutscene conversations. Cancel is drawn only for a scene that keeps it (above).
        const disableClose = this.params.disableClose === true;
        const showCancel = this.constructor.keepsCancelButton === true && this.params.showCancel !== false && !disableClose;

        const isConsole = this.constructor.consoleWindow === true;
        this.container.classList?.toggle?.('minigame-console', isConsole);
        if (isConsole) {
            const sub = this.consoleSubtitle();
            this.container.innerHTML = `
            <div class="console-window${this.constructor.consoleWindowFill === true ? ' console-window-fill' : ''}${this.constructor.consoleSubtitleEssential === true ? ' console-subtitle-essential' : ''}" data-console-window>
                <div class="console-titlebar">
                    <div class="console-titles">
                        <h2 class="console-title">${consoleTitleHtml(displayDashes(this.consoleTitle()))}</h2>
                        <div class="console-subtitle" ${sub ? '' : 'hidden'}>${escapeHtml(displayDashes(sub))}</div>
                    </div>
                    <button class="minigame-close-button minigame-close-in-frame" id="minigame-close" aria-label="Close" ${disableClose ? 'style="display:none"' : ''}>&times;</button>
                </div>
                <div class="minigame-header" style="display:none"><h3></h3></div>
                <div class="minigame-game-container console-body"></div>
                <div class="minigame-message-container"></div>
                ${showCancel ? `<div class="minigame-controls"><button class="minigame-button" id="minigame-cancel">${escapeHtml(this.params.cancelText || 'Cancel')}</button></div>` : ''}
            </div>
        `;
            this.consoleWindowEl = this.container.querySelector('.console-window');
            this.consoleTitleEl = this.container.querySelector('.console-title');
            this.consoleSubtitleEl = this.container.querySelector('.console-subtitle');
            this.syncConsoleTitleTip();
        } else this.container.innerHTML = `
            <button class="minigame-close-button" id="minigame-close" ${disableClose ? 'style="display:none"' : ''}>&times;</button>
            <div class="minigame-header">
                <h3>${escapeHtml(displayDashes(this.params.title || 'Minigame'))}</h3>
            </div>
            <div class="minigame-game-container"></div>
            <div class="minigame-message-container"></div>
            ${showCancel ? `<div class="minigame-controls"><button class="minigame-button" id="minigame-cancel">${escapeHtml(this.params.cancelText || 'Cancel')}</button></div>` : ''}
        `;

        // A full-window console whose frame keeps a bar at its bottom for Cancel opts in to
        // the overlaid Cancel row (static controlsOverlay = true on the subclass); every
        // other scene keeps Cancel in the flow under its game area (code review R2 m2)
        this.container.classList?.toggle?.('minigame-controls-overlay', this.constructor.controlsOverlay === true);

        this.headerElement = this.container.querySelector('.minigame-header');
        this.gameContainer = this.container.querySelector('.minigame-game-container');
        this.messageContainer = this.container.querySelector('.minigame-message-container');
        this.controlsElement = this.container.querySelector('.minigame-controls');
        // The shell and the game area scroll when a short window cannot hold a frame: both
        // show the shared pixel-art scrollbar (css/utilities.css, UI shell build)
        this.container.classList?.add?.('pixel-scroll');
        this.gameContainer?.classList?.add?.('pixel-scroll');

        // Set up close button (skipped if disableClose)
        const closeBtn = document.getElementById('minigame-close');
        if (!disableClose) {
            this.addEventListener(closeBtn, 'click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Close button clicked');
                this.closeByPlayer();
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
                this.closeByPlayer();
            });
        } else {
            console.log('Cancel button not found');
        }

        // hide the header if the params.headerElement is empty
        if (!this.params.headerElement) {
            this.headerElement.style.display = 'none';
        }
    }
    
    /**
     * The controls row, made on first use: a scene with no Cancel gets no row from init(),
     * so an empty row never adds a gap or a stray box. A footer button (Add to Notepad) goes
     * in through here. The row sits under the message line, where the drawn row would be,
     * unless controlsHost() names another parent (the password screen's frame).
     */
    ensureControlsRow() {
        if (this.controlsElement) return this.controlsElement;
        if (typeof document === 'undefined') return null;
        const row = document.createElement('div');
        row.className = 'minigame-controls';
        const host = this.controlsHost();
        const after = this.messageContainer;
        if (host?.appendChild) host.appendChild(row);
        else if (after?.parentNode) after.parentNode.insertBefore(row, after.nextSibling);
        else if (this.container?.appendChild) this.container.appendChild(row);
        else return null;
        this.controlsElement = row;
        return row;
    }

    // The parent for a row made by ensureControlsRow(); null puts it under the message line
    controlsHost() {
        return null;
    }

    // The element whose top-right corner holds the X (closeInsideFrame scenes); a console
    // scene's frame is the shared window
    closeAnchor() {
        return this.consoleWindowEl || this.gameContainer;
    }

    // Shared console window title and subtitle (plain text)
    consoleTitle() {
        return this.params?.title || '';
    }

    consoleSubtitle() {
        return this.params?.consoleSubtitle || '';
    }

    setConsoleTitle(title, subtitle) {
        if (this.consoleTitleEl && title != null) {
            const text = displayDashes(String(title));
            if (typeof this.consoleTitleEl.innerHTML === 'string' && this.consoleTitleEl.nodeType === 1) this.consoleTitleEl.innerHTML = consoleTitleHtml(text);
            else this.consoleTitleEl.textContent = text;
        }
        if (this.consoleSubtitleEl && subtitle !== undefined) {
            this.consoleSubtitleEl.textContent = displayDashes(String(subtitle || ''));
            this.consoleSubtitleEl.hidden = !subtitle;
        }
        this.syncConsoleTitleTip();
    }

    // On short landscape windows the subtitle takes the width the title leaves; when that is
    // next to nothing it is hidden (it stays in the bar's title attribute). Measured with the
    // flag cleared so a window that grows again gets it back.
    fitConsoleSubtitle() {
        const sub = this.consoleSubtitleEl;
        if (typeof sub?.classList?.remove !== 'function' || sub.hidden) return;
        sub.classList.remove('console-subtitle-nowidth');
        if (!window.matchMedia?.('(max-height: 500px)').matches) return;
        if (sub.clientWidth < 48) sub.classList.add('console-subtitle-nowidth');
    }

    // The title is one line with an ellipsis, and on short or narrow windows the subtitle
    // shares that line or is hidden, so the bar's title attribute carries the full text
    syncConsoleTitleTip() {
        const holder = this.consoleTitleEl?.parentElement;
        if (!holder) return;
        const title = this.consoleTitleEl.textContent || '';
        const sub = this.consoleSubtitleEl && !this.consoleSubtitleEl.hidden ? (this.consoleSubtitleEl.textContent || '') : '';
        const tip = sub ? `${title}\n${sub}` : title;
        if (tip) holder.setAttribute('title', tip);
        else holder.removeAttribute('title');
        this.fitConsoleSubtitle();
    }

    // Puts the X inside the frame: below and left of the frame's border by a 4px gap, kept
    // on screen when a frame is taller or wider than the window.
    placeCloseButton() {
        const btn = this.container?.querySelector?.('#minigame-close');
        const frame = this.closeAnchor?.();
        if (!btn || !frame?.getBoundingClientRect || btn.style.display === 'none') return;
        const r = frame.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const c = this.container.getBoundingClientRect();
        const cs = window.getComputedStyle(frame);
        const gap = 4;
        // The X is fixed to the window (css/minigames-framework.css), so these are window
        // coordinates: a shell scrolled down or sideways moves the frame under the X, which
        // stays on the visible top-right of the frame (M1, M2 of the UI shell review).
        const shellBar = this.shellScrollbarWidth();
        const top = Math.max(r.top, c.top) + (parseFloat(cs.borderTopWidth) || 0) + gap;
        // A frame that scrolls keeps its scrollbar clear of the X
        const borders = (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.borderRightWidth) || 0);
        const scrollbar = Math.max(0, (frame.offsetWidth || 0) - (frame.clientWidth || 0) - borders);
        // The visible edge of the shell, less its own scrollbar
        const edge = c.right - shellBar;
        // `right` of a fixed box counts from the window's right edge, not the shell's (R2 B1:
        // a shell that is a narrow panel, as the scanners are, put the X at the window edge)
        const vw = document.documentElement.clientWidth || window.innerWidth;
        const right = vw - Math.min(r.right, edge) + (parseFloat(cs.borderRightWidth) || 0) + scrollbar + gap;
        btn.style.top = `${Math.round(top)}px`;
        btn.style.right = `${Math.round(Math.max(right, vw - c.right + shellBar + gap))}px`;
        btn.classList.add('minigame-close-in-frame');
    }

    // Width of the shell's own vertical scrollbar (0 when it does not scroll)
    shellScrollbarWidth() {
        const el = this.container;
        if (!el) return 0;
        const ccs = window.getComputedStyle(el);
        const borders = (parseFloat(ccs.borderLeftWidth) || 0) + (parseFloat(ccs.borderRightWidth) || 0);
        return Math.max(0, (el.offsetWidth || 0) - (el.clientWidth || 0) - borders);
    }

    // The default X is fixed to the window's top-right corner, so it stays reachable while the
    // shell scrolls either way; it sits left of the shell's scrollbar when one shows.
    _watchShellScrollbar() {
        const set = () => this.container?.style?.setProperty?.('--minigame-shell-bar', `${this.shellScrollbarWidth()}px`);
        const raf = window.requestAnimationFrame || ((f) => setTimeout(f, 16));
        set();
        raf(set);
        this.addEventListener(window, 'resize', set);
        if (typeof window.ResizeObserver === 'function' && this.container?.nodeType === 1) {
            this._shellObserver = new window.ResizeObserver(set);
            this._shellObserver.observe(this.container);
        }
    }

    _watchCloseButton() {
        const place = () => {
            if (!this.gameState.isActive) return;
            this.fitConsoleSubtitle();
            this.placeCloseButton();
        };
        const raf = window.requestAnimationFrame || ((f) => setTimeout(f, 16));
        raf(place);
        this.addEventListener(window, 'resize', place);
        // A scrolled shell keeps the X at the visible top of the frame
        // (scroll does not bubble, so listen in the capture phase: a game area that is the
        // scroller inside the shell moves the frame too, R2 m1)
        if (this.container?.addEventListener) this.addEventListener(this.container, 'scroll', place, { capture: true, passive: true });
        if (typeof window.ResizeObserver === 'function') {
            const frame = this.closeAnchor?.();
            if (frame) {
                this._closeObserver = new window.ResizeObserver(place);
                this._closeObserver.observe(frame);
            }
        }
    }

    start() {
        this.gameState.isActive = true;
        console.log("Minigame started");
        try { this._watchShellScrollbar(); } catch (e) { console.warn('watchShellScrollbar', e); }
        // A console window's X is laid out in its title bar, so it needs no placing
        if (this.constructor.closeInsideFrame === true && this.constructor.consoleWindow !== true && this.params.disableClose !== true) {
            try { this._watchCloseButton(); } catch (e) { console.warn('placeCloseButton', e); }
        }
        
        // Esc-to-close handler — skipped if disableClose is set
        if (this.params.disableClose !== true) {
            this._fallbackCloseHandler = (e) => {
                if (e.key === 'Escape') {
                    // A scene with a pop-up or confirm open handles Esc as Cancel itself
                    if (typeof this.handleEscapeKey === 'function' && this.handleEscapeKey(e)) return;
                    console.log('Escape key pressed, closing minigame');
                    this.closeByPlayer();
                }
            };
            document.addEventListener('keydown', this._fallbackCloseHandler);
        }
    }
    
    /**
     * The player's own Close, Cancel or Esc. Marks the close so a reader can tell it from
     * one forced by a hit, a knockout or a conversation (all complete(false) too): only
     * the player's own close goes back to the container it came from (lab UX review M1).
     */
    closeByPlayer() {
        this.closedByPlayer = true;
        this.complete(false);
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
    
    addEventListener(element, eventType, handler, options) {
        element.addEventListener(eventType, handler, options);
        this._eventListeners.push({ element, eventType, handler, options });
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

        // .tri-chip: the inbox triage flag chips (a label round a checkbox); the
        // class is only in that overlay. [role="option"]: the mail composer and
        // pretext-prep blank-picker rows; .mail-create-option: the mail Create-account
        // radio rows. Keep in step with test-bridge clickControl.
        const controls = Array.from(
            root.querySelectorAll('button, [role="button"], a[href], .clickable, input[type="button"], input[type="submit"], .tri-chip, [role="option"], .mail-create-option')
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

        const fullText = (root.innerText || '').trim().replace(/\n{3,}/g, '\n\n');
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
            // Cut at 2000 characters, and says so (textTruncated, textLength: the same
            // rule as utils/test-state-text.js, written out here so this file gains no
            // import). A notes overlay also carries the note's own text as noteContent.
            text: fullText.slice(0, 2000),
            ...(fullText.length > 2000 ? { textTruncated: true, textLength: fullText.length } : {}),
            controls,
            fields
        };
    }

    cleanup() {
        this._eventListeners.forEach(({ element, eventType, handler, options }) => {
            element.removeEventListener(eventType, handler, options);
        });
        this._eventListeners = [];
        
        this._shellObserver?.disconnect?.();
        this._shellObserver = null;
        this._closeObserver?.disconnect?.();
        this._closeObserver = null;

        // Clean up fallback close handler
        if (this._fallbackCloseHandler) {
            document.removeEventListener('keydown', this._fallbackCloseHandler);
            this._fallbackCloseHandler = null;
        }
    }
} 