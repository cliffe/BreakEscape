// PathfindingManager after the per-room grid removal: random patrol targets come
// from the unified world grid (walkable cells only, snapped within 2 cells), and
// markDoorWalkable still opens the world grid with only the room's bounds.
// Run with: node test/js/npc-pathfinding-world-grid.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis.window || {};
const { NPCPathfindingManager } = await import('../../public/break_escape/js/systems/npc-pathfinding.js');

// A 10x10-tile room at world (0,0); world grid at 8px, origin (0,0).
function manager(blockedFn = () => false) {
    const pm = new NPCPathfindingManager({ time: { delayedCall() {} } });
    pm.roomBounds.set('r', { x: 2, y: 2, width: 6, height: 6, mapWidth: 10, mapHeight: 10, worldX: 0, worldY: 0 });
    const cols = 40, rows = 40;
    pm.worldGrid = Array.from({ length: rows }, (_, cy) =>
        Array.from({ length: cols }, (_, cx) => (blockedFn(cx, cy) ? 1 : 0)));
    pm.worldGridBounds = { minX: 0, minY: 0, cols, rows, step: 8 };
    return pm;
}
const cellOf = (pm, p) => pm.worldGrid[Math.floor(p.y / 8)][Math.floor(p.x / 8)];

test('random patrol target is a walkable world-grid cell inside the patrol bounds', () => {
    const pm = manager();
    for (let i = 0; i < 50; i++) {
        const t = pm.getRandomPatrolTarget('r');
        assert.ok(t, 'a target is found on an open grid');
        assert.equal(cellOf(pm, t), 0);
        assert.ok(t.x >= 64 && t.x <= 256 && t.y >= 64 && t.y <= 256, `inside bounds: ${t.x},${t.y}`);
    }
});

test('a tile centre on a blocked cell is snapped to a walkable cell nearby', () => {
    // Block exactly the cell under every tile centre (centre px 16 + 32k -> cell 2 + 4k)
    const pm = manager((cx, cy) => cx % 4 === 2 && cy % 4 === 2);
    for (let i = 0; i < 30; i++) {
        const t = pm.getRandomPatrolTarget('r');
        assert.ok(t, 'snapped target found');
        assert.equal(cellOf(pm, t), 0, 'snapped target is walkable');
    }
});

test('no target when the room is fully blocked, or before the world grid exists', () => {
    assert.equal(manager(() => true).getRandomPatrolTarget('r'), null);
    const pm = manager();
    pm.worldGrid = null;
    assert.equal(pm.getRandomPatrolTarget('r'), null);
    assert.equal(manager().getRandomPatrolTarget('unknown'), null);
});

test('markDoorWalkable opens the door cells on the world grid using room bounds only', () => {
    const pm = manager(() => true);
    pm.markDoorWalkable('r', 128, 0, 'north');   // 2-tile-wide N door at tile (4,0)
    // Door spans x 128..192, y 0..32: its interior cells are open
    assert.equal(pm.worldGrid[1][17], 0);
    assert.equal(pm.worldGrid[2][22], 0);
    assert.equal(pm.openDoorways.length, 1);
    // An unknown room still records the N/S doorway but touches no cells
    const before = JSON.stringify(manager(() => true).worldGrid);
    const pm2 = manager(() => true);
    pm2.markDoorWalkable('nope', 128, 0, 'north');
    assert.equal(JSON.stringify(pm2.worldGrid), before);
});

test('the removed per-room API is gone', () => {
    const pm = manager();
    for (const m of ['findPath', 'getGrid', 'getPathfinder', 'buildGridFromWalls', 'hasLineOfSight',
        'smoothPath', 'smoothPathForPlayer', 'findNearestWalkableTile', 'hasPhysicsLineOfSight',
        'refreshGridFromPhysicsBodies', 'drawGridDebug']) {
        assert.equal(typeof pm[m], 'undefined', m);
    }
    assert.equal(pm.grids, undefined);
    assert.equal(typeof pm.getBounds, 'function');
    assert.equal(typeof pm.clearGridDebug, 'function');
});
