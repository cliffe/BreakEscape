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
const { handleNPCCollision } = await import('../../public/break_escape/js/systems/npc-sprites.js');

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
