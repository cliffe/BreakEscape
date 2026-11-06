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

// ── room leash (OFFICE_LIFE_PLAN 7.2, slice 2a) ─────────────────────────────

const { roomFloorRect, floorRingCells } = await import('../../public/break_escape/js/systems/path-avoid.js');

test('the inner floor ring: the floor\'s own edge cells, corners and blocked cells included', () => {
    // A 4x4-tile room at (64, 0): floor x 64..192, y 64..128 (top two tile rows are wall)
    const rect = roomFloorRect({ position: { x: 64, y: 0 }, map: { widthInPixels: 128, heightInPixels: 128 } });
    assert.deepEqual(rect, { left: 64, top: 64, right: 192, bottom: 128 });
    const cells = floorRingCells(rect, { minX: 0, minY: 0, cols: 40, rows: 40, step: 8 });
    const key = new Set(cells.map(c => `${c.cx},${c.cy}`));
    // Columns 8..23, rows 8..15: perimeter 2*16 + 2*6 = 44 cells
    assert.equal(cells.length, 44);
    for (const k of ['8,8', '23,8', '8,15', '23,15', '12,8', '8,11']) assert.ok(key.has(k), k);
    assert.ok(!key.has('12,11'), 'not the inside');
    assert.ok(!key.has('7,8') && !key.has('24,8') && !key.has('12,7'), 'nothing outside the floor');
});

function leashManager() {
    const pm = manager();
    const rec = { avoided: [], removed: [], calls: [] };
    pm.worldPathfinder = {
        avoidAdditionalPoint: (x, y) => { rec.calls.push('avoid'); rec.avoided.push(`${x},${y}`); },
        stopAvoidingAdditionalPoint: (x, y) => { rec.calls.push('stop'); rec.removed.push(`${x},${y}`); },
        stopAvoidingAllAdditionalPoints: () => rec.calls.push('stopAll'),
        findPath: (sx, sy, ex, ey, cb) => { rec.calls.push('findPath'); rec.cb = cb; },
        calculate: () => { rec.calls.push('calculate'); if (rec.throwInCalc) throw new Error('boom'); rec.cb([{ x: 1, y: 1 }]); },
        removeAllAdditionalPointCosts() {}
    };
    window.rooms = {
        lounge: { position: { x: 128, y: 0 }, map: { widthInPixels: 64, heightInPixels: 128 } },
        office: { position: { x: 0, y: 0 }, map: { widthInPixels: 128, heightInPixels: 128 } }
    };
    return { pm, rec };
}

test('findWorldPath with avoidRooms rings the room before calculate() and removes the same cells after', () => {
    const { pm, rec } = leashManager();
    let got = null;
    pm.findWorldPath(20, 80, 30, 90, p => { got = p; }, false, { avoidRooms: ['lounge', 'not_loaded'] });
    assert.ok(got, 'callback ran');
    const first = rec.calls.indexOf('calculate');
    assert.ok(rec.calls.slice(0, first).includes('avoid'), 'ring set before calculate');
    assert.ok(rec.calls.slice(first + 1).every(c => c === 'stop'), 'only exact removals after calculate');
    assert.ok(!rec.calls.includes('stopAll'), 'never drops the player\'s NPC-avoid set');
    assert.deepEqual(rec.removed, rec.avoided);
    assert.equal(rec.avoided.length, 2 * 8 + 2 * 6);
});

test('the room whose floor holds the start is not ringed, so an NPC inside can walk out', () => {
    const { pm, rec } = leashManager();
    pm.findWorldPath(150, 80, 30, 90, () => {}, false, { avoidRooms: ['lounge'] });
    assert.equal(rec.avoided.length, 0);
});

test('the ring is removed even when calculate() throws; no options means no ring', () => {
    const { pm, rec } = leashManager();
    rec.throwInCalc = true;
    assert.throws(() => pm.findWorldPath(20, 80, 30, 90, () => {}, false, { avoidRooms: ['lounge'] }));
    assert.ok(rec.avoided.length > 0);
    assert.deepEqual(rec.removed, rec.avoided);
    const b = leashManager();
    b.pm.findWorldPath(20, 80, 30, 90, () => {});
    assert.equal(b.rec.avoided.length, 0);
});
