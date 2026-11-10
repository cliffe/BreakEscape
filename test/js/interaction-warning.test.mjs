// interactionWarning (systems/interactions.js + systems/notifications.js): an author-defined
// "are you sure?" any scenario object may carry, shown BEFORE the object's normal interaction.
//
//   - Decline runs onDecline and STOPS (the normal interaction is blocked).
//   - Proceed runs onProceed, then the object's normal interaction runs.
//   - once: Proceed is always permanent; a Decline is recorded (so the warning won't show
//     again) only when once is truthy (default true). With once:false a Decline re-shows.
//   - "answered" persists as the global iw_<id>_answered (survives reload with globalVariables).
//   - Busy-guard: never opens over a chat or minigame the player is already in.
//   - gameConfirm's plainText option renders the author text and both labels via textContent.
//
// Run with: bin/test-js test/js/interaction-warning.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'iw-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');

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
  '../utils/conditional-text.js': 'export function resolveObjectField(obj,key){ return obj ? obj[key] : undefined; }',
  '../utils/flag-lock.js': 'export function isRemoteFlagLock(){return false;} export function remoteFlagLockMessage(){return "";}',
  './npc-reach.js': 'export function npcReachDistSq(){return 0;}',
  './examine.js': 'export function shouldExamine(){return false;} export function startExamine(){return false;}',
  './combat-input.js': 'export function showPastTalkingToast(){}',
  './consumables.js': 'export function shouldConsumeOnInteract(){return false;} export function useConsumable(){}',
  './interaction-walls.js': 'export function interactionLineClear(){return true;}',
  '../utils/locked-hint.js': 'export function hintToastMs(){ return 6000; }',
  './requires-item-hint.js': 'export function requiresItemHint(data){ return (data && data.requiresItemHint) || ""; }',
  './interaction-reach.js': 'export function reachX(){return 0;} export function aimX(){return 0;}',
  './minigame-registry.js': 'export function hasMinigameStarter(){return false;} export function startRegisteredMinigame(){}',
};
let interactionsSrc = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
for (const [spec, body] of Object.entries(stubs)) {
  const before = interactionsSrc;
  interactionsSrc = interactionsSrc.split(`'${spec}'`).join(`'${dataUrl(body)}'`);
  if (interactionsSrc === before) throw new Error(`import specifier not found to stub: ${spec}`);
}
writeFileSync(join(dir, 'interactions.mjs'), interactionsSrc);

// interactions.js assigns window.* at import time, so window must exist first.
globalThis.window = {};
const { maybeInteractionWarning } = await import(pathToFileURL(join(dir, 'interactions.mjs')).href);

function setupWindow({ busy = false, answer = false, answeredGlobals = {} } = {}) {
  globalThis.__applied = [];
  const confirmCalls = [];
  globalThis.window = {
    gameState: { globalVariables: { ...answeredGlobals } },
    MinigameFramework: { currentMinigame: busy ? {} : null },
    gameConfirm: (...args) => { confirmCalls.push(args); return Promise.resolve(answer); },
  };
  return { confirmCalls };
}
const tick = () => new Promise(r => setTimeout(r, 0));

const box = (iw, extra = {}) => ({ objectId: 'box', scenarioData: { id: 'box', type: 'generic', interactionWarning: iw, ...extra } });

test('an unanswered warning shows: returns true and calls gameConfirm with the labels and plainText', () => {
  const { confirmCalls } = setupWindow({ answer: false });
  const r = maybeInteractionWarning(box({ text: 'Are you sure?', proceedLabel: 'Open', declineLabel: 'Leave', onDecline: [{ type: 'set_global', key: 'd' }] }));
  assert.equal(r, true, 'intercepts the interaction');
  assert.equal(confirmCalls.length, 1);
  assert.deepEqual(confirmCalls[0], ['Are you sure?', 'Open', 'Leave', { plainText: true }]);
});

test('labels default to Proceed / Cancel when omitted', () => {
  const { confirmCalls } = setupWindow({ answer: false });
  maybeInteractionWarning(box({ text: 'T' }));
  assert.deepEqual(confirmCalls[0], ['T', 'Proceed', 'Cancel', { plainText: true }]);
});

test('Decline runs onDecline and, with once truthy (default), records answered', async () => {
  setupWindow({ answer: false });
  maybeInteractionWarning(box({ text: 'T', onDecline: [{ type: 'set_global', key: 'left' }] }));
  await tick();
  assert.equal(globalThis.__applied.length, 1, 'only onDecline ran (the normal interaction is blocked)');
  assert.deepEqual(globalThis.__applied[0].actions, [{ type: 'set_global', key: 'left' }]);
  assert.equal(globalThis.__applied[0].opts.source, 'interaction_warning');
  assert.equal(window.gameState.globalVariables.iw_box_answered, true, 'answered recorded (default once)');
});

test('Decline with once:false does NOT record answered (the warning re-shows next time)', async () => {
  setupWindow({ answer: false });
  maybeInteractionWarning(box({ text: 'T', once: false, onDecline: [{ type: 'set_global', key: 'left' }] }));
  await tick();
  assert.ok(!window.gameState.globalVariables.iw_box_answered, 'not recorded, so it will show again');
});

test('Proceed runs onProceed, records answered, then runs the object normal interaction', async () => {
  setupWindow({ answer: true });
  const sprite = box(
    { text: 'T', once: false, onProceed: [{ type: 'add_capture', capture: { targetId: 'box' } }] },
    { triggerOnInteract: [{ type: 'set_global', key: 'normal' }] }
  );
  maybeInteractionWarning(sprite);
  await tick();
  await tick();
  // onProceed first (source interaction_warning), then the re-entrant normal interaction (source object_interact).
  const sources = globalThis.__applied.map(a => a.opts.source);
  assert.deepEqual(sources, ['interaction_warning', 'object_interact']);
  assert.deepEqual(globalThis.__applied[0].actions, [{ type: 'add_capture', capture: { targetId: 'box' } }]);
  assert.deepEqual(globalThis.__applied[1].actions, [{ type: 'set_global', key: 'normal' }]);
  assert.equal(window.gameState.globalVariables.iw_box_answered, true, 'Proceed is always permanent, even with once:false');
});

test('an already-answered object lets the normal interaction run (returns false, no dialog)', () => {
  const { confirmCalls } = setupWindow({ answer: false, answeredGlobals: { iw_box_answered: true } });
  const r = maybeInteractionWarning(box({ text: 'T', onProceed: [], onDecline: [] }));
  assert.equal(r, false, 'does not intercept');
  assert.equal(confirmCalls.length, 0, 'no warning dialog shown');
});

test('busy-guard: while a chat/minigame is open the warning is dropped (true), no dialog', () => {
  const { confirmCalls } = setupWindow({ busy: true });
  const r = maybeInteractionWarning(box({ text: 'T' }));
  assert.equal(r, true, 'dropped (intercepts so the normal interaction does not run under the open minigame)');
  assert.equal(confirmCalls.length, 0, 'never opens over the open minigame');
});

test('an object with no interactionWarning is never intercepted', () => {
  setupWindow({});
  assert.equal(maybeInteractionWarning({ objectId: 'x', scenarioData: { id: 'x', type: 'pc' } }), false);
});

// ---------------------------------------------------------------------------
// gameConfirm plainText: the author text and both button labels go in as plain text
// (textContent), never HTML, so markup in the scenario text can never be interpreted.
// ---------------------------------------------------------------------------
// Keep the REAL displayDashes (just a dash transform), stub the DOM-touching imports.
const displayDashesUrl = pathToFileURL(join(js, 'utils/display-dashes.js')).href;
const notifSrc = readFileSync(join(js, 'systems/notifications.js'), 'utf8')
  .split("'../utils/display-dashes.js'").join(`'${displayDashesUrl}'`)
  .split("'../ui/modal-stack.js'").join(`'${dataUrl('export function registerModal(){ return function(){}; }')}'`)
  .split("'../utils/overlay-open.js'").join(`'${dataUrl('export function fullScreenPanelOpen(){ return false; }')}'`);
writeFileSync(join(dir, 'notifications.mjs'), notifSrc);

function makeNode() {
  let _t = '', _h = '';
  return {
    style: {},
    set textContent(v) { _t = v; }, get textContent() { return _t; },
    set innerHTML(v) { _h = v; }, get innerHTML() { return _h; },
    addEventListener() {}, remove() {},
  };
}
let lastOverlay = null;
function makeOverlay() {
  const children = {
    '.game-confirm-message': makeNode(),
    '.game-confirm-ok': makeNode(),
    '.game-confirm-cancel': makeNode(),
    '.game-modal-close': makeNode(),
  };
  let _h = '';
  const o = {
    className: '',
    set innerHTML(v) { _h = v; }, get innerHTML() { return _h; },
    querySelector: (sel) => children[sel],
    remove() {},
  };
  lastOverlay = o;
  return o;
}
globalThis.window = {};
globalThis.document = { createElement: () => makeOverlay(), body: { appendChild() {} }, querySelector: () => null };
const { gameConfirm } = await import(pathToFileURL(join(dir, 'notifications.mjs')).href);

test('gameConfirm plainText puts author text and labels in via textContent, never innerHTML', () => {
  const hostile = 'Open <img src=x onerror=alert(1)> this?';
  gameConfirm(hostile, 'Proceed now', 'Leave it', { plainText: true });
  const msg = lastOverlay.querySelector('.game-confirm-message');
  assert.equal(msg.textContent, hostile, 'message is the raw text, never parsed as HTML');
  assert.equal(msg.innerHTML, '', 'message was never written through innerHTML');
  assert.equal(lastOverlay.querySelector('.game-confirm-ok').textContent, 'Proceed now');
  assert.equal(lastOverlay.querySelector('.game-confirm-cancel').textContent, 'Leave it');
});

test('gameConfirm without plainText keeps the legacy innerHTML path (labels interpolated)', () => {
  gameConfirm('Plain message', 'Yes', 'No');
  // The non-plainText path renders through the overlay innerHTML template; the message
  // node textContent is left untouched.
  assert.equal(lastOverlay.querySelector('.game-confirm-message').textContent, '');
  assert.match(lastOverlay.innerHTML, /Plain message/);
  assert.match(lastOverlay.innerHTML, /Yes/);
  assert.match(lastOverlay.innerHTML, /No/);
});
