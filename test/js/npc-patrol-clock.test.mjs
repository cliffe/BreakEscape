// NPC patrol timers run on one clock (NPCBehavior.clockNow: Phaser scene time).
// Regression: the NPC-bump handlers in npc-sprites.js called
// chooseWaypointTarget(Date.now()), stamping lastPatrolChange with epoch ms
// (~1.8e12) while updatePatrol compares it with scene time (ms since page load).
// `time - lastPatrolChange` went hugely negative, so the stall re-target never
// fired again and a blocked NPC stood frozen on its path for good.
// Run with: node test/js/npc-patrol-clock.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'npc-patrol-clock-'));
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
const { default: behaviorModule } = await quiet(() => import(pathToFileURL(join(dir, 'npc-behavior.mjs')).href));
const { NPCBehavior } = behaviorModule;

// A waypoint patroller on a scene clock that starts 100 s after page load.
function patroller({ pathOk = true } = {}) {
    const b = Object.create(NPCBehavior.prototype);
    const body = { center: { x: 0, y: 0 }, setVelocity() {}, reset() {} };
    b.npcId = 'len';
    b.scene = { time: { now: 100000 } };
    b.sprite = { x: 0, y: 0, body };
    b.config = { patrol: { enabled: true, speed: 40, changeDirectionInterval: 3000,
        waypointMode: 'sequential', waypointIndex: 0,
        waypoints: [{ worldX: 400, worldY: 0 }, { worldX: 0, worldY: 0 }] } };
    b.currentPath = [];
    b.pathIndex = 0;
    b.patrolTarget = null;
    b.pathFollowingActive = false;
    b.lastPatrolChange = 0;
    b.patrolReachedTime = 0;
    b.isSettling = false;
    b.settleDuration = 300;
    b._pathRetryAfter = 0;
    b._pathfindingInProgress = false;
    b.paths = 0;
    b.pathfindingManager = {
        findNearestWalkableWorldCell: (x, y) => ({ x, y }),
        findNearestWalkableStartCell: (x, y) => ({ x, y }),
        findWorldPath(sx, sy, ex, ey, cb) { b.paths++; cb(pathOk ? [{ x: ex, y: ey }] : null); }
    };
    b.playAnimation = () => {};
    b.calculateDirection = () => 'right';
    b._drawPatrolPathDebug = () => {};
    b._clearPatrolPathDebug = () => {};
    b.step = function (dt, dx = 0) {
        this.scene.time.now += dt;
        body.center.x += dx;
        quiet(() => this.updatePatrol(this.scene.time.now, dt));
    };
    return b;
}

test('clockNow is the scene clock, with performance.now() before it starts, never epoch ms', () => {
    const b = patroller();
    assert.equal(b.clockNow(), 100000);
    b.scene.time.now = 0;
    const t = b.clockNow();
    assert.ok(Number.isFinite(t) && t < 1e11, `fallback ${t} looks like Date.now()`);
    b.scene = null;
    assert.ok(b.clockNow() < 1e11);
});

test('the bump handlers stamp NPC timers with the NPC clock, not Date.now()', () => {
    const src = readFileSync(join(js, 'systems/npc-sprites.js'), 'utf8');
    assert.doesNotMatch(src, /chooseWaypointTarget\(\s*Date\.now\(\)\s*\)/);
    assert.doesNotMatch(src, /gameTime\s*=.*Date\.now\(\)/);
    const beh = readFileSync(join(js, 'systems/npc-behavior.js'), 'utf8');
    assert.doesNotMatch(beh, /_pathRetryAfter\s*=\s*performance\.now\(\)/);
});

test('a blocked patroller re-targets after a bump that used the NPC clock', () => {
    const b = patroller();
    quiet(() => b.chooseWaypointTarget(b.clockNow()));
    assert.equal(b.paths, 1);
    let retargeted = false;
    const orig = b.chooseNewPatrolTarget;
    b.chooseNewPatrolTarget = function (t) { retargeted = true; return orig.call(this, t); };
    for (let i = 0; i < 60; i++) b.step(100, 0); // 6 s pressed against something
    assert.ok(retargeted, 'stall re-target never fired');
});

test('a timer stamped from Date.now() (the old bug) no longer freezes the patrol', () => {
    const b = patroller();
    quiet(() => b.chooseWaypointTarget(Date.now()));
    assert.ok(b.lastPatrolChange > 1e12);
    let retargeted = false;
    const orig = b.chooseNewPatrolTarget;
    b.chooseNewPatrolTarget = function (t) { retargeted = true; return orig.call(this, t); };
    for (let i = 0; i < 60; i++) b.step(100, 0);
    assert.ok(b.lastPatrolChange < 1e11, 'foreign stamp was not pulled back to the scene clock');
    assert.ok(retargeted, 'stall re-target never fired');
});

test('settling stamped from Date.now() ends after settleDuration, not in 56 years', () => {
    const b = patroller();
    quiet(() => b.chooseWaypointTarget(b.clockNow()));
    b.triggerSettling = NPCBehavior.prototype.triggerSettling;
    quiet(() => b.triggerSettling(Date.now()));
    assert.equal(b.isSettling, true);
    for (let i = 0; i < 5; i++) b.step(100, 0);
    assert.equal(b.isSettling, false);
});

test('an unreachable waypoint backs off 2 s on the scene clock, then retries', () => {
    const b = patroller({ pathOk: false });
    b.step(16);
    assert.equal(b.paths, 1);
    assert.ok(Math.abs(b._pathRetryAfter - (b.scene.time.now + 2000)) < 1, `retry at ${b._pathRetryAfter}`);
    for (let i = 0; i < 10; i++) b.step(100); // 1 s: still backing off
    assert.equal(b.paths, 1);
    for (let i = 0; i < 11; i++) b.step(100); // past 2 s: retried
    assert.ok(b.paths >= 2);
});
