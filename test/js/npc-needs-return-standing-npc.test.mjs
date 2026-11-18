// A returning needs NPC steps round a standing NPC that fills an aisle the clearance ring closes
// (m08 game 9155: Agnieszka stalled for over a minute 22 px from Vector), and is never planned
// into the local avoidance lane of a standing NPC (m08 games 9336, 9356: DIAGNOSIS_M08). Real
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
const { NPCBehavior, nearestBlockerOnPath } = await quiet(() => import(pathToFileURL(join(dir, 'npc-behavior.mjs')).href));

const N = 80, STEP = 8;
const LANE = 13;   // AVOID_LANE_HALF_PX in npc-behavior.js
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

// Open, by design: a walker exactly touching the guard (centres 20 px apart) in a 40 px aisle. The
// path steps off to (268,188) then (260,196); the 8 px waypoint advance turns toward (252,196) at
// about (262,189), where the box still overlaps the guard's corner by a pixel or two. Fixing it
// means a smaller advance radius on rerouted walks (orbit risk at speed, touches every needs walk)
// or a wider tight margin (loses the 40 px aisle). Physics slides off a graze; see
// tmp/rs/REVIEW_R1_OUTCOMES.md.
test('R1 m1: starting exactly touching the standing NPC', { todo: 'design decision: waypoint advance radius or tight margin (tmp/rs/REVIEW_R1_OUTCOMES.md)' }, async () => {
    const r = await walkHome(5, { startX: 30 * STEP + 20 });
    assert.ok(r.path && r.path.length > 0, 'a path');
    assert.equal(r.stalled, false, `no step into the standing body (stopped at ${Math.round(r.pos.x)},${Math.round(r.pos.y)})`);
});

// m08, games 9336 and 9356 (DIAGNOSIS_M08.md): Agnieszka's walk home stopped at body (505.5,162.7),
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
