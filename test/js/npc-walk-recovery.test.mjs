// The live-failure fixes in npc-walk.js (commit e9e972a16): the closed-door approach, a walk-out
// that arrives in view re-planning to another out-of-view cell, the stall fallback, walk-ins
// ending within WALK_ARRIVE_PX, the bridge's npcWalk rename and the scene fallbacks in makeEnv.
// On the shared stub world (helpers/npc-walk-world.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { world, flush } from './helpers/npc-walk-world.mjs';
import { WALK_STALL_MS, WALK_MAX_REPLANS, WALK_ARRIVE_PX, installNpcWalk } from '../../public/break_escape/js/systems/npc-walk.js';

const names = (w, prefix) => w.emits.filter(e => e.name.startsWith(prefix));
const tick = (w) => w.manager._walkTick(0, {});

test('constants: stall 3 s, 4 re-plans, arrive within 10 px', () => {
    assert.equal(WALK_STALL_MS, 3000);
    assert.equal(WALK_MAX_REPLANS, 4);
    assert.equal(WALK_ARRIVE_PX, 10);
});

// ── closed-door approach ─────────────────────────────────────────────────────

test('walk-in through a closed door: approach first, open on arrival, then the real move', async () => {
    const w = world({ closed: true, view: { x: 0, y: 0, width: 400, height: 320 } });   // door in view: the spawn is well beyond it
    const b = w.addNpc('guard');
    const p = w.manager.walkNPCIn('guard', { from: 'dock' });
    await flush();
    assert.equal(w.opened.length, 0, 'spawned far from the door: nothing opened yet');
    assert.equal(b.moves.length, 1);
    const leg1 = b.moves[0];
    assert.ok(Math.abs(leg1.x - 320) <= 48 + 8 && leg1.x > 320, `approach point beside the door, got ${leg1.x}`);
    assert.equal(leg1.opts.silentArrival, true);
    assert.equal(leg1.opts.arriveWithin, undefined, 'the approach is not the final move');
    b.arrive({ x: leg1.x, y: leg1.y });
    assert.deepEqual(w.opened, ['guard'], 'opened on reaching the approach point');
    const ev = names(w, 'door_opened_by_npc');
    assert.equal(ev.length, 1);
    assert.deepEqual(ev[0].data, { roomId: 'hall', connectedRoom: 'dock', direction: 'east', npcId: 'guard' });
    assert.equal(b.moves.length, 2);
    const leg2 = b.moves[1];
    assert.deepEqual([leg2.x, leg2.y], [160, 160]);
    assert.equal(leg2.opts.arriveWithin, 10);
    assert.equal(names(w, 'npc_arrived:').length, 0, 'the approach leg is silent');
    b.arrive({ x: 160, y: 160 });
    assert.equal(await p, 'walked');
    assert.equal(names(w, 'npc_arrived:guard').length, 1);
});

test('a walker already within reach of a closed door opens it and makes the one move', async () => {
    const w = world({ closed: true });
    const b = w.addNpc('guard', { visible: true, at: { x: 300, y: 160 } });
    w.manager.walkNPCOut('guard', { to: 'dock' });
    await flush();
    assert.deepEqual(w.opened, ['guard']);
    assert.equal(names(w, 'door_opened_by_npc').length, 1);
    assert.equal(b.moves.length, 1, 'no approach leg');
});

test('a closed LOCKED door is not approached or opened by the walk', async () => {
    const w = world({ closed: true, locked: true });
    const b = w.addNpc('guard');
    w.manager.walkNPCIn('guard', { from: 'dock' });
    await flush();
    assert.equal(w.opened.length, 0);
    assert.equal(names(w, 'door_opened_by_npc').length, 0);
    assert.ok(b.moves.length <= 1);
});

test('a door with open undefined (stub) behaves as before: no approach leg', async () => {
    const w = world();
    const b = w.addNpc('guard');
    w.manager.walkNPCIn('guard', { from: 'dock' });
    await flush();
    assert.equal(b.moves.length, 1);
    assert.deepEqual([b.moves[0].x, b.moves[0].y], [160, 160]);
});

// ── walk-out re-plan ─────────────────────────────────────────────────────────

test('walk-out arriving in view re-plans to another out-of-view cell and still reports walked', async () => {
    const w = world();
    const b = w.addNpc('guard', { visible: true });
    const p = w.manager.walkNPCOut('guard', { to: 'dock' });
    await flush();
    const first = b.moves.at(-1);
    assert.ok(first.x > 320, 'first exit cell is in the dock');
    w.view = { x: 0, y: 0, width: 480, height: 320 };      // the camera moved: that cell is in view now
    b.arrive({ x: first.x, y: first.y });
    await flush();
    assert.equal(b.moves.length, 2, 're-planned: another move');
    const second = b.moves.at(-1);
    assert.ok(second.x > first.x, 'a cell further out');
    assert.equal(w.fades.length, 0, 'no fade in view');
    b.arrive({ x: second.x, y: second.y });
    assert.equal(await p, 'walked');
    const left = names(w, 'npc_left:guard');
    assert.equal(left.length, 1);
    assert.equal(left[0].data.how, 'walked');
});

test('walk-out: after 4 failed re-plans it fades and reports faded', async () => {
    const w = world();
    const b = w.addNpc('guard', { visible: true });
    const p = w.manager.walkNPCOut('guard', { to: 'dock' });
    await flush();
    for (let i = 0; i < WALK_MAX_REPLANS + 1; i++) {
        const mv = b.moves.at(-1);
        w.view = { x: 0, y: 0, width: mv.x - 28, height: 320 };   // each arrival cell is in view
        b.arrive({ x: mv.x, y: mv.y });
        await flush();
    }
    assert.equal(b.moves.length, WALK_MAX_REPLANS + 1, 'the first plan plus four re-plans');
    assert.equal(await p, 'faded');
    assert.deepEqual(w.fades, [0]);
    assert.equal(names(w, 'npc_left:guard')[0].data.how, 'faded');
});

test('walk-out never re-plans back into the room it left', async () => {
    const w = world();
    const b = w.addNpc('guard', { visible: true });
    const p = w.manager.walkNPCOut('guard', { to: 'dock' });
    await flush();
    const first = b.moves.at(-1);
    // The whole dock is in view and the hall is not: the only other door leads back to the hall.
    w.view = { x: 330, y: 0, width: 320, height: 320 };
    b.arrive({ x: first.x, y: first.y });
    assert.equal(await p, 'faded');
    assert.equal(b.moves.length, 1, 'no move back through the door');
    assert.deepEqual(w.fades, [0]);
});

// ── stall ────────────────────────────────────────────────────────────────────

test('stall: a walk-out with no movement for 3 s re-plans', async () => {
    const w = world();
    const b = w.addNpc('guard', { visible: true });
    w.manager.walkNPCOut('guard', { to: 'dock' });
    await flush();
    const before = b.moves.length;
    tick(w);                                  // records the position
    w.advance(WALK_STALL_MS - 100);
    tick(w);
    assert.equal(b.cancels, 0, 'not yet');
    w.advance(200);
    tick(w);
    await flush();
    assert.equal(b.cancels, 1, 'the stuck move is cancelled');
    assert.equal(b.moves.length, before + 1, 're-planned to an exit');
});

test('stall: a walk-in re-issues the move, then tries another door, then fades as faded', async () => {
    const w = world({ annex: true });
    const b = w.addNpc('guard');
    const p = w.manager.walkNPCIn('guard');      // no from: the nearest usable door first, then the other
    await flush();
    assert.equal(b.roomId, 'dock');
    assert.equal(b.moves.length, 1);
    tick(w);
    // stall 1: same move again
    w.advance(WALK_STALL_MS + 100); tick(w); await flush();
    assert.equal(b.cancels, 1);
    assert.equal(b.moves.length, 2, 're-issued');
    assert.deepEqual([b.moves[1].x, b.moves[1].y], [b.moves[0].x, b.moves[0].y]);
    assert.equal(b.moves[1].opts.arriveWithin, 10);
    // stall 2: another door, the annex
    w.advance(WALK_STALL_MS + 100); tick(w); await flush(); await flush();
    assert.equal(b.cancels, 2);
    assert.equal(w.manager.walks.get('guard').farRoom, 'annex');
    assert.ok(b.sprite.body.center.x < 0, 'respawned in the annex, out of view');
    assert.equal(b.moves.length, 3);
    // stall 3: no door left (dock and annex tried): the timeout fade
    w.advance(WALK_STALL_MS + 100); tick(w); await flush(); await flush();
    w.advance(WALK_STALL_MS + 100); tick(w); await flush(); await flush();
    assert.equal(await p, 'faded');
    assert.deepEqual([b.sprite.body.center.x, b.sprite.body.center.y], [160, 160]);
    assert.ok(w.fades.includes(1), 'faded in at its position');
});

test('stall: a walk-in with one door re-issues once, then fades as faded', async () => {
    const w = world();
    const b = w.addNpc('guard');
    const p = w.manager.walkNPCIn('guard', { from: 'dock' });
    await flush();
    tick(w);
    w.advance(WALK_STALL_MS + 100); tick(w); await flush();
    assert.equal(b.moves.length, 2);
    w.advance(WALK_STALL_MS + 100); tick(w); await flush(); await flush();
    assert.equal(await p, 'faded');
    assert.deepEqual(w.fades, [1], 'faded in, not shown at once');
    assert.deepEqual([b.sprite.body.center.x, b.sprite.body.center.y], [160, 160]);
});

test('no stall while the body keeps moving', async () => {
    const w = world();
    const b = w.addNpc('guard', { visible: true });
    w.manager.walkNPCOut('guard', { to: 'dock' });
    await flush();
    for (let i = 0; i < 5; i++) {
        b.sprite.body.reset(200 + i * 10, 144);
        w.advance(WALK_STALL_MS - 500);
        tick(w);
    }
    assert.equal(b.cancels, 0);
});

// ── arrive within ────────────────────────────────────────────────────────────

test('walk-ins pass arriveWithin 10 (the door route and the offscreen route)', async () => {
    const w = world();
    const b = w.addNpc('guard');
    w.manager.walkNPCIn('guard', { from: 'dock' });
    await flush();
    assert.equal(b.moves.at(-1).opts.arriveWithin, 10);

    const w2 = world({ view: { x: 0, y: 0, width: 200, height: 320 } });
    const b2 = w2.addNpc('guard');
    w2.manager.walkNPCIn('guard', { from: 'offscreen' });
    await flush();
    assert.equal(b2.moves.at(-1)?.opts.arriveWithin, 10);
});

// ── bridge rename ────────────────────────────────────────────────────────────

test('test bridge: __test.npcWalk exists and walk(direction, ms) is the original function', () => {
    const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js/systems/test-bridge/index.js'), 'utf8');
    assert.match(src, /^    npcWalk: \{$/m);
    assert.match(src, /^    async walk\(direction, ms = 300, \{ run = false \} = \{\}\) \{$/m);
    assert.doesNotMatch(src, /^    walk: \{$/m, 'the object must not shadow bridge.walk');
    for (const fn of ['in(npcId', 'out(npcId', 'state(npcId']) assert.ok(src.includes(fn), fn);
});

// ── makeEnv scene fallbacks ──────────────────────────────────────────────────

test('makeEnv view(): manager.scene, then pathfindingManager.scene, then game.scene.manager.scenes[0], then game.scene.scenes[0]', () => {
    const mk = (n) => ({ cameras: { main: { worldView: { x: n, y: 0, width: 1, height: 1 } } } });
    const had = Object.getOwnPropertyDescriptor(globalThis, 'window');
    try {
        const build = (win, mgrScene) => {
            globalThis.window = win;
            const m = { behaviors: new Map(), scene: mgrScene };
            installNpcWalk(m, {});
            return m._walkEnv.view();
        };
        assert.equal(build({ pathfindingManager: { scene: mk(2) }, game: { scene: { manager: { scenes: [mk(3)] }, scenes: [mk(4)] } } }, mk(1)).x, 1);
        assert.equal(build({ pathfindingManager: { scene: mk(2) }, game: { scene: { manager: { scenes: [mk(3)] }, scenes: [mk(4)] } } }, undefined).x, 2);
        assert.equal(build({ game: { scene: { manager: { scenes: [mk(3)] }, scenes: [mk(4)] } } }, undefined).x, 3);
        assert.equal(build({ game: { scene: { scenes: [mk(4)] } } }, undefined).x, 4);
        assert.equal(build({}, undefined), null);
    } finally {
        if (had) Object.defineProperty(globalThis, 'window', had); else delete globalThis.window;
    }
});

// ── far-room load ────────────────────────────────────────────────────────────

test('a refused room load (server 403) ends the wait at once: doorway fade, no 3 s dead time', async () => {
    const w = world({ dockLoaded: false });
    w.dockLoadsOnRequest = false;                 // loadRoom resolves, the room never appears
    const b = w.addNpc('guard');
    const t0 = w.clock;
    const p = w.manager.walkNPCIn('guard', { from: 'dock' });
    for (let i = 0; i < 10; i++) await flush();
    assert.ok(w.clock - t0 < 1000, `waited ${w.clock - t0} ms`);
    assert.equal(b.sprite.body.center.x, 320, 'at the doorway');
    b.arrive();
    assert.equal(await p, 'faded');
});

test('a slow room load that finishes inside the wait still walks in', async () => {
    const w = world({ dockLoaded: false });
    const b = w.addNpc('guard');
    let release;
    w.manager._walkEnv.wait = async (ms) => { w.advance(ms); await flush(); };   // one poll per macrotask
    w.manager._walkEnv.loadRoom = () => new Promise((r) => { release = () => { w.loadDock(); r(); }; });
    const p = w.manager.walkNPCIn('guard', { from: 'dock' });
    for (let i = 0; i < 5; i++) await flush();
    release();
    for (let i = 0; i < 5; i++) await flush();
    assert.equal(b.roomId, 'dock');
    assert.ok(b.sprite.body.center.x > 340, 'spawned in the loaded dock');
    b.arrive({ x: 160, y: 160 });
    assert.equal(await p, 'walked');
});

// ── walk-out stops close, spawn re-checked before showing ─────────────────────────────

test('walk-out legs end within WALK_ARRIVE_PX (a 1-tile stop short left the walker in view)', async () => {
    const w = world();
    const b = w.addNpc('guard', { visible: true });
    w.manager.walkNPCOut('guard', { to: 'dock' });
    await flush();
    assert.equal(b.moves.at(-1).opts.arriveWithin, WALK_ARRIVE_PX);
});

test('a spawn cell that comes into view before the NPC is shown is not used: fade at the doorway, no pop', async () => {
    // baseline: count the view() reads of one clean walk-in
    let n = 0;
    const small = { x: 0, y: 0, width: 300, height: 320 };
    const big = { x: 0, y: 0, width: 700, height: 320 };
    const w0 = world();
    Object.defineProperty(w0, 'view', { get() { n++; return small; }, set() {} });
    w0.addNpc('guard');
    w0.manager.walkNPCIn('guard', { from: 'dock' });
    await flush();
    const reads = n;
    // the camera moves after the spawn search but before the re-check: the last read sees the big view
    let m = 0;
    const w = world();
    Object.defineProperty(w, 'view', { get() { m++; return m < reads ? small : big; }, set() {} });
    const b = w.addNpc('guard');
    const p = w.manager.walkNPCIn('guard', { from: 'dock' });
    await flush();
    assert.deepEqual(w.fades, [1], 'faded in, not shown at once');
    b.arrive({ x: 160, y: 160 });
    assert.equal(await p, 'faded');
    const arrived = names(w, 'npc_arrived:guard');
    assert.equal(arrived.length, 1);
});
