import { MinigameScene } from './base-minigame.js';
import { openModalCount } from '../../ui/modal-stack.js';

// Shared base for the social-engineering overlays (mail client, OSINT browser,
// intel board, triage, pretext prep, landing-page builder). It holds the parts
// every one of them needs and that are easy to get subtly wrong
// (SE contract 00 §6 "Overlay rules", S12; README Conventions):
//
//   - its own visible Close control (the framework's × and the base-class Esc
//     are turned off with disableClose);
//   - one capture-phase Esc handler that closes the topmost layer first (an
//     open picker or panel), then blurs a focused text field, then closes the
//     overlay; it stands aside while a gameDisplay/gameConfirm dialog is open
//     (ui/modal-stack.js closes that one);
//   - the two ways out: close() is a normal exit (complete(true) with
//     closeResult()), abort() sets { aborted: true } and calls complete(false);
//   - launchChild(): save the draft, mark this overlay suspended and start the
//     child with returnTo pointing back here (minigame-manager.js);
//   - a getTestState() base that adds the overlay's layers and close mode.
//
// A subclass overrides closeResult() (and closeMode, if Close with nothing done
// should abort, like the mail client with nothing sent), saveDraft() and
// returnParams(). Starters build their params with socialOverlayParams() so
// requiresKeyboardInput and disableClose are set before startMinigame reads them.

/** Params every social overlay starts with; the caller's values win. */
export function socialOverlayParams(params = {}) {
    return { requiresKeyboardInput: true, disableClose: true, ...params };
}

const TEXT_FIELD = 'input, textarea, select, [contenteditable="true"]';

export class SocialOverlayScene extends MinigameScene {
    constructor(container, params) {
        super(container, socialOverlayParams(params || {}));
        this._layers = [];
        this._escHandler = null;
    }

    start() {
        super.start(); // no base Esc: disableClose is set
        this._escHandler = (e) => this._onEscape(e);
        document.addEventListener('keydown', this._escHandler, true);
    }

    /**
     * Add the overlay's own Close control to `parent` (default: the container).
     * Returns the button.
     */
    mountCloseControl(parent = this.container, label = 'Close') {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'se-overlay-close minigame-button';
        btn.textContent = label;
        btn.setAttribute('aria-label', label);
        this.addEventListener(btn, 'click', (e) => {
            e.preventDefault?.();
            e.stopPropagation?.();
            this.requestClose();
        });
        parent.appendChild(btn);
        this.closeButton = btn;
        return btn;
    }

    /**
     * Register an open sub-layer (picker, panel, sheet). Esc calls `close` for
     * the topmost one before anything else. Returns a function that removes it;
     * call it whenever the layer goes away by any route.
     */
    pushLayer(close, name = null) {
        const entry = { close, name };
        this._layers.push(entry);
        return () => {
            const i = this._layers.indexOf(entry);
            if (i !== -1) this._layers.splice(i, 1);
        };
    }

    _onEscape(e) {
        if (e.key !== 'Escape' || !this.gameState.isActive) return;
        if (openModalCount() > 0) return; // the dialog on top owns this Esc
        e.preventDefault?.();
        e.stopPropagation?.();
        e.stopImmediatePropagation?.();
        if (e.repeat) return; // held Esc closes one layer, not the whole stack
        const top = this._layers[this._layers.length - 1];
        if (top) { top.close(); return; }
        const active = document.activeElement;
        if (active && active !== document.body && this.container?.contains?.(active) &&
            active.matches?.(TEXT_FIELD)) {
            active.blur();
            return;
        }
        this.requestClose();
    }

    /**
     * 'close' (default): Close and Esc are a normal exit. 'abort': they end the
     * run as { aborted: true }. A subclass may make this a getter.
     */
    get closeMode() { return 'close'; }

    /** The result a normal exit reports. Override. */
    closeResult() { return this.gameResult ?? {}; }

    requestClose() {
        if (this.closeMode === 'abort') this.abort();
        else this.close();
    }

    /** Normal exit: complete(true) with closeResult(); a returnTo reopens the parent. */
    close() {
        if (!this.gameState.isActive) return;
        this.gameResult = this.closeResult();
        this.complete(true);
    }

    /** Leave without a result: { aborted: true } and complete(false). Records nothing. */
    abort() {
        if (!this.gameState.isActive) return;
        this.gameResult = { aborted: true };
        this.complete(false);
    }

    /** Write the draft somewhere that outlives this overlay. Override. */
    saveDraft() {}

    /** Params merged over this overlay's own when it is reopened. Override. */
    returnParams() { return {}; }

    /**
     * Open another minigame on top and come back here when it closes normally.
     * Saves the draft first. Returns the child, or null if it did not start
     * (this overlay then stays open and is no longer marked suspended).
     */
    launchChild(sceneType, childParams = {}) {
        const fw = window.MinigameFramework;
        if (!fw || !this._sceneType) return null;
        this.saveDraft();
        this.params.suspended = true;
        const child = fw.startMinigame(sceneType, null, {
            ...childParams,
            returnTo: { sceneType: this._sceneType, params: this.returnParams() }
        });
        if (!child) this.params.suspended = false;
        return child;
    }

    getTestState() {
        return {
            ...super.getTestState(),
            overlay: {
                sceneType: this._sceneType || null,
                layers: this._layers.map((l) => l.name),
                closeMode: this.closeMode,
                suspended: this.params?.suspended === true,
                returnsTo: this.params?.returnTo?.sceneType || null
            }
        };
    }

    cleanup() {
        if (this._escHandler) {
            document.removeEventListener('keydown', this._escHandler, true);
            this._escHandler = null;
        }
        this._layers = [];
        super.cleanup();
    }
}
