/**
 * The frustration report queue (ACCESS_MODEL_SLICE_9_2_PLAN.md 5.4, sub-slice A). The needs
 * system reports each counted failure and each met judged use after a failure through
 * world.reportUse; this module sends them together, at most one POST /npc_frustration every two
 * seconds and at most 20 reports in one request, and hands the answers to
 * NPCNeedsSystem.applyFrustration.
 *
 * - No fail is sent for an NPC the server called settled until an ease has been sent for it,
 *   including one GET /scenario called settled when the game loaded (restore).
 * - When a global named in a loaded NPC's work plan (a downIf, a route global) or in its home
 *   station's offWhen changes, one state sync is awaited before the next batch, so the server's
 *   copy of the global is current when it checks the cause.
 * - A report answered `stale` triggers one state sync and is sent once more.
 * - Sub-slice L (6.6): a `check` report asks whether an owner is locked out at its own station.
 *   It is sent only on `workstation_owner_returned:<pcId>` with `wasLocked`, at a PC under a
 *   policy with maxAttempts where this browser has had a lockout answer from POST /login
 *   (`pc_signin_failed` with reason locked_out, at the keyboard or remote), for an owner with a
 *   work plan whose station that PC is and who is not already flagged there. User decision q36
 *   adds a borrow path: on `npc_sat_at:<pcId>` (a borrower sitting down at a hot desk) a check is
 *   sent under the same policy and lockout-answer tests, with no locked return and no needsHome
 *   test. So a mission with no lockout sends no check at all. Every check gets an answer for the needs system (refused
 *   or lost: lockedOut false, after one resend of a lost request), which ends the hold on the
 *   owner's first use there. A send that has not settled after SEND_TIMEOUT_MS is aborted and
 *   counts as lost (review R2 m2), so a hung request cannot hold the queue or the owner.
 *   The mark survives a reload: GET /scenario's `lockoutPcs` (the sign-in PCs where the player
 *   caused a lockout, ids only) seeds it at install (review R1 M1). A check the server answers
 *   `lockedOut: false` clears the mark, unless a new lockout answer came at that PC after the
 *   check was queued (R1 m1), so a lockout of some other username costs one check, not one per
 *   return.
 *
 * Imports only npc-work.js (pure), which also sets window.npcWork for the needs adapter.
 */
import npcWork from './npc-work.js';

export const REPORT_INTERVAL_MS = 2000;
export const MAX_BATCH = 20;
// Review R2 m2: a send that has not settled after this long is aborted and counts as lost, so a
// request that never settles (a half-open connection after sleep) cannot stop the queue
export const SEND_TIMEOUT_MS = 20000;

export class NpcReports {
    /**
     * @param {Object} deps - { send(batch) -> Promise<{ answers }>, sync() -> Promise, apply(answers),
     *   now() -> ms, setTimer(fn, ms), clearTimer(handle), watched(name) -> bool }. send gets a
     *   second argument, { signal }, an AbortSignal aborted when the send times out.
     */
    constructor(deps = {}) {
        this.deps = deps;
        this.pending = [];
        this.settled = new Set();
        this.needSync = false;
        this.lastSent = -Infinity;
        this.timer = null;
        this.sending = false;
        this.requests = 0;
        this.sent = 0;
        this.seq = 0;
        this.lastEase = new Map();   // npcId -> seq of the last queued ease (R1 m6)
        this.lockoutSeen = new Set(); // PCs where this browser had a lockout answer (9.2 L)
        this.lockoutCount = new Map(); // pcId -> lockout answers noted there (R1 m1)
        this.checks = 0;
    }

    /** Sub-slice L: POST /login answered locked_out at this PC (pc_signin_failed). */
    noteLockout(pcId) {
        if (typeof pcId !== 'string' || !pcId) return;
        this.lockoutSeen.add(pcId);
        this.lockoutCount.set(pcId, (this.lockoutCount.get(pcId) || 0) + 1);
    }

    /** Review R1 M1: GET /scenario's lockoutPcs, the PCs where the server holds a lockout. */
    seedLockouts(list) {
        if (!Array.isArray(list)) return;
        for (const pc of list) this.noteLockout(pc);
    }

    /**
     * Sub-slice L (6.6): workstation_owner_returned:<pcId> { objectId, ownerId, wasLocked }. Sends a
     * check when shouldCheckLockout says so and the needs system takes the hold (deps.markCheck).
     */
    onOwnerReturned(data) {
        const pcId = data?.objectId;
        const ownerId = data?.ownerId;
        const d = this.deps;
        if (!shouldCheckLockout({
            wasLocked: data?.wasLocked, seen: this.lockoutSeen.has(pcId), pcId,
            policy: typeof d.policyFor === 'function' ? d.policyFor(pcId) : null,
            owner: typeof d.ownerRecord === 'function' ? d.ownerRecord(ownerId) : null,
            flagged: typeof d.flagged === 'function' ? !!d.flagged(ownerId, pcId) : false
        })) return false;
        if (typeof d.markCheck === 'function' && d.markCheck(ownerId, pcId) === false) return false;
        this.checks++;
        return this.queue(ownerId, { event: 'check', objectId: pcId, mark: this.lockoutCount.get(pcId) || 0 });
    }

    /**
     * User decision q36: npc_sat_at:<pcId> { npcId, objectId }, a borrower sitting down at a hot
     * desk. Sends a check there when shouldCheckLockout's borrow path says so and the needs system
     * takes the hold, so the borrowed use waits for the answer.
     */
    onBorrowSat(data) {
        const pcId = data?.objectId;
        const npcId = data?.npcId;
        const d = this.deps;
        if (typeof npcId !== 'string' || !npcId) return false;
        if (!shouldCheckLockout({
            borrowed: true, seen: this.lockoutSeen.has(pcId), pcId,
            policy: typeof d.policyFor === 'function' ? d.policyFor(pcId) : null,
            flagged: typeof d.flagged === 'function' ? !!d.flagged(npcId, pcId) : false
        })) return false;
        if (typeof d.markCheck === 'function' && d.markCheck(npcId, pcId) === false) return false;
        this.checks++;
        return this.queue(npcId, { event: 'check', objectId: pcId, mark: this.lockoutCount.get(pcId) || 0 });
    }

    _now() { return typeof this.deps.now === 'function' ? this.deps.now() : Date.now(); }

    /** One report from the needs system: { event, need, objectId, missing, rearmed }. */
    queue(npcId, report) {
        if (typeof npcId !== 'string' || !report) return false;
        if (report.event === 'fail' && this.settled.has(npcId)) return false;
        const seq = ++this.seq;
        if (report.event === 'ease') { this.settled.delete(npcId); this.lastEase.set(npcId, seq); }
        if (report.event === 'check') {
            if (typeof report.objectId !== 'string' || !report.objectId) return false;
            this.pending.push({ npc_id: npcId, event: 'check', object_id: report.objectId, _seq: seq, _mark: report.mark ?? null });
            this._schedule();
            return true;
        }
        const r = { npc_id: npcId, event: report.event, need: report.need, object_id: report.objectId ?? null, _seq: seq };
        if (report.event === 'fail') r.missing = (report.missing || []).map(c => ({ id: c.id, why: c.why }));
        if (report.rearmed) r.rearmed = true;
        this.pending.push(r);
        this._schedule();
        return true;
    }

    /**
     * The npcFrustration block of GET /scenario: an NPC the server already calls settled sends
     * no fail after a reload until an ease has been sent, as if its last answer had said so.
     */
    restore(block) {
        if (!block || typeof block !== 'object') return;
        for (const [npcId, entry] of Object.entries(block)) {
            if (entry && entry.settled) this.settled.add(npcId);
        }
    }

    /** A global changed: if a work plan or a station names it, sync before the next batch. */
    onGlobalChanged(name) {
        if (typeof this.deps.watched === 'function' && this.deps.watched(name)) this.needSync = true;
    }

    _schedule() {
        if (this.timer !== null || this.sending || !this.pending.length) return;
        const wait = Math.max(0, this.lastSent + REPORT_INTERVAL_MS - this._now());
        const set = this.deps.setTimer || ((fn, ms) => setTimeout(fn, ms));
        this.timer = set(() => { this.timer = null; this.flush(); }, wait);
    }

    /**
     * Review R2 m2: deps.send, raced against SEND_TIMEOUT_MS. On a timeout the request is aborted
     * and this rejects, so flush treats it as a lost request (a lost check is sent once more,
     * then answered no; a lost fail or ease loses one step).
     */
    _sendBounded(body) {
        const ac = typeof AbortController === 'function' ? new AbortController() : null;
        const set = this.deps.setTimer || ((fn, ms) => setTimeout(fn, ms));
        const clear = this.deps.clearTimer || (this.deps.setTimer ? null : (h => clearTimeout(h)));
        let settled = false;
        let handle = null;
        const timeout = new Promise((_, reject) => {
            handle = set(() => {
                if (settled) return;
                settled = true;
                ac?.abort();
                const e = new Error('npc_frustration request timed out');
                e.timedOut = true;
                reject(e);
            }, SEND_TIMEOUT_MS);
        });
        const sent = Promise.resolve().then(() => this.deps.send(body, ac ? { signal: ac.signal } : undefined));
        return Promise.race([sent, timeout]).finally(() => {
            settled = true;
            if (clear && handle !== null) clear(handle);
        });
    }

    async flush() {
        if (this.sending || !this.pending.length) return;
        if (this._now() - this.lastSent < REPORT_INTERVAL_MS) { this._schedule(); return; }
        this.sending = true;
        try {
            if (this.needSync) {
                this.needSync = false;
                try { await this.deps.sync?.(); } catch (e) { /* the sync timer catches up */ }
            }
            const batch = this.pending.splice(0, MAX_BATCH);
            this.lastSent = this._now();
            this.requests++;
            this.sent += batch.length;
            let answers = [];
            let lost = false;
            try {
                const res = await this._sendBounded(batch.map(({ _resent, _seq, _mark, ...r }) => r));
                answers = Array.isArray(res?.answers) ? res.answers : [];
            } catch (e) {
                answers = [];   // a lost request loses one step of frustration and nothing else
                lost = true;
            }
            // Sub-slice L: a check in a lost request is sent once more before it counts as no
            const lostChecks = lost ? batch.filter(r => r.event === 'check' && !r._resent) : [];
            if (lostChecks.length) this.pending.unshift(...lostChecks.map(r => ({ ...r, _resent: true })));
            const resend = [];
            answers.forEach((a, i) => {
                if (!a) return;
                // A settled answer to a report queued before the NPC's last ease is out of date (R1 m6)
                if (a.settled && !((batch[i]?._seq ?? Infinity) < (this.lastEase.get(a.npcId) ?? -Infinity))) this.settled.add(a.npcId);
                if (a.stale && batch[i] && !batch[i]._resent) resend.push({ ...batch[i], _resent: true });
            });
            if (resend.length) { this.needSync = true; this.pending.unshift(...resend); }
            // Each answer says which report it answers (review R2 n1: a fail's answer clears only
            // that need's failSent mark); the needs system ignores the two fields otherwise
            answers.forEach((a, i) => {
                if (a && typeof a === 'object' && batch[i]) { a.forEvent = batch[i].event; a.forNeed = batch[i].need; }
            });
            // Sub-slice L: every check gets one answer for the needs system, true only when the
            // server said so (a refused, missing or malformed answer is no lockout)
            const checkAnswers = [];
            batch.forEach((r, i) => {
                if (r.event !== 'check' || lostChecks.includes(r)) return;
                // Review R1 m1: the server said no, and no lockout answer came at that PC since
                // the check was queued, so the mark goes (a refused or lost answer keeps it).
                // Review R2 n1, left as is: the "no" clears the mark per PC, not per owner; it
                // matters only for two owners sharing one unowned sign-in needsHome, which no
                // scenario does, and costs at most one missed check until the next lockout answer
                const a = answers[i];
                if (a && a.npcId === r.npc_id && a.lockedOut === false && !a.refused
                    && r._mark !== null && (this.lockoutCount.get(r.object_id) || 0) === r._mark) this.lockoutSeen.delete(r.object_id);
                checkAnswers.push({ npcId: r.npc_id, forEvent: 'check', forObject: r.object_id, lockedOut: answers[i]?.lockedOut === true && answers[i]?.npcId === r.npc_id });
            });
            const usable = answers.filter((a, i) => a && !a.refused && !a.stale && batch[i]?.event !== 'check').concat(checkAnswers);
            if (usable.length) this.deps.apply?.(usable);
        } finally {
            this.sending = false;
            this._schedule();
        }
    }
}

/**
 * Sub-slice L (6.6): whether an owner's locked return calls for a check. All must hold: the screen
 * was locked; this browser saw a lockout answer at that PC; the PC's policy sets a positive
 * maxAttempts; the owner has a work plan or (user decision q33) a social_media need, and that PC
 * is its station (needsHome); and it is not
 * already flagged there (a restored or earlier true answer stands for the mission).
 * User decision q36, `borrowed`: a borrower sitting down at a hot desk. No locked return and no
 * owner test (the PC is borrowed for the failing need; the server checks the hand-over).
 */
export function shouldCheckLockout({ wasLocked, seen, pcId, policy, owner, flagged, borrowed = false }) {
    if ((!wasLocked && !borrowed) || !seen || flagged || typeof pcId !== 'string' || !pcId) return false;
    const max = policy && typeof policy === 'object' ? policy.maxAttempts : null;
    if (!(typeof max === 'number' && Number.isFinite(max) && max > 0)) return false;
    if (borrowed) return true;
    if (!owner || owner.needsHome !== pcId) return false;
    // User decision q33: a lockout stops social media at the PC too, so an owner with that need is asked about
    const social = !!owner.needs && typeof owner.needs === 'object' && !!owner.needs.social_media && typeof owner.needs.social_media === 'object';
    return social || (!!owner.work && Array.isArray(owner.work.needs) && owner.work.needs.length > 0);
}

/** The globals a loaded NPC's work plan or home station's offWhen names. */
export function watchedGlobal(name, w = (typeof window !== 'undefined' ? window : {})) {
    const npcs = w.npcManager?.npcs;
    if (!npcs || typeof name !== 'string') return false;
    for (const rec of npcs.values ? npcs.values() : []) {
        if (rec?.work && npcWork.planGlobals(rec.work).includes(name)) return true;
        const home = typeof rec?.needsHome === 'string' ? rec.needsHome : null;
        if (!home || !rec?.work) continue;
        const sp = w.npcNeedsSystem?.world?.getObject?.(home);
        const cond = sp?.affordance?.offWhen;
        if (typeof cond === 'string' ? cond === name : (cond && typeof cond === 'object' && Object.prototype.hasOwnProperty.call(cond, name))) return true;
    }
    return false;
}

/** Install the live queue as window.npcReports. */
export function installNpcReports(api) {
    const w = typeof window !== 'undefined' ? window : null;
    if (!w) return null;
    if (w.npcReports) return w.npcReports;
    const reports = new NpcReports({
        send: (batch, opts) => (typeof api.npcFrustration === 'function' ? api.npcFrustration(batch, opts) : api.post('/npc_frustration', { reports: batch }, opts)),
        sync: () => w.stateSync?.sync?.(),
        apply: answers => w.npcNeedsSystem?.applyFrustration?.(answers),
        watched: name => watchedGlobal(name, w),
        // Sub-slice L (6.6). Review R1 n2: the third copy of "the object's own policy, else
        // defaultPolicy" (pc-policy.js effectivePolicy, workstation-state.js policyFor); it reads
        // the loaded room's sprite first, which pc-policy.js does not. Change all three together.
        policyFor: pcId => {
            const sc = w.gameScenario || {};
            // the loaded room's object (as the workstation layer reads it), else the scenario's
            let obj = null;
            for (const room of Object.values(w.rooms || {})) {
                obj = Object.values(room?.objects || {}).find(sp => sp?.scenarioData?.id === pcId)?.scenarioData || null;
                if (obj) break;
            }
            for (const room of obj ? [] : Object.values(sc.rooms || {})) {
                obj = (room?.objects || []).find(o => o && o.id === pcId) || null;
                if (obj) break;
            }
            const name = obj?.policy || sc.defaultPolicy;
            const p = name && sc.policies && typeof sc.policies === 'object' ? sc.policies[name] : null;
            return p && typeof p === 'object' ? p : null;
        },
        ownerRecord: id => w.npcManager?.getNPC?.(id) || w.npcManager?.npcs?.get?.(id) || null,
        flagged: (id, pcId) => !!w.npcNeedsSystem?.isLockedOut?.(id, pcId),
        markCheck: (id, pcId) => !!w.npcNeedsSystem?.lockCheckSent?.(id, pcId)
    });
    w.npcReports = reports;
    // Review R1 M1: the lockouts the player caused before a reload
    reports.seedLockouts(w.gameScenario?.lockoutPcs);
    w.eventDispatcher?.on?.('pc_signin_failed', data => { if (data?.reason === 'locked_out') reports.noteLockout(data.pcId); });
    w.eventDispatcher?.on?.('workstation_owner_returned:*', data => reports.onOwnerReturned(data));
    w.eventDispatcher?.on?.('npc_sat_at:*', data => reports.onBorrowSat(data));
    w.eventDispatcher?.on?.('global_variable_changed:*', (data, name) => {
        const key = typeof name === 'string' && name.startsWith('global_variable_changed:') ? name.slice('global_variable_changed:'.length) : data?.name;
        reports.onGlobalChanged(key);
    });
    return reports;
}

export default NpcReports;
