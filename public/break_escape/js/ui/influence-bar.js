// The influence bar (SE engine item S4; 00 §8 "How the bar reads it", README AA;
// implementation plan packet P1-K).
//
// A DOM component, built once and mounted wherever a social character's influence
// shows: the mail reading pane and the intel board's person card now, person-chat
// and phone-chat headers in Phase 4. It is not the world-space health bar.
//
//   const bar = createInfluenceBar({ characterId: 'pierce' });
//   parent.appendChild(bar.el);          // bar is null when there is nothing to show
//   bar.destroy();                       // unsubscribes; call it when the mount redraws
//
// Options
//   characterId  the id of an entry in scenario.social.characters (not a channel id)
//   scenario     defaults to window.gameScenario; only `.social` is read (a fixture may
//                be handed in as { social })
//   getGlobals   () => globalVariables; defaults to window.gameState.globalVariables
//   dispatcher   defaults to window.eventDispatcher (on/off); none means no live updates
//   mount        a label for tests and styling ('reading-pane', 'board', 'chat')
//
// The value is always read from gameState, never from an event's data.value: the
// watcher can clamp a write after the raw value has already been announced
// (P0-F), so an event can carry a number the game no longer holds. An event only
// says "look again". The one thing taken from an event is the optional change line
// ("-10 urgency"), and only when the event carries a delta or a reason.
//
// What shows follows resolveInfluenceDisplay (README AA):
//   bar: false     createInfluenceBar returns null and nothing is mounted
//   number: false  the printed value is dropped (the bar and marks stay)
// A character with no social.characters entry also returns null.
//
// Threshold marks are always paired with words: each sits on the track as a small
// icon and is listed below as "Name at N: reached / not reached".
//
// ART SLOT (ASSETS UI9): the bar is drawn in CSS on the --ui-* tokens for now
// (css/influence-bar.css). When the UI9 art is generated it replaces the track and
// fill backgrounds in that stylesheet (and may swap the .ib-mark icons for its own
// threshold icons through ICON_FOR below). Nothing in this file needs to change.

import { resolveInfluenceDisplay } from '../systems/social-influence.js';

const ICON_DIR = '/break_escape/assets/icons/';
// Existing icon art stands in until UI9 supplies one per threshold icon key.
const ICON_FOR = {
    wary: 'mark-question',
    refuses: 'mark-cross',
    reports: 'mark-exclamation',
    hostile: 'mark-exclamation',
    trusts: 'mark-tick'
};
const FALLBACK_ICON = 'mark-question';

// Readable words for the canonical judge factors (phish-rules FACTOR_ORDER), so the
// "Last change" line reads in plain English rather than a code id such as "senderTrust"
// (P1-T2 A2). An authored reason that is not a factor id (a phrase the ink already
// wrote, "missing attachment") passes through unchanged.
const REASON_WORDS = {
    senderTrust: 'sender trust',
    senderAuth: 'sender checks',
    addressedTo: 'the greeting',
    pretextRelevant: 'relevance',
    attachmentPlausible: 'the attachment',
    urgencyCalibrated: 'the tone',
    linkCredible: 'the link'
};

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const finite = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function titleCase(id) {
    const s = String(id || '').replace(/[_-]+/g, ' ').trim();
    return s ? s[0].toUpperCase() + s.slice(1) : '';
}

/** The config the bar needs, with the same defaults the influence service applies. */
export function readBarConfig(scenario, characterId) {
    const raw = scenario?.social?.characters?.[characterId];
    if (!isObject(raw)) return null;
    const influence = isObject(raw.influence) ? raw.influence : {};
    const global = typeof influence.global === 'string' && influence.global ? influence.global : `${characterId}_influence`;
    const declared = isObject(scenario.globalVariables) ? scenario.globalVariables : {};
    const min = finite(influence.min, -100);
    const max = finite(influence.max, 100);
    const thresholds = (Array.isArray(raw.thresholds) ? raw.thresholds : [])
        .filter((t) => isObject(t) && typeof t.id === 'string' && typeof t.at === 'number')
        .map((t) => ({
            id: t.id,
            at: t.at,
            when: t.when === 'above' || t.when === 'below' ? t.when : (t.at < 0 ? 'below' : 'above'),
            icon: typeof t.icon === 'string' ? t.icon : null
        }));
    return {
        id: characterId,
        displayName: raw.displayName || characterId,
        global,
        min,
        max: max > min ? max : min + 1,
        start: finite(influence.start, finite(declared[global], 0)),
        thresholds
    };
}

export class InfluenceBar {
    constructor(config, display, opts = {}) {
        this.config = config;
        this.display = display;
        this.mount = opts.mount || '';
        this.getGlobals = opts.getGlobals;
        this.dispatcher = opts.dispatcher || null;
        this.changeText = '';
        this._subs = [];
        this._build();
        this._subscribe();
        this._seedChangeFromLog();
        this.update();
    }

    /**
     * Show the most recent influence change on a freshly mounted bar (A2). The
     * "Last change" line is otherwise only set by a live event, so a bar mounted
     * after the change (the reading pane opened once a reply has landed, or the
     * board card) showed the number with no reason. The influence service keeps a
     * per-character log; read its last real change and compose the same line.
     */
    _seedChangeFromLog() {
        if (this.changeText) return;
        if (this._seedFromServiceLog()) return;
        this._seedFromSession();
    }

    /** The live influence service log, when this page has seen the change. */
    _seedFromServiceLog() {
        const svc = (typeof window !== 'undefined') ? window.socialInfluence : null;
        if (!svc || typeof svc.getLog !== 'function') return false;
        let log;
        try { log = svc.getLog(this.config.id); } catch (e) { return false; }
        if (!Array.isArray(log)) return false;
        for (let i = log.length - 1; i >= 0; i--) {
            const e = log[i];
            if (!isObject(e) || e.kind === 'silent' || typeof e.delta !== 'number' || e.delta === 0) continue;
            this.changeText = this._changeLine(e.delta, e.reason);
            return true;
        }
        return false;
    }

    /**
     * After a reload the service log is empty. The call session is persisted
     * at pretext_<callId>_state, and its rows carry the same deltas.
     */
    _seedFromSession() {
        const globals = this.getGlobals?.() || {};
        const id = this.config?.id;
        if (!id) return;
        let best = null;
        for (const [key, state] of Object.entries(globals)) {
            if (!key.startsWith('pretext_') || !key.endsWith('_state')) continue;
            if (!isObject(state) || state.character !== id || !Array.isArray(state.log)) continue;
            for (const row of state.log) {
                const entries = Array.isArray(row?.entries) ? row.entries : [];
                for (const e of entries) {
                    if (!isObject(e) || typeof e.delta !== 'number' || e.delta === 0) continue;
                    best = e;
                }
            }
        }
        if (!best) return;
        this.changeText = this._changeLine(best.delta, best.reason);
    }

    /** The "Last change: +N reason" line, shared by live events and the log seed. */
    _changeLine(delta, reason) {
        const sign = delta > 0 ? '+' : '';
        const word = typeof reason === 'string' && reason && reason !== 'ink'
            ? ` ${REASON_WORDS[reason] || reason}` : '';
        return `Last change: ${sign}${delta}${word}`;
    }

    /** Current value from gameState (else the start value), clamped to the track for drawing only. */
    value() {
        const globals = this.getGlobals?.() || {};
        const v = globals[this.config.global];
        return typeof v === 'number' && Number.isFinite(v) ? v : this.config.start;
    }

    _build() {
        const c = this.config;
        const root = el('div', 'influence-bar');
        root.dataset.character = c.id;
        if (this.mount) root.dataset.mount = this.mount;
        root.setAttribute('role', 'group');
        root.setAttribute('aria-label', `${c.displayName}: how far they believe you`);

        const head = el('div', 'ib-infl-head');
        head.appendChild(el('span', 'ib-infl-label', 'Influence'));
        this.numberEl = null;
        if (this.display.number) {
            this.numberEl = el('span', 'ib-infl-number');
            head.appendChild(this.numberEl);
        }
        root.appendChild(head);

        this.track = el('div', 'ib-infl-track');
        this.track.setAttribute('role', 'meter');
        this.track.setAttribute('aria-label', `${c.displayName}'s influence`);
        this.track.setAttribute('aria-valuemin', String(c.min));
        this.track.setAttribute('aria-valuemax', String(c.max));
        this.fill = el('div', 'ib-infl-fill');
        this.track.appendChild(this.fill);

        this.markEls = [];
        for (const t of c.thresholds) {
            const mark = el('span', 'ib-infl-mark');
            mark.dataset.threshold = t.id;
            mark.style.left = `${this._pct(t.at)}%`;
            const img = el('img', 'ib-infl-mark-icon');
            img.src = `${ICON_DIR}${(ICON_FOR[t.icon] || FALLBACK_ICON)}.png`;
            img.alt = '';
            img.setAttribute('aria-hidden', 'true');
            mark.appendChild(img);
            this.track.appendChild(mark);
            this.markEls.push(mark);
        }
        root.appendChild(this.track);

        this.legend = null;
        if (c.thresholds.length) {
            this.legend = el('ul', 'ib-infl-legend');
            this.legendItems = c.thresholds.map((t) => {
                const li = el('li', 'ib-infl-legend-item');
                li.dataset.threshold = t.id;
                li.appendChild(el('span', 'ib-infl-legend-name', `${titleCase(t.id)} at ${t.at}:`));
                li.appendChild(document.createTextNode(' '));
                const state = el('span', 'ib-infl-legend-state');
                li.appendChild(state);
                this.legend.appendChild(li);
                return state;
            });
            root.appendChild(this.legend);
        }

        this.changeEl = el('p', 'ib-infl-change');
        this.changeEl.setAttribute('role', 'status');
        this.changeEl.setAttribute('aria-live', 'polite');
        root.appendChild(this.changeEl);

        this.el = root;
    }

    _pct(v) {
        const { min, max } = this.config;
        return Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
    }

    _reached(t, v) {
        return t.when === 'below' ? v <= t.at : v >= t.at;
    }

    /** Re-read gameState and redraw. Safe to call at any time. */
    update() {
        const c = this.config;
        const v = this.value();
        this.fill.style.width = `${this._pct(v)}%`;
        this.track.setAttribute('aria-valuenow', String(v));
        this.track.setAttribute('aria-valuetext', `${v} on a scale of ${c.min} to ${c.max}`);
        if (this.numberEl) this.numberEl.textContent = String(v);
        c.thresholds.forEach((t, i) => {
            const reached = this._reached(t, v);
            this.markEls[i].classList.toggle('is-reached', reached);
            if (this.legendItems) {
                const li = this.legendItems[i];
                li.textContent = reached ? 'reached' : 'not reached';
                li.parentNode.classList.toggle('is-reached', reached);
            }
        });
        this.el.classList.toggle('is-below-start', v < c.start);
        this.el.classList.toggle('is-above-start', v > c.start);
        this.changeEl.textContent = this.changeText;
    }

    _onEvent(data) {
        // The event is a prompt to look again. Only its change line is taken from it.
        const own = isObject(data) && (data.character === undefined || data.character === this.config.id);
        if (own && isObject(data) && typeof data.delta === 'number' && data.delta !== 0 && !data.silent) {
            this.changeText = this._changeLine(data.delta, data.reason);
        }
        this.update();
    }

    _subscribe() {
        const d = this.dispatcher;
        if (!d || typeof d.on !== 'function') return;
        const onGlobal = () => this.update();
        const onChange = (data) => {
            if (isObject(data) && data.character !== undefined && data.character !== this.config.id) return;
            this._onEvent(data);
        };
        const pairs = [[`global_variable_changed:${this.config.global}`, onGlobal], ['npc_influence_changed', onChange]];
        for (const [name, fn] of pairs) {
            d.on(name, fn);
            this._subs.push([name, fn]);
        }
    }

    getState() {
        const v = this.value();
        return {
            character: this.config.id,
            mount: this.mount,
            global: this.config.global,
            value: v,
            min: this.config.min,
            max: this.config.max,
            percent: Math.round(this._pct(v)),
            numberShown: !!this.numberEl,
            numberText: this.numberEl ? this.numberEl.textContent : null,
            thresholds: this.config.thresholds.map((t) => ({ id: t.id, at: t.at, reached: this._reached(t, v) })),
            change: this.changeEl.textContent
        };
    }

    destroy() {
        for (const [name, fn] of this._subs) {
            try { this.dispatcher.off?.(name, fn); } catch (err) { /* dispatcher already gone */ }
        }
        this._subs = [];
        this.el?.remove?.();
    }
}

/**
 * Build a bar for a social character, or null when nothing should show (not a social
 * character, or its resolved display has bar: false).
 */
export function createInfluenceBar(opts = {}) {
    const win = typeof window !== 'undefined' ? window : {};
    const scenario = opts.scenario || win.gameScenario || null;
    const characterId = opts.characterId;
    if (!scenario || typeof characterId !== 'string') return null;
    const config = readBarConfig(scenario, characterId);
    if (!config) return null;
    const display = resolveInfluenceDisplay(scenario, characterId);
    if (!display.bar) return null;
    return new InfluenceBar(config, display, {
        mount: opts.mount,
        getGlobals: opts.getGlobals || (() => win.gameState?.globalVariables),
        dispatcher: opts.dispatcher || win.eventDispatcher || null
    });
}

export default createInfluenceBar;
