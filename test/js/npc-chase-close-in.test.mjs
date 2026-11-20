// m04 confirmation N2 (2026-10-17): a hostile Cipher stopped attacking once a
// knockback left the player 33 px away (attack range 32). At that distance the
// chase path came back empty or as a waypoint he was already on, so he stood
// still. Now a chasing NPC just out of reach, with a clear line, walks straight
// at the player (npc-chase-leash.js shouldCloseInDirectly, npc-behavior.js
// updateHostileBehavior), and attacks again once in range.
// Run with: node --test test/js/npc-chase-close-in.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'npc-chase-close-in-'));
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
const silently = fn => { const l = console.log; console.log = () => {}; try { return fn(); } finally { console.log = l; } };
const { shouldCloseInDirectly, CLOSE_IN_MARGIN } = await import(pathToFileURL(join(dir, 'npc-chase-leash.mjs')).href);
const { default: behaviorModule } = await silently(() => import(pathToFileURL(join(dir, 'npc-behavior.mjs')).href));
const { NPCBehavior } = behaviorModule;

test('just out of reach with a clear line: close in directly', () => {
    assert.equal(shouldCloseInDirectly({ distance: 33, attackRange: 32, lineOfSight: true }), true);
    assert.equal(shouldCloseInDirectly({ distance: 32 + CLOSE_IN_MARGIN, attackRange: 32, lineOfSight: true }), true);
});

test('in range, far off, or something in the way: no direct step', () => {
    assert.equal(shouldCloseInDirectly({ distance: 30, attackRange: 32, lineOfSight: true }), false);
    assert.equal(shouldCloseInDirectly({ distance: 33 + CLOSE_IN_MARGIN, attackRange: 32, lineOfSight: true }), false);
    assert.equal(shouldCloseInDirectly({ distance: 33, attackRange: 32, lineOfSight: false }), false);
    assert.equal(shouldCloseInDirectly({ distance: NaN, attackRange: 32, lineOfSight: true }), false);
});

// A hostile NPC at (0, 0) whose pathfinding never finds a path (the stand-off)
function cipher({ los = true } = {}) {
    const b = Object.create(NPCBehavior.prototype);
    b.npcId = 'operative_cipher';
    b.chasePath = [];
    b.chasePathIndex = 0;
    b.chasePathPending = false;
    b.lastChasePathRequest = 0;
    b.chasePathUpdateInterval = 500;
    b.direction = 'down';
    b.velocity = null;
    b.anim = null;
    b.sprite = { x: 0, y: 0, body: { center: { x: 0, y: 0 }, setVelocity: (x, y) => { b.velocity = { x, y }; } } };
    b.config = silently(() => b.parseConfig({ hostile: { chaseSpeed: 110 } }));
    b.npcBodyPos = () => ({ x: 0, y: 0 });
    b.playAnimation = (anim) => { b.anim = anim; };
    b.pathfindingManager = {
        hasWorldPhysicsLineOfSight: () => los,
        findNearestWalkableStartCell: (x, y) => ({ x, y }),
        findNearestWalkableWorldCell: (x, y) => ({ x, y }),
        findWorldPath: (sx, sy, ex, ey, cb) => cb([]),
        smoothWorldPathForPlayer: (x, y, p) => p
    };
    return b;
}

test('33 px away after a knockback, he walks in at chase speed', () => {
    window.npcHostileSystem = { getState: () => ({ attackRange: 32 }) };
    const b = cipher();
    silently(() => b.updateHostileBehavior({ x: 33, y: 0 }, 16));
    assert.equal(b.anim, 'walk');
    assert.ok(Math.abs(b.velocity.x - 110) < 1e-9 && Math.abs(b.velocity.y) < 1e-9, JSON.stringify(b.velocity));
});

test('with a wall in the way he falls back to the path (and holds when there is none)', () => {
    window.npcHostileSystem = { getState: () => ({ attackRange: 32 }) };
    const b = cipher({ los: false });
    silently(() => b.updateHostileBehavior({ x: 33, y: 0 }, 16));
    assert.deepEqual(b.velocity, { x: 0, y: 0 });
});

test('in range he attacks', () => {
    window.npcHostileSystem = { getState: () => ({ attackRange: 32 }) };
    const attempts = [];
    window.npcCombat = { npcAttacking: new Set(), attemptAttack: (id) => attempts.push(id) };
    const b = cipher();
    b.calculateDirection = () => 'right';
    silently(() => b.updateHostileBehavior({ x: 30, y: 0 }, 16));
    assert.deepEqual(attempts, ['operative_cipher']);
    delete window.npcCombat;
});
