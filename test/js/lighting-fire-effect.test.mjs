// The `fire` emitter effect (7.6b, m04 L1: the vented battery bank read as warm fog):
// an irregular warm flicker plus small rising flame tongues, flash-safe (no more than
// three flashes a second, WCAG 2.3.1) and still under prefers-reduced-motion.
// Run with: node --test test/js/lighting-fire-effect.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'lighting-fire-'));
writeFileSync(join(dir, 'constants.mjs'), readFileSync(join(js, 'utils/constants.js'), 'utf8'));
writeFileSync(join(dir, 'conditional-text.mjs'), readFileSync(join(js, 'utils/conditional-text.js'), 'utf8'));
writeFileSync(join(dir, 'lighting.mjs'), readFileSync(join(js, 'systems/lighting.js'), 'utf8')
  .replace("'../utils/constants.js'", "'./constants.mjs'")
  .replace("'../utils/conditional-text.js'", "'./conditional-text.mjs'"));

globalThis.Phaser = { AUTO: 0, Scale: { NONE: 0, CENTER_BOTH: 0, FIT: 0 }, BlendModes: { ADD: 1, MULTIPLY: 2 },
  Math: { Clamp: (v, a, b) => Math.max(a, Math.min(b, v)), Vector2: class {} } };
globalThis.window = { gameState: { globalVariables: {} } };
const { LightingSystem, fireFlicker, fireTongue } = await import(pathToFileURL(join(dir, 'lighting.mjs')).href);

// Flashes in a sampled signal: a turning point counts once the signal has moved at
// least `min` back from it (hysteresis), so wobbles smaller than `min` never count.
// Two turning points make one flash (a pair of opposing changes).
function maxFlashesPerSecond(sample, ms = 20000, step = 2, min = 0.1) {
  const turns = [];
  let hi = sample(0), lo = hi, hiT = 0, loT = 0, dir = 0;
  for (let t = step; t <= ms; t += step) {
    const v = sample(t);
    if (v > hi) { hi = v; hiT = t; }
    if (v < lo) { lo = v; loT = t; }
    if (dir >= 0 && hi - v >= min) { if (dir > 0) turns.push(hiT); dir = -1; lo = v; loT = t; }
    else if (dir <= 0 && v - lo >= min) { if (dir < 0) turns.push(loT); dir = 1; hi = v; hiT = t; }
  }
  let worst = 0;
  for (let i = 0; i < turns.length; i++) {
    let n = 0;
    while (i + n < turns.length && turns[i + n] - turns[i] < 1000) n++;
    worst = Math.max(worst, Math.floor(n / 2));
  }
  return worst;
}

test('the flash counter itself: 5 Hz counts 5, 2 Hz counts 2, a tiny fast wobble 0', () => {
  assert.equal(maxFlashesPerSecond(t => 0.5 + 0.3 * Math.sin(2 * Math.PI * 5 * t / 1000)), 5);
  assert.equal(maxFlashesPerSecond(t => 0.5 + 0.3 * Math.sin(2 * Math.PI * 2 * t / 1000)), 2);
  assert.equal(maxFlashesPerSecond(t => 0.5 + 0.03 * Math.sin(2 * Math.PI * 9 * t / 1000)), 0);
});

test('the fire glow flickers within a warm, bright range', () => {
  let lo = Infinity, hi = -Infinity;
  for (let t = 0; t < 20000; t += 5) {
    const { k, mix } = fireFlicker(t, 1.3);
    lo = Math.min(lo, k); hi = Math.max(hi, k);
    assert.ok(mix >= 0 && mix <= 0.5);
  }
  assert.ok(lo > 0.6 && hi <= 1.0, `k in ${lo.toFixed(2)}..${hi.toFixed(2)}`);
  assert.ok(hi - lo > 0.15, 'visibly alive');
});

test('flash-safe: the glow never makes more than three flashes a second', () => {
  for (const phase of [0, 1, 2.5, 4]) {
    assert.ok(maxFlashesPerSecond(t => fireFlicker(t, phase).k) <= 3, `phase ${phase}`);
  }
});

test('the quick wobble alone stays under a 10% swing', () => {
  // Remove the slow swell; what's left must not count as a flash at all
  const fast = (t) => fireFlicker(t, 0).k - 0.1 * Math.sin(2 * Math.PI * 0.83 * t / 1000);
  assert.equal(maxFlashesPerSecond(fast), 0);
});

test('a flame tongue rises and fades once per cycle; reduced motion freezes it', () => {
  const p = 650;
  assert.equal(fireTongue(0, p, 0).alpha, 0);
  assert.ok(Math.abs(fireTongue(p / 2, p, 0).alpha - 1) < 1e-9);
  assert.ok(fireTongue(p * 0.9, p, 0).rise > fireTongue(p * 0.1, p, 0).rise);
  assert.deepEqual(fireTongue(123, p, 50, true), fireTongue(9999, p, 7, true));
});

function fakeImage() {
  const img = {};
  for (const m of ['setBlendMode', 'setVisible', 'setDepth', 'setTint', 'setScale', 'setPosition', 'setAlpha']) img[m] = () => img;
  img.destroy = () => {};
  return img;
}

test('only an emitter with a fire state gets flame tongues; flames sets how many', () => {
  const sys = Object.create(LightingSystem.prototype);
  sys.scene = { add: { image: () => fakeImage() } };
  assert.equal(sys.createFlames([{ effect: 'breathe' }, null]).length, 0);
  assert.equal(sys.createFlames([null, { effect: 'fire' }]).length, 6);
  assert.equal(sys.createFlames([{ effect: 'fire', flames: 3 }]).length, 3);
  assert.equal(sys.createFlames([{ effect: 'fire', flames: 0 }]).length, 0);
  assert.equal(sys.createFlames([{ effect: 'fire', flames: 99 }]).length, 12);
  for (const f of sys.createFlames([{ effect: 'fire' }])) assert.ok(f.period >= 650, 'each tongue under 1.6 a second');
});
