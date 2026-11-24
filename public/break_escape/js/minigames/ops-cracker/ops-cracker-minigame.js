// Ops cracker scene (hash records, stage S7): the `ops-cracker` overlay. Launched from a hash row in
// the sign-ins list with startMinigame('ops-cracker', null, { hashId }).
//
// It shows the account, the token, a salt marker and the earned facts the server listed in
// `crackFacts` as pickable chips. The player picks up to four (none is allowed) and presses Crack; the scene posts
// { hash_id, facts } to /crack and draws the answer. The server decides everything; this scene holds
// no password and no recipe, and every string reaches the page through textContent.
//
// Params: { hashId, keyring?, api?, intelFacts?, now? }  (the last four are for tests)

import { SocialOverlayScene } from '../framework/social-overlay.js';
import { refusalText } from '../network-view/ops-model.js';
import {
    initialState, viewOf, togglePick, buildRequest, acceptAnswer, adoptRow, shouldAutoPost, canCrack, isBusy, statusOf
} from './ops-cracker-model.js';

const TICK_MS = 500;
const CSS_ESCAPE = (v) => String(v).replace(/[^A-Za-z0-9_-]/g, (c) => `\\${c}`);
const STYLE_ID = 'ops-cracker-style';
const STYLE = `
.ops-cracker { padding: 12px; color: #e8f0e8; font-family: inherit; max-height: 100%; overflow: auto; }
.ops-cracker-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.ops-cracker-title { font-weight: bold; }
.ops-cracker-who { display: flex; gap: 10px; align-items: center; margin-bottom: 8px; }
.ops-cracker-icon { width: 32px; height: 32px; border: 2px solid currentColor; display: flex; align-items: center; justify-content: center; }
.ops-cracker-token { font-family: monospace; letter-spacing: 1px; word-break: break-all; }
.ops-cracker-salt { margin-left: 8px; border: 2px solid currentColor; padding: 0 4px; font-size: 0.85em; }
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
        let row = (Array.isArray(a.entries) ? a.entries : []).find((e) => e && e.id === this.hashId && e.kind === 'hash');
        if (!row) return;
        // the keyring's own countdown knows how much of a wait is left; the cached row still says the full wait (R1-C4)
        const left = typeof k.crackSecondsLeft === 'function' ? k.crackSecondsLeft(this.hashId) : null;
        if (row.status === 'running' && Number.isFinite(left)) row = { ...row, readyInSeconds: left };
        // the fact ids live on the keyring itself, not in the cached answer (R1-C1)
        const facts = Array.isArray(k.crackFacts) ? k.crackFacts : undefined;
        this.state = adoptRow({ ...this.state, intelFacts: this._intelFacts() }, row, facts, this._now());
    }

    /** The cracked password entries this scene may show: this account's, and the ones the answer named. */
    _crackedEntries() {
        if (statusOf(this.state) !== 'cracked') return [];
        const k = this._keyring();
        const a = k && typeof k.listAnswer === 'function' ? k.listAnswer() : null;
        const entries = a && Array.isArray(a.entries) ? a.entries : [];
        const ids = new Set(Array.isArray(this.state.answer?.credentialIds) ? this.state.answer.credentialIds : []);
        const npc = this.state.row?.account?.npcId;
        if (typeof npc === 'string') ids.add(`${npc}.cracked`);
        return entries.filter((e) => e && e.kind === 'password' && e.source === 'cracked' && ids.has(e.id)
            && typeof e.password === 'string' && e.password);
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
        this._build();
        this._readKeyring();
        this._render();
    }

    start() {
        super.start();
        this._timer = setInterval(() => this._tick(), TICK_MS);
        // the keyring may know more than it did when the row was drawn
        this._refreshKeyring();
        // a fact earned while the scene is open (a feed post, a flag reward) adds its chip
        const d = typeof window !== 'undefined' ? window.eventDispatcher : null;
        if (d && typeof d.on === 'function') {
            this._intelListener = () => { if (!this._closed) this._refreshKeyring(); };
            this._intelDispatcher = d;
            d.on('intel_collected', this._intelListener);
            // a feed post served meanwhile earns its fact on the server; the client says only npc_posted
            d.on('npc_posted:*', this._intelListener);
        }
    }

    _refreshKeyring() {
        const k = this._keyring();
        if (k && typeof k.refresh === 'function') {
            Promise.resolve(k.refresh()).then(() => { if (!this._closed) { this._readKeyring(); this._render(); } }).catch(() => {});
        }
    }

    cleanup() {
        this._closed = true;
        if (this._intelDispatcher && this._intelListener) {
            this._intelDispatcher.off?.('intel_collected', this._intelListener);
            this._intelDispatcher.off?.('npc_posted:*', this._intelListener);
        }
        this._intelListener = null; this._intelDispatcher = null;
        if (this._timer) { clearInterval(this._timer); this._timer = null; }
        super.cleanup();
    }

    // ── drawing: the nodes are built once; a redraw changes text, widths and states in place ───

    _build() {
        const root = el('div', 'ops-cracker');
        root.setAttribute('role', 'region');
        root.setAttribute('aria-label', 'Cracker');
        this.root = root;
        this.ui = {};

        const bar = el('div', 'ops-cracker-bar');
        bar.appendChild(el('span', 'ops-cracker-title', 'Cracker'));
        this.mountCloseControl(bar, 'Close');
        root.appendChild(bar);

        const who = el('div', 'ops-cracker-who');
        this.ui.icon = el('span', 'ops-cracker-icon');
        who.appendChild(this.ui.icon);
        const names = el('div');
        this.ui.name = el('div', 'ops-cracker-name');
        this.ui.user = el('div', 'ops-cracker-user');
        names.appendChild(this.ui.name);
        names.appendChild(this.ui.user);
        who.appendChild(names);
        root.appendChild(who);

        const tokenLine = el('div');
        this.ui.token = el('span', 'ops-cracker-token');
        this.ui.salt = el('span', 'ops-cracker-salt', 'Salted');
        tokenLine.appendChild(this.ui.token);
        tokenLine.appendChild(this.ui.salt);
        root.appendChild(tokenLine);

        this.ui.chips = el('div', 'ops-cracker-chips');
        this.ui.chips.setAttribute('role', 'group');
        this.ui.chips.setAttribute('aria-label', 'What you have learned');
        root.appendChild(this.ui.chips);
        this._chipKey = null;

        this.ui.progress = el('div', 'ops-cracker-progress');
        this.ui.progress.setAttribute('role', 'progressbar');
        this.ui.progress.setAttribute('aria-valuemin', '0');
        this.ui.progress.setAttribute('aria-valuemax', '100');
        this.ui.fill = el('span');
        this.ui.progress.appendChild(this.ui.fill);
        root.appendChild(this.ui.progress);

        this.ui.msg = el('p', 'ops-cracker-msg');
        this.ui.msg.setAttribute('aria-live', 'polite');
        root.appendChild(this.ui.msg);
        this.ui.won = el('div', 'ops-cracker-won');
        root.appendChild(this.ui.won);
        this._wonKey = null;

        const go = el('button', 'ops-cracker-go', 'Crack');
        go.type = 'button';
        go.addEventListener('click', () => this._crack(false));
        this.crackButton = go;
        this.ui.go = go;
        root.appendChild(go);
        this.gameContainer.appendChild(root);
    }

    _render() {
        if (!this.root || !this.ui) return;
        const v = viewOf(this.state, this._now(), refusalText);
        const ui = this.ui;
        const setText = (node, text) => { if (node.textContent !== text) node.textContent = text; };
        setText(ui.icon, (v.title || '?').charAt(0).toUpperCase());
        setText(ui.name, v.title);
        setText(ui.user, v.username);
        ui.user.hidden = !v.username;
        setText(ui.token, v.token);
        ui.salt.hidden = !v.salted;

        // the chips: rebuilt only when the set of ids or words changes; otherwise updated in place
        const chipKey = JSON.stringify(v.chips.map((c) => [c.id, c.label]));
        if (chipKey !== this._chipKey) {
            this._chipKey = chipKey;
            ui.chips.textContent = '';
            for (const c of v.chips) {
                const b = el('button', 'ops-cracker-chip', c.label);
                b.type = 'button';
                b.dataset.fact = c.id;
                b.addEventListener('click', () => { this.state = togglePick(this.state, c.id); this._render(); });
                ui.chips.appendChild(b);
            }
        }
        for (const c of v.chips) {
            const b = ui.chips.querySelector(`[data-fact="${CSS_ESCAPE(c.id)}"]`);
            if (!b) continue;
            b.setAttribute('aria-pressed', c.picked ? 'true' : 'false');
            if (b.disabled !== c.disabled) b.disabled = c.disabled;
        }

        ui.progress.hidden = v.progress === null;
        if (v.progress !== null) {
            const pct = Math.round(v.progress * 100);
            ui.progress.setAttribute('aria-valuenow', String(pct));
            ui.fill.style.width = `${pct}%`;
        }

        setText(ui.msg, v.message);
        ui.msg.dataset.tone = v.tone;

        // a cracked password is shown from the keyring's own entry, never from the answer (R1-C7)
        const won = this._crackedEntries();
        const wonKey = JSON.stringify(won.map((e) => [e.id, e.password]));
        if (wonKey !== this._wonKey) {
            this._wonKey = wonKey;
            ui.won.textContent = '';
            for (const e of won) {
                const line = el('p', 'ops-cracker-note');
                const who = e.account?.displayName || e.account?.username || e.id;
                const user = e.account?.username ? ` (${e.account.username})` : '';
                line.textContent = `${who}${user}: ${e.password}`;
                ui.won.appendChild(line);
            }
            if (!won.length && v.passwordNote) ui.won.appendChild(el('p', 'ops-cracker-note', v.passwordNote));
        }

        setText(ui.go, v.crackLabel);
        if (ui.go.disabled === v.crackEnabled) ui.go.disabled = !v.crackEnabled;
    }

    // ── running ───────────────────────────────────────────────────────────────

    _tick() {
        if (this._closed) return;
        const now = this._now();
        if (shouldAutoPost(this.state, now)) { this._crack(true); return; }
        if (this.state.deadline !== null) this._render();
    }

    async _crack(auto) {
        if (!auto && !canCrack(this.state, this._now())) return;
        if (isBusy(this.state)) return;
        const api = this._api();
        const req = buildRequest(this.state, { auto });
        this.state = req.state;
        this._render();
        let answer;
        if (!api) answer = { success: false, reason: 'no_answer' };
        else {
            try { answer = await api(req.body); }
            catch (err) {
                answer = err && err.body && typeof err.body.reason === 'string'
                    ? { ...err.body, success: false } : { success: false, reason: 'no_answer' };
            }
        }
        // the server ran the post even if the scene has closed: ask for the new keyring either way (R1-C11)
        const k = this._keyring();
        const refreshed = k && typeof k.refresh === 'function' ? Promise.resolve(k.refresh()).catch(() => {}) : null;
        if (this._closed) return;
        this.state = acceptAnswer(this.state, req.seq, answer, this._now());
        this._render();
        if (refreshed) refreshed.then(() => { if (!this._closed) { this._readKeyringFacts(); this._render(); } });
    }

    // After a run the keyring's fact list may have changed; the newest answer still speaks for the status.
    _readKeyringFacts() {
        const k = this._keyring();
        if (k && Array.isArray(k.crackFacts)) this.state = adoptRow(this.state, this.state.row, k.crackFacts, this._now());
    }

    getTestState() {
        return { ...super.getTestState(), cracker: { hashId: this.hashId, picks: [...this.state.picks], seq: this.state.seq } };
    }
}
