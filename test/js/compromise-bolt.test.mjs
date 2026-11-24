import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BOLT_WIDTH, BOLT_HEIGHT, BOLT_ROWS, BOLT_COLOURS, boltPixels, drawBolt, createBoltCanvas
} from '../../public/break_escape/js/utils/compromise-bolt.js';

function recorder() {
  const rects = [];
  const ctx = { fillStyle: '', fillRect(x, y, w, h) { rects.push({ x, y, w, h, c: this.fillStyle }); } };
  return { ctx, rects };
}

test('bitmap is 7 by 11 with two colours only', () => {
  assert.equal(BOLT_WIDTH, 7);
  assert.equal(BOLT_HEIGHT, 11);
  assert.equal(BOLT_ROWS.length, 11);
  for (const r of BOLT_ROWS) { assert.equal(r.length, 7); assert.match(r, /^[.oy]+$/); }
  assert.ok(BOLT_ROWS.join('').includes('y'));
});

test('every fill pixel touches an outline or the edge (outlined shape)', () => {
  const px = boltPixels();
  const at = (x, y) => px.find(p => p.x === x && p.y === y);
  for (const p of px.filter(q => q.kind === 'fill')) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = at(p.x + dx, p.y + dy);
      const inside = p.x + dx >= 0 && p.x + dx < 7 && p.y + dy >= 0 && p.y + dy < 11;
      assert.ok(!inside || n, `fill at ${p.x},${p.y} borders empty space`);
    }
  }
});

test('drawBolt paints each pixel at whole-pixel scale and returns the size', () => {
  const { ctx, rects } = recorder();
  const size = drawBolt(ctx, 3, 4, 2);
  assert.deepEqual(size, { width: 14, height: 22 });
  assert.equal(rects.length, boltPixels().length);
  assert.ok(rects.every(r => r.w === 2 && r.h === 2 && r.x >= 3 && r.y >= 4 && r.x < 17 && r.y < 26));
  const colours = new Set(rects.map(r => r.c));
  assert.deepEqual([...colours].sort(), [BOLT_COLOURS.fill, BOLT_COLOURS.outline].sort());
});

test('a fractional or bad scale falls back to whole pixels, a null ctx is safe', () => {
  assert.deepEqual(drawBolt(null, 0, 0, 2.7), { width: 14, height: 22 });
  assert.deepEqual(drawBolt(null, 0, 0, 0), { width: 7, height: 11 });
  assert.deepEqual(drawBolt(null, 0, 0, 'x'), { width: 7, height: 11 });
});

test('createBoltCanvas sizes and draws, and answers null without a canvas', () => {
  const { ctx, rects } = recorder();
  const doc = { createElement: (t) => ({ tag: t, width: 0, height: 0, getContext: () => ctx }) };
  const c = createBoltCanvas(doc, 2);
  assert.equal(c.width, 14);
  assert.equal(c.height, 22);
  assert.equal(rects.length, boltPixels().length);
  assert.equal(createBoltCanvas(null), null);
  assert.equal(createBoltCanvas({ createElement: () => ({ getContext: () => null }) }), null);
  assert.equal(createBoltCanvas({ createElement: () => ({}) }), null);
});

test('the module imports nothing', async () => {
  const fs = await import('node:fs');
  const src = fs.readFileSync(new URL('../../public/break_escape/js/utils/compromise-bolt.js', import.meta.url), 'utf8');
  assert.ok(!/^\s*import\s/m.test(src));
});
