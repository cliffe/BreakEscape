// A locked droppable the player put down is picked up by a click on the floor, not opened where it
// lies (S8c R1 playtest 13c; the brief's beat: "click it on the floor to pick it up"). Every other
// container or locked item keeps its click. REAL interactions.js over stand-ins for its imports.
// Run with: bin/test-js test/js/interactions-dropped-locked-pickup.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'dropped-locked-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
function dataUrl(src) { return 'data:text/javascript,' + encodeURIComponent(src).replace(/'/g, '%27'); }

const condText = readFileSync(join(js, 'utils/conditional-text.js'), 'utf8');
const reqHint = readFileSync(join(js, 'systems/requires-item-hint.js'), 'utf8')
  .split("'../utils/conditional-text.js'").join(`'${dataUrl(condText)}'`);
const stubs = {
  '../utils/constants.js': 'export const INTERACTION_RANGE=0, INTERACTION_RANGE_SQ=0, INTERACTION_CHECK_INTERVAL=0, DOOR_INTERACTION_RANGE_SQ=0; export function overlayDepth(){return 0;}',
  '../core/rooms.js': 'export const rooms={};',
  '../core/player.js': 'export function facePlayerToward(){}',
  './unlock-system.js': 'export function handleUnlock(s, t){ (globalThis.__unlocked ||= []).push([s, t]); }',
  './doors.js': 'export function handleDoorInteraction(){}',
  './biometrics.js': 'export function collectFingerprint(){} export function handleBiometricScan(){}',
  './inventory.js': 'export function addToInventory(s){ (globalThis.__taken ||= []).push(s); return Promise.resolve({ ok: true, reason: "added" }); } export function createItemIdentifier(){return "";}',
  './ui-sounds.js': 'export function playUISound(){} export function playGameSound(){}',
  './apply-actions.js': 'export function applyActions(actions, opts){ (globalThis.__applied ||= []).push({ actions, opts }); }',
  '../utils/conditional-text.js': condText,
  '../utils/flag-lock.js': 'export function isRemoteFlagLock(){return false;} export function remoteFlagLockMessage(){return "";}',
  './npc-reach.js': 'export function npcReachDistSq(){return 0;}',
  './examine.js': 'export function shouldExamine(){return false;} export function startExamine(){return false;}',
  './combat-input.js': 'export function showPastTalkingToast(){}',
  './consumables.js': 'export function shouldConsumeOnInteract(){return false;} export function useConsumable(){}',
  './interaction-walls.js': 'export function interactionLineClear(){return true;}',
  '../utils/locked-hint.js': 'export function hintToastMs(){ return 6000; }',
  './requires-item-hint.js': reqHint,
  './pc-policy.js': readFileSync(join(js, 'systems/pc-policy.js'), 'utf8'),
  './interaction-reach.js': 'export * from "' + new URL('../../public/break_escape/js/systems/interaction-reach.js', import.meta.url).href + '"; export function reachX(){return 0;} export function reachY(){return 0;} export function reachYSeated(){return 0;} export function aimX(){return 0;} export function aimY(){return 0;} export function aimDiff(p,t,x,y){return {diff:0,x:x,y:y,fromX:p.x,fromY:p.y};} export function npcWalkingAway(){return false;} export function npcGivesWay(){return false;} export function seatOccupant(){return null;} export function objectIdOf(o){return o?.scenarioData?.id ?? o?.objectId ?? null;}',
  './minigame-registry.js': 'export function hasMinigameStarter(){return false;} export function startRegisteredMinigame(){}',
  '../utils/display-dashes.js': 'export function displayDashes(s){ return s; }',
  '../utils/escape-html.js': 'export function escapeHtml(s){ return String(s ?? ""); }',
  './inventory-menu.js': 'export function hasTriggerOnInteract(d){return Array.isArray(d && d.triggerOnInteract);} export function isDroppableInventoryItem(){return false;} export function dropInventoryItem(){} export function inventoryMenuFor(){return null;}',
};
let interactionsSrc = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
for (const [spec, body] of Object.entries(stubs)) {
  const before = interactionsSrc;
  interactionsSrc = interactionsSrc.split(`'${spec}'`).join(`'${dataUrl(body)}'`);
  if (interactionsSrc === before) throw new Error(`import specifier not found to stub: ${spec}`);
}
writeFileSync(join(dir, 'interactions.mjs'), interactionsSrc);
globalThis.window = {};
const { handleObjectInteraction } = await import(pathToFileURL(join(dir, 'interactions.mjs')).href);


function setup() {
  globalThis.__unlocked = []; globalThis.__taken = [];
  globalThis.window = {
    gameState: { globalVariables: {} }, MinigameFramework: { currentMinigame: null }, gameScenario: {},
    player: { x: 0, y: 0 }, inventory: { items: [] }, gameAlert: () => {}, eventDispatcher: { emit: () => {} }
  };
}
const floor = (extra = {}) => ({ objectId: 'gordon_briefcase', scenarioData: { id: 'gordon_briefcase', type: 'briefcase',
  name: "Gordon's briefcase", locked: true, lockType: 'pin', hasContents: true, droppable: true, takeable: true, ...extra } });

test('a dropped locked briefcase on the floor is picked up, and no pad opens', () => {
  setup();
  const s = floor();
  handleObjectInteraction(s);
  assert.deepEqual(globalThis.__taken, [s]);
  assert.deepEqual(globalThis.__unlocked, []);
});

test('a locked briefcase that is not droppable still opens its pad where it lies', () => {
  setup();
  handleObjectInteraction(floor({ droppable: false }));
  assert.equal(globalThis.__unlocked.length, 1);
  assert.deepEqual(globalThis.__taken, []);
});

test('an unlocked droppable container on the floor keeps the container branch', () => {
  setup();
  handleObjectInteraction(floor({ locked: false, contents: [] }));
  assert.equal(globalThis.__unlocked.length, 1);
});

test('a locked droppable held in the tray opens through handleUnlock, as before (the tray menu reaches it)', () => {
  setup();
  const s = floor({ takeable: false });
  window.inventory.items.push(s);
  handleObjectInteraction(s);
  assert.equal(globalThis.__unlocked.length, 1);
  assert.deepEqual(globalThis.__taken, []);
});
