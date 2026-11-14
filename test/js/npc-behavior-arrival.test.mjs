// SIMS-2 (OLMP E6): the behaviour layer stamps a needs move with its id and echoes that id, plus
// the steps the path had left, in npc_arrived — so the needs system can ignore an arrival for a
// move it has superseded, and tell a short path end from a real arrival. cancelMove clears the id,
// so a cancelled move fires no arrival. Spec: docs/achitechture/OFFICE_LIFE_SIMS_BUILD_PLAN.md 5.2.
//
// npc-behavior.js imports a chain that assigns window.* at module top, so the window stub is set
// before a dynamic import of the module (static imports would evaluate the chain first).
import test from 'node:test';
import assert from 'node:assert/strict';

const emits = [];
globalThis.window = globalThis.window || {};
globalThis.window.seating = undefined;
globalThis.window.npcNeedsSystem = { onExternalMove() {} };
globalThis.window.eventDispatcher = { emit(name, data) { emits.push({ name, data }); } };

const { NPCBehavior } = await import('../../public/break_escape/js/systems/npc-behavior.js');

function stubBehavior() {
    const b = Object.create(NPCBehavior.prototype);
    b.npcId = 'tester';
    b.direction = 'down';
    b.config = { patrol: { waypoints: [], speed: 80, enabled: false, waypointIndex: 0, waypointMode: 'sequential' } };
    b.sprite = { body: { setVelocity() {} } };
    b.currentPath = [];
    b.pathIndex = 0;
    b.isMoving = false;
    b.playAnimation = () => {};
    b._clearPatrolPathDebug = () => {};
    b.npcBodyPos = () => ({ x: 200, y: 200 });
    return b;
}

test('SIMS-2: goToAndStay stamps the move id and _triggerGoToStayArrival echoes it once with pathLeft', () => {
    emits.length = 0;
    const b = stubBehavior();
    b.goToAndStay(300, 300, 80, { owner: 'needs', moveId: 42, arriveWithin: 6 });
    assert.equal(b._moveId, 42, 'the move id is stored');
    // Pretend two waypoints remain when the proximity guard fired (a short path end).
    b.currentPath = [{ x: 1, y: 1 }, { x: 2, y: 2 }];
    b.pathIndex = 1;
    b._triggerGoToStayArrival();
    const arr = emits.filter(e => e.name === 'npc_arrived:tester');
    assert.equal(arr.length, 1, 'exactly one arrival is emitted');
    assert.equal(arr[0].data.moveId, 42, 'the arrival echoes the move id');
    assert.equal(arr[0].data.pathLeft, 1, 'and the steps the path had left');
    assert.equal(arr[0].data.owner, 'needs', 'and the owner');
    assert.equal(b._moveId, null, 'the move id is cleared after the arrival');
});

test('SIMS-2: a path consumed to the end still carries pathLeft 0', () => {
    emits.length = 0;
    const b = stubBehavior();
    b.goToAndStay(300, 300, 80, { owner: 'needs', moveId: 7 });
    b.currentPath = [{ x: 1, y: 1 }];
    b.pathIndex = 1;   // fully consumed
    b._triggerGoToStayArrival();
    const arr = emits.find(e => e.name === 'npc_arrived:tester');
    assert.equal(arr.data.pathLeft, 0, 'pathLeft is 0 at a full path end');
    assert.equal(arr.data.moveId, 7);
});

test('SIMS-2: cancelMove clears the move id and emits no arrival', () => {
    emits.length = 0;
    const b = stubBehavior();
    b.goToAndStay(300, 300, 80, { owner: 'needs', moveId: 99 });
    assert.equal(b._moveId, 99);
    b.cancelMove();
    assert.equal(b._moveId, null, 'the move id is cleared');
    assert.equal(emits.filter(e => e.name === 'npc_arrived:tester').length, 0, 'a cancelled move fires no arrival');
});

test('SIMS-2: a move with no moveId echoes null (the transitional rule)', () => {
    emits.length = 0;
    const b = stubBehavior();
    b.goToAndStay(300, 300, 80, { owner: 'needs' });
    assert.equal(b._moveId, null, 'no id stored');
    b._triggerGoToStayArrival();
    const arr = emits.find(e => e.name === 'npc_arrived:tester');
    assert.equal(arr.data.moveId, null, 'the arrival echoes a null move id');
});
