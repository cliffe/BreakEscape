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

// ── Items taken out of a container, and the container's own header picture ──
// (code review R2, E-m1; lab_physical_pentest playtest N12)
const itemImageUrl = copy('minigames/container/container-item-image.js', 'container-item-image.mjs');
const { takeStandIn, containerImageUrl, containerImageHtml } = await import(itemImageUrl);

test('an item taken from a container names its tray picture by sprite first, as a restored item does', () => {
    const card = { type: 'keycard', sprite: 'keycard-maintenance', name: 'Spare Power-Room Card' };
    const standIn = takeStandIn(card, inventoryImageKey);
    assert.equal(standIn.texture.key, 'keycard-maintenance');
    assert.equal(standIn.name, 'keycard');
    assert.equal(standIn.scenarioData, card);
    assert.equal(standIn.setVisible(false), standIn);
    assert.equal(takeStandIn({ type: 'usb', name: 'Plain stick' }, inventoryImageKey).texture.key, 'usb');
    const fromPc = takeStandIn(card, inventoryImageKey, { sourcePcId: 'pc1', transfer: 'copy' });
    assert.equal(fromPc.sourcePcId, 'pc1');
    assert.equal(fromPc.transfer, 'copy');
});

test('the container minigame builds its take stand-in and its header picture with these helpers', () => {
    const src = readFileSync(join(js, 'minigames/container/container-minigame.js'), 'utf8');
    assert.match(src, /const tempSprite = takeStandIn\(item, inventoryImageKey,/);
    assert.match(src, /return containerImageUrl\(this\.containerItem, inventoryImageKey\);/);
    assert.doesNotMatch(src, /<img src="\$\{this\.getContainerImageUrl\(\)\}"/, 'no header <img> built from a possibly empty URL');
    assert.equal(src.split('${this.containerImageHtml()}').length - 1, 2, 'both headers (standard and desktop) use the helper');
});

test('a container header: world sprite by texture key, tray item by its tray picture, never "null"', () => {
    // A world container: the texture key, mapped to its file where they differ
    assert.equal(containerImageUrl({ texture: { key: 'safe' } }, inventoryImageKey), '/break_escape/assets/objects/safe1.png');
    assert.equal(containerImageUrl({ texture: { key: 'briefcase' } }, inventoryImageKey), '/break_escape/assets/objects/briefcase.png');
    // Opened from the inventory tray: the item is the tray's <img>, which has no texture
    const trayImg = { scenarioData: { type: 'pc', name: 'Remote Session' },
        getAttribute: (n) => (n === 'src' ? '/break_escape/assets/objects/pc.png' : null) };
    assert.equal(containerImageUrl(trayImg, inventoryImageKey), '/break_escape/assets/objects/pc.png');
    // No texture and no tray picture: the item's own picture name
    assert.equal(containerImageUrl({ scenarioData: { type: 'pc', sprite: 'drop_box1' } }, inventoryImageKey),
        '/break_escape/assets/objects/drop_box1.png');
    // Nothing to go on: no URL, and no <img> at all
    assert.equal(containerImageUrl({}, inventoryImageKey), null);
    assert.equal(containerImageHtml(null, 'x'), '');
    assert.equal(containerImageHtml('/a.png', 'Sofia\'s "PC" <1>'),
        '<img src="/a.png" alt="Sofia\'s &quot;PC&quot; &lt;1>" class="container-image">');
});
