// The engine hooks that reach systems/wearables.js (review R1, finding 7). Each test fails when
// its hook line is removed:
// - inventory.js removeFromInventory calls wearables.onItemLeft with the item that left;
// - inventory.js refreshInventoryTray calls wearables.decorateSlot for every slot;
// - interactions.js routes the click on a held wearable to wearables.toggle, before its
//   triggerOnInteract;
// - inventory-menu.js openInventoryItemMenu refuses "Drop here" for a worn item while someone
//   watches, as plain text, and drops it when nobody does.
// (The forced take-off after a 422 is in wearables.test.mjs.)
// Run with: node test/js/wearable-hooks.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'wearable-hooks-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const stub = (out, code) => { writeFileSync(join(dir, out), code); return pathToFileURL(join(dir, out)).href; };
const copy = (src, out, rewrites = []) => {
    let code = readFileSync(join(js, src), 'utf8');
    for (const [a, b] of rewrites) {
        assert.ok(code.includes(a), `${src} has ${a}`);
        code = code.split(a).join(b);
    }
    return stub(out, code);
};
const dataUrl = (src) => 'data:text/javascript,' + encodeURIComponent(src);

const dom = new JSDOM('<!doctype html><html><head></head><body><div id="inventory-container"></div></body></html>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;

// ── inventory.js ─────────────────────────────────────────────────────────────
stub('rooms-stub.mjs', 'export const rooms = {};');
stub('ink-stub.mjs', 'export default class InkEngine {}');
stub('config-stub.mjs', "export const CSRF_TOKEN = 'csrf'; export function getApiBase() { return '/g/1'; } export function getCsrfToken() { return 'csrf'; }");
stub('info-label-stub.mjs', 'export function setHudLabel() {} export function clearHudLabel() {}');
copy('systems/forced-minigame-guard.js', 'forced-minigame-guard.mjs');
copy('systems/consumables.js', 'consumables.mjs');
const inventory = await import(copy('systems/inventory.js', 'inventory.mjs', [
    ["'../core/rooms.js'", "'./rooms-stub.mjs'"],
    ["'./ink/ink-engine.js'", "'./ink-stub.mjs'"],
    ["'../config.js'", "'./config-stub.mjs'"],
    ["'../ui/info-label.js'", "'./info-label-stub.mjs'"],
    ["'./forced-minigame-guard.js'", "'./forced-minigame-guard.mjs'"],
    ["'./consumables.js'", "'./consumables.mjs'"]
]));

// A tray item in its slot, as addToInventory builds it
function trayItem(data) {
    const slot = document.createElement('div');
    slot.className = 'inventory-slot';
    const img = document.createElement('img');
    img.scenarioData = data;
    slot.appendChild(img);
    document.getElementById('inventory-container').appendChild(slot);
    return img;
}

const VEST = { id: 'vest', type: 'hivis', name: 'Hi-vis vest', droppable: true,
    wearable: { costume: 'courier', global: 'vest_on', unseenOnly: true } };

test('removeFromInventory hands the item that left to wearables.onItemLeft', () => {
    const left = [];
    const vest = trayItem(VEST);
    window.inventory = { items: [vest] };
    window.wearables = { onItemLeft: (item) => left.push(item), decorateSlot() {} };
    assert.equal(inventory.removeFromInventory(vest), true);
    assert.deepEqual(left, [vest]);
    assert.equal(window.inventory.items.length, 0);
});

test('refreshInventoryTray calls wearables.decorateSlot for every slot', () => {
    const decorated = [];
    const vest = trayItem(VEST);
    const memo = trayItem({ id: 'memo', type: 'notes', name: 'Memo' });
    window.inventory = { items: [vest, memo] };
    window.wearables = { decorateSlot: (item) => decorated.push(item.scenarioData.id), onItemLeft() {} };
    inventory.refreshInventoryTray();
    assert.deepEqual(decorated, ['vest', 'memo']);
});

// ── interactions.js ──────────────────────────────────────────────────────────
const stubs = {
    '../utils/constants.js': 'export const INTERACTION_RANGE=0, INTERACTION_RANGE_SQ=0, INTERACTION_CHECK_INTERVAL=0, DOOR_INTERACTION_RANGE_SQ=0; export function overlayDepth(){return 0;}',
    '../core/rooms.js': 'export const rooms={};',
    '../core/player.js': 'export function facePlayerToward(){}',
    './unlock-system.js': 'export function handleUnlock(){}',
    './doors.js': 'export function handleDoorInteraction(){}',
    './biometrics.js': 'export function collectFingerprint(){} export function handleBiometricScan(){}',
    './inventory.js': 'export function addToInventory(){return true;} export function createItemIdentifier(){return "";}',
    './ui-sounds.js': 'export function playUISound(){} export function playGameSound(){}',
    './apply-actions.js': 'export function applyActions(actions, opts){ (globalThis.__applied ||= []).push({ actions, opts }); }',
    '../utils/conditional-text.js': 'export function resolveObjectField(obj,key){ return obj ? obj[key] : undefined; }',
    '../utils/flag-lock.js': 'export function isRemoteFlagLock(){return false;} export function remoteFlagLockMessage(){return "";}',
    './npc-reach.js': 'export function npcReachDistSq(){return 0;}',
    './examine.js': 'export function shouldExamine(){return false;} export function startExamine(){return false;}',
    './combat-input.js': 'export function showPastTalkingToast(){}',
    './consumables.js': 'export function shouldConsumeOnInteract(){return false;} export function useConsumable(){}',
    './interaction-walls.js': 'export function interactionLineClear(){return true;}',
    '../utils/locked-hint.js': 'export function hintToastMs(){ return 6000; }',
    './requires-item-hint.js': 'export function requiresItemHint(data){ return (data && data.requiresItemHint) || ""; }',
    './pc-policy.js': readFileSync(join(js, 'systems/pc-policy.js'), 'utf8'),
    './interaction-reach.js': 'export function reachX(){return 0;} export function aimX(){return 0;}',
    './minigame-registry.js': 'export function hasMinigameStarter(){return false;} export function startRegisteredMinigame(){}',
    './inventory-menu.js': 'export function hasTriggerOnInteract(d){return Array.isArray(d && d.triggerOnInteract);} export function isDroppableInventoryItem(){return false;} export function dropInventoryItem(){} export function inventoryMenuFor(){return null;}',
    '../utils/display-dashes.js': 'export function displayDashes(s){ return s; }',
    '../utils/escape-html.js': 'export function escapeHtml(s){ return String(s == null ? "" : s); }',
};
let interactionsSrc = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
for (const [spec, body] of Object.entries(stubs)) {
    const before = interactionsSrc;
    interactionsSrc = interactionsSrc.split(`'${spec}'`).join(`'${dataUrl(body)}'`);
    assert.notEqual(interactionsSrc, before, `interactions.js imports ${spec}`);
}
writeFileSync(join(dir, 'interactions.mjs'), interactionsSrc);
const saved = globalThis.window;
globalThis.window = {};
const { handleObjectInteraction } = await import(pathToFileURL(join(dir, 'interactions.mjs')).href);
globalThis.window = saved;

test('the click on a held wearable goes to wearables.toggle, not its triggerOnInteract', () => {
    globalThis.__applied = [];
    const toggled = [];
    const vest = { objectId: 'vest', scenarioData: { ...VEST, triggerOnInteract: [{ type: 'set_global', key: 'x' }] } };
    const w = globalThis.window;
    globalThis.window = {
        gameState: { globalVariables: {} },
        inventory: { items: [vest] },
        wearables: { wearableSpec: (d) => (d.wearable ? d.wearable : null), toggle: (s) => toggled.push(s) }
    };
    try {
        handleObjectInteraction(vest);
        assert.deepEqual(toggled, [vest]);
        assert.equal(globalThis.__applied.length, 0, 'no triggerOnInteract');
        // The same item in the world (not held) is not routed to the toggle
        globalThis.window.inventory.items = [];
        handleObjectInteraction(vest);
        assert.equal(toggled.length, 1);
    } finally {
        globalThis.window = w;
    }
});

// ── inventory-menu.js ────────────────────────────────────────────────────────
const W = await import(pathToFileURL(join(js, 'systems/wearables.js')).href);
const { openInventoryItemMenu } = await import(pathToFileURL(join(js, 'systems/inventory-menu.js')).href);

test('"Drop here" on the worn item is refused in plain text while someone watches, allowed alone', () => {
    const el = { scenarioData: VEST };
    const npcs = new Map([['tom', { id: 'tom', displayName: '<b>Tom</b>', npcType: 'person', roomId: 'office' }]]);
    const alerts = [];
    const dropped = [];
    let menu;
    const w = {
        currentPlayerRoom: 'office',
        gameState: { wornItem: { itemId: 'vest' }, globalVariables: {} },
        inventory: { items: [el] },
        npcManager: { npcs },
        gameAlert: (...a) => alerts.push(a)
    };
    w.wearables = {
        menuLabel: (d) => W.menuLabel(d, w),
        isWorn: (item, ww) => W.isWorn(item, ww),
        changeRefusal: (d, change, ww) => W.changeRefusal(d, change, ww)
    };
    const deps = {
        window: w,
        ctx: { inventoryItems: [el], dropBlocked: null, window: w },
        dropBlockedReason: () => null,
        dropInventoryItem: (item) => dropped.push(item),
        showInteractionMenu: (entries) => { menu = entries; }
    };
    assert.equal(openInventoryItemMenu(el, 1, 1, deps), true);
    const pick = (label) => menu.find(e => e.label === label).onSelect();
    assert.deepEqual(menu.map(e => e.label), ['Take off', 'Drop here', 'Examine']);
    pick('Drop here');
    assert.equal(dropped.length, 0, 'not dropped in front of Tom');
    assert.equal(alerts.length, 1);
    assert.match(alerts[0][0], /<b>Tom<\/b> is watching\. Drop it somewhere out of sight/);
    assert.deepEqual(alerts[0][4], { plainText: true });
    npcs.clear();
    pick('Drop here');
    assert.deepEqual(dropped, [el]);
});
