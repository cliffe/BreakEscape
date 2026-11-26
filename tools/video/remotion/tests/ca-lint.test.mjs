// Cyber Aware theme tests: lint rules for theme "ca", timeline join handling, Chromium lookup.
// Run: npm test   (from tools/video/remotion; no render, no browser)
import test from 'node:test'; import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTimeline, effectAt, isCardLike, JOIN_FRAMES } from '../src/timeline.js';
import { loadEdit } from '../scripts/load-edit.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const fixture = path.join(here, 'fixtures/ca_theme_demo.json');
const base = () => JSON.parse(fs.readFileSync(fixture, 'utf8'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ca-lint-'));
let n = 0;
/** Lints an edit object; returns { code, out }. Takes are not needed (a missing take is only a warning). */
function lint(edit, extra = []) {
  const f = path.join(tmp, `e${n++}.json`); fs.writeFileSync(f, JSON.stringify(edit));
  const r = spawnSync('node', [path.join(root, 'scripts/lint-edit.mjs'), f, '--takes-dir', path.join(tmp, 'none'), ...extra], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout + r.stderr };
}
const shot = (e, id) => e.shots.find((s) => s.id === id);

test('the demo edit lints clean', () => { const r = lint(base()); assert.equal(r.code, 0, r.out); assert.match(r.out, /0 error/); });
test('a CA edit must open with ca-open', () => {
  const e = base(); e.shots.splice(1, 1); // drop the ca-open
  const r = lint(e); assert.equal(r.code, 1); assert.match(r.out, /exactly one ca_open/);
});
test('ca_open may follow one short cold-open shot but not two', () => {
  const e = base(); e.shots.splice(1, 0, structuredClone(shot(e, 'research'))); e.shots[1].id = 'extra'; e.shots[1].join = { type: 'cut' };
  const r = lint(e); assert.equal(r.code, 1); assert.match(r.out, /ca_open must be the first shot, or the second/);
});
test('a CA edit must close with ca-close', () => {
  const e = base(); e.shots.pop();
  const r = lint(e); assert.equal(r.code, 1); assert.match(r.out, /exactly one ca_close/);
  const e2 = base(); e2.shots.push(structuredClone(shot(e2, 'tool'))); e2.shots[e2.shots.length - 1].id = 'after';
  const r2 = lint(e2); assert.equal(r2.code, 1); assert.match(r2.out, /ca_close must be the last shot/);
});
test('SAFETYNET presets are rejected in a CA edit', () => {
  for (const preset of ['safetynet-open', 'hacktivity-close']) {
    const e = base(); e.shots.splice(3, 0, { preset, id: 'sn' });
    const r = lint(e); assert.equal(r.code, 1, preset); assert.match(r.out, /not a Cyber Aware preset/);
  }
});
test('glitch and blur joins are rejected in a CA edit', () => {
  for (const type of ['glitch', 'blur']) {
    const e = base(); shot(e, 'spot').join = { type };
    const r = lint(e); assert.equal(r.code, 1, type); assert.match(r.out, new RegExp(`join '${type}' is not allowed in a CA edit`));
  }
  const e = base(); e.effects = { cardJoin: 'glitch' };
  assert.equal(lint(e).code, 1);
});
test('hit glitch FX, title and cta shots are rejected in a CA edit', () => {
  const e = base(); shot(e, 'research').hit = { frames: 3 };
  assert.match(lint(e).out, /hit \(glitch FX\) is not allowed/);
  const e2 = base(); e2.shots.push({ id: 'cta', type: 'cta', duration: 1, spoiler: shot(e2, 'tool').spoiler });
  assert.match(lint(e2).out, /cta is a SAFETYNET shot type/);
});
test('at most one flip', () => {
  const e = base(); shot(e, 'research').join = { type: 'flip' }; // a second flip (the first is on "defend")
  const r = lint(e); assert.equal(r.code, 1); assert.match(r.out, /at most one flip/);
});
test('flip is gameplay-to-gameplay only; seam between two gameplay shots is rejected', () => {
  const e = base(); shot(e, 'defend').join = { type: 'seam' };
  assert.match(lint(e).out, /seam between two gameplay shots/);
  const e2 = base(); shot(e2, 'tool').join = { type: 'flip' };
  assert.match(lint(e2).out, /flip is a gameplay-to-gameplay join/);
});
test('join frame ranges: seam 6-8, flip 12-16', () => {
  assert.deepEqual([JOIN_FRAMES.seam.min, JOIN_FRAMES.seam.max, JOIN_FRAMES.flip.min, JOIN_FRAMES.flip.max], [6, 8, 12, 16]);
  const e = base(); shot(e, 'defend').join = { type: 'flip', frames: 8 };
  assert.match(lint(e).out, /flip frames must be 12-16/);
  const e2 = base(); shot(e2, 'tool').join = { type: 'seam', frames: 12 };
  assert.match(lint(e2).out, /seam frames must be 6-8/);
});
test('seam and flip are for CA edits only', () => {
  const e = base(); delete e.theme;
  const r = lint(e); assert.equal(r.code, 1); assert.match(r.out, /for Cyber Aware edits only/);
});
test('seat values, chips and masks are validated', () => {
  const e = base(); shot(e, 'research').seat = { seat: 'middle' };
  assert.match(lint(e).out, /seat must be attack\|defend\|full/);
  const e2 = base(); shot(e2, 'research').seat.chip = 'lower case';
  assert.match(lint(e2).out, /seat\.chip must be an upper-case/);
  const e3 = base(); shot(e3, 'build').masks = [{ x: 1, y: 1, w: 0, h: 5 }];
  assert.match(lint(e3).out, /masks\[0\] needs numeric/);
  const e4 = base(); shot(e4, 'build').masks = [{ x: 1, y: 1, w: 5, h: 5, from: 2, to: 1 }];
  assert.match(lint(e4).out, /masks\[0\]: to must be > from/);
});
test('a card in a CA edit needs style ca and banned words are rejected', () => {
  const e = base(); delete shot(e, 'spot').style;
  assert.match(lint(e).out, /needs "style": "ca"/);
  const e2 = base(); shot(e2, 'spot').body = ['A robust habit'];
  const r = lint(e2); assert.equal(r.code, 1); assert.match(r.out, /banned word/);
  const e3 = base(); shot(e3, 'spot').body = ['Check the colour of the badge'];
  assert.equal(lint(e3).code, 0);
  const e4 = base(); shot(e4, 'spot').body = ['Check the color of the badge'];
  assert.match(lint(e4).out, /US spelling/);
});
test('a first-shot seam is rejected (nothing to wipe away)', () => {
  const e = base(); shot(e, 'hook').join = { type: 'seam' };
  assert.match(lint(e).out, /seam needs an outgoing shot/);
});
test('SAFETYNET edits are unchanged: glitch joins still lint, seam is rejected there', () => {
  for (const f of ['m01_trailer60.json', 'm02_trailer60.json']) {
    const r = spawnSync('node', [path.join(root, 'scripts/lint-edit.mjs'), path.join(root, '../edits', f), '--takes-dir', path.join(tmp, 'none')], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout);
  }
});
const chap = (id, chapter, body = ['One line', 'Another line']) => ({ id, type: 'card', style: 'ca', chapter, duration: 3, join: { type: 'seam' }, text: ['A heading'], body, spoiler: { reviewed: true, shows_code: false, shows_identity: false, shows_ending: false, keypad_partial: null, note: 'chapter test' } });
test('chapter cards: one attack then one defend lints clean', () => {
  const e = base(); e.shots.splice(2, 0, chap('red', 'attack')); e.shots.splice(shot(e, 'spot') ? e.shots.indexOf(shot(e, 'spot')) : 5, 0, chap('blue', 'defend'));
  const r = lint(e); assert.equal(r.code, 0, r.out);
});
test('chapter cards: a second attack or defend chapter, or defend before attack, is an error', () => {
  const e = base(); e.shots.splice(2, 0, chap('red', 'attack'), chap('red2', 'attack'));
  assert.match(lint(e).out, /at most one attack chapter/);
  const e2 = base(); e2.shots.splice(2, 0, chap('blue', 'defend'), chap('blue2', 'defend'));
  assert.match(lint(e2).out, /at most one defend chapter/);
  const e3 = base(); e3.shots.splice(2, 0, chap('blue', 'defend'), chap('red', 'attack'));
  assert.match(lint(e3).out, /attack chapter card must come before/);
});
test('chapter cards: bullets, heading, kind and banned words are checked', () => {
  const e = base(); e.shots.splice(2, 0, chap('red', 'attack', ['a', 'b', 'c', 'd']));
  assert.match(lint(e).out, /at most three bullet lines/);
  const e2 = base(); e2.shots.splice(2, 0, chap('red', 'sideways'));
  assert.match(lint(e2).out, /chapter must be attack\|defend/);
  const e3 = base(); e3.shots.splice(2, 0, chap('red', 'attack', ['A crucial step', 'Fine'])); 
  const r3 = lint(e3); assert.equal(r3.code, 1); assert.match(r3.out, /banned word/);
  const e4 = base(); e4.shots.splice(2, 0, chap('red', 'attack')); e4.shots[2].text = ['One', 'Two'];
  assert.match(lint(e4).out, /exactly one text/);
  const e5 = base(); e5.shots.splice(2, 0, chap('red', 'attack')); e5.shots[2].tab = 'X';
  assert.match(lint(e5).out, /sets its own tab/);
});
test('the round-2 ca12 edit lints with no errors and has both chapter cards in order', () => {
  const f = path.join(root, '../edits/ca12_trailer_r2.json');
  const r = spawnSync('node', [path.join(root, 'scripts/lint-edit.mjs'), f, '--takes-dir', path.join(tmp, 'none')], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout);
  const e = loadEdit(f); const i = (c) => e.shots.findIndex((s) => s.chapter === c);
  assert.ok(i('attack') > 0 && i('defend') > i('attack'));
});
test('timeline: seam and flip are dissolve-like (whole window after the boundary); ca card join defaults to seam', () => {
  const tl = buildTimeline(loadEdit(fixture));
  const j = tl.joins.find((x) => x && x.type === 'flip');
  assert.equal(j.pre, 0); assert.equal(j.post, j.frames); assert.ok(j.frames >= 12 && j.frames <= 16);
  const s = tl.joins.find((x) => x && x.type === 'seam'); assert.equal(s.pre, 0);
  const fx = effectAt(tl, j.boundary + 2); assert.equal(fx.type, 'flip'); assert.equal(fx.k, 2);
  const e = base(); e.shots[2].join = { type: 'card' }; e.effects = { cardJoin: 'dissolve' };
  assert.equal(buildTimeline(e).shots[2].joinType, 'seam'); // cardJoin never repoints a CA join
  for (const s2 of ['ca_open', 'ca_close']) assert.ok(isCardLike({ type: s2 }));
});
test('presets resolve and keep their types', () => {
  const e = loadEdit(fixture);
  assert.equal(e.shots[1].type, 'ca_open'); assert.equal(e.shots[1].ca.title, 'Visitors and tailgating');
  assert.equal(e.shots.at(-1).type, 'ca_close');
});
test('findChromium order: BE_CHROMIUM first, then the Playwright cache, then chromium-browser', async () => {
  const fakeHome = fs.mkdtempSync(path.join(tmp, 'home-'));
  const mk = (rel) => { const p = path.join(fakeHome, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, ''); return p; };
  const old1 = mk('.cache/ms-playwright/chromium-1200/chrome-linux/chrome'), new1 = mk('.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'); mk('.cache/ms-playwright/chromium_headless_shell-1300/chrome-linux/headless_shell');
  const code = `import('${path.join(root, 'scripts/bundle-lib.mjs')}').then((m) => console.log(m.browserExecutable))`;
  const run = (env) => spawnSync('node', ['-e', code], { encoding: 'utf8', cwd: root, env: { PATH: process.env.PATH, HOME: fakeHome, ...env } }).stdout.trim();
  const own = mk('own/chrome');
  assert.equal(run({ BE_CHROMIUM: own }), own);
  const r = run({});
  if (!fs.existsSync('/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')) assert.equal(r, new1); // newest cache build, never the headless shell
  assert.notEqual(r, old1);
});

// Product trailer additions (docs/video/scripts/ca_product_trailer_script.md)
test('kind "product" has no ca_open (and may not have one); still needs the ca_close', () => {
  const e = base(); e.kind = 'product'; e.shots.splice(1, 1); // drop the ca-open
  e.shots[1].join = { type: 'cut' };
  const r = lint(e); assert.equal(r.code, 0, r.out); assert.doesNotMatch(r.out, /exactly one ca_open/);
  const e2 = base(); e2.kind = 'product'; // ca-open kept: not allowed here
  const r2 = lint(e2); assert.equal(r2.code, 1); assert.match(r2.out, /a product edit has no ca_open shot/);
  const e3 = base(); e3.kind = 'product'; e3.shots.splice(1, 1); e3.shots.pop();
  assert.match(lint(e3).out, /exactly one ca_close/);
  const e4 = base(); e4.shots.splice(1, 1); // a normal CA edit still needs its ca_open
  assert.match(lint(e4).out, /exactly one ca_open/);
});
test('seat.chip allows up to 28 characters, not 29', () => {
  const e = base(); shot(e, 'research').seat.chip = 'THE ASSISTANT PASSES IT ON'; assert.doesNotMatch(lint(e).out, /seat\.chip must be/);
  const e2 = base(); shot(e2, 'research').seat.chip = 'A'.repeat(29); assert.match(lint(e2).out, /at most 28 characters/);
});
test('title_plate: text required, window inside the shot, no Break Escape', () => {
  const e = base(); shot(e, 'research').title_plate = { text: 'Hacktivity Cyber Aware', sub: 'Security awareness training you can play' };
  const r = lint(e); assert.equal(r.code, 0, r.out);
  const e2 = base(); shot(e2, 'research').title_plate = { text: '  ' }; assert.match(lint(e2).out, /title_plate\.text must be a non-empty string/);
  const e3 = base(); shot(e3, 'research').title_plate = { text: 'X', from: 0, to: 99 }; assert.match(lint(e3).out, /title_plate from\/to must satisfy/);
  const e4 = base(); shot(e4, 'research').title_plate = { text: 'Break Escape' }; assert.match(lint(e4).out, /must not name Break Escape/);
});
