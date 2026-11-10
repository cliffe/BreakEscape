// Slice 9.3a step 7 (docs/achitechture/ACCESS_MODEL_SLICE_9_3_PLAN.md 4.1): interactions.js
// routes a network jack and a network link item to network-links.js and never to the generic
// flow (no triggerOnInteract, no unlock, no pickup, no examine).
// Run with: node test/js/network-links-routing.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { inventoryMenuUrl } from './fixtures/inventory-menu-url.mjs';

for (const k of ['log', 'info', 'debug']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'network-routing-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
writeFileSync(join(dir, 'forced-minigame-guard.mjs'), readFileSync(join(js, 'systems/forced-minigame-guard.js'), 'utf8'));
writeFileSync(join(dir, 'examine.mjs'), readFileSync(join(js, 'systems/examine.js'), 'utf8')
    .replace("'./forced-minigame-guard.js'", "'./forced-minigame-guard.mjs'"));
const examineUrl = pathToFileURL(join(dir, 'examine.mjs')).href;

const calls = [];
globalThis.__calls = calls;
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const record = (name) => `export function ${name}(...a) { globalThis.__calls.push(['${name}', a[0]?.scenarioData?.id ?? a[0]]); return Promise.resolve({ ok: true }); }`;
const stubs = {
    '../utils/constants.js': dataUrl('export const INTERACTION_RANGE = 64, INTERACTION_RANGE_SQ = 4096, INTERACTION_CHECK_INTERVAL = 100, DOOR_INTERACTION_RANGE_SQ = 4096; export const overlayDepth = (d) => d;'),
    '../core/rooms.js': dataUrl('export const rooms = {};'),
    '../core/player.js': dataUrl('export function facePlayerToward() {}'),
    './unlock-system.js': dataUrl(record('handleUnlock')),
    './doors.js': dataUrl('export function handleDoorInteraction() {}'),
    './biometrics.js': dataUrl('export function collectFingerprint() { return null; } export function handleBiometricScan() {}'),
    './inventory.js': dataUrl(record('addToInventory') + ' export function createItemIdentifier(d) { return d?.id; }'),
    './ui-sounds.js': dataUrl('export function playUISound() {} export function playGameSound() {}'),
    './apply-actions.js': dataUrl("export function applyActions(a) { globalThis.__calls.push(['applyActions', a?.length]); }"),
    '../utils/conditional-text.js': dataUrl(readFileSync(join(js, 'utils/conditional-text.js'), 'utf8')),
    '../utils/flag-lock.js': dataUrl(readFileSync(join(js, 'utils/flag-lock.js'), 'utf8')),
    './requires-item-hint.js': dataUrl(readFileSync(join(js, 'systems/requires-item-hint.js'), 'utf8')
    './pc-policy.js': dataUrl(readFileSync(join(js, 'systems/pc-policy.js'), 'utf8')),
        .replace("'../utils/conditional-text.js'", `'${dataUrl(readFileSync(join(js, 'utils/conditional-text.js'), 'utf8'))}'`)),
    '../utils/locked-hint.js': dataUrl(readFileSync(join(js, 'utils/locked-hint.js'), 'utf8')),
    './npc-reach.js': dataUrl('export function npcReachDistSq() { return 0; }'),
    './examine.js': examineUrl,
    './combat-input.js': dataUrl(readFileSync(join(js, 'systems/combat-input.js'), 'utf8')),
    './consumables.js': dataUrl(readFileSync(join(js, 'systems/consumables.js'), 'utf8')),
    './interaction-walls.js': dataUrl(readFileSync(join(js, 'systems/interaction-walls.js'), 'utf8')),
    './interaction-reach.js': dataUrl(readFileSync(join(js, 'systems/interaction-reach.js'), 'utf8')),
    './minigame-registry.js': dataUrl("export const hasMinigameStarter = () => { globalThis.__calls.push(['registry']); return false; }; export const startRegisteredMinigame = () => false;"),
    './inventory-menu.js': inventoryMenuUrl
};

const started = [];
const framework = {
    registeredScenes: { examine: class {}, notes: class {}, 'text-file': class {} },
    currentMinigame: null,
    startMinigame(type, _c, params) { started.push([type, params]); }
};
globalThis.window = {
    MinigameFramework: framework,
    inventory: { items: [] },
    player: { x: 0, y: 0, direction: 'down' },
    gameState: { globalVariables: {} },
    gameAlert: (...a) => calls.push(['gameAlert', a[0]]),
    gameDisplay: (msg, title) => calls.push(['gameDisplay', title]),
    lockRef: () => null,
    npcManager: { getNPC: () => ({}) },
    networkLinks: {
        interactJack: (sprite) => calls.push(['interactJack', sprite.scenarioData.id]),
        open: (footholdId) => calls.push(['open', footholdId])
    }
};

let src = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
for (const [spec, url] of Object.entries(stubs)) src = src.split(`'${spec}'`).join(`'${url}'`);
const { handleObjectInteraction } = await import(dataUrl(src));

function reset() { calls.length = 0; started.length = 0; window.inventory.items = []; }
const roomSprite = (data) => ({ name: data.type, objectId: data.id, x: 0, y: 8, scenarioData: data,
    texture: { key: data.type }, frame: { name: '__BASE', cutWidth: 32, cutHeight: 24 } });

test('a jack goes to networkLinks.interactJack and nowhere else', () => {
    reset();
    handleObjectInteraction(roomSprite({ id: 'comms_port', type: 'pc', name: 'Spare wall port', networkJack: true,
        takeable: false, observations: 'A spare port.' }));
    assert.deepEqual(calls.filter(c => c[0] !== 'gameAlert'), [['interactJack', 'comms_port']]);
    assert.deepEqual(started, [], 'no minigame (no examine, no container)');
});

test('a jack with a stray triggerOnInteract still goes to the plant flow, never applyActions', () => {
    reset();
    handleObjectInteraction(roomSprite({ id: 'comms_port', type: 'pc', name: 'Port', networkJack: true,
        triggerOnInteract: [{ type: 'set_global', name: 'x', value: true }] }));
    assert.deepEqual(calls, [['interactJack', 'comms_port']]);
});

test('a link item in the tray opens its foothold\'s view and nothing else', () => {
    reset();
    const img = { name: 'network_link', objectId: 'inventory_netlink', scenarioData: { id: 'netlink_jack_comms_port',
        type: 'network_link', name: 'Drop box: comms room', footholdId: 'jack_comms_port', takeable: false,
        observations: 'Your drop box on Spare wall port.' } };
    window.inventory.items.push(img);
    handleObjectInteraction(img);
    assert.deepEqual(calls, [['open', 'jack_comms_port']]);
    assert.deepEqual(started, [], 'not the examine view');
});

test('a sign-in PC still goes to the sign-in branch, before the jack branch', () => {
    reset();
    handleObjectInteraction(roomSprite({ id: 'lena_pc', type: 'pc', name: "Lena's PC", lockType: 'login', locked: true }));
    assert.deepEqual(calls, [['handleUnlock', 'lena_pc']]);
});
