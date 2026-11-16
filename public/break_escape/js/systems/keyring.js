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
 * No imports: main.js imports it once (so the opened set exists from page start) and
 * unlock-system.js loads it by dynamic import, so no test harness copy list grows.
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

export class Keyring {
    constructor() {
        this.cache = new Map();
        this.opened = new Set();
        this.firstAnswerIds = null;
        this.taught = new Set();
        this._primed = null;
    }

    /** An item opened in this page (container-minigame's file hooks call this). */
    noteOpened(id) {
        if (typeof id === 'string' && id) this.opened.add(id);
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
    remember(key, answer) {
        if (!answer || typeof answer !== 'object') return null;
        if (answer.unchanged === true) {
            const hit = this.cache.get(key);
            return hit && hit.rev === answer.rev ? hit.entries : null;
        }
        if (!Array.isArray(answer.entries)) return null;
        const entries = answer.entries.filter(e => e && typeof e === 'object' && typeof e.id === 'string');
        this.cache.set(key, { rev: typeof answer.rev === 'string' ? answer.rev : null, entries });
        if (this.firstAnswerIds === null) this.firstAnswerIds = new Set(entries.map(e => e.id));
        return entries;
    }

    /**
     * GET /keyring for a screen. Resolves to the entries; throws when the request fails, and
     * when the answer is unusable, so the caller shows the "could not be loaded" line.
     */
    async fetch(pcId, { foothold } = {}) {
        const api = typeof window !== 'undefined' ? (window.ApiClient || window.APIClient) : null;
        if (!api?.keyring) throw new Error('keyring not available');
        const key = Keyring.cacheKey(pcId, { foothold });
        let entries = this.remember(key, await api.keyring(pcId, { foothold, rev: this.revFor(key) }));
        // A rev the cache lost (or an odd answer): ask once more without it
        if (!entries) entries = this.remember(key, await api.keyring(pcId, { foothold }));
        if (!entries) throw new Error('keyring answer unusable');
        return entries;
    }

    /**
     * The page-start answer (core/game.js calls it once the scenario has loaded): its ids are
     * the ones a reload must not hide again. A failure leaves the next screen's answer to do it.
     */
    prime() {
        if (!credentialsDeclared()) return Promise.resolve(null);
        if (!this._primed) {
            this._primed = this.fetch(null).catch(() => null);
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
                return e.forThisPc === true || (pcId && e.connectsTo === pcId);
            }
            return false;
        });
    }
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
