// The behaviour and pathfinding halves of the stalled-needs-walk fix
// (docs/achitechture/OFFICE_LIFE_STUCK_RETURN.md): a needs re-route plans round seated and held
// NPC bodies (never the goal cell) and falls back to the plain path; patrols plan as before; and a
// bump far from a needs destination is no longer an arrival.
// Run with: node test/js/npc-needs-reroute-held.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

globalThis.window = globalThis.window || {};
window.gameState = window.gameState || { globalVariables: {} };
const { NPCPathfindingManager } = await import('../../public/break_escape/js/systems/npc-pathfinding.js');
const { collisionArrives, NEEDS_COLLISION_ARRIVE_PX } = await import('../../public/break_escape/js/systems/npc-sprites.js');

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'npc-needs-reroute-'));
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
const quiet = async fn => {
    const l = console.log, w = console.warn;
    console.log = () => {}; console.warn = () => {};
    try { return await fn(); } finally { console.log = l; console.warn = w; }
};
const { NPCBehavior } = (await quiet(() => import(pathToFileURL(join(dir, 'npc-behavior.mjs')).href))).default;

// ── pathfinding: which cells a search avoids ──
function pfm() {
    const pm = new NPCPathfindingManager({ time: { delayedCall() {} } });
    const cols = 40, rows = 40;
    pm.worldGrid = Array.from({ length: rows }, () => new Array(cols).fill(0));
    pm.worldGridBounds = { minX: 0, minY: 0, cols, rows, step: 8 };
    pm.avoided = [];
    pm.worldPathfinder = {
        avoidAdditionalPoint: (cx, cy) => pm.avoided.push(`${cx},${cy}`),
        stopAvoidingAllAdditionalPoints() {}, stopAvoidingAdditionalPoint() {},
        findPath(sx, sy, ex, ey, cb) { pm.searched = { sx, sy, ex, ey, avoided: pm.avoided.slice() }; pm._cb = cb; },
        calculate() { pm._cb([{ x: 1, y: 1 }]); }
    };
    return pm;
}
const body = (x, y, extra = {}) => ({ enable: true, immovable: false, left: x - 9, right: x + 9, top: y - 5, bottom: y + 5, center: { x, y }, ...extra });

test('includeHeld avoids a seated (immovable) NPC body; the plain detour still ignores it', () => {
    const me = { body: body(40, 40) };
    const seated = { body: body(160, 160, { immovable: true }) };
    window.rooms = { r: { npcSprites: [me, seated] } };
    window.player = null;
    const a = pfm();
    a.findWorldPath(40, 40, 300, 300, () => {}, false, { avoidDynamic: { exceptSprite: me } });
    assert.equal(a.searched.avoided.length, 0, 'a patrol detour plans as before: held bodies are not avoided');
    const b = pfm();
    b.findWorldPath(40, 40, 300, 300, () => {}, false, { avoidDynamic: { exceptSprite: me, includeHeld: true } });
    assert.ok(b.searched.avoided.includes('20,20'), 'the seated body\'s cell is avoided');
    assert.ok(!b.searched.avoided.some(c => c === '5,5'), 'never the walker itself');
});

test('includeHeld never avoids the goal cell, so a home beside a seated colleague stays reachable', () => {
    const me = { body: body(40, 40) };
    const seated = { body: body(160, 160, { immovable: true }) };
    window.rooms = { r: { npcSprites: [me, seated] } };
    const p = pfm();
    p.findWorldPath(40, 40, 164, 164, () => {}, false, { avoidDynamic: { exceptSprite: me, includeHeld: true } });
    assert.ok(!p.searched.avoided.includes('20,20'), 'the goal cell is left open');
    assert.ok(p.searched.avoided.includes('19,19'), 'the cells round it are still avoided');
});

// ── behaviour: when a needs walk plans round bodies ──
function walker({ owner = 'needs', reroute = false, detour = [{ x: 9, y: 9 }] } = {}) {
    const b = Object.create(NPCBehavior.prototype);
    b.npcId = 'marek';
    b.sprite = { x: 0, y: 0, body: { center: { x: 0, y: 0 }, setVelocity() {} } };
    b._moveOwner = owner;
    b._moveReroute = reroute;
    b._moveAvoidRooms = [];
    b.calls = [];
    b.pathfindingManager = {
        findWorldPath(sx, sy, ex, ey, cb, avoidNPCs, opts) {
            b.calls.push(opts || null);
            cb(opts?.avoidDynamic ? detour : [{ x: ex, y: ey }]);
        }
    };
    return b;
}

test('a needs re-route plans round held bodies; with no such path it takes the plain one', () => {
    const got = [];
    const w = walker({ reroute: true });
    w._planMovePath(w.pathfindingManager, 0, 0, 100, 0, p => got.push(p));
    assert.equal(w.calls.length, 1);
    assert.deepEqual(w.calls[0].avoidDynamic.includeHeld, true);
    assert.deepEqual(got[0], [{ x: 9, y: 9 }]);
    const n = walker({ reroute: true, detour: null });
    const got2 = [];
    n._planMovePath(n.pathfindingManager, 0, 0, 100, 0, p => got2.push(p));
    assert.equal(n.calls.length, 2, 'falls back to the plain search');
    assert.equal(n.calls[1], null);
    assert.deepEqual(got2[0], [{ x: 100, y: 0 }]);
});

test('without reroute, and for any non-needs move, the plan is unchanged', () => {
    for (const w of [walker({ reroute: false }), walker({ owner: 'script', reroute: true })]) {
        w._planMovePath(w.pathfindingManager, 0, 0, 100, 0, () => {});
        assert.deepEqual(w.calls, [null]);
    }
});

test('goToAndStay keeps reroute for needs moves only, and an arrival clears it', () => {
    const b = Object.create(NPCBehavior.prototype);
    b.npcId = 'marek';
    b.config = { patrol: { speed: 80, waypoints: [] } };
    b.sprite = { x: 0, y: 0, body: { center: { x: 0, y: 0 }, setVelocity() {} } };
    b.playAnimation = () => {};
    b._clearPatrolPathDebug = () => {};
    window.npcNeedsSystem = null;
    quiet(() => b.goToAndStay(100, 100, 80, { owner: 'needs', reroute: true }));
    assert.equal(b._moveReroute, true);
    quiet(() => b.goToAndStay(100, 100, 80, { owner: 'script', reroute: true }));
    assert.equal(b._moveReroute, false, 'a scripted move never re-routes this way');
    quiet(() => b.goToAndStay(100, 100, 80, { owner: 'needs', reroute: true }));
    window.eventDispatcher = null;
    quiet(() => b._triggerGoToStayArrival());
    assert.equal(b._moveReroute, false);
});

test('the stuck recovery switches a wedged needs walk to re-routing, never a patrol', () => {
    for (const [owner, stop, want] of [['needs', true, true], ['script', false, false]]) {
        const w = walker({ owner });
        w._stopOnArrival = stop;
        w.patrolTarget = { x: 100, y: 0 };
        w.config = { patrol: { speed: 80 } };
        w.pathfindingManager.findNearestWalkableStartCell = (x, y) => ({ x, y });
        w._arriveForRouteAction = () => false;
        w.clockNow = () => 0;
        quiet(() => w._recoverFromStuck(1, 0, 0, 0));
        assert.equal(!!w._moveReroute, want, `owner ${owner}`);
        assert.equal(!!w.calls[0]?.avoidDynamic, want);
    }
});

// ── collision arrivals ──
test('a bump far from a needs destination is not an arrival; near, or for other moves, as before', () => {
    const dest = { x: 100, y: 100 };
    const at = (x, y) => ({ x, y: y - 16, body: { center: { x, y } } });
    assert.equal(collisionArrives({ _goToStayDest: dest, _moveOwner: 'needs' }, at(100, 152)), false, '52 px short (game 5260)');
    assert.equal(collisionArrives({ _goToStayDest: dest, _moveOwner: 'needs' }, at(100, 100 + NEEDS_COLLISION_ARRIVE_PX)), true);
    assert.equal(collisionArrives({ _goToStayDest: dest, _moveOwner: 'script' }, at(100, 152)), true, 'a scripted move keeps the two-tile rule');
    assert.equal(collisionArrives({ _goToStayDest: dest, _moveOwner: undefined }, at(100, 190)), false);
});
