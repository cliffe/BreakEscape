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
 *   pc_signed_in       { pcId, npcId, username, via }  a sign-in (or the second half of a switch)
 *   pc_signed_out      { pcId, npcId }                 a sign-out, a switch, a 403 from container
 *   pc_signin_failed   { pcId, reason, attemptsLeft }  reason: wrong | not_permitted | locked_out
 *   pc_signin_shown    { pcId, usernames, usernameList } the sign-in screen opened with these tiles
 *   pc_desktop_opened  { pcId, npcId, via, restored }  a desktop loaded for a session; restored is
 *                                                      true for a session kept from before a reload
 *
 * The server holds the real sessions; this list only mirrors them, so a 403 from
 * `container` (no session there, for example after a reset) drops the local copy
 * without a request. The workstation claim (step 9) will sign in through here too.
 *
 * Exposed as window.pcSessions; window.__test.access.sessions() reads list().
 */

export const SIGNED_OUT_MESSAGE = 'Signed out';

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
        const done = () => this._emit('pc_signed_out', { pcId, npcId: s.npcId ?? null });
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

    _replace(pcId, session) {
        const previous = this.sessions.get(pcId);
        if (previous) {
            this.sessions.delete(pcId);
            this._emit('pc_signed_out', { pcId, npcId: previous.npcId ?? null });
        }
        this.sessions.set(pcId, { ...session, restored: false });
        this.signedIn.add(pcId);
        this._emit('pc_signed_in', { pcId, npcId: session.npcId, username: session.username, via: session.via });
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
        this._emit('pc_signed_out', { pcId, npcId: previous.npcId ?? null });
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
        this._emit('pc_signed_out', { pcId, npcId: previous.npcId ?? null });
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
    screenShown(pcId, tiles = []) {
        const usernames = (Array.isArray(tiles) ? tiles : []).map(t => t?.username).filter(Boolean);
        // usernameList: the same as one string, for eventMapping conditions (".includes('x')")
        this._emit('pc_signin_shown', { pcId, usernames, usernameList: usernames.join(',') });
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
