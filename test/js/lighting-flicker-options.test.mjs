// Faulty panel flicker options (lighting.flicker as true or an object): true unchanged,
// the object form, photosensitivity clamps and reduced motion. Run with: node test/js/lighting-flicker-options.test.mjs
// (or node --test on the same file; bin/test-js runs it).
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'lighting-flicker-'));
writeFileSync(join(dir, 'constants.mjs'), readFileSync(join(js, 'utils/constants.js'), 'utf8'));
writeFileSync(join(dir, 'conditional-text.mjs'), readFileSync(join(js, 'utils/conditional-text.js'), 'utf8'));
writeFileSync(join(dir, 'lighting.mjs'), readFileSync(join(js, 'systems/lighting.js'), 'utf8')
  .replace("'../utils/constants.js'", "'./constants.mjs'")
  .replace("'../utils/conditional-text.js'", "'./conditional-text.mjs'")
  .replace("'./npc-sprite-style.js'", "'./npc-sprite-style.mjs'")
  .replace("'./room-hearing.js'", "'./room-hearing.mjs'")
  .replace("'./workstation-state.js'", "'./workstation-state.mjs'")
  .replace("'./npc-los.js'", "'./npc-los.mjs'"));
writeFileSync(join(dir, 'npc-sprite-style.mjs'), readFileSync(join(js, 'systems/npc-sprite-style.js'), 'utf8'));
writeFileSync(join(dir, 'room-hearing.mjs'), readFileSync(join(js, 'systems/room-hearing.js'), 'utf8'));
writeFileSync(join(dir, 'workstation-state.mjs'), readFileSync(join(js, 'systems/workstation-state.js'), 'utf8'));
writeFileSync(join(dir, 'npc-los.mjs'), readFileSync(join(js, 'systems/npc-los.js'), 'utf8'));

globalThis.Phaser = { AUTO: 0, Scale: { NONE: 0, CENTER_BOTH: 0, FIT: 0 }, BlendModes: { ADD: 1, MULTIPLY: 2 },
  Math: { Clamp: (v, a, b) => Math.max(a, Math.min(b, v)), Vector2: class {} } };
globalThis.window = { gameState: { globalVariables: {} } };
const { LightingSystem, resolveFlicker, planFlickerBurst } = await import(pathToFileURL(join(dir, 'lighting.mjs')).href);

// A seeded random source so runs are repeatable.
function lcg(seed) { let s = seed; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; }

test('flicker: true is the stock panel (one or two 90 ms dips to 0.55, 2.5 to 8.5 s out)', () => {
  assert.equal(resolveFlicker(false), null);
  assert.equal(resolveFlicker(undefined), null);
  const plan = resolveFlicker(true);
  assert.equal(plan.stock, true);
  const rand = lcg(7);
  for (let i = 0; i < 200; i++) {
    const b = planFlickerBurst(plan, 1000, rand);
    assert.ok(b.dips.length === 1 || b.dips.length === 2);
    assert.equal(b.level, 0.55);
    assert.ok(b.dips[0].at >= 3500 && b.dips[0].at <= 9500);
    for (const d of b.dips) assert.equal(d.len, 90);
    if (b.dips.length === 2) {
      const gap = b.dips[1].at - b.dips[0].at;
      assert.ok(gap >= 260 && gap <= 460);
    }
    assert.equal(b.end, b.dips[b.dips.length - 1].at + 90);
  }
});

test('the object form gives 3 dips of 150 to 250 ms, deeper when asked', () => {
  const plan = resolveFlicker({ dips: 3, dipMs: [150, 250], depth: 0.7 });
  const rand = lcg(11);
  for (let i = 0; i < 200; i++) {
    const b = planFlickerBurst(plan, 0, rand);
    assert.equal(b.dips.length, 3);
    assert.ok(Math.abs(b.level - 0.3) < 1e-9);
    for (const d of b.dips) assert.ok(d.len >= 150 && d.len <= 250);
    assert.ok(b.dips[0].at >= 2500 && b.dips[0].at <= 8500);
  }
  assert.ok(Math.abs(resolveFlicker({ dips: 3 }).level - 0.55) < 1e-9, 'depth defaults to the stock depth');
});

test('clamps: at most 3 dips, dips and gaps at least 100 ms, 2 s between bursts, under 3 flashes a second', () => {
  const wild = resolveFlicker({ dips: 9, dipMs: [5, 20], gapMs: [10, 20], depth: 5 });
  assert.equal(wild.dips, 3);
  assert.deepEqual(wild.dipMs, [100, 100]);
  assert.deepEqual(wild.gapMs, [2000, 2000]);
  assert.ok(Math.abs(wild.level - 0.1) < 1e-9, 'depth capped at 0.9');
  assert.equal(resolveFlicker({ dips: 0 }).dips, 1);
  assert.equal(resolveFlicker({ dips: -4 }).dips, 1);
  const rand = lcg(3);
  for (const spec of [{ dipMs: [5, 20], gapMs: [0, 1] }, { dipMs: [100, 100] }, { dipMs: [150, 250] }, { dipMs: [9000, 9999] }]) {
    const plan = resolveFlicker({ dips: 3, ...spec });
    let now = 0;
    let prevEnd = null;
    for (let i = 0; i < 100; i++) {
      const b = planFlickerBurst(plan, now, rand);
      assert.ok(b.dips.length <= 3);
      if (prevEnd !== null) assert.ok(b.dips[0].at - prevEnd >= 2000, 'bursts at least 2 s apart');
      b.dips.forEach((d, k) => {
        assert.ok(d.len >= 100 && d.len <= 600);
        if (k) {
          const prev = b.dips[k - 1];
          assert.ok(d.at - (prev.at + prev.len) >= 100, 'gap between dips at least 100 ms');
          assert.ok(d.at - prev.at >= 550, 'dip starts at least 550 ms apart');
        }
      });
      // No more than 3 dips (flashes) start inside any one second.
      assert.ok(b.dips.every((d, k) => k < 2 || b.dips[k].at - b.dips[k - 2].at > 1000), 'under 3 flashes in any second');
      prevEnd = b.end;
      now = b.end;
    }
  }
});

test('updatePanels: stock and object panels dip in time, and reduced motion holds steady', () => {
  const run = (flicker, reduced) => {
    const sys = { reducedMotion: reduced };
    const panel = { faulty: true, strikeAt: null, level: 1, flickerPlan: resolveFlicker(flicker) };
    const state = { on: true, panels: [panel] };
    let lowest = 1, dipMsSeen = 0;
    for (let t = 0; t < 30000; t += 10) {
      LightingSystem.prototype.updatePanels.call(sys, state, t);
      lowest = Math.min(lowest, panel.level);
      if (panel.level < 1) dipMsSeen += 10;
    }
    return { lowest, dipMsSeen };
  };
  const stock = run(true, false);
  assert.ok(Math.abs(stock.lowest - 0.55) < 1e-9);
  const tuned = run({ dips: 3, dipMs: [150, 250], depth: 0.7 }, false);
  assert.ok(Math.abs(tuned.lowest - 0.3) < 1e-9);
  assert.ok(tuned.dipMsSeen > stock.dipMsSeen);
  assert.deepEqual(run(true, true), { lowest: 1, dipMsSeen: 0 });
  assert.deepEqual(run({ dips: 3, dipMs: [150, 250] }, true), { lowest: 1, dipMsSeen: 0 });
});

test('malformed and inverted input falls back or is swapped, never NaN', () => {
  const finite = r => r.every(Number.isFinite);
  for (const bad of [[NaN, NaN], ['a', 'b'], ['150', '250'], [NaN, 200], ['x'], [], null, 'x', {}, Infinity]) {
    const plan = resolveFlicker({ dipMs: bad, gapMs: bad });
    assert.ok(finite(plan.dipMs) && finite(plan.gapMs), `finite for ${JSON.stringify(bad)}`);
    assert.ok(plan.dipMs[0] <= plan.dipMs[1] && plan.gapMs[0] <= plan.gapMs[1]);
    const b = planFlickerBurst(plan, 0, lcg(5));
    assert.ok(Number.isFinite(b.end) && b.dips.every(d => Number.isFinite(d.at) && Number.isFinite(d.len)));
  }
  assert.deepEqual(resolveFlicker({ dipMs: ['a', 200] }).dipMs, [100, 200], 'a bad element takes the default, the good one stays');
  assert.deepEqual(resolveFlicker({ dipMs: [250, 150] }).dipMs, [150, 250], 'inverted range is swapped');
  assert.deepEqual(resolveFlicker({ gapMs: [1e12, -5] }).gapMs, [2000, 60000]);
  assert.deepEqual(resolveFlicker({ dipMs: 700 }).dipMs, [600, 600], 'a single number is a one-value range');
  assert.equal(resolveFlicker({ dips: 'x' }).dips, 2);
  assert.equal(resolveFlicker([1, 2]).stock, true);
});

test('omitted fields default to the stock panel, so { depth } is stock but deeper', () => {
  const plan = resolveFlicker({ depth: 0.7 });
  assert.equal(plan.dips, 2);
  assert.deepEqual(plan.dipMs, [100, 100]);
  assert.deepEqual(plan.gapMs, [2500, 8500]);
  assert.ok(Math.abs(plan.level - 0.3) < 1e-9);
});

test('flicker: true draws the same dip schedule as the original inline code (seeded Math.random)', () => {
  // The code before the options change, copied here as the reference.
  const legacy = (now, r) => {
    const first = now + 2500 + r() * 6000;
    return r() < 0.5 ? [first] : [first, first + 260 + r() * 200];
  };
  const realRandom = Math.random;
  try {
    for (const seed of [1, 2, 3, 42, 99]) {
      let now = 0;
      const refRand = lcg(seed);
      Math.random = lcg(seed);
      const sys = { reducedMotion: false };
      const panel = { faulty: true, strikeAt: null, level: 1, flickerPlan: resolveFlicker(true) };
      const state = { on: true, panels: [panel] };
      for (let t = 0; t < 120000; t += 10) {
        const before = panel.dips;
        LightingSystem.prototype.updatePanels.call(sys, state, t);
        if (panel.dips !== before) {
          const expected = legacy(t, refRand);
          assert.deepEqual(panel.dips.map(d => d.at), expected);
          assert.ok(panel.dips.every(d => d.len === 90));
          assert.equal(panel.dipLevel, 0.55);
          assert.equal(panel.nextBurst, expected[expected.length - 1] + 90);
        }
        now = t;
      }
      assert.ok(now > 0);
    }
  } finally { Math.random = realRandom; }
});

const roomStub = () => ({ position: { x: 0, y: 0 }, map: { widthInPixels: 320, heightInPixels: 320 } });
const sysStub = () => ({ config: {}, defaultMode: 'on', layoutPanels: LightingSystem.prototype.layoutPanels });

test('configureRoom sets the plan on one faulty panel, and none without flicker', () => {
  const sys = sysStub();
  const state = {};
  LightingSystem.prototype.configureRoom.call(sys, state, roomStub(), { flicker: { depth: 0.7 } });
  const faulty = state.panels.filter(p => p.faulty);
  assert.equal(faulty.length, 1);
  assert.ok(Math.abs(faulty[0].flickerPlan.level - 0.3) < 1e-9);
  const stock = {};
  LightingSystem.prototype.configureRoom.call(sys, stock, roomStub(), { flicker: true });
  assert.equal(stock.panels.filter(p => p.faulty)[0].flickerPlan.stock, true);
  const none = {};
  LightingSystem.prototype.configureRoom.call(sys, none, roomStub(), {});
  assert.equal(none.panels.filter(p => p.faulty).length, 0);
});

test('job_cleared variant (flicker: false) rebuilds the room with no faulty panel, steady mid-burst', () => {
  const sys = Object.assign(sysStub(), {
    configureRoom: LightingSystem.prototype.configureRoom,
    npcInRoom: () => false,
  });
  const block = { flicker: { dips: 3, dipMs: [150, 250], depth: 0.7 }, variants: [{ condition: 'globalVars.job_cleared === true', flicker: false }] };
  window.rooms = { r1: roomStub() };
  window.gameState.globalVariables = { job_cleared: false };
  const state = { roomId: 'r1', block, variantIdx: -1, lastRoomResolve: -Infinity, offTimer: null };
  LightingSystem.prototype.configureRoom.call(sys, state, window.rooms.r1, block);
  state.on = true;
  const faulty = state.panels.find(p => p.faulty);
  assert.ok(faulty);
  // Put it mid-burst, level down.
  LightingSystem.prototype.updatePanels.call({ reducedMotion: false }, state, 0);
  faulty.level = 0.3;
  window.gameState.globalVariables = { job_cleared: true };
  LightingSystem.prototype.resolveRoomVariant.call(sys, state, 100000);
  assert.equal(state.panels.filter(p => p.faulty).length, 0);
  assert.ok(state.panels.every(p => p.level === 1 && !p.dips));
  LightingSystem.prototype.updatePanels.call({ reducedMotion: false }, state, 100500);
  assert.ok(state.panels.every(p => p.level === 1), 'steady after the job is cleared');
});

test('switchOff and switchOn drop a planned burst, so none resumes right after the strike', () => {
  const panel = { faulty: true, strikeAt: null, level: 1, flickerPlan: resolveFlicker({ dips: 3, dipMs: [150, 250] }) };
  const state = { on: true, panels: [panel] };
  const sys = { rooms: new Map([['r', state]]), reducedMotion: false, playStrikeClick() {}, scene: { time: { now: 1000 } } };
  LightingSystem.prototype.updatePanels.call(sys, state, 1000);
  assert.ok(panel.dips);
  LightingSystem.prototype.switchOff.call(sys, 'r');
  assert.equal(panel.dips, null);
  // Replan, then switch on with a strike: the old plan is gone, the next burst is at least 2.5 s out.
  LightingSystem.prototype.updatePanels.call(sys, { on: true, panels: [panel] }, 1000);
  assert.ok(panel.dips);
  LightingSystem.prototype.switchOn.call(sys, 'r');
  assert.equal(panel.dips, null);
  const strikeEnd = panel.strikeAt + 460;
  for (let t = 1000; t <= strikeEnd + 1000; t += 10) {
    LightingSystem.prototype.updatePanels.call(sys, state, t);
    if (t > strikeEnd && t <= strikeEnd + 1000) assert.equal(panel.level, 1, `no dip within 1 s of the strike (t=${t})`);
  }
  assert.ok(panel.dips[0].at - strikeEnd >= 2000, 'next burst at least 2 s after the strike');
});
