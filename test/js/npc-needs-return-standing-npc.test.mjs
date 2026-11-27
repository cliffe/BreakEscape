// A returning needs NPC steps round a standing NPC that fills an aisle the clearance ring closes
// (m08 game 9155: Agnieszka stalled for over a minute 22 px from Vector), and is never planned
// into the local avoidance lane of a standing NPC (m08 games 9336, 9356: docs/achitechture/reviews/return-stall/DIAGNOSIS_M08.md). Real
// EasyStar and the real pathfinding manager; the walker's body is stepped along the path with the
// engine's 8 px waypoint advance against the standing body.
// Run with: node test/js/npc-needs-return-standing-npc.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import vm from 'node:vm';
import { NPCNeedsSystem, NEEDS_TICK_MS, RETURN_YIELD_MS } from '../../public/break_escape/js/systems/npc-needs.js';
import { makeWorld } from './fixtures/needs-stub-world.mjs';

globalThis.window = globalThis.window || {};
vm.runInThisContext(readFileSync(new URL('./vendor/easystar-0.4.4.js', import.meta.url), 'utf8'));
globalThis.EasyStar = globalThis.EasyStar || vm.runInThisContext('EasyStar');
window.gameState = window.gameState || { globalVariables: {} };
const { NPCPathfindingManager } = await import('../../public/break_escape/js/systems/npc-pathfinding.js');

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'npc-needs-standing-'));
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
const quietSync = fn => {
    const l = console.log, w = console.warn;
    console.log = () => {}; console.warn = () => {};
    try { return fn(); } finally { console.log = l; console.warn = w; }
};
const { NPCBehavior, nearestBlockerOnPath, AVOID_LANE_HALF_PX } = await quiet(() => import(pathToFileURL(join(dir, 'npc-behavior.mjs')).href));

const N = 80, STEP = 8;
const LANE = AVOID_LANE_HALF_PX;   // npc-behavior.js, the lane local avoidance stops for
/** Real EasyStar on a grid open in the given cell rectangles, walls elsewhere. */
function floor(rects) {
    const grid = Array.from({ length: N }, () => new Array(N).fill(1));
    for (const [x1, y1, x2, y2] of rects) for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) grid[y][x] = 0;
    const pm = new NPCPathfindingManager({ time: { delayedCall() {} } });
    pm.worldGrid = grid;
    pm.worldGridBounds = { minX: 0, minY: 0, cols: N, rows: N, step: STEP };
    const pf = new globalThis.EasyStar.js();
    pf.setGrid(grid); pf.setAcceptableTiles([0]); pf.enableDiagonals(); pf.disableCornerCutting();
    pm.worldPathfinder = pf;
    return pm;
}
/** An aisle `h` cells tall (rows 20..) from column 2 to 57. */
const aisle = h => floor([[2, 20, 57, 20 + h - 1]]);
const box = (x, y, w = 20, h = 10, immovable = false) => ({ enable: true, immovable, width: w, height: h, left: x - w / 2, right: x + w / 2, top: y - h / 2, bottom: y + h / 2, center: { x, y } });
const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

/** A stalled needs walker (reroute) on pm, with the standing NPC and chairs in the world. */
function walker(pm, me, standing, chairs = []) {
    window.rooms = { r: { npcSprites: [me, ...standing] } };
    window.player = null;
    window.chairs = chairs.map(body => ({ body }));
    const b = Object.create(NPCBehavior.prototype);
    b.npcId = 'agnieszka';
    b.sprite = me;
    b._moveOwner = 'needs';
    b._moveReroute = true;
    b._moveAvoidRooms = [];
    b.pathfindingManager = pm;
    return b;
}

/** _planMovePath, answered on a later turn as in the game (the tiers nest); the timer is cleared. */
function plan(b, pm, from, to) {
    return new Promise(resolve => {
        const t = setTimeout(() => resolve(null), 1500);
        quietSync(() => b._planMovePath(pm, from.x, from.y, to.x, to.y, p => { clearTimeout(t); resolve(p); }));
    });
}

/** Step a walker body along the path as updatePatrol does (advance within 8 px of a waypoint). */
function follow(path, from, standing, w = 20, h = 10) {
    const pos = { ...from };
    let ticks = 0, stalled = false;
    for (let i = 0; path && i < path.length && !stalled; i++) {
        const wp = path[i];
        const last = i === path.length - 1;
        while (Math.hypot(wp.x - pos.x, wp.y - pos.y) >= (last ? 1 : 8) && ticks < 5000) {
            const d = Math.hypot(wp.x - pos.x, wp.y - pos.y), k = Math.min(2, d) / d;
            const nx = pos.x + (wp.x - pos.x) * k, ny = pos.y + (wp.y - pos.y) * k;
            if (standing.some(s => overlaps(box(nx, ny, w, h), s.body))) { stalled = true; break; }
            pos.x = nx; pos.y = ny; ticks++;
        }
    }
    return { pos, ticks, stalled };
}

/** Step as follow() does but never stop: the deepest overlap (the smaller axis) with the standing body. */
function deepestOverlap(path, from, standing) {
    const pos = { ...from };
    let worst = 0;
    for (let i = 0; i < path.length; i++) {
        const wp = path[i], last = i === path.length - 1;
        for (let t = 0; t < 5000 && Math.hypot(wp.x - pos.x, wp.y - pos.y) >= (last ? 1 : 8); t++) {
            const d = Math.hypot(wp.x - pos.x, wp.y - pos.y), k = Math.min(2, d) / d;
            pos.x += (wp.x - pos.x) * k; pos.y += (wp.y - pos.y) * k;
            const a = box(pos.x, pos.y), g = standing.body;
            if (overlaps(a, g)) worst = Math.max(worst, Math.min(Math.min(a.right, g.right) - Math.max(a.left, g.left), Math.min(a.bottom, g.bottom) - Math.max(a.top, g.top)));
        }
    }
    return worst;
}

/** Plan a stalled walk home along an aisle `h` cells tall past a standing NPC, and follow it. */
async function walkHome(h, { standingY = null, startX = 45 * STEP, chairs = [], me = [20, 10], guard = [20, 10] } = {}) {
    const pm = aisle(h);
    const cy = (20 + h / 2) * STEP;
    const self = { body: box(startX, cy, me[0], me[1]) };
    const standing = { body: box(30 * STEP, standingY ?? cy, guard[0], guard[1]) };
    const b = walker(pm, self, [standing], chairs.map(([x, y]) => box(x, y, 16, 12, true)));
    const calls = [];
    const orig = pm.findWorldPath.bind(pm);
    pm.findWorldPath = (sx, sy, ex, ey, cb, avoidNPCs, opts) => { if (!opts?.ignoreSeated) calls.push(opts?.avoidDynamic?.tight ? 'tight' : opts?.avoidDynamic ? 'ring' : 'plain'); return orig(sx, sy, ex, ey, cb, avoidNPCs, opts); };
    const home = { x: 10 * STEP, y: cy };
    const path = await plan(b, pm, self.body.center, home);
    return { path, calls, home, tier: b._planTier, ...follow(path, self.body.center, [standing], me[0], me[1]) };
}

test('a standing NPC in a 40 px aisle: the returning walker plans round it and gets home', async () => {
    const r = await walkHome(5);
    assert.ok(r.path && r.path.length > 0, 'a path is planned');
    assert.equal(r.tier, 'tight');
    assert.equal(r.stalled, false, `never steps into the standing body (stopped at ${Math.round(r.pos.x)},${Math.round(r.pos.y)})`);
    assert.ok(Math.hypot(r.pos.x - r.home.x, r.pos.y - r.home.y) <= 8, 'and reaches home');
    assert.ok(r.ticks < 400, `within the tick budget (${r.ticks})`);
});

test('wider aisles still route round the standing NPC with the clearance ring', async () => {
    for (const h of [7, 8]) {
        const r = await walkHome(h);
        assert.equal(r.tier, 'ring', `${h} cells`);
        assert.equal(r.stalled, false, `${h} cells`);
        assert.ok(Math.hypot(r.pos.x - r.home.x, r.pos.y - r.home.y) <= 8, `${h} cells: home`);
    }
});

test('an aisle too narrow to pass at all takes the plain path', async () => {
    const r = await walkHome(2);
    assert.ok(r.path && r.path.length > 0, 'the plain path is planned');
    assert.deepEqual(r.calls, ['ring', 'tight', 'plain']);
    assert.equal(r.tier, 'plain');
});

test('R1 M1: a pinch on the way and a home between two chairs: the tight path, not the plain one', async () => {
    // Chairs (held, 16x12) 14 px north and south of the home cell centre
    const cy = 22.5 * STEP;
    const r = await walkHome(5, { chairs: [[10 * STEP, cy - 14], [10 * STEP, cy + 14]] });
    assert.deepEqual(r.calls, ['ring', 'tight'], 'the tight search finds the way home');
    assert.equal(r.tier, 'tight');
    assert.equal(r.stalled, false, `never steps into the standing body (stopped at ${Math.round(r.pos.x)},${Math.round(r.pos.y)})`);
    assert.ok(Math.hypot(r.pos.x - r.home.x, r.pos.y - r.home.y) <= 8, 'and reaches home');
});

test('R1 m1: starting 1 px off the standing NPC, and other body sizes', async () => {
    // Centres 21 px apart (1 px clear), then a larger walker and a larger guard in 48 px.
    const cases = [
        { h: 5, startX: 30 * STEP + 21 },
        { h: 6, startX: 30 * STEP + 24, me: [24, 12] },
        { h: 6, startX: 45 * STEP, guard: [24, 12] },
    ];
    for (const c of cases) {
        const r = await walkHome(c.h, c);
        assert.ok(r.path && r.path.length > 0, `${JSON.stringify(c)}: a path`);
        assert.equal(r.stalled, false, `${JSON.stringify(c)}: no step into the standing body (stopped at ${Math.round(r.pos.x)},${Math.round(r.pos.y)}, ${r.tier})`);
        assert.ok(Math.hypot(r.pos.x - r.home.x, r.pos.y - r.home.y) <= 8, `${JSON.stringify(c)}: home`);
    }
});

// Bounded limit: a walker exactly touching the guard (centres 20 px apart) in a 40 px aisle. The
// path steps off to (268,188) then (260,196); the 8 px waypoint advance turns toward (252,196) at
// about (262,189), where the box still overlaps the guard's corner along one axis. The depth of the
// overlap (the smaller axis) is 0.02 px at 2 px per tick and about 0.3 px at worst, and
// nearestBlockerOnPath finds no blocker on the path, so local avoidance does not stop the walker
// either. Arcade separation resolves a graze that size in one step. A smaller advance on rerouted
// walks or a wider tight margin would cost more (every rerouted walk, or the 40 px aisle), so this
// test bounds it: a change that makes it worse fails. See
// docs/achitechture/reviews/return-stall/REVIEW_R2_OUTCOMES.md.
test('R1 m1: starting exactly touching the standing NPC: overlap at most 1 px deep, no lane stop', async () => {
    const pm = aisle(5);
    const cy = 22.5 * STEP;
    const startX = 30 * STEP + 20;
    const self = { body: box(startX, cy) };
    const standing = { body: box(30 * STEP, cy) };
    const b = walker(pm, self, [standing]);
    const path = await plan(b, pm, self.body.center, { x: 10 * STEP, y: cy });
    assert.ok(path && path.length > 0, 'a path');
    assert.equal(inLane(self.body.center, path, standing), null, 'no lane stop on this path');
    const worst = deepestOverlap(path, self.body.center, standing);
    assert.ok(worst <= 1, `deepest overlap ${worst.toFixed(2)} px`);
});

// m08, games 9336 and 9356 (reviews/return-stall/DIAGNOSIS_M08.md): Agnieszka's walk home stopped at body (505.5,162.7),
// 11 px below Vector (standing, body centre (486.4,152.7)). Each re-plan and detour from there gave the
// same path along y 164, inside local avoidance's 13 px lane round Vector, because the ring tier left
// ring cells open within 2 cells of the start. 3 s re-issues, then return_stuck and a 15 s back-off.
const m08 = () => {
    const pm = floor([[50, 12, 68, 22]]);   // open office floor, x 400..551, y 96..183
    const me = { body: box(505.5, 162.7) };
    const vector = { body: box(486.4, 152.7) };
    return { pm, me, vector, home: { x: 422.4, y: 162.9 } };
};
const inLane = (from, path, blocker) => nearestBlockerOnPath(from, path, [{ x: blocker.body.center.x, y: blocker.body.center.y, id: 'v' }], 10000, LANE, 0);

test('m08: a rerouted walk home is never planned into the avoidance lane of a standing NPC', async () => {
    const { pm, me, vector, home } = m08();
    const b = walker(pm, me, [vector]);
    const path = await plan(b, pm, me.body.center, home);
    assert.ok(path && path.length > 0, 'a path home');
    assert.equal(b._planTier, 'ring');
    assert.equal(inLane(me.body.center, path, vector), null,
        `the path keeps ${LANE} px clear of Vector: ${JSON.stringify(path.slice(0, 4))}`);
    const f = follow(path, me.body.center, [vector]);
    assert.equal(f.stalled, false);
    assert.ok(Math.hypot(f.pos.x - home.x, f.pos.y - home.y) <= 8, 'home');
});

test('m08: the local detour from the stop is not the same blocked path', async () => {
    const { pm, me, vector, home } = m08();
    const b = walker(pm, me, [vector]);
    b.patrolTarget = home;
    b.npcBodyPos = () => me.body.center;
    const a = { pending: false, gaveUp: false };
    b._avoid = a;
    await new Promise(resolve => { quietSync(() => b._requestDetour(a)); setTimeout(resolve, 50); });
    assert.equal(a.gaveUp, false, 'a detour is found');
    assert.equal(b._detourTier, 'held');
    assert.equal(inLane(me.body.center, b.currentPath, vector), null,
        `the detour keeps ${LANE} px clear of Vector: ${JSON.stringify(b.currentPath.slice(0, 4))}`);
});

test('R1 m3: the local detour tries the tight search between the held and plain ones', async () => {
    const pm = aisle(5);
    const cy = 22.5 * STEP;
    const me = { body: box(45 * STEP, cy) };
    const guard = { body: box(30 * STEP, cy) };
    const b = walker(pm, me, [guard]);
    b.patrolTarget = { x: 10 * STEP, y: cy };
    b.npcBodyPos = () => me.body.center;
    b._moveAvoidRooms = ['x'];
    const calls = [];
    const orig = pm.findWorldPath.bind(pm);
    pm.findWorldPath = (sx, sy, ex, ey, cb, avoidNPCs, opts) => { if (!opts?.ignoreSeated) calls.push(opts); return orig(sx, sy, ex, ey, cb, avoidNPCs, opts); };
    const a = { pending: false, gaveUp: false };
    b._avoid = a;
    await new Promise(resolve => { quietSync(() => b._requestDetour(a)); setTimeout(resolve, 50); });
    assert.equal(calls.length, 2, 'held, then tight');
    assert.equal(calls[0].avoidDynamic.includeHeld, true);
    assert.equal(calls[1].avoidDynamic.tight, true);
    assert.deepEqual(calls[1].avoidRooms, ['x'], 'with the room leash');
    assert.equal(b._detourTier, 'tight');
    const f = follow(b.currentPath, me.body.center, [guard]);
    assert.equal(f.stalled, false);
});

test('R1 m4: the tight tier keeps the clearance ring round the player', async () => {
    const pm = aisle(5);
    const cy = 22.5 * STEP;
    const me = { body: box(45 * STEP, cy) };
    const b = walker(pm, me, []);
    window.player = { body: box(30 * STEP, cy, 20, 10, false) };
    const path = await plan(b, pm, me.body.center, { x: 10 * STEP, y: cy });
    window.player = null;
    assert.equal(b._planTier, 'plain', 'no held-aware path past a player in a 40 px aisle: the plain path and the pass rules');
    assert.ok(path && path.length > 0);
});

test('R2 m1: a standing NPC 20 px east of the home with a chair 14 px west: a held-aware path, outside his lane', async () => {
    // Open floor; home (84,180); a held chair (16x12) 14 px west; a standing NPC touching the walker's box at home.
    const pm = floor([[2, 10, 57, 35]]);
    const home = { x: 84, y: 180 };
    const me = { body: box(200, 180) };
    const guard = { body: box(104, 180) };
    const b = walker(pm, me, [guard], [box(70, 180, 16, 12, true)]);
    const path = await plan(b, pm, me.body.center, home);
    assert.ok(path && path.length > 0, 'a path home');
    assert.notEqual(b._planTier, 'plain', 'the ring or tight search finds it, not the plain path');
    assert.equal(inLane(me.body.center, path, guard), null, `the path keeps ${LANE} px clear of him: ${JSON.stringify(path.slice(-4))}`);
    // Touching at home, so the 8 px advance on the last turn grazes his corner (3.2 px deep at 2 px
    // per tick, inside the 32 px near-arrival radius and not on the lane); bounded, not zero.
    const worst = deepestOverlap(path, me.body.center, guard);
    // The bound is 3.5 px, not 4: the 3.2 px graze is this layout's measured value, while a plain
    // head-on arrival gives 4.00 px (the 4 px snap between the home point and its cell centre, on
    // the previous engine too). A bound of 4 would pass a rise from 3.2 to 4.0; 3.5 holds it.
    assert.ok(worst <= 3.5, `deepest overlap ${worst.toFixed(2)} px`);
});

/** Plan home on open floor past a standing NPC; the path and the lane check from the start. */
async function probe({ start, home, guard, chair = null }) {
    const pm = floor([[2, 10, 75, 40]]);
    const me = { body: box(start.x, start.y) };
    const g = { body: box(guard.x, guard.y) };
    const b = walker(pm, me, [g], chair ? [box(chair.x, chair.y, 16, 12, true)] : []);
    const path = await plan(b, pm, me.body.center, home);
    return { b, path, me, g, lane: path ? inLane(me.body.center, path, g) : undefined, worst: path ? deepestOverlap(path, me.body.center, g) : 0 };
}

test('R3 m1 (a): arriving from the standing NPC\'s side (he stands between the start and the home): ring tier, outside his lane', async () => {
    // Home (200,180); the NPC 20 px west of it, on the approach from the west, on the line and 10 px off it;
    // a chair 14 px east of the home in the second case. (Behind the home, 20 px past it, the path ends
    // in his lane by design: the goal cell is exempt and the 32 px arrival guard ends the walk.)
    for (const [guard, chair] of [[{ x: 180, y: 180 }, null], [{ x: 180, y: 170 }, { x: 214, y: 180 }], [{ x: 180, y: 190 }, { x: 214, y: 180 }]]) {
        const r = await probe({ start: { x: 80, y: 180 }, home: { x: 200, y: 180 }, guard, chair });
        const tag = JSON.stringify(guard);
        assert.ok(r.path && r.path.length > 0, `a path home ${tag}`);
        assert.equal(r.b._planTier, 'ring', tag);
        assert.equal(r.lane, null, `${tag} the path keeps ${LANE} px clear of him: ${JSON.stringify(r.path.slice(-5))}`);
        assert.ok(r.worst <= 4, `${tag} deepest overlap ${r.worst.toFixed(2)} px`);
    }
});

test('R3 m1 (b): the standing NPC on the 14 to 20 px diagonal of the home: ring tier, outside his lane', async () => {
    for (const [dx, dy] of [[17, 17], [-17, 17], [14, -20], [20, 14]]) {
        const home = { x: 200, y: 180 };
        const r = await probe({ start: { x: 320, y: 180 }, home, guard: { x: home.x + dx, y: home.y + dy }, chair: { x: 186, y: 180 } });
        assert.ok(r.path && r.path.length > 0, `a path home (${dx},${dy})`);
        assert.equal(r.b._planTier, 'ring', `(${dx},${dy})`);
        assert.equal(r.lane, null, `(${dx},${dy}) the path keeps ${LANE} px clear: ${JSON.stringify(r.path.slice(-5))}`);
        assert.ok(r.worst <= 4, `(${dx},${dy}) deepest overlap ${r.worst.toFixed(2)} px`);
    }
});

test('R3 m1 (c): a 5 to 8 cell walk with the standing NPC near the start keeps the m08 start fix (the goal-side rule does not undo it)', async () => {
    // The m08 start (505.5,162.7) with Vector 11.3 px off the y 164 leg; the home 5, 6, 7 and 8 cells west.
    for (const cells of [5, 6, 7, 8]) {
        const r = await probe({ start: { x: 505.5, y: 162.7 }, home: { x: 505.5 - cells * STEP, y: 162.7 }, guard: { x: 486.4, y: 152.7 } });
        assert.ok(r.path && r.path.length > 0, `a path home (${cells} cells)`);
        assert.equal(r.lane, null, `${cells} cells: the path keeps ${LANE} px clear of Vector: ${JSON.stringify(r.path.slice(0, 4))}`);
    }
});

// Return stall R4: the re-issue after return_resumed. The needs layer used to leave `reroute` off the
// first one, so the behaviour layer planned the plain path from the stop; from (508,164) that ran along
// y 164, 10.6 px off Vector, inside his lane, and local avoidance held her about 6 s (m08 game 9532,
// scenarios/m08_the_mole/office_life/LIVE_RETURN_STALL.md). The flag comes from the real needs layer
// here, is applied by the real goToAndStay, and the plan is the real _planMovePath.
test('R4: the first re-issue after return_resumed plans round Vector, not the plain path through his lane', async () => {
    // A clerk wedged on the way home in the stub world; take the move the needs layer issues on the first resume.
    const w = makeWorld({
        npcs: { clerk: { pos: { x: 100, y: 100 }, rec: { id: 'clerk', needsHome: 'clerk_pc', needs: { caffeine: { decayPerMin: 8, urgentAt: 30, initial: 50, jitterPct: 0 } } } } },
        objects: [
            { id: 'clerk_pc', x: 100, y: 68, affordance: { accepts: ['found_item'], useSeconds: 10 } },
            { id: 'coffee_machine', x: 300, y: 300, affordance: { satisfies: 'caffeine', restores: 70, useSeconds: 40 } }
        ],
        arrive: false
    });
    const sys = new NPCNeedsSystem(w.world, { seed: 1, manualClock: true });
    w.attach(sys); sys.registerAll();
    let guard = 0;
    while (sys.states.get('clerk').job?.phase !== 'goto_target' && guard++ < 4000) sys.step(NEEDS_TICK_MS);
    const job = sys.states.get('clerk').job;
    w.pos.clerk.x = job.dest.x; w.pos.clerk.y = job.dest.y;
    sys.onArrived('clerk', 'needs', { x: job.dest.x, y: job.dest.y, moveId: job.moveId });
    sys.step(41000);
    assert.equal(sys.getState('clerk').mode, 'returning');
    w.pos.clerk.x = 200; w.pos.clerk.y = 200;
    sys.step(NEEDS_TICK_MS);
    sys.step(RETURN_YIELD_MS + NEEDS_TICK_MS);
    assert.equal(sys.getLog().filter(e => e.npc === 'clerk' && e.ev === 'return_resumed').length, 1, 'the first resume');
    const mv = w.calls.moves.filter(m => m.id === 'clerk').at(-1);

    const { pm, me, vector, home } = m08();
    me.body = box(508, 164);
    // The test stubs these globals; put them back so later tests in the file see what they set up.
    const saved = { seating: window.seating, rooms: window.rooms, player: window.player, chairs: window.chairs };
    try {
        const b = walker(pm, me, [vector]);
        window.seating = null;
        b._moveReroute = false;
        b.config = { patrol: {} };
        b.sprite.body.setVelocity = () => {};
        b.npcBodyPos = () => me.body.center;
        b.playAnimation = () => {};
        quietSync(() => b.goToAndStay(home.x, home.y, 80, { owner: 'needs', yieldToPlayer: false, ...(mv.reroute ? { reroute: true } : {}) }));
        const path = await plan(b, pm, me.body.center, home);
        assert.ok(path && path.length > 0, 'a path home');
        assert.equal(b._planTier, 'ring');
        assert.equal(inLane(me.body.center, path, vector), null, `the re-issued path keeps ${LANE} px clear of Vector: ${JSON.stringify(path.slice(0, 4))}`);
    } finally {
        for (const [k2, v] of Object.entries(saved)) { if (v === undefined) delete window[k2]; else window[k2] = v; }
    }
});

// R4 m2: findWorldPath called with avoidDynamic and no laneHalf keeps the old, stricter behaviour:
// the whole clearance ring round the standing NPC stays, the goal-side release does not happen. A
// refactor that turns the null default into a number would let the path cut closer and fail this.
test('R4 m2: no laneHalf passed: the whole ring round the standing NPC stays (no goal-side release)', async () => {
    const run = laneHalf => {
        const pm = floor([[2, 10, 75, 40]]);
        const me = { body: box(80, 180) };
        const g = { body: box(180, 180) };   // the R3 m1 (a) geometry: 20 px west of the home (200,180)
        walker(pm, me, [g]);
        return new Promise(resolve => {
            const t = setTimeout(() => resolve(null), 1500);
            quietSync(() => pm.findWorldPath(80, 180, 200, 180, p => { clearTimeout(t); resolve(p); }, false,
                { avoidDynamic: { exceptSprite: me, includeHeld: true, ...(laneHalf === undefined ? {} : { laneHalf }) } }));
        });
    };
    // Closest a waypoint on the approach (west of the goal cell's own column) comes to his centre.
    const closest = path => Math.min(...path.filter(p => p.x < 200).map(p => Math.hypot(p.x - 180, p.y - 180)));
    const without = await run(undefined);
    const withLane = await run(LANE);
    assert.ok(without && without.length > 0, 'a path home without laneHalf');
    assert.ok(withLane && withLane.length > 0, 'a path home with laneHalf');
    // Control: the release is real, so passing the lane width lets the path pass closer to him.
    assert.ok(closest(withLane) < closest(without), `released ${closest(withLane).toFixed(1)} px vs whole ring ${closest(without).toFixed(1)} px`);
    // The whole ring stays: one cell of clearance either side of his 20x10 body plus the walker's reach.
    assert.ok(closest(without) >= 24, `kept ${closest(without).toFixed(1)} px clear of him`);
});
