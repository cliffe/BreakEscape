// NPC walk-in/out state machine (docs/agents/NPC_WALK_IN_OUT_PLAN.md sections 2-7), on stub
// behaviours with an injected environment: records at the trigger, persistOnly on a walk-out,
// npc_arrived for a walk-in and npc_left (never npc_arrived) for a walk-out, the early end out
// of view, no-ops, a walk-in cancelling a walk-out, the fallbacks and their `how`, the return
// home after a walk-out, and the timeout.
import test from 'node:test';
import assert from 'node:assert/strict';

import { world, flush } from './helpers/npc-walk-world.mjs';

const names = (w, prefix) => w.emits.filter(e => e.name.startsWith(prefix));

test('walk-in through a door: records visible at once (persistOnly), spawns out of view in the far room, walks to position', async () => {
    const w = world();
    const b = w.addNpc('guard');
    const p = w.manager.walkNPCIn('guard', { from: 'dock' });
    assert.equal(p.immediate, undefined, 'not settled at the call');
    assert.equal(w.visibility.get('guard'), true, 'recorded at the trigger');
    assert.equal(w.npcs.get('guard').isVisible, false, 'persistOnly: the entry is untouched until the spawn');
    assert.equal(w.syncs, 1);
    await flush();
    assert.equal(b.sprite.visible, true);
    assert.ok(b.sprite.body.center.x >= 348, 'spawned beyond the view margin, in the dock');
    assert.equal(b.roomId, 'dock');
    const mv = b.moves.at(-1);
    assert.deepEqual([mv.x, mv.y], [160, 160], 'walks to the scenario position');
    assert.equal(mv.opts.owner, 'walk');
    assert.deepEqual(mv.opts.arrivalData, { walk: 'in', how: 'walked' });
    assert.equal(w.manager.walks.get('guard').farRoom, 'dock');
    b.arrive({ x: 160, y: 160 });
    assert.equal(await p, 'walked');
    assert.equal(w.manager.walks.has('guard'), false);
    const arr = names(w, 'npc_arrived:guard');
    assert.equal(arr.length, 1);
    assert.equal(arr[0].data.how, 'walked');
});

test('walk-in with no from: picks a usable door, skips the one the player stands in', async () => {
    const w = world();
    const b = w.addNpc('guard');
    w.player = { x: 318, y: 160 };   // in the only doorway
    const p = w.manager.walkNPCIn('guard');
    await flush();
    // No door left: fade in at `to`
    assert.equal(b.moves.length, 0, 'already at position');
    assert.equal(await p, 'faded');
    assert.deepEqual(w.fades, [1]);
});

test('walk-in loads an unlocked far room that is not loaded', async () => {
    const w = world({ dockLoaded: false });
    const b = w.addNpc('guard');
    const p = w.manager.walkNPCIn('guard', { from: 'dock' });
    await flush(); await flush();
    assert.deepEqual(w.loads, ['dock']);
    assert.equal(b.roomId, 'dock');
    b.arrive();
    assert.equal(await p, 'walked');
});

test('walk-in through a locked door: doorway fade', async () => {
    const w = world({ locked: true });
    const b = w.addNpc('guard');
    const p = w.manager.walkNPCIn('guard', { from: 'dock' });
    await flush();
    assert.deepEqual(w.fades, [1], 'fades in');
    assert.equal(b.sprite.body.center.x, 320, 'at the doorway mouth');
    assert.equal(b.moves.at(-1).opts.arrivalData.how, 'faded');
    b.arrive();
    assert.equal(await p, 'faded');
});

test('walk-in when the far room never loads: doorway fade after the 3 s wait', async () => {
    const w = world({ dockLoaded: false });
    w.dockLoadsOnRequest = false;
    const b = w.addNpc('guard');
    const p = w.manager.walkNPCIn('guard', { from: 'dock' });
    for (let i = 0; i < 40; i++) await flush();
    assert.equal(b.sprite.body.center.x, 320);
    b.arrive();
    assert.equal(await p, 'faded');
});

test('walk-in on an NPC whose room is not loaded: instant, npc_arrived how instant', async () => {
    const w = world();
    w.npcs.set('ghost', { id: 'ghost', roomId: 'attic', isVisible: false });
    const shown = [];
    w.manager.setNPCVisible = (id, v) => shown.push([id, v]);
    const p = w.manager.walkNPCIn('ghost', {});
    assert.equal(p.immediate, true);
    assert.equal(await p, 'instant');
    assert.deepEqual(shown, [['ghost', true]]);
    assert.equal(names(w, 'npc_arrived:ghost')[0].data.how, 'instant');
});

test('walk-in on an NPC already visible: no-op, no event', async () => {
    const w = world();
    w.addNpc('guard', { visible: true });
    const p = w.manager.walkNPCIn('guard', {});
    assert.equal(p.immediate, true);
    assert.equal(await p, 'already');
    assert.equal(w.emits.length, 0);
});

test('walk-in "offscreen": the nearest out-of-view floor of the own room', async () => {
    const w = world({ view: { x: 0, y: 0, width: 100, height: 320 } });
    const b = w.addNpc('guard');
    const p = w.manager.walkNPCIn('guard', { from: 'offscreen' });
    await flush();
    assert.equal(b.roomId, 'hall');
    assert.ok(b.sprite.body.center.x > 132);
    b.arrive();
    assert.equal(await p, 'walked');
});

test('walk-in from an explicit tile in view: fades in over the walk', async () => {
    const w = world();
    const b = w.addNpc('guard');
    const p = w.manager.walkNPCIn('guard', { from: { x: 1, y: 1 } });
    await flush();
    assert.deepEqual(w.fades, [1]);
    b.arrive();
    assert.equal(await p, 'faded');
});

test('walk-out: persistOnly record, walks through the door, ends early out of view in the far room', async () => {
    const w = world();
    const b = w.addNpc('guard', { visible: true });
    const p = w.manager.walkNPCOut('guard', { to: 'dock' });
    assert.equal(w.visibility.get('guard'), false, 'saved hidden at the trigger');
    assert.equal(w.npcs.get('guard').isVisible, true, 'entry still visible while walking');
    assert.equal(w.manager.isWalkingOut('guard'), true);
    await flush();
    const mv = b.moves.at(-1);
    assert.equal(mv.opts.silentArrival, true);
    assert.ok(mv.x >= 348);
    // Still in the hall: the tick does nothing
    w.manager._walkTick(0, {});
    assert.equal(w.manager.walks.has('guard'), true);
    // Through the door and off camera
    b.sprite.body.reset(360, 160 - 16);
    b.roomId = 'dock';
    w.manager._walkTick(0, {});
    assert.equal(await p, 'walked');
    assert.equal(b.sprite.visible, false);
    assert.equal(b.sprite.body.enable, false);
    assert.deepEqual(b.sprite.body.center, { x: 160, y: 160 }, 'moved back to its scenario position');
    assert.equal(b.roomId, 'hall');
    assert.equal(w.npcs.get('guard').roomId, 'hall');
    assert.equal(w.npcs.get('guard').isVisible, false);
    assert.equal(names(w, 'npc_arrived:').length, 0, 'a walk-out never fires npc_arrived');
    const left = names(w, 'npc_left:guard');
    assert.equal(left.length, 1);
    assert.deepEqual(left[0].data, { npcId: 'guard', to: 'dock', how: 'walked' });
    assert.equal(w.manager.isWalkingOut('guard'), false);
});

test('walk-out arriving at its exit in view fades there', async () => {
    const w = world({ view: { x: 0, y: 0, width: 700, height: 320 } });
    const b = w.addNpc('guard', { visible: true });
    const p = w.manager.walkNPCOut('guard', { to: 'dock' });
    await flush();
    const mv = b.moves.at(-1);
    assert.equal(mv.x, 320, 'the far room is all in view: walk to the doorway');
    b.arrive({ x: 320, y: 160 });
    assert.equal(await p, 'faded');
    assert.deepEqual(w.fades, [0]);
    assert.equal(names(w, 'npc_left:guard').length, 1);
});

test('walk-out on a hidden NPC: no-op', async () => {
    const w = world();
    w.addNpc('guard', { visible: false });
    const p = w.manager.walkNPCOut('guard', { to: 'dock' });
    assert.equal(p.immediate, true);
    assert.equal(await p, 'noop');
    assert.equal(w.emits.length, 0);
});

test('walk-out of a conscious hostile: fades out in place', async () => {
    const w = world();
    const b = w.addNpc('guard', { visible: true });
    w.setHostile({ isNPCHostile: () => true, isNPCKO: () => false });
    const p = w.manager.walkNPCOut('guard', { to: 'dock' });
    assert.equal(await p, 'faded');
    assert.equal(b.moves.length, 0);
    assert.deepEqual(w.fades, [0]);
});

test('a repeat walk-out during a walk-out returns the same walk', async () => {
    const w = world();
    w.addNpc('guard', { visible: true });
    const p1 = w.manager.walkNPCOut('guard', { to: 'dock' });
    const p2 = w.manager.walkNPCOut('guard', { to: 'dock' });
    assert.equal(p1, p2);
});

test('a walk-in during a walk-out cancels it and walks back to position', async () => {
    const w = world();
    const b = w.addNpc('guard', { visible: true });
    const out = w.manager.walkNPCOut('guard', { to: 'dock' });
    await flush();
    const inn = w.manager.walkNPCIn('guard', {});
    assert.equal(await out, 'cancelled');
    assert.equal(w.visibility.get('guard'), true);
    const mv = b.moves.at(-1);
    assert.deepEqual([mv.x, mv.y], [160, 160]);
    b.arrive();
    assert.equal(await inn, 'walked');
    assert.equal(names(w, 'npc_left:').length, 0);
});

test('walk-in timeout: placed at the position instantly when it is out of view', async () => {
    const w = world({ view: { x: 400, y: 0, width: 200, height: 320 } });
    const b = w.addNpc('guard');
    const p = w.manager.walkNPCIn('guard', { from: 'dock', timeoutMs: 5000 });
    await flush();
    w.advance(6000);
    w.manager._walkTick(0, {});
    assert.equal(await p, 'instant');
    assert.ok(b.cancels >= 1);
    assert.deepEqual(b.sprite.body.center, { x: 160, y: 160 });
    assert.equal(names(w, 'npc_arrived:guard')[0].data.how, 'instant');
});

test('walk-out timeout: fades out where it stands', async () => {
    const w = world();
    w.addNpc('guard', { visible: true });
    const p = w.manager.walkNPCOut('guard', { to: 'dock', timeoutMs: 5000 });
    await flush();
    w.advance(6000);
    w.manager._walkTick(0, {});
    assert.equal(await p, 'faded');
    assert.equal(names(w, 'npc_left:guard')[0].data.how, 'faded');
});

test('a walker near a closed unlocked door opens it', async () => {
    const w = world();
    const b = w.addNpc('guard', { visible: true });
    w.manager.walkNPCOut('guard', { to: 'dock' });
    await flush();
    b.sprite.body.reset(300, 160 - 16);
    w.manager._walkTick(0, {});
    assert.deepEqual(w.opened, ['guard']);
});
