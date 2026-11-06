// Seat box slice 3 (docs/achitechture/SEAT_BOX_PLAN.md): a table item joins a table group only if
// its sprite rectangle overlaps a table. A scenario object that took a table_items /
// conditional_table_items placeholder but sits off every desk (the lab's cable_note) is stored at
// its own depth with its variant listeners; an unreserved Tiled table item off every table is
// stored at processObject's depth instead of joining the nearest table's group.
// The helpers are sliced out of core/rooms.js and run with stubs, because rooms.js needs Phaser.
// Run with: node test/js/table-item-overlap-grouping.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const file = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js/core/rooms.js');
const src = readFileSync(file, 'utf8');

function slice(from, to) {
    const s = src.indexOf(from), e = src.indexOf(to, s + 1);
    assert.ok(s > 0 && e > s, `could not find ${from}`);
    return src.slice(s, e);
}

function build() {
    const handlers = new Map();
    globalThis.window = {
        gameState: { globalVariables: {} },
        eventDispatcher: { on: (ev, fn) => { (handlers.get(ev) || handlers.set(ev, []).get(ev)).push(fn); } }
    };
    const rooms = { r: { objects: {} } };
    const gameRef = { textures: { exists: () => true } };
    const resolveObjectField = (data, field, fallback) => data[field] ?? fallback;
    const code = slice('function setDepthAndStore', '\n}\n') + '\n}\n'
        + slice('function registerSpriteVariantListeners', '// ===== END: ITEM POOL MANAGEMENT');
    const fns = new Function('rooms', 'gameRef', 'resolveObjectField', 'TILE_SIZE',
        `${code}; return { findClosestTable, overlappingTableGroup, placeMatchedScenarioItem, placeUnreservedTableItem };`
    )(rooms, gameRef, resolveObjectField, 32);
    return { ...fns, rooms, handlers };
}

const spr = (name, x, y, width, height, extra = {}) => ({
    name, objectId: name, x, y, width, height, depth: undefined, visible: true,
    texture: { key: name },
    setDepth(d) { this.depth = d; return this; },
    setVisible(v) { this.visible = v; return this; },
    setTexture(k) { this.texture.key = k; },
    ...extra
});
const quiet = (fn) => {
    const l = console.log, w = console.warn, warned = [];
    console.log = () => {}; console.warn = (m) => warned.push(m);
    try { return { value: fn(), warned }; } finally { console.log = l; console.warn = w; }
};

// test_desk_seating's top row: desk1 (48, 101, 78 x 39) and zds_desk1 (320, 101, 78 x 39),
// room origin (0, 0), so the back wall threshold is y 64
function world() {
    const desk = { sprite: spr('desk1', 48, 101, 78, 39) };
    const zds = { sprite: spr('zds_desk1', 320, 101, 78, 39) };
    const tableObjects = [desk, zds];
    const tableGroups = tableObjects.map(t => ({ table: t, items: [], baseDepth: t.sprite.y + t.sprite.height + 0.5 }));
    return { desk, zds, tableObjects, tableGroups };
}

test('findClosestTable: overlap wins; with no overlap the nearest table, or null with overlapOnly', () => {
    const { findClosestTable } = build();
    const { desk, zds, tableObjects } = world();
    quiet(() => {
        assert.equal(findClosestTable(spr('pc', 62, 92, 28, 23), tableObjects), desk);
        assert.equal(findClosestTable(spr('pc', 62, 92, 28, 23), tableObjects, { overlapOnly: true }), desk);
        const off = spr('pc', 300, 200, 28, 23);
        assert.equal(findClosestTable(off, tableObjects), zds);
        assert.equal(findClosestTable(off, tableObjects, { overlapOnly: true }), null);
        // touching edges is not an overlap
        assert.equal(findClosestTable(spr('pc', 126, 92, 28, 23), tableObjects, { overlapOnly: true }), null);
    });
});

test('findClosestTable: of two overlapping tables the southmost', () => {
    const { findClosestTable } = build();
    const north = { sprite: spr('north', 0, 0, 80, 40) };
    const south = { sprite: spr('south', 0, 30, 80, 40) };
    const { value } = quiet(() => findClosestTable(spr('lamp', 10, 20, 12, 23), [south, north], { overlapOnly: true }));
    assert.equal(value, south);
});

test('placeholder match on a desk joins its group, in the room objects, with listeners', () => {
    const { placeMatchedScenarioItem, rooms, handlers } = build();
    const { tableObjects, tableGroups } = world();
    const sprite = spr('desk_pc_on', 62, 92, 28, 23);
    const scenarioObj = { id: 'desk_pc_on', type: 'pc',
        spriteVariants: [{ condition: 'globalVars.pc_off', value: 'pc_off' }] };
    const { value: group, warned } = quiet(() => placeMatchedScenarioItem({ sprite, isTableItem: true,
        sourceLayer: 'table_items (regular)', placeholder: 'pc1.png', scenarioObj,
        tableObjects, tableGroups, position: { x: 0, y: 0 }, roomId: 'r' }));
    assert.equal(group, tableGroups[0]);
    assert.equal(group.items.length, 1);
    assert.equal(group.items[0].sprite, sprite);
    assert.equal(sprite.depth, 140.5 + 0.01);
    assert.equal(sprite.elevation, 0);
    assert.equal(rooms.r.objects.desk_pc_on, sprite);
    assert.ok(handlers.has('global_variable_changed:pc_off'));
    assert.deepEqual(warned, []);
});

test('placeholder match moved off every desk is stored at its own depth, warned, with listeners (cable_note)', () => {
    const { placeMatchedScenarioItem, rooms, handlers } = build();
    const { tableObjects, tableGroups } = world();
    const sprite = spr('desk_pc_off', 544, 128, 28, 23);
    const scenarioObj = { id: 'desk_pc_off', type: 'pc', position: { x: 17, y: 4 },
        spriteVariants: [{ condition: 'globalVars.pc_off', value: 'pc_off' }] };
    const { value: group, warned } = quiet(() => placeMatchedScenarioItem({ sprite, isTableItem: true,
        sourceLayer: 'table_items (regular)', placeholder: 'pc1.png', scenarioObj,
        tableObjects, tableGroups, position: { x: 0, y: 0 }, roomId: 'r' }));
    assert.equal(group, null);
    assert.ok(tableGroups.every(g => g.items.length === 0));
    assert.equal(sprite.depth, 128 + 23 + 0.5);
    assert.equal(sprite.elevation, 0);
    assert.equal(sprite.visible, false);
    assert.equal(rooms.r.objects.desk_pc_off, sprite);
    assert.ok(handlers.has('global_variable_changed:pc_off'));
    assert.equal(warned.length, 1);
    assert.match(warned[0], /desk_pc_off/);
    assert.match(warned[0], /pc1\.png/);
});

test('a match from an ordinary items layer never joins a group, even on a desk', () => {
    const { placeMatchedScenarioItem, rooms } = build();
    const { tableObjects, tableGroups } = world();
    const sprite = spr('bag', 62, 92, 20, 20);
    const { value, warned } = quiet(() => placeMatchedScenarioItem({ sprite, isTableItem: false,
        sourceLayer: 'items (regular)', placeholder: 'bag1.png', scenarioObj: { id: 'bag', type: 'bag' },
        tableObjects, tableGroups, position: { x: 0, y: 0 }, roomId: 'r' }));
    assert.equal(value, null);
    assert.equal(sprite.depth, 112.5);
    assert.equal(rooms.r.objects.bag, sprite);
    assert.deepEqual(warned, []);
});

test('a table-layer match in a room with no tables is stored on its own (no throw, not lost)', () => {
    const { placeMatchedScenarioItem, rooms } = build();
    const sprite = spr('note', 100, 100, 10, 10);
    const { value } = quiet(() => placeMatchedScenarioItem({ sprite, isTableItem: true,
        sourceLayer: 'conditional_table_items', placeholder: 'notes1.png', scenarioObj: { id: 'note', type: 'notes' },
        tableObjects: [], tableGroups: [], position: { x: 0, y: 0 }, roomId: 'r' }));
    assert.equal(value, null);
    assert.equal(rooms.r.objects.note, sprite);
});

test('unreserved Tiled table item: on a desk joins its group; off every desk keeps its own depth', () => {
    const { placeUnreservedTableItem, rooms } = build();
    const { tableObjects, tableGroups } = world();
    const on = { sprite: spr('lamp_on', 101, 92, 12, 23).setDepth(115.5), type: 'table_item' };
    const off = { sprite: spr('lamp_off', 200, 220, 12, 23).setDepth(243.5), type: 'table_item' };
    quiet(() => {
        assert.equal(placeUnreservedTableItem(on, tableObjects, tableGroups, 'r'), tableGroups[0]);
        assert.equal(placeUnreservedTableItem(off, tableObjects, tableGroups, 'r'), null);
    });
    assert.deepEqual(tableGroups[0].items, [on]);
    assert.equal(tableGroups[1].items.length, 0);
    assert.equal(rooms.r.objects.lamp_off, off.sprite);
    assert.equal(off.sprite.depth, 243.5);
    // the grouped one is stored by the final group pass, not here
    assert.equal(rooms.r.objects.lamp_on, undefined);
});

test('wiring: both table-item paths in createRoom use the overlap helpers, and no nearest-table call is left', () => {
    const create = slice('export function createRoom', 'function isGlobalTrue');
    assert.equal((create.match(/placeMatchedScenarioItem\(/g) || []).length, 1);
    assert.equal((create.match(/placeUnreservedTableItem\(/g) || []).length, 1);
    assert.doesNotMatch(create, /findClosestTable\(/);
});
