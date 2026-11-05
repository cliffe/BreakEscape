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

test('transition into an unloaded room waits', async () => {
    const { b } = setup({ bLoaded: false });
    b.config = await silently(() => b.parseConfig({ patrol: { enabled: true, multiRoom: true, route: ROUTE } }));
    b.config.patrol.waypointIndex = 2;
    await silently(() => b.transitionToNextRoom(0));
    assert.equal(b.config.patrol.currentSegmentIndex, 0);
    assert.ok(b._pathRetryAfter > 0);
});
