// NPC stuck watch (NPCBehavior._checkPathStuck): an NPC walking a path that makes
// no progress for NPC_STUCK_MS recovers (re-path, then nudge onto a walkable cell,
// then drop the target), so one wedged NPC can't block a route for good. It must
// stay quiet while the NPC dwells, walks normally, is paused for the player or has
// the player standing beside it.
// Run with: node test/js/npc-stuck-detector.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'npc-stuck-detector-'));
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
const quiet = fn => {
    const l = console.log, w = console.warn;
    console.log = () => {}; console.warn = () => {};
    try { return fn(); } finally { console.log = l; console.warn = w; }
};
const mod = await quiet(() => import(pathToFileURL(join(dir, 'npc-behavior.mjs')).href));
const { NPCBehavior } = mod.default;
const { NPC_STUCK_MS } = mod;

// A patroller on a path from (0, 0) to `to`. changeDirectionInterval is long (the
// m02 Val workaround) so the older stall re-target stays out of the way.
// `nearestCell` is what the grid says is the nearest walkable cell to the feet.
function walker({ to = { x: 400, y: 0 }, dwellTime = 0, nearestCell = null, interval = 60000 } = {}) {
    const b = Object.create(NPCBehavior.prototype);
    const body = {
        center: { x: 0, y: 0 },
        setVelocity() {},
        reset(sx, sy) { b.resets.push({ sx, sy }); body.center.x += sx - b.sprite.x; body.center.y += sy - b.sprite.y; b.sprite.x = sx; b.sprite.y = sy; }
    };
    b.npcId = 'len';
    b.scene = { time: { now: 50000 } };
    b.sprite = { x: 0, y: -16, body };
    b.config = { patrol: { enabled: true, speed: 40, changeDirectionInterval: interval,
        waypointMode: 'sequential', waypointIndex: 1,
        waypoints: [{ worldX: to.x, worldY: to.y, dwellTime }, { worldX: 0, worldY: 0 }] } };
    b.patrolTarget = { x: to.x, y: to.y, dwellTime };
    b.currentPath = [{ x: to.x, y: to.y }];
    b.pathIndex = 0;
    b.pathFollowingActive = true;
    b.lastPatrolChange = b.scene.time.now;
    b.patrolReachedTime = 0;
    b.isSettling = false;
    b.settleDuration = 300;
    b._pathRetryAfter = 0;
    b._pathfindingInProgress = false;
    b.paths = 0;
    b.resets = [];
    b.recoveries = [];
    b.pathfindingManager = {
        findNearestWalkableWorldCell: (x, y) => ({ x, y }),
        findNearestWalkableStartCell: (x, y) => nearestCell || { x, y },
        findWorldPath(sx, sy, ex, ey, cb) { b.paths++; cb([{ x: ex, y: ey }]); }
    };
    const recover = NPCBehavior.prototype._recoverFromStuck;
    b._recoverFromStuck = function (attempt, x, y) {
        this.recoveries.push({ attempt, at: this.scene.time.now });
        return recover.call(this, attempt, x, y);
    };
    b.playAnimation = () => {};
    b.calculateDirection = () => 'right';
    b._drawPatrolPathDebug = () => {};
    b._clearPatrolPathDebug = () => {};
    // dx: px moved this frame; call: false = updatePatrol not called (paused for the player)
    b.step = function (dt, dx = 0, call = true) {
        this.scene.time.now += dt;
        body.center.x += dx;
        if (call) quiet(() => this.updatePatrol(this.scene.time.now, dt));
    };
    b.run = function (ms, dx = 0, call = true) { for (let t = 0; t < ms; t += 100) this.step(100, dx, call); };
    return b;
}

test.beforeEach(() => { window.player = null; });

test('a wedged NPC re-paths after NPC_STUCK_MS, not before', () => {
    const b = walker();
    b.run(NPC_STUCK_MS - 200);
    assert.equal(b.recoveries.length, 0);
    b.run(600);
    assert.equal(b.recoveries.length, 1);
    assert.equal(b.recoveries[0].attempt, 1);
    assert.equal(b.paths, 1, 'step 1 re-paths to the same target');
    assert.deepEqual(b.patrolTarget, { x: 400, y: 0, dwellTime: 0 });
    assert.equal(b.pathFollowingActive, true);
});

test('still wedged: nudges onto the nearest walkable cell, then drops the target', () => {
    const b = walker({ nearestCell: { x: 10, y: 0 } });
    b.run(NPC_STUCK_MS + 200);              // step 1
    assert.equal(b.resets.length, 0, 'step 1 does not move the NPC');
    b.run(NPC_STUCK_MS + 200);              // step 2
    assert.equal(b.recoveries.at(-1).attempt, 2);
    assert.equal(b.resets.length, 1, 'step 2 nudges');
    assert.equal(b.sprite.body.center.x, 10);
    assert.equal(b.paths, 2);
    // From the nudged spot the NPC is still wedged; the nudge itself is not progress.
    const before = b.recoveries.length;
    b.run(NPC_STUCK_MS + 200);              // step 3
    assert.equal(b.recoveries.length, before + 1);
    assert.equal(b.recoveries.at(-1).attempt, 3);
});

test('step 3 drops the target so the patrol chooses again', () => {
    const b = walker();
    let chose = 0;
    b.chooseNewPatrolTarget = function () { chose++; };
    b.run(3 * (NPC_STUCK_MS + 200));
    assert.equal(b.recoveries.length, 3);
    assert.ok(chose >= 1, 'patrol never chose a new target after the drop');
});

test('a nudge never moves the NPC more than a tile', () => {
    const b = walker({ nearestCell: { x: 200, y: 0 } });
    b.run(2 * (NPC_STUCK_MS + 200));
    assert.equal(b.recoveries.length, 2);
    assert.equal(b.resets.length, 0);
});

test('walking normally never trips it', () => {
    const b = walker({ to: { x: 1000, y: 0 } });
    b.run(20000, 4);                         // 40 px/s for 20 s
    assert.equal(b.recoveries.length, 0);
});

test('a long dwell at a waypoint never trips it', () => {
    const b = walker({ to: { x: 4, y: 0 }, dwellTime: 15000 });
    b.step(100);                             // within 8 px: path complete
    assert.equal(b.pathFollowingActive, false);
    b.run(12000);                            // dwelling, perfectly still
    assert.equal(b.recoveries.length, 0);
    assert.equal(b.paths, 0);
});

test('paused for the player (no patrol updates) does not count as stuck', () => {
    const b = walker();
    b.run(NPC_STUCK_MS - 500);               // pressing for a while
    b.run(6000, 0, false);                   // face_player: updatePatrol not called
    b.run(1000);                             // resumes; the gap re-armed the watch
    assert.equal(b.recoveries.length, 0);
});

test('the player standing beside the NPC holds it up without a recovery', () => {
    const b = walker();
    window.player = { x: 20, y: 0, body: { center: { x: 20, y: 0 } } };
    b.run(3 * NPC_STUCK_MS);
    assert.equal(b.recoveries.length, 0);
    window.player = { x: 300, y: 300, body: { center: { x: 300, y: 300 } } }; // steps away
    b.run(NPC_STUCK_MS + 200);
    assert.equal(b.recoveries.length, 1);
});

test('a path request in flight re-arms the watch', () => {
    const b = walker();
    b._pathfindingInProgress = true;
    b.run(2 * NPC_STUCK_MS);
    assert.equal(b.recoveries.length, 0);
});

test('with the default interval the older stall re-target and the stuck watch coexist', () => {
    const b = walker({ interval: 3000 });
    let chose = 0;
    const orig = NPCBehavior.prototype.chooseNewPatrolTarget;
    b.chooseNewPatrolTarget = function (t) { chose++; return orig.call(this, t); };
    quiet(() => b.run(20000));
    assert.ok(chose + b.recoveries.length >= 1);
    assert.ok(b.patrolTarget === null || b.currentPath.length > 0, 'left with a target but no path');
});
