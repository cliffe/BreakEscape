// Room emitters can give an object rack-style blinking LEDs (`leds`), so a mission's own
// rack art (qdc_, hce_, hq_ racks) blinks like the stock racks (7.6a, m05 D16, m06 D9,
// m08 E14). Run with: node --test test/js/lighting-emitter-leds.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'lighting-leds-'));
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

globalThis.Phaser = { AUTO: 0, Scale: { NONE: 0, CENTER_BOTH: 0, FIT: 0 }, BlendModes: { ADD: 1, MULTIPLY: 2 }, Math: { Clamp: (v, a, b) => Math.max(a, Math.min(b, v)), DegToRad: (d) => d * Math.PI / 180, Vector2: class { constructor() { this.x = 0; this.y = 0; } } } };
globalThis.window = { gameState: { globalVariables: {} } };
const { LightingSystem } = await import(pathToFileURL(join(dir, 'lighting.mjs')).href);

// A stand-in for the scene's image factory: chainable no-ops
function fakeImage() {
  const img = {};
  for (const m of ['setBlendMode', 'setVisible', 'setDepth', 'setTint', 'setScale', 'setPosition', 'setAlpha']) img[m] = () => img;
  img.destroy = () => {};
  return img;
}

function system() {
  const sys = Object.create(LightingSystem.prototype);
  sys.scene = { add: { image: () => fakeImage() } };
  sys.config = {};
  return sys;
}

function stateWith(emitters) {
  const sys = system();
  const state = { roomId: 'vault', emitters: [] };
  sys.configureRoom(state, { map: { widthInPixels: 320, heightInPixels: 256 }, position: { x: 0, y: 0 } }, { emitters, panels: false });
  return { sys, state };
}

const obj = (id, key) => ({ objectId: id, scenarioData: { id }, texture: { key }, displayWidth: 48, displayHeight: 64, active: true, visible: true });

test('a room emitter with leds gives a mission rack LEDs it has no EMITTERS entry for', () => {
  const { sys, state } = stateWith({ qdc_rack_black: { color: '#6dffb0', radius: 40, intensity: 0.45, effect: 'blink', leds: 0.6 } });
  sys.buildEmitters(state, [obj('rack_a', 'qdc_rack_black1'), obj('hsm', 'qdc_hsm1')]);
  assert.equal(state.emitters.length, 1, 'the HSM has no entry and no variant');
  const e = state.emitters[0];
  assert.ok(e.leds.length >= 3, `LEDs made (${e.leds.length})`);
  assert.equal(e.ledsMax, 0.6);
  sys.resolveEmitters(state);
  assert.equal(e.def.leds, 0.6);
});

test('without leds, a room emitter on non-rack art is a glow only, as before', () => {
  const { sys, state } = stateWith({ hq_rack: { color: '#6dffb0', radius: 40 } });
  sys.buildEmitters(state, [obj('r', 'hq_rack1')]);
  assert.equal(state.emitters[0].leds.length, 0);
});

test('stock racks keep their LEDs; a variant can turn them off with leds: 0', () => {
  window.gameState.globalVariables = { power_cut: false };
  const { sys, state } = stateWith({ server: [{ condition: 'globalVars.power_cut', leds: 0, intensity: 0.1 }] });
  sys.buildEmitters(state, [obj('s1', 'server1')]);
  const e = state.emitters[0];
  assert.ok(e.leds.length > 0);
  sys.resolveEmitters(state);
  assert.equal(e.def.leds, 1, 'the EMITTERS entry');
  window.gameState.globalVariables.power_cut = true;
  sys.resolveEmitters(state);
  assert.equal(e.def.leds, 0, 'the variant hides them');
});

test('leds are clamped to 0..1 and LEDs are made for the densest state', () => {
  window.gameState.globalVariables = { busy: false };
  const { sys, state } = stateWith({ hce_hsm: [
    { condition: 'globalVars.busy', color: '#ff5050', radius: 30, leds: 5 },
    { color: '#6dffb0', radius: 30, leds: 0.3 }] });
  sys.buildEmitters(state, [obj('h', 'hce_hsm1')]);
  const e = state.emitters[0];
  assert.equal(e.ledsMax, 1);
  sys.resolveEmitters(state);
  assert.equal(e.def.leds, 0.3);
});

// ── behind-wall fade (planning_notes/behind_wall_fade/DESIGN.md 8.2): behindWallK scales the
// per-object image alphas (LED, glow, flame), outside the glow's Math.min clamp ──

function alphaImage() {
  const img = { alpha: null };
  for (const m of ['setBlendMode', 'setVisible', 'setDepth', 'setTint', 'setScale', 'setPosition']) img[m] = () => img;
  img.setAlpha = (a) => { img.alpha = a; return img; };
  img.destroy = () => {};
  return img;
}

// A lighting system that can run update() once over one room with one emitter object.
function updateRig(emitterCfg, texKey, { level = 1, objExtra = {} } = {}) {
  const sys = Object.create(LightingSystem.prototype);
  sys.scene = {
    add: { image: () => alphaImage() },
    cameras: { main: { worldView: { x: 0, y: 0, right: 320, bottom: 256 } } },
  };
  sys.config = {};
  sys.flashes = new Map();
  sys.reducedMotion = true;
  sys.tmpCentre = { x: 0, y: 0 };
  sys.lightMap = { x: 0, y: 0, width: 640, height: 512, displayWidth: 640, displayHeight: 512,
    setPosition() {}, clear() {}, beginDraw() {}, endDraw() {}, stamp() {} };
  const state = { roomId: 'vault', emitters: [], level, on: level > 0, extraLights: [] };
  sys.configureRoom(state, { map: { widthInPixels: 320, heightInPixels: 256 }, position: { x: 0, y: 0 } }, { emitters: emitterCfg, panels: false });
  sys.rooms = new Map([['vault', state]]);
  for (const m of ['subscribe', 'checkNpcMotion', 'resolveRoomVariant', 'updatePanels', 'refreshEmitters', 'stampNpcTorches', 'stampNpcGlows', 'stampDoorSpill']) sys[m] = () => {};
  sys.roomLevel = (st) => st.level;
  sys.collectFigures = () => [];
  globalThis.window.rooms = { vault: { position: { x: 0, y: 0 }, map: { widthInPixels: 320, heightInPixels: 256 } } };
  globalThis.window.player = null;
  globalThis.window.currentPlayerRoom = 'elsewhere';
  const o = { ...obj('thing', texKey), x: 100, y: 100, originX: 0, originY: 0, depth: 5, ...objExtra };
  sys.buildEmitters(state, [o]);
  sys.resolveEmitters(state);
  return { sys, state, o, e: state.emitters[0] };
}
const drawn = (r, t = 1000) => { r.sys.lastDraw = undefined; r.sys.update(t); };

test('behindWallK halves the LED alpha; an object without it is unchanged', () => {
  const r = updateRig({ qdc_rack_black: { color: '#6dffb0', radius: 40, intensity: 0.45, leds: 1 } }, 'qdc_rack_black1', { level: 0 });
  drawn(r);
  const full = r.e.leds[0].img.alpha;
  assert.ok(Math.abs(full - 0.95) < 1e-9, `0.95 at level 0 (${full})`);
  r.o.behindWallK = 0.5;
  drawn(r);
  assert.ok(Math.abs(r.e.leds[0].img.alpha - full * 0.5) < 1e-9);
  delete r.o.behindWallK;
  drawn(r);
  assert.equal(r.e.leds[0].img.alpha, full);
});

test('behindWallK halves the glow alpha, and a glow clamped to 1 comes out at exactly 0.5', () => {
  // intensity 5 in a lit room: the unclamped value is far above 1 (GLOW_BOOST), so it clamps to 1
  const r = updateRig({ qdc_rack_black: { color: '#ffffff', radius: 40, intensity: 5 } }, 'qdc_rack_black1', { level: 1 });
  drawn(r);
  assert.equal(r.e.glow.alpha, 1, 'clamped');
  r.o.behindWallK = 0.5;
  drawn(r);
  assert.equal(r.e.glow.alpha, 0.5, 'the multiplier sits outside Math.min');
  // an unclamped glow scales in proportion
  const q = updateRig({ qdc_rack_black: { color: '#ffffff', radius: 40, intensity: 0.2 } }, 'qdc_rack_black1', { level: 0 });
  drawn(q);
  const base = q.e.glow.alpha;
  assert.ok(base > 0 && base < 1);
  q.o.behindWallK = 0.5;
  drawn(q);
  assert.ok(Math.abs(q.e.glow.alpha - base * 0.5) < 1e-9);
});

test('behindWallK halves the flame tongue alpha, outside the clamp', () => {
  const r = updateRig({ qdc_brazier: { color: '#ff8030', radius: 40, intensity: 5, effect: 'fire', flames: 3 } }, 'qdc_brazier1', { level: 1 });
  drawn(r);
  assert.ok(r.e.flames.length >= 1);
  const full = r.e.flames.map(f => f.img.alpha);
  assert.ok(full.every(a => a > 0));
  r.o.behindWallK = 0.5;
  drawn(r);
  r.e.flames.forEach((f, i) => assert.ok(Math.abs(f.img.alpha - full[i] * 0.5) < 1e-9, `flame ${i}`));
});
