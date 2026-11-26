// Pixel-art scale warning (non-integer output scale on gameplay shots): warnings only, `scaleOk` silences.
// Run: npm test   (from tools/video/remotion; no render, no browser)
import test from 'node:test'; import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scale-lint-')); let n = 0;
function lintWith(patch) {
  const e = JSON.parse(fs.readFileSync(path.join(root, '../edits/m01_trailer60.json'), 'utf8'));
  for (const s of e.shots) { delete s.framing; delete s.pushin; delete s.scaleOk; }
  const s = e.shots.find((x) => x.type === 'gameplay' && x.source?.type !== 'clip'); patch(s, e);
  const f = path.join(tmp, `e${n++}.json`); fs.writeFileSync(f, JSON.stringify(e));
  const r = spawnSync('node', [path.join(root, 'scripts/lint-edit.mjs'), f, '--takes-dir', '/nonexistent'], { encoding: 'utf8' });
  return { out: r.stdout + r.stderr, id: s.id };
}
const scaleWarns = (o) => o.out.split('\n').filter((l) => /WARN/.test(l) && /scale|animated zoom/.test(l) && l.includes(o.id + ':'));
test('integer scales pass in every aspect', () => {
  const o = lintWith((s) => { s.framing = { '16:9': { zoom: 2 }, '9:16': { zoom: 1.125 }, '1:1': { zoom: 3 } }; });
  assert.deepEqual(scaleWarns(o), []);
});
test('zoom 0.78 warns with integer-scale suggestions', () => {
  const o = lintWith((s) => { s.framing = { '9:16': { zoom: 0.78 } }; });
  assert.match(scaleWarns(o).join('\n'), /non-integer pixel scale s=1\.3867 \(9:16, zoom 0\.78\); use zoom 0\.5625, 1\.125/);
});
test('16:9 zoom 1.5 gives the half-integer warning', () => {
  const o = lintWith((s) => { s.framing = { '16:9': { zoom: 1.5 } }; });
  assert.match(scaleWarns(o).join('\n'), /half-integer scale s=1\.5: OK only for map-only shots with no DOM text and an even source origin/);
});
test('a pushin warns that the zoom animates through non-integer scales', () => {
  const o = lintWith((s) => { s.pushin = { from_zoom: 1, to_zoom: 2 }; });
  assert.match(scaleWarns(o).join('\n'), /animated zoom passes through non-integer scales/);
});
test('scaleOk silences the warnings', () => {
  const o = lintWith((s) => { s.framing = { '9:16': { zoom: 0.78 } }; s.pushin = { from_zoom: 1, to_zoom: 2 }; s.scaleOk = true; });
  assert.deepEqual(scaleWarns(o), []);
});
test('the warnings are never errors', () => {
  const o = lintWith((s) => { s.framing = { '9:16': { zoom: 0.78 } }; });
  assert.deepEqual(o.out.split('\n').filter((l) => /ERROR/.test(l) && /scale/.test(l)), []);
});
