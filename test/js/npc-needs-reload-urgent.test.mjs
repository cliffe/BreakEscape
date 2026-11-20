// Reload with a need already urgent (CA0 wave 2 gate D). On a load the needs NPCs register and
// tick before the world path grid is built (npc-pathfinding.js). Live trace, game 10977: ticks 1
// and 2 ran with no grid, the grid came about 130 ms later. Without a grid, findWorldPath answers
// null and approachCell finds no cell, so every source read as unreachable and a need at or below
// urgentAt parked `no_source` for the full defer (needsDeferMin, 4 minutes). The needs layer now
// waits while world.pathReady() is false, and selects as soon as the grid is there.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NPCNeedsSystem, NEEDS_TICK_MS, createEngineWorld } from '../../public/break_escape/js/systems/npc-needs.js';
import { makeWorld } from './fixtures/needs-stub-world.mjs';

// Yusuf's shape: coordinate home, thirst initial 45 under urgentAt 50, a water cooler source
function cfg() {
    return {
        npcs: {
            yusuf: {
                pos: { x: 96, y: 224 },
                rec: {
                    id: 'yusuf', needsHome: { room: 'office', x: 3, y: 7 },
                    needs: { thirst: { decayPerMin: 1, urgentAt: 50, initial: 45, jitterPct: 0 } }
                }
            }
        },
        objects: [
            { id: 'water_cooler', x: 300, y: 180, affordance: { satisfies: 'thirst', restores: 60, useSeconds: 20 } }
        ]
    };
}

/** A stub world whose path grid is not built for the first `notReadyTicks` ticks; every source
 *  reads as unreachable until then, as the live adapter's reachable() does without a grid. */
function boot(notReadyTicks) {
    const w = makeWorld(cfg());
    const sys = new NPCNeedsSystem(w.world, { seed: 3, manualClock: true });
    const ready = () => sys.tickCount > notReadyTicks;
    w.world.pathReady = ready;
    w.world.reachable = () => ready();
    w.attach(sys);
    sys.registerAll();
    return { w, sys };
}

const ev = (sys, name) => sys.getLog().filter(e => e.npc === 'yusuf' && e.ev === name);

test('reload with an urgent need: no park while the path grid is not built; a drink as soon as it is', () => {
    const { sys } = boot(3);
    sys.step(3 * NEEDS_TICK_MS);
    assert.equal(ev(sys, 'parked').length, 0, 'waits, never parks no_source, while the grid is missing');
    assert.equal(ev(sys, 'job_start').length, 0);
    sys.step(2 * NEEDS_TICK_MS);
    const job = ev(sys, 'job_start');
    assert.equal(job.length, 1, 'selects on the first tick with a grid');
    assert.equal(job[0].target, 'water_cooler');
    assert.equal(job[0].t, 4, 'the first tick with a grid, not one later');
    assert.equal(ev(sys, 'path_wait').length, 1, 'the wait is logged once');
    sys.step(60000);
    assert.ok(ev(sys, 'used').some(e => e.target === 'water_cooler'));
    assert.equal(ev(sys, 'parked').length, 0);
});

test('control: a world with no pathReady parks no_source on the first ticks when nothing is reachable (the bug as it was)', () => {
    const w = makeWorld(cfg());
    const sys = new NPCNeedsSystem(w.world, { seed: 3, manualClock: true });
    let ticks = 0;
    w.world.reachable = () => ticks > 3;
    w.attach(sys);
    sys.registerAll();
    for (let i = 0; i < 5; i++) { ticks++; sys.step(NEEDS_TICK_MS); }
    assert.equal(ev(sys, 'parked').length, 1);
    assert.equal(ev(sys, 'parked')[0].reason, 'no_source');
    assert.equal(ev(sys, 'job_start').length, 0, 'parked for the defer, not retried');
});

test('a genuine no_source still parks once the grid is ready', () => {
    const c = cfg();
    c.objects = [];
    const w = makeWorld(c);
    const sys = new NPCNeedsSystem(w.world, { seed: 3, manualClock: true });
    w.world.pathReady = () => sys.tickCount > 2;
    w.attach(sys);
    sys.registerAll();
    sys.step(2 * NEEDS_TICK_MS);
    assert.equal(ev(sys, 'parked').length, 0);
    sys.step(2 * NEEDS_TICK_MS);
    assert.equal(ev(sys, 'parked').length, 1);
    assert.equal(ev(sys, 'parked')[0].reason, 'no_source');
});

// The real adapter over a stub window: pathReady follows the pathfinding manager's grid
function adapterPathReady(pm) {
    const prev = globalThis.window;
    globalThis.window = { rooms: {}, gameState: { globalVariables: {} }, gameScenario: {}, pathfindingManager: pm };
    try { return createEngineWorld().pathReady(); } finally { globalThis.window = prev; }
}

test('adapter pathReady: false until the world grid, its bounds and its pathfinder exist', () => {
    const find = () => {};
    assert.equal(adapterPathReady(undefined), true, 'no pathfinding manager: ready, as reachable() treats it');
    assert.equal(adapterPathReady({ findWorldPath: find }), false);
    assert.equal(adapterPathReady({ findWorldPath: find, worldPathfinder: {}, worldGridBounds: {} }), false, 'no grid yet');
    assert.equal(adapterPathReady({ findWorldPath: find, worldPathfinder: {}, worldGrid: [[0]], worldGridBounds: {} }), true);
});

test('adapter: with no grid, reachable() and pathReady() are both false; with the grid both are true', () => {
    // The pair behind the bug: reachable() reads a source as unreachable without a grid (approachCell
    // finds no cell), so the needs layer must not select while pathReady() is false
    const sprite = { body: { center: { x: 100, y: 100 } } };
    const pm = { findWorldPath: (sx, sy, ex, ey, cb) => cb(pm.worldGrid ? [{ x: ex, y: ey }] : null) };
    pm.findNearestWalkableWorldCell = (x, y) => (pm.worldGrid ? { x, y } : null);
    const win = {
        rooms: {}, gameState: { globalVariables: {} }, gameScenario: {}, pathfindingManager: pm,
        npcBehaviorManager: { getBehavior: id => (id === 'yusuf' ? { sprite, roomId: 'office' } : null) }
    };
    const cooler = { id: 'water_cooler', x: 300, y: 180, roomId: 'office', affordance: { satisfies: 'thirst' } };
    const prev = globalThis.window;
    globalThis.window = win;
    try {
        const w = createEngineWorld();
        assert.equal(w.pathReady(), false);
        assert.equal(w.reachable('yusuf', cooler), false, 'no grid: the source reads as unreachable');
        Object.assign(pm, { worldPathfinder: {}, worldGrid: [[0]], worldGridBounds: {} });
        assert.equal(w.pathReady(), true);
        assert.equal(w.reachable('yusuf', cooler), true);
    } finally { globalThis.window = prev; }
});
