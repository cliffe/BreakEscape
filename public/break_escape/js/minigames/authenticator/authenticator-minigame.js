// Mock authenticator / push stream (SE design 11 N11, packet P7-M; E3 decision E3-11).
//
// The scene 'authenticator'. It is the E3 attack beat's demonstration: a phone-shaped overlay
// that plays a scripted stream of unrequested sign-in prompts on a timeline (the odd-hour push
// among them), then the target eventually taps "Approve" at a set time. The learner, playing the
// attacker, watches the fatigue attack land and can spam more pushes. Nothing here is scored; the
// defend beat handles MFA pushes as `push` triage items instead.
//
// Two modes:
//   • scripted (no `choice`): the authored `pushes`/`approvesAt` play as a fixed timeline. This
//     is the original P7-M behaviour and is left byte-for-byte unchanged.
//   • decision (`choice` present): the learner first picks WHEN to fire the prompts and HOW MANY,
//     then the burst plays and the target approves. Every combination lands — there is no dead
//     end — but the outcome panel explains which conditions made this attempt work (a tired or
//     off-the-clock target, the pretext call that primed them, the urge to make the buzzing stop).
//     The defender's control (number matching, reporting an unexpected prompt, a rate limit) is
//     named in the outcome and again on the flip page's conceptPanel.
//
// Params (PHASE7_PACKETS §P7-M; E3 decision):
//   scripted: { pushes: [{ at, app, account, location, device }], approvesAt, mode: "attacker" }
//   decision: { mode, choice: { intro?, confirm?, timing: { legend, options:[{id,label,at,outcome}] },
//                                count: { legend, options:[{id,label,n,note}] } },
//               pushTemplate: { app, account, location, device }, defenderNote }
//   strings (either mode, all optional): { intro, approved, send, confirm, wordmark, request }
//               over the defaults below. In decision mode choice.intro and choice.confirm win over
//               strings.intro and strings.confirm.
// Result: { approvedAt, sent, mode } (decision mode also carries { timing, count }).
//   approvedAt — the approvesAt value once the approval has played, else null;
//   sent       — the number of prompt cards delivered (plus any the learner sent by hand).
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
// A burst of many prompts shows at most this many cards; the rest collapse into one summary line,
// so a "flood" reads as a flood without drawing dozens of nodes or dragging the stage past a minute.
const CHOICE_MAX_CARDS = 4;

const INTRO = 'You are watching the target’s phone. Each prompt you send arrives uninvited. Keep them coming and see what happens.';
const CHOICE_INTRO = 'You have the password, but the account still wants a tap on the target’s phone. You control the prompts. Decide when to fire them and how many.';
const APPROVED_LINE = 'The target tapped Approve. The attacker is now signed in — this is MFA fatigue.';
const CONFIRM_LABEL = 'Start sending prompts';
const SEND_LABEL = 'Send another push';
const WORDMARK = 'AUTH';
const REQUEST_LINE = 'Are you trying to sign in?';

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
        this.choice = isObj(this.params.choice) ? this.params.choice : null;
        this.pushTemplate = isObj(this.params.pushTemplate) ? this.params.pushTemplate : {};
        this.strings = isObj(this.params.strings) ? this.params.strings : {};
        this.defenderNote = isStr(this.params.defenderNote) ? this.params.defenderNote : '';
        this.timeline = buildTimeline(this.params);  // empty in decision mode until a choice is made
        this.cursor = 0;        // next event to play
        this.sent = 0;          // prompt cards delivered so far
        this.approvedAt = null; // set when the approve event plays
        this.played = [];       // ids played, in order (test bridge)
        this._timer = null;
        // decision mode state
        this.selection = { timing: null, count: null };
        this.decided = false;   // true once the learner confirms when/how-many
        this.chosenCount = 0;   // the authored prompt count behind the chosen bucket
        this.outcomeLines = []; // why-it-worked + defender control, shown after the approval
        this._removeChoiceLayer = null; // Esc/Close route to "back to choosing" until the outcome shows
    }

    /** An authored string from params.strings, else the default. */
    _str(key, fallback) {
        return isStr(this.strings[key]) ? this.strings[key] : fallback;
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
        bar.appendChild(el('span', 'auth-wordmark', this._str('wordmark', WORDMARK)));
        this.mountCloseControl(bar, 'Close');
        root.appendChild(bar);

        this.intro = el('p', 'auth-intro', this.choice
            ? (isStr(this.choice.intro) ? this.choice.intro : this._str('intro', CHOICE_INTRO))
            : this._str('intro', INTRO));
        root.appendChild(this.intro);

        // In decision mode the learner chooses before any prompt is drawn; the phone and the
        // Send control stay hidden until the choice is confirmed.
        if (this.choice) root.appendChild(this._buildChoicePanel());

        const phone = el('div', 'auth-phone');
        if (this.choice) phone.hidden = true;
        this.phoneEl = phone;
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
        if (this.choice) controls.hidden = true;
        this.controlsEl = controls;
        this.sendButton = el('button', 'auth-send minigame-button', this._str('send', SEND_LABEL));
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
        // Decision mode waits on the learner's choice before any prompt plays.
        if (this.choice && !this.decided) {
            // The beat must not be skipped by a habitual Esc or Close (m-1): both route to
            // "back to choosing" until the outcome is on screen. Registering a layer makes a
            // single Esc land here even with a radio focused (t-1), ahead of the overlay's
            // text-field blur. The layer is removed once the approval and outcome have shown.
            if (!this._removeChoiceLayer) this._removeChoiceLayer = this.pushLayer(() => this._backToChoosing(), 'mfa-decision');
            this._focusFirstRadio();  // start on the first option, not the disabled Confirm (t-2)
            return;
        }
        try { this.sendButton?.focus?.(); } catch (e) { /* focus is a nicety */ }
        this._scheduleNext();
    }

    _focusFirstRadio() {
        try {
            const first = this.choicePanel?.querySelector?.('.auth-choice-radio');
            (first || this.confirmButton)?.focus?.();
        } catch (e) { /* focus is a nicety */ }
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
        else if (event.type === 'summary') this._appendSummary(event.more);
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
        this.banner.textContent = this._str('approved', APPROVED_LINE);
        this.banner.hidden = false;
        this.root?.classList.add('auth-approved');
        this._renderOutcome();
        // The content can be taller than a short screen, so bring the approval and the outcome
        // (the takeaway of the stage) into view rather than leaving them below the fold (M-1).
        try { this.banner?.scrollIntoView?.({ block: 'start' }); } catch (e) { /* scroll is a nicety */ }
        // The outcome is now on screen, so Esc/Close become a normal exit to the flip.
        if (this._removeChoiceLayer) { this._removeChoiceLayer(); this._removeChoiceLayer = null; }
    }

    /** The collapsed tail of a large burst ("…and N more"). */
    _appendSummary(more) {
        const n = Number(more) || 0;
        if (n <= 0) return;
        const note = el('p', 'auth-feed-more', `…and ${n} more prompt${n === 1 ? '' : 's'} in the same burst.`);
        this.feed.appendChild(note);
    }

    /** Decision mode: why this attempt landed, and the defender's control. Shown after approval. */
    _renderOutcome() {
        if (!this.choice || !this.outcomeLines.length || this.outcomeEl) return;
        const panel = el('div', 'auth-outcome');
        panel.setAttribute('role', 'note');
        panel.setAttribute('aria-live', 'polite');
        for (const line of this.outcomeLines) panel.appendChild(el('p', 'auth-outcome-line', line));
        this.root?.appendChild(panel);
        this.outcomeEl = panel;
    }

    // ── decision mode: choosing when and how many ─────────────────────────────────

    _option(group, id) {
        const opts = Array.isArray(this.choice?.[group]?.options) ? this.choice[group].options : [];
        return opts.find((o) => isObj(o) && o.id === id) || null;
    }

    _buildChoicePanel() {
        const panel = el('div', 'auth-choice');
        panel.setAttribute('role', 'group');
        panel.setAttribute('aria-label', 'Choose when and how many');

        const group = (key, cfg) => {
            if (!isObj(cfg) || !Array.isArray(cfg.options)) return null;
            const fs = el('fieldset', 'auth-choice-group');
            fs.appendChild(el('legend', 'auth-choice-legend', isStr(cfg.legend) ? cfg.legend : ''));
            for (const o of cfg.options) {
                if (!isObj(o) || !isStr(o.id)) continue;
                const lab = el('label', 'auth-choice-opt');
                const input = el('input', 'auth-choice-radio');
                input.type = 'radio';
                input.name = `auth-${key}`;
                input.value = o.id;
                this.addEventListener(input, 'change', () => {
                    this.selection[key] = o.id;
                    this._updateConfirm();
                });
                lab.appendChild(input);
                lab.appendChild(el('span', 'auth-choice-opt-label', isStr(o.label) ? o.label : o.id));
                fs.appendChild(lab);
            }
            return fs;
        };

        const timing = group('timing', this.choice.timing);
        const count = group('count', this.choice.count);
        if (timing) panel.appendChild(timing);
        if (count) panel.appendChild(count);

        this.confirmButton = el('button', 'auth-confirm minigame-button',
            isStr(this.choice.confirm) ? this.choice.confirm : this._str('confirm', CONFIRM_LABEL));
        this.confirmButton.type = 'button';
        this.confirmButton.disabled = true;
        this.addEventListener(this.confirmButton, 'click', (e) => {
            e.preventDefault?.();
            this._confirmChoice();
        });
        panel.appendChild(this.confirmButton);

        this.choicePanel = panel;
        return panel;
    }

    _updateConfirm() {
        if (this.confirmButton) this.confirmButton.disabled = !(this.selection.timing && this.selection.count);
    }

    /** Lock in the choice: build the burst, reveal the phone and start playback. */
    _confirmChoice() {
        if (this.decided) return;
        const timing = this._option('timing', this.selection.timing);
        const count = this._option('count', this.selection.count);
        if (!timing || !count) return;

        const n = Number.isFinite(count.n) && count.n > 0 ? Math.floor(count.n) : 1;
        this.chosenCount = n;
        const shown = Math.min(n, CHOICE_MAX_CARDS);
        const at = timing.at;
        const card = (i) => ({
            type: 'push', id: `c_${i + 1}`, at, display: isStr(at) ? at : '',
            app: isStr(this.pushTemplate.app) ? this.pushTemplate.app : 'Authenticator',
            account: isStr(this.pushTemplate.account) ? this.pushTemplate.account : '',
            location: isStr(this.pushTemplate.location) ? this.pushTemplate.location : '',
            device: isStr(this.pushTemplate.device) ? this.pushTemplate.device : ''
        });
        const events = [];
        for (let i = 0; i < shown; i++) events.push(card(i));
        if (n > shown) events.push({ type: 'summary', id: 'summary', more: n - shown });
        events.push({ type: 'approve', id: 'approve', at, display: isStr(at) ? at : '' });
        events.forEach((e, i) => { e.order = i; });
        this.timeline = { events, pushCount: shown };
        this.cursor = 0;

        this.outcomeLines = [timing.outcome, count.note, this.defenderNote].filter(isStr);

        this.decided = true;
        if (this.choicePanel) this.choicePanel.hidden = true;
        if (this.phoneEl) this.phoneEl.hidden = false;
        if (this.controlsEl) this.controlsEl.hidden = false;
        try { this.sendButton?.focus?.(); } catch (e) { /* focus is a nicety */ }
        this._scheduleNext();
    }

    /**
     * Esc or Close before the outcome is shown (m-1). Cancels any playback and returns to the
     * choice panel, keeping the radio selection so a re-confirm is one click. The learner cannot
     * skip the beat by habit; once the approval has played the layer is gone and Esc/Close exit.
     */
    _backToChoosing() {
        if (!this.choice) return;
        this._cancelTimer();
        this.timeline = buildTimeline(this.params);
        this.cursor = 0;
        this.sent = 0;
        this.played = [];
        this.approvedAt = null;
        this.decided = false;
        this.chosenCount = 0;
        this.outcomeLines = [];
        if (this.feed) { while (this.feed.firstChild) this.feed.removeChild(this.feed.firstChild); }
        if (this.banner) { this.banner.hidden = true; this.banner.textContent = ''; }
        this.root?.classList.remove('auth-approved');
        if (this.outcomeEl) { this.outcomeEl.remove(); this.outcomeEl = null; }
        if (this.choicePanel) this.choicePanel.hidden = false;
        if (this.phoneEl) this.phoneEl.hidden = true;
        if (this.controlsEl) this.controlsEl.hidden = true;
        this._updateControls();
        this._updateConfirm();
        this._focusFirstRadio();
    }

    _appendCard(event, manual = false) {
        const card = el('div', `auth-card${manual ? ' auth-card-manual' : ''}`);
        card.appendChild(el('p', 'auth-card-app', event.app || 'Authenticator'));
        card.appendChild(el('p', 'auth-card-request', this._str('request', REQUEST_LINE)));
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

    requestClose() {
        // Before the outcome is on screen, Close and Esc mean "back to choosing", never a skip (m-1).
        if (this.choice && this.approvedAt === null) { this._backToChoosing(); return; }
        super.requestClose();
    }

    closeResult() {
        const result = { approvedAt: this.approvedAt, sent: this.sent, mode: this.mode };
        if (this.choice) {
            result.timing = this.selection.timing;
            result.count = this.selection.count;
        }
        return result;
    }

    getTestState() {
        const auth = {
            mode: this.mode,
            sent: this.sent,
            approvedAt: this.approvedAt,
            played: [...this.played],
            finished: this.cursor >= this.timeline.events.length
        };
        if (this.choice) {
            auth.decision = {
                decided: this.decided,
                timing: this.selection.timing,
                count: this.selection.count,
                chosenCount: this.chosenCount,
                outcomeShown: !!this.outcomeEl
            };
        }
        return { ...super.getTestState(), authenticator: auth };
    }
}

export default AuthenticatorMinigame;
