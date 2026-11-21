// requiresItemCondition, behaviourally (interactions.js handleObjectInteraction with the REAL
// requires-item-hint.js and conditional-text.js): a use refused by the condition leaves the item
// in the inventory, runs no action, sends no inventory-remove (so no plant record reaches the
// server) and shows the condition hint; once the condition holds the same click is accepted,
// runs the actions and consumes the item with usedOn. The lab keylogger on Chris's PC is the model.
// Run with: node --test test/js/requires-item-condition-interact.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'ric-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
function dataUrl(src) { return 'data:text/javascript,' + encodeURIComponent(src).replace(/'/g, '%27'); }

const condText = readFileSync(join(js, 'utils/conditional-text.js'), 'utf8');
const reqHint = readFileSync(join(js, 'systems/requires-item-hint.js'), 'utf8')
  .split("'../utils/conditional-text.js'").join(`'${dataUrl(condText)}'`);
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

// Chris's PC as the lab authors it: kit_deviceA, consumed on use, only while she is away.
const pc = () => ({ objectId: 'staff_pc', scenarioData: { id: 'staff_pc', type: 'pc', name: "Chris's PC",
  requiresItem: 'kit_deviceA', consumesItem: true,
  requiresItemHint: 'You need the keylogger in hand.',
  requiresItemCondition: 'globalVars.staff_pc_owner_away',
  requiresItemConditionHint: 'Chris is at her desk. Wait until she has gone.',
  requiresItemConditionHintVariants: [{ condition: 'globalVars.warned', value: 'Still there.' }],
  triggerOnInteract: [{ type: 'set_global', key: 'kp_deviceA_set', value: true }] } });

function setup(globals, { holding = true } = {}) {
  globalThis.__applied = [];
  const kit = { scenarioData: { id: 'kit_deviceA', type: 'entropy_drive_case1', name: 'Hardware keylogger' } };
  const w = { alerts: [], emits: [], removes: [], local: [], items: holding ? [kit] : [] };
  globalThis.window = {
    gameState: { globalVariables: { ...globals } },
    MinigameFramework: { currentMinigame: null },
    gameScenario: {},
    inventory: { items: w.items },
    gameAlert: (...a) => w.alerts.push(a),
    eventDispatcher: { emit: (name, data) => w.emits.push({ name, data }) },
    removeFromInventory: it => { w.local.push(it); w.items.splice(w.items.indexOf(it), 1); },
    sendInventoryRemove: (id, opts) => w.removes.push({ id, opts }),
  };
  return w;
}

test('refused: the item stays, no action runs, no plant record is sent, the condition hint shows', () => {
  const w = setup({ staff_pc_owner_away: false });
  handleObjectInteraction(pc());
  assert.equal(w.alerts.length, 1);
  assert.deepEqual(w.alerts[0].slice(0, 2), ['Chris is at her desk. Wait until she has gone.', 'info']);
  assert.equal(globalThis.__applied.length, 0, 'no action');
  assert.equal(w.removes.length, 0, 'no sendInventoryRemove, so no usedOn plant record');
  assert.equal(w.local.length, 0, 'removeFromInventory not called');
  assert.equal(w.items.length, 1, 'the keylogger is still in the inventory');
});

test('refused with an unset global too (fails closed), and a hint variant wins when its condition holds', () => {
  let w = setup({});
  handleObjectInteraction(pc());
  assert.equal(w.alerts[0][0], 'Chris is at her desk. Wait until she has gone.');
  assert.equal(w.items.length, 1);
  w = setup({ warned: true });
  handleObjectInteraction(pc());
  assert.equal(w.alerts[0][0], 'Still there.');
});

test('accepted: once she is away the same click runs the actions and consumes the item with usedOn', () => {
  const w = setup({ staff_pc_owner_away: false });
  const sprite = pc();
  handleObjectInteraction(sprite);
  assert.equal(globalThis.__applied.length, 0);
  window.gameState.globalVariables.staff_pc_owner_away = true;
  handleObjectInteraction(sprite);
  assert.deepEqual(globalThis.__applied.map(a => a.actions), [[{ type: 'set_global', key: 'kp_deviceA_set', value: true }]]);
  assert.deepEqual(w.removes, [{ id: 'kit_deviceA', opts: { usedOn: 'staff_pc' } }]);
  assert.equal(w.items.length, 0, 'consumed');
  assert.equal(w.alerts.length, 1, 'only the earlier refusal toast');
});

test('without the item the ordinary requiresItem hint shows, not the condition hint', () => {
  const w = setup({ staff_pc_owner_away: true }, { holding: false });
  handleObjectInteraction(pc());
  assert.equal(w.alerts[0][0], 'You need the keylogger in hand.');
  assert.equal(globalThis.__applied.length, 0);
});

test('an object with no requiresItemCondition behaves as before', () => {
  const w = setup({});
  const s = pc(); delete s.scenarioData.requiresItemCondition;
  handleObjectInteraction(s);
  assert.equal(globalThis.__applied.length, 1);
  assert.equal(w.removes.length, 1);
  assert.equal(w.alerts.length, 0);
});

test('the test_remove_item demo scenario carries the gated PC, its switch and a kit that is not the drop box', () => {
  const sc = JSON.parse(readFileSync(join(js, '../../../scenarios/test_remove_item/scenario.json.erb'), 'utf8'));
  const objs = sc.rooms.test_room.objects;
  const gated = objs.find(o => o.id === 'gated_pc');
  assert.equal(gated.requiresItem, 'kit_keylogger');
  assert.equal(gated.requiresItemCondition, 'globalVars.kp_test_owner_away');
  assert.ok(objs.find(o => o.id === 'kit_keylogger')?.takeable);
  const sw = objs.find(o => o.id === 'owner_switch');
  assert.ok(sw.triggerOnInteract.some(a => a.type === 'set_global' && a.key === 'kp_test_owner_away'));
  assert.equal(sc.globalVariables.kp_test_owner_away, false);
});

// A PC with postitNoteVariants (ca09's Chidi): the click opens the shared post-it view while the note is up.
const NOTE_COND = "globalVars.kit_ca09_note_up === true && globalVars.kit_ca09_note_choice !== 'mention'";
const LINE = "You stop before signing in. It isn't your account, but anyone walking past could use it.";
const notePc = () => ({ objectId: 'kit_ca09_pc', scenarioData: { id: 'kit_ca09_pc', type: 'pc', name: "Chidi's PC",
  requiresItem: 'kit_deviceA', requiresItemHint: "Chidi's PC, on the sign-in screen. The note has gone.",
  triggerOnInteract: [],
  postitNoteVariants: [{ condition: NOTE_COND, value: 'Tarrowby2468', submitText: LINE }] } });

test('postit note up: object_interacted first, then the post-it view with the note, the line and no notepad button; no alert, no action', () => {
  const w = setup({ kit_ca09_note_up: true, kit_ca09_note_choice: '' }, { holding: false });
  const order = [];
  const realEmit = window.eventDispatcher.emit;
  window.eventDispatcher.emit = (n, d) => { order.push(n); realEmit(n, d); };
  const starts = [];
  window.startPasswordMinigame = (...a) => { order.push('start'); starts.push(a); };
  handleObjectInteraction(notePc());
  assert.equal(starts.length, 1);
  assert.deepEqual(starts[0][4], { postitNote: 'Tarrowby2468', showPostit: true, maxAttempts: 3, submitText: LINE, hideNotepadButton: true });
  assert.ok(order.indexOf('object_interacted') >= 0 && order.indexOf('object_interacted') < order.indexOf('start'));
  assert.equal(w.alerts.length, 0);
  assert.equal(globalThis.__applied.length, 0);
});

test('postit note gone (choice mention): no view, the requiresItem refusal shows', () => {
  const w = setup({ kit_ca09_note_up: true, kit_ca09_note_choice: 'mention' }, { holding: false });
  let started = 0;
  window.startPasswordMinigame = () => { started++; };
  handleObjectInteraction(notePc());
  assert.equal(started, 0);
  assert.equal(w.alerts.length, 1);
  assert.equal(w.alerts[0][0], "Chidi's PC, on the sign-in screen. The note has gone.");
});

test('postit variant without submitText: refused, falls back to the requiresItem refusal', () => {
  const w = setup({ kit_ca09_note_up: true, kit_ca09_note_choice: '' }, { holding: false });
  let started = 0;
  window.startPasswordMinigame = () => { started++; };
  const s = notePc(); delete s.scenarioData.postitNoteVariants[0].submitText;
  handleObjectInteraction(s);
  assert.equal(started, 0);
  assert.equal(w.alerts.length, 1);
});
