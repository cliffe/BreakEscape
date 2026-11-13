/**
 * The use verdict (ACCESS_MODEL_SLICE_9_2_PLAN.md 5.2, sub-slice A). Pure, with no imports, so
 * node tests load it directly; it also sets window.npcWork, which the needs adapter reads
 * (npc-needs.js imports nothing).
 *
 * A judged use (work by an NPC with a work plan; social_media) is checked when it ends. Every
 * failure is collected: the station (sub-slice L: locked_out) and, for work, each resource in the
 * plan: not admitted (no_access), its offWhen global truthy (down), or not reachable from the
 * station (unreachable). No failure: the use is met.
 *
 * `plan` is the server plan on the NPC record (`work`: { breakDrain, needs: [{ id, kind,
 * admitted, offWhen, object, routes }] }). `station` is { id, lockedOut, socialBlocked } or null.
 * `globals` is an object of global values or a function name -> value.
 */

function truthy(v) {
    return !(v === undefined || v === null || v === false || v === 0 || v === "");
}

function lookup(globals) {
    if (typeof globals === "function") return name => globals(name);
    const g = globals && typeof globals === "object" ? globals : {};
    return name => g[name];
}

/**
 * Format 1 (hardening step 8a): a resource's outage condition is `offWhen` in the requireGlobal
 * form (was `offWhen`, a bare name). `offWhenHolds` is the needs system's requiredGlobalsHold,
 * copied here because this module stays import-free (node tests load it directly). A bare name is
 * truthy; { name: value } matches every pair. `offWhenNames` is the globals it reads, for the wake
 * set and the outage kick.
 */
function offWhenHolds(cond, get) {
    if (cond === undefined || cond === null) return false;
    if (typeof cond === "string") return cond !== "" && truthy(get(cond));
    if (typeof cond === "object") return Object.entries(cond).every(([name, value]) => get(name) === value);
    return false;
}

function offWhenNames(cond) {
    if (typeof cond === "string") return cond ? [cond] : [];
    if (cond && typeof cond === "object") return Object.keys(cond);
    return [];
}

/**
 * A need with no routes key is reachable; an empty list of routes never is; otherwise it is
 * reachable when some route has no network down. Format 1 (step 8a): a route entry is a network's
 * outage condition (offWhen, requireGlobal form), so a route is open while none of its conditions
 * holds (offWhenHolds), which takes the { name: value } form down too.
 */
export function reachable(need, globals) {
    if (!need || !Array.isArray(need.routes)) return true;
    const get = lookup(globals);
    return need.routes.some(route => Array.isArray(route) && route.every(cond => !offWhenHolds(cond, get)));
}

/** Every cause a use of `need` fails with, as [{ id, why }], in plan order. */
export function failures(plan, need, station, globals) {
    const out = [];
    const get = lookup(globals);
    if (station && station.lockedOut) out.push({ id: station.id, why: "locked_out" });
    if (need === "social_media" && station && station.socialBlocked) out.push({ id: station.id, why: "social_blocked" });
    if (need !== "work") return out;
    const needs = plan && Array.isArray(plan.needs) ? plan.needs : [];
    for (const r of needs) {
        if (!r || typeof r.id !== "string") continue;
        if (r.admitted === false) out.push({ id: r.id, why: "no_access" });
        else if (r.offWhen != null && offWhenHolds(r.offWhen, get)) out.push({ id: r.id, why: "down" });
        else if (!reachable(r, globals)) out.push({ id: r.id, why: "unreachable" });
    }
    return out;
}

/** { met, missing, station }: station is true when a station failure is among the causes. */
export function useVerdict(plan, need, station, globals) {
    const missing = failures(plan, need, station, globals);
    return { met: missing.length === 0, missing, station: missing.some(c => c.why === "locked_out" || c.why === "social_blocked") };
}

/**
 * The globals that made a use fail, for a park to wake on (5.2): each down resource's offWhen and
 * the truthy route globals of each unreachable one. A failure with a cause that has no global
 * (no_access, locked_out, social_blocked, an unreachable whose routes carry no global) has none:
 * it cannot clear while that cause holds.
 */
export function wakeOnFor(plan, missing, globals) {
    const get = lookup(globals);
    const byId = new Map((plan && Array.isArray(plan.needs) ? plan.needs : []).map(r => [r.id, r]));
    const out = new Set();
    for (const c of missing || []) {
        const r = byId.get(c.id);
        if (c.why === "down" && r && r.offWhen != null) { offWhenNames(r.offWhen).forEach(n => out.add(n)); continue; }
        if (c.why === "unreachable" && r && Array.isArray(r.routes)) {
            const names = r.routes.flat().filter(cond => offWhenHolds(cond, get)).flatMap(offWhenNames);
            if (!names.length) return [];
            names.forEach(n => out.add(n));
            continue;
        }
        return [];
    }
    return [...out].sort();
}

/** Whether every recorded cause would pass now (a woken failed park retries only then). */
export function causesClear(plan, missing, globals) {
    const get = lookup(globals);
    const byId = new Map((plan && Array.isArray(plan.needs) ? plan.needs : []).map(r => [r.id, r]));
    return (missing || []).every(c => {
        const r = byId.get(c.id);
        if (c.why === "down") return !!r && !offWhenHolds(r.offWhen, get);
        if (c.why === "unreachable") return !!r && reachable(r, globals);
        return false;
    });
}

/** Every global the plan names (offWhen and route globals), for the outage kick and the forced sync. */
export function planGlobals(plan) {
    const out = new Set();
    for (const r of plan && Array.isArray(plan.needs) ? plan.needs : []) {
        if (r && r.offWhen != null) offWhenNames(r.offWhen).forEach(n => out.add(n));
        if (r && Array.isArray(r.routes)) r.routes.flat().forEach(cond => offWhenNames(cond).forEach(n => out.add(n)));
    }
    return [...out].sort();
}

const npcWork = Object.freeze({ reachable, failures, useVerdict, wakeOnFor, causesClear, planGlobals });
if (typeof window !== "undefined") window.npcWork = npcWork;
export default npcWork;
