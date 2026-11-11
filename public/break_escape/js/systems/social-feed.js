/**
 * Social media feeds in the browser (ACCESS_MODEL_SLICE_9_2_PLAN.md 8.3, sub-slice C).
 *
 * A room NPC's feed never ships. After each met social media use (npc_used with need
 * social_media and met true, at a PC or a kiosk; npc_used_phone on the phone) this module asks
 * the server for the NPC's next post (POST /feed_post). The answer is the post with its fact
 * entry, or nothing; `done` says the feed has run out, and nothing more is asked for that NPC.
 *
 * - Revealed posts are kept by NPC, from the route's answers and, on a load, from the
 *   scenario's `feedPosts` (restore, called before the browser can open).
 * - A post's fact entry is merged into the live gameScenario.social.intelFacts before the post is
 *   listed, so grantFact, the intel board and the evidence note read it as any other fact.
 * - npc_posted:<npcId> { npcId, postId, index, site, person } fires for a live post; an open osint
 *   browser re-renders on it.
 * - A toast "<name> posted on <site name>" shows when the player has opened that site before
 *   (se_osint_state.visited), unless social.osint.postToasts is false. Plain text.
 *
 * Every post field is author text: it is kept as a string and only ever rendered as text
 * (the browser's h() helper sets textContent; the toast uses plainText).
 */

const OSINT_STATE_KEY = 'se_osint_state';
const POST_FIELDS = ['id', 'text', 'fact', 'date', 'note'];

const isStr = (v) => typeof v === 'string' && v.length > 0;

/** A post block as the browser renders it: string fields only, an id required; else null. */
export function cleanPost(raw) {
    if (!raw || typeof raw !== 'object' || !isStr(raw.id)) return null;
    const out = {};
    for (const k of POST_FIELDS) if (typeof raw[k] === 'string') out[k] = raw[k];
    return out;
}

/**
 * Plain text for the notebook (as npc-workarounds.js escapeNoteText, sub-slice H R1 M1): the notes
 * page renders a markdown subset after the dash display, so each of its escapable characters gets
 * a backslash and the page shows a feed fact's text exactly as written. HTML needs nothing: the
 * renderer escapes it first. Kept here rather than imported, so the test harness copies of this
 * module need no new file; social-feed.test.mjs checks it against the real renderer.
 */
const NOTE_ESCAPABLE = /[\\|*`#_-]/g;
export function escapeNoteText(text) {
    return String(text).replace(NOTE_ESCAPABLE, (ch) => `\\${ch}`);
}

/** A fact entry with string fields only (text, label, subject) and a provides list of strings. */
export function cleanFact(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const out = {};
    for (const [k, v] of Object.entries(raw)) {
        if (typeof v === 'string') out[k] = v;
        else if (Array.isArray(v) && v.every((x) => typeof x === 'string')) out[k] = [...v];
    }
    return out;
}

export class SocialFeed {
    /**
     * deps: { send(npcId) -> Promise<body>, hasFeed(npcId), mergeFact(id, entry), emit(name, data),
     *         toast(message, title), siteVisited(siteId), toastsOn(), npcName(npcId), siteName(siteId) }
     */
    constructor(deps = {}) {
        this.deps = deps;
        this.posts = new Map();      // npcId -> [{ index, post, site, person }], oldest first
        this.done = new Set();
        this.inFlight = new Set();
        this.requests = 0;
    }

    /** A met social media use by `npcId`: ask for its next post, once at a time, never after done. */
    onUse(npcId) {
        if (!isStr(npcId) || this.done.has(npcId) || this.inFlight.has(npcId)) return null;
        if (!this.deps.hasFeed?.(npcId)) return null;
        this.inFlight.add(npcId);
        this.requests++;
        return Promise.resolve()
            .then(() => this.deps.send(npcId))
            .then((body) => this.apply(npcId, body), (err) => {
                // 403: the server does not know the NPC (yet); a later use asks again
                if (err?.status !== 403) console.warn('[social-feed] feed_post failed', err?.message || err);
            })
            .finally(() => this.inFlight.delete(npcId));
    }

    /** One /feed_post answer. */
    apply(npcId, body) {
        if (!body || typeof body !== 'object') return false;
        if (body.done === true) this.done.add(npcId);
        if (!body.post) return false;
        return this._add(npcId, body, { live: true });
    }

    /** GET /scenario's feedPosts: { npcId: { site, person, posts: [{ index, post, fact }], done } }. */
    restore(feedPosts) {
        if (!feedPosts || typeof feedPosts !== 'object') return;
        for (const [npcId, f] of Object.entries(feedPosts)) {
            if (!f || typeof f !== 'object') continue;
            for (const item of Array.isArray(f.posts) ? f.posts : []) {
                this._add(npcId, { ...item, site: f.site, person: f.person }, { live: false });
            }
            if (f.done === true) this.done.add(npcId);
        }
    }

    _add(npcId, item, { live }) {
        const post = cleanPost(item.post);
        if (!post || !isStr(item.site) || !isStr(item.person)) return false;
        const list = this.posts.get(npcId) || [];
        if (list.some((p) => p.post.id === post.id)) return false;
        // The fact first, so a click on the post can grant it as soon as it is listed
        const fact = item.fact;
        if (fact && isStr(fact.id) && fact.id === post.fact) {
            const entry = cleanFact(fact.entry);
            // The evidence note's text, escaped once at storage (grantFact reads noteText first),
            // so authored or hostile markup shows as written and notebook search still finds it
            if (entry) {
                if (typeof entry.text === 'string') entry.noteText = escapeNoteText(entry.text);
                else delete entry.noteText;
                this.deps.mergeFact?.(fact.id, entry);
            }
        }
        const index = Number.isInteger(item.index) ? item.index : list.length;
        list.push({ index, post, site: item.site, person: item.person });
        list.sort((a, b) => a.index - b.index);
        this.posts.set(npcId, list);
        if (live) {
            this.deps.emit?.(`npc_posted:${npcId}`, { npcId, postId: post.id, index, site: item.site, person: item.person });
            if (this.deps.toastsOn?.() !== false && this.deps.siteVisited?.(item.site)) {
                this.deps.toast?.(`${this.deps.npcName?.(npcId) || npcId} posted on ${this.deps.siteName?.(item.site) || item.site}`, 'New post');
            }
        }
        return true;
    }

    /** The revealed posts on one profile, newest first, as post blocks (copies). */
    postsFor(siteId, personId) {
        const out = [];
        for (const list of this.posts.values()) {
            for (const p of list) if (p.site === siteId && p.person === personId) out.push(p);
        }
        return out.sort((a, b) => b.index - a.index).map((p) => ({ ...p.post }));
    }

    /** { npcId: [postId, ...] } in post order (the test bridge's feed()). */
    revealed() {
        const out = {};
        for (const [id, list] of this.posts) out[id] = list.map((p) => p.post.id);
        return out;
    }
}

/** Live deps read from the running game. */
export function liveDeps(api, w) {
    const osint = () => w.gameScenario?.social?.osint || {};
    return {
        send: (npcId) => (typeof api?.feedPost === 'function' ? api.feedPost(npcId) : api.post('/feed_post', { npc_id: npcId })),
        hasFeed: (npcId) => !!(w.npcManager?.getNPC?.(npcId) || w.npcManager?.npcs?.get?.(npcId))?.hasFeed,
        mergeFact(id, entry) {
            const sc = w.gameScenario;
            if (!sc || typeof sc !== 'object') return;
            if (!sc.social || typeof sc.social !== 'object') sc.social = {};
            if (!sc.social.intelFacts || typeof sc.social.intelFacts !== 'object') sc.social.intelFacts = {};
            sc.social.intelFacts[id] = entry;
        },
        emit: (name, data) => w.eventDispatcher?.emit?.(name, data),
        toast: (message, title) => (typeof w.gameAlert === 'function' ? w.gameAlert(message, 'info', title, 5000, { plainText: true, verbatim: true }) : null),
        siteVisited(siteId) {
            const raw = w.gameState?.globalVariables?.[OSINT_STATE_KEY];
            return Array.isArray(raw?.visited) && raw.visited.includes(siteId);
        },
        toastsOn: () => osint().postToasts !== false,
        npcName(npcId) {
            const rec = w.npcManager?.getNPC?.(npcId) || w.npcManager?.npcs?.get?.(npcId);
            return (rec && (rec.displayName || rec.name)) || npcId;
        },
        siteName(siteId) {
            const site = (Array.isArray(osint().sites) ? osint().sites : []).find((s) => s?.id === siteId);
            return (site && (site.name || site.title)) || siteId;
        }
    };
}

/**
 * Install once: window.socialFeed, the listeners on npc_used and npc_used_phone, and the posts the
 * server says are out. Called as soon as the scenario is loaded, before the browser can open.
 */
export function installSocialFeed(api, feedPosts = null) {
    const w = typeof window !== 'undefined' ? window : null;
    if (!w) return null;
    if (w.socialFeed) { w.socialFeed.restore(feedPosts); return w.socialFeed; }
    const feed = new SocialFeed(liveDeps(api, w));
    w.socialFeed = feed;
    feed.restore(feedPosts);
    w.eventDispatcher?.on?.('npc_used:*', (data) => {
        if (data && data.need === 'social_media' && data.met === true) feed.onUse(data.npcId);
    });
    w.eventDispatcher?.on?.('npc_used_phone:*', (data) => {
        if (data && data.need === 'social_media') feed.onUse(data.npcId);
    });
    return feed;
}

export default SocialFeed;
