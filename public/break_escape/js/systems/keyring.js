/**
 * The credential keyring's client side (credential keyring plan 8.1, slice K3a).
 *
 * Holds, for the page's life only (nothing here is synced or stored):
 *   - the GET /keyring answers, keyed by "pcId|route", each with its `rev`, so a reopened
 *     screen asks with rev= and usually gets { unchanged: true };
 *   - the set of item ids opened in this page (a "foundIn" file), so an "In file" tag waits
 *     until the file has been read;
 *   - the ids in the page's first successful answer (the page-start prime), which show at once:
 *     after a reload the server keeps no record of a file being read, so an entry already
 *     earned before the reload is not hidden again (an accepted gap, plan 8.1);
 *   - the kinds whose teaching toast has shown.
 *
 * Only a scenario that declares credentials (window.gameScenario.credentialsDeclared) asks the
 * server; elsewhere every call is a no-op and the screens are unchanged.
 *
 * Slice K3b adds Connect from the tray (plan 8.2): `connectEntryFor(itemId)` names the entry a
 * held item proves (by the row's `heldItem`, since an item's own `credential` never reaches the
 * client), the tray menu offers Connect for it, and `connect(el)` runs steps 1 to 8.
 *
 * The find toasts (plan 8.2, part B): the first answer with no screen (the page-start prime, or
 * the first later one when the prime failed) is the baseline. After it, each no-screen answer
 * is diffed against the previous one, and registry entries new since then give one toast
 * (`findToastText`). Captures, assist invites (until K3c) and other kinds stay silent; a password
 * in a file waits until its file is opened here. While a conversation is open (an NPC give) the
 * toast is held until it closes. The asks come from `listen()`: a sign-in once its desktop has
 * opened, a tray change, a plant, implant or Wi-Fi join (network_foothold_gained), and
 * `noteOpened` of a file a waiting entry is found in. Nothing is written to globals or state.
 *
 * No static imports: main.js imports it once (so the opened set exists from page start) and
 * unlock-system.js loads it by dynamic import, so no test harness copy list grows. Connect loads
 * its text by dynamic import.
 */

export const SCREEN_KEYBOARD = 'keyboard';
export const SCREEN_FOOTHOLD = 'foothold';

/** True when this page's scenario declares credentials (the bootstrap's static flag). */
export function credentialsDeclared() {
    return typeof window !== 'undefined' && window.gameScenario?.credentialsDeclared === true;
}

/**
 * The tag kind for an entry (plan 8.5): a captured password is "captured", a registry password
 * (found in a file) is "in_file", any other kind keeps its own name.
 */
export function entryTagKind(entry) {
    if (!entry || typeof entry !== 'object') return null;
    if (entry.kind === 'password') return entry.source === 'capture' ? 'captured' : 'in_file';
    return typeof entry.kind === 'string' ? entry.kind : null;
}

/** The kinds Connect runs for. K3c adds 'assist_invite' here, with its relay route in connectRoute. */
export const CONNECT_KINDS = ['saved_connection'];

/** How long Connect waits for its screen to appear before it gives up watching for the close. */
export const RETURN_TO_OPEN_WAIT_MS = 3000;
export const RETURN_TO_POLL_MS = 250;

/**
 * The route Connect signs in by (plan 8.2 step 8): K4's `from` first, then footholds, then
 * (K3c) the relay. Today only a foothold route is built, so the other two are skipped.
 */
export function connectRoute(entry) {
    const routes = Array.isArray(entry?.routes) ? entry.routes : [];
    // K4: a { from } route goes first here, once pc-sessions can post it
    const foothold = routes.find(r => r && typeof r.foothold === 'string' && r.foothold);
    if (foothold) return { foothold: foothold.foothold };
    // K3c: { relay: true } for an assist_invite goes here
    return null;
}

/** How long a find toast stays up, and how often a held one checks for the conversation's close. */
export const FIND_TOAST_MS = 7000;
export const FIND_HOLD_POLL_MS = 500;

export class Keyring {
    constructor() {
        this.cache = new Map();
        this.opened = new Set();
        this.firstAnswerIds = null;
        this.taught = new Set();
        this._primed = null;
        // The entries of the most recent usable answer, whatever screen asked (Connect's menu)
        this.latest = [];
        // The tray item a Connect is running for, or null (the in-flight guard)
        this.connecting = null;
        this._listening = null;
        this._trayIds = null;
        // The find toasts (part B): the ids of the last no-screen answer that are not waiting
        // (null until the baseline), the files waiting entries are found in, the finds held for
        // an open conversation, and the PCs signed in whose desktop has not opened yet
        this._findIds = null;
        this._waitingFor = new Set();
        this._held = [];
        this._holdTimer = null;
        this._signedInPcs = new Set();
    }

    /** An item opened in this page (container-minigame's file hooks call this). */
    noteOpened(id) {
        if (typeof id !== 'string' || !id) return null;
        this.opened.add(id);
        // A file an entry is found in: ask again (usually `unchanged`), and the entry now shows
        return this._waitingFor.has(id) ? this.refresh() : null;
    }

    hasOpened(id) { return this.opened.has(id); }

    /** True the first time a kind's teaching toast is due in this page, false after. */
    teachOnce(kind) {
        if (!kind || this.taught.has(kind)) return false;
        this.taught.add(kind);
        return true;
    }

    static cacheKey(pcId, { foothold } = {}) {
        return `${pcId || ''}|${foothold ? `foothold:${foothold}` : SCREEN_KEYBOARD}`;
    }

    revFor(key) { return this.cache.get(key)?.rev || null; }

    /**
     * Take one GET /keyring answer for a cache key; answers the entries to draw (the cached
     * ones on { unchanged: true }), or null when the answer is not usable.
     */
    remember(key, answer, { primed = false } = {}) {
        if (!answer || typeof answer !== 'object') return null;
        if (answer.unchanged === true) {
            const hit = this.cache.get(key);
            if (!hit || hit.rev !== answer.rev) return null;
            this.latest = hit.entries;
            return hit.entries;
        }
        if (!Array.isArray(answer.entries)) return null;
        const entries = answer.entries.filter(e => e && typeof e === 'object' && typeof e.id === 'string');
        this.cache.set(key, { rev: typeof answer.rev === 'string' ? answer.rev : null, entries });
        this.latest = entries;
        // Only the page-start prime fixes the reload set; a screen's answer never does (R1 m1)
        if (primed && this.firstAnswerIds === null) this.firstAnswerIds = new Set(entries.map(e => e.id));
        return entries;
    }

    /**
     * GET /keyring for a screen. Resolves to the entries; throws when the request fails, and
     * when the answer is unusable, so the caller shows the "could not be loaded" line.
     */
    async fetch(pcId, { foothold, primed = false } = {}) {
        const api = typeof window !== 'undefined' ? (window.ApiClient || window.APIClient) : null;
        if (!api?.keyring) throw new Error('keyring not available');
        const key = Keyring.cacheKey(pcId, { foothold });
        let entries = this.remember(key, await api.keyring(pcId, { foothold, rev: this.revFor(key) }), { primed });
        // A rev the cache lost (or an odd answer): ask once more without it
        if (!entries) entries = this.remember(key, await api.keyring(pcId, { foothold }), { primed });
        if (!entries) throw new Error('keyring answer unusable');
        if (!pcId && !foothold) this.noteFinds(entries);
        return entries;
    }

    /**
     * The page-start answer (core/game.js calls it once the scenario has loaded): its ids are
     * the ones a reload must not hide again. A failure leaves the next screen's answer to do it.
     */
    prime() {
        if (!credentialsDeclared()) return Promise.resolve(null);
        this.listen();
        if (!this._primed) {
            this._primed = this.fetch(null, { primed: true }).catch(() => {
                // A failed prime is the stricter case: nothing counts as earned before this page
                if (this.firstAnswerIds === null) this.firstAnswerIds = new Set();
                return null;
            });
        }
        return this._primed;
    }

    /** A registry password shows only once its file was opened here, or it was in the first answer. */
    foundVisible(entry) {
        if (!entry || entry.kind !== 'password' || entry.source === 'capture') return true;
        if (this.firstAnswerIds?.has(entry.id)) return true;
        return typeof entry.foundIn === 'string' && this.opened.has(entry.foundIn);
    }

    /**
     * Ask again when the tray's items change (K3b): a taken or dropped .rdp adds or removes its
     * entry, and the tray menu reads `latest`. Idempotent per dispatcher.
     */
    listen() {
        const d = typeof window !== 'undefined' ? window.eventDispatcher : null;
        if (!d || typeof d.on !== 'function' || this._listening === d) return false;
        this._listening = d;
        d.on('inventory_changed', (data) => this.trayChanged(data?.items));
        // A sign-in asks once its desktop has opened (a desktop reopened on a held session does not)
        d.on('pc_signed_in', (data) => { if (data?.pcId) this._signedInPcs.add(data.pcId); });
        d.on('pc_desktop_opened', (data) => { if (data?.pcId && this._signedInPcs.delete(data.pcId)) this.refresh(); });
        // A plant, an implant and a Wi-Fi join each emit this once
        d.on('network_foothold_gained', () => this.refresh());
        d.on('conversation_closed:*', () => this.releaseHeld());
        return true;
    }

    /**
     * The tray's items changed: one GET (usually `unchanged`) when an item was added (an item's
     * `credential` never reaches the client, so any add may be one) or an item the latest answer
     * names as `heldItem` was removed. Other removals (a drunk coffee) ask nothing.
     */
    trayChanged(items) {
        if (!credentialsDeclared()) return null;
        const list = (Array.isArray(items) ? items : [])
            .map(i => i?.scenarioData?.id).filter(id => typeof id === 'string' && id).sort();
        const ids = list.join('|');
        if (ids === this._trayIds) return null;
        const before = this._trayIds === null ? null : new Set(this._trayIds ? this._trayIds.split('|') : []);
        this._trayIds = ids;
        if (before) {
            const now = new Set(list);
            const added = list.some(id => !before.has(id));
            const held = new Set(this.latest.map(e => e?.heldItem).filter(Boolean));
            const removedHeld = [...before].some(id => !now.has(id) && held.has(id));
            if (!added && !removedHeld) return null;
        }
        return this.refresh();
    }

    /** One GET /keyring with no screen, after the pending sync; never throws. */
    async refresh() {
        try { await window.stateSync?.syncConfirmed?.(); } catch (e) { /* ask anyway */ }
        try { return await this.fetch(null); } catch (e) { return null; }
    }

    /** A registry password not yet shown: its file has not been opened here (foundVisible). */
    findWaiting(entry) {
        return entry?.kind === 'password' && entry.source !== 'capture' && !this.foundVisible(entry);
    }

    /**
     * Diff one no-screen answer against the previous one (plan 8.2): the first is the baseline
     * and toasts nothing; after it, entries new since the previous answer give one toast. A
     * waiting entry is left out of the ids, so it counts as new once its file is opened.
     * Answers the new entries that have a find line, for tests.
     */
    noteFinds(entries) {
        const list = Array.isArray(entries) ? entries : [];
        const known = new Set();
        const waitingFor = new Set();
        const fresh = [];
        for (const e of list) {
            if (!e || typeof e.id !== 'string') continue;
            if (this.findWaiting(e)) {
                if (typeof e.foundIn === 'string' && e.foundIn) waitingFor.add(e.foundIn);
                continue;
            }
            known.add(e.id);
            if (this._findIds !== null && !this._findIds.has(e.id) && findKindToasts(e)) fresh.push(e);
        }
        this._findIds = known;
        this._waitingFor = waitingFor;
        if (fresh.length) this.announceFinds(fresh);
        return fresh;
    }

    /** One toast for these finds now, or held while a conversation is open. */
    announceFinds(entries) {
        if (inConversation()) {
            this._held.push(...entries);
            if (!this._holdTimer) {
                this._holdTimer = setInterval(() => { if (!inConversation()) this.releaseHeld(); }, FIND_HOLD_POLL_MS);
            }
            return null;
        }
        return this.showFinds(entries);
    }

    /** The conversation closed: the held finds as one toast. */
    releaseHeld() {
        if (this._holdTimer) { clearInterval(this._holdTimer); this._holdTimer = null; }
        const held = this._held;
        this._held = [];
        return held.length ? this.showFinds(held) : Promise.resolve(null);
    }

    /** gameAlert with plain text (textContent): labels and names are author text. */
    async showFinds(entries) {
        let t;
        try { t = await import('../utils/remote-host-text.js'); } catch (e) { return null; }
        const message = t.findToastText(entries);
        if (!message) return null;
        // No title and `brief`, so the phone's two-line clamp never cuts a grouped toast
        try { window.gameAlert?.(message, 'info', '', FIND_TOAST_MS, { plainText: true, brief: true }); } catch (e) { /* no notification layer */ }
        return message;
    }

    /** The entry a held tray item proves for Connect, from the latest answer, or null. */
    connectEntryFor(itemId) {
        if (typeof itemId !== 'string' || !itemId) return null;
        return this.latest.find(e => e.heldItem === itemId && CONNECT_KINDS.includes(e.kind)) || null;
    }

    /**
     * Connect from the tray (plan 8.2). Flushes the pending sync, asks GET /keyring, then:
     *   1. the GET fails: "Connect could not reach the game server. Try again.";
     *   2. no entry for the item: "{label} no longer works." with the tray item's name;
     *   3. ended (an assist invite, K3c): "{displayName} ended the remote assist.";
     *   4. targetOff: notRespondingMessage(host);
     *   5. sessionHeld: the desktop by the session's route;
     *   6. remoteBlocked: the remote-off sentence;
     *   7. no route: "{host} can't be reached from here. You need a way onto its network.";
     *   8. sign in by the route, then the desktop and the teaching toast once per kind; the
     *      403/422 races answer as 4, 6 and 7; a policy or lockout refusal opens the remote
     *      sign-in screen with the account and the credential chosen; not permitted is a toast.
     * No network-view trip starts. `returnTo({ reason })` runs once the screens it opened have
     * all closed. A second call while one runs does nothing. Resolves to { outcome } for tests.
     */
    async connect(el, { returnTo = null, text = null } = {}) {
        const data = el?.scenarioData;
        const itemId = data?.id;
        if (!itemId) return { outcome: 'none' };
        if (this.connecting) return { outcome: 'busy' };
        this.connecting = itemId;
        try {
            const t = text || await import('../utils/remote-host-text.js');
            return await this._connect(data, t, typeof returnTo === 'function' ? returnTo : null);
        } finally {
            this.connecting = null;
        }
    }

    async _connect(data, t, returnTo) {
        const w = window;
        const title = data.name || 'Connect';
        const toast = (msg, outcome, type = 'error') => {
            try { w.gameAlert?.(msg, type, title, 4000, { plainText: true }); } catch (e) { /* no notification layer */ }
            return { outcome, message: msg };
        };
        const opened = (outcome, extra = {}) => {
            if (returnTo) this.watchScreensClose(returnTo);
            return { outcome, ...extra };
        };

        try { await w.stateSync?.syncConfirmed?.(); } catch (e) { /* ask anyway */ }
        let entries;
        try { entries = await this.fetch(null); } catch (e) {
            return toast(t.CONNECT_FAILED_TEXT, 'fetch_failed');
        }
        const entry = entries.find(e => e.heldItem === data.id && CONNECT_KINDS.includes(e.kind));
        if (!entry) return toast(t.noLongerWorksMessage(data.name), 'missing');
        const host = entry.host || entry.connectsTo;
        const pcId = entry.connectsTo;
        const displayName = entry.account?.displayName || entry.account?.username || null;
        if (entry.ended === true) return toast(t.endedAssistMessage(displayName), 'ended');
        if (entry.targetOff === true) return toast(t.notRespondingMessage(host), 'target_off');
        if (entry.sessionHeld === true) {
            const held = w.pcSessions?.get?.(pcId);
            const foothold = held?.footholdId || connectRoute(entry)?.foothold || null;
            w.openRemoteDesktop?.(pcId, foothold);
            return opened('session_held', { foothold });
        }
        if (entry.remoteBlocked === true) return toast(t.remoteOffMessage(host), 'remote_blocked');
        const route = connectRoute(entry);
        if (!route) return toast(t.trayUnreachableMessage(host), 'no_route');

        const result = await w.pcSessions.signInWithCredential(pcId, entry.id, route);
        if (result?.ok) {
            // signInWithCredential has already handed any endedPcIds to linkDropped (route_ended)
            w.openRemoteDesktop?.(pcId, route.foothold);
            if (this.teachOnce(entry.kind)) {
                const line = t.teachLine(entry.kind, { displayName });
                if (line) { try { w.gameAlert?.(line, 'info', '', 8000, { plainText: true }); } catch (e) { /* none */ } }
            }
            return opened('signed_in', { route });
        }
        if (result?.error) {
            if (result.status === 403 && result.serverReason === 'not_responding') return toast(t.notRespondingMessage(host), 'target_off');
            if (result.status === 403) return toast(t.trayUnreachableMessage(host), 'no_route');
            return toast(t.CONNECT_FAILED_TEXT, 'login_failed');
        }
        const reason = result?.reason;
        if (reason === 'remote_blocked') return toast(t.remoteOffMessage(host), 'remote_blocked');
        if (reason === 'not_permitted') return toast(t.remoteNotPermittedMessage(host), 'not_permitted');
        if (entry.kind === 'saved_connection' && (reason === 'kind_refused' || reason === 'locked_out')) {
            // The target's remote sign-in screen, the account and the credential chosen, the refusal shown
            w.openCredentialSignIn?.({
                pcId, host, footholdId: route.foothold, username: entry.account?.username || null,
                refusal: {
                    credentialId: entry.id, reason, kind: result.kind || entry.kind,
                    attemptsLeft: result.attemptsLeft ?? null, message: result.message || null
                }
            });
            return opened('signin_screen', { reason });
        }
        // K3c: an assist invite's kind_refused or ended maps to 8.5's toast here
        const line = t.credentialRefusalLine(reason, { host, label: data.name, displayName, kind: result?.kind || entry.kind });
        return toast(line || t.CONNECT_FAILED_TEXT, reason || 'refused');
    }

    /**
     * returnTo for Connect (plan 8.2): no trip carries it, so watch the minigame layer and call
     * returnTo({ reason: 'closed' }) once the screens Connect opened have all closed (or never
     * opened within RETURN_TO_OPEN_WAIT_MS).
     */
    watchScreensClose(returnTo, { every = RETURN_TO_POLL_MS, openWait = RETURN_TO_OPEN_WAIT_MS } = {}) {
        const w = window;
        const started = Date.now();
        let seen = false;
        const timer = setInterval(() => {
            const open = !!w.MinigameFramework?.currentMinigame;
            if (open) { seen = true; return; }
            if (!seen && Date.now() - started < openWait) return;
            clearInterval(timer);
            try { returnTo({ reason: 'closed' }); } catch (e) { console.warn('[keyring] returnTo threw', e); }
        }, every);
        return timer;
    }

    /**
     * The entries a sign-in screen may show (plan 8.1, "only usable kinds show"):
     *   keyboard: passwords only;
     *   foothold: passwords, plus a saved_connection for this PC (forThisPc).
     * An assist_invite never shows on a sign-in screen (Connect uses it). An entry with no
     * account username is dropped (tiles match by username). A refused saved connection stays
     * (accepted false): the screen greys it.
     */
    screenEntries(entries, { pcId = null, screen = SCREEN_KEYBOARD } = {}) {
        return (Array.isArray(entries) ? entries : []).filter(e => {
            if (!e || typeof e !== 'object') return false;
            if (!e.account || typeof e.account.username !== 'string' || !e.account.username) return false;
            if (e.kind === 'password') return this.foundVisible(e);
            if (screen !== SCREEN_FOOTHOLD) return false;
            if (e.kind === 'saved_connection') {
                if (e.ended === true) return false;
                return e.forThisPc === true;
            }
            return false;
        });
    }
}

/** The kinds with a find toast today (K3c adds 'assist_invite'); a capture is always silent. */
export const FIND_KINDS = ['saved_connection', 'password'];
function findKindToasts(entry) {
    return entry.source !== 'capture' && FIND_KINDS.includes(entry.kind);
}

/** An NPC conversation is open (person or phone chat set this while the ink runs). */
function inConversation() {
    return typeof window !== 'undefined' && !!window.currentConversationNPCId;
}

let shared = null;

/** The page's one keyring (window.keyring), made on first use. */
export function getKeyring() {
    if (typeof window !== 'undefined' && window.keyring instanceof Keyring) return window.keyring;
    if (!shared) shared = new Keyring();
    if (typeof window !== 'undefined') window.keyring = shared;
    return shared;
}

getKeyring();
