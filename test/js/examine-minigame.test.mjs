// Examine: inventory items with no action and text-only room objects open the
// examine view (sprite at 2x, name, observations, text); everything with an
// action keeps it (systems/examine.js, interactions.js).
// Run with: node --test test/js/examine-minigame.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

// Copy examine.js and its one import into a temp dir, so it loads in isolation.
const dir = mkdtempSync(join(tmpdir(), 'examine-'));
writeFileSync(join(dir, 'forced-minigame-guard.mjs'), readFileSync(join(js, 'systems/forced-minigame-guard.js'), 'utf8'));
writeFileSync(join(dir, 'examine.mjs'), readFileSync(join(js, 'systems/examine.js'), 'utf8')
    .replace("'./forced-minigame-guard.js'", "'./forced-minigame-guard.mjs'"));
const examineUrl = pathToFileURL(join(dir, 'examine.mjs')).href;
const { examineDisplaySize, examineScale, roomDisplayScale, shouldExamine, startExamine, examineImageSource } = await import(examineUrl);

// Load interactions.js with its imports stubbed, recording what each path does.
const calls = [];
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const record = (name) => `export function ${name}(...a) { globalThis.__calls.push(['${name}', a[0]?.scenarioData?.id ?? a[0]]); return Promise.resolve({ ok: true }); }`;
globalThis.__calls = calls;
const stubs = {
    '../utils/constants.js': dataUrl('export const INTERACTION_RANGE = 64, INTERACTION_RANGE_SQ = 4096, INTERACTION_CHECK_INTERVAL = 100, DOOR_INTERACTION_RANGE_SQ = 4096;'),
    '../core/rooms.js': dataUrl('export const rooms = {};'),
    '../core/player.js': dataUrl('export function facePlayerToward() {}'),
    './unlock-system.js': dataUrl(record('handleUnlock')),
    './doors.js': dataUrl('export function handleDoorInteraction() {}'),
    './biometrics.js': dataUrl('export function collectFingerprint() { return null; } export function handleBiometricScan() {}'),
    './inventory.js': dataUrl(record('addToInventory') + ' export function createItemIdentifier(d) { return d?.id; }'),
    './ui-sounds.js': dataUrl('export function playUISound() {} export function playGameSound() {}'),
    './apply-actions.js': dataUrl('export function applyActions() {}'),
    '../utils/conditional-text.js': dataUrl(readFileSync(join(js, 'utils/conditional-text.js'), 'utf8')),
    './npc-reach.js': dataUrl('export function npcReachDistSq() { return 0; }'),
    './examine.js': examineUrl
};

const started = [];
const framework = {
    registeredScenes: { examine: class {}, notes: class {}, 'phone-chat': class {}, 'text-file': class {} },
    currentMinigame: null,
    startMinigame(type, _c, params) { started.push([type, params]); }
};
globalThis.window = {
    MinigameFramework: framework,
    inventory: { items: [] },
    player: { x: 0, y: 0, direction: 'down' },
    gameState: { globalVariables: {} },
    gameAlert: (msg, type, title) => calls.push(['gameAlert', title]),
    gameDisplay: (msg, title) => calls.push(['gameDisplay', title]),
    addNote: () => true,
    startNotesMinigame: (s) => calls.push(['notes', s.scenarioData?.id]),
    lockRef: () => null,
    npcManager: { getNPC: () => ({}) }
};

let src = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
for (const [spec, url] of Object.entries(stubs)) src = src.split(`'${spec}'`).join(`'${url}'`);
const { handleObjectInteraction } = await import(dataUrl(src));

function reset() { calls.length = 0; started.length = 0; framework.currentMinigame = null; window.inventory.items = []; }
const roomSprite = (data) => ({ name: data.type, objectId: data.id, x: 0, y: 8, scenarioData: data,
    texture: { key: data.type }, frame: { name: '__BASE', cutWidth: 32, cutHeight: 24 } });
const invImg = (data) => {
    const img = { name: data.type, objectId: 'inventory_' + data.id, scenarioData: { ...data, takeable: false },
        src: `/break_escape/assets/objects/${data.type}.png`, naturalWidth: 32, naturalHeight: 32 };
    window.inventory.items.push(img);
    return img;
};

test('size: twice the room display scale, whole-number multiple, at least 4x', () => {
    assert.equal(examineScale(2.1875), 4);          // 1400px window, canvas 640 wide, camera zoom 1
    assert.equal(examineScale(3), 6);
    assert.equal(examineScale(2.8), 6);             // 5.6 rounds to 6
    assert.equal(examineScale(1), 4);               // minimum 4x
    assert.equal(examineScale(undefined), 4);
    assert.equal(examineScale(0), 4);
    assert.deepEqual(examineDisplaySize(32, 24, 3), { width: 192, height: 144, scale: 6 });
    assert.deepEqual(examineDisplaySize(22, 20, 2.1875), { width: 88, height: 80, scale: 4 });
    assert.deepEqual(examineDisplaySize(15.6, '7', 1), { width: 64, height: 28, scale: 4 });
    assert.deepEqual(examineDisplaySize(undefined, null, 3), { width: 0, height: 0, scale: 6 });
});

test('room display scale: canvas CSS width over game width, times camera zoom', () => {
    const scene = (cssW, w, zoom) => ({ sys: { game: { canvas: { width: w, getBoundingClientRect: () => ({ width: cssW }) } } },
        cameras: { main: { zoom } } });
    assert.equal(roomDisplayScale(scene(1400, 640, 1)), 2.1875);
    assert.equal(roomDisplayScale(scene(640, 320, 1.5)), 3);
    assert.equal(roomDisplayScale(null), 1);
});

test('image source: inventory <img> uses its own file and natural size', () => {
    const s = examineImageSource({ src: '/x/mug.png', naturalWidth: 16, naturalHeight: 20 });
    assert.deepEqual(s, { src: '/x/mug.png', width: 16, height: 20 });
});

test('image source: room sprite reads its current frame', () => {
    const textures = { getBase64: (key, frame) => `data:${key}:${frame}` };
    const s = examineImageSource({ texture: { key: 'mug' }, frame: { name: '__BASE', cutWidth: 30, cutHeight: 22 } }, { textures });
    assert.deepEqual(s, { src: 'data:mug:__BASE', width: 30, height: 22 });
});

test('routing: a no-action inventory item opens examine', () => {
    reset();
    handleObjectInteraction(invImg({ type: 'pin-cracker', id: 'tool', name: 'Odd Device', observations: 'Matte casing.' }));
    assert.equal(started.length, 1);
    assert.equal(started[0][0], 'examine');
    assert.equal(started[0][1].itemName, 'Odd Device');
    assert.equal(started[0][1].observations, 'Matte casing.');
    assert.equal(started[0][1].imageWidth, 32);
    assert.equal(calls.filter(c => c[0] === 'gameAlert').length, 0);
});

test('routing: an inventory item with no text still opens examine', () => {
    reset();
    handleObjectInteraction(invImg({ type: 'mug', id: 'mug1', name: 'Mug' }));
    assert.equal(started[0]?.[0], 'examine');
});

test('routing: an action item keeps its action (phone, notepad, readable lanyard, lockpick, key)', () => {
    reset();
    handleObjectInteraction(invImg({ type: 'phone', id: 'p', name: 'Phone', npcIds: ['ghost'], phoneId: 'g' }));
    assert.equal(started[0]?.[0], 'phone-chat');

    reset();
    handleObjectInteraction(invImg({ type: 'notepad', id: 'n', name: 'Notepad' }));
    assert.deepEqual(started, []);
    assert.equal(calls.some(c => c[0] === 'notes'), true);

    reset();
    handleObjectInteraction(invImg({ type: 'lanyard', id: 'l', name: 'Lanyard', readable: true, readDisplay: 'gameDisplay',
        addToNotes: false, text: 'ST. CATHERINE\'S', observations: 'Green ribbon.' }));
    assert.deepEqual(started, []);
    assert.deepEqual(calls.filter(c => c[0] === 'gameDisplay').map(c => c[1]), ['Lanyard']);

    reset();
    handleObjectInteraction(invImg({ type: 'lockpick', id: 'lp', name: 'Lockpick Set' }));
    assert.deepEqual(started, []);
    assert.equal(calls.some(c => c[0] === 'gameAlert'), true);

    reset();
    handleObjectInteraction(invImg({ type: 'key_ring', id: 'k', name: 'Office Key', observations: 'Brass.' }));
    assert.deepEqual(started, []);
    assert.equal(calls.some(c => c[0] === 'gameAlert'), true);
});

test('routing: a text-only room object opens examine (sis01 cold coffee)', () => {
    reset();
    handleObjectInteraction(roomSprite({ type: 'dirty_mugs', id: 'itsec_cold_coffee', name: 'Cold Coffee', takeable: false,
        observations: 'Three mugs of cold coffee on the workbench.' }));
    assert.equal(started[0]?.[0], 'examine');
    assert.equal(started[0][1].itemId, 'itsec_cold_coffee');
    assert.equal(started[0][1].imageWidth, 32);
    assert.equal(started[0][1].imageHeight, 24);
    assert.equal(calls.filter(c => c[0] === 'gameAlert').length, 0);
});

test('routing: a takeable room object is picked up, not examined', () => {
    reset();
    handleObjectInteraction(roomSprite({ type: 'mug', id: 'mug2', name: 'Mug', takeable: true, observations: 'A mug.' }));
    assert.deepEqual(started, []);
    assert.deepEqual(calls.filter(c => c[0] === 'addToInventory'), [['addToInventory', 'mug2']]);
});

test('routing: room objects with their own display keep it', () => {
    reset();
    handleObjectInteraction(roomSprite({ type: 'sign', id: 's1', name: 'Plaque', takeable: false,
        observations: 'Brass.', observationDisplay: 'gameDisplay' }));
    assert.deepEqual(started, []);
    assert.deepEqual(calls.filter(c => c[0] === 'gameDisplay').map(c => c[1]), ['Plaque']);

    reset();
    handleObjectInteraction(roomSprite({ type: 'notice', id: 's2', name: 'Notice', takeable: false, readable: true,
        text: 'Wash your hands.' }));
    assert.deepEqual(started, []);

    reset();
    handleObjectInteraction(roomSprite({ type: 'safe', id: 's3', name: 'Safe', takeable: false, locked: true,
        lockType: 'pin', observations: 'Heavy.' }));
    assert.deepEqual(started, []);
    assert.deepEqual(calls.filter(c => c[0] === 'handleUnlock'), [['handleUnlock', 's3']]);
});

test('routing: a room object with no text at all keeps the plain notification', () => {
    reset();
    handleObjectInteraction(roomSprite({ type: 'plant', id: 'p1', name: 'Plant', takeable: false }));
    assert.deepEqual(started, []);
});

test('shouldExamine rules', () => {
    assert.equal(shouldExamine({ takeable: false, observations: 'x' }, { resolvedObservations: 'x' }), true);
    assert.equal(shouldExamine({ takeable: false, text: 'x' }, { resolvedText: 'x' }), true);
    assert.equal(shouldExamine({ takeable: true, observations: 'x' }, { resolvedObservations: 'x' }), false);
    assert.equal(shouldExamine({ takeable: false, onInteract: {} }, { resolvedObservations: 'x' }), false);
    assert.equal(shouldExamine({ type: 'key' }, { inInventory: true }), false);
    assert.equal(shouldExamine({ readable: true, text: 'x' }, { inInventory: true, resolvedText: 'x' }), false);
    assert.equal(shouldExamine({ type: 'mug' }, { inInventory: true }), true);
});

test('a forced (disableClose) minigame is never replaced by examine', () => {
    reset();
    framework.currentMinigame = { params: { disableClose: true } };
    assert.equal(startExamine({ scenarioData: { name: 'Mug' }, src: '/m.png' }, {}, { framework }), false);
    assert.deepEqual(started, []);
    framework.currentMinigame = null;
});
