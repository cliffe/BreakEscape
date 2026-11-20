// Pick-up-then-open items (launch device, workstation, VM launcher, phone, mail terminal,
// Friendface phone) after a pickup that did not happen (launch device review R1, M1).
// The tool used to be reopened 1 s after the click whatever addToInventory answered. A
// refused pickup or a network failure leaves the floor copy takeable, so the reopen went
// straight back into the pickup: a POST, a sound and an error alert every second, without
// end. A duplicate (a second copy of an item already held) looped the same way.
//
// Drives the real handleObjectInteraction in systems/interactions.js with its static
// imports stubbed; addToInventory answers what each test sets, and setTimeout is a queue
// the test runs by hand.
// Run with: node --test test/js/pickup-then-interact-refusal.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'pickup-refusal-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');

function dataUrl(src) { return 'data:text/javascript,' + encodeURIComponent(src); }

const stubs = {
  '../utils/constants.js': 'export const INTERACTION_RANGE=1e6, INTERACTION_RANGE_SQ=1e12, INTERACTION_CHECK_INTERVAL=0, DOOR_INTERACTION_RANGE_SQ=0; export function overlayDepth(){return 0;}',
  '../core/rooms.js': 'export const rooms={};',
  '../core/player.js': 'export function facePlayerToward(){}',
  './unlock-system.js': 'export function handleUnlock(sprite, type){ globalThis.__calls.push(["unlock", sprite.scenarioData.id, type]); }',
  './doors.js': 'export function handleDoorInteraction(){}',
  './biometrics.js': 'export function collectFingerprint(){} export function handleBiometricScan(){}',
  './inventory.js': 'export function addToInventory(sprite){ globalThis.__calls.push(["pickup", sprite.scenarioData.id]); return globalThis.__answer(sprite); } export function createItemIdentifier(){return "";}',
  './ui-sounds.js': 'export function playUISound(n){ globalThis.__calls.push(["sound", n]); } export function playGameSound(){}',
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
  './minigame-registry.js': 'export function hasMinigameStarter(){return false;} export function startRegisteredMinigame(t, s){ globalThis.__calls.push(["open", t, s.objectId]); }',
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

globalThis.__calls = [];
globalThis.window = {};
const { handleObjectInteraction } = await import(pathToFileURL(join(dir, 'interactions.mjs')).href);

const realSetTimeout = globalThis.setTimeout;
let timers = [];

function setup({ answer, held = [] }) {
  globalThis.__calls = [];
  globalThis.__answer = answer;
  timers = [];
  globalThis.setTimeout = (cb, ms) => { const t = { cb, ms, live: true }; timers.push(t); return t; };
  const record = (what) => (...a) => globalThis.__calls.push([what, ...a]);
  globalThis.window = {
    gameState: { globalVariables: {} },
    inventory: { items: held },
    player: { x: 0, y: 0 },
    gameAlert: record('alert'),
    expectPanelWithin: () => {},
    announcePickup: () => {},
    openCryptoWorkstation: () => globalThis.__calls.push(['open', 'workstation']),
    MinigameFramework: {
      currentMinigame: null,
      startMinigame: (type, c, params) => globalThis.__calls.push(['open', type, params?.stationId || params?.vmId || null]),
    },
  };
}

// Let the pickup promise answer, then run every timer that is due, for `rounds` rounds
// (old code: each round was one more pickup).
async function runFor(rounds = 5) {
  for (let i = 0; i < rounds; i++) {
    for (let j = 0; j < 5; j++) await Promise.resolve();
    const due = timers.filter(t => t.live);
    due.forEach(t => { t.live = false; t.cb(); });
  }
  for (let j = 0; j < 5; j++) await Promise.resolve();
}

test.after(() => { globalThis.setTimeout = realSetTimeout; });

const floorDevice = () => ({
  objectId: 'entropy_launch_device', name: 'launch-device', x: 0, y: 0,
  scenarioData: { type: 'launch-device', id: 'entropy_launch_device', name: 'Launch device', takeable: true, mode: 'launch-abort' }
});
const count = (kind) => globalThis.__calls.filter(c => c[0] === kind).length;

// What the real addToInventory does on each failure: it shows its own alert and answers.
const refused = () => { globalThis.window.gameAlert('NPC not encountered', 'error', 'Invalid Action', 3000); return Promise.resolve({ ok: false, reason: 'rejected', message: 'NPC not encountered' }); };
const offline = () => { globalThis.window.gameAlert('Network error - please try again', 'error', 'Error', 3000); return Promise.resolve({ ok: false, reason: 'error', message: 'fetch failed' }); };

test('a refused pickup of the launch device: one POST, one sound, one alert, nothing reopened', async () => {
  setup({ answer: refused });
  handleObjectInteraction(floorDevice());
  await runFor(6);
  assert.equal(count('pickup'), 1, 'one inventory POST');
  assert.equal(count('sound'), 1);
  assert.equal(count('alert'), 1, 'one message');
  assert.equal(count('open'), 0, 'the floor copy is not opened');
});

test('a network failure on the pickup: no repeat and one message', async () => {
  setup({ answer: offline });
  handleObjectInteraction(floorDevice());
  await runFor(6);
  assert.equal(count('pickup'), 1);
  assert.equal(count('sound'), 1);
  assert.equal(count('alert'), 1);
  assert.equal(count('open'), 0);
});

test('a duplicate launch device opens nothing and says one message', async () => {
  const heldCopy = floorDevice();
  heldCopy.objectId = 'inventory_entropy_launch_device';
  heldCopy.scenarioData = { ...heldCopy.scenarioData, takeable: false };
  setup({
    held: [heldCopy],
    answer: () => { globalThis.window.gameAlert('Already in inventory', 'info', 'Launch device', 2000); return Promise.resolve({ ok: true, reason: 'already', item: heldCopy }); },
  });
  handleObjectInteraction(floorDevice());
  await runFor(6);
  assert.equal(count('pickup'), 1, 'one inventory POST');
  assert.equal(count('alert'), 1, 'one message');
  assert.equal(count('open'), 0);
});

test('a duplicate whose held copy is still marked takeable opens nothing rather than loop', async () => {
  const heldCopy = floorDevice();
  heldCopy.objectId = 'inventory_entropy_launch_device';
  setup({ held: [heldCopy], answer: () => Promise.resolve({ ok: true, reason: 'already', item: heldCopy }) });
  handleObjectInteraction(floorDevice());
  await runFor(6);
  assert.equal(count('pickup'), 1);
  assert.equal(count('open'), 0);
});

test('a pickup that succeeds only adds the launch device: no timer, nothing opens, one announcement', async () => {
  setup({ answer: (s) => { s.scenarioData.takeable = false; return Promise.resolve({ ok: true, reason: 'added' }); } });
  const announced = [];
  globalThis.window.announcePickup = (sprite, res) => announced.push([sprite.scenarioData.id, res.reason]);
  handleObjectInteraction(floorDevice());
  await runFor(6);
  assert.equal(count('pickup'), 1);
  assert.equal(timers.length, 0, 'no reopen timer');
  assert.equal(count('open'), 0);
  assert.deepEqual(announced, [['entropy_launch_device', 'added']]);
});

test('a successful phone pickup still opens it about a second after the click', async () => {
  setup({ answer: (s) => { s.scenarioData.takeable = false; return Promise.resolve({ ok: true, reason: 'added' }); } });
  handleObjectInteraction({ objectId: 'x_phone', name: 'phone', x: 0, y: 0,
    scenarioData: { type: 'phone', id: 'x_phone', name: 'Phone', takeable: true, phoneId: 'p1' } });
  for (let j = 0; j < 5; j++) await Promise.resolve();
  assert.equal(timers.length, 1);
  assert.ok(timers[0].ms > 900 && timers[0].ms <= 1000, `reopen delay ${timers[0].ms}`);
  await runFor(6);
  assert.equal(count('pickup'), 1);
  assert.equal(timers.filter(t => !t.live).length, 1, 'the reopen timer ran');
});

for (const type of ['workstation', 'lab-workstation', 'vm-launcher', 'vm_launcher', 'launch-device', 'phone', 'mail_terminal', 'phone_friendface']) {
  test(`a refused pickup of a ${type} is tried once`, async () => {
    setup({ answer: refused });
    handleObjectInteraction({ objectId: `x_${type}`, name: type, x: 0, y: 0,
      scenarioData: { type, id: `x_${type}`, name: type, takeable: true, phoneId: 'p1' } });
    await runFor(6);
    assert.equal(count('pickup'), 1);
    assert.equal(count('alert'), 1);
  });
}
