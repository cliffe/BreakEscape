// World-grid builder, behaviour-neutral split (seat box plan, slice 0; review R3 m1).
// GOLDEN is rebuildWorldGrid()'s output for the fixture world (test/js/fixtures/world-grid-fixture.mjs),
// taken from the code BEFORE the buildWorldGrid split (npc-pathfinding.js at f75515749). Do not
// regenerate it from the current code: it is the proof the split changed nothing.
// Run with: node test/js/npc-pathfinding-build-grid.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fixtureScene, openDoors, installEasyStar, rowsOf } from './fixtures/world-grid-fixture.mjs';

globalThis.window = globalThis.window || {};
installEasyStar();
const { NPCPathfindingManager } = await import('../../public/break_escape/js/systems/npc-pathfinding.js');

const GOLDEN_BOUNDS = {"minX":0,"minY":0,"cols":42,"rows":34,"step":8};
const GOLDEN = [
    '111111111111111111111111111111111111111110',
    '111111111111111111111111111111111111111110',
    '111111111111111111111111111111111111111110',
    '111111111111111111111111111111111111111110',
    '111111111111111111111111111111111111111110',
    '000000000000000010000000100000000001111110',
    '000000000000000000000000000000000001111110',
    '000000000000000000000000000000000001111110',
    '000000000000000000000000000000000001111110',
    '000000000000000000000000000000000001111110',
    '000000000000000000000000000000000001111110',
    '000000000000000000000000000000000001111110',
    '000000011111111110000000000000000001111110',
    '000000011111111110000000000000000001111110',
    '000000011111111110000000000000000001111111',
    '000000000000000000000000000000000001000000',
    '000000000000000000000000000000000001000000',
    '000000000000000000001111100000000001111111',
    '000000000000000000001111100000000001111110',
    '000000000000000000001111100000000001111110',
    '000000000000000000000000000000000001111110',
    '000000000000000000000000000000000001111110',
    '000000000000000000000000000000000001111110',
    '000000000000000000000000000000000001111110',
    '000000000000000000000000000000000001111110',
    '000000000000000000000000000000000001111110',
    '000000000000000000000000000000000001111110',
    '000000000000000000000000000000000001111110',
    '000000000000000000000000000000000001111110',
    '000000000000000000000000000000000001111110',
    '000000000000000000000000000000000001111110',
    '000000000000000000000000000000000001111110',
    '000000000000000000000000000000000001111110',
    '000000000000000000000000000000000000000000',
];

function manager() {
    const { scene, objects } = fixtureScene();
    const pm = new NPCPathfindingManager(scene);
    openDoors(pm);
    return { pm, objects };
}

test('rebuildWorldGrid on the fixture world equals the golden grid', () => {
    const { pm } = manager();
    pm.rebuildWorldGrid();
    assert.deepEqual(pm.worldGridBounds, GOLDEN_BOUNDS);
    assert.deepEqual(rowsOf(pm.worldGrid), GOLDEN);
    assert.equal(pm.worldPathfinder.grid, pm.worldGrid, 'the pathfinder holds the live grid');
});

// ── after the split (added with the buildWorldGrid commit) ───────────────────

test('buildWorldGrid() with no options equals the golden grid and leaves the live grid alone', () => {
    const { pm } = manager();
    const built = pm.buildWorldGrid();
    assert.deepEqual(built.bounds, GOLDEN_BOUNDS);
    assert.deepEqual(rowsOf(built.grid), GOLDEN);
    assert.equal(pm.worldGrid, null, 'the live grid is not set');
    assert.equal(pm.worldPathfinder, null, 'no pathfinder is made');
    pm.rebuildWorldGrid();
    const live = pm.worldGrid;
    const again = pm.buildWorldGrid();
    assert.notEqual(again.grid, live, 'a fresh array, not the live grid');
    assert.equal(pm.worldGrid, live);
});

test('exclude leaves out exactly the listed game objects, matched by body.gameObject', () => {
    const { pm, objects } = manager();
    const full = pm.buildWorldGrid().grid;
    const { grid } = pm.buildWorldGrid({ exclude: [objects.chair, objects.sitter] });
    // The fixture's chair (static, 170,150 18x8) and sitter (immovable, 171,140 18x10) cover
    // columns 20-24, rows 17-19 with the padding; nothing else is near them.
    const changed = [];
    for (let y = 0; y < full.length; y++) for (let x = 0; x < full[y].length; x++) {
        if (full[y][x] !== grid[y][x]) changed.push([x, y, full[y][x], grid[y][x]]);
    }
    assert.ok(changed.length > 0, 'some cells open');
    assert.ok(changed.every(([x, y, a, b]) => a === 1 && b === 0 && x >= 20 && x <= 24 && y >= 17 && y <= 19), JSON.stringify(changed));
    assert.deepEqual(rowsOf(grid).slice(0, 16), GOLDEN.slice(0, 16), 'the desk, walls and both doors are unchanged');
    // Leaving out the desk (a static body) opens its cells; a Set works as the list too
    const noDesk = pm.buildWorldGrid({ exclude: new Set([objects.desk]) }).grid;
    assert.equal(full[13][10], 1);
    assert.equal(noDesk[13][10], 0);
    // An unknown object changes nothing
    assert.deepEqual(rowsOf(pm.buildWorldGrid({ exclude: [{}] }).grid), GOLDEN);
});

test('buildWorldGrid returns null before the physics world has bounds', () => {
    const { pm } = manager();
    pm.scene.physics.world.bounds = { x: 0, y: 0, width: 0, height: 0 };
    assert.equal(pm.buildWorldGrid(), null);
    pm.rebuildWorldGrid();
    assert.equal(pm.worldGrid, null);
});

test('the carve helpers take the grid they write to; the live wrappers still write the live grid', async () => {
    const { carveSideDoorCorridor, applyNSDoorCornerBlocks } = await import('../../public/break_escape/js/systems/npc-pathfinding.js');
    const bounds = { minX: 0, minY: 0, cols: 42, rows: 34, step: 8 };
    const g = Array.from({ length: 34 }, () => new Array(42).fill(1));
    const c = carveSideDoorCorridor(g, bounds, 304, 128, 'east');
    assert.deepEqual(c, { cx1: 36, cy1: 14, cx2: 41, cy2: 17 });
    assert.equal(g[15][37], 0); assert.equal(g[14][37], 1); assert.equal(g[17][37], 1);
    const open = Array.from({ length: 34 }, () => new Array(42).fill(0));
    assert.deepEqual(applyNSDoorCornerBlocks(open, bounds, 128, 8), { cx1: 16, cx2: 24, cy2: 5 });
    assert.equal(open[5][16], 1); assert.equal(open[5][24], 1); assert.equal(open[5][20], 0);
    const { pm } = manager();
    pm.rebuildWorldGrid();
    pm.markSideDoorCorridor(100, 220, 'west');
    assert.equal(pm.worldGrid[27][6], 0, 'the live wrapper carved the live grid');
    assert.equal(pm.worldPathfinder.grid, pm.worldGrid);
});
