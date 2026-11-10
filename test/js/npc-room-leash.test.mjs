// Room leash on the walk (OFFICE_LIFE_PLAN 7.2, slice 2a; review M1): a needs move's avoidRooms
// reach findWorldPath at the behaviour's planning points, not only the needs reachability check.
// Run with: node test/js/npc-room-leash.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'npc-room-leash-'));
writeFileSync(join(dir, 'constants-stub.mjs'), 'export const TILE_SIZE = 32;');
writeFileSync(join(dir, 'pathfinding-stub.mjs'), 'export class NPCPathfindingManager {}');
writeFileSync(join(dir, 'combat-config.mjs'), readFileSync(join(js, 'config/combat-config.js'), 'utf8'));
writeFileSync(join(dir, 'npc-chase-leash.mjs'), readFileSync(join(js, 'systems/npc-chase-leash.js'), 'utf8'));
writeFileSync(join(dir, 'fight-styles.mjs'), readFileSync(join(js, 'systems/fight-styles.js'), 'utf8'));
const code = readFileSync(join(js, 'systems/npc-behavior.js'), 'utf8')
    .replace("'../utils/constants.js'", "'./constants-stub.mjs'")
    .replace("'./npc-pathfinding.js'", "'./pathfinding-stub.mjs'")
    .replace("'../config/combat-config.js'", "'./combat-config.mjs'")
    .replace("'./npc-chase-leash.js'", "'./npc-chase-leash.mjs'")
    .replace("'./fight-styles.js'", "'./fight-styles.mjs'");
writeFileSync(join(dir, 'npc-behavior.mjs'), code);

globalThis.window = { gameState: { globalVariables: {} } };
const silently = fn => { const l = console.log, w = console.warn; console.log = () => {}; console.warn = () => {}; try { return fn(); } finally { console.log = l; console.warn = w; } };
const { default: behaviorModule } = await silently(() => import(pathToFileURL(join(dir, 'npc-behavior.mjs')).href));
const { NPCBehavior } = behaviorModule;

function npc() {
    const calls = [];
    const b = Object.create(NPCBehavior.prototype);
    b.npcId = 'tom';
    b.sprite = { x: 0, y: 0, body: { center: { x: 0, y: 0 }, setVelocity() {} } };
    b.validateWaypoints = () => {};
    b.config = silently(() => b.parseConfig({}));
    b.npcBodyPos = () => ({ x: 0, y: 0 });
    b.clockNow = () => 0;
    b.pathfindingManager = {
        findNearestWalkableWorldCell: (x, y) => ({ x, y }),
        findNearestWalkableStartCell: (x, y) => ({ x, y }),
        findWorldPath: (...args) => calls.push(args)
    };
    return { b, calls };
}
const lastOpts = calls => calls[calls.length - 1][6];

test('a needs move with avoidRooms carries them into chooseWaypointTarget\'s search', () => {
    const { b, calls } = npc();
    silently(() => b.goToAndStay(256, 128, 80, { owner: 'needs', avoidRooms: ['lounge'] }));
    silently(() => b.chooseWaypointTarget(0));
    assert.equal(calls.length, 1);
    assert.deepEqual(lastOpts(calls), { avoidRooms: ['lounge'] });
});

test('the stuck recovery repath carries them too', () => {
    const { b, calls } = npc();
    silently(() => b.goToAndStay(256, 128, 80, { owner: 'needs', avoidRooms: ['lounge'] }));
    b.patrolTarget = { x: 256, y: 128 };
    silently(() => b._recoverFromStuck(1, 0, 0));
    assert.deepEqual(lastOpts(calls), { avoidRooms: ['lounge'] });
});

test('a needs move without avoidRooms (seating\'s chair fetch) keeps the value; a script move drops it', () => {
    const { b, calls } = npc();
    silently(() => b.goToAndStay(256, 128, 80, { owner: 'needs', avoidRooms: ['lounge'] }));
    silently(() => b.goToAndStay(200, 128, 80, { owner: 'needs', fromSeating: true }));
    silently(() => b.chooseWaypointTarget(0));
    assert.deepEqual(lastOpts(calls), { avoidRooms: ['lounge'] });
    silently(() => b.goToAndStay(100, 128, 80, { owner: 'script' }));
    silently(() => b.chooseWaypointTarget(0));
    assert.equal(calls[calls.length - 1].length, 5, 'scripts ignore the leash');
});

test('cancelMove and arrival clear the leash; an empty list plans unconstrained', () => {
    const { b, calls } = npc();
    b.playAnimation = () => {};
    b._clearPatrolPathDebug = () => {};
    silently(() => b.goToAndStay(256, 128, 80, { owner: 'needs', avoidRooms: ['lounge'] }));
    b.cancelMove();
    assert.equal(b._moveAvoidRooms, undefined);
    silently(() => b.goToAndStay(256, 128, 80, { owner: 'needs', avoidRooms: ['lounge'] }));
    silently(() => b._triggerGoToStayArrival());
    assert.equal(b._moveAvoidRooms, undefined);
    silently(() => b.goToAndStay(256, 128, 80, { owner: 'needs', avoidRooms: [] }));
    silently(() => b.chooseWaypointTarget(0));
    assert.equal(calls[calls.length - 1].length, 5);
});
