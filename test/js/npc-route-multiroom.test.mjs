// Multi-room patrol routes (npc-behavior.js): a route-only NPC follows its route
// (no top-level waypoints), visits every waypoint of a room (the last one too),
// never teleports, backs off on an unreachable leg instead of skipping a room, never
// heads into an unloaded room, runs a waypoint's unlockRoom action (unlock + load,
// wait, then on), retries a failed action after 5 s, and defaults pauseForPlayer
// to false. Locked route rooms are not pre-loaded.
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
const { default: behaviorModule } = await import(pathToFileURL(join(dir, 'npc-behavior.mjs')).href);
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
