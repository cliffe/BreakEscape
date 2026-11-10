/**
 * PC SESSIONS (access model, docs/achitechture/ACCESS_MODEL_PLAN.md 5.3, step 8)
 * ==============================================================================
 *
 * The only place the client signs in to or out of a sign-in PC (`lockType: "login"`),
 * and the only source of the sign-in events. It keeps:
 *
 *   sessions   pcId -> { npcId, username, displayName, via, restored }, filled from the
 *              server's answers (POST /login, and the scenario response on load);
 *   signedIn   every sign-in PC the player has ever signed in to (the server's
 *              signedInPcs, used by unlock_object tasks);
 *   desktops   pcId -> close(message) for a desktop that is open now, so a session that
 *              ends closes it with a one-line message.
 *
 * Events (each also as `<name>:<pcId>`):
 *   pc_signed_in       { pcId, npcId, username, via, previousNpcId, firstAtPc }
 *                      a sign-in (or the second half of a switch). previousNpcId is the account
 *                      signed in at this PC just before (a switch), else null; firstAtPc is true
 *                      when the player had never signed in at this PC before (signedIn).
 *   pc_signed_out      { pcId, npcId, reason }         reason: sign_out (the Sign out button) |
 *                      switch (the first half of a switch) | no_session (a 403 from container) |
 *                      claim_ended (a claimed session ended on load) | owner_returned or
 *                      auto_locked (a claimed session ended by the owner's return or the
 *                      screen's auto lock; these two also carry firstAtPc, true when the ended
 *                      session was the first sign-in at this PC)
 *   pc_signin_failed   { pcId, reason, attemptsLeft }  reason: wrong | not_permitted | locked_out
 *   pc_signin_shown    { pcId, usernames, usernameList, reason? } the sign-in screen opened with
 *                      these tiles; reason (when the caller knows it) is why: signin (no owner,
 *                      or an owner not present with no away record), locked (the owner is
 *                      away and the screen locked), attended, claim_refused, switch or direct
 *   pc_desktop_opened  { pcId, npcId, via, restored }  a desktop loaded for a session; restored is
 *                                                      true for a session kept from before a reload
 *   pc_in_use          { pcId, ownerId, signedInBefore } a click found the owner at the desk;
 *                      signedInBefore is true when the player had signed in at this PC before
 *
 * The server holds the real sessions; this list only mirrors them, so a 403 from
 * `container` (no session there, for example after a reset) drops the local copy
 * without a request.
 *
 * Unlocked sessions (5.4): claim(pcId) is POST /login with claim "owner" and the two
 * workstation globals. A claimed session ends when the owner returns
 * (workstation_owner_returned:<pcId>), when the screen auto locks
 * (workstation_auto_locked:<pcId>), or on a reload (load); each sends POST /logout, emits
 * pc_signed_out and closes an open desktop with "<owner> is back at the desk" or "The screen
 * locked". A password session is ended by none of these.
 *
 * Exposed as window.pcSessions; window.__test.access.sessions() reads list().
 */

export const SIGNED_OUT_MESSAGE = 'Signed out';
export const SCREEN_LOCKED_MESSAGE = 'The screen locked';
export const backAtDeskMessage = (name) => `${name || 'The owner'} is back at the desk`;

function apiClient() {
    return (typeof window !== 'undefined' && (window.ApiClient || window.APIClient)) || null;
}

function publicSession(pcId, s) {
    return { pcId, npcId: s.npcId ?? null, username: s.username ?? null, displayName: s.displayName ?? null, via: s.via ?? null };
}

export class PcSessions {
    constructor() {
        this.sessions = new Map();
        this.signedIn = new Set();
        this.desktops = new Map();
        this._listening = null;
    }

    /**
     * Listen for the workstation events that end a claimed session (idempotent; needs a
     * dispatcher with on()). Called from load() and claim(); a dispatcher replaced later
     * gets its own listeners.
     */
    listen() {
        const dispatcher = typeof window !== 'undefined' ? window.eventDispatcher : null;
        if (!dispatcher || typeof dispatcher.on !== 'function' || this._listening === dispatcher) return false;
        this._listening = dispatcher;
        dispatcher.on('workstation_owner_returned:*', (d) => { if (d?.objectId) this.ownerReturned(d.objectId); });
        dispatcher.on('workstation_auto_locked:*', (d) => { if (d?.objectId) this.screenAutoLocked(d.objectId); });
        return true;
    }

    _emit(name, data) {
        const dispatcher = typeof window !== 'undefined' ? window.eventDispatcher : null;
        if (!dispatcher || typeof dispatcher.emit !== 'function') return;
        try {
            dispatcher.emit(name, data);
            if (data?.pcId) dispatcher.emit(`${name}:${data.pcId}`, data);
        } catch (e) {
            console.warn(`[pc-sessions] ${name} listeners threw`, e);
        }
    }

    /**
     * The scenario response's `sessions` ({ pcId: { npcId, username, displayName, via } })
     * and `signedInPcs`, after a load or reload. Password sessions are kept. A claimed
     * session ends (POST /logout, pc_signed_out): the workstation state resets with every
     * owner back at the desk, so the end rules for a claim could no longer apply (5.3).
     */
    load(sessions = {}, signedInPcs = []) {
        this.listen();
        this.sessions.clear();
        this.signedIn.clear();
        (Array.isArray(signedInPcs) ? signedInPcs : []).forEach(pcId => {
            if (typeof pcId === 'string' && pcId) this.signedIn.add(pcId);
        });
        const entries = sessions && typeof sessions === 'object' ? Object.entries(sessions) : [];
        for (const [pcId, s] of entries) {
            if (!s || typeof s !== 'object') continue;
            if (s.via === 'claim') {
                this._endRestoredClaim(pcId, s);
                continue;
            }
            this.sessions.set(pcId, {
                npcId: s.npcId ?? null,
                username: s.username ?? null,
                displayName: s.displayName ?? null,
                via: s.via || 'password',
                restored: true
            });
            this.signedIn.add(pcId);
        }
    }

    _endRestoredClaim(pcId, s) {
        const api = apiClient();
        const done = () => this._emit('pc_signed_out', { pcId, npcId: s.npcId ?? null, reason: 'claim_ended' });
        if (api?.logout) {
            Promise.resolve(api.logout(pcId)).catch(e => console.warn('[pc-sessions] logout of a claimed session failed', e)).then(done);
        } else {
            done();
        }
    }

    has(pcId) { return this.sessions.has(pcId); }

    get(pcId) {
        const s = this.sessions.get(pcId);
        return s ? publicSession(pcId, s) : null;
    }

    /** Every session, as [{ pcId, npcId, username, displayName, via }]. */
    list() {
        return [...this.sessions.entries()].map(([pcId, s]) => publicSession(pcId, s));
    }

    /** True once the player has ever signed in at this PC (an unlock_object task on it). */
    wasSignedIn(pcId) { return this.signedIn.has(pcId); }

    signedInPcs() { return [...this.signedIn]; }

    /**
     * Sign in with a username and password. Resolves to
     *   { ok: true, session }
     *   { ok: false, reason: 'wrong' | 'not_permitted' | 'locked_out', message, attemptsLeft }
     *   { ok: false, reason: 'error', error: true, status, message }   (no answer, or not reachable)
     * The current session at this PC (if any) stays until the new account's password is
     * accepted; then pc_signed_out fires for the old account and pc_signed_in for the new.
     */
    async signIn(pcId, username, password) {
        const api = apiClient();
        if (!api?.login) return { ok: false, reason: 'error', error: true, status: null, message: 'Sign-in is not available' };
        let body;
        try {
            body = await api.login(pcId, { username, password });
        } catch (err) {
            const b = err?.body || {};
            if (err?.status === 422) {
                const reason = b.lockedOut ? 'locked_out' : (b.notPermitted ? 'not_permitted' : 'wrong');
                const attemptsLeft = Number.isFinite(b.attemptsLeft) ? b.attemptsLeft : null;
                this._emit('pc_signin_failed', { pcId, reason, attemptsLeft });
                return {
                    ok: false,
                    reason,
                    message: b.message || 'Incorrect username or password',
                    attemptsLeft,
                    lockedOut: reason === 'locked_out',
                    notPermitted: reason === 'not_permitted'
                };
            }
            return {
                ok: false, reason: 'error', error: true, status: err?.status ?? null,
                message: b.message || b.error || 'Could not reach the sign-in service'
            };
        }
        if (!body || body.success === false || !body.npcId) {
            return { ok: false, reason: 'error', error: true, status: null, message: body?.message || 'Sign-in failed' };
        }
        const session = { npcId: body.npcId, username: body.username ?? null, displayName: body.displayName ?? null, via: body.via || 'password' };
        this._replace(pcId, session);
        return { ok: true, session: publicSession(pcId, session) };
    }

    /**
     * Claim the owner's unlocked session (5.4): POST /login with claim "owner" and the
     * workstation globals, which the server only logs. Resolves
     *   { ok: true, session }   (pc_signed_in with via "claim")
     *   { ok: false, reason: 'refused', message }  (the server's "Sign in required"; no event)
     *   { ok: false, reason: 'owner_returned', message }  (granted, but the owner was back by
     *                                    then: pc_signed_in, then pc_signed_out owner_returned)
     *   { ok: false, reason: 'auto_locked', message }  (granted, but the screen auto locked by
     *                                    then: pc_signed_in, then pc_signed_out auto_locked)
     *   { ok: false, reason: 'error', error: true, status, message }
     */
    async claim(pcId) {
        this.listen();
        const api = apiClient();
        if (!api?.login) return { ok: false, reason: 'error', error: true, status: null, message: 'Sign-in is not available' };
        const g = (typeof window !== 'undefined' && window.gameState?.globalVariables) || {};
        const globals = {
            [`${pcId}_screen_locked`]: !!g[`${pcId}_screen_locked`],
            [`${pcId}_owner_away`]: !!g[`${pcId}_owner_away`]
        };
        let body;
        try {
            body = await api.login(pcId, { claim: 'owner', globals });
        } catch (err) {
            const b = err?.body || {};
            if (err?.status === 422) return { ok: false, reason: 'refused', message: b.message || 'Sign in required' };
            return { ok: false, reason: 'error', error: true, status: err?.status ?? null, message: b.message || b.error || 'Could not reach the sign-in service' };
        }
        if (!body || body.success === false || !body.npcId) {
            return { ok: false, reason: 'refused', message: body?.message || 'Sign in required' };
        }
        const session = { npcId: body.npcId, username: body.username ?? null, displayName: body.displayName ?? null, via: 'claim' };
        this._replace(pcId, session);
        // The owner came back while the claim was in flight: workstation_owner_returned
        // fired before there was a session to end, so end it now, as that event would have.
        const ws = typeof window !== 'undefined' ? window.workstationState : null;
        let present = false;
        try { present = !!(ws?.presence && ws.presence(pcId)?.present); } catch (e) { present = false; }
        if (present) {
            const message = backAtDeskMessage(session.displayName);
            await this._endClaim(pcId, 'owner_returned', message);
            return { ok: false, reason: 'owner_returned', message };
        }
        // Likewise the auto lock: workstation_auto_locked fires once, at lockAt, and found no
        // session if it fell while the claim was in flight. The workstation layer has set the
        // screen global by then, so read it afresh and end the claim as that event would have.
        const after = (typeof window !== 'undefined' && window.gameState?.globalVariables) || {};
        if (after[`${pcId}_screen_locked`]) {
            await this._endClaim(pcId, 'auto_locked', SCREEN_LOCKED_MESSAGE);
            return { ok: false, reason: 'auto_locked', message: SCREEN_LOCKED_MESSAGE };
        }
        return { ok: true, session: publicSession(pcId, session) };
    }

    /** workstation_owner_returned:<pcId>: a claimed session there ends. */
    async ownerReturned(pcId) {
        const s = this.sessions.get(pcId);
        if (!s || s.via !== 'claim') return false;
        return this._endClaim(pcId, 'owner_returned', backAtDeskMessage(s.displayName));
    }

    /** workstation_auto_locked:<pcId>: a claimed session there ends. */
    async screenAutoLocked(pcId) {
        const s = this.sessions.get(pcId);
        if (!s || s.via !== 'claim') return false;
        return this._endClaim(pcId, 'auto_locked', SCREEN_LOCKED_MESSAGE);
    }

    async _endClaim(pcId, reason, message) {
        const previous = this.sessions.get(pcId);
        if (!previous) return false;
        this.sessions.delete(pcId);
        const api = apiClient();
        if (api?.logout) {
            try { await api.logout(pcId); } catch (e) { console.warn('[pc-sessions] logout of a claimed session failed', e); }
        }
        this._emit('pc_signed_out', { pcId, npcId: previous.npcId ?? null, reason, firstAtPc: !!previous.firstAtPc });
        this._closeDesktop(pcId, message);
        return true;
    }

    /** A click found the owner at the desk (5.4, step 1 of the interaction). */
    inUseShown(pcId, ownerId) {
        this._emit('pc_in_use', { pcId, ownerId: ownerId ?? null, signedInBefore: this.signedIn.has(pcId) });
    }

    _replace(pcId, session) {
        const previous = this.sessions.get(pcId);
        const firstAtPc = !this.signedIn.has(pcId);
        if (previous) {
            this.sessions.delete(pcId);
            this._emit('pc_signed_out', { pcId, npcId: previous.npcId ?? null, reason: 'switch' });
        }
        this.sessions.set(pcId, { ...session, restored: false, firstAtPc });
        this.signedIn.add(pcId);
        this._emit('pc_signed_in', {
            pcId, npcId: session.npcId, username: session.username, via: session.via,
            previousNpcId: previous?.npcId ?? null, firstAtPc
        });
    }

    /**
     * Sign out (the desktop's Sign out button): POST /logout, pc_signed_out, and an open
     * desktop closes with `message`. Resolves false when there was no session.
     */
    async signOut(pcId, { message = SIGNED_OUT_MESSAGE } = {}) {
        const previous = this.sessions.get(pcId);
        if (!previous) return false;
        this.sessions.delete(pcId);
        const api = apiClient();
        if (api?.logout) {
            try { await api.logout(pcId); } catch (e) { console.warn('[pc-sessions] logout failed', e); }
        }
        this._emit('pc_signed_out', { pcId, npcId: previous.npcId ?? null, reason: 'sign_out' });
        this._closeDesktop(pcId, message);
        return true;
    }

    /**
     * The server holds no session here (a 403 from container): forget the local copy with
     * no request, emitting pc_signed_out once. Resolves false when there was none.
     */
    dropLocal(pcId, { message = null } = {}) {
        const previous = this.sessions.get(pcId);
        if (!previous) return false;
        this.sessions.delete(pcId);
        this._emit('pc_signed_out', { pcId, npcId: previous.npcId ?? null, reason: 'no_session' });
        if (message) this._closeDesktop(pcId, message);
        else this.desktops.delete(pcId);
        return true;
    }

    /** A desktop for pcId is open; `close(message)` shuts it. Returns the unregister function. */
    registerDesktop(pcId, close) {
        this.desktops.set(pcId, close);
        return () => { if (this.desktops.get(pcId) === close) this.desktops.delete(pcId); };
    }

    _closeDesktop(pcId, message) {
        const close = this.desktops.get(pcId);
        if (!close) return;
        this.desktops.delete(pcId);
        try { close(message); } catch (e) { console.warn('[pc-sessions] closing the desktop failed', e); }
    }

    /** The sign-in screen opened at pcId with these tiles. */
    screenShown(pcId, tiles = [], reason = undefined) {
        const usernames = (Array.isArray(tiles) ? tiles : []).map(t => t?.username).filter(Boolean);
        // usernameList: the same as one string, for eventMapping conditions (".includes('x')")
        const data = { pcId, usernames, usernameList: usernames.join(',') };
        if (reason) data.reason = reason;
        this._emit('pc_signin_shown', data);
    }

    /** The desktop loaded for the session at pcId. */
    desktopOpened(pcId) {
        const s = this.sessions.get(pcId);
        if (!s) return;
        this._emit('pc_desktop_opened', { pcId, npcId: s.npcId ?? null, via: s.via ?? null, restored: !!s.restored });
    }
}

export const pcSessions = new PcSessions();
if (typeof window !== 'undefined') window.pcSessions = pcSessions;

export default pcSessions;
