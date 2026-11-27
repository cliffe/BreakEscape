// Chapter-card reveal timing: reveal.at (per-line seconds) overrides reveal.start/each; lint rules for at.
// Run: node --test tests/ca-chapter-reveal.test.mjs
import test from 'node:test'; import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chapterRevealFrame } from '../src/timeline.js';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const base = () => JSON.parse(fs.readFileSync(path.join(here, 'fixtures/ca_theme_demo.json'), 'utf8'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ca-reveal-'));
let n = 0;
function lint(edit) {
  const f = path.join(tmp, `e${n++}.json`); fs.writeFileSync(f, JSON.stringify(edit));
  const r = spawnSync('node', [path.join(root, 'scripts/lint-edit.mjs'), f, '--takes-dir', path.join(tmp, 'none')], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout + r.stderr };
}
const chap = (reveal, body = ['One', 'Two', 'Three'], duration = 9) => ({ id: 'chap', type: 'card', style: 'ca', chapter: 'attack', duration, join: { type: 'seam' }, text: ['A heading'], body, ...(reveal ? { reveal } : {}), spoiler: { reviewed: true, shows_code: false, shows_identity: false, shows_ending: false, keypad_partial: null, note: 'reveal test' } });
const withChap = (c) => { const e = base(); e.shots.splice(2, 0, c); return e; };

test('without at, uniform start/each timing is unchanged', () => {
  const rv = { start: 1.2, each: 2 };
  assert.deepEqual([0, 1, 2].map((i) => chapterRevealFrame(rv, i, 3)), [36, 96, 156]);
  assert.deepEqual([0, 1, 2].map((i) => chapterRevealFrame({}, i, 3)), [36, 96, 156]); // defaults
});
test('without any reveal, the default pacing is unchanged', () => {
  assert.deepEqual([0, 1].map((i) => chapterRevealFrame(undefined, i, 2)), [14, 14 + 21]);
  assert.deepEqual([0, 1, 2].map((i) => chapterRevealFrame(null, i, 3)), [14, 14 + 17, 14 + 34]);
});
test('reveal.at sets each line time in seconds and ignores start/each', () => {
  const rv = { at: [0.2, 5.2, 6.5], start: 9, each: 9 };
  assert.deepEqual([0, 1, 2].map((i) => chapterRevealFrame(rv, i, 3)), [6, 156, 195]);
});
test('lint: a valid reveal.at passes; no reveal and start/each still pass', () => {
  { const r = lint(withChap(chap({ at: [0.2, 5.2, 6.5] }))); assert.equal(r.code, 0, r.out); }
  { const r = lint(withChap(chap(null))); assert.equal(r.code, 0, r.out); }
  { const r = lint(withChap(chap({ start: 1.2, each: 2 }))); assert.equal(r.code, 0, r.out); }
});
test('lint: descending, wrong-length, negative, past-the-end and non-array at are errors', () => {
  const bad = (at, re) => { const r = lint(withChap(chap({ at }))); assert.equal(r.code, 1, r.out); assert.match(r.out, re); };
  bad([0.2, 6.5, 5.2], /must ascend/);
  bad([0.2, 5.2], /2 entries but the card has 3/);
  bad([0.2, 5.2, 6.5, 7], /4 entries but the card has 3/);
  bad([-1, 5.2, 6.5], /must not be negative/);
  bad([0.2, 5.2, 9], /at or past the card's end/);
  bad('1,2,3', /must be an array of numbers/);
});
