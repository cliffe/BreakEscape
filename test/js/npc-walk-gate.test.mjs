// NPC walk-in/out (docs/agents/NPC_WALK_IN_OUT_PLAN.md sections 4 and 6): the behaviour hooks a
// walk relies on. wantsToCrossGate is true for a walker between its room and the walk's far
// room, and a walker is never turned back (it waits, then falls back on timeoutMs). goToAndStay
// carries onArrive / arrivalData / silentArrival to the arrival; cancelMove drops them.
//
// npc-behavior.js imports a chain that assigns window.* at module top, so the window stub is set
// before a dynamic import of the module.
import test from 'node:test';
import assert from 'node:assert/strict';

const emits = [];
globalThis.window = globalThis.window || {};
globalThis.window.seating = undefined;
globalThis.window.npcNeedsSystem = { onExternalMove() {} };
globalThis.window.eventDispatcher = { emit(name, data) { emits.push({ name, data }); } };

const { NPCBehavior } = await import('../../public/break_escape/js/systems/npc-behavior.js');

function stub() {
    const b = Object.create(NPCBehavior.prototype);
    b.npcId = 'guard';
    b.direction = 'down';
    b.config = { patrol: { waypoints: [], speed: 80, enabled: false, waypointIndex: 0, waypointMode: 'sequential' } };
    b.sprite = { body: { setVelocity() {} } };
    b.currentPath = [];
    b.pathIndex = 0;
    b.isMoving = false;
    b.playAnimation = () => {};
    b._clearPatrolPathDebug = () => {};
    b.npcBodyPos = () => ({ x: 200, y: 200 });
    b.roomId = 'hall';
    return b;
}

const gateHallDock = { roomId: 'hall', connectedRoom: 'dock' };
const gateHallYard = { roomId: 'yard', connectedRoom: 'hall' };

test('a walker wants to cross the gate between its room and the far room only', () => {
    const b = stub();
    b._walk = { farRoom: 'dock' };
    assert.equal(b.wantsToCrossGate(gateHallDock), true);
    assert.equal(b.wantsToCrossGate(gateHallYard), false, 'another gate of the same room');
    b.roomId = 'dock';
    assert.equal(b.wantsToCrossGate(gateHallDock), false, 'already in the far room');
});

test('no walk and no route: no gate wanted; a walker is never turned back', () => {
    const b = stub();
    assert.equal(b.wantsToCrossGate(gateHallDock), false);
    b._walk = { farRoom: 'dock' };
    assert.equal(b.turnBackFromGate(gateHallDock), false, 'waits instead');
});

test('arrival carries arrivalData into npc_arrived and calls onArrive once', () => {
    emits.length = 0;
    const b = stub();
    const arrived = [];
    b.goToAndStay(300, 300, 90, { owner: 'walk', arrivalData: { walk: 'in', how: 'walked' }, onArrive: (p) => arrived.push(p) });
    b._triggerGoToStayArrival();
    const ev = emits.filter(e => e.name === 'npc_arrived:guard');
    assert.equal(ev.length, 1);
    assert.equal(ev[0].data.owner, 'walk');
    assert.equal(ev[0].data.walk, 'in');
    assert.equal(ev[0].data.how, 'walked');
    assert.deepEqual(arrived, [{ x: 200, y: 200 }]);
    assert.equal(b._moveOnArrive, null, 'cleared after use');
});

test('a silent arrival (walk-out) emits no npc_arrived but still calls onArrive', () => {
    emits.length = 0;
    const b = stub();
    let called = 0;
    b.goToAndStay(300, 300, 90, { owner: 'walk', silentArrival: true, onArrive: () => called++ });
    b._triggerGoToStayArrival();
    assert.equal(emits.filter(e => e.name === 'npc_arrived:guard').length, 0);
    assert.equal(called, 1);
});

test('cancelMove drops the arrival callback; a later plain move is not silent', () => {
    emits.length = 0;
    const b = stub();
    let called = 0;
    b.goToAndStay(300, 300, 90, { owner: 'walk', silentArrival: true, onArrive: () => called++ });
    b.cancelMove();
    assert.equal(b._moveOnArrive, null);
    assert.equal(b._moveSilent, false);
    b.goToAndStay(300, 300, 90, { owner: 'script' });
    b._triggerGoToStayArrival();
    assert.equal(called, 0);
    assert.equal(emits.filter(e => e.name === 'npc_arrived:guard').length, 1);
});

test('a move issued mid-walk replaces the walk callback (the walk then times out)', () => {
    const b = stub();
    let called = 0;
    b.goToAndStay(300, 300, 90, { owner: 'walk', onArrive: () => called++ });
    b.goToAndStay(100, 100, 80, { owner: 'needs' });
    b._triggerGoToStayArrival();
    assert.equal(called, 0);
});

test('updateCurrentRoom sets npcData.roomId while a walk is on', () => {
    const b = stub();
    b.pathfindingManager = { roomBounds: new Map([['hall', { worldX: 0, worldY: 0, mapWidth: 5, mapHeight: 5 }], ['dock', { worldX: 160, worldY: 0, mapWidth: 10, mapHeight: 10 }]]) };
    b.npcBodyPos = () => ({ x: 250, y: 100 });
    b.chasePath = [];
    const npcData = { roomId: 'hall' };
    const prev = window.npcManager;
    window.npcManager = { npcs: new Map([['guard', npcData]]) };
    try {
        b._walk = { farRoom: 'dock' };
        b.updateCurrentRoom();
        assert.equal(b.roomId, 'dock');
        assert.equal(npcData.roomId, 'dock');
    } finally { window.npcManager = prev; }
});

test('_ensureWallCollidersFor adds each loaded room once', () => {
    const b = stub();
    b._routeWallRooms = new Set();
    b.homeRoomId = 'hall';
    const added = [];
    b.scene = { physics: { add: { collider: (s, box) => added.push(box.id) } } };
    const prev = window.rooms;
    window.rooms = { dock: { wallCollisionBoxes: [{ id: 'd1', body: {} }, { id: 'd2', body: {} }] } };
    try {
        b._ensureWallCollidersFor(['dock', 'unloaded']);
        b._ensureWallCollidersFor(['dock']);
        assert.deepEqual(added, ['d1', 'd2']);
        assert.ok(b._routeWallRooms.has('hall') && b._routeWallRooms.has('dock'));
    } finally { window.rooms = prev; }
});

// ── Door-pass hook (setNpcDoorPassHook; CA0's gate rules) ───────────────────
// Before the walker plans the locked-door fade it asks the hook; true (or a promise of true)
// opens the door with openDoorForNpc(..., { passedByHook: true }). A throw, a rejection, a
// non-true value or no answer in time is false. One hook at a time; never cached.

const walkMod = await import('../../public/break_escape/js/systems/npc-walk.js');
const { setNpcDoorPassHook, getNpcDoorPassHook, askDoorPassHook, DOOR_PASS_HOOK_TIMEOUT_MS } = walkMod;
const { world, flush } = await import('./helpers/npc-walk-world.mjs');

const settle = async (n = 6) => { for (let i = 0; i < n; i++) await flush(); };

function withWarns(fn) {
    const prev = console.warn;
    const warns = [];
    console.warn = (...a) => warns.push(a.map(String).join(' '));
    return Promise.resolve().then(() => fn(warns)).finally(() => { console.warn = prev; setNpcDoorPassHook(null); });
}

// The stub world's hall->dock door, locked; the hook timeout is short so a hang test is quick
function lockedWorld(extra = {}) {
    const w = world({ locked: true, ...extra });
    w.manager._walkEnv.hookTimeoutMs = 50;
    return w;
}

test('door-pass hook: exposed on window.npcWalk; the timeout is about 2000 ms', () => {
    assert.equal(typeof window.npcWalk?.setDoorPassHook, 'function');
    assert.equal(window.npcWalk.setDoorPassHook, setNpcDoorPassHook);
    assert.equal(DOOR_PASS_HOOK_TIMEOUT_MS, 2000);
});

test('door-pass hook: no hook keeps the current rule (locked door -> doorway fade, hook not asked)', async () => {
    setNpcDoorPassHook(null);
    const w = lockedWorld();
    const b = w.addNpc('guard');
    const p = w.manager.walkNPCIn('guard', { from: 'dock' });
    await settle();
    assert.deepEqual(w.opened, []);
    assert.equal(b.moves.at(-1).opts.arrivalData.how, 'faded');
    b.arrive();
    assert.equal(await p, 'faded');
});

test('door-pass hook: true opens the locked door with passedByHook and the NPC walks in from the far room', async () => withWarns(async () => {
    const calls = [];
    setNpcDoorPassHook((info) => { calls.push(info); return true; });
    const w = lockedWorld();
    w.doorSprite.doorProperties.direction = 'east';
    const b = w.addNpc('guard');
    const p = w.manager.walkNPCIn('guard', { from: 'dock' });
    await settle();
    assert.deepEqual(calls, [{ roomId: 'hall', connectedRoom: 'dock', direction: 'east', npcId: 'guard' }]);
    assert.deepEqual(w.opened, ['guard']);
    assert.deepEqual(w.openedOpts, [{ passedByHook: true }]);
    assert.equal(b.roomId, 'dock', 'spawned in the far room');
    assert.equal(b.moves.at(-1).opts.arrivalData.how, 'walked');
    b.arrive({ x: 160, y: 160 });
    assert.equal(await p, 'walked');
}));

test('door-pass hook: a promise resolving true also passes (walk-out leaves through the locked door)', async () => withWarns(async () => {
    setNpcDoorPassHook(() => new Promise(r => setTimeout(() => r(true), 5)));
    const w = lockedWorld();
    const b = w.addNpc('guard', { visible: true });
    const p = w.manager.walkNPCOut('guard', { to: 'dock' });
    await new Promise(r => setTimeout(r, 20));
    await settle();
    assert.deepEqual(w.openedOpts, [{ passedByHook: true }]);
    assert.equal(w.manager.walks.get('guard').farRoom, 'dock');
    assert.equal(w.manager.walks.get('guard').how, 'walked');
    b.arrive({ x: 600, y: 160 });
    assert.equal(await p, 'walked');
}));

for (const [label, hook] of [
    ['throws', () => { throw new Error('boom'); }],
    ['rejects', () => Promise.reject(new Error('no'))],
    ['never settles', () => new Promise(() => {})],
    ['resolves a truthy non-true value', () => Promise.resolve('yes')],
    ['returns false', () => false]
]) {
    test(`door-pass hook that ${label} counts as false: today's doorway fade`, async () => withWarns(async () => {
        setNpcDoorPassHook(hook);
        const w = lockedWorld();
        const b = w.addNpc('guard');
        const p = w.manager.walkNPCIn('guard', { from: 'dock' });
        await new Promise(r => setTimeout(r, 80));   // past the 50 ms test timeout
        await settle();
        assert.deepEqual(w.opened, [], 'door not opened');
        assert.equal(b.sprite.body.center.x, 320, 'at the doorway mouth');
        assert.equal(b.moves.at(-1).opts.arrivalData.how, 'faded');
        b.arrive();
        assert.equal(await p, 'faded');
    }));
}

test('askDoorPassHook: a hook that never settles is false after the timeout', async () => withWarns(async (warns) => {
    setNpcDoorPassHook(() => new Promise(() => {}));
    const t0 = Date.now();
    assert.equal(await askDoorPassHook({ npcId: 'g' }, 40), false);
    assert.ok(Date.now() - t0 >= 35);
    assert.ok(warns.some(s => /no answer in 40 ms/.test(s)));
}));

test('door-pass hook: one at a time; a second registration replaces the first with a warning', async () => withWarns(async (warns) => {
    const a = () => false;
    const bHook = () => true;
    setNpcDoorPassHook(a);
    assert.equal(warns.length, 0);
    setNpcDoorPassHook(a);
    assert.equal(warns.length, 0, 'the same hook again does not warn');
    setNpcDoorPassHook(bHook);
    assert.equal(warns.length, 1);
    assert.match(warns[0], /replacing/);
    assert.equal(getNpcDoorPassHook(), bHook);
    assert.equal(await askDoorPassHook({}), true, 'the second hook answers');
    setNpcDoorPassHook(null);
    assert.equal(getNpcDoorPassHook(), null);
    assert.equal(warns.length, 1, 'clearing does not warn');
    setNpcDoorPassHook('nope');
    assert.equal(getNpcDoorPassHook(), null, 'a non-function is ignored');
}));

test('door-pass hook: never cached; each plan asks again and follows the new answer', async () => withWarns(async () => {
    let answer = false;
    let asked = 0;
    setNpcDoorPassHook(() => { asked++; return answer; });
    const w = lockedWorld();
    const b = w.addNpc('guard');
    const p1 = w.manager.walkNPCIn('guard', { from: 'dock' });
    await settle();
    assert.equal(asked, 1);
    b.arrive();
    assert.equal(await p1, 'faded', 'first plan: shut');
    // Out again (the hook is asked for the exit), then in again with the answer changed
    answer = true;
    const p2 = w.manager.walkNPCOut('guard', { to: 'dock' });
    await settle();
    assert.equal(asked, 2, 'asked again for the walk-out');
    assert.deepEqual(w.openedOpts, [{ passedByHook: true }]);
    b.arrive({ x: 600, y: 160 });
    await p2;
    answer = false;
    w.opened.length = 0;
    const p3 = w.manager.walkNPCIn('guard', { from: 'dock' });
    await settle();
    assert.equal(asked, 3, 'asked a third time');
    assert.deepEqual(w.opened, [], 'not opened on a no');
    assert.equal(b.moves.at(-1).opts.arrivalData.how, 'faded');
    b.arrive();
    assert.equal(await p3, 'faded');
}));

test('a usable door never asks the hook', async () => withWarns(async () => {
    let asked = 0;
    setNpcDoorPassHook(() => { asked++; return false; });
    const w = world();
    const b = w.addNpc('guard');
    const p = w.manager.walkNPCIn('guard', { from: 'dock' });
    await settle();
    assert.equal(asked, 0);
    b.arrive({ x: 160, y: 160 });
    assert.equal(await p, 'walked');
}));

// ── A walk-in through a shut gate gets an approach leg (E1 R1 M2) ───────────
// The lobby sprite's `locked` is the studio's lock, so doorClosed is false; without an approach
// leg the walk heads for a path that exists only once the gate opens, stalls and fades.
function gateStub({ openFor = ['guard'], spot = { x: 280, y: 160 } } = {}) {
    const calls = [];
    return {
        calls,
        isGate: (s) => !!s?.doorProperties?.gateKey,
        groups: new Map([['k', { cfg: { openFor } }]]),
        approachPoint(id, from, rooms) {
            calls.push({ id, from, rooms });
            return openFor.includes(id) ? spot : null;
        }
    };
}

test('M2: an openFor walker is routed to the approach spot of a shut gate first, then through', async () => withWarns(async () => {
    const gates = gateStub();
    const w = world({ locked: true, doorGates: gates });
    w.doorSprite.doorProperties.gateKey = 'k';
    const b = w.addNpc('guard');
    const p = w.manager.walkNPCIn('guard', { from: 'dock' });
    await settle();
    assert.equal(gates.calls.length >= 1, true, 'approachPoint asked');
    assert.ok(gates.calls[0].rooms.includes('dock'), 'the walker\'s room (the far room) is passed');
    const first = b.moves[0];
    assert.equal(Math.abs(first.x - 280) <= 8 && Math.abs(first.y - 160) <= 8, true, 'first leg is the approach spot');
    assert.equal(first.opts.silentArrival, true);
    assert.equal(b.moves.length, 1, 'the through leg waits for the approach');
    b.arrive({ x: 280, y: 160 });
    assert.equal(b.moves.length, 2);
    assert.equal(b.moves[1].opts.arrivalData.how, 'walked');
    b.arrive({ x: 160, y: 160 });
    assert.equal(await p, 'walked');
}));

test('M2: a walker not on openFor is not routed to the gate', async () => withWarns(async () => {
    const gates = gateStub({ openFor: ['someone_else'] });
    const w = world({ locked: true, doorGates: gates });
    w.doorSprite.doorProperties.gateKey = 'k';
    const b = w.addNpc('guard');
    w.manager.walkNPCIn('guard', { from: 'dock' });
    await settle();
    assert.equal(b.moves.every((m) => !(Math.abs(m.x - 280) <= 8 && Math.abs(m.y - 160) <= 8)), true);
}));
