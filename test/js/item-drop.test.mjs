// A dropped item looks like itself (feedback plan, section 5): its picture is its
// `sprite`, else its `type` (as the tray and a reload choose it), loaded on demand when
// it is not loaded yet, and the neutral `dropped_item` picture only when its file is
// missing; never the key. The saved drop carries no texture.
// Run with: node test/js/item-drop.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { EventEmitter } from 'node:events';

for (const k of ['log', 'info', 'warn', 'debug']) console[k] = () => {};

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
globalThis.window = globalThis.window || {};
globalThis.document = globalThis.document || { querySelector: () => null };
const { dropTextureKey, ensureDropTexture, dropInventoryItem, persistDrop, DROPPED_ITEM_TEXTURE } =
    await import(pathToFileURL(join(js, 'systems/item-drop.js')).href);

// A Phaser-like scene: textures that exist, and a loader whose files on disk are `onDisk`.
function fakeScene(loaded = [], onDisk = [], sizes = {}) {
    const keys = new Set(['__DEFAULT', ...loaded]);
    const load = new EventEmitter();
    const queue = [];
    load.loaded = [];
    load.image = (key, url) => queue.push({ key, url });
    load.start = () => {
        // finish asynchronously, as Phaser does
        setImmediate(() => {
            while (queue.length) {
                const f = queue.shift();
                load.loaded.push(f.url);
                if (onDisk.includes(f.key)) { keys.add(f.key); load.emit(`filecomplete-image-${f.key}`, f.key); }
                else load.emit('loaderror', { key: f.key });
            }
        });
    };
    const sprites = [];
    return {
        textures: { exists: (k) => keys.has(k) },
        load,
        sprites,
        add: {
            sprite(x, y, key) {
                // Each picture has its size (16x16 unless `sizes` says otherwise)
                const dim = (k) => sizes[k] || [16, 16];
                const s = {
                    x, y, key, scene: true, active: true, displayWidth: dim(key)[0], displayHeight: dim(key)[1],
                    textureLog: [key],
                    setOrigin() { return s; }, setInteractive() { return s; }, setDepth(d) { s.depth = d; return s; },
                    setPosition(px, py) { s.x = px; s.y = py; return s; },
                    setTexture(k) { s.key = k; s.textureLog.push(k); [s.displayWidth, s.displayHeight] = dim(k); return s; }
                };
                sprites.push(s);
                return s;
            }
        }
    };
}
const settle = () => new Promise(r => setImmediate(() => setImmediate(r)));

test('the texture key: sprite, else type, never the key', () => {
    assert.equal(dropTextureKey({ type: 'usb', sprite: 'icon_deviceB' }), 'icon_deviceB');
    assert.equal(dropTextureKey({ type: 'm09_box_taped1' }), 'm09_box_taped1');
    assert.equal(dropTextureKey({ type: 'usb', sprite: '' }), 'usb');
    assert.equal(dropTextureKey({}), DROPPED_ITEM_TEXTURE);
    assert.equal(dropTextureKey(null), DROPPED_ITEM_TEXTURE);
    // the same rule as the tray's inventoryImageKey
    const inv = readFileSync(join(js, 'systems/inventory.js'), 'utf8');
    assert.match(inv, /const named = itemData\?\.sprite;\s*\n\s*return \(typeof named === 'string' && named\) \? named : itemData\?\.type;/);
});

test('the neutral picture exists, and nothing in the drop falls back to the key', () => {
    assert.ok(existsSync(join(js, '../assets/objects/dropped_item.png')));
    const src = readFileSync(join(js, 'systems/item-drop.js'), 'utf8');
    assert.doesNotMatch(src, /'key'/);
});

test('ensureDropTexture: a loaded picture is used at once', () => {
    const scene = fakeScene(['icon_deviceB']);
    const got = [];
    assert.equal(ensureDropTexture(scene, 'icon_deviceB', k => got.push(k)), 'ready');
    assert.deepEqual(got, ['icon_deviceB']);
    assert.deepEqual(scene.load.loaded, []);
});

test('ensureDropTexture: a picture not loaded yet is loaded from objects/ and then used', async () => {
    const scene = fakeScene([], ['qr_card']);
    const got = [];
    assert.equal(ensureDropTexture(scene, 'qr_card', k => got.push(k)), 'loading');
    await settle();
    assert.deepEqual(scene.load.loaded, ['objects/qr_card.png']);
    assert.deepEqual(got, ['qr_card']);
    assert.equal(scene.load.listenerCount('loaderror'), 0, 'listeners cleaned up');
});

test('ensureDropTexture: a missing file falls back to the neutral picture, loaded on demand', async () => {
    const scene = fakeScene([], ['dropped_item']);
    const got = [];
    ensureDropTexture(scene, 'no_such_picture', k => got.push(k));
    await settle();
    await settle();
    assert.deepEqual(scene.load.loaded, ['objects/no_such_picture.png', 'objects/dropped_item.png']);
    assert.deepEqual(got, ['dropped_item']);

    const scene2 = fakeScene(['dropped_item'], []);
    const got2 = [];
    ensureDropTexture(scene2, 'no_such_picture', k => got2.push(k));
    await settle();
    assert.deepEqual(got2, ['dropped_item']);
    assert.equal(scene2.load.listenerCount('loaderror'), 0);
});

// The drop itself, with a fake world around it.
function world(scene) {
    const removed = [];
    const added = [];
    const fetches = [];
    const emitted = [];
    Object.assign(window, {
        game: scene,
        player: { x: 50, y: 60, body: { center: { x: 50, y: 60 } } },
        currentPlayerRoom: 'lab',
        rooms: { lab: { position: { x: 0, y: 0 }, objects: {} } },
        pathfindingManager: null,
        breakEscapeConfig: { gameId: 7 },
        removeFromInventory: (s) => { removed.push(s); return true; },
        RoomStateSync: { addItemToRoom: async (roomId, data, opts) => { added.push({ roomId, data, opts }); return true; } },
        eventDispatcher: { emit(name, p) { emitted.push({ name, ...p }); } },
        gameAlert() {}
    });
    globalThis.fetch = async (url, init) => { fetches.push({ url, body: JSON.parse(init.body) }); return { json: async () => ({ success: true }) }; };
    return { removed, added, fetches, emitted };
}
const trayEl = (data) => ({ scenarioData: { ...data, takeable: false }, src: '/x.png' }); // a DOM <img>: no texture

test('a dropped BadUSB shows its own sprite, not the key (game 80)', async () => {
    const scene = fakeScene(['icon_deviceB', 'key', 'usb']);
    const w = world(scene);
    const payload = dropInventoryItem(trayEl({ id: 'kit_deviceB', type: 'usb', name: 'BadUSB', sprite: 'icon_deviceB', droppable: true, needsTag: 'usb_device' }));
    assert.equal(payload.itemId, 'kit_deviceB');
    assert.deepEqual(scene.sprites[0].textureLog, ['icon_deviceB']);
    await window.rooms.lab.objects.kit_deviceB._dropSync;
    assert.equal(w.added.length, 1);
    assert.equal('texture' in w.added[0].data, false, 'no texture is sent');
    assert.equal(w.added[0].opts.sourceType, 'player_drop');
    assert.deepEqual(w.fetches.map(f => f.body), [{ action_type: 'remove', item: { id: 'kit_deviceB' } }]);
});

test('an item whose picture is not loaded shows it once it loads', async () => {
    const scene = fakeScene(['dropped_item'], ['charging_cable']);
    world(scene);
    dropInventoryItem(trayEl({ id: 'kit_cable', type: 'usb', name: 'Charging cable', sprite: 'charging_cable', droppable: true }));
    const s = scene.sprites[0];
    assert.equal(s.key, 'dropped_item', 'the neutral picture while it loads');
    await settle();
    assert.equal(s.key, 'charging_cable');
    assert.equal(s.textureLog.includes('key'), false);
});

test('an item whose picture file is missing ends on the neutral picture', async () => {
    const scene = fakeScene([], ['dropped_item']);
    world(scene);
    dropInventoryItem(trayEl({ id: 'odd', type: 'odd_type', name: 'Odd thing', droppable: true }));
    const s = scene.sprites[0];
    assert.equal(s.key, '__DEFAULT');
    await settle();
    await settle();
    assert.equal(s.key, 'dropped_item');
});

test('an item picked up again before its picture loads is left alone', async () => {
    const scene = fakeScene([], ['parcel_pic']);
    world(scene);
    dropInventoryItem(trayEl({ id: 'parcel', type: 'm', sprite: 'parcel_pic', droppable: true }));
    const s = scene.sprites[0];
    s.active = false;
    await settle();
    assert.equal(s.key, '__DEFAULT');
});

test('persistDrop sends placement and identity, no texture', async () => {
    const scene = fakeScene(['x']);
    const w = world(scene);
    const ok = await persistDrop(window, 'lab', window.rooms.lab, {}, { id: 'p', type: 'm', name: 'P' }, { x: 64, y: 96 }, { x: 2, y: 3 });
    assert.equal(ok, true);
    assert.deepEqual(Object.keys(w.added[0].data).sort(), ['id', 'interactable', 'name', 'position', 'takeable', 'type', 'x', 'y']);
    assert.deepEqual(w.added[0].data.position, { x: 2, y: 3 });
});

test('a picture loaded on demand is placed by its own size: saved top-left, event after it arrives', async () => {
    // A 32x32 picture, not loaded; the neutral stand-in is 16x16. Feet at (50, 60).
    const scene = fakeScene(['dropped_item'], ['big_box'], { big_box: [32, 32] });
    const w = world(scene);
    const payload = dropInventoryItem(trayEl({ id: 'box', type: 'm', name: 'Box', sprite: 'big_box', droppable: true }));
    assert.equal(w.emitted.length, 0, 'nothing is announced before the picture is on');
    assert.equal(w.added.length, 0, 'nothing is saved before the picture is on');
    await window.rooms.lab.objects.box._dropSync;
    const s = scene.sprites[0];
    assert.equal(s.key, 'big_box');
    assert.deepEqual([s.x, s.y], [50, 60], 'centred on the feet by its own size');
    assert.deepEqual(w.added[0].data.position, { x: 34 / 32, y: 44 / 32 }, 'the top-left of the 32x32 picture');
    assert.equal(w.emitted.length, 1);
    assert.equal(w.emitted[0].name, 'item_dropped:box');
    assert.deepEqual([payload.x, payload.y], [50, 60]);
});

test('a magnet whose picture loads on demand snaps to the table by the loaded size', async () => {
    const scene = fakeScene(['dropped_item'], ['cake_pic'], { cake_pic: [24, 20], table_pic: [96, 48] });
    const w = world(scene);
    // A table just above the feet (50, 60): its rect is x 0..96, y 0..48
    const table = { x: 48, y: 24, displayWidth: 96, displayHeight: 48, texture: { key: 'table_pic' },
        objectId: 'tbl', scenarioData: { type: 'table' } };
    window.rooms.lab.objects.tbl = table;
    dropInventoryItem(trayEl({ id: 'cake', type: 'm', name: 'Cake', sprite: 'cake_pic', droppable: true,
        affordance: { magnet: { tag: 'food' } } }));
    await window.rooms.lab.objects.cake._dropSync;
    const s = scene.sprites[0];
    assert.equal(s.key, 'cake_pic');
    assert.equal(w.emitted[0].onTable, 'tbl', 'on the table');
    // Its base stands on the table: top = base row - its own 20 px height
    const top = s.y - 10;
    assert.equal(w.added[0].data.position.y, top / 32);
    assert.ok(w.added[0].data.position.elevation > 0, 'raised on the table');
});

// ---- Code review R1 (engine feedback changes) ----

// m3: the stand-in is loaded with the game, so a drop that loads its picture is never invisible
test('the neutral stand-in is preloaded with the other object pictures', () => {
    const game = readFileSync(join(js, 'core/game.js'), 'utf8');
    assert.match(game, /this\.load\.image\('dropped_item', 'objects\/dropped_item\.png'\);/);
});

// m4: a room torn down while the picture loads puts the item back in the tray
test('a drop whose sprite is torn down before its picture loads goes back in the tray, saved nothing', async () => {
    const scene = fakeScene(['dropped_item'], ['slow_pic']);
    const w = world(scene);
    const back = [];
    window.inventory = { items: [] };
    window.addToInventory = (s) => { back.push(s); window.inventory.items.push({ scenarioData: s.scenarioData }); };
    dropInventoryItem(trayEl({ id: 'slow', type: 'usb', name: 'Slow stick', sprite: 'slow_pic', droppable: true }));
    const s = scene.sprites[0];
    s.scene = undefined; s.active = false;          // Phaser's destroy()
    const saved = await window.rooms.lab.objects.slow?._dropSync;
    assert.equal(saved, false);
    assert.equal(window.rooms.lab.objects.slow, undefined, 'the dead sprite is out of the room');
    assert.equal(back.length, 1);
    assert.equal(back[0]._restoredFromSave, true, 'no server add, no pickup actions again');
    assert.equal(back[0].scenarioData.id, 'slow');
    assert.equal(back[0].scenarioData.takeable, false);
    assert.equal(back[0].texture.key, 'slow_pic');
    assert.equal(w.added.length, 0);
    assert.equal(w.fetches.length, 0);
    assert.equal(w.emitted.length, 0);
    delete window.addToInventory;
});

test('an item picked up and then torn down is not put in the tray twice', async () => {
    const scene = fakeScene(['dropped_item'], ['slow_pic2']);
    world(scene);
    const back = [];
    window.addToInventory = (s) => back.push(s);
    dropInventoryItem(trayEl({ id: 'slow2', type: 'usb', sprite: 'slow_pic2', droppable: true }));
    // picked up (addToInventory put it in the tray), then the room went
    window.inventory = { items: [{ scenarioData: { id: 'slow2' } }] };
    const s = scene.sprites[0];
    s.active = false; s.scene = undefined;
    const sync = window.rooms.lab.objects.slow2._dropSync;
    assert.equal(await sync, false);
    assert.deepEqual(back, []);
    // picked up with the scene still there: left alone, as before
    const scene2 = fakeScene(['dropped_item'], ['slow_pic3']);
    world(scene2);
    window.inventory = { items: [] };
    dropInventoryItem(trayEl({ id: 'slow3', type: 'usb', sprite: 'slow_pic3', droppable: true }));
    scene2.sprites[0].active = false;
    assert.equal(await window.rooms.lab.objects.slow3._dropSync, false);
    assert.deepEqual(back, []);
    delete window.addToInventory;
});
