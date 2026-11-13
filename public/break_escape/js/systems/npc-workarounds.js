/**
 * The workaround runner (ACCESS_MODEL_SLICE_9_2_PLAN.md section 6, sub-slice B).
 *
 * The server decides when a frustrated NPC works round an outage and hands one workaround over
 * at a time, as `run` in an answer to POST /npc_frustration (or as `pending` in GET /scenario
 * after a reload). The needs system emits `npc_workaround_due:<npcId>` with it; this module then:
 *
 * - performs it: `writes_down` is an at-post visit to the NPC's own needsHome PC, `prop_door` a
 *   visit to the prop, `emit` fires its event with { npcId, level } and no visit;
 * - once the visit is queued (an emit at once), has the NPC say its start line
 *   (`NPCNeedsSystem.mutter(npcId, 'wk_<kind>')`; none for emit) and emits
 *   `npc_workaround:<npcId>` with { npcId, index, do, phase: 'started' }; a visit that cannot be
 *   queued says nothing, fires no `started` and is given back as dropped;
 * - on `npc_visit_done` calls POST /npc_workaround with `index` and `hand`; on
 *   `npc_visit_dropped` (or a visit that cannot be queued) reports it `dropped`;
 * - applies the answer once per hand-over: the sticky note mark (`postitMarks.mark`), the
 *   propped door (every loaded door sprite to the room, as NPCGameBridge.unlockDoor does), the
 *   `setGlobal`; then emits `npc_workaround:<npcId>` with phase 'done' (or 'dropped'), and for a
 *   prop_door `door_propped:<roomId>` with { roomId, npcId }.
 *
 * A failed request is resent for as long as the page lives, with a backoff from RETRY_MS doubling
 * to RETRY_MAX_MS (the server answers a spent hand-over again with the same body, and holds an
 * unspent one as handed, so giving up would lose the workaround for the session); a 425 (the
 * dwell has not passed in server time) is resent after the time left, and the backoff starts again
 * after it; only a 403 ends it. A job still resending after STUCK_ATTEMPTS is warned once in the
 * console. The server also offers every unspent hand-over again (`pending`) in later fail,
 * too-soon and ease answers, so a lost answer to POST /npc_frustration does not strand it; `due`
 * starts each (npcId, index, hand) once. A
 * reload loses nothing either way: the server sends the unspent hand-over again as `pending`.
 * An answer of { dropped: true } to a "done" (the hand was already spent as dropped) is applied
 * as a drop, never as an emit's {}. On a
 * load, `restore(block)` sets every done workaround's `setGlobal` again and remembers every
 * propped room (a done prop_door's `door`); `syncRoom(roomId)`, called as each room is built,
 * opens that room's door sprites to a propped room, so a propped door looks open after a reload
 * (plan 11.1 X4) as it did when it was propped.
 *
 * A reload's re-start (`restored: true` in `npc_workaround_due`) is treated as any other: the NPC
 * sets off again, so it says its start line again. `level` in the emit payload is the client's
 * mirror of the frustration, not the server's figure; a mapping must not rely on it.
 *
 * Sub-slice H (plan 6.4, 6.5). `borrow_session` calls `NPCNeedsSystem.setBorrow(npcId, run)`, so
 * the NPC's next use of the failing need is at the borrowed PC; `npc_borrow_done` posts "done",
 * `npc_borrow_dropped` posts it dropped (a "done" for a use cut short carries `cut: true`, which
 * skips the server's floor, q43; a "done" with `met: false` and `lapsed: true` means the use there
 * was skipped unjudged after a lock check hold ran out: not refused, so "failed there" mappings
 * exclude it, review R3 m1), and an answer with `guest: true` emits
 * `npc_guest_left:<pcId>` with { npcId, objectId }, which the workstation layer records as the
 * PC's guest. `share_login` is a visit to the colleague (`with`): on arrival the NPC says a
 * `login_aloud` line. The listening window opens when that line is said (`npc_mutter:<npcId>`,
 * user decision q42: it can wait for the speech lock), and the visit is held beside the
 * colleague until then and for the share's dwell after (`NPCNeedsSystem.holdVisit`). Every
 * HEAR_TICK_MS of the window the runner asks whether the player
 * hears (`NPCNeedsSystem.playerHears`); the first tick that hears notes the player's room. "Done"
 * carries `heard` and that `room_id`. A heard answer { capture, line, note, displayName } shows a
 * toast titled "Overheard: <displayName>", adds the evidence note, mirrors the capture through
 * `window.mirrorSECapture` (the server recorded this heard share itself, so the client only
 * mirrors it for display) and emits `npc_overheard_login:<npcId>`; an unheard one ({}) does
 * nothing.
 *
 * A run names ids, a kind and a dwell; no password is in it. The one answer that carries a
 * password is a heard share's, which the server sends only for a heard "done" in an opened room.
 */

export const START_POOLS = Object.freeze({
    writes_down: 'wk_writes_down', prop_door: 'wk_prop_door', borrow_session: 'wk_borrow', share_login: 'wk_share_login'
});
export const RETRY_MS = 2000;
export const RETRY_MAX_MS = 30000;
export const STUCK_ATTEMPTS = 5;
// The kinds performed by a visit; borrow_session is a use job (NPCNeedsSystem.setBorrow, 6.4)
const VISIT_KINDS = new Set(['writes_down', 'prop_door', 'share_login']);
export const SHARE_DWELL_S = 6;      // plan 6.5: the walk to the colleague, 6 seconds there
export const HEAR_TICK_MS = 250;     // how often a share's dwell asks whether the player hears
export const ALOUD_POOL = 'login_aloud';
// User decision q42: how long a share stands waiting for its line, which can wait this long for
// the shared speech lock (MUTTER_WAIT_MS in npc-needs.js; a test checks they agree)
export const LINE_WAIT_MS = 20000;

/** The wait before resend number `attempts` (1, 2, ...): 2 s, 4 s, 8 s, 16 s, then 30 s. */
export function retryDelay(attempts) {
    return Math.min(RETRY_MAX_MS, RETRY_MS * 2 ** Math.max(0, attempts - 1));
}

const keyOf = (npcId, run) => `${npcId}:${run.index}:${run.hand}`;

/**
 * Plain text for a notebook page (review R1 M1): the notes page renders a markdown subset
 * (utils/note-markdown.js, after utils/display-dashes.js), so each of its escapable characters
 * is given a backslash and the page shows the text exactly as given. HTML needs nothing here:
 * the renderer escapes every character first. Kept beside its one user rather than imported, so
 * the runner's test harness copies need no new file; the test checks it against the renderer.
 * systems/social-feed.js holds a copy: widen both together.
 */
const NOTE_ESCAPABLE = /[\\|*`#_-]/g;
export function escapeNoteText(text) {
    return String(text).replace(NOTE_ESCAPABLE, ch => `\\${ch}`);
}

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
        this.proppedFrom = new Map(); // propped room -> the rooms its propped doors lead back to (R3 n3)
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
        const started = () => {
            const pool = START_POOLS[run.do];
            if (pool) this._needs()?.mutter?.(npcId, pool);
            this._emit(`npc_workaround:${npcId}`, { npcId, index: run.index, do: run.do, phase: 'started' });
        };

        if (run.do === 'emit') {
            started();
            // q21: no visit shows it, so the needs system shows the workaround icon for a moment
            this._needs()?.showWorkaround?.(npcId);
            if (typeof run.event === 'string' && run.event) this._emit(run.event, { npcId, level: job.level });
            this._send(key, false);
            return true;
        }
        if (run.do === 'borrow_session') {
            const set = typeof run.pc === 'string' && run.pc && this._needs()?.setBorrow?.(npcId, run);
            if (!set) this._send(key, true);
            else started();
            return true;
        }
        if (VISIT_KINDS.has(run.do)) {
            const share = run.do === 'share_login';
            const at = run.do === 'writes_down' ? { objectId: this._home(npcId) }
                : share ? { npcId: run.with } : { objectId: run.prop };
            const target = share ? at.npcId : at.objectId;
            // Review R3 n1: the dwell left sets the visit's length, so 0 gives a near-zero visit
            // (not the default VISIT_DWELL_S); only a run with no dwell takes the default
            const dwell = typeof run.dwell === 'number' && Number.isFinite(run.dwell) ? Math.max(0, run.dwell) : undefined;
            if (share) { job.heard = false; job.dwellMs = Math.max(SHARE_DWELL_S, dwell || 0) * 1000; }
            const queued = typeof target === 'string' && target && this._needs()?.enqueueVisit?.(npcId, {
                // A share always stands its whole dwell beside the colleague, so a reload's resent run
                // (whose dwell left may be 0) still gives the player a chance to hear it (6.5)
                kind: 'workaround', at, useSeconds: share ? Math.max(SHARE_DWELL_S, dwell || 0) : dwell,
                data: { workaround: { index: run.index, hand: run.hand, do: run.do } }
            });
            // The line and `started` only for a visit that will happen (review 9.2 B R1 m5)
            if (!queued) this._send(key, true);
            else if (job.state === 'running') started();
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
        if (!key) return;
        const job = this.active.get(key);
        if (job.run.do === 'share_login') {
            if (job.listening === true) this._listen(job);
            job.listening = false;
            job.awaitingLine = false;
        }
        this._send(key, false);
    }

    /**
     * `npc_visit_arrived:<npcId>`: a share's NPC is beside the colleague and asks for its line.
     * User decision q42: the listening window opens when the line is said (lineSaid), not on
     * arrival, since in a room with chatter the line can wait for the speech lock. Until then the
     * visit is held beside the colleague (NPCNeedsSystem.holdVisit) for up to LINE_WAIT_MS.
     */
    visitArrived(data) {
        const key = this._jobFor(data);
        const job = key ? this.active.get(key) : null;
        if (!job || job.run.do !== 'share_login' || job.listening !== undefined) return;
        job.listening = false;
        job.awaitingLine = true;
        if (!job.dwellMs) job.dwellMs = SHARE_DWELL_S * 1000;
        this._needs()?.holdVisit?.(job.npcId, LINE_WAIT_MS + job.dwellMs);
        // Review R2 n1: login_aloud goes ahead of ordinary lines, so a start line still waiting
        // now would be said after it, out of order and stale; drop it first
        this._needs()?.cancelMutter?.(job.npcId, START_POOLS.share_login);
        this._needs()?.mutter?.(job.npcId, ALOUD_POOL);
    }

    /**
     * `npc_mutter:<npcId>` (q42): a share's line was said, so the window opens now and the visit
     * stands the share's dwell from here. A picture with no line (the line waited too long, or
     * the scenario has none) says nothing to hear: the visit ends, not heard.
     */
    lineSaid(data) {
        if (data?.topic !== ALOUD_POOL || typeof data.npcId !== 'string') return;
        let key = null;
        for (const [k, j] of this.active) {
            if (j.npcId === data.npcId && j.awaitingLine && j.state === 'running' && j.run.do === 'share_login') { key = k; break; }
        }
        const job = key ? this.active.get(key) : null;
        if (!job) return;
        job.awaitingLine = false;
        if (typeof data.line !== 'string' || !data.line) {
            this._needs()?.holdVisit?.(job.npcId, 0);
            return;
        }
        job.listening = true;
        this._needs()?.holdVisit?.(job.npcId, job.dwellMs);
        const tick = () => {
            if (!job.listening || this.active.get(key) !== job || job.state !== 'running') return;
            this._listen(job);
            this._timer(tick, HEAR_TICK_MS);
        };
        tick();
    }

    /**
     * One hearing test: the first that hears in a room notes that room (6.5). A tick in a doorway
     * (currentPlayerRoom is '' there) does not count, so a later in-room tick can (review R1 M2):
     * the server takes a heard share with no room as not heard.
     */
    _listen(job) {
        if (job.heard) return;
        const room = this.deps.playerRoom?.();
        if (typeof room !== 'string' || !room) return;
        if (!this._needs()?.playerHears?.(job.npcId)) return;
        job.heard = true;
        job.roomId = room;
    }

    /** `npc_borrow_done:<npcId>`: the borrower left the borrowed PC. */
    borrowDone(data) {
        const key = this._borrowKey(data);
        if (!key) return;
        // q43 review R1 M1: a use cut short after the sit says so, and the server skips the
        // borrow's floor, so "done" lands at once instead of after a password sign-in in the gap
        if (typeof data.cut === 'string' && data.cut) this.active.get(key).cut = true;
        this._send(key, false);
    }

    /** `npc_borrow_dropped:<npcId>`: the borrow never started in time. */
    borrowDropped(data) {
        const key = this._borrowKey(data);
        if (key) this._send(key, true);
    }

    _borrowKey(data) {
        if (typeof data?.npcId !== 'string' || !Number.isInteger(data.index) || !Number.isInteger(data.hand)) return null;
        const key = keyOf(data.npcId, data);
        const job = this.active.get(key);
        return job && job.state === 'running' && job.run.do === 'borrow_session' ? key : null;
    }

    /** `npc_visit_dropped:<npcId>`: the visit was never made, or was cut short. */
    visitDropped(data) {
        const key = this._jobFor(data);
        if (!key) return;
        // Review R1 n3: a share's line still waiting goes with its visit, so it is not said with no job behind it
        const job = this.active.get(key);
        if (job.run.do === 'share_login' && job.awaitingLine) {
            job.awaitingLine = false;
            this._needs()?.cancelMutter?.(job.npcId, ALOUD_POOL);
        }
        this._send(key, true);
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
            const body = { npc_id: job.npcId, index: job.run.index, hand: job.run.hand, dropped: !!dropped };
            // 6.5: a share says whether the player heard, and the room of the first tick that did
            if (job.run.do === 'share_login' && !dropped) {
                body.heard = !!job.heard;
                if (job.heard && job.roomId) body.room_id = job.roomId;
            }
            if (job.run.do === 'borrow_session' && !dropped && job.cut) body.cut = true;
            answer = await this.deps.send(body);
        } catch (err) {
            const status = err?.status;
            if (status === 403) { this._end(key, 'refused'); return; }
            // 425: the server's dwell has not passed yet (retryAfter is the time left); anything
            // else was lost on the way: resent with a growing wait, never given up (review R1 M1)
            // Review R2 n2: a 425 is an answer, not a loss, so the backoff starts again after one
            if (status === 425) job.attempts = 0;
            // Review R2 n1: a job still resending after STUCK_ATTEMPTS losses is said once in the
            // console, so a stuck hand-over shows in a playtest log (a 400, 404 or 422 never clears).
            // Review R3 n2: once per job, even when a 425 starts the count again
            if (!job.warned && job.attempts >= STUCK_ATTEMPTS) {
                job.warned = true;
                try { console.warn(`npc-workarounds: hand-over ${key} still unanswered after ${job.attempts} attempts (last status ${status ?? 'none'})`); } catch (e) { /* no console */ }
            }
            const wait = status === 425
                ? Math.min(RETRY_MAX_MS, Math.max(RETRY_MS, (Number(err?.body?.retryAfter) || Number(job.run.dwell) || 0) * 1000))
                : retryDelay(job.attempts);
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
        // { dropped: true }: the hand was spent as dropped, so a "done" counts for nothing
        if (job.dropped || body.dropped === true) {
            this._emit(`npc_workaround:${npcId}`, { npcId, index: run.index, do: run.do, phase: 'dropped' });
            return;
        }
        if (typeof body.pcId === 'string' && body.hasPostit === true) this.deps.markPostit?.(body.pcId, true);
        if (typeof body.roomId === 'string') {
            this.propped.add(body.roomId);
            this.deps.openDoor?.(body.roomId, body.roomData || null);
        }
        if (typeof body.setGlobal === 'string' && body.setGlobal) this.deps.setGlobal?.(body.setGlobal, true);
        // 6.4: the borrower left the session open; the workstation layer records the guest now
        if (run.do === 'borrow_session' && body.guest === true && typeof body.pcId === 'string') {
            this._emit(`npc_guest_left:${body.pcId}`, { npcId, objectId: body.pcId });
        }
        // 6.5: a heard share explains itself
        const heard = run.do === 'share_login' && body.capture && typeof body.capture === 'object';
        if (heard) {
            const who = typeof body.displayName === 'string' && body.displayName ? body.displayName : npcId;
            // Review R1 M1: the line holds a password the player must type exactly, so it goes in
            // as plain text with no dash display; the note is plain text too, escaped for the
            // notebook's markdown so `*`, backticks and `--` in it are kept as they are
            if (typeof body.line === 'string') this.deps.toast?.(body.line, `Overheard: ${who}`, { verbatim: true });
            if (typeof body.note === 'string' && body.note) this.deps.addNote?.(`Overheard: ${who}`, escapeNoteText(body.note));
            this.deps.recordCapture?.(body.capture);
        }
        this._emit(`npc_workaround:${npcId}`, { npcId, index: run.index, do: run.do, phase: 'done' });
        if (heard) this._emit(`npc_overheard_login:${npcId}`, { npcId, with: run.with || null });
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
                if (d?.do === 'prop_door' && typeof d.door === 'string' && d.door) {
                    this.propped.add(d.door);
                    if (typeof d.from === 'string' && d.from) {
                        if (!this.proppedFrom.has(d.door)) this.proppedFrom.set(d.door, new Set());
                        this.proppedFrom.get(d.door).add(d.from);
                    }
                }
            }
        }
        if (this.propped.size) for (const roomId of this.deps.loadedRooms?.() || []) this.syncRoom(roomId);
    }

    /**
     * A room has been built: open its door sprites that lead to a propped room, with no lock and
     * no server call (the room is already in unlockedRooms). Review R3 n3: in a propped room, also
     * the far side of the same door (the sprite back to the prop's room, `from` in done), when
     * that sprite is not itself locked, so a player who resumes inside the propped room sees it
     * open. Returns how many it opened.
     */
    syncRoom(roomId) {
        if (!this.propped.size || typeof roomId !== 'string') return 0;
        const back = this.proppedFrom.get(roomId);
        let n = 0;
        for (const sp of this.deps.doorSprites?.(roomId) || []) {
            const props = sp?.doorProperties;
            if (!props || props.open || sp.proppedOpening || sp.active === false) continue;
            const farSide = !!back && back.has(props.connectedRoom) && !props.locked;
            if (!this.propped.has(props.connectedRoom) && !farSide) continue;
            sp.proppedOpening = true;   // openDoor may finish later, once the far room has loaded
            props.locked = false;
            // A sprite that failed to open is left free to be tried at the next build (R1 n2)
            if (this.deps.openSprite?.(sp) === false) { sp.proppedOpening = false; continue; }
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
            if (typeof w.unlockDoor !== 'function') return false;
            try { w.unlockDoor(sp, null); } catch (e) { console.warn('propped door failed to open', e); return false; }
            return true;
        },
        npcRecord: id => w.npcManager?.npcs?.get?.(id) || null,
        playerRoom: () => w.currentPlayerRoom || null,
        toast: (line, title, opts) => (typeof w.gameAlert === 'function' ? w.gameAlert(line, 'info', title, 8000, opts || {}) : null),
        addNote: (title, text) => (typeof w.addNote === 'function' ? w.addNote(title, text, true) : null),
        recordCapture: capture => (typeof w.mirrorSECapture === 'function' ? w.mirrorSECapture(capture) : null)
    });
    w.npcWorkarounds = runner;
    const on = (name, fn) => w.eventDispatcher?.on?.(name, fn);
    on('npc_workaround_due:*', data => runner.due(data));
    on('npc_visit_done:*', data => runner.visitDone(data));
    on('npc_visit_dropped:*', data => runner.visitDropped(data));
    on('npc_visit_arrived:*', data => runner.visitArrived(data));
    on('npc_mutter:*', data => runner.lineSaid(data));
    on('npc_borrow_done:*', data => runner.borrowDone(data));
    on('npc_borrow_dropped:*', data => runner.borrowDropped(data));
    return runner;
}

export default NpcWorkarounds;
