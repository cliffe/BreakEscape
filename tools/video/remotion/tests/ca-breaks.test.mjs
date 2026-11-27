// Forced line breaks: chapter bullets ("\n" in body[], pre-line) and cast-line captions (shot.caption_breaks). Lint rules and the line counter.
// Run: node --test tests/ca-breaks.test.mjs
import test from 'node:test'; import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { captionLineCount } from '../src/timeline.js';
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '..');
const base = () => JSON.parse(fs.readFileSync(path.join(here, 'fixtures/ca_theme_demo.json'), 'utf8'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ca-breaks-')); let n = 0;
function lint(edit) {
  const f = path.join(tmp, `e${n++}.json`); fs.writeFileSync(f, JSON.stringify(edit));
  const r = spawnSync('node', [path.join(root, 'scripts/lint-edit.mjs'), f, '--takes-dir', path.join(tmp, 'none')], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout + r.stderr };
}
const chap = (body) => ({ id: 'chap', type: 'card', style: 'ca', chapter: 'attack', duration: 9, join: { type: 'seam' }, text: ['A heading'], body, spoiler: { reviewed: true, shows_code: false, shows_identity: false, shows_ending: false, keypad_partial: null, note: 'breaks test' } });
const withChap = (body) => { const e = base(); e.shots.splice(2, 0, chap(body)); return e; };
const build = (e) => e.shots.find((s) => s.id === 'build');

test('chapter bullet: forced-break lines of 28 or fewer characters lint clean', () => {
  const r = lint(withChap(['Harm from people who\nalready have access', 'Plain bullet'])); assert.equal(r.code, 0, r.out);
});
test('chapter bullet: a forced-break line over 28 characters is an error naming the line', () => {
  const r = lint(withChap(['Harm from people who all already\nhave access to the whole building'])); assert.equal(r.code, 1, r.out);
  assert.match(r.out, /body\[0\] line 1 is 32 characters/); assert.match(r.out, /body\[0\] line 2/);
});
test('chapter bullet: an unbroken bullet keeps the legacy 60-character warning, not the 28 limit', () => {
  const ok = 'x'.repeat(50); const r = lint(withChap([ok])); assert.equal(r.code, 0, r.out); assert.doesNotMatch(r.out, /body\[0\]/);
  const long = lint(withChap(['y'.repeat(61)])); assert.equal(long.code, 0); assert.match(long.out, /more than 60 characters/);
});
test('caption_breaks: lines of 28 or fewer pass; the flag is optional and default off', () => {
  const e = base(); assert.equal(build(e).caption_breaks, undefined); assert.equal(lint(e).code, 0);
  build(e).caption_breaks = true; build(e).lines[0].text = "Right, that's me\nthanks, see you soon."; const r = lint(e); assert.equal(r.code, 0, r.out);
});
test('caption_breaks: a line over 28 characters (speaker counted on the first line) is an error', () => {
  const e = base(); build(e).caption_breaks = true;
  build(e).lines[0].text = 'Right, that is me back now\nthanks'; // "Camila: " (8) + 26 = 34
  const r = lint(e); assert.equal(r.code, 1, r.out); assert.match(r.out, /caption line 1 is 34 characters/);
  const f = base(); build(f).lines[0].text = 'Right, that is me back now and a lot more besides\nthanks'; assert.equal(lint(f).code, 0); // flag off: no per-line limit
});
test('caption_breaks must be a boolean', () => {
  const e = base(); build(e).caption_breaks = 'yes'; const r = lint(e); assert.equal(r.code, 1, r.out); assert.match(r.out, /caption_breaks must be true or false/);
});
test('captionLineCount: off wraps as one paragraph, on counts each forced line (box height grows)', () => {
  const wrap = (t) => Math.ceil(t.length / 20);
  assert.equal(captionLineCount('abc\ndef\nghi', false, wrap), 1);
  assert.equal(captionLineCount('abc\ndef\nghi', true, wrap), 3);
  assert.equal(captionLineCount('abc\n\nghi', true, wrap), 3); // an empty line still takes a row
  assert.equal(captionLineCount('a'.repeat(30) + '\nb', true, wrap), 3); // a long forced line still wraps
  assert.equal(captionLineCount('one line', true, wrap), 1);
});
