/**
 * Friendface phone items (user decision q35; docs/achitechture/FRIENDFACE_PHONE_ITEM_PLAN.md).
 *
 * An item of type `phone_friendface` opens the osint browser on its social site:
 * - `phoneOf: <npcId>` is that NPC's phone: it opens at the NPC's profile;
 * - no `phoneOf` is the player's own phone: it opens the site's home.
 * The browser keeps its own title (the osint block's), as at any terminal.
 * Opening asks the server first (POST /friendface_phone). The server refuses a phone the player
 * does not hold. Its answer also carries the server's feedPosts for that phone, which the client
 * does not merge: the feed already holds every revealed post (bootstrap plus each live answer), and
 * a restore racing a /feed_post in flight would list that post silently, so its npc_posted, blip
 * and task mappings would never fire (review R1 M2). An open never reveals a post.
 *
 * Holding a phone whose NPC owner is known also makes that NPC "phone": false on the client (its
 * live record), as the server already treats it (plan section 3).
 *
 * The blip (plan section 5): `npc_posted:<npcId>` fires only for a post a /feed_post answer
 * revealed (social-feed.js; never on restore, so never on reload). For each held phone it
 * concerns (the player's own: every post; an NPC's: that NPC's) the unread count goes up and is
 * drawn as the tray badge; phone_vibrate plays once. While a person-chat or a full-screen minigame
 * is open (the bark hold), the sound waits and plays once when the hold ends. Opening a phone
 * clears its count. Counts are not saved.
 */

export const PHONE_TYPE = 'phone_friendface';
const OWN = '@own';
export const HOLD_POLL_MS = 300;

const isStr = (v) => typeof v === 'string' && v.length > 0;

/** The owner key of a phone item: its phoneOf NPC id, or OWN for the player's own phone. */
export function phoneKey(data) {
    return isStr(data?.phoneOf) ? data.phoneOf : OWN;
}

export function isFriendfacePhone(data) {
    return !!data && typeof data === 'object' && data.type === PHONE_TYPE;
}

export class FriendfacePhones {
    /**
     * deps: { items() -> [scenarioData], held() -> bool (the bark hold), play(), refresh(),
     *         every(fn, ms) -> handle, stop(handle), setNoPhone(npcId) }
     */
    constructor(deps = {}) {
        this.deps = deps;
        this.unread = new Map();     // owner key -> count
        this.pendingSound = false;
        this.timer = null;
        this.plays = 0;
    }

    _held() {
        return (this.deps.items?.() || []).filter(isFriendfacePhone);
    }

    /** The unread count drawn on a phone's slot. */
    badgeFor(data) {
        return isFriendfacePhone(data) ? (this.unread.get(phoneKey(data)) || 0) : 0;
    }

    /** A live post revealed by the server: count it on each held phone it concerns, blip once. */
    onPosted(data) {
        const npcId = data?.npcId;
        if (!isStr(npcId)) return false;
        let hit = false;
        for (const phone of this._held()) {
            const key = phoneKey(phone);
            if (key !== OWN && key !== npcId) continue;
            this.unread.set(key, (this.unread.get(key) || 0) + 1);
            hit = true;
        }
        if (!hit) return false;
        this.deps.refresh?.();
        this._blip();
        return true;
    }

    _blip() {
        if (this.deps.held?.()) {
            this.pendingSound = true;
            if (this.timer === null && this.deps.every) {
                this.timer = this.deps.every(() => this.releaseHeld(), HOLD_POLL_MS);
            }
            return;
        }
        this._play();
    }

    /** Called on the hold poll: plays one waiting sound once nothing holds it. */
    releaseHeld() {
        if (this.deps.held?.()) return false;
        if (this.timer !== null) { this.deps.stop?.(this.timer); this.timer = null; }
        if (!this.pendingSound) return false;
        this.pendingSound = false;
        this._play();
        return true;
    }

    _play() {
        this.plays++;
        try { this.deps.play?.(); } catch (e) { /* no sound is not an error */ }
    }

    /** Opening a phone clears its count. */
    clear(data) {
        this.unread.delete(phoneKey(data));
        this.deps.refresh?.();
    }

    /** Every held NPC phone makes its NPC phone-less on the client (plan section 3). */
    syncOwners() {
        for (const phone of this._held()) {
            if (isStr(phone.phoneOf)) this.deps.setNoPhone?.(phone.phoneOf);
        }
    }
}

/** The osint location a server answer opens: '<site>.<person>' for an NPC's phone, else '<site>'. */
export function startKey(body) {
    if (!isStr(body?.site)) return null;
    return isStr(body.person) ? `${body.site}.${body.person}` : body.site;
}

/**
 * Open a phone: ask the server, clear the count, open the browser at the server's site and profile.
 * deps: { request(npcId|null) -> Promise<body>, clear(data), launch(params), refused(message) }
 * Returns the server's body, or null when refused.
 */
export async function openFriendfacePhone(data, deps) {
    if (!isFriendfacePhone(data)) return null;
    const owner = isStr(data.phoneOf) ? data.phoneOf : null;
    let body;
    try {
        body = await deps.request(owner);
    } catch (err) {
        deps.refused?.(err?.status === 403 ? 'You do not have that phone.' : 'The phone will not open.');
        return null;
    }
    if (!body || !isStr(body.site)) { deps.refused?.('The phone will not open.'); return null; }
    deps.clear?.(data);
    deps.launch?.({ siteIds: [body.site], start: startKey(body) });
    return body;
}

/** The bark hold: a person-chat or a full-screen minigame is open (npc-barks.js _shouldDefer). */
function barkHold(w) {
    if (w.currentConversationMinigameType === 'person-chat') return true;
    return !!w.MinigameFramework?.holdsBarks?.();
}

/**
 * Install once: window.friendfacePhones, the npc_posted and inventory listeners, the tray badge
 * rule and the window.startFriendfacePhone starter (minigame-registry.js 'phone_friendface').
 */
export function installFriendfacePhones(api, { registerTrayRule, refreshTray, socialOverlayParams } = {}) {
    const w = typeof window !== 'undefined' ? window : null;
    if (!w) return null;
    if (w.friendfacePhones) return w.friendfacePhones;
    const phones = new FriendfacePhones({
        items: () => (Array.isArray(w.inventory?.items) ? w.inventory.items.map((i) => i?.scenarioData).filter(Boolean) : []),
        held: () => barkHold(w),
        play: () => w.soundManager?.play?.('phone_vibrate'),
        refresh: () => refreshTray?.(),
        every: (fn, ms) => setInterval(fn, ms),
        stop: (h) => clearInterval(h),
        setNoPhone(npcId) {
            const rec = w.npcManager?.getNPC?.(npcId) || w.npcManager?.npcs?.get?.(npcId);
            if (rec && rec.phone !== false) rec.phone = false;
        }
    });
    w.friendfacePhones = phones;
    w.eventDispatcher?.on?.('npc_posted:*', (data) => phones.onPosted(data));
    w.eventDispatcher?.on?.('inventory_changed', () => phones.syncOwners());
    if (typeof registerTrayRule === 'function') {
        registerTrayRule((item) => (isFriendfacePhone(item?.scenarioData) ? { badge: phones.badgeFor(item.scenarioData) } : null));
    }
    w.startFriendfacePhone = (obj) => openFriendfacePhone(obj?.scenarioData || obj, {
        request: (npcId) => api.post('/friendface_phone', { npc_id: npcId }),
        clear: (data) => phones.clear(data),
        launch(params) {
            const mf = w.MinigameFramework;
            if (!mf) return;
            if (!mf.mainGameScene && w.game) mf.init(w.game);
            const p = { ...params };
            mf.startMinigame('osint-browser', null, typeof socialOverlayParams === 'function' ? socialOverlayParams(p) : p);
        },
        refused: (message) => w.gameAlert?.(message, 'warning', 'Phone', 3000)
    });
    phones.syncOwners();
    return phones;
}

export default FriendfacePhones;
