// Resume: the restore skipped a saved item whose type and name matched a held one even
// when both carried different ids, so a second cup of coffee (same type and name, own id)
// vanished on reload while the server still held it (blind m02 finding, audit of stored
// games: sis02 and m08 games lost cups). Same id, or no id on either side, still counts
// as the one item.
// Run with: node --test test/js/inventory-resume-same-name.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'inventory-resume-same-name-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
const copy = (src, out, rewrites = []) => {
    let code = readFileSync(join(js, src), 'utf8');
    for (const [a, b] of rewrites) code = code.replace(a, b);
    writeFileSync(join(dir, out), code);
    return pathToFileURL(join(dir, out)).href;
};
const stub = (out, code) => { writeFileSync(join(dir, out), code); };

stub('rooms-stub.mjs', 'export const rooms = {};');
stub('ink-stub.mjs', 'export default class InkEngine {}');
stub('config-stub.mjs', "export const CSRF_TOKEN = 'x';");
stub('info-label-stub.mjs', 'export function setHudLabel() {} export function clearHudLabel() {}');
copy('systems/forced-minigame-guard.js', 'forced-minigame-guard.mjs');
copy('systems/consumables.js', 'consumables.mjs');
const inventoryUrl = copy('systems/inventory.js', 'inventory.mjs', [
    ["'../core/rooms.js'", "'./rooms-stub.mjs'"],
    ["'./ink/ink-engine.js'", "'./ink-stub.mjs'"],
    ["'../config.js'", "'./config-stub.mjs'"],
    ["'../ui/info-label.js'", "'./info-label-stub.mjs'"],
    ["'./forced-minigame-guard.js'", "'./forced-minigame-guard.mjs'"],
    ["'./consumables.js'", "'./consumables.mjs'"],
]);

const dom = new JSDOM('<!doctype html><div id="inventory-container"></div>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const inv = await import(inventoryUrl);
const { processInitialInventoryItems, initializeInventory, isSameHeldItem } = inv;


function reset({ playerInventory, startItemsInInventory } = {}) {
    globalThis.fetch = async () => ({ json: async () => ({ success: true }) });
    window.breakEscapeConfig = { gameId: 77 };
    window.lockRef = item => item?.opens_lock || item?.key_id || null;
    window.gameState = { notes: [], globalVariables: {} };
    window.addNote = () => null;
    window.gameAlert = () => {};
    window.eventDispatcher = { emit: () => {} };
    window.gameScenario = { playerInventory, startItemsInInventory };
    initializeInventory();
}
const heldIds = () => window.inventory.items.map(it => it.scenarioData?.id || it.scenarioData?.type);
const cup = n => ({ type: 'office-misc-cup', id: `engineering_workshop_office-misc-cup_${n}`, name: 'Cup of coffee', takeable: true });

test('two cups with the same type and name but their own ids are both restored', () => {
    reset({ playerInventory: [cup(212), cup(213), cup(214)] });
    processInitialInventoryItems();
    const cups = heldIds().filter(id => /office-misc-cup/.test(id));
    assert.ok(cups.length === 3, `3 cups restored, got ${cups.length}`);
});

test('the same id twice is still one item', () => {
    reset({ playerInventory: [cup(212), cup(212)] });
    processInitialInventoryItems();
    assert.ok(heldIds().filter(id => /office-misc-cup/.test(id)).length === 1, 'one cup');
});

test('items with no id on either side still match on type and name', () => {
    reset({ playerInventory: [{ type: 'bandage', name: 'Bandage' }, { type: 'bandage', name: 'Bandage' }] });
    processInitialInventoryItems();
    assert.ok(heldIds().filter(id => id === 'bandage').length === 1, 'one bandage');
});

test('a saved lockpick with an id still merges with the held start lockpick that has none', () => {
    reset({ playerInventory: [{ type: 'lockpick', name: 'Lock Pick Kit' }, { type: 'lockpick', name: 'Lock Pick Kit', id: 'kevin_park_held_0' }] });
    processInitialInventoryItems();
    assert.ok(heldIds().filter(id => id === 'lockpick' || id === 'kevin_park_held_0').length === 1, 'one lockpick');
});

test('an id on one side and a lock reference on the other compare as identities', () => {
    assert.ok(isSameHeldItem({ type: 'key', name: 'A', id: 'door1' }, { scenarioData: { type: 'key', name: 'B', opens_lock: 'door1' } }), 'same identity');
});

test('keys match on the lock they open when they carry no id', () => {
    assert.ok(isSameHeldItem({ type: 'key', name: 'A', opens_lock: 'door1' }, { scenarioData: { type: 'key', name: 'B', opens_lock: 'door1' } }), 'same lock');
    assert.ok(!isSameHeldItem({ type: 'key', name: 'A', opens_lock: 'door1' }, { scenarioData: { type: 'key', name: 'A', opens_lock: 'door2' } }), 'different locks are different keys');
});
