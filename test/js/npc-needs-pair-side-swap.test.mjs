// A capacity-2 object whose side cell lies on the first user's way to the main cell (m03
// reception coffee: both staff come from the west, the side cell is west of the machine because
// the east side is a wall). Before the fix the first claimant kept the main cell and the second,
// usually the nearer, stopped at the side cell in its path; the first then waited behind it until
// its walk timed out. Now the nearer NPC takes the main cell and the first is re-routed to the
// side cell, so both use the machine together.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NPCNeedsSystem, NEEDS_TICK_MS } from '../../public/break_escape/js/systems/npc-needs.js';
import { makeWorld } from './fixtures/needs-stub-world.mjs';

const need = { decayPerMin: 8, urgentAt: 30, initial: 20, jitterPct: 0 };

function pairWorld(clerkPos, matePos, { freezeClerk = false, noSideFor = null } = {}) {
    const cfg = {
        npcs: {
            clerk: { pos: clerkPos, rec: { id: 'clerk', needsHome: 'clerk_pc', needs: { caffeine: need } } },
            mate: { pos: matePos, rec: { id: 'mate', needsHome: 'mate_pc', needs: { caffeine: freezeClerk ? { ...need, initial: 35 } : need } } }
        },
        objects: [
            { id: 'clerk_pc', x: 100, y: 68, affordance: { accepts: ['found_item'], useSeconds: 10 } },
            { id: 'mate_pc', x: 500, y: 68, affordance: { accepts: ['found_item'], useSeconds: 10 } },
            { id: 'kettle', x: 300, y: 300, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 30, capacity: 2 } }
        ],
        arrive: false
    };
    const w = makeWorld(cfg);
    // The live adapter's besideCell tries right, then left; here the right side is a wall.
    w.world.besideCell = (cell, taken, opts) => {
        if (noSideFor && opts?.from && Math.hypot(opts.from.x - w.pos[noSideFor].x, opts.from.y - w.pos[noSideFor].y) < 1) return null;
        const c = { x: cell.x - 32, y: cell.y };
        return taken.some(t => Math.hypot(t.x - c.x, t.y - c.y) < 16) ? null : c;
    };
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys);
    sys.registerAll();
    let guard = 0;
    if (freezeClerk) {
        // The clerk is walking to the kettle when the player starts talking to it; the mate claims later
        while (guard++ < 400 && sys.states.get('clerk').job?.phase !== 'goto_target') sys.step(NEEDS_TICK_MS);
        w.setChat('clerk');
        sys.step(NEEDS_TICK_MS);
    }
    while (guard++ < 400 && !(sys.states.get('clerk').job?.phase === 'goto_target' && sys.states.get('mate').job?.phase === 'goto_target')) sys.step(NEEDS_TICK_MS);
    return { w, sys };
}

const MAIN = { x: 300, y: 332 }, SIDE = { x: 268, y: 332 };

test('pair swap: the later claimant is nearer, so it takes the main cell and the first goes to the side cell', () => {
    const { w, sys } = pairWorld({ x: 100, y: 332 }, { x: 240, y: 332 });
    const clerk = sys.states.get('clerk'), mate = sys.states.get('mate');
    assert.equal(clerk.job.phase, 'goto_target');
    assert.equal(mate.job.phase, 'goto_target');
    assert.deepEqual(mate.job.dest, MAIN, 'the nearer NPC takes the main cell');
    assert.deepEqual(clerk.job.dest, SIDE, 'the first, further away, takes the side cell behind it');
    assert.ok(sys.getLog().some(e => e.ev === 'pair_side_swap' && e.npc === 'clerk'), 'the swap is logged');
    const clerkMoves = w.calls.moves.filter(m => m.id === 'clerk');
    assert.deepEqual({ x: clerkMoves.at(-1).x, y: clerkMoves.at(-1).y }, SIDE, 'the first was sent on to the side cell');
    assert.notEqual(clerk.job.moveId, clerkMoves[0].moveId, 'with a fresh move id, so the old walk\'s arrival is ignored');
});

test('pair swap: the first claimant is already nearer, so nothing changes', () => {
    const { sys } = pairWorld({ x: 240, y: 332 }, { x: 100, y: 332 });
    assert.deepEqual(sys.states.get('clerk').job.dest, MAIN);
    assert.deepEqual(sys.states.get('mate').job.dest, SIDE);
    assert.equal(sys.getLog().some(e => e.ev === 'pair_side_swap'), false);
});

test('pair swap: the side cell is not on the first user\'s way, so nothing changes', () => {
    // The first comes from the east, the side cell is west of the main cell
    const { sys } = pairWorld({ x: 500, y: 332 }, { x: 240, y: 332 });
    assert.deepEqual(sys.states.get('clerk').job.dest, MAIN);
    assert.deepEqual(sys.states.get('mate').job.dest, SIDE);
    assert.equal(sys.getLog().some(e => e.ev === 'pair_side_swap'), false);
});

test('pair swap: a user frozen in a conversation is not re-routed, so nothing changes (R7 M1)', () => {
    const { w, sys } = pairWorld({ x: 100, y: 332 }, { x: 240, y: 332 }, { freezeClerk: true });
    const clerk = sys.states.get('clerk'), mate = sys.states.get('mate');
    assert.equal(clerk.mode, 'frozen');
    assert.equal(mate.job.phase, 'goto_target');
    assert.deepEqual(clerk.job.dest, MAIN, 'the frozen user keeps the main cell');
    assert.deepEqual(mate.job.dest, SIDE, 'the claimant takes the side cell');
    assert.equal(sys.getLog().some(e => e.ev === 'pair_side_swap'), false);
    assert.equal(w.calls.moves.filter(m => m.id === 'clerk').length, 1, 'the frozen user got no new move');
});

test('pair swap: the first user has no side cell of its own, so nothing changes (R7 M2)', () => {
    const { sys } = pairWorld({ x: 100, y: 332 }, { x: 240, y: 332 }, { noSideFor: 'clerk' });
    const clerk = sys.states.get('clerk'), mate = sys.states.get('mate');
    assert.deepEqual(clerk.job.dest, MAIN, 'the first keeps the main cell');
    assert.deepEqual(mate.job.dest, SIDE);
    assert.equal(sys.getLog().some(e => e.ev === 'pair_side_swap'), false);
    assert.equal(sys.getLog().some(e => e.ev === 'npc_job_failed' || e.reason === 'no_beside_cell'), false, 'the first does not lose its break');
    assert.equal(clerk.job?.phase, 'goto_target');
});

test('pair swap: an arrival from the pre-swap move is ignored', () => {
    const { w, sys } = pairWorld({ x: 100, y: 332 }, { x: 240, y: 332 });
    const clerk = sys.states.get('clerk');
    const oldId = w.calls.moves.find(m => m.id === 'clerk').moveId;
    assert.notEqual(oldId, undefined);
    assert.notEqual(clerk.job.moveId, oldId);
    w.pos.clerk.x = MAIN.x; w.pos.clerk.y = MAIN.y;
    sys.onArrived('clerk', 'needs', { x: MAIN.x, y: MAIN.y, moveId: oldId });
    sys.step(NEEDS_TICK_MS);
    assert.equal(sys.getLog().some(e => e.npc === 'clerk' && e.ev === 'arrival_ignored'), true, 'the stale arrival is dropped');
    assert.equal(clerk.job.phase, 'goto_target', 'the first has not been counted as arrived at the main cell');
});
