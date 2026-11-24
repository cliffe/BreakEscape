// Ops cracker scene (hash records, stage S7): the `ops-cracker` overlay. Launched from a hash row in
// the sign-ins list with startMinigame('ops-cracker', null, { hashId }).
//
// It shows the account, the token, a salt marker and the earned facts the server listed in
// `crackFacts` as pickable chips. The player picks one to four and presses Crack; the scene posts
// { hash_id, facts } to /crack and draws the answer. The server decides everything; this scene holds
// no password and no recipe, and every string reaches the page through textContent.
//
// Params: { hashId, keyring?, api?, intelFacts?, now? }  (the last four are for tests)

import { SocialOverlayScene } from '../framework/social-overlay.js';
import { refusalText } from '../network-view/ops-model.js';
import {
    initialState, viewOf, togglePick, buildRequest, acceptAnswer, adoptRow, shouldAutoPost, canCrack
} from './ops-cracker-model.js';

const TICK_MS = 500;
const STYLE_ID = 'ops-cracker-style';
const STYLE = `
.ops-cracker { padding: 12px; color: #e8f0e8; font-family: inherit; max-height: 100%; overflow: auto; }
.ops-cracker-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.ops-cracker-title { font-weight: bold; }
.ops-cracker-who { display: flex; gap: 10px; align-items: center; margin-bottom: 8px; }
.ops-cracker-icon { width: 32px; height: 32px; border: 2px solid currentColor; display: flex; align-items: center; justify-content: center; }
.ops-cracker-token { font-family: monospace; letter-spacing: 1px; word-break: break-all; }
.ops-cracker-salt { margin-left: 8px; border: 1px solid currentColor; padding: 0 4px; font-size: 0.85em; }
.ops-cracker-chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0; }
.ops-cracker-chip { border: 2px solid #6a8; background: transparent; color: inherit; padding: 4px 8px; cursor: pointer; }
.ops-cracker-chip[aria-pressed="true"] { background: #2a5a3a; }
.ops-cracker-chip:disabled { opacity: 0.5; cursor: default; }
.ops-cracker-progress { height: 8px; background: #234; margin: 6px 0; }
.ops-cracker-progress > span { display: block; height: 100%; background: #6c8; }
.ops-cracker-msg[data-tone="warn"] { color: #f0c070; }
.ops-cracker-msg[data-tone="good"] { color: #8fe08f; }
`;

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

export class OpsCrackerMinigame extends SocialOverlayScene {
    static framed = true;

    constructor(container, params) {
        super(container, { title: 'Cracker', ...(params || {}) });
        this.hashId = typeof this.params.hashId === 'string' ? this.params.hashId : '';
        this.state = initialState({ row: null, crackFacts: [], intelFacts: this._intelFacts() });
        this._timer = null;
        this._closed = false;
    }

    // ── sources ───────────────────────────────────────────────────────────────

    _now() { return typeof this.params.now === 'function' ? this.params.now() : Date.now(); }
    _keyring() { return this.params.keyring || (typeof window !== 'undefined' ? window.keyring : null) || null; }
    _api() {
        if (this.params.api) return this.params.api;
        const c = typeof window !== 'undefined' ? (window.ApiClient || window.APIClient) : null;
        return c ? (body) => c.post('/crack', body) : null;
    }
    _intelFacts() {
        if (this.params.intelFacts) return this.params.intelFacts;
        const sc = typeof window !== 'undefined' ? window.gameScenario : null;
        return (sc && sc.social && sc.social.intelFacts) || {};
    }

    _readKeyring() {
        const k = this._keyring();
        const a = k && typeof k.listAnswer === 'function' ? k.listAnswer() : null;
        if (!a) return;
        const row = (Array.isArray(a.entries) ? a.entries : []).find((e) => e && e.id === this.hashId && e.kind === 'hash');
        if (!row) return;
        this.state = adoptRow({ ...this.state, intelFacts: this._intelFacts() }, row, a.crackFacts, this._now());
    }

    // ── lifecycle ─────────────────────────────────────────────────────────────

    init() {
        super.init();
        if (this.headerElement) this.headerElement.style.display = 'none';
        if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
            const style = el('style');
            style.id = STYLE_ID;
            style.textContent = STYLE;
            document.head.appendChild(style);
        }
        const root = el('div', 'ops-cracker');
        root.setAttribute('role', 'region');
        root.setAttribute('aria-label', 'Cracker');
        this.root = root;
        this.gameContainer.appendChild(root);
        this._readKeyring();
        this._draw();
    }

    start() {
        super.start();
        this._timer = setInterval(() => this._tick(), TICK_MS);
        // the keyring may know more than it did when the row was drawn
        const k = this._keyring();
        if (k && typeof k.refresh === 'function') {
            Promise.resolve(k.refresh()).then(() => { if (!this._closed) { this._readKeyring(); this._draw(); } }).catch(() => {});
        }
    }

    cleanup() {
        this._closed = true;
        if (this._timer) { clearInterval(this._timer); this._timer = null; }
        super.cleanup();
    }

    // ── drawing ───────────────────────────────────────────────────────────────

    _draw() {
        const root = this.root;
        if (!root) return;
        const v = viewOf(this.state, this._now(), refusalText);
        root.textContent = '';

        const bar = el('div', 'ops-cracker-bar');
        bar.appendChild(el('span', 'ops-cracker-title', 'Cracker'));
        this.mountCloseControl(bar, 'Close');
        root.appendChild(bar);

        const who = el('div', 'ops-cracker-who');
        who.appendChild(el('span', 'ops-cracker-icon', (v.title || '?').charAt(0).toUpperCase()));
        const names = el('div');
        names.appendChild(el('div', 'ops-cracker-name', v.title));
        if (v.username) names.appendChild(el('div', 'ops-cracker-user', v.username));
        who.appendChild(names);
        root.appendChild(who);

        const tokenLine = el('div');
        tokenLine.appendChild(el('span', 'ops-cracker-token', v.token));
        if (v.salted) tokenLine.appendChild(el('span', 'ops-cracker-salt', 'Salted'));
        root.appendChild(tokenLine);

        const chips = el('div', 'ops-cracker-chips');
        chips.setAttribute('role', 'group');
        chips.setAttribute('aria-label', 'What you have learned');
        for (const c of v.chips) {
            const b = el('button', 'ops-cracker-chip', c.label);
            b.type = 'button';
            b.dataset.fact = c.id;
            b.setAttribute('aria-pressed', c.picked ? 'true' : 'false');
            b.disabled = c.disabled;
            b.addEventListener('click', () => { this.state = togglePick(this.state, c.id); this._draw(); });
            chips.appendChild(b);
        }
        root.appendChild(chips);

        if (v.progress !== null) {
            const p = el('div', 'ops-cracker-progress');
            p.setAttribute('role', 'progressbar');
            p.setAttribute('aria-valuemin', '0');
            p.setAttribute('aria-valuemax', '100');
            p.setAttribute('aria-valuenow', String(Math.round(v.progress * 100)));
            const fill = el('span');
            fill.style.width = `${Math.round(v.progress * 100)}%`;
            p.appendChild(fill);
            root.appendChild(p);
        }

        const msg = el('p', 'ops-cracker-msg', v.message);
        msg.dataset.tone = v.tone;
        msg.setAttribute('aria-live', 'polite');
        root.appendChild(msg);
        if (v.passwordNote) root.appendChild(el('p', 'ops-cracker-note', v.passwordNote));

        const go = el('button', 'ops-cracker-go', v.crackLabel);
        go.type = 'button';
        go.disabled = !v.crackEnabled;
        go.addEventListener('click', () => this._crack(false));
        this.crackButton = go;
        root.appendChild(go);
    }

    // ── running ───────────────────────────────────────────────────────────────

    _tick() {
        if (this._closed) return;
        const now = this._now();
        if (shouldAutoPost(this.state, now)) { this._crack(true); return; }
        if (this.state.deadline !== null) this._draw();
    }

    async _crack(auto) {
        if (!auto && !canCrack(this.state, this._now())) return;
        const api = this._api();
        const req = buildRequest(this.state, { auto });
        this.state = req.state;
        let answer;
        if (!api) answer = { success: false, reason: 'no_answer' };
        else {
            try { answer = await api(req.body); }
            catch (err) {
                answer = err && err.body && typeof err.body.reason === 'string'
                    ? { ...err.body, success: false } : { success: false, reason: 'no_answer' };
            }
        }
        if (this._closed) return;
        this.state = acceptAnswer(this.state, req.seq, answer, this._now());
        this._draw();
        const k = this._keyring();
        if (k && typeof k.refresh === 'function') {
            Promise.resolve(k.refresh()).then(() => { if (!this._closed) { this._readKeyringFacts(); this._draw(); } }).catch(() => {});
        }
    }

    // After a run the keyring's fact list may have changed; the newest answer still speaks for the status.
    _readKeyringFacts() {
        const k = this._keyring();
        const a = k && typeof k.listAnswer === 'function' ? k.listAnswer() : null;
        if (a && Array.isArray(a.crackFacts)) this.state = adoptRow(this.state, this.state.row, a.crackFacts, this._now());
    }

    getTestState() {
        return { ...super.getTestState(), cracker: { hashId: this.hashId, picks: [...this.state.picks], seq: this.state.seq } };
    }
}
