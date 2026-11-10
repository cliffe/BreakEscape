// The inventory hover label is the item's plain name, droppable or not. It used to
// read "<name> (click to drop)"; since the feedback plan's section 5 a droppable
// item's click opens a menu that says "Drop here" (inventory-menu.js), and a touch
// screen never showed the hover label.
// Run with: node --test test/js/inventory-drop-label.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'inventory-drop-label-'));
const stub = (out, code) => writeFileSync(join(dir, out), code);
stub('rooms-stub.mjs', 'export const rooms = {};');
stub('ink-stub.mjs', 'export default class InkEngine {}');
stub('config-stub.mjs', "export const CSRF_TOKEN = 'x';");
stub('info-label-stub.mjs', 'export function setHudLabel() {} export function clearHudLabel() {}');
stub('guard-stub.mjs', 'export function inventoryBlockedByForcedMinigame() { return false; }');
stub('consumables-stub.mjs', 'export function markObjectConsumed() {}');
const source = readFileSync(join(js, 'systems/inventory.js'), 'utf8');
let code = source;
for (const [a, b] of [
    ["'../core/rooms.js'", "'./rooms-stub.mjs'"],
    ["'./ink/ink-engine.js'", "'./ink-stub.mjs'"],
    ["'../config.js'", "'./config-stub.mjs'"],
    ["'../ui/info-label.js'", "'./info-label-stub.mjs'"],
    ["'./forced-minigame-guard.js'", "'./guard-stub.mjs'"],
    ["'./consumables.js'", "'./consumables-stub.mjs'"],
]) {
    assert.ok(code.includes(a), `inventory.js no longer imports ${a}`);
    code = code.replace(a, b);
}
writeFileSync(join(dir, 'inventory.mjs'), code);
globalThis.window = globalThis.window || {};
const { inventoryHoverLabel } = await import(pathToFileURL(join(dir, 'inventory.mjs')).href);

test('a droppable item shows its plain name: the menu offers the drop', () => {
    assert.equal(inventoryHoverLabel({ id: 'usb_1', name: 'BadUSB', droppable: true }), 'BadUSB');
    assert.equal(inventoryHoverLabel({ name: 'Beacon', droppable: true, triggerOnInteract: [] }), 'Beacon');
});

test('any other item keeps its plain name', () => {
    assert.equal(inventoryHoverLabel({ name: 'Lockpick' }), 'Lockpick');
    assert.equal(inventoryHoverLabel({ name: 'Lockpick', droppable: false }), 'Lockpick');
    assert.equal(inventoryHoverLabel({ name: 'Mug', droppable: 'true' }), 'Mug');
});

test('an item with no name gets no half label', () => {
    assert.equal(inventoryHoverLabel({ droppable: true }), undefined);
    assert.equal(inventoryHoverLabel(undefined), undefined);
});

test('the inventory slot uses the label on hover', () => {
    assert.match(source, /addEventListener\('mouseenter', \(\) => setHudLabel\(inventoryHoverLabel\(sprite\.scenarioData\)\)\)/);
});
