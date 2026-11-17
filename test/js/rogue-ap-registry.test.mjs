// Physical pentest A1 (4.3): the wifiTwin branch in interactions.js, the rogue-ap registry
// entry and the schema keys wifiTwin, apScan, apPortal and apCaptureLog.
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
const dir = mkdtempSync(join(tmpdir(), 'rogue-ap-routing-'));
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
        .replace("'../utils/conditional-text.js'", `'${dataUrl(readFileSync(join(js, 'utils/conditional-text.js'), 'utf8'))}'`)),
    './pc-policy.js': dataUrl(readFileSync(join(js, 'systems/pc-policy.js'), 'utf8')),
    '../utils/locked-hint.js': dataUrl(readFileSync(join(js, 'utils/locked-hint.js'), 'utf8')),
    './npc-reach.js': dataUrl('export function npcReachDistSq() { return 0; }'),
    './examine.js': examineUrl,
    './combat-input.js': dataUrl(readFileSync(join(js, 'systems/combat-input.js'), 'utf8')),
    './consumables.js': dataUrl(readFileSync(join(js, 'systems/consumables.js'), 'utf8')),
    './interaction-walls.js': dataUrl(readFileSync(join(js, 'systems/interaction-walls.js'), 'utf8')),
    './interaction-reach.js': dataUrl(readFileSync(join(js, 'systems/interaction-reach.js'), 'utf8')),
    './minigame-registry.js': dataUrl("export const hasMinigameStarter = () => { globalThis.__calls.push(['registry']); return false; }; export const startRegisteredMinigame = (type, obj) => { globalThis.__calls.push(['startRegistered', type, obj?.scenarioData?.id]); return true; };"),
    './inventory-menu.js': inventoryMenuUrl,
    '../utils/display-dashes.js': dataUrl(readFileSync(join(js, 'utils/display-dashes.js'), 'utf8')),
    '../utils/escape-html.js': dataUrl(readFileSync(join(js, 'utils/escape-html.js'), 'utf8'))
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
        interactWifiAp: (sprite) => calls.push(['interactWifiAp', sprite.scenarioData.id]),
        open: (footholdId) => calls.push(['open', footholdId])
    }
};

let src = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
for (const [spec, url] of Object.entries(stubs)) src = src.split(`'${spec}'`).join(`'${url}'`);
const { handleObjectInteraction } = await import(dataUrl(src));

function reset() { calls.length = 0; started.length = 0; window.inventory.items = []; }
const roomSprite = (data) => ({ name: data.type, objectId: data.id, x: 0, y: 8, scenarioData: data,
    texture: { key: data.type }, frame: { name: '__BASE', cutWidth: 32, cutHeight: 24 } });

const planted = (extra = {}) => roomSprite({ id: 'planted_rogue_ap', type: 'drop_box', name: 'Rogue AP',
    wifiTwin: true, takeable: false, observations: 'The box sits in the planter.',
    apScan: [{ ssid: 'Ledgerwell-Staff', inScope: true }], ...extra });

test('a planted rogue AP opens the rogue-ap console through the registry and nothing else', () => {
    reset();
    handleObjectInteraction(planted());
    assert.deepEqual(calls, [['startRegistered', 'rogue-ap', 'planted_rogue_ap']]);
    assert.deepEqual(started, [], 'no examine view, no container');
});

test('a stray triggerOnInteract on the planted box never runs: the console writes its own globals', () => {
    reset();
    handleObjectInteraction(planted({ triggerOnInteract: [{ type: 'set_global', name: 'ap_twin_staff', value: true }] }));
    assert.deepEqual(calls, [['startRegistered', 'rogue-ap', 'planted_rogue_ap']]);
});

test('a takeable planted box is never picked up', () => {
    reset();
    handleObjectInteraction(planted({ takeable: true }));
    assert.ok(!calls.some(c => c[0] === 'addToInventory'), 'no pickup');
    assert.deepEqual(calls, [['startRegistered', 'rogue-ap', 'planted_rogue_ap']]);
});

test('wifiTwin false, or the string "true", stays on the generic flow', () => {
    reset();
    handleObjectInteraction(roomSprite({ id: 'plain_box', type: 'drop_box', name: 'Box', wifiTwin: 'true', takeable: false, observations: 'A box.' }));
    assert.ok(!calls.some(c => c[0] === 'startRegistered'), 'only the boolean true opens the console');
});

test('a Wi-Fi access point keeps its join flow, ahead of the wifiTwin branch', () => {
    reset();
    handleObjectInteraction(roomSprite({ id: 'lw_staff_ap', type: 'wifi_ap', name: 'Staff AP', wifiAp: true, wifiTwin: true }));
    assert.deepEqual(calls, [['interactWifiAp', 'lw_staff_ap']]);
});

test('a sign-in PC still goes to the sign-in branch first', () => {
    reset();
    handleObjectInteraction(roomSprite({ id: 'hot_desk_pc', type: 'pc', name: 'Hot desk', lockType: 'login', locked: true, wifiTwin: true }));
    assert.deepEqual(calls, [['handleUnlock', 'hot_desk_pc']]);
});

// The real registry: the rogue-ap entry calls window.startRogueApMinigame with the sprite as is.
writeFileSync(join(dir, 'exercise-station-starter.mjs'), 'export function startExerciseStation() {}');
writeFileSync(join(dir, 'minigame-registry.mjs'), readFileSync(join(js, 'systems/minigame-registry.js'), 'utf8')
    .replace("'./exercise-station-starter.js'", "'./exercise-station-starter.mjs'"));
const registry = await import(pathToFileURL(join(dir, 'minigame-registry.mjs')).href);

test('the registry lists rogue-ap and hands the starter the sprite and options unchanged', () => {
    assert.ok(registry.hasMinigameStarter('rogue-ap'));
    const got = [];
    window.startRogueApMinigame = (obj, options) => got.push([obj, options]);
    const sprite = planted();
    const options = { onComplete: () => {} };
    assert.equal(registry.startRegisteredMinigame('rogue-ap', sprite, options), true);
    assert.equal(got.length, 1);
    assert.equal(got[0][0], sprite, 'the sprite itself, so the starter reads scenarioData.apScan');
    assert.equal(got[0][1], options);
    delete window.startRogueApMinigame;
});

test('without the console module loaded the registry alerts and opens nothing', () => {
    reset();
    delete window.startRogueApMinigame;
    assert.equal(registry.startRegisteredMinigame('rogue-ap', planted()), true);
    assert.deepEqual(calls.filter(c => c[0] === 'gameAlert'), [['gameAlert', 'Rogue AP console unavailable.']]);
});

// Schema: the four keys sit in definitions.item with the E0.6 shapes.
const schema = JSON.parse(readFileSync(join(here, '../../scripts/scenario-schema.json'), 'utf8'));
const item = schema.definitions.item.properties;

test('wifiTwin is a boolean object key', () => {
    assert.equal(item.wifiTwin.type, 'boolean');
});

test('apScan rows carry the authored scan fields and nothing else', () => {
    const row = item.apScan.items;
    assert.equal(item.apScan.type, 'array');
    assert.deepEqual(row.required, ['ssid']);
    assert.equal(row.additionalProperties, false);
    for (const k of ['ssid', 'security', 'signal', 'clients', 'inScope', 'refusal', 'cloneGlobals', 'cloneLog', 'knownClients']) {
        assert.ok(row.properties[k], `apScan row declares ${k}`);
    }
    assert.equal(row.properties.inScope.type, 'boolean');
    assert.deepEqual(row.properties.cloneLog.oneOf.map(o => o.type), ['string', 'object'], 'cloneLog: a string or a map keyed by template id');
    assert.deepEqual(row.properties.knownClients.items.required, ['npcId']);
});

test('apPortal templates carry id, label, setGlobals and a renderer page', () => {
    const t = item.apPortal.properties.templates.items;
    assert.deepEqual(item.apPortal.required, ['templates']);
    assert.deepEqual(t.required, ['id', 'label', 'page']);
    assert.ok(t.properties.setGlobals);
    const page = t.properties.page.properties;
    assert.equal(page.brands.items.$ref, '#/definitions/socialLandingBrand');
    assert.equal(page.domainOptions.items.$ref, '#/definitions/socialLandingMenuOption');
    for (const k of ['wordings', 'fields', 'fieldLabels', 'choices']) assert.ok(page[k], `page declares ${k}`);
    for (const k of ['brand', 'domainId', 'wording', 'fields', 'logo', 'padlock']) assert.ok(page.choices.properties[k], `choices declares ${k}`);
});

test('apCaptureLog lines name a global and text, with an optional npcId', () => {
    const line = item.apCaptureLog.items;
    assert.deepEqual(line.required, ['global', 'text']);
    assert.deepEqual(Object.keys(line.properties).sort(), ['global', 'npcId', 'text']);
    assert.equal(line.additionalProperties, false);
});
