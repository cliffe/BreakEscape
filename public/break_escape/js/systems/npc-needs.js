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
        this.tickCount = 0;
        this._acc = 0;
        this._lastElapsed = null;
        this.states = new Map();
        this.log = [];
        this._arrivals = new Set();
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
        this.states.set(npcId, {
            npcId, needs, interests, levels, lastSatisfiedAt, rng,
            urgentFlag: {},
            mode: 'idle',
            prevMode: null,
            job: null,
            atPost: true,
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
        this.log = [];
        this.clockMs = 0;
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
        if (cmd && typeof cmd === 'object' && cmd.set && typeof cmd.set === 'object') {
            for (const [name, v] of Object.entries(cmd.set)) {
                if (s.needs[name] && Number.isFinite(Number(v))) {
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
        this.clockMs += NEEDS_TICK_MS;
        for (const id of [...this.states.keys()].sort()) {
            try {
                this._tickNpc(this.states.get(id));
            } catch (e) {
                if (typeof console !== 'undefined') console.error(`[needs] tick error for ${id}`, e);
            }
        }
    }

    _tickNpc(s) {
        const id = s.npcId;
        this._decay(s);

        const pos = this.world.npcPos(id);
        if (!pos) return; // sprite not loaded: decay only
        if (!s.home) s.home = this._resolveHome(s, pos);

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
                    this._moveForPhase(s);
                }
            } else if (s.mode === 'returning') {
                this._goHome(s);
            }
            return;
        }

        const arrived = this._arrivals.delete(id);

        if (s.mode === 'returning' && arrived) {
            s.mode = 'idle';
            s.atPost = true;
            this._log(id, 'returned_post');
            this.world.emit(`npc_returned_post:${id}`, { npcId: id });
        }

        if (s.mode === 'job') {
            this._advanceJob(s, arrived);
            return;
        }

        // idle or returning: an urgent need may start a job
        const pick = this._select(s, pos);
        if (pick) this._startJob(s, pick);
    }

    _decay(s) {
        for (const name of Object.keys(s.needs)) {
            const n = s.needs[name];
            if (s.job && s.job.need === name && s.job.phase === 'using') continue;
            const before = s.levels[name];
            s.levels[name] = clamp(before - n.decayPerMin * NEEDS_TICK_MS / 60000, 0, 100);
            const urgent = s.levels[name] <= n.urgentAt;
            if (urgent && !s.urgentFlag[name]) {
                s.urgentFlag[name] = true;
                this._log(s.npcId, 'urgent', { need: name, level: round2(s.levels[name]) });
                this.world.emit(`npc_need_urgent:${s.npcId}`, { npcId: s.npcId, need: name, level: round2(s.levels[name]) });
            } else if (!urgent) {
                s.urgentFlag[name] = false;
            }
        }
    }

    _starved(s, name) {
        const n = s.needs[name];
        return !!n.maxUnmetMin && (this.clockMs - s.lastSatisfiedAt[name]) >= n.maxUnmetMin * 60000;
    }

    _claims(objectId, exceptNpc) {
        let c = 0;
        for (const o of this.states.values()) {
            if (o.npcId === exceptNpc || !o.job) continue;
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
        if (this._claims(obj.id, s.npcId) >= cap) return false;
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
            if (typeof this.world.reachable !== 'function' || this.world.reachable(s.npcId, o)) return o;
        }
        return null;
    }

    _select(s, pos) {
        const objects = this.world.listObjects();
        let best = null;
        for (const name of Object.keys(s.needs)) {
            const n = s.needs[name];
            const starved = this._starved(s, name);
            const level = s.levels[name];
            if (!(level <= n.urgentAt) && !starved) continue;
            const score = starved ? 1000 + n.weight : n.weight * (n.urgentAt - level) / n.urgentAt;
            if (best && !(score > best.score)) continue;
            const cand = this._useCandidate(s, name, objects, pos);
            if (cand) best = { ...cand, need: name, score };
        }
        // Interests: a reachable item with the tag is the stimulus. No item, no
        // option (the NPC holds still); an item scores the flat interest weight.
        for (const tag of Object.keys(s.interests)) {
            const it = s.interests[tag];
            if (best && !(it.weight > best.score)) continue;
            const cand = this._carryCandidate(s, tag, it, objects, pos);
            if (cand) best = { ...cand, need: null, score: it.weight };
        }
        return best;
    }

    _useCandidate(s, name, objects, pos) {
        const opts = objects.filter(o => o.affordance && asList(o.affordance.satisfies).includes(name) && this._free(s, o));
        const target = this._nearestReachable(s, opts, pos);
        return target ? { kind: 'use', targetId: target.id } : null;
    }

    _carryCandidate(s, tag, it, objects, pos) {
        const rooms = it.noticeRooms || (s.home?.roomId ? [s.home.roomId] : (pos.roomId ? [pos.roomId] : []));
        const items = objects.filter(o => o.needsTag === tag && o.pickable && rooms.includes(o.roomId)
            && !this._itemClaimed(o.id, s.npcId) && !(s.cooldowns[o.id] > this.clockMs));
        const item = this._nearestReachable(s, items, pos);
        if (!item) return null;
        const targets = objects.filter(o => o.affordance && asList(o.affordance.accepts).includes(tag) && this._free(s, o));
        if (!targets.length) return null;
        const homeObj = s.home?.objectId ? targets.find(t => t.id === s.home.objectId) : null;
        const target = (homeObj && (typeof this.world.reachable !== 'function' || this.world.reachable(s.npcId, homeObj)))
            ? homeObj : this._nearestReachable(s, targets, item);
        if (!target) return null;
        return { kind: 'carry', targetId: target.id, itemId: item.id, tag };
    }

    _startJob(s, pick) {
        const id = s.npcId;
        s.job = {
            need: pick.need, kind: pick.kind, targetId: pick.targetId,
            itemId: pick.itemId || null, tag: pick.tag || null,
            phase: pick.kind === 'carry' ? 'goto_item' : 'goto_target',
            startedAt: this.clockMs, deadline: 0, useUntil: 0, carrying: false
        };
        s.mode = 'job';
        this._log(id, 'job_start', { need: pick.need || undefined, tag: pick.tag || undefined, target: pick.targetId, item: pick.itemId || undefined });
        if (s.atPost) {
            s.atPost = false;
            this.world.emit(`npc_left_post:${id}`, { npcId: id, need: pick.need, targetId: pick.targetId });
        }
        this._moveForPhase(s);
    }

    _moveForPhase(s) {
        const id = s.npcId;
        const job = s.job;
        const destId = job.phase === 'goto_item' ? job.itemId : job.targetId;
        const obj = this.world.getObject(destId);
        const cell = obj ? this.world.approachCell(obj) : null;
        if (!cell) { this._failJob(s, 'no_approach'); return; }
        const pos = this.world.npcPos(id) || cell;
        const speed = this.world.speedFor(id);
        const dist = Math.hypot(cell.x - pos.x, cell.y - pos.y);
        job.deadline = this.clockMs + Math.max(20000, 3 * dist / speed * 1000);
        job.dest = { x: cell.x, y: cell.y };
        if (dist <= HOME_EPS) { this._arrivals.add(id); return; }
        this.world.moveTo(id, cell.x, cell.y, speed, { yieldToPlayer: false });
    }

    _advanceJob(s, arrived) {
        const id = s.npcId;
        const job = s.job;
        if (job.phase === 'goto_item' || job.phase === 'goto_target') {
            if (job.phase === 'goto_item') {
                const item = this.world.getObject(job.itemId);
                if (!item || !item.pickable) { this._abortJob(s, 'item_gone', { cancel: true }); this._goHome(s); return; }
            }
            if (!arrived) {
                if (this.clockMs >= job.deadline) this._failJob(s, 'timeout');
                return;
            }
            if (job.phase === 'goto_item') {
                if (!this.world.pickUp(id, job.itemId)) { this._abortJob(s, 'item_gone', { cancel: false }); this._goHome(s); return; }
                job.carrying = true;
                this._log(id, 'picked_up', { item: job.itemId });
                this.world.emit(`npc_picked_up:${job.itemId}`, { npcId: id, itemId: job.itemId, tag: job.tag });
                job.phase = 'goto_target';
                this._moveForPhase(s);
                return;
            }
            const obj = this.world.getObject(job.targetId);
            if (obj) this.world.faceTo(id, obj.x, obj.y);
            job.phase = 'using';
            const secs = Number(obj?.affordance?.useSeconds);
            job.useUntil = this.clockMs + (Number.isFinite(secs) ? clamp(secs, 0, 600) : 20) * 1000;
            this._log(id, 'using', { need: job.need, target: job.targetId });
            return;
        }
        if (job.phase === 'using' && this.clockMs >= job.useUntil) this._completeJob(s);
    }

    _completeJob(s) {
        const id = s.npcId;
        const job = s.job;
        const n = job.need ? s.needs[job.need] : null;
        const obj = this.world.getObject(job.targetId);
        const aff = obj?.affordance || {};
        if (n) {
            let restores = asList(aff.satisfies).includes(job.need) ? Number(aff.restores) || 0 : 0;
            restores *= 1 + (s.rng() * 2 - 1) * n.jitterPct / 100;
            s.levels[job.need] = clamp(s.levels[job.need] + restores, 0, 100);
            s.lastSatisfiedAt[job.need] = this.clockMs;
        }
        if (job.carrying) this.world.consumeHeld(id, job.itemId);
        const rec = this.world.getNpc(id) || {};
        this._log(id, 'used', { need: job.need || undefined, tag: job.tag || undefined, target: job.targetId, item: job.itemId || undefined, level: n ? round2(s.levels[job.need]) : undefined, payloadPresent: rec.usePayload !== undefined });
        this.world.emit(`npc_used:${job.targetId}`, {
            npcId: id, objectId: job.targetId, need: job.need,
            itemId: job.carrying ? job.itemId : null, tag: job.carrying ? job.tag : null,
            payload: cloneData(rec.usePayload),
            ...this._playerProximity(id)
        });
        const hook = rec.onUse && rec.onUse[job.targetId];
        if (hook && typeof hook === 'object') {
            if (typeof hook.setGlobal === 'string' && hook.setGlobal) this.world.setGlobal(hook.setGlobal, true);
            if (typeof hook.emitEvent === 'string' && hook.emitEvent) this.world.emit(hook.emitEvent, { npcId: id, objectId: job.targetId });
        }
        s.job = null;
        this._goHome(s);
    }

    /** Player proximity at use time: { playerNearby, playerDistance }. */
    _playerProximity(npcId) {
        const p = typeof this.world.playerProximity === 'function' ? this.world.playerProximity(npcId) : null;
        return { playerNearby: !!(p && p.nearby), playerDistance: p && Number.isFinite(p.distance) ? Math.round(p.distance) : null };
    }

    _failJob(s, reason) {
        const job = s.job;
        if (job) s.cooldowns[job.phase === 'goto_item' ? job.itemId : job.targetId] = this.clockMs + FAIL_COOLDOWN_MS;
        this.world.emit(`npc_job_failed:${s.npcId}`, { npcId: s.npcId, need: job?.need, targetId: job?.targetId, reason });
        this._abortJob(s, reason, { cancel: true, failed: true });
        this._goHome(s);
    }

    _abortJob(s, reason, { cancel, failed } = {}) {
        const job = s.job;
        if (!job) return;
        if (cancel) this.world.cancelMove(s.npcId);
        if (job.carrying) this.world.dropHeld(s.npcId, job.itemId);
        this._log(s.npcId, failed ? 'job_failed' : 'job_aborted', { need: job.need || undefined, tag: job.tag || undefined, target: job.targetId, reason });
        s.job = null;
    }

    _resolveHome(s, pos) {
        const rec = this.world.getNpc(s.npcId) || {};
        const h = rec.needsHome;
        if (typeof h === 'string') {
            const obj = this.world.getObject(h);
            const cell = obj ? this.world.approachCell(obj) : null;
            if (cell) return { x: cell.x, y: cell.y, roomId: obj.roomId, objectId: h };
        } else if (h && typeof h === 'object' && h.room) {
            const w = this.world.tileToWorld(h.room, h.x, h.y);
            if (w) return { x: w.x, y: w.y, roomId: h.room, objectId: null };
        }
        return { x: pos.x, y: pos.y, roomId: pos.roomId || null, objectId: null };
    }

    _goHome(s) {
        const id = s.npcId;
        s.mode = 'returning';
        const pos = this.world.npcPos(id);
        if (!s.home || !pos) { s.mode = 'idle'; return; }
        if (Math.hypot(pos.x - s.home.x, pos.y - s.home.y) <= HOME_EPS) {
            this._arrivals.add(id);
            return;
        }
        this.world.moveTo(id, s.home.x, s.home.y, this.world.speedFor(id), { yieldToPlayer: true });
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

    getState(npcId) {
        const s = this.states.get(npcId);
        if (!s) return null;
        const levels = {};
        for (const k of Object.keys(s.levels)) levels[k] = round2(s.levels[k]);
        return {
            npcId, mode: s.mode, levels, atPost: s.atPost, scriptSuspended: s.scriptSuspended,
            job: s.job ? { need: s.job.need, kind: s.job.kind, phase: s.job.phase, targetId: s.job.targetId, itemId: s.job.itemId, carrying: s.job.carrying } : null,
            home: s.home ? { x: Math.round(s.home.x), y: Math.round(s.home.y), roomId: s.home.roomId } : null,
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
    const describe = (roomId, key, sp) => {
        const sd = sp.scenarioData || {};
        const id = sd.id || sp.objectId || key;
        const c = centreOf(sp);
        return {
            id, roomId, x: c.x, y: c.y,
            affordance: sd.affordance && typeof sd.affordance === 'object' ? sd.affordance : null,
            needsTag: typeof sd.needsTag === 'string' ? sd.needsTag : null,
            pickable: sp.visible !== false && sp.active !== false && !sp._npcCarried && !sp.destroyed,
            _sprite: sp
        };
    };
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

    return {
        elapsedMs: () => (W().gameClock ? W().gameClock.elapsedMs() : Date.now()),
        isVmActive: () => !!W().isVmContextActive?.(),
        npcIds: () => [...(W().npcManager?.npcs?.keys?.() || [])],
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
                    if (!sd || (!sd.affordance && !sd.needsTag)) continue;
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
        reachable(id, obj) {
            const pm = W().pathfindingManager;
            const pos = this.npcPos(id);
            if (!pm?.findWorldPath || !pos) return true;
            const cell = this.approachCell(obj);
            if (!cell) return false;
            // EasyStar 0.4 hands its result to the callback through setTimeout unless
            // sync is on, so the answer would arrive after we return. Turn sync on for
            // this one call (single-threaded: nothing else can be queued meanwhile).
            const pf = pm.worldPathfinder;
            const canSync = !!(pf && pf.enableSync && pf.disableSync);
            let ok = false, called = false;
            if (canSync) pf.enableSync();
            try {
                pm.findWorldPath(pos.x, pos.y, cell.x, cell.y, p => { called = true; ok = !!(p && p.length); });
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
            W().npcBehaviorManager?.goToAndStay(id, x, y, speed, { owner: 'needs', yieldToPlayer: !!opts?.yieldToPlayer });
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
            sp._npcCarried = npcId;
            sp.setVisible?.(false);
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
            sp.setVisible?.(true);
            sp.interactable = true;
            try { sp.setInteractive?.({ useHandCursor: true }); } catch (e) { /* ok */ }
            const room = W().rooms?.[roomId] || W().rooms?.[held.roomId];
            if (room) { room.objects = room.objects || {}; room.objects[held.key] = sp; sp.roomId = roomId; }
        },
        emit(name, data) {
            W().eventDispatcher?.emit(name, data);
        },
        setGlobal(name, value) {
            const gs = W().gameState;
            if (!gs) return;
            gs.globalVariables = gs.globalVariables || {};
            const old = gs.globalVariables[name];
            if (typeof W().setGlobalVariable === 'function') { W().setGlobalVariable(name, value); return; }
            gs.globalVariables[name] = value;
            W().eventDispatcher?.emit(`global_variable_changed:${name}`, { name, value, oldValue: old });
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
    }
    w.npcNeedsSystem.registerAll();
    return w.npcNeedsSystem;
}
