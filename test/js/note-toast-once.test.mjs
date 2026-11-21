// sis01 gate m11: re-reading a readable object toasted "Added to your notes" every time.
// window.addNote returns the EXISTING note (marked read) on a duplicate, which is truthy, so
// `if (addedNote) announceNoteAdded(...)` fired on every re-read (the ICO tablet in sis01).
// The real window.addNote runs against the real interactions.js (its imports stubbed).
// Run with: node --max-old-space-size=2048 test/js/note-toast-once.test.mjs
// NOTE_JS_ROOT points at a copy of the engine (used to show the test fails on old code).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};
const here = dirname(fileURLToPath(import.meta.url));
const js = process.env.NOTE_JS_ROOT || join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'nt-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');

// The real addNote (notes-minigame.js defines window.addNote on import)
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true, url: 'https://game.example/break_escape/games/1' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
await import(pathToFileURL(join(js, 'minigames/notes/notes-minigame.js')).href);
const realAddNote = dom.window.addNote;
assert.ok(typeof realAddNote === 'function', 'notes-minigame defines window.addNote');

function dataUrl(src) { return 'data:text/javascript,' + encodeURIComponent(src); }

// ---------------------------------------------------------------------------
// interactions.js with ALL its static imports stubbed (data: URLs, so nothing is
// resolved relative to the temp file). applyActions records every call so the test
// can see onProceed/onDecline and the re-entrant normal interaction (triggerOnInteract).
// ---------------------------------------------------------------------------
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
  // resolveObjectField is stubbed as obj[key] ?? null (the real resolver returns null for a missing key): observationVariants/textVariants are NOT exercised
  // here (gameDisplayParts takes already-resolved values; the variant path was proved live).
  '../utils/conditional-text.js': 'export function resolveObjectField(obj,key){ return obj ? (obj[key] ?? null) : null; }',
  '../utils/flag-lock.js': 'export function isRemoteFlagLock(){return false;} export function remoteFlagLockMessage(){return "";}',
  './npc-reach.js': 'export function npcReachDistSq(){return 0;}',
  './examine.js': 'export function shouldExamine(){return false;} export function startExamine(){return false;}',
  './combat-input.js': 'export function showPastTalkingToast(){}',
  './consumables.js': 'export function shouldConsumeOnInteract(){return false;} export function useConsumable(){}',
  './interaction-walls.js': 'export function interactionLineClear(){return true;}',
  '../utils/locked-hint.js': 'export function hintToastMs(){ return 6000; }',
  './requires-item-hint.js': 'export function requiresItemHint(data){ return (data && data.requiresItemHint) || ""; }',
  './pc-policy.js': readFileSync(join(js, 'systems/pc-policy.js'), 'utf8'),
  './interaction-reach.js': 'export * from "' + new URL('../../public/break_escape/js/systems/interaction-reach.js', import.meta.url).href + '"; export function reachX(){return 0;} export function reachY(){return 0;} export function reachYSeated(){return 0;} export function aimX(){return 0;} export function aimY(){return 0;} export function aimDiff(p,t,x,y){return {diff:0,x:x,y:y,fromX:p.x,fromY:p.y};} export function npcWalkingAway(){return false;} export function npcGivesWay(){return false;} export function seatOccupant(){return null;} export function objectIdOf(o){return o?.scenarioData?.id ?? o?.objectId ?? null;}',
  './minigame-registry.js': 'export function hasMinigameStarter(){return false;} export function startRegisteredMinigame(){}',
  '../utils/display-dashes.js': 'export * from "' + pathToFileURL(join(js, 'utils/display-dashes.js')).href + '";',
  '../utils/escape-html.js': 'export * from "' + pathToFileURL(join(js, 'utils/escape-html.js')).href + '";',
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

let toasts, gs;
function read(data) {
  toasts = [];
  globalThis.window = {
    player: { x: 0, y: 0 },
    gameState: gs,
    gameDisplay: () => {},
    gameAlert: () => {},
    announceNoteAdded: (n) => toasts.push(n),
    addNote: realAddNote,
  };
  handleObjectInteraction({ name: data.id, objectId: data.id, scenarioData: { id: data.id, ...data } });
}
const tablet = { id: 'ico_tablet', type: 'tablet', name: 'ICO Notification Deadline', readable: true, takeable: false,
  text: 'ICO must be told within 72 hours.' };
const board = { id: 'board', type: 'generic', name: 'Board', readable: true, readDisplay: 'gameDisplay', text: 'Rota' };

for (const [label, obj] of [['readable object (fallback route)', tablet], ['readDisplay gameDisplay route', board]]) {
  test(`${label}: the first read toasts once, a re-read does not`, () => {
    gs = { globalVariables: {}, notes: [] };
    read(obj);
    assert.ok(toasts.length === 1, 'first read toasts once, got ' + toasts.length);
    assert.ok(gs.notes.length === 1, 'one note stored');
    read(obj);
    read(obj);
    assert.ok(toasts.length === 0, 're-reads raise no toast, got ' + toasts.length);
    assert.ok(gs.notes.length === 1, 'still one note');
  });
}

test('a different object still toasts; the real addNote marks a duplicate read', () => {
  gs = { globalVariables: {}, notes: [] };
  read(tablet);
  read(board);
  assert.ok(toasts.length === 1, 'the second, new note toasts');
  assert.ok(gs.notes.length === 2, 'two notes');
});

test('receiveRewardNote (inventory.js) toasts only a new note', () => {
  const inv = readFileSync(join(js, 'systems/inventory.js'), 'utf8');
  const at = inv.indexOf('function receiveRewardNote');
  const block = inv.slice(at, inv.indexOf('const readAction', at));
  assert.ok(/added && added\.read !== true/.test(block), 'toast guarded by the new-note check');
});
