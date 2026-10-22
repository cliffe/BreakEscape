// "Prefer to route around" objects for click-to-move (systems/path-avoid.js).
// Run with: node --test test/js/path-avoid.test.mjs
//
// The path-choice tests use a small Dijkstra with EasyStar 0.4.4's cost rules
// (entering a cell costs its point cost, x1.4 on a diagonal, no corner
// cutting), since EasyStar itself is loaded from a CDN in the browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'path-avoid-'));
writeFileSync(join(dir, 'pa.mjs'), readFileSync(join(js, 'systems/path-avoid.js'), 'utf8'));
const { AVOID_CELL_COST, prefersAvoid, avoidFootprint, collectAvoidRects, avoidCells, crossesAvoidRect }
    = await import(pathToFileURL(join(dir, 'pa.mjs')).href);

const STEP = 8;

// A body-less sprite (vending machine on the items layer), 42x60 at (x, y), origin 0,0.
const vending = (x, y, extra = {}) => ({
    x, y, width: 42, height: 60, active: true, visible: true,
    scenarioData: { type: 'vending_machine', preferAvoid: true }, ...extra,
    getBounds() { return { x: this.x, y: this.y, width: 42, height: 60 }; },
});

function openGrid(cols, rows) {
    return Array.from({ length: rows }, () => new Array(cols).fill(0));
}

// Dijkstra on the grid with EasyStar's cost model. Returns the cell path.
function route(grid, costs, sx, sy, ex, ey) {
    const rows = grid.length, cols = grid[0].length;
    const key = (x, y) => y * cols + x;
    const dist = new Map([[key(sx, sy), 0]]);
    const prev = new Map();
    const open = [[0, sx, sy]];
    const free = (x, y) => x >= 0 && y >= 0 && x < cols && y < rows && grid[y][x] === 0;
    const cost = (x, y) => costs.get(key(x, y)) ?? 1;
    while (open.length) {
        open.sort((a, b) => a[0] - b[0]);
        const [d, x, y] = open.shift();
        if (d > dist.get(key(x, y))) continue;
        if (x === ex && y === ey) break;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = x + dx, ny = y + dy;
            if (!free(nx, ny)) continue;
            if (dx && dy && (!free(x + dx, y) || !free(x, y + dy))) continue; // no corner cutting
            const nd = d + (dx && dy ? 1.4 : 1) * cost(nx, ny);
            if (nd < (dist.get(key(nx, ny)) ?? Infinity)) {
                dist.set(key(nx, ny), nd);
                prev.set(key(nx, ny), [x, y]);
                open.push([nd, nx, ny]);
            }
        }
    }
    if (!dist.has(key(ex, ey))) return null;
    const path = [[ex, ey]];
    while (path[0][0] !== sx || path[0][1] !== sy) path.unshift(prev.get(key(...path[0])));
    return path;
}

function costsFor(sprites, grid) {
    const bounds = { minX: 0, minY: 0, cols: grid[0].length, rows: grid.length, step: STEP };
    const cells = avoidCells(collectAvoidRects(sprites), bounds, grid);
    return { cells, costs: new Map(cells.map(c => [c.cy * bounds.cols + c.cx, AVOID_CELL_COST])) };
}

const through = (path, cells) => path.some(([x, y]) => cells.some(c => c.cx === x && c.cy === y));

test('which objects are avoided', () => {
    assert.equal(prefersAvoid(vending(0, 0)), true);
    assert.equal(prefersAvoid({ scenarioData: { type: 'notes' } }), false);
    assert.equal(prefersAvoid({ hasWheels: true }), true, 'wheeled props default to avoided');
    assert.equal(prefersAvoid({ hasWheels: true, scenarioData: { preferAvoid: false } }), false, 'scenario false wins');
    assert.equal(prefersAvoid(vending(0, 0, { visible: false })), false, 'hidden or taken objects are ignored');
});

test('footprints: bottom third of a body-less sprite, a dynamic body as is, solid bodies skipped', () => {
    assert.deepEqual(avoidFootprint(vending(100, 40)), { left: 100, top: 80, right: 142, bottom: 100 });
    const chair = { hasWheels: true, body: { enable: true, immovable: false, physicsType: 0, left: 10, top: 20, right: 28, bottom: 28 } };
    assert.deepEqual(avoidFootprint(chair), { left: 10, top: 20, right: 28, bottom: 28 });
    const table = { body: { enable: true, immovable: true, left: 0, top: 0, right: 10, bottom: 10 } };
    assert.equal(avoidFootprint(table), null);
});

test('avoided cells are padded like solid bodies and only cover walkable cells', () => {
    const grid = openGrid(40, 30);
    grid[10][12] = 1; // a wall cell under the footprint stays a wall, not a cost
    const { cells } = costsFor([vending(100, 40)], grid);
    const xs = cells.map(c => c.cx), ys = cells.map(c => c.cy);
    assert.equal(Math.min(...xs), 11); // floor(100/8) - 1
    assert.equal(Math.max(...xs), 18); // floor(141/8) + 1
    assert.equal(Math.min(...ys), 9);  // floor(78/8)
    assert.equal(Math.max(...ys), 12); // floor(101/8)
    assert.ok(!cells.some(c => c.cx === 12 && c.cy === 10));
});

test('open room: the path goes round the vending machine', () => {
    const grid = openGrid(40, 30);
    const { cells, costs } = costsFor([vending(140, 60)], grid); // footprint x 140-182, y 100-120
    const plain = route(grid, new Map(), 20, 2, 20, 26);
    assert.ok(through(plain, cells), 'without the setting the straight path crosses it');
    const path = route(grid, costs, 20, 2, 20, 26);
    assert.ok(path, 'a path exists');
    assert.ok(!through(path, cells), 'with preferAvoid it routes round');
    assert.ok(path.length - plain.length < 12, 'by a short detour');
});

test('only way through: the path still walks through it', () => {
    // A wall across the room with one gap, and the machine standing in the gap.
    const grid = openGrid(40, 30);
    for (let x = 0; x < 40; x++) if (x < 17 || x > 23) { grid[13][x] = 1; grid[14][x] = 1; }
    const { cells, costs } = costsFor([vending(140, 60)], grid);
    const path = route(grid, costs, 5, 2, 5, 26);
    assert.ok(path, 'still reachable');
    assert.ok(through(path, cells), 'goes through the machine');
});

test('a detour far longer than the crossing cost walks through instead', () => {
    // Wall across a long room; the machine fills the near gap, the other gap is far away.
    const grid = openGrid(200, 30);
    for (let x = 0; x < 200; x++) if ((x < 17 || x > 23) && x < 190) { grid[13][x] = 1; grid[14][x] = 1; }
    const { cells, costs } = costsFor([vending(140, 60)], grid);
    const path = route(grid, costs, 20, 2, 20, 26);
    assert.ok(through(path, cells), 'a 170-cell detour is not a clean path');
});

test('straight-line shortcuts refuse to cross an avoided object', () => {
    const rects = [{ left: 140, top: 100, right: 182, bottom: 120 }];
    assert.equal(crossesAvoidRect(160, 40, 160, 200, rects), true);
    assert.equal(crossesAvoidRect(100, 40, 100, 200, rects), false, 'clear to one side');
    assert.equal(crossesAvoidRect(160, 40, 160, 110, rects), false, 'walking up to it (end inside)');
    assert.equal(crossesAvoidRect(160, 110, 160, 200, rects), false, 'already in it (start inside)');
    assert.equal(crossesAvoidRect(160, 40, 160, 200, rects, { via: [{ x: 160, y: 112 }] }), false,
        'the raw route goes through anyway');
    assert.equal(crossesAvoidRect(160, 40, 160, 200, rects, { via: [{ x: 160, y: 92 }] }), true,
        'a route cell skirting the edge is not through it');
});
