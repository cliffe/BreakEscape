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

test('includeHeld keeps the clearance ring open near the start and the goal; body cells stay avoided (game 5439)', () => {
    const me = { body: body(164, 236) };
    // Marek's own chair beside his home cell (52,132) and a seated colleague just past it
    const chair = { body: body(52, 146), destroyed: false };
    const seated = { body: body(72, 120, { immovable: true }) };
    // the player standing in open floor between the coffee and the desks
    window.player = { body: body(160, 223) };
    window.rooms = { r: { npcSprites: [me, seated] } };
    window.chairs = [chair];
    const p = pfm();
    p.findWorldPath(164, 236, 52, 132, () => {}, false, { avoidDynamic: { exceptSprite: me, includeHeld: true } });
    const av = new Set(p.searched.avoided);
    // goal cell (6,16): the ring cells round it are open (chair ring below, seated ring above right)
    for (const c of ['5,15', '6,15', '5,16', '7,16']) assert.ok(!av.has(c), `ring cell ${c} next to the goal is open`);
    assert.ok(av.has('6,17') && av.has('6,18'), 'the chair body itself is still avoided');
    assert.ok(av.has('8,14') && av.has('7,15'), 'and the seated body, even beside the goal');
    // start (20,29): the player ring next to it is open, the player's own cells are not
    assert.ok(!av.has('19,29') && !av.has('21,30'), 'ring cells by the start are open');
    assert.ok(av.has('19,27') && av.has('20,27'), 'the player body is avoided');
    // far from both ends the ring still applies
    assert.ok(av.has('17,26'), 'the player ring away from the start');
    window.player = null; window.chairs = [];
});

test('includeHeld also avoids chairs, loose or seated (never in the world grid when loose); the plain detour does not', () => {
    const me = { body: body(40, 40) };
    window.rooms = { r: { npcSprites: [me] } };
    window.player = null;
    window.chairs = [{ body: body(120, 200) }, { body: body(200, 120, { immovable: true }) }, { destroyed: true, body: body(240, 240) }];
    const a = pfm();
    a.findWorldPath(40, 40, 300, 300, () => {}, false, { avoidDynamic: { exceptSprite: me } });
    assert.equal(a.searched.avoided.length, 0, 'a patrol detour ignores chairs, as before');
    const b = pfm();
    b.findWorldPath(40, 40, 300, 300, () => {}, false, { avoidDynamic: { exceptSprite: me, includeHeld: true } });
    assert.ok(b.searched.avoided.includes('15,25'), 'the loose chair\'s cell is avoided');
    assert.ok(b.searched.avoided.includes('25,15'), 'the seated chair\'s cell is avoided');
    assert.ok(!b.searched.avoided.includes('30,30'), 'a destroyed chair is not');
    window.chairs = undefined;
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
    assert.equal(n.calls.length, 3, 'tries the tight search, then falls back to the plain search');
    assert.equal(n.calls[1].avoidDynamic.tight, true, 'the second tier plans round the bodies\' exact reach');
    assert.equal(n.calls[2], null);
    assert.deepEqual(got2[0], [{ x: 100, y: 0 }]);
});

test('R1 m6: the tight search keeps the needs room leash', () => {
    const n = walker({ reroute: true, detour: null });
    n._moveAvoidRooms = ['x'];
    n._planMovePath(n.pathfindingManager, 0, 0, 100, 0, () => {});
    assert.deepEqual(n.calls[0].avoidRooms, ['x'], 'the ring search');
    assert.equal(n.calls[1].avoidDynamic.tight, true);
    assert.deepEqual(n.calls[1].avoidRooms, ['x'], 'the tight search');
    assert.deepEqual(n.calls[2].avoidRooms, ['x'], 'the plain search');
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

// Code review R1 m7: the settle guard (game 5347) settles against a movable body, not a held one
test('settleOnContact: settles against a movable NPC body and not against an immovable (held) one', async () => {
    const { settleOnContact } = await import('../../public/break_escape/js/systems/npc-sprites.js');
    const settled = [];
    const vel = [];
    const behaviour = { clockNow: () => 1234, triggerSettling: t => settled.push(t) };
    const sprite = { body: { setVelocity: (x, y) => vel.push([x, y]) } };
    assert.equal(settleOnContact(behaviour, sprite, { body: { immovable: false } }), true);
    assert.deepEqual(settled, [1234]);
    assert.deepEqual(vel, [[0, 0]]);
    assert.equal(settleOnContact(behaviour, sprite, { body: { immovable: true } }), false, 'a seated body: no settle');
    assert.deepEqual(settled, [1234], 'triggerSettling not called again');
    assert.equal(vel.length, 1, 'and the walker keeps its velocity, sliding along the held body');
});

// Code review R2 m7: drive handleNPCCollision itself, so a dropped local (the otherHeld
// ReferenceError of games 5458 and 5459) throws here, not in a live game
test('handleNPCCollision: settles against a movable body; slides along a held one', async () => {
    const { handleNPCCollision } = await import('../../public/break_escape/js/systems/npc-sprites.js');
    const behaviours = {};
    const prevManager = window.npcBehaviorManager;
    const prevRooms = window.rooms;
    window.npcBehaviorManager = { getBehavior: id => behaviours[id] };
    window.rooms = {};   // no wallCollisionBoxes: every direction is safe; no roomData: no waypoint insert
    const make = () => {
        const settled = [];
        const vel = [];
        const b = {
            currentState: 'patrol', patrolTarget: { x: 200, y: 100 }, roomId: 'office', direction: 'right',
            waypointIndex: 0, _stopOnArrival: false,
            config: { patrol: { waypoints: [{ tileX: 6, tileY: 3, worldX: 200, worldY: 100 }] } },
            clockNow: () => 5000, triggerSettling: t => settled.push(t)
        };
        const sprite = { npcId: 'marek', x: 100, y: 100, body: { setVelocity: (x, y) => vel.push([x, y]) } };
        return { b, sprite, settled, vel };
    };
    try {
        const one = make();
        behaviours.marek = one.b;
        handleNPCCollision(one.sprite, { npcId: 'tom', x: 116, y: 100, body: { immovable: false } });
        assert.ok(one.settled.length >= 1, 'a movable body: the walker settles');
        assert.ok(one.vel.every(v => v[0] === 0 && v[1] === 0), 'and stops');

        const two = make();
        behaviours.marek = two.b;
        handleNPCCollision(two.sprite, { npcId: 'sanjay', x: 116, y: 100, body: { immovable: true } });
        assert.deepEqual(two.settled, [], 'a held (seated) body: no settle at all');
        assert.deepEqual(two.vel, [], 'velocity untouched: physics slides it along');
        assert.equal(two.b.config.patrol.waypoints.length, 1, 'no waypoint inserted without room data');
    } finally {
        window.npcBehaviorManager = prevManager;
        window.rooms = prevRooms;
    }
});
