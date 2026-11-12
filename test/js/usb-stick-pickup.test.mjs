// A habit NPC's USB stick in the world (USB habit code review R2, B1): the server marks every
// habit stick hasContents and locked false, and serves its files only to a player who holds it.
// A stick a knock-out drops on the floor must therefore be picked up by a click, never opened as
// a container (that sent /unlock, got a 422 and showed "Access denied"). Once in the inventory a
// click opens it through the container branch (handleUnlock, then /unlock and /container).
//
// Drives the real handleObjectInteraction in systems/interactions.js, with its static imports
// stubbed so handleUnlock and addToInventory are recorded.
// Run with: node --test test/js/usb-stick-pickup.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'usb-pickup-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');

function dataUrl(src) { return 'data:text/javascript,' + encodeURIComponent(src); }

const stubs = {
  '../utils/constants.js': 'export const INTERACTION_RANGE=1e6, INTERACTION_RANGE_SQ=1e12, INTERACTION_CHECK_INTERVAL=0, DOOR_INTERACTION_RANGE_SQ=0; export function overlayDepth(){return 0;}',
  '../core/rooms.js': 'export const rooms={};',
  '../core/player.js': 'export function facePlayerToward(){}',
  './unlock-system.js': 'export function handleUnlock(sprite, type){ (globalThis.__calls ||= []).push(["unlock", sprite.scenarioData.id, type]); }',
  './doors.js': 'export function handleDoorInteraction(){}',
  './biometrics.js': 'export function collectFingerprint(){} export function handleBiometricScan(){}',
  './inventory.js': 'export function addToInventory(sprite){ (globalThis.__calls ||= []).push(["pickup", sprite.scenarioData.id]); return true; } export function createItemIdentifier(){return "";}',
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
  './interaction-reach.js': 'export function reachX(){return 0;} export function aimX(){return 0;}',
  './minigame-registry.js': 'export function hasMinigameStarter(){return false;} export function startRegisteredMinigame(){}',
  '../utils/display-dashes.js': 'export function displayDashes(s){ return s; }',
  '../utils/escape-html.js': 'export function escapeHtml(s){ return String(s ?? ""); }',
  './inventory-menu.js': 'export function hasTriggerOnInteract(){return false;} export function isDroppableInventoryItem(){return false;} export function dropInventoryItem(){} export function inventoryMenuFor(){return null;}',
};
let src = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
for (const [spec, body] of Object.entries(stubs)) {
  const before = src;
  src = src.split(`'${spec}'`).join(`'${dataUrl(body)}'`);
  if (src === before) throw new Error(`import specifier not found to stub: ${spec}`);
}
writeFileSync(join(dir, 'interactions.mjs'), src);

globalThis.window = {};
const { handleObjectInteraction } = await import(pathToFileURL(join(dir, 'interactions.mjs')).href);

function setup(items = []) {
  globalThis.__calls = [];
  globalThis.window = {
    gameState: { globalVariables: {} },
    MinigameFramework: { currentMinigame: null },
    inventory: { items },
    player: { x: 0, y: 0 },
    gameAlert: (...a) => globalThis.__calls.push(['alert', ...a]),
  };
}

// The stick as room data ships it after a knock-out drop: the filter strips its files,
// marks hasContents and locked false, and add_item_to_room! made it takeable.
const droppedStick = () => ({
  objectId: 'kim_usb', name: 'usb', x: 0, y: 0,
  scenarioData: { type: 'usb', id: 'kim_usb', name: "Kim's USB stick", usbClass: 'storage',
                  takeable: true, hasContents: true, locked: false }
});

test('a click on a dropped habit stick picks it up and never asks /unlock', () => {
  setup();
  handleObjectInteraction(droppedStick());
  assert.deepEqual(globalThis.__calls.filter(c => c[0] !== 'alert'), [['pickup', 'kim_usb']]);
  assert.ok(!globalThis.__calls.some(c => c[0] === 'unlock'), 'no container unlock for a stick on the floor');
});

test('once in the inventory a click opens the stick through the container branch', () => {
  const held = droppedStick();
  held.scenarioData.takeable = false;   // the inventory copy, as addToInventory leaves it
  held.objectId = 'inventory_usb_kim_usb';
  setup([held]);
  handleObjectInteraction(held);
  assert.deepEqual(globalThis.__calls, [['unlock', 'kim_usb', 'item']]);
});

test('an inventory copy that kept takeable: true still opens, not re-picks', () => {
  const held = droppedStick();
  setup([held]);
  handleObjectInteraction(held);
  assert.deepEqual(globalThis.__calls, [['unlock', 'kim_usb', 'item']]);
});

test('a locked takeable container in the world still goes to the unlock flow first', () => {
  setup();
  const s = droppedStick();
  s.scenarioData.locked = true;
  handleObjectInteraction(s);
  assert.deepEqual(globalThis.__calls, [['unlock', 'kim_usb', 'item']]);
});

test('a takeable stick whose files ship in room data still opens in place, as before', () => {
  setup();
  const s = droppedStick();
  delete s.scenarioData.hasContents;
  s.scenarioData.contents = [{ type: 'text_file', id: 'f', name: 'f.txt', text: 'x' }];
  handleObjectInteraction(s);
  assert.deepEqual(globalThis.__calls, [['unlock', 'kim_usb', 'item']]);
});
