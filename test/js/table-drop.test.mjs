// Office life slice 23 (OFFICE_LIFE_PLAN 12.13): a magnet dropped beside a table lands on its top.
// Pure functions of table-drop.js (snap, nearest table, slide past objects, the saved position and
// its reload, the edge cell eaters stand on) and item-drop.js's room helpers on a stub room laid out
// like test_needs_sims's kitchen (room_break: four smalldesk1 tables, 50x41, in a 2x2 block).
// Run with: bin/test-js test/js/table-drop.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    snapToTable, tableUnder, edgeCell, savedPosition, reloadedPlacement, placedDepth, baseY, topRect,
    TABLE_SNAP_RANGE, TABLE_DEPTH_STEP
} from '../../public/break_escape/js/systems/table-drop.js';
import { roomTables, tableApproach, settleOnTable } from '../../public/break_escape/js/systems/item-drop.js';

const ROOM = { x: -320, y: 0 };
const CAKE = { w: 25, h: 27 };
// The kitchen tables (Tiled x and bottom y, room-relative), as rooms.js makes them: top-left, depth bottom + 0.5
const tiled = [
    ['kitchen_table_0', 104, 149], ['kitchen_table_1', 163, 149],
    ['kitchen_table_2', 105, 199], ['kitchen_table_3', 165, 200]
];
const kitchen = () => tiled.map(([id, x, b]) => ({ id, x: ROOM.x + x, y: ROOM.y + b - 41, w: 50, h: 41, depth: ROOM.y + b + 0.5 }));
const south = t => t.id === 'kitchen_table_2';

test('a drop within a tile of the front of a table lands on its top, over the table', () => {
    const tables = kitchen();
    const t = tables.find(south);
    const feet = { x: t.x + 20, y: t.y + t.h + 12 };         // the player standing in front of it
    const s = snapToTable(feet, tables, CAKE);
    assert.ok(s, 'snapped');
    assert.equal(s.tableId, 'kitchen_table_2');
    assert.equal(s.top + CAKE.h, baseY(t), 'base on the top row');
    assert.ok(s.left >= t.x && s.left + CAKE.w <= t.x + t.w, 'inside the top');
    assert.equal(s.left, Math.round(feet.x - CAKE.w / 2), 'under the player');
    assert.ok(placedDepth(s.top, CAKE.h, s.elevation, ROOM.y) > t.depth, 'drawn over the table');
    assert.ok(placedDepth(s.top, CAKE.h, s.elevation, ROOM.y) < t.depth + 1, 'under anyone standing in front');
    assert.ok(s.elevation > 0);
});

test('beyond one tile it does not snap (the floor, as before)', () => {
    const tables = kitchen();
    const t = tables.find(south);
    assert.equal(snapToTable({ x: t.x + 20, y: t.y + t.h + TABLE_SNAP_RANGE + 1 }, tables, CAKE), null);
    assert.equal(snapToTable({ x: ROOM.x + 160, y: ROOM.y + 290 }, tables, CAKE), null, 'open floor');
    assert.ok(snapToTable({ x: t.x + 20, y: t.y + t.h + TABLE_SNAP_RANGE }, tables, CAKE), 'at exactly one tile');
    assert.equal(snapToTable({ x: t.x - TABLE_SNAP_RANGE - 1, y: t.y + 20 }, [t], CAKE), null, 'beside, too far');
    assert.ok(topRect(t).h < t.h, 'the top is the upper part of the sprite');
});

test('the nearest table wins; an equal distance goes to the lower id', () => {
    const tables = kitchen();
    const t3 = tables.find(t => t.id === 'kitchen_table_3');
    assert.equal(snapToTable({ x: t3.x + 30, y: t3.y + t3.h + 10 }, tables, CAKE).tableId, 'kitchen_table_3');
    // Two tables side by side, the feet exactly between them
    const pair = [{ id: 'b', x: 100, y: 0, w: 50, h: 41, depth: 41.5 }, { id: 'a', x: 0, y: 0, w: 50, h: 41, depth: 41.5 }];
    assert.equal(snapToTable({ x: 75, y: 30 }, pair, CAKE).tableId, 'a');
    assert.equal(snapToTable({ x: 75, y: 30 }, [...pair].reverse(), CAKE).tableId, 'a', 'order of the list does not matter');
});

test('a spot taken by another object slides along the top; a full table is skipped', () => {
    const tables = kitchen();
    const t = tables.find(south);
    const feet = { x: t.x + 20, y: t.y + t.h + 12 };
    const want = snapToTable(feet, tables, CAKE);
    const lamp = { x: want.left, y: want.top + 5, w: 9, h: 14 };
    const s = snapToTable(feet, tables, CAKE, [lamp]);
    assert.ok(s && s.tableId === 'kitchen_table_2');
    assert.ok(s.left >= lamp.x + lamp.w || s.left + CAKE.w <= lamp.x, 'clear of the lamp');
    // Covering the whole top sends it to the next table in range, or the floor
    const cover = { x: t.x, y: t.y - 30, w: t.w, h: t.h + 30 };
    const s2 = snapToTable(feet, tables, CAKE, [cover]);
    assert.ok(!s2 || s2.tableId !== 'kitchen_table_2');
    assert.equal(snapToTable(feet, [t], CAKE, [cover]), null);
});

test('a table nobody can stand at is skipped for the next in range', () => {
    const tables = kitchen();
    const walk = (x, y) => ({ x: Math.floor(x / 8) * 8 + 4, y: Math.floor(y / 8) * 8 + 4 });
    // The player in the passage east of the block, level with the north row's front:
    // nearest is the north-east table, whose front and west end touch other tables
    const t1 = tables.find(t => t.id === 'kitchen_table_1');
    const feet = { x: t1.x + t1.w - 1, y: t1.y + t1.h + 2 };
    assert.equal(snapToTable(feet, tables, CAKE).tableId, 'kitchen_table_1');
    // Its east end is closed too (the chairs): no edge cell, so the south-east table takes it
    const noEast = (x, y) => (x > t1.x + t1.w ? null : walk(x, y));
    const usable = t => !!edgeCell({ x: feet.x, y: t.y }, t, tables, noEast);
    assert.equal(usable(t1), false);
    assert.equal(snapToTable(feet, tables, CAKE, [], usable).tableId, 'kitchen_table_3');
});

test('deterministic: the same drop gives the same placement', () => {
    const feet = { x: ROOM.x + 150, y: 215 };
    const a = snapToTable(feet, kitchen(), CAKE);
    const b = snapToTable(feet, kitchen().reverse(), CAKE);
    assert.deepEqual(a, b);
});

test('persistence round trip: the saved top-left and elevation reload to the same place and depth', () => {
    const tables = kitchen();
    const t = tables.find(south);
    const s = snapToTable({ x: t.x + 31, y: t.y + t.h + 9 }, tables, CAKE);
    const pos = savedPosition(s.left, s.top, ROOM, s.elevation);
    assert.equal(pos.elevation, s.elevation);
    const back = reloadedPlacement(JSON.parse(JSON.stringify(pos)), ROOM, CAKE);
    assert.equal(back.left, s.left);
    assert.equal(back.top, s.top);
    assert.equal(back.depth, placedDepth(s.top, CAKE.h, s.elevation, ROOM.y));
    assert.deepEqual(tableUnder({ x: back.left, y: back.top, ...CAKE }, tables)?.id, 'kitchen_table_2', 'still on the table');
    // A floor drop saves no elevation and no longer drifts half its size south-east (18b-i: ~13 px)
    const floor = savedPosition(252 - 12, 252 - 13, { x: 0, y: 0 });
    assert.equal(floor.elevation, undefined);
    const f = reloadedPlacement(floor, { x: 0, y: 0 }, CAKE);
    assert.deepEqual([f.left, f.top], [240, 239]);
    assert.equal(tableUnder({ x: 240, y: 239, ...CAKE }, tables), null);
});

test('the edge cell: in front of the table, never in the gap between touching tables', () => {
    const tables = kitchen();
    const t = tables.find(south);
    const s = snapToTable({ x: t.x + 20, y: t.y + t.h + 12 }, tables, CAKE);
    const walk = (x, y) => ({ x: Math.floor(x / 8) * 8 + 4, y: Math.floor(y / 8) * 8 + 4 });
    const c = edgeCell({ x: s.x, y: s.y }, t, tables, walk);
    assert.ok(c.y > t.y + t.h, 'south of the table');
    assert.ok(Math.abs(c.x - s.x) <= 8, 'under the cake');
    // Front blocked: behind is the gap to the north row (inside its expanded rect), so a side
    const noFront = (x, y) => (y > t.y + t.h ? null : walk(x, y));
    const c2 = edgeCell({ x: s.x, y: s.y }, t, tables, noFront);
    assert.ok(c2 === null || !tables.some(o => c2.x >= o.x - 4 && c2.x <= o.x + o.w + 4 && c2.y >= o.y - 4 && c2.y <= o.y + o.h + 4));
});

test('item-drop room helpers: tables from a stub room, and the approach of an item on one', () => {
    const sp = (objectId, x, y, w, h, extra = {}) => ({ objectId, x, y, width: w, height: h, displayWidth: w, displayHeight: h, originX: 0, originY: 0, depth: y + h + 0.5, ...extra });
    const room = { objects: {} };
    for (const t of kitchen()) room.objects[t.id] = sp(t.id, t.x, t.y, t.w, t.h, { scenarioData: { type: 'table' }, texture: { key: 'smalldesk1' } });
    room.objects.lamp = sp('lamp', ROOM.x + 107, 100, 9, 14, { scenarioData: { type: 'lamp' } });
    const tables = roomTables(room, { sprites: {} });
    assert.deepEqual(tables.map(t => t.id), tiled.map(t => t[0]));
    assert.deepEqual(tables, kitchen().map(t => ({ ...t, front: undefined })));
    // With surface data, the base sits two rows above the front face
    assert.equal(baseY(roomTables(room, { sprites: { smalldesk1: { front: 26 } } })[2]), tables[2].y + 24);
    const s = snapToTable({ x: tables[2].x + 20, y: tables[2].y + 53 }, tables, CAKE);
    const cakeSp = sp('cake', s.left, s.top, CAKE.w, CAKE.h);
    const walk = (x, y) => ({ x: Math.floor(x / 8) * 8 + 4, y: Math.floor(y / 8) * 8 + 4 });
    const c = tableApproach(cakeSp, room, walk, null);
    assert.ok(c && c.y > tables[2].y + tables[2].h);
    assert.equal(tableApproach(sp('cake', ROOM.x + 150, 260, 25, 27), room, walk, null), null, 'on the floor: no table approach');
    assert.ok(TABLE_DEPTH_STEP > 0);
});

test('reload: a magnet back at its saved top-left with no elevation is drawn over the table again', () => {
    const tables = kitchen();
    const t = tables.find(south);
    const s = snapToTable({ x: t.x + 20, y: t.y + t.h + 12 }, tables, CAKE);
    // The server keeps position x and y only, so rooms.js gives it depth bottom + 0.5
    const back = reloadedPlacement({ x: (s.left - ROOM.x) / 32, y: (s.top - ROOM.y) / 32 }, ROOM, CAKE);
    assert.ok(back.depth < t.depth, 'under the table before settling');
    const room = { position: ROOM, objects: {} };
    for (const k of tables) room.objects[k.id] = { objectId: k.id, x: k.x, y: k.y, width: k.w, height: k.h, displayWidth: k.w, displayHeight: k.h, originX: 0, originY: 0, depth: k.depth, scenarioData: { type: 'table' }, texture: { key: 'smalldesk1' } };
    let depth = back.depth;
    const cake = { x: back.left, y: back.top, width: CAKE.w, height: CAKE.h, displayWidth: CAKE.w, displayHeight: CAKE.h, originX: 0, originY: 0, setDepth(d) { depth = d; } };
    assert.equal(settleOnTable(cake, room, null), s.elevation);
    assert.equal(depth, placedDepth(s.top, CAKE.h, s.elevation, ROOM.y), 'the same depth as at the drop');
    // On the floor: untouched
    let d2 = 7;
    const floorCake = { ...cake, y: 260, setDepth(d) { d2 = d; } };
    assert.equal(settleOnTable(floorCake, room, null), null);
    assert.equal(d2, 7);
});
