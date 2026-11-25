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
