// Letterbox framing (zoom < 1): the crop maths, and the lint's floor (the source is never shrunk; never in 16:9).
import test from 'node:test'; import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { visibleRect } from '../src/timeline.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test('9:16 at zoom 0.5625 is scale 1: 1080 source px wide, centred vertically', () => {
  const r = visibleRect({ cx: 0.3, cy: 0.2, zoom: 0.5625 }, 1080, 1920);
  near(r.scale, 1); near(r.x1 - r.x0, 0.5625); near(r.cx, 0.3); near(r.cy, 0.5); near(r.y0, -(1920 - 1080) / 2 / 1080);
});
test('9:16 letterbox still clamps the window to the source on the cropped axis', () => {
  const r = visibleRect({ cx: 0, cy: 0.5, zoom: 0.5625 }, 1080, 1920); near(r.x0, 0);
});
test('zoom >= 1 is unchanged', () => {
  const r = visibleRect({ cx: 0.1, cy: 0.9, zoom: 2 }, 1920, 1080); near(r.x0, 0); near(r.y1, 1); near(r.cx, 0.25);
  const q = visibleRect({ cx: 0.5, cy: 0.5, zoom: 1 }, 1080, 1080); near(q.x0, 0.21875); near(q.y0, 0); near(q.y1, 1);
});

const edit = path.join(root, '../edits/m01_trailer60.json');
function lintWith(aspect, zoom) {
  const e = JSON.parse(fs.readFileSync(edit, 'utf8')); const s = e.shots.find((x) => x.framing); s.framing[aspect] = { cx: 0.5, cy: 0.5, zoom };
  delete s.pushin;
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'lb-')), 'e.json'); fs.writeFileSync(f, JSON.stringify(e));
  const r = spawnSync('node', [path.join(root, 'scripts/lint-edit.mjs'), f, '--takes-dir', '/nonexistent'], { encoding: 'utf8' });
  return r.stdout + r.stderr;
}
test('lint allows a 9:16 letterbox down to scale 1', () => assert.doesNotMatch(lintWith('9:16', 0.5625), /shrinks the source/));
test('lint refuses a 9:16 letterbox below scale 1', () => assert.match(lintWith('9:16', 0.5), /9:16: zoom 0\.5 shrinks the source/));
test('lint refuses any zoom < 1 in 1:1 and 16:9', () => {
  assert.match(lintWith('1:1', 0.9), /1:1: zoom 0\.9 shrinks/); assert.match(lintWith('16:9', 0.9), /16:9: zoom 0\.9 shrinks/);
});
