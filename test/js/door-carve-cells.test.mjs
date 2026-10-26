// Opening a N/S door unblocks one wall column's world-grid cells, not the
// column beside it, where a back-wall block (collision.js) sits.
// Run with: node --test test/js/door-carve-cells.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
let src = readFileSync(join(js, 'systems/npc-pathfinding.js'), 'utf8');
const stub = (spec, body) => { assert.ok(src.includes(`'${spec}'`), spec); src = src.replace(`from '${spec}'`, `from '${dataUrl(body)}'`); };
stub('../utils/constants.js', 'export const TILE_SIZE = 32, GRID_SIZE = 32, PATHFINDING_STEP = 8;');
stub('./path-doorways.js', 'export const addDoorway = () => {};');
stub('./path-avoid.js', 'export const AVOID_CELL_COST = 1, collectAvoidRects = () => [], avoidCells = () => [], crossesAvoidRect = () => false;');
globalThis.window = {};
const { NPCPathfindingManager } = await import(dataUrl(src));

test('a N/S door carve opens one 32px column of world-grid cells', () => {
    const mgr = Object.create(NPCPathfindingManager.prototype);
    const step = 8, cols = 80, rows = 40;
    mgr.worldGrid = Array.from({ length: rows }, () => new Array(cols).fill(1)); // all blocked
    mgr.worldGridBounds = { minX: 0, minY: 0, cols, rows, step };
    mgr.worldPathfinder = { setGrid() {} };
    mgr.openDoorways = []; mgr.openNSDoors = []; mgr.openSideDoorCorridors = [];
    mgr.grids = new Map([['r', [[1]]]]); mgr.pathfinders = new Map([['r', { setGrid() {} }]]);
    mgr.roomBounds = new Map([['r', { worldX: 0, worldY: 0 }]]);
    mgr._applyNSDoorCornerBlocks = () => {};

    mgr.markDoorWalkable('r', 48, 32, 'north'); // door centre x=48 -> wall column 1 (x 32..64)
    const row = mgr.worldGrid[Math.floor(40 / step)];
    const open = row.map((v, i) => (v === 0 ? i * step : null)).filter((v) => v !== null);
    assert.deepEqual(open, [32, 40, 48, 56], 'cells 32..63 only');
    assert.equal(row[Math.floor(64 / step)], 1, 'the column beside the doorway stays blocked');
});
