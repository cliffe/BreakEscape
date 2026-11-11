/**
 * The workaround runner (ACCESS_MODEL_SLICE_9_2_PLAN.md section 6, sub-slice B).
 *
 * The server decides when a frustrated NPC works round an outage and hands one workaround over
 * at a time, as `run` in an answer to POST /npc_frustration (or as `pending` in GET /scenario
 * after a reload). The needs system emits `npc_workaround_due:<npcId>` with it; this module then:
 *
 * - has the NPC say its start line (`NPCNeedsSystem.mutter(npcId, 'wk_<kind>')`; none for emit);
 * - emits `npc_workaround:<npcId>` with { npcId, index, do, phase: 'started' };
 * - performs it: `writes_down` is an at-post visit to the NPC's own needsHome PC, `prop_door` a
 *   visit to the prop, `emit` fires its event with { npcId, level } and no visit;
 * - on `npc_visit_done` calls POST /npc_workaround with `index` and `hand`; on
 *   `npc_visit_dropped` (or a visit that cannot be queued) reports it `dropped`;
 * - applies the answer once per hand-over: the sticky note mark (`postitMarks.mark`), the
 *   propped door (every loaded door sprite to the room, as NPCGameBridge.unlockDoor does), the
 *   `setGlobal`; then emits `npc_workaround:<npcId>` with phase 'done' (or 'dropped'), and for a
 *   prop_door `door_propped:<roomId>` with { roomId, npcId }.
 *
 * A failed request is resent (the server answers a spent hand-over again with the same body); a
 * 425 (the dwell has not passed in server time) is resent after the dwell; a 403 ends it. On a
 * load, `restore(block)` sets every done workaround's `setGlobal` again and remembers every
 * propped room (a done prop_door's `door`); `syncRoom(roomId)`, called as each room is built,
 * opens that room's door sprites to a propped room, so a propped door looks open after a reload
 * (plan 11.1 X4) as it did when it was propped.
 *
 * Nothing here is secret: a run names ids, a kind and a dwell; no password passes through.
 */

export const START_POOLS = Object.freeze({
    writes_down: 'wk_writes_down', prop_door: 'wk_prop_door', borrow_session: 'wk_borrow', share_login: 'wk_share_login'
});
export const RETRY_MS = 2000;
export const MAX_ATTEMPTS = 6;
const VISIT_KINDS = new Set(['writes_down', 'prop_door']);

const keyOf = (npcId, run) => `${npcId}:${run.index}:${run.hand}`;

export class NpcWorkarounds {
    /**
     * @param {Object} deps - { send(body) -> Promise<answer> (throws with err.status), needs() ->
     *   NPCNeedsSystem, emit(name, data), setGlobal(name, value), markPostit(pcId, on),
     *   openDoor(roomId, roomData), npcRecord(npcId), setTimer(fn, ms) }
     */
    constructor(deps = {}) {
        this.deps = deps;
        this.active = new Map();     // key -> { npcId, run, state: 'running' | 'sending' }
        this.finished = new Set();   // keys whose answer has been applied (or that ended)
        this.propped = new Set();    // rooms a done prop_door holds open
        this.requests = 0;
    }

    _needs() { return typeof this.deps.needs === 'function' ? this.deps.needs() : null; }
    _emit(name, data) { this.deps.emit?.(name, data); }
    _timer(fn, ms) { (this.deps.setTimer || ((f, t) => setTimeout(f, t)))(fn, ms); }

    /** `npc_workaround_due:<npcId>` from the needs system: { npcId, run, level }. */
    due(data) {
        const npcId = data?.npcId;
        const run = data?.run;
        if (typeof npcId !== 'string' || !run || typeof run !== 'object') return false;
        if (!Number.isInteger(run.index) || !Number.isInteger(run.hand)) return false;
        const key = keyOf(npcId, run);
        if (this.active.has(key) || this.finished.has(key)) return false;   // started once
        const job = { npcId, run, level: Number(data.level) || 0, state: 'running', attempts: 0 };
        this.active.set(key, job);
        const pool = START_POOLS[run.do];
        if (pool) this._needs()?.mutter?.(npcId, pool);
        this._emit(`npc_workaround:${npcId}`, { npcId, index: run.index, do: run.do, phase: 'started' });

        if (run.do === 'emit') {
            if (typeof run.event === 'string' && run.event) this._emit(run.event, { npcId, level: job.level });
            this._send(key, false);
            return true;
        }
        if (VISIT_KINDS.has(run.do)) {
            const at = run.do === 'writes_down' ? this._home(npcId) : run.prop;
            const queued = typeof at === 'string' && at && this._needs()?.enqueueVisit?.(npcId, {
                kind: 'workaround', at: { objectId: at }, useSeconds: Number(run.dwell) || undefined,
                data: { workaround: { index: run.index, hand: run.hand, do: run.do } }
            });
            if (!queued) this._send(key, true);
            return true;
        }
        // A kind this build does not perform (sub-slice H's): give the hand-over back
        this._send(key, true);
        return true;
    }

    _home(npcId) {
        const rec = this.deps.npcRecord?.(npcId);
        return typeof rec?.needsHome === 'string' ? rec.needsHome : null;
    }

    _jobFor(data) {
        const w = data?.data?.workaround;
        if (data?.kind !== 'workaround' || !w || typeof data.npcId !== 'string') return null;
        const key = keyOf(data.npcId, w);
        const job = this.active.get(key);
        return job && job.state === 'running' ? key : null;
    }

    /** `npc_visit_done:<npcId>`: the visit was performed. */
    visitDone(data) {
        const key = this._jobFor(data);
        if (key) this._send(key, false);
    }

    /** `npc_visit_dropped:<npcId>`: the visit was never made, or was cut short. */
    visitDropped(data) {
        const key = this._jobFor(data);
        if (key) this._send(key, true);
    }

    async _send(key, dropped) {
        const job = this.active.get(key);
        if (!job) return;
        job.state = 'sending';
        job.dropped = dropped;
        job.attempts++;
        this.requests++;
        let answer;
        try {
            answer = await this.deps.send({ npc_id: job.npcId, index: job.run.index, hand: job.run.hand, dropped: !!dropped });
        } catch (err) {
            const status = err?.status;
            if (status === 403) { this._end(key, 'refused'); return; }
            if (job.attempts >= MAX_ATTEMPTS) { this._end(key, 'gave_up'); return; }
            // 425: the server's dwell has not passed yet; anything else: lost on the way
            const wait = status === 425 ? Math.max(RETRY_MS, (Number(err?.body?.retryAfter) || Number(job.run.dwell) || 0) * 1000) : RETRY_MS * job.attempts;
            this._timer(() => this._send(key, dropped), wait);
            return;
        }
        this._apply(key, answer || {});
    }

    _end(key, reason) {
        const job = this.active.get(key);
        this.active.delete(key);
        this.finished.add(key);
        if (job) this._emit(`npc_workaround:${job.npcId}`, { npcId: job.npcId, index: job.run.index, do: job.run.do, phase: 'ended', reason });
    }

    _apply(key, body) {
        const job = this.active.get(key);
        if (!job || this.finished.has(key)) return;
        this.active.delete(key);
        this.finished.add(key);
        const { npcId, run } = job;
        if (job.dropped) {
            this._emit(`npc_workaround:${npcId}`, { npcId, index: run.index, do: run.do, phase: 'dropped' });
            return;
        }
        if (typeof body.pcId === 'string' && body.hasPostit === true) this.deps.markPostit?.(body.pcId, true);
        if (typeof body.roomId === 'string') {
            this.propped.add(body.roomId);
            this.deps.openDoor?.(body.roomId, body.roomData || null);
        }
        if (typeof body.setGlobal === 'string' && body.setGlobal) this.deps.setGlobal?.(body.setGlobal, true);
        this._emit(`npc_workaround:${npcId}`, { npcId, index: run.index, do: run.do, phase: 'done' });
        if (typeof body.roomId === 'string') this._emit(`door_propped:${body.roomId}`, { roomId: body.roomId, npcId });
    }

    /**
     * GET /scenario's npcFrustration: every done workaround's setGlobal is set again, and every
     * propped room is remembered and its doors in the rooms already built are opened.
     */
    restore(block) {
        if (!block || typeof block !== 'object') return;
        for (const entry of Object.values(block)) {
            for (const d of Array.isArray(entry?.done) ? entry.done : []) {
                if (typeof d?.setGlobal === 'string' && d.setGlobal) this.deps.setGlobal?.(d.setGlobal, true);
                if (d?.do === 'prop_door' && typeof d.door === 'string' && d.door) this.propped.add(d.door);
            }
        }
        if (this.propped.size) for (const roomId of this.deps.loadedRooms?.() || []) this.syncRoom(roomId);
    }

    /**
     * A room has been built: open its door sprites that lead to a propped room, with no lock and
     * no server call (the room is already in unlockedRooms). Returns how many it opened.
     */
    syncRoom(roomId) {
        if (!this.propped.size || typeof roomId !== 'string') return 0;
        let n = 0;
        for (const sp of this.deps.doorSprites?.(roomId) || []) {
            const props = sp?.doorProperties;
            if (!props || props.open || sp.proppedOpening || sp.active === false || !this.propped.has(props.connectedRoom)) continue;
            sp.proppedOpening = true;   // openDoor may finish later, once the far room has loaded
            props.locked = false;
            this.deps.openSprite?.(sp);
            n++;
        }
        return n;
    }
}

/** Door sprites in loaded rooms that lead to roomId (npc-game-bridge.js's rule). */
export function doorSpritesFor(roomId, w) {
    const out = [];
    for (const room of Object.values(w.rooms || {})) {
        for (const sp of Array.isArray(room?.doorSprites) ? room.doorSprites : []) {
            if (sp?.doorProperties?.connectedRoom === roomId) out.push(sp);
        }
    }
    return out;
}

/** Door sprites of one built room. */
export function roomDoorSprites(roomId, w) {
    const room = w.rooms?.[roomId];
    return Array.isArray(room?.doorSprites) ? room.doorSprites : [];
}

/** Open a propped room on the client, as NPCGameBridge.unlockDoor does after the server agrees. */
export function openProppedDoor(roomId, roomData, w = (typeof window !== 'undefined' ? window : {})) {
    if (roomData && w.roomDataCache?.set) w.roomDataCache.set(roomId, roomData);
    if (w.gameScenario?.rooms?.[roomId]) w.gameScenario.rooms[roomId].locked = false;
    if (w.rooms?.[roomId]) w.rooms[roomId].locked = false;
    for (const sp of doorSpritesFor(roomId, w)) {
        if (sp.doorProperties) sp.doorProperties.locked = false;
        if (typeof w.unlockDoor === 'function') {
            try { w.unlockDoor(sp, roomData); } catch (e) { console.warn('propped door failed to open', e); }
        }
    }
}

/** Install the live runner as window.npcWorkarounds. */
export function installNpcWorkarounds(api) {
    const w = typeof window !== 'undefined' ? window : null;
    if (!w) return null;
    if (w.npcWorkarounds) return w.npcWorkarounds;
    const runner = new NpcWorkarounds({
        send: body => (typeof api.npcWorkaround === 'function' ? api.npcWorkaround(body) : api.post('/npc_workaround', body)),
        needs: () => w.npcNeedsSystem,
        emit: (name, data) => w.eventDispatcher?.emit?.(name, data),
        // As the needs system's own setGlobalVar: through setGlobalVariable when present, else
        // written and announced, so revealOnGlobal shows the prop
        setGlobal: (name, value) => {
            const gs = w.gameState;
            if (!gs) return;
            gs.globalVariables = gs.globalVariables || {};
            const old = gs.globalVariables[name];
            if (old === value) return;
            if (typeof w.setGlobalVariable === 'function') { w.setGlobalVariable(name, value); return; }
            gs.globalVariables[name] = value;
            w.eventDispatcher?.emit?.(`global_variable_changed:${name}`, { name, value, oldValue: old });
        },
        markPostit: (pcId, on) => w.postitMarks?.mark?.(pcId, on),
        openDoor: (roomId, roomData) => openProppedDoor(roomId, roomData, w),
        loadedRooms: () => Object.keys(w.rooms || {}),
        doorSprites: roomId => roomDoorSprites(roomId, w),
        openSprite: sp => {
            if (w.gameScenario?.rooms?.[sp.doorProperties.connectedRoom]) w.gameScenario.rooms[sp.doorProperties.connectedRoom].locked = false;
            if (typeof w.unlockDoor === 'function') {
                try { w.unlockDoor(sp, null); } catch (e) { console.warn('propped door failed to open', e); }
            }
        },
        npcRecord: id => w.npcManager?.npcs?.get?.(id) || null
    });
    w.npcWorkarounds = runner;
    const on = (name, fn) => w.eventDispatcher?.on?.(name, fn);
    on('npc_workaround_due:*', data => runner.due(data));
    on('npc_visit_done:*', data => runner.visitDone(data));
    on('npc_visit_dropped:*', data => runner.visitDropped(data));
    return runner;
}

export default NpcWorkarounds;
