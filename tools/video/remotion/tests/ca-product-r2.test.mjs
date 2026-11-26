// Product trailer round 2: lint rules for seat.chips, chip_px, caption_skin, title_plate.style, ca.timing; chip and close timing helpers.
// Run: npm test   (no render, no browser)
import test from 'node:test'; import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chipTextAt, closeFrames, stackedTitleLines } from '../src/timeline.js';
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '..');
const base = () => JSON.parse(fs.readFileSync(path.join(here, 'fixtures/ca_theme_demo.json'), 'utf8'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ca-r2-')); let n = 0;
function lint(edit) {
  const f = path.join(tmp, `e${n++}.json`); fs.writeFileSync(f, JSON.stringify(edit));
  const r = spawnSync('node', [path.join(root, 'scripts/lint-edit.mjs'), f, '--takes-dir', path.join(tmp, 'none')], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout + r.stderr };
}
const shot = (e, id) => e.shots.find((s) => s.id === id);

test('seat.chips: valid windows and chip_px lint clean', () => {
  const e = base(); shot(e, 'research').seat = { seat: 'full', chips: [{ from: 0, to: 1, text: 'ABOUT 15 MIN / EPISODE' }, { from: 1, to: 2, text: 'ORGANISERS' }], chip_px: 32 };
  const r = lint(e); assert.equal(r.code, 0, r.out);
});
test('seat.chips: from >= to, outside the shot, long or empty text, not an array', () => {
  const bad = (chips) => { const e = base(); shot(e, 'research').seat = { seat: 'full', chips }; return lint(e); };
  for (const chips of [[{ from: 1, to: 1, text: 'A' }], [{ from: 1, to: 0.5, text: 'A' }], [{ from: 0, to: 3, text: 'A' }], [{ from: -1, to: 1, text: 'A' }]]) assert.match(bad(chips).out, /seat\.chips\[0\] needs numeric from < to inside the shot/);
  assert.match(bad([{ from: 0, to: 1, text: 'A'.repeat(29) }]).out, /at most 28 characters/);
  assert.match(bad([{ from: 0, to: 1, text: '' }]).out, /non-empty string/);
  assert.match(bad('nope').out, /seat\.chips must be an array/);
  assert.equal(bad([{ from: 0, to: 1, text: 'A' }, { from: 0, to: 9, text: 'B' }]).code, 1);
});
test('seat.chip_px must be a sane number', () => {
  const e = base(); shot(e, 'research').seat = { seat: 'full', chip_px: 32 }; assert.equal(lint(e).code, 0);
  for (const v of ['32', 0, 500]) { const e2 = base(); shot(e2, 'research').seat = { seat: 'full', chip_px: v }; assert.match(lint(e2).out, /seat\.chip_px must be a number/); }
});
test('caption_skin accepts "pixel" only', () => {
  const e = base(); e.caption_skin = 'pixel'; assert.equal(lint(e).code, 0, lint(e).out);
  const e2 = base(); e2.caption_skin = 'comic'; assert.match(lint(e2).out, /caption_skin must be "pixel"/);
});
test('title_plate.style accepts card and tag only', () => {
  for (const style of ['card', 'tag']) { const e = base(); shot(e, 'research').title_plate = { text: 'Hacktivity Cyber Aware', style }; assert.equal(lint(e).code, 0, style); }
  const e2 = base(); shot(e2, 'research').title_plate = { text: 'X', style: 'banner' }; assert.match(lint(e2).out, /title_plate\.style must be card\|tag/);
});
test('ca.timing: valid, falling, non-number, past the end', () => {
  const ok = { slide_end: 0.2, shrink_end: 0.47, text: 0.47, url: 1.2, tag: 1.6 };
  const withT = (t) => { const e = base(); shot(e, 'close').ca.timing = t; return lint(e); };
  assert.equal(withT(ok).code, 0, withT(ok).out);
  assert.match(withT({ ...ok, url: 0.3 }).out, /ca\.timing must not fall/);
  assert.match(withT({ ...ok, tag: 'x' }).out, /ca\.timing needs positive numbers/);
  assert.match(withT({ ...ok, tag: 99 }).out, /past the end of the close/);
});
test('hit stays banned in a CA edit', () => { const e = base(); shot(e, 'research').hit = { at: 1 }; assert.match(lint(e).out, /hit \(glitch FX\) is not allowed in a CA edit/); });

test('chipTextAt: window by shot-local seconds, none outside, plain chip unchanged', () => {
  const seat = { seat: 'full', chips: [{ from: 0.3, to: 1.8, text: 'A' }, { from: 1.8, to: 2.4, text: 'B' }] };
  assert.equal(chipTextAt(seat, 0.1), undefined); assert.equal(chipTextAt(seat, 0.3), 'A'); assert.equal(chipTextAt(seat, 1.79), 'A');
  assert.equal(chipTextAt(seat, 1.8), 'B'); assert.equal(chipTextAt(seat, 2.4), undefined);
  assert.equal(chipTextAt({ seat: 'attack', chip: 'PLAIN' }, 5), 'PLAIN'); assert.equal(chipTextAt({ seat: 'full' }, 0), undefined);
});
test('closeFrames: default is the 90-frame schedule; timing is in seconds at the edit fps', () => {
  assert.deepEqual(closeFrames(undefined, 90, 30), { slideEnd: 24, flashEnd: 28, shrinkStart: 30, shrinkLen: 22, text: 52, url: 56, tag: 64 });
  assert.equal(closeFrames(undefined, 162, 30).text, Math.round(52 * 1.8));
  const t = closeFrames({ slide_end: 0.2, shrink_end: 0.47, text: 0.47, url: 1.2, tag: 1.6 }, 162, 30);
  assert.deepEqual(t, { slideEnd: 6, flashEnd: 8, shrinkStart: 6, shrinkLen: 8, text: 14, url: 36, tag: 48 });
});
test('stackedTitleLines: one line wide, two lines stacked, own breaks win', () => {
  assert.deepEqual(stackedTitleLines('Hacktivity Cyber Aware', false), ['Hacktivity Cyber Aware']);
  assert.deepEqual(stackedTitleLines('Hacktivity Cyber Aware', true), ['Hacktivity', 'Cyber Aware']);
  assert.deepEqual(stackedTitleLines('A\nB C', true), ['A', 'B C']); assert.deepEqual(stackedTitleLines('Solo', true), ['Solo']);
});
