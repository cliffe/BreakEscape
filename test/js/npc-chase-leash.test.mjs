// 7.1a (m06 D8, m07 U10, m08 E11): a hostile NPC with behavior.hostile.leash
// gives up the chase past chaseRange from its post (combat-config.js, or
// behavior.hostile.chaseRange) or when the player leaves its room, and goes
// back to its post. Without leash it follows the player anywhere.
// Run with: node --test test/js/npc-chase-leash.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'npc-chase-leash-'));
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
const { hostileMayChase, resolveChaseRange } = await import(pathToFileURL(join(dir, 'npc-chase-leash.mjs')).href);
const { COMBAT_CONFIG } = await import(pathToFileURL(join(dir, 'combat-config.mjs')).href);
const { default: behaviorModule } = await silently(() => import(pathToFileURL(join(dir, 'npc-behavior.mjs')).href));
const { NPCBehavior } = behaviorModule;

const post = { x: 0, y: 0, roomId: 'office' };

test('the leash: inside the range and the room, the NPC chases', () => {
    assert.equal(hostileMayChase({ playerPos: { x: 100, y: 0 }, playerRoomId: 'office', anchor: post, chaseRange: 400 }), true);
});

test('the leash: past the range, it gives up', () => {
    assert.equal(hostileMayChase({ playerPos: { x: 401, y: 0 }, playerRoomId: 'office', anchor: post, chaseRange: 400 }), false);
    assert.equal(hostileMayChase({ playerPos: { x: 150, y: 0 }, playerRoomId: 'office', anchor: post, chaseRange: 128 }), false);
});

test('the leash: at its own door, it gives up unless chaseAcrossRooms', () => {
    const p = { playerPos: { x: 60, y: 0 }, playerRoomId: 'lobby', anchor: post, chaseRange: 400 };
    assert.equal(hostileMayChase(p), false);
    assert.equal(hostileMayChase({ ...p, acrossRooms: true }), true);
});

test('chaseRange: a positive scenario value wins, else the combat-config default', () => {
    assert.equal(resolveChaseRange(200, 400), 200);
    assert.equal(resolveChaseRange(undefined, 400), 400);
    assert.equal(resolveChaseRange(-1, 400), 400);
    assert.equal(resolveChaseRange('200', 400), 400);
});

// A hostile guard standing at its post (0, 0) in 'office'; the NPC is at `at`.
function guard(config = {}, at = { x: 0, y: 0 }) {
    const b = Object.create(NPCBehavior.prototype);
    b.npcId = 'guard';
    b.roomId = 'office';
    b.homeRoomId = 'office';
    b.homePosition = { x: 0, y: 0 };
    b.returningHome = false;
    b.chasePath = [];
    b.chasePathIndex = 0;
    b._chaseAnchor = null;
    b._lastChaseAt = 0;
    b._gaveUpChase = false;
    b.sprite = { x: at.x, y: at.y, body: { center: { ...at }, setVelocity() {} } };
    b.config = silently(() => b.parseConfig(config));
    b.npcBodyPos = () => ({ ...at });
    return b;
}
window.npcHostileSystem = { isNPCHostile: () => true, isNPCKO: () => false };

test('parseConfig: chaseRange defaults to combat-config.js; a scenario can override it', () => {
    assert.equal(guard().config.hostile.chaseRange, COMBAT_CONFIG.npc.chaseRange);
    assert.equal(guard({ hostile: { chaseRange: 96 } }).config.hostile.chaseRange, 96);
    assert.equal(guard().config.hostile.chaseAcrossRooms, false);
    assert.equal(guard({ hostile: { chaseAcrossRooms: true } }).config.hostile.chaseAcrossRooms, true);
});

test('a hostile chases the player inside its room', () => {
    window.currentPlayerRoom = 'office';
    assert.equal(guard().determineState({ x: 100, y: 0 }), 'chase');
});

test('the player steps through the door: the hostile gives up and walks home', () => {
    window.currentPlayerRoom = 'lobby';
    // Chased 120 px from its post; the home-push logic has set a walk home
    const b = guard({ hostile: { leash: true } }, { x: 120, y: 0 });
    b.returningHome = true;
    b.config.patrol.enabled = true;
    const state = silently(() => b.determineState({ x: 150, y: 0 }));
    assert.equal(state, 'patrol', 'walks back rather than chasing or staring');
    assert.equal(b._gaveUpChase, true);

    window.currentPlayerRoom = 'office';
    assert.equal(b.determineState({ x: 150, y: 0 }), 'chase', 'back inside the leash: chases again');
});

test('past a per-NPC chaseRange the hostile gives up, even in its own room', () => {
    window.currentPlayerRoom = 'office';
    const b = guard({ hostile: { leash: true, chaseRange: 64, aggroDistance: 200 } }, { x: 40, y: 0 });
    assert.notEqual(silently(() => b.determineState({ x: 120, y: 0 })), 'chase');
    assert.equal(b.determineState({ x: 60, y: 0 }), 'chase');
});

test('leashed, chaseAcrossRooms: true still follows through doors', () => {
    window.currentPlayerRoom = 'lobby';
    assert.equal(guard({ hostile: { leash: true, chaseAcrossRooms: true } }).determineState({ x: 100, y: 0 }), 'chase');
});

test('parseConfig: the leash is off unless leash: true', () => {
    assert.equal(guard().config.hostile.leash, false);
    assert.equal(guard({ hostile: { leash: 'yes' } }).config.hostile.leash, false);
    assert.equal(guard({ hostile: { leash: true } }).config.hostile.leash, true);
});

test('unleashed (the default), a hostile follows through doors and past chaseRange', () => {
    window.currentPlayerRoom = 'lobby';
    assert.equal(guard().determineState({ x: 100, y: 0 }), 'chase');
    window.currentPlayerRoom = 'office';
    const b = guard({ hostile: { chaseRange: 64, aggroDistance: 200 } }, { x: 40, y: 0 });
    assert.equal(b.determineState({ x: 120, y: 0 }), 'chase');
});
