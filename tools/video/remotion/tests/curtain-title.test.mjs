// End-card title reveal: the title is clipped to the red curtain's per-column fronts (same maths as HexRain).
// Run: npm test   (from tools/video/remotion; no render, no browser)
import test from 'node:test'; import assert from 'node:assert/strict';
import { curtainLag, curtainFronts, frontsClipPolygon, polygonCss } from '../src/curtain.js';

test('fronts are zero before the fall, rise monotonically with p, and differ between columns', () => {
  const f0 = curtainFronts(0, 1920, 1080, 20, 28, 5);
  assert.equal(f0.length, 96); assert.ok(f0.every((v) => v === 0));
  const a = curtainFronts(0.5, 1920, 1080, 20, 28, 5), b = curtainFronts(0.7, 1920, 1080, 20, 28, 5);
  assert.ok(a.every((v, i) => b[i] >= v)); assert.ok(new Set(a.map((v) => Math.round(v))).size > 10);
  assert.ok(curtainFronts(1, 1920, 1080, 20, 28, 5).every((v) => v >= 1080));
});
test('fronts use the same lag as curtainLag (HexRain)', () => {
  const lag = curtainLag(96, 5), f = curtainFronts(0.6, 1920, 1080, 20, 28, 5);
  lag.forEach((l, i) => assert.ok(Math.abs(f[i] - Math.pow(Math.min(1, Math.max(0, (0.6 - l) / 0.65)), 1.6) * (1080 + 56)) < 1e-9));
});
test('clip polygon: nothing visible until a front reaches the box top, then only the columns the red has passed', () => {
  const box = [400, 200, 300, 100]; // left, top, w, h
  assert.equal(frontsClipPolygon(curtainFronts(0.2, 1920, 1080, 20, 28, 5), 20, ...box), null);
  const fr = Array(96).fill(0); fr[25] = 250; fr[26] = 1000; // columns 25 and 26 span x 500..540
  const poly = frontsClipPolygon(fr, 20, ...box);
  const ys = poly.map(([, y]) => y);
  assert.ok(poly.some(([x, y]) => x === 100 && y === 50)); // column 25, front 250 -> 50 px into the box
  assert.ok(poly.some(([x, y]) => x === 140 && y === 100)); // column 26 clamped to box height
  assert.ok(Math.max(...ys) <= 100 && Math.min(...ys) >= 0);
});
test('full cover shows the whole box; polygonCss formats px pairs', () => {
  const poly = frontsClipPolygon(Array(96).fill(5000), 20, 400, 200, 300, 100);
  assert.ok(poly.every(([x, y]) => x >= 0 && x <= 300 && y >= 0 && y <= 100));
  assert.equal(polygonCss([[0, 0], [10, 5]]), 'polygon(0px 0px,10px 5px)');
});
