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
 *
 * Imports only npc-work.js (pure), which also sets window.npcWork for the needs adapter.
 */
import npcWork from './npc-work.js';

export const REPORT_INTERVAL_MS = 2000;
export const MAX_BATCH = 20;

export class NpcReports {
    /**
     * @param {Object} deps - { send(batch) -> Promise<{ answers }>, sync() -> Promise, apply(answers),
     *   now() -> ms, setTimer(fn, ms), watched(name) -> bool }
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
    }

    _now() { return typeof this.deps.now === 'function' ? this.deps.now() : Date.now(); }

    /** One report from the needs system: { event, need, objectId, missing, rearmed }. */
    queue(npcId, report) {
        if (typeof npcId !== 'string' || !report) return false;
        if (report.event === 'fail' && this.settled.has(npcId)) return false;
        if (report.event === 'ease') this.settled.delete(npcId);
        const r = { npc_id: npcId, event: report.event, need: report.need, object_id: report.objectId ?? null };
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
            try {
                const res = await this.deps.send(batch.map(({ _resent, ...r }) => r));
                answers = Array.isArray(res?.answers) ? res.answers : [];
            } catch (e) {
                answers = [];   // a lost request loses one step of frustration and nothing else
            }
            const resend = [];
            answers.forEach((a, i) => {
                if (!a) return;
                if (a.settled) this.settled.add(a.npcId);
                if (a.stale && batch[i] && !batch[i]._resent) resend.push({ ...batch[i], _resent: true });
            });
            if (resend.length) { this.needSync = true; this.pending.unshift(...resend); }
            const usable = answers.filter(a => a && !a.refused && !a.stale);
            if (usable.length) this.deps.apply?.(usable);
        } finally {
            this.sending = false;
            this._schedule();
        }
    }
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
        send: batch => (typeof api.npcFrustration === 'function' ? api.npcFrustration(batch) : api.post('/npc_frustration', { reports: batch })),
        sync: () => w.stateSync?.sync?.(),
        apply: answers => w.npcNeedsSystem?.applyFrustration?.(answers),
        watched: name => watchedGlobal(name, w)
    });
    w.npcReports = reports;
    w.eventDispatcher?.on?.('global_variable_changed:*', (data, name) => {
        const key = typeof name === 'string' && name.startsWith('global_variable_changed:') ? name.slice('global_variable_changed:'.length) : data?.name;
        reports.onGlobalChanged(key);
    });
    return reports;
}

export default NpcReports;
