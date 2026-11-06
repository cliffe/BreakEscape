// The capture store (SE lab payoff; plans/linear-petting-forest.md, Stage 1).
//  - systems/captures.js shapes and reads se_captures: a map keyed by phish target id;
//  - makeCaptureEntry keeps only the closed keys and constrains the kind;
//  - mergeCapture is first-capture-wins (idempotent, reference-equal on a repeat);
//  - the reveal switch is OFF by default, so a secret is masked unless the scenario opts in;
//  - state-sync.js sanitises se_captures to the same closed key set on the sync boundary, and
//    that set stays in step with captures.js CAPTURE_ENTRY_KEYS;
//  - a mission with no capture state is left unchanged.
// Run with: node --test test/js/social-captures.test.mjs

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-captures-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
const toMjs = s => s.replace(/'\.\/(api-client|config)\.js'/g, "'./$1.mjs'");
copy('config.js', 'config.mjs');
copy('api-client.js', 'api-client.mjs', toMjs);
copy('state-sync.js', 'state-sync.mjs', toMjs);
copy('systems/captures.js', 'captures.mjs');

globalThis.window = { breakEscapeConfig: { gameId: 1, apiBasePath: '/games/1', csrfToken: 't' } };
globalThis.document = { querySelector: () => null };
const { StateSync } = await import(pathToFileURL(join(dir, 'state-sync.mjs')).href);
const cap = await import(pathToFileURL(join(dir, 'captures.mjs')).href);
const {
  CAPTURE_ENTRY_KEYS, readCaptures, capturesReveal, maskSecret, makeCaptureEntry,
  mergeCapture, captureList, displaySecret
} = cap;

function gameWith(globalVariables) {
  globalThis.window.gameState = { globalVariables, notes: [] };
  globalThis.window.currentRoom = { name: 'lobby' };
  return new StateSync();
}
const synced = sync => sync.buildSharedSections().globalVariables;

// ---- makeCaptureEntry ----------------------------------------------------------------

test('makeCaptureEntry keeps only closed keys, constrains the kind, and needs a target id', () => {
  const e = makeCaptureEntry({ targetId: 'lord', kind: 'credential', address: 's.lord@x.example',
    secret: 'Pw!', host: null, note: '', roleLabel: 'Finance intern', at: 5, junk: 'nope' });
  assert.deepEqual(Object.keys(e).sort(), ['address', 'at', 'kind', 'roleLabel', 'secret', 'targetId']);
  assert.equal(e.kind, 'credential');
  assert.equal(makeCaptureEntry({ targetId: 'x', kind: 'weird' }).kind, 'credential', 'an unknown kind falls back');
  assert.equal(makeCaptureEntry({ kind: 'foothold' }), null, 'no target id, no entry');
  assert.equal(makeCaptureEntry(null), null);
  assert.equal(makeCaptureEntry({ targetId: '' }), null);
});

test('a foothold entry carries host and note, not a secret', () => {
  const e = makeCaptureEntry({ targetId: 'hampshire', kind: 'foothold', host: 'FIN-LT-07', note: 'opened CV.docx', at: 3 });
  assert.equal(e.kind, 'foothold');
  assert.equal(e.host, 'FIN-LT-07');
  assert.equal(e.note, 'opened CV.docx');
  assert.ok(!('secret' in e));
});

// ---- mergeCapture: first-capture-wins -------------------------------------------------

test('mergeCapture adds a new target and is reference-equal on a repeat', () => {
  const first = makeCaptureEntry({ targetId: 'lord', kind: 'credential', secret: 'A', at: 1 });
  const m1 = mergeCapture({}, first);
  assert.deepEqual(Object.keys(m1), ['lord']);
  const again = makeCaptureEntry({ targetId: 'lord', kind: 'credential', secret: 'B', at: 2 });
  const m2 = mergeCapture(m1, again);
  assert.equal(m2, m1, 'same map returned, so the writer skips a redundant sync');
  assert.equal(m2.lord.secret, 'A', 'the first landing wins');
  assert.equal(mergeCapture(m1, null), m1, 'a null entry is a no-op');
});

// ---- reveal switch: off by default ----------------------------------------------------

test('capturesReveal is off unless social.captures.revealSecret is explicitly true', () => {
  assert.equal(capturesReveal(undefined), false);
  assert.equal(capturesReveal({}), false);
  assert.equal(capturesReveal({ captures: {} }), false);
  assert.equal(capturesReveal({ captures: { revealSecret: 'yes' } }), false, 'only boolean true');
  assert.equal(capturesReveal({ captures: { revealSecret: true } }), true);
});

test('displaySecret masks unless the scenario reveals, and is null for a foothold', () => {
  const cred = makeCaptureEntry({ targetId: 'lord', kind: 'credential', secret: 'Sofia2026!' });
  assert.equal(displaySecret(cred, { captures: {} }), maskSecret());
  assert.equal(displaySecret(cred, { captures: { revealSecret: true } }), 'Sofia2026!');
  const foot = makeCaptureEntry({ targetId: 'hampshire', kind: 'foothold', host: 'H' });
  assert.equal(displaySecret(foot, { captures: { revealSecret: true } }), null);
  const noSecret = makeCaptureEntry({ targetId: 'z', kind: 'credential' });
  assert.equal(displaySecret(noSecret, { captures: { revealSecret: true } }), null, 'nothing to show');
});

test('displaySecret takes the server-served secret from the secretsById map', () => {
  // The secret is stripped from the bootstrap, so a fresh entry carries none; the view passes
  // the { targetId: secret } map served by /capture_secrets once the capture is earned.
  const noSecret = makeCaptureEntry({ targetId: 'lord', kind: 'credential' });
  const reveal = { captures: { revealSecret: true } };
  assert.equal(displaySecret(noSecret, reveal), null, 'no secret anywhere yet → mask (null) in the view');
  assert.equal(displaySecret(noSecret, reveal, { lord: 'Sofia2026!' }), 'Sofia2026!', 'the map supplies it');
  assert.equal(displaySecret(noSecret, { captures: {} }, { lord: 'Sofia2026!' }), maskSecret(),
    'reveal off still masks, even with a map');
  const withOld = makeCaptureEntry({ targetId: 'lord', kind: 'credential', secret: 'OLD' });
  assert.equal(displaySecret(withOld, reveal, { lord: 'NEW' }), 'NEW', 'the served secret wins over a stale stored one');
  assert.equal(displaySecret(withOld, reveal, {}), 'OLD', 'falls back to a stored secret when the map lacks it');
});

// ---- readCaptures / captureList -------------------------------------------------------

test('captureList is oldest-first by at, then target id', () => {
  const globals = { se_captures: {
    b: makeCaptureEntry({ targetId: 'b', kind: 'credential', at: 20 }),
    a: makeCaptureEntry({ targetId: 'a', kind: 'foothold', at: 10 }),
    c: makeCaptureEntry({ targetId: 'c', kind: 'credential', at: 10 })
  } };
  assert.deepEqual(captureList(globals).map(e => e.targetId), ['a', 'c', 'b']);
  assert.deepEqual(readCaptures(null), {});
  assert.deepEqual(captureList({}), []);
});

// ---- sync boundary: closed key set, in step with captures.js --------------------------

test('state-sync sanitises se_captures to the closed key set and drops unknown keys', () => {
  const g = synced(gameWith({ se_captures: {
    lord: { targetId: 'lord', kind: 'credential', secret: 'x', address: 'a', at: 1, junk: 'drop', leak: 1 },
    bad: 'nope'
  } }));
  assert.deepEqual(Object.keys(g.se_captures.lord).sort(), ['address', 'at', 'kind', 'secret', 'targetId']);
  assert.deepEqual(g.se_captures.bad, {}, 'a non-object entry collapses to {}');
});

test('the sync guard key set stays in step with captures.js CAPTURE_ENTRY_KEYS', () => {
  // Every closed key round-trips through the guard; a key outside the set is dropped. This
  // fails if the two lists drift (the state-sync copy must mirror captures.js).
  const full = {};
  for (const k of CAPTURE_ENTRY_KEYS) full[k] = (k === 'at') ? 1 : `v_${k}`;
  full.targetId = 'lord';
  full.kind = 'credential';
  const g = synced(gameWith({ se_captures: { lord: { ...full, surprise: 1 } } }));
  assert.deepEqual(Object.keys(g.se_captures.lord).sort(), [...CAPTURE_ENTRY_KEYS].sort());
});

test('a mission with no capture state is left unchanged', () => {
  const g = synced(gameWith({ someOther: true }));
  assert.ok(!('se_captures' in g), 'no se_captures key is invented');
});
