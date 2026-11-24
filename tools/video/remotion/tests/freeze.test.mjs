// Still-frame gameplay shots (freeze / freezeAt): the timeline helper, the composition wiring and the lint's frame checks.
// Run: npm test   (from tools/video/remotion; no render, no browser)
import test from 'node:test'; import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { freezeSec, buildTimeline } from '../src/timeline.js';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

const g = (extra = {}) => ({ id: 'g', type: 'gameplay', duration: 0.4, source: { file: 't.mkv', in: 2.6, out: 3.0 }, audio: { gain_db: -120 }, ...extra });

test('a shot without freeze is moving', () => { assert.equal(freezeSec(g(), 30), null); });
test('freeze: true holds the frame at source.in', () => { near(freezeSec(g({ freeze: true }), 30), 2.6); });
test('freezeAt holds that source second, snapped to the frame grid', () => {
  near(freezeSec(g({ freezeAt: 2.71 }), 30), 81 / 30);
  near(freezeSec(g({ freeze: true, freezeAt: 2.8 }), 30), 2.8);
});
test('freeze: false or no source means moving', () => {
  assert.equal(freezeSec(g({ freeze: false, freezeAt: 2.8 }), 30), null);
  assert.equal(freezeSec({ type: 'card', freeze: true }, 30), null);
  assert.equal(freezeSec(g({ freezeAt: 'x' }), 30), null);
});
test('the timeline keeps freeze fields on its shots', () => {
  const tl = buildTimeline({ fps: 30, shots: [g({ freezeAt: 2.8 })] });
  assert.equal(tl.shots[0].freezeAt, 2.8); near(freezeSec(tl.shots[0], 30), 2.8);
});
test('the Gameplay component holds the video with <Freeze frame={0}> at the frozen startFrom', () => {
  const src = fs.readFileSync(path.join(root, 'src/components/Gameplay.tsx'), 'utf8');
  assert.match(src, /import \{[^}]*\bFreeze\b[^}]*\} from 'remotion'/);
  assert.match(src, /freezeSec\(shot, fps\)/);
  assert.match(src, /startFrom = Math\.round\(\(fz \?\? inSec\) \* fps\)/);
  assert.match(src, /<Freeze frame=\{0\}>\{video\}<\/Freeze>/);
});

// lint: m01's edit with its first gameplay shot pointed at a 1.9 s fixture take (the tracked Kali slate placeholder)
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'freeze-lint-'));
const takes = path.join(tmp, 'takes'); fs.mkdirSync(takes);
fs.copyFileSync(path.join(root, '../assets/placeholders/hack_them_back_kali_slate.mp4'), path.join(takes, 't10_hax_hook.trimmed.mkv'));
let n = 0;
function lintWith(patch) {
  const e = JSON.parse(fs.readFileSync(path.join(root, '../edits/m01_trailer60.json'), 'utf8'));
  const s = e.shots.find((x) => x.id === 'hax_hook'); s.source = { file: 't10_hax_hook.trimmed.mkv', in: 0, out: 3.0 }; patch(s, e);
  const f = path.join(tmp, `e${n++}.json`); fs.writeFileSync(f, JSON.stringify(e));
  const r = spawnSync('node', [path.join(root, 'scripts/lint-edit.mjs'), f, '--takes-dir', takes], { encoding: 'utf8' });
  return r.stdout + r.stderr;
}
test('lint passes a frozen frame inside the take', () => {
  const out = lintWith((s) => { s.freezeAt = 1.0; });
  assert.doesNotMatch(out, /hax_hook: (frozen frame|freeze)/);
});
test('lint passes freeze: true at source.in', () => { assert.doesNotMatch(lintWith((s) => { s.freeze = true; }), /hax_hook: (frozen frame|freeze)/); });
test('lint refuses a frozen frame past the last frame of the take', () => {
  assert.match(lintWith((s) => { s.freezeAt = 2.5; }), /ERROR hax_hook: frozen frame 2\.500 s is past the last frame of t10_hax_hook\.trimmed\.mkv \(1\.900 s\)/);
  assert.match(lintWith((s) => { s.freezeAt = 1.9; }), /ERROR hax_hook: frozen frame 1\.900 s is past the last frame/);
});
test('lint refuses a frozen frame before the take starts', () => {
  assert.match(lintWith((s) => { s.freezeAt = -0.5; }), /ERROR hax_hook: frozen frame -0\.500 s is before the start/);
});
test('lint refuses a bad freeze or freezeAt value', () => {
  assert.match(lintWith((s) => { s.freeze = 'yes'; }), /ERROR hax_hook: freeze must be true or false/);
  assert.match(lintWith((s) => { s.freezeAt = '1.0'; }), /ERROR hax_hook: freezeAt must be a number/);
  assert.match(lintWith((s) => { s.freeze = false; s.freezeAt = 1.0; }), /ERROR hax_hook: freezeAt with freeze: false/);
});
test('lint warns when the frozen frame sits outside source.in-out', () => {
  assert.match(lintWith((s) => { s.source.in = 0.2; s.source.out = 3.2; s.freezeAt = 0.1; }), /WARN  hax_hook: frozen frame 0\.100 s is outside source\.in-out/);
});
test('lint warns that freeze on a card is ignored', () => {
  assert.match(lintWith((s, e) => { const c = e.shots.find((x) => x.type === 'card'); c.freeze = true; }), /WARN  .*freeze\/freezeAt is for gameplay shots/);
});
