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
 * - C3 (ACCESS_MODEL_SLICE_9_2_C3_PLAN.md 4): a reply carries post.replyTo (its thread post) and
 *   the ids replyToNpc, replyToPerson, namedNpc and namedPerson; every served post carries a
 *   game-wide `seq`. A reply is drawn in its thread (repliesFor, oldest first) and, unless it is
 *   the poster's own answer, on the replier's profile too (postsFor). Its toast reads "<replier>
 *   replied to <named NPC> on <site name>".
 *
 * Every post field is author text: it is kept as a string and only ever rendered as text
 * (the browser's h() helper sets textContent; toasts are plain text by default).
 */

const OSINT_STATE_KEY = 'se_osint_state';
const POST_FIELDS = ['id', 'text', 'fact', 'date', 'note', 'replyTo'];
/** The reply ids an item may carry beside its post (C3), kept as strings */
const REPLY_IDS = ['replyToNpc', 'replyToPerson', 'namedNpc', 'namedPerson'];

const isStr = (v) => typeof v === 'string' && v.length > 0;

/** A post block as the browser renders it: string fields only, an id required; else null. */
export function cleanPost(raw) {
    if (!raw || typeof raw !== 'object' || !isStr(raw.id)) return null;
    const out = {};
    for (const k of POST_FIELDS) if (typeof raw[k] === 'string') out[k] = raw[k];
    return out;
}

/**
 * Plain text for the notebook (a copy of npc-workarounds.js escapeNoteText, sub-slice H R1 M1; widen
 * both together): the notes
 * page renders a markdown subset after the dash display, so each of its escapable characters gets
 * a backslash and the page shows a feed fact's text exactly as written. HTML needs nothing: the
 * renderer escapes it first. Kept here rather than imported, so the test harness copies of this
 * module need no new file; social-feed.test.mjs checks it against the real renderer.
 */
const NOTE_ESCAPABLE = /[\\|*`#_-]/g;
export function escapeNoteText(text) {
    return String(text).replace(NOTE_ESCAPABLE, (ch) => `\\${ch}`);
}

/**
 * Plain JSON data, copied: strings, finite numbers, booleans, null, arrays and plain objects, to a
 * fixed depth. A key that would set a prototype is skipped; anything else (a function, a
 * non-finite number) is dropped. Review C R1 M1: a fact entry keeps every field its readers use,
 * among them `provides` (an array of objects: board-model.js, mail-composer.js heldProvides,
 * pretext-card.js blankSlot, social-intel.js subjectLabel) and `stale` (a boolean).
 */
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
function plainJson(v, depth) {
    if (typeof v === 'string' || typeof v === 'boolean' || v === null) return v;
    if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
    if (depth <= 0 || typeof v !== 'object') return undefined;
    if (Array.isArray(v)) return v.map((x) => plainJson(x, depth - 1)).filter((x) => x !== undefined);
    const out = {};
    for (const [k, x] of Object.entries(v)) {
        if (UNSAFE_KEYS.has(k)) continue;
        const c = plainJson(x, depth - 1);
        if (c !== undefined) out[k] = c;
    }
    return out;
}

/**
 * A fact entry as authored (plain JSON data, copied), or null when it is not an object or its
 * text is not a string (review C R2 nit: grantFact would hand that value to addNote).
 */
export function cleanFact(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    if ('text' in raw && typeof raw.text !== 'string') return null;
    return plainJson(raw, 6);
}

/**
 * Review C R1 server m2 and R2 m1: a too-soon answer is asked again after the server's own
 * retryAfter, with no cap on the wait, so a use at a mission's pace (a floor of minutes) still
 * yields its post. A use asks at most this many times in all, so a server that always says
 * tooSoon (or a network that stays down) cannot keep it asking.
 */
export const MAX_TRIES = 4;
/** A request that failed without an HTTP status (the network) is asked again after this. */
const NETWORK_RETRY_S = 5;
/** setTimeout fires at once for a delay over 2^31 - 1 ms, so no wait is longer (review C R3 nit). */
export const MAX_WAIT_S = 2147483;

export class SocialFeed {
    /**
     * deps: { send(npcId, source) -> Promise<body>, hasFeed(npcId), mergeFact(id, entry), emit(name, data),
     *         toast(message, title), siteVisited(siteId), toastsOn(), npcName(npcId) (null for an NPC
     *         with no record), siteName(siteId), profileName(siteId, personId),
     *         later(fn, ms) (optional; setTimeout) }
     */
    constructor(deps = {}) {
        this.deps = deps;
        this.posts = new Map();      // npcId -> [{ index, post, site, person }], oldest first
        this.done = new Set();
        this.inFlight = new Set();
        this.retrying = new Set();   // npcIds with one retry waiting (the use it belongs to)
        this.requests = 0;
    }

    /**
     * A met social media use by `npcId`: ask for its next post, once at a time, never after done.
     * A too-soon answer (the server's pace floor: a use that came early, after a reload or from
     * a tempt band) or a network failure is asked again after the wait (retryAfter + 1 s), up to
     * MAX_TRIES requests for the use, so the use still yields its post. A use while a retry
     * waits asks nothing more. A too-soon answer after a network failure whose `revealed`
     * count is above the posts this client holds means the lost request revealed this use's
     * post (listed after a reload), so the use stops there and never reveals a second.
     */
    onUse(npcId, source = null) {
        if (!isStr(npcId) || this.done.has(npcId) || this.inFlight.has(npcId) || this.retrying.has(npcId)) return null;
        if (!this.deps.hasFeed?.(npcId)) return null;
        return this._ask(npcId, MAX_TRIES - 1, false, isStr(source) ? source : null);
    }

    /**
     * One request; `retriesLeft` more may follow for the same use; `lost`: an earlier ask of this
     * use failed in the network. `source` is the object the use was at, null for the phone (user
     * decision q33: the server refuses a post from a PC the NPC is locked out at, `refused: true`,
     * which is not asked again).
     */
    _ask(npcId, retriesLeft, lost, source = null) {
        this.inFlight.add(npcId);
        this.requests++;
        let retryIn = null;
        return Promise.resolve()
            .then(() => this.deps.send(npcId, source))
            .then((body) => {
                this.apply(npcId, body);
                const wait = Number(body?.retryAfter);
                if (body?.tooSoon !== true || !Number.isFinite(wait)) return;
                if (lost && Number.isInteger(body.revealed) && body.revealed > (this.posts.get(npcId)?.length || 0)) return;
                retryIn = Math.min(Math.max(wait, 0) + 1, MAX_WAIT_S);
            }, (err) => {
                // 403: the server does not know the NPC (yet); a later use asks again
                if (err?.status === 403) return;
                console.warn('[social-feed] feed_post failed', err?.message || err);
                if (err?.status === undefined) {
                    retryIn = NETWORK_RETRY_S;
                    lost = true;
                }
            })
            .finally(() => {
                this.inFlight.delete(npcId);
                if (retriesLeft > 0 && retryIn !== null && !this.done.has(npcId)) {
                    this.retrying.add(npcId);
                    const later = this.deps.later || ((fn, ms) => setTimeout(fn, ms));
                    later(() => {
                        this.retrying.delete(npcId);
                        if (!this.done.has(npcId)) this._ask(npcId, retriesLeft - 1, lost, source);
                    }, retryIn * 1000);
                }
            });
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
        const seq = Number.isInteger(item.seq) && item.seq > 0 ? item.seq : 0;
        const entry = { index, seq, post, site: item.site, person: item.person };
        for (const k of REPLY_IDS) if (isStr(item[k])) entry[k] = item[k];
        list.push(entry);
        list.sort((a, b) => a.index - b.index);
        this.posts.set(npcId, list);
        if (live) {
            const data = { npcId, postId: post.id, index, seq, site: item.site, person: item.person };
            if (isStr(post.replyTo)) {
                data.replyTo = post.replyTo;
                for (const k of REPLY_IDS) if (isStr(entry[k])) data[k] = entry[k];
            }
            this.deps.emit?.(`npc_posted:${npcId}`, data);
            if (this.deps.toastsOn?.() !== false && this.deps.siteVisited?.(item.site)) {
                const site = this.deps.siteName?.(item.site) || item.site;
                const who = this._name(npcId, item.site, item.person);
                if (isStr(post.replyTo)) {
                    const named = this._name(entry.namedNpc, item.site, entry.namedPerson);
                    this.deps.toast?.(`${who} replied to ${named} on ${site}`, 'New reply');
                } else {
                    this.deps.toast?.(`${who} posted on ${site}`, 'New post');
                }
            }
        }
        return true;
    }

    /** An NPC's name for a toast: its record's name, else its Friendface profile's name, else its id. */
    _name(npcId, siteId, personId) {
        const rec = isStr(npcId) ? this.deps.npcName?.(npcId) : null;
        if (isStr(rec)) return rec;
        const prof = isStr(personId) ? this.deps.profileName?.(siteId, personId) : null;
        if (isStr(prof)) return prof;
        return isStr(npcId) ? npcId : (isStr(personId) ? personId : 'Someone');
    }

    /** Whether a stored entry is a reply, and whether it is the poster's own answer in her thread. */
    static isReply(p) { return isStr(p.post.replyTo); }
    static isAnswer(p) { return isStr(p.post.replyTo) && p.replyToPerson === p.person; }

    /**
     * The revealed posts on one profile, newest first, as post blocks (copies). An answer (the
     * poster's own reply in her thread) is left out: it is drawn only in its thread. A reply to a
     * colleague stays, with `replyToPerson` set so the view draws its "Replied to" line.
     */
    postsFor(siteId, personId) {
        const out = [];
        for (const list of this.posts.values()) {
            for (const p of list) {
                if (p.site === siteId && p.person === personId && !SocialFeed.isAnswer(p)) out.push(p);
            }
        }
        return out.sort((a, b) => b.index - a.index).map((p) => {
            const block = { ...p.post };
            if (SocialFeed.isReply(p) && isStr(p.replyToPerson)) block.replyToPerson = p.replyToPerson;
            return block;
        });
    }

    /**
     * The thread under one own post: every revealed reply whose replyTo is postId, from every NPC,
     * oldest first by seq, then by poster id. Each entry is { npcId, site, person, seq, post }.
     * A reply that arrived before its thread post is kept, so it shows once the post arrives.
     */
    repliesFor(postId) {
        if (!isStr(postId)) return [];
        const out = [];
        for (const [npcId, list] of this.posts) {
            for (const p of list) {
                if (p.post.replyTo === postId) out.push({ npcId, site: p.site, person: p.person, seq: p.seq, post: { ...p.post } });
            }
        }
        return out.sort((a, b) => (a.seq - b.seq) || (a.npcId < b.npcId ? -1 : a.npcId > b.npcId ? 1 : 0));
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
        send: (npcId, source = null) => (typeof api?.feedPost === 'function' ? api.feedPost(npcId, source) : api.post('/feed_post', { npc_id: npcId, object_id: isStr(source) ? source : null })),
        hasFeed: (npcId) => !!(w.npcManager?.getNPC?.(npcId) || w.npcManager?.npcs?.get?.(npcId))?.hasFeed,
        mergeFact(id, entry) {
            const sc = w.gameScenario;
            if (!sc || typeof sc !== 'object') return;
            if (!sc.social || typeof sc.social !== 'object') sc.social = {};
            if (!sc.social.intelFacts || typeof sc.social.intelFacts !== 'object') sc.social.intelFacts = {};
            if (id === '__proto__' || id === 'constructor' || id === 'prototype') return;
            sc.social.intelFacts[id] = entry;
        },
        emit: (name, data) => w.eventDispatcher?.emit?.(name, data),
        toast: (message, title) => (typeof w.gameAlert === 'function' ? w.gameAlert(message, 'info', title, 5000, { verbatim: true }) : null),
        siteVisited(siteId) {
            const raw = w.gameState?.globalVariables?.[OSINT_STATE_KEY];
            return Array.isArray(raw?.visited) && raw.visited.includes(siteId);
        },
        toastsOn: () => osint().postToasts !== false,
        npcName(npcId) {
            const rec = w.npcManager?.getNPC?.(npcId) || w.npcManager?.npcs?.get?.(npcId);
            const name = rec && (rec.displayName || rec.name);
            return isStr(name) ? name : null;
        },
        profileName(siteId, personId) {
            const site = (Array.isArray(osint().sites) ? osint().sites : []).find((s) => s?.id === siteId);
            const prof = (Array.isArray(site?.profiles) ? site.profiles : []).find((p) => p?.person === personId);
            return isStr(prof?.name) ? prof.name : null;
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
        if (data && data.need === 'social_media' && data.met === true) feed.onUse(data.npcId, data.objectId);
    });
    w.eventDispatcher?.on?.('npc_used_phone:*', (data) => {
        if (data && data.need === 'social_media') feed.onUse(data.npcId, null);
    });
    return feed;
}

export default SocialFeed;
