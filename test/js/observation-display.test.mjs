// observationDisplay "gameDisplay" (systems/interactions.js): the modal body matches the
// readDisplay layout. The object name is the title only, the observation is in <em>, then the
// text; no literal "Observations:" / "Text:" labels. The notes copy is unchanged.
//
// Run with: node --max-old-space-size=2048 test/js/observation-display.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'od-'));
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
const { handleObjectInteraction, examineHeldItem } = await import(pathToFileURL(join(dir, 'interactions.mjs')).href);

function run(data) {
  const shown = [], alerts = [], notes = [];
  globalThis.window = {
    player: { x: 0, y: 0 },
    gameState: { globalVariables: {} },
    gameDisplay: (body, title, opts) => shown.push({ body, title, opts }),
    gameAlert: (...a) => alerts.push(a),
    // inventory.js's helper, with the same call
    announceNoteAdded: (n) => alerts.push([`Added "${n}" to your notes.`, 'info', 'Note Added', 3000]),
    addNote: (name, text, important) => { notes.push({ name, text, important }); return true; },
  };
  handleObjectInteraction({ name: data.id, objectId: data.id, scenarioData: { id: data.id, ...data } });
  return { shown, alerts, notes };
}

// Deprecated onInteract.confirmationText route: the confirm resolves true, then the observation shows.
async function runConfirmed(data) {
  const shown = [], alerts = [];
  globalThis.window = {
    player: { x: 0, y: 0 },
    gameState: { globalVariables: {} },
    gameDisplay: (body, title, opts) => shown.push({ body, title, opts }),
    gameAlert: (...a) => alerts.push(a),
    gameConfirm: () => Promise.resolve(true),
    addNote: () => true,
  };
  handleObjectInteraction({ name: data.id, objectId: data.id, scenarioData: { id: data.id, ...data } });
  await new Promise(r => setTimeout(r, 0));
  return { shown, alerts };
}

const board = { type: 'generic', name: 'Grid Situation Board', observationDisplay: 'gameDisplay',
  observations: 'A wall map of <the> grid & its "lines".', readable: true, text: 'PACIFIC -- 40% <b>load</b>' };

test('title once, observation in <em>, then escaped text; no labels, no duplicated name', () => {
  const { shown, alerts } = run(board);
  assert.deepEqual(alerts.map(a => a[2]), ['Note Added'], 'only the note toast, no observation alert');
  assert.equal(shown.length, 1);
  const { body, title, opts } = shown[0];
  assert.equal(title, 'Grid Situation Board');
  assert.deepEqual(opts, { html: true });
  assert.ok(body.startsWith('<em>A wall map of &lt;the&gt; grid &amp; its'), body);
  assert.ok(body.includes('</em>\n\nPACIFIC'), body);
  assert.ok(body.includes('&lt;b&gt;load&lt;/b&gt;'), 'text escaped');
  assert.ok(!body.includes('Grid Situation Board'), 'name not repeated in the body');
  assert.ok(!/Observations:|Text:/.test(body), 'no literal labels');
});

test('the same layout as readDisplay for the same fields', () => {
  const a = run(board).shown[0];
  const b = run({ ...board, observationDisplay: undefined, readDisplay: 'gameDisplay' }).shown[0];
  assert.deepEqual(a, b);
});

test('notes copy is unchanged: the object name and the raw text', () => {
  const { notes } = run(board);
  assert.equal(notes.length, 1);
  assert.equal(notes[0].name, 'Grid Situation Board');
  assert.equal(notes[0].text, 'PACIFIC -- 40% <b>load</b>');
});

test('observation only (not readable): <em> line alone, no note', () => {
  const { shown, notes } = run({ type: 'generic', name: 'Lamp', observationDisplay: 'gameDisplay', observations: 'It is warm.' });
  assert.equal(shown[0].body, '<em>It is warm.</em>');
  assert.equal(shown[0].title, 'Lamp');
  assert.equal(notes.length, 0);
});

test('without observationDisplay the alert message is the plain observation', () => {
  const { shown, alerts } = run({ type: 'generic', name: 'Lamp', observations: 'It is warm.' });
  assert.equal(shown.length, 0);
  assert.ok(alerts[0][0].trim() === 'It is warm.', 'body: ' + alerts[0][0]);
});

test('onInteract.confirmationText + display gameDisplay: same layout as the fixed branch', async () => {
  const { shown } = await runConfirmed({ type: 'generic', name: 'Grid Situation Board',
    observations: 'A wall map of <the> grid.', readable: true, text: 'PACIFIC -- 40%',
    onInteract: { display: 'gameDisplay', confirmationText: 'Look at the board?' } });
  assert.equal(shown.length, 1);
  const { body, title, opts } = shown[0];
  assert.equal(title, 'Grid Situation Board');
  assert.deepEqual(opts, { html: true });
  assert.ok(body.startsWith('<em>A wall map of &lt;the&gt; grid.</em>\n\nPACIFIC'), body);
  assert.ok(!body.includes('Grid Situation Board'), 'name not repeated in the body');
  assert.ok(!/Observations:|Text:/.test(body), 'no literal labels');
});

test('examineHeldItem falls back to an escaped <em> gameDisplay when the examine scene is absent', () => {
  const shown = [];
  globalThis.window = { gameDisplay: (body, title, opts) => shown.push({ body, title, opts }), gameAlert: () => {} };
  const ok = examineHeldItem({ name: 'x', scenarioData: { name: 'Odd <Key>', observationDisplay: 'gameDisplay', observations: 'Cold & <sharp>.' } });
  assert.equal(ok, true);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].body, '<em>Cold &amp; &lt;sharp&gt;.</em>');
  assert.equal(shown[0].title, 'Odd &lt;Key&gt;');
  assert.deepEqual(shown[0].opts, { html: true });
});
