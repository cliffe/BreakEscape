// Live authenticator (ops layer S8a, unit 19).
//
// The scene 'authenticator-live'. The held phone's real sign-in prompts: each card comes from
// MfaClient.phone (never an authored timeline) with real Approve and Deny buttons, or, for number
// matching, three number buttons. A tap calls MfaClient.approve. Nothing here knows or computes a
// code or the right number; the server's answer decides every outcome.
//
// Params: { npcId, deps: { mfa, schedule, clearScheduled, pollMs } }
//   deps.mfa defaults to window.mfaClient. Opened as a child of the sign-in screen or from the
//   held phone. Server and author text reaches the DOM through textContent only.
// Result: { approved, denied, mode: 'live' }

import { AuthenticatorMinigame } from './authenticator-minigame.js';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.length > 0;
const DEFAULT_POLL_MS = 3000;

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

export class AuthenticatorLiveMinigame extends AuthenticatorMinigame {
    constructor(container, params) {
        // The scripted and decision parameters never apply to a live phone.
        const { choice, pushes, approvesAt, ...rest } = params || {};
        super(container, rest);
        const deps = isObj(this.params.deps) ? this.params.deps : {};
        this.mfa = deps.mfa || null;
        this.pollMs = Number.isFinite(deps.pollMs) ? deps.pollMs : DEFAULT_POLL_MS;
        this.npcId = this.params.npcId;
        this.requests = [];
        this.approvedCount = 0;
        this.deniedCount = 0;
        this._busy = false;
        this._note = '';
        this._poll = null;
        this.mode = 'live';
    }

    _client() {
        return this.mfa || (typeof window !== 'undefined' ? window.mfaClient : null);
    }

    init() {
        super.init();  // _buildPhoneShell, then _buildAttackerParts (which draws nothing here)
        this.statusEl = el('p', 'auth-live-status');
        this.statusEl.setAttribute('role', 'status');
        this.statusEl.setAttribute('aria-live', 'polite');
        this.root.insertBefore(this.statusEl, this.phoneEl);
    }

    /** Nothing of the attacker's view: no intro, decision panel, banner or Send control. */
    _buildAttackerParts() {}

    _updateControls() {}

    start() {
        super.start();
        this.refresh();
    }

    cleanup() {
        this._cancelPoll();
        super.cleanup();
    }

    _cancelPoll() {
        if (this._poll !== null) {
            try { this.deps.clearScheduled(this._poll); } catch (e) { /* best effort */ }
            this._poll = null;
        }
    }

    _schedulePoll() {
        this._cancelPoll();
        if (this.pollMs <= 0) return;
        this._poll = this.deps.schedule(() => {
            this._poll = null;
            if (!this.gameState.isActive) return;
            this.refresh();
        }, this.pollMs);
    }

    _say(text) {
        if (this.statusEl) this.statusEl.textContent = text || '';
    }

    /** Read the held phone and redraw its cards. Public so tests drive it without timers. */
    async refresh() {
        const note = this._note;
        this._note = '';
        const client = this._client();
        if (!client) { this._say('The phone cannot connect.'); return null; }
        let res;
        try { res = await client.phone({ npcId: this.npcId }); } catch (e) { res = { ok: false, reason: 'error' }; }
        if (!this.gameState.isActive) return res;
        if (!res || !res.ok) {
            this._say(res && res.reason === 'no_phone' ? 'You are not holding this phone.' : 'The phone cannot connect.');
        } else {
            this.requests = (res.requests || []).filter(isObj);
            if (this.requests.length) this._say(note);
            else this._say(note || (this.approvedCount > 0 ? 'Approved. Close the phone to go back to the PC.' : 'No sign-in requests right now.'));
            this._renderCards();
        }
        this._schedulePoll();
        return res;
    }

    _renderCards() {
        while (this.feed.firstChild) this.feed.removeChild(this.feed.firstChild);
        for (const req of this.requests) this.feed.appendChild(this._liveCard(req));
    }

    _liveCard(req) {
        const card = el('div', 'auth-card auth-card-live');
        card.appendChild(el('p', 'auth-card-app', isStr(req.app) ? req.app : 'Authenticator'));
        card.appendChild(el('p', 'auth-card-request', this._str('request', 'Are you trying to sign in?')));
        const dl = el('dl', 'auth-card-details');
        const add = (k, v) => { if (isStr(v)) dl.append(el('dt', null, k), el('dd', null, v)); };
        add('Account', req.account || req.username);
        add('Computer', req.host || req.pc);
        card.appendChild(dl);

        const actions = el('div', 'auth-card-actions');
        // The server's row names the PC (`pcId`), the subject being `pc:<pcId>`; a row with numbers is
        // a number-matching request (the server sends numbers only for that kind)
        const key = isStr(req.pcId) ? `pc:${req.pcId}` : req.key;
        if (Array.isArray(req.numbers) && req.numbers.length) {
            actions.appendChild(el('p', 'auth-card-prompt', 'Choose the number shown on the sign-in screen.'));
            for (const n of req.numbers) {
                const b = el('button', 'auth-card-action auth-card-number minigame-button', String(n));
                b.type = 'button';
                this.addEventListener(b, 'click', (e) => { e.preventDefault?.(); this.tapNumber(key, n); });
                actions.appendChild(b);
            }
        } else {
            const ok = el('button', 'auth-card-action auth-card-approve minigame-button', 'Approve');
            ok.type = 'button';
            this.addEventListener(ok, 'click', (e) => { e.preventDefault?.(); this.tapApprove(key); });
            actions.appendChild(ok);
        }
        const no = el('button', 'auth-card-action auth-card-deny minigame-button', 'Deny');
        no.type = 'button';
        this.addEventListener(no, 'click', (e) => { e.preventDefault?.(); this.tapDeny(key); });
        actions.appendChild(no);
        card.appendChild(actions);
        return card;
    }

    tapApprove(key) { return this._tap(key, {}, 'approve'); }
    tapNumber(key, number) { return this._tap(key, { number }, 'approve'); }
    tapDeny(key) { return this._tap(key, { deny: true }, 'deny'); }

    async _tap(key, opts, kind) {
        const client = this._client();
        if (!client || this._busy || !isStr(key)) return null;
        this._busy = true;
        let res;
        try { res = await client.approve(key, opts); } catch (e) { res = { ok: false, reason: 'error' }; }
        this._busy = false;
        if (!this.gameState.isActive) return res;
        let note;
        if (res && res.ok) {
            if (kind === 'deny') this.deniedCount += 1; else this.approvedCount += 1;
            note = kind === 'deny' ? 'Refused.' : 'Approved. Close the phone to go back to the PC.';
        } else if (res && res.reason === 'cancelled') {
            // The server ends the attempt on a deny and on a wrong number alike (422 cancelled)
            this.deniedCount += 1;
            note = kind === 'deny' ? 'Refused. The request was cancelled.' : 'That number did not match. The request was cancelled.';
        } else if (res && (res.reason === 'locked_out' || res.reason === 'gone')) {
            // The step is over or the account is locked: close the phone and let the sign-in screen say so
            this.complete(false);
            return res;
        } else {
            note = 'That request is no longer open.';
        }
        this._say(note);
        this._note = note;
        await this.refresh();
        return res;
    }

    closeResult() {
        return { approved: this.approvedCount, denied: this.deniedCount, mode: 'live' };
    }

    getTestState() {
        const base = super.getTestState();
        return { ...base, authenticator: { ...base.authenticator, live: { cards: this.requests.length, approved: this.approvedCount, denied: this.deniedCount } } };
    }
}

export default AuthenticatorLiveMinigame;
