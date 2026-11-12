// Multi-room patrol routes (npc-behavior.js): a route-only NPC follows its route
// (no top-level waypoints), visits every waypoint of a room (the last one too),
// never teleports, backs off on an unreachable leg instead of skipping a room, never
// heads into an unloaded room, runs a waypoint's unlockRoom action (unlock + load,
// wait, then on), retries a failed action after 5 s, and defaults pauseForPlayer
// to false. Locked route rooms are not pre-loaded. A guard held at a shut gate
// turns back (turnBackFromGate) to his own room's loop and retries next cycle.
// Run with: node test/js/npc-route-multiroom.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'npc-route-multiroom-'));
writeFileSync(join(dir, 'constants-stub.mjs'), 'export const TILE_SIZE = 32;');
writeFileSync(join(dir, 'pathfinding-stub.mjs'), 'export class NPCPathfindingManager {}');
writeFileSync(join(dir, 'combat-config.mjs'), readFileSync(join(js, 'config/combat-config.js'), 'utf8'));
writeFileSync(join(dir, 'npc-chase-leash.mjs'), readFileSync(join(js, 'systems/npc-chase-leash.js'), 'utf8'));
writeFileSync(join(dir, 'fight-styles.mjs'), readFileSync(join(js, 'systems/fight-styles.js'), 'utf8'));
writeFileSync(join(dir, 'npc-behavior.mjs'), readFileSync(join(js, 'systems/npc-behavior.js'), 'utf8')
    .replace("'../utils/constants.js'", "'./constants-stub.mjs'")
    .replace("'./npc-pathfinding.js'", "'./pathfinding-stub.mjs'")
    .replace("'../config/combat-config.js'", "'./combat-config.mjs'")
    .replace("'./npc-chase-leash.js'", "'./npc-chase-leash.mjs'")
    .replace("'./fight-styles.js'", "'./fight-styles.mjs'"));

globalThis.window = { gameState: { globalVariables: {} } };
globalThis.performance = globalThis.performance || { now: () => Date.now() };
const quiet = console.log, warn = console.warn;
console.log = () => {};
const { default: behaviorModule, USE_HELD_GRACE_MS } = await import(pathToFileURL(join(dir, 'npc-behavior.mjs')).href);
console.log = quiet;
const { NPCBehavior } = behaviorModule;
const silently = async fn => { console.log = () => {}; console.warn = () => {}; try { return await fn(); } finally { console.log = quiet; console.warn = warn; } };
const flush = () => new Promise(r => setTimeout(r, 0));

const ROUTE = [
    { room: 'a', waypoints: [{ x: 2, y: 2 }, { x: 4, y: 1, action: { unlockRoom: 'b' } }] },
    { room: 'b', waypoints: [{ x: 4, y: 6 }, { x: 2, y: 4 }] }
];

function setup({ bLoaded = false, bLocked = true, pathOk = () => true } = {}) {
    const loads = [], unlocks = [], requests = [];
    window.gameScenario = { rooms: {
        a: { connections: { north: 'b' } },
        b: { connections: { south: 'a' }, locked: bLocked }
    } };
    window.rooms = { a: { position: { x: 0, y: 320 } } };
    if (bLoaded) window.rooms.b = { position: { x: 0, y: 0 } };
    window.loadRoom = async (id) => { loads.push(id); window.rooms[id] = { position: { x: 0, y: 0 } }; };
    window.NPCGameBridge = { unlockDoor: async (id, npc) => { unlocks.push([id, npc]); return { success: true }; } };
    window.npcManager = { npcs: new Map([['guard', { id: 'guard', roomId: 'a' }]]) };
    const b = Object.create(NPCBehavior.prototype);
    b.npcId = 'guard';
    b.roomId = 'a';
    b.homeRoomId = 'a';
    b._routeWait = null;
    b._pendingRouteAction = null;
    b._routeWallRooms = new Set();
    b.currentPath = [];
    b.pathIndex = 0;
    b.sprite = { x: 0, y: 0, body: { center: { x: 0, y: 0 }, setVelocity() {} } };
    b.npcBodyPos = () => ({ x: 10, y: 400 });
    b.playAnimation = () => {};
    b.pathfindingManager = {
        findNearestWalkableWorldCell: (x, y) => ({ x, y }),
        findNearestWalkableStartCell: (x, y) => ({ x, y }),
        findWorldPath: (sx, sy, ex, ey, cb) => { requests.push({ x: ex, y: ey }); cb(pathOk(ex, ey) ? [{ x: ex, y: ey }] : null); }
    };
    return { b, loads, unlocks, requests };
}

test('pauseForPlayer defaults to false for a route walker, true otherwise; explicit wins', async () => {
    const { b } = setup();
    let cfg = await silently(() => b.parseConfig({ patrol: { enabled: true, multiRoom: true, route: ROUTE } }));
    assert.equal(cfg.patrol.pauseForPlayer, false);
    cfg = await silently(() => b.parseConfig({ patrol: { enabled: true, multiRoom: true, route: ROUTE, pauseForPlayer: true } }));
    assert.equal(cfg.patrol.pauseForPlayer, true);
    b.validateWaypoints = () => {};
    cfg = await silently(() => b.parseConfig({ patrol: { waypoints: [{ x: 1, y: 1 }] } }));
    assert.equal(cfg.patrol.pauseForPlayer, true);
});

test('a locked route room is not pre-loaded; an unlocked one is', async () => {
    let s = setup({ bLocked: true });
    await silently(() => s.b.parseConfig({ patrol: { enabled: true, multiRoom: true, route: ROUTE } }));
    assert.deepEqual(s.loads, []);
    s = setup({ bLocked: false });
    await silently(() => s.b.parseConfig({ patrol: { enabled: true, multiRoom: true, route: ROUTE } }));
    assert.deepEqual(s.loads, ['b']);
});

test('route-only NPC walks every waypoint in order, runs the unlock action, then walks into the far room', async () => {
    const { b, loads, unlocks, requests } = setup();
    b.config = await silently(() => b.parseConfig({ patrol: { enabled: true, multiRoom: true, route: ROUTE } }));
    let relocated = 0;
    window.relocateNPCSprite = () => { relocated++; };
    const arrive = () => { b._pendingRouteAction = b.patrolTarget?.routeAction || null; b.currentPath = []; };

    await silently(() => b.chooseNewPatrolTarget(0));                  // a wp0
    assert.deepEqual(requests.at(-1), { x: 64, y: 384 });
    assert.equal(b.pathFollowingActive, true);
    arrive();
    await silently(() => b.chooseNewPatrolTarget(0));                  // a wp1 (the last of room a: not skipped)
    assert.deepEqual(requests.at(-1), { x: 128, y: 352 });
    arrive();
    assert.deepEqual(b._pendingRouteAction, { unlockRoom: 'b' });
    await silently(() => b.chooseNewPatrolTarget(0));                  // runs the action, waits
    assert.ok(b._routeWait);
    const before = requests.length;
    await silently(() => b.chooseNewPatrolTarget(0));                  // still waiting: no path request
    assert.equal(requests.length, before);
    await silently(async () => { await flush(); await new Promise(r => setTimeout(r, 350)); });
    assert.deepEqual(unlocks, [['b', 'guard']]);
    assert.deepEqual(loads, ['b']);
    assert.equal(b._routeWait, null);
    await silently(() => b.chooseNewPatrolTarget(0));                  // transition, b wp0
    assert.equal(b.config.patrol.currentSegmentIndex, 1);
    assert.deepEqual(requests.at(-1), { x: 128, y: 192 });
    arrive();
    await silently(() => b.chooseNewPatrolTarget(0));                  // b wp1
    arrive();
    await silently(() => b.chooseNewPatrolTarget(0));                  // back to a wp0
    assert.equal(b.config.patrol.currentSegmentIndex, 0);
    assert.deepEqual(requests.at(-1), { x: 64, y: 384 });
    assert.equal(relocated, 0, 'the hand-off never moves the sprite');
    // Second lap: the room is loaded, the action is only a pause (no network)
    arrive();
    await silently(() => b.chooseNewPatrolTarget(0));
    arrive();
    await silently(() => b.chooseNewPatrolTarget(0));
    assert.equal(b._routeWait, null);
    assert.deepEqual(unlocks, [['b', 'guard']]);
});

test('a refused unlock backs off 5 s and retries; the route never advances into the unloaded room', async () => {
    const { b, requests } = setup();
    let ok = false;
    window.NPCGameBridge = { unlockDoor: async () => ({ success: ok, error: 'denied' }) };
    b.config = await silently(() => b.parseConfig({ patrol: { enabled: true, multiRoom: true, route: ROUTE } }));
    b.config.patrol.waypointIndex = 2;
    b._pendingRouteAction = { unlockRoom: 'b' };
    let t = 1000;
    const realNow = performance.now;
    performance.now = () => t;
    try {
        await silently(() => b.chooseNewPatrolTarget(0));
        await silently(flush); await silently(flush);
        assert.ok(b._routeWait && !b._routeWait.inFlight);
        assert.equal(b._routeWait.retryAt, 6000);
        t = 3000;
        await silently(() => b.chooseNewPatrolTarget(0));
        assert.equal(b.config.patrol.currentSegmentIndex, 0);
        assert.equal(requests.length, 0);
        ok = true;
        t = 6001;
        await silently(() => b.chooseNewPatrolTarget(0));
        await silently(async () => { await flush(); await new Promise(r => setTimeout(r, 350)); });
        assert.equal(b._routeWait, null);
    } finally { performance.now = realNow; }
});

test('a refused unlock warns once per NPC and room, naming the fix, however many retries follow', async () => {
    const { b } = setup();
    window.NPCGameBridge = { unlockDoor: async () => ({ success: false, error: 'denied' }) };
    b.config = await silently(() => b.parseConfig({ patrol: { enabled: true, multiRoom: true, route: ROUTE } }));
    const warnings = [];
    const realWarn = console.warn;
    console.log = () => {};
    console.warn = (...a) => warnings.push(a.join(' '));
    try {
        for (let i = 0; i < 3; i++) {
            b._runRouteAction({ unlockRoom: 'b' }, 0);
            await flush(); await flush();
        }
    } finally { console.log = quiet; console.warn = realWarn; }
    const refusals = warnings.filter(w => w.includes('refused') && w.includes('unlockDoor'));
    assert.equal(refusals.length, 1);
    assert.match(refusals[0], /\[guard\]/);
    assert.match(refusals[0], /'b'/);
    assert.match(refusals[0], /add an eventMapping with unlockDoor/i);
    assert.equal(warnings.filter(w => w.includes('retrying in 5s')).length, 3, 'the retry behaviour is unchanged');
});

test('an unreachable leg backs off on the same waypoint instead of skipping a room', async () => {
    const { b, requests } = setup({ bLoaded: true, bLocked: false, pathOk: () => false });
    b.config = await silently(() => b.parseConfig({ patrol: { enabled: true, multiRoom: true, route: ROUTE } }));
    await silently(() => b.chooseNewPatrolTarget(0));
    assert.equal(requests.length, 1);
    assert.equal(b.config.patrol.currentSegmentIndex, 0);
    assert.equal(b.config.patrol.waypointIndex, 0);
    assert.ok(b._pathRetryAfter > 0);
    assert.equal(b._pathfindingInProgress, false);
});

test('a leg blocked by his own shut gate out of reach: he walks back to the gate, keeps the waypoint, then takes the leg', async () => {
    // Regression: lab_physical_pentest game 60. The player pushed the guard along the
    // wall, out of his gate's radius; the gate only opens when he is near, the leg
    // through it was unreachable from where he stood, and he retried it for good.
    let gateOpen = false;
    const { b, requests } = setup({ bLoaded: true, bLocked: false,
        pathOk: (x, y) => gateOpen || (x === 100 && y === 368) });
    const asked = [];
    window.doorGates = { approachPoint: (id, from, rooms) => {
        asked.push([id, rooms]);
        return gateOpen ? null : { x: 100, y: 368, roomId: 'a', connectedRoom: 'b' };
    } };
    b.config = await silently(() => b.parseConfig({ patrol: { enabled: true, multiRoom: true, route: ROUTE } }));
    b.config.patrol.currentSegmentIndex = 1;          // next waypoint is in room b, behind the gate
    b.config.patrol.waypointIndex = 0;
    await silently(() => b.chooseNewPatrolTarget(0));
    assert.deepEqual(asked, [['guard', ['b']]]);
    assert.deepEqual(requests, [{ x: 128, y: 192 }, { x: 100, y: 368 }], 'the leg, then the way back to the gate');
    assert.equal(b.patrolTarget.gateApproach, true);
    assert.deepEqual(b.currentPath, [{ x: 100, y: 368 }]);
    assert.equal(b.pathFollowingActive, true);
    assert.equal(b.config.patrol.waypointIndex, 0, 'the waypoint is not taken');
    assert.equal(b._pathRetryAfter, 0);
    // He arrives, the gate opens for him and tells him; the same waypoint is chosen again
    gateOpen = true;
    b._pathRetryAfter = 12345;
    b.gateOpened();
    assert.equal(b._pathRetryAfter, 0, 'gateOpened clears the retry back-off');
    await silently(() => b.chooseNewPatrolTarget(100));
    assert.deepEqual(requests.at(-1), { x: 128, y: 192 });
    assert.equal(b.config.patrol.waypointIndex, 1, 'the leg through the gate is taken now');
    assert.equal(b.patrolTarget.gateApproach, undefined);
    delete window.doorGates;
});

test('no gate to walk to, a gate he already stands at, or no path to it: back off as before', async () => {
    const run = async (approachPoint, pathOk = () => false) => {
        const { b, requests } = setup({ bLoaded: true, bLocked: false, pathOk });
        window.doorGates = { approachPoint };
        b.config = await silently(() => b.parseConfig({ patrol: { enabled: true, multiRoom: true, route: ROUTE } }));
        await silently(() => b.chooseNewPatrolTarget(0));
        delete window.doorGates;
        return { b, requests };
    };
    let r = await run(() => null);
    assert.equal(r.requests.length, 1);
    assert.ok(r.b._pathRetryAfter > 0);
    assert.equal(r.b.patrolTarget, null);
    // The spot is where he stands (npcBodyPos is (10, 400)): nothing to walk
    r = await run(() => ({ x: 12, y: 402 }));
    assert.equal(r.requests.length, 1);
    assert.ok(r.b._pathRetryAfter > 0);
    // A spot he cannot reach either
    r = await run(() => ({ x: 100, y: 368 }));
    assert.equal(r.requests.length, 2);
    assert.ok(r.b._pathRetryAfter > 0);
    assert.equal(r.b.patrolTarget, null);
    assert.equal(r.b._pathfindingInProgress, false);
});

test('a move that starts while the leg\'s answer is on its way keeps its target: no walk to the gate', async () => {
    // The leg's own callback did not check that the leg was still wanted. A goToAndStay begun
    // in the tick between the request and a "no path" answer had its target overwritten by the
    // walk to the gate, and then "arrived" at the gate for a destination it never reached.
    const { b } = setup({ bLoaded: true, bLocked: false });
    let release = null;
    b.pathfindingManager.findWorldPath = (sx, sy, ex, ey, cb) => { release = cb; };
    let asked = 0;
    window.doorGates = { approachPoint: () => { asked++; return { x: 100, y: 368, roomId: 'a', connectedRoom: 'b' }; } };
    b.config = await silently(() => b.parseConfig({ patrol: { enabled: true, multiRoom: true, route: ROUTE } }));
    b.config.patrol.currentSegmentIndex = 1;
    b.config.patrol.waypointIndex = 0;
    await silently(() => b.chooseNewPatrolTarget(0));
    assert.equal(typeof release, 'function', 'the leg request is in flight');
    const moveTarget = { x: 500, y: 500, dwellTime: 0 };   // what a goToAndStay sets
    b.patrolTarget = moveTarget;
    await silently(() => release(null));
    assert.equal(asked, 0, 'the gate is not asked for');
    assert.equal(b.patrolTarget, moveTarget, 'the move keeps its target');
    delete window.doorGates;
});

test('a late answer that is a path is dropped too: the move keeps its own path and waypoint', async () => {
    // The same race with a path found for the old leg. Taking it would walk the old leg on
    // top of the move and step the waypoint index past the move's single destination.
    const { b } = setup({ bLoaded: true, bLocked: false });
    let release = null;
    b.pathfindingManager.findWorldPath = (sx, sy, ex, ey, cb) => { release = cb; };
    b.config = await silently(() => b.parseConfig({ patrol: { enabled: true, multiRoom: true, route: ROUTE } }));
    b.config.patrol.currentSegmentIndex = 1;
    b.config.patrol.waypointIndex = 0;
    await silently(() => b.chooseNewPatrolTarget(0));
    assert.equal(typeof release, 'function', 'the leg request is in flight');
    const moveTarget = { x: 500, y: 500, dwellTime: 0 };   // what a goToAndStay sets
    b.patrolTarget = moveTarget;
    b.currentPath = [];
    b.pathFollowingActive = false;
    const index = b.config.patrol.waypointIndex;
    await silently(() => release([{ x: 1, y: 1 }]));
    assert.deepEqual(b.currentPath, [], 'the old leg is not walked');
    assert.equal(b.pathFollowingActive, false);
    assert.equal(b.config.patrol.waypointIndex, index, 'the waypoint index is not stepped');
    assert.equal(b.patrolTarget, moveTarget, 'the move keeps its target');
    assert.equal(b._pathfindingInProgress, false, 'the request is still marked as answered');
});

// The same late-answer race on the two older patrol kinds: a single-room waypoint patrol
// and a random patrol. A move that takes the target meanwhile keeps it, its path and its
// following state, whether the old answer is a path or none.
for (const kind of ['single-room waypoint', 'random']) {
    test(`a late answer on a ${kind} patrol is dropped: the move keeps its target and path`, async () => {
        const { b } = setup();
        let release = null;
        b.pathfindingManager.findWorldPath = (sx, sy, ex, ey, cb) => { release = cb; };
        b.pathfindingManager.getRandomPatrolTarget = () => ({ x: 64, y: 400 });
        const patrol = kind === 'random'
            ? { enabled: true }
            : { enabled: true, waypoints: [{ x: 2, y: 2 }, { x: 4, y: 1 }] };
        b.config = await silently(() => b.parseConfig({ patrol }));
        for (const answer of [[{ x: 1, y: 1 }], null]) {
            release = null;
            await silently(() => (kind === 'random' ? b.chooseRandomPatrolTarget(0) : b.chooseWaypointTarget(0)));
            assert.equal(typeof release, 'function', 'the request is in flight');
            const moveTarget = { x: 500, y: 500, dwellTime: 0 };   // what a goToAndStay sets
            const movePath = [{ x: 500, y: 500 }];
            b.patrolTarget = moveTarget;
            b.currentPath = movePath;
            b.pathFollowingActive = true;
            b._pathRetryAfter = 0;
            await silently(() => release(answer));
            assert.equal(b.currentPath, movePath, `the move's path is kept (answer ${answer ? 'a path' : 'none'})`);
            assert.equal(b.pathFollowingActive, true);
            assert.equal(b.patrolTarget, moveTarget, 'the move keeps its target');
            assert.equal(b._pathRetryAfter, 0, 'no back-off from an answer for an old target');
            if (kind !== 'random') assert.equal(b._pathfindingInProgress, false, 'the request is still marked as answered');
        }
    });
}

test('a single-room waypoint patrol still takes its own answer', async () => {
    const { b } = setup();
    b.config = await silently(() => b.parseConfig({ patrol: { enabled: true, waypoints: [{ x: 2, y: 2 }, { x: 4, y: 1 }] } }));
    await silently(() => b.chooseWaypointTarget(0));
    assert.ok(b.currentPath.length > 0, 'the path is taken');
    assert.equal(b.pathFollowingActive, true);
});

test('with the real gate system: kept out at his reader he waits; pushed out of the radius he walks back', async () => {
    // The two halves (approachPoint and _approachRouteGate) run together here. Each was
    // tested against a stand-in for the other, which is how a guard standing inside his
    // gate's radius came to be sent to the door front.
    const { DoorGates } = await import('data:text/javascript;base64,' + Buffer.from(readFileSync(join(js, 'systems/door-gates.js'), 'utf8')).toString('base64'));
    const run = async (feet) => {
        const { b, requests } = setup({ bLoaded: true, bLocked: false,
            pathOk: (x, y) => x === 100 && y === 368 });         // only the door front can be reached
        b.npcBodyPos = () => feet;
        const gates = new DoorGates();
        gates.register({ x: 100, y: 320, active: true, body: { enable: true },
            doorProperties: { roomId: 'a', connectedRoom: 'b', direction: 'north', worldX: 100, worldY: 320, open: false } },
            { openFor: ['guard'], openRadius: 72, holdMs: 2500, playerMayPassIf: 'disguised' });
        window.doorGates = gates;
        b.config = await silently(() => b.parseConfig({ patrol: { enabled: true, multiRoom: true, route: ROUTE } }));
        b.config.patrol.currentSegmentIndex = 1;
        b.config.patrol.waypointIndex = 0;
        await silently(() => b.chooseNewPatrolTarget(0));
        delete window.doorGates;
        return { b, requests };
    };
    // 62 px from the door, at his reader: inside the radius, so he backs off and waits there
    let r = await run({ x: 100, y: 382 });
    assert.equal(r.requests.length, 1, 'only the leg was asked for');
    assert.equal(r.b.patrolTarget, null);
    assert.ok(r.b._pathRetryAfter > 0);
    // Pushed 170 px along the wall: out of reach, so he walks to the door front on his side
    r = await run({ x: 270, y: 382 });
    assert.deepEqual(r.requests.at(-1), { x: 100, y: 368 });
    assert.equal(r.b.patrolTarget.gateApproach, true);
    assert.equal(r.b.pathFollowingActive, true);
});

test('transition into an unloaded room waits', async () => {
    const { b } = setup({ bLoaded: false });
    b.config = await silently(() => b.parseConfig({ patrol: { enabled: true, multiRoom: true, route: ROUTE } }));
    b.config.patrol.waypointIndex = 2;
    await silently(() => b.transitionToNextRoom(0));
    assert.equal(b.config.patrol.currentSegmentIndex, 0);
    assert.ok(b._pathRetryAfter > 0);
});

// ── route action useObject ──────────────────────────────────────────────────

const READER_ROUTE = [
    { room: 'a', waypoints: [{ x: 2, y: 2 }, { x: 4, y: 1, action: { useObject: 'reader' } }, { x: 5, y: 5 }] },
    { room: 'b', waypoints: [{ x: 4, y: 6 }] }
];

test('useObject: the NPC faces the named object, makes no network call, and the route carries on', async () => {
    const { b, loads, unlocks, requests } = setup({ bLoaded: true, bLocked: false });
    const faced = [];
    b.faceWorldPoint = (x, y) => faced.push([x, y]);
    window.rooms.a.objects = { reader: { x: 300, y: 200 } };
    b.config = await silently(() => b.parseConfig({ patrol: { enabled: true, multiRoom: true, route: READER_ROUTE } }));
    loads.length = 0;
    const arrive = () => { b._pendingRouteAction = b.patrolTarget?.routeAction || null; b.currentPath = []; };
    await silently(() => b.chooseNewPatrolTarget(0));                  // wp0
    arrive();
    await silently(() => b.chooseNewPatrolTarget(0));                  // wp1: carries the action
    assert.deepEqual(requests.at(-1), { x: 128, y: 352 });
    arrive();
    assert.deepEqual(b._pendingRouteAction, { useObject: 'reader' });
    await silently(() => b.chooseNewPatrolTarget(0));                  // runs the action
    assert.deepEqual(faced, [[300, 200]]);
    assert.equal(b._pendingRouteAction, null);
    assert.equal(b._routeWait, null);
    assert.deepEqual(unlocks, []);
    assert.deepEqual(loads, []);
    const before = requests.length;
    await silently(() => b.chooseNewPatrolTarget(0));                  // on to wp2
    assert.equal(requests.length, before + 1);
    assert.deepEqual(requests.at(-1), { x: 160, y: 480 });
});

test('useObject finds an object by its scenario id in any loaded room, and survives an unknown id', async () => {
    const { b } = setup({ bLoaded: true, bLocked: false });
    const faced = [];
    b.faceWorldPoint = (x, y) => faced.push([x, y]);
    window.rooms.b.objects = { sprite_17: { x: 70, y: 80, scenarioData: { id: 'reader' } } };
    b._pendingRouteAction = { useObject: 'reader' };
    b.config = { patrol: { route: READER_ROUTE, currentSegmentIndex: 0, waypointIndex: 0 } };
    b._runRouteAction({ useObject: 'reader' }, 0);
    assert.deepEqual(faced, [[70, 80]]);
    assert.equal(b._pendingRouteAction, null);
    faced.length = 0;
    b._pendingRouteAction = { useObject: 'no_such_object' };
    assert.doesNotThrow(() => b._runRouteAction({ useObject: 'no_such_object' }, 0));
    assert.deepEqual(faced, []);
    assert.equal(b._pendingRouteAction, null);
    assert.equal(b._routeWait, null);
});

test('useObject together with unlockRoom on an already loaded room: faces, no unlock, no wait', async () => {
    const { b, loads, unlocks } = setup({ bLoaded: true, bLocked: true });
    const faced = [];
    b.faceWorldPoint = (x, y) => faced.push([x, y]);
    window.rooms.a.objects = { reader: { x: 5, y: 6 } };
    b._pendingRouteAction = { unlockRoom: 'b', useObject: 'reader' };
    b._runRouteAction(b._pendingRouteAction, 0);
    assert.deepEqual(faced, [[5, 6]]);
    assert.deepEqual(unlocks, []);
    assert.deepEqual(loads, []);
    assert.equal(b._routeWait, null);
    assert.equal(b._pendingRouteAction, null);
});

test('turnBackFromGate: a guard held at a shut gate resumes his own room\'s loop, then retries the crossing next cycle', async () => {
    const GATE = { roomId: 'a', connectedRoom: 'b', direction: 'north', x: 112, y: 320 };
    let failB = true;
    const { b, requests } = setup({ bLoaded: true, bLocked: false, pathOk: (x, y) => !(failB && y < 320) });
    b.config = await silently(() => b.parseConfig({ patrol: { enabled: true, multiRoom: true, route: ROUTE } }));
    let faced = 0;
    b.facePlayer = () => { faced++; };
    window.player = { x: 120, y: 360 };
    const arrive = () => { b._pendingRouteAction = b.patrolTarget?.routeAction || null; b.currentPath = []; };
    assert.equal(b.wantsToCrossGate(GATE), false, 'in his own room\'s segment: not crossing');
    await silently(() => b.chooseNewPatrolTarget(0)); arrive();      // a wp0
    await silently(() => b.chooseNewPatrolTarget(0)); arrive();      // a wp1 (action: b loaded, a pause)
    assert.equal(b.wantsToCrossGate(GATE), false, 'at the door, dwelling/acting: not yet');
    await silently(() => b.chooseNewPatrolTarget(0));                // action
    await silently(() => b.chooseNewPatrolTarget(0));                // transition to b: the leg fails (gate shut)
    assert.equal(b.config.patrol.currentSegmentIndex, 1);
    assert.equal(b.patrolTarget, null);
    assert.equal(b.wantsToCrossGate(GATE), true);
    assert.equal(b.wantsToCrossGate({ roomId: 'x', connectedRoom: 'b' }), false, 'another gate');
    // Before the fix he retried this leg every 2 s for ever; now he turns back
    assert.equal(await silently(() => b.turnBackFromGate(GATE)), true);
    assert.equal(b.config.patrol.currentSegmentIndex, 0);
    assert.equal(b.config.patrol.waypointIndex, 0);
    assert.equal(faced, 1, 'glances at the player');
    assert.ok(b._pathRetryAfter > 0, 'a beat before he walks off');
    assert.equal(b.wantsToCrossGate(GATE), false);
    assert.equal(await silently(() => b.turnBackFromGate(GATE)), false, 'only once');
    const n = requests.length;
    await silently(() => b.chooseNewPatrolTarget(0)); arrive();      // resumes: a wp0
    assert.deepEqual(requests[n], { x: 64, y: 384 });
    await silently(() => b.chooseNewPatrolTarget(0)); arrive();      // a wp1
    await silently(() => b.chooseNewPatrolTarget(0));                // action
    failB = false;                                                   // the player has gone: gate opens
    await silently(() => b.chooseNewPatrolTarget(0));                // next cycle: crosses into b
    assert.equal(b.config.patrol.currentSegmentIndex, 1);
    assert.deepEqual(requests.at(-1), { x: 128, y: 192 });
    assert.ok(b.currentPath.length > 0, 'walking into b');
});

test('turnBackFromGate from the far side: a guard in b held on his way back resumes b\'s loop', async () => {
    const GATE = { roomId: 'a', connectedRoom: 'b' };
    const { b } = setup({ bLoaded: true, bLocked: false });
    b.config = await silently(() => b.parseConfig({ patrol: { enabled: true, multiRoom: true, route: ROUTE } }));
    b.facePlayer = () => {};
    b.roomId = 'b';
    b.config.patrol.currentSegmentIndex = 0;                         // heading back to a
    b.config.patrol.waypointIndex = 0;
    assert.equal(b.wantsToCrossGate(GATE), true);
    assert.equal(await silently(() => b.turnBackFromGate(GATE)), true);
    assert.equal(b.config.patrol.currentSegmentIndex, 1);
    assert.equal(b.config.patrol.waypointIndex, 0);
    b.config.patrol.enabled = false;
    b.config.patrol.currentSegmentIndex = 0;
    assert.equal(b.wantsToCrossGate(GATE), false, 'patrol off: never');
});

// test_access_habits H9: a chair stood on Sara's unlockRoom waypoint. She stopped short,
// the stall re-target (changeDirectionInterval with no progress) chose again, the waypoint
// was already taken, so the action was skipped and she waited at the unloaded room for good.
async function cutShortAtActionLeg(feet) {
    const s = setup();
    s.b.config = await silently(() => s.b.parseConfig({ patrol: { enabled: true, multiRoom: true, route: ROUTE } }));
    s.b.config.patrol.waypointIndex = 1;
    await silently(() => s.b.chooseNewPatrolTarget(0));              // takes the action leg to (128, 352)
    assert.equal(s.b.config.patrol.waypointIndex, 2, 'the leg is taken');
    s.b.currentPath = [{ x: 100, y: 352 }, { x: 128, y: 352 }];      // part way along it
    s.b.pathIndex = 1;
    s.b.npcBodyPos = () => feet;
    return s;
}

test('an action leg cut short beside its spot counts as the arrival: the unlock runs', async () => {
    const { b, unlocks, loads } = await cutShortAtActionLeg({ x: 106, y: 352 });   // 22 px short
    await silently(() => b.chooseNewPatrolTarget(1000));             // the stall re-target
    assert.deepEqual(b._pendingRouteAction, { unlockRoom: 'b' });
    assert.equal(b.config.patrol.waypointIndex, 2);
    await silently(() => b.chooseNewPatrolTarget(1100));             // next choice runs it
    await flush(); await flush();
    assert.deepEqual(unlocks, [['b', 'guard']]);
    assert.ok(loads.includes('b'));
});

test('an action leg cut short far from its spot is walked again, not skipped', async () => {
    const { b, unlocks, requests } = await cutShortAtActionLeg({ x: 10, y: 400 });
    const before = requests.length;
    await silently(() => b.chooseNewPatrolTarget(1000));
    assert.deepEqual(unlocks, []);
    assert.deepEqual(requests.at(-1), { x: 128, y: 352 }, 'the same leg is asked for again');
    assert.equal(requests.length, before + 1);
    assert.equal(b.config.patrol.waypointIndex, 2, 'taken again by the new path');
    assert.deepEqual(b.patrolTarget.routeAction, { unlockRoom: 'b' });
});

test('a cut-short action leg idles the walk animation when it stops the NPC (review R1 nit 1)', async () => {
    const { b } = await cutShortAtActionLeg({ x: 106, y: 352 });
    const anims = [];
    b.playAnimation = (name) => anims.push(name);
    b.isMoving = true;
    await silently(() => b.chooseNewPatrolTarget(1000));
    assert.equal(b.isMoving, false);
    assert.equal(anims[0], 'idle');
});

test('once its room is loaded, a cut-short action leg is skipped as before', async () => {
    const { b, unlocks, requests } = await cutShortAtActionLeg({ x: 106, y: 352 });
    window.rooms.b = { position: { x: 0, y: 0 } };
    await silently(() => b.chooseNewPatrolTarget(1000));
    assert.equal(b._pendingRouteAction, null);
    assert.deepEqual(unlocks, []);
    assert.equal(b.roomId, 'a');
    assert.ok(requests.length >= 2);
});

// q53 (e): a keying event at a reader. useObject emits npc_used_object:<id> on arrival; with
// useMs the NPC stands there that long, then npc_used_object_done:<id>, then the action goes on.
function captureEvents() {
    const events = [];
    window.eventDispatcher = { emit: (type, data) => events.push([type, data]) };
    return events;
}

test('useObject emits npc_used_object and npc_used_object_done at once when there is no useMs', async () => {
    const { b } = setup({ bLoaded: true, bLocked: false });
    const events = captureEvents();
    b.faceWorldPoint = () => {};
    b._pendingRouteAction = { useObject: 'reader' };
    b._runRouteAction(b._pendingRouteAction, 0);
    assert.deepEqual(events.map(e => e[0]), ['npc_used_object:reader', 'npc_used_object_done:reader']);
    assert.deepEqual(events[0][1], { npcId: 'guard', objectId: 'reader', roomId: 'a', useMs: 0 });
    assert.equal(b._pendingRouteAction, null);
    delete window.eventDispatcher;
});

test('useObject with useMs holds the NPC for that long, then says done and runs the unlock once', async () => {
    const { b, unlocks, loads, requests } = setup({ bLocked: true });
    const events = captureEvents();
    let now = 1000;
    b.clockNow = () => now;
    b.faceWorldPoint = () => {};
    let halts = 0;
    b._haltForRoute = () => { halts++; };
    const KEY_ROUTE = [
        { room: 'a', waypoints: [{ x: 4, y: 1, action: { unlockRoom: 'b', useObject: 'reader', useMs: 2500 } }] },
        { room: 'b', waypoints: [{ x: 4, y: 6 }] }
    ];
    b.config = await silently(() => b.parseConfig({ patrol: { enabled: true, multiRoom: true, route: KEY_ROUTE } }));
    await silently(() => b.chooseNewPatrolTarget(0));                  // the reader leg
    b._pendingRouteAction = b.patrolTarget.routeAction; b._routeUse = null; b.currentPath = [];
    await silently(() => b.chooseNewPatrolTarget(0));                  // arrival: keying starts
    assert.deepEqual(events.map(e => e[0]), ['npc_used_object:reader']);
    assert.equal(events[0][1].useMs, 2500);
    assert.deepEqual(unlocks, [], 'no unlock while he keys');
    const before = requests.length;
    now = 3000;
    await silently(() => b.chooseNewPatrolTarget(0));                  // still keying
    assert.equal(requests.length, before, 'no new leg while keying');
    assert.equal(events.length, 1);
    assert.ok(halts >= 1);
    now = 3600;
    await silently(() => b.chooseNewPatrolTarget(0));                  // keyed: done, then the unlock
    assert.deepEqual(events.map(e => e[0]), ['npc_used_object:reader', 'npc_used_object_done:reader']);
    await silently(async () => { await flush(); await new Promise(r => setTimeout(r, 350)); });
    assert.deepEqual(unlocks, [['b', 'guard']]);
    assert.ok(loads.includes('b'));
    assert.equal(b._pendingRouteAction, null);
    assert.equal(b._routeUse, null);
    assert.equal(events.length, 2, 'the unlock does not repeat the keying events');
    delete window.eventDispatcher;
});

test('a timed useObject is emitted again on the next arrival, and a retried unlock does not repeat it', async () => {
    const { b } = setup({ bLocked: true });
    const events = captureEvents();
    let now = 0;
    b.clockNow = () => now;
    b.faceWorldPoint = () => {};
    let refuse = true;
    window.NPCGameBridge = { unlockDoor: async () => ({ success: !refuse }) };
    const action = { unlockRoom: 'b', useObject: 'reader', useMs: 1000 };
    b.config = { patrol: { route: [{ room: 'a', waypoints: [{ x: 1, y: 1, action }] }, { room: 'b', waypoints: [{ x: 1, y: 1 }] }], currentSegmentIndex: 0, waypointIndex: 1 } };
    b._pendingRouteAction = action; b._routeUse = null;
    await silently(() => b.chooseWaypointTargetMultiRoom(0));
    now = 1500;
    await silently(() => b.chooseWaypointTargetMultiRoom(0));          // done, unlock refused
    await silently(async () => { await flush(); await flush(); });
    assert.ok(b._routeWait && !b._routeWait.inFlight, 'backing off after the refusal');
    now = 7000; refuse = false;
    await silently(() => b.chooseWaypointTargetMultiRoom(0));          // the retry
    await silently(async () => { await flush(); await new Promise(r => setTimeout(r, 350)); });
    assert.deepEqual(events.map(e => e[0]), ['npc_used_object:reader', 'npc_used_object_done:reader']);
    // Next lap: a fresh arrival at the same waypoint keys again
    b._pendingRouteAction = action; b._routeUse = null;
    await silently(() => b.chooseWaypointTargetMultiRoom(0));
    assert.equal(events.filter(e => e[0] === 'npc_used_object:reader').length, 2);
    delete window.eventDispatcher;
});

test('a timed useObject leg cut short beside its spot counts as the arrival (the keying is work)', async () => {
    const s = setup({ bLoaded: true, bLocked: false });
    const events = captureEvents();
    s.b.faceWorldPoint = () => {};
    const route = [{ room: 'a', waypoints: [{ x: 2, y: 2 }, { x: 4, y: 1, action: { useObject: 'reader', useMs: 2000 } }] }, { room: 'b', waypoints: [{ x: 4, y: 6 }] }];
    s.b.config = await silently(() => s.b.parseConfig({ patrol: { enabled: true, multiRoom: true, route } }));
    s.b.config.patrol.waypointIndex = 1;
    await silently(() => s.b.chooseNewPatrolTarget(0));
    s.b.currentPath = [{ x: 100, y: 352 }, { x: 128, y: 352 }];
    s.b.pathIndex = 1;
    s.b.npcBodyPos = () => ({ x: 106, y: 352 });
    await silently(() => s.b.chooseNewPatrolTarget(1000));
    assert.deepEqual(s.b._pendingRouteAction, { useObject: 'reader', useMs: 2000 });
    await silently(() => s.b.chooseNewPatrolTarget(1100));
    assert.deepEqual(events.map(e => e[0]), ['npc_used_object:reader']);
    delete window.eventDispatcher;
});

// Code review R2 (m4): at the reader, with the next leg across a gate held shut against him
// (door-gates heldShutAgainst), the guard turns back before keying: no npc_used_object, the
// turned-back event with beforeUse, and his own room's loop again. Not held: he keys as before.
test('a timed useObject before a gate held shut: he turns back without keying', async () => {
    const { b, unlocks } = setup({ bLoaded: true, bLocked: false });
    const events = captureEvents();
    let clock = 1000;
    b.clockNow = () => clock;
    b.faceWorldPoint = () => {};
    let faced = 0;
    b.facePlayer = () => { faced++; };
    window.player = { x: 120, y: 360 };
    const asked = [];
    let held = true;
    window.doorGates = { heldShutAgainst: (id, from, to) => { asked.push([id, from, to]); return held ? { roomId: 'a', connectedRoom: 'b', direction: 'north', x: 64, y: 32 } : null; } };
    const KEY_ROUTE = [
        { room: 'a', waypoints: [{ x: 2, y: 2 }, { x: 4, y: 1, action: { unlockRoom: 'b', useObject: 'reader', useMs: 2500 } }] },
        { room: 'b', waypoints: [{ x: 4, y: 6 }] }
    ];
    b.config = await silently(() => b.parseConfig({ patrol: { enabled: true, multiRoom: true, route: KEY_ROUTE } }));
    b.config.patrol.waypointIndex = 1;
    await silently(() => b.chooseNewPatrolTarget(0));                  // the reader leg
    b._pendingRouteAction = b.patrolTarget.routeAction; b._routeUse = null; b.currentPath = [];
    await silently(() => b.chooseNewPatrolTarget(0));                  // arrival, gate held
    assert.deepEqual(asked, [['guard', 'a', 'b']]);
    // Code review R3 (m1): he waits at the reader for the grace before giving up
    assert.deepEqual(events, [], 'waiting: no keying, no turn-back yet');
    for (const t of [1050, 1500, 2000, 1000 + USE_HELD_GRACE_MS - 1]) {
        clock = t;
        await silently(() => b.chooseNewPatrolTarget(0));
    }
    assert.deepEqual(events, [], 'still waiting just inside the grace');
    assert.equal(b.config.patrol.currentSegmentIndex, 0);
    assert.equal(b.config.patrol.waypointIndex, 2, 'still at the reader stop');
    clock = 1000 + USE_HELD_GRACE_MS;
    await silently(() => b.chooseNewPatrolTarget(0));                  // grace over, still held
    assert.deepEqual(events.map(e => e[0]), ['door_gate_guard_turned_back'], 'no keying events');
    assert.deepEqual(events[0][1], { roomId: 'a', connectedRoom: 'b', direction: 'north', x: 64, y: 32, npcId: 'guard', beforeUse: true });
    assert.equal(b.config.patrol.currentSegmentIndex, 0);
    assert.equal(b.config.patrol.waypointIndex, 0, 'back to his own room\'s loop');
    assert.equal(b._pendingRouteAction, null);
    assert.equal(faced, 1);
    assert.deepEqual(unlocks, []);
    // Next lap, not held: he keys as before
    held = false; events.length = 0;
    b.config.patrol.waypointIndex = 1;
    await silently(() => b.chooseNewPatrolTarget(0));
    b._pendingRouteAction = b.patrolTarget.routeAction; b._routeUse = null; b.currentPath = [];
    await silently(() => b.chooseNewPatrolTarget(0));
    assert.deepEqual(events.map(e => e[0]), ['npc_used_object:reader']);
    delete window.doorGates;
    delete window.eventDispatcher;
});

test('a timed useObject that is not the last stop before the gate never asks the gate', async () => {
    const { b } = setup({ bLoaded: true, bLocked: false });
    const events = captureEvents();
    b.clockNow = () => 1000;
    b.faceWorldPoint = () => {};
    let asked = 0;
    window.doorGates = { heldShutAgainst: () => { asked++; return { roomId: 'a', connectedRoom: 'b' }; } };
    const action = { useObject: 'reader', useMs: 2000 };
    b.config = await silently(() => b.parseConfig({ patrol: { enabled: true, multiRoom: true, route: [
        { room: 'a', waypoints: [{ x: 4, y: 1, action }, { x: 2, y: 2 }] }, { room: 'b', waypoints: [{ x: 4, y: 6 }] }] } }));
    b._pendingRouteAction = action; b._routeUse = null;
    await silently(() => b.chooseWaypointTargetMultiRoom(0));
    assert.equal(asked, 0);
    assert.deepEqual(events.map(e => e[0]), ['npc_used_object:reader']);
    delete window.doorGates;
    delete window.eventDispatcher;
});

// Code review R3 (m1): a player inside the radius just as he reaches the reader, who then
// steps away within the grace, does not cost him the lap: he keys as normal.
test('a timed useObject before a gate held only for a moment: he waits, then keys', async () => {
    const { b } = setup({ bLoaded: true, bLocked: false });
    const events = captureEvents();
    let clock = 1000;
    b.clockNow = () => clock;
    b.faceWorldPoint = () => {};
    b.facePlayer = () => {};
    window.player = { x: 120, y: 360 };
    let held = true;
    const cleared = [];
    window.doorGates = {
        heldShutAgainst: () => (held ? { roomId: 'a', connectedRoom: 'b', direction: 'north', x: 64, y: 32 } : null),
        clearTurnedBack: id => cleared.push(id)
    };
    b.config = await silently(() => b.parseConfig({ patrol: { enabled: true, multiRoom: true, route: [
        { room: 'a', waypoints: [{ x: 2, y: 2 }, { x: 4, y: 1, action: { unlockRoom: 'b', useObject: 'reader', useMs: 2500 } }] },
        { room: 'b', waypoints: [{ x: 4, y: 6 }] }] } }));
    b.config.patrol.waypointIndex = 1;
    await silently(() => b.chooseNewPatrolTarget(0));                  // the reader leg
    b._pendingRouteAction = b.patrolTarget.routeAction; b._routeUse = null; b.currentPath = [];
    await silently(() => b.chooseNewPatrolTarget(0));                  // arrival, gate held
    clock = 1800;
    await silently(() => b.chooseNewPatrolTarget(0));
    assert.deepEqual(events, [], 'waiting');
    held = false; clock = 1900;                                        // the player steps away
    await silently(() => b.chooseNewPatrolTarget(0));
    assert.deepEqual(events.map(e => e[0]), ['npc_used_object:reader'], 'he keys, no turn-back');
    assert.deepEqual(cleared, ['guard'], 'his gate may open for him again');
    assert.equal(b._useHeld, null);
    // A later lap starts a fresh grace, not the old one
    clock = 60000; held = true; events.length = 0;
    b._routeUse = null; b._pendingRouteAction = b.config.patrol.route[0].waypoints[1].action;
    b.config.patrol.currentSegmentIndex = 0;
    await silently(() => b.chooseNewPatrolTarget(0));
    assert.deepEqual(events, [], 'a new arrival waits again');
    delete window.doorGates;
    delete window.eventDispatcher;
});

// Code review R3 (n2): a route of three segments. Turning back at the reader before the
// gate resumes at the next segment in his own room, not the first.
test('turning back before keying on a three-segment route resumes at the next segment on his side', async () => {
    const { b } = setup({ bLoaded: true, bLocked: false });
    const events = captureEvents();
    let clock = 1000;
    b.clockNow = () => clock;
    b.faceWorldPoint = () => {};
    b.facePlayer = () => {};
    window.player = { x: 120, y: 360 };
    window.doorGates = { heldShutAgainst: () => ({ roomId: 'a', connectedRoom: 'b', direction: 'north', x: 64, y: 32 }) };
    // c (west of a) -> a, reader -> b -> a -> c: a appears twice, with the far room between
    window.gameScenario.rooms.a.connections = { north: 'b', west: 'c' };
    window.gameScenario.rooms.c = { connections: { east: 'a' } };
    window.rooms.c = { position: { x: -320, y: 320 } };
    b.config = await silently(() => b.parseConfig({ patrol: { enabled: true, multiRoom: true, route: [
        { room: 'c', waypoints: [{ x: 2, y: 2 }] },
        { room: 'a', waypoints: [{ x: 3, y: 3 }, { x: 4, y: 1, action: { unlockRoom: 'b', useObject: 'reader', useMs: 2500 } }] },
        { room: 'b', waypoints: [{ x: 4, y: 6 }] },
        { room: 'a', waypoints: [{ x: 5, y: 2 }] }] } }));
    assert.equal(b.config.patrol.multiRoom, true, 'the route is valid');
    b.config.patrol.currentSegmentIndex = 1;
    b.config.patrol.waypointIndex = 1;
    await silently(() => b.chooseNewPatrolTarget(0));                  // the reader leg
    b._pendingRouteAction = b.patrolTarget.routeAction; b._routeUse = null; b.currentPath = [];
    await silently(() => b.chooseNewPatrolTarget(0));                  // arrival, held
    for (clock = 1050; clock <= 1000 + USE_HELD_GRACE_MS; clock += 50) {   // asked every frame
        await silently(() => b.chooseNewPatrolTarget(0));              // turns back at the end
    }
    assert.deepEqual(events.map(e => e[0]), ['door_gate_guard_turned_back']);
    assert.equal(b.config.patrol.currentSegmentIndex, 3, 'skips the far room, resumes at the later segment in a, not the reader one');
    assert.equal(b.config.patrol.waypointIndex, 0);
    delete window.doorGates;
    delete window.eventDispatcher;
});
