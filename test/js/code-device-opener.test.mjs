// Ops S8a unit 19b: the inventory opener for a held code device. A click on a held code_device
// calls window.startCodeDevice({ itemId }); a loose one is not opened; any other item, including
// a held Friendface phone, behaves as before (the phone keeps its registry route and never opens
// the live authenticator from here: see the unit 19b report).
// Run with: node --test test/js/code-device-opener.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'code-opener-'));
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
  './interaction-reach.js': 'export * from "' + new URL('../../public/break_escape/js/systems/interaction-reach.js', import.meta.url).href + '"; export function reachX(){return 0;} export function reachY(){return 0;} export function reachYSeated(){return 0;} export function aimX(){return 0;} export function aimY(){return 0;} export function aimDiff(p,t,x,y){return {diff:0,x:x,y:y,fromX:p.x,fromY:p.y};} export function npcGivesWay(){return false;} export function seatOccupant(){return null;} export function objectIdOf(o){return o && (o.objectId || o.scenarioData?.id) || null;}',
  './minigame-registry.js': 'export function hasMinigameStarter(t){return t==="phone_friendface";} export function startRegisteredMinigame(t){ (globalThis.__calls ||= []).push(["registry", t]); }',
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
    startCodeDevice: (p) => globalThis.__calls.push(['code-device', p]),
    startAuthenticatorLive: (p) => globalThis.__calls.push(['live', p]),
  };
}
const item = (type, id, extra = {}) => ({ objectId: 'inventory_' + type + '_' + id, x: 0, y: 0,
  scenarioData: { type, id, name: id, takeable: false, ...extra } });

test('a click on a held code device opens the device scene with its item id', () => {
  const dev = item('code_device', 'moira_code_device', { owner: 'moira' });
  setup([dev]);
  handleObjectInteraction(dev);
  assert.deepEqual(globalThis.__calls, [['code-device', { itemId: 'moira_code_device' }]]);
});

test('a loose code device is not opened by the click', () => {
  const dev = item('code_device', 'loose_dev', { takeable: true });
  setup();
  handleObjectInteraction(dev);
  assert.ok(!globalThis.__calls.some(c => c[0] === 'code-device'));
});

test('without the starter a held device shows an alert and nothing else', () => {
  const dev = item('code_device', 'd1');
  setup([dev]);
  delete window.startCodeDevice;
  handleObjectInteraction(dev);
  assert.equal(globalThis.__calls.length, 1);
  assert.equal(globalThis.__calls[0][0], 'alert');
});

test('an unrelated held item still takes its own route and opens no device scene', () => {
  const stick = item('usb', 'kim_usb', { usbClass: 'storage', hasContents: true, locked: false });
  setup([stick]);
  handleObjectInteraction(stick);
  assert.deepEqual(globalThis.__calls, [['unlock', 'kim_usb', 'item']]);
});

test('a held Friendface phone keeps its registry route and opens neither new scene', () => {
  const ph = item('phone_friendface', 'moira_phone', { owner: 'moira' });
  setup([ph]);
  handleObjectInteraction(ph);
  assert.deepEqual(globalThis.__calls, [['registry', 'phone_friendface']]);
});

test('R1-C11: a code device lying in a room with takeable false is not opened (it is not held)', () => {
  const dev = item('code_device', 'floor_dev');
  setup();
  handleObjectInteraction(dev);
  assert.ok(!globalThis.__calls.some(c => c[0] === 'code-device'));
});
