// Long readable room text opens in the gameDisplay modal instead of the 5 s toast
// (systems/interactions.js isLongToastText). Short text keeps the toast; "readDisplay": "toast" opts out.
//
// Run with: node --max-old-space-size=2048 test/js/readable-long-text.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'rlt-'));
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
  // resolveObjectField is stubbed as obj[key]: observationVariants/textVariants are NOT exercised
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

function run(data, extra = {}) {
  const shown = [], alerts = [], notes = [];
  const gv = {};
  globalThis.window = {
    player: { x: 0, y: 0 },
    gameState: { globalVariables: gv },
    gameDisplay: (body, title, opts) => shown.push({ body, title, opts }),
    gameAlert: (...a) => alerts.push(a),
    addNote: (name, text, important) => { notes.push({ name, text, important }); return true; },
    ...extra,
  };
  handleObjectInteraction({ name: data.id, objectId: data.id, scenarioData: { id: data.id, ...data } });
  // The note toast (title 'Note Added') is the readable branch's own and is not under test:
  // `toasts` is the 5 s read toast only.
  const toasts = alerts.filter(a => a[2] !== 'Note Added');
  return { shown, alerts, toasts, notes, gv };
}

const mon = (text, more = {}) => ({ id: 'mon', type: 'generic', name: 'Bedside Monitor', readable: true, text, ...more });
const chars = (n) => 'a'.repeat(n);

test('long text opens the gameDisplay modal, not the toast', () => {
  const { shown, toasts: alerts } = run(mon(chars(300)));
  assert.ok(shown.length === 1, 'one modal');
  assert.ok(shown[0].title === 'Bedside Monitor', 'name is the title');
  assert.ok(shown[0].body === chars(300), 'full text in the body');
  assert.ok(JSON.stringify(shown[0].opts) === '{"html":true}', 'html mode');
  assert.ok(alerts.length === 0, 'no 5 s toast');
});

test('short text stays a toast with the plain text as its body', () => {
  const { shown, toasts: alerts } = run(mon('Baseline readings.'));
  assert.ok(shown.length === 0, 'no modal');
  assert.ok(alerts.length === 1, 'one toast');
  assert.ok(alerts[0][0] === 'Baseline readings.', 'plain body: ' + alerts[0][0]);
  assert.ok(alerts[0][1] === 'info' && alerts[0][2] === 'Bedside Monitor' && alerts[0][3] === 5000, 'args unchanged');
});

test('character threshold edge: 120 stays a toast, 121 opens the modal', () => {
  assert.ok(run(mon(chars(120))).shown.length === 0, '120 toast');
  assert.ok(run(mon(chars(121))).shown.length === 1, '121 modal');
});

test('line threshold edge: 3 lines stays a toast, 4 lines opens the modal', () => {
  assert.ok(run(mon('a\nb\nc')).shown.length === 0, '3 lines toast');
  assert.ok(run(mon('a\nb\nc\nd')).shown.length === 1, '4 lines modal');
});

test('a long observation counts with the text and shows as <em> then the text', () => {
  const { shown, toasts: alerts } = run(mon('Short.', { observations: chars(130) }));
  assert.ok(alerts.length === 0 && shown.length === 1, 'modal');
  assert.ok(shown[0].body === '<em>' + chars(130) + '</em>\n\nShort.', shown[0].body);
});

test('readDisplay "toast" keeps the toast for long text', () => {
  const { shown, toasts: alerts } = run(mon(chars(300), { readDisplay: 'toast' }));
  assert.ok(shown.length === 0 && alerts.length === 1, 'toast');
});

test('without window.gameDisplay the toast is the fallback', () => {
  const { toasts: alerts, shown } = run(mon(chars(300)), { gameDisplay: undefined });
  assert.ok(shown.length === 0 && alerts.length === 1, 'toast');
});

test('onRead.setVariable still fires on the long path', () => {
  const { gv, shown } = run(mon(chars(300), { onRead: { setVariable: { read_it: true } } }));
  assert.ok(gv.read_it === true, 'variable set');
  assert.ok(shown.length === 1, 'modal shown');
});

test('notes behaviour is unchanged: no extra note or toast on the long path', () => {
  const long = run(mon(chars(300)));
  const short = run(mon('Short.'));
  assert.ok(long.notes.length === short.notes.length, 'same note count as the short path');
  assert.ok(long.alerts.length === short.alerts.length - 1, 'one note toast each, and the short path also has its read toast');
});

test('HTML in long text stays escaped', () => {
  const { shown } = run(mon('<script>alert(1)</script> & "q" ' + chars(130), { observations: '<b>obs</b>' }));
  const b = shown[0].body;
  assert.ok(!b.includes('<script>') && !b.includes('<b>'), 'no raw tags: ' + b);
  assert.ok(b.includes('&lt;script&gt;') && b.includes('&lt;b&gt;obs&lt;/b&gt;'), 'escaped');
  assert.ok(b.startsWith('<em>'), 'only the wrapper em is HTML');
});

test('readDisplay gameDisplay is untouched; a long non-readable observation never modals', () => {
  const rd = run(mon(chars(300), { readDisplay: 'gameDisplay' }));
  assert.ok(rd.shown.length === 1 && rd.toasts.length === 0, 'readDisplay path');
  const obs = run({ id: 'x', type: 'generic', name: 'Lamp', observations: chars(300), readable: false });
  assert.ok(obs.shown.length === 0, 'non-readable long observation unchanged (no modal)');
});

test('the readable toast carries whole: true, a non-readable observation toast does not', () => {
  const r = run(mon('Baseline readings.'));
  assert.ok(r.toasts.length === 1 && JSON.stringify(r.toasts[0][4]) === '{"whole":true}', 'readable toast is whole');
  const o = run({ id: 'x', type: 'generic', name: 'Lamp', observations: 'A lamp.', readable: false });
  assert.ok(o.toasts.length === 1 && o.toasts[0][4] === undefined, 'plain observation toast has no options');
});

test('long text on a non-readable object stays a toast (needs data.readable)', () => {
  const { shown, toasts } = run({ id: 'x', type: 'generic', name: 'Lamp', readable: false, text: chars(300) });
  assert.ok(shown.length === 0 && toasts.length === 1, 'toast, no modal');
});

test('observationDisplay gameDisplay plus long readable text gives exactly one modal', () => {
  const { shown, toasts } = run(mon(chars(300), { observations: 'Seen.', observationDisplay: 'gameDisplay' }));
  assert.ok(shown.length === 1 && toasts.length === 0, 'one modal, no toast');
});

test('a takeable long readable object is unaffected', () => {
  const { shown } = run(mon(chars(300), { takeable: true }));
  assert.ok(shown.length === 0, 'no modal for a takeable object');
});

test('observation identical to the text counts once and shows once', () => {
  const same = chars(76);
  const a = run(mon(same, { observations: same }));
  assert.ok(a.shown.length === 0 && a.toasts.length === 1, '76 + 76 is one piece, stays a toast');
  const b = run(mon(chars(130), { observations: '  ' + chars(130) + ' ' }));
  assert.ok(b.shown.length === 1, 'long single piece opens the modal');
  assert.ok(b.shown[0].body === chars(130), 'shown once, plain: ' + b.shown[0].body);
  const c = run(mon(chars(76), { observations: chars(75) + 'b' }));
  assert.ok(c.shown.length === 1, 'different pieces still add up');
});

test('toast body: observation then text on its own line, no labels, no repeated name', () => {
  const { toasts } = run(mon('Reads steady.', { observations: 'A grey monitor.' }));
  assert.ok(toasts.length === 1, 'one toast');
  assert.ok(toasts[0][0].trim() === 'A grey monitor.\nReads steady.', 'body: ' + toasts[0][0]);
  assert.ok(!/Observations:|Text:/.test(toasts[0][0]), 'no labels');
  assert.ok(toasts[0][0].indexOf('Bedside Monitor') === -1, 'name not repeated');
  assert.ok(toasts[0][2] === 'Bedside Monitor', 'title is the name');
});

test('toast body: identical observation and text show once', () => {
  const { toasts } = run(mon('Same words.', { observations: 'Same words.' }));
  assert.ok(toasts[0][0].trim() === 'Same words.', 'once: ' + toasts[0][0]);
});

test('toast body: observation only is the observation alone', () => {
  const { toasts } = run({ id: 'lamp', type: 'generic', name: 'Lamp', observations: 'It is warm.' });
  assert.ok(toasts[0][0].trim() === 'It is warm.', 'body: ' + toasts[0][0]);
});

test('long-text rule counts what the toast shows: 120 observation chars and text of 1 char is a modal, identical 120 is a toast', () => {
  assert.ok(run(mon('b', { observations: chars(120) })).shown.length === 1, 'obs + text over 120');
  assert.ok(run(mon(chars(120), { observations: chars(120) })).shown.length === 0, 'identical counted once');
});

// The game resolves a missing observation to null (conditional-text.js `?? null`), so the stub
// above returns null too. A readable object with text and no observation must still show its text.
test('toast body: text with observations null is the text, not the name', () => {
  const { toasts } = run(mon('Baseline readings.', { observations: null }));
  assert.ok(toasts.length === 1, 'one toast');
  assert.ok(toasts[0][0].trim() === 'Baseline readings.', 'body: ' + toasts[0][0]);
});

test('toast body: text with the observations key absent is the text, not the name', () => {
  const { toasts } = run(mon('Baseline readings.'));
  assert.ok(toasts[0][0].trim() === 'Baseline readings.', 'body: ' + toasts[0][0]);
});

test('long text with observations null still opens the modal', () => {
  const { shown, toasts } = run(mon(chars(300), { observations: null }));
  assert.ok(shown.length === 1 && toasts.length === 0, 'modal, no toast');
  assert.ok(shown[0].body === chars(300), 'body is the text alone');
});

test('toast body: nothing to show falls back to the name, then to the sprite name', () => {
  const named = run({ id: 'box', type: 'generic', name: 'Grey Box' });
  assert.ok(named.toasts[0][0] === 'Grey Box', 'name: ' + named.toasts[0][0]);
  const unnamed = run({ id: 'box', type: 'generic' });
  assert.ok(unnamed.toasts[0][0] === 'box', 'sprite name: ' + unnamed.toasts[0][0]);
});

test('onInteract.confirmationText toast body is the plain observation', async () => {
  const alerts = [];
  globalThis.window = {
    player: { x: 0, y: 0 },
    gameState: { globalVariables: {} },
    gameDisplay: () => {},
    gameAlert: (...a) => alerts.push(a),
    gameConfirm: () => Promise.resolve(true),
    addNote: () => true,
  };
  const data = { id: 'lamp', type: 'generic', name: 'Lamp', observations: 'It is warm.',
    onInteract: { confirmationText: 'Touch the lamp?' } };
  handleObjectInteraction({ name: data.id, objectId: data.id, scenarioData: data });
  await new Promise(r => setTimeout(r, 0));
  assert.ok(alerts.length === 1, 'one toast');
  assert.ok(alerts[0][0].trim() === 'It is warm.', 'body: ' + alerts[0][0]);
  assert.ok(alerts[0][2] === 'Lamp', 'title is the name');
});

test('onInteract toast with nothing to show falls back to the name and sprite name', async () => {
  const alerts = [];
  globalThis.window = {
    player: { x: 0, y: 0 },
    gameState: { globalVariables: {} },
    gameDisplay: () => {},
    gameAlert: (...a) => alerts.push(a),
    gameConfirm: () => Promise.resolve(true),
    addNote: () => true,
  };
  const d1 = { id: 'a', type: 'generic', name: 'Plain Box', onInteract: { confirmationText: 'Open?' } };
  handleObjectInteraction({ name: 'a', objectId: 'a', scenarioData: d1 });
  const d2 = { id: 'b', type: 'generic', onInteract: { confirmationText: 'Open?' } };
  handleObjectInteraction({ name: 'b', objectId: 'b', scenarioData: d2 });
  await new Promise(r => setTimeout(r, 0));
  assert.ok(alerts.length === 2, 'two toasts');
  assert.ok(alerts[0][0] === 'Plain Box', 'name: ' + alerts[0][0]);
  assert.ok(alerts[1][0] === 'b', 'sprite name: ' + alerts[1][0]);
});

test('gameDisplay modal: an observation identical to the text shows once', () => {
  const same = 'Server room access is logged.';
  const rd = run(mon(same, { observations: same, readDisplay: 'gameDisplay' }));
  assert.ok(rd.shown.length === 1, 'readDisplay: one modal');
  assert.ok(rd.shown[0].body === same, 'readDisplay: text once, no em: ' + rd.shown[0].body);
  const od = run(mon(same, { observations: ' ' + same + ' ', observationDisplay: 'gameDisplay' }));
  assert.ok(od.shown.length === 1 && od.shown[0].body === same, 'observationDisplay: once: ' + od.shown[0].body);
  const long = run(mon(chars(300), { observations: chars(300) }));
  assert.ok(long.shown.length === 1 && long.shown[0].body === chars(300), 'long rule: once');
});

test('gameDisplay modal: a different observation still shows both', () => {
  const rd = run(mon('The text.', { observations: 'A note.', readDisplay: 'gameDisplay' }));
  assert.ok(rd.shown[0].body === '<em>A note.</em>\n\nThe text.', rd.shown[0].body);
});

test('gameDisplay modal: a null or missing observation shows just the text', () => {
  const a = run(mon('The text.', { observations: null, readDisplay: 'gameDisplay' }));
  assert.ok(a.shown[0].body === 'The text.', 'null: ' + a.shown[0].body);
  const b = run(mon('The text.', { readDisplay: 'gameDisplay' }));
  assert.ok(b.shown[0].body === 'The text.', 'missing: ' + b.shown[0].body);
});

test('onInteract.display gameDisplay: an observation identical to the text shows once', () => {
  const same = 'Server room access is logged.';
  const r = run(mon(same, { observations: same, onInteract: { display: 'gameDisplay' } }));
  assert.ok(r.shown.length === 1, 'one modal: ' + r.shown.length);
  assert.ok(r.shown[0].body === same, 'text once, no em: ' + r.shown[0].body);
  const d = run(mon('The text.', { observations: 'A note.', onInteract: { display: 'gameDisplay' } }));
  assert.ok(d.shown.length === 1 && d.shown[0].body === '<em>A note.</em>\n\nThe text.', 'different still both: ' + d.shown[0]?.body);
});

test('gameDisplay modal: a hostile string identical in observation and text is escaped and shown once', () => {
  const HOSTILE = `<img src=x onerror="x()"> & "q" 's'`;
  const ESC = '&lt;img src=x onerror=&quot;x()&quot;&gt; &amp; &quot;q&quot; &#39;s&#39;';
  const rd = run(mon(HOSTILE, { observations: HOSTILE, readDisplay: 'gameDisplay' }));
  assert.ok(rd.shown.length === 1 && rd.shown[0].body === ESC, 'readDisplay: ' + rd.shown[0]?.body);
  const oi = run(mon(HOSTILE, { observations: HOSTILE, onInteract: { display: 'gameDisplay' } }));
  assert.ok(oi.shown.length === 1 && oi.shown[0].body === ESC, 'onInteract: ' + oi.shown[0]?.body);
});
