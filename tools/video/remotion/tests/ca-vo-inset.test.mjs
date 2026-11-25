// Voice-over lane (edit.vo) and shot insets: lint rules, .srt merging. Run: npm test (no render, no browser).
import test from 'node:test'; import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)); const root = path.resolve(here, '..');
const base = () => JSON.parse(fs.readFileSync(path.join(here, 'fixtures/ca_theme_demo.json'), 'utf8'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ca-vo-')); let n = 0;
const write = (edit) => { const f = path.join(tmp, `e${n++}.json`); fs.writeFileSync(f, JSON.stringify(edit)); return f; };
function lint(edit) { const r = spawnSync('node', [path.join(root, 'scripts/lint-edit.mjs'), write(edit), '--takes-dir', tmp], { encoding: 'utf8' }); return { code: r.status, out: r.stdout + r.stderr }; }
const shot = (e, id) => e.shots.find((s) => s.id === id);
const cue = (id, start, end, text = 'One short line.', extra = {}) => ({ id, start, end, text, ...extra });
const inset = (over = {}) => ({ src: { x: 360, y: 727, w: 340, h: 156 }, at: { '16:9': { x: 120, y: 160, scale: 2.4 } }, label: 'INFLUENCE', ...over });

test('a clean vo lane and inset lint with only the not-voiced warning', () => {
  const e = base(); e.vo = [cue('v1', 1, 3)]; shot(e, 'research').insets = [inset()];
  const r = lint(e); assert.equal(r.code, 0, r.out); assert.match(r.out, /vo v1: not voiced yet \(caption only\)/);
});
test('vo: window, order, overlap, ids', () => {
  const e = base(); e.vo = [cue('a', -1, 2)]; assert.match(lint(e).out, /outside the trailer/);
  e.vo = [cue('a', 3, 2)]; assert.match(lint(e).out, /start must be < end/);
  e.vo = [cue('a', 1, 4), cue('b', 3.5, 6)]; const r = lint(e); assert.equal(r.code, 1); assert.match(r.out, /vo b: overlaps vo a/);
  e.vo = [cue('a', 1, 2), cue('a', 3, 4)]; assert.match(lint(e).out, /duplicate id/);
  e.vo = [cue('a', 1, 2, 'x', { onCard: 'show' })]; assert.match(lint(e).out, /onCard must be "hide"/);
  e.vo = [cue('a', 1, 99)]; assert.match(lint(e).out, /outside the trailer/);
});
test('vo: text length and words per second warn', () => {
  const e = base(); e.vo = [cue('long', 1, 8, 'word '.repeat(19).trim())]; assert.match(lint(e).out, /over 90/);
  e.vo = [cue('fast', 1, 2, 'one two three four five')]; assert.match(lint(e).out, /5\.0 words\/s \(over 3\.2\)/);
  e.vo = [cue('ok', 1, 3, 'one two three four five six')]; assert.doesNotMatch(lint(e).out, /too fast/);
});
test('vo: talking over a dialogue line by more than 0.3 s warns, a small overlap does not', () => {
  const e = base(); const b = shot(e, 'build'); b.dialogue = true; b.audio = { gain_db: 0, dialogue: true, duck_music: true };
  // build starts at 5 s in the demo timeline: find it, then cover its line (0.2-1.9 s in the shot)
  const tl = spawnSync('node', ['-e', `import('${path.join(root, 'src/timeline.js')}').then(async m=>{const {loadEdit}=await import('${path.join(root, 'scripts/load-edit.mjs')}');const tl=m.buildTimeline(loadEdit('${write(e)}'));console.log(tl.shots.find(s=>s.id==='build').startSec)})`], { encoding: 'utf8' });
  const t0 = Number(tl.stdout.trim()); assert.ok(t0 > 0, tl.stderr);
  e.vo = [cue('over', t0 + 0.2, t0 + 1.9, 'Talking over her.')]; assert.match(lint(e).out, /vo over: overlaps build's dialogue line by 1\.70 s/);
  e.vo = [cue('edge', t0 + 1.7, t0 + 3, 'A slight overlap.')]; assert.doesNotMatch(lint(e).out, /talking over a character/);
});
test('vo: a file that exists is voiced, a missing file warns', () => {
  const wav = path.join(tmp, 'v.wav'); spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=2', wav]);
  const e = base(); e.vo = [cue('a', 1, 3, 'Voiced.', { file: wav })]; let r = lint(e); assert.equal(r.code, 0, r.out); assert.doesNotMatch(r.out, /not voiced/);
  e.vo = [cue('a', 1, 3, 'Voiced.', { file: 'nope.wav' })]; r = lint(e); assert.equal(r.code, 0); assert.match(r.out, /file not found \(nope\.wav\)/);
});
test('insets: src inside the take, scale 1.5-4, inset inside the output, label, timing', () => {
  const t = (mut, re) => { const e = base(); const i = inset(); mut(i); shot(e, 'research').insets = [i]; const r = lint(e); assert.equal(r.code, 1, r.out); assert.match(r.out, re); };
  t((i) => { i.src.x = 1700; }, /not inside the 1920x1080 take frame/);
  t((i) => { i.src.h = 0; }, /src needs numeric/);
  t((i) => { i.at['16:9'].scale = 1.2; }, /scale must be 1\.5-4/);
  t((i) => { i.at['16:9'].scale = 4.5; }, /scale must be 1\.5-4/);
  t((i) => { i.at['16:9'].x = 1500; }, /not inside the 1920x1080 output frame/);
  t((i) => { i.at['9:16'] = { x: 0, y: 0, scale: 4 }; }, /not inside the 1080x1920 output frame/);
  t((i) => { i.at['3:2'] = { x: 0, y: 0, scale: 2 }; }, /unknown aspect/);
  t((i) => { i.label = 'lower'; }, /label must be an upper-case/);
  t((i) => { i.from = 2; i.to = 1; }, /to must be > from/);
  t((i) => { i.at = {}; }, /at needs an entry/);
  const e = base(); shot(e, 'research').insets = [inset({ at: { '16:9': { x: 120, y: 160, scale: 2.4 }, '9:16': { x: 40, y: 300, scale: 2.8 } } })];
  assert.equal(lint(e).code, 0, lint(e).out); // an aspect with no `at` entry is simply not drawn
  const e2 = base(); shot(e2, 'research').insets = [inset({ at: { '16:9': { x: 120, y: 4, scale: 2.4 } } })]; assert.match(lint(e2).out, /no room for the label tab/);
});
test('make-srt merges vo cues with dialogue cues in time order, no speaker prefix on vo', () => {
  const e = base(); e.mission = 'ca12'; const b = shot(e, 'build'); b.dialogue = true; b.audio = { gain_db: 0, dialogue: true, duck_music: true };
  e.vo = [cue('late', 14, 15.5, 'Last narrator line.'), cue('early', 0.5, 1.5, 'First narrator line.')];
  const out = path.join(tmp, 'o.srt');
  const r = spawnSync('node', [path.join(root, 'scripts/make-srt.mjs'), write(e), out, '--takes-dir', tmp], { encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr);
  const blocks = fs.readFileSync(out, 'utf8').trim().split('\n\n').map((x) => x.split('\n'));
  assert.equal(blocks.length, 3);
  assert.deepEqual(blocks.map((b) => b[2]), ['First narrator line.', "Camila: Right, that's me back, thanks.", 'Last narrator line.']);
  assert.equal(blocks[0][1], '00:00:00,500 --> 00:00:01,500');
  const times = blocks.map((b) => b[1].slice(0, 12)); assert.deepEqual([...times].sort(), times);
});

test('burned_line, vo_skin and caption_top lint', () => {
  const e = base(); e.vo_skin = 'cyber'; assert.match(lint(e).out, /vo_skin must be "safetynet"/);
  const f = base(); f.caption_top = { '9:16': 0.1 }; assert.match(lint(f).out, /caption_top must be/);
  const g = base(); g.vo_skin = 'safetynet'; g.caption_top = { '9:16': 0.6 }; assert.doesNotMatch(lint(g).out, /vo_skin|caption_top/);
});
