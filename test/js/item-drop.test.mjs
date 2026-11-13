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
    assert.deepEqual([s.x, s.y], [50, 68], 'centred one cell in front of the feet by its own size');
    assert.deepEqual(w.added[0].data.position, { x: 34 / 32, y: 52 / 32 }, 'the top-left of the 32x32 picture');
    assert.equal(w.emitted.length, 1);
    assert.equal(w.emitted[0].name, 'item_dropped:box');
    assert.deepEqual([payload.x, payload.y], [50, 68]);
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

test('UX slice 15 (R15): the drop is aimed in front of the feet, then snapped to a walkable cell', async () => {
    const { dropPoint, DROP_AHEAD_PX } = await import(pathToFileURL(join(js, 'systems/item-drop.js')).href);
    assert.deepEqual(dropPoint({ x: 50, y: 60 }, null), { x: 50, y: 60 + DROP_AHEAD_PX }, 'below the feet');
    const asked = [];
    const pm = { findNearestWalkableWorldCell: (x, y, r) => { asked.push([x, y, r]); return { x: 52, y: 68 }; } };
    assert.deepEqual(dropPoint({ x: 50, y: 60 }, pm), { x: 52, y: 68 });
    assert.deepEqual(asked, [[50, 60 + DROP_AHEAD_PX, 0]], 'the aim cell is tried first, on its own');
    assert.ok(DROP_AHEAD_PX > 0);
});

// A grid of 8 px cells over (0,0)-(320,320); `blocked(cx, cy)` says which cells are walls.
function gridPm(blocked = () => false) {
    const step = 8;
    const asked = [];
    return {
        asked,
        worldGridBounds: { minX: 0, minY: 0, cols: 40, rows: 40, step },
        findNearestWalkableWorldCell(x, y, r) {
            asked.push([x, y, r]);
            const cx0 = Math.floor(x / step), cy0 = Math.floor(y / step);
            let best = null, bd = Infinity;
            for (let cy = cy0 - r; cy <= cy0 + r; cy++) for (let cx = cx0 - r; cx <= cx0 + r; cx++) {
                if (cx < 0 || cy < 0 || cx >= 40 || cy >= 40 || blocked(cx, cy)) continue;
                const p = { x: cx * step + 4, y: cy * step + 4 };
                const d = (p.x - x) ** 2 + (p.y - y) ** 2;
                if (d < bd) { bd = d; best = p; }
            }
            return best;
        }
    };
}

test('UX slice 15 R1 (M1): a desk drawn just below the feet sends the drop to the feet or a side cell', async () => {
    const { dropPoint, dropSpotClear } = await import(pathToFileURL(join(js, 'systems/item-drop.js')).href);
    const size = { w: 16, h: 16 };
    const roomRect = { x: 0, y: 0, w: 320, h: 320 };
    // Feet at (60, 156): the aim cell (60, 164) is walkable floor by the grid (a desk's top
    // counts as floor) but the desk sprite from y 166 down, depth 206, draws over it.
    const desk = { x: 40, y: 166, w: 64, h: 40, depth: 206 };
    const at = dropPoint({ x: 60, y: 156 }, gridPm(), { size, roomRect, props: [desk] });
    assert.ok(dropSpotClear(at, size, { roomRect, props: [desk] }), 'the chosen spot shows');
    assert.ok(at.y < 164, 'not the aim cell inside the desk');
    assert.ok(Math.abs(at.x - 60) <= 12 && Math.abs(at.y - 156) <= 4, 'the feet or one cell to the side');
    // With the desk out of the way the aim cell is taken
    assert.deepEqual(dropPoint({ x: 60, y: 156 }, gridPm(), { size, roomRect, props: [] }), { x: 60, y: 164 });
    // A prop drawn under the item (lower depth) does not count
    const rug = { ...desk, depth: 100 };
    assert.deepEqual(dropPoint({ x: 60, y: 156 }, gridPm(), { size, roomRect, props: [rug] }), { x: 60, y: 164 });
    // A static body over the aim box counts like a prop
    const strip = { x: 40, y: 160, w: 64, h: 20 };
    const b = dropPoint({ x: 60, y: 156 }, gridPm(), { size, roomRect, bodies: [strip] });
    assert.ok(b.y < 164);
});

test('UX slice 15 R1 (M1): the side cells are tried when the aim and the feet are both covered', async () => {
    const { dropPoint } = await import(pathToFileURL(join(js, 'systems/item-drop.js')).href);
    const size = { w: 16, h: 16 };
    // A chair drawn over x 56..72 from y 140 down: it covers the aim and feet boxes
    // (x 52..68) by half and the right cell's (60..76) by most; the left cell's box
    // (44..60) only by a 4 px sliver, so the drop goes one cell left.
    const chair = { x: 56, y: 140, w: 16, h: 40, depth: 400 };
    const at = dropPoint({ x: 60, y: 156 }, gridPm(), { size, roomRect: { x: 0, y: 0, w: 320, h: 320 }, props: [chair] });
    assert.deepEqual(at, { x: 52, y: 156 }, 'one cell left of the feet');
});

test('UX slice 15 R1 ruling: the wider rings run front before behind, nearer first, facing side first', async () => {
    const { dropRingOffsets } = await import(pathToFileURL(join(js, 'systems/item-drop.js')).href);
    const none = dropRingOffsets();
    assert.equal(none.length, 20, 'four diagonals and the 16 cells two steps out');
    assert.deepEqual(none.slice(0, 4), [[-1, 1], [1, 1], [-1, -1], [1, -1]], 'diagonals: front first, left first with no facing');
    assert.deepEqual(none[4], [0, 2], 'two steps: straight in front first');
    assert.deepEqual(none.slice(-1)[0][1], -2, 'two steps behind last');
    const right = dropRingOffsets('right');
    assert.deepEqual(right.slice(0, 2), [[1, 1], [-1, 1]], 'facing right: front-right first');
    assert.deepEqual(right.slice(4, 7), [[0, 2], [1, 2], [-1, 2]]);
    assert.deepEqual(dropRingOffsets('down-left').slice(0, 2), [[-1, 1], [1, 1]]);
});

test('UX slice 15 R1 ruling: a diagonal cell, then a cell two steps out, when the first four are blocked', async () => {
    const { dropPoint } = await import(pathToFileURL(join(js, 'systems/item-drop.js')).href);
    const size = { w: 16, h: 16 };
    const roomRect = { x: 0, y: 0, w: 320, h: 320 };
    // Feet at (60, 156) = cell (7, 19). Aim (7, 20), feet, left (6, 19), right (8, 19) unwalkable
    const firstFour = (cx, cy) => (cx === 7 && (cy === 19 || cy === 20)) || ((cx === 6 || cx === 8) && cy === 19);
    assert.deepEqual(dropPoint({ x: 60, y: 156 }, gridPm(firstFour), { size, roomRect }), { x: 52, y: 164 }, 'front-left diagonal');
    assert.deepEqual(dropPoint({ x: 60, y: 156 }, gridPm(firstFour), { size, roomRect, facing: 'right' }), { x: 68, y: 164 }, 'front-right when facing right');
    // Everything within one cell unwalkable: straight in front, two steps
    const ring1 = (cx, cy) => Math.abs(cx - 7) <= 1 && Math.abs(cy - 19) <= 1;
    assert.deepEqual(dropPoint({ x: 60, y: 156 }, gridPm(ring1), { size, roomRect }), { x: 60, y: 172 });
    // ... and with the three cells two steps in front covered by a prop drawn over them,
    // the facing side's front cell two steps out (2, 1)
    const pot = { x: 44, y: 164, w: 32, h: 16, depth: 999 };
    assert.deepEqual(dropPoint({ x: 60, y: 156 }, gridPm(ring1), { size, roomRect, props: [pot], facing: 'right' }), { x: 76, y: 164 });
    assert.deepEqual(dropPoint({ x: 60, y: 156 }, gridPm(ring1), { size, roomRect, props: [pot], facing: 'left' }), { x: 44, y: 164 });
    // A diagonal outside the room is skipped
    const inRoom = { x: 56, y: 0, w: 264, h: 320 };
    assert.deepEqual(dropPoint({ x: 60, y: 156 }, gridPm(firstFour), { size: { w: 8, h: 8 }, roomRect: inRoom }), { x: 68, y: 164 });
});

test('UX slice 15 R1 (m4, n3): nothing clear falls back to the feet, never the raw aim, and stays in the room', async () => {
    const { dropPoint } = await import(pathToFileURL(join(js, 'systems/item-drop.js')).href);
    const size = { w: 16, h: 16 };
    const wall = { x: 0, y: 0, w: 320, h: 320, depth: 999 };
    // Everything covered: the snapped feet
    const pm = gridPm();
    assert.deepEqual(dropPoint({ x: 61, y: 157 }, pm, { size, props: [wall] }), { x: 60, y: 156 });
    assert.equal(pm.asked.at(-1)[2], 2, 'the feet snap searches two cells');
    // Only the aim cell is unwalkable (a pathfinder that returns null for it): the feet
    const onlyAim = gridPm((cx, cy) => cx === 7 && cy === 20);
    assert.deepEqual(dropPoint({ x: 60, y: 156 }, onlyAim, { size }), { x: 60, y: 156 });
    // No walkable cell anywhere: the raw feet, not the aim 8 px below them
    const none = gridPm(() => true);
    assert.deepEqual(dropPoint({ x: 61, y: 157 }, none, { size }), { x: 61, y: 157 });
    // A doorway foot cell in a room that starts at x 100, where the only walkable cells
    // are in the next room (x < 96): the raw feet, never a cell over there, shifted so the
    // box (x 96..112) lies inside the room (R2 n1): centre x 108
    const roomRect = { x: 100, y: 0, w: 220, h: 320 };
    const nextRoom = gridPm((cx) => cx >= 12);
    assert.deepEqual(dropPoint({ x: 104, y: 76 }, nextRoom, { size, roomRect }), { x: 108, y: 76 });
});

test('UX slice 15 R2 (n1): the last fallback box is clamped into the room on every side', async () => {
    const { dropPoint, clampIntoRoom, dropBox } = await import(pathToFileURL(join(js, 'systems/item-drop.js')).href);
    const size = { w: 16, h: 16 };
    const roomRect = { x: 0, y: 0, w: 320, h: 320 };
    // A foot cell in the top strip (y 4) with nothing walkable: the box starts 4 px above
    // the room, so the centre moves down to y 8
    const none = gridPm(() => true);
    const at = dropPoint({ x: 228, y: 4 }, none, { size, roomRect });
    assert.deepEqual(at, { x: 228, y: 8 });
    const b = dropBox(at, size);
    assert.ok(b.y >= 0 && b.x >= 0 && b.x + b.w <= 320 && b.y + b.h <= 320, 'the box is inside the room');
    assert.deepEqual(clampIntoRoom({ x: 318, y: 316 }, size, roomRect), { x: 312, y: 312 }, 'right and bottom');
    assert.deepEqual(clampIntoRoom({ x: 2, y: 100 }, size, roomRect), { x: 8, y: 100 }, 'left');
    assert.deepEqual(clampIntoRoom({ x: 2, y: 3 }, size, null), { x: 2, y: 3 }, 'no room: unchanged');
});

test('UX slice 15 R2 (M1): a door gap or another room under the box is ranked last, not refused', async () => {
    const { dropPoint, dropBox } = await import(pathToFileURL(join(js, 'systems/item-drop.js')).href);
    const size = { w: 16, h: 16 };
    const roomRect = { x: 0, y: 0, w: 320, h: 320 };
    // A door just south of the feet (60, 156): its rectangle (x 48..80, from y 166) touches
    // the aim box (y 156..172), so the drop goes to a cell whose box clears it
    const door = { x: 48, y: 166, w: 32, h: 64 };
    const at = dropPoint({ x: 60, y: 156 }, gridPm(), { size, roomRect, avoid: [door] });
    const b = dropBox(at, size);
    const touches = b.x < door.x + door.w && b.x + b.w > door.x && b.y < door.y + door.h && b.y + b.h > door.y;
    assert.ok(!touches, `the drop box ${JSON.stringify(b)} clears the door`);
    assert.deepEqual(at, { x: 60, y: 156 }, 'the feet: the first candidate whose box ends above the door');
    // The next room's rectangle under everything in reach: the first clear candidate (the aim)
    const nextRoom = { x: 0, y: 100, w: 320, h: 220 };
    assert.deepEqual(dropPoint({ x: 60, y: 156 }, gridPm(), { size, roomRect, avoid: [nextRoom] }), { x: 60, y: 164 });
    // A side cell when the aim and feet both touch the door (a door on the feet's column)
    const column = { x: 56, y: 120, w: 8, h: 80 };
    const side = dropPoint({ x: 60, y: 156 }, gridPm(), { size, roomRect, avoid: [column] });
    assert.ok(Math.abs(side.x - 60) >= 8, 'off the door column');
    const sb = dropBox(side, size);
    assert.ok(sb.x >= 64 || sb.x + sb.w <= 56, 'the box clears the column');
});

test('UX slice 15 R2 (M1, n2): dropClearance lists door sprites and touching rooms to avoid, and only nearby bodies', async () => {
    const { dropClearance } = await import(pathToFileURL(join(js, 'systems/item-drop.js')).href);
    const body = (left, top, right, bottom) => ({ left, top, right, bottom, enable: true, gameObject: {} });
    const statics = [body(10, 10, 40, 20), body(2000, 2000, 2040, 2020), body(-30, 50, -10, 60)];
    const scene = { physics: { world: { staticBodies: { iterate: f => statics.forEach(f) }, bodies: { iterate: () => {} } } } };
    const map = (w, h) => ({ widthInPixels: w, heightInPixels: h });
    const lobby = { position: { x: 0, y: 0 }, map: map(320, 320), objects: {},
        doorSprites: [{ x: 48, y: 32, displayWidth: 32, displayHeight: 64, originX: 0.5, originY: 0.5 }] };
    const usb = { position: { x: 0, y: -256 }, map: map(320, 320), objects: {}, doorSprites: [] };
    const far = { position: { x: 1000, y: 1000 }, map: map(320, 320), objects: {},
        doorSprites: [{ x: 1048, y: 1032, displayWidth: 32, displayHeight: 64 }] };
    const out = dropClearance(scene, usb, null, null, { lobby, usb, far });
    assert.deepEqual(out.roomRect, { x: 0, y: -256, w: 320, h: 320 });
    assert.deepEqual(out.bodies, [{ x: 10, y: 10, w: 30, h: 10 }, { x: -30, y: 50, w: 20, h: 10 }],
        'the far body is left out; one just outside the room (within two cells) is kept');
    assert.deepEqual(out.avoid, [{ x: 32, y: 0, w: 32, h: 64 }, { x: 0, y: 0, w: 320, h: 320 }],
        'the lobby door and the lobby rectangle, not the far room or its door');
});

test('UX slice 15 (R15): a 16x16 drop sits with its bottom below the feet, so it draws in front', async () => {
    const scene = fakeScene(['pic']);
    world(scene);
    dropInventoryItem(trayEl({ id: 'stick', type: 'm', name: 'Stick', sprite: 'pic', droppable: true }));
    const s = scene.sprites.at(-1);
    assert.ok(s.y + s.displayHeight / 2 > 60 + 8, 'its bottom is clearly below the feet');
    assert.ok(s.depth > 60 + 8, 'its depth is past the feet line');
});
