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
 * Relay sessions (keyring K3c, plan 8.3). An assist invite signed in with
 * signInWithCredential(pcId, id, { relay: true }) joins the account holder's own session on
 * their PC. It is held in the same slot and carries relay: true and host (never remote or
 * footholdId); it is not the player's own sign-in there, so it never enters signedIn and
 * firstAtPc is false. At the PC's own keyboard it counts as no session (heldAtKeyboard), the
 * server never sends one on load (load() skips it), and the holder sitting down at their own
 * PC does not displace it. The account holder ending the assist arrives in the state-sync
 * answer's endedRelayPcIds (read by hookSyncAnswer, an answer-only part): each named relay
 * session is dropped with no request and emits pc_signed_out reason relay_ended, and an open
 * relay desktop closes with "<name> ended the remote assist." (a toast when none is open).
 * Events for a relay carry relay: true and kind.
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
 *   pc_signing_out     { pcId, reason }                 a sign-out (sign_out, claim_ended, owner_returned
 *                      or auto_locked) is sending POST /logout; its pc_signed_out follows the
 *                      answer (q44: the workstation layer keeps a guest recorded meanwhile)
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
export const SESSION_LOCKED_MESSAGE = 'Locked. Sign in again to continue.';

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
/**
 * The toast for sessions a sign-in or sign-out pruned (plan 8.5, reason route_ended): the
 * session each went through was closed. Not an unplug.
 */
export function routeEndedMessage(hosts = []) {
    const list = (Array.isArray(hosts) ? hosts : []).filter(h => typeof h === 'string' && h);
    if (!list.length) return null;
    const names = list.length === 1 ? list[0] : `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
    return list.length === 1
        ? `Your session on ${names} ended: the session it went through was closed.`
        : `Your sessions on ${names} ended: the sessions they went through were closed.`;
}
/**
 * The line a relay desktop closes with when the account holder ends the assist (keyring K3c,
 * plan 8.3; on-screen text, never voiced). This module stays import-free, so the text is a
 * copy of remote-host-text.js endedAssistMessage; a test keeps the two equal.
 */
export const relayEndedMessage = (displayName) => `${displayName || 'The account holder'} ended the remote assist.`;
export const backAtDeskMessage = (name) => `${name || 'The owner'} is back at the desk`;
export const displacedMessage = (name) => `${name || 'Someone'} has signed in at this PC`;

function npcName(npcId) {
    const w = typeof window !== 'undefined' ? window : {};
    const rec = w.npcManager?.getNPC?.(npcId) || w.npcManager?.npcs?.get?.(npcId) || null;
    return rec?.displayName || npcId || null;
}

/**
 * The reason for a credential sign-in's 422 body (keyring K3a): each server flag maps to its
 * own reason; the generic body (no flag) means the credential no longer signs in.
 */
export function credentialRefusalReason(b = {}) {
    if (b.remoteBlocked) return 'remote_blocked';
    if (b.wrongPc) return 'wrong_pc';
    if (b.kindRefused) return 'kind_refused';
    if (b.notPermitted) return 'not_permitted';
    if (b.lockedOut) return 'locked_out';
    if (b.ended) return 'ended';
    return 'no_longer_works';
}

function apiClient() {
    return (typeof window !== 'undefined' && (window.ApiClient || window.APIClient)) || null;
}

function publicSession(pcId, s) {
    const out = { pcId, npcId: s.npcId ?? null, username: s.username ?? null, displayName: s.displayName ?? null, via: s.via ?? null };
    // Only a remote session carries remote, footholdId and host, as on the server (4.4)
    if (s.remote === true) Object.assign(out, { remote: true, footholdId: s.footholdId ?? null, host: s.host ?? null });
    // A relay session (keyring K3c, 8.3) is the account holder's own session, joined by an
    // assist invite: relay and host, never remote or footholdId
    if (s.relay === true) Object.assign(out, { relay: true, host: s.host ?? null });
    // A guest claim says so, so its desktop can say how it ends (UX access R1 finding 5)
    if (s.guest === true) out.guest = true;
    // A locked session (UI slice 6) stays held but needs the password again; the open flow
    // reads this to show the sign-in screen with the account pre-chosen.
    if (s.locked === true) out.locked = true;
    // A credential session (keyring K3a) names its kind and label for the desktop's second line
    if (s.via === 'credential') Object.assign(out, credentialFields(s));
    // The account's picture source (a headshot key's portrait or avatar), only when the server sent it
    if (typeof s.portrait === 'string' && s.portrait) out.portrait = s.portrait;
    if (typeof s.avatar === 'string' && s.avatar) out.avatar = s.avatar;
    return out;
}

/** A credential session's kind and label (keyring K3a), each only when sent as a string. */
function credentialFields(s) {
    const out = {};
    if (typeof s?.kind === 'string' && s.kind) out.kind = s.kind;
    if (typeof s?.label === 'string' && s.label) out.label = s.label;
    return out;
}

/** The picture source of a server session entry: portrait and avatar, each only when sent. */
function pictureFields(s) {
    return {
        ...(typeof s?.portrait === 'string' && s.portrait ? { portrait: s.portrait } : {}),
        ...(typeof s?.avatar === 'string' && s.avatar ? { avatar: s.avatar } : {})
    };
}

/** The relay fields of a server session entry (keyring K3c): only a relay one carries them. */
function relayFields(s) {
    return s && s.relay === true ? { relay: true, host: s.host ?? null } : {};
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
        // UI slice 6: the server said locking a held session is supported (the scenario answer's
        // sessionLockingSupported). The start panel reads lockingSupported() to show the Lock button.
        this._lockingSupported = false;
        // pcId -> { message, reason }: a session that ended while its desktop was closed for
        // a reader; the container return shows it (container-minigame.js, review M2)
        this.endedUnseen = new Map();
        this._listening = null;
        // The state-sync instance whose answers this mirror reads (endedRelayPcIds, K3c)
        this._syncHooked = null;
    }

    /**
     * Listen for the workstation events that end a claimed session (idempotent; needs a
     * dispatcher with on()). Called from load() and claim(); a dispatcher replaced later
     * gets its own listeners.
     */
    listen() {
        this.hookSyncAnswer();
        const dispatcher = typeof window !== 'undefined' ? window.eventDispatcher : null;
        if (!dispatcher || typeof dispatcher.on !== 'function' || this._listening === dispatcher) return false;
        this._listening = dispatcher;
        dispatcher.on('workstation_owner_returned:*', (d) => { if (d?.objectId) this.ownerReturned(d.objectId); });
        dispatcher.on('workstation_auto_locked:*', (d) => { if (d?.objectId) this.screenAutoLocked(d.objectId); });
        dispatcher.on('network_device_unplugged', (d) => this.linkDropped(d?.endedPcIds, 'unplugged'));
        // 9.2 H (6.4): an NPC sitting down, or leaving a borrowed session, ends the player's there
        // The NPC's id goes too: the holder of a relay session sitting down keeps it (K3c, 8.3)
        const sat = (d) => { if (d?.objectId) this.displaced(d.objectId, npcName(d.npcId), d.npcId ?? null); };
        dispatcher.on('npc_sat_at:*', sat);
        dispatcher.on('npc_borrowed_session:*', sat);
        return true;
    }

    /**
     * Read the sync answer's endedRelayPcIds (keyring K3c, 8.3): the account holder ended the
     * assist, so each relay session named there ends with relay_ended. Registers an answer-only
     * part on window.stateSync (no body, so it never makes a sync send anything); idempotent
     * per state-sync instance. Called from listen(). Returns true when a hook is in place.
     */
    hookSyncAnswer() {
        const sync = typeof window !== 'undefined' ? window.stateSync : null;
        if (!sync || typeof sync.registerPart !== 'function') return false;
        if (this._syncHooked === sync) return true;
        this._syncHooked = sync;
        sync.registerPart('relayEnds', { onAnswer: (answer) => this.relayAnswer(answer) });
        return true;
    }

    /** A sync answer: end the relay sessions it names in endedRelayPcIds. Returns the pcIds dropped. */
    relayAnswer(answer) {
        const ids = Array.isArray(answer?.endedRelayPcIds) ? answer.endedRelayPcIds.filter(id => typeof id === 'string' && id) : [];
        // Only relay sessions: a stray id never ends a keyboard or foothold session
        const relays = ids.filter(id => this.sessions.get(id)?.relay === true);
        return relays.length ? this.linkDropped(relays, 'relay_ended') : [];
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
    load(sessions = {}, signedInPcs = [], { lockingSupported = false } = {}) {
        this.listen();
        this.sessions.clear();
        this.signedIn.clear();
        this._lockingSupported = lockingSupported === true;
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
            // The server never sends a relay session on load (K3c, 8.3); one that came anyway is
            // not held here, has no signedIn entry and arms nothing. Re-entry is by Connect.
            if (s.relay === true) continue;
            this.sessions.set(pcId, {
                npcId: s.npcId ?? null,
                username: s.username ?? null,
                displayName: s.displayName ?? null,
                via: s.via || 'password',
                ...(s.via === 'credential' ? credentialFields(s) : {}),
                ...pictureFields(s),
                restored: true,
                // A locked session survives a reload like any other session state (UI slice 6)
                ...(s.locked === true ? { locked: true } : {}),
                ...remoteFields(s)
            });
            this.signedIn.add(pcId);
        }
    }

    /** UI slice 6: the server supports locking a held session (the scenario answer said so). */
    lockingSupported() { return this._lockingSupported === true; }

    /** True when the held session at pcId is locked (UI slice 6): the open flow shows the sign-in screen. */
    isLocked(pcId) { return this.sessions.get(pcId)?.locked === true; }

    /**
     * Whether the start panel may offer Lock for pcId (UI slice 6): the server supports
     * locking, a session is held here, it was entered with a password (not a claim or guest,
     * which no password could unlock), and it is not already locked. The server enforces the
     * same rule (lock_session! refuses a non-password session with 422); this keeps the
     * affordance from ever being shown or attempted for those.
     */
    canLock(pcId) {
        if (!this.lockingSupported()) return false;
        const s = this.sessions.get(pcId);
        return !!s && s.via === 'password' && s.locked !== true;
    }

    _endRestoredClaim(pcId, s) {
        const api = apiClient();
        const done = () => this._emit('pc_signed_out', { pcId, npcId: s.npcId ?? null, reason: 'claim_ended' });
        if (api?.logout) {
            this._emit('pc_signing_out', { pcId, reason: 'claim_ended' });
            Promise.resolve(api.logout(pcId)).catch(e => console.warn('[pc-sessions] logout of a claimed session failed', e)).then(done);
        } else {
            done();
        }
    }

    has(pcId) { return this.sessions.has(pcId); }

    /** The relay ended line for this display name (screens read it here, so the text has one home on the client side). */
    relayEndedLine(displayName) { return relayEndedMessage(displayName); }

    /** True when the session held at pcId is a relay (an assist invite, K3c). */
    isRelay(pcId) { return this.sessions.get(pcId)?.relay === true; }

    /** True while any relay session is held (keyring.js arms its prompt-end sync trigger on it). */
    hasRelay() {
        for (const s of this.sessions.values()) if (s.relay === true) return true;
        return false;
    }

    /**
     * A session the player can use at pcId's own keyboard (K3c, 3.8 and 8.3): a relay session
     * is the holder's, reached only by Connect, so at the keyboard it counts as none.
     */
    heldAtKeyboard(pcId) {
        const s = this.sessions.get(pcId);
        return !!s && s.relay !== true;
    }

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
     *   { ok: false, reason: 'error', error: true, status, message, serverReason }   (no answer,
     *       or refused: serverReason is the server's own reason, 'off' at the keyboard of a
     *       switched-off PC (q72) or 'not_responding' through a foothold (9.3b plan 5.2))
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
                message: b.message || b.error || 'Could not reach the sign-in service',
                serverReason: typeof b.reason === 'string' ? b.reason : null
            };
        }
        if (!body || body.success === false || !body.npcId) {
            return { ok: false, reason: 'error', error: true, status: null, message: body?.message || 'Sign-in failed' };
        }
        const session = {
            npcId: body.npcId, username: body.username ?? null, displayName: body.displayName ?? null, via: body.via || 'password',
            ...pictureFields(body),
            ...remoteFields(body)
        };
        this._replace(pcId, session);
        this._dropEnded(body.endedPcIds, pcId);
        return { ok: true, session: publicSession(pcId, session) };
    }

    /** The sessions a sign-in's answer says ended (keyring K2 3.8), never the new one itself. */
    _dropEnded(endedPcIds, pcId) {
        const ended = Array.isArray(endedPcIds) ? endedPcIds.filter(id => typeof id === 'string' && id && id !== pcId) : [];
        if (ended.length) this.linkDropped(ended, 'route_ended');
    }

    /**
     * Sign in with a keyring credential (keyring K3a, plan 8.1): POST /login { pc_id,
     * credential } with the screen's route ({ foothold }). Resolves to
     *   { ok: true, session }   (via 'credential', with kind and label)
     *   { ok: false, reason, message, attemptsLeft }  reason one of 'wrong_pc', 'kind_refused',
     *       'not_permitted', 'locked_out', 'ended', 'remote_blocked' or 'no_longer_works'
     *       (the generic 422 body: the credential no longer signs in)
     *   { ok: false, reason: 'error', error: true, status, message, serverReason }  (403/404/no answer)
     */
    async signInWithCredential(pcId, credentialId, { foothold = null, relay = false } = {}) {
        this.listen();
        const api = apiClient();
        if (!api?.loginWithCredential) return { ok: false, reason: 'error', error: true, status: null, message: 'Sign-in is not available' };
        let body;
        try {
            // A relay (an assist invite, K3c) names relay only; never relay: false
            const route = relay === true ? { relay: true } : (foothold ? { foothold } : {});
            body = await api.loginWithCredential(pcId, credentialId, route);
        } catch (err) {
            const b = err?.body || {};
            if (err?.status === 422) {
                const reason = credentialRefusalReason(b);
                const attemptsLeft = Number.isFinite(b.attemptsLeft) ? b.attemptsLeft : null;
                this._emit('pc_signin_failed', { pcId, reason, attemptsLeft, credential: credentialId });
                return {
                    ok: false,
                    reason,
                    message: b.message || 'Incorrect username or password',
                    attemptsLeft,
                    ...(reason === 'kind_refused' && typeof b.kindRefused === 'string' ? { kind: b.kindRefused } : {})
                };
            }
            return {
                ok: false, reason: 'error', error: true, status: err?.status ?? null,
                message: b.message || b.error || 'Could not reach the sign-in service',
                serverReason: typeof b.reason === 'string' ? b.reason : null
            };
        }
        if (!body || body.success === false || !body.npcId) {
            return { ok: false, reason: 'error', error: true, status: null, message: body?.message || 'Sign-in failed' };
        }
        const session = {
            npcId: body.npcId, username: body.username ?? null, displayName: body.displayName ?? null, via: 'credential',
            ...credentialFields(body),
            ...(body.route && typeof body.route === 'object' ? { route: body.route } : {}),
            ...pictureFields(body),
            ...remoteFields(body),
            ...relayFields(body)
        };
        this._replace(pcId, session);
        this._dropEnded(body.endedPcIds, pcId);
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
     *   { ok: false, reason: 'displaced', message }  (granted, but an NPC sat down there by
     *                                    then: pc_signed_in, then pc_signed_out displaced)
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
            // serverReason as signIn gives it: 'off' at a switched-off PC (q72, review R3 nit 4)
            return { ok: false, reason: 'error', error: true, status: err?.status ?? null, message: b.message || b.error || 'Could not reach the sign-in service',
                serverReason: typeof b.reason === 'string' ? b.reason : null };
        }
        if (!body || body.success === false || !body.npcId) {
            return { ok: false, reason: 'refused', message: body?.message || 'Sign in required' };
        }
        const session = { npcId: body.npcId, username: body.username ?? null, displayName: body.displayName ?? null, via: 'claim', ...pictureFields(body) };
        if (guest) session.guest = true;
        this._replace(pcId, session);
        // The owner came back while the claim was in flight: workstation_owner_returned
        // fired before there was a session to end, so end it now, as that event would have.
        const ws = typeof window !== 'undefined' ? window.workstationState : null;
        let present = false;
        let userId = null;
        try {
            const p = ws?.presence ? ws.presence(pcId) : null;
            present = !guest && !!p?.present;
            userId = typeof p?.userId === 'string' && p.userId ? p.userId : null;
        } catch (e) { present = false; userId = null; }
        if (present) {
            const message = backAtDeskMessage(session.displayName);
            await this._endClaim(pcId, 'owner_returned', message);
            return { ok: false, reason: 'owner_returned', message };
        }
        // Review R1 m4: anybody else sat down at the PC while the claim was in flight. Its npc_sat_at
        // found no session to end, so end this one now, as that event would have.
        if (userId) {
            const name = (typeof window !== 'undefined' && window.npcManager?.getNPC?.(userId)?.displayName) || userId;
            await this.displaced(pcId, name);
            return { ok: false, reason: 'displaced', message: displacedMessage(name) };
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
            this._emit('pc_signing_out', { pcId, reason });
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
    async displaced(pcId, name, npcId = null) {
        const previous = this.sessions.get(pcId);
        if (!previous) return false;
        // The holder sitting down at his own PC does not end the relay he invited the player into (K3c, 8.3)
        if (previous.relay === true && npcId && previous.npcId === npcId) return false;
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
        // A relay is the holder's session, not the player's sign-in there: signedIn (and so
        // unlock_object tasks) never counts it (K3c, 8.3)
        const relay = session.relay === true;
        const firstAtPc = !relay && !this.signedIn.has(pcId);
        if (previous) {
            this.sessions.delete(pcId);
            this._emit('pc_signed_out', { pcId, npcId: previous.npcId ?? null, reason: 'switch', ...this._remoteOf(previous) });
        }
        this.sessions.set(pcId, { remote: false, footholdId: null, host: null, ...session, restored: false, firstAtPc });
        if (!relay) this.signedIn.add(pcId);
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
        let ended = null;
        if (api?.logout) {
            this._emit('pc_signing_out', { pcId, reason: 'sign_out' });
            try { ended = (await api.logout(pcId))?.endedPcIds || null; } catch (e) { console.warn('[pc-sessions] logout failed', e); }
        }
        this._emit('pc_signed_out', { pcId, npcId: previous.npcId ?? null, reason: 'sign_out', ...this._remoteOf(previous) });
        this._closeDesktop(pcId, message, 'sign_out');
        // Signing out of a pivot ends the onward sessions (slice 9.3b K, 5.1): the server
        // returned them, so their desktops close with "the link dropped".
        if (Array.isArray(ended) && ended.length) this.linkDropped(ended, 'route_ended');
        return true;
    }

    /**
     * Lock the held session at pcId (UI slice 6): POST /lock_session (only the holder can
     * lock; the server refuses a PC with no session). The session stays held and signed in;
     * `locked` is set on the local copy, an open desktop closes with `message`, and
     * pc_session_locked fires. The next open shows the sign-in screen with the account
     * pre-chosen; a correct password (an ordinary sign-in) clears the lock on the server.
     * Resolves { ok: true } or { ok: false, reason }. `locked` is never sent back as state.
     */
    async lockSession(pcId, { message = SESSION_LOCKED_MESSAGE } = {}) {
        const s = this.sessions.get(pcId);
        if (!s) return { ok: false, reason: 'no_session' };
        if (s.locked === true) return { ok: true, alreadyLocked: true };
        // Only a password sign-in can be locked (UI slice 6): a claim or guest session has no
        // password to unlock it. The server also refuses this with 422; never attempt it.
        if (s.via !== 'password') return { ok: false, reason: 'refused', message: 'Only a signed-in session can be locked' };
        const api = apiClient();
        if (!api?.lockSession) return { ok: false, reason: 'error', message: 'Locking is not available' };
        try {
            const body = await api.lockSession(pcId);
            if (!body || body.success === false) {
                return { ok: false, reason: 'error', message: body?.message || 'Could not lock the session' };
            }
        } catch (err) {
            const b = err?.body || {};
            return { ok: false, reason: err?.status === 422 ? 'refused' : 'error', status: err?.status ?? null, message: b.message || b.error || 'Could not lock the session' };
        }
        s.locked = true;
        this._emit('pc_session_locked', { pcId, npcId: s.npcId ?? null });
        this._closeDesktop(pcId, message, 'locked');
        return { ok: true };
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
    linkDropped(endedPcIds = [], reason = 'unplugged') {
        if (reason === 'relay_ended') return this._relayEnded(endedPcIds);
        const routeEnded = reason === 'route_ended';
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
            // An open desktop of a pruned session names its host; an unplug keeps "The link dropped"
            this._closeDesktop(pcId, routeEnded ? (routeEndedMessage([previous.host || 'a remote PC']) || LINK_DROPPED_MESSAGE) : LINK_DROPPED_MESSAGE, 'link_dropped');
        }
        const message = routeEnded ? routeEndedMessage(unseen) : unplugEndedMessage(unseen);
        if (message) {
            try {
                // Host labels are author text: plain text, never markup
                if (typeof window !== 'undefined') window.gameAlert?.(message, 'info', '', 5000, { plainText: true });
            } catch (e) { /* no notification layer */ }
        }
        return dropped;
    }

    /**
     * The account holder ended the assist (the sync answer's endedRelayPcIds, K3c 8.3): each
     * relay session is dropped with no request (the server has ended it), emits pc_signed_out
     * reason relay_ended, and an open relay desktop closes with "{displayName} ended the remote
     * assist."; with no desktop open the same line is a toast. Returns the pcIds dropped.
     */
    _relayEnded(endedPcIds = []) {
        const dropped = [];
        for (const pcId of (Array.isArray(endedPcIds) ? endedPcIds : [])) {
            const previous = this.sessions.get(pcId);
            if (!previous) continue;
            this.sessions.delete(pcId);
            dropped.push(pcId);
            const message = relayEndedMessage(previous.displayName);
            const open = this.desktops.has(pcId);
            this._emit('pc_signed_out', { pcId, npcId: previous.npcId ?? null, reason: 'relay_ended', ...this._remoteOf(previous) });
            if (open) {
                this._closeDesktop(pcId, message, 'relay_ended');
            } else {
                try {
                    // The display name is author text: plain text, never markup
                    if (typeof window !== 'undefined') window.gameAlert?.(message, 'info', '', 5000, { plainText: true });
                } catch (e) { /* no notification layer */ }
            }
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
        // A relay session stays a relay: its desktop is only ever fetched with relay=1
        if (s.relay === true) return true;
        Object.assign(s, remoteFields(session));
        return true;
    }

    /**
     * The event fields of a remote session ({ remote: true, footholdId }), or of a relay
     * ({ relay: true, kind }, K3c 8.3, so a mapping can tell the two apart); nothing for a
     * local one.
     */
    _remoteOf(s) {
        if (s?.relay === true) return { relay: true, kind: typeof s.kind === 'string' && s.kind ? s.kind : null };
        return s?.remote === true ? { remote: true, footholdId: s.footholdId ?? null } : {};
    }

    /** A desktop for pcId is open; `close(message, reason)` shuts it. Returns the unregister function. */
    registerDesktop(pcId, close) {
        this.endedUnseen.delete(pcId);
        this.desktops.set(pcId, close);
        return () => { if (this.desktops.get(pcId) === close) this.desktops.delete(pcId); };
    }

    _closeDesktop(pcId, message, reason = null) {
        const close = this.desktops.get(pcId);
        if (!close) {
            if (message) this.endedUnseen.set(pcId, { message, reason });
            return;
        }
        this.desktops.delete(pcId);
        try { close(message, reason); } catch (e) { console.warn('[pc-sessions] closing the desktop failed', e); }
    }

    /**
     * The end message of a session at pcId that ended with no desktop open (the desktop
     * had closed for a reader), once: { message, reason }, or null.
     */
    takeEndedMessage(pcId) {
        const ended = this.endedUnseen.get(pcId) || null;
        this.endedUnseen.delete(pcId);
        return ended;
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
