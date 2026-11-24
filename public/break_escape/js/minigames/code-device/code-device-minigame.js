// Code device scene (ops layer S8a, unit 12).
//
// The small device an account owner carries, showing the current six-digit sign-in code. It
// reads through the multi-factor client (`MfaClient.readDevice`) when it opens and again when the
// bar empties; the client notes a code that is shown and not used. A `used` code is greyed
// ("Wait for the next code") and is never noted. `enrolled: false` shows "No longer in use" and
// no digits. A refusal (the item is not held) shows "This device shows nothing."
//
// Opened from the inventory item (alone), and by the sign-in screen as a child. It is a
// SocialOverlayScene with the default closeMode: as a child, Close returns to the parent screen;
// alone, it closes.
//
// Params: { itemId, deps? } where deps may inject { mfa, now, schedule, clearScheduled, tickMs }.
// `mfa` defaults to window.mfaClient (the way this folder reaches window.pcSessions), `now` to
// Date.now. Every server or author string reaches the DOM through textContent.

import { SocialOverlayScene } from '../framework/social-overlay.js';
import { applyHeadshotBox, npcRecordFor, headshotSourceFor } from '../../utils/npc-headshot.js';

const DEFAULT_WINDOW_S = 60;
const DEFAULT_TICK_MS = 250;
const NO_DEVICE_TEXT = 'This device shows nothing.';
const RETIRED_TEXT = 'No longer in use';
const USED_TEXT = 'Wait for the next code';

const win = () => (typeof window !== 'undefined' ? window : {});
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
}

export class CodeDeviceMinigame extends SocialOverlayScene {
    static framed = true;

    constructor(container, params) {
        super(container, { title: 'Code device', ...(params || {}) });
        const deps = isObj(this.params.deps) ? this.params.deps : {};
        this.deps = {
            mfa: deps.mfa || null,
            now: typeof deps.now === 'function' ? deps.now : () => Date.now(),
            schedule: deps.schedule || ((fn, ms) => setTimeout(fn, ms)),
            clearScheduled: deps.clearScheduled || ((h) => clearTimeout(h)),
            tickMs: Number.isFinite(deps.tickMs) ? deps.tickMs : DEFAULT_TICK_MS
        };
        this.itemId = this.params.itemId ?? null;
        this.state = 'loading'; // loading | code | used | retired | nothing
        this.code = '';
        this.displayName = '';
        this.reads = 0;
        this.endsAt = 0;        // clock ms at which the shown code's window ends
        this.windowMs = DEFAULT_WINDOW_S * 1000;
        this._timer = null;
        this._reading = false;
        this._closed = false;
    }

    _client() { return this.deps.mfa || win().mfaClient || null; }

    init() {
        super.init();
        if (this.headerElement) this.headerElement.style.display = 'none';

        const frame = el('div', 'device-frame code-device');
        frame.setAttribute('role', 'region');
        frame.setAttribute('aria-label', 'Code device');
        this.frame = frame;

        const title = el('div', 'device-frame-title code-device-title');
        title.appendChild(el('h2', 'code-device-title-text', 'Code device'));
        frame.appendChild(title);

        const owner = el('div', 'code-device-owner');
        this.headshotEl = el('div', 'code-device-headshot');
        this.headshotEl.hidden = true;
        this.headshotEl.setAttribute('aria-hidden', 'true');
        owner.appendChild(this.headshotEl);
        this.nameEl = el('div', 'code-device-name', '');
        owner.appendChild(this.nameEl);
        frame.appendChild(owner);

        this.digitsEl = el('div', 'code-device-digits', '');
        this.digitsEl.setAttribute('aria-live', 'polite');
        frame.appendChild(this.digitsEl);

        this.noteEl = el('p', 'code-device-note', '');
        this.noteEl.hidden = true;
        frame.appendChild(this.noteEl);

        this.barEl = el('div', 'code-device-bar');
        this.barEl.setAttribute('role', 'progressbar');
        this.barEl.setAttribute('aria-label', 'Time left on this code');
        this.barEl.setAttribute('aria-valuemin', '0');
        this.barFillEl = el('div', 'code-device-bar-fill');
        this.barEl.appendChild(this.barFillEl);
        frame.appendChild(this.barEl);

        // The device's own steel X, in the frame.
        this.mountThemedCloseControl(frame, 'Close');
        this.gameContainer.appendChild(frame);
        this._render();
    }

    start() {
        super.start();
        this.read();
    }

    cleanup() {
        this._closed = true;
        this._cancelTimer();
        super.cleanup();
    }

    // The close X sits in the frame, so the shared framework close anchor is the frame.
    closeAnchor() { return this.frame || this.gameContainer; }

    // ── reading ────────────────────────────────────────────────────────────────

    /** Read the device now. Resolves when the answer is on screen. */
    async read() {
        if (this._reading || this._closed) return;
        const client = this._client();
        if (!client || typeof client.readDevice !== 'function') {
            this._show('nothing');
            return;
        }
        this._reading = true;
        let res = null;
        try {
            res = await client.readDevice({ itemId: this.itemId });
        } catch (e) {
            res = { ok: false, reason: 'error' };
        }
        this._reading = false;
        if (this._closed) return;
        this.reads += 1;
        this._apply(res);
    }

    _apply(res) {
        this._cancelTimer();
        if (!res || !res.ok) {
            this.code = '';
            this._show('nothing');
            return;
        }
        this.displayName = typeof res.displayName === 'string' ? res.displayName : '';
        this._loadHeadshot(res);
        if (res.enrolled === false) {
            this.code = '';
            this._show('retired');
            return;
        }
        const left = Number.isFinite(res.secondsLeft) ? Math.max(0, res.secondsLeft) : DEFAULT_WINDOW_S;
        this.endsAt = this.deps.now() + left * 1000;
        this.code = typeof res.code === 'string' ? res.code : '';
        this._show(res.used ? 'used' : (this.code ? 'code' : 'nothing'));
        this._schedule();
    }

    _loadHeadshot(res) {
        try {
            const record = npcRecordFor({ npcId: res.npcId || null });
            applyHeadshotBox(this.headshotEl, headshotSourceFor({}, record));
        } catch (e) {
            this.headshotEl.hidden = true;
        }
    }

    // ── the bar ────────────────────────────────────────────────────────────────

    _schedule() {
        this._cancelTimer();
        if (this._closed) return;
        this._timer = this.deps.schedule(() => { this._timer = null; this.tick(); }, this.deps.tickMs);
    }

    _cancelTimer() {
        if (this._timer != null) this.deps.clearScheduled(this._timer);
        this._timer = null;
    }

    /** Seconds left in the shown code's window, never below 0. */
    secondsLeft() {
        return Math.max(0, Math.ceil((this.endsAt - this.deps.now()) / 1000));
    }

    /** One step of the bar; reads again when it has emptied. */
    tick() {
        if (this._closed) return;
        this._drawBar();
        if (this.endsAt && this.deps.now() >= this.endsAt && this.state !== 'retired' && this.state !== 'nothing') {
            this.read();
            return;
        }
        this._schedule();
    }

    _drawBar() {
        const left = this.state === 'code' || this.state === 'used' ? this.secondsLeft() : 0;
        const pct = Math.max(0, Math.min(100, (left * 1000 / this.windowMs) * 100));
        this.barFillEl.style.width = `${pct}%`;
        this.barEl.setAttribute('aria-valuemax', String(DEFAULT_WINDOW_S));
        this.barEl.setAttribute('aria-valuenow', String(left));
    }

    // ── drawing ────────────────────────────────────────────────────────────────

    _show(state) {
        this.state = state;
        this._render();
    }

    _render() {
        if (!this.frame) return;
        this.frame.dataset.state = this.state;
        this.nameEl.textContent = this.state === 'nothing' ? '' : this.displayName;
        if (this.state === 'code' || this.state === 'used') {
            this.digitsEl.textContent = this.code;
        } else {
            this.digitsEl.textContent = '';
        }
        this.digitsEl.classList.toggle('code-device-used', this.state === 'used');
        let note = '';
        if (this.state === 'used') note = USED_TEXT;
        else if (this.state === 'retired') note = RETIRED_TEXT;
        else if (this.state === 'nothing') note = NO_DEVICE_TEXT;
        this.noteEl.textContent = note;
        this.noteEl.hidden = !note;
        if (this.state === 'nothing') this.headshotEl.hidden = true;
        this._drawBar();
    }

    closeResult() { return { shown: this.state === 'code' }; }

    getTestState() {
        return {
            ...super.getTestState(),
            codeDevice: {
                state: this.state,
                digits: this.digitsEl ? this.digitsEl.textContent : '',
                used: this.state === 'used',
                reads: this.reads,
                secondsLeft: this.endsAt ? this.secondsLeft() : null
            }
        };
    }
}
