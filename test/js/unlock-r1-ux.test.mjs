// Unlock gaps R1 UX pass (2026-11-12): where a KO'd NPC's items land (npc-hostile.js
// koDropSpots), and which password locks get the case-lock look (password-minigame.js
// isCaseLockTarget).
// Run with: node --test test/js/unlock-r1-ux.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const read = (p) => readFileSync(join(js, p), 'utf8');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.window = { rooms: {} };
const swap = (src) => src
    .split("'../config/combat-config.js'").join(`'${dataUrl(read('config/combat-config.js'))}'`)
    .split("'./interaction-walls.js'").join(`'${dataUrl(read('systems/interaction-walls.js'))}'`)
    .split("'../events/combat-events.js'").join(`'${dataUrl(read('events/combat-events.js'))}'`)
    .split("'./npc-sprites.js'").join(`'${dataUrl('export const getNPCDirection = () => "down";')}'`);
const { koDropSpots, koReachableCells, KO_DROP_MIN_GAP } = await import(dataUrl(swap(read('systems/npc-hostile.js'))));
const { roomIdAtFeet, roomFloorRect } = await import(dataUrl(read('systems/interaction-walls.js')));

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// An 8 px world grid, 0 walkable and 1 blocked, built from a cell predicate
const STEP = 8;
function makeGrid(cols, rows, blocked) {
    const grid = [];
    for (let cy = 0; cy < rows; cy++) {
        grid.push([]);
        for (let cx = 0; cx < cols; cx++) grid[cy].push(blocked(cx, cy) ? 1 : 0);
    }
    return { grid, bounds: { minX: 0, minY: 0, cols, rows, step: STEP } };
}
const cellOf = (p) => [Math.floor(p.x / STEP), Math.floor(p.y / STEP)];
const isWalkable = (g, p) => { const [cx, cy] = cellOf(p); return g.grid[cy]?.[cx] === 0; };
// Every spot must be on a reached cell: reached from the feet by the same fill
function assertReached(spots, reached) {
    const keys = new Set(reached.map(c => `${Math.round(c.x)},${Math.round(c.y)}`));
    for (const s of spots) assert.ok(keys.has(`${s.x},${s.y}`), `not a reached cell: ${JSON.stringify(s)}`);
}

test('drops land at least 32 px from the body and from each other, on open floor', () => {
    const feet = { x: 200, y: 200 };
    const g = makeGrid(60, 60, () => false);
    const reachable = koReachableCells(feet, g);
    const spots = koDropSpots(feet, 3, { reachable });
    assert.equal(spots.length, 3);
    for (const s of spots) assert.ok(dist(s, feet) >= KO_DROP_MIN_GAP * 0.75, JSON.stringify(s));
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) assert.ok(dist(spots[i], spots[j]) >= KO_DROP_MIN_GAP);
    assertReached(spots, reachable);
});

test('a drop avoids furniture that would hide it', () => {
    const feet = { x: 200, y: 200 };
    const g = makeGrid(60, 60, () => false);
    // A desk drawn right below the body, where the first choice would be
    const desk = { x: 150, y: 215, w: 100, h: 60 };
    const [spot] = koDropSpots(feet, 1, { reachable: koReachableCells(feet, g), obstacles: [desk] });
    const r = { x: spot.x - 16, y: spot.y - 16, w: 32, h: 32 };
    const overlaps = r.x < desk.x + desk.w && r.x + r.w > desk.x && r.y < desk.y + desk.h && r.y + r.h > desk.y;
    assert.equal(overlaps, false, JSON.stringify(spot));
});

test('R2 live: with desks over the rings, drops go to clear floor further out before under a desk', () => {
    // As in test_unlock_gaps: the body by the east wall, desks drawn over walkable floor
    // round it, open floor about 100 px to the west
    const g = makeGrid(60, 60, (cx) => cx >= 37);
    const feet = { x: 284, y: 112 };
    const desks = [{ x: 210, y: 100, w: 86, h: 110 }];
    const spots = koDropSpots(feet, 4, { reachable: koReachableCells(feet, g), obstacles: desks });
    const hidden = (s) => s.x + 16 > 210 && s.x - 16 < 296 && s.y + 16 > 100 && s.y - 16 < 210;
    for (const s of spots) assert.equal(hidden(s), false, `under the desk: ${JSON.stringify(s)}`);
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) assert.ok(dist(spots[i], spots[j]) >= KO_DROP_MIN_GAP);
});

test('R2 M1: no drop lands behind a wall or in the next room', () => {
    // Two rooms side by side: room A is x < 296, a 32 px wall band at x 296 to 327, room B beyond.
    // The NPC falls 12 px west of the wall, as in the review's node case.
    const g = makeGrid(80, 60, (cx) => cx >= 37 && cx < 41);
    const inRoom = (x) => x < 296;
    const feet = { x: 284, y: 228 };
    for (const count of [2, 3, 5]) {
        const reachable = koReachableCells(feet, { ...g, inRoom: (x, y) => inRoom(x, y) });
        const spots = koDropSpots(feet, count, { reachable });
        assert.equal(spots.length, count);
        for (const s of spots) {
            assert.ok(s.x < 296, `behind the wall: ${JSON.stringify(s)}`);
            assert.ok(isWalkable(g, s), `not walkable: ${JSON.stringify(s)}`);
        }
        assertReached(spots, reachable);
    }
    // Even with no room check, the fill cannot cross the wall band
    const noRoom = koReachableCells(feet, g);
    assert.ok(noRoom.every(c => c.x < 296));
});

test('R2 M1: a walled-off pocket is never used', () => {
    // A ring of desks round an empty 3x3 pocket just below the body
    const pocket = (cx, cy) => cx >= 24 && cx <= 26 && cy >= 28 && cy <= 30;
    const ring = (cx, cy) => cx >= 23 && cx <= 27 && cy >= 27 && cy <= 31 && !pocket(cx, cy);
    const g = makeGrid(60, 60, ring);
    const feet = { x: 200, y: 200 };
    const reachable = koReachableCells(feet, g);
    const spots = koDropSpots(feet, 4, { reachable });
    for (const s of spots) {
        const [cx, cy] = cellOf(s);
        assert.equal(pocket(cx, cy), false, `in the pocket: ${JSON.stringify(s)}`);
    }
});

test('R2 M1: a one-cell corridor takes the drops along its length, none in the walls', () => {
    // Only row 25 is walkable, from x cell 5 to 55
    const g = makeGrid(60, 50, (cx, cy) => !(cy === 25 && cx >= 5 && cx <= 55));
    const feet = { x: 30 * STEP + 4, y: 25 * STEP + 4 };
    const reachable = koReachableCells(feet, g);
    const spots = koDropSpots(feet, 3, { reachable });
    assert.equal(spots.length, 3);
    for (const s of spots) assert.ok(isWalkable(g, s), JSON.stringify(s));
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) assert.ok(dist(spots[i], spots[j]) >= KO_DROP_MIN_GAP);
});

test('R2 M1: many items in a short dead end stack on reached cells, never in a wall', () => {
    // A 4-cell stub (x cells 10 to 13 on row 10), body at its end
    const g = makeGrid(30, 30, (cx, cy) => !(cy === 10 && cx >= 10 && cx <= 13));
    const feet = { x: 10 * STEP + 4, y: 10 * STEP + 4 };
    const reachable = koReachableCells(feet, g);
    assert.equal(reachable.length, 4);
    const spots = koDropSpots(feet, 9, { reachable });
    assert.equal(spots.length, 9);
    for (const s of spots) assert.ok(isWalkable(g, s), JSON.stringify(s));
    assertReached(spots, reachable);
});

test('R2 M1: a body on a blocked cell starts from the walkable cell beside it, in its own room', () => {
    // The body cell (25, 25) is blocked clearance; walkable floor starts one cell down
    const g = makeGrid(60, 60, (cx, cy) => cy <= 25);
    const feet = { x: 25 * STEP + 4, y: 25 * STEP + 4 };
    const reachable = koReachableCells(feet, g);
    assert.ok(reachable.length > 0);
    assert.ok(reachable.every(c => c.y > 26 * STEP - 1));
});

test('R3 m1: a body inside the east wall strip drops on the floor, never in the sealed column', () => {
    // A 320 px room built as collision.js builds it: the east wall tile (x 288 to 320) has
    // its 8 px box at x 288 to 296, the west wall tile's at x 24 to 32, the south wall
    // row's at y 312 to 320; the back wall is the top two rows. The grid pads each box by
    // one 8 px cell, so x 280 to 304 is blocked and x 304 to 320 is a sealed walkable column.
    const rooms = { office: { position: { x: 0, y: 0 }, map: { width: 10, height: 10, tileWidth: 32, tileHeight: 32, widthInPixels: 320, heightInPixels: 320 } } };
    const g = makeGrid(40, 40, (cx, cy) =>
        cy < 8 || (cx >= 35 && cx <= 37) || (cx >= 2 && cx <= 4) || (cy >= 38 && cy <= 40));
    const floor = roomFloorRect(rooms.office);
    const inRoom = (x, y) => roomIdAtFeet(x, y, rooms, 0) === 'office';
    for (const feet of [{ x: 294, y: 160 }, { x: 298, y: 160 }, { x: 286, y: 160 }]) {
        // Without the floor bound the fault reproduces for a body deep in the strip
        if (feet.x === 294) {
            const unbounded = koReachableCells(feet, { ...g, inRoom });
            assert.ok(unbounded.length > 0 && unbounded.every(c => c.x > 304), 'expected the sealed column without the floor bound');
        }
        const reachable = koReachableCells(feet, { ...g, inRoom, floor });
        assert.ok(reachable.length > 0, `no floor reached from ${JSON.stringify(feet)}`);
        for (const count of [1, 3, 5]) {
            const spots = koDropSpots(feet, count, { reachable });
            assert.equal(spots.length, count);
            for (const s of spots) {
                assert.ok(s.x < 288, `beyond the strip from ${JSON.stringify(feet)}: ${JSON.stringify(s)}`);
                assert.ok(s.x >= floor.left && s.x <= floor.right && s.y >= floor.top && s.y <= floor.bottom, `off the floor: ${JSON.stringify(s)}`);
                assert.ok(isWalkable(g, s), `not walkable: ${JSON.stringify(s)}`);
            }
            assertReached(spots, reachable);
        }
    }
});

test('with no grid, every drop lands on the body', () => {
    const feet = { x: 100, y: 100 };
    for (const reachable of [null, []]) {
        const spots = koDropSpots(feet, 3, { reachable });
        assert.equal(spots.length, 3);
        for (const s of spots) assert.ok(dist(s, feet) <= 4.5, JSON.stringify(s));
    }
    assert.deepEqual(koReachableCells(feet, {}), []);
});

test('a bag or case gets the case-lock look; a PC or a safe keeps its own', async () => {
    const src = read('minigames/password/password-minigame.js');
    const m = src.match(/export const CASE_LOCK_TYPES = [^\n]+\nexport function isCaseLockTarget[\s\S]*?\n}\n/);
    assert.ok(m, 'isCaseLockTarget is exported');
    const { isCaseLockTarget } = await import(dataUrl(m[0]));
    for (const type of ['bag1', 'briefcase', 'suitcase']) assert.equal(isCaseLockTarget({ type }), true, type);
    for (const type of ['pc', 'laptop', 'safe', undefined]) assert.equal(isCaseLockTarget({ type }), false, String(type));
    assert.equal(isCaseLockTarget(undefined), false);
});
