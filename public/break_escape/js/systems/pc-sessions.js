/**
 * PC SESSIONS (access model, docs/achitechture/ACCESS_MODEL_PLAN.md 5.3, step 8)
 * ==============================================================================
 *
 * The only place the client signs in to or out of a sign-in PC (`lockType: "login"`),
 * and the only source of the sign-in events. It keeps:
 *
 *   sessions   pcId -> { npcId, username, displayName, via, restored, remote, footholdId,
 *              host }, filled from the server's answers (POST /login, the scenario
 *              response on load, and a sign-in desktop's answer from GET /container);
 *   signedIn   every sign-in PC the player has ever signed in to (the server's
 *              signedInPcs, used by unlock_object tasks);
 *   desktops   pcId -> close(message, reason) for a desktop that is open now, so a session
 *              that ends closes it with a one-line message; reason is why (sign_out,
 *              no_session, link_dropped, displaced, owner_returned, auto_locked), which a
 *              network screen hands to networkLinks.landed (slice 9.3a, 4.3).
 *
 * Remote sessions (slice 9.3a, ACCESS_MODEL_SLICE_9_3_PLAN.md 4.4). A sign-in through a
 * foothold (signIn(pcId, username, password, { foothold })) is held in the same slot as a
 * local one; it carries remote: true, footholdId and host (the PC's label, since its room
 * may never have loaded). The sign-in events carry remote and footholdId. A keyboard fetch
 * of the desktop settles a remote session (the server clears its foothold), and the answer's
 * session tells settle() so. network_device_unplugged ends exactly the sessions named in its
 * endedPcIds (pc_signed_out reason link_dropped; an open desktop closes with "The link
 * dropped"). A refusal because the PC's policy blocks remote sign-in (422 remoteBlocked)
 * emits pc_signin_failed with reason remote_blocked.
 *
 * Events (each also as `<name>:<pcId>`):
 *   pc_signed_in       { pcId, npcId, username, via, previousNpcId, firstAtPc, remote, footholdId }
 *                      a sign-in (or the second half of a switch). previousNpcId is the account
 *                      signed in at this PC just before (a switch), else null; firstAtPc is true
 *                      when the player had never signed in at this PC before (signedIn).
 *   pc_signed_out      { pcId, npcId, reason }         reason: sign_out (the Sign out button) |
 *                      switch (the first half of a switch) | no_session (a 403 from container) |
 *                      claim_ended (a claimed session ended on load) | owner_returned or
 *                      auto_locked (a claimed session ended by the owner's return or the
 *                      screen's auto lock; these two also carry firstAtPc, true when the ended
 *                      session was the first sign-in at this PC)
 *   pc_signin_failed   { pcId, reason, attemptsLeft }  reason: wrong | not_permitted | locked_out |
 *                                                      remote_blocked
 *   pc_signin_shown    { pcId, usernames, usernameList, reason? } the sign-in screen opened with
 *                      these tiles; reason (when the caller knows it) is why: signin (no owner,
 *                      or an owner not present with no away record), locked (the owner is
 *                      away and the screen locked), attended, claim_refused, switch, direct
 *                      or remote (the remote sign-in screen, opened over a network link)
 *   pc_desktop_opened  { pcId, npcId, via, restored, remote, footholdId }
 *                                                      a desktop loaded for a session; restored is
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
 * Guest claims and displacement (slice 9.2 H, ACCESS_MODEL_SLICE_9_2_PLAN.md 6.4).
 * claim(pcId, { as: 'guest' }) claims the session a borrowing NPC left open at a hot desk
 * (POST /login with claim "guest"); it ends as a claim does, on the auto lock and on a reload,
 * never on an owner's return. One screen holds one session: when an NPC sits down at a PC
 * (npc_sat_at:<pcId>), and again when it leaves a borrowed session there
 * (npc_borrowed_session:<pcId>, for a remote sign-in started while it sat), displaced(pcId, name)
 * ends whatever session the player holds there (password, claim, guest claim or remote): POST
 * /logout, pc_signed_out with reason displaced, and an open desktop closes with
 * "<name> has signed in at this PC".
 *
 * Exposed as window.pcSessions; window.__test.access.sessions() reads list().
 */

export const SIGNED_OUT_MESSAGE = 'Signed out';
export const SCREEN_LOCKED_MESSAGE = 'The screen locked';
export const LINK_DROPPED_MESSAGE = 'The link dropped';

/**
 * The toast an unplug shows for sessions it ended with no desktop open (on-screen text,
 * never voiced): "Unplugged. Your session on LW-DOOR01 ended." Host labels joined with
 * commas and "and"; null for none.
 */
export function unplugEndedMessage(hosts = []) {
    const list = (Array.isArray(hosts) ? hosts : []).filter(h => typeof h === 'string' && h);
    if (!list.length) return null;
    const names = list.length === 1 ? list[0] : `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
    return `Unplugged. Your session${list.length === 1 ? '' : 's'} on ${names} ended.`;
}
export const backAtDeskMessage = (name) => `${name || 'The owner'} is back at the desk`;
export const displacedMessage = (name) => `${name || 'Someone'} has signed in at this PC`;

function npcName(npcId) {
    const w = typeof window !== 'undefined' ? window : {};
    const rec = w.npcManager?.getNPC?.(npcId) || w.npcManager?.npcs?.get?.(npcId) || null;
    return rec?.displayName || npcId || null;
}

function apiClient() {
    return (typeof window !== 'undefined' && (window.ApiClient || window.APIClient)) || null;
}

function publicSession(pcId, s) {
    const out = { pcId, npcId: s.npcId ?? null, username: s.username ?? null, displayName: s.displayName ?? null, via: s.via ?? null };
    // Only a remote session carries remote, footholdId and host, as on the server (4.4)
    if (s.remote === true) Object.assign(out, { remote: true, footholdId: s.footholdId ?? null, host: s.host ?? null });
    return out;
}

/** The remote fields of a server session entry (4.4): only a remote one carries them. */
function remoteFields(s) {
    if (!s || s.remote !== true) return { remote: false, footholdId: null, host: null };
    return { remote: true, footholdId: s.footholdId ?? null, host: s.host ?? null };
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
        dispatcher.on('network_device_unplugged', (d) => this.linkDropped(d?.endedPcIds));
        // 9.2 H (6.4): an NPC sitting down, or leaving a borrowed session, ends the player's there
        const sat = (d) => { if (d?.objectId) this.displaced(d.objectId, npcName(d.npcId)); };
        dispatcher.on('npc_sat_at:*', sat);
        dispatcher.on('npc_borrowed_session:*', sat);
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
                restored: true,
                ...remoteFields(s)
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

    /**
     * Every session, as [{ pcId, npcId, username, displayName, via }]; a remote one also
     * carries remote: true, footholdId and host (the capture log names a remote host from it).
     */
    list() {
        return [...this.sessions.entries()].map(([pcId, s]) => publicSession(pcId, s));
    }

    /** True once the player has ever signed in at this PC (an unlock_object task on it). */
    wasSignedIn(pcId) { return this.signedIn.has(pcId); }

    signedInPcs() { return [...this.signedIn]; }

    /**
     * Sign in with a username and password; with { foothold } a remote sign-in through that
     * foothold (slice 9.3a, 4.4). Resolves to
     *   { ok: true, session }
     *   { ok: false, reason: 'wrong' | 'not_permitted' | 'locked_out' | 'remote_blocked', message, attemptsLeft }
     *   { ok: false, reason: 'error', error: true, status, message }   (no answer, or not reachable)
     * The current session at this PC (if any) stays until the new account's password is
     * accepted; then pc_signed_out fires for the old account and pc_signed_in for the new.
     */
    async signIn(pcId, username, password, { foothold = null } = {}) {
        this.listen();
        const api = apiClient();
        if (!api?.login) return { ok: false, reason: 'error', error: true, status: null, message: 'Sign-in is not available' };
        let body;
        try {
            body = await api.login(pcId, foothold ? { username, password, foothold } : { username, password });
        } catch (err) {
            const b = err?.body || {};
            if (err?.status === 422) {
                const reason = b.remoteBlocked ? 'remote_blocked'
                    : (b.lockedOut ? 'locked_out' : (b.notPermitted ? 'not_permitted' : 'wrong'));
                const attemptsLeft = Number.isFinite(b.attemptsLeft) ? b.attemptsLeft : null;
                this._emit('pc_signin_failed', { pcId, reason, attemptsLeft });
                return {
                    ok: false,
                    reason,
                    message: b.message || 'Incorrect username or password',
                    attemptsLeft,
                    lockedOut: reason === 'locked_out',
                    notPermitted: reason === 'not_permitted',
                    remoteBlocked: reason === 'remote_blocked'
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
        const session = {
            npcId: body.npcId, username: body.username ?? null, displayName: body.displayName ?? null, via: body.via || 'password',
            ...remoteFields(body)
        };
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
    async claim(pcId, { as = 'owner' } = {}) {
        this.listen();
        const guest = as === 'guest';
        const api = apiClient();
        if (!api?.login) return { ok: false, reason: 'error', error: true, status: null, message: 'Sign-in is not available' };
        const g = (typeof window !== 'undefined' && window.gameState?.globalVariables) || {};
        const globals = {
            [`${pcId}_screen_locked`]: !!g[`${pcId}_screen_locked`],
            [`${pcId}_owner_away`]: !!g[`${pcId}_owner_away`]
        };
        let body;
        try {
            body = await api.login(pcId, { claim: guest ? 'guest' : 'owner', globals });
        } catch (err) {
            const b = err?.body || {};
            if (err?.status === 422) return { ok: false, reason: 'refused', message: b.message || 'Sign in required' };
            return { ok: false, reason: 'error', error: true, status: err?.status ?? null, message: b.message || b.error || 'Could not reach the sign-in service' };
        }
        if (!body || body.success === false || !body.npcId) {
            return { ok: false, reason: 'refused', message: body?.message || 'Sign in required' };
        }
        const session = { npcId: body.npcId, username: body.username ?? null, displayName: body.displayName ?? null, via: 'claim' };
        if (guest) session.guest = true;
        this._replace(pcId, session);
        // The owner came back while the claim was in flight: workstation_owner_returned
        // fired before there was a session to end, so end it now, as that event would have.
        const ws = typeof window !== 'undefined' ? window.workstationState : null;
        let present = false;
        try { present = !guest && !!(ws?.presence && ws.presence(pcId)?.present); } catch (e) { present = false; }
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

    /** workstation_owner_returned:<pcId>: a claimed session there ends (never a guest's, 6.4). */
    async ownerReturned(pcId) {
        const s = this.sessions.get(pcId);
        if (!s || s.via !== 'claim' || s.guest) return false;
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
        this._closeDesktop(pcId, message, reason);
        return true;
    }

    /**
     * 9.2 H (6.4): an NPC signed in at pcId, so the player's session there (of any kind) ends:
     * POST /logout, pc_signed_out with reason displaced, and an open desktop closes with
     * "<name> has signed in at this PC". Resolves false when the player held none there.
     */
    async displaced(pcId, name) {
        const previous = this.sessions.get(pcId);
        if (!previous) return false;
        this.sessions.delete(pcId);
        const message = displacedMessage(name);
        this._closeDesktop(pcId, message, 'displaced');
        this._emit('pc_signed_out', { pcId, npcId: previous.npcId ?? null, reason: 'displaced', ...this._remoteOf(previous) });
        const api = apiClient();
        if (api?.logout) {
            try { await api.logout(pcId); } catch (e) { console.warn('[pc-sessions] logout of a displaced session failed', e); }
        }
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
            this._emit('pc_signed_out', { pcId, npcId: previous.npcId ?? null, reason: 'switch', ...this._remoteOf(previous) });
        }
        this.sessions.set(pcId, { remote: false, footholdId: null, host: null, ...session, restored: false, firstAtPc });
        this.signedIn.add(pcId);
        this._emit('pc_signed_in', {
            pcId, npcId: session.npcId, username: session.username, via: session.via,
            previousNpcId: previous?.npcId ?? null, firstAtPc, ...this._remoteOf(session)
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
        this._emit('pc_signed_out', { pcId, npcId: previous.npcId ?? null, reason: 'sign_out', ...this._remoteOf(previous) });
        this._closeDesktop(pcId, message, 'sign_out');
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
        this._emit('pc_signed_out', { pcId, npcId: previous.npcId ?? null, reason: 'no_session', ...this._remoteOf(previous) });
        if (message) this._closeDesktop(pcId, message, 'no_session');
        else this.desktops.delete(pcId);
        return true;
    }

    /**
     * network_device_unplugged: the server ended exactly the sessions in endedPcIds (they
     * went through the unplugged foothold). Each is dropped with no request, emits
     * pc_signed_out reason link_dropped, and an open desktop closes with "The link dropped".
     * The sessions whose desktop was not open (the usual case: the unplug happens at the jack)
     * get one toast naming their hosts. Returns the pcIds dropped.
     */
    linkDropped(endedPcIds = []) {
        const dropped = [];
        const unseen = [];
        for (const pcId of (Array.isArray(endedPcIds) ? endedPcIds : [])) {
            const previous = this.sessions.get(pcId);
            if (!previous) continue;
            this.sessions.delete(pcId);
            dropped.push(pcId);
            // The host label the server sent; never the internal PC id
            if (!this.desktops.has(pcId)) unseen.push(previous.host || 'a remote PC');
            this._emit('pc_signed_out', { pcId, npcId: previous.npcId ?? null, reason: 'link_dropped', ...this._remoteOf(previous) });
            this._closeDesktop(pcId, LINK_DROPPED_MESSAGE, 'link_dropped');
        }
        const message = unplugEndedMessage(unseen);
        if (message) {
            try {
                // Host labels are author text: plain text, never markup
                if (typeof window !== 'undefined') window.gameAlert?.(message, 'info', '', 5000, { plainText: true });
            } catch (e) { /* no notification layer */ }
        }
        return dropped;
    }

    /**
     * A sign-in desktop's answer from GET /container carries the session in the scenario
     * response's shape (4.4). A keyboard fetch clears a remote session's foothold on the
     * server, so the answer has no remote: the local copy follows. No event.
     */
    settle(pcId, session) {
        const s = this.sessions.get(pcId);
        if (!s || !session || typeof session !== 'object') return false;
        Object.assign(s, remoteFields(session));
        return true;
    }

    /** The event fields of a remote session ({ remote: true, footholdId }); nothing for a local one. */
    _remoteOf(s) {
        return s?.remote === true ? { remote: true, footholdId: s.footholdId ?? null } : {};
    }

    /** A desktop for pcId is open; `close(message, reason)` shuts it. Returns the unregister function. */
    registerDesktop(pcId, close) {
        this.desktops.set(pcId, close);
        return () => { if (this.desktops.get(pcId) === close) this.desktops.delete(pcId); };
    }

    _closeDesktop(pcId, message, reason = null) {
        const close = this.desktops.get(pcId);
        if (!close) return;
        this.desktops.delete(pcId);
        try { close(message, reason); } catch (e) { console.warn('[pc-sessions] closing the desktop failed', e); }
    }

    /**
     * The sign-in screen opened at pcId with these tiles. `hasPostit`: the screen shows a
     * sticky note (slice 9.1, 5.3), so a scenario can credit "found the note". The sign-in
     * screen always passes it; a caller that leaves it out sends no hasPostit.
     */
    screenShown(pcId, tiles = [], reason = undefined, hasPostit = undefined) {
        const usernames = (Array.isArray(tiles) ? tiles : []).map(t => t?.username).filter(Boolean);
        // usernameList: the same as one string, for eventMapping conditions (".includes('x')")
        const data = { pcId, usernames, usernameList: usernames.join(',') };
        if (hasPostit !== undefined) data.hasPostit = !!hasPostit;
        if (reason) data.reason = reason;
        this._emit('pc_signin_shown', data);
    }

    /** The desktop loaded for the session at pcId. */
    desktopOpened(pcId) {
        const s = this.sessions.get(pcId);
        if (!s) return;
        this._emit('pc_desktop_opened', { pcId, npcId: s.npcId ?? null, via: s.via ?? null, restored: !!s.restored, ...this._remoteOf(s) });
    }
}

export const pcSessions = new PcSessions();
if (typeof window !== 'undefined') window.pcSessions = pcSessions;

export default pcSessions;
