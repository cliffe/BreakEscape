// Grouped scenario objects (core/rooms.js) get their spriteVariants listeners, as ungrouped
// ones always have. Before this, an object placed through a table_items /
// conditional_table_items placeholder, or listed in a table's tableItems, joined the table
// group but never registered the listener, so it kept its first texture until a reload
// (m02's ehr_terminal_ward stayed on the ransom screen after ward_recovering).
// The helpers are sliced out of the source and run with stubs, because rooms.js needs Phaser.
// Run with: node test/js/table-group-variant-listeners.test.mjs
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
    const rooms = { ward: { objects: {} } };
    const gameRef = { textures: { exists: () => true } };
    const resolveObjectField = (data, field, fallback) => {
        for (const v of data[`${field}Variants`] || []) {
            const name = /globalVars\.(\w+)/.exec(v.condition)[1];
            if (window.gameState.globalVariables[name]) return v.value;
        }
        return data[field] ?? fallback;
    };
    const code = slice('function registerSpriteVariantListeners', '// ===== END: ITEM POOL MANAGEMENT')
        + slice('function addScenarioItemToTableGroup', '\n}\n') + '\n}\n';
    const fns = new Function('rooms', 'gameRef', 'resolveObjectField',
        `${code}; return { registerSpriteVariantListeners, addScenarioItemToTableGroup };`)(rooms, gameRef, resolveObjectField);
    const fire = (name, value) => {
        window.gameState.globalVariables[name] = value;
        for (const fn of handlers.get(`global_variable_changed:${name}`) || []) fn({ name, value });
    };
    return { ...fns, rooms, handlers, fire };
}

const sprite = (id, key) => ({ objectId: id, texture: { key }, setTexture(k) { this.texture.key = k; } });
const quiet = (fn) => { const l = console.log; console.log = () => {}; try { return fn(); } finally { console.log = l; } };

test('a grouped object with spriteVariants swaps texture live when its global changes (m02 ward terminal)', () => {
    const { addScenarioItemToTableGroup, rooms, fire } = build();
    const group = { items: [] };
    const s = sprite('ehr_terminal_ward', 'pc_ransomware');
    const obj = { id: 'ehr_terminal_ward', type: 'pc', sprite: 'pc_ransomware',
        spriteVariants: [{ condition: 'globalVars.ward_recovering', value: 'pc' }] };
    quiet(() => addScenarioItemToTableGroup(group, s, 'conditional_table_items', obj, 'ward'));
    assert.equal(group.items.length, 1);
    assert.equal(group.items[0].sprite, s);
    assert.equal(rooms.ward.objects.ehr_terminal_ward, s);
    quiet(() => fire('ward_recovering', true));
    assert.equal(s.texture.key, 'pc');
});

test('a grouped object without spriteVariants registers nothing and never changes (sis01 ward station)', () => {
    const { addScenarioItemToTableGroup, handlers, fire } = build();
    const group = { items: [] };
    const s = sprite('ward_monitoring_station', 'pc_ransomware');
    const obj = { id: 'ward_monitoring_station', type: 'pc', sprite: 'pc_ransomware', locked: true,
        observationVariants: [{ condition: 'globalVars.network_isolated', value: 'x' }] };
    quiet(() => addScenarioItemToTableGroup(group, s, 'table_items (regular)', obj, 'ward'));
    assert.equal(handlers.size, 0);
    quiet(() => { fire('network_isolated', true); fire('debrief_started', true); });
    assert.equal(s.texture.key, 'pc_ransomware');
});

test('every scenario path that joins a table group goes through addScenarioItemToTableGroup', () => {
    // The placeholder branch and the tableItems list (modes A and B) used to push into
    // group.items directly; a direct push of a scenario item would skip the listener.
    // Since seat box slice 3 the placeholder branch goes through placeMatchedScenarioItem, which
    // calls addScenarioItemToTableGroup for a match that overlaps a table.
    const create = slice('export function createRoom', 'function isGlobalTrue');
    assert.equal((create.match(/addScenarioItemToTableGroup\(/g) || []).length, 1);
    assert.equal((create.match(/placeMatchedScenarioItem\(/g) || []).length, 1);
    const helper = slice('function placeMatchedScenarioItem', '\n}\n');
    assert.equal((helper.match(/addScenarioItemToTableGroup\(/g) || []).length, 1);
    assert.doesNotMatch(create, /group\.items\.push\(\{ sprite, type: (sourceLayer|'scenario_table_item') \}\)/);
});

// Review R3 (bench_pc): an object matched to a Tiled item with no scenario sprite was created
// with the map's picture (pc6). When its variant stops holding it returns to that picture, not
// to its type's texture ("pc").
test('a swap back returns to the texture the sprite was created with, not the type texture', () => {
    const { registerSpriteVariantListeners, rooms, fire } = build();
    const s = sprite('bench_pc', 'aw_pc_off1');
    s.variantBaseKey = 'pc6';
    rooms.ward.objects.bench_pc = s;
    const obj = { id: 'bench_pc', type: 'pc', spriteVariants: [{ condition: 'globalVars.bench_pc_off', value: 'aw_pc_off1' }] };
    quiet(() => registerSpriteVariantListeners(s, obj, 'ward'));
    fire('bench_pc_off', false);
    assert.equal(s.texture.key, 'pc6');
    fire('bench_pc_off', true);
    assert.equal(s.texture.key, 'aw_pc_off1');
});
