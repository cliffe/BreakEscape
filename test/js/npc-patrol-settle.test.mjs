// A patroller in contact with a movable NPC (face_player, not held) every frame must still
// make progress: the settle is a short pause, not a lock (T100: waypoint_fast stood 87 s at
// its first path point, beside waypoint_with_face and the player).
// Run with: node test/js/npc-patrol-settle.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

globalThis.window = globalThis.window || {};
window.gameState = window.gameState || { globalVariables: {} };
const { handleNPCCollision, handleNPCPlayerCollision } = await import('../../public/break_escape/js/systems/npc-sprites.js');

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'npc-patrol-settle-'));
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
const quiet = fn => {
    const l = console.log, w = console.warn;
    console.log = () => {}; console.warn = () => {};
    try { return fn(); } finally { console.log = l; console.warn = w; }
};
const { NPCBehavior } = (await quiet(() => import(pathToFileURL(join(dir, 'npc-behavior.mjs')).href))).default;

// A patroller 3 px from its first path point, touching a face_player NPC that is not held.
function setup() {
    const b = Object.create(NPCBehavior.prototype);
    const vel = { x: 0, y: 0 };
    const body = { enable: true, immovable: false, center: { x: 174, y: 174 },
        setVelocity(x, y) { vel.x = x; vel.y = y; } };
    b.npcId = 'fast';
    b.settleDuration = 300;
    b.scene = { time: { now: 100000 } };
    b.sprite = { x: 174, y: 174, body, npcId: 'fast' };
    b.direction = 'left';
    b.currentState = 'patrol';
    b.config = { patrol: { enabled: true, speed: 200, changeDirectionInterval: 3000,
        waypoints: [{ x: 8, y: 6 }, { x: 6, y: 6 }] } };
    b.patrolTarget = { x: 100, y: 174, dwellTime: 0 };
    b.currentPath = [{ x: 171, y: 174 }, { x: 100, y: 174 }];
    b.pathIndex = 0;
    b.pathFollowingActive = true;
    b.playAnimation = () => {};
    b._drawPatrolPathDebug = () => {}; b._clearPatrolPathDebug = () => {};
    b.lastPatrolChange = 100000;
    b._vel = vel;
    window.rooms = {};
    window.player = undefined;
    window.npcBehaviorManager = { getBehavior: id => (id === 'fast' ? b : null) };
    const other = { npcId: 'face', x: 170, y: 170, body: { immovable: false } };
    return { b, other };
}

// The engine runs physics at 60 fps and the behaviour manager every 50 ms. Each physics frame:
// the behaviour update (when due), then the overlap callback, then the body moves by its velocity.
// The NPC it touches is face_player, so it holds its ground; contact lasts while they overlap.
function run({ seconds, startX = 174, pathX = 150 }) {
    const { b, other } = setup();
    b.sprite.body.center.x = b.sprite.x = startX;
    b.currentPath = [{ x: pathX, y: 174 }, { x: pathX - 80, y: 174 }];
    b.patrolTarget = { x: pathX - 80, y: 174, dwellTime: 0 };
    const t0 = 100000, c = b.sprite.body.center, vel = b._vel;
    let lastUpdate = -Infinity, contactFrames = 0;
    quiet(() => {
        for (let t = t0; t < t0 + seconds * 1000; t += 1000 / 60) {
            b.scene.time.now = t;
            if (t - lastUpdate >= 50) { lastUpdate = t; b.updatePatrol(t, 50); }
            if (Math.abs(c.x - other.x) < 20) { contactFrames++; handleNPCCollision(b.sprite, other); }
            c.x += vel.x / 60; b.sprite.x = c.x;
        }
    });
    return { b, moved: startX - c.x, contactFrames };
}

test('settle: continuous contact with a movable NPC does not hold the walker still for ever', () => {
    // 24 px from its path point, so it must really walk (a path point under 8 px is only stepped past)
    const { b, moved, contactFrames } = run({ seconds: 10 });
    assert.ok(contactFrames > 0, 'the walker was in contact');
    assert.ok(moved > 8, `the walker pulled away from the contact (moved ${moved.toFixed(1)} px, pathIndex ${b.pathIndex}, settling ${b.isSettling})`);
});

test('settle: a single contact still pauses the walker for the settle duration and then resumes', () => {
    const { b, other } = setup();
    quiet(() => {
        b.scene.time.now = 100000;
        handleNPCCollision(b.sprite, other);
        assert.equal(b.isSettling, true);
        b.updatePatrol(100100, 50);
        assert.deepEqual(b._vel, { x: 0, y: 0 }, 'still for the settle');
        b.scene.time.now = 100000 + b.settleDuration + 50;
        b.updatePatrol(100000 + b.settleDuration + 50, 50);
    });
    assert.equal(b.isSettling, false, 'settle over');
    assert.ok(b.pathIndex > 0 || b._vel.x !== 0 || b._vel.y !== 0, 'walking again');
});

test('settle: contact after the grace has passed settles again, and a settle in progress is not extended', () => {
    const { b, other } = setup();
    quiet(() => {
        b.scene.time.now = 100000;
        handleNPCCollision(b.sprite, other);
        const end = b.settleEndTime;
        handleNPCCollision(b.sprite, other);
        assert.equal(b.settleEndTime, end, 'not extended while settling');
        b.updatePatrol(end + 1, 50);
        assert.equal(b.triggerSettling(end + 100), false, 'inside the grace: no new settle');
        assert.equal(b.isSettling, false);
        assert.equal(b.triggerSettling(end + 5000), true, 'after the grace: settles as before');
        assert.equal(b.isSettling, true);
    });
});

// Live (game 6330, T100 follow-up): the avoidance-waypoint half of the collision handler ran on
// every overlap frame, also inside the settle grace. It cleared the path and set _needsPathRecalc
// each frame, and updatePatrol's recalc branch returns before it moves the body, so a walker
// touching a face_player NPC re-planned for ever and never took a step.
test('settle grace: contact inside the grace does not wipe the path and replan every frame', () => {
    const { b, other } = setup();
    b.roomId = 'r';
    window.rooms = { r: { position: { x: 0, y: 0 } } };
    window.pathfindingManager = { findNearestWalkableStartCell: (x, y) => ({ x, y }) };
    let chooses = 0;
    b.chooseWaypointTarget = function () { chooses++; this.patrolTarget = { x: 20, y: 174, dwellTime: 0 }; };
    b._planMovePath = (pfm, sx, sy, tx, ty, cb) => cb([{ x: sx - 30, y: 174 }, { x: 20, y: 174 }]);
    const t0 = 100000, c = b.sprite.body.center, vel = b._vel;
    let lastUpdate = -Infinity, graceChooses = 0;
    quiet(() => {
        for (let t = t0; t < t0 + 6000; t += 1000 / 60) {
            b.scene.time.now = t;
            if (t - lastUpdate >= 50) { lastUpdate = t; b.updatePatrol(t, 50); }
            const inGrace = b._settleGraceUntil > t;
            const before = chooses;
            if (Math.abs(c.x - other.x) < 20) handleNPCCollision(b.sprite, other);
            if (inGrace) graceChooses += chooses - before;
            c.x += vel.x / 60; b.sprite.x = c.x;
        }
    });
    delete window.pathfindingManager;
    assert.equal(graceChooses, 0, 'no avoidance re-plan while the settle grace is running');
    assert.ok(174 - c.x > 8, `the walker pulled away from the contact (moved ${(174 - c.x).toFixed(1)} px)`);
});

// Minor 1 of the delta review: the player handler has the same guard, and nothing covered it.
test('settle grace: the player collision handler does not replan inside the grace either', () => {
    const { b } = setup();
    b.roomId = 'r';
    window.rooms = { r: { position: { x: 0, y: 0 } } };
    window.player = { currentRoom: 'r' };  // the player handler returns early without a room
    window.pathfindingManager = { findNearestWalkableStartCell: (x, y) => ({ x, y }) };
    const player = { x: 170, y: 170, body: { center: { x: 170, y: 170 } } };
    let chooses = 0;
    b.chooseWaypointTarget = function () { chooses++; this.patrolTarget = { x: 20, y: 174, dwellTime: 0 }; };
    b._planMovePath = (pfm, sx, sy, tx, ty, cb) => cb([{ x: sx - 30, y: 174 }, { x: 20, y: 174 }]);
    const t0 = 100000, c = b.sprite.body.center, vel = b._vel;
    let lastUpdate = -Infinity, graceChooses = 0, graceFrames = 0;
    quiet(() => {
        for (let t = t0; t < t0 + 6000; t += 1000 / 60) {
            b.scene.time.now = t;
            if (t - lastUpdate >= 50) { lastUpdate = t; b.updatePatrol(t, 50); }
            const inGrace = b._settleGraceUntil > t;
            const before = chooses;
            if (Math.abs(c.x - player.x) < 20) handleNPCPlayerCollision(b.sprite, player);
            if (inGrace) { graceFrames++; graceChooses += chooses - before; }
            c.x += vel.x / 60; b.sprite.x = c.x;
        }
    });
    delete window.pathfindingManager;
    window.player = undefined;
    assert.ok(graceFrames > 0, 'the walker was in contact during a grace');
    assert.equal(graceChooses, 0, 'no avoidance re-plan while the settle grace is running');
    assert.ok(174 - c.x > 8, `the walker pulled away from the player (moved ${(174 - c.x).toFixed(1)} px)`);
});

// Minor 2: a goToAndStay walker close enough to its destination arrives inside the grace.
test('settle grace: a goToAndStay walker arrives inside the grace, not 600 ms later', () => {
    for (const handler of [
        (b, other) => handleNPCCollision(b.sprite, other),
        (b) => handleNPCPlayerCollision(b.sprite, { x: 170, y: 170, body: { center: { x: 170, y: 170 } } }),
    ]) {
        const { b, other } = setup();
        let arrived = 0;
        b._stopOnArrival = true; b._goToStayDest = { x: 180, y: 174 };
        b._triggerGoToStayArrival = () => { arrived++; };
        quiet(() => {
            b.scene.time.now = 100000;
            handler(b, other);                 // first contact: settles
            b.updatePatrol(100400, 50);        // settle over, grace running
            b.scene.time.now = 100400;
            assert.ok(b._settleGraceUntil > 100400, 'grace running');
            const before = arrived;
            handler(b, other);
            assert.equal(arrived - before, 1, 'arrival fired inside the grace');
        });
    }
});

// Minor 3: the grace is stamped and read on clockNow(), and a stamp from another clock is pulled back.
test('settle grace: stamped on clockNow() and a far-future stamp is clamped', () => {
    const { b } = setup();
    quiet(() => {
        b.isSettling = true; b.settleEndTime = 100000;
        b.scene.time.now = 100200;             // scene clock differs from the time argument
        b.updatePatrol(100100, 50);
        assert.equal(b._settleGraceUntil, 100200 + 600, 'stamped on the clockNow() timeline');
        b._settleGraceUntil = 1.8e12;          // a stamp from another clock
        b.updatePatrol(100250, 50);
        assert.ok(b._settleGraceUntil <= b.clockNow() + 600, `clamped (${b._settleGraceUntil})`);
    });
});

// Delta-2 minor 1: arrival on a bump belongs to walkers with patrol waypoints only, as on main.
test('arrival on a bump: a walker without patrol waypoints does not arrive (either handler)', () => {
    for (const handler of [
        (b, other) => handleNPCCollision(b.sprite, other),
        (b) => handleNPCPlayerCollision(b.sprite, { x: 170, y: 170, body: { center: { x: 170, y: 170 } } }),
    ]) {
        const { b, other } = setup();
        b.config.patrol.waypoints = [];
        let arrived = 0;
        b._stopOnArrival = true; b._goToStayDest = { x: 180, y: 174 };
        b._triggerGoToStayArrival = () => { arrived++; };
        quiet(() => {
            b.scene.time.now = 100000;
            handler(b, other);                 // first contact (updatePatrol is not run: it has its own arrival)
            b.scene.time.now = 100400;
            handler(b, other);                 // a later bump
        });
        assert.equal(arrived, 0, 'no arrival for a walker without waypoints');
    }
});
