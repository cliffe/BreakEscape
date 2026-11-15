// Stalled needs walks (docs/achitechture/OFFICE_LIFE_STUCK_RETURN.md): a walk home or an outbound
// leg that stands still is re-issued round other bodies, and gives up with one clear line
// (return_stuck, walk_stuck) instead of re-issuing for ever. Also the behaviour and pathfinding
// halves: a needs re-route plans round seated bodies, and a bump far from a needs destination is
// no longer an arrival.
// Run with: node test/js/npc-needs-stuck-walk.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NPCNeedsSystem, NEEDS_TICK_MS, RETURN_YIELD_MS, STUCK_TRIES, RETURN_STUCK_BACKOFF_MS, RETURN_STUCK_MAX_BACKOFFS, RETURN_FINAL_REPLAN_MS, RETURN_FINAL_REPLANS, REROUTE_MIN_LEFT_MS, STUCK_SAME_PX } from '../../public/break_escape/js/systems/npc-needs.js';
import { makeWorld } from './fixtures/needs-stub-world.mjs';

function office() {
    return {
        npcs: {
            clerk: {
                pos: { x: 100, y: 100 },
                rec: { id: 'clerk', needsHome: 'clerk_pc', needs: { caffeine: { decayPerMin: 8, urgentAt: 30, initial: 50, jitterPct: 0 } } }
            }
        },
        objects: [
            { id: 'clerk_pc', x: 100, y: 68, affordance: { accepts: ['found_item'], useSeconds: 10 } },
            { id: 'coffee_machine', x: 300, y: 300, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 40 } }
        ]
    };
}

function toGoto() {
    const w = makeWorld({ ...office(), arrive: false });
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    let guard = 0;
    while (sys.states.get('clerk').job?.phase !== 'goto_target' && guard++ < 4000) sys.step(NEEDS_TICK_MS);
    return { sys, w };
}

function toReturning() {
    const { sys, w } = toGoto();
    const job = sys.states.get('clerk').job;
    w.pos.clerk.x = job.dest.x; w.pos.clerk.y = job.dest.y;
    sys.onArrived('clerk', 'needs', { x: job.dest.x, y: job.dest.y, moveId: job.moveId });
    sys.step(41000);
    assert.equal(sys.getState('clerk').mode, 'returning');
    // wedged half way home
    w.pos.clerk.x = 200; w.pos.clerk.y = 200;
    sys.step(NEEDS_TICK_MS);
    return { sys, w };
}

const evs = (sys, ev) => sys.getLog().filter(e => e.npc === 'clerk' && e.ev === ev);
const homeMoves = (w, sys) => w.calls.moves.filter(m => m.id === 'clerk' && m.x === sys.states.get('clerk').home.x && m.y === sys.states.get('clerk').home.y);

test('a wedged walk home re-routes, then logs return_stuck once and backs off instead of looping', () => {
    const { sys, w } = toReturning();
    const before = homeMoves(w, sys).length;
    sys.step(RETURN_YIELD_MS + NEEDS_TICK_MS);
    assert.equal(evs(sys, 'return_resumed').length, 1);
    assert.equal(homeMoves(w, sys).at(-1).reroute, undefined, 'the first re-issue keeps the plain path (a player who held it has gone)');
    sys.step(RETURN_YIELD_MS + NEEDS_TICK_MS);
    assert.equal(homeMoves(w, sys).at(-1).reroute, true, 'a second stall in the same place plans round other bodies');
    for (let i = 0; i < STUCK_TRIES - 1; i++) sys.step(RETURN_YIELD_MS + NEEDS_TICK_MS);
    assert.equal(evs(sys, 'return_resumed').length, STUCK_TRIES, 'one return_resumed per try, then no more');
    const stuck = evs(sys, 'return_stuck');
    assert.equal(stuck.length, 1, 'gives up with one return_stuck');
    assert.deepEqual({ x: stuck[0].x, y: stuck[0].y, tries: stuck[0].tries }, { x: 200, y: 200, tries: STUCK_TRIES });
    assert.ok(w.calls.cancels.includes('clerk'), 'and stops pushing at the blocker');
    const issued = homeMoves(w, sys).length;
    sys.step(RETURN_STUCK_BACKOFF_MS - 2000);   // the give-up fell up to 1 s inside the last step
    assert.equal(homeMoves(w, sys).length, issued, 'stands quietly through the back-off');
    assert.equal(evs(sys, 'return_resumed').length, STUCK_TRIES);
    sys.step(2000 + 4 * NEEDS_TICK_MS);
    assert.equal(homeMoves(w, sys).length, issued + 1, 'then tries again, round other bodies');
    assert.equal(homeMoves(w, sys).at(-1).reroute, true);
    assert.ok(homeMoves(w, sys).length > before);
    // a further full cycle in the same place logs no second return_stuck this return
    for (let i = 0; i < STUCK_TRIES + 2; i++) sys.step(RETURN_YIELD_MS + NEEDS_TICK_MS);
    assert.ok(homeMoves(w, sys).slice(issued).every(m => m.reroute === true), 'after a give-up every retry re-routes');
    assert.equal(evs(sys, 'return_stuck').length, 1, 'return_stuck once per return');
    assert.equal(sys.getState('clerk').mode, 'returning', 'a returner never fails');
    // getting home still counts
    const home = sys.states.get('clerk').home;
    const id = sys.states.get('clerk').returnMoveId;
    w.pos.clerk.x = home.x; w.pos.clerk.y = home.y;
    sys.onArrived('clerk', 'needs', { x: home.x, y: home.y, moveId: id });
    sys.step(RETURN_STUCK_BACKOFF_MS + NEEDS_TICK_MS);
    assert.equal(sys.getState('clerk').atPost, true);
});

test('the back-off is bounded: after RETURN_STUCK_MAX_BACKOFFS in one place the walk ends, one fresh re-plan, then idle (game 5431)', () => {
    const { sys, w } = toReturning();
    const t0 = sys.clockMs;
    let guard = 0;
    while (!evs(sys, 'return_abandoned').length && guard++ < 4000) sys.step(NEEDS_TICK_MS);
    const first = evs(sys, 'return_abandoned');
    assert.equal(first.length, 1, 'the walk home ends');
    assert.deepEqual({ x: first[0].x, y: first[0].y, final: first[0].final }, { x: 200, y: 200, final: undefined });
    assert.ok(sys.clockMs - t0 < 120000, 'within two minutes, not eight');
    const stuckBefore = evs(sys, 'return_stuck').length;
    assert.equal(stuckBefore, 1);
    // The next tick re-plans from scratch: a fresh walk home, round other bodies
    const issued = homeMoves(w, sys).length;
    sys.step(2 * NEEDS_TICK_MS);
    assert.equal(sys.getState('clerk').mode, 'returning', 'a fresh walk home');
    assert.equal(homeMoves(w, sys).length, issued + 1);
    assert.equal(homeMoves(w, sys).at(-1).reroute, true);
    // Still wedged in the same place: the second abandon is final and it idles there
    guard = 0;
    while (evs(sys, 'return_abandoned').length < 2 && guard++ < 4000) sys.step(NEEDS_TICK_MS);
    assert.equal(evs(sys, 'return_abandoned').at(-1).final, true);
    assert.equal(evs(sys, 'return_stuck').length, 2, 'one return_stuck for the fresh return');
    const after = homeMoves(w, sys).length;
    sys.step(RETURN_FINAL_REPLAN_MS - 5000);
    assert.equal(sys.getState('clerk').mode, 'idle', 'idles where it stands');
    assert.equal(homeMoves(w, sys).length, after, 'no quick walks home: the cycle has ended');
    assert.equal(evs(sys, 'return_abandoned').length, 2);
    // Code review R1 m2: one late re-plan after RETURN_FINAL_REPLAN_MS, so it does not stand there for minutes
    sys.step(5000 + 2 * NEEDS_TICK_MS);
    assert.equal(homeMoves(w, sys).length, after + 1, 'one late walk home');
    assert.equal(sys.getState('clerk').mode, 'returning');
    assert.ok(RETURN_STUCK_MAX_BACKOFFS >= 1);
});

test('stalls in different places are not counted together', () => {
    const { sys, w } = toReturning();
    for (let i = 0; i < STUCK_TRIES + 3; i++) {
        w.pos.clerk.x -= 30;                          // moved on past each blocker
        sys.step(RETURN_YIELD_MS + 2 * NEEDS_TICK_MS);
    }
    assert.equal(evs(sys, 'return_stuck').length, 0);
});

test('a far arrival on the way home is re-issued round other bodies', () => {
    const { sys, w } = toReturning();
    const id = sys.states.get('clerk').returnMoveId;
    sys.onArrived('clerk', 'needs', { x: 200, y: 200, moveId: id });
    sys.step(NEEDS_TICK_MS);
    assert.equal(homeMoves(w, sys).at(-1).reroute, true);
});

test('a wedged outbound leg re-routes keeping its deadline, then logs walk_stuck once and the deadline fails it', () => {
    const { sys, w } = toGoto();
    const job = sys.states.get('clerk').job;
    let deadline = job.deadline;
    sys.step(RETURN_YIELD_MS + NEEDS_TICK_MS);
    const rr = evs(sys, 'walk_rerouted');
    assert.equal(rr.length, 1);
    assert.equal(rr[0].phase, 'goto_target');
    assert.equal(w.calls.moves.at(-1).reroute, true);
    assert.equal(sys.states.get('clerk').job.deadline, deadline, 'a re-route with time left does not extend the deadline');
    // Code review R2 m6: a re-route close to the deadline gets REROUTE_MIN_LEFT_MS to walk the new path, once
    job.deadline = sys.clockMs + RETURN_YIELD_MS + 2 * NEEDS_TICK_MS;
    sys.step(RETURN_YIELD_MS + NEEDS_TICK_MS);
    assert.equal(evs(sys, 'walk_rerouted').length, 2);
    assert.ok(job.deadline - sys.clockMs >= REROUTE_MIN_LEFT_MS - 2 * NEEDS_TICK_MS, 'moved out to the floor');
    deadline = job.deadline;
    assert.equal(job.rerouteGrace, true, 'once per job: the next re-route keeps this deadline');
    for (let i = 0; i < STUCK_TRIES; i++) sys.step(RETURN_YIELD_MS + NEEDS_TICK_MS);
    assert.equal(evs(sys, 'walk_rerouted').length, STUCK_TRIES, 'no re-route after giving up');
    assert.equal(evs(sys, 'walk_stuck').length, 1, 'one walk_stuck line');
    sys.step(Math.max(0, deadline - sys.clockMs) + NEEDS_TICK_MS);
    assert.ok(sys.getLog().some(e => e.npc === 'clerk' && e.ev === 'job_failed' && e.reason === 'timeout'), 'the job still ends on its deadline');
    assert.notEqual(sys.getState('clerk').mode, 'job');
});

test('a walk making progress is never re-routed', () => {
    const { sys, w } = toGoto();
    for (let i = 0; i < 60; i++) { w.pos.clerk.x += 3; w.pos.clerk.y += 3; sys.step(NEEDS_TICK_MS); }
    assert.equal(evs(sys, 'walk_rerouted').length, 0);
});

// ── Code review R1 (OFFICE_LIFE_STUCK_RETURN_REVIEW_R1.md) ───────────────────────

function toBackoff() {
    const r = toReturning();
    let guard = 0;
    while (!r.sys.states.get('clerk').returnStuckUntil && guard++ < 4000) r.sys.step(NEEDS_TICK_MS);
    assert.ok(r.sys.states.get('clerk').returnStuckUntil > 0, 'backing off');
    return r;
}

test('m1: back-offs count per place: one in each of two places never abandons the walk', () => {
    const { sys, w } = toBackoff();
    const s = sys.states.get('clerk');
    assert.equal(s.returnBackoffs, 1);
    sys.step(RETURN_STUCK_BACKOFF_MS + NEEDS_TICK_MS);   // the back-off ends: a fresh try
    w.pos.clerk.x -= 60;                                 // held again, somewhere else
    let guard = 0;
    sys.step(NEEDS_TICK_MS);
    while (!s.returnStuckUntil && guard++ < 4000) sys.step(NEEDS_TICK_MS);
    assert.equal(s.returnBackoffs, 1, 'the new place starts its own count');
    assert.equal(evs(sys, 'return_abandoned').length, 0);
});

test('m3: the last re-route in one place carries nudge; earlier ones do not', () => {
    const { sys, w } = toReturning();
    for (let i = 0; i < STUCK_TRIES; i++) sys.step(RETURN_YIELD_MS + NEEDS_TICK_MS);
    const moves = homeMoves(w, sys).slice(-STUCK_TRIES);
    assert.deepEqual(moves.map(m => !!m.nudge), [...Array(STUCK_TRIES - 1).fill(false), true]);
});

test('m3: an outbound leg nudges on its last re-route too', () => {
    const { sys, w } = toGoto();
    for (let i = 0; i < STUCK_TRIES; i++) sys.step(RETURN_YIELD_MS + NEEDS_TICK_MS);
    const rr = w.calls.moves.filter(m => m.id === 'clerk' && m.reroute);
    assert.equal(rr.length, STUCK_TRIES);
    assert.equal(rr.at(-1).nudge, true);
    assert.ok(rr.slice(0, -1).every(m => !m.nudge));
});

test('m7: a conversation during a back-off ends it: the walk home starts fresh on unfreeze', () => {
    const { sys, w } = toBackoff();
    const s = sys.states.get('clerk');
    w.setChat('clerk');
    sys.step(2 * NEEDS_TICK_MS);
    assert.equal(sys.getState('clerk').mode, 'frozen');
    const before = homeMoves(w, sys).length;
    w.setChat(null);
    sys.step(NEEDS_TICK_MS);
    assert.equal(sys.getState('clerk').mode, 'returning');
    assert.equal(homeMoves(w, sys).length, before + 1, 'walks home at once, not after the back-off');
    assert.equal(homeMoves(w, sys).at(-1).reroute, undefined, 'a fresh plain walk');
    assert.equal(s.returnStuckUntil, 0);
    assert.equal(s.returnBackoffs, 0);
});

test('m7: a job picked during a back-off clears the back-off, so the walk home after it is not held', () => {
    const { sys } = toBackoff();
    const s = sys.states.get('clerk');
    s.levels.caffeine = 0;   // urgent now: the selector picks the coffee
    let guard = 0;
    while (sys.getState('clerk').mode !== 'job' && guard++ < 200) sys.step(NEEDS_TICK_MS);
    assert.equal(sys.getState('clerk').mode, 'job');
    assert.equal(s.returnStuckUntil, 0, 'no stale back-off');
    assert.equal(s.returnBackoffs, 0);
});

// Code review R2 M1: a nudge longer than STUCK_SAME_PX used to start a new place, so a walk home
// nudged in and out of one wedge re-routed for ever and never reached return_abandoned
test('R2 M1: a walk home nudged 28 px back and forth in one wedge still backs off and is abandoned', () => {
    const { sys, w } = toReturning();
    assert.ok(28 > STUCK_SAME_PX, "a nudge longer than one place");   // and up to the 32 px nudge cap
    // The nudge runs and reports its landing (R3 M1), then the body is held back in the wedge
    w.setNudge((id, p) => ({ x: p.x === 200 ? 228 : 200, y: p.y }));
    let guard = 0;
    while (!evs(sys, 'return_abandoned').length && guard++ < 2000) sys.step(NEEDS_TICK_MS);
    assert.ok(homeMoves(w, sys).some(m => m.nudge), 'the nudge ran');
    assert.equal(evs(sys, 'return_stuck').length, 1, 'return_stuck comes');
    assert.equal(evs(sys, 'return_abandoned').length, 1, 'and the walk is abandoned, not re-routed for ever');
    assert.ok(evs(sys, 'return_resumed').length <= 2 * STUCK_TRIES + 2, 'a bounded number of re-routes');
});

// Code review R2 m2: the final abandon's late re-plans are spaced RETURN_FINAL_REPLAN_MS apart and
// capped at RETURN_FINAL_REPLANS; then it idles until a job moves it
test('R2 m2: late re-plans after a final abandon come RETURN_FINAL_REPLAN_MS apart, at most RETURN_FINAL_REPLANS', () => {
    const { sys, w } = toReturning();
    let guard = 0;
    while (!evs(sys, 'return_abandoned').some(e => e.final) && guard++ < 4000) sys.step(NEEDS_TICK_MS);
    assert.ok(evs(sys, 'return_abandoned').at(-1).final);
    const starts = [];
    let lastFinal = sys.clockMs;
    let finals = evs(sys, 'return_abandoned').length;
    let late = 0;
    const st = sys.states.get('clerk');
    for (let i = 0; i < 12 * 60 * 4; i++) {   // 12 minutes of needs clock, no need urgent (a job would end it)
        st.levels.caffeine = 100;
        const before = homeMoves(w, sys).length;
        sys.step(NEEDS_TICK_MS);
        const ab = evs(sys, 'return_abandoned').length;
        if (ab > finals) { finals = ab; lastFinal = sys.clockMs; }
        const now = st.returnLate || 0;   // counted per return (R3 m1)
        if (now > late) {
            assert.equal(homeMoves(w, sys).length, before + 1, 'a late try is one walk home');
            starts.push(sys.clockMs - lastFinal);
        }
        late = now;
    }
    assert.equal(starts.length, RETURN_FINAL_REPLANS, 'three late walks home, then no more');
    assert.ok(starts.every(dt => dt >= RETURN_FINAL_REPLAN_MS - NEEDS_TICK_MS), 'each a full interval after the last abandon');
    assert.ok(evs(sys, 'return_abandoned').slice(-RETURN_FINAL_REPLANS).every(e => e.final), 'each ends in a final abandon');
    assert.equal(sys.getState('clerk').mode, 'idle', 'then it idles there');
    assert.ok(sys.clockMs - lastFinal > 4 * RETURN_FINAL_REPLAN_MS, 'for minutes, with no fourth try');
});

// Code review R3 M1: a place covers where a nudge put the body only when the nudge ran. A refused
// nudge (the body on a walkable cell of its own) leaves the place at STUCK_SAME_PX
test('R3 M1: a refused nudge keeps the place at STUCK_SAME_PX; stalls 40 px apart are two places', () => {
    const { sys, w } = toReturning();
    const st = sys.states.get('clerk');
    let guard = 0;
    while (!homeMoves(w, sys).some(m => m.nudge) && guard++ < 400) sys.step(NEEDS_TICK_MS);
    assert.ok(homeMoves(w, sys).some(m => m.nudge), 'the last re-route asked for a nudge');
    assert.equal(st.stall.tries, STUCK_TRIES);
    assert.ok(!Number.isFinite(st.stall.nx), 'no nudge ran (none reported), so no landing is kept');
    // Held 28 px on: past STUCK_SAME_PX, a new place with a fresh three re-routes
    w.pos.clerk.x = 228;
    sys.step(RETURN_YIELD_MS + 2 * NEEDS_TICK_MS);
    assert.equal(st.stall.tries, 1, 'a new place, not a fourth try');
    assert.equal(evs(sys, 'return_stuck').length, 0);
    // Two stalls 40 px apart, no nudge: two places
    assert.equal(sys._samePlace({ x: 200, y: 200 }, { x: 240, y: 200 }), false);
    assert.equal(sys._samePlace({ x: 200, y: 200 }, { x: 220, y: 200 }), true);
    assert.equal(sys._samePlace({ x: 200, y: 200, nx: 228, ny: 200 }, { x: 248, y: 200 }), true, 'within 24 px of the landing');
    assert.equal(sys._samePlace({ x: 200, y: 200, nx: 228, ny: 200 }, { x: 214, y: 230 }), false, 'nothing between and beyond');
});

test('R3 M1: a nudge that ran is kept on the place; the back-off does not re-centre it', () => {
    const { sys, w } = toReturning();
    const st = sys.states.get('clerk');
    w.setNudge((id, p) => ({ x: p.x + 20, y: p.y }));
    let guard = 0;
    while (!evs(sys, 'return_stuck').length && guard++ < 400) sys.step(NEEDS_TICK_MS);
    assert.equal(evs(sys, 'return_stuck').length, 1);
    assert.deepEqual({ x: st.stall.x, y: st.stall.y, nx: st.stall.nx, tries: st.stall.tries }, { x: 200, y: 200, nx: 220, tries: 1 },
        'the back-off keeps the first centre and the landing');
    // Through the back-off it creeps 50 px on: more than 24 px from both, a new place
    w.setNudge(null);
    w.pos.clerk.x = 250;
    sys.step(RETURN_STUCK_BACKOFF_MS + RETURN_YIELD_MS + 4 * NEEDS_TICK_MS);
    assert.equal(st.returnBackoffs, 0, 'a new place starts the back-off count again');
});

// Code review R3 m1: late walks are counted per return, so two wedges in turn cannot run for ever
test('R3 m1: late walks alternating between two wedges stop after RETURN_FINAL_REPLANS', () => {
    const { sys, w } = toReturning();
    const st = sys.states.get('clerk');
    let guard = 0;
    while (!evs(sys, 'return_abandoned').some(e => e.final) && guard++ < 4000) sys.step(NEEDS_TICK_MS);
    let late = 0, starts = 0, lastMove = 0;
    for (let i = 0; i < 16 * 60 * 4; i++) {
        st.levels.caffeine = 100;
        const before = homeMoves(w, sys).length;
        sys.step(NEEDS_TICK_MS);
        if ((st.returnLate || 0) > late) {
            starts++;
            w.pos.clerk.x = w.pos.clerk.x === 200 ? 400 : 200;   // this late walk wedges on the other route
        }
        late = st.returnLate || 0;
        if (homeMoves(w, sys).length > before) lastMove = sys.clockMs;
    }
    assert.ok(evs(sys, 'return_abandoned').some(e => e.x === 400), 'it did abandon in the second place');
    assert.equal(starts, RETURN_FINAL_REPLANS, 'three late walks home in all, whatever the place');
    assert.equal(sys.getState('clerk').mode, 'idle');
    assert.ok(sys.clockMs - lastMove > 4 * RETURN_FINAL_REPLAN_MS, 'then no more walks home');
});

// Code review R3 m2: a late walk after an abandon with the player beside the NPC does not count
test('R3 m2: late walks held up by the player are not counted; it walks home once the player moves', () => {
    const { sys, w } = toReturning();
    const st = sys.states.get('clerk');
    w.setPlayerNear(true);
    let guard = 0;
    while (!evs(sys, 'return_abandoned').some(e => e.final) && guard++ < 4000) sys.step(NEEDS_TICK_MS);
    assert.equal(st.returnAbandon.player, true);
    const t0 = sys.clockMs;
    while (sys.clockMs - t0 < 14 * RETURN_FINAL_REPLAN_MS) { st.levels.caffeine = 100; sys.step(NEEDS_TICK_MS); }
    assert.equal(st.returnLate || 0, 0, 'none counted');
    assert.ok(evs(sys, 'return_abandoned').filter(e => e.final).length > RETURN_FINAL_REPLANS + 1, 'it kept trying while held');
    // The player steps away and the wedge clears: the next late walk gets home
    w.setPlayerNear(false);
    const moves = homeMoves(w, sys).length;
    while (homeMoves(w, sys).length === moves && sys.clockMs - t0 < 20 * RETURN_FINAL_REPLAN_MS) { st.levels.caffeine = 100; sys.step(NEEDS_TICK_MS); }
    assert.equal(homeMoves(w, sys).length, moves + 1, 'another walk home');
});

// Code review R3 m3: the deadline floor applies only while the deadline is ahead
test('R3 m3: a stall that fires on the deadline tick times out; no floor', () => {
    const { sys } = toGoto();
    const job = sys.states.get('clerk').job;
    sys.step(RETURN_YIELD_MS + NEEDS_TICK_MS);
    assert.equal(evs(sys, 'walk_rerouted').length, 1);
    job.deadline = sys.clockMs + RETURN_YIELD_MS;   // reached on the tick the next stall fires
    let rerouteAt = null, failAt = null, guard = 0;
    while (failAt == null && guard++ < 200) {
        sys.step(NEEDS_TICK_MS);
        if (rerouteAt == null && evs(sys, 'walk_rerouted').length === 2) rerouteAt = sys.clockMs;
        if (sys.getLog().some(e => e.npc === 'clerk' && e.ev === 'job_failed' && e.reason === 'timeout')) failAt = sys.clockMs;
    }
    assert.ok(rerouteAt != null, 'the stall watch fired');
    assert.equal(failAt, rerouteAt, 'and the job timed out on that same tick');
    assert.ok(!job.rerouteGrace, 'the floor was not used');
});
