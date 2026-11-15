// Stalled needs walks (docs/achitechture/OFFICE_LIFE_STUCK_RETURN.md): a walk home or an outbound
// leg that stands still is re-issued round other bodies, and gives up with one clear line
// (return_stuck, walk_stuck) instead of re-issuing for ever. Also the behaviour and pathfinding
// halves: a needs re-route plans round seated bodies, and a bump far from a needs destination is
// no longer an arrival.
// Run with: node test/js/npc-needs-stuck-walk.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NPCNeedsSystem, NEEDS_TICK_MS, RETURN_YIELD_MS, STUCK_TRIES, RETURN_STUCK_BACKOFF_MS } from '../../public/break_escape/js/systems/npc-needs.js';
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

test('a wedged outbound leg re-routes keeping its deadline, then fails with walk_stuck, not a timeout', () => {
    const { sys, w } = toGoto();
    const job = sys.states.get('clerk').job;
    const deadline = job.deadline;
    sys.step(RETURN_YIELD_MS + NEEDS_TICK_MS);
    const rr = evs(sys, 'walk_rerouted');
    assert.equal(rr.length, 1);
    assert.equal(rr[0].phase, 'goto_target');
    assert.equal(w.calls.moves.at(-1).reroute, true);
    assert.equal(sys.states.get('clerk').job.deadline, deadline, 'a re-route does not extend the deadline');
    for (let i = 0; i < STUCK_TRIES; i++) sys.step(RETURN_YIELD_MS + NEEDS_TICK_MS);
    assert.equal(evs(sys, 'walk_stuck').length, 1);
    assert.ok(sys.getLog().some(e => e.npc === 'clerk' && e.ev === 'job_failed' && e.reason === 'stuck'), JSON.stringify(sys.getLog().slice(-6)));
    assert.equal(evs(sys, 'job_failed').filter(e => e.reason === 'timeout').length, 0);
    assert.notEqual(sys.getState('clerk').mode, 'job', 'the job is over (it goes home as any failed job does)');
});

test('a walk making progress is never re-routed', () => {
    const { sys, w } = toGoto();
    for (let i = 0; i < 60; i++) { w.pos.clerk.x += 3; w.pos.clerk.y += 3; sys.step(NEEDS_TICK_MS); }
    assert.equal(evs(sys, 'walk_rerouted').length, 0);
});
