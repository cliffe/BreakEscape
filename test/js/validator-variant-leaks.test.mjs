// scripts/validate_secret_leaks.rb, the variant-field extension (orchestrator pick A, 2026-11-15):
// step 3's answer match applied to three surfaces that ship to the browser before the player earns
// them - an object's textVariants, observationVariants, requiresItemHintVariants and
// jackConfirmVariants `value`s, its unauthorizedTextVariants `text`s, and every
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

// ── the other conditional-text fields ──────────────────────────────────────────────────────────

test('requiresItemHintVariants: an answer in a variant value warns', { skip }, () => {
  const l = issues(scene({ id: 'panel', requiresItemHintVariants: [{ condition: 'globalVars.x', value: 'try Satchel42' }] }));
  assertHas(warnings(l), 'appears in the requiresItemHintVariants field');
  assert.deepEqual(errors(l), []);
});

test('jackConfirmVariants: an answer in a variant value warns', { skip }, () => {
  const l = issues(scene({ id: 'jack', jackConfirmVariants: [{ condition: 'globalVars.x', value: 'Plug in, Satchel42?' }] }));
  assertHas(warnings(l), 'appears in the jackConfirmVariants field');
  assert.deepEqual(errors(l), []);
});

test('unauthorizedTextVariants: an answer in a { condition, text } variant warns', { skip }, () => {
  const l = issues(scene({ id: 'esd', unauthorizedTextVariants: [{ condition: 'globalVars.x', text: 'say Satchel42 first' }] }));
  assertHas(warnings(l), 'appears in the unauthorizedTextVariants field');
  assertHas(warnings(l), 'unauthorizedTextVariants[0]/text');
  assert.deepEqual(errors(l), []);
});

test('unauthorizedTextVariants inside minigameData (where the engine reads it): a combination in prose warns', { skip }, () => {
  const lock = { id: 'pwbox', locked: true, lockType: 'combination', requires: [12, 30, 5] };
  const l = issues(scene({ id: 'esd', minigameData: { unauthorizedTextVariants: [{ condition: 'globalVars.x', text: 'dial 12-30-5 first' }] } }, { lock }));
  assertHas(warnings(l), 'minigameData/unauthorizedTextVariants[0]/text');
});

test('narrative walk: a name inside contents whose locked is any truthy value is skipped', { skip }, () => {
  const l = issues(scene({ id: 'crate', type: 'safe', locked: 'yes', lockType: 'key', contents: [{ id: 'tag', name: 'Tag Satchel42' }] }));
  assertNot(warnings(l), 'Tag Satchel42');
});

// ── where the variant sits ─────────────────────────────────────────────────────────────────────

const box = (extra) => ({ id: 'crate', type: 'safe', contents: [tv('the code is Satchel42')], ...extra });

test('a variant on an item in an unlocked container still warns', { skip }, () => {
  const l = issues(scene(box({})));
  assertHas(warnings(l), 'appears in the textVariants field');
});

test('a variant on a startItemsInInventory item warns', { skip }, () => {
  const sc = scene({ id: 'plain' });
  sc.startItemsInInventory = [{ type: 'note', name: 'Note', textVariants: [{ condition: 'globalVars.x', value: 'it is Satchel42' }] }];
  assertHas(warnings(issues(sc)), 'startItemsInInventory[0]/textVariants[0]/value');
});

test('a variant inside a locked container contents is skipped (the server strips it)', { skip }, () => {
  assertNot(issues(scene(box({ locked: true, lockType: 'key', requires: 'k1' }))), 'appears in the textVariants field');
});

test('a combination answer held as an array matches inside a variant', { skip }, () => {
  const lock = { id: 'pwbox', locked: true, lockType: 'combination', requires: [12, 30, 5] };
  assertHas(warnings(issues(scene(tv('dial 12-30-5 to open'), { lock }))), 'appears in the textVariants field');
});

// ── contents the server withholds without a locked flag ───────────────────────────────────────

test('revealOnGlobal inside a locked container contents is skipped', { skip }, () => {
  const l = issues(scene({ id: 'safe2', locked: true, lockType: 'key', requires: 'k1',
    contents: [{ id: 'cap', revealOnGlobal: 'planted', text: 'captured: Satchel42' }] }));
  assertNot(l, 'appears in the revealOnGlobal field');
});

test('a variant inside a sign-in PC contents is skipped (lockType login)', { skip }, () => {
  const l = issues(scene({ id: 'pc', lockType: 'login', contents: [tv('note: Satchel42')] }));
  assertNot(l, 'appears in the textVariants field');
});

test('a variant inside a habit USB stick contents is skipped', { skip }, () => {
  const sc = scene({ id: 'stick', type: 'usb', contents: [tv('file: Satchel42')] });
  sc.rooms.r.npcs = [{ id: 'clerk', habits: { usb: {} }, itemsHeld: [{ type: 'usb', id: 'stick' }] }];
  assertNot(issues(sc), 'appears in the textVariants field');
});

test('a variant inside a declared grant item contents is skipped', { skip }, () => {
  const l = issues(scene({ id: 'desk', triggerOnInteract: [{ type: 'give_item',
    item: { type: 'laptop', id: 'lt', contents: [tv('pw Satchel42')] } }] }));
  assertNot(l, 'appears in the textVariants field');
});

test('narrative walk: a name inside a sign-in PC contents is skipped', { skip }, () => {
  const l = issues(scene({ id: 'pc', lockType: 'login', contents: [{ id: 'f', name: 'Satchel42 file' }] }));
  assertNot(l, 'shipped narrative string');
});
