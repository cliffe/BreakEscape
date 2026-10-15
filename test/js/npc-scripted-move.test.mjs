// A scripted move (patrolOverride -> goToAndStay) doesn't pause for the player.
// sis01 R3 playtest D1: nurses sent to Bed 2 stopped ~96 px short of a player
// standing at the bed, because pauseForPlayer also applied to the override walk.
// Normal patrols still pause.
// Run with: node --test test/js/npc-scripted-move.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'npc-scripted-move-'));
writeFileSync(join(dir, 'constants-stub.mjs'), 'export const TILE_SIZE = 32;');
writeFileSync(join(dir, 'pathfinding-stub.mjs'), 'export class NPCPathfindingManager {}');
const code = readFileSync(join(js, 'systems/npc-behavior.js'), 'utf8')
    .replace("'../utils/constants.js'", "'./constants-stub.mjs'")
    .replace("'./npc-pathfinding.js'", "'./pathfinding-stub.mjs'");
writeFileSync(join(dir, 'npc-behavior.mjs'), code);

globalThis.window = { gameState: { globalVariables: {} } };
const quiet = console.log;
console.log = () => {};
const { default: behaviorModule } = await import(pathToFileURL(join(dir, 'npc-behavior.mjs')).href);
console.log = quiet;
const { NPCBehavior } = behaviorModule;

const player = gap => ({ x: gap, y: 0 });
const silently = fn => { const l = console.log; console.log = () => {}; try { return fn(); } finally { console.log = l; } };

// A nurse at (0, 0) with the given behavior config; the player stands `gap` px away.
function nurse(config) {
    const b = Object.create(NPCBehavior.prototype);
    b.npcId = 'patrol_nurse';
    b.sprite = { x: 0, y: 0, body: { center: { x: 0, y: 0 }, setVelocity() {} } };
    b.validateWaypoints = () => {};     // needs a room; not under test
    b.config = silently(() => b.parseConfig(config));
    b.npcBodyPos = () => ({ x: 0, y: 0 });
    return b;
}

test('a waypoint patrol still pauses to face a nearby player', () => {
    const b = nurse({ patrol: { waypoints: [{ x: 1, y: 1 }, { x: 5, y: 1 }] } });
    assert.equal(b.determineState(player(60)), 'face_player');
    assert.equal(b.determineState(player(200)), 'patrol');
});

test('a goToAndStay move keeps walking with the player beside it', () => {
    const b = nurse({ patrol: { waypoints: [{ x: 1, y: 1 }, { x: 5, y: 1 }] } });
    silently(() => b.goToAndStay(8 * 32, 4 * 32, 150));
    assert.equal(b.determineState(player(60)), 'patrol');
    assert.equal(b.determineState(player(10)), 'patrol');
});

test('an NPC with no patrol (Sarah) also walks to the bed, then faces the player on arrival', () => {
    const b = nurse({});
    assert.equal(b.config.patrol.enabled, false);
    silently(() => b.goToAndStay(8 * 32, 4 * 32, 150));
    assert.equal(b.determineState(player(60)), 'patrol');

    // Arrival (as _triggerGoToStayArrival leaves it): patrol off, normal facing again
    b._stopOnArrival = false;
    b.config.patrol.enabled = false;
    assert.equal(b.determineState(player(60)), 'face_player');
});

test('after arriving, a nurse sent back onto a patrol pauses for the player again', () => {
    const b = nurse({ patrol: { waypoints: [{ x: 1, y: 1 }, { x: 5, y: 1 }] } });
    silently(() => b.goToAndStay(8 * 32, 4 * 32, 150));
    b._stopOnArrival = false;           // arrived
    b.config.patrol.enabled = true;     // a later mapping restores the round
    assert.equal(b.determineState(player(60)), 'face_player');
});

test('pauseForPlayer: false patrols are unchanged', () => {
    const b = nurse({ patrol: { waypoints: [{ x: 1, y: 1 }, { x: 5, y: 1 }], pauseForPlayer: false } });
    assert.equal(b.determineState(player(60)), 'patrol');
});
