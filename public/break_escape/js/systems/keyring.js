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
 * (`findToastText`). Captures and other kinds stay silent; a password
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

/** The kinds Connect runs for: a saved connection by a foothold, an assist invite (K3c) by the relay. */
export const CONNECT_KINDS = ['saved_connection', 'assist_invite'];

/** How long Connect waits for its screen to appear before it gives up watching for the close. */
export const RETURN_TO_OPEN_WAIT_MS = 3000;
export const RETURN_TO_POLL_MS = 250;

/**
 * The route Connect signs in by (plan 8.2 step 8): K4's `from` first, then footholds, then
 * the relay (K3c, an assist invite only). K4's `from` is not built yet, so it is skipped.
 */
export function connectRoute(entry) {
    const routes = Array.isArray(entry?.routes) ? entry.routes : [];
    // K4: a { from } route goes first here, once pc-sessions can post it
    const foothold = routes.find(r => r && typeof r.foothold === 'string' && r.foothold);
    if (foothold) return { foothold: foothold.foothold };
    if (entry.kind === 'assist_invite' && routes.some(r => r && r.relay === true)) return { relay: true };
    return null;
}

/** How long a find toast stays up, and how often a held one checks for the conversation's close. */
export const FIND_TOAST_MS = 7000;
export const FIND_HOLD_POLL_MS = 500;
/** A failed page-start prime is tried again this many times, this far apart (R1 m3). */
export const PRIME_RETRIES = 3;
export const PRIME_RETRY_MS = 5000;
// A background ask that has not answered by then is given up on, so the chain moves on (R2 t1)
export const ASK_TIMEOUT_MS = 15000;

/** Waits for `promise` until `deadline` (ms since the epoch; 0 waits as long as it takes). */
function beforeDeadline(promise, deadline) {
    if (!(deadline > 0)) return Promise.resolve(promise);
    let timer;
    const left = Math.max(0, deadline - Date.now());
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timed out')), left); });
    return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timer));
}

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
        // Every find id this page has seen past the baseline or toasted, with the tray item it
        // is held by (null for none). An id leaves only once it is missing from an answer AND its
        // tray item is out of the tray, so an answer that briefly lacks an entry (a reconnect,
        // a sync race) never toasts it again, while dropping and retaking a file still does.
        this._announced = new Map();
        // Background asks: each is numbered when sent, and an answer older than one already
        // applied is dropped (R1 m1). `_queued` is the ask not yet sent, which later triggers
        // join; `_running` is the chain, so asks go out one at a time.
        this._askSeq = 0;
        this._appliedSeq = 0;
        this._queued = null;
        this._running = null;
        this.primeRetries = PRIME_RETRIES;
        this.primeRetryMs = PRIME_RETRY_MS;
        this.askTimeoutMs = ASK_TIMEOUT_MS;
        this._waitingFor = new Set();
        this._held = [];
        this._holdTimer = null;
        this._signedInPcs = new Set();
        // The prompt-end trigger (8.3): armed while a relay session is held, else null
        this._relaySync = null;
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
    async fetch(pcId, { foothold, primed = false, timeoutMs = 0, deadline = 0 } = {}) {
        const api = typeof window !== 'undefined' ? (window.ApiClient || window.APIClient) : null;
        if (!api?.keyring) throw new Error('keyring not available');
        const key = Keyring.cacheKey(pcId, { foothold });
        const background = !pcId && !foothold;
        const seq = background ? ++this._askSeq : 0;
        // An answer to an older background ask than one already applied is dropped whole
        const stale = () => background && seq < this._appliedSeq;
        // A dropped page-start answer is still the page-start state: the reload set comes from it (R2 m1b)
        const noteDropped = (answer) => {
            if (!primed || this.firstAnswerIds !== null || !Array.isArray(answer?.entries)) return;
            this.firstAnswerIds = new Set(answer.entries.filter(e => e && typeof e.id === 'string').map(e => e.id));
        };
        // One deadline for the whole fetch, the no-rev retry included (R3 t2): a caller's
        // `deadline` (refresh's, which also covers the sync PUT) or now plus `timeoutMs`
        const until = deadline > 0 ? deadline : (timeoutMs > 0 ? Date.now() + timeoutMs : 0);
        const ask = (opts) => {
            if (!(until > 0)) return api.keyring(pcId, opts);
            const left = until - Date.now();
            if (left <= 0) return Promise.reject(new Error('keyring ask timed out'));
            const ctl = typeof AbortController === 'function' ? new AbortController() : null;
            let timer;
            const timeout = new Promise((_, reject) => {
                timer = setTimeout(() => { try { ctl?.abort(); } catch (e) { /* none */ } reject(new Error('keyring ask timed out')); }, left);
            });
            return Promise.race([api.keyring(pcId, ctl ? { ...opts, signal: ctl.signal } : opts), timeout])
                .finally(() => clearTimeout(timer));
        };
        const first = await ask({ foothold, rev: this.revFor(key) });
        if (stale()) { noteDropped(first); return this.latest; }
        let entries = this.remember(key, first, { primed });
        // A rev the cache lost (or an odd answer): ask once more without it
        if (!entries) {
            const again = await ask({ foothold });
            if (stale()) { noteDropped(again); return this.latest; }
            entries = this.remember(key, again, { primed });
        }
        if (!entries) throw new Error('keyring answer unusable');
        if (background) {
            this._appliedSeq = seq;
            this.noteFinds(entries);
        }
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
                this.retryPrime();
                return null;
            });
        }
        return this._primed;
    }

    /**
     * Try the baseline GET again on a short timer, so it is normally in place before the first
     * real find (R1 m3). Stops at the first answer (the prime's or any trigger's) or after
     * `primeRetries` tries. If none lands, the next answer is the baseline, as before.
     */
    retryPrime(left = this.primeRetries) {
        if (left <= 0 || this._findIds !== null) return null;
        this._retryTimer = setTimeout(async () => {
            this._retryTimer = null;
            if (this._findIds !== null) return;
            try { await this.fetch(null); } catch (e) { this.retryPrime(left - 1); }
        }, this.primeRetryMs);
        return this._retryTimer;
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
        d.on('pc_signed_in', (data) => {
            if (data?.pcId) this._signedInPcs.add(data.pcId);
            if (data?.relay === true) this.armRelaySync();
        });
        d.on('pc_signed_out', () => this.relaySyncCheck());
        d.on('pc_desktop_opened', (data) => { if (data?.pcId && this._signedInPcs.delete(data.pcId)) this.refresh(); });
        // A plant, an implant and a Wi-Fi join each emit this once
        d.on('network_foothold_gained', () => this.refresh());
        d.on('conversation_closed:*', () => this.releaseHeld());
        return true;
    }

    /**
     * The prompt-end trigger (plan 8.3): while a relay session is held, any global change asks
     * stateSync.sync() at once, so an end global (the holder ending the assist) reaches the
     * server within a second or so, not at the next 30 s sync. The answer's endedRelayPcIds
     * then closes the relay desktop (pc-sessions.js). Idempotent; it disarms once no relay
     * session is held (a sign-out, or the first change after the last relay has gone).
     */
    armRelaySync() {
        const d = typeof window !== 'undefined' ? window.eventDispatcher : null;
        if (!d || typeof d.on !== 'function') return false;
        if (this._relaySync?.dispatcher === d) return true;
        this.disarmRelaySync();
        const fn = (data) => {
            if (!this.relaySyncCheck()) return;
            if (data && 'oldValue' in data && data.value === data.oldValue) return;
            try { window.stateSync?.sync?.(); } catch (e) { /* the 30 s sync still runs */ }
        };
        d.on('global_variable_changed:*', fn);
        this._relaySync = { dispatcher: d, fn };
        return true;
    }

    disarmRelaySync() {
        const r = this._relaySync;
        if (!r) return;
        this._relaySync = null;
        try { r.dispatcher.off?.('global_variable_changed:*', r.fn); } catch (e) { /* gone */ }
    }

    /** True while a relay session is held; disarms the trigger once none is. */
    relaySyncCheck() {
        const held = typeof window !== 'undefined' && window.pcSessions?.hasRelay?.() === true;
        if (!held) this.disarmRelaySync();
        return held;
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
            // The entry goes with its item: forget it now, so a drop and a quick retake before the
            // answer returns still toasts (K3c R1 m1). The answer-side check is the backstop.
            for (const [id, item] of this._announced) if (item && before.has(item) && !now.has(item)) this._announced.delete(id);
            const added = list.some(id => !before.has(id));
            const held = new Set(this.latest.map(e => e?.heldItem).filter(Boolean));
            const removedHeld = [...before].some(id => !now.has(id) && held.has(id));
            if (!added && !removedHeld) return null;
        }
        return this.refresh();
    }

    /** One GET /keyring with no screen, after the pending sync; never throws. */
    refresh() {
        // Triggers in the same tick, before the request is sent, share it (R1 m1)
        if (this._queued) return this._queued;
        const after = this._running || Promise.resolve();
        const ask = after.then(async () => {
            // First, so a trigger that arrives during the sync PUT builds a later ask that carries its change (R2 m1a)
            this._queued = null;
            // One cap for the sync PUT and the GET together (R3 t1): a PUT that never answers
            // cannot hold the chain, and the GET gets only what the PUT left of it
            const deadline = this.askTimeoutMs > 0 ? Date.now() + this.askTimeoutMs : 0;
            try { await beforeDeadline(window.stateSync?.syncConfirmed?.(), deadline); } catch (e) { /* ask anyway */ }
            try { return await this.fetch(null, { deadline }); } catch (e) { return null; }
        });
        this._queued = ask;
        this._running = ask;
        return ask;
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
     * The capture filter here (findKindToasts) and in findLine (remote-host-text.js) is a double
     * guard on purpose: either alone keeps a capture silent.
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
            if (this._findIds !== null && !this._announced.has(e.id) && findKindToasts(e)) fresh.push(e);
            // Keep the known tray item when a later answer omits it (K3c R1 m2). A find with no
            // tray item (a non-held kind) is never forgotten: it toasts once per page.
            this._announced.set(e.id, (typeof e.heldItem === 'string' && e.heldItem ? e.heldItem : null) || this._announced.get(e.id) || null);
        }
        // Forget an id only when its tray item has left the tray (an unknown tray keeps it)
        const tray = this._trayIds === null ? null : new Set(this._trayIds ? this._trayIds.split('|') : []);
        for (const [id, item] of this._announced) {
            if (!known.has(id) && item && tray && !tray.has(item)) this._announced.delete(id);
        }
        this._findIds = known;
        this._waitingFor = waitingFor;
        if (fresh.length) this.announceFinds(fresh);
        return fresh;
    }

    /** One toast for these finds now, or held while a conversation is open. */
    announceFinds(entries) {
        if (inConversation()) {
            // One held line per id, however many answers named it
            const heldIds = new Set(this._held.map(e => e.id));
            for (const e of entries) if (!heldIds.has(e.id)) { heldIds.add(e.id); this._held.push(e); }
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
        // A held find is dropped only once forgotten (its tray item left the tray); an answer that
        // briefly lacks it keeps it (K3c R1 M1). With no tray change seen yet (_trayIds null) no
        // client drop can have happened, so every held find shows (part A R2 m1). A find with no
        // heldItem is never forgotten, so it shows even if the latest answer dropped it (a
        // password is knowledge and is not revoked).
        const held = this._trayIds !== null ? this._held.filter(e => this._announced.has(e.id)) : this._held;
        this._held = [];
        return held.length ? this.showFinds(held) : Promise.resolve(null);
    }

    /** gameAlert with plain text (textContent): labels and names are author text. */
    async showFinds(entries) {
        let t;
        try { t = await import('../utils/remote-host-text.js'); } catch (e) { return null; }
        const message = t.findToastText(entries);
        if (!message) return null;
        // No title and `whole` (clamp lift only), so a grouped toast is never cut on a phone
        try { window.gameAlert?.(message, 'info', '', FIND_TOAST_MS, { plainText: true, whole: true }); } catch (e) { /* no notification layer */ }
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
            if (held?.relay === true || (!held && connectRoute(entry)?.relay === true)) {
                // Re-entry to a relay session is by Connect only (8.3)
                w.openRelayDesktop?.(pcId);
                if (held?.relay === true) this.armRelaySync();
                return opened('session_held', { relay: true });
            }
            const foothold = held?.footholdId || connectRoute(entry)?.foothold || null;
            w.openRemoteDesktop?.(pcId, foothold);
            return opened('session_held', { foothold });
        }
        if (entry.remoteBlocked === true) return toast(t.remoteOffMessage(host), 'remote_blocked');
        const route = connectRoute(entry);
        if (!route) return toast(t.trayUnreachableMessage(host), 'no_route');

        if (typeof w.pcSessions?.signInWithCredential !== 'function') return toast(t.CONNECT_FAILED_TEXT, 'login_failed');
        const result = await w.pcSessions.signInWithCredential(pcId, entry.id, route);
        if (result?.ok) {
            // signInWithCredential has already handed any endedPcIds to linkDropped (route_ended)
            if (route.relay === true) {
                this.armRelaySync();
                w.openRelayDesktop?.(pcId);
            } else {
                w.openRemoteDesktop?.(pcId, route.foothold);
            }
            if (this.teachOnce(entry.kind)) {
                const line = t.teachLine(entry.kind, { displayName });
                if (line) { try { w.gameAlert?.(line, 'info', '', 8000, { plainText: true, whole: true }); } catch (e) { /* none */ } }
            }
            return opened('signed_in', { route });
        }
        if (result?.error) {
            if (result.status === 403) {
                // POST /login 403 reasons: 'not_responding' (target off), 'off' (switched off),
                // 'unreachable' or none (the route does not reach it). Anything else is not a
                // network problem, so it gets the Connect failure line (R1 m4).
                const why = result.serverReason;
                if (why === 'not_responding' || why === 'off') return toast(t.notRespondingMessage(host), 'target_off');
                // A reason-less 403 reads as unreachable only when it says so; the Pundit
                // { error: 'Not authorized' } answer is not a network problem (R2 t2)
                if (why === 'unreachable' || (!why && /not reachable/i.test(String(result.message || '')))) return toast(t.trayUnreachableMessage(host), 'no_route');
            }
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
        // An assist invite's kind_refused ("{host} does not allow remote assistance.") and ended
        // ("{displayName} ended the remote assist.") are 8.5's toasts here; there is no relay screen
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

/** The kinds with a find toast; a capture is always silent. */
export const FIND_KINDS = ['saved_connection', 'password', 'assist_invite'];
// The capture filter below is paired with findLine's in remote-host-text.js (a double guard).
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
