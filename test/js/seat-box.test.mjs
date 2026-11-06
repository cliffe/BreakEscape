// Seat box geometry (systems/seat-box.js; docs/achitechture/SEAT_BOX_PLAN.md slice 1):
// blocks per seat family, the walking-box and line checks, the chair's rectangle, the local
// stand grid, the snap and flood over it, and sweepBlock. Fake bodies only.
// Run with: node test/js/seat-box.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { installEasyStar } from './fixtures/world-grid-fixture.mjs';

globalThis.window = globalThis.window || {};
installEasyStar();
const sb = await import('../../public/break_escape/js/systems/seat-box.js');
const { NPCPathfindingManager } = await import('../../public/break_escape/js/systems/npc-pathfinding.js');

// ── fake physics ────────────────────────────────────────────────────────────
const iter = list => ({ iterate(fn) { list.forEach(fn); } });
/** A body with a fixed rectangle. static: physicsType 1; dynamic ones block only if immovable. */
function body(left, top, w, h, { kind = 'static', immovable = false, enable = true, go = {} } = {}) {
    return { left, top, right: left + w, bottom: top + h, width: w, height: h, enable, immovable,
             physicsType: kind === 'static' ? 1 : 0, gameObject: go };
}
function scene(statics = [], dynamics = [], bounds = { x: 0, y: 0, width: 320, height: 320 }) {
    return { time: { delayedCall() {} },
             physics: { world: { bounds, staticBodies: iter(statics), bodies: iter(dynamics) } } };
}
// desk1 as in the experiments: x 48..126, floor footprint y 264..280 (F 280, foot 16)
const DESK = () => body(48, 264, 78, 16, { go: { name: 'desk1' } });

// ── blocks ──────────────────────────────────────────────────────────────────
test('blockFor: office chairs get the 18 x 8 body block; white and exec chairs have none yet', () => {
    for (const base of ['chair-darkgray-1-rotate', 'chair-grey-1-rotate', 'chair-grey-4-rotate']) {
        assert.deepEqual(sb.blockFor({ originalTexture: `${base}3` }), { w: 18, h: 8, cx: 20, cy: 35 }, base);
    }
    for (const base of ['chair-white-1-rotate', 'chair-white-2-rotate', 'chair-exec-rotate']) {
        assert.equal(sb.blockFor({ originalTexture: `${base}1` }), null, base);
    }
    assert.equal(sb.blockFor({ texture: { key: 'desk1' } }), null);
    // the block width rule: never narrower than the walking box
    for (const [k, b] of Object.entries(sb.SEAT_BLOCKS)) assert.ok(b.w >= sb.WALK_BOX.w, k);
    // office40 is the existing body { w 18, h 8, x 11, y 31 } centred
    const o = sb.SEAT_BLOCKS.office40;
    assert.deepEqual([o.cx - o.w / 2, o.cy - o.h / 2], [11, 31]);
});

// ── walkBoxClear ────────────────────────────────────────────────────────────
test('walkBoxClear: desks, walls and immovable bodies block; movable and disabled bodies do not', () => {
    const wall = body(0, 0, 320, 32, { kind: 'dynamic', immovable: true, go: { name: 'wall' } });
    const crate = body(150, 100, 20, 10, { kind: 'dynamic', immovable: false });
    const off = body(200, 100, 20, 20, { enable: false });
    const s = scene([DESK(), off], [wall, crate]);
    assert.equal(sb.walkBoxClear(s, 87, 250), true, 'clear above the desk');
    assert.equal(sb.walkBoxClear(s, 87, 260), false, 'box bottom 265 overlaps the desk top 264');
    assert.equal(sb.walkBoxClear(s, 87, 259), true, 'box bottom 264 only touches it');
    assert.equal(sb.walkBoxClear(s, 87, 36), false, 'the wall strip (immovable dynamic) counts');
    assert.equal(sb.walkBoxClear(s, 160, 105), true, 'a movable body does not');
    assert.equal(sb.walkBoxClear(s, 210, 110), true, 'a disabled body does not');
});

test('walkBoxClear: ignore is a list of game objects; an immovable sitter not in it blocks', () => {
    const sitterGo = { name: 'tomasz' };
    const sitter = body(80, 200, 18, 10, { kind: 'dynamic', immovable: true, go: sitterGo });
    const s = scene([], [sitter]);
    assert.equal(sb.walkBoxClear(s, 89, 205), false);
    assert.equal(sb.walkBoxClear(s, 89, 205, { ignore: [sitterGo] }), true);
    assert.equal(sb.walkBoxClear(s, 89, 205, { ignore: [{ name: 'someone else' }] }), false);
});

test('walkBoxClear: the chair counts through extra rectangles (a cell 8 px from the castor is rejected)', () => {
    const s = scene([], []);
    // chair body 18 x 8, castor base (87, 240): rectangle x 78..96, y 236..244
    const chair = { x: 78, y: 236, w: 18, h: 8 };
    assert.equal(sb.walkBoxClear(s, 87, 232, { extra: [chair] }), false, '8 px north of the castor');
    assert.equal(sb.walkBoxClear(s, 87, 230, { extra: [chair] }), true, 'box bottom 235 is clear of the chair top 236');
    assert.equal(sb.walkBoxClear(s, 87, 232), true, 'without the chair the cell is clear');
    // the same cell passes the line check (the line ignores the chair)
    assert.equal(sb.pathClear(s, { x: 87, y: 240 }, { x: 87, y: 232 }), true);
});

// ── pathClear ───────────────────────────────────────────────────────────────
test('pathClear: a desk between the castor and the spot blocks; the chair and sitter are ignored', () => {
    const chairGo = { name: 'chair' }, sitterGo = { name: 'player' };
    const chairBody = body(78, 256, 18, 8, { kind: 'dynamic', immovable: true, go: chairGo });
    const sitter = body(78, 254, 18, 10, { kind: 'dynamic', immovable: true, go: sitterGo });
    const s = scene([DESK()], [chairBody, sitter]);
    const castor = { x: 87, y: 260 };
    assert.equal(sb.pathClear(s, castor, { x: 87, y: 290 }, { ignore: [chairGo, sitterGo] }), false, 'across the desk');
    assert.equal(sb.pathClear(s, castor, { x: 87, y: 236 }, { ignore: [chairGo, sitterGo] }), true, 'near side');
    assert.equal(sb.pathClear(s, castor, { x: 87, y: 236 }), false, 'the chair is in the way unless ignored');
    // a wall box counts as well as a desk
    const wall = body(100, 200, 8, 80, { kind: 'dynamic', immovable: true });
    assert.equal(sb.pathClear(scene([], [wall]), { x: 90, y: 240 }, { x: 120, y: 240 }), false);
    // a thin desk (4 px) on a 32 px line is still hit
    const thin = body(0, 250, 320, 4);
    assert.equal(sb.pathClear(scene([thin], []), { x: 50, y: 236 }, { x: 50, y: 268 }), false);
});

// ── chairRect ───────────────────────────────────────────────────────────────
test('chairRect follows the sprite, not a stale disabled body (R3 M2)', () => {
    // chair sprite at (60, 220) with the office body offset (11, 31); its body was disabled when
    // the player sat at (60, 220), then the chair rolled 30 px east with the player
    const chair = { x: 90, y: 220, displayOriginX: 0, displayOriginY: 0, scaleX: 1, scaleY: 1,
        body: { enable: false, offset: { x: 11, y: 31 }, width: 18, height: 8, left: 71, top: 251, right: 89, bottom: 259 } };
    const r = sb.chairRect(chair);
    assert.deepEqual(r, { x: 101, y: 251, w: 18, h: 8 });
    const s = scene([], []);
    // a spot clear of the old body but on the new rectangle is rejected...
    assert.equal(sb.walkBoxClear(s, 110, 249, { extra: [r] }), false);
    // ...and one on the old body but clear of the new rectangle passes
    assert.equal(sb.walkBoxClear(s, 80, 255, { extra: [r] }), true);
    // origin and scale as bodyFeet reads them
    const scaled = { x: 100, y: 100, displayOriginX: 20, displayOriginY: 20, scaleX: 2, scaleY: 2,
        body: { offset: { x: 11, y: 31 }, width: 36, height: 16 } };
    assert.deepEqual(sb.chairRect(scaled), { x: 82, y: 122, w: 36, h: 16 });
    assert.equal(sb.chairRect({ x: 0, y: 0 }), null);
});

// ── the local stand grid ────────────────────────────────────────────────────
function pmFor(s) { return new NPCPathfindingManager(s); }
/** Cells (padded as the grid builder pads) a body's rectangle marks. */
function padded(b, { minX, minY, cols, rows, step }) {
    const cx1 = Math.max(0, Math.floor((b.left - minX) / step) - 1);
    const cy1 = Math.max(0, Math.floor((b.top - 2 - minY) / step));
    const cx2 = Math.min(cols - 1, Math.floor((b.right - minX - 1) / step) + 1);
    const cy2 = Math.min(rows - 1, Math.floor((b.bottom + 2 - minY - 1) / step));
    const out = new Set();
    for (let y = cy1; y <= cy2; y++) for (let x = cx1; x <= cx2; x++) out.add(`${x},${y}`);
    return out;
}
/** Compare the local grid with the full one: only cells of the excluded bodies may open. */
function checkLocal(pm, excludedBodies, others) {
    const full = pm.buildWorldGrid();
    const local = sb.localStandGrid(pm, { exclude: excludedBodies.map(b => b.gameObject) });
    assert.deepEqual(local.bounds, full.bounds, 'full size, same bounds');
    const mayOpen = new Set(excludedBodies.flatMap(b => [...padded(b, full.bounds)]));
    const otherCells = new Set(others.flatMap(b => [...padded(b, full.bounds)]));
    let opened = 0;
    for (let y = 0; y < full.grid.length; y++) for (let x = 0; x < full.grid[y].length; x++) {
        const k = `${x},${y}`;
        if (full.grid[y][x] === local.grid[y][x]) continue;
        assert.ok(mayOpen.has(k) && full.grid[y][x] === 1 && local.grid[y][x] === 0, `cell ${k} changed`);
        assert.ok(!otherCells.has(k), `cell ${k} is another body's and opened`);
        opened++;
    }
    return { full, local, opened };
}

test('localStandGrid: chair and sitter cells open, a desk-covered cell stays blocked, nothing else changes', () => {
    const chairGo = { name: 'chair' }, sitterGo = { name: 'npc' };
    // the chair is tucked against the desk's back edge: its padded cells overlap the desk's
    const chair = body(78, 256, 18, 8, { kind: 'dynamic', immovable: true, go: chairGo });
    const sitter = body(78, 246, 18, 10, { kind: 'dynamic', immovable: true, go: sitterGo });
    const desk = DESK();
    const wall = body(0, 0, 320, 32, { kind: 'dynamic', immovable: true });
    const pm = pmFor(scene([desk], [wall, chair, sitter]));
    const { full, local, opened } = checkLocal(pm, [chair, sitter], [desk, wall]);
    assert.ok(opened > 0);
    // castor cell (87, 260) -> (10, 32): blocked in the world grid, walkable locally? It is also
    // inside the desk's 2 px top padding (262), so it stays blocked.
    assert.equal(full.grid[30][10], 1);
    assert.equal(local.grid[30][10], 0, 'a chair-only cell (y 240..247) opens');
    assert.equal(local.grid[33][10], 1, 'a desk cell stays blocked');
});

test('localStandGrid: three edge cases match the full grid cell for cell outside the chair and sitter', () => {
    const make = (chairX, chairY) => {
        const chairGo = { name: 'chair' }, sitterGo = { name: 'player' };
        const chair = body(chairX, chairY, 18, 8, { kind: 'dynamic', immovable: true, go: chairGo });
        const sitter = body(chairX, chairY - 10, 18, 10, { kind: 'dynamic', immovable: true, go: sitterGo });
        const wallTop = body(0, 0, 320, 32, { kind: 'dynamic', immovable: true });
        const wallEast = body(288, 0, 32, 320, { kind: 'dynamic', immovable: true });
        return { chair, sitter, others: [wallTop, wallEast], s: scene([], [wallTop, wallEast, chair, sitter]) };
    };
    // 1. a side-door corridor within 68 px of the chair (east door at (304, 128))
    {
        const w = make(250, 120);
        const pm = pmFor(w.s);
        pm.openSideDoorCorridors.push({ worldX: 304, worldY: 128, direction: 'east' });
        const { local } = checkLocal(pm, [w.chair, w.sitter], w.others);
        assert.equal(local.grid[15][37], 0, 'the corridor stays carved');
        assert.equal(local.grid[14][37], 1, 'its top row stays blocked');
    }
    // 2. an N/S door beside the chair (north door at (128, 8))
    {
        const w = make(150, 40);
        const pm = pmFor(w.s);
        pm.openNSDoors.push({ worldX: 128, worldY: 8 });
        const { local, full } = checkLocal(pm, [w.chair, w.sitter], w.others);
        assert.equal(local.grid[5][16], full.grid[5][16]);
        assert.equal(local.grid[5][24], 1, 'the corner block stays');
    }
    // 3. a chair at the world grid's edge (x 0, bottom row)
    {
        const w = make(0, 310);
        const pm = pmFor(w.s);
        const { opened } = checkLocal(pm, [w.chair, w.sitter], w.others);
        assert.ok(opened > 0);
    }
});

test('localStandGrid: no manager or no bounds gives null; nearestCell and flood then give nothing', () => {
    assert.equal(sb.localStandGrid(null), null);
    assert.equal(sb.localStandGrid(pmFor(scene([], [], { x: 0, y: 0, width: 0, height: 0 }))), null);
    assert.equal(sb.nearestCell(null, 10, 10, 1), null);
    assert.deepEqual(sb.floodStandCells(null, 10, 10, 4), []);
});

// ── nearestCell, floodStandCells ────────────────────────────────────────────
function gridOf(rows) {
    return { grid: rows.map(r => [...r].map(Number)), bounds: { minX: 0, minY: 0, cols: rows[0].length, rows: rows.length, step: 8 } };
}

test('nearestCell: the cell itself when walkable, else the closest within r', () => {
    const g = gridOf(['111', '101', '111']);
    assert.deepEqual(sb.nearestCell(g, 12, 12, 1), { x: 12, y: 12 });
    const h = gridOf(['111', '111', '110']);
    assert.equal(sb.nearestCell(h, 4, 4, 1), null);
    assert.deepEqual(sb.nearestCell(h, 4, 4, 2), { x: 20, y: 20 });
});

test('floodStandCells: only through walkable cells, so never across a desk; nearest first', () => {
    // start at (1,1); a desk row (all 1) at y 3 separates the far side
    const g = gridOf([
        '00000',
        '00000',
        '00000',
        '11111',
        '00000',
    ]);
    const cells = sb.floodStandCells(g, 12, 12, 8);
    assert.ok(cells.length > 0);
    assert.ok(cells.every(c => c.y < 24), 'nothing beyond the desk row');
    for (let i = 1; i < cells.length; i++) {
        assert.ok(Math.hypot(cells[i].x - 12, cells[i].y - 12) >= Math.hypot(cells[i - 1].x - 12, cells[i - 1].y - 12));
    }
    // limited by steps
    assert.ok(sb.floodStandCells(g, 12, 12, 1).length <= 8);
});

// ── sweepBlock ──────────────────────────────────────────────────────────────
test('sweepBlock stops at the contact line from all four sides', () => {
    const s = scene([DESK()], []);  // x 48..126, y 264..280
    const blk = (x, y) => ({ x, y, w: 18, h: 8 });
    assert.equal(sb.sweepBlock(s, blk(78, 230), 0, 1), 26, 'from the north: bottom 238 -> 264');
    assert.equal(sb.sweepBlock(s, blk(78, 300), 0, -1), 20, 'from the south: top 300 -> 280');
    assert.equal(sb.sweepBlock(s, blk(10, 268), 1, 0), 20, 'from the west: right 28 -> 48');
    assert.equal(sb.sweepBlock(s, blk(150, 268), -1, 0), 24, 'from the east: left 150 -> 126');
    assert.equal(sb.sweepBlock(s, blk(78, 230), 0, -1, { max: 50 }), 50, 'nothing in the way: max');
    assert.equal(sb.sweepBlock(s, blk(78, 260), 0, 1), 0, 'already overlapping: 0');
    assert.equal(sb.sweepBlock(s, blk(127, 230), 0, 1, { max: 99 }), 99, 'passing beside the end touches nothing');
    // diagonal: distance along the unit vector
    const d = sb.sweepBlock(s, blk(78, 236), 1, 1);
    assert.ok(Math.abs(d - 20 * Math.SQRT2) < 1e-9, `diagonal ${d}`);
    // ignore
    const go = { name: 'desk1' };
    const s2 = scene([body(48, 264, 78, 16, { go })], []);
    assert.equal(sb.sweepBlock(s2, blk(78, 230), 0, 1, { ignore: [go], max: 7 }), 7);
});
