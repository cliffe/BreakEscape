// The needs layer's two reads of the real behaviour classes (code review R4 m4): NPCBehavior
// goToAndStay reports where a requested nudge landed in _lastNudge (null when none ran), and the
// engine world's moveTo hands that back as { nudged }; playerBlocks reflects _playerBeside.
// The stub world in fixtures/needs-stub-world.mjs re-implements both, so these use the real code.
// Run with: node test/js/npc-needs-nudge-adapter.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis.window || {};
globalThis.window.seating = undefined;
globalThis.window.npcNeedsSystem = { onExternalMove() {} };
globalThis.window.eventDispatcher = { emit() {} };

const { NPCBehavior } = await import('../../public/break_escape/js/systems/npc-behavior.js');
const { createEngineWorld } = await import('../../public/break_escape/js/systems/npc-needs.js');

/** A behaviour on the real prototype, standing at (200, 200); the walkable cell is 24 px to the right. */
function behaviour() {
    const b = Object.create(NPCBehavior.prototype);
    b.npcId = 'tester';
    b.direction = 'down';
    b.config = { patrol: { waypoints: [], speed: 80, enabled: false, waypointIndex: 0, waypointMode: 'sequential' } };
    b.sprite = { x: 200, y: 200, body: { setVelocity() {}, reset(x, y) { b.sprite.x = x; b.sprite.y = y; } } };
    b.currentPath = [];
    b.pathIndex = 0;
    b.isMoving = false;
    b.playAnimation = () => {};
    b._clearPatrolPathDebug = () => {};
    b._dynamicBlockers = () => [];
    b.npcBodyPos = () => ({ x: b.sprite.x, y: b.sprite.y });
    b.pathfindingManager = { findNearestWalkableStartCell: (x, y) => ({ x: x + 24, y }) };
    return b;
}

function withWindow(extra, fn) {
    const saved = {};
    for (const k of Object.keys(extra)) { saved[k] = globalThis.window[k]; globalThis.window[k] = extra[k]; }
    try { return fn(); } finally { for (const [k, v] of Object.entries(saved)) globalThis.window[k] = v; }
}

test('R4 m4: goToAndStay sets _lastNudge when the nudge runs, null when it is refused', () => {
    const b = behaviour();
    window.player = undefined;
    b.goToAndStay(400, 400, 80, { owner: 'needs', reroute: true, nudge: true });
    assert.deepEqual(b._lastNudge, { x: 224, y: 200 }, 'the landing');
    assert.equal(b.sprite.x, 224, 'and the body moved there');

    const c = behaviour();
    window.player = { x: 210, y: 200 };   // the player beside it: _needsNudgeSafe refuses
    try {
        c.goToAndStay(400, 400, 80, { owner: 'needs', reroute: true, nudge: true });
        assert.equal(c._lastNudge, null, 'refused');
        assert.equal(c.sprite.x, 200, 'the body did not move');
    } finally { window.player = undefined; }

    b.goToAndStay(400, 400, 80, { owner: 'needs', reroute: true });
    assert.equal(b._lastNudge, null, 'a call that asked for no nudge clears the last one');
});

test('R4 m4: the engine world moveTo returns { nudged } from the behaviour, and null when not asked', () => {
    const b = behaviour();
    const mgr = { getBehavior: id => (id === 'tester' ? b : null), goToAndStay: (id, x, y, speed, opts) => b.goToAndStay(x, y, speed, opts) };
    withWindow({ npcBehaviorManager: mgr, player: undefined }, () => {
        const world = createEngineWorld();
        assert.deepEqual(world.moveTo('tester', 400, 400, 80, { reroute: true, nudge: true }), { nudged: { x: 224, y: 200 } });
        assert.deepEqual(world.moveTo('tester', 400, 400, 80, { reroute: true }), { nudged: null });
    });
});

test('R4 m4: the engine world playerBlocks follows the player-beside check', () => {
    const b = behaviour();
    const mgr = { getBehavior: id => (id === 'tester' ? b : null) };
    withWindow({ npcBehaviorManager: mgr }, () => {
        const world = createEngineWorld();
        window.player = { x: 240, y: 200 };
        assert.equal(world.playerBlocks('tester'), true, '40 px away');
        window.player = { x: 280, y: 200 };
        assert.equal(world.playerBlocks('tester'), false, '80 px away');
        assert.equal(world.playerBlocks('nobody'), false, 'no behaviour');
        window.player = undefined;
    });
});
