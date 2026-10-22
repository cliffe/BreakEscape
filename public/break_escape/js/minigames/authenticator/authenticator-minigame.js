// Mock authenticator / push stream (SE design 11 N11, packet P7-M).
//
// The scene 'authenticator'. It is the E3 attack beat's demonstration: a phone-shaped overlay
// that plays a scripted stream of unrequested sign-in prompts on a timeline (the odd-hour push
// among them), then the target eventually taps "Approve" at a set time. The learner, playing the
// attacker, watches the fatigue attack land and can spam more pushes. Nothing here is scored; the
// defend beat handles MFA pushes as `push` triage items instead.
//
// Params (PHASE7_PACKETS §P7-M):
//   { pushes: [{ at, app, account, location, device }], approvesAt, mode: "attacker" }
// Result: { approvedAt, sent, mode }
//   approvedAt — the approvesAt value once the approval has played, else null;
//   sent       — the number of prompts delivered (scripted pushes plus any the learner sent).
//
// Overlay rules (00 §6): requiresKeyboardInput, its own Close, Esc through SocialOverlayScene.
// Close and Esc are a normal exit, so they never emit minigame_failed.
//
// Playback is driven by an injectable scheduler so tests advance the timeline by hand:
//   params.deps = { schedule(fn, ms) -> handle, clearScheduled(handle), stepMs }
// The default schedule is setTimeout. Tests pass a no-op scheduler and call advance() directly.

import { SocialOverlayScene } from '../framework/social-overlay.js';
import { buildTimeline } from './authenticator-model.js';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.length > 0;
const DEFAULT_STEP_MS = 1600;

const INTRO = 'You are watching the target’s phone. Each prompt you send arrives uninvited. Keep them coming and see what happens.';
const APPROVED_LINE = 'The target tapped Approve. The attacker is now signed in — this is MFA fatigue.';
const SEND_LABEL = 'Send another push';

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

const win = () => (typeof window !== 'undefined' ? window : {});

export class AuthenticatorMinigame extends SocialOverlayScene {
    constructor(container, params) {
        super(container, { title: 'Authenticator', ...(params || {}) });
        const deps = isObj(this.params.deps) ? this.params.deps : {};
        this.deps = {
            schedule: deps.schedule || ((fn, ms) => setTimeout(fn, ms)),
            clearScheduled: deps.clearScheduled || ((h) => clearTimeout(h)),
            stepMs: Number.isFinite(deps.stepMs) ? deps.stepMs : DEFAULT_STEP_MS
        };
        this.mode = isStr(this.params.mode) ? this.params.mode : 'attacker';
        this.timeline = buildTimeline(this.params);
        this.cursor = 0;        // next event to play
        this.sent = 0;          // prompts delivered so far
        this.approvedAt = null; // set when the approve event plays
        this.played = [];       // ids played, in order (test bridge)
        this._timer = null;
    }

    // ── lifecycle ──────────────────────────────────────────────────────────────

    init() {
        super.init();
        if (this.headerElement) this.headerElement.style.display = 'none';

        const root = el('div', 'auth-root');
        root.setAttribute('role', 'region');
        root.setAttribute('aria-label', 'Mock authenticator');
        this.root = root;

        const bar = el('div', 'auth-bar');
        bar.appendChild(el('span', 'auth-wordmark', 'AUTH'));
        this.mountCloseControl(bar, 'Close');
        root.appendChild(bar);

        this.intro = el('p', 'auth-intro', INTRO);
        root.appendChild(this.intro);

        const phone = el('div', 'auth-phone');
        const top = el('div', 'auth-phone-top');
        top.appendChild(el('span', 'auth-phone-speaker'));
        phone.appendChild(top);

        this.feed = el('div', 'auth-feed');
        this.feed.setAttribute('role', 'log');
        this.feed.setAttribute('aria-live', 'polite');
        this.feed.setAttribute('aria-label', 'Sign-in prompts');
        phone.appendChild(this.feed);
        root.appendChild(phone);

        this.banner = el('p', 'auth-banner');
        this.banner.setAttribute('aria-live', 'assertive');
        this.banner.hidden = true;
        root.appendChild(this.banner);

        const controls = el('div', 'auth-controls');
        this.sendButton = el('button', 'auth-send minigame-button', SEND_LABEL);
        this.sendButton.type = 'button';
        this.addEventListener(this.sendButton, 'click', (e) => {
            e.preventDefault?.();
            this._sendManual();
        });
        controls.appendChild(this.sendButton);
        root.appendChild(controls);

        this.gameContainer.appendChild(root);
        this._updateControls();
    }

    start() {
        super.start();
        try { this.sendButton?.focus?.(); } catch (e) { /* focus is a nicety */ }
        this._scheduleNext();
    }

    cleanup() {
        this._cancelTimer();
        super.cleanup();
    }

    // ── timeline playback ───────────────────────────────────────────────────────

    _cancelTimer() {
        if (this._timer !== null) {
            try { this.deps.clearScheduled(this._timer); } catch (e) { /* best effort */ }
            this._timer = null;
        }
    }

    _scheduleNext() {
        this._cancelTimer();
        if (this.cursor >= this.timeline.events.length) return;
        this._timer = this.deps.schedule(() => {
            this._timer = null;
            if (!this.gameState.isActive) return;
            this.advance();
            this._scheduleNext();
        }, this.deps.stepMs);
    }

    /**
     * Play the next scripted event (one push, or the approval) and return it, or null when the
     * timeline is spent. Public so tests can drive the timeline without real timers.
     */
    advance() {
        const event = this.timeline.events[this.cursor];
        if (!event) return null;
        this.cursor += 1;
        if (event.type === 'approve') this._playApprove(event);
        else this._playPush(event);
        this.played.push(event.id);
        this._updateControls();
        return event;
    }

    _playPush(event) {
        this.sent += 1;
        this._appendCard(event);
    }

    /** A push the learner fires by hand: it joins the stream but is not a scripted event. */
    _sendManual() {
        if (this.approvedAt !== null || !this.gameState.isActive) return;
        const last = this.timeline.events.filter((e) => e.type === 'push').slice(-1)[0] || {};
        this.sent += 1;
        this._appendCard({
            type: 'push', app: last.app || 'Authenticator', account: last.account || '',
            location: last.location || '', device: last.device || '', display: ''
        }, true);
    }

    _playApprove(event) {
        this.approvedAt = event.at ?? null;
        this.banner.textContent = APPROVED_LINE;
        this.banner.hidden = false;
        this.root?.classList.add('auth-approved');
    }

    _appendCard(event, manual = false) {
        const card = el('div', `auth-card${manual ? ' auth-card-manual' : ''}`);
        card.appendChild(el('p', 'auth-card-app', event.app || 'Authenticator'));
        card.appendChild(el('p', 'auth-card-request', 'Are you trying to sign in?'));
        const dl = el('dl', 'auth-card-details');
        const add = (k, v) => { if (isStr(v)) dl.append(el('dt', null, k), el('dd', null, v)); };
        add('Account', event.account);
        add('Time', event.display);
        add('Location', event.location);
        add('Device', event.device);
        card.appendChild(dl);
        // The Approve/Deny buttons are the target's view, shown disabled: the learner is the
        // attacker and never taps them; the target approves on the timeline.
        const actions = el('div', 'auth-card-actions');
        for (const label of ['Approve', 'Deny']) {
            const b = el('span', `auth-card-action auth-card-${label.toLowerCase()}`, label);
            b.setAttribute('aria-hidden', 'true');
            actions.appendChild(b);
        }
        card.appendChild(actions);
        this.feed.appendChild(card);
    }

    _updateControls() {
        if (this.sendButton) this.sendButton.disabled = this.approvedAt !== null;
    }

    // ── exit and test bridge ─────────────────────────────────────────────────────

    closeResult() {
        return { approvedAt: this.approvedAt, sent: this.sent, mode: this.mode };
    }

    getTestState() {
        return {
            ...super.getTestState(),
            authenticator: {
                mode: this.mode,
                sent: this.sent,
                approvedAt: this.approvedAt,
                played: [...this.played],
                finished: this.cursor >= this.timeline.events.length
            }
        };
    }
}

export default AuthenticatorMinigame;
