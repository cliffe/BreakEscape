/**
 * NPC needs system (Sims-lite): needs that decay over game time, objects that
 * advertise affordances, a bounded selector that sends an NPC to its most urgent
 * need, a use dwell that tops the need up, and a walk back to the NPC's post.
 * Spec: docs/achitechture/NPC_NEEDS_SYSTEM.md.
 *
 * Opt-in: only NPCs whose record has a `needs` block are touched.
 * Cyber-neutral: emits generic events (npc_used:<objectId> etc.) and applies the
 * NPC-owned `onUse` map; it never reads the NPC's `usePayload`, only clones it
 * onto npc_used.
 *
 * No static imports on purpose: the engine reaches it through window, and the
 * node tests import it directly with a stub world (see createEngineWorld for the
 * live adapter).
 *
 * Determinism: every decision happens on a fixed 250 ms tick of the needs clock;
 * the only randomness is a per-NPC mulberry32 seeded from (seed, npcId), used for
 * jitterPct. Arrivals are queued and handled at the next tick.
 */

export const NEEDS_TICK_MS = 250;
const MAX_FRAME_MS = 1000;
const LOG_CAP = 2000;
const FAIL_COOLDOWN_MS = 60000;
const HOME_EPS = 12;
const HOME_RETRY_TICKS = 4;   // provisional needsHome re-lookup: once a second
const SELECT_BACKOFF_TICKS = 4; // a selection that path-searched and found nothing retries after 1 s
// The walk home yields to the player (stops and faces them). After this long without moving
// it is re-issued without yielding, or a player standing near the route holds it for ever.
export const RETURN_YIELD_MS = 3000;
const RETURN_STILL_PX = 4;    // less than this between ticks counts as standing still
const CAUGHT_RADIUS = 48;    // px (1.5 tiles) from the home approach cell: "you were in my chair"
export const NOTICED_MS = 3000;   // getState().noticed after npc_caught_at_post (the "noticed" action icon)

// Social pairing and chatter (OFFICE_LIFE_PLAN 2.4, 7.3; slice 8). Two compatible NPCs using one
// object whose affordance names a `chatter` pool take turns at one-line speech bubbles, timed on
// the needs clock and only while both are still using it. Nothing here is saved.
export const CHAT_BASE_MS = 2500;
export const CHAT_PER_CHAR_MS = 50;
export const CHAT_MAX_MS = 4000;
export const CHAT_GAP_MS = 500;
export const OVERHEAR_RADIUS = 160;   // px, five tiles: npc_chatted `overheard`
export const CHAT_LINE_MAX = 40;      // characters; the validator enforces it
// Queues at shared machines (slice 10: OFFICE_LIFE_PLAN 2.5)
export const QUEUE_MAX_WAIT_S = 30;   // affordance.queue.maxWaitSeconds default
export const QUEUE_COOLDOWN_MS = 60000;   // after giving up on a queue, that object is skipped this long
export const QUEUE_CHAT_RADIUS = 48;  // px (1.5 tiles) from the approach cell: the front of the queue chats
// Avoidance at a distance, balking and parked needs (slice 14, OFFICE_LIFE_PLAN 10)
export const AVOID_RADIUS_TILES = 2;  // needsCompany.avoidRadius default, only for an NPC that declares avoids
export const NEEDS_DEFER_MIN = 4;     // needsDeferMin default: how long a given-up need stays parked
export const AVOID_BUBBLE_MS = 4000;  // the avoided person's face shows this long after a turn-back's grumble
export const WAKE_BASE_MS = 1000;     // a door opening or a room loading retries parked needs after this...
export const WAKE_STEP_MS = 500;      // ...plus this per parked NPC before it (id order), so they go one by one
// Built-in needs that are environmental: the validator warns on `deferrable: false` for these
export const ENVIRONMENTAL_NEEDS = Object.freeze(['caffeine', 'thirst', 'hunger', 'rest']);
/** How long a chat line's bubble shows: 2.5 s + 50 ms per character, at most 4 s. */
export function bubbleMs(line) {
    return Math.min(CHAT_MAX_MS, CHAT_BASE_MS + CHAT_PER_CHAR_MS * String(line || '').length);
}
// Voiced chatter (slice 15, OFFICE_LIFE_PLAN 11). Every spoken line lives in a scenario file: an
// NPC's `chatter` pools, the scenario's shared `chatter` pools, or an ink exchange knot. The engine
// has no spoken text of its own: a topic with nothing to say (or a speaker on cooldown) gets picture
// chat, a speech bubble holding an icon. Lines come from a seeded shuffle-bag per NPC and topic.
export const CHATTER_COOLDOWN_MIN = 5;     // chatterCooldownMin default: needs-clock minutes between barks
export const PICTURE_MS = 2500;            // a picture-chat bubble shows this long
export const EXCHANGE_LINE_MAX_MS = 6000;  // an exchange line may be longer than a bark
export const EXCHANGE_MAX_MS = 60000;      // the pair's overlap is extended by the knot, at most this
// Picture chat by topic (icon names from npc-action-icons.js NPC_ICON_NAMES); cycled per speaker
export const PICTURE_CHATTER = Object.freeze({
    coffee: Object.freeze(['caffeine', 'social', 'work']),
    cooler: Object.freeze(['thirst', 'social', 'work']),
    greet: Object.freeze(['social']),
    grumble: Object.freeze(['avoid']),
    // Slice 18a (OFFICE_LIFE_PLAN 12.4): a dead machine (off) or nothing left (gone, 18b). The
    // picture is the need's own icon (NEED_ICONS); this entry is the fallback for any other need.
    grumble_off: Object.freeze(['avoid']),
    grumble_gone: Object.freeze(['avoid']),
    // Slice 18b-ii: word of mouth about a magnet. The picture is the magnet's first `satisfies`
    // when that need has an icon (NEED_ICONS); this entry is the fallback.
    news: Object.freeze(['social'])
});
const PICTURE_DEFAULT = Object.freeze(['social']);
// The needs that have an icon of their own (npc-action-icons.js NPC_ICON_NAMES; not imported, so
// the test harness copy lists stay as they are)
const NEED_ICONS = Object.freeze(['caffeine', 'thirst', 'hunger', 'rest', 'social', 'work']);
/**
 * Turn-back reasons (slice 18a, OFFICE_LIFE_PLAN 12.4). mindChanged: stops a second avoidance
 * turn-back in this need episode (only `avoid`). grumble: says a line or shows a picture.
 * fallback: re-selects for the same need with the target left out. parks: a fallback that finds
 * nothing parks the need (a tempted job, 18b, never parks). answered and rang_out (slice 19, a
 * phone job with no need) go straight home.
 */
export const TURN_BACK = Object.freeze({
    avoid: Object.freeze({ mindChanged: true, grumble: true, fallback: true, parks: true }),
    off: Object.freeze({ mindChanged: false, grumble: true, fallback: true, parks: true }),
    gone: Object.freeze({ mindChanged: false, grumble: true, fallback: true, parks: true }),
    answered: Object.freeze({ mindChanged: false, grumble: false, fallback: false, parks: false }),
    rang_out: Object.freeze({ mindChanged: false, grumble: false, fallback: false, parks: false })
});
/** Slice 18b-i (OFFICE_LIFE_PLAN 12.4): temptation's default band above urgentAt, in points. */
export const MAGNET_TEMPT = 30;
/** Slice 18b-ii: magnet.newsRadius default (tiles), and how long an announce waits for the speech lock. */
export const NEWS_RADIUS = 5;
export const NEWS_WAIT_MS = 30000;

/**
 * Pure: an affordance's magnet block, normalised ({ tempt, servings, perPerson }), or null. A
 * magnet is food the player puts out: it lowers the level at which an NPC that knows about it acts
 * on a need it satisfies (never raising the need itself), and is eaten a serving at a time.
 */
export function magnetOf(aff) {
    const m = aff?.magnet;
    if (!m || typeof m !== 'object') return null;
    const num = (v, d, lo, hi) => { const n = Number(v); return Number.isFinite(n) ? clamp(n, lo, hi) : d; };
    return {
        tempt: num(m.tempt, MAGNET_TEMPT, 0, 95), servings: Math.floor(num(m.servings, 1, 0, 1000)), perPerson: Math.floor(num(m.perPerson, 1, 1, 1000)),
        // Slice 18b-ii: the scenario chatter pool a knower announces it from (null: picture only)
        // and the tiles within which the announce is heard
        announce: typeof m.announce === 'string' && m.announce ? m.announce : null,
        newsRadius: num(m.newsRadius, NEWS_RADIUS, 0, 50)
    };
}

/** Pure: the names an offWhen (requireGlobal form) reads: a name, or the keys of { name: value }. */
export function offWhenNames(cond) {
    if (typeof cond === 'string') return cond ? [cond] : [];
    if (cond && typeof cond === 'object' && !Array.isArray(cond)) return Object.keys(cond);
    return [];
}
/** An exchange line's bubble: like bubbleMs, with a longer cap. */
export function exchangeLineMs(line) {
    return Math.min(EXCHANGE_LINE_MAX_MS, CHAT_BASE_MS + CHAT_PER_CHAR_MS * String(line || '').length);
}
/** Pure: the icons picture chat cycles through for a topic. */
export function pictureIcons(topic) {
    return PICTURE_CHATTER[topic] || PICTURE_DEFAULT;
}
/** Pure: a seeded Fisher-Yates order of 0..n-1; never starts with `avoidFirst` when n > 1. */
export function bagOrder(n, rng, avoidFirst = -1) {
    const order = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
    }
    if (n > 1 && order[0] === avoidFirst) [order[0], order[1]] = [order[1], order[0]];
    return order;
}

/** Pure: a pool as { lines, hush, overhearRadius } from an array or { lines, hush, overhearRadius }. */
export function normalisePool(p) {
    if (Array.isArray(p)) return { lines: p.filter(l => typeof l === 'string' && l.trim()), hush: false, overhearRadius: null };
    if (p && typeof p === 'object') {
        const r = Number(p.overhearRadius);
        return { lines: (Array.isArray(p.lines) ? p.lines : []).filter(l => typeof l === 'string' && l.trim()), hush: p.hush === true, overhearRadius: r > 0 ? r : null };
    }
    return null;
}

/**
 * Pure: the topic's spoken pool for one speaker: the scenario's pool of that name plus the NPC's
 * own. There are no built-in lines (slice 15): with neither, the topic is picture chat only.
 * `pictures` is false when the scenario sets `"chatter": false` (no picture chat either).
 */
export function chatterPool(topic, scenarioChatter, npcChatter) {
    let base = null;
    if (scenarioChatter && typeof scenarioChatter === 'object' && scenarioChatter[topic] !== undefined) base = normalisePool(scenarioChatter[topic]);
    const own = npcChatter && typeof npcChatter === 'object' ? normalisePool(npcChatter[topic]) : null;
    return {
        lines: [...(base?.lines || []), ...(own?.lines || [])],
        hush: !!(base?.hush || own?.hush),
        overhearRadius: base?.overhearRadius || own?.overhearRadius || null,
        pictures: scenarioChatter !== false
    };
}

/** requireGlobal: a name (truthy) or { name: value } (all must match). Copied from npc-sight-challenge.js (review m10). */
export function requiredGlobalsHold(requireGlobal, globals) {
    if (!requireGlobal) return true;
    if (typeof requireGlobal === 'string') return !!globals[requireGlobal];
    if (typeof requireGlobal === 'object') {
        return Object.entries(requireGlobal).every(([name, value]) => globals[name] === value);
    }
    return true;
}

export function hash32(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
}

export function createSeededRng(seed) {
    let a = seed >>> 0;
    return function mulberry32() {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** One deterministic draw in [0, 1) for (seed, npcId, salt), independent of any running stream. */
export function seededRoll(seed, npcId, salt = '') {
    return createSeededRng(hash32(`${seed}:${npcId}:${salt}`))();
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const round2 = v => Math.round(v * 100) / 100;
const asList = v => (Array.isArray(v) ? v : (v == null ? [] : [v]));

function cloneData(v) {
    if (v === undefined) return null;
    try {
        return typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v));
    } catch (e) {
        return null;
    }
}

/** Normalise one need's config to the documented bounds. Returns null when unusable. */
export function normaliseNeed(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const decay = Number(raw.decayPerMin);
    const urgentAt = Number(raw.urgentAt);
    if (!(decay > 0) || !(urgentAt > 0)) return null;
    return {
        decayPerMin: clamp(decay, 0.01, 600),
        urgentAt: clamp(urgentAt, 1, 99),
        initial: Number.isFinite(Number(raw.initial)) ? clamp(Number(raw.initial), 0, 100) : 100,
        weight: Number.isFinite(Number(raw.weight)) ? clamp(Number(raw.weight), 0.1, 10) : 1,
        maxUnmetMin: Number(raw.maxUnmetMin) > 0 ? Number(raw.maxUnmetMin) : null,
        jitterPct: Number.isFinite(Number(raw.jitterPct)) ? clamp(Number(raw.jitterPct), 0, 50) : 0
    };
}

/**
 * Normalise an interest (attraction to items with a tag). A number is shorthand
 * for { weight }. Weight is on the same 0.1-10 scale as need weights.
 */
export function normaliseInterest(raw) {
    const r = typeof raw === 'number' ? { weight: raw } : raw;
    if (!r || typeof r !== 'object') return null;
    const w = Number(r.weight);
    if (!(w > 0)) return null;
    return {
        weight: clamp(w, 0.1, 10),
        noticeRooms: Array.isArray(r.noticeRooms) ? r.noticeRooms.slice() : null
    };
}

/** T1 (minutes to first urgent) and P (minutes between top-ups, without travel) for a need. */
export function needTiming(need, restores = 100) {
    const n = normaliseNeed(need);
    if (!n) return null;
    const t1 = Math.max(0, (n.initial - n.urgentAt) / n.decayPerMin);
    const p = (Math.min(100, n.urgentAt + restores) - n.urgentAt) / n.decayPerMin;
    return { t1: round2(t1), p: round2(p) };
}

export class NPCNeedsSystem {
    /**
     * @param {Object} world - adapter; see createEngineWorld for the live one
     * @param {Object} [opts] - { seed: number|string, manualClock: boolean }
     */
    constructor(world, opts = {}) {
        this.world = world;
        this.seed = opts.seed !== undefined ? opts.seed : 0;
        this.manualClock = !!opts.manualClock;
        this.clockMs = 0;
        this.speakers = [];   // slice 21: who is speaking, rebuilt each tick (_buildSpeakers)
        this.tickCount = 0;
        this._acc = 0;
        this._lastElapsed = null;
        this.states = new Map();
        this.log = [];
        this._arrivals = new Set();
        // Tick-cost hygiene (OFFICE_LIFE_PLAN 2.0). tickCache: skip the object scan for an NPC with
        // nothing urgent, build the object list once per tick, cache reachability per tick (the
        // decision log is unchanged). selectBackoff: an NPC whose selection path-searched and found
        // nothing re-selects after 1 s, not every tick. Both default on; false is for comparison tests.
        this.tickCache = opts.tickCache !== false;
        this.selectBackoff = opts.selectBackoff !== false;
        this._tickObjects = null;
        this._reachCache = null;
        this._selectSearched = false;
        this._knownRooms = new Set();
        // Reveal slots set down at a target or shown as a cosmetic copy (slice 7): id -> clock ms
        // at which the engine stows (or removes) it. Client only; a reload stows on sight instead.
        this._placed = new Map();
        // Social pairing (slice 8): objectId -> chat. _anyCompany: some NPC has needsCompany, so
        // _free checks avoidances (without it the decision log is unchanged).
        this._chats = new Map();
        this._chatSeq = 0;
        this._anyCompany = false;
        // Voiced chatter (slice 15): shuffle-bags (npcId|topic), the speech lock (one voiced line at
        // a time, across all NPCs) and exchanges played this session (the heard_<knot> global is
        // what survives a reload)
        this._bags = new Map();
        this._speechUntil = 0;
        this._exPlayed = new Set();
        // Queues (slice 10): claim order across the whole system, so queue order is deterministic
        this._queueSeq = 0;
        // Switched-off sources (slice 18a): objectId -> { cond, off } for every object with an
        // affordance.offWhen seen so far, with the off state last seen. A global change wakes parked
        // needs only when one of them really turns back on.
        this._offSeen = new Map();
        // Print and forget (slice 17, OFFICE_LIFE_PLAN 12.3): slotId -> the owned print on it
        // ({ ownerId, producerId, at, dueAt, forgotten, ... }). Client only: a reload files every
        // shown slot (stow on sight), and the reservations go with it.
        this._prints = new Map();
        // Magnets (slice 18b-i, OFFICE_LIFE_PLAN 12.4): magnetId -> { id, cfg, aff, satisfies, key,
        // servings, wasShown }. Found on a drop (onItemDropped), a room load or any object scan; the
        // servings count is mirrored in the engine-owned <id>_servings global, which survives a reload.
        // Who knows of a magnet (s.knows) is client only. _magShown: the shown magnets, per tick.
        this._magnets = new Map();
        this._magShown = null;
        // Read-outs for tests and live measurement; never feed a decision
        this.stats = { ticks: 0, selects: 0, objectScans: 0, pathSearches: 0, backoffs: 0 };
    }

    // ── setup ──────────────────────────────────────────────────────────────

    seedFor(npcId) {
        return hash32(`${this.seed}:${npcId}`);
    }

    /**
     * A deterministic number in [0, 1) for (seed, npcId, salt). It uses its own stream, so asking
     * for one never moves the per-NPC RNG that jitters need timings. Same seed, NPC and salt give
     * the same value on every play; vary the salt (a counter, a label) for successive rolls.
     * Used by generic scenario mechanics that want seeded variety, e.g. a workstation's lockChance.
     */
    roll(npcId, salt = '') {
        return seededRoll(this.seed, npcId, salt);
    }

    /** Register (or re-register) an NPC with a needs block. Ignores NPCs without one. */
    register(npcId) {
        if (this.states.has(npcId)) return true;
        const rec = this.world.getNpc(npcId);
        if (!rec || ((!rec.needs || typeof rec.needs !== 'object') && (!rec.interests || typeof rec.interests !== 'object'))) return false;
        const needs = {};
        for (const name of Object.keys(rec.needs || {})) {
            const n = normaliseNeed(rec.needs[name]);
            if (n) needs[name] = n;
        }
        const interests = {};
        if (rec.interests && typeof rec.interests === 'object') {
            for (const tag of Object.keys(rec.interests)) {
                const it = normaliseInterest(rec.interests[tag]);
                if (it) interests[tag] = it;
            }
        }
        if (!Object.keys(needs).length && !Object.keys(interests).length) return false;
        const rng = createSeededRng(this.seedFor(npcId));
        const levels = {};
        const lastSatisfiedAt = {};
        for (const name of Object.keys(needs)) {
            const n = needs[name];
            levels[name] = clamp(n.initial * (1 + (rng() * 2 - 1) * n.jitterPct / 100), 0, 100);
            lastSatisfiedAt[name] = this.clockMs;
        }
        // Room leash (OFFICE_LIFE_PLAN 7.2): fixed per NPC, authored beside needsHome
        const roomList = v => (Array.isArray(v) ? v.filter(r => typeof r === 'string' && r) : null);
        const allow = roomList(rec.needsRooms), deny = roomList(rec.needsAvoidRooms);
        const leash = (allow || deny?.length) ? { allow: allow ? new Set(allow) : null, deny: new Set(deny || []) } : null;
        if (rec.needsCompany && typeof rec.needsCompany === 'object') this._anyCompany = true;
        this.states.set(npcId, {
            npcId, needs, interests, levels, lastSatisfiedAt, rng, leash,
            // Slice 17: need uses per object (salts a print hook's chance) and owned prints (salts the habit)
            useCounts: {},
            printCount: 0,
            // Slice 18b-i: magnets this NPC knows of, servings it has had from each, and needs whose
            // tempted job already turned back once for avoidance (mindChanged is cleared above urgentAt)
            knows: new Set(),
            ate: {},
            temptBack: {},
            // Slice 18b-ii: magnets this NPC has announced (once each), and an announce waiting for
            // the speech lock ({ id, since }; a picture after NEWS_WAIT_MS)
            announced: new Set(),
            newsWait: null,
            leashNoted: {},
            avoidNoted: {},
            privateNoted: {},
            urgentFlag: {},
            mode: 'idle',
            prevMode: null,
            job: null,
            atPost: true,
            // Real leaves so far (2.10, slice 11): salts the left-behind roll. Resets with the state
            // on reload. leftItems: items this NPC left at its post on the current leave.
            leaveCount: 0,
            leftItems: [],
            // Slice 14: parked needs (need -> { reason, until, since, avoidedId }), needs whose
            // NPC has already turned back once this episode (no second turn-back until met),
            // turn-backs so far (salts the grumble), the face bubble after a turn-back, and a
            // one-off grumble line ({ line, topic, objectId, until })
            parked: {},
            mindChanged: {},
            turnCount: 0,
            avoidShow: null,
            saying: null,
            home: null,
            cooldowns: {},
            scriptSuspended: false,
            blocked: false
        });
        this._log(npcId, 'registered');
        return true;
    }

    registerAll() {
        for (const id of [...this.world.npcIds()].sort()) this.register(id);
    }

    has(npcId) {
        return this.states.has(npcId);
    }

    reset(seed) {
        if (seed !== undefined) this.seed = seed;
        const ids = [...this.states.keys()];
        for (const id of ids) {
            const s = this.states.get(id);
            if (s.job) this._abortJob(s, 'reset', { cancel: true });
        }
        this.states.clear();
        this._chats.clear();
        this._chatSeq = 0;
        this._queueSeq = 0;
        this._bags.clear();
        this._speechUntil = 0;
        this._exPlayed.clear();
        this.log = [];
        this.clockMs = 0;
        this.speakers = [];
        this.tickCount = 0;
        this._acc = 0;
        this._lastElapsed = null;
        this._arrivals.clear();
        for (const id of ids.sort()) this.register(id);
    }

    // ── clock ──────────────────────────────────────────────────────────────

    /** Live frame hook: advances the needs clock off game elapsed time. */
    update() {
        if (this.manualClock) return;
        const now = this.world.elapsedMs();
        if (this._lastElapsed === null) { this._lastElapsed = now; return; }
        const delta = now - this._lastElapsed;
        this._lastElapsed = now;
        if (this.world.isVmActive()) return;
        this._acc += clamp(delta, 0, MAX_FRAME_MS);
        while (this._acc >= NEEDS_TICK_MS) {
            this._acc -= NEEDS_TICK_MS;
            this.tick();
        }
    }

    /** Manual clock: advance by ms (whole ticks). */
    step(ms) {
        const ticks = Math.floor(Math.max(0, Number(ms) || 0) / NEEDS_TICK_MS);
        for (let i = 0; i < ticks; i++) this.tick();
        return ticks;
    }

    // ── external notifications ─────────────────────────────────────────────

    /** npc_arrived:<id> with owner 'needs' — handled at the next tick. */
    onArrived(npcId, owner) {
        if (owner !== 'needs' || !this.states.has(npcId)) return;
        this._arrivals.add(npcId);
    }

    /** A goToAndStay not issued by needs (a script): suspend needs for this NPC. */
    onExternalMove(npcId, owner) {
        const s = this.states.get(npcId);
        if (!s || owner === 'needs') return;
        if (s.job) this._abortJob(s, 'script', { cancel: false });
        s.mode = 'idle';
        s.prevMode = null;
        s.scriptSuspended = true;
        s.atPost = false;
        this._arrivals.delete(npcId);
        this._log(npcId, 'suspended', { reason: 'script' });
    }

    /**
     * door_opened (doors.js): a way may have opened to a source a parked need lacked. Clears the
     * select back-offs and retries every parked need soon, staggered (slice 14).
     */
    onDoorOpened() {
        this._clearBackoffs();
        this._wakeParked();
    }

    /**
     * global_variable_changed:<name> (slice 18a). set_global emits on every call, same value or
     * not, so this compares states: parked needs retry, as for a door, only when an object whose
     * offWhen reads `name` was last seen off and is now on.
     */
    onGlobalChanged(name) {
        if (!this._offSeen.size || typeof name !== 'string') return;
        let woke = false;
        for (const id of [...this._offSeen.keys()].sort()) {
            const rec = this._offSeen.get(id);
            if (!offWhenNames(rec.cond).includes(name)) continue;
            const off = this._globalHolds(rec.cond);
            if (rec.off && !off) woke = true;
            rec.off = off;
        }
        if (woke) {
            this._log(null, 'switched_on', { global: name });
            this._clearBackoffs();
            this._wakeParked();
        }
    }

    /** affordance.offWhen holds: not a source (slice 18a). Records the state for onGlobalChanged. */
    _isOff(o) {
        const cond = o?.affordance?.offWhen;
        if (cond === undefined || cond === null || cond === false || cond === '') return false;
        const off = this._globalHolds(cond);
        this._offSeen.set(o.id, { cond, off });
        return off;
    }

    // ── magnets (slice 18b-i, OFFICE_LIFE_PLAN 12.4) ───────────────────────

    /**
     * item_dropped:<id> (item-drop.js): the player put a held item down. A magnet (affordance.magnet)
     * becomes a source where it lies. magnet_placed lists the NPCs with a need it satisfies whose
     * leash and privacy allow its room; with nobody, magnet_unreachable explains a dead drop.
     * Nobody knows of it yet: NPCs learn by sight (or, in 18b-ii, by word).
     */
    onItemDropped(itemId) {
        const o = typeof itemId === 'string' ? this.world.getObject(itemId) : null;
        const cfg = o ? magnetOf(o.affordance) : null;
        if (!cfg) return false;
        if (!this._magnets.has(o.id)) this._addMagnet(o, cfg);
        const m = this._magnets.get(o.id);
        this._worldChanged();
        this._clearBackoffs();
        const reachable = [...this.states.keys()].sort().filter(id => {
            const s = this.states.get(id);
            return m.satisfies.some(n => s.needs[n]) && !this._roomForbidden(s, o.roomId);
        });
        this._log(null, 'magnet_placed', { target: o.id, room: o.roomId, reachable, servings: m.servings });
        this._emit(`magnet_placed:${o.id}`, { magnetId: o.id, roomId: o.roomId ?? null, x: Math.round(o.x), y: Math.round(o.y), how: 'drop', reachable, servings: m.servings });
        if (!reachable.length) {
            this._log(null, 'magnet_unreachable', { target: o.id, room: o.roomId });
            this._emit(`magnet_unreachable:${o.id}`, { magnetId: o.id, roomId: o.roomId ?? null });
        }
        return true;
    }

    /** Find magnets among the loaded objects (a room load, a reload). Not counted as a tick's scan. */
    scanMagnets() {
        if (typeof this.world.listObjects === 'function') this._noteMagnets(this.world.listObjects() || []);
    }

    _noteMagnets(list) {
        for (const o of list || []) {
            if (this._magnets.has(o.id)) continue;
            const cfg = magnetOf(o.affordance);
            if (cfg) this._addMagnet(o, cfg);
        }
    }

    /** Servings come from the <id>_servings global when it holds a number (a reload), else the block's. */
    _addMagnet(o, cfg) {
        const key = `${o.id}_servings`;
        const g = typeof this.world.getGlobal === 'function' ? Number(this.world.getGlobal(key)) : NaN;
        const servings = Number.isFinite(g) ? Math.max(0, Math.floor(g)) : cfg.servings;
        this._magnets.set(o.id, { id: o.id, cfg, aff: o.affordance, satisfies: asList(o.affordance.satisfies), key, servings, wasShown: false });
        this._magShown = null;
    }

    /** The magnets showing now (in a room, not picked up, not hidden), id -> object; cached per tick. */
    _shownMagnets() {
        if (!this._magnets.size) return null;
        if (this._magShown && this._magShown.tick === this.tickCount) return this._magShown.map;
        const map = new Map();
        for (const id of [...this._magnets.keys()].sort()) {
            const o = this.world.getObject(id);
            if (o && o.roomId && o.pickable !== false && !this._hidden(o)) map.set(id, o);
        }
        this._magShown = { tick: this.tickCount, map };
        return map;
    }

    _servingsLeft(id) {
        return this._magnets.get(id)?.servings ?? 0;
    }

    /** A revealOnGlobal object whose global is not true is no use target (12.4 point 7). */
    _hidden(o) {
        const g = o?.revealOnGlobal;
        return typeof g === 'string' && g !== '' && !this._globalHolds(g);
    }

    /** A magnet is a source only for an NPC that knows of it, while it shows and has servings left. */
    _magnetBarred(s, o) {
        if (!this._magnets.has(o.id)) return !!magnetOf(o.affordance);   // not yet seen by the registry
        return !s.knows.has(o.id) || !this._shownMagnets()?.has(o.id) || this._servingsLeft(o.id) <= 0;
    }

    /** Known, live magnets for a need; a tempted look skips those whose perPerson this NPC has had. */
    _magnetsFor(s, name, tempted) {
        if (!s.knows.size) return null;
        const shown = this._shownMagnets();
        const out = [];
        for (const id of [...s.knows].sort()) {
            const m = this._magnets.get(id), o = shown?.get(id);
            if (!m || !o || m.servings <= 0 || !m.satisfies.includes(name)) continue;
            if (tempted && (s.ate[id] || 0) >= m.cfg.perPerson) continue;
            out.push(o);
        }
        return out;
    }

    /** The widest tempt band of a known, live magnet that still tempts this NPC for `name`; 0 if none. */
    _temptBand(s, name) {
        if (!s.knows.size || s.parked[name]) return 0;   // a parked need is not tempted (OQ35)
        let band = 0;
        for (const o of this._magnetsFor(s, name, true) || []) band = Math.max(band, this._magnets.get(o.id).cfg.tempt);
        return band;
    }

    /** _select's early-return guard: some need sits in a known magnet's tempt band. */
    _tempting(s) {
        if (!s.knows.size) return false;
        for (const name of Object.keys(s.needs)) {
            const n = s.needs[name];
            const band = this._temptBand(s, name);
            if (band > 0 && s.levels[name] > n.urgentAt && s.levels[name] <= Math.min(95, n.urgentAt + band)) return true;
        }
        return false;
    }

    /** Sight: an NPC in a shown magnet's room, lit or not, knows of it. */
    _sight(s, pos) {
        const shown = this._shownMagnets();
        if (!shown?.size || !pos.roomId) return;
        for (const [id, o] of shown) {
            if (o.roomId !== pos.roomId || s.knows.has(id)) continue;
            s.knows.add(id);
            s.selectRetryAt = 0;
            this._log(s.npcId, 'magnet_seen', { target: id });
            this._emit(`npc_saw_magnet:${s.npcId}`, { npcId: s.npcId, magnetId: id, roomId: o.roomId });
            this._wakeParkedFor(s, this._magnets.get(id)?.satisfies || []);   // OQ35: sight or word
        }
    }

    // ── word of mouth (slice 18b-ii, OFFICE_LIFE_PLAN 12.4 point 3, OQ33) ────

    /**
     * A knower in its own (post) room, idle or walking home, away from the magnet's room, tells
     * once per magnet: every NPC in the same room within newsRadius tiles that does not know yet
     * and is not avoided either way (groups do not matter) learns of it, whatever is shown. The
     * hearers are taken when the line or picture shows; with nobody to tell there is no announce
     * at all. The line comes from the magnet's announce pool, ignores the bark cooldown and waits
     * for the speech lock, up to NEWS_WAIT_MS; then a `news` picture. Telling happens even when
     * nothing can be shown ("chatter": false).
     */
    _tickNews(s, pos) {
        if (!pos.roomId || pos.roomId !== s.home?.roomId) return;
        if (s.mode !== 'idle' && s.mode !== 'returning') return;
        if (s.saying && s.saying.until > this.clockMs) return;
        const shown = this._shownMagnets();
        for (const id of [...s.knows].sort()) {
            if (s.announced.has(id)) continue;
            const m = this._magnets.get(id), o = shown?.get(id);
            if (!m || !o || m.servings <= 0 || o.roomId === pos.roomId) continue;
            const hearers = this._newsHearers(s, pos, m);
            if (!hearers.length) continue;   // nobody would learn: no line, no picture, no TTS request
            const topic = m.cfg.announce || 'news';
            const waited = s.newsWait?.id === id ? this.clockMs - s.newsWait.since : 0;
            const first = m.satisfies.find(n => NEED_ICONS.includes(n));
            const pick = this._pickBark(s, topic, { waitForLock: waited < NEWS_WAIT_MS, ignoreCooldown: true, icons: [first || 'social'] });
            if (pick?.wait) {
                if (s.newsWait?.id !== id) s.newsWait = { id, since: this.clockMs };
                return;
            }
            s.newsWait = null;
            this._announce(s, m, hearers, pick, topic);
            return;   // one announce per tick
        }
    }

    /** Who would learn from this speaker now: same room, within newsRadius, not knowing, not avoided either way. */
    _newsHearers(s, pos, m) {
        const r = m.cfg.newsRadius * 32;
        const out = [];
        for (const id of [...this.states.keys()].sort()) {
            if (id === s.npcId) continue;
            const t = this.states.get(id);
            if (t.knows.has(m.id)) continue;
            const p = this.world.npcPos(id);
            if (!p || p.roomId !== pos.roomId || Math.hypot(p.x - pos.x, p.y - pos.y) > r + 0.5) continue;
            const st = this.world.npcStatus(id) || {};
            if (st.ko || st.hostile || st.hidden) continue;
            if (this._avoids(s, t)) continue;
            out.push(t);
        }
        return out;
    }

    _announce(s, m, hearers, pick, topic) {
        s.announced.add(m.id);
        if (pick) this._showSaying(s, pick, topic, m.id);
        const heard = hearers.map(t => t.npcId);
        this._log(s.npcId, 'announced', { target: m.id, heard, line: pick?.line ? `${topic}:${pick.idx}` : undefined, picture: pick?.picture || undefined });
        this._emit(`npc_announced:${s.npcId}`, { npcId: s.npcId, magnetId: m.id, heard, topic, line: pick?.line || null, picture: pick?.picture || null, ...this._playerProximity(s.npcId) });
        for (const t of hearers) {
            t.knows.add(m.id);
            t.selectRetryAt = 0;
            this._log(t.npcId, 'told', { target: m.id, from: s.npcId });
            this._emit(`npc_told:${t.npcId}`, { npcId: t.npcId, magnetId: m.id, fromId: s.npcId });
            this._wakeParkedFor(t, m.satisfies);
        }
    }

    /** A serving is taken as eating starts; the count is written to <id>_servings. */
    _takeServing(s, id) {
        const m = this._magnets.get(id);
        if (!m || m.servings <= 0) return false;
        m.servings--;
        s.ate[id] = (s.ate[id] || 0) + 1;
        this.world.setGlobal(m.key, m.servings);
        this._worldChanged();
        this._log(s.npcId, 'serving_taken', { target: id, left: m.servings });
        this._emit(`magnet_serving:${id}`, { npcId: s.npcId, magnetId: id, left: m.servings });
        return true;
    }

    /**
     * Per tick: a magnet that stopped showing (picked up) is forgotten by everyone, so a re-drop is
     * learnt again; its servings are kept. One showing at 0 servings with nobody eating is finished
     * (also the reload case: 0 servings restored with the item still in its room).
     */
    _tickMagnets() {
        const shown = this._shownMagnets() || new Map();
        for (const id of [...this._magnets.keys()].sort()) {
            const m = this._magnets.get(id);
            const on = shown.has(id);
            if (!on && m.wasShown) {
                m.wasShown = false;
                for (const st of this.states.values()) this._forgetMagnet(st, id);
                this._log(null, 'magnet_gone', { target: id, left: m.servings });
            } else if (on) m.wasShown = true;
            if (on && m.servings <= 0 && ![...this.states.values()].some(st => st.job?.targetId === id && st.job.phase === 'using')) {
                this._finishMagnet(id, shown.get(id));
            }
        }
    }

    /** Knowledge of a magnet goes with it (picked up or finished): a re-drop is learnt and told again. */
    _forgetMagnet(st, id) {
        st.knows.delete(id);
        st.announced.delete(id);
        if (st.newsWait?.id === id) st.newsWait = null;
    }

    /** The last serving is eaten: the item is taken away (room removal, so a reload keeps it gone). */
    _finishMagnet(id, o) {
        this._magnets.delete(id);
        for (const st of this.states.values()) this._forgetMagnet(st, id);
        if (typeof this.world.removeMagnet === 'function') this.world.removeMagnet(id);
        this._worldChanged();
        this._log(null, 'magnet_finished', { target: id });
        this._emit(`magnet_finished:${id}`, { magnetId: id, roomId: o?.roomId ?? null });
    }

    /** eventMapping `needs` field: "resume" | "suspend" | { set: {need: level} }. */
    control(npcId, cmd) {
        const s = this.states.get(npcId);
        if (!s) return false;
        if (cmd === 'suspend') {
            if (s.job) this._abortJob(s, 'suspend', { cancel: true });
            s.mode = 'idle';
            s.scriptSuspended = true;
            this._log(npcId, 'suspended', { reason: 'mapping' });
            return true;
        }
        if (cmd === 'resume') {
            if (!s.scriptSuspended) return false;
            s.scriptSuspended = false;
            this._goHome(s);
            this._log(npcId, 'resumed');
            return true;
        }
        // Slice 17: { print: "<producerId>" } or { print: { producer, fetchAfterSeconds, forget } }
        // prints as this NPC at once, owned, with its printHabit (the command's fields win)
        if (cmd && typeof cmd === 'object' && cmd.print !== undefined) {
            const spec = typeof cmd.print === 'string' ? { producer: cmd.print } : (cmd.print && typeof cmd.print === 'object' ? cmd.print : null);
            if (!spec || typeof spec.producer !== 'string' || !spec.producer) return false;
            const rec = this.world.getNpc(npcId) || {};
            const own = { habit: rec.printHabit && typeof rec.printHabit === 'object' ? rec.printHabit : {}, viaCommand: true };
            if (Array.isArray(spec.fetchAfterSeconds)) own.fetchAfterSeconds = spec.fetchAfterSeconds;
            if (typeof spec.forget === 'boolean') own.forget = spec.forget;
            this._log(npcId, 'print_command', { target: spec.producer });
            this._revealOutput(spec.producer, npcId, own);
            return true;
        }
        if (cmd && typeof cmd === 'object' && cmd.set && typeof cmd.set === 'object') {
            for (const [name, v] of Object.entries(cmd.set)) {
                if (s.needs[name] && Number.isFinite(Number(v))) {
                    // A mapping that sets a parked need means "now": it is unparked first (slice 14)
                    if (s.parked[name]) this._unpark(s, name, 'set');
                    s.levels[name] = clamp(Number(v), 0, 100);
                    this._log(npcId, 'level_set', { need: name, level: round2(s.levels[name]) });
                }
            }
            return true;
        }
        return false;
    }

    // ── the tick ───────────────────────────────────────────────────────────

    tick() {
        this.tickCount++;
        this.stats.ticks++;
        this.clockMs += NEEDS_TICK_MS;
        this._worldChanged();
        this._checkRooms();
        if (this._placed.size) this._tickPlaced();
        if (this._prints.size) this._tickPrints();
        if (this._magnets.size) this._tickMagnets();
        for (const id of [...this.states.keys()].sort()) {
            try {
                this._tickNpc(this.states.get(id));
            } catch (e) {
                if (typeof console !== 'undefined') console.error(`[needs] tick error for ${id}`, e);
            }
        }
        this._tickQueueChats();
        if (this._chats.size) this._tickChats();
        this.speakers = this._buildSpeakers();
        this._worldChanged();
        // Slice 16 (OFFICE_LIFE_PLAN 12.2): the live adapter runs workstation auto-lock here, on
        // the needs clock; the stubs have no afterTick, so the decision log is unchanged.
        if (typeof this.world.afterTick === 'function') {
            try { this.world.afterTick(this.clockMs); } catch (e) { if (typeof console !== 'undefined') console.error('[needs] afterTick error', e); }
        }
    }

    /**
     * Who is speaking now, once per tick, for seated colleagues to look round at (slice 21,
     * OFFICE_LIFE_PLAN 12.7): [{ npcId, roomId, x, y, until }], until on the needs clock.
     * Chat and exchange lines, pictures and grumbles. Read-only: no roll, no log line.
     */
    _buildSpeakers() {
        const out = [];
        const add = (npcId, until) => {
            const p = this.world.npcPos(npcId);
            if (p) out.push({ npcId, roomId: p.roomId ?? null, x: p.x, y: p.y, until });
        };
        for (const c of this._chats.values()) {
            const cur = c.current;
            if (cur && this.clockMs < cur.until) add(cur.speakerId, cur.until);
        }
        for (const s of this.states.values()) {
            if (s.saying && this.clockMs < s.saying.until) add(s.npcId, s.saying.until);
        }
        return out;
    }

    /** Drop the per-tick object list and reachability answers (something in the world changed). */
    _worldChanged() {
        this._tickObjects = null;
        this._reachCache = null;
        this._magShown = null;
    }

    /** emit / setGlobal through here: a listener may reveal, move or remove objects mid-tick. */
    _emit(name, data) {
        this.world.emit(name, data);
        this._worldChanged();
    }

    /**
     * Room loads. A room that appears (a door opened) can bring the object a blocked NPC lacked, so
     * every select back-off is cleared. The world reports loaded room ids (`roomIds`); a world
     * without it (the node stub) has no room loads to notice.
     */
    _checkRooms() {
        if (typeof this.world.roomIds !== 'function') return;
        const fresh = [];
        for (const id of this.world.roomIds() || []) {
            if (!this._knownRooms.has(id)) { this._knownRooms.add(id); fresh.push(id); }
        }
        if (fresh.length) this._onRoomsLoaded(fresh.sort());
    }

    _onRoomsLoaded(roomIds) {
        this._clearBackoffs();
        this._wakeParked();
        // Slice 18b-i: a dropped magnet comes back with its room after a reload
        this.scanMagnets();
        // Stow on sight (OFFICE_LIFE_PLAN 2.2 Part A): after a reload a revealed slot comes back
        // at its declared spot with its global still true and nobody holding it; file it away so
        // the pool is whole again. At install every loaded room is new, so this covers them too.
        if (typeof this.world.stowRevealedSlots === 'function') {
            const stowed = this.world.stowRevealedSlots(roomIds);
            if (stowed && stowed.length) { for (const sid of stowed) this._prints.delete(sid); this._worldChanged(); }
        }
    }

    /** Placed slots and cosmetic copies whose time is up: someone filed them away. */
    _tickPlaced() {
        for (const [id, p] of [...this._placed.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
            if (this.clockMs < p.at) continue;
            this._placed.delete(id);
            if (p.cosmetic) this.world.removeCosmetic?.(id);
            else if (this.world.stowSlot?.(id)) { this._prints.delete(id); this._log(p.npcId, 'stowed', { item: id, reason: 'filed' }); }
            this._worldChanged();
        }
    }

    /** How long a placed slot (or a producer's cosmetic copy) stays out, in ms; 0 = until a reload. */
    _placeMs(aff) {
        const v = Number(aff?.placeSeconds);
        return (Number.isFinite(v) ? clamp(v, 0, 3600) : 60) * 1000;
    }

    _clearBackoffs() {
        for (const o of this.states.values()) o.selectRetryAt = 0;
    }

    /** The loaded objects with an affordance or needsTag, scanned at most once per tick. */
    _objects() {
        if (this.tickCache && this._tickObjects) return this._tickObjects;
        this.stats.objectScans++;
        const list = this.world.listObjects();
        if (this.tickCache) this._tickObjects = list;
        this._noteMagnets(list);
        return list;
    }

    /** world.reachable, answered once per (NPC, object) per tick. A world without it reaches everything. */
    _reachable(s, o) {
        if (typeof this.world.reachable !== 'function') return true;
        this._selectSearched = true;
        const key = `${s.npcId}\u0000${o.id}`;
        if (this.tickCache && this._reachCache?.has(key)) return this._reachCache.get(key);
        this.stats.pathSearches++;
        const avoidRooms = this._avoidRooms(s);
        const ok = !!(avoidRooms.length ? this.world.reachable(s.npcId, o, { avoidRooms }) : this.world.reachable(s.npcId, o));
        if (this.tickCache) (this._reachCache || (this._reachCache = new Map())).set(key, ok);
        return ok;
    }

    // ── room leash and private objects (OFFICE_LIFE_PLAN 7.2, slice 2a) ─────

    /**
     * The NPC's home room, from scenario data rather than the resolved home (which stays
     * provisional at the spawn point until the needsHome object loads): a coordinate home's room;
     * the resolved home's room; the needsHome object's room once it can be found; the spawn room.
     */
    _homeRoom(s) {
        const rec = this.world.getNpc(s.npcId) || {};
        const h = rec.needsHome;
        if (h && typeof h === 'object' && typeof h.room === 'string') return h.room;
        if (s.home && !s.home.provisional && s.home.roomId) return s.home.roomId;
        if (typeof h === 'string') {
            const o = this.world.getObject(h);
            if (o?.roomId) return o.roomId;
        }
        return rec.roomId || null;
    }

    /** May this NPC's needs not enter roomId? Its home room never is (the validator errors on that). */
    _roomForbidden(s, roomId) {
        if (!roomId) return false;
        const L = s.leash;
        let out = !!L && ((L.allow && !L.allow.has(roomId)) || L.deny.has(roomId));
        if (!out && typeof this.world.roomPrivateTo === 'function') {
            const priv = this.world.roomPrivateTo(roomId);
            out = Array.isArray(priv) && !priv.includes(s.npcId);
        }
        return out && roomId !== this._homeRoom(s);
    }

    /** Loaded rooms this NPC's routes must not enter (passed to reachable and moveTo). */
    _avoidRooms(s) {
        if (typeof this.world.roomIds !== 'function') return [];
        return (this.world.roomIds() || []).filter(r => this._roomForbidden(s, r)).sort();
    }

    /**
     * Owners of an object: affordance.owners, else screenOwner, else the first registered NPC
     * whose needsHome is the object (workstation-state's ownerOf rule, one owner).
     */
    _owners(o) {
        const aff = o.affordance || {};
        if (Array.isArray(aff.owners)) return aff.owners;
        if (typeof o.screenOwner === 'string' && o.screenOwner) return [o.screenOwner];
        for (const id of this.world.npcIds()) {
            if (this.world.getNpc(id)?.needsHome === o.id) return [id];
        }
        return [];
    }

    /** Room rules for any object; `private` only for a use (deliveries ignore it, OQ26). */
    _permitted(s, o, use) {
        if (this._roomForbidden(s, o.roomId)) return false;
        if (use && o.affordance?.private === true) return this._owners(o).includes(s.npcId);
        return true;
    }

    /** Nothing permitted was left: log and emit once per urgent episode of this need. */
    _noteLeash(s, key, data) {
        if (s.leashNoted[key]) return;
        s.leashNoted[key] = true;
        this._emitLeashed(s, { ...data, chose: undefined });
    }

    /** Only other owners' private objects were left: log once per urgent episode, no event. */
    _notePrivate(s, key, data) {
        if (s.privateNoted[key]) return;
        s.privateNoted[key] = true;
        this._log(s.npcId, 'private_skipped', { ...data, chose: undefined });
    }

    _emitLeashed(s, data) {
        this._log(s.npcId, 'leashed', data);
        const payload = { npcId: s.npcId };
        for (const [k, v] of Object.entries(data)) if (v !== undefined) payload[k] = v;
        payload.chose = data.chose || null;
        this._emit(`npc_needs_leashed:${s.npcId}`, payload);
    }

    _tickNpc(s) {
        const id = s.npcId;
        this._decay(s);

        const pos = this.world.npcPos(id);
        if (!pos) return; // sprite not loaded: decay only
        if (this._magnets.size) this._sight(s, pos);
        if (!s.home || (s.home.provisional && this.tickCount >= (s.homeRetryAt || 0))) this._updateHome(s, pos);

        const status = this.world.npcStatus(id) || {};
        if (status.ko || status.hostile || status.hidden) {
            if (!s.blocked) {
                if (s.job) this._abortJob(s, 'unavailable', { cancel: true });
                s.mode = 'idle';
                s.blocked = true;
                this._log(id, 'blocked');
            }
            return;
        }
        if (s.blocked) {
            s.blocked = false;
            this._log(id, 'unblocked');
            this._goHome(s);
        }
        if (s.scriptSuspended) { this._arrivals.delete(id); return; }

        if (this.world.inChatWith(id)) {
            if (s.mode !== 'frozen') {
                s.prevMode = s.mode;
                s.mode = 'frozen';
                if (s.job?.phase === 'using') s.job.useRemaining = Math.max(0, s.job.useUntil - this.clockMs);
                if (s.job) s.job.frozenAt = this.clockMs;
                this.world.cancelMove(id);
                this._arrivals.delete(id);
                this._log(id, 'frozen');
            }
            return;
        }
        if (s.mode === 'frozen') {
            s.mode = s.prevMode || 'idle';
            s.prevMode = null;
            this._log(id, 'unfrozen');
            if (s.mode === 'job' && s.job) {
                if (s.job.phase === 'using') s.job.useUntil = this.clockMs + (s.job.useRemaining || 0);
                else {
                    s.job.deadline += this.clockMs - (s.job.frozenAt || this.clockMs);
                    if (s.job.phase === 'queued') { s.job.queuedAt += this.clockMs - (s.job.frozenAt || this.clockMs); s.job.qCell = null; }
                    this._moveForPhase(s);
                }
            } else if (s.mode === 'returning') {
                this._goHome(s, { stayPut: s.atPost });   // at its post: the own-desk returning tick
            }
            return;
        }

        const arrived = this._arrivals.delete(id);

        // Coming back from a real leave: is the player at the desk? (once per return)
        if (s.mode === 'returning' && !s.atPost && !s.caughtEmitted) this._checkCaught(s, pos);

        if (s.mode === 'returning' && arrived) {
            s.mode = 'idle';
            // Only a real trip emits; a session at one's own post object never left it
            if (!s.atPost) {
                s.atPost = true;
                this._log(id, 'returned_post');
                this._emit(`npc_returned_post:${id}`, { npcId: id, ...this._playerProximity(id) });
                this._collectLeftItems(s);
            }
        }

        // Walking home and not getting anywhere (stopped to face the player): carry on
        if (s.mode === 'returning' && !s.atPost) this._watchReturn(s, pos);

        if (s.mode === 'job' && s.job?.windupUntil) {
            if (this.clockMs < s.job.windupUntil) return;
            s.job.windupUntil = 0;
            // Slice 18b-i: a magnet picked up, finished or emptied during the windup is a `gone`
            // turn-back now, not a silent no_approach failure (and its fail cooldown) on leaving
            if (s.job.magnet && (!this._shownMagnets()?.has(s.job.targetId) || this._servingsLeft(s.job.targetId) <= 0)) { this._turnBack(s, 'gone'); return; }
            this._leavePost(s);
            return;
        }

        if (s.mode === 'job') {
            this._advanceJob(s, arrived);
            return;
        }

        // Slice 18b-ii: a knower back in its own room passes the word on
        if (s.knows.size && this._magnets.size) this._tickNews(s, pos);

        // idle or returning: an urgent need may start a job
        if (this.selectBackoff && s.selectRetryAt && this.tickCount < s.selectRetryAt) return;
        this._selectSearched = false;
        const pick = this._select(s, pos);
        if (pick) {
            s.selectRetryAt = 0;
            this._startJob(s, pick);
        } else if (this.selectBackoff && this._selectSearched) {
            // A free target it could not reach, or an item with nowhere to take it: searching
            // again next tick would find the same. Waiting on a claimed target searches nothing
            // and keeps the 250 ms check.
            s.selectRetryAt = this.tickCount + SELECT_BACKOFF_TICKS;
            this.stats.backoffs++;
        }
    }

    _decay(s) {
        for (const name of Object.keys(s.needs)) {
            const n = s.needs[name];
            // Parked (slice 14): level held, decay paused, until the timer runs out
            if (s.parked[name]) {
                if (this.clockMs < s.parked[name].until) continue;
                this._unpark(s, name);
                continue;
            }
            if (s.job && s.job.need === name && s.job.phase === 'using') continue;
            const before = s.levels[name];
            s.levels[name] = clamp(before - n.decayPerMin * NEEDS_TICK_MS / 60000, 0, 100);
            const urgent = s.levels[name] <= n.urgentAt;
            if (urgent && !s.urgentFlag[name]) {
                s.urgentFlag[name] = true;
                s.selectRetryAt = 0;   // a newly urgent need is worth a look now
                this._log(s.npcId, 'urgent', { need: name, level: round2(s.levels[name]) });
                this._emit(`npc_need_urgent:${s.npcId}`, { npcId: s.npcId, need: name, level: round2(s.levels[name]) });
            } else if (!urgent) {
                s.urgentFlag[name] = false;
                s.leashNoted[name] = false;
                s.privateNoted[name] = false;
                s.mindChanged[name] = false;
            }
        }
    }

    _starved(s, name) {
        const n = s.needs[name];
        return !s.parked[name] && !!n.maxUnmetMin &&(this.clockMs - s.lastSatisfiedAt[name]) >= n.maxUnmetMin * 60000;
    }

    _claims(objectId, exceptNpc) {
        let c = 0;
        for (const o of this.states.values()) {
            if (o.npcId === exceptNpc || !o.job || o.job.phase === 'queued') continue;
            if (o.job.targetId === objectId) c++;
        }
        return c;
    }

    _itemClaimed(itemId, exceptNpc) {
        for (const o of this.states.values()) {
            if (o.npcId !== exceptNpc && o.job && o.job.itemId === itemId) return true;
        }
        return false;
    }

    _free(s, obj) {
        const cap = Math.max(1, Number(obj.affordance?.capacity) || 1);
        const claims = this._claims(obj.id, s.npcId);
        if (claims >= cap) return false;
        // Social compatibility (7.3): a shared object claimed by someone this NPC avoids, or who
        // avoids it, counts as full; the NPC waits rather than standing silently beside them
        if (cap >= 2 && claims > 0 && this._anyCompany) {
            for (const id of [...this.states.keys()].sort()) {
                const o = this.states.get(id);
                if (o === s || o.job?.targetId !== obj.id) continue;
                if (this._avoids(s, o)) { this._noteAvoided(s, o, obj); return false; }
            }
        }
        // A queue is waiting (slice 10): only its front may take the place that came free
        if (obj.affordance?.queue) {
            const q = this._queuers(obj.id);
            if (q.length && q[0] !== s) return false;
        }
        const cd = s.cooldowns[obj.id];
        return !(cd && cd > this.clockMs);
    }

    _nearest(list, pos) {
        let best = null, bestD = Infinity;
        for (const o of list) {
            const d = Math.hypot(o.x - pos.x, o.y - pos.y);
            if (d < bestD || (d === bestD && best && o.id < best.id)) { best = o; bestD = d; }
        }
        return best;
    }

    /**
     * Nearest candidate (straight-line, ties by id) that the NPC can actually walk
     * to. Candidates are tried nearest first so findWorldPath runs only until the
     * first hit. A world without `reachable` (the node stub) treats all as reachable.
     */
    _nearestReachable(s, list, pos) {
        const sorted = [...list].sort((a, b) => {
            const da = Math.hypot(a.x - pos.x, a.y - pos.y), db = Math.hypot(b.x - pos.x, b.y - pos.y);
            return da - db || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
        });
        for (const o of sorted) {
            if (this._reachable(s, o)) return o;
        }
        return null;
    }

    _anyUrgent(s) {
        for (const name of Object.keys(s.needs)) {
            if (s.levels[name] <= s.needs[name].urgentAt || this._starved(s, name)) return true;
        }
        return false;
    }

    /**
     * `exclude` (slice 14): { need, targetId } just turned back from; that object is left out of
     * this one selection for that need (the fallback chain). A need with no acceptable source is
     * parked here (_useCandidate sets `s.giveUp`).
     */
    _select(s, pos, exclude = null) {
        // Nothing urgent or starved and no interests: nothing to choose, so no object scan
        // ... and no due print errand (slice 17: Tom has no interests, so without this he never fetches)
        // ... and no known magnet in a need's tempt band (slice 18b-i)
        if (this.tickCache && !Object.keys(s.interests).length && !this._anyUrgent(s) && !this._dueErrand(s) && !this._tempting(s)) return null;
        this.stats.selects++;
        const objects = this._objects();
        let best = null;
        for (const name of Object.keys(s.needs)) {
            const n = s.needs[name];
            const starved = this._starved(s, name);
            const level = s.levels[name];
            // Slice 18b-i: a need inside a known magnet's tempt band (urgentAt < level <= urgentAt +
            // tempt, capped at 95, not starved, not parked) is "tempted": known magnets only, scored
            // against the raised threshold, and a quiet look (no leash or private notes, no parking)
            let thr = n.urgentAt, tempted = false;
            if (!(level <= n.urgentAt) && !starved) {
                const band = this._temptBand(s, name);
                if (!(band > 0 && level <= Math.min(95, n.urgentAt + band))) continue;
                thr = Math.min(95, n.urgentAt + band);
                tempted = true;
            }
            const score = starved ? 1000 + n.weight : n.weight * (thr - level) / thr;
            if (best && !(score > best.score)) continue;
            s.giveUp = null;
            const excludeId = exclude?.need === name ? exclude.targetId : null;
            let cand = null;
            // A known magnet first (an urgent need prefers it, OQ36), then the usual sources
            const mags = this._magnets.size ? this._magnetsFor(s, name, tempted) : null;
            if (mags?.length) cand = this._useCandidate(s, name, mags, pos, excludeId, true);
            s.giveUp = null;
            if (tempted) {
                if (!cand) { this._selectSearched = true; continue; }   // the quiet look's back-off
            } else if (!cand) cand = this._useCandidate(s, name, objects, pos, excludeId);
            if (cand) best = { ...cand, need: name, score, ...(tempted ? { tempted: true } : {}) };
            else if (s.giveUp && !exclude?.noPark) this._park(s, name, s.giveUp);
            s.giveUp = null;
        }
        // Interests: a reachable item with the tag is the stimulus. No item, no
        // option (the NPC holds still); an item scores the flat interest weight.
        for (const tag of Object.keys(s.interests)) {
            const it = s.interests[tag];
            if (best && !(it.weight > best.score)) continue;
            const cand = this._carryCandidate(s, tag, it, objects, pos);
            if (cand) best = { ...cand, need: null, score: it.weight };
        }
        // A due print errand (slice 17): scored like an interest, printHabit.weight (default 2)
        if (this._prints.size) {
            const e = this._errandCandidate(s);
            if (e && (!best || e.score > best.score)) best = e;
        }
        return best;
    }

    _useCandidate(s, name, objects, pos, excludeId = null, quiet = false) {
        // A switched-off source (affordance.offWhen, slice 18a) is no candidate at all; nor (18b-i) a
        // hidden object (revealOnGlobal not true), nor a magnet this NPC does not know of or that is
        // gone or empty. quiet: a magnet look that found nothing notes nothing and parks nothing.
        const sat = objects.filter(o => o.affordance && asList(o.affordance.satisfies).includes(name) && o.id !== excludeId && !this._isOff(o)
            && !this._hidden(o) && !this._magnetBarred(s, o));
        const free = sat.filter(o => this._free(s, o));
        // Room leash and private objects, before the home preference (OFFICE_LIFE_PLAN 7.2)
        let opts = free.filter(o => this._permitted(s, o, true));
        // Unacceptable targets (slice 14): someone avoided at, queued for or near the object; a
        // story need (deferrable: false) takes no notice and goes anyway (the bubble shows it)
        const deferrable = this._deferrable(s, name);
        const avoidOf = new Map();
        const avoidedAt = (o) => {
            if (!avoidOf.has(o.id)) avoidOf.set(o.id, this._avoidedAt(s, o));
            return avoidOf.get(o.id);
        };
        const social = this._avoidRadius(s) > 0;
        const ctx = { exclude: excludeId, avoidedAt: deferrable && social ? avoidedAt : null, balked: deferrable ? new Set() : null };
        const allOpts = opts;
        if (ctx.avoidedAt) opts = opts.filter(o => !avoidedAt(o));
        // Only a room rule makes a choice "leashed"; another owner's private object is expected
        // to be passed over (colleagues' desks), so it is logged as private_skipped instead
        let skipped = null, priv = null;
        if (free.length > allOpts.length) {
            for (const o of free) {
                if (allOpts.includes(o)) continue;
                if (this._roomForbidden(s, o.roomId)) (skipped || (skipped = [])).push(o.id);
                else (priv || (priv = [])).push(o.id);
            }
        }
        const nothing = () => {
            if (quiet) return null;
            if (skipped) this._noteLeash(s, name, { need: name, skipped });
            if (priv) this._notePrivate(s, name, { need: name, skipped: priv });
            s.giveUp = this._giveUpReason(s, sat, pos, ctx);
            return null;
        };
        const withAnyway = (pick) => {
            // A story need heading for someone it avoids: the face bubble on the way
            if (!deferrable && social) { const who = avoidedAt(this.world.getObject(pick.targetId) || { id: pick.targetId }); if (who) pick.goingAnyway = who; }
            return pick;
        };
        const queued = () => {
            const q = this._queueCandidate(s, name, objects, pos, ctx);
            if (!q) return nothing();
            if (skipped) q.leashed = skipped;
            if (priv) q.privateSkipped = priv;
            return withAnyway(q);
        };
        if (!opts.length) return queued();
        // Prefer the NPC's own post object (needsHome) when it satisfies this need
        // and is reachable, so a person works at their own desk rather than the
        // nearest free one. Only bites when the home object is among the options
        // (e.g. the work need at an own-desk PC); other needs fall back to nearest.
        const homeObj = s.home?.objectId ? opts.find(o => o.id === s.home.objectId) : null;
        const target = (homeObj && this._reachable(s, homeObj))
            ? homeObj : this._nearestReachable(s, opts, pos);
        if (!target) return queued();
        const pick = { kind: 'use', targetId: target.id };
        if (target.affordance.offWhen !== undefined) pick.offWhen = target.affordance.offWhen;
        if (skipped && !quiet) pick.leashed = skipped;
        if (priv && !quiet) pick.privateSkipped = priv;
        return withAnyway(pick);
    }

    // ── avoidance at a distance, balking, parked needs (slice 14: OFFICE_LIFE_PLAN 10) ──

    _rec(s) {
        return this.world.getNpc(s.npcId) || {};
    }

    /** needsCompany.avoidRadius in tiles; default 2 only when the NPC declares avoids, else 0 (slice 8 only). */
    _avoidRadius(s) {
        const c = this._company(s);
        if (!c) return 0;
        if (c.avoidRadius !== undefined && c.avoidRadius !== null && Number.isFinite(Number(c.avoidRadius))) return clamp(Number(c.avoidRadius), 0, 10);
        return Array.isArray(c.avoids) && c.avoids.length ? AVOID_RADIUS_TILES : 0;
    }

    /** maxQueue: refuse to join a line with this many or more already in it; null = no limit. */
    _maxQueue(s) {
        const v = this._rec(s).maxQueue;
        if (v === undefined || v === null || !Number.isFinite(Number(v))) return null;
        return Math.max(0, Math.floor(Number(v)));
    }

    _deferMs(s) {
        const v = Number(this._rec(s).needsDeferMin);
        return (Number.isFinite(v) && v > 0 ? clamp(v, 0.1, 120) : NEEDS_DEFER_MIN) * 60000;
    }

    /** Read from the NPC's record each time, so a live check can flip it. Default true. */
    _deferrable(s, need) {
        return this._rec(s).needs?.[need]?.deferrable !== false;
    }

    /**
     * The first NPC (id order) that this one avoids, or that avoids it, and that is using `obj`,
     * holds a place in its queue, or stands (same room, not hidden) within this NPC's avoidRadius
     * of its approach cell; null if none, or with radius 0. Any NPC counts, needs or not. The
     * NPC's own post object (needsHome) is exempt: nobody abandons their own desk for a passer-by.
     */
    _avoidedAt(s, obj) {
        const r = this._avoidRadius(s);
        if (r <= 0 || !obj) return null;
        if (s.home?.objectId && s.home.objectId === obj.id) return null;
        let cell = null, cellDone = false;
        for (const id of [...this.world.npcIds()].sort()) {
            if (id === s.npcId) continue;
            const o = this.states.get(id) || { npcId: id };
            if (!this._avoids(s, o)) continue;
            const j = o.job;
            if (j && j.targetId === obj.id && (j.phase === 'using' || j.phase === 'queued')) return id;
            const p = this.world.npcPos(id);
            if (!p) continue;
            if (p.roomId && obj.roomId && p.roomId !== obj.roomId) continue;
            const st = this.world.npcStatus(id) || {};
            if (st.hidden || st.ko) continue;
            if (!cellDone) { cell = this.world.approachCell(obj); cellDone = true; }
            if (cell && Math.hypot(p.x - cell.x, p.y - cell.y) <= r * 32 + 0.5) return id;
        }
        return null;
    }

    /** Would joining obj's queue break this NPC's maxQueue? */
    _balks(s, obj) {
        const m = this._maxQueue(s);
        if (m === null) return false;
        return this._queuers(obj.id).filter(o => o !== s).length >= m;
    }

    /**
     * Why a need found nothing, or null to wait as before. A source that is only busy (claimed,
     * cooling down) means wait; one an avoided NPC is at, or one whose queue is too long, means
     * give up with that reason (the nearest such source's); none permitted means the leash rule
     * (unchanged, no parking); nothing at all, or nothing reachable, means `no_source`.
     */
    _giveUpReason(s, sat, pos, ctx) {
        const permitted = sat.filter(o => this._permitted(s, o, true));
        if (sat.length && !permitted.length) return null;
        const sorted = [...permitted].sort((a, b) => {
            const da = Math.hypot(a.x - pos.x, a.y - pos.y), db = Math.hypot(b.x - pos.x, b.y - pos.y);
            return da - db || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
        });
        let rejected = null, busy = false;
        for (const o of sorted) {
            const who = ctx.avoidedAt ? ctx.avoidedAt(o) : null;
            if (who) { rejected = rejected || { reason: 'avoid', avoidedId: who, targetId: o.id }; continue; }
            if (ctx.balked?.has(o.id)) { rejected = rejected || { reason: 'queue', targetId: o.id }; continue; }
            if (!this._free(s, o)) busy = true;
        }
        if (busy) return null;
        return rejected || { reason: 'no_source' };
    }

    /** Give up on a need for now: level held at urgentAt + 1, decay and the unmet clock paused. */
    _park(s, name, why) {
        const n = s.needs[name];
        const until = this.clockMs + this._deferMs(s);
        s.parked[name] = { reason: why.reason, until, since: this.clockMs, avoidedId: why.avoidedId || null };
        s.levels[name] = clamp(n.urgentAt + 1, 0, 100);
        this._log(s.npcId, 'parked', { need: name, reason: why.reason, avoided: why.avoidedId || undefined, target: why.targetId || undefined });
        this._emit(`npc_need_parked:${s.npcId}`, {
            npcId: s.npcId, need: name, reason: why.reason, targetId: why.targetId || null,
            ...(why.avoidedId ? { avoidedId: why.avoidedId } : {}), untilMs: until - this.clockMs
        });
    }

    /** Timer up (or woken): urgent again at exactly urgentAt, retried on this tick's select. */
    _unpark(s, name, why = null) {
        const p = s.parked[name];
        delete s.parked[name];
        s.lastSatisfiedAt[name] += this.clockMs - p.since;
        s.levels[name] = s.needs[name].urgentAt;
        s.selectRetryAt = 0;
        this._log(s.npcId, 'unparked', { need: name, reason: why || (p.woken ? 'woken' : 'timer') });
    }

    /** A room loaded or a door opened: every parked need retries soon, one NPC after another. */
    _wakeParked() {
        let k = 0;
        for (const id of [...this.states.keys()].sort()) {
            const s = this.states.get(id);
            const names = Object.keys(s.parked).sort();
            if (!names.length) continue;
            const at = this.clockMs + WAKE_BASE_MS + k * WAKE_STEP_MS;
            k++;
            for (const name of names) {
                const p = s.parked[name];
                if (at < p.until) { p.until = at; p.woken = true; }
            }
        }
    }

    /** Slice 18b-ii (OQ35): learning of a magnet wakes this NPC's parked needs it satisfies, and no others. */
    _wakeParkedFor(s, needs) {
        const at = this.clockMs + WAKE_BASE_MS;
        for (const name of needs) {
            const p = s.parked[name];
            if (p && at < p.until) { p.until = at; p.woken = true; }
        }
    }

    /**
     * While walking to a target or queued for it: an avoided NPC arriving, joining or coming
     * within the radius turns this one back, at most once per need episode (until the need is
     * met). Acts on a change only. A story need, or a second time, goes on with the bubble.
     */
    _recheck(s) {
        const job = s.job;
        if (!job.need || job.kind !== 'use' || this._avoidRadius(s) <= 0) return false;
        const obj = this.world.getObject(job.targetId);
        const who = obj ? this._avoidedAt(s, obj) : null;
        if ((who || '') === (job.avoidSig || '')) return false;
        job.avoidSig = who || '';
        job.goingAnyway = null;
        if (!who) return false;
        if (!this._deferrable(s, job.need) || s.mindChanged[job.need] || (job.tempted && s.temptBack[job.need])) { job.goingAnyway = who; return false; }
        this._turnBack(s, 'avoid', who);
        return true;
    }

    /** One turn-back for every reason; what each does is the TURN_BACK table (slice 18a). */
    _turnBack(s, reason, avoidedId) {
        const id = s.npcId;
        const rule = TURN_BACK[reason] || TURN_BACK.avoid;
        const { need, targetId } = s.job;
        const tempted = !!s.job.tempted;   // slice 18b-i: a tempted job never parks
        if (rule.mindChanged && need) s.mindChanged[need] = true;
        if (rule.mindChanged && need && tempted) s.temptBack[need] = true;   // _decay clears mindChanged above urgentAt
        s.turnCount++;
        const topic = rule.grumble ? this._grumbleTopic(s, reason) : undefined;
        this._log(id, 'turned_back', { need, target: targetId, reason, avoided: avoidedId || undefined, grumble: topic });
        this._emit(`npc_turned_back:${id}`, { npcId: id, need, targetId, reason, ...(avoidedId ? { avoidedId } : {}), ...this._playerProximity(id) });
        // The grumble's speech bubble hides the thought bubble, so the face shows after the line
        if (rule.grumble) this._grumble(s, targetId, reason, topic);
        const said = s.saying && s.saying.until > this.clockMs ? s.saying.until - this.clockMs : 0;
        if (avoidedId) s.avoidShow = { npcId: avoidedId, until: this.clockMs + said + AVOID_BUBBLE_MS };
        this._abortJob(s, 'turned_back', { cancel: true });
        // Fallback chain: the next acceptable source for the same need, else the need parks
        if (rule.fallback && need) {
            const pos = this.world.npcPos(id);
            const pick = pos ? this._select(s, pos, { need, targetId, noPark: !rule.parks || tempted }) : null;
            if (pick) { this._startJob(s, pick); return; }
        }
        this._goHome(s);
    }

    /**
     * One line from the `grumble` pool as a speech bubble (getState().talking), seeded by the
     * turn-back count. Overheard like a chat line (npc_overheard); no npc_chatted (it is no chat).
     */
    _grumble(s, objectId, reason = 'avoid', chosen = null) {
        // Slice 18a: the topic is chosen before _pickBark, by lines: grumble_<reason> when that pool
        // has lines, else grumble when it has (the lab's spoken grumbles), else grumble_<reason>'s
        // picture. _pickBark gives a picture, never null, for a topic with no lines, so it cannot be
        // tried and fallen back from. An off or gone picture is the need's own icon.
        const topic = chosen || this._grumbleTopic(s, reason);
        const need = s.job?.need;
        const icons = reason !== 'avoid' && NEED_ICONS.includes(need) ? [need] : null;
        const pick = this._pickBark(s, topic, { icons });
        if (!pick) return;
        this._showSaying(s, pick, topic, objectId);
    }

    /** A one-off line or picture over one NPC (a grumble, an announce): bubble, voice, npc_overheard. */
    _showSaying(s, pick, topic, objectId) {
        const { line, idx, picture, pool } = pick;
        const until = this.clockMs + (picture ? PICTURE_MS : bubbleMs(line));
        s.saying = { line, picture, topic, objectId, until };
        const radius = pool.overhearRadius || OVERHEAR_RADIUS;
        const h = typeof this.world.playerHears === 'function' ? (this.world.playerHears(s.npcId, radius) || {}) : {};
        if (line) this._speak(s.npcId, line, until, { topic, objectId, overheard: !!h.overheard });
        if (h.overheard) {
            this._emit(`npc_overheard:${s.npcId}`, {
                speakerId: s.npcId, partnerId: null, topic, lineId: picture ? `picture:${picture}` : `${topic}:${idx}`, line, picture, objectId,
                overheard: true, playerDistance: Number.isFinite(h.distance) ? Math.round(h.distance) : null
            });
        }
    }

    /** The grumble topic for a turn-back reason (slice 18a): chosen by which pools have lines. */
    _grumbleTopic(s, reason) {
        const own = `grumble_${reason}`;
        const lines = t => chatterPool(t, this._scenarioChatter(), this._rec(s).chatter).lines.length > 0;
        if (reason !== 'avoid' && lines(own)) return own;
        if (lines('grumble')) return 'grumble';
        return PICTURE_CHATTER[own] ? own : 'grumble';
    }

    // ── voiced chatter: bag, cooldown, speech lock, picture chat (slice 15) ──

    /** The next line index from this NPC's bag for a topic: no repeat until the bag is empty. */
    _bagNext(npcId, topic, lines) {
        const key = `${npcId}|${topic}`;
        const sig = lines.join('\n');
        let b = this._bags.get(key);
        if (!b || b.sig !== sig) { b = { sig, order: [], round: 0, last: -1 }; this._bags.set(key, b); }
        if (!b.order.length) b.order = bagOrder(lines.length, createSeededRng(hash32(`${this.seed}:${key}:bag:${b.round++}`)), b.last);
        b.last = b.order.shift();
        return b.last;
    }

    _cooldownMs(s) {
        const v = Number(this._rec(s).chatterCooldownMin);
        return (Number.isFinite(v) && v >= 0 ? v : CHATTER_COOLDOWN_MIN) * 60000;
    }

    _speechFree() {
        return this.clockMs >= this._speechUntil;
    }

    /**
     * What a speaker says on a turn: a bark from the bag when it has lines, is off cooldown and the
     * speech lock is free; otherwise a picture. Returns { line, idx, picture, pool } or null (silent:
     * `"chatter": false` and nothing to say). Taking a bark starts the cooldown.
     */
    _pickBark(s, topic, { waitForLock = false, ignoreCooldown = false, icons: iconsFor = null } = {}) {
        const pool = chatterPool(topic, this._scenarioChatter(), this._rec(s).chatter);
        const ready = pool.lines.length && (ignoreCooldown || !(s.chatterQuietUntil > this.clockMs));
        if (ready && this._speechFree()) {
            const idx = this._bagNext(s.npcId, topic, pool.lines);
            s.chatterQuietUntil = this.clockMs + this._cooldownMs(s);
            return { line: pool.lines[idx], idx, picture: null, pool };
        }
        if (ready && waitForLock) return { wait: true, pool };
        if (!pool.pictures) return null;
        const icons = iconsFor || pictureIcons(topic);
        s.pictureN = (s.pictureN || 0) + 1;
        return { line: null, idx: -1, picture: icons[(s.pictureN - 1) % icons.length], pool };
    }

    /** A voiced line: take the speech lock until it ends and hand it to the world to speak. */
    _speak(npcId, line, until, info) {
        this._speechUntil = Math.max(this._speechUntil, until);
        if (typeof this.world.speak === 'function') {
            try { this.world.speak(npcId, line, { ...info, ms: until - this.clockMs }); } catch (e) { /* audio never breaks a tick */ }
        }
    }

    // ── scripted exchanges (slice 15, OFFICE_LIFE_PLAN 11.4) ────────────────

    _exchangeHeard(knot) {
        return this._exPlayed.has(knot) || this._globalHolds(`heard_${knot}`);
    }

    /** Does an exchanges[] entry's `with` name the other NPC (an id or "group:<name>")? */
    _exchangeWith(entry, other) {
        const w = entry?.with;
        if (typeof w !== 'string' || !w) return false;
        if (w === other.npcId) return true;
        return w.startsWith('group:') && this._groups(other).includes(w.slice(6));
    }

    /**
     * The first unplayed exchange for this pair whose speakers are exactly the two of them, or null.
     * The lower id's list is read first. Lines come from the world (a separate ink story instance);
     * null lines (story not loaded yet) give { pending: true }, so a later turn tries again.
     */
    _findExchange(A, B) {
        let pending = false;
        for (const [own, other] of [A, B].sort((x, y) => (x.npcId < y.npcId ? -1 : 1)).map((x, i, arr) => [x, arr[1 - i]])) {
            const list = this._rec(own).exchanges;
            if (!Array.isArray(list)) continue;
            for (const e of list) {
                if (!e || typeof e.knot !== 'string' || !e.knot || !this._exchangeWith(e, other)) continue;
                if (this._exchangeHeard(e.knot)) continue;
                if (e.requireGlobal !== undefined && !this._globalHolds(e.requireGlobal)) continue;
                const lines = typeof this.world.exchangeLines === 'function' ? this.world.exchangeLines(own.npcId, e.knot) : null;
                if (lines === null || lines === undefined) { pending = true; continue; }
                if (!Array.isArray(lines) || !lines.length) continue;
                if (!lines.every(l => l && typeof l.text === 'string' && (l.speakerId === A.npcId || l.speakerId === B.npcId))) continue;
                return { knot: e.knot, ownerId: own.npcId, lines: lines.map(l => ({ speakerId: l.speakerId, text: l.text })), i: 0 };
            }
        }
        return pending ? { pending: true } : null;
    }

    /** Is the player in earshot of the pair (slice 8 `overheard`: same room, lit, in range, clear line)? */
    _audience(c, radius) {
        if (typeof this.world.playerHears !== 'function') return false;
        return [c.a, c.b].some(id => !!(this.world.playerHears(id, radius) || {}).overheard);
    }

    /** Start an exchange on a chat: hold both uses for the knot's length (capped). */
    _startExchange(c, ex, A, B) {
        let total = 0;
        for (const l of ex.lines) total += exchangeLineMs(l.text) + CHAT_GAP_MS;
        const end = this.clockMs + Math.min(total, EXCHANGE_MAX_MS);
        if (A.job && A.job.useUntil < end) A.job.useUntil = end;
        if (!c.queue && B.job && B.job.useUntil < end) B.job.useUntil = end;
        c.ex = ex;
        this._log(ex.ownerId, 'exchange_started', { knot: ex.knot, with: ex.ownerId === c.a ? c.b : c.a });
    }

    _finishExchange(c) {
        const ex = c.ex;
        c.ex = null;
        c.exDone = true;
        this._exPlayed.add(ex.knot);
        if (typeof this.world.setGlobal === 'function') {
            try { this.world.setGlobal(`heard_${ex.knot}`, true); } catch (e) { /* keep the session flag */ }
        }
        this._log(ex.ownerId, 'exchange_heard', { knot: ex.knot });
        this._emit(`npc_exchange_heard:${ex.knot}`, { knot: ex.knot, ownerId: ex.ownerId, npcIds: [c.a, c.b].sort(), objectId: c.objectId });
    }

    _carryCandidate(s, tag, it, objects, pos) {
        const rooms = it.noticeRooms || (s.home?.roomId ? [s.home.roomId] : (pos.roomId ? [pos.roomId] : []));
        const items = objects.filter(o => o.needsTag === tag && o.pickable && rooms.includes(o.roomId)
            && !this._itemClaimed(o.id, s.npcId) && !(s.cooldowns[o.id] > this.clockMs) && this._permitted(s, o, false)
            && !this._reservedFrom(o.id, s.npcId));   // slice 17: someone else's printout
        const item = this._nearestReachable(s, items, pos);
        if (!item) return null;
        // Deliveries honour the room rules only: `private` limits uses, not drops (OQ26)
        const targets = objects.filter(o => o.affordance && asList(o.affordance.accepts).includes(tag) && this._free(s, o)
            && this._permitted(s, o, false));
        if (!targets.length) return null;
        const homeObj = s.home?.objectId ? targets.find(t => t.id === s.home.objectId) : null;
        const target = (homeObj && this._reachable(s, homeObj))
            ? homeObj : this._nearestReachable(s, targets, item);
        if (!target) return null;
        return { kind: 'carry', targetId: target.id, itemId: item.id, tag };
    }

    _startJob(s, pick) {
        const id = s.npcId;
        s.job = {
            need: pick.need, kind: pick.kind, targetId: pick.targetId,
            itemId: pick.itemId || null, tag: pick.tag || null,
            phase: pick.kind === 'carry' ? 'goto_item' : (pick.queue ? 'queued' : 'goto_target'),
            startedAt: this.clockMs, deadline: 0, useUntil: 0, carrying: false
        };
        if (pick.offWhen !== undefined) s.job.offWhen = pick.offWhen;   // slice 18a: checked on the way
        if (pick.tempted) s.job.tempted = true;   // slice 18b-i: recorded now, the level may decay on the way
        const mag = pick.kind === 'use' ? this._magnets.get(pick.targetId) : null;
        if (mag) { s.job.magnet = true; s.job.aff = mag.aff; }   // kept: a finished or picked-up magnet is gone
        if (pick.queue) { s.job.qSeq = this._queueSeq++; s.job.queuedAt = this.clockMs; s.job.qCell = null; s.job.qArrived = false; }
        s.avoidNoted = {};   // a new episode: npc_avoided may fire again next time
        if (pick.goingAnyway) { s.job.goingAnyway = pick.goingAnyway; s.job.avoidSig = pick.goingAnyway; }   // slice 14
        if (pick.leashed) s.job.leashed = true;   // the debug overlay's "leashed" label
        if (pick.privateSkipped) s.job.privateSkipped = true;   // the overlay's "private" label
        // For the action icons (OFFICE_LIFE_PLAN 9.1): a use that prints, a carry to a stow target
        // Slice 17: a print hook's chance is rolled here, so the icon never promises a print the job
        // will not make, nor a fetch when the producer has no free or recyclable slot
        if (pick.kind === 'use') {
            const hook = this.world.getNpc(id)?.onUse?.[pick.targetId];
            if (hook?.revealOutput) {
                const n = s.useCounts[pick.targetId] || 0;
                s.useCounts[pick.targetId] = n + 1;
                const chance = Number(hook.chance);
                const prints = !(Number.isFinite(chance) && chance < 1) || this.roll(id, `print:${n}`) < Math.max(0, chance);
                if (prints) {
                    s.job.printTo = hook.revealOutput;
                    if (this._slotAvailable(hook.revealOutput)) s.job.prints = true;
                }
            }
        }
        if (pick.errand) {
            s.job.errand = true;
            s.job.viaCommand = !!pick.viaCommand;
            const p = this._prints.get(pick.itemId);
            if (p) p.errand = true;
        }
        if (pick.kind === 'carry') {
            if (this.world.getObject(pick.targetId)?.affordance?.onDeliver === 'stow') s.job.stowAt = true;
            if (this.world.getObject(pick.itemId)?.slot) s.job.slot = true;   // known from the start, so the wind-up shows "file" too
        }
        s.mode = 'job';
        this._log(id, 'job_start', { need: pick.need || undefined, tag: pick.tag || undefined, target: pick.targetId, item: pick.itemId || undefined });
        if (pick.queue) {
            const place = this._queuers(pick.targetId).indexOf(s) + 1;
            this._log(id, 'queued', { need: pick.need || undefined, target: pick.targetId, place });
            this._emit(`npc_queued:${pick.targetId}`, { npcId: id, objectId: pick.targetId, need: pick.need, place, ...this._playerProximity(id) });
        }
        if (pick.leashed) this._emitLeashed(s, { need: pick.need || undefined, skipped: pick.leashed, chose: pick.targetId });
        if (pick.privateSkipped) this._log(id, 'private_skipped', { need: pick.need || undefined, skipped: pick.privateSkipped, chose: pick.targetId });
        // Pre-action tell: a short wind-up while the NPC is still at its post, so the
        // leaving-desk window is catchable. world.windupMs() is 0 in stub worlds (no wind-up).
        const windup = s.atPost && !this._atOwnPost(s) ? Math.max(0, Number(this.world.windupMs?.() || 0)) : 0;
        if (windup > 0) {
            s.job.windupUntil = this.clockMs + windup;
            this._log(id, 'windup', { target: pick.targetId });
            this._emit(`npc_action_windup:${id}`, { npcId: id, need: pick.need, targetId: pick.targetId, tag: pick.tag || null, ms: windup });
            return;
        }
        this._leavePost(s);
    }

    /** True while the current job is a `use` of the NPC's own needsHome object: they stay at their post. */
    _atOwnPost(s) {
        const j = s.job;
        return !!(j && j.kind === 'use' && s.home?.objectId && j.targetId === s.home.objectId);
    }

    _leavePost(s) {
        const id = s.npcId;
        if (s.atPost && !this._atOwnPost(s)) {
            s.atPost = false;
            s.caughtEmitted = false;
            s.leaveCount++;
            const left = this._leaveItemsBehind(s);
            this._emit(`npc_left_post:${id}`, {
                npcId: id, need: s.job.need, targetId: s.job.targetId,
                expectedAwayMs: this._expectedAwayMs(s), ...this._playerProximity(id),
                ...(left.length ? { leftBehind: left } : {})
            });
        }
        this._moveForPhase(s);
    }

    /**
     * Left-behind items (OFFICE_LIFE_PLAN 2.10, slice 11): on a real leave, each declared item with
     * leftBehindBy this NPC is shown at the post when a seeded roll falls under its
     * leftBehindChance. The roll is keyed on the leave count and the item id, so a day replays the
     * same. A world without leftBehindItems (the plain stubs) has none, and the log is unchanged.
     */
    _leaveItemsBehind(s) {
        const out = [];
        if (typeof this.world.leftBehindItems !== 'function') return out;
        for (const it of this.world.leftBehindItems(s.npcId) || []) {
            const chance = clamp(Number(it?.chance) || 0, 0, 1);
            if (!it?.id || chance <= 0) continue;
            if (this.roll(s.npcId, `left:${s.leaveCount}:${it.id}`) >= chance) continue;
            if (!this.world.revealLeftBehind?.(it.id, s.npcId)) continue;
            s.leftItems.push(it.id);
            out.push(it.id);
            this._log(s.npcId, 'left_behind', { item: it.id, leave: s.leaveCount });
        }
        if (out.length) this._worldChanged();
        return out;
    }

    /**
     * Back at the post: the owner picks up what it left (stow: hidden at its spot, global false, no
     * server call), so a later leave can show it again. One the player took is gone for good:
     * logged and emitted once, so a scenario can map the owner noticing.
     */
    _collectLeftItems(s) {
        if (!s.leftItems.length) return;
        const items = s.leftItems.splice(0);
        for (const itemId of items) {
            if (this.world.stowSlot?.(itemId)) {
                this._log(s.npcId, 'stowed', { item: itemId, reason: 'collected' });
            } else {
                this._log(s.npcId, 'left_item_gone', { item: itemId });
                this._emit(`npc_left_item_gone:${s.npcId}`, { npcId: s.npcId, itemId, ...this._playerProximity(s.npcId) });
            }
        }
        this._worldChanged();
    }

    /**
     * Rough length of this absence: straight-line walk out and back at the NPC's needs speed (via
     * the item for a carry) plus the target's dwell. Queued (slice 11): plus one dwell per
     * place in the line, shared across the machine's capacity. A lower bound: paths round
     * furniture make the real absence longer.
     */
    _expectedAwayMs(s) {
        const job = s.job;
        const start = this.world.npcPos(s.npcId) || s.home;
        if (!job || !start) return null;
        const cellOf = (oid) => { const o = this.world.getObject(oid); return o ? { o, c: this.world.approachCell(o) } : null; };
        const legs = [start];
        if (job.kind === 'carry' && job.itemId) { const it = cellOf(job.itemId); if (it?.c) legs.push(it.c); }
        const t = cellOf(job.targetId);
        if (!t?.c) return null;
        legs.push(t.c, s.home || start);
        let dist = 0;
        for (let i = 1; i < legs.length; i++) dist += Math.hypot(legs[i].x - legs[i - 1].x, legs[i].y - legs[i - 1].y);
        const speed = Math.max(1, Number(this.world.speedFor(s.npcId)) || 80);
        const secs = Number(t.o.affordance?.useSeconds);
        // A print errand never enters `using` (slice 17): no dwell at the desk
        const useMs = job.errand ? 0 : (Number.isFinite(secs) ? clamp(secs, 0, 600) : 20) * 1000;
        let waitMs = 0;
        if (job.phase === 'queued') {
            const line = this._queuers(job.targetId);
            const place = line.includes(s) ? line.indexOf(s) + 1 : line.length + 1;
            const cap = Math.max(1, Number(t.o.affordance?.capacity) || 1);
            waitMs = Math.ceil(place / cap) * useMs;
        }
        return Math.round(dist / speed * 1000 + useMs + waitMs);
    }

    /**
     * While an NPC walks back from a real leave and is in its home room: the player within 1.5
     * tiles of the home object's approach cell, or with a minigame open on that object, emits
     * npc_caught_at_post:<npcId> once per return. Needs world.playerAtPost (absent: never).
     */
    _checkCaught(s, pos) {
        const home = s.home;
        if (!home?.objectId || typeof this.world.playerAtPost !== 'function') return;
        if (home.roomId && pos?.roomId && pos.roomId !== home.roomId) return;
        const p = this.world.playerAtPost(s.npcId, home) || {};
        const near = Number.isFinite(p.distance) && p.distance <= CAUGHT_RADIUS;
        if (!near && !p.inMinigame) return;
        s.caughtEmitted = true;
        s.caughtAt = this.clockMs;   // getState().noticed for NOTICED_MS (the action icons)
        const playerDistance = Number.isFinite(p.distance) ? Math.round(p.distance) : null;
        this._log(s.npcId, 'caught_at_post', { target: home.objectId, playerDistance, inMinigame: !!p.inMinigame });
        this._emit(`npc_caught_at_post:${s.npcId}`, { npcId: s.npcId, objectId: home.objectId, playerDistance, inMinigame: !!p.inMinigame });
    }

    _moveForPhase(s) {
        const id = s.npcId;
        const job = s.job;
        const destId = job.phase === 'goto_item' ? job.itemId : job.targetId;
        const obj = this.world.getObject(destId);
        let cell = obj ? this.world.approachCell(obj) : null;
        if (!cell) { this._failJob(s, 'no_approach'); return; }
        if (job.phase === 'queued') {
            const place = this._queuePlace(s, obj);
            if (!place) { this._leaveQueue(s, 'no_queue_cell'); return; }
            cell = place.cell;
            job.qCell = `${Math.round(cell.x)},${Math.round(cell.y)}`;
            job.qArrived = false;
        }
        // A shared object (capacity 2+) someone else is already headed for: stand beside them, so
        // the two can face each other (slice 8). Only a world with besideCell (the live adapter).
        if (job.phase === 'goto_target' && typeof this.world.besideCell === 'function'
            && (Number(obj.affordance?.capacity) || 1) >= 2) {
            const taken = [];
            for (const o of this.states.values()) {
                if (o !== s && o.job?.targetId === job.targetId && o.job.dest) taken.push(o.job.dest);
            }
            if (taken.some(d => Math.hypot(d.x - cell.x, d.y - cell.y) <= HOME_EPS)) {
                const alt = this.world.besideCell(cell, taken);
                if (alt) cell = alt;
            }
        }
        const pos = this.world.npcPos(id) || cell;
        const speed = this.world.speedFor(id);
        const dist = Math.hypot(cell.x - pos.x, cell.y - pos.y);
        job.deadline = this.clockMs + Math.max(20000, 3 * dist / speed * 1000);
        job.dest = { x: cell.x, y: cell.y };
        // Own-desk work never moves the NPC: seated, its body sits ~30 px off the home cell, and a
        // move would stand it up (goToAndStay unseats)
        if (dist <= HOME_EPS || (s.atPost && this._atOwnPost(s))) { this._arrivals.add(id); return; }
        // arriveWithin: walk on to the cell itself (the behaviour layer's default stops a tile short)
        this.world.moveTo(id, cell.x, cell.y, speed, { yieldToPlayer: false, avoidRooms: this._avoidRooms(s), arriveWithin: 6 });
    }

    _advanceJob(s, arrived) {
        const id = s.npcId;
        const job = s.job;
        // Slice 17: the print errand's leg back to the desk is the return. _checkCaught has no
        // once-per-return guard of its own, and the errand holds job.errand from its start
        if (job.errand && job.carrying && !s.atPost && !s.caughtEmitted) this._checkCaught(s, this.world.npcPos(id));
        // Slice 18a: the target was switched off while on the way or in its queue. Not in _recheck,
        // which returns at once for an NPC with no avoidance radius. One already using it finishes.
        if ((job.phase === 'goto_target' || job.phase === 'queued') && job.kind === 'use' && job.offWhen !== undefined
            && this._globalHolds(job.offWhen)) {
            const rec = this._offSeen.get(job.targetId);
            if (rec) rec.off = true; else this._offSeen.set(job.targetId, { cond: job.offWhen, off: true });
            this._turnBack(s, 'off');
            return;
        }
        // Slice 18b-i: a magnet picked up, finished or out of servings. Walkers and queuers turn back
        // with `gone`; one eating finishes at once (its serving was taken at the start)
        if (job.magnet) {
            const live = !!this._shownMagnets()?.has(job.targetId);
            if (job.phase === 'using' && !live) { this._log(id, 'magnet_left', { target: job.targetId }); this._completeJob(s); return; }
            if ((job.phase === 'goto_target' || job.phase === 'queued') && (!live || this._servingsLeft(job.targetId) <= 0)) { this._turnBack(s, 'gone'); return; }
        }
        // Slice 14: someone avoided turned up at the target while on the way or in its queue
        if ((job.phase === 'goto_target' || job.phase === 'queued') && this._recheck(s)) return;
        if (job.phase === 'queued') { this._advanceQueued(s, arrived); return; }
        if (job.phase === 'goto_item' || job.phase === 'goto_target') {
            if (job.phase === 'goto_item') {
                const item = this.world.getObject(job.itemId);
                if (!item || !item.pickable) { this._itemGone(s); this._abortJob(s, 'item_gone', { cancel: true }); this._goHome(s); return; }
                if (item.slot) job.slot = true;
            }
            if (!arrived) {
                if (this.clockMs >= job.deadline) this._failJob(s, 'timeout');
                return;
            }
            if (job.phase === 'goto_item') {
                const took = this.world.pickUp(id, job.itemId);
                this._worldChanged();
                if (!took) { this._itemGone(s); this._abortJob(s, 'item_gone', { cancel: false }); this._goHome(s); return; }
                job.carrying = true;
                this._log(id, 'picked_up', { item: job.itemId });
                this._emit(`npc_picked_up:${job.itemId}`, { npcId: id, itemId: job.itemId, tag: job.tag });
                job.phase = 'goto_target';
                this._moveForPhase(s);
                return;
            }
            const obj = this.world.getObject(job.targetId);
            if (obj) this.world.faceTo(id, obj.x, obj.y);
            // A print errand completes on arrival, without `using` (no post stop, no chair fetch)
            if (job.errand) { this._completeJob(s); return; }
            // Slice 18b-i: a serving is taken as eating starts, so nobody eats one that is not there
            if (job.magnet && !this._takeServing(s, job.targetId)) { this._turnBack(s, 'gone'); return; }
            job.phase = 'using';
            const secs = Number(obj?.affordance?.useSeconds);
            job.useUntil = this.clockMs + (Number.isFinite(secs) ? clamp(secs, 0, 600) : 20) * 1000;
            this._log(id, 'using', { need: job.need, target: job.targetId });
            if (obj) this._maybePair(s, obj);
            return;
        }
        if (job.phase === 'using' && this.clockMs >= job.useUntil) this._completeJob(s);
    }

    _completeJob(s) {
        const id = s.npcId;
        const job = s.job;
        const n = job.need ? s.needs[job.need] : null;
        const obj = this.world.getObject(job.targetId);
        const aff = obj?.affordance || job.aff || {};
        if (n && s.temptBack[job.need]) delete s.temptBack[job.need];
        if (n) {
            let restores = asList(aff.satisfies).includes(job.need) ? Number(aff.restores) || 0 : 0;
            restores *= 1 + (s.rng() * 2 - 1) * n.jitterPct / 100;
            s.levels[job.need] = clamp(s.levels[job.need] + restores, 0, 100);
            s.lastSatisfiedAt[job.need] = this.clockMs;
        }
        // The outcome follows the item's kind (2.2 Part A): a plain item is consumed (today's path);
        // a reveal slot is set down on the target, or filed at once when the target says stow
        let outcome = null;
        if (job.carrying && job.slot) {
            outcome = aff.onDeliver === 'stow' ? 'stow' : 'place';
            if (outcome === 'place' && this.world.placeHeld?.(id, job.itemId, obj)) {
                const ms = this._placeMs(aff);
                if (ms > 0) this._placed.set(job.itemId, { at: this.clockMs + ms, npcId: id });
            } else {
                outcome = 'stow';
                this.world.stowHeld?.(id, job.itemId);
            }
            this._worldChanged();
        } else if (job.carrying) { this.world.consumeHeld(id, job.itemId); this._worldChanged(); }
        const rec = this.world.getNpc(id) || {};
        this._log(id, 'used', { need: job.need || undefined, tag: job.tag || undefined, target: job.targetId, item: job.itemId || undefined, outcome: outcome || undefined, level: n ? round2(s.levels[job.need]) : undefined, payloadPresent: rec.usePayload !== undefined });
        this._emit(`npc_used:${job.targetId}`, {
            npcId: id, objectId: job.targetId, need: job.need,
            itemId: job.carrying ? job.itemId : null, tag: job.carrying ? job.tag : null,
            payload: cloneData(rec.usePayload),
            ...this._playerProximity(id)
        });
        const hook = rec.onUse && rec.onUse[job.targetId];
        if (hook && typeof hook === 'object') {
            if (typeof hook.setGlobal === 'string' && hook.setGlobal) { this.world.setGlobal(hook.setGlobal, true); this._worldChanged(); }
            if (typeof hook.emitEvent === 'string' && hook.emitEvent) this._emit(hook.emitEvent, { npcId: id, objectId: job.targetId });
            // Something that prints: show the producer's first free reveal slot (2.2 Part A). Only a
            // need use prints (slice 17), never a delivery, and only when the start-time roll said so;
            // the print is owned (reserved, fetched or forgotten) only when the NPC has a printHabit
            if (typeof hook.revealOutput === 'string' && hook.revealOutput && job.need && !job.carrying && job.printTo) {
                const habit = rec.printHabit && typeof rec.printHabit === 'object' ? rec.printHabit : null;
                this._revealOutput(job.printTo, id, habit ? { habit } : null);
            }
        }
        if (job.errand) {
            this._prints.delete(job.itemId);
            this._log(id, 'print_fetched', { item: job.itemId, viaCommand: !!job.viaCommand });
            this._emit(`npc_print_fetched:${id}`, { npcId: id, slotId: job.itemId, viaCommand: !!job.viaCommand });
        }
        const stayPut = s.atPost && this._atOwnPost(s);
        s.job = null;
        this._clearBackoffs();   // a target or item may have come free; waiting NPCs do not know which
        this._goHome(s, { stayPut });
    }

    /** Player proximity at use time: { playerNearby, playerDistance }. */
    _playerProximity(npcId) {
        const p = typeof this.world.playerProximity === 'function' ? this.world.playerProximity(npcId) : null;
        return { playerNearby: !!(p && p.nearby), playerDistance: p && Number.isFinite(p.distance) ? Math.round(p.distance) : null };
    }

    _failJob(s, reason) {
        const job = s.job;
        if (job) s.cooldowns[job.phase === 'goto_item' ? job.itemId : job.targetId] = this.clockMs + FAIL_COOLDOWN_MS;
        this._emit(`npc_job_failed:${s.npcId}`, { npcId: s.npcId, need: job?.need, targetId: job?.targetId, reason });
        this._abortJob(s, reason, { cancel: true, failed: true });
        this._goHome(s);
    }

    /** The player took the item an NPC was fetching: a scenario can map the owner noticing. */
    _itemGone(s) {
        const job = s.job;
        this._emit(`npc_job_failed:${s.npcId}`, { npcId: s.npcId, need: job?.need, targetId: job?.targetId, itemId: job?.itemId, reason: 'item_gone' });
    }

    /**
     * revealOutput hook: the producer's first free slot (id order) is shown; with none free, a
     * cosmetic copy that nobody can take stands in for the producer's placeSeconds.
     */
    _revealOutput(producerId, npcId, own = null) {
        if (typeof this.world.revealOutput !== 'function') return null;
        // Slice 17: a full pool recycles the oldest forgotten reserved slot of this producer, for any
        // print, owned or not (read-in-place slots first, so the takeable one is the last to go)
        let full = false;
        if (typeof this.world.freeSlotOf === 'function' && !this.world.freeSlotOf(producerId)) {
            const old = this._recyclable(producerId);
            if (old) {
                this._prints.delete(old);
                this._placed.delete(old);
                if (this.world.stowSlot?.(old)) this._log(npcId, 'recycled', { item: old, target: producerId });
            } else full = true;
        }
        const r = this.world.revealOutput(producerId, npcId, { printedBy: own ? npcId : null }) || {};
        this._worldChanged();
        if (r.slotId) {
            this._log(npcId, 'revealed', { target: producerId, item: r.slotId });
            this._prints.delete(r.slotId);
            if (own) this._reserve(r.slotId, producerId, npcId, own);
            return r.slotId;
        }
        this._log(npcId, 'revealed', { target: producerId, reason: 'no_free_slot' });
        if (full) this._log(npcId, 'print_no_slot', { target: producerId });
        if (r.cosmetic) {
            const ms = this._placeMs(this.world.getObject(producerId)?.affordance);
            if (ms > 0) this._placed.set(r.cosmetic, { at: this.clockMs + ms, npcId, cosmetic: true });
        }
        return null;
    }

    // ── print and forget (slice 17, OFFICE_LIFE_PLAN 12.3) ──────────────────

    /** True when someone other than npcId owns the print on this slot (a reservation). */
    _reservedFrom(slotId, npcId) {
        if (!this._prints.size) return false;
        const p = this._prints.get(slotId);
        return !!(p && p.ownerId !== npcId);
    }

    /** The slot is shown on its tray: loaded, visible, not in a hand or set down, not taken. */
    _onTray(slotId) {
        const o = this.world.getObject(slotId);
        return !!(o && o.pickable && o.roomId);
    }

    /** A print can land on a real slot: one is free, or a forgotten one can be recycled. */
    _slotAvailable(producerId) {
        if (typeof this.world.freeSlotOf !== 'function') return true;
        return !!(this.world.freeSlotOf(producerId) || this._recyclable(producerId));
    }

    /** The oldest forgotten reserved slot of a producer still on its tray, read-in-place ones first. */
    _recyclable(producerId) {
        let best = null;
        for (const [id, p] of this._prints) {
            if (p.producerId !== producerId || !p.forgotten || p.errand || !this._onTray(id)) continue;
            const key = [p.readInPlace ? 0 : 1, p.at, id];
            if (!best || key[0] < best[0] || (key[0] === best[0] && (key[1] < best[1] || (key[1] === best[1] && key[2] < best[2])))) best = key;
        }
        return best ? best[2] : null;
    }

    /**
     * An owned print: two seeded rolls on <ownerId>:<printCount> (a per-owner count, so a re-used
     * slot does not repeat its fate): forget (forgetChance, default 0), else a due time inside
     * fetchAfterSeconds (default [20, 60]). A command's forget / fetchAfterSeconds win.
     */
    _reserve(slotId, producerId, ownerId, own) {
        const s = this.states.get(ownerId);
        const habit = own.habit || {};
        const count = s ? ++s.printCount : 0;
        const range = Array.isArray(own.fetchAfterSeconds) ? own.fetchAfterSeconds : habit.fetchAfterSeconds;
        let lo = 20, hi = 60;
        if (Array.isArray(range) && range.length === 2 && range.every(v => Number.isFinite(Number(v)))) {
            lo = clamp(Number(range[0]), 0, 3600); hi = clamp(Number(range[1]), lo, 3600);
        }
        let forgotten;
        if (typeof own.forget === 'boolean') forgotten = own.forget;
        else {
            const fc = clamp(Number(habit.forgetChance) || 0, 0, 1);
            forgotten = fc > 0 && this.roll(ownerId, `print_forget:${count}`) < fc;
        }
        const dueAt = forgotten ? null : this.clockMs + Math.round((lo + this.roll(ownerId, `print_due:${count}`) * (hi - lo)) * 1000);
        const aff = this.world.getObject(producerId)?.affordance;
        const unc = Number(aff?.uncollectedAfterSeconds);
        const share = Number(habit.shareAfterSeconds);
        const w = Number(habit.weight);
        this._prints.set(slotId, {
            ownerId, producerId, at: this.clockMs, dueAt, forgotten, viaCommand: !!own.viaCommand,
            weight: Number.isFinite(w) && w > 0 ? clamp(w, 0.1, 10) : 2,
            uncollectedAt: this.clockMs + (Number.isFinite(unc) ? clamp(unc, 0, 3600) : 60) * 1000,
            shareAt: Number.isFinite(share) && share > 0 ? this.clockMs + share * 1000 : null,
            readInPlace: this.world.getObject(slotId)?.takeable !== true,
            uncollected: false, errand: false
        });
        this._log(ownerId, 'print_reserved', { item: slotId, target: producerId, forgotten, dueMs: dueAt === null ? undefined : dueAt - this.clockMs, viaCommand: own.viaCommand ? true : undefined });
    }

    /** This NPC has an owned print whose fetch is due (the _select early-return guard). */
    _dueErrand(s) {
        if (!this._prints.size) return false;
        for (const p of this._prints.values()) {
            if (p.ownerId === s.npcId && !p.forgotten && !p.errand && this.clockMs >= p.dueAt) return true;
        }
        return false;
    }

    /**
     * The fetch errand: the owner's earliest due print still on the tray, carried to its needsHome
     * object (no accepts check). Only the usual room rules and reachability apply.
     */
    _errandCandidate(s) {
        const homeId = s.home?.objectId;
        if (!homeId || !this.world.getObject(homeId)) return null;
        let pick = null;
        for (const [id, p] of [...this._prints.entries()].sort((a, b) => (a[1].dueAt - b[1].dueAt) || (a[0] < b[0] ? -1 : 1))) {
            if (p.ownerId !== s.npcId || p.forgotten || p.errand || !(this.clockMs >= p.dueAt)) continue;
            if (s.cooldowns[id] > this.clockMs) continue;
            const item = this.world.getObject(id);
            if (!item || !item.pickable || !this._permitted(s, item, false) || !this._reachable(s, item)) continue;
            pick = { kind: 'carry', targetId: homeId, itemId: id, tag: item.needsTag || null, need: null, score: p.weight, errand: true, viaCommand: p.viaCommand };
            break;
        }
        return pick;
    }

    /** Per tick: a print taken before its fetch, uncollected prints, and shared ones. */
    _tickPrints() {
        for (const [id, p] of [...this._prints.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
            if (p.errand) continue;
            const onTray = this._onTray(id);
            if (!onTray) {
                if (p.forgotten) { this._prints.delete(id); continue; }
                if (this.clockMs < p.dueAt) continue;
                // Taken first: the owner finds it gone at the due time and does not walk
                this._prints.delete(id);
                this._log(p.ownerId, 'print_gone', { item: id });
                this._emit(`npc_print_gone:${p.ownerId}`, { npcId: p.ownerId, slotId: id, ...this._playerProximity(p.ownerId) });
                continue;
            }
            if (!p.uncollected && this.clockMs >= p.uncollectedAt) {
                p.uncollected = true;
                const ageMs = this.clockMs - p.at;
                this._log(p.ownerId, 'print_uncollected', { item: id, ageMs, forgotten: p.forgotten });
                this._emit(`npc_print_uncollected:${p.ownerId}`, { ownerId: p.ownerId, slotId: id, producerId: p.producerId, ageMs, forgotten: p.forgotten });
            }
            if (p.shareAt !== null && this.clockMs >= p.shareAt) {
                this._prints.delete(id);
                this.world.setPrintedBy?.(id, null);
                this._log(p.ownerId, 'print_shared', { item: id });
                this._clearBackoffs();
            }
        }
    }

    _abortJob(s, reason, { cancel, failed } = {}) {
        const job = s.job;
        if (!job) return;
        if (cancel) this.world.cancelMove(s.npcId);
        // A slot is filed rather than dropped: the server cannot save where an NPC left it
        if (job.carrying && job.slot && typeof this.world.stowHeld === 'function') { this.world.stowHeld(s.npcId, job.itemId); this._worldChanged(); }
        else if (job.carrying) { this.world.dropHeld(s.npcId, job.itemId); this._worldChanged(); }
        this._log(s.npcId, failed ? 'job_failed' : 'job_aborted', { need: job.need || undefined, tag: job.tag || undefined, target: job.targetId, reason });
        // Slice 17: a print errand that never picked its slot up may try again; one that did, or found
        // it gone, is over (the slot was filed, or the player has it)
        if (job.errand) {
            const p = this._prints.get(job.itemId);
            if (p && (job.carrying || reason === 'item_gone')) this._prints.delete(job.itemId);
            else if (p) p.errand = false;
        }
        s.job = null;
        this._clearBackoffs();
    }

    /**
     * Resolve (or re-resolve) the NPC's post. A `needsHome` object that isn't registered yet
     * (start-room NPCs register before the room's objects) gives a provisional home at the
     * current spot, retried every HOME_RETRY_TICKS until the object is there; a resolved
     * home is cached and never looked up again.
     */
    _updateHome(s, pos) {
        const h = this._resolveHome(s, pos);
        if (!h.provisional) {
            if (s.home?.provisional) this._log(s.npcId, 'home_resolved', { target: h.objectId || undefined });
            s.home = h;
            return;
        }
        if (!s.home) s.home = h;   // keep the first provisional spot; don't chase the NPC's position
        s.homeRetryAt = this.tickCount + HOME_RETRY_TICKS;
    }

    _resolveHome(s, pos) {
        const rec = this.world.getNpc(s.npcId) || {};
        const h = rec.needsHome;
        if (typeof h === 'string') {
            const obj = this.world.getObject(h);
            const cell = obj ? this.world.approachCell(obj) : null;
            if (cell) return { x: cell.x, y: cell.y, roomId: obj.roomId, objectId: h };
            return { x: pos.x, y: pos.y, roomId: pos.roomId || null, objectId: null, provisional: true };
        } else if (h && typeof h === 'object' && h.room) {
            const w = this.world.tileToWorld(h.room, h.x, h.y);
            if (w) return { x: w.x, y: w.y, roomId: h.room, objectId: null };
        }
        return { x: pos.x, y: pos.y, roomId: pos.roomId || null, objectId: null };
    }

    /**
     * stayPut: an own-desk use just ended; the NPC is at its post (maybe seated off the cell).
     * yieldToPlayer: the walk stops to face a player within reach (the behaviour layer's
     * face_player); _watchReturn turns it off after RETURN_YIELD_MS without progress.
     */
    _goHome(s, { stayPut = false, yieldToPlayer = true } = {}) {
        const id = s.npcId;
        s.mode = 'returning';
        s.returnWatch = null;
        const pos = this.world.npcPos(id);
        if (!s.home || !pos) { s.mode = 'idle'; return; }
        if (stayPut || Math.hypot(pos.x - s.home.x, pos.y - s.home.y) <= HOME_EPS) {
            this._arrivals.add(id);
            return;
        }
        this.world.moveTo(id, s.home.x, s.home.y, this.world.speedFor(id), { yieldToPlayer, avoidRooms: this._avoidRooms(s) });
    }

    /**
     * A walk home that has not moved RETURN_STILL_PX for RETURN_YIELD_MS of needs clock is
     * re-issued without yielding to the player. The behaviour layer's face_player has no time
     * limit, so a player standing within 96 px of the route (watching the desk, or idle at the
     * coffee machine) used to hold the NPC in `returning` for good: it never got home, never
     * sat. A re-issue also re-plans the path, which covers a walk wedged for another reason.
     */
    _watchReturn(s, pos) {
        const w = s.returnWatch;
        if (!w || Math.hypot(pos.x - w.x, pos.y - w.y) >= RETURN_STILL_PX) {
            s.returnWatch = { x: pos.x, y: pos.y, since: this.clockMs };
            return;
        }
        if (this.clockMs - w.since < RETURN_YIELD_MS) return;
        this._log(s.npcId, 'return_resumed', { x: Math.round(pos.x), y: Math.round(pos.y) });
        this._goHome(s, { yieldToPlayer: false });
        s.returnWatch = { x: pos.x, y: pos.y, since: this.clockMs };
    }

    // ── social pairing and compatibility (slice 8: OFFICE_LIFE_PLAN 2.4, 7.3) ──

    _company(s) {
        const nc = this.world.getNpc(s.npcId)?.needsCompany;
        return nc && typeof nc === 'object' ? nc : null;
    }

    _groups(s) {
        const g = this._company(s)?.groups;
        return Array.isArray(g) ? g.filter(x => typeof x === 'string' && x) : [];
    }

    _globalHolds(cond) {
        return typeof this.world.globalHolds === 'function' ? !!this.world.globalHolds(cond) : false;
    }

    /** Does a's own avoids list name b? (an id, "group:<name>", "*", or { npc | group, requireGlobal }) */
    _avoidsOneWay(a, b) {
        const list = this._company(a)?.avoids;
        if (!Array.isArray(list)) return false;
        const hit = (who) => {
            if (who === '*' || who === b.npcId) return true;
            return typeof who === 'string' && who.startsWith('group:') && this._groups(b).includes(who.slice(6));
        };
        for (const e of list) {
            if (typeof e === 'string') { if (hit(e)) return true; continue; }
            if (!e || typeof e !== 'object') continue;
            const named = typeof e.npc === 'string' ? hit(e.npc) : (typeof e.group === 'string' && this._groups(b).includes(e.group));
            if (!named) continue;
            if (e.requireGlobal !== undefined && !this._globalHolds(e.requireGlobal)) continue;
            return true;
        }
        return false;
    }

    /** Declared one way, acts both ways. */
    _avoids(a, b) {
        return this._avoidsOneWay(a, b) || this._avoidsOneWay(b, a);
    }

    /** May a and b chat? No avoidance either way, and a shared group unless one has no groups. */
    _compatible(a, b) {
        if (this._avoids(a, b)) return false;
        const ga = this._groups(a), gb = this._groups(b);
        return !ga.length || !gb.length || ga.some(g => gb.includes(g));
    }

    _noteAvoided(s, other, obj) {
        const key = `${other.npcId}|${obj.id}`;
        if (s.avoidNoted[key]) return;
        s.avoidNoted[key] = true;
        this._log(s.npcId, 'avoided', { avoided: other.npcId, target: obj.id });
        this._emit(`npc_avoided:${s.npcId}`, { npcId: s.npcId, avoidedId: other.npcId, objectId: obj.id });
    }

    _usingObj(s, objectId) {
        return !!(s && s.mode === 'job' && s.job?.phase === 'using' && s.job.targetId === objectId);
    }

    /** On entering `using`: pair with a compatible NPC already using the same chatter object. */
    _maybePair(s, obj) {
        const aff = obj.affordance || {};
        if (typeof aff.chatter !== 'string' || !aff.chatter) return;
        if ((Number(aff.capacity) || 1) < 2 || this._chats.has(obj.id)) return;
        for (const id of [...this.states.keys()].sort()) {
            const o = this.states.get(id);
            if (o === s || !this._usingObj(o, obj.id)) continue;
            if (!this._compatible(s, o)) continue;   // share in silence
            const seq = this._chatSeq++;
            const first = this.roll(`${o.npcId}+${s.npcId}`, `chat:${obj.id}:${seq}:first`) < 0.5 ? o.npcId : s.npcId;
            this._chats.set(obj.id, {
                objectId: obj.id, topic: aff.chatter, overhearRadius: Number(aff.overhearRadius) > 0 ? Number(aff.overhearRadius) : null,
                a: o.npcId, b: s.npcId, seq, n: 0, speaker: first, nextAt: this.clockMs, current: null, hushed: false
            });
            const pa = this.world.npcPos(o.npcId), pb = this.world.npcPos(s.npcId);
            if (pa && pb) { this.world.faceTo(o.npcId, pb.x, pb.y); this.world.faceTo(s.npcId, pa.x, pa.y); }
            return;
        }
    }

    _scenarioChatter() {
        return typeof this.world.chatterConfig === 'function' ? this.world.chatterConfig() : undefined;
    }

    _tickChats() {
        for (const oid of [...this._chats.keys()].sort()) {
            const c = this._chats.get(oid);
            const A = this.states.get(c.a), B = this.states.get(c.b);
            // Either one frozen in a conversation, gone, or finished: the pairing ends
            if (!this._usingObj(A, oid) || !(c.queue ? this._queuedFront(B, oid) : this._usingObj(B, oid))) { this._chats.delete(oid); continue; }
            if (c.current && this.clockMs >= c.current.until) {
                c.current = null;
                if (c.ex && c.ex.i >= c.ex.lines.length) this._finishExchange(c);
            }
            if (c.current) {
                if (c.hush && !c.hushed && this._playerWithin([c.a, c.b])) c.hushed = true;
                continue;
            }
            if (c.hushed) { this._chats.delete(oid); continue; }
            if (this.clockMs < c.nextAt) continue;
            const overlapEnd = c.queue ? A.job.useUntil : Math.min(A.job.useUntil, B.job.useUntil);
            // Order of preference (11.4): an unplayed exchange with the player in earshot, then a
            // bark from the bag, then picture chat
            if (!c.ex && !c.exDone) {
                const ex = this._findExchange(A, B);
                if (ex && !ex.pending && this._audience(c, c.overhearRadius || OVERHEAR_RADIUS)) this._startExchange(c, ex, A, B);
                else if (!ex) c.exDone = true;   // none for this pair: no need to look again this meeting
            }
            if (c.ex) {
                if (!this._speechFree()) { c.nextAt = this._speechUntil; continue; }   // queue behind another line
                const l = c.ex.lines[c.ex.i];
                const ms = exchangeLineMs(l.text);
                const partnerId = l.speakerId === c.a ? c.b : c.a;
                c.current = { speakerId: l.speakerId, partnerId, line: l.text, until: this.clockMs + ms, knot: c.ex.knot };
                c.ex.i++;
                const h = typeof this.world.playerHears === 'function' ? (this.world.playerHears(l.speakerId, c.overhearRadius || OVERHEAR_RADIUS) || {}) : {};
                this._speak(l.speakerId, l.text, c.current.until, { topic: c.topic, objectId: oid, knot: c.ex.knot, overheard: !!h.overheard });
                const pa = this.world.npcPos(partnerId);
                if (pa) this.world.faceTo(l.speakerId, pa.x, pa.y);
                const data = {
                    speakerId: l.speakerId, partnerId, topic: c.topic, lineId: `${c.ex.knot}:${c.ex.i - 1}`, line: l.text, objectId: oid,
                    exchange: c.ex.knot, overheard: !!h.overheard, playerDistance: Number.isFinite(h.distance) ? Math.round(h.distance) : null
                };
                this._emit(`npc_chatted:${oid}`, data);
                if (data.overheard) this._emit(`npc_overheard:${l.speakerId}`, { ...data });
                c.speaker = partnerId;
                c.nextAt = c.current.until + CHAT_GAP_MS;
                continue;
            }
            const partnerId = c.speaker === c.a ? c.b : c.a;
            const sp = this.states.get(c.speaker);
            const rec = this.world.getNpc(c.speaker) || {};
            const salt = `chat:${oid}:${c.seq}:${c.n}`;
            c.n++;
            // chattiness: the seeded chance this speaker says something on its turn (default 1)
            const chatty = Number.isFinite(Number(rec.chattiness)) && rec.chattiness !== null ? clamp(Number(rec.chattiness), 0, 1) : 1;
            const pick = this.roll(c.speaker, `${salt}:chatty`) < chatty ? this._pickBark(sp, c.topic, { waitForLock: true }) : null;
            if (pick?.wait) { c.n--; c.nextAt = this._speechUntil; continue; }   // a voiced line is playing: queue
            if (!pick) {
                if (c.n > 40) { this._chats.delete(oid); continue; }   // two silent NPCs: give up
                c.speaker = partnerId;
                c.nextAt = this.clockMs + CHAT_GAP_MS;
                continue;
            }
            const { line, idx, picture, pool } = pick;
            const ms = picture ? PICTURE_MS : bubbleMs(line);
            // Only while both are still using it: a line that would outlast the overlap is not started
            if (this.clockMs + ms > overlapEnd) { this._chats.delete(oid); continue; }
            c.current = { speakerId: c.speaker, partnerId, line, picture, until: this.clockMs + ms };
            c.hush = pool.hush;
            const radius = c.overhearRadius || pool.overhearRadius || OVERHEAR_RADIUS;
            const h = typeof this.world.playerHears === 'function' ? (this.world.playerHears(c.speaker, radius) || {}) : {};
            if (line) this._speak(c.speaker, line, c.current.until, { topic: c.topic, objectId: oid, overheard: !!h.overheard });
            const data = {
                speakerId: c.speaker, partnerId, topic: c.topic, lineId: picture ? `picture:${picture}` : `${c.topic}:${idx}`, line, picture, objectId: oid,
                overheard: !!h.overheard, playerDistance: Number.isFinite(h.distance) ? Math.round(h.distance) : null
            };
            this._emit(`npc_chatted:${oid}`, data);
            if (data.overheard) this._emit(`npc_overheard:${c.speaker}`, { ...data });
            if (c.hush && this._playerWithin([c.a, c.b])) c.hushed = true;
            c.speaker = partnerId;
            c.nextAt = c.current.until + CHAT_GAP_MS;
        }
    }

    /** Is the player near any of these NPCs: playerProximity's `nearby` (96 px, same room, clear line)? */
    _playerWithin(ids) {
        return ids.some(id => this._playerProximity(id).playerNearby);
    }

    /** The line an NPC is saying now, or null: { line, partnerId, topic, objectId, remainingMs }. */
    _talking(npcId) {
        for (const c of this._chats.values()) {
            const cur = c.current;
            if (cur && cur.speakerId === npcId && this.clockMs < cur.until) {
                return { line: cur.line, picture: cur.picture || null, knot: cur.knot || null, partnerId: cur.partnerId, topic: c.topic, objectId: c.objectId, remainingMs: cur.until - this.clockMs };
            }
        }
        // A grumble (slice 14) is a one-off line with no partner
        const say = this.states.get(npcId)?.saying;
        if (say && this.clockMs < say.until) return { line: say.line, picture: say.picture || null, knot: null, partnerId: null, topic: say.topic, objectId: say.objectId, remainingMs: say.until - this.clockMs };
        return null;
    }

    /** The NPC's chat partner while paired at an object, or null. */
    _chatPartner(npcId) {
        for (const c of this._chats.values()) {
            if (c.a === npcId) return c.b;
            if (c.b === npcId) return c.a;
        }
        return null;
    }

    // ── queues at shared machines (slice 10: OFFICE_LIFE_PLAN 2.5, 7.3) ──────

    /** affordance.queue as { offsets, maxWaitMs }, or null (no queue: today's wait at the desk). */
    _queueCfg(obj) {
        const q = obj?.affordance?.queue;
        if (!q || typeof q !== 'object' || !Array.isArray(q.cells)) return null;
        const offsets = q.cells.filter(c => c && Number.isFinite(Number(c.dx)) && Number.isFinite(Number(c.dy)))
            .map(c => ({ dx: Number(c.dx), dy: Number(c.dy) }));
        if (!offsets.length) return null;
        const w = Number(q.maxWaitSeconds);
        return { offsets, maxWaitMs: (Number.isFinite(w) && w > 0 ? clamp(w, 1, 600) : QUEUE_MAX_WAIT_S) * 1000 };
    }

    /**
     * The queue's cells in order, as world points with a room: the live adapter snaps each offset
     * (tiles from the approach cell) to a walkable cell and drops one that does not snap; a world
     * without queueCells (the node stub) takes the offsets as they are, in the object's room.
     */
    _queueCells(obj) {
        const cfg = this._queueCfg(obj);
        if (!cfg) return [];
        if (typeof this.world.queueCells === 'function') return this.world.queueCells(obj, cfg.offsets) || [];
        const base = this.world.approachCell(obj);
        if (!base) return [];
        return cfg.offsets.map(o => ({ x: base.x + o.dx * 32, y: base.y + o.dy * 32, roomId: obj.roomId }));
    }

    /** NPCs queued for an object, in claim order (tick, then NPC id: the order ticks run in). */
    _queuers(objectId) {
        const out = [];
        for (const o of this.states.values()) if (o.job?.phase === 'queued' && o.job.targetId === objectId) out.push(o);
        return out.sort((a, b) => a.job.qSeq - b.job.qSeq);
    }

    /**
     * Each queuer, in order, takes the first cell that is in a room it may enter and that nobody
     * ahead of it holds (review m8). `who` may be a newcomer not yet queued: it goes last.
     * Returns { index, cell } for `who`, or null when no permitted cell is left.
     */
    _queuePlace(who, obj) {
        const cells = this._queueCells(obj);
        const line = this._queuers(obj.id);
        if (!line.includes(who)) line.push(who);
        const held = new Set();
        for (const o of line) {
            let got = null;
            for (let i = 0; i < cells.length; i++) {
                if (held.has(i) || this._roomForbidden(o, cells[i].roomId)) continue;
                got = i;
                break;
            }
            if (got === null) { if (o === who) return null; continue; }
            held.add(got);
            if (o === who) return { index: got, cell: cells[got] };
        }
        return null;
    }

    /** No free target for this need: the nearest claimed one with a queue place for this NPC. */
    _queueCandidate(s, name, objects, pos, ctx = null) {
        let list = objects.filter(o => o.affordance?.queue && asList(o.affordance.satisfies).includes(name)
            && o.id !== ctx?.exclude && !this._isOff(o)
            && this._permitted(s, o, true) && !(s.cooldowns[o.id] > this.clockMs)
            && !this._free(s, o) && this._queuePlace(s, o));
        // Slice 14: not behind someone avoided, and not into a line that is too long (balking)
        if (ctx && list.length) {
            list = list.filter(o => {
                if (ctx.avoidedAt && ctx.avoidedAt(o)) return false;
                if (ctx.balked && this._balks(s, o)) { ctx.balked.add(o.id); return false; }
                return true;
            });
        }
        if (!list.length) return null;
        const target = this._nearestReachable(s, list, pos);
        if (!target) return null;
        const pick = { kind: 'use', targetId: target.id, queue: true };
        if (target.affordance.offWhen !== undefined) pick.offWhen = target.affordance.offWhen;
        return pick;
    }

    _advanceQueued(s, arrived) {
        const job = s.job;
        const obj = this.world.getObject(job.targetId);
        if (!obj || !this._queueCfg(obj)) { this._leaveQueue(s, 'gone'); return; }
        // The need was met some other way (a mapping, a refill): no reason to stand here
        if (job.need && s.needs[job.need] && s.levels[job.need] > s.needs[job.need].urgentAt && !this._starved(s, job.need)) {
            this._leaveQueue(s, 'need_met');
            return;
        }
        if (this.clockMs - job.queuedAt >= this._queueCfg(obj).maxWaitMs) {
            s.cooldowns[job.targetId] = this.clockMs + QUEUE_COOLDOWN_MS;
            this._leaveQueue(s, 'max_wait');
            return;
        }
        // The front of the queue takes the place as soon as one is free
        if (this._queuers(job.targetId)[0] === s && this._free(s, obj)) {
            job.phase = 'goto_target';
            job.qCell = null;
            this._log(s.npcId, 'queue_front', { target: job.targetId });
            this._moveForPhase(s);
            return;
        }
        // Someone ahead left or moved up: step forward to this NPC's cell now
        const place = this._queuePlace(s, obj);
        if (!place) { this._leaveQueue(s, 'no_queue_cell'); return; }
        const key = `${Math.round(place.cell.x)},${Math.round(place.cell.y)}`;
        if (key !== job.qCell) { this._moveForPhase(s); return; }
        if (arrived) {
            job.qArrived = true;
            this.world.faceTo(s.npcId, obj.x, obj.y);
        } else if (!job.qArrived && this.clockMs >= job.deadline) {
            this._failJob(s, 'timeout');
        }
    }

    /** Leave a queue and walk back to the post. */
    _leaveQueue(s, reason) {
        this._log(s.npcId, 'queue_left', { target: s.job?.targetId, reason });
        this._abortJob(s, reason, { cancel: true });
        this._goHome(s);
    }

    /** Is s the front of the queue for objectId and standing in its cell? */
    _queuedFront(s, objectId) {
        return !!(s && s.mode === 'job' && s.job?.phase === 'queued' && s.job.targetId === objectId
            && s.job.qArrived && this._queuers(objectId)[0] === s);
    }

    /**
     * Queue chatter: the NPC using a chatter object pairs with the first queued NPC, once it stands
     * within 1.5 tiles of the approach cell, with slice 8's turn-taking, if the two are compatible
     * (7.3). An incompatible front queues in silence; the second in line never chats.
     */
    _tickQueueChats() {
        let objIds = null;
        for (const o of this.states.values()) {
            if (o.job?.phase === 'queued' && o.job.qArrived) (objIds || (objIds = new Set())).add(o.job.targetId);
        }
        if (!objIds) return;
        for (const oid of [...objIds].sort()) {
            if (this._chats.has(oid)) continue;
            const obj = this.world.getObject(oid);
            const aff = obj?.affordance || {};
            if (typeof aff.chatter !== 'string' || !aff.chatter) continue;
            const front = this._queuers(oid)[0];
            if (!this._queuedFront(front, oid)) continue;
            const cell = this.world.approachCell(obj);
            const fp = this.world.npcPos(front.npcId);
            if (!cell || !fp || Math.hypot(fp.x - cell.x, fp.y - cell.y) > QUEUE_CHAT_RADIUS) continue;
            let user = null;
            for (const id of [...this.states.keys()].sort()) {
                if (this._usingObj(this.states.get(id), oid)) { user = this.states.get(id); break; }
            }
            if (!user || !this._compatible(user, front)) continue;   // queue in silence
            const seq = this._chatSeq++;
            const first = this.roll(`${user.npcId}+${front.npcId}`, `chat:${oid}:${seq}:first`) < 0.5 ? user.npcId : front.npcId;
            this._chats.set(oid, {
                objectId: oid, topic: aff.chatter, overhearRadius: Number(aff.overhearRadius) > 0 ? Number(aff.overhearRadius) : null,
                a: user.npcId, b: front.npcId, queue: true, seq, n: 0, speaker: first, nextAt: this.clockMs, current: null, hushed: false
            });
            const pa = this.world.npcPos(user.npcId);
            if (pa) { this.world.faceTo(user.npcId, fp.x, fp.y); this.world.faceTo(front.npcId, pa.x, pa.y); }
        }
    }

    // ── read-outs ──────────────────────────────────────────────────────────

    _log(npcId, ev, extra = {}) {
        const entry = { t: this.tickCount, npc: npcId, ev };
        for (const [k, v] of Object.entries(extra)) if (v !== undefined) entry[k] = v;
        this.log.push(entry);
        if (this.log.length > LOG_CAP) this.log.shift();
    }

    getLog() {
        return this.log.map(e => ({ ...e }));
    }

    /**
     * The most pressing need the NPC is not acting on (OFFICE_LIFE_PLAN 9.2): at or below its
     * urgentAt, not the current job's need; lowest level / urgentAt, ties by need name. null if none.
     */
    _pressing(s) {
        let best = null;
        for (const name of Object.keys(s.needs).sort()) {
            if (s.job && s.job.need === name) continue;
            const urgentAt = s.needs[name].urgentAt;
            if (!(s.levels[name] <= urgentAt)) continue;
            const ratio = s.levels[name] / urgentAt;
            if (!best || ratio < best.ratio) best = { need: name, ratio };
        }
        return best ? { need: best.need, ratio: round2(best.ratio) } : null;
    }

    /** With no job: an urgent need that a room rule left nothing permitted for (the leashed back-off). */
    _blockedNeed(s) {
        if (s.job) return null;
        for (const name of Object.keys(s.needs).sort()) {
            if (s.leashNoted[name] && s.levels[name] <= s.needs[name].urgentAt) return name;
        }
        return null;
    }

    getState(npcId) {
        const s = this.states.get(npcId);
        if (!s) return null;
        const levels = {};
        for (const k of Object.keys(s.levels)) levels[k] = round2(s.levels[k]);
        return {
            npcId, mode: s.mode, levels, atPost: s.atPost, scriptSuspended: s.scriptSuspended,
            job: s.job ? { windingUp: !!s.job.windupUntil, need: s.job.need, kind: s.job.kind, phase: s.job.phase, targetId: s.job.targetId, itemId: s.job.itemId, carrying: s.job.carrying, tag: s.job.tag || null, leashed: !!s.job.leashed, privateSkipped: !!s.job.privateSkipped, prints: !!s.job.prints, errand: !!s.job.errand, files: !!(s.job.stowAt && s.job.slot), queuePlace: s.job.phase === 'queued' ? this._queuers(s.job.targetId).indexOf(s) + 1 : null } : null,
            pressing: this._pressing(s),
            talking: this._talking(npcId),
            chatPartner: this._chatPartner(npcId),
            blockedNeed: this._blockedNeed(s),
            noticed: Number.isFinite(s.caughtAt) && this.clockMs - s.caughtAt < NOTICED_MS,
            leaveCount: s.leaveCount, leftItems: [...s.leftItems],
            // Slice 14: parked needs (greyed bubble with a badge) and whose face the avoidance bubble shows
            parked: Object.keys(s.parked).sort().map(n => ({ need: n, reason: s.parked[n].reason, remainingMs: Math.max(0, s.parked[n].until - this.clockMs) })),
            avoiding: (s.avoidShow && this.clockMs < s.avoidShow.until) ? s.avoidShow.npcId : (s.job?.goingAnyway || null),
            home: s.home ? { x: Math.round(s.home.x), y: Math.round(s.home.y), roomId: s.home.roomId, objectId: s.home.objectId || null, provisional: !!s.home.provisional } : null,
            clockMs: this.clockMs, tick: this.tickCount
        };
    }
}

// ── live engine adapter ───────────────────────────────────────────────────

/**
 * The world as the needs system sees it, read from the running engine through
 * window. Each method is small so the stub in the node tests mirrors it.
 */
export function createEngineWorld() {
    const W = () => (typeof window !== 'undefined' ? window : {});
    const TILE = 32;
    const centreOf = (sp) => {
        if (sp.body?.center) return { x: sp.body.center.x, y: sp.body.center.y };
        const w = sp.displayWidth || sp.width || 0;
        const h = sp.displayHeight || sp.height || 0;
        const ox = sp.originX ?? 0.5, oy = sp.originY ?? 0.5;
        return { x: sp.x + w * (0.5 - ox), y: sp.y + h * (0.5 - oy) };
    };
    // Affordance presets (office-presets.js, slice 4): window.officePresets resolves the object's
    // own fields over its type's preset when the scenario says "officePresets": true
    const affordanceOf = (sp) => {
        const op = W().officePresets;
        if (op?.spriteAffordance) return op.spriteAffordance(sp, W().gameScenario);
        const a = sp?.scenarioData?.affordance;
        return a && typeof a === 'object' ? a : null;
    };
    // Reveal slots (OFFICE_LIFE_PLAN 2.2 Part A): a declared object with outputOf (or leftBehindBy)
    // and an engine-owned revealOnGlobal. Delivered, it is placed or stowed, never consumed.
    const globalOf = sp => sp?.revealOnGlobal || sp?.scenarioData?.revealOnGlobal || null;
    const isSlot = sp => {
        const sd = sp?.scenarioData || {};
        return !!((sd.outputOf || sd.leftBehindBy) && globalOf(sp));
    };
    const globalTrue = name => W().gameState?.globalVariables?.[name] === true;
    const inInventory = sp => {
        const items = W().inventory?.items;
        if (!Array.isArray(items)) return false;
        const id = sp.scenarioData?.id || sp.objectId;
        return items.some(it => it === sp || (id && (it?.scenarioData?.id === id || it?.objectId === id)));
    };
    const describe = (roomId, key, sp) => {
        const sd = sp.scenarioData || {};
        const id = sd.id || sp.objectId || key;
        const c = centreOf(sp);
        const out = {
            id, roomId, x: c.x, y: c.y,
            affordance: affordanceOf(sp),
            needsTag: typeof sd.needsTag === 'string' ? sd.needsTag : null,
            screenOwner: typeof sd.screenOwner === 'string' ? sd.screenOwner : null,
            // A slot an NPC set down is not a carry candidate, or the deliverer would pick it straight up
            pickable: sp.visible !== false && sp.active !== false && !sp._npcCarried && !sp._npcPlacedBy && !sp.destroyed,
            _sprite: sp
        };
        if (isSlot(sp)) { out.slot = true; out.takeable = sd.takeable === true; }
        // Slice 18b-i: a hidden object (reveal global not true) is no use target
        if (sd.affordance && globalOf(sp)) out.revealOnGlobal = globalOf(sp);
        return out;
    };
    // A producer's reveal slots, by id, and the free test (loaded, not destroyed, active, global not
    // true, not held, placed or in the inventory)
    const slotsOf = (producerId) => {
        const slots = [];
        const rooms = W().rooms || {};
        for (const roomId of Object.keys(rooms)) {
            const objs = rooms[roomId]?.objects || {};
            for (const k of Object.keys(objs)) {
                const sp = objs[k];
                if (sp?.scenarioData?.outputOf === producerId && isSlot(sp)) slots.push({ id: sp.scenarioData.id || sp.objectId || k, roomId, key: k, sp });
            }
        }
        return slots.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    };
    const freeSlot = ({ sp }) => !sp.destroyed && sp.active !== false && !globalTrue(globalOf(sp))
        && !sp._npcCarried && !sp._npcPlacedBy && !inInventory(sp);
    const findSprite = (id) => {
        const rooms = W().rooms || {};
        for (const roomId of Object.keys(rooms)) {
            const objs = rooms[roomId]?.objects;
            if (!objs) continue;
            if (objs[id]) return { roomId, key: id, sp: objs[id] };
            for (const k of Object.keys(objs)) {
                if (objs[k]?.scenarioData?.id === id) return { roomId, key: k, sp: objs[k] };
            }
        }
        return null;
    };
    const behaviour = id => W().npcBehaviorManager?.getBehavior?.(id) || null;
    const setCentre = (sp, at) => {
        const w = sp.displayWidth || sp.width || 0, h = sp.displayHeight || sp.height || 0;
        const ox = sp.originX ?? 0.5, oy = sp.originY ?? 0.5;
        sp.x = at.x - w * (0.5 - ox);
        sp.y = at.y - h * (0.5 - oy);
    };
    // A slot's declared spot, recorded the first time the engine handles it (it is on its tray then)
    const slotHome = (sp, roomId, key) => {
        if (sp._slotHome) return sp._slotHome;
        sp._slotHome = { x: sp.x, y: sp.y, depth: sp.depth, roomId: sp.roomId || roomId, key: key || sp.objectId };
        return sp._slotHome;
    };
    const stowSprite = (sp, fromRoomId, fromKey) => {
        if (!sp || sp.destroyed || sp.active === false || inInventory(sp)) return false;
        const home = slotHome(sp, fromRoomId, fromKey);
        const hide = W().hideRevealedObject;
        if (typeof hide === 'function') hide(sp);
        else { sp.setVisible?.(false); sp.interactable = false; try { sp.disableInteractive?.(); } catch (e) { /* ok */ } }
        sp.x = home.x; sp.y = home.y;
        if (Number.isFinite(home.depth)) sp.setDepth?.(home.depth);
        sp._npcCarried = null;
        sp._npcPlacedBy = null;
        sp._printedBy = null;   // slice 17: filed, so nobody's print any more
        if (sp._carryBodyOff) { sp._carryBodyOff = false; if (sp.body) sp.body.enable = true; }
        const rooms = W().rooms || {};
        if (fromRoomId && rooms[fromRoomId]?.objects?.[fromKey] === sp) delete rooms[fromRoomId].objects[fromKey];
        const room = rooms[home.roomId];
        if (room) { room.objects = room.objects || {}; room.objects[home.key] = sp; }
        const g = globalOf(sp);
        if (g) setGlobalVar(g, false);
        return true;
    };
    const setGlobalVar = (name, value) => {
        const gs = W().gameState;
        if (!gs) return;
        gs.globalVariables = gs.globalVariables || {};
        const old = gs.globalVariables[name];
        if (typeof W().setGlobalVariable === 'function') { W().setGlobalVariable(name, value); return; }
        gs.globalVariables[name] = value;
        W().eventDispatcher?.emit(`global_variable_changed:${name}`, { name, value, oldValue: old });
    };
    // No free slot: a copy of the first slot's texture (or notes1) on the producer, never takeable
    const cosmetics = new Map();
    let cosmeticSeq = 0;
    const makeCosmetic = (producerId, first) => {
        const scene = W().game;
        const prod = findSprite(producerId);
        if (!scene?.add?.sprite || !prod) return null;
        let tex = first?.sp?.texture?.key || first?.sp?.scenarioData?.type || 'notes1';
        if (scene.textures?.exists && !scene.textures.exists(tex)) tex = 'notes1';
        let at = centreOf(prod.sp);
        const fh = first?.sp?._slotHome;
        if (fh) {
            const fs = first.sp, w = fs.displayWidth || fs.width || 0, h = fs.displayHeight || fs.height || 0;
            at = { x: fh.x + w * (0.5 - (fs.originX ?? 0.5)), y: fh.y + h * (0.5 - (fs.originY ?? 0.5)) };
        }
        const sp = scene.add.sprite(at.x, at.y, tex);
        sp.setOrigin?.(0.5, 0.5);
        sp.setDepth?.((prod.sp.depth || at.y) + 1);
        const handle = `cosmetic:${producerId}:${++cosmeticSeq}`;
        cosmetics.set(handle, sp);
        return handle;
    };

    return {
        // Wind-up before an NPC leaves its post (ms). scenario.npcWindupMs, default 700; 0 turns it off.
        windupMs: () => { const v = W().gameScenario?.npcWindupMs; return Number.isFinite(v) ? v : 700; },
        elapsedMs: () => (W().gameClock ? W().gameClock.elapsedMs() : Date.now()),
        isVmActive: () => !!W().isVmContextActive?.(),
        npcIds: () => [...(W().npcManager?.npcs?.keys?.() || [])],
        // Loaded rooms; a new id is a room load (the needs system clears its select back-offs)
        roomIds: () => Object.keys(W().rooms || {}),
        // Room leash: a loaded room's needsPrivateTo (createRoom keeps it; the bootstrap scenario
        // strips room fields it does not list, so the scenario copy is only a fallback)
        roomPrivateTo(roomId) {
            const v = W().rooms?.[roomId]?.needsPrivateTo ?? W().gameScenario?.rooms?.[roomId]?.needsPrivateTo;
            return Array.isArray(v) ? v : null;
        },
        getNpc: id => W().npcManager?.getNPC?.(id) || W().npcManager?.npcs?.get?.(id) || null,
        npcPos(id) {
            const b = behaviour(id);
            const sp = b?.sprite;
            if (!sp || sp.destroyed || !sp.body) return null;
            const c = sp.body.center;
            return { x: c.x, y: c.y, roomId: b.roomId };
        },
        npcStatus(id) {
            const b = behaviour(id);
            const hs = W().npcHostileSystem;
            return {
                ko: !!hs?.isNPCKO?.(id),
                hostile: !!hs?.isNPCHostile?.(id),
                hidden: !b?.sprite?.body?.enable
            };
        },
        inChatWith(id) {
            const mg = W().MinigameFramework?.currentMinigame;
            if (!mg) return false;
            // Base on the open minigame's own npcId: person-chat swaps
            // currentConversationNPCId briefly around nested calls.
            const isPerson = W().currentConversationMinigameType === 'person-chat' || /person/i.test(mg.constructor?.name || '');
            return isPerson && mg.npcId === id;
        },
        listObjects() {
            const out = [];
            const rooms = W().rooms || {};
            for (const roomId of Object.keys(rooms).sort()) {
                const objs = rooms[roomId]?.objects;
                if (!objs) continue;
                for (const k of Object.keys(objs).sort()) {
                    const sp = objs[k];
                    const sd = sp?.scenarioData;
                    if (!sd || (typeof sd.needsTag !== 'string' && !affordanceOf(sp))) continue;
                    out.push(describe(roomId, k, sp));
                }
            }
            return out;
        },
        getObject(id) {
            const f = findSprite(id);
            return f ? describe(f.roomId, f.key, f.sp) : null;
        },
        approachCell(obj) {
            const pm = W().pathfindingManager;
            const uf = obj.affordance?.useFrom;
            if (pm?.findNearestWalkableWorldCell) {
                if (uf && Number.isFinite(uf.dx) && Number.isFinite(uf.dy)) {
                    const c = pm.findNearestWalkableWorldCell(obj.x + uf.dx * TILE, obj.y + uf.dy * TILE, 1);
                    if (c) return c;
                }
                // Item on the floor: stand on it. Furniture: the nearest walkable cell.
                return pm.findNearestWalkableWorldCell(obj.x, obj.y, 3);
            }
            return { x: obj.x, y: obj.y + TILE };
        },
        reachable(id, obj, opts) {
            const pm = W().pathfindingManager;
            const pos = this.npcPos(id);
            if (!pm?.findWorldPath || !pos) return true;
            const cell = this.approachCell(obj);
            if (!cell) return false;
            // Already standing at it (an NPC at its own desk): EasyStar gives no path
            // when start and end share a tile, which read as unreachable and sent the
            // NPC to the next desk instead of its own.
            if (Math.hypot(pos.x - cell.x, pos.y - cell.y) < TILE) return true;
            // EasyStar 0.4 hands its result to the callback through setTimeout unless
            // sync is on, so the answer would arrive after we return. Turn sync on for
            // this one call (single-threaded: nothing else can be queued meanwhile).
            const pf = pm.worldPathfinder;
            const canSync = !!(pf && pf.enableSync && pf.disableSync);
            let ok = false, called = false;
            if (canSync) pf.enableSync();
            try {
                const cb = p => { called = true; ok = !!(p && p.length); };
                if (opts?.avoidRooms?.length) pm.findWorldPath(pos.x, pos.y, cell.x, cell.y, cb, false, { avoidRooms: opts.avoidRooms });
                else pm.findWorldPath(pos.x, pos.y, cell.x, cell.y, cb);
            } catch (e) {
                return false;
            } finally {
                if (canSync) pf.disableSync();
            }
            // No answer (world grid not ready, or sync unsupported): unknown, so do
            // not block the NPC. The job timeout still catches a truly unreachable target.
            return called ? ok : true;
        },
        playerProximity(id) {
            const pl = W().player;
            const pos = this.npcPos(id);
            if (!pl || !pos) return { nearby: false, distance: null };
            const pr = pl.body?.center || { x: pl.x, y: pl.y };
            const distance = Math.hypot(pr.x - pos.x, pr.y - pos.y);
            const sameRoom = !W().currentPlayerRoom || !pos.roomId || W().currentPlayerRoom === pos.roomId;
            // Clear of walls and closed doors: the same test the NPC uses to turn to the
            // player (not the physics line, which furniture between them would block).
            let clear = true;
            const b = behaviour(id);
            if (b?.canSeePlayerToFace) { try { clear = !!b.canSeePlayerToFace({ x: pr.x, y: pr.y }); } catch (e) { clear = true; } }
            return { nearby: sameRoom && distance <= 96 && clear, distance };
        },
        // Chat overhearing (slice 8): the playerProximity tests (same room, clear line) at a chat radius
        playerHears(id, radius) {
            const pl = W().player;
            const pos = this.npcPos(id);
            if (!pl || !pos) return { overheard: false, distance: null };
            const pr = pl.body?.center || { x: pl.x, y: pl.y };
            const distance = Math.hypot(pr.x - pos.x, pr.y - pos.y);
            const sameRoom = !W().currentPlayerRoom || !pos.roomId || W().currentPlayerRoom === pos.roomId;
            if (!sameRoom || distance > radius) return { overheard: false, distance };
            // Lit: nobody overhears in a dark room (slice 15 audience rule, OFFICE_LIFE_PLAN 11.4)
            const ls = W().lightingSystem, lit = ls?.rooms?.get?.(pos.roomId);
            if (lit && typeof ls.roomLevel === 'function' && ls.roomLevel(lit) < 0.5) return { overheard: false, distance };   // roomIsDark (DARK_LEVEL)
            let clear = true;
            const b = behaviour(id);
            if (b?.canSeePlayerToFace) { try { clear = !!b.canSeePlayerToFace({ x: pr.x, y: pr.y }); } catch (e) { clear = true; } }
            return { overheard: clear, distance };
        },
        // Scenario chatter pools (object, false, or undefined for the built-ins)
        chatterConfig: () => W().gameScenario?.chatter,
        // Voiced chatter (slice 15): npc-needs-chatter.js speaks lines and runs exchange knots on
        // a separate ink story instance; until it has loaded, lines are bubbles only
        speak: (id, line, info) => W().npcChatterVoice?.say(id, line, info),
        exchangeLines: (id, knot) => W().npcChatterVoice?.exchangeLines(id, knot) ?? null,
        setGlobal(name, value) {
            const v = W().npcChatterVoice;
            if (v?.setGlobal) { v.setGlobal(name, value); return; }
            const g = W().gameState?.globalVariables;
            if (g) g[name] = value;
        },
        // needsCompany requireGlobal (requiredGlobalsHold, copied from npc-sight-challenge.js)
        globalHolds: cond => requiredGlobalsHold(cond, W().gameState?.globalVariables || {}),
        // A second user of a shared object stands one tile beside the first: right, left, below, above
        besideCell(cell, taken) {
            const pm = W().pathfindingManager;
            if (!pm?.findNearestWalkableWorldCell) return null;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const c = pm.findNearestWalkableWorldCell(cell.x + dx * TILE, cell.y + dy * TILE, 0);
                if (c && !taken.some(t => Math.hypot(t.x - c.x, t.y - c.y) < TILE / 2)) return c;
            }
            return null;
        },
        // Queue cells (slice 10): offsets in tiles from the approach cell, each snapped to the exact
        // walkable 8 px cell there (no search: a cell on furniture is dropped, not moved), with the
        // room it lies in (the object's room first, for a cell on a shared edge)
        queueCells(obj, offsets) {
            const pm = W().pathfindingManager;
            const base = this.approachCell(obj);
            if (!base || !pm?.findNearestWalkableWorldCell) return [];
            const rooms = W().rooms || {};
            const roomAt = (x, y) => {
                const inside = r => r?.position && r.map && x >= r.position.x && y >= r.position.y
                    && x < r.position.x + r.map.widthInPixels && y < r.position.y + r.map.heightInPixels;
                if (inside(rooms[obj.roomId])) return obj.roomId;
                for (const id of Object.keys(rooms).sort()) if (inside(rooms[id])) return id;
                return obj.roomId;
            };
            const out = [];
            for (const o of offsets) {
                const c = pm.findNearestWalkableWorldCell(base.x + o.dx * TILE, base.y + o.dy * TILE, 0);
                if (!c) continue;
                if ([base, ...out].some(t => Math.hypot(t.x - c.x, t.y - c.y) < TILE / 2)) continue;
                out.push({ x: c.x, y: c.y, roomId: roomAt(c.x, c.y) });
            }
            return out;
        },
        // After every needs tick: workstation auto-lock (workstation-state.js), on the needs clock.
        afterTick(clockMs) {
            W().workstationState?.tick?.(clockMs);
        },
        // For npc_caught_at_post: the player's distance to an NPC's home point (null when the
        // player is in another room) and whether the open minigame belongs to the home object.
        // PC-type minigames carry their object in a param (lockable, sprite, containerItem).
        playerAtPost(id, home) {
            const pl = W().player;
            let distance = null;
            if (pl && (!W().currentPlayerRoom || !home.roomId || W().currentPlayerRoom === home.roomId)) {
                const pr = pl.body?.center || { x: pl.x, y: pl.y };
                distance = Math.hypot(pr.x - home.x, pr.y - home.y);
            }
            const params = W().MinigameFramework?.currentMinigame?.params;
            // The examine view names its object by a string itemId (as workstation-state's minigameOnObject)
            const inMinigame = !!(params && home.objectId && (params.itemId === home.objectId || params.objectId === home.objectId
                || Object.values(params).some(v => v && typeof v === 'object' && (v.scenarioData?.id === home.objectId || v.objectId === home.objectId))));
            return { distance, inMinigame };
        },
        tileToWorld(roomId, x, y) {
            const room = W().rooms?.[roomId];
            if (!room?.position) return null;
            return { x: room.position.x + x * TILE, y: room.position.y + y * TILE };
        },
        speedFor(id) {
            const rec = W().npcManager?.getNPC?.(id);
            const v = Number(rec?.needsSpeed);
            if (v > 0) return v;
            return behaviour(id)?.config?.patrol?.speed || 80;
        },
        moveTo(id, x, y, speed, opts) {
            W().npcBehaviorManager?.goToAndStay(id, x, y, speed, { owner: 'needs', yieldToPlayer: !!opts?.yieldToPlayer, avoidRooms: opts?.avoidRooms || [], arriveWithin: opts?.arriveWithin || 0 });
        },
        cancelMove(id) {
            W().npcBehaviorManager?.cancelMove?.(id);
        },
        faceTo(id, x, y) {
            behaviour(id)?.faceWorldPoint?.(x, y);
        },
        pickUp(npcId, itemId) {
            const f = findSprite(itemId);
            if (!f || f.sp._npcCarried || f.sp.visible === false) return false;
            const sp = f.sp;
            if (isSlot(sp)) slotHome(sp, f.roomId, f.key);   // its declared spot, for a later stow
            sp._npcCarried = npcId;
            // Office visuals (slice 3) keep it visible in the carrier's hand (npc-office-visuals.js
            // follows it on postupdate); with "officeVisuals": false it is hidden, as before
            if (W().gameScenario?.officeVisuals === false) sp.setVisible?.(false);
            else if (sp.body && sp.body.enable !== false) { sp._carryBodyOff = true; sp.body.enable = false; }
            sp.interactable = false;
            try { sp.disableInteractive?.(); } catch (e) { /* no input zone */ }
            delete W().rooms[f.roomId].objects[f.key];
            const rec = W().npcManager?.getNPC?.(npcId);
            if (rec) {
                rec.itemsHeld = rec.itemsHeld || [];
                rec._needsCarried = rec._needsCarried || {};
                rec._needsCarried[itemId] = { sprite: sp, roomId: f.roomId, key: f.key };
            }
            return true;
        },
        consumeHeld(npcId, itemId) {
            const rec = W().npcManager?.getNPC?.(npcId);
            const held = rec?._needsCarried?.[itemId];
            if (!held) return;
            delete rec._needsCarried[itemId];
            try { held.sprite.destroy?.(); } catch (e) { /* already gone */ }
            // Used up: take it off the server's room state too, or a reload brings it back
            try { Promise.resolve(W().RoomStateSync?.removeItemFromRoom?.(held.roomId, itemId)).catch(() => {}); } catch (e) { /* offline */ }
        },
        dropHeld(npcId, itemId) {
            const rec = W().npcManager?.getNPC?.(npcId);
            const held = rec?._needsCarried?.[itemId];
            const pos = this.npcPos(npcId);
            if (!held) return;
            delete rec._needsCarried[itemId];
            const sp = held.sprite;
            const roomId = W().npcBehaviorManager?.getBehavior?.(npcId)?.roomId || held.roomId;
            if (pos) { sp.x = pos.x - (sp.displayWidth || 0) / 2; sp.y = pos.y - (sp.displayHeight || 0) / 2; }
            sp._npcCarried = null;
            if (sp._carryBodyOff) { sp._carryBodyOff = false; if (sp.body) sp.body.enable = true; }
            sp.setVisible?.(true);
            sp.interactable = true;
            try { sp.setInteractive?.({ useHandCursor: true }); } catch (e) { /* ok */ }
            const room = W().rooms?.[roomId] || W().rooms?.[held.roomId];
            if (room) { room.objects = room.objects || {}; room.objects[held.key] = sp; sp.roomId = roomId; }
        },
        // ── reveal slots (slice 7) ──
        // Set a delivered slot down on the target: at its centre plus placeAt {dx, dy} tiles, else
        // halfway from the centre towards the approach cell. The sprite is registered under the room
        // it now sits in, keyed by its object id (what player pickup looks up); sp.roomId stays the
        // declared room, the one the server knows it in. Client only.
        placeHeld(npcId, itemId, target) {
            const rec = W().npcManager?.getNPC?.(npcId);
            const held = rec?._needsCarried?.[itemId];
            if (!held || !target) return false;
            const sp = held.sprite;
            slotHome(sp, held.roomId, held.key);
            const pa = target.affordance?.placeAt;
            let at;
            if (pa && Number.isFinite(pa.dx) && Number.isFinite(pa.dy)) at = { x: target.x + pa.dx * TILE, y: target.y + pa.dy * TILE };
            else {
                const cell = this.approachCell(target);
                at = cell ? { x: (target.x + cell.x) / 2, y: (target.y + cell.y) / 2 } : { x: target.x, y: target.y };
            }
            delete rec._needsCarried[itemId];
            setCentre(sp, at);
            sp._npcCarried = null;
            sp._npcPlacedBy = npcId;
            const base = target._sprite?.depth;
            sp.setDepth?.(Number.isFinite(base) ? base + 1 : at.y + 1);
            sp.setVisible?.(true);
            sp.interactable = true;
            try { sp.setInteractive?.({ useHandCursor: true }); } catch (e) { /* ok */ }
            const room = W().rooms?.[target.roomId] || W().rooms?.[held.roomId];
            if (room) { room.objects = room.objects || {}; room.objects[sp.objectId || held.key] = sp; }
            W().eventDispatcher?.emit(`npc_placed:${itemId}`, { npcId, itemId, targetId: target.id, roomId: target.roomId });
            return true;
        },
        // File a slot away: hidden at its declared spot, back in its declared room's objects under its
        // original key, global false. No server call. False when it is gone (the player took it).
        stowSlot(itemId) {
            const f = findSprite(itemId);
            if (!f) return false;
            return stowSprite(f.sp, f.roomId, f.key);
        },
        stowHeld(npcId, itemId) {
            const rec = W().npcManager?.getNPC?.(npcId);
            const held = rec?._needsCarried?.[itemId];
            if (!held) return false;
            delete rec._needsCarried[itemId];
            slotHome(held.sprite, held.roomId, held.key);
            return stowSprite(held.sprite, null, null);
        },
        // revealOutput hook: the first free slot of the producer, by id. Free = loaded, not destroyed,
        // active, global not true, not held, placed or in the inventory. Shown by a direct call (after
        // a reload there is no reveal listener). None free: a cosmetic copy nobody can take.
        // opts.printedBy (slice 17): the owner stamped on the slot, or null; every reveal sets or
        // clears it, since slot sprites are reused.
        revealOutput(producerId, npcId, opts = null) {
            const slots = slotsOf(producerId);
            const free = slots.find(freeSlot);
            if (free) {
                slotHome(free.sp, free.roomId, free.key);
                free.sp._printedBy = opts?.printedBy || null;
                this.setGlobal(globalOf(free.sp), true);
                W().showRevealedObject?.(free.sp);
                // On its producer's tray: drawn above the producer whatever their y-sorted depths
                const prod = findSprite(producerId)?.sp;
                if (prod && Number.isFinite(prod.depth) && !(free.sp.depth > prod.depth)) free.sp.setDepth?.(prod.depth + 0.5);
                W().eventDispatcher?.emit(`object_revealed:${free.id}`, { producerId, npcId, objectId: free.id });
                return { slotId: free.id };
            }
            const cosmetic = makeCosmetic(producerId, slots[0]);
            return cosmetic ? { cosmetic } : {};
        },
        // Slice 17: the id of the producer's first free slot, or null (the full-pool check)
        freeSlotOf(producerId) {
            return slotsOf(producerId).find(freeSlot)?.id || null;
        },
        setPrintedBy(slotId, npcId) {
            const f = findSprite(slotId);
            if (f) f.sp._printedBy = npcId || null;
        },
        // Left-behind items (2.10, slice 11): loaded declared items with leftBehindBy this NPC that
        // could be shown now (not taken, not already shown, not in a hand or set down), by id.
        leftBehindItems(npcId) {
            const out = [];
            const rooms = W().rooms || {};
            for (const roomId of Object.keys(rooms)) {
                const objs = rooms[roomId]?.objects || {};
                for (const k of Object.keys(objs)) {
                    const sp = objs[k];
                    const sd = sp?.scenarioData;
                    if (!sd || sd.leftBehindBy !== npcId || !isSlot(sp)) continue;
                    if (sp.destroyed || sp.active === false || sp._npcCarried || sp._npcPlacedBy || inInventory(sp)) continue;
                    if (globalTrue(globalOf(sp))) continue;
                    out.push({ id: sd.id || sp.objectId || k, chance: Number(sd.leftBehindChance) || 0 });
                }
            }
            return out.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
        },
        // Show a left-behind item at its declared spot by a direct call (after a reload there is no
        // reveal listener), global true, object_revealed:<id> with leftBehindBy.
        revealLeftBehind(itemId, npcId) {
            const f = findSprite(itemId);
            if (!f || f.sp.destroyed || f.sp.active === false || inInventory(f.sp)) return false;
            slotHome(f.sp, f.roomId, f.key);
            this.setGlobal(globalOf(f.sp), true);
            W().showRevealedObject?.(f.sp);
            // On the owner's desk: drawn above the desk's dressing (it shares the home object's depth),
            // as a tray slot is lifted above its copier. Stow puts the declared depth back.
            const homeId = this.getNpc(npcId)?.needsHome;
            const home = typeof homeId === 'string' ? findSprite(homeId) : null;
            if (home && home.roomId === f.roomId && Number.isFinite(home.sp.depth) && !(f.sp.depth > home.sp.depth)) {
                const a = centreOf(home.sp), b = centreOf(f.sp);
                if (Math.hypot(a.x - b.x, a.y - b.y) <= 2 * TILE) f.sp.setDepth?.(home.sp.depth + 0.1);
            }
            W().eventDispatcher?.emit(`object_revealed:${itemId}`, { npcId, objectId: itemId, leftBehindBy: npcId });
            return true;
        },
        removeCosmetic(handle) {
            const sp = cosmetics.get(handle);
            cosmetics.delete(handle);
            try { sp?.destroy?.(); } catch (e) { /* gone */ }
        },
        // Stow on sight: every revealed slot in these rooms that no NPC holds (after a reload the
        // needs state is fresh, so nobody does). Returns the ids stowed.
        stowRevealedSlots(roomIds) {
            const out = [];
            for (const roomId of roomIds || []) {
                const objs = W().rooms?.[roomId]?.objects || {};
                for (const k of Object.keys(objs)) {
                    const sp = objs[k];
                    if (!sp || !isSlot(sp) || sp._npcCarried || sp.destroyed || sp.active === false) continue;
                    if (!globalTrue(globalOf(sp))) continue;
                    slotHome(sp, roomId, k);
                    if (stowSprite(sp, roomId, k)) out.push(sp.scenarioData?.id || k);
                }
            }
            if (out.length) console.log('[needs] stowed on sight:', out.join(', '));
            return out;
        },
        emit(name, data) {
            W().eventDispatcher?.emit(name, data);
        },
        setGlobal(name, value) {
            setGlobalVar(name, value);
        },
        // Slice 18b-i: magnets. The servings global as saved; a finished dropped magnet is removed as a
        // room object (consumeHeld's path), so the server forgets it and a reload keeps it gone.
        getGlobal: name => W().gameState?.globalVariables?.[name],
        removeMagnet(id) {
            const f = findSprite(id);
            if (!f) return false;
            const sp = f.sp;
            if (f.sp.proximityGhost) { try { f.sp.proximityGhost.destroy(); } catch (e) { /* ok */ } delete f.sp.proximityGhost; }
            delete W().rooms[f.roomId].objects[f.key];
            try { sp.destroy?.(); } catch (e) { /* already gone */ }
            try { Promise.resolve(W().RoomStateSync?.removeItemFromRoom?.(sp.roomId || f.roomId, id)).catch(() => {}); } catch (e) { /* offline */ }
            return true;
        },
        // A picked-up item stays in its old room's objects, inactive; a re-drop in another room must
        // not be shadowed by it (findSprite takes the first match)
        dropStale(id) {
            const rooms = W().rooms || {};
            for (const roomId of Object.keys(rooms)) {
                const objs = rooms[roomId]?.objects || {};
                for (const k of Object.keys(objs)) {
                    const sp = objs[k];
                    if ((k === id || sp?.scenarioData?.id === id) && (sp.active === false || sp.destroyed)) delete objs[k];
                }
            }
        }
    };
}

/** Build the live system, register needs NPCs and hook the arrival event. Idempotent. */
export function installNpcNeeds(opts = {}) {
    const w = typeof window !== 'undefined' ? window : null;
    if (!w) return null;
    if (!w.npcNeedsSystem) {
        const seed = opts.seed !== undefined ? opts.seed
            : (w.gameScenario?.npcNeedsSeed !== undefined ? w.gameScenario.npcNeedsSeed : (w.gameScenario?.scenario_name || w.gameScenario?.name || 'scenario'));
        w.npcNeedsSystem = new NPCNeedsSystem(createEngineWorld(), { seed });
        w.eventDispatcher?.on('npc_arrived:*', (data) => {
            if (data?.npcId) w.npcNeedsSystem.onArrived(data.npcId, data.owner);
        });
        // Slice 14: an opened door retries parked needs (room loads are noticed by _checkRooms)
        w.eventDispatcher?.on('door_opened', () => w.npcNeedsSystem.onDoorOpened());
        // Slice 18b-i: a dropped magnet (affordance.magnet) becomes a source where it lies
        w.eventDispatcher?.on('item_dropped:*', (data) => {
            if (typeof data?.itemId !== 'string') return;
            w.npcNeedsSystem?.world?.dropStale?.(data.itemId);
            w.npcNeedsSystem?.onItemDropped(data.itemId);
        });
        // Slice 18a: a source switched back on (affordance.offWhen) retries parked needs
        w.eventDispatcher?.on('global_variable_changed:*', (data, name) => {
            const g = data?.name || (typeof name === 'string' ? name.slice('global_variable_changed:'.length) : null);
            w.npcNeedsSystem?.onGlobalChanged(g);
        });
    }
    w.npcNeedsSystem.registerAll();
    return w.npcNeedsSystem;
}
