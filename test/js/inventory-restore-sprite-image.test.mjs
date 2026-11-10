// Playtest E1 (lab_physical_pentest, game 49): after a reload the inventory tray
// showed missing-image placeholders (QR card, charging cable, both USB sticks) and
// different pictures for the lockpick set and the drop box. A restored item has no
// world sprite, and its stand-in took the item TYPE as its image key, ignoring the
// scenario object's "sprite" (which is what the room draws, so the tray was right
// until the reload). The stand-in now uses "sprite" first, and a picture that fails
// to load falls back once to the type's own.
// Run with: node --test test/js/inventory-restore-sprite-image.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'inventory-sprite-image-'));
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

// A small DOM: enough for addToInventory to build a slot and an <img>.
const made = [];
const el = (tag) => {
    const node = {
        tag, style: {}, children: [], listeners: {}, attrs: {},
        classList: { add() {}, remove() {}, contains: () => false },
        appendChild(c) { node.children.push(c); return c; },
        addEventListener(type, fn) { (node.listeners[type] ||= []).push(fn); },
        setAttribute(k, v) { node.attrs[k] = v; },
        getAttribute: k => node.attrs[k],
        querySelector: () => null, querySelectorAll: () => [],
    };
    made.push(node);
    return node;
};
const tray = el('div');
globalThis.window = {};
globalThis.document = {
    getElementById: id => (id === 'inventory-container' ? tray : null),
    createElement: el, querySelector: () => null, querySelectorAll: () => [],
};
const { processInitialInventoryItems, inventoryImageKey, fallbackInventoryImage } = await import(inventoryUrl);

function reset(playerInventory) {
    tray.children.length = 0;
    globalThis.fetch = async () => ({ json: async () => ({ success: true }) });
    Object.assign(window, {
        breakEscapeConfig: { gameId: 1 },
        lockRef: item => item?.opens_lock || item?.key_id || null,
        inventory: { items: [], _initialItemsProcessed: false },
        gameState: { notes: [], globalVariables: {} },
        gameScenario: { playerInventory },
    });
}
const trayImages = () => tray.children.flatMap(slot => slot.children.filter(c => c.tag === 'img'))
    .map(img => [img.alt, img.src.split('/').pop()]);

test('the image key is the scenario sprite when there is one, else the type', () => {
    assert.equal(inventoryImageKey({ type: 'usb', sprite: 'charging_cable' }), 'charging_cable');
    assert.equal(inventoryImageKey({ type: 'lockpick' }), 'lockpick');
    assert.equal(inventoryImageKey({ type: 'pc', sprite: '' }), 'pc');
    assert.equal(inventoryImageKey({ type: 'pc', sprite: { key: 'x' } }), 'pc', 'a non-string sprite is ignored');
});

test('reload: restored items draw the same pictures as before the reload', async () => {
    reset([
        { type: 'usb', id: 'kit_cable', name: 'Malicious charging cable', sprite: 'charging_cable', takeable: true },
        { type: 'usb', id: 'kit_usb', name: 'Storage USB stick', sprite: 'usb_bowl1', takeable: true },
        { type: 'hq_poster_postit', id: 'kit_qr', name: 'QR-code card', sprite: 'qr_card', takeable: true },
        { type: 'lockpick', id: 'kit_lockpick', name: 'Lockpick set', sprite: 'lockpick_set', takeable: true },
        { type: 'pc', id: 'kit_dropbox', name: 'Network drop box', sprite: 'drop_box1', takeable: true },
        { type: 'workstation', id: 'plain', name: 'Crypto workstation', takeable: true },
    ]);
    processInitialInventoryItems();
    await new Promise(r => setTimeout(r, 10));
    assert.deepEqual(trayImages(), [
        ['Malicious charging cable', 'charging_cable.png'],
        ['Storage USB stick', 'usb_bowl1.png'],
        ['QR-code card', 'qr_card.png'],
        ['Lockpick set', 'lockpick_set.png'],
        ['Network drop box', 'drop_box1.png'],
        ['Crypto workstation', 'workstation.png'],
    ]);
});

test('a picture that fails to load falls back once to the type image', async () => {
    reset([{ type: 'lockpick', id: 'odd', name: 'Odd pick', sprite: 'no_such_picture', takeable: true }]);
    processInitialInventoryItems();
    await new Promise(r => setTimeout(r, 10));
    const img = tray.children[0].children.find(c => c.tag === 'img');
    assert.equal(img.src.split('/').pop(), 'no_such_picture.png');
    img.listeners.error.forEach(fn => fn());
    assert.equal(img.src.split('/').pop(), 'lockpick.png');
    img.src = '/break_escape/assets/objects/still_missing.png';
    img.listeners.error.forEach(fn => fn());
    assert.equal(img.src.split('/').pop(), 'still_missing.png', 'no second fallback, so no error loop');
});

test('no fallback when the missing picture is already the type image', () => {
    const img = { src: 'http://x/break_escape/assets/objects/usb.png' };
    assert.equal(fallbackInventoryImage(img, 'usb'), false);
    assert.equal(img.src, 'http://x/break_escape/assets/objects/usb.png');
});
