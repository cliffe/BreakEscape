// UX slice 4 (q91): a click on a wearable in the world only takes it (no menu), and a new
// slot asks once whether to put it on now (wearables.offerAfterTake). The real interactions.js
// runs with its static imports stubbed; addToInventory answers as the real one does.
// Run with: bin/test-js test/js/wearable-take-offer.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = process.env.SWEEP_JS_ROOT || join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript,' + encodeURIComponent(src).replace(/'/g, '%27');

globalThis.window = { gameState: { globalVariables: {} } };
globalThis.document = { getElementById: () => null, querySelector: () => null, createElement: () => ({ style: {} }) };

const stubs = {
    '../utils/constants.js': 'export const INTERACTION_RANGE=1e6, INTERACTION_RANGE_SQ=1e12, INTERACTION_CHECK_INTERVAL=0, DOOR_INTERACTION_RANGE_SQ=0; export function overlayDepth(){return 0;}',
    '../core/rooms.js': 'export const rooms={};',
    '../core/player.js': 'export function facePlayerToward(){}',
    './unlock-system.js': 'export function handleUnlock(){}',
    './doors.js': 'export function handleDoorInteraction(){}',
    './biometrics.js': 'export function collectFingerprint(){} export function handleBiometricScan(){}',
    './inventory.js': 'export function addToInventory(s){ window.__added.push(s.scenarioData.id); return Promise.resolve(window.__addResult); } export function createItemIdentifier(){return "";}',
    './ui-sounds.js': 'export function playUISound(){} export function playGameSound(){}',
    './apply-actions.js': 'export function applyActions(){}',
    '../utils/conditional-text.js': 'export function resolveObjectField(obj,key){ return obj ? obj[key] : undefined; }',
    '../utils/flag-lock.js': 'export function isRemoteFlagLock(){return false;} export function remoteFlagLockMessage(){return "";}',
    './npc-reach.js': 'export function npcReachDistSq(){return 0;}',
    './examine.js': 'export function shouldExamine(){return false;} export function startExamine(){return false;}',
    './combat-input.js': 'export function showPastTalkingToast(){}',
    './consumables.js': 'export function shouldConsumeOnInteract(){return false;} export function useConsumable(){}',
    './interaction-walls.js': 'export function interactionLineClear(){return true;}',
    '../utils/locked-hint.js': 'export function hintToastMs(){ return 6000; }',
    './requires-item-hint.js': 'export function requiresItemHint(){ return ""; }',
    './pc-policy.js': readFileSync(join(js, 'systems/pc-policy.js'), 'utf8'),
    './interaction-reach.js': 'export function reachX(){return 0;} export function aimX(){return 0;} export function npcWalkingAway(){return false;} export function npcGivesWay(){return false;} export function objectIdOf(o){return o?.scenarioData?.id ?? o?.objectId ?? null;}',
    './minigame-registry.js': 'export function hasMinigameStarter(){return false;} export function startRegisteredMinigame(){}',
    './inventory-menu.js': 'export function hasTriggerOnInteract(d){return Array.isArray(d?.triggerOnInteract);} export function isDroppableInventoryItem(){return false;} export function dropInventoryItem(){} export function inventoryMenuFor(){return null;}',
    '../utils/display-dashes.js': readFileSync(join(js, 'utils/display-dashes.js'), 'utf8'),
    '../utils/escape-html.js': readFileSync(join(js, 'utils/escape-html.js'), 'utf8'),
};
let src = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
for (const [spec, body] of Object.entries(stubs)) {
    const before = src;
    src = src.split(`'${spec}'`).join(`'${dataUrl(body)}'`);
    if (src === before) throw new Error(`import specifier not found to stub: ${spec}`);
}
const dir = mkdtempSync(join(tmpdir(), 'wear-take-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
writeFileSync(join(dir, 'interactions.mjs'), src);
const { handleObjectInteraction } = await import(pathToFileURL(join(dir, 'interactions.mjs')).href);

const tick = () => new Promise((r) => setTimeout(r, 0));
const WEAR = { costume: 'courier', global: 'vest_on' };

function rig(result = { ok: true, reason: 'added' }) {
    const offers = [];
    const menus = [];
    Object.assign(window, {
        gameState: { globalVariables: {} },
        MinigameFramework: { currentMinigame: null },
        inventory: { items: [] },
        __added: [],
        __addResult: result,
        gameAlert: () => {},
        showInteractionMenu: (...a) => menus.push(a),
        maybeShowObjectActionMenu: undefined,
        player: { x: 0, y: 0 },
        wearables: {
            wearableSpec: (d) => (d?.wearable ? d.wearable : null),
            offerAfterTake: (id) => { offers.push(id); return Promise.resolve(true); },
            toggle: () => { throw new Error('a world click must not put it on'); }
        }
    });
    return { offers, menus };
}

// A world object: not in the inventory, so the click is a take
const worldSprite = (extra = {}) => ({
    objectId: 'vest', name: 'vest', x: 0, y: 0,
    scenarioData: { id: 'vest', type: 'hivis', name: 'Hi-vis vest', takeable: true, interactable: true, ...extra }
});

test('a world wearable is taken, then offered once the slot is added', async () => {
    const { offers, menus } = rig();
    handleObjectInteraction(worldSprite({ wearable: WEAR, droppable: true }));
    await tick();
    assert.deepEqual(window.__added, ['vest'], 'the click took it');
    assert.deepEqual(offers, ['vest'], 'and asked whether to put it on');
    assert.equal(menus.length, 0, 'no menu in the world');
});

test('no offer for an item that was already held, refused, or is not a wearable', async () => {
    let r = rig({ ok: true, reason: 'already' });
    handleObjectInteraction(worldSprite({ wearable: WEAR }));
    await tick();
    assert.deepEqual(r.offers, []);
    r = rig({ ok: false, reason: 'rejected' });
    handleObjectInteraction(worldSprite({ wearable: WEAR }));
    await tick();
    assert.deepEqual(r.offers, []);
    r = rig();
    handleObjectInteraction(worldSprite());
    await tick();
    assert.deepEqual(window.__added, ['vest']);
    assert.deepEqual(r.offers, []);
});

test('a held wearable is not offered: its click is the tray toggle', async () => {
    const { offers } = rig();
    let toggled = 0;
    window.wearables.toggle = () => { toggled += 1; };
    const held = { objectId: 'inventory_vest', name: 'vest', scenarioData: { id: 'vest', name: 'Hi-vis vest', takeable: false, wearable: WEAR } };
    window.inventory.items.push(held);
    handleObjectInteraction(held);
    await tick();
    assert.equal(toggled, 1);
    assert.deepEqual(offers, []);
    assert.deepEqual(window.__added, []);
});
