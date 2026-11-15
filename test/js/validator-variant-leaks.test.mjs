// scripts/validate_secret_leaks.rb, the variant-field extension (orchestrator pick A, 2026-11-15):
// step 3's answer match applied to three surfaces that ship to the browser before the player earns
// them - an object's textVariants `value`s, its observationVariants `value`s, and every
// client-visible string leaf of an object carrying revealOnGlobal. Each is a WARNING (not an
// error), silenced by an acknowledgedClues marker, and bound by the same 6-character whole-word
// rule. A revealOnGlobal object's server-only field (x-serverOnly) is never reported.
// Run with: node test/js/validator-variant-leaks.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

function issues(scenario) {
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_secret_leaks.rb'))}
    puts JSON.generate(check_secret_leaks(JSON.parse(STDIN.read)))`;
  const r = spawnSync('ruby', ['-e', script], {
    input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
  });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}
const errors = (l) => l.filter((s) => s.startsWith('❌'));
const warnings = (l) => l.filter((s) => s.startsWith('⚠️'));
const infos = (l) => l.filter((s) => s.startsWith('ℹ️'));
const has = (l, frag) => l.some((s) => s.includes(frag));
const assertHas = (l, frag) => assert.ok(has(l, frag), `expected "${frag}" in:\n${l.join('\n')}`);
const assertNot = (l, frag) => assert.ok(!has(l, frag), `did not expect "${frag}" in:\n${l.join('\n')}`);

// A room with a password lock and a second object carrying the surface under test. The lock answer
// `Satchel42` (8 chars) is long enough for the whole-word rule; a short answer swaps `requires`.
const scene = (surfaceObj, { lock = { id: 'pwbox', locked: true, lockType: 'password', requires: 'Satchel42' },
  acknowledgedClues = null } = {}) => {
  const sc = { rooms: { r: { objects: [lock, surfaceObj] } } };
  if (acknowledgedClues) sc.acknowledgedClues = acknowledgedClues;
  return sc;
};
const tv = (value) => ({ id: 'screen', textVariants: [{ condition: 'globalVars.x', value }] });
const ov = (value) => ({ id: 'screen', observationVariants: [{ condition: 'globalVars.x', value }] });
const rg = (extra) => ({ id: 'keylog', revealOnGlobal: 'planted', ...extra });
const ackFor = (inId) => [{ lock: 'pwbox', in: inId, reason: 'a deliberate gated clue', approved: 'h' }];
const shortLock = { id: 'pwbox', locked: true, lockType: 'password', requires: 'pass' };

// ── textVariants ───────────────────────────────────────────────────────────────────────────────

test('textVariants: an answer as a whole word in a variant value warns', { skip }, () => {
  const l = issues(scene(tv('remember, the code is Satchel42 now')));
  assertHas(warnings(l), 'appears in the textVariants field');
  assert.deepEqual(errors(l), []);
});

test('textVariants: an acknowledgedClues marker turns it into an info line', { skip }, () => {
  const l = issues(scene(tv('the code is Satchel42'), { acknowledgedClues: ackFor('screen') }));
  assertNot(warnings(l), 'appears in the textVariants field');
  assertHas(infos(l), 'acknowledged clue in textVariants: pwbox in screen');
});

test('textVariants: a short (<6 char) answer does not fire as a substring', { skip }, () => {
  // "pass" in "passport": under the 6-char whole-word threshold, no warning.
  assertNot(issues(scene(tv('bring your passport'), { lock: shortLock })), 'appears in the textVariants field');
});

test('textVariants: a non-matching variant value stays silent', { skip }, () => {
  assertNot(issues(scene(tv('nothing to see here'))), 'appears in the textVariants field');
});

// ── observationVariants ──────────────────────────────────────────────────────────────────────────

test('observationVariants: an answer as a whole word in a variant value warns', { skip }, () => {
  const l = issues(scene(ov('someone scrawled Satchel42 on the glass')));
  assertHas(warnings(l), 'appears in the observationVariants field');
  assert.deepEqual(errors(l), []);
});

test('observationVariants: an acknowledgedClues marker turns it into an info line', { skip }, () => {
  const l = issues(scene(ov('Satchel42 is written here'), { acknowledgedClues: ackFor('screen') }));
  assertNot(warnings(l), 'appears in the observationVariants field');
  assertHas(infos(l), 'acknowledged clue in observationVariants: pwbox in screen');
});

test('observationVariants: a short (<6 char) answer does not fire as a substring', { skip }, () => {
  assertNot(issues(scene(ov('check the passport desk'), { lock: shortLock })), 'appears in the observationVariants field');
});

test('observationVariants: a non-matching variant value stays silent', { skip }, () => {
  assertNot(issues(scene(ov('just an empty shelf'))), 'appears in the observationVariants field');
});

// ── revealOnGlobal ─────────────────────────────────────────────────────────────────────────────

test('revealOnGlobal: an answer in the hidden object display text warns', { skip }, () => {
  const l = issues(scene(rg({ text: 'captured on the wire: Satchel42' })));
  assertHas(warnings(l), 'appears in the revealOnGlobal field');
  assert.deepEqual(errors(l), []);
});

test('revealOnGlobal: an acknowledgedClues marker turns it into an info line', { skip }, () => {
  const l = issues(scene(rg({ text: 'captured: Satchel42' }), { acknowledgedClues: ackFor('keylog') }));
  assertNot(warnings(l), 'appears in the revealOnGlobal field');
  assertHas(infos(l), 'acknowledged clue in revealOnGlobal: pwbox in keylog');
});

test('revealOnGlobal: a short (<6 char) answer does not fire as a substring', { skip }, () => {
  assertNot(issues(scene(rg({ text: 'left by the passport desk' }), { lock: shortLock })), 'appears in the revealOnGlobal field');
});

test('revealOnGlobal: a non-matching display string stays silent', { skip }, () => {
  assertNot(issues(scene(rg({ text: 'a small grey box, blinking' }))), 'appears in the revealOnGlobal field');
});

test('revealOnGlobal: a server-only field (x-serverOnly) carrying the answer is not reported', { skip }, () => {
  // usePayload.secret is x-serverOnly (served only by GET /capture_secrets); the server strips it,
  // so an answer there never reaches the browser and must not warn as a revealOnGlobal leak.
  const l = issues(scene(rg({ usePayload: { secret: 'Satchel42' } })));
  assertNot(l, 'appears in the revealOnGlobal field');
});
