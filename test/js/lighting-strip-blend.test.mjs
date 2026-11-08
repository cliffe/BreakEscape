// Behind-the-wall fade, strip light blend (systems/lighting.js, planning_notes/behind_wall_fade/DESIGN.md 8.1):
// while a south room's back wall is faded its strip takes a blend of the north room's light, built by
// recording the north room's stamps, replaying them into a strip texture and blending that back.
// Run with: node --test test/js/lighting-strip-blend.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'lighting-strip-'));
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

globalThis.Phaser = { AUTO: 0, Scale: { NONE: 0, CENTER_BOTH: 0, FIT: 0 }, BlendModes: { NORMAL: 0, ADD: 1, MULTIPLY: 2 }, Math: { Clamp: (v, a, b) => Math.max(a, Math.min(b, v)), DegToRad: (d) => d * Math.PI / 180, Vector2: class { constructor() { this.x = 0; this.y = 0; } } } };
globalThis.window = { gameState: { globalVariables: {} } };
const { LightingSystem } = await import(pathToFileURL(join(dir, 'lighting.mjs')).href);

const { stripBlendSegments } = await import(pathToFileURL(join(dir, 'lighting.mjs')).href);
const ADD = 1, NORMAL = 0;

// ---------- stripBlendSegments (pure) ----------
const room = (x, y, w, h) => ({ position: { x, y }, map: { widthInPixels: w, heightInPixels: h } });
const W = (roomId, weight = 1, gaps = []) => ({ roomId, weight, gaps });
const box = (g) => [g.south, g.north, g.x, g.y, g.w, g.h, g.weight];

test('segments: one S under one N gives the strip over N with the weight', () => {
  const segs = stripBlendSegments([W('s', 0.7)], { n: room(0, 0, 320, 320), s: room(0, 256, 320, 256) });
  assert.deepEqual(segs.map(box), [['s', 'n', 0, 256, 320, 64, 0.7]]);
});
test('segments: S wider than N gives N\'s x-range only; two north rooms give two', () => {
  let segs = stripBlendSegments([W('s')], { n: room(64, 0, 128, 320), s: room(0, 256, 320, 256) });
  assert.deepEqual(segs.map(box), [['s', 'n', 64, 256, 128, 64, 1]]);
  segs = stripBlendSegments([W('s')], { a: room(0, 0, 160, 320), b: room(160, 0, 160, 320), s: room(0, 256, 320, 256) });
  assert.deepEqual(segs.map(g => [g.north, g.x, g.w]), [['a', 0, 160], ['b', 160, 160]]);
});
test('segments: two south rooms under one N (the seam) give one each', () => {
  const segs = stripBlendSegments([W('r'), W('s')], { n: room(0, 0, 640, 320), r: room(0, 256, 320, 256), s: room(320, 256, 320, 256) });
  assert.deepEqual(segs.map(g => [g.south, g.x, g.w]), [['r', 0, 320], ['s', 320, 320]]);
});
test('segments: rooms level with or south of S, or without a map, give none; no weights give []', () => {
  const rooms = { level: room(0, 256, 320, 256), south: room(0, 512, 320, 256), nomap: { position: { x: 0, y: 0 } }, s: room(0, 256, 320, 256) };
  assert.deepEqual(stripBlendSegments([W('s')], rooms), []);
  assert.deepEqual(stripBlendSegments([], { n: room(0, 0, 320, 320), s: room(0, 256, 320, 256) }), []);
  assert.deepEqual(stripBlendSegments(undefined, {}), []);
});
test('segments: a gap at x = 48 splits [0, 320) in two; a gap at the edge leaves one piece', () => {
  const rooms = { n: room(0, 0, 320, 320), s: room(0, 256, 320, 256) };
  assert.deepEqual(stripBlendSegments([W('s', 1, [48])], rooms).map(g => [g.x, g.w]), [[0, 32], [64, 256]]);
  assert.deepEqual(stripBlendSegments([W('s', 1, [16])], rooms).map(g => [g.x, g.w]), [[32, 288]]);
  assert.deepEqual(stripBlendSegments([W('s', 1, [304])], rooms).map(g => [g.x, g.w]), [[0, 288]]);
});

// ---------- the redraw ----------
// A log shared by the light map and the strip texture, in call order.
function makeRig({ weights = [{ roomId: 'server', weight: 1, gaps: [] }], viewX = 0, rtW = 400, rtH = 340, twoNorth = false, exists = false } = {}) {
  const log = [];
  const snap = (o) => (o ? { ...o } : o);
  const rt = {
    x: 0, y: 0, width: rtW, height: rtH, displayWidth: 2000, displayHeight: 2000,
    setPosition() {}, clear() { log.push({ t: 'rt', op: 'clear' }); },
    beginDraw() { log.push({ t: 'rt', op: 'begin' }); }, endDraw() { log.push({ t: 'rt', op: 'end' }); },
    stamp(key, frame, x, y, opts) {
      log.push({ t: 'rt', op: 'stamp', key, frame, x, y, opts: snap(opts), glTexture: frame ? frames.get(frame)?.glTexture : undefined, fr: frame ? { ...frames.get(frame) } : undefined });
      return rt;
    },
  };
  let handle = { id: 1 };
  const frames = new Map();
  const strip = {
    width: rtW, height: rtH, calls: { setSize: 0 },
    clear() { log.push({ t: 'strip', op: 'clear' }); },
    beginDraw() { log.push({ t: 'strip', op: 'begin' }); }, endDraw() { log.push({ t: 'strip', op: 'end' }); },
    stamp(key, frame, x, y, opts) {
      log.push({ t: 'strip', op: 'stamp', key, frame, x, y, opts: snap(opts), glTexture: frame ? frames.get(frame)?.glTexture : undefined,
        fr: frame ? { ...frames.get(frame) } : undefined });
      return strip;
    },
    has: (n) => frames.has(n),
    add(n, src, x, y, w, h) { const f = { name: n, x, y, w, h, glTexture: handle, setSize(w2, h2, x2, y2) { f.w = w2; f.h = h2; f.x = x2; f.y = y2; } }; frames.set(n, f); return f; },
    get: (n) => frames.get(n),
    setSize(w, h) { strip.calls.setSize++; strip.width = w; strip.height = h; handle = { id: handle.id + 1 }; },
    getWebGLTexture: () => handle,
  };
  const tm = {
    calls: { add: 0, get: 0, remove: [] },
    exists: (k) => exists && k === 'be_light_strip',
    get(k) { tm.calls.get++; return strip; },
    addDynamicTexture(k, w, h) { tm.calls.add++; return strip; },
    remove(k) { tm.calls.remove.push(k); },
  };
  const sys = Object.create(LightingSystem.prototype);
  sys.scene = { cameras: { main: { worldView: { x: viewX, y: 0, right: viewX + 320, bottom: 256 } } }, textures: tm };
  sys.config = {}; sys.flashes = new Map(); sys.reducedMotion = true; sys.tmpCentre = { x: 0, y: 0 };
  sys.lightMap = rt;
  sys.stripCmds = []; sys.stripCmdCount = 0; sys.stripNorth = new Set(); sys.stripSegments = []; sys.stripDebug = { at: 0, segments: [] };
  const mk = (id, level, panel) => {
    const st = { roomId: id, level, on: level > 0, extraLights: [], emitters: [], panels: panel ? [{ x: panel[0], y: panel[1], radius: 50, level: 1 }] : [] };
    sys.configureRoom(st, { map: { widthInPixels: 320, heightInPixels: 256 }, position: { x: 0, y: 0 } }, { panels: false });
    st.panels = panel ? [{ x: panel[0], y: panel[1], radius: 50, level: 1 }] : [];
    return st;
  };
  const rooms = { hall: room(0, 0, 320, 320), server: room(0, 256, 320, 256) };
  const states = [['hall', mk('hall', 1, [100, 280])], ['server', mk('server', 0, null)]];
  if (twoNorth) { rooms.hall2 = room(320, 0, 320, 320); rooms.server.map.widthInPixels = 640; states.push(['hall2', mk('hall2', 1, [400, 280])]); }
  sys.rooms = new Map(states);
  for (const m of ['subscribe', 'checkNpcMotion', 'resolveRoomVariant', 'updatePanels', 'refreshEmitters', 'stampNpcTorches', 'stampNpcGlows']) sys[m] = () => {};
  sys.roomLevel = (st) => st.level;
  sys.collectFigures = () => [];
  // one stamp through the closure, one directly (the closed-door leak path)
  sys.stampDoorSpill = (state, stamp, target) => { stamp(30, 30, 20, 0xffffff, 0.5); target.stamp('be_light_soft', null, 5, 5, { blendMode: ADD, alpha: 0.25, skipBatch: true }); };
  globalThis.window.rooms = rooms; globalThis.window.player = null; globalThis.window.currentPlayerRoom = 'hall';
  globalThis.window.behindWallFade = weights === 'absent' ? undefined
    : weights === 'throws' ? { lightWeights() { throw new Error('boom'); } }
    : { lightWeights: () => weights };
  return { sys, log, rt, strip, tm, rooms, frames, get handle() { return handle; } };
}
const redraw = (r, t = 1000) => { r.sys.lastDraw = undefined; r.sys.update(t); };
const rtStamps = (log, from = 0, to = log.length) => log.slice(from, to).filter(e => e.t === 'rt' && e.op === 'stamp');

test('tee: the main batch is the same with and without segments; only N and the spill are recorded', () => {
  const on = makeRig(); redraw(on);
  const off = makeRig({ weights: [] }); redraw(off);
  const firstEnd = (log) => log.findIndex(e => e.t === 'rt' && e.op === 'end');
  const a = rtStamps(on.log, 0, firstEnd(on.log)), b = rtStamps(off.log, 0, firstEnd(off.log));
  assert.ok(a.length > 4);
  assert.deepEqual(a, b, 'same stamps, same order, same options');
  const cmds = on.sys.stripCmds.slice(0, on.sys.stripCmdCount);
  const hall = cmds.filter(c => c.roomId === 'hall'), spill = cmds.filter(c => c.roomId === '__spill');
  assert.ok(hall.length > 0, 'the north room is recorded');
  assert.equal(cmds.filter(c => c.roomId === 'server').length, 0, 'S is never recorded');
  assert.equal(spill.length, 4, 'two visible rooms, two spill stamps each, once');
  assert.ok(hall.some(c => c.key === 'be_light_soft' && c.opts.blendMode === ADD), 'a panel stamp');
});

test('option copy: a pooled command keeps no key from the options it last held', () => {
  const r = makeRig();
  const tee = r.sys.teeFor('hall');
  const block = { originX: 0, originY: 0, tint: 0xff0000, scaleX: 3, scaleY: 2, skipBatch: true };
  tee.stamp('be_light_block', null, 1, 2, block);
  const cmd = r.sys.stripCmds[0];
  assert.equal(cmd.opts.scaleX, 3);
  block.scaleX = 99;
  assert.equal(cmd.opts.scaleX, 3, 'a copy, taken at call time');
  r.sys.stripCmdCount = 0;
  tee.stamp('be_light_soft', null, 3, 4, { blendMode: ADD, alpha: 0.5, tint: 0x00ff00, scale: 2, skipBatch: true });
  assert.strictEqual(r.sys.stripCmds[0], cmd, 'pooled');
  assert.equal(cmd.opts.scaleX, undefined);
  assert.equal(cmd.opts.originX, undefined);
  assert.equal(cmd.opts.angle, undefined);
  assert.equal(cmd.opts.blendMode, ADD);
  assert.equal(cmd.opts.scale, 2);
});

test('strip batch: fill, N commands in order, then spill once, a final ADD, every stamp skipBatch', () => {
  const r = makeRig({ twoNorth: true, weights: [{ roomId: 'server', weight: 0.6, gaps: [] }] }); redraw(r);
  const iFirstEnd = r.log.findIndex(e => e.t === 'rt' && e.op === 'end');
  const s = r.log.slice(iFirstEnd + 1).filter(e => e.t === 'strip');
  assert.deepEqual(s.slice(0, 2).map(e => e.op), ['clear', 'begin']);
  assert.equal(s[s.length - 1].op, 'end');
  const stamps = s.filter(e => e.op === 'stamp');
  assert.ok(stamps.every(e => e.opts.skipBatch === true));
  const last = stamps[stamps.length - 1];
  assert.equal(last.opts.blendMode, ADD); assert.equal(last.opts.tint, 0);
  // first stamp is the first north room's fill (NORMAL block, origin 0) in its drawAmbient
  const hall = r.sys.rooms.get('hall'), hall2 = r.sys.rooms.get('hall2');
  assert.equal(stamps[0].key, 'be_light_block');
  assert.equal(stamps[0].opts.tint, hall.drawAmbient);
  assert.equal(stamps[0].opts.originX, 0);
  const cmds = r.sys.stripCmds.slice(0, r.sys.stripCmdCount);
  const expected = [...cmds.filter(c => c.roomId === 'hall'), ...cmds.filter(c => c.roomId === 'hall2'), ...cmds.filter(c => c.roomId === '__spill')];
  assert.equal(stamps.length, 2 + expected.length + 1, 'two fills + replays + closing ADD');
  // the replayed stamps are N's, then N2's, then the spill, as recorded (a fill precedes each north room's own)
  const replayed = stamps.slice(0, -1).filter((e, i) => i !== 0 && i !== 1 + cmds.filter(c => c.roomId === 'hall').length);
  assert.deepEqual(replayed.map(e => [e.key, e.x, e.y]), expected.map(c => [c.key, c.x, c.y]));
  assert.equal(stamps.slice(-5, -1).filter(e => e.key === 'be_light_soft' || e.key === 'be_light_block').length, 4, 'four spill stamps at the end, once');
  assert.equal(stamps.slice(-5, -1)[0].x, cmds.filter(c => c.roomId === '__spill')[0].x);
});

test('blend batch: no clear, one NORMAL stamp per segment at its weight, origin 0, rounded frame', () => {
  const r = makeRig({ weights: [{ roomId: 'server', weight: 0.4, gaps: [48] }] }); redraw(r);
  const iEnd = r.log.findIndex(e => e.t === 'rt' && e.op === 'end');
  const after = r.log.slice(iEnd + 1).filter(e => e.t === 'rt');
  assert.equal(after[0].op, 'begin');
  assert.ok(!after.some(e => e.op === 'clear'));
  assert.equal(after[after.length - 1].op, 'end');
  const st = after.filter(e => e.op === 'stamp');
  assert.equal(st.length, 2, 'the doorway column splits the strip in two');
  for (const e of st) {
    assert.equal(e.opts.alpha, 0.4); assert.equal(e.opts.blendMode, NORMAL);
    assert.equal(e.opts.originX, 0); assert.equal(e.opts.originY, 0); assert.equal(e.opts.skipBatch, true);
    assert.equal(e.key, 'be_light_strip');
  }
  // ox = floor(0) - 64 = -64; segment 0 is x 0..32, y 256..320: ((0+64)*.5, (256+64)*.5) .. ((32+64)*.5, 192)
  assert.deepEqual([st[0].x, st[0].y, st[0].fr.w, st[0].fr.h], [32, 160, 16, 32]);
  assert.deepEqual([st[1].x, st[1].y, st[1].fr.w, st[1].fr.h], [64, 160, 128, 32]);
  assert.deepEqual(r.sys.stripBlendDebug().segments.map(g => g.rect), [[32, 160, 48, 192], [64, 160, 192, 192]]);
});

test('rounding: an odd ox and a width ending in .5 give integer rects, clipped to the map', () => {
  const r = makeRig({ viewX: 1.4, rtW: 180.5, rtH: 340 }); // ox = 1 - 64 = -63 (odd); the segment runs past x 180
  redraw(r);
  const strip = r.log.filter(e => e.t === 'strip' && e.op === 'stamp')[0];
  const blend = r.log.slice(r.log.findIndex(e => e.t === 'rt' && e.op === 'end') + 1).filter(e => e.t === 'rt' && e.op === 'stamp');
  assert.equal(blend.length, 1);
  for (const v of [strip.x, strip.y, blend[0].x, blend[0].y, blend[0].fr.w, blend[0].fr.h, strip.opts.scaleX * 16, strip.opts.scaleY * 16]) assert.ok(Number.isInteger(v), String(v));
  assert.equal(blend[0].x + blend[0].fr.w, 180, 'clipped to floor(width)');
  assert.equal(r.sys.stripBlendDebug().segments[0].rect[2], 180);
});

test('resize: crop frames carry the new WebGL handle at stamp time; a second redraw does not resize again', () => {
  const r = makeRig(); redraw(r, 1000);
  const first = r.log.filter(e => e.t === 'rt' && e.op === 'stamp' && e.key === 'be_light_strip').pop();
  assert.equal(first.glTexture.id, 1);
  r.rt.width = 460; r.rt.displayWidth = 2000;
  r.log.length = 0; redraw(r, 2000);
  assert.equal(r.strip.calls.setSize, 1);
  const second = r.log.filter(e => e.t === 'rt' && e.op === 'stamp' && e.key === 'be_light_strip').pop();
  assert.equal(second.glTexture.id, 2, 'the handle swapped by setSize');
  r.log.length = 0; redraw(r, 3000);
  assert.equal(r.strip.calls.setSize, 1, 'no second resize at the same size');
  assert.equal(r.log.filter(e => e.t === 'rt' && e.op === 'stamp' && e.key === 'be_light_strip').pop().glTexture.id, 2);
});

test('key reuse: an existing texture is got, not added; destroy removes it', () => {
  let r = makeRig(); redraw(r);
  assert.equal(r.tm.calls.add, 1); assert.equal(r.tm.calls.get, 0);
  r = makeRig({ exists: true }); redraw(r);
  assert.equal(r.tm.calls.add, 0); assert.equal(r.tm.calls.get, 1);
  r.rt.destroy = () => {};
  r.sys.destroy();
  assert.deepEqual(r.tm.calls.remove, ['be_light_strip']);
});

test('idle: no weights, no window.behindWallFade, or a throwing lightWeights makes no strip and records nothing', () => {
  for (const weights of [[], 'absent', 'throws']) {
    const r = makeRig({ weights }); redraw(r);
    assert.equal(r.tm.calls.add + r.tm.calls.get, 0, `no strip texture (${weights})`);
    assert.equal(r.log.filter(e => e.t === 'strip').length, 0);
    assert.equal(r.log.filter(e => e.t === 'rt' && e.op === 'begin').length, 1, 'one batch');
    assert.equal(r.log.filter(e => e.t === 'rt' && e.op === 'end').length, 1);
    assert.equal(r.sys.stripCmdCount, 0, 'nothing recorded');
    assert.deepEqual(r.sys.stripBlendDebug().segments, []);
  }
});

test('idle: stampDoorSpill is handed the light map itself', () => {
  const r = makeRig({ weights: [] });
  let got = null;
  r.sys.stampDoorSpill = (st, stamp, target) => { got = target; };
  redraw(r);
  assert.strictEqual(got, r.rt);
});

test('a segment needs both rooms in the visible list', () => {
  const r = makeRig({ viewX: 100000 }); // the camera is far from every room: none is visible
  r.sys.lightMap.x = 99000; r.sys.lightMap.displayWidth = 4000;
  redraw(r);
  assert.equal(r.tm.calls.add + r.tm.calls.get, 0);
  assert.deepEqual(r.sys.stripBlendDebug().segments, []);
});
